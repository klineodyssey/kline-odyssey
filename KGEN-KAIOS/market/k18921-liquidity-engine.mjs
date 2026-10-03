const BPS = 10_000n;

export const K18921_POLICY = Object.freeze({
  nodeId: "K18921",
  name: "斬妖台",
  treasurySource: "K18888_CIVILIZATION_TREASURY",
  purpose: "KAIOS_MARKET_INFRASTRUCTURE",
  legacyKgenWbnb: "DO_NOT_TOUCH",
  pools: Object.freeze([
    { id: "KAIOS_WBNB", quote: "WBNB", allocationBps: 6000n, priority: 1 },
    { id: "KAIOS_USDT", quote: "USDT", allocationBps: 3500n, priority: 2 },
    { id: "KAIOS_KGEN", quote: "KGEN", allocationBps: 500n, priority: 3 }
  ]),
  maxPriceImpactBps: 300n,
  previewSlippageBps: 100n,
  requirePairReceipt: true,
  requireLiquidityReceipt: true,
  requireLpCustody: true,
  prohibitSelfMatch: true,
  prohibitWashTrade: true,
  prohibitPersonalWalletOwnership: true
});

function positive(value, name) {
  if (typeof value !== "bigint" || value < 0n) throw new TypeError(`${name} must be non-negative bigint`);
  return value;
}

export function allocateGenesisBudget(totalKaios, quoteBudgets) {
  positive(totalKaios, "totalKaios");
  const allocations = K18921_POLICY.pools.map((pool) => ({
    ...pool,
    kaiosAmount: totalKaios * pool.allocationBps / BPS,
    quoteAmount: quoteBudgets?.[pool.quote] ?? null
  }));
  return Object.freeze({ source: K18921_POLICY.treasurySource, allocations });
}

export function assessPool(snapshot) {
  const reasons = [];
  if (!snapshot?.pairAddress) reasons.push("PAIR_NOT_VERIFIED");
  if (!snapshot?.treasuryAuthorization) reasons.push("K18888_ALLOCATION_NOT_AUTHORIZED");
  if (!snapshot?.vaultAddress) reasons.push("K18921_VAULT_NOT_BOUND");
  if (!snapshot?.secureSigner) reasons.push("SECURE_SIGNER_NOT_BOUND");
  if (!snapshot?.receiptVerifier) reasons.push("RECEIPT_VERIFIER_NOT_BOUND");
  if ((snapshot?.priceImpactBps ?? 0n) > K18921_POLICY.maxPriceImpactBps) reasons.push("PRICE_IMPACT_TOO_HIGH");
  if (snapshot?.selfMatchDetected) reasons.push("SELF_MATCH_DETECTED");
  if (snapshot?.washTradeDetected) reasons.push("WASH_TRADE_DETECTED");
  return Object.freeze({ decision: reasons.length ? "HOLD" : "ELIGIBLE", reasons });
}

export function planAutoLp(snapshot) {
  const gate = assessPool(snapshot);
  if (gate.decision !== "ELIGIBLE") return Object.freeze({ action: "NO_ACTION", gate });
  if (!snapshot.depthTarget || snapshot.currentDepth >= snapshot.depthTarget) {
    return Object.freeze({ action: "DEPTH_SUFFICIENT", gate });
  }
  const deficit = snapshot.depthTarget - snapshot.currentDepth;
  const capped = snapshot.dailyCap && deficit > snapshot.dailyCap ? snapshot.dailyCap : deficit;
  return Object.freeze({
    action: "PROPOSE_ADD_LIQUIDITY",
    amountValue: capped,
    executionAuthority: "NOT_GRANTED_BY_PLANNER",
    receiptRequired: true,
    lpDestination: snapshot.vaultAddress
  });
}

export function recordLpPerformance({ feeRevenue, impermanentLoss, gasCost, fundingCost = 0n }) {
  for (const [name, value] of Object.entries({ feeRevenue, impermanentLoss, gasCost, fundingCost })) positive(value, name);
  const costs = impermanentLoss + gasCost + fundingCost;
  const net = feeRevenue - costs;
  return Object.freeze({ feeRevenue, impermanentLoss, gasCost, fundingCost, netPnl: net, profitable: net > 0n });
}

export function proposeTreasuryReturn({ realizedNetProfit, reinvestBps = 7000n }) {
  positive(realizedNetProfit, "realizedNetProfit");
  if (reinvestBps < 0n || reinvestBps > BPS) throw new RangeError("reinvestBps out of range");
  const reinvest = realizedNetProfit * reinvestBps / BPS;
  return Object.freeze({
    reinvest,
    returnToK18888: realizedNetProfit - reinvest,
    transferStatus: "PROPOSED_NOT_EXECUTED"
  });
}
