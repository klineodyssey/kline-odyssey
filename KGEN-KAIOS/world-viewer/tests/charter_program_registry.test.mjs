import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const compilerRoot = resolve(root, "KGEN-KAIOS/civilization/charter-program-compiler");
const apiRoot = resolve(root, "api/kaios/charter/programs");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const registry = readJson(resolve(compilerRoot, "KAIOS_GENESIS_CHARTER_PROGRAM_REGISTRY.json"));
const crosswalk = readJson(resolve(compilerRoot, "KAIOS_CHARTER_TO_RUNTIME_CROSSWALK.json"));
const graph = readJson(resolve(compilerRoot, "KAIOS_CHARTER_PROGRAM_DEPENDENCY_GRAPH.json"));
const backlog = readJson(resolve(compilerRoot, "KAIOS_CHARTER_PROGRAM_IMPLEMENTATION_BACKLOG.json"));
const publicIndex = readJson(resolve(apiRoot, "index.json"));
const publicStatus = readJson(resolve(apiRoot, "status.json"));
const publicDependencies = readJson(resolve(apiRoot, "dependencies.json"));
const publicCoverage = readJson(resolve(apiRoot, "coverage.json"));
const publicConflicts = readJson(resolve(apiRoot, "conflicts.json"));

assert.equal(registry.source_files_read, 144);
assert.equal(registry.source_records.length, 144);
assert.equal(registry.markdown_files, 143);
assert.equal(registry.pdf_files, 1);
assert.equal(registry.programs.length, 143);
assert.deepEqual(registry.missing_chapters, []);
assert.deepEqual(registry.duplicate_chapters, [0, 133]);
assert.equal(registry.canonical_lineage, null);
assert(registry.safety.includes("NO_CONSTITUTION_SOURCE_MODIFICATION"));
assert(registry.safety.includes("NO_PRODUCTION_AUTHORITY"));

const chapters = new Set(registry.source_records.map(({ chapter_number: number }) => number).filter(Number.isInteger));
for (let chapter = 0; chapter <= 138; chapter += 1) assert(chapters.has(chapter), `Missing chapter ${chapter}`);
assert.equal(registry.source_records.filter(({ normalization }) => normalization === "READ_ONLY_RECOVERED_VIEW").length, 41);
assert.equal(registry.source_records.filter(({ program_extraction }) => program_extraction === "REFERENCE_MEDIA_ONLY_NO_SEPARATE_PROGRAM").length, 1);

const allowedStatuses = new Set([
  "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION", "IMPLEMENTED_PARTIAL", "IMPLEMENTED_READ_ONLY",
  "IMPLEMENTED_SCHEMA_ONLY", "IMPLEMENTED_DEMO_ONLY", "SPECIFICATION_ONLY",
  "CONFLICTING_IMPLEMENTATION", "MISSING", "SOURCE_UNDERSPECIFIED",
  "NOT_CURRENTLY_IMPLEMENTABLE", "PROHIBITED_UNDER_CURRENT_BOUNDARY"
]);
const allowedPromotions = new Set([
  "SOURCE_REQUIREMENT", "REVIEWED_REQUIREMENT", "APPROVED_SPECIFICATION",
  "IMPLEMENTATION_AUTHORIZED", "IMPLEMENTED_SIMULATION", "RUNTIME_VALIDATED",
  "PRODUCTION_NOT_AUTHORIZED"
]);

for (const program of registry.programs) {
  assert(program.program_id);
  assert(program.domain);
  assert(allowedStatuses.has(program.implementation_status), program.implementation_status);
  assert(allowedPromotions.has(program.promotion_status), program.promotion_status);
  assert(Array.isArray(program.dependencies));
  assert(Array.isArray(program.tests));
  assert(program.authorized_mode !== "PRODUCTION");
  assert(!program.security_boundary.includes("REAL_WALLET"));
  for (const path of program.current_paths) assert(existsSync(resolve(root, path)), `Missing evidence path: ${path}`);
}

assert.equal(crosswalk.entries.length, registry.programs.length);
assert.equal(backlog.items.length, registry.programs.length);
assert.equal(graph.directed_acyclic, true);
assert.deepEqual(graph.architecture_cycles, []);
assert.equal(graph.feedback_loops.every(({ classification }) => classification === "VALID_RUNTIME_FEEDBACK_LOOP"), true);

// Kahn traversal proves the declared build graph is actually acyclic.
const indegree = new Map(graph.nodes.map(({ id }) => [id, 0]));
const outgoing = new Map(graph.nodes.map(({ id }) => [id, []]));
for (const edge of graph.edges) {
  assert(indegree.has(edge.from) && indegree.has(edge.to));
  indegree.set(edge.to, indegree.get(edge.to) + 1);
  outgoing.get(edge.from).push(edge.to);
}
const queue = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
let visited = 0;
while (queue.length) {
  const id = queue.shift();
  visited += 1;
  for (const target of outgoing.get(id)) {
    indegree.set(target, indegree.get(target) - 1);
    if (indegree.get(target) === 0) queue.push(target);
  }
}
assert.equal(visited, graph.nodes.length, "Dependency graph contains an undeclared cycle");

for (const payload of [publicIndex, publicStatus, publicDependencies, publicCoverage, publicConflicts]) {
  assert.equal(payload.read_only, true);
  assert(!("commands" in payload));
  assert(!("mutations" in payload));
}
assert.equal(publicIndex.mutation_endpoints, false);
assert.equal(publicIndex.program_count, registry.programs.length);
assert.equal(publicIndex.programs.some((program) => Object.hasOwn(program, "source_analysis")), false);
assert.equal(publicStatus.foundation_gap_closure_v1.status, "IMPLEMENTED_SIMULATION");
assert.equal(publicStatus.foundation_gap_closure_v1.production_authority, false);
assert.equal(publicStatus.foundation_gap_closure_v1.components.length, 4);
assert(existsSync(resolve(root, publicStatus.foundation_gap_closure_v1.runtime)));
assert.equal(registry.programs.filter(({ conflicts }) => conflicts.length > 0).length, 7);
assert.equal(publicConflicts.conflict_count, 7);

const viewerHtml = readFileSync(resolve(root, "KGEN-KAIOS/world-viewer/index.html"), "utf8");
const viewerApp = readFileSync(resolve(root, "KGEN-KAIOS/world-viewer/app.js"), "utf8");
const centerView = readFileSync(resolve(root, "KGEN-KAIOS/world-viewer/program-center/program-center-view.js"), "utf8");
assert.match(viewerHtml, /data-mode="PROGRAMS"/);
assert.match(viewerApp, /KAIOS Genesis Charter Program Center/);
assert.match(centerView, /READ_ONLY REQUIREMENTS/);
assert.match(centerView, /mutation_endpoints !== false/);
assert.match(centerView, /foundation_gap_closure_v1/);
assert.doesNotMatch(centerView, /walletConnect|eth_sendTransaction|privateKey|seed phrase/i);

console.log(`Charter program registry: ${registry.source_records.length} sources / ${registry.programs.length} programs / PASS`);
