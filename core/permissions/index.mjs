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

export const CIVILIZATION_CAPABILITIES = Object.freeze([
  "MARKET_OBSERVER", "PRICE_ANALYST", "PAPER_TRADER", "TRADE_PROPOSER",
  "REAL_TRADER", "TREASURY_OPERATOR", "CFO", "AUDITOR", "CODER",
  "TESTER", "REVIEWER", "LOGISTICS_OPERATOR"
]);

export const DEFAULT_ON_DUTY_MARKET_CAPABILITIES = Object.freeze([
  "MARKET_OBSERVER", "PRICE_ANALYST", "PAPER_TRADER"
]);

function normalizeCapabilityList(capabilities, field = "capabilities") {
  invariant(Array.isArray(capabilities), "INVALID_CAPABILITY_LIST", `${field} must be an array`);
  const unique = [...new Set(capabilities)];
  for (const capability of unique) {
    invariant(CIVILIZATION_CAPABILITIES.includes(capability), "UNKNOWN_CAPABILITY", `Unknown civilization capability: ${capability}`);
  }
  return unique;
}

export function createCivilizationCapabilityGrant({
  grantId, lifeId, workerId, workPoint, jobRoles, capabilities = [],
  employmentStatus = "ACTIVE", status = "ACTIVE", issuedAt,
  expiresAt = null, policyBoxId = null
}) {
  invariant(typeof grantId === "string" && grantId.length > 0, "CAPABILITY_GRANT_ID_REQUIRED", "Capability grant ID is required");
  invariant(typeof lifeId === "string" && lifeId.length > 0, "CAPABILITY_LIFE_ID_REQUIRED", "A formal Life ID is required for capability grants");
  invariant(typeof workerId === "string" && workerId.length > 0, "CAPABILITY_WORKER_ID_REQUIRED", "A worker ID is required for capability grants");
  invariant(Number.isInteger(workPoint) && workPoint >= 0, "INVALID_WORK_POINT", "Work point must be a non-negative integer");
  invariant(Array.isArray(jobRoles) && jobRoles.length > 0, "JOB_ROLE_REQUIRED", "At least one job role is required");
  invariant(["ACTIVE", "INACTIVE"].includes(employmentStatus), "INVALID_EMPLOYMENT_STATUS", "Employment status is invalid");
  invariant(["ACTIVE", "REVOKED", "EXPIRED"].includes(status), "INVALID_CAPABILITY_STATUS", "Capability grant status is invalid");
  const defaults = employmentStatus === "ACTIVE" ? DEFAULT_ON_DUTY_MARKET_CAPABILITIES : [];
  const normalized = normalizeCapabilityList([...defaults, ...capabilities]);
  return Object.freeze({
    grant_id: grantId,
    life_id: lifeId,
    worker_id: workerId,
    work_point: workPoint,
    job_roles: Object.freeze([...new Set(jobRoles)]),
    capabilities: Object.freeze(normalized),
    employment_status: employmentStatus,
    status,
    issued_at: issuedAt,
    expires_at: expiresAt,
    policy_box_id: policyBoxId,
    real_asset_execution_inherited: false,
    unlimited_withdraw: false,
    unlimited_approval: false,
    arbitrary_transfer: false,
    governance_bypass: false
  });
}

export function assertCivilizationCapability(grant, capability, { lifeId, workerId = null, observedAt } = {}) {
  invariant(grant?.status === "ACTIVE", "CAPABILITY_REVOKED_OR_INACTIVE", "Capability grant is not active");
  invariant(grant.employment_status === "ACTIVE", "STALE_WORKER_ROLE", "Worker employment is not active");
  invariant(grant.life_id === lifeId, "CAPABILITY_LIFE_ID_MISMATCH", "Capability grant belongs to another Life");
  if (workerId !== null) invariant(grant.worker_id === workerId, "CAPABILITY_WORKER_ID_MISMATCH", "Capability grant belongs to another worker");
  invariant(CIVILIZATION_CAPABILITIES.includes(capability), "UNKNOWN_CAPABILITY", `Unknown civilization capability: ${capability}`);
  invariant(grant.capabilities.includes(capability), "CAPABILITY_NOT_GRANTED", `${capability} is not granted`);
  if (grant.expires_at !== null) {
    invariant(Number.isFinite(Date.parse(observedAt)), "CAPABILITY_TIME_REQUIRED", "A valid observation time is required for expiring grants");
    invariant(Date.parse(observedAt) < Date.parse(grant.expires_at), "CAPABILITY_EXPIRED", "Capability grant has expired");
  }
  return true;
}
