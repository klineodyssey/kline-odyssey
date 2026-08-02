import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { renameSync, rmSync, symlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  computeContentHash,
  computeCompletionEvidenceHash,
  computeGateAttestationSubjectHash,
  computeGateEvidenceHash,
  computeOrganCompatibilitySignature,
  computePlanArtifactHash,
  computeReviewerProvenanceSubjectHash,
  computeReplayStateHash,
  computeTransplantEventHash,
  isAuthorizedWorker,
  validateJsonSchema202012,
  validateSoftwareOrganTransplant
} from "../tools/validate-software-organ-transplant.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const readText = async (path) => readFile(resolve(root, path), "utf8");

const schema = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json");
const manifestSchema = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json");
const registry = await readJson("KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json");
const organStandard = await readText("KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_STANDARD.md");
const transplantStandard = await readText("KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md");

const organTypes = [
  "INPUT_ORGAN", "OUTPUT_ORGAN", "MEMORY_ORGAN", "IDENTITY_ORGAN",
  "PHYSICS_ORGAN", "TIME_ORGAN", "LOCATION_ORGAN", "ENERGY_ORGAN",
  "ECONOMY_ORGAN", "RIGHTS_ORGAN", "SECURITY_ORGAN",
  "COMMUNICATION_ORGAN", "PROCESSING_ORGAN", "STORAGE_ORGAN",
  "VIEWER_ORGAN", "API_ORGAN", "MUTATION_ORGAN", "REPRODUCTION_ORGAN",
  "HEALING_ORGAN", "AUDIT_ORGAN"
];

const organFields = [
  "organ_id", "organ_type", "owner_life_id", "genome_contract",
  "input_interface", "output_interface", "resource_cost", "energy_cost",
  "state", "health", "compatibility_signature", "transplantable",
  "required_host_capabilities", "forbidden_hosts", "dependency_list",
  "event_history", "version_metadata"
];

const gates = [
  "DONOR_IDENTITY_VALID", "HOST_IDENTITY_VALID", "ORGAN_TYPE_COMPATIBLE",
  "GENOME_CONTRACT_COMPATIBLE", "INTERFACE_COMPATIBLE", "RIGHTS_APPROVED",
  "SECURITY_APPROVED", "RESOURCE_CAPACITY_AVAILABLE",
  "ENERGY_CAPACITY_AVAILABLE", "DEPENDENCIES_AVAILABLE",
  "LICENSE_OR_USAGE_RIGHT_VALID_SIMULATION", "MIGRATION_PLAN_READY",
  "ROLLBACK_PLAN_READY", "TESTS_PASS"
];

const transplantStates = [
  "PROPOSED", "DONOR_REVIEW", "HOST_REVIEW", "COMPATIBILITY_TEST",
  "REJECTED", "APPROVED_SIMULATION", "TRANSPLANTING", "INTEGRATION_TEST",
  "ACCEPTED", "REWORK_REQUIRED", "ROLLED_BACK", "COMPLETE"
];

const hash = (character) => character.repeat(64);
const quantity = (value, unit) => ({ value, unit, bounded: true });
const gitBlob = (commit, path) => execFileSync("git", ["show", `${commit}:${path}`], {
  cwd: root,
  encoding: null,
  maxBuffer: 32 * 1024 * 1024
});
const currentWorkerRegistry = await readJson("KGEN-KAIOS/worker_registry.json");
const trustedWorkerRegistry = JSON.parse(
  gitBlob(registry.metadata.source_commit, "KGEN-KAIOS/worker_registry.json").toString("utf8")
);

export const createValidRecord = ({
  evidenceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
} = {}) => {
  const donor = registry.software_lives.find(({ life_id }) => life_id === "LIFE-KAIOS-WORLD-VIEWER");
  const host = registry.software_lives.find(({ life_id }) => life_id === "LIFE-KAIOS-OFFICIAL-HOMEPAGE");
  const organ = donor.organs[0];
  const baselineCommit = registry.metadata.source_commit;
  const baselineStateRef = host.location.canonical_path;
  const baselineStateHash = computeContentHash(gitBlob(baselineCommit, baselineStateRef));
  const evidenceRef = "KAIOS/software-life/evidence/SOFTWARE_ORGAN_GATE_EVIDENCE_FIXTURE.json";
  const evidenceContentHash = computeContentHash(gitBlob(evidenceCommit, evidenceRef));
  const workerRegistryRef = "KGEN-KAIOS/worker_registry.json";
  const workerRegistryHash = computeContentHash(gitBlob(baselineCommit, workerRegistryRef));
  const reviewId = "REVIEW-ORGAN-TRANSPLANT-001";
  const transplantId = "TRANSPLANT-ORGAN-001";
  const path = ["PROPOSED", "DONOR_REVIEW", "HOST_REVIEW", "COMPATIBILITY_TEST", "APPROVED_SIMULATION"];
  const plannedPath = [...path, "TRANSPLANTING", "INTEGRATION_TEST", "ACCEPTED", "COMPLETE"];
  const events = [];
  let previousState = null;
  let previousHash = null;
  const resourceTotals = {};
  const energyTotals = {};
  for (const [index, nextState] of path.entries()) {
    resourceTotals.compute_millisecond = (resourceTotals.compute_millisecond ?? 0) + 1;
    energyTotals.compute_joule_proxy = (energyTotals.compute_joule_proxy ?? 0) + 1;
    const event = {
      event_id: `EVENT-TRANSPLANT-${String(index + 1).padStart(3, "0")}`,
      transplant_id: transplantId,
      donor_life_id: donor.life_id,
      host_life_id: host.life_id,
      organ_id: organ.organ_id,
      simulation_time: new Date(Date.UTC(2026, 7, 2, 11, 0, index)).toISOString(),
      actor: "CODEX_CANONICAL_REVIEW",
      action: `TRANSITION-${nextState}`,
      inputs: {
        plan_id: "PLAN-MIGRATION-001",
        plan_step_index: index,
        plan_step_action: `TRANSITION-${nextState}`
      },
      outputs: {
        replay_state_hash: computeReplayStateHash({
          seed: 11520,
          sequence: index + 1,
          simulation_time: new Date(Date.UTC(2026, 7, 2, 11, 0, index)).toISOString(),
          previous_event_hash: previousHash,
          previous_transplant_state: previousState,
          next_transplant_state: nextState,
          resource_totals: resourceTotals,
          energy_totals: energyTotals
        })
      },
      resource_delta: { compute_millisecond: 1 },
      energy_delta: { compute_joule_proxy: 1 },
      rights_decision: nextState === "APPROVED_SIMULATION" ? "APPROVED_SIMULATION" : null,
      seed: 11520,
      status: "PASS",
      reason: `Deterministic fixture transition to ${nextState}`,
      previous_transplant_state: previousState,
      next_transplant_state: nextState,
      previous_state_hash: previousHash,
      next_state_hash: ""
    };
    event.next_state_hash = computeTransplantEventHash(event);
    events.push(event);
    previousState = nextState;
    previousHash = event.next_state_hash;
  }

  const evidence = Object.fromEntries(gates.map((gate) => {
    const item = {
      result: "PASS",
      evidence_refs: [evidenceRef],
      evidence_commit: evidenceCommit,
      evidence_content_hashes: { [evidenceRef]: evidenceContentHash },
      reviewer: "CODEX_CANONICAL_REVIEW",
      reason: `${gate} fixture evidence`,
      reviewed_at: "2026-08-02T11:00:00.000Z"
    };
    item.evidence_hash = computeGateEvidenceHash(gate, item);
    return [gate, item];
  }));

  const plan = (id, steps) => {
    const value = {
      plan_id: id,
      owner: "CODEX_CANONICAL_REVIEW",
      baseline_commit: baselineCommit,
      baseline_state_ref: baselineStateRef,
      baseline_state_hash: baselineStateHash,
      artifact_hash: "",
      affected_paths: ["KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_STANDARD.md"],
      steps,
      resource_budget: quantity(16, "compute_millisecond"),
      energy_budget: quantity(16, "compute_joule_proxy"),
      maximum_downtime_seconds: 0,
      verification_commands: ["node --test KAIOS/software-life/tests/software-organ-standards.test.mjs"],
      recovery_ref: "KAIOS/software-life/RECOVERY-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-STANDARDS.md"
    };
    value.artifact_hash = computePlanArtifactHash(value);
    return value;
  };

  const record = {
    metadata: {
      schema_version: "1.0.0",
      standard_id: "KAIOS-SOFTWARE-ORGAN-STANDARD",
      standard_version: "1.0.0",
      runtime_revision: "2026.08.02",
      status: "APPROVED_SIMULATION",
      authority: "SIMULATION_ONLY"
    },
    organ: {
      organ_id: organ.organ_id,
      organ_type: organ.organ_type,
      owner_life_id: donor.life_id,
      genome_contract: {
        genome_id: donor.genome_id,
        expression_contract_id: "CONTRACT-WORLD-VIEWER-PROCESSING",
        compatibility_epoch: "KAIOS-GENESIS",
        minimum_genome_version: "1.0.0",
        state_schema_hash: hash("1"),
        event_schema_hash: hash("2"),
        code_or_artifact_hash: organ.content_hash,
        required_host_life_types: [host.life_type]
      },
      input_interface: [],
      output_interface: [],
      resource_cost: {
        compute: quantity(1, "compute_millisecond"),
        memory: quantity(1, "megabyte"),
        storage: quantity(1, "megabyte"),
        network: quantity(0, "byte")
      },
      energy_cost: {
        per_operation: quantity(1, "compute_joule_proxy"),
        maximum_per_time_step: quantity(1, "compute_joule_proxy"),
        energy_type: "HOST_ACCOUNTED_SIMULATION"
      },
      state: "ACTIVE",
      health: "HEALTHY",
      compatibility_signature: "",
      transplantable: true,
      required_host_capabilities: ["STATIC_RENDER"],
      forbidden_hosts: [],
      dependency_list: [],
      event_history: [{
        event_id: "EVENT-ORGAN-BIRTH-001",
        simulation_time: "2026-08-02T10:59:00.000Z",
        actor: "CODEX_CANONICAL_REVIEW",
        action: "ORGAN_REGISTERED",
        inputs: {}, outputs: {}, resource_delta: {}, energy_delta: {},
        rights_decision: null,
        seed: 11520,
        status: "RECORDED",
        reason: "Fixture organ registration",
        previous_state_hash: null,
        next_state_hash: hash("4")
      }],
      version_metadata: {
        genome_version: "1.0.0",
        organ_revision: "2026.08.02",
        generation: 1,
        compatibility_epoch: "KAIOS-GENESIS",
        previous_revision: null,
        changelog_ref: "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md"
      }
    },
    compatibility_review: {
      review_id: reviewId,
      donor_life_id: donor.life_id,
      donor_genome_id: donor.genome_id,
      host_life_id: host.life_id,
      host_genome_id: host.genome_id,
      host_life_type: host.life_type,
      host_capabilities: ["STATIC_RENDER"],
      organ_id: organ.organ_id,
      reviewer: "CODEX_CANONICAL_REVIEW",
      reviewer_provenance: {
        provenance_type: "IMMUTABLE_REPOSITORY_REVIEW_ATTESTATION",
        reviewer_alias: "CODEX_CANONICAL_REVIEW",
        worker_id: "codex-gm-01",
        authority_commit: baselineCommit,
        worker_registry_ref: workerRegistryRef,
        worker_registry_hash: workerRegistryHash,
        evidence_bundle_ref: evidenceRef,
        evidence_bundle_commit: evidenceCommit,
        evidence_bundle_hash: evidenceContentHash,
        review_subject_hash: hash("0"),
        simulation_only: true,
        cryptographic_user_authentication: false,
        authentication_boundary: "REPOSITORY_MERGE_AUTHORITY_OUT_OF_BAND"
      },
      gates: Object.fromEntries(gates.map((gate) => [gate, "PASS"])),
      gate_evidence: evidence,
      rights_record: {
        donor_owner: "KLINE_ODYSSEY_REPOSITORY_SIMULATION",
        donor_custodian: "CODEX_CANONICAL_REVIEW",
        host_owner: "KLINE_ODYSSEY_REPOSITORY_SIMULATION",
        host_operator: "LOCAL_USER_SIMULATION",
        transplant_right: "APPROVED_SIMULATION",
        license_or_usage_right: "APPROVED_SIMULATION",
        decision_event_id: "EVENT-TRANSPLANT-005",
        real_legal_effect: false
      },
      decision: "APPROVED_SIMULATION",
      reason: "All simulation gates pass",
      reviewed_at: "2026-08-02T11:00:00.000Z"
    },
    transplant: {
      transplant_id: transplantId,
      compatibility_review_id: reviewId,
      donor_life_id: donor.life_id,
      host_life_id: host.life_id,
      organ_id: organ.organ_id,
      state: "APPROVED_SIMULATION",
      automatic: false,
      migration_plan: plan("PLAN-MIGRATION-001", plannedPath.map((state) => (
        state === "COMPLETE" ? "COMPLETE-TRANSPLANT" : `TRANSITION-${state}`
      ))),
      rollback_plan: plan("PLAN-ROLLBACK-001", ["ROLLBACK-RESTORE"]),
      events
    },
    security_boundary: {
      simulation_only: true,
      real_wallet: false,
      real_kgen: false,
      onchain_transfer: false,
      external_autonomy: false,
      production_authority: false,
      self_modifying_production_code: false,
      protected_current_modification: false,
      constitution_source_modification: false,
      real_ownership_transfer: false
    }
  };
  record.organ.compatibility_signature = computeOrganCompatibilitySignature(record.organ, record.security_boundary);
  record.compatibility_review.reviewer_provenance.review_subject_hash = computeReviewerProvenanceSubjectHash(record);
  return record;
};

const canonicalActionForState = (state) => {
  if (state === "ROLLED_BACK") return "ROLLBACK-RESTORE";
  if (state === "COMPLETE") return "COMPLETE-TRANSPLANT";
  return `TRANSITION-${state}`;
};

const canonicalStatusForState = (state) => {
  if (state === "COMPLETE") return "COMPLETE";
  if (state === "REJECTED") return "REJECTED";
  return "PASS";
};

const rebuildEventChain = (record) => {
  let previousState = null;
  let previousHash = null;
  const resourceTotals = {};
  const energyTotals = {};
  let migrationStepIndex = 0;
  for (const [index, event] of record.transplant.events.entries()) {
    event.previous_transplant_state = previousState;
    event.previous_state_hash = previousHash;
    event.action = canonicalActionForState(event.next_transplant_state);
    const isRollbackEvent = event.next_transplant_state === "ROLLED_BACK";
    const plan = isRollbackEvent ? record.transplant.rollback_plan : record.transplant.migration_plan;
    event.inputs = {
      plan_id: plan.plan_id,
      plan_step_index: isRollbackEvent ? 0 : migrationStepIndex,
      plan_step_action: event.action
    };
    if (!isRollbackEvent) migrationStepIndex += 1;
    event.status = canonicalStatusForState(event.next_transplant_state);
    event.rights_decision = event.next_transplant_state === "APPROVED_SIMULATION" ? "APPROVED_SIMULATION" : null;
    for (const [unit, value] of Object.entries(event.resource_delta)) resourceTotals[unit] = (resourceTotals[unit] ?? 0) + value;
    for (const [unit, value] of Object.entries(event.energy_delta)) energyTotals[unit] = (energyTotals[unit] ?? 0) + value;
    event.outputs.replay_state_hash = computeReplayStateHash({
      seed: event.seed,
      sequence: index + 1,
      simulation_time: event.simulation_time,
      previous_event_hash: previousHash,
      previous_transplant_state: previousState,
      next_transplant_state: event.next_transplant_state,
      resource_totals: resourceTotals,
      energy_totals: energyTotals
    });
    event.next_state_hash = computeTransplantEventHash(event);
    previousState = event.next_transplant_state;
    previousHash = event.next_state_hash;
  }
  record.transplant.state = previousState;
};

const appendTransition = (record, state, outputs = {}) => {
  const index = record.transplant.events.length;
  const action = canonicalActionForState(state);
  if (state !== "ROLLED_BACK" && !record.transplant.migration_plan.steps.includes(action)) {
    record.transplant.migration_plan.steps.push(action);
    record.transplant.migration_plan.artifact_hash = computePlanArtifactHash(record.transplant.migration_plan);
  }
  const plannedStepIndex = state === "ROLLED_BACK"
    ? 0
    : record.transplant.migration_plan.steps.indexOf(action);
  record.transplant.events.push({
    event_id: `EVENT-TRANSPLANT-${String(index + 1).padStart(3, "0")}`,
    transplant_id: record.transplant.transplant_id,
    donor_life_id: record.transplant.donor_life_id,
    host_life_id: record.transplant.host_life_id,
    organ_id: record.transplant.organ_id,
    simulation_time: new Date(Date.UTC(2026, 7, 2, 11, 0, index)).toISOString(),
    actor: "CODEX_CANONICAL_REVIEW",
    action,
    inputs: {
      plan_id: state === "ROLLED_BACK" ? record.transplant.rollback_plan.plan_id : record.transplant.migration_plan.plan_id,
      plan_step_index: plannedStepIndex,
      plan_step_action: action
    },
    outputs: { replay_state_hash: hash("0"), ...outputs },
    resource_delta: { compute_millisecond: 1 },
    energy_delta: { compute_joule_proxy: 1 },
    rights_decision: state === "APPROVED_SIMULATION" ? "APPROVED_SIMULATION" : null,
    seed: 11520,
    status: canonicalStatusForState(state),
    reason: `Deterministic fixture transition to ${state}`,
    previous_transplant_state: null,
    next_transplant_state: state,
    previous_state_hash: null,
    next_state_hash: hash("0")
  });
  rebuildEventChain(record);
  if (state === "COMPLETE") record.metadata.status = "COMPLETE";
};

const validate = (record, options = {}) => validateSoftwareOrganTransplant(record, { repositoryRoot: root, ...options });

test("organ schema requires every canonical organ type and field", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.deepEqual(schema.$defs.organ.properties.organ_type.enum, organTypes);
  assert.deepEqual(schema.$defs.organ.required, organFields);
  assert.equal(schema.$defs.organ.additionalProperties, false);
});

test("organ interfaces and costs are bounded explicit contracts", () => {
  const requiredInterface = schema.$defs.interface.required;
  for (const field of ["interface_id", "direction", "protocol", "contract_hash", "data_classification", "cardinality", "required", "mutation_allowed"]) {
    assert.ok(requiredInterface.includes(field), field);
  }
  assert.equal(schema.$defs.interface.properties.mutation_allowed.const, false);
  assert.equal(schema.$defs.quantity.properties.bounded.const, true);
  for (const field of ["compute", "memory", "storage", "network"]) {
    assert.ok(schema.$defs.organ.properties.resource_cost.required.includes(field));
  }
});

test("transplant review is fail-closed across all gates", () => {
  assert.deepEqual(schema.$defs.compatibilityGates.required, gates);
  assert.deepEqual(schema.$defs.passedCompatibilityGates.required, gates);
  assert.deepEqual(schema.$defs.gateEvidenceSet.required, gates);
  assert.deepEqual(schema.$defs.passedGateEvidenceSet.required, gates);
  assert.deepEqual(schema.$defs.gateResult.enum, ["PASS", "FAIL", "NOT_EVALUATED"]);
  assert.equal(schema.$defs.compatibilityGates.additionalProperties, false);
  for (const gate of gates) assert.equal(schema.$defs.passedCompatibilityGates.properties[gate].const, "PASS");
  for (const gate of gates) assert.equal(schema.$defs.gateEvidenceSet.properties[gate].$ref, "#/$defs/gateEvidence");
  for (const gate of gates) assert.equal(schema.$defs.passedGateEvidenceSet.properties[gate].$ref, "#/$defs/passedGateEvidence");
  const approvedCondition = schema.allOf[0];
  assert.equal(approvedCondition.then.properties.compatibility_review.properties.decision.const, "APPROVED_SIMULATION");
  assert.equal(approvedCondition.then.properties.compatibility_review.properties.gates.$ref, "#/$defs/passedCompatibilityGates");
  assert.equal(approvedCondition.then.properties.compatibility_review.properties.gate_evidence.$ref, "#/$defs/passedGateEvidenceSet");
  assert.equal(approvedCondition.then.properties.compatibility_review.properties.rights_record.$ref, "#/$defs/approvedRightsRecord");
  const decisionCondition = schema.allOf[1];
  assert.equal(decisionCondition.if.properties.compatibility_review.properties.decision.const, "APPROVED_SIMULATION");
  assert.equal(decisionCondition.then.properties.compatibility_review.properties.gates.$ref, "#/$defs/passedCompatibilityGates");
  assert.equal(decisionCondition.then.properties.compatibility_review.properties.gate_evidence.$ref, "#/$defs/passedGateEvidenceSet");
  assert.equal(decisionCondition.then.properties.compatibility_review.properties.rights_record.$ref, "#/$defs/approvedRightsRecord");
  assert.equal(schema.$defs.transplant.properties.automatic.const, false);
  assert.ok(schema.$defs.transplant.required.includes("compatibility_review_id"));
  assert.equal(schema.$defs.transplant.properties.state.$ref, "#/$defs/transplantState");
  assert.deepEqual(schema.$defs.transplantState.enum, transplantStates);
});

test("migration, rollback and deterministic history are mandatory", () => {
  for (const field of ["migration_plan", "rollback_plan", "events"]) {
    assert.ok(schema.$defs.transplant.required.includes(field), field);
  }
  for (const field of ["event_id", "transplant_id", "donor_life_id", "host_life_id", "organ_id", "simulation_time", "actor", "action", "inputs", "outputs", "resource_delta", "energy_delta", "rights_decision", "seed", "status", "reason", "previous_transplant_state", "next_transplant_state", "previous_state_hash", "next_state_hash"]) {
    assert.ok(schema.$defs.transplantEvent.required.includes(field), field);
  }
  assert.ok(schema.$defs.transplantEventInputs.required.includes("plan_id"));
  assert.equal(schema.$defs.transplantEvent.properties.next_state_hash.$ref, "#/$defs/sha256");
  assert.equal(schema.$defs.plan.properties.baseline_commit.$ref, "#/$defs/repositoryCommit");
  for (const field of ["baseline_state_ref", "baseline_state_hash", "artifact_hash", "affected_paths", "resource_budget", "energy_budget", "maximum_downtime_seconds"]) {
    assert.ok(schema.$defs.plan.required.includes(field), field);
  }
  for (const field of ["gate_evidence", "rights_record"]) {
    assert.ok(schema.$defs.compatibilityReview.required.includes(field), field);
  }
  assert.ok(schema.$defs.compatibilityReview.required.includes("reviewer_provenance"));
  assert.ok(schema.$defs.completionEvidence.required.includes("implementation_commit"));
  assert.equal(schema.$defs.compatibilityReview.properties.reviewer_provenance.$ref, "#/$defs/reviewerProvenance");
});

test("every local schema reference resolves and declared object requirements exist", () => {
  const visit = (value, path = "schema") => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    if (typeof value.$ref === "string" && value.$ref.startsWith("#/$defs/")) {
      const key = value.$ref.slice("#/$defs/".length);
      assert.ok(Object.hasOwn(schema.$defs, key), `${path}:${value.$ref}`);
    }
    if (Array.isArray(value.required) && value.properties) {
      for (const field of value.required) assert.ok(Object.hasOwn(value.properties, field), `${path}.required:${field}`);
    }
    if (Array.isArray(value.enum)) assert.equal(new Set(value.enum).size, value.enum.length, `${path}.enum`);
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  };
  visit(schema);
});

test("all real authority remains structurally disabled", () => {
  const boundary = schema.$defs.securityBoundary.properties;
  assert.equal(boundary.simulation_only.const, true);
  for (const field of ["real_wallet", "real_kgen", "onchain_transfer", "external_autonomy", "production_authority", "self_modifying_production_code", "protected_current_modification", "constitution_source_modification", "real_ownership_transfer"]) {
    assert.equal(boundary[field].const, false, field);
  }
});

test("standards bind existing authorities and do not claim activation", () => {
  for (const source of [
    "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json",
    "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json",
    "KGEN-KAIOS/organism/taxonomy_registry.json",
    "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md",
    "KAIOS_CANONICAL_LIFE_RIGHTS_V1.md"
  ]) assert.ok(organStandard.includes(source), source);
  for (const phrase of ["SIMULATION_ONLY", "copy-and-paste integration", "automatic Canonical promotion", "real Wallet", "protected `CURRENT`"]) {
    assert.ok(`${organStandard}\n${transplantStandard}`.includes(phrase), phrase);
  }
});

test("Registry uses compact organ references and controlled transplant review", () => {
  const registryLifeIds = new Set(registry.software_lives.map(({ life_id }) => life_id));
  const registeredOrganIds = new Set();
  for (const life of registry.software_lives) {
    assert.equal(life.transplant_policy.mode, "CONTROLLED_REVIEW_ONLY");
    assert.equal(life.transplant_policy.automatic, false);
    assert.deepEqual(life.transplants, []);
    for (const organ of life.organs) {
      assert.equal(registeredOrganIds.has(organ.organ_id), false, organ.organ_id);
      registeredOrganIds.add(organ.organ_id);
      assert.match(organ.content_hash, /^[a-f0-9]{64}$/);
      assert.ok(registryLifeIds.has(life.life_id));
    }
  }
  assert.ok(registeredOrganIds.size > 0);
});

test("Manifest policy accepts controlled review while retaining denied automation", () => {
  const governedModes = manifestSchema.$defs.governedPolicy.properties.mode.enum;
  const transplantModes = manifestSchema.$defs.transplantPolicy.properties.mode.enum;
  assert.equal(governedModes.includes("CONTROLLED_REVIEW_ONLY"), false);
  assert.ok(transplantModes.includes("CONTROLLED_REVIEW_ONLY"));
  assert.equal(manifestSchema.properties.reproduction_policy.$ref, "#/$defs/governedPolicy");
  assert.equal(manifestSchema.properties.mutation_policy.$ref, "#/$defs/governedPolicy");
  assert.equal(manifestSchema.properties.transplant_policy.$ref, "#/$defs/transplantPolicy");
  assert.equal(manifestSchema.$defs.transplantPolicy.properties.automatic.const, false);
  assert.equal(manifestSchema.$defs.transplantPolicy.properties.codex_review_required.const, true);
});

test("compact Manifest and full organ contracts use the same organ vocabulary", () => {
  assert.deepEqual(manifestSchema.$defs.organType.enum, organTypes);
  assert.equal(manifestSchema.$defs.organReference.properties.organ_type.$ref, "#/$defs/organType");
  assert.equal(schema.$defs.evidenceReference.anyOf.length, 2);
});

test("Draft 2020-12 structure is executed before semantic approval", () => {
  const record = createValidRecord();
  record.metadata.undeclared_field = true;
  delete record.organ.health;
  const direct = validateJsonSchema202012(record, schema);
  assert.equal(direct.ok, false);
  assert.ok(direct.errors.some(({ keyword }) => keyword === "additionalProperties"));
  assert.ok(direct.errors.some(({ keyword }) => keyword === "required"));
  const result = validate(record);
  assert.ok(result.errors.some(({ code }) => code === "SCHEMA_VALIDATION_FAILED"));
});

test("Draft date-time validation rejects syntactically shaped impossible dates", () => {
  for (const impossible of ["2026-99-99T11:00:00.000Z", "2026-02-30T11:00:00.000Z"]) {
    const record = createValidRecord();
    record.compatibility_review.reviewed_at = impossible;
    const result = validateJsonSchema202012(record, schema);
    assert.equal(result.ok, false, impossible);
    assert.ok(
      result.errors.some(({ keyword, path }) => keyword === "format" && path.endsWith("compatibility_review.reviewed_at")),
      impossible,
    );
  }
});

test("semantic validator accepts one identity-bound deterministic transplant", () => {
  const result = validate(createValidRecord());
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("metadata cannot claim COMPLETE before the transplant completes", () => {
  const record = createValidRecord();
  record.metadata.status = "COMPLETE";
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("SCHEMA_VALIDATION_FAILED"));
  assert.ok(codes.has("METADATA_STATUS_TRANSPLANT_STATE_MISMATCH"));
});

test("semantic validator rejects unevidenced approval and missing simulated rights", () => {
  const record = createValidRecord();
  record.compatibility_review.gate_evidence.TESTS_PASS.result = "FAIL";
  record.compatibility_review.rights_record.transplant_right = "NOT_GRANTED";
  const result = validate(record);
  assert.equal(result.ok, false);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("GATE_EVIDENCE_MISMATCH"));
  assert.ok(codes.has("GATE_EVIDENCE_HASH_INVALID"));
  assert.ok(codes.has("APPROVAL_GATE_NOT_PASS"));
  assert.ok(codes.has("TRANSPLANT_RIGHT_NOT_APPROVED"));
});

test("semantic validator rejects cross-record identity and host capability drift", () => {
  const record = createValidRecord();
  record.transplant.organ_id = "ORGAN-UNRELATED-001";
  record.compatibility_review.host_capabilities = [];
  const result = validate(record);
  assert.equal(result.ok, false);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("ORGAN_ID_MISMATCH"));
  assert.ok(codes.has("HOST_CAPABILITY_MISSING"));
  assert.ok(codes.has("EVENT_IDENTITY_MISMATCH"));
});

test("semantic validator rejects caller Registry injection and requires canonical Genome evidence", () => {
  const injected = validate(createValidRecord(), { registry: { software_lives: registry.software_lives } });
  assert.ok(injected.errors.some(({ code }) => code === "CALLER_REGISTRY_FORBIDDEN"));

  const record = createValidRecord();
  record.compatibility_review.donor_genome_id = "GENOME-UNREGISTERED-DONOR";
  record.organ.genome_contract.genome_id = "GENOME-UNREGISTERED-DONOR";
  record.organ.genome_contract.code_or_artifact_hash = hash("9");
  record.organ.transplantable = false;
  const result = validate(record);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("REGISTERED_DONOR_GENOME_MISMATCH"));
  assert.ok(codes.has("REGISTERED_ORGAN_HASH_MISMATCH"));
  assert.ok(codes.has("ORGAN_NOT_TRANSPLANTABLE"));
});

test("semantic validator rejects a caller-controlled repository root", () => {
  const result = validateSoftwareOrganTransplant(createValidRecord(), { repositoryRoot: resolve(root, "..") });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "CALLER_REPOSITORY_ROOT_FORBIDDEN"));
});

test("organ compatibility signature is recomputed from the complete contract", () => {
  const record = createValidRecord();
  record.organ.required_host_capabilities.push("FORGED_CAPABILITY");
  const result = validate(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "ORGAN_COMPATIBILITY_SIGNATURE_INVALID"));
});

test("deterministic replay rejects fabricated deltas despite a rehashed envelope", () => {
  const record = createValidRecord();
  record.transplant.events[2].resource_delta.compute_millisecond = 2;
  for (let index = 2; index < record.transplant.events.length; index += 1) {
    if (index > 2) record.transplant.events[index].previous_state_hash = record.transplant.events[index - 1].next_state_hash;
    record.transplant.events[index].next_state_hash = computeTransplantEventHash(record.transplant.events[index]);
  }
  const result = validate(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "REPLAY_STATE_HASH_INVALID"));
});

test("deterministic replay derives nonzero cost from the organ contract", () => {
  const record = createValidRecord();
  for (const event of record.transplant.events) {
    event.resource_delta.compute_millisecond = 0;
    event.energy_delta.compute_joule_proxy = 0;
  }
  rebuildEventChain(record);
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("EVENT_RESOURCE_COST_MISMATCH"));
  assert.ok(codes.has("EVENT_ENERGY_COST_MISMATCH"));
  assert.ok(codes.has("REPLAY_STATE_HASH_INVALID"));
});

test("event execution must bind the matching migration plan step", () => {
  const record = createValidRecord();
  record.transplant.migration_plan.steps[0] = "UNRELATED-STEP";
  record.transplant.migration_plan.artifact_hash = computePlanArtifactHash(record.transplant.migration_plan);
  const result = validate(record);
  assert.ok(result.errors.some(({ code }) => code === "EVENT_NOT_IN_MIGRATION_PLAN"));
});

test("existing but unreachable Git commits cannot authorize evidence or baselines", () => {
  const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root, encoding: "utf8" }).trim();
  const dangling = execFileSync("git", ["commit-tree", tree, "-m", "unreachable transplant evidence"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "KAIOS Test",
      GIT_AUTHOR_EMAIL: "test@example.invalid",
      GIT_COMMITTER_NAME: "KAIOS Test",
      GIT_COMMITTER_EMAIL: "test@example.invalid"
    }
  }).trim();
  const record = createValidRecord();
  for (const plan of [record.transplant.migration_plan, record.transplant.rollback_plan]) {
    plan.baseline_commit = dangling;
    plan.artifact_hash = computePlanArtifactHash(plan);
  }
  for (const gate of gates) {
    const evidence = record.compatibility_review.gate_evidence[gate];
    evidence.evidence_commit = dangling;
    evidence.evidence_hash = computeGateEvidenceHash(gate, evidence);
  }
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("BASELINE_COMMIT_NOT_REACHABLE"));
  assert.ok(codes.has("EVIDENCE_COMMIT_NOT_REACHABLE"));
});

test("semantic validator rejects unresolved dependencies and evidence", () => {
  const record = createValidRecord();
  record.organ.dependency_list = ["LIFE-UNREGISTERED-DEPENDENCY"];
  const evidence = record.compatibility_review.gate_evidence.TESTS_PASS;
  evidence.evidence_refs = ["KAIOS/software-life/evidence/does-not-exist.json"];
  evidence.evidence_content_hashes = { "KAIOS/software-life/evidence/does-not-exist.json": hash("0") };
  evidence.evidence_hash = computeGateEvidenceHash("TESTS_PASS", evidence);
  const result = validate(record);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("DEPENDENCY_NOT_REGISTERED"));
  assert.ok(codes.has("EVIDENCE_REFERENCE_NOT_REGULAR_FILE"));
  assert.ok(codes.has("EVIDENCE_GIT_BLOB_NOT_FOUND"));
});

test("review, gate and approval actors resolve through canonical Worker Registry", () => {
  const record = createValidRecord();
  record.compatibility_review.reviewer = "UNREGISTERED_REVIEWER";
  for (const gate of gates) {
    const evidence = record.compatibility_review.gate_evidence[gate];
    evidence.reviewer = "UNREGISTERED_REVIEWER";
    evidence.evidence_hash = computeGateEvidenceHash(gate, evidence);
  }
  record.transplant.events[4].actor = "UNREGISTERED_REVIEWER";
  record.transplant.events[4].next_state_hash = computeTransplantEventHash(record.transplant.events[4]);
  for (let index = 5; index < record.transplant.events.length; index += 1) {
    record.transplant.events[index].previous_state_hash = record.transplant.events[index - 1].next_state_hash;
    record.transplant.events[index].next_state_hash = computeTransplantEventHash(record.transplant.events[index]);
  }
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("SCHEMA_VALIDATION_FAILED"));
  assert.ok(codes.has("CANONICAL_REVIEWER_NOT_AUTHORIZED"));
  assert.ok(codes.has("GATE_REVIEWER_NOT_AUTHORIZED"));
  assert.ok(codes.has("CANONICAL_EVENT_ACTOR_NOT_AUTHORIZED"));
  assert.ok(codes.has("RIGHTS_DECISION_ACTOR_NOT_AUTHORIZED"));
});

test("current Worker Registry revocation overrides historical maximum authority", () => {
  assert.equal(isAuthorizedWorker(trustedWorkerRegistry, "cursor-01", false, currentWorkerRegistry), true);
  assert.equal(isAuthorizedWorker(trustedWorkerRegistry, "CODEX_CANONICAL_REVIEW", true, currentWorkerRegistry), true);

  const revokedCursorRegistry = structuredClone(currentWorkerRegistry);
  revokedCursorRegistry.workers.find(({ worker_id }) => worker_id === "cursor-01").status = "OFFLINE";
  assert.equal(isAuthorizedWorker(trustedWorkerRegistry, "cursor-01", false, revokedCursorRegistry), false);

  const suspendedReviewerRegistry = structuredClone(currentWorkerRegistry);
  suspendedReviewerRegistry.workers.find(({ worker_id }) => worker_id === "codex-gm-01").suspension = {
    status: "SUSPENDED",
    reason: "Deterministic revocation fixture"
  };
  assert.equal(isAuthorizedWorker(
    trustedWorkerRegistry,
    "CODEX_CANONICAL_REVIEW",
    true,
    suspendedReviewerRegistry
  ), false);
});

test("review provenance is bound to immutable authority and the semantic review subject", () => {
  const record = createValidRecord();
  record.compatibility_review.reviewer_provenance.worker_id = "cursor-01";
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("REVIEWER_PROVENANCE_INVALID"));
  assert.ok(codes.has("REVIEWER_PROVENANCE_ATTESTATION_MISMATCH"));
});

test("rehashed adversarial plans cannot reuse stale gate attestations", () => {
  const record = createValidRecord();
  record.transplant.migration_plan.maximum_downtime_seconds = 999999;
  record.transplant.migration_plan.resource_budget = quantity(1e300, "compute_millisecond");
  record.transplant.migration_plan.verification_commands = ["node -e \"process.exit(0)\""];
  record.transplant.migration_plan.artifact_hash = computePlanArtifactHash(record.transplant.migration_plan);
  record.compatibility_review.reviewer_provenance.review_subject_hash = computeReviewerProvenanceSubjectHash(record);

  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("GATE_SEMANTIC_ATTESTATION_INVALID"));
  assert.ok(codes.has("REVIEWER_PROVENANCE_ATTESTATION_MISMATCH"));
});

test("repository evidence requires a regular tracked blob and matching content hash", () => {
  const directoryRecord = createValidRecord();
  const directoryEvidence = directoryRecord.compatibility_review.gate_evidence.TESTS_PASS;
  directoryEvidence.evidence_refs = ["KAIOS/software-life"];
  directoryEvidence.evidence_content_hashes = { "KAIOS/software-life": hash("0") };
  directoryEvidence.evidence_hash = computeGateEvidenceHash("TESTS_PASS", directoryEvidence);
  const directoryCodes = new Set(validate(directoryRecord).errors.map(({ code }) => code));
  assert.ok(directoryCodes.has("EVIDENCE_REFERENCE_NOT_REGULAR_FILE"));
  assert.ok(directoryCodes.has("EVIDENCE_GIT_BLOB_NOT_FOUND"));

  const hashRecord = createValidRecord();
  const hashEvidence = hashRecord.compatibility_review.gate_evidence.TESTS_PASS;
  hashEvidence.evidence_content_hashes[hashEvidence.evidence_refs[0]] = hash("0");
  hashEvidence.evidence_hash = computeGateEvidenceHash("TESTS_PASS", hashEvidence);
  assert.ok(validate(hashRecord).errors.some(({ code }) => code === "EVIDENCE_CONTENT_HASH_INVALID"));
});

test("gate PASS requires a typed identity-bound semantic attestation", () => {
  const record = createValidRecord();
  const evidence = record.compatibility_review.gate_evidence.TESTS_PASS;
  const unrelatedRef = "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json";
  evidence.evidence_refs = [unrelatedRef];
  evidence.evidence_content_hashes = {
    [unrelatedRef]: computeContentHash(gitBlob(evidence.evidence_commit, unrelatedRef))
  };
  evidence.evidence_hash = computeGateEvidenceHash("TESTS_PASS", evidence);
  const result = validate(record);
  assert.ok(result.errors.some(({ code }) => code === "GATE_SEMANTIC_ATTESTATION_INVALID"));
});

test("historical execution cannot erase its original approval requirements", () => {
  const record = createValidRecord();
  appendTransition(record, "TRANSPLANTING");
  appendTransition(record, "ROLLED_BACK", {
    restored_state_hash: record.transplant.migration_plan.baseline_state_hash,
    restored_commit: record.transplant.migration_plan.baseline_commit,
    restored_state_ref: record.transplant.migration_plan.baseline_state_ref
  });
  record.compatibility_review.decision = "NOT_EVALUATED";
  record.compatibility_review.rights_record.transplant_right = "NOT_GRANTED";
  record.compatibility_review.rights_record.license_or_usage_right = "NOT_GRANTED";
  for (const gate of gates) {
    record.compatibility_review.gates[gate] = "FAIL";
    const evidence = record.compatibility_review.gate_evidence[gate];
    evidence.result = "FAIL";
    evidence.evidence_hash = computeGateEvidenceHash(gate, evidence);
  }
  const result = validate(record);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("APPROVAL_DECISION_MISSING"));
  assert.ok(codes.has("APPROVAL_GATE_NOT_PASS"));
  assert.ok(codes.has("TRANSPLANT_RIGHT_NOT_APPROVED"));
  assert.ok(codes.has("USAGE_RIGHT_NOT_APPROVED"));
});

test("TESTS_PASS cannot contradict any preceding compatibility gate", () => {
  const record = createValidRecord();
  record.transplant.events = [record.transplant.events[0]];
  record.transplant.state = "PROPOSED";
  record.compatibility_review.decision = "NOT_EVALUATED";
  record.compatibility_review.rights_record.transplant_right = "NOT_GRANTED";
  record.compatibility_review.rights_record.license_or_usage_right = "NOT_GRANTED";
  record.compatibility_review.rights_record.decision_event_id = record.transplant.events[0].event_id;
  record.compatibility_review.gates.DONOR_IDENTITY_VALID = "FAIL";
  const evidence = record.compatibility_review.gate_evidence.DONOR_IDENTITY_VALID;
  evidence.result = "FAIL";
  evidence.evidence_hash = computeGateEvidenceHash("DONOR_IDENTITY_VALID", evidence);
  const result = validate(record);
  assert.ok(result.errors.some(({ code }) => code === "TESTS_PASS_AGGREGATE_INVALID"));
});

test("rollback plan must bind the migration pre-transplant baseline", () => {
  const record = createValidRecord();
  record.transplant.rollback_plan.baseline_commit = "f".repeat(40);
  record.transplant.rollback_plan.baseline_state_hash = hash("f");
  const result = validate(record);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("ROLLBACK_BASELINE_COMMIT_MISMATCH"));
  assert.ok(codes.has("ROLLBACK_BASELINE_STATE_MISMATCH"));
});

test("matching fabricated baseline values cannot bypass Git snapshot verification", () => {
  const record = createValidRecord();
  for (const plan of [record.transplant.migration_plan, record.transplant.rollback_plan]) {
    plan.baseline_commit = "f".repeat(40);
    plan.baseline_state_hash = hash("f");
    plan.artifact_hash = computePlanArtifactHash(plan);
  }
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("BASELINE_COMMIT_NOT_REACHABLE"));
  assert.ok(codes.has("BASELINE_STATE_NOT_REPRODUCIBLE"));
});

test("HEAD cannot be declared as a pre-transplant baseline", () => {
  const record = createValidRecord();
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const hostRef = record.transplant.migration_plan.baseline_state_ref;
  for (const plan of [record.transplant.migration_plan, record.transplant.rollback_plan]) {
    plan.baseline_commit = head;
    plan.baseline_state_hash = computeContentHash(gitBlob(head, hostRef));
    plan.artifact_hash = computePlanArtifactHash(plan);
  }
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("BASELINE_COMMIT_NOT_PRE_TRANSPLANT"));
  assert.ok(codes.has("EVIDENCE_NOT_AFTER_BASELINE"));
});

test("semantic validator rejects automatic execution and authority escalation", () => {
  const record = createValidRecord();
  record.transplant.automatic = true;
  record.security_boundary.production_authority = true;
  const result = validate(record);
  assert.equal(result.ok, false);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("AUTOMATIC_TRANSPLANT_FORBIDDEN"));
  assert.ok(codes.has("AUTHORITY_BOUNDARY_VIOLATION"));
});

test("semantic validator rejects duplicate, reordered and tampered event history", () => {
  const record = createValidRecord();
  record.transplant.events[1].event_id = record.transplant.events[0].event_id;
  record.transplant.events[2].previous_transplant_state = "PROPOSED";
  record.transplant.events[3].previous_state_hash = hash("9");
  record.transplant.events[4].next_state_hash = hash("8");
  const result = validate(record);
  assert.equal(result.ok, false);
  const codes = new Set(result.errors.map(({ code }) => code));
  assert.ok(codes.has("DUPLICATE_EVENT_ID"));
  assert.ok(codes.has("EVENT_STATE_CHAIN_BROKEN"));
  assert.ok(codes.has("EVENT_HASH_CHAIN_BROKEN"));
  assert.ok(codes.has("EVENT_HASH_INVALID"));
});

test("terminal transplant decisions require the canonical Codex actor", () => {
  const record = createValidRecord();
  appendTransition(record, "TRANSPLANTING");
  appendTransition(record, "INTEGRATION_TEST");
  appendTransition(record, "ACCEPTED");
  const final = record.transplant.events.at(-1);
  final.actor = "cursor-01";
  final.next_state_hash = computeTransplantEventHash(final);
  const result = validate(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "CANONICAL_EVENT_ACTOR_NOT_AUTHORIZED"));
});

test("COMPLETE requires a real Registry projection and immutable completion evidence", () => {
  const record = createValidRecord();
  appendTransition(record, "TRANSPLANTING");
  appendTransition(record, "INTEGRATION_TEST");
  appendTransition(record, "ACCEPTED");
  const completionCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const registryRef = "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json";
  const genomeRef = "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json";
  const integrationRef = "KAIOS/software-life/tests/software-organ-standards.test.mjs";
  const rollbackRef = record.transplant.rollback_plan.recovery_ref;
  const completion = {
    completion_commit: completionCommit,
    donor_genome_id: record.compatibility_review.donor_genome_id,
    host_genome_id: record.compatibility_review.host_genome_id,
    registry_projection_ref: registryRef,
    registry_projection_hash: computeContentHash(gitBlob(completionCommit, registryRef)),
    genome_revision_ref: genomeRef,
    genome_revision_hash: computeContentHash(gitBlob(completionCommit, genomeRef)),
    integration_evidence_refs: [integrationRef],
    integration_evidence_hashes: { [integrationRef]: computeContentHash(gitBlob(completionCommit, integrationRef)) },
    maintenance_owner: "CODEX_CANONICAL_REVIEW",
    rollback_retention_ref: rollbackRef,
    rollback_retention_hash: computeContentHash(gitBlob(completionCommit, rollbackRef)),
    attestation_hash: ""
  };
  completion.attestation_hash = computeCompletionEvidenceHash(completion);
  appendTransition(record, "COMPLETE", { completion_evidence: completion });
  const result = validate(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "COMPLETION_REGISTRY_PROJECTION_MISSING"));
  assert.ok(result.errors.some(({ code }) => code === "COMPLETION_GENOME_REVISION_IDENTITY_INVALID"));
  assert.ok(result.errors.some(({ code }) => code === "COMPLETION_INTEGRATION_EVIDENCE_INVALID"));
  assert.ok(result.errors.some(({ code }) => code === "EVIDENCE_NOT_BEFORE_COMPLETION"));
});

test("rollback must record restoration of the exact baseline state hash", () => {
  const record = createValidRecord();
  appendTransition(record, "TRANSPLANTING");
  appendTransition(record, "ROLLED_BACK", {
    restored_state_hash: record.transplant.migration_plan.baseline_state_hash,
    restored_commit: record.transplant.migration_plan.baseline_commit,
    restored_state_ref: record.transplant.migration_plan.baseline_state_ref
  });
  assert.equal(validate(record).ok, true);

  const final = record.transplant.events.at(-1);
  final.outputs.restored_state_hash = hash("0");
  rebuildEventChain(record);
  const result = validate(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "ROLLBACK_STATE_NOT_RESTORED"));
});

test("rollback execution must bind the reviewed rollback plan action", () => {
  const record = createValidRecord();
  appendTransition(record, "TRANSPLANTING");
  appendTransition(record, "ROLLED_BACK", {
    restored_state_hash: record.transplant.migration_plan.baseline_state_hash,
    restored_commit: record.transplant.migration_plan.baseline_commit,
    restored_state_ref: record.transplant.migration_plan.baseline_state_ref
  });
  record.transplant.rollback_plan.steps = ["UNEXECUTED-ROLLBACK-PLACEHOLDER"];
  record.transplant.rollback_plan.artifact_hash = computePlanArtifactHash(record.transplant.rollback_plan);
  rebuildEventChain(record);
  const codes = new Set(validate(record).errors.map(({ code }) => code));
  assert.ok(codes.has("ROLLBACK_PLAN_STEPS_INVALID"));
  assert.ok(codes.has("EVENT_NOT_IN_ROLLBACK_PLAN"));
});
