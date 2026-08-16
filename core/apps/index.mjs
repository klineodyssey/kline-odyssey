import { requireArray, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { sha256 } from "../shared/utils.mjs";

export const APP_FIELDS = Object.freeze([
  "app_id", "life_id", "species_id", "developer", "name", "version", "runtime", "entrypoint", "manifest_hash",
  "birth_certificate_ref", "wallet_address", "skills", "services", "permissions", "work_policy", "finance_policy",
  "mission_ref", "ideal", "dream", "ultimate_mission", "pricing_model", "license_model", "status", "released_at", "history"
]);

export const DIGITAL_ANT_APP_CAPABILITIES = Object.freeze([
  "WUKONG_GATEKEEPER", "CHAIN_OBSERVER", "CFO_OF_SELF", "LIFE_LEDGER", "HEART_ELIGIBILITY",
  "MISSION_TRACKER", "DREAM_TRACKER", "11520_PROFILE", "WORK_QUEUE_READER", "REPORT_GENERATOR"
]);

export const DIGITAL_ANT_APP_PERMISSIONS = Object.freeze({
  CHAIN_READ: true,
  CHAIN_WRITE: false,
  SIGN_TRANSACTION: false,
  LIVE_TRADING: false,
  HEART_WRITE: false,
  KAIOS_WRITE: false,
  SETTLEMENT_WRITE: false,
  COMPANY_TREASURY: false,
  PRIVATE_KEY_BROWSER_ACCESS: false
});

const FORBIDDEN_RELEASE_CAPABILITIES = Object.freeze([
  "AUTO_TRADING", "CHAIN_WRITE", "PROJECT_ESCROW", "REAL_PAYROLL", "COMPANY_TREASURY", "MARS_FACTORY"
]);

export function appManifestPayload(app) {
  const { manifest_hash: _manifestHash, history: _history, updated_at: _updatedAt, ...manifest } = app;
  return manifest;
}

export async function calculateAppManifestHash(app) {
  return sha256(appManifestPayload(app));
}

export function validateApp(app) {
  requireFields(app, APP_FIELDS, "App");
  requireId(app.app_id, "app_id");
  requireId(app.life_id, "life_id");
  requireId(app.species_id, "species_id");
  requireArray(app.skills, "skills");
  requireArray(app.services, "services");
  requireArray(app.history, "history");
  invariant(Array.isArray(app.permissions) || (app.permissions && typeof app.permissions === "object"), "INVALID_APP_PERMISSIONS", "App permissions must be an array or explicit permission manifest");
  invariant(/^V?\d+\.\d+\.\d+$/.test(app.version), "INVALID_APP_VERSION", "App version must use semantic versioning with an optional V prefix");
  invariant(!app.skills.some((skill) => FORBIDDEN_RELEASE_CAPABILITIES.includes(skill)), "UNRELEASED_CAPABILITY_CLAIMED", "The released App cannot claim an unavailable capability");
  if (app.status === "RELEASED_LOCAL") {
    invariant(app.released_at && Number.isFinite(Date.parse(app.released_at)), "APP_RELEASE_TIMESTAMP_REQUIRED", "Released App requires a release timestamp");
    invariant(/^([0-9a-f]{64})$/.test(app.manifest_hash), "APP_MANIFEST_HASH_REQUIRED", "Released App requires a SHA-256 manifest hash");
    if (!Array.isArray(app.permissions)) {
      invariant(Object.entries(DIGITAL_ANT_APP_PERMISSIONS).every(([key, value]) => app.permissions[key] === value), "APP_PERMISSION_ESCALATION", "Digital Ant V1.0.0 permissions must remain read-only");
    }
  }
  return app;
}

export async function replayCanonicalAppRelease({ store, app, life, listing, appAsset }) {
  validateApp(app);
  invariant(app.status === "RELEASED_LOCAL" && app.version === "V1.0.0", "APP_RELEASE_NOT_FORMAL", "Canonical Digital Ant App release is incomplete");
  invariant(app.life_id === life.life_id && life.life_id === "DIGITAL_ANT_0001", "APP_LIFE_ID_MISMATCH", "App release cannot replace its Life ID");
  invariant(life.birth_timestamp === "2026-08-15T06:20:45.000Z", "BIRTH_IMMUTABLE", "App release cannot rewrite the immutable Birth Certificate");
  invariant(await calculateAppManifestHash(app) === app.manifest_hash, "APP_MANIFEST_HASH_MISMATCH", "App manifest hash does not match the released manifest");
  invariant(listing?.listing_id === "11520_LISTING_DIGITAL_ANT_0001" && listing.status === "LISTED", "APP_LISTING_REQUIRED", "App release must update the existing 11520 listing");
  invariant(appAsset?.asset_id === app.app_id && appAsset.asset_type === "APP", "APP_ASSET_REQUIRED", "App release requires the existing App asset");
  const history = await store.history(app.app_id, "APP");
  if (history.some((event) => event.event_type === "AI_LIFE_APP_RELEASE_EVENT" && event.payload?.version === app.version)) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const releasedLife = { ...life, app_id: app.app_id, app_version: app.version, updated_at: app.released_at };
  const payload = Object.freeze({
    life_id: life.life_id,
    app_id: app.app_id,
    version: app.version,
    release_timestamp: app.released_at,
    skills: app.skills,
    permissions: app.permissions,
    manifest_hash: app.manifest_hash,
    status: app.status,
    release_scope: "LOCAL_11520",
    tx_hash: null
  });
  const base = { actor_id: life.life_id, timestamp: app.released_at, tx_hash: null };
  const events = await store.commitBatch([
    { ...base, domain: "APP", stream: "APP", id: app.app_id, entity: app, event_type: "AI_LIFE_APP_RELEASE_EVENT", payload },
    { ...base, domain: "LIFE", stream: "LIFE", id: life.life_id, entity: releasedLife, event_type: "AI_LIFE_APP_RELEASE_EVENT", payload },
    { ...base, domain: "MARKET", stream: "MARKET", id: listing.listing_id, entity: listing, event_type: "11520_LISTING_APP_RELEASE_UPDATED", payload: { listing_id: listing.listing_id, app_id: app.app_id, app_version: app.version, app_status: app.status, identity_right_offered: false } },
    { ...base, domain: "ASSET", stream: "ASSET", id: appAsset.asset_id, entity: appAsset, event_type: "APP_ASSET_RELEASED_LOCAL", payload: { app_id: app.app_id, version: app.version, manifest_hash: app.manifest_hash, settlement_status: "NOT_DEPLOYED" } }
  ]);
  return Object.freeze({ status: "APP_RELEASE_REPLAYED", events });
}

export async function upgradeAppVersion({ appRegistry, lifeRegistry, appId, nextVersion, actorId }) {
  const app = await appRegistry.get(appId);
  invariant(app, "APP_NOT_FOUND", `App not found: ${appId}`);
  const lifeId = app.life_id;
  const next = await appRegistry.updateMetadata(appId, { version: nextVersion }, actorId);
  await lifeRegistry.updateMetadata(lifeId, { app_version: nextVersion }, actorId);
  invariant((await lifeRegistry.get(lifeId)).life_id === lifeId, "LIFE_ID_CHANGED", "App upgrade cannot change Life ID");
  return next;
}

export function createAppRegistry(store, createRegistry) {
  return createRegistry({ domain: "APP", stream: "APP", idField: "app_id", validate: validateApp, store });
}
