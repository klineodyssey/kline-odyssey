import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

const API_FILES = [
  "index.json",
  "ponds.json",
  "water-quality.json",
  "populations.json",
  "feed.json",
  "harvests.json",
  "inventory.json",
  "orders.json",
  "ledger.json",
  "events.json",
  "status.json"
];

test("official homepage exposes fishpond navigation, feature card, API and footer routes", async () => {
  const html = await read("index.html");
  assert.match(html, /KAIOS 魚塭水產世界/);
  assert.match(html, /href="\.\/world-viewer\/aquaculture-v1\/"/);
  assert.match(html, /href="\.\/api\/kaios\/aquaculture\/v1\/"/);
  assert.match(html, /NO REAL FOOD-SAFETY CERTIFICATION/);
});

test("full World Viewer exposes the interactive fishpond capability and stable route", async () => {
  const html = await read("KGEN-KAIOS/world-viewer/index.html");
  assert.match(html, /data-capability="FISHPOND"/);
  assert.match(html, /IMPLEMENTED_INTERACTIVE \/ SIMULATION ONLY/);
  assert.match(html, /world-viewer\/aquaculture-v1\//);
});

test("aquaculture Viewer has all required navigation, controls and safety boundaries", async () => {
  const html = await read("world-viewer/aquaculture-v1/index.html");
  const requiredIds = [
    "select-land", "design", "construct", "start", "pause", "resume", "advance",
    "fill", "test-water", "stock-fish", "stock-shrimp", "feed-action", "aerate",
    "exchange", "health", "harvest-action", "cold", "delivery", "market",
    "run-scenario", "export", "import", "reset", "retry"
  ];
  for (const id of requiredIds) assert.match(html, new RegExp(`id="${id}"`), `missing control ${id}`);
  assert.match(html, /href="\.\.\/\.\.\/"[^>]*>返回官方首頁/);
  assert.match(html, /href="\.\.\/ecosystem-v1\/"/);
  assert.match(html, /NO REAL KGEN/);
  assert.match(html, /NO REAL WALLET/);
  assert.match(html, /NO PRODUCTION AUTHORITY/);
  assert.doesNotMatch(html, /(?:localhost|127\.0\.0\.1|file:\/\/|[A-Za-z]:\\)/i);
  assert.doesNotMatch(html, /(?:href|src)="\//i);
});

test("all eleven public API projections are valid read-only JSON", async () => {
  for (const filename of API_FILES) {
    const body = await read(`api/kaios/aquaculture/v1/${filename}`);
    assert.notEqual(body.charCodeAt(0), 0xfeff, `${filename} has a BOM`);
    const payload = JSON.parse(body);
    assert.equal(payload.simulation_only, true, `${filename} must remain simulation-only`);
    assert.equal(payload.authority, "NO_PRODUCTION_AUTHORITY", `${filename} cannot carry Production authority`);
    assert.equal(payload.read_only, true, `${filename} must be read-only`);
    assert.equal(payload.mutation_endpoints, false, `${filename} cannot advertise mutations`);
  }
});

test("API directory page links only to the declared static projections", async () => {
  const html = await read("api/kaios/aquaculture/v1/index.html");
  for (const filename of API_FILES) assert.match(html, new RegExp(`href="${filename.replace(".", "\\.")}"`));
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/\.\.\/world-viewer\/aquaculture-v1\/"/);
  assert.doesNotMatch(html, /(?:POST|PUT|PATCH|DELETE)\b/);
});

test("fishpond stylesheet carries mobile, tablet, focus and reduced-motion behavior", async () => {
  const css = await read("world-viewer/aquaculture-v1/styles.css");
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*1050px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("browser import rejects oversized simulation files before reading them", async () => {
  const app = await read("world-viewer/aquaculture-v1/app.js");
  assert.match(app, /MAX_IMPORT_BYTES=2000000/);
  assert.match(app, /file\.size>MAX_IMPORT_BYTES/);
  assert.match(app, /2 MB/);
});

test("runtime fails closed at the action limit instead of truncating replay history", async () => {
  const runtime = await read("KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js");
  assert.match(runtime, /ACTION_LOG_LIMIT_REACHED/);
  assert.doesNotMatch(runtime, /action_log\.shift\(\)/);
});
