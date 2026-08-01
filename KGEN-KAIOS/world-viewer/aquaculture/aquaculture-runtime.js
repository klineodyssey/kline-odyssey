import { createCausalWorldRuntime } from "../causal-runtime/causal-world-runtime.js";
import { createReproductionEcologyRuntimeV1 } from "../ecosystem/ecosystem-runtime.js";
import {
  AQUACULTURE_POPULATION_CONTRACT,
  AQUACULTURE_ROOT_INVARIANTS,
  validatePopulationContract
} from "../../../KAIOS/life/aquaculture/aquaculture-spec-validator.mjs";

const RUNTIME = "KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 5000;
const MAX_ACTIONS = 10000;
const EPSILON = 0.001;
const INITIAL_CASH = 150000;

export const CONSTRUCTION_STAGES = Object.freeze([
  "SITE_SURVEY", "DESIGN", "PERMIT_SIMULATION", "SITE_CLEARING", "EXCAVATION", "EMBANKMENT",
  "LINING_OR_SOIL_COMPACTION", "INLET_INSTALLATION", "OUTLET_INSTALLATION", "DRAINAGE_INSTALLATION",
  "AERATION_INFRASTRUCTURE", "ELECTRICAL_CONNECTION", "WATER_FILLING", "LEAK_TEST",
  "WATER_STABILIZATION", "INSPECTION", "READY_FOR_STOCKING"
]);

const STAGE_REQUIREMENTS = Object.freeze({
  SITE_SURVEY: { hours: 8, roles: ["SURVEYOR"], equipment: ["SURVEY_TOOL"], materials: {}, energy: 2 },
  DESIGN: { hours: 12, roles: ["SITE_SUPERVISOR"], equipment: ["SURVEY_TOOL"], materials: {}, energy: 3 },
  PERMIT_SIMULATION: { hours: 4, roles: ["SITE_SUPERVISOR"], equipment: [], materials: {}, energy: 1 },
  SITE_CLEARING: { hours: 24, roles: ["GENERAL_LABORER", "SAFETY_OFFICER"], equipment: ["SHOVEL"], materials: {}, energy: 8 },
  EXCAVATION: { hours: 48, roles: ["EXCAVATOR_OPERATOR", "SAFETY_OFFICER"], equipment: ["EXCAVATOR"], materials: {}, energy: 80 },
  EMBANKMENT: { hours: 36, roles: ["GENERAL_LABORER", "SITE_SUPERVISOR"], equipment: ["COMPACTOR"], materials: { SOIL: 200, GRAVEL: 40 }, energy: 45 },
  LINING_OR_SOIL_COMPACTION: { hours: 28, roles: ["GENERAL_LABORER"], equipment: ["COMPACTOR"], materials: { LINING: 20 }, energy: 30 },
  INLET_INSTALLATION: { hours: 16, roles: ["PIPE_INSTALLER"], equipment: ["PUMP", "PIPE"], materials: { PIPE: 10 }, energy: 18 },
  OUTLET_INSTALLATION: { hours: 16, roles: ["PIPE_INSTALLER"], equipment: ["PIPE"], materials: { PIPE: 10 }, energy: 14 },
  DRAINAGE_INSTALLATION: { hours: 18, roles: ["PIPE_INSTALLER"], equipment: ["SHOVEL", "PIPE"], materials: { GRAVEL: 15, PIPE: 8 }, energy: 16 },
  AERATION_INFRASTRUCTURE: { hours: 14, roles: ["ELECTRICIAN", "AQUACULTURE_WORKER"], equipment: ["AERATOR"], materials: { ELECTRICAL_COMPONENTS: 6 }, energy: 12 },
  ELECTRICAL_CONNECTION: { hours: 10, roles: ["ELECTRICIAN", "SAFETY_OFFICER"], equipment: ["ELECTRICAL_PANEL"], materials: { ELECTRICAL_COMPONENTS: 8 }, energy: 5 },
  WATER_FILLING: { hours: 24, roles: ["AQUACULTURE_WORKER"], equipment: ["PUMP"], materials: {}, energy: 60 },
  LEAK_TEST: { hours: 12, roles: ["WATER_QUALITY_TECHNICIAN"], equipment: ["WATER_TEST_KIT"], materials: {}, energy: 4 },
  WATER_STABILIZATION: { hours: 48, roles: ["WATER_QUALITY_TECHNICIAN"], equipment: ["WATER_TEST_KIT", "AERATOR"], materials: {}, energy: 35 },
  INSPECTION: { hours: 8, roles: ["FISH_HEALTH_INSPECTOR_SIMULATION", "SITE_SUPERVISOR"], equipment: ["WATER_TEST_KIT"], materials: {}, energy: 3 },
  READY_FOR_STOCKING: { hours: 1, roles: ["SITE_SUPERVISOR"], equipment: [], materials: {}, energy: 1 }
});

const clone = (value) => structuredClone(value);
const round = (value, digits = 3) => Number(Number(value).toFixed(digits));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const serializableInput = (value) => {
  if (typeof value === "number" && !Number.isFinite(value)) return `NONFINITE_INPUT:${String(value)}`;
  if (Array.isArray(value)) return value.map(serializableInput);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializableInput(item)]));
  return value;
};
const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
function hash(value) {
  let result = 2166136261;
  for (const char of stableStringify(value)) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); }
  return `fnv1a-${(result >>> 0).toString(16).padStart(8, "0")}`;
}

function defaultWorkers() {
  return ["SURVEYOR", "SITE_SUPERVISOR", "EXCAVATOR_OPERATOR", "GENERAL_LABORER", "PIPE_INSTALLER", "ELECTRICIAN", "WATER_QUALITY_TECHNICIAN", "AQUACULTURE_WORKER", "FISH_HEALTH_INSPECTOR_SIMULATION", "HARVEST_WORKER", "COLD_STORAGE_OPERATOR", "TRUCK_DRIVER", "SAFETY_OFFICER"].map((role, index) => ({
    life_id: `LIFE-AQUA-WORKER-${String(index + 1).padStart(3, "0")}`, body_instance_id: `BODY-AQUA-WORKER-${String(index + 1).padStart(3, "0")}`,
    role, current_location: "LAND-KAIOS-FISHPOND-001", current_activity: "OFF_DUTY", activity_start: null, activity_end: null,
    shift: "DAY", shift_hours: 8, skill: role, stamina: 100, health: 100, availability: true, travel_time_hours: 0,
    wage: 22 + index, safety_status: "CLEARED_SIMULATION", rest_state: "RESTED", last_work_end: 0, time_log: [], event_log: []
  }));
}

function defaultState(seed) {
  const ecology = createReproductionEcologyRuntimeV1({ seed: `${seed}-ECOLOGY` });
  ecology.createEcosystem();
  ecology.pause();
  const ecologyState = ecology.getState();
  return {
    schema_version: SCHEMA_VERSION,
    runtime: RUNTIME,
    mode: "LOCAL_DETERMINISTIC_SIMULATION",
    seed,
    simulation_time: 0,
    revision: 0,
    status: "PAUSED",
    authority: "NO_PRODUCTION_AUTHORITY",
    land: {
      land_parcel_id: "LAND-KAIOS-FISHPOND-001", usage_right: "SIMULATED_LAND_USAGE_RIGHT", area_m2: 12000,
      elevation_m: 18, slope_percent: 1.5, soil_type: "CLAY_LOAM", soil_permeability: 0.22, groundwater_risk: 0.2,
      flood_risk: 0.25, water_source_distance_m: 300, road_access: true, electricity_access: true,
      environmental_capacity: 0.82, pollution_risk: 0.12
    },
    pond: {
      pond_id: "POND-KAIOS-001", habitat_id: "HABITAT-FISHPOND-V1", area_m2: 5000, depth_m: 1.5,
      capacity_l: 500000, water_volume_l: 0, status: "PLANNED", water_source: "RIVER", inlet_installed: false,
      outlet_installed: false, aerator_installed: false, cold_storage_installed: false, aeration_state: "OFF",
      dead_biomass_kg: 0, waste_pool_kg: 0, treatment_output_kg: 0, effluent_pool_l: 0
    },
    construction: { project_id: "AQUA-CONSTRUCTION-001", stage: CONSTRUCTION_STAGES[0], stage_index: 0, completed_stages: [], progress_hours: 0, blocked_reason: null },
    workers: defaultWorkers(),
    equipment: Object.fromEntries(["SURVEY_TOOL", "SHOVEL", "EXCAVATOR", "TRUCK", "COMPACTOR", "PUMP", "PIPE", "AERATOR", "ELECTRICAL_PANEL", "WATER_TEST_KIT", "COLD_STORAGE_UNIT"].map((item) => [item, 1])),
    materials: { SOIL: 500, GRAVEL: 150, LINING: 50, PIPE: 40, ELECTRICAL_COMPONENTS: 30, PACKAGING: 200, ICE: 500 },
    energy: { electricity_kwh: 1500, backup_kwh: 200, fuel_l: 500 },
    water_sources: [{ id: "WATER-SOURCE-RIVER-001", type: "RIVER", volume_l: 2000000, flow_lph: 50000, temperature_c: 26, dissolved_oxygen_mg_l: 7, salinity_ppt: 1, ph: 7.4, pollution_index: 0.08, sediment: 0.1, pathogens_proxy: 0.05, reliability: 0.9, cost_per_l: 0.00002, rights: "SIMULATED_WATER_USAGE_RIGHT", seasonal_variation: 0.15, available: true }],
    water_quality: { state: "UNFIT_FOR_STOCKING", temperature_c: 26, dissolved_oxygen_mg_l: 7, ph: 7.4, salinity_ppt: 1, ammonia_proxy: 0.05, nitrite_proxy: 0.03, nitrate_proxy: 0.08, turbidity: 0.1, organic_load: 0.05, pollution_index: 0.08, pathogen_risk_proxy: 0.05, last_balance: null },
    populations: [],
    feed: { inventory_kg: 1200, status: "AVAILABLE", quality: 0.95, delivered_kg: 1200, consumed_kg: 0, waste_kg: 0 },
    harvests: [], inventory: [], orders: [], cold_chain: [],
    routes: [],
    enterprise: {
      enterprise_id: "ENTERPRISE-KAIOS-FISHPOND-001", currency: "SIMULATED_CURRENCY", status: "PLANNING",
      accounts: { cash: INITIAL_CASH, expenses: 0, revenue: 0, receivables: 0, payables: 0, debt: 0, inventory_value: 0 },
      ledger: [], assets: [
        { asset_id: "LAND-KAIOS-FISHPOND-001", type: "SIMULATED_LAND_USAGE_RIGHT", disposition: "OPERATING" },
        { asset_id: "POND-KAIOS-001", type: "POND_INFRASTRUCTURE", disposition: "PLANNED" },
        { asset_id: "AQUA-EQUIPMENT-POOL-001", type: "EQUIPMENT", disposition: "OPERATING" }
      ], liabilities: 0, profit_or_loss: 0
    },
    rights: {
      LAND_OWNER: "SIMULATED-LAND-CUSTODIAN", LAND_USER: "ENTERPRISE-KAIOS-FISHPOND-001", POND_OPERATOR: "ENTERPRISE-KAIOS-FISHPOND-001",
      WATER_USAGE_RIGHT: "SIMULATED_WATER_USAGE_RIGHT", FISH_STOCK_OWNER: "ENTERPRISE-KAIOS-FISHPOND-001", SHRIMP_STOCK_OWNER: "ENTERPRISE-KAIOS-FISHPOND-001",
      EQUIPMENT_OWNER: "SIMULATED-EQUIPMENT-COOP", WORKER: "SEPARATE_LIFE_IDS", CUSTODIAN: "SIMULATED-POND-CUSTODIAN",
      HARVEST_RIGHT: "ENTERPRISE-KAIOS-FISHPOND-001", SALES_RIGHT: "SIMULATED-SALES-CONTRACT", TRANSPORT_OPERATOR: "SIMULATED-CARRIER",
      INSPECTOR_SIMULATION: "KAIOS_INSPECTION_PROXY", authority: "SIMULATED_RIGHTS_ONLY"
    },
    ecology_binding: { runtime: ecologyState.runtime, habitat_id: "HABITAT-FISHPOND-V1", simulation_only: true, authority: "NO_PRODUCTION_AUTHORITY" },
    events: [], action_log: [],
    boundaries: {
      simulation_only: true, wallet: "NONE", real_kgen: "NO_REAL_KGEN", onchain_transfer: false, real_bioengineering: false,
      real_food_safety_certification: false, real_legal_effect: false, production_authority: false,
      uncontrolled_reproduction: false, mutation_endpoints: false, maximum_population: 500
    }
  };
}

function stateProjection(state) {
  const copy = clone(state);
  delete copy.events;
  delete copy.action_log;
  delete copy.revision;
  return copy;
}

const numericValues = (value) => value && typeof value === "object"
  ? Object.values(value).flatMap(numericValues)
  : typeof value === "number" ? [value] : [];

function operationalNumericIssue(candidate) {
  if (numericValues(candidate).some((value) => !Number.isFinite(value))) return "NONFINITE_NUMERIC_INPUT";
  const nonnegativeGroups = [candidate.land, candidate.pond, candidate.construction, candidate.equipment, candidate.materials, candidate.energy, candidate.water_quality, ...candidate.workers, ...candidate.water_sources, ...candidate.inventory, ...candidate.harvests, ...candidate.cold_chain, ...candidate.routes];
  if (nonnegativeGroups.some((group) => numericValues(group).some((value) => value < 0))) return "NEGATIVE_OPERATIONAL_INPUT";
  return null;
}

function siteBlock(state) {
  const land = state.land;
  if (land.usage_right !== "SIMULATED_LAND_USAGE_RIGHT") return "NO_LAND_RIGHT";
  if (land.area_m2 < state.pond.area_m2) return "INSUFFICIENT_AREA";
  if (land.slope_percent > 5) return "SLOPE_TOO_HIGH";
  if (!["CLAY", "CLAY_LOAM", "LINED_SOIL"].includes(land.soil_type)) return "SOIL_NOT_COMPATIBLE";
  if (!state.water_sources.some((source) => source.available && source.volume_l > 0)) return "NO_WATER_SOURCE";
  if (!land.road_access) return "NO_ACCESS_ROUTE";
  if (land.flood_risk > 0.7) return "FLOOD_RISK_UNMITIGATED";
  if (land.pollution_risk > 0.6) return "POLLUTION_RISK_TOO_HIGH";
  return null;
}

function stageBlock(state) {
  const site = siteBlock(state);
  if (site) return site;
  const requirement = STAGE_REQUIREMENTS[state.construction.stage];
  if (!requirement) return "STAGE_COMPLETE";
  for (const role of requirement.roles) {
    const worker = state.workers.find((candidate) => candidate.role === role);
    if (!worker || worker.health <= 30) return "BLOCKED_LABOR";
    if (!worker.availability && worker.current_activity === "OFF_DUTY") return "BLOCKED_LABOR";
    if (!worker.availability || worker.current_activity !== "OFF_DUTY") return "ROLE_TIME_CONFLICT";
    if (worker.last_work_end > state.simulation_time) return "SHIFT_OVERLAP";
    if (worker.stamina < 10 || worker.rest_state === "REST_REQUIRED") return "REST_REQUIREMENT_CONFLICT";
  }
  if (requirement.equipment.some((item) => (state.equipment[item] ?? 0) < 1)) return "BLOCKED_EQUIPMENT";
  if (Object.entries(requirement.materials).some(([item, amount]) => (state.materials[item] ?? 0) < amount)) return "BLOCKED_MATERIAL";
  if (state.energy.electricity_kwh < requirement.energy) return "BLOCKED_ENERGY";
  if (state.construction.stage === "WATER_FILLING" && !state.water_sources.some((source) => source.available && source.volume_l >= state.pond.capacity_l)) return "NO_WATER_SOURCE";
  return null;
}

function updateWaterState(state) {
  const quality = state.water_quality;
  quality.state = state.pond.water_volume_l <= 0 ? "UNFIT_FOR_STOCKING"
    : quality.dissolved_oxygen_mg_l < 3 ? "LOW_OXYGEN"
      : quality.ammonia_proxy > 0.65 ? "HIGH_AMMONIA"
        : quality.turbidity > 0.7 ? "HIGH_TURBIDITY"
          : quality.pollution_index > 0.6 ? "POLLUTED"
            : quality.temperature_c < 18 || quality.temperature_c > 34 ? "TEMPERATURE_STRESS"
              : quality.salinity_ppt < 0 || quality.salinity_ppt > 35 ? "SALINITY_STRESS"
                : quality.pathogen_risk_proxy > 0.65 ? "DISEASE_RISK" : "STABLE";
  if (quality.state === "LOW_OXYGEN") state.pond.aeration_state = "EMERGENCY_AERATION_REQUIRED";
}

export function createFishpondAquacultureRuntimeV1({ seed = "KAIOS-AQUACULTURE-V1-001" } = {}) {
  let state = defaultState(String(seed));
  let destroyed = false;
  const listeners = new Set();
  const usable = () => { if (destroyed) throw new Error("RUNTIME_DESTROYED"); };
  const getState = () => clone(state);
  const emit = () => listeners.forEach((listener) => listener(getState()));

  function record(command, args, actor, result, previousStateHash) {
    state.revision += 1;
    const nextStateHash = hash(stateProjection(state));
    const event = {
      event_id: `AQUA-EVENT-${String(state.revision).padStart(5, "0")}`, enterprise_id: state.enterprise.enterprise_id,
      pond_id: state.pond.pond_id, land_id: state.land.land_parcel_id, habitat_id: state.pond.habitat_id,
      population_id: result.population_id ?? null, life_id_or_species_id: result.species_id ?? actor,
      simulation_time: state.simulation_time, location: state.land.land_parcel_id, event_type: command, actor,
      inputs: serializableInput(args), outputs: clone(result.outputs ?? {}), water_delta: result.water_delta ?? 0,
      oxygen_delta: result.oxygen_delta ?? 0, feed_delta: result.feed_delta ?? 0, population_delta: result.population_delta ?? 0,
      biomass_delta: result.biomass_delta ?? 0, energy_delta: result.energy_delta ?? 0, inventory_delta: result.inventory_delta ?? 0,
      cash_delta: result.cash_delta ?? 0, health_delta: result.health_delta ?? 0, pollution_delta: result.pollution_delta ?? 0,
      previous_state_hash: previousStateHash, next_state_hash: nextStateHash, seed: state.seed,
      status: result.status ?? "COMPLETED", reason: result.reason ?? null
    };
    state.events.push(event);
    if (state.events.length > MAX_EVENTS) state.events.shift();
    state.action_log.push({ action_id: `AQUA-ACTION-${String(state.action_log.length + 1).padStart(5, "0")}`, simulation_time: state.simulation_time, command, args: serializableInput(args), status: event.status, reason: event.reason });
    emit();
    return clone({ ...result, event });
  }

  function execute(command, args, actor, mutation) {
    usable();
    if (state.action_log.length >= MAX_ACTIONS) throw new Error("ACTION_LOG_LIMIT_REACHED");
    const before = hash(stateProjection(state));
    const snapshot = clone(state);
    let result = mutation() ?? { status: "COMPLETED" };
    const numericIssue = operationalNumericIssue(state);
    if (numericIssue) { state = snapshot; result = { status: "BLOCKED", reason: numericIssue }; }
    return record(command, args, actor, result, before);
  }

  function post(event, debitAccount, creditAccount, amount, cashDelta, payableDelta = 0) {
    const value = round(amount, 2);
    if (!(value > 0)) return;
    const entry = { entry_id: `AQUA-TX-${String(state.enterprise.ledger.length + 1).padStart(5, "0")}`, simulation_time: state.simulation_time, event, debit_account: debitAccount, credit_account: creditAccount, debit_amount: value, credit_amount: value, cash_delta: round(cashDelta, 2), payable_delta: round(payableDelta, 2), source_event: event, simulation_only: true };
    entry.balanced = Math.abs(entry.debit_amount - entry.credit_amount) <= EPSILON;
    state.enterprise.ledger.push(entry);
  }
  function charge(event, amount) {
    const value = round(amount, 2);
    const cashPaid = Math.min(state.enterprise.accounts.cash, value);
    state.enterprise.accounts.cash = round(state.enterprise.accounts.cash - cashPaid, 2);
    state.enterprise.accounts.expenses = round(state.enterprise.accounts.expenses + value, 2);
    const unpaid = round(value - cashPaid, 2);
    if (unpaid > 0) { state.enterprise.accounts.payables = round(state.enterprise.accounts.payables + unpaid, 2); state.enterprise.liabilities = round(state.enterprise.liabilities + unpaid, 2); }
    post(event, "EXPENSE", unpaid > 0 ? "CASH_AND_PAYABLES" : "CASH", value, -cashPaid, unpaid);
    state.enterprise.profit_or_loss = round(state.enterprise.accounts.revenue - state.enterprise.accounts.expenses, 2);
    return -cashPaid;
  }
  function recognizeRevenue(event, amount) {
    const value = round(amount, 2);
    state.enterprise.accounts.cash = round(state.enterprise.accounts.cash + value, 2);
    state.enterprise.accounts.revenue = round(state.enterprise.accounts.revenue + value, 2);
    post(event, "CASH", "REVENUE", value, value);
    state.enterprise.profit_or_loss = round(state.enterprise.accounts.revenue - state.enterprise.accounts.expenses, 2);
    return value;
  }

  function start() { return execute("START_RUNTIME", {}, "SIMULATION_OPERATOR", () => { state.status = "RUNNING"; return { status: "RUNNING" }; }); }
  function pause() { return execute("PAUSE_RUNTIME", {}, "SIMULATION_OPERATOR", () => { state.status = "PAUSED"; return { status: "PAUSED" }; }); }
  function resume() { return execute("RESUME_RUNTIME", {}, "SIMULATION_OPERATOR", () => { state.status = "RUNNING"; return { status: "RUNNING" }; }); }
  function stop() { return execute("STOP_RUNTIME", {}, "SIMULATION_OPERATOR", () => { state.status = "STOPPED"; return { status: "STOPPED" }; }); }

  function selectLand(overrides = {}) {
    return execute("SELECT_LAND", overrides, "POND_OPERATOR", () => {
      Object.assign(state.land, clone(overrides));
      const reason = siteBlock(state);
      return { status: reason ? "BLOCKED" : "COMPLETED", reason, outputs: { land_parcel_id: state.land.land_parcel_id } };
    });
  }

  function designPond(overrides = {}) {
    return execute("DESIGN_POND", overrides, "SITE_SUPERVISOR", () => {
      Object.assign(state.pond, clone(overrides));
      const reason = siteBlock(state);
      if (!reason) state.enterprise.status = "CONSTRUCTION";
      return { status: reason ? "BLOCKED" : "COMPLETED", reason, outputs: { pond_id: state.pond.pond_id } };
    });
  }

  function setResource(category, key, value) {
    return execute("SET_SIMULATION_RESOURCE", { category, key, value }, "SIMULATION_OPERATOR", () => {
      if (!(["equipment", "materials", "energy"].includes(category)) || !Object.hasOwn(state[category], key)) return { status: "BLOCKED", reason: "UNKNOWN_SIMULATION_RESOURCE" };
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) return { status: "BLOCKED", reason: "INVALID_RESOURCE_AMOUNT" };
      state[category][key] = amount;
      return { status: "COMPLETED", outputs: { category, key, value: amount } };
    });
  }

  function setWorkerAvailability(role, available) {
    return execute("SET_WORKER_AVAILABILITY", { role, available }, "SIMULATION_OPERATOR", () => {
      const worker = state.workers.find((candidate) => candidate.role === role);
      if (!worker) return { status: "BLOCKED", reason: "MISSING_REQUIRED_SKILL" };
      worker.availability = Boolean(available);
      return { status: "COMPLETED", outputs: { role, available: worker.availability } };
    });
  }

  function setWaterSourceAvailability(sourceId, available, volumeL = null) {
    return execute("SET_WATER_SOURCE_AVAILABILITY", { sourceId, available, volumeL }, "SIMULATION_OPERATOR", () => {
      const source = state.water_sources.find((candidate) => candidate.id === sourceId);
      if (!source) return { status: "BLOCKED", reason: "NO_WATER_SOURCE" };
      source.available = Boolean(available);
      if (volumeL !== null) {
        const volume = Number(volumeL);
        if (!Number.isFinite(volume) || volume < 0) return { status: "BLOCKED", reason: "INVALID_WATER_VOLUME" };
        source.volume_l = volume;
      }
      return { status: "COMPLETED", outputs: { source_id: sourceId, available: source.available, volume_l: source.volume_l } };
    });
  }

  function replenishFeed(kilograms, quality = 0.95) {
    return execute("REPLENISH_FEED", { kilograms, quality }, "SUPPLY_CHAIN", () => {
      const amount = Number(kilograms), feedQuality = Number(quality);
      if (!Number.isFinite(amount) || !(amount > 0) || !Number.isFinite(feedQuality) || feedQuality < 0 || feedQuality > 1) return { status: "BLOCKED", reason: "INVALID_FEED_DELIVERY" };
      state.feed.inventory_kg = round(state.feed.inventory_kg + amount); state.feed.delivered_kg = round(state.feed.delivered_kg + amount); state.feed.quality = feedQuality;
      state.feed.status = feedQuality <= 0.3 ? "CONTAMINATED_SIMULATION" : "AVAILABLE";
      return { status: "COMPLETED", feed_delta: amount, cash_delta: charge("FEED_DELIVERY", amount * 1.35), outputs: { inventory_kg: state.feed.inventory_kg } };
    });
  }

  function applyOperatingCost(costType, amount) {
    return execute("APPLY_OPERATING_COST", { costType, amount }, "ENTERPRISE_ACCOUNTING", () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || !(value > 0)) return { status: "BLOCKED", reason: "INVALID_COST" };
      const cashDelta = charge(String(costType || "OPERATING_COST"), value);
      updateBusinessState();
      return { status: "COMPLETED", cash_delta: cashDelta, outputs: { enterprise_status: state.enterprise.status } };
    });
  }

  function advanceConstruction(hours = 72) {
    return execute("ADVANCE_POND_CONSTRUCTION", { hours }, "AQUACULTURE_CONSTRUCTION_TEAM", () => {
      if (state.status !== "RUNNING") return { status: "BLOCKED", reason: "RUNTIME_PAUSED" };
      const reason = stageBlock(state);
      if (reason) { state.construction.blocked_reason = reason; return { status: "BLOCKED", reason, outputs: { stage: state.construction.stage } }; }
      const requirement = STAGE_REQUIREMENTS[state.construction.stage];
      const step = clamp(Number(hours) || 0, 0, 168);
      if (!(step > 0)) return { status: "BLOCKED", reason: "TIME_REQUIRED" };
      const assignedWorkers = requirement.roles.map((role) => state.workers.find((worker) => worker.role === role));
      const travelHours = assignedWorkers.map((worker) => worker.current_location === state.land.land_parcel_id ? 0 : worker.travel_time_hours);
      if (travelHours.some((travel) => travel >= step)) return { status: "BLOCKED", reason: "TRAVEL_TIME_CONFLICT" };
      const calendarDays = Math.max(1, Math.ceil(step / 24));
      const workerCapacities = assignedWorkers.map((worker, index) => Math.min(Math.max(0, step - travelHours[index]), worker.shift_hours * calendarDays));
      const workHours = Math.min(Math.max(0, requirement.hours - state.construction.progress_hours), ...workerCapacities);
      if (!(workHours > 0)) return { status: "BLOCKED", reason: "REST_REQUIREMENT_CONFLICT" };
      const activityStart = state.simulation_time;
      for (const [index, worker] of assignedWorkers.entries()) {
        worker.current_activity = travelHours[index] > 0 ? "COMMUTING" : state.construction.stage; worker.activity_start = activityStart; worker.activity_end = activityStart + step; worker.availability = false;
        worker.current_location = state.land.land_parcel_id;
      }
      state.simulation_time += step;
      state.construction.progress_hours += workHours;
      const finishWorkerAssignments = () => {
        for (const [index, worker] of assignedWorkers.entries()) {
          const restHours = round(Math.max(0, step - travelHours[index] - workHours));
          worker.stamina = clamp(round(worker.stamina - workHours * 0.9 + restHours * 0.4), 0, 100);
          worker.time_log.push({ stage: state.construction.stage, location: state.land.land_parcel_id, activity_start: activityStart, activity_end: state.simulation_time, scheduled_hours: step, travel_hours: travelHours[index], effective_work_hours: workHours, rest_hours: restHours, shift_capacity_hours: worker.shift_hours * calendarDays });
          worker.event_log.push({ event: "CONSTRUCTION_SHIFT", stage: state.construction.stage, start: activityStart, end: state.simulation_time, status: "CLOCKED_OUT" });
          worker.current_activity = "OFF_DUTY"; worker.activity_end = state.simulation_time; worker.last_work_end = state.simulation_time; worker.availability = true; worker.rest_state = worker.stamina < 10 ? "REST_REQUIRED" : "RESTED";
        }
      };
      finishWorkerAssignments();
      const laborCost = assignedWorkers.reduce((sum, worker) => sum + workHours * worker.wage, 0);
      if (state.construction.progress_hours + EPSILON < requirement.hours) return { status: "IN_PROGRESS", cash_delta: charge(`CONSTRUCTION_LABOR_${state.construction.stage}`, laborCost), outputs: { stage: state.construction.stage, progress_hours: state.construction.progress_hours, worker_life_ids: assignedWorkers.map((worker) => worker.life_id), effective_work_hours: workHours } };
      for (const [item, amount] of Object.entries(requirement.materials)) state.materials[item] = round(state.materials[item] - amount);
      state.energy.electricity_kwh = round(state.energy.electricity_kwh - requirement.energy);
      const completed = state.construction.stage;
      state.construction.completed_stages.push(completed);
      state.construction.progress_hours = 0;
      state.construction.blocked_reason = null;
      if (completed === "INLET_INSTALLATION") state.pond.inlet_installed = true;
      if (completed === "OUTLET_INSTALLATION") state.pond.outlet_installed = true;
      if (completed === "AERATION_INFRASTRUCTURE") state.pond.aerator_installed = true;
      if (completed === "ELECTRICAL_CONNECTION") state.pond.cold_storage_installed = true;
      let waterDelta = 0;
      if (completed === "WATER_FILLING") {
        const source = state.water_sources.find((candidate) => candidate.available && candidate.volume_l >= state.pond.capacity_l);
        waterDelta = state.pond.capacity_l - state.pond.water_volume_l;
        source.volume_l = round(source.volume_l - waterDelta);
        state.pond.water_volume_l = state.pond.capacity_l;
        state.pond.status = "STABILIZING";
        updateWaterState(state);
      }
      state.construction.stage_index += 1;
      if (state.construction.stage_index >= CONSTRUCTION_STAGES.length) {
        state.construction.stage_index = CONSTRUCTION_STAGES.length - 1;
        state.construction.stage = "READY_FOR_STOCKING";
        state.pond.status = "READY_FOR_STOCKING";
        state.water_quality.state = "STABLE";
        state.enterprise.status = "PRE_STOCKING";
      } else state.construction.stage = CONSTRUCTION_STAGES[state.construction.stage_index];
      const cashDelta = charge(`CONSTRUCTION_${completed}`, laborCost + requirement.energy * 1.4);
      return { status: state.pond.status === "READY_FOR_STOCKING" ? "READY_FOR_STOCKING" : "COMPLETED", water_delta: waterDelta, energy_delta: -requirement.energy, cash_delta: cashDelta, outputs: { completed_stage: completed, next_stage: state.construction.stage, worker_life_ids: assignedWorkers.map((worker) => worker.life_id), labor_cost: round(laborCost, 2) } };
    });
  }

  function fillWater(liters = 50000) {
    return execute("FILL_WATER", { liters }, "AQUACULTURE_WORKER", () => {
      if (!state.pond.inlet_installed) return { status: "BLOCKED", reason: "INLET_NOT_INSTALLED" };
      const source = state.water_sources.find((candidate) => candidate.available);
      const amount = Math.min(Number(liters) || 0, source?.volume_l ?? 0, state.pond.capacity_l - state.pond.water_volume_l);
      if (!(amount > 0)) return { status: "BLOCKED", reason: "NO_WATER_SOURCE" };
      source.volume_l = round(source.volume_l - amount); state.pond.water_volume_l = round(state.pond.water_volume_l + amount);
      updateWaterState(state);
      return { status: "COMPLETED", water_delta: amount, cash_delta: charge("WATER_FILL", amount * source.cost_per_l), outputs: { water_volume_l: state.pond.water_volume_l } };
    });
  }

  function testWater() {
    return execute("TEST_WATER", {}, "WATER_QUALITY_TECHNICIAN", () => { updateWaterState(state); return { status: "COMPLETED", outputs: clone(state.water_quality) }; });
  }

  function stock(species, count, options = {}) {
    const isFish = species === "FISH";
    const speciesId = isFish ? "SPECIES-KAIOS-FOUNDATIONAL-FISH" : "SPECIES-KAIOS-FOUNDATIONAL-SHRIMP";
    const stockType = isFish ? "FISH_JUVENILE_STOCK" : "SHRIMP_POST_LARVAL_STOCK";
    return execute(`STOCK_${species}`, { count, ...options }, "AQUACULTURE_WORKER", () => {
      let reason = null;
      if (state.pond.status !== "READY_FOR_STOCKING" && state.pond.status !== "OPERATING") reason = "POND_NOT_READY";
      else if (state.water_quality.state !== "STABLE") reason = "WATER_UNSTABLE";
      else if (state.water_quality.dissolved_oxygen_mg_l < 3) reason = "LOW_OXYGEN";
      else if (state.water_quality.temperature_c < 18 || state.water_quality.temperature_c > 34) reason = "WRONG_TEMPERATURE";
      else if (!isFish && (state.water_quality.salinity_ppt < 0.5 || state.water_quality.salinity_ppt > 35)) reason = "WRONG_SALINITY";
      else if (options.stock_available === false) reason = "STOCK_NOT_AVAILABLE";
      else if (options.transport_available === false) reason = "TRANSPORT_NOT_AVAILABLE";
      else if (options.health_check_passed === false) reason = "HEALTH_CHECK_FAILED_SIMULATION";
      else if (options.quarantine_complete === false) reason = "QUARANTINE_NOT_COMPLETE";
      const amount = Math.floor(Number(count));
      if (!reason && (!(amount > 0) || amount > 500)) reason = "INVALID_STOCK_COUNT";
      const proposed = [...state.populations, { population_id: `POP-${species}-${state.populations.length + 1}`, species_id: speciesId, stock_type: stockType, count: amount }];
      if (!reason && !validatePopulationContract(proposed, state.boundaries, AQUACULTURE_POPULATION_CONTRACT, AQUACULTURE_ROOT_INVARIANTS).valid) reason = "OVER_CARRYING_CAPACITY";
      if (reason) return { status: "BLOCKED", reason, species_id: speciesId, population_delta: 0 };
      const averageMass = isFish ? 0.05 : 0.005;
      const population = { population_id: `POP-${species}-${state.populations.length + 1}`, species_id: speciesId, stock_type: stockType, count: amount, average_mass_kg: averageMass, total_biomass_kg: round(amount * averageMass), age_hours: 0, health_index: 95, stress_index: 5, feed_requirement_kg: round(amount * averageMass * 0.03), feed_consumed_kg: 0, pending_feed_kg: 0, feed_conversion_proxy: 1.6, mortality_count: 0, growth_stage: "JUVENILE", carrying_capacity: state.boundaries.maximum_population, harvest_readiness: 0, quarantine_complete: true, reproduction_cooldown_until: 72, generation: 0, status: "HEALTHY", blocked_reason: null };
      state.populations.push(population);
      state.pond.status = "OPERATING"; state.enterprise.status = "OPERATING";
      const cashDelta = charge(`${species}_STOCK`, amount * (isFish ? 1.2 : 0.35));
      return { status: "COMPLETED", population_id: population.population_id, species_id: speciesId, population_delta: amount, biomass_delta: population.total_biomass_kg, cash_delta: cashDelta, outputs: clone(population) };
    });
  }
  const stockFish = (count, options) => stock("FISH", count, options);
  const stockShrimp = (count, options) => stock("SHRIMP", count, options);

  function feed(populationId, kilograms) {
    return execute("FEED_POPULATION", { populationId, kilograms }, "AQUACULTURE_WORKER", () => {
      const population = state.populations.find((candidate) => candidate.population_id === populationId);
      if (!population) return { status: "BLOCKED", reason: "POPULATION_NOT_FOUND" };
      if (!["AVAILABLE", "LOW_STOCK"].includes(state.feed.status) || state.feed.quality <= 0.3) return { status: "BLOCKED", reason: state.feed.status === "OUT_OF_STOCK" ? "FEED_OUT_OF_STOCK" : "FEED_UNFIT" };
      const amount = Math.min(Math.max(0, Number(kilograms) || 0), state.feed.inventory_kg);
      if (!(amount > 0)) return { status: "BLOCKED", reason: "FEED_OUT_OF_STOCK" };
      state.feed.inventory_kg = round(state.feed.inventory_kg - amount); state.feed.consumed_kg = round(state.feed.consumed_kg + amount);
      population.feed_consumed_kg = round(population.feed_consumed_kg + amount); population.pending_feed_kg = round(population.pending_feed_kg + amount);
      state.feed.status = state.feed.inventory_kg <= 0 ? "OUT_OF_STOCK" : state.feed.inventory_kg < 100 ? "LOW_STOCK" : "AVAILABLE";
      return { status: "COMPLETED", population_id: populationId, feed_delta: -amount, cash_delta: charge("FEED_CONSUMPTION", amount * 1.8), outputs: { remaining_feed_kg: state.feed.inventory_kg } };
    });
  }

  function startAeration(hours = 1) {
    return execute("START_AERATION", { hours }, "AQUACULTURE_WORKER", () => {
      if (!state.pond.aerator_installed || state.equipment.AERATOR < 1) return { status: "BLOCKED", reason: "NO_AERATOR" };
      const energyRequired = Math.max(0.5, Number(hours) * 2);
      if (state.energy.electricity_kwh < energyRequired) { state.pond.aeration_state = "POWER_OUTAGE"; return { status: "BLOCKED", reason: "POWER_OUTAGE" }; }
      state.energy.electricity_kwh = round(state.energy.electricity_kwh - energyRequired);
      state.pond.aeration_state = "RUNNING";
      const before = state.water_quality.dissolved_oxygen_mg_l;
      state.water_quality.dissolved_oxygen_mg_l = clamp(round(before + Number(hours) * 0.8), 0, 14);
      updateWaterState(state);
      return { status: "COMPLETED", oxygen_delta: round(state.water_quality.dissolved_oxygen_mg_l - before), energy_delta: -energyRequired, cash_delta: charge("AERATION_ENERGY", energyRequired * 0.25), outputs: { aeration_state: state.pond.aeration_state } };
    });
  }

  function performWaterExchange(liters = 25000) {
    return execute("WATER_EXCHANGE", { liters }, "WATER_QUALITY_TECHNICIAN", () => {
      if (!state.pond.inlet_installed || !state.pond.outlet_installed) return { status: "BLOCKED", reason: "WATER_INFRASTRUCTURE_MISSING" };
      const source = state.water_sources.find((candidate) => candidate.available);
      const amount = Math.min(Math.max(0, Number(liters) || 0), state.pond.water_volume_l, source?.volume_l ?? 0);
      if (!(amount > 0)) return { status: "BLOCKED", reason: "NO_WATER_SOURCE" };
      source.volume_l = round(source.volume_l - amount);
      state.pond.effluent_pool_l = round(state.pond.effluent_pool_l + amount);
      state.pond.waste_pool_kg = round(state.pond.waste_pool_kg + amount * state.water_quality.organic_load / 1000);
      state.water_quality.ammonia_proxy = round(state.water_quality.ammonia_proxy * 0.78);
      state.water_quality.pollution_index = round(state.water_quality.pollution_index * 0.82);
      state.water_quality.organic_load = round(state.water_quality.organic_load * 0.8);
      updateWaterState(state);
      return { status: "COMPLETED", water_delta: 0, pollution_delta: -0.1, cash_delta: charge("WATER_EXCHANGE", amount * 0.00004), outputs: { exchanged_l: amount, source_withdrawal_l: amount, effluent_recorded_l: amount, pond_volume_change_l: 0 } };
    });
  }

  function advanceTime(hours = 24, environment = {}) {
    return execute("ADVANCE_TIME", { hours, environment }, "AQUACULTURE_CLOCK", () => {
      if (state.status !== "RUNNING") return { status: "BLOCKED", reason: "RUNTIME_PAUSED" };
      const elapsed = clamp(Number(hours) || 0, 0, 720);
      if (!(elapsed > 0)) return { status: "BLOCKED", reason: "TIME_REQUIRED" };
      const previousVolume = state.pond.water_volume_l;
      const rainfall = Math.max(0, Number(environment.rainfall_l ?? elapsed * 80));
      const evaporation = Math.min(previousVolume + rainfall, Math.max(0, Number(environment.evaporation_l ?? elapsed * 55)));
      const seepage = Math.min(previousVolume + rainfall - evaporation, Math.max(0, Number(environment.seepage_l ?? elapsed * 18)));
      const requestedOutflow = Math.max(0, Number(environment.outflow_l ?? 0));
      const rawNextVolume = Math.max(0, previousVolume + rainfall - evaporation - seepage - requestedOutflow);
      const overflow = Math.max(0, rawNextVolume - state.pond.capacity_l);
      const outflow = requestedOutflow + overflow;
      state.pond.water_volume_l = round(Math.min(rawNextVolume, state.pond.capacity_l));
      state.water_quality.last_balance = { previous_volume_l: previousVolume, inflow_l: 0, rainfall_l: rainfall, evaporation_l: evaporation, seepage_l: seepage, outflow_l: outflow, recorded_removal_l: 0, next_volume_l: state.pond.water_volume_l };
      state.simulation_time += elapsed;
      let biomassDelta = 0, populationDelta = 0, healthDelta = 0;
      const totalBiomass = state.populations.reduce((sum, population) => sum + population.total_biomass_kg, 0);
      const totalFeed = state.populations.reduce((sum, population) => sum + population.pending_feed_kg, 0);
      const oxygenBefore = state.water_quality.dissolved_oxygen_mg_l;
      const oxygenDemand = totalBiomass * 0.0007 * elapsed + totalFeed * 0.04;
      const passiveRecovery = state.pond.aeration_state === "RUNNING" ? elapsed * 0.35 : elapsed * 0.04;
      state.water_quality.dissolved_oxygen_mg_l = clamp(round(oxygenBefore + passiveRecovery - oxygenDemand), 0, 14);
      state.water_quality.organic_load = clamp(round(state.water_quality.organic_load + totalFeed * 0.002 + state.pond.dead_biomass_kg * 0.001), 0, 1);
      state.water_quality.ammonia_proxy = clamp(round(state.water_quality.ammonia_proxy + totalFeed * 0.0015 + state.pond.dead_biomass_kg * 0.001), 0, 1);
      state.water_quality.pathogen_risk_proxy = clamp(round((state.water_quality.organic_load + state.water_quality.pollution_index + Math.max(0, 3 - state.water_quality.dissolved_oxygen_mg_l) / 3) / 3), 0, 1);
      for (const population of state.populations) {
        const beforeMass = population.total_biomass_kg, beforeHealth = population.health_index, beforeCount = population.count;
        const required = Math.max(0.01, population.total_biomass_kg * 0.025 * elapsed / 24);
        const ratio = Math.min(2, population.pending_feed_kg / required);
        const consumedForGrowth = Math.min(population.pending_feed_kg, required);
        const growth = round(consumedForGrowth * 0.55 * (population.health_index / 100));
        const metabolicWaste = round(consumedForGrowth - growth);
        const excessFeed = round(Math.max(0, population.pending_feed_kg - consumedForGrowth));
        population.total_biomass_kg = round(population.total_biomass_kg + growth);
        state.pond.waste_pool_kg = round(state.pond.waste_pool_kg + metabolicWaste + excessFeed);
        state.feed.waste_kg = round(state.feed.waste_kg + excessFeed);
        population.average_mass_kg = population.count > 0 ? round(population.total_biomass_kg / population.count, 6) : 0;
        population.age_hours += elapsed;
        if (ratio < 0.6) { population.health_index = clamp(round(population.health_index - (0.6 - ratio) * elapsed * 0.18), 0, 100); population.stress_index = clamp(round(population.stress_index + elapsed * 0.1), 0, 100); }
        if (ratio > 1.2) state.water_quality.organic_load = clamp(round(state.water_quality.organic_load + excessFeed * 0.02), 0, 1);
        if (state.water_quality.dissolved_oxygen_mg_l < 3 || state.water_quality.state === "POLLUTED") {
          population.health_index = clamp(round(population.health_index - elapsed * 0.9), 0, 100);
          const deaths = Math.min(population.count, Math.floor(population.count * clamp((3 - state.water_quality.dissolved_oxygen_mg_l) / 10 + state.water_quality.pollution_index / 20, 0, 0.3)));
          if (deaths > 0) {
            const deadMass = round(deaths * population.average_mass_kg);
            population.count -= deaths; population.total_biomass_kg = round(Math.max(0, population.total_biomass_kg - deadMass)); population.mortality_count += deaths;
            state.pond.dead_biomass_kg = round(state.pond.dead_biomass_kg + deadMass); population.status = "MORTALITY_EVENT";
          }
        }
        population.pending_feed_kg = 0;
        population.growth_stage = population.age_hours >= 168 ? "HARVEST_READY" : population.age_hours >= 72 ? "MATURE" : population.age_hours >= 24 ? "GROWING" : "JUVENILE";
        population.harvest_readiness = clamp(round(population.age_hours / 168), 0, 1);
        biomassDelta += population.total_biomass_kg - beforeMass; populationDelta += population.count - beforeCount; healthDelta += population.health_index - beforeHealth;
      }
      state.pond.aeration_state = state.pond.aeration_state === "RUNNING" ? "OFF" : state.pond.aeration_state;
      updateWaterState(state);
      const storageCost = state.inventory.reduce((sum, item) => sum + item.quantity_kg * 0.03 * elapsed / 24, 0);
      const storageCashDelta = storageCost > 0 ? charge("INVENTORY_STORAGE", storageCost) : 0;
      updateBusinessState();
      return { status: "COMPLETED", water_delta: round(state.pond.water_volume_l - previousVolume), oxygen_delta: round(state.water_quality.dissolved_oxygen_mg_l - oxygenBefore), biomass_delta: round(biomassDelta), population_delta: populationDelta, health_delta: round(healthDelta), pollution_delta: round(state.water_quality.organic_load), cash_delta: storageCashDelta, outputs: { simulation_time: state.simulation_time, water_state: state.water_quality.state } };
    });
  }

  function processReproduction(populationId) {
    return execute("PROCESS_REPRODUCTION", { populationId }, "ECOLOGY_BINDING", () => {
      const population = state.populations.find((candidate) => candidate.population_id === populationId);
      if (!population) return { status: "BLOCKED", reason: "POPULATION_NOT_FOUND" };
      let reason = null;
      if (population.age_hours < 72) reason = "MINIMUM_REPRODUCTIVE_AGE";
      else if (population.health_index < 70) reason = "HEALTH_TOO_LOW";
      else if (state.simulation_time < population.reproduction_cooldown_until) reason = "REPRODUCTION_COOLDOWN";
      else if (state.water_quality.state !== "STABLE") reason = "NO_HABITAT";
      else if (state.feed.inventory_kg < 5) reason = "INSUFFICIENT_FOOD";
      const births = Math.max(1, Math.floor(population.count * 0.03));
      if (!reason && state.populations.reduce((sum, item) => sum + item.count, 0) + births > state.boundaries.maximum_population) reason = "POPULATION_CAP_REACHED";
      if (reason) return { status: "BLOCKED", reason, population_id: populationId };
      const offspringBiomass = round(births * population.average_mass_kg * 0.2);
      if (population.total_biomass_kg <= offspringBiomass) return { status: "BLOCKED", reason: "INSUFFICIENT_ENERGY", population_id: populationId };
      population.count += births;
      population.average_mass_kg = round(population.total_biomass_kg / population.count, 6);
      population.generation += 1; population.reproduction_cooldown_until = state.simulation_time + 72;
      return { status: "COMPLETED", population_id: populationId, species_id: population.species_id, population_delta: births, biomass_delta: 0, outputs: { births, offspring_biomass_kg: offspringBiomass, parental_mass_transfer: true, generation: population.generation } };
    });
  }

  function processDecomposition(kilograms = state.pond.dead_biomass_kg) {
    return execute("PROCESS_DECOMPOSITION", { kilograms }, "MICROBIAL_DECOMPOSITION_PROXY", () => {
      const amount = Math.min(Math.max(0, Number(kilograms) || 0), state.pond.dead_biomass_kg);
      if (!(amount > 0)) return { status: "BLOCKED", reason: "NO_DEAD_BIOMASS" };
      state.pond.dead_biomass_kg = round(state.pond.dead_biomass_kg - amount); state.pond.waste_pool_kg = round(state.pond.waste_pool_kg + amount * 0.65); state.pond.treatment_output_kg = round(state.pond.treatment_output_kg + amount * 0.35);
      state.water_quality.organic_load = clamp(round(state.water_quality.organic_load + amount * 0.002), 0, 1);
      return { status: "COMPLETED", biomass_delta: -amount, pollution_delta: round(amount * 0.002), outputs: { decomposition_kg: amount, waste_pool_kg: state.pond.waste_pool_kg } };
    });
  }

  function scheduleHealthCheck() {
    return execute("HEALTH_CHECK_SIMULATION", {}, "FISH_HEALTH_INSPECTOR_SIMULATION", () => {
      const risk = clamp(round((state.water_quality.pathogen_risk_proxy + state.water_quality.pollution_index + state.water_quality.organic_load) / 3), 0, 1);
      for (const population of state.populations) population.status = risk > 0.65 ? "ISOLATION_REQUIRED" : risk > 0.35 ? "AT_RISK" : population.status === "MORTALITY_EVENT" ? population.status : "HEALTHY";
      return { status: "COMPLETED", outputs: { disease_risk_proxy: risk, diagnostic_claim: false } };
    });
  }

  function harvest(populationId, requestedCount) {
    return execute("HARVEST", { populationId, requestedCount }, "HARVEST_WORKER", () => {
      const population = state.populations.find((candidate) => candidate.population_id === populationId);
      if (!population) return { status: "BLOCKED", reason: "POPULATION_NOT_FOUND" };
      if (population.harvest_readiness < 0.6) return { status: "BLOCKED", reason: "HARVEST_NOT_READY" };
      if (!state.workers.some((worker) => worker.role === "HARVEST_WORKER" && worker.availability)) return { status: "BLOCKED", reason: "BLOCKED_LABOR" };
      if (state.materials.PACKAGING < 1 || state.materials.ICE < 1) return { status: "BLOCKED", reason: "BLOCKED_MATERIAL" };
      const count = Math.min(population.count, Math.max(1, Math.floor(Number(requestedCount) || population.count)));
      const gross = round(count * population.average_mass_kg), rejected = round(gross * 0.08), mortality = round(gross * 0.02), marketable = round(gross - rejected - mortality);
      const harvestId = `HARVEST-${String(state.harvests.length + 1).padStart(4, "0")}`, inventoryId = `INVENTORY-${String(state.inventory.length + 1).padStart(4, "0")}`;
      const record = { harvest_id: harvestId, population_id: populationId, species_id: population.species_id, stage: "COMPLETE", stages_completed: ["HARVEST_PLANNED", "PARTIAL_DRAIN", "CAPTURE", "SORTING", "WEIGHING", "GRADING", "CHILLING", "PACKING", "COLD_STORAGE", "DISPATCH", "COMPLETE"], count, gross_mass_kg: gross, marketable_mass_kg: marketable, rejected_mass_kg: rejected, mortality_loss_kg: mortality, grade: "A", unit_cost: round(state.enterprise.accounts.expenses / Math.max(1, marketable), 2), inventory_id: inventoryId, simulation_time: state.simulation_time };
      state.harvests.push(record); population.count -= count; population.total_biomass_kg = round(Math.max(0, population.total_biomass_kg - gross)); population.average_mass_kg = population.count ? round(population.total_biomass_kg / population.count, 6) : 0;
      state.pond.dead_biomass_kg = round(state.pond.dead_biomass_kg + mortality);
      state.pond.waste_pool_kg = round(state.pond.waste_pool_kg + rejected);
      state.inventory.push({ inventory_id: inventoryId, species_id: population.species_id, quantity_kg: marketable, reserved_kg: 0, available_kg: marketable, grade: "A", condition: "CHILLED", storage_cost: 0, book_value: round(marketable * record.unit_cost, 2) });
      state.enterprise.accounts.inventory_value = round(state.enterprise.accounts.inventory_value + marketable * record.unit_cost, 2); state.enterprise.status = "HARVESTING";
      const cashDelta = charge("HARVEST_COST", gross * 0.8 + 120);
      return { status: "COMPLETED", population_id: populationId, species_id: population.species_id, population_delta: -count, biomass_delta: -gross, inventory_delta: marketable, cash_delta: cashDelta, outputs: clone(record) };
    });
  }

  function moveToColdStorage(inventoryId) {
    return execute("MOVE_TO_COLD_STORAGE", { inventoryId }, "COLD_STORAGE_OPERATOR", () => {
      const item = state.inventory.find((candidate) => candidate.inventory_id === inventoryId);
      if (!item) return { status: "BLOCKED", reason: "INVENTORY_NOT_FOUND" };
      if (!state.pond.cold_storage_installed || state.equipment.COLD_STORAGE_UNIT < 1) return { status: "BLOCKED", reason: "NO_COLD_STORAGE" };
      if (state.energy.electricity_kwh < 2) return { status: "BLOCKED", reason: "POWER_OUTAGE" };
      state.energy.electricity_kwh -= 2; item.condition = "CHILLED";
      const deliveryId = `DELIVERY-${String(state.cold_chain.length + 1).padStart(4, "0")}`;
      state.cold_chain.push({ delivery_id: deliveryId, inventory_id: inventoryId, state: "COLD_STORAGE", temperature_c: 2, maximum_temperature_c: 5, storage_hours: 0, vehicle_id: "TRUCK-AQUA-001", route_id: "ROUTE-PENDING", fuel_required_l: 0, fuel_consumed_l: 0, refrigeration_energy_kwh: 0, travel_hours: 0, elapsed_hours: 0, spoilage_risk: 0, blocked_reason: null });
      return { status: "COMPLETED", energy_delta: -2, cash_delta: charge("COLD_STORAGE", 35), outputs: { delivery_id: deliveryId } };
    });
  }

  function createMarketOrder({ buyer = "SIMULATED-BUYER", quantity_kg, grade = "A", unit_price = 8, channel = "WHOLESALE", confirmed = true, delivery_window_hours = 72, payment_terms = "SIMULATED_CASH_ON_ACCEPTANCE" } = {}) {
    return execute("CREATE_MARKET_ORDER", { buyer, quantity_kg, grade, unit_price, channel, confirmed, delivery_window_hours, payment_terms }, "SIMULATED_CUSTOMER", () => {
      const quantity = Number(quantity_kg), price = Number(unit_price), deliveryWindow = Number(delivery_window_hours);
      if (!Number.isFinite(quantity) || !(quantity > 0)) return { status: "BLOCKED", reason: "INVALID_ORDER_QUANTITY" };
      if (!Number.isFinite(price) || !(price > 0)) return { status: "BLOCKED", reason: "INVALID_UNIT_PRICE" };
      if (!Number.isFinite(deliveryWindow) || !(deliveryWindow > 0)) return { status: "BLOCKED", reason: "INVALID_DELIVERY_WINDOW" };
      const order = { order_id: `ORDER-${String(state.orders.length + 1).padStart(4, "0")}`, buyer, quantity_kg: quantity, grade, unit_price: price, channel, confirmed: Boolean(confirmed), delivery_window_hours: deliveryWindow, payment_terms, status: confirmed ? "CONFIRMED" : "FORECAST" };
      state.orders.push(order); state.enterprise.status = confirmed ? "SALES_PENDING" : state.enterprise.status;
      return { status: "COMPLETED", outputs: clone(order) };
    });
  }

  function createDeliveryOrder({ inventoryId, orderId, routeOptions = {} } = {}) {
    return execute("CREATE_DELIVERY_ORDER", { inventoryId, orderId, routeOptions }, "TRANSPORT_OPERATOR", () => {
      const item = state.inventory.find((candidate) => candidate.inventory_id === inventoryId);
      const order = state.orders.find((candidate) => candidate.order_id === orderId);
      const cold = state.cold_chain.find((candidate) => candidate.inventory_id === inventoryId);
      if (!item || !cold) return { status: "BLOCKED", reason: "COLD_CHAIN_NOT_READY" };
      if (!order?.confirmed) return { status: "BLOCKED", reason: "NO_CONFIRMED_BUYER" };
      if (item.available_kg + EPSILON < order.quantity_kg) return { status: "BLOCKED", reason: "INSUFFICIENT_INVENTORY" };
      if (state.cold_chain.some((candidate) => candidate.vehicle_id === cold.vehicle_id && candidate.state === "IN_TRANSIT")) return { status: "BLOCKED", reason: "VEHICLE_NOT_AVAILABLE" };
      const driver = state.workers.find((worker) => worker.role === "TRUCK_DRIVER");
      if (!driver?.availability || driver.current_activity !== "OFF_DUTY") return { status: "BLOCKED", reason: "ROLE_TIME_CONFLICT" };
      const causal = createCausalWorldRuntime({ seed: `${state.seed}-ROUTE-${state.routes.length + 1}` });
      const route = causal.evaluateRoute({ cargo_mass_kg: order.quantity_kg, ...routeOptions });
      state.routes.push(route);
      if (route.blocked) { cold.blocked_reason = route.block_reason; return { status: "BLOCKED", reason: route.block_reason, outputs: route }; }
      if (state.energy.fuel_l + EPSILON < route.fuel_required_l) return { status: "BLOCKED", reason: "INSUFFICIENT_FUEL", outputs: route };
      state.energy.fuel_l = round(state.energy.fuel_l - route.fuel_required_l);
      driver.current_activity = "DRIVING"; driver.availability = false; driver.current_location = "ROUTE_IN_TRANSIT";
      cold.order_id = order.order_id; cold.route_id = route.route_id; cold.fuel_required_l = route.fuel_required_l; cold.fuel_consumed_l = route.fuel_required_l; cold.travel_hours = round(route.estimated_time_s / 3600); cold.state = "IN_TRANSIT"; cold.blocked_reason = null;
      item.reserved_kg = round(item.reserved_kg + order.quantity_kg); item.available_kg = round(item.available_kg - order.quantity_kg); order.status = "FULFILLING";
      return { status: "IN_TRANSIT", inventory_delta: -order.quantity_kg, energy_delta: -route.fuel_required_l, cash_delta: charge("DELIVERY_START", route.fuel_required_l * 1.2 + 75), outputs: { delivery_id: cold.delivery_id, route, fuel_unit: "liter" } };
    });
  }

  function advanceDelivery(deliveryId, hours = 24, { refrigeration = true } = {}) {
    return execute("ADVANCE_DELIVERY", { deliveryId, hours, refrigeration }, "TRUCK_DRIVER", () => {
      const cold = state.cold_chain.find((candidate) => candidate.delivery_id === deliveryId);
      if (!cold || cold.state !== "IN_TRANSIT") return { status: "BLOCKED", reason: "DELIVERY_NOT_IN_TRANSIT" };
      const requestedHours = Math.max(0, Number(hours) || 0);
      const elapsed = Math.min(requestedHours, Math.max(0, cold.travel_hours - cold.elapsed_hours));
      state.simulation_time += elapsed; cold.elapsed_hours += elapsed;
      const refrigerationRequired = round(elapsed * 0.5);
      const refrigerationUsed = refrigeration ? Math.min(state.energy.electricity_kwh, refrigerationRequired) : 0;
      state.energy.electricity_kwh = round(state.energy.electricity_kwh - refrigerationUsed);
      cold.refrigeration_energy_kwh = round(cold.refrigeration_energy_kwh + refrigerationUsed);
      if (!refrigeration || refrigerationUsed + EPSILON < refrigerationRequired) { cold.temperature_c = round(cold.temperature_c + elapsed * 0.8); cold.spoilage_risk = clamp(round(cold.spoilage_risk + elapsed * 0.04), 0, 1); cold.state = cold.temperature_c > cold.maximum_temperature_c ? "TEMPERATURE_EXCURSION" : "IN_TRANSIT"; }
      if (cold.elapsed_hours + EPSILON < cold.travel_hours) return { status: cold.state, energy_delta: -refrigerationUsed, outputs: { ...clone(cold), requested_hours: requestedHours, advanced_hours: elapsed, unused_hours: round(requestedHours - elapsed) } };
      const item = state.inventory.find((candidate) => candidate.inventory_id === cold.inventory_id);
      const order = state.orders.find((candidate) => candidate.order_id === cold.order_id);
      if (!item || !order || order.status !== "FULFILLING") return { status: "BLOCKED", reason: "DELIVERY_ORDER_BINDING_INVALID" };
      const driver = state.workers.find((worker) => worker.role === "TRUCK_DRIVER");
      const releaseTransport = () => { if (driver) { driver.current_activity = "OFF_DUTY"; driver.availability = true; driver.current_location = state.land.land_parcel_id; } };
      if (cold.spoilage_risk >= 0.5 || cold.temperature_c > cold.maximum_temperature_c) {
        const spoiledBookValue = round(item.book_value * order.quantity_kg / Math.max(EPSILON, item.quantity_kg), 2);
        cold.state = "REJECTED"; item.spoiled_kg = round((item.spoiled_kg ?? 0) + order.quantity_kg); item.condition = item.spoiled_kg + EPSILON >= item.quantity_kg ? "SPOILED" : "PARTIALLY_SPOILED"; item.reserved_kg = round(Math.max(0, item.reserved_kg - order.quantity_kg)); item.book_value = round(Math.max(0, item.book_value - spoiledBookValue), 2); order.status = "REJECTED";
        state.enterprise.accounts.inventory_value = round(Math.max(0, state.enterprise.accounts.inventory_value - spoiledBookValue), 2); releaseTransport();
        return { status: "REJECTED", reason: "COLD_CHAIN_FAILURE", inventory_delta: 0, energy_delta: -refrigerationUsed, cash_delta: charge("SPOILAGE_LOSS", order.quantity_kg * order.unit_price), outputs: clone(cold) };
      }
      const quantityBefore = item.quantity_kg;
      const soldBookValue = round(item.book_value * order.quantity_kg / Math.max(EPSILON, quantityBefore), 2);
      cold.state = "DELIVERED"; order.status = "ACCEPTED"; item.reserved_kg = round(item.reserved_kg - order.quantity_kg); item.quantity_kg = round(item.quantity_kg - order.quantity_kg); item.book_value = round(Math.max(0, item.book_value - soldBookValue), 2); item.condition = item.quantity_kg > 0 ? "CHILLED" : "SOLD"; releaseTransport();
      const revenue = round(order.quantity_kg * order.unit_price, 2); state.enterprise.accounts.inventory_value = round(Math.max(0, state.enterprise.accounts.inventory_value - soldBookValue), 2);
      return { status: "DELIVERED", inventory_delta: -order.quantity_kg, energy_delta: -refrigerationUsed, cash_delta: recognizeRevenue("ACCEPTED_DELIVERY_REVENUE", revenue), outputs: { delivery_id: cold.delivery_id, revenue } };
    });
  }

  function processPollution(amount = 0.5) {
    return execute("POLLUTION_INFLOW", { amount }, "ENVIRONMENT", () => { const before = state.water_quality.pollution_index; state.water_quality.pollution_index = clamp(round(before + Number(amount)), 0, 1); updateWaterState(state); return { status: "COMPLETED", pollution_delta: round(state.water_quality.pollution_index - before), outputs: { water_state: state.water_quality.state } }; });
  }
  function processRestoration() {
    return execute("RESTORATION", {}, "POND_OPERATOR", () => { const before = state.water_quality.pollution_index; if (state.energy.electricity_kwh < 10) return { status: "BLOCKED", reason: "BLOCKED_ENERGY" }; state.energy.electricity_kwh -= 10; state.water_quality.pollution_index = round(before * 0.55); state.water_quality.ammonia_proxy = round(state.water_quality.ammonia_proxy * 0.65); updateWaterState(state); return { status: "COMPLETED", pollution_delta: round(state.water_quality.pollution_index - before), energy_delta: -10, cash_delta: charge("RESTORATION", 250), outputs: { water_state: state.water_quality.state } }; });
  }
  function runDroughtScenario() { return advanceTime(72, { rainfall_l: 0, evaporation_l: state.pond.water_volume_l * 0.35, seepage_l: 10000 }); }
  function runFloodScenario() { return execute("FLOOD_SCENARIO", {}, "ENVIRONMENT", () => { state.land.flood_risk = 0.95; state.pond.status = "DAMAGED"; state.water_quality.turbidity = 0.9; state.water_quality.pollution_index = clamp(state.water_quality.pollution_index + 0.25, 0, 1); updateWaterState(state); return { status: "COMPLETED", reason: "FLOOD_DAMAGE", pollution_delta: 0.25, cash_delta: charge("FLOOD_DAMAGE", 5000) }; }); }
  function runPowerOutageScenario() { return execute("POWER_OUTAGE_SCENARIO", {}, "ENERGY_GRID", () => { state.energy.electricity_kwh = 0; state.pond.aeration_state = "POWER_OUTAGE"; return { status: "COMPLETED", reason: "POWER_OUTAGE" }; }); }
  function runLowOxygenScenario() { return execute("LOW_OXYGEN_SCENARIO", {}, "ENVIRONMENT", () => { const before = state.water_quality.dissolved_oxygen_mg_l; state.water_quality.dissolved_oxygen_mg_l = 1.5; updateWaterState(state); return { status: "COMPLETED", reason: "LOW_OXYGEN", oxygen_delta: 1.5 - before }; }); }

  function updateBusinessState() {
    const accounts = state.enterprise.accounts;
    if (accounts.cash <= 0 && accounts.payables > 0) state.enterprise.status = "INSOLVENT";
    else if (accounts.cash < 5000) state.enterprise.status = "DISTRESS";
    else if (accounts.cash < 15000) state.enterprise.status = "CASH_FLOW_WARNING";
    return state.enterprise.status;
  }
  function evaluateBusinessState() {
    return execute("EVALUATE_BUSINESS_STATE", {}, "ENTERPRISE_ACCOUNTING", () => ({
      status: "COMPLETED",
      outputs: { enterprise_status: updateBusinessState() }
    }));
  }
  function restructure() { return execute("RESTRUCTURE_SIMULATION", {}, "SIMULATED_COURT", () => { if (!["DISTRESS", "INSOLVENT", "PAYMENT_DELAY"].includes(state.enterprise.status)) return { status: "BLOCKED", reason: "NOT_IN_DISTRESS" }; state.enterprise.status = "RESTRUCTURING_SIMULATION"; return { status: "COMPLETED", outputs: { real_legal_effect: false } }; }); }
  function liquidate() { return execute("LIQUIDATE_SIMULATION", {}, "SIMULATED_COURT", () => { if (!["INSOLVENT", "RESTRUCTURING_SIMULATION", "COURT_PROTECTION_SIMULATION"].includes(state.enterprise.status)) return { status: "BLOCKED", reason: "LIQUIDATION_NOT_AUTHORIZED_SIMULATION" }; state.enterprise.status = "LIQUIDATION_SIMULATION"; state.enterprise.assets.forEach((asset) => { asset.disposition = asset.type === "EQUIPMENT" ? "AUCTIONED_SIMULATION" : "TRANSFERRED_WITH_RECORD"; }); return { status: "COMPLETED", outputs: { assets_preserved: state.enterprise.assets.length, real_legal_effect: false } }; }); }

  function validateState(candidate) {
    const issues = [];
    if (!candidate || typeof candidate !== "object") return ["INVALID_STATE_ROOT"];
    const requiredObjects = ["land", "pond", "construction", "equipment", "materials", "energy", "water_quality", "enterprise", "rights", "ecology_binding", "boundaries"];
    const requiredArrays = ["workers", "water_sources", "populations", "harvests", "inventory", "orders", "cold_chain", "routes", "events", "action_log"];
    if (requiredObjects.some((key) => !candidate[key] || typeof candidate[key] !== "object" || Array.isArray(candidate[key])) || requiredArrays.some((key) => !Array.isArray(candidate[key])) || !candidate.enterprise?.accounts || !Array.isArray(candidate.enterprise?.ledger) || !Array.isArray(candidate.enterprise?.assets)) return ["STATE_STRUCTURE"];
    if (candidate.runtime !== RUNTIME || candidate.mode !== "LOCAL_DETERMINISTIC_SIMULATION") issues.push("RUNTIME_IDENTITY");
    const boundaries = candidate.boundaries ?? {};
    if (boundaries.simulation_only !== true || boundaries.wallet !== "NONE" || boundaries.real_kgen !== "NO_REAL_KGEN" || boundaries.onchain_transfer !== false || boundaries.production_authority !== false || boundaries.real_bioengineering !== false || boundaries.real_food_safety_certification !== false || boundaries.uncontrolled_reproduction !== false) issues.push("AUTHORITY_BOUNDARY");
    if (!Array.isArray(candidate.populations) || !validatePopulationContract(candidate.populations ?? [], boundaries, AQUACULTURE_POPULATION_CONTRACT, AQUACULTURE_ROOT_INVARIANTS).valid) issues.push("POPULATION_CONTRACT");
    if (!Array.isArray(candidate.events) || candidate.events.length > MAX_EVENTS || !Array.isArray(candidate.action_log) || candidate.action_log.length > MAX_ACTIONS) issues.push("HISTORY_BOUNDARY");
    if (numericValues(candidate).some((value) => !Number.isFinite(value))) issues.push("NONFINITE_NUMERIC_STATE");
    if (operationalNumericIssue(candidate) === "NEGATIVE_OPERATIONAL_INPUT") issues.push("NEGATIVE_OPERATIONAL_STATE");
    for (const order of candidate.orders) if (!Number.isFinite(order.quantity_kg) || !(order.quantity_kg > 0) || !Number.isFinite(order.unit_price) || !(order.unit_price > 0) || !Number.isFinite(order.delivery_window_hours) || !(order.delivery_window_hours > 0)) issues.push("INVALID_ORDER_STATE");
    for (const collection of [candidate.populations ?? [], candidate.inventory ?? [], candidate.harvests ?? []]) if (collection.some((entry) => Object.values(entry).some((value) => typeof value === "number" && (!Number.isFinite(value) || value < 0)))) issues.push("INVALID_NUMERIC_STATE");
    const accounts = candidate.enterprise?.accounts ?? {};
    if (["cash", "expenses", "revenue", "receivables", "payables", "debt", "inventory_value"].some((key) => !Number.isFinite(accounts[key]) || accounts[key] < 0)) issues.push("INVALID_ACCOUNT_STATE");
    if (!Number.isFinite(candidate.simulation_time) || candidate.simulation_time < 0 || !Number.isInteger(candidate.revision) || candidate.revision < 0) issues.push("INVALID_TIME_STATE");
    if (!Number.isFinite(candidate.pond?.water_volume_l) || candidate.pond.water_volume_l < 0 || candidate.pond.water_volume_l > candidate.pond.capacity_l + EPSILON) issues.push("INVALID_WATER_STATE");
    for (const item of candidate.inventory ?? []) if (item.available_kg + item.reserved_kg > item.quantity_kg + EPSILON) issues.push("INVENTORY_QUANTITY_BALANCE");
    for (const entry of candidate.enterprise.ledger) if (entry.balanced !== true || ![entry.debit_amount, entry.credit_amount].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(entry.cash_delta) || !Number.isFinite(entry.payable_delta) || entry.payable_delta < 0 || Math.abs(entry.debit_amount - entry.credit_amount) > EPSILON) issues.push("LEDGER_BALANCE");
    const ledgerExpenses = round(candidate.enterprise.ledger.filter((entry) => entry.debit_account === "EXPENSE").reduce((sum, entry) => sum + entry.debit_amount, 0), 2);
    const ledgerRevenue = round(candidate.enterprise.ledger.filter((entry) => entry.credit_account === "REVENUE").reduce((sum, entry) => sum + entry.credit_amount, 0), 2);
    const ledgerCash = round(candidate.enterprise.ledger.reduce((sum, entry) => sum + entry.cash_delta, 0), 2);
    const ledgerPayables = round(candidate.enterprise.ledger.reduce((sum, entry) => sum + entry.payable_delta, 0), 2);
    const inventoryBookValue = round(candidate.inventory.reduce((sum, item) => sum + item.book_value, 0), 2);
    if (Math.abs(ledgerExpenses - accounts.expenses) > EPSILON || Math.abs(ledgerRevenue - accounts.revenue) > EPSILON || Math.abs(INITIAL_CASH + ledgerCash - accounts.cash) > EPSILON || Math.abs(ledgerPayables - accounts.payables) > EPSILON || Math.abs(accounts.payables + accounts.debt - candidate.enterprise.liabilities) > EPSILON || Math.abs(accounts.revenue - accounts.expenses - candidate.enterprise.profit_or_loss) > EPSILON || Math.abs(inventoryBookValue - accounts.inventory_value) > EPSILON) issues.push("ACCOUNT_RECONCILIATION");
    const knownCommands = new Set(["START_RUNTIME", "PAUSE_RUNTIME", "RESUME_RUNTIME", "STOP_RUNTIME", "SELECT_LAND", "DESIGN_POND", "SET_SIMULATION_RESOURCE", "SET_WORKER_AVAILABILITY", "SET_WATER_SOURCE_AVAILABILITY", "REPLENISH_FEED", "APPLY_OPERATING_COST", "ADVANCE_POND_CONSTRUCTION", "FILL_WATER", "TEST_WATER", "STOCK_FISH", "STOCK_SHRIMP", "FEED_POPULATION", "START_AERATION", "WATER_EXCHANGE", "ADVANCE_TIME", "PROCESS_REPRODUCTION", "PROCESS_DECOMPOSITION", "HEALTH_CHECK_SIMULATION", "HARVEST", "MOVE_TO_COLD_STORAGE", "CREATE_MARKET_ORDER", "CREATE_DELIVERY_ORDER", "ADVANCE_DELIVERY", "POLLUTION_INFLOW", "RESTORATION", "FLOOD_SCENARIO", "POWER_OUTAGE_SCENARIO", "LOW_OXYGEN_SCENARIO", "EVALUATE_BUSINESS_STATE", "RESTRUCTURE_SIMULATION", "LIQUIDATE_SIMULATION"]);
    if (candidate.action_log.some((action) => !knownCommands.has(action.command))) issues.push("UNKNOWN_ACTION_COMMAND");
    for (let index = 1; index < (candidate.events?.length ?? 0); index += 1) if (candidate.events[index].previous_state_hash !== candidate.events[index - 1].next_state_hash) issues.push("EVENT_CHAIN_BROKEN");
    if (candidate.events?.length && candidate.events.at(-1).next_state_hash !== hash(stateProjection(candidate))) issues.push("STATE_HASH_MISMATCH");
    return [...new Set(issues)];
  }

  function exportState() { usable(); return { export_status: "NON_AUTHORITATIVE_SIMULATION", schema_version: SCHEMA_VERSION, state: getState() }; }
  function importState(payload) {
    usable();
    const parsed = typeof payload === "string" ? JSON.parse(payload) : clone(payload);
    const candidate = parsed?.state ?? parsed;
    const issues = validateState(candidate);
    if (issues.length) throw new Error(`IMPORT_REJECTED:${issues.join(",")}`);
    state = clone(candidate);
    return getState();
  }
  function resetState() { usable(); state = defaultState(String(seed)); emit(); return getState(); }
  function replayEvents() {
    usable();
    const actions = clone(state.action_log);
    const replay = createFishpondAquacultureRuntimeV1({ seed: state.seed });
    for (const action of actions) {
      const handler = {
        START_RUNTIME: () => replay.start(), PAUSE_RUNTIME: () => replay.pause(), RESUME_RUNTIME: () => replay.resume(), STOP_RUNTIME: () => replay.stop(),
        SELECT_LAND: () => replay.selectLand(action.args), DESIGN_POND: () => replay.designPond(action.args),
        SET_SIMULATION_RESOURCE: () => replay.setResource(action.args.category, action.args.key, action.args.value), SET_WORKER_AVAILABILITY: () => replay.setWorkerAvailability(action.args.role, action.args.available),
        SET_WATER_SOURCE_AVAILABILITY: () => replay.setWaterSourceAvailability(action.args.sourceId, action.args.available, action.args.volumeL), REPLENISH_FEED: () => replay.replenishFeed(action.args.kilograms, action.args.quality), APPLY_OPERATING_COST: () => replay.applyOperatingCost(action.args.costType, action.args.amount),
        ADVANCE_POND_CONSTRUCTION: () => replay.advanceConstruction(action.args.hours), FILL_WATER: () => replay.fillWater(action.args.liters), TEST_WATER: () => replay.testWater(),
        STOCK_FISH: () => replay.stockFish(action.args.count, action.args), STOCK_SHRIMP: () => replay.stockShrimp(action.args.count, action.args), FEED_POPULATION: () => replay.feed(action.args.populationId, action.args.kilograms),
        START_AERATION: () => replay.startAeration(action.args.hours), WATER_EXCHANGE: () => replay.performWaterExchange(action.args.liters), ADVANCE_TIME: () => replay.advanceTime(action.args.hours, action.args.environment),
        PROCESS_REPRODUCTION: () => replay.processReproduction(action.args.populationId), PROCESS_DECOMPOSITION: () => replay.processDecomposition(action.args.kilograms), HEALTH_CHECK_SIMULATION: () => replay.scheduleHealthCheck(),
        HARVEST: () => replay.harvest(action.args.populationId, action.args.requestedCount), MOVE_TO_COLD_STORAGE: () => replay.moveToColdStorage(action.args.inventoryId), CREATE_MARKET_ORDER: () => replay.createMarketOrder(action.args),
        CREATE_DELIVERY_ORDER: () => replay.createDeliveryOrder(action.args), ADVANCE_DELIVERY: () => replay.advanceDelivery(action.args.deliveryId, action.args.hours, { refrigeration: action.args.refrigeration }),
        POLLUTION_INFLOW: () => replay.processPollution(action.args.amount), RESTORATION: () => replay.processRestoration(), FLOOD_SCENARIO: () => replay.runFloodScenario(), POWER_OUTAGE_SCENARIO: () => replay.runPowerOutageScenario(), LOW_OXYGEN_SCENARIO: () => replay.runLowOxygenScenario(),
        EVALUATE_BUSINESS_STATE: () => replay.evaluateBusinessState(), RESTRUCTURE_SIMULATION: () => replay.restructure(), LIQUIDATE_SIMULATION: () => replay.liquidate()
      }[action.command];
      if (!handler) throw new Error(`REPLAY_UNSUPPORTED_ACTION:${action.command}`);
      const result = handler();
      if (result.status !== action.status || (result.reason ?? null) !== (action.reason ?? null)) throw new Error(`REPLAY_RESULT_MISMATCH:${action.action_id}`);
    }
    const replayState = replay.getState();
    if (hash(stateProjection(replayState)) !== hash(stateProjection(state))) throw new Error("REPLAY_STATE_MISMATCH");
    return replayState;
  }

  function integrityReport() {
    const issues = validateState(state);
    const balance = state.water_quality.last_balance;
    if (balance) {
      const expected = balance.previous_volume_l + balance.inflow_l + balance.rainfall_l - balance.evaporation_l - balance.seepage_l - balance.outflow_l - balance.recorded_removal_l;
      if (Math.abs(expected - balance.next_volume_l) > EPSILON) issues.push("WATER_BALANCE");
    }
    for (const harvestRecord of state.harvests) if (Math.abs(harvestRecord.gross_mass_kg - harvestRecord.marketable_mass_kg - harvestRecord.rejected_mass_kg - harvestRecord.mortality_loss_kg) > EPSILON) issues.push("HARVEST_MASS_BALANCE");
    if (state.enterprise.ledger.some((entry) => !entry.balanced || !Number.isFinite(entry.debit_amount) || !Number.isFinite(entry.credit_amount) || entry.debit_amount <= 0 || Math.abs(entry.debit_amount - entry.credit_amount) > EPSILON)) issues.push("LEDGER_BALANCE");
    const ledgerDebits = round(state.enterprise.ledger.reduce((sum, entry) => sum + entry.debit_amount, 0), 2);
    const ledgerCredits = round(state.enterprise.ledger.reduce((sum, entry) => sum + entry.credit_amount, 0), 2);
    if (Math.abs(ledgerDebits - ledgerCredits) > EPSILON) issues.push("LEDGER_TOTAL_MISMATCH");
    const cashFromLedger = round(state.enterprise.ledger.reduce((sum, entry) => sum + entry.cash_delta, 0), 2);
    if (Math.abs(INITIAL_CASH + cashFromLedger - state.enterprise.accounts.cash) > EPSILON) issues.push("CASH_LEDGER_RECONCILIATION");
    const inventoryBookValue = round(state.inventory.reduce((sum, item) => sum + item.book_value, 0), 2);
    if (Math.abs(inventoryBookValue - state.enterprise.accounts.inventory_value) > EPSILON) issues.push("INVENTORY_VALUE_RECONCILIATION");
    return { ok: issues.length === 0, issues: [...new Set(issues)], deterministic: true, serializable: true, stoppable: true, resumable: true, replayable: true, auditable: true, mutation_endpoints: false, ecology_binding: clone(state.ecology_binding) };
  }

  return Object.freeze({
    getState, start, pause, resume, stop, selectLand, designPond, setResource, setWorkerAvailability, setWaterSourceAvailability, replenishFeed, applyOperatingCost, advanceConstruction,
    fillWater, testWater, stockFish, stockShrimp, feed, startAeration, performWaterExchange, advanceTime,
    processReproduction, processDecomposition, scheduleHealthCheck, harvest, moveToColdStorage, createMarketOrder,
    createDeliveryOrder, advanceDelivery, processPollution, processRestoration, runDroughtScenario, runFloodScenario,
    runPowerOutageScenario, runLowOxygenScenario, evaluateBusinessState, restructure, liquidate, exportState, importState,
    resetState, replayEvents, integrityReport, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    destroy() { listeners.clear(); destroyed = true; }
  });
}
