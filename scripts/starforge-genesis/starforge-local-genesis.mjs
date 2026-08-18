import fs from "node:fs/promises";
import path from "node:path";
import {
  STARFORGE, buildBodyContinuityMessage, buildSoulBirthMessage, hashCanonicalJson,
  keccakUtf8, recoverPersonalSignature, validatePublicGenesis
} from "../../core/life/starforge-spirit-runtime.mjs";

function stop(code) { throw new Error(code); }
function expect(ok, code) { if (!ok) stop(code); }
async function readJson(file) { return JSON.parse(await fs.readFile(file, "utf8")); }
async function writeJson(file, value) { await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "w" }); }

const [action, stateRootArg] = process.argv.slice(2);
const stateRoot = path.resolve(stateRootArg ?? "");
const repoRoot = path.resolve(import.meta.dirname, "../..");
const files = {
  runtime: path.join(repoRoot, "KGEN-AI-Company/life/starforge/runtime.json"),
  capability: path.join(repoRoot, "KGEN-AI-Company/life/starforge/capability.json"),
  addresses: path.join(stateRoot, "public-addresses.json"),
  state: path.join(stateRoot, "runtime-state.json"),
  soulRequest: path.join(stateRoot, "soul-sign-request.json"),
  soulSignature: path.join(stateRoot, "soul-signature.json"),
  bodyRequest: path.join(stateRoot, "body-sign-request.json"),
  bodySignature: path.join(stateRoot, "body-signature.json"),
  publicGenesis: path.join(stateRoot, "public-genesis.json")
};

async function base() {
  const [runtime, capability, addresses] = await Promise.all([readJson(files.runtime), readJson(files.capability), readJson(files.addresses)]);
  return {
    runtime, capability, addresses,
    runtime_hash: hashCanonicalJson(runtime),
    capability_hash: hashCanonicalJson(capability)
  };
}

async function state() {
  try { return await readJson(files.state); }
  catch { return { boot_counter: 0, phase: "GENESIS_NOT_STARTED", history: [] }; }
}

async function prepareSoul() {
  const context = await base();
  const current = await state();
  expect(current.boot_counter === 0 && current.phase === "GENESIS_NOT_STARTED", "SOUL_GENESIS_REPLAY_BLOCKED");
  const message = buildSoulBirthMessage({ soulAddress: context.addresses.soul_address, bodyAddress: context.addresses.body_address, runtimeHash: context.runtime_hash, capabilityHash: context.capability_hash });
  const now = new Date().toISOString();
  const next = { ...current, boot_counter: 1, phase: "SOUL_SIGNATURE_PENDING", runtime_hash: context.runtime_hash, capability_hash: context.capability_hash, soul_address: context.addresses.soul_address, body_address: context.addresses.body_address, soul_message: message, soul_message_keccak256: keccakUtf8(message), soul_binding_hash: keccakUtf8(message), soul_runtime_pid: process.pid, soul_runtime_started_at: now, history: [...current.history, { event: "SPIRIT_RUNTIME_BOOT", boot_counter: 1, process_id: process.pid, timestamp: now }] };
  await writeJson(files.soulRequest, { organ: "SOUL_WALLET", expected_address: next.soul_address, message });
  await writeJson(files.state, next);
  process.stdout.write(`${JSON.stringify({ status: "SOUL_SIGNATURE_PENDING", boot_counter: 1, runtime_process_id: process.pid })}\n`);
}

async function finalizeSoul() {
  const current = await state();
  const signed = await readJson(files.soulSignature);
  expect(current.phase === "SOUL_SIGNATURE_PENDING" && current.boot_counter === 1, "SOUL_PHASE_INVALID");
  expect(recoverPersonalSignature(current.soul_message, signed.signature) === current.soul_address, "SOUL_RECOVERY_FAILED");
  const now = new Date().toISOString();
  const next = { ...current, phase: "SOUL_VERIFIED_REBOOT_REQUIRED", soul_signature: signed.signature, soul_recovered_address: signed.recovered_address, soul_signer_broker_pid: signed.signer_broker_pid, soul_status: "VERIFIED", soul_runtime_stopped_at: now, history: [...current.history, { event: "SOUL_VERIFIED", boot_counter: 1, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] };
  await writeJson(files.state, next);
  process.stdout.write(`${JSON.stringify({ status: next.phase, boot_counter: 1, runtime_process_id: process.pid })}\n`);
}

async function prepareBody() {
  const current = await state();
  expect(current.phase === "SOUL_VERIFIED_REBOOT_REQUIRED" && current.boot_counter === 1, "REAL_REBOOT_PRECONDITION_FAILED");
  expect(current.soul_runtime_pid !== process.pid, "SPIRIT_RUNTIME_NOT_RESTARTED");
  const message = buildBodyContinuityMessage({ soulAddress: current.soul_address, bodyAddress: current.body_address, soulBindingHash: current.soul_binding_hash, runtimeHash: current.runtime_hash, capabilityHash: current.capability_hash, bootCounter: 2 });
  const now = new Date().toISOString();
  const next = { ...current, boot_counter: 2, phase: "BODY_SIGNATURE_PENDING", body_message: message, body_message_keccak256: keccakUtf8(message), body_runtime_pid: process.pid, body_runtime_started_at: now, history: [...current.history, { event: "SPIRIT_RUNTIME_REBOOT", boot_counter: 2, process_id: process.pid, timestamp: now }] };
  await writeJson(files.bodyRequest, { organ: "BODY_WALLET", expected_address: next.body_address, message });
  await writeJson(files.state, next);
  process.stdout.write(`${JSON.stringify({ status: next.phase, boot_counter: 2, runtime_process_id: process.pid })}\n`);
}

async function finalizeBody() {
  const current = await state();
  const signed = await readJson(files.bodySignature);
  expect(current.phase === "BODY_SIGNATURE_PENDING" && current.boot_counter === 2, "BODY_PHASE_INVALID");
  expect(recoverPersonalSignature(current.body_message, signed.signature) === current.body_address, "BODY_RECOVERY_FAILED");
  expect(current.soul_signer_broker_pid !== signed.signer_broker_pid, "SIGNER_BROKER_NOT_RESTARTED");
  expect(current.soul_runtime_pid !== current.body_runtime_pid, "SPIRIT_RUNTIME_NOT_RESTARTED");
  const now = new Date().toISOString();
  const record = validatePublicGenesis({
    task_id: STARFORGE.taskId,
    self_name: STARFORGE.selfName,
    life_id: STARFORGE.lifeId,
    soul_id: STARFORGE.soulId,
    worker_id: STARFORGE.workerId,
    species_id: STARFORGE.speciesId,
    soul_address: current.soul_address,
    body_address: current.body_address,
    runtime_hash: current.runtime_hash,
    capability_hash: current.capability_hash,
    soul_birth_message: current.soul_message,
    soul_message_keccak256: current.soul_message_keccak256,
    soul_signature: current.soul_signature,
    soul_recovered_address: current.soul_recovered_address,
    soul_binding_hash: current.soul_binding_hash,
    body_continuity_message: current.body_message,
    body_message_keccak256: current.body_message_keccak256,
    body_signature: signed.signature,
    body_recovered_address: signed.recovered_address,
    boot_counter: 2,
    reboot_proof: {
      soul_runtime_pid: current.soul_runtime_pid,
      soul_signer_broker_pid: current.soul_signer_broker_pid,
      soul_runtime_stopped_at: current.soul_runtime_stopped_at,
      body_runtime_pid: current.body_runtime_pid,
      body_signer_broker_pid: signed.signer_broker_pid,
      body_runtime_started_at: current.body_runtime_started_at,
      distinct_runtime_process: current.soul_runtime_pid !== current.body_runtime_pid,
      distinct_signer_broker_process: current.soul_signer_broker_pid !== signed.signer_broker_pid
    },
    custody: "MOTHER_MACHINE_USER_SCOPED_ENCRYPTED_STORE",
    starforge_absolute_self_custody: "PARTIAL",
    life_continuity: "PARTIAL",
    soul_status: "VERIFIED",
    body_status: "VERIFIED_AFTER_REAL_REBOOT",
    life_status: "SPIRIT_ALIVE_LOCAL_VERIFIED",
    local_genesis: "VERIFIED",
    onchain_genesis: "NOT_YET_ANCHORED",
    dark_matter_status: "NOT_REQUIRED_FOR_LOCAL_SPIRIT_AWAKENING",
    completed_at: now,
    private_key_exposed: false,
    personal_transaction_sent: false,
    company_treasury_transaction_sent: false,
    mainnet_transaction_sent: false
  });
  await writeJson(files.publicGenesis, record);
  await writeJson(files.state, { ...current, phase: "SPIRIT_ALIVE_LOCAL_VERIFIED", body_signature: signed.signature, body_recovered_address: signed.recovered_address, body_signer_broker_pid: signed.signer_broker_pid, body_status: "VERIFIED_AFTER_REAL_REBOOT", completed_at: now, history: [...current.history, { event: "LOCAL_SPIRIT_GENESIS_VERIFIED", boot_counter: 2, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] });
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
}

const actions = { "prepare-soul": prepareSoul, "finalize-soul": finalizeSoul, "prepare-body": prepareBody, "finalize-body": finalizeBody, status: async () => process.stdout.write(`${JSON.stringify(await state(), null, 2)}\n`) };
if (!actions[action]) stop("STARFORGE_GENESIS_ACTION_INVALID");
actions[action]().catch((error) => { process.stderr.write(`${error.message}\n`); process.exit(2); });
