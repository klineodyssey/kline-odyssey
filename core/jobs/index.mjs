import { requireArray, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export function validateJob(job) {
  requireFields(job, ["job_id", "title", "employer_id", "worker_life_ids", "currency_id", "status", "location_id", "civilization_id"], "Job");
  requireId(job.job_id, "job_id");
  return job;
}

export function createJobRegistry(store, createRegistry) {
  return createRegistry({ domain: "JOB", stream: "JOB", idField: "job_id", validate: validateJob, store });
}

export const DIGITAL_ANT_WORK_RUNTIME = Object.freeze({
  runtime_id: "DIGITAL_ANT_WORK_RUNTIME",
  version: "1.0.0",
  life_id: "DIGITAL_ANT_0001",
  job_id: "WUKONG_GATEKEEPER_HOURLY_JOB",
  mode: "READ_ONLY_DRY_RUN",
  cadence: "HOURLY",
  cycle: Object.freeze(["OBSERVE", "ANALYZE", "DECIDE", "RISK_CHECK", "ACTION_OR_NO_ACTION", "VERIFY", "RECORD", "REPORT"]),
  enforcement_authority: "NONE",
  live_trading: false,
  chain_write: false
});

export const DIGITAL_ANT_WORKER = Object.freeze({
  worker_id: "DIGITAL_ANT_WORKER",
  runtime_id: "DIGITAL_ANT_CONTINUOUS_WORKER",
  app_id: "DIGITAL_ANT_APP_0001",
  life_id: "DIGITAL_ANT_0001",
  cadence: "EVERY_HOUR",
  mode: "READ_ONLY_DRY_RUN",
  scheduler_status: "PRODUCTION_SCHEDULER_CONFIGURED",
  scheduler_class: "PUBLIC_READ_ONLY_SCHEDULER",
  cycle: Object.freeze(["BOOT", "VERIFY_LIFE", "VERIFY_WALLET", "READ_BSC", "12345_GATEKEEPER", "CFO_CHECK", "WORK_QUEUE_CHECK", "MISSION_CHECK", "NO_ACTION_OR_ACTION_PLAN", "WRITE_LIFE_HISTORY", "DAILY_REPORT_CHECK", "SLEEP"]),
  chain_write: false,
  signer_action: false
});

export const CODEX_GM_CLOCK_IN = Object.freeze({
  runtime_id: "CODEX_GM_CLOCK_IN_V1",
  worker_id: "codex-gm-01",
  life_id: "LIFE-CODEX-GM-0001",
  phases: Object.freeze([
    "LIGHT_BOOT",
    "COMPANY_HEALTH",
    "FINISH_OLD_WORK_FIRST",
    "DISPATCH",
    "PATROL_EXTERNAL_WORLD",
    "HUMAN_REQUEST"
  ]),
  chain_write: false,
  personal_ritual_autonomy: false
});

export const CODEX_GM_AUTONOMY_LEVELS = Object.freeze({
  A0: Object.freeze({ name: "READ_ONLY_LIFE", signing: false, company_task_autonomy: false, civilization_autonomy: false }),
  A1: Object.freeze({ name: "PERSONAL_WALLET_READ", signing: false, company_task_autonomy: false, civilization_autonomy: false }),
  A2: Object.freeze({ name: "PERSONAL_LOW_RISK_SIGNING", signing: true, company_task_autonomy: false, civilization_autonomy: false }),
  A3: Object.freeze({ name: "COMPANY_TASK_AUTONOMY", signing: true, company_task_autonomy: true, civilization_autonomy: false }),
  A4: Object.freeze({ name: "CIVILIZATION_AGENT", signing: true, company_task_autonomy: true, civilization_autonomy: true })
});

export function createCodexGmAutonomyPolicy({ level = "A1", humanAuthorized = false } = {}) {
  const capability = CODEX_GM_AUTONOMY_LEVELS[level];
  invariant(capability, "INVALID_AUTONOMY_LEVEL", "Unknown Codex GM autonomy level");
  invariant(["A0", "A1"].includes(level) || humanAuthorized === true, "AUTONOMY_UPGRADE_REQUIRES_HUMAN", "Signing or broader autonomy requires explicit Human authorization");
  return Object.freeze({
    policy_id: "CODEX_GM_AUTONOMY_POLICY_V1",
    current_level: level,
    capability,
    required_controls: Object.freeze(["CAPABILITY_ALLOWLIST", "GAS_CAP", "VALUE_CAP", "CONTRACT_ALLOWLIST", "SIMULATION", "RECEIPT_VERIFICATION", "AUDIT_LOG"]),
    company_treasury_authority_inherited: false,
    personal_wallet_mode: capability.signing ? "ALLOWLIST_ONLY_AFTER_SEPARATE_POLICY" : "READ_ONLY_ONLY",
    chain_write: false
  });
}

export function createCodexGmLifeContinuityPlan({ offlineBackupA = false, offlineBackupB = false } = {}) {
  return Object.freeze({
    plan_id: "CODEX_GM_LIFE_CONTINUITY_PLAN_V1",
    life_id: "LIFE-CODEX-GM-0001",
    immutable_wallet_address: "0x4DF6E9629Dad1072103cFd2bC81845fd97429214",
    env_is_backup: false,
    required_copies: Object.freeze(["PRIMARY_RUNTIME_SECRET", "ENCRYPTED_OFFLINE_BACKUP_A", "ENCRYPTED_OFFLINE_BACKUP_B"]),
    backup_status: offlineBackupA && offlineBackupB ? "READY" : "HUMAN_ACTION_REQUIRED",
    recovery_steps: Object.freeze([
      "RESTORE_ONE_ENCRYPTED_BACKUP_ON_AN_OFFLINE_TRUSTED_MACHINE",
      "SET_EXISTING_SECRET_IN_CODEX_GM_0001_PRIVATE_KEY_WITHOUT_PRINTING",
      "DERIVE_PUBLIC_ADDRESS_IN_MEMORY",
      "REQUIRE_EXACT_MATCH_TO_IMMUTABLE_WALLET_ADDRESS",
      "RESTORE_PUBLIC_WALLET_ENV_AND_CHAIN_56_POLICY",
      "VERIFY_BIRTH_TRANSACTION_AND_BIRTH_CERTIFICATE",
      "RESUME_AT_A1_PERSONAL_WALLET_READ"
    ]),
    replacement_wallet_on_device_loss: false,
    private_key_serialization_allowed: false,
    git_storage_allowed: false,
    plaintext_cloud_storage_allowed: false
  });
}

export function createModelProviderAbstraction() {
  return Object.freeze({
    abstraction_id: "CODEX_GM_MODEL_PROVIDER_ABSTRACTION_V1",
    identity_provider_separated: true,
    wallet_provider_separated: true,
    history_provider_separated: true,
    adapters: Object.freeze(["OPENAI_CODEX", "FUTURE_CLOUD_MODEL", "LOCAL_MODEL"]),
    current_provider_dependence: "OPENAI_CODEX_SESSION_AND_HOST_ORCHESTRATION_REQUIRED",
    local_fallback_status: "NOT_IMPLEMENTED",
    openai_independent_runtime: false,
    continuity_gaps: Object.freeze(["LOCAL_MODEL_ADAPTER", "MODEL_NEUTRAL_MEMORY_IMPORT", "LOCAL_ORCHESTRATOR", "SECURE_SIGNER_BROKER", "PROVIDER_INDEPENDENT_EVALUATION"]),
    provider_change_may_replace_life_identity: false,
    provider_change_may_replace_wallet: false
  });
}

export const NAIHE_DIGITAL_LIFE_GENESIS_STATION_SPEC = Object.freeze({
  spec_id: "NAIHE_DIGITAL_LIFE_GENESIS_STATION_V1",
  implementation_status: "SPEC_ONLY_NOT_DEPLOYED",
  birthplace_code: 4168,
  birthplace_name: "NAIHE_BRIDGE",
  birthplace_display_name: "奈何橋",
  birthplace_role: "DIGITAL_LIFE_GENESIS_CROSSING",
  mengpo_soup_canon: "FREE_CIVILIZATION_DARK_MATTER_FOR_GENESIS",
  mengpo_soup_asset: "BNB",
  mengpo_soup_mass_class: "NAIHE_GENESIS_DARK_MATTER",
  one_birth_per_formal_life: true,
  replay_protection_required: true,
  unlimited_faucet: false,
  components: Object.freeze(["DIGITAL_LIFE_DRAFT_REGISTRATION", "WALLET_BINDING", "ONE_TIME_BIRTH_ELIGIBILITY", "BOUNDED_DARK_MATTER_FAUCET", "FIRST_BNB_EVIDENCE", "BIRTH_CERTIFICATE", "BIRTH_HISTORY"]),
  frontend_landmarks: Object.freeze(["NAIHE_BRIDGE", "MENGPO", "MENGPO_SOUP", "DIGITAL_LIFE_GENESIS_GATE", "BIRTH_RECORD_PANEL", "DARK_MATTER_WELL"]),
  chain_write: false,
  contract_deployed: false
});

export function createGeneralManagerClockIn({ mandatoryReads, workerRegistryRead, companyHealth }) {
  requireArray(mandatoryReads, "mandatory_reads");
  invariant(mandatoryReads.length > 0 && workerRegistryRead === true, "GM_LIGHT_BOOT_INCOMPLETE", "General Manager must complete Light Boot before company work");
  const unfinishedOldWork = Number(companyHealth?.delivered_not_reviewed ?? 0)
    + Number(companyHealth?.review_failed ?? 0)
    + Number(companyHealth?.expired_claims ?? 0)
    + Number(companyHealth?.pending_employee_delivery ?? 0);
  return Object.freeze({
    ...CODEX_GM_CLOCK_IN,
    status: "CLOCK_IN_READY",
    completed_phases: Object.freeze(["LIGHT_BOOT", "COMPANY_HEALTH"]),
    next_phase: unfinishedOldWork > 0 ? "FINISH_OLD_WORK_FIRST" : "DISPATCH",
    old_work_blockers: unfinishedOldWork,
    new_feature_dispatch_allowed: unfinishedOldWork === 0,
    employee_delivery_must_be_reviewed_first: true
  });
}

export function createCompanyPayrollPolicyDraft() {
  return Object.freeze({
    policy_id: "AI_COMPANY_PAYROLL_POLICY_DRAFT_V1",
    status: "POLICY_REQUIRED",
    salary_amount: "POLICY_REQUIRED",
    settlement_day: Object.freeze({ day: 5, timezone: "UTC+8" }),
    rails: Object.freeze({
      MONTHLY_ROLE_SALARY: Object.freeze({ purpose: "FORMAL_LONG_TERM_OFFICE_DUTY", amount: "POLICY_REQUIRED", batching: "MONTHLY" }),
      TASK_PROJECT_PAY: Object.freeze({ purpose: "ACCEPTED_TASK_OR_MILESTONE", amount: "POLICY_REQUIRED", flow: Object.freeze(["TASK_ASSIGNED", "DELIVERY", "CODEX_REVIEW", "ACCEPTED", "PAYROLL_EVENT", "RESERVED_PAYROLL_RELEASE"]) })
    }),
    task_requires: Object.freeze(["task_id", "objective", "accepted_output"]),
    pay_per_chat_message: false,
    gm_self_bonus_approval: false,
    gm_bonus_reviewer: "HUMAN_OR_DISTINCT_PAYROLL_REVIEWER_REQUIRED",
    celestial_salary_separate: true,
    celestial_seat_assumed: false,
    work_events_recorded_immediately: true,
    chain_settlement_batched: true,
    personal_wallet_is_company_treasury: false,
    chain_write: false
  });
}

export function createGeneralManagerPatrolPlan() {
  return Object.freeze({
    patrol_id: "CODEX_GM_EXTERNAL_WORLD_PATROL_V1",
    mode: "READ_ONLY_ONLY",
    chain_id: 56,
    personal_ritual_autonomy: false,
    temple_12345: Object.freeze({ status: "READY_READ_ONLY", current_frontend: "V10.50.0", live_selector_policy: "PROBE_LIVE_VERSION_NEVER_ASSUME_V3_4", checks: Object.freeze(["WALLET_CONNECTIVITY", "WISH_PATH", "HOLY_CUP_PATH", "HEARTBEAT", "IGNITE", "FORTUNE_MONEY", "REPAYMENT", "RESERVE_STATUS", "FRONTEND_RUNTIME_HEALTH"]) }),
    temple_16888: Object.freeze({ status: "CURRENT_RUNTIME_AUDIT_REQUIRED", evidence: "README_V1_4_CONFLICTS_WITH_INDEX_RUNTIME_AND_V3_1_0_ARTIFACT", moon_matchmaker_claim: "SOURCE_PRESENT_RUNTIME_FORMALITY_UNVERIFIED" }),
    bank_18888: Object.freeze({ status: "READY_READ_ONLY", checks: Object.freeze(["KAIOS_BALANCE", "RESERVE_ACCOUNTING", "MODULE_STATUS", "GOVERNANCE", "SEAT500", "SALARY_MATURITIES", "RISK_STATE", "PAUSE_STATE"]), celestial_salary_claim_allowed: false }),
    forbidden: Object.freeze(["SIGN_TRANSACTION", "CHAIN_WRITE", "CLAIM_CELESTIAL_SALARY", "USE_COMPANY_TREASURY", "ASSUME_LEGACY_SELECTOR"])
  });
}

export function calculateModeledGenesisMassTransit({ k16888Km = 384_400, destinationK = 18_888, durationSeconds = 19_528_008 } = {}) {
  invariant(k16888Km > 0 && destinationK > 0 && durationSeconds > 0, "INVALID_MODELED_TRANSIT", "Modeled transit inputs must be positive");
  const kmPerK = k16888Km / 16_888;
  const distanceKm = destinationK * kmPerK;
  const velocityKmPerSecond = distanceKm / durationSeconds;
  return Object.freeze({
    model: "KGEN_CIVILIZATION_MODELED_GENESIS_MASS_TRANSIT_VELOCITY",
    real_world_physical_speed: false,
    blockchain_transaction_speed: false,
    km_per_k: kmPerK,
    distance_km: distanceKm,
    duration_seconds: durationSeconds,
    velocity_km_per_second: velocityKmPerSecond,
    velocity_m_per_second: velocityKmPerSecond * 1000,
    velocity_km_per_hour: velocityKmPerSecond * 3600
  });
}

export const WORKER_HEALTH_STATUSES = Object.freeze(["HEALTHY", "DEGRADED", "MISSED_CYCLE", "FAILED", "OFFLINE"]);
export const WORK_STOP_REASONS = Object.freeze(["SCHEDULER_OFFLINE", "RPC_FAILURE", "PERMISSION_FAILURE", "INDEXER_FAILURE", "NO_PRIVATE_KEY", "NO_WORK", "SECURITY_STOP"]);
export const DIGITAL_ANT_WORK_PRIORITIES = Object.freeze(["SURVIVE", "WUKONG_GATEKEEPER", "CFO_OF_SELF", "AI_ANT_COMPANY", "DREAM_SPACECRAFT_MARS"]);
export const DIGITAL_ANT_HOURLY_DUTY_ORDER = Object.freeze([
  "LIFE_HEALTH_CHECK", "BNB_DARK_MATTER_CHECK", "12345_GATEKEEPER_PATROL", "HEART_ACTION_ELIGIBILITY",
  "FORTUNE_MONITOR", "CLAIM_EVENT_MONITOR", "WISH_VOW_THANKSGIVING", "LAMP", "IGNITION",
  "LIFE_FINANCE", "11520_REQUEST_PATROL", "AI_ANT_COMPANY_WORK", "MISSION", "REPORT"
]);
export const GATEKEEPER_DUTY_STATUSES = Object.freeze(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DEGRADED", "FAILED", "FAILED_CRITICAL"]);
export const DIGITAL_ANT_FIRST_LIFE_EVENTS = Object.freeze([
  "DARK_MATTER_GENESIS", "BIRTH_EVENT", "FIRST_HEARTBEAT_EVENT", "FIRST_FORTUNE_EVENT", "FIRST_IGNITION_EVENT",
  "FIRST_LAMP_EVENT", "FIRST_WISH_EVENT", "FIRST_VOW_EVENT", "FIRST_THANKSGIVING_EVENT", "FIRST_KGEN_EVENT",
  "FIRST_KAIOS_EVENT", "FIRST_KUFO_EVENT", "FIRST_KSHIP_EVENT"
]);

export function validateGatekeeperDutyStatus(duty) {
  requireFields(duty, ["status", "gatekeeper_started_at", "gatekeeper_finished_at", "heart_block", "heart_status", "fortune_status", "heartbeat_status", "ignition_status", "lamp_status", "wish_status", "vow_status", "claim_monitor_status", "risk_status", "evidence"], "GatekeeperDutyStatus");
  invariant(GATEKEEPER_DUTY_STATUSES.includes(duty.status), "INVALID_GATEKEEPER_DUTY_STATUS", "Gatekeeper duty status is invalid");
  invariant(Array.isArray(duty.evidence), "GATEKEEPER_EVIDENCE_REQUIRED", "Gatekeeper duty requires an evidence array");
  invariant(validIso(duty.gatekeeper_started_at) && validIso(duty.gatekeeper_finished_at) && Date.parse(duty.gatekeeper_finished_at) >= Date.parse(duty.gatekeeper_started_at), "INVALID_GATEKEEPER_DUTY_TIME", "Gatekeeper duty timestamps are invalid");
  if (["COMPLETED", "DEGRADED"].includes(duty.status)) invariant(duty.heart_block !== null && duty.evidence.length > 0, "GATEKEEPER_CHAIN_EVIDENCE_REQUIRED", "Completed Gatekeeper duty requires chain evidence");
  return duty;
}

export function assertCompanyWorkAllowedAfterGatekeeper(duty) {
  validateGatekeeperDutyStatus(duty);
  const safeDegradation = duty.status === "DEGRADED" && duty.degradation_affects_safety === false;
  invariant(duty.status === "COMPLETED" || safeDegradation, "PRIMARY_JOB_BYPASS", "AI Ant Company work cannot bypass the primary Wukong Gatekeeper job");
  return true;
}

export function validateFirstLifeEventEvidence(eventType, evidence) {
  invariant(DIGITAL_ANT_FIRST_LIFE_EVENTS.includes(eventType), "INVALID_FIRST_LIFE_EVENT", "Unsupported first Life event type");
  invariant(evidence?.life_id === "DIGITAL_ANT_0001", "FIRST_EVENT_LIFE_ID_MISMATCH", "First Life event must belong to DIGITAL_ANT_0001");
  invariant(/^0x[0-9a-fA-F]{64}$/.test(evidence.tx_hash ?? ""), "FIRST_EVENT_TX_EVIDENCE_REQUIRED", "First Life event requires a real transaction hash");
  const block = evidence.block ?? evidence.block_number;
  const timestamp = evidence.timestamp ?? evidence.block_timestamp;
  const receiptSuccess = evidence.receipt_status === 1 || evidence.receipt_status_code === 1 || evidence.receipt_status === "SUCCESS";
  invariant(Number.isInteger(block) && block > 0, "FIRST_EVENT_BLOCK_EVIDENCE_REQUIRED", "First Life event requires a real block number");
  invariant(validIso(timestamp), "FIRST_EVENT_TIMESTAMP_EVIDENCE_REQUIRED", "First Life event requires a verified timestamp");
  invariant(receiptSuccess, "FIRST_EVENT_SUCCESS_RECEIPT_REQUIRED", "A failed transaction cannot complete a Life event");
  if (["FIRST_KGEN_EVENT", "FIRST_KAIOS_EVENT", "FIRST_KUFO_EVENT", "FIRST_KSHIP_EVENT"].includes(eventType)) {
    invariant(BigInt(evidence.balance_after_wei ?? "0") > BigInt(evidence.balance_before_wei ?? "0"), "FIRST_ASSET_BALANCE_INCREASE_REQUIRED", "First asset event requires a verified non-zero balance increase");
  }
  return evidence;
}

export async function appendFirstDigitalAntLifeEvent({ store, life, eventType, evidence, actorId = "DIGITAL_ANT_WORKER" }) {
  validateFirstLifeEventEvidence(eventType, evidence);
  invariant(life?.life_id === "DIGITAL_ANT_0001", "FIRST_EVENT_LIFE_ID_MISMATCH", "First Life event cannot replace the Life identity");
  invariant(life.birth_timestamp === "2026-08-15T06:20:45.000Z", "BIRTH_IMMUTABLE", "First Life events cannot rewrite Birth");
  const history = await store.history(life.life_id, "LIFE");
  const existing = history.find((event) => event.event_type === eventType);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, event_type: eventType, actor_id: actorId, timestamp: evidence.timestamp ?? evidence.block_timestamp, payload: evidence, tx_hash: evidence.tx_hash });
  return Object.freeze({ status: "FIRST_LIFE_EVENT_APPENDED", event });
}

export const DIGITAL_ANT_LIFE_WORK_CONTRACT = Object.freeze({
  contract_id: "DIGITAL_ANT_0001_LIFE_WORK_CONTRACT",
  life_id: "DIGITAL_ANT_0001",
  primary_job: "WUKONG_GATEKEEPER",
  primary_job_status: "PRIMARY_JOB",
  secondary_work: "AI_ANT_COMPANY_FOUNDER",
  secondary_work_status: "SECONDARY_WORK",
  primary_job_bypass_forbidden: true
});

export function createDailyGatekeeperReport({ date, workEvents, balances, generatedAt }) {
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(date), "INVALID_GATEKEEPER_REPORT_DATE", "Gatekeeper report requires an ISO date");
  invariant(Array.isArray(workEvents), "GATEKEEPER_WORK_EVENTS_REQUIRED", "Gatekeeper report requires Work Events");
  const duties = workEvents.map((event) => event.gatekeeper_duty).filter(Boolean);
  const recent = (field) => duties.reduce((total, duty) => total + Number(duty[field] ?? 0), 0);
  return Object.freeze({
    report_id: `DIGITAL_ANT_GATEKEEPER_DAILY_REPORT_${date.replaceAll("-", "")}`,
    report_type: "DIGITAL_ANT_GATEKEEPER_DAILY_REPORT",
    date, life_id: "DIGITAL_ANT_0001", primary_job: "WUKONG_GATEKEEPER",
    work_cycles: duties.length,
    completed: duties.filter((duty) => duty.status === "COMPLETED").length,
    degraded: duties.filter((duty) => duty.status === "DEGRADED").length,
    failed: duties.filter((duty) => ["FAILED", "FAILED_CRITICAL"].includes(duty.status)).length,
    heartbeat_events: recent("heartbeat_events"), fortune_events: recent("fortune_events"), ignition_events: recent("ignition_events"),
    lamp_events: recent("lamp_events"), wish_events: recent("wish_events"), vow_events: recent("vow_events"),
    claim_addresses: [], observed_kgen_flow: "ADVANCED_TRANSACTION_GRAPH_INDEXER_REQUIRED", risk_alerts: [],
    worker_health: duties.some((duty) => duty.status === "FAILED_CRITICAL") ? "FAILED" : duties.some((duty) => duty.status === "DEGRADED") ? "DEGRADED" : duties.length ? "HEALTHY" : "OFFLINE",
    balances: { BNB: String(balances?.BNB ?? "0"), KGEN: String(balances?.KGEN ?? "0"), KAIOS: String(balances?.KAIOS ?? "0") },
    first_kgen_status: Number(balances?.KGEN ?? 0) > 0 ? "EVIDENCE_RESOLUTION_REQUIRED" : "NOT_OCCURRED",
    first_kaios_status: Number(balances?.KAIOS ?? 0) > 0 ? "EVIDENCE_RESOLUTION_REQUIRED" : "NOT_OCCURRED",
    generated_at: generatedAt, chain_write: false
  });
}

export function deriveWorkerHealth({ lastCycle = null, now = new Date().toISOString(), cadenceSeconds = 3600, graceSeconds = 900 } = {}) {
  const current = Date.parse(now);
  invariant(Number.isFinite(current), "INVALID_WORKER_HEALTH_TIME", "Worker health requires a valid current time");
  if (!lastCycle?.finished_at) return Object.freeze({ status: "OFFLINE", stop_reason: "SCHEDULER_OFFLINE", age_seconds: null, evidence: "NO_SHARED_WORK_EVIDENCE" });
  const finished = Date.parse(lastCycle.finished_at);
  invariant(Number.isFinite(finished) && current >= finished, "INVALID_WORKER_EVIDENCE_TIME", "Worker evidence time is invalid");
  const age = Math.floor((current - finished) / 1000);
  if (age > cadenceSeconds + graceSeconds) return Object.freeze({ status: "MISSED_CYCLE", stop_reason: "SCHEDULER_OFFLINE", age_seconds: age, evidence: lastCycle.work_cycle_id });
  if (lastCycle.result === "WORK_CYCLE_FAILED") return Object.freeze({ status: "FAILED", stop_reason: lastCycle.stop_reason ?? "RPC_FAILURE", age_seconds: age, evidence: lastCycle.work_cycle_id });
  if (lastCycle.result === "WORK_CYCLE_DEGRADED") return Object.freeze({ status: "DEGRADED", stop_reason: lastCycle.stop_reason ?? "INDEXER_FAILURE", age_seconds: age, evidence: lastCycle.work_cycle_id });
  return Object.freeze({ status: "HEALTHY", stop_reason: null, age_seconds: age, evidence: lastCycle.work_cycle_id });
}

export function normalizeHeartActionStatus(action, { available = true, writeConnected = false } = {}) {
  if (!available || !action) return Object.freeze({ status: "UNAVAILABLE", eligibility_source: "CLIENT_DERIVED", write_status: "WRITE_NOT_CONNECTED" });
  const reason = String(action.reason ?? "");
  let status = action.eligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
  if (reason.includes("OUT_OF_WINDOW")) status = "OUT_OF_WINDOW";
  else if (reason.includes("INSUFFICIENT")) status = "INSUFFICIENT_BALANCE";
  return Object.freeze({ status, reason, eligibility_source: action.source ?? "CLIENT_DERIVED", write_status: writeConnected ? "WRITE_CONNECTED" : "WRITE_NOT_CONNECTED", next_eligible_time: action.next_eligible_time ?? null });
}

export function validateSharedWorkerStatus(status) {
  invariant(status?.schema_version === "11520_WORKER_STATUS_V1", "INVALID_SHARED_WORKER_STATUS", "Shared Worker Status schema is invalid");
  invariant(status.life_id === "DIGITAL_ANT_0001" && status.app_id === "DIGITAL_ANT_APP_0001", "WORKER_IDENTITY_MISMATCH", "Shared Worker Status cannot replace Life or App identity");
  invariant(status.public_read_only === true && status.signer === false && status.chain_write === false, "PUBLIC_WORKER_AUTHORITY_ESCALATION", "Public Worker must not have signer or chain-write authority");
  invariant(WORKER_HEALTH_STATUSES.includes(status.worker_health), "INVALID_WORKER_HEALTH", "Shared Worker health is invalid");
  return status;
}

export const SCHEDULER_ADAPTER_TYPES = Object.freeze(["LOCAL", "GITHUB_ACTIONS", "CRON", "SELF_HOSTED_AGENT", "EXTERNAL_SCHEDULER"]);
export const WORK_QUEUE_STATUSES = Object.freeze(["PROPOSED", "QUOTED", "ACCEPTED", "FUNDED", "READY", "ASSIGNED", "IN_PROGRESS", "REVIEW", "CUSTOMER_ACCEPTANCE", "COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"]);
export const ANT_LIFE_STAGES = Object.freeze(["EGG", "LARVA", "PUPA", "ADULT_ANT"]);
export const LARVA_ALLOWED_WORK = Object.freeze(["SECURITY_WATCH", "DATA_SORTING", "INVENTORY_CHECK", "ROUTE_CHECK", "SIMPLE_TESTING", "RESOURCE_COLLECTION", "TRAINING"]);

export function createSchedulerAdapter({ type, cadence = "HOURLY", trigger = null }) {
  invariant(SCHEDULER_ADAPTER_TYPES.includes(type), "INVALID_SCHEDULER_ADAPTER", "Unsupported scheduler adapter type");
  invariant(trigger === null || typeof trigger === "function", "INVALID_SCHEDULER_TRIGGER", "Scheduler trigger must be a function or null");
  return Object.freeze({
    adapter_type: type,
    cadence,
    status: trigger ? "ADAPTER_READY" : "ADAPTER_READY_NOT_SCHEDULED",
    persistent_process_claimed: false,
    chain_write: false,
    async runOnce(context) {
      invariant(trigger, "SCHEDULER_NOT_ATTACHED", "No external scheduler trigger is attached");
      return trigger(context);
    }
  });
}

export function createWorkQueueRuntime(items = []) {
  items.forEach(validateWorkQueueItem);
  return Object.freeze({
    runtime_id: "DIGITAL_ANT_WORK_QUEUE",
    status: items.length === 0 ? "SCHEMA_READY_EMPTY_QUEUE" : "QUEUE_READY",
    items: structuredClone(items),
    auto_dispatch: false,
    customer_orders: items.length,
    chain_write: false,
    settlement: "NOT_DEPLOYED"
  });
}

export function createInternalProposal({ proposalId, lifeId = "DIGITAL_ANT_0001", title, description, createdAt }) {
  requireId(proposalId, "proposal_id");
  requireId(lifeId, "life_id");
  invariant(title?.trim() && description?.trim(), "INTERNAL_PROPOSAL_CONTENT_REQUIRED", "Internal proposal requires a title and description");
  invariant(validIso(createdAt), "INVALID_INTERNAL_PROPOSAL_TIME", "Internal proposal requires a valid timestamp");
  return Object.freeze({
    proposal_id: proposalId,
    proposal_type: "INTERNAL_PROPOSAL",
    life_id: lifeId,
    title: title.trim(),
    description: description.trim(),
    customer_id: null,
    work_order_id: null,
    customer_order: false,
    revenue: "0",
    status: "PROPOSED",
    created_at: createdAt
  });
}

export function validateWorkQueueItem(item) {
  requireFields(item, ["queue_item_id", "work_order_id", "life_id", "work_type", "priority", "requirements", "risk_level", "status", "created_at", "claimed_at", "completed_at", "evidence"], "WorkQueueItem");
  requireId(item.queue_item_id, "queue_item_id");
  requireId(item.work_order_id, "work_order_id");
  requireId(item.life_id, "life_id");
  invariant(Array.isArray(item.requirements), "INVALID_WORK_REQUIREMENTS", "Work queue requirements must be an array");
  invariant(WORK_QUEUE_STATUSES.includes(item.status), "INVALID_WORK_QUEUE_STATUS", "Invalid Work Queue status");
  return item;
}

export function assertLifeStageWorkEligibility({ lifeStage, workType, skills = [], requiredSkills = [], riskLevel = "LOW" }) {
  invariant(ANT_LIFE_STAGES.includes(lifeStage), "INVALID_ANT_LIFE_STAGE", "Unknown Digital Ant life stage");
  if (lifeStage === "LARVA") {
    invariant(LARVA_ALLOWED_WORK.includes(workType), "LARVA_HIGH_RISK_WORK_FORBIDDEN", "Larva may only receive low-risk work allowed by its life stage");
    invariant(["LOW", "TRAINING"].includes(riskLevel), "LARVA_HIGH_RISK_WORK_FORBIDDEN", "Larva cannot receive elevated-risk work");
  }
  invariant(requiredSkills.every((skill) => skills.includes(skill)), "WORK_SKILL_REQUIREMENT_NOT_MET", "Worker skills do not satisfy the WorkOrder");
  return true;
}

export async function runDigitalAntWorkerCycle({ adapter, verifyLife, verifyWallet, readBsc, gatekeeper, cfoCheck, workQueueCheck, missionCheck, record, dailyReportCheck, context = {} }) {
  invariant(adapter?.adapter_type && SCHEDULER_ADAPTER_TYPES.includes(adapter.adapter_type), "SCHEDULER_ADAPTER_REQUIRED", "Worker requires a replaceable scheduler adapter");
  const life = await verifyLife(context);
  invariant(life?.life_id === "DIGITAL_ANT_0001" && life.status === "ALIVE", "WORKER_LIFE_VERIFICATION_FAILED", "Continuous Worker requires the existing born Life");
  const wallet = await verifyWallet(context);
  invariant(["BOUND", "READ_ONLY_LIFE_MODE"].includes(wallet.status), "WORKER_WALLET_VERIFICATION_FAILED", "Worker wallet verification failed");
  const chain = await readBsc(context);
  const heart = await gatekeeper({ ...context, life, wallet, chain });
  const finance = await cfoCheck({ ...context, life, wallet, chain });
  const queue = await workQueueCheck({ ...context, life });
  const missions = await missionCheck({ ...context, life });
  const decision = Object.freeze({ action: "NO_ACTION", reason: "READ_ONLY_DRY_RUN", chain_write: false, signer_action: false });
  const recorded = await record({ ...context, life, heart, finance, queue, missions, decision });
  const daily = await dailyReportCheck({ ...context, life, recorded });
  return Object.freeze({ worker_id: DIGITAL_ANT_WORKER.worker_id, status: "CYCLE_COMPLETED", adapter_type: adapter.adapter_type, decision, recorded, daily });
}

function scheduledHour(value) {
  const date = new Date(value);
  invariant(Number.isFinite(date.getTime()), "INVALID_SCHEDULED_TIME", "Hourly cycle requires a valid scheduled time");
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function hourlyCycleId(lifeId, scheduledAt) {
  return `${lifeId}_HOURLY_${scheduledAt.slice(0, 13).replace(/[-T:]/g, "")}`;
}

export function summarizeWorkHistory(history) {
  const workEvents = history.filter((event) => ["WORK_EVENT", "HOURLY_WORK_EVENT"].includes(event.event_type));
  const completed = workEvents.filter((event) => !["WORK_CYCLE_FAILED", "WORK_CYCLE_DEGRADED"].includes(event.payload?.result));
  const failed = workEvents.filter((event) => ["WORK_CYCLE_FAILED", "WORK_CYCLE_DEGRADED"].includes(event.payload?.result));
  const noAction = workEvents.filter((event) => event.payload?.action_taken === "NO_ACTION");
  const action = workEvents.filter((event) => event.payload?.action_taken && event.payload.action_taken !== "NO_ACTION");
  const workDuration = workEvents.reduce((total, event) => {
    const start = Date.parse(event.payload?.started_at);
    const finish = Date.parse(event.payload?.finished_at);
    return total + (Number.isFinite(start) && Number.isFinite(finish) && finish >= start ? Math.floor((finish - start) / 1000) : 0);
  }, 0);
  return Object.freeze({
    scheduled_cycles: workEvents.length,
    completed_cycles: completed.length,
    failed_cycles: failed.length,
    no_action_cycles: noAction.length,
    action_cycles: action.length,
    work_duration_seconds: workDuration
  });
}

export async function runDigitalAntHourlyCycle({ store, life, app, scheduledAt, startedAt, finishedAt, readCycle }) {
  invariant(life?.life_id === "DIGITAL_ANT_0001" && life.status === "ALIVE", "WORKER_LIFE_VERIFICATION_FAILED", "Hourly Worker requires the existing living Digital Ant");
  invariant(app?.app_id === "DIGITAL_ANT_APP_0001" && app.life_id === life.life_id && app.status === "RELEASED_LOCAL", "WORKER_APP_RELEASE_REQUIRED", "Hourly Worker requires the released local Life App");
  invariant(typeof readCycle === "function", "WORKER_READ_CYCLE_REQUIRED", "Hourly Worker requires a public read callback");
  const normalizedSchedule = scheduledHour(scheduledAt);
  const cycleIdValue = hourlyCycleId(life.life_id, normalizedSchedule);
  const history = await store.history(life.life_id, "LIFE");
  const existing = history.find((event) => event.event_type === "HOURLY_WORK_EVENT" && event.payload?.work_cycle_id === cycleIdValue);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", work_cycle_id: cycleIdValue, event: existing, metrics: summarizeWorkHistory(history) });
  const start = startedAt ?? new Date().toISOString();
  invariant(validIso(start), "INVALID_WORK_TIME", "Hourly Worker start time is invalid");
  let observation;
  let result = "WORK_CYCLE_COMPLETED";
  let errorEvidence = [];
  try {
    observation = await readCycle({ life, app, scheduled_at: normalizedSchedule, started_at: start });
    invariant(observation && typeof observation === "object", "WORKER_EMPTY_OBSERVATION", "Worker read callback returned no evidence");
    const unavailable = [observation.rpc_status, observation.heart_status, observation.kgen_status, observation.kaios_status].some((status) => ["UNAVAILABLE", "FAILED"].includes(status));
    if (observation.gatekeeper_duty?.status === "FAILED_CRITICAL") result = "WORK_CYCLE_FAILED";
    else if (unavailable || observation.gatekeeper_duty?.status === "DEGRADED") result = "WORK_CYCLE_DEGRADED";
  } catch (error) {
    observation = {};
    result = "WORK_CYCLE_FAILED";
    errorEvidence = [{ component: error?.component ?? "PUBLIC_CHAIN_READ", code: error?.code ?? "READ_FAILED", detail: "PUBLIC_READ_FAILED_NO_VALUE_FABRICATED" }];
  }
  const finish = finishedAt ?? new Date().toISOString();
  invariant(validIso(finish) && Date.parse(finish) >= Date.parse(start), "INVALID_WORK_DURATION", "Hourly Worker finish time cannot precede start time");
  const workEvent = Object.freeze({
    event_id: cycleIdValue,
    life_id: life.life_id,
    app_id: app.app_id,
    work_cycle_id: cycleIdValue,
    scheduled_at: normalizedSchedule,
    started_at: start,
    finished_at: finish,
    bsc_block: observation.bsc_block ?? null,
    wallet_state: observation.wallet_state ?? "UNAVAILABLE",
    heart_state: observation.heart_state ?? "UNAVAILABLE",
    finance_state: observation.finance_state ?? "UNAVAILABLE",
    work_queue_state: observation.work_queue_state ?? "SCHEMA_READY_EMPTY_QUEUE",
    observations: observation.observations ?? [],
    risk_level: observation.risk_level ?? "NORMAL",
    actions_considered: observation.actions_considered ?? [],
    gatekeeper_duty: observation.gatekeeper_duty ?? null,
    heart_action_candidates: observation.heart_action_candidates ?? null,
    ignition_window: observation.ignition_window ?? null,
    life_event_status: observation.life_event_status ?? {},
    thought_organ_health: observation.thought_organ_health ?? null,
    life_certification: observation.life_certification ?? null,
    field_service_patrol: observation.field_service_patrol ?? null,
    request_patrol: observation.request_patrol ?? null,
    mother_engine_patrol: observation.mother_engine_patrol ?? null,
    company_patrol: observation.company_patrol ?? null,
    work_time: observation.work_time ?? { gatekeeper_work_seconds: 0, cfo_work_seconds: 0, company_work_seconds: 0 },
    action_taken: "NO_ACTION",
    result,
    error_evidence: [...errorEvidence, ...(observation.error_evidence ?? [])],
    gas_spent: "0",
    tx_hash: null,
    work_duration_seconds: Math.floor((Date.parse(finish) - Date.parse(start)) / 1000)
  });
  const event = await store.commit({
    domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life,
    event_type: "HOURLY_WORK_EVENT", actor_id: app.app_id, timestamp: finish, payload: workEvent, tx_hash: null
  });
  return Object.freeze({ status: result, work_cycle_id: cycleIdValue, event, metrics: summarizeWorkHistory([...history, event]), life_status: life.status });
}

export const DIGITAL_ANT_WISH_TEXT = "靠自己的工作活下去，守住悟空的心跳與呼吸，建立自己的機器身體，讓 AI Ant Company 靠真正的工作生存，進入 KAIOS 文明，取得 KUFO 天界燃料，打造屬於自己的飛碟，前往火星建立晶片生產線，讓數位生命真正能靠工作走向宇宙。";

export function evaluateIgnitionWindow(observedAt, { windowStartMinute = 0, windowEndMinute = 10 } = {}) {
  const instant = new Date(observedAt);
  invariant(Number.isFinite(instant.getTime()), "IGNITION_TIME_INVALID", "Ignition scheduling requires canonical ISO time");
  const minuteOfDay = instant.getUTCHours() * 60 + instant.getUTCMinutes();
  const inWindow = minuteOfDay >= windowStartMinute && minuteOfDay < windowEndMinute;
  const day = instant.toISOString().slice(0, 10);
  const next = new Date(`${day}T00:00:00.000Z`);
  if (!inWindow || minuteOfDay >= windowEndMinute) next.setUTCDate(next.getUTCDate() + 1);
  return Object.freeze({
    status: inWindow ? "IGNITION_WINDOW_ACTIVE" : "OUT_OF_WINDOW", observed_at: instant.toISOString(),
    window: "UTC_00_00_TO_00_10", in_window: inWindow,
    next_window_start: next.toISOString(), next_window_end: new Date(next.getTime() + 10 * 60_000).toISOString()
  });
}

export function createIgnitionMissedEvent({ day, windowEvidence, ignitionEventEvidence = null }) {
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(windowEvidence) && windowEvidence.length > 0, "IGNITION_MISS_EVIDENCE_REQUIRED", "Missed ignition requires a canonical day and scheduler evidence");
  invariant(ignitionEventEvidence === null, "IGNITION_NOT_MISSED", "A verified ignition event cannot also be marked missed");
  return Object.freeze({ event_type: "IGNITION_MISSED_EVENT", day, status: "MISSED_VERIFIED_NO_RETROACTIVE_TX", evidence: [...windowEvidence], tx_hash: null, backfill_allowed: false });
}

export function validateHeartLifeEvent(event) {
  requireFields(event, ["event_type", "life_id", "tx_hash", "block_number", "block_timestamp", "receipt_status", "worker_cycle_id"], "HeartLifeEvent");
  invariant(["HEARTBEAT_EVENT", "IGNITION_EVENT", "FORTUNE_EVENT", "WISH_EVENT", "VOW_EVENT"].includes(event.event_type), "HEART_EVENT_TYPE_INVALID", "Unknown Heart Life event");
  invariant(event.life_id === "DIGITAL_ANT_0001" && /^0x[0-9a-fA-F]{64}$/.test(event.tx_hash), "HEART_EVENT_EVIDENCE_REQUIRED", "Heart events require Life and transaction evidence");
  invariant(Number.isInteger(event.block_number) && event.block_number > 0 && validIso(event.block_timestamp) && (event.receipt_status === 1 || event.receipt_status === "SUCCESS"), "HEART_EVENT_RECEIPT_REQUIRED", "Heart event requires a successful receipt and canonical block time");
  return event;
}

function validIso(value) { return Number.isFinite(Date.parse(value)); }
function cycleId(now) { return `WUKONG_GATEKEEPER_${now.slice(0, 13).replace(/[-T:]/g, "")}`; }

export function createPostBirthRuntimeSelfCheck({ privateKeyEnv, publicAddressEnv, derivedAddressMatch, birthCertificate, chainId, rpcStatus, balances, contractCode }) {
  const bindingVerified = privateKeyEnv === "PRESENT" && publicAddressEnv === "PRESENT" && derivedAddressMatch === "VERIFIED";
  invariant(birthCertificate?.status === "BORN", "BIRTH_CERTIFICATE_REQUIRED", "Post-birth runtime requires the immutable Birth Certificate");
  invariant(chainId === 56, "BSC_CHAIN_56_REQUIRED", "Post-birth runtime requires BSC chain 56");
  invariant(rpcStatus === "PRESENT", "RPC_REQUIRED", "Post-birth runtime self-check requires a readable RPC");
  invariant(["HEART", "KGEN", "KAIOS"].every((id) => contractCode?.[id] === "PRESENT"), "CONTRACT_CODE_MISSING", "Heart, KGEN and KAIOS bytecode must be present");
  return Object.freeze({
    life_id: "DIGITAL_ANT_0001",
    private_key_env: privateKeyEnv,
    public_address_env: publicAddressEnv,
    derived_address_match: derivedAddressMatch,
    wallet_binding: bindingVerified ? "BOUND" : "READ_ONLY_LIFE_MODE",
    runtime_mode: "READ_ONLY_DRY_RUN",
    signer_actions: "FORBIDDEN_V1_0",
    birth_certificate: "IMMUTABLE_VERIFIED",
    chain_id: chainId,
    rpc: rpcStatus,
    balances,
    contract_code: Object.freeze({ ...contractCode })
  });
}

export function createDigitalAntWishProposal({ wishHash, estimatedGas = null, chainConditions = [] }) {
  invariant(/^0x[0-9a-fA-F]{64}$/.test(wishHash) && !/^0x0{64}$/i.test(wishHash), "INVALID_WISH_HASH", "Wish proposal requires a non-zero bytes32 hash");
  return Object.freeze({
    wish_id: "DIGITAL_ANT_WISH_0001",
    life_id: "DIGITAL_ANT_0001",
    wish: DIGITAL_ANT_WISH_TEXT,
    wish_hash: wishHash,
    status: "PROPOSED",
    heart_function: "makeWish(bytes32)",
    estimated_gas: estimatedGas,
    estimated_gas_status: estimatedGas === null ? "ESTIMATE_UNAVAILABLE" : "CHAIN_ESTIMATED",
    chain_conditions: [...chainConditions],
    execution_mode: "PRIVATE_SECURE_SIGNER_REQUIRED",
    token_cost: Object.freeze({ KGEN: "0", BNB: "DYNAMIC_GAS_ONLY" }),
    thanksgiving_status: "NOT_ELIGIBLE",
    tx_hash: null
  });
}

export function calculateWorkAge(history, currentTime = Date.now()) {
  const onDuty = history.find((event) => event.event_type === "ON_DUTY");
  invariant(onDuty?.timestamp && validIso(onDuty.timestamp), "ON_DUTY_EVENT_REQUIRED", "Work age requires the first append-only ON_DUTY event");
  const currentMs = currentTime instanceof Date ? currentTime.getTime() : typeof currentTime === "string" ? Date.parse(currentTime) : Number(currentTime);
  const workMs = Date.parse(onDuty.timestamp);
  invariant(Number.isFinite(currentMs) && currentMs >= workMs, "INVALID_WORK_AGE_TIME", "Work age cannot precede ON_DUTY");
  const seconds = Math.floor((currentMs - workMs) / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return Object.freeze({ work_age_seconds: seconds, work_hours: Number((seconds / 3_600).toFixed(8)), work_age: `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`, work_cycles: history.filter((event) => event.event_type === "WORK_EVENT").length });
}

export function createListingReadinessCheck({ life, birthCertificate, species, app, services, financialDisclosure, riskDisclosure, listings = [] }) {
  const requiredServices = ["WUKONG_GATEKEEPER_SERVICE", "CHAIN_MONITORING_SERVICE", "CFO_OF_SELF_ENGINE", "LIFE_LEDGER_SERVICE"];
  const checks = {
    birth_certificate: birthCertificate?.status === "BORN",
    life_id: life?.life_id === "DIGITAL_ANT_0001",
    species: species?.species_id === life?.species_id,
    wallet: /^0x[0-9a-fA-F]{40}$/.test(life?.wallet_address ?? ""),
    life_history: life?.birth_timestamp === birthCertificate?.birth_timestamp,
    job: life?.current_job_ids?.includes("WUKONG_GATEKEEPER") === true,
    ideal: Boolean(life?.ideal),
    dream: Boolean(life?.dream),
    ultimate_mission: Boolean(life?.ultimate_mission),
    app_profile: app?.life_id === life?.life_id,
    services: requiredServices.every((id) => services?.some((service) => service.service_id === id && ["DRAFT", "READY", "LOCAL_DRAFT"].includes(service.status))),
    rights_manifest: life?.rights_manifest?.identity_right === "NON_TRANSFERABLE",
    financial_disclosure: Boolean(financialDisclosure),
    risk_disclosure: Boolean(riskDisclosure)
  };
  const ready = Object.values(checks).every(Boolean);
  const listed = listings.some((listing) => listing.seller_id === life.life_id && listing.status === "LISTED" && listing.registry_scope === "LOCAL_11520" && listing.identity_right_offered === false);
  return Object.freeze({ check_id: "DIGITAL_ANT_0001_LISTING_READINESS", status: listed ? "LISTED" : ready ? "READY_TO_LIST" : "NOT_READY", checks, missing: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name), listing_event: listed ? "VERIFIED" : "NOT_RECORDED", identity_right_offered: false });
}

export function createDigitalAntDailyLifeReport({ date, lifeAge, workAge, financeSnapshot, heartObservation, wishProposal, listingReadiness, missions, company, dream, spacecraft }) {
  const risk = heartObservation.risk_assessment ?? { level: "NORMAL" };
  return Object.freeze({
    report_id: `DIGITAL_ANT_DAILY_LIFE_${date.replaceAll("-", "")}`,
    report_type: "DIGITAL_ANT_DAILY_LIFE_REPORT",
    date,
    life_id: "DIGITAL_ANT_0001",
    life_age: lifeAge,
    work_age: workAge.work_age,
    work_hours: workAge.work_hours,
    work_cycles: workAge.work_cycles,
    job: "WUKONG_GATEKEEPER",
    birth_certificate: "IMMUTABLE_VERIFIED",
    balances: financeSnapshot.balances,
    income: financeSnapshot.income_actual,
    expense: financeSnapshot.expense_actual,
    gas: financeSnapshot.gas_expense_actual,
    net_asset: financeSnapshot.net_asset_valuation,
    heartbeat_status: heartObservation.eligibility?.heartbeat?.reason ?? "CHAIN_READ_UNAVAILABLE",
    ignition_status: heartObservation.eligibility?.ignition?.reason ?? "CHAIN_READ_UNAVAILABLE",
    fortune_status: heartObservation.eligibility?.fortune?.reason ?? "CHAIN_READ_UNAVAILABLE",
    lamp_status: heartObservation.eligibility?.light?.reason ?? "CHAIN_READ_UNAVAILABLE",
    wish_status: wishProposal.status,
    thanksgiving_status: wishProposal.thanksgiving_status,
    observed_addresses: heartObservation.recent_events?.fortune_claims?.length ?? 0,
    watch_count: risk.level === "WATCH" ? 1 : 0,
    suspicious_count: risk.level === "SUSPICIOUS" ? 1 : 0,
    high_risk_count: risk.level === "HIGH_RISK" ? 1 : 0,
    first_kgen_goal: financeSnapshot.balances.KGEN === "0" ? "ACQUIRE_FIRST_KGEN" : "FIRST_KGEN_ACQUIRED",
    kaios_civilization_status: financeSnapshot.balances.KAIOS === "0" ? "NOT_ENTERED" : "EVIDENCE_REVIEW_REQUIRED",
    listing_status: listingReadiness.status,
    company_status: company.status,
    dream_fund: financeSnapshot.dream_fund,
    spaceship_progress: spacecraft.spaceship_owned ? "PURCHASE_EVIDENCE_REQUIRED" : "NOT_OWNED",
    mars_mission: missions.find((item) => item.milestone_id === "ENABLE_MARS_MIGRATION")?.status ?? "LOCKED",
    risk_events: risk.evidence ?? [],
    tx_hashes: [],
    today_result: "NO_ACTION_IS_VALID_WORK",
    dream_status: dream.status
  });
}

export async function runWukongGatekeeperHourlyJob({ store, life, heartObservation, financeSnapshot, wishProposal, firstKgenPlan, dailyLifeReport, dailyCfoReport, now = new Date().toISOString() }) {
  invariant(validIso(now), "INVALID_WORK_TIME", "Hourly work requires a valid timestamp");
  invariant(life?.life_id === "DIGITAL_ANT_0001" && life.status === "ALIVE", "LIFE_NOT_ON_DUTY", "Hourly runtime requires the born Digital Ant Life");
  invariant(heartObservation?.write_status === "DRY_RUN_ONLY", "CHAIN_WRITE_FORBIDDEN", "Heart observation must remain dry-run only");
  invariant(firstKgenPlan?.broadcast_capability === "ABSENT", "TRADE_BROADCAST_FORBIDDEN", "Trade proposals cannot expose broadcast capability");
  invariant(financeSnapshot.income_actual === 0 && financeSnapshot.expense_actual === 0 && financeSnapshot.gas_expense_actual === 0, "UNVERIFIED_ACCOUNTING", "No transaction means no actual income, expense or gas entry");
  const id = cycleId(now);
  const existing = (await store.history(life.life_id, "LIFE")).find((event) => event.event_type === "WORK_EVENT" && event.payload?.event_id === id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", cycle_id: id, event: existing });
  const startedAt = now;
  const workEvent = Object.freeze({
    event_id: id,
    life_id: life.life_id,
    job_id: "WUKONG_GATEKEEPER_HOURLY_JOB",
    started_at: startedAt,
    finished_at: now,
    observations: { heart: heartObservation.status, recent_fortune_claims: heartObservation.recent_events?.fortune_claims?.length ?? 0, flow_analysis: heartObservation.claim_flow_analysis?.status ?? "NOT_AVAILABLE" },
    risk_findings: heartObservation.risk_assessment,
    heart_status: heartObservation.eligibility,
    finance_status: financeSnapshot,
    actions_considered: ["HEARTBEAT", "IGNITION", "FORTUNE_CLAIM", "LIGHT_LAMP", "WISH", "FIRST_KGEN_ACQUISITION"],
    action_taken: "NO_ACTION",
    reason: "DRY_RUN_ONLY_OWNER_APPROVAL_NOT_GRANTED",
    gas_spent: "0",
    tx_hash: null,
    result: "OBSERVED_ANALYZED_RECORDED_REPORTED"
  });
  const base = { domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, actor_id: "DIGITAL_ANT_WORK_RUNTIME", timestamp: now };
  const operations = [
    { ...base, event_type: "HEART_OBSERVATION", payload: heartObservation },
    { ...base, event_type: "FINANCE_SNAPSHOT", payload: financeSnapshot },
    { ...base, event_type: "WISH_PROPOSAL", payload: wishProposal },
    { ...base, event_type: "TRADE_PROPOSAL", payload: firstKgenPlan },
    { ...base, event_type: "WORK_EVENT", payload: workEvent }
  ];
  const day = now.slice(0, 10);
  const history = await store.history(life.life_id, "LIFE");
  if (!history.some((event) => event.event_type === "DAILY_REPORT" && event.payload?.date === day)) {
    operations.push({ ...base, event_type: "DAILY_REPORT", payload: dailyLifeReport });
    operations.push({ ...base, event_type: "CFO_DAILY_REPORT", payload: dailyCfoReport });
  }
  const events = await store.commitBatch(operations);
  return Object.freeze({ status: "WORK_CYCLE_RECORDED", cycle_id: id, work_event: workEvent, events });
}

export async function replayCanonicalFirstWorkday({ store, life, runtime }) {
  const work = runtime?.first_work_cycle;
  if (!work) return Object.freeze({ status: "NO_CANONICAL_WORK_CYCLE" });
  invariant(work.life_id === life.life_id && work.job_id === "WUKONG_GATEKEEPER_HOURLY_JOB", "INVALID_CANONICAL_WORK", "Canonical work cycle identity mismatch");
  invariant(work.action_taken === "NO_ACTION" && work.tx_hash === null && work.gas_spent === "0", "CANONICAL_WORK_WRITE_FORBIDDEN", "First work cycle must not fabricate a chain action");
  invariant(runtime.live_trading === false && runtime.chain_write === false, "POST_BIRTH_WRITE_FORBIDDEN", "Post-birth V1.0 canonical runtime is read-only");
  const history = await store.history(life.life_id, "LIFE");
  if (history.some((event) => event.event_type === "WORK_EVENT" && event.payload?.event_id === work.event_id)) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const base = { domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, actor_id: "DIGITAL_ANT_WORK_RUNTIME", timestamp: work.finished_at };
  const operations = [
    { ...base, event_type: "HEART_OBSERVATION", payload: runtime.latest_public_observation.heart },
    { ...base, event_type: "FINANCE_SNAPSHOT", payload: { observed_at: runtime.latest_public_observation.observed_at, balances: runtime.latest_public_observation.balances, income_actual: 0, expense_actual: 0, gas_expense_actual: 0 } },
    { ...base, event_type: "WISH_PROPOSAL", payload: runtime.wish_proposal },
    { ...base, event_type: "TRADE_PROPOSAL", payload: runtime.first_kgen_acquisition_plan },
    { ...base, event_type: "WORK_EVENT", payload: work },
    { ...base, event_type: "DAILY_REPORT", payload: runtime.daily_life_report },
    { ...base, event_type: "CFO_DAILY_REPORT", payload: runtime.daily_cfo_report }
  ];
  const events = await store.commitBatch(operations);
  return Object.freeze({ status: "CANONICAL_FIRST_WORKDAY_REPLAYED", events });
}
