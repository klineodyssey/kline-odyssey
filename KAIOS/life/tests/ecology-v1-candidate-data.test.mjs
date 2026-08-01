import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, "../candidates/ecology-v1");
const EXPECTED_FILES = [
  "environmental-thresholds.json",
  "food-relationships.json",
  "habitat-compatibility.json",
  "population-scenarios.json",
  "viewer-cards.json"
];
const SPECIES_IDS = [
  "SPECIES-KAIOS-FOUNDATIONAL-GRASS",
  "SPECIES-KAIOS-FOUNDATIONAL-TREE",
  "SPECIES-KAIOS-FOUNDATIONAL-FISH",
  "SPECIES-KAIOS-FOUNDATIONAL-SHRIMP",
  "SPECIES-KAIOS-FOUNDATIONAL-MOUNTAIN",
  "SPECIES-KAIOS-FOUNDATIONAL-SOIL",
  "SPECIES-KAIOS-FOUNDATIONAL-WATER",
  "SPECIES-KAIOS-FOUNDATIONAL-RIVER"
];
const ABSTRACT_RESOURCES = [
  "AQUATIC_PRIMARY_FOOD_POOL",
  "DETRITUS_POOL",
  "MICROBIAL_DECOMPOSITION_PROXY"
];
const NON_REPRODUCTIVE = new Set(SPECIES_IDS.slice(4));
const MAXIMUM_TOTAL_POPULATION = 500;

async function load(name) {
  const raw = await readFile(path.join(DATA_DIR, name));
  assert.equal(raw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false, `${name}: BOM forbidden`);
  const text = raw.toString("utf8");
  assert.equal(text.includes("\ufffd"), false, `${name}: UTF-8 corruption`);
  return JSON.parse(text);
}

assert.deepEqual((await readdir(DATA_DIR)).sort(), EXPECTED_FILES);
const food = await load("food-relationships.json");
const habitats = await load("habitat-compatibility.json");
const thresholds = await load("environmental-thresholds.json");
const scenarios = await load("population-scenarios.json");
const viewer = await load("viewer-cards.json");
const datasets = [food, habitats, thresholds, scenarios, viewer];

for (const dataset of datasets) {
  assert.equal(dataset.status, "CANDIDATE_ONLY");
  assert.equal(dataset.authority, "NO_PRODUCTION_AUTHORITY");
  assert.equal(dataset.simulation_only, true);
  assert.equal(dataset.data_only, true);
  const serialized = JSON.stringify(dataset).toLowerCase();
  for (const forbidden of ["private_key", "seed_phrase", "onchain_transfer", "production_authorized", "real_bioengineering_instruction"]) {
    assert.equal(serialized.includes(forbidden), false, `${dataset.dataset_id}: forbidden capability ${forbidden}`);
  }
}

assert.deepEqual(food.species_scope, SPECIES_IDS);
assert.deepEqual(food.abstract_resources.map(({ resource_id }) => resource_id), ABSTRACT_RESOURCES);
for (const resource of food.abstract_resources) {
  assert.equal(resource.classification, "ABSTRACT_RESOURCE_POOL");
  assert.equal(resource.runtime_status, "NOT_FULL_LIFE_RUNTIME");
  assert.equal(resource.bounded, true);
}
assert.equal(food.boundaries.active_plankton_life, false);
assert.equal(food.boundaries.active_microbe_life, false);
assert.equal(food.relationships.every(({ mass_transfer_required }) => mass_transfer_required !== false), true);

const habitatTypes = habitats.habitats.map(({ habitat_type }) => habitat_type).sort();
assert.deepEqual(habitatTypes, ["FISHPOND", "FOREST", "GRASSLAND", "MOUNTAIN_WATERSHED", "RIVER_HABITAT", "SOIL_HABITAT", "WETLAND"]);
const habitatSpecies = new Set();
for (const habitat of habitats.habitats) {
  assert.equal(habitat.population_capacity_model, "SIMULATION_APPROXIMATION");
  assert.ok(habitat.area_m2 > 0);
  for (const entry of habitat.species) {
    assert.ok(SPECIES_IDS.includes(entry.species_id), `noncanonical species: ${entry.species_id}`);
    assert.ok(Number.isInteger(entry.maximum_count) && entry.maximum_count > 0);
    assert.ok(entry.maximum_count <= MAXIMUM_TOTAL_POPULATION, `${habitat.habitat_id}: capacity exceeds hard cap`);
    habitatSpecies.add(entry.species_id);
  }
}
assert.deepEqual([...habitatSpecies].sort(), [...SPECIES_IDS].sort());
assert.equal(habitats.habitats.find(({ habitat_type }) => habitat_type === "FISHPOND").commercial_settlement, false);

assert.deepEqual(thresholds.species_thresholds.map(({ species_id }) => species_id), SPECIES_IDS);
const thresholdById = new Map(thresholds.species_thresholds.map((entry) => [entry.species_id, entry]));
assert.deepEqual(thresholdById.get(SPECIES_IDS[0]).temperature_c, { minimum: 5, maximum: 35 });
assert.deepEqual(thresholdById.get(SPECIES_IDS[1]).temperature_c, { minimum: -5, maximum: 38 });
assert.deepEqual(thresholdById.get(SPECIES_IDS[2]).oxygen_mg_l, { minimum: 5, maximum: 12 });
assert.deepEqual(thresholdById.get(SPECIES_IDS[2]).salinity_ppt, { minimum: 0, maximum: 10 });
assert.deepEqual(thresholdById.get(SPECIES_IDS[3]).oxygen_mg_l, { minimum: 4.5, maximum: 10 });
assert.deepEqual(thresholdById.get(SPECIES_IDS[3]).salinity_ppt, { minimum: 5, maximum: 35 });
assert.equal(thresholdById.get(SPECIES_IDS[7]).source_elevation_m > thresholdById.get(SPECIES_IDS[7]).outflow_elevation_m, true);
for (const speciesId of NON_REPRODUCTIVE) {
  assert.deepEqual(thresholdById.get(speciesId).reproduction_modes, ["NO_REPRODUCTION"]);
}

assert.equal(scenarios.model_label, "SIMULATION_APPROXIMATION");
assert.ok(Number.isInteger(scenarios.global_limits.maximum_generation));
assert.ok(scenarios.global_limits.maximum_generation > 0 && scenarios.global_limits.maximum_generation <= 5);
assert.equal(scenarios.global_limits.maximum_population_records, MAXIMUM_TOTAL_POPULATION);
assert.equal(scenarios.global_limits.maximum_total_population, MAXIMUM_TOTAL_POPULATION);
assert.equal(scenarios.global_limits.automatic_new_species, false);
assert.deepEqual(scenarios.baseline_populations.map(({ species_id }) => species_id), SPECIES_IDS);
for (const population of scenarios.baseline_populations) {
  assert.ok(Number.isInteger(population.count) && population.count >= 0);
  assert.ok(Number.isInteger(population.carrying_capacity) && population.carrying_capacity > 0);
  assert.ok(population.count <= MAXIMUM_TOTAL_POPULATION, `${population.population_id}: count exceeds hard cap`);
  assert.ok(population.carrying_capacity <= MAXIMUM_TOTAL_POPULATION, `${population.population_id}: capacity exceeds hard cap`);
  if (NON_REPRODUCTIVE.has(population.species_id)) assert.equal(population.reproduction_mode, "NO_REPRODUCTION");
}
const biologicalBaselineTotal = scenarios.baseline_populations
  .filter(({ species_id }) => !NON_REPRODUCTIVE.has(species_id))
  .reduce((total, { count }) => total + count, 0);
assert.ok(biologicalBaselineTotal <= MAXIMUM_TOTAL_POPULATION, `biological baseline ${biologicalBaselineTotal} exceeds hard cap`);
assert.deepEqual(scenarios.scenarios.map(({ scenario_id }) => scenario_id), [
  "SCENARIO-BASELINE-STABLE",
  "SCENARIO-DROUGHT",
  "SCENARIO-POLLUTION",
  "SCENARIO-OVERCAPACITY",
  "SCENARIO-RESTORATION"
]);
assert.equal(scenarios.scenarios.every(({ duration_ticks }) => Number.isInteger(duration_ticks) && duration_ticks > 0), true);
for (const scenario of scenarios.scenarios) {
  for (const change of scenario.environment_changes) {
    if (change.field === "count" && Object.hasOwn(change, "value")) {
      assert.ok(change.value <= MAXIMUM_TOTAL_POPULATION, `${scenario.scenario_id}: fixture count exceeds hard cap`);
    }
  }
}

assert.equal(viewer.viewer_mode, "READ_ONLY_CANDIDATE_PREVIEW");
assert.deepEqual(viewer.cards.map(({ species_id }) => species_id), SPECIES_IDS);
assert.equal(viewer.cards.every(({ status_badges }) => status_badges.includes("CANDIDATE_ONLY")), true);
assert.equal(viewer.interactions.read_only, true);
assert.equal(viewer.interactions.mutation_controls, false);
assert.equal(viewer.interactions.wallet_controls, false);
assert.equal(viewer.interactions.settlement_controls, false);

console.log("KAIOS_ECOLOGY_V1_CANDIDATE_DATA_TEST_PASS");
