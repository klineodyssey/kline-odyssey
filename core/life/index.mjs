import { requireArray, requireFields, requireId } from "../shared/schema.mjs";
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
  validateRightsManifest(life.rights_manifest);
  invariant(!Object.keys(life).some((key) => /private.?key/i.test(key)), "PRIVATE_KEY_IN_LIFE", "Private key is forbidden in Life schema");
  return life;
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
  return createRegistry({ domain: "LIFE", stream: "LIFE", idField: "life_id", validate: validateLife, store });
}
