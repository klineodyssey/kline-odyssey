import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createUniverseRuntime } from "../registry/universe-runtime.mjs";
import { deriveWorkerHealth, normalizeHeartActionStatus, runDigitalAntHourlyCycle, validateSharedWorkerStatus } from "./index.mjs";
import { readTempleHeart12345 } from "../integrations/temple-heart-12345.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../ethers-5.7.2.umd.min.js");
const KGEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
const KAIOS = "0xD4E67B3a69e41524c424150E6b6e921b01D036db";
const PUBLIC_BSC_RPC = "https://bsc-dataseed.bnbchain.org";
const ERC20_READ_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

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

function heartPatrol(heart) {
  const available = heart.status === "CHAIN_READ_VERIFIED";
  const eligibility = heart.eligibility ?? {};
  return Object.freeze({
    status: available ? "12345_PATROL_COMPLETED" : "12345_PATROL_UNAVAILABLE", source: "REPOSITORY_ABI_PUBLIC_CHAIN_READ", eligibility_source: "CLIENT_DERIVED",
    heartbeat: normalizeHeartActionStatus(eligibility.heartbeat, { available }), fortune: normalizeHeartActionStatus(eligibility.fortune, { available }),
    ignition: normalizeHeartActionStatus(eligibility.ignition, { available }), lamp: normalizeHeartActionStatus(eligibility.light, { available }),
    wish: normalizeHeartActionStatus(eligibility.wish, { available }),
    thanksgiving: Object.freeze({ status: available ? "NOT_ELIGIBLE" : "UNAVAILABLE", reason: "VOW_POLICY_AND_COMPLETION_EVIDENCE_REQUIRED", eligibility_source: "CLIENT_DERIVED", write_status: "WRITE_NOT_CONNECTED" }),
    recent_events: heart.recent_events ?? { status: "UNAVAILABLE" }, flow_analysis: heart.claim_flow_analysis ?? { status: "INDEXER_REQUIRED" }
  });
}

async function publicReadCycle({ life, requestPatrol, companyPatrol }) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL || PUBLIC_BSC_RPC, 56);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 56) throw statusError("BSC_CHAIN_56_REQUIRED", "BSC_RPC");
  const kgen = new ethers.Contract(KGEN, ERC20_READ_ABI, provider);
  const kaios = new ethers.Contract(KAIOS, ERC20_READ_ABI, provider);
  const [block, bnb, kgenRaw, kgenDecimals, kaiosRaw, kaiosDecimals, heart] = await Promise.all([
    provider.getBlock("latest"), provider.getBalance(life.wallet_address), kgen.balanceOf(life.wallet_address), kgen.decimals(),
    kaios.balanceOf(life.wallet_address), kaios.decimals(),
    readTempleHeart12345({ ethers, provider, walletAddress: life.wallet_address, wishText: "靠自己的工作活下去，累積自己的資產，有一天靠自己離開五指山。", recentBlockWindow: 100 })
  ]);
  const patrol = heartPatrol(heart);
  const heartAvailable = heart.status === "CHAIN_READ_VERIFIED";
  return Object.freeze({
    bsc_block: block.number, rpc_status: "AVAILABLE", heart_status: heartAvailable ? "AVAILABLE" : "UNAVAILABLE", kgen_status: "AVAILABLE", kaios_status: "AVAILABLE", indexer_status: "INDEXER_REQUIRED",
    wallet_state: { status: "PUBLIC_ADDRESS_READ", bnb: ethers.utils.formatEther(bnb) }, heart_state: patrol,
    finance_state: { BNB: ethers.utils.formatEther(bnb), KGEN: ethers.utils.formatUnits(kgenRaw, Number(kgenDecimals)), KAIOS: ethers.utils.formatUnits(kaiosRaw, Number(kaiosDecimals)), actual_income: "0", actual_expense: "0", actual_gas: "0" },
    work_queue_state: companyPatrol.work_queue === 0 ? "SCHEMA_READY_EMPTY_QUEUE" : "QUEUE_READY",
    observations: ["PUBLIC_WALLET_BALANCE_READ", "12345_HEART_READ", "KGEN_BALANCE_READ", "KAIOS_BALANCE_READ", "11520_REQUEST_PATROL", "AI_ANT_COMPANY_PATROL", "COMPLETE_FLOW_CLUSTERING_INDEXER_REQUIRED"],
    risk_level: heart.risk_assessment?.level ?? "NORMAL",
    actions_considered: ["HEART_ELIGIBILITY", "GATEKEEPER_REPORT", "CFO_CHECK", "REQUEST_PATROL", "COMPANY_PATROL", "WORK_QUEUE_CHECK", "MISSION_CHECK"],
    request_patrol: requestPatrol, company_patrol: companyPatrol,
    error_evidence: heartAvailable ? [{ component: "FLOW_CLUSTERING", code: "INDEXER_REQUIRED", detail: "NO_FLOW_DATA_INFERRED" }] : [{ component: "TEMPLE_HEART_12345", code: heart.reason ?? "CHAIN_READ_UNAVAILABLE", detail: "NO_HEART_STATE_FABRICATED" }]
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
    work_duration_seconds: Number(previous?.metrics?.work_duration_seconds ?? 0) + Number(event.work_duration_seconds ?? 0), missed_cycles: Number(previous?.metrics?.missed_cycles ?? 0) + newlyMissed
  };
  const health = deriveWorkerHealth({ lastCycle: event, now: generatedAt });
  return validateSharedWorkerStatus(Object.freeze({
    schema_version: "11520_WORKER_STATUS_V1", life_id: "DIGITAL_ANT_0001", app_id: "DIGITAL_ANT_APP_0001", app_version: "V1.1.0",
    scheduler: "GITHUB_ACTIONS_HOURLY", scheduler_status: "PRODUCTION_ACTIVE", cadence: "EVERY_HOUR", public_read_only: true, signer: false, chain_write: false,
    worker_health: health.status, work_stop_reason: health.stop_reason, generated_at: generatedAt, last_work_cycle: event,
    next_expected_at: new Date(Date.parse(event.scheduled_at) + 3_600_000).toISOString(), metrics,
    patrols: { temple_12345: event.heart_state, request: requestPatrol, company: companyPatrol },
    request_patrol: { ...requestPatrol, new_real_request_detected: currentRequests > previousRequests, first_real_customer_detected: previousRequests === 0 && currentRequests > 0 },
    global_truth_source: "GIT_BACKED_APPEND_ONLY_PUBLIC_SNAPSHOT", browser_indexeddb_role: "LOCAL_DRAFT_CACHE_ONLY"
  }));
}

async function main() {
  const argv = process.argv.slice(2);
  const statusPath = argument(argv, "--status");
  const eventsDir = argument(argv, "--events-dir");
  const output = argument(argv, "--output");
  const seed = JSON.parse(await readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const universe = await createUniverseRuntime({ seed });
  const [life, app, previousStatus, requestPatrol] = await Promise.all([
    universe.registries.life.get("DIGITAL_ANT_0001"), universe.registries.app.get("DIGITAL_ANT_APP_0001"), readJsonIfPresent(statusPath), readPublicRequestPatrol()
  ]);
  const companyPatrol = readCompanyPatrol(seed);
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
  const result = await runDigitalAntHourlyCycle({ store: universe.store, life, app, scheduledAt: now, startedAt: now, readCycle: (context) => publicReadCycle({ ...context, requestPatrol, companyPatrol }) });
  const event = publicWorkEvent(result);
  const generatedAt = new Date().toISOString();
  const status = buildSharedWorkerStatus({ event, previous: previousStatus, requestPatrol, companyPatrol, generatedAt });
  if (eventPath) await writeJson(eventPath, event, { exclusive: true });
  if (statusPath) await writeJson(statusPath, status);
  const report = { report_type: "DIGITAL_ANT_PUBLIC_READ_ONLY_HOURLY_WORKER_RESULT", scheduler: "GITHUB_ACTIONS_HOURLY", chain_write: false, signer_action: false, result, shared_status: statusPath, event_path: eventPath };
  if (output) await writeJson(output, report); else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error?.code ?? "WORKER_RUNTIME_FAILED"}: public read-only worker could not complete.\n`); process.exitCode = 1; });
}
