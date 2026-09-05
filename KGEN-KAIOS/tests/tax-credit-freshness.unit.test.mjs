import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTRIBUTION_FRESHNESS_WINDOW_SECONDS,
  TAX_CREDIT_ROUTE_STATUS,
  allocateTaxCredits,
  validateTaxCredit,
} from "../tools/tax-credit-reference.mjs";

const BANK = "0x1111111111111111111111111111111111111111";
const BUYER = "0x2222222222222222222222222222222222222222";
const PAIR = "0x3333333333333333333333333333333333333333";
const GATEWAY = "0x4444444444444444444444444444444444444444";
const NOW = 2_000_000_000n;

function record(index, timestamp, amount = 10n ** 15n) {
  const suffix = index.toString(16).padStart(64, "0");
  return {
    chainId: 56,
    txHash: `0x${suffix}`,
    logIndex: index,
    transactionIndex: index,
    blockNumber: 1000 + index,
    wallet: BUYER,
    attributedBuyer: BUYER,
    pair: PAIR,
    recipient: BANK,
    gateway: GATEWAY,
    amount,
    timestamp,
    bankTaxBps: 10,
    sourceKind: "PROVEN_KGEN_BANK_TAX_0_10",
    proofId: `0x${(100 + index).toString(16).padStart(64, "0")}`,
    batchRoot: `0x${(200 + index).toString(16).padStart(64, "0")}`,
  };
}

test("tax-credit route remains disabled while exact 130-day boundary is valid", () => {
  assert.equal(TAX_CREDIT_ROUTE_STATUS, "DESIGN_ONLY_DISABLED");
  const boundary = record(1, NOW - CONTRIBUTION_FRESHNESS_WINDOW_SECONDS);
  assert.doesNotThrow(() => validateTaxCredit(boundary, { now: NOW, catalystBank: BANK }));
  const expired = record(2, NOW - CONTRIBUTION_FRESHNESS_WINDOW_SECONDS - 1n);
  assert.throws(() => validateTaxCredit(expired, { now: NOW, catalystBank: BANK }), /EXPIRED/);
});

test("tax-credit FIFO consumes oldest fresh contribution and rejects duplicate source events", () => {
  const oldest = record(1, NOW - 1000n, 7n);
  const newest = record(2, NOW - 10n, 9n);
  const allocations = allocateTaxCredits([newest, oldest], 10n, { now: NOW, catalystBank: BANK });
  assert.deepEqual(allocations.map(({ proofId, amount }) => ({ proofId, amount })), [
    { proofId: oldest.proofId, amount: 7n },
    { proofId: newest.proofId, amount: 3n },
  ]);
  assert.throws(
    () => allocateTaxCredits([oldest, { ...oldest }], 8n, { now: NOW, catalystBank: BANK }),
    /DUPLICATE_SOURCE_EVENT/,
  );
});

test("tax-credit proof fails closed for pair-as-buyer, wrong rail, wrong bank and replay", () => {
  assert.throws(
    () => validateTaxCredit({ ...record(1, NOW), wallet: PAIR, attributedBuyer: PAIR }, { now: NOW, catalystBank: BANK }),
    /PAIR_IS_NOT_BUYER/,
  );
  assert.throws(
    () => validateTaxCredit({ ...record(2, NOW), sourceKind: "KGEN_REWARD_0_05" }, { now: NOW, catalystBank: BANK }),
    /UNPROVEN_SOURCE/,
  );
  assert.throws(
    () => validateTaxCredit(record(3, NOW), { now: NOW, catalystBank: BUYER }),
    /WRONG_BANK/,
  );
  const used = record(4, NOW, 8n);
  assert.throws(
    () => validateTaxCredit(used, {
      now: NOW,
      catalystBank: BANK,
      consumedAmounts: new Map([[used.proofId, 8n]]),
    }),
    /PROOF_FULLY_CONSUMED/,
  );
});
