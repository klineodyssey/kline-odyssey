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
const SCHEMA_VERSION = "1.0.0";
const MAX_HISTORY = 120;
const FOOD_RESOURCES = new Set(["RICE", "VEGETABLE", "FRUIT", "FISH", "PIG", "CHICKEN", "EGG", "MILK"]);

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
  if (snapshotValue.food < 25 || snapshotValue.energy < 25 || snapshotValue.housing < 25) return "STRAINED";
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
    energy: 0,
    housing: 0,
    roads: 62,
    pollution: 8,
    happiness: 50,
    status: "INITIALIZING",
    revision: 0,
    formulas: {
      food: "bounded available food units",
      energy: "bounded electricity availability",
      housing: "building capacity / population",
      happiness: "health + mood + safety + employment + environment"
    },
    history: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.city_id === cityId);
  if (restored) state = { ...state, ...restored.state, history: restored.state.history?.slice(-MAX_HISTORY) ?? [] };
  const getSnapshot = () => snapshot({ runtime: "CITY_RUNTIME_ALPHA", schema_version: SCHEMA_VERSION, ...state });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });

  function refresh({ citizens = [], aiWorkers = [], economy = {}, agriculture = {}, buildings = [], world = {} } = {}) {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "City Runtime has been destroyed");
    const citizenList = values(citizens).filter((citizen) => citizen.life_state !== "DEAD");
    const workerList = values(aiWorkers);
    const population = citizenList.length;
    const employedCitizenIds = new Set(citizenList.filter((citizen) => ![null, "", "NOT_APPLICABLE", "UNEMPLOYED"].includes(citizen.occupation)).map((citizen) => citizen.life_id));
    const employed = Math.min(population, employedCitizenIds.size + workerList.filter((worker) => worker.current_status === "WORKING").length);
    const unemployed = Math.max(0, population - employed);
    const employmentRate = population ? (employed / population) * 100 : 0;
    const foodUnits = resourceTotal(economy, (resource) => FOOD_RESOURCES.has(resource))
      + Object.entries(agriculture?.warehouse ?? {}).filter(([resource]) => FOOD_RESOURCES.has(resource)).reduce((sum, [, quantity]) => sum + Number(quantity), 0);
    const energyUnits = resourceTotal(economy, (resource) => resource === "ELECTRICITY");
    const buildingList = values(buildings);
    const housingCapacity = buildingList.reduce((sum, building) => sum + Number(building.capacity?.population ?? building.capacity?.occupants ?? building.capacity ?? 2), 0);
    const factoryCount = (world?.parcels ?? []).filter((parcel) => parcel.land_use === "FACTORY").length;
    const roads = clamp(58 + Math.min(22, (world?.parcels ?? []).length * 1.5));
    const pollution = clamp(7 + factoryCount * 12 + workerList.reduce((sum, worker) => sum + Number(worker.build_hours ?? 0) * 0.05, 0));
    const average = (key, fallback) => citizenList.length
      ? citizenList.reduce((sum, citizen) => sum + Number(citizen.needs?.[key] ?? fallback), 0) / citizenList.length
      : fallback;
    const food = clamp(foodUnits / Math.max(1, population) * 8);
    const energy = clamp(energyUnits / Math.max(1, population) * 6);
    const housing = clamp(housingCapacity / Math.max(1, population) * 100);
    const happiness = clamp(
      average("health", 75) * 0.2
      + average("mood", 65) * 0.25
      + average("safety", 70) * 0.15
      + employmentRate * 0.15
      + food * 0.1
      + housing * 0.1
      + (100 - pollution) * 0.05
    );

    Object.assign(state, {
      population,
      employed,
      unemployed,
      employment_rate: Number(employmentRate.toFixed(1)),
      unemployment_rate: Number((population ? (unemployed / population) * 100 : 0).toFixed(1)),
      food: Number(food.toFixed(1)),
      energy: Number(energy.toFixed(1)),
      housing: Number(housing.toFixed(1)),
      roads: Number(roads.toFixed(1)),
      pollution: Number(pollution.toFixed(1)),
      happiness: Number(happiness.toFixed(1)),
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
    for (const key of ["employment_rate", "unemployment_rate", "food", "energy", "housing", "roads", "pollution", "happiness"]) {
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
