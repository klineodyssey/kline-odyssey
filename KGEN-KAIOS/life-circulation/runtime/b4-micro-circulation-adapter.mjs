import { scaleCivilizationPoint, sha256, stableStringify } from "./life-circulatory-runtime.mjs";

export const PUBLIC_GOOD_TREASURY = "0xB73D6716005B37BEC742D64482fA26033eE1A4E1";

export const PUBLIC_GOOD_TOKEN_REGISTRY = Object.freeze({
  KGEN: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
  KAIOS: "0xD4E67B3a69e41524c424150E6b6e921b01D036db",
});

export const B4_MICRO_COORDINATE_POLICY = Object.freeze({
  policyId: "KAIOS_B4_MICRO_COORDINATE_COMPOSITION_V1",
  status: "HUMAN_FROZEN_REVIEW_ONLY_CANDIDATE",
  referenceFrame: "KGEN_MICRO_UNIVERSE/B4",
  startLabel: "12345",
  destinationLabel: "11520",
  labelScaleExponent: -8,
  floor: -4,
  landGrainK: "0.0001",
  kIndexLinearMeters: "22761.72430127901",
  currentSources: Object.freeze([
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#part-60-signed-universe-math-runtime",
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#part-61-universe-elevator-floor-runtime",
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#part-63-k-distance-anchor-與土地幾何",
  ]),
  humanDecision: "KAIOS_B4_MICRO_DISTANCE_CANON_RESOLUTION_AND_MISSION_RESUME_V1",
});

export const PUBLIC_GOOD_PURPOSES = Object.freeze(["MEAL", "MICRO_UNIVERSE_TRANSPORT", "FRUIT", "DONATION"]);

const KGEN_WEI = 10n ** 18n;
const FARE_FIELDS = Object.freeze([
  "energyCostKgenWei",
  "laborCostKgenWei",
  "vehicleDepreciationKgenWei",
  "maintenanceKgenWei",
  "riskReserveKgenWei",
  "profitKgenWei",
]);
const MOVEMENT_ENERGY_FIELDS = Object.freeze([
  "rollingResistanceJ",
  "dragJ",
  "climbingJ",
  "brakingLossJ",
  "systemsEnergyJ",
  "safetyReserveJ",
]);
const ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function pow10(exponent) {
  if (!Number.isSafeInteger(exponent) || exponent < 0) throw new RangeError("decimal exponent must be a non-negative safe integer");
  return 10n ** BigInt(exponent);
}

function unsignedAmount(value, label) {
  const text = String(value ?? "");
  if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new TypeError(`${label} must be an unsigned integer string`);
  return BigInt(text);
}

function parseUnsignedDecimal(value, label, { positive = false } = {}) {
  const text = String(value ?? "").trim();
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(text)) {
    throw new TypeError(`${label} must be an unsigned decimal string`);
  }
  const [whole, fraction = ""] = text.split(".");
  const parsed = { units: BigInt(`${whole}${fraction}`), scale: fraction.length };
  if (positive && parsed.units === 0n) throw new RangeError(`${label} must be positive`);
  return parsed;
}

function rescale({ units, scale }, targetScale, { round = false } = {}) {
  if (!Number.isSafeInteger(targetScale) || targetScale < 0) throw new RangeError("targetScale must be a non-negative safe integer");
  if (scale === targetScale) return units;
  if (scale < targetScale) return units * pow10(targetScale - scale);
  const divisor = pow10(scale - targetScale);
  if (!round) {
    if (units % divisor !== 0n) throw new RangeError("decimal precision would be lost");
    return units / divisor;
  }
  const quotient = units / divisor;
  const remainder = units % divisor;
  return quotient + (remainder * 2n >= divisor ? 1n : 0n);
}

function formatUnits(units, scale, { trim = false } = {}) {
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  if (scale === 0) return `${negative ? "-" : ""}${magnitude}`;
  const digits = magnitude.toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, -scale);
  let fraction = digits.slice(-scale);
  if (trim) fraction = fraction.replace(/0+$/u, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function multiplyDecimals(left, right, outputScale = 18, { trim = true } = {}) {
  const a = parseUnsignedDecimal(left, "left decimal");
  const b = parseUnsignedDecimal(right, "right decimal");
  const units = rescale({ units: a.units * b.units, scale: a.scale + b.scale }, outputScale, { round: true });
  return formatUnits(units, outputScale, { trim });
}

function sumDecimals(values, outputScale = 18, { trim = true } = {}) {
  const total = values.reduce((sum, value) => sum + rescale(parseUnsignedDecimal(value, "decimal component"), outputScale, { round: true }), 0n);
  return formatUnits(total, outputScale, { trim });
}

function compareDecimals(left, right) {
  const a = parseUnsignedDecimal(left, "left decimal");
  const b = parseUnsignedDecimal(right, "right decimal");
  const scale = Math.max(a.scale, b.scale);
  const leftUnits = rescale(a, scale);
  const rightUnits = rescale(b, scale);
  return leftUnits === rightUnits ? 0 : leftUnits > rightUnits ? 1 : -1;
}

function decimalDifferenceAtLeast(left, right, minimum) {
  const a = parseUnsignedDecimal(left, "left decimal");
  const b = parseUnsignedDecimal(right, "right decimal");
  const threshold = parseUnsignedDecimal(minimum, "minimum decimal difference");
  const scale = Math.max(a.scale, b.scale, threshold.scale);
  return rescale(a, scale) - rescale(b, scale) >= rescale(threshold, scale);
}

function exactCoordinate(label, exponent) {
  const normalizedLabel = unsignedAmount(label, "coordinate label").toString();
  if (normalizedLabel === "0") throw new RangeError("K0 does not use logarithmic micro-floor mapping");
  if (!Number.isSafeInteger(exponent)) throw new TypeError("label scale exponent must be a safe integer");
  const floor = normalizedLabel.length - 1 + exponent;
  const alpha = normalizedLabel.length === 1
    ? normalizedLabel
    : `${normalizedLabel[0]}.${normalizedLabel.slice(1)}`;
  return Object.freeze({
    label: normalizedLabel,
    x: scaleCivilizationPoint(normalizedLabel, exponent),
    floor,
    alpha,
    theta: "0",
  });
}

export function calculateB4MicroDistance({
  startLabel = B4_MICRO_COORDINATE_POLICY.startLabel,
  destinationLabel = B4_MICRO_COORDINATE_POLICY.destinationLabel,
  labelScaleExponent = B4_MICRO_COORDINATE_POLICY.labelScaleExponent,
  kIndexLinearMeters = B4_MICRO_COORDINATE_POLICY.kIndexLinearMeters,
  landGrainK = B4_MICRO_COORDINATE_POLICY.landGrainK,
} = {}) {
  const start = exactCoordinate(startLabel, labelScaleExponent);
  const destination = exactCoordinate(destinationLabel, labelScaleExponent);
  if (start.floor !== destination.floor) throw new Error("MICRO_ROUTE_CROSSES_SCALE_FLOORS");
  const labelDelta = BigInt(start.label) >= BigInt(destination.label)
    ? BigInt(start.label) - BigInt(destination.label)
    : BigInt(destination.label) - BigInt(start.label);
  if (labelDelta === 0n) throw new Error("MICRO_ROUTE_DISTANCE_ZERO");
  const physicalDeltaK = scaleCivilizationPoint(labelDelta.toString(), labelScaleExponent);
  const distanceM = multiplyDecimals(physicalDeltaK, kIndexLinearMeters, 15, { trim: false });
  const roundTripM = multiplyDecimals(distanceM, "2", 15, { trim: false });
  const landGrainM = multiplyDecimals(landGrainK, kIndexLinearMeters, 15, { trim: false });
  return Object.freeze({
    status: "RESOLVED_HUMAN_FROZEN_COMPOSITION_CANDIDATE",
    referenceFrame: B4_MICRO_COORDINATE_POLICY.referenceFrame,
    start,
    destination,
    labelScaleExponent,
    labelDelta: labelDelta.toString(),
    physicalDeltaK,
    kIndexLinearMeters,
    landGrainK,
    landGrainM,
    distanceM,
    returnDistanceM: distanceM,
    roundTripM,
    formula: "ABS((destinationLabel-startLabel)*10^-8)*22761.72430127901_M_PER_K",
    forbiddenFormulae: Object.freeze(["825*22.761724_KM", "825*2.2761724_M"]),
    policyId: B4_MICRO_COORDINATE_POLICY.policyId,
  });
}

function estimatePassed(value) {
  return /^(?:0|[1-9][0-9]*)$/.test(String(value ?? "")) && BigInt(value) > 0n;
}

function actionDisposition({ policyEligible, estimate, signerConnected, writeAuthorized }) {
  if (!policyEligible) return "BLOCKED_POLICY";
  if (!estimatePassed(estimate)) return "BLOCKED_CHAIN_ESTIMATE";
  if (!signerConnected || !writeAuthorized) return "ELIGIBLE_BUT_SECURE_SIGNER_NOT_CONNECTED";
  return "AUTHORIZED_EXECUTOR_REQUIRED_NOT_BROADCAST_BY_REVIEW_ADAPTER";
}

export function evaluateTempleHeartLifeFlow({ chainSnapshot, authority }) {
  if (!chainSnapshot || Number(chainSnapshot.chainId) !== 56) throw new Error("BSC_CHAIN_56_SNAPSHOT_REQUIRED");
  const walletKgenWei = unsignedAmount(chainSnapshot.walletKgenWei, "walletKgenWei");
  const heartBalanceWei = unsignedAmount(chainSnapshot.heartBalanceWei, "heartBalanceWei");
  const heartbeatRewardWhole = unsignedAmount(chainSnapshot.heartbeatRewardWhole, "heartbeatRewardWhole");
  const desiredFortuneWhole = 1n;
  const heartbeatFunded = heartBalanceWei >= heartbeatRewardWhole * KGEN_WEI;
  const deployedFortuneFunded = heartBalanceWei >= desiredFortuneWhole * KGEN_WEI;
  const candidateFortunePass = walletKgenWei >= KGEN_WEI;
  const signerConnected = authority?.secureSignerConnected === true;
  const writeAuthorized = authority?.personalHeartWriteAuthorized === true;
  const heartbeatPolicyEligible = heartbeatFunded && chainSnapshot.heartbeatEstimateStatus === "PASS";
  const deployedFortuneEstimateEligible = deployedFortuneFunded && chainSnapshot.fortuneEstimateStatus === "PASS";
  const candidateFortuneEligible = deployedFortuneEstimateEligible && candidateFortunePass;
  const wishEligible = chainSnapshot.wishEstimateStatus === "PASS";
  return Object.freeze({
    status: signerConnected && writeAuthorized ? "WRITE_AUTHORITY_PRESENT_EXECUTOR_STILL_REQUIRED" : "READ_ONLY_FAIL_CLOSED",
    chainId: 56,
    observedBlock: Number(chainSnapshot.blockNumber),
    observedAt: chainSnapshot.observedAt,
    walletKgenWei: walletKgenWei.toString(),
    heartBalanceWei: heartBalanceWei.toString(),
    deployedFortuneRangeWhole: Object.freeze({ min: String(chainSnapshot.deployedFortuneMinWhole), max: String(chainSnapshot.deployedFortuneMaxWhole) }),
    candidateFortuneRangeWhole: Object.freeze({ min: "1", max: "8" }),
    candidateFortunePassRequiredWei: KGEN_WEI.toString(),
    heartbeat: Object.freeze({
      rewardWhole: heartbeatRewardWhole.toString(),
      policyEligible: heartbeatPolicyEligible,
      gasEstimate: chainSnapshot.heartbeatGasEstimate,
      status: actionDisposition({ policyEligible: heartbeatPolicyEligible, estimate: chainSnapshot.heartbeatGasEstimate, signerConnected, writeAuthorized }),
      executed: false,
      txHash: null,
    }),
    fortune: Object.freeze({
      requestedWhole: desiredFortuneWhole.toString(),
      deployedEstimateEligible: deployedFortuneEstimateEligible,
      candidatePassSatisfied: candidateFortunePass,
      candidatePolicyEligible: candidateFortuneEligible,
      gasEstimate: chainSnapshot.fortuneGasEstimate,
      status: actionDisposition({ policyEligible: candidateFortuneEligible, estimate: chainSnapshot.fortuneGasEstimate, signerConnected, writeAuthorized }),
      executed: false,
      txHash: null,
    }),
    wish: Object.freeze({
      wishHash: chainSnapshot.wishHash,
      policyEligible: wishEligible,
      gasEstimate: chainSnapshot.wishGasEstimate,
      costKgenWhole: "0",
      status: actionDisposition({ policyEligible: wishEligible, estimate: chainSnapshot.wishGasEstimate, signerConnected, writeAuthorized }),
      executed: false,
      txHash: null,
    }),
    noBroadcastCapability: true,
  });
}

export function calculateMealAllowance({ inputKgenWhole = "1", confirmedWishReceipt = false, inputReceiptConfirmed = false, settlementRuntimeStatus = "NO_RUNTIME" } = {}) {
  const input = unsignedAmount(inputKgenWhole, "inputKgenWhole");
  const rateBps = confirmedWishReceipt ? 8_000n : 5_000n;
  const calculated = input * 1_000n * rateBps / 10_000n;
  const canSettle = inputReceiptConfirmed && settlementRuntimeStatus === "ACTIVE_AUTHORIZED";
  return Object.freeze({
    status: canSettle ? "SETTLEMENT_EXECUTOR_REQUIRED" : "CALCULATED_NOT_SETTLED",
    inputKgenWhole: input.toString(),
    wishReceiptConfirmed: confirmedWishReceipt,
    rateBps: Number(rateBps),
    ratePercent: `${rateBps / 100n}`,
    calculatedKaiosWhole: calculated.toString(),
    actualKaiosWhole: "0",
    settlementRuntimeStatus,
    settlementReceipt: null,
    mintsKaios: false,
  });
}

export function calculateMovementPhysics({ distanceM, inputs = {} }) {
  const required = [
    "bodyMassKg",
    "vehicleMassKg",
    "cargoMassKg",
    "accelerationMps2",
    "travelTimeSeconds",
    ...MOVEMENT_ENERGY_FIELDS,
    "outboundFuelKgenWei",
    "returnFuelKgenWei",
    "energyModelEvidenceId",
  ];
  const missingInputs = required.filter((field) => inputs[field] === null || inputs[field] === undefined || inputs[field] === "");
  if (missingInputs.length) {
    return Object.freeze({
      status: "NOT_CALCULATED_EVIDENCE_REQUIRED",
      distanceM,
      missingInputs: Object.freeze(missingInputs),
      totalMassKg: null,
      forceN: null,
      accelerationWorkJ: null,
      totalEnergyJ: null,
      travelTimeSeconds: null,
      outboundFuelKgenWei: null,
      returnFuelKgenWei: null,
      energyModelEvidenceId: null,
      usesMassEnergyConversion: false,
    });
  }
  const totalMassKg = sumDecimals([inputs.bodyMassKg, inputs.vehicleMassKg, inputs.cargoMassKg]);
  const forceN = multiplyDecimals(totalMassKg, inputs.accelerationMps2);
  const accelerationWorkJ = multiplyDecimals(forceN, distanceM);
  const totalEnergyJ = sumDecimals([accelerationWorkJ, ...MOVEMENT_ENERGY_FIELDS.map((field) => inputs[field])]);
  parseUnsignedDecimal(inputs.travelTimeSeconds, "travelTimeSeconds", { positive: true });
  const outboundFuelKgenWei = unsignedAmount(inputs.outboundFuelKgenWei, "outboundFuelKgenWei");
  const returnFuelKgenWei = unsignedAmount(inputs.returnFuelKgenWei, "returnFuelKgenWei");
  if (!String(inputs.energyModelEvidenceId).trim()) throw new Error("ENERGY_MODEL_EVIDENCE_REQUIRED");
  return Object.freeze({
    status: "PHYSICS_AND_FUEL_POLICY_CALCULATED",
    distanceM,
    totalMassKg,
    forceN,
    accelerationWorkJ,
    totalEnergyJ,
    travelTimeSeconds: String(inputs.travelTimeSeconds),
    outboundFuelKgenWei: outboundFuelKgenWei.toString(),
    returnFuelKgenWei: returnFuelKgenWei.toString(),
    energyModelEvidenceId: String(inputs.energyModelEvidenceId),
    formula: "F=M*A;ACCELERATION_WORK=F*D;ENERGY=ACCELERATION_WORK+ROLLING+DRAG+CLIMBING+BRAKING+SYSTEMS+SAFETY_RESERVE",
    usesMassEnergyConversion: false,
  });
}

export function calculateKgenFare(costs = {}) {
  const missingEvidence = FARE_FIELDS.filter((field) => costs[field] === null || costs[field] === undefined || costs[field] === "");
  if (missingEvidence.length) {
    return Object.freeze({ status: "NOT_CALCULATED_EVIDENCE_REQUIRED", fareKgenWei: null, missingEvidence: Object.freeze(missingEvidence) });
  }
  const normalized = Object.fromEntries(FARE_FIELDS.map((field) => [field, unsignedAmount(costs[field], field).toString()]));
  const fare = Object.values(normalized).reduce((sum, value) => sum + BigInt(value), 0n);
  return Object.freeze({ status: "CALCULATED_NOT_PAID", components: Object.freeze(normalized), fareKgenWei: fare.toString(), missingEvidence: Object.freeze([]) });
}

export function planDigitalMicroMovement({
  distance,
  walletKgenWei,
  currentCanonicalLocation,
  body = null,
  physicsInputs = {},
  outboundFareCosts = {},
  returnFareCosts = {},
  emergencyReserveKgenWei = "0",
  movementEvidence = null,
} = {}) {
  const funds = unsignedAmount(walletKgenWei, "walletKgenWei");
  const reserve = unsignedAmount(emergencyReserveKgenWei, "emergencyReserveKgenWei");
  const physics = calculateMovementPhysics({ distanceM: distance.distanceM, inputs: physicsInputs });
  const outboundFare = calculateKgenFare(outboundFareCosts);
  const returnFare = calculateKgenFare(returnFareCosts);
  const fareKnown = outboundFare.fareKgenWei !== null && returnFare.fareKgenWei !== null;
  const fuelKnown = physics.outboundFuelKgenWei !== null && physics.returnFuelKgenWei !== null;
  const requiredFunds = fareKnown && fuelKnown
    ? BigInt(outboundFare.fareKgenWei)
      + BigInt(returnFare.fareKgenWei)
      + BigInt(physics.outboundFuelKgenWei)
      + BigInt(physics.returnFuelKgenWei)
      + reserve
    : null;
  const bodyAccepted = body?.bodyType === "DIGITAL_FOLDER_BODY_CANDIDATE" && body?.realWorldHumanoid === false;
  let evidenceComplete = false;
  if (movementEvidence) {
    const requiredEvidence = ["routeId", "bodyId", "originPosition", "targetPosition", "energyBeforeJ", "energyAfterJ", "positionBefore", "positionAfter", "startedAt", "arrivedAt", "evidenceId"];
    const missingEvidence = requiredEvidence.filter((field) => !String(movementEvidence[field] ?? "").trim());
    if (missingEvidence.length) throw new Error(`MOVEMENT_EVIDENCE_MISSING:${missingEvidence.join(",")}`);
    if (movementEvidence.bodyId !== body?.bodyId) throw new Error("MOVEMENT_EVIDENCE_BODY_MISMATCH");
    if (movementEvidence.originPosition !== distance.start.x || movementEvidence.positionBefore !== distance.start.x) throw new Error("MOVEMENT_EVIDENCE_ORIGIN_MISMATCH");
    if (movementEvidence.targetPosition !== distance.destination.x || movementEvidence.positionAfter !== distance.destination.x) throw new Error("MOVEMENT_EVIDENCE_DESTINATION_MISMATCH");
    if (compareDecimals(movementEvidence.energyBeforeJ, movementEvidence.energyAfterJ) <= 0) throw new Error("MOVEMENT_EVIDENCE_ENERGY_NOT_CONSUMED");
    if (physics.totalEnergyJ !== null && !decimalDifferenceAtLeast(movementEvidence.energyBeforeJ, movementEvidence.energyAfterJ, physics.totalEnergyJ)) {
      throw new Error("MOVEMENT_EVIDENCE_ENERGY_BELOW_CALCULATED_REQUIREMENT");
    }
    const startedAt = Date.parse(movementEvidence.startedAt);
    const arrivedAt = Date.parse(movementEvidence.arrivedAt);
    if (!Number.isFinite(startedAt) || !Number.isFinite(arrivedAt) || arrivedAt <= startedAt) throw new Error("MOVEMENT_EVIDENCE_TIME_INVALID");
    if (physics.travelTimeSeconds !== null) {
      const travelTimeMs = rescale(parseUnsignedDecimal(physics.travelTimeSeconds, "travelTimeSeconds"), 3);
      if (BigInt(arrivedAt - startedAt) !== travelTimeMs) throw new Error("MOVEMENT_EVIDENCE_TRAVEL_TIME_MISMATCH");
    }
    evidenceComplete = true;
  }
  let status = "BLOCKED_MOVEMENT_EVIDENCE_REQUIRED";
  if (!bodyAccepted) status = "BLOCKED_DIGITAL_BODY_BINDING_REQUIRED";
  else if (funds === 0n) status = "BLOCKED_REAL_ASSET_INSUFFICIENT";
  else if (physics.status !== "PHYSICS_AND_FUEL_POLICY_CALCULATED") status = "BLOCKED_PHYSICS_INPUT_REQUIRED";
  else if (!fareKnown) status = "BLOCKED_FARE_EVIDENCE_REQUIRED";
  else if (funds < requiredFunds) status = "BLOCKED_RETURN_RESERVE_INSUFFICIENT";
  else if (evidenceComplete) status = "DIGITAL_MICRO_MOVEMENT_EVIDENCE_READY_REVIEW_ONLY";
  return Object.freeze({
    status,
    movementEngine: "DIGITAL_BODY_PLUS_KGEN_MASS_CANDIDATE",
    realWorldHumanoidClaimed: false,
    currentCanonicalLocation,
    plannedOriginX: distance.start.x,
    plannedDestinationX: distance.destination.x,
    distanceM: distance.distanceM,
    body: body ? Object.freeze({ ...body }) : null,
    physics,
    outboundFare,
    returnFare,
    emergencyReserveKgenWei: reserve.toString(),
    requiredFundsKgenWei: requiredFunds?.toString() ?? null,
    movementEvidenceComplete: evidenceComplete,
    arrived11520: false,
    positionMutationCommitted: false,
  });
}

export function inspectNative11520Market({ marketState, walletKgenWei = "0", verifiedActorContext = false } = {}) {
  if (!marketState || typeof marketState !== "object") throw new TypeError("marketState is required");
  if (marketState.marketCellCoordinate !== "0.00011520" || marketState.marketCellCoordinateRole !== "LOCATION_ONLY_NOT_PRICE") {
    throw new Error("MARKET_CELL_COORDINATE_AUTHORITY_INVALID");
  }
  if (marketState.ct === marketState.marketCellCoordinate) throw new Error("MARKET_COORDINATE_CANNOT_BE_CT");
  if (Number(marketState.tradeCount) === 0 && marketState.ct !== null) throw new Error("CT_WITHOUT_VALID_MATCHED_TRADE");
  if (marketState.chainWrite !== false || marketState.signer !== false || marketState.settlement !== "PAPER_IN_MEMORY_NO_ASSET_TRANSFER") {
    throw new Error("UNVERIFIED_MARKET_EXECUTION_BOUNDARY");
  }
  const funds = unsignedAmount(walletKgenWei, "walletKgenWei");
  const hasBook = marketState.bestBid !== null || marketState.bestAsk !== null;
  let action = "NONE_NO_VERIFIED_COUNTERPARTY";
  if (hasBook && !verifiedActorContext) action = "NONE_VERIFIED_ACTOR_CONTEXT_REQUIRED";
  else if (hasBook && funds === 0n) action = "NONE_REAL_ASSET_INSUFFICIENT";
  else if (hasBook) action = "PAPER_ANALYSIS_ONLY_SETTLEMENT_NOT_CONNECTED";
  return Object.freeze({
    status: marketState.runtimeStatus,
    implementation: "PR169_EXACT_HEAD_INTERFACE",
    marketCellCoordinate: marketState.marketCellCoordinate,
    bestBuy: marketState.bestBid,
    bestSell: marketState.bestAsk,
    ct: marketState.ct,
    tradeCount: Number(marketState.tradeCount),
    quoteAsset: marketState.quoteAsset,
    quoteStatus: marketState.quoteStatus,
    action,
    fruitQuantityKgen: null,
    fruitTradePrice: null,
    settlement: "NOT_EXECUTED",
    txHash: null,
  });
}

export function conserveFoodMass({ inputMass, metabolizedMass, storedMass, wasteMass, unit, evidenceId = null }) {
  const input = unsignedAmount(inputMass, "inputMass");
  const metabolized = unsignedAmount(metabolizedMass, "metabolizedMass");
  const stored = unsignedAmount(storedMass, "storedMass");
  const waste = unsignedAmount(wasteMass, "wasteMass");
  if (input !== metabolized + stored + waste) throw new Error("FOOD_MASS_CONSERVATION_MISMATCH");
  if (input > 0n && !evidenceId) throw new Error("FOOD_INPUT_EVIDENCE_REQUIRED");
  return Object.freeze({
    status: input === 0n ? "NO_PHYSICAL_FOOD_INPUT" : "FOOD_MASS_CONSERVED",
    unit,
    input: input.toString(),
    metabolized: metabolized.toString(),
    stored: stored.toString(),
    waste: waste.toString(),
    evidenceId,
  });
}

export function calculateWasteAccounting({ inputWasteMass, recycledOutputMass, residualWasteMass, processingLossMass, massUnit, costKgenWei, revenueKgenWei, evidenceId = null }) {
  const input = unsignedAmount(inputWasteMass, "inputWasteMass");
  const recycled = unsignedAmount(recycledOutputMass, "recycledOutputMass");
  const residual = unsignedAmount(residualWasteMass, "residualWasteMass");
  const loss = unsignedAmount(processingLossMass, "processingLossMass");
  if (input !== recycled + residual + loss) throw new Error("WASTE_MASS_CONSERVATION_MISMATCH");
  if (input > 0n && !evidenceId) throw new Error("WASTE_EVIDENCE_REQUIRED");
  const cost = unsignedAmount(costKgenWei, "costKgenWei");
  const revenue = unsignedAmount(revenueKgenWei, "revenueKgenWei");
  return Object.freeze({
    status: input === 0n ? "NO_WASTE_INPUT" : "WASTE_ACCOUNTING_CONSERVED",
    massUnit,
    inputWasteMass: input.toString(),
    recycledOutputMass: recycled.toString(),
    residualWasteMass: residual.toString(),
    processingLossMass: loss.toString(),
    costKgenWei: cost.toString(),
    revenueKgenWei: revenue.toString(),
    netProfitKgenWei: (revenue - cost).toString(),
    evidenceId,
  });
}

function normalizeAddress(value, label) {
  const address = String(value ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error(`${label}_INVALID`);
  return address.toLowerCase();
}

function addressFromTopic(topic, label) {
  const value = String(topic ?? "");
  if (!/^0x[0-9a-fA-F]{64}$/.test(value) || !/^0{24}$/u.test(value.slice(2, 26))) throw new Error(`${label}_INVALID`);
  return `0x${value.slice(-40)}`.toLowerCase();
}

function rpcQuantity(value, label) {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}_INVALID`);
    return BigInt(value);
  }
  const text = String(value ?? "");
  if (/^0x[0-9a-fA-F]+$/.test(text)) return BigInt(text);
  return unsignedAmount(text, label);
}

export function verifyPublicGoodTransferEvidence(entry, evidence) {
  if (!evidence || typeof evidence !== "object") throw new Error("PUBLIC_GOOD_RAW_RECEIPT_EVIDENCE_REQUIRED");
  const { transaction, receipt, canonicalBlock } = evidence;
  if (!transaction || !receipt || !canonicalBlock) throw new Error("PUBLIC_GOOD_RAW_RECEIPT_EVIDENCE_INCOMPLETE");
  if (Number(evidence.chainId) !== 56) throw new Error("PUBLIC_GOOD_CHAIN_ID_MISMATCH");
  if (!String(evidence.providerId ?? "").trim() || !String(evidence.evidenceId ?? "").trim()) throw new Error("PUBLIC_GOOD_EVIDENCE_PROVENANCE_REQUIRED");
  const txHash = String(transaction.hash ?? "");
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash) || String(receipt.transactionHash ?? "").toLowerCase() !== txHash.toLowerCase()) throw new Error("PUBLIC_GOOD_TRANSACTION_HASH_MISMATCH");
  if (normalizeAddress(transaction.from, "PUBLIC_GOOD_TRANSACTION_FROM") !== normalizeAddress(entry.from, "PUBLIC_GOOD_ENTRY_FROM")) throw new Error("PUBLIC_GOOD_TRANSACTION_FROM_MISMATCH");
  if (rpcQuantity(receipt.status, "PUBLIC_GOOD_RECEIPT_STATUS") !== 1n) throw new Error("PUBLIC_GOOD_RECEIPT_FAILED");
  const blockNumber = rpcQuantity(receipt.blockNumber, "PUBLIC_GOOD_RECEIPT_BLOCK");
  const canonicalNumber = rpcQuantity(canonicalBlock.number, "PUBLIC_GOOD_CANONICAL_BLOCK");
  if (blockNumber <= 0n || blockNumber !== canonicalNumber) throw new Error("PUBLIC_GOOD_CANONICAL_BLOCK_NUMBER_MISMATCH");
  const blockHash = String(receipt.blockHash ?? "");
  if (!/^0x[0-9a-fA-F]{64}$/.test(blockHash) || String(canonicalBlock.hash ?? "").toLowerCase() !== blockHash.toLowerCase()) throw new Error("PUBLIC_GOOD_CANONICAL_BLOCK_HASH_MISMATCH");
  const observedHead = rpcQuantity(evidence.observedHeadBlockNumber, "PUBLIC_GOOD_OBSERVED_HEAD");
  const minimumConfirmations = rpcQuantity(evidence.minimumConfirmations, "PUBLIC_GOOD_MINIMUM_CONFIRMATIONS");
  if (minimumConfirmations < 1n || observedHead < blockNumber) throw new Error("PUBLIC_GOOD_CONFIRMATION_POLICY_INVALID");
  const confirmationCount = observedHead - blockNumber + 1n;
  if (confirmationCount < minimumConfirmations) throw new Error("PUBLIC_GOOD_CONFIRMATIONS_INSUFFICIENT");
  const calculated = unsignedAmount(entry.calculatedAmountRaw ?? "0", "PUBLIC_GOOD_CALCULATED_AMOUNT");
  const from = normalizeAddress(entry.from, "PUBLIC_GOOD_ENTRY_FROM");
  const to = normalizeAddress(entry.to, "PUBLIC_GOOD_ENTRY_TO");
  let assetContract = null;
  if (entry.asset === "NATIVE_BNB") {
    if (normalizeAddress(transaction.to, "PUBLIC_GOOD_TRANSACTION_TO") !== to) throw new Error("PUBLIC_GOOD_NATIVE_RECIPIENT_MISMATCH");
    if (rpcQuantity(transaction.valueRaw, "PUBLIC_GOOD_NATIVE_VALUE") !== calculated) throw new Error("PUBLIC_GOOD_NATIVE_AMOUNT_MISMATCH");
  } else {
    assetContract = PUBLIC_GOOD_TOKEN_REGISTRY[entry.asset];
    if (!assetContract) throw new Error(`PUBLIC_GOOD_ASSET_UNREGISTERED:${entry.asset}`);
    const token = normalizeAddress(assetContract, "PUBLIC_GOOD_TOKEN");
    if (normalizeAddress(transaction.to, "PUBLIC_GOOD_TRANSACTION_TO") !== token) throw new Error("PUBLIC_GOOD_TOKEN_TRANSACTION_TARGET_MISMATCH");
    if (rpcQuantity(transaction.valueRaw ?? "0", "PUBLIC_GOOD_TRANSACTION_VALUE") !== 0n) throw new Error("PUBLIC_GOOD_TOKEN_TRANSACTION_NATIVE_VALUE_NONZERO");
    const matchingLogs = (receipt.logs ?? []).filter((log) => {
      try {
        return normalizeAddress(log.address, "PUBLIC_GOOD_LOG_ADDRESS") === token
          && String(log.topics?.[0] ?? "").toLowerCase() === ERC20_TRANSFER_TOPIC
          && addressFromTopic(log.topics?.[1], "PUBLIC_GOOD_TRANSFER_FROM") === from
          && addressFromTopic(log.topics?.[2], "PUBLIC_GOOD_TRANSFER_TO") === to
          && rpcQuantity(log.data, "PUBLIC_GOOD_TRANSFER_AMOUNT") === calculated;
      } catch {
        return false;
      }
    });
    if (matchingLogs.length !== 1) throw new Error("PUBLIC_GOOD_EXACT_TRANSFER_LOG_REQUIRED");
  }
  return Object.freeze({
    txHash,
    blockNumber: Number(blockNumber),
    blockHash,
    confirmationCount: Number(confirmationCount),
    finalityStatus: "CANONICAL_BLOCK_AND_MINIMUM_CONFIRMATIONS_VERIFIED",
    canonicalBlockVerified: true,
    assetContract,
    providerId: String(evidence.providerId),
    evidenceId: String(evidence.evidenceId),
  });
}

export function createPublicGoodPurposeLedger(entries = []) {
  const seen = new Set();
  const normalized = entries.map((entry) => {
    if (!PUBLIC_GOOD_PURPOSES.includes(entry.purpose)) throw new Error(`PUBLIC_GOOD_PURPOSE_INVALID:${entry.purpose}`);
    const ledgerKey = `${entry.purpose}:${entry.asset}`;
    if (seen.has(ledgerKey)) throw new Error(`DUPLICATE_PUBLIC_GOOD_LEDGER:${ledgerKey}`);
    seen.add(ledgerKey);
    if (String(entry.to).toLowerCase() !== PUBLIC_GOOD_TREASURY.toLowerCase()) throw new Error("PUBLIC_GOOD_TREASURY_MISMATCH");
    const calculated = unsignedAmount(entry.calculatedAmountRaw ?? "0", `${ledgerKey}.calculatedAmountRaw`);
    const confirmation = entry.receiptEvidence ? verifyPublicGoodTransferEvidence(entry, entry.receiptEvidence) : null;
    const confirmed = confirmation !== null;
    return Object.freeze({
      purpose: entry.purpose,
      asset: entry.asset,
      calculatedAmountRaw: calculated.toString(),
      actualAmountRaw: confirmed ? calculated.toString() : "0",
      chainId: 56,
      from: entry.from,
      to: PUBLIC_GOOD_TREASURY,
      status: confirmed ? "CONFIRMED" : "CALCULATED_NOT_SENT",
      txHash: confirmation?.txHash ?? null,
      blockNumber: confirmation?.blockNumber ?? null,
      blockHash: confirmation?.blockHash ?? null,
      receiptStatus: confirmed ? 1 : null,
      confirmationCount: confirmation?.confirmationCount ?? null,
      finalityStatus: confirmation?.finalityStatus ?? null,
      canonicalBlockVerified: confirmation?.canonicalBlockVerified ?? false,
      assetContract: confirmation?.assetContract ?? PUBLIC_GOOD_TOKEN_REGISTRY[entry.asset] ?? null,
      providerId: confirmation?.providerId ?? null,
      evidenceId: confirmation?.evidenceId ?? null,
    });
  });
  const totals = { KAIOS: "0", KGEN: "0", NATIVE_BNB: "0" };
  for (const entry of normalized) totals[entry.asset] = ((totals[entry.asset] ? BigInt(totals[entry.asset]) : 0n) + BigInt(entry.actualAmountRaw)).toString();
  return Object.freeze({
    status: normalized.some(({ status }) => status === "CONFIRMED") ? "PARTIALLY_OR_FULLY_CONFIRMED" : "NO_PAYMENT_SENT",
    treasury: PUBLIC_GOOD_TREASURY,
    purposeLedgers: Object.freeze(normalized),
    actualTotalsRaw: Object.freeze(totals),
  });
}

export function buildB4MicroMissionSnapshot({
  repository,
  identity,
  chainSnapshot,
  authority,
  marketState,
  currentCanonicalLocation,
  body = null,
  physicsInputs = {},
  outboundFareCosts = {},
  returnFareCosts = {},
  emergencyReserveKgenWei = "0",
  movementEvidence = null,
  metabolismPolicyStatus = "UNFROZEN",
  mealSettlementRuntimeStatus = "NO_RUNTIME",
  observedAt,
} = {}) {
  const distance = calculateB4MicroDistance();
  const heart = evaluateTempleHeartLifeFlow({ chainSnapshot, authority });
  const meal = calculateMealAllowance({
    inputKgenWhole: "1",
    confirmedWishReceipt: heart.wish.executed,
    inputReceiptConfirmed: heart.heartbeat.executed || heart.fortune.executed,
    settlementRuntimeStatus: mealSettlementRuntimeStatus,
  });
  const movement = planDigitalMicroMovement({
    distance,
    walletKgenWei: chainSnapshot.walletKgenWei,
    currentCanonicalLocation,
    body,
    physicsInputs,
    outboundFareCosts,
    returnFareCosts,
    emergencyReserveKgenWei,
    movementEvidence,
  });
  const market = inspectNative11520Market({ marketState, walletKgenWei: chainSnapshot.walletKgenWei, verifiedActorContext: false });
  const food = conserveFoodMass({ inputMass: "0", metabolizedMass: "0", storedMass: "0", wasteMass: "0", unit: "KAIOS_PHYSICAL_FOOD_MASS_RAW", evidenceId: null });
  const waste = calculateWasteAccounting({ inputWasteMass: "0", recycledOutputMass: "0", residualWasteMass: "0", processingLossMass: "0", massUnit: "PHYSICAL_MASS_RAW", costKgenWei: "0", revenueKgenWei: "0", evidenceId: null });
  const publicGood = createPublicGoodPurposeLedger([
    { purpose: "MEAL", asset: "KAIOS", calculatedAmountRaw: "0", from: identity.walletAddress, to: PUBLIC_GOOD_TREASURY },
    { purpose: "MICRO_UNIVERSE_TRANSPORT", asset: "KGEN", calculatedAmountRaw: "0", from: identity.walletAddress, to: PUBLIC_GOOD_TREASURY },
    { purpose: "FRUIT", asset: "KGEN", calculatedAmountRaw: "0", from: identity.walletAddress, to: PUBLIC_GOOD_TREASURY },
  ]);
  const hardBlockers = new Set();
  const authorizedTransactionPath = authority?.secureSignerConnected === true && authority?.personalHeartWriteAuthorized === true;
  if (!authorizedTransactionPath) hardBlockers.add("AUTHORIZED_SECURE_TRANSACTION_PATH_REQUIRED");
  else if (unsignedAmount(chainSnapshot.walletKgenWei, "walletKgenWei") === 0n) hardBlockers.add("REAL_ASSET_INSUFFICIENT");
  if (metabolismPolicyStatus !== "FROZEN" || mealSettlementRuntimeStatus !== "ACTIVE_AUTHORIZED") hardBlockers.add("HUMAN_GOVERNANCE_REQUIRED");
  if (movement.physics.status !== "PHYSICS_AND_FUEL_POLICY_CALCULATED") hardBlockers.add("HUMAN_GOVERNANCE_REQUIRED");
  const snapshot = {
    metadata: {
      schemaVersion: "1.0.0-candidate",
      status: "REVIEW_ONLY_CANDIDATE",
      implementer: "codex-gm-01",
      independentReview: "REQUIRED",
      observedAt,
    },
    repository: { ...repository },
    identity: { ...identity, currentCanonicalLocation },
    coordinate: distance,
    chain: { ...chainSnapshot, writeAttempted: false },
    heart,
    meal: { ...meal, metabolismPolicyStatus, consumedKaiosWhole: null, mealPaymentTx: null },
    movement,
    market,
    food,
    waste,
    publicGood,
    mission: {
      status: hardBlockers.size ? "HARD_BLOCKED_LIVE_EXECUTION_ENGINEERING_CANDIDATE_COMPLETE" : "READY_FOR_AUTHORIZED_EXECUTOR_REVIEW",
      arrived11520: false,
      returnStatus: "NOT_STARTED",
      endLocation: currentCanonicalLocation,
      gmClockIn: false,
      nextCompanyWork: null,
      hardBlockers: [...hardBlockers].sort(),
      autoResolvedBlockers: [
        "CANON_DISTANCE_UNIT_CONFLICT",
        "MICRO_DISTANCE_RUNTIME_MISSING",
        "PR169_MAIN_SYNC_COMPATIBILITY_UNKNOWN",
        "PURPOSE_LEDGER_MISSING",
        "FOOD_WASTE_CONSERVATION_VALIDATOR_MISSING",
      ],
      noFakeMovement: true,
      noFakeTrade: true,
      noFakePayment: true,
    },
  };
  return Object.freeze({ ...snapshot, evidenceHash: sha256(stableStringify(snapshot)) });
}
