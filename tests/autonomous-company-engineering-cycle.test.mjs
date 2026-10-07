import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  planAutonomousCompanyEngineeringCycle,
  planActiveCompanyOperatingCycle,
  resolveActiveCompanyRepositoryEvidence,
  validateActiveCompanyBoot,
  validateActiveCompanyRegistryEvidence,
  persistAutonomousCompanyEngineeringCycle,
  restoreAutonomousCompanyEngineeringCycleState,
  readLatestRepositorySnapshot,
  evaluateExactHeadCiGate,
  AUTONOMOUS_ENGINEERING_DURABLE_EVENT_TYPES,
  AUTONOMOUS_ENGINEERING_SAFE_ACTIONS,
  AUTONOMOUS_ENGINEERING_FORBIDDEN_ACTIONS,
  ACTIVE_COMPANY_BOOT_READS,
  ACTIVE_COMPANY_BOOT_SOURCE_PATHS,
  ACTIVE_COMPANY_ORACLE_POLICY
} from "../core/company/index.mjs";
import { MemoryUniverseStore } from "../core/registry/store.mjs";
import { assertAppendOnlyChain } from "../core/history/index.mjs";

const MAIN_SHA = "9".repeat(40);
const HEAD_SHA = "a".repeat(40);
const WORK_ORDER_REF = "KGEN-Organization/WorkOrders/SAFE_ENGINEERING_001.json";
const SECOND_WORK_ORDER_REF = "KGEN-Organization/WorkOrders/SAFE_ENGINEERING_002.json";
const acknowledgedWorker = Object.freeze({
  status: "ACTIVE",
  employee_status: "ACTIVE",
  trust_level: "T5",
  active_claim_count: 0,
  current_task: null,
  boot_acknowledged: true,
  canon_acknowledged: true,
  workspace_policy_acknowledged: true,
  do_not_touch_acknowledged: true,
  suspension: null
});
const manager = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "codex-gm-01",
  life_identity_ref: "LIFE-CODEX-GM-0001",
  role: "General Manager / Dispatcher / Reviewer",
  allowed_branch_pattern: "codex/<Task-ID>"
});
const worker = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "chatgpt-01",
  life_identity_ref: "LIFE-CHATGPT-0001",
  role: "System Maintainer",
  allowed_branch_pattern: "chatgpt-handoff/<Task-ID>"
});
const reviewer = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "reviewer-01",
  life_identity_ref: "LIFE-REVIEWER-0001",
  role: "Independent Reviewer",
  allowed_branch_pattern: "review/<Task-ID>"
});
const task = Object.freeze({
  task_id: "SAFE-ENGINEERING-001",
  status: "READY",
  priority: "P1",
  risk_level: "R1",
  assigned_worker_id: "chatgpt-01",
  reviewer_id: reviewer.worker_id,
  review_requirement: "REQUIRED",
  work_order_ref: WORK_ORDER_REF,
  branch: "chatgpt-handoff/SAFE-ENGINEERING-001",
  expected_base_sha: MAIN_SHA,
  authorized_actions: ["READ", "SAFE_BRANCH_WORK", "TEST", "OPEN_PR", "CI"],
  scope: ["core/company/index.mjs"],
  acceptance_tests: ["node --test tests/autonomous-company-engineering-cycle.test.mjs"],
  task_envelope_status: "AUTHORIZED",
  authority_status: "MACHINE_VERIFIED",
  dependencies_complete: true,
  protected_paths_changed: false,
  ready: true,
  unresolved_threads: 0,
  blocking_comments: 0,
  blocking_defects: 0,
  human_decision_required: false,
  external_effects: false,
  secrets_required: false,
  chain_state_mutation: false,
  worker_activation: false,
  paid_external_api: false,
  created_at: "2026-09-14T00:00:00Z"
});

const activeCompanyBoot = Object.freeze({
  worker_id: manager.worker_id,
  latest_main_sha: MAIN_SHA,
  completed_at: "2026-10-07T07:00:00Z",
  reads: null
});

const activeCompanyProject = Object.freeze({
  task_id: task.task_id,
  project_owner_id: "human-owner-01",
  implementer_id: worker.worker_id,
  reviewer_id: reviewer.worker_id,
  dependencies: ["CURRENT_MAIN"],
  expected_output: "DRAFT_PR_AND_EXACT_HEAD_CI"
});

function gitBlobSha(content) {
  const body = Buffer.from(content, "utf8");
  return createHash("sha1").update(Buffer.from(`blob ${body.length}\0`, "utf8")).update(body).digest("hex");
}

function activeCompanyEvidenceFetch(files, { corruptPath = null } = {}) {
  return async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith(`/commits/${MAIN_SHA}`)) {
      return { ok: true, status: 200, json: async () => ({ sha: MAIN_SHA }) };
    }
    const marker = "/contents/";
    const markerIndex = parsed.pathname.indexOf(marker);
    const path = markerIndex >= 0
      ? parsed.pathname.slice(markerIndex + marker.length).split("/").map(decodeURIComponent).join("/")
      : null;
    const content = path ? files[path] : undefined;
    if (content === undefined) return { ok: false, status: 404, json: async () => ({ message: "not found" }) };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        type: "file",
        encoding: "base64",
        sha: path === corruptPath ? "f".repeat(40) : gitBlobSha(content),
        content: Buffer.from(content, "utf8").toString("base64")
      })
    };
  };
}

const GUARDIAN_RESOLUTION_REF = "KGEN-Organization/WorkOrders/GUARDIAN_RESOLUTION_TEST.json";
const fixtureRegistry = JSON.stringify({ workers: [manager, worker, reviewer] });
const fixtureFiles = Object.freeze({
  "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md": "boot fixture",
  "handoff/HANDOFF_CURRENT.md": "handoff fixture",
  "docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md": "owner policy fixture",
  "KGEN-Organization/WorkOrders/WORK_QUEUE.md": "queue fixture",
  "KGEN-KAIOS/worker_registry.json": fixtureRegistry,
  "AGENTS.md": "agent fixture",
  [WORK_ORDER_REF]: JSON.stringify({ planner_task: task, active_project: activeCompanyProject }),
  [GUARDIAN_RESOLUTION_REF]: JSON.stringify({
    status: "RESOLVED",
    decision: "APPROVED_TO_RETRY",
    resolution_actor_id: manager.worker_id,
    target_item_id: task.task_id,
    action: "PUSH_TASK_BRANCH",
    review_id: "review-1",
    resolved_at: "2026-10-07T07:00:45Z"
  })
});
const activeCompanyRepositoryEvidence = await resolveActiveCompanyRepositoryEvidence({
  current_main_sha: MAIN_SHA,
  guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF],
  work_order_refs: [WORK_ORDER_REF],
  fetch_impl: activeCompanyEvidenceFetch(fixtureFiles)
});
async function repositoryEvidenceForActors(actors) {
  const files = {
    ...fixtureFiles,
    "KGEN-KAIOS/worker_registry.json": JSON.stringify({ workers: actors })
  };
  return resolveActiveCompanyRepositoryEvidence({
    current_main_sha: MAIN_SHA,
    guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF],
    work_order_refs: [WORK_ORDER_REF],
    fetch_impl: activeCompanyEvidenceFetch(files)
  });
}
async function repositoryEvidenceForEnvelope(plannerTask, activeProject, actors = [manager, worker, reviewer]) {
  const files = {
    ...fixtureFiles,
    "KGEN-KAIOS/worker_registry.json": JSON.stringify({ workers: actors }),
    [WORK_ORDER_REF]: JSON.stringify({ planner_task: plannerTask, active_project: activeProject })
  };
  return resolveActiveCompanyRepositoryEvidence({
    current_main_sha: MAIN_SHA,
    guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF],
    work_order_refs: [WORK_ORDER_REF],
    fetch_impl: activeCompanyEvidenceFetch(files)
  });
}
function bootForEvidence(repositoryEvidence) {
  return Object.freeze({
    ...activeCompanyBoot,
    reads: Object.freeze(Object.fromEntries(ACTIVE_COMPANY_BOOT_READS.map((field) => {
    const sourceRef = ACTIVE_COMPANY_BOOT_SOURCE_PATHS[field];
    return [field, Object.freeze({
      source_ref: sourceRef,
      git_object: field === "latest_main" ? MAIN_SHA : repositoryEvidence.files[sourceRef].git_object
    })];
    })))
  });
}
const bootWithTrustedEvidence = bootForEvidence(activeCompanyRepositoryEvidence);

function companyCycleInput(overrides = {}) {
  const bootWasOverridden = Object.prototype.hasOwnProperty.call(overrides, "boot");
  const input = {
    cycle_id: "KAIOS-ENGINEERING-CYCLE-0001",
    observed_at: "2026-10-07T07:01:00Z",
    current_main_sha: MAIN_SHA,
    expected_main_sha: MAIN_SHA,
    manager,
    workers: [manager, worker, reviewer],
    work_queue: [task],
    projects: [activeCompanyProject],
    previous_cycle_ids: [],
    boot: bootWithTrustedEvidence,
    repository_evidence: activeCompanyRepositoryEvidence,
    direct_channel: "AVAILABLE",
    ...overrides
  };
  if (!bootWasOverridden) input.boot = bootForEvidence(input.repository_evidence);
  return input;
}

function cycle(overrides = {}) {
  return planAutonomousCompanyEngineeringCycle(companyCycleInput(overrides));
}

function activeCycle(overrides = {}) {
  return planActiveCompanyOperatingCycle(companyCycleInput({
    cycle_id: "KAIOS-ACTIVE-COMPANY-CYCLE-0001",
    ...overrides
  }));
}

function publicGitHubFixtureFetch(overrides = {}) {
  const calls = [];
  const bodies = {
    "/repos/klineodyssey/kline-odyssey": { default_branch: "main" },
    "/repos/klineodyssey/kline-odyssey/commits/main": {
      sha: MAIN_SHA,
      commit: { committer: { date: "2026-09-14T01:00:00Z" } }
    },
    "/repos/klineodyssey/kline-odyssey/pulls/353": {
      state: "open",
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
      head: { sha: HEAD_SHA, ref: "chatgpt-handoff/SAFE-ENGINEERING-001", repo: { full_name: "klineodyssey/kline-odyssey" } },
      base: { ref: "main" }
    },
    [`/repos/klineodyssey/kline-odyssey/compare/main...${HEAD_SHA}`]: { ahead_by: 2, behind_by: 0 },
    [`/repos/klineodyssey/kline-odyssey/commits/${HEAD_SHA}/check-runs?per_page=100`]: {
      total_count: 2,
      check_runs: [
        { id: 10, name: "company-safe-cycle", status: "completed", conclusion: "success", head_sha: HEAD_SHA, html_url: "https://github.com/example/check/10" },
        { id: 11, name: "workflow-security", status: "completed", conclusion: "success", head_sha: HEAD_SHA, html_url: "https://github.com/example/check/11" }
      ]
    },
    ...overrides
  };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const parsed = new URL(url);
    const key = `${parsed.pathname}${parsed.search}`;
    const body = bodies[key];
    if (body instanceof Error) throw body;
    return {
      ok: body !== undefined,
      status: body === undefined ? 404 : 200,
      json: async () => structuredClone(body ?? { message: "not found" })
    };
  };
  return { fetch, calls };
}

test("both public planner names enforce the strict Active Company review model", () => {
  const result = cycle();
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(result.mode, "ACTIVE_COMPANY_MODE");
  assert.equal(result.selected_task_id, task.task_id);
  assert.equal(result.selected_worker_id, worker.worker_id);
  assert.equal(result.selected_reviewer_id, reviewer.worker_id);
  assert.equal(result.work_order_candidate.review_requirement, "REQUIRED");
  assert.equal(result.work_order_candidate.execution_authorized, false);
  assert.equal(result.work_order_candidate.merge_authorized, false);
  assert.equal(result.work_order_candidate.deployment_authorized, false);
  assert.deepEqual(result.events.map((event) => event.event_type), ["CLOCK_IN", "WORK_ORDER_CANDIDATE", "CLOCK_OUT"]);
  assert.ok(result.events.every((event) => event.append_only && event.external_effect === false));
  assert.ok(Object.values(result.authority).every((value) => value === false));
});

test("ranks P0 before P1 and skips an unsafe P0 instead of stalling safe work", () => {
  const blockedP0 = {
    ...task,
    task_id: "BLOCKED-P0",
    priority: "P0",
    branch: "chatgpt-handoff/BLOCKED-P0",
    authorized_actions: ["READ", "MAINNET_TRANSACTION"],
    created_at: "2026-09-13T00:00:00Z"
  };
  const safeP2 = { ...task, task_id: "SAFE-P2", priority: "P2", branch: "chatgpt-handoff/SAFE-P2" };
  const result = cycle({ work_queue: [safeP2, task, blockedP0] });
  assert.equal(result.selected_task_id, task.task_id);
  assert.equal(result.rejected_candidates[0].task_id, blockedP0.task_id);
  assert.deepEqual(result.rejected_candidates[0].forbidden_actions, ["MAINNET_TRANSACTION"]);
});

test("fails closed on stale main and replay", () => {
  const stale = cycle({ expected_main_sha: "8".repeat(40) });
  assert.equal(stale.status, "HOLD_STALE_MAIN");
  assert.equal(stale.selected_task_id, null);
  assert.equal(stale.events[1].payload.blocker, "STALE_MAIN");
  const replay = cycle({ previous_cycle_ids: ["KAIOS-ENGINEERING-CYCLE-0001"] });
  assert.equal(replay.status, "IDEMPOTENT_NOOP");
  assert.deepEqual(replay.events, []);
});

test("enforces exact-main readiness, completed dependencies, and zero blockers", () => {
  for (const patch of [
    { expected_base_sha: "7".repeat(40) }, { ready: false }, { dependencies_complete: false },
    { protected_paths_changed: true }, { unresolved_threads: 1 }, { blocking_comments: 1 }, { blocking_defects: 1 }
  ]) {
    const result = cycle({ work_queue: [{ ...task, ...patch }] });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
    assert.equal(result.selected_task_id, null);
  }
});

test("rejects forbidden, unknown, high-risk, or side-effectful authority", () => {
  for (const patch of [
    { authorized_actions: ["READ", "PAYROLL_PAYMENT"] }, { authorized_actions: ["READ", "UNDECLARED_POWER"] },
    { risk_level: "R2" }, { priority: "P3" }, { task_envelope_status: "DRAFT" },
    { authority_status: "CHAT_ONLY" }, { human_decision_required: true }, { secrets_required: true },
    { external_effects: true }, { chain_state_mutation: true }, { worker_activation: true }, { paid_external_api: true }
  ]) assert.equal(cycle({ work_queue: [{ ...task, ...patch }] }).status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(AUTONOMOUS_ENGINEERING_SAFE_ACTIONS.includes("VERIFY_STATIC_PAGES"));
  assert.ok(!AUTONOMOUS_ENGINEERING_SAFE_ACTIONS.includes("MERGE_MAIN"));
  assert.ok(AUTONOMOUS_ENGINEERING_FORBIDDEN_ACTIONS.includes("EXTERNAL_AGENT_LAUNCH"));
  assert.ok(AUTONOMOUS_ENGINEERING_FORBIDDEN_ACTIONS.includes("PRODUCTION_ORACLE_ACTIVATION"));
  assert.ok(AUTONOMOUS_ENGINEERING_FORBIDDEN_ACTIONS.includes("DESTRUCTIVE_PLAYER_LIFE_OPERATION"));
});

test("accepts the canonical READY_FOR_ATOMIC_CLAIM queue state", async () => {
  const readyTask = { ...task, status: "READY_FOR_ATOMIC_CLAIM" };
  const result = cycle({
    work_queue: [readyTask],
    repository_evidence: await repositoryEvidenceForEnvelope(readyTask, activeCompanyProject)
  });
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
});

test("blocks main and branch namespaces that do not match the registered worker", () => {
  for (const branch of ["main", "codex/SAFE-ENGINEERING-001", "chatgpt-handoff/WRONG-TASK"]) {
    const result = cycle({ work_queue: [{ ...task, branch }] });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
    assert.ok(result.rejected_candidates[0].reasons.includes("BRANCH_POLICY_MISMATCH"));
  }
});

test("allows a registered Codex worker to use its exact codex task branch", async () => {
  const codexTask = {
    ...task,
    assigned_worker_id: manager.worker_id,
    branch: `codex/${task.task_id}`
  };
  const codexProject = { ...activeCompanyProject, implementer_id: manager.worker_id };
  const result = cycle({
    workers: [manager, reviewer],
    work_queue: [codexTask],
    projects: [codexProject],
    repository_evidence: await repositoryEvidenceForEnvelope(codexTask, codexProject, [manager, reviewer])
  });
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(result.selected_worker_id, manager.worker_id);
});

test("Active Company Mode requires complete exact-main boot evidence", () => {
  const boot = validateActiveCompanyBoot({
    boot: bootWithTrustedEvidence,
    current_main_sha: MAIN_SHA,
    manager,
    observed_at: "2026-10-07T07:01:00Z",
    repository_evidence: activeCompanyRepositoryEvidence
  });
  assert.equal(boot.status, "COMPANY_BOOT_COMPLETE");
  assert.equal(boot.external_effect, false);
  assert.throws(
    () => activeCycle({ boot: { ...bootWithTrustedEvidence, reads: { ...bootWithTrustedEvidence.reads, company_queue: "" } } }),
    (error) => error.code === "COMPANY_BOOT_INCOMPLETE"
  );
  assert.throws(
    () => activeCycle({ boot: { ...bootWithTrustedEvidence, latest_main_sha: "8".repeat(40) } }),
    (error) => error.code === "COMPANY_BOOT_STALE_MAIN"
  );
  assert.throws(
    () => activeCycle({ boot: { ...bootWithTrustedEvidence, completed_at: "2026-10-07T07:02:00Z" } }),
    (error) => error.code === "COMPANY_BOOT_FROM_FUTURE"
  );
  assert.throws(
    () => activeCycle({ boot: { ...bootWithTrustedEvidence, reads: { ...bootWithTrustedEvidence.reads, human_owner_policy: "repo://not-evidence" } } }),
    (error) => error.code === "COMPANY_BOOT_INCOMPLETE"
  );
});

test("Active Company Mode binds all actors to exact-main canonical registry evidence", () => {
  const verified = validateActiveCompanyRegistryEvidence({
    repository_evidence: activeCompanyRepositoryEvidence,
    current_main_sha: MAIN_SHA,
    actors: [manager, worker, reviewer]
  });
  assert.equal(verified.status, "WORKER_REGISTRY_VERIFIED");
  assert.deepEqual(verified.verified_worker_ids, [manager.worker_id, worker.worker_id, reviewer.worker_id]);
  assert.throws(
    () => activeCycle({ workers: [manager, { ...worker, active_claim_count: 1 }, reviewer] }),
    (error) => error.code === "WORKER_REGISTRY_EVIDENCE_MISMATCH"
  );
  assert.throws(
    () => activeCycle({ repository_evidence: { ...activeCompanyRepositoryEvidence } }),
    (error) => error.code === "TRUSTED_REPOSITORY_EVIDENCE_REQUIRED"
  );
});

test("Active Company Mode rejects caller-invented tasks and projects absent from verified work-order evidence", () => {
  const inventedTask = {
    ...task,
    task_id: "INVENTED-TASK",
    branch: "chatgpt-handoff/INVENTED-TASK",
    work_order_ref: "KGEN-Organization/WorkOrders/INVENTED_TASK.json"
  };
  const result = activeCycle({
    work_queue: [inventedTask],
    projects: [{ ...activeCompanyProject, task_id: inventedTask.task_id }]
  });
  assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(result.rejected_candidates[0].reasons.includes("WORK_ORDER_EVIDENCE_MISMATCH"));
});

test("Active Company Mode rejects duplicate queue task IDs before evidence selection", () => {
  const tampered = { ...task, priority: "P0" };
  assert.throws(
    () => activeCycle({ work_queue: [tampered, task] }),
    (error) => error.code === "DUPLICATE_WORK_QUEUE_TASK"
  );
});

test("public GitHub evidence resolver rejects a blob whose content does not match its Git object", async () => {
  await assert.rejects(
    () => resolveActiveCompanyRepositoryEvidence({
      current_main_sha: MAIN_SHA,
      fetch_impl: activeCompanyEvidenceFetch(fixtureFiles, { corruptPath: "AGENTS.md" })
    }),
    (error) => error.code === "PUBLIC_GITHUB_BLOB_HASH_MISMATCH"
  );
});

test("Active Company Mode binds one task to owner, implementer, and independent reviewer", () => {
  const result = activeCycle();
  assert.equal(result.mode, "ACTIVE_COMPANY_MODE");
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(result.boot_status, "COMPANY_BOOT_COMPLETE");
  assert.equal(result.registry_status, "WORKER_REGISTRY_VERIFIED");
  assert.equal(result.selected_reviewer_id, reviewer.worker_id);
  assert.equal(result.work_order_candidate.project_owner_id, activeCompanyProject.project_owner_id);
  assert.equal(result.work_order_candidate.implementer_id, worker.worker_id);
  assert.equal(result.work_order_candidate.review_requirement, "REQUIRED");
  assert.equal(result.work_order_candidate.expected_output, activeCompanyProject.expected_output);
  assert.deepEqual(result.work_order_candidate.dependencies, ["CURRENT_MAIN"]);
  assert.equal(result.protected_action_authority_granted, false);
});

test("Active Company Mode rejects missing ownership, implementer mismatch, and self review", async () => {
  for (const project of [
    { ...activeCompanyProject, project_owner_id: "" },
    { ...activeCompanyProject, implementer_id: manager.worker_id },
    { ...activeCompanyProject, reviewer_id: worker.worker_id },
    { ...activeCompanyProject, project_owner_id: worker.worker_id },
    { ...activeCompanyProject, project_owner_id: reviewer.worker_id }
  ]) {
    const result = activeCycle({ projects: [project] });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
  }
  const wrongRoleReviewer = { ...reviewer, role: "System Maintainer" };
  const wrongRole = activeCycle({
    workers: [manager, worker, wrongRoleReviewer],
    repository_evidence: await repositoryEvidenceForActors([manager, worker, wrongRoleReviewer])
  });
  assert.equal(wrongRole.status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(wrongRole.rejected_candidates[0].reasons.includes("REVIEWER_ROLE_REQUIRED"));
  assert.throws(
    () => activeCycle({ projects: [activeCompanyProject, { ...activeCompanyProject }] }),
    (error) => error.code === "DUPLICATE_ACTIVE_PROJECT"
  );
});

test("Active Company Mode stops an unresolved Guardian denial instead of retrying", () => {
  const denial = Object.freeze({
    status: "UNRESOLVED",
    turn_id: "turn-1",
    review_id: "review-1",
    target_item_id: task.task_id,
    action: "PUSH_TASK_BRANCH",
    reason: "GUARDIAN_DENIED",
    timestamp: "2026-10-07T07:00:30Z"
  });
  const result = activeCycle({ guardian_denials: [denial] });
  assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(result.rejected_candidates[0].reasons.includes("GUARDIAN_STOP_REPEAT"));
  assert.equal(result.events[1].payload.guardian_denials[0].review_id, denial.review_id);
  assert.equal(result.guardian_denials[0].action, denial.action);
  const unknownFields = activeCycle({ guardian_denials: [{ target_item_id: task.task_id, action: "UNKNOWN" }] });
  assert.equal(unknownFields.status, "NO_VERIFIED_SAFE_WORK");
  assert.equal(unknownFields.guardian_denials[0].turn_id, "UNKNOWN");
  assert.equal(unknownFields.guardian_denials[0].reason, "UNKNOWN");
  const malformedInline = activeCycle({ work_queue: [{ ...task, guardian_denial: { target_item_id: task.task_id } }] });
  assert.equal(malformedInline.status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(malformedInline.rejected_candidates[0].reasons.includes("GUARDIAN_STOP_REPEAT"));
  assert.throws(
    () => activeCycle({ guardian_denials: [{ ...denial, status: "RESOLVED" }] }),
    (error) => error.code === "GUARDIAN_RESOLUTION_ACTOR_REQUIRED"
  );
  assert.throws(
    () => activeCycle({ guardian_denials: [{
      ...denial,
      status: "RESOLVED",
      resolution_actor_id: worker.worker_id,
      resolution_evidence_ref: GUARDIAN_RESOLUTION_REF,
      resolved_at: "2026-10-07T07:00:45Z"
    }] }),
    (error) => error.code === "GUARDIAN_RESOLUTION_ACTOR_REQUIRED"
  );
  assert.throws(
    () => activeCycle({ guardian_denials: [{
      ...denial,
      status: "RESOLVED",
      resolution_actor_id: manager.worker_id,
      resolution_evidence_ref: "KGEN-Organization/WorkOrders/MISSING.json",
      resolved_at: "2026-10-07T07:00:45Z"
    }] }),
    (error) => error.code === "GUARDIAN_RESOLUTION_EVIDENCE_UNVERIFIED"
  );
  assert.throws(
    () => activeCycle({ guardian_denials: [{
      ...denial,
      status: "RESOLVED",
      resolution_actor_id: manager.worker_id,
      resolution_evidence_ref: GUARDIAN_RESOLUTION_REF,
      resolved_at: "2026-10-07T06:59:59Z"
    }] }),
    (error) => error.code === "GUARDIAN_RESOLUTION_TIME_INVALID"
  );
  const resolved = activeCycle({ guardian_denials: [{
    ...denial,
    status: "RESOLVED",
    resolution_actor_id: manager.worker_id,
    resolution_evidence_ref: GUARDIAN_RESOLUTION_REF,
    resolved_at: "2026-10-07T07:00:45Z"
  }] });
  assert.equal(resolved.status, "WORK_ORDER_CANDIDATE_READY");
});

test("Active Company Mode keeps paid Oracle chasing silent until a material trigger", async () => {
  const oracleTask = { ...task, work_category: "PAID_ORACLE_PROCUREMENT" };
  const silentEvidence = await repositoryEvidenceForEnvelope(oracleTask, activeCompanyProject);
  const silent = activeCycle({ work_queue: [oracleTask], repository_evidence: silentEvidence });
  assert.equal(silent.status, "IDEMPOTENT_NOOP");
  assert.deepEqual(silent.events, []);
  assert.deepEqual(silent.rejected_candidates, []);
  assert.deepEqual(silent.silent_task_ids, [oracleTask.task_id]);
  assert.equal(silent.next_safe_action, "SILENT_UNTIL_MATERIAL_ORACLE_CHANGE");
  const staleSilent = activeCycle({
    work_queue: [oracleTask],
    expected_main_sha: "8".repeat(40),
    repository_evidence: silentEvidence
  });
  assert.equal(staleSilent.status, "HOLD_STALE_MAIN");
  assert.equal(staleSilent.events[1].payload.blocker, "STALE_MAIN");
  const replaySilent = activeCycle({
    work_queue: [oracleTask],
    previous_cycle_ids: ["KAIOS-ACTIVE-COMPANY-CYCLE-0001"],
    repository_evidence: silentEvidence
  });
  assert.equal(replaySilent.status, "IDEMPOTENT_NOOP");
  assert.equal(replaySilent.next_safe_action, "WAIT_FOR_NEW_CYCLE_ID");
  const materialTask = { ...oracleTask, oracle_material_trigger: "NEW_PROVIDER_REPLY" };
  const material = activeCycle({
    work_queue: [materialTask],
    repository_evidence: await repositoryEvidenceForEnvelope(materialTask, activeCompanyProject)
  });
  assert.equal(material.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(material.oracle_policy.strategy, "FREE_PRICE_FEEDS_FIRST");
  assert.equal(material.oracle_policy.speed_target, "1C");
  assert.equal(ACTIVE_COMPANY_ORACLE_POLICY.paid_oracle_procurement, "NOT_ACTIVE");
  const otherTask = {
    ...task,
    task_id: "SAFE-ENGINEERING-002",
    branch: "chatgpt-handoff/SAFE-ENGINEERING-002",
    work_order_ref: SECOND_WORK_ORDER_REF
  };
  const otherProject = { ...activeCompanyProject, task_id: otherTask.task_id };
  const mixedFiles = {
    ...fixtureFiles,
    [WORK_ORDER_REF]: JSON.stringify({ planner_task: oracleTask, active_project: activeCompanyProject }),
    [SECOND_WORK_ORDER_REF]: JSON.stringify({ planner_task: otherTask, active_project: otherProject })
  };
  const mixedEvidence = await resolveActiveCompanyRepositoryEvidence({
    current_main_sha: MAIN_SHA,
    guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF],
    work_order_refs: [WORK_ORDER_REF, SECOND_WORK_ORDER_REF],
    fetch_impl: activeCompanyEvidenceFetch(mixedFiles)
  });
  const mixed = activeCycle({
    work_queue: [oracleTask, otherTask],
    projects: [activeCompanyProject, otherProject],
    repository_evidence: mixedEvidence
  });
  assert.equal(mixed.selected_task_id, otherTask.task_id);
  assert.deepEqual(mixed.silent_task_ids, [oracleTask.task_id]);
});

test("Active Company Mode requires a durable handoff when direct AI communication is unavailable", () => {
  assert.throws(
    () => activeCycle({ direct_channel: "NOT_AVAILABLE", durable_handoff_ref: null }),
    (error) => error.code === "DURABLE_HANDOFF_REQUIRED"
  );
  const result = activeCycle({ direct_channel: "NOT_AVAILABLE", durable_handoff_ref: "handoff/HANDOFF_CURRENT.md" });
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(result.durable_handoff_ref, "handoff/HANDOFF_CURRENT.md");
});

test("never activates a suspended, occupied, or under-trusted worker", async () => {
  for (const candidateWorker of [
    { ...worker, suspension: "SUSPENDED_BY_HUMAN_COST_DECISION" },
    { ...worker, active_claim_count: 1, current_task: "OTHER-TASK" },
    { ...worker, trust_level: "T1" }
  ]) {
    const result = cycle({
      workers: [manager, candidateWorker, reviewer],
      repository_evidence: await repositoryEvidenceForActors([manager, candidateWorker, reviewer])
    });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
    assert.equal(result.authority.worker_activated, false);
  }
});

test("Active Company Mode always requires an eligible distinct reviewer", () => {
  assert.equal(cycle().selected_reviewer_id, reviewer.worker_id);
  const selfReviewed = cycle({ projects: [{ ...activeCompanyProject, reviewer_id: worker.worker_id }] });
  assert.equal(selfReviewed.status, "NO_VERIFIED_SAFE_WORK");
  assert.ok(selfReviewed.rejected_candidates[0].reasons.includes("DISTINCT_REVIEWER_REQUIRED"));
});

test("persists planner evidence in the existing Company stream and restores replay state", async () => {
  const store = new MemoryUniverseStore();
  const company = Object.freeze({ company_id: "AI_ANT_COMPANY_0001", status: "FORMING" });
  const result = cycle();
  const persisted = await persistAutonomousCompanyEngineeringCycle({ store, company, cycle_result: result });
  assert.equal(persisted.status, "CYCLE_EVENTS_PERSISTED");
  assert.deepEqual(persisted.persisted_events.map((event) => event.event_id), result.events.map((event) => event.event_id));
  assert.ok(persisted.persisted_events.every((event) => event.stream === "COMPANY" && event.payload_hash));
  assert.equal(assertAppendOnlyChain(await store.history(company.company_id, "COMPANY")), true);

  const restored = await restoreAutonomousCompanyEngineeringCycleState({ store, company_id: company.company_id });
  assert.equal(restored.status, "RESTART_STATE_RECOVERED");
  assert.deepEqual(restored.previous_cycle_ids, [result.cycle_id]);
  assert.equal(restored.latest_cycle_id, result.cycle_id);
  assert.equal(restored.latest_cycle_status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(restored.event_count, result.events.length);
  assert.equal(restored.external_effect, false);

  const replay = await persistAutonomousCompanyEngineeringCycle({ store, company, cycle_result: result });
  assert.equal(replay.status, "IDEMPOTENT_NOOP");
  assert.equal((await store.history(company.company_id, "COMPANY")).length, result.events.length);
});

test("durable engineering memory rejects authority, event, identity, and payload escalation", async () => {
  const store = new MemoryUniverseStore();
  const company = { company_id: "AI_ANT_COMPANY_0001" };
  const result = cycle();
  const rejected = [
    [{ ...result, authority: { ...result.authority, payment_sent: true } }, "EXTERNAL_EFFECT_CYCLE_PERSISTENCE_FORBIDDEN"],
    [{ ...result, events: [{ ...result.events[0], event_type: "PAYMENT_SENT" }] }, "UNSUPPORTED_DURABLE_ENGINEERING_EVENT"],
    [{ ...result, events: [{ ...result.events[0], event_id: "FORGED" }] }, "CYCLE_EVENT_ID_INVALID"],
    [{ ...result, events: [{ ...result.events[0], payload: { ...result.events[0].payload, external_effect: true } }] }, "DURABLE_EVENT_RESERVED_FIELD_OVERRIDE"]
  ];
  for (const [cycleResult, code] of rejected) {
    await assert.rejects(
      () => persistAutonomousCompanyEngineeringCycle({ store, company, cycle_result: cycleResult }),
      (error) => error.code === code
    );
  }
  assert.deepEqual(AUTONOMOUS_ENGINEERING_DURABLE_EVENT_TYPES, ["CLOCK_IN", "WORK_ORDER_CANDIDATE", "BLOCKER_STATE", "CLOCK_OUT"]);
  assert.equal((await store.history(company.company_id, "COMPANY")).length, 0);
});

test("durable engineering memory rejects partial or conflicting replay", async () => {
  const store = new MemoryUniverseStore();
  const company = { company_id: "AI_ANT_COMPANY_0001" };
  const result = cycle();
  const first = result.events[0];
  await store.commit({
    event_id: first.event_id,
    domain: "COMPANY",
    stream: "COMPANY",
    id: company.company_id,
    entity: company,
    event_type: first.event_type,
    actor_id: first.actor_id,
    timestamp: first.occurred_at,
    payload: {
      ...first.payload,
      cycle_id: result.cycle_id,
      planner_event_id: first.event_id,
      sequence: 1,
      cycle_status: result.status,
      external_effect: false
    }
  });
  await assert.rejects(
    () => persistAutonomousCompanyEngineeringCycle({ store, company, cycle_result: result }),
    (error) => error.code === "DURABLE_CYCLE_CONFLICT"
  );
  assert.equal((await store.history(company.company_id, "COMPANY")).length, 1);
});

test("MemoryUniverseStore rejects duplicate deterministic event ids before mutating a batch", async () => {
  const store = new MemoryUniverseStore();
  const operation = (id) => ({
    event_id: "CYCLE-001:01:CLOCK_IN",
    domain: "COMPANY",
    stream: "COMPANY",
    id,
    entity: { company_id: id },
    event_type: "CLOCK_IN",
    actor_id: "codex-gm-01",
    timestamp: "2026-09-14T00:00:00Z",
    payload: { cycle_id: "CYCLE-001" }
  });
  await assert.rejects(() => store.commitBatch([operation("COMPANY-A"), operation("COMPANY-B")]), (error) => error.code === "DUPLICATE_EVENT_ID");
  assert.equal((await store.allEvents()).length, 0);
  assert.equal(await store.getEntity("COMPANY", "COMPANY-A"), null);
  assert.equal(await store.getEntity("COMPANY", "COMPANY-B"), null);
});

test("reads exact public GitHub main, PR divergence, and named head checks without credentials", async () => {
  const fixture = publicGitHubFixtureFetch();
  const snapshot = await readLatestRepositorySnapshot({
    repository: "klineodyssey/kline-odyssey",
    active_task_pr: 353,
    observed_at: "2026-09-14T01:05:00Z",
    required_check_names: ["company-safe-cycle", "workflow-security"],
    fetch_impl: fixture.fetch
  });
  assert.equal(snapshot.snapshot_type, "LATEST_REPOSITORY_READ_ONLY");
  assert.equal(snapshot.main_sha, MAIN_SHA);
  assert.equal(snapshot.active_task_pr.head_sha, HEAD_SHA);
  assert.equal(snapshot.active_task_pr.behind_main, 0);
  assert.equal(snapshot.active_task_pr.ci_status, "PASS");
  assert.equal(snapshot.active_task_pr.check_count, 2);
  assert.equal(snapshot.authority.public_github_read, true);
  for (const [authority, enabled] of Object.entries(snapshot.authority)) {
    if (authority !== "public_github_read") assert.equal(enabled, false, `${authority} must remain disabled`);
  }
  assert.equal(fixture.calls.length, 5);
  for (const call of fixture.calls) {
    assert.ok(call.url.startsWith("https://api.github.com/repos/klineodyssey/kline-odyssey"));
    assert.equal(call.options.method, "GET");
    assert.equal(call.options.credentials, "omit");
    assert.equal(call.options.redirect, "error");
    assert.equal("Authorization" in call.options.headers, false);
  }
});

test("exact-main and exact-head gate passes evidence without granting merge authority", async () => {
  const fixture = publicGitHubFixtureFetch();
  const snapshot = await readLatestRepositorySnapshot({
    repository: "klineodyssey/kline-odyssey",
    active_task_pr: 353,
    observed_at: "2026-09-14T01:05:00Z",
    required_check_names: ["company-safe-cycle", "workflow-security"],
    fetch_impl: fixture.fetch
  });
  const gate = evaluateExactHeadCiGate({ repository_snapshot: snapshot, expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA });
  assert.equal(gate.status, "EXACT_MAIN_HEAD_CI_PASS");
  assert.equal(gate.exact_main, true);
  assert.equal(gate.exact_head, true);
  assert.equal(gate.merge_authorized, false);
  assert.equal(gate.external_effect, false);
});

test("exact-head gate fails closed for moving main/head, draft, branch, divergence, mergeability, and CI", () => {
  const basePr = {
    number: 353,
    head_sha: HEAD_SHA,
    head_ref: "chatgpt-handoff/SAFE-ENGINEERING-001",
    base_ref: "main",
    state: "OPEN",
    draft: false,
    mergeable: true,
    ahead_main: 1,
    behind_main: 0,
    ci_status: "PASS"
  };
  const snapshot = (pr = basePr, main_sha = MAIN_SHA) => ({
    snapshot_type: "LATEST_REPOSITORY_READ_ONLY",
    default_branch: "main",
    main_sha,
    active_task_pr: pr
  });
  const status = (repository_snapshot, expected_main_sha = MAIN_SHA, expected_head_sha = HEAD_SHA) => evaluateExactHeadCiGate({ repository_snapshot, expected_main_sha, expected_head_sha }).status;
  assert.equal(status(snapshot(basePr, "8".repeat(40))), "HOLD_STALE_MAIN");
  assert.equal(status(snapshot({ ...basePr, head_sha: "7".repeat(40) })), "HOLD_STALE_PR_HEAD");
  assert.equal(status(snapshot(null)), "HOLD_ACTIVE_PR_REQUIRED");
  assert.equal(status(snapshot({ ...basePr, state: "CLOSED" })), "HOLD_PR_NOT_OPEN");
  assert.equal(status(snapshot({ ...basePr, draft: true })), "HOLD_PR_DRAFT");
  assert.equal(status(snapshot({ ...basePr, base_ref: "release" })), "HOLD_PR_BASE_BRANCH_MISMATCH");
  assert.equal(status(snapshot({ ...basePr, head_ref: "codex/unsafe-trigger" })), "HOLD_FORBIDDEN_BRANCH_PATH");
  assert.equal(status(snapshot({ ...basePr, behind_main: 1 })), "HOLD_PR_BEHIND_MAIN");
  assert.equal(status(snapshot({ ...basePr, ahead_main: 0 })), "HOLD_PR_HAS_NO_BRANCH_DIFF");
  assert.equal(status(snapshot({ ...basePr, mergeable: false })), "HOLD_PR_NOT_MERGEABLE");
  assert.equal(status(snapshot({ ...basePr, mergeable: null })), "HOLD_PR_MERGEABILITY_UNKNOWN");
  assert.equal(status(snapshot({ ...basePr, ci_status: "FAIL" })), "HOLD_EXACT_HEAD_CI_FAILED");
  assert.equal(status(snapshot({ ...basePr, ci_status: "PENDING" })), "HOLD_EXACT_HEAD_CI_INCOMPLETE");
});

test("public repository reader rejects credential and endpoint overrides", async () => {
  for (const field of ["token", "authorization", "headers", "api_base", "api_origin", "credentials"]) {
    await assert.rejects(
      () => readLatestRepositorySnapshot({
        repository: "klineodyssey/kline-odyssey",
        observed_at: "2026-09-14T01:05:00Z",
        required_check_names: ["company-safe-cycle"],
        fetch_impl: publicGitHubFixtureFetch().fetch,
        [field]: "forbidden"
      }),
      (error) => error.code === "GITHUB_CREDENTIALS_FORBIDDEN"
    );
  }
});

test("public repository reader fails closed on missing, failed, pending, or truncated required checks", async () => {
  const checkPath = `/repos/klineodyssey/kline-odyssey/commits/${HEAD_SHA}/check-runs?per_page=100`;
  const cases = [
    [{ total_count: 0, check_runs: [] }, "NO_CHECKS"],
    [{ total_count: 1, check_runs: [{ id: 1, name: "other", status: "completed", conclusion: "success" }] }, "MISSING_REQUIRED_CHECK"],
    [{ total_count: 1, check_runs: [{ id: 1, name: "company-safe-cycle", status: "in_progress", conclusion: null }] }, "PENDING"],
    [{ total_count: 1, check_runs: [{ id: 1, name: "company-safe-cycle", status: "completed", conclusion: "failure" }] }, "FAIL"],
    [{ total_count: 101, check_runs: Array.from({ length: 100 }, (_, id) => ({ id, name: id ? "other" : "company-safe-cycle", status: "completed", conclusion: "success" })) }, "INCOMPLETE_CHECK_SET"]
  ];
  for (const [checks, expected] of cases) {
    const fixture = publicGitHubFixtureFetch({ [checkPath]: checks });
    const snapshot = await readLatestRepositorySnapshot({
      repository: "klineodyssey/kline-odyssey",
      active_task_pr: 353,
      observed_at: "2026-09-14T01:05:00Z",
      required_check_names: ["company-safe-cycle"],
      fetch_impl: fixture.fetch
    });
    assert.equal(snapshot.active_task_pr.ci_status, expected);
  }
  const failedRead = publicGitHubFixtureFetch({ "/repos/klineodyssey/kline-odyssey": new Error("network") });
  await assert.rejects(
    () => readLatestRepositorySnapshot({ repository: "klineodyssey/kline-odyssey", observed_at: "2026-09-14T01:05:00Z", required_check_names: ["company-safe-cycle"], fetch_impl: failedRead.fetch }),
    (error) => error.code === "GITHUB_READ_FAILED"
  );
});
