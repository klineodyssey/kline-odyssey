import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createKgenNativeMarketCell } from "../K線西遊記/temples/11520/modules/kgen-native-market-cell.mjs";

let nextActionNonce = 1;
const TEST_MARKET_ID = "TEST_ONLY_11520_KGEN_NATIVE_MARKET";

function actor(name, controller = `${name}-controller`, overrides = {}) {
  if (overrides.expires_at) return "TEST-EXPIRED-ACTOR-PLACE";
  if (overrides.actor_id) return controller === "one" ? "TEST-SAME-OWNER-C1-PLACE" : "TEST-SAME-OWNER-C2-PLACE";
  if (name === "same") return controller === "seller-control" ? "TEST-SAME-OWNER-C1-PLACE" : "TEST-SAME-OWNER-C2-PLACE";
  if (controller === "shared") return name === "alice" ? "TEST-SHARED-CONTROLLER-A-PLACE" : "TEST-SHARED-CONTROLLER-B-PLACE";
  if (/seller|^s\d|price|best|attacker/.test(name)) return "TEST-ACTOR-B-PLACE";
  return "TEST-ACTOR-A-PLACE";
}
function cancelAttestationFor(id) {
  if (id === "TEST-ACTOR-A-PLACE") return "TEST-ACTOR-A-CANCEL";
  if (id === "TEST-ACTOR-B-PLACE") return "TEST-ACTOR-B-CANCEL";
  return id;
}
function createMarket(options = {}) {
  const market = createKgenNativeMarketCell({ marketId: TEST_MARKET_ID, tickSize: "0.00000001", lotSize: "0.00000001", ...options });
  return Object.freeze({
    ...market,
    placeOrder(input) {
      const { actorContext, ...rest } = input;
      return market.placeOrder({ ...rest, actorAttestationId: actorContext, nonce: input.nonce ?? `ORDER-NONCE-${nextActionNonce++}` });
    },
    cancelOrder(orderId, actorContext, nonce = `CANCEL-NONCE-${nextActionNonce++}`) {
      return market.cancelOrder(orderId, cancelAttestationFor(actorContext), nonce);
    }
  });
}

test("11520 candidate coordinate stays authority-unverified and never seeds matched-trade CT", () => {
  const market = createMarket({ marketCellCoordinate: "0.99999999" });
  const state = market.getMarketState();
  assert.equal(state.marketCellCoordinate, "0.00011520");
  assert.equal(
    state.marketCellCoordinateRole,
    "CANDIDATE_KGEN_UNIVERSE_PRICE_AND_COMPANY_ADDRESS",
  );
  assert.equal(state.marketCellCoordinateStatus, "UNVERIFIED_CANDIDATE");
  assert.equal(state.marketCellCoordinateAuthority, null);
  assert.equal(state.repositoryBoundHumanCoordinateAuthority, false);
  assert.equal(state.companyAddress, "0.00011520");
  assert.equal(state.companyKCoordinate, "K11520");
  assert.equal(state.kgenUniversePriceCoordinate, "0.00011520");
  assert.equal(state.kgenUniversePriceCoordinateUnit, "USD_PER_KGEN");
  assert.equal(state.runtimeStatus, "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME");
  assert.equal(state.ct, null);
  assert.equal(state.nativeMatchedTradeCT, null);
  assert.equal(state.externalReferencePriceAuthority, false);
});

test("quote unit is explicit and remains candidate until frozen", () => {
  const state = createMarket().getMarketState();
  assert.equal(state.baseAsset, "KGEN");
  assert.equal(state.baseDecimals, 18);
  assert.equal(state.quoteAsset, "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE");
  assert.equal(state.quoteStatus, "UNFROZEN_CANDIDATE");
  assert.equal(state.quoteDecimals, 18);
  assert.equal(state.tickSize, "0.00000001");
  assert.equal(state.lotSize, "0.00000001");
  assert.equal(state.priceStatus, "NATIVE_MARKET_PRICE_CANDIDATE");
});

test("unmatched BUY/SELL quotes do not create CT", () => {
  let now = Date.parse("2026-08-22T15:00:00.000Z");
  const market = createMarket({ clock: () => now });
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "100", actorContext: actor("buyer") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "100", actorContext: actor("seller") });
  const state = market.getMarketState();
  assert.equal(state.bestBid, "0.00047");
  assert.equal(state.bestAsk, "0.00049");
  assert.equal(state.ct, null);
  assert.equal(state.matchedTradeCount, 0);
  assert.equal(state.verifiedTradeCount, 0);
});

test("crossed paper market creates an unsettled match without CT", () => {
  let now = Date.parse("2026-08-22T15:01:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "100", actorContext: actor("seller") });
  now += 1;
  const result = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "40", actorContext: actor("buyer") });

  assert.equal(result.fills.length, 1);
  assert.equal(result.fills[0].price, "0.00048");
  assert.equal(result.fills[0].quantity, "40");
  assert.equal(result.fills[0].settlementStatus, "MATCHED_UNSETTLED");
  assert.equal(result.fills[0].ctEligible, false);
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().nativeMatchedTradeCT, null);
  assert.equal(market.getMarketState().matchedTradeCount, 1);
  assert.equal(market.getMarketState().verifiedTradeCount, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "60");
});

test("matched trade creates one exact settlement request packet without inventing KAIOS payment authority", () => {
  let now = Date.parse("2026-08-22T15:01:00.000Z");
  const market = createMarket({ clock: () => now });
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "100", actorContext: actor("seller") });
  now += 1;
  const matched = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "40", actorContext: actor("buyer") });
  const packet = market.createSettlementRequestPacket({
    tradeId: matched.fills[0].id,
    requestId: "SETTLEMENT-REQUEST-0001",
    replayKey: "SETTLEMENT-REPLAY-0001",
    chain_id: 56,
    token_address: "0x1111111111111111111111111111111111111111",
    source_address: "0x2222222222222222222222222222222222222222",
    recipient_address: "0x3333333333333333333333333333333333333333",
    authorization_id: "CALLER-AUTHORIZATION",
    signer_policy_id: "CALLER-SIGNER",
    receipt: { receipt_status: 1 }
  });
  assert.equal(packet.trade_id, matched.fills[0].id);
  assert.equal(packet.buyer_life_id, "life:test-a");
  assert.equal(packet.seller_life_id, "life:test-b");
  assert.equal(packet.base_asset, "KGEN");
  assert.equal(packet.base_quantity, "40");
  assert.equal(packet.quote_asset, "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE");
  assert.equal(packet.quote_amount, "0.0192");
  assert.equal(packet.payment_purpose, "MARKET_SETTLEMENT");
  assert.equal(packet.chain_id, null);
  assert.equal(packet.token_address, null);
  assert.equal(packet.source_address, null);
  assert.equal(packet.recipient_address, null);
  assert.equal(packet.payment_rail_eligible, false);
  assert.equal(packet.ct_eligible, false);
  assert.ok(packet.blockers.includes("QUOTE_ASSET_NOT_FROZEN"));
  assert.ok(packet.blockers.includes("SECURE_SIGNER_POLICY_NOT_CONNECTED"));
  assert.equal(market.getMarketState().ct, null);
  assert.throws(() => market.createSettlementRequestPacket({ tradeId: matched.fills[0].id, requestId: "SETTLEMENT-REQUEST-0002", replayKey: "SETTLEMENT-REPLAY-0002" }), /SETTLEMENT_REQUEST_REPLAY_FORBIDDEN/);
});

test("settlement request packet rejects unknown trades and never accepts caller payment fields", () => {
  const market = createMarket();
  assert.throws(() => market.createSettlementRequestPacket({ tradeId: "T999", requestId: "SETTLEMENT-REQUEST-UNKNOWN", replayKey: "SETTLEMENT-REPLAY-UNKNOWN", token_address: "0x1111111111111111111111111111111111111111", receipt_status: 1 }), /MATCHED_TRADE_NOT_FOUND/);
  assert.equal(market.getMarketState().ct, null);
});

test("same owner self-match fails closed without CT or volume", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", actorContext: actor("same", "seller-control") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: actor("same", "buyer-control") }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().matchedTradeCount, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "1");
});

test("same controller across different owners fails closed", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", actorContext: actor("alice", "shared") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: actor("bob", "shared") }),
    /SELF_MATCH_FORBIDDEN_SAME_CONTROLLER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().matchedTradeCount, 0);
});

test("caller-supplied actor authority cannot authorize production or test markets", () => {
  assert.throws(() => createKgenNativeMarketCell({ verifyActorContext: () => ({ authentication_status: "VERIFIED" }) }), /CALLER_SUPPLIED_ACTOR_CONTEXT_VERIFIER_FORBIDDEN/);
  assert.throws(() => createKgenNativeMarketCell({ actorAttestationRegistry: {} }), /CALLER_SUPPLIED_ACTOR_ATTESTATION_REGISTRY_FORBIDDEN/);
  const production = createKgenNativeMarketCell();
  assert.throws(
    () => production.placeOrder({ side: "BUY", price: "1", quantity: "1", actorAttestationId: "TEST-ACTOR-A-PLACE", nonce: "ORDER-NONCE-PRODUCTION-1" }),
    /ACTOR_CONTEXT_ATTESTATION_REGISTRY_NOT_CONNECTED/
  );
  const testMarket = createMarket();
  assert.throws(() => testMarket.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: { claimed_actor_id: "life:forged" } }), /verified actor evidence_id/);
  assert.throws(() => testMarket.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: "TEST-UNKNOWN-ACTOR-PLACE" }), /ACTOR_CONTEXT_ATTESTATION_NOT_FOUND/);
});

test("verified actor identifiers normalize before collision checks and ignore claimed labels", () => {
  const market = createMarket();
  market.placeOrder({
    side: "SELL",
    price: "1",
    quantity: "1",
    actorContext: actor("seller-label", "one", { actor_id: " LIFE:ALICE ", claimed_actor_id: "claim:seller" })
  });
  assert.throws(
    () => market.placeOrder({
      side: "BUY",
      price: "1",
      quantity: "1",
      actorContext: actor("buyer-label", "two", { actor_id: "life:alice", claimed_actor_id: "claim:buyer" })
    }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
});

test("price-time priority uses best price then oldest order", () => {
  let now = Date.parse("2026-08-22T15:02:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "10", actorContext: actor("late-price") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("first-best") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("second-best") });
  now += 1;
  const fill = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "15", actorContext: actor("buyer") });

  assert.equal(fill.fills.length, 2);
  assert.equal(fill.fills[0].makerOrderId, "O2");
  assert.equal(fill.fills[0].price, "0.00048");
  assert.equal(fill.fills[0].quantity, "10");
  assert.equal(fill.fills[1].makerOrderId, "O3");
  assert.equal(fill.fills[1].price, "0.00048");
  assert.equal(fill.fills[1].quantity, "5");
});

test("OHLC and CT exclude native matches without verified settlement", () => {
  let now = Date.parse("2026-08-22T15:03:00.000Z");
  const market = createMarket({ clock: () => now, candleIntervalMs: 60_000 });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("s1") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00048", quantity: "10", actorContext: actor("b1") });

  now += 10_000;
  market.placeOrder({ side: "BUY", price: "0.00050", quantity: "10", actorContext: actor("b2") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00050", quantity: "10", actorContext: actor("s2") });

  now += 10_000;
  market.placeOrder({ side: "SELL", price: "0.00047", quantity: "10", actorContext: actor("s3") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "10", actorContext: actor("b3") });

  assert.deepEqual(market.getCandles(), []);
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().matchedTradeCount, 3);
  assert.equal(market.getMarketState().verifiedTradeCount, 0);
});

test("cancellation requires a verified actor context, not known identity strings", () => {
  const market = createMarket();
  const auth = actor("buyer");
  const placed = market.placeOrder({ side: "BUY", price: "0.00045", quantity: "5", actorContext: auth });
  assert.throws(() => market.cancelOrder(placed.order.id), /verified actor evidence_id/);
  assert.throws(() => market.cancelOrder(placed.order.id, { owner: placed.order.owner, controller: placed.order.controller }), /verified actor evidence_id/);
  assert.throws(() => market.cancelOrder(placed.order.id, actor("attacker")), /CANCEL_AUTHORIZATION_FAILED/);
  assert.equal(market.cancelOrder(placed.order.id, auth)?.remaining, "5");
  assert.equal(market.getOrderBook().bestBid, null);
  assert.equal(market.getMarketState().ct, null);
});

test("tick size and lot size reject misaligned orders", () => {
  const market = createMarket({ tickSize: "0.01", lotSize: "0.1" });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.001", quantity: "1", actorContext: actor("buyer") }), /tickSize/);
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.00", quantity: "1.01", actorContext: actor("buyer2") }), /lotSize/);
});

test("expired actor context is rejected before order placement", () => {
  const market = createMarket({ clock: () => Date.parse("2026-08-22T15:00:00.000Z") });
  const expired = actor("expired", undefined, { expires_at: "2026-08-22T14:59:59.999Z" });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: expired }), /ACTOR_CONTEXT_EXPIRED/);
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().matchedTradeCount, 0);
});

test("caller cannot freeze quote status or emit formal native market price", () => {
  const market = createMarket({ quoteStatus: "FROZEN", quoteAsset: "FAKE_QUOTE" });
  const state = market.getMarketState();
  assert.equal(state.quoteStatus, "UNFROZEN_CANDIDATE");
  assert.equal(state.quoteAsset, "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE");
  assert.equal(state.priceStatus, "NATIVE_MARKET_PRICE_CANDIDATE");
  assert.notEqual(state.priceStatus, "NATIVE_MARKET_PRICE");
});

test("failed forged crossing cannot change CT volume or resting liquidity", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "2", actorContext: actor("seller") });
  assert.throws(
    () => market.placeOrder({
      side: "BUY",
      price: "1",
      quantity: "2",
      actorContext: { claimed_actor_id: "life:forged", claimed_controller_id: "ctrl:forged" }
    }),
    /verified actor evidence_id/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().matchedTradeCount, 0);
  assert.equal(market.getCandles().length, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "2");
});

test("order nonce replay is rejected without duplicating liquidity", () => {
  const market = createMarket();
  const auth = actor("nonce-buyer");
  const input = { side: "BUY", price: "1", quantity: "1", actorContext: auth, nonce: "ORDER-NONCE-REPLAY-1" };
  market.placeOrder(input);
  assert.throws(() => market.placeOrder(input), /ORDER_REPLAY_FORBIDDEN/);
  assert.equal(market.getOrderBook().bids.length, 1);
});

test("cancel nonce replay is rejected", () => {
  const market = createMarket();
  const auth = actor("cancel-replay");
  const placed = market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: auth });
  market.cancelOrder(placed.order.id, auth, "CANCEL-NONCE-REPLAY-1");
  assert.throws(() => market.cancelOrder(placed.order.id, auth, "CANCEL-NONCE-REPLAY-1"), /CANCEL_REPLAY_FORBIDDEN/);
});

test("caller-supplied settlement claims cannot update CT", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", actorContext: actor("settlement-seller") });
  const matched = market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: actor("settlement-buyer") });
  assert.throws(
    () => market.recordVerifiedSettlement({
      tradeId: matched.fills[0].id,
      attestationId: "CALLER-SUPPLIED-SETTLEMENT-1",
      settlement_status: "VERIFIED_SETTLED",
      receipt_status: "VERIFIED"
    }),
    /SETTLEMENT_ATTESTATION_REGISTRY_NOT_CONNECTED/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().verifiedTradeCount, 0);
});

test("public 11520 UI exposes only the read-only native order-book boundary", async () => {
  const appSource = await readFile(new URL("../K線西遊記/temples/11520/app.mjs", import.meta.url), "utf8");
  assert.match(appSource, /K11520 NATIVE ORDER BOOK · PUBLIC READ ONLY/);
  assert.match(appSource, /NO ACTIVE VERIFIED ORDERS · CT REMAINS NULL/);
  assert.match(appSource, /createKgenNativeMarketCell\(\);/);
  assert.doesNotMatch(appSource, /verifyActorContext/);
  assert.doesNotMatch(appSource, /id="native-(?:place|cancel|settle)-order"/);
});
