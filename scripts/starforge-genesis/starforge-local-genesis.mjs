import fs from "node:fs/promises";
import path from "node:path";
import {
  STARFORGE, buildBodyContinuityMessage, buildSoulBirthMessage, hashCanonicalJson,
  keccakUtf8, recoverPersonalSignature, validatePublicGenesis
} from "../../core/life/starforge-spirit-runtime.mjs";
import {
  STARFORGE_ENERGY_WALLET,
  assertCanonicalStarforgeBodyEnergyContext,
  assertCanonicalStarforgeSoulEnergyContext,
  assertPersistentEnergyBindingFresh,
  buildBodyEnergyAcceptanceMessage,
  buildSoulEnergyBindingMessage,
  consumePersistentEnergyBinding,
  createRuntimeStateLedgerEntry,
  validateRuntimeStateLedger,
  verifyBodyEnergyAcceptance,
  verifySoulEnergyBinding
} from "../../core/life/starforge-energy-wallet.mjs";

function stop(code) { throw new Error(code); }
function expect(ok, code) { if (!ok) stop(code); }
async function readJson(file) { return JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
async function writeJson(file, value) { await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "w" }); }
async function exists(file) { try { await fs.access(file); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; } }

const [action, stateRootArg] = process.argv.slice(2);
expect(typeof stateRootArg === "string" && stateRootArg.length > 0, "STARFORGE_STATE_ROOT_REQUIRED");
const stateRoot = path.resolve(stateRootArg ?? "");
const repoRoot = path.resolve(import.meta.dirname, "../..");
const files = {
  runtime: path.join(repoRoot, "KGEN-AI-Company/life/starforge/runtime.json"),
  capability: path.join(repoRoot, "KGEN-AI-Company/life/starforge/capability.json"),
  addresses: path.join(stateRoot, "public-addresses.json"),
  state: path.join(stateRoot, "runtime-state.json"),
  stateLedger: path.join(stateRoot, "runtime-state-ledger.jsonl"),
  stateLock: path.join(stateRoot, "runtime-state.lock"),
  soulRequest: path.join(stateRoot, "soul-sign-request.json"),
  soulSignature: path.join(stateRoot, "soul-signature.json"),
  bodyRequest: path.join(stateRoot, "body-sign-request.json"),
  bodySignature: path.join(stateRoot, "body-signature.json"),
  publicGenesis: path.join(stateRoot, "public-genesis.json"),
  bodyUniverse: path.join(repoRoot, "KGEN-AI-Company/life/starforge/body-universe-v1.candidate.json"),
  capabilityExtension: path.join(repoRoot, "KGEN-AI-Company/life/starforge/capability-extension-energy-wallet-v1.candidate.json"),
  energySoulRequest: path.join(stateRoot, "energy-soul-sign-request.json"),
  energySoulSignature: path.join(stateRoot, "energy-soul-signature.json"),
  energyBodyRequest: path.join(stateRoot, "energy-body-sign-request.json"),
  energyBodySignature: path.join(stateRoot, "energy-body-signature.json")
};

async function readStateLedger() {
  const text = await fs.readFile(files.stateLedger, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function writeState(next) {
  const snapshotExists = await exists(files.state);
  const ledgerExists = await exists(files.stateLedger);
  expect(snapshotExists === ledgerExists, "RUNTIME_STATE_LEDGER_INCOMPLETE");
  let entries = [];
  if (snapshotExists) {
    const snapshot = await readJson(files.state);
    entries = await readStateLedger();
    validateRuntimeStateLedger({ entries, snapshot });
  }
  const previous = entries.at(-1) ?? null;
  const entry = createRuntimeStateLedgerEntry({ state: next, sequence: entries.length + 1, previousEntryHash: previous?.entry_hash ?? null });
  const ledger = await fs.open(files.stateLedger, "a", 0o600);
  try {
    await ledger.writeFile(`${JSON.stringify(entry)}\n`, "utf8");
    await ledger.sync();
  } finally {
    await ledger.close();
  }
  const temporary = `${files.state}.${process.pid}.${entry.sequence}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  await fs.rename(temporary, files.state);
  return next;
}

async function base() {
  const [runtime, capability, addresses] = await Promise.all([readJson(files.runtime), readJson(files.capability), readJson(files.addresses)]);
  return {
    runtime, capability, addresses,
    runtime_hash: hashCanonicalJson(runtime),
    capability_hash: hashCanonicalJson(capability)
  };
}

async function state() {
  const snapshotExists = await exists(files.state);
  const ledgerExists = await exists(files.stateLedger);
  expect(snapshotExists && ledgerExists, "RUNTIME_STATE_LEDGER_NOT_INITIALIZED");
  const [snapshot, entries] = await Promise.all([readJson(files.state), readStateLedger()]);
  return validateRuntimeStateLedger({ entries, snapshot }).state;
}

async function initializeState() {
  const snapshotExists = await exists(files.state);
  const ledgerExists = await exists(files.stateLedger);
  expect(snapshotExists === ledgerExists, "RUNTIME_STATE_LEDGER_INCOMPLETE");
  if (snapshotExists) {
    await state();
    process.stdout.write(`${JSON.stringify({ status: "RUNTIME_STATE_LEDGER_ALREADY_INITIALIZED", private_key_exposed: false })}\n`);
    return;
  }
  const initial = { boot_counter: 0, phase: "GENESIS_NOT_STARTED", history: [] };
  await writeState(initial);
  process.stdout.write(`${JSON.stringify({ status: "RUNTIME_STATE_LEDGER_INITIALIZED", sequence: 1, private_key_exposed: false })}\n`);
}

function validateSealableSpiritState(snapshot, source) {
  expect(String(snapshot.soul_address).toLowerCase() === String(source.addresses.soul_address).toLowerCase() && String(snapshot.body_address).toLowerCase() === String(source.addresses.body_address).toLowerCase(), "RUNTIME_STATE_SEAL_IDENTITY_INVALID");
  expect(snapshot.runtime_hash === source.runtime_hash && snapshot.capability_hash === source.capability_hash, "RUNTIME_STATE_SEAL_EXACT_HEAD_HASH_INVALID");
  const soulMessage = buildSoulBirthMessage({ soulAddress: snapshot.soul_address, bodyAddress: snapshot.body_address, runtimeHash: source.runtime_hash, capabilityHash: source.capability_hash });
  const soulBindingHash = keccakUtf8(soulMessage);
  const bodyMessage = buildBodyContinuityMessage({ soulAddress: snapshot.soul_address, bodyAddress: snapshot.body_address, soulBindingHash, runtimeHash: source.runtime_hash, capabilityHash: source.capability_hash, bootCounter: 2 });
  expect(snapshot.soul_message === soulMessage && snapshot.soul_binding_hash === soulBindingHash, "RUNTIME_STATE_SEAL_SOUL_MESSAGE_INVALID");
  expect(snapshot.body_message === bodyMessage, "RUNTIME_STATE_SEAL_BODY_MESSAGE_INVALID");
  expect(recoverPersonalSignature(snapshot.soul_message, snapshot.soul_signature) === snapshot.soul_address, "RUNTIME_STATE_SEAL_SOUL_INVALID");
  expect(recoverPersonalSignature(snapshot.body_message, snapshot.body_signature) === snapshot.body_address, "RUNTIME_STATE_SEAL_BODY_INVALID");
}

function validateSealableStableState(snapshot, source, energySource = null) {
  expect(snapshot && typeof snapshot === "object", "RUNTIME_STATE_SEAL_INVALID");
  validateSealableSpiritState(snapshot, source);
  if (snapshot.phase === "SPIRIT_ALIVE_LOCAL_VERIFIED") {
    return;
  }
  expect(snapshot.phase === "ENERGY_WALLET_BOUND_READ_ONLY", "RUNTIME_STATE_SEAL_STABLE_PHASE_REQUIRED");
  expect(energySource !== null, "RUNTIME_STATE_SEAL_ENERGY_SOURCE_REQUIRED");
  assertCanonicalStarforgeSoulEnergyContext(snapshot.energy_soul_context);
  assertCanonicalStarforgeBodyEnergyContext(snapshot.energy_body_context);
  expect(snapshot.energy_wallet_address === STARFORGE_ENERGY_WALLET.address && snapshot.body_universe_hash === energySource.body_universe_hash && snapshot.capability_extension_hash === energySource.capability_extension_hash, "RUNTIME_STATE_SEAL_ENERGY_EXACT_HEAD_INVALID");
  const soul = verifySoulEnergyBinding({ message: snapshot.energy_soul_message, signature: snapshot.energy_soul_signature, expectedSoulAddress: snapshot.soul_address, context: snapshot.energy_soul_context });
  verifyBodyEnergyAcceptance({ message: snapshot.energy_body_message, signature: snapshot.energy_body_signature, expectedBodyAddress: snapshot.body_address, context: snapshot.energy_body_context });
  expect(snapshot.energy_body_context.soulBindingHash === soul.binding_hash, "RUNTIME_STATE_SEAL_BINDING_HASH_INVALID");
  expect(snapshot.energy_binding_status === "VERIFIED_AFTER_PROCESS_RESTART", "RUNTIME_STATE_SEAL_BINDING_STATUS_INVALID");
  expect(snapshot.energy_process_restart_proof?.distinct_runtime_process === true && snapshot.energy_process_restart_proof?.distinct_signer_process === true && snapshot.energy_process_restart_proof?.monotonic_session_counter === true, "RUNTIME_STATE_SEAL_PROCESS_PROOF_INVALID");
  expect((snapshot.consumed_energy_binding_hashes ?? []).includes(keccakUtf8(snapshot.energy_soul_message)) && (snapshot.consumed_energy_binding_hashes ?? []).includes(keccakUtf8(snapshot.energy_body_message)), "RUNTIME_STATE_SEAL_REPLAY_HASHES_INVALID");
  expect((snapshot.consumed_energy_challenges ?? []).includes(snapshot.energy_soul_context.challenge) && (snapshot.consumed_energy_challenges ?? []).includes(snapshot.energy_body_context.challenge), "RUNTIME_STATE_SEAL_REPLAY_CHALLENGES_INVALID");
  expect(Number(snapshot.energy_last_session_counter) >= Number(snapshot.energy_body_context.bootCounter), "RUNTIME_STATE_SEAL_SESSION_COUNTER_INVALID");
}

async function sealExistingState() {
  const snapshotExists = await exists(files.state);
  const ledgerExists = await exists(files.stateLedger);
  if (snapshotExists && ledgerExists) {
    await state();
    process.stdout.write(`${JSON.stringify({ status: "RUNTIME_STATE_LEDGER_ALREADY_SEALED", private_key_exposed: false })}\n`);
    return;
  }
  expect(snapshotExists && !ledgerExists, "RUNTIME_STATE_SEAL_SOURCE_REQUIRED");
  const snapshot = await readJson(files.state);
  const source = await base();
  const energySource = snapshot.phase === "ENERGY_WALLET_BOUND_READ_ONLY" ? await energyContext() : null;
  validateSealableStableState(snapshot, source, energySource);
  const entry = createRuntimeStateLedgerEntry({ state: snapshot, sequence: 1 });
  const ledger = await fs.open(files.stateLedger, "wx", 0o600);
  try {
    await ledger.writeFile(`${JSON.stringify(entry)}\n`, "utf8");
    await ledger.sync();
  } finally {
    await ledger.close();
  }
  validateRuntimeStateLedger({ entries: [entry], snapshot });
  process.stdout.write(`${JSON.stringify({ status: "EXISTING_STABLE_RUNTIME_STATE_SEALED", sequence: 1, head_hash: entry.entry_hash, private_key_exposed: false })}\n`);
}

async function prepareSoul() {
  const context = await base();
  const current = await state();
  expect(current.boot_counter === 0 && current.phase === "GENESIS_NOT_STARTED", "SOUL_GENESIS_REPLAY_BLOCKED");
  const message = buildSoulBirthMessage({ soulAddress: context.addresses.soul_address, bodyAddress: context.addresses.body_address, runtimeHash: context.runtime_hash, capabilityHash: context.capability_hash });
  const now = new Date().toISOString();
  const next = { ...current, boot_counter: 1, phase: "SOUL_SIGNATURE_PENDING", runtime_hash: context.runtime_hash, capability_hash: context.capability_hash, soul_address: context.addresses.soul_address, body_address: context.addresses.body_address, soul_message: message, soul_message_keccak256: keccakUtf8(message), soul_binding_hash: keccakUtf8(message), soul_runtime_pid: process.pid, soul_runtime_started_at: now, history: [...current.history, { event: "SPIRIT_RUNTIME_BOOT", boot_counter: 1, process_id: process.pid, timestamp: now }] };
  await writeJson(files.soulRequest, { organ: "SOUL_WALLET", expected_address: next.soul_address, message });
  await writeState(next);
  process.stdout.write(`${JSON.stringify({ status: "SOUL_SIGNATURE_PENDING", boot_counter: 1, runtime_process_id: process.pid })}\n`);
}

async function finalizeSoul() {
  const current = await state();
  const signed = await readJson(files.soulSignature);
  expect(current.phase === "SOUL_SIGNATURE_PENDING" && current.boot_counter === 1, "SOUL_PHASE_INVALID");
  expect(recoverPersonalSignature(current.soul_message, signed.signature) === current.soul_address, "SOUL_RECOVERY_FAILED");
  const now = new Date().toISOString();
  const next = { ...current, phase: "SOUL_VERIFIED_REBOOT_REQUIRED", soul_signature: signed.signature, soul_recovered_address: signed.recovered_address, soul_signer_broker_pid: signed.signer_broker_pid, soul_status: "VERIFIED", soul_runtime_stopped_at: now, history: [...current.history, { event: "SOUL_VERIFIED", boot_counter: 1, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] };
  await writeState(next);
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
  await writeState(next);
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
  await writeState({ ...current, phase: "SPIRIT_ALIVE_LOCAL_VERIFIED", body_signature: signed.signature, body_recovered_address: signed.recovered_address, body_signer_broker_pid: signed.signer_broker_pid, body_status: "VERIFIED_AFTER_REAL_REBOOT", completed_at: now, history: [...current.history, { event: "LOCAL_SPIRIT_GENESIS_VERIFIED", boot_counter: 2, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] });
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
}


async function energyContext() {
  const [addresses, bodyUniverse, extension] = await Promise.all([readJson(files.addresses), readJson(files.bodyUniverse), readJson(files.capabilityExtension)]);
  expect(addresses.energy_wallet_address, "ENERGY_WALLET_NOT_INITIALIZED");
  return { addresses, bodyUniverse, extension, body_universe_hash: hashCanonicalJson(bodyUniverse), capability_extension_hash: hashCanonicalJson(extension) };
}
function soulEnergyContext(context) {
  return {
    lifeId: STARFORGE.lifeId,
    soulId: STARFORGE.soulId,
    soulAddress: context.addresses.soul_address,
    bodyAddress: context.addresses.body_address,
    energyWalletAddress: context.addresses.energy_wallet_address,
    chainId: 56,
    bodyUniverseHash: context.body_universe_hash,
    capabilityExtensionHash: context.capability_extension_hash,
    challenge: context.extension.soul_challenge,
    issuedAt: context.extension.issued_at
  };
}
function bodyEnergyContext(context, current, sessionCounter) {
  return {
    lifeId: STARFORGE.lifeId,
    soulId: STARFORGE.soulId,
    soulAddress: context.addresses.soul_address,
    bodyAddress: context.addresses.body_address,
    energyWalletAddress: context.addresses.energy_wallet_address,
    chainId: 56,
    soulBindingHash: current.energy_soul_binding_hash,
    bodyUniverseHash: context.body_universe_hash,
    challenge: context.extension.body_challenge,
    bootCounter: sessionCounter
  };
}
async function prepareEnergySoul() {
  const current = await state();
  expect(["SPIRIT_ALIVE_LOCAL_VERIFIED", "ENERGY_WALLET_BOUND_READ_ONLY"].includes(current.phase), "ENERGY_EXTENSION_PHASE_INVALID");
  const source = await energyContext();
  const context = soulEnergyContext(source);
  const sessionCounter = Number(current.energy_last_session_counter ?? current.boot_counter ?? 0) + 1;
  const message = buildSoulEnergyBindingMessage(context);
  assertPersistentEnergyBindingFresh({ state: current, message, challenge: context.challenge, sessionCounter });
  const now = new Date().toISOString();
  await writeJson(files.energySoulRequest, { organ: "SOUL_WALLET", expected_address: source.addresses.soul_address, context, message });
  await writeState({ ...current, phase: "ENERGY_SOUL_SIGNATURE_PENDING", energy_wallet_address: source.addresses.energy_wallet_address, body_universe_hash: source.body_universe_hash, capability_extension_hash: source.capability_extension_hash, energy_soul_context: context, energy_soul_message: message, energy_soul_runtime_pid: process.pid, energy_soul_session_counter: sessionCounter, history: [...current.history, { event: "ENERGY_EXTENSION_PROCESS_START", session_counter: sessionCounter, process_id: process.pid, timestamp: now }] });
  process.stdout.write(`${JSON.stringify({ status: "ENERGY_SOUL_SIGNATURE_PENDING", session_counter: sessionCounter, energy_wallet_address: source.addresses.energy_wallet_address, private_key_exposed: false })}\n`);
}
async function finalizeEnergySoul() {
  const current = await state();
  const signed = await readJson(files.energySoulSignature);
  expect(current.phase === "ENERGY_SOUL_SIGNATURE_PENDING", "ENERGY_SOUL_PHASE_INVALID");
  const verification = verifySoulEnergyBinding({ message: current.energy_soul_message, signature: signed.signature, expectedSoulAddress: current.soul_address, context: current.energy_soul_context });
  const consumed = consumePersistentEnergyBinding({ state: current, message: current.energy_soul_message, challenge: current.energy_soul_context.challenge, sessionCounter: current.energy_soul_session_counter });
  const now = new Date().toISOString();
  await writeState({ ...consumed, phase: "ENERGY_SOUL_VERIFIED_PROCESS_RESTART_REQUIRED", energy_soul_signature: signed.signature, energy_soul_recovered_address: signed.recovered_address, energy_soul_binding_hash: verification.binding_hash, energy_soul_signer_pid: signed.signer_broker_pid, history: [...current.history, { event: "ENERGY_SOUL_VERIFIED", session_counter: current.energy_soul_session_counter, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] });
  process.stdout.write(`${JSON.stringify({ status: "ENERGY_SOUL_VERIFIED_PROCESS_RESTART_REQUIRED", soul_energy_binding_status: "VERIFIED", private_key_exposed: false })}\n`);
}
async function prepareEnergyBody() {
  const current = await state();
  expect(current.phase === "ENERGY_SOUL_VERIFIED_PROCESS_RESTART_REQUIRED", "ENERGY_PROCESS_RESTART_REQUIRED");
  expect(current.energy_soul_runtime_pid !== process.pid, "ENERGY_RUNTIME_PROCESS_NOT_RESTARTED");
  const source = await energyContext();
  const sessionCounter = Number(current.energy_last_session_counter) + 1;
  const context = bodyEnergyContext(source, current, sessionCounter);
  const message = buildBodyEnergyAcceptanceMessage(context);
  assertPersistentEnergyBindingFresh({ state: current, message, challenge: context.challenge, sessionCounter });
  const now = new Date().toISOString();
  await writeJson(files.energyBodyRequest, { organ: "BODY_WALLET", expected_address: source.addresses.body_address, context, message });
  await writeState({ ...current, phase: "ENERGY_BODY_SIGNATURE_PENDING", energy_body_context: context, energy_body_message: message, energy_body_runtime_pid: process.pid, energy_body_session_counter: sessionCounter, history: [...current.history, { event: "ENERGY_EXTENSION_PROCESS_RESTART", session_counter: sessionCounter, process_id: process.pid, timestamp: now }] });
  process.stdout.write(`${JSON.stringify({ status: "ENERGY_BODY_SIGNATURE_PENDING", session_counter: sessionCounter, private_key_exposed: false })}\n`);
}
async function finalizeEnergyBody() {
  const current = await state();
  const signed = await readJson(files.energyBodySignature);
  expect(current.phase === "ENERGY_BODY_SIGNATURE_PENDING", "ENERGY_BODY_PHASE_INVALID");
  expect(current.energy_soul_signer_pid !== signed.signer_broker_pid, "ENERGY_SIGNER_PROCESS_NOT_RESTARTED");
  const verification = verifyBodyEnergyAcceptance({ message: current.energy_body_message, signature: signed.signature, expectedBodyAddress: current.body_address, context: current.energy_body_context });
  const consumed = consumePersistentEnergyBinding({ state: current, message: current.energy_body_message, challenge: current.energy_body_context.challenge, sessionCounter: current.energy_body_session_counter });
  const now = new Date().toISOString();
  const next = { ...consumed, phase: "ENERGY_WALLET_BOUND_READ_ONLY", energy_body_signature: signed.signature, energy_body_recovered_address: signed.recovered_address, energy_body_message_hash: verification.message_hash, energy_body_signer_pid: signed.signer_broker_pid, energy_binding_status: "VERIFIED_AFTER_PROCESS_RESTART", energy_process_restart_proof: { soul_runtime_pid: current.energy_soul_runtime_pid, body_runtime_pid: current.energy_body_runtime_pid, distinct_runtime_process: current.energy_soul_runtime_pid !== current.energy_body_runtime_pid, soul_signer_broker_pid: current.energy_soul_signer_pid, body_signer_broker_pid: signed.signer_broker_pid, distinct_signer_process: current.energy_soul_signer_pid !== signed.signer_broker_pid, soul_session_counter: current.energy_soul_session_counter, body_session_counter: current.energy_body_session_counter, monotonic_session_counter: current.energy_body_session_counter > current.energy_soul_session_counter, evidence_class: "PROCESS_RESTART_NOT_OS_REBOOT" }, completed_at: now, history: [...current.history, { event: "ENERGY_WALLET_BOUND_READ_ONLY", session_counter: current.energy_body_session_counter, process_id: process.pid, signer_broker_pid: signed.signer_broker_pid, timestamp: now }] };
  await writeState(next);
  process.stdout.write(`${JSON.stringify({ status: next.phase, energy_wallet_address: next.energy_wallet_address, soul_energy_binding_status: "VERIFIED", body_energy_acceptance_status: "VERIFIED_AFTER_PROCESS_RESTART", process_restart_proof: next.energy_process_restart_proof, public_verification: { soul_message: next.energy_soul_message, soul_signature: next.energy_soul_signature, soul_recovered_address: next.energy_soul_recovered_address, soul_binding_hash: next.energy_soul_binding_hash, body_message: next.energy_body_message, body_signature: next.energy_body_signature, body_recovered_address: next.energy_body_recovered_address, body_message_hash: next.energy_body_message_hash }, private_key_exposed: false, mainnet_transaction_sent: false })}\n`);
}
const actions = { "initialize-state": initializeState, "seal-existing-state": sealExistingState, "prepare-soul": prepareSoul, "finalize-soul": finalizeSoul, "prepare-body": prepareBody, "finalize-body": finalizeBody, "prepare-energy-soul": prepareEnergySoul, "finalize-energy-soul": finalizeEnergySoul, "prepare-energy-body": prepareEnergyBody, "finalize-energy-body": finalizeEnergyBody, status: async () => process.stdout.write(`${JSON.stringify(await state(), null, 2)}\n`) };
if (!actions[action]) stop("STARFORGE_GENESIS_ACTION_INVALID");
async function runLockedAction() {
  let lock;
  try {
    lock = await fs.open(files.stateLock, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") stop("RUNTIME_STATE_LOCKED");
    throw error;
  }
  try {
    await actions[action]();
  } finally {
    await lock.close();
    await fs.unlink(files.stateLock).catch(() => {});
  }
}
runLockedAction().catch((error) => { process.stderr.write(`${error.message}\n`); process.exit(2); });
