import test from "node:test";
import assert from "node:assert/strict";

import {
  CFO_ORGAN_METADATA,
  WORKER_INCOME_TYPES,
  createCfoFinanceRuntime,
  createCfoV1SimulationDemo
} from "../core/accounting/index.mjs";

const royaltyPolicy = {
  company_share_bps: 5000,
  creator_share_bps: 2500,
  team_share_bps: 1000,
  reviewer_share_bps: 500,
  maintenance_reserve_bps: 1000
};

function runtime() {
  return createCfoFinanceRuntime({ royalty_policy: royaltyPolicy, clock: () => "2026-10-08T00:00:00Z" });
}

function errorCode(code) {
  return (error) => error?.code === code;
}

test("formal organ metadata fixes one runtime filename and simulation-only authority", () => {
  assert.equal(CFO_ORGAN_METADATA.organ_id, "KAIOS_CFO_FINANCE_ENGINE");
  assert.equal(CFO_ORGAN_METADATA.formal_runtime, "runtime-finance.js");
  assert.equal(CFO_ORGAN_METADATA.version, "V1");
  assert.equal(CFO_ORGAN_METADATA.mode, "SIMULATION_ONLY");
  assert.equal(CFO_ORGAN_METADATA.cfo_digital_life, "NOT_ASSIGNED");
  assert.ok(CFO_ORGAN_METADATA.protected_actions.includes("PAY_SALARY"));
  assert.ok(CFO_ORGAN_METADATA.protected_actions.includes("USE_PRIVATE_KEY"));
});

test("demo produces a balanced P&L, cash flow and balance sheet", () => {
  const demo = createCfoV1SimulationDemo();
  const kaios = demo.daily_report.accounting.KAIOS;
  assert.deepEqual(kaios.profit_and_loss, { revenue: "100000", expense: "60200", profit: "39800" });
  assert.deepEqual(kaios.balance_sheet, {
    assets: "1464800",
    liabilities: "1125000",
    posted_equity: "300000",
    retained_earnings: "39800",
    equity: "339800",
    balanced: true
  });
  assert.equal(demo.daily_report.cash_flow["KAIOS:FINANCING"], "300000");
  assert.equal(demo.daily_report.cash_flow["KAIOS:OPERATING"], "84000");
  assert.equal(demo.daily_report.accounting_balanced, true);
  assert.equal(demo.daily_report.real_financial_execution, false);
  assert.deepEqual(demo.daily_report.project_profitability["PROJECT-GAME-APP-DEMO:KAIOS"], {
    project_id: "PROJECT-GAME-APP-DEMO",
    currency: "KAIOS",
    project_revenue: "100000",
    project_cost: "60000",
    project_profit: "40000",
    project_margin_bps: "4000"
  });
});

test("restricted inventory and matching liability never become revenue", () => {
  const demo = createCfoV1SimulationDemo();
  const kaios = demo.daily_report.accounting.KAIOS;
  assert.equal(kaios.accounts.assets.KAIOS_RESTRICTED_INVENTORY, "1080000");
  assert.equal(kaios.accounts.liabilities.RESTRICTED_CUSTODY_LIABILITY, "1080000");
  assert.equal(kaios.accounts.revenue.GAME_REVENUE, "100000");
  assert.equal(Object.values(kaios.accounts.revenue).includes("1080000"), false);
});

test("cargo principal, restricted inventory and heartbeat reward cannot be posted as revenue", () => {
  for (const source_type of ["CARGO_PRINCIPAL", "RESTRICTED_INVENTORY", "HEARTBEAT_REWARD"]) {
    const engine = runtime();
    engine.registerAccount({ account_id: "CASH", account_type: "ASSET", currency: "KAIOS", classification: "CASH" });
    engine.registerAccount({ account_id: "REV", account_type: "REVENUE", currency: "KAIOS", classification: "GAME_REVENUE" });
    assert.throws(() => engine.recordRevenue({
      entry_id: `E-${source_type}`,
      description: "bad revenue",
      source: "TEST",
      authority: "TEST",
      evidence: { mode: "SIMULATION_ONLY" },
      revenue_type: "GAME_REVENUE",
      source_type,
      amount: "1",
      cash_account_id: "CASH",
      revenue_account_id: "REV"
    }), errorCode("REVENUE_MISCLASSIFICATION"));
  }
});

test("direct journal posting cannot bypass revenue classification", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "CASH", account_type: "ASSET", currency: "KAIOS", classification: "CASH" });
  engine.registerAccount({ account_id: "REV", account_type: "REVENUE", currency: "KAIOS", classification: "GAME_REVENUE" });
  const base = { entry_id: "BYPASS", description: "attempt", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" }, lines: [{ account_id: "CASH", side: "DEBIT", amount: "1" }, { account_id: "REV", side: "CREDIT", amount: "1" }] };
  assert.throws(() => engine.postJournalEntry(base), errorCode("REVENUE_CLASSIFICATION_REQUIRED"));
  assert.throws(() => engine.postJournalEntry({ ...base, revenue_type: "GAME_REVENUE", source_type: "CARGO_PRINCIPAL" }), errorCode("REVENUE_MISCLASSIFICATION"));
  assert.equal(engine.snapshot().journal.length, 0);
});

test("journal rejects imbalance, decimals, cross-currency lines and non-simulation evidence", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "A", account_type: "ASSET", currency: "KAIOS", classification: "CASH" });
  engine.registerAccount({ account_id: "E", account_type: "EQUITY", currency: "KAIOS", classification: "EQUITY" });
  const base = { entry_id: "E1", description: "entry", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" } };
  assert.throws(() => engine.postJournalEntry({ ...base, lines: [{ account_id: "A", side: "DEBIT", amount: "2" }, { account_id: "E", side: "CREDIT", amount: "1" }] }), errorCode("UNBALANCED_ENTRY"));
  assert.throws(() => engine.postJournalEntry({ ...base, lines: [{ account_id: "A", side: "DEBIT", amount: "1.5" }, { account_id: "E", side: "CREDIT", amount: "1.5" }] }), errorCode("INVALID_AMOUNT"));
  assert.throws(() => engine.postJournalEntry({ ...base, lines: [{ account_id: "A", side: "DEBIT", amount: "1", currency: "KGEN" }, { account_id: "E", side: "CREDIT", amount: "1", currency: "KGEN" }] }), errorCode("CURRENCY_MISMATCH"));
  assert.throws(() => engine.postJournalEntry({ ...base, evidence: { mode: "REAL" }, lines: [{ account_id: "A", side: "DEBIT", amount: "1" }, { account_id: "E", side: "CREDIT", amount: "1" }] }), errorCode("REAL_FINANCE_BLOCKED"));
});

test("game distribution is configurable, exact and rejects overspending", () => {
  const engine = runtime();
  const result = engine.calculateGameDistribution({ gross_revenue: "100000", platform_cost: "10000", compute_cost: "5000", operating_cost: "5000", refunds: "0" });
  assert.equal(result.game_net_revenue, "80000");
  assert.deepEqual(result.distribution, { company_share: "40000", creator_share: "20000", team_share: "8000", reviewer_share: "4000", maintenance_reserve: "8000" });
  assert.throws(() => engine.calculateGameDistribution({ gross_revenue: "1", platform_cost: "2", compute_cost: "0", operating_cost: "0", refunds: "0" }), errorCode("NEGATIVE_GAME_NET"));
  assert.throws(() => createCfoFinanceRuntime({ royalty_policy: { ...royaltyPolicy, company_share_bps: 4999 } }), errorCode("INVALID_ROYALTY_POLICY"));
  const noMaintenance = createCfoFinanceRuntime({ royalty_policy: { company_share_bps: 5000, creator_share_bps: 5000, team_share_bps: 0, reviewer_share_bps: 0, maintenance_reserve_bps: 0 } });
  assert.deepEqual(noMaintenance.calculateGameDistribution({ gross_revenue: "1", platform_cost: "0", compute_cost: "0", operating_cost: "0", refunds: "0" }).distribution, {
    company_share: "1", creator_share: "0", team_share: "0", reviewer_share: "0", maintenance_reserve: "0"
  });
});

test("salary, task, creator, freight and heartbeat remain distinct worker income classes", () => {
  const engine = runtime();
  assert.deepEqual(WORKER_INCOME_TYPES, ["SALARY_INCOME", "TASK_COMPENSATION", "CREATOR_ROYALTY", "FREIGHT_REVENUE", "HEARTBEAT_REWARD"]);
  engine.recordWorkerIncome({ worker_id: "W1", income_type: "HEARTBEAT_REWARD", amount: "1", currency: "KGEN", source: "TEST" });
  const records = engine.snapshot().worker_ledger;
  assert.equal(records.find((record) => record.income_type === "HEARTBEAT_REWARD").company_accounting, "EXTERNAL_LIFE_REWARD");
  assert.notEqual(records.find((record) => record.income_type === "HEARTBEAT_REWARD").income_type, "SALARY_INCOME");
  assert.throws(() => engine.recordWorkerIncome({ worker_id: "W1", income_type: "SALARY_INCOME", amount: "1", currency: "KAIOS", source: "TEST" }), errorCode("WORKER_INCOME_EVIDENCE_REQUIRED"));
});

test("compute cost records usage delta and creates a payable rather than fake payment", () => {
  const demo = createCfoV1SimulationDemo();
  const record = demo.daily_report.compute_cost[0];
  assert.equal(record.usage_delta, "2500");
  assert.equal(record.amount, "5000");
  assert.equal(demo.daily_report.accounting.KAIOS.accounts.liabilities.COMPUTE_PAYABLE, "5000");
  assert.equal(demo.daily_report.payables_execution, "NOT_LIVE");
});

test("invalid compute evidence fails before any journal mutation", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "EXP", account_type: "EXPENSE", currency: "KAIOS", classification: "COMPUTE_EXPENSE" });
  engine.registerAccount({ account_id: "PAY", account_type: "LIABILITY", currency: "KAIOS", classification: "COMPUTE_PAYABLE" });
  assert.throws(() => engine.recordComputeCost({
    entry_id: "BAD-COMPUTE", description: "bad", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" },
    work_id: "W1", worker: "", runtime: "R", start_usage: "0", end_usage: "1", duration_seconds: 1,
    task_type: "CODE", deliverable: "D", amount: "1", expense_account_id: "EXP", payable_account_id: "PAY"
  }), errorCode("INVALID_FIELD"));
  assert.equal(engine.snapshot().revision, 0);
  assert.equal(engine.snapshot().journal.length, 0);
  assert.throws(() => engine.recordComputeCost({
    entry_id: "BAD-TIME", occurred_at: "not-a-date", description: "bad", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" },
    work_id: "W1", worker: "W", runtime: "R", start_usage: "0", end_usage: "1", duration_seconds: 1,
    task_type: "CODE", deliverable: "D", amount: "1", expense_account_id: "EXP", payable_account_id: "PAY"
  }), errorCode("INVALID_TIMESTAMP"));
  assert.equal(engine.snapshot().revision, 0);
  assert.equal(engine.snapshot().journal.length, 0);
});

test("worker and project subledgers reconcile journal project, amount, currency and class", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "EXP", account_type: "EXPENSE", currency: "KAIOS", classification: "TASK_COMPENSATION_EXPENSE" });
  engine.registerAccount({ account_id: "PAY", account_type: "LIABILITY", currency: "KAIOS", classification: "TASK_COMPENSATION_PAYABLE" });
  engine.postJournalEntry({ entry_id: "TASK", occurred_at: "2026-10-08T00:00:00Z", description: "task", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" }, project_id: "P1", lines: [{ account_id: "EXP", side: "DEBIT", amount: "1" }, { account_id: "PAY", side: "CREDIT", amount: "1" }] });
  assert.throws(() => engine.recordWorkerIncome({ worker_id: "W1", income_type: "TASK_COMPENSATION", amount: "999999", currency: "USD", source: "TEST", journal_entry_id: "TASK" }), errorCode("WORKER_INCOME_MISMATCH"));
  assert.throws(() => engine.recordProjectEvent({ project_id: "P2", event_type: "PROJECT_COST", amount: "1", currency: "KAIOS", journal_entry_id: "TASK" }), errorCode("PROJECT_EVENT_PROJECT_MISMATCH"));
  assert.throws(() => engine.recordProjectEvent({ project_id: "P1", event_type: "PROJECT_COST", amount: "999999", currency: "USD", journal_entry_id: "TASK" }), errorCode("PROJECT_EVENT_JOURNAL_MISMATCH"));
  assert.equal(engine.recordWorkerIncome({ worker_id: "W1", income_type: "TASK_COMPENSATION", amount: "1", currency: "KAIOS", source: "TEST", journal_entry_id: "TASK" }).amount, "1");
  assert.equal(engine.recordProjectEvent({ project_id: "P1", event_type: "PROJECT_COST", amount: "1", currency: "KAIOS", journal_entry_id: "TASK" }).amount, "1");
});

test("species consumption is allow-listed, evidence-linked and replay protected", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "FOOD", account_type: "ASSET", currency: "KAIOS", classification: "FOOD_INVENTORY" });
  engine.registerAccount({ account_id: "EXP", account_type: "EXPENSE", currency: "KAIOS", classification: "FOOD_EXPENSE" });
  engine.registerAccount({ account_id: "CASH", account_type: "ASSET", currency: "KAIOS", classification: "CASH" });
  engine.postJournalEntry({ entry_id: "BUY", description: "buy", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" }, lines: [{ account_id: "FOOD", side: "DEBIT", amount: "10" }, { account_id: "CASH", side: "CREDIT", amount: "10" }] });
  engine.postJournalEntry({ entry_id: "USE", description: "use", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" }, lines: [{ account_id: "EXP", side: "DEBIT", amount: "1" }, { account_id: "FOOD", side: "CREDIT", amount: "1" }] });
  engine.registerConsumptionProfile({ species_id: "PLANT", consumption_types: ["WATER", "LIGHT"], daily_consumption: "10" });
  assert.throws(() => engine.recordConsumption({ event_id: "C0", entity_id: "P1", species_id: "PLANT", consumption_type: "BEEF", amount: "1", unit: "GRAM", accounting_amount: "1", accounting_currency: "KAIOS", inventory_debit_entry_id: "USE", sink_entry_id: "USE" }), errorCode("CONSUMPTION_TYPE_MISMATCH"));
  assert.throws(() => engine.recordConsumption({ event_id: "C0", entity_id: "P1", species_id: "PLANT", consumption_type: "WATER", amount: "1", unit: "ML", accounting_amount: "1", accounting_currency: "KAIOS" }), errorCode("CONSUMPTION_EVIDENCE_REQUIRED"));
  assert.throws(() => engine.recordConsumption({ event_id: "C0", entity_id: "P1", species_id: "PLANT", consumption_type: "WATER", amount: "1", unit: "ML", accounting_amount: "1", accounting_currency: "KAIOS", inventory_debit_entry_id: "MISSING", sink_entry_id: "MISSING" }), errorCode("CONSUMPTION_EVIDENCE_REQUIRED"));
  assert.throws(() => engine.recordConsumption({ event_id: "C0", entity_id: "P1", species_id: "PLANT", consumption_type: "WATER", amount: "999999", unit: "ML", accounting_amount: "999999", accounting_currency: "USD", inventory_debit_entry_id: "USE", sink_entry_id: "USE" }), errorCode("CONSUMPTION_EVIDENCE_REQUIRED"));
  const accepted = engine.recordConsumption({ event_id: "C1", entity_id: "P1", species_id: "PLANT", consumption_type: "WATER", amount: "1", unit: "ML", accounting_amount: "1", accounting_currency: "KAIOS", inventory_debit_entry_id: "USE", sink_entry_id: "USE" });
  assert.equal(accepted.mode, "SIMULATION_ONLY");
  assert.throws(() => engine.recordConsumption({ event_id: "C1", entity_id: "P1", species_id: "PLANT", consumption_type: "WATER", amount: "1", unit: "ML", accounting_amount: "1", accounting_currency: "KAIOS", inventory_debit_entry_id: "USE", sink_entry_id: "USE" }), errorCode("CONSUMPTION_REPLAY"));
});

test("daily reports include only the requested UTC date", () => {
  const engine = runtime();
  engine.registerAccount({ account_id: "CASH", account_type: "ASSET", currency: "KAIOS", classification: "CASH" });
  engine.registerAccount({ account_id: "REV", account_type: "REVENUE", currency: "KAIOS", classification: "GAME_REVENUE" });
  for (const [entry_id, occurred_at] of [["R7", "2026-10-07T12:00:00Z"], ["R8", "2026-10-08T12:00:00Z"]]) {
    engine.recordRevenue({ entry_id, occurred_at, description: "daily", source: "TEST", authority: "TEST", evidence: { mode: "SIMULATION_ONLY" }, revenue_type: "GAME_REVENUE", source_type: "SIMULATED_ACCEPTED_ORDER", amount: "100", cash_account_id: "CASH", revenue_account_id: "REV" });
  }
  const report = engine.createDailyReport({ report_date: "2026-10-08", currencies: ["KAIOS"] });
  assert.equal(report.accounting.KAIOS.profit_and_loss.revenue, "100");
  assert.equal(report.journal_entries, 1);
});

test("KUFO projection reuses current canonical engine and keeps 12.5 percent after year three", () => {
  const projection = createCfoV1SimulationDemo().kufo_projection;
  assert.ok(Math.abs(projection.remaining_kufo - 0.125) < 1e-12);
  assert.ok(Math.abs(projection.natural_decay_kufo - 0.875) < 1e-12);
  assert.ok(Math.abs(projection.generated_kship - 875) < 1e-9);
  assert.equal(projection.mass_conservation_status, "CONSERVED");
  assert.equal(projection.year_3_settlement_cutoff, "NOT_DEFINED_BY_CURRENT_CANON");
  assert.equal(projection.food_requirement_reduction, "UNKNOWN_NOT_AUTHORIZED");
  assert.equal(projection.accounting_valuation, "UNRESOLVED_NO_PRICE_AUTHORITY");
  assert.equal(projection.deployment_status, "NOT_DEPLOYED");
});

test("KUFO model requires birth proof and canonical time", () => {
  const engine = runtime();
  const batch = { batch_id: "B1", owner: "L1", alchemy_proof: "", birth_timestamp: "2026-01-01T00:00:00Z", birth_block: 0, initial_kufo: 1, propulsion_consumed_kufo: 0 };
  assert.throws(() => engine.projectKufoDecay({ batch, observed_at: "2027-01-01T00:00:00Z" }), /alchemy and block evidence/i);
  assert.throws(() => engine.projectKufoDecay({ batch: { ...batch, alchemy_proof: "E", birth_block: 1 }, observed_at: "2025-01-01T00:00:00Z" }), /canonical time/i);
});

test("demo exposes no transaction, signer, payment or private-key method", () => {
  const methods = Object.keys(runtime());
  for (const forbidden of ["sendTransaction", "transferKgen", "transferKaios", "moveTreasury", "paySalary", "payRoyalty", "sign", "usePrivateKey"]) {
    assert.equal(methods.includes(forbidden), false);
  }
});
