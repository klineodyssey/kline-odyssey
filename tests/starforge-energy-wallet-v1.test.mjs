import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { hashCanonicalJson } from "../core/life/starforge-spirit-runtime.mjs";
import {
  assertEnergyWalletMethod,
  buildBodyEnergyAcceptanceMessage,
  buildSoulEnergyBindingMessage,
  calculateDynamicGasReserve,
  classifyEnergyState,
  consumeEnergyBindingReplay,
  readEnergyWalletBalances,
  verifyBodyEnergyAcceptance,
  verifySoulEnergyBinding
} from "../core/life/starforge-energy-wallet.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

test("Soul and Body bind one Energy wallet with mutation, address, chain and replay rejection", async () => {
  const soul = ethers.Wallet.createRandom();
  const body = ethers.Wallet.createRandom();
  const energy = ethers.Wallet.createRandom();
  const other = ethers.Wallet.createRandom();
  const h = hashCanonicalJson({ x: 1 });
  const soulChallenge = `0x${"1".repeat(64)}`;
  const bodyChallenge = `0x${"2".repeat(64)}`;
  const soulMessage = buildSoulEnergyBindingMessage({
    soulAddress: soul.address,
    bodyAddress: body.address,
    energyWalletAddress: energy.address,
    chainId: 56,
    bodyUniverseHash: h,
    capabilityExtensionHash: h,
    challenge: soulChallenge,
    issuedAt: "2026-08-21T16:23:31Z"
  });
  const soulSignature = await soul.signMessage(soulMessage);
  const soulVerification = verifySoulEnergyBinding({ message: soulMessage, signature: soulSignature, expectedSoulAddress: soul.address });
  assert.throws(() => verifySoulEnergyBinding({ message: `${soulMessage}x`, signature: soulSignature, expectedSoulAddress: soul.address }));
  assert.throws(() => verifySoulEnergyBinding({ message: soulMessage, signature: soulSignature, expectedSoulAddress: other.address }));

  const replaySet = new Set();
  consumeEnergyBindingReplay({ seen: replaySet, message: soulMessage });
  assert.throws(() => consumeEnergyBindingReplay({ seen: replaySet, message: soulMessage }), (error) => error.code === "ENERGY_BINDING_REPLAY");

  const bodyMessage = buildBodyEnergyAcceptanceMessage({
    soulAddress: soul.address,
    bodyAddress: body.address,
    energyWalletAddress: energy.address,
    chainId: 56,
    soulBindingHash: soulVerification.binding_hash,
    bodyUniverseHash: h,
    challenge: bodyChallenge,
    bootCounter: 4
  });
  const bodySignature = await body.signMessage(bodyMessage);
  assert.equal(verifyBodyEnergyAcceptance({ message: bodyMessage, signature: bodySignature, expectedBodyAddress: body.address }).status, "VERIFIED_AFTER_REAL_REBOOT");
  assert.throws(() => verifyBodyEnergyAcceptance({ message: bodyMessage, signature: bodySignature, expectedBodyAddress: other.address }));
  assert.throws(() => buildSoulEnergyBindingMessage({ soulAddress: soul.address, bodyAddress: body.address, energyWalletAddress: energy.address, chainId: 1, bodyUniverseHash: h, capabilityExtensionHash: h, challenge: soulChallenge, issuedAt: "x" }));
});

test("BNB and WBNB chambers remain separate and writes fail closed", async () => {
  assert.equal(classifyEnergyState({ bnbWei: 0n, wbnbRaw: 1n }).operational_status, "ASSET_PRESENT_BUT_OPERATIONALLY_STARVED");
  for (const method of ["eth_sendTransaction", "eth_sendRawTransaction", "approve", "transfer", "transferFrom", "swap", "wrap", "unwrap", "deploy"]) {
    assert.throws(() => assertEnergyWalletMethod(method));
  }
  assert.equal(calculateDynamicGasReserve({ gasEstimate: 21000n, gasPriceWei: 3n, recoverySteps: 2, safetyBps: 15000 }), 189000n);
  const rpc = { send: async (method) => method === "eth_chainId" ? "0x38" : method === "eth_getBalance" ? "0x0" : "0x1" };
  const value = await readEnergyWalletBalances({ rpc, address: ethers.Wallet.createRandom().address });
  assert.equal(value.bnb_gas_chamber, "EMPTY");
  assert.equal(value.wbnb_trade_chamber, "FUNDED");
});
