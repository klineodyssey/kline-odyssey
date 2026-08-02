/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-VALIDATOR
 * species_id: SPECIES-KAIOS-SOFTWARE-TOOL
 * genome_id: GENOME-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-VALIDATOR
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: AUDIT_ORGAN
 * canonical_filename: validate-software-organ-transplant.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const COMPATIBILITY_GATES = Object.freeze([
  "DONOR_IDENTITY_VALID",
  "HOST_IDENTITY_VALID",
  "ORGAN_TYPE_COMPATIBLE",
  "GENOME_CONTRACT_COMPATIBLE",
  "INTERFACE_COMPATIBLE",
  "RIGHTS_APPROVED",
  "SECURITY_APPROVED",
  "RESOURCE_CAPACITY_AVAILABLE",
  "ENERGY_CAPACITY_AVAILABLE",
  "DEPENDENCIES_AVAILABLE",
  "LICENSE_OR_USAGE_RIGHT_VALID_SIMULATION",
  "MIGRATION_PLAN_READY",
  "ROLLBACK_PLAN_READY",
  "TESTS_PASS"
]);

export const TRANSPLANT_STATES = Object.freeze([
  "PROPOSED",
  "DONOR_REVIEW",
  "HOST_REVIEW",
  "COMPATIBILITY_TEST",
  "REJECTED",
  "APPROVED_SIMULATION",
  "TRANSPLANTING",
  "INTEGRATION_TEST",
  "ACCEPTED",
  "REWORK_REQUIRED",
  "ROLLED_BACK",
  "COMPLETE"
]);

const APPROVED_STATES = new Set([
  "APPROVED_SIMULATION",
  "TRANSPLANTING",
  "INTEGRATION_TEST",
  "ACCEPTED",
  "COMPLETE"
]);

const ALLOWED_TRANSITIONS = new Map([
  [null, new Set(["PROPOSED"])],
  ["PROPOSED", new Set(["DONOR_REVIEW", "REJECTED"])],
  ["DONOR_REVIEW", new Set(["HOST_REVIEW", "REWORK_REQUIRED", "REJECTED"])],
  ["HOST_REVIEW", new Set(["COMPATIBILITY_TEST", "REWORK_REQUIRED", "REJECTED"])],
  ["COMPATIBILITY_TEST", new Set(["APPROVED_SIMULATION", "REWORK_REQUIRED", "REJECTED"])],
  ["APPROVED_SIMULATION", new Set(["TRANSPLANTING", "REWORK_REQUIRED"])],
  ["TRANSPLANTING", new Set(["INTEGRATION_TEST", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["INTEGRATION_TEST", new Set(["ACCEPTED", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["ACCEPTED", new Set(["COMPLETE", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["REWORK_REQUIRED", new Set(["DONOR_REVIEW", "HOST_REVIEW", "COMPATIBILITY_TEST", "TRANSPLANTING", "REJECTED", "ROLLED_BACK"])],
  ["REJECTED", new Set()],
  ["ROLLED_BACK", new Set()],
  ["COMPLETE", new Set()]
]);

const canonicalJson = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(",")}}`;
};

export const computeTransplantEventHash = (event) => {
  const payload = { ...event };
  delete payload.next_state_hash;
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
};

export const computeGateEvidenceHash = (gate, evidence) => createHash("sha256")
  .update(canonicalJson({
    gate,
    result: evidence.result,
    evidence_refs: evidence.evidence_refs,
    reviewer: evidence.reviewer,
    reason: evidence.reason,
    reviewed_at: evidence.reviewed_at
  }))
  .digest("hex");

const push = (errors, code, path, message) => errors.push({ code, path, message });

const registryMaps = (registry) => {
  const lives = Array.isArray(registry?.software_lives) ? registry.software_lives : [];
  const lifeById = new Map(lives.map((life) => [life.life_id, life]));
  const organById = new Map();
  for (const life of lives) {
    for (const organ of life.organs ?? []) organById.set(organ.organ_id, { life, organ });
  }
  return { lives, lifeById, organById };
};

export const validateSoftwareOrganTransplant = (record, { registry, repositoryRoot } = {}) => {
  const errors = [];
  const organ = record?.organ;
  const review = record?.compatibility_review;
  const transplant = record?.transplant;

  if (!organ || !review || !transplant) {
    push(errors, "RECORD_SECTION_MISSING", "$", "organ, compatibility_review and transplant are required");
    return { ok: false, errors };
  }

  const registryIndex = registryMaps(registry);
  if (registryIndex.lives.length === 0) {
    push(errors, "AUTHORITATIVE_REGISTRY_REQUIRED", "registry", "an authoritative Software Life Registry is required");
  }

  if (organ.organ_id !== review.organ_id || organ.organ_id !== transplant.organ_id) {
    push(errors, "ORGAN_ID_MISMATCH", "organ.organ_id", "organ, review and transplant must reference one organ identity");
  }
  if (organ.owner_life_id !== review.donor_life_id || review.donor_life_id !== transplant.donor_life_id) {
    push(errors, "DONOR_IDENTITY_MISMATCH", "compatibility_review.donor_life_id", "donor identity must own the organ and match the transplant");
  }
  if (organ.genome_contract?.genome_id !== review.donor_genome_id) {
    push(errors, "DONOR_GENOME_MISMATCH", "compatibility_review.donor_genome_id", "reviewed donor Genome must match the organ Genome contract");
  }
  if (review.host_life_id !== transplant.host_life_id) {
    push(errors, "HOST_IDENTITY_MISMATCH", "compatibility_review.host_life_id", "review and transplant host identities must match");
  }
  if (review.review_id !== transplant.compatibility_review_id) {
    push(errors, "REVIEW_ID_MISMATCH", "transplant.compatibility_review_id", "transplant must bind the reviewed compatibility decision");
  }
  if (transplant.automatic !== false) {
    push(errors, "AUTOMATIC_TRANSPLANT_FORBIDDEN", "transplant.automatic", "software organ transplantation requires explicit Codex review");
  }
  if (transplant.rollback_plan?.baseline_commit !== transplant.migration_plan?.baseline_commit) {
    push(errors, "ROLLBACK_BASELINE_COMMIT_MISMATCH", "transplant.rollback_plan.baseline_commit", "rollback and migration plans must bind the same pre-transplant commit");
  }
  if (transplant.rollback_plan?.baseline_state_hash !== transplant.migration_plan?.baseline_state_hash) {
    push(errors, "ROLLBACK_BASELINE_STATE_MISMATCH", "transplant.rollback_plan.baseline_state_hash", "rollback and migration plans must bind the same pre-transplant state hash");
  }
  if (organ.forbidden_hosts?.includes(review.host_life_id)) {
    push(errors, "FORBIDDEN_HOST", "compatibility_review.host_life_id", "host is explicitly forbidden by the donor organ");
  }
  if (!organ.genome_contract?.required_host_life_types?.includes(review.host_life_type)) {
    push(errors, "HOST_LIFE_TYPE_INCOMPATIBLE", "compatibility_review.host_life_type", "host Life type is outside the organ Genome contract");
  }
  for (const capability of organ.required_host_capabilities ?? []) {
    if (!review.host_capabilities?.includes(capability)) {
      push(errors, "HOST_CAPABILITY_MISSING", "compatibility_review.host_capabilities", `missing required host capability: ${capability}`);
    }
  }

  const donorLife = registryIndex.lifeById.get(review.donor_life_id);
  const hostLife = registryIndex.lifeById.get(review.host_life_id);
  if (!donorLife) {
    push(errors, "LIFE_ID_NOT_REGISTERED", "compatibility_review.donor_life_id", `${review.donor_life_id} is not registered`);
  } else {
    if (donorLife.genome_id !== review.donor_genome_id) {
      push(errors, "REGISTERED_DONOR_GENOME_MISMATCH", "compatibility_review.donor_genome_id", "donor Genome must equal the authoritative Registry record");
    }
    const registeredOrgan = donorLife.organs?.find(({ organ_id }) => organ_id === organ.organ_id);
    if (!registeredOrgan) {
      push(errors, "DONOR_ORGAN_NOT_REGISTERED", "organ.organ_id", "organ must belong to the registered donor Life");
    } else {
      if (registeredOrgan.organ_type !== organ.organ_type) {
        push(errors, "REGISTERED_ORGAN_TYPE_MISMATCH", "organ.organ_type", "organ type must equal the authoritative Registry projection");
      }
      if (registeredOrgan.content_hash !== organ.genome_contract?.code_or_artifact_hash) {
        push(errors, "REGISTERED_ORGAN_HASH_MISMATCH", "organ.genome_contract.code_or_artifact_hash", "organ artifact hash must equal the authoritative Registry projection");
      }
    }
  }
  if (!hostLife) {
    push(errors, "LIFE_ID_NOT_REGISTERED", "compatibility_review.host_life_id", `${review.host_life_id} is not registered`);
  } else {
    if (hostLife.genome_id !== review.host_genome_id) {
      push(errors, "REGISTERED_HOST_GENOME_MISMATCH", "compatibility_review.host_genome_id", "host Genome must equal the authoritative Registry record");
    }
    if (hostLife.life_type !== review.host_life_type) {
      push(errors, "REGISTERED_HOST_TYPE_MISMATCH", "compatibility_review.host_life_type", "host Life type must equal the authoritative Registry record");
    }
  }
  if (organ.transplantable !== true) {
    push(errors, "ORGAN_NOT_TRANSPLANTABLE", "organ.transplantable", "donor organ must explicitly allow controlled transplant review");
  }
  for (const [index, dependencyId] of (organ.dependency_list ?? []).entries()) {
    if (!registryIndex.lifeById.has(dependencyId) && !registryIndex.organById.has(dependencyId)) {
      push(errors, "DEPENDENCY_NOT_REGISTERED", `organ.dependency_list[${index}]`, `${dependencyId} is not an authoritative Life or Organ ID`);
    }
  }

  const boundary = record.security_boundary ?? {};
  if (boundary.simulation_only !== true) {
    push(errors, "SIMULATION_BOUNDARY_MISSING", "security_boundary.simulation_only", "transplant records must remain simulation-only");
  }
  for (const field of [
    "real_wallet",
    "real_kgen",
    "onchain_transfer",
    "external_autonomy",
    "production_authority",
    "self_modifying_production_code",
    "protected_current_modification",
    "constitution_source_modification",
    "real_ownership_transfer"
  ]) {
    if (boundary[field] !== false) push(errors, "AUTHORITY_BOUNDARY_VIOLATION", `security_boundary.${field}`, `${field} must be false`);
  }

  const events = Array.isArray(transplant.events) ? transplant.events : [];
  const evidenceEventIds = new Set([
    ...(organ.event_history ?? []).map(({ event_id }) => event_id),
    ...events.map(({ event_id }) => event_id)
  ]);

  for (const gate of COMPATIBILITY_GATES) {
    const result = review.gates?.[gate];
    const evidence = review.gate_evidence?.[gate];
    if (!evidence) {
      push(errors, "GATE_EVIDENCE_MISSING", `compatibility_review.gate_evidence.${gate}`, "gate evidence is required");
    } else if (result !== evidence.result) {
      push(errors, "GATE_EVIDENCE_MISMATCH", `compatibility_review.gate_evidence.${gate}.result`, "evidence result must equal the aggregate gate result");
    }
    if (evidence && evidence.evidence_hash !== computeGateEvidenceHash(gate, evidence)) {
      push(errors, "GATE_EVIDENCE_HASH_INVALID", `compatibility_review.gate_evidence.${gate}.evidence_hash`, "evidence hash must bind the canonical evidence record");
    }
    for (const [index, reference] of (evidence?.evidence_refs ?? []).entries()) {
      const path = `compatibility_review.gate_evidence.${gate}.evidence_refs[${index}]`;
      if (reference.includes("/")) {
        const target = repositoryRoot ? resolve(repositoryRoot, reference) : null;
        const relativeTarget = target ? relative(resolve(repositoryRoot), target) : "..";
        const escapesRoot = relativeTarget === ".." || relativeTarget.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relativeTarget);
        if (!target || escapesRoot || !existsSync(target)) {
          push(errors, "EVIDENCE_REFERENCE_UNRESOLVED", path, `${reference} does not resolve under the repository root`);
        }
      } else if (!evidenceEventIds.has(reference)) {
        push(errors, "EVIDENCE_REFERENCE_UNRESOLVED", path, `${reference} does not resolve to an event in this record`);
      }
    }
  }

  if (review.gates?.TESTS_PASS === "PASS" || review.gate_evidence?.TESTS_PASS?.result === "PASS") {
    for (const gate of COMPATIBILITY_GATES.filter((name) => name !== "TESTS_PASS")) {
      if (review.gates?.[gate] !== "PASS" || review.gate_evidence?.[gate]?.result !== "PASS") {
        push(errors, "TESTS_PASS_AGGREGATE_INVALID", "compatibility_review.gates.TESTS_PASS", `TESTS_PASS cannot pass while ${gate} is not PASS`);
      }
    }
  }

  const approvalClaimed = review.decision === "APPROVED_SIMULATION"
    || APPROVED_STATES.has(transplant.state)
    || events.some(({ next_transplant_state }) => APPROVED_STATES.has(next_transplant_state));
  if (approvalClaimed) {
    if (review.decision !== "APPROVED_SIMULATION") {
      push(errors, "APPROVAL_DECISION_MISSING", "compatibility_review.decision", "approved transplant state requires an approved review decision");
    }
    for (const gate of COMPATIBILITY_GATES) {
      if (review.gates?.[gate] !== "PASS" || review.gate_evidence?.[gate]?.result !== "PASS") {
        push(errors, "APPROVAL_GATE_NOT_PASS", `compatibility_review.gates.${gate}`, "approved transplant requires PASS gate and PASS evidence");
      }
    }
    if (review.rights_record?.transplant_right !== "APPROVED_SIMULATION") {
      push(errors, "TRANSPLANT_RIGHT_NOT_APPROVED", "compatibility_review.rights_record.transplant_right", "approved transplant requires simulated transplant right");
    }
    if (review.rights_record?.license_or_usage_right !== "APPROVED_SIMULATION") {
      push(errors, "USAGE_RIGHT_NOT_APPROVED", "compatibility_review.rights_record.license_or_usage_right", "approved transplant requires simulated usage right");
    }
  }

  if (events.length === 0) {
    push(errors, "EVENT_CHAIN_MISSING", "transplant.events", "at least one transplant event is required");
    return { ok: false, errors };
  }

  const eventIds = new Set();
  let priorHash = null;
  let priorState = null;
  let priorTime = null;
  const seed = events[0].seed;
  for (const [index, event] of events.entries()) {
    const path = `transplant.events[${index}]`;
    if (eventIds.has(event.event_id)) push(errors, "DUPLICATE_EVENT_ID", `${path}.event_id`, "event_id must be unique");
    eventIds.add(event.event_id);
    for (const [field, expected] of [
      ["transplant_id", transplant.transplant_id],
      ["donor_life_id", transplant.donor_life_id],
      ["host_life_id", transplant.host_life_id],
      ["organ_id", transplant.organ_id]
    ]) {
      if (event[field] !== expected) push(errors, "EVENT_IDENTITY_MISMATCH", `${path}.${field}`, `${field} must bind the transplant identity`);
    }
    if (event.previous_state_hash !== priorHash) push(errors, "EVENT_HASH_CHAIN_BROKEN", `${path}.previous_state_hash`, "previous hash must equal the prior event next hash");
    if (event.previous_transplant_state !== priorState) push(errors, "EVENT_STATE_CHAIN_BROKEN", `${path}.previous_transplant_state`, "previous state must equal the prior event next state");
    if (!ALLOWED_TRANSITIONS.get(priorState)?.has(event.next_transplant_state)) {
      push(errors, "INVALID_STATE_TRANSITION", `${path}.next_transplant_state`, `${priorState ?? "NULL"} cannot transition to ${event.next_transplant_state}`);
    }
    if (event.next_state_hash !== computeTransplantEventHash(event)) {
      push(errors, "EVENT_HASH_INVALID", `${path}.next_state_hash`, "next state hash must be recomputed from the canonical event envelope");
    }
    if (event.seed !== seed) push(errors, "EVENT_SEED_MISMATCH", `${path}.seed`, "all events in one deterministic replay must use one seed");
    const currentTime = Date.parse(event.simulation_time);
    if (!Number.isFinite(currentTime) || (priorTime !== null && currentTime < priorTime)) {
      push(errors, "EVENT_TIME_INVALID", `${path}.simulation_time`, "event times must be valid and nondecreasing");
    }
    if (event.next_transplant_state === "ROLLED_BACK") {
      if (event.outputs?.restored_state_hash !== transplant.migration_plan?.baseline_state_hash) {
        push(errors, "ROLLBACK_STATE_NOT_RESTORED", `${path}.outputs.restored_state_hash`, "rollback event must restore the migration plan pre-transplant state hash");
      }
      if (event.outputs?.restored_commit !== transplant.migration_plan?.baseline_commit) {
        push(errors, "ROLLBACK_COMMIT_NOT_RESTORED", `${path}.outputs.restored_commit`, "rollback event must restore the migration plan pre-transplant commit");
      }
    }
    priorHash = event.next_state_hash;
    priorState = event.next_transplant_state;
    priorTime = currentTime;
  }

  if (priorState !== transplant.state) {
    push(errors, "FINAL_STATE_MISMATCH", "transplant.state", "transplant state must equal the final event state");
  }
  const rightsEvent = events.find(({ event_id }) => event_id === review.rights_record?.decision_event_id);
  if (!rightsEvent) {
    push(errors, "RIGHTS_EVENT_MISSING", "compatibility_review.rights_record.decision_event_id", "rights decision must resolve to a transplant event");
  } else if (approvalClaimed && (rightsEvent.next_transplant_state !== "APPROVED_SIMULATION" || rightsEvent.rights_decision !== "APPROVED_SIMULATION")) {
    push(errors, "RIGHTS_EVENT_NOT_APPROVAL", "compatibility_review.rights_record.decision_event_id", "rights decision event must be the recorded approved-simulation transition");
  }

  return { ok: errors.length === 0, errors };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const [recordPath, registryPath] = process.argv.slice(2);
  if (!recordPath || !registryPath) {
    console.error("Usage: node validate-software-organ-transplant.mjs <record.json> <registry.json>");
    process.exitCode = 2;
  } else {
    const record = JSON.parse(await readFile(recordPath, "utf8"));
    const registry = JSON.parse(await readFile(registryPath, "utf8"));
    const result = validateSoftwareOrganTransplant(record, { registry, repositoryRoot: process.cwd() });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  }
}
