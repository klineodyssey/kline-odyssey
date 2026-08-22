import { invariant } from "../shared/errors.mjs";

export const NAIHE_SOURCE_POLICY = Object.freeze({
  status: "NOT_DEPLOYED",
  chain_id: 56,
  exact_amount_wei: "8000000000000000",
  source_registry_id: "NAIHE_K4168_SOURCE_REGISTRY_V2_CANDIDATE",
  birthplace_code: "K4168",
  canonical_registry_address: null,
  canonical_registry_code_hash: null
});

function normalizeAddress(value) { return String(value ?? "").toLowerCase(); }

export class NaiheSourceRegistry {
  constructor({ sources = [], mode = "PRODUCTION", trustedTraceVerifier = null } = {}) {
    invariant(mode === "PRODUCTION" || mode === "TEST", "NAIHE_REGISTRY_MODE_INVALID", "Naihe registry mode is invalid");
    invariant(mode !== "PRODUCTION", "NAIHE_SOURCE_NOT_DEPLOYED", "Production Naihe source registry is unconditionally disabled until canonical deployment and code hash are frozen");
    invariant(sources.every((source) => source.status === "MOCK_VERIFIED_TEST_ONLY"), "NAIHE_TEST_SOURCE_INVALID", "Test mode accepts mock-only sources and cannot self-assert a deployed production source");
    this.mode = mode;
    this.trustedTraceVerifier = trustedTraceVerifier;
    this.sources = new Map(sources.map((source) => [normalizeAddress(source.address), Object.freeze({ ...source })]));
  }

  assertCompatibleEnvironment(environment) {
    invariant(environment === "TEST" && this.mode === "TEST", "NAIHE_TEST_MODE_IN_PRODUCTION", "A test Naihe registry cannot enter a production resolver");
    return true;
  }

  verifyCandidate(candidate, { lifeId, soulId, energyWalletAddress, birthRequestId, challenge }) {
    invariant(candidate.chain_id === 56, "WRONG_CHAIN", "Naihe evidence requires chain 56");
    invariant(String(candidate.value_wei) === NAIHE_SOURCE_POLICY.exact_amount_wei, "NAIHE_AMOUNT_MISMATCH", "Naihe anchor must be exactly 0.008 BNB");
    invariant(normalizeAddress(candidate.recipient) === normalizeAddress(energyWalletAddress), "NAIHE_RECIPIENT_MISMATCH", "Naihe recipient mismatch");
    invariant(candidate.life_id === lifeId && candidate.soul_id === soulId && candidate.birth_request_id === birthRequestId && candidate.challenge === challenge, "NAIHE_BINDING_MISMATCH", "Naihe request binding mismatch");
    invariant(candidate.kind === "NORMAL" || candidate.kind === "INTERNAL", "NAIHE_EVIDENCE_KIND_INVALID", "Naihe source evidence kind is invalid");

    let source;
    let evidenceType;
    if (candidate.kind === "NORMAL") {
      source = normalizeAddress(candidate.from);
      evidenceType = "RPC_NORMAL_TRANSACTION_PENDING_FROM_CROSSCHECK";
    } else {
      invariant(typeof this.trustedTraceVerifier === "function" && this.trustedTraceVerifier(candidate) === true, "NAIHE_TRACE_ATTESTATION_REQUIRED", "Internal transfer requires a trusted trace verifier, not a caller boolean");
      source = normalizeAddress(candidate.trace_from);
      evidenceType = "TRUSTED_INTERNAL_TRACE";
    }

    const record = this.sources.get(source);
    invariant(record && record.status === "MOCK_VERIFIED_TEST_ONLY" && this.mode === "TEST", "NAIHE_SOURCE_UNREGISTERED", "Dark-matter source is not in the isolated test registry");
    return Object.freeze({
      ...candidate,
      verified_source_address: source,
      source_registry_id: record.source_registry_id,
      source_evidence_type: evidenceType,
      source_evidence_status: "VERIFIED_BEFORE_CHRONOLOGY_TEST_ONLY"
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
