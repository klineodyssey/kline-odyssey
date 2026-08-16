import { requireArray, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { validateRightsManifest } from "../permissions/index.mjs";

export const SPECIES_FIELDS = Object.freeze([
  "species_id", "domain", "kingdom", "phylum", "class", "order", "family", "genus", "species",
  "parent_species", "genome_manifest", "code_manifest", "skill_manifest", "default_rights",
  "evolution_rules", "reproduction_rules", "version", "status"
]);

export function validateSpecies(species) {
  requireFields(species, SPECIES_FIELDS, "Species");
  requireId(species.species_id, "species_id");
  requireArray(species.code_manifest, "code_manifest");
  requireArray(species.skill_manifest, "skill_manifest");
  invariant(species.code_manifest.every((item) => item.path && item.export), "UNRESOLVABLE_CODE_MANIFEST", "Every code manifest entry requires path and export");
  validateRightsManifest(species.default_rights);
  return species;
}

export async function resolveSpeciesCode(species, resolver) {
  validateSpecies(species);
  const resolved = [];
  for (const item of species.code_manifest) resolved.push(await resolver(item));
  invariant(resolved.every(Boolean), "SPECIES_CODE_NOT_FOUND", `Species code manifest cannot be resolved: ${species.species_id}`);
  return resolved;
}

export function createSpeciesRegistry(store, createRegistry) {
  return createRegistry({ domain: "SPECIES", stream: "SPECIES", idField: "species_id", validate: validateSpecies, store });
}
