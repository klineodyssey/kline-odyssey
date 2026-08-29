import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { validateRightsManifest } from "../permissions/index.mjs";
import { invariant } from "../shared/errors.mjs";

export const ASSET_TYPES = Object.freeze([
  "TOKEN", "LIFE", "APP", "APP_TECHNOLOGY", "COMPANY", "EQUITY", "JOB", "SERVICE", "LAND", "BUILDING",
  "FACTORY", "SPACECRAFT", "EQUIPMENT", "ORGAN_ROBOT", "BODY_MODULE", "ENERGY", "DATA", "LICENSE", "CONTRACT", "GOODS"
]);

export const ORGAN_ROBOT_INSTALL_STATUSES = Object.freeze([
  "CANDIDATE", "OWNED_NOT_INSTALLED", "INCOMPATIBLE", "READY_FOR_TRANSPLANT", "INSTALLED", "MAINTENANCE_REQUIRED", "OFFLINE"
]);

export const ORGAN_ROBOT_FIELDS = Object.freeze([
  "organ_id", "app_id", "manufacturer_id", "model", "version", "owner_life_id", "supported_species",
  "body_interfaces", "capabilities", "energy_requirement", "compute_requirement", "maintenance_policy",
  "license_id", "ownership_rights", "install_status", "installed_body_id", "market_status"
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

export function validateOrganRobot(organ) {
  requireFields(organ, ORGAN_ROBOT_FIELDS, "OrganRobot");
  requireId(organ.organ_id, "organ_id");
  requireId(organ.app_id, "app_id");
  requireId(organ.manufacturer_id, "manufacturer_id");
  requireId(organ.owner_life_id, "owner_life_id");
  requireEnum(organ.install_status, ORGAN_ROBOT_INSTALL_STATUSES, "organ.install_status");
  invariant(Array.isArray(organ.supported_species) && organ.supported_species.length > 0, "ORGAN_SPECIES_REQUIRED", "Organ Robot requires at least one supported species");
  invariant(Array.isArray(organ.body_interfaces) && organ.body_interfaces.length > 0, "ORGAN_BODY_INTERFACE_REQUIRED", "Organ Robot requires at least one body interface");
  invariant(Array.isArray(organ.capabilities) && organ.capabilities.length > 0, "ORGAN_CAPABILITY_REQUIRED", "Organ Robot requires at least one capability");
  invariant(Array.isArray(organ.ownership_rights) && organ.ownership_rights.length > 0, "ORGAN_OWNERSHIP_RIGHTS_REQUIRED", "Organ Robot ownership rights must be explicit");
  invariant(Number(organ.energy_requirement) >= 0, "ORGAN_ENERGY_REQUIREMENT_INVALID", "Organ Robot energy requirement must be non-negative");
  invariant(Number(organ.compute_requirement) >= 0, "ORGAN_COMPUTE_REQUIREMENT_INVALID", "Organ Robot compute requirement must be non-negative");
  invariant(organ.install_status === "INSTALLED" ? Boolean(organ.installed_body_id) : organ.installed_body_id === null, "ORGAN_INSTALL_STATE_INVALID", "Only an installed Organ Robot may bind an installed body");
  return organ;
}

export function createOrganRobotAsset({ asset, organ }) {
  validateAsset(asset);
  validateOrganRobot(organ);
  invariant(asset.asset_type === "ORGAN_ROBOT", "ORGAN_ROBOT_ASSET_TYPE_REQUIRED", "Organ Robot must use the ORGAN_ROBOT Universal Asset type");
  invariant(asset.asset_id === organ.organ_id, "ORGAN_ROBOT_ASSET_ID_MISMATCH", "Organ Robot identity must match its Universal Asset identity");
  invariant(asset.owner_id === organ.owner_life_id, "ORGAN_ROBOT_OWNER_MISMATCH", "Universal Asset owner and Organ Robot economic owner must match");
  return Object.freeze({ asset: structuredClone(asset), organ: structuredClone(organ) });
}

export function evaluateOrganRobotCompatibility({ organ, ownerLifeId, speciesId, bodyInterface, availableEnergy, availableCompute, securityEvidence }) {
  validateOrganRobot(organ);
  invariant(organ.owner_life_id === ownerLifeId, "ORGAN_TRANSPLANT_OWNER_REQUIRED", "Only the Organ Robot owner may request transplant readiness");
  const blockers = [];
  if (!organ.supported_species.includes(speciesId)) blockers.push("SPECIES_INCOMPATIBLE");
  if (!organ.body_interfaces.includes(bodyInterface)) blockers.push("BODY_INTERFACE_INCOMPATIBLE");
  if (Number(availableEnergy) < Number(organ.energy_requirement)) blockers.push("ENERGY_INSUFFICIENT");
  if (Number(availableCompute) < Number(organ.compute_requirement)) blockers.push("COMPUTE_INSUFFICIENT");
  if (securityEvidence?.status !== "VERIFIED") blockers.push("SECURITY_EVIDENCE_REQUIRED");
  return Object.freeze({
    organ_id: organ.organ_id,
    owner_life_id: organ.owner_life_id,
    status: blockers.length ? "INCOMPATIBLE" : "READY_FOR_TRANSPLANT",
    blockers: Object.freeze(blockers),
    ownership_preserved: true,
    automatic_installation: false
  });
}

export function activateOrganRobotTransplant({ organ, compatibility, bodyId, ownershipTransferReceipt, transplantEvidence, verifyOwnershipTransferReceipt, verifyTransplantEvidence }) {
  validateOrganRobot(organ);
  invariant(compatibility?.organ_id === organ.organ_id && compatibility.status === "READY_FOR_TRANSPLANT", "ORGAN_COMPATIBILITY_REQUIRED", "A compatible Organ Robot is required for transplant");
  invariant(typeof verifyOwnershipTransferReceipt === "function", "ORGAN_OWNERSHIP_RECEIPT_VERIFIER_REQUIRED", "A trusted ownership receipt verifier is required");
  invariant(typeof verifyTransplantEvidence === "function", "ORGAN_TRANSPLANT_EVIDENCE_VERIFIER_REQUIRED", "A trusted transplant evidence verifier is required");
  const verifiedOwnership = verifyOwnershipTransferReceipt(ownershipTransferReceipt, Object.freeze({ asset_id: organ.organ_id, owner_life_id: organ.owner_life_id }));
  const verifiedTransplant = verifyTransplantEvidence(transplantEvidence, Object.freeze({ organ_id: organ.organ_id, body_id: bodyId, owner_life_id: organ.owner_life_id }));
  invariant(verifiedOwnership?.status === "VERIFIED_SETTLED" && verifiedOwnership.asset_id === organ.organ_id && verifiedOwnership.owner_life_id === organ.owner_life_id && verifiedOwnership.provenance_status === "REPOSITORY_BOUND_SETTLEMENT_ATTESTATION", "ORGAN_OWNERSHIP_SETTLEMENT_REQUIRED", "Repository-bound ownership settlement evidence is required before transplant");
  invariant(verifiedTransplant?.status === "VERIFIED" && verifiedTransplant.body_id === bodyId && verifiedTransplant.organ_id === organ.organ_id && verifiedTransplant.provenance_status === "REPOSITORY_BOUND_TRANSPLANT_ATTESTATION", "ORGAN_TRANSPLANT_EVIDENCE_REQUIRED", "Repository-bound body transplant evidence is required");
  return Object.freeze({ ...structuredClone(organ), install_status: "INSTALLED", installed_body_id: bodyId, ownership_settlement_evidence_id: verifiedOwnership.evidence_id, transplant_evidence_id: verifiedTransplant.evidence_id });
}

export function createAssetRegistry(store, createRegistry) {
  return createRegistry({ domain: "ASSET", stream: "ASSET", idField: "asset_id", validate: validateAsset, store });
}
