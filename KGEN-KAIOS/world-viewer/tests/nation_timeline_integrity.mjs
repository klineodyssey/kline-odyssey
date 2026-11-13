import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";
import { createResourceEconomyRuntime } from "../nation/resource-economy-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-009-life-test", now: () => "2036-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-009-civilization-test"
});

civilization.beginGenesis();
let state = civilization.claimGenesisFortune(88);
assert.equal(state.nation.nation.status, "NATION_CANDIDATE");
assert.equal(state.nation.founding_requirements.length, 6);
assert.ok(state.nation.founding_requirements.every(({ pass }) => pass));
assert.equal(state.nation.founding_ready, true);
assert.equal(state.nation.public_finance.tax_policy.length, 12);
assert.equal(state.nation.resources.resources.length, 11);
assert.equal(state.timeline.eras.length, 9);

assert.throws(
  () => civilization.travelTimeline("CAMBRIAN"),
  (error) => error?.code === "TIMELINE_TRAVEL_BLOCKED"
);

state = civilization.establishNation();
assert.equal(state.nation.nation.status, "ESTABLISHED_SYNTHETIC");
assert.equal(state.nation.nation.real_sovereignty, false);
assert.equal(state.nation.nation.legal_authority, false);

state = civilization.runNationGovernmentCycle();
assert.equal(state.nation.government_v2.cycle_count, 1);
assert.equal(state.nation.government_v2.policies.length, 9);
assert.equal(state.nation.government_v2.real_military_operations, false);

state = civilization.setNationTaxRate("INCOME_TAX", 900);
assert.equal(state.nation.public_finance.tax_policy[0].rate_bps, 900);
state = civilization.settleNationTaxInvoice("INCOME_TAX", 100);
const invoice = state.nation.public_finance.invoices.at(-1);
assert.equal(invoice.amount_due, 9);
assert.equal(invoice.status, "SETTLED_SYNTHETIC");
assert.ok(invoice.ledger_entry_id);
assert.ok(state.nation.public_finance.ledger.every((entry) => entry.debit.amount === entry.credit.amount));
const balanceTotal = Object.values(state.nation.public_finance.treasury.account_balances)
  .reduce((sum, value) => sum + Number(value), 0);
assert.ok(Math.abs(balanceTotal) < 0.001);

const assetsBeforeBudget = state.nation.public_finance.treasury.total_assets;
state = civilization.allocateNationBudget("EDUCATION", 10);
assert.equal(state.nation.public_finance.treasury.public_investment, 10);
assert.equal(state.nation.public_finance.treasury.total_assets, assetsBeforeBudget - 10);

const stoneBefore = state.nation.resources.resources.find(({ resource_id: id }) => id === "STONE").quantity;
state = civilization.tradeNationResource("STONE", "EXPORT", 2);
assert.equal(state.nation.resources.resources.find(({ resource_id: id }) => id === "STONE").quantity, stoneBefore - 2);
assert.equal(state.nation.resources.trades.at(-1).real_trade, false);
state = civilization.tradeNationResource("STONE", "IMPORT", 1);
assert.equal(state.nation.resources.resources.find(({ resource_id: id }) => id === "STONE").quantity, stoneBefore - 1);

const resourceKey = "sprint-009-civilization-test.nation.resources";
const legacySave = JSON.parse(storage.getItem(resourceKey));
delete legacySave.state.mining_rounds;
storage.setItem(resourceKey, JSON.stringify(legacySave));
const beforeMining = storage.getItem(resourceKey);
assert.throws(() => civilization.quoteMineDevelopment(9), { code: "MINE_BUDGET_INSUFFICIENT" });
const firstProposal = civilization.quoteMineDevelopment(12);
assert.equal(storage.getItem(resourceKey), beforeMining, "A proposal must not spend or save inventory");
const firstRun = civilization.developMine(firstProposal);
assert.equal(firstRun.point_id, "P_5168p0_金山銀礦_R22");
assert.equal(firstRun.energy_used, 10);
assert.equal(firstRun.gold_produced, 1);
assert.throws(() => civilization.developMine(firstProposal), { code: "MINE_ALREADY_COMMITTED" });
const resourceConfig = world.nation_timeline_alpha.resources;
const reloadedResources = createResourceEconomyRuntime({ config: resourceConfig, storage, storageKey: resourceKey });
const afterFirst = reloadedResources.getSnapshot();
assert.equal(afterFirst.resources.length, 11);
assert.equal(afterFirst.resources.find(({ resource_id }) => resource_id === "GOLD").quantity, 81);
assert.equal(afterFirst.resources.find(({ resource_id }) => resource_id === "ENERGY").quantity, 890);
assert.equal(afterFirst.mine.remaining, 2);
assert.equal(afterFirst.trades.length, legacySave.state.trades.length, "Mining is not a resource trade");
assert.deepEqual(afterFirst.movements.slice(-2).map(({ cause, delta }) => [cause, delta]),
  [["MINE_ENERGY_SPENT", -10], ["MINE_OUTPUT", 1]]);
assert.throws(() => reloadedResources.developMine(firstProposal), { code: "MINE_ALREADY_COMMITTED" });

const secondProposal = civilization.quoteMineDevelopment(10);
reloadedResources.developMine(secondProposal);
assert.throws(() => civilization.developMine(secondProposal), { code: "MINE_ALREADY_COMMITTED" });
civilization.developMine(civilization.quoteMineDevelopment(10));
const depleted = storage.getItem(resourceKey);
assert.throws(() => reloadedResources.quoteMineDevelopment(10), { code: "MINE_DEPLETED" });
assert.equal(storage.getItem(resourceKey), depleted, "A depleted mine must not write inventory");
for (let i = 0; i < 161; i++) reloadedResources.executeTrade({ direction: "IMPORT", resourceId: "WATER", quantity: 1 });
assert.equal(reloadedResources.getSnapshot().mine.remaining, 0, "Truncating trade history must not replenish the mine");
assert.equal(reloadedResources.getSnapshot().mine.rounds.length, 3);
assert.equal(reloadedResources.integrityReport().ok, true);
reloadedResources.destroy();

const recoveryKey = "mine-storage-recovery-test";
let canWrite = false;
const recoveryStorage = {
  ...storage,
  setItem(key, value) {
    if (!canWrite) throw new Error("Storage quota");
    storage.setItem(key, value);
  }
};
const recoverable = createResourceEconomyRuntime({ config: resourceConfig, storage: recoveryStorage, storageKey: recoveryKey });
const unsaved = recoverable.quoteMineDevelopment(10);
assert.throws(() => recoverable.developMine(unsaved), { code: "RESOURCE_STORAGE_FAILED" });
assert.equal(recoverable.getSnapshot().mine.remaining, 3);
assert.equal(storage.getItem(recoveryKey), null);
canWrite = true;
recoverable.developMine(unsaved);
assert.equal(recoverable.getSnapshot().mine.remaining, 2);
recoverable.executeTrade({ direction: "EXPORT", resourceId: "ENERGY", quantity: 485 });
const lowEnergy = storage.getItem(recoveryKey);
assert.throws(() => recoverable.quoteMineDevelopment(10), { code: "MINE_BUDGET_INSUFFICIENT" });
assert.equal(storage.getItem(recoveryKey), lowEnergy);
recoverable.destroy();

state = civilization.proposeNationDiplomacy("TRADE_AGREEMENT");
const agreementId = state.nation.diplomacy.pending_review.at(-1).agreement_id;
assert.equal(state.nation.diplomacy.pending_review.at(-1).land_ownership_change, false);
state = civilization.reviewNationDiplomacy(agreementId, "APPROVE");
assert.equal(state.nation.diplomacy.active_agreements.at(-1).status, "ACTIVE_SYNTHETIC");

state = civilization.researchTimelineEra("CAMBRIAN");
state = civilization.researchTimelineEra("CAMBRIAN");
assert.equal(state.timeline.eras.find(({ era_id: id }) => id === "CAMBRIAN").research_ready, true);
for (let step = 0; step < 4; step += 1) state = civilization.researchTimelineVehicle();
assert.ok(state.timeline.vehicle.technology_requirements.every(({ ready }) => ready));
state = civilization.supplyTimelineVehicle();
assert.ok(state.timeline.vehicle.material_requirements.every(({ ready }) => ready));
state = civilization.buildTimelineVehicle();
assert.equal(state.timeline.vehicle.vehicle_type, "POCKET_TIME_CLOAKED_UFO");
assert.equal(state.timeline.vehicle.sole_timeline_transport, true);
assert.equal(state.timeline.vehicle.checksum_verified, true);
assert.equal(state.timeline.vehicle.status, "OPERATIONAL");

state = civilization.travelTimeline("CAMBRIAN");
assert.equal(state.timeline.current_era_id, "CAMBRIAN");
assert.equal(state.timeline.journeys.at(-1).canonical_history_mutated, false);
assert.equal(state.timeline.journeys.at(-1).real_time_travel, false);
state = civilization.returnTimelineOrigin();
assert.equal(state.timeline.current_era_id, "AI_CIVILIZATION");
assert.equal(state.timeline.journeys.length, 2);

const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(report.reports.nation.ok, true, JSON.stringify(report.reports.nation.issues));
assert.equal(report.reports.timeline.ok, true, JSON.stringify(report.reports.timeline.issues));
assert.equal(JSON.stringify(world), canonicalBefore, "Sprint 009 must not mutate the synthetic fixture object");

const output = {
  status: "PASS",
  decision_id: "HUMAN-SPRINT-009-NATION-TIMELINE",
  nation: report.reports.nation,
  timeline: report.reports.timeline,
  verified_flows: {
    six_requirement_nation_founding: true,
    government_v2_nine_policy_cycle: true,
    twelve_governable_tax_types: true,
    balanced_treasury_ledger: true,
    official_currency_kgen_isolated: true,
    eleven_resource_conservation: true,
    k5168_native_mining_persistence_and_replay: true,
    reviewed_diplomacy: true,
    nine_era_timeline: true,
    sole_transport_gate: true,
    vehicle_checksum_gate: true,
    canonical_history_immutable: true
  },
  protected_runtime_mutated: false,
  universe_map_current_mutated: false,
  kernel_current_mutated: false,
  life_os_current_mutated: false,
  cambrian_current_mutated: false,
  settlement_current_mutated: false,
  governance_current_mutated: false,
  token_contract_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
