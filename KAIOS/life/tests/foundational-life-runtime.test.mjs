import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FOUNDATIONAL_LIFE_PACKAGES,
  LIFE_RUNTIME_BOUNDARIES,
  createFoundationalLifeRuntime
} from "../runtime/foundational-life-runtime.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES = path.resolve(HERE, "../candidates");

async function json(packageName, fileName) {
  return JSON.parse(await readFile(path.join(CANDIDATES, packageName, fileName), "utf8"));
}

async function loadDefinitions() {
  return Promise.all(FOUNDATIONAL_LIFE_PACKAGES.map(async (packageName) => ({
    package_name: packageName,
    manifest: await json(packageName, "life.manifest.json"),
    environment: await json(packageName, "environment.json"),
    growth_or_formation: await json(packageName, "growth_or_formation.json"),
    health_or_integrity: await json(packageName, "health_or_integrity.json"),
    reproduction_or_change: await json(packageName, "reproduction_or_change.json")
  })));
}

const definitions = await loadDefinitions();

assert.deepEqual(LIFE_RUNTIME_BOUNDARIES, {
  mode: "LOCAL_DETERMINISTIC_SIMULATION",
  simulation_only: true,
  production_authority: false,
  wallet: "NONE",
  real_kgen: "NO_REAL_KGEN",
  settlement: false,
  network_required: false
});

const runtime = createFoundationalLifeRuntime({ definitions, seed: "TEST-SEED-001" });
assert.equal(runtime.listStates().length, 8);
assert.deepEqual(runtime.listStates().map(({ package_name }) => package_name), FOUNDATIONAL_LIFE_PACKAGES);

const grassBefore = runtime.getState("grass");
const grassAfter = runtime.tick("grass");
assert.equal(grassAfter.tick, 1);
assert.ok(grassAfter.growth_progress > grassBefore.growth_progress);
assert.equal(grassAfter.event_history.at(-1).previous_state_hash, grassBefore.state_hash ?? grassAfter.event_history.at(-1).previous_state_hash);
assert.match(grassAfter.state_hash, /^fnv1a32:[0-9a-f]{8}$/);

const formationRuntime = createFoundationalLifeRuntime({ definitions });
formationRuntime.tickAll();
for (const packageName of ["mountain", "soil", "water", "river"]) {
  assert.ok(formationRuntime.getState(packageName).formation_progress > 0, `${packageName} formation should advance`);
}

const riverRuntime = createFoundationalLifeRuntime({ definitions });
const blockedRiver = riverRuntime.tick("river", { source_elevation_m: 100, mouth_elevation_m: 200 });
assert.equal(blockedRiver.event_history.at(-1).status, "BLOCKED");
assert.equal(blockedRiver.event_history.at(-1).reason, "UPHILL_FLOW_BLOCKED");
assert.equal(blockedRiver.formation_progress, 0);

const waterRuntime = createFoundationalLifeRuntime({ definitions });
const waterBefore = waterRuntime.getState("water").water_balance;
const waterAfter = waterRuntime.tick("water", { inflow: 0, consumption: 0.8, evaporation: 0.8 }).water_balance;
assert.ok(waterAfter < waterBefore);

const deathRuntime = createFoundationalLifeRuntime({ definitions });
let terminalGrass = deathRuntime.getState("grass");
for (let index = 0; index < 80 && !terminalGrass.terminated; index += 1) {
  terminalGrass = deathRuntime.tick("grass", { water: 0, sunlight: 0, soil_nutrients: 0 });
}
assert.equal(terminalGrass.terminated, true);
assert.equal(terminalGrass.life_state, "DEAD");
assert.throws(() => deathRuntime.tick("grass"), ({ code }) => code === "LIFE_TERMINATED");
assert.doesNotThrow(() => deathRuntime.tickAll());

const first = createFoundationalLifeRuntime({ definitions, seed: "REPLAY-SEED" });
first.tick("grass", { sunlight: 0.91 });
first.tick("fish", { feed: 0.83 });
first.tickAll({ river: { source_flow: 0.72 } });
const exported = first.exportSimulation();
const expectedStates = first.listStates();
assert.deepEqual(first.replay(exported.action_log), expectedStates);

const second = createFoundationalLifeRuntime({ definitions, seed: "REPLAY-SEED" });
second.importSimulation(exported);
assert.deepEqual(second.listStates(), expectedStates);
assert.deepEqual(second.exportSimulation().boundaries, LIFE_RUNTIME_BOUNDARIES);
assert.equal(JSON.stringify(exported).includes("private_key"), false);
assert.equal(second.exportSimulation().boundaries.real_kgen, "NO_REAL_KGEN");

const wrongSeed = createFoundationalLifeRuntime({ definitions, seed: "WRONG-SEED" });
assert.throws(() => wrongSeed.importSimulation(exported), ({ code }) => code === "SEED_MISMATCH");
const tampered = structuredClone(exported);
tampered.states.find(({ package_name }) => package_name === "grass").health = 1;
assert.throws(() => second.importSimulation(tampered), ({ code }) => code === "STATE_HASH_MISMATCH");

const incomplete = definitions.slice(0, 7);
assert.throws(() => createFoundationalLifeRuntime({ definitions: incomplete }), ({ code }) => code === "INCOMPLETE_DEFINITIONS");
assert.throws(() => runtime.tick("tree", { sunlight: "bright" }), ({ code }) => code === "INVALID_ENVIRONMENT");
assert.throws(() => runtime.tickAll(null), ({ code }) => code === "INVALID_ENVIRONMENT");

console.log("KAIOS_LIFE_RUNTIME_V1_TEST_PASS");
