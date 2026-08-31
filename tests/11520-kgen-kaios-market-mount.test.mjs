import assert from "node:assert/strict";
import test from "node:test";
import { getKgenKaiosFrontendSnapshot, renderKgenKaiosFrontendPanel } from "../K線西遊記/temples/11520/modules/kgen-kaios-market-mount.mjs";

test("frontend snapshot is empty and fail-closed before production wiring", () => {
  const view = getKgenKaiosFrontendSnapshot();
  assert.equal(view.pair, "KGEN/KAIOS");
  assert.equal(view.marketStatus, "WAITING_FOR_TWO_SIDED_BOOK");
  assert.equal(view.settlement.ct, null);
  assert.equal(view.settlement.verifiedTrades, 0);
  assert.equal(view.settlement.productionReceiptRegistry, "NOT_CONNECTED");
  assert.equal(view.settlement.signer, false);
  assert.equal(view.settlement.chainWrite, false);
});

test("frontend panel never claims production trading", () => {
  const html = renderKgenKaiosFrontendPanel();
  assert.match(html, /data-production-trading="false"/);
  assert.match(html, /PRODUCTION FAIL-CLOSED/);
  assert.match(html, /cannot place real orders/i);
  assert.match(html, /BOTH KAIOS \+ KGEN RECEIPTS STATUS=1 REQUIRED/);
});
