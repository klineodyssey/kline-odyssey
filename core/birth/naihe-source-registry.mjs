import { invariant } from "../shared/errors.mjs";

export const NAIHE_SOURCE_POLICY = Object.freeze({
  status: "NOT_DEPLOYED",
  chain_id: 56,
  exact_amount_wei: "8000000000000000",
  source_registry_id: "NAIHE_K4168_SOURCE_REGISTRY_V2_CANDIDATE",
  birthplace_code: "K4168",
  minimum_confirmations: 15,
  finality_policy: "CONFIRMATION_DEPTH_AND_DOUBLE_CANONICAL_BLOCK_READ",
  canonical_registry_address: null,
  canonical_registry_code_hash: null
});

function normalizeAddress(value) { return String(value ?? "").toLowerCase(); }
function address(value, code, message) {
  invariant(/^0x[0-9a-fA-F]{40}$/.test(value ?? ""), code, message);
  return normalizeAddress(value);
}
function bytes32(value, code, message) { invariant(/^0x[0-9a-fA-F]{64}$/.test(value ?? ""), code, message); }

export class NaiheSourceRegistry {
  constructor({ sources = [], mode = "PRODUCTION", trustedTraceVerifier = null, trustedTraceProviders = [] } = {}) {
    invariant(mode === "PRODUCTION" || mode === "TEST", "NAIHE_REGISTRY_MODE_INVALID", "Naihe registry mode is invalid");
    invariant(mode !== "PRODUCTION", "NAIHE_SOURCE_NOT_DEPLOYED", "Production Naihe source registry is unconditionally disabled until canonical deployment and code hash are frozen");
    invariant(sources.every((source) => source.status === "MOCK_VERIFIED_TEST_ONLY"), "NAIHE_TEST_SOURCE_INVALID", "Test mode accepts mock-only sources and cannot self-assert a deployed production source");
    this.mode = mode;
    this.trustedTraceVerifier = trustedTraceVerifier;
    this.trustedTraceProviders = new Set(trustedTraceProviders);
    this.sources = new Map(sources.map((source) => [normalizeAddress(source.address), Object.freeze({ ...source })]));
  }

  assertCompatibleEnvironment(environment) {
    invariant(environment === "TEST" && this.mode === "TEST", "NAIHE_TEST_MODE_IN_PRODUCTION", "A test Naihe registry cannot enter a production resolver");
    return true;
  }

  verifyCandidate(candidate, { lifeId, soulId, energyWalletAddress, birthRequestId, challenge }) {
    invariant(Number.isSafeInteger(candidate.block_number) && candidate.block_number >= 0, "NAIHE_BLOCK_NUMBER_INVALID", "Naihe evidence block number is invalid");
    invariant(Number.isSafeInteger(candidate.transaction_index) && candidate.transaction_index >= 0, "NAIHE_TRANSACTION_INDEX_INVALID", "Naihe evidence transaction index is invalid");
    bytes32(candidate.tx_hash, "NAIHE_TX_HASH_INVALID", "Naihe evidence transaction hash is invalid");
    invariant(candidate.chain_id === 56, "WRONG_CHAIN", "Naihe evidence requires chain 56");
    invariant(String(candidate.value_wei) === NAIHE_SOURCE_POLICY.exact_amount_wei, "NAIHE_AMOUNT_MISMATCH", "Naihe anchor must be exactly 0.008 BNB");
    invariant(address(candidate.recipient, "NAIHE_RECIPIENT_INVALID", "Naihe recipient is invalid") === address(energyWalletAddress, "NAIHE_RECIPIENT_INVALID", "Canonical Energy Wallet address is invalid"), "NAIHE_RECIPIENT_MISMATCH", "Naihe recipient mismatch");
    invariant(candidate.life_id === lifeId && candidate.soul_id === soulId && candidate.birth_request_id === birthRequestId && candidate.challenge === challenge, "NAIHE_BINDING_MISMATCH", "Naihe request binding mismatch");
    invariant(candidate.kind === "NORMAL" || candidate.kind === "INTERNAL", "NAIHE_EVIDENCE_KIND_INVALID", "Naihe source evidence kind is invalid");

    let source;
    let evidenceType;
    if (candidate.kind === "NORMAL") {
      source = address(candidate.from, "NAIHE_SOURCE_ADDRESS_INVALID", "Normal Naihe source address is invalid");
      evidenceType = "RPC_NORMAL_TRANSACTION_PENDING_FROM_CROSSCHECK";
    } else {
      invariant(typeof candidate.trace_id === "string" && candidate.trace_id.length > 0, "NAIHE_TRACE_ID_REQUIRED", "Internal transfer requires trace_id");
      invariant(Number.isSafeInteger(candidate.trace_index) && candidate.trace_index >= 0, "NAIHE_TRACE_INDEX_REQUIRED", "Internal transfer requires a non-negative trace_index");
      invariant(typeof candidate.trace_provider === "string" && this.trustedTraceProviders.has(candidate.trace_provider), "NAIHE_TRACE_PROVIDER_UNTRUSTED", "Internal transfer trace_provider is not registry-trusted");
      invariant(candidate.trace_type === "CALL", "NAIHE_TRACE_TYPE_INVALID", "Internal transfer requires CALL trace_type");
      invariant(candidate.trace_success === true, "NAIHE_TRACE_UNSUCCESSFUL", "Internal transfer trace must be successful");
      bytes32(candidate.raw_trace_hash, "NAIHE_RAW_TRACE_HASH_REQUIRED", "Internal transfer requires raw_trace_hash");
      source = address(candidate.trace_from, "NAIHE_TRACE_FROM_REQUIRED", "Internal transfer requires a valid trace.from");
      invariant(address(candidate.trace_to, "NAIHE_TRACE_TO_REQUIRED", "Internal transfer requires a valid trace.to") === normalizeAddress(energyWalletAddress), "NAIHE_TRACE_RECIPIENT_MISMATCH", "Internal trace recipient does not match the Canonical Energy Wallet");
      invariant(String(candidate.trace_value_wei) === String(candidate.value_wei), "NAIHE_TRACE_VALUE_MISMATCH", "Internal trace value does not match the indexed candidate");
      invariant(String(candidate.trace_tx_hash ?? "").toLowerCase() === candidate.tx_hash.toLowerCase(), "NAIHE_TRACE_TX_MISMATCH", "Internal trace transaction hash does not match the indexed candidate");
      invariant(candidate.trace_block_number === candidate.block_number, "NAIHE_TRACE_BLOCK_MISMATCH", "Internal trace block does not match the indexed candidate");
      evidenceType = "TRUSTED_INTERNAL_TRACE_PENDING_ATTESTATION";
    }

    const record = this.sources.get(source);
    invariant(record && record.status === "MOCK_VERIFIED_TEST_ONLY" && this.mode === "TEST", "NAIHE_SOURCE_UNREGISTERED", "Dark-matter source is not in the isolated test registry");
    return Object.freeze({
      ...candidate,
      verified_source_address: source,
      source_registry_id: record.source_registry_id,
      source_evidence_type: evidenceType,
      source_evidence_status: "STATIC_BINDING_VERIFIED_RPC_PENDING"
    });
  }

  async verifyInternalTrace(candidate) {
    invariant(candidate.kind === "INTERNAL", "NAIHE_TRACE_KIND_INVALID", "Trusted trace verification requires an internal candidate");
    invariant(typeof this.trustedTraceVerifier === "function", "NAIHE_TRACE_ATTESTATION_REQUIRED", "Internal transfer requires an independent trusted trace verifier");
    const query = Object.freeze({
      trace_id: candidate.trace_id,
      trace_index: candidate.trace_index,
      trace_provider: candidate.trace_provider,
      transaction_hash: candidate.tx_hash,
      block_number: candidate.block_number
    });
    const attestation = await this.trustedTraceVerifier(query);
    invariant(attestation && typeof attestation === "object" && attestation.verified === true, "NAIHE_TRACE_ATTESTATION_REQUIRED", "Trusted trace verifier must return structured verified evidence");
    for (const field of ["trace_id", "trace_index", "trace_provider", "trace_type", "trace_success", "raw_trace_hash", "trace_from", "trace_to", "trace_value_wei"]) {
      const expected = field === "trace_from" || field === "trace_to" || field === "raw_trace_hash" ? String(candidate[field]).toLowerCase() : candidate[field];
      const observed = field === "trace_from" || field === "trace_to" || field === "raw_trace_hash" ? String(attestation[field]).toLowerCase() : attestation[field];
      invariant(observed === expected, "NAIHE_TRACE_ATTESTATION_MISMATCH", `Trusted trace ${field} does not match indexed evidence`);
    }
    invariant(String(attestation.transaction_hash ?? "").toLowerCase() === candidate.tx_hash.toLowerCase(), "NAIHE_TRACE_ATTESTATION_MISMATCH", "Trusted trace transaction hash does not match indexed evidence");
    invariant(attestation.block_number === candidate.block_number, "NAIHE_TRACE_ATTESTATION_MISMATCH", "Trusted trace block does not match indexed evidence");
    return Object.freeze({
      ...candidate,
      source_evidence_type: "TRUSTED_INTERNAL_TRACE",
      source_evidence_status: "RPC_RECEIPT_AND_STRUCTURED_TRACE_VERIFIED",
      trusted_trace_attestation: Object.freeze({ ...attestation })
    });
  }
}

export function selectVerifiedNaiheCandidate({ candidates, registry, context }) {
  const verified = [];
  for (const candidate of candidates) {
    try { verified.push(registry.verifyCandidate(candidate, context)); }
    catch { /* fail closed per candidate */ }
  }
  return verified.sort((left, right) =>
    left.block_number - right.block_number
    || (left.transaction_index ?? 0) - (right.transaction_index ?? 0)
    || (left.trace_index ?? 0) - (right.trace_index ?? 0)
  )[0] ?? null;
}
