export const TAXONOMY_RANKS = Object.freeze([
  "domain",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "subspecies"
]);

export const SPECIES_CATEGORIES = Object.freeze([
  "ANIMAL",
  "PLANT",
  "FUNGUS",
  "MICROORGANISM",
  "HUMAN",
  "AI_ORGANISM",
  "APP_ORGANISM",
  "COMPANY_ORGANISM",
  "ROBOT",
  "FUTURE_SPECIES"
]);

export const FOOD_CHAIN_ROLES_V2 = Object.freeze([
  "PRODUCER",
  "HERBIVORE",
  "CARNIVORE",
  "OMNIVORE",
  "PREDATOR",
  "SCAVENGER",
  "DECOMPOSER"
]);

const taxonomy = (domain, kingdom, phylum, className, order, family, genus, species, subspecies, category) => Object.freeze({
  domain,
  kingdom,
  phylum,
  class: className,
  order,
  family,
  genus,
  species,
  subspecies,
  category
});

const TAXONOMY = Object.freeze({
  BACTERIA_ALPHA: taxonomy("BACTERIA", "EUBACTERIA", "PROTEOBACTERIA", "GAMMAPROTEOBACTERIA", "KAIOS_MICROBIAL_ORDER", "KAIOS_MICROBIAL_FAMILY", "KAIOS_BACTERIUM", "KAIOS_BACTERIUM_ALPHA", "SYNTHETIC_ALPHA", "MICROORGANISM"),
  MARINE_INVERTEBRATE_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "ARTHROPODA", "TRILOBITA", "REDLICHIIDA", "REDLICHIIDAE", "KAIOS_CAMBRIA", "KAIOS_CAMBRIA_ALPHA", "SYNTHETIC_ALPHA", "ANIMAL"),
  ALGAE_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "CHLOROPHYTA", "CHLOROPHYCEAE", "CHLOROCOCCALES", "CHLOROCOCCACEAE", "KAIOS_ALGA", "KAIOS_ALGA_ALPHA", "SYNTHETIC_ALPHA", "PLANT"),
  FISH_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "ACTINOPTERYGII", "PERCIFORMES", "KAIOS_FISH_FAMILY", "KAIOS_PISCIS", "KAIOS_PISCIS_ALPHA", "SYNTHETIC_ALPHA", "ANIMAL"),
  FROG_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "AMPHIBIA", "ANURA", "RANIDAE", "KAIOS_RANA", "KAIOS_RANA_ALPHA", "SYNTHETIC_ALPHA", "ANIMAL"),
  LIZARD_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "REPTILIA", "SQUAMATA", "LACERTIDAE", "KAIOS_LACERTA", "KAIOS_LACERTA_ALPHA", "SYNTHETIC_ALPHA", "ANIMAL"),
  CHICKEN_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "AVES", "GALLIFORMES", "PHASIANIDAE", "GALLUS", "GALLUS_GALLUS", "SYNTHETIC_ALPHA", "ANIMAL"),
  TIGER_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "CARNIVORA", "FELIDAE", "PANTHERA", "PANTHERA_TIGRIS", "SYNTHETIC_ALPHA", "ANIMAL"),
  LION_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "CARNIVORA", "FELIDAE", "PANTHERA", "PANTHERA_LEO", "SYNTHETIC_ALPHA", "ANIMAL"),
  ELEPHANT_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "PROBOSCIDEA", "ELEPHANTIDAE", "ELEPHAS", "ELEPHAS_MAXIMUS", "SYNTHETIC_ALPHA", "ANIMAL"),
  COW_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "ARTIODACTYLA", "BOVIDAE", "BOS", "BOS_TAURUS", "SYNTHETIC_ALPHA", "ANIMAL"),
  PIG_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "ARTIODACTYLA", "SUIDAE", "SUS", "SUS_SCROFA", "SYNTHETIC_ALPHA", "ANIMAL"),
  BEE_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "ARTHROPODA", "INSECTA", "HYMENOPTERA", "APIDAE", "APIS", "APIS_MELLIFERA", "SYNTHETIC_ALPHA", "ANIMAL"),
  TREE_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "MAGNOLIOPSIDA", "FAGALES", "FAGACEAE", "KAIOS_ARBORA", "KAIOS_ARBORA_ALPHA", "SYNTHETIC_ALPHA", "PLANT"),
  RICE_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "LILIOPSIDA", "POALES", "POACEAE", "ORYZA", "ORYZA_SATIVA", "SYNTHETIC_ALPHA", "PLANT"),
  CORN_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "LILIOPSIDA", "POALES", "POACEAE", "ZEA", "ZEA_MAYS", "SYNTHETIC_ALPHA", "PLANT"),
  CABBAGE_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "MAGNOLIOPSIDA", "BRASSICALES", "BRASSICACEAE", "BRASSICA", "BRASSICA_OLERACEA", "SYNTHETIC_ALPHA", "PLANT"),
  FRUIT_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "MAGNOLIOPSIDA", "ROSALES", "ROSACEAE", "KAIOS_POMUM", "KAIOS_POMUM_ALPHA", "SYNTHETIC_ALPHA", "PLANT"),
  FLOWER_ALPHA: taxonomy("EUKARYOTA", "PLANTAE", "TRACHEOPHYTA", "MAGNOLIOPSIDA", "ASTERALES", "ASTERACEAE", "KAIOS_FLORA", "KAIOS_FLORA_ALPHA", "SYNTHETIC_ALPHA", "PLANT"),
  MUSHROOM_ALPHA: taxonomy("EUKARYOTA", "FUNGI", "BASIDIOMYCOTA", "AGARICOMYCETES", "AGARICALES", "AGARICACEAE", "KAIOS_FUNGUS", "KAIOS_FUNGUS_ALPHA", "SYNTHETIC_ALPHA", "FUNGUS"),
  HUMAN_ALPHA: taxonomy("EUKARYOTA", "ANIMALIA", "CHORDATA", "MAMMALIA", "PRIMATES", "HOMINIDAE", "HOMO", "HOMO_SAPIENS", "SYNTHETIC_CITIZEN_ALPHA", "HUMAN")
});

const ROLE_OVERRIDES = Object.freeze({
  MARINE_INVERTEBRATE_ALPHA: "SCAVENGER",
  FISH_ALPHA: "CARNIVORE",
  FROG_ALPHA: "CARNIVORE",
  ELEPHANT_ALPHA: "HERBIVORE",
  COW_ALPHA: "HERBIVORE",
  BEE_ALPHA: "HERBIVORE"
});

function normalizedIdentifier(value, field) {
  const result = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,96}$/.test(result)) throw new TypeError(`${field} is invalid`);
  return result;
}

export function resolveTrophicRoleV2(species) {
  const speciesId = normalizedIdentifier(species?.species_id, "species_id");
  const candidate = ROLE_OVERRIDES[speciesId] ?? species?.trophic_role;
  if (candidate === "CONSUMER") return "OMNIVORE";
  if (!FOOD_CHAIN_ROLES_V2.includes(candidate)) throw new TypeError(`${speciesId} has an invalid Food Chain V2 role`);
  return candidate;
}

export function createTaxonomyRecord(species) {
  const speciesId = normalizedIdentifier(species?.species_id, "species_id");
  const source = TAXONOMY[speciesId] ?? species?.taxonomy;
  if (!source) throw new TypeError(`${speciesId} has no taxonomy record`);
  const result = Object.fromEntries(TAXONOMY_RANKS.map((rank) => [rank, normalizedIdentifier(source[rank], `${speciesId}.${rank}`)]));
  const category = normalizedIdentifier(source.category ?? species.category, `${speciesId}.category`);
  if (!SPECIES_CATEGORIES.includes(category)) throw new TypeError(`${speciesId} has an invalid registry category`);
  return Object.freeze({ ...result, category });
}

export function validateTaxonomyRecord(record) {
  return TAXONOMY_RANKS.every((rank) => typeof record?.[rank] === "string" && record[rank].length > 0)
    && SPECIES_CATEGORIES.includes(record?.category);
}
