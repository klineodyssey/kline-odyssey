const SCALE = 10n ** 18n;
const BPS = 10_000n;

export const KGEN_KAIOS_SPOT_POLICY = Object.freeze({
  marketId: "11520_KGEN_KAIOS_SPOT",
  exchangeNode: "K11520",
  baseAsset: "KGEN",
  quoteAsset: "KAIOS",
  decimals: 18,
  status: "PAPER_REVIEW_CANDIDATE",
  settlementMode: "MATCHED_UNSETTLED_UNTIL_VERIFIED_RECEIPT",
  pricingRule: "ORDERBOOK_PRICE_TIME_PRIORITY",
  fixedPrice: false,
  physicsScaleIsMarketPrice: false,
  maxPreviewSlippageBps: 300n,
  selfMatch: "FORBIDDEN_SAME_LIFE_OR_CONTROLLER",
  chainWrite: false,
  signer: false
});

function parseAmount(value, label) {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new TypeError(`${label} must be a positive decimal`);
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > 18) throw new RangeError(`${label} supports at most 18 decimals`);
  const raw = BigInt(whole) * SCALE + BigInt((fraction + "0".repeat(18)).slice(0, 18));
  if (raw <= 0n) throw new RangeError(`${label} must be > 0`);
  return raw;
}

function formatAmount(raw) {
  const sign = raw < 0n ? "-" : "";
  const value = raw < 0n ? -raw : raw;
  const whole = value / SCALE;
  const fraction = String(value % SCALE).padStart(18, "0").replace(/0+$/, "");
  return `${sign}${fraction ? `${whole}.${fraction}` : whole}`;
}

function normalizeIdentity(value, label) {
  const id = String(value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9:._-]{2,127}$/.test(id)) throw new TypeError(`${label} invalid`);
  return id;
}

function quoteCost(price, quantity) {
  const numerator = price * quantity;
  if (numerator % SCALE !== 0n) throw new Error("QUOTE_AMOUNT_EXCEEDS_18_DECIMAL_PRECISION");
  return numerator / SCALE;
}

export function createKgenKaiosSpotMarket({ tickSize = "0.00000001", lotSize = "0.00000001", clock = () => Date.now() } = {}) {
  const tick = parseAmount(tickSize, "tickSize");
  const lot = parseAmount(lotSize, "lotSize");
  const bids = [];
  const asks = [];
  const trades = [];
  const consumedNonces = new Set();
  let sequence = 1;
  let nextOrder = 1;

  const sortBooks = () => {
    bids.sort((a, b) => a.price === b.price ? a.sequence - b.sequence : a.price > b.price ? -1 : 1);
    asks.sort((a, b) => a.price === b.price ? a.sequence - b.sequence : a.price < b.price ? -1 : 1);
  };

  function getQuoteState() {
    const bestBid = bids[0]?.price ?? null;
    const bestAsk = asks[0]?.price ?? null;
    let midpoint = null;
    let spread = null;
    let spreadBps = null;
    if (bestBid !== null && bestAsk !== null) {
      midpoint = (bestBid + bestAsk) / 2n;
      spread = bestAsk - bestBid;
      if (midpoint > 0n) spreadBps = spread * BPS / midpoint;
    }
    return Object.freeze({
      marketId: KGEN_KAIOS_SPOT_POLICY.marketId,
      baseAsset: "KGEN",
      quoteAsset: "KAIOS",
      bestBid: bestBid === null ? null : formatAmount(bestBid),
      bestAsk: bestAsk === null ? null : formatAmount(bestAsk),
      midpoint: midpoint === null ? null : formatAmount(midpoint),
      spread: spread === null ? null : formatAmount(spread),
      spreadBps: spreadBps === null ? null : String(spreadBps),
      twoSided: bestBid !== null && bestAsk !== null,
      quoteHealth: bestBid === null || bestAsk === null ? "ONE_SIDED_OR_EMPTY" : bestBid >= bestAsk ? "CROSSED" : "TWO_SIDED",
      fixedPrice: false,
      physicsScaleUsedAsPrice: false
    });
  }

  function previewMarketOrder({ side, quantity }) {
    const normalizedSide = String(side).toUpperCase();
    if (normalizedSide !== "BUY" && normalizedSide !== "SELL") throw new TypeError("side must be BUY or SELL");
    const target = parseAmount(quantity, "quantity");
    const book = normalizedSide === "BUY" ? asks : bids;
    let remaining = target;
    let quoteTotal = 0n;
    let baseFilled = 0n;
    let firstPrice = null;
    let lastPrice = null;
    for (const level of book) {
      if (remaining <= 0n) break;
      const fill = remaining < level.remaining ? remaining : level.remaining;
      if (firstPrice === null) firstPrice = level.price;
      lastPrice = level.price;
      quoteTotal += quoteCost(level.price, fill);
      baseFilled += fill;
      remaining -= fill;
    }
    const averagePrice = baseFilled > 0n ? quoteTotal * SCALE / baseFilled : null;
    const slippageBps = firstPrice && averagePrice
      ? (averagePrice > firstPrice ? averagePrice - firstPrice : firstPrice - averagePrice) * BPS / firstPrice
      : null;
    return Object.freeze({
      side: normalizedSide,
      requestedKgen: formatAmount(target),
      fillableKgen: formatAmount(baseFilled),
      kaiosAmount: formatAmount(quoteTotal),
      averagePriceKaiosPerKgen: averagePrice === null ? null : formatAmount(averagePrice),
      firstPrice: firstPrice === null ? null : formatAmount(firstPrice),
      lastPrice: lastPrice === null ? null : formatAmount(lastPrice),
      slippageBps: slippageBps === null ? null : String(slippageBps),
      fullyFillable: remaining === 0n,
      withinDefaultSlippageGate: slippageBps !== null && slippageBps <= KGEN_KAIOS_SPOT_POLICY.maxPreviewSlippageBps,
      executionStatus: "PREVIEW_ONLY_NO_SIGNER_NO_CHAIN_WRITE"
    });
  }

  function placeLimitOrder({ side, price, quantity, lifeId, controllerId, nonce }) {
    const normalizedSide = String(side).toUpperCase();
    if (normalizedSide !== "BUY" && normalizedSide !== "SELL") throw new TypeError("side must be BUY or SELL");
    const p = parseAmount(price, "price");
    const q = parseAmount(quantity, "quantity");
    if (p % tick !== 0n) throw new RangeError("price not aligned to tickSize");
    if (q % lot !== 0n) throw new RangeError("quantity not aligned to lotSize");
    const life = normalizeIdentity(lifeId, "lifeId");
    const controller = normalizeIdentity(controllerId, "controllerId");
    const replay = `${KGEN_KAIOS_SPOT_POLICY.marketId}:${life}:${controller}:${String(nonce ?? "")}`;
    if (!String(nonce ?? "").trim()) throw new TypeError("nonce required");
    if (consumedNonces.has(replay)) throw new Error("ORDER_REPLAY_FORBIDDEN");
    consumedNonces.add(replay);

    const order = { id: `KK${nextOrder++}`, side: normalizedSide, price: p, quantity: q, remaining: q, lifeId: life, controllerId: controller, sequence: sequence++, createdAt: new Date(Number(clock())).toISOString() };
    const opposite = normalizedSide === "BUY" ? asks : bids;
    for (const maker of opposite) {
      const crosses = normalizedSide === "BUY" ? p >= maker.price : p <= maker.price;
      if (!crosses) break;
      if (maker.lifeId === life) throw new Error("SELF_MATCH_FORBIDDEN_SAME_LIFE");
      if (maker.controllerId === controller) throw new Error("SELF_MATCH_FORBIDDEN_SAME_CONTROLLER");
    }

    const fills = [];
    while (order.remaining > 0n && opposite.length) {
      const maker = opposite[0];
      const crosses = normalizedSide === "BUY" ? p >= maker.price : p <= maker.price;
      if (!crosses) break;
      const fill = order.remaining < maker.remaining ? order.remaining : maker.remaining;
      const trade = Object.freeze({
        id: `KKT${trades.length + 1}`,
        marketId: KGEN_KAIOS_SPOT_POLICY.marketId,
        baseAsset: "KGEN",
        quoteAsset: "KAIOS",
        price: formatAmount(maker.price),
        kgenQuantity: formatAmount(fill),
        kaiosAmount: formatAmount(quoteCost(maker.price, fill)),
        buyerLifeId: normalizedSide === "BUY" ? life : maker.lifeId,
        sellerLifeId: normalizedSide === "SELL" ? life : maker.lifeId,
        status: "MATCHED_UNSETTLED",
        ctEligible: false,
        receipt: null
      });
      trades.push(trade);
      fills.push(trade);
      maker.remaining -= fill;
      order.remaining -= fill;
      if (maker.remaining === 0n) opposite.shift();
    }
    if (order.remaining > 0n) {
      (normalizedSide === "BUY" ? bids : asks).push(order);
      sortBooks();
    }
    return Object.freeze({ orderId: order.id, remaining: formatAmount(order.remaining), fills, quote: getQuoteState() });
  }

  function getOrderBook(depth = 20) {
    const n = Math.max(1, Math.min(200, Number(depth) || 20));
    const map = (o) => Object.freeze({ id: o.id, side: o.side, price: formatAmount(o.price), quantity: formatAmount(o.quantity), remaining: formatAmount(o.remaining), lifeId: o.lifeId, createdAt: o.createdAt });
    return Object.freeze({ bids: bids.slice(0, n).map(map), asks: asks.slice(0, n).map(map), quote: getQuoteState() });
  }

  return Object.freeze({ placeLimitOrder, previewMarketOrder, getOrderBook, getQuoteState, getTrades: () => trades.slice() });
}
