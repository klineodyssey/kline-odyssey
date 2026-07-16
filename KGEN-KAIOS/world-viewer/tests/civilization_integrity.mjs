import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { RESOURCE_CATALOG, MARKETPLACE_CATEGORIES } from "../economy/economy-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-004-life-test", now: () => "2036-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-004-civilization-test"
});

const initial = civilization.getSnapshot();
assert.equal(initial.clock.hour, 6);
assert.equal(initial.citizen.current_activity, "WAKE");
assert.equal(initial.economy.player_balance, 500);
assert.equal(initial.agriculture.plots.length, 3);
assert.equal(RESOURCE_CATALOG.length, 13);
assert.deepEqual(MARKETPLACE_CATEGORIES, [
  "FOOD", "FURNITURE", "TOOLS", "SEEDS", "BUILDING_MATERIALS", "MEDICAL", "ENERGY", "WATER"
]);

const breakfast = civilization.advance(60);
assert.equal(breakfast.clock.hour, 7);
assert.equal(breakfast.citizen.current_activity, "BREAKFAST");
assert.ok(breakfast.economy.player_inventory.RICE < initial.economy.player_inventory.RICE);
assert.ok(breakfast.economy.player_inventory.WATER < initial.economy.player_inventory.WATER);

const work = civilization.advance(60);
assert.equal(work.clock.hour, 8);
assert.equal(work.citizen.current_activity, "WORK");
assert.equal(work.aiWorker.current_action, "FARM");
assert.equal(work.economy.player_balance, 515);

civilization.plant("starter-garden-001", "VEGETABLE");
const grown = civilization.advance(12 * 60);
assert.equal(grown.agriculture.plots.find(({ plot_id }) => plot_id === "starter-garden-001").state, "READY");
civilization.harvest("starter-garden-001");
const harvested = civilization.getSnapshot();
assert.ok(harvested.agriculture.warehouse.VEGETABLE >= 6);
const beforeSale = harvested.economy.player_balance;
civilization.sellHarvest("VEGETABLE", 1);
assert.equal(civilization.getSnapshot().economy.player_balance, beforeSale + 4);

const beforeBuy = civilization.getSnapshot().economy.player_balance;
civilization.buy("listing-rice", 1);
assert.equal(civilization.getSnapshot().economy.player_balance, beforeBuy - 6);

const dayBefore = civilization.getSnapshot().clock.day;
civilization.advance(1440);
assert.equal(civilization.getSnapshot().clock.day, dayBefore + 1);

for (let index = 0; index < 220; index += 1) civilization.advance(60);
const final = civilization.getSnapshot();
const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.ok(final.events.length <= 180);
assert.ok(final.clock.events.length <= 120);
assert.ok(final.citizen.events.length <= 160);
assert.ok(final.aiWorker.events.length <= 160);
assert.ok(final.economy.ledger.length <= 300);
assert.ok(final.agriculture.events.length <= 180);
assert.ok(final.city.history.length <= 120);
assert.equal(final.city.employed + final.city.unemployed, final.city.population);
assert.equal(JSON.stringify(world), canonicalBefore, "Civilization Runtime must not mutate the canonical fixture");

const output = {
  status: "PASS",
  clock: report.reports.clock,
  citizen: report.reports.citizen,
  ai_worker: report.reports.ai_worker,
  economy: report.reports.economy,
  agriculture: report.reports.agriculture,
  city: report.reports.city,
  product_flow: {
    login_fixture: true,
    breakfast_consumed: true,
    work_rewarded: true,
    ai_farmed: true,
    crop_planted: true,
    crop_harvested: true,
    harvest_sold: true,
    market_purchase: true
  },
  memory_bounds: {
    civilization: final.events.length,
    clock: final.clock.events.length,
    citizen: final.citizen.events.length,
    ai_worker: final.aiWorker.events.length,
    economy: final.economy.ledger.length,
    agriculture: final.agriculture.events.length,
    city: final.city.history.length
  },
  protected_runtime_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
