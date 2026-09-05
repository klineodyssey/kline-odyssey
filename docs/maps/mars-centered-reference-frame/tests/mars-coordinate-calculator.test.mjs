import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
  K_SCALE,
  altitudeAboveMarsToK,
  coordinateKey,
  exactScaleFraction,
  kmToK,
  kToKm,
  validateMarsReferenceFrame,
  validatePhysicalMovementEvidence,
} from "../runtime/mars-coordinate-calculator.mjs";

const candidate = JSON.parse(await fs.readFile(new URL("../data/mars-centered-reference-frame.candidate.json", import.meta.url), "utf8"));
const schema = JSON.parse(await fs.readFile(new URL("../schemas/mars-centered-reference-frame.schema.json", import.meta.url), "utf8"));
const baseMap = JSON.parse(await fs.readFile(new URL("../../UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json", import.meta.url), "utf8"));
const neuralMap = JSON.parse(await fs.readFile(new URL("../../../../neural/NEURAL_MAP.json", import.meta.url), "utf8"));
const dependencyIndex = JSON.parse(await fs.readFile(new URL("../../../../neural/RUNTIME_DEPENDENCY.json", import.meta.url), "utf8"));

function clone(value) {
  return structuredClone(value);
}

function assertEverySchemaObjectClosed(value, path = "#", visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);
  const objectSchema = value.type === "object" || Object.hasOwn(value, "properties");
  if (objectSchema) assert.equal(value.additionalProperties, false, `${path} must set additionalProperties=false`);
  for (const [key, child] of Object.entries(value)) assertEverySchemaObjectClosed(child, `${path}/${key}`, visited);
}

function validMovement() {
  return {
    movementId: "MOVE-LIFE-0001",
    lifeId: "LIFE-KAIOS-STARFORGE-0001",
    originPointId: "EARTH_CIV/K108000",
    nearOrbitArrivalPointId: "MARS/K160.115286",
    destinationPointId: "MARS/K149",
    routeEvidenceId: "ROUTE-EVIDENCE-0001",
    departureTimestamp: "2026-08-22T01:10:00Z",
    arrivalTimestamp: "2026-08-23T01:10:00Z",
    kshipFuelEvidenceId: "KSHIP-FUEL-EVIDENCE-0001",
    decelerationEvidenceId: "DECELERATION-EVIDENCE-0001",
    descentEvidenceId: "DESCENT-EVIDENCE-0001",
    landingEvidenceId: "LANDING-EVIDENCE-0001",
    arrivalEvidenceId: "ARRIVAL-EVIDENCE-0001",
  };
}

test("candidate inherits V10.2 without mutating its 123-point base", () => {
  assert.equal(candidate.inheritedMap.version, "V10.2");
  assert.equal(candidate.inheritedMap.mutation, "NONE");
  assert.equal(candidate.inheritedMap.pointCountPreserved, 123);
  assert.equal(baseMap.meta.total_points, 123);
  assert.equal(baseMap.layers.main_universe.points.length, 123);
});

test("every formal JSON Schema object is recursively closed", () => {
  assertEverySchemaObjectClosed(schema);
});

test("exact shared scale is preserved and conversions are deterministic", () => {
  assert.deepEqual(exactScaleFraction(), { numerator: 48050n, denominator: 2111n });
  assert.equal(K_SCALE.displayKmPerK, "22.761724301279");
  assert.equal(kmToK("384400", 0), "16888");
  assert.equal(kToKm("16888", 0), "384400");
});

test("Mars mean surface is K148.912268 and displays as K149 赤土人界", () => {
  assert.equal(kmToK("3389.50"), "148.912268");
  const surface = candidate.points.find((point) => point.pointType === "MEAN_SURFACE");
  assert.equal(surface.kIndex, "148.912268");
  assert.equal(surface.displayPointId, "MARS/K149");
  assert.equal(surface.name, "火星平均表面／赤土人界");
});

test("atmosphere and low-orbit calculations match the candidate", () => {
  assert.equal(altitudeAboveMarsToK("125"), "154.403944");
  assert.equal(altitudeAboveMarsToK("255"), "160.115286");
  assert.equal(altitudeAboveMarsToK("320"), "162.970957");
});

test("specified moon, synchronous, solar and Earth-Mars indexes remain distinct design inputs", () => {
  const byId = new Map(candidate.points.map((point) => [point.pointId, point]));
  for (const id of ["MARS/K412.007451", "MARS/K897.457719", "MARS/K1030.633694", "MARS/K10003635.796"]) {
    assert.equal(byId.has(id), true, `${id} missing`);
  }
  const earthMars = candidate.ranges.find((range) => range.rangeType === "DYNAMIC_EARTH_MARS_DISTANCE");
  assert.equal(earthMars.kIndexMin, "2398763.788");
  assert.equal(earthMars.kIndexMax, "17582147.763");
});

test("Frame ID makes equal K values collision-safe", () => {
  assert.notEqual(coordinateKey("UNIVERSE", "0"), coordinateKey("MARS_CENTERED", "0"));
  assert.equal(candidate.frame.preservedUniverseOrigin, "UNIVERSE/K0");
  assert.equal(candidate.frame.localOrigin, "MARS/K0");
  assert.equal(candidate.frame.overridesUniverseK0, false);
});

test("K108000 remains a civilization gate and never substitutes for distance", () => {
  assert.deepEqual(candidate.civilizationGate, {
    pointId: "EARTH_CIV/K108000",
    referenceFrame: "EARTH_CIV",
    semanticType: "CIVILIZATION_GATE",
    isPhysicalDistance: false,
    physicalDistanceSubstitute: false,
    status: "PRESERVED_GATE_IDENTITY",
  });
});

test("complete candidate reference evidence validates", () => {
  assert.deepEqual(validateMarsReferenceFrame(candidate), { status: "PASS", points: 8, ranges: 2 });
});

test("every position and range carries frame, epoch, timestamp, source, distance, K and uncertainty", () => {
  for (const point of candidate.points) {
    for (const field of ["referenceFrame", "epoch", "timestamp", "source", "distanceKm", "kIndex", "uncertainty"]) {
      assert.notEqual(point.positionEvidence[field], undefined, `${point.pointId}.${field}`);
    }
  }
  for (const range of candidate.ranges) {
    for (const field of ["frameId", "epoch", "timestamp", "source", "distanceKmMin", "distanceKmMax", "kIndexMin", "kIndexMax", "uncertainty"]) {
      assert.notEqual(range[field], undefined, `${range.rangeId}.${field}`);
    }
  }
});

test("missing external timestamp fails closed", () => {
  const altered = clone(candidate);
  delete altered.points[4].positionEvidence.timestamp;
  assert.throws(() => validateMarsReferenceFrame(altered), /timestamp is required/);
});

test("position evidence cannot substitute another K index or frame", () => {
  const wrongIndex = clone(candidate);
  wrongIndex.points[1].positionEvidence.kIndex = "149";
  assert.throws(() => validateMarsReferenceFrame(wrongIndex), /evidence kIndex mismatch/);
  const wrongFrame = clone(candidate);
  wrongFrame.ranges[0].frameId = "UNIVERSE";
  assert.throws(() => validateMarsReferenceFrame(wrongFrame), /wrong frame/);
});

test("movement requires route, time, KSHIP, braking, descent, landing and arrival evidence", () => {
  for (const field of [
    "routeEvidenceId",
    "departureTimestamp",
    "arrivalTimestamp",
    "kshipFuelEvidenceId",
    "decelerationEvidenceId",
    "descentEvidenceId",
    "landingEvidenceId",
    "arrivalEvidenceId",
  ]) {
    const incomplete = validMovement();
    delete incomplete[field];
    assert.throws(() => validatePhysicalMovementEvidence(incomplete), new RegExp(field));
  }
});

test("complete chronological movement envelope remains held pending trusted evidence resolution", () => {
  assert.deepEqual(validatePhysicalMovementEvidence(validMovement()), {
    status: "HOLD_EXTERNAL_EVIDENCE_VERIFICATION_REQUIRED",
    evidenceEnvelopeComplete: true,
    physicalPositionUpdateAllowed: false,
  });
  const reversed = validMovement();
  reversed.arrivalTimestamp = reversed.departureTimestamp;
  assert.throws(() => validatePhysicalMovementEvidence(reversed), /non-monotonic/);
});

test("text teleport and a route that skips Mars near orbit fail closed", () => {
  const teleport = validMovement();
  teleport.nearOrbitArrivalPointId = "MARS/K149";
  assert.throws(() => validatePhysicalMovementEvidence(teleport), /near orbit/);
  const wrongOrigin = validMovement();
  wrongOrigin.originPointId = "EARTH/K0";
  assert.throws(() => validatePhysicalMovementEvidence(wrongOrigin), /civilization gate/);
});

test("the candidate is indexed but disabled from boot and runtime loading", () => {
  const node = neuralMap.nodes.mars_centered_reference_frame_candidate;
  assert.equal(node.must_read, false);
  assert.equal(node.status, "REVIEW_ONLY_CANDIDATE");
  assert.equal(dependencyIndex.map_candidates.mars_centered_reference_frame.loaded, false);
  assert.equal(dependencyIndex.map_candidates.mars_centered_reference_frame.activation, "INDEPENDENT_REVIEW_REQUIRED");
});
