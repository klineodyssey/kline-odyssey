/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-LIFE-NAMING-TEST
 * species_id: SPECIES-KAIOS-SOFTWARE-TEST
 * genome_id: GENOME-KAIOS-SOFTWARE-LIFE-NAMING-TEST
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: AUDIT_ORGAN
 * canonical_filename: software-life-naming-audit.test.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path) => readFile(resolve(root, path), "utf8");
const readJson = async (path) => JSON.parse(await read(path));

const allowedTypes = new Set([
  "DOCUMENT_VERSION_ALLOWED",
  "SCHEMA_METADATA_ALLOWED",
  "RELEASE_RECORD_ALLOWED",
  "ARCHIVE_NAME_ALLOWED",
  "LEGACY_ROUTE_ALLOWED",
  "EXECUTABLE_CANONICAL_NAME_VIOLATION",
  "MODULE_CANONICAL_NAME_VIOLATION",
  "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION",
  "LIFE_IDENTITY_VIOLATION",
  "AMBIGUOUS_REVIEW_REQUIRED"
]);
const violationTypes = new Set([
  "EXECUTABLE_CANONICAL_NAME_VIOLATION",
  "MODULE_CANONICAL_NAME_VIOLATION",
  "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION",
  "LIFE_IDENTITY_VIOLATION"
]);

test("audit covers the complete recorded Git baseline and every item is classified", async () => {
  const audit = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json");
  assert.equal(audit.metadata.mode, "AUDIT_ONLY_NO_RENAME");
  assert.equal(audit.metadata.source_scope, "GIT_TRACKED_FILES_AT_SOURCE_COMMIT");
  assert.match(audit.metadata.source_commit, /^[a-f0-9]{40}$/);
  assert.ok(audit.summary.files_audited >= 3300);
  assert.equal(audit.summary.total_items, audit.items.length);
  assert.equal(
    Object.values(audit.summary.classifications).reduce((sum, count) => sum + count, 0),
    audit.items.length
  );
  for (const item of audit.items) {
    for (const field of [
      "path", "filename", "type", "current_role", "version_token",
      "canonical_identity", "recommended_name", "migration_risk", "references",
      "public_url_impact", "test_impact", "action"
    ]) assert.ok(Object.hasOwn(item, field), `${item.audit_id}:${field}`);
    assert.ok(allowedTypes.has(item.type), item.type);
    assert.ok(Array.isArray(item.references));
    assert.ok(Array.isArray(item.test_impact));
  }
});

test("known executables, routes, documents and protected releases are separated", async () => {
  const audit = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json");
  const pathItem = (path) => audit.items.find((item) => item.location_kind === "PATH" && item.path === path);
  assert.equal(
    pathItem("KAIOS/ai-company/generate-ai-company-v1-api.mjs").type,
    "EXECUTABLE_CANONICAL_NAME_VIOLATION"
  );
  assert.equal(
    pathItem("api/kaios/ai-company/v1/projects.json").type,
    "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION"
  );
  assert.equal(
    pathItem("KAIOS_AI_COMPANY_RUNTIME_V1_CLOSEOUT.md").type,
    "DOCUMENT_VERSION_ALLOWED"
  );
  assert.equal(
    pathItem("KGEN/contracts/KGEN_Token_V7_5_2.sol").type,
    "RELEASE_RECORD_ALLOWED"
  );
  assert.equal(pathItem("KGEN/contracts/KGEN_Token_V7_5_2.sol").migration_risk, "P0_HOLD");
  assert.ok(pathItem("KGEN/contracts/KGEN_Token_V7_5_2.sol").reference_count > 0);
});

test("rename plan is complete, reversible and not executed", async () => {
  const [audit, plan] = await Promise.all([
    readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json"),
    readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json")
  ]);
  const expected = audit.items.filter((item) => violationTypes.has(item.type));
  assert.equal(plan.metadata.status, "PLANNED_NOT_EXECUTED");
  assert.equal(plan.migrations.length, expected.length);
  assert.ok(plan.canonical_collisions.length > 0);
  for (const migration of plan.migrations) {
    assert.equal(migration.status, "PLANNED_NOT_EXECUTED");
    assert.ok(migration.rollback);
    assert.ok(migration.compatibility_period);
    if (migration.old_public_url) {
      assert.equal(migration.redirect_required, true);
      assert.equal(migration.alias_required, true);
      assert.ok(migration.canonical_public_url);
    }
  }
});

test("software taxonomy reuses the exact existing 19 layer owner", async () => {
  const crosswalk = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_TAXONOMY_CROSSWALK.json");
  assert.equal(crosswalk.metadata.creates_new_taxonomy, false);
  assert.equal(
    crosswalk.owners.canonical_nineteen_layer_extension,
    "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md"
  );
  assert.deepEqual(crosswalk.extension_19.map(({ layer }) => layer), [
    "Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus",
    "Species", "Individual", "OrganSystem", "Organ", "Tissue", "Cell",
    "Organelle", "Genome", "DNA", "RNA", "Gene", "Expression"
  ]);
  assert.equal(crosswalk.compatibility_rules.second_taxonomy_forbidden, true);
  assert.equal(crosswalk.compatibility_rules.permanent_species_identity_version_free, true);
});

test("identity standard declares all fields, lifecycle states and denied authorities", async () => {
  const standard = await read("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_IDENTITY_STANDARD.md");
  for (const field of [
    "life_id", "species_id", "genome_id", "canonical_name", "generation",
    "genome_version", "runtime_revision", "organs", "interfaces", "rights",
    "event_history", "provenance", "security_boundary", "authority_level"
  ]) assert.match(standard, new RegExp(`\\b${field}\\b`));
  for (const state of [
    "CONCEIVED", "SPECIFIED", "BORN", "ACTIVE", "STRESSED", "DEGRADED",
    "HEALING", "MUTATING", "REPRODUCTION_REVIEW", "TRANSPLANT_REVIEW",
    "RETIRED", "ARCHIVED", "DEAD"
  ]) assert.match(standard, new RegExp(`\\b${state}\\b`));
  for (const boundary of [
    "NO_REAL_WALLET", "NO_REAL_KGEN", "NO_ONCHAIN_TRANSFER",
    "NO_PRODUCTION_AUTHORITY"
  ]) assert.match(await read("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_NAMING_AUDIT_REPORT.md"), new RegExp(boundary));
});

test("24 hour queue is bounded and Cursor remains one task at a time", async () => {
  const queue = await readJson("KAIOS/software-life/KAIOS_AI_WORKFORCE_24H_QUEUE.json");
  assert.equal(queue.codex_queue.length, 24);
  assert.equal(queue.metadata.literal_uninterrupted_computation_claimed, false);
  assert.equal(queue.cursor.one_task_at_a_time, true);
  assert.equal(queue.cursor.current_task, "KAIOS-CURSOR-EARTHWORM-CANDIDATE-001");
  assert.equal(queue.cursor.can_merge, false);
  assert.equal(queue.cursor.can_deploy, false);
  assert.equal(queue.cursor.can_promote_canonical, false);
  assert.equal(queue.policy.real_wallet, false);
  assert.equal(queue.policy.real_kgen, false);
  assert.equal(queue.policy.production_authority, false);
});
