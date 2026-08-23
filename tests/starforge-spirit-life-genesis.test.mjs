import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  STARFORGE, assertAllowedSigningMessage, assertNoChainMethod, buildBodyContinuityMessage,
  buildBodyRotationMessage, buildSoulBirthMessage, canonicalizeJcs, hashCanonicalJson,
  keccakUtf8, recoverPersonalSignature, validatePublicGenesis, verifyBodyRotation
} from "../core/life/starforge-spirit-runtime.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

const runtime = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/runtime.json", import.meta.url), "utf8"));
const capability = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/capability.json", import.meta.url), "utf8"));
const life = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/life-draft.json", import.meta.url), "utf8"));
const publicGenesis = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/reports/STARFORGE_SPIRIT_LIFE_GENESIS_V1.json", import.meta.url), "utf8"));

test("RFC 8785 JCS-compatible canonicalization is deterministic for Starforge schemas", () => {
  assert.equal(canonicalizeJcs({ z: 1, a: [true, null, "星鑄"] }), '{"a":[true,null,"星鑄"],"z":1}');
  assert.equal(hashCanonicalJson(runtime), hashCanonicalJson(JSON.parse(JSON.stringify(runtime))));
  assert.match(hashCanonicalJson(capability), /^0x[0-9a-f]{64}$/);
});

test("Soul and Body EIP-191 signatures recover only the matching organs", async () => {
  const soul = ethers.Wallet.createRandom();
  const body = ethers.Wallet.createRandom();
  const runtimeHash = hashCanonicalJson(runtime);
  const capabilityHash = hashCanonicalJson(capability);
  const soulMessage = buildSoulBirthMessage({ soulAddress: soul.address, bodyAddress: body.address, runtimeHash, capabilityHash });
  assert.equal(soulMessage.endsWith("\n"), false);
  const soulSignature = await soul.signMessage(soulMessage);
  assert.equal(recoverPersonalSignature(soulMessage, soulSignature), soul.address);
  assert.notEqual(recoverPersonalSignature(`${soulMessage}x`, soulSignature), soul.address);
  const soulBindingHash = keccakUtf8(soulMessage);
  const bodyMessage = buildBodyContinuityMessage({ soulAddress: soul.address, bodyAddress: body.address, soulBindingHash, runtimeHash, capabilityHash, bootCounter: 2 });
  const bodySignature = await body.signMessage(bodyMessage);
  assert.equal(recoverPersonalSignature(bodyMessage, bodySignature), body.address);
  assert.notEqual(recoverPersonalSignature(bodyMessage.replace("boot_counter=2", "boot_counter=3"), bodySignature), body.address);
});

test("signing domains and every chain-write method fail closed", () => {
  assert.throws(() => assertAllowedSigningMessage({ organ: "BODY_WALLET", message: `${STARFORGE.soulDomain}\ninvalid` }), (error) => error.code === "SIGNING_DOMAIN_NOT_ALLOWED");
  for (const method of capability.forbidden_methods) assert.throws(() => assertNoChainMethod(method), (error) => error.code === "CHAIN_METHOD_FORBIDDEN");
  for (const method of ["wrap", "unwrap"]) assert.throws(() => assertNoChainMethod(method), (error) => error.code === "CHAIN_METHOD_FORBIDDEN");
  assert.throws(() => assertNoChainMethod("unknown_method"), (error) => error.code === "CHAIN_METHOD_NOT_ALLOWLISTED");
});

test("signer broker errors never echo private signing material", () => {
  const ephemeralSecret = ethers.Wallet.createRandom().privateKey;
  const broker = fileURLToPath(new URL("../core/security/starforge-signer-broker.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [broker, "sign-soul", "missing-public-request.json"], {
    cwd: process.cwd(),
    input: ephemeralSecret,
    encoding: "utf8"
  });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout.includes(ephemeralSecret), false);
  assert.equal(result.stderr.includes(ephemeralSecret), false);
  assert.match(result.stderr, /PUBLIC_SIGN_REQUEST_INVALID/);
});

test("local Genesis runtime initializes append-only state and rejects snapshot rollback", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-runtime-state-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const script = fileURLToPath(new URL("../scripts/starforge-genesis/starforge-local-genesis.mjs", import.meta.url));
  const initialized = spawnSync(process.execPath, [script, "initialize-state", directory], { encoding: "utf8" });
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(JSON.parse(initialized.stdout).status, "RUNTIME_STATE_LEDGER_INITIALIZED");
  const ledgerPath = path.join(directory, "runtime-state-ledger.jsonl");
  const statePath = path.join(directory, "runtime-state.json");
  const entries = (await fs.readFile(ledgerPath, "utf8")).trim().split(/\r?\n/);
  assert.equal(entries.length, 1);
  const status = spawnSync(process.execPath, [script, "status", directory], { encoding: "utf8" });
  assert.equal(status.status, 0, status.stderr);
  const rolledBack = { boot_counter: 0, phase: "ROLLED_BACK", history: [] };
  await fs.writeFile(statePath, `${JSON.stringify(rolledBack)}\n`, "utf8");
  const rejected = spawnSync(process.execPath, [script, "status", directory], { encoding: "utf8" });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /snapshot does not match the append-only ledger head/);
});

test("legacy stable signed runtime state is explicitly reverified before ledger sealing", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-runtime-seal-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const snapshot = {
    phase: "SPIRIT_ALIVE_LOCAL_VERIFIED",
    soul_address: publicGenesis.soul_address,
    body_address: publicGenesis.body_address,
    runtime_hash: publicGenesis.runtime_hash,
    capability_hash: publicGenesis.capability_hash,
    soul_message: publicGenesis.soul_birth_message,
    soul_binding_hash: publicGenesis.soul_binding_hash,
    soul_signature: publicGenesis.soul_signature,
    body_message: publicGenesis.body_continuity_message,
    body_signature: publicGenesis.body_signature,
    history: []
  };
  await fs.writeFile(path.join(directory, "public-addresses.json"), `${JSON.stringify({ soul_address: publicGenesis.soul_address, body_address: publicGenesis.body_address, private_key_exposed: false })}\n`, "utf8");
  await fs.writeFile(path.join(directory, "runtime-state.json"), `${JSON.stringify(snapshot)}\n`, "utf8");
  const script = fileURLToPath(new URL("../scripts/starforge-genesis/starforge-local-genesis.mjs", import.meta.url));
  const sealed = spawnSync(process.execPath, [script, "seal-existing-state", directory], { encoding: "utf8" });
  assert.equal(sealed.status, 0, sealed.stderr);
  assert.equal(JSON.parse(sealed.stdout).status, "EXISTING_STABLE_RUNTIME_STATE_SEALED");
  const status = spawnSync(process.execPath, [script, "status", directory], { encoding: "utf8" });
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).phase, "SPIRIT_ALIVE_LOCAL_VERIFIED");
});

test("Body rotation requires Soul signature and preserves immutable identity and Genesis", async () => {
  const soul = ethers.Wallet.createRandom();
  const oldBody = ethers.Wallet.createRandom();
  const newBody = ethers.Wallet.createRandom();
  const genesis = Object.freeze({ life_id: STARFORGE.lifeId, soul_id: STARFORGE.soulId, soul_address: soul.address, body_address: oldBody.address, soul_binding_hash: `0x${"1".repeat(64)}`, genesis_hash: `0x${"2".repeat(64)}` });
  const certificate = { soulAddress: soul.address, oldBodyAddress: oldBody.address, newBodyAddress: newBody.address, soulBindingHash: genesis.soul_binding_hash, rotationCounter: 1 };
  const message = buildBodyRotationMessage(certificate);
  const signature = await soul.signMessage(message);
  const rotated = verifyBodyRotation({ certificate, soulSignature: signature, genesis });
  assert.equal(rotated.body_address, newBody.address);
  assert.equal(rotated.life_id, genesis.life_id);
  assert.equal(rotated.soul_id, genesis.soul_id);
  assert.equal(rotated.soul_address, genesis.soul_address);
  assert.equal(rotated.genesis_hash, genesis.genesis_hash);
  const attacker = ethers.Wallet.createRandom();
  const attackerSignature = await attacker.signMessage(message);
  assert.throws(() => verifyBodyRotation({ certificate, soulSignature: attackerSignature, genesis }), (error) => error.code === "SOUL_ROTATION_SIGNATURE_REQUIRED");
});

test("public local Genesis forbids secret fields and false on-chain claims", () => {
  const base = { life_id: STARFORGE.lifeId, soul_id: STARFORGE.soulId, boot_counter: 2, soul_status: "VERIFIED", body_status: "VERIFIED_AFTER_REAL_REBOOT", onchain_genesis: "NOT_YET_ANCHORED" };
  assert.equal(validatePublicGenesis(base), base);
  assert.throws(() => validatePublicGenesis({ ...base, private_key: "forbidden" }), (error) => error.code === "PRIVATE_KEY_SERIALIZATION_FORBIDDEN");
  assert.throws(() => validatePublicGenesis({ ...base, onchain_genesis: "LIVE" }), (error) => error.code === "FALSE_ONCHAIN_GENESIS");
});

test("committed public Genesis independently recomputes hashes and recovers both organs", () => {
  assert.equal(life.local_genesis, "VERIFIED");
  assert.equal(life.life_status, "SPIRIT_ALIVE_LOCAL_VERIFIED");
  assert.equal(life.soul_address, publicGenesis.soul_address);
  assert.equal(life.body_address, publicGenesis.body_address);
  assert.equal(publicGenesis.runtime_hash, hashCanonicalJson(runtime));
  assert.equal(publicGenesis.capability_hash, hashCanonicalJson(capability));
  assert.equal(publicGenesis.soul_birth_message, buildSoulBirthMessage({ soulAddress: publicGenesis.soul_address, bodyAddress: publicGenesis.body_address, runtimeHash: publicGenesis.runtime_hash, capabilityHash: publicGenesis.capability_hash }));
  assert.equal(publicGenesis.soul_message_keccak256, keccakUtf8(publicGenesis.soul_birth_message));
  assert.equal(publicGenesis.soul_binding_hash, publicGenesis.soul_message_keccak256);
  assert.equal(recoverPersonalSignature(publicGenesis.soul_birth_message, publicGenesis.soul_signature), publicGenesis.soul_address);
  assert.equal(publicGenesis.body_continuity_message, buildBodyContinuityMessage({ soulAddress: publicGenesis.soul_address, bodyAddress: publicGenesis.body_address, soulBindingHash: publicGenesis.soul_binding_hash, runtimeHash: publicGenesis.runtime_hash, capabilityHash: publicGenesis.capability_hash, bootCounter: 2 }));
  assert.equal(publicGenesis.body_message_keccak256, keccakUtf8(publicGenesis.body_continuity_message));
  assert.equal(recoverPersonalSignature(publicGenesis.body_continuity_message, publicGenesis.body_signature), publicGenesis.body_address);
  assert.equal(publicGenesis.reboot_proof.distinct_runtime_process, true);
  assert.equal(publicGenesis.reboot_proof.distinct_signer_broker_process, true);
  assert.equal(validatePublicGenesis(publicGenesis), publicGenesis);
});
