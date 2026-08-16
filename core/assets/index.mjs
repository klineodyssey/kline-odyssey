import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { validateRightsManifest } from "../permissions/index.mjs";

export const ASSET_TYPES = Object.freeze([
  "TOKEN", "LIFE", "APP", "COMPANY", "EQUITY", "JOB", "SERVICE", "LAND", "BUILDING",
  "FACTORY", "SPACECRAFT", "EQUIPMENT", "ENERGY", "DATA", "LICENSE", "CONTRACT", "GOODS"
]);

export const ASSET_FIELDS = Object.freeze([
  "asset_id", "asset_type", "issuer_id", "owner_id", "controller_id", "metadata_hash", "rights_manifest",
  "settlement_currency", "status", "location", "location_id", "civilization_id", "created_at", "updated_at"
]);

export function validateAsset(asset) {
  requireFields(asset, ASSET_FIELDS, "Asset");
  requireId(asset.asset_id, "asset_id");
  requireEnum(asset.asset_type, ASSET_TYPES, "asset_type");
  validateRightsManifest(asset.rights_manifest);
  return asset;
}

export function createAssetRegistry(store, createRegistry) {
  return createRegistry({ domain: "ASSET", stream: "ASSET", idField: "asset_id", validate: validateAsset, store });
}
