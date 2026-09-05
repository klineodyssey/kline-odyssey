import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DigitalLifeBirthResolver } from "../core/birth/digital-life-birth-resolver.mjs";
import {
  FileSpiritGenesisAnchorLedger,
  KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS,
  KAIOS_AI_COMPANY_ID,
  KAIOS_AI_COMPANY_PARENT_BASIS,
  KAIOS_AI_COMPANY_PARENT_POLICY_ID,
  deriveSpiritGenesisAnchorReplayProtectionId,
  serializeSpiritGenesisAnchorReplay,
  validateSpiritGenesisAnchorV2
} from "../core/birth/index.mjs";
import { NAIHE_SOURCE_POLICY, NaiheSourceRegistry, selectVerifiedNaiheCandidate } from "../core/birth/naihe-source-registry.mjs";
import { createCanonicalStarforgeEnergyWalletBinding } from "../core/life/starforge-energy-wallet.mjs";

const source = "0x1111111111111111111111111111111111111111";
const otherSource = "0x4444444444444444444444444444444444444444";
const attacker = "0x3333333333333333333333333333333333333333";
const txHashA = `0x${"a".repeat(64)}`;
const txHashC = `0x${"c".repeat(64)}`;
const blockHashB = `0x${"b".repeat(64)}`;
const blockHashD = `0x${"d".repeat(64)}`;
const life = { life_id: "LIFE-KAIOS-STARFORGE-0001", local_genesis: "VERIFIED" };
const activeMembership = Object.freeze({ life_id: life.life_id, company_id: KAIOS_AI_COMPANY_ID, membership_status: KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS, verification_status: "VERIFIED_COMPANY_REGISTRY" });
const trustedMembershipVerifier = async () => activeMembership;

async function bindingFixture() {
  const markdown = await fs.readFile(new URL("../KGEN-AI-Company/life/starforge/STARFORGE_BODY_UNIVERSE_V1_CANDIDATE.md", import.meta.url), "utf8");
  const match = markdown.match(/PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_START -->\r?\n```json\r?\n([\s\S]*?)\r?\n```\r?\n<!-- PUBLIC_ENERGY_BINDING_EVIDENCE_JSON_END/);
  assert.ok(match);
  const evidence = JSON.parse(match[1]);
  const binding = createCanonicalStarforgeEnergyWalletBinding({
    soulBinding: { message: evidence.soul_message, signature: evidence.soul_signature, expectedSoulAddress: evidence.soul_recovered_address, context: evidence.soul_context },
    bodyAcceptance: { message: evidence.body_message, signature: evidence.body_signature, expectedBodyAddress: evidence.body_recovered_address, context: evidence.body_context },
    processRestartProof: evidence.process_restart_proof
  });
  return { binding, energy: { address: evidence.energy_wallet_address }, soulContext: evidence.soul_context };
}

function candidateFor({ wallet, txHash = txHashA, blockNumber = 2, from = source } = {}) {
  return {
    kind: "NORMAL",
    from,
    recipient: wallet,
    value_wei: "8000000000000000",
    chain_id: 56,
    life_id: life.life_id,
    soul_id: "SOUL-KAIOS-STARFORGE-0001",
    birth_request_id: "REQ-1",
    challenge: "C-1",
    block_number: blockNumber,
    transaction_index: 0,
    tx_hash: txHash
  };
}

function contextFor(wallet) {
  return { lifeId: life.life_id, soulId: "SOUL-KAIOS-STARFORGE-0001", energyWalletAddress: wallet, birthRequestId: "REQ-1", challenge: "C-1" };
}

function testRegistry(options = {}) {
  return new NaiheSourceRegistry({
    mode: "TEST",
    sources: [
      { address: source, status: "MOCK_VERIFIED_TEST_ONLY", source_registry_id: "MOCK-4168" },
      { address: otherSource, status: "MOCK_VERIFIED_TEST_ONLY", source_registry_id: "MOCK-4168-OTHER" }
    ],
    ...options
  });
}

function rpcFixture({ wallet, transactions, latestBlock = 32, reorgBlock = null }) {
  const blockReads = new Map();
  const byHash = new Map(transactions.map((entry) => [entry.candidate.tx_hash.toLowerCase(), entry]));
  return {
    async send(method, params) {
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_blockNumber") return `0x${latestBlock.toString(16)}`;
      if (method === "eth_getTransactionReceipt") {
        const entry = byHash.get(String(params[0]).toLowerCase());
        return { status: "0x1", transactionHash: entry.candidate.tx_hash, transactionIndex: "0x0", blockNumber: `0x${entry.candidate.block_number.toString(16)}`, blockHash: entry.blockHash ?? blockHashB };
      }
      if (method === "eth_getTransactionByHash") {
        const entry = byHash.get(String(params[0]).toLowerCase());
        return { hash: entry.candidate.tx_hash, from: entry.rpcFrom, to: wallet, value: "0x1c6bf526340000", blockNumber: `0x${entry.candidate.block_number.toString(16)}`, blockHash: entry.blockHash ?? blockHashB, transactionIndex: "0x0" };
      }
      if (method === "eth_getBlockByNumber") {
        const blockNumber = Number(BigInt(params[0]));
        const count = (blockReads.get(blockNumber) ?? 0) + 1;
        blockReads.set(blockNumber, count);
        const entry = transactions.find((item) => item.candidate.block_number === blockNumber);
        const hash = reorgBlock === blockNumber && count > 1 ? blockHashD : (entry?.blockHash ?? blockHashB);
        return { number: params[0], hash, timestamp: "0x66c7c000" };
      }
      throw new Error(`unexpected method ${method}`);
    }
  };
}

async function ledgerFixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-anchor-ledger-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return { directory, ledger: new FileSpiritGenesisAnchorLedger({ directory }) };
}

test("production Naihe remains unconditionally fail closed while source is not deployed", () => {
  assert.equal(NAIHE_SOURCE_POLICY.status, "NOT_DEPLOYED");
  assert.equal(NAIHE_SOURCE_POLICY.canonical_registry_address, null);
  assert.equal(NAIHE_SOURCE_POLICY.canonical_registry_code_hash, null);
  assert.throws(() => new NaiheSourceRegistry(), (error) => error.code === "NAIHE_SOURCE_NOT_DEPLOYED");
  assert.throws(() => new NaiheSourceRegistry({ sources: [{ address: source, status: "INDEPENDENTLY_VERIFIED_DEPLOYED" }] }), (error) => error.code === "NAIHE_SOURCE_NOT_DEPLOYED");
  const registry = testRegistry();
  assert.throws(() => new DigitalLifeBirthResolver({ rpc: {}, tokens: {}, naiheSourceRegistry: registry }), (error) => error.code === "NAIHE_TEST_MODE_IN_PRODUCTION");
});

test("registry prequalification rejects spoof dust wrong fields and incomplete internal traces", async () => {
  const { energy } = await bindingFixture();
  const context = contextFor(energy.address);
  const candidate = candidateFor({ wallet: energy.address });
  const registry = testRegistry();
  assert.equal(selectVerifiedNaiheCandidate({ candidates: [{ ...candidate, from: attacker, block_number: 1 }, candidate], registry, context }).block_number, 2);
  for (const patchValue of [{ value_wei: "1" }, { recipient: source }, { chain_id: 1 }, { from: attacker }]) assert.equal(selectVerifiedNaiheCandidate({ candidates: [{ ...candidate, ...patchValue }], registry, context }), null);
  for (const omitted of ["trace_id", "trace_index", "trace_provider", "trace_type", "trace_success", "raw_trace_hash", "trace_from"]) {
    const internal = {
      ...candidate,
      kind: "INTERNAL",
      trace_id: "TRACE-1",
      trace_index: 0,
      trace_provider: "MOCK_TRACE_PROVIDER",
      trace_type: "CALL",
      trace_success: true,
      raw_trace_hash: `0x${"5".repeat(64)}`,
      trace_from: source,
      trace_to: energy.address,
      trace_value_wei: candidate.value_wei,
      trace_tx_hash: candidate.tx_hash,
      trace_block_number: candidate.block_number
    };
    delete internal[omitted];
    const strict = testRegistry({ trustedTraceProviders: ["MOCK_TRACE_PROVIDER"] });
    assert.throws(() => strict.verifyCandidate(internal, context));
  }
});

test("trusted internal trace requires structured independent attestation, not boolean true", async () => {
  const { energy } = await bindingFixture();
  const candidate = candidateFor({ wallet: energy.address });
  const internal = {
    ...candidate,
    kind: "INTERNAL",
    trace_id: "TRACE-1",
    trace_index: 0,
    trace_provider: "MOCK_TRACE_PROVIDER",
    trace_type: "CALL",
    trace_success: true,
    raw_trace_hash: `0x${"5".repeat(64)}`,
    trace_from: source,
    trace_to: energy.address,
    trace_value_wei: candidate.value_wei,
    trace_tx_hash: candidate.tx_hash,
    trace_block_number: candidate.block_number
  };
  const booleanRegistry = testRegistry({ trustedTraceProviders: ["MOCK_TRACE_PROVIDER"], trustedTraceVerifier: async () => true });
  const prequalified = booleanRegistry.verifyCandidate(internal, contextFor(energy.address));
  await assert.rejects(() => booleanRegistry.verifyInternalTrace(prequalified), (error) => error.code === "NAIHE_TRACE_ATTESTATION_REQUIRED");

  const attestation = { verified: true, trace_id: internal.trace_id, trace_index: 0, trace_provider: internal.trace_provider, trace_type: "CALL", trace_success: true, raw_trace_hash: internal.raw_trace_hash, trace_from: source, trace_to: energy.address, trace_value_wei: internal.value_wei, transaction_hash: internal.tx_hash, block_number: internal.block_number };
  const structuredRegistry = testRegistry({ trustedTraceProviders: ["MOCK_TRACE_PROVIDER"], trustedTraceVerifier: async () => attestation });
  const verified = await structuredRegistry.verifyInternalTrace(structuredRegistry.verifyCandidate(internal, contextFor(energy.address)));
  assert.equal(verified.source_evidence_type, "TRUSTED_INTERNAL_TRACE");
  await assert.rejects(() => testRegistry({ trustedTraceProviders: ["MOCK_TRACE_PROVIDER"], trustedTraceVerifier: async () => ({ ...attestation, raw_trace_hash: `0x${"6".repeat(64)}` }) }).verifyInternalTrace(prequalified), (error) => error.code === "NAIHE_TRACE_ATTESTATION_MISMATCH");
});

test("ONBOARDING is not active membership and leaves the regeneration parent unassigned without RPC", async () => {
  const { binding } = await bindingFixture();
  let rpcCalled = false;
  const resolver = new DigitalLifeBirthResolver({
    rpc: { send: async () => { rpcCalled = true; throw new Error("RPC must not run before active membership"); } },
    tokens: {},
    trustedCompanyMembershipVerifier: async () => ({ ...activeMembership, membership_status: "ONBOARDING" })
  });
  const record = await resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" });
  assert.equal(record.status, "PENDING");
  assert.equal(record.company_membership_status, "ONBOARDING");
  assert.equal(record.regeneration_parent_id, null);
  assert.equal(record.regeneration_parent_address, null);
  assert.equal(record.regeneration_parent_basis, "PENDING_ACTIVE_MEMBERSHIP");
  assert.equal(rpcCalled, false);
});

test("another company cannot inherit the KAIOS AI Company parent policy", async () => {
  const { binding } = await bindingFixture();
  const resolver = new DigitalLifeBirthResolver({
    rpc: {},
    tokens: {},
    trustedCompanyMembershipVerifier: async () => ({ ...activeMembership, company_id: "OTHER_AI_COMPANY_V1" })
  });
  await assert.rejects(
    () => resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" }),
    (error) => error.code === "COMPANY_PARENT_POLICY_SCOPE_MISMATCH"
  );
});

test("resolver selects the earliest candidate that passes registry RPC and finality verification", async (t) => {
  const { binding, energy } = await bindingFixture();
  const early = candidateFor({ wallet: energy.address, txHash: txHashA, blockNumber: 2 });
  const later = candidateFor({ wallet: energy.address, txHash: txHashC, blockNumber: 3 });
  const rpc = rpcFixture({ wallet: energy.address, transactions: [{ candidate: early, rpcFrom: attacker }, { candidate: later, rpcFrom: source }] });
  const { ledger } = await ledgerFixture(t);
  const resolver = new DigitalLifeBirthResolver({ rpc, tokens: {}, environment: "TEST", minimumConfirmations: 2, naiheSourceRegistry: testRegistry(), trustedCompanyMembershipVerifier: trustedMembershipVerifier, anchorLedger: ledger, historyIndexer: { listNativeIncoming: async () => [later, early] } });
  const record = await resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" });
  assert.equal(record.anchor_tx_hash, txHashC);
  assert.equal(record.anchor_block, 3);
  assert.equal(record.finality_status, "FINALIZED");
  assert.equal(record.canonical_block_verified, true);
  assert.equal(record.confirmation_count, 30);
  assert.equal(record.birth_source_address, source);
  assert.equal(record.company_id, KAIOS_AI_COMPANY_ID);
  assert.equal(record.company_membership_status, KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS);
  assert.equal(record.company_membership_evidence_status, "VERIFIED_COMPANY_REGISTRY");
  assert.equal(record.regeneration_parent_id, KAIOS_AI_COMPANY_ID);
  assert.equal(record.regeneration_parent_address, null);
  assert.equal(record.regeneration_parent_basis, KAIOS_AI_COMPANY_PARENT_BASIS);
  assert.equal(record.company_parent_policy_id, KAIOS_AI_COMPANY_PARENT_POLICY_ID);
  assert.equal(validateSpiritGenesisAnchorV2(record), record);
  assert.throws(() => validateSpiritGenesisAnchorV2({ ...record, regeneration_parent_address: source }), { code: "REGENERATION_PARENT_ADDRESS_NOT_FROZEN" });
  assert.match(serializeSpiritGenesisAnchorReplay(record), /^KAIOS_SPIRIT_GENESIS_ANCHOR_REPLAY_V1\n/);
  assert.equal(record.replay_protection_id, deriveSpiritGenesisAnchorReplayProtectionId(record));
});

test("resolver rejects raw wallet input and requires same-path canonical Soul and Body binding", async () => {
  const { energy } = await bindingFixture();
  const candidate = candidateFor({ wallet: energy.address });
  const resolver = new DigitalLifeBirthResolver({ rpc: rpcFixture({ wallet: energy.address, transactions: [{ candidate, rpcFrom: source }] }), tokens: {}, environment: "TEST", naiheSourceRegistry: testRegistry(), historyIndexer: { listNativeIncoming: async () => [candidate] } });
  await assert.rejects(() => resolver.resolveSpiritGenesisAnchor({ life, energyWalletAddress: energy.address, birthRequestId: "REQ-1", challenge: "C-1" }), (error) => error.code === "CANONICAL_ENERGY_BINDING_REQUIRED");
  await assert.rejects(() => resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: { binding_status: "VERIFIED_BOUND", life_id: life.life_id, soul_id: "SOUL-KAIOS-STARFORGE-0001", withVerifiedAddress: (operation) => operation(energy.address) }, birthRequestId: "REQ-1", challenge: "C-1" }), (error) => error.code === "CANONICAL_ENERGY_BINDING_REQUIRED");
});

test("finalized resolver refuses a structurally forged persistence adapter", async () => {
  const { binding, energy } = await bindingFixture();
  const candidate = candidateFor({ wallet: energy.address });
  const resolver = new DigitalLifeBirthResolver({
    rpc: rpcFixture({ wallet: energy.address, transactions: [{ candidate, rpcFrom: source }] }),
    tokens: {},
    environment: "TEST",
    minimumConfirmations: 2,
    naiheSourceRegistry: testRegistry(),
    trustedCompanyMembershipVerifier: trustedMembershipVerifier,
    anchorLedger: { commitAnchor: async () => ({ status: "COMMITTED" }) },
    historyIndexer: { listNativeIncoming: async () => [candidate] }
  });
  await assert.rejects(() => resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" }), (error) => error.code === "SPIRIT_ANCHOR_LEDGER_REQUIRED");
});

test("finality depth and canonical double-read fail closed on pending blocks and reorg", async (t) => {
  const { binding, energy } = await bindingFixture();
  const candidate = candidateFor({ wallet: energy.address });
  const pendingLedger = await ledgerFixture(t);
  const pending = new DigitalLifeBirthResolver({ rpc: rpcFixture({ wallet: energy.address, transactions: [{ candidate, rpcFrom: source }], latestBlock: 2 }), tokens: {}, environment: "TEST", minimumConfirmations: 3, naiheSourceRegistry: testRegistry(), trustedCompanyMembershipVerifier: trustedMembershipVerifier, anchorLedger: pendingLedger.ledger, historyIndexer: { listNativeIncoming: async () => [candidate] } });
  await assert.rejects(() => pending.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" }), (error) => error.code === "NAIHE_FINALITY_NOT_REACHED");

  const reorgLedger = await ledgerFixture(t);
  const reorg = new DigitalLifeBirthResolver({ rpc: rpcFixture({ wallet: energy.address, transactions: [{ candidate, rpcFrom: source }], reorgBlock: 2 }), tokens: {}, environment: "TEST", minimumConfirmations: 2, naiheSourceRegistry: testRegistry(), trustedCompanyMembershipVerifier: trustedMembershipVerifier, anchorLedger: reorgLedger.ledger, historyIndexer: { listNativeIncoming: async () => [candidate] } });
  await assert.rejects(() => reorg.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" }), (error) => error.code === "NAIHE_REORG_DETECTED");
});

test("persistent anchor ledger rejects replay and freezes the company parent identity", async (t) => {
  const { binding, energy } = await bindingFixture();
  const candidate = candidateFor({ wallet: energy.address });
  const rpc = rpcFixture({ wallet: energy.address, transactions: [{ candidate, rpcFrom: source }] });
  const { directory, ledger } = await ledgerFixture(t);
  const resolver = new DigitalLifeBirthResolver({ rpc, tokens: {}, environment: "TEST", minimumConfirmations: 2, naiheSourceRegistry: testRegistry(), trustedCompanyMembershipVerifier: trustedMembershipVerifier, anchorLedger: ledger, historyIndexer: { listNativeIncoming: async () => [candidate] } });
  const record = await resolver.resolveSpiritGenesisAnchor({ life, energyWalletBinding: binding, birthRequestId: "REQ-1", challenge: "C-1" });
  const reopened = new FileSpiritGenesisAnchorLedger({ directory });
  const persisted = await reopened.read({ lifeId: record.life_id, soulId: record.soul_id });
  assert.equal(persisted.count, 1);
  assert.equal(persisted.frozen_parent_id, KAIOS_AI_COMPANY_ID);
  assert.equal(persisted.frozen_parent_address, null);
  await assert.rejects(() => reopened.commitAnchor(record), (error) => error.code === "SPIRIT_ANCHOR_REPLAY");
  const parentFile = (await fs.readdir(directory)).find((name) => name.endsWith(".parent-freeze.json"));
  const originalParentMarker = await fs.readFile(path.join(directory, parentFile), "utf8");
  await fs.writeFile(path.join(directory, parentFile), `${JSON.stringify({ ...JSON.parse(originalParentMarker), frozen_parent_id: "OTHER_AI_COMPANY_V1" })}\n`, "utf8");
  const changed = { ...record, birth_source_address: otherSource, anchor_tx_hash: txHashC, anchor_block_hash: blockHashD, replay_protection_id: null };
  changed.replay_protection_id = deriveSpiritGenesisAnchorReplayProtectionId(changed);
  await assert.rejects(() => reopened.commitAnchor(changed), (error) => error.code === "SPIRIT_ANCHOR_PARENT_FROZEN");
  await fs.writeFile(path.join(directory, parentFile), originalParentMarker, "utf8");
  const ledgerFile = (await fs.readdir(directory)).find((name) => name.endsWith(".jsonl"));
  await fs.writeFile(path.join(directory, ledgerFile), "", "utf8");
  await assert.rejects(() => reopened.read({ lifeId: record.life_id, soulId: record.soul_id }), (error) => error.code === "SPIRIT_ANCHOR_LEDGER_MARKER_MISMATCH");
  await assert.rejects(() => reopened.commitAnchor(record), (error) => error.code === "SPIRIT_ANCHOR_REPLAY");

});
