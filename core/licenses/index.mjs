import { requireFields, requireId } from "../shared/schema.mjs";

export function validateLicense(license) {
  requireFields(license, ["license_id", "asset_id", "licensor_id", "licensee_id", "rights", "start_time", "end_time", "status"], "License");
  requireId(license.license_id, "license_id");
  return license;
}

export function createLicenseRegistry(store, createRegistry) {
  return createRegistry({ domain: "LICENSE", stream: "ASSET", idField: "license_id", validate: validateLicense, store });
}
