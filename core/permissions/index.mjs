import { invariant } from "../shared/errors.mjs";
import { requireFields } from "../shared/schema.mjs";

export const RIGHTS_FIELDS = Object.freeze([
  "identity_right", "ownership_right", "control_right", "use_right", "license_right",
  "revenue_right", "governance_right", "transfer_right", "breeding_right", "data_right",
  "expiration", "restrictions"
]);

export function validateRightsManifest(rights) {
  requireFields(rights, RIGHTS_FIELDS, "RightsManifest");
  invariant(!Object.keys(rights).some((key) => /private.?key/i.test(key)), "PRIVATE_KEY_AS_RIGHT", "Private key can never be a right");
  invariant(Array.isArray(rights.restrictions), "INVALID_RESTRICTIONS", "Rights restrictions must be an array");
  return rights;
}

export function createLifeRightsManifest(overrides = {}) {
  const rights = {
    identity_right: "NON_TRANSFERABLE",
    ownership_right: "SELF_HELD",
    control_right: "OWNER_CONTROLLED",
    use_right: "LICENSABLE",
    license_right: "LICENSABLE",
    revenue_right: "OWNER_RECEIVES",
    governance_right: "NON_TRANSFERABLE",
    transfer_right: "RESTRICTED",
    breeding_right: "RULE_GOVERNED",
    data_right: "CONSENT_REQUIRED",
    expiration: null,
    restrictions: ["LIFE_IDENTITY_NOT_FOR_SALE", "PRIVATE_KEY_NEVER_TRANSFERRED"],
    ...overrides
  };
  return validateRightsManifest(rights);
}

export function assertRightsOfferAllowed(asset, rightsOffered) {
  validateRightsManifest(asset.rights_manifest);
  const lifeCoreRights = ["identity_right", "ownership_right", "control_right", "governance_right", "transfer_right"];
  invariant(!(asset.asset_type === "LIFE" && rightsOffered.some((right) => lifeCoreRights.includes(right))), "LIFE_IDENTITY_NOT_FOR_SALE", "Life identity and core control rights cannot be listed or transferred");
  for (const right of rightsOffered) {
    invariant(RIGHTS_FIELDS.includes(right), "UNKNOWN_RIGHT", `Unknown right: ${right}`);
    invariant(asset.rights_manifest[right] !== "NON_TRANSFERABLE", "RIGHT_NOT_TRANSFERABLE", `${right} is non-transferable`);
  }
  return true;
}
