import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBiologyRuntime } from "../biology/biology-runtime.js";
import { FOOD_CHAIN_ROLES_V2, SPECIES_CATEGORIES, TAXONOMY_RANKS } from "../biology/taxonomy-standard.js";
import { createEcosystemRuntime } from "../ecosystem/ecosystem-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const atomCatalog = JSON.parse(await readFile(new URL("../../genesis-dna/genesis_atom_catalog.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const ecosystem = createEcosystemRuntime({ config: world.production_alpha, storage, storageKey: "sprint-008-ecosystem" });
const biology = createBiologyRuntime({
  config: world.biology_alpha,
  speciesCatalog: world.production_alpha.species_catalog,
  atomCatalog,
  planetProfiles: world.planet_profiles,
  storage,
  storageKey: "sprint-008-biology"
});
biology.synchronizeEcosystem(ecosystem.getSnapshot());

const initial = biology.getSnapshot();
assert.equal(initial.runtime, "CAMBRIAN_BIOLOGY_FOUNDATION_ALPHA");
assert.equal(initial.registry_count, 26);
assert.deepEqual(initial.taxonomy_ranks, TAXONOMY_RANKS);
assert.ok(SPECIES_CATEGORIES.every((category) => initial.category_coverage[category] >= 1));
assert.ok(initial.registry.every((species) => TAXONOMY_RANKS.every((rank) => species.taxonomy[rank])));
assert.ok(initial.registry.every((species) => species.body_profile_id && species.species_os_id && species.life_os_profile_id));
assert.ok(initial.registry.every((species) => species.inherent_life_capabilities.length > 0));
assert.equal(initial.genomes.genomes.length, initial.registry_count);
assert.ok(initial.genomes.genomes.every((genome) => (
  genome.genome_id
  && genome.dna.dna_id
  && genome.genes.length
  && genome.chromosomes.length
  && Array.isArray(genome.mutations)
  && genome.inheritance
  && genome.traits.length
  && genome.life_cycle.stages.length
)));

assert.equal(initial.evolution.catalog.domains.length, 12);
assert.equal(initial.evolution.catalog.atoms.length, 108);
assert.equal(initial.evolution.catalog.atoms[0].ga_id, "GA001");
assert.equal(initial.evolution.catalog.atoms.at(-1).ga_id, "GA108");
assert.equal(initial.evolution.atom_count_defines_role, false);
assert.equal(initial.evolution.atom_count_is_power_score, false);
assert.throws(
  () => biology.advanceEvolution({ speciesId: "HUMAN_ALPHA", pathway: "LEARNING", evidence: { evidence_id: "bad", reviewed: false, score: 100 } }),
  (error) => error.code === "EVIDENCE_REQUIRED"
);
biology.advanceEvolution({
  speciesId: "HUMAN_ALPHA",
  pathway: "LEARNING",
  evidence: { evidence_id: "evidence-sprint-008-learning-001", reviewed: true, score: 100 }
});
const evolvedHuman = biology.getSpecies("HUMAN_ALPHA");
assert.equal(evolvedHuman.evolution.evolution_xp, 100);
assert.equal(evolvedHuman.evolution.training_level, 2);
assert.deepEqual(evolvedHuman.evolution.active_atom_ids, ["GA001"]);

const humanPopulation = evolvedHuman.population;
biology.requestReproduction({
  speciesId: "HUMAN_ALPHA",
  mode: "BIRTH",
  evidence: { evidence_id: "evidence-sprint-008-birth-001", reviewed: true }
});
biology.requestReproduction({ speciesId: "HUMAN_ALPHA", mode: "CLONE" });
const reproduction = biology.getSnapshot().reproduction.history;
assert.equal(reproduction.at(-2).status, "SIMULATED_LINEAGE_RECORDED");
assert.equal(reproduction.at(-1).status, "PROPOSAL_ONLY_REVIEW_REQUIRED");
assert.equal(biology.getSpecies("HUMAN_ALPHA").population, humanPopulation);

const ecosystemInitial = ecosystem.getSnapshot();
const roles = new Set(ecosystemInitial.species.map(({ trophic_role: role }) => role));
assert.ok(FOOD_CHAIN_ROLES_V2.every((role) => roles.has(role)), `missing Food Chain V2 role: ${JSON.stringify([...roles])}`);
assert.equal(Object.keys(ecosystemInitial.population_balance.role_counts).length, 7);
for (let index = 0; index < 12; index += 1) {
  ecosystem.advance({
    elapsedHours: 720,
    environment: { oxygen_available: false, water_available: false, temperature_compatible: false },
    agricultureWarehouse: {}
  });
}
biology.synchronizeEcosystem(ecosystem.getSnapshot());
const stressed = biology.getSnapshot();
assert.ok(stressed.fossils.length > 0, "ecosystem extinction must create a synthetic fossil record");
assert.ok(stressed.species_history.some(({ event_type: type }) => type === "SPECIES_EXTINCTION_OBSERVED"));
assert.ok(stressed.fossils.every(({ immutable, record_type }) => immutable && record_type === "SYNTHETIC_FOSSIL_RECORD"));

assert.equal(initial.planet_ecology.length, initial.registry_count * world.planet_profiles.length);
assert.equal(initial.planet_ecology.find(({ species_id, planet_id }) => species_id === "HUMAN_ALPHA" && planet_id === "EARTH").status, "COMPATIBLE");
assert.equal(initial.planet_ecology.find(({ species_id, planet_id }) => species_id === "HUMAN_ALPHA" && planet_id === "MOON").status, "BASE_REQUIRED");
assert.equal(initial.planet_ecology.find(({ species_id, planet_id }) => species_id === "HUMAN_ALPHA" && planet_id === "JUPITER").status, "NOT_SURVIVABLE");
assert.equal(initial.planet_ecology.find(({ species_id, planet_id }) => species_id === "FUTURE_SPECIES_ALPHA" && planet_id === "FUTURE_PLANET").status, "UNKNOWN_REVIEW_REQUIRED");
assert.ok(initial.civilization_evolution.every(({ fixed_role: fixed }) => fixed === false));

const report = biology.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(ecosystem.integrityReport().ok, true);
assert.equal(JSON.stringify(world), canonicalBefore, "Biology runtimes must not mutate the canonical fixture");

const output = {
  status: "PASS",
  decision_id: world.biology_alpha.decision_id,
  report,
  coverage: {
    taxonomy_ranks: TAXONOMY_RANKS.length,
    registry_categories: SPECIES_CATEGORIES.length,
    species: initial.registry_count,
    genomes: initial.genomes.genomes.length,
    atom_domains: initial.evolution.catalog.domains.length,
    atoms: initial.evolution.catalog.atoms.length,
    food_chain_roles: FOOD_CHAIN_ROLES_V2.length,
    planets: world.planet_profiles.length,
    fossils_observed: stressed.fossils.length
  },
  boundaries: {
    real_genetic_engineering: false,
    clone_execution: false,
    authoritative_registry: false,
    fixed_role_atoms: false,
    protected_runtime_mutated: false
  }
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

biology.destroy();
ecosystem.destroy();
