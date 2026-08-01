const VERSION = "1.0.0";

export const CHARTER_FOUNDATION_BOUNDARIES = Object.freeze({
  mode: "LOCAL_DETERMINISTIC_SIMULATION",
  simulation_only: true,
  state_owner: false,
  persistence: false,
  network_mutation: false,
  wallet: "NONE",
  real_kgen: false,
  onchain_transfer: false,
  legal_effect: false,
  production_authority: false
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function immutable(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}

function finiteNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`${field} must be a finite non-negative number`);
  return number;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new RangeError(`${field} must be finite`);
  return number;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function foundationHash(value) {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function normalizeSimulationClock(source) {
  if (!isRecord(source)) throw new TypeError("Simulation clock source must be an object");
  const seconds = source.simulation_time_seconds === undefined
    ? finiteNonNegative(source.day ?? 0, "day") * 86_400
      + finiteNonNegative(source.hour ?? 0, "hour") * 3_600
      + finiteNonNegative(source.minute ?? 0, "minute") * 60
      + finiteNonNegative(source.second ?? 0, "second")
    : finiteNonNegative(source.simulation_time_seconds, "simulation_time_seconds");
  return immutable({
    schema_version: VERSION,
    status: "NORMALIZED",
    simulation_time_seconds: seconds,
    source_clock_id: String(source.clock_id ?? "UNSPECIFIED_CLOCK"),
    source_revision: String(source.revision ?? "UNSPECIFIED_REVISION"),
    owns_source_clock: false
  });
}

export function projectEnvironmentState(source) {
  if (!isRecord(source)) throw new TypeError("Environment source must be an object");
  const temperature = Number(source.temperature_c);
  const gravity = Number(source.gravity_mps2);
  if (!Number.isFinite(temperature)) throw new RangeError("temperature_c must be finite");
  if (!Number.isFinite(gravity) || gravity <= 0) throw new RangeError("gravity_mps2 must be positive and finite");
  if (!source.location) throw new TypeError("location is required");
  return immutable({
    schema_version: VERSION,
    status: "READ_ONLY_PROJECTION",
    temperature_c: temperature,
    gravity_mps2: gravity,
    water_available: Boolean(source.water_available ?? source.water),
    oxygen_available: Boolean(source.oxygen_available ?? source.dissolved_oxygen),
    terrain_class: String(source.terrain_class ?? "SOURCE_UNDERSPECIFIED"),
    location: clone(source.location),
    source_id: String(source.source_id ?? "UNSPECIFIED_ENVIRONMENT"),
    mutates_source: false
  });
}

function normalizedMaterials(value, field) {
  if (!isRecord(value)) throw new TypeError(`${field} must be an object`);
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, amount]) => [key, finiteNonNegative(amount, `${field}.${key}`)]));
}

export function evaluateCausalResources({ energy_available_j, energy_required_j, material_available = {}, material_required = {} }) {
  const energyAvailable = finiteNonNegative(energy_available_j, "energy_available_j");
  const energyRequired = finiteNonNegative(energy_required_j, "energy_required_j");
  const available = normalizedMaterials(material_available, "material_available");
  const required = normalizedMaterials(material_required, "material_required");
  const missing = Object.entries(required).filter(([material, amount]) => (available[material] ?? 0) < amount).map(([material]) => material);
  const reason = energyAvailable < energyRequired
    ? "INSUFFICIENT_ENERGY"
    : missing.length
      ? "INSUFFICIENT_MATERIAL"
      : null;
  return immutable({
    schema_version: VERSION,
    status: reason ? "BLOCKED" : "PASS",
    reason,
    energy_delta_j: reason ? 0 : -energyRequired,
    material_delta: reason ? {} : Object.fromEntries(Object.entries(required).map(([key, amount]) => [key, -amount])),
    missing_materials: missing,
    mutates_source: false
  });
}

export function evaluateRightsCapability({ required_capabilities = [], granted_capabilities = [], requires_production_authority = false }) {
  if (!Array.isArray(required_capabilities) || !Array.isArray(granted_capabilities)) throw new TypeError("Capability inputs must be arrays");
  const required = [...new Set(required_capabilities.map(String))].sort();
  const granted = new Set(granted_capabilities.map(String));
  const missing = required.filter((capability) => !granted.has(capability));
  const reason = requires_production_authority
    ? "PRODUCTION_AUTHORITY_DISABLED"
    : missing.length
      ? "MISSING_CAPABILITY"
      : null;
  return immutable({
    schema_version: VERSION,
    status: reason ? "BLOCKED" : "PASS",
    reason,
    missing_capabilities: missing,
    production_authority: false,
    mutates_rights: false
  });
}

export function createDeterministicEventEnvelope({ event_id, clock, actor, action, inputs = {}, outputs = {}, deltas = {}, previous_state, next_state, status = "APPLIED", reason = null }) {
  if (!event_id || !actor || !action) throw new TypeError("event_id, actor and action are required");
  if (previous_state === undefined || next_state === undefined) throw new TypeError("previous_state and next_state are required");
  const normalizedClock = normalizeSimulationClock(clock);
  const envelope = {
    schema_version: VERSION,
    event_id: String(event_id),
    simulation_time_seconds: normalizedClock.simulation_time_seconds,
    actor: String(actor),
    action: String(action),
    inputs: clone(inputs),
    outputs: clone(outputs),
    resource_delta: clone(deltas.resource_delta ?? {}),
    energy_delta: finiteNumber(deltas.energy_delta ?? 0, "energy_delta"),
    mass_delta: clone(deltas.mass_delta ?? {}),
    health_delta: finiteNumber(deltas.health_delta ?? 0, "health_delta"),
    integrity_delta: finiteNumber(deltas.integrity_delta ?? 0, "integrity_delta"),
    previous_state_hash: foundationHash(previous_state),
    next_state_hash: foundationHash(next_state),
    status: String(status),
    reason,
    authority: "SIMULATION_ONLY"
  };
  return immutable({ ...envelope, envelope_hash: foundationHash(envelope) });
}

export function runFoundationGate({ clock, environment, resources, rights }) {
  const trace = ["INPUT_VALIDATION"];
  try {
    const normalizedClock = normalizeSimulationClock(clock);
    const environmentProjection = projectEnvironmentState(environment);
    trace.push("NORMALIZATION");
    const resourceGate = evaluateCausalResources(resources);
    trace.push("CAUSAL_GATE");
    if (resourceGate.status === "BLOCKED") return immutable({ status: "BLOCKED", reason: resourceGate.reason, trace, normalizedClock, environmentProjection, resourceGate });
    const capabilityGate = evaluateRightsCapability(rights);
    trace.push("CAPABILITY_GATE");
    if (capabilityGate.status === "BLOCKED") return immutable({ status: "BLOCKED", reason: capabilityGate.reason, trace, normalizedClock, environmentProjection, resourceGate, capabilityGate });
    trace.push("RESULT");
    return immutable({ status: "PASS", reason: null, trace, normalizedClock, environmentProjection, resourceGate, capabilityGate });
  } catch (error) {
    return immutable({ status: "BLOCKED", reason: "INVALID_INPUT", trace, detail: error instanceof Error ? error.message : "Unknown validation failure" });
  }
}
