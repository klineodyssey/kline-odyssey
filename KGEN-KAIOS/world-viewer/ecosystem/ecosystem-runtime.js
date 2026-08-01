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

const RUNTIME = "EcosystemRuntime";
const SCHEMA_VERSION = "2.0.0";
const MAX_EVENTS = 180;
const TROPHIC_ROLES = new Set(["PRODUCER", "HERBIVORE", "CARNIVORE", "OMNIVORE", "PREDATOR", "SCAVENGER", "DECOMPOSER"]);

function initialState(config) {
  return {
    revision: 0,
    elapsed_hours: 0,
    species: config.species_catalog.map((species) => ({
      ...species,
      initial_population: species.population,
      status: species.population > 0 ? "ACTIVE" : "EXTINCT",
      population_revision: 0
    })),
    energy_flow: {
      producer_input: 0,
      agriculture_input: 0,
      consumer_demand: 0,
      transferred: 0,
      decomposer_recovery: 0,
      balance: 0
    },
    food_chain_status: "BALANCED",
    events: []
  };
}

function restore(candidate, fallback) {
  if (!candidate || !Array.isArray(candidate.species)) return fallback;
  const source = new Map(candidate.species.map((species) => [species.species_id, species]));
  return {
    ...fallback,
    ...candidate,
    species: fallback.species.map((species) => ({ ...species, ...(source.get(species.species_id) ?? {}) })),
    energy_flow: { ...fallback.energy_flow, ...(candidate.energy_flow ?? {}) },
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

function sumWarehouse(warehouse) {
  return Object.values(warehouse ?? {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

function foodAvailable(species, populations) {
  if (species.trophic_role === "PRODUCER" || species.trophic_role === "DECOMPOSER") return true;
  return species.food_sources.some((sourceId) => sourceId === "SOLAR_ENERGY" || (populations.get(sourceId) ?? 0) > 0);
}

export function createEcosystemRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.ecosystem.v1"
} = {}) {
  if (!config || !Array.isArray(config.species_catalog) || !Array.isArray(config.evolution_stages)) {
    throw new TypeError("Ecosystem Runtime requires the Sprint 005 production fixture");
  }
  const storageRef = resolveStorage(storage);
  const defaults = initialState(config);
  let state = defaults;
  let destroyed = false;
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.species));
  if (saved) state = restore(saved.state, defaults);

  const lineage = config.evolution_stages.map((stage) => ({ ...stage }));
  const getSnapshot = () => {
    const active = state.species.filter(({ status }) => status === "ACTIVE");
    const totalPopulation = active.reduce((sum, species) => sum + species.population, 0);
    const averageHealth = active.length
      ? active.reduce((sum, species) => sum + species.health, 0) / active.length
      : 0;
    const roleCounts = Object.fromEntries([...TROPHIC_ROLES].map((role) => [role, active.filter((species) => species.trophic_role === role).length]));
    const producerPopulation = active.filter(({ trophic_role: role }) => role === "PRODUCER").reduce((sum, species) => sum + species.population, 0);
    const consumerPopulation = active.filter(({ trophic_role: role }) => !["PRODUCER", "DECOMPOSER"].includes(role)).reduce((sum, species) => sum + species.population, 0);
    return snapshot({
      runtime: "CAMBRIAN_ECOSYSTEM_ALPHA",
      schema_version: SCHEMA_VERSION,
      synthetic: true,
      current_evolution_stage: config.current_evolution_stage,
      lineage,
      species: state.species,
      food_chain_status: state.food_chain_status,
      energy_flow: state.energy_flow,
      biodiversity: active.length,
      total_population: totalPopulation,
      average_health: averageHealth,
      population_balance: {
        role_counts: roleCounts,
        producer_population: producerPopulation,
        consumer_population: consumerPopulation,
        producer_consumer_ratio: consumerPopulation > 0 ? producerPopulation / consumerPopulation : producerPopulation,
        status: state.food_chain_status
      },
      elapsed_hours: state.elapsed_hours,
      revision: state.revision,
      events: state.events
    });
  };
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Ecosystem Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, { event_id: stableId("ecosystem", state.revision), type, ...details }, MAX_EVENTS);
  }

  function advance({
    elapsedHours = 1,
    environment = {},
    agricultureWarehouse = {}
  } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) {
      throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Ecosystem advance must be 0-720 hours");
    }
    const days = hours / 24;
    const oxygenAvailable = environment.oxygen_available !== false;
    const waterAvailable = environment.water_available !== false;
    const temperatureCompatible = environment.temperature_compatible !== false;
    const populations = new Map(state.species.map((species) => [species.species_id, species.population]));
    const producers = state.species.filter(({ trophic_role: role, status }) => role === "PRODUCER" && status === "ACTIVE");
    const consumers = state.species.filter(({ trophic_role: role, status }) => !["PRODUCER", "DECOMPOSER"].includes(role) && status === "ACTIVE");
    const decomposers = state.species.filter(({ trophic_role: role, status }) => role === "DECOMPOSER" && status === "ACTIVE");
    const producerInput = producers.reduce((sum, species) => sum + species.population * 0.018 * days, 0);
    const agricultureInput = sumWarehouse(agricultureWarehouse) * 0.12 * days;
    const consumerDemand = consumers.reduce((sum, species) => sum + species.population * species.energy_cost * 0.006 * days, 0);
    const availableEnergy = producerInput + agricultureInput;
    const foodRatio = consumerDemand > 0 ? Math.min(1, availableEnergy / consumerDemand) : 1;
    const transferred = Math.min(availableEnergy, consumerDemand);
    const decomposerRecovery = Math.min(
      Math.max(0, consumerDemand - transferred) * 0.18,
      decomposers.reduce((sum, species) => sum + species.population * 0.002 * days, 0)
    );

    for (const species of state.species) {
      if (species.status === "EXTINCT") continue;
      let stress = 0;
      if (species.water_required && !waterAvailable) stress += 34 * days;
      if (species.oxygen_required && !oxygenAvailable) stress += 42 * days;
      if (!temperatureCompatible) stress += 18 * days;
      if (!foodAvailable(species, populations)) stress += 28 * days;
      if (!["PRODUCER", "DECOMPOSER"].includes(species.trophic_role) && foodRatio < 0.75) {
        stress += (0.75 - foodRatio) * 28 * days;
      }
      const recovery = stress === 0 ? 0.65 * days : 0;
      species.health = clamp(species.health + recovery - stress);
      const baseGrowth = {
        PRODUCER: 0.006,
        HERBIVORE: 0.0025,
        CARNIVORE: 0.0015,
        PREDATOR: 0.001,
        OMNIVORE: 0.002,
        SCAVENGER: 0.0025,
        DECOMPOSER: 0.004
      }[species.trophic_role] ?? 0;
      const healthFactor = species.health / 100;
      const changeRate = species.health <= 0
        ? -0.35 * days
        : species.health < 25
          ? -0.08 * days
          : baseGrowth * healthFactor * days;
      const projectedPopulation = species.population * (1 + changeRate);
      species.population = Math.max(0, species.health <= 0 ? Math.floor(projectedPopulation) : Math.round(projectedPopulation));
      species.status = species.population > 0 ? "ACTIVE" : "EXTINCT";
      species.population_revision += 1;
    }

    state.elapsed_hours += hours;
    state.energy_flow = {
      producer_input: producerInput,
      agriculture_input: agricultureInput,
      consumer_demand: consumerDemand,
      transferred,
      decomposer_recovery: decomposerRecovery,
      balance: Math.max(0, availableEnergy - transferred + decomposerRecovery)
    };
    state.food_chain_status = foodRatio >= 0.85
      ? "BALANCED"
      : foodRatio >= 0.5
        ? "CONSTRAINED"
        : "COLLAPSE_RISK";
    record("ECOSYSTEM_ADVANCED", {
      elapsed_hours: hours,
      food_chain_status: state.food_chain_status,
      oxygen_available: oxygenAvailable,
      water_available: waterAvailable
    });
    persist();
    notifier.emit("ECOSYSTEM_ADVANCED", { elapsed_hours: hours });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const ids = new Set();
    for (const species of state.species) {
      if (ids.has(species.species_id)) issues.push(`${species.species_id}: duplicate species`);
      ids.add(species.species_id);
      if (!TROPHIC_ROLES.has(species.trophic_role)) issues.push(`${species.species_id}: invalid trophic role`);
      if (!Number.isInteger(species.population) || species.population < 0) issues.push(`${species.species_id}: invalid population`);
      if (!Number.isFinite(species.health) || species.health < 0 || species.health > 100) issues.push(`${species.species_id}: invalid health`);
      for (const field of ["body_profile_id", "species_os_id", "life_os_profile_id", "dna_summary_id"]) {
        if (!species[field]) issues.push(`${species.species_id}: missing ${field}`);
      }
    }
    if (lineage.length !== 11 || lineage.at(-1)?.stage_id !== "AI_CIVILIZATION") issues.push("evolution lineage is incomplete");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    return snapshot({
      ok: issues.length === 0,
      runtime: "CAMBRIAN_ECOSYSTEM_ALPHA",
      species_count: state.species.length,
      total_population: getSnapshot().total_population,
      issues
    });
  }

  return Object.freeze({
    getSnapshot,
    advance,
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

const ECOLOGY_V1 = "KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1";
const ECOLOGY_SCHEMA = "1.0.0";
const ECOLOGY_MAX_EVENTS = 1000;
const ECOLOGY_MAX_TICKS = 10000;
const ECOLOGY_MAX_POPULATION = 500;
const ECOLOGY_HABITAT_TYPES = new Set(["GRASSLAND", "FOREST", "FISHPOND", "RIVER_HABITAT", "WETLAND", "SOIL_HABITAT", "MOUNTAIN_WATERSHED"]);
const ECOLOGY_POPULATION_STATUSES = new Set(["STABLE", "GROWING", "DECLINING", "OVER_CAPACITY", "RESOURCE_STRESSED", "DISEASE_STRESSED", "POLLUTION_STRESSED", "COLLAPSING", "EXTINCT_LOCAL", "RECOVERING"]);
const ECOLOGY_HABITAT_FIELDS = new Set(["id", "type", "location", "simulation_time", "status", "source", "authority", "simulation_only", "history", "previous_state_hash", "next_state_hash", "area_m2", "water_l", "temperature_c", "soil_fertility", "oxygen_mg_l", "salinity_ppt", "pollution", "shelter", "season", "restoration_state", "flow_status"]);
const ECOLOGY_POPULATION_FIELDS = new Set(["population_id", "species_id", "habitat_id", "count", "age_distribution", "sex_distribution", "health_distribution", "energy_reserve", "food_requirement", "water_requirement", "space_requirement", "birth_rate", "death_rate", "migration_rate", "disease_rate", "predation_rate", "carrying_capacity", "genetic_diversity_proxy", "generation", "population_status", "reproduction_modes", "cooldown_ticks", "traits"]);
const ECOLOGY_RESOURCE_FIELDS = new Set(["water_l", "atmospheric_water_l", "exported_water_l", "restoration_water_reserve_l", "mountain_snowpack_l", "biomass_kg", "consumer_biomass_kg", "exported_biomass_kg", "nutrients_kg", "restoration_nutrient_reserve_kg", "dead_biomass_kg", "decomposition_kg", "aquatic_primary_food_kg", "detritus_kg", "sediment_kg", "energy_proxy"]);
const ECOLOGY_BOUNDARY_FIELDS = new Set(["simulation_only", "wallet", "real_kgen", "onchain_transfer", "real_bioengineering", "production_authority", "automatic_new_species", "uncontrolled_reproduction", "public_mutation_endpoints", "maximum_total_population"]);
const ECOLOGY_SPECIES = new Set(["SPECIES-KAIOS-FOUNDATIONAL-GRASS", "SPECIES-KAIOS-FOUNDATIONAL-TREE", "SPECIES-KAIOS-FOUNDATIONAL-FISH", "SPECIES-KAIOS-FOUNDATIONAL-SHRIMP", "SPECIES-KAIOS-FOUNDATIONAL-MOUNTAIN", "SPECIES-KAIOS-FOUNDATIONAL-SOIL", "SPECIES-KAIOS-FOUNDATIONAL-WATER", "SPECIES-KAIOS-FOUNDATIONAL-RIVER"]);
const ECOLOGY_REPRODUCTION_MODES = new Set(["SEED_PROPAGATION", "VEGETATIVE_PROPAGATION", "SEXUAL_REPRODUCTION", "SPAWNING", "LARVAL_DEVELOPMENT", "NATURAL_FORMATION_CHANGE", "NO_REPRODUCTION"]);
const ECOLOGY_ENTITY_TYPES = new Set(["ECOSYSTEM", "HABITAT", "POPULATION", "SPECIES_POPULATION", "FOOD_RELATION", "RESOURCE_POOL", "WATER_POOL", "SOIL_POOL", "NUTRIENT_POOL", "DECOMPOSITION_POOL", "CARRYING_CAPACITY", "REPRODUCTION_EVENT", "BIRTH_EVENT", "DEATH_EVENT", "MIGRATION_EVENT", "PREDATION_EVENT", "COMPETITION_EVENT", "DISEASE_EVENT", "POLLUTION_EVENT", "RESTORATION_EVENT", "SEASON_EVENT"]);
const ECOLOGY_EVENT_TYPES = new Set(["REPRODUCTION_EVENT", "BIRTH_EVENT", "DEATH_EVENT", "MIGRATION_EVENT", "PREDATION_EVENT", "COMPETITION_EVENT", "DISEASE_EVENT", "POLLUTION_EVENT", "RESTORATION_EVENT", "SEASON_EVENT", "GROWTH_EVENT", "DECOMPOSITION_EVENT", "WATER_CYCLE_EVENT", "SOIL_CYCLE_EVENT"]);
const ECOLOGY_EVENT_FIELDS = new Set(["event_id", "type", "location", "simulation_time", "status", "source", "authority", "simulation_only", "history", "previous_state_hash", "next_state_hash", "inputs", "outputs", "resource_delta", "reason"]);
const REPRODUCTIVE_SPECIES = new Set([
  "SPECIES-KAIOS-FOUNDATIONAL-GRASS",
  "SPECIES-KAIOS-FOUNDATIONAL-TREE",
  "SPECIES-KAIOS-FOUNDATIONAL-FISH",
  "SPECIES-KAIOS-FOUNDATIONAL-SHRIMP"
]);

const DEFAULT_HABITATS = [
  ["HABITAT-GRASSLAND-V1", "GRASSLAND", 10000, 6500, 24, 8, 0, 0.78],
  ["HABITAT-FOREST-V1", "FOREST", 20000, 9000, 21, 8, 0, 0.84],
  ["HABITAT-FISHPOND-V1", "FISHPOND", 2500, 18000, 25, 7.4, 1.5, 0.72],
  ["HABITAT-RIVER-V1", "RIVER_HABITAT", 40000, 35000, 22, 8.2, 0.5, 0.76],
  ["HABITAT-WETLAND-V1", "WETLAND", 12000, 14000, 23, 7.5, 0.7, 0.68],
  ["HABITAT-SOIL-V1", "SOIL_HABITAT", 1000, 1000, 22, 8, 0, 0.74],
  ["HABITAT-MOUNTAIN-WATERSHED-V1", "MOUNTAIN_WATERSHED", 2000000000, 12000, 12, 9, 0, 0.62]
];

const DEFAULT_POPULATIONS = [
  ["POP-GRASS-001", "SPECIES-KAIOS-FOUNDATIONAL-GRASS", "HABITAT-GRASSLAND-V1", 240, 280, ["SEED_PROPAGATION", "VEGETATIVE_PROPAGATION"], 0.018, 0.006, 0.08, 0.02],
  ["POP-TREE-001", "SPECIES-KAIOS-FOUNDATIONAL-TREE", "HABITAT-FOREST-V1", 36, 48, ["SEED_PROPAGATION"], 0.008, 0.003, 0.5, 0.12],
  ["POP-FISH-001", "SPECIES-KAIOS-FOUNDATIONAL-FISH", "HABITAT-RIVER-V1", 110, 130, ["SEXUAL_REPRODUCTION", "SPAWNING"], 0.012, 0.007, 0.025, 0.015],
  ["POP-SHRIMP-001", "SPECIES-KAIOS-FOUNDATIONAL-SHRIMP", "HABITAT-FISHPOND-V1", 80, 100, ["SEXUAL_REPRODUCTION", "LARVAL_DEVELOPMENT"], 0.014, 0.008, 0.012, 0.01],
  ["POP-MOUNTAIN-001", "SPECIES-KAIOS-FOUNDATIONAL-MOUNTAIN", "HABITAT-MOUNTAIN-WATERSHED-V1", 1, 1, ["NO_REPRODUCTION"], 0, 0.00001, 0, 0],
  ["POP-SOIL-001", "SPECIES-KAIOS-FOUNDATIONAL-SOIL", "HABITAT-SOIL-V1", 1, 1, ["NO_REPRODUCTION"], 0, 0.00001, 0, 0],
  ["POP-WATER-001", "SPECIES-KAIOS-FOUNDATIONAL-WATER", "HABITAT-RIVER-V1", 1, 1, ["NO_REPRODUCTION"], 0, 0, 0, 0],
  ["POP-RIVER-001", "SPECIES-KAIOS-FOUNDATIONAL-RIVER", "HABITAT-RIVER-V1", 1, 1, ["NO_REPRODUCTION"], 0, 0.00001, 0, 0]
];

function round6(value) { return Math.round((Number(value) || 0) * 1e6) / 1e6; }
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function ecologyHash(value) {
  let hash = 2166136261;
  for (const char of stableStringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function ecologyClone(value) { return JSON.parse(JSON.stringify(value)); }
function ecologicalEntity(id, type, location = "K280-SYNTHETIC-ECOSYSTEM") {
  return { id, type, location, simulation_time: 0, status: "ACTIVE", source: "KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1_SPEC", authority: "SIMULATION_ONLY", simulation_only: true, history: [], previous_state_hash: "GENESIS", next_state_hash: "GENESIS" };
}
function buildHabitat(row) {
  const [id, type, area_m2, water_l, temperature_c, oxygen_mg_l, salinity_ppt, soil_fertility] = row;
  return { ...ecologicalEntity(id, "HABITAT", id), id, type, area_m2, water_l, temperature_c, oxygen_mg_l, salinity_ppt, soil_fertility, pollution: 0.04, shelter: 0.65, season: "SPRING", restoration_state: "NONE", flow_status: type === "RIVER_HABITAT" ? "FLOWING_DOWNHILL" : "NOT_APPLICABLE" };
}
function buildPopulation(row) {
  const [population_id, species_id, habitat_id, count, carrying_capacity, reproduction_modes, birth_rate, death_rate, food_requirement, water_requirement] = row;
  return { population_id, species_id, habitat_id, count, age_distribution: { juvenile: Math.floor(count * 0.2), mature: count - Math.floor(count * 0.2) }, sex_distribution: REPRODUCTIVE_SPECIES.has(species_id) ? { female: Math.floor(count / 2), male: count - Math.floor(count / 2) } : {}, health_distribution: { healthy: count, stressed: 0 }, energy_reserve: 100, food_requirement, water_requirement, space_requirement: 1, birth_rate, death_rate, migration_rate: 0.002, disease_rate: 0.001, predation_rate: 0, carrying_capacity, genetic_diversity_proxy: 0.7, generation: 0, population_status: "STABLE", reproduction_modes, cooldown_ticks: 0, traits: { water_efficiency: 0.5, temperature_tolerance: 0.5, growth_rate: 0.5, disease_resistance: 0.5, oxygen_tolerance: 0.5, salinity_tolerance: 0.5, body_size_proxy: 0.5 } };
}
function defaultEcologyState(seed) {
  const habitats = DEFAULT_HABITATS.map(buildHabitat);
  const populations = DEFAULT_POPULATIONS.map(buildPopulation);
  return {
    schema_version: ECOLOGY_SCHEMA, runtime: ECOLOGY_V1, mode: "LOCAL_DETERMINISTIC_SIMULATION", seed,
    simulation_time: 0, status: "PAUSED",
    entities: [ecologicalEntity("ECOSYSTEM-K280-V1", "ECOSYSTEM"), ...habitats.map((habitat) => ecologicalEntity(habitat.id, "HABITAT", habitat.location))],
    habitats, populations,
    resources: { water_l: 95500, atmospheric_water_l: 8000, exported_water_l: 0, restoration_water_reserve_l: 24000, mountain_snowpack_l: 15000, biomass_kg: 5000, consumer_biomass_kg: 185, exported_biomass_kg: 0, nutrients_kg: 1400, restoration_nutrient_reserve_kg: 240, dead_biomass_kg: 0, decomposition_kg: 0, aquatic_primary_food_kg: 900, detritus_kg: 250, sediment_kg: 0, energy_proxy: 50000 },
    exported_population_count: {},
    conditions: [], candidate_lineages: [], events: [], action_log: [], revision: 0,
    boundaries: { simulation_only: true, wallet: "NONE", real_kgen: "NO_REAL_KGEN", onchain_transfer: false, real_bioengineering: false, production_authority: false, automatic_new_species: false, uncontrolled_reproduction: false, public_mutation_endpoints: false, maximum_total_population: ECOLOGY_MAX_POPULATION }
  };
}

export function createReproductionEcologyRuntimeV1({ seed = "KAIOS-ECOLOGY-V1-001", initialState: suppliedState, initializeDefaults = true } = {}) {
  let state = suppliedState ? ecologyClone(suppliedState) : defaultEcologyState(seed);
  if (!suppliedState && !initializeDefaults) { state.habitats = []; state.populations = []; state.entities = state.entities.slice(0, 1); state.resources.restoration_water_reserve_l += state.resources.water_l; state.resources.water_l = 0; }
  const genesis = ecologyClone(state);
  let destroyed = false;
  let isAdvancing = false;
  let isReplaying = false;
  const subscribers = new Set();
  const requireUsable = () => { if (destroyed) throw new Error("ECOLOGY_RUNTIME_DESTROYED"); };
  const requireActionCapacity = () => { if (!isAdvancing && !isReplaying && state.action_log.length >= 10000) throw new Error("ACTION_LOG_LIMIT_REACHED"); };
  const commitOrRollback = (previous, errorCode) => { try { if (!integrityReport().ok) throw new Error(errorCode); } catch { state = previous; throw new Error(errorCode); } };
  const totalBiological = () => state.populations.filter((item) => REPRODUCTIVE_SPECIES.has(item.species_id)).reduce((sum, item) => sum + item.count, 0);
  const publicState = () => Object.freeze(ecologyClone({ ...state, integrity: integrityReport() }));
  const emit = () => { const view = publicState(); subscribers.forEach((listener) => listener(view)); };
  const stateCore = () => ({ schema_version: state.schema_version, runtime: state.runtime, mode: state.mode, seed: state.seed, simulation_time: state.simulation_time, entities: state.entities, habitats: state.habitats, populations: state.populations, resources: state.resources, exported_population_count: state.exported_population_count, conditions: state.conditions, candidate_lineages: state.candidate_lineages, boundaries: state.boundaries });
  const track = (command, args = {}) => { if (!isAdvancing && !isReplaying) state.action_log.push({ command, args: ecologyClone(args) }); };
  const finitePositive = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const individualMass = (population) => population.species_id.includes("TREE") ? 8 : population.species_id.includes("GRASS") ? 0.08 : population.species_id.includes("FISH") ? 1 : 0.05;
  const biomassPool = (population) => population.species_id.includes("GRASS") || population.species_id.includes("TREE") ? "biomass_kg" : "consumer_biomass_kg";
  function synchronizeDistribution(population) {
    const juvenile = Math.min(population.count, Math.max(0, population.age_distribution.juvenile || 0));
    population.age_distribution = { juvenile, mature: population.count - juvenile };
    if (REPRODUCTIVE_SPECIES.has(population.species_id)) population.sex_distribution = { female: Math.floor(population.count / 2), male: population.count - Math.floor(population.count / 2) };
    const stressed = Math.min(population.count, Math.max(0, population.health_distribution.stressed || 0));
    population.health_distribution = { healthy: population.count - stressed, stressed };
  }
  function record(type, { location = "K280-SYNTHETIC-ECOSYSTEM", status = "APPLIED", inputs = {}, outputs = {}, resource_delta = {}, reason = "CAUSAL_SIMULATION_STEP" } = {}) {
    const previous = state.events.at(-1)?.next_state_hash ?? ecologyHash({ seed: state.seed, genesis: true });
    state.revision += 1;
    const next = ecologyHash(stateCore());
    const event = { event_id: `ECO-EVT-${String(state.revision).padStart(6, "0")}`, type, location, simulation_time: state.simulation_time, status, source: ECOLOGY_V1, authority: "SIMULATION_ONLY", simulation_only: true, history: [], previous_state_hash: previous, next_state_hash: next, inputs, outputs, resource_delta, reason };
    boundedPush(state.events, event, ECOLOGY_MAX_EVENTS);
    return event;
  }
  function findPopulation(id) { return state.populations.find((item) => item.population_id === id || item.species_id === id); }
  function findHabitat(id) { return state.habitats.find((item) => item.id === id); }
  function transferResource(from, to, amount) {
    const moved = round6(Math.min(Math.max(0, state.resources[from] || 0), Math.max(0, amount || 0)));
    state.resources[from] = round6(state.resources[from] - moved);
    state.resources[to] = round6((state.resources[to] || 0) + moved);
    return moved;
  }
  function reconcileHabitatWater() {
    if (!state.habitats.length) return;
    const target = round6(state.resources.water_l); const current = state.habitats.reduce((sum, habitat) => sum + habitat.water_l, 0); let allocated = 0;
    state.habitats.forEach((habitat, index) => { const next = index === state.habitats.length - 1 ? round6(target - allocated) : round6(target * (current > 0 ? habitat.water_l / current : 1 / state.habitats.length)); habitat.water_l = Math.max(0, next); allocated = round6(allocated + habitat.water_l); });
  }
  function createEcosystem(config = {}) {
    requireUsable(); requireActionCapacity(); const previous = ecologyClone(state);
    if (state.simulation_time || state.events.length) throw new Error("ECOSYSTEM_ALREADY_INITIALIZED");
    if (config.seed && (typeof config.seed !== "string" || !config.seed.length || config.seed.length > 128)) throw new Error("INVALID_ECOSYSTEM_CONFIGURATION");
    if (config.seed) { state.seed = String(config.seed); genesis.seed = state.seed; }
    record("SEASON_EVENT", { outputs: { ecosystem_id: "ECOSYSTEM-K280-V1" }, reason: "APPROVED_INITIALIZATION_CAUSE" }); track("createEcosystem", config); commitOrRollback(previous, "INVALID_ECOSYSTEM_CONFIGURATION"); emit(); return publicState();
  }
  function createHabitat(input) {
    requireUsable(); requireActionCapacity(); const previous = ecologyClone(state);
    if (!input?.id || state.habitats.some(({ id }) => id === input.id) || state.habitats.length >= 7) throw new Error("HABITAT_LIMIT_OR_DUPLICATE");
    const habitat = { ...buildHabitat([input.id, input.type, input.area_m2, 0, input.temperature_c, input.oxygen_mg_l, input.salinity_ppt, input.soil_fertility]), ...ecologyClone(input), water_l: 0 };
    state.habitats.push(habitat); const allocatedWater = transferResource("restoration_water_reserve_l", "water_l", finitePositive(input.water_l)); reconcileHabitatWater(); record("RESTORATION_EVENT", { location: habitat.id, outputs: { habitat_id: habitat.id, water_l: allocatedWater }, reason: "APPROVED_HABITAT_INITIALIZATION" }); track("createHabitat", input); commitOrRollback(previous, "INVALID_HABITAT_CONFIGURATION"); emit(); return ecologyClone(habitat);
  }
  function addPopulation(input) {
    requireUsable(); requireActionCapacity(); const previous = ecologyClone(state);
    if (!input?.population_id || state.populations.some(({ population_id }) => population_id === input.population_id) || state.populations.length >= 8) throw new Error("POPULATION_LIMIT_OR_DUPLICATE");
    if (!findHabitat(input.habitat_id)) throw new Error("NO_HABITAT");
    if (REPRODUCTIVE_SPECIES.has(input.species_id) && totalBiological() + input.count > ECOLOGY_MAX_POPULATION) throw new Error("POPULATION_CAP_REACHED");
    state.populations.push(buildPopulation([input.population_id, input.species_id, input.habitat_id, input.count, input.carrying_capacity, input.reproduction_modes, input.birth_rate, input.death_rate, input.food_requirement, input.water_requirement]));
    record("BIRTH_EVENT", { location: input.habitat_id, outputs: { population_id: input.population_id, count: input.count }, reason: "APPROVED_POPULATION_INITIALIZATION" }); track("addPopulation", input); commitOrRollback(previous, "INVALID_POPULATION_CONFIGURATION"); emit(); return publicState();
  }
  function evaluateResources(trackAction = true) {
    if (trackAction) requireActionCapacity();
    const conditions = new Set();
    const aquatic = state.habitats.filter(({ type }) => ["FISHPOND", "RIVER_HABITAT", "WETLAND"].includes(type));
    if (state.resources.water_l < 40000) conditions.add("DROUGHT");
    if (state.resources.water_l > 120000) conditions.add("FLOOD");
    if (aquatic.some(({ oxygen_mg_l }) => oxygen_mg_l < 5)) conditions.add("LOW_OXYGEN");
    if (state.habitats.some(({ pollution }) => pollution > 0.45)) conditions.add("HIGH_POLLUTION");
    if (state.habitats.some(({ soil_fertility = 1 }) => soil_fertility < 0.35)) conditions.add("LOW_FERTILITY");
    if (state.resources.sediment_kg > 500) conditions.add("SEDIMENT_OVERLOAD");
    state.conditions = [...conditions].sort();
    if (trackAction) track("evaluateResources");
    return { conditions: [...state.conditions], resources: ecologyClone(state.resources) };
  }
  function evaluateCarryingCapacity() {
    requireActionCapacity();
    for (const population of state.populations) {
      if (!REPRODUCTIVE_SPECIES.has(population.species_id)) continue;
      const habitat = findHabitat(population.habitat_id);
      const waterFactor = clamp((habitat?.water_l || 0) / 5000, 0.1, 1);
      const pollutionFactor = clamp(1 - (habitat?.pollution || 0), 0.1, 1);
      const oxygenFactor = population.species_id.includes("FISH") || population.species_id.includes("SHRIMP") ? clamp((habitat?.oxygen_mg_l || 0) / 7, 0.1, 1) : 1;
      const fertilityFactor = population.species_id.includes("GRASS") || population.species_id.includes("TREE") ? clamp(habitat?.soil_fertility ?? 0.5, 0.1, 1) : 1;
      population.carrying_capacity = Math.max(1, Math.min(500, Math.floor((DEFAULT_POPULATIONS.find(([id]) => id === population.population_id)?.[4] || population.carrying_capacity) * waterFactor * pollutionFactor * oxygenFactor * fertilityFactor)));
      population.population_status = population.count > population.carrying_capacity ? "OVER_CAPACITY" : population.population_status;
    }
    record("COMPETITION_EVENT", { outputs: { capacities: state.populations.map(({ population_id, carrying_capacity }) => ({ population_id, carrying_capacity })) }, reason: "SIMULATION_APPROXIMATION" });
    track("evaluateCarryingCapacity");
    return ecologyClone(state.populations);
  }
  function processWaterCycle() {
    requireActionCapacity();
    const runoff = transferResource("mountain_snowpack_l", "water_l", 30);
    const evaporation = transferResource("water_l", "atmospheric_water_l", Math.min(25, state.resources.energy_proxy * 0.0004));
    const outflow = transferResource("water_l", "exported_water_l", 12);
    state.resources.energy_proxy = round6(Math.max(0, state.resources.energy_proxy - evaporation * 0.2));
    reconcileHabitatWater();
    record("WATER_CYCLE_EVENT", { inputs: { mountain_runoff_l: runoff }, outputs: { evaporation_l: evaporation, river_outflow_l: outflow }, resource_delta: { water_l: round6(runoff - evaporation - outflow), atmospheric_water_l: evaporation, exported_water_l: outflow, energy_proxy: round6(-evaporation * 0.2) }, reason: "MOUNTAIN_RUNOFF_RIVER_INFLOW_EVAPORATION" });
    track("processWaterCycle");
    return evaluateResources(false);
  }
  function processSoilCycle() {
    requireActionCapacity();
    const erosion = transferResource("nutrients_kg", "sediment_kg", state.conditions.includes("FLOOD") ? 8 : 1.2);
    const soil = findHabitat("HABITAT-SOIL-V1");
    if (soil) soil.soil_fertility = round6(clamp(soil.soil_fertility - erosion * 0.0001, 0, 1));
    record("SOIL_CYCLE_EVENT", { outputs: { erosion_kg: erosion }, resource_delta: { nutrients_kg: -erosion, sediment_kg: erosion }, reason: erosion > 5 ? "EROSION_RISK" : "BOUNDED_EROSION" });
    track("processSoilCycle");
    return evaluateResources(false);
  }
  function processFoodConsumption() {
    requireActionCapacity();
    let aquatic = 0; let detritus = 0;
    for (const population of state.populations) {
      if (population.species_id.includes("FISH")) aquatic += transferResource("aquatic_primary_food_kg", "consumer_biomass_kg", population.count * population.food_requirement * 0.03);
      if (population.species_id.includes("SHRIMP")) detritus += transferResource("detritus_kg", "consumer_biomass_kg", population.count * population.food_requirement * 0.03);
    }
    record("GROWTH_EVENT", { inputs: { aquatic_food_kg: aquatic, detritus_kg: detritus }, outputs: { consumer_biomass_kg: round6(aquatic + detritus) }, resource_delta: { aquatic_primary_food_kg: -aquatic, detritus_kg: -detritus, consumer_biomass_kg: round6(aquatic + detritus) }, reason: "FOOD_MASS_TRANSFER" });
    track("processFoodConsumption");
    return { aquatic, detritus };
  }
  function processGrowth() {
    requireActionCapacity();
    const waterNeeded = Math.min(20, state.populations.filter(({ species_id }) => species_id.includes("GRASS") || species_id.includes("TREE")).reduce((sum, item) => sum + item.count * item.water_requirement * 0.005, 0));
    const waterMoved = round6(Math.min(state.resources.water_l, waterNeeded));
    const nutrientMoved = transferResource("nutrients_kg", "biomass_kg", Math.min(waterMoved * 0.12, state.resources.energy_proxy * 0.0002));
    state.resources.water_l = round6(state.resources.water_l - waterMoved);
    state.resources.atmospheric_water_l = round6(state.resources.atmospheric_water_l + waterMoved * 0.65);
    state.resources.exported_water_l = round6(state.resources.exported_water_l + waterMoved * 0.35);
    reconcileHabitatWater();
    state.resources.energy_proxy = round6(Math.max(0, state.resources.energy_proxy - nutrientMoved * 1.5));
    record("GROWTH_EVENT", { inputs: { water_l: waterMoved, nutrients_kg: nutrientMoved, sunlight_energy_proxy: nutrientMoved * 1.5 }, outputs: { plant_biomass_kg: nutrientMoved }, resource_delta: { water_l: -waterMoved, atmospheric_water_l: waterMoved * 0.65, exported_water_l: waterMoved * 0.35, nutrients_kg: -nutrientMoved, biomass_kg: nutrientMoved }, reason: nutrientMoved ? "CAUSAL_PLANT_GROWTH" : "GROWTH_BLOCKED_RESOURCE" });
    track("processGrowth");
    return nutrientMoved;
  }
  function reproductionBlock(population, habitat) {
    if (!REPRODUCTIVE_SPECIES.has(population.species_id)) return "NO_REPRODUCTION";
    if (population.cooldown_ticks > 0) return "REPRODUCTION_COOLDOWN";
    if (totalBiological() >= ECOLOGY_MAX_POPULATION) return "POPULATION_CAP_REACHED";
    if (population.count >= population.carrying_capacity) return "OVER_CARRYING_CAPACITY";
    if (!habitat) return "NO_HABITAT";
    if (population.energy_reserve < 35) return "INSUFFICIENT_ENERGY";
    if (habitat.water_l < population.water_requirement * population.count) return "INSUFFICIENT_WATER";
    if ((population.species_id.includes("FISH") || population.species_id.includes("SHRIMP")) && state.resources.aquatic_primary_food_kg + state.resources.detritus_kg < population.food_requirement * population.count) return "INSUFFICIENT_FOOD";
    if (habitat.temperature_c < 8 || habitat.temperature_c > 34) return "TEMPERATURE_OUT_OF_RANGE";
    if (habitat.season === "WINTER" && !population.species_id.includes("TREE")) return "WRONG_SEASON";
    if ((population.health_distribution.stressed || 0) > population.count / 2) return "HEALTH_TOO_LOW";
    if ((population.age_distribution.mature || 0) < 1) return "NO_MATE_OR_PROPAGATION_SOURCE";
    if ((population.species_id.includes("GRASS") || population.species_id.includes("TREE")) && population.count < 1) return "NO_MATE_OR_PROPAGATION_SOURCE";
    if (["SEXUAL_REPRODUCTION", "SPAWNING", "LARVAL_DEVELOPMENT"].some((mode) => population.reproduction_modes.includes(mode)) && Math.min(population.sex_distribution.female || 0, population.sex_distribution.male || 0) < 1) return "NO_MATE_OR_PROPAGATION_SOURCE";
    return null;
  }
  function processReproduction() {
    requireActionCapacity();
    const results = [];
    for (const population of state.populations) {
      const habitat = findHabitat(population.habitat_id); const blocked = reproductionBlock(population, habitat);
      if (blocked) { results.push({ population_id: population.population_id, births: 0, blocked_reason: blocked }); continue; }
      const supportedByBiomass = Math.max(0, Math.floor(state.resources[biomassPool(population)] / individualMass(population)) - population.count);
      const births = Math.max(0, Math.min(Math.floor(population.count * population.birth_rate), population.carrying_capacity - population.count, ECOLOGY_MAX_POPULATION - totalBiological(), supportedByBiomass));
      population.count += births; population.cooldown_ticks = births ? 12 : 0; population.generation = Math.min(5, population.generation + (births ? 1 : 0));
      if (births) {
        population.age_distribution.juvenile += births; population.sex_distribution.female += Math.floor(births / 2); population.sex_distribution.male += births - Math.floor(births / 2); population.health_distribution.healthy += births;
        const reproductiveWater = round6(Math.min(habitat.water_l, state.resources.water_l, births * population.water_requirement * 0.1));
        habitat.water_l = round6(habitat.water_l - reproductiveWater); state.resources.water_l = round6(state.resources.water_l - reproductiveWater); state.resources.exported_water_l = round6(state.resources.exported_water_l + reproductiveWater);
        population.energy_reserve = round6(Math.max(0, population.energy_reserve - births * 0.5));
      }
      synchronizeDistribution(population);
      results.push({ population_id: population.population_id, births, blocked_reason: births ? null : "NO_MATE_OR_PROPAGATION_SOURCE" });
      record("REPRODUCTION_EVENT", { location: population.habitat_id, inputs: { parents_or_source: population.count - births, mode: population.reproduction_modes[0] }, outputs: { births, generation: population.generation }, reason: births ? "BOUNDED_REPRODUCTION" : "REPRODUCTION_BLOCKED" });
    }
    reconcileHabitatWater();
    track("processReproduction");
    return results;
  }
  function processCompetition() {
    requireActionCapacity();
    for (const population of state.populations) {
      if (!REPRODUCTIVE_SPECIES.has(population.species_id)) continue;
      const ratio = population.carrying_capacity ? population.count / population.carrying_capacity : 1;
      if (ratio > 1) { population.population_status = "OVER_CAPACITY"; population.energy_reserve = round6(Math.max(0, population.energy_reserve - (ratio - 1) * 12)); }
      else if (state.conditions.includes("DROUGHT") || state.conditions.includes("LOW_OXYGEN")) population.population_status = "RESOURCE_STRESSED";
      else if (state.conditions.includes("HIGH_POLLUTION")) population.population_status = "POLLUTION_STRESSED";
      else population.population_status = population.count < population.carrying_capacity * 0.65 ? "GROWING" : "STABLE";
    }
    record("COMPETITION_EVENT", { outputs: { statuses: state.populations.map(({ population_id, population_status }) => ({ population_id, population_status })) }, reason: "FINITE_CARRYING_CAPACITY" });
    track("processCompetition");
    return ecologyClone(state.populations);
  }
  function processDeath() {
    requireActionCapacity();
    let totalDeaths = 0;
    for (const population of state.populations) {
      if (!REPRODUCTIVE_SPECIES.has(population.species_id) || !population.count) continue;
      const stress = ["OVER_CAPACITY", "RESOURCE_STRESSED", "POLLUTION_STRESSED", "COLLAPSING"].includes(population.population_status) ? 2 : 1;
      const availableBodies = Math.floor(state.resources[biomassPool(population)] / individualMass(population));
      const deaths = Math.min(population.count, availableBodies, Math.floor(population.count * population.death_rate * stress));
      const deadMass = transferResource(biomassPool(population), "dead_biomass_kg", deaths * individualMass(population));
      population.count -= deaths; totalDeaths += deaths;
      population.age_distribution.mature = Math.max(0, population.age_distribution.mature - deaths);
      population.health_distribution.healthy = Math.max(0, population.health_distribution.healthy - deaths);
      if (!population.count) population.population_status = "EXTINCT_LOCAL";
      synchronizeDistribution(population);
      if (deaths) record("DEATH_EVENT", { location: population.habitat_id, inputs: { population_id: population.population_id }, outputs: { deaths, dead_biomass_kg: deadMass, status: population.population_status }, reason: population.population_status });
    }
    track("processDeath"); return totalDeaths;
  }
  function processDecomposition() {
    requireActionCapacity();
    const decomposed = transferResource("dead_biomass_kg", "decomposition_kg", state.resources.dead_biomass_kg * 0.25);
    const returned = transferResource("decomposition_kg", "nutrients_kg", state.resources.decomposition_kg * 0.4);
    record("DECOMPOSITION_EVENT", { inputs: { dead_biomass_kg: decomposed }, outputs: { nutrient_return_kg: returned }, resource_delta: { dead_biomass_kg: -decomposed, decomposition_kg: round6(decomposed - returned), nutrients_kg: returned }, reason: "MICROBIAL_DECOMPOSITION_PROXY" });
    track("processDecomposition");
    return { decomposed, returned };
  }
  function processPollution(amount = 0) {
    requireActionCapacity();
    const delta = Number.isFinite(Number(amount)) ? clamp(Number(amount), -1, 1) : 0;
    state.habitats.filter(({ type }) => ["FISHPOND", "RIVER_HABITAT", "WETLAND"].includes(type)).forEach((habitat) => { habitat.pollution = round6(clamp(habitat.pollution + delta, 0, 1)); habitat.oxygen_mg_l = round6(clamp(habitat.oxygen_mg_l - Math.max(0, delta) * 4, 0, 30)); });
    record("POLLUTION_EVENT", { inputs: { pollution_delta: delta }, outputs: { aquatic_health_pressure: Math.max(0, delta) }, reason: delta > 0 ? "POLLUTION_INTRODUCED" : "POLLUTION_REDUCED" }); evaluateResources(false); track("processPollution", { amount: delta }); return publicState();
  }
  function processDrought({ water_l = 28000, habitat_factor = 0.25 } = {}) {
    requireActionCapacity();
    const factor = clamp(finitePositive(habitat_factor), 0, 1);
    const targetWater = Math.min(state.resources.water_l, finitePositive(water_l), round6(state.resources.water_l * factor));
    const exported = transferResource("water_l", "exported_water_l", state.resources.water_l - targetWater);
    reconcileHabitatWater();
    record("SEASON_EVENT", { inputs: { target_water_l: targetWater, habitat_factor: factor }, outputs: { exported_water_l: exported, condition: "DROUGHT" }, resource_delta: { water_l: -exported, exported_water_l: exported }, reason: "BOUNDED_DROUGHT_SCENARIO" });
    evaluateResources(false); track("processDrought", { water_l: targetWater, habitat_factor: factor }); emit(); return publicState();
  }
  function processMigration() {
    requireActionCapacity();
    const migrations = [];
    for (const population of state.populations.filter(({ species_id }) => REPRODUCTIVE_SPECIES.has(species_id))) {
      if (!["OVER_CAPACITY", "RESOURCE_STRESSED", "POLLUTION_STRESSED"].includes(population.population_status)) continue;
      const requested = Math.min(population.count, Math.floor(population.count * population.migration_rate));
      const conservedMoved = Math.min(requested, Math.floor(state.resources[biomassPool(population)] / individualMass(population)));
      if (conservedMoved) { const mass=transferResource(biomassPool(population),"exported_biomass_kg",conservedMoved*individualMass(population)); population.count -= conservedMoved; state.exported_population_count[population.species_id]=(state.exported_population_count[population.species_id]||0)+conservedMoved; synchronizeDistribution(population); migrations.push({ population_id: population.population_id, moved:conservedMoved, mass_kg:mass, destination: "EXTERNAL_BOUNDED_HABITAT_PROXY" }); record("MIGRATION_EVENT", { location: population.habitat_id, inputs: { population_id: population.population_id }, outputs: { moved:conservedMoved, mass_kg:mass }, reason: population.population_status }); }
    }
    track("processMigration"); return migrations;
  }
  function processRestoration({ water_l = 0, nutrients_kg = 0, pollution_reduction = 0.1 } = {}) {
    requireActionCapacity();
    const requested={water_l:finitePositive(water_l),nutrients_kg:finitePositive(nutrients_kg),pollution_reduction:finitePositive(pollution_reduction)};
    const restoredWater=transferResource("restoration_water_reserve_l","water_l",requested.water_l); const restoredNutrients=transferResource("restoration_nutrient_reserve_kg","nutrients_kg",requested.nutrients_kg);
    reconcileHabitatWater();
    state.habitats.forEach((habitat) => { habitat.pollution = round6(clamp(habitat.pollution - requested.pollution_reduction, 0, 1)); habitat.restoration_state = "RECOVERING"; });
    state.populations.filter(({ population_status }) => population_status !== "EXTINCT_LOCAL").forEach((population) => { population.population_status = "RECOVERING"; });
    record("RESTORATION_EVENT", { inputs: requested, outputs: { restoration_state: "RECOVERING",water_l:restoredWater,nutrients_kg:restoredNutrients }, resource_delta: { restoration_water_reserve_l:-restoredWater,water_l:restoredWater,restoration_nutrient_reserve_kg:-restoredNutrients,nutrients_kg:restoredNutrients }, reason: "BOUNDED_RESTORATION_RESERVE_TRANSFER" }); evaluateResources(false); track("processRestoration", requested); emit(); return publicState();
  }
  function processNaturalSelection() {
    requireActionCapacity();
    for (const population of state.populations.filter(({ species_id }) => REPRODUCTIVE_SPECIES.has(species_id))) {
      const pressure = state.conditions.length * 0.001;
      if (!pressure || state.simulation_time % 24) continue;
      const trait = population.species_id.includes("FISH") ? "oxygen_tolerance" : population.species_id.includes("SHRIMP") ? "salinity_tolerance" : "water_efficiency";
      population.traits[trait] = round6(clamp(population.traits[trait] + pressure, 0.2, 0.8));
      const lineage = { lineage_id: `CANDIDATE-LINEAGE-${population.population_id}-${state.simulation_time}`, population_id: population.population_id, status: "CANDIDATE_LINEAGE", automatic_new_species: false, trait, value: population.traits[trait] };
      if (!state.candidate_lineages.some(({ lineage_id }) => lineage_id === lineage.lineage_id) && state.candidate_lineages.length < 500) state.candidate_lineages.push(lineage);
    }
    track("processNaturalSelection"); return ecologyClone(state.candidate_lineages);
  }
  function advanceTime(ticks = 1) {
    requireUsable(); requireActionCapacity(); if (state.status !== "RUNNING") throw new Error("RUNTIME_NOT_RUNNING");
    const amount = Math.floor(Number(ticks)); if (!Number.isFinite(amount) || amount < 1 || state.simulation_time + amount > ECOLOGY_MAX_TICKS) throw new Error("INVALID_TIME_ADVANCE");
    isAdvancing = true;
    try {
      for (let index = 0; index < amount; index += 1) {
        state.simulation_time += 1; state.populations.forEach((population) => { population.cooldown_ticks = Math.max(0, population.cooldown_ticks - 1); });
        processWaterCycle(); processSoilCycle(); evaluateCarryingCapacity(); processFoodConsumption(); processGrowth(); processCompetition(); processReproduction(); processDeath(); processDecomposition(); processMigration(); processNaturalSelection(); evaluateResources();
        record("SEASON_EVENT", { outputs: { tick: state.simulation_time }, reason: "DETERMINISTIC_TICK_COMPLETE" });
      }
    } finally { isAdvancing = false; }
    track("advanceTime", { ticks: amount }); emit(); return publicState();
  }
  function start() { requireUsable(); state.status = "RUNNING"; emit(); return publicState(); }
  function pause() { requireUsable(); state.status = "PAUSED"; emit(); return publicState(); }
  function resume() { return start(); }
  function stop() { requireUsable(); state.status = "STOPPED"; emit(); return publicState(); }
  function exportState() { requireUsable(); return ecologyClone({ envelope: "NON_AUTHORITATIVE_SIMULATION", state }); }
  function importState(payload) {
    requireUsable();
    const candidate = payload?.state ?? payload;
    if (candidate?.runtime !== ECOLOGY_V1 || candidate?.boundaries?.production_authority !== false || candidate?.boundaries?.wallet !== "NONE") throw new Error("INVALID_ECOLOGY_IMPORT");
    const previous = state;
    state = ecologyClone(candidate);
    try { if (!integrityReport().ok) throw new Error("INVALID_ECOLOGY_INTEGRITY"); }
    catch { state = previous; throw new Error("INVALID_ECOLOGY_INTEGRITY"); }
    emit();
    return publicState();
  }
  function resetState() { requireUsable(); state = ecologyClone(genesis); emit(); return publicState(); }
  function replayEvents() {
    requireUsable(); const actions = ecologyClone(state.action_log); state = ecologyClone(genesis); isReplaying = true;
    const commands = { createEcosystem, createHabitat, addPopulation, evaluateResources, evaluateCarryingCapacity, processGrowth, processReproduction, processCompetition, processFoodConsumption, processDeath, processDecomposition, processWaterCycle, processSoilCycle, processPollution, processDrought, processMigration, processRestoration, processNaturalSelection };
    try {
      for (const action of actions) {
        if (action.command === "advanceTime") { state.status = "RUNNING"; advanceTime(action.args?.ticks); continue; }
        const command = commands[action.command]; if (!command) throw new Error("UNKNOWN_REPLAY_COMMAND");
        if (["createEcosystem", "createHabitat", "addPopulation", "processDrought", "processRestoration"].includes(action.command)) command(action.args); else if (action.command === "processPollution") command(action.args?.amount); else command();
      }
    } finally { isReplaying = false; }
    state.action_log = actions; state.status = "PAUSED"; emit(); return publicState();
  }
  function integrityReport() {
    const issues = []; const biological = totalBiological();
    const expectedTopLevel = new Set(["schema_version", "runtime", "mode", "seed", "simulation_time", "status", "entities", "habitats", "populations", "resources", "exported_population_count", "conditions", "candidate_lineages", "events", "action_log", "revision", "boundaries"]);
    if (Object.keys(state).some((key) => !expectedTopLevel.has(key))) issues.push("UNKNOWN_STATE_FIELD");
    if (state.runtime !== ECOLOGY_V1 || state.schema_version !== ECOLOGY_SCHEMA || state.mode !== "LOCAL_DETERMINISTIC_SIMULATION") issues.push("RUNTIME_SCHEMA_MISMATCH");
    if (typeof state.seed !== "string" || !state.seed.length || state.seed.length > 128 || !["PAUSED", "RUNNING", "STOPPED"].includes(state.status) || !Number.isInteger(state.revision) || state.revision < state.events.length) issues.push("INVALID_STATE_METADATA");
    if (state.entities.length > 200 || state.habitats.length > 7 || state.populations.length > 8 || state.events.length > ECOLOGY_MAX_EVENTS || state.candidate_lineages.length > 500 || state.action_log.length > 10000) issues.push("BOUNDED_LIMIT_EXCEEDED");
    if (biological > ECOLOGY_MAX_POPULATION) issues.push("POPULATION_CAP_EXCEEDED");
    if (state.simulation_time < 0 || state.simulation_time > ECOLOGY_MAX_TICKS || !Number.isInteger(state.simulation_time)) issues.push("INVALID_SIMULATION_TIME");
    if (state.populations.some((item) => !Number.isInteger(item.count) || item.count < 0 || item.count > ECOLOGY_MAX_POPULATION)) issues.push("INVALID_POPULATION_COUNT");
    const invalidDistribution = (distribution, expected) => !distribution || Object.values(distribution).some((value) => !Number.isInteger(value) || value < 0) || Object.values(distribution).reduce((sum, value) => sum + value, 0) !== expected;
    const invalidDistributionMembers = (distribution) => !distribution || typeof distribution !== "object" || Array.isArray(distribution) || Object.values(distribution).some((value) => !Number.isInteger(value) || value < 0);
    if (state.populations.some((item) => invalidDistribution(item.age_distribution, item.count) || invalidDistribution(item.health_distribution, item.count) || invalidDistributionMembers(item.sex_distribution) || (REPRODUCTIVE_SPECIES.has(item.species_id) && invalidDistribution(item.sex_distribution, item.count)))) issues.push("INVALID_POPULATION_DISTRIBUTION");
    if (new Set(state.populations.map(({ population_id }) => population_id)).size !== state.populations.length) issues.push("DUPLICATE_POPULATION_ID");
    if (state.populations.some((item) => !state.habitats.some(({ id }) => id === item.habitat_id))) issues.push("MISSING_POPULATION_HABITAT");
    if (state.populations.some((item) => !REPRODUCTIVE_SPECIES.has(item.species_id) && !item.reproduction_modes.includes("NO_REPRODUCTION"))) issues.push("INVALID_NONBIOLOGICAL_REPRODUCTION");
    const exactFields = (value, fields) => value && Object.keys(value).length === fields.size && [...fields].every((key) => Object.hasOwn(value, key));
    if (!exactFields(state.resources, ECOLOGY_RESOURCE_FIELDS) || !exactFields(state.boundaries, ECOLOGY_BOUNDARY_FIELDS) || state.habitats.some((item) => !exactFields(item, ECOLOGY_HABITAT_FIELDS)) || state.populations.some((item) => !exactFields(item, ECOLOGY_POPULATION_FIELDS))) issues.push("UNKNOWN_OR_MISSING_SCHEMA_FIELD");
    const invalidProvenance = (item) => typeof item.location !== "string" || !item.location.length || !Number.isInteger(item.simulation_time) || item.simulation_time < 0 || typeof item.status !== "string" || !item.status.length || typeof item.source !== "string" || !item.source.length || item.authority !== "SIMULATION_ONLY" || item.simulation_only !== true || !Array.isArray(item.history) || typeof item.previous_state_hash !== "string" || typeof item.next_state_hash !== "string";
    if (state.entities.some((item) => !item || typeof item.id !== "string" || !item.id.length || !ECOLOGY_ENTITY_TYPES.has(item.type) || invalidProvenance(item))) issues.push("INVALID_ENTITY_STATE");
    if (state.habitats.some((item) => typeof item.id !== "string" || !item.id.length || !ECOLOGY_HABITAT_TYPES.has(item.type) || invalidProvenance(item) || !["SPRING", "SUMMER", "AUTUMN", "WINTER"].includes(item.season) || !["NONE", "PLANNED", "ACTIVE", "RECOVERING", "RESTORED"].includes(item.restoration_state) || !["FLOWING_DOWNHILL", "NOT_APPLICABLE", "RIVER_FLOW_BLOCKED"].includes(item.flow_status) || !Number.isFinite(item.area_m2) || item.area_m2 <= 0 || !Number.isFinite(item.water_l) || item.water_l < 0 || !Number.isFinite(item.temperature_c) || item.temperature_c < -80 || item.temperature_c > 80 || !Number.isFinite(item.oxygen_mg_l) || item.oxygen_mg_l < 0 || item.oxygen_mg_l > 30 || !Number.isFinite(item.salinity_ppt) || item.salinity_ppt < 0 || item.salinity_ppt > 60 || !Number.isFinite(item.pollution) || item.pollution < 0 || item.pollution > 1 || !Number.isFinite(item.shelter) || item.shelter < 0 || item.shelter > 1 || !Number.isFinite(item.soil_fertility) || item.soil_fertility < 0 || item.soil_fertility > 1)) issues.push("INVALID_HABITAT_STATE");
    if (state.populations.some((item) => typeof item.population_id !== "string" || !item.population_id.length || typeof item.habitat_id !== "string" || !item.habitat_id.length || !ECOLOGY_SPECIES.has(item.species_id) || !ECOLOGY_POPULATION_STATUSES.has(item.population_status) || !Number.isFinite(item.energy_reserve) || item.energy_reserve < 0 || [item.food_requirement, item.water_requirement, item.space_requirement].some((value) => !Number.isFinite(value) || value < 0) || !Number.isInteger(item.carrying_capacity) || item.carrying_capacity < 0 || item.carrying_capacity > ECOLOGY_MAX_POPULATION || !Number.isInteger(item.generation) || item.generation < 0 || item.generation > 100 || !Number.isInteger(item.cooldown_ticks) || item.cooldown_ticks < 0 || item.cooldown_ticks > 1000 || !Array.isArray(item.reproduction_modes) || !item.reproduction_modes.length || new Set(item.reproduction_modes).size !== item.reproduction_modes.length || item.reproduction_modes.some((mode) => !ECOLOGY_REPRODUCTION_MODES.has(mode)) || [item.birth_rate, item.death_rate, item.migration_rate, item.disease_rate, item.predation_rate, item.genetic_diversity_proxy].some((value) => !Number.isFinite(value) || value < 0 || value > 1) || !item.traits || typeof item.traits !== "object" || Array.isArray(item.traits) || Object.values(item.traits).some((value) => !Number.isFinite(value) || value < 0 || value > 1))) issues.push("INVALID_POPULATION_STATE");
    if (state.events.some((item) => !exactFields(item, ECOLOGY_EVENT_FIELDS) || typeof item.event_id !== "string" || !item.event_id.length || !ECOLOGY_EVENT_TYPES.has(item.type) || invalidProvenance(item) || !item.inputs || typeof item.inputs !== "object" || Array.isArray(item.inputs) || !item.outputs || typeof item.outputs !== "object" || Array.isArray(item.outputs) || !item.resource_delta || typeof item.resource_delta !== "object" || Array.isArray(item.resource_delta) || typeof item.reason !== "string")) issues.push("INVALID_EVENT_STATE");
    if (Object.values(state.resources).some((value) => typeof value !== "number" || !Number.isFinite(value) || value < -0.000001)) issues.push("INVALID_RESOURCE");
    if (Object.values(state.exported_population_count).some((value) => !Number.isInteger(value) || value < 0) || state.conditions.some((value) => typeof value !== "string") || new Set(state.conditions).size !== state.conditions.length || state.candidate_lineages.some((value) => !value || typeof value !== "object" || Array.isArray(value))) issues.push("INVALID_COLLECTION_VALUE");
    if (Math.abs(state.habitats.reduce((sum, habitat) => sum + habitat.water_l, 0) - state.resources.water_l) > 0.01) issues.push("HABITAT_WATER_MISMATCH");
    const riverHabitat = state.habitats.find(({ type }) => type === "RIVER_HABITAT");
    if (riverHabitat && riverHabitat.flow_status !== "FLOWING_DOWNHILL") issues.push("RIVER_FLOW_BLOCKED");
    for (let index = 1; index < state.events.length; index += 1) if (state.events[index].previous_state_hash !== state.events[index - 1].next_state_hash) { issues.push("EVENT_HASH_CHAIN_BROKEN"); break; }
    if (state.action_log.some((action) => !action || Object.keys(action).length !== 2 || typeof action.command !== "string" || !action.command.length || typeof action.args !== "object" || action.args === null || Array.isArray(action.args))) issues.push("INVALID_ACTION_LOG");
    if (state.boundaries.simulation_only !== true || state.boundaries.wallet !== "NONE" || state.boundaries.real_kgen !== "NO_REAL_KGEN" || state.boundaries.onchain_transfer !== false || state.boundaries.real_bioengineering !== false || state.boundaries.production_authority !== false || state.boundaries.automatic_new_species !== false || state.boundaries.uncontrolled_reproduction !== false || state.boundaries.public_mutation_endpoints !== false || state.boundaries.maximum_total_population !== ECOLOGY_MAX_POPULATION) issues.push("AUTHORITY_BOUNDARY_VIOLATION");
    return { ok: issues.length === 0, issues, state_hash: ecologyHash(stateCore()), total_biological_population: biological, maximum_total_population: ECOLOGY_MAX_POPULATION, event_count: state.events.length };
  }
  if (!integrityReport().ok) throw new Error("INVALID_ECOLOGY_INITIAL_STATE");
  return Object.freeze({ createEcosystem, createHabitat, addPopulation, advanceTime, evaluateResources, evaluateCarryingCapacity, processGrowth, processReproduction, processCompetition, processFoodConsumption, processDeath, processDecomposition, processWaterCycle, processSoilCycle, processPollution, processDrought, processMigration, processRestoration, processNaturalSelection, start, pause, resume, stop, exportState, importState, resetState, replayEvents, getState: publicState, integrityReport, subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }, destroy() { subscribers.clear(); destroyed = true; } });
}
