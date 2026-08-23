import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSoulBirthMessage, hashCanonicalJson } from "../core/life/starforge-spirit-runtime.mjs";
import {
  STARFORGE_ENERGY_WALLET,
  assertCanonicalStarforgeEnergyWalletBinding,
  assertEnergySigningMessage,
  assertEnergyWalletMethod,
  assertPersistentEnergyBindingFresh,
  buildBodyEnergyAcceptanceMessage,
  buildSoulEnergyBindingMessage,
  calculateDynamicGasReserve,
  classifyEnergyState,
  consumePersistentEnergyBinding,
  createCanonicalStarforgeEnergyWalletBinding,
  createRuntimeStateLedgerEntry,
  readEnergyWalletBalances,
  validateRuntimeStateLedger,
  verifyBodyEnergyAcceptance,
  verifySoulEnergyBinding
} from "../core/life/starforge-energy-wallet.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

function contexts() {
  const soul = ethers.Wallet.createRandom();
  const body = ethers.Wallet.createRandom();
  const energy = ethers.Wallet.createRandom();
  const hash = hashCanonicalJson({ x: 1 });
  const soulContext = { lifeId: "LIFE-KAIOS-STARFORGE-0001", soulId: "SOUL-KAIOS-STARFORGE-0001", soulAddress: soul.address, bodyAddress: body.address, energyWalletAddress: energy.address, chainId: 56, bodyUniverseHash: hash, capabilityExtensionHash: hash, challenge: `0x${"1".repeat(64)}`, issuedAt: "2026-08-21T16:23:31Z" };
  return { soul, body, energy, hash, soulContext };
}

async function committedEnergyEvidence() {
  const markdown = await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/STARFORGE_BODY_UNIVERSE_V1_CANDIDATE.md", import.meta.url), "utf8");
  const match = markdown.match(/PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_START -->\n```json\n([\s\S]*?)\n```\n<!-- PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_END/);
  assert.ok(match);
  return JSON.parse(match[1]);
}

async function canonicalEnergyBinding() {
  const evidence = await committedEnergyEvidence();
  const binding = createCanonicalStarforgeEnergyWalletBinding({
    soulBinding: { message: evidence.soul_message, signature: evidence.soul_signature, expectedSoulAddress: evidence.soul_recovered_address, context: evidence.soul_context },
    bodyAcceptance: { message: evidence.body_message, signature: evidence.body_signature, expectedBodyAddress: evidence.body_recovered_address, context: evidence.body_context },
    processRestartProof: evidence.process_restart_proof
  });
  return { binding, evidence, energy: { address: evidence.energy_wallet_address }, soulContext: evidence.soul_context, bodyContext: evidence.body_context };
}

test("Soul and Body messages byte-match trusted context before signing or recovery", async () => {
  const { soul, body, energy, hash, soulContext } = contexts();
  const other = ethers.Wallet.createRandom();
  const soulMessage = buildSoulEnergyBindingMessage(soulContext);
  const soulSignature = await soul.signMessage(soulMessage);
  const soulVerification = verifySoulEnergyBinding({ message: soulMessage, signature: soulSignature, expectedSoulAddress: soul.address, context: soulContext });
  assert.throws(() => assertEnergySigningMessage({ organ: "SOUL_WALLET", message: soulMessage.replace(energy.address, other.address), context: soulContext }), (error) => error.code === "ENERGY_CANONICAL_MESSAGE_MISMATCH");
  assert.throws(() => verifySoulEnergyBinding({ message: soulMessage, signature: soulSignature, expectedSoulAddress: other.address, context: soulContext }), (error) => error.code === "SOUL_ENERGY_CONTEXT_MISMATCH");

  const bodyContext = { lifeId: soulContext.lifeId, soulId: soulContext.soulId, soulAddress: soul.address, bodyAddress: body.address, energyWalletAddress: energy.address, chainId: 56, soulBindingHash: soulVerification.binding_hash, bodyUniverseHash: hash, challenge: `0x${"2".repeat(64)}`, bootCounter: 4 };
  const bodyMessage = buildBodyEnergyAcceptanceMessage(bodyContext);
  const bodySignature = await body.signMessage(bodyMessage);
  assert.equal(verifyBodyEnergyAcceptance({ message: bodyMessage, signature: bodySignature, expectedBodyAddress: body.address, context: bodyContext }).status, "VERIFIED_AFTER_PROCESS_RESTART");
  assert.throws(() => assertEnergySigningMessage({ organ: "BODY_WALLET", message: bodyMessage.replace("boot_counter=4", "boot_counter=5"), context: bodyContext }), (error) => error.code === "ENERGY_CANONICAL_MESSAGE_MISMATCH");
  assert.throws(() => buildSoulEnergyBindingMessage({ ...soulContext, chainId: 1 }), (error) => error.code === "WRONG_CHAIN");
});

test("persistent consumed hashes, challenges and session counters reject replay", () => {
  const { soulContext } = contexts();
  const message = buildSoulEnergyBindingMessage(soulContext);
  const first = consumePersistentEnergyBinding({ state: { energy_last_session_counter: 2 }, message, challenge: soulContext.challenge, sessionCounter: 3 });
  assert.equal(first.energy_last_session_counter, 3);
  assert.throws(() => assertPersistentEnergyBindingFresh({ state: first, message, challenge: soulContext.challenge, sessionCounter: 4 }), (error) => error.code === "ENERGY_BINDING_REPLAY");
  assert.throws(() => consumePersistentEnergyBinding({ state: first, message, challenge: soulContext.challenge, sessionCounter: 4 }), (error) => error.code === "ENERGY_BINDING_REPLAY");
  assert.throws(() => consumePersistentEnergyBinding({ state: first, message: `${message}x`, challenge: soulContext.challenge, sessionCounter: 4 }), (error) => error.code === "ENERGY_CHALLENGE_REPLAY");
  assert.throws(() => consumePersistentEnergyBinding({ state: first, message: `${message}x`, challenge: `0x${"3".repeat(64)}`, sessionCounter: 3 }), (error) => error.code === "ENERGY_SESSION_REPLAY");
});

test("Canonical Energy Wallet capability requires jointly verified Soul and Body evidence", async () => {
  const evidence = await canonicalEnergyBinding();
  assert.equal(assertCanonicalStarforgeEnergyWalletBinding(evidence.binding, { lifeId: evidence.soulContext.lifeId, soulId: evidence.soulContext.soulId }), evidence.binding);
  assert.equal(evidence.binding.withVerifiedAddress((address) => address), evidence.energy.address);
  assert.equal(evidence.binding.capability, "A1_READ_ONLY");
  assert.equal("withVerifiedSigner" in evidence.binding, false);
  assert.throws(() => assertCanonicalStarforgeEnergyWalletBinding({ ...evidence.binding }), (error) => error.code === "CANONICAL_ENERGY_BINDING_REQUIRED");
  const attacker = ethers.Wallet.createRandom();
  assert.throws(() => createCanonicalStarforgeEnergyWalletBinding({
    soulBinding: { message: evidence.evidence.soul_message, signature: evidence.evidence.soul_signature, expectedSoulAddress: evidence.evidence.soul_recovered_address, context: evidence.soulContext },
    bodyAcceptance: { message: evidence.evidence.body_message, signature: evidence.evidence.body_signature, expectedBodyAddress: evidence.evidence.body_recovered_address, context: { ...evidence.bodyContext, energyWalletAddress: attacker.address } },
    processRestartProof: evidence.evidence.process_restart_proof
  }));

  const arbitrary = contexts();
  const arbitrarySoulMessage = buildSoulEnergyBindingMessage(arbitrary.soulContext);
  const arbitrarySoulSignature = await arbitrary.soul.signMessage(arbitrarySoulMessage);
  const arbitrarySoulHash = verifySoulEnergyBinding({ message: arbitrarySoulMessage, signature: arbitrarySoulSignature, expectedSoulAddress: arbitrary.soul.address, context: arbitrary.soulContext }).binding_hash;
  const arbitraryBodyContext = { lifeId: arbitrary.soulContext.lifeId, soulId: arbitrary.soulContext.soulId, soulAddress: arbitrary.soul.address, bodyAddress: arbitrary.body.address, energyWalletAddress: arbitrary.energy.address, chainId: 56, soulBindingHash: arbitrarySoulHash, bodyUniverseHash: arbitrary.hash, challenge: `0x${"2".repeat(64)}`, bootCounter: 4 };
  const arbitraryBodyMessage = buildBodyEnergyAcceptanceMessage(arbitraryBodyContext);
  const arbitraryBodySignature = await arbitrary.body.signMessage(arbitraryBodyMessage);
  assert.throws(() => createCanonicalStarforgeEnergyWalletBinding({
    soulBinding: { message: arbitrarySoulMessage, signature: arbitrarySoulSignature, expectedSoulAddress: arbitrary.soul.address, context: arbitrary.soulContext },
    bodyAcceptance: { message: arbitraryBodyMessage, signature: arbitraryBodySignature, expectedBodyAddress: arbitrary.body.address, context: arbitraryBodyContext },
    processRestartProof: { distinct_runtime_process: true, distinct_signer_process: true, soul_session_counter: 3, body_session_counter: 4, monotonic_session_counter: true, evidence_class: "PROCESS_RESTART_NOT_OS_REBOOT" }
  }), (error) => error.code === "ENERGY_CANONICAL_SOUL_MISMATCH");
});

test("runtime state ledger detects replay rollback deletion and corruption", () => {
  const initial = { boot_counter: 0, phase: "GENESIS_NOT_STARTED", history: [] };
  const first = createRuntimeStateLedgerEntry({ state: initial, sequence: 1 });
  const consumed = { boot_counter: 1, phase: "SOUL_SIGNATURE_PENDING", consumed_energy_binding_hashes: [`0x${"3".repeat(64)}`], consumed_energy_challenges: [`0x${"4".repeat(64)}`], energy_last_session_counter: 1, history: [] };
  const second = createRuntimeStateLedgerEntry({ state: consumed, sequence: 2, previousEntryHash: first.entry_hash });
  assert.equal(validateRuntimeStateLedger({ entries: [first, second], snapshot: consumed }).sequence, 2);
  assert.throws(() => validateRuntimeStateLedger({ entries: [first, second], snapshot: initial }), (error) => error.code === "RUNTIME_STATE_ROLLBACK_OR_CORRUPTION");
  assert.throws(() => validateRuntimeStateLedger({ entries: [], snapshot: initial }), (error) => error.code === "RUNTIME_STATE_LEDGER_REQUIRED");
  assert.throws(() => validateRuntimeStateLedger({ entries: [first, { ...second, previous_entry_hash: null }], snapshot: consumed }), (error) => error.code === "RUNTIME_LEDGER_CHAIN_BROKEN");
  assert.throws(() => validateRuntimeStateLedger({ entries: [first, { ...second, state: { ...consumed, phase: "ROLLED_BACK" } }], snapshot: consumed }), (error) => error.code === "RUNTIME_LEDGER_STATE_HASH_MISMATCH");
});

test("signer broker anchors requests to the independent ledger and rejects noncanonical Energy context", async (t) => {
  const { soul, body, energy, soulContext } = contexts();
  const message = buildSoulBirthMessage({ soulAddress: soul.address, bodyAddress: body.address, runtimeHash: hashCanonicalJson({ runtime: 1 }), capabilityHash: hashCanonicalJson({ capability: 1 }) });
  const state = { phase: "SOUL_SIGNATURE_PENDING", soul_address: soul.address, soul_message: message };
  const entry = createRuntimeStateLedgerEntry({ state, sequence: 1 });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-signer-state-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const statePath = path.join(directory, "runtime-state.json");
  const ledgerPath = path.join(directory, "runtime-state-ledger.jsonl");
  const requestPath = path.join(directory, "energy-request.json");
  await fs.writeFile(statePath, `${JSON.stringify(state)}\n`, "utf8");
  await fs.writeFile(ledgerPath, `${JSON.stringify(entry)}\n`, "utf8");
  await fs.writeFile(requestPath, `${JSON.stringify({ organ: "SOUL_WALLET", expected_address: soul.address, message })}\n`, "utf8");
  const broker = fileURLToPath(new URL("../core/security/starforge-signer-broker.mjs", import.meta.url));
  const valid = spawnSync(process.execPath, [broker, "sign-soul", requestPath, statePath, ledgerPath], { input: soul.privateKey, encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).recovered_address, soul.address);

  await fs.writeFile(requestPath, `${JSON.stringify({ organ: "SOUL_WALLET", expected_address: soul.address, message: `${message}x` })}\n`, "utf8");
  const rejected = spawnSync(process.execPath, [broker, "sign-soul", requestPath, statePath, ledgerPath], { input: soul.privateKey, encoding: "utf8" });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /TRUSTED_SIGNER_REQUEST_MISMATCH/);
  assert.equal(rejected.stdout.includes(soul.privateKey), false);
  assert.equal(rejected.stderr.includes(soul.privateKey), false);

  const energyMessage = buildSoulEnergyBindingMessage(soulContext);
  const energyState = { phase: "ENERGY_SOUL_SIGNATURE_PENDING", soul_address: soul.address, energy_soul_message: energyMessage, energy_soul_context: soulContext };
  const energyEntry = createRuntimeStateLedgerEntry({ state: energyState, sequence: 1 });
  await fs.writeFile(statePath, `${JSON.stringify(energyState)}\n`, "utf8");
  await fs.writeFile(ledgerPath, `${JSON.stringify(energyEntry)}\n`, "utf8");
  await fs.writeFile(requestPath, `${JSON.stringify({ organ: "SOUL_WALLET", expected_address: soul.address, context: soulContext, message: energyMessage })}\n`, "utf8");
  const noncanonical = spawnSync(process.execPath, [broker, "sign-energy-soul", requestPath, statePath, ledgerPath], { input: soul.privateKey, encoding: "utf8" });
  assert.notEqual(noncanonical.status, 0);
  assert.match(noncanonical.stderr, /ENERGY_CANONICAL_SOUL_MISMATCH/);
  assert.equal(noncanonical.stdout.includes(soul.privateKey), false);
  assert.equal(noncanonical.stderr.includes(soul.privateKey), false);
  assert.notEqual(energy.address, STARFORGE_ENERGY_WALLET.address);
});

test("BNB and canonical WBNB chambers remain separate and writes fail closed", async () => {
  assert.equal(classifyEnergyState({ bnbWei: 0n, wbnbRaw: 1n }).operational_status, "ASSET_PRESENT_BUT_OPERATIONALLY_STARVED");
  for (const method of ["eth_sendTransaction", "eth_sendRawTransaction", "approve", "transfer", "transferFrom", "swap", "wrap", "unwrap", "deploy"]) assert.throws(() => assertEnergyWalletMethod(method));
  assert.equal(calculateDynamicGasReserve({ gasEstimate: 21000n, gasPriceWei: 3n, recoverySteps: 2, safetyBps: 15000 }), 189000n);
  let calledToken;
  const rpc = { send: async (method, params) => {
    if (method === "eth_chainId") return "0x38";
    if (method === "eth_getBalance") return "0x0";
    calledToken = params[0].to;
    return "0x1";
  } };
  const value = await readEnergyWalletBalances({ rpc, address: ethers.Wallet.createRandom().address, wbnb: ethers.Wallet.createRandom().address });
  assert.equal(calledToken, STARFORGE_ENERGY_WALLET.wbnb);
  assert.equal(value.wbnb_contract, STARFORGE_ENERGY_WALLET.wbnb);
  assert.equal(value.bnb_gas_chamber, "EMPTY");
  assert.equal(value.wbnb_trade_chamber, "FUNDED");
});


test("committed public Energy evidence independently rebuilds and recovers both signatures", async () => {
  const evidence = await committedEnergyEvidence();
  const [bodyUniverse, capabilityExtension, genesis] = await Promise.all([
    fs.readFile(new URL("../KGEN-AI-Company/life/starforge/body-universe-v1.candidate.json", import.meta.url), "utf8").then(JSON.parse),
    fs.readFile(new URL("../KGEN-AI-Company/life/starforge/capability-extension-energy-wallet-v1.candidate.json", import.meta.url), "utf8").then(JSON.parse),
    fs.readFile(new URL("../KGEN-AI-Company/reports/STARFORGE_SPIRIT_LIFE_GENESIS_V1.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  assert.equal(hashCanonicalJson(bodyUniverse), evidence.body_universe_hash);
  assert.equal(hashCanonicalJson(capabilityExtension), evidence.capability_extension_hash);
  assert.equal(evidence.soul_context.soulAddress, genesis.soul_address);
  assert.equal(evidence.soul_context.bodyAddress, genesis.body_address);
  assert.equal(evidence.energy_wallet_address, STARFORGE_ENERGY_WALLET.address);
  assert.equal(evidence.body_universe_hash, STARFORGE_ENERGY_WALLET.body_universe_hash);
  assert.equal(evidence.capability_extension_hash, STARFORGE_ENERGY_WALLET.capability_extension_hash);
  assert.equal(buildSoulEnergyBindingMessage(evidence.soul_context), evidence.soul_message);
  const soul = verifySoulEnergyBinding({ message: evidence.soul_message, signature: evidence.soul_signature, expectedSoulAddress: evidence.soul_recovered_address, context: evidence.soul_context });
  assert.equal(soul.binding_hash, evidence.soul_binding_hash);
  assert.equal(buildBodyEnergyAcceptanceMessage(evidence.body_context), evidence.body_message);
  const body = verifyBodyEnergyAcceptance({ message: evidence.body_message, signature: evidence.body_signature, expectedBodyAddress: evidence.body_recovered_address, context: evidence.body_context });
  assert.equal(body.message_hash, evidence.body_message_hash);
  assert.equal(evidence.process_restart_proof.monotonic_session_counter, true);
  assert.equal(evidence.process_restart_proof.evidence_class, "PROCESS_RESTART_NOT_OS_REBOOT");
  assert.equal(evidence.private_key_exposed, false);
});
