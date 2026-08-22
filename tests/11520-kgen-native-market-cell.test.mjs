import assert from "node:assert/strict";
import test from "node:test";
import { createKgenNativeMarketCell } from "../K線西遊記/temples/11520/modules/kgen-native-market-cell.mjs";

test("11520 market-cell coordinate never seeds CT", () => {
  const market = createKgenNativeMarketCell({ marketCellCoordinate: "0.00011520" });
  const state = market.getMarketState();
  assert.equal(state.marketCellCoordinate, "0.00011520");
  assert.equal(state.marketCellCoordinateRole, "LOCATION_ONLY_NOT_PRICE");
  assert.equal(state.ct, null);
  assert.equal(state.externalReferencePriceAuthority, false);
});

test("unmatched BUY/SELL quotes do not create CT", () => {
  let now = Date.parse("2026-08-22T15:00:00.000Z");
  const market = createKgenNativeMarketCell({ clock: () => now });
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "100", owner: "buyer" });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "100", owner: "seller" });
  const state = market.getMarketState();
  assert.equal(state.bestBid, "0.00047");
  assert.equal(state.bestAsk, "0.00049");
  assert.equal(state.ct, null);
  assert.equal(state.tradeCount, 0);
});

test("crossed market creates trade and CT at resting maker price", () => {
  let now = Date.parse("2026-08-22T15:01:00.000Z");
  const market = createKgenNativeMarketCell({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "100", owner: "seller" });
  now += 1;
  const result = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "40", owner: "buyer" });

  assert.equal(result.fills.length, 1);
  assert.equal(result.fills[0].price, "0.00048");
  assert.equal(result.fills[0].quantity, "40");
  assert.equal(market.getMarketState().ct, "0.00048");
  assert.equal(market.getMarketState().tradeCount, 1);
  assert.equal(market.getOrderBook().asks[0].remaining, "60");
});

test("price-time priority uses best price then oldest order", () => {
  let now = Date.parse("2026-08-22T15:02:00.000Z");
  const market = createKgenNativeMarketCell({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "10", owner: "latePrice" });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", owner: "firstAtBest" });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", owner: "secondAtBest" });
  now += 1;
  const fill = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "15", owner: "buyer" });

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
  const market = createKgenNativeMarketCell({ clock: () => now, candleIntervalMs: 60_000 });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", owner: "s1" });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00048", quantity: "10", owner: "b1" });

  now += 10_000;
  market.placeOrder({ side: "BUY", price: "0.00050", quantity: "10", owner: "b2" });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00050", quantity: "10", owner: "s2" });

  now += 10_000;
  market.placeOrder({ side: "SELL", price: "0.00047", quantity: "10", owner: "s3" });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "10", owner: "b3" });

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

test("cancellation removes resting liquidity without changing CT", () => {
  const market = createKgenNativeMarketCell();
  const placed = market.placeOrder({ side: "BUY", price: "0.00045", quantity: "5", owner: "buyer" });
  assert.equal(market.cancelOrder(placed.order.id, "buyer")?.remaining, "5");
  assert.equal(market.getOrderBook().bestBid, null);
  assert.equal(market.getMarketState().ct, null);
});
