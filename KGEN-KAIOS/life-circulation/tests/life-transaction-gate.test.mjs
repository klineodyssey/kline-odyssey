import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  HENGYAO_LIFE_TRANSACTION_POLICY_V1,
  TransactionReplayJournal,
  createLifeTransactionIntent,
  encodeAllowedHeartCalldata,
  evaluateLifeTransactionIntent,
  reserveAuthorizedLifeTransaction,
  verifyAndApplyLifeTransactionReceipt,
} from "../runtime/life-transaction-gate.mjs";
import { sha256, stableStringify, ZERO_HASH } from "../runtime/life-circulatory-runtime.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const policy = JSON.parse(fs.readFileSync(path.join(packageRoot, "policies", "hengyao-life-transaction-policy.candidate.json"), "utf8"));
const schema = JSON.parse(fs.readFileSync(path.join(packageRoot, "schemas", "life-transaction-policy.schema.json"), "utf8"));
const KGEN_WEI = 10n ** 18n;
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const HEARTBEAT_TOPIC = "0x344bbf71ad17824c6a09a35e74bbadd1f33e186c72a8c66dd0fa2d672f5e6368";

function tempJournal() {
  return path.join(os.tmpdir(), `hengyao-transaction-${randomUUID()}.jsonl`);
}

function seedReservedJournal(filePath, intent, recordedAt = "2026-08-24T12:01:00.000Z") {
  const payload = {
    sequence: 1,
    eventType: "INTENT_RESERVED",
    intentId: intent.intentId,
    replayNonce: intent.replayNonce,
    policyId: intent.policyId,
    lifeId: intent.lifeId,
    workerId: intent.workerId,
    methodSignature: intent.methodSignature,
    txHash: null,
    recordedAt,
    previousHash: ZERO_HASH,
  };
  const record = { ...payload, recordHash: sha256(stableStringify(payload)) };
  fs.writeFileSync(filePath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  return record;
}

function word(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function topicAddress(value) {
  return `0x${value.toLowerCase().slice(2).padStart(64, "0")}`;
}

function createIntent(overrides = {}) {
  return createLifeTransactionIntent({
    methodSignature: "heartbeatClaim()",
    args: [],
    expectedNonce: "7",
    replayNonce: `0x${"12".repeat(32)}`,
    createdAt: "2026-08-24T12:00:00.000Z",
    expiresAt: "2026-08-24T12:05:00.000Z",
    missionId: "KAIOS-FIRST-HEARTBEAT",
    ...overrides,
  });
}

function trustedContext(intent, overrides = {}) {
  const base = {
    lifeId: policy.lifeId,
    workerId: policy.workerId,
    walletAddress: policy.walletAddress,
    chainId: 56,
    target: policy.allowedTarget.address,
    targetCodeHash: policy.allowedTarget.codeHash,
    currentAuthority: "A2_PERSONAL_LOW_RISK_SIGNING",
    policyApproval: {
      status: "APPROVED_ACTIVE",
      policyId: policy.policyId,
      decisionId: "HUMAN-HENGYAO-LOW-RISK-HEART-WRITES-TEST",
    },
    securityStatus: "HEALTHY",
    secureSignerConnected: true,
    secureSignerAddress: policy.walletAddress,
    currentNonce: intent.expectedNonce,
    currentBnbWei: "7990205550000000",
    currentKgenWei: "0",
    currentHeartAllowanceWei: "0",
    minimumBnbReserveWei: "5000000000000000",
    gasPriceWei: "3000000000",
    heartbeatEligible: true,
    heartbeatRewardWhole: "1",
    wishEligible: true,
    fortuneEligible: true,
    verifiedVowProfitWhole: "0",
    verifiedVowProfitEvidenceId: null,
    simulation: {
      status: "PASS",
      chainId: 56,
      from: policy.walletAddress,
      to: policy.allowedTarget.address,
      calldata: intent.calldata,
      valueWei: "0",
      nonce: intent.expectedNonce,
      gasEstimate: "110000",
      blockNumber: 117800000,
    },
  };
  return { ...base, ...overrides, simulation: { ...base.simulation, ...(overrides.simulation ?? {}) } };
}

function receiptBundle(intent, overrides = {}) {
  const txHash = `0x${"a".repeat(64)}`;
  const blockHash = `0x${"b".repeat(64)}`;
  const blockNumber = 117800010;
  const logs = [
    {
      address: policy.allowedTarget.address,
      topics: [HEARTBEAT_TOPIC, topicAddress(policy.walletAddress)],
      data: `0x${word(1)}`,
    },
    {
      address: policy.tokenRegistry.KGEN,
      topics: [TRANSFER_TOPIC, topicAddress(policy.allowedTarget.address), topicAddress(policy.walletAddress)],
      data: `0x${word(KGEN_WEI)}`,
    },
  ];
  return {
    transaction: {
      hash: txHash,
      from: policy.walletAddress,
      to: policy.allowedTarget.address,
      input: intent.calldata,
      value: "0",
      nonce: 7,
      ...(overrides.transaction ?? {}),
    },
    receipt: {
      transactionHash: txHash,
      status: "0x1",
      blockNumber,
      blockHash,
      logs,
      ...(overrides.receipt ?? {}),
    },
    canonicalBlock: { number: blockNumber, hash: blockHash, ...(overrides.canonicalBlock ?? {}) },
    observedHeadBlockNumber: overrides.observedHeadBlockNumber ?? blockNumber + 11,
  };
}

function validate(value, rule, pointer = "#") {
  if (rule.$ref) return validate(value, schema.$defs[rule.$ref.slice("#/$defs/".length)], pointer);
  if (Object.hasOwn(rule, "const")) assert.deepEqual(value, rule.const, `${pointer} const mismatch`);
  if (rule.enum) assert.ok(rule.enum.includes(value), `${pointer} enum mismatch`);
  if (rule.type === "null") assert.equal(value, null, `${pointer} must be null`);
  if (rule.type === "boolean") assert.equal(typeof value, "boolean", `${pointer} must be boolean`);
  if (rule.type === "integer") {
    assert.ok(Number.isInteger(value), `${pointer} must be integer`);
    if (rule.minimum !== undefined) assert.ok(value >= rule.minimum, `${pointer} below minimum`);
  }
  if (rule.type === "string") {
    assert.equal(typeof value, "string", `${pointer} must be string`);
    if (rule.minLength !== undefined) assert.ok(value.length >= rule.minLength, `${pointer} too short`);
    if (rule.pattern) assert.match(value, new RegExp(rule.pattern, "u"), `${pointer} pattern mismatch`);
  }
  if (rule.type === "array") {
    assert.ok(Array.isArray(value), `${pointer} must be array`);
    if (rule.minItems !== undefined) assert.ok(value.length >= rule.minItems, `${pointer} too short`);
    if (rule.maxItems !== undefined) assert.ok(value.length <= rule.maxItems, `${pointer} too long`);
    if (rule.uniqueItems) assert.equal(new Set(value.map((entry) => JSON.stringify(entry))).size, value.length, `${pointer} duplicates`);
    value.forEach((entry, index) => validate(entry, rule.items, `${pointer}/${index}`));
  }
  if (rule.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${pointer} must be object`);
    for (const key of rule.required ?? []) assert.ok(Object.hasOwn(value, key), `${pointer}/${key} missing`);
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(rule.properties ?? {}, key), `${pointer}/${key} not allowed`);
    }
    for (const [key, child] of Object.entries(rule.properties ?? {})) if (Object.hasOwn(value, key)) validate(value[key], child, `${pointer}/${key}`);
  }
}

test("Hengyao transaction policy is recursively closed, durable, and not activated", () => {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object") assert.equal(node.additionalProperties, false, `${pointer} is open`);
    for (const [key, child] of Object.entries(node)) visit(child, `${pointer}/${key}`);
  };
  visit(schema);
  validate(policy, schema);
  assert.deepEqual(HENGYAO_LIFE_TRANSACTION_POLICY_V1, policy);
  assert.equal(policy.activation.currentAuthority, "A1_PERSONAL_WALLET_READ");
  assert.equal(policy.activation.currentStatus, "NOT_AUTHORIZED");
  assert.equal(policy.activation.broadcasterIncluded, false);
  assert.equal(policy.walletAddress, "0x4DF6E9629Dad1072103cFd2bC81845fd97429214");
  assert.equal(policy.allowedTarget.address, "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972");
  assert.equal(policy.allowedTarget.codeHash, "0x1d3eba15b4c4895710c6e68f3f27e97cb0e2c94edc254d9f1e9148b3d7f55d32");
  assert.equal(policy.tokenRegistry.KGEN, "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be");
  assert.ok(policy.requiredGates.includes("DURABLE_POLICY_ACTIVATION"));
  assert.ok(policy.forbiddenActions.includes("ARBITRARY_TRANSFER"));
  assert.ok(policy.forbiddenActions.includes("PRIVATE_KEY_OUTPUT"));
});

test("only the four exact deployed Heart methods can be encoded", () => {
  assert.equal(encodeAllowedHeartCalldata("heartbeatClaim()"), "0x2d293562");
  assert.equal(encodeAllowedHeartCalldata("makeWish(bytes32)", [`0x${"34".repeat(32)}`]).slice(0, 10), "0x85e6be79");
  assert.equal(encodeAllowedHeartCalldata("fortuneClaim(uint256)", ["1"]).slice(0, 10), "0xf7d28733");
  assert.equal(encodeAllowedHeartCalldata("vowTo(uint8,uint256)", ["1", "2"]).slice(0, 10), "0xbecfd3d2");
  assert.throws(() => encodeAllowedHeartCalldata("approve(address,uint256)", []), /METHOD_NOT_ALLOWLISTED/);
  assert.throws(() => createIntent({ valueWei: "1" }), /NATIVE_VALUE_FORBIDDEN/);
});

test("current A1 authority cannot reserve a transaction even when simulation passes", () => {
  const intent = createIntent();
  const journal = new TransactionReplayJournal(tempJournal());
  const result = reserveAuthorizedLifeTransaction({
    intent,
    trustedContext: trustedContext(intent, {
      currentAuthority: "A1_PERSONAL_WALLET_READ",
      policyApproval: { status: "NOT_APPROVED", policyId: policy.policyId, decisionId: null },
      secureSignerConnected: false,
    }),
    journal,
    now: "2026-08-24T12:01:00.000Z",
  });
  assert.equal(result.status, "REJECTED");
  assert.ok(result.blockers.includes("A2_AUTHORITY_REQUIRED"));
  assert.ok(result.blockers.includes("MACHINE_VERIFIABLE_POLICY_APPROVAL_REQUIRED"));
  assert.ok(result.blockers.includes("SECURE_SIGNER_BINDING_REQUIRED"));
  assert.ok(result.blockers.includes("DURABLE_POLICY_NOT_ACTIVATED"));
  assert.equal(journal.sequence, 0);
});

test("mocked A2 cannot override the inactive durable policy and replay survives restart", () => {
  const intent = createIntent();
  const filePath = tempJournal();
  const journal = new TransactionReplayJournal(filePath);
  const result = reserveAuthorizedLifeTransaction({ intent, trustedContext: trustedContext(intent), journal, now: "2026-08-24T12:01:00.000Z" });
  assert.equal(result.status, "REJECTED");
  assert.ok(result.blockers.includes("DURABLE_POLICY_NOT_ACTIVATED"));
  assert.equal(result.broadcast, false);
  assert.equal(result.privateKeyAccess, false);
  assert.throws(() => journal.reserve(intent, "2026-08-24T12:01:00.000Z", result), /AUTHORIZED_INTENT_DECISION_REQUIRED/);
  const seeded = seedReservedJournal(filePath, intent);
  const restarted = new TransactionReplayJournal(filePath, { expectedHeadHash: seeded.recordHash });
  const replay = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent), journal: restarted, now: "2026-08-24T12:02:00.000Z" });
  assert.equal(replay.status, "REJECTED");
  assert.ok(replay.blockers.includes("INTENT_ALREADY_RESERVED"));
  assert.ok(replay.blockers.includes("REPLAY_NONCE_ALREADY_USED"));
});

test("identity, controller authority, target, nonce, simulation, gas, reserve, expiry, and secrets fail closed", () => {
  const intent = createIntent();
  const cases = [
    ["LIFE_ID_MISMATCH", { lifeId: "LIFE-OTHER-0001" }],
    ["WORKER_ID_MISMATCH", { workerId: "other-worker" }],
    ["WALLET_BINDING_MISMATCH", { walletAddress: `0x${"1".repeat(40)}` }],
    ["CHAIN_ID_MISMATCH", { chainId: 97 }],
    ["TARGET_MISMATCH", { target: `0x${"2".repeat(40)}` }],
    ["TARGET_CODE_HASH_MISMATCH", { targetCodeHash: `0x${"3".repeat(64)}` }],
    ["NONCE_STALE_OR_MISMATCHED", { currentNonce: "8" }],
    ["SIMULATION_OR_GAS_ESTIMATE_INVALID", { simulation: { status: "FAIL" } }],
    ["SIMULATION_OR_GAS_ESTIMATE_INVALID", { simulation: { gasEstimate: "200001" } }],
    ["BNB_SURVIVAL_RESERVE_VIOLATION", { currentBnbWei: "1" }],
    ["SECRET_MATERIAL_FORBIDDEN", { privateKey: "never accepted" }],
  ];
  for (const [expected, mutation] of cases) {
    const result = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent, mutation), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:01:00.000Z" });
    assert.equal(result.status, "REJECTED", expected);
    assert.ok(result.blockers.includes(expected), `${expected}: ${result.blockers.join(",")}`);
  }
  const expired = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:05:00.000Z" });
  assert.ok(expired.blockers.includes("INTENT_EXPIRED_OR_TIME_INVALID"));
});

test("Fortune stays 1-8 and requires a pre-existing exact 1 KGEN pass", () => {
  const intent = createIntent({ methodSignature: "fortuneClaim(uint256)", args: ["1"], replayNonce: `0x${"56".repeat(32)}` });
  const blocked = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent, { currentKgenWei: (KGEN_WEI - 1n).toString() }), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:01:00.000Z" });
  assert.ok(blocked.blockers.includes("FORTUNE_PREEXISTING_1_KGEN_PASS_REQUIRED"));
  const passed = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent, { currentKgenWei: KGEN_WEI.toString() }), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:01:00.000Z" });
  assert.equal(passed.status, "REJECTED");
  assert.ok(passed.blockers.includes("DURABLE_POLICY_NOT_ACTIVATED"));
  assert.ok(!passed.blockers.includes("FORTUNE_PREEXISTING_1_KGEN_PASS_REQUIRED"));
  assert.throws(() => createIntent({ methodSignature: "fortuneClaim(uint256)", args: ["9"] }), /FORTUNE_AMOUNT_OUTSIDE_1_TO_8/);
});

test("Vow requires exact verified profit, balance, and an already-existing allowance", () => {
  const intent = createIntent({ methodSignature: "vowTo(uint8,uint256)", args: ["1", "2"], replayNonce: `0x${"78".repeat(32)}` });
  const base = { currentKgenWei: (2n * KGEN_WEI).toString(), verifiedVowProfitWhole: "2", verifiedVowProfitEvidenceId: "WASTE-PROFIT-EVIDENCE-001" };
  const blocked = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent, base), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:01:00.000Z" });
  assert.ok(blocked.blockers.includes("VOW_PREEXISTING_ALLOWANCE_REQUIRED"));
  const passed = evaluateLifeTransactionIntent({ intent, trustedContext: trustedContext(intent, { ...base, currentHeartAllowanceWei: (2n * KGEN_WEI).toString() }), journal: new TransactionReplayJournal(tempJournal()), now: "2026-08-24T12:01:00.000Z" });
  assert.equal(passed.status, "REJECTED");
  assert.ok(passed.blockers.includes("DURABLE_POLICY_NOT_ACTIVATED"));
  assert.ok(!passed.blockers.includes("VOW_PREEXISTING_ALLOWANCE_REQUIRED"));
});

test("Heartbeat ledger applies only after exact canonical receipt and 1 KGEN transfer", () => {
  const intent = createIntent();
  const filePath = tempJournal();
  seedReservedJournal(filePath, intent);
  const journal = new TransactionReplayJournal(filePath);
  assert.throws(() => journal.applyReceipt({ intent, receiptEvidence: { txHash: `0x${"a".repeat(64)}` }, recordedAt: "2026-08-24T12:03:59.000Z" }), /VERIFIED_RECEIPT_EVIDENCE_REQUIRED/);
  const bundle = receiptBundle(intent);
  const result = verifyAndApplyLifeTransactionReceipt({ ...bundle, intent, journal, recordedAt: "2026-08-24T12:04:00.000Z" });
  assert.equal(result.canonicalBlockVerified, true);
  assert.equal(result.confirmationCount, 12);
  assert.equal(result.tokenTransferVerified, true);
  assert.equal(result.ledgerApply, "ALLOWED_AFTER_THIS_EVIDENCE_ONLY");
  assert.equal(result.privateKeyAccess, false);
  assert.throws(() => verifyAndApplyLifeTransactionReceipt({ ...bundle, intent, journal, recordedAt: "2026-08-24T12:04:01.000Z" }), /INTENT_RESERVATION_REQUIRED/);
});

test("receipt gate rejects wrong sender, target, amount, finality, failure, and reorg evidence", () => {
  const cases = [
    ["TRANSACTION_SENDER_MISMATCH", { transaction: { from: `0x${"1".repeat(40)}` } }],
    ["TRANSACTION_TARGET_MISMATCH", { transaction: { to: `0x${"2".repeat(40)}` } }],
    ["TRANSACTION_RECEIPT_FAILED", { receipt: { status: "0x0" } }],
    ["RECEIPT_CONFIRMATIONS_INSUFFICIENT", { observedHeadBlockNumber: 117800019 }],
    ["CANONICAL_BLOCK_HASH_MISMATCH", { canonicalBlock: { hash: `0x${"c".repeat(64)}` } }],
  ];
  for (const [expected, mutation] of cases) {
    const intent = createIntent({ replayNonce: `0x${randomUUID().replaceAll("-", "").padEnd(64, "0")}` });
    const filePath = tempJournal();
    seedReservedJournal(filePath, intent);
    const journal = new TransactionReplayJournal(filePath);
    assert.throws(() => verifyAndApplyLifeTransactionReceipt({ ...receiptBundle(intent, mutation), intent, journal, recordedAt: "2026-08-24T12:04:00.000Z" }), new RegExp(expected));
  }
  const intent = createIntent({ replayNonce: `0x${"ab".repeat(32)}` });
  const filePath = tempJournal();
  seedReservedJournal(filePath, intent);
  const journal = new TransactionReplayJournal(filePath);
  const bundle = receiptBundle(intent);
  bundle.receipt.logs[1].data = `0x${word(KGEN_WEI - 1n)}`;
  assert.throws(() => verifyAndApplyLifeTransactionReceipt({ ...bundle, intent, journal, recordedAt: "2026-08-24T12:04:00.000Z" }), /HEARTBEAT_EXACT_1_KGEN_TRANSFER_REQUIRED/);
});

test("transaction journal detects tampering and trusted-head rollback", () => {
  const intent = createIntent();
  const filePath = tempJournal();
  const reserved = seedReservedJournal(filePath, intent);
  const journal = new TransactionReplayJournal(filePath);
  const original = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, original.replace("INTENT_RESERVED", "INTENT_TAMPERED"));
  assert.throws(() => new TransactionReplayJournal(filePath), /EVENT_TYPE_INVALID|RECORD_HASH_MISMATCH/);
  fs.writeFileSync(filePath, original);
  assert.throws(() => new TransactionReplayJournal(filePath, { expectedHeadHash: `0x${"0".repeat(64)}` }), /TRUSTED_CHECKPOINT_MISMATCH/);
  assert.match(reserved.recordHash, /^[0-9a-f]{64}$/u);
});
