import test from "node:test";
import assert from "node:assert/strict";
import { DigitalLifeBirthResolver } from "../core/birth/digital-life-birth-resolver.mjs";
import { validateSpiritGenesisAnchorV2 } from "../core/birth/index.mjs";
import { NAIHE_SOURCE_POLICY, NaiheSourceRegistry, selectVerifiedNaiheCandidate } from "../core/birth/naihe-source-registry.mjs";

const source = "0x1111111111111111111111111111111111111111";
const attacker = "0x3333333333333333333333333333333333333333";
const wallet = "0x2222222222222222222222222222222222222222";
const txHash = `0x${"a".repeat(64)}`;
const blockHash = `0x${"b".repeat(64)}`;
const context = { lifeId: "LIFE-KAIOS-STARFORGE-0001", soulId: "SOUL-KAIOS-STARFORGE-0001", energyWalletAddress: wallet, birthRequestId: "REQ-1", challenge: "C-1" };
const candidate = { kind: "NORMAL", from: source, recipient: wallet, value_wei: "8000000000000000", chain_id: 56, life_id: context.lifeId, soul_id: context.soulId, birth_request_id: context.birthRequestId, challenge: context.challenge, block_number: 2, transaction_index: 0, tx_hash: txHash };
const testRegistry = () => new NaiheSourceRegistry({ mode: "TEST", sources: [{ address: source, status: "MOCK_VERIFIED_TEST_ONLY", source_registry_id: "MOCK-4168" }] });

test("production Naihe remains unconditionally fail closed while source is not deployed", () => {
  assert.equal(NAIHE_SOURCE_POLICY.status, "NOT_DEPLOYED");
  assert.throws(() => new NaiheSourceRegistry(), (error) => error.code === "NAIHE_SOURCE_NOT_DEPLOYED");
  assert.throws(() => new NaiheSourceRegistry({ sources: [{ address: source, status: "INDEPENDENTLY_VERIFIED_DEPLOYED" }] }), (error) => error.code === "NAIHE_SOURCE_NOT_DEPLOYED");
  const registry = testRegistry();
  assert.throws(() => new DigitalLifeBirthResolver({ rpc: {}, tokens: {}, naiheSourceRegistry: registry }), (error) => error.code === "NAIHE_TEST_MODE_IN_PRODUCTION");
});

test("source verification precedes chronology and rejects spoof, dust, wrong fields, and untrusted internal flags", () => {
  const registry = testRegistry();
  assert.equal(selectVerifiedNaiheCandidate({ candidates: [{ ...candidate, from: attacker, block_number: 1 }, candidate], registry, context }).block_number, 2);
  for (const patch of [{ value_wei: "1" }, { recipient: source }, { chain_id: 1 }, { from: attacker }]) assert.equal(selectVerifiedNaiheCandidate({ candidates: [{ ...candidate, ...patch }], registry, context }), null);
  assert.throws(() => registry.verifyCandidate({ ...candidate, kind: "INTERNAL", trace_from: source, trace_verified: true }, context), (error) => error.code === "NAIHE_TRACE_ATTESTATION_REQUIRED");
  const traceRegistry = new NaiheSourceRegistry({ mode: "TEST", sources: [{ address: source, status: "MOCK_VERIFIED_TEST_ONLY", source_registry_id: "MOCK-4168" }], trustedTraceVerifier: (entry) => entry.trace_proof === "MOCK_TRUSTED_TRACE" });
  assert.equal(traceRegistry.verifyCandidate({ ...candidate, kind: "INTERNAL", trace_from: source, trace_proof: "MOCK_TRUSTED_TRACE" }, context).source_evidence_type, "TRUSTED_INTERNAL_TRACE");
});

function rpcWithFrom(from) {
  return { send: async (method) => {
    if (method === "eth_chainId") return "0x38";
    if (method === "eth_getTransactionReceipt") return { status: "0x1", blockNumber: "0x2", blockHash };
    if (method === "eth_getTransactionByHash") return { hash: txHash, from, to: wallet, value: "0x1c6bf526340000" };
    if (method === "eth_getBlockByNumber") return { number: "0x2", hash: blockHash, timestamp: "0x66c7c000" };
    throw new Error(`unexpected method ${method}`);
  } };
}

test("RPC transaction.from must match the verified normal Naihe source", async () => {
  const resolver = new DigitalLifeBirthResolver({ rpc: rpcWithFrom(attacker), tokens: {}, environment: "TEST", naiheSourceRegistry: testRegistry(), historyIndexer: { listNativeIncoming: async () => [candidate] } });
  await assert.rejects(() => resolver.resolveSpiritGenesisAnchor({ life: { life_id: context.lifeId, local_genesis: "VERIFIED" }, soulId: context.soulId, energyWalletAddress: wallet, birthRequestId: context.birthRequestId, challenge: context.challenge }), (error) => error.code === "NAIHE_RPC_FROM_MISMATCH");
});

test("resolver output directly satisfies SpiritGenesisAnchorV2 validator", async () => {
  const resolver = new DigitalLifeBirthResolver({ rpc: rpcWithFrom(source), tokens: {}, environment: "TEST", naiheSourceRegistry: testRegistry(), historyIndexer: { listNativeIncoming: async () => [candidate] } });
  const record = await resolver.resolveSpiritGenesisAnchor({ life: { life_id: context.lifeId, local_genesis: "VERIFIED" }, soulId: context.soulId, energyWalletAddress: wallet, birthRequestId: context.birthRequestId, challenge: context.challenge });
  assert.equal(validateSpiritGenesisAnchorV2(record), record);
  assert.equal(record.anchor_tx_hash, txHash);
  assert.equal(record.birth_source_address, source);
  assert.equal(record.regeneration_parent_address, source);
});
