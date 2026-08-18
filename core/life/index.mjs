import { requireArray, requireEnum, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
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
