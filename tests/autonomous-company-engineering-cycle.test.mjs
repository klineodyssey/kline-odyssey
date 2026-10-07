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
  ACTIVE_COMPANY_ORACLE_POLICY,
  DYNAMIC_COMPANY_WORK_TYPES,
  DYNAMIC_COMPANY_WAIT_STATES,
  DYNAMIC_COMPANY_PRIORITY_FACTORS,
  validateDotOrganManufacturingRecord,
  inspectDotOrganCandidate,
  createDotOrganMaintenanceRecord,
  evaluateDotOrganSeal,
  evaluateDotDispatchSafety,
  evaluateBranchConcurrencyGate,
  inspectBranchConcurrencyClaimSet,
  verifyBranchWriterRuntimeAttestation,
  BRANCH_WRITER_CONTROLLER_TRUST_ANCHORS,
  PRIMEFORGE_IDENTITY_BOUNDARY
} from "../core/company/index.mjs";
import { MemoryUniverseStore } from "../core/registry/store.mjs";
import { assertAppendOnlyChain } from "../core/history/index.mjs";
import { stableStringify } from "../core/shared/utils.mjs";

const MAIN_SHA = "9".repeat(40);
const HEAD_SHA = "a".repeat(40);
const HISTORY_SHA = "7".repeat(40);
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
  controller_id: "TEST-CONTROLLER-CODEX-GM",
  role: "General Manager / Dispatcher / Reviewer",
  allowed_branch_pattern: "codex/<Task-ID>"
});
const worker = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "chatgpt-01",
  life_identity_ref: "LIFE-CHATGPT-0001",
  controller_id: "TEST-CONTROLLER-CHATGPT",
  role: "System Maintainer",
  allowed_branch_pattern: "chatgpt-handoff/<Task-ID>"
});
const reviewer = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "reviewer-01",
  life_identity_ref: "LIFE-REVIEWER-0001",
  controller_id: "TEST-CONTROLLER-REVIEWER",
  role: "Independent Reviewer",
  review_qualification: true,
  allowed_branch_pattern: "review/<Task-ID>"
});
const task = Object.freeze({
  task_id: "SAFE-ENGINEERING-001",
  work_type: "CODE",
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

function activeCompanyEvidenceFetch(files, { corruptPath = null, historicalFiles = {}, prHeadRef = "chatgpt-handoff/DONE-001" } = {}) {
  return async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/repos/klineodyssey/kline-odyssey") return { ok: true, status: 200, json: async () => ({ default_branch: "main" }) };
    if (parsed.pathname.endsWith("/commits/main")) {
      return { ok: true, status: 200, json: async () => ({ sha: MAIN_SHA, commit: { committer: { date: "2026-10-07T07:00:00Z" } } }) };
    }
    if (parsed.pathname === `/repos/klineodyssey/kline-odyssey/commits/${HISTORY_SHA}`) return { ok: true, status: 200, json: async () => ({ sha: HISTORY_SHA, commit: { committer: { date: "2026-10-06T07:00:00Z" } } }) };
    if (parsed.pathname === `/repos/klineodyssey/kline-odyssey/compare/${HISTORY_SHA}...${MAIN_SHA}`) return { ok: true, status: 200, json: async () => ({ merge_base_commit: { sha: HISTORY_SHA }, ahead_by: 2, behind_by: 0 }) };
    if (parsed.pathname === "/repos/klineodyssey/kline-odyssey/pulls/353") return { ok: true, status: 200, json: async () => ({ state: "open", draft: false, mergeable: true, mergeable_state: "clean", head: { sha: HEAD_SHA, ref: prHeadRef, repo: { full_name: "klineodyssey/kline-odyssey" } }, base: { ref: "main", repo: { full_name: "klineodyssey/kline-odyssey" } } }) };
    if (parsed.pathname === `/repos/klineodyssey/kline-odyssey/compare/main...${HEAD_SHA}`) return { ok: true, status: 200, json: async () => ({ ahead_by: 2, behind_by: 0 }) };
    if (parsed.pathname === `/repos/klineodyssey/kline-odyssey/commits/${HEAD_SHA}/check-runs`) return { ok: true, status: 200, json: async () => ({ total_count: 1, check_runs: [{ id: 1, name: "company-safe-cycle", status: "completed", conclusion: "success", head_sha: HEAD_SHA }] }) };
    const marker = "/contents/";
    const markerIndex = parsed.pathname.indexOf(marker);
    const path = markerIndex >= 0
      ? parsed.pathname.slice(markerIndex + marker.length).split("/").map(decodeURIComponent).join("/")
      : null;
    const ref = parsed.searchParams.get("ref");
    const content = path ? (historicalFiles[`${ref}:${path}`] ?? files[path]) : undefined;
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
  "KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md": "company boot fixture",
  "KGEN-KAIOS/governance/autopilot/company_boot_manifest.json": "boot manifest fixture",
  "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md": "current boot fixture",
  "handoff/HANDOFF_CURRENT.md": "handoff fixture",
  "docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md": "owner policy fixture",
  "KGEN-Organization/WorkOrders/WORK_QUEUE.md": "queue fixture",
  "KGEN-KAIOS/worker_registry.json": fixtureRegistry,
  "AGENTS.md": "agent fixture",
  "docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json": JSON.stringify({ point_index_sorted: [
    { id: "P_11520p0_花果山_R70", coord: 11520, name: "花果山", type: "mountain" },
    { id: "P_12345p0_悟空財神殿_R72", coord: 12345, name: "悟空財神殿", type: "palace" }
  ] }),
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
    observed_at: "2026-10-07T07:00:00Z",
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
    observed_at: "2026-10-07T07:00:00Z",
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
    observed_at: "2026-10-07T07:00:00Z",
    current_main_sha: MAIN_SHA,
    guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF],
    work_order_refs: [WORK_ORDER_REF],
    fetch_impl: activeCompanyEvidenceFetch(files)
  });
}

async function repositoryEvidenceForEnvelopes(entries, actors = [manager, worker, reviewer], { historyRefs = [], historicalFiles = {}, extraFiles = {}, extraWorkOrderRefs = [], activeTaskPr = null, fetchImpl = null } = {}) {
  const files = { ...fixtureFiles, "KGEN-KAIOS/worker_registry.json": JSON.stringify({ workers: actors }) };
  for (const entry of entries) files[entry.task.work_order_ref] = JSON.stringify({ planner_task: entry.task, active_project: entry.project, previous_work_orders: entry.previous_work_orders ?? [] });
  Object.assign(files, extraFiles);
  return resolveActiveCompanyRepositoryEvidence({
    observed_at: "2026-10-07T07:00:00Z", current_main_sha: MAIN_SHA,
    guardian_evidence_refs: [GUARDIAN_RESOLUTION_REF], work_order_refs: [...entries.map((entry) => entry.task.work_order_ref), ...extraWorkOrderRefs],
    work_order_history_refs: historyRefs, active_task_pr: activeTaskPr,
    fetch_impl: fetchImpl ?? activeCompanyEvidenceFetch(files, { historicalFiles })
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
      base: { ref: "main", repo: { full_name: "klineodyssey/kline-odyssey" } }
    },
    [`/repos/klineodyssey/kline-odyssey/compare/main...${HEAD_SHA}`]: { ahead_by: 2, behind_by: 0 },
    [`/repos/klineodyssey/kline-odyssey/commits/${HEAD_SHA}/check-runs?per_page=100`]: {
      total_count: 2,
      check_runs: [
        { id: 10, name: "company-safe-cycle", status: "completed", conclusion: "success", head_sha: HEAD_SHA, html_url: "https://github.com/example/check/10" },
        { id: 11, name: "workflow-security", status: "completed", conclusion: "success", head_sha: HEAD_SHA, html_url: "https://github.com/example/check/11" }
      ]
    },
    ...Object.fromEntries(Object.entries({ ...fixtureFiles, [WORK_ORDER_REF]: JSON.stringify({ planner_task: { ...task, target_pr: 353 }, active_project: activeCompanyProject }) }).map(([path, content]) => [`/repos/klineodyssey/kline-odyssey/contents/${path}?ref=${MAIN_SHA}`, { type: "file", encoding: "base64", sha: gitBlobSha(content), content: Buffer.from(content).toString("base64") }])),
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
    assert.equal(result.status, "WATCHING");
    assert.equal(result.selected_task_id, null);
  }
});

test("rejects forbidden, unknown, high-risk, or side-effectful authority", () => {
  for (const patch of [
    { authorized_actions: ["READ", "PAYROLL_PAYMENT"] }, { authorized_actions: ["READ", "UNDECLARED_POWER"] },
    { risk_level: "R2" }, { priority: "P3" }, { task_envelope_status: "DRAFT" },
    { authority_status: "CHAT_ONLY" }, { human_decision_required: true }, { secrets_required: true },
    { external_effects: true }, { chain_state_mutation: true }, { worker_activation: true }, { paid_external_api: true }
  ]) assert.equal(cycle({ work_queue: [{ ...task, ...patch }] }).status, "WATCHING");
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
    assert.equal(result.status, "WATCHING");
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
  assert.equal(result.status, "WATCHING");
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
    observed_at: "2026-10-07T07:00:00Z",
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
    assert.equal(result.status, "WATCHING");
  }
  const wrongRoleReviewer = { ...reviewer, role: "System Maintainer" };
  const wrongRole = activeCycle({
    workers: [manager, worker, wrongRoleReviewer],
    repository_evidence: await repositoryEvidenceForActors([manager, worker, wrongRoleReviewer])
  });
  assert.equal(wrongRole.status, "WATCHING");
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
  assert.equal(result.status, "WATCHING");
  assert.ok(result.rejected_candidates[0].reasons.includes("GUARDIAN_STOP_REPEAT"));
  assert.equal(result.events[1].payload.guardian_denials[0].review_id, denial.review_id);
  assert.equal(result.guardian_denials[0].action, denial.action);
  const unknownFields = activeCycle({ guardian_denials: [{ target_item_id: task.task_id, action: "UNKNOWN" }] });
  assert.equal(unknownFields.status, "WATCHING");
  assert.equal(unknownFields.guardian_denials[0].turn_id, "UNKNOWN");
  assert.equal(unknownFields.guardian_denials[0].reason, "UNKNOWN");
  const malformedInline = activeCycle({ work_queue: [{ ...task, guardian_denial: { target_item_id: task.task_id } }] });
  assert.equal(malformedInline.status, "WATCHING");
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
    observed_at: "2026-10-07T07:00:00Z",
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

test("caller direct availability never bypasses verified canonical handoff or grants ACK", () => {
  for (const direct_channel of ["AVAILABLE", "NOT_AVAILABLE"]) {
    const result = activeCycle({ direct_channel, durable_handoff_ref: null });
    assert.equal(result.direct_channel, "NOT_VERIFIED");
    assert.equal(result.durable_handoff_ref, "handoff/HANDOFF_CURRENT.md");
    assert.equal(result.ack_status, "ACK_NOT_VERIFIED");
    assert.equal(result.dispatched_count, 0);
  }
  assert.throws(() => activeCycle({ durable_handoff_ref: "caller-invented.md" }), error => error.code === "DURABLE_HANDOFF_REQUIRED");
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
    assert.equal(result.status, "WATCHING");
    assert.equal(result.authority.worker_activated, false);
  }
});

test("Active Company Mode always requires an eligible distinct reviewer", () => {
  assert.equal(cycle().selected_reviewer_id, reviewer.worker_id);
  const selfReviewed = cycle({ projects: [{ ...activeCompanyProject, reviewer_id: worker.worker_id }] });
  assert.equal(selfReviewed.status, "WATCHING");
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
    evidence_paths: [WORK_ORDER_REF, ACTIVE_COMPANY_BOOT_SOURCE_PATHS.worker_identity_authority],
    observed_at: "2026-09-14T01:05:00Z",
    required_check_names: ["company-safe-cycle", "workflow-security"],
    fetch_impl: fixture.fetch
  });
  const gate = evaluateExactHeadCiGate({ repository_snapshot: snapshot, expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA, work_order_ref: WORK_ORDER_REF });
  assert.equal(gate.status, "DIAGNOSTIC_CI_MATCH_NOT_VERIFIED");
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
  assert.equal(status(snapshot({ ...basePr, head_ref: "main" })), "HOLD_FORBIDDEN_BRANCH_PATH");
  assert.equal(status(snapshot({ ...basePr, head_ref: "codex/SAFE-ENGINEERING-001" })), "HOLD_BRANCH_EVIDENCE_REQUIRED");
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


test("canonical snapshot rejects a valid historical commit and detects main moving during file reads", async () => {
  const fixture = activeCompanyEvidenceFetch(fixtureFiles);
  await assert.rejects(() => resolveActiveCompanyRepositoryEvidence({ current_main_sha: "8".repeat(40), observed_at: "2026-10-07T07:00:00Z", fetch_impl: fixture }), error => error.code === "PUBLIC_GITHUB_MAIN_MISMATCH");
  let heads = 0;
  await assert.rejects(() => resolveActiveCompanyRepositoryEvidence({ current_main_sha: MAIN_SHA, observed_at: "2026-10-07T07:00:00Z", fetch_impl: async (url, options) => {
    assert.equal(options.method, "GET"); assert.equal(options.credentials, "omit"); assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, undefined);
    if (url.endsWith("/commits/main") && ++heads === 2) return { ok: true, json: async () => ({ sha: "8".repeat(40) }) };
    return fixture(url, options);
  } }), error => error.code === "GITHUB_MAIN_MOVED_DURING_SNAPSHOT");
});

test("dynamic projection deduplicates identical demand and retains changed evidence predecessor", async () => {
  const first = cycle({ work_queue: [task, task] });
  assert.equal(first.generated_proposals, 1);
  const record = first.opportunity_records[0];
  const replay = cycle({ previous_work_orders: [record] });
  assert.equal(replay.opportunity_records[0].IDEMPOTENT, true);
  const changedTask = { ...task, dependencies_complete: false };
  const changed = cycle({ work_queue: [changedTask], previous_work_orders: [record], repository_evidence: await repositoryEvidenceForEnvelope(changedTask, activeCompanyProject) });
  assert.equal(changed.status, "WATCHING");
  assert.equal(changed.opportunity_records[0].STATUS, "BLOCKED");
  assert.deepEqual(changed.opportunity_records[0].SUPERSEDES.EVIDENCE_BINDING, record.EVIDENCE_BINDING);
  assert.equal(record.STATUS, "PROPOSED_UNADMITTED");
});

test("all workorder fields and all nineteen work types remain evidence-only without fake seal or receipt", async () => {
  const required = "WORK_ID GENERATED_AT WORK_TYPE SOURCE WHY_NOW PRIORITY BASE_MAIN_SHA PROJECT TARGET_PR TARGET_BRANCH PROJECT_OWNER IMPLEMENTER REVIEWER SCOPE DEPENDENCIES EXPECTED_OUTPUT ACCEPTANCE_TESTS PROTECTED_ACTIONS CARGO_REQUIRED CARGO_ASSET CARGO_AMOUNT ORIGIN DESTINATION EXPIRES_WHEN SUPERSEDES STATUS".split(" ");
  assert.equal(DYNAMIC_COMPANY_WORK_TYPES.length, 19);
  for (const type of DYNAMIC_COMPANY_WORK_TYPES) {
    const next = { ...task, work_type: type, signature: "SIGNED", seal: "VALID", review_status: "PASS" };
    const result = cycle({ work_queue: [next], repository_evidence: await repositoryEvidenceForEnvelope(next, activeCompanyProject) });
    const record = result.opportunity_records[0];
    for (const key of required) assert.ok(Object.hasOwn(record, key), key);
    assert.equal(result.seal.status, "INVALID"); assert.equal(result.manufacture.signature, "NOT_SIGNED");
    assert.equal(result.dispatched_count, 0); assert.equal(result.acknowledged_count, 0);
    assert.equal(result.day_breath.day_key, null); assert.equal(result.heartbeat.actual_receipt, null);
    assert.equal(record.CARGO_REQUIRED, ["ATM_REPLENISH", "KGEN_CARGO", "KAIOS_CARGO"].includes(type) ? "YES" : "NO");
    assert.equal(record.DESTINATION, null); assert.equal(record.ORIGIN, null);
    if (record.CARGO_REQUIRED === "YES") assert.equal(record.STATUS, "BLOCKED");
  }
});

test("missing controller identity blocks assignment while canonical demand detection survives", async () => {
  const unavailableManager = { ...manager, controller_id: undefined };
  const result = cycle({ manager: unavailableManager, workers: [unavailableManager, worker, reviewer], repository_evidence: await repositoryEvidenceForActors([unavailableManager, worker, reviewer]) });
  assert.equal(result.status, "WATCHING");
  assert.equal(result.blocker, "WAITING_FOR_QUALIFIED_WORKER");
  assert.equal(result.generated_proposals, 1);
  assert.equal(result.selected_worker_id, null);
  assert.equal(result.dispatched_count, 0);
});

test("forged controller or same-controller reviewer cannot pass registry-bound identity", async () => {
  assert.throws(() => cycle({ workers: [manager, { ...worker, controller_id: "FORGED" }, reviewer] }), error => error.code === "WORKER_REGISTRY_EVIDENCE_MISMATCH");
  const sameController = { ...reviewer, controller_id: worker.controller_id };
  const result = cycle({ workers: [manager, worker, sameController], repository_evidence: await repositoryEvidenceForActors([manager, worker, sameController]) });
  assert.equal(result.status, "WATCHING");
  assert.ok(result.rejected_candidates[0].reasons.includes("DISTINCT_REVIEWER_REQUIRED"));
});

test("unknown type and expired or stale demand never become selected work", async () => {
  for (const patch of [{ work_type: "SECRET_ACTION" }, { expires_at: "2026-10-07T07:00:00Z" }, { expected_base_sha: "8".repeat(40) }]) {
    const demand = { ...task, ...patch };
    const result = cycle({ work_queue: [demand], repository_evidence: await repositoryEvidenceForEnvelope(demand, activeCompanyProject) });
    assert.equal(result.status, "WATCHING");
    assert.notEqual(result.opportunity_records[0].STATUS, "PROPOSED_UNADMITTED");
    assert.equal(result.selected_task_id, null);
  }
});

test("repository-owned real WorkOrder envelope is detected but never pretends to be dispatched", async () => {
  const { readFile } = await import("node:fs/promises");
  const path = "KGEN-Organization/WorkOrders/KAIOS_AI_COMPANY_SAFE_PLANNER_CURRENT_MAIN_R1_20260914.json";
  const content = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  const actual = JSON.parse(content);
  const files = { ...fixtureFiles, [path]: content };
  const evidence = await resolveActiveCompanyRepositoryEvidence({ current_main_sha: MAIN_SHA, observed_at: "2026-10-07T07:00:00Z", work_order_refs: [path], fetch_impl: activeCompanyEvidenceFetch(files) });
  const result = cycle({ repository_evidence: evidence, work_queue: [actual.planner_task], projects: [actual.active_project] });
  assert.equal(result.generated_proposals, 1);
  assert.equal(result.opportunity_records[0].WORK_ID, "KAIOS-DOT-ORGAN-V1-20261007");
  assert.equal(result.status, "WATCHING"); assert.equal(result.dispatched_count, 0);
  assert.equal(actual.organ_seal.SEAL_STATUS, "INVALID"); assert.equal(actual.manufacturing_record.INSTALLED_AT, "NOT_INSTALLED"); assert.equal(actual.active_project.reviewer_id, null);
  assert.equal(actual.superseded_status_assertions[0].actual_review, "FAIL");
  // This test exercises actual branch bytes through a fake read adapter, not a main admission.
});

test("authorization captures inert data and rejects getter actors with zero getter execution", async () => {
  let reads = 0;
  const mutableActor = { ...worker };
  Object.defineProperty(mutableActor, "allowed_branch_pattern", { enumerable: true, get() { reads += 1; return reads === 1 ? worker.allowed_branch_pattern : "unregistered/attack"; } });
  const demand = { ...task, branch: "unregistered/attack" };
  const evidence = await repositoryEvidenceForEnvelope(demand, activeCompanyProject);
  assert.throws(() => cycle({ work_queue: [demand], workers: [manager, mutableActor, reviewer], repository_evidence: evidence }), error => error.code === "COMPANY_INPUT_ACCESSOR_FORBIDDEN");
  assert.equal(reads, 0);
  const top = companyCycleInput();
  Object.defineProperty(top, "manager", { enumerable: true, get() { reads += 1; return manager; } });
  assert.throws(() => planActiveCompanyOperatingCycle(top), error => error.code === "COMPANY_INPUT_ACCESSOR_FORBIDDEN");
  assert.equal(reads, 0);
  const inherited = Object.create({ allowed_branch_pattern: "unregistered/attack" });
  Object.assign(inherited, worker);
  assert.throws(() => cycle({ workers: [manager, inherited, reviewer] }), error => error.code === "COMPANY_INPUT_PROTOTYPE_INVALID");
});

test("prototype property names never count as priority or trust policy entries", async () => {
  for (const key of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
    const demand = { ...task, priority: key };
    const result = cycle({ work_queue: [demand], repository_evidence: await repositoryEvidenceForEnvelope(demand, activeCompanyProject) });
    assert.equal(result.status, "WATCHING");
    assert.ok(result.opportunity_records[0].BLOCKERS.includes("PRIORITY_POLICY_REQUIRED"));
    const badTrust = { ...worker, trust_level: key };
    const denied = cycle({ workers: [manager, badTrust, reviewer], repository_evidence: await repositoryEvidenceForActors([manager, badTrust, reviewer]) });
    assert.equal(denied.status, "WATCHING");
    assert.equal(denied.selected_worker_id, null);
  }
});

test("manager aliases in worker list receive full canonical validation and duplicate IDs fail", async () => {
  const demand = { ...task, assigned_worker_id: manager.worker_id, branch: "unregistered/attack" };
  const project = { ...activeCompanyProject, implementer_id: manager.worker_id };
  const evidence = await repositoryEvidenceForEnvelope(demand, project);
  assert.throws(() => cycle({ work_queue: [demand], projects: [project], workers: [{ ...manager, allowed_branch_pattern: "unregistered/attack" }, reviewer], repository_evidence: evidence }), error => error.code === "WORKER_REGISTRY_EVIDENCE_MISMATCH");
  assert.throws(() => cycle({ workers: [manager, worker, worker, reviewer] }), error => error.code === "DUPLICATE_WORKER_ID");
});

test("exact-head CI accepts registered codex task branch only with canonical reader evidence", async () => {
  const demand = { ...task, assigned_worker_id: manager.worker_id, target_pr: 353, branch: `codex/${task.task_id}` };
  const project = { ...activeCompanyProject, implementer_id: manager.worker_id };
  const content = JSON.stringify({ planner_task: demand, active_project: project });
  const fixture = publicGitHubFixtureFetch({
    [`/repos/klineodyssey/kline-odyssey/contents/${WORK_ORDER_REF}?ref=${MAIN_SHA}`]: { type: "file", encoding: "base64", sha: gitBlobSha(content), content: Buffer.from(content).toString("base64") },
    "/repos/klineodyssey/kline-odyssey/pulls/353": { state: "open", draft: false, mergeable: true, head: { sha: HEAD_SHA, ref: demand.branch, repo: { full_name: "klineodyssey/kline-odyssey" } }, base: { ref: "main", repo: { full_name: "klineodyssey/kline-odyssey" } } }
  });
  const snapshot = await readLatestRepositorySnapshot({ repository: "klineodyssey/kline-odyssey", active_task_pr: 353, observed_at: "2026-10-07T07:00:00Z", required_check_names: ["company-safe-cycle"], evidence_paths: [WORK_ORDER_REF, ACTIVE_COMPANY_BOOT_SOURCE_PATHS.worker_identity_authority], fetch_impl: fixture.fetch });
  const options = { repository_snapshot: snapshot, expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA, work_order_ref: WORK_ORDER_REF };
  assert.equal(evaluateExactHeadCiGate(options).status, "DIAGNOSTIC_CI_MATCH_NOT_VERIFIED");
  assert.equal(evaluateExactHeadCiGate(options).merge_authorized, false);
  assert.equal(evaluateExactHeadCiGate({ ...options, repository_snapshot: { ...snapshot } }).status, "HOLD_BRANCH_EVIDENCE_REQUIRED");
  assert.equal(evaluateExactHeadCiGate({ ...options, work_order_ref: "forged.json" }).status, "HOLD_BRANCH_EVIDENCE_REQUIRED");
});

test("copied predecessor bytes cannot establish source provenance or supersession authority", () => {
  const first = cycle().opportunity_records[0];
  const copied = structuredClone(first);
  const result = cycle({ previous_work_orders: [copied], previous_work_orders_verified: [copied.WORK_ID] });
  const record = result.opportunity_records[0];
  assert.equal(record.PREDECESSOR_VERIFICATION, "NOT_VERIFIED");
  assert.equal(record.SUPERSEDES, null); assert.equal(record.IDEMPOTENT, false);
  assert.ok(record.BLOCKERS.includes("PREDECESSOR_PROVENANCE_REQUIRED"));
  assert.equal(result.status, "WATCHING");
});

test("a demand bound to an unobserved PR remains held rather than claiming CI freshness", async () => {
  const demand = { ...task, target_pr: 536 };
  const result = cycle({ work_queue: [demand], repository_evidence: await repositoryEvidenceForEnvelope(demand, activeCompanyProject) });
  assert.equal(result.status, "WATCHING");
  assert.ok(result.opportunity_records[0].BLOCKERS.includes("ACTIVE_PR_EVIDENCE_REQUIRED"));
});

test("CI gate rejects other PR numbers and fork or unknown repository origins", async () => {
  for (const patch of [{ target: 536 }, { head: "untrusted/fork" }, { base: "untrusted/fork" }, { head: null }]) {
    const content = JSON.stringify({ planner_task: { ...task, target_pr: patch.target ?? 353 }, active_project: activeCompanyProject });
    const fixture = publicGitHubFixtureFetch({
      [`/repos/klineodyssey/kline-odyssey/contents/${WORK_ORDER_REF}?ref=${MAIN_SHA}`]: { type: "file", encoding: "base64", sha: gitBlobSha(content), content: Buffer.from(content).toString("base64") },
      "/repos/klineodyssey/kline-odyssey/pulls/353": { state: "open", draft: false, mergeable: true,
        head: { sha: HEAD_SHA, ref: task.branch, repo: { full_name: Object.hasOwn(patch, "head") ? patch.head : "klineodyssey/kline-odyssey" } },
        base: { ref: "main", repo: { full_name: patch.base ?? "klineodyssey/kline-odyssey" } } }
    });
    const snapshot = await readLatestRepositorySnapshot({ repository: "klineodyssey/kline-odyssey", active_task_pr: 353, observed_at: "2026-10-07T07:00:00Z", required_check_names: ["company-safe-cycle"], evidence_paths: [WORK_ORDER_REF, ACTIVE_COMPANY_BOOT_SOURCE_PATHS.worker_identity_authority], fetch_impl: fixture.fetch });
    assert.equal(evaluateExactHeadCiGate({ repository_snapshot: snapshot, expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA, work_order_ref: WORK_ORDER_REF }).status, "HOLD_PR_IDENTITY_OR_REPOSITORY_MISMATCH");
  }
});

test("injected transport outside tests or with spoofed test env cannot mint verified CI evidence", async () => {
  const { spawnSync } = await import("node:child_process");
  const fixture = publicGitHubFixtureFetch();
  const options = { repository: "klineodyssey/kline-odyssey", active_task_pr: 353, observed_at: "2026-10-07T07:00:00Z", required_check_names: ["company-safe-cycle"], evidence_paths: [WORK_ORDER_REF, ACTIVE_COMPANY_BOOT_SOURCE_PATHS.worker_identity_authority] };
  await readLatestRepositorySnapshot({ ...options, fetch_impl: fixture.fetch });
  const bodies = {};
  for (const call of [...fixture.calls]) bodies[call.url] = await (await fixture.fetch(call.url, call.options)).json();
  const moduleUrl = new URL("../core/company/index.mjs", import.meta.url).href;
  const source = `import { readLatestRepositorySnapshot, evaluateExactHeadCiGate } from ${JSON.stringify(moduleUrl)};
    const bodies = ${JSON.stringify(bodies)};
    const snapshot = await readLatestRepositorySnapshot({ ...${JSON.stringify(options)}, fetch_impl: async url => ({ ok: true, json: async () => bodies[url] }) });
    const result = evaluateExactHeadCiGate({ repository_snapshot: snapshot, expected_main_sha: ${JSON.stringify(MAIN_SHA)}, expected_head_sha: ${JSON.stringify(HEAD_SHA)}, work_order_ref: ${JSON.stringify(WORK_ORDER_REF)} });
    process.stdout.write(JSON.stringify({ status: result.status, provenance: snapshot.transport_provenance }));`;
  for (const spoof of [null, "child-v8"]) {
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
    if (spoof) env.NODE_TEST_CONTEXT = spoof;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", source], { env, encoding: "utf8", timeout: 5000 });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), { status: "DIAGNOSTIC_CI_MATCH_NOT_VERIFIED", provenance: "DIAGNOSTIC_CUSTOM_TRANSPORT" });
  }
});

test("dynamic priority factors are bounded and deterministically order equal severity", async () => {
  assert.equal(DYNAMIC_COMPANY_PRIORITY_FACTORS.length, 11);
  const low = { ...task, task_id: "SAFE-ENGINEERING-LOW", work_order_ref: WORK_ORDER_REF, branch: "chatgpt-handoff/SAFE-ENGINEERING-LOW", priority_factors: { user_impact: 1 } };
  const high = { ...task, task_id: "SAFE-ENGINEERING-HIGH", work_order_ref: SECOND_WORK_ORDER_REF, branch: "chatgpt-handoff/SAFE-ENGINEERING-HIGH", priority_factors: { security: 5, data_loss_risk: 5 } };
  const lowProject = { ...activeCompanyProject, task_id: low.task_id };
  const highProject = { ...activeCompanyProject, task_id: high.task_id };
  const evidence = await repositoryEvidenceForEnvelopes([{ task: low, project: lowProject }, { task: high, project: highProject }]);
  const result = cycle({ work_queue: [low, high], projects: [lowProject, highProject], repository_evidence: evidence });
  assert.equal(result.selected_task_id, high.task_id);
  assert.ok(result.opportunity_records.find((record) => record.WORK_ID === high.task_id).PRIORITY_SCORE > result.opportunity_records.find((record) => record.WORK_ID === low.task_id).PRIORITY_SCORE);
  const bad = { ...low, priority_factors: { constructor: 5 } };
  const badEvidence = await repositoryEvidenceForEnvelope(bad, lowProject);
  assert.throws(() => cycle({ work_queue: [bad], projects: [lowProject], repository_evidence: badEvidence }), error => error.code === "PRIORITY_FACTOR_UNKNOWN");
});

test("NO_GLOBAL_IDLE watches one dependency chain and advances independent ready work", async () => {
  assert.ok(DYNAMIC_COMPANY_WAIT_STATES.includes("CI_RUNNING"));
  const waiting = { ...task, task_id: "WAITING-P0", work_order_ref: WORK_ORDER_REF, branch: "chatgpt-handoff/WAITING-P0", priority: "P0", status: "CI_RUNNING", watcher_id: "codex-gm-01", next_check_condition: "CHECK_RUN_COMPLETED_OR_HEAD_CHANGED" };
  const ready = { ...task, task_id: "READY-P1", work_order_ref: SECOND_WORK_ORDER_REF, branch: "chatgpt-handoff/READY-P1", priority: "P1" };
  const waitingProject = { ...activeCompanyProject, task_id: waiting.task_id, dependencies: ["CI_RUNNING"] };
  const readyProject = { ...activeCompanyProject, task_id: ready.task_id };
  const evidence = await repositoryEvidenceForEnvelopes([{ task: waiting, project: waitingProject }, { task: ready, project: readyProject }]);
  const result = cycle({ work_queue: [waiting, ready], projects: [waitingProject, readyProject], repository_evidence: evidence });
  assert.equal(result.selected_task_id, ready.task_id);
  assert.equal(result.no_global_idle, true);
  assert.deepEqual(result.watching_chains, [{ work_id: waiting.task_id, watcher: "codex-gm-01", next_check_condition: "CHECK_RUN_COMPLETED_OR_HEAD_CHANGED", dependency_chain_only: true }]);
  assert.equal(result.heartbeat_result.WATCHING, 1);
});

test("self-described durable predecessor cannot mint Git provenance or supersession", async () => {
  const first = cycle().opportunity_records[0];
  const durable = { ...structuredClone(first), CANONICAL_HISTORY_REF: WORK_ORDER_REF, SOURCE_COMMIT: first.SOURCE.main_sha, SOURCE_BLOB: first.SOURCE.git_object, RECORD_HASH: "b".repeat(64) };
  const changed = { ...task, dependencies_complete: false };
  const evidence = await repositoryEvidenceForEnvelopes([{ task: changed, project: activeCompanyProject, previous_work_orders: [durable] }]);
  const result = cycle({ work_queue: [changed], repository_evidence: evidence });
  const record = result.opportunity_records[0];
  assert.equal(record.PREDECESSOR_VERIFICATION, "HISTORICAL_GIT_PROVENANCE_NOT_VERIFIED");
  assert.equal(record.STATUS, "BLOCKED");
  assert.equal(record.SUPERSEDES, null);
  assert.ok(record.BLOCKERS.includes("PREDECESSOR_PROVENANCE_REQUIRED"));
});

test("reader-verified ancestor record survives restart and permits material supersession", async () => {
  const first = cycle().opportunity_records[0];
  const recordHash = createHash("sha256").update(stableStringify(first)).digest("hex");
  const historyContent = JSON.stringify({ schema: "KAIOS_DOT_WORK_ORDER_HISTORY_V1", opportunity_record: first, record_hash: recordHash });
  const durable = { ...structuredClone(first), CANONICAL_HISTORY_REF: WORK_ORDER_REF, SOURCE_COMMIT: HISTORY_SHA, SOURCE_BLOB: gitBlobSha(historyContent), RECORD_HASH: recordHash };
  const changed = { ...task, dependencies_complete: false };
  const evidence = await repositoryEvidenceForEnvelopes([{ task: changed, project: activeCompanyProject, previous_work_orders: [durable] }], [manager, worker, reviewer], {
    historyRefs: [{ path: WORK_ORDER_REF, commit: HISTORY_SHA }], historicalFiles: { [`${HISTORY_SHA}:${WORK_ORDER_REF}`]: historyContent }
  });
  const result = cycle({ work_queue: [changed], repository_evidence: evidence });
  const record = result.opportunity_records[0];
  assert.equal(record.PREDECESSOR_VERIFICATION, "CANONICAL_GIT_ANCESTOR_RECORD");
  assert.equal(record.SUPERSEDES.WORK_ID, task.task_id);
  assert.equal(record.STATUS, "BLOCKED");
  const forgedHistory = JSON.stringify({ schema: "KAIOS_DOT_WORK_ORDER_HISTORY_V1", opportunity_record: first, record_hash: "f".repeat(64) });
  await assert.rejects(() => repositoryEvidenceForEnvelopes([{ task: changed, project: activeCompanyProject, previous_work_orders: [durable] }], [manager, worker, reviewer], {
    historyRefs: [{ path: WORK_ORDER_REF, commit: HISTORY_SHA }], historicalFiles: { [`${HISTORY_SHA}:${WORK_ORDER_REF}`]: forgedHistory }
  }), error => error.code === "GITHUB_HISTORY_RECORD_HASH_MISMATCH");
});

test("exact-head gate can bind a hash-checked PR-head envelope without pretending main admission", async () => {
  const plannerTask = { ...task, target_pr: 353 };
  const content = JSON.stringify({ planner_task: plannerTask, active_project: activeCompanyProject });
  const path = `/repos/klineodyssey/kline-odyssey/contents/${WORK_ORDER_REF}?ref=${HEAD_SHA}`;
  const fixture = publicGitHubFixtureFetch({ [path]: { type: "file", encoding: "base64", sha: gitBlobSha(content), content: Buffer.from(content).toString("base64") } });
  const snapshot = await readLatestRepositorySnapshot({ repository: "klineodyssey/kline-odyssey", active_task_pr: 353, observed_at: "2026-10-07T07:00:00Z", required_check_names: ["company-safe-cycle", "workflow-security"], evidence_paths: [ACTIVE_COMPANY_BOOT_SOURCE_PATHS.worker_identity_authority], pr_evidence_paths: [WORK_ORDER_REF], fetch_impl: fixture.fetch });
  const gate = evaluateExactHeadCiGate({ repository_snapshot: snapshot, expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA, work_order_ref: WORK_ORDER_REF });
  assert.equal(gate.status, "DIAGNOSTIC_CI_MATCH_NOT_VERIFIED");
  assert.equal(gate.branch_policy_evidence_source, "EXACT_PR_HEAD");
  assert.equal(snapshot.files[WORK_ORDER_REF], undefined);
});

test("worker AUTO matching is deterministic and remains fail-closed without a qualified reviewer", async () => {
  const qualified = { ...worker, capabilities: ["CODE"], authority_scope: task.authorized_actions, current_load: 0, past_performance: 5 };
  const busy = { ...worker, worker_id: "chatgpt-02", life_identity_ref: "LIFE-CHATGPT-0002", controller_id: "TEST-CONTROLLER-CHATGPT-2", capabilities: ["CODE"], authority_scope: task.authorized_actions, current_load: 1, past_performance: 5 };
  const qualifiedReviewer = { ...reviewer, review_qualification: true, current_load: 0, past_performance: 5 };
  const autoTask = { ...task, assigned_worker_id: "AUTO", reviewer_id: "AUTO", branch: "chatgpt-handoff/SAFE-ENGINEERING-001" };
  const autoProject = { ...activeCompanyProject, implementer_id: "AUTO", reviewer_id: "AUTO" };
  const evidence = await repositoryEvidenceForEnvelope(autoTask, autoProject, [manager, qualified, busy, qualifiedReviewer]);
  const result = cycle({ work_queue: [autoTask], projects: [autoProject], workers: [manager, qualified, busy, qualifiedReviewer], repository_evidence: evidence });
  assert.equal(result.selected_worker_id, qualified.worker_id);
  assert.equal(result.selected_reviewer_id, qualifiedReviewer.worker_id);
  const noReviewerEvidence = await repositoryEvidenceForEnvelope(autoTask, autoProject, [manager, qualified]);
  const held = cycle({ work_queue: [autoTask], projects: [autoProject], workers: [manager, qualified], repository_evidence: noReviewerEvidence });
  assert.equal(held.status, "WATCHING");
  assert.ok(held.rejected_candidates[0].reasons.includes("DISTINCT_REVIEWER_REQUIRED"));
});

test("cargo resolver uses canonical map IDs and computed capacity without moving assets", async () => {
  const cargoTask = { ...task, work_type: "KGEN_CARGO", cargo_request: { asset: "KGEN", amount: 2, origin_point_id: "P_11520p0_花果山_R70", destination_candidates: [{ point_id: "P_12345p0_悟空財神殿_R72", need_score: 90 }], capacity_metrics: { ability: 5, reliability: 5, performance: 5, completion_history: 5, risk_tier: "LOW" }, rights_verified: true } };
  const result = cycle({ work_queue: [cargoTask], repository_evidence: await repositoryEvidenceForEnvelope(cargoTask, activeCompanyProject) });
  const cargo = result.opportunity_records[0];
  assert.equal(cargo.CARGO_REQUIRED, "YES"); assert.equal(cargo.CARGO_CAPACITY, 5);
  assert.equal(cargo.DESTINATION.point_id, "P_12345p0_悟空財神殿_R72");
  assert.equal(result.authority.mainnet_tx_sent, false);
  const invalid = { ...cargoTask, cargo_request: { ...cargoTask.cargo_request, destination_candidates: [{ point_id: "P_FAKE", need_score: 100 }] } };
  const held = cycle({ work_queue: [invalid], repository_evidence: await repositoryEvidenceForEnvelope(invalid, activeCompanyProject) });
  assert.ok(held.opportunity_records[0].BLOCKERS.includes("CARGO_POLICY_CAPACITY_RIGHTS_UNVERIFIED"));
  assert.equal(cycle().opportunity_records[0].CARGO_REQUIRED, "NO");
});

test("manufacturing inspection maintenance seal and rollback gates remain truthful", () => {
  const manufacturing = cycle().manufacture;
  assert.equal(validateDotOrganManufacturingRecord(manufacturing), manufacturing);
  const checks = Object.fromEntries(["heartbeat_input", "breath_input", "boot_read", "github_access", "queue_access", "worker_registry", "direct_channels", "priority_engine", "work_order_generator", "dedup_engine", "stale_engine", "dispatch_engine", "review_router", "cargo_resolver", "universe_destination_resolver", "payroll_handoff", "guardian_logging"].map((field) => [field, "PASS"]));
  const inspection = inspectDotOrganCandidate({ manufacturing_record: manufacturing, main_sha: MAIN_SHA, observed_at: "2026-10-07T08:00:00Z", checks });
  assert.equal(inspection.REPAIR_REQUIRED, true); assert.equal(inspection.SIGNATURES.independent_inspector, "NOT_VERIFIED");
  assert.equal(inspection.DOT_STATUS, "DEGRADED_UNVERIFIED_INSPECTION_INPUT");
  assert.equal(createDotOrganMaintenanceRecord({ issue: "QUEUE_DRIFT", observed_at: "2026-10-07T08:00:00Z" }).ORGAN_STATUS, "DEGRADED");
  assert.equal(evaluateDotOrganSeal({ manufacturing_record: manufacturing, inspection_record: inspection, exact_head_gate: { status: "EXACT_MAIN_HEAD_CI_PASS" }, independent_review_evidence: { status: "PASS" }, gm_ack_evidence: { status: "SIGNED" } }).status, "INVALID");
  for (const [patch, code] of [
    [{ HEAD_SHA: "junk" }, "DOT_MANUFACTURING_HEAD_SHA_INVALID"],
    [{ BASE_MAIN_SHA: "junk" }, "DOT_MANUFACTURING_BASE_SHA_INVALID"],
    [{ BRANCH: "main" }, "DOT_MANUFACTURING_BRANCH_INVALID"],
    [{ PR: 0 }, "DOT_MANUFACTURING_PR_INVALID"],
    [{ INSTALLED_AT: "x" }, "DOT_PREMATURE_INSTALLATION"]
  ]) assert.throws(() => validateDotOrganManufacturingRecord({ ...manufacturing, ...patch }), error => error.code === code);
  assert.throws(() => validateDotOrganManufacturingRecord({ ...manufacturing, SIGNATURES: {} }), error => error.code === "DOT_SIGNATURE_STATUS_INVALID");
  const forgedInstalled = { ...manufacturing, STATUS: "INSTALLED", HEAD_SHA: HEAD_SHA, INSTALLED_AT: "2026-10-07T09:00:00Z", IMPLEMENTED_BY: "dot-01", REVIEWED_BY: "reviewer-01", MAINTAINED_BY: "primeforge-01", POLICY_OWNER: "codex-gm-01", SIGNATURES: { manufacturer: "SIGNED", runtime_maintainer: "SIGNED", independent_inspector: "SIGNED", gm_acceptance: "SIGNED" } };
  assert.equal(evaluateDotOrganSeal({ manufacturing_record: forgedInstalled, inspection_record: { REPAIR_REQUIRED: false }, exact_head_gate: { status: "EXACT_MAIN_HEAD_CI_PASS", expected_main_sha: MAIN_SHA, expected_head_sha: HEAD_SHA }, independent_review_evidence: { status: "PASS" }, gm_ack_evidence: { status: "SIGNED" }, actor_registry_evidence: { status: "VERIFIED" } }).status, "INVALID");
  assert.deepEqual(evaluateDotDispatchSafety({ data_loss: true }), { ORGAN_STATUS: "DEGRADED", STOP_NEW_DISPATCH: true, ROLLBACK_REQUIRED: true, ESCALATE_GM: true, TRIGGERS: ["DATA_LOSS"] });
});

test("heartbeat result derives lifecycle and duplicate counts from bound queue evidence", async () => {
  const definitions = [
    ["ACTIVE-001", "WORKING"], ["REVIEW-001", "REVIEW"], ["DONE-001", "DONE"], ["BLOCKED-001", "BLOCKED"]
  ].map(([id, status], index) => {
    const nextTask = { ...task, task_id: id, status, work_order_ref: `KGEN-Organization/WorkOrders/LIFECYCLE_${index}.json`, branch: `chatgpt-handoff/${id}`,
      ...(status === "BLOCKED" ? {} : { dispatch_evidence: { status: "VERIFIED", work_id: id, worker_id: worker.worker_id, occurred_at: "2026-10-07T07:00:30Z" } }) };
    return { task: nextTask, project: { ...activeCompanyProject, task_id: id } };
  });
  const evidence = await repositoryEvidenceForEnvelopes(definitions);
  const result = cycle({ work_queue: definitions.map((entry) => entry.task), projects: definitions.map((entry) => entry.project), repository_evidence: evidence });
  assert.equal(result.heartbeat_result.ACTIVE, 1);
  assert.equal(result.heartbeat_result.REVIEWING, 1);
  assert.equal(result.heartbeat_result.COMPLETED, 0);
  assert.equal(result.heartbeat_result.BLOCKED, 2);
  assert.equal(result.heartbeat_result.DISPATCHED, 3);
  assert.ok(result.opportunity_records.find((record) => record.WORK_ID === "DONE-001").BLOCKERS.includes("COMPLETION_EVIDENCE_REQUIRED"));
  const duplicate = cycle({ work_queue: [task, task] });
  assert.equal(duplicate.heartbeat_result.DUPLICATE_REMOVED, 1);
  assert.equal(duplicate.heartbeat_result.DISPATCHED, 0);
});

test("DONE counts completed only with hash-bound result exact head CI tests and distinct review", async () => {
  const completionRef = "KGEN-Organization/WorkOrders/DONE_001_RESULT.json";
  const owner = { ...manager, worker_id: "human-owner-01", life_identity_ref: "LIFE-HUMAN-OWNER-0001", controller_id: "TEST-CONTROLLER-HUMAN-OWNER", role: "Project Owner" };
  const qualifiedReviewer = { ...reviewer, review_qualification: ["CODE"] };
  const evaluate = async ({ reviewActor = qualifiedReviewer, projectOwner = owner, dispatchAt = "2026-10-07T07:00:10Z", completedAt = "2026-10-07T07:00:50Z", resultMutation = {}, workerActors = null } = {}) => {
    const completionResult = {
      schema: "KAIOS_WORK_COMPLETION_EVIDENCE_V1", work_id: "DONE-001", result_status: "COMPLETED", head_sha: HEAD_SHA,
      tests: { status: "PASS", total: 54, completed_at: "2026-10-07T07:00:20Z" },
      ci: { status: "PASS", head_sha: HEAD_SHA, completed_at: "2026-10-07T07:00:30Z" },
      independent_review: { status: "PASS", reviewer_id: reviewActor.worker_id, reviewed_at: "2026-10-07T07:00:40Z" },
      completed_at: completedAt, ...resultMutation
    };
    const resultContent = JSON.stringify(completionResult);
    const doneTask = { ...task, task_id: "DONE-001", status: "DONE", target_pr: 353, reviewer_id: reviewActor.worker_id,
      work_order_ref: "KGEN-Organization/WorkOrders/DONE_001.json", branch: "chatgpt-handoff/DONE-001",
      dispatch_evidence: { status: "VERIFIED", work_id: "DONE-001", worker_id: worker.worker_id, occurred_at: dispatchAt },
      completion_evidence: { status: "VERIFIED", work_id: "DONE-001", result_ref: completionRef, result_blob: gitBlobSha(resultContent), head_sha: HEAD_SHA } };
    const doneProject = { ...activeCompanyProject, task_id: doneTask.task_id, project_owner_id: projectOwner.worker_id, reviewer_id: reviewActor.worker_id };
    const actors = workerActors ?? [manager, worker, reviewActor, projectOwner];
    const evidence = await repositoryEvidenceForEnvelopes([{ task: doneTask, project: doneProject }], actors, {
      extraFiles: { [completionRef]: resultContent }, extraWorkOrderRefs: [completionRef], activeTaskPr: 353
    });
    return cycle({ work_queue: [doneTask], projects: [doneProject], workers: actors, repository_evidence: evidence });
  };
  const result = await evaluate();
  assert.equal(result.heartbeat_result.COMPLETED, 1);
  assert.equal(result.opportunity_records[0].STATUS, "COMPLETED");
  const nonReviewer = { ...qualifiedReviewer, role: "Software Engineer" };
  const unqualifiedReviewer = { ...qualifiedReviewer, review_qualification: false };
  const sameController = { ...qualifiedReviewer, controller_id: worker.controller_id };
  const sameLife = { ...qualifiedReviewer, life_identity_ref: worker.life_identity_ref };
  for (const held of [
    await evaluate({ reviewActor: nonReviewer }),
    await evaluate({ reviewActor: unqualifiedReviewer }),
    await evaluate({ projectOwner: qualifiedReviewer, workerActors: [manager, worker, qualifiedReviewer] }),
    await evaluate({ reviewActor: sameController }),
    await evaluate({ reviewActor: sameLife }),
    await evaluate({ completedAt: "2026-10-07T07:00:05Z" })
  ]) {
    assert.equal(held.heartbeat_result.COMPLETED, 0);
    assert.ok(held.opportunity_records[0].BLOCKERS.includes("COMPLETION_EVIDENCE_REQUIRED"));
  }
});

test("branch concurrency gate rejects diagnostic provenance and structurally blocks competing stale or forged claims", async () => {
  const handoffHead = "8".repeat(40);
  const sessionBinding = "d".repeat(64);
  const claim = {
    claim_id: "CLAIM-KAIOS-DOT-ORGAN-V1-20261007-codex-gm-01-R1",
    work_id: "KAIOS-DOT-ORGAN-V1-20261007",
    branch: "codex/kaios-ai-company-active-mode-20261007",
    active_writer: manager.worker_id,
    life_id: manager.life_identity_ref,
    controller_binding_hash: "c".repeat(64),
    controller_registry_id: manager.controller_id,
    session_binding_hash: sessionBinding,
    handoff_head: handoffHead,
    handoff_scope: ["install branch concurrency gate", "add bounded regression test"],
    current_writer_release: true,
    next_writer_ack: true,
    fencing_token: "FENCE-KAIOS-DOT-ORGAN-V1-20261007-R1",
    fencing_epoch: 1,
    branch_authority: "HUMAN_EXPLICIT_EXISTING_PR_BRANCH",
    lease_status: "ACTIVE",
    claimed_at: "2026-10-07T13:50:00Z",
    last_heartbeat: "2026-10-07T13:58:00Z",
    lease_expires_at: "2026-10-07T17:50:00Z"
  };
  const sourceManifest = JSON.stringify({ branch_concurrency_gate: { claims: [claim] } });
  const files = {
    ...fixtureFiles,
    "KGEN-KAIOS/worker_registry.json": JSON.stringify({ workers: [manager, worker] }),
    [WORK_ORDER_REF]: sourceManifest
  };
  const repositoryEvidence = await resolveActiveCompanyRepositoryEvidence({
    observed_at: "2026-10-07T14:00:00Z", current_main_sha: MAIN_SHA, active_task_pr: 353,
    work_order_refs: [WORK_ORDER_REF], pr_work_order_refs: [WORK_ORDER_REF],
    fetch_impl: activeCompanyEvidenceFetch(files, { prHeadRef: claim.branch })
  });
  await assert.rejects(() => verifyBranchWriterRuntimeAttestation({
    repository_evidence: repositoryEvidence, current_main_sha: MAIN_SHA,
    source_ref: WORK_ORDER_REF, claim_id: claim.claim_id,
    signed_payload: {}, public_key_jwk: {}, signature_base64url: "AA"
  }), error => error.code === "BRANCH_WRITER_PUBLIC_EVIDENCE_REQUIRED");
  assert.deepEqual(BRANCH_WRITER_CONTROLLER_TRUST_ANCHORS, {});

  const inspected = inspectBranchConcurrencyClaimSet({ branch: claim.branch, observed_at: "2026-10-07T14:00:00Z", claims: [claim] });
  assert.equal(inspected.status, "STRUCTURALLY_VALID");
  assert.equal(inspected.authority_granted, false);
  const forgedInput = {
    branch: claim.branch,
    work_id: claim.work_id,
    handoff_head: handoffHead,
    observed_at: "2026-10-07T14:00:00Z",
    verified_attestation: { claim, claims: [claim], worker: manager, signed_payload: {} }
  };
  assert.deepEqual(evaluateBranchConcurrencyGate(forgedInput).reasons, ["VERIFIED_RUNTIME_ATTESTATION_REQUIRED"]);
  const competing = { ...claim, claim_id: `${claim.claim_id}-COMPETING`, work_id: "OTHER-WORK", active_writer: worker.worker_id,
    life_id: worker.life_identity_ref, controller_registry_id: worker.controller_id, fencing_token: "FENCE-OTHER-WORK-R2", fencing_epoch: 2 };
  assert.deepEqual(inspectBranchConcurrencyClaimSet({ branch: claim.branch, observed_at: "2026-10-07T14:00:00Z", claims: [claim, competing] }).reasons, ["MULTIPLE_ACTIVE_WRITERS"]);
  const future = { ...claim, claimed_at: "2026-10-07T14:01:00Z", last_heartbeat: "2026-10-07T14:01:00Z" };
  assert.deepEqual(inspectBranchConcurrencyClaimSet({ branch: claim.branch, observed_at: "2026-10-07T14:00:00Z", claims: [future] }).reasons, ["CLAIM_FRESHNESS_INVALID"]);
  assert.deepEqual(inspectBranchConcurrencyClaimSet({ branch: claim.branch, observed_at: "2026-10-07T14:20:00Z", claims: [claim] }).reasons, ["CLAIM_FRESHNESS_INVALID"]);
  assert.deepEqual(inspectBranchConcurrencyClaimSet({ branch: claim.branch, observed_at: "2026-10-07T14:00:00Z", claims: [claim, { ...competing, fencing_token: claim.fencing_token }] }).reasons, ["DUPLICATE_FENCING_TOKEN"]);
  assert.equal(PRIMEFORGE_IDENTITY_BOUNDARY.distinct_from, "human-primeforge");
  assert.equal(PRIMEFORGE_IDENTITY_BOUNDARY.active_writer_authority, false);
  assert.equal(PRIMEFORGE_IDENTITY_BOUNDARY.runtime_maintainer_authority, false);
  assert.equal(PRIMEFORGE_IDENTITY_BOUNDARY.reviewer_authority, false);
});
