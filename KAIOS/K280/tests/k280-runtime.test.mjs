import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildBirthPipeline,
  checksum,
  CIVILIZATION_STAGES,
  CivilizationEngine,
  createGenome,
  K280LifeRuntime,
  K280_LIFE_ID,
  K280_ORGANISM_ID,
  K280_SPECIES_ID,
  projectPhenotype,
  RIGHTS_CLASSES,
  runCambrianExplosion,
  verifyGenome
} from "../runtime/k280-runtime.js";

const root = new URL("../../../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("canonical taxonomy has twelve levels and 19-layer compatibility", async () => {
  const record = await json("KAIOS/life/species/k280-raptor/taxonomy.json");
  assert.deepEqual(Object.keys(record.taxonomy), [
    "domain", "kingdom", "phylum", "class", "order", "family",
    "genus", "species", "cell", "organ", "runtime", "civilization"
  ]);
  assert.equal(record.extension_19_compatible, true);
});

test("Species package binds to the shared Schema V2 runtime", async () => {
  const manifest = await json("KAIOS/life/species/k280-raptor/species_manifest.json");
  assert.equal(manifest.species_id, K280_SPECIES_ID);
  assert.equal(manifest.organism_schema_version, "2.0");
  assert.equal(manifest.program_filename, "KAIOS/K280/runtime/k280-runtime.js");
  assert.equal(manifest.release_policy, "DRY_RUN_ONLY");
});

test("initial genome is deterministic and verifies", () => {
  const left = createGenome({ seed: "fixed-seed" });
  const right = createGenome({ seed: "fixed-seed" });
  assert.deepEqual(left, right);
  assert.equal(verifyGenome(left), true);
  assert.match(left.integrity_checksum, /^[a-f0-9]{64}$/);
});

test("different seeds generate different genomes", () => {
  assert.notEqual(createGenome({ seed: "a" }).integrity_checksum, createGenome({ seed: "b" }).integrity_checksum);
});

test("parent recombination and mutation are deterministic", () => {
  const parents = [createGenome({ seed: "parent-a" }), createGenome({ seed: "parent-b" })];
  const first = createGenome({ seed: "child", parents, generation: 1, mutationProbability: 0.25 });
  const replay = createGenome({ seed: "child", parents, generation: 1, mutationProbability: 0.25 });
  assert.deepEqual(first, replay);
  assert.deepEqual(first.parent_genome_ids, parents.map(({ genome_id: id }) => id));
  assert.equal(first.generation, 1);
  assert.ok(first.mutation_history.length > 0);
});

test("phenotype projection is stable and bounded", () => {
  const genome = createGenome({ seed: "phenotype" });
  const phenotype = projectPhenotype(genome.allele_groups);
  assert.deepEqual(phenotype, genome.phenotype_projection);
  assert.match(phenotype.coloration, /^K280-AMBER-/);
});

test("birth pipeline executes all stages without production authority", async () => {
  const species = await json("api/kaios/k280/species.json");
  const pipeline = buildBirthPipeline({ species });
  assert.deepEqual(pipeline.stages.map(({ stage }) => stage), [
    "SPECIFICATION", "VALIDATION", "TAXONOMY", "SPECIES_PROGRAM_BINDING",
    "GENOME_GENERATION", "ORGANISM_ID_ASSIGNMENT", "EMBODIMENT_BINDING",
    "BIRTH_RECORD", "RELEASE", "DIGITAL_RUNTIME_LIFE"
  ]);
  assert.equal(pipeline.identity.life_id, K280_LIFE_ID);
  assert.equal(pipeline.identity.organism_id, K280_ORGANISM_ID);
  assert.equal(pipeline.release, "LOCAL_DETERMINISTIC_SIMULATION");
  assert.equal(pipeline.production_authority, false);
  assert.equal(pipeline.wallet, null);
  assert.equal(pipeline.real_kgen, false);
  for (const stage of pipeline.stages) assert.match(stage.integrity_checksum, /^[a-f0-9]{64}$/);
});

test("runtime tick updates every required state family", () => {
  const runtime = new K280LifeRuntime();
  const before = runtime.snapshot();
  const after = runtime.tick({ temperature: 4 });
  assert.equal(after.simulation_time, before.simulation_time + 1);
  assert.equal(after.age, before.age + 1);
  for (const field of ["health", "energy", "hunger", "hydration", "temperature", "position", "active_behavior", "emotional_state", "memory", "lifecycle_stage", "event_log"]) {
    assert.ok(field in after, field);
  }
});

test("runtime operations are bounded and evented", () => {
  const runtime = new K280LifeRuntime();
  runtime.wake();
  runtime.move(999, -999);
  runtime.perceive("FOOD");
  runtime.eat(12);
  runtime.drink(12);
  runtime.socialInteraction();
  runtime.huntSimulation(true);
  runtime.escapeSimulation(true);
  runtime.injurySimulation(10);
  runtime.healingSimulation(5);
  runtime.rest();
  runtime.sleep();
  const state = runtime.snapshot();
  assert.deepEqual(state.position, { x: 100, y: 0 });
  assert.ok(state.health >= 0 && state.health <= 100);
  assert.ok(state.energy >= 0 && state.energy <= 100);
  assert.ok(state.memory.length > 0);
  assert.ok(state.event_log.length >= 10);
});

test("runtime replay and serialization are deterministic", () => {
  const left = new K280LifeRuntime();
  const right = new K280LifeRuntime();
  for (let tick = 0; tick < 80; tick += 1) {
    left.tick({ temperature: 7 });
    right.tick({ temperature: 7 });
  }
  assert.deepEqual(left.snapshot(), right.snapshot());
  const restored = K280LifeRuntime.restore(left.serialize());
  assert.deepEqual(restored.snapshot(), left.snapshot());
  for (let tick = 0; tick < 40; tick += 1) {
    left.tick({ temperature: 7 });
    restored.tick({ temperature: 7 });
  }
  assert.deepEqual(restored.snapshot(), left.snapshot());
});

test("death is terminal", () => {
  const runtime = new K280LifeRuntime();
  runtime.deathTransition("TEST");
  const dead = runtime.snapshot();
  runtime.tick();
  runtime.healingSimulation(100);
  assert.equal(runtime.snapshot().alive, false);
  assert.equal(runtime.snapshot().lifecycle_stage, "DEAD");
  assert.equal(dead.event_log.at(-1).terminal, true);
});

test("growth stages advance by age without skipping state history", () => {
  const runtime = new K280LifeRuntime();
  for (let tick = 0; tick < 305; tick += 1) runtime.tick();
  assert.equal(runtime.snapshot().growth_stage, "ADULT");
  assert.ok(runtime.snapshot().event_log.some(({ type }) => type === "GROWTH_STAGE_CHANGE"));
});

test("reproduction enforces maturity, health, energy, sex, and capacity", () => {
  const female = new K280LifeRuntime({ sex: "FEMALE", genome: createGenome({ seed: "female" }) });
  const male = new K280LifeRuntime({ sex: "MALE", genome: createGenome({ seed: "male" }) });
  assert.equal(female.mateSelection([{ ...male.snapshot(), genome: male.genome }]), null);
  female.state.growth_stage = "ADULT";
  male.state.growth_stage = "ADULT";
  const partner = female.mateSelection([{ ...male.snapshot(), genome: male.genome }]);
  assert.ok(partner);
  const child = female.reproduceSimulation(partner, { population: 2, capacity: 100 });
  assert.equal(child.generation, 1);
  assert.throws(() => female.reproduceSimulation(partner, { population: 100, capacity: 100 }), /capacity/);
});

test("Cambrian mode demonstrates five bounded generations", () => {
  const result = runCambrianExplosion({ seed: "demo", generations: 5, capacity: 100 });
  assert.equal(result.mode, "K280_CAMBRIAN_EXPLOSION");
  assert.equal(result.generation_count, 5);
  assert.equal(result.timeline.length, 6);
  assert.ok(result.total_births > 1);
  assert.ok(result.total_deaths > 0);
  assert.ok(result.surviving_population <= 100);
  assert.equal(result.hard_maximum, 500);
  assert.equal(result.scientific_equivalence_claimed, false);
});

test("Cambrian mode rejects unbounded populations", () => {
  assert.throws(() => runCambrianExplosion({ generations: 5, capacity: 501 }), /hard maximum/);
});

test("candidate branches never become active Species automatically", () => {
  const result = runCambrianExplosion({ seed: "branch-rich", generations: 5 });
  assert.ok(["CANDIDATE_SPECIES_BRANCH", "NO_BRANCH"].includes(result.branch_status));
  assert.notEqual(result.branch_status, "ACTIVE_SPECIES");
});

test("civilization transitions are ordered and no-skip", () => {
  const engine = new CivilizationEngine({ population: 100, knowledge: 100, infrastructure: 100, social_stability: 100 });
  assert.throws(() => engine.transition("URBAN"), /cannot be skipped/);
  for (const stage of CIVILIZATION_STAGES.slice(1)) engine.transition(stage);
  assert.equal(engine.snapshot().stage, "DIVINE_ARMY_CIVILIZATION");
});

test("civilization transitions enforce thresholds and regression", () => {
  const engine = new CivilizationEngine();
  assert.throws(() => engine.transition("AGRICULTURAL"), /gate failed/);
  const advanced = new CivilizationEngine({ population: 100, knowledge: 100, infrastructure: 100, social_stability: 100 });
  advanced.transition("AGRICULTURAL");
  advanced.regress("TEST");
  assert.equal(advanced.snapshot().stage, "PRIMITIVE_FORAGING");
});

test("high civilization terminology and order are canonical", () => {
  assert.deepEqual(CIVILIZATION_STAGES.slice(-4), [
    "INTERSTELLAR",
    "IMMORTAL_CIVILIZATION",
    "DEITY_CIVILIZATION",
    "DIVINE_ARMY_CIVILIZATION"
  ]);
});

test("listing separates all ten rights and disables settlement", async () => {
  const listing = await json(`KAIOS/exchange/11520/listings/${K280_ORGANISM_ID}.listing.json`);
  assert.deepEqual(Object.keys(listing.rights), RIGHTS_CLASSES);
  assert.equal(listing.listing_mode, "SIMULATED_LISTING");
  assert.equal(listing.settlement_mode, "VIRTUAL_SETTLEMENT");
  assert.equal(listing.real_kgen, "DISABLED");
  assert.equal(listing.wallet, "NONE");
  assert.equal(listing.onchain_transfer, "DISABLED");
  assert.match(listing.disclaimer, /does not automatically transfer all rights/);
});

test("organism authority has no wallet, settlement, or production rights", async () => {
  const authority = await json(`KAIOS/life/organisms/${K280_ORGANISM_ID}/authority.json`);
  assert.equal(authority.runtime_authority, false);
  assert.equal(authority.wallet_authority, false);
  assert.equal(authority.governance_authority, false);
  const manifest = await json(`KAIOS/life/organisms/${K280_ORGANISM_ID}/organism_manifest.json`);
  assert.equal(manifest.release.production_authority, false);
  assert.equal(manifest.release.exchange_settlement, false);
});

test("static APIs expose the complete read-only package", async () => {
  for (const name of ["species", "organism", "state", "events", "civilization", "population", "listing", "rights"]) {
    assert.ok(await json(`api/kaios/k280/${name}.json`));
  }
});

test("customer request schema separates custom artifact classes", async () => {
  const schema = await json("KAIOS/K280/CUSTOM_DINOSAUR_REQUEST_SCHEMA.json");
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("simulation_limits"));
  assert.equal(schema.properties.commercial_use_status.enum.includes("NOT_GRANTED"), true);
});

test("checksum changes when payload changes", () => {
  assert.notEqual(checksum({ value: 1 }), checksum({ value: 2 }));
});
