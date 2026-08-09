import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (target) => fs.readFileSync(path.join(repo, target), "utf8");

test("Creator Marketplace Viewer exposes required views controls and warnings", () => {
  const html = read("world-viewer/creator-marketplace/index.html");
  for (const label of ["Player Starter Package", "Starter Land", "Essential Needs", "KAIOS Game Credit", "Customer Requests", "Accepted Orders", "Blocked Orders", "Projects", "Tasks", "Workers", "Creators", "Life Listings", "Product Listings", "Escrow", "Payroll", "Deliveries", "Household Consumption", "Company Profit/Loss", "Audit Timeline"]) assert.match(html, new RegExp(label));
  for (const label of ["Create Request", "Fund Project", "Start Project", "Submit Deliverable", "Review", "Accept", "Request Rework", "Reject", "Release Payroll", "Buy Essential Item", "Export", "Import", "Reset", "Replay"]) assert.match(html, new RegExp(label));
  for (const warning of ["SIMULATION ONLY", "KAIOS GAME CREDIT", "NO REAL KGEN", "NO REAL WALLET", "CREDIT DOES NOT REPLACE PHYSICAL RESOURCES"]) assert.match(html, new RegExp(warning));
});

test("official homepage and Full Viewer expose the Creator Marketplace", () => {
  const homepage = read("index.html");
  const canonicalViewer = read("KGEN-KAIOS/world-viewer/index.html");
  const publicViewer = read("world-viewer/index.html");
  assert.match(homepage, /開始 KAIOS 人生與創造市場/);
  assert.match(homepage, /world-viewer\/creator-marketplace\//);
  assert.match(homepage, /api\/kaios\/marketplace\//);
  assert.match(canonicalViewer, /world-viewer\/creator-marketplace\//);
  assert.match(publicViewer, /\.\/creator-marketplace\//);
});

test("Creator Marketplace browser uses local Runtime and bounds imports", () => {
  const app = read("world-viewer/creator-marketplace/app.js");
  assert.match(app, /creator-marketplace-runtime\.js/);
  assert.match(app, /MAX_IMPORT_BYTES/);
  assert.doesNotMatch(app, /fetch\s*\(|XMLHttpRequest|ethereum|privateKey|sendTransaction/);
});

test("canonical and v1 marketplace APIs are static read-only projections", () => {
  const files = ["status.json", "starter-package.json", "requests.json", "projects.json", "tasks.json", "listings.json", "payroll.json", "events.json", "energy-ontology.json"];
  for (const directory of ["api/kaios/marketplace", "api/kaios/marketplace/v1"]) {
    for (const name of files) {
      const value = JSON.parse(read(`${directory}/${name}`));
      assert.ok(value);
      if (name === "status.json") assert.equal(value.mutation_endpoints, false);
    }
  }
  const canonical = JSON.parse(read("api/kaios/marketplace/index.json"));
  const compatibility = JSON.parse(read("api/kaios/marketplace/v1/index.json"));
  assert.equal(canonical.read_only, true);
  assert.equal(canonical.mutation_endpoints, false);
  assert.equal(compatibility.route_status, "LEGACY_ALIAS");
});

test("styles cover responsive focus and reduced-motion states", () => {
  const css = read("world-viewer/creator-marketplace/styles.css");
  assert.match(css, /@media\(max-width:1080px\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:420px\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
