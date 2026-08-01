const RUNTIME_VERSION = "1.0.0";
const MAX_TICKS = 10_000;
const MAX_EVENTS = 500;
const SECONDS_PER_TICK = 86_400;
const EARTH_GRAVITY_M_S2 = 9.80665;

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
  grass: Object.freeze({ elapsed_time: true, water: 0.72, sunlight: 0.8, soil_nutrients: 0.7, compatible_soil: true, temperature_c: 22, grazing_pressure: 0 }),
  tree: Object.freeze({ elapsed_time: true, water: 0.7, sunlight: 0.78, soil_nutrients: 0.72, compatible_soil: true, temperature_c: 21, disease_pressure: 0 }),
  fish: Object.freeze({ elapsed_time: true, compatible_water: true, dissolved_oxygen: 0.78, feed: 0.7, temperature_c: 22, salinity_ppt: 4, movement_distance_m: 12 }),
  shrimp: Object.freeze({ elapsed_time: true, compatible_water: true, dissolved_oxygen: 0.75, feed: 0.7, temperature_c: 27, salinity_ppt: 18, water_quality: 0.82 }),
  mountain: Object.freeze({ elapsed_time: true, tectonic_force: 0.2, erosion_pressure: 0.08, weathering_pressure: 0.05, repair_input: 0, temperature_c: 8 }),
  soil: Object.freeze({ elapsed_time: true, water: 0.62, organic_matter: 0.58, erosion_pressure: 0.08, contamination: 0, compaction_pressure: 0.05, amendment_input: 0 }),
  water: Object.freeze({ elapsed_time: true, inflow: 0.5, consumption: 0.08, evaporation: 0.06, pollution: 0, purification: 0, temperature_c: 18, heat_energy: 0.25 }),
  river: Object.freeze({ elapsed_time: true, source_flow: 0.68, inflow: 0.56, outflow: 0.52, evaporation: 0.04, pollution: 0, sediment_load: 0.15, source_elevation_m: 520, mouth_elevation_m: 400, has_bridge: false, bridge_open: false })
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
  if (!isRecord(definition.environment) || !isRecord(definition.growth_or_formation) || !isRecord(definition.taxonomy) || !isRecord(definition.physics) || !isRecord(definition.economy) || !isRecord(definition.rights)) {
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

function initialTraits(packageName, manifest, definition) {
  const extension = manifest.extensions?.[0]?.data ?? {};
  const growth = definition.growth_or_formation;
  const environment = definition.environment.environment_requirements ?? {};
  const traits = {
    formation_or_birth_cause: manifest.birth_or_formation_record?.seeded_from ?? "APPROVED_DETERMINISTIC_INITIALIZATION",
    repair_or_healing: clone(manifest.repair_or_healing ?? {}),
    resource_inputs: clone(manifest.resource_inputs ?? []),
    resource_outputs: clone(manifest.resource_outputs ?? [])
  };
  if (packageName === "grass") Object.assign(traits, { propagation_source: extension.seed ?? "seed", soil_compatible: true, grazing_impact: 0, reproduction_count: 0, growth_stage: "SEEDLING" });
  if (packageName === "tree") Object.assign(traits, { seed: extension.seed ?? "seed", root_system: extension.root_system ?? "root_system", growth_stage: "SEEDLING", biomass_kg: Number(manifest.mass?.value ?? 0), disease: "NONE", reproduction_count: 0, declared_output: extension.fruit ?? extension.wood_output ?? "NONE" });
  if (packageName === "fish") Object.assign(traits, { water_body_compatible: true, oxygen_status: "SUFFICIENT", salinity_ppt: 4, food_level: 0.7, movement_distance_m: 0, reproduction_count: 0 });
  if (packageName === "shrimp") Object.assign(traits, { water_body_compatible: true, oxygen_status: "SUFFICIENT", salinity_ppt: 18, water_quality: 0.82, food_level: 0.7, molt_count: 0, larval_stage: "JUVENILE", reproduction_count: 0 });
  if (packageName === "mountain") Object.assign(traits, { geology: clone(growth.geology ?? manifest.extensions?.[0]?.data?.geology ?? {}), elevation_m: Number(growth.elevation_m ?? manifest.dimensions?.elevation_m ?? 520), slope_degrees: Number(growth.slope_degrees ?? manifest.dimensions?.slope_degrees ?? 22), erosion: 0, weathering: 0, stability: 100, resource_deposits: clone(growth.resource_deposits ?? []), water_source_role: growth.water_source_role ?? "UPLAND_SOURCE", collapse_state: "STABLE" });
  if (packageName === "soil") Object.assign(traits, { composition: clone(manifest.material_composition ?? {}), moisture: 62, fertility: 58, ph: Number(growth.ph ?? growth.pH ?? 6.8), organic_matter: 58, compaction: 5, erosion: 0, contamination: 0, crop_support: true, foundation_support: true });
  if (packageName === "water") Object.assign(traits, { physical_state: "LIQUID", purity: 100, pollution: 0, evaporated_mass_kg: 0, frozen_mass_kg: 0, boiled_mass_kg: 0, consumed_mass_kg: 0, life_support_role: environment.life_support_role ?? "FOUNDATIONAL" });
  if (packageName === "river") Object.assign(traits, { source: environment.source ?? "upland spring candidate", path: environment.path ?? "downhill channel", flow_state: "FLOWING", inflow: 0.56, outflow: 0.52, width_m: Number(growth.width_m ?? 8), depth_m: Number(growth.depth_m ?? 1.4), sediment: 0.15, pollution: 0, flood_state: false, drought_state: false, bridge_interaction: "NO_BRIDGE", transport_blocking: true, irrigation_role: growth.irrigation_role ?? "SIMULATED_IRRIGATION" });
  return traits;
}

function initialState(definition) {
  const { package_name: packageName, manifest } = definition;
  const biological = BIOLOGICAL_PACKAGES.has(packageName);
  const massKg = Number(manifest.mass?.value ?? 0);
  const volumeM3 = Number(manifest.volume?.value ?? 0);
  const formationRecord = manifest.birth_or_formation_record ?? {};
  return {
    package_name: packageName,
    life_id: manifest.life_id,
    species_id: manifest.species_id,
    life_type: manifest.life_type,
    display_name: manifest.display_name,
    taxonomy: clone(manifest.taxonomy ?? definition.taxonomy),
    location: clone(manifest.location),
    economic_role: clone(manifest.economic_role ?? definition.economy),
    rights: clone(manifest.rights ?? definition.rights),
    approval_status: ["CANDIDATE_PACKAGE", "RUNTIME_VALIDATED", "CANONICAL_SCHEMA_COMPATIBLE", "NOT_PRODUCTION_AUTHORIZED"],
    initialization_cause: clone(formationRecord),
    simulation_time: 0,
    simulation_time_seconds: 0,
    tick: 0,
    age_days: 0,
    life_state: biological ? "ALIVE" : "STABLE",
    health: biological ? 100 : null,
    integrity: 100,
    energy: biological ? 70 : 100,
    mass_kg: massKg,
    initial_mass_kg: massKg,
    volume_m3: volumeM3,
    gravity_m_s2: Number(definition.physics?.gravity_m_s2 ?? EARTH_GRAVITY_M_S2),
    water_balance: packageName === "water" || packageName === "river" ? 100 : 70,
    growth_progress: biological ? 0 : null,
    formation_progress: FORMATION_PACKAGES.has(packageName) ? 0 : null,
    natural_change_count: 0,
    terminated: false,
    termination_reason: null,
    environment: clone(DEFAULT_ENVIRONMENTS[packageName]),
    traits: initialTraits(packageName, manifest, definition),
    runtime_status: "RUNNING",
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
  delete copy.runtime_status;
  return copy;
}

function plantStep(state, environment, noise) {
  const elapsed = environment.elapsed_time === true;
  const water = clamp(environment.water ?? 0, 0, 1);
  const sunlight = clamp(environment.sunlight ?? 0, 0, 1);
  const nutrients = clamp(environment.soil_nutrients ?? 0, 0, 1);
  const soilCompatible = environment.compatible_soil === true;
  const temperature = Number(environment.temperature_c ?? 20);
  const temperatureFit = temperature >= 5 && temperature <= 38 ? 1 : 0.2;
  const support = elapsed && soilCompatible ? Math.min(water, sunlight, nutrients, temperatureFit) : 0;
  state.energy = clamp(state.energy + sunlight * 4 - 1.4 - clamp(environment.grazing_pressure ?? 0, 0, 1));
  state.water_balance = clamp(state.water_balance + water * 3 - 1.8);
  if (support >= 0.35 && state.energy > 10 && state.water_balance > 10) {
    const growth = support * (0.7 + noise * 0.2);
    state.growth_progress = clamp(state.growth_progress + growth);
    state.mass_kg = round(state.mass_kg + growth * (state.package_name === "tree" ? 0.03 : 0.001));
    state.health = clamp(state.health + 0.15);
  } else {
    state.health = clamp(state.health - (0.35 - support) * 4);
  }
  state.traits.soil_compatible = soilCompatible;
  if (state.package_name === "grass") {
    const grazing = clamp(environment.grazing_pressure ?? 0, 0, 1);
    state.traits.grazing_impact = round(state.traits.grazing_impact + grazing);
    state.mass_kg = round(Math.max(0, state.mass_kg - grazing * 0.002));
    if (state.growth_progress >= 60 && state.tick > 0 && state.tick % 20 === 0) state.traits.reproduction_count += 1;
    state.traits.growth_stage = state.growth_progress < 20 ? "SEEDLING" : state.growth_progress < 70 ? "VEGETATIVE" : "MATURE";
  } else {
    const disease = clamp(environment.disease_pressure ?? 0, 0, 1);
    state.health = clamp(state.health - disease * 2);
    state.traits.disease = disease > 0.6 ? "ACTIVE" : disease > 0.2 ? "RISK" : "NONE";
    state.traits.biomass_kg = state.mass_kg;
    state.traits.growth_stage = state.growth_progress < 15 ? "SEEDLING" : state.growth_progress < 45 ? "SAPLING" : state.growth_progress < 80 ? "MATURE" : "OLD_GROWTH";
    if (state.growth_progress >= 70 && state.tick > 0 && state.tick % 30 === 0) state.traits.reproduction_count += 1;
  }
}

function marineStep(state, environment, noise) {
  const elapsed = environment.elapsed_time === true;
  const oxygen = clamp(environment.dissolved_oxygen ?? 0, 0, 1);
  const feed = clamp(environment.feed ?? 0, 0, 1);
  const waterCompatible = environment.compatible_water === true;
  const temperature = Number(environment.temperature_c);
  const salinity = Number(environment.salinity_ppt);
  const temperatureFit = state.package_name === "fish" ? temperature >= 12 && temperature <= 28 : temperature >= 20 && temperature <= 32;
  const salinityFit = state.package_name === "fish" ? salinity >= 0 && salinity <= 10 : salinity >= 5 && salinity <= 35;
  const quality = state.package_name === "shrimp" ? clamp(environment.water_quality ?? 0, 0, 1) : 1;
  const support = elapsed && waterCompatible && temperatureFit && salinityFit ? Math.min(oxygen, feed, quality) : 0;
  state.energy = clamp(state.energy + feed * 3 - 1.8);
  state.water_balance = waterCompatible ? 100 : clamp(state.water_balance - 25);
  if (support >= 0.4 && state.energy > 8) {
    const growth = support * (0.6 + noise * 0.25);
    state.growth_progress = clamp(state.growth_progress + growth);
    state.mass_kg = round(state.mass_kg + growth * 0.0002);
    state.health = clamp(state.health + 0.1);
  } else {
    state.health = clamp(state.health - (!waterCompatible ? 18 : oxygen < 0.3 ? 8 : 2.5));
  }
  Object.assign(state.traits, { water_body_compatible: waterCompatible, oxygen_status: oxygen < 0.3 ? "CRITICAL" : oxygen < 0.5 ? "LOW" : "SUFFICIENT", salinity_ppt: salinity, food_level: feed });
  if (state.package_name === "fish") {
    state.traits.movement_distance_m = round(state.traits.movement_distance_m + Math.max(0, Number(environment.movement_distance_m ?? 0)));
    if (state.growth_progress >= 70 && state.tick > 0 && state.tick % 24 === 0) state.traits.reproduction_count += 1;
  } else {
    state.traits.water_quality = quality;
    if (support >= 0.5 && state.tick > 0 && state.tick % 10 === 0) state.traits.molt_count += 1;
    state.traits.larval_stage = state.growth_progress < 20 ? "LARVA" : state.growth_progress < 50 ? "POST_LARVA" : state.growth_progress < 80 ? "JUVENILE" : "ADULT";
    if (state.growth_progress >= 80 && state.tick > 0 && state.tick % 24 === 0) state.traits.reproduction_count += 1;
  }
}

function mountainStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const tectonic = clamp(environment.tectonic_force ?? 0, 0, 1);
  const erosion = clamp(environment.erosion_pressure ?? 0, 0, 1);
  const weathering = clamp(environment.weathering_pressure ?? 0, 0, 1);
  const repair = clamp(environment.repair_input ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + tectonic * 0.05);
  state.integrity = clamp(state.integrity - erosion * 0.4 - weathering * 0.2 + repair * 0.1 + tectonic * 0.005);
  state.traits.erosion = round(state.traits.erosion + erosion);
  state.traits.weathering = round(state.traits.weathering + weathering);
  state.traits.stability = state.integrity;
  state.traits.collapse_state = state.integrity < 20 ? "COLLAPSE_RISK" : state.integrity < 50 ? "UNSTABLE" : "STABLE";
}

function soilStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const water = clamp(environment.water ?? 0, 0, 1);
  const organic = clamp(environment.organic_matter ?? 0, 0, 1);
  const erosion = clamp(environment.erosion_pressure ?? 0, 0, 1);
  const contamination = clamp(environment.contamination ?? 0, 0, 1);
  const compaction = clamp(environment.compaction_pressure ?? 0, 0, 1);
  const amendment = clamp(environment.amendment_input ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + Math.min(water, organic) * 0.08);
  state.water_balance = clamp(state.water_balance + water * 2 - 1);
  state.integrity = clamp(state.integrity + organic * 0.04 + amendment * 0.3 - erosion * 0.5 - contamination * 1.5 - compaction * 0.2);
  state.traits.moisture = state.water_balance;
  state.traits.organic_matter = clamp(state.traits.organic_matter + organic * 0.1);
  state.traits.fertility = clamp(state.traits.fertility + amendment * 0.5 + organic * 0.08 - contamination * 0.8 - erosion * 0.2);
  state.traits.compaction = clamp(state.traits.compaction + compaction * 0.4);
  state.traits.erosion = round(state.traits.erosion + erosion);
  state.traits.contamination = clamp(state.traits.contamination + contamination * 0.5);
  state.traits.crop_support = state.traits.fertility >= 25 && state.traits.contamination < 35;
  state.traits.foundation_support = state.traits.compaction < 80 && state.integrity >= 40;
}

function waterStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const inflow = clamp(environment.inflow ?? 0, 0, 1);
  const consumption = clamp(environment.consumption ?? 0, 0, 1);
  const evaporation = clamp(environment.evaporation ?? 0, 0, 1);
  const pollution = clamp(environment.pollution ?? 0, 0, 1);
  const purification = clamp(environment.purification ?? 0, 0, 1);
  const temperature = Number(environment.temperature_c);
  const heatEnergy = clamp(environment.heat_energy ?? 0, 0, 1);
  if (elapsed) state.formation_progress = clamp(state.formation_progress + inflow * 0.06);
  state.water_balance = clamp(state.water_balance + inflow * 2 - consumption * 2 - evaporation * 2);
  state.energy = clamp(state.energy - evaporation * (1 + heatEnergy));
  state.integrity = clamp(state.integrity - pollution * 1.5 + purification * 0.8);
  const transferredMass = Math.min(state.mass_kg, state.initial_mass_kg * (consumption + evaporation) * 0.001);
  state.mass_kg = round(Math.max(0, state.mass_kg - transferredMass));
  state.traits.consumed_mass_kg = round(state.traits.consumed_mass_kg + state.initial_mass_kg * consumption * 0.001);
  state.traits.evaporated_mass_kg = round(state.traits.evaporated_mass_kg + state.initial_mass_kg * evaporation * 0.001);
  state.traits.pollution = clamp(state.traits.pollution + pollution - purification);
  state.traits.purity = 100 - state.traits.pollution;
  state.traits.physical_state = temperature <= 0 ? "SOLID" : temperature >= 100 ? "GAS" : "LIQUID";
  if (state.traits.physical_state === "SOLID") state.traits.frozen_mass_kg = state.mass_kg;
  if (state.traits.physical_state === "GAS") state.traits.boiled_mass_kg = state.mass_kg;
}

function riverStep(state, environment) {
  const elapsed = environment.elapsed_time === true;
  const sourceFlow = clamp(environment.source_flow ?? 0, 0, 1);
  const inflow = clamp(environment.inflow ?? 0, 0, 1);
  const outflow = clamp(environment.outflow ?? 0, 0, 1);
  const evaporation = clamp(environment.evaporation ?? 0, 0, 1);
  const pollution = clamp(environment.pollution ?? 0, 0, 1);
  const downhill = Number(environment.source_elevation_m) > Number(environment.mouth_elevation_m);
  if (!downhill) {
    state.integrity = clamp(state.integrity - 25);
    state.traits.flow_state = "BLOCKED_UPHILL";
    state.traits.transport_blocking = true;
    return "UPHILL_FLOW_BLOCKED";
  }
  if (elapsed && sourceFlow > 0) state.formation_progress = clamp(state.formation_progress + sourceFlow * 0.05);
  state.water_balance = clamp(state.water_balance + inflow * 2 - outflow * 1.6 - evaporation * 2 - (sourceFlow > 0 ? 0.4 : 4));
  state.integrity = clamp(state.integrity - pollution * 1.5 - (sourceFlow <= 0 ? 1 : 0));
  state.traits.inflow = inflow;
  state.traits.outflow = outflow;
  state.traits.sediment = clamp(environment.sediment_load ?? 0, 0, 1);
  state.traits.pollution = clamp(state.traits.pollution + pollution);
  state.traits.flood_state = state.water_balance >= 95 || inflow > 0.9;
  state.traits.drought_state = state.water_balance <= 20 || sourceFlow <= 0.05;
  state.traits.flow_state = state.traits.flood_state ? "FLOOD" : state.traits.drought_state ? "DROUGHT" : "FLOWING_DOWNHILL";
  state.traits.bridge_interaction = environment.has_bridge === true ? (environment.bridge_open === true ? "BRIDGE_OPEN" : "BRIDGE_CLOSED") : "NO_BRIDGE";
  state.traits.transport_blocking = environment.has_bridge !== true || environment.bridge_open !== true;
  return null;
}

function deriveState(state) {
  if (state.health !== null && state.age_days > 3650) state.health = clamp(state.health - 0.02);
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
  let running = true;

  function appendEvent(state, type, inputs, outputs, deltas, previousHash, reason = null) {
    eventSequence += 1;
    const nextHash = stateHash(stateForHash(state));
    state.state_hash = nextHash;
    state.event_history.push({
      event_id: `LRT-V1-${String(eventSequence).padStart(6, "0")}`,
      simulation_time: state.simulation_time,
      simulation_time_seconds: state.simulation_time_seconds,
      package_name: state.package_name,
      life_id: state.life_id,
      species_id: state.species_id,
      location: clone(state.location),
      action: type,
      type,
      inputs: clone(inputs),
      outputs: clone(outputs),
      resource_delta: clone(deltas.resource_delta),
      energy_delta: deltas.energy_delta,
      mass_delta: clone(deltas.mass_delta),
      health_delta: deltas.health_delta,
      integrity_delta: deltas.integrity_delta,
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
    if (!running) throw runtimeError("RUNTIME_PAUSED", "Resume the deterministic runtime before advancing time");
    if (state.tick >= MAX_TICKS) throw runtimeError("TICK_LIMIT_REACHED", `${packageName} reached the bounded tick limit`);
    if (!isRecord(environmentOverrides)) throw runtimeError("INVALID_ENVIRONMENT", "Environment overrides must be an object");
    validateEnvironmentOverrides(environmentOverrides);
    const previousHash = state.state_hash ?? stateHash(stateForHash(state));
    const before = clone(state);
    const environment = { ...state.environment, ...clone(environmentOverrides) };
    state.environment = environment;
    const blockReason = applyStep(state, environment, seed);
    state.tick += 1;
    state.simulation_time += 1;
    state.simulation_time_seconds += SECONDS_PER_TICK;
    state.age_days = round(state.age_days + 1);
    state.revision += 1;
    const stateMassDelta = round(state.mass_kg - before.mass_kg);
    const resourceDelta = {
      water_balance: round(state.water_balance - before.water_balance),
      growth_or_formation: round((state.growth_progress ?? state.formation_progress ?? 0) - (before.growth_progress ?? before.formation_progress ?? 0))
    };
    const deltas = {
      resource_delta: resourceDelta,
      energy_delta: round(state.energy - before.energy),
      mass_delta: { state_mass_kg: stateMassDelta, inputs_kg: Math.max(0, stateMassDelta), outputs_kg: Math.max(0, -stateMassDelta), balance_kg: 0 },
      health_delta: state.health === null ? 0 : round(state.health - before.health),
      integrity_delta: round(state.integrity - before.integrity)
    };
    appendEvent(state, "TICK", { environment: environmentOverrides, deterministic_seed: seed }, { life_state: state.life_state, traits: state.traits }, deltas, previousHash, blockReason);
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
    running = true;
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
      runtime_status: running ? "RUNNING" : "PAUSED",
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
    running = envelope.runtime_status !== "PAUSED";
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

  function pause() {
    running = false;
    for (const state of states.values()) state.runtime_status = "PAUSED";
    return listStates();
  }

  function resume() {
    running = true;
    for (const state of states.values()) state.runtime_status = "RUNNING";
    return listStates();
  }

  function isRunning() {
    return running;
  }

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
    reset,
    pause,
    resume,
    isRunning
  });
}
