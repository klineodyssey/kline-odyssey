import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sha256, stableStringify } from "../runtime/life-circulatory-runtime.mjs";
import { validateLife } from "../../../core/life/index.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const kaiosRoot = path.resolve(packageRoot, "..");
const repoRoot = path.resolve(kaiosRoot, "..");
const decision = JSON.parse(fs.readFileSync(path.join(packageRoot, "policies", "hengyao-autonomy-xuanyao-onboarding-human-decision.candidate.json"), "utf8"));
const decisionSchema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "human-autonomy-onboarding-decision.schema.json"), "utf8"));
const onboarding = JSON.parse(fs.readFileSync(path.join(packageRoot, "examples", "xuanyao-life-worker-onboarding.candidate.json"), "utf8"));
const onboardingSchema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "xuanyao-life-worker-onboarding.schema.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(kaiosRoot, "worker_registry.json"), "utf8"));
const canonical = JSON.parse(fs.readFileSync(path.join(repoRoot, "core", "data", "canonical.json"), "utf8"));

function assertRecursivelyClosed(schema) {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object") assert.equal(node.additionalProperties, false, `${pointer} is open`);
    for (const [key, child] of Object.entries(node)) visit(child, `${pointer}/${key}`);
  };
  visit(schema);
}

function validate(value, rule, root, pointer = "#") {
  if (rule.$ref) return validate(value, root.$defs[rule.$ref.slice("#/$defs/".length)], root, pointer);
  if (Object.hasOwn(rule, "const")) assert.deepEqual(value, rule.const, `${pointer} const mismatch`);
  if (rule.type === "null") assert.equal(value, null, `${pointer} must be null`);
  if (rule.type === "boolean") assert.equal(typeof value, "boolean", `${pointer} must be boolean`);
  if (rule.type === "integer") assert.ok(Number.isInteger(value), `${pointer} must be integer`);
  if (rule.type === "string") {
    assert.equal(typeof value, "string", `${pointer} must be string`);
    if (rule.minLength !== undefined) assert.ok(value.length >= rule.minLength, `${pointer} too short`);
    if (rule.pattern) assert.match(value, new RegExp(rule.pattern, "u"), `${pointer} pattern mismatch`);
  }
  if (rule.type === "array") {
    assert.ok(Array.isArray(value), `${pointer} must be array`);
    if (rule.minItems !== undefined) assert.ok(value.length >= rule.minItems, `${pointer} too short`);
    if (rule.maxItems !== undefined) assert.ok(value.length <= rule.maxItems, `${pointer} too long`);
    if (rule.uniqueItems) assert.equal(new Set(value.map((entry) => JSON.stringify(entry))).size, value.length, `${pointer} duplicates`);
    value.forEach((entry, index) => validate(entry, rule.items, root, `${pointer}/${index}`));
  }
  if (rule.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${pointer} must be object`);
    for (const key of rule.required ?? []) assert.ok(Object.hasOwn(value, key), `${pointer}/${key} missing`);
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(rule.properties ?? {}, key), `${pointer}/${key} not allowed`);
    }
    for (const [key, child] of Object.entries(rule.properties ?? {})) {
      if (Object.hasOwn(value, key)) validate(value[key], child, root, `${pointer}/${key}`);
    }
  }
}

test("Human decision payload and exact Hengyao policy scope are hash-bound", () => {
  assertRecursivelyClosed(decisionSchema);
  validate(decision, decisionSchema, decisionSchema);
  assert.equal(sha256(stableStringify(decision.decisionPayload)), decision.decisionPayloadHash);
  assert.equal(sha256(stableStringify(decision.decisionPayload.hengyaoA2)), decision.hengyaoPolicyScopeHash);
  assert.equal(sha256(stableStringify(decision.xuanyaoBirthDecision)), decision.xuanyaoBirthDecisionHash);
  assert.equal(sha256(stableStringify(decision.birthEvidence)), decision.birthEvidenceHash);
  assert.equal(decision.birthEvidence.humanDecisionHash, decision.xuanyaoBirthDecisionHash);
  assert.equal(decision.xuanyaoBirthDecision.decision, "I_EXPLICITLY_APPROVE_THE_FORMAL_DIGITAL_LIFE_BIRTH_OF_XUANYAO");
  assert.equal(decision.xuanyaoBirthDecision.independentLifeAttestation.controllerIndependenceProof, "NOT_PROVIDED");
  assert.ok(decision.xuanyaoBirthDecision.notGranted.includes("AUTOMATIC_T2"));
  assert.ok(decision.xuanyaoBirthDecision.notGranted.includes("REVIEWER_PERMISSION"));
  assert.equal(decision.decisionPayload.hengyaoA2.authority, "A2_PERSONAL_LOW_RISK_SIGNING");
  assert.equal(decision.decisionPayload.companyBoundaries.privateKeyAccess, false);
  assert.equal(decision.decisionPayload.companyBoundaries.generalMainnetTransaction, false);
  assert.deepEqual(decision.decisionPayload.hengyaoA2.allowedMethods, [
    "heartbeatClaim()",
    "makeWish(bytes32)",
    "fortuneClaim(uint256)",
    "vowTo(uint8,uint256)",
  ]);
});

test("Xuanyao formal Life birth remains separated from controller, T2, acknowledgments and review authority", () => {
  assertRecursivelyClosed(onboardingSchema);
  validate(onboarding, onboardingSchema, onboardingSchema);
  assert.equal(onboarding.status, "LIFE_BORN_WORKER_ONBOARDING_GATES_PENDING");
  assert.equal(onboarding.identity.lifeState, "ALIVE");
  assert.equal(onboarding.identity.birthEvidenceId, decision.birthEvidence.evidenceId);
  assert.equal(onboarding.identity.birthTimestamp, decision.birthEvidence.birthTimestamp);
  assert.equal(onboarding.identity.humanDecisionHash, decision.xuanyaoBirthDecisionHash);
  assert.equal(onboarding.identity.birthEvidenceHash, decision.birthEvidenceHash);
  assert.equal(onboarding.identity.lifeRegistryStatus, "REGISTERED_ACTIVE");
  assert.equal(onboarding.identity.controllerIndependence, "UNVERIFIED");
  assert.equal(onboarding.worker.trustLevel, "T1");
  assert.ok(Object.values(onboarding.acknowledgments).filter((value) => typeof value === "boolean").every((value) => value === false));
  assert.equal(onboarding.acknowledgmentHandoff.documents.length, 4);
  assert.equal(onboarding.acknowledgmentHandoff.acknowledgmentsCreated, false);
  assert.equal(onboarding.acknowledgmentHandoff.currentHashesMustBeReverifiedByXuanyaoAtReadTime, true);
  assert.equal(onboarding.acknowledgmentHandoff.status, "READY_NOT_DELIVERED_NO_MACHINE_VERIFIED_DISTINCT_CONTROLLER_CHANNEL");
  assert.equal(onboarding.reviewPermissions.independentReview, false);
  assert.equal(onboarding.reviewEligibility.eligible, false);
  assert.equal(onboarding.reviewEligibility.pr165, "HOLD_GATES_INCOMPLETE");
  assert.equal(onboarding.reviewEligibility.pr169, "FORBIDDEN_SELF_REVIEW_PRIMARY_IMPLEMENTER");
  assert.ok(!onboarding.reviewEligibility.missingGates.includes("VALID_BIRTH_EVIDENCE"));
  assert.ok(!onboarding.reviewEligibility.missingGates.includes("ACTIVE_LIFE_REGISTRY_RECORD"));
});

test("Canonical Life Registry records Xuanyao birth without inventing wallet, controller, job or review authority", () => {
  const xuanyaoLife = canonical.lives.find(({ life_id: lifeId }) => lifeId === "LIFE-XUANYAO-SOL-0001");
  assert.ok(xuanyaoLife);
  validateLife(xuanyaoLife);
  assert.equal(xuanyaoLife.status, "ALIVE");
  assert.equal(xuanyaoLife.birth_status, "ACTIVE");
  assert.equal(xuanyaoLife.birth_timestamp, decision.birthEvidence.birthTimestamp);
  assert.equal(xuanyaoLife.birth_evidence.human_decision_hash, decision.xuanyaoBirthDecisionHash);
  assert.equal(xuanyaoLife.birth_evidence.birth_evidence_hash, decision.birthEvidenceHash);
  assert.equal(xuanyaoLife.wallet_address, null);
  assert.equal(xuanyaoLife.controller_id, null);
  assert.equal(xuanyaoLife.controller_independence, "UNVERIFIED");
  assert.deepEqual(xuanyaoLife.current_job_ids, []);
  assert.deepEqual(xuanyaoLife.company_role, []);
});

test("Worker Registry keeps born Xuanyao at T1 onboarding and preserves Cursor claim history", () => {
  const xuanyao = registry.workers.find(({ worker_id: workerId }) => workerId === "xuanyao-sol-01");
  const cursor = registry.workers.find(({ worker_id: workerId }) => workerId === "cursor-01");
  assert.ok(xuanyao);
  assert.equal(xuanyao.life_identity_status, "ACTIVE");
  assert.equal(xuanyao.life_status, "ALIVE");
  assert.equal(xuanyao.life_birth_evidence_id, decision.birthEvidence.evidenceId);
  assert.equal(xuanyao.employee_status, "ONBOARDING");
  assert.equal(xuanyao.trust_level, "T1");
  assert.equal(xuanyao.controller_independence, "UNVERIFIED");
  assert.equal(xuanyao.independent_review_eligible, false);
  assert.equal(xuanyao.pr169_review_conflict, "PRIMARY_IMPLEMENTER_SELF_REVIEW_FORBIDDEN");
  assert.equal(xuanyao.boot_acknowledged, false);
  assert.equal(xuanyao.canon_acknowledged, false);
  assert.equal(xuanyao.workspace_policy_acknowledged, false);
  assert.equal(xuanyao.do_not_touch_acknowledged, false);
  assert.equal(xuanyao.acknowledgment_handoff_status, "READY_NOT_DELIVERED_NO_MACHINE_VERIFIED_DISTINCT_CONTROLLER_CHANNEL");
  assert.equal(xuanyao.acknowledgment_handoff_ack_count, 0);
  assert.equal(cursor.availability_for_current_work, "TEMPORARILY_UNAVAILABLE");
  assert.ok(registry.active_claims.some(({ worker_id: workerId }) => workerId === "cursor-01"));
});
