import test from "node:test";
import assert from "node:assert/strict";
import {
  planAutonomousCompanyEngineeringCycle,
  persistAutonomousCompanyEngineeringCycle,
  restoreAutonomousCompanyEngineeringCycleState,
  AUTONOMOUS_ENGINEERING_DURABLE_EVENT_TYPES,
  AUTONOMOUS_ENGINEERING_SAFE_ACTIONS,
  AUTONOMOUS_ENGINEERING_FORBIDDEN_ACTIONS
} from "../core/company/index.mjs";
import { MemoryUniverseStore } from "../core/registry/store.mjs";
import { assertAppendOnlyChain } from "../core/history/index.mjs";

const MAIN_SHA = "9".repeat(40);
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
  controller_id: "CONTROLLER-CODEX-GM-0001",
  role: "General Manager / Dispatcher",
  allowed_branch_pattern: "codex/<Task-ID>"
});
const worker = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "chatgpt-01",
  life_identity_ref: "LIFE-CHATGPT-0001",
  controller_id: "CONTROLLER-CHATGPT-0001",
  role: "System Maintainer",
  allowed_branch_pattern: "chatgpt-handoff/<Task-ID>"
});
const reviewer = Object.freeze({
  ...acknowledgedWorker,
  worker_id: "reviewer-01",
  life_identity_ref: "LIFE-REVIEWER-0001",
  controller_id: "CONTROLLER-REVIEWER-0001",
  role: "Independent Reviewer",
  allowed_branch_pattern: "review/<Task-ID>"
});
const task = Object.freeze({
  task_id: "SAFE-ENGINEERING-001",
  status: "READY",
  priority: "P1",
  risk_level: "R1",
  assigned_worker_id: "chatgpt-01",
  reviewer_id: null,
  review_requirement: "NOT_REQUIRED",
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

function cycle(overrides = {}) {
  return planAutonomousCompanyEngineeringCycle({
    cycle_id: "KAIOS-ENGINEERING-CYCLE-0001",
    observed_at: "2026-09-14T00:01:00Z",
    current_main_sha: MAIN_SHA,
    expected_main_sha: MAIN_SHA,
    manager,
    workers: [manager, worker, reviewer],
    work_queue: [task],
    previous_cycle_ids: [],
    ...overrides
  });
}

test("selects one current-main R1 task without imposing a universal reviewer", () => {
  const result = cycle();
  assert.equal(result.status, "WORK_ORDER_CANDIDATE_READY");
  assert.equal(result.selected_task_id, task.task_id);
  assert.equal(result.selected_worker_id, worker.worker_id);
  assert.equal(result.selected_reviewer_id, null);
  assert.equal(result.work_order_candidate.review_requirement, "NOT_REQUIRED");
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
});

test("blocks main, codex, and mismatched branches", () => {
  for (const branch of ["main", "codex/SAFE-ENGINEERING-001", "chatgpt-handoff/WRONG-TASK"]) {
    const result = cycle({ work_queue: [{ ...task, branch }] });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
    assert.ok(result.rejected_candidates[0].reasons.includes("BRANCH_POLICY_MISMATCH"));
  }
});

test("never activates a suspended, occupied, or under-trusted worker", () => {
  for (const candidateWorker of [
    { ...worker, suspension: "SUSPENDED_BY_HUMAN_COST_DECISION" },
    { ...worker, active_claim_count: 1, current_task: "OTHER-TASK" },
    { ...worker, trust_level: "T1" }
  ]) {
    const result = cycle({ workers: [manager, candidateWorker, reviewer] });
    assert.equal(result.status, "NO_VERIFIED_SAFE_WORK");
    assert.equal(result.authority.worker_activated, false);
  }
});

test("requires a distinct reviewer only when the task declares review required", () => {
  const reviewedTask = { ...task, review_requirement: "REQUIRED", reviewer_id: reviewer.worker_id };
  assert.equal(cycle({ work_queue: [reviewedTask] }).selected_reviewer_id, reviewer.worker_id);
  const selfReviewed = cycle({ work_queue: [{ ...reviewedTask, reviewer_id: worker.worker_id }] });
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
