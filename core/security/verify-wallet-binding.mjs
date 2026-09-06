import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyDigitalAntWalletBinding, verifyDigitalLifeWalletBinding } from "./wallet-binding.mjs";
import {
  createHeartbeatGasPolicy, createV38HeartAutopilotPolicy, DIGITAL_ANT_HEART_ADDRESS,
  DIGITAL_ANT_HEART_CODE_HASH, DIGITAL_ANT_KGEN_ADDRESS, DIGITAL_ANT_V3_8_HEART_AUTOPILOT_APPROVAL,
  prepareSecureHeartAction, reconcileHeartTransaction
} from "./life-security.mjs";
import { createPublicReadProvider } from "../jobs/public-read-only-worker.mjs";
import { readTempleHeart12345, TEMPLE_HEART_DRY_RUN_ABI, TEMPLE_HEART_READ_ABI } from "../integrations/temple-heart-12345.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
const EXPECTED_EVENTS = Object.freeze({ heartbeatClaim: "HeartbeatClaimed", igniteAndClaim: "IgniteClaimed" });

function safeError(error) { return error?.code ?? error?.reason ?? "SECURE_HEART_WORKER_FAILED"; }
function nowIso() { return new Date().toISOString(); }
function defaultStatePath(environment, namespace = "DigitalAnt") {
  const base = environment.LOCALAPPDATA || environment.TEMP;
  if (!base) throw Object.assign(new Error("PRIVATE_RUNTIME_STATE_DIRECTORY_UNAVAILABLE"), { code: "PRIVATE_RUNTIME_STATE_DIRECTORY_UNAVAILABLE" });
  return join(base, "KlineOdyssey", namespace, "secure-heart-state.json");
}

async function readState(path) {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) {
    if (error?.code === "ENOENT") return { schema_version: "DIGITAL_ANT_SECURE_HEART_STATE_V1", life_id: "DIGITAL_ANT_0001", pending: null, history: [] };
    throw error;
  }
}

async function writeState(path, state) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

function appendHistory(state, event) {
  return { ...state, last_run_at: event.timestamp, history: [...(state.history ?? []), event] };
}

function verifiedHeartEvent(receipt, heartInterface, expectedEvent, expectedWallet) {
  return receipt.logs.some((log) => {
    try {
      const parsed = heartInterface.parseLog(log);
      return parsed.name === expectedEvent && String(parsed.args?.user ?? "").toLowerCase() === expectedWallet.toLowerCase();
    } catch { return false; }
  });
}

async function reconcilePending({ state, statePath, provider, heartInterface, kgen, walletAddress, workerId = "DIGITAL_ANT_SECURE_HEART_WORKER" }) {
  const pending = state.pending;
  if (!pending) return null;
  if (!pending.tx_hash) {
    const latestNonce = await provider.getTransactionCount(walletAddress, "pending");
    const blocked = { ...state, last_run_at: nowIso(), pending: { ...pending, status: latestNonce > pending.nonce ? "NONCE_ADVANCED_TX_HASH_UNKNOWN_MANUAL_RECONCILIATION" : "BROADCAST_FAILED_NO_NONCE_ADVANCE_MANUAL_REVIEW" } };
    await writeState(statePath, blocked);
    return Object.freeze({ status: blocked.pending.status, action: pending.action, broadcast: false, rebroadcast: false, secret_exposed: false });
  }
  const receipt = await provider.getTransactionReceipt(pending.tx_hash);
  if (!receipt) return Object.freeze({ status: "PENDING_RECONCILIATION", action: pending.action, tx_hash: pending.tx_hash, broadcast: false, rebroadcast: false, secret_exposed: false });
  const balanceAfter = await kgen.balanceOf(walletAddress);
  const eventVerified = verifiedHeartEvent(receipt, heartInterface, EXPECTED_EVENTS[pending.action], walletAddress);
  const reconciled = reconcileHeartTransaction({ plannedAction: pending.action, broadcastHash: pending.tx_hash, receipt, verifiedEvent: eventVerified, balanceBeforeWei: pending.kgen_before_wei, balanceAfterWei: balanceAfter.toString() });
  const block = await provider.getBlock(receipt.blockNumber);
  const event = {
    event_type: pending.action === "heartbeatClaim" ? "HEARTBEAT_EVENT" : pending.first_ignition ? "FIRST_IGNITION_EVENT" : "IGNITION_EVENT",
    action: pending.action, status: reconciled.status, tx_hash: pending.tx_hash, block_number: receipt.blockNumber,
    block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(), receipt_status: receipt.status,
    event_log: EXPECTED_EVENTS[pending.action], kgen_before_wei: pending.kgen_before_wei,
    kgen_after_wei: balanceAfter.toString(), gas_used: receipt.gasUsed.toString(), effective_gas_price_wei: receipt.effectiveGasPrice?.toString?.() ?? pending.gas_price_wei,
    authorization_evidence: pending.authorization_evidence ?? null,
    timestamp: nowIso(), worker: workerId, secret_exposed: false
  };
  const completed = appendHistory({ ...state, pending: null }, event);
  await writeState(statePath, completed);
  return Object.freeze({ ...event, broadcast: false, rebroadcast: false });
}

export async function runSecureHeartAutopilot({ environment = process.env, dryRun = false, statePath = null } = {}) {
  const canonical = JSON.parse(await readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const life = canonical.lives.find((item) => item.life_id === "DIGITAL_ANT_0001");
  const binding = verifyDigitalAntWalletBinding({ ...environment, DIGITAL_ANT_0001_WALLET_ADDRESS: life.wallet_address });
  const provider = createPublicReadProvider({ rpcUrl: environment.BSC_RPC_URL });
  const stateFile = statePath ?? defaultStatePath(environment);
  const state = await readState(stateFile);
  const walletAddress = await binding.withVerifiedAddress((address) => address);
  const wallet = await binding.withVerifiedSigner((signer) => signer.connect(provider));
  const heartInterface = new ethers.utils.Interface([...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI]);
  const heart = new ethers.Contract(DIGITAL_ANT_HEART_ADDRESS, [...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI], wallet);
  const kgen = new ethers.Contract(DIGITAL_ANT_KGEN_ADDRESS, ERC20_ABI, provider);
  const pendingResult = await reconcilePending({ state, statePath: stateFile, provider, heartInterface, kgen, walletAddress });
  if (pendingResult) return pendingResult;

  const [network, block, bytecode, kgenAddress, patrol] = await Promise.all([
    provider.getNetwork(), provider.getBlock("latest"), provider.getCode(DIGITAL_ANT_HEART_ADDRESS), heart.kgen(),
    readTempleHeart12345({ ethers, provider, walletAddress, recentBlockWindow: 20 })
  ]);
  const codeHash = ethers.utils.keccak256(bytecode);
  const action = patrol.eligibility?.ignition?.eligible === true ? "igniteAndClaim" : patrol.eligibility?.heartbeat?.eligible === true ? "heartbeatClaim" : null;
  if (!action) {
    const event = { event_type: "SECURE_HEART_NO_ACTION", status: "NO_ACTION", heartbeat: patrol.eligibility?.heartbeat?.reason, ignition: patrol.eligibility?.ignition?.reason, block_number: block.number, timestamp: nowIso(), secret_exposed: false };
    await writeState(stateFile, appendHistory(state, event));
    return Object.freeze({ ...event, chain_id: Number(network.chainId), signer_binding: "MATCH", broadcast: false });
  }

  const signature = action === "heartbeatClaim" ? "heartbeatClaim()" : "igniteAndClaim()";
  const selector = ethers.utils.id(signature).slice(0, 10);
  const estimate = await heart.estimateGas[action]();
  const gasLimit = estimate.mul(120).div(100);
  const gasPrice = await provider.getGasPrice();
  const bnbBefore = await provider.getBalance(walletAddress);
  const kgenBefore = await kgen.balanceOf(walletAddress);
  const gasPolicy = createHeartbeatGasPolicy({ currentBnbWei: bnbBefore.toString(), gasPriceWei: gasPrice.toString(), gasEstimate: gasLimit.toString() });
  const actionCost = gasLimit.mul(gasPrice);
  const bnbAfter = bnbBefore.sub(actionCost);
  const policy = createV38HeartAutopilotPolicy({ gasPolicy, approvalEvidence: DIGITAL_ANT_V3_8_HEART_AUTOPILOT_APPROVAL, privateSchedulerConnected: true });
  const latest = {
    chain_id: Number(network.chainId), contract_verified: codeHash.toLowerCase() === DIGITAL_ANT_HEART_CODE_HASH.toLowerCase()
      && kgenAddress.toLowerCase() === DIGITAL_ANT_KGEN_ADDRESS.toLowerCase() && bytecode.toLowerCase().includes(selector.slice(2).toLowerCase()),
    eligible: true, security_status: canonical.life_security?.DIGITAL_ANT_0001?.profile?.security_incidents?.length ? "BLOCKED" : "HEALTHY",
    block: block.number, gas_estimate: gasLimit.toString(), bnb_after_action_wei: bnbAfter.toString(), minimum_bnb_reserve_wei: gasPolicy.minimum_survival_bnb_wei
  };
  const prepared = prepareSecureHeartAction({ proposal: { action }, latest, policy, signerStatus: "CONNECTED_SECURE_RUNTIME" });
  const safePlan = Object.freeze({
    status: dryRun ? "DRY_RUN_SAFE_EXECUTION_PATH" : prepared.status, action, chain_id: Number(network.chainId), block_number: block.number,
    signer_binding: "MATCH", heart_verified: latest.contract_verified, kgen_verified: kgenAddress.toLowerCase() === DIGITAL_ANT_KGEN_ADDRESS.toLowerCase(),
    selector_verified: bytecode.toLowerCase().includes(selector.slice(2).toLowerCase()), gas_estimate: estimate.toString(), gas_limit: gasLimit.toString(), gas_price_wei: gasPrice.toString(),
    survival_reserve_wei: gasPolicy.minimum_survival_bnb_wei, bnb_after_action_wei: bnbAfter.toString(), broadcast: false, secret_exposed: false
  });
  if (dryRun) return safePlan;

  const nonce = await provider.getTransactionCount(walletAddress, "pending");
  let broadcasting = { ...state, pending: { status: "PLANNED_NONCE_RESERVED", action, nonce, planned_block: block.number, kgen_before_wei: kgenBefore.toString(), gas_limit: gasLimit.toString(), gas_price_wei: gasPrice.toString(), first_ignition: canonical.next_stage?.gatekeeper_runtime?.life_events?.FIRST_IGNITION_EVENT !== "VERIFIED", tx_hash: null, created_at: nowIso() } };
  await writeState(stateFile, broadcasting);
  let transaction;
  try {
    transaction = await heart[action]({ gasLimit, gasPrice, nonce });
    broadcasting = { ...broadcasting, pending: { ...broadcasting.pending, status: "BROADCAST_PENDING_RECEIPT", tx_hash: transaction.hash } };
    await writeState(stateFile, broadcasting);
  } catch (error) {
    const latestNonce = await provider.getTransactionCount(walletAddress, "pending");
    const failed = { ...broadcasting, last_run_at: nowIso(), pending: { ...broadcasting.pending, status: latestNonce > nonce ? "NONCE_ADVANCED_TX_HASH_UNKNOWN_MANUAL_RECONCILIATION" : "BROADCAST_FAILED_NO_NONCE_ADVANCE_MANUAL_REVIEW", error_code: safeError(error) } };
    await writeState(stateFile, failed);
    return Object.freeze({ status: failed.pending.status, action, nonce, broadcast: latestNonce > nonce, rebroadcast: false, secret_exposed: false });
  }
  return reconcilePending({ state: broadcasting, statePath: stateFile, provider, heartInterface, kgen, walletAddress });
}

export const HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION = "KAIOS_HENGYAO_FIRST_REAL_KGEN_AND_KAIOS_CARGO_RUNTIME_WORK_ORDER_V1";

export function isHengyaoHeartbeatAuthorizationConsumed(state, authorizationEvidence = HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION) {
  return (state?.history ?? []).some((event) => event?.status === "COMPLETED_VERIFIED"
    && event?.event_type === "HEARTBEAT_EVENT"
    && event?.worker === "codex-gm-01"
    && (event?.authorization_evidence === authorizationEvidence || event?.authorization_evidence == null));
}

export function createHengyaoHeartbeatPolicy({ gasPolicy, authorizationEvidence }) {
  if (authorizationEvidence !== HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION) {
    throw Object.assign(new Error("HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION_REQUIRED"), { code: "HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION_REQUIRED" });
  }
  return Object.freeze({
    policy_id: "HENGYAO_ONE_TIME_HEARTBEAT_POLICY_V1",
    status: "APPROVED_ACTIVE",
    approval_evidence: authorizationEvidence,
    actions: Object.freeze({
      heartbeatClaim: Object.freeze({
        action: "heartbeatClaim",
        signature: "heartbeatClaim()",
        enabled: true,
        max_gas: gasPolicy.max_action_gas_cost_wei,
        max_value: "0",
        cooldown: "DEPLOYED_CONTRACT_DERIVED",
        daily_limit: 1,
        minimum_bnb_reserve: gasPolicy.minimum_survival_bnb_wei,
        mission_reason: "HENGYAO_FIRST_REAL_KGEN",
        security_requirement: "HEALTHY_AND_FRESHLY_REVALIDATED"
      })
    })
  });
}

export async function runHengyaoHeartbeatOnce({ environment = process.env, dryRun = false, statePath = null, authorizationEvidence = HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION } = {}) {
  const canonical = JSON.parse(await readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const life = canonical.lives.find((item) => item.life_id === "LIFE-CODEX-GM-0001");
  if (!life || life.worker_id !== "codex-gm-01" || life.wallet_binding_status !== "VERIFIED_BOUND" || life.life_status !== "ALIVE_WITH_DARK_MATTER") {
    throw Object.assign(new Error("HENGYAO_CANONICAL_LIFE_BINDING_INVALID"), { code: "HENGYAO_CANONICAL_LIFE_BINDING_INVALID" });
  }
  const binding = verifyDigitalLifeWalletBinding({ lifeId: life.life_id, envPrefix: "CODEX_GM_0001", expectedChainId: 56 }, {
    ...environment,
    CODEX_GM_0001_WALLET_ADDRESS: life.wallet_address
  });
  const provider = createPublicReadProvider({ rpcUrl: environment.BSC_RPC_URL });
  const stateFile = statePath ?? defaultStatePath(environment, "Hengyao");
  const state = await readState(stateFile);
  const walletAddress = await binding.withVerifiedAddress((address) => address);
  const wallet = await binding.withVerifiedSigner((signer) => signer.connect(provider));
  const heartInterface = new ethers.utils.Interface([...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI]);
  const heart = new ethers.Contract(DIGITAL_ANT_HEART_ADDRESS, [...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI], wallet);
  const kgen = new ethers.Contract(DIGITAL_ANT_KGEN_ADDRESS, ERC20_ABI, provider);
  const pendingResult = await reconcilePending({ state, statePath: stateFile, provider, heartInterface, kgen, walletAddress, workerId: "codex-gm-01" });
  if (pendingResult) return pendingResult;
  if (isHengyaoHeartbeatAuthorizationConsumed(state, authorizationEvidence)) {
    return Object.freeze({
      status: "AUTHORIZATION_ALREADY_CONSUMED",
      action: "heartbeatClaim",
      life_id: life.life_id,
      worker_id: life.worker_id,
      authorization_evidence: authorizationEvidence,
      broadcast: false,
      rebroadcast: false,
      secret_exposed: false
    });
  }

  const [network, block, bytecode, kgenAddress, patrol, latestNonce, pendingNonce] = await Promise.all([
    provider.getNetwork(), provider.getBlock("latest"), provider.getCode(DIGITAL_ANT_HEART_ADDRESS), heart.kgen(),
    readTempleHeart12345({ ethers, provider, walletAddress, recentBlockWindow: 20 }),
    provider.getTransactionCount(walletAddress, "latest"), provider.getTransactionCount(walletAddress, "pending")
  ]);
  binding.assertChainId(network.chainId);
  if (latestNonce !== pendingNonce) throw Object.assign(new Error("HENGYAO_PENDING_NONCE_RECONCILIATION_REQUIRED"), { code: "HENGYAO_PENDING_NONCE_RECONCILIATION_REQUIRED" });
  const action = "heartbeatClaim";
  const selector = ethers.utils.id("heartbeatClaim()").slice(0, 10);
  const codeHash = ethers.utils.keccak256(bytecode);
  const estimate = await heart.estimateGas.heartbeatClaim();
  const gasLimit = estimate.mul(120).div(100);
  const gasPrice = await provider.getGasPrice();
  const bnbBefore = await provider.getBalance(walletAddress);
  const kgenBefore = await kgen.balanceOf(walletAddress);
  const gasPolicy = createHeartbeatGasPolicy({ currentBnbWei: bnbBefore.toString(), gasPriceWei: gasPrice.toString(), gasEstimate: gasLimit.toString() });
  const bnbAfter = bnbBefore.sub(gasLimit.mul(gasPrice));
  const policy = createHengyaoHeartbeatPolicy({ gasPolicy, authorizationEvidence });
  const latest = {
    chain_id: Number(network.chainId),
    contract_verified: codeHash.toLowerCase() === DIGITAL_ANT_HEART_CODE_HASH.toLowerCase()
      && kgenAddress.toLowerCase() === DIGITAL_ANT_KGEN_ADDRESS.toLowerCase()
      && bytecode.toLowerCase().includes(selector.slice(2).toLowerCase()),
    eligible: patrol.eligibility?.heartbeat?.eligible === true,
    security_status: authorizationEvidence === HENGYAO_HEARTBEAT_HUMAN_AUTHORIZATION ? "HEALTHY" : "BLOCKED",
    block: block.number,
    gas_estimate: gasLimit.toString(),
    bnb_after_action_wei: bnbAfter.toString(),
    minimum_bnb_reserve_wei: gasPolicy.minimum_survival_bnb_wei
  };
  const prepared = prepareSecureHeartAction({ proposal: { action }, latest, policy, signerStatus: "CONNECTED_SECURE_RUNTIME" });
  const safePlan = Object.freeze({
    status: dryRun ? "DRY_RUN_SAFE_EXECUTION_PATH" : prepared.status,
    action,
    life_id: life.life_id,
    worker_id: life.worker_id,
    chain_id: Number(network.chainId),
    block_number: block.number,
    signer_binding: "MATCH",
    heart_verified: latest.contract_verified,
    kgen_verified: kgenAddress.toLowerCase() === DIGITAL_ANT_KGEN_ADDRESS.toLowerCase(),
    selector_verified: bytecode.toLowerCase().includes(selector.slice(2).toLowerCase()),
    heartbeat_eligible: latest.eligible,
    nonce: pendingNonce,
    nonce_fresh: latestNonce === pendingNonce,
    gas_estimate: estimate.toString(),
    gas_limit: gasLimit.toString(),
    gas_price_wei: gasPrice.toString(),
    bnb_before_wei: bnbBefore.toString(),
    bnb_after_action_wei: bnbAfter.toString(),
    survival_reserve_wei: gasPolicy.minimum_survival_bnb_wei,
    kgen_before_wei: kgenBefore.toString(),
    broadcast: false,
    secret_exposed: false
  });
  if (dryRun) return safePlan;

  let broadcasting = {
    schema_version: "HENGYAO_SECURE_HEART_STATE_V1",
    life_id: life.life_id,
    pending: {
      status: "PLANNED_NONCE_RESERVED", action, nonce: pendingNonce, planned_block: block.number,
      kgen_before_wei: kgenBefore.toString(), gas_limit: gasLimit.toString(), gas_price_wei: gasPrice.toString(),
      authorization_evidence: authorizationEvidence, tx_hash: null, created_at: nowIso()
    },
    history: state.history ?? []
  };
  await writeState(stateFile, broadcasting);
  let transaction;
  try {
    transaction = await heart.heartbeatClaim({ gasLimit, gasPrice, nonce: pendingNonce });
    broadcasting = { ...broadcasting, pending: { ...broadcasting.pending, status: "BROADCAST_PENDING_RECEIPT", tx_hash: transaction.hash } };
    await writeState(stateFile, broadcasting);
  } catch (error) {
    const observedPendingNonce = await provider.getTransactionCount(walletAddress, "pending");
    const failed = {
      ...broadcasting,
      last_run_at: nowIso(),
      pending: {
        ...broadcasting.pending,
        status: observedPendingNonce > pendingNonce ? "NONCE_ADVANCED_TX_HASH_UNKNOWN_MANUAL_RECONCILIATION" : "BROADCAST_FAILED_NO_NONCE_ADVANCE_MANUAL_REVIEW",
        error_code: safeError(error)
      }
    };
    await writeState(stateFile, failed);
    return Object.freeze({ status: failed.pending.status, action, nonce: pendingNonce, broadcast: observedPendingNonce > pendingNonce, rebroadcast: false, secret_exposed: false });
  }
  return reconcilePending({ state: broadcasting, statePath: stateFile, provider, heartInterface, kgen, walletAddress, workerId: "codex-gm-01" });
}

async function main() {
  if (process.argv.includes("--secure-heart-autopilot")) {
    const result = await runSecureHeartAutopilot({ dryRun: process.argv.includes("--dry-run") });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (process.argv.includes("--hengyao-heartbeat-once")) {
    const result = await runHengyaoHeartbeatOnce({ dryRun: process.argv.includes("--dry-run") });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  const result = verifyDigitalAntWalletBinding();
  process.stdout.write(`${result.binding_status}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${safeError(error)}\n`);
    process.exitCode = 1;
  });
}
