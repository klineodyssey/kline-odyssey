import { requireFields, requireId } from "../shared/schema.mjs";
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
  scheduler_status: "CONFIGURED_LOCAL_NOT_ACTIVE",
  scheduler_class: "PUBLIC_READ_ONLY_SCHEDULER",
  cycle: Object.freeze(["BOOT", "VERIFY_LIFE", "VERIFY_WALLET", "READ_BSC", "12345_GATEKEEPER", "CFO_CHECK", "WORK_QUEUE_CHECK", "MISSION_CHECK", "NO_ACTION_OR_ACTION_PLAN", "WRITE_LIFE_HISTORY", "DAILY_REPORT_CHECK", "SLEEP"]),
  chain_write: false,
  signer_action: false
});

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
    if (unavailable || observation.indexer_status === "INDEXER_REQUIRED") result = "WORK_CYCLE_DEGRADED";
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

export const DIGITAL_ANT_WISH_TEXT = "靠自己的工作活下去，累積自己的資產，有一天靠自己離開五指山。";

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
    execution_mode: "DRY_RUN_ONLY",
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
