import fs from "node:fs/promises";
import path from "node:path";
import {
  STARFORGE, buildBodyContinuityMessage, buildSoulBirthMessage, hashCanonicalJson,
  keccakUtf8, recoverPersonalSignature, validatePublicGenesis
} from "../../core/life/starforge-spirit-runtime.mjs";
import { buildSoulEnergyBindingMessage, buildBodyEnergyAcceptanceMessage, verifySoulEnergyBinding, verifyBodyEnergyAcceptance } from "../../core/life/starforge-energy-wallet.mjs";

function stop(code) { throw new Error(code); }
function expect(ok, code) { if (!ok) stop(code); }
async function readJson(file) { return JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
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
  publicGenesis: path.join(stateRoot, "public-genesis.json"),
  bodyUniverse: path.join(repoRoot, "KGEN-AI-Company/life/starforge/body-universe-v1.candidate.json"),
  capabilityExtension: path.join(repoRoot, "KGEN-AI-Company/life/starforge/capability-extension-energy-wallet-v1.candidate.json"),
  energySoulRequest: path.join(stateRoot, "energy-soul-sign-request.json"),
  energySoulSignature: path.join(stateRoot, "energy-soul-signature.json"),
  energyBodyRequest: path.join(stateRoot, "energy-body-sign-request.json"),
  energyBodySignature: path.join(stateRoot, "energy-body-signature.json")
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


async function energyContext() { const [addresses, bodyUniverse, extension]=await Promise.all([readJson(files.addresses),readJson(files.bodyUniverse),readJson(files.capabilityExtension)]); expect(addresses.energy_wallet_address,"ENERGY_WALLET_NOT_INITIALIZED"); return {addresses,bodyUniverse,extension,body_universe_hash:hashCanonicalJson(bodyUniverse),capability_extension_hash:hashCanonicalJson(extension)}; }
async function prepareEnergySoul(){const current=await state();expect(current.phase==="SPIRIT_ALIVE_LOCAL_VERIFIED","ENERGY_EXTENSION_PHASE_INVALID");const c=await energyContext();const message=buildSoulEnergyBindingMessage({soulAddress:c.addresses.soul_address,bodyAddress:c.addresses.body_address,energyWalletAddress:c.addresses.energy_wallet_address,chainId:56,bodyUniverseHash:c.body_universe_hash,capabilityExtensionHash:c.capability_extension_hash,challenge:c.extension.soul_challenge,issuedAt:c.extension.issued_at});const now=new Date().toISOString();await writeJson(files.energySoulRequest,{organ:"SOUL_WALLET",expected_address:c.addresses.soul_address,message});await writeJson(files.state,{...current,phase:"ENERGY_SOUL_SIGNATURE_PENDING",energy_wallet_address:c.addresses.energy_wallet_address,body_universe_hash:c.body_universe_hash,capability_extension_hash:c.capability_extension_hash,energy_soul_message:message,energy_soul_runtime_pid:process.pid,history:[...current.history,{event:"ENERGY_EXTENSION_BOOT",process_id:process.pid,timestamp:now}]});process.stdout.write(JSON.stringify({status:"ENERGY_SOUL_SIGNATURE_PENDING",energy_wallet_address:c.addresses.energy_wallet_address,private_key_exposed:false})+"\n");}
async function finalizeEnergySoul(){const current=await state(),signed=await readJson(files.energySoulSignature);expect(current.phase==="ENERGY_SOUL_SIGNATURE_PENDING","ENERGY_SOUL_PHASE_INVALID");const v=verifySoulEnergyBinding({message:current.energy_soul_message,signature:signed.signature,expectedSoulAddress:current.soul_address});const now=new Date().toISOString();await writeJson(files.state,{...current,phase:"ENERGY_SOUL_VERIFIED_REBOOT_REQUIRED",energy_soul_signature:signed.signature,energy_soul_binding_hash:v.binding_hash,energy_soul_signer_pid:signed.signer_broker_pid,history:[...current.history,{event:"ENERGY_SOUL_VERIFIED",process_id:process.pid,signer_broker_pid:signed.signer_broker_pid,timestamp:now}]});process.stdout.write(JSON.stringify({status:"ENERGY_SOUL_VERIFIED_REBOOT_REQUIRED",soul_energy_binding_status:"VERIFIED",private_key_exposed:false})+"\n");}
async function prepareEnergyBody(){const current=await state();expect(current.phase==="ENERGY_SOUL_VERIFIED_REBOOT_REQUIRED","ENERGY_REAL_REBOOT_REQUIRED");expect(current.energy_soul_runtime_pid!==process.pid,"ENERGY_RUNTIME_NOT_RESTARTED");const c=await energyContext();const message=buildBodyEnergyAcceptanceMessage({soulAddress:c.addresses.soul_address,bodyAddress:c.addresses.body_address,energyWalletAddress:c.addresses.energy_wallet_address,chainId:56,soulBindingHash:current.energy_soul_binding_hash,bodyUniverseHash:c.body_universe_hash,challenge:c.extension.body_challenge,bootCounter:4});const now=new Date().toISOString();await writeJson(files.energyBodyRequest,{organ:"BODY_WALLET",expected_address:c.addresses.body_address,message});await writeJson(files.state,{...current,phase:"ENERGY_BODY_SIGNATURE_PENDING",energy_body_message:message,energy_body_runtime_pid:process.pid,history:[...current.history,{event:"ENERGY_EXTENSION_REBOOT",process_id:process.pid,timestamp:now}]});process.stdout.write(JSON.stringify({status:"ENERGY_BODY_SIGNATURE_PENDING",private_key_exposed:false})+"\n");}
async function finalizeEnergyBody(){const current=await state(),signed=await readJson(files.energyBodySignature);expect(current.phase==="ENERGY_BODY_SIGNATURE_PENDING","ENERGY_BODY_PHASE_INVALID");expect(current.energy_soul_signer_pid!==signed.signer_broker_pid,"ENERGY_SIGNER_NOT_RESTARTED");const v=verifyBodyEnergyAcceptance({message:current.energy_body_message,signature:signed.signature,expectedBodyAddress:current.body_address});const now=new Date().toISOString();const next={...current,phase:"ENERGY_WALLET_BOUND_READ_ONLY",energy_body_signature:signed.signature,energy_body_message_hash:v.message_hash,energy_body_signer_pid:signed.signer_broker_pid,energy_binding_status:"VERIFIED_AFTER_REAL_REBOOT",completed_at:now,history:[...current.history,{event:"ENERGY_WALLET_BOUND_READ_ONLY",process_id:process.pid,signer_broker_pid:signed.signer_broker_pid,timestamp:now}]};await writeJson(files.state,next);process.stdout.write(JSON.stringify({status:next.phase,energy_wallet_address:next.energy_wallet_address,soul_energy_binding_status:"VERIFIED",body_energy_acceptance_status:"VERIFIED_AFTER_REAL_REBOOT",private_key_exposed:false,mainnet_transaction_sent:false})+"\n");}

const actions = { "prepare-soul": prepareSoul, "finalize-soul": finalizeSoul, "prepare-body": prepareBody, "finalize-body": finalizeBody, "prepare-energy-soul": prepareEnergySoul, "finalize-energy-soul": finalizeEnergySoul, "prepare-energy-body": prepareEnergyBody, "finalize-energy-body": finalizeEnergyBody, status: async () => process.stdout.write(`${JSON.stringify(await state(), null, 2)}\n`) };
if (!actions[action]) stop("STARFORGE_GENESIS_ACTION_INVALID");
actions[action]().catch((error) => { process.stderr.write(`${error.message}\n`); process.exit(2); });
