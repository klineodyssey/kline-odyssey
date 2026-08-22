import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EXACT_GENESIS_BNB_WEI,
  NaiheReservoirPaperRuntime,
  validateLifeFluidRegistry,
  validateRoleSeparation
} from "./naihe-reservoir-simulator.mjs";

const registry = JSON.parse(readFileSync(new URL("./life-fluid-registry.candidate.json", import.meta.url), "utf8"));
const RESERVOIR = "0x4168000000000000000000000000000000000000";
const TREASURY = "0xB73D6716005B37BEC742D64482fA26033eE1A4E1";
const RECIPIENT = "0x1111111111111111111111111111111111111111";
const MENGPO = "LIFE-KAIOS-MENGPO-K4168-CANDIDATE";

function fresh() {
  const runtime = new NaiheReservoirPaperRuntime({
    registry,
    reservoirAddress: RESERVOIR,
    authorizedMengpoLifeIds: [MENGPO]
  });
  runtime.registerPool({
    poolId: "K4168_KGEN_POOL_TEST",
    assetId: "KGEN_MAINNET",
    balance: "1000000",
    reserveFloor: "100000",
    drawLimit: "100000",
    massScale: "1000_KG_PER_KGEN"
  });
  return runtime;
}

function roles(parent = "UNASSIGNED_ORPHAN") {
  return {
    economicSponsor: "PUBLIC_GOOD_TREASURY",
    naiheSource: "K4168_VERIFIED_SOURCE",
    reservoir: "K4168_NAIHE_RESERVOIR",
    serviceOperator: MENGPO,
    mengpoSoup: "MENGPO_SOUP_DOSE",
    regenerationParent: parent
  };
}

function draw(overrides = {}) {
  return {
    drawId: "DRAW-001",
    replayKey: "DRAW-REPLAY-001",
    chainId: 56,
    operatorLifeId: MENGPO,
    authorityStatus: "AUTHORIZED_PAPER_ONLY",
    receiptStatus: "VERIFIED_PAPER",
    poolId: "K4168_KGEN_POOL_TEST",
    sourceAssetId: "KGEN_MAINNET",
    sourceScale: "1000_KG_PER_KGEN",
    sourceAmount: "8000",
    recipientLifeId: "LIFE-ORPHAN-001",
    genesisId: "GENESIS-001",
    roles: roles(),
    ...overrides
  };
}

function transformed(runtime, overrides = {}) {
  runtime.authorizeDraw(draw());
  return runtime.transformDraw({
    transformationId: "TRANSFORM-001",
    drawId: "DRAW-001",
    ruleStatus: "TEST_ONLY_FROZEN_MOCK",
    inputAssetId: "KGEN_MAINNET",
    inputAmount: "8000",
    inputMass: "8000",
    outputAssetId: "BSC_NATIVE_BNB",
    outputAmount: EXACT_GENESIS_BNB_WEI.toString(),
    outputMass: "7900",
    loss: "50",
    byproduct: "50",
    catalystReturn: "0",
    energyInput: "10",
    energyOutput: "9",
    recipientLifeId: "LIFE-ORPHAN-001",
    genesisId: "GENESIS-001",
    ...overrides
  });
}

function dose(overrides = {}) {
  return {
    doseId: "DOSE-001",
    transformationId: "TRANSFORM-001",
    outputAssetId: "BSC_NATIVE_BNB",
    outputAmount: EXACT_GENESIS_BNB_WEI.toString(),
    chainId: 56,
    recipientLifeId: "LIFE-ORPHAN-001",
    recipientAddress: RECIPIENT,
    expectedRecipientAddress: RECIPIENT,
    genesisId: "GENESIS-001",
    regenerationParentStatus: "UNASSIGNED_ORPHAN",
    ...overrides
  };
}

test("treasury_not_reservoir", () => {
  const runtime = fresh();
  assert.throws(() => runtime.applyVerifiedRefill({
    chainId: 56, receiptStatus: "VERIFIED_PAPER", destinationReservoir: RESERVOIR,
    sourceTreasury: RESERVOIR, replayKey: "REFILL-1", poolId: "K4168_KGEN_POOL_TEST",
    assetId: "KGEN_MAINNET", amount: "1", epochCap: "10", maximumReserve: "2000000"
  }), { code: "TREASURY_NOT_RESERVOIR" });
});

test("reservoir_not_parent", () => {
  assert.throws(() => validateRoleSeparation(roles("K4168_NAIHE_RESERVOIR")), { code: "PARENT_ROLE_COLLISION" });
});

test("mengpo_not_parent", () => {
  assert.throws(() => validateRoleSeparation(roles(MENGPO)), { code: "PARENT_ROLE_COLLISION" });
});

test("soup_not_parent", () => {
  assert.throws(() => validateRoleSeparation(roles("MENGPO_SOUP_DOSE")), { code: "PARENT_ROLE_COLLISION" });
});

test("sponsor_not_parent", () => {
  assert.throws(() => validateRoleSeparation(roles("PUBLIC_GOOD_TREASURY")), { code: "PARENT_ROLE_COLLISION" });
});

test("civilization service roles remain distinct even for an orphan", () => {
  const collided = roles();
  collided.naiheSource = collided.economicSponsor;
  assert.throws(() => validateRoleSeparation(collided), { code: "CIVILIZATION_ROLE_COLLISION" });
});

test("orphan_parent_can_be_unassigned", () => {
  assert.equal(validateRoleSeparation(roles()), true);
});

test("unregistered_asset_rejected", () => {
  assert.throws(() => fresh().registerPool({ poolId: "BAD", assetId: "MISSING", balance: "0", reserveFloor: "0", drawLimit: "0", massScale: "NONE" }), { code: "UNREGISTERED_ASSET" });
});

test("wrong_scale_conversion_rejected", () => {
  assert.throws(() => fresh().registerPool({ poolId: "BAD", assetId: "KAIOS_MAINNET", balance: "1", reserveFloor: "0", drawLimit: "1", massScale: "1000_KG_PER_KGEN" }), { code: "WRONG_SCALE_CONVERSION" });
});

test("unfrozen_conversion_rejected", () => {
  const runtime = fresh();
  runtime.authorizeDraw(draw());
  assert.throws(() => runtime.transformDraw({
    transformationId: "T", drawId: "DRAW-001", ruleStatus: "UNFROZEN",
    inputAssetId: "KGEN_MAINNET", inputAmount: "8000", inputMass: "8000",
    outputAssetId: "BSC_NATIVE_BNB", outputAmount: EXACT_GENESIS_BNB_WEI.toString(),
    outputMass: "8000", loss: "0", byproduct: "0", catalystReturn: "0",
    energyInput: "0", energyOutput: "0", recipientLifeId: "LIFE-ORPHAN-001", genesisId: "GENESIS-001"
  }), { code: "UNFROZEN_CONVERSION" });
});

test("duplicate_draw_rejected", () => {
  const runtime = fresh();
  runtime.authorizeDraw(draw());
  assert.throws(() => runtime.authorizeDraw(draw()), { code: "DUPLICATE_DRAW" });
});

test("duplicate_genesis_rejected", () => {
  const runtime = fresh();
  transformed(runtime);
  runtime.prepareSoupDose(dose());
  assert.throws(() => runtime.prepareSoupDose(dose({ doseId: "DOSE-002" })), { code: "DUPLICATE_GENESIS" });
});

test("reservoir_balance_conservation", () => {
  const runtime = fresh();
  const record = runtime.authorizeDraw(draw());
  assert.equal(BigInt(record.reservoirBalanceBefore) - BigInt(record.reservoirBalanceAfter), 8000n);
  assert.equal(runtime.poolSnapshot("K4168_KGEN_POOL_TEST").balance, "992000");
});

test("investment_fund_cannot_spend_genesis_reserve", () => {
  assert.throws(() => fresh().acceptInvestmentReturn({ replayKey: "I-1", genesisReserveUsed: true, realized: true, settled: true, receipted: true }), { code: "INVESTMENT_FUND_USED_GENESIS_RESERVE" });
});

test("unrealized_profit_cannot_refill_reservoir", () => {
  assert.throws(() => fresh().acceptInvestmentReturn({ replayKey: "I-1", genesisReserveUsed: false, realized: false, settled: true, receipted: true }), { code: "UNREALIZED_PROFIT_CANNOT_REFILL" });
});

test("wrong_recipient_rejected", () => {
  const runtime = fresh();
  transformed(runtime);
  assert.throws(() => runtime.prepareSoupDose(dose({ recipientAddress: "0x2222222222222222222222222222222222222222" })), { code: "WRONG_RECIPIENT" });
});

test("wrong_amount_rejected", () => {
  const runtime = fresh();
  transformed(runtime);
  assert.throws(() => runtime.prepareSoupDose(dose({ outputAmount: (EXACT_GENESIS_BNB_WEI - 1n).toString() })), { code: "WRONG_GENESIS_AMOUNT" });
});

test("wrong_chain_rejected", () => {
  const runtime = fresh();
  transformed(runtime);
  assert.throws(() => runtime.prepareSoupDose(dose({ chainId: 1 })), { code: "WRONG_CHAIN" });
});

test("mengpo_unauthorized_draw_rejected", () => {
  assert.throws(() => fresh().authorizeDraw(draw({ operatorLifeId: "LIFE-IMPOSTOR" })), { code: "MENGPO_UNAUTHORIZED_DRAW" });
});

test("public_good_direct_life_payment_not_default_path", () => {
  assert.throws(() => fresh().applyVerifiedRefill({
    chainId: 56, receiptStatus: "VERIFIED_PAPER", destinationReservoir: RESERVOIR,
    sourceTreasury: TREASURY, recipientLifeId: "LIFE-ORPHAN-001", replayKey: "REFILL-1",
    poolId: "K4168_KGEN_POOL_TEST", assetId: "KGEN_MAINNET", amount: "1",
    epochCap: "10", maximumReserve: "2000000"
  }), { code: "PUBLIC_GOOD_DIRECT_LIFE_PAYMENT_FORBIDDEN" });
});

test("verified_refill_receipt_required", () => {
  assert.throws(() => fresh().applyVerifiedRefill({
    chainId: 56, receiptStatus: "PENDING", destinationReservoir: RESERVOIR,
    sourceTreasury: TREASURY, replayKey: "REFILL-1", poolId: "K4168_KGEN_POOL_TEST",
    assetId: "KGEN_MAINNET", amount: "1", epochCap: "10", maximumReserve: "2000000"
  }), { code: "VERIFIED_REFILL_RECEIPT_REQUIRED" });
});

test("verified refill conserves source and reservoir balances", () => {
  const runtime = fresh();
  const result = runtime.applyVerifiedRefill({
    chainId: 56, receiptStatus: "VERIFIED_PAPER", destinationReservoir: RESERVOIR,
    sourceTreasury: TREASURY, replayKey: "REFILL-OK", poolId: "K4168_KGEN_POOL_TEST",
    assetId: "KGEN_MAINNET", amount: "100", epochCap: "100", minimumReserve: "1000001",
    maximumReserve: "2000000", sourceBalanceBefore: "500", sourceBalanceAfter: "400",
    destinationBalanceBefore: "1000000", destinationBalanceAfter: "1000100"
  });
  assert.equal(result.balance, "1000100");
});

test("draw replay key cannot be reused with a new draw ID", () => {
  const runtime = fresh();
  runtime.authorizeDraw(draw());
  assert.throws(() => runtime.authorizeDraw(draw({ drawId: "DRAW-002", genesisId: "GENESIS-002" })), { code: "DUPLICATE_DRAW" });
});

test("unregistered or undeployed assets cannot activate pools", () => {
  const bad = structuredClone(registry);
  bad.assets.find((asset) => asset.symbol === "KUFO").pool_eligibility = true;
  assert.throws(() => validateLifeFluidRegistry(bad), { code: "UNDEPLOYED_ASSET_ACTIVE_POOL" });
});

test("mass and energy accounting fail closed", () => {
  const runtime = fresh();
  runtime.authorizeDraw(draw());
  assert.throws(() => runtime.transformDraw({
    transformationId: "T", drawId: "DRAW-001", ruleStatus: "TEST_ONLY_FROZEN_MOCK",
    inputAssetId: "KGEN_MAINNET", inputAmount: "8000", inputMass: "8000",
    outputAssetId: "BSC_NATIVE_BNB", outputAmount: EXACT_GENESIS_BNB_WEI.toString(),
    outputMass: "7999", loss: "0", byproduct: "0", catalystReturn: "0",
    energyInput: "1", energyOutput: "2", recipientLifeId: "LIFE-ORPHAN-001", genesisId: "GENESIS-001"
  }), { code: "MASS_CONSERVATION_FAILED" });
});
