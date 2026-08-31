import assert from "node:assert/strict";
import test from "node:test";
import { createKgenKaiosSpotMarket, KGEN_KAIOS_SPOT_POLICY } from "../K線西遊記/temples/11520/modules/kgen-kaios-spot-market.mjs";

test("pair is explicitly KGEN/KAIOS and not a fixed physics price", () => {
  assert.equal(KGEN_KAIOS_SPOT_POLICY.baseAsset, "KGEN");
  assert.equal(KGEN_KAIOS_SPOT_POLICY.quoteAsset, "KAIOS");
  assert.equal(KGEN_KAIOS_SPOT_POLICY.fixedPrice, false);
  assert.equal(KGEN_KAIOS_SPOT_POLICY.physicsScaleIsMarketPrice, false);
});

test("two-sided order book exposes smooth quote state", () => {
  const market = createKgenKaiosSpotMarket();
  market.placeLimitOrder({ side: "BUY", price: "790", quantity: "10", lifeId: "life:buyer-a", controllerId: "ctrl:buyer-a", nonce: "b1" });
  market.placeLimitOrder({ side: "SELL", price: "810", quantity: "10", lifeId: "life:seller-a", controllerId: "ctrl:seller-a", nonce: "s1" });
  const quote = market.getQuoteState();
  assert.equal(quote.bestBid, "790");
  assert.equal(quote.bestAsk, "810");
  assert.equal(quote.midpoint, "800");
  assert.equal(quote.spread, "20");
  assert.equal(quote.spreadBps, "250");
  assert.equal(quote.quoteHealth, "TWO_SIDED");
});

test("market buy preview sweeps asks and reports KAIOS amount and slippage", () => {
  const market = createKgenKaiosSpotMarket();
  market.placeLimitOrder({ side: "SELL", price: "800", quantity: "5", lifeId: "life:seller-a", controllerId: "ctrl:seller-a", nonce: "s1" });
  market.placeLimitOrder({ side: "SELL", price: "808", quantity: "5", lifeId: "life:seller-b", controllerId: "ctrl:seller-b", nonce: "s2" });
  const preview = market.previewMarketOrder({ side: "BUY", quantity: "10" });
  assert.equal(preview.fillableKgen, "10");
  assert.equal(preview.kaiosAmount, "8040");
  assert.equal(preview.averagePriceKaiosPerKgen, "804");
  assert.equal(preview.slippageBps, "50");
  assert.equal(preview.fullyFillable, true);
  assert.equal(preview.withinDefaultSlippageGate, true);
});

test("crossing KGEN/KAIOS limit orders match at maker price but remain unsettled", () => {
  const market = createKgenKaiosSpotMarket();
  market.placeLimitOrder({ side: "SELL", price: "800", quantity: "2", lifeId: "life:seller", controllerId: "ctrl:seller", nonce: "s1" });
  const result = market.placeLimitOrder({ side: "BUY", price: "805", quantity: "2", lifeId: "life:buyer", controllerId: "ctrl:buyer", nonce: "b1" });
  assert.equal(result.fills.length, 1);
  assert.equal(result.fills[0].price, "800");
  assert.equal(result.fills[0].kgenQuantity, "2");
  assert.equal(result.fills[0].kaiosAmount, "1600");
  assert.equal(result.fills[0].status, "MATCHED_UNSETTLED");
  assert.equal(result.fills[0].ctEligible, false);
});

test("same Life or same controller self-match fails closed", () => {
  const a = createKgenKaiosSpotMarket();
  a.placeLimitOrder({ side: "SELL", price: "800", quantity: "1", lifeId: "life:same", controllerId: "ctrl:a", nonce: "s1" });
  assert.throws(() => a.placeLimitOrder({ side: "BUY", price: "800", quantity: "1", lifeId: "life:same", controllerId: "ctrl:b", nonce: "b1" }), /SELF_MATCH_FORBIDDEN_SAME_LIFE/);

  const b = createKgenKaiosSpotMarket();
  b.placeLimitOrder({ side: "SELL", price: "800", quantity: "1", lifeId: "life:a", controllerId: "ctrl:same", nonce: "s1" });
  assert.throws(() => b.placeLimitOrder({ side: "BUY", price: "800", quantity: "1", lifeId: "life:b", controllerId: "ctrl:same", nonce: "b1" }), /SELF_MATCH_FORBIDDEN_SAME_CONTROLLER/);
});

test("replayed order nonce is rejected", () => {
  const market = createKgenKaiosSpotMarket();
  market.placeLimitOrder({ side: "BUY", price: "790", quantity: "1", lifeId: "life:a", controllerId: "ctrl:a", nonce: "same" });
  assert.throws(() => market.placeLimitOrder({ side: "BUY", price: "780", quantity: "1", lifeId: "life:a", controllerId: "ctrl:a", nonce: "same" }), /ORDER_REPLAY_FORBIDDEN/);
});
