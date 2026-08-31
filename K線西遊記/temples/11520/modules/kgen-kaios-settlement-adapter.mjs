const TEST_MARKET_ID = "TEST_ONLY_11520_KGEN_KAIOS_SPOT";

const TEST_RECEIPTS = Object.freeze({
  "TEST-SETTLE-KKT1": Object.freeze({
    market_id: TEST_MARKET_ID,
    trade_id: "KKT1",
    base_asset: "KGEN",
    quote_asset: "KAIOS",
    kgen_quantity: "10",
    kaios_amount: "8000",
    buyer_life_id: "life:buyer",
    seller_life_id: "life:seller",
    kaios_payment: Object.freeze({ status: 1, receipt_id: "TEST-KAIOS-RECEIPT-1", ownership: "BUYER_TO_SELLER_VERIFIED" }),
    kgen_transfer: Object.freeze({ status: 1, receipt_id: "TEST-KGEN-RECEIPT-1", ownership: "SELLER_TO_BUYER_VERIFIED" })
  })
});

function id(value, label) {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(normalized)) throw new TypeError(`${label} invalid`);
  return normalized;
}

function positiveDecimal(value, label) {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(text) || Number(text) <= 0) throw new TypeError(`${label} must be positive decimal`);
  return text;
}

export const KGEN_KAIOS_SETTLEMENT_POLICY = Object.freeze({
  exchangeNode: "K11520",
  pair: "KGEN/KAIOS",
  settlement: "ATOMIC_DUAL_RECEIPT_REQUIRED",
  kaiosReceiptStatusRequired: 1,
  kgenReceiptStatusRequired: 1,
  ctUpdateRule: "ONLY_AFTER_BOTH_ASSET_RECEIPTS_VERIFIED",
  chainWrite: false,
  signer: false,
  productionReceiptRegistry: "NOT_CONNECTED"
});

export function createKgenKaiosSettlementAdapter({ marketId = "11520_KGEN_KAIOS_SPOT", candleIntervalMs = 60_000 } = {}) {
  if (!Number.isSafeInteger(candleIntervalMs) || candleIntervalMs <= 0) throw new RangeError("candleIntervalMs invalid");
  const pending = new Map();
  const settled = new Map();
  const consumedAttestations = new Set();
  const candles = new Map();
  let ct = null;
  let volumeKgen = 0;
  let volumeKaios = 0;

  function bindMatchedTrade(trade) {
    if (!trade || trade.status !== "MATCHED_UNSETTLED" || trade.ctEligible !== false) throw new Error("MATCHED_UNSETTLED_TRADE_REQUIRED");
    const tradeId = id(trade.id, "trade id");
    if (pending.has(tradeId) || settled.has(tradeId)) throw new Error("TRADE_ALREADY_BOUND");
    const normalized = Object.freeze({
      id: tradeId,
      marketId,
      baseAsset: String(trade.baseAsset),
      quoteAsset: String(trade.quoteAsset),
      price: positiveDecimal(trade.price, "price"),
      kgenQuantity: positiveDecimal(trade.kgenQuantity, "kgenQuantity"),
      kaiosAmount: positiveDecimal(trade.kaiosAmount, "kaiosAmount"),
      buyerLifeId: id(trade.buyerLifeId, "buyerLifeId").toLowerCase(),
      sellerLifeId: id(trade.sellerLifeId, "sellerLifeId").toLowerCase(),
      timestamp: trade.timestamp ?? null,
      status: "SETTLEMENT_BOUND_PENDING_DUAL_RECEIPT"
    });
    pending.set(tradeId, normalized);
    return normalized;
  }

  function createSettlementIntent(tradeId, intentId) {
    const trade = pending.get(id(tradeId, "trade id"));
    if (!trade) throw new Error("BOUND_TRADE_NOT_FOUND");
    return Object.freeze({
      intent_id: id(intentId, "intent id"),
      market_id: marketId,
      trade_id: trade.id,
      transfers: Object.freeze([
        Object.freeze({ asset: "KAIOS", amount: trade.kaiosAmount, from_life_id: trade.buyerLifeId, to_life_id: trade.sellerLifeId, status: "AUTHORIZATION_AND_RECEIPT_REQUIRED" }),
        Object.freeze({ asset: "KGEN", amount: trade.kgenQuantity, from_life_id: trade.sellerLifeId, to_life_id: trade.buyerLifeId, status: "AUTHORIZATION_AND_RECEIPT_REQUIRED" })
      ]),
      execution: "NOT_AUTHORIZED_BY_ADAPTER",
      signer: null,
      submitted_tx: null,
      receipt: null
    });
  }

  function updateCandle(trade, settledAtMs) {
    const start = Math.floor(settledAtMs / candleIntervalMs) * candleIntervalMs;
    const price = Number(trade.price);
    const quantity = Number(trade.kgenQuantity);
    const existing = candles.get(start);
    if (!existing) {
      candles.set(start, { startTime: new Date(start).toISOString(), open: price, high: price, low: price, close: price, volumeKgen: quantity, trades: 1 });
      return;
    }
    existing.high = Math.max(existing.high, price);
    existing.low = Math.min(existing.low, price);
    existing.close = price;
    existing.volumeKgen += quantity;
    existing.trades += 1;
  }

  function recordVerifiedDualReceipt({ tradeId, attestationId, settledAtMs = Date.now() }) {
    const normalizedTradeId = id(tradeId, "trade id");
    const normalizedAttestationId = id(attestationId, "attestation id");
    if (consumedAttestations.has(normalizedAttestationId)) throw new Error("SETTLEMENT_ATTESTATION_REPLAY_FORBIDDEN");
    const trade = pending.get(normalizedTradeId);
    if (!trade) throw new Error("BOUND_TRADE_NOT_FOUND");
    if (marketId !== TEST_MARKET_ID) throw new Error("PRODUCTION_RECEIPT_REGISTRY_NOT_CONNECTED");
    const receipt = TEST_RECEIPTS[normalizedAttestationId];
    if (!receipt) throw new Error("VERIFIED_RECEIPT_ATTESTATION_NOT_FOUND");
    if (
      receipt.market_id !== marketId || receipt.trade_id !== trade.id || receipt.base_asset !== trade.baseAsset || receipt.quote_asset !== trade.quoteAsset ||
      receipt.kgen_quantity !== trade.kgenQuantity || receipt.kaios_amount !== trade.kaiosAmount ||
      receipt.buyer_life_id !== trade.buyerLifeId || receipt.seller_life_id !== trade.sellerLifeId ||
      receipt.kaios_payment.status !== 1 || receipt.kgen_transfer.status !== 1 ||
      receipt.kaios_payment.ownership !== "BUYER_TO_SELLER_VERIFIED" || receipt.kgen_transfer.ownership !== "SELLER_TO_BUYER_VERIFIED"
    ) throw new Error("DUAL_RECEIPT_BINDING_MISMATCH");
    if (!Number.isFinite(Number(settledAtMs))) throw new TypeError("settledAtMs invalid");

    consumedAttestations.add(normalizedAttestationId);
    pending.delete(normalizedTradeId);
    const result = Object.freeze({
      ...trade,
      status: "VERIFIED_SETTLED",
      ctEligible: true,
      settlementAttestationId: normalizedAttestationId,
      kaiosReceiptId: receipt.kaios_payment.receipt_id,
      kgenReceiptId: receipt.kgen_transfer.receipt_id,
      ownershipTransfer: "DUAL_ASSET_TRANSFER_VERIFIED",
      settledAt: new Date(Number(settledAtMs)).toISOString()
    });
    settled.set(normalizedTradeId, result);
    ct = trade.price;
    volumeKgen += Number(trade.kgenQuantity);
    volumeKaios += Number(trade.kaiosAmount);
    updateCandle(trade, Number(settledAtMs));
    return result;
  }

  function getMarketSettlementState() {
    return Object.freeze({
      marketId,
      ct,
      ctMeaning: "LAST_VERIFIED_DUAL_RECEIPT_SETTLEMENT_PRICE",
      pendingTrades: pending.size,
      verifiedTrades: settled.size,
      volumeKgen: String(volumeKgen),
      volumeKaios: String(volumeKaios),
      candles: [...candles.values()].map((x) => Object.freeze({ ...x })),
      productionReceiptRegistry: KGEN_KAIOS_SETTLEMENT_POLICY.productionReceiptRegistry,
      chainWrite: false,
      signer: false
    });
  }

  return Object.freeze({ bindMatchedTrade, createSettlementIntent, recordVerifiedDualReceipt, getMarketSettlementState });
}
