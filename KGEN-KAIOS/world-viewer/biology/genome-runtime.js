import { snapshot } from "../civilization/runtime-utils.js";

const RUNTIME = "GENOME_DNA_ALPHA";

function gene(speciesId, suffix, purpose, expression) {
  return {
    gene_id: `${speciesId}-GENE-${suffix}`,
    purpose,
    expression,
    simulation_only: true
  };
}

function reproductionMode(category) {
  if (["AI_ORGANISM", "APP_ORGANISM", "COMPANY_ORGANISM", "ROBOT"].includes(category)) return "VERSIONED_BIRTH";
  if (category === "PLANT" || category === "FUNGUS" || category === "MICROORGANISM") return "SPORE_SEED_OR_DIVISION";
  return "MATE_EGG_OR_BIRTH";
}

export function createGenomeRecord(species) {
  const speciesId = species.species_id;
  const genes = [
    gene(speciesId, "HOMEOSTASIS", "Maintain the bounded Life OS envelope", "LIFE_MAINTENANCE"),
    gene(speciesId, "ADAPTATION", "Express environment-compatible traits", "ADAPTATION"),
    gene(speciesId, "LINEAGE", "Preserve reviewed lineage and inheritance", reproductionMode(species.category))
  ];
  const chromosomeCount = ["AI_ORGANISM", "APP_ORGANISM", "COMPANY_ORGANISM", "ROBOT"].includes(species.category) ? 2 : 3;
  const chromosomes = Array.from({ length: chromosomeCount }, (_, index) => ({
    chromosome_id: `${speciesId}-CHR-${index + 1}`,
    gene_ids: genes.filter((_, geneIndex) => geneIndex % chromosomeCount === index).map(({ gene_id: id }) => id),
    representation: "SYNTHETIC_SEQUENCE_ABSTRACTION"
  }));
  return snapshot({
    genome_id: `GENOME-${speciesId}-G0`,
    species_id: speciesId,
    generation: "G0",
    version: "1.0.0-alpha",
    dna: {
      dna_id: `DNA-${speciesId}-V1`,
      blueprint_type: species.category.includes("ORGANISM") || species.category === "ROBOT" ? "DIGITAL_BLUEPRINT" : "BIOLOGY_SIMULATION_BLUEPRINT",
      checksum_status: "VERIFIED_SYNTHETIC"
    },
    chromosomes,
    genes,
    mutations: [],
    inheritance: {
      mode: reproductionMode(species.category),
      lineage_review_required: true,
      secrets_inheritable: false,
      private_memory_inheritable: false
    },
    traits: [
      { trait_id: `${speciesId}-TRAIT-SURVIVAL`, source: "INHERENT_LIFE_CAPABILITY", mutable: false },
      { trait_id: `${speciesId}-TRAIT-ADAPTATION`, source: "GENOME_EXPRESSION", mutable: true }
    ],
    life_cycle: {
      lifecycle_days: species.lifecycle_days ?? null,
      stages: ["BIRTH", "GROWTH", "MATURE", "REPRODUCTION", "AGING", "DEATH_OR_RETIREMENT"],
      extinction_possible: true
    },
    real_genetic_engineering: false,
    simulation_only: true
  });
}
export function createGenomeRuntime(speciesRecords = []) {
  const genomes = speciesRecords.map(createGenomeRecord);
  const index = new Map(genomes.map((genome) => [genome.species_id, genome]));
  return Object.freeze({
    getSnapshot: () => snapshot({ runtime: RUNTIME, schema_version: "1.0.0", genomes }),
    getGenome(speciesId) {
      const result = index.get(String(speciesId));
      if (!result) throw new RangeError(`Genome not found for ${speciesId}`);
      return result;
    },
    integrityReport() {
      const issues = [];
      if (index.size !== genomes.length) issues.push("duplicate Species Genome");
      for (const genome of genomes) {
        if (!genome.dna?.dna_id || !genome.genes.length || !genome.chromosomes.length) issues.push(`${genome.species_id}: incomplete Genome`);
        if (genome.real_genetic_engineering !== false || genome.simulation_only !== true) issues.push(`${genome.species_id}: safety boundary invalid`);
      }
      return snapshot({ ok: issues.length === 0, runtime: RUNTIME, genome_count: genomes.length, issues });
    }
  });
}
