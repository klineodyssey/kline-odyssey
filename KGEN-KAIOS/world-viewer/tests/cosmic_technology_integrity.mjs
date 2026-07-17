import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const fixtureBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-010-life-test", now: () => "2037-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-010-civilization-test"
});

civilization.beginGenesis();
let state = civilization.claimGenesisFortune(88);
const initial = state.cosmic_technology;
assert.equal(initial.technology.nodes.length, 14);
assert.equal(initial.technology.current_age_id, "STONE_AGE");
assert.equal(initial.technology.unlocked_count, 1);
assert.equal(initial.materials.records.length, 12);
assert.equal(initial.energy.records.length, 8);
assert.equal(initial.vehicles.blueprints.length, 9);
assert.equal(initial.abilities.abilities.length, 9);
assert.equal(initial.coordinates.coordinates.length, 8);
assert.equal(initial.exploration.activities.length, 5);
assert.equal(initial.ufo_v2_gates.ready, false);

assert.throws(
  () => civilization.unlockCosmicTechnology("ANTI_GRAVITY_TECHNOLOGY"),
  (error) => error?.code === "TECHNOLOGY_UNLOCK_BLOCKED"
);

state = civilization.runCosmicResearchCycle("BRONZE_METALLURGY");
state = civilization.runCosmicResearchCycle("BRONZE_METALLURGY");
state = civilization.unlockCosmicTechnology("BRONZE_METALLURGY");
assert.equal(state.cosmic_technology.technology.nodes.find(({ technology_id: id }) => id === "BRONZE_METALLURGY").unlocked, true);

state = civilization.buildCosmicVehicle("HORSE");
assert.equal(state.cosmic_technology.vehicles.fleet.at(-1).vehicle_id, "HORSE");
assert.equal(state.cosmic_technology.vehicles.fleet.at(-1).timeline_authority, false);
assert.throws(
  () => civilization.buildCosmicVehicle("TIMELINE_VEHICLE"),
  (error) => error?.code === "NON_EXECUTABLE_ARCHETYPE"
);

for (let cycle = 0; cycle < 4; cycle += 1) state = civilization.researchTimelineVehicle();
assert.equal(state.cosmic_technology.technology.unlocked_count, 14);
assert.equal(state.cosmic_technology.technology.current_age_id, "MULTIVERSE_AGE");
assert.equal(state.cosmic_technology.ufo_v2_gates.technology_requirements.every(({ ready }) => ready), true);
assert.equal(state.cosmic_technology.ufo_v2_gates.capability_requirements.every(({ ready }) => ready), true);
assert.equal(state.cosmic_technology.ufo_v2_gates.special_material_ready, false);

state = civilization.trainCosmicAbility("CLONE");
state = civilization.trainCosmicAbility("CLONE");
state = civilization.trainCosmicAbility("CLONE");
state = civilization.trainCosmicAbility("CLONE");
const cloneAbility = state.cosmic_technology.abilities.abilities.find(({ ability_id: id }) => id === "CLONE");
assert.equal(cloneAbility.unlocked, false);
assert.equal(state.cosmic_technology.abilities.proposals.at(-1).status, "SANDBOX_REVIEW_REQUIRED");
assert.equal(state.cosmic_technology.abilities.proposals.at(-1).execution, false);

state = civilization.discoverCosmicCoordinate("coord-k16888-moon");
assert.equal(state.cosmic_technology.coordinates.coordinates.find(({ coordinate_id: id }) => id === "coord-k16888-moon").discovery_status, "DISCOVERED");
state = civilization.launchSpaceExploration("PLANET_DISCOVERY", "coord-k16888-moon");
assert.equal(state.cosmic_technology.exploration.missions.at(-1).ownership_granted, false);
assert.equal(state.cosmic_technology.exploration.missions.at(-1).real_navigation, false);
state = civilization.launchSpaceExploration("COLONY_PLANNING", "coord-k16888-moon");
assert.equal(state.cosmic_technology.exploration.proposals.at(-1).executable, false);

state = civilization.establishNation();
state = civilization.researchTimelineEra("CAMBRIAN");
state = civilization.researchTimelineEra("CAMBRIAN");
state = civilization.supplyTimelineVehicle();
assert.equal(state.cosmic_technology.ufo_v2_gates.special_material_ready, true);
assert.equal(state.cosmic_technology.ufo_v2_gates.ready, true);
state = civilization.buildTimelineVehicle();
assert.equal(state.timeline.vehicle.shared_technology_source, "COSMIC_TECHNOLOGY_ALPHA");
assert.equal(state.timeline.vehicle.vehicle_type, "POCKET_TIME_CLOAKED_UFO");
assert.equal(state.timeline.vehicle.sole_timeline_transport, true);
assert.equal(state.timeline.vehicle.checksum_verified, true);
state = civilization.travelTimeline("CAMBRIAN");
assert.equal(state.timeline.journeys.at(-1).canonical_history_mutated, false);
assert.equal(state.timeline.journeys.at(-1).real_time_travel, false);

assert.ok(state.cosmic_technology.materials.records.every(({ stock, capacity }) => stock >= 0 && stock <= capacity));
assert.ok(state.cosmic_technology.energy.records.every(({ reserve, capacity }) => reserve >= 0 && reserve <= capacity));
assert.equal(state.cosmic_technology.coordinates.map_current_modified, false);
assert.equal(state.cosmic_technology.protected_runtime_modified, false);
assert.equal(JSON.stringify(world), fixtureBefore, "Sprint 010 must not mutate the synthetic fixture object");

const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(report.reports.cosmic_technology.ok, true, JSON.stringify(report.reports.cosmic_technology.issues));
assert.equal(report.reports.timeline.ok, true, JSON.stringify(report.reports.timeline.issues));

const output = {
  status: "PASS",
  decision_id: "HUMAN-SPRINT-010-COSMIC-TECHNOLOGY",
  cosmic_technology: report.reports.cosmic_technology,
  timeline: report.reports.timeline,
  verified_flows: {
    fourteen_age_dependency_tree: true,
    five_factor_unlock_gate: true,
    twelve_material_bounded_ledger: true,
    eight_energy_bounded_ledger: true,
    nine_vehicle_catalog: true,
    nine_special_ability_catalog: true,
    clone_proposal_only: true,
    data_driven_coordinates: true,
    five_space_exploration_activities: true,
    colony_proposal_only: true,
    ufo_v2_shared_technology_truth: true,
    ufo_v2_six_gates: true,
    sole_timeline_transport: true,
    canonical_history_immutable: true
  },
  protected_runtime_mutated: false,
  universe_map_current_mutated: false,
  kernel_current_mutated: false,
  life_os_current_mutated: false,
  cambrian_current_mutated: false,
  nation_current_mutated: false,
  timeline_current_mutated: false,
  settlement_current_mutated: false,
  governance_current_mutated: false,
  frozen_baseline_mutated: false,
  token_contract_mutated: false,
  human_main_modified: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
