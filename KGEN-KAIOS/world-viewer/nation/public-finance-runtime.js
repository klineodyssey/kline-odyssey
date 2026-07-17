import {
  boundedPush,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "PublicFinanceRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_LEDGER = 240;
const MAX_INVOICES = 100;
const MAX_AUDIT = 160;

export const REQUIRED_TAX_IDS = Object.freeze([
  "INCOME_TAX",
  "SALES_TAX",
  "BUSINESS_TAX",
  "PROPERTY_TAX",
  "LAND_TAX",
  "VEHICLE_LICENSE_TAX",
  "FUEL_TAX",
  "IMPORT_TARIFF",
  "EXPORT_TARIFF",
  "RESOURCE_ROYALTY",
  "WATER_USAGE_FEE",
  "CARBON_FEE"
]);

function positiveAmount(value, label = "amount") {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw runtimeError(RUNTIME, "INVALID_AMOUNT", `${label} must be positive`);
  return Number(parsed.toFixed(2));
}

function validateConfig(config) {
  if (!config || !Array.isArray(config.tax_policy) || !config.treasury || !config.official_currency) {
    throw new TypeError("Public Finance Runtime requires tax, treasury and Official Currency configuration");
  }
  const taxIds = config.tax_policy.map(({ tax_id: id }) => id);
  if (JSON.stringify(taxIds) !== JSON.stringify(REQUIRED_TAX_IDS)) {
    throw runtimeError(RUNTIME, "INVALID_TAX_CATALOG", "Tax policy must contain the approved twelve tax types in order");
  }
  for (const tax of config.tax_policy) {
    for (const key of ["rate_bps", "minimum_rate_bps", "maximum_rate_bps", "step_bps"]) {
      if (!Number.isInteger(tax[key])) throw runtimeError(RUNTIME, "INVALID_TAX_POLICY", `${tax.tax_id}.${key} must be an integer`);
    }
    if (tax.rate_bps < tax.minimum_rate_bps || tax.rate_bps > tax.maximum_rate_bps) {
      throw runtimeError(RUNTIME, "INVALID_TAX_POLICY", `${tax.tax_id} initial rate is outside its governance range`);
    }
  }
  if (config.official_currency.currency_code === "KGEN") {
    throw runtimeError(RUNTIME, "TOKEN_BOUNDARY", "Nation Official Currency cannot redefine KGEN");
  }
}

export function createPublicFinanceRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.public-finance.v1"
} = {}) {
  validateConfig(config);
  const storageRef = resolveStorage(storage);
  const treasuryConfig = config.treasury;
  const treasuryAccounts = Object.freeze([
    treasuryConfig.operating_account,
    treasuryConfig.reserve_account,
    treasuryConfig.emergency_account
  ]);
  let destroyed = false;
  let state = {
    revision: 0,
    policy_version: 1,
    tax_policy: config.tax_policy.map((tax) => ({ ...tax })),
    official_currency: { ...config.official_currency },
    ledger: [],
    invoices: [],
    budget_allocations: [],
    public_investment: 0,
    resource_revenue: 0,
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      tax_policy: restored.state.tax_policy?.map((tax) => ({ ...tax })) ?? state.tax_policy,
      official_currency: { ...state.official_currency, ...restored.state.official_currency },
      ledger: restored.state.ledger?.slice(-MAX_LEDGER) ?? [],
      invoices: restored.state.invoices?.slice(-MAX_INVOICES) ?? [],
      budget_allocations: restored.state.budget_allocations?.slice(-MAX_INVOICES) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Public Finance Runtime has been destroyed");
  };

  function postEntry({ type, debitAccount, creditAccount, amount, referenceId, metadata = {} }) {
    const normalized = positiveAmount(amount);
    if (!debitAccount || !creditAccount || debitAccount === creditAccount) {
      throw runtimeError(RUNTIME, "INVALID_LEDGER_ENTRY", "Ledger entry requires distinct debit and credit accounts");
    }
    state.revision += 1;
    const entry = {
      ledger_entry_id: stableId("nation-ledger", state.revision),
      type,
      currency: state.official_currency.currency_code,
      debit: { account_id: debitAccount, amount: normalized },
      credit: { account_id: creditAccount, amount: normalized },
      reference_id: referenceId,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      real_finance: false,
      ...metadata
    };
    boundedPush(state.ledger, entry, MAX_LEDGER);
    return entry;
  }

  function recordAudit(type, details = {}) {
    boundedPush(state.audit_log, {
      audit_id: stableId("finance-audit", state.revision),
      type,
      policy_version: state.policy_version,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_AUDIT);
  }

  function balances() {
    const result = {};
    for (const entry of state.ledger) {
      result[entry.debit.account_id] = Number(((result[entry.debit.account_id] ?? 0) - entry.debit.amount).toFixed(2));
      result[entry.credit.account_id] = Number(((result[entry.credit.account_id] ?? 0) + entry.credit.amount).toFixed(2));
    }
    return result;
  }

  function treasuryBalance(accountId) {
    return balances()[accountId] ?? 0;
  }

  function initializeLedger() {
    if (state.ledger.length) return;
    const entries = [
      [treasuryConfig.operating_account, treasuryConfig.initial_operating_balance, "OPERATING_ENDOWMENT"],
      [treasuryConfig.reserve_account, treasuryConfig.initial_reserve_balance, "RESERVE_ENDOWMENT"],
      [treasuryConfig.emergency_account, treasuryConfig.initial_emergency_balance, "EMERGENCY_ENDOWMENT"]
    ];
    for (const [account, amount, type] of entries) {
      postEntry({
        type,
        debitAccount: treasuryConfig.genesis_equity_account,
        creditAccount: account,
        amount,
        referenceId: config.decision_id
      });
    }
    recordAudit("TREASURY_INITIALIZED", { account_count: treasuryAccounts.length });
    persist();
  }

  const getSnapshot = () => {
    const accountBalances = balances();
    const totalAssets = treasuryAccounts.reduce((total, account) => total + (accountBalances[account] ?? 0), 0);
    return snapshot({
      runtime: "NATION_PUBLIC_FINANCE_ALPHA",
      schema_version: SCHEMA_VERSION,
      synthetic: true,
      authoritative: false,
      tax_policy: state.tax_policy,
      policy_version: state.policy_version,
      treasury: {
        treasury_id: treasuryConfig.treasury_id,
        operating_balance: accountBalances[treasuryConfig.operating_account] ?? 0,
        reserve: accountBalances[treasuryConfig.reserve_account] ?? 0,
        emergency_reserve: accountBalances[treasuryConfig.emergency_account] ?? 0,
        total_assets: Number(totalAssets.toFixed(2)),
        resource_revenue: state.resource_revenue,
        public_investment: state.public_investment,
        annual_budget: {
          fiscal_year: treasuryConfig.fiscal_year,
          categories: config.annual_budget_categories,
          allocations: state.budget_allocations
        },
        account_balances: accountBalances
      },
      official_currency: {
        ...state.official_currency,
        status: "ACTIVE_SYNTHETIC",
        legal_tender: false,
        token_contract: false,
        kgen_impact: false
      },
      exchange_policies: config.exchange_policies,
      invoices: state.invoices,
      ledger: state.ledger,
      audit_log: state.audit_log,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function setTaxRate(taxId, rateBps, evidence = "NATION_GOVERNANCE_POLICY_REVIEW") {
    usable();
    const tax = state.tax_policy.find(({ tax_id: id }) => id === taxId);
    if (!tax) throw runtimeError(RUNTIME, "UNKNOWN_TAX", `Unknown tax ${taxId}`);
    const rate = Number(rateBps);
    if (!Number.isInteger(rate) || rate < tax.minimum_rate_bps || rate > tax.maximum_rate_bps) {
      throw runtimeError(RUNTIME, "RATE_OUT_OF_RANGE", `${taxId} must remain within its governance range`);
    }
    tax.rate_bps = rate;
    state.policy_version += 1;
    state.revision += 1;
    recordAudit("TAX_RATE_UPDATED", { tax_id: taxId, rate_bps: rate, evidence });
    persist();
    notifier.emit("TAX_RATE_UPDATED", { tax_id: taxId, rate_bps: rate });
    return getSnapshot();
  }

  function settleInvoice({ taxId, taxableAmount, payerId = "synthetic-citizen-001" } = {}) {
    usable();
    const tax = state.tax_policy.find(({ tax_id: id }) => id === taxId);
    if (!tax) throw runtimeError(RUNTIME, "UNKNOWN_TAX", `Unknown tax ${taxId}`);
    const base = positiveAmount(taxableAmount, "taxableAmount");
    const due = Number((base * tax.rate_bps / 10_000).toFixed(2));
    state.revision += 1;
    const invoice = {
      invoice_id: stableId("nation-invoice", state.revision),
      tax_id: taxId,
      payer_id: payerId,
      taxable_amount: base,
      rate_bps: tax.rate_bps,
      amount_due: due,
      currency: state.official_currency.currency_code,
      status: due > 0 ? "SETTLED_SYNTHETIC" : "ZERO_RATE_RECORDED",
      authoritative: false
    };
    if (due > 0) {
      invoice.ledger_entry_id = postEntry({
        type: "TAX_INVOICE_SETTLEMENT",
        debitAccount: `TAXPAYER:${payerId}`,
        creditAccount: treasuryConfig.operating_account,
        amount: due,
        referenceId: invoice.invoice_id,
        metadata: { tax_id: taxId }
      }).ledger_entry_id;
    }
    boundedPush(state.invoices, invoice, MAX_INVOICES);
    recordAudit("TAX_INVOICE_RECORDED", { invoice_id: invoice.invoice_id, tax_id: taxId, amount: due });
    persist();
    notifier.emit("TAX_INVOICE_RECORDED", { invoice_id: invoice.invoice_id, amount: due });
    return getSnapshot();
  }

  function allocateBudget(category, amount) {
    usable();
    const budget = config.annual_budget_categories.find(({ category_id: id }) => id === category);
    if (!budget) throw runtimeError(RUNTIME, "UNKNOWN_BUDGET_CATEGORY", `Unknown budget category ${category}`);
    const normalized = positiveAmount(amount);
    if (treasuryBalance(treasuryConfig.operating_account) < normalized) {
      throw runtimeError(RUNTIME, "INSUFFICIENT_TREASURY", "Operating treasury cannot fund this allocation");
    }
    const entry = postEntry({
      type: "PUBLIC_BUDGET_SPENDING",
      debitAccount: treasuryConfig.operating_account,
      creditAccount: `PUBLIC_PROGRAM:${category}`,
      amount: normalized,
      referenceId: stableId("budget", state.revision + 1),
      metadata: { category }
    });
    const allocation = {
      allocation_id: entry.reference_id,
      category,
      amount: normalized,
      currency: state.official_currency.currency_code,
      ledger_entry_id: entry.ledger_entry_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    };
    boundedPush(state.budget_allocations, allocation, MAX_INVOICES);
    if (budget.public_investment === true) state.public_investment = Number((state.public_investment + normalized).toFixed(2));
    recordAudit("BUDGET_ALLOCATED", { allocation_id: allocation.allocation_id, category, amount: normalized });
    persist();
    notifier.emit("BUDGET_ALLOCATED", { category, amount: normalized });
    return getSnapshot();
  }

  function recordResourceRevenue(amount, referenceId) {
    usable();
    const normalized = positiveAmount(amount);
    postEntry({
      type: "RESOURCE_EXPORT_REVENUE",
      debitAccount: "SYNTHETIC_RESOURCE_MARKET",
      creditAccount: treasuryConfig.operating_account,
      amount: normalized,
      referenceId
    });
    state.resource_revenue = Number((state.resource_revenue + normalized).toFixed(2));
    recordAudit("RESOURCE_REVENUE_RECORDED", { reference_id: referenceId, amount: normalized });
    persist();
    notifier.emit("RESOURCE_REVENUE_RECORDED", { amount: normalized });
    return getSnapshot();
  }

  function payResourceImport(amount, referenceId) {
    usable();
    const normalized = positiveAmount(amount);
    if (treasuryBalance(treasuryConfig.operating_account) < normalized) {
      throw runtimeError(RUNTIME, "INSUFFICIENT_TREASURY", "Operating treasury cannot pay for this import");
    }
    postEntry({
      type: "RESOURCE_IMPORT_PAYMENT",
      debitAccount: treasuryConfig.operating_account,
      creditAccount: "SYNTHETIC_RESOURCE_SUPPLIER",
      amount: normalized,
      referenceId
    });
    recordAudit("RESOURCE_IMPORT_PAID", { reference_id: referenceId, amount: normalized });
    persist();
    notifier.emit("RESOURCE_IMPORT_PAID", { amount: normalized });
    return getSnapshot();
  }

  function setExchangePolicy(policyId) {
    usable();
    if (!config.exchange_policies.includes(policyId)) throw runtimeError(RUNTIME, "UNKNOWN_EXCHANGE_POLICY", `Unknown exchange policy ${policyId}`);
    state.official_currency.exchange_policy = policyId;
    state.official_currency.policy_version = Number(state.official_currency.policy_version ?? 1) + 1;
    state.policy_version += 1;
    state.revision += 1;
    recordAudit("CURRENCY_POLICY_UPDATED", { exchange_policy: policyId });
    persist();
    notifier.emit("CURRENCY_POLICY_UPDATED", { exchange_policy: policyId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (state.tax_policy.length !== REQUIRED_TAX_IDS.length) issues.push("tax catalog must contain twelve types");
    if (JSON.stringify(state.tax_policy.map(({ tax_id: id }) => id)) !== JSON.stringify(REQUIRED_TAX_IDS)) issues.push("tax catalog order changed");
    if (state.tax_policy.some((tax) => tax.rate_bps < tax.minimum_rate_bps || tax.rate_bps > tax.maximum_rate_bps)) issues.push("tax rate outside governance range");
    if (state.ledger.some((entry) => entry.debit.amount !== entry.credit.amount || entry.currency !== state.official_currency.currency_code)) issues.push("unbalanced ledger entry");
    const balanceTotal = Object.values(balances()).reduce((sum, value) => sum + Number(value), 0);
    if (Math.abs(balanceTotal) > 0.001) issues.push("ledger account balances do not net to zero");
    if (state.official_currency.currency_code === "KGEN" || state.official_currency.token_contract === true) issues.push("Official Currency crossed the KGEN boundary");
    if (getSnapshot().treasury.total_assets < 0) issues.push("treasury assets became negative");
    if (state.ledger.length > MAX_LEDGER || state.invoices.length > MAX_INVOICES || state.audit_log.length > MAX_AUDIT) issues.push("public finance history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "NATION_PUBLIC_FINANCE_ALPHA", issues, ledger_entries: state.ledger.length });
  }

  initializeLedger();

  return Object.freeze({
    getSnapshot,
    setTaxRate,
    settleInvoice,
    allocateBudget,
    recordResourceRevenue,
    payResourceImport,
    setExchangePolicy,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}
