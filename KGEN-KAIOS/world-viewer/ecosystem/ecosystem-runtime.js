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
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;
const TROPHIC_ROLES = new Set(["PRODUCER", "CONSUMER", "PREDATOR", "OMNIVORE", "DECOMPOSER"]);

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
        CONSUMER: 0.0025,
        PREDATOR: 0.001,
        OMNIVORE: 0.002,
        DECOMPOSER: 0.004
      }[species.trophic_role] ?? 0;
      const healthFactor = species.health / 100;
      const changeRate = species.health <= 0
        ? -0.35 * days
        : species.health < 25
          ? -0.08 * days
          : baseGrowth * healthFactor * days;
      species.population = Math.max(0, Math.round(species.population * (1 + changeRate)));
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
