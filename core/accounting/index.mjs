import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export const LEDGER_TYPES = Object.freeze(["LIFE", "COMPANY"]);

export function validateLedger(ledger) {
  requireFields(ledger, ["ledger_id", "ledger_type", "owner_id", "entries", "currency_ids", "status"], "Ledger");
  requireId(ledger.ledger_id, "ledger_id");
  requireEnum(ledger.ledger_type, LEDGER_TYPES, "ledger_type");
  return ledger;
}

export function appendAccountingEntry(ledger, entry) {
  requireFields(entry, ["entry_id", "account_id", "currency_id", "amount", "direction", "reason", "created_at", "reference_id"], "AccountingEntry");
  invariant(entry.reason.trim().length > 0, "ACTION_REASON_REQUIRED", "Every accounting entry requires an action reason");
  invariant(entry.account_id === ledger.owner_id, "LEDGER_OWNER_MISMATCH", "Entry account must match ledger owner");
  invariant(!ledger.entries.some((item) => item.entry_id === entry.entry_id), "DUPLICATE_ENTRY", `Duplicate accounting entry: ${entry.entry_id}`);
  return { ...ledger, entries: [...ledger.entries, structuredClone(entry)] };
}

export function assertLedgerSeparation(lifeLedger, companyLedger) {
  invariant(lifeLedger.ledger_type === "LIFE" && companyLedger.ledger_type === "COMPANY", "LEDGER_TYPE_MISMATCH", "Life and company ledgers must use separate types");
  invariant(lifeLedger.owner_id !== companyLedger.owner_id, "LEDGER_OWNER_COLLISION", "Personal wallet and company treasury cannot share accounting identity");
  return true;
}

export function create11520SettlementAccounting({ receipt, companyId, feeAtomic = "0" }) {
  invariant(receipt?.status === "CHAIN_VERIFIED_UNCONSUMED_CANDIDATE", "CONFIRMED_SETTLEMENT_RECEIPT_REQUIRED", "Accounting requires an independently chain-verified, unconsumed settlement receipt candidate");
  invariant(/^\d+$/.test(String(receipt.amount_atomic)) && /^\d+$/.test(String(feeAtomic)), "INVALID_ACCOUNTING_ATOMIC_AMOUNT", "Settlement accounting amounts must be unsigned atomic integers");
  const gross = BigInt(receipt.amount_atomic);
  const fee = BigInt(feeAtomic);
  invariant(fee <= gross, "SETTLEMENT_FEE_EXCEEDS_GROSS", "Settlement fee cannot exceed gross proceeds");
  const net = gross - fee;
  const entries = [
    Object.freeze({ account: receipt.buyer_actor_id, direction: "DEBIT", amount_atomic: gross.toString(), currency_id: receipt.currency_id, reference_id: receipt.receipt_id, class: "ASSET_PURCHASE" }),
    Object.freeze({ account: receipt.seller_actor_id, direction: "CREDIT", amount_atomic: net.toString(), currency_id: receipt.currency_id, reference_id: receipt.receipt_id, class: "SALE_PROCEEDS" })
  ];
  if (fee > 0n) entries.push(Object.freeze({ account: companyId, direction: "CREDIT", amount_atomic: fee.toString(), currency_id: receipt.currency_id, reference_id: receipt.receipt_id, class: "SETTLEMENT_FEE_REVENUE" }));
  const debits = entries.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + BigInt(entry.amount_atomic), 0n);
  const credits = entries.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + BigInt(entry.amount_atomic), 0n);
  invariant(debits === credits, "SETTLEMENT_ACCOUNTING_UNBALANCED", "Settlement accounting must balance debits and credits");
  return Object.freeze({
    accounting_id: `ACCOUNTING_${receipt.receipt_id}`,
    receipt_id: receipt.receipt_id,
    company_id: companyId,
    gross_atomic: gross.toString(),
    fee_atomic: fee.toString(),
    seller_net_atomic: net.toString(),
    entries: Object.freeze(entries),
    balanced: true,
    revenue_status: "RECEIPT_GATED_CANDIDATE",
    payroll_funding_status: "NOT_AUTOMATIC"
  });
}

function assertUnsignedIntegerString(value, field) {
  invariant(/^\d+$/.test(String(value)), "INVALID_FINANCE_VALUE", `${field} must be an unsigned integer string`);
  return BigInt(value);
}

function formatUnits(value, decimals = 18) {
  const amount = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function createDigitalAntFinanceSnapshot({ balances, ledgerEntries = [], observedAt, evidence = {} }) {
  const required = ["BNB", "KGEN", "KAIOS", "KUFO", "KSHIP"];
  for (const currencyId of required) assertUnsignedIntegerString(balances?.[currencyId] ?? "", `${currencyId} balance`);
  const settledEntries = ledgerEntries.filter((entry) => entry.tx_hash && entry.status === "SETTLED");
  const income = settledEntries.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expense = settledEntries.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  return Object.freeze({
    snapshot_id: `DIGITAL_ANT_FINANCE_${String(observedAt).slice(0, 13).replace(/[-T:]/g, "")}`,
    life_id: "DIGITAL_ANT_0001",
    observed_at: observedAt,
    balances_wei: Object.freeze({ ...balances }),
    balances: Object.freeze(Object.fromEntries(required.map((currencyId) => [currencyId, formatUnits(balances[currencyId])]))),
    income_actual: income,
    expense_actual: expense,
    gas_expense_actual: settledEntries.filter((entry) => entry.category === "GAS").reduce((sum, entry) => sum + Number(entry.amount), 0),
    work_income_actual: settledEntries.filter((entry) => entry.category === "WORK_INCOME").reduce((sum, entry) => sum + Number(entry.amount), 0),
    investment_pnl_actual: 0,
    emergency_reserve: "PROPOSAL_PENDING",
    working_capital: "PROPOSAL_PENDING",
    dream_fund: "0",
    spaceship_fund: "0",
    mars_fund: "0",
    net_asset_valuation: "NOT_DEPLOYED",
    evidence,
    accounting_law: "NO_TX_NO_ACTUAL_ENTRY"
  });
}

export function createSurvivalReserveProposal({ currentBnbWei, gasPriceWei, estimatedGasUnits, coverageTransactions = 4, emergencyTransactions = 2, safetyBps = 20_000 }) {
  const balance = assertUnsignedIntegerString(currentBnbWei, "currentBnbWei");
  const gasPrice = assertUnsignedIntegerString(gasPriceWei, "gasPriceWei");
  const estimates = estimatedGasUnits.map((value) => assertUnsignedIntegerString(value, "estimatedGasUnits"));
  invariant(estimates.length > 0 && estimates.every((value) => value > 0n), "GAS_ESTIMATE_REQUIRED", "Survival reserve requires at least one live gas estimate");
  invariant(Number.isInteger(coverageTransactions) && coverageTransactions > 0, "INVALID_RESERVE_COVERAGE", "Coverage transactions must be positive");
  invariant(Number.isInteger(emergencyTransactions) && emergencyTransactions > 0, "INVALID_EMERGENCY_COVERAGE", "Emergency transactions must be positive");
  invariant(Number.isInteger(safetyBps) && safetyBps >= 10_000, "INVALID_RESERVE_SAFETY", "Safety multiplier must be at least 1.0x");
  const maxGas = estimates.reduce((max, value) => value > max ? value : max, 0n);
  const unitCost = gasPrice * maxGas;
  const minSurvival = unitCost * BigInt(coverageTransactions) * BigInt(safetyBps) / 10_000n;
  const emergency = unitCost * BigInt(emergencyTransactions) * BigInt(safetyBps) / 10_000n;
  const protectedReserve = minSurvival > balance ? balance : minSurvival;
  const proposedActionGas = unitCost * BigInt(safetyBps) / 10_000n;
  const spendable = balance > protectedReserve + proposedActionGas ? balance - protectedReserve - proposedActionGas : 0n;
  return Object.freeze({
    proposal_id: "DIGITAL_ANT_SURVIVAL_RESERVE_PROPOSAL",
    status: "OWNER_APPROVAL_REQUIRED",
    basis: "LIVE_GAS_PRICE_X_MAX_CHAIN_ESTIMATE_X_COVERAGE_X_SAFETY",
    gas_price_wei: gasPrice.toString(),
    maximum_observed_gas_units: maxGas.toString(),
    coverage_transactions: coverageTransactions,
    emergency_transactions: emergencyTransactions,
    safety_bps: safetyBps,
    recommended_survival_reserve_wei: protectedReserve.toString(),
    recommended_survival_reserve_bnb: formatUnits(protectedReserve),
    proposed_action_gas_buffer_wei: proposedActionGas.toString(),
    proposed_action_gas_buffer_bnb: formatUnits(proposedActionGas),
    MIN_SURVIVAL_BNB: formatUnits(protectedReserve),
    EMERGENCY_BNB: formatUnits(emergency > balance ? balance : emergency),
    emergency_bnb_wei: (emergency > balance ? balance : emergency).toString(),
    MAX_SPENDABLE_BNB: formatUnits(spendable),
    max_spendable_wei: spendable.toString(),
    owner_approved: false,
    spend_authorized: false,
    permanent_universe_constant: false
  });
}

export function createFirstKgenAcquisitionPlan({ financeSnapshot, reserveProposal, marketQuote }) {
  invariant(reserveProposal?.spend_authorized === false, "RESERVE_POLICY_INVALID", "First KGEN plan must preserve an unapproved survival reserve");
  invariant(marketQuote?.status === "CHAIN_READ_VERIFIED", "VERIFIED_QUOTE_REQUIRED", "First KGEN plan requires a live verified chain quote");
  invariant(BigInt(marketQuote.amount_in_wei) <= BigInt(reserveProposal.max_spendable_wei), "SURVIVAL_RESERVE_BREACH", "Quote input exceeds proposed spendable BNB");
  return Object.freeze({
    proposal_id: "FIRST_KGEN_ACQUISITION_PLAN",
    life_id: "DIGITAL_ANT_0001",
    action_reason: "FIRST_COSMIC_MASS_ACQUISITION",
    status: "DRY_RUN_ONLY",
    available_bnb: financeSnapshot.balances.BNB,
    survival_reserve_bnb: reserveProposal.MIN_SURVIVAL_BNB,
    spendable_bnb: reserveProposal.MAX_SPENDABLE_BNB,
    scenario_input_bnb: marketQuote.amount_in_bnb,
    pair: marketQuote.pair_address,
    router: marketQuote.router_address,
    quote_block: marketQuote.block_number,
    current_quote_kgen_before_tax: marketQuote.quoted_kgen_before_tax,
    expected_kgen_received: marketQuote.expected_kgen_after_tax,
    token_economics_bps: marketQuote.token_tax_bps,
    price_impact_bps: marketQuote.price_impact_bps,
    slippage_bps: marketQuote.slippage_bps,
    estimated_gas_units: marketQuote.estimated_gas_units,
    estimated_gas_bnb: marketQuote.estimated_gas_bnb,
    post_trade_bnb_reserve: marketQuote.post_trade_bnb,
    risk_assessment: marketQuote.risk_assessment,
    owner_approval: "NOT_GRANTED",
    broadcast_capability: "ABSENT",
    tx_hash: null
  });
}

export function createDigitalAntCfoDailyReport({ date, financeSnapshot, reserveProposal, firstKgenPlan }) {
  return Object.freeze({
    report_id: `DIGITAL_ANT_CFO_DAILY_${date.replaceAll("-", "")}`,
    report_type: "DIGITAL_ANT_CFO_DAILY_REPORT",
    date,
    opening_balance: "NOT_RECORDED_BEFORE_FIRST_WORKDAY",
    income: financeSnapshot.income_actual,
    expenses: financeSnapshot.expense_actual,
    gas_expenses: financeSnapshot.gas_expense_actual,
    trading_pnl: financeSnapshot.investment_pnl_actual,
    closing_balance: financeSnapshot.balances,
    bnb_survival_reserve: reserveProposal.MIN_SURVIVAL_BNB,
    spendable_bnb: reserveProposal.MAX_SPENDABLE_BNB,
    kgen: financeSnapshot.balances.KGEN,
    kaios: financeSnapshot.balances.KAIOS,
    net_asset: financeSnapshot.net_asset_valuation,
    dream_fund: financeSnapshot.dream_fund,
    outstanding_obligations: [],
    financial_risk: BigInt(reserveProposal.max_spendable_wei) === 0n ? "NO_SPENDABLE_BNB_UNDER_PROPOSAL" : "OWNER_APPROVAL_REQUIRED_BEFORE_SPEND",
    next_day_budget: "NO_SPEND_AUTHORIZED",
    first_kgen_goal: firstKgenPlan.status
  });
}
