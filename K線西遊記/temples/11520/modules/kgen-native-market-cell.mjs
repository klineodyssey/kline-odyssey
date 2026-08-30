const SCALE = 10n ** 18n;
const BASE_ASSET = "KGEN";
const BASE_DECIMALS = 18;
const QUOTE_ASSET = "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE";
const QUOTE_STATUS = "UNFROZEN_CANDIDATE";
const QUOTE_DECIMALS = 18;
const MARKET_CELL_COORDINATE = "0.00011520";
const MARKET_CELL_COORDINATE_ROLE = "CANDIDATE_KGEN_UNIVERSE_PRICE_AND_COMPANY_ADDRESS";
const MARKET_CELL_COORDINATE_STATUS = "UNVERIFIED_CANDIDATE";
const MARKET_CELL_COORDINATE_AUTHORITY = null;
const COMPANY_ADDRESS = "0.00011520";
const COMPANY_K_COORDINATE = "K11520";
const KGEN_PRICE_COORDINATE_UNIT = "USD_PER_KGEN";
const CANONICAL_SETTLEMENT_ATTESTATIONS = Object.freeze({});
const TEST_ONLY_MARKET_ID = "TEST_ONLY_11520_KGEN_NATIVE_MARKET";

function repositoryTestActor({ marketId = TEST_ONLY_MARKET_ID, purpose, actorId, controllerId, evidenceId, expiresAt = null }) {
  return Object.freeze({
    market_id: marketId,
    purpose,
    actor_id: actorId,
    controller_id: controllerId,
    authentication_status: "VERIFIED_TEST_FIXTURE",
    authentication_method: "REPOSITORY_TEST_FIXTURE",
    evidence_id: evidenceId,
    issued_at: "2026-08-22T14:00:00.000Z",
    expires_at: expiresAt,
    session_id: `SESSION-${evidenceId}`
  });
}

const CANONICAL_ACTOR_CONTEXT_ATTESTATIONS = Object.freeze({
  "TEST-ACTOR-A-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-a", controllerId: "ctrl:test-a", evidenceId: "TEST-ACTOR-A-PLACE" }),
  "TEST-ACTOR-A-CANCEL": repositoryTestActor({ purpose: "CANCEL_ORDER", actorId: "life:test-a", controllerId: "ctrl:test-a", evidenceId: "TEST-ACTOR-A-CANCEL" }),
  "TEST-ACTOR-B-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-b", controllerId: "ctrl:test-b", evidenceId: "TEST-ACTOR-B-PLACE" }),
  "TEST-ACTOR-B-CANCEL": repositoryTestActor({ purpose: "CANCEL_ORDER", actorId: "life:test-b", controllerId: "ctrl:test-b", evidenceId: "TEST-ACTOR-B-CANCEL" }),
  "TEST-SAME-OWNER-C1-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-same", controllerId: "ctrl:test-c1", evidenceId: "TEST-SAME-OWNER-C1-PLACE" }),
  "TEST-SAME-OWNER-C2-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-same", controllerId: "ctrl:test-c2", evidenceId: "TEST-SAME-OWNER-C2-PLACE" }),
  "TEST-SHARED-CONTROLLER-A-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-shared-a", controllerId: "ctrl:test-shared", evidenceId: "TEST-SHARED-CONTROLLER-A-PLACE" }),
  "TEST-SHARED-CONTROLLER-B-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-shared-b", controllerId: "ctrl:test-shared", evidenceId: "TEST-SHARED-CONTROLLER-B-PLACE" }),
  "TEST-EXPIRED-ACTOR-PLACE": repositoryTestActor({ purpose: "PLACE_ORDER", actorId: "life:test-expired", controllerId: "ctrl:test-expired", evidenceId: "TEST-EXPIRED-ACTOR-PLACE", expiresAt: "2026-08-22T14:59:59.999Z" })
});

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

function normalizeNonce(value, label = "nonce") {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{7,127}$/.test(normalized)) {
    throw new TypeError(`${label} must be 8-128 canonical characters`);
  }
  return normalized;
}

function resolveVerifiedActorContext({ actorAttestationId, timestampMs, purpose, marketId }) {
  if (marketId !== TEST_ONLY_MARKET_ID) throw new Error("ACTOR_CONTEXT_ATTESTATION_REGISTRY_NOT_CONNECTED");
  const normalizedAttestationId = normalizeEvidenceId(actorAttestationId);
  const verified = CANONICAL_ACTOR_CONTEXT_ATTESTATIONS[normalizedAttestationId];
  if (!verified) throw new Error("ACTOR_CONTEXT_ATTESTATION_NOT_FOUND");
  if (
    verified.market_id !== marketId
    || verified.purpose !== purpose
    || verified.evidence_id !== normalizedAttestationId
    || verified.authentication_status !== "VERIFIED_TEST_FIXTURE"
    || verified.authentication_method !== "REPOSITORY_TEST_FIXTURE"
  ) throw new Error("ACTOR_CONTEXT_ATTESTATION_BINDING_MISMATCH");
  const actorId = normalizeActorId(verified.actor_id, "verified actor_id");
  const controllerId = normalizeActorId(verified.controller_id, "verified controller_id");
  const evidenceId = normalizeEvidenceId(verified.evidence_id);
  const issuedAtMs = Date.parse(String(verified.issued_at ?? ""));
  if (!Number.isFinite(issuedAtMs) || issuedAtMs > timestampMs) throw new Error("ACTOR_CONTEXT_ISSUED_AT_INVALID");
  let expiresAt = null;
  if (verified.expires_at !== null && verified.expires_at !== undefined) {
    const expiresAtMs = Date.parse(String(verified.expires_at));
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < issuedAtMs || timestampMs > expiresAtMs) throw new Error("ACTOR_CONTEXT_EXPIRED");
    expiresAt = new Date(expiresAtMs).toISOString();
  }
  const sessionId = verified.session_id === null || verified.session_id === undefined ? null : normalizeEvidenceId(verified.session_id);
  return Object.freeze({ actorId, controllerId, authenticationStatus: "VERIFIED_TEST_FIXTURE", authenticationMethod: verified.authentication_method, evidenceId, issuedAt: new Date(issuedAtMs).toISOString(), expiresAt, sessionId });
}

function cloneOrder(order) {
  return {
    id: order.id,
    side: order.side,
    owner: order.owner,
    controller: order.controller,
    actorAuthority: { ...order.actorAuthority },
    nonce: order.nonce,
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
 * - `0.00011520` is a preserved candidate K11520 Company-address and
 *   USD-per-KGEN price-coordinate value. This module establishes no
 *   repository-bound Human authority for that dual role.
 * - The fixed coordinate NEVER seeds, fixes or influences matched-trade CT.
 * - CT is undefined before the first repository-attested settled trade.
 * - CT becomes exactly the most recent repository-attested settled trade price.
 * - PancakeSwap/WBNB/USD/L-P data are not pricing inputs.
 * - Actor authority must resolve from repository-owned, exact-market and exact-purpose attestations.
 * - The production actor-attestation registry is intentionally not connected; repository test fixtures
 *   are accepted only by the exact TEST_ONLY_11520_KGEN_NATIVE_MARKET identifier.
 * - Anonymous actors, same-owner matches and same-controller matches fail closed.
 * - This module has no signer, custody, settlement, transfer, approval, chain-write or Mainnet authority.
 */
export function createKgenNativeMarketCell({
  marketId = "11520_KGEN_NATIVE_MARKET",
  tickSize = "0.00000001",
  lotSize = "0.00000001",
  candleIntervalMs = 60_000,
  clock = () => Date.now(),
  verifyActorContext,
  actorAttestationRegistry
} = {}) {
  if (!Number.isSafeInteger(candleIntervalMs) || candleIntervalMs <= 0) {
    throw new RangeError("candleIntervalMs must be a positive safe integer");
  }
  if (verifyActorContext !== undefined) throw new Error("CALLER_SUPPLIED_ACTOR_CONTEXT_VERIFIER_FORBIDDEN");
  if (actorAttestationRegistry !== undefined) throw new Error("CALLER_SUPPLIED_ACTOR_ATTESTATION_REGISTRY_FORBIDDEN");

  const tickRaw = parseDecimal(tickSize, "tickSize");
  const lotRaw = parseDecimal(lotSize, "lotSize");
  const bids = [];
  const asks = [];
  const trades = [];
  const candles = new Map();
  const consumedActionKeys = new Set();
  const consumedSettlementAttestations = new Set();
  const consumedSettlementRequestKeys = new Set();
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
      baseAsset: BASE_ASSET,
      quoteAsset: QUOTE_ASSET,
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
      settlementStatus: "MATCHED_UNSETTLED",
      settlementEvidence: null,
      ownershipTransfer: null,
      receipt: null,
      ctEligible: false,
      timestampMs,
      timestamp: new Date(timestampMs).toISOString()
    };
    trades.push(trade);
    return trade;
  }

  function match(taker, timestampMs) {
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

  function placeOrder({ side, price, quantity, actorAttestationId, actorContext, nonce }) {
    if (actorContext !== undefined) throw new Error("CALLER_ASSERTED_ACTOR_CONTEXT_FORBIDDEN");
    const normalizedSide = normalizeSide(side);
    const priceRaw = parseDecimal(price, "price");
    const quantityRaw = parseDecimal(quantity, "quantity");
    if (priceRaw % tickRaw !== 0n) throw new RangeError("price must align to tickSize");
    if (quantityRaw % lotRaw !== 0n) throw new RangeError("quantity must align to lotSize");
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorAttestationId,
      timestampMs,
      purpose: "PLACE_ORDER",
      marketId
    });
    const normalizedNonce = normalizeNonce(nonce, "order nonce");
    const actionKey = `${marketId}:PLACE_ORDER:${authority.actorId}:${authority.controllerId}:${normalizedNonce}`;
    if (consumedActionKeys.has(actionKey)) throw new Error("ORDER_REPLAY_FORBIDDEN");

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
      nonce: normalizedNonce,
      price: priceRaw,
      quantity: quantityRaw,
      remaining: quantityRaw,
      createdAt: new Date(timestampMs).toISOString(),
      sequence: sequence++
    };

    assertNoSelfMatch(order);
    consumedActionKeys.add(actionKey);
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

  function cancelOrder(orderId, actorAttestationId, nonce) {
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorAttestationId,
      timestampMs,
      purpose: "CANCEL_ORDER",
      marketId
    });
    const normalizedNonce = normalizeNonce(nonce, "cancel nonce");
    const actionKey = `${marketId}:CANCEL_ORDER:${authority.actorId}:${authority.controllerId}:${normalizedNonce}`;
    if (consumedActionKeys.has(actionKey)) throw new Error("CANCEL_REPLAY_FORBIDDEN");
    consumedActionKeys.add(actionKey);
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

  function createSettlementRequestPacket({ tradeId, requestId, replayKey }) {
    const normalizedRequestId = normalizeEvidenceId(requestId);
    const normalizedReplayKey = normalizeNonce(replayKey, "settlement request replay key");
    const actionKey = `${marketId}:SETTLEMENT_REQUEST:${normalizedRequestId}:${normalizedReplayKey}`;
    if (consumedSettlementRequestKeys.has(actionKey)) throw new Error("SETTLEMENT_REQUEST_REPLAY_FORBIDDEN");
    const trade = trades.find((candidate) => candidate.id === tradeId);
    if (!trade) throw new Error("MATCHED_TRADE_NOT_FOUND");
    if (trade.settlementStatus !== "MATCHED_UNSETTLED") throw new Error("SETTLEMENT_REQUEST_REQUIRES_UNSETTLED_MATCH");
    const quoteNumerator = trade.priceRaw * trade.quantityRaw;
    if (quoteNumerator % SCALE !== 0n) throw new Error("SETTLEMENT_QUOTE_AMOUNT_NOT_EXACT_AT_18_DECIMALS");
    const quoteAmountRaw = quoteNumerator / SCALE;
    const makerIsBuyer = trade.makerSide === "BUY";
    consumedSettlementRequestKeys.add(actionKey);
    return Object.freeze({
      settlement_request_id: normalizedRequestId,
      settlement_request_replay_key: normalizedReplayKey,
      market_id: marketId,
      trade_id: trade.id,
      trade_timestamp: trade.timestamp,
      buyer_life_id: makerIsBuyer ? trade.makerOwner : trade.takerOwner,
      buyer_controller_id: makerIsBuyer ? trade.makerController : trade.takerController,
      seller_life_id: makerIsBuyer ? trade.takerOwner : trade.makerOwner,
      seller_controller_id: makerIsBuyer ? trade.takerController : trade.makerController,
      base_asset: trade.baseAsset,
      base_quantity: trade.quantity,
      quote_asset: trade.quoteAsset,
      quote_asset_status: QUOTE_STATUS,
      quote_amount: formatDecimal(quoteAmountRaw),
      payment_purpose: "MARKET_SETTLEMENT",
      chain_id: null,
      token_address: null,
      source_address: null,
      recipient_address: null,
      funding_evidence: null,
      authorization_id: null,
      signer_policy_id: null,
      submitted_tx: null,
      receipt: null,
      ownership_transfer: null,
      payment_rail_eligible: false,
      ct_eligible: false,
      blockers: Object.freeze([
        "QUOTE_ASSET_NOT_FROZEN",
        "BUYER_PAYMENT_ADDRESS_AND_CONTROL_PROOF_NOT_BOUND",
        "SELLER_RECEIPT_ADDRESS_AND_CONTROL_PROOF_NOT_BOUND",
        "MARKET_ESCROW_OR_SOURCE_NOT_BOUND",
        "EXACT_MARKET_SETTLEMENT_AUTHORIZATION_NOT_CONNECTED",
        "SECURE_SIGNER_POLICY_NOT_CONNECTED",
        "SETTLEMENT_RECEIPT_VERIFIER_NOT_CONNECTED",
        "OWNERSHIP_TRANSFER_ADAPTER_NOT_CONNECTED"
      ]),
      status: "MATCH_BOUND_SETTLEMENT_REQUEST_BLOCKED_BEFORE_PAYMENT_RAIL"
    });
  }

  function recordVerifiedSettlement({ tradeId, attestationId }) {
    const normalizedAttestationId = normalizeEvidenceId(attestationId);
    if (consumedSettlementAttestations.has(normalizedAttestationId)) {
      throw new Error("SETTLEMENT_ATTESTATION_REPLAY_FORBIDDEN");
    }
    const attestation = CANONICAL_SETTLEMENT_ATTESTATIONS[normalizedAttestationId];
    if (!attestation) throw new Error("SETTLEMENT_ATTESTATION_REGISTRY_NOT_CONNECTED");
    const trade = trades.find((candidate) => candidate.id === tradeId);
    if (!trade) throw new Error("MATCHED_TRADE_NOT_FOUND");
    if (trade.settlementStatus !== "MATCHED_UNSETTLED") throw new Error("TRADE_ALREADY_SETTLED");
    if (
      attestation.market_id !== marketId
      || attestation.trade_id !== trade.id
      || attestation.base_asset !== trade.baseAsset
      || attestation.quote_asset !== trade.quoteAsset
      || attestation.price !== trade.price
      || attestation.quantity !== trade.quantity
      || attestation.settlement_status !== "VERIFIED_SETTLED"
      || attestation.ownership_transfer_status !== "VERIFIED_TRANSFERRED"
      || attestation.receipt_status !== "VERIFIED"
      || !attestation.receipt_id
    ) {
      throw new Error("SETTLEMENT_ATTESTATION_BINDING_MISMATCH");
    }
    consumedSettlementAttestations.add(normalizedAttestationId);
    trade.settlementStatus = "VERIFIED_SETTLED";
    trade.settlementEvidence = normalizedAttestationId;
    trade.ownershipTransfer = Object.freeze({ status: "VERIFIED_TRANSFERRED", evidence_id: attestation.ownership_transfer_evidence_id });
    trade.receipt = Object.freeze({ status: "VERIFIED", receipt_id: attestation.receipt_id });
    trade.ctEligible = true;
    ct = trade.priceRaw;
    updateCandle(trade);
    const { priceRaw, quantityRaw, ...serialized } = trade;
    return Object.freeze(serialized);
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
      marketCellCoordinateStatus: MARKET_CELL_COORDINATE_STATUS,
      marketCellCoordinateAuthority: MARKET_CELL_COORDINATE_AUTHORITY,
      repositoryBoundHumanCoordinateAuthority: false,
      companyAddress: COMPANY_ADDRESS,
      companyKCoordinate: COMPANY_K_COORDINATE,
      kgenUniversePriceCoordinate: MARKET_CELL_COORDINATE,
      kgenUniversePriceCoordinateUnit: KGEN_PRICE_COORDINATE_UNIT,
      runtimeStatus: "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME",
      baseAsset: BASE_ASSET,
      baseDecimals: BASE_DECIMALS,
      quoteAsset: QUOTE_ASSET,
      quoteStatus: QUOTE_STATUS,
      quoteDecimals: QUOTE_DECIMALS,
      tickSize: formatDecimal(tickRaw),
      lotSize: formatDecimal(lotRaw),
      priceStatus: "NATIVE_MARKET_PRICE_CANDIDATE",
      pricingAuthority: "NATIVE_11520_MATCHED_BUY_SELL_TRADES_ONLY",
      externalReferencePriceAuthority: false,
      ct: ct === null ? null : formatDecimal(ct),
      nativeMatchedTradeCT: ct === null ? null : formatDecimal(ct),
      ctMeaning: "CURRENT_NATIVE_MATCHED_TRADE_PRICE_UNIVERSE_BOUNDARY",
      bestBid: book.bestBid,
      bestAsk: book.bestAsk,
      matchedTradeCount: trades.length,
      verifiedTradeCount: trades.filter((trade) => trade.settlementStatus === "VERIFIED_SETTLED").length,
      selfMatchPolicy: "FAIL_CLOSED_SAME_OWNER_OR_CONTROLLER",
      anonymousActorPolicy: "FORBIDDEN",
      actorAuthentication: "REPOSITORY_ATTESTATION_REQUIRED_NOT_CONNECTED",
      callerAssertedIdentityAuthority: false,
      settlement: "REPOSITORY_ATTESTATION_REQUIRED_NOT_CONNECTED",
      ownershipTransfer: "REPOSITORY_ATTESTATION_REQUIRED_NOT_CONNECTED",
      receiptVerification: "REPOSITORY_ATTESTATION_REQUIRED_NOT_CONNECTED",
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
    createSettlementRequestPacket,
    recordVerifiedSettlement,
    getOrderBook,
    getMarketState,
    getTrades,
    getCandles
  });
}
