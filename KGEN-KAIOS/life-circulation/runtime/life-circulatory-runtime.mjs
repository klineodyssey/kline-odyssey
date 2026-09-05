import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const HEALTH_STATES = Object.freeze([
  "HEALTHY",
  "LOW_BLOOD",
  "ISCHEMIA_RISK",
  "NO_FLOW",
  "ORGAN_FAILURE_RECOVERY_REQUIRED",
  "RECOVERING",
  "RECOVERED",
]);

export const PULSE_STATES = Object.freeze([
  "PULSE_DUE",
  "PULSE_EXECUTING",
  "PULSE_COMPLETED",
  "PULSE_MISSED",
  "PULSE_RECOVERY_REQUIRED",
]);

export const PRIORITY_CLASSES = Object.freeze(["P0", "P1", "P2"]);
export const ZERO_HASH = "0".repeat(64);

const PRIORITY_RANK = new Map(PRIORITY_CLASSES.map((priority, index) => [priority, index]));

function amount(value, label) {
  if (typeof value !== "string" && typeof value !== "bigint" && typeof value !== "number") {
    throw new TypeError(`${label} must be an integer amount`);
  }
  const parsed = BigInt(value);
  if (parsed < 0n) throw new RangeError(`${label} cannot be negative`);
  return parsed;
}

function minimum(...values) {
  return values.reduce((current, value) => (value < current ? value : current));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function calculateOrganNeed(organ) {
  const available = amount(organ.availableKaios, `${organ.organId}.availableKaios`);
  const target = amount(organ.targetReserve, `${organ.organId}.targetReserve`);
  const scheduled = amount(organ.scheduledWorkCostKaios ?? "0", `${organ.organId}.scheduledWorkCostKaios`);
  const recovery = amount(organ.verifiedRecoveryCostKaios ?? "0", `${organ.organId}.verifiedRecoveryCostKaios`);
  const need = target - available + scheduled + recovery;
  return need > 0n ? need : 0n;
}

export function deriveOrganHealth({ availableKaios, minimumReserve, targetReserve, validEnabledVessels }) {
  const available = amount(availableKaios, "availableKaios");
  const minimumReserveAmount = amount(minimumReserve, "minimumReserve");
  const target = amount(targetReserve, "targetReserve");
  if (minimumReserveAmount > target) throw new RangeError("minimumReserve cannot exceed targetReserve");
  if (available >= target) return "HEALTHY";
  if (available >= minimumReserveAmount) return "LOW_BLOOD";
  if (available === 0n && Number(validEnabledVessels) === 0) return "NO_FLOW";
  return "ISCHEMIA_RISK";
}

function routeLimit(route, need, pulseAtEpochSeconds) {
  if (!route || !route.enabled || route.assetType !== "KAIOS") return 0n;
  const capacity = amount(route.capacityPerPulse, `${route.routeId}.capacityPerPulse`);
  const inTransit = amount(route.inTransit, `${route.routeId}.inTransit`);
  const maximumTransfer = amount(route.maximumTransfer, `${route.routeId}.maximumTransfer`);
  const minimumTransfer = amount(route.minimumTransfer, `${route.routeId}.minimumTransfer`);
  if (pulseAtEpochSeconds !== undefined && route.lastTransferAt) {
    const elapsed = BigInt(pulseAtEpochSeconds) - BigInt(Math.floor(Date.parse(route.lastTransferAt) / 1_000));
    if (elapsed < amount(route.cooldownSeconds ?? "0", `${route.routeId}.cooldownSeconds`)) return 0n;
  }
  const availableCapacity = capacity > inTransit ? capacity - inTransit : 0n;
  const limit = minimum(need, availableCapacity, maximumTransfer);
  return limit >= minimumTransfer ? limit : 0n;
}

function allocateTierRaw(candidates, budget) {
  const grants = new Map(candidates.map(({ organId }) => [organId, 0n]));
  let remainingBudget = minimum(budget, candidates.reduce((sum, item) => sum + item.limit, 0n));
  let active = candidates.map((item) => ({ ...item, remainingLimit: item.limit, remainingNeed: item.need }));

  while (remainingBudget > 0n && active.length > 0) {
    const denominator = active.reduce((sum, item) => sum + item.weight * item.remainingNeed, 0n);
    if (denominator === 0n) break;
    const roundBudget = remainingBudget;
    let distributed = 0n;
    for (const item of active) {
      const rawShare = (roundBudget * item.weight * item.remainingNeed) / denominator;
      const grant = minimum(rawShare, item.remainingLimit, remainingBudget);
      if (grant === 0n) continue;
      grants.set(item.organId, grants.get(item.organId) + grant);
      item.remainingLimit -= grant;
      item.remainingNeed = item.remainingNeed > grant ? item.remainingNeed - grant : 0n;
      remainingBudget -= grant;
      distributed += grant;
    }

    active.sort((left, right) => left.organId.localeCompare(right.organId, "en"));
    for (const item of active) {
      if (remainingBudget === 0n) break;
      if (item.remainingLimit === 0n || item.remainingNeed === 0n) continue;
      grants.set(item.organId, grants.get(item.organId) + 1n);
      item.remainingLimit -= 1n;
      item.remainingNeed -= 1n;
      remainingBudget -= 1n;
      distributed += 1n;
    }

    if (distributed === 0n) break;
    active = active.filter(({ remainingLimit, remainingNeed }) => remainingLimit > 0n && remainingNeed > 0n);
  }
  return grants;
}

function allocateTier(candidates, budget) {
  const grants = allocateTierRaw(candidates, budget);
  const belowMinimum = candidates.filter(({ organId, minimumTransfer }) => {
    const grant = grants.get(organId);
    return grant > 0n && grant < minimumTransfer;
  });
  if (belowMinimum.length === 0) return grants;
  const blocked = new Set(belowMinimum.map(({ organId }) => organId));
  const retry = allocateTier(candidates.filter(({ organId }) => !blocked.has(organId)), budget);
  return new Map(candidates.map(({ organId }) => [organId, retry.get(organId) ?? 0n]));
}

export function allocateDeterministicKaios({ bloodBank, organs, vessels, pulseAtEpochSeconds }) {
  const bankAvailable = amount(bloodBank.availableKaios, "bloodBank.availableKaios");
  const bankMinimum = amount(bloodBank.minimumReserve, "bloodBank.minimumReserve");
  const alreadyReserved = amount(bloodBank.reservedKaios, "bloodBank.reservedKaios");
  const distributable = bankAvailable > bankMinimum + alreadyReserved
    ? bankAvailable - bankMinimum - alreadyReserved
    : 0n;
  const seenOrgans = new Set();
  const vesselByDestination = new Map();
  for (const vessel of vessels) {
    if (vessel.lifeId !== bloodBank.lifeId || vessel.sourceOrganId !== bloodBank.organId || vessel.assetType !== "KAIOS") continue;
    if (vesselByDestination.has(vessel.destinationOrganId)) {
      throw new Error(`multiple KAIOS blood routes target ${vessel.destinationOrganId}`);
    }
    vesselByDestination.set(vessel.destinationOrganId, vessel);
  }

  const candidates = organs.map((organ) => {
    if (organ.lifeId !== bloodBank.lifeId) throw new Error(`organ ${organ.organId} belongs to another Life`);
    if (seenOrgans.has(organ.organId)) throw new Error(`duplicate organId ${organ.organId}`);
    seenOrgans.add(organ.organId);
    if (!PRIORITY_RANK.has(organ.priorityClass)) throw new Error(`unknown priority ${organ.priorityClass}`);
    const need = calculateOrganNeed(organ);
    const route = vesselByDestination.get(organ.organId);
    if (route && route.priority !== organ.priorityClass) throw new Error(`route priority mismatch for ${organ.organId}`);
    const maximum = amount(organ.maximumReserve, `${organ.organId}.maximumReserve`);
    const available = amount(organ.availableKaios, `${organ.organId}.availableKaios`);
    const room = maximum > available ? maximum - available : 0n;
    const limit = minimum(routeLimit(route, need, pulseAtEpochSeconds), room);
    const weight = amount(organ.weight ?? "1", `${organ.organId}.weight`);
    const minimumTransfer = route ? amount(route.minimumTransfer, `${route.routeId}.minimumTransfer`) : 0n;
    if (weight === 0n) throw new RangeError(`${organ.organId}.weight must be positive`);
    return { organ, organId: organ.organId, need, limit, weight, minimumTransfer, route };
  });

  let remaining = distributable;
  const grants = new Map(candidates.map(({ organId }) => [organId, 0n]));
  for (const priority of PRIORITY_CLASSES) {
    if (remaining === 0n) break;
    const tier = candidates.filter(({ organ, need, limit }) => organ.priorityClass === priority && need > 0n && limit > 0n);
    const tierGrants = allocateTier(tier, remaining);
    const tierTotal = [...tierGrants.values()].reduce((sum, value) => sum + value, 0n);
    for (const [organId, value] of tierGrants) grants.set(organId, value);
    remaining -= tierTotal;
  }

  const allocations = candidates
    .filter(({ organId }) => grants.get(organId) > 0n)
    .sort((left, right) => {
      const priority = PRIORITY_RANK.get(left.organ.priorityClass) - PRIORITY_RANK.get(right.organ.priorityClass);
      return priority || left.organId.localeCompare(right.organId, "en");
    })
    .map(({ organ, organId, need, route }) => ({
      organId,
      routeId: route.routeId,
      beneficiary: organ.walletOrBeneficiary,
      priorityClass: organ.priorityClass,
      needKaios: need.toString(),
      amountKaios: grants.get(organId).toString(),
    }));
  const allocatedTotal = allocations.reduce((sum, entry) => sum + BigInt(entry.amountKaios), 0n);
  if (allocatedTotal > distributable) throw new Error("allocation exceeds distributable KAIOS");
  return {
    distributableKaios: distributable.toString(),
    allocatedKaios: allocatedTotal.toString(),
    unallocatedKaios: (distributable - allocatedTotal).toString(),
    closingBloodBankAvailableKaios: (bankAvailable - allocatedTotal).toString(),
    allocations,
  };
}

export function applyAllocation({ bloodBank, organs, vessels, allocation, pulseAt }) {
  const byOrgan = new Map(allocation.allocations.map((entry) => [entry.organId, entry]));
  const updatedOrgans = organs.map((organ) => {
    const transfer = byOrgan.get(organ.organId);
    if (!transfer) return { ...organ };
    const delta = BigInt(transfer.amountKaios);
    const available = amount(organ.availableKaios, `${organ.organId}.availableKaios`) + delta;
    const incoming = amount(organ.incomingKaios, `${organ.organId}.incomingKaios`) + delta;
    if (available > amount(organ.maximumReserve, `${organ.organId}.maximumReserve`)) {
      throw new Error(`${organ.organId} exceeds maximumReserve`);
    }
    const validEnabledVessels = vessels.filter(
      (route) => route.enabled && route.assetType === "KAIOS" && route.destinationOrganId === organ.organId,
    ).length;
    return {
      ...organ,
      availableKaios: available.toString(),
      incomingKaios: incoming.toString(),
      lastPulseAt: pulseAt,
      lastFlowEvidence: transfer.routeId,
      healthState: deriveOrganHealth({
        availableKaios: available,
        minimumReserve: organ.minimumReserve,
        targetReserve: organ.targetReserve,
        validEnabledVessels,
      }),
    };
  });
  const transferred = BigInt(allocation.allocatedKaios);
  const updatedBank = {
    ...bloodBank,
    availableKaios: (amount(bloodBank.availableKaios, "bloodBank.availableKaios") - transferred).toString(),
    outgoingKaios: (amount(bloodBank.outgoingKaios, "bloodBank.outgoingKaios") + transferred).toString(),
    lastPulseAt: pulseAt,
  };
  const usedRoutes = new Set(allocation.allocations.map(({ routeId }) => routeId));
  const updatedVessels = vessels.map((route) => usedRoutes.has(route.routeId) ? { ...route, lastTransferAt: pulseAt } : { ...route });
  return { bloodBank: updatedBank, organs: updatedOrgans, vessels: updatedVessels };
}

export function validateAssetConservation(assetLedgers) {
  const seen = new Set();
  const results = assetLedgers.map((ledger) => {
    const key = `${ledger.assetType}:${ledger.ledgerClass}`;
    if (seen.has(key)) throw new Error(`duplicate asset ledger ${key}`);
    seen.add(key);
    const left = amount(ledger.openingAssets, `${key}.openingAssets`)
      + amount(ledger.verifiedExternalInflow, `${key}.verifiedExternalInflow`)
      - amount(ledger.verifiedExternalOutflow, `${key}.verifiedExternalOutflow`)
      - amount(ledger.explicitFees, `${key}.explicitFees`);
    if (left < 0n) throw new Error(`${key} has unfunded outflow`);
    const organBalances = ledger.closingOrganBalances.reduce(
      (sum, entry) => sum + amount(entry.balance, `${key}.${entry.organId}`),
      0n,
    );
    const right = amount(ledger.closingBloodBank, `${key}.closingBloodBank`)
      + organBalances
      + amount(ledger.inTransit, `${key}.inTransit`)
      + amount(ledger.settlementEscrow, `${key}.settlementEscrow`);
    if (left !== right) throw new Error(`${key} conservation mismatch: ${left} != ${right}`);
    return { assetType: ledger.assetType, ledgerClass: ledger.ledgerClass, left: left.toString(), right: right.toString() };
  });
  const nativeGas = assetLedgers.find(({ assetType }) => assetType === "NATIVE_BNB");
  const wrappedGas = assetLedgers.find(({ assetType }) => assetType === "WBNB");
  if (nativeGas && wrappedGas && nativeGas.ledgerClass === wrappedGas.ledgerClass) {
    throw new Error("WBNB and native BNB must use different ledgers");
  }
  return { status: "PASS", exactToSmallestUnit: true, results };
}

export function deriveChainOperability({ kaiosBalance, nativeBnbGasBalance, gasSponsorAvailable = false }) {
  const kaios = amount(kaiosBalance, "kaiosBalance");
  const gas = amount(nativeBnbGasBalance, "nativeBnbGasBalance");
  if (kaios === 0n) return "ECONOMICALLY_UNFUNDED";
  if (gas === 0n && !gasSponsorAvailable) return "ECONOMICALLY_FUNDED_BUT_CHAIN_INOPERABLE";
  return "CHAIN_OPERABLE";
}

const LEDGER_PURPOSES = Object.freeze({
  KAIOS_BLOOD: new Set(["ORGAN_CIRCULATION"]),
  KGEN_CIVILIZATION_PASS: new Set(["CIVILIZATION_PASS"]),
  KGEN_CATALYST_ESCROW: new Set(["KGEN_CATALYST_ESCROW"]),
  SALARY: new Set(["SALARY"]),
  REWARD: new Set(["REWARD"]),
  BOND_18888: new Set(["AUTHORIZED_BOND_18888"]),
  CATALYST_18911: new Set(["ALCHEMY_BURN_18911"]),
  KUFO_LINEAGE: new Set(["KUFO_LINEAGE"]),
  KSHIP_FUEL: new Set(["KSHIP_PROPULSION"]),
  NATIVE_BNB_GAS: new Set(["CHAIN_GAS"]),
  WBNB_ASSET: new Set(["WBNB_ASSET_CUSTODY"]),
});

export function assertLedgerPurpose(ledgerClass, purpose) {
  const allowed = LEDGER_PURPOSES[ledgerClass];
  if (!allowed || !allowed.has(purpose)) throw new Error(`LEDGER_PURPOSE_FORBIDDEN:${ledgerClass}:${purpose}`);
  return true;
}

export function beginMedicalRecovery({ organ, evidence, now, requiredResourceKaios, minimumDurationSeconds }) {
  if (!["ISCHEMIA_RISK", "NO_FLOW", "ORGAN_FAILURE_RECOVERY_REQUIRED"].includes(organ.healthState)) {
    throw new Error("organ is not eligible for medical recovery");
  }
  for (const field of ["ischemiaEvidenceId", "workFailureEvidenceId", "medicalServiceEventId"]) {
    if (!evidence[field]) throw new Error(`${field} is required`);
  }
  const resources = amount(requiredResourceKaios, "requiredResourceKaios");
  const duration = amount(minimumDurationSeconds, "minimumDurationSeconds");
  if (resources === 0n || duration === 0n) throw new Error("recovery requires positive resources and time");
  return {
    recoveryId: evidence.recoveryId,
    lifeId: organ.lifeId,
    organId: organ.organId,
    state: "RECOVERING",
    startedAt: now,
    earliestCompletionAt: new Date(Date.parse(now) + Number(duration) * 1_000).toISOString(),
    requiredResourceKaios: resources.toString(),
    consumedResourceKaios: "0",
    ischemiaEvidenceId: evidence.ischemiaEvidenceId,
    workFailureEvidenceId: evidence.workFailureEvidenceId,
    medicalServiceEventId: evidence.medicalServiceEventId,
    recoveryProofId: null,
    completedAt: null,
  };
}

export function completeMedicalRecovery({ recovery, now, consumedResourceKaios, recoveryProofId }) {
  if (recovery.state !== "RECOVERING") throw new Error("recovery is not active");
  if (Date.parse(now) < Date.parse(recovery.earliestCompletionAt)) throw new Error("recovery time has not elapsed");
  const consumed = amount(consumedResourceKaios, "consumedResourceKaios");
  if (consumed < amount(recovery.requiredResourceKaios, "requiredResourceKaios")) {
    throw new Error("recovery resources are insufficient");
  }
  if (!recoveryProofId) throw new Error("recovery proof is required");
  return { ...recovery, state: "RECOVERED", consumedResourceKaios: consumed.toString(), recoveryProofId, completedAt: now };
}

export function reproductionDisposition(organ) {
  const healthyForNewProcess = ["HEALTHY", "LOW_BLOOD", "RECOVERED"].includes(organ.healthState);
  return {
    allowNewReproductionProcess: healthyForNewProcess,
    preserveExistingMarriage: true,
    preserveExistingLives: true,
    preserveExistingAssets: true,
  };
}

export function scaleCivilizationPoint(civilizationPointId, scaleExponent) {
  const point = amount(civilizationPointId, "civilizationPointId").toString();
  const exponent = Number(scaleExponent);
  if (!Number.isSafeInteger(exponent)) throw new TypeError("scaleExponent must be a safe integer");
  if (exponent >= 0) return `${point}${"0".repeat(exponent)}`;
  const places = -exponent;
  if (point.length <= places) return `0.${"0".repeat(places - point.length)}${point}`;
  return `${point.slice(0, point.length - places)}.${point.slice(point.length - places)}`;
}

export class PulseReplayJournal {
  constructor(filePath, { expectedHeadHash = null } = {}) {
    this.filePath = filePath;
    this.headHash = ZERO_HASH;
    this.sequence = 0;
    this.lifeEpochs = new Set();
    this.replayProtectionIds = new Set();
    this.#load();
    if (expectedHeadHash && expectedHeadHash !== this.headHash) throw new Error("journal head does not match trusted checkpoint");
  }

  #load() {
    if (!fs.existsSync(this.filePath)) return;
    const lines = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/u).filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line);
      const { recordHash, ...payload } = record;
      if (record.previousHash !== this.headHash) throw new Error("journal hash chain is broken");
      if (record.sequence !== this.sequence + 1) throw new Error("journal sequence is not monotonic");
      if (sha256(stableStringify(payload)) !== recordHash) throw new Error("journal record hash mismatch");
      const lifeEpoch = `${record.lifeId}:${record.epoch}`;
      if (this.lifeEpochs.has(lifeEpoch) || this.replayProtectionIds.has(record.replayProtectionId)) {
        throw new Error("journal contains replayed pulse evidence");
      }
      this.lifeEpochs.add(lifeEpoch);
      this.replayProtectionIds.add(record.replayProtectionId);
      this.sequence = record.sequence;
      this.headHash = recordHash;
    }
  }

  append({ lifeId, epoch, replayProtectionId, pulseId, state, recordedAt, allocationHash }) {
    const lifeEpoch = `${lifeId}:${epoch}`;
    if (this.lifeEpochs.has(lifeEpoch)) throw new Error("DUPLICATE_PULSE_EPOCH");
    if (this.replayProtectionIds.has(replayProtectionId)) throw new Error("DUPLICATE_REPLAY_PROTECTION_ID");
    const payload = {
      sequence: this.sequence + 1,
      lifeId,
      epoch: String(epoch),
      replayProtectionId,
      pulseId,
      state,
      recordedAt,
      allocationHash,
      previousHash: this.headHash,
    };
    const record = { ...payload, recordHash: sha256(stableStringify(payload)) };
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const descriptor = fs.openSync(this.filePath, "a", 0o600);
    try {
      fs.writeSync(descriptor, `${JSON.stringify(record)}\n`, null, "utf8");
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    this.lifeEpochs.add(lifeEpoch);
    this.replayProtectionIds.add(replayProtectionId);
    this.sequence = record.sequence;
    this.headHash = record.recordHash;
    return record;
  }
}

export function executePulse({ snapshot, epoch, pulseAt, triggeredBy, journal, beneficiaryOverrides = null }) {
  if (!(journal instanceof PulseReplayJournal)) throw new TypeError("a persistent PulseReplayJournal is required");
  if (beneficiaryOverrides && Object.keys(beneficiaryOverrides).length > 0) {
    throw new Error("BENEFICIARY_SUBSTITUTION_FORBIDDEN");
  }
  if (!snapshot.lifeId || snapshot.lifeId !== snapshot.bloodBank.lifeId) throw new Error("Life binding mismatch");
  const pulseId = `PULSE-${snapshot.lifeId}-${epoch}`;
  const replayProtectionId = sha256(`${snapshot.lifeId}:${epoch}`);
  const pulseAtEpochSeconds = Math.floor(Date.parse(pulseAt) / 1_000);
  if (!Number.isFinite(pulseAtEpochSeconds)) throw new Error("pulseAt must be an ISO timestamp");
  const allocation = allocateDeterministicKaios({
    bloodBank: snapshot.bloodBank,
    organs: snapshot.organs,
    vessels: snapshot.vessels,
    pulseAtEpochSeconds,
  });
  const opening = amount(snapshot.bloodBank.availableKaios, "bloodBank.availableKaios")
    + snapshot.organs.reduce((sum, organ) => sum + amount(organ.availableKaios, `${organ.organId}.availableKaios`), 0n);
  const updated = applyAllocation({
    bloodBank: snapshot.bloodBank,
    organs: snapshot.organs,
    vessels: snapshot.vessels,
    allocation,
    pulseAt,
  });
  const closing = amount(updated.bloodBank.availableKaios, "bloodBank.availableKaios")
    + updated.organs.reduce((sum, organ) => sum + amount(organ.availableKaios, `${organ.organId}.availableKaios`), 0n);
  if (opening !== closing) throw new Error("pulse violates exact KAIOS conservation");
  const outstandingNeed = snapshot.organs.reduce((sum, organ) => sum + calculateOrganNeed(organ), 0n);
  const state = BigInt(allocation.allocatedKaios) === 0n && outstandingNeed > 0n
    ? "PULSE_RECOVERY_REQUIRED"
    : "PULSE_COMPLETED";
  const record = journal.append({
    lifeId: snapshot.lifeId,
    epoch,
    replayProtectionId,
    pulseId,
    state,
    recordedAt: pulseAt,
    allocationHash: sha256(stableStringify(allocation)),
  });
  return {
    ...snapshot,
    bloodBank: updated.bloodBank,
    organs: updated.organs,
    vessels: updated.vessels,
    pulseState: state,
    lastPulse: {
      pulseId,
      lifeId: snapshot.lifeId,
      epoch: String(epoch),
      triggeredBy,
      triggeredAt: pulseAt,
      completedAt: pulseAt,
      callerRewardKaios: "0",
      replayProtectionId,
      journalRecordHash: record.recordHash,
      allocation,
    },
  };
}
