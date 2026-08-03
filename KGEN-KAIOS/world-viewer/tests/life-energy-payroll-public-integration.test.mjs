import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const API_FILES = ["status.json", "life-model.json", "payroll-demo.json", "colony-ant.json", "colony-bee.json", "events.json"];
const read = (path) => fs.readFile(path, "utf8");

test("World Viewer exposes all required life-energy views and controls", async () => {
  const html = await read("world-viewer/life-energy-payroll/index.html");
  for (const label of ["Life Existence", "Agency Level", "Economic Capability", "KAIOS Credit", "Physical Resources", "AI Worker Wallet", "Project Escrow", "Payroll Events", "Household Transfers", "Ant Colony Ledger", "Bee Hive Ledger", "Audit Timeline"]) assert.match(html, new RegExp(label));
  for (const id of ["start", "pause", "resume", "advance", "payroll", "rejected", "duplicate", "ant", "bee", "replay", "export", "import", "reset", "retry"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /SIMULATION ONLY/);
  assert.match(html, /NO REAL KGEN/);
  assert.match(html, /NO REAL WALLET/);
  assert.match(html, /CREDIT DOES NOT REPLACE FOOD OR ENERGY/);
});

test("browser application imports only the local canonical runtime and bounds imports", async () => {
  const app = await read("world-viewer/life-energy-payroll/app.js");
  assert.match(app, /life-energy-payroll-runtime\.js/);
  assert.match(app, /MAX_IMPORT_BYTES\s*=\s*2_000_000/);
  assert.match(app, /file\.size\s*>\s*MAX_IMPORT_BYTES/);
  assert.doesNotMatch(app, /(?:https?:\/\/|WebSocket|XMLHttpRequest|sendBeacon)/);
});

test("canonical and v0 compatibility APIs are static read-only projections", async () => {
  for (const filename of API_FILES) {
    const canonical = JSON.parse(await read(`api/kaios/economy/${filename}`));
    const compatibility = JSON.parse(await read(`api/kaios/economy/v0/${filename}`));
    assert.equal(canonical.route_status, "CANONICAL_UNVERSIONED_ROUTE");
    assert.equal(compatibility.route_status, "LEGACY_ALIAS");
    assert.equal(compatibility.canonical_route, `/api/kaios/economy/${filename}`);
  }
  const status = JSON.parse(await read("api/kaios/economy/status.json"));
  assert.equal(status.boundaries.real_wallet, false);
  assert.equal(status.boundaries.real_kgen, false);
  assert.equal(status.boundaries.issuance_enabled, false);
  assert.equal(status.mutation_endpoints, false);
});

test("public payroll projection is balanced and credits the AI wallet first", async () => {
  const payroll = JSON.parse(await read("api/kaios/economy/payroll-demo.json"));
  assert.equal(payroll.integrity.ok, true);
  assert.equal(payroll.project.status, "COMPLETED");
  assert.equal(payroll.payroll_events[0].net_pay, 80);
  assert.deepEqual(payroll.ledger.slice(0, 2).map(({ reason }) => reason), ["RESERVED_PAYROLL", "GROSS_PAYROLL_RELEASE"]);
  assert.ok(payroll.ledger.every(({ balanced }) => balanced));
});

test("public colony projections preserve mass and expose shortage despite credit", async () => {
  const ant = JSON.parse(await read("api/kaios/economy/colony-ant.json"));
  assert.equal(ant.colony.starvation_risk, true);
  assert.ok(ant.colony.work_credits["ANT-WORKER-GROUP"] > 0);
  assert.equal(ant.physical_resources.external_food_mass + ant.physical_resources.colony_food_mass + ant.physical_resources.consumed_mass, 100);

  const bee = JSON.parse(await read("api/kaios/economy/colony-bee.json"));
  assert.equal(bee.colony.shortage_risk, true);
  assert.ok(bee.colony.work_credits["BEE-WORKER-GROUP"] > 0);
  assert.equal(bee.physical_resources.meadow_nectar_mass + bee.physical_resources.hive_nectar_mass + bee.physical_resources.honey_mass + bee.physical_resources.byproduct_mass + bee.physical_resources.consumed_mass, 80);
});

test("styles include desktop, tablet, mobile, focus and reduced-motion behavior", async () => {
  const css = await read("world-viewer/life-energy-payroll/styles.css");
  assert.match(css, /@media\(max-width:1050px\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
