import test from "node:test";
import assert from "node:assert/strict";
import {
  createLifeEnergyPayrollRuntime,
  LIFE_ENERGY_PAYROLL_BOUNDARIES
} from "../economy/life-energy-payroll-runtime.js";

function running() {
  const runtime = createLifeEnergyPayrollRuntime({ seed: "TEST-LIFE-ENERGY-001" });
  runtime.start();
  return runtime;
}

test("boundaries disable real wallet, KGEN, issuance and mutation endpoints", () => {
  assert.deepEqual(LIFE_ENERGY_PAYROLL_BOUNDARIES, {
    simulation_only: true,
    currency: "KAIOS_CREDIT",
    real_wallet: false,
    real_kgen: false,
    on_chain_transfer: false,
    issuance_enabled: false,
    mutation_endpoints: false,
    production_authority: false
  });
});

test("life existence, agency and economic capability are independent", () => {
  const state = running().getState();
  const grass = state.life_model.find(({ life_id }) => life_id === "LIFE-GRASS-DEMO");
  const fish = state.life_model.find(({ life_id }) => life_id === "LIFE-FISH-DEMO");
  assert.equal(grass.life_exists, true);
  assert.equal(grass.economic_capability, "NO_ACCOUNT");
  assert.equal(fish.agency_level, "REACTIVE");
  assert.equal(fish.economic_capability, "NO_ACCOUNT");
});

test("approved candidate-life work releases payroll to AI wallet first", () => {
  const runtime = running();
  runtime.runPayrollDemo();
  const state = runtime.getState();
  assert.equal(state.project.status, "COMPLETED");
  assert.equal(state.accounts["AI-WORKER-WALLET-001"].balance, 80);
  assert.equal(state.accounts["HOUSEHOLD-LEDGER-001"].balance, 10);
  assert.equal(state.payroll_events[0].gross_pay, 120);
  assert.equal(state.payroll_events[0].net_pay, 80);
  const release = state.events.find(({ action }) => action === "PAYROLL_RELEASED");
  assert.equal(state.payroll_events[0].previous_state_hash, release.previous_state_hash);
  assert.equal(state.payroll_events[0].next_state_hash, release.next_state_hash);
  assert.equal(state.payroll_events[0].simulation_only, true);
  assert.deepEqual(state.ledger.slice(0, 2).map(({ reason }) => reason), ["RESERVED_PAYROLL", "GROSS_PAYROLL_RELEASE"]);
  assert.equal(runtime.integrityReport().ok, true);
});

test("physical electricity and compute are consumed by candidate work", () => {
  const runtime = running();
  runtime.runPayrollDemo();
  const resources = runtime.getState().physical_resources;
  assert.equal(resources.electricity_units + resources.electricity_consumed, 100);
  assert.equal(resources.compute_units + resources.compute_consumed, 100);
  assert.equal(resources.electricity_consumed, 8);
  assert.equal(resources.compute_consumed, 12);
});

test("duplicate payroll is blocked without a second transfer", () => {
  const runtime = running();
  runtime.runPayrollDemo();
  const entries = runtime.getState().ledger.length;
  const result = runtime.runPayrollDemo();
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reason, "DUPLICATE_PAYROLL");
  assert.equal(runtime.getState().ledger.length, entries);
});

test("insufficient budget blocks escrow reservation", () => {
  const runtime = running();
  const result = runtime.runPayrollDemo({ projectBudget: 50 });
  assert.equal(result.reason, "INSUFFICIENT_PROJECT_BUDGET");
  assert.equal(runtime.getState().project, null);
  assert.equal(runtime.integrityReport().ok, true);
});

test("rejected task receives no pay and refunds escrow", () => {
  const runtime = running();
  runtime.runPayrollDemo({ outcome: "REJECTED" });
  const state = runtime.getState();
  assert.equal(state.project.status, "REJECTED");
  assert.equal(state.accounts["PROJECT-BUDGET-001"].balance, 1000);
  assert.equal(state.accounts["PROJECT-ESCROW-001"].balance, 0);
  assert.equal(state.accounts["AI-WORKER-WALLET-001"].balance, 0);
});

test("rework holds reserved payroll in escrow", () => {
  const runtime = running();
  runtime.runPayrollDemo({ outcome: "REWORK_REQUIRED" });
  const state = runtime.getState();
  assert.equal(state.project.status, "REWORK_REQUIRED");
  assert.equal(state.accounts["PROJECT-ESCROW-001"].balance, 120);
  assert.equal(state.accounts["AI-WORKER-WALLET-001"].balance, 0);
});

test("missing wallet blocks pay without invalidating worker life", () => {
  const runtime = running();
  const result = runtime.runPayrollDemo({ walletExists: false });
  const state = runtime.getState();
  assert.equal(result.reason, "PAYROLL_BLOCKED_MISSING_WALLET");
  assert.equal(state.worker.life_exists, true);
  assert.equal(state.life_model.find(({ life_id }) => life_id === state.worker.life_id).economic_capability, "NO_ACCOUNT");
  assert.equal(state.accounts["PROJECT-ESCROW-001"].balance, 120);
});

test("inactive worker and time conflict block work", () => {
  const inactive = running();
  assert.equal(inactive.runPayrollDemo({ workerActive: false }).reason, "WORKER_INACTIVE");
  const conflict = running();
  assert.equal(conflict.runPayrollDemo({ timeConflict: true }).reason, "ROLE_TIME_CONFLICT");
});

test("predicted ledger imbalance blocks release before mutation", () => {
  const runtime = running();
  const result = runtime.runPayrollDemo({ forceImbalance: true });
  assert.equal(result.reason, "PAYROLL_BLOCKED_LEDGER_IMBALANCE");
  assert.equal(runtime.integrityReport().ok, true);
});

test("ant credits record work but finite food controls rations", () => {
  const runtime = running();
  runtime.runAntColonyScenario({ foodAvailable: true });
  runtime.runAntColonyScenario({ foodAvailable: false });
  const state = runtime.getState();
  assert.equal(state.colony_ledgers.ant.work_credits["ANT-WORKER-GROUP"], 20);
  assert.equal(state.colony_ledgers.ant.starvation_risk, true);
  assert.equal(state.physical_resources.external_ant_food_mass + state.physical_resources.ant_food_mass + state.physical_resources.ant_consumed_mass, 100);
  assert.equal(runtime.integrityReport().ok, true);
});

test("bee credits cannot replace nectar and honey", () => {
  const runtime = running();
  runtime.runBeeHiveScenario({ nectarAvailable: true });
  runtime.runBeeHiveScenario({ nectarAvailable: false });
  runtime.runBeeHiveScenario({ nectarAvailable: false });
  const state = runtime.getState();
  assert.equal(state.colony_ledgers.bee.work_credits["BEE-WORKER-GROUP"], 28);
  assert.equal(state.colony_ledgers.bee.shortage_risk, true);
  const resources = state.physical_resources;
  assert.equal(resources.meadow_nectar_mass + resources.hive_nectar_mass + resources.hive_honey_mass + resources.hive_processing_byproduct_mass + resources.hive_consumed_mass, 80);
  assert.equal(runtime.integrityReport().ok, true);
});

test("pause, resume and time advancement are causal", () => {
  const runtime = running();
  runtime.advanceTime(3);
  runtime.pause();
  assert.equal(runtime.advanceTime(1).reason, "RUNTIME_NOT_RUNNING");
  runtime.resume();
  runtime.advanceTime(2);
  assert.equal(runtime.getState().simulation_time, 5);
});

test("export and import preserve a valid state", () => {
  const source = running();
  source.runPayrollDemo();
  const target = createLifeEnergyPayrollRuntime();
  target.importState(source.exportState());
  assert.deepEqual(target.getState(), source.getState());
  assert.equal(target.integrityReport().ok, true);
});

test("same seed and actions replay to the same state and event hashes", () => {
  const runtime = running();
  runtime.advanceTime(2);
  runtime.runPayrollDemo();
  runtime.runAntColonyScenario();
  const before = runtime.getState();
  const replayed = runtime.replayEvents();
  assert.equal(replayed.state_hash, before.state_hash);
  assert.deepEqual(replayed.events, before.events);
  for (let index = 1; index < replayed.events.length; index += 1) {
    assert.equal(replayed.events[index].previous_state_hash, replayed.events[index - 1].next_state_hash);
  }
});

test("0–100% demo quota is display-only and cannot mint civilization energy", () => {
  const runtime = running();
  assert.equal(runtime.setDemoQuotaUsedPercent(100).status, "COMPLETED");
  assert.equal(runtime.setDemoQuotaUsedPercent(101).reason, "PERCENT_OUT_OF_RANGE");
  assert.equal(runtime.setDemoQuotaUsedPercent(-1).reason, "PERCENT_OUT_OF_RANGE");
  const civilization = runtime.getState().civilization;
  assert.equal(civilization.demo_quota_used_percent, 100);
  assert.equal(civilization.official_quota_used_percent, null);
  assert.equal(civilization.reward_pool_remaining, 100);
  assert.equal(civilization.company_energy + civilization.ally_energy, 0);
});

test("ally samples debit one finite pool once and receipts survive reset, export and replay", () => {
  const runtime = running();
  runtime.chooseCivilizationFaction("ALLY");
  assert.equal(runtime.submitCivilizationSample("KDNA-DESIGN-001").status, "COMPLETED");
  assert.equal(runtime.submitCivilizationSample("KDNA-DESIGN-001").reason, "DUPLICATE_SAMPLE");
  runtime.submitCivilizationSample("KRNA-CODE-001");
  runtime.submitCivilizationSample("KRNA-QA-001");
  const before = runtime.getState().civilization;
  assert.equal(before.reward_pool_remaining, 40);
  assert.equal(before.company_energy, 24);
  assert.equal(before.ally_energy, 36);
  assert.equal(runtime.integrityReport().ok, true);
  const beforeReplay = runtime.getState();
  runtime.replayEvents();
  assert.equal(runtime.getState().state_hash, beforeReplay.state_hash);
  assert.deepEqual(runtime.getState().civilization, beforeReplay.civilization);
  const restored = createLifeEnergyPayrollRuntime();
  restored.importState(runtime.exportState());
  assert.deepEqual(restored.getState(), runtime.getState());
  const restoredBeforeReplay = restored.getState();
  restored.replayEvents();
  assert.deepEqual(restored.getState(), restoredBeforeReplay);
  runtime.resetState();
  runtime.start();
  assert.equal(runtime.submitCivilizationSample("KDNA-DESIGN-001").reason, "DUPLICATE_SAMPLE");
  assert.equal(runtime.getState().civilization.reward_pool_remaining, 40);
  const prior = runtime.getState();
  runtime.replayEvents();
  assert.deepEqual(runtime.getState().civilization, prior.civilization);
});

test("hostile combat lowers finite monster HP and never pays the civilization pool", () => {
  const runtime = running();
  runtime.chooseCivilizationFaction("HOSTILE");
  assert.equal(runtime.chooseCivilizationFaction("ALLY").reason, "FACTION_ALREADY_LOCKED");
  assert.equal(runtime.submitCivilizationSample("KDNA-DESIGN-001").reason, "ALLY_REQUIRED");
  for (let hit = 0; hit < 6; hit += 1) assert.equal(runtime.fightCompanyMonster().status, "COMPLETED");
  assert.equal(runtime.fightCompanyMonster().reason, "MONSTER_DEFEATED");
  const civilization = runtime.getState().civilization;
  assert.equal(civilization.monster_hp, 0);
  assert.equal(civilization.reward_pool_remaining, 100);
  assert.equal(civilization.company_energy + civilization.ally_energy, 0);
  assert.equal(runtime.integrityReport().ok, true);
});

test("invalid import cannot erase existing receipts or mutate live state", () => {
  const runtime = running();
  runtime.chooseCivilizationFaction("ALLY");
  runtime.submitCivilizationSample("KDNA-DESIGN-001");
  const before = runtime.getState();
  const tampered = JSON.parse(runtime.exportState());
  tampered.state.civilization.reward_pool_remaining = 100;
  assert.throws(() => runtime.importState(tampered), /REWARD_POOL_IMBALANCE/);
  assert.deepEqual(runtime.getState(), before);
  const empty = createLifeEnergyPayrollRuntime().exportState();
  assert.throws(() => runtime.importState(empty), /IMPORT_WOULD_ERASE_CIVILIZATION_RECEIPTS/);
  assert.deepEqual(runtime.getState(), before);
});
