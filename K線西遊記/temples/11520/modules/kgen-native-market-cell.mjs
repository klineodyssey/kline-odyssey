const SCALE = 10n ** 18n;
const QUOTE_STATUS = "UNFROZEN_CANDIDATE";
const MARKET_CELL_COORDINATE = "0.00011520";
const MARKET_CELL_COORDINATE_ROLE = "KGEN_UNIVERSE_PRICE_AND_COMPANY_ADDRESS";
const COMPANY_ADDRESS = "0.00011520";
const COMPANY_K_COORDINATE = "K11520";
const KGEN_PRICE_COORDINATE_UNIT = "USD_PER_KGEN";

function parseDecimal(value, label = "value") {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new TypeError(`${label} must be a positive decimal string`);
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > 18) throw new RangeError(`${label} supports at most 18 decimals`);
  const raw = BigInt(whole) * SCALE + BigInt((fraction + "0".repeat(18)).slice(0, 18));
  if (raw <= 0n) throw new RangeError(`${label} must be > 0`);
  return raw;
}

function formatDecimal(raw) {
  const whole = raw / SCALE;
  const fraction = String(raw % SCALE).padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function normalizeActorId(value, label) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "anonymous" || normalized === "anon") {
    throw new TypeError(`${label} must be a non-anonymous actor/Life identifier`);
  }
  if (!/^[a-z0-9][a-z0-9:._-]{2,127}$/.test(normalized)) {
    throw new TypeError(`${label} must be 3-128 normalized actor/Life characters`);
  }
  return normalized;
}

function normalizeEvidenceId(value) {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(normalized)) {
    throw new TypeError("verified actor evidence_id must be 3-128 canonical characters");
  }
  return normalized;
}

function resolveVerifiedActorContext({ actorContext, verifyActorContext, timestampMs, purpose, marketId }) {
  if (typeof verifyActorContext !== "function") throw new Error("ACTOR_CONTEXT_VERIFIER_REQUIRED");
  let verified;
  try {
    verified = verifyActorContext(actorContext, Object.freeze({ purpose, market_id: marketId, observed_at_ms: timestampMs }));
  } catch {
    throw new Error("ACTOR_CONTEXT_VERIFICATION_FAILED");
  }
  if (!verified || typeof verified !== "object" || verified.authentication_status !== "VERIFIED") {
    throw new Error("ACTOR_CONTEXT_NOT_VERIFIED");
  }

  const actorId = normalizeActorId(verified.actor_id, "verified actor_id");
  const controllerId = normalizeActorId(verified.controller_id, "verified controller_id");
  const authenticationMethod = String(verified.authentication_method ?? "").trim();
  if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(authenticationMethod)) {
    throw new TypeError("verified authentication_method must be canonical");
  }
  const evidenceId = normalizeEvidenceId(verified.evidence_id);
  const issuedAtMs = Date.parse(String(verified.issued_at ?? ""));
  if (!Number.isFinite(issuedAtMs) || issuedAtMs > timestampMs) throw new Error("ACTOR_CONTEXT_ISSUED_AT_INVALID");

  let expiresAt = null;
  if (verified.expires_at !== null && verified.expires_at !== undefined) {
    const expiresAtMs = Date.parse(String(verified.expires_at));
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < issuedAtMs || timestampMs > expiresAtMs) {
      throw new Error("ACTOR_CONTEXT_EXPIRED");
    }
    expiresAt = new Date(expiresAtMs).toISOString();
  }

  const sessionId = verified.session_id === null || verified.session_id === undefined
    ? null
    : normalizeEvidenceId(verified.session_id);
  return Object.freeze({
    actorId,
    controllerId,
    authenticationStatus: "VERIFIED",
    authenticationMethod,
    evidenceId,
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt,
    sessionId
  });
}

function cloneOrder(order) {
  return {
    id: order.id,
    side: order.side,
    owner: order.owner,
    controller: order.controller,
    actorAuthority: { ...order.actorAuthority },
    price: formatDecimal(order.price),
    quantity: formatDecimal(order.quantity),
    remaining: formatDecimal(order.remaining),
    createdAt: order.createdAt,
    sequence: order.sequence
  };
}

function normalizeSide(side) {
  const normalized = String(side).toUpperCase();
  if (normalized !== "BUY" && normalized !== "SELL") throw new TypeError("side must be BUY or SELL");
  return normalized;
}

function bucketStart(timestampMs, intervalMs) {
  return Math.floor(timestampMs / intervalMs) * intervalMs;
}

/**
 * 11520 KGEN native market-cell engine.
 *
 * PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME
 *
 * Canon / integrity boundary:
 * - `0.00011520` is the fixed K11520 Company address and KGEN Universe
 *   USD-per-KGEN price coordinate.
 * - The fixed coordinate NEVER seeds, fixes or influences matched-trade CT.
 * - CT is undefined before the first valid matched trade.
 * - CT becomes exactly the most recent native 11520 matched trade price.
 * - PancakeSwap/WBNB/USD/L-P data are not pricing inputs.
 * - Anonymous actors, same-owner matches and same-controller matches fail closed.
 * - This module has no signer, custody, settlement, transfer, approval, chain-write or Mainnet authority.
 */
function createVerified11520PaperMarketCell({
  marketId,
  baseAsset,
  baseDecimals,
  quoteAsset,
  quoteDecimals,
  priceStatus,
  tickSize = "0.00000001",
  lotSize = "0.00000001",
  candleIntervalMs = 60_000,
  clock = () => Date.now(),
  verifyActorContext
} = {}) {
  if (!Number.isSafeInteger(candleIntervalMs) || candleIntervalMs <= 0) {
    throw new RangeError("candleIntervalMs must be a positive safe integer");
  }
  if (typeof verifyActorContext !== "function") throw new Error("ACTOR_CONTEXT_VERIFIER_REQUIRED");

  const tickRaw = parseDecimal(tickSize, "tickSize");
  const lotRaw = parseDecimal(lotSize, "lotSize");
  const bids = [];
  const asks = [];
  const trades = [];
  const candles = new Map();
  let nextOrder = 1;
  let sequence = 1;
  let ct = null;

  const compareBid = (a, b) => (a.price === b.price ? a.sequence - b.sequence : a.price > b.price ? -1 : 1);
  const compareAsk = (a, b) => (a.price === b.price ? a.sequence - b.sequence : a.price < b.price ? -1 : 1);

  function sortBooks() {
    bids.sort(compareBid);
    asks.sort(compareAsk);
  }

  function updateCandle(trade) {
    const start = bucketStart(trade.timestampMs, candleIntervalMs);
    const existing = candles.get(start);
    if (!existing) {
      candles.set(start, {
        startTime: new Date(start).toISOString(),
        endTime: new Date(start + candleIntervalMs).toISOString(),
        open: trade.priceRaw,
        high: trade.priceRaw,
        low: trade.priceRaw,
        close: trade.priceRaw,
        volume: trade.quantityRaw,
        trades: 1
      });
      return;
    }
    if (trade.priceRaw > existing.high) existing.high = trade.priceRaw;
    if (trade.priceRaw < existing.low) existing.low = trade.priceRaw;
    existing.close = trade.priceRaw;
    existing.volume += trade.quantityRaw;
    existing.trades += 1;
  }

  function assertNoSelfMatch(taker) {
    const opposite = taker.side === "BUY" ? asks : bids;
    let remaining = taker.remaining;
    for (const maker of opposite) {
      if (remaining <= 0n) break;
      const crosses = taker.side === "BUY" ? taker.price >= maker.price : taker.price <= maker.price;
      if (!crosses) break;
      if (maker.owner === taker.owner) throw new Error("SELF_MATCH_FORBIDDEN_SAME_OWNER");
      if (maker.controller === taker.controller) throw new Error("SELF_MATCH_FORBIDDEN_SAME_CONTROLLER");
      remaining -= remaining < maker.remaining ? remaining : maker.remaining;
    }
  }

  function executeTrade({ maker, taker, quantity, price, timestampMs }) {
    const trade = {
      id: `T${trades.length + 1}`,
      marketId,
      baseAsset,
      quoteAsset,
      priceRaw: price,
      quantityRaw: quantity,
      price: formatDecimal(price),
      quantity: formatDecimal(quantity),
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      makerSide: maker.side,
      takerSide: taker.side,
      makerOwner: maker.owner,
      takerOwner: taker.owner,
      makerController: maker.controller,
      takerController: taker.controller,
      makerActorEvidenceId: maker.actorAuthority.evidenceId,
      takerActorEvidenceId: taker.actorAuthority.evidenceId,
      timestampMs,
      timestamp: new Date(timestampMs).toISOString()
    };
    trades.push(trade);
    ct = price;
    updateCandle(trade);
    return trade;
  }

  function match(taker, timestampMs) {
    assertNoSelfMatch(taker);
    const opposite = taker.side === "BUY" ? asks : bids;
    const fills = [];

    while (taker.remaining > 0n && opposite.length) {
      const maker = opposite[0];
      const crosses = taker.side === "BUY" ? taker.price >= maker.price : taker.price <= maker.price;
      if (!crosses) break;

      const quantity = taker.remaining < maker.remaining ? taker.remaining : maker.remaining;
      const trade = executeTrade({ maker, taker, quantity, price: maker.price, timestampMs });
      fills.push(trade);
      taker.remaining -= quantity;
      maker.remaining -= quantity;
      if (maker.remaining === 0n) opposite.shift();
    }

    return fills;
  }

  function placeOrder({ side, price, quantity, actorContext }) {
    const normalizedSide = normalizeSide(side);
    const priceRaw = parseDecimal(price, "price");
    const quantityRaw = parseDecimal(quantity, "quantity");
    if (priceRaw % tickRaw !== 0n) throw new RangeError("price must align to tickSize");
    if (quantityRaw % lotRaw !== 0n) throw new RangeError("quantity must align to lotSize");
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorContext,
      verifyActorContext,
      timestampMs,
      purpose: "PLACE_ORDER",
      marketId
    });

    const order = {
      id: `O${nextOrder++}`,
      side: normalizedSide,
      owner: authority.actorId,
      controller: authority.controllerId,
      actorAuthority: {
        authenticationStatus: authority.authenticationStatus,
        authenticationMethod: authority.authenticationMethod,
        evidenceId: authority.evidenceId,
        issuedAt: authority.issuedAt,
        expiresAt: authority.expiresAt,
        sessionId: authority.sessionId
      },
      price: priceRaw,
      quantity: quantityRaw,
      remaining: quantityRaw,
      createdAt: new Date(timestampMs).toISOString(),
      sequence: sequence++
    };

    const fills = match(order, timestampMs);
    if (order.remaining > 0n) {
      (normalizedSide === "BUY" ? bids : asks).push(order);
      sortBooks();
    }

    return {
      order: cloneOrder(order),
      fills: fills.map(({ priceRaw, quantityRaw, ...trade }) => ({ ...trade })),
      ct: ct === null ? null : formatDecimal(ct)
    };
  }

  function cancelOrder(orderId, actorContext) {
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorContext,
      verifyActorContext,
      timestampMs,
      purpose: "CANCEL_ORDER",
      marketId
    });
    for (const book of [bids, asks]) {
      const index = book.findIndex((order) => order.id === orderId);
      if (index < 0) continue;
      const order = book[index];
      if (order.owner !== authority.actorId || order.controller !== authority.controllerId) {
        throw new Error("CANCEL_AUTHORIZATION_FAILED");
      }
      return cloneOrder(book.splice(index, 1)[0]);
    }
    return null;
  }

  function getOrderBook(depth = 20) {
    const size = Math.max(1, Math.min(200, Number(depth) || 20));
    return {
      bids: bids.slice(0, size).map(cloneOrder),
      asks: asks.slice(0, size).map(cloneOrder),
      bestBid: bids[0] ? formatDecimal(bids[0].price) : null,
      bestAsk: asks[0] ? formatDecimal(asks[0].price) : null
    };
  }

  function getMarketState() {
    const book = getOrderBook(1);
    return Object.freeze({
      marketId,
      marketCellCoordinate: MARKET_CELL_COORDINATE,
      marketCellCoordinateRole: MARKET_CELL_COORDINATE_ROLE,
      companyAddress: COMPANY_ADDRESS,
      companyKCoordinate: COMPANY_K_COORDINATE,
      kgenUniversePriceCoordinate: MARKET_CELL_COORDINATE,
      kgenUniversePriceCoordinateUnit: KGEN_PRICE_COORDINATE_UNIT,
      runtimeStatus: "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME",
      baseAsset,
      baseDecimals,
      quoteAsset,
      quoteStatus: QUOTE_STATUS,
      quoteDecimals,
      tickSize: formatDecimal(tickRaw),
      lotSize: formatDecimal(lotRaw),
      priceStatus,
      pricingAuthority: "NATIVE_11520_MATCHED_BUY_SELL_TRADES_ONLY",
      externalReferencePriceAuthority: false,
      ct: ct === null ? null : formatDecimal(ct),
      nativeMatchedTradeCT: ct === null ? null : formatDecimal(ct),
      ctMeaning: "CURRENT_NATIVE_MATCHED_TRADE_PRICE_UNIVERSE_BOUNDARY",
      bestBid: book.bestBid,
      bestAsk: book.bestAsk,
      tradeCount: trades.length,
      selfMatchPolicy: "FAIL_CLOSED_SAME_OWNER_OR_CONTROLLER",
      anonymousActorPolicy: "FORBIDDEN",
      actorAuthentication: "INDEPENDENT_VERIFIER_REQUIRED",
      callerAssertedIdentityAuthority: false,
      settlement: "PAPER_IN_MEMORY_NO_ASSET_TRANSFER",
      chainWrite: false,
      signer: false
    });
  }

  function getTrades(limit = 100) {
    const size = Math.max(1, Math.min(1000, Number(limit) || 100));
    return trades.slice(-size).map(({ priceRaw, quantityRaw, ...trade }) => ({ ...trade }));
  }

  function getCandles(limit = 100) {
    const rows = [...candles.values()].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
    const size = Math.max(1, Math.min(1000, Number(limit) || 100));
    return rows.slice(-size).map((candle) => ({
      startTime: candle.startTime,
      endTime: candle.endTime,
      open: formatDecimal(candle.open),
      high: formatDecimal(candle.high),
      low: formatDecimal(candle.low),
      close: formatDecimal(candle.close),
      volume: formatDecimal(candle.volume),
      trades: candle.trades
    }));
  }

  return Object.freeze({
    placeOrder,
    cancelOrder,
    getOrderBook,
    getMarketState,
    getTrades,
    getCandles
  });
}

export function createKgenNativeMarketCell(options = {}) {
  return createVerified11520PaperMarketCell({
    ...options,
    marketId: options.marketId ?? "11520_KGEN_NATIVE_MARKET",
    baseAsset: "KGEN",
    baseDecimals: 18,
    quoteAsset: "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE",
    quoteDecimals: 18,
    priceStatus: "NATIVE_MARKET_PRICE_CANDIDATE"
  });
}

/**
 * Paper-only GPU market at the assigned K11520 company/exchange address.
 *
 * The quote book is isolated by asset: GPU/KGEN and GPU/KAIOS never share
 * orders, CT, OHLC or volume. A caller still needs a verified actor context;
 * this function adds no custody, settlement, signer or chain-write ability.
 */
export function createGpu11520PaperMarket({ quoteAsset, ...options } = {}) {
  const normalizedQuote = String(quoteAsset ?? "").trim().toUpperCase();
  if (!new Set(["KGEN", "KAIOS"]).has(normalizedQuote)) {
    throw new Error("GPU_QUOTE_ASSET_NOT_ALLOWED");
  }
  return createVerified11520PaperMarketCell({
    ...options,
    marketId: options.marketId ?? `11520_NVIDIA_GPU_${normalizedQuote}_PAPER_MARKET`,
    baseAsset: "NVIDIA_GPU_CHIP",
    baseDecimals: 0,
    quoteAsset: normalizedQuote,
    quoteDecimals: 18,
    lotSize: options.lotSize ?? "1",
    priceStatus: `GPU_${normalizedQuote}_MARKET_PRICE_CANDIDATE`
  });
}

const GPU_REAL_TRADE_GATE_ORDER = Object.freeze([
  "REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED",
  "INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED",
  "VERIFIED_GPU_INVENTORY_REQUIRED",
  "VERIFIED_GPU_OWNERSHIP_REQUIRED",
  "VERIFIED_GPU_CARGO_REQUIRED",
  "VERIFIED_K12345_TO_K11520_TRANSPORT_REQUIRED",
  "VERIFIED_K11520_WAREHOUSE_RECEIPT_REQUIRED",
  "FUNDED_TRADING_CAPITAL_REQUIRED",
  "PRODUCTION_MARKET_NOT_VERIFIED",
  "TRADING_POLICY_BOX_NOT_VERIFIED",
  "PRODUCTION_SETTLEMENT_NOT_VERIFIED",
  "SECURE_SIGNER_NOT_CONNECTED",
  "DISTINCT_T2_REVIEW_NOT_VERIFIED",
  "FORK_SIMULATION_NOT_VERIFIED"
]);

function canonicalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function exactEvidence(value) {
  return /^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(canonicalText(value));
}

function positiveAtomic(value) {
  return /^\d+$/.test(String(value ?? "")) && BigInt(value) > 0n;
}

/**
 * Read-only gate for a future real NVIDIA GPU trade at K11520.
 *
 * This evaluator deliberately has no provider, signer, allowance, transfer,
 * settlement or broadcast method. The injected verifier callback is a schema
 * probe only and is not repository-bound authority. Until a repository-bound
 * verifier is wired, every result remains BLOCKED_FAIL_CLOSED.
 */
export function evaluateGpu11520RealTradeReadiness({
  evidenceBundle,
  verifyEvidenceBundle,
  executorLifeId = "LIFE-CODEX-GM-0001",
  executorControllerId = "codex-gm-01"
} = {}) {
  const blockers = ["REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED"];
  let verified = null;
  if (typeof verifyEvidenceBundle === "function") {
    try {
      const candidate = verifyEvidenceBundle(evidenceBundle, Object.freeze({
        purpose: "GPU_11520_REAL_TRADE_READINESS",
        company_address: COMPANY_ADDRESS,
        company_k_coordinate: COMPANY_K_COORDINATE,
        route: "K12345_TO_K11520"
      }));
      if (candidate?.verification_status === "VERIFIED"
        && exactEvidence(candidate?.evidence_root)
        && Number.isSafeInteger(candidate?.observed_block)
        && candidate.observed_block > 0) {
        verified = candidate;
      }
    } catch {
      verified = null;
    }
  }
  if (!verified) blockers.push("INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED");

  const inventory = verified?.inventory;
  const transport = verified?.transport;
  const warehouse = verified?.warehouse;
  const capital = verified?.capital;
  const market = verified?.market;
  const policyBox = verified?.policy_box;
  const settlement = verified?.settlement;
  const signer = verified?.signer;
  const independentReview = verified?.independent_review;
  const forkSimulation = verified?.fork_simulation;
  const quoteAsset = canonicalText(market?.quote_asset).toUpperCase();

  const inventoryVerified = inventory?.status === "VERIFIED_REAL_INVENTORY"
    && inventory?.asset_type === "NVIDIA_GPU_CHIP"
    && canonicalText(inventory?.manufacturer).toUpperCase() === "NVIDIA"
    && canonicalText(inventory?.model)
    && canonicalText(inventory?.serial_number)
    && exactEvidence(inventory?.supplier_evidence_id)
    && positiveAtomic(inventory?.acquisition_cost_atomic)
    && inventory?.paper_simulation === false;
  if (!inventoryVerified) blockers.push("VERIFIED_GPU_INVENTORY_REQUIRED");

  if (!(inventoryVerified
    && exactEvidence(inventory?.ownership_certificate_id)
    && canonicalText(inventory?.owner_life_or_company_id))) {
    blockers.push("VERIFIED_GPU_OWNERSHIP_REQUIRED");
  }

  if (!(inventoryVerified
    && exactEvidence(inventory?.cargo_receipt_id)
    && canonicalText(inventory?.cargo_serial_number) === canonicalText(inventory?.serial_number))) {
    blockers.push("VERIFIED_GPU_CARGO_REQUIRED");
  }

  const costFields = ["energy", "food", "labor", "insurance", "warehouse", "risk_reserve"];
  const transportVerified = transport?.status === "VERIFIED_DELIVERED"
    && transport?.origin === "K12345"
    && transport?.destination === "K11520"
    && transport?.distance_km === "18778.422548555"
    && canonicalText(transport?.vehicle_id)
    && positiveAtomic(transport?.payload_mass_grams)
    && exactEvidence(transport?.delivery_evidence_id)
    && costFields.every((field) => /^\d+$/.test(String(transport?.costs_atomic?.[field] ?? "")));
  if (!transportVerified) blockers.push("VERIFIED_K12345_TO_K11520_TRANSPORT_REQUIRED");

  const warehouseVerified = warehouse?.status === "VERIFIED_IN_CUSTODY"
    && warehouse?.location === "K11520"
    && canonicalText(warehouse?.serial_number) === canonicalText(inventory?.serial_number)
    && exactEvidence(warehouse?.receipt_id)
    && warehouse?.replay_protected === true;
  if (!warehouseVerified) blockers.push("VERIFIED_K11520_WAREHOUSE_RECEIPT_REQUIRED");

  const capitalVerified = capital?.status === "FUNDED_VERIFIED"
    && ["KGEN", "KAIOS"].includes(quoteAsset)
    && capital?.asset === quoteAsset
    && positiveAtomic(capital?.available_atomic)
    && positiveAtomic(capital?.required_atomic)
    && BigInt(capital.available_atomic) >= BigInt(capital.required_atomic)
    && exactEvidence(capital?.funding_receipt_id)
    && capital?.segregated_from_payroll === true
    && capital?.segregated_from_reserves === true;
  if (!capitalVerified) blockers.push("FUNDED_TRADING_CAPITAL_REQUIRED");

  const marketVerified = ["KGEN", "KAIOS"].includes(quoteAsset)
    && market?.market_id === `11520_NVIDIA_GPU_${quoteAsset}_MARKET`
    && market?.status === "ACTIVE_VERIFIED"
    && market?.asset_allowlisted === true
    && market?.route_allowlisted === true
    && market?.price_fresh === true
    && market?.oracle_disagreement_within_limit === true
    && exactEvidence(market?.registry_evidence_id);
  if (!marketVerified) blockers.push("PRODUCTION_MARKET_NOT_VERIFIED");

  const requiredPolicyFields = [
    "max_trade_amount_atomic", "max_hourly_exposure_atomic", "max_daily_exposure_atomic",
    "max_daily_loss_atomic", "max_slippage_bps", "gas_ceiling_wei",
    "minimum_expected_net_profit_atomic", "allowance_ceiling_atomic"
  ];
  const policyVerified = policyBox?.status === "VERIFIED_ACTIVE"
    && policyBox?.chain_id === 56
    && policyBox?.treasury_account_id === capital?.account_id
    && canonicalText(policyBox?.fixed_beneficiary)
    && exactEvidence(policyBox?.policy_id)
    && requiredPolicyFields.every((field) => /^\d+$/.test(String(policyBox?.[field] ?? "")))
    && policyBox?.emergency_pause === false
    && policyBox?.nonce_replay_protection === true
    && policyBox?.receipt_required === true;
  if (!policyVerified) blockers.push("TRADING_POLICY_BOX_NOT_VERIFIED");

  const settlementVerified = settlement?.status === "VERIFIED_PRODUCTION_ADAPTER"
    && settlement?.chain_id === 56
    && canonicalText(settlement?.beneficiary).toLowerCase() === canonicalText(policyBox?.fixed_beneficiary).toLowerCase()
    && settlement?.inventory_serial_number === inventory?.serial_number
    && settlement?.replay_protected === true
    && settlement?.atomic_delivery === true
    && exactEvidence(settlement?.adapter_evidence_id);
  if (!settlementVerified) blockers.push("PRODUCTION_SETTLEMENT_NOT_VERIFIED");

  const signerVerified = signer?.status === "CONNECTED_SECURE_RUNTIME"
    && signer?.chain_id === 56
    && /^0x[0-9a-fA-F]{40}$/.test(canonicalText(signer?.wallet_address))
    && signer?.wallet_address.toLowerCase() === canonicalText(policyBox?.fixed_beneficiary).toLowerCase()
    && signer?.private_key_exposed === false
    && signer?.raw_key_exportable === false
    && exactEvidence(signer?.connection_evidence_id);
  if (!signerVerified) blockers.push("SECURE_SIGNER_NOT_CONNECTED");

  const distinctReviewVerified = independentReview?.status === "PASS"
    && Number.isInteger(independentReview?.trust_level)
    && independentReview.trust_level >= 2
    && canonicalText(independentReview?.reviewer_life_id)
    && canonicalText(independentReview?.reviewer_controller_id)
    && canonicalText(independentReview.reviewer_life_id).toLowerCase() !== canonicalText(executorLifeId).toLowerCase()
    && canonicalText(independentReview.reviewer_controller_id).toLowerCase() !== canonicalText(executorControllerId).toLowerCase()
    && exactEvidence(independentReview?.exact_head_sha);
  if (!distinctReviewVerified) blockers.push("DISTINCT_T2_REVIEW_NOT_VERIFIED");

  const forkVerified = forkSimulation?.status === "PASS_NO_BROADCAST"
    && forkSimulation?.chain_id === 56
    && forkSimulation?.broadcast === false
    && forkSimulation?.atomic_rollback_tested === true
    && forkSimulation?.mass_and_accounting_conservation === true
    && exactEvidence(forkSimulation?.evidence_id);
  if (!forkVerified) blockers.push("FORK_SIMULATION_NOT_VERIFIED");

  const orderedBlockers = GPU_REAL_TRADE_GATE_ORDER.filter((code) => blockers.includes(code));
  return Object.freeze({
    company_address: COMPANY_ADDRESS,
    company_k_coordinate: COMPANY_K_COORDINATE,
    route: "K12345_TO_K11520",
    evidence_root: verified?.evidence_root ?? null,
    observed_block: verified?.observed_block ?? null,
    quote_asset: quoteAsset || null,
    status: orderedBlockers.length === 0
      ? "READY_FOR_SEPARATE_EXECUTION_REVIEW"
      : "BLOCKED_FAIL_CLOSED",
    blockers: Object.freeze(orderedBlockers),
    real_trade_enabled: false,
    transaction_payload: null,
    signer_requested: false,
    chain_write: false
  });
}
