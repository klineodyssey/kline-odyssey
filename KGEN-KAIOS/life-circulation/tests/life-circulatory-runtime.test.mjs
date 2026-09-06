import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";
import { fileURLToPath } from "node:url";
import {
  HEALTH_STATES,
  PULSE_STATES,
  PulseReplayJournal,
  allocateDeterministicKaios,
  assertLedgerPurpose,
  beginMedicalRecovery,
  calculateOrganNeed,
  completeMedicalRecovery,
  deriveChainOperability,
  deriveOrganHealth,
  executePulse,
  reproductionDisposition,
  scaleCivilizationPoint,
  validateAssetConservation,
} from "../runtime/life-circulatory-runtime.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const fixture = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "examples", "whole-life-circulation.candidate.json"), "utf8"),
);
const schema = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "schemas", "life-circulatory-runtime.schema.json"), "utf8"),
);
const temporaryDirectories = [];

afterEach(() => {
  while (temporaryDirectories.length) fs.rmSync(temporaryDirectories.pop(), { recursive: true, force: true });
});

function journalPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kaios-pulse-journal-"));
  temporaryDirectories.push(directory);
  return path.join(directory, "pulse-replay.jsonl");
}

function organ(organId, priorityClass, availableKaios, targetReserve, weight = "1") {
  return {
    lifeId: "LIFE-TEST",
    organId,
    walletOrBeneficiary: `0x${organId.charCodeAt(0).toString(16).padStart(40, "0")}`,
    availableKaios: String(availableKaios),
    incomingKaios: "0",
    minimumReserve: "0",
    targetReserve: String(targetReserve),
    maximumReserve: String(targetReserve),
    scheduledWorkCostKaios: "0",
    verifiedRecoveryCostKaios: "0",
    priorityClass,
    weight,
  };
}

function vessel(destinationOrganId, priority = "P0", enabled = true) {
  return {
    routeId: `ROUTE-${destinationOrganId}`,
    lifeId: "LIFE-TEST",
    sourceOrganId: "BANK",
    destinationOrganId,
    assetType: "KAIOS",
    capacityPerPulse: "1000000",
    minimumTransfer: "1",
    maximumTransfer: "1000000",
    priority,
    cooldownSeconds: "0",
    enabled,
    inTransit: "0",
    lastTransferAt: null,
    replayProtectionId: `REPLAY-${destinationOrganId}`,
  };
}

function bank(availableKaios, minimumReserve = "0", reservedKaios = "0") {
  return {
    lifeId: "LIFE-TEST",
    organId: "BANK",
    availableKaios: String(availableKaios),
    minimumReserve: String(minimumReserve),
    reservedKaios: String(reservedKaios),
  };
}

test("every formal schema object is recursively closed", () => {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object") assert.equal(node.additionalProperties, false, `${pointer} is open`);
    for (const [key, value] of Object.entries(node)) visit(value, `${pointer}/${key}`);
  };
  visit(schema);
});

test("the candidate registers the full organ set without making K12345 every Life's heart", () => {
  const types = new Set(fixture.organs.map(({ organType }) => organType));
  for (const required of [
    "LIFE_HEART_PULSAR",
    "BRAIN_DECISION",
    "REPRODUCTION",
    "EXTERNAL_AUTHORIZED_BANK",
    "ALCHEMY_CONVERSION",
    "ENERGY_WALLET",
    "COMMUNICATION_NEURAL",
    "MOBILITY",
    "IMMUNE_MEDICAL",
    "BLOOD_BANK",
  ]) assert.ok(types.has(required), required);
  assert.equal(fixture.life.civilizationHeartRef, "K12345");
  assert.notEqual(fixture.life.lifeHeartOrganId, fixture.life.civilizationHeartRef);
  assert.notEqual(fixture.bloodBank.organId, fixture.life.lifeHeartOrganId);
  assert.equal(fixture.life.regenerationParentLifeId, null);
});

test("organ need follows target minus available plus scheduled and verified recovery costs", () => {
  assert.equal(calculateOrganNeed({
    organId: "ORGAN-X",
    availableKaios: "7",
    targetReserve: "10",
    scheduledWorkCostKaios: "4",
    verifiedRecoveryCostKaios: "3",
  }), 10n);
  assert.equal(calculateOrganNeed({
    organId: "ORGAN-Y",
    availableKaios: "20",
    targetReserve: "10",
    scheduledWorkCostKaios: "0",
    verifiedRecoveryCostKaios: "0",
  }), 0n);
});

test("P0 organs are funded before P1 and P2", () => {
  const organs = [organ("Z-P2", "P2", 0, 100), organ("B-P1", "P1", 0, 100), organ("A-P0", "P0", 0, 5)];
  const vessels = organs.map(({ organId, priorityClass }) => vessel(organId, priorityClass));
  const result = allocateDeterministicKaios({ bloodBank: bank(5), organs, vessels });
  assert.deepEqual(result.allocations.map(({ organId, amountKaios }) => [organId, amountKaios]), [["A-P0", "5"]]);
});

test("weighted integer allocation assigns rounding residue by lexical organId", () => {
  const organs = [organ("B", "P0", 0, 10), organ("A", "P0", 0, 10)];
  const vessels = organs.map(({ organId }) => vessel(organId));
  const result = allocateDeterministicKaios({ bloodBank: bank(5), organs, vessels });
  assert.deepEqual(result.allocations.map(({ organId, amountKaios }) => [organId, amountKaios]), [
    ["A", "3"],
    ["B", "2"],
  ]);
  assert.equal(result.allocatedKaios, "5");
  assert.equal(result.closingBloodBankAvailableKaios, "0");
});

test("an underfunded blood bank cannot create KAIOS or cross its minimum reserve", () => {
  const result = allocateDeterministicKaios({
    bloodBank: bank(100, 80, 20),
    organs: [organ("A", "P0", 0, 100)],
    vessels: [vessel("A")],
  });
  assert.equal(result.distributableKaios, "0");
  assert.equal(result.allocatedKaios, "0");
  assert.equal(result.closingBloodBankAvailableKaios, "100");
});

test("a transfer below the Vessel minimum fails closed and stays in the Blood Bank", () => {
  const route = vessel("A");
  route.minimumTransfer = "10";
  const result = allocateDeterministicKaios({
    bloodBank: bank(9),
    organs: [organ("A", "P0", 0, 100)],
    vessels: [route],
  });
  assert.equal(result.allocatedKaios, "0");
  assert.equal(result.closingBloodBankAvailableKaios, "9");
});

test("disabled 18888 routing cannot appropriate organ blood", () => {
  const externalBank = organ("ORGAN-EXTERNAL-BANK-18888", "P0", 0, 100);
  const result = allocateDeterministicKaios({
    bloodBank: bank(100),
    organs: [externalBank],
    vessels: [vessel(externalBank.organId, "P0", false)],
  });
  assert.equal(result.allocatedKaios, "0");
  assert.deepEqual(result.allocations, []);
});

test("one pulse conserves every internal KAIOS unit and pays no caller reward", () => {
  const snapshot = structuredClone(fixture);
  const before = BigInt(snapshot.bloodBank.availableKaios)
    + snapshot.organs.reduce((sum, item) => sum + BigInt(item.availableKaios), 0n);
  const completed = executePulse({
    snapshot,
    epoch: "42",
    pulseAt: "2026-08-22T02:00:00.000Z",
    triggeredBy: "permissionless-keeper",
    journal: new PulseReplayJournal(journalPath()),
  });
  const after = BigInt(completed.bloodBank.availableKaios)
    + completed.organs.reduce((sum, item) => sum + BigInt(item.availableKaios), 0n);
  assert.equal(before, after);
  assert.equal(completed.lastPulse.callerRewardKaios, "0");
  assert.ok(PULSE_STATES.includes(completed.pulseState));
  for (const item of completed.organs) assert.ok(BigInt(item.availableKaios) >= 0n);
});

test("same-Life same-epoch replay stays rejected after process restart", () => {
  const filePath = journalPath();
  const request = {
    snapshot: structuredClone(fixture),
    epoch: "88",
    pulseAt: "2026-08-22T03:00:00.000Z",
    triggeredBy: "keeper-a",
  };
  executePulse({ ...request, journal: new PulseReplayJournal(filePath) });
  const restarted = new PulseReplayJournal(filePath);
  assert.throws(() => executePulse({ ...request, triggeredBy: "keeper-b", journal: restarted }), /DUPLICATE_PULSE_EPOCH/);
});

test("pulse replay journal detects tampering and trusted-head rollback", () => {
  const filePath = journalPath();
  const journal = new PulseReplayJournal(filePath);
  executePulse({
    snapshot: structuredClone(fixture),
    epoch: "89",
    pulseAt: "2026-08-22T03:01:00.000Z",
    triggeredBy: "keeper",
    journal,
  });
  const trustedHead = journal.headHash;
  const original = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, original.replace("PULSE_COMPLETED", "PULSE_MISSED"));
  assert.throws(() => new PulseReplayJournal(filePath), /hash mismatch/);
  fs.writeFileSync(filePath, "");
  assert.throws(() => new PulseReplayJournal(filePath, { expectedHeadHash: trustedHead }), /trusted checkpoint/);
});

test("callers cannot substitute a registered organ beneficiary", () => {
  assert.throws(() => executePulse({
    snapshot: structuredClone(fixture),
    epoch: "90",
    pulseAt: "2026-08-22T03:02:00.000Z",
    triggeredBy: "untrusted-caller",
    journal: new PulseReplayJournal(journalPath()),
    beneficiaryOverrides: { "ORGAN-BRAIN-11520": "0x000000000000000000000000000000000000dEaD" },
  }), /BENEFICIARY_SUBSTITUTION_FORBIDDEN/);
});

test("asset conservation is exact to the smallest unit and fails on a one-unit mismatch", () => {
  assert.equal(validateAssetConservation(fixture.assetLedgers).status, "PASS");
  const broken = structuredClone(fixture.assetLedgers);
  broken[0].closingBloodBank = (BigInt(broken[0].closingBloodBank) + 1n).toString();
  assert.throws(() => validateAssetConservation(broken), /conservation mismatch/);
});

test("KAIOS, native BNB gas, and WBNB custody stay separate", () => {
  assert.equal(deriveChainOperability({ kaiosBalance: "1", nativeBnbGasBalance: "0" }), "ECONOMICALLY_FUNDED_BUT_CHAIN_INOPERABLE");
  assert.equal(deriveChainOperability({ kaiosBalance: "1", nativeBnbGasBalance: "0", gasSponsorAvailable: true }), "CHAIN_OPERABLE");
  assert.equal(assertLedgerPurpose("NATIVE_BNB_GAS", "CHAIN_GAS"), true);
  assert.throws(() => assertLedgerPurpose("WBNB_ASSET", "CHAIN_GAS"), /LEDGER_PURPOSE_FORBIDDEN/);
});

test("18888 bonds, 18911 catalyst, salary, and KAIOS blood cannot cross-spend", () => {
  assert.equal(assertLedgerPurpose("KAIOS_BLOOD", "ORGAN_CIRCULATION"), true);
  assert.equal(assertLedgerPurpose("BOND_18888", "AUTHORIZED_BOND_18888"), true);
  assert.equal(assertLedgerPurpose("CATALYST_18911", "ALCHEMY_BURN_18911"), true);
  assert.throws(() => assertLedgerPurpose("CATALYST_18911", "SALARY"), /LEDGER_PURPOSE_FORBIDDEN/);
  assert.throws(() => assertLedgerPurpose("KAIOS_BLOOD", "AUTHORIZED_BOND_18888"), /LEDGER_PURPOSE_FORBIDDEN/);
  assert.throws(() => assertLedgerPurpose("SALARY", "ALCHEMY_BURN_18911"), /LEDGER_PURPOSE_FORBIDDEN/);
});

test("health derivation follows the closed hypoglycemia and ischemia thresholds", () => {
  assert.equal(deriveOrganHealth({ availableKaios: "10", minimumReserve: "5", targetReserve: "10", validEnabledVessels: 1 }), "HEALTHY");
  assert.equal(deriveOrganHealth({ availableKaios: "7", minimumReserve: "5", targetReserve: "10", validEnabledVessels: 1 }), "LOW_BLOOD");
  assert.equal(deriveOrganHealth({ availableKaios: "1", minimumReserve: "5", targetReserve: "10", validEnabledVessels: 1 }), "ISCHEMIA_RISK");
  assert.equal(deriveOrganHealth({ availableKaios: "0", minimumReserve: "5", targetReserve: "10", validEnabledVessels: 0 }), "NO_FLOW");
  assert.equal(HEALTH_STATES.includes("DEAD"), false);
});

test("communication loss or a missed pulse never declares Life death", () => {
  assert.ok(PULSE_STATES.includes("PULSE_MISSED"));
  assert.ok(PULSE_STATES.includes("PULSE_RECOVERY_REQUIRED"));
  assert.equal(PULSE_STATES.some((state) => /DEAD|DEATH/u.test(state)), false);
  assert.equal(HEALTH_STATES.some((state) => /DEAD|DEATH/u.test(state)), false);
});

test("medical recovery requires ischemia evidence, failed work, resources, time, service, and proof", () => {
  const ischemic = { ...fixture.organs[0], healthState: "ISCHEMIA_RISK" };
  const evidence = {
    recoveryId: "RECOVERY-1",
    ischemiaEvidenceId: "ISCHEMIA-1",
    workFailureEvidenceId: "WORK-FAILURE-1",
    medicalServiceEventId: "MEDICAL-SERVICE-1",
  };
  assert.throws(() => beginMedicalRecovery({
    organ: ischemic,
    evidence: { ...evidence, medicalServiceEventId: "" },
    now: "2026-08-22T04:00:00.000Z",
    requiredResourceKaios: "10",
    minimumDurationSeconds: "60",
  }), /medicalServiceEventId/);
  const recovery = beginMedicalRecovery({
    organ: ischemic,
    evidence,
    now: "2026-08-22T04:00:00.000Z",
    requiredResourceKaios: "10",
    minimumDurationSeconds: "60",
  });
  assert.throws(() => completeMedicalRecovery({ recovery, now: "2026-08-22T04:00:59.000Z", consumedResourceKaios: "10", recoveryProofId: "PROOF" }), /time/);
  assert.throws(() => completeMedicalRecovery({ recovery, now: "2026-08-22T04:01:00.000Z", consumedResourceKaios: "9", recoveryProofId: "PROOF" }), /resources/);
  assert.throws(() => completeMedicalRecovery({ recovery, now: "2026-08-22T04:01:00.000Z", consumedResourceKaios: "10", recoveryProofId: "" }), /proof/);
  assert.equal(completeMedicalRecovery({ recovery, now: "2026-08-22T04:01:00.000Z", consumedResourceKaios: "10", recoveryProofId: "PROOF" }).state, "RECOVERED");
});

test("K16888 ischemia blocks only new reproduction and preserves existing state", () => {
  const disposition = reproductionDisposition({ healthState: "ISCHEMIA_RISK" });
  assert.deepEqual(disposition, {
    allowNewReproductionProcess: false,
    preserveExistingMarriage: true,
    preserveExistingLives: true,
    preserveExistingAssets: true,
  });
});

test("fractal organ coordinates use explicit exponents instead of guessed zeroes", () => {
  assert.equal(scaleCivilizationPoint("12345", -6), "0.012345");
  assert.equal(scaleCivilizationPoint("11520", -6), "0.011520");
  assert.equal(scaleCivilizationPoint("16888", -6), "0.016888");
  assert.equal(scaleCivilizationPoint("12345", -19), "0.0000000000000012345");
});

test("deterministic allocation fuzz preserves conservation and never goes negative", () => {
  let seed = 0x5eed1234;
  for (let iteration = 0; iteration < 128; iteration += 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const available = BigInt(seed % 10_000);
    const organs = ["A", "B", "C", "D", "E"].map((id, index) => {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      return organ(id, index < 2 ? "P0" : index < 4 ? "P1" : "P2", 0, (seed % 2_000) + 1, String((seed % 5) + 1));
    });
    const vessels = organs.map(({ organId, priorityClass }) => vessel(organId, priorityClass));
    const input = { bloodBank: bank(available), organs, vessels };
    const first = allocateDeterministicKaios(input);
    const second = allocateDeterministicKaios(input);
    assert.deepEqual(first, second);
    const total = first.allocations.reduce((sum, entry) => sum + BigInt(entry.amountKaios), 0n);
    assert.equal(total, BigInt(first.allocatedKaios));
    assert.ok(total <= available);
    assert.equal(BigInt(first.closingBloodBankAvailableKaios), available - total);
  }
});
