import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_GOOD_TREASURY,
  PUBLIC_GOOD_TOKEN_REGISTRY,
  buildB4MicroMissionSnapshot,
  calculateB4MicroDistance,
  calculateKgenFare,
  calculateMealAllowance,
  calculateMovementPhysics,
  calculateWasteAccounting,
  conserveFoodMass,
  createPublicGoodPurposeLedger,
  evaluateTempleHeartLifeFlow,
  inspectNative11520Market,
  planDigitalMicroMovement,
} from "../runtime/b4-micro-circulation-adapter.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const example = JSON.parse(fs.readFileSync(path.join(packageRoot, "examples", "hengyao-b4-micro-circulation.candidate.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "b4-micro-circulation.schema.json"), "utf8"));

function resolveRef(ref) {
  assert.match(ref, /^#\/\$defs\//u);
  return schema.$defs[ref.slice("#/$defs/".length)];
}

function validateSchemaValue(value, rule, pointer = "#") {
  if (rule.$ref) return validateSchemaValue(value, resolveRef(rule.$ref), pointer);
  if (rule.oneOf) {
    const matches = rule.oneOf.filter((candidate) => {
      try { validateSchemaValue(value, candidate, pointer); return true; } catch { return false; }
    });
    assert.equal(matches.length, 1, `${pointer} must match exactly one schema branch`);
    return;
  }
  if (Object.hasOwn(rule, "const")) assert.deepEqual(value, rule.const, `${pointer} const mismatch`);
  if (rule.enum) assert.ok(rule.enum.includes(value), `${pointer} enum mismatch`);
  if (rule.type === "null") assert.equal(value, null, `${pointer} must be null`);
  if (rule.type === "string") {
    assert.equal(typeof value, "string", `${pointer} must be a string`);
    if (rule.minLength !== undefined) assert.ok(value.length >= rule.minLength, `${pointer} too short`);
    if (rule.pattern) assert.match(value, new RegExp(rule.pattern, "u"), `${pointer} pattern mismatch`);
    if (rule.format === "date-time") assert.ok(Number.isFinite(Date.parse(value)), `${pointer} date-time invalid`);
  }
  if (rule.type === "integer") {
    assert.ok(Number.isSafeInteger(value), `${pointer} must be a safe integer`);
    if (rule.minimum !== undefined) assert.ok(value >= rule.minimum, `${pointer} below minimum`);
  }
  if (rule.type === "boolean") assert.equal(typeof value, "boolean", `${pointer} must be boolean`);
  if (rule.type === "array") {
    assert.ok(Array.isArray(value), `${pointer} must be an array`);
    if (rule.minItems !== undefined) assert.ok(value.length >= rule.minItems, `${pointer} has too few items`);
    if (rule.uniqueItems) assert.equal(new Set(value.map((entry) => JSON.stringify(entry))).size, value.length, `${pointer} items are not unique`);
    value.forEach((entry, index) => validateSchemaValue(entry, rule.items, `${pointer}/${index}`));
  }
  if (rule.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${pointer} must be an object`);
    for (const key of rule.required ?? []) assert.ok(Object.hasOwn(value, key), `${pointer}/${key} is required`);
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(rule.properties ?? {}, key), `${pointer}/${key} is not allowed`);
    }
    for (const [key, child] of Object.entries(rule.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchemaValue(value[key], child, `${pointer}/${key}`);
    }
  }
}

function marketState(overrides = {}) {
  return {
    marketCellCoordinate: "0.00011520",
    marketCellCoordinateRole: "LOCATION_ONLY_NOT_PRICE",
    runtimeStatus: "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME",
    baseAsset: "KGEN",
    quoteAsset: "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE",
    quoteStatus: "UNFROZEN_CANDIDATE",
    ct: null,
    bestBid: null,
    bestAsk: null,
    tradeCount: 0,
    settlement: "PAPER_IN_MEMORY_NO_ASSET_TRANSFER",
    chainWrite: false,
    signer: false,
    ...overrides,
  };
}

function movementInputs(overrides = {}) {
  return {
    bodyMassKg: "1",
    vehicleMassKg: "1000",
    cargoMassKg: "0",
    accelerationMps2: "1",
    travelTimeSeconds: "2",
    rollingResistanceJ: "0",
    dragJ: "0",
    climbingJ: "0",
    brakingLossJ: "0",
    systemsEnergyJ: "0",
    safetyReserveJ: "0",
    outboundFuelKgenWei: "1",
    returnFuelKgenWei: "1",
    energyModelEvidenceId: "ENERGY-MODEL-TEST-ONLY",
    ...overrides,
  };
}

function zeroFare() {
  return {
    energyCostKgenWei: "0",
    laborCostKgenWei: "0",
    vehicleDepreciationKgenWei: "0",
    maintenanceKgenWei: "0",
    riskReserveKgenWei: "0",
    profitKgenWei: "0",
  };
}

function movementEvidence() {
  return {
    routeId: "B4-12345-11520",
    bodyId: "FOLDER:KGEN-KAIOS/life-circulation",
    originPosition: "0.00012345",
    targetPosition: "0.00011520",
    energyBeforeJ: "200",
    energyAfterJ: "0",
    positionBefore: "0.00012345",
    positionAfter: "0.00011520",
    startedAt: "2026-08-24T02:00:00.000Z",
    arrivedAt: "2026-08-24T02:00:02.000Z",
    evidenceId: "MOVEMENT-EVIDENCE-TEST-ONLY",
  };
}

function addressTopic(address) {
  return `0x${address.toLowerCase().slice(2).padStart(64, "0")}`;
}

function confirmedKgenEvidence({ amountRaw = "2", confirmations = 12 } = {}) {
  const txHash = `0x${"a".repeat(64)}`;
  const blockHash = `0x${"b".repeat(64)}`;
  const blockNumber = 117720719;
  return {
    chainId: 56,
    providerId: "BSC_RPC_TEST_PROVIDER",
    evidenceId: "PUBLIC-GOOD-RECEIPT-TEST-ONLY",
    observedHeadBlockNumber: blockNumber + confirmations - 1,
    minimumConfirmations: 12,
    transaction: {
      hash: txHash,
      from: example.identity.walletAddress,
      to: PUBLIC_GOOD_TOKEN_REGISTRY.KGEN,
      valueRaw: "0",
    },
    receipt: {
      transactionHash: txHash,
      status: "0x1",
      blockNumber,
      blockHash,
      logs: [{
        address: PUBLIC_GOOD_TOKEN_REGISTRY.KGEN,
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          addressTopic(example.identity.walletAddress),
          addressTopic(PUBLIC_GOOD_TREASURY),
        ],
        data: `0x${BigInt(amountRaw).toString(16).padStart(64, "0")}`,
      }],
    },
    canonicalBlock: { number: blockNumber, hash: blockHash },
  };
}

function composeExample() {
  return buildB4MicroMissionSnapshot({
    repository: example.repository,
    identity: example.identity,
    chainSnapshot: example.chain,
    authority: { secureSignerConnected: false, personalHeartWriteAuthorized: false, autonomyLevel: "A1_PERSONAL_WALLET_READ" },
    marketState: marketState(),
    currentCanonicalLocation: example.identity.currentCanonicalLocation,
    body: example.movement.body,
    metabolismPolicyStatus: example.meal.metabolismPolicyStatus,
    mealSettlementRuntimeStatus: example.meal.settlementRuntimeStatus,
    observedAt: example.metadata.observedAt,
  });
}

test("B4 mission schema is recursively closed and validates the durable example", () => {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object") assert.equal(node.additionalProperties, false, `${pointer} is open`);
    for (const [key, child] of Object.entries(node)) visit(child, `${pointer}/${key}`);
  };
  visit(schema);
  validateSchemaValue(example, schema);
});

test("durable Hengyao example is exactly recomposable and hash-bound", () => {
  assert.deepEqual(composeExample(), example);
  assert.match(example.evidenceHash, /^[0-9a-f]{64}$/u);
});

test("B4 label mapping computes physical 0.00000825 K instead of treating 825 as physical K", () => {
  const result = calculateB4MicroDistance();
  assert.deepEqual(result.start, { label: "12345", x: "0.00012345", floor: -4, alpha: "1.2345", theta: "0" });
  assert.deepEqual(result.destination, { label: "11520", x: "0.00011520", floor: -4, alpha: "1.1520", theta: "0" });
  assert.equal(result.labelDelta, "825");
  assert.equal(result.physicalDeltaK, "0.00000825");
  assert.equal(result.landGrainM, "2.276172430127901");
  assert.equal(result.distanceM, "0.187784225485552");
  assert.equal(result.roundTripM, "0.375568450971104");
  assert.ok(result.forbiddenFormulae.includes("825*2.2761724_M"));
});

test("micro route rejects a cross-floor endpoint instead of silently rescaling it", () => {
  assert.throws(() => calculateB4MicroDistance({ destinationLabel: "999" }), /MICRO_ROUTE_CROSSES_SCALE_FLOORS/);
});

test("Heart flow separates deployed estimate eligibility from the candidate 1 KGEN pass", () => {
  const result = evaluateTempleHeartLifeFlow({
    chainSnapshot: example.chain,
    authority: { secureSignerConnected: false, personalHeartWriteAuthorized: false },
  });
  assert.equal(result.heartbeat.policyEligible, true);
  assert.equal(result.heartbeat.status, "ELIGIBLE_BUT_SECURE_SIGNER_NOT_CONNECTED");
  assert.equal(result.fortune.deployedEstimateEligible, true);
  assert.equal(result.fortune.candidatePassSatisfied, false);
  assert.equal(result.fortune.candidatePolicyEligible, false);
  assert.equal(result.fortune.status, "BLOCKED_POLICY");
  assert.equal(result.wish.costKgenWhole, "0");
  for (const action of [result.heartbeat, result.fortune, result.wish]) {
    assert.equal(action.executed, false);
    assert.equal(action.txHash, null);
  }
  assert.equal(result.noBroadcastCapability, true);
});

test("meal allowance calculates 50 or 80 percent but never mints without settlement", () => {
  const noWish = calculateMealAllowance({ inputKgenWhole: "1", confirmedWishReceipt: false });
  const wished = calculateMealAllowance({ inputKgenWhole: "1", confirmedWishReceipt: true });
  assert.equal(noWish.calculatedKaiosWhole, "500");
  assert.equal(wished.calculatedKaiosWhole, "800");
  assert.equal(noWish.actualKaiosWhole, "0");
  assert.equal(wished.actualKaiosWhole, "0");
  assert.equal(wished.mintsKaios, false);
});

test("movement calculator requires mass, time, all energy components, fuel policy, and both directions", () => {
  const missing = calculateMovementPhysics({ distanceM: "0.187784225485552" });
  for (const field of ["bodyMassKg", "brakingLossJ", "returnFuelKgenWei", "energyModelEvidenceId"]) {
    assert.ok(missing.missingInputs.includes(field));
  }
  const calculated = calculateMovementPhysics({ distanceM: "0.187784225485552", inputs: movementInputs() });
  assert.equal(calculated.status, "PHYSICS_AND_FUEL_POLICY_CALCULATED");
  assert.equal(calculated.totalMassKg, "1001");
  assert.equal(calculated.forceN, "1001");
  assert.equal(calculated.accelerationWorkJ, "187.972009711037552");
  assert.equal(calculated.totalEnergyJ, "187.972009711037552");
  assert.equal(calculated.outboundFuelKgenWei, "1");
  assert.equal(calculated.returnFuelKgenWei, "1");
  assert.equal(calculated.usesMassEnergyConversion, false);
});

test("movement preserves return fuel and never commits a position from review evidence", () => {
  const distance = calculateB4MicroDistance();
  const body = { bodyId: "FOLDER:KGEN-KAIOS/life-circulation", bodyType: "DIGITAL_FOLDER_BODY_CANDIDATE", realWorldHumanoid: false, status: "REVIEW_ONLY_CANDIDATE" };
  const blocked = planDigitalMicroMovement({
    distance,
    walletKgenWei: "1",
    currentCanonicalLocation: "P_4168p0_奈何橋_R18",
    body,
    physicsInputs: movementInputs(),
    outboundFareCosts: zeroFare(),
    returnFareCosts: zeroFare(),
    movementEvidence: movementEvidence(),
  });
  assert.equal(blocked.requiredFundsKgenWei, "2");
  assert.equal(blocked.status, "BLOCKED_RETURN_RESERVE_INSUFFICIENT");
  const reviewed = planDigitalMicroMovement({
    distance,
    walletKgenWei: "2",
    currentCanonicalLocation: "P_4168p0_奈何橋_R18",
    body,
    physicsInputs: movementInputs(),
    outboundFareCosts: zeroFare(),
    returnFareCosts: zeroFare(),
    movementEvidence: movementEvidence(),
  });
  assert.equal(reviewed.status, "DIGITAL_MICRO_MOVEMENT_EVIDENCE_READY_REVIEW_ONLY");
  assert.equal(reviewed.arrived11520, false);
  assert.equal(reviewed.positionMutationCommitted, false);
  assert.equal(reviewed.realWorldHumanoidClaimed, false);
  assert.throws(() => planDigitalMicroMovement({
    distance,
    walletKgenWei: "2",
    currentCanonicalLocation: "P_4168p0_奈何橋_R18",
    body,
    physicsInputs: movementInputs(),
    outboundFareCosts: zeroFare(),
    returnFareCosts: zeroFare(),
    movementEvidence: { ...movementEvidence(), positionAfter: "0.00012345" },
  }), /MOVEMENT_EVIDENCE_DESTINATION_MISMATCH/);
});

test("KGEN fare totals complete evidence and rejects an incomplete price basis", () => {
  assert.equal(calculateKgenFare(zeroFare()).fareKgenWei, "0");
  assert.equal(calculateKgenFare({ energyCostKgenWei: "1" }).status, "NOT_CALCULATED_EVIDENCE_REQUIRED");
});

test("PR169 interface keeps 0.00011520 out of CT and empty books produce no fruit trade", () => {
  const empty = inspectNative11520Market({ marketState: marketState(), walletKgenWei: "0" });
  assert.equal(empty.bestBuy, null);
  assert.equal(empty.bestSell, null);
  assert.equal(empty.ct, null);
  assert.equal(empty.action, "NONE_NO_VERIFIED_COUNTERPARTY");
  assert.equal(empty.settlement, "NOT_EXECUTED");
  assert.throws(() => inspectNative11520Market({ marketState: marketState({ ct: "0.00011520", tradeCount: 1 }) }), /MARKET_COORDINATE_CANNOT_BE_CT/);
  assert.throws(() => inspectNative11520Market({ marketState: marketState({ ct: "1", tradeCount: 0 }) }), /CT_WITHOUT_VALID_MATCHED_TRADE/);
  assert.throws(() => inspectNative11520Market({ marketState: marketState({ chainWrite: true }) }), /UNVERIFIED_MARKET_EXECUTION_BOUNDARY/);
});

test("food input and waste processing both conserve exact smallest units", () => {
  assert.equal(conserveFoodMass({ inputMass: "10", metabolizedMass: "4", storedMass: "3", wasteMass: "3", unit: "GRAM_RAW", evidenceId: "FOOD-1" }).status, "FOOD_MASS_CONSERVED");
  assert.throws(() => conserveFoodMass({ inputMass: "10", metabolizedMass: "4", storedMass: "3", wasteMass: "2", unit: "GRAM_RAW", evidenceId: "FOOD-1" }), /FOOD_MASS_CONSERVATION_MISMATCH/);
  const waste = calculateWasteAccounting({ inputWasteMass: "3", recycledOutputMass: "1", residualWasteMass: "1", processingLossMass: "1", massUnit: "GRAM_RAW", costKgenWei: "5", revenueKgenWei: "8", evidenceId: "WASTE-1" });
  assert.equal(waste.netProfitKgenWei, "3");
  assert.throws(() => calculateWasteAccounting({ inputWasteMass: "3", recycledOutputMass: "3", residualWasteMass: "1", processingLossMass: "0", massUnit: "GRAM_RAW", costKgenWei: "0", revenueKgenWei: "0", evidenceId: "WASTE-1" }), /WASTE_MASS_CONSERVATION_MISMATCH/);
});

test("public-good purposes remain separate and only a valid receipt becomes paid", () => {
  const ledger = createPublicGoodPurposeLedger([
    { purpose: "MEAL", asset: "KAIOS", calculatedAmountRaw: "10", from: example.identity.walletAddress, to: PUBLIC_GOOD_TREASURY },
    { purpose: "FRUIT", asset: "KGEN", calculatedAmountRaw: "2", from: example.identity.walletAddress, to: PUBLIC_GOOD_TREASURY, receiptEvidence: confirmedKgenEvidence() },
  ]);
  assert.equal(ledger.purposeLedgers[0].status, "CALCULATED_NOT_SENT");
  assert.equal(ledger.purposeLedgers[0].actualAmountRaw, "0");
  assert.equal(ledger.purposeLedgers[1].status, "CONFIRMED");
  assert.equal(ledger.purposeLedgers[1].confirmationCount, 12);
  assert.equal(ledger.purposeLedgers[1].canonicalBlockVerified, true);
  assert.equal(ledger.purposeLedgers[1].assetContract, PUBLIC_GOOD_TOKEN_REGISTRY.KGEN);
  assert.equal(ledger.actualTotalsRaw.KGEN, "2");
  assert.equal(ledger.actualTotalsRaw.KAIOS, "0");
  assert.equal(ledger.actualTotalsRaw.NATIVE_BNB, "0");
  assert.throws(() => createPublicGoodPurposeLedger([{ purpose: "FRUIT", asset: "KGEN", calculatedAmountRaw: "2", from: example.identity.walletAddress, to: PUBLIC_GOOD_TREASURY, receiptEvidence: confirmedKgenEvidence({ confirmations: 11 }) }]), /PUBLIC_GOOD_CONFIRMATIONS_INSUFFICIENT/);
  assert.throws(() => createPublicGoodPurposeLedger([{ purpose: "FRUIT", asset: "KGEN", calculatedAmountRaw: "3", from: example.identity.walletAddress, to: PUBLIC_GOOD_TREASURY, receiptEvidence: confirmedKgenEvidence({ amountRaw: "2" }) }]), /PUBLIC_GOOD_EXACT_TRANSFER_LOG_REQUIRED/);
  assert.throws(() => createPublicGoodPurposeLedger([{ purpose: "MEAL", asset: "KAIOS", calculatedAmountRaw: "1", from: example.identity.walletAddress, to: example.identity.walletAddress }]), /PUBLIC_GOOD_TREASURY_MISMATCH/);
});

test("live mission remains hard-blocked without signer, assets, and frozen settlement policies", () => {
  const snapshot = composeExample();
  assert.deepEqual(snapshot.mission.hardBlockers, ["HUMAN_GOVERNANCE_REQUIRED", "PRIVATE_KEY_NOT_AUTHORIZED", "REAL_ASSET_INSUFFICIENT"]);
  assert.equal(snapshot.heart.heartbeat.status, "ELIGIBLE_BUT_SECURE_SIGNER_NOT_CONNECTED");
  assert.equal(snapshot.movement.status, "BLOCKED_REAL_ASSET_INSUFFICIENT");
  assert.equal(snapshot.mission.arrived11520, false);
  assert.equal(snapshot.mission.endLocation, "P_4168p0_奈何橋_R18");
  assert.equal(snapshot.mission.gmClockIn, false);
  assert.equal(snapshot.mission.noFakeMovement, true);
  assert.equal(snapshot.mission.noFakeTrade, true);
  assert.equal(snapshot.mission.noFakePayment, true);
});

test("review UI exposes exact distance and never exposes a transaction control", () => {
  const html = fs.readFileSync(path.join(packageRoot, "review", "b4-micro-circulation-review.html"), "utf8");
  assert.match(html, /0\.187784225485552/u);
  assert.match(html, /0\.00000825 K/u);
  assert.match(html, /PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME/u);
  assert.match(html, /ELIGIBLE_BUT_SECURE_SIGNER_NOT_CONNECTED/u);
  assert.match(html, /NO_PAYMENT_SENT/u);
  assert.doesNotMatch(html, /sendTransaction|eth_sendRawTransaction|personal_sign|wallet_addEthereumChain/u);
});
