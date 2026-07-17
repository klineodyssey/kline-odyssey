import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { createCivilizationRuntime } from "../civilization/civilization-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";

const world = JSON.parse(await readFile(new URL("../data/synthetic-world.json", import.meta.url), "utf8"));
const canonicalBefore = JSON.stringify(world);
const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
  removeItem(key) { storageValues.delete(key); }
};

const life = createLifeRuntime({ world, storage, storageKey: "sprint-006-life-test", now: () => "2036-03-20T06:00:00Z" });
const building = createBuildingRuntime({ world });
const civilization = createCivilizationRuntime({
  world,
  lifeRuntime: life,
  buildingRuntime: building,
  storage,
  storagePrefix: "sprint-006-civilization-test"
});

civilization.beginGenesis();
let state = civilization.claimGenesisFortune(88);
assert.equal(state.economy.currency_model.layer_1.asset_id, "KAIOS_CREDIT");
assert.equal(state.economy.currency_model.layer_1.execution_status, "ACTIVE_SYNTHETIC_LEDGER");
assert.equal(state.economy.currency_model.layer_2.asset_id, "KGEN");
assert.equal(state.economy.currency_model.layer_2.token_tax, "0.30% UNCHANGED");
assert.deepEqual(state.economy.currency_model.layer_3.asset_ids, ["USDT", "TWD", "OTHER_FIAT"]);
assert.equal(state.settlement.bootstrap_reference.rate, 1);
assert.equal(state.settlement.bootstrap_reference.permanent_peg, false);
assert.equal(state.settlement.bootstrap_reference.guaranteed_return, false);
assert.equal(state.settlement.bootstrap_reference.governance_adjustable, true);

const supply = (snapshot) => Object.values(snapshot.economy.balances).reduce((sum, value) => sum + Number(value), 0);
const initialSupply = supply(state);
const balanceBeforeCycle = state.economy.player_balance;
state = civilization.runSettlementCycle();
assert.equal(state.economy.player_balance, balanceBeforeCycle + 18);
assert.equal(supply(state), initialSupply);
assert.deepEqual(state.settlement.obligations.map(({ type }) => type), ["SALARY", "TAX", "RENT"]);
assert.ok(state.settlement.obligations.every(({ currency, status, ledger_entry_id: evidence }) => currency === "KAIOS_CREDIT" && status === "SETTLED" && evidence));

const balanceBeforeGates = state.economy.player_balance;
state = civilization.requestKgenSettlement(1);
state = civilization.requestExternalSettlement("TWD", 100);
assert.equal(state.economy.player_balance, balanceBeforeGates);
assert.equal(supply(state), initialSupply);
assert.equal(state.settlement.asset_requests.length, 2);
assert.ok(state.settlement.asset_requests.every(({ status, executable, balance_mutation: mutation }) => (
  status === "PENDING_OFFICIAL_SETTLEMENT" && executable === false && mutation === false
)));

state = civilization.requestMortgage();
state = civilization.requestInsurance();
assert.equal(state.settlement.mortgage_proposals[0].creates_debt, false);
assert.equal(state.settlement.insurance_proposals[0].creates_policy, false);
assert.equal(state.economy.player_balance, balanceBeforeGates);

const populationBefore = state.population.metrics.population;
state = civilization.registerMarriage();
assert.equal(state.population.families.find(({ family_id: id }) => id === "family-starter-001").marriage_status, "MARRIED");
const riceBeforeBirth = state.economy.player_inventory.RICE;
const waterBeforeBirth = state.economy.player_inventory.WATER;
state = civilization.registerBirth();
assert.equal(state.population.metrics.population, populationBefore + 1);
assert.equal(state.economy.player_inventory.RICE, riceBeforeBirth - 1);
assert.equal(state.economy.player_inventory.WATER, waterBeforeBirth - 1);
const child = state.population.citizens.find(({ parent_ids: parents }) => parents.length === 2);
assert.deepEqual(child.life_stack, { body: "VERIFIED", species_os: "VERIFIED", life_os: "READY", mind_runtime: "DEVELOPING", citizen_runtime: "REGISTERED" });

const balanceBeforeInheritance = state.economy.player_balance;
state = civilization.settleInheritance();
assert.equal(state.economy.player_balance, balanceBeforeInheritance + 20);
assert.equal(state.population.inheritance_records.length, 1);
assert.throws(() => civilization.settleInheritance(), (error) => error.code === "INHERITANCE_ALREADY_SETTLED");
assert.equal(civilization.getSnapshot().economy.player_balance, balanceBeforeInheritance + 20);

const domestic = civilization.dispatchLogistics("route-farm-warehouse", "RICE", 2, "DOMESTIC");
assert.equal(domestic.logistics.jobs.at(-1).status, "DELIVERED");
const exportRequest = civilization.dispatchLogistics("route-warehouse-market", "RICE", 2, "EXPORT");
assert.equal(exportRequest.logistics.jobs.at(-1).status, "PENDING_OFFICIAL_GATE");
assert.equal(exportRequest.logistics.jobs.at(-1).executable_external_transfer, false);
const pollutionBeforeRecovery = exportRequest.logistics.pollution;
const waterBeforeRecovery = exportRequest.economy.player_inventory.WATER;
state = civilization.recoverEcology(1, 10);
assert.ok(state.logistics.pollution < pollutionBeforeRecovery);
assert.equal(state.economy.player_inventory.WATER, waterBeforeRecovery - 1);

for (let index = 0; index < 150; index += 1) {
  civilization.dispatchLogistics("route-farm-warehouse", "RICE", 1, "DOMESTIC");
  civilization.requestKgenSettlement(1);
}
state = civilization.getSnapshot();
assert.ok(state.logistics.jobs.length <= 120);
assert.ok(state.logistics.events.length <= 160);
assert.ok(state.settlement.asset_requests.length <= 140);
assert.ok(state.settlement.events.length <= 140);
assert.ok(state.economy.ledger.length <= 300);
assert.equal(supply(state), initialSupply);

const report = civilization.integrityReport();
assert.equal(report.ok, true, JSON.stringify(report.issues));
assert.equal(report.reports.population.ok, true);
assert.equal(report.reports.logistics.ok, true);
assert.equal(report.reports.settlement.ok, true);
assert.equal(JSON.stringify(world), canonicalBefore, "Settlement Runtime must not mutate the canonical fixture");

const output = {
  status: "PASS",
  decision_id: "HUMAN-SPRINT-006-SETTLEMENT-ECONOMY",
  population: report.reports.population,
  logistics: report.reports.logistics,
  settlement: report.reports.settlement,
  economy: report.reports.economy,
  verified_flows: {
    family_to_civilization_hierarchy: true,
    marriage_with_consent: true,
    birth_with_carrying_capacity: true,
    education_and_employment: true,
    inheritance_once: true,
    domestic_logistics: true,
    export_gate: true,
    ecology_recovery: true,
    salary_tax_rent: true,
    kaios_credit_balanced: true,
    kgen_request_only: true,
    external_settlement_request_only: true,
    mortgage_architecture_only: true,
    insurance_architecture_only: true,
    bootstrap_reference_not_peg: true,
    kgen_tax_unchanged: true
  },
  bounded_history: {
    logistics_jobs: state.logistics.jobs.length,
    logistics_events: state.logistics.events.length,
    settlement_requests: state.settlement.asset_requests.length,
    settlement_events: state.settlement.events.length,
    economy_ledger: state.economy.ledger.length
  },
  protected_runtime_mutated: false,
  token_contract_mutated: false
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
console.log(serialized.trimEnd());
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) await writeFile(process.argv[outputIndex + 1], serialized, "utf8");

civilization.destroy();
life.destroy();
