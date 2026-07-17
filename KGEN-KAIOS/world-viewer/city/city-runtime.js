import {
  boundedPush,
  clamp,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "CityRuntime";
const SCHEMA_VERSION = "2.0.0";
const MAX_HISTORY = 120;
const FOOD_RESOURCES = new Set(["RICE", "VEGETABLE", "FRUIT", "FISH", "PIG", "CHICKEN", "EGG", "MILK", "CORN", "CABBAGE", "HONEY", "MUSHROOM"]);

function values(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function resourceTotal(economy, filter) {
  let total = 0;
  for (const inventory of Object.values(economy?.inventories ?? {})) {
    for (const [resource, quantity] of Object.entries(inventory ?? {})) if (filter(resource)) total += Number(quantity) || 0;
  }
  for (const listing of economy?.listings ?? []) if (filter(listing.resource_id)) total += Number(listing.stock) || 0;
  return total;
}

function statusFor(snapshotValue) {
  if (snapshotValue.food < 25 || snapshotValue.water < 25 || snapshotValue.energy < 25 || snapshotValue.housing < 25) return "STRAINED";
  if (snapshotValue.pollution > 70 || snapshotValue.unemployment_rate > 45) return "AT_RISK";
  if (snapshotValue.happiness >= 70) return "THRIVING";
  return "STABLE";
}

export function createCityRuntime({
  cityId = "city-hsinchu-overlay",
  label = "Hsinchu City Overlay",
  storage,
  storageKey = "kaios.world-viewer.city.v1"
} = {}) {
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    city_id: cityId,
    label,
    synthetic: true,
    source_of_truth: false,
    population: 0,
    employed: 0,
    unemployed: 0,
    employment_rate: 0,
    unemployment_rate: 0,
    food: 0,
    water: 0,
    energy: 0,
    housing: 0,
    roads: 62,
    pollution: 8,
    happiness: 50,
    industry: 0,
    supply_chain: 0,
    ecology: 0,
    ecology_recovery: 0,
    education: 0,
    logistics: 0,
    settlement_health: 0,
    company_health: 0,
    status: "INITIALIZING",
    revision: 0,
    formulas: {
      food: "bounded available food units",
      water: "bounded available water units",
      energy: "bounded electricity availability",
      housing: "building capacity / population",
      education: "population education index",
      logistics: "route availability minus pollution constraints",
      happiness: "health + mood + safety + employment + environment"
    },
    history: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.city_id === cityId);
  if (restored) state = { ...state, ...restored.state, history: restored.state.history?.slice(-MAX_HISTORY) ?? [] };
  const getSnapshot = () => snapshot({ runtime: "CITY_RUNTIME_ALPHA", schema_version: SCHEMA_VERSION, ...state });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });

  function refresh({ citizens = [], aiWorkers = [], economy = {}, agriculture = {}, production = {}, company = {}, ecosystem = {}, population = {}, logistics = {}, settlement = {}, buildings = [], world = {} } = {}) {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "City Runtime has been destroyed");
    const citizenList = values(citizens).filter((citizen) => citizen.life_state !== "DEAD");
    const workerList = values(aiWorkers);
    const populationValue = Number(population?.metrics?.population ?? citizenList.length);
    const employedCitizenIds = new Set(citizenList.filter((citizen) => ![null, "", "NOT_APPLICABLE", "UNEMPLOYED"].includes(citizen.occupation)).map((citizen) => citizen.life_id));
    const reportedEmployment = Number(population?.metrics?.employment_rate);
    const employed = Number.isFinite(reportedEmployment)
      ? Math.min(populationValue, Math.round(populationValue * reportedEmployment / 100))
      : Math.min(populationValue, employedCitizenIds.size + workerList.filter((worker) => worker.current_status === "WORKING").length);
    const unemployed = Math.max(0, populationValue - employed);
    const employmentRate = populationValue ? (employed / populationValue) * 100 : 0;
    const foodUnits = resourceTotal(economy, (resource) => FOOD_RESOURCES.has(resource))
      + Object.entries(agriculture?.warehouse ?? {}).filter(([resource]) => FOOD_RESOURCES.has(resource)).reduce((sum, [, quantity]) => sum + Number(quantity), 0);
    const energyUnits = resourceTotal(economy, (resource) => resource === "ELECTRICITY");
    const waterUnits = resourceTotal(economy, (resource) => resource === "WATER");
    const buildingList = values(buildings);
    const housingCapacity = buildingList.reduce((sum, building) => sum + Number(building.capacity?.population ?? building.capacity?.occupants ?? building.capacity ?? 2), 0);
    const factoryCount = (world?.parcels ?? []).filter((parcel) => parcel.land_use === "FACTORY").length;
    const roads = clamp(58 + Math.min(22, (world?.parcels ?? []).length * 1.5));
    const industry = production?.factory?.status === "READY" ? clamp(production.factory.health) : clamp((production?.factory?.health ?? 0) * 0.5);
    const supplyNodes = values(production?.supply_nodes);
    const supplyChain = supplyNodes.length ? supplyNodes.filter(({ status }) => status === "AVAILABLE").length / supplyNodes.length * 100 : 0;
    const ecology = clamp(ecosystem?.average_health ?? 0);
    const productionPollution = Math.min(18, Number(production?.factory?.total_produced ?? 0) * 0.2);
    const localPollution = 7 + factoryCount * 12 + productionPollution + workerList.reduce((sum, worker) => sum + Number(worker.build_hours ?? 0) * 0.05, 0);
    const pollution = clamp(Math.max(localPollution, Number(logistics?.pollution ?? 0)));
    const average = (key, fallback) => citizenList.length
      ? citizenList.reduce((sum, citizen) => sum + Number(citizen.needs?.[key] ?? fallback), 0) / citizenList.length
      : fallback;
    const food = clamp(foodUnits / Math.max(1, populationValue) * 8);
    const water = clamp(waterUnits / Math.max(1, populationValue) * 8);
    const energy = clamp(energyUnits / Math.max(1, populationValue) * 6);
    const housing = clamp(housingCapacity / Math.max(1, populationValue) * 100);
    const education = clamp(population?.metrics?.education_index ?? average("knowledge", 50));
    const logisticsScore = clamp(100 - Number(logistics?.pollution ?? 0) * 0.55 - (logistics?.status === "ECOLOGY_CRITICAL" ? 25 : 0));
    const settlementHealth = (settlement?.asset_requests ?? []).every(({ executable, status }) => executable === false && status === "PENDING_OFFICIAL_SETTLEMENT") ? 100 : 35;
    const happiness = clamp(
      average("health", 75) * 0.2
      + average("mood", 65) * 0.25
      + average("safety", 70) * 0.15
      + employmentRate * 0.15
      + food * 0.1
      + water * 0.05
      + housing * 0.1
      + education * 0.05
      + (100 - pollution) * 0.05
    );

    Object.assign(state, {
      population: populationValue,
      employed,
      unemployed,
      employment_rate: Number(employmentRate.toFixed(1)),
      unemployment_rate: Number((populationValue ? (unemployed / populationValue) * 100 : 0).toFixed(1)),
      food: Number(food.toFixed(1)),
      water: Number(water.toFixed(1)),
      energy: Number(energy.toFixed(1)),
      housing: Number(housing.toFixed(1)),
      roads: Number(roads.toFixed(1)),
      pollution: Number(pollution.toFixed(1)),
      happiness: Number(happiness.toFixed(1)),
      industry: Number(industry.toFixed(1)),
      supply_chain: Number(supplyChain.toFixed(1)),
      ecology: Number(ecology.toFixed(1)),
      ecology_recovery: Number(clamp(logistics?.ecology_recovery ?? ecology).toFixed(1)),
      education: Number(education.toFixed(1)),
      logistics: Number(logisticsScore.toFixed(1)),
      settlement_health: Number(settlementHealth.toFixed(1)),
      company_health: Number(clamp(company?.company?.health ?? 0).toFixed(1)),
      revision: state.revision + 1
    });
    state.status = statusFor(state);
    boundedPush(state.history, {
      revision: state.revision,
      event_id: stableId("city", state.revision),
      population: state.population,
      food: state.food,
      energy: state.energy,
      happiness: state.happiness,
      status: state.status
    }, MAX_HISTORY);
    persist();
    notifier.emit("CITY_REFRESHED", { revision: state.revision });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    for (const key of ["employment_rate", "unemployment_rate", "food", "water", "energy", "housing", "roads", "pollution", "happiness", "industry", "supply_chain", "ecology", "ecology_recovery", "education", "logistics", "settlement_health", "company_health"]) {
      if (!Number.isFinite(state[key]) || state[key] < 0 || state[key] > 100) issues.push(`invalid ${key}`);
    }
    if (state.employed + state.unemployed !== state.population) issues.push("employment population mismatch");
    if (state.history.length > MAX_HISTORY) issues.push("history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CITY_RUNTIME_ALPHA", derived_only: true, issues });
  }

  return Object.freeze({
    getSnapshot,
    refresh,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}
