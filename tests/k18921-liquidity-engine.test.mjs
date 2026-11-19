import assert from "node:assert/strict";
import test from "node:test";
import { K18921_POLICY, allocateGenesisBudget, assessPool, planAutoLp, recordLpPerformance, proposeTreasuryReturn } from "../KGEN-KAIOS/market/k18921-liquidity-engine.mjs";

test("K18921 uses K18888 and never touches legacy KGEN/WBNB", () => {
  assert.equal(K18921_POLICY.treasurySource, "K18888_CIVILIZATION_TREASURY");
  assert.equal(K18921_POLICY.legacyKgenWbnb, "DO_NOT_TOUCH");
});

test("genesis KAIOS allocation is 60/35/5", () => {
  const { allocations } = allocateGenesisBudget(1_000_000n, { WBNB: 2763n, USDT: 11048n, KGEN: 55900n });
  assert.deepEqual(allocations.map((x) => x.kaiosAmount), [600_000n, 350_000n, 50_000n]);
});

test("missing pair, treasury, vault, signer and receipt verifier fail closed", () => {
  const gate = assessPool({ priceImpactBps: 0n });
  assert.equal(gate.decision, "HOLD");
  assert.ok(gate.reasons.includes("PAIR_NOT_VERIFIED"));
  assert.ok(gate.reasons.includes("K18888_ALLOCATION_NOT_AUTHORIZED"));
});

test("manipulation blocks auto LP", () => {
  const gate = assessPool({ pairAddress: "0xpair", treasuryAuthorization: true, vaultAddress: "0xvault", secureSigner: true, receiptVerifier: true, washTradeDetected: true });
  assert.equal(gate.decision, "HOLD");
});

test("eligible shallow pool proposes capped liquidity without granting execution", () => {
  const plan = planAutoLp({ pairAddress: "0xpair", treasuryAuthorization: true, vaultAddress: "0xvault", secureSigner: true, receiptVerifier: true, priceImpactBps: 100n, currentDepth: 100n, depthTarget: 1000n, dailyCap: 300n });
  assert.equal(plan.action, "PROPOSE_ADD_LIQUIDITY");
  assert.equal(plan.amountValue, 300n);
  assert.equal(plan.executionAuthority, "NOT_GRANTED_BY_PLANNER");
});

test("sufficient depth stops auto LP", () => {
  const plan = planAutoLp({ pairAddress: "0xpair", treasuryAuthorization: true, vaultAddress: "0xvault", secureSigner: true, receiptVerifier: true, currentDepth: 1000n, depthTarget: 1000n });
  assert.equal(plan.action, "DEPTH_SUFFICIENT");
});

test("LP accounting subtracts IL gas and funding cost", () => {
  const pnl = recordLpPerformance({ feeRevenue: 500n, impermanentLoss: 180n, gasCost: 20n, fundingCost: 0n });
  assert.equal(pnl.netPnl, 300n);
  assert.equal(pnl.profitable, true);
});

test("realized profit proposal reinvests and returns remainder to K18888", () => {
  const split = proposeTreasuryReturn({ realizedNetProfit: 1000n });
  assert.equal(split.reinvest, 700n);
  assert.equal(split.returnToK18888, 300n);
  assert.equal(split.transferStatus, "PROPOSED_NOT_EXECUTED");
});
