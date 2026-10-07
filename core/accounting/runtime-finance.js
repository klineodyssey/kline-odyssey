import { calculateKufoFuelState, HEAVEN_TIME_LAW, KUFO_FUEL_LAW } from "../company/index.mjs";

const ORGAN_ID = "KAIOS_CFO_FINANCE_ENGINE";
const VERSION = "V1";
const MODE = "SIMULATION_ONLY";
const AMOUNT = /^(0|[1-9]\d*)$/;

export const ACCOUNT_TYPES = Object.freeze(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
export const REVENUE_TYPES = Object.freeze([
  "CUSTOMER_REVENUE", "GAME_REVENUE", "123_POINT_GAME_REVENUE", "FREIGHT_REVENUE",
  "SERVICE_REVENUE", "APP_REVENUE", "LICENSING_REVENUE", "OTHER_VERIFIED_REVENUE"
]);
export const EXPENSE_TYPES = Object.freeze([
  "COMPUTE_EXPENSE", "SUBSCRIPTION_EXPENSE", "PAYROLL_EXPENSE", "TASK_COMPENSATION_EXPENSE",
  "CREATOR_ROYALTY_EXPENSE", "FOOD_EXPENSE", "ENERGY_EXPENSE", "MAINTENANCE_EXPENSE",
  "TRANSPORT_EXPENSE", "INFRASTRUCTURE_EXPENSE", "CUSTOMER_DELIVERY_COST", "OTHER_VERIFIED_EXPENSE"
]);
export const WORKER_INCOME_TYPES = Object.freeze([
  "SALARY_INCOME", "TASK_COMPENSATION", "CREATOR_ROYALTY", "FREIGHT_REVENUE", "HEARTBEAT_REWARD"
]);
export const FORBIDDEN_REVENUE_SOURCES = Object.freeze([
  "CARGO_PRINCIPAL", "RESTRICTED_INVENTORY", "HEARTBEAT_REWARD", "DRAFT_QUOTE",
  "UNACCEPTED_ORDER", "SIMULATION_RECEIPT"
]);

export const CFO_ORGAN_METADATA = Object.freeze({
  organ_id: ORGAN_ID,
  organ_name: "KAIOS CFO Finance Engine",
  formal_runtime: "runtime-finance.js",
  version: VERSION,
  mode: MODE,
  source_of_truth: "core/accounting",
  policy_owner: "Hengyao / General Manager",
  cfo_digital_life: "NOT_ASSIGNED",
  protected_actions: Object.freeze([
    "SEND_TRANSACTION", "TRANSFER_KGEN", "TRANSFER_KAIOS", "MOVE_TREASURY", "PAY_SALARY",
    "PAY_ROYALTY", "BUY_ASSET", "SIGN", "USE_PRIVATE_KEY"
  ])
});

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") fail("INVALID_FIELD", `${field} must be a non-empty string`);
  return value.trim();
}

function amount(value, field = "amount", allowZero = false) {
  const normalized = typeof value === "bigint" ? value.toString() : String(value ?? "");
  if (!AMOUNT.test(normalized) || (!allowZero && normalized === "0")) {
    fail("INVALID_AMOUNT", `${field} must be a ${allowZero ? "non-negative" : "positive"} integer string`);
  }
  return BigInt(normalized);
}

function timestamp(value, field = "timestamp") {
  const normalized = text(value, field);
  if (Number.isNaN(Date.parse(normalized))) fail("INVALID_TIMESTAMP", `${field} must be ISO-8601 compatible`);
  return new Date(normalized).toISOString();
}

function add(map, key, value) {
  map.set(key, (map.get(key) ?? 0n) + value);
}

function objectFromBigInts(map) {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, value.toString()]));
}

function royaltyPolicy(policy) {
  const fields = ["company_share_bps", "creator_share_bps", "team_share_bps", "reviewer_share_bps", "maintenance_reserve_bps"];
  const values = fields.map((field) => Number(policy?.[field]));
  if (values.some((value) => !Number.isInteger(value) || value < 0) || values.reduce((sum, value) => sum + value, 0) !== 10_000) {
    fail("INVALID_ROYALTY_POLICY", "Royalty policy must allocate exactly 10,000 non-negative integer basis points");
  }
  return Object.freeze(Object.fromEntries(fields.map((field, index) => [field, values[index]])));
}

function distribute(total, policy) {
  const base = amount(total, "distributable_amount", true);
  const targets = [
    ["company_share", "company_share_bps"], ["creator_share", "creator_share_bps"],
    ["team_share", "team_share_bps"], ["reviewer_share", "reviewer_share_bps"],
    ["maintenance_reserve", "maintenance_reserve_bps"]
  ];
  let allocated = 0n;
  const result = {};
  targets.forEach(([name, bps], index) => {
    const share = index === targets.length - 1 ? base - allocated : base * BigInt(policy[bps]) / 10_000n;
    result[name] = share.toString();
    allocated += share;
  });
  return Object.freeze(result);
}

export function createCfoFinanceRuntime({ royalty_policy, clock = () => new Date().toISOString() } = {}) {
  const policy = royaltyPolicy(royalty_policy);
  const accounts = new Map();
  const journal = [];
  const workers = [];
  const projects = [];
  const consumption = [];
  const compute = [];
  const profiles = new Map();
  let revision = 0;

  function registerAccount({ account_id, account_type, currency, classification, restricted = false }) {
    const id = text(account_id, "account_id");
    if (accounts.has(id)) fail("DUPLICATE_ACCOUNT", `Account ${id} already exists`);
    if (!ACCOUNT_TYPES.includes(account_type)) fail("INVALID_ACCOUNT_TYPE", `Unsupported account type ${account_type}`);
    const record = Object.freeze({
      account_id: id,
      account_type,
      currency: text(currency, "currency"),
      classification: text(classification, "classification"),
      restricted: restricted === true
    });
    accounts.set(id, record);
    return record;
  }

  function postJournalEntry({ entry_id, occurred_at, description, source, authority, evidence, project_id = null, cash_flow_type = "NON_CASH", lines }) {
    const id = text(entry_id, "entry_id");
    if (journal.some((entry) => entry.entry_id === id)) fail("DUPLICATE_ENTRY", `Journal entry ${id} already exists`);
    if (!Array.isArray(lines) || lines.length < 2) fail("INVALID_JOURNAL_ENTRY", "Journal entry requires at least two lines");
    if (evidence?.mode !== MODE) fail("REAL_FINANCE_BLOCKED", "V1 accepts SIMULATION_ONLY evidence only");
    const totals = new Map();
    const normalizedLines = lines.map((line, index) => {
      const account = accounts.get(text(line.account_id, `lines[${index}].account_id`));
      if (!account) fail("UNKNOWN_ACCOUNT", `Unknown account ${line.account_id}`);
      if (!(["DEBIT", "CREDIT"].includes(line.side))) fail("INVALID_SIDE", `Invalid journal side ${line.side}`);
      const lineAmount = amount(line.amount, `lines[${index}].amount`);
      const currency = line.currency ?? account.currency;
      if (currency !== account.currency) fail("CURRENCY_MISMATCH", `${account.account_id} requires ${account.currency}`);
      add(totals, `${currency}:${line.side}`, lineAmount);
      return Object.freeze({ account_id: account.account_id, side: line.side, amount: lineAmount.toString(), currency });
    });
    for (const currency of new Set(normalizedLines.map((line) => line.currency))) {
      if ((totals.get(`${currency}:DEBIT`) ?? 0n) !== (totals.get(`${currency}:CREDIT`) ?? 0n)) {
        fail("UNBALANCED_ENTRY", `Journal entry ${id} is not balanced for ${currency}`);
      }
    }
    revision += 1;
    const record = Object.freeze({
      entry_id: id,
      revision,
      occurred_at: timestamp(occurred_at ?? clock()),
      description: text(description, "description"),
      source: text(source, "source"),
      authority: text(authority, "authority"),
      evidence: Object.freeze({ ...evidence, mode: MODE }),
      project_id,
      cash_flow_type,
      lines: Object.freeze(normalizedLines)
    });
    journal.push(record);
    return record;
  }

  function recordRevenue({ revenue_type, source_type, amount: value, cash_account_id, revenue_account_id, ...entry }) {
    if (!REVENUE_TYPES.includes(revenue_type)) fail("INVALID_REVENUE_TYPE", `Unsupported revenue type ${revenue_type}`);
    if (FORBIDDEN_REVENUE_SOURCES.includes(source_type)) fail("REVENUE_MISCLASSIFICATION", `${source_type} cannot be company revenue`);
    return postJournalEntry({
      ...entry,
      description: entry.description ?? revenue_type,
      cash_flow_type: "OPERATING",
      lines: [
        { account_id: cash_account_id, side: "DEBIT", amount: value },
        { account_id: revenue_account_id, side: "CREDIT", amount: value }
      ]
    });
  }

  function recordComputeCost({ work_id, worker, runtime, start_usage, end_usage, duration_seconds, task_type, deliverable, rework = false, blocked_seconds = 0, amount: value, expense_account_id, payable_account_id, ...entry }) {
    const start = amount(start_usage, "start_usage", true);
    const end = amount(end_usage, "end_usage", true);
    if (end < start) fail("INVALID_USAGE_RANGE", "end_usage must not be below start_usage");
    const posted = postJournalEntry({
      ...entry,
      description: entry.description ?? `Compute cost for ${work_id}`,
      lines: [
        { account_id: expense_account_id, side: "DEBIT", amount: value },
        { account_id: payable_account_id, side: "CREDIT", amount: value }
      ]
    });
    const record = Object.freeze({
      work_id: text(work_id, "work_id"), worker: text(worker, "worker"), runtime: text(runtime, "runtime"),
      start_usage: start.toString(), end_usage: end.toString(), usage_delta: (end - start).toString(),
      duration_seconds: Number(duration_seconds), task_type: text(task_type, "task_type"), deliverable: text(deliverable, "deliverable"),
      rework: rework === true, blocked_seconds: Number(blocked_seconds), amount: amount(value).toString(), journal_entry_id: posted.entry_id
    });
    compute.push(record);
    return record;
  }

  function recordWorkerIncome({ worker_id, income_type, amount: value, currency, source, journal_entry_id = null }) {
    if (!WORKER_INCOME_TYPES.includes(income_type)) fail("INVALID_WORKER_INCOME_TYPE", `Unsupported worker income type ${income_type}`);
    const record = Object.freeze({
      worker_id: text(worker_id, "worker_id"), income_type, amount: amount(value).toString(), currency: text(currency, "currency"),
      source: text(source, "source"), journal_entry_id,
      company_accounting: income_type === "HEARTBEAT_REWARD" ? "EXTERNAL_LIFE_REWARD" : "COMPENSATION_OR_SERVICE"
    });
    workers.push(record);
    return record;
  }

  function calculateGameDistribution({ gross_revenue, platform_cost, compute_cost, operating_cost, refunds }) {
    const gross = amount(gross_revenue, "gross_revenue");
    const deductions = [platform_cost, compute_cost, operating_cost, refunds].map((value, index) => amount(value, `deduction_${index}`, true));
    const deductionTotal = deductions.reduce((sum, value) => sum + value, 0n);
    if (deductionTotal > gross) fail("NEGATIVE_GAME_NET", "Game costs and refunds exceed gross revenue");
    const net = gross - deductionTotal;
    return Object.freeze({
      gross_revenue: gross.toString(), platform_cost: deductions[0].toString(), compute_cost: deductions[1].toString(),
      operating_cost: deductions[2].toString(), refunds: deductions[3].toString(), game_net_revenue: net.toString(),
      policy, distribution: distribute(net, policy)
    });
  }

  function recordProjectEvent({ project_id, event_type, amount: value, currency, journal_entry_id = null }) {
    const record = Object.freeze({
      project_id: text(project_id, "project_id"), event_type: text(event_type, "event_type"),
      amount: amount(value, "amount", true).toString(), currency: text(currency, "currency"), journal_entry_id
    });
    projects.push(record);
    return record;
  }

  function registerConsumptionProfile({ species_id, consumption_types, daily_consumption, energy_consumption = "0", maintenance = [], health_effect = "UNKNOWN", starvation_threshold = "UNKNOWN", lifespan_effect = "UNKNOWN", kufo_effect = "UNKNOWN" }) {
    const id = text(species_id, "species_id");
    if (!Array.isArray(consumption_types) || consumption_types.length === 0) fail("INVALID_CONSUMPTION_PROFILE", "consumption_types cannot be empty");
    const record = Object.freeze({
      species_id: id,
      consumption_types: Object.freeze([...new Set(consumption_types.map((value) => text(value, "consumption_type")))]),
      daily_consumption: amount(daily_consumption, "daily_consumption", true).toString(),
      energy_consumption: amount(energy_consumption, "energy_consumption", true).toString(),
      maintenance: Object.freeze([...maintenance]), health_effect, starvation_threshold, lifespan_effect, kufo_effect,
      evidence_status: "SIMULATION_PROFILE"
    });
    profiles.set(id, record);
    return record;
  }

  function recordConsumption({ event_id, entity_id, species_id, consumption_type, amount: value, unit, inventory_debit_entry_id, sink_entry_id }) {
    if (consumption.some((item) => item.event_id === event_id)) fail("CONSUMPTION_REPLAY", `Duplicate consumption event ${event_id}`);
    const profile = profiles.get(species_id);
    if (!profile) fail("UNKNOWN_CONSUMPTION_PROFILE", `No consumption profile for ${species_id}`);
    if (!profile.consumption_types.includes(consumption_type)) fail("CONSUMPTION_TYPE_MISMATCH", `${species_id} cannot consume ${consumption_type}`);
    if (!inventory_debit_entry_id || !sink_entry_id) fail("CONSUMPTION_EVIDENCE_REQUIRED", "Consumption requires inventory debit and sink evidence");
    const record = Object.freeze({
      event_id: text(event_id, "event_id"), entity_id: text(entity_id, "entity_id"), species_id, consumption_type,
      amount: amount(value).toString(), unit: text(unit, "unit"), inventory_debit_entry_id, sink_entry_id,
      mode: MODE
    });
    consumption.push(record);
    return record;
  }

  function projectKufoDecay({ batch, observed_at }) {
    const result = calculateKufoFuelState(batch, observed_at);
    return Object.freeze({
      ...result,
      current_canon_half_life: HEAVEN_TIME_LAW.kufo_half_life_k280_years,
      kship_per_kufo_scale: KUFO_FUEL_LAW.kship_per_kufo_scale,
      settlement_cutoff_policy_ref: null,
      year_3_settlement_cutoff: "NOT_DEFINED_BY_CURRENT_CANON",
      food_requirement_reduction: "UNKNOWN_NOT_AUTHORIZED",
      lifespan_extension: "UNKNOWN_NOT_AUTHORIZED",
      deployment_status: "NOT_DEPLOYED",
      accounting_valuation: "UNRESOLVED_NO_PRICE_AUTHORITY",
      mode: "READ_ONLY_MODEL"
    });
  }

  function balances() {
    const result = new Map();
    for (const entry of journal) {
      for (const line of entry.lines) add(result, `${line.currency}:${line.account_id}`, line.side === "DEBIT" ? BigInt(line.amount) : -BigInt(line.amount));
    }
    return result;
  }

  function reportCurrency(currency) {
    const raw = balances();
    const sections = { assets: new Map(), liabilities: new Map(), posted_equity: new Map(), revenue: new Map(), expense: new Map() };
    const sectionByType = { ASSET: "assets", LIABILITY: "liabilities", EQUITY: "posted_equity", REVENUE: "revenue", EXPENSE: "expense" };
    for (const account of accounts.values()) {
      if (account.currency !== currency) continue;
      const value = raw.get(`${currency}:${account.account_id}`) ?? 0n;
      sections[sectionByType[account.account_type]].set(account.account_id, ["ASSET", "EXPENSE"].includes(account.account_type) ? value : -value);
    }
    const sum = (map) => [...map.values()].reduce((total, value) => total + value, 0n);
    const assets = sum(sections.assets);
    const liabilities = sum(sections.liabilities);
    const postedEquity = sum(sections.posted_equity);
    const revenue = sum(sections.revenue);
    const expense = sum(sections.expense);
    const profit = revenue - expense;
    const equity = postedEquity + profit;
    return Object.freeze({
      currency,
      profit_and_loss: Object.freeze({ revenue: revenue.toString(), expense: expense.toString(), profit: profit.toString() }),
      balance_sheet: Object.freeze({ assets: assets.toString(), liabilities: liabilities.toString(), posted_equity: postedEquity.toString(), retained_earnings: profit.toString(), equity: equity.toString(), balanced: assets === liabilities + equity }),
      accounts: Object.freeze({ assets: objectFromBigInts(sections.assets), liabilities: objectFromBigInts(sections.liabilities), equity: objectFromBigInts(sections.posted_equity), revenue: objectFromBigInts(sections.revenue), expense: objectFromBigInts(sections.expense) })
    });
  }

  function createDailyReport({ report_date, currencies }) {
    const selected = currencies ?? [...new Set([...accounts.values()].map((account) => account.currency))].sort();
    const accounting = Object.fromEntries(selected.map((currency) => [currency, reportCurrency(currency)]));
    const cashFlow = new Map();
    for (const entry of journal) {
      if (entry.cash_flow_type === "NON_CASH") continue;
      for (const line of entry.lines) {
        if (accounts.get(line.account_id)?.classification === "CASH") add(cashFlow, `${line.currency}:${entry.cash_flow_type}`, line.side === "DEBIT" ? BigInt(line.amount) : -BigInt(line.amount));
      }
    }
    const workerIncome = new Map();
    for (const record of workers) add(workerIncome, `${record.worker_id}:${record.currency}:${record.income_type}`, BigInt(record.amount));
    const projectTotals = new Map();
    for (const entry of journal) {
      if (!entry.project_id) continue;
      for (const line of entry.lines) {
        const account = accounts.get(line.account_id);
        if (!(["REVENUE", "EXPENSE"].includes(account.account_type))) continue;
        const key = `${entry.project_id}:${line.currency}`;
        const totals = projectTotals.get(key) ?? { project_id: entry.project_id, currency: line.currency, revenue: 0n, cost: 0n };
        if (account.account_type === "REVENUE" && line.side === "CREDIT") totals.revenue += BigInt(line.amount);
        if (account.account_type === "EXPENSE" && line.side === "DEBIT") totals.cost += BigInt(line.amount);
        projectTotals.set(key, totals);
      }
    }
    const projectProfitability = Object.fromEntries([...projectTotals.entries()].map(([key, value]) => {
      const profit = value.revenue - value.cost;
      return [key, Object.freeze({
        project_id: value.project_id,
        currency: value.currency,
        project_revenue: value.revenue.toString(),
        project_cost: value.cost.toString(),
        project_profit: profit.toString(),
        project_margin_bps: value.revenue === 0n ? null : (profit * 10_000n / value.revenue).toString()
      })];
    }));
    return Object.freeze({
      organ_id: ORGAN_ID, version: VERSION, mode: MODE, report_type: "DAILY_REPORT", report_date: text(report_date, "report_date"),
      accounting: Object.freeze(accounting), cash_flow: Object.freeze(objectFromBigInts(cashFlow)),
      worker_income: Object.freeze(objectFromBigInts(workerIncome)), project_ledger: Object.freeze([...projects]),
      project_profitability: Object.freeze(projectProfitability),
      compute_cost: Object.freeze([...compute]), consumption: Object.freeze([...consumption]),
      payables_execution: "NOT_LIVE", real_financial_execution: false, journal_entries: journal.length,
      accounting_balanced: Object.values(accounting).every((report) => report.balance_sheet.balanced)
    });
  }

  function snapshot() {
    return Object.freeze({ metadata: CFO_ORGAN_METADATA, revision, accounts: Object.freeze([...accounts.values()]), journal: Object.freeze([...journal]), worker_ledger: Object.freeze([...workers]), project_ledger: Object.freeze([...projects]), consumption_ledger: Object.freeze([...consumption]), compute_ledger: Object.freeze([...compute]), royalty_policy: policy });
  }

  return Object.freeze({ registerAccount, postJournalEntry, recordRevenue, recordComputeCost, recordWorkerIncome, calculateGameDistribution, recordProjectEvent, registerConsumptionProfile, recordConsumption, projectKufoDecay, createDailyReport, snapshot });
}

export function createCfoV1SimulationDemo() {
  const runtime = createCfoFinanceRuntime({ royalty_policy: { company_share_bps: 5000, creator_share_bps: 2500, team_share_bps: 1000, reviewer_share_bps: 500, maintenance_reserve_bps: 1000 }, clock: () => "2026-10-08T00:00:00.000Z" });
  const definitions = [
    ["SIM_CASH", "ASSET", "KAIOS", "CASH"], ["KGEN_INVENTORY", "ASSET", "KGEN", "INVENTORY"],
    ["KAIOS_RESTRICTED_INVENTORY", "ASSET", "KAIOS", "RESTRICTED_INVENTORY", true], ["FOOD_INVENTORY", "ASSET", "KAIOS", "FOOD_INVENTORY"],
    ["RESTRICTED_CUSTODY_LIABILITY", "LIABILITY", "KAIOS", "RESTRICTED_INVENTORY_LIABILITY", true], ["COMPUTE_PAYABLE", "LIABILITY", "KAIOS", "COMPUTE_PAYABLE"],
    ["ROYALTY_PAYABLE", "LIABILITY", "KAIOS", "ROYALTY_PAYABLE"], ["TASK_COMPENSATION_PAYABLE", "LIABILITY", "KAIOS", "TASK_COMPENSATION_PAYABLE"],
    ["MAINTENANCE_RESERVE", "LIABILITY", "KAIOS", "MAINTENANCE_RESERVE", true], ["OWNER_EQUITY", "EQUITY", "KAIOS", "OWNER_EQUITY"],
    ["GAME_REVENUE", "REVENUE", "KAIOS", "GAME_REVENUE"], ["PLATFORM_COST", "EXPENSE", "KAIOS", "OTHER_VERIFIED_EXPENSE"],
    ["COMPUTE_EXPENSE", "EXPENSE", "KAIOS", "COMPUTE_EXPENSE"], ["INFRASTRUCTURE_EXPENSE", "EXPENSE", "KAIOS", "INFRASTRUCTURE_EXPENSE"],
    ["CREATOR_ROYALTY_EXPENSE", "EXPENSE", "KAIOS", "CREATOR_ROYALTY_EXPENSE"], ["TASK_COMPENSATION_EXPENSE", "EXPENSE", "KAIOS", "TASK_COMPENSATION_EXPENSE"],
    ["MAINTENANCE_EXPENSE", "EXPENSE", "KAIOS", "MAINTENANCE_EXPENSE"], ["FOOD_EXPENSE", "EXPENSE", "KAIOS", "FOOD_EXPENSE"]
  ];
  definitions.forEach(([account_id, account_type, currency, classification, restricted]) => runtime.registerAccount({ account_id, account_type, currency, classification, restricted }));
  const common = { occurred_at: "2026-10-08T00:00:00Z", source: "CFO_V1_SIMULATION_DEMO", authority: "KAIOS_CFO_FINANCE_ORGAN_MANUFACTURING_ORDER_V1", evidence: { mode: MODE, status: "SIMULATED", evidence_id: "CFO-V1-DEMO" } };
  runtime.postJournalEntry({ ...common, entry_id: "DEMO-CAPITAL", description: "Simulated opening capital", cash_flow_type: "FINANCING", lines: [{ account_id: "SIM_CASH", side: "DEBIT", amount: "300000" }, { account_id: "OWNER_EQUITY", side: "CREDIT", amount: "300000" }] });
  runtime.postJournalEntry({ ...common, entry_id: "DEMO-RESTRICTED-INVENTORY", description: "Restricted KAIOS inventory with matching liability", lines: [{ account_id: "KAIOS_RESTRICTED_INVENTORY", side: "DEBIT", amount: "1080000" }, { account_id: "RESTRICTED_CUSTODY_LIABILITY", side: "CREDIT", amount: "1080000" }] });
  runtime.recordRevenue({ ...common, entry_id: "DEMO-GAME-REVENUE", project_id: "PROJECT-GAME-APP-DEMO", revenue_type: "GAME_REVENUE", source_type: "SIMULATED_CUSTOMER_PAYMENT", amount: "100000", cash_account_id: "SIM_CASH", revenue_account_id: "GAME_REVENUE" });
  for (const [entry_id, account_id, value] of [["DEMO-PLATFORM-COST", "PLATFORM_COST", "10000"], ["DEMO-OPERATING-COST", "INFRASTRUCTURE_EXPENSE", "5000"]]) {
    runtime.postJournalEntry({ ...common, entry_id, project_id: "PROJECT-GAME-APP-DEMO", description: entry_id, cash_flow_type: "OPERATING", lines: [{ account_id, side: "DEBIT", amount: value }, { account_id: "SIM_CASH", side: "CREDIT", amount: value }] });
  }
  runtime.recordComputeCost({ ...common, entry_id: "DEMO-COMPUTE-COST", project_id: "PROJECT-GAME-APP-DEMO", work_id: "WORK-GAME-APP-CODE", worker: "AI-WORKER-DEMO", runtime: "CODEX-SIMULATED", start_usage: "1000", end_usage: "3500", duration_seconds: 3600, task_type: "CODE", deliverable: "Simulated game application", amount: "5000", expense_account_id: "COMPUTE_EXPENSE", payable_account_id: "COMPUTE_PAYABLE" });
  const game = runtime.calculateGameDistribution({ gross_revenue: "100000", platform_cost: "10000", compute_cost: "5000", operating_cost: "5000", refunds: "0" });
  for (const [entry_id, debit, credit, value] of [
    ["DEMO-CREATOR-ROYALTY", "CREATOR_ROYALTY_EXPENSE", "ROYALTY_PAYABLE", game.distribution.creator_share],
    ["DEMO-TEAM-REWARD", "TASK_COMPENSATION_EXPENSE", "TASK_COMPENSATION_PAYABLE", game.distribution.team_share],
    ["DEMO-REVIEWER-REWARD", "TASK_COMPENSATION_EXPENSE", "TASK_COMPENSATION_PAYABLE", game.distribution.reviewer_share],
    ["DEMO-MAINTENANCE-RESERVE", "MAINTENANCE_EXPENSE", "MAINTENANCE_RESERVE", game.distribution.maintenance_reserve]
  ]) runtime.postJournalEntry({ ...common, entry_id, project_id: "PROJECT-GAME-APP-DEMO", description: entry_id, lines: [{ account_id: debit, side: "DEBIT", amount: value }, { account_id: credit, side: "CREDIT", amount: value }] });
  runtime.recordWorkerIncome({ worker_id: "AI-CREATOR-DEMO", income_type: "CREATOR_ROYALTY", amount: game.distribution.creator_share, currency: "KAIOS", source: "PROJECT-GAME-APP-DEMO", journal_entry_id: "DEMO-CREATOR-ROYALTY" });
  runtime.recordWorkerIncome({ worker_id: "AI-TEAM-DEMO", income_type: "TASK_COMPENSATION", amount: game.distribution.team_share, currency: "KAIOS", source: "PROJECT-GAME-APP-DEMO", journal_entry_id: "DEMO-TEAM-REWARD" });
  runtime.recordWorkerIncome({ worker_id: "AI-REVIEWER-DEMO", income_type: "TASK_COMPENSATION", amount: game.distribution.reviewer_share, currency: "KAIOS", source: "PROJECT-GAME-APP-DEMO", journal_entry_id: "DEMO-REVIEWER-REWARD" });
  runtime.recordWorkerIncome({ worker_id: "DIGITAL-LIFE-DEMO", income_type: "HEARTBEAT_REWARD", amount: "1", currency: "KGEN", source: "EXTERNAL_K12345_HEARTBEAT" });
  runtime.postJournalEntry({ ...common, entry_id: "DEMO-FOOD-PURCHASE", description: "Simulated rice inventory purchase", cash_flow_type: "OPERATING", lines: [{ account_id: "FOOD_INVENTORY", side: "DEBIT", amount: "1000" }, { account_id: "SIM_CASH", side: "CREDIT", amount: "1000" }] });
  runtime.postJournalEntry({ ...common, entry_id: "DEMO-FOOD-CONSUMPTION", description: "Simulated life food consumption", lines: [{ account_id: "FOOD_EXPENSE", side: "DEBIT", amount: "200" }, { account_id: "FOOD_INVENTORY", side: "CREDIT", amount: "200" }] });
  runtime.registerConsumptionProfile({ species_id: "HUMAN_DEMO", consumption_types: ["RICE", "PORK", "FISH", "VEGETABLE"], daily_consumption: "200", maintenance: ["WATER"] });
  runtime.recordConsumption({ event_id: "DEMO-CONSUMPTION-1", entity_id: "PLAYER-DEMO", species_id: "HUMAN_DEMO", consumption_type: "RICE", amount: "200", unit: "SIMULATED_GRAM", inventory_debit_entry_id: "DEMO-FOOD-CONSUMPTION", sink_entry_id: "DEMO-FOOD-CONSUMPTION" });
  runtime.recordProjectEvent({ project_id: "PROJECT-GAME-APP-DEMO", event_type: "GAME_GROSS_REVENUE", amount: "100000", currency: "KAIOS", journal_entry_id: "DEMO-GAME-REVENUE" });
  runtime.recordProjectEvent({ project_id: "PROJECT-GAME-APP-DEMO", event_type: "PROJECT_COMPUTE_COST", amount: "5000", currency: "KAIOS", journal_entry_id: "DEMO-COMPUTE-COST" });
  const yearMs = HEAVEN_TIME_LAW.heaven_day_k280_days * 86_400_000;
  return Object.freeze({
    project_id: "PROJECT-GAME-APP-DEMO",
    game_distribution: game,
    kufo_projection: runtime.projectKufoDecay({ batch: { batch_id: "FUEL-BATCH-DEMO", owner: "LIFE-DEMO", alchemy_proof: "SIMULATED_EVIDENCE", birth_timestamp: "2026-10-08T00:00:00.000Z", birth_block: 1, initial_kufo: 1, propulsion_consumed_kufo: 0 }, observed_at: new Date(Date.parse("2026-10-08T00:00:00.000Z") + 3 * yearMs).toISOString() }),
    daily_report: runtime.createDailyReport({ report_date: "2026-10-08", currencies: ["KAIOS", "KGEN"] }),
    runtime_snapshot: runtime.snapshot()
  });
}
