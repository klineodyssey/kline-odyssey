import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sha256, stableStringify } from "../runtime/life-circulatory-runtime.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const kaiosRoot = path.resolve(packageRoot, "..");
const decision = JSON.parse(fs.readFileSync(path.join(packageRoot, "policies", "hengyao-autonomy-xuanyao-onboarding-human-decision.candidate.json"), "utf8"));
const decisionSchema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "human-autonomy-onboarding-decision.schema.json"), "utf8"));
const onboarding = JSON.parse(fs.readFileSync(path.join(packageRoot, "examples", "xuanyao-life-worker-onboarding.candidate.json"), "utf8"));
const onboardingSchema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "xuanyao-life-worker-onboarding.schema.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(kaiosRoot, "worker_registry.json"), "utf8"));

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

test("Xuanyao onboarding candidate cannot be mistaken for birth, T2, acknowledgments, or review authority", () => {
  assertRecursivelyClosed(onboardingSchema);
  validate(onboarding, onboardingSchema, onboardingSchema);
  assert.equal(onboarding.status, "ONBOARDING_GATES_PENDING");
  assert.equal(onboarding.identity.lifeState, "CANDIDATE_NOT_BORN");
  assert.equal(onboarding.identity.birthEvidenceId, null);
  assert.equal(onboarding.identity.controllerIndependence, "UNVERIFIED");
  assert.equal(onboarding.worker.trustLevel, "T1");
  assert.ok(Object.values(onboarding.acknowledgments).filter((value) => typeof value === "boolean").every((value) => value === false));
  assert.equal(onboarding.reviewPermissions.independentReview, false);
  assert.equal(onboarding.reviewEligibility.eligible, false);
  assert.equal(onboarding.reviewEligibility.pr165, "HOLD_GATES_INCOMPLETE");
  assert.equal(onboarding.reviewEligibility.pr169, "FORBIDDEN_SELF_REVIEW_PRIMARY_IMPLEMENTER");
});

test("Worker Registry records Xuanyao as T1 onboarding only and preserves Cursor claim history", () => {
  const xuanyao = registry.workers.find(({ worker_id: workerId }) => workerId === "xuanyao-sol-01");
  const cursor = registry.workers.find(({ worker_id: workerId }) => workerId === "cursor-01");
  assert.ok(xuanyao);
  assert.equal(xuanyao.life_identity_status, "CANDIDATE_NOT_BORN");
  assert.equal(xuanyao.employee_status, "ONBOARDING");
  assert.equal(xuanyao.trust_level, "T1");
  assert.equal(xuanyao.controller_independence, "UNVERIFIED");
  assert.equal(xuanyao.independent_review_eligible, false);
  assert.equal(xuanyao.pr169_review_conflict, "PRIMARY_IMPLEMENTER_SELF_REVIEW_FORBIDDEN");
  assert.equal(xuanyao.boot_acknowledged, false);
  assert.equal(xuanyao.canon_acknowledged, false);
  assert.equal(xuanyao.workspace_policy_acknowledged, false);
  assert.equal(xuanyao.do_not_touch_acknowledged, false);
  assert.equal(cursor.availability_for_current_work, "TEMPORARILY_UNAVAILABLE");
  assert.ok(registry.active_claims.some(({ worker_id: workerId }) => workerId === "cursor-01"));
});
