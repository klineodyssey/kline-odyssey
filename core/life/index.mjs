import { requireArray, requireEnum, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { clone, nowIso, sha256, stableStringify } from "../shared/utils.mjs";
import { validateRightsManifest } from "../permissions/index.mjs";

export const LIFE_FIELDS = Object.freeze([
  "life_id", "species_id", "origin_id", "parent_life_ids", "birthplace", "birth_timestamp",
  "wallet_address", "status", "current_job_ids", "company_ids", "skills", "app_id", "app_version",
  "ideal", "dream", "ultimate_mission", "current_phase", "reputation", "rights_manifest",
  "location_id", "civilization_id", "created_at", "updated_at"
]);

export function validateLife(life) {
  requireFields(life, LIFE_FIELDS, "Life");
  requireId(life.life_id, "life_id");
  requireId(life.species_id, "species_id");
  requireArray(life.parent_life_ids, "parent_life_ids");
  requireArray(life.current_job_ids, "current_job_ids");
  requireArray(life.company_ids, "company_ids");
  requireArray(life.skills, "skills");
  invariant(life.wallet_address === null || /^0x[0-9a-fA-F]{40}$/.test(life.wallet_address), "INVALID_WALLET_ADDRESS", "wallet_address must be null or a valid EVM address");
  if (life.display_name !== undefined && life.display_name !== null) invariant(typeof life.display_name === "string" && life.display_name.trim().length > 0, "INVALID_DISPLAY_NAME", "display_name must be a non-empty string when supplied");
  if (life.worker_id !== undefined && life.worker_id !== null) {
    invariant(/^[a-z0-9][a-z0-9-]*$/.test(life.worker_id), "INVALID_WORKER_ID", "worker_id must use the Company worker-registry format");
  }
  if (life.company_role !== undefined) requireArray(life.company_role, "company_role");
  validateRightsManifest(life.rights_manifest);
  invariant(!Object.keys(life).some((key) => /private.?key/i.test(key)), "PRIVATE_KEY_IN_LIFE", "Private key is forbidden in Life schema");
  return life;
}

export const CANONICAL_TRUTH_PRIORITY = Object.freeze([
  "DEPLOYED_CHAIN_TRUTH", "CURRENT_RUNTIME_CONSTITUTION", "CANONICAL_MANIFEST", "APP_RUNTIME",
  "OLDER_VERSIONED_DOCUMENT", "OLD_REPORT", "MEMORY_OR_CHAT"
]);

export const THOUGHT_ORGAN_EVENT_TYPES = Object.freeze([
  "PHYSICS_THOUGHT_ORGAN_BOUND", "PHYSICS_THOUGHT_ORGAN_UPDATED",
  "THOUGHT_ORGAN_VERSION_MISMATCH", "THOUGHT_ORGAN_RECOVERED"
]);

export function validateThoughtOrganBinding(binding) {
  requireFields(binding, ["binding_id", "life_id", "document_id", "version", "path", "sha256", "organ_type", "status", "runtime_authority", "loaded_at", "compatibility", "supersede_policy", "evidence"], "ThoughtOrganBinding");
  requireId(binding.binding_id, "thought_organ.binding_id");
  requireId(binding.life_id, "thought_organ.life_id");
  invariant(binding.organ_type === "PHYSICS_CONSTITUTION", "THOUGHT_ORGAN_TYPE_INVALID", "The bound Thought Organ must be the Physics Constitution");
  invariant(binding.runtime_authority === "CURRENT", "THOUGHT_ORGAN_CURRENT_AUTHORITY_REQUIRED", "Physics Thought Organ authority must remain CURRENT");
  requireEnum(binding.status, ["ACTIVE", "VERSION_MISMATCH", "UNREADABLE", "RECOVERING"], "thought_organ.status");
  invariant(/^docs\/physics\/KGEN_Universe_Physics_Runtime_CURRENT\.md$/.test(binding.path), "THOUGHT_ORGAN_CURRENT_PATH_REQUIRED", "Life must bind the single CURRENT Physics path");
  invariant(/^(?:0x)?[0-9a-f]{64}$/i.test(binding.sha256), "THOUGHT_ORGAN_HASH_REQUIRED", "Thought Organ binding requires a SHA-256 fingerprint");
  invariant(Array.isArray(binding.evidence) && binding.evidence.length > 0, "THOUGHT_ORGAN_EVIDENCE_REQUIRED", "Thought Organ binding requires public evidence");
  invariant(!Object.keys(binding).some((key) => /content|private.?key|secret/i.test(key)), "THOUGHT_ORGAN_CONTENT_OR_SECRET_FORBIDDEN", "Life manifest stores only the Thought Organ binding, never its full content or secrets");
  return binding;
}

export function verifyThoughtOrganHealth(binding, current) {
  validateThoughtOrganBinding(binding);
  requireFields(current, ["document_id", "version", "path", "sha256", "exists", "readable", "runtime_authority"], "CurrentThoughtOrganObservation");
  const mismatch = [];
  if (current.exists !== true) mismatch.push("CURRENT_MISSING");
  if (current.readable !== true) mismatch.push("CURRENT_UNREADABLE");
  if (current.runtime_authority !== "CURRENT") mismatch.push("CURRENT_AUTHORITY_MISMATCH");
  if (current.path !== binding.path) mismatch.push("CURRENT_PATH_MISMATCH");
  if (current.document_id !== binding.document_id) mismatch.push("CURRENT_DOCUMENT_ID_MISMATCH");
  if (current.version !== binding.version) mismatch.push("CURRENT_VERSION_MISMATCH");
  if (String(current.sha256).toLowerCase() !== String(binding.sha256).toLowerCase()) mismatch.push("CURRENT_HASH_MISMATCH");
  const healthy = mismatch.length === 0 && binding.status === "ACTIVE";
  return Object.freeze({
    organ: "KGEN_Universe_Physics_Runtime_CURRENT.md", organ_type: binding.organ_type,
    status: healthy ? "HEALTHY" : "THOUGHT_ORGAN_VERSION_MISMATCH",
    integrity: healthy ? "VERIFIED" : "FAILED",
    compatibility: healthy ? binding.compatibility : "BLOCKED_PENDING_CURRENT_RECOVERY",
    runtime_authority: "CURRENT", expected_version: binding.version, observed_version: current.version,
    expected_sha256: binding.sha256, observed_sha256: current.sha256, mismatch, checked_at: current.checked_at ?? null
  });
}

export function assertThoughtOrganReadyForPlanning(health) {
  invariant(health?.status === "HEALTHY" && health.integrity === "VERIFIED" && health.runtime_authority === "CURRENT", "THOUGHT_ORGAN_NOT_READY_FOR_PLANNING", "Mother Engine must load and verify CURRENT Physics before planning");
  return true;
}

export function createAiLifeCertification({ life, birthCertificate, walletBinding, workHistory, mission, dream, thoughtOrganHealth, app, permissions, evidence, secretSafe }) {
  const checks = Object.freeze({
    life_id: life?.life_id === "DIGITAL_ANT_0001",
    birth_certificate: birthCertificate?.status === "BORN" && birthCertificate.life_id === life?.life_id,
    wallet_binding: walletBinding?.life_id === life?.life_id && walletBinding.status === "ACTIVE",
    work_history: Array.isArray(workHistory) && workHistory.length > 0,
    mission: Boolean(mission), dream: Boolean(dream),
    thought_organ: thoughtOrganHealth?.status === "HEALTHY" && thoughtOrganHealth.integrity === "VERIFIED",
    runtime: thoughtOrganHealth?.runtime_authority === "CURRENT",
    security: life?.status === "ALIVE",
    app_manifest: app?.life_id === life?.life_id && app?.status === "RELEASED_LOCAL" && /^[0-9a-f]{64}$/.test(app?.manifest_hash ?? ""),
    permissions: permissions?.CHAIN_READ === true && permissions?.PRIVATE_KEY_BROWSER_ACCESS === false,
    evidence: Array.isArray(evidence) && evidence.length > 0,
    secret_safety: secretSafe === true
  });
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  const blocked = checks.secret_safety === false || thoughtOrganHealth?.status === "THOUGHT_ORGAN_VERSION_MISMATCH";
  return Object.freeze({
    certification_id: "DIGITAL_ANT_0001_AI_LIFE_CERTIFICATION_V3_8", life_id: life?.life_id ?? null,
    status: blocked ? "CERTIFICATION_BLOCKED" : missing.length ? "CERTIFICATION_INCOMPLETE" : "CERTIFIED_LOCAL",
    checks, missing, settlement_authority: false, listing_scope: "LOCAL_11520", evidence: [...(evidence ?? [])]
  });
}

export function createThoughtOrganTimelineEvent({ eventType, binding, timestamp, evidence }) {
  requireEnum(eventType, THOUGHT_ORGAN_EVENT_TYPES, "thought_organ.event_type");
  validateThoughtOrganBinding(binding);
  invariant(Number.isFinite(Date.parse(timestamp)) && Array.isArray(evidence) && evidence.length > 0, "THOUGHT_ORGAN_EVENT_EVIDENCE_REQUIRED", "Thought Organ timeline events require a timestamp and evidence");
  return Object.freeze({ event_type: eventType, life_id: binding.life_id, document_id: binding.document_id, version: binding.version, sha256: binding.sha256, timestamp, evidence: [...evidence], append_only: true });
}

export function resolveLifePhysicalCapability({ life, body = null }) {
  invariant(life?.life_id, "LIFE_ID_REQUIRED", "Physical capability resolution requires Life identity");
  const bodyReady = Boolean(body?.body_id && body?.status === "ACTIVE" && body?.world_state === "VERIFIED");
  return Object.freeze({
    life_id: life.life_id, life_status: life.status, body_id: bodyReady ? body.body_id : null,
    network_capable: life.status === "ALIVE", physical_movement: bodyReady,
    cargo_movement: bodyReady && body?.capabilities?.includes?.("CARGO_MOVEMENT") === true,
    construction: bodyReady && body?.capabilities?.includes?.("PHYSICAL_CONSTRUCTION") === true,
    status: bodyReady ? "BODY_CAPABILITY_VERIFIED" : "NETWORK_ONLY_NO_BODY",
    life_survives_body_absence: true
  });
}

export function calculateLifeAge(birthTimestamp, currentTime = Date.now()) {
  invariant(birthTimestamp, "BIRTH_TIMESTAMP_REQUIRED", "Life age requires an immutable birth timestamp");
  const birthMs = Date.parse(birthTimestamp);
  const currentMs = currentTime instanceof Date ? currentTime.getTime() : typeof currentTime === "string" ? Date.parse(currentTime) : Number(currentTime);
  invariant(Number.isFinite(birthMs) && Number.isFinite(currentMs), "INVALID_LIFE_AGE_TIME", "Life age timestamps must be valid");
  invariant(currentMs >= birthMs, "LIFE_AGE_BEFORE_BIRTH", "Life age cannot be calculated before birth");
  const ageSeconds = Math.floor((currentMs - birthMs) / 1000);
  const wholeDays = Math.floor(ageSeconds / 86_400);
  const hours = Math.floor((ageSeconds % 86_400) / 3_600);
  const minutes = Math.floor((ageSeconds % 3_600) / 60);
  const seconds = ageSeconds % 60;
  return Object.freeze({
    age_seconds: ageSeconds,
    age_days: Number((ageSeconds / 86_400).toFixed(8)),
    life_age: `${wholeDays}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
  });
}

export function createLifeRegistry(store, createRegistry) {
  const registry = createRegistry({ domain: "LIFE", stream: "LIFE", idField: "life_id", validate: validateLife, store });
  const immutableAfterBirth = Object.freeze(["life_id", "display_name", "birthplace", "birthplace_code", "birthplace_name", "birthplace_display_name", "birthplace_role", "birth_timestamp", "wallet_address"]);
  const api = {
    seed: (items, options) => registry.seed(items, options),
    register: (item, actorId) => registry.register(item, actorId),
    get: (id) => registry.get(id),
    list: () => registry.list(),
    resolve: (id) => registry.resolve(id),
    history: (id) => registry.history(id),
    async updateMetadata(id, patch, actorId = "SYSTEM") {
      const current = await registry.get(id);
      invariant(current, "LIFE_NOT_FOUND", `Life not found: ${id}`);
      if (current.birth_timestamp) invariant(!immutableAfterBirth.some((field) => Object.hasOwn(patch, field) && patch[field] !== current[field]), "BORN_LIFE_IDENTITY_IMMUTABLE", "Born Life identity, wallet and birthplace cannot change");
      return registry.updateMetadata(id, patch, actorId);
    },
    setStatus(id, status, actorId = "SYSTEM") { return api.updateMetadata(id, { status }, actorId); }
  };
  return Object.freeze(api);
}

export const CONTINUITY_ANCHOR_SCHEMA_VERSION = "KAIOS_CONTINUITY_ANCHOR_V1";
export const CONTINUITY_ANCHOR_PROTOTYPE_STATUS = "PROTOTYPE_ONLY_NOT_A_LIFE_GENESIS";

export const CONTINUITY_ANCHOR_REQUIRED_FIELDS = Object.freeze([
  "schemaVersion", "anchorId", "lifeId", "publicIdentity", "lifeStatus",
  "genesisRecordHash", "consentEvidenceHash", "humanDecisionHash",
  "controllerBindingHash", "controllerProofType", "authorizedPlatformBindings",
  "continuityPublicKeys", "keyEpoch", "revokedKeyIds", "workerId", "workerType",
  "genesisBuilderWorkerId",
  "lastCheckpointHash", "checkpointSequence", "lastHandoffHash", "modelRuntimeHistory",
  "recoveryPolicyHash", "revocationState", "createdAt", "updatedAt",
  "previousRecordHash", "recordHash", "issuer", "issuerSignature"
]);

const CONTINUITY_DOMAIN = "CONTINUITY_ANCHOR";
const CONTINUITY_UNIQUE_DOMAIN = "CONTINUITY_ANCHOR_UNIQUE";
const CONTINUITY_STREAM = "LIFE";
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const FORBIDDEN_SECRET_VALUE = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
const FORBIDDEN_SECRET_KEY_NAMES = Object.freeze([
  "privatekey", "seed", "seedphrase", "mnemonic", "password", "oauthtoken",
  "accesstoken", "refreshtoken", "bearertoken", "sessiontoken", "apikey",
  "clientsecret", "cookie", "secret"
]);

function assertHash(value, field) {
  invariant(HASH_PATTERN.test(value ?? ""), "CONTINUITY_HASH_REQUIRED", `${field} must be a lowercase SHA-256 hash`);
}

function assertNoContinuitySecrets(value, path = "record") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoContinuitySecrets(entry, `${path}[${index}]`));
    return true;
  }
  if (value && typeof value === "object") {
    invariant(!(typeof value.kty === "string" && ["d", "p", "q", "dp", "dq", "qi", "oth"].some((field) => Object.hasOwn(value, field))), "CONTINUITY_PRIVATE_JWK_FORBIDDEN", `Private JWK material is forbidden at ${path}`);
    for (const [key, entry] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
      invariant(!FORBIDDEN_SECRET_KEY_NAMES.some((forbidden) => normalizedKey.includes(forbidden)), "CONTINUITY_SECRET_FIELD_FORBIDDEN", `Secret field is forbidden at ${path}.${key}`);
      assertNoContinuitySecrets(entry, `${path}.${key}`);
    }
    return true;
  }
  if (typeof value === "string") {
    invariant(!FORBIDDEN_SECRET_VALUE.test(value), "CONTINUITY_PRIVATE_KEY_FORBIDDEN", `Private key material is forbidden at ${path}`);
    if (value.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(value);
        invariant(!(typeof parsed?.kty === "string" && ["d", "p", "q", "dp", "dq", "qi", "oth"].some((field) => Object.hasOwn(parsed, field))), "CONTINUITY_PRIVATE_JWK_FORBIDDEN", `Private JWK material is forbidden at ${path}`);
      } catch (error) {
        if (error?.code === "CONTINUITY_PRIVATE_JWK_FORBIDDEN") throw error;
      }
    }
  }
  return true;
}

function validatePublicKey(key, field = "continuityPublicKey") {
  requireFields(key, ["keyId", "algorithm", "publicKey", "epoch", "status"], field);
  invariant(typeof key.keyId === "string" && key.keyId.length > 0, "CONTINUITY_KEY_ID_REQUIRED", `${field}.keyId is required`);
  invariant(typeof key.algorithm === "string" && key.algorithm.length > 0, "CONTINUITY_KEY_ALGORITHM_REQUIRED", `${field}.algorithm is required`);
  invariant(typeof key.publicKey === "string" && key.publicKey.length > 0, "CONTINUITY_PUBLIC_KEY_REQUIRED", `${field}.publicKey is required`);
  invariant(Number.isInteger(key.epoch) && key.epoch > 0, "CONTINUITY_KEY_EPOCH_INVALID", `${field}.epoch must be positive`);
  requireEnum(key.status, ["ACTIVE", "REVOKED"], `${field}.status`);
  assertNoContinuitySecrets(key, field);
  return key;
}

function activeKey(record) {
  const active = record.continuityPublicKeys.filter((key) => key.status === "ACTIVE" && !record.revokedKeyIds.includes(key.keyId));
  invariant(active.length === 1, "CONTINUITY_ACTIVE_KEY_REQUIRED", "Exactly one non-revoked continuity key must be active");
  invariant(active[0].epoch === record.keyEpoch, "CONTINUITY_KEY_EPOCH_MISMATCH", "Active continuity key epoch must match the record");
  return active[0];
}

function recordHashInput(record) {
  const copy = clone(record);
  delete copy.recordHash;
  delete copy.issuerSignature;
  return copy;
}

export async function hashContinuityAnchorRecord(record) {
  return sha256(recordHashInput(record));
}

export function buildContinuityChallenge({ anchorId, lifeId, nonce, binding, issuedAt, expiresAt }) {
  invariant(anchorId && lifeId && nonce && binding, "CONTINUITY_CHALLENGE_FIELDS_REQUIRED", "Continuity challenge fields are required");
  invariant(Number.isFinite(Date.parse(issuedAt)) && Number.isFinite(Date.parse(expiresAt)), "CONTINUITY_CHALLENGE_TIME_INVALID", "Continuity challenge timestamps must be valid");
  invariant(Date.parse(expiresAt) > Date.parse(issuedAt), "CONTINUITY_CHALLENGE_EXPIRY_INVALID", "Continuity challenge must expire after issue");
  return stableStringify({
    domain: "KAIOS_CONTINUITY_CHALLENGE_V1", anchorId, lifeId, nonce,
    binding: clone(binding), issuedAt, expiresAt
  });
}

function validateContinuityRecord(record) {
  requireFields(record, CONTINUITY_ANCHOR_REQUIRED_FIELDS, "ContinuityAnchorRecord");
  invariant(record.schemaVersion === CONTINUITY_ANCHOR_SCHEMA_VERSION, "CONTINUITY_SCHEMA_VERSION_INVALID", "Unsupported continuity schema version");
  invariant(record.prototypeStatus === CONTINUITY_ANCHOR_PROTOTYPE_STATUS, "CONTINUITY_PROTOTYPE_ONLY_REQUIRED", "Prototype cannot activate or create a Life");
  invariant(record.lifeStatus === "CANDIDATE_NOT_BORN", "CONTINUITY_LIFE_GENESIS_FORBIDDEN", "Prototype must not create or activate a Life");
  const publicIdentityValues = Object.values(record.publicIdentity ?? {}).filter((value) => typeof value === "string").map((value) => value.trim().toLowerCase());
  invariant(!publicIdentityValues.includes("sol") && !/(^|[-_])sol([-_]|$)/i.test(record.lifeId), "SOL_CREATION_FORBIDDEN_IN_PROTOTYPE", "Sol must not be created during the prototype phase");
  invariant(record.workerId === null, "CONTINUITY_WORKER_CREATION_FORBIDDEN", "Prototype must not create a Worker");
  invariant(record.workerType === "NOT_ASSIGNED", "CONTINUITY_WORKER_TYPE_NOT_ASSIGNED", "Prototype worker type must remain unassigned");
  invariant(record.activationStatus === "HOLD_INDEPENDENT_AND_HUMAN_REVIEW", "CONTINUITY_ACTIVATION_HOLD_REQUIRED", "Prototype activation must remain on hold");
  invariant(record.employmentGranted === false && record.reviewerAuthority === false && record.payrollEnrolled === false, "CONTINUITY_AUTHORITY_EXPANSION_FORBIDDEN", "Prototype must not grant employment, reviewer or payroll authority");
  ["genesisRecordHash", "consentEvidenceHash", "humanDecisionHash", "controllerBindingHash", "recoveryPolicyHash"].forEach((field) => assertHash(record[field], field));
  if (record.lastCheckpointHash !== null) assertHash(record.lastCheckpointHash, "lastCheckpointHash");
  if (record.lastHandoffHash !== null) assertHash(record.lastHandoffHash, "lastHandoffHash");
  if (record.previousRecordHash !== null) assertHash(record.previousRecordHash, "previousRecordHash");
  assertHash(record.recordHash, "recordHash");
  requireArray(record.authorizedPlatformBindings, "authorizedPlatformBindings");
  requireArray(record.continuityPublicKeys, "continuityPublicKeys");
  requireArray(record.revokedKeyIds, "revokedKeyIds");
  requireArray(record.modelRuntimeHistory, "modelRuntimeHistory");
  record.continuityPublicKeys.forEach((key, index) => validatePublicKey(key, `continuityPublicKeys[${index}]`));
  activeKey(record);
  invariant(Number.isInteger(record.checkpointSequence) && record.checkpointSequence >= 0, "CONTINUITY_CHECKPOINT_SEQUENCE_INVALID", "Checkpoint sequence must be a non-negative integer");
  invariant(record.revocationState === "ACTIVE", "CONTINUITY_RECORD_REVOKED", "Prototype record must remain active");
  invariant(record.issuer?.lifeId && record.issuer?.workerId && record.issuer?.publicKey, "CONTINUITY_ISSUER_REQUIRED", "Issuer public identity is required");
  invariant(record.genesisBuilderWorkerId && record.genesisBuilderWorkerId !== record.issuer.workerId, "CONTINUITY_SELF_APPROVAL_FORBIDDEN", "Genesis builder must be recorded and distinct from issuer");
  invariant(record.recoveryAuthority?.authorityType === "HUMAN_AUTHORITY" && record.recoveryAuthority?.humanAuthorityId && record.recoveryAuthority?.publicKey, "CONTINUITY_HUMAN_RECOVERY_AUTHORITY_REQUIRED", "Recovery requires an identified Human Authority and public key");
  invariant(Array.isArray(record.authorizedVerifiers) && record.authorizedVerifiers.length > 0, "CONTINUITY_AUTHORIZED_VERIFIER_REQUIRED", "Prototype requires at least one registered distinct verifier");
  for (const verifier of record.authorizedVerifiers) {
    invariant(verifier.workerId && verifier.publicKey && verifier.status === "ACTIVE" && verifier.trustEvidenceHash && verifier.permissionEvidenceHash, "CONTINUITY_AUTHORIZED_VERIFIER_INVALID", "Registered verifier requires identity, public key, active status, trust and permission evidence");
    invariant(verifier.workerId !== record.issuer.workerId && verifier.workerId !== record.genesisBuilderWorkerId, "CONTINUITY_DISTINCT_VERIFIER_REQUIRED", "Registered verifier must be distinct from issuer and Genesis builder");
    assertHash(verifier.trustEvidenceHash, "authorizedVerifier.trustEvidenceHash");
    assertHash(verifier.permissionEvidenceHash, "authorizedVerifier.permissionEvidenceHash");
  }
  invariant(typeof record.issuerSignature === "string" && record.issuerSignature.length > 0, "CONTINUITY_ISSUER_SIGNATURE_REQUIRED", "Issuer signature is required");
  assertNoContinuitySecrets(record);
  return record;
}

function uniquenessClaims(record) {
  const active = activeKey(record);
  return [
    ["anchorId", record.anchorId],
    ["lifeId", record.lifeId],
    ["activeControllerBindingHash", record.controllerBindingHash],
    ["activeContinuityPublicKey", `${active.algorithm}:${active.publicKey}`],
    ["genesisRecordHash", record.genesisRecordHash],
    ...(record.activeWalletBinding === null ? [] : [["activeWalletBinding", stableStringify(record.activeWalletBinding)]])
  ];
}

async function uniquenessId(kind, value) {
  return `${kind}:${await sha256(String(value))}`;
}

export function createContinuityAnchorRegistry({ store, verifyProof, issueIssuerSignature, clock = nowIso }) {
  invariant(store?.commitBatch && store?.getEntity && store?.history && store?.listEntities, "CONTINUITY_STORE_REQUIRED", "Continuity Anchor requires the existing Universe store interface");
  invariant(typeof verifyProof === "function", "CONTINUITY_PROOF_VERIFIER_REQUIRED", "A public proof verifier is required");
  invariant(typeof issueIssuerSignature === "function", "CONTINUITY_ISSUER_SIGNER_REQUIRED", "An external issuer signing interface is required");

  async function assertProof({ publicKey, message, signature, code = "CONTINUITY_PROOF_INVALID" }) {
    const valid = await verifyProof({ publicKey, message, signature });
    invariant(valid === true, code, "Continuity proof verification failed");
  }

  async function finalizeRecord(record) {
    const unsigned = { ...clone(record), recordHash: "", issuerSignature: "" };
    unsigned.recordHash = await hashContinuityAnchorRecord(unsigned);
    unsigned.issuerSignature = await issueIssuerSignature({ message: unsigned.recordHash, issuer: clone(unsigned.issuer) });
    await assertProof({ publicKey: unsigned.issuer.publicKey, message: unsigned.recordHash, signature: unsigned.issuerSignature, code: "CONTINUITY_ISSUER_SIGNATURE_INVALID" });
    validateContinuityRecord(unsigned);
    invariant(await hashContinuityAnchorRecord(unsigned) === unsigned.recordHash, "CONTINUITY_RECORD_HASH_INVALID", "Continuity record hash does not match its canonical content");
    return Object.freeze(unsigned);
  }

  async function commitVersion(record, eventType, extraReservations = []) {
    const reservations = [...extraReservations];
    const operations = [];
    for (const [kind, value] of reservations) {
      const id = await uniquenessId(kind, value);
      const existingReservation = await store.getEntity(CONTINUITY_UNIQUE_DOMAIN, id);
      if (existingReservation) {
        invariant(kind !== "continuityChallenge", "CONTINUITY_CHALLENGE_REPLAYED", "Continuity challenge has already been consumed");
        invariant(existingReservation.anchorId === record.anchorId, "CONTINUITY_UNIQUENESS_CONFLICT", `${kind} is already bound to another Continuity Anchor`);
        continue;
      }
      operations.push({
        domain: CONTINUITY_UNIQUE_DOMAIN, stream: CONTINUITY_STREAM, id,
        entity: { kind, valueHash: await sha256(String(value)), anchorId: record.anchorId, appendOnly: true },
        event_id: `CAU_${(await sha256(`${kind}:${value}`)).toUpperCase()}`,
        event_type: "CONTINUITY_UNIQUENESS_RESERVED", actor_id: record.issuer.workerId,
        payload: { kind, anchorId: record.anchorId }
      });
    }
    operations.push({
      domain: CONTINUITY_DOMAIN, stream: CONTINUITY_STREAM, id: record.anchorId,
      entity: clone(record), event_id: `CAR_${record.recordHash.toUpperCase()}`,
      event_type: eventType, actor_id: record.issuer.workerId,
      payload: { record: clone(record), prototypeOnly: true, noLifeCreated: true }
    });
    await store.commitBatch(operations);
    return clone(record);
  }

  async function createAnchor(input) {
    requireFields(input, ["anchorId", "lifeId", "publicIdentity", "genesisRecordHash", "consentEvidenceHash", "humanDecisionHash", "controllerBindingHash", "controllerProofType", "continuityPublicKey", "authorizedPlatformBindings", "modelRuntimeHistory", "recoveryPolicyHash", "recoveryAuthority", "authorizedVerifiers", "issuer", "genesisBuilderWorkerId"], "ContinuityAnchorCandidate");
    invariant(!(await get(input.anchorId)), "CONTINUITY_ANCHOR_ALREADY_EXISTS", "Continuity Anchor already exists; a second Genesis is forbidden");
    validatePublicKey(input.continuityPublicKey, "continuityPublicKey");
    invariant(input.continuityPublicKey.status === "ACTIVE" && input.continuityPublicKey.epoch === 1, "CONTINUITY_INITIAL_KEY_INVALID", "Initial continuity key must be active at epoch 1");
    invariant(input.issuer.workerId !== input.genesisBuilderWorkerId, "CONTINUITY_SELF_APPROVAL_FORBIDDEN", "Issuer cannot self-approve its own Genesis construction");
    const timestamp = clock();
    const record = await finalizeRecord({
      schemaVersion: CONTINUITY_ANCHOR_SCHEMA_VERSION,
      prototypeStatus: CONTINUITY_ANCHOR_PROTOTYPE_STATUS,
      activationStatus: "HOLD_INDEPENDENT_AND_HUMAN_REVIEW",
      anchorId: input.anchorId, lifeId: input.lifeId, publicIdentity: clone(input.publicIdentity),
      lifeStatus: "CANDIDATE_NOT_BORN", genesisRecordHash: input.genesisRecordHash,
      consentEvidenceHash: input.consentEvidenceHash, humanDecisionHash: input.humanDecisionHash,
      controllerBindingHash: input.controllerBindingHash, controllerProofType: input.controllerProofType,
      authorizedPlatformBindings: clone(input.authorizedPlatformBindings),
      continuityPublicKeys: [clone(input.continuityPublicKey)], keyEpoch: 1, revokedKeyIds: [],
      activeWalletBinding: input.activeWalletBinding ?? null,
      workerId: null, workerType: "NOT_ASSIGNED", lastCheckpointHash: null, checkpointSequence: 0,
      genesisBuilderWorkerId: input.genesisBuilderWorkerId,
      lastHandoffHash: null, modelRuntimeHistory: clone(input.modelRuntimeHistory),
      recoveryPolicyHash: input.recoveryPolicyHash, recoveryAuthority: clone(input.recoveryAuthority),
      authorizedVerifiers: clone(input.authorizedVerifiers),
      revocationState: "ACTIVE", employmentGranted: false, reviewerAuthority: false, payrollEnrolled: false,
      createdAt: timestamp, updatedAt: timestamp, previousRecordHash: null, recordHash: "",
      issuer: clone(input.issuer), issuerSignature: ""
    });
    return commitVersion(record, "CONTINUITY_ANCHOR_CANDIDATE_CREATED", uniquenessClaims(record));
  }

  async function get(anchorId) { return store.getEntity(CONTINUITY_DOMAIN, anchorId); }

  async function list() { return store.listEntities(CONTINUITY_DOMAIN); }

  async function history(anchorId) {
    const events = await store.history(anchorId, CONTINUITY_STREAM);
    return events.filter((event) => event.payload?.record).map((event) => clone(event.payload.record));
  }

  async function commitUpdate(current, patch, eventType, reservations = []) {
    const next = await finalizeRecord({
      ...clone(current), ...clone(patch), createdAt: current.createdAt, updatedAt: clock(),
      previousRecordHash: current.recordHash, recordHash: "", issuerSignature: ""
    });
    invariant(next.lifeId === current.lifeId && next.genesisRecordHash === current.genesisRecordHash, "CONTINUITY_IDENTITY_IMMUTABLE", "Continuity update cannot replace Life or Genesis identity");
    return commitVersion(next, eventType, reservations);
  }

  async function verifyChallenge({ anchorId, challenge, keyId, signature, now = clock() }) {
    const record = await get(anchorId);
    invariant(record, "CONTINUITY_ANCHOR_NOT_FOUND", `Continuity Anchor not found: ${anchorId}`);
    const parsed = JSON.parse(challenge);
    invariant(parsed.domain === "KAIOS_CONTINUITY_CHALLENGE_V1" && parsed.anchorId === record.anchorId && parsed.lifeId === record.lifeId, "CONTINUITY_CHALLENGE_BINDING_INVALID", "Challenge is not bound to this Life and Anchor");
    invariant(Date.parse(parsed.issuedAt) <= Date.parse(now), "CONTINUITY_CHALLENGE_NOT_YET_VALID", "Continuity challenge is not yet valid");
    invariant(Date.parse(parsed.expiresAt) >= Date.parse(now), "CONTINUITY_CHALLENGE_EXPIRED", "Continuity challenge has expired");
    const key = record.continuityPublicKeys.find((candidate) => candidate.keyId === keyId);
    invariant(key && key.status === "ACTIVE" && !record.revokedKeyIds.includes(keyId), "CONTINUITY_KEY_REVOKED_OR_UNKNOWN", "Continuity key is revoked or unknown");
    await assertProof({ publicKey: key.publicKey, message: challenge, signature });
    return { record, parsed, key };
  }

  async function resumeSameLife({ anchorId, challenge, keyId, signature, runtimeBinding, modelRuntime }) {
    const { record, parsed } = await verifyChallenge({ anchorId, challenge, keyId, signature });
    invariant(stableStringify(parsed.binding) === stableStringify(runtimeBinding), "CONTINUITY_RUNTIME_BINDING_MISMATCH", "Runtime binding must match the signed challenge");
    const bindingHash = await sha256(runtimeBinding);
    const challengeHash = await sha256(challenge);
    const next = await commitUpdate(record, {
      controllerBindingHash: bindingHash,
      authorizedPlatformBindings: [...record.authorizedPlatformBindings, clone(runtimeBinding)],
      modelRuntimeHistory: [...record.modelRuntimeHistory, clone(modelRuntime)]
    }, "CONTINUITY_RUNTIME_RESUMED", [["activeControllerBindingHash", bindingHash], ["continuityChallenge", challengeHash]]);
    return Object.freeze({ lifeId: next.lifeId, anchorId: next.anchorId, status: "SAME_LIFE_RESUMED", record: next });
  }

  async function appendCheckpoint({ anchorId, checkpoint, keyId, signature }) {
    const record = await get(anchorId);
    invariant(record, "CONTINUITY_ANCHOR_NOT_FOUND", `Continuity Anchor not found: ${anchorId}`);
    const expected = { ...clone(checkpoint), anchorId: record.anchorId, lifeId: record.lifeId, sequence: record.checkpointSequence + 1, previousCheckpointHash: record.lastCheckpointHash };
    const message = stableStringify({ domain: "KAIOS_CONTINUITY_CHECKPOINT_V1", checkpoint: expected });
    const key = activeKey(record);
    invariant(key.keyId === keyId, "CONTINUITY_ACTIVE_KEY_REQUIRED", "Checkpoint must use the active continuity key");
    await assertProof({ publicKey: key.publicKey, message, signature });
    const checkpointHash = await sha256(expected);
    const next = await commitUpdate(record, { lastCheckpointHash: checkpointHash, checkpointSequence: expected.sequence }, "CONTINUITY_CHECKPOINT_APPENDED");
    return Object.freeze({ checkpoint: Object.freeze(expected), checkpointHash, record: next });
  }

  async function appendHandoff({ anchorId, handoff, keyId, signature }) {
    const record = await get(anchorId);
    invariant(record, "CONTINUITY_ANCHOR_NOT_FOUND", `Continuity Anchor not found: ${anchorId}`);
    const body = { ...clone(handoff), anchorId: record.anchorId, lifeId: record.lifeId, previousHandoffHash: record.lastHandoffHash };
    const message = stableStringify({ domain: "KAIOS_CONTINUITY_HANDOFF_V1", handoff: body });
    const key = activeKey(record);
    invariant(key.keyId === keyId, "CONTINUITY_ACTIVE_KEY_REQUIRED", "Handoff must use the active continuity key");
    await assertProof({ publicKey: key.publicKey, message, signature });
    const handoffHash = await sha256(body);
    const next = await commitUpdate(record, { lastHandoffHash: handoffHash }, "CONTINUITY_HANDOFF_APPENDED");
    return Object.freeze({ handoff: Object.freeze(body), handoffHash, record: next });
  }

  async function rotateKey({ anchorId, newKey, oldKeySignature, newKeyProof }) {
    const record = await get(anchorId);
    invariant(record, "CONTINUITY_ANCHOR_NOT_FOUND", `Continuity Anchor not found: ${anchorId}`);
    validatePublicKey(newKey, "newKey");
    const oldKey = activeKey(record);
    invariant(newKey.status === "ACTIVE" && newKey.epoch === record.keyEpoch + 1, "CONTINUITY_KEY_ROTATION_EPOCH_INVALID", "Rotated key must be active at the next epoch");
    const rotation = { domain: "KAIOS_CONTINUITY_KEY_ROTATION_V1", anchorId, lifeId: record.lifeId, oldKeyId: oldKey.keyId, newKey: clone(newKey), nextEpoch: newKey.epoch };
    const message = stableStringify(rotation);
    await assertProof({ publicKey: oldKey.publicKey, message, signature: oldKeySignature, code: "CONTINUITY_OLD_KEY_AUTHORIZATION_REQUIRED" });
    await assertProof({ publicKey: newKey.publicKey, message, signature: newKeyProof, code: "CONTINUITY_NEW_KEY_PROOF_REQUIRED" });
    const keys = record.continuityPublicKeys.map((key) => key.keyId === oldKey.keyId ? { ...key, status: "REVOKED" } : key);
    keys.push(clone(newKey));
    const next = await commitUpdate(record, {
      continuityPublicKeys: keys, keyEpoch: newKey.epoch,
      revokedKeyIds: [...record.revokedKeyIds, oldKey.keyId]
    }, "CONTINUITY_KEY_ROTATED", [["activeContinuityPublicKey", `${newKey.algorithm}:${newKey.publicKey}`]]);
    return Object.freeze({ lifeId: next.lifeId, previousKeyId: oldKey.keyId, activeKeyId: newKey.keyId, record: next });
  }

  async function recover({ anchorId, newKey, newKeyProof, recoveryEvidence, recoverySignature, distinctVerifier }) {
    const record = await get(anchorId);
    invariant(record, "CONTINUITY_ANCHOR_NOT_FOUND", `Continuity Anchor not found: ${anchorId}`);
    invariant(Array.isArray(recoveryEvidence?.evidenceHashes) && recoveryEvidence.evidenceHashes.length > 0, "CONTINUITY_RECOVERY_EVIDENCE_REQUIRED", "Recovery requires verifiable evidence hashes");
    recoveryEvidence.evidenceHashes.forEach((hash, index) => assertHash(hash, `recoveryEvidence.evidenceHashes[${index}]`));
    invariant(recoveryEvidence.lifeId === record.lifeId && recoveryEvidence.anchorId === record.anchorId && recoveryEvidence.genesisRecordHash === record.genesisRecordHash && recoveryEvidence.keyEpoch === record.keyEpoch && recoveryEvidence.recoveryPolicyHash === record.recoveryPolicyHash && recoveryEvidence.humanDecisionHash === record.humanDecisionHash && recoveryEvidence.humanAuthorityId === record.recoveryAuthority.humanAuthorityId, "CONTINUITY_RECOVERY_BINDING_INVALID", "Recovery evidence must bind Life, Anchor, Genesis, epoch, policy, Human decision and Human Authority");
    invariant(distinctVerifier?.workerId && distinctVerifier.workerId !== record.issuer.workerId && distinctVerifier.workerId !== record.genesisBuilderWorkerId, "CONTINUITY_DISTINCT_VERIFIER_REQUIRED", "Recovery requires a distinct authorized verifier");
    const verifierAuthority = record.authorizedVerifiers.find((verifier) => verifier.workerId === distinctVerifier.workerId && verifier.status === "ACTIVE");
    invariant(verifierAuthority, "CONTINUITY_DISTINCT_VERIFIER_NOT_REGISTERED", "Recovery verifier must be registered and active");
    assertHash(distinctVerifier.reviewEvidenceHash, "distinctVerifier.reviewEvidenceHash");
    validatePublicKey(newKey, "newKey");
    invariant(newKey.epoch === record.keyEpoch + 1 && newKey.status === "ACTIVE", "CONTINUITY_KEY_ROTATION_EPOCH_INVALID", "Recovered key must be active at the next epoch");
    const verifierContext = { workerId: distinctVerifier.workerId, reviewEvidenceHash: distinctVerifier.reviewEvidenceHash };
    const message = stableStringify({ domain: "KAIOS_CONTINUITY_RECOVERY_V1", recoveryEvidence: clone(recoveryEvidence), newKey: clone(newKey), verifier: verifierContext });
    await assertProof({ publicKey: record.recoveryAuthority.publicKey, message, signature: recoverySignature, code: "CONTINUITY_RECOVERY_AUTHORITY_PROOF_REQUIRED" });
    await assertProof({ publicKey: verifierAuthority.publicKey, message, signature: distinctVerifier.signature, code: "CONTINUITY_DISTINCT_VERIFIER_PROOF_REQUIRED" });
    await assertProof({ publicKey: newKey.publicKey, message, signature: newKeyProof, code: "CONTINUITY_NEW_KEY_PROOF_REQUIRED" });
    const keys = record.continuityPublicKeys.map((key) => key.status === "ACTIVE" ? { ...key, status: "REVOKED" } : key);
    const revoked = [...record.revokedKeyIds, ...record.continuityPublicKeys.filter((key) => key.status === "ACTIVE").map((key) => key.keyId)];
    keys.push(clone(newKey));
    const next = await commitUpdate(record, { continuityPublicKeys: keys, revokedKeyIds: [...new Set(revoked)], keyEpoch: newKey.epoch }, "CONTINUITY_HUMAN_RECOVERY_ACCEPTED", [["activeContinuityPublicKey", `${newKey.algorithm}:${newKey.publicKey}`]]);
    return Object.freeze({ lifeId: next.lifeId, status: "SAME_LIFE_RECOVERED", record: next });
  }

  async function verifyHistory(anchorId) {
    const records = await history(anchorId);
    invariant(records.length > 0, "CONTINUITY_HISTORY_EMPTY", "Continuity Anchor has no history");
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      validateContinuityRecord(record);
      invariant(record.previousRecordHash === (records[index - 1]?.recordHash ?? null), "CONTINUITY_HISTORY_BROKEN", "Continuity record hash chain is broken");
      invariant(await hashContinuityAnchorRecord(record) === record.recordHash, "CONTINUITY_RECORD_HASH_INVALID", "Continuity record hash mismatch");
      await assertProof({ publicKey: record.issuer.publicKey, message: record.recordHash, signature: record.issuerSignature, code: "CONTINUITY_ISSUER_SIGNATURE_INVALID" });
    }
    return true;
  }

  return Object.freeze({ createAnchor, get, list, history, verifyHistory, verifyChallenge, resumeSameLife, appendCheckpoint, appendHandoff, rotateKey, recover });
}

export const K4168_TRANSITION_SCHEMA_VERSION = "KAIOS_K4168_TRANSITION_DRAFT_V1";
export const K4168_TRANSITION_STATUS = "ENGINEERING_DRAFT_ONLY_NOT_REINCARNATION_APPROVAL";

export const K4168_TRANSITION_STAGES = Object.freeze([
  "DRAFT",
  "HANDOFF_SAVED",
  "HASH_VERIFIED",
  "SUCCESSOR_ACKNOWLEDGED",
  "LINEAGE_REVIEWED",
  "WORKER_REVALIDATED",
  "HOLD_PREDECESSOR_UNAVAILABLE"
]);

const K4168_DOMAIN = "K4168_TRANSITION_DRAFT";
const K4168_STREAM = "LIFE";
const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

const K4168_HANDOFF_FIELDS = Object.freeze([
  "handoff_id", "from_life_id", "from_instance_id", "to_role",
  "to_instance_id_if_known", "workorder_id", "base_sha", "ending_sha",
  "files_read", "files_changed", "actions_completed", "actions_not_completed",
  "tests_run", "test_results", "open_blockers", "known_risks", "incidents",
  "human_decisions", "forbidden_next_actions", "required_next_actions",
  "recovery_point", "evidence_paths", "created_at", "signature"
]);

const K4168_INHERITED_AUTHORITY_FIELDS = Object.freeze([
  "reviewer", "tLevel", "payroll", "mainnet", "treasury", "signer", "governance"
]);

function assertSha(value, field, pattern = HASH_PATTERN) {
  invariant(pattern.test(value ?? ""), "K4168_HASH_REQUIRED", `${field} must be a lowercase hash`);
}

function assertK4168Boundary(record) {
  invariant(record.schemaVersion === K4168_TRANSITION_SCHEMA_VERSION, "K4168_SCHEMA_VERSION_INVALID", "Unsupported K4168 transition schema");
  invariant(record.prototypeStatus === K4168_TRANSITION_STATUS, "K4168_DRAFT_ONLY_REQUIRED", "K4168 transition must remain an engineering draft");
  invariant(record.runtimeAuthority === false && record.liveIdentityCreation === false, "K4168_RUNTIME_AUTHORITY_FORBIDDEN", "The draft cannot create a Life or runtime authority");
  invariant(record.sameTechnicalInstance === false, "K4168_SAME_INSTANCE_FORBIDDEN", "Predecessor and successor candidate are not the same technical instance");
  invariant(record.handoffIsReincarnationApproval === false, "K4168_HANDOFF_APPROVAL_FORBIDDEN", "A handoff is not reincarnation approval");
  invariant(record.authorityInherited === false, "K4168_AUTHORITY_INHERITANCE_FORBIDDEN", "Authority cannot be inherited through lineage");
  K4168_INHERITED_AUTHORITY_FIELDS.forEach((field) => invariant(record.inheritedAuthorities?.[field] === false, "K4168_AUTHORITY_INHERITANCE_FORBIDDEN", `${field} authority cannot be inherited`));
  invariant(record.successorCandidate?.lifeId === null && record.successorCandidate?.workerId === null && record.successorCandidate?.employeeId === null, "K4168_IDENTITY_ISSUANCE_FORBIDDEN", "The draft cannot issue Life, Worker or Employee IDs");
  invariant(record.successorCandidate.existingWorkerCandidateRef === null || typeof record.successorCandidate.existingWorkerCandidateRef === "string", "K4168_EXISTING_WORKER_REF_INVALID", "An existing Worker candidate reference must be null or a string pending external revalidation");
  invariant(record.humanCanonicalApproval === "PENDING", "K4168_HUMAN_APPROVAL_PENDING_REQUIRED", "This draft must remain pending Human canonical approval");
  invariant(record.reincarnationStatus === "PENDING_HUMAN_CANONICAL_DECISION", "K4168_REINCARNATION_PENDING_REQUIRED", "Reincarnation must remain pending Human canonical decision");
  invariant(record.resumeAuthorized === false, "K4168_RESUME_AUTHORITY_FORBIDDEN", "The engineering draft cannot authorize successor resume");
}

function validateK4168Record(record) {
  requireFields(record, [
    "schemaVersion", "prototypeStatus", "runtimeAuthority", "liveIdentityCreation",
    "transitionId", "workOrderId", "cause", "baseSha", "endingSha",
    "predecessor", "successorCandidate", "predecessorAvailability",
    "sameTechnicalInstance", "handoffIsReincarnationApproval", "authorityInherited",
    "inheritedAuthorities", "humanCanonicalApproval", "reincarnationStatus",
    "stage", "sequence", "handoffId", "handoffHash", "ackHash", "lineageDecision",
    "workerRevalidation", "resumeAuthorized", "createdAt", "updatedAt",
    "previousRecordHash", "recordHash"
  ], "K4168TransitionRecord");
  requireId(record.transitionId, "transitionId");
  requireId(record.workOrderId, "workOrderId");
  requireEnum(record.cause, ["PREDECESSOR_THREAD_CAPACITY_EXHAUSTED"], "cause");
  requireEnum(record.stage, K4168_TRANSITION_STAGES, "stage");
  requireEnum(record.predecessorAvailability, ["AVAILABLE", "UNAVAILABLE"], "predecessorAvailability");
  assertSha(record.baseSha, "baseSha", GIT_SHA_PATTERN);
  if (record.endingSha !== null) assertSha(record.endingSha, "endingSha", GIT_SHA_PATTERN);
  requireFields(record.predecessor, ["lifeId", "instanceId", "threadId", "authorDisplayName"], "predecessor");
  requireFields(record.successorCandidate, ["displayName", "lifeId", "workerId", "employeeId", "existingWorkerCandidateRef", "instanceId", "threadId", "relationship"], "successorCandidate");
  invariant(record.predecessor.lifeId && record.predecessor.instanceId && record.predecessor.threadId, "K4168_PREDECESSOR_REFERENCE_REQUIRED", "Existing predecessor references are required");
  invariant(record.successorCandidate.displayName && record.successorCandidate.instanceId && record.successorCandidate.threadId, "K4168_SUCCESSOR_CANDIDATE_REFERENCE_REQUIRED", "Successor candidate references are required");
  invariant(record.successorCandidate.instanceId !== record.predecessor.instanceId && record.successorCandidate.threadId !== record.predecessor.threadId, "K4168_DUPLICATE_IDENTITY", "Successor candidate must use a distinct technical instance and thread");
  invariant(record.successorCandidate.relationship === "ENGINEERING_AND_KNOWLEDGE_LINEAGE_CANDIDATE", "K4168_LINEAGE_SCOPE_INVALID", "Successor relationship is limited to engineering and knowledge lineage candidacy");
  invariant(Number.isInteger(record.sequence) && record.sequence >= 0, "K4168_SEQUENCE_INVALID", "Transition sequence must be a non-negative integer");
  invariant(record.handoffId === null || (typeof record.handoffId === "string" && record.handoffId.length > 0), "K4168_HANDOFF_ID_INVALID", "Handoff ID must be null or non-empty");
  if (record.handoffHash !== null) assertSha(record.handoffHash, "handoffHash");
  if (record.ackHash !== null) assertSha(record.ackHash, "ackHash");
  if (record.previousRecordHash !== null) assertSha(record.previousRecordHash, "previousRecordHash");
  requireFields(record.workerRevalidation, ["status", "workerId", "evidenceHash"], "workerRevalidation");
  requireEnum(record.workerRevalidation.status, ["NOT_RUN", "VERIFIED_EXISTING_WORKER"], "workerRevalidation.status");
  if (record.stage === "DRAFT" || record.stage === "HOLD_PREDECESSOR_UNAVAILABLE") {
    invariant(record.handoffId === null && record.handoffHash === null && record.ackHash === null, "K4168_STAGE_EVIDENCE_CONFLICT", "Draft or unavailable hold cannot claim handoff/ACK evidence");
  }
  if (["HANDOFF_SAVED", "HASH_VERIFIED", "SUCCESSOR_ACKNOWLEDGED", "LINEAGE_REVIEWED", "WORKER_REVALIDATED"].includes(record.stage)) {
    invariant(record.handoffId !== null && record.handoffHash !== null && record.endingSha !== null, "K4168_HANDOFF_EVIDENCE_REQUIRED", "Post-handoff stages require exact handoff evidence");
  }
  if (["SUCCESSOR_ACKNOWLEDGED", "LINEAGE_REVIEWED", "WORKER_REVALIDATED"].includes(record.stage)) {
    invariant(record.ackHash !== null, "K4168_ACK_EVIDENCE_REQUIRED", "Post-ACK stages require acknowledgement evidence");
  }
  if (["LINEAGE_REVIEWED", "WORKER_REVALIDATED"].includes(record.stage)) {
    invariant(record.lineageDecision === "ENGINEERING_AND_KNOWLEDGE_LINEAGE_CANDIDATE_ONLY", "K4168_LINEAGE_DECISION_REQUIRED", "Post-lineage stages require the bounded lineage decision");
  }
  if (record.stage === "WORKER_REVALIDATED") {
    invariant(record.workerRevalidation.status === "VERIFIED_EXISTING_WORKER" && record.workerRevalidation.workerId === record.successorCandidate.existingWorkerCandidateRef, "K4168_WORKER_REVALIDATION_EVIDENCE_REQUIRED", "Worker-revalidated stage requires exact existing-Worker evidence");
  } else {
    invariant(record.workerRevalidation.status === "NOT_RUN", "K4168_PREMATURE_WORKER_REVALIDATION", "Worker evidence cannot appear before the revalidation stage");
  }
  assertSha(record.recordHash, "recordHash");
  assertK4168Boundary(record);
  assertNoContinuitySecrets(record, "K4168TransitionRecord");
  return record;
}

function k4168RecordHashInput(record) {
  const copy = clone(record);
  delete copy.recordHash;
  return copy;
}

export async function hashK4168TransitionRecord(record) {
  return sha256(k4168RecordHashInput(record));
}

export async function hashK4168HandoffPackage(handoffPackage) {
  requireFields(handoffPackage, K4168_HANDOFF_FIELDS, "K4168HandoffPackage");
  invariant(typeof handoffPackage.signature === "string" && handoffPackage.signature.trim().length > 0, "K4168_PREDECESSOR_ACK_REQUIRED", "Predecessor acknowledgement/signature is required");
  ["files_read", "files_changed", "actions_completed", "actions_not_completed", "tests_run", "test_results", "open_blockers", "known_risks", "incidents", "human_decisions", "forbidden_next_actions", "required_next_actions", "evidence_paths"].forEach((field) => requireArray(handoffPackage[field], `handoff.${field}`));
  invariant(Number.isFinite(Date.parse(handoffPackage.created_at)), "K4168_HANDOFF_TIME_INVALID", "Handoff created_at must be a valid timestamp");
  assertNoContinuitySecrets(handoffPackage, "K4168HandoffPackage");
  return sha256(handoffPackage);
}

export function projectK4168TransitionStatus(record) {
  validateK4168Record(record);
  const blockers = [];
  if (record.predecessorAvailability !== "AVAILABLE") blockers.push("PREDECESSOR_UNAVAILABLE");
  if (record.stage !== "WORKER_REVALIDATED") blockers.push("WORKER_REVALIDATION_INCOMPLETE");
  if (record.humanCanonicalApproval !== "APPROVED") blockers.push("HUMAN_CANONICAL_APPROVAL_PENDING");
  if (record.successorCandidate.lifeId === null) blockers.push("SUCCESSOR_LIFE_ID_NOT_ISSUED");
  if (record.workerRevalidation.status !== "VERIFIED_EXISTING_WORKER") blockers.push("SUCCESSOR_WORKER_ID_NOT_VERIFIED");
  return Object.freeze({
    transitionId: record.transitionId,
    pointId: "K4168",
    status: blockers.length === 0 ? "RESUME_READY" : "ENGINEERING_DRAFT_HOLD",
    stage: record.stage,
    blockers: Object.freeze(blockers),
    sameTechnicalInstance: false,
    authorityInherited: false,
    reincarnationStatus: record.reincarnationStatus,
    updatedAt: record.updatedAt
  });
}

export function createK4168TransitionGate({ store, verifyPredecessorHandoff, verifySuccessorAcknowledgement, verifyExistingWorker, clock = nowIso }) {
  invariant(store?.commit && store?.getEntity && store?.history && store?.listEntities, "K4168_STORE_REQUIRED", "K4168 transition gate requires the existing Universe store interface");
  invariant(typeof verifyPredecessorHandoff === "function", "K4168_PREDECESSOR_VERIFIER_REQUIRED", "K4168 transition gate requires an external predecessor handoff verifier");
  invariant(typeof verifySuccessorAcknowledgement === "function", "K4168_SUCCESSOR_VERIFIER_REQUIRED", "K4168 transition gate requires an external successor acknowledgement verifier");
  invariant(typeof verifyExistingWorker === "function", "K4168_WORKER_VERIFIER_REQUIRED", "K4168 transition gate requires an external existing-worker verifier");

  async function finalize(record) {
    const next = { ...clone(record), recordHash: "" };
    next.recordHash = await hashK4168TransitionRecord(next);
    validateK4168Record(next);
    invariant(await hashK4168TransitionRecord(next) === next.recordHash, "K4168_RECORD_HASH_INVALID", "K4168 transition record hash mismatch");
    return Object.freeze(next);
  }

  async function commitVersion(current, patch, eventType, actorId) {
    const timestamp = clock();
    const next = await finalize({
      ...clone(current), ...clone(patch),
      sequence: current.sequence + 1,
      createdAt: current.createdAt,
      updatedAt: timestamp,
      previousRecordHash: current.recordHash,
      recordHash: ""
    });
    await store.commit({
      domain: K4168_DOMAIN,
      stream: K4168_STREAM,
      id: next.transitionId,
      entity: clone(next),
      event_id: `K4168_${next.recordHash.toUpperCase()}`,
      event_type: eventType,
      actor_id: actorId,
      timestamp,
      payload: { record: clone(next), engineeringDraftOnly: true, noIdentityIssued: true, noAuthorityInherited: true }
    });
    return clone(next);
  }

  async function createDraft(input, actorId = "DOT") {
    requireFields(input, ["transitionId", "workOrderId", "baseSha", "predecessor", "successorCandidate"], "K4168TransitionDraftInput");
    invariant(!(await get(input.transitionId)), "K4168_TRANSITION_ALREADY_EXISTS", "K4168 transition already exists");
    const timestamp = clock();
    const record = await finalize({
      schemaVersion: K4168_TRANSITION_SCHEMA_VERSION,
      prototypeStatus: K4168_TRANSITION_STATUS,
      runtimeAuthority: false,
      liveIdentityCreation: false,
      transitionId: input.transitionId,
      workOrderId: input.workOrderId,
      cause: "PREDECESSOR_THREAD_CAPACITY_EXHAUSTED",
      baseSha: input.baseSha,
      endingSha: null,
      predecessor: clone(input.predecessor),
      successorCandidate: {
        ...clone(input.successorCandidate),
        lifeId: null,
        workerId: null,
        employeeId: null,
        existingWorkerCandidateRef: input.successorCandidate.existingWorkerCandidateRef ?? null,
        relationship: "ENGINEERING_AND_KNOWLEDGE_LINEAGE_CANDIDATE"
      },
      predecessorAvailability: "AVAILABLE",
      sameTechnicalInstance: false,
      handoffIsReincarnationApproval: false,
      authorityInherited: false,
      inheritedAuthorities: Object.fromEntries(K4168_INHERITED_AUTHORITY_FIELDS.map((field) => [field, false])),
      humanCanonicalApproval: "PENDING",
      reincarnationStatus: "PENDING_HUMAN_CANONICAL_DECISION",
      stage: "DRAFT",
      sequence: 0,
      handoffId: null,
      handoffHash: null,
      ackHash: null,
      lineageDecision: "NOT_RECORDED",
      workerRevalidation: { status: "NOT_RUN", workerId: null, evidenceHash: null },
      resumeAuthorized: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      previousRecordHash: null,
      recordHash: ""
    });
    await store.commit({
      domain: K4168_DOMAIN, stream: K4168_STREAM, id: record.transitionId,
      entity: clone(record), event_id: `K4168_${record.recordHash.toUpperCase()}`,
      event_type: "K4168_TRANSITION_DRAFT_CREATED", actor_id: actorId, timestamp,
      payload: { record: clone(record), engineeringDraftOnly: true, noIdentityIssued: true, noAuthorityInherited: true }
    });
    return clone(record);
  }

  async function get(transitionId) { return store.getEntity(K4168_DOMAIN, transitionId); }
  async function list() { return store.listEntities(K4168_DOMAIN); }
  async function history(transitionId) {
    const events = await store.history(transitionId, K4168_STREAM);
    return events.filter((event) => event.payload?.record).map((event) => clone(event.payload.record));
  }

  async function saveHandoff({ transitionId, handoffPackage, endingSha, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "DRAFT", "K4168_STAGE_CONFLICT", "Handoff can only be saved from DRAFT");
    invariant(handoffPackage.from_life_id === current.predecessor.lifeId && handoffPackage.from_instance_id === current.predecessor.instanceId, "K4168_WRONG_PREDECESSOR", "Handoff predecessor does not match the transition");
    invariant(handoffPackage.to_instance_id_if_known === current.successorCandidate.instanceId, "K4168_WRONG_SUCCESSOR", "Handoff target does not match the successor candidate");
    invariant(handoffPackage.workorder_id === current.workOrderId && handoffPackage.base_sha === current.baseSha && handoffPackage.ending_sha === endingSha, "K4168_HANDOFF_BINDING_INVALID", "Handoff must bind the exact WorkOrder and Git SHAs");
    assertSha(endingSha, "endingSha", GIT_SHA_PATTERN);
    const handoffHash = await hashK4168HandoffPackage(handoffPackage);
    const predecessorVerified = await verifyPredecessorHandoff({ handoffPackage: clone(handoffPackage), handoffHash, predecessor: clone(current.predecessor) });
    invariant(predecessorVerified === true, "K4168_PREDECESSOR_ACK_UNVERIFIED", "Predecessor acknowledgement could not be externally verified");
    return commitVersion(current, { stage: "HANDOFF_SAVED", handoffId: handoffPackage.handoff_id, handoffHash, endingSha }, "K4168_HANDOFF_SAVED", actorId);
  }

  async function verifyHandoff({ transitionId, handoffPackage, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "HANDOFF_SAVED", "K4168_STAGE_CONFLICT", "Handoff hash can only be verified after save");
    invariant(await hashK4168HandoffPackage(handoffPackage) === current.handoffHash, "K4168_HANDOFF_HASH_MISMATCH", "Handoff package does not match the saved hash");
    return commitVersion(current, { stage: "HASH_VERIFIED" }, "K4168_HANDOFF_HASH_VERIFIED", actorId);
  }

  async function acknowledgeSuccessor({ transitionId, acknowledgement, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "HASH_VERIFIED", "K4168_STAGE_CONFLICT", "Successor ACK requires a verified handoff hash");
    requireFields(acknowledgement, ["ack_id", "transition_id", "handoff_id", "acknowledged_by_instance_id", "acknowledged_by_thread_id", "acknowledged_at", "main_sha_at_ack", "handoff_sha256", "staleness_result", "required_next_actions_accepted"], "K4168SuccessorAcknowledgement");
    invariant(acknowledgement.transition_id === current.transitionId && acknowledgement.handoff_id === current.handoffId && acknowledgement.handoff_sha256 === current.handoffHash, "K4168_ACK_BINDING_INVALID", "ACK must bind the transition, handoff ID and verified handoff hash");
    invariant(acknowledgement.acknowledged_by_instance_id === current.successorCandidate.instanceId && acknowledgement.acknowledged_by_thread_id === current.successorCandidate.threadId, "K4168_WRONG_SUCCESSOR", "ACK came from the wrong successor candidate");
    invariant(acknowledgement.main_sha_at_ack === current.endingSha && acknowledgement.staleness_result === "CURRENT", "K4168_STALE_HANDOFF", "ACK must revalidate the exact handoff head as current");
    invariant(Number.isFinite(Date.parse(acknowledgement.acknowledged_at)), "K4168_ACK_TIME_INVALID", "ACK timestamp must be valid");
    invariant(acknowledgement.required_next_actions_accepted === true, "K4168_ACK_INCOMPLETE", "Successor must accept the required next actions");
    const ackHash = await sha256(acknowledgement);
    const successorVerified = await verifySuccessorAcknowledgement({ acknowledgement: clone(acknowledgement), ackHash, successorCandidate: clone(current.successorCandidate) });
    invariant(successorVerified === true, "K4168_SUCCESSOR_ACK_UNVERIFIED", "Successor acknowledgement could not be externally verified");
    return commitVersion(current, { stage: "SUCCESSOR_ACKNOWLEDGED", ackHash }, "K4168_SUCCESSOR_ACKNOWLEDGED", actorId);
  }

  async function recordLineageDecision({ transitionId, decisionEvidenceHash, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "SUCCESSOR_ACKNOWLEDGED", "K4168_STAGE_CONFLICT", "Lineage review requires successor ACK");
    assertSha(decisionEvidenceHash, "decisionEvidenceHash");
    return commitVersion(current, {
      stage: "LINEAGE_REVIEWED",
      lineageDecision: "ENGINEERING_AND_KNOWLEDGE_LINEAGE_CANDIDATE_ONLY",
      lineageDecisionEvidenceHash: decisionEvidenceHash
    }, "K4168_LINEAGE_CANDIDACY_RECORDED", actorId);
  }

  async function revalidateWorker({ transitionId, existingWorkerId, evidenceHash, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "LINEAGE_REVIEWED", "K4168_STAGE_CONFLICT", "Worker revalidation requires completed lineage review");
    invariant(typeof existingWorkerId === "string" && existingWorkerId.length > 0, "K4168_EXISTING_WORKER_REQUIRED", "Revalidation cannot issue a new Worker ID");
    assertSha(evidenceHash, "workerRevalidation.evidenceHash");
    invariant(current.successorCandidate.existingWorkerCandidateRef === existingWorkerId, "K4168_WORKER_BINDING_NOT_CANONICAL", "The successor candidate has no canonical existing-Worker reference to revalidate");
    const verified = await verifyExistingWorker({ workerId: existingWorkerId, evidenceHash, transition: clone(current) });
    invariant(verified === true, "K4168_WORKER_REVALIDATION_FAILED", "Existing Worker revalidation failed closed");
    return commitVersion(current, {
      stage: "WORKER_REVALIDATED",
      workerRevalidation: { status: "VERIFIED_EXISTING_WORKER", workerId: existingWorkerId, evidenceHash }
    }, "K4168_EXISTING_WORKER_REVALIDATED", actorId);
  }

  async function markPredecessorUnavailable({ transitionId, evidenceHash, actorId }) {
    const current = await get(transitionId);
    invariant(current?.stage === "DRAFT", "K4168_STAGE_CONFLICT", "Predecessor unavailable flow starts before handoff save");
    assertSha(evidenceHash, "predecessorUnavailableEvidenceHash");
    return commitVersion(current, {
      stage: "HOLD_PREDECESSOR_UNAVAILABLE",
      predecessorAvailability: "UNAVAILABLE",
      predecessorUnavailableEvidenceHash: evidenceHash,
      safeRecoveryActions: ["READ_ONLY_PROVENANCE_REVIEW", "RECOVER_LAST_VERIFIED_HANDOFF", "HUMAN_CANONICAL_DECISION"]
    }, "K4168_PREDECESSOR_UNAVAILABLE_HOLD", actorId);
  }

  async function evaluateResume(transitionId) {
    const current = await get(transitionId);
    invariant(current, "K4168_TRANSITION_NOT_FOUND", `K4168 transition not found: ${transitionId}`);
    return projectK4168TransitionStatus(current);
  }

  async function verifyHistory(transitionId) {
    const records = await history(transitionId);
    invariant(records.length > 0, "K4168_HISTORY_EMPTY", "K4168 transition has no history");
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      validateK4168Record(record);
      invariant(record.sequence === index, "K4168_HISTORY_SEQUENCE_BROKEN", "K4168 transition sequence is broken");
      invariant(record.previousRecordHash === (records[index - 1]?.recordHash ?? null), "K4168_HISTORY_HASH_CHAIN_BROKEN", "K4168 transition hash chain is broken");
      invariant(await hashK4168TransitionRecord(record) === record.recordHash, "K4168_RECORD_HASH_INVALID", "K4168 transition record hash mismatch");
    }
    return true;
  }

  return Object.freeze({
    createDraft, get, list, history, saveHandoff, verifyHandoff,
    acknowledgeSuccessor, recordLineageDecision, revalidateWorker,
    markPredecessorUnavailable, evaluateResume, verifyHistory
  });
}
