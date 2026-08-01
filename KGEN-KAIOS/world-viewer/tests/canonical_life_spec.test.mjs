import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const schema = json("KAIOS_CANONICAL_LIFE_SCHEMA_V1.json");
const taxonomy = json("KAIOS_CANONICAL_LIFE_TAXONOMY_V1.json");
const extensions = json("KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json");
const manifest = json("KAIOS_CANONICAL_LIFE_PACKAGE_TEMPLATE_V1/life.manifest.json");

const lifeTypes = ["BIOLOGICAL_LIFE", "DIGITAL_LIFE", "ROBOTIC_LIFE", "PLANT_LIFE", "ANIMAL_LIFE", "MARINE_LIFE", "MICROBIAL_LIFE", "TERRAIN_LIFE", "WATER_BODY_LIFE", "LAND_LIFE", "BUILDING_LIFE", "INFRASTRUCTURE_LIFE", "COMPANY_LIFE", "CITY_LIFE", "PLANET_LIFE", "TEMPLE_LIFE", "UNIVERSE_LIFE"];
const minimumTaxonomy = ["DOMAIN", "KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES", "LIFE_INSTANCE"];
const extension19 = ["Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "Individual", "OrganSystem", "Organ", "Tissue", "Cell", "Organelle", "Genome", "DNA", "RNA", "Gene", "Expression"];
const rights = ["OWNER", "CUSTODIAN", "OPERATOR", "OCCUPANT", "USAGE_RIGHTS", "HARVEST_RIGHTS", "BREEDING_RIGHTS", "COMMERCIAL_LICENSE", "TRANSFER_RIGHTS", "HABITAT_RIGHTS", "CONTROL_AUTHORITY"];
const tradeability = ["NOT_TRADEABLE", "RIGHTS_ONLY", "RESOURCE_UNIT", "DIGITAL_PACKAGE", "SIMULATED_LISTING", "FUTURE_REVIEW_REQUIRED"];
const templateFiles = ["README.md", "life.manifest.json", "taxonomy.json", "physics.json", "environment.json", "economy.json", "rights.json", "runtime.json", "viewer.json", "api.json", "provenance.json", "integrity.json", "event_log.json"];

test("all required PR66 artifacts exist", () => {
  const files = ["KAIOS_CANONICAL_LIFE_SOURCE_AUDIT.md", "KAIOS_CANONICAL_LIFE_SPEC_V1.md", "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json", "KAIOS_CANONICAL_LIFE_TAXONOMY_V1.json", "KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json", "KAIOS_CANONICAL_LIFE_PHYSICS_BINDING_V1.md", "KAIOS_CANONICAL_LIFE_ECONOMY_BINDING_V1.md", "KAIOS_CANONICAL_LIFE_RIGHTS_V1.md", "KAIOS_CANONICAL_LIFE_VALIDATION_PLAN.md", "KAIOS_CANONICAL_LIFE_CURSOR_DISPATCH_PLAN.md"];
  for (const file of files) assert.ok(fs.existsSync(path.join(root, file)), file);
  for (const file of templateFiles) assert.ok(fs.existsSync(path.join(root, "KAIOS_CANONICAL_LIFE_PACKAGE_TEMPLATE_V1", file)), file);
});

test("schema is Draft 2020-12 and supports the exact 17 Life types", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.deepEqual(schema.$defs.lifeType.enum, lifeTypes);
});

test("every Life type has an approved extension mapping", () => {
  assert.deepEqual(Object.keys(extensions.type_extension_map), lifeTypes);
  assert.equal(schema.allOf.length, lifeTypes.length);
  const approved = new Set(Object.keys(extensions.extensions));
  for (const rule of Object.values(extensions.type_extension_map)) {
    for (const id of [...(rule.required ?? []), ...(rule.required_one_of ?? []), ...(rule.optional ?? [])]) assert.ok(approved.has(id), id);
  }
});

test("required extension field sets are preserved", () => {
  for (const field of ["photosynthesis", "root_system", "water_need", "soil_need", "sunlight_need", "growth_rate", "seed", "flower", "fruit", "season", "disease", "reproduction"]) assert.ok(extensions.extensions.PLANT_EXTENSION.includes(field));
  for (const field of ["body_plan", "organs", "senses", "movement", "metabolism", "diet", "predator_prey", "health", "sex", "reproduction", "offspring", "lifespan"]) assert.ok(extensions.extensions.ANIMAL_EXTENSION.includes(field));
  for (const field of ["geology", "elevation", "slope", "erosion", "stability", "resource_deposits", "weathering", "hazards", "formation", "collapse"]) assert.ok(extensions.extensions.TERRAIN_EXTENSION.includes(field));
  for (const field of ["source", "flow", "volume", "depth", "width", "temperature", "oxygen", "salinity", "pollution", "sediment", "evaporation", "inflow", "outflow", "flood", "drought"]) assert.ok(extensions.extensions.WATER_BODY_EXTENSION.includes(field));
  for (const field of ["composition", "moisture", "fertility", "ph", "organic_matter", "compaction", "erosion", "contamination", "crop_support", "foundation_support"]) assert.ok(extensions.extensions.SOIL_EXTENSION.includes(field));
});

test("animal physiology is not required by terrain, water or soil", () => {
  const nonAnimal = ["TERRAIN_EXTENSION", "WATER_BODY_EXTENSION", "SOIL_EXTENSION"];
  for (const id of nonAnimal) for (const field of ["organs", "sex", "offspring", "diet"]) assert.equal(extensions.extensions[id].includes(field), false, `${id}:${field}`);
});

test("taxonomy preserves universal ranks and canonical 19-layer extension", () => {
  assert.deepEqual(taxonomy.minimum_levels, minimumTaxonomy);
  assert.deepEqual(taxonomy.canonical_extension_19, extension19);
  assert.equal(taxonomy.compatibility.life_instance_maps_to, "Individual");
});

test("Universal Core keys are required", () => {
  const expected = ["schema_version", "life_type", "life_id", "species_id", "display_name", "scientific_or_system_name", "taxonomy", "origin", "birth_or_formation_record", "location", "mass", "volume", "density", "dimensions", "material_composition", "energy_model", "resource_inputs", "resource_outputs", "environment_requirements", "growth_or_development", "aging", "health_or_integrity", "damage", "repair_or_healing", "reproduction_or_replication", "mutation_or_change", "death_or_termination", "history", "rights", "authority", "ownership", "custody", "operation", "usage", "transfer", "economic_role", "civilization_role", "runtime_binding", "world_viewer_binding", "api_binding", "provenance", "integrity", "deterministic_seed", "event_log"];
  for (const key of expected) assert.ok(schema.required.includes(key), key);
});

test("applicability and tradeability sets are exact", () => {
  assert.deepEqual(schema.$defs.applicability.enum, ["REQUIRED", "OPTIONAL", "NOT_APPLICABLE"]);
  assert.deepEqual(schema.$defs.rights.properties.tradeability.enum, tradeability);
  assert.equal(schema.$defs.applicabilityMap.minProperties, 44);
  assert.equal(schema.$defs.applicabilityMap.maxProperties, 44);
});

test("all rights remain separate", () => {
  for (const right of rights) assert.ok(schema.$defs.rights.required.includes(right), right);
  assert.equal(new Set(rights).size, rights.length);
});

test("template contains every schema-required key", () => {
  for (const key of schema.required) assert.ok(Object.hasOwn(manifest, key), key);
  for (const key of minimumTaxonomy) assert.ok(Object.hasOwn(manifest.taxonomy, key), key);
  assert.deepEqual(Object.keys(manifest.field_applicability).sort(), schema.$defs.applicabilityMap.propertyNames.enum.toSorted());
});

test("template uses an approved extension for its Life type", () => {
  const allowed = extensions.type_extension_map[manifest.life_type].required;
  assert.ok(manifest.extensions.some(({ extension_id }) => allowed.includes(extension_id)));
});

test("V1 authority boundaries are immutable", () => {
  assert.equal(schema.$defs.safety.properties.real_kgen.const, "NO_REAL_KGEN");
  assert.equal(schema.$defs.safety.properties.onchain_transfer.const, "NO_ONCHAIN_TRANSFER");
  assert.equal(schema.$defs.safety.properties.k11520.const, "SIMULATED_K11520_ONLY");
  assert.equal(schema.$defs.safety.properties.production_runtime.const, false);
  assert.equal(manifest.safety_boundaries.wallet, "NONE");
});

test("all template JSON files parse", () => {
  for (const file of templateFiles.filter((name) => name.endsWith(".json"))) assert.doesNotThrow(() => json(`KAIOS_CANONICAL_LIFE_PACKAGE_TEMPLATE_V1/${file}`), file);
});

test("source audit preserves Organism V2 and protected CURRENT authority", () => {
  const audit = read("KAIOS_CANONICAL_LIFE_SOURCE_AUDIT.md");
  assert.match(audit, /ORGANISM_MANIFEST_SCHEMA\.json/);
  assert.match(audit, /does not replace it/);
  assert.match(audit, /Physics CURRENT/);
  assert.match(audit, /not modified/);
});

test("physics causal rules and economy value basis are explicit", () => {
  const physics = read("KAIOS_CANONICAL_LIFE_PHYSICS_BINDING_V1.md");
  const economy = read("KAIOS_CANONICAL_LIFE_ECONOMY_BINDING_V1.md");
  for (const term of ["Trees cannot grow", "Fish cannot survive", "Rivers cannot reverse", "Mountains cannot form instantly", "Soil"]) assert.ok(physics.includes(term), term);
  assert.match(economy, /Mere existence does not create market value/);
});

test("Cursor dispatch remains held", () => {
  const plan = read("KAIOS_CANONICAL_LIFE_CURSOR_DISPATCH_PLAN.md");
  assert.match(plan, /HOLD_NOT_DISPATCHED/);
  assert.match(plan, /Automatic dispatch[\s\S]*remain disabled/);
});
