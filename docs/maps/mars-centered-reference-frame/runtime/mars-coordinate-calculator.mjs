const SCALE_NUMERATOR_KM = 384_400n;
const SCALE_DENOMINATOR_K = 16_888n;
const MARS_MEAN_RADIUS_SCALED_KM = 338_950n;
const MARS_MEAN_RADIUS_DECIMALS = 2;

function power10(exponent) {
  return 10n ** BigInt(exponent);
}

function parseDecimal(value, label) {
  const text = String(value);
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]+))?$/u.exec(text);
  if (!match) throw new TypeError(`${label} must be a non-negative decimal string`);
  const decimals = match[2]?.length ?? 0;
  return {
    numerator: BigInt(`${match[1]}${match[2] ?? ""}`),
    denominator: power10(decimals),
  };
}

function greatestCommonDivisor(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function reduce(numerator, denominator) {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

function formatRounded(numerator, denominator, decimals) {
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new RangeError("decimals must be an integer from 0 through 18");
  }
  const factor = power10(decimals);
  const scaled = numerator * factor;
  const quotient = scaled / denominator;
  const remainder = scaled % denominator;
  const rounded = quotient + (remainder * 2n >= denominator ? 1n : 0n);
  if (decimals === 0) return rounded.toString();
  const digits = rounded.toString().padStart(decimals + 1, "0");
  return `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`;
}

export const K_SCALE = Object.freeze({
  distanceKm: "384400",
  kUnits: "16888",
  exactRational: "384400/16888",
  displayKmPerK: "22.761724301279",
});

export function kmToK(distanceKm, decimals = 6) {
  const distance = parseDecimal(distanceKm, "distanceKm");
  return formatRounded(
    distance.numerator * SCALE_DENOMINATOR_K,
    distance.denominator * SCALE_NUMERATOR_KM,
    decimals,
  );
}

export function kToKm(kIndex, decimals = 6) {
  const index = parseDecimal(kIndex, "kIndex");
  return formatRounded(
    index.numerator * SCALE_NUMERATOR_KM,
    index.denominator * SCALE_DENOMINATOR_K,
    decimals,
  );
}

export function altitudeAboveMarsToK(altitudeKm, decimals = 6) {
  const altitude = parseDecimal(altitudeKm, "altitudeKm");
  const radius = {
    numerator: MARS_MEAN_RADIUS_SCALED_KM,
    denominator: power10(MARS_MEAN_RADIUS_DECIMALS),
  };
  const commonDenominator = radius.denominator * altitude.denominator;
  const totalNumerator = radius.numerator * altitude.denominator + altitude.numerator * radius.denominator;
  return formatRounded(
    totalNumerator * SCALE_DENOMINATOR_K,
    commonDenominator * SCALE_NUMERATOR_KM,
    decimals,
  );
}

export function exactScaleFraction() {
  return reduce(SCALE_NUMERATOR_KM, SCALE_DENOMINATOR_K);
}

export function coordinateKey(referenceFrame, kIndex) {
  if (!referenceFrame || kIndex === undefined || kIndex === null) throw new Error("referenceFrame and kIndex are required");
  return `${referenceFrame}/K${String(kIndex)}`;
}

function requireExternalEvidence(record, label) {
  for (const field of ["referenceFrame", "epoch", "timestamp", "source", "distanceKm", "kIndex", "uncertainty"]) {
    if (record[field] === undefined || record[field] === null || record[field] === "") {
      throw new Error(`${label}.${field} is required`);
    }
  }
  if (!Number.isFinite(Date.parse(record.timestamp))) throw new Error(`${label}.timestamp must be ISO-8601`);
  parseDecimal(record.distanceKm, `${label}.distanceKm`);
  parseDecimal(record.kIndex, `${label}.kIndex`);
}

function compareDecimals(leftValue, rightValue, leftLabel, rightLabel) {
  const left = parseDecimal(leftValue, leftLabel);
  const right = parseDecimal(rightValue, rightLabel);
  const leftScaled = left.numerator * right.denominator;
  const rightScaled = right.numerator * left.denominator;
  return leftScaled === rightScaled ? 0 : leftScaled < rightScaled ? -1 : 1;
}

export function validateMarsReferenceFrame(candidate) {
  if (candidate.frame.frameId !== "MARS_CENTERED") throw new Error("frameId must be MARS_CENTERED");
  if (candidate.frame.localOrigin !== "MARS/K0") throw new Error("Mars local origin must be MARS/K0");
  if (candidate.frame.preservedUniverseOrigin !== "UNIVERSE/K0") throw new Error("UNIVERSE/K0 must be preserved");
  if (candidate.frame.localOrigin === candidate.frame.preservedUniverseOrigin) throw new Error("local and Universe origins collide");
  if (candidate.frame.overridesUniverseK0 !== false) throw new Error("MARS/K0 cannot override UNIVERSE/K0");
  const pointIds = new Set();
  const coordinateKeys = new Set();
  for (const point of candidate.points) {
    if (point.frameId !== candidate.frame.frameId) throw new Error(`${point.pointId} uses the wrong frame`);
    if (pointIds.has(point.pointId)) throw new Error(`duplicate pointId ${point.pointId}`);
    pointIds.add(point.pointId);
    const key = coordinateKey(point.frameId, point.kIndex);
    if (coordinateKeys.has(key)) throw new Error(`duplicate coordinate ${key}`);
    coordinateKeys.add(key);
    requireExternalEvidence(point.positionEvidence, point.pointId);
    if (point.positionEvidence.referenceFrame !== candidate.frame.frameId) {
      throw new Error(`${point.pointId} evidence frame mismatch`);
    }
    if (compareDecimals(point.kIndex, point.positionEvidence.kIndex, `${point.pointId}.kIndex`, `${point.pointId}.positionEvidence.kIndex`) !== 0) {
      throw new Error(`${point.pointId} evidence kIndex mismatch`);
    }
  }
  for (const range of candidate.ranges) {
    for (const field of ["frameId", "epoch", "timestamp", "source", "distanceKmMin", "distanceKmMax", "kIndexMin", "kIndexMax", "uncertainty"]) {
      if (range[field] === undefined || range[field] === null || range[field] === "") throw new Error(`${range.rangeId}.${field} is required`);
    }
    if (!Number.isFinite(Date.parse(range.timestamp))) throw new Error(`${range.rangeId}.timestamp must be ISO-8601`);
    if (range.frameId !== candidate.frame.frameId) throw new Error(`${range.rangeId} uses the wrong frame`);
    const minimumDistance = parseDecimal(range.distanceKmMin, `${range.rangeId}.distanceKmMin`);
    const maximumDistance = parseDecimal(range.distanceKmMax, `${range.rangeId}.distanceKmMax`);
    if (minimumDistance.numerator * maximumDistance.denominator > maximumDistance.numerator * minimumDistance.denominator) {
      throw new Error(`${range.rangeId} distance range is reversed`);
    }
    if (compareDecimals(range.kIndexMin, range.kIndexMax, `${range.rangeId}.kIndexMin`, `${range.rangeId}.kIndexMax`) > 0) {
      throw new Error(`${range.rangeId} K range is reversed`);
    }
  }
  const gate = candidate.civilizationGate;
  if (gate.pointId !== "EARTH_CIV/K108000" || gate.semanticType !== "CIVILIZATION_GATE" || gate.isPhysicalDistance !== false) {
    throw new Error("K108000 must remain a non-distance civilization gate");
  }
  return { status: "PASS", points: pointIds.size, ranges: candidate.ranges.length };
}

export function validatePhysicalMovementEvidence(movement) {
  const required = [
    "movementId",
    "lifeId",
    "originPointId",
    "nearOrbitArrivalPointId",
    "destinationPointId",
    "routeEvidenceId",
    "departureTimestamp",
    "arrivalTimestamp",
    "kshipFuelEvidenceId",
    "decelerationEvidenceId",
    "descentEvidenceId",
    "landingEvidenceId",
    "arrivalEvidenceId",
  ];
  for (const field of required) if (!movement[field]) throw new Error(`MOVEMENT_EVIDENCE_REQUIRED:${field}`);
  if (movement.originPointId !== "EARTH_CIV/K108000") throw new Error("movement must start at the civilization gate");
  if (!movement.nearOrbitArrivalPointId.startsWith("MARS/K160")) throw new Error("movement must arrive through Mars near orbit");
  if (movement.destinationPointId !== "MARS/K149") throw new Error("movement must end at the Mars surface display point");
  const departure = Date.parse(movement.departureTimestamp);
  const arrival = Date.parse(movement.arrivalTimestamp);
  if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival <= departure) {
    throw new Error("movement timestamps are invalid or non-monotonic");
  }
  return { status: "PASS", physicalPositionUpdateAllowed: true };
}
