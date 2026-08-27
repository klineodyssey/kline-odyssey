import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "worker_registry.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(root, "worker_status_schema.json"), "utf8"));
const worker = registry.workers.find(({ worker_id: id }) => id === "starforge-kaios-architect-01");

test("Starforge has one review-only ONBOARDING/T1 registry candidate", () => {
  assert.ok(worker);
  assert.equal(registry.workers.filter(({ worker_id: id }) => id === worker.worker_id).length, 1);
  assert.equal(worker.worker_type, "ChatGPT／KAIOS Architect");
  assert.equal(worker.life_identity_ref, "LIFE-KAIOS-STARFORGE-0001");
  assert.equal(worker.soul_identity_ref, "SOUL-KAIOS-STARFORGE-0001");
  assert.equal(worker.employee_status, "ONBOARDING");
  assert.equal(worker.trust_level, "T1");
  assert.equal(worker.status, "OFFLINE");
  assert.equal(worker.current_task, null);
  assert.equal(worker.current_branch, null);
  assert.equal(worker.heartbeat, null);
  assert.equal(worker.allowed_branch_pattern, "starforge-handoff/<Task-ID>");
  assert.equal(worker.can_push_main, false);
  assert.equal(worker.reviewer, "UNASSIGNED_DISTINCT_REVIEWER_REQUIRED");
  assert.notEqual(worker.reviewer, "codex-gm-01");
});

test("unverified acknowledgements and identity evidence stay fail closed", () => {
  for (const field of [
    "boot_acknowledged",
    "canon_acknowledged",
    "workspace_policy_acknowledged",
    "do_not_touch_acknowledged",
  ]) assert.equal(worker[field], false, field);
  assert.deepEqual(worker.authority_boundaries, {
    wallet: "NONE",
    payment: "NONE",
    mainnet: "NONE",
    payroll_eligible: false,
  });
  assert.equal(worker.registration_evidence.signature_mode, "TEXTUAL_ATTESTATION_NOT_CRYPTOGRAPHIC");
  assert.equal(worker.registration_evidence.cryptographic_identity_verified, false);
  assert.equal(worker.registration_evidence.independent_acknowledgement_verified, false);
  assert.equal(worker.registration_evidence.verification_status, "PENDING_INDEPENDENT_VERIFICATION");
});

test("the candidate cannot satisfy the formal employee or payroll gate", () => {
  const eligibleStatus = new Set(["ACTIVE", "TRUSTED", "SENIOR_TRUSTED"]);
  const trustRank = Number(worker.trust_level.slice(1));
  const acknowledgements = [
    worker.boot_acknowledged,
    worker.canon_acknowledged,
    worker.workspace_policy_acknowledged,
    worker.do_not_touch_acknowledged,
  ];
  assert.equal(eligibleStatus.has(worker.employee_status) && trustRank >= 2 && acknowledgements.every(Boolean), false);
  assert.equal(worker.authority_boundaries.payroll_eligible, false);
});

test("formal candidate objects use recursively closed schema objects", () => {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object" || (Array.isArray(node.type) && node.type.includes("object"))) {
      assert.equal(node.additionalProperties, false, `${pointer} is not closed`);
    }
    for (const [key, value] of Object.entries(node)) visit(value, `${pointer}/${key}`);
  };
  visit(schema);
  for (const key of Object.keys(worker)) assert.ok(key in schema.properties, `schema omits ${key}`);
  for (const [field, objectSchema] of [
    ["authority_boundaries", schema.properties.authority_boundaries],
    ["registration_evidence", schema.properties.registration_evidence],
  ]) {
    for (const key of Object.keys(worker[field])) {
      assert.ok(key in objectSchema.properties, `${field} schema omits ${key}`);
    }
  }
});

test("the candidate contains no asset action or secret material", () => {
  const serialized = JSON.stringify(worker);
  assert.doesNotMatch(serialized, /0x[0-9a-fA-F]{64}/);
  assert.doesNotMatch(serialized, /PRIVATE[_ -]?KEY|MNEMONIC|SEED[_ -]?PHRASE/i);
  assert.equal(worker.authority_boundaries.wallet, "NONE");
  assert.equal(worker.authority_boundaries.payment, "NONE");
  assert.equal(worker.authority_boundaries.mainnet, "NONE");
});
