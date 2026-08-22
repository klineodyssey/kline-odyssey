const SCALE = 10n ** 18n;
const BASE_ASSET = "KGEN";
const BASE_DECIMALS = 18;
const QUOTE_ASSET = "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE";
const QUOTE_STATUS = "UNFROZEN_CANDIDATE";
const QUOTE_DECIMALS = 18;

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
 * - `marketCellCoordinate` identifies the Huaguoshan Taiwan Exchange cell only.
 * - It NEVER seeds, fixes or influences price.
 * - CT is undefined before the first valid matched trade.
 * - CT becomes exactly the most recent native 11520 matched trade price.
 * - PancakeSwap/WBNB/USD/L-P data are not pricing inputs.
 * - Anonymous actors, same-owner matches and same-controller matches fail closed.
 * - This module has no signer, custody, settlement, transfer, approval, chain-write or Mainnet authority.
 */
export function createKgenNativeMarketCell({
  marketId = "11520_KGEN_NATIVE_MARKET",
  marketCellCoordinate = "0.00011520",
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
      marketCellCoordinate,
      marketCellCoordinateRole: "LOCATION_ONLY_NOT_PRICE",
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
