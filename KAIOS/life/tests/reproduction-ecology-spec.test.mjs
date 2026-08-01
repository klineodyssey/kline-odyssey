import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const schema = JSON.parse(read("KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_SCHEMA_V1.json"));
const envelope = JSON.parse(read("KAIOS/life/ecology/KAIOS_ECOLOGY_CURSOR_TASK_ENVELOPE.json"));
const registry = JSON.parse(read("KGEN-KAIOS/worker_registry.json"));
const spec = read("KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1_SPEC.md");
const crosswalk = read("KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_SOURCE_CROSSWALK.md");
const cursor = registry.workers.find(({ worker_id: id }) => id === "cursor-01");

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.properties.runtime.const, "KAIOS_REPRODUCTION_ECOLOGY_RUNTIME_V1");
assert.equal(schema.$defs.boundaries.properties.uncontrolled_reproduction.const, false);
assert.equal(schema.$defs.boundaries.properties.automatic_new_species.const, false);
assert.equal(schema.$defs.boundaries.properties.production_authority.const, false);
assert.equal(schema.$defs.population.properties.count.maximum, 500);
assert.equal(schema.properties.events.maxItems, 1000);
assert.equal(schema.properties.entities.maxItems, 200);
assert.equal(schema.$defs.entityType.enum.length, 21);
for (const field of ["id", "type", "location", "simulation_time", "status", "source", "authority", "simulation_only", "history", "previous_state_hash", "next_state_hash"]) assert(schema.$defs.entity.required.includes(field));

const modes = schema.$defs.reproductionMode.enum;
for (const mode of ["SEED_PROPAGATION", "VEGETATIVE_PROPAGATION", "SEXUAL_REPRODUCTION", "SPAWNING", "LARVAL_DEVELOPMENT", "NO_REPRODUCTION"]) assert(modes.includes(mode));
for (const life of ["Mountain", "Soil", "Water", "River"]) assert(spec.includes(`| ${life} | \`NO_REPRODUCTION\` |`));
for (const reason of ["NO_MATE_OR_PROPAGATION_SOURCE", "INSUFFICIENT_ENERGY", "INSUFFICIENT_FOOD", "INSUFFICIENT_WATER", "NO_HABITAT", "OVER_CARRYING_CAPACITY", "WRONG_SEASON", "TEMPERATURE_OUT_OF_RANGE", "HEALTH_TOO_LOW", "REPRODUCTION_COOLDOWN", "POPULATION_CAP_REACHED"]) assert(spec.includes(reason));
for (const pool of ["AQUATIC_PRIMARY_FOOD_POOL", "DETRITUS_POOL", "MICROBIAL_DECOMPOSITION_PROXY"]) assert(spec.includes(pool));
assert(spec.includes("NO_AUTOMATIC_NEW_SPECIES"));

for (const chapter of [23, 24, 47, 49, 58, 80, 84, 107, 114, 121, 122, 132, 135]) assert(crosswalk.includes(`| ${chapter} |`));
assert(crosswalk.includes("does not promote"));

assert.deepEqual(cursor.worker_classes, ["FOUNDATIONAL_LIFE_CREATOR", "LIFE_RESEARCH_ANALYST"]);
assert.equal(cursor.current_task, envelope.task_id);
assert.equal(cursor.current_branch, envelope.branch_name);
assert.equal(envelope.output_status, "CANDIDATE_ONLY");
assert.equal(envelope.merge_allowed, false);
assert.equal(envelope.deploy_allowed, false);
assert.equal(envelope.production_authority, false);
assert.equal(envelope.wallet_access, false);
assert.equal(envelope.real_kgen_access, false);
assert(envelope.forbidden_actions.includes("MODIFY_RUNTIME_ENGINE"));
assert(envelope.forbidden_actions.includes("UNBOUNDED_REPRODUCTION"));

console.log("KAIOS_REPRODUCTION_ECOLOGY_SPEC_TEST_PASS");
