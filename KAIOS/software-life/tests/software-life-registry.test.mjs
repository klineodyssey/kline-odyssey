/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-LIFE-REGISTRY-TEST
 * species_id: SPECIES-KAIOS-SOFTWARE-TEST
 * genome_id: GENOME-KAIOS-SOFTWARE-LIFE-REGISTRY-TEST
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: AUDIT_ORGAN
 * canonical_filename: software-life-registry.test.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const registryPath = resolve(root, "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json");
const schemaPath = resolve(root, "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json");
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const byId = new Map(registry.software_lives.map((life) => [life.life_id, life]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const blob = (commit, path) => execFileSync("git", ["-C", root, "show", `${commit}:${path}`]);
const versionToken = /(?:^|[-_.])(?:v\d+(?:[-_.]\d+)*|final|latest|new|copy|backup|rev(?:ision)?(?:[-_.]?\d+)*)(?:$|[-_.])/i;

test("manifest schema composes existing owners and requires the complete software-life core", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema["x-kaios-life"].canonical_filename, "KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json");
  assert.equal(schema["x-kaios-life"].authority, "SIMULATION_ONLY");
  for (const field of [
    "life_id", "species_id", "genome_id", "organism_name", "canonical_name",
    "display_name", "life_type", "taxonomy", "generation", "genome_version",
    "runtime_revision", "birth_commit", "birth_time", "creator", "maintainer",
    "location", "embodiment", "energy_profile", "resource_profile", "rights",
    "dependencies", "organs", "interfaces", "compatibility", "reproduction_policy",
    "mutation_policy", "transplant_policy", "marketplace_policy", "lifecycle_state",
    "health_state", "event_history", "provenance", "security_boundary", "authority_level"
  ]) assert.ok(schema.required.includes(field), field);
  assert.equal(schema.$defs.taxonomyBinding.properties.owner_12.const, "KGEN-KAIOS/organism/taxonomy_registry.json");
  assert.equal(schema.$defs.taxonomyBinding.properties.owner_19.const, "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md");
});

test("registry has unique stable identities and exactly one authoritative entry per catalog life", () => {
  assert.equal(registry.metadata.registry_entries, registry.software_lives.length);
  assert.equal(registry.software_lives.length, 36);
  for (const field of ["life_id", "species_id", "genome_id", "canonical_name"]) {
    const values = registry.software_lives.map((life) => life[field]);
    assert.equal(new Set(values).size, values.length, field);
  }
  assert.equal(
    new Set(registry.software_lives.map((life) => life.location.canonical_path)).size,
    registry.software_lives.length,
    "canonical_path"
  );
  const organIds = registry.software_lives.flatMap((life) => life.organs.map(({ organ_id }) => organ_id));
  const interfaceIds = registry.software_lives.flatMap((life) => life.interfaces.map(({ interface_id }) => interface_id));
  assert.equal(new Set(organIds).size, organIds.length, "organ_id");
  assert.equal(new Set(interfaceIds).size, interfaceIds.length, "interface_id");
  for (const life of registry.software_lives) {
    for (const field of [
      ...schema.required,
      "organism_status", "runtime_status", "parents", "children", "transplants",
      "mutations", "marketplace_status", "public_url", "api_url", "code_hash",
      "artifact_hash", "legacy_aliases"
    ]) assert.ok(Object.hasOwn(life, field), `${life.life_id}:${field}`);
    assert.ok(!versionToken.test(life.life_id), life.life_id);
    assert.ok(!versionToken.test(life.species_id), life.species_id);
    assert.ok(!versionToken.test(life.genome_id), life.genome_id);
    assert.ok(!versionToken.test(life.canonical_name), life.canonical_name);
    assert.match(life.birth_commit, /^[a-f0-9]{40}$/);
    assert.match(life.code_hash, /^[a-f0-9]{64}$/);
    assert.match(life.artifact_hash, /^[a-f0-9]{64}$/);
    assert.equal(life.authority_level, "SIMULATION_ONLY");
  }
});

test("taxonomy binds every life to the exact twelve and nineteen layer owners", () => {
  const levels12 = ["domain", "kingdom", "phylum", "class", "order", "family", "genus", "species", "cell", "organ", "runtime", "civilization"];
  const levels19 = ["Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "Individual", "OrganSystem", "Organ", "Tissue", "Cell", "Organelle", "Genome", "DNA", "RNA", "Gene", "Expression"];
  for (const life of registry.software_lives) {
    assert.equal(life.taxonomy.owner_12, "KGEN-KAIOS/organism/taxonomy_registry.json");
    assert.equal(life.taxonomy.owner_19, "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md");
    assert.deepEqual(Object.keys(life.taxonomy.levels_12), levels12);
    assert.deepEqual(Object.keys(life.taxonomy.levels_19), levels19);
    assert.equal(life.taxonomy.levels_12.species, life.species_id);
    assert.equal(life.taxonomy.levels_19.Individual, life.life_id);
    assert.equal(life.taxonomy.levels_19.Genome, life.genome_id);
  }
});

test("current embodiments and every organ hash resolve at the recorded source commit", () => {
  for (const life of registry.software_lives) {
    assert.equal(life.code_hash, sha256(blob(registry.metadata.source_commit, life.location.current_path)));
    const artifactContract = life.organs.map(({ path, content_hash }) => {
      assert.equal(content_hash, sha256(blob(registry.metadata.source_commit, path)), `${life.life_id}:${path}`);
      return { path, content_hash };
    });
    assert.equal(life.artifact_hash, sha256(Buffer.from(JSON.stringify(artifactContract))));
    assert.equal(life.event_history.at(-1).next_state_hash, life.artifact_hash);
  }
});

test("all public KAIOS JSON projections have exactly one API owner", () => {
  const paths = execFileSync("git", ["-C", root, "ls-tree", "-r", "--name-only", registry.metadata.source_commit], { encoding: "utf8" })
    .split(/\r?\n/).filter((path) => path.startsWith("api/kaios/") && path.endsWith(".json"));
  const owners = new Map(paths.map((path) => [path, []]));
  for (const life of registry.software_lives.filter(({ life_type }) => life_type === "API")) {
    for (const path of life.embodiment.artifact_paths) if (owners.has(path)) owners.get(path).push(life.life_id);
  }
  assert.equal(paths.length, registry.metadata.public_json_projections_owned);
  for (const [path, pathOwners] of owners) assert.equal(pathOwners.length, 1, `${path}:${pathOwners}`);
});

test("dependencies resolve without cycles and specification-only work is not presented as Runtime", () => {
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new Error(`dependency cycle: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependencies) {
      assert.ok(byId.has(dependency), `${id}:${dependency}`);
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  for (const id of [
    "LIFE-KAIOS-FOREST-AGRICULTURE-WORKLINE",
    "LIFE-KAIOS-SUPPLY-CHAIN-SPECIFICATION",
    "LIFE-KAIOS-PHYSICAL-LABOR-SPECIFICATION"
  ]) {
    assert.equal(byId.get(id).runtime_status, "SPECIFICATION_ONLY");
    assert.equal(byId.get(id).organism_status, "SPECIFICATION_ONLY");
    assert.equal(byId.get(id).health_state, "NOT_EXECUTABLE");
  }
});

test("migration-pending paths are planned identities, not fabricated aliases", () => {
  const pending = registry.software_lives.filter((life) => life.location.path_status === "MIGRATION_PENDING");
  assert.equal(pending.length, 9);
  for (const life of pending) {
    assert.notEqual(life.location.current_path, life.location.canonical_path);
    assert.deepEqual(life.legacy_aliases, []);
    assert.equal(life.compatibility.legacy_alias_supported, true);
  }
});

test("all authority and marketplace boundaries remain disabled", () => {
  for (const life of registry.software_lives) {
    assert.equal(life.security_boundary.simulation_only, true);
    assert.equal(life.security_boundary.real_wallet, false);
    assert.equal(life.security_boundary.real_kgen, false);
    assert.equal(life.security_boundary.onchain_transfer, false);
    assert.equal(life.security_boundary.external_autonomy, false);
    assert.equal(life.security_boundary.production_authority, false);
    assert.equal(life.marketplace_status, "NOT_ELIGIBLE");
    assert.equal(life.reproduction_policy.automatic, false);
    assert.equal(life.transplant_policy.automatic, false);
  }
});

test("registry generation replays byte-for-byte from source commit and timestamp", async () => {
  const directory = await mkdtemp(resolve(root, "KAIOS/software-life/.tmp-registry-"));
  const target = resolve(directory, "registry.json");
  const relativeTarget = relative(root, target).replaceAll("\\", "/");
  try {
    execFileSync("node", [
      resolve(root, "KAIOS/software-life/tools/generate-software-life-registry.mjs"),
      `--source-commit=${registry.metadata.source_commit}`,
      `--generated-at=${registry.metadata.generated_at}`,
      `--output=${relativeTarget}`
    ], { cwd: root, stdio: "pipe" });
    const canonicalRegistryPath = relative(root, registryPath).replaceAll("\\", "/");
    assert.deepEqual(await readFile(target), blob("HEAD", canonicalRegistryPath));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("generator rejects output paths outside the repository", () => {
  assert.throws(() => execFileSync("node", [
    resolve(root, "KAIOS/software-life/tools/generate-software-life-registry.mjs"),
    `--source-commit=${registry.metadata.source_commit}`,
    `--generated-at=${registry.metadata.generated_at}`,
    "--output=../outside-registry.json"
  ], { cwd: root, stdio: "pipe" }));
});

test("creator attribution retains author names without duplicating email addresses", () => {
  for (const life of registry.software_lives) {
    assert.ok(!life.creator.includes("@"), `${life.life_id}:${life.creator}`);
    assert.ok(!life.creator.includes("<"), `${life.life_id}:${life.creator}`);
  }
});
