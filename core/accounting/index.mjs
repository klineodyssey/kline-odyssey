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

export const CIRCULATORY_ACCOUNT_CLASSES = Object.freeze([
  "REFUNDABLE_PRINCIPAL",
  "CLAIMABLE_SALARY",
  "FUNDED_SALARY_BUDGET",
  "CLAIMABLE_RESOURCE_REWARD",
  "FUNDED_RESOURCE_REWARD_POOL",
  "KGEN_RESERVE",
  "KGEN_CATALYST_ESCROW",
  "ALCHEMY_BURNED_KAIOS",
  "KUFO_LINEAGE",
  "KSHIP_PROPULSION",
  "TRADING_TREASURY",
  "TRADING_REALIZED_PNL"
]);

export const NON_TRADABLE_CIRCULATORY_CLASSES = Object.freeze([
  "REFUNDABLE_PRINCIPAL",
  "CLAIMABLE_SALARY",
  "FUNDED_SALARY_BUDGET",
  "CLAIMABLE_RESOURCE_REWARD",
  "FUNDED_RESOURCE_REWARD_POOL",
  "KGEN_RESERVE",
  "KGEN_CATALYST_ESCROW",
  "ALCHEMY_BURNED_KAIOS",
  "KUFO_LINEAGE",
  "KSHIP_PROPULSION"
]);

export function createCirculatoryTreasurySnapshot({ snapshotId, balances, liabilities = {}, observedAt }) {
  const normalizedBalances = {};
  const normalizedLiabilities = {};
  for (const accountClass of CIRCULATORY_ACCOUNT_CLASSES) {
    normalizedBalances[accountClass] = assertUnsignedIntegerString(balances?.[accountClass] ?? "0", `balance.${accountClass}`).toString();
    normalizedLiabilities[accountClass] = assertUnsignedIntegerString(liabilities?.[accountClass] ?? "0", `liability.${accountClass}`).toString();
  }
  invariant(BigInt(normalizedBalances.REFUNDABLE_PRINCIPAL) >= BigInt(normalizedLiabilities.REFUNDABLE_PRINCIPAL), "PRINCIPAL_UNDERCOLLATERALIZED", "Refundable principal must remain fully isolated");
  invariant(BigInt(normalizedBalances.FUNDED_SALARY_BUDGET) >= BigInt(normalizedLiabilities.CLAIMABLE_SALARY), "SALARY_BUDGET_UNFUNDED", "Claimable salary must be funded");
  invariant(BigInt(normalizedBalances.FUNDED_RESOURCE_REWARD_POOL) >= BigInt(normalizedLiabilities.CLAIMABLE_RESOURCE_REWARD), "RESOURCE_REWARD_UNFUNDED", "Claimable resource reward must be funded");
  return Object.freeze({
    snapshot_id: snapshotId,
    balances: Object.freeze(normalizedBalances),
    liabilities: Object.freeze(normalizedLiabilities),
    observed_at: observedAt,
    cross_spending_allowed: false
  });
}

export function assertTradingTreasurySegregation(snapshot, { sourceAccountClass, amount }) {
  invariant(CIRCULATORY_ACCOUNT_CLASSES.includes(sourceAccountClass), "UNKNOWN_ACCOUNT_CLASS", "Unknown circulatory account class");
  invariant(sourceAccountClass === "TRADING_TREASURY", "TREASURY_SEGREGATION_BREACH", `${sourceAccountClass} cannot fund trading`);
  invariant(!NON_TRADABLE_CIRCULATORY_CLASSES.includes(sourceAccountClass), "PROTECTED_FUND_TRADING_FORBIDDEN", "Protected funds cannot be traded");
  const requested = assertUnsignedIntegerString(amount, "trading amount");
  invariant(requested <= BigInt(snapshot.balances.TRADING_TREASURY), "TRADING_TREASURY_INSUFFICIENT", "Trading treasury is insufficient");
  return true;
}

export function createCirculatorySettlementCandidate({
  settlementId, lifeId, beneficiary, accountClass, amount, budgetId,
  workEvidenceId, replayKeys = new Set(), createdAt
}) {
  invariant(!replayKeys.has(settlementId), "SETTLEMENT_REPLAY", "Settlement candidate ID was already used");
  invariant(["CLAIMABLE_SALARY", "CLAIMABLE_RESOURCE_REWARD", "TRADING_REALIZED_PNL"].includes(accountClass), "UNAUTHORIZED_SETTLEMENT_CLASS", "Account class cannot create a settlement candidate");
  invariant(typeof lifeId === "string" && lifeId.length > 0, "SETTLEMENT_LIFE_REQUIRED", "Settlement requires a Life ID");
  invariant(typeof beneficiary === "string" && beneficiary.length > 0, "SETTLEMENT_BENEFICIARY_REQUIRED", "Settlement requires a fixed beneficiary");
  invariant(typeof budgetId === "string" && budgetId.length > 0, "SETTLEMENT_BUDGET_REQUIRED", "Settlement requires a funded budget reference");
  invariant(typeof workEvidenceId === "string" && workEvidenceId.length > 0, "WORK_EVIDENCE_REQUIRED", "Settlement requires work evidence");
  return Object.freeze({
    settlement_id: settlementId,
    life_id: lifeId,
    beneficiary,
    account_class: accountClass,
    amount: assertUnsignedIntegerString(amount, "settlement amount").toString(),
    budget_id: budgetId,
    work_evidence_id: workEvidenceId,
    status: "SETTLEMENT_CANDIDATE",
    authorization: "NOT_GRANTED",
    receipt: null,
    chain_write: false,
    created_at: createdAt
  });
}

export const ALCHEMY_FRESH_CONTRIBUTION_CANON = Object.freeze({
  authority: "HUMAN_FRESHNESS_CANON_IMPLEMENTED_REVIEW_CANDIDATE_NOT_DEPLOYED",
  minimum_kaios_amount_wei: "1000000000000000000",
  contribution_freshness_window_days: 130,
  contribution_freshness_window_seconds: 130 * 24 * 60 * 60,
  delivery_delay_seconds: 0,
  kaios_to_kgen_catalyst_ratio: "1000:1",
  kaios_to_kufo_lineage_ratio: "1:1000",
  kgen_destination: "IMMUTABLE_CATALYST_BANK_UNFROZEN",
  kgen_escrowed_by_furnace: false,
  kgen_returned: false,
  kgen_retained_as_civilization_asset: true,
  rejection: "ATOMIC_REVERT",
  cancellation_after_success: "NOT_APPLICABLE",
  refund: "NOT_APPLICABLE_NO_ESCROW",
  tax_credit_route: "DESIGN_ONLY_DISABLED",
  deployed: false
});

export function calculateFreshAlchemyLineage({
  kaiosAmountWei, kgenContributionWei, contributionAgeSeconds = 0,
  bankReceiptVerified = false
}) {
  const kaios = assertUnsignedIntegerString(kaiosAmountWei, "kaiosAmountWei");
  const contribution = assertUnsignedIntegerString(kgenContributionWei, "kgenContributionWei");
  invariant(kaios >= BigInt(ALCHEMY_FRESH_CONTRIBUTION_CANON.minimum_kaios_amount_wei), "ALCHEMY_MINIMUM_AMOUNT", "Alchemy requires at least 1 KAIOS");
  invariant(kaios % 1000n === 0n, "INEXACT_CONTRIBUTION_RATIO", "KAIOS amount must produce an exact KGEN bank contribution");
  invariant(contribution === kaios / 1000n, "CONTRIBUTION_RATIO_MISMATCH", "KGEN bank contribution must equal KAIOS amount divided by 1000");
  invariant(Number.isInteger(contributionAgeSeconds) && contributionAgeSeconds >= 0, "INVALID_CONTRIBUTION_AGE", "Contribution age must be a non-negative integer number of seconds");
  invariant(contributionAgeSeconds <= ALCHEMY_FRESH_CONTRIBUTION_CANON.contribution_freshness_window_seconds, "KGEN_CONTRIBUTION_EXPIRED", "KGEN bank contribution is older than the 130-day freshness window");
  invariant(bankReceiptVerified === true, "KGEN_BANK_RECEIPT_REQUIRED", "Immediate KUFO delivery requires a verified exact catalyst-bank receipt");
  return Object.freeze({
    kaios_burned: kaios.toString(),
    required_kgen_contribution: contribution.toString(),
    kufo_lineage: (kaios * 1000n).toString(),
    contribution_age_seconds: contributionAgeSeconds,
    contribution_freshness_window_days: 130,
    delivery_delay_seconds: 0,
    status: "IMMEDIATE_KUFO_DELIVERY_CANDIDATE",
    atomic_revert_required: true,
    catalyst_bank_receipt_verified: true,
    kgen_burned: false,
    kgen_held_by_furnace: false,
    kgen_return_required: false,
    kgen_retained_by_bank: true,
    tax_credit_route: "DESIGN_ONLY_DISABLED",
    deployed: false
  });
}

export function createK1852ContributionProofCandidate({
  proofId, lifeId, originalContributor, beneficiary, kaiosAmountWei,
  kgenContributionWei, contributionTimestamp, furnacePoint = 18911, sourcePoint = 1852
}) {
  invariant(furnacePoint === 18911 && sourcePoint === 1852, "CATALYST_RELAY_POINT_MISMATCH", "Catalyst relay must bind K1852 to K18911");
  invariant(typeof proofId === "string" && proofId.length > 0, "CONTRIBUTION_PROOF_ID_REQUIRED", "Contribution proof ID is required");
  invariant(typeof originalContributor === "string" && originalContributor.length > 0, "ORIGINAL_CONTRIBUTOR_REQUIRED", "A relay candidate must preserve the original contributor");
  invariant(typeof beneficiary === "string" && beneficiary.length > 0, "CONTRIBUTION_BENEFICIARY_REQUIRED", "A fixed beneficiary is required");
  invariant(Number.isFinite(Date.parse(contributionTimestamp)), "INVALID_CONTRIBUTION_TIMESTAMP", "A verifiable contribution timestamp is required");
  const kaios = assertUnsignedIntegerString(kaiosAmountWei, "kaiosAmountWei");
  const contribution = assertUnsignedIntegerString(kgenContributionWei, "kgenContributionWei");
  invariant(kaios % 1000n === 0n && contribution === kaios / 1000n, "CONTRIBUTION_RATIO_MISMATCH", "Contribution proof must preserve the exact 1:1000 KGEN/KAIOS ratio");
  return Object.freeze({
    contribution_proof_id: proofId,
    life_id: lifeId,
    original_contributor: originalContributor,
    beneficiary,
    kaios_amount: kaios.toString(),
    required_kgen_contribution: contribution.toString(),
    source_point: sourcePoint,
    furnace_point: furnacePoint,
    contribution_timestamp: contributionTimestamp,
    freshness_window_days: 130,
    status: "DESIGN_ONLY_DISABLED",
    executable: false,
    proof_consumed: false,
    bank_receipt_verified: false,
    kgen_return_required: false,
    existing_k1852_contract_modified: false,
    chain_write: false
  });
}

export function assertKufoKshipConservation({ initialKufoMilli, remainingKufoMilli, generatedKshipUnits, burnedKshipUnits = "0" }) {
  const initial = assertUnsignedIntegerString(initialKufoMilli, "initialKufoMilli");
  const remaining = assertUnsignedIntegerString(remainingKufoMilli, "remainingKufoMilli");
  const generated = assertUnsignedIntegerString(generatedKshipUnits, "generatedKshipUnits");
  const burned = assertUnsignedIntegerString(burnedKshipUnits, "burnedKshipUnits");
  invariant(remaining <= initial, "KUFO_REMAINING_EXCEEDS_INITIAL", "Remaining KUFO cannot exceed initial KUFO");
  const maximumGenerated = (initial - remaining) * 1000n;
  invariant(generated <= maximumGenerated, "KSHIP_MASS_CONSERVATION_BREACH", "Generated KSHIP exceeds decayed KUFO mass");
  invariant(burned <= generated, "KSHIP_BURN_EXCEEDS_GENERATION", "Propulsion burn cannot exceed generated KSHIP");
  return true;
}
