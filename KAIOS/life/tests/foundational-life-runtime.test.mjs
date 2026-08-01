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
    taxonomy: await json(packageName, "taxonomy.json"),
    physics: await json(packageName, "physics.json"),
    environment: await json(packageName, "environment.json"),
    growth_or_formation: await json(packageName, "growth_or_formation.json"),
    health_or_integrity: await json(packageName, "health_or_integrity.json"),
    reproduction_or_change: await json(packageName, "reproduction_or_change.json"),
    economy: await json(packageName, "economy.json"),
    rights: await json(packageName, "rights.json")
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
for (const state of runtime.listStates()) {
  assert.equal(state.initialization_cause.instant_formation, false, `${state.package_name} must declare a non-instant initialization cause`);
  assert.equal(state.growth_progress ?? state.formation_progress, 0, `${state.package_name} must begin before growth or formation`);
  assert.ok(state.location && state.gravity_m_s2 > 0 && state.mass_kg >= 0, `${state.package_name} requires location and physics bindings`);
}

const grassBefore = runtime.getState("grass");
const grassAfter = runtime.tick("grass");
assert.equal(grassAfter.tick, 1);
assert.ok(grassAfter.growth_progress > grassBefore.growth_progress);
assert.equal(grassAfter.event_history.at(-1).previous_state_hash, grassBefore.state_hash ?? grassAfter.event_history.at(-1).previous_state_hash);
assert.match(grassAfter.state_hash, /^fnv1a32:[0-9a-f]{8}$/);
assert.equal(grassAfter.initialization_cause.instant_formation, false);
assert.deepEqual(grassAfter.approval_status, ["CANDIDATE_PACKAGE", "RUNTIME_VALIDATED", "CANONICAL_SCHEMA_COMPATIBLE", "NOT_PRODUCTION_AUTHORIZED"]);
for (const field of ["event_id", "life_id", "species_id", "simulation_time", "location", "action", "inputs", "outputs", "resource_delta", "energy_delta", "mass_delta", "health_delta", "integrity_delta", "previous_state_hash", "next_state_hash", "status", "reason"]) {
  assert.ok(Object.hasOwn(grassAfter.event_history.at(-1), field), `event field missing: ${field}`);
}
assert.equal(grassAfter.event_history.at(-1).mass_delta.balance_kg, 0);

const grassDependency = createFoundationalLifeRuntime({ definitions });
const grassNoLightBefore = grassDependency.getState("grass").growth_progress;
const grassNoLightAfter = grassDependency.tick("grass", { sunlight: 0 }).growth_progress;
assert.equal(grassNoLightAfter, grassNoLightBefore);
assert.equal(grassDependency.tick("grass", { compatible_soil: false }).growth_progress, grassNoLightAfter);
assert.ok(grassDependency.tick("grass", { grazing_pressure: 0.8 }).traits.grazing_impact > 0);

const treeRuntime = createFoundationalLifeRuntime({ definitions, seed: "TREE-TEST" });
for (let index = 0; index < 80; index += 1) treeRuntime.tick("tree");
assert.notEqual(treeRuntime.getState("tree").traits.growth_stage, "SEEDLING");
assert.ok(treeRuntime.getState("tree").traits.biomass_kg > treeRuntime.getState("tree").initial_mass_kg);
const treeHealthy = treeRuntime.getState("tree").health;
assert.ok(treeRuntime.tick("tree", { disease_pressure: 1 }).health < treeHealthy);
assert.equal(treeRuntime.getState("tree").traits.disease, "ACTIVE");

const fishRuntime = createFoundationalLifeRuntime({ definitions });
const fishHealth = fishRuntime.getState("fish").health;
const oxygenStarvedFish = fishRuntime.tick("fish", { dissolved_oxygen: 0, feed: 0 });
assert.ok(oxygenStarvedFish.health < fishHealth);
assert.equal(oxygenStarvedFish.traits.oxygen_status, "CRITICAL");
assert.ok(fishRuntime.tick("fish", { movement_distance_m: 25 }).traits.movement_distance_m >= 25);
const incompatibleFish = fishRuntime.tick("fish", { compatible_water: false });
assert.equal(incompatibleFish.traits.water_body_compatible, false);

const shrimpRuntime = createFoundationalLifeRuntime({ definitions, seed: "SHRIMP-TEST" });
const shrimpHealth = shrimpRuntime.getState("shrimp").health;
assert.ok(shrimpRuntime.tick("shrimp", { water_quality: 0.05 }).health < shrimpHealth);
for (let index = 1; index <= 10; index += 1) shrimpRuntime.tick("shrimp", { water_quality: 0.82 });
assert.ok(shrimpRuntime.getState("shrimp").traits.molt_count >= 1);
for (let index = 0; index < 50; index += 1) shrimpRuntime.tick("shrimp", { water_quality: 0.82 });
assert.notEqual(shrimpRuntime.getState("shrimp").traits.larval_stage, "LARVA");

for (const packageName of ["grass", "tree", "fish", "shrimp"]) {
  const reproductionRuntime = createFoundationalLifeRuntime({ definitions, seed: `REPRO-${packageName}` });
  for (let index = 0; index < 260; index += 1) reproductionRuntime.tick(packageName);
  assert.ok(reproductionRuntime.getState(packageName).traits.reproduction_count > 0, `${packageName} reproduction should be event-causal and bounded`);
}

for (const packageName of ["tree", "fish", "shrimp"]) {
  const mortalityRuntime = createFoundationalLifeRuntime({ definitions });
  let state = mortalityRuntime.getState(packageName);
  const hostile = packageName === "tree"
    ? { water: 0, sunlight: 0, soil_nutrients: 0, compatible_soil: false, disease_pressure: 1 }
    : { compatible_water: false, dissolved_oxygen: 0, feed: 0 };
  for (let index = 0; index < 100 && !state.terminated; index += 1) state = mortalityRuntime.tick(packageName, hostile);
  assert.equal(state.life_state, "DEAD", `${packageName} must reach death under sustained incompatible conditions`);
}

const formationRuntime = createFoundationalLifeRuntime({ definitions });
formationRuntime.tickAll();
for (const packageName of ["mountain", "soil", "water", "river"]) {
  assert.ok(formationRuntime.getState(packageName).formation_progress > 0, `${packageName} formation should advance`);
}

const mountainRuntime = createFoundationalLifeRuntime({ definitions });
const mountainBefore = mountainRuntime.getState("mountain");
const erodedMountain = mountainRuntime.tick("mountain", { erosion_pressure: 1, weathering_pressure: 1, tectonic_force: 0 });
assert.ok(erodedMountain.integrity < mountainBefore.integrity);
assert.ok(erodedMountain.traits.erosion > 0);
assert.ok(erodedMountain.formation_progress < 1, "mountain formation must not be instantaneous");

const soilRuntime = createFoundationalLifeRuntime({ definitions });
const soilBefore = soilRuntime.getState("soil");
const amendedSoil = soilRuntime.tick("soil", { amendment_input: 1, organic_matter: 1 });
assert.ok(amendedSoil.traits.fertility > soilBefore.traits.fertility, "fertility requires an explicit amendment or organic input");
const contaminatedSoil = soilRuntime.tick("soil", { contamination: 1, erosion_pressure: 1, compaction_pressure: 1 });
assert.ok(contaminatedSoil.traits.contamination > 0);
assert.ok(contaminatedSoil.traits.erosion > 0);
assert.ok(contaminatedSoil.traits.compaction > soilBefore.traits.compaction);

const riverRuntime = createFoundationalLifeRuntime({ definitions });
const blockedRiver = riverRuntime.tick("river", { source_elevation_m: 100, mouth_elevation_m: 200 });
assert.equal(blockedRiver.event_history.at(-1).status, "BLOCKED");
assert.equal(blockedRiver.event_history.at(-1).reason, "UPHILL_FLOW_BLOCKED");
assert.equal(blockedRiver.formation_progress, 0);

const waterRuntime = createFoundationalLifeRuntime({ definitions });
const waterBefore = waterRuntime.getState("water").water_balance;
const waterAfter = waterRuntime.tick("water", { inflow: 0, consumption: 0.8, evaporation: 0.8 }).water_balance;
assert.ok(waterAfter < waterBefore);
const evaporatedWater = waterRuntime.getState("water");
assert.ok(evaporatedWater.traits.evaporated_mass_kg > 0);
assert.ok(evaporatedWater.energy < 100, "evaporation must consume energy");
assert.equal(waterRuntime.tick("water", { temperature_c: -5, evaporation: 0, consumption: 0 }).traits.physical_state, "SOLID");
assert.equal(waterRuntime.tick("water", { temperature_c: 105, evaporation: 0, consumption: 0 }).traits.physical_state, "GAS");
assert.ok(waterRuntime.tick("water", { pollution: 1 }).traits.pollution > 0);

const riverBehavior = createFoundationalLifeRuntime({ definitions });
assert.equal(riverBehavior.tick("river", { has_bridge: false }).traits.transport_blocking, true);
assert.equal(riverBehavior.tick("river", { has_bridge: true, bridge_open: true }).traits.transport_blocking, false);
assert.equal(riverBehavior.tick("river", { inflow: 1, outflow: 0, source_flow: 1 }).traits.flood_state, true);
for (let index = 0; index < 30 && !riverBehavior.getState("river").traits.drought_state; index += 1) {
  riverBehavior.tick("river", { inflow: 0, outflow: 1, source_flow: 0, evaporation: 1 });
}
assert.equal(riverBehavior.getState("river").traits.drought_state, true);

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
second.pause();
assert.equal(second.isRunning(), false);
assert.throws(() => second.tick("grass"), ({ code }) => code === "RUNTIME_PAUSED");
const pausedExport = second.exportSimulation();
const pausedImport = createFoundationalLifeRuntime({ definitions, seed: "REPLAY-SEED" });
pausedImport.importSimulation(pausedExport);
assert.equal(pausedImport.isRunning(), false);
pausedImport.resume();
assert.equal(pausedImport.isRunning(), true);
assert.doesNotThrow(() => pausedImport.tick("grass"));

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
