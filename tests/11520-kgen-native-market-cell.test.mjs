import assert from "node:assert/strict";
import test from "node:test";
import { createKgenNativeMarketCell } from "../K線西遊記/temples/11520/modules/kgen-native-market-cell.mjs";

const actor = (name, controller = `${name}-controller`) => ({ owner: `life:${name}`, controller: `ctrl:${controller}` });

function createMarket(options = {}) {
  return createKgenNativeMarketCell({
    quoteAsset: "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE",
    quoteStatus: "UNFROZEN_CANDIDATE",
    quoteDecimals: 18,
    tickSize: "0.00000001",
    lotSize: "0.00000001",
    ...options
  });
}

test("11520 market-cell coordinate never seeds CT", () => {
  const market = createMarket({ marketCellCoordinate: "0.00011520" });
  const state = market.getMarketState();
  assert.equal(state.marketCellCoordinate, "0.00011520");
  assert.equal(state.marketCellCoordinateRole, "LOCATION_ONLY_NOT_PRICE");
  assert.equal(state.runtimeStatus, "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME");
  assert.equal(state.ct, null);
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
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "100", ...actor("buyer") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "100", ...actor("seller") });
  const state = market.getMarketState();
  assert.equal(state.bestBid, "0.00047");
  assert.equal(state.bestAsk, "0.00049");
  assert.equal(state.ct, null);
  assert.equal(state.tradeCount, 0);
});

test("crossed market creates trade and CT at resting maker price", () => {
  let now = Date.parse("2026-08-22T15:01:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "100", ...actor("seller") });
  now += 1;
  const result = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "40", ...actor("buyer") });

  assert.equal(result.fills.length, 1);
  assert.equal(result.fills[0].price, "0.00048");
  assert.equal(result.fills[0].quantity, "40");
  assert.equal(market.getMarketState().ct, "0.00048");
  assert.equal(market.getMarketState().tradeCount, 1);
  assert.equal(market.getOrderBook().asks[0].remaining, "60");
});

test("same owner self-match fails closed without CT or volume", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", ...actor("same", "seller-control") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", ...actor("same", "buyer-control") }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "1");
});

test("same controller across different owners fails closed", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", ...actor("alice", "shared") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", ...actor("bob", "shared") }),
    /SELF_MATCH_FORBIDDEN_SAME_CONTROLLER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
});

test("anonymous or blank actor identities are forbidden", () => {
  const market = createMarket();
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", owner: "ANONYMOUS", controller: "ctrl:x" }), /non-anonymous/);
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", owner: "life:x", controller: "" }), /non-anonymous/);
});

test("actor identifiers normalize before collision checks", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", owner: " LIFE:ALICE ", controller: " CTRL:ONE " });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", owner: "life:alice", controller: "ctrl:two" }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
});

test("price-time priority uses best price then oldest order", () => {
  let now = Date.parse("2026-08-22T15:02:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "10", ...actor("late-price") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", ...actor("first-best") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", ...actor("second-best") });
  now += 1;
  const fill = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "15", ...actor("buyer") });

  assert.equal(fill.fills.length, 2);
  assert.equal(fill.fills[0].makerOrderId, "O2");
  assert.equal(fill.fills[0].price, "0.00048");
  assert.equal(fill.fills[0].quantity, "10");
  assert.equal(fill.fills[1].makerOrderId, "O3");
  assert.equal(fill.fills[1].price, "0.00048");
  assert.equal(fill.fills[1].quantity, "5");
});

test("OHLC is derived only from native matched trades", () => {
  let now = Date.parse("2026-08-22T15:03:00.000Z");
  const market = createMarket({ clock: () => now, candleIntervalMs: 60_000 });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", ...actor("s1") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00048", quantity: "10", ...actor("b1") });

  now += 10_000;
  market.placeOrder({ side: "BUY", price: "0.00050", quantity: "10", ...actor("b2") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00050", quantity: "10", ...actor("s2") });

  now += 10_000;
  market.placeOrder({ side: "SELL", price: "0.00047", quantity: "10", ...actor("s3") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "10", ...actor("b3") });

  const [candle] = market.getCandles();
  assert.deepEqual(candle, {
    startTime: "2026-08-22T15:03:00.000Z",
    endTime: "2026-08-22T15:04:00.000Z",
    open: "0.00048",
    high: "0.0005",
    low: "0.00047",
    close: "0.00047",
    volume: "30",
    trades: 3
  });
  assert.equal(market.getMarketState().ct, "0.00047");
});

test("cancellation requires exact owner and controller authorization", () => {
  const market = createMarket();
  const auth = actor("buyer");
  const placed = market.placeOrder({ side: "BUY", price: "0.00045", quantity: "5", ...auth });
  assert.throws(() => market.cancelOrder(placed.order.id), /owner must be a non-anonymous/);
  assert.throws(() => market.cancelOrder(placed.order.id, actor("attacker")), /CANCEL_AUTHORIZATION_FAILED/);
  assert.throws(() => market.cancelOrder(placed.order.id, { owner: auth.owner, controller: "ctrl:wrong" }), /CANCEL_AUTHORIZATION_FAILED/);
  assert.equal(market.cancelOrder(placed.order.id, auth)?.remaining, "5");
  assert.equal(market.getOrderBook().bestBid, null);
  assert.equal(market.getMarketState().ct, null);
});

test("tick size and lot size reject misaligned orders", () => {
  const market = createMarket({ tickSize: "0.01", lotSize: "0.1" });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.001", quantity: "1", ...actor("buyer") }), /tickSize/);
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.00", quantity: "1.01", ...actor("buyer2") }), /lotSize/);
});
