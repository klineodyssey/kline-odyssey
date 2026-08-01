const RUNTIME_VERSION = "1.0.0";
const MAX_TICKS = 10_000;
const MAX_EVENTS = 500;

export const FOUNDATIONAL_LIFE_PACKAGES = Object.freeze([
  "grass",
  "tree",
  "fish",
  "shrimp",
  "mountain",
  "soil",
  "water",
  "river"
]);

export const LIFE_RUNTIME_BOUNDARIES = Object.freeze({
  mode: "LOCAL_DETERMINISTIC_SIMULATION",
  simulation_only: true,
  production_authority: false,
  wallet: "NONE",
  real_kgen: "NO_REAL_KGEN",
  settlement: false,
  network_required: false
});

const BIOLOGICAL_PACKAGES = new Set(["grass", "tree", "fish", "shrimp"]);
const PLANT_PACKAGES = new Set(["grass", "tree"]);
const MARINE_PACKAGES = new Set(["fish", "shrimp"]);
const FORMATION_PACKAGES = new Set(["mountain", "soil", "water", "river"]);

const DEFAULT_ENVIRONMENTS = Object.freeze({
  grass: Object.freeze({ water: 0.72, sunlight: 0.8, soil_nutrients: 0.7, temperature_c: 22 }),
  tree: Object.freeze({ water: 0.7, sunlight: 0.78, soil_nutrients: 0.72, temperature_c: 21 }),
  fish: Object.freeze({ compatible_water: true, dissolved_oxygen: 0.78, feed: 0.7, temperature_c: 22, salinity_ppt: 4 }),
  shrimp: Object.freeze({ compatible_water: true, dissolved_oxygen: 0.75, feed: 0.7, temperature_c: 27, salinity_ppt: 18 }),
  mountain: Object.freeze({ elapsed_time: true, tectonic_force: 0.2, erosion_pressure: 0.08, temperature_c: 8 }),
  soil: Object.freeze({ elapsed_time: true, water: 0.62, organic_matter: 0.58, erosion_pressure: 0.08, contamination: 0 }),
  water: Object.freeze({ elapsed_time: true, inflow: 0.5, consumption: 0.08, evaporation: 0.06, pollution: 0, temperature_c: 18 }),
  river: Object.freeze({ elapsed_time: true, source_flow: 0.68, inflow: 0.56, evaporation: 0.04, pollution: 0, source_elevation_m: 520, mouth_elevation_m: 400 })
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function clamp(value, minimum = 0, maximum = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function round(value, precision = 6) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function stateHash(value) {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function deterministicNoise(seed, packageName, tick) {
  const hash = stateHash(`${seed}|${packageName}|${tick}`);
  return parseInt(hash.slice(-8), 16) / 0xffffffff;
}

function runtimeError(code, message) {
  const error = new Error(message);
  error.name = "FoundationalLifeRuntimeError";
  error.code = code;
  return error;
}

function validateDefinition(definition) {
  if (!isRecord(definition) || !FOUNDATIONAL_LIFE_PACKAGES.includes(definition.package_name)) {
    throw runtimeError("INVALID_DEFINITION", "A recognized package_name is required");
  }
  if (!isRecord(definition.manifest) || typeof definition.manifest.life_id !== "string") {
    throw runtimeError("INVALID_MANIFEST", `${definition.package_name} requires a canonical manifest`);
  }
  if (!isRecord(definition.environment) || !isRecord(definition.growth_or_formation)) {
    throw runtimeError("MISSING_CAUSAL_INPUT", `${definition.package_name} requires environment and growth or formation records`);
  }
  return definition;
}

function validateEnvironmentOverrides(overrides) {
  for (const [key, value] of Object.entries(overrides)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) {
      throw runtimeError("INVALID_ENVIRONMENT", `Environment key ${key} is invalid`);
    }
    if (typeof value === "number" && Number.isFinite(value)) continue;
    if (typeof value === "boolean") continue;
    throw runtimeError("INVALID_ENVIRONMENT", `Environment value ${key} must be a finite number or boolean`);
  }
}

function initialState(definition) {
  const { package_name: packageName, manifest } = definition;
  const biological = BIOLOGICAL_PACKAGES.has(packageName);
  return {
    package_name: packageName,
    life_id: manifest.life_id,
    species_id: manifest.species_id,
    life_type: manifest.life_type,
    display_name: manifest.display_name,
    simulation_time: 0,
    tick: 0,
    life_state: biological ? "ALIVE" : "STABLE",
    health: biological ? 100 : null,
    integrity: 100,
    energy: biological ? 70 : 100,
    water_balance: packageName === "water" || packageName === "river" ? 100 : 70,
    growth_progress: biological ? 0 : null,
    formation_progress: FORMATION_PACKAGES.has(packageName) ? 0 : null,
    natural_change_count: 0,
    terminated: false,
    termination_reason: null,
    environment: clone(DEFAULT_ENVIRONMENTS[packageName]),
    revision: 0,
    state_hash: null,
    event_history: []
  };
}

function publicState(state) {
  return clone(state);
}

function stateForHash(state) {
  const copy = clone(state);
  delete copy.state_hash;
  delete copy.event_history;
  return copy;
}

function plantStep(state, environment, noise) {
  const water = clamp(environment.water ?? 0, 0, 1);
  const sunlight = clamp(environment.sunlight ?? 0, 0, 1);
  const nutrients = clamp(environment.soil_nutrients ?? 0, 0, 1);
  const temperature = Number(environment.temperature_c ?? 20);
  const temperatureFit = temperature >= 5 && temperature <= 38 ? 1 : 0.2;
  const support = Math.min(water, sunlight, nutrients, temperatureFit);
  state.energy = clamp(state.energy + sunlight * 4 - 1.4);
  state.water_balance = clamp(state.water_balance + water * 3 - 1.8);
  if (support >= 0.35 && state.energy > 10 && state.water_balance > 10) {
    state.growth_progress = clamp(state.growth_progress + support * (0.7 + noise * 0.2));
    state.health = clamp(state.health + 0.15);
  } else {
    state.health = clamp(state.health - (0.35 - support) * 4);
  }
}

function marineStep(state, environment, noise) {
  const oxygen = clamp(environment.dissolved_oxygen ?? 0, 0, 1);
  const feed = clamp(environment.feed ?? 0, 0, 1);
  const waterCompatible = environment.compatible_water === true;
  const support = waterCompatible ? Math.min(oxygen, feed) : 0;
  state.energy = clamp(state.energy + feed * 3 - 1.8);
  state.water_balance = waterCompatible ? 100 : clamp(state.water_balance - 25);
  if (support >= 0.4 && state.energy > 8) {
    state.growth_progress = clamp(state.growth_progress + support * (0.6 + noise * 0.25));
    state.health = clamp(state.health + 0.1);
  } else {
    state.health = clamp(state.health - (waterCompatible ? 1.5 : 18));
  }
}

function mountainStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const tectonic = clamp(environment.tectonic_force ?? 0, 0, 1);
  const erosion = clamp(environment.erosion_pressure ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + tectonic * 0.05);
  state.integrity = clamp(state.integrity - erosion * 0.04 + tectonic * 0.005);
}

function soilStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const water = clamp(environment.water ?? 0, 0, 1);
  const organic = clamp(environment.organic_matter ?? 0, 0, 1);
  const erosion = clamp(environment.erosion_pressure ?? 0, 0, 1);
  const contamination = clamp(environment.contamination ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + Math.min(water, organic) * 0.08);
  state.water_balance = clamp(state.water_balance + water * 2 - 1);
  state.integrity = clamp(state.integrity + organic * 0.04 - erosion * 0.5 - contamination * 1.5);
}

function waterStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const inflow = clamp(environment.inflow ?? 0, 0, 1);
  const consumption = clamp(environment.consumption ?? 0, 0, 1);
  const evaporation = clamp(environment.evaporation ?? 0, 0, 1);
  const pollution = clamp(environment.pollution ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + inflow * 0.06);
  state.water_balance = clamp(state.water_balance + inflow * 2 - consumption * 2 - evaporation * 2);
  state.integrity = clamp(state.integrity - pollution * 1.5);
}

function riverStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const sourceFlow = clamp(environment.source_flow ?? 0, 0, 1);
  const inflow = clamp(environment.inflow ?? 0, 0, 1);
  const evaporation = clamp(environment.evaporation ?? 0, 0, 1);
  const pollution = clamp(environment.pollution ?? 0, 0, 1);
  const downhill = Number(environment.source_elevation_m) > Number(environment.mouth_elevation_m);
  if (!downhill) {
    state.integrity = clamp(state.integrity - 25);
    return "UPHILL_FLOW_BLOCKED";
  }
  if (elapsed && sourceFlow > 0) state.formation_progress = clamp(state.formation_progress + sourceFlow * 0.05);
  state.water_balance = clamp(state.water_balance + inflow * 2 - evaporation * 2 - (sourceFlow > 0 ? 0.4 : 4));
  state.integrity = clamp(state.integrity - pollution * 1.5 - (sourceFlow <= 0 ? 1 : 0));
  return null;
}

function deriveState(state) {
  const vital = state.health === null ? state.integrity : Math.min(state.health, state.integrity);
  if (vital <= 0 || state.water_balance <= 0) {
    state.terminated = true;
    state.termination_reason = state.water_balance <= 0 ? "WATER_DEPLETION" : "HEALTH_OR_INTEGRITY_DEPLETION";
    state.life_state = BIOLOGICAL_PACKAGES.has(state.package_name) ? "DEAD" : "TERMINATED";
  } else if (BIOLOGICAL_PACKAGES.has(state.package_name)) {
    state.life_state = vital < 35 ? "STRESSED" : "ALIVE";
  } else {
    state.life_state = vital < 35 ? "DEGRADED" : "STABLE";
  }
}

function applyStep(state, environment, seed) {
  const noise = deterministicNoise(seed, state.package_name, state.tick + 1);
  let blockReason = null;
  if (PLANT_PACKAGES.has(state.package_name)) plantStep(state, environment, noise);
  else if (MARINE_PACKAGES.has(state.package_name)) marineStep(state, environment, noise);
  else if (state.package_name === "mountain") mountainStep(state, environment);
  else if (state.package_name === "soil") soilStep(state, environment);
  else if (state.package_name === "water") waterStep(state, environment);
  else if (state.package_name === "river") blockReason = riverStep(state, environment);
  state.natural_change_count += 1;
  deriveState(state);
  return blockReason;
}

export function createFoundationalLifeRuntime({ definitions, seed = "KAIOS-LIFE-RUNTIME-V1", snapshot = null } = {}) {
  if (!Array.isArray(definitions) || definitions.length !== FOUNDATIONAL_LIFE_PACKAGES.length) {
    throw runtimeError("INCOMPLETE_DEFINITIONS", "All eight foundational definitions are required");
  }
  const validated = definitions.map(validateDefinition);
  const packageNames = validated.map(({ package_name: name }) => name);
  if (new Set(packageNames).size !== FOUNDATIONAL_LIFE_PACKAGES.length || FOUNDATIONAL_LIFE_PACKAGES.some((name) => !packageNames.includes(name))) {
    throw runtimeError("DUPLICATE_OR_MISSING_PACKAGE", "Definitions must contain each foundational package exactly once");
  }
  const definitionMap = new Map(validated.map((definition) => [definition.package_name, clone(definition)]));
  const initialStates = new Map(validated.map((definition) => [definition.package_name, initialState(definition)]));
  let states = new Map([...initialStates].map(([name, state]) => [name, clone(state)]));
  let actionLog = [];
  let eventSequence = 0;

  function appendEvent(state, type, inputs, previousHash, reason = null) {
    eventSequence += 1;
    const nextHash = stateHash(stateForHash(state));
    state.state_hash = nextHash;
    state.event_history.push({
      event_id: `LRT-V1-${String(eventSequence).padStart(6, "0")}`,
      simulation_time: state.simulation_time,
      package_name: state.package_name,
      life_id: state.life_id,
      type,
      inputs: clone(inputs),
      status: reason ? "BLOCKED" : "APPLIED",
      reason,
      previous_state_hash: previousHash,
      next_state_hash: nextHash
    });
    state.event_history = state.event_history.slice(-MAX_EVENTS);
  }

  function tick(packageName, environmentOverrides = {}) {
    if (!states.has(packageName)) throw runtimeError("PACKAGE_NOT_FOUND", `Unknown package ${packageName}`);
    const state = states.get(packageName);
    if (state.terminated) throw runtimeError("LIFE_TERMINATED", `${packageName} can no longer advance`);
    if (state.tick >= MAX_TICKS) throw runtimeError("TICK_LIMIT_REACHED", `${packageName} reached the bounded tick limit`);
    if (!isRecord(environmentOverrides)) throw runtimeError("INVALID_ENVIRONMENT", "Environment overrides must be an object");
    validateEnvironmentOverrides(environmentOverrides);
    const previousHash = state.state_hash ?? stateHash(stateForHash(state));
    const environment = { ...state.environment, ...clone(environmentOverrides) };
    state.environment = environment;
    const blockReason = applyStep(state, environment, seed);
    state.tick += 1;
    state.simulation_time += 1;
    state.revision += 1;
    appendEvent(state, "TICK", environmentOverrides, previousHash, blockReason);
    actionLog.push({ package_name: packageName, environment: clone(environmentOverrides) });
    return publicState(state);
  }

  function tickAll(environmentByPackage = {}) {
    if (!isRecord(environmentByPackage)) throw runtimeError("INVALID_ENVIRONMENT", "Package environments must be an object");
    return FOUNDATIONAL_LIFE_PACKAGES.map((name) => (
      states.get(name).terminated
        ? getState(name)
        : tick(name, environmentByPackage[name] ?? {})
    ));
  }

  function reset() {
    states = new Map([...initialStates].map(([name, state]) => [name, clone(state)]));
    actionLog = [];
    eventSequence = 0;
    return listStates();
  }

  function listStates() {
    return FOUNDATIONAL_LIFE_PACKAGES.map((name) => publicState(states.get(name)));
  }

  function getState(packageName) {
    if (!states.has(packageName)) throw runtimeError("PACKAGE_NOT_FOUND", `Unknown package ${packageName}`);
    return publicState(states.get(packageName));
  }

  function exportSimulation() {
    return {
      schema_version: RUNTIME_VERSION,
      runtime: "KAIOS_LIFE_RUNTIME_V1",
      boundaries: clone(LIFE_RUNTIME_BOUNDARIES),
      seed,
      definitions: FOUNDATIONAL_LIFE_PACKAGES.map((name) => clone(definitionMap.get(name))),
      states: listStates(),
      action_log: clone(actionLog)
    };
  }

  function importSimulation(envelope) {
    if (!isRecord(envelope) || envelope.runtime !== "KAIOS_LIFE_RUNTIME_V1" || envelope.schema_version !== RUNTIME_VERSION) {
      throw runtimeError("INVALID_IMPORT", "Import is not a Life Runtime V1 envelope");
    }
    if (envelope.seed !== seed) {
      throw runtimeError("SEED_MISMATCH", "Import seed does not match this deterministic runtime");
    }
    if (!Array.isArray(envelope.states) || envelope.states.length !== FOUNDATIONAL_LIFE_PACKAGES.length) {
      throw runtimeError("INVALID_IMPORT", "Import must contain eight states");
    }
    const imported = new Map();
    for (const candidate of envelope.states) {
      if (!FOUNDATIONAL_LIFE_PACKAGES.includes(candidate?.package_name) || imported.has(candidate.package_name)) {
        throw runtimeError("INVALID_IMPORT", "Import package set is invalid");
      }
      if (candidate.tick > MAX_TICKS || candidate.life_id !== definitionMap.get(candidate.package_name).manifest.life_id) {
        throw runtimeError("INVALID_IMPORT", `Import state for ${candidate.package_name} is incompatible`);
      }
      if (!Number.isInteger(candidate.tick) || candidate.tick < 0 || !Number.isFinite(candidate.simulation_time) || !Number.isInteger(candidate.revision) || !isRecord(candidate.environment) || !Array.isArray(candidate.event_history) || typeof candidate.terminated !== "boolean") {
        throw runtimeError("INVALID_IMPORT", `Import state for ${candidate.package_name} is malformed`);
      }
      if (candidate.state_hash !== null && candidate.state_hash !== stateHash(stateForHash(candidate))) {
        throw runtimeError("STATE_HASH_MISMATCH", `Import state for ${candidate.package_name} failed integrity validation`);
      }
      imported.set(candidate.package_name, clone(candidate));
    }
    states = imported;
    actionLog = Array.isArray(envelope.action_log) ? clone(envelope.action_log) : [];
    eventSequence = Math.max(0, ...listStates().flatMap(({ event_history }) => event_history.map(({ event_id }) => Number(event_id.split("-").at(-1)) || 0)));
    return listStates();
  }

  function replay(actions = actionLog) {
    const replayActions = clone(actions);
    reset();
    for (const action of replayActions) tick(action.package_name, action.environment ?? {});
    return listStates();
  }

  if (snapshot) importSimulation(snapshot);

  return Object.freeze({
    version: RUNTIME_VERSION,
    boundaries: LIFE_RUNTIME_BOUNDARIES,
    tick,
    tickAll,
    getState,
    listStates,
    exportSimulation,
    importSimulation,
    replay,
    reset
  });
}
