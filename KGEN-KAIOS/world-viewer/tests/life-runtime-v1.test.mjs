import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (relativePath) => readFile(path.join(ROOT, relativePath), "utf8");

const [page, app, styles, worldViewer, catalogText, stateText] = await Promise.all([
  read("world-viewer/life-runtime/index.html"),
  read("world-viewer/life-runtime/app.js"),
  read("world-viewer/life-runtime/styles.css"),
  read("KGEN-KAIOS/world-viewer/index.html"),
  read("api/kaios/life-runtime-v1/catalog.json"),
  read("api/kaios/life-runtime-v1/state.json")
]);

for (const marker of ["KAIOS Life Runtime V1", "LOCAL_DETERMINISTIC_SIMULATION", "NO_REAL_KGEN", "NO_WALLET", "NO_PRODUCTION_AUTHORITY", "life-grid", "event-list", "retry-button"]) {
  assert.ok(page.includes(marker), `viewer marker missing: ${marker}`);
}
for (const control of ["start-button", "pause-button", "step-button", "replay-button", "reset-button", "export-button", "import-input"]) {
  assert.ok(page.includes(`id="${control}"`), `control missing: ${control}`);
}
assert.ok(app.includes("createFoundationalLifeRuntime"));
assert.ok(app.includes("loadFoundationalLifeDefinitions"));
assert.ok(styles.includes("@media (max-width:600px)"));
assert.ok(styles.includes("prefers-reduced-motion"));
assert.ok(worldViewer.includes("world-viewer/life-runtime/"));

const catalog = JSON.parse(catalogText);
const state = JSON.parse(stateText);
assert.equal(catalog.packages.length, 8);
assert.equal(state.states.length, 8);
assert.equal(catalog.production_authority, false);
assert.equal(catalog.wallet, "NONE");
assert.equal(catalog.real_kgen, "NO_REAL_KGEN");
assert.equal(catalog.settlement, false);
assert.deepEqual(catalog.packages.map(({ name }) => name), ["grass", "tree", "fish", "shrimp", "mountain", "soil", "water", "river"]);

for (const forbidden of ["localhost", "127.0.0.1", "file://", "private_key", "seed_phrase"]) {
  assert.equal(`${page}\n${app}\n${catalogText}`.includes(forbidden), false, `forbidden reference: ${forbidden}`);
}
assert.equal(/(?:^|[\s"'=])[A-Za-z]:[\\/]/m.test(`${page}\n${app}\n${catalogText}`), false, "local filesystem path exposed");

console.log("KAIOS_LIFE_RUNTIME_V1_VIEWER_TEST_PASS");
