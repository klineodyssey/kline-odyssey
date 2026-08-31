import assert from "node:assert/strict";
import test from "node:test";
import { createKgenKaiosSettlementAdapter, KGEN_KAIOS_SETTLEMENT_POLICY } from "../K線西遊記/temples/11520/modules/kgen-kaios-settlement-adapter.mjs";

const matchedTrade = Object.freeze({
  id: "KKT1",
  marketId: "TEST_ONLY_11520_KGEN_KAIOS_SPOT",
  baseAsset: "KGEN",
  quoteAsset: "KAIOS",
  price: "800",
  kgenQuantity: "10",
  kaiosAmount: "8000",
  buyerLifeId: "life:buyer",
  sellerLifeId: "life:seller",
  status: "MATCHED_UNSETTLED",
  ctEligible: false,
  receipt: null
});

test("policy requires both KAIOS and KGEN receipt status 1", () => {
  assert.equal(KGEN_KAIOS_SETTLEMENT_POLICY.settlement, "ATOMIC_DUAL_RECEIPT_REQUIRED");
  assert.equal(KGEN_KAIOS_SETTLEMENT_POLICY.kaiosReceiptStatusRequired, 1);
  assert.equal(KGEN_KAIOS_SETTLEMENT_POLICY.kgenReceiptStatusRequired, 1);
});

test("matched trade binds but does not update CT", () => {
  const adapter = createKgenKaiosSettlementAdapter({ marketId: "TEST_ONLY_11520_KGEN_KAIOS_SPOT" });
  adapter.bindMatchedTrade(matchedTrade);
  const state = adapter.getMarketSettlementState();
  assert.equal(state.ct, null);
  assert.equal(state.pendingTrades, 1);
  assert.equal(state.verifiedTrades, 0);
});

test("settlement intent is dual asset and non-executing", () => {
  const adapter = createKgenKaiosSettlementAdapter({ marketId: "TEST_ONLY_11520_KGEN_KAIOS_SPOT" });
  adapter.bindMatchedTrade(matchedTrade);
  const intent = adapter.createSettlementIntent("KKT1", "INTENT-KKT1");
  assert.deepEqual(intent.transfers.map((x) => x.asset), ["KAIOS", "KGEN"]);
  assert.equal(intent.transfers[0].amount, "8000");
  assert.equal(intent.transfers[1].amount, "10");
  assert.equal(intent.execution, "NOT_AUTHORIZED_BY_ADAPTER");
});

test("production market fails closed without receipt registry", () => {
  const adapter = createKgenKaiosSettlementAdapter();
  adapter.bindMatchedTrade({ ...matchedTrade, marketId: "11520_KGEN_KAIOS_SPOT" });
  assert.throws(() => adapter.recordVerifiedDualReceipt({ tradeId: "KKT1", attestationId: "TEST-SETTLE-KKT1" }), /PRODUCTION_RECEIPT_REGISTRY_NOT_CONNECTED/);
  assert.equal(adapter.getMarketSettlementState().ct, null);
});

test("verified dual receipt status 1 updates ownership CT volume and candle", () => {
  const adapter = createKgenKaiosSettlementAdapter({ marketId: "TEST_ONLY_11520_KGEN_KAIOS_SPOT" });
  adapter.bindMatchedTrade(matchedTrade);
  const settled = adapter.recordVerifiedDualReceipt({ tradeId: "KKT1", attestationId: "TEST-SETTLE-KKT1", settledAtMs: Date.parse("2026-08-31T12:00:30Z") });
  assert.equal(settled.status, "VERIFIED_SETTLED");
  assert.equal(settled.ctEligible, true);
  assert.equal(settled.ownershipTransfer, "DUAL_ASSET_TRANSFER_VERIFIED");
  const state = adapter.getMarketSettlementState();
  assert.equal(state.ct, "800");
  assert.equal(state.pendingTrades, 0);
  assert.equal(state.verifiedTrades, 1);
  assert.equal(state.volumeKgen, "10");
  assert.equal(state.volumeKaios, "8000");
  assert.equal(state.candles.length, 1);
  assert.equal(state.candles[0].close, 800);
});

test("receipt attestation cannot be replayed", () => {
  const adapter = createKgenKaiosSettlementAdapter({ marketId: "TEST_ONLY_11520_KGEN_KAIOS_SPOT" });
  adapter.bindMatchedTrade(matchedTrade);
  adapter.recordVerifiedDualReceipt({ tradeId: "KKT1", attestationId: "TEST-SETTLE-KKT1" });
  assert.throws(() => adapter.recordVerifiedDualReceipt({ tradeId: "KKT1", attestationId: "TEST-SETTLE-KKT1" }), /SETTLEMENT_ATTESTATION_REPLAY_FORBIDDEN/);
});
