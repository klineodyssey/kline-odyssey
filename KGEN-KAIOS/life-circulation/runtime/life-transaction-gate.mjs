import fs from "node:fs";
import path from "node:path";
import { sha256, stableStringify, ZERO_HASH } from "./life-circulatory-runtime.mjs";

const POLICY_PATH = new URL("../policies/hengyao-life-transaction-policy.candidate.json", import.meta.url);
const HUMAN_DECISION_PATH = new URL("../policies/hengyao-autonomy-xuanyao-onboarding-human-decision.candidate.json", import.meta.url);
const XUANYAO_ONBOARDING_PATH = new URL("../examples/xuanyao-life-worker-onboarding.candidate.json", import.meta.url);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const HENGYAO_LIFE_TRANSACTION_POLICY_V1 = deepFreeze(JSON.parse(fs.readFileSync(POLICY_PATH, "utf8")));
export const HENGYAO_A2_HUMAN_DECISION_V1 = deepFreeze(JSON.parse(fs.readFileSync(HUMAN_DECISION_PATH, "utf8")));
export const XUANYAO_LIFE_WORKER_ONBOARDING_V1 = deepFreeze(JSON.parse(fs.readFileSync(XUANYAO_ONBOARDING_PATH, "utf8")));
export const XUANYAO_CONTROLLER_ATTESTATION_REQUEST_V1 = XUANYAO_LIFE_WORKER_ONBOARDING_V1.controllerAttestationRequest;
export const HENGYAO_SECURE_SIGNER_CONNECTION_REQUEST_V1 = HENGYAO_LIFE_TRANSACTION_POLICY_V1.secureSignerConnectionRequest;

function durableHumanDecisionValid() {
  try {
    const decision = HENGYAO_A2_HUMAN_DECISION_V1;
    const scope = decision.decisionPayload.hengyaoA2;
    const activation = HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation;
    const allowedMethods = HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedMethods.map(({ signature }) => signature);
    return decision.decisionId === activation.approvalEvidenceId
      && decision.status === "RECORDED_HUMAN_DECISION_PENDING_INDEPENDENT_REVIEW_AND_SIGNER_BINDING"
      && decision.recordMode === "TEXTUAL_ATTESTATION_NOT_CRYPTOGRAPHIC"
      && sha256(stableStringify(decision.decisionPayload)) === decision.decisionPayloadHash
      && sha256(stableStringify(scope)) === decision.hengyaoPolicyScopeHash
      && decision.decisionPayloadHash === activation.approvalDecisionHash
      && decision.hengyaoPolicyScopeHash === activation.approvalPolicyScopeHash
      && decision.decisionPayload.humanAuthority === "沈英明"
      && scope.decision === "APPROVED"
      && scope.lifeId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.lifeId
      && scope.workerId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.workerId
      && scope.authority === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.requiredAuthority
      && scope.chainId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.chainId
      && address(scope.registeredWallet, "DECISION_WALLET") === address(HENGYAO_LIFE_TRANSACTION_POLICY_V1.walletAddress, "POLICY_WALLET")
      && address(scope.allowedTarget.address, "DECISION_TARGET") === address(HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedTarget.address, "POLICY_TARGET")
      && bytes32(scope.allowedTarget.codeHash, "DECISION_CODE_HASH") === bytes32(HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedTarget.codeHash, "POLICY_CODE_HASH")
      && stableStringify(scope.allowedMethods) === stableStringify(allowedMethods);
  } catch {
    return false;
  }
}

export const HENGYAO_A2_HUMAN_DECISION_VALID = durableHumanDecisionValid();

const KGEN_WEI = 10n ** 18n;
const MAX_INTENT_LIFETIME_SECONDS = 300;
const ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const EVENT_TOPICS = Object.freeze({
  "heartbeatClaim()": "0x344bbf71ad17824c6a09a35e74bbadd1f33e186c72a8c66dd0fa2d672f5e6368",
  "fortuneClaim(uint256)": "0x0706c087ea3463074c34b9df3b7c22b9142523c83d64630a0ac2700df1f0665b",
  "makeWish(bytes32)": "0x584f4aacb5b6c11578c77d7cdaa8877150e6f9cd6c2c90a8605b0deb0d2ed06f",
  "vowTo(uint8,uint256)": "0xadfb5e23eaea55a798cfe4830eb90f9456b220e08d789e9387cc169d1d4687ba",
});
const AUTHORIZED_DECISIONS = new WeakSet();
const VERIFIED_RECEIPT_EVIDENCE = new WeakSet();
const VERIFIED_EXTERNAL_CONTROLLER_BINDINGS = new WeakSet();
const VERIFIED_XUANYAO_ACK_RESPONSES = new WeakSet();
const VERIFIED_EXTERNAL_SIGNER_CONNECTIONS = new WeakSet();

const FORBIDDEN_KEY = /(?:private.?key|seed(?:.?phrase)?|mnemonic|secret(?:.?key)?|raw.?signer)/iu;

export function canonicalTextFileSha256(filePath) {
  const canonicalText = fs.readFileSync(filePath, "utf8").replace(/\r\n?/gu, "\n");
  return sha256(canonicalText);
}

function containsSecretField(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSecretField);
  return Object.entries(value).some(([key, child]) => FORBIDDEN_KEY.test(key) || containsSecretField(child));
}

function address(value, label) {
  const text = String(value ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(text)) throw new Error(`${label}_INVALID`);
  return text.toLowerCase();
}

function bytes32(value, label, { nonzero = false } = {}) {
  const text = String(value ?? "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(text)) throw new Error(`${label}_INVALID`);
  if (nonzero && /^0x0{64}$/.test(text)) throw new Error(`${label}_ZERO`);
  return text;
}

function quantity(value, label) {
  const text = String(value ?? "");
  if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new Error(`${label}_INVALID`);
  return BigInt(text);
}

function rpcQuantity(value, label) {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}_INVALID`);
    return BigInt(value);
  }
  const text = String(value ?? "");
  if (/^0x[0-9a-fA-F]+$/.test(text)) return BigInt(text);
  return quantity(text, label);
}

function isoTime(value, label) {
  const text = String(value ?? "");
  const milliseconds = Date.parse(text);
  if (!Number.isFinite(milliseconds)) throw new Error(`${label}_INVALID`);
  return { text, milliseconds };
}

function uintWord(value, label, maximum = null) {
  const parsed = quantity(value, label);
  if (maximum !== null && parsed > maximum) throw new Error(`${label}_OUT_OF_RANGE`);
  return parsed.toString(16).padStart(64, "0");
}

function topicAddress(value) {
  return `0x${address(value, "TOPIC_ADDRESS").slice(2).padStart(64, "0")}`;
}

function addressFromTopic(value, label) {
  const topic = String(value ?? "").toLowerCase();
  if (!/^0x0{24}[0-9a-f]{40}$/.test(topic)) throw new Error(`${label}_INVALID`);
  return `0x${topic.slice(-40)}`;
}

function dataWords(value, label) {
  const data = String(value ?? "").toLowerCase();
  if (!/^0x(?:[0-9a-f]{64})*$/.test(data)) throw new Error(`${label}_INVALID`);
  return data.slice(2).match(/.{64}/gu) ?? [];
}

function normalizeIntentArgs(signature, args) {
  if (!Array.isArray(args)) throw new Error("INTENT_ARGUMENTS_INVALID");
  if (signature === "heartbeatClaim()") {
    if (args.length !== 0) throw new Error("HEARTBEAT_ARGUMENTS_FORBIDDEN");
    return [];
  }
  if (signature === "makeWish(bytes32)") {
    if (args.length !== 1) throw new Error("WISH_ARGUMENT_COUNT_INVALID");
    return [bytes32(args[0], "WISH_HASH", { nonzero: true })];
  }
  if (signature === "fortuneClaim(uint256)") {
    if (args.length !== 1) throw new Error("FORTUNE_ARGUMENT_COUNT_INVALID");
    const amountWhole = quantity(args[0], "FORTUNE_AMOUNT_WHOLE");
    if (amountWhole < 1n || amountWhole > 8n) throw new Error("FORTUNE_AMOUNT_OUTSIDE_1_TO_8");
    return [amountWhole.toString()];
  }
  if (signature === "vowTo(uint8,uint256)") {
    if (args.length !== 2) throw new Error("VOW_ARGUMENT_COUNT_INVALID");
    const option = quantity(args[0], "VOW_OPTION");
    const amountWhole = quantity(args[1], "VOW_AMOUNT_WHOLE");
    if (option > 255n) throw new Error("VOW_OPTION_OUT_OF_UINT8_RANGE");
    if (amountWhole < 1n || amountWhole > 8n) throw new Error("VOW_AMOUNT_OUTSIDE_1_TO_8");
    return [option.toString(), amountWhole.toString()];
  }
  throw new Error("METHOD_NOT_ALLOWLISTED");
}

function methodPolicy(signature) {
  const result = HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedMethods.find((entry) => entry.signature === signature);
  if (!result) throw new Error("METHOD_NOT_ALLOWLISTED");
  return result;
}

const HENGYAO_SELF_ISSUER_IDS = new Set([
  "衡曜",
  "codex-gm-01",
  "life-codex-gm-0001",
]);
const ACK_RESPONSE_FIELDS = Object.freeze([
  "LIFE_ID",
  "WORKER_ID",
  "CONTROLLER_ID",
  "DOCUMENT_PATH",
  "DOCUMENT_HASH",
  "ACK_TIMESTAMP",
  "ACK_NONCE",
]);
const SIGNER_DENIAL_FIELDS = new Set([
  "PRIVATE_KEY_OUTPUT",
  "SEED_OUTPUT",
  "GENERAL_PURPOSE_SIGNING",
  "ARBITRARY_TRANSFER",
]);

function nonempty(value, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

function sameStringList(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => String(value).toLowerCase() === String(right[index]).toLowerCase());
}

function externalGateResult(kind, blockers, details = {}) {
  const uniqueBlockers = [...new Set(blockers)].sort();
  return deepFreeze({
    status: uniqueBlockers.length ? "REJECTED" : "PASS",
    kind,
    blockers: uniqueBlockers,
    ...details,
    privateKeyAccess: false,
    broadcast: false,
  });
}

function containsSignerSecretMaterial(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSignerSecretMaterial);
  return Object.entries(value).some(([key, child]) => {
    if (SIGNER_DENIAL_FIELDS.has(key)) return child !== false;
    return FORBIDDEN_KEY.test(key) || containsSignerSecretMaterial(child);
  });
}

export async function verifyXuanyaoControllerAttestation({ evidence, providerVerifier, now } = {}) {
  const request = XUANYAO_CONTROLLER_ATTESTATION_REQUEST_V1;
  const blockers = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return externalGateResult("XUANYAO_CONTROLLER_ATTESTATION", ["CONTROLLER_EVIDENCE_REQUIRED"], {
      REQUEST_ID: request.REQUEST_ID,
      EXTERNAL_CONTROLLER_CONNECTED: false,
      ACK_CHANNEL_READY: false,
    });
  }

  const required = [
    "PROVIDER_AUTHENTICATED_AGENT_INSTANCE_ID",
    "ISSUER_ID",
    "ISSUER_SIGNATURE_OR_VERIFIABLE_ATTESTATION",
    "AUTHORITY_LEASE_ID",
    "AUTHORITY_LEASE_SCOPE",
    "ISSUED_AT",
    "EXPIRES_AT",
    "NONCE",
    "CHALLENGE",
    "CHALLENGE_RESPONSE",
    "LIFE_ID",
    "WORKER_ID",
    "CONTROLLER_ID",
    "HENGYAO_CONTROLLER_ID",
  ];
  for (const field of required) addBlocker(blockers, Object.hasOwn(evidence, field) && evidence[field] !== null && evidence[field] !== undefined, `${field}_REQUIRED`);
  addBlocker(blockers, sameStringList(Object.keys(evidence).sort(), [...required].sort()), "CONTROLLER_EVIDENCE_FIELDS_INVALID");
  addBlocker(blockers, evidence.LIFE_ID === request.LIFE_ID, "LIFE_ID_MISMATCH");
  addBlocker(blockers, evidence.WORKER_ID === request.WORKER_ID, "WORKER_ID_MISMATCH");
  addBlocker(blockers, nonempty(evidence.PROVIDER_AUTHENTICATED_AGENT_INSTANCE_ID), "PROVIDER_AGENT_INSTANCE_ID_INVALID");
  addBlocker(blockers, nonempty(evidence.ISSUER_ID), "ISSUER_ID_INVALID");
  addBlocker(blockers, !HENGYAO_SELF_ISSUER_IDS.has(String(evidence.ISSUER_ID ?? "").toLowerCase())
    && String(evidence.ISSUER_ID ?? "") !== "衡曜"
    && String(evidence.ISSUER_ID ?? "") !== String(evidence.CONTROLLER_ID ?? ""), "ISSUER_SELF_ASSERTION_FORBIDDEN");
  addBlocker(blockers, nonempty(evidence.CONTROLLER_ID), "XUANYAO_CONTROLLER_ID_INVALID");
  addBlocker(blockers, nonempty(evidence.HENGYAO_CONTROLLER_ID), "HENGYAO_CONTROLLER_ID_REQUIRED_FOR_COMPARISON");
  addBlocker(blockers, String(evidence.CONTROLLER_ID ?? "") !== String(evidence.HENGYAO_CONTROLLER_ID ?? ""), "CONTROLLER_INDEPENDENCE_FAILED");
  addBlocker(blockers, Array.isArray(evidence.AUTHORITY_LEASE_SCOPE)
    && request.REQUIRED_AUTHORITY_LEASE_SCOPE.every((scope) => evidence.AUTHORITY_LEASE_SCOPE.includes(scope)), "AUTHORITY_LEASE_SCOPE_INSUFFICIENT");
  addBlocker(blockers, nonempty(evidence.NONCE, 16), "NONCE_INVALID");
  addBlocker(blockers, nonempty(evidence.CHALLENGE, 16), "CHALLENGE_INVALID");
  addBlocker(blockers, nonempty(evidence.CHALLENGE_RESPONSE, 16), "CHALLENGE_RESPONSE_INVALID");
  addBlocker(blockers, (typeof evidence.ISSUER_SIGNATURE_OR_VERIFIABLE_ATTESTATION === "object" && evidence.ISSUER_SIGNATURE_OR_VERIFIABLE_ATTESTATION !== null)
    || nonempty(evidence.ISSUER_SIGNATURE_OR_VERIFIABLE_ATTESTATION, 16), "ISSUER_ATTESTATION_INVALID");

  let currentTime = Number.NaN;
  try {
    currentTime = isoTime(now, "CURRENT_TIME").milliseconds;
    const issuedAt = isoTime(evidence.ISSUED_AT, "ATTESTATION_ISSUED_AT").milliseconds;
    const expiresAt = isoTime(evidence.EXPIRES_AT, "ATTESTATION_EXPIRES_AT").milliseconds;
    addBlocker(blockers, issuedAt <= currentTime && currentTime < expiresAt && expiresAt > issuedAt, "AUTHORITY_LEASE_TIME_INVALID");
  } catch (error) {
    blockers.push(error?.message || "AUTHORITY_LEASE_TIME_INVALID");
  }

  let providerResult = null;
  if (typeof providerVerifier !== "function") {
    blockers.push("HOST_REGISTERED_EXTERNAL_PROVIDER_VERIFIER_REQUIRED");
  } else {
    try {
      providerResult = await providerVerifier({ request, evidence: deepFreeze(structuredClone(evidence)), now });
    } catch {
      blockers.push("EXTERNAL_PROVIDER_VERIFICATION_FAILED");
    }
  }
  if (!providerResult || typeof providerResult !== "object") {
    blockers.push("EXTERNAL_PROVIDER_VERIFICATION_RESULT_REQUIRED");
  } else {
    addBlocker(blockers, !containsSecretField(providerResult), "PROVIDER_RESULT_SECRET_MATERIAL_FORBIDDEN");
    addBlocker(blockers, providerResult.VERIFIED === true, "PROVIDER_ATTESTATION_NOT_VERIFIED");
    addBlocker(blockers, providerResult.ISSUER_SIGNATURE_VERIFIED === true, "ISSUER_SIGNATURE_NOT_VERIFIED");
    addBlocker(blockers, providerResult.AUTHORITY_LEASE_VERIFIED === true, "AUTHORITY_LEASE_NOT_VERIFIED");
    addBlocker(blockers, providerResult.CHALLENGE_RESPONSE_VERIFIED === true, "CHALLENGE_RESPONSE_NOT_VERIFIED");
    addBlocker(blockers, providerResult.LEASE_REVOCATION_STATUS === "ACTIVE", "AUTHORITY_LEASE_NOT_ACTIVE");
    for (const field of ["PROVIDER_AUTHENTICATED_AGENT_INSTANCE_ID", "ISSUER_ID", "AUTHORITY_LEASE_ID", "LIFE_ID", "WORKER_ID", "ISSUED_AT", "EXPIRES_AT", "NONCE", "CHALLENGE", "CHALLENGE_RESPONSE", "CONTROLLER_ID", "HENGYAO_CONTROLLER_ID"]) {
      addBlocker(blockers, providerResult[field] === evidence[field], `${field}_VERIFIER_MISMATCH`);
    }
    addBlocker(blockers, sameStringList(providerResult.AUTHORITY_LEASE_SCOPE, evidence.AUTHORITY_LEASE_SCOPE), "AUTHORITY_LEASE_SCOPE_VERIFIER_MISMATCH");
    addBlocker(blockers, /^[0-9a-f]{64}$/u.test(String(providerResult.ATTESTATION_DIGEST ?? "")), "ATTESTATION_DIGEST_INVALID");
    try {
      const verifiedAt = isoTime(providerResult.VERIFIED_AT, "PROVIDER_VERIFIED_AT").milliseconds;
      addBlocker(blockers, Number.isFinite(currentTime) && verifiedAt <= currentTime, "PROVIDER_VERIFIED_AT_INVALID");
    } catch (error) {
      blockers.push(error?.message || "PROVIDER_VERIFIED_AT_INVALID");
    }
  }

  const result = externalGateResult("XUANYAO_CONTROLLER_ATTESTATION", blockers, {
    REQUEST_ID: request.REQUEST_ID,
    LIFE_ID: request.LIFE_ID,
    WORKER_ID: request.WORKER_ID,
    CONTROLLER_ID: evidence.CONTROLLER_ID ?? null,
    HENGYAO_CONTROLLER_ID: evidence.HENGYAO_CONTROLLER_ID ?? null,
    EXTERNAL_CONTROLLER_CONNECTED: blockers.length === 0,
    CONTROLLER_INDEPENDENCE: blockers.length === 0 ? "MACHINE_VERIFIED_DISTINCT" : "UNVERIFIED",
    ACK_CHANNEL_READY: blockers.length === 0,
    VERIFIED_AT: blockers.length === 0 ? providerResult.VERIFIED_AT : null,
    ATTESTATION_DIGEST: blockers.length === 0 ? providerResult.ATTESTATION_DIGEST : null,
    NEXT_ACTIONS: blockers.length === 0 ? request.ACK_CHANNEL.AUTO_CONTINUE_AFTER_CONTROLLER_PASS : [],
  });
  if (result.status === "PASS") VERIFIED_EXTERNAL_CONTROLLER_BINDINGS.add(result);
  return result;
}

export function verifyXuanyaoAckResponse({ controllerVerification, response, now } = {}) {
  const blockers = [];
  const request = XUANYAO_CONTROLLER_ATTESTATION_REQUEST_V1;
  addBlocker(blockers, VERIFIED_EXTERNAL_CONTROLLER_BINDINGS.has(controllerVerification), "VERIFIED_XUANYAO_CONTROLLER_BINDING_REQUIRED");
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return externalGateResult("XUANYAO_ACK_RESPONSE", [...blockers, "ACK_RESPONSE_REQUIRED"], { verified: false });
  }
  addBlocker(blockers, sameStringList(Object.keys(response).sort(), [...ACK_RESPONSE_FIELDS].sort()), "ACK_RESPONSE_FIELDS_INVALID");
  addBlocker(blockers, response.LIFE_ID === request.LIFE_ID, "ACK_LIFE_ID_MISMATCH");
  addBlocker(blockers, response.WORKER_ID === request.WORKER_ID, "ACK_WORKER_ID_MISMATCH");
  addBlocker(blockers, response.CONTROLLER_ID === controllerVerification?.CONTROLLER_ID, "ACK_CONTROLLER_ID_MISMATCH");
  addBlocker(blockers, nonempty(response.ACK_NONCE, 16), "ACK_NONCE_INVALID");
  const document = XUANYAO_LIFE_WORKER_ONBOARDING_V1.acknowledgmentHandoff.documents.find(({ documentPath }) => documentPath === response.DOCUMENT_PATH);
  addBlocker(blockers, Boolean(document), "ACK_DOCUMENT_NOT_IN_HANDOFF");
  if (document) {
    addBlocker(blockers, response.DOCUMENT_HASH === document.documentSha256, "ACK_DOCUMENT_HASH_MISMATCH");
    try {
      const liveHash = canonicalTextFileSha256(path.resolve(import.meta.dirname, "../../..", document.documentPath));
      addBlocker(blockers, liveHash === document.documentSha256, "ACK_DOCUMENT_HASH_STALE");
    } catch {
      blockers.push("ACK_DOCUMENT_UNREADABLE");
    }
  }
  try {
    const ackAt = isoTime(response.ACK_TIMESTAMP, "ACK_TIMESTAMP").milliseconds;
    const verifiedAt = isoTime(controllerVerification?.VERIFIED_AT, "CONTROLLER_VERIFIED_AT").milliseconds;
    const currentTime = isoTime(now, "CURRENT_TIME").milliseconds;
    addBlocker(blockers, ackAt >= verifiedAt && ackAt <= currentTime, "ACK_TIMESTAMP_OUTSIDE_VERIFIED_CONTROLLER_WINDOW");
  } catch (error) {
    blockers.push(error?.message || "ACK_TIMESTAMP_INVALID");
  }
  const result = externalGateResult("XUANYAO_ACK_RESPONSE", blockers, {
    REQUEST_ID: request.REQUEST_ID,
    ACK_TYPE: document?.ackType ?? null,
    DOCUMENT_PATH: response.DOCUMENT_PATH ?? null,
    ACK_NONCE: response.ACK_NONCE ?? null,
    verified: blockers.length === 0,
    ACK_EVIDENCE_HASH: blockers.length === 0 ? sha256(stableStringify(response)) : null,
  });
  if (result.status === "PASS") VERIFIED_XUANYAO_ACK_RESPONSES.add(result);
  return result;
}

export function evaluateXuanyaoAckSet({ ackVerifications } = {}) {
  const blockers = [];
  addBlocker(blockers, Array.isArray(ackVerifications) && ackVerifications.length === 4, "FOUR_ACK_VERIFICATIONS_REQUIRED");
  if (Array.isArray(ackVerifications)) {
    addBlocker(blockers, ackVerifications.every((entry) => VERIFIED_XUANYAO_ACK_RESPONSES.has(entry)), "UNVERIFIED_ACK_RESPONSE_PRESENT");
    addBlocker(blockers, new Set(ackVerifications.map(({ ACK_TYPE }) => ACK_TYPE)).size === 4, "ACK_TYPES_NOT_COMPLETE_OR_DISTINCT");
    addBlocker(blockers, new Set(ackVerifications.map(({ ACK_NONCE }) => ACK_NONCE)).size === 4, "ACK_NONCES_NOT_DISTINCT");
  }
  return externalGateResult("XUANYAO_ACK_SET", blockers, {
    XUANYAO_ACKS: blockers.length === 0 ? "4/4_MACHINE_VERIFIED" : "INCOMPLETE",
    ACK_CHANNEL_READY: blockers.length === 0,
    NEXT_ACTION: blockers.length === 0 ? "PROCESS_T2_GATE_UNDER_EXISTING_POLICY" : "WAIT_FOR_VERIFIED_XUANYAO_ACK_RESPONSES",
  });
}

export async function verifyHengyaoSecureSignerConnection({ evidence, providerVerifier, now } = {}) {
  const request = HENGYAO_SECURE_SIGNER_CONNECTION_REQUEST_V1;
  const blockers = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return externalGateResult("HENGYAO_SECURE_SIGNER_CONNECTION", ["SECURE_SIGNER_EVIDENCE_REQUIRED"], {
      REQUEST_ID: request.REQUEST_ID,
      EXTERNAL_SIGNER_CONNECTED: false,
    });
  }
  const required = [
    "REGISTERED_HENGYAO_WALLET", "CHAIN_ID", "SIGNER_PROVIDER_ID", "SIGNER_ADDRESS_BINDING", "POLICY_HASH",
    "ALLOWED_TARGET", "ALLOWED_SELECTORS", "NONCE_SOURCE", "GAS_ESTIMATE_SUPPORT", "BROADCAST_CAPABILITY",
    "RECEIPT_QUERY_CAPABILITY", "CANONICAL_BLOCK_HASH_VALIDATION", "MIN_CONFIRMATIONS", "PRIVATE_KEY_OUTPUT",
    "SEED_OUTPUT", "GENERAL_PURPOSE_SIGNING", "ARBITRARY_TRANSFER",
  ];
  for (const field of required) addBlocker(blockers, Object.hasOwn(evidence, field), `${field}_REQUIRED`);
  addBlocker(blockers, sameStringList(Object.keys(evidence).sort(), [...required].sort()), "SIGNER_EVIDENCE_FIELDS_INVALID");
  addBlocker(blockers, !containsSignerSecretMaterial(evidence), "SECRET_MATERIAL_OR_FORBIDDEN_CAPABILITY_PRESENT");
  addBlocker(blockers, nonempty(evidence.SIGNER_PROVIDER_ID), "SIGNER_PROVIDER_ID_INVALID");
  addBlocker(blockers, !HENGYAO_SELF_ISSUER_IDS.has(String(evidence.SIGNER_PROVIDER_ID ?? "").toLowerCase())
    && String(evidence.SIGNER_PROVIDER_ID ?? "") !== "衡曜", "SELF_ASSERTED_SIGNER_PROVIDER_FORBIDDEN");
  try {
    addBlocker(blockers, address(evidence.REGISTERED_HENGYAO_WALLET, "EVIDENCE_REGISTERED_WALLET") === address(request.REGISTERED_HENGYAO_WALLET, "REQUEST_REGISTERED_WALLET"), "REGISTERED_HENGYAO_WALLET_MISMATCH");
    addBlocker(blockers, address(evidence.SIGNER_ADDRESS_BINDING, "EVIDENCE_SIGNER_BINDING") === address(request.SIGNER_ADDRESS_BINDING, "REQUEST_SIGNER_BINDING"), "SIGNER_ADDRESS_BINDING_MISMATCH");
    addBlocker(blockers, address(evidence.ALLOWED_TARGET, "EVIDENCE_ALLOWED_TARGET") === address(request.ALLOWED_TARGET, "REQUEST_ALLOWED_TARGET"), "ALLOWED_TARGET_MISMATCH");
  } catch (error) {
    blockers.push(error?.message || "SIGNER_ADDRESS_EVIDENCE_INVALID");
  }
  addBlocker(blockers, Number(evidence.CHAIN_ID) === request.CHAIN_ID, "CHAIN_ID_MISMATCH");
  addBlocker(blockers, evidence.POLICY_HASH === request.POLICY_HASH
    && evidence.POLICY_HASH === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalPolicyScopeHash, "POLICY_HASH_MISMATCH");
  addBlocker(blockers, sameStringList(evidence.ALLOWED_SELECTORS, request.ALLOWED_SELECTORS), "ALLOWED_SELECTORS_MISMATCH");
  addBlocker(blockers, evidence.NONCE_SOURCE === request.NONCE_SOURCE, "NONCE_SOURCE_MISMATCH");
  for (const field of ["GAS_ESTIMATE_SUPPORT", "BROADCAST_CAPABILITY", "RECEIPT_QUERY_CAPABILITY", "CANONICAL_BLOCK_HASH_VALIDATION"]) {
    addBlocker(blockers, evidence[field] === true, `${field}_REQUIRED`);
  }
  addBlocker(blockers, Number(evidence.MIN_CONFIRMATIONS) === request.MIN_CONFIRMATIONS, "MIN_CONFIRMATIONS_MISMATCH");
  for (const field of SIGNER_DENIAL_FIELDS) addBlocker(blockers, evidence[field] === false, `${field}_MUST_BE_FALSE`);

  let currentTime = Number.NaN;
  try { currentTime = isoTime(now, "CURRENT_TIME").milliseconds; }
  catch (error) { blockers.push(error?.message || "CURRENT_TIME_INVALID"); }
  let providerResult = null;
  if (typeof providerVerifier !== "function") {
    blockers.push("HOST_REGISTERED_EXTERNAL_SIGNER_PROVIDER_VERIFIER_REQUIRED");
  } else {
    try {
      providerResult = await providerVerifier({ request, evidence: deepFreeze(structuredClone(evidence)), now });
    } catch {
      blockers.push("EXTERNAL_SIGNER_PROVIDER_VERIFICATION_FAILED");
    }
  }
  if (!providerResult || typeof providerResult !== "object") {
    blockers.push("EXTERNAL_SIGNER_PROVIDER_VERIFICATION_RESULT_REQUIRED");
  } else {
    addBlocker(blockers, !containsSignerSecretMaterial(providerResult), "SIGNER_PROVIDER_RESULT_SECRET_MATERIAL_FORBIDDEN");
    addBlocker(blockers, providerResult.VERIFIED === true, "SIGNER_PROVIDER_ATTESTATION_NOT_VERIFIED");
    addBlocker(blockers, providerResult.SIGNER_PROVIDER_ID === evidence.SIGNER_PROVIDER_ID, "SIGNER_PROVIDER_ID_VERIFIER_MISMATCH");
    try {
      addBlocker(blockers, address(providerResult.REGISTERED_HENGYAO_WALLET, "VERIFIER_REGISTERED_WALLET") === address(evidence.REGISTERED_HENGYAO_WALLET, "EVIDENCE_REGISTERED_WALLET"), "REGISTERED_WALLET_VERIFIER_MISMATCH");
      addBlocker(blockers, address(providerResult.SIGNER_ADDRESS_BINDING, "VERIFIER_SIGNER_BINDING") === address(evidence.SIGNER_ADDRESS_BINDING, "EVIDENCE_SIGNER_BINDING"), "SIGNER_ADDRESS_VERIFIER_MISMATCH");
      addBlocker(blockers, address(providerResult.ALLOWED_TARGET, "VERIFIER_ALLOWED_TARGET") === address(evidence.ALLOWED_TARGET, "EVIDENCE_ALLOWED_TARGET"), "ALLOWED_TARGET_VERIFIER_MISMATCH");
    } catch (error) {
      blockers.push(error?.message || "SIGNER_PROVIDER_ADDRESS_RESULT_INVALID");
    }
    addBlocker(blockers, Number(providerResult.CHAIN_ID) === Number(evidence.CHAIN_ID), "CHAIN_ID_VERIFIER_MISMATCH");
    addBlocker(blockers, providerResult.POLICY_HASH === evidence.POLICY_HASH, "POLICY_HASH_VERIFIER_MISMATCH");
    addBlocker(blockers, sameStringList(providerResult.ALLOWED_SELECTORS, evidence.ALLOWED_SELECTORS), "SELECTORS_VERIFIER_MISMATCH");
    addBlocker(blockers, providerResult.NONCE_SOURCE === evidence.NONCE_SOURCE, "NONCE_SOURCE_VERIFIER_MISMATCH");
    addBlocker(blockers, Number(providerResult.MIN_CONFIRMATIONS) === Number(evidence.MIN_CONFIRMATIONS), "MIN_CONFIRMATIONS_VERIFIER_MISMATCH");
    for (const field of ["GAS_ESTIMATE_SUPPORT", "BROADCAST_CAPABILITY", "RECEIPT_QUERY_CAPABILITY", "CANONICAL_BLOCK_HASH_VALIDATION"]) {
      addBlocker(blockers, providerResult[field] === true, `${field}_NOT_PROVIDER_VERIFIED`);
    }
    for (const field of SIGNER_DENIAL_FIELDS) addBlocker(blockers, providerResult[field] === false, `${field}_PROVIDER_DENIAL_REQUIRED`);
    addBlocker(blockers, /^[0-9a-f]{64}$/u.test(String(providerResult.ATTESTATION_DIGEST ?? "")), "SIGNER_ATTESTATION_DIGEST_INVALID");
    addBlocker(blockers, nonempty(providerResult.PROVIDER_ATTESTATION_ID), "SIGNER_PROVIDER_ATTESTATION_ID_REQUIRED");
    try {
      const verifiedAt = isoTime(providerResult.VERIFIED_AT, "SIGNER_PROVIDER_VERIFIED_AT").milliseconds;
      addBlocker(blockers, Number.isFinite(currentTime) && verifiedAt <= currentTime, "SIGNER_PROVIDER_VERIFIED_AT_INVALID");
    } catch (error) {
      blockers.push(error?.message || "SIGNER_PROVIDER_VERIFIED_AT_INVALID");
    }
  }
  const result = externalGateResult("HENGYAO_SECURE_SIGNER_CONNECTION", blockers, {
    REQUEST_ID: request.REQUEST_ID,
    SIGNER_PROVIDER_ID: evidence.SIGNER_PROVIDER_ID ?? null,
    SIGNER_ADDRESS_BINDING: evidence.SIGNER_ADDRESS_BINDING ?? null,
    POLICY_HASH: evidence.POLICY_HASH ?? null,
    EXTERNAL_SIGNER_CONNECTED: blockers.length === 0,
    HEARTBEAT_EXECUTION_READY: blockers.length === 0,
    FIRST_ACTION: blockers.length === 0 ? request.FIRST_ACTION_AFTER_MACHINE_VERIFICATION : null,
    VERIFIED_AT: blockers.length === 0 ? providerResult.VERIFIED_AT : null,
    PROVIDER_ATTESTATION_ID: blockers.length === 0 ? providerResult.PROVIDER_ATTESTATION_ID : null,
    ATTESTATION_DIGEST: blockers.length === 0 ? providerResult.ATTESTATION_DIGEST : null,
    AUTO_CONTINUE_AFTER_CANONICAL_RECEIPT: blockers.length === 0 ? request.AUTO_CONTINUE_AFTER_CANONICAL_RECEIPT : [],
  });
  if (result.status === "PASS") VERIFIED_EXTERNAL_SIGNER_CONNECTIONS.add(result);
  return result;
}

export function createHeartbeatClaimHandoff({ signerConnectionVerification, expectedNonce, replayNonce, createdAt, expiresAt, missionId = "KAIOS-FIRST-HEARTBEAT" } = {}) {
  if (!VERIFIED_EXTERNAL_SIGNER_CONNECTIONS.has(signerConnectionVerification)) throw new Error("VERIFIED_EXTERNAL_SIGNER_CONNECTION_REQUIRED");
  const intent = createLifeTransactionIntent({
    methodSignature: "heartbeatClaim()",
    args: [],
    expectedNonce,
    replayNonce,
    createdAt,
    expiresAt,
    missionId,
  });
  return deepFreeze({
    status: "READY_FOR_EXISTING_TRANSACTION_GATE",
    requestId: HENGYAO_SECURE_SIGNER_CONNECTION_REQUEST_V1.REQUEST_ID,
    signerProviderId: signerConnectionVerification.SIGNER_PROVIDER_ID,
    firstAction: "heartbeatClaim()",
    intent,
    broadcast: false,
    privateKeyAccess: false,
    nextAction: "SIMULATE_RESERVE_AND_SUBMIT_TO_VERIFIED_EXTERNAL_SIGNER",
  });
}

export function encodeAllowedHeartCalldata(signature, args = []) {
  const method = methodPolicy(signature);
  const normalized = normalizeIntentArgs(signature, args);
  if (signature === "heartbeatClaim()") return method.selector;
  if (signature === "makeWish(bytes32)") return `${method.selector}${normalized[0].slice(2)}`;
  if (signature === "fortuneClaim(uint256)") return `${method.selector}${uintWord(normalized[0], "FORTUNE_AMOUNT_WHOLE")}`;
  return `${method.selector}${uintWord(normalized[0], "VOW_OPTION", 255n)}${uintWord(normalized[1], "VOW_AMOUNT_WHOLE")}`;
}

export function createLifeTransactionIntent({
  methodSignature,
  args = [],
  expectedNonce,
  replayNonce,
  createdAt,
  expiresAt,
  missionId,
  valueWei = "0",
} = {}) {
  const policy = HENGYAO_LIFE_TRANSACTION_POLICY_V1;
  const method = methodPolicy(methodSignature);
  const normalizedArgs = normalizeIntentArgs(methodSignature, args);
  const created = isoTime(createdAt, "INTENT_CREATED_AT");
  const expiry = isoTime(expiresAt, "INTENT_EXPIRES_AT");
  if (expiry.milliseconds <= created.milliseconds || expiry.milliseconds - created.milliseconds > MAX_INTENT_LIFETIME_SECONDS * 1_000) {
    throw new Error("INTENT_EXPIRY_WINDOW_INVALID");
  }
  const replay = bytes32(replayNonce, "REPLAY_NONCE", { nonzero: true });
  const nonce = quantity(expectedNonce, "EXPECTED_NONCE").toString();
  const nativeValue = quantity(valueWei, "INTENT_VALUE_WEI").toString();
  if (nativeValue !== method.maxNativeValueWei) throw new Error("NATIVE_VALUE_FORBIDDEN");
  if (!String(missionId ?? "").trim()) throw new Error("MISSION_ID_REQUIRED");
  const payload = {
    policyVersion: policy.schemaVersion,
    policyId: policy.policyId,
    lifeId: policy.lifeId,
    workerId: policy.workerId,
    walletAddress: policy.walletAddress,
    chainId: policy.chainId,
    target: policy.allowedTarget.address,
    targetCodeHash: policy.allowedTarget.codeHash,
    methodSignature,
    selector: method.selector,
    args: normalizedArgs,
    calldata: encodeAllowedHeartCalldata(methodSignature, normalizedArgs),
    valueWei: nativeValue,
    expectedNonce: nonce,
    replayNonce: replay,
    missionId: String(missionId),
    createdAt: created.text,
    expiresAt: expiry.text,
  };
  return deepFreeze({ ...payload, intentId: sha256(stableStringify(payload)) });
}

function addBlocker(blockers, condition, code) {
  if (!condition) blockers.push(code);
}

function contextSimulationMatches(intent, context, method) {
  const simulation = context.simulation;
  if (!simulation || simulation.status !== "PASS") return false;
  try {
    return Number(simulation.chainId) === intent.chainId
      && address(simulation.from, "SIMULATION_FROM") === address(intent.walletAddress, "INTENT_WALLET")
      && address(simulation.to, "SIMULATION_TO") === address(intent.target, "INTENT_TARGET")
      && String(simulation.calldata ?? "").toLowerCase() === intent.calldata.toLowerCase()
      && quantity(simulation.valueWei, "SIMULATION_VALUE") === quantity(intent.valueWei, "INTENT_VALUE")
      && quantity(simulation.nonce, "SIMULATION_NONCE") === quantity(intent.expectedNonce, "INTENT_NONCE")
      && quantity(simulation.gasEstimate, "SIMULATION_GAS_ESTIMATE") > 0n
      && quantity(simulation.gasEstimate, "SIMULATION_GAS_ESTIMATE") <= quantity(method.maxGasUnits, "METHOD_MAX_GAS")
      && Number.isSafeInteger(Number(simulation.blockNumber))
      && Number(simulation.blockNumber) > 0;
  } catch {
    return false;
  }
}

function methodContextBlockers(intent, context, blockers) {
  if (intent.methodSignature === "heartbeatClaim()") {
    addBlocker(blockers, context.heartbeatEligible === true, "HEARTBEAT_NOT_ELIGIBLE");
    addBlocker(blockers, String(context.heartbeatRewardWhole) === "1", "HEARTBEAT_REWARD_NOT_EXACTLY_1_KGEN");
  }
  if (intent.methodSignature === "makeWish(bytes32)") {
    addBlocker(blockers, context.wishEligible === true, "WISH_NOT_ELIGIBLE");
  }
  if (intent.methodSignature === "fortuneClaim(uint256)") {
    addBlocker(blockers, context.fortuneEligible === true, "FORTUNE_NOT_ELIGIBLE");
    addBlocker(blockers, quantity(context.currentKgenWei ?? "0", "CURRENT_KGEN_WEI") >= KGEN_WEI, "FORTUNE_PREEXISTING_1_KGEN_PASS_REQUIRED");
  }
  if (intent.methodSignature === "vowTo(uint8,uint256)") {
    const amountWhole = quantity(intent.args[1], "VOW_AMOUNT_WHOLE");
    const amountRaw = amountWhole * KGEN_WEI;
    addBlocker(blockers, quantity(context.verifiedVowProfitWhole ?? "0", "VERIFIED_VOW_PROFIT") === amountWhole, "VOW_AMOUNT_NOT_EXACT_VERIFIED_NET_PROFIT");
    addBlocker(blockers, Boolean(String(context.verifiedVowProfitEvidenceId ?? "").trim()), "VOW_PROFIT_EVIDENCE_REQUIRED");
    addBlocker(blockers, quantity(context.currentKgenWei ?? "0", "CURRENT_KGEN_WEI") >= amountRaw, "VOW_KGEN_BALANCE_INSUFFICIENT");
    addBlocker(blockers, quantity(context.currentHeartAllowanceWei ?? "0", "CURRENT_HEART_ALLOWANCE_WEI") >= amountRaw, "VOW_PREEXISTING_ALLOWANCE_REQUIRED");
  }
}

export function evaluateLifeTransactionIntent({ intent, trustedContext, signerConnectionVerification, journal, now } = {}) {
  const blockers = [];
  if (!intent || typeof intent !== "object" || !trustedContext || typeof trustedContext !== "object") {
    return deepFreeze({ status: "REJECTED", blockers: ["INTENT_AND_TRUSTED_CONTEXT_REQUIRED"], broadcast: false, privateKeyAccess: false });
  }
  addBlocker(blockers, !containsSecretField(intent) && !containsSecretField(trustedContext), "SECRET_MATERIAL_FORBIDDEN");
  let method;
  try { method = methodPolicy(intent.methodSignature); }
  catch { blockers.push("METHOD_NOT_ALLOWLISTED"); }
  if (!method) return deepFreeze({ status: "REJECTED", intentId: intent.intentId ?? null, blockers: [...new Set(blockers)], broadcast: false, privateKeyAccess: false });

  try {
    const normalizedArgs = normalizeIntentArgs(intent.methodSignature, intent.args);
    const expectedCalldata = encodeAllowedHeartCalldata(intent.methodSignature, normalizedArgs);
    const { intentId, ...payload } = intent;
    addBlocker(blockers, sha256(stableStringify(payload)) === intentId, "INTENT_ID_MISMATCH");
    addBlocker(blockers, intent.policyVersion === HENGYAO_LIFE_TRANSACTION_POLICY_V1.schemaVersion, "POLICY_VERSION_MISMATCH");
    addBlocker(blockers, intent.policyId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.policyId, "POLICY_ID_MISMATCH");
    addBlocker(blockers, HENGYAO_A2_HUMAN_DECISION_VALID, "DURABLE_HUMAN_DECISION_INVALID");
    const verifiedExternalSigner = VERIFIED_EXTERNAL_SIGNER_CONNECTIONS.has(signerConnectionVerification)
      && signerConnectionVerification.POLICY_HASH === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalPolicyScopeHash
      && address(signerConnectionVerification.SIGNER_ADDRESS_BINDING, "VERIFIED_SIGNER_BINDING") === address(HENGYAO_LIFE_TRANSACTION_POLICY_V1.walletAddress, "POLICY_WALLET");
    addBlocker(blockers, verifiedExternalSigner
      && HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.currentAuthority === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.requiredAuthority
      && Boolean(String(HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalEvidenceId ?? "").trim()), "DURABLE_POLICY_NOT_ACTIVATED");
    addBlocker(blockers, verifiedExternalSigner, "DURABLE_SECURE_SIGNER_BINDING_REQUIRED");
    addBlocker(blockers, intent.lifeId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.lifeId && intent.lifeId === trustedContext.lifeId, "LIFE_ID_MISMATCH");
    addBlocker(blockers, intent.workerId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.workerId && intent.workerId === trustedContext.workerId, "WORKER_ID_MISMATCH");
    addBlocker(blockers, address(intent.walletAddress, "INTENT_WALLET") === address(HENGYAO_LIFE_TRANSACTION_POLICY_V1.walletAddress, "POLICY_WALLET")
      && address(intent.walletAddress, "INTENT_WALLET") === address(trustedContext.walletAddress, "CONTEXT_WALLET"), "WALLET_BINDING_MISMATCH");
    addBlocker(blockers, Number(intent.chainId) === HENGYAO_LIFE_TRANSACTION_POLICY_V1.chainId && Number(intent.chainId) === Number(trustedContext.chainId), "CHAIN_ID_MISMATCH");
    addBlocker(blockers, address(intent.target, "INTENT_TARGET") === address(HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedTarget.address, "POLICY_TARGET")
      && address(intent.target, "INTENT_TARGET") === address(trustedContext.target, "CONTEXT_TARGET"), "TARGET_MISMATCH");
    addBlocker(blockers, bytes32(intent.targetCodeHash, "INTENT_CODE_HASH") === bytes32(HENGYAO_LIFE_TRANSACTION_POLICY_V1.allowedTarget.codeHash, "POLICY_CODE_HASH")
      && bytes32(intent.targetCodeHash, "INTENT_CODE_HASH") === bytes32(trustedContext.targetCodeHash, "CONTEXT_CODE_HASH"), "TARGET_CODE_HASH_MISMATCH");
    addBlocker(blockers, intent.selector.toLowerCase() === method.selector.toLowerCase() && intent.calldata.toLowerCase() === expectedCalldata.toLowerCase(), "SELECTOR_OR_CALLDATA_MISMATCH");
    addBlocker(blockers, quantity(intent.valueWei, "INTENT_VALUE_WEI") === 0n, "NATIVE_VALUE_FORBIDDEN");
    addBlocker(blockers, quantity(intent.expectedNonce, "INTENT_NONCE") === quantity(trustedContext.currentNonce, "CURRENT_NONCE"), "NONCE_STALE_OR_MISMATCHED");
    const currentTime = isoTime(now, "CURRENT_TIME").milliseconds;
    const created = isoTime(intent.createdAt, "INTENT_CREATED_AT").milliseconds;
    const expiry = isoTime(intent.expiresAt, "INTENT_EXPIRES_AT").milliseconds;
    addBlocker(blockers, currentTime >= created && currentTime < expiry && expiry - created <= MAX_INTENT_LIFETIME_SECONDS * 1_000, "INTENT_EXPIRED_OR_TIME_INVALID");
    bytes32(intent.replayNonce, "REPLAY_NONCE", { nonzero: true });
    addBlocker(blockers, trustedContext.currentAuthority === "A2_PERSONAL_LOW_RISK_SIGNING", "A2_AUTHORITY_REQUIRED");
    addBlocker(blockers, trustedContext.policyApproval?.status === "APPROVED_ACTIVE"
      && trustedContext.policyApproval?.policyId === intent.policyId
      && trustedContext.policyApproval?.decisionId === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalEvidenceId
      && trustedContext.policyApproval?.decisionHash === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalDecisionHash
      && trustedContext.policyApproval?.policyScopeHash === HENGYAO_LIFE_TRANSACTION_POLICY_V1.activation.approvalPolicyScopeHash,
    "MACHINE_VERIFIABLE_POLICY_APPROVAL_REQUIRED");
    addBlocker(blockers, trustedContext.securityStatus === "HEALTHY", "SECURITY_STATUS_BLOCKED");
    addBlocker(blockers, trustedContext.secureSignerConnected === true
      && address(trustedContext.secureSignerAddress, "SECURE_SIGNER_ADDRESS") === address(intent.walletAddress, "INTENT_WALLET"), "SECURE_SIGNER_BINDING_REQUIRED");
    addBlocker(blockers, contextSimulationMatches(intent, trustedContext, method), "SIMULATION_OR_GAS_ESTIMATE_INVALID");
    const gasCost = quantity(trustedContext.simulation?.gasEstimate ?? "0", "GAS_ESTIMATE") * quantity(trustedContext.gasPriceWei ?? "0", "GAS_PRICE_WEI");
    const currentBnb = quantity(trustedContext.currentBnbWei ?? "0", "CURRENT_BNB_WEI");
    const reserve = quantity(trustedContext.minimumBnbReserveWei ?? "0", "MINIMUM_BNB_RESERVE_WEI");
    addBlocker(blockers, currentBnb >= gasCost + reserve, "BNB_SURVIVAL_RESERVE_VIOLATION");
    methodContextBlockers(intent, trustedContext, blockers);
    addBlocker(blockers, journal instanceof TransactionReplayJournal, "DURABLE_REPLAY_JOURNAL_REQUIRED");
    if (journal instanceof TransactionReplayJournal) {
      addBlocker(blockers, !journal.hasIntent(intent.intentId), "INTENT_ALREADY_RESERVED");
      addBlocker(blockers, !journal.hasReplayNonce(intent.replayNonce), "REPLAY_NONCE_ALREADY_USED");
    }
  } catch (error) {
    blockers.push(error?.message || "INTENT_VALIDATION_FAILED");
  }
  const uniqueBlockers = [...new Set(blockers)].sort();
  const result = deepFreeze({
    status: uniqueBlockers.length ? "REJECTED" : "APPROVED_FOR_EXTERNAL_SECURE_SIGNER",
    intentId: intent.intentId ?? null,
    policyId: HENGYAO_LIFE_TRANSACTION_POLICY_V1.policyId,
    blockers: uniqueBlockers,
    calldataHash: typeof intent.calldata === "string" ? sha256(intent.calldata.toLowerCase()) : null,
    broadcast: false,
    privateKeyAccess: false,
  });
  if (result.status === "APPROVED_FOR_EXTERNAL_SECURE_SIGNER") AUTHORIZED_DECISIONS.add(result);
  return result;
}

export class TransactionReplayJournal {
  constructor(filePath, { expectedHeadHash = null } = {}) {
    this.filePath = filePath;
    this.lockPath = `${filePath}.lock`;
    this.headHash = ZERO_HASH;
    this.sequence = 0;
    this.intents = new Map();
    this.replayNonces = new Set();
    this.transactionHashes = new Set();
    this.#load();
    if (expectedHeadHash && expectedHeadHash !== this.headHash) throw new Error("TRANSACTION_JOURNAL_TRUSTED_CHECKPOINT_MISMATCH");
  }

  #reset() {
    this.headHash = ZERO_HASH;
    this.sequence = 0;
    this.intents = new Map();
    this.replayNonces = new Set();
    this.transactionHashes = new Set();
  }

  #load() {
    if (!fs.existsSync(this.filePath)) return;
    const lines = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/u).filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line);
      const { recordHash, ...payload } = record;
      if (record.previousHash !== this.headHash) throw new Error("TRANSACTION_JOURNAL_HASH_CHAIN_BROKEN");
      if (record.sequence !== this.sequence + 1) throw new Error("TRANSACTION_JOURNAL_SEQUENCE_INVALID");
      if (sha256(stableStringify(payload)) !== recordHash) throw new Error("TRANSACTION_JOURNAL_RECORD_HASH_MISMATCH");
      const previous = this.intents.get(record.intentId);
      if (record.eventType === "INTENT_RESERVED") {
        if (previous || this.replayNonces.has(record.replayNonce)) throw new Error("TRANSACTION_JOURNAL_REPLAYED_INTENT");
        this.replayNonces.add(record.replayNonce);
      } else if (record.eventType === "RECEIPT_APPLIED") {
        if (!previous || previous.eventType !== "INTENT_RESERVED") throw new Error("TRANSACTION_JOURNAL_RECEIPT_WITHOUT_RESERVATION");
        if (this.transactionHashes.has(record.txHash)) throw new Error("TRANSACTION_JOURNAL_DUPLICATE_TX_HASH");
        this.transactionHashes.add(record.txHash);
      } else {
        throw new Error("TRANSACTION_JOURNAL_EVENT_TYPE_INVALID");
      }
      this.intents.set(record.intentId, record);
      this.sequence = record.sequence;
      this.headHash = record.recordHash;
    }
  }

  #append(payload, validateCurrent) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    let lock;
    try {
      lock = fs.openSync(this.lockPath, "wx", 0o600);
    } catch {
      throw new Error("TRANSACTION_JOURNAL_LOCKED");
    }
    try {
      this.#reset();
      this.#load();
      validateCurrent();
      const recordPayload = { sequence: this.sequence + 1, ...payload, previousHash: this.headHash };
      const record = { ...recordPayload, recordHash: sha256(stableStringify(recordPayload)) };
      const descriptor = fs.openSync(this.filePath, "a", 0o600);
      try {
        fs.writeSync(descriptor, `${JSON.stringify(record)}\n`, null, "utf8");
        fs.fsyncSync(descriptor);
      } finally {
        fs.closeSync(descriptor);
      }
      this.#reset();
      this.#load();
      return record;
    } finally {
      if (lock !== undefined) fs.closeSync(lock);
      fs.unlinkSync(this.lockPath);
    }
  }

  hasIntent(intentId) { return this.intents.has(String(intentId)); }
  hasReplayNonce(replayNonce) { return this.replayNonces.has(String(replayNonce).toLowerCase()); }
  getIntentRecord(intentId) { return this.intents.get(String(intentId)) ?? null; }

  reserve(intent, recordedAt, authorizationDecision) {
    if (!AUTHORIZED_DECISIONS.has(authorizationDecision)
      || authorizationDecision.intentId !== intent.intentId
      || authorizationDecision.status !== "APPROVED_FOR_EXTERNAL_SECURE_SIGNER") {
      throw new Error("AUTHORIZED_INTENT_DECISION_REQUIRED");
    }
    const replayNonce = bytes32(intent.replayNonce, "REPLAY_NONCE", { nonzero: true });
    return this.#append({
      eventType: "INTENT_RESERVED",
      intentId: intent.intentId,
      replayNonce,
      policyId: intent.policyId,
      lifeId: intent.lifeId,
      workerId: intent.workerId,
      methodSignature: intent.methodSignature,
      txHash: null,
      recordedAt: isoTime(recordedAt, "RESERVATION_RECORDED_AT").text,
    }, () => {
      if (this.intents.has(intent.intentId)) throw new Error("INTENT_ALREADY_RESERVED");
      if (this.replayNonces.has(replayNonce)) throw new Error("REPLAY_NONCE_ALREADY_USED");
    });
  }

  applyReceipt({ intent, receiptEvidence, recordedAt }) {
    if (!VERIFIED_RECEIPT_EVIDENCE.has(receiptEvidence)) throw new Error("VERIFIED_RECEIPT_EVIDENCE_REQUIRED");
    const txHash = bytes32(receiptEvidence.txHash, "TRANSACTION_HASH");
    return this.#append({
      eventType: "RECEIPT_APPLIED",
      intentId: intent.intentId,
      replayNonce: intent.replayNonce,
      policyId: intent.policyId,
      lifeId: intent.lifeId,
      workerId: intent.workerId,
      methodSignature: intent.methodSignature,
      txHash,
      blockNumber: receiptEvidence.blockNumber,
      blockHash: receiptEvidence.blockHash,
      confirmationCount: receiptEvidence.confirmationCount,
      evidenceHash: receiptEvidence.evidenceHash,
      recordedAt: isoTime(recordedAt, "RECEIPT_RECORDED_AT").text,
    }, () => {
      const previous = this.intents.get(intent.intentId);
      if (!previous || previous.eventType !== "INTENT_RESERVED") throw new Error("INTENT_RESERVATION_REQUIRED");
      if (this.transactionHashes.has(txHash)) throw new Error("TRANSACTION_HASH_ALREADY_APPLIED");
    });
  }
}

export function reserveAuthorizedLifeTransaction({ intent, trustedContext, signerConnectionVerification, journal, now } = {}) {
  const decision = evaluateLifeTransactionIntent({ intent, trustedContext, signerConnectionVerification, journal, now });
  if (decision.status !== "APPROVED_FOR_EXTERNAL_SECURE_SIGNER") return decision;
  const journalRecord = journal.reserve(intent, now, decision);
  return deepFreeze({
    ...decision,
    status: "RESERVED_FOR_EXTERNAL_SECURE_SIGNER",
    journalRecordHash: journalRecord.recordHash,
    journalHeadHash: journal.headHash,
    broadcasterIncluded: false,
    broadcast: false,
  });
}

function findExactLog(logs, { contract, topic0, topic1 = null }) {
  return (logs ?? []).filter((log) => {
    try {
      return address(log.address, "LOG_ADDRESS") === address(contract, "EXPECTED_LOG_ADDRESS")
        && String(log.topics?.[0] ?? "").toLowerCase() === topic0
        && (topic1 === null || String(log.topics?.[1] ?? "").toLowerCase() === topic1.toLowerCase());
    } catch {
      return false;
    }
  });
}

function exactTransferLogs(logs, { token, from, to, amountRaw }) {
  return (logs ?? []).filter((log) => {
    try {
      const words = dataWords(log.data, "TRANSFER_DATA");
      return address(log.address, "TRANSFER_TOKEN") === address(token, "EXPECTED_TOKEN")
        && String(log.topics?.[0] ?? "").toLowerCase() === ERC20_TRANSFER_TOPIC
        && addressFromTopic(log.topics?.[1], "TRANSFER_FROM") === address(from, "EXPECTED_TRANSFER_FROM")
        && addressFromTopic(log.topics?.[2], "TRANSFER_TO") === address(to, "EXPECTED_TRANSFER_TO")
        && words.length === 1
        && BigInt(`0x${words[0]}`) === amountRaw;
    } catch {
      return false;
    }
  });
}

function verifyMethodReceipt(intent, receipt) {
  const policy = HENGYAO_LIFE_TRANSACTION_POLICY_V1;
  const userTopic = topicAddress(intent.walletAddress);
  const eventLogs = findExactLog(receipt.logs, { contract: intent.target, topic0: EVENT_TOPICS[intent.methodSignature], topic1: userTopic });
  if (eventLogs.length !== 1) throw new Error("EXACT_HEART_EVENT_REQUIRED");
  const words = dataWords(eventLogs[0].data, "HEART_EVENT_DATA");
  if (intent.methodSignature === "heartbeatClaim()") {
    if (words.length !== 1 || BigInt(`0x${words[0]}`) !== 1n) throw new Error("HEARTBEAT_EVENT_REWARD_MISMATCH");
    if (exactTransferLogs(receipt.logs, { token: policy.tokenRegistry.KGEN, from: intent.target, to: intent.walletAddress, amountRaw: KGEN_WEI }).length !== 1) {
      throw new Error("HEARTBEAT_EXACT_1_KGEN_TRANSFER_REQUIRED");
    }
  } else if (intent.methodSignature === "fortuneClaim(uint256)") {
    const amountRaw = quantity(intent.args[0], "FORTUNE_AMOUNT_WHOLE") * KGEN_WEI;
    if (words.length !== 1 || BigInt(`0x${words[0]}`) !== amountRaw) throw new Error("FORTUNE_EVENT_AMOUNT_MISMATCH");
    if (exactTransferLogs(receipt.logs, { token: policy.tokenRegistry.KGEN, from: intent.target, to: intent.walletAddress, amountRaw }).length !== 1) {
      throw new Error("FORTUNE_EXACT_KGEN_TRANSFER_REQUIRED");
    }
  } else if (intent.methodSignature === "makeWish(bytes32)") {
    if (words.length !== 1 || `0x${words[0]}` !== intent.args[0]) throw new Error("WISH_EVENT_HASH_MISMATCH");
  } else {
    const option = quantity(intent.args[0], "VOW_OPTION");
    const amountRaw = quantity(intent.args[1], "VOW_AMOUNT_WHOLE") * KGEN_WEI;
    if (words.length !== 2 || BigInt(`0x${words[0]}`) !== option || BigInt(`0x${words[1]}`) !== amountRaw) throw new Error("VOW_EVENT_ARGUMENT_MISMATCH");
    if (exactTransferLogs(receipt.logs, { token: policy.tokenRegistry.KGEN, from: intent.walletAddress, to: intent.target, amountRaw }).length !== 1) {
      throw new Error("VOW_EXACT_KGEN_TRANSFER_REQUIRED");
    }
  }
}

export function verifyAndApplyLifeTransactionReceipt({
  intent,
  transaction,
  receipt,
  canonicalBlock,
  observedHeadBlockNumber,
  journal,
  recordedAt,
} = {}) {
  if (!(journal instanceof TransactionReplayJournal)) throw new Error("DURABLE_REPLAY_JOURNAL_REQUIRED");
  const reservation = journal.getIntentRecord(intent.intentId);
  if (!reservation || reservation.eventType !== "INTENT_RESERVED") throw new Error("INTENT_RESERVATION_REQUIRED");
  const txHash = bytes32(transaction?.hash, "TRANSACTION_HASH");
  if (bytes32(receipt?.transactionHash, "RECEIPT_TRANSACTION_HASH") !== txHash) throw new Error("TRANSACTION_HASH_MISMATCH");
  if (address(transaction.from, "TRANSACTION_FROM") !== address(intent.walletAddress, "INTENT_WALLET")) throw new Error("TRANSACTION_SENDER_MISMATCH");
  if (address(transaction.to, "TRANSACTION_TO") !== address(intent.target, "INTENT_TARGET")) throw new Error("TRANSACTION_TARGET_MISMATCH");
  if (String(transaction.input ?? "").toLowerCase() !== intent.calldata.toLowerCase()) throw new Error("TRANSACTION_CALLDATA_MISMATCH");
  if (rpcQuantity(transaction.value ?? "0", "TRANSACTION_VALUE") !== quantity(intent.valueWei, "INTENT_VALUE")) throw new Error("TRANSACTION_VALUE_MISMATCH");
  if (rpcQuantity(transaction.nonce, "TRANSACTION_NONCE") !== quantity(intent.expectedNonce, "INTENT_NONCE")) throw new Error("TRANSACTION_NONCE_MISMATCH");
  if (rpcQuantity(receipt.status, "RECEIPT_STATUS") !== 1n) throw new Error("TRANSACTION_RECEIPT_FAILED");
  const blockNumber = rpcQuantity(receipt.blockNumber, "RECEIPT_BLOCK_NUMBER");
  if (blockNumber <= 0n || blockNumber !== rpcQuantity(canonicalBlock?.number, "CANONICAL_BLOCK_NUMBER")) throw new Error("CANONICAL_BLOCK_NUMBER_MISMATCH");
  const blockHash = bytes32(receipt.blockHash, "RECEIPT_BLOCK_HASH");
  if (bytes32(canonicalBlock?.hash, "CANONICAL_BLOCK_HASH") !== blockHash) throw new Error("CANONICAL_BLOCK_HASH_MISMATCH");
  const observedHead = rpcQuantity(observedHeadBlockNumber, "OBSERVED_HEAD_BLOCK_NUMBER");
  if (observedHead < blockNumber) throw new Error("OBSERVED_HEAD_BEFORE_RECEIPT");
  const confirmationCount = observedHead - blockNumber + 1n;
  if (confirmationCount < BigInt(HENGYAO_LIFE_TRANSACTION_POLICY_V1.receipt.minimumConfirmations)) throw new Error("RECEIPT_CONFIRMATIONS_INSUFFICIENT");
  verifyMethodReceipt(intent, receipt);
  const evidencePayload = {
    intentId: intent.intentId,
    txHash,
    blockNumber: Number(blockNumber),
    blockHash,
    confirmationCount: Number(confirmationCount),
    canonicalBlockVerified: true,
    senderVerified: true,
    targetVerified: true,
    calldataVerified: true,
    eventVerified: true,
    tokenTransferVerified: intent.methodSignature !== "makeWish(bytes32)",
    finalityStatus: "CANONICAL_BLOCK_AND_MINIMUM_CONFIRMATIONS_VERIFIED",
    ledgerApply: "ALLOWED_AFTER_THIS_EVIDENCE_ONLY",
  };
  const evidence = deepFreeze({ ...evidencePayload, evidenceHash: sha256(stableStringify(evidencePayload)) });
  VERIFIED_RECEIPT_EVIDENCE.add(evidence);
  const journalRecord = journal.applyReceipt({ intent, receiptEvidence: evidence, recordedAt });
  return deepFreeze({ ...evidence, journalRecordHash: journalRecord.recordHash, journalHeadHash: journal.headHash, privateKeyAccess: false });
}
