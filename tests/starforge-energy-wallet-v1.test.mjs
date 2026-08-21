import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { hashCanonicalJson } from "../core/life/starforge-spirit-runtime.mjs";
import {
  STARFORGE_ENERGY_WALLET,
  assertEnergySigningMessage,
  assertEnergyWalletMethod,
  assertPersistentEnergyBindingFresh,
  buildBodyEnergyAcceptanceMessage,
  buildSoulEnergyBindingMessage,
  calculateDynamicGasReserve,
  classifyEnergyState,
  consumePersistentEnergyBinding,
  readEnergyWalletBalances,
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
  const markdown = await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/STARFORGE_BODY_UNIVERSE_V1_CANDIDATE.md", import.meta.url), "utf8");
  const match = markdown.match(/PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_START -->\n```json\n([\s\S]*?)\n```\n<!-- PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_END/);
  assert.ok(match);
  const evidence = JSON.parse(match[1]);
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
