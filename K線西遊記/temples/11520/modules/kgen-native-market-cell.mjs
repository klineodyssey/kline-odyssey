const SCALE = 10n ** 18n;

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

function cloneOrder(order) {
  return {
    id: order.id,
    side: order.side,
    owner: order.owner,
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
 * Important canon boundary:
 * - `marketCellCoordinate` identifies the Huaguoshan Taiwan Exchange cell only.
 * - It NEVER seeds, fixes or influences price.
 * - CT is undefined before the first matched trade.
 * - CT becomes exactly the most recent native 11520 matched trade price.
 * - PancakeSwap/WBNB/USD/L-P data may be displayed externally, but are not inputs here.
 * - This module is an in-memory/paper matching engine only. It has no signer, token custody,
 *   settlement, transfer, approval, chain-write or Mainnet authority.
 */
export function createKgenNativeMarketCell({
  marketId = "11520_KGEN_NATIVE_MARKET",
  marketCellCoordinate = "0.00011520",
  baseAsset = "KGEN",
  quoteUnit = "11520_NATIVE_QUOTE",
  candleIntervalMs = 60_000,
  clock = () => Date.now()
} = {}) {
  if (!Number.isSafeInteger(candleIntervalMs) || candleIntervalMs <= 0) {
    throw new RangeError("candleIntervalMs must be a positive safe integer");
  }

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

  function executeTrade({ maker, taker, quantity, price, timestampMs }) {
    const trade = {
      id: `T${trades.length + 1}`,
      marketId,
      baseAsset,
      quoteUnit,
      priceRaw: price,
      quantityRaw: quantity,
      price: formatDecimal(price),
      quantity: formatDecimal(quantity),
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      makerSide: maker.side,
      takerSide: taker.side,
      timestampMs,
      timestamp: new Date(timestampMs).toISOString()
    };
    trades.push(trade);
    ct = price;
    updateCandle(trade);
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
      // Price-time priority: a crossing taker executes at the resting maker price.
      const trade = executeTrade({ maker, taker, quantity, price: maker.price, timestampMs });
      fills.push(trade);
      taker.remaining -= quantity;
      maker.remaining -= quantity;
      if (maker.remaining === 0n) opposite.shift();
    }

    return fills;
  }

  function placeOrder({ side, price, quantity, owner = "ANONYMOUS" }) {
    const normalizedSide = normalizeSide(side);
    const priceRaw = parseDecimal(price, "price");
    const quantityRaw = parseDecimal(quantity, "quantity");
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");

    const order = {
      id: `O${nextOrder++}`,
      side: normalizedSide,
      owner: String(owner),
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

  function cancelOrder(orderId, owner = null) {
    for (const book of [bids, asks]) {
      const index = book.findIndex((order) => order.id === orderId && (owner === null || order.owner === String(owner)));
      if (index >= 0) return cloneOrder(book.splice(index, 1)[0]);
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
      baseAsset,
      quoteUnit,
      pricingAuthority: "NATIVE_11520_MATCHED_BUY_SELL_TRADES_ONLY",
      externalReferencePriceAuthority: false,
      ct: ct === null ? null : formatDecimal(ct),
      ctMeaning: "CURRENT_NATIVE_MATCHED_TRADE_PRICE_UNIVERSE_BOUNDARY",
      bestBid: book.bestBid,
      bestAsk: book.bestAsk,
      tradeCount: trades.length,
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
