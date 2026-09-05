import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { assertRightsOfferAllowed } from "../permissions/index.mjs";
import { assertCivilizationCapability } from "../permissions/index.mjs";

export const LISTING_TYPES = Object.freeze(["FIXED_PRICE", "AUCTION", "LICENSE", "SUBSCRIPTION", "RENTAL", "JOB", "SERVICE", "EQUITY", "REVENUE_SHARE"]);
export const LISTING_FIELDS = Object.freeze(["listing_id", "asset_id", "seller_id", "listing_type", "currency_id", "price", "quantity", "rights_offered", "start_time", "end_time", "status"]);
export const ORDER_FIELDS = Object.freeze(["order_id", "listing_id", "buyer_id", "seller_id", "asset_id", "currency_id", "amount", "quantity", "fee", "rights_transferred", "created_at", "settled_at", "tx_hash", "status", "action_reason"]);
export const LISTING_STATUSES = Object.freeze(["LOCAL_DRAFT", "NOT_DEPLOYED", "LISTED", "CANCELLED"]);

export function validateListing(listing) {
  requireFields(listing, LISTING_FIELDS, "Listing");
  requireId(listing.listing_id, "listing_id");
  requireEnum(listing.listing_type, LISTING_TYPES, "listing_type");
  invariant(Array.isArray(listing.rights_offered), "INVALID_RIGHTS_OFFER", "rights_offered must be an array");
  requireEnum(listing.status, LISTING_STATUSES, "listing.status");
  const unpriced = listing.pricing_status === "UNPRICED";
  invariant((unpriced && listing.price === null) || (!unpriced && Number(listing.price) >= 0), "INVALID_LISTING_PRICE", "Unpriced listings require price=null; priced listings require a non-negative price");
  invariant(Number(listing.quantity) > 0, "INVALID_LISTING_AMOUNT", "Listing quantity is invalid");
  return listing;
}

export function createListing({ listing, asset, seller }) {
  validateListing(listing);
  invariant(asset.controller_id === seller || asset.owner_id === seller, "LISTING_PERMISSION_DENIED", "Seller does not control this asset");
  assertRightsOfferAllowed(asset, listing.rights_offered);
  if (listing.status === "LISTED") {
    invariant(asset.asset_type !== "LIFE", "LIFE_IDENTITY_NOT_FOR_SALE", "A formal profile listing cannot use the Life identity asset");
    invariant(listing.registry_scope === "LOCAL_11520", "FORMAL_LOCAL_REGISTRY_REQUIRED", "LISTED requires a completed local 11520 Registry record");
    invariant(listing.settlement_status === "NOT_DEPLOYED", "UNVERIFIED_SETTLEMENT_STATUS", "Local listing registration cannot claim on-chain settlement");
    invariant(listing.identity_right_offered === false && !listing.rights_offered.includes("identity_right"), "LIFE_IDENTITY_NOT_FOR_SALE", "Life identity cannot be offered by a profile listing");
  }
  return structuredClone(listing);
}

export async function replayCanonical11520Listing({ store, listing, asset, life }) {
  validateListing(listing);
  invariant(listing.status === "LISTED" && listing.registry_scope === "LOCAL_11520", "CANONICAL_LISTING_NOT_FORMAL", "Canonical 11520 listing must be formally registered in the local Registry");
  invariant(asset.asset_id === listing.asset_id && asset.asset_type !== "LIFE", "INVALID_PROFILE_LISTING_ASSET", "Canonical Life Profile listing cannot list the Life identity asset");
  const marketHistory = await store.history(listing.listing_id, "MARKET");
  if (marketHistory.some((event) => event.event_type === "11520_LISTING_EVENT")) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const payload = Object.freeze({
    listing_id: listing.listing_id,
    life_id: life.life_id,
    asset_id: asset.asset_id,
    registry_scope: listing.registry_scope,
    settlement_status: listing.settlement_status,
    pricing_status: listing.pricing_status,
    identity_right_offered: false
  });
  const base = { actor_id: life.life_id, timestamp: listing.start_time, event_type: "11520_LISTING_EVENT", payload, tx_hash: null };
  const events = await store.commitBatch([
    { ...base, domain: "MARKET", stream: "MARKET", id: listing.listing_id, entity: listing },
    { ...base, domain: "ASSET", stream: "ASSET", id: asset.asset_id, entity: asset },
    { ...base, domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life }
  ]);
  return Object.freeze({ status: "LOCAL_11520_LISTING_REPLAYED", events });
}

export function validateOrder(order) {
  requireFields(order, ORDER_FIELDS, "Order");
  requireId(order.order_id, "order_id");
  invariant(order.buyer_id !== order.seller_id, "SELF_MATCH_FORBIDDEN", "Buyer and seller cannot self-match");
  invariant(order.action_reason?.trim(), "ACTION_REASON_REQUIRED", "Every market action requires a reason");
  return order;
}

export function createMarketRegistry(store, createRegistry) {
  return createRegistry({ domain: "MARKET", stream: "MARKET", idField: "listing_id", validate: validateListing, store });
}

export const CROSS_MARKET_ADAPTER_STATUSES = Object.freeze(["OBSERVATION_ONLY", "PAPER_ONLY", "LIVE_AUTHORIZED", "NOT_AVAILABLE"]);
export const CROSS_MARKET_PHASE1_ACTIONS = Object.freeze([
  "MARKET_OBSERVATION", "NORMALIZED_QUOTE", "ROUTE_DISCOVERY", "COST_CALCULATION",
  "RISK_CHECK", "PAPER_EXECUTION", "PROFIT_LOSS_SIMULATION", "TRADE_CANDIDATE",
  "POLICY_BOX", "AUTHORIZATION_CHECK", "EVIDENCE", "NEXT_HEARTBEAT"
]);
export const KAIOS_CROSS_MARKET_AUTOPILOT = Object.freeze({
  engine_id: "KAIOS_CROSS_MARKET_AUTOPILOT_V1",
  scope: "CIVILIZATION_SHARED_ORGAN",
  status: "LOCAL_PAPER_ONLY",
  enabled: Object.freeze({
    auto_market_observation: true,
    auto_price_discovery: true,
    auto_cross_market_analysis: true,
    auto_paper_trade: true,
    auto_trade_candidate: true
  }),
  prohibited: Object.freeze({
    real_trade: true,
    payment: true,
    deployment: true,
    governance_execution: true,
    mainnet_transaction: true
  }),
  one_engine_per_life: false
});
export const TRADE_COST_FIELDS = Object.freeze([
  "amm_fee", "gas_cost", "slippage", "bridge_cost", "transport_cost",
  "kship_cost", "market_impact", "risk_reserve"
]);

function unsigned(value, field, { positive = false } = {}) {
  invariant(/^\d+$/.test(String(value)), "INVALID_MARKET_AMOUNT", `${field} must be an unsigned integer string`);
  const amount = BigInt(value);
  if (positive) invariant(amount > 0n, "ZERO_MARKET_AMOUNT", `${field} must be positive`);
  return amount;
}

function floorMulDiv(amount, numerator, denominator) {
  return amount * numerator / denominator;
}

function ceilMulDiv(amount, numerator, denominator) {
  return (amount * numerator + denominator - 1n) / denominator;
}

export function normalizeCrossMarketQuote(quote, { observedAt, maxAgeSeconds }) {
  requireFields(quote, [
    "quote_id", "market_id", "adapter_status", "base_asset", "quote_asset",
    "price_numerator", "price_denominator", "observed_at", "expires_at", "evidence"
  ], "CrossMarketQuote");
  invariant(CROSS_MARKET_ADAPTER_STATUSES.includes(quote.adapter_status), "INVALID_MARKET_ADAPTER_STATUS", "Market adapter status is invalid");
  invariant(quote.adapter_status !== "NOT_AVAILABLE", "MARKET_NOT_AVAILABLE", "A nonexistent market cannot provide a quote");
  const numerator = unsigned(quote.price_numerator, "price_numerator", { positive: true });
  const denominator = unsigned(quote.price_denominator, "price_denominator", { positive: true });
  const now = Date.parse(observedAt);
  const quoted = Date.parse(quote.observed_at);
  const expires = Date.parse(quote.expires_at);
  invariant(Number.isFinite(now) && Number.isFinite(quoted) && Number.isFinite(expires), "INVALID_QUOTE_TIME", "Quote timestamps must be valid ISO timestamps");
  invariant(quoted <= now, "FUTURE_QUOTE_REJECTED", "Quote observation cannot be in the future");
  invariant(now <= expires, "STALE_QUOTE", "Quote has expired");
  invariant(Number.isInteger(maxAgeSeconds) && maxAgeSeconds >= 0, "INVALID_QUOTE_AGE_POLICY", "Quote age policy is invalid");
  invariant(now - quoted <= maxAgeSeconds * 1000, "STALE_QUOTE", "Quote is older than the allowed freshness window");
  invariant(typeof quote.evidence === "string" && quote.evidence.length > 0, "QUOTE_EVIDENCE_REQUIRED", "Quote requires durable evidence");
  return Object.freeze({
    ...structuredClone(quote),
    normalized_price: Object.freeze({ numerator: numerator.toString(), denominator: denominator.toString() }),
    normalized_at: observedAt,
    executable: quote.adapter_status === "LIVE_AUTHORIZED"
  });
}

export function discoverCrossMarketRoute({ routeId, buyQuote, sellQuote, baseAmount, observedAt, maxAgeSeconds }) {
  const buy = normalizeCrossMarketQuote(buyQuote, { observedAt, maxAgeSeconds });
  const sell = normalizeCrossMarketQuote(sellQuote, { observedAt, maxAgeSeconds });
  invariant(buy.market_id !== sell.market_id, "SAME_MARKET_ROUTE", "Cross-market route requires distinct markets");
  invariant(buy.base_asset === sell.base_asset && buy.quote_asset === sell.quote_asset, "QUOTE_PAIR_MISMATCH", "Cross-market quotes must use the same pair");
  const amount = unsigned(baseAmount, "baseAmount", { positive: true });
  const buyCost = ceilMulDiv(amount, BigInt(buy.price_numerator), BigInt(buy.price_denominator));
  const sellProceeds = floorMulDiv(amount, BigInt(sell.price_numerator), BigInt(sell.price_denominator));
  return Object.freeze({
    route_id: routeId,
    base_asset: buy.base_asset,
    quote_asset: buy.quote_asset,
    base_amount: amount.toString(),
    buy_market: buy.market_id,
    sell_market: sell.market_id,
    buy_quote_id: buy.quote_id,
    sell_quote_id: sell.quote_id,
    buy_cost: buyCost.toString(),
    sell_proceeds: sellProceeds.toString(),
    gross_profit: (sellProceeds - buyCost).toString(),
    observed_at: observedAt,
    adapter_execution_ready: buy.executable && sell.executable
  });
}

export function calculateCrossMarketNetProfit({ grossProfit, costs }) {
  invariant(Array.isArray(costs) === false && costs && typeof costs === "object", "INVALID_TRADE_COSTS", "Trade costs must be an object");
  const gross = BigInt(String(grossProfit));
  const normalizedCosts = {};
  let total = 0n;
  for (const field of TRADE_COST_FIELDS) {
    const amount = unsigned(costs[field] ?? "0", field);
    normalizedCosts[field] = amount.toString();
    total += amount;
  }
  return Object.freeze({
    gross_profit: gross.toString(),
    costs: Object.freeze(normalizedCosts),
    total_cost: total.toString(),
    expected_net_profit: (gross - total).toString()
  });
}

export function createTradingPolicyBox({
  policyBoxId, marketAllowlist, tokenAllowlist, routeAllowlist,
  maxTradeAmount, maxHourlyExposure, maxDailyExposure, maxDailyLoss,
  maxSlippageBps, minimumExpectedNetProfit, gasCeiling, priceFreshnessSeconds,
  oracleDisagreementBps, inventoryLimit, fixedTreasury, fixedBeneficiary,
  allowanceCeiling = "0", emergencyPaused = false, realTradeEnabled = false
}) {
  invariant(typeof policyBoxId === "string" && policyBoxId.length > 0, "POLICY_BOX_ID_REQUIRED", "Policy Box ID is required");
  invariant(typeof fixedTreasury === "string" && fixedTreasury.length > 0, "FIXED_TREASURY_REQUIRED", "Policy Box requires a fixed treasury");
  invariant(typeof fixedBeneficiary === "string" && fixedBeneficiary.length > 0, "FIXED_BENEFICIARY_REQUIRED", "Policy Box requires a fixed beneficiary");
  for (const [field, value] of Object.entries({ maxTradeAmount, maxHourlyExposure, maxDailyExposure, maxDailyLoss, minimumExpectedNetProfit, gasCeiling, inventoryLimit, allowanceCeiling })) unsigned(value, field);
  for (const [field, value] of Object.entries({ maxSlippageBps, priceFreshnessSeconds, oracleDisagreementBps })) invariant(Number.isInteger(value) && value >= 0, "INVALID_POLICY_LIMIT", `${field} must be a non-negative integer`);
  for (const [field, value] of Object.entries({ marketAllowlist, tokenAllowlist, routeAllowlist })) invariant(Array.isArray(value), "INVALID_POLICY_ALLOWLIST", `${field} must be an array`);
  return Object.freeze({
    policy_box_id: policyBoxId,
    market_allowlist: Object.freeze([...new Set(marketAllowlist)]),
    token_allowlist: Object.freeze([...new Set(tokenAllowlist)]),
    route_allowlist: Object.freeze([...new Set(routeAllowlist)]),
    max_trade_amount: String(maxTradeAmount),
    max_hourly_exposure: String(maxHourlyExposure),
    max_daily_exposure: String(maxDailyExposure),
    max_daily_loss: String(maxDailyLoss),
    max_slippage_bps: maxSlippageBps,
    minimum_expected_net_profit: String(minimumExpectedNetProfit),
    gas_ceiling: String(gasCeiling),
    price_freshness_seconds: priceFreshnessSeconds,
    oracle_disagreement_bps: oracleDisagreementBps,
    inventory_limit: String(inventoryLimit),
    fixed_treasury: fixedTreasury,
    fixed_beneficiary: fixedBeneficiary,
    allowance_ceiling: String(allowanceCeiling),
    nonce_replay_protection: true,
    receipt_required: true,
    emergency_paused: emergencyPaused,
    real_trade_enabled: realTradeEnabled
  });
}

export function evaluateTradingPolicyBox({ policy, candidate, exposure, seenCandidateIds = new Set(), requireRealTrade = false }) {
  invariant(policy?.emergency_paused !== true, "POLICY_BOX_PAUSED", "Trading policy box is emergency-paused");
  invariant(!seenCandidateIds.has(candidate.candidate_id), "DUPLICATE_TRADE_REPLAY", "Trade candidate was already processed");
  invariant(policy.market_allowlist.includes(candidate.buy_market) && policy.market_allowlist.includes(candidate.sell_market), "MARKET_NOT_ALLOWLISTED", "Market is not allowlisted");
  invariant(policy.token_allowlist.includes(candidate.base_asset) && policy.token_allowlist.includes(candidate.quote_asset), "TOKEN_NOT_ALLOWLISTED", "Token is not allowlisted");
  invariant(policy.route_allowlist.includes(candidate.route_id), "ROUTE_NOT_ALLOWLISTED", "Route is not allowlisted");
  invariant(candidate.treasury === policy.fixed_treasury, "WRONG_TRADING_TREASURY", "Candidate treasury is not the fixed trading treasury");
  invariant(candidate.beneficiary === policy.fixed_beneficiary, "WRONG_BENEFICIARY", "Candidate beneficiary is not fixed by policy");
  invariant(unsigned(candidate.base_amount, "base_amount") <= BigInt(policy.max_trade_amount), "MAX_TRADE_AMOUNT_EXCEEDED", "Trade amount exceeds policy");
  invariant(unsigned(exposure.hourly, "hourly exposure") + BigInt(candidate.base_amount) <= BigInt(policy.max_hourly_exposure), "MAX_HOURLY_EXPOSURE_EXCEEDED", "Hourly exposure exceeds policy");
  invariant(unsigned(exposure.daily, "daily exposure") + BigInt(candidate.base_amount) <= BigInt(policy.max_daily_exposure), "MAX_DAILY_EXPOSURE_EXCEEDED", "Daily exposure exceeds policy");
  invariant(unsigned(exposure.daily_loss, "daily loss") <= BigInt(policy.max_daily_loss), "DAILY_LOSS_STOP", "Daily loss stop is active");
  invariant(candidate.slippage_bps <= policy.max_slippage_bps, "SLIPPAGE_CAP_EXCEEDED", "Slippage exceeds policy");
  invariant(BigInt(candidate.gas_cost) <= BigInt(policy.gas_ceiling), "GAS_CEILING_EXCEEDED", "Gas cost exceeds policy");
  invariant(candidate.oracle_disagreement_bps <= policy.oracle_disagreement_bps, "ORACLE_DISAGREEMENT", "Oracle disagreement exceeds policy");
  invariant(unsigned(candidate.inventory_after, "inventory_after") <= BigInt(policy.inventory_limit), "INVENTORY_LIMIT_EXCEEDED", "Post-candidate inventory exceeds policy");
  invariant(unsigned(candidate.requested_allowance, "requested_allowance") <= BigInt(policy.allowance_ceiling), "ALLOWANCE_CEILING_EXCEEDED", "Requested allowance exceeds policy");
  invariant(BigInt(candidate.expected_net_profit) > BigInt(policy.minimum_expected_net_profit), "NET_PROFIT_BELOW_MINIMUM", "Expected net profit must strictly exceed the policy minimum");
  if (requireRealTrade) {
    invariant(policy.real_trade_enabled === true, "REAL_TRADE_DISABLED", "Real trade is disabled by the policy box");
    invariant(candidate.adapter_execution_ready === true, "MARKET_ADAPTER_NOT_EXECUTABLE", "All route adapters must be explicitly authorized for real execution");
  }
  return Object.freeze({ status: requireRealTrade ? "REAL_EXECUTION_POLICY_PASS" : "PAPER_POLICY_PASS", receipt_required: policy.receipt_required });
}

export function createPaperTradeCandidate({
  candidateId, lifeId, workerId, capabilityGrant, route, profitability, policy,
  treasury, beneficiary, slippageBps, gasCost, oracleDisagreementBps,
  inventoryAfter = "0", requestedAllowance = "0",
  exposure = { hourly: "0", daily: "0", daily_loss: "0" }, seenCandidateIds = new Set(), createdAt
}) {
  assertCivilizationCapability(capabilityGrant, "PAPER_TRADER", { lifeId, workerId, observedAt: createdAt });
  assertCivilizationCapability(capabilityGrant, "TRADE_PROPOSER", { lifeId, workerId, observedAt: createdAt });
  const candidate = Object.freeze({
    candidate_id: candidateId,
    life_id: lifeId,
    worker_id: workerId,
    route_id: route.route_id,
    base_asset: route.base_asset,
    quote_asset: route.quote_asset,
    base_amount: route.base_amount,
    buy_market: route.buy_market,
    sell_market: route.sell_market,
    gross_profit: profitability.gross_profit,
    total_cost: profitability.total_cost,
    expected_net_profit: profitability.expected_net_profit,
    gas_cost: String(gasCost),
    slippage_bps: slippageBps,
    oracle_disagreement_bps: oracleDisagreementBps,
    inventory_after: String(inventoryAfter),
    requested_allowance: String(requestedAllowance),
    adapter_execution_ready: route.adapter_execution_ready,
    treasury,
    beneficiary,
    mode: "PAPER_ONLY",
    chain_write: false,
    payment: false,
    created_at: createdAt
  });
  const policyResult = evaluateTradingPolicyBox({ policy, candidate, exposure, seenCandidateIds, requireRealTrade: false });
  return Object.freeze({ ...candidate, policy_status: policyResult.status, authorization_status: "REAL_EXECUTION_NOT_AUTHORIZED" });
}

export function recordPaperTradeReceipt({ receiptId, candidate, seenReceiptIds = new Set(), observedAt }) {
  invariant(typeof receiptId === "string" && receiptId.length > 0, "PAPER_RECEIPT_ID_REQUIRED", "Paper receipt ID is required");
  invariant(!seenReceiptIds.has(receiptId), "DUPLICATE_RECEIPT", "Paper receipt was already recorded");
  invariant(candidate?.mode === "PAPER_ONLY" && candidate.chain_write === false, "PAPER_RECEIPT_BOUNDARY", "Only a non-chain paper candidate can create a paper receipt");
  return Object.freeze({
    receipt_id: receiptId,
    candidate_id: candidate.candidate_id,
    receipt_type: "PAPER_SIMULATION",
    expected_net_profit: candidate.expected_net_profit,
    realized_pnl: null,
    chain_id: null,
    tx_hash: null,
    chain_write: false,
    observed_at: observedAt
  });
}
