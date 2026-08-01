import assert from "node:assert/strict";
import test from "node:test";

import {
  CHARTER_FOUNDATION_BOUNDARIES,
  createDeterministicEventEnvelope,
  evaluateCausalResources,
  evaluateRightsCapability,
  foundationHash,
  normalizeSimulationClock,
  projectEnvironmentState,
  runFoundationGate
} from "../foundation/charter-foundation-runtime.js";

const environment = Object.freeze({ source_id: "ENV-K280", temperature_c: 22, gravity_mps2: 9.80665, water_available: true, oxygen_available: true, terrain_class: "PLAIN", location: Object.freeze({ x_m: 10, y_m: 20 }) });
const resources = Object.freeze({ energy_available_j: 1000, energy_required_j: 250, material_available: Object.freeze({ WOOD: 10 }), material_required: Object.freeze({ WOOD: 4 }) });
const rights = Object.freeze({ required_capabilities: Object.freeze(["BUILD_SIMULATION"]), granted_capabilities: Object.freeze(["BUILD_SIMULATION"]), requires_production_authority: false });

test("clock adapter normalizes without owning or mutating source clocks", () => {
  const source = Object.freeze({ clock_id: "CLOCK-A", day: 1, hour: 2, minute: 3, second: 4 });
  assert.deepEqual(normalizeSimulationClock(source), { schema_version: "1.0.0", status: "NORMALIZED", simulation_time_seconds: 93784, source_clock_id: "CLOCK-A", source_revision: "UNSPECIFIED_REVISION", owns_source_clock: false });
  assert.equal(source.day, 1);
});

test("same event inputs produce the same stable hashes", () => {
  const input = { event_id: "EVENT-001", clock: { simulation_time_seconds: 10 }, actor: "PLAYER-001", action: "TEST", inputs: { b: 2, a: 1 }, outputs: { ok: true }, previous_state: { value: 1 }, next_state: { value: 2 } };
  assert.deepEqual(createDeterministicEventEnvelope(input), createDeterministicEventEnvelope(structuredClone(input)));
  const immutableEnvelope = createDeterministicEventEnvelope(input);
  assert.equal(Object.isFrozen(immutableEnvelope.inputs), true);
  assert.throws(() => { immutableEnvelope.inputs.a = 99; }, TypeError);
  assert.match(foundationHash(input), /^fnv1a32:[0-9a-f]{8}$/);
  assert.throws(() => createDeterministicEventEnvelope({ ...input, next_state: undefined }), /next_state/);
  assert.throws(() => createDeterministicEventEnvelope({ ...input, deltas: { energy_delta: Number.NaN } }), /energy_delta/);
});

test("environment projection is read-only and validates physics fields", () => {
  const projection = projectEnvironmentState(environment);
  assert.equal(projection.status, "READ_ONLY_PROJECTION");
  assert.equal(projection.mutates_source, false);
  assert.throws(() => projectEnvironmentState({ ...environment, gravity_mps2: 0 }), /gravity/);
});

test("resource gate conserves energy and material accounting", () => {
  const result = evaluateCausalResources(resources);
  assert.equal(result.status, "PASS");
  assert.equal(result.energy_delta_j, -250);
  assert.deepEqual(result.material_delta, { WOOD: -4 });
  assert.equal(evaluateCausalResources({ ...resources, energy_available_j: 1 }).reason, "INSUFFICIENT_ENERGY");
  assert.equal(evaluateCausalResources({ ...resources, material_available: { WOOD: 1 } }).reason, "INSUFFICIENT_MATERIAL");
  assert.throws(() => evaluateCausalResources({ ...resources, energy_required_j: -1 }), /non-negative/);
});

test("rights gate denies missing capabilities and all production authority", () => {
  assert.equal(evaluateRightsCapability(rights).status, "PASS");
  assert.equal(evaluateRightsCapability({ required_capabilities: ["BUILD"], granted_capabilities: [] }).reason, "MISSING_CAPABILITY");
  assert.equal(evaluateRightsCapability({ required_capabilities: [], granted_capabilities: [], requires_production_authority: true }).reason, "PRODUCTION_AUTHORITY_DISABLED");
});

test("foundation state machine stops at the first failing gate", () => {
  const passed = runFoundationGate({ clock: { second: 1 }, environment, resources, rights });
  assert.deepEqual(passed.trace, ["INPUT_VALIDATION", "NORMALIZATION", "CAUSAL_GATE", "CAPABILITY_GATE", "RESULT"]);
  const blocked = runFoundationGate({ clock: { second: 1 }, environment, resources: { ...resources, energy_available_j: 0 }, rights });
  assert.equal(blocked.reason, "INSUFFICIENT_ENERGY");
  assert.deepEqual(blocked.trace, ["INPUT_VALIDATION", "NORMALIZATION", "CAUSAL_GATE"]);
});

test("foundation adapters have no wallet, KGEN, persistence, network or authority", () => {
  assert.deepEqual(CHARTER_FOUNDATION_BOUNDARIES, { mode: "LOCAL_DETERMINISTIC_SIMULATION", simulation_only: true, state_owner: false, persistence: false, network_mutation: false, wallet: "NONE", real_kgen: false, onchain_transfer: false, legal_effect: false, production_authority: false });
});
