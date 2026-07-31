import { clone, loadEnvelope, resolveStorage, saveEnvelope, snapshot } from "../civilization/runtime-utils.js";

const SCHEMA_VERSION = "1.0.0";
const STORAGE_KEY = "kaios.world-viewer.causal-runtime.v1";
const MAX_EVENTS = 240;
const STAGES = Object.freeze(["SURVEY", "SITE_CLEARING", "EXCAVATION", "FOUNDATION", "STRUCTURE", "UTILITIES", "INSPECTION", "COMPLETE"]);
export const CIVILIZATION_ORDER = Object.freeze(["PRIMITIVE_FORAGING", "AGRICULTURAL", "URBAN", "INDUSTRIAL", "ELECTRICAL", "INFORMATION", "AI_CIVILIZATION", "SPACEFARING", "INTERSTELLAR", "IMMORTAL_CIVILIZATION", "DEITY_CIVILIZATION", "DIVINE_ARMY_CIVILIZATION"]);

export const UNIT_SYSTEM = Object.freeze({ distance: "meter", time: "second", mass: "kilogram", speed: "meter_per_second", energy: "joule", fuel: "liter", gravity: "meter_per_second_squared" });

export const TERRAIN_PROFILES = Object.freeze({
  PLAIN: { passable: true, walking: 1, vehicle: 1, fuel: 1, construction: 1, wear: 1, cost: 1 },
  HILL: { passable: true, walking: 0.72, vehicle: 0.7, fuel: 1.28, construction: 1.35, wear: 1.25, cost: 1.3 },
  MOUNTAIN: { passable: "LIMITED", walking: 0.42, vehicle: 0.38, fuel: 1.75, construction: 2.2, wear: 1.8, cost: 2 },
  RIVER: { passable: false, walking: 0, vehicle: 0, fuel: 1, construction: 2.4, wear: 1.1, cost: 3 },
  WETLAND: { passable: "LIGHT_ONLY", walking: 0.55, vehicle: 0.25, fuel: 1.55, construction: 2, wear: 1.6, cost: 1.8 },
  URBAN: { passable: true, walking: 0.9, vehicle: 0.62, fuel: 1.18, construction: 1.25, wear: 1.1, cost: 1.4 },
  FOREST: { passable: "CLEARING_REQUIRED", walking: 0.58, vehicle: 0.3, fuel: 1.45, construction: 1.8, wear: 1.5, cost: 1.7 },
  COAST: { passable: "LIMITED", walking: 0.7, vehicle: 0.55, fuel: 1.32, construction: 1.65, wear: 1.35, cost: 1.6 }
});

export const TECHNOLOGY_GATES = Object.freeze({
  PRIMITIVE_FORAGING: ["WALKING", "HAND_TOOL", "SIMPLE_PATH"],
  AGRICULTURAL: ["CART", "BASIC_ROAD", "SIMPLE_BRIDGE"],
  URBAN: ["WAREHOUSE", "ORGANIZED_ROAD", "LARGE_BRIDGE"],
  INDUSTRIAL: ["TRUCK", "EXCAVATOR", "CRANE", "STEEL", "CEMENT", "CONCRETE", "FACTORY_LOGISTICS"],
  ELECTRICAL: ["ELECTRIC_MACHINERY", "GRID_TOOL"],
  INFORMATION: ["ADVANCED_ROUTING", "SENSOR_LOGISTICS", "AUTOMATED_LOGISTICS"]
});

function hash(value) {
  let result = 2166136261;
  for (const character of JSON.stringify(value)) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

function round(value, digits = 3) {
  const power = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * power) / power;
}

function entity(id, type, position, extra = {}) {
  return { id, type, position, status: "READY", created_at: 0, updated_at: 0, source: "SYNTHETIC_DEMONSTRATION", authority: "SIMULATION_ONLY", simulation_only: true, history: [], ...extra };
}

function baseState(seed) {
  const entities = {
    worlds: [entity("WORLD-K280-CAUSAL-001", "WORLD_NODE", { x_m: 0, y_m: 0 }, { label: "K280 Causal Demonstration World" })],
    regions: [entity("REGION-TAIWAN-SYNTHETIC", "REGION", { x_m: 177500, y_m: 0 }, { label: "Taiwan Synthetic Logistics Region" })],
    nodes: [
      entity("NODE-KAOHSIUNG-SYNTHETIC", "CITY", { x_m: 0, y_m: 0 }, { label: "高雄 synthetic city node" }),
      entity("NODE-HSINCHU-SYNTHETIC", "CITY", { x_m: 355000, y_m: 0 }, { label: "新竹 synthetic city node" })
    ],
    parcels: [entity("LAND-PARCEL-FOUNDATION-001", "LAND_PARCEL", { x_m: 2500, y_m: 1200 }, { label: "Synthetic Starter Construction Parcel" })],
    terrain: [
      entity("TERRAIN-SOUTH-PLAIN", "TERRAIN", { x_m: 0, y_m: 0 }, { terrain_class: "PLAIN", length_m: 125000 }),
      entity("TERRAIN-CENTRAL-HILL", "TERRAIN", { x_m: 125000, y_m: 0 }, { terrain_class: "HILL", length_m: 90000 }),
      entity("TERRAIN-NORTH-URBAN", "TERRAIN", { x_m: 215000, y_m: 0 }, { terrain_class: "URBAN", length_m: 140000 })
    ],
    roads: [
      entity("ROAD-KH-01", "ROAD_SEGMENT", { x_m: 0, y_m: 0 }, { from: "NODE-KAOHSIUNG-SYNTHETIC", to: "RIVER-CROSSING-01", length_m: 185000, surface_type: "PAVED", lane_count: 2, speed_limit_mps: 22.22, load_limit_kg: 30000, condition: 92, maintenance_state: "CURRENT", open_or_closed: "OPEN", terrain_class: "PLAIN" }),
      entity("ROAD-KH-02", "ROAD_SEGMENT", { x_m: 185000, y_m: 0 }, { from: "RIVER-CROSSING-01", to: "NODE-HSINCHU-SYNTHETIC", length_m: 170000, surface_type: "PAVED", lane_count: 2, speed_limit_mps: 20, load_limit_kg: 30000, condition: 86, maintenance_state: "CURRENT", open_or_closed: "OPEN", terrain_class: "HILL" })
    ],
    rivers: [entity("RIVER-CROSSING-01", "RIVER_SEGMENT", { x_m: 185000, y_m: 0 }, { width_m: 180, depth_class: "DEEP", flow_class: "MODERATE", crossing_allowed: false, bridge_ids: ["BRIDGE-KH-01"], ferry_ids: [] })],
    bridges: [entity("BRIDGE-KH-01", "BRIDGE", { x_m: 185000, y_m: 0 }, { connected_road_segments: ["ROAD-KH-01", "ROAD-KH-02"], length_m: 260, load_limit_kg: 28000, condition: 88, maintenance_state: "CURRENT", open_or_closed: "OPEN" })],
    vehicles: [entity("VEHICLE-TRUCK-001", "VEHICLE", { x_m: 0, y_m: 0 }, { vehicle_type: "TRUCK", mass_kg: 8200, cargo_capacity_kg: 16000, fuel_capacity_l: 420, fuel_level_l: 320, energy_capacity_j: 1000000000, energy_level_j: 1000000000, energy_type: "DIESEL_SIMULATION", max_speed_mps: 24, road_compatibility: ["PAVED", "GRAVEL"], terrain_compatibility: ["PLAIN", "HILL", "URBAN"], condition: 91, wear: 18, maintenance_interval: 70, technology_requirement: "INDUSTRIAL" })],
    routes: [],
    cargo: [entity("CARGO-STEEL-001", "CARGO", { x_m: 0, y_m: 0 }, { material: "STEEL", mass_kg: 12000 })],
    workers: [
      entity("WORKER-PLAYER-001", "WORKER", { x_m: 0, y_m: 0 }, { life_id: "PLAYER-LIFE-39900E55", skill: "BUILDING_LABORER", stamina: 100, health: 100, shift_hours: 8, wage: 72, availability: "AVAILABLE" }),
      entity("WORKER-AI-001", "WORKER", { x_m: 0, y_m: 0 }, { life_id: "AI-LIFE-14A26A47", skill: "SURVEY_ASSISTANT", stamina: 100, energy: 100, compute: 100, health: 100, shift_hours: 8, wage: 36, availability: "AVAILABLE" })
    ],
    tools: ["HAND_TOOL", "SHOVEL", "CART", "TRUCK", "EXCAVATOR", "CRANE", "CONCRETE_MIXER"].map((tool, index) => entity(`TOOL-${tool}`, "TOOL", { x_m: index, y_m: 0 }, { tool_class: tool, available: true })),
    materials: ["WOOD", "STONE", "SOIL", "SAND", "GRAVEL", "STEEL", "CEMENT", "CONCRETE", "FUEL", "ELECTRICITY"].map((material, index) => entity(`MATERIAL-${material}`, "MATERIAL", { x_m: index, y_m: 1 }, { material_class: material })),
    energy: [entity("ENERGY-SIM-GRID-001", "ENERGY_SOURCE", { x_m: 0, y_m: 0 }, { energy_type: "ELECTRICITY", available_j: 900000000 })],
    maintenance_events: [],
    wear_states: [entity("WEAR-VEHICLE-TRUCK-001", "WEAR_STATE", { x_m: 0, y_m: 0 }, { subject_id: "VEHICLE-TRUCK-001", wear: 18 })],
    deliveries: []
  };
  return {
    schema_version: SCHEMA_VERSION,
    seed,
    mode: "LOCAL_DETERMINISTIC_SIMULATION",
    status: "SIMULATION_ONLY",
    authority: "NO_PRODUCTION_AUTHORITY",
    real_kgen: false,
    real_wallet: false,
    external_autonomy: false,
    exact_gps_history: false,
    units: UNIT_SYSTEM,
    gravity_mps2: 9.80665,
    simulation_time_s: 0,
    revision: 0,
    civilization_stage: "INDUSTRIAL",
    entities,
    inventory: { WOOD: 160, STONE: 240, SOIL: 300, SAND: 180, GRAVEL: 220, STEEL: 120, CEMENT: 100, CONCRETE: 0, FUEL: 900, ELECTRICITY: 900000000 },
    accounts: { CUSTOMER_BUDGET: 50000, CARRIER: 0, PLAYER: 0, AI: 0, HOUSEHOLD: 0, OPERATING_COST: 0, MATERIAL_VENDOR: 0 },
    ledger: [],
    active_delivery: null,
    route_evaluation: null,
    project: entity("PROJECT-HOUSE-FOUNDATION-001", "CONSTRUCTION_PROJECT", { x_m: 2500, y_m: 1200 }, { project_type: "BASIC_HOUSE_FOUNDATION", stage: "SURVEY", stage_index: 0, progress_s: 0, status: "READY", access_route: true, technology_requirement: "INDUSTRIAL", completed_stages: [] }),
    events: []
  };
}

function coreForHash(state) {
  const copy = clone(state);
  copy.events = [];
  return copy;
}

function event(state, actor, action, inputs, outputs, cost, status, reason, previousHash) {
  const record = { event_id: `CAUSAL-EVENT-${String(state.revision).padStart(6, "0")}`, time: state.simulation_time_s, actor, action, inputs: clone(inputs), outputs: clone(outputs), cost: round(cost, 2), status, reason, previous_state_hash: previousHash, next_state_hash: hash(coreForHash(state)) };
  state.events.push(record);
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
  return record;
}

function mutate(state, actor, action, inputs, operation) {
  const previousHash = hash(coreForHash(state));
  const result = operation();
  state.revision += 1;
  event(state, actor, action, inputs, result.outputs ?? result, result.cost ?? 0, result.status ?? "COMPLETED", result.reason ?? null, previousHash);
  return result;
}

function technologyAvailable(stage, required) {
  return CIVILIZATION_ORDER.indexOf(stage) >= CIVILIZATION_ORDER.indexOf(required);
}

function routeResult(state, options = {}) {
  const vehicle = clone(state.entities.vehicles[0]);
  const cargo = clone(state.entities.cargo[0]);
  const roads = clone(state.entities.roads);
  const bridge = clone(state.entities.bridges[0]);
  const river = clone(state.entities.rivers[0]);
  if (options.no_bridge) river.bridge_ids = [];
  if (options.bridge_load_limit_kg !== undefined) bridge.load_limit_kg = options.bridge_load_limit_kg;
  if (options.bridge_closed) bridge.open_or_closed = "CLOSED";
  if (options.road_closed) roads[1].open_or_closed = "CLOSED";
  if (options.road_load_limit_kg !== undefined) roads[1].load_limit_kg = options.road_load_limit_kg;
  if (options.fuel_level_l !== undefined) vehicle.fuel_level_l = options.fuel_level_l;
  if (options.vehicle_wear !== undefined) vehicle.wear = options.vehicle_wear;
  if (options.no_route) roads.length = 0;
  if (options.vehicle_not_compatible) vehicle.road_compatibility = [];
  if (options.electric || options.energy_type === "ELECTRIC") {
    vehicle.energy_type = "ELECTRIC";
    vehicle.energy_level_j = Number(options.energy_level_j ?? 0);
  }
  const totalMass = vehicle.mass_kg + cargo.mass_kg;
  const requiredTechnology = vehicle.technology_requirement;
  let blockReason = null;
  if (!technologyAvailable(options.civilization_stage ?? state.civilization_stage, requiredTechnology)) blockReason = "TECHNOLOGY_NOT_AVAILABLE";
  else if (!roads.length) blockReason = "NO_ROUTE";
  else if ([options.terrain_class, options.terrain_override].includes("RIVER") || ([options.terrain_class, options.terrain_override].includes("WETLAND") && totalMass > 10000)) blockReason = "TERRAIN_NOT_PASSABLE";
  else if (roads.some(({ open_or_closed }) => open_or_closed !== "OPEN")) blockReason = "ROAD_CLOSED";
  else if (roads.some(({ load_limit_kg }) => totalMass > load_limit_kg)) blockReason = "ROAD_LOAD_LIMIT";
  else if (!river.bridge_ids.length && !river.ferry_ids.length) blockReason = "RIVER_WITHOUT_BRIDGE";
  else if (bridge.open_or_closed !== "OPEN") blockReason = "BRIDGE_CLOSED";
  else if (totalMass > bridge.load_limit_kg) blockReason = "BRIDGE_LOAD_LIMIT";
  else if (!roads.every(({ surface_type }) => vehicle.road_compatibility.includes(surface_type))) blockReason = "VEHICLE_NOT_COMPATIBLE";
  const distanceM = roads.reduce((sum, road) => sum + road.length_m, 0) + bridge.length_m;
  const terrainFuel = roads.reduce((sum, road) => sum + TERRAIN_PROFILES[road.terrain_class].fuel * road.length_m, 0) / Math.max(1, roads.reduce((sum, road) => sum + road.length_m, 0));
  const massFactor = 1 + cargo.mass_kg / vehicle.cargo_capacity_kg * 0.35;
  const gravityFactor = state.gravity_mps2 / 9.80665;
  const conditionFactor = 1 + roads.reduce((sum, road) => sum + (100 - road.condition), 0) / Math.max(1, roads.length) / 180;
  const fuelRequired = round(distanceM * 0.00028 * terrainFuel * massFactor * gravityFactor * conditionFactor, 3);
  const energyRequiredJ = round(distanceM * totalMass * gravityFactor * 0.012, 0);
  if (!blockReason && vehicle.energy_type === "ELECTRIC" && vehicle.energy_level_j < energyRequiredJ) blockReason = "ENERGY_DEPLETED";
  if (!blockReason && vehicle.energy_type !== "ELECTRIC" && vehicle.fuel_level_l < fuelRequired) blockReason = "INSUFFICIENT_FUEL";
  const travelTime = round(roads.reduce((sum, road) => sum + road.length_m / Math.min(vehicle.max_speed_mps, road.speed_limit_mps * TERRAIN_PROFILES[road.terrain_class].vehicle), 0), 0);
  const timing = { loading_time_s: 3600, travel_time_s: travelTime, unloading_time_s: 2400, rest_time_s: distanceM > 200000 ? 1800 : 0, traffic_delay_s: 1200, terrain_delay_s: 1800, bridge_delay_s: 300, maintenance_delay_s: vehicle.wear >= vehicle.maintenance_interval ? 1800 : 0 };
  const totalTime = Object.values(timing).reduce((sum, value) => sum + value, 0);
  const wearGenerated = round(distanceM / 100000 * massFactor * terrainFuel * conditionFactor, 3);
  return {
    route_id: `ROUTE-KH-${hash({ options, seed: state.seed })}`,
    origin: "NODE-KAOHSIUNG-SYNTHETIC",
    destination: "NODE-HSINCHU-SYNTHETIC",
    distance_m: distanceM,
    estimated_time_s: totalTime,
    timing,
    fuel_required_l: fuelRequired,
    wear_generated: wearGenerated,
    blocked: Boolean(blockReason),
    block_reason: blockReason,
    required_infrastructure: blockReason === "RIVER_WITHOUT_BRIDGE" ? ["BRIDGE_OR_FERRY"] : blockReason === "ENERGY_DEPLETED" ? ["RECHARGE_REQUIRED"] : blockReason === "INSUFFICIENT_FUEL" ? ["REFUEL_REQUIRED"] : [],
    segments: [...roads.map(({ id }) => id), bridge.id],
    total_mass_kg: totalMass,
    energy_required_j: energyRequiredJ,
    vehicle,
    cargo,
    engineering_precision: "BOUNDED_DETERMINISTIC_APPROXIMATION"
  };
}

const STAGE_REQUIREMENTS = Object.freeze({
  SURVEY: { time_s: 7200, materials: {}, tools: ["HAND_TOOL"], workers: ["SURVEY_ASSISTANT"], energy_j: 10000 },
  SITE_CLEARING: { time_s: 14400, materials: { WOOD: 5 }, tools: ["SHOVEL"], workers: ["BUILDING_LABORER"], energy_j: 20000 },
  EXCAVATION: { time_s: 21600, materials: { FUEL: 8 }, tools: ["EXCAVATOR"], workers: ["BUILDING_LABORER"], energy_j: 120000 },
  FOUNDATION: { time_s: 28800, materials: { STEEL: 20, CEMENT: 25, SAND: 30, GRAVEL: 30 }, tools: ["CONCRETE_MIXER"], workers: ["BUILDING_LABORER"], energy_j: 180000 },
  STRUCTURE: { time_s: 36000, materials: { WOOD: 40, STEEL: 20, STONE: 25 }, tools: ["CRANE"], workers: ["BUILDING_LABORER"], energy_j: 240000 },
  UTILITIES: { time_s: 18000, materials: { STEEL: 5, ELECTRICITY: 50000 }, tools: ["HAND_TOOL"], workers: ["BUILDING_LABORER"], energy_j: 100000 },
  INSPECTION: { time_s: 7200, materials: {}, tools: ["HAND_TOOL"], workers: ["SURVEY_ASSISTANT"], energy_j: 5000 }
});

function projectBlock(state) {
  const project = state.project;
  if (project.stage === "COMPLETE") return "PROJECT_COMPLETE";
  const requirements = STAGE_REQUIREMENTS[project.stage];
  if (!technologyAvailable(state.civilization_stage, project.technology_requirement)) return "BLOCKED_TECHNOLOGY";
  if (!project.access_route) return "BLOCKED_ACCESS";
  for (const [material, amount] of Object.entries(requirements.materials)) if ((state.inventory[material] ?? 0) < amount) return `BLOCKED_MATERIAL:${material}`;
  for (const tool of requirements.tools) if (!state.entities.tools.some((candidate) => candidate.tool_class === tool && candidate.available)) return `BLOCKED_TOOL:${tool}`;
  for (const skill of requirements.workers) if (!state.entities.workers.some((worker) => worker.skill === skill && worker.availability === "AVAILABLE")) return "BLOCKED_LABOR";
  if ((state.entities.energy[0].available_j ?? 0) < requirements.energy_j) return "BLOCKED_ENERGY";
  return null;
}

function transfer(state, type, amount, debit, credit, contract) {
  if (!Number.isFinite(amount) || amount <= 0 || (state.accounts[debit] ?? 0) < amount) throw new Error("UNBALANCED_OR_UNFUNDED_TRANSACTION");
  state.accounts[debit] = round(state.accounts[debit] - amount, 2);
  state.accounts[credit] = round(state.accounts[credit] + amount, 2);
  state.ledger.push({ transaction_id: `CAUSAL-TX-${String(state.ledger.length + 1).padStart(5, "0")}`, type, amount, debit, credit, contract, balanced: true, simulation_only: true });
}

export function createCausalWorldRuntime({ seed = "KAIOS-CAUSAL-WORLD-001", storage, storageKey = STORAGE_KEY } = {}) {
  const storageRef = resolveStorage(storage);
  const initial = baseState(String(seed));
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state?.mode === "LOCAL_DETERMINISTIC_SIMULATION");
  let state = restored ? clone(restored.state) : initial;
  let running = false;
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const getSnapshot = () => snapshot(state);

  function evaluateRoute(options = {}) {
    const result = routeResult(state, options);
    state.route_evaluation = result;
    return snapshot(result);
  }

  function startDelivery(options = {}) {
    return snapshot(mutate(state, "KAIOS_CUSTOMER", "START_DELIVERY", options, () => {
      const route = routeResult(state, options);
      state.route_evaluation = route;
      if (route.blocked) return { status: "BLOCKED", reason: route.block_reason, outputs: route };
      state.active_delivery = { delivery_order_id: "DELIVERY-KH-STEEL-001", route_id: route.route_id, status: "IN_PROGRESS", elapsed_s: 0, remaining_s: route.estimated_time_s, phase: "LOADING", customer_budget: 12000, carrier_revenue: 0, operating_cost: 0, profit_or_loss: 0 };
      Object.assign(state.entities.vehicles[0], { energy_type: route.vehicle.energy_type, energy_level_j: route.vehicle.energy_level_j });
      state.entities.routes = [entity(route.route_id, "ROUTE", { x_m: 177500, y_m: 0 }, route)];
      state.entities.deliveries = [entity("DELIVERY-KH-STEEL-001", "DELIVERY_ORDER", { x_m: 0, y_m: 0 }, state.active_delivery)];
      running = true;
      return { status: "IN_PROGRESS", outputs: state.active_delivery };
    }));
  }

  function advanceTime(seconds = 3600) {
    return snapshot(mutate(state, "CAUSAL_CLOCK", "ADVANCE_TIME", { seconds }, () => {
      if (!running || !state.active_delivery) return { status: "PAUSED", reason: "NO_ACTIVE_DELIVERY", outputs: { advanced_s: 0 } };
      const step = Math.max(1, Math.min(86400, Number(seconds) || 0));
      const route = state.route_evaluation;
      state.simulation_time_s += step;
      state.active_delivery.elapsed_s += step;
      state.active_delivery.remaining_s = Math.max(0, state.active_delivery.remaining_s - step);
      const vehicle = state.entities.vehicles[0];
      const progress = Math.min(1, state.active_delivery.elapsed_s / route.estimated_time_s);
      const nextWear = round(route.vehicle.wear + route.wear_generated * progress, 3);
      vehicle.wear = nextWear;
      state.entities.wear_states[0].wear = nextWear;
      state.entities.wear_states[0].updated_at = state.simulation_time_s;
      if (route.vehicle.energy_type === "ELECTRIC") vehicle.energy_level_j = Math.max(0, round(route.vehicle.energy_level_j - route.energy_required_j * progress, 0));
      else vehicle.fuel_level_l = round(route.vehicle.fuel_level_l - route.fuel_required_l * progress, 3);
      const hours = step / 3600;
      const player = state.entities.workers.find(({ skill }) => skill === "BUILDING_LABORER");
      const ai = state.entities.workers.find(({ skill }) => skill === "SURVEY_ASSISTANT");
      player.stamina = Math.max(0, round(player.stamina - hours * 1.5, 2));
      ai.energy = Math.max(0, round(ai.energy - hours * 2, 2));
      ai.compute = Math.max(0, round(ai.compute - hours, 2));
      if (nextWear >= 100) {
        vehicle.status = "BROKEN";
        state.active_delivery.status = "PAUSED_MAINTENANCE";
        state.active_delivery.phase = "MAINTENANCE_REQUIRED";
        running = false;
        return { status: "PAUSED_MAINTENANCE", reason: "VEHICLE_BROKEN", outputs: state.active_delivery };
      }
      if (state.active_delivery.remaining_s === 0) {
        vehicle.status = nextWear >= vehicle.maintenance_interval ? "MAINTENANCE_REQUIRED" : "READY";
        state.active_delivery.status = "DELIVERED";
        state.active_delivery.phase = "COMPLETE";
        const fuelCost = round(route.fuel_required_l * 1.2, 2);
        const wages = 108;
        const maintenance = round(route.wear_generated * 9, 2);
        const storage = 35;
        const delay = round((route.timing.traffic_delay_s + route.timing.terrain_delay_s) / 3600 * 18, 2);
        const operating = round(fuelCost + wages + maintenance + storage + delay, 2);
        const revenue = 1200;
        transfer(state, "CARRIER_REVENUE", revenue, "CUSTOMER_BUDGET", "CARRIER", "DELIVERY-CONTRACT-001");
        transfer(state, "PLAYER_PAYROLL", 72, "CARRIER", "PLAYER", "EMPLOYMENT-CONTRACT-001");
        transfer(state, "AI_PAYROLL", 36, "CARRIER", "AI", "EMPLOYMENT-CONTRACT-001");
        transfer(state, "OPERATING_COST", round(operating - wages, 2), "CARRIER", "OPERATING_COST", "DELIVERY-CONTRACT-001");
        state.active_delivery.carrier_revenue = revenue;
        state.active_delivery.worker_payroll = wages;
        state.active_delivery.operating_cost = operating;
        state.active_delivery.profit_or_loss = round(revenue - operating, 2);
        state.active_delivery.cost_breakdown = { fuel_cost: fuelCost, energy_cost: 0, worker_wages: wages, tool_rental: 0, vehicle_maintenance: maintenance, material_cost: 0, road_toll: 0, bridge_fee: 0, storage_cost: storage, delay_cost: delay };
        Object.assign(state.entities.deliveries[0], state.active_delivery, { updated_at: state.simulation_time_s });
        running = false;
        return { status: "DELIVERED", cost: operating, outputs: state.active_delivery };
      }
      state.active_delivery.phase = state.active_delivery.elapsed_s < route.timing.loading_time_s ? "LOADING" : "IN_TRANSIT";
      vehicle.status = state.active_delivery.phase;
      return { status: "IN_PROGRESS", outputs: state.active_delivery };
    }));
  }

  function pause() { running = false; return getSnapshot(); }
  function resume() { if (state.active_delivery?.status === "IN_PROGRESS") running = true; return getSnapshot(); }
  function refuel(liters = 100) {
    return snapshot(mutate(state, "OPERATOR", "REFUEL", { liters }, () => {
      const vehicle = state.entities.vehicles[0];
      const amount = Math.min(Math.max(0, Number(liters) || 0), vehicle.fuel_capacity_l - vehicle.fuel_level_l);
      if (state.inventory.FUEL < amount) return { status: "BLOCKED", reason: "NO_FUEL_INVENTORY", outputs: { liters: 0 } };
      state.inventory.FUEL -= amount;
      vehicle.fuel_level_l = round(vehicle.fuel_level_l + amount, 3);
      return { status: "COMPLETED", cost: round(amount * 1.2, 2), outputs: { liters: amount } };
    }));
  }

  function recharge(joules = 100000000) {
    return snapshot(mutate(state, "OPERATOR", "RECHARGE", { joules }, () => {
      const vehicle = state.entities.vehicles[0];
      if (vehicle.energy_type !== "ELECTRIC") return { status: "BLOCKED", reason: "RECHARGE_NOT_APPLICABLE", outputs: { joules: 0 } };
      const amount = Math.min(Math.max(0, Number(joules) || 0), vehicle.energy_capacity_j - vehicle.energy_level_j, state.entities.energy[0].available_j);
      if (amount <= 0) return { status: "BLOCKED", reason: "NO_ENERGY_AVAILABLE", outputs: { joules: 0 } };
      state.entities.energy[0].available_j -= amount;
      vehicle.energy_level_j += amount;
      if (state.route_evaluation?.vehicle?.energy_type === "ELECTRIC") state.route_evaluation.vehicle.energy_level_j = vehicle.energy_level_j;
      return { status: "COMPLETED", cost: round(amount / 10000000, 2), outputs: { joules: amount } };
    }));
  }

  function maintainVehicle() {
    return snapshot(mutate(state, "MECHANIC", "VEHICLE_MAINTENANCE", {}, () => {
      const vehicle = state.entities.vehicles[0];
      if (state.inventory.STEEL < 2 || state.inventory.FUEL < 1) return { status: "BLOCKED", reason: "MAINTENANCE_INPUT_MISSING", outputs: {} };
      state.inventory.STEEL -= 2;
      state.inventory.FUEL -= 1;
      vehicle.wear = Math.max(10, round(vehicle.wear - 55, 3));
      vehicle.condition = Math.min(100, vehicle.condition + 8);
      vehicle.status = "READY";
      state.entities.wear_states[0].wear = vehicle.wear;
      state.entities.maintenance_events.push(entity(`MAINTENANCE-${String(state.entities.maintenance_events.length + 1).padStart(4, "0")}`, "MAINTENANCE_EVENT", clone(vehicle.position), { subject_id: vehicle.id, cost: 75, result: "RESTORED" }));
      if (state.active_delivery?.status === "PAUSED_MAINTENANCE") {
        state.active_delivery.status = "IN_PROGRESS";
        state.active_delivery.phase = "IN_TRANSIT";
        state.route_evaluation.vehicle.wear = vehicle.wear;
        running = true;
      }
      return { status: "COMPLETED", cost: 75, outputs: { wear: vehicle.wear } };
    }));
  }

  function advanceProject(seconds = 3600) {
    return snapshot(mutate(state, "PLAYER_AI_WORK_TEAM", "ADVANCE_CONSTRUCTION", { seconds }, () => {
      const block = projectBlock(state);
      if (block) { state.project.status = "BLOCKED"; return { status: "BLOCKED", reason: block, outputs: { stage: state.project.stage } }; }
      const requirements = STAGE_REQUIREMENTS[state.project.stage];
      const step = Math.max(1, Math.min(21600, Number(seconds) || 0));
      state.simulation_time_s += step;
      state.project.status = "IN_PROGRESS";
      state.project.progress_s += step;
      state.entities.workers.find(({ skill }) => skill === "BUILDING_LABORER").stamina = Math.max(0, state.entities.workers.find(({ skill }) => skill === "BUILDING_LABORER").stamina - step / 3600 * 4);
      state.entities.workers.find(({ skill }) => skill === "SURVEY_ASSISTANT").stamina = Math.max(0, state.entities.workers.find(({ skill }) => skill === "SURVEY_ASSISTANT").stamina - step / 3600 * 2);
      if (state.project.progress_s < requirements.time_s) return { status: "IN_PROGRESS", outputs: { stage: state.project.stage, progress_s: state.project.progress_s, required_s: requirements.time_s } };
      for (const [material, amount] of Object.entries(requirements.materials)) state.inventory[material] -= amount;
      state.entities.energy[0].available_j -= requirements.energy_j;
      state.project.completed_stages.push(state.project.stage);
      state.project.stage_index += 1;
      state.project.stage = STAGES[state.project.stage_index];
      state.project.progress_s = 0;
      state.project.status = state.project.stage === "COMPLETE" ? "COMPLETE" : "READY";
      transfer(state, "CONSTRUCTION_MATERIAL_AND_TOOL_COST", 15, "CUSTOMER_BUDGET", "MATERIAL_VENDOR", "CONSTRUCTION-CONTRACT-001");
      if (state.project.stage === "COMPLETE") {
        transfer(state, "CONSTRUCTION_PLAYER_PAYROLL", 72, "CUSTOMER_BUDGET", "PLAYER", "CONSTRUCTION-CONTRACT-001");
        transfer(state, "CONSTRUCTION_AI_PAYROLL", 36, "CUSTOMER_BUDGET", "AI", "CONSTRUCTION-CONTRACT-001");
      }
      return { status: state.project.status, cost: 108, outputs: { completed_stage: state.project.completed_stages.at(-1), next_stage: state.project.stage } };
    }));
  }

  function setGravity(value) {
    const gravity = Number(value);
    if (!Number.isFinite(gravity) || gravity <= 0 || gravity > 40) throw new Error("INVALID_GRAVITY");
    state.gravity_mps2 = gravity;
    return getSnapshot();
  }

  function exportState() { return JSON.stringify({ export_status: "NON_AUTHORITATIVE_SIMULATION", schema_version: SCHEMA_VERSION, state }, null, 2); }
  function importState(serialized) {
    const parsed = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    const candidate = parsed?.state ?? parsed;
    if (candidate?.mode !== "LOCAL_DETERMINISTIC_SIMULATION" || candidate?.real_kgen || candidate?.real_wallet || candidate?.authority !== "NO_PRODUCTION_AUTHORITY") throw new Error("SIMULATION_BOUNDARY_VIOLATION");
    state = clone(candidate); running = false; persist(); return getSnapshot();
  }
  function reset() { state = baseState(String(seed)); running = false; if (storageRef) storageRef.removeItem(storageKey); return getSnapshot(); }
  function save() { persist(); return getSnapshot(); }
  function replay() { return snapshot(state.events); }
  function isRunning() { return running; }
  function integrityReport() {
    const issues = [];
    if (state.real_kgen || state.real_wallet || state.authority !== "NO_PRODUCTION_AUTHORITY") issues.push("AUTHORITY_BOUNDARY");
    if (!Object.values(state.ledger).every((entry) => entry.balanced && entry.debit !== entry.credit)) issues.push("LEDGER_UNBALANCED");
    if (state.events.some((entry) => !entry.previous_state_hash || !entry.next_state_hash)) issues.push("EVENT_HASH_MISSING");
    if (!STAGES.includes(state.project.stage)) issues.push("PROJECT_STAGE_INVALID");
    return snapshot({ ok: issues.length === 0, issues, runtime: "REAL_CAUSAL_WORLD_FOUNDATION", simulation_only: true });
  }

  return Object.freeze({ getSnapshot, evaluateRoute, startDelivery, advanceTime, pause, resume, refuel, recharge, maintainVehicle, advanceProject, setGravity, exportState, importState, reset, save, replay, isRunning, integrityReport });
}

export function createDemonstrationBranches() {
  const valid = createCausalWorldRuntime().evaluateRoute();
  const river = createCausalWorldRuntime().evaluateRoute({ no_bridge: true });
  const bridge = createCausalWorldRuntime().evaluateRoute({ bridge_load_limit_kg: 15000 });
  const fuel = createCausalWorldRuntime().evaluateRoute({ fuel_level_l: 10 });
  const wearRuntime = createCausalWorldRuntime();
  wearRuntime.startDelivery({ vehicle_wear: 99.9 });
  const wear = wearRuntime.advanceTime(7200);
  return snapshot({ valid, river, bridge, fuel, wear });
}
