import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createUniverseRuntime } from "../registry/universe-runtime.mjs";
import { advanceTempleMonitoringIncident, assertCompanyWorkAllowedAfterGatekeeper, classifyTempleMonitoringError, createTempleMonitoringFailure, deriveWorkerHealth, evaluateIgnitionWindow, normalizeHeartActionStatus, runDigitalAntHourlyCycle, validateGatekeeperDutyStatus, validateSharedWorkerStatus, DIGITAL_ANT_WISH_TEXT } from "./index.mjs";
import { readTempleHeart12345 } from "../integrations/temple-heart-12345.mjs";
import { createHeartActionCandidate } from "../security/life-security.mjs";
import { assertThoughtOrganReadyForPlanning, createAiLifeCertification, verifyThoughtOrganHealth } from "../life/index.mjs";
import { createFieldServiceDemandScan, createFirstKaiosStrategy, createMotherEngineNextBestAction } from "../company/index.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../ethers-5.7.2.umd.min.js");
const KGEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
const KAIOS = "0xD4E67B3a69e41524c424150E6b6e921b01D036db";
const PUBLIC_BSC_RPC = "https://bsc-rpc.publicnode.com";
const PUBLIC_BSC_RPC_FALLBACKS = Object.freeze(["https://bsc-dataseed1.defibit.io/", "https://bsc-dataseed1.ninicoin.io/"]);
const ERC20_READ_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
const FIRST_HEARTBEAT_KGEN_EVIDENCE = new URL("../../K線西遊記/temples/11520/runtime/life-events/DIGITAL_ANT_0001_FIRST_HEARTBEAT_AND_KGEN_V3_6.json", import.meta.url);
const PHYSICS_CURRENT = new URL("../../docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md", import.meta.url);

export function createPublicReadProvider({ rpcUrl = process.env.BSC_RPC_URL || PUBLIC_BSC_RPC, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw statusError("FETCH_TRANSPORT_UNAVAILABLE", "BSC_RPC");
  let requestId = 0;
  const attemptTelemetry = [];
  const transport = {
    async request({ method, params = [] }) {
      const primary = rpcUrl || PUBLIC_BSC_RPC;
      const urls = [...new Set([primary, PUBLIC_BSC_RPC, ...PUBLIC_BSC_RPC_FALLBACKS])];
      let lastError = null;
      const requestAttempts = [];
      for (const [index, url] of urls.entries()) {
        const target = index === 0 ? "PRIMARY_READ_ONLY_BSC_RPC" : `APPROVED_READ_ONLY_BSC_RPC_FALLBACK_${index}`;
        try {
          const response = await fetchImpl(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }) });
          if (!response.ok) throw statusError(`BSC_RPC_HTTP_${response.status}`, "BSC_RPC");
          const payload = await response.json();
          if (payload.error) throw statusError(`BSC_RPC_${payload.error.code ?? "ERROR"}`, "BSC_RPC");
          const evidence = Object.freeze({ target, method, result: "VERIFIED" });
          requestAttempts.push(evidence); attemptTelemetry.push(evidence);
          return payload.result;
        } catch (error) {
          lastError = error;
          const evidence = Object.freeze({ target, method, result: "FAILED", code: error?.code ?? "READ_FAILED" });
          requestAttempts.push(evidence); attemptTelemetry.push(evidence);
        }
      }
      const failure = lastError ?? statusError("BSC_RPC_UNREACHABLE", "BSC_RPC");
      failure.read_only_attempt_telemetry = Object.freeze(requestAttempts);
      failure.fallback_result = "FAILED";
      throw failure;
    }
  };
  const provider = new ethers.providers.Web3Provider(transport, { name: "bnb", chainId: 56 });
  Object.defineProperty(provider, "readOnlyAttemptTelemetry", { value: attemptTelemetry, enumerable: true });
  return provider;
}

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : null;
}

function statusError(code, component) {
  const error = new Error(code);
  error.code = code;
  error.component = component;
  return error;
}

async function readJsonIfPresent(path) {
  if (!path) return null;
  try { return JSON.parse(await readFile(path, "utf8")); } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(path, value, { exclusive = false } = {}) {
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: exclusive ? "wx" : "w" });
}

export async function readPublicRequestPatrol({ repository = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN, fetchImpl = globalThis.fetch } = {}) {
  if (!repository || typeof fetchImpl !== "function") return Object.freeze({ status: "SHARED_REQUEST_SOURCE_UNAVAILABLE", source: "GITHUB_ISSUES", real_requests: 0, open_requests: 0, latest_request: null, evidence: [] });
  let response;
  try {
    response = await fetchImpl(`https://api.github.com/repos/${repository}/issues?state=all&per_page=100`, {
      headers: { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}), "X-GitHub-Api-Version": "2022-11-28" }
    });
  } catch {
    return Object.freeze({ status: "SHARED_REQUEST_SOURCE_UNAVAILABLE", source: "GITHUB_ISSUES", real_requests: 0, open_requests: 0, latest_request: null, evidence: ["NETWORK_UNAVAILABLE_NO_REQUEST_INFERRED"] });
  }
  if (!response.ok) return Object.freeze({ status: "SHARED_REQUEST_SOURCE_UNAVAILABLE", source: "GITHUB_ISSUES", real_requests: 0, open_requests: 0, latest_request: null, evidence: [`HTTP_${response.status}`] });
  const issues = (await response.json()).filter((issue) => !issue.pull_request && issue.user?.login && /^\[11520 Request\]/i.test(issue.title) && /- \[[xX]\] This is a real request/i.test(issue.body ?? ""));
  const sorted = issues.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return Object.freeze({
    status: "SHARED_REQUEST_SOURCE_VERIFIED", source: "GITHUB_ISSUES_AUTHENTICATED_IDENTITY", real_requests: issues.length,
    open_requests: issues.filter((issue) => issue.state === "open").length,
    latest_request: sorted[0] ? { request_ref: `GH_ISSUE_${sorted[0].number}`, created_at: sorted[0].created_at, state: sorted[0].state, requester: sorted[0].user?.login ?? "GITHUB_IDENTITY_UNAVAILABLE" } : null,
    evidence: issues.map((issue) => `GH_ISSUE_${issue.number}`)
  });
}

export async function inspectPhysicsThoughtOrgan({ seed, readFileImpl = readFile, checkedAt = new Date().toISOString() } = {}) {
  const binding = seed?.next_stage?.thought_organ_binding_v3_8 ?? seed?.lives?.find((life) => life.life_id === "DIGITAL_ANT_0001")?.thought_organs?.[0];
  let bytes = null;
  let text = "";
  try {
    bytes = await readFileImpl(PHYSICS_CURRENT);
    text = bytes.toString("utf8");
  } catch {}
  const versionMatch = text.match(/^VERSION:\s*CURRENT\s*\/\s*(V3\.8[^\\\r\n]*)/m);
  const documentMatch = text.match(/^DOC_ID:\s*([^\\\r\n]+)/m);
  const observation = Object.freeze({
    document_id: documentMatch?.[1]?.trim() ?? null,
    version: versionMatch?.[1]?.trim() ?? null,
    path: "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
    sha256: bytes ? createHash("sha256").update(text.replace(/\r\n/g, "\n"), "utf8").digest("hex") : null,
    exists: Boolean(bytes), readable: Boolean(bytes), runtime_authority: "CURRENT", checked_at: checkedAt
  });
  const health = verifyThoughtOrganHealth(binding, observation);
  return Object.freeze({ binding, observation, health });
}

export function readCompanyPatrol(seed) {
  const stage = seed?.next_stage ?? {};
  const queues = stage.company_queues ?? {};
  return Object.freeze({
    status: "COMPANY_PATROL_COMPLETED", company_id: "AI_ANT_COMPANY_0001",
    company_status: seed.companies?.find((company) => company.company_id === "AI_ANT_COMPANY_0001")?.status ?? "UNAVAILABLE",
    customer_inbox: stage.customer_request_engine?.customer_count ?? 0,
    request_queue: queues.CUSTOMER_REQUEST_INBOX?.length ?? 0, quote_queue: queues.QUOTE_QUEUE?.length ?? 0,
    work_queue: stage.work_queue?.items?.length ?? 0,
    treasury_status: stage.company_treasury?.status ?? "PLAN_READY_NOT_BOUND",
    mission: stage.company_mission_graph?.strategic_goal ?? "GET_FIRST_REAL_CUSTOMER"
  });
}

export function readFieldServicePatrol(seed) {
  const field = seed?.next_stage?.field_service_business_v3_9 ?? {};
  const scan = createFieldServiceDemandScan({
    nodes: field.verified_nodes ?? [],
    atms: field.observed_atms ?? [],
    wastes: field.observed_waste_inventory ?? [],
    cargoRequests: field.observed_cargo_requests ?? []
  });
  return Object.freeze({
    ...scan,
    primary_job_gate: "GATEKEEPER_DUTY_COMPLETED_BEFORE_CFO_SCAN",
    route_authority: field.route_authority ?? "EXISTING_K280_LAND_AND_UNIVERSE_MAP_ONLY",
    cash_ledger_separation: field.kaios_cash_law ?? { ledger_transfer_is_cash_delivery: false },
    authority: "READ_SCAN_CALCULATE_PLAN_QUOTE_DRAFT_ONLY",
    settlement: false,
    chain_write: false
  });
}

export function readMotherEnginePatrol(seed, { gatekeeperDuty, finance, thoughtOrganHealth, fieldServicePatrol = null }) {
  assertCompanyWorkAllowedAfterGatekeeper(gatekeeperDuty);
  assertThoughtOrganReadyForPlanning(thoughtOrganHealth);
  const stage = seed?.next_stage ?? {};
  const firstKgen = stage.first_heartbeat_kgen_event ?? {};
  const product = stage.divine_product_priority ?? {};
  const supplyChain = stage.demand_first_supply_chain ?? {};
  const firstKaiosStrategy = createFirstKaiosStrategy({
    availableServices: ["KGEN_CHAIN_MONITOR", "CHAIN_MONITORING", "LIFE_LEDGER", "CFO_REPORT"],
    customerDemand: stage.customer_request_engine?.customer_count ?? 0,
    publicCivilizationDemand: [],
    authority: "READ_ANALYZE_PLAN_PROPOSE_ONLY",
    paymentReadiness: "PAYMENT_INFRASTRUCTURE_PENDING",
    treasuryReadiness: stage.company_treasury?.status ?? "PLAN_READY_NOT_BOUND",
    technicalReadiness: "KGEN_CHAIN_MONITOR_READ_ONLY_READY",
    estimatedWork: "SERVICE_PACKAGE_AND_VERIFIED_REQUEST_SCAN",
    risk: "LOW_ASSET_RISK_READ_ONLY",
    settlementFeasibility: "NOT_AUTHORIZED_RECEIVABLE_ONLY"
  });
  const privateSchedulerActive = String(stage.persistent_private_scheduler_v3_8?.status ?? "").startsWith("INSTALLED_");
  const candidates = [
    ...(!privateSchedulerActive ? [{ problem: "NO_PERSISTENT_PRIVATE_SECURE_SCHEDULER", priority: 0, action: "CONNECT_PRIVATE_HEART_AUTOPILOT_WITH_SECRET_MANAGER", reason: "Heartbeat action candidates cannot be signed by the public Worker", required_authority: "PRIVATE_RUNTIME_INSTALLATION", expected_result: "ELIGIBILITY_DRIVEN_RECEIPT_GATED_HEARTBEAT" }] : []),
    { problem: "FIRST_KAIOS_NOT_OCCURRED", priority: 1, action: fieldServicePatrol?.status === "NO_VERIFIED_FIELD_JOB_AVAILABLE" ? "SCAN_VERIFIED_FIELD_AND_DIGITAL_SERVICE_DEMAND" : firstKaiosStrategy.next_kaios_earning_action, reason: "The next lawful economic milestone requires real demand and evidenced compensation", required_authority: "READ_ONLY_RESEARCH_AND_EXTERNAL_REQUEST_EVIDENCE", expected_result: "VERIFIED_KAIOS_EARNING_OPPORTUNITY_NOT_FAKE_REVENUE" },
    { problem: "NO_REAL_CUSTOMER", priority: 3, action: "SCAN_REAL_CIVILIZATION_REQUESTS", reason: "First lawful KAIOS path requires real demand", required_authority: "READ_ONLY", expected_result: "EVIDENCED_LEAD_OR_REQUEST" },
    { problem: "UFO_NOT_DESIGNED", priority: 6, action: "RESEARCH_UFO_REQUIREMENTS_AFTER_PRIMARY_DUTY", reason: "Demand-first law requires requirements before design", required_authority: "READ_ONLY", expected_result: "UFO_REQUIREMENTS_DRAFT" }
  ];
  const nextBestAction = createMotherEngineNextBestAction({
    observations: [
      `PRIMARY_JOB_${gatekeeperDuty.status}`,
      `KGEN_${finance.KGEN}`,
      `KAIOS_${finance.KAIOS}`,
      `CUSTOMERS_${stage.customer_request_engine?.customer_count ?? 0}`,
      `TREASURY_${stage.company_treasury?.status ?? "NOT_BOUND"}`
    ],
    candidates
  });
  return Object.freeze({
    status: "MOTHER_ENGINE_PATROL_COMPLETED_READ_ONLY",
    questions: Object.freeze({
      primary_job_completed: ["COMPLETED", "DEGRADED"].includes(gatekeeperDuty.status) && gatekeeperDuty.degradation_affects_safety === false,
      life_missing: product.top_product ?? "EVIDENCE_REQUIRED",
      worst_blocker: stage.mother_engine_problem_solver?.proposals?.find((proposal) => !String(proposal.status).startsWith("RESOLVED"))?.problem ?? "NO_OPEN_CRITICAL_BLOCKER",
      civilization_product_need: product.top_product ?? "NOT_SELECTED",
      first_income_path: "GET_FIRST_REAL_CUSTOMER",
      dark_matter_preserved: Number(finance.BNB) > 0,
      kgen_energy: finance.KGEN,
      next_mission_evidence: firstKgen.status?.startsWith("COMPLETED_") ? "ANT_MECH_REQUIREMENTS_AND_REAL_CUSTOMER" : "FIRST_KGEN_EVENT"
    }),
    thought_organ: thoughtOrganHealth,
    first_kaios_strategy: firstKaiosStrategy,
    field_service: fieldServicePatrol,
    proposals: stage.mother_engine_problem_solver?.proposals ?? [],
    next_best_action: nextBestAction,
    proactive_problem_discovery: "OBSERVE_DETECT_DIAGNOSE_PRIORITIZE_PROPOSE_EXECUTE_IF_AUTHORIZED_VERIFY",
    demand_first_laws: supplyChain.forbidden ?? [],
    selected_product: product.top_product ?? null,
    authority: "READ_ANALYZE_PLAN_PROPOSE_ONLY",
    chain_write: false,
    customer_created: false,
    revenue_created: "0"
  });
}

function heartPatrol(heart) {
  const available = heart.status === "CHAIN_READ_VERIFIED";
  const eligibility = heart.eligibility ?? {};
  const coreIndexerStatus = heart.recent_events?.status ?? "CORE_HEART_INDEXER_UNAVAILABLE";
  return Object.freeze({
    status: available ? "12345_PATROL_COMPLETED" : "12345_PATROL_UNAVAILABLE", source: "REPOSITORY_ABI_PUBLIC_CHAIN_READ", eligibility_source: "CLIENT_DERIVED",
    heartbeat: normalizeHeartActionStatus(eligibility.heartbeat, { available }), fortune: normalizeHeartActionStatus(eligibility.fortune, { available }),
    ignition: normalizeHeartActionStatus(eligibility.ignition, { available }), lamp: normalizeHeartActionStatus(eligibility.light, { available }),
    wish: normalizeHeartActionStatus(eligibility.wish, { available }),
    thanksgiving: Object.freeze({ status: available ? "NOT_ELIGIBLE" : "UNAVAILABLE", reason: "VOW_POLICY_AND_COMPLETION_EVIDENCE_REQUIRED", eligibility_source: "CLIENT_DERIVED", write_status: "WRITE_NOT_CONNECTED" }),
    recent_events: heart.recent_events ?? { status: "CORE_HEART_INDEXER_UNAVAILABLE" },
    core_heart_indexer: coreIndexerStatus,
    advanced_graph_indexer: heart.claim_flow_analysis?.status ?? "ADVANCED_GRAPH_INDEXER_REQUIRED",
    flow_analysis: heart.claim_flow_analysis ?? { status: "ADVANCED_GRAPH_INDEXER_REQUIRED", affects_core_gatekeeper_health: false }
  });
}

function createGatekeeperDuty({ startedAt, finishedAt, heart, patrol, monitoringFailed = false }) {
  const coreStatus = patrol.core_heart_indexer;
  const heartAvailable = heart.status === "CHAIN_READ_VERIFIED";
  const monitoringVerified = heartAvailable && coreStatus === "CORE_HEART_INDEXER_HEALTHY" && monitoringFailed === false;
  const status = monitoringVerified ? "COMPLETED" : "DEGRADED";
  return Object.freeze(validateGatekeeperDutyStatus({
    status, gatekeeper_started_at: startedAt, gatekeeper_finished_at: finishedAt,
    heart_block: heart.block_number ?? null, heart_status: heartAvailable ? "AVAILABLE" : "UNAVAILABLE",
    fortune_status: patrol.fortune.status, heartbeat_status: patrol.heartbeat.status, ignition_status: patrol.ignition.status,
    lamp_status: patrol.lamp.status, wish_status: patrol.wish.status, vow_status: patrol.thanksgiving.status,
    claim_monitor_status: coreStatus, risk_status: monitoringVerified ? heart.risk_assessment?.level ?? "NORMAL" : "UNKNOWN",
    monitoring_status: monitoringVerified ? "VERIFIED" : "MONITORING_FAILED",
    degradation_affects_safety: !monitoringVerified, advanced_graph_status: patrol.advanced_graph_indexer,
    evidence: heartAvailable ? [`HEART_BLOCK_${heart.block_number}`, "HEART_BYTECODE_VERIFIED", coreStatus] : [heart.reason ?? "CHAIN_READ_UNAVAILABLE"]
  }));
}

function createLifeEventStatus({ wallet, finance, recentEvents, verifiedFirstEvents = null }) {
  const owns = (event) => String(event.wallet ?? "").toLowerCase() === String(wallet).toLowerCase();
  const observed = {
    FIRST_HEARTBEAT_EVENT: recentEvents?.heartbeat_claims?.some(owns) === true,
    FIRST_FORTUNE_EVENT: recentEvents?.fortune_claims?.some(owns) === true,
    FIRST_IGNITION_EVENT: recentEvents?.ignitions?.some(owns) === true,
    FIRST_LAMP_EVENT: recentEvents?.lamps?.some(owns) === true,
    FIRST_WISH_EVENT: recentEvents?.wishes?.some(owns) === true,
    FIRST_VOW_EVENT: recentEvents?.vows?.some(owns) === true
  };
  return Object.freeze({
    ...Object.fromEntries(Object.entries(observed).map(([event, seen]) => [event, verifiedFirstEvents?.[event] ? "VERIFIED" : seen ? "EVIDENCE_CANDIDATE_RECEIPT_VERIFICATION_REQUIRED" : "NOT_OCCURRED_IN_OBSERVED_WINDOW"])),
    FIRST_THANKSGIVING_EVENT: "NOT_OCCURRED",
    FIRST_KGEN_EVENT: verifiedFirstEvents?.FIRST_KGEN_EVENT ? "VERIFIED" : Number(finance.KGEN) > 0 ? "EVIDENCE_RESOLUTION_REQUIRED" : "NOT_OCCURRED",
    FIRST_KAIOS_EVENT: Number(finance.KAIOS) > 0 ? "EVIDENCE_RESOLUTION_REQUIRED" : "NOT_OCCURRED",
    FIRST_KUFO_EVENT: "NOT_OCCURRED", FIRST_KSHIP_EVENT: "NOT_OCCURRED"
  });
}

export async function publicReadCycle({ life, seed, verifiedFirstEvents = null }) {
  const thoughtOrgan = await inspectPhysicsThoughtOrgan({ seed });
  const provider = createPublicReadProvider();
  const chainId = await provider.send("eth_chainId", []);
  if (Number(BigInt(chainId)) !== 56) throw statusError("BSC_CHAIN_56_REQUIRED", "BSC_RPC");
  const kgen = new ethers.Contract(KGEN, ERC20_READ_ABI, provider);
  const kaios = new ethers.Contract(KAIOS, ERC20_READ_ABI, provider);
  const lifeStarted = Date.now();
  const [block, bnb, kgenRaw, kgenDecimals, kaiosRaw, kaiosDecimals] = await Promise.all([
    provider.getBlock("latest"), provider.getBalance(life.wallet_address), kgen.balanceOf(life.wallet_address), kgen.decimals(), kaios.balanceOf(life.wallet_address), kaios.decimals()
  ]);
  const gatekeeperStarted = new Date().toISOString();
  const gatekeeperClock = Date.now();
  const heart = await readTempleHeart12345({ ethers, provider, walletAddress: life.wallet_address, wishText: DIGITAL_ANT_WISH_TEXT, recentBlockWindow: 100 });
  const walletBinding = seed.life_security?.DIGITAL_ANT_0001?.profile?.wallet_binding_history?.find((binding) => binding.status === "ACTIVE" && String(binding.wallet ?? "").toLowerCase() === String(life.wallet_address ?? "").toLowerCase());
  const monitoringFailures = [];
  const observedAt = new Date().toISOString();
  if (!/^0x[0-9a-fA-F]{40}$/.test(life.wallet_address ?? "") || !walletBinding) monitoringFailures.push({ condition: "WALLET_BINDING_UNVERIFIED", occurred_at: observedAt, source: "DIGITAL_ANT_PUBLIC_WALLET_READ_PATH", fallback: { attempted: false, strategy: "VERIFY_GATEKEEPER_RUNTIME", result: "FAILED", evidence: ["PUBLIC_ADDRESS_OR_ACTIVE_BINDING_MISSING"] } });
  if (heart.status !== "CHAIN_READ_VERIFIED") {
    const heartCondition = heart.reason === "HEART_BYTECODE_NOT_FOUND" ? "HEART_BYTECODE_MISSING" : ["RPC_NOT_CONFIGURED", "BSC_CHAIN_56_REQUIRED", "RPC_OR_CONTRACT_CALL_FAILED"].includes(heart.reason) ? "HEART_UNAVAILABLE" : "HEART_UNAVAILABLE";
    monitoringFailures.push({ condition: heartCondition, occurred_at: observedAt, source: `TEMPLE_HEART_12345:${heart.reason ?? "CHAIN_READ_UNAVAILABLE"}`, fallback: { attempted: false, strategy: "VERIFY_HEART_READ_PATH", result: "FAILED", evidence: [heart.reason ?? "CHAIN_READ_UNAVAILABLE"] } });
  } else {
    if (heart.contract_code_verified !== true) monitoringFailures.push({ condition: "HEART_BYTECODE_MISSING", occurred_at: observedAt, source: "TEMPLE_HEART_12345:BYTECODE", fallback: { attempted: false, strategy: "VERIFY_HEART_READ_PATH", result: "FAILED", evidence: ["HEART_BYTECODE_NOT_VERIFIED"] } });
    if (!heart.account || !heart.eligibility || !Number.isFinite(Number(heart.heartbeat?.cooldown_seconds)) || !Number.isFinite(Number(heart.fortune?.cooldown_seconds))) monitoringFailures.push({ condition: "COOLDOWN_STATE_UNVERIFIABLE", occurred_at: observedAt, source: "TEMPLE_HEART_12345:COOLDOWN_READ_PATH", fallback: { attempted: false, strategy: "VERIFY_GATEKEEPER_RUNTIME", result: "FAILED", evidence: ["ACCOUNT_OR_COOLDOWN_EVIDENCE_MISSING"] } });
    if (heart.recent_events?.status !== "CORE_HEART_INDEXER_HEALTHY") monitoringFailures.push({ condition: "TEMPLE_RUNTIME_UNAVAILABLE", occurred_at: observedAt, source: "TEMPLE_HEART_12345:PATROL_DATA", fallback: { attempted: false, strategy: "VERIFY_GATEKEEPER_RUNTIME", result: "FAILED", evidence: [heart.recent_events?.status ?? "CORE_HEART_INDEXER_UNAVAILABLE"] } });
  }
  const patrol = heartPatrol(heart);
  const ignitionWindow = evaluateIgnitionWindow(new Date().toISOString());
  const actionCandidates = heart.status === "CHAIN_READ_VERIFIED" ? Object.freeze({
    heartbeat: createHeartActionCandidate({ action: "heartbeatClaim", eligibility: heart.eligibility?.heartbeat?.eligible === true, block: heart.block_number, observedAt: heart.observed_at, evidence: [`HEART_BLOCK_${heart.block_number}`, heart.eligibility?.heartbeat?.reason ?? "ELIGIBILITY_READ"] }),
    ignition: createHeartActionCandidate({ action: "igniteAndClaim", eligibility: ignitionWindow.in_window && heart.eligibility?.ignition?.eligible === true, block: heart.block_number, observedAt: heart.observed_at, evidence: [`HEART_BLOCK_${heart.block_number}`, ignitionWindow.status, heart.eligibility?.ignition?.reason ?? "ELIGIBILITY_READ"] }),
    fortune: createHeartActionCandidate({ action: "fortuneClaim", eligibility: heart.eligibility?.fortune?.eligible === true, block: heart.block_number, observedAt: heart.observed_at, evidence: [`HEART_BLOCK_${heart.block_number}`, heart.eligibility?.fortune?.reason ?? "ELIGIBILITY_READ"] }),
    wish: createHeartActionCandidate({ action: "makeWish", eligibility: heart.eligibility?.wish?.eligible === true && seed.next_stage?.gatekeeper_runtime?.life_events?.FIRST_WISH_EVENT !== "VERIFIED", block: heart.block_number, observedAt: heart.observed_at, evidence: [`HEART_BLOCK_${heart.block_number}`, seed.next_stage?.gatekeeper_runtime?.life_events?.FIRST_WISH_EVENT === "VERIFIED" ? "FIRST_WISH_ALREADY_COMPLETED" : heart.eligibility?.wish?.reason ?? "ELIGIBILITY_READ"] })
  }) : Object.freeze({ status: "UNAVAILABLE_NO_CHAIN_EVIDENCE" });
  const gatekeeperFinished = new Date().toISOString();
  const gatekeeperDuty = createGatekeeperDuty({ startedAt: gatekeeperStarted, finishedAt: gatekeeperFinished, heart, patrol, monitoringFailed: monitoringFailures.length > 0 });
  const gatekeeperWorkSeconds = Number(((Date.now() - gatekeeperClock) / 1000).toFixed(3));
  const cfoClock = Date.now();
  const finance = { BNB: ethers.utils.formatEther(bnb), KGEN: ethers.utils.formatUnits(kgenRaw, Number(kgenDecimals)), KAIOS: ethers.utils.formatUnits(kaiosRaw, Number(kaiosDecimals)), actual_income: "0", actual_expense: "0", actual_gas: "0" };
  const cfoWorkSeconds = Number(((Date.now() - cfoClock) / 1000).toFixed(3));
  let requestPatrol = { status: "SKIPPED_DUE_TO_GATEKEEPER_FAILURE", real_requests: 0, open_requests: 0, latest_request: null, evidence: [] };
  let companyPatrol = { status: "SKIPPED_DUE_TO_GATEKEEPER_FAILURE", company_id: "AI_ANT_COMPANY_0001", work_queue: 0 };
  let motherEnginePatrol = { status: "SKIPPED_DUE_TO_GATEKEEPER_FAILURE", chain_write: false };
  let fieldServicePatrol = { status: "SKIPPED_DUE_TO_GATEKEEPER_FAILURE", real_field_jobs: 0, candidate_jobs: [] };
  let companyWorkSeconds = 0;
  if (["COMPLETED", "DEGRADED"].includes(gatekeeperDuty.status) && gatekeeperDuty.degradation_affects_safety === false) {
    assertCompanyWorkAllowedAfterGatekeeper(gatekeeperDuty);
    const companyClock = Date.now();
    fieldServicePatrol = readFieldServicePatrol(seed);
    motherEnginePatrol = readMotherEnginePatrol(seed, { gatekeeperDuty, finance, thoughtOrganHealth: thoughtOrgan.health, fieldServicePatrol });
    requestPatrol = await readPublicRequestPatrol();
    companyPatrol = Object.freeze({ ...readCompanyPatrol(seed), mother_engine: motherEnginePatrol });
    companyWorkSeconds = Number(((Date.now() - companyClock) / 1000).toFixed(3));
  }
  const lifeEvents = createLifeEventStatus({ wallet: life.wallet_address, finance, recentEvents: heart.recent_events, verifiedFirstEvents });
  const app = seed.apps?.find((item) => item.app_id === "DIGITAL_ANT_APP_0001");
  const certification = createAiLifeCertification({
    life, birthCertificate: seed.birth_certificates?.find((certificate) => certificate.life_id === life.life_id), walletBinding,
    workHistory: [seed.next_stage?.worker?.first_scheduled_cycle].filter(Boolean),
    mission: Array.isArray(seed.missions) ? seed.missions.find((mission) => mission.life_id === life.life_id) : seed.missions?.[life.life_id], dream: seed.dreams?.find((dream) => dream.life_id === life.life_id),
    thoughtOrganHealth: thoughtOrgan.health, app, permissions: app?.permissions,
    evidence: [thoughtOrgan.binding.sha256, `HEART_BLOCK_${heart.block_number}`, seed.next_stage?.worker?.shared_evidence].filter(Boolean), secretSafe: true
  });
  const coreHealthy = gatekeeperDuty.status === "COMPLETED";
  const monitoringRecoveryEvidence = monitoringFailures.length === 0 ? Object.freeze({
    rpc: Object.freeze({ status: "VERIFIED", chain_id: 56, fallback_attempt_telemetry: Object.freeze([...provider.readOnlyAttemptTelemetry]), evidence: Object.freeze([`BSC_CHAIN_56_BLOCK_${block.number}`]) }),
    heart: Object.freeze({ status: "VERIFIED", bytecode_verified: heart.contract_code_verified === true, evidence: Object.freeze([`HEART_BLOCK_${heart.block_number}`, "HEART_BYTECODE_VERIFIED"]) }),
    wallet_read_path: Object.freeze({ status: "VERIFIED", public_read_verified: true, canonical_binding_verified: true, evidence: Object.freeze(["PUBLIC_WALLET_BINDING_ACTIVE", "BNB_KGEN_KAIOS_READ_VERIFIED"]) }),
    cooldown: Object.freeze({ status: "VERIFIED", cooldown_verified: true, evidence: Object.freeze([`HEARTBEAT_COOLDOWN_${heart.heartbeat.cooldown_seconds}`, `FORTUNE_COOLDOWN_${heart.fortune.cooldown_seconds}`]) }),
    patrol_data: Object.freeze({ status: "VERIFIED", fresh: true, observed_at: observedAt, evidence: Object.freeze([heart.recent_events.status, `PATROL_BLOCK_${heart.block_number}`]) })
  }) : null;
  return Object.freeze({
    bsc_block: block.number, rpc_status: "AVAILABLE", heart_status: heart.status === "CHAIN_READ_VERIFIED" ? "AVAILABLE" : "UNAVAILABLE", kgen_status: "AVAILABLE", kaios_status: "AVAILABLE", indexer_status: coreHealthy ? "CORE_HEART_INDEXER_HEALTHY" : "CORE_HEART_INDEXER_DEGRADED",
    wallet_state: { status: "PUBLIC_ADDRESS_READ", bnb: finance.BNB }, heart_state: patrol, finance_state: finance,
    work_queue_state: companyPatrol.work_queue === 0 ? "SCHEMA_READY_EMPTY_QUEUE" : "QUEUE_READY",
    observations: ["LIFE_HEALTH_CHECK", "BNB_DARK_MATTER_CHECK", "12345_GATEKEEPER_PATROL", "HEART_ACTION_ELIGIBILITY", "HEART_ACTION_CANDIDATE", "IGNITION_WINDOW_CHECK", "FORTUNE_MONITOR", "CORE_HEART_EVENT_MONITOR", "WISH_VOW_THANKSGIVING", "LAMP", "IGNITION", "LIFE_FINANCE", "CFO_FIELD_SERVICE_DEMAND_SCAN", "ATM_CASH_SCAN", "ATM_KUFO_SCAN", "WASTE_SCAN", "CARGO_SCAN", "ROUTE_EVIDENCE_SCAN", "FUEL_AND_PROFIT_GATE", "11520_REQUEST_PATROL", "MOTHER_ENGINE_PROBLEM_SOLVING", "MOTHER_ENGINE_NEXT_BEST_ACTION", "AI_ANT_COMPANY_WORK", "MISSION", "REPORT", "ADVANCED_TRANSACTION_GRAPH_INDEXER_REQUIRED_OPTIONAL"],
    risk_level: heart.risk_assessment?.level ?? "NORMAL",
    actions_considered: ["HEARTBEAT_ACTION_CANDIDATE", "IGNITION_ACTION_CANDIDATE", "FORTUNE_ACTION_CANDIDATE", "WISH_ACTION_CANDIDATE", "GATEKEEPER_REPORT", "CFO_CHECK", "REQUEST_PATROL", "COMPANY_PATROL", "WORK_QUEUE_CHECK", "MISSION_CHECK"],
    monitoring_failures: monitoringFailures.map((failure) => createTempleMonitoringFailure({ condition: failure.condition, occurredAt: failure.occurred_at, source: failure.source, fallback: failure.fallback })),
    monitoring_recovery_evidence: monitoringRecoveryEvidence,
    gatekeeper_duty: gatekeeperDuty, heart_action_candidates: actionCandidates, ignition_window: ignitionWindow, life_event_status: lifeEvents, thought_organ_health: thoughtOrgan.health, life_certification: certification, field_service_patrol: fieldServicePatrol, request_patrol: requestPatrol, mother_engine_patrol: motherEnginePatrol, company_patrol: companyPatrol,
    work_time: { gatekeeper_work_seconds: gatekeeperWorkSeconds, cfo_work_seconds: cfoWorkSeconds, company_work_seconds: companyWorkSeconds, life_health_seconds: Number(((gatekeeperClock - lifeStarted) / 1000).toFixed(3)) },
    error_evidence: coreHealthy ? [{ component: "ADVANCED_TRANSACTION_GRAPH_INDEXER", code: "INDEXER_REQUIRED_OPTIONAL", detail: "CORE_GATEKEEPER_HEALTH_UNAFFECTED" }] : [{ component: "CORE_HEART_INDEXER", code: heart.recent_events?.status ?? heart.reason ?? "CHAIN_READ_UNAVAILABLE", detail: "NO_EVENT_DATA_FABRICATED" }]
  });
}

function publicWorkEvent(result) { return result.event?.payload ?? result.event ?? null; }

export function buildSharedWorkerStatus({ event, previous = null, requestPatrol, companyPatrol, generatedAt }) {
  const previousRequests = Number(previous?.request_patrol?.real_requests ?? 0);
  const currentRequests = Number(requestPatrol.real_requests ?? 0);
  const previousSchedule = Date.parse(previous?.last_work_cycle?.scheduled_at ?? "");
  const currentSchedule = Date.parse(event.scheduled_at);
  const newlyMissed = Number.isFinite(previousSchedule) && Number.isFinite(currentSchedule) ? Math.max(0, Math.floor((currentSchedule - previousSchedule) / 3_600_000) - 1) : 0;
  const metrics = {
    completed_cycles: Number(previous?.metrics?.completed_cycles ?? 0) + (event.result === "WORK_CYCLE_COMPLETED" ? 1 : 0),
    failed_cycles: Number(previous?.metrics?.failed_cycles ?? 0) + (event.result === "WORK_CYCLE_FAILED" ? 1 : 0),
    degraded_cycles: Number(previous?.metrics?.degraded_cycles ?? 0) + (event.result === "WORK_CYCLE_DEGRADED" ? 1 : 0),
    no_action_cycles: Number(previous?.metrics?.no_action_cycles ?? 0) + (event.action_taken === "NO_ACTION" ? 1 : 0),
    action_cycles: Number(previous?.metrics?.action_cycles ?? 0) + (event.action_taken !== "NO_ACTION" ? 1 : 0),
    work_duration_seconds: Number(previous?.metrics?.work_duration_seconds ?? 0) + Number(event.work_duration_seconds ?? 0),
    gatekeeper_work_seconds: Number(previous?.metrics?.gatekeeper_work_seconds ?? 0) + Number(event.work_time?.gatekeeper_work_seconds ?? 0),
    cfo_work_seconds: Number(previous?.metrics?.cfo_work_seconds ?? 0) + Number(event.work_time?.cfo_work_seconds ?? 0),
    company_work_seconds: Number(previous?.metrics?.company_work_seconds ?? 0) + Number(event.work_time?.company_work_seconds ?? 0),
    missed_cycles: Number(previous?.metrics?.missed_cycles ?? 0) + newlyMissed
  };
  const health = deriveWorkerHealth({ lastCycle: event, now: generatedAt });
  const lastKnownGood = event.monitoring_status === "VERIFIED" && event.result === "WORK_CYCLE_COMPLETED" ? Object.freeze({ status: "VERIFIED_LAST_KNOWN_GOOD", work_cycle_id: event.work_cycle_id, observed_at: event.finished_at, bsc_block: event.bsc_block ?? null, heart_block: event.gatekeeper_duty?.heart_block ?? null }) : previous?.last_known_good ?? null;
  return validateSharedWorkerStatus(Object.freeze({
    schema_version: "11520_WORKER_STATUS_V1", life_id: "DIGITAL_ANT_0001", app_id: "DIGITAL_ANT_APP_0001", app_version: "V1.6.0",
    scheduler: "GITHUB_ACTIONS_HOURLY_PLUS_IGNITION_WINDOW_PROBES", scheduler_status: "PRODUCTION_ACTIVE", cadence: "EVERY_HOUR_AND_UTC_00_02_00_07", public_read_only: true, signer: false, chain_write: false,
    worker_health: health.status, work_stop_reason: health.stop_reason, generated_at: generatedAt, last_work_cycle: event,
    next_expected_at: new Date(Date.parse(event.scheduled_at) + 3_600_000).toISOString(), metrics,
    primary_job: "WUKONG_GATEKEEPER", secondary_work: "AI_ANT_COMPANY_FOUNDER", gatekeeper_duty: event.gatekeeper_duty, heart_action_candidates: event.heart_action_candidates, ignition_window: event.ignition_window, life_event_status: event.life_event_status, thought_organ_health: event.thought_organ_health, life_certification: event.life_certification,
    monitoring_status: event.monitoring_status ?? "UNKNOWN", temple_monitoring_incident: event.temple_monitoring_incident ?? previous?.temple_monitoring_incident ?? null, dot_gm_notification_projections: event.dot_gm_notification_projections ?? [], repair_work_orders: event.repair_work_orders ?? [], last_known_good: lastKnownGood,
    patrols: { temple_12345: event.heart_state, field_service: event.field_service_patrol, request: requestPatrol, mother_engine: event.mother_engine_patrol, company: companyPatrol },
    request_patrol: { ...requestPatrol, new_real_request_detected: currentRequests > previousRequests, first_real_customer_detected: previousRequests === 0 && currentRequests > 0 },
    global_truth_source: "GIT_BACKED_APPEND_ONLY_PUBLIC_SNAPSHOT", browser_indexeddb_role: "LOCAL_DRAFT_CACHE_ONLY"
  }));
}

export async function persistFatalMonitoringEvidence({ error, statusPath, eventsDir = null, output = null, observedAt = new Date().toISOString() }) {
  let previous = null;
  try { previous = await readJsonIfPresent(statusPath); } catch { previous = null; }
  const failure = classifyTempleMonitoringError(error, { occurredAt: observedAt, lastKnownGood: previous?.last_known_good ?? null });
  const incident = advanceTempleMonitoringIncident({ previousIncident: previous?.temple_monitoring_incident ?? null, failures: [failure], observedAt });
  const hour = new Date(observedAt); hour.setUTCMinutes(0, 0, 0);
  const workCycleId = `DIGITAL_ANT_0001_HOURLY_${hour.toISOString().slice(0, 13).replace(/[-T:]/g, "")}`;
  const gatekeeperDuty = Object.freeze(validateGatekeeperDutyStatus({
    status: "DEGRADED", gatekeeper_started_at: observedAt, gatekeeper_finished_at: observedAt, heart_block: null,
    heart_status: "UNKNOWN", fortune_status: "UNKNOWN", heartbeat_status: "UNKNOWN", ignition_status: "UNKNOWN",
    lamp_status: "UNKNOWN", wish_status: "UNKNOWN", vow_status: "UNKNOWN", claim_monitor_status: "UNKNOWN",
    risk_status: "UNKNOWN", monitoring_status: "MONITORING_FAILED", degradation_affects_safety: true,
    evidence: Object.freeze([failure.condition, failure.source])
  }));
  const event = Object.freeze({
    work_cycle_id: workCycleId, scheduled_at: observedAt, started_at: observedAt, finished_at: observedAt,
    bsc_block: null, rpc_status: "UNKNOWN", heart_status: "UNKNOWN", kgen_status: "UNKNOWN", kaios_status: "UNKNOWN",
    indexer_status: "UNKNOWN", wallet_state: "UNKNOWN", heart_state: "UNKNOWN", finance_state: "UNKNOWN",
    work_queue_state: "UNVERIFIED", observations: Object.freeze(["FATAL_RUNTIME_MONITORING_EVIDENCE"]), risk_level: "UNKNOWN",
    actions_considered: Object.freeze([]), gatekeeper_duty: gatekeeperDuty, monitoring_status: incident.status,
    temple_monitoring_incident: incident, dot_gm_notification_projections: incident.notification_projections,
    repair_work_orders: incident.repair_work_orders, work_time: Object.freeze({ gatekeeper_work_seconds: 0, cfo_work_seconds: 0, company_work_seconds: 0 }),
    action_taken: "NO_ACTION", result: "WORK_CYCLE_DEGRADED", stop_reason: failure.condition,
    error_evidence: Object.freeze([{ component: error?.component ?? "PUBLIC_WORKER_RUNTIME", code: error?.code ?? "CRITICAL_STATUS_UNKNOWN", detail: "FATAL_RUNTIME_FAILED_CLOSED_NO_VALUE_FABRICATED" }]),
    tx_hash: null, gas_spent: "0", signer_action: false, chain_write: false, secret_access: false, temple_mutation: false, token_mutation: false, governance_action: false,
    work_duration_seconds: 0
  });
  const requestPatrol = previous?.request_patrol ?? Object.freeze({ status: "SHARED_REQUEST_SOURCE_UNAVAILABLE", source: "GITHUB_ISSUES", real_requests: 0, open_requests: 0, evidence: Object.freeze(["FATAL_RUNTIME_READ_UNAVAILABLE"]) });
  const companyPatrol = previous?.patrols?.company ?? Object.freeze({ status: "UNAVAILABLE", evidence: Object.freeze(["FATAL_RUNTIME_READ_UNAVAILABLE"]) });
  const status = buildSharedWorkerStatus({ event, previous, requestPatrol, companyPatrol, generatedAt: observedAt });
  const eventPath = eventsDir ? join(eventsDir, `${workCycleId}.json`) : null;
  if (eventPath) await writeJson(eventPath, event);
  if (statusPath) await writeJson(statusPath, status);
  const report = Object.freeze({ report_type: "DIGITAL_ANT_PUBLIC_READ_ONLY_HOURLY_WORKER_RESULT", result: "WORK_CYCLE_DEGRADED", fatal_runtime_failure: true, chain_write: false, signer_action: false, shared_status: statusPath, event_path: eventPath, temple_monitoring_incident: incident });
  if (output) await writeJson(output, report);
  return Object.freeze({ report, status, event });
}

async function main() {
  const argv = process.argv.slice(2);
  const statusPath = argument(argv, "--status");
  const eventsDir = argument(argv, "--events-dir");
  const output = argument(argv, "--output");
  const seed = JSON.parse(await readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const universe = await createUniverseRuntime({ seed });
  const [life, app, previousStatus, firstEventEvidence] = await Promise.all([
    universe.registries.life.get("DIGITAL_ANT_0001"), universe.registries.app.get("DIGITAL_ANT_APP_0001"), readJsonIfPresent(statusPath), readJsonIfPresent(FIRST_HEARTBEAT_KGEN_EVIDENCE)
  ]);
  const canonicalReceiptEvents = Object.fromEntries((seed.next_stage?.heart_life_events_v3_7?.events ?? [])
    .filter((event) => String(event.event_type ?? "").startsWith("FIRST_") && event.receipt_status === 1 && /^0x[0-9a-f]{64}$/i.test(event.tx_hash ?? ""))
    .map((event) => [event.event_type, event]));
  const verifiedFirstEvents = firstEventEvidence?.status?.startsWith("COMPLETED_") ? {
    ...canonicalReceiptEvents,
    FIRST_HEARTBEAT_EVENT: firstEventEvidence.first_heartbeat_event,
    FIRST_KGEN_EVENT: firstEventEvidence.first_kgen_event
  } : Object.keys(canonicalReceiptEvents).length ? canonicalReceiptEvents : null;
  const now = new Date().toISOString();
  const hour = new Date(now); hour.setUTCMinutes(0, 0, 0);
  const cycleId = `DIGITAL_ANT_0001_HOURLY_${hour.toISOString().slice(0, 13).replace(/[-T:]/g, "")}`;
  const eventPath = eventsDir ? join(eventsDir, `${cycleId}.json`) : null;
  const existing = await readJsonIfPresent(eventPath);
  if (existing) {
    const report = { report_type: "DIGITAL_ANT_PUBLIC_READ_ONLY_HOURLY_WORKER_RESULT", result: "IDEMPOTENT_NOOP", work_cycle_id: cycleId, chain_write: false, signer_action: false };
    if (output) await writeJson(output, report); else process.stdout.write(`${JSON.stringify(report)}\n`);
    return;
  }
  const stalePreflight = (() => {
    if (!previousStatus) return [createTempleMonitoringFailure({ condition: "PUBLIC_RUNTIME_STALE", occurredAt: now, source: "PUBLIC_WORKER_SHARED_STATUS:RESTORE_MISSING", lastKnownGood: null, fallback: { attempted: true, strategy: "RUN_CURRENT_READ_ONLY_WORKER_CYCLE", result: "CURRENT_CYCLE_STARTED", evidence: ["NO_PREVIOUS_STATUS_ARTIFACT_RESTORED"] } })];
    const finishedAt = Date.parse(previousStatus?.last_work_cycle?.finished_at ?? "");
    if (!Number.isFinite(finishedAt) || Date.parse(now) - finishedAt <= 4_500_000) return [];
    return [createTempleMonitoringFailure({ condition: "PUBLIC_RUNTIME_STALE", occurredAt: now, source: "PUBLIC_WORKER_SHARED_STATUS:FRESHNESS", lastKnownGood: previousStatus?.last_known_good ?? null, fallback: { attempted: true, strategy: "RUN_CURRENT_READ_ONLY_WORKER_CYCLE", result: "CURRENT_CYCLE_STARTED", evidence: [previousStatus.last_work_cycle.work_cycle_id] } })];
  })();
  const result = await runDigitalAntHourlyCycle({ store: universe.store, life, app, scheduledAt: now, startedAt: now, previousStatus, preflightFailures: stalePreflight, readCycle: (context) => publicReadCycle({ ...context, seed, verifiedFirstEvents }) });
  const event = publicWorkEvent(result);
  const requestPatrol = event.request_patrol;
  const companyPatrol = event.company_patrol;
  const generatedAt = new Date().toISOString();
  const status = buildSharedWorkerStatus({ event, previous: previousStatus, requestPatrol, companyPatrol, generatedAt });
  if (eventPath) await writeJson(eventPath, event, { exclusive: true });
  if (statusPath) await writeJson(statusPath, status);
  const report = { report_type: "DIGITAL_ANT_PUBLIC_READ_ONLY_HOURLY_WORKER_RESULT", scheduler: "GITHUB_ACTIONS_HOURLY", chain_write: false, signer_action: false, result, shared_status: statusPath, event_path: eventPath };
  if (output) await writeJson(output, report); else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(async (error) => {
    const argv = process.argv.slice(2);
    try {
      await persistFatalMonitoringEvidence({ error, statusPath: argument(argv, "--status"), eventsDir: argument(argv, "--events-dir"), output: argument(argv, "--output") });
    } catch (evidenceError) {
      process.stderr.write(`${evidenceError?.code ?? "MONITORING_EVIDENCE_WRITE_FAILED"}: fatal monitoring evidence could not be persisted.\n`);
    }
    process.stderr.write(`${error?.code ?? "WORKER_RUNTIME_FAILED"}: public read-only worker failed closed.\n`);
    process.exitCode = 1;
  });
}
