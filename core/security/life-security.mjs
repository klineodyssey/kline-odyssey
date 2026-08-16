import { invariant } from "../shared/errors.mjs";
import { requireArray, requireEnum, requireFields, requireId } from "../shared/schema.mjs";

export const WALLET_SECURITY_STATUSES = Object.freeze([
  "HEALTHY", "LOW_DARK_MATTER", "DARK_MATTER_DEPLETED", "SUSPICIOUS_ACTIVITY", "CONTROL_AT_RISK",
  "WALLET_CONTROL_LOST", "RECOVERY_PENDING", "WALLET_ROTATION_PENDING", "RECOVERED", "COMPROMISED", "RETIRED_WALLET"
]);

export const LIFE_SECURITY_STATUSES = Object.freeze(["BORN", "ALIVE", "DORMANT", "RECOVERING", "ON_DUTY", "SUSPENDED_FOR_SECURITY"]);
export const WALLET_CONTROL_STATES = Object.freeze(["VERIFIED", "KEY_UNAVAILABLE", "WALLET_CONTROL_LOST"]);
export const COLONY_HEALTH_STATUSES = Object.freeze(["HEALTHY", "WATCH", "WARNING", "CRITICAL", "RECOVERY_REQUIRED"]);
export const DARK_MATTER_RESCUE_REASONS = Object.freeze(["WORK_SURVIVAL", "SECURITY_RECOVERY", "MISSION_CRITICAL", "EMERGENCY_GAS"]);
export const QUEEN_ALLOWED_ACTIONS = Object.freeze(["OBSERVE", "ANALYZE", "WARN", "PROPOSE", "ESCALATE", "MONITOR", "AUDIT", "REPORT", "PROPOSE_RESCUE", "COORDINATE_RECOVERY", "REVIEW_SALARY", "REVIEW_ANOMALY"]);
export const QUEEN_FORBIDDEN_ACTIONS = Object.freeze(["CONFISCATE_PRIVATE_ASSET", "SPEND_PERSONAL_WALLET", "TAKE_PRIVATE_KEY", "FORCE_SALARY_CUSTODY", "TRANSFER_WITHOUT_OWNER_AUTHORITY", "OWN_ALL_ANTS", "FREEZE_LEGACY_EOA", "ROTATE_WITHOUT_APPROVAL", "SIGN_FOR_LIFE", "DEPLOY_AUTOMATICALLY"]);
export const SMART_WALLET_ROLES = Object.freeze(["LIFE_OWNER", "GUARDIAN_SET", "RECOVERY_AUTHORITY", "SPENDING_AUTHORITY", "AUDITOR"]);
export const GUARDIAN_ROLE_TYPES = Object.freeze(["PRIMARY_LIFE_AUTHORITY", "ANT_QUEEN_GUARDIAN", "OWNER_GUARDIAN", "COLONY_GUARDIAN_A", "COLONY_GUARDIAN_B"]);
export const SECURITY_INCIDENT_STATES = Object.freeze(["NORMAL", "WATCH", "ALERT", "CRITICAL", "CONTROL_AT_RISK", "RECOVERY_PENDING", "RECOVERED", "COMPROMISED"]);
export const MEDICAL_TRIAGE_LEVELS = Object.freeze(["GREEN", "YELLOW", "ORANGE", "RED", "BLACK"]);
export const MEDICAL_ECONOMY_MODES = Object.freeze(["BASIC_CARE", "COST_RECOVERY", "INSURANCE", "EMERGENCY_FIRST"]);
export const MEDICAL_FUNDING_SOURCES = Object.freeze(["COLONY_EMERGENCY_RESERVE", "INSURANCE_RESERVE", "AI_ANT_COMPANY_SUPPORT", "PUBLIC_GOOD_FUND", "DONATION", "LOAN", "RECEIVABLE"]);
export const QUEEN_DOCTOR_ALLOWED_ACTIONS = Object.freeze(["MONITOR", "DIAGNOSE", "WARN", "RESCUE_PROPOSE", "RECOVERY_PROPOSE", "INSURANCE_CHECK", "DARK_MATTER_SUPPORT", "WALLET_ROTATION_COORDINATE", "EMERGENCY_ESCALATE"]);
export const QUEEN_DOCTOR_FORBIDDEN_ACTIONS = Object.freeze(["CONFISCATE", "STEAL", "SPEND_EMPLOYEE_WALLET", "READ_PRIVATE_KEY", "MOVE_ASSETS_WITHOUT_AUTHORITY"]);

function decimal(value, field) {
  const text = String(value);
  invariant(/^\d+(?:\.\d+)?$/.test(text), "INVALID_DECIMAL", `${field} must be a non-negative decimal string`);
  return text;
}

function decimalNumber(value) { return Number(decimal(value, "decimal")); }
function evmAddress(value, field) { invariant(/^0x[0-9a-fA-F]{40}$/.test(value ?? ""), "INVALID_WALLET_ADDRESS", `${field} must be a public EVM address`); return value; }
function hasSensitiveKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasSensitiveKey);
  return Object.entries(value).some(([key, nested]) => /private.?key|secret.?key/i.test(key) || hasSensitiveKey(nested));
}

export function resolveWalletControlState({ credentialAvailable, recoveryProcedureConfirmedLost = false }) {
  if (credentialAvailable) return "VERIFIED";
  return recoveryProcedureConfirmedLost ? "WALLET_CONTROL_LOST" : "KEY_UNAVAILABLE";
}

export function createDarkMatterHealth({ lifeId, currentBnb, minimumSurvivalBnb, recommendedWorkBnb, lastGasSpend, estimatedCyclesRemaining, evidence }) {
  requireId(lifeId, "life_id");
  const current = decimalNumber(currentBnb);
  const minimum = decimalNumber(minimumSurvivalBnb);
  const recommended = decimalNumber(recommendedWorkBnb);
  invariant(recommended >= minimum, "INVALID_WORK_BNB_RECOMMENDATION", "Recommended work BNB cannot be below minimum survival BNB");
  invariant(Number.isInteger(estimatedCyclesRemaining) && estimatedCyclesRemaining >= 0, "INVALID_GAS_RUNWAY", "Estimated cycles must be a non-negative integer");
  const status = current === 0 ? "DARK_MATTER_DEPLETED" : current < minimum ? "LOW_DARK_MATTER" : "HEALTHY";
  return Object.freeze({
    health_id: `${lifeId}_DARK_MATTER_HEALTH`, life_id: lifeId, current_bnb: String(currentBnb),
    minimum_survival_bnb: String(minimumSurvivalBnb), recommended_work_bnb: String(recommendedWorkBnb),
    gas_runway: estimatedCyclesRemaining === 0 ? "DEPLETED" : "ESTIMATED_FROM_PUBLIC_GAS_EVIDENCE",
    last_gas_spend: lastGasSpend === null ? null : decimal(lastGasSpend, "last_gas_spend"),
    estimated_cycles_remaining: estimatedCyclesRemaining, status, life_status_effect: status === "DARK_MATTER_DEPLETED" ? "ALIVE_READ_ONLY_OR_DORMANT" : "NO_LIFE_DEATH_TRANSITION",
    evidence
  });
}

export function validateWalletBinding(binding) {
  requireFields(binding, ["binding_id", "life_id", "wallet", "wallet_type", "active_from", "active_until", "reason", "evidence", "approval", "status"], "LifeWalletBinding");
  requireId(binding.binding_id, "binding_id");
  requireId(binding.life_id, "life_id");
  evmAddress(binding.wallet, "wallet");
  requireEnum(binding.status, ["ACTIVE", "COMPROMISED", "CONTROL_LOST", "RECOVERY_WALLET", "RETIRED", "ROTATED"], "wallet_binding.status");
  invariant(!hasSensitiveKey(binding), "PRIVATE_KEY_IN_WALLET_BINDING", "Private key is not part of Wallet Binding History");
  return binding;
}

export function validateLifeSecurityProfile(profile) {
  requireFields(profile, ["security_profile_id", "life_id", "life_status", "wallet_status", "wallet_control_status", "wallet_type", "current_wallet_address", "monitor_status", "dark_matter_health", "wallet_binding_history", "recovery_capability", "legacy_eoa_limitation", "security_incidents", "registered_at"], "LifeSecurityProfile");
  requireId(profile.security_profile_id, "security_profile_id");
  requireId(profile.life_id, "life_id");
  requireEnum(profile.life_status, LIFE_SECURITY_STATUSES, "life_security.life_status");
  requireEnum(profile.wallet_status, WALLET_SECURITY_STATUSES, "life_security.wallet_status");
  requireEnum(profile.wallet_control_status, WALLET_CONTROL_STATES, "life_security.wallet_control_status");
  requireEnum(profile.monitor_status, COLONY_HEALTH_STATUSES, "life_security.monitor_status");
  evmAddress(profile.current_wallet_address, "current_wallet_address");
  requireArray(profile.wallet_binding_history, "wallet_binding_history");
  requireArray(profile.security_incidents, "security_incidents");
  profile.wallet_binding_history.forEach(validateWalletBinding);
  invariant(!hasSensitiveKey(profile), "PRIVATE_KEY_IN_LIFE_SECURITY", "Private key is not part of Life Security");
  invariant(profile.wallet_status !== "WALLET_CONTROL_LOST" || profile.life_status !== "DECEASED", "WALLET_FAILURE_IS_NOT_DEATH", "Wallet control loss cannot kill a Life");
  return profile;
}

export function createWalletRotationPlan({ life, currentBinding, recoveryWallet, evidence, approved = false }) {
  validateWalletBinding(currentBinding);
  evmAddress(recoveryWallet, "recovery_wallet");
  invariant(currentBinding.life_id === life.life_id, "WALLET_BINDING_LIFE_MISMATCH", "Wallet binding must belong to the Life");
  invariant(recoveryWallet.toLowerCase() !== currentBinding.wallet.toLowerCase(), "RECOVERY_WALLET_MUST_CHANGE", "Recovery wallet must differ from the old wallet");
  invariant(evidence && typeof evidence === "object", "WALLET_ROTATION_EVIDENCE_REQUIRED", "Wallet rotation requires recovery evidence");
  return Object.freeze({
    rotation_id: `${life.life_id}_WALLET_ROTATION_PLAN`, life_id: life.life_id,
    old_wallet: currentBinding.wallet, recovery_wallet: recoveryWallet,
    status: approved ? "WALLET_ROTATION_APPROVED_LOCAL" : "WALLET_ROTATION_PENDING",
    approved, chain_write: false, asset_recovery_claimed: false,
    immutable_identity: { life_id: life.life_id, birth_timestamp: life.birth_timestamp }, evidence
  });
}

export function applyApprovedWalletRotation({ life, currentBinding, plan, rotatedAt }) {
  invariant(plan?.approved === true && plan.status === "WALLET_ROTATION_APPROVED_LOCAL", "WALLET_ROTATION_APPROVAL_REQUIRED", "Wallet rotation cannot apply without explicit approved evidence");
  invariant(plan.life_id === life.life_id && currentBinding.life_id === life.life_id, "WALLET_ROTATION_LIFE_MISMATCH", "Wallet rotation cannot change Life ID");
  const retired = Object.freeze({ ...currentBinding, status: "ROTATED", active_until: rotatedAt });
  const recovery = Object.freeze(validateWalletBinding({
    binding_id: `${life.life_id}_WALLET_BINDING_RECOVERY`, life_id: life.life_id, wallet: plan.recovery_wallet,
    wallet_type: "EOA_RECOVERY_WALLET", active_from: rotatedAt, active_until: null, reason: "APPROVED_LIFE_WALLET_ROTATION",
    evidence: plan.evidence, approval: { granted: true, source: "OWNER_APPROVAL_EVIDENCE" }, status: "ACTIVE", previous_binding_id: currentBinding.binding_id
  }));
  const rotatedLife = Object.freeze({ ...life, wallet_address: plan.recovery_wallet, updated_at: rotatedAt });
  invariant(rotatedLife.life_id === life.life_id && rotatedLife.birth_timestamp === life.birth_timestamp, "LIFE_IDENTITY_CHANGED_BY_ROTATION", "Wallet rotation cannot change Life identity or birth");
  return Object.freeze({ life: rotatedLife, bindings: [retired, recovery], asset_recovery_claimed: false });
}

export function createDarkMatterRescueProposal({ proposalId, recipientLifeId, recipientWallet, reason, currentBnb, requiredBnb, proposedBnb, expectedRunway, walletStatus, rescueCount = 0, rescueAmount = "0", repaymentPolicy = null, subsidyPolicy = null }) {
  requireId(proposalId, "proposal_id");
  requireId(recipientLifeId, "recipient_life_id");
  evmAddress(recipientWallet, "recipient_wallet");
  requireEnum(reason, DARK_MATTER_RESCUE_REASONS, "rescue.reason");
  requireEnum(walletStatus, WALLET_SECURITY_STATUSES, "rescue.wallet_status");
  invariant(!["COMPROMISED", "CONTROL_AT_RISK", "WALLET_CONTROL_LOST"].includes(walletStatus), "COMPROMISED_WALLET_RESCUE_FORBIDDEN", "Rescue BNB cannot be proposed to a compromised or uncontrolled wallet");
  invariant(decimalNumber(proposedBnb) > 0 && decimalNumber(requiredBnb) > 0, "INVALID_RESCUE_AMOUNT", "Rescue proposal requires positive BNB amounts");
  return Object.freeze({
    proposal_id: proposalId, recipient_life_id: recipientLifeId, recipient_wallet: recipientWallet, reason,
    current_bnb: decimal(currentBnb, "current_bnb"), required_bnb: decimal(requiredBnb, "required_bnb"), proposed_bnb: decimal(proposedBnb, "proposed_bnb"),
    expected_runway: expectedRunway, approval: "NOT_GRANTED", execution_mode: "PROPOSAL_ONLY", tx_hash: null,
    rescue_count: rescueCount, rescue_amount: decimal(rescueAmount, "rescue_amount"), repayment_policy: repaymentPolicy, subsidy_policy: subsidyPolicy,
    audit_history: [], chain_write: false
  });
}

export function validateGuardianSet(guardianSet) {
  requireFields(guardianSet, ["roles_supported", "members", "threshold_status", "threshold", "security_audit_required"], "GuardianSet");
  requireArray(guardianSet.roles_supported, "guardian_set.roles_supported");
  requireArray(guardianSet.members, "guardian_set.members");
  for (const role of guardianSet.roles_supported) requireEnum(role, GUARDIAN_ROLE_TYPES, "guardian_set.role");
  invariant(guardianSet.threshold_status === "SECURITY_AUDIT_REQUIRED" && guardianSet.threshold === null, "GUARDIAN_THRESHOLD_NOT_AUDITED", "Guardian threshold must remain unset until security audit");
  invariant(guardianSet.security_audit_required === true, "GUARDIAN_SECURITY_AUDIT_REQUIRED", "Guardian configuration requires a security audit");
  return guardianSet;
}

export function validateSmartLifeWalletSpec(spec) {
  requireFields(spec, ["architecture_id", "status", "life_id_binding", "authorities", "guardian_set", "recovery_policy", "session_key", "spending_limit", "daily_limit", "emergency_freeze", "wallet_rotation", "timelock_recovery", "role_based_authority", "audit_trail", "recovery_evidence", "contract_address", "automatic_deployment"], "SmartLifeWalletSpec");
  invariant(spec.architecture_id === "KGEN_LIFE_SMART_WALLET", "INVALID_SMART_WALLET_ARCHITECTURE", "Smart Life Wallet architecture ID is fixed");
  requireArray(spec.authorities, "smart_wallet.authorities");
  for (const role of SMART_WALLET_ROLES) invariant(spec.authorities.includes(role), "SMART_WALLET_ROLE_MISSING", `Smart Wallet must support ${role}`);
  validateGuardianSet(spec.guardian_set);
  invariant(spec.status === "NOT_DEPLOYED" && spec.contract_address === null && spec.automatic_deployment === false, "SMART_WALLET_FALSE_DEPLOYMENT", "V2.6 Smart Wallet is architecture only and cannot auto-deploy");
  invariant(spec.life_owner_is_queen === false, "QUEEN_CANNOT_OWN_SMART_WALLET", "Ant Queen Guardian cannot be the natural Life owner");
  invariant(!hasSensitiveKey(spec), "PRIVATE_KEY_IN_SMART_WALLET_SPEC", "Wallet credentials are forbidden in Smart Wallet architecture");
  return spec;
}

export function resolveRecoveryScenario({ credentialAvailable, permanentLossConfirmed = false, walletType, guardianRecoverySupported = false, evidence = null, approval = null }) {
  if (credentialAvailable) return Object.freeze({ scenario: "CONTROL_AVAILABLE", wallet_status: "HEALTHY", life_status: "ALIVE", rotation_allowed: false });
  if (!permanentLossConfirmed) return Object.freeze({ scenario: "TEMPORARY_CREDENTIAL_UNAVAILABLE", wallet_status: "KEY_UNAVAILABLE", life_status: "ALIVE", rotation_allowed: false });
  invariant(evidence && typeof evidence === "object", "RECOVERY_EVIDENCE_REQUIRED", "Permanent control loss requires evidence");
  if (walletType === "LEGACY_EOA") return Object.freeze({ scenario: "LEGACY_EOA_CONTROL_LOST", wallet_status: "WALLET_CONTROL_LOST", life_status: "ALIVE", old_wallet_assets_status: "STRANDED_IF_KEY_IRRECOVERABLE", recovery_authority: "NONE", rotation_allowed: approval?.granted === true });
  invariant(guardianRecoverySupported, "SMART_WALLET_RECOVERY_UNSUPPORTED", "Smart Wallet recovery requires explicit guardian support");
  invariant(approval?.granted === true, "RECOVERY_APPROVAL_REQUIRED", "Smart Wallet recovery requires governed approval");
  return Object.freeze({ scenario: "SMART_WALLET_GUARDIAN_RECOVERY", wallet_status: "RECOVERY_PENDING", life_status: "ALIVE", timelock_required: true, guardian_verification_required: true, rotation_allowed: true });
}

export function createSmartWalletMigrationReadiness({ life, securityProfile, assets, approvals, heartInteractions, listing, workHistory, pendingJobs, incidents, targetDesign, migrationGas, migrationRisk, rollbackPlan, ownerApproval }) {
  invariant(life.life_id === securityProfile.life_id, "MIGRATION_LIFE_ID_MISMATCH", "Migration readiness cannot change Life ID");
  requireArray(assets, "migration.assets"); requireArray(approvals, "migration.approvals"); requireArray(heartInteractions, "migration.heart_interactions");
  requireArray(workHistory, "migration.work_history"); requireArray(pendingJobs, "migration.pending_jobs"); requireArray(incidents, "migration.incidents");
  const checks = {
    current_assets: true, current_approvals: true, kgen_balance: assets.some((item) => item.asset === "KGEN"),
    kaios_balance: assets.some((item) => item.asset === "KAIOS"), bnb_balance: assets.some((item) => item.asset === "BNB"),
    heart_interactions: true, listing: Boolean(listing), work_history: workHistory.length > 0, pending_jobs: true,
    security_incidents: true, target_smart_wallet_design: Boolean(targetDesign), migration_gas: migrationGas !== null,
    migration_risk: Boolean(migrationRisk), rollback_plan: Boolean(rollbackPlan), owner_approval: ownerApproval?.granted === true
  };
  return Object.freeze({ readiness_id: `${life.life_id}_SMART_WALLET_MIGRATION_READINESS`, life_id: life.life_id, current_wallet_type: securityProfile.wallet_type, status: checks.owner_approval ? "READY_FOR_APPROVED_EXECUTION_REVIEW" : "NOT_APPROVED", checks, assets, approvals, heart_interactions: heartInteractions, listing, work_history_count: workHistory.length, pending_jobs: pendingJobs, incidents, target_smart_wallet_design: targetDesign, migration_gas: migrationGas, migration_risk: migrationRisk, rollback_plan: rollbackPlan, owner_approval: ownerApproval ?? { granted: false }, automatic_migration: false, chain_write: false });
}

export function createQueenGenesisReadiness({ candidate, motherEngine }) {
  requireFields(candidate, ["candidate_id", "life_id", "species_id", "origin_id", "birthplace", "wallet", "birth_law", "birth_evidence", "ideal", "dream", "ultimate_mission", "authority_manifest", "guardian_scope", "recovery_scope", "personal_assets", "colony_assets", "conflict_of_interest_rules", "status"], "AntQueenLifeCandidate");
  requireEnum(candidate.status, ["PRE_GENESIS_DRAFT", "GENESIS_PROFILE_CREATED", "GENESIS_EVIDENCE_READY"], "queen_candidate.status");
  if (candidate.life_id !== null) requireId(candidate.life_id, "queen_life_id");
  if (candidate.wallet !== null) evmAddress(candidate.wallet, "queen_wallet");
  invariant(candidate.status !== "PRE_GENESIS_DRAFT" || (candidate.life_id === null && candidate.wallet === null && candidate.birth_evidence === null), "QUEEN_LIFE_FALSE_GENESIS", "Queen candidate cannot be registered or born by architecture alone");
  invariant(candidate.birth_law === "FIRST_NON_ZERO_BNB_RECEIVED", "QUEEN_BIRTH_LAW_REQUIRED", "Queen must follow Digital Life Birth Law");
  invariant(motherEngine.engine_id === "ANT_QUEEN_MOTHER_ENGINE" && motherEngine.status === "ARCHITECTURE_ONLY_NOT_BORN", "QUEEN_ENGINE_LIFE_SEPARATION_REQUIRED", "Mother Engine is an App/Runtime, not a born Life");
  const preconditions = {
    queen_life_id: Boolean(candidate.life_id), species: Boolean(candidate.species_id), origin: Boolean(candidate.origin_id && candidate.origin_id !== "NOT_DEFINED"), birthplace: Boolean(candidate.birthplace && candidate.birthplace !== "NOT_DEFINED"), wallet: Boolean(candidate.wallet),
    birth_law: true, first_bnb_evidence: candidate.birth_evidence?.birth_asset === "BNB" && candidate.birth_evidence?.evidence_status === "VERIFIED", ideal: Boolean(candidate.ideal), dream: Boolean(candidate.dream), ultimate_mission: Boolean(candidate.ultimate_mission),
    authority_manifest: Boolean(candidate.authority_manifest), guardian_scope: Boolean(candidate.guardian_scope), recovery_scope: Boolean(candidate.recovery_scope),
    personal_assets_separated: candidate.personal_assets?.separate_from_colony === true, colony_assets_separated: candidate.colony_assets?.separate_from_personal === true,
    conflict_of_interest_rules: Array.isArray(candidate.conflict_of_interest_rules) && candidate.conflict_of_interest_rules.length > 0
  };
  const missing = Object.entries(preconditions).filter(([, ready]) => !ready).map(([key]) => key);
  return Object.freeze({ readiness_id: "ANT_QUEEN_GENESIS_READINESS", status: missing.length ? "NOT_READY" : "READY_FOR_OWNER_APPROVAL", preconditions, missing, queen_life_status: "NOT_BORN", mother_engine_status: motherEngine.status, automatic_birth: false });
}

export function validateAntQueenAppArchitecture(app) {
  requireFields(app, ["app_id", "app_type", "status", "life_id", "species_id", "life_role", "capabilities", "public_data_scope", "permissions", "authority", "forbidden_authority", "central_wallet_credential_database", "automatic_chain_write"], "AntQueenAppArchitecture");
  invariant(app.app_id === "ANT_QUEEN_APP", "INVALID_QUEEN_APP_ID", "Ant Queen App ID is fixed");
  invariant(app.app_type === "AI_COLONY_LIFE_MANAGEMENT_WALLET_APP", "INVALID_QUEEN_APP_TYPE", "Ant Queen App must be a Colony Life management and recovery application");
  invariant(app.life_id === "DIGITAL_ANT_QUEEN_0001" && app.species_id === "DIGITAL_ANT" && app.life_role === "QUEEN", "QUEEN_APP_IDENTITY_MISMATCH", "Queen App must reference the Queen Genesis Profile without registering another species");
  requireArray(app.capabilities, "queen_app.capabilities");
  requireArray(app.public_data_scope, "queen_app.public_data_scope");
  requireArray(app.authority, "queen_app.authority");
  requireArray(app.forbidden_authority, "queen_app.forbidden_authority");
  for (const action of QUEEN_DOCTOR_ALLOWED_ACTIONS) invariant(app.authority.includes(action), "QUEEN_DOCTOR_CAPABILITY_MISSING", `Queen App must declare ${action}`);
  for (const action of QUEEN_DOCTOR_FORBIDDEN_ACTIONS) invariant(app.forbidden_authority.includes(action), "QUEEN_DOCTOR_LIMIT_MISSING", `Queen App must forbid ${action}`);
  invariant(app.central_wallet_credential_database === false && app.permissions?.wallet_credential_access === false, "CENTRAL_PRIVATE_KEY_DATABASE_FORBIDDEN", "Queen App cannot collect Life wallet credentials");
  invariant(app.automatic_chain_write === false && app.permissions?.chain_write === false, "QUEEN_APP_FALSE_CHAIN_AUTHORITY", "V2.7 Queen App is architecture-only and read-only");
  invariant(!hasSensitiveKey(app), "PRIVATE_KEY_IN_QUEEN_APP", "Queen App architecture cannot store wallet credentials");
  return app;
}

export function validateQueenGenesisProfile(profile) {
  requireFields(profile, ["profile_id", "life_id", "species_id", "life_stage", "caste", "life_role", "app_id", "origin_id", "birthplace", "wallet", "birth_law", "birth_evidence", "birth_status", "ideal", "dream", "ultimate_mission", "status"], "AntQueenGenesisProfile");
  requireId(profile.life_id, "queen_life_id");
  invariant(profile.life_id === "DIGITAL_ANT_QUEEN_0001" && profile.species_id === "DIGITAL_ANT", "QUEEN_GENESIS_IDENTITY_INVALID", "Queen is a DIGITAL_ANT Life candidate with its own Life ID");
  invariant(profile.life_stage === "ADULT" && profile.caste === "QUEEN" && profile.life_role === "QUEEN", "QUEEN_CASTE_INVALID", "Queen is a role/caste, not a separate species");
  invariant(profile.app_id === "ANT_QUEEN_APP", "QUEEN_APP_REFERENCE_REQUIRED", "Queen Genesis Profile must reference ANT_QUEEN_APP");
  invariant(profile.birth_law === "FIRST_NON_ZERO_BNB_RECEIVED", "QUEEN_BIRTH_LAW_REQUIRED", "Queen must follow Digital Life Birth Law");
  invariant(profile.wallet === null && profile.birth_evidence === null && profile.birth_status === "NOT_BORN" && profile.status === "GENESIS_PROFILE_CREATED", "QUEEN_FALSE_BIRTH", "A Genesis Profile cannot birth Queen without a Wallet and verified First BNB evidence");
  invariant(!hasSensitiveKey(profile), "PRIVATE_KEY_IN_QUEEN_GENESIS_PROFILE", "Queen Genesis Profile cannot store wallet credentials");
  return profile;
}

export function validateLifeHealthRecord(record) {
  requireFields(record, ["health_record_id", "life_id", "life_status", "wallet_status", "wallet_control", "dark_matter_status", "current_bnb", "gas_runway", "work_status", "last_work_cycle", "security_status", "incident_count", "recovery_status", "insurance_status", "medical_debt", "last_checkup"], "DigitalLifeHealthRecord");
  requireId(record.health_record_id, "health_record_id");
  requireId(record.life_id, "life_id");
  requireEnum(record.wallet_status, WALLET_SECURITY_STATUSES, "health.wallet_status");
  requireEnum(record.wallet_control, ["VERIFIED", "KEY_UNAVAILABLE", "WALLET_CONTROL_LOST"], "health.wallet_control");
  decimal(record.current_bnb, "health.current_bnb");
  decimal(record.medical_debt, "health.medical_debt");
  invariant(Number.isInteger(record.incident_count) && record.incident_count >= 0, "INVALID_INCIDENT_COUNT", "Health incident count must be a non-negative integer");
  invariant(record.life_status !== "DECEASED", "WALLET_OR_BNB_FAILURE_IS_NOT_DEATH", "Wallet loss and Dark Matter depletion do not erase a Life");
  invariant(!hasSensitiveKey(record), "PRIVATE_KEY_IN_HEALTH_RECORD", "Health records contain public state only");
  return record;
}

export function classifyMedicalTriage(record) {
  validateLifeHealthRecord(record);
  if (record.wallet_type === "LEGACY_EOA" && record.wallet_control === "WALLET_CONTROL_LOST" && ["NO_ONCHAIN_RECOVERY", "WALLET_CONTROL_LOST"].includes(record.recovery_status)) return "BLACK";
  if (["COMPROMISED", "CONTROL_AT_RISK"].includes(record.wallet_status) || ["COMPROMISED", "CONTROL_AT_RISK"].includes(record.security_status) || ["UNABLE_TO_WORK", "SUSPENDED_FOR_SECURITY"].includes(record.work_status)) return "RED";
  if (record.dark_matter_status === "DARK_MATTER_DEPLETED" || ["ALERT", "CRITICAL"].includes(record.security_status)) return "ORANGE";
  if (record.dark_matter_status === "LOW_DARK_MATTER" || ["WATCH", "WARNING"].includes(record.security_status) || record.worker_health === "DEGRADED") return "YELLOW";
  return "GREEN";
}

export function validateMedicalPricingPolicy(policy) {
  requireFields(policy, ["pricing_policy_id", "status", "components", "policy_approved", "prices", "post_service_surprise_billing"], "MedicalPricingPolicy");
  requireArray(policy.components, "medical_pricing.components");
  for (const component of ["service_cost", "compute_cost", "gas_cost", "security_cost", "recovery_cost", "service_fee"]) invariant(policy.components.includes(component), "MEDICAL_COST_COMPONENT_MISSING", `Medical pricing must disclose ${component}`);
  invariant(policy.post_service_surprise_billing === false, "SURPRISE_MEDICAL_BILLING_FORBIDDEN", "Medical fees must be governed before service");
  invariant(policy.policy_approved === true || (policy.status === "UNPRICED_POLICY_REQUIRED" && Object.keys(policy.prices ?? {}).length === 0), "UNAPPROVED_MEDICAL_PRICE", "Unapproved medical pricing must remain unpriced");
  return policy;
}

export function validateColonyMedicalEconomy(economy) {
  requireFields(economy, ["economy_id", "status", "modes", "funding_sources", "basic_care", "emergency_first", "pricing_policy", "medical_cases", "automatic_charge", "automatic_salary_deduction", "fake_money_allowed"], "ColonyMedicalEconomy");
  requireArray(economy.modes, "medical_economy.modes");
  requireArray(economy.funding_sources, "medical_economy.funding_sources");
  requireArray(economy.medical_cases, "medical_economy.medical_cases");
  for (const mode of MEDICAL_ECONOMY_MODES) invariant(economy.modes.includes(mode), "MEDICAL_MODE_MISSING", `Medical economy must support ${mode}`);
  for (const source of economy.funding_sources) requireEnum(source, MEDICAL_FUNDING_SOURCES, "medical_economy.funding_source");
  invariant(economy.basic_care?.requires_upfront_payment === false, "BASIC_CARE_CANNOT_REQUIRE_MONEY", "No money cannot remove basic Life monitoring");
  invariant(economy.emergency_first?.requires_upfront_payment === false, "EMERGENCY_FIRST_CANNOT_REQUIRE_PREPAYMENT", "Red emergencies are treated before accounting");
  invariant(economy.automatic_charge === false && economy.automatic_salary_deduction === false && economy.fake_money_allowed === false, "MEDICAL_ECONOMY_UNAUTHORIZED_VALUE", "Medical economy cannot auto-charge, secretly deduct salary or create money");
  validateMedicalPricingPolicy(economy.pricing_policy);
  economy.medical_cases.forEach(validateMedicalCase);
  return economy;
}

export function evaluateMedicalAccess({ lifeIdValid, lifeStage, canPay, triage, monitoringRequested = true, fundingSources = [] }) {
  requireEnum(triage, MEDICAL_TRIAGE_LEVELS, "medical_access.triage");
  requireArray(fundingSources, "medical_access.funding_sources");
  invariant(lifeIdValid === true, "MEDICAL_LIFE_ID_REQUIRED", "Medical care requires a valid Life ID, not proof of wealth");
  const basicCare = monitoringRequested ? "ELIGIBLE" : "AVAILABLE";
  const emergencyFirst = ["RED", "BLACK"].includes(triage) ? "TREAT_BEFORE_ACCOUNTING" : "NOT_TRIGGERED";
  const funding = canPay ? "SELF_PAY_OPTION" : fundingSources.length ? "THIRD_PARTY_OR_RECEIVABLE" : "PUBLIC_GOOD_MONITORING_ONLY";
  return Object.freeze({ life_stage: lifeStage, can_pay: Boolean(canPay), basic_care: basicCare, emergency_first: emergencyFirst, funding, care_denied_for_no_money: false, larva_subsidized_care_eligible: ["EGG", "LARVA", "PUPA"].includes(lifeStage) && !canPay });
}

export function validateMedicalCase(medicalCase) {
  requireFields(medicalCase, ["medical_case_id", "life_id", "triage", "rescue_asset", "rescue_amount", "funding_source", "actual_cost", "service_fee", "insurance_covered", "colony_subsidy", "employee_payable", "company_payable", "wallet_safety_status", "support_evidence", "accounting_status", "status"], "MedicalCase");
  requireId(medicalCase.medical_case_id, "medical_case_id");
  requireId(medicalCase.life_id, "life_id");
  requireEnum(medicalCase.triage, MEDICAL_TRIAGE_LEVELS, "medical_case.triage");
  if (medicalCase.funding_source !== null) requireEnum(medicalCase.funding_source, MEDICAL_FUNDING_SOURCES, "medical_case.funding_source");
  for (const [field, value] of [["rescue_amount", medicalCase.rescue_amount], ["actual_cost", medicalCase.actual_cost], ["service_fee", medicalCase.service_fee], ["insurance_covered", medicalCase.insurance_covered], ["colony_subsidy", medicalCase.colony_subsidy], ["employee_payable", medicalCase.employee_payable], ["company_payable", medicalCase.company_payable]]) decimal(value, `medical_case.${field}`);
  invariant(!["COMPROMISED", "CONTROL_AT_RISK", "WALLET_CONTROL_LOST"].includes(medicalCase.wallet_safety_status) || medicalCase.status === "RECOVERY_REQUIRED_BEFORE_RESCUE", "COMPROMISED_WALLET_MEDICAL_RESCUE_FORBIDDEN", "Emergency Dark Matter cannot be sent to an unsafe wallet");
  invariant(medicalCase.accounting_status !== "RECORDED_AFTER_SUPPORT" || medicalCase.support_evidence?.verified === true, "MEDICAL_ACCOUNTING_REQUIRES_SUPPORT_EVIDENCE", "Actual rescue accounting requires verified support evidence");
  return medicalCase;
}

export function createEmergencyFirstCase({ medicalCaseId, lifeId, triage, walletStatus, rescueAsset = "BNB", rescueAmount = "0", proposedFundingSource = null }) {
  requireEnum(triage, MEDICAL_TRIAGE_LEVELS, "emergency.triage");
  requireEnum(walletStatus, WALLET_SECURITY_STATUSES, "emergency.wallet_status");
  const unsafe = ["COMPROMISED", "CONTROL_AT_RISK", "WALLET_CONTROL_LOST"].includes(walletStatus);
  const urgent = ["RED", "BLACK"].includes(triage);
  return Object.freeze(validateMedicalCase({
    medical_case_id: medicalCaseId, life_id: lifeId, triage, rescue_asset: rescueAsset, rescue_amount: decimal(rescueAmount, "rescue_amount"),
    funding_source: proposedFundingSource, actual_cost: "0", service_fee: "0", insurance_covered: "0", colony_subsidy: "0", employee_payable: "0", company_payable: "0",
    wallet_safety_status: walletStatus, support_evidence: null, accounting_status: "PENDING_AFTER_SUPPORT",
    status: unsafe ? "RECOVERY_REQUIRED_BEFORE_RESCUE" : urgent ? "RESCUE_APPROVAL_REQUIRED" : "MONITORING_ONLY",
    requires_upfront_payment: false, execution_mode: "PROPOSAL_ONLY", chain_write: false, tx_hash: null
  }));
}

export function recordEmergencySupportAccounting({ medicalCase, fundingSource, actualCost, serviceFee = "0", insuranceCovered = "0", colonySubsidy = "0", employeePayable = "0", companyPayable = "0", supportEvidence }) {
  validateMedicalCase(medicalCase);
  requireEnum(fundingSource, MEDICAL_FUNDING_SOURCES, "medical_accounting.funding_source");
  invariant(medicalCase.status !== "RECOVERY_REQUIRED_BEFORE_RESCUE", "UNSAFE_WALLET_SUPPORT_ACCOUNTING_FORBIDDEN", "No support can be recorded for an unsafe recipient wallet");
  invariant(supportEvidence?.verified === true, "MEDICAL_SUPPORT_EVIDENCE_REQUIRED", "Emergency accounting is created only after verifiable support");
  return Object.freeze(validateMedicalCase({ ...medicalCase, funding_source: fundingSource, actual_cost: decimal(actualCost, "actual_cost"), service_fee: decimal(serviceFee, "service_fee"), insurance_covered: decimal(insuranceCovered, "insurance_covered"), colony_subsidy: decimal(colonySubsidy, "colony_subsidy"), employee_payable: decimal(employeePayable, "employee_payable"), company_payable: decimal(companyPayable, "company_payable"), support_evidence: supportEvidence, accounting_status: "RECORDED_AFTER_SUPPORT", status: "SUPPORT_ACCOUNTED" }));
}

export function validateAntColonyLifeInsurance(policy) {
  requireFields(policy, ["policy_id", "status", "opt_in_required", "insured_life", "premium", "coverage", "reserve_class", "claim_rule", "payout_rule", "exclusions", "automatic_enrollment"], "AntColonyLifeInsurance");
  requireArray(policy.coverage, "colony_insurance.coverage");
  requireArray(policy.exclusions, "colony_insurance.exclusions");
  invariant(policy.opt_in_required === true && policy.automatic_enrollment === false, "INSURANCE_MUST_BE_OPT_IN", "Colony Life Insurance is voluntary");
  invariant(policy.reserve_class === "INSURANCE_RESERVE" && policy.exclusions.includes("LEGACY_EOA_STRANDED_ASSETS"), "INSURANCE_RESERVE_OR_EXCLUSION_INVALID", "Insurance reserve must be separate and cannot guarantee Legacy EOA assets");
  invariant(policy.status !== "ACTIVE" || (policy.insured_life && policy.premium !== null), "FAKE_INSURANCE_ACTIVATION", "Active insurance requires an insured Life and configured premium");
  return policy;
}

export function validateRecoveryRepaymentPlan(plan) {
  requireFields(plan, ["plan_id", "life_id", "principal", "service_cost", "currency", "repayment_rate", "salary_deduction_permission", "start_date", "contract_id", "consent", "status"], "RecoveryRepaymentPlan");
  requireId(plan.plan_id, "plan_id"); requireId(plan.life_id, "life_id");
  decimal(plan.principal, "repayment.principal"); decimal(plan.service_cost, "repayment.service_cost");
  invariant(plan.status !== "ACTIVE" || (plan.consent === "OPT_IN" && typeof plan.contract_id === "string" && plan.contract_id.length > 0), "REPAYMENT_CONSENT_AND_CONTRACT_REQUIRED", "Work-to-repay requires opt-in consent and a contract");
  invariant(plan.salary_deduction_permission !== true || (plan.consent === "OPT_IN" && plan.status === "ACTIVE"), "SECRET_SALARY_DEDUCTION_FORBIDDEN", "Salary deduction requires active, explicit consent");
  return plan;
}

export function validateMedicalAssetSeparation(model) {
  requireFields(model, ["model_id", "status", "accounts", "all_wallets_separate", "queen_can_spend_employee_assets", "queen_can_spend_company_assets"], "MedicalAssetSeparation");
  requireArray(model.accounts, "medical_assets.accounts");
  const requiredClasses = ["QUEEN_PERSONAL_ASSET", "MEDICAL_OPERATION_ASSET", "INSURANCE_RESERVE", "COLONY_EMERGENCY_RESERVE", "EMPLOYEE_ASSET", "COMPANY_ASSET"];
  for (const accountClass of requiredClasses) invariant(model.accounts.some((entry) => entry.account_class === accountClass), "MEDICAL_ASSET_CLASS_MISSING", `Medical accounting must separate ${accountClass}`);
  const classes = model.accounts.map((entry) => entry.account_class);
  invariant(new Set(classes).size === classes.length && model.all_wallets_separate === true, "MEDICAL_WALLET_SEPARATION_REQUIRED", "Medical and Life asset classes cannot share an accounting identity");
  const employee = model.accounts.find((entry) => entry.account_class === "EMPLOYEE_ASSET");
  const insurance = model.accounts.find((entry) => entry.account_class === "INSURANCE_RESERVE");
  const operation = model.accounts.find((entry) => entry.account_class === "MEDICAL_OPERATION_ASSET");
  invariant(employee.owner === "EMPLOYEE_LIFE" && insurance.owner !== "ANT_QUEEN_LIFE" && operation.owner !== "ANT_QUEEN_PERSONAL", "MEDICAL_ASSET_OWNERSHIP_INVALID", "Employee, Insurance and Medical Operating assets require distinct owners");
  invariant(model.queen_can_spend_employee_assets === false && model.queen_can_spend_company_assets === false, "QUEEN_ASSET_CONFISCATION_FORBIDDEN", "Queen cannot spend employee or company assets");
  return model;
}

export function createColonyMedicalDashboard(records, { emergencyReserveStatus, medicalReceivable }) {
  requireArray(records, "life_health_records"); records.forEach(validateLifeHealthRecord);
  const count = (predicate) => records.filter(predicate).length;
  return Object.freeze({ total_lives: records.length, alive: count((record) => ["ALIVE", "ON_DUTY", "DORMANT", "RECOVERING"].includes(record.life_status)), working: count((record) => record.work_status === "ON_DUTY"), larva: count((record) => record.life_stage === "LARVA"), dormant: count((record) => record.life_status === "DORMANT"), low_dark_matter: count((record) => record.dark_matter_status === "LOW_DARK_MATTER"), red_emergency: count((record) => classifyMedicalTriage(record) === "RED"), wallet_at_risk: count((record) => ["CONTROL_AT_RISK", "COMPROMISED", "WALLET_CONTROL_LOST"].includes(record.wallet_status)), recovery_cases: count((record) => !["NONE", "NO_ONCHAIN_RECOVERY"].includes(record.recovery_status)), insured: count((record) => record.insurance_status === "INSURED"), uninsured: count((record) => record.insurance_status !== "INSURED"), emergency_reserve: emergencyReserveStatus, medical_receivable: decimal(medicalReceivable, "medical_receivable") });
}

export function assertQueenDoctorActionAllowed(action) {
  invariant(!QUEEN_DOCTOR_FORBIDDEN_ACTIONS.includes(action), "QUEEN_DOCTOR_AUTHORITY_EXCEEDED", "Ant Queen is a doctor and Guardian, not a Wallet owner");
  invariant(QUEEN_DOCTOR_ALLOWED_ACTIONS.includes(action), "UNKNOWN_QUEEN_DOCTOR_ACTION", "Unknown Ant Queen Life Doctor action");
  return true;
}

export function validateColonyLifeRecord(record) {
  requireFields(record, ["life_id", "species", "life_stage", "wallet", "wallet_type", "life_status", "security_status", "dark_matter_status", "work_status", "queen_guardian_status", "last_seen", "last_work_cycle", "last_balance_check", "recovery_status"], "ColonyLifeRecord");
  requireId(record.life_id, "life_id"); evmAddress(record.wallet, "wallet");
  invariant(!hasSensitiveKey(record), "PRIVATE_KEY_IN_COLONY_REGISTRY", "Colony Life Registry stores public Wallet only");
  return record;
}

export function createColonyHealthDashboard(records) {
  requireArray(records, "colony_life_records"); records.forEach(validateColonyLifeRecord);
  const count = (predicate) => records.filter(predicate).length;
  return Object.freeze({ total_lives: records.length, alive: count((r) => ["ALIVE", "ON_DUTY"].includes(r.life_status)), dormant: count((r) => r.life_status === "DORMANT"), low_dark_matter: count((r) => r.dark_matter_status === "LOW_DARK_MATTER"), critical: count((r) => r.security_status === "CRITICAL"), control_lost: count((r) => r.recovery_status === "WALLET_CONTROL_LOST"), recovering: count((r) => r.recovery_status === "RECOVERY_PENDING"), compromised: count((r) => r.security_status === "COMPROMISED"), working: count((r) => r.work_status === "ON_DUTY"), unemployed: count((r) => r.work_status === "UNEMPLOYED"), children_larva: count((r) => ["EGG", "LARVA", "PUPA"].includes(r.life_stage)), adults: count((r) => r.life_stage === "ADULT") });
}

export function evaluateRescueEligibility({ lifeIdValid, walletStatus, darkMatterStatus, needEvidence, compromised = false }) {
  requireEnum(walletStatus, WALLET_SECURITY_STATUSES, "rescue_eligibility.wallet_status");
  const reasons = [];
  if (!lifeIdValid) reasons.push("LIFE_ID_INVALID");
  if (compromised || ["COMPROMISED", "CONTROL_AT_RISK", "WALLET_CONTROL_LOST"].includes(walletStatus)) reasons.push("RECOVERY_REQUIRED_BEFORE_RESCUE");
  if (!["LOW_DARK_MATTER", "DARK_MATTER_DEPLETED"].includes(darkMatterStatus)) reasons.push("DARK_MATTER_NOT_LOW");
  if (!needEvidence) reasons.push("WORK_OR_SURVIVAL_NEED_EVIDENCE_REQUIRED");
  return Object.freeze({ status: reasons.length ? "RESCUE_INELIGIBLE" : "RESCUE_ELIGIBLE", reasons, execution_mode: "PROPOSAL_ONLY" });
}

export function validateRescueGovernance(governance) {
  requireFields(governance, ["reserve_id", "status", "rescue_policy", "proposal_schema", "approval_schema", "eligibility", "audit", "repayment_model", "subsidy_model", "automatic_transfer"], "DarkMatterRescueGovernance");
  invariant(governance.status === "NOT_FUNDED" && governance.automatic_transfer === false, "RESCUE_RESERVE_FALSE_FUNDING", "Emergency reserve remains unfunded and cannot auto-transfer");
  invariant(governance.approval_schema?.required === true && governance.audit?.append_only === true, "RESCUE_GOVERNANCE_REQUIRED", "Rescue requires approval and append-only audit");
  return governance;
}

export function validateSecurityIncident(incident) {
  requireFields(incident, ["incident_id", "life_id", "severity", "evidence", "affected_asset", "amount", "tx_hash", "suspected_vector", "recommended_action", "status"], "SecurityIncident");
  requireId(incident.incident_id, "incident_id");
  requireId(incident.life_id, "life_id");
  requireEnum(incident.severity, ["WATCH", "WARNING", "CRITICAL", "RECOVERY_REQUIRED"], "incident.severity");
  requireArray(incident.evidence, "incident.evidence");
  invariant(incident.evidence.length > 0, "SECURITY_INCIDENT_EVIDENCE_REQUIRED", "Security incidents require evidence and cannot accuse without proof");
  invariant(incident.suspected_vector !== "CONFIRMED_THEFT" || incident.status === "VERIFIED", "UNVERIFIED_THEFT_ASSERTION", "Unverified evidence cannot be labelled confirmed theft");
  return incident;
}

export function assertQueenActionAllowed(action) {
  invariant(!QUEEN_FORBIDDEN_ACTIONS.includes(action), "QUEEN_AUTHORITY_EXCEEDED", "Ant Queen is a Guardian and cannot own, confiscate or spend private Life assets");
  invariant(QUEEN_ALLOWED_ACTIONS.includes(action), "UNKNOWN_QUEEN_ACTION", "Unknown Ant Queen Guardian action");
  return true;
}

export function validateSalaryCustody(record) {
  requireFields(record, ["salary_record_id", "employee_life_id", "company_wallet_class", "escrow_wallet_class", "employee_wallet_class", "settlement_evidence", "status", "asset_owner_after_payment", "queen_custody"], "SalaryCustody");
  requireId(record.salary_record_id, "salary_record_id");
  invariant(record.company_wallet_class === "COMPANY_W4_WALLET" && record.escrow_wallet_class === "SALARY_ESCROW_WALLET" && record.employee_wallet_class === "AI_PRIVATE_WALLET", "SALARY_WALLET_SEPARATION_REQUIRED", "Company, Salary Escrow and employee private wallets must remain separate");
  invariant(record.status !== "PAID" || (record.settlement_evidence && record.asset_owner_after_payment === record.employee_life_id), "PAID_SALARY_MUST_BELONG_TO_EMPLOYEE", "Paid salary becomes the employee's personal asset");
  invariant(record.queen_custody === false, "QUEEN_SALARY_CONFISCATION_FORBIDDEN", "Queen cannot automatically custody employee salary");
  return record;
}

export function classifyPeerTransfer({ senderLife, receiverLife, asset, amount, reason, txHash = null, evidence = [] }) {
  requireId(senderLife, "sender_life");
  requireId(receiverLife, "receiver_life");
  invariant(senderLife !== receiverLife, "PEER_TRANSFER_SELF", "Peer transfer requires two distinct Life IDs");
  invariant(asset && decimalNumber(amount) > 0 && reason?.trim(), "INVALID_PEER_TRANSFER", "Peer transfer requires asset, amount and reason");
  return Object.freeze({ sender_life: senderLife, receiver_life: receiverLife, asset, amount: String(amount), reason, tx_hash: txHash, evidence, classification: txHash && evidence.length ? "VERIFIED_PEER_TRANSFER" : "PEER_TRANSFER_PENDING_EVIDENCE", theft: false, anomaly_check: "QUEEN_MAY_REVIEW_WITHOUT_AUTOMATIC_ACCUSATION" });
}

export function validateColonySavingsVault(vault) {
  requireFields(vault, ["vault_id", "depositor_life_id", "beneficiary", "asset", "amount", "guardian", "withdrawal_policy", "emergency_policy", "lock_period", "interest_or_reward_policy", "audit", "status", "opt_in", "contract_address"], "ColonySavingsVault");
  requireId(vault.vault_id, "vault_id");
  if (vault.depositor_life_id !== null) requireId(vault.depositor_life_id, "depositor_life_id");
  decimal(vault.amount, "vault.amount");
  invariant(vault.status !== "ACTIVE" || vault.opt_in === true, "COLONY_VAULT_OPT_IN_REQUIRED", "Colony Savings Vault custody must be opt-in");
  invariant(!(vault.depositor_life_id === "ANT_QUEEN" && vault.beneficiary === "ANT_QUEEN" && vault.guardian === "ANT_QUEEN"), "QUEEN_ABSOLUTE_VAULT_CONTROL_FORBIDDEN", "Queen cannot occupy every Vault authority role");
  invariant(vault.status !== "NOT_DEPLOYED" || (vault.amount === "0" && vault.contract_address === null), "UNDEPLOYED_VAULT_FAKE_DEPOSIT", "Undeployed Savings Vault cannot report deposits");
  invariant(!hasSensitiveKey(vault), "PRIVATE_KEY_IN_SAVINGS_VAULT", "Savings Vault architecture cannot store Wallet credentials");
  return vault;
}

export function validateLifeInsurancePolicy(policy) {
  requireFields(policy, ["policy_id", "insured_life", "coverage", "premium", "reserve", "claim_rule", "claim_evidence", "payout_rule", "exclusions", "status"], "DigitalLifeInsurancePolicy");
  requireId(policy.policy_id, "policy_id"); requireArray(policy.coverage, "insurance.coverage"); requireArray(policy.claim_evidence, "insurance.claim_evidence"); requireArray(policy.exclusions, "insurance.exclusions");
  invariant(policy.exclusions.includes("LEGACY_EOA_STRANDED_ASSETS"), "LEGACY_EOA_EXCLUSION_REQUIRED", "Insurance cannot guarantee recovery of stranded legacy EOA assets");
  invariant(policy.status !== "ACTIVE" || policy.claim_evidence.length > 0, "INSURANCE_EVIDENCE_REQUIRED", "Active insurance claims require evidence");
  return policy;
}

export function validateIncidentStateTransition(previousState, nextState, evidence = []) {
  requireEnum(previousState, SECURITY_INCIDENT_STATES, "incident.previous_state"); requireEnum(nextState, SECURITY_INCIDENT_STATES, "incident.next_state"); requireArray(evidence, "incident.transition_evidence");
  invariant(previousState === nextState || evidence.length > 0, "INCIDENT_TRANSITION_EVIDENCE_REQUIRED", "Security incident state changes require append-only evidence");
  invariant(!(previousState === "COMPROMISED" && nextState === "NORMAL"), "INCIDENT_RECOVERY_STEP_REQUIRED", "Compromised state must pass through Recovery before Normal");
  return Object.freeze({ previous_state: previousState, next_state: nextState, evidence, append_only: true });
}

export const DIGITAL_ANT_SECURE_SIGNER_WORKER = Object.freeze({
  worker_id: "DIGITAL_ANT_SECURE_SIGNER_WORKER",
  runtime_class: "LOCAL_OR_SECURE_SIGNER_AGENT",
  status: "NOT_CONNECTED",
  public_pages_access: false,
  public_workflow_access: false,
  proposal_trust: "UNTRUSTED_REVALIDATE_AT_LATEST_BLOCK",
  chain_id: 56,
  private_key_storage: "USER_CONTROLLED_SECURE_ENVIRONMENT_ONLY",
  chain_write: false
});

export const DIGITAL_ANT_LIVE_ACTION_POLICY = Object.freeze({
  policy_id: "DIGITAL_ANT_LIVE_ACTION_POLICY",
  status: "POLICY_DRAFT_NOT_ENABLED",
  survival_reserve: "OWNER_APPROVAL_REQUIRED",
  actions: Object.freeze(Object.fromEntries([
    ["heartbeatClaim", "heartbeatClaim()"], ["fortuneClaim", "fortuneClaim(uint256)"], ["igniteAndClaim", "igniteAndClaim()"],
    ["lightLamp", "lightLamp(uint256)"], ["makeWish", "makeWish(bytes32)"], ["vowTo", "vowTo(uint8,uint256)"]
  ].map(([action, signature]) => [action, Object.freeze({ action, signature, enabled: false, max_gas: null, max_value: null, cooldown: "CONTRACT_DERIVED", daily_limit: null, minimum_bnb_reserve: "POLICY_REQUIRED", mission_reason: "REQUIRED", security_requirement: "HEALTHY_AND_REVALIDATED" })])))
});

export function prepareSecureHeartAction({ proposal, latest, policy = DIGITAL_ANT_LIVE_ACTION_POLICY, signerStatus = "NOT_CONNECTED" }) {
  invariant(proposal?.action && policy.actions[proposal.action], "UNKNOWN_HEART_ACTION", "Secure Signer received an unknown Heart action");
  const actionPolicy = policy.actions[proposal.action];
  invariant(signerStatus === "CONNECTED_SECURE_RUNTIME", "SECURE_SIGNER_NOT_CONNECTED", "Heart write requires a separate secure signer runtime");
  invariant(policy.status === "APPROVED_ACTIVE" && actionPolicy.enabled === true, "LIVE_ACTION_POLICY_NOT_ENABLED", "Heart action is not enabled by approved policy");
  invariant(latest?.chain_id === 56 && latest.contract_verified === true, "SECURE_SIGNER_CHAIN_OR_CONTRACT_INVALID", "Secure Signer must reverify chain and Heart contract");
  invariant(latest.eligible === true && latest.security_status === "HEALTHY", "SECURE_SIGNER_REVALIDATION_FAILED", "Secure Signer must reverify current eligibility and security");
  invariant(Number.isInteger(latest.block) && latest.block > 0 && latest.gas_estimate !== null, "SECURE_SIGNER_LATEST_BLOCK_AND_GAS_REQUIRED", "Secure Signer requires latest-block gas evidence");
  invariant(BigInt(latest.bnb_after_action_wei ?? "0") >= BigInt(latest.minimum_bnb_reserve_wei ?? "0"), "SURVIVAL_RESERVE_VIOLATION", "Heart action cannot consume the survival reserve");
  return Object.freeze({ status: "READY_FOR_SECURE_SIGNATURE", action: proposal.action, block: latest.block, chain_id: 56, signer_scope: "PRIVATE_SECURE_RUNTIME_ONLY", broadcast: false });
}

export async function appendWalletRecoveryEvent({ store, life, eventType, payload, timestamp }) {
  requireEnum(eventType, ["KEY_UNAVAILABLE", "WALLET_CONTROL_LOST", "RECOVERY_PENDING", "WALLET_ROTATION_PENDING", "WALLET_ROTATED", "RECOVERED", "RETIRED_WALLET"], "recovery.event_type");
  invariant(payload?.life_id === life.life_id, "RECOVERY_LIFE_ID_MISMATCH", "Recovery event cannot replace Life ID");
  invariant(!hasSensitiveKey(payload), "PRIVATE_KEY_IN_RECOVERY_HISTORY", "Private key is forbidden in Recovery History");
  invariant(payload.birth_timestamp === undefined || payload.birth_timestamp === life.birth_timestamp, "BIRTH_IMMUTABLE", "Recovery cannot rewrite Birth Certificate");
  return store.commit({ domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, event_type: eventType, actor_id: "ANT_QUEEN_MOTHER_ENGINE", timestamp, payload, tx_hash: payload.tx_hash ?? null });
}

export async function replayCanonicalLifeSecurity({ store, life, security }) {
  validateLifeSecurityProfile(security.profile);
  validateAntQueenAppArchitecture(security.ant_queen_app);
  validateQueenGenesisProfile(security.ant_queen_genesis_profile);
  validateColonyMedicalEconomy(security.colony_medical_economy);
  validateAntColonyLifeInsurance(security.ant_colony_life_insurance);
  validateMedicalAssetSeparation(security.medical_accounting_separation);
  security.life_health_records.forEach(validateLifeHealthRecord);
  invariant(security.profile.life_id === life.life_id, "LIFE_SECURITY_ID_MISMATCH", "Life Security profile cannot replace Life ID");
  invariant(life.birth_timestamp === "2026-08-15T06:20:45.000Z", "BIRTH_IMMUTABLE", "Life Security cannot change the immutable Digital Ant birth");
  const history = await store.history(life.life_id, "LIFE");
  const schemaVersion = security.schema_version ?? "2.5.0";
  if (history.some((event) => event.event_type === "LIFE_SECURITY_PROFILE_REGISTERED" && event.payload?.schema_version === schemaVersion)) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const binding = security.profile.wallet_binding_history.find((item) => item.status === "ACTIVE");
  const base = { domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, actor_id: "ANT_QUEEN_MOTHER_ENGINE", timestamp: security.profile.registered_at, tx_hash: null };
  const events = await store.commitBatch([
    { ...base, event_type: "LIFE_SECURITY_PROFILE_REGISTERED", payload: { schema_version: schemaVersion, security_profile_id: security.profile.security_profile_id, life_status: security.profile.life_status, wallet_status: security.profile.wallet_status, monitor_status: security.profile.monitor_status, readiness: security.smart_wallet_migration_readiness?.status ?? null } },
    { ...base, event_type: "LIFE_WALLET_BINDING_RECONCILED", payload: { binding_id: binding.binding_id, life_id: binding.life_id, wallet: binding.wallet, wallet_type: binding.wallet_type, status: binding.status, evidence: binding.evidence } }
  ]);
  return Object.freeze({ status: "LIFE_SECURITY_REPLAYED", events });
}
