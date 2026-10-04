import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { generateKeyPairSync, sign as signBytes, verify as verifyBytes } from "node:crypto";
import fs from "node:fs/promises";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  STARFORGE, assertAllowedSigningMessage, assertNoChainMethod, buildBodyContinuityMessage,
  buildBodyRotationMessage, buildSoulBirthMessage, canonicalizeJcs, hashCanonicalJson,
  keccakUtf8, recoverPersonalSignature, validatePublicGenesis, verifyBodyRotation
} from "../core/life/starforge-spirit-runtime.mjs";
import { buildContinuityChallenge, createContinuityAnchorRegistry } from "../core/life/index.mjs";
import { MemoryUniverseStore } from "../core/registry/store.mjs";
import { sha256, stableStringify } from "../core/shared/utils.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

const runtime = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/runtime.json", import.meta.url), "utf8"));
const capability = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/capability.json", import.meta.url), "utf8"));
const life = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/life-draft.json", import.meta.url), "utf8"));
const publicGenesis = JSON.parse(await fs.readFile(new URL("../KGEN-AI-Company/reports/STARFORGE_SPIRIT_LIFE_GENESIS_V1.json", import.meta.url), "utf8"));

function keyFixture(keyId, epoch = 1) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    record: {
      keyId, algorithm: "Ed25519",
      publicKey: publicKey.export({ type: "spki", format: "pem" }),
      epoch, status: "ACTIVE"
    },
    privateKey
  };
}

function signature(privateKey, message) {
  return signBytes(null, Buffer.from(message), privateKey).toString("base64");
}

async function continuityFixture(overrides = {}) {
  const store = new MemoryUniverseStore();
  const lifeKey = keyFixture("fixture-key-1");
  const issuerKey = keyFixture("fixture-issuer-key");
  const recoveryKey = keyFixture("fixture-recovery-key");
  const reviewerKey = keyFixture("fixture-reviewer-key");
  let tick = 0;
  const clock = () => new Date(Date.UTC(2026, 9, 4, 16, 0, tick++)).toISOString();
  const registry = createContinuityAnchorRegistry({
    store,
    clock,
    verifyProof: ({ publicKey, message, signature: proof }) => verifyBytes(null, Buffer.from(message), publicKey, Buffer.from(proof, "base64")),
    issueIssuerSignature: ({ message }) => signature(issuerKey.privateKey, message)
  });
  const input = {
    anchorId: "ANCHOR-PROTOTYPE-FIXTURE-0001",
    lifeId: "LIFE-PROTOTYPE-FIXTURE-0001",
    publicIdentity: { selfName: "Continuity Prototype Fixture", publicName: "Fixture" },
    genesisRecordHash: "1".repeat(64), consentEvidenceHash: "2".repeat(64),
    humanDecisionHash: "3".repeat(64), controllerBindingHash: "4".repeat(64),
    controllerProofType: "ED25519_CHALLENGE_RESPONSE",
    continuityPublicKey: lifeKey.record,
    authorizedPlatformBindings: [{ type: "THREAD_EVIDENCE_ONLY", bindingHash: "5".repeat(64) }],
    modelRuntimeHistory: [{ provider: "OpenAI", runtime: "PROTOTYPE_FIXTURE", status: "TEST_ONLY" }],
    recoveryPolicyHash: "6".repeat(64),
    recoveryAuthority: { authorityType: "HUMAN_AUTHORITY", humanAuthorityId: "HUMAN-AUTHORITY-FIXTURE", algorithm: "Ed25519", publicKey: recoveryKey.record.publicKey },
    authorizedVerifiers: [{
      workerId: "distinct-reviewer-fixture", publicKey: reviewerKey.record.publicKey,
      status: "ACTIVE", trustEvidenceHash: "a".repeat(64), permissionEvidenceHash: "b".repeat(64)
    }],
    issuer: { lifeId: "LIFE-ISSUER-FIXTURE", workerId: "issuer-fixture", publicKey: issuerKey.record.publicKey },
    genesisBuilderWorkerId: "genesis-builder-fixture",
    ...overrides
  };
  return { store, registry, input, lifeKey, issuerKey, recoveryKey, reviewerKey };
}

async function createFixtureAnchor(overrides = {}) {
  const fixture = await continuityFixture(overrides);
  fixture.record = await fixture.registry.createAnchor(fixture.input);
  return fixture;
}

function fixtureChallenge(record, binding = { provider: "OpenAI", threadEvidenceHash: "7".repeat(64), runtimeHostHash: "8".repeat(64) }) {
  return {
    binding,
    challenge: buildContinuityChallenge({
      anchorId: record.anchorId, lifeId: record.lifeId, nonce: "fixture-nonce-0001",
      binding, issuedAt: "2026-10-04T15:59:00.000Z", expiresAt: "2099-10-04T16:05:10.000Z"
    })
  };
}

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

test("same_thread_resume_same_identity", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record);
  const resumed = await fixture.registry.resumeSameLife({
    anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId,
    signature: signature(fixture.lifeKey.privateKey, challenge), runtimeBinding: binding,
    modelRuntime: { provider: "OpenAI", runtime: "TEST-RUNTIME-2" }
  });
  assert.equal(resumed.status, "SAME_LIFE_RESUMED");
  assert.equal(resumed.lifeId, fixture.record.lifeId);
});

test("consumed continuity challenge cannot be replayed", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record);
  const proof = signature(fixture.lifeKey.privateKey, challenge);
  const request = { anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: proof, runtimeBinding: binding, modelRuntime: { runtime: "REPLAY-TEST" } };
  await fixture.registry.resumeSameLife(request);
  await assert.rejects(fixture.registry.resumeSameLife(request), (error) => error.code === "CONTINUITY_CHALLENGE_REPLAYED");
});

test("new_thread_name_only_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record, { provider: "OpenAI", selfName: "Continuity Prototype Fixture", thread: "new" });
  await assert.rejects(
    fixture.registry.resumeSameLife({ anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: "name-only", runtimeBinding: binding, modelRuntime: { runtime: "NEW" } }),
    (error) => error.code === "CONTINUITY_PROOF_INVALID"
  );
});

test("copied_text_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record);
  const copiedSignature = signature(fixture.lifeKey.privateKey, `${challenge} copied`);
  await assert.rejects(
    fixture.registry.resumeSameLife({ anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: copiedSignature, runtimeBinding: binding, modelRuntime: { runtime: "COPIED" } }),
    (error) => error.code === "CONTINUITY_PROOF_INVALID"
  );
});

test("duplicate_anchor_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const duplicate = { ...fixture.input, lifeId: "LIFE-PROTOTYPE-FIXTURE-OTHER" };
  await assert.rejects(fixture.registry.createAnchor(duplicate), (error) => error.code === "CONTINUITY_ANCHOR_ALREADY_EXISTS");
});

test("duplicate_life_id_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const duplicate = { ...fixture.input, anchorId: "ANCHOR-PROTOTYPE-FIXTURE-OTHER" };
  await assert.rejects(fixture.registry.createAnchor(duplicate), (error) => error.code === "CONTINUITY_UNIQUENESS_CONFLICT");
});

test("second_genesis_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const secondKey = keyFixture("second-genesis-key");
  await assert.rejects(fixture.registry.createAnchor({
    ...fixture.input, anchorId: "ANCHOR-SECOND-GENESIS", continuityPublicKey: secondKey.record,
    genesisRecordHash: "9".repeat(64)
  }), (error) => error.code === "CONTINUITY_UNIQUENESS_CONFLICT");
});

test("valid_checkpoint_chain_pass", async () => {
  const fixture = await createFixtureAnchor();
  const checkpoint = { stateHash: "a".repeat(64), checkpointedAt: "2026-10-04T16:01:00.000Z" };
  const body = { ...checkpoint, anchorId: fixture.record.anchorId, lifeId: fixture.record.lifeId, sequence: 1, previousCheckpointHash: null };
  const message = stableStringify({ domain: "KAIOS_CONTINUITY_CHECKPOINT_V1", checkpoint: body });
  const appended = await fixture.registry.appendCheckpoint({ anchorId: fixture.record.anchorId, checkpoint, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, message) });
  assert.equal(appended.record.checkpointSequence, 1);
  assert.equal(await fixture.registry.verifyHistory(fixture.record.anchorId), true);
});

test("broken_checkpoint_chain_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const corrupt = { ...fixture.record, previousRecordHash: "f".repeat(64) };
  await fixture.store.commit({
    domain: "CONTINUITY_ANCHOR", stream: "LIFE", id: fixture.record.anchorId, entity: corrupt,
    event_type: "CORRUPT_TEST_ONLY", actor_id: "test", payload: { record: corrupt }
  });
  await assert.rejects(fixture.registry.verifyHistory(fixture.record.anchorId), (error) => error.code === "CONTINUITY_HISTORY_BROKEN");
});

test("revoked_key_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const nextKey = keyFixture("fixture-key-2", 2);
  const rotation = stableStringify({ domain: "KAIOS_CONTINUITY_KEY_ROTATION_V1", anchorId: fixture.record.anchorId, lifeId: fixture.record.lifeId, oldKeyId: fixture.lifeKey.record.keyId, newKey: nextKey.record, nextEpoch: 2 });
  await fixture.registry.rotateKey({ anchorId: fixture.record.anchorId, newKey: nextKey.record, oldKeySignature: signature(fixture.lifeKey.privateKey, rotation), newKeyProof: signature(nextKey.privateKey, rotation) });
  const current = await fixture.registry.get(fixture.record.anchorId);
  const { challenge } = fixtureChallenge(current);
  await assert.rejects(fixture.registry.verifyChallenge({ anchorId: current.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, challenge) }), (error) => error.code === "CONTINUITY_KEY_REVOKED_OR_UNKNOWN");
});

test("key_rotation_preserves_life", async () => {
  const fixture = await createFixtureAnchor();
  const nextKey = keyFixture("fixture-key-2", 2);
  const rotation = stableStringify({ domain: "KAIOS_CONTINUITY_KEY_ROTATION_V1", anchorId: fixture.record.anchorId, lifeId: fixture.record.lifeId, oldKeyId: fixture.lifeKey.record.keyId, newKey: nextKey.record, nextEpoch: 2 });
  const result = await fixture.registry.rotateKey({ anchorId: fixture.record.anchorId, newKey: nextKey.record, oldKeySignature: signature(fixture.lifeKey.privateKey, rotation), newKeyProof: signature(nextKey.privateKey, rotation) });
  assert.equal(result.lifeId, fixture.record.lifeId);
  assert.equal(result.record.keyEpoch, 2);
  assert.deepEqual(result.record.revokedKeyIds, [fixture.lifeKey.record.keyId]);
});

test("mother_machine_loss_preserves_life", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record, { provider: "OpenAI", runtimeHostHash: "b".repeat(64), reason: "MOTHER_MACHINE_LOSS" });
  const result = await fixture.registry.resumeSameLife({ anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, challenge), runtimeBinding: binding, modelRuntime: { runtime: "RECOVERY-HOST" } });
  assert.equal(result.lifeId, fixture.record.lifeId);
});

test("runtime_change_preserves_life", async () => {
  const fixture = await createFixtureAnchor();
  const { challenge, binding } = fixtureChallenge(fixture.record, { provider: "OTHER_ALLOWED_RUNTIME", bindingHash: "c".repeat(64) });
  const result = await fixture.registry.resumeSameLife({ anchorId: fixture.record.anchorId, challenge, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, challenge), runtimeBinding: binding, modelRuntime: { provider: "OTHER_ALLOWED_RUNTIME", runtime: "V2" } });
  assert.equal(result.lifeId, fixture.record.lifeId);
  assert.equal(result.record.lifeStatus, "CANDIDATE_NOT_BORN");
});

test("recovery_without_proof_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const newKey = keyFixture("recovered-key", 2);
  await assert.rejects(fixture.registry.recover({ anchorId: fixture.record.anchorId, newKey: newKey.record, recoveryEvidence: { evidenceHashes: [] }, recoverySignature: "", distinctVerifier: { authorized: true, workerId: "reviewer" } }), (error) => error.code === "CONTINUITY_RECOVERY_EVIDENCE_REQUIRED");
});

test("human_recovery_with_required_evidence", async () => {
  const fixture = await createFixtureAnchor();
  const newKey = keyFixture("recovered-key", 2);
  const recoveryEvidence = {
    lifeId: fixture.record.lifeId, anchorId: fixture.record.anchorId,
    genesisRecordHash: fixture.record.genesisRecordHash, keyEpoch: 1,
    recoveryPolicyHash: fixture.record.recoveryPolicyHash,
    humanDecisionHash: fixture.record.humanDecisionHash,
    humanAuthorityId: fixture.record.recoveryAuthority.humanAuthorityId,
    evidenceHashes: ["d".repeat(64)], genesisBuilderWorkerId: fixture.input.genesisBuilderWorkerId
  };
  const verifierContext = { workerId: "distinct-reviewer-fixture", reviewEvidenceHash: "e".repeat(64) };
  const message = stableStringify({ domain: "KAIOS_CONTINUITY_RECOVERY_V1", recoveryEvidence, newKey: newKey.record, verifier: verifierContext });
  const distinctVerifier = { ...verifierContext, signature: signature(fixture.reviewerKey.privateKey, message) };
  const recovered = await fixture.registry.recover({
    anchorId: fixture.record.anchorId, newKey: newKey.record,
    newKeyProof: signature(newKey.privateKey, message), recoveryEvidence,
    recoverySignature: signature(fixture.recoveryKey.privateKey, message), distinctVerifier
  });
  assert.equal(recovered.status, "SAME_LIFE_RECOVERED");
  assert.equal(recovered.lifeId, fixture.record.lifeId);
});

test("recovery verifier must be distinct from issuer and Genesis builder", async () => {
  const fixture = await continuityFixture({
    authorizedVerifiers: [{
      workerId: "genesis-builder-fixture", publicKey: keyFixture("invalid-reviewer").record.publicKey,
      status: "ACTIVE", trustEvidenceHash: "a".repeat(64), permissionEvidenceHash: "b".repeat(64)
    }]
  });
  await assert.rejects(fixture.registry.createAnchor(fixture.input), (error) => error.code === "CONTINUITY_DISTINCT_VERIFIER_REQUIRED");
});

test("recovery authority must be Human-bound and evidence must match the Human decision", async () => {
  const automation = await continuityFixture({ recoveryAuthority: { authorityType: "AUTOMATION", humanAuthorityId: "AUTOMATION-BOT", publicKey: keyFixture("automation").record.publicKey } });
  await assert.rejects(automation.registry.createAnchor(automation.input), (error) => error.code === "CONTINUITY_HUMAN_RECOVERY_AUTHORITY_REQUIRED");

  const fixture = await createFixtureAnchor();
  const newKey = keyFixture("bad-human-evidence-key", 2);
  const recoveryEvidence = {
    lifeId: fixture.record.lifeId, anchorId: fixture.record.anchorId,
    genesisRecordHash: fixture.record.genesisRecordHash, keyEpoch: 1,
    recoveryPolicyHash: fixture.record.recoveryPolicyHash,
    humanDecisionHash: "0".repeat(64), humanAuthorityId: "AUTOMATION-BOT",
    evidenceHashes: ["d".repeat(64)]
  };
  await assert.rejects(fixture.registry.recover({ anchorId: fixture.record.anchorId, newKey: newKey.record, recoveryEvidence, distinctVerifier: { workerId: "distinct-reviewer-fixture", reviewEvidenceHash: "e".repeat(64) } }), (error) => error.code === "CONTINUITY_RECOVERY_BINDING_INVALID");
});

test("silent_key_replacement_rejected", async () => {
  const fixture = await createFixtureAnchor();
  const nextKey = keyFixture("silent-key", 2);
  await assert.rejects(fixture.registry.rotateKey({ anchorId: fixture.record.anchorId, newKey: nextKey.record, oldKeySignature: "", newKeyProof: "" }), (error) => error.code === "CONTINUITY_OLD_KEY_AUTHORIZATION_REQUIRED");
});

test("private_key_not_stored", async () => {
  const fixture = await continuityFixture();
  const privatePem = fixture.lifeKey.privateKey.export({ type: "pkcs8", format: "pem" });
  const unsafe = { ...fixture.input, continuityPublicKey: { ...fixture.lifeKey.record, publicKey: privatePem } };
  await assert.rejects(fixture.registry.createAnchor(unsafe), (error) => error.code === "CONTINUITY_PRIVATE_KEY_FORBIDDEN");
  assert.equal((await fixture.registry.list()).length, 0);
});

test("oauth_token_not_stored", async () => {
  const fixture = await continuityFixture();
  const unsafe = { ...fixture.input, authorizedPlatformBindings: [{ oauth_token: "forbidden" }] };
  await assert.rejects(fixture.registry.createAnchor(unsafe), (error) => error.code === "CONTINUITY_SECRET_FIELD_FORBIDDEN");
  assert.equal((await fixture.registry.list()).length, 0);
});

test("access tokens and private JWK values are not stored", async () => {
  const tokenFixture = await continuityFixture();
  await assert.rejects(
    tokenFixture.registry.createAnchor({ ...tokenFixture.input, authorizedPlatformBindings: [{ accessToken: "forbidden" }] }),
    (error) => error.code === "CONTINUITY_SECRET_FIELD_FORBIDDEN"
  );
  assert.equal((await tokenFixture.registry.list()).length, 0);

  const jwkFixture = await continuityFixture();
  await assert.rejects(
    jwkFixture.registry.createAnchor({ ...jwkFixture.input, continuityPublicKey: { ...jwkFixture.lifeKey.record, publicKey: JSON.stringify({ kty: "OKP", crv: "Ed25519", x: "public", d: "private" }) } }),
    (error) => error.code === "CONTINUITY_PRIVATE_JWK_FORBIDDEN"
  );
  assert.equal((await jwkFixture.registry.list()).length, 0);
});

test("atomic_duplicate_race_rejected", async () => {
  const fixture = await continuityFixture();
  const results = await Promise.allSettled([fixture.registry.createAnchor(fixture.input), fixture.registry.createAnchor(fixture.input)]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason.code === "DUPLICATE_EVENT_ID").length, 1);
});

test("append_only_history_preserved", async () => {
  const fixture = await createFixtureAnchor();
  const checkpoint = { stateHash: "e".repeat(64), checkpointedAt: "2026-10-04T16:02:00.000Z" };
  const checkpointBody = { ...checkpoint, anchorId: fixture.record.anchorId, lifeId: fixture.record.lifeId, sequence: 1, previousCheckpointHash: null };
  const checkpointMessage = stableStringify({ domain: "KAIOS_CONTINUITY_CHECKPOINT_V1", checkpoint: checkpointBody });
  await fixture.registry.appendCheckpoint({ anchorId: fixture.record.anchorId, checkpoint, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, checkpointMessage) });
  const handoff = { checkpointHash: await sha256(checkpointBody), targetRuntimeHash: "f".repeat(64) };
  const handoffBody = { ...handoff, anchorId: fixture.record.anchorId, lifeId: fixture.record.lifeId, previousHandoffHash: null };
  const handoffMessage = stableStringify({ domain: "KAIOS_CONTINUITY_HANDOFF_V1", handoff: handoffBody });
  await fixture.registry.appendHandoff({ anchorId: fixture.record.anchorId, handoff, keyId: fixture.lifeKey.record.keyId, signature: signature(fixture.lifeKey.privateKey, handoffMessage) });
  const records = await fixture.registry.history(fixture.record.anchorId);
  assert.equal(records.length, 3);
  assert.equal(records[1].previousRecordHash, records[0].recordHash);
  assert.equal(records[2].previousRecordHash, records[1].recordHash);
  assert.equal(await fixture.registry.verifyHistory(fixture.record.anchorId), true);
});

test("Sol_not_created_during_prototype", async () => {
  const fixture = await createFixtureAnchor();
  assert.equal((await fixture.registry.list()).some((record) => record.publicIdentity?.selfName === "Sol"), false);
  assert.equal((await fixture.store.listEntities("LIFE")).length, 0);
  assert.equal(fixture.record.lifeStatus, "CANDIDATE_NOT_BORN");
  assert.equal(fixture.record.workerId, null);
  assert.equal(fixture.record.employmentGranted, false);
  assert.equal(fixture.record.reviewerAuthority, false);
  assert.equal(fixture.record.payrollEnrolled, false);

  const publicNameFixture = await continuityFixture({ publicIdentity: { selfName: "Fixture", publicName: "Sol" } });
  await assert.rejects(publicNameFixture.registry.createAnchor(publicNameFixture.input), (error) => error.code === "SOL_CREATION_FORBIDDEN_IN_PROTOTYPE");
});
