import assert from "node:assert/strict";
import test from "node:test";
import { buildKgenKaiosMarketView, renderKgenKaiosMarketHtml } from "../K線西遊記/temples/11520/modules/kgen-kaios-market-view.mjs";

test("view exposes smooth quote and fail-closed settlement state", () => {
  const view = buildKgenKaiosMarketView({
    orderBook: { quote: { twoSided: true, bestBid: "790", bestAsk: "810", midpoint: "800", spread: "20", spreadBps: "250", quoteHealth: "TWO_SIDED" }, bids: [{ price: "790", remaining: "5", lifeId: "life:bid" }], asks: [{ price: "810", remaining: "5", lifeId: "life:ask" }] },
    preview: { side: "BUY", requestedKgen: "10", fillableKgen: "10", kaiosAmount: "8040", averagePriceKaiosPerKgen: "804", slippageBps: "50", fullyFillable: true, withinDefaultSlippageGate: true, executionStatus: "PREVIEW_ONLY_NO_SIGNER_NO_CHAIN_WRITE" },
    settlementState: { ct: null, pendingTrades: 1, verifiedTrades: 0, volumeKgen: "0", volumeKaios: "0", productionReceiptRegistry: "NOT_CONNECTED", chainWrite: false, signer: false }
  });
  assert.equal(view.marketStatus, "QUOTING");
  assert.equal(view.bestBid, "790");
  assert.equal(view.bestAsk, "810");
  assert.equal(view.preview.kaiosAmount, "8040");
  assert.equal(view.settlement.ct, null);
  assert.equal(view.settlement.pendingTrades, 1);
  assert.equal(view.settlement.verifiedTrades, 0);
});

test("html never labels pending trade as paid or settled", () => {
  const view = buildKgenKaiosMarketView({ orderBook: { quote: {}, bids: [], asks: [] }, settlementState: { pendingTrades: 1, verifiedTrades: 0, productionReceiptRegistry: "NOT_CONNECTED" } });
  const html = renderKgenKaiosMarketHtml(view);
  assert.match(html, /PENDING 1/);
  assert.match(html, /VERIFIED 0/);
  assert.match(html, /BOTH KAIOS \+ KGEN RECEIPTS STATUS=1 REQUIRED/);
  assert.doesNotMatch(html, /PAID/);
});

test("html escapes actor text", () => {
  const view = buildKgenKaiosMarketView({ orderBook: { quote: {}, bids: [{ price: "1", remaining: "1", lifeId: "<script>alert(1)<\/script>" }], asks: [] } });
  const html = renderKgenKaiosMarketHtml(view);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
