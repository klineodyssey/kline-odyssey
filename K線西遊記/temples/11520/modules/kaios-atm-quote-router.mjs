import './kaios-live-wallet-controls.mjs';

// 11520 KAIOS bilateral ATM/UFO quote layer.
// This is part of the existing K11520 exchange lineage; it is not a second exchange.
// Quotes are negotiated market offers. Physics/White-Hole ratios are never silently used as ATM prices.

const ALLOWED = new Set(["BNB", "WBNB", "USDT", "KGEN", "KAIOS"]);

function fail(code) { const e = new Error(code); e.code = code; throw e; }
function amount(value, code = "INVALID_AMOUNT") {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) fail(code);
  return n;
}
function text(value, code) { const s = String(value ?? "").trim(); if (!s) fail(code); return s; }

export function createAtmQuote({
  quoteId,
  makerLifeId,
  makerWallet,
  payAsset,
  payAmount,
  kaiosAmount,
  expiresAt,
  feeKaios = 0,
  note = ""
}) {
  const asset = String(payAsset || "").toUpperCase();
  if (!ALLOWED.has(asset) || asset === "KAIOS") fail("INVALID_PAY_ASSET");
  const pay = amount(payAmount);
  const receive = amount(kaiosAmount);
  const fee = Number(feeKaios);
  if (!Number.isFinite(fee) || fee < 0 || fee >= receive) fail("INVALID_FEE");
  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) fail("QUOTE_EXPIRED");
  return Object.freeze({
    quoteId: text(quoteId, "QUOTE_ID_REQUIRED"),
    makerLifeId: text(makerLifeId, "MAKER_LIFE_REQUIRED"),
    makerWallet: text(makerWallet, "MAKER_WALLET_REQUIRED"),
    payAsset: asset,
    payAmount: pay,
    kaiosAmount: receive,
    feeKaios: fee,
    netKaios: receive - fee,
    kaiosPerPayAsset: receive / pay,
    expiresAt: new Date(expiry).toISOString(),
    note: String(note || ""),
    pricing: "MAKER_QUOTE_BILATERAL_ACCEPTANCE",
    fixedUniversalRate: false,
    whiteHoleMinting: false,
    settlement: "REQUIRES_ATOMIC_ASSET_RECEIPTS",
    chainWrite: false
  });
}

export function acceptAtmQuote(quote, { takerLifeId, takerWallet, accepted = false, now = Date.now() } = {}) {
  if (!quote?.quoteId) fail("QUOTE_REQUIRED");
  if (new Date(quote.expiresAt).getTime() <= now) fail("QUOTE_EXPIRED");
  if (!accepted) fail("EXPLICIT_ACCEPTANCE_REQUIRED");
  return Object.freeze({
    intentId: `ATM-ACCEPT-${quote.quoteId}`,
    quoteId: quote.quoteId,
    makerLifeId: quote.makerLifeId,
    makerWallet: quote.makerWallet,
    takerLifeId: text(takerLifeId, "TAKER_LIFE_REQUIRED"),
    takerWallet: text(takerWallet, "TAKER_WALLET_REQUIRED"),
    payAsset: quote.payAsset,
    payAmount: quote.payAmount,
    receiveKaios: quote.netKaios,
    feeKaios: quote.feeKaios,
    status: "ACCEPTED_PENDING_ATOMIC_SETTLEMENT",
    requiredReceipts: Object.freeze([`${quote.payAsset}_TO_MAKER`, "KAIOS_TO_TAKER"]),
    marginCreditAllowed: false,
    reason: "KAIOS margin may be credited only after both exact receipts verify",
    chainWrite: false
  });
}

export function deriveCrossIndexes({ btcUsdt, bnbUsdt, kgenPerWbnb = null, kaiosPerKgen = null } = {}) {
  const btc = amount(btcUsdt, "BTC_USDT_REQUIRED");
  const bnb = amount(bnbUsdt, "BNB_USDT_REQUIRED");
  const out = {
    "BTC/USDT": btc,
    "BNB/USDT": bnb,
    "BTC/BNB": btc / bnb,
    "BTC/WBNB": btc / bnb,
    "KGEN/USDT": null,
    "BTC/KGEN": null,
    "KAIOS/USDT": null,
    "BTC/KAIOS": null
  };
  if (kgenPerWbnb != null && Number(kgenPerWbnb) > 0) {
    out["KGEN/USDT"] = bnb / Number(kgenPerWbnb);
    out["BTC/KGEN"] = btc / out["KGEN/USDT"];
  }
  if (out["KGEN/USDT"] && kaiosPerKgen != null && Number(kaiosPerKgen) > 0) {
    out["KAIOS/USDT"] = out["KGEN/USDT"] / Number(kaiosPerKgen);
    out["BTC/KAIOS"] = btc / out["KAIOS/USDT"];
  }
  return Object.freeze(out);
}
