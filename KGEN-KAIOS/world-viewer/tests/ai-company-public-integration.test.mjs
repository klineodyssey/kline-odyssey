import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

const API_FILES = [
  "index.json", "requests.json", "projects.json", "tasks.json",
  "dependencies.json", "materials.json", "workforce.json", "equipment.json",
  "supply-chain.json", "budget.json", "schedule.json", "inspections.json",
  "deliveries.json", "capacity.json", "ledger.json", "events.json",
  "status.json", "cursor-queue.json"
];

test("official homepage exposes AI Company navigation, feature card, API and footer routes", async () => {
  const html = await read("index.html");
  assert.match(html, /id="ai-company-runtime"/);
  assert.match(html, /KAIOS AI 公司創造中心/);
  assert.match(html, /href="\.\/world-viewer\/ai-company-v1\/"/);
  assert.match(html, /href="\.\/api\/kaios\/ai-company\/v1\/"/);
  assert.match(html, /NO EXTERNAL AUTONOMY/);
});

test("full World Viewer exposes the stable AI Company route", async () => {
  const html = await read("KGEN-KAIOS/world-viewer/index.html");
  assert.match(html, /world-viewer\/ai-company-v1\//);
  assert.match(html, /KAIOS AI 公司創造中心/);
});

test("AI Company Viewer has required navigation, views, controls and boundaries", async () => {
  const html = await read("world-viewer/ai-company-v1/index.html");
  const requiredIds = [
    "submit-request", "clarify", "analyze", "feasibility", "proposal", "approve",
    "create-project", "plan-project", "contract", "procure", "start-task",
    "pause-task", "resume-task", "complete-task", "inspect", "rework",
    "change-order", "approve-change-order", "deliver", "accept", "maintenance", "close-project",
    "start", "pause", "resume", "advance", "run-demo", "export", "import",
    "reset", "retry"
  ];
  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `missing control ${id}`);
  }
  for (const marker of [
    "Customer Requests", "Feasibility Gates", "Dependency Graph", "Materials",
    "Workers", "Equipment", "Supply Chain", "Budget", "Schedule", "Procurement",
    "Inspections", "Delivery", "Maintenance", "Company Capacity", "Company Finance",
    "Event Timeline", "Cursor Work Queue"
  ]) assert.match(html, new RegExp(marker));
  assert.match(html, /href="\.\.\/\.\.\/"[^>]*>返回官方首頁/);
  assert.match(html, /NO REAL WALLET/);
  assert.match(html, /NO REAL KGEN/);
  assert.match(html, /NO REAL CONTRACT/);
  assert.match(html, /NO PRODUCTION AUTHORITY/);
  assert.match(html, /NO EXTERNAL AUTONOMY/);
  assert.doesNotMatch(html, /(?:localhost|127\.0\.0\.1|file:\/\/|[A-Za-z]:\\)/i);
  assert.doesNotMatch(html, /(?:href|src)="\//i);
});

test("all eighteen public API projections are valid read-only JSON", async () => {
  for (const filename of API_FILES) {
    const body = await read(`api/kaios/ai-company/v1/${filename}`);
    assert.notEqual(body.charCodeAt(0), 0xfeff, `${filename} has a BOM`);
    const payload = JSON.parse(body);
    assert.equal(payload.simulation_only, true, `${filename} must remain simulation-only`);
    assert.equal(payload.authority, "NO_PRODUCTION_AUTHORITY", `${filename} cannot carry Production authority`);
    assert.equal(payload.read_only, true, `${filename} must be read-only`);
    assert.equal(payload.mutation_endpoints, false, `${filename} cannot advertise mutations`);
    assert.equal(payload.real_wallet, false, `${filename} cannot advertise a real wallet`);
    assert.equal(payload.real_kgen, false, `${filename} cannot advertise real KGEN`);
    assert.equal(payload.external_autonomy, false, `${filename} cannot advertise external autonomy`);
  }
});

test("API directory links only to declared static projections", async () => {
  const html = await read("api/kaios/ai-company/v1/index.html");
  for (const filename of API_FILES) {
    assert.match(html, new RegExp(`href="${filename.replace(".", "\\.")}"`));
  }
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/\.\.\/world-viewer\/ai-company-v1\/"/);
  assert.doesNotMatch(html, /(?:POST|PUT|PATCH|DELETE)\b/);
});

test("AI Company stylesheet carries mobile, tablet, focus and reduced-motion behavior", async () => {
  const css = await read("world-viewer/ai-company-v1/styles.css");
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*1120px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("browser app limits imported state files and uses only the local Runtime", async () => {
  const app = await read("world-viewer/ai-company-v1/app.js");
  assert.match(app, /MAX_IMPORT_BYTES\s*=\s*2000000/);
  assert.match(app, /file\.size\s*>\s*MAX_IMPORT_BYTES/);
  assert.match(app, /ai-company-project-runtime\.js/);
  assert.match(app, /fetch\(QUEUE_URL/);
  assert.match(app, /api\/kaios\/ai-company\/v1\/cursor-queue\.json/);
  assert.doesNotMatch(app, /(?:https?:\/\/|XMLHttpRequest|WebSocket|navigator\.sendBeacon)/);
});
