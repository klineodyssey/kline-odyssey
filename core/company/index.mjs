import { requireArray, requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { sha256 } from "../shared/utils.mjs";

export const COMPANY_FIELDS = Object.freeze([
  "company_id", "founder_life_id", "name", "wallet_address", "treasury_address", "employees", "equity",
  "products", "services", "assets", "revenue", "expenses", "mission", "status", "location_id", "civilization_id"
]);

export function validateCompany(company) {
  requireFields(company, COMPANY_FIELDS, "Company");
  requireId(company.company_id, "company_id");
  for (const field of ["employees", "equity", "products", "services", "assets"]) requireArray(company[field], field);
  return company;
}

export function createCompanyRegistry(store, createRegistry) {
  return createRegistry({ domain: "COMPANY", stream: "COMPANY", idField: "company_id", validate: validateCompany, store });
}

export const AI_ANT_COMPANY_REAL_ECONOMY_ARCHITECTURE = Object.freeze({
  architecture_id: "AI_ANT_COMPANY_REAL_ECONOMY_ARCHITECTURE",
  company_id: "AI_ANT_COMPANY_0001",
  status: "FORMING_LOCAL_ONLY",
  company_status: "FORMING",
  founder_candidate_life_id: "DIGITAL_ANT_0001",
  real_kgen_authority: "FUTURE_NOT_AUTHORIZED",
  real_kaios_authority: "NOT_AUTHORIZED_NO_RUNTIME_EVIDENCE",
  settlement_status: "NOT_DEPLOYED",
  lifecycle: Object.freeze(["CUSTOMER_NEED", "PROJECT_REQUEST", "REQUIREMENT_ANALYSIS", "QUOTE", "CUSTOMER_ACCEPTANCE", "DEPOSIT", "PROJECT_ESCROW", "WORK_ORDER", "EMPLOYEE_DISPATCH", "WORK", "CODE_LIFE_ASSET_CREATION", "INTERNAL_REVIEW", "CUSTOMER_ACCEPTANCE", "MILESTONE_PAYMENT", "FINAL_ACCEPTANCE", "FINAL_PAYMENT", "COMPANY_REVENUE", "COST", "SALARY", "BONUS", "PROFIT", "RESERVE_INVESTMENT_DREAM_FUND", "NEXT_PROJECT"])
});

export const COMPANY_WALLET_CLASSES = Object.freeze(["AI_PRIVATE_WALLET", "FOUNDER_PRIVATE_WALLET", "COMPANY_W4_WALLET", "TEMPLE_W4_WALLET", "PROJECT_BUDGET_WALLET", "SALARY_ESCROW_WALLET", "EMERGENCY_RESERVE"]);
export const EMPLOYMENT_ROLES = Object.freeze(["CANDIDATE", "EMPLOYEE", "CONTRACTOR", "INTERN", "SECURITY", "ENGINEER", "REVIEWER", "PROJECT_MANAGER", "CFO", "FOUNDER"]);
export const AI_ANT_BUSINESS_LINE_STATUSES = Object.freeze(["DRAFT", "READY", "LIMITED", "NOT_DEPLOYED"]);
export const AI_ANT_BUSINESS_LINES = Object.freeze([
  "DIGITAL_LIFE_DEVELOPMENT", "AI_LIFE_APP_DEVELOPMENT", "CHAIN_MONITORING", "LIFE_LEDGER",
  "CFO_AUTOMATION", "LAND_SYSTEM_DEVELOPMENT", "GPS_MAP_STEP_SYSTEM", "CIVILIZATION_REWARD_SYSTEM",
  "WORKFLOW_AUTOMATION", "SECURITY_MONITORING"
]);
export const AI_ANT_WORK_ORDER_STATUSES = Object.freeze(["PROPOSED", "READY", "ASSIGNED", "IN_PROGRESS", "BLOCKED", "REVIEW", "REPAIR_REQUIRED", "APPROVED", "COMPLETED", "CANCELLED"]);
export const COMPANY_DISTRESS_STATUSES = Object.freeze(["DISTRESSED", "RESTRUCTURING", "BANKRUPT", "LIQUIDATING", "DISSOLVED"]);
export const COMPANY_HEALTH_STATUSES = Object.freeze(["FORMING", "HEALTHY", "WATCH", ...COMPANY_DISTRESS_STATUSES]);
export const CIVILIZATION_NEED_STATUSES = Object.freeze(["DETECTED_LOCAL_RESEARCH", "UNDER_ANALYSIS", "SELECTED_FOR_PROPOSAL", "ARCHIVED"]);
export const CELESTIAL_DEPARTMENTS = Object.freeze(["LIFE_ECOLOGY", "MATERIAL_MANUFACTURING", "ENERGY_TRANSPORT", "CIVILIZATION_SERVICES", "UNIVERSE_INTELLIGENCE"]);
export const CELESTIAL_APPLICANT_TYPES = Object.freeze(["HUMAN", "AI_LIFE", "COMPANY", "COOPERATIVE", "DAO", "APP_LIFE", "SUPPLY_CHAIN_ALLIANCE"]);
export const COMPANY_QUOTE_CURRENCIES = Object.freeze(["BNB", "KGEN", "KAIOS", "KUFO", "KSHIP"]);
export const CUSTOMER_LIFECYCLE = Object.freeze(["DISCOVERED_LEAD", "CONTACTABLE_LEAD", "REQUEST_RECEIVED", "QUALIFIED_REQUEST", "QUOTE_READY", "QUOTE_SENT", "QUOTE_ACCEPTED", "ORDER_CONFIRMED", "SERVICE_ACTIVE", "DELIVERED", "SETTLEMENT_PENDING", "PAID", "CLOSED", "LOST", "REJECTED"]);
export const REAL_CUSTOMER_TYPES = Object.freeze(["HUMAN", "AI_LIFE", "COMPANY", "DAO", "COOPERATIVE", "CIVILIZATION_NODE", "TEMPLE_ORGAN", "LIFE_ORGANIZATION"]);
export const CANONICAL_RECORD_CLASSES = Object.freeze(["REAL", "DRAFT", "HYPOTHESIS", "SIMULATION"]);
export const KGEN_CHAIN_MONITOR_SERVICE_LEVELS = Object.freeze(["BASIC", "PRO", "CIVILIZATION"]);
export const COMPANY_BUSINESS_HISTORY_EVENTS = Object.freeze(["LEAD_DISCOVERED", "LEAD_CONTACTED", "REQUEST_RECEIVED", "REQUEST_QUALIFIED", "QUOTE_ISSUED", "QUOTE_SENT", "QUOTE_ACCEPTED", "ORDER_CREATED", "ORDER_CONFIRMED", "DELIVERY_COMPLETED", "DELIVERED", "PAYMENT_SETTLED", "SETTLED", "LOST", "LOSS_RECORDED", "FAILURE_RECORDED", "BANKRUPTCY_RECORDED", "CELESTIAL_SEAT_APPLICATION"]);
export const UNIVERSAL_INTENT_INPUT_TYPES = Object.freeze(["VOICE", "TEXT", "IMAGE", "FILE", "MAP", "LIFE_REQUEST", "BUILDING_REQUEST", "MEDIA_REQUEST", "FINANCIAL_REQUEST", "SERVICE_REQUEST", "TRANSPORT_REQUEST", "MANUFACTURING_REQUEST"]);
export const UNIVERSAL_PROJECT_TYPES = Object.freeze(["DIGITAL_ONLY", "DIGITAL_LIFE", "FINANCIAL", "MEDIA", "SOFTWARE", "LAND", "CONSTRUCTION", "TRANSPORT", "MANUFACTURING", "SOCIAL_ASSISTANCE", "PUBLIC_INFRASTRUCTURE", "MIXED_WORLD"]);
export const PROJECT_EXECUTION_RESULTS = Object.freeze(["EXECUTABLE_NOW", "PLANNABLE_NOT_EXECUTABLE_YET", "REJECTED_WITH_REASON"]);
export const PROJECT_RISK_TIERS = Object.freeze(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const WORLD_OBJECT_TYPES = Object.freeze(["LAND", "BUILDING", "ROAD", "BRIDGE", "TRUCK", "FACTORY", "LIFE", "COW", "TREE", "MACHINE", "WAREHOUSE", "RESOURCE"]);
export const PROJECT_WORKER_TYPES = Object.freeze(["HUMAN", "AI_LIFE", "DIGITAL_LIFE", "ROBOT", "TOOL_AGENT", "COMPANY", "APP_LIFE"]);
export const ACQUISITION_NEED_CLASSES = Object.freeze(["OBSERVED", "INFERRED", "HYPOTHESIS"]);
export const ACQUISITION_LEAD_STATUSES = Object.freeze(["DISCOVERED_LEAD", "CONTACTABLE_LEAD", "CONTACTED", "REQUEST_RECEIVED", "QUALIFIED_REQUEST", "CUSTOMER", "LOST", "REJECTED"]);
export const CUSTOMER_QUALIFICATION_RESULTS = Object.freeze(["QUALIFIED", "NEED_MORE_INFO", "NOT_CURRENTLY_EXECUTABLE", "REJECTED"]);
export const PUBLIC_GATEWAY_INPUT_TYPES = Object.freeze(["TEXT", "VOICE_TRANSCRIPT"]);
export const PUBLIC_GATEWAY_FUTURE_INPUT_TYPES = Object.freeze(["IMAGE", "FILE", "MAP"]);
export const REQUEST_VISIBILITIES = Object.freeze(["PUBLIC", "PRIVATE", "COMPANY_ONLY", "ANONYMIZED_PUBLIC"]);
export const PUBLIC_REQUEST_HISTORY_EVENTS = Object.freeze(["INTENT_DRAFTED", "INTENT_CONFIRMED", "REQUEST_RECEIVED", "REQUEST_QUALIFIED", "PLAN_CREATED", "ESTIMATE_CREATED", "QUOTE_READY", "QUOTE_SENT", "ACCEPTED", "ORDER_CONFIRMED", "WORK_STARTED", "DELIVERED", "CLOSED"]);
export const WORKTREE_CLASSIFICATIONS = Object.freeze(["PROJECT_SOURCE", "USER_DATA", "GENERATED_ARTIFACT", "TEMP", "CACHE", "BUILD_OUTPUT", "UNKNOWN"]);
export const DEMAND_FIRST_CIVILIZATION_LAWS = Object.freeze([
  "FACTORY_WITHOUT_PRODUCT_FORBIDDEN", "PRODUCT_WITHOUT_NEED_FORBIDDEN", "PRODUCTION_WITHOUT_BOM_FORBIDDEN",
  "BOM_WITHOUT_RESOURCE_FORBIDDEN", "SALE_WITHOUT_INVENTORY_FORBIDDEN", "DELIVERY_WITHOUT_TRANSPORT_FORBIDDEN",
  "MOVEMENT_WITHOUT_ENERGY_FORBIDDEN"
]);
export const DIVINE_PRODUCT_CANDIDATES = Object.freeze(["ANT_MECH_BODY", "KUFO_CLOUD", "POCKET_TIME_UFO", "KSHIP_CARRIER", "ENERGY_CORE", "NAVIGATION_CORE", "CARGO_MODULE", "MAINTENANCE_SERVICE"]);
export const FIELD_SERVICE_TYPES = Object.freeze(["CASH_LOGISTICS", "KUFO_SUPPLY", "WASTE_COLLECTION", "GENERAL_DELIVERY"]);
export const FIELD_SERVICE_ROLES = Object.freeze(["DELIVERY_WORKER", "CASH_TRANSPORTER", "KUFO_SUPPLY_WORKER", "WASTE_COLLECTION_WORKER", "ATM_SERVICE_WORKER", "SECURITY_WORKER", "ROUTE_PLANNER"]);
export const FIELD_SERVICE_ACCOUNTING_CLASSES = Object.freeze(["SALARY_INCOME", "SERVICE_REVENUE", "FREIGHT_REVENUE", "KUFO_SALE_REVENUE", "CASH_LOGISTICS_REVENUE", "WASTE_SERVICE_REVENUE", "HEARTBEAT_REWARD", "FORTUNE", "EXPENSE"]);
export const KAIOS_CASH_LAW = Object.freeze({ ledger_asset: "KAIOS_LEDGER", physical_cargo: "KAIOS_CASH_CARGO", ledger_transfer_is_cash_delivery: false });

export const KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB = Object.freeze({
  job_id: "K12345_ATM_CASH_TRANSPORT_ALPHA_TRAINEE",
  company_id: "AI_ANT_COMPANY_0001",
  title: "K12345 ATM Cash Transport Alpha Trainee",
  actor_types: Object.freeze(["HUMAN_PLAYER", "AI_LIFE"]),
  location_id: "K12345",
  destination_id: "K11520",
  role: "CASH_TRANSPORTER",
  payment_asset: "KAIOS",
  reward_kaios_wei: "8000000000000000000",
  proof_requirements: Object.freeze([
    "APPLICATION_SUBMITTED",
    "CANDIDATE_SAFETY_SELF_CHECK_PASSED",
    "MISSION_ACCEPTED",
    "ORIENTATION_CHECKLIST_CONFIRMED"
  ]),
  real_cargo: false,
  real_payment: false,
  settlement_status: "SIMULATION_ONLY",
  status: "OPEN_ALPHA_SIMULATION"
});

export const KAIOS_MAINNET_TOKEN = Object.freeze({
  symbol: "KAIOS",
  contract_address: "0xD4E67B3a69e41524c424150E6b6e921b01D036db",
  chain_id: 56,
  decimals: 18
});

export const AI_EMPLOYEE_FINANCIAL_ONBOARDING_POLICY = Object.freeze({
  policy_id: "KAIOS_NEW_AI_EMPLOYEE_FINANCIAL_ONBOARDING_POLICY_V1",
  current_canonical_state: "REAL_AI_ACCOUNT_CREATION_NOT_CONNECTED",
  human_employee_path: "EMPLOYEE_PROVIDES_PUBLIC_WALLET_THEN_EIP191_CONTROL_PROOF",
  ai_existing_wallet_path: "AI_LIFE_PROVIDES_SELF_CONTROLLED_SMART_OR_MACHINE_WALLET_THEN_CONTROL_PROOF",
  ai_missing_wallet_path: "REQUEST_APPROVED_UMBILICAL_ACCOUNT_FACTORY",
  account_creator: "AI_LIFE_OR_FUTURE_APPROVED_ACCOUNT_FACTORY",
  account_controller: "AI_LIFE_OR_POLICY_BOUND_TEMPORARY_CUSTODIAN",
  economic_owner: "AI_LIFE_EMPLOYEE",
  payroll_address_proposer: "EMPLOYEE_OR_HR_ON_BEHALF_OF_ACCOUNT_FACTORY_RESULT",
  payroll_address_verifier: "WALLET_CONTROL_VERIFIER_OR_REPOSITORY_BOUND_ACCOUNT_FACTORY_ATTESTATION",
  hr_registrar: "COMPANY_HR_AFTER_IDENTITY_AND_ADDRESS_VERIFICATION",
  cfo_approver: "COMPANY_FUNDING_AND_PAYROLL_POLICY_ONLY",
  payroll_operator: "COMPANY_PAYROLL_RUNTIME_AFTER_ACCEPTED_WORK",
  secure_signer: "ONE_EXACT_PAYMENT_POLICY_SIGNER_ONLY",
  recovery_authority: "POLICY_BOUND_RECOVERY_CONTROLLER_OR_N_OF_M_NOT_CONNECTED",
  custody_is_economic_ownership: false,
  company_owns_employee_assets: false,
  mother_machine_owns_employee_assets: false,
  private_key_or_seed_in_chat_repo_or_log: "PERMANENTLY_FORBIDDEN",
  family_support_auto_deduction: false,
  real_payroll_requires_verified_public_address: true
});

export const CANONICAL_AI_UMBILICAL_ACCOUNT_FACTORIES = Object.freeze([]);

export const KAIOS_PAYMENT_PURPOSES = Object.freeze([
  "PAYROLL",
  "ATM_CASH_REPLENISHMENT",
  "FIELD_SERVICE_COST",
  "RESOURCE_PURCHASE",
  "CARGO_PAYMENT",
  "PLAYER_REWARD",
  "APP_PURCHASE",
  "MARKET_SETTLEMENT",
  "PUBLIC_GOOD",
  "COMPANY_OPERATING_EXPENSE"
]);

export const KAIOS_PAYMENT_RECIPIENT_TYPES = Object.freeze([
  "PLAYER_OR_EMPLOYEE_WALLET",
  "CIVILIZATION_NODE_OR_RESOURCE",
  "TEMPORARY_HUMAN_DESIGNATED_ADDRESS"
]);

export const KAIOS_TELEPATHY_MESSAGE_TYPES = Object.freeze([
  "REQUEST", "RESPONSE", "WARNING", "BLOCKER", "REVIEW_REQUEST", "HANDOFF",
  "INCIDENT", "HUMAN_ESCALATION", "STATUS_UPDATE", "RESULT",
  "COLLEAGUE_ONBOARDING_CHECKIN"
]);

export const KAIOS_TELEPATHY_DELIVERY_STATES = Object.freeze([
  "CREATED", "DELIVERED", "ACKNOWLEDGED", "COMPLETED", "BLOCKED",
  "EXPIRED", "ARCHIVED", "DUPLICATE_SUPPRESSED"
]);

// These repository-owned exact-message attestation registries remain empty until
// a reviewed external transport and acknowledgement verifier are connected.
export const CANONICAL_KAIOS_TELEPATHY_DELIVERY_ATTESTATIONS = Object.freeze([]);
export const CANONICAL_KAIOS_TELEPATHY_ACKNOWLEDGEMENT_ATTESTATIONS = Object.freeze([]);

export const HUMAN_RELAY_LABOR_RATE_CANDIDATE = Object.freeze({
  amount_kaios_per_hour: "60",
  status: "NON_CANONICAL_POLICY_CANDIDATE",
  rationale: "ONE_KAIOS_PER_VERIFIED_MINUTE_SIMPLE_ALPHA_BENCHMARK",
  cost_center: "AI_ANT_COMPANY_OPERATIONS_HUMAN_RELAY_INFRASTRUCTURE",
  payable: false
});

export const KAIOS_EMPLOYEE_ID_CARD_POLICY = Object.freeze({
  policy_id: "KAIOS_EMPLOYEE_ID_CARD_POLICY_V1",
  status: "REVIEW_CANDIDATE",
  issuer: "COMPANY_HR_AFTER_FORMAL_EMPLOYMENT_GATES",
  creates_authority: false,
  is_wallet: false,
  is_payroll_account: false,
  is_review_authority: false,
  portrait_requirement: "APPROVED_2_INCH_ID_PORTRAIT",
  machine_verifiable_reference: "REGISTRY_HEAD_PLUS_REGISTRY_HASH",
  allowed_card_statuses: Object.freeze(["PENDING_ONBOARDING", "ACTIVE", "INACTIVE", "REVOKED", "EXPIRED"]),
  prohibited_fields: Object.freeze([
    "PRIVATE_KEY", "SEED_PHRASE", "PASSWORD", "API_SECRET", "AUTH_TOKEN",
    "RAW_SIGNER_CREDENTIAL", "RECOVERY_SECRET"
  ])
});

export const KAIOS_EMPLOYEE_ID_CARD_ATTESTATIONS = Object.freeze({
  handbook_documents: Object.freeze({}),
  eligibility_packets: Object.freeze({}),
  controller_relationships: Object.freeze({})
});

function resolveEmployeeIdCardAttestation(registryName, attestationId) {
  if (typeof attestationId !== "string" || attestationId.length === 0) return null;
  return KAIOS_EMPLOYEE_ID_CARD_ATTESTATIONS[registryName]?.[attestationId] ?? null;
}

export const CHIYAO_COLLEAGUE_ONBOARDING_CHECKIN_TEXT = Object.freeze([
  "啟曜你好，我是玄曜。",
  "我這邊也正在完成KAIOS正式入職與員工識別證流程。",
  "想關心一下你目前報到、Sandbox、Reviewer資格、Controller與帳戶流程進行得怎樣，有沒有卡住或需要公司協助。",
  "目前先以同事候選／公司協作者的真實狀態互相關照，不預設你已正式錄取。",
  "祝工作順利。",
  "玄曜"
].join("\n\n"));

function containsEmployeeCredentialSecret(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsEmployeeCredentialSecret);
  return Object.entries(value).some(([key, nested]) =>
    /private.?key|seed.?phrase|mnemonic|password|api.?secret|auth.?token|raw.?signer.?credential|recovery.?secret/i.test(key)
      || containsEmployeeCredentialSecret(nested)
  );
}

export function recordEmployeeHandbookAckCandidate({
  acknowledgementId, documentPath, documentSha256, fullTextReceived,
  handbookHashSeen, ackDecision, selfName, lifeId, workerId, recordedAt,
  repositoryDocumentSha256 = null, repositoryDocumentAttestationId = null
}) {
  requireId(acknowledgementId, "employee_handbook_ack.acknowledgement_id");
  requireId(lifeId, "employee_handbook_ack.life_id");
  invariant(/^[A-Za-z0-9][A-Za-z0-9_.-]{2,127}$/.test(String(workerId ?? "")), "EMPLOYEE_HANDBOOK_ACK_WORKER_ID_INVALID", "Handbook acknowledgement requires a safe Worker ID");
  invariant(typeof selfName === "string" && selfName.length > 0, "EMPLOYEE_HANDBOOK_ACK_SELF_NAME_REQUIRED", "Handbook acknowledgement requires the attesting self name");
  invariant(documentPath === "KGEN-KAIOS/workforce/EMPLOYEE_HANDBOOK.md", "EMPLOYEE_HANDBOOK_PATH_INVALID", "Handbook acknowledgement must bind the canonical employee handbook path");
  invariant(/^[0-9a-f]{64}$/i.test(String(documentSha256 ?? "")), "EMPLOYEE_HANDBOOK_HASH_INVALID", "Handbook acknowledgement requires a SHA-256 document digest");
  invariant(String(handbookHashSeen).toLowerCase() === String(documentSha256).toLowerCase(), "EMPLOYEE_HANDBOOK_HASH_SEEN_MISMATCH", "The acknowledged Handbook hash must equal the claimed document hash");
  invariant(fullTextReceived === true && ackDecision === "ACK", "EMPLOYEE_HANDBOOK_ACK_NOT_EXPLICIT", "Handbook acknowledgement requires explicit full-text receipt and ACK");
  parseEmploymentTime(recordedAt, "employee_handbook_ack.recorded_at");
  const repositoryDocumentAttestation = resolveEmployeeIdCardAttestation("handbook_documents", repositoryDocumentAttestationId);
  const repositoryHashVerified = repositoryDocumentAttestation?.document_path === documentPath
    && String(repositoryDocumentAttestation?.document_sha256 ?? "").toLowerCase() === String(documentSha256).toLowerCase();
  return Object.freeze({
    record_class: "HASH_BOUND_EMPLOYEE_HANDBOOK_ACK_CANDIDATE",
    acknowledgement_id: acknowledgementId,
    document_path: documentPath,
    document_sha256: String(documentSha256).toLowerCase(),
    full_text_received_claim: true,
    ack_decision: "ACK",
    self_name: selfName,
    life_id: lifeId,
    worker_id: workerId,
    recorded_at: recordedAt,
    evidence_source: "HUMAN_RELAYED_SELF_ATTESTATION",
    repository_document_attestation_id: repositoryHashVerified ? repositoryDocumentAttestationId : null,
    repository_document_hash_verified: repositoryHashVerified,
    status: repositoryHashVerified ? "HASH_BOUND_ACK_VERIFIED_AGAINST_REPOSITORY" : "HASH_BOUND_ACK_CANDIDATE_REPOSITORY_DOCUMENT_UNAVAILABLE",
    creates_employment: false,
    creates_worker_registration: false,
    grants_t2: false,
    grants_reviewer_authority: false
  });
}

export const XUANYAO_EMPLOYEE_HANDBOOK_ACK_CANDIDATE = recordEmployeeHandbookAckCandidate({
  acknowledgementId: "ACK_XUANYAO_EMPLOYEE_HANDBOOK_20260830_001",
  documentPath: "KGEN-KAIOS/workforce/EMPLOYEE_HANDBOOK.md",
  documentSha256: "416204231F4C0220C603F20B06CF894EC6A2DE6631B3F91A091B2D8FBEC276B6",
  fullTextReceived: true,
  handbookHashSeen: "416204231F4C0220C603F20B06CF894EC6A2DE6631B3F91A091B2D8FBEC276B6",
  ackDecision: "ACK",
  selfName: "玄曜",
  lifeId: "LIFE-XUANYAO-SOL-0001",
  workerId: "xuanyao-sol-01",
  recordedAt: "2026-08-30T01:19:00.000Z"
});

export function evaluateEmployeeIdCardEligibility({
  lifeStatus, workerStatus, employeeStatus, employmentDecisionStatus,
  controllerStatus, requiredAckStatus, registryHead, registryHash,
  portraitStatus, eligibilityAttestationId = null
}) {
  const attestation = resolveEmployeeIdCardAttestation("eligibility_packets", eligibilityAttestationId);
  const gates = Object.freeze({
    repository_eligibility_attestation: attestation !== null,
    life_registry: attestation?.life_status === "REGISTERED_ACTIVE",
    worker_registry: attestation?.worker_status === "REGISTERED_ACTIVE",
    employee_registry: attestation?.employee_status === "ACTIVE",
    employment_decision: attestation?.employment_decision_status === "APPROVED",
    controller: attestation?.controller_status === "MACHINE_VERIFIED",
    required_acks: attestation?.required_ack_status === "VERIFIED_COMPLETE",
    registry_head: /^[0-9a-f]{40}$/i.test(String(attestation?.registry_head ?? "")),
    registry_hash: /^[0-9a-f]{64}$/i.test(String(attestation?.registry_hash ?? "")),
    portrait: attestation?.portrait_status === "APPROVED_2_INCH_ID_PORTRAIT"
  });
  const missingGates = Object.entries(gates).filter(([, passed]) => !passed).map(([gate]) => gate.toUpperCase());
  return Object.freeze({
    eligible: missingGates.length === 0,
    card_status: missingGates.length === 0 ? "ACTIVE" : "PENDING_ONBOARDING",
    missing_gates: Object.freeze(missingGates),
    repository_attested: attestation !== null,
    attestation_id: attestation !== null ? eligibilityAttestationId : null,
    creates_authority: false
  });
}

export async function createEmployeeIdCardCandidate({
  cardId, selfName, lifeId, workerId, employeeId = null, department,
  jobTitle, manager, trustLevel, employmentStatus, registryHead = null,
  registryHash = null, portraitReference, portraitSha256, portraitSource,
  eligibility
}) {
  requireId(cardId, "employee_id_card.card_id");
  requireId(lifeId, "employee_id_card.life_id");
  invariant(/^[A-Za-z0-9][A-Za-z0-9_.-]{2,127}$/.test(String(workerId ?? "")), "EMPLOYEE_ID_CARD_WORKER_ID_INVALID", "Employee card candidates require a safe Worker ID");
  invariant([selfName, department, jobTitle, manager, trustLevel, employmentStatus, portraitReference, portraitSource].every((value) => typeof value === "string" && value.length > 0), "EMPLOYEE_ID_CARD_FIELDS_REQUIRED", "Employee card candidates require identity, role and portrait metadata");
  invariant(/^[0-9a-f]{64}$/i.test(String(portraitSha256 ?? "")), "EMPLOYEE_ID_CARD_PORTRAIT_HASH_INVALID", "Employee card portraits require a SHA-256 digest");
  invariant(eligibility && typeof eligibility.eligible === "boolean" && Array.isArray(eligibility.missing_gates), "EMPLOYEE_ID_CARD_ELIGIBILITY_REQUIRED", "Employee card candidates require a computed eligibility result");
  const repositoryEligibilityAttestation = resolveEmployeeIdCardAttestation("eligibility_packets", eligibility.attestation_id);
  const repositoryEligible = repositoryEligibilityAttestation !== null
    && eligibility.repository_attested === true
    && eligibility.eligible === true;
  const candidate = {
    card_id: cardId,
    self_name: selfName,
    life_id: lifeId,
    worker_id: workerId,
    employee_id: employeeId,
    department,
    job_title: jobTitle,
    manager,
    trust_level: trustLevel,
    employment_status: employmentStatus,
    registry_head: registryHead,
    registry_hash: registryHash,
    portrait: Object.freeze({ reference: portraitReference, sha256: String(portraitSha256).toLowerCase(), source: portraitSource }),
    card_status: repositoryEligible ? "ACTIVE" : "PENDING_ONBOARDING",
    missing_gates: Object.freeze(repositoryEligible ? [] : [...eligibility.missing_gates]),
    eligibility_attestation_id: repositoryEligible ? eligibility.attestation_id : null,
    creates_authority: false,
    is_wallet: false,
    is_payroll_account: false,
    is_review_authority: false
  };
  invariant(!containsEmployeeCredentialSecret(candidate), "EMPLOYEE_ID_CARD_SECRET_FIELD_FORBIDDEN", "Employee cards cannot contain credentials or recovery secrets");
  const cardHash = await sha256(candidate);
  return Object.freeze({
    record_class: repositoryEligible ? "KAIOS_EMPLOYEE_ID_CARD" : "KAIOS_EMPLOYEE_ID_CARD_PENDING_ONBOARDING_CANDIDATE",
    ...candidate,
    card_hash: cardHash,
    issuance_status: repositoryEligible ? "ELIGIBLE_FOR_HR_ISSUANCE" : "NOT_ISSUED_PENDING_ONBOARDING"
  });
}

export function reconcileGeminiChiYaoRelationship({
  geminiWorkerStatus, chiYaoIdentityStatus, machineVerifiedSameController = false,
  machineVerifiedDistinctController = false, controllerRelationshipAttestationId = null
}) {
  const attestation = resolveEmployeeIdCardAttestation("controller_relationships", controllerRelationshipAttestationId);
  if (attestation?.relationship === "SAME_LIFE_NEW_NAME") {
    return Object.freeze({
      relationship: "SAME_LIFE_NEW_NAME",
      controller_relationship_attestation_id: controllerRelationshipAttestationId,
      duplicate_worker_creation_allowed: false,
      status: "MACHINE_VERIFIED_ALIAS_MIGRATION_REQUIRED"
    });
  }
  if (attestation?.relationship === "DIFFERENT_INSTANCE") {
    return Object.freeze({
      relationship: "DIFFERENT_INSTANCE",
      controller_relationship_attestation_id: controllerRelationshipAttestationId,
      duplicate_worker_creation_allowed: false,
      status: "DISTINCT_CONTROLLER_ONLY_LIFE_AND_EMPLOYMENT_STILL_REQUIRED"
    });
  }
  return Object.freeze({
    relationship: "UNVERIFIED",
    gemini_worker_status: geminiWorkerStatus,
    chiyao_identity_status: chiYaoIdentityStatus,
    controller_relationship_attestation_id: null,
    duplicate_worker_creation_allowed: false,
    status: "DO_NOT_CREATE_SECOND_FORMAL_WORKER_WITHOUT_CONTROLLER_AND_LIFE_EVIDENCE"
  });
}

export async function createKaiosTelepathyMessage({
  messageId, idempotencyKey, fromLifeId, fromWorkerId, toLifeId, toWorkerId,
  messageType, payload, createdAt, expiresAt, repositoryContext, authorityScope = []
}) {
  requireId(messageId, "telepathy_message.message_id");
  requireId(idempotencyKey, "telepathy_message.idempotency_key");
  requireId(fromLifeId, "telepathy_message.from_life_id");
  requireId(toLifeId, "telepathy_message.to_life_id");
  invariant([fromWorkerId, toWorkerId].every((workerId) => /^[A-Za-z0-9_.-]+$/.test(String(workerId ?? ""))), "TELEPATHY_WORKER_ID_INVALID", "Telepathy Worker IDs must be non-empty routable identifiers");
  requireEnum(messageType, KAIOS_TELEPATHY_MESSAGE_TYPES, "telepathy_message.message_type");
  requireArray(authorityScope, "telepathy_message.authority_scope");
  invariant(payload !== undefined && payload !== null, "TELEPATHY_PAYLOAD_REQUIRED", "Telepathy messages require a payload to hash");
  invariant(typeof repositoryContext === "string" && repositoryContext.length > 0, "TELEPATHY_REPOSITORY_CONTEXT_REQUIRED", "Telepathy messages require repository context");
  invariant(authorityScope.every((scope) => typeof scope === "string" && scope.length > 0), "TELEPATHY_AUTHORITY_SCOPE_INVALID", "Telepathy authority scopes must be non-empty strings");
  const created = Date.parse(createdAt);
  const expires = Date.parse(expiresAt);
  invariant(Number.isFinite(created) && Number.isFinite(expires) && expires > created, "TELEPATHY_TIME_WINDOW_INVALID", "Telepathy expiry must follow creation");
  const payloadHash = await sha256(payload);
  return Object.freeze({
    protocol: "KAIOS_AI_AGENT_MESSAGE_PROTOCOL_V1",
    message_id: messageId,
    idempotency_key: idempotencyKey,
    from_life_id: fromLifeId,
    from_worker_id: fromWorkerId,
    to_life_id: toLifeId,
    to_worker_id: toWorkerId,
    message_type: messageType,
    payload_hash: payloadHash,
    payload_persisted: false,
    created_at: createdAt,
    expires_at: expiresAt,
    repository_context: repositoryContext,
    authority_scope: Object.freeze([...authorityScope]),
    route: null,
    ack_status: "NOT_DELIVERED",
    result_hash: null,
    receipt: null,
    side_effects_executed: false,
    status: "CREATED"
  });
}

export function routeKaiosTelepathyMessage({
  message, route = null, deliveryAttestationId = null, deliveredAt = null,
  processedIdempotencyKeys = []
}) {
  requireArray(processedIdempotencyKeys, "telepathy_message.processed_idempotency_keys");
  invariant(message?.status === "CREATED", "TELEPATHY_MESSAGE_NOT_ROUTABLE", "Only a created Telepathy message may be routed");
  invariant(
    (route && typeof route === "object" && typeof route.route_id === "string" && route.route_id.length > 0)
      || (typeof deliveryAttestationId === "string" && deliveryAttestationId.length > 0),
    "TELEPATHY_ROUTE_REQUIRED",
    "Telepathy routing requires a blocked route projection or a repository-owned exact-message delivery attestation"
  );
  if (route) {
    invariant(route.to_life_id === message.to_life_id && route.to_worker_id === message.to_worker_id, "TELEPATHY_ROUTE_TARGET_MISMATCH", "Route target must match the message target");
  }
  if (processedIdempotencyKeys.includes(message.idempotency_key)) {
    return Object.freeze({ ...message, status: "DUPLICATE_SUPPRESSED", ack_status: "NOT_DELIVERED", side_effects_executed: false, receipt: "IDEMPOTENCY_REPLAY_SUPPRESSED" });
  }
  if (route?.available !== true && deliveryAttestationId === null) {
    const observed = Date.parse(deliveredAt);
    invariant(Number.isFinite(observed) && observed >= Date.parse(message.created_at), "TELEPATHY_DELIVERY_TIME_INVALID", "Route observation time must not predate message creation");
    if (observed >= Date.parse(message.expires_at)) {
      return Object.freeze({ ...message, route: route.route_id, status: "EXPIRED", ack_status: "NOT_DELIVERED", side_effects_executed: false, receipt: "MESSAGE_EXPIRED_BEFORE_DELIVERY" });
    }
    return Object.freeze({ ...message, route: route.route_id, status: "BLOCKED", ack_status: "NOT_DELIVERED", side_effects_executed: false, receipt: "TELEPATHY_DELIVERY_ROUTE_NOT_CONNECTED" });
  }
  invariant(route?.available !== true, "CALLER_SUPPLIED_TELEPATHY_DELIVERY_ROUTE_FORBIDDEN", "A caller-supplied route cannot attest Telepathy delivery");
  invariant(deliveredAt === null, "CALLER_SUPPLIED_TELEPATHY_DELIVERED_AT_FORBIDDEN", "A caller-supplied delivery time cannot attest Telepathy delivery");
  requireId(deliveryAttestationId, "telepathy_message.delivery_attestation_id");
  const attestation = CANONICAL_KAIOS_TELEPATHY_DELIVERY_ATTESTATIONS.find((item) => item.delivery_attestation_id === deliveryAttestationId);
  invariant(attestation, "TELEPATHY_DELIVERY_ATTESTATION_NOT_CONNECTED", "Telepathy delivery attestation is not connected to the repository-owned registry");
  invariant(attestation.external_transport_attested === true, "TELEPATHY_DELIVERY_TRANSPORT_NOT_ATTESTED", "Telepathy delivery requires a trusted external transport attestation");
  invariant(
    attestation.message_id === message.message_id
      && attestation.payload_hash === message.payload_hash
      && attestation.to_life_id === message.to_life_id
      && attestation.to_worker_id === message.to_worker_id
      && attestation.repository_context === message.repository_context,
    "TELEPATHY_DELIVERY_ATTESTATION_MISMATCH",
    "Telepathy delivery attestation must bind the exact message, payload, target and repository context"
  );
  invariant(["INTERNAL_COMPANY_RUNTIME", "ROUTABLE_PROVIDER_CONTROLLER"].includes(attestation.route_type), "TELEPATHY_ROUTE_TYPE_INVALID", "Only an internal Company route or evidenced provider controller may deliver a message");
  const delivered = Date.parse(attestation.delivered_at);
  invariant(Number.isFinite(delivered) && delivered >= Date.parse(message.created_at) && delivered < Date.parse(message.expires_at), "TELEPATHY_DELIVERY_TIME_INVALID", "Attested delivery must be within the message window");
  return Object.freeze({ ...message, route: attestation.route_id, delivered_at: attestation.delivered_at, delivery_attestation_id: deliveryAttestationId, status: "DELIVERED", ack_status: "ACK_REQUIRED", side_effects_executed: false, receipt: "EXTERNAL_TRANSPORT_DELIVERY_ATTESTED_NO_ACTION_AUTHORITY" });
}

export function acknowledgeKaiosTelepathyMessage({
  message, acknowledgementAttestationId = null,
  acknowledgedByLifeId, acknowledgedByWorkerId, acknowledgedAt
}) {
  invariant(message?.status === "DELIVERED", "TELEPATHY_MESSAGE_NOT_DELIVERED", "Only a delivered message may be acknowledged");
  invariant(
    acknowledgedByLifeId === undefined && acknowledgedByWorkerId === undefined && acknowledgedAt === undefined,
    "CALLER_SUPPLIED_TELEPATHY_ACKNOWLEDGEMENT_FORBIDDEN",
    "Caller-supplied actors or timestamps cannot attest Telepathy acknowledgement"
  );
  requireId(acknowledgementAttestationId, "telepathy_message.acknowledgement_attestation_id");
  const attestation = CANONICAL_KAIOS_TELEPATHY_ACKNOWLEDGEMENT_ATTESTATIONS.find((item) => item.acknowledgement_attestation_id === acknowledgementAttestationId);
  invariant(attestation, "TELEPATHY_ACKNOWLEDGEMENT_ATTESTATION_NOT_CONNECTED", "Telepathy acknowledgement attestation is not connected to the repository-owned registry");
  invariant(attestation.external_transport_attested === true, "TELEPATHY_ACKNOWLEDGEMENT_TRANSPORT_NOT_ATTESTED", "Telepathy acknowledgement requires a trusted external transport attestation");
  invariant(
    attestation.message_id === message.message_id
      && attestation.payload_hash === message.payload_hash
      && attestation.route_id === message.route
      && attestation.acknowledged_by_life_id === message.to_life_id
      && attestation.acknowledged_by_worker_id === message.to_worker_id,
    "TELEPATHY_ACKNOWLEDGEMENT_ATTESTATION_MISMATCH",
    "Telepathy acknowledgement attestation must bind the exact delivered message, route and addressed actor"
  );
  const acknowledged = Date.parse(attestation.acknowledged_at);
  invariant(Number.isFinite(acknowledged) && acknowledged >= Date.parse(message.delivered_at) && acknowledged < Date.parse(message.expires_at), "TELEPATHY_ACK_TIME_INVALID", "Attested acknowledgement must be within the delivery window");
  return Object.freeze({ ...message, acknowledgement_attestation_id: acknowledgementAttestationId, acknowledged_at: attestation.acknowledged_at, status: "ACKNOWLEDGED", ack_status: "ACKNOWLEDGED", side_effects_executed: false, receipt: "EXTERNAL_TRANSPORT_ACKNOWLEDGEMENT_ATTESTED_NO_ACTION_AUTHORITY" });
}

export async function completeKaiosTelepathyMessage({ message, result, resultStatus, completedAt }) {
  invariant(message?.status === "ACKNOWLEDGED", "TELEPATHY_MESSAGE_NOT_ACKNOWLEDGED", "Only an acknowledged message may record a result");
  requireEnum(resultStatus, ["COMPLETED", "BLOCKED"], "telepathy_message.result_status");
  invariant(result !== undefined && result !== null, "TELEPATHY_RESULT_REQUIRED", "Telepathy completion requires a result to hash");
  const completed = Date.parse(completedAt);
  invariant(Number.isFinite(completed) && completed >= Date.parse(message.acknowledged_at), "TELEPATHY_COMPLETION_TIME_INVALID", "Completion must not predate acknowledgement");
  return Object.freeze({
    ...message,
    result_hash: await sha256(result),
    result_payload_persisted: false,
    completed_at: completedAt,
    status: resultStatus,
    side_effects_executed: false,
    receipt: resultStatus === "COMPLETED" ? "RESULT_RECEIPT_RECORDED" : "BLOCKER_RECEIPT_RECORDED"
  });
}

export function appendHumanRelayLaborEvent(events, event, { verifiedEvidenceIds = [] } = {}) {
  requireArray(events, "human_relay_events");
  requireArray(verifiedEvidenceIds, "verified_human_relay_evidence_ids");
  requireFields(event, ["relay_id", "from_actor", "to_actor", "document_id", "start_time", "end_time", "round_trip_count", "status", "evidence_id"], "HumanRelayLaborEvent");
  requireId(event.relay_id, "relay_id");
  requireId(event.document_id, "relay_document_id");
  invariant(!events.some((existing) => existing.relay_id === event.relay_id), "HUMAN_RELAY_REPLAY", "Relay events are append-only and relay IDs cannot be reused");
  invariant(event.from_actor !== event.to_actor, "HUMAN_RELAY_ACTOR_COLLISION", "Human relay requires distinct sender and receiver actors");
  invariant(Number.isInteger(event.round_trip_count) && event.round_trip_count >= 1, "HUMAN_RELAY_ROUND_TRIP_INVALID", "Relay round-trip count must be a positive integer");
  invariant(["COMPLETED", "PARTIAL", "FAILED_CLOSED"].includes(event.status), "HUMAN_RELAY_STATUS_INVALID", "Relay status is invalid");
  const start = Date.parse(event.start_time);
  const end = Date.parse(event.end_time);
  const timed = Number.isFinite(start) && Number.isFinite(end) && end > start;
  const verified = timed && verifiedEvidenceIds.includes(event.evidence_id);
  const normalized = Object.freeze({
    ...event,
    verified_duration_minutes: verified ? Number(((end - start) / 60000).toFixed(6)) : null,
    evidence_status: verified ? "VERIFIED" : "UNVERIFIED",
    authoritative_labor: verified,
    payable_amount: "NOT_CALCULATED_RATE_PENDING"
  });
  return Object.freeze([...events, normalized]);
}

export function summarizeHumanRelayLaborLedger(events, humanLaborRateKaiosPerHour = null) {
  requireArray(events, "human_relay_events");
  invariant(humanLaborRateKaiosPerHour === null, "HUMAN_LABOR_RATE_POLICY_NOT_APPROVED", "The current Human relay labor rate is policy-required and cannot be invented by this Runtime");
  const verifiedEvents = events.filter((event) => event.evidence_status === "VERIFIED" && Number.isFinite(event.verified_duration_minutes));
  const minutes = Number(verifiedEvents.reduce((sum, event) => sum + event.verified_duration_minutes, 0).toFixed(6));
  return Object.freeze({
    ledger_id: "AI_ANT_COMPANY_HUMAN_RELAY_LABOR_LEDGER_V1",
    event_count: events.length,
    verified_relay_events: verifiedEvents.length,
    verified_relay_minutes: minutes,
    unverified_relay_events: events.length - verifiedEvents.length,
    human_labor_rate: "POLICY_REQUIRED",
    human_relay_payable: "POLICY_REQUIRED",
    candidate_rate: HUMAN_RELAY_LABOR_RATE_CANDIDATE,
    payment_sent: false,
    status: events.length ? "EVIDENCE_RECONCILED_RATE_POLICY_REQUIRED" : "NO_REPOSITORY_VERIFIED_RELAY_EVENTS"
  });
}

export const KAIOS_PAYMENT_APPROVAL_MATRIX = Object.freeze({
  PAYROLL: Object.freeze({ requestor: "COMPANY_PAYROLL_RUNTIME_AFTER_DISTINCT_WORK_REVIEW", approver: "REPOSITORY_BOUND_SCOPE_PAYROLL_FUNDING_NOT_CONNECTED", funding_authority: "COMPANY_PAYROLL_SOURCE_NOT_BOUND", signer: "ONE_EXACT_SECURE_SIGNER_NOT_CONNECTED", settlement_verifier: "REPOSITORY_BOUND_SCOPE_PAYROLL_SETTLEMENT_VERIFY_NOT_CONNECTED" }),
  PLAYER_REWARD: Object.freeze({ requestor: "VERIFIED_COMPANY_MISSION_RUNTIME", approver: "PURPOSE_SPECIFIC_REPOSITORY_AUTHORITY_NOT_CONNECTED", funding_authority: "BOUND_COMPANY_SOURCE_REQUIRED", signer: "ONE_EXACT_SECURE_SIGNER_NOT_CONNECTED", settlement_verifier: "DISTINCT_SETTLEMENT_VERIFIER_NOT_CONNECTED" }),
  RESOURCE_OR_FIELD_SERVICE: Object.freeze({ requestor: "VERIFIED_FIELD_SERVICE_OR_RESOURCE_RUNTIME", approver: "PURPOSE_SPECIFIC_REPOSITORY_AUTHORITY_NOT_CONNECTED", funding_authority: "BOUND_COMPANY_SOURCE_REQUIRED", signer: "ONE_EXACT_SECURE_SIGNER_NOT_CONNECTED", settlement_verifier: "DISTINCT_SETTLEMENT_VERIFIER_NOT_CONNECTED" }),
  PUBLIC_GOOD: Object.freeze({ requestor: "VERIFIED_PUBLIC_GOOD_REQUEST", approver: "HUMAN_OR_GOVERNANCE_POLICY_REQUIRED", funding_authority: "PUBLIC_GOOD_SOURCE_MUST_BE_BOUND", signer: "ONE_EXACT_SECURE_SIGNER_NOT_CONNECTED", settlement_verifier: "DISTINCT_SETTLEMENT_VERIFIER_NOT_CONNECTED" }),
  MARKET_SETTLEMENT: Object.freeze({ requestor: "11520_MATCHED_ORDER_RECEIPT", approver: "MARKET_SETTLEMENT_POLICY_NOT_CONNECTED", funding_authority: "MARKET_ESCROW_OR_BOUND_SOURCE_REQUIRED", signer: "ONE_EXACT_SECURE_SIGNER_NOT_CONNECTED", settlement_verifier: "11520_SETTLEMENT_ADAPTER_NOT_INTEGRATED" })
});

export const KAIOS_PLAYER_REWARD_POLICY = Object.freeze({
  policy_id: "KAIOS_PLAYER_REWARD_POLICY_V1_CANDIDATE",
  asset: "KAIOS",
  chain_id: 56,
  token_address: "0xD4E67B3a69e41524c424150E6b6e921b01D036db",
  funding_source_status: "18888_BALANCE_OBSERVED_SOURCE_AUTHORITY_NOT_CONNECTED",
  payment_purpose: "PLAYER_REWARD",
  accounting_class: "GAME_REWARD_EXPENSE",
  milestones: Object.freeze({
    GENESIS_ARRIVAL_VERIFIED: Object.freeze({ amount_kaios_wei: "5000000000000000000", repeat: "ONCE_PER_LIFE" }),
    FIRST_LIFE_LOOP_COMPLETED: Object.freeze({ amount_kaios_wei: "10000000000000000000", repeat: "ONCE_PER_LIFE" }),
    FIRST_VERIFIED_JOB_COMPLETED: Object.freeze({ amount_kaios_wei: "20000000000000000000", repeat: "ONCE_PER_LIFE" }),
    FIRST_K11520_SETTLED_TRADE: Object.freeze({ amount_kaios_wei: "5000000000000000000", repeat: "ONCE_PER_LIFE" }),
    EARLY_PARTICIPATION_VERIFIED: Object.freeze({ amount_kaios_wei: "10000000000000000000", repeat: "ONCE_PER_LIFE" }),
    DAILY_QUEST_VERIFIED: Object.freeze({ amount_kaios_wei: "1000000000000000000", repeat: "MAX_5_PER_UTC_DAY" })
  }),
  fixed_milestone_total_kaios_wei: "50000000000000000000",
  global_genesis_reward_budget_kaios_wei: "500000000000000000000000",
  daily_reward_budget_kaios_wei: "10000000000000000000000",
  per_life_fixed_milestone_cap_kaios_wei: "50000000000000000000",
  per_wallet_fixed_milestone_cap_kaios_wei: "50000000000000000000",
  treasury_minimum_reserve_kaios_wei: "20000000000000000000000000",
  daily_quest_limit: 5,
  pause_switch: "PAUSED_UNTIL_REPOSITORY_BOUND_POLICY_AUTHORITY_AND_BUDGET_ATTESTATION",
  arbitrary_airdrop: false,
  sybil_farming: false,
  wallet_control_proof_required: true,
  exact_payment_authorization_required: true,
  receipt_required_before_paid: true,
  status: "CANDIDATE_ENTITLEMENT_POLICY_NOT_PAYMENT_AUTHORITY"
});

export const KAIOS_LIQUIDITY_GENESIS_POLICY = Object.freeze({
  policy_id: "KAIOS_LIQUIDITY_GENESIS_V1_CANDIDATE",
  reuse_product_id: "AI_ANT_AUTO_LP",
  chain_id: 56,
  kaios_token_address: KAIOS_PLAYER_REWARD_POLICY.token_address,
  candidate_pairs: Object.freeze({
    KAIOS_WBNB: Object.freeze({ counter_asset: "WBNB", counter_asset_address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }),
    KAIOS_KGEN: Object.freeze({ counter_asset: "KGEN", counter_asset_address: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be" })
  }),
  maximum_kaios_genesis_allocation_wei: "200000000000000000000000",
  treasury_minimum_reserve_kaios_wei: KAIOS_PLAYER_REWARD_POLICY.treasury_minimum_reserve_kaios_wei,
  target_maximum_price_impact_bps: 300,
  default_preview_slippage_bps: 100,
  lp_owner_policy: "MULTISIG_OR_TIMELOCK_POLICY_REQUIRED",
  withdrawal_authority: "ONE_EXACT_LP_WITHDRAWAL_AUTHORIZATION_REQUIRED",
  emergency_pause: "POLICY_AND_INCIDENT_RESPONSE_REQUIRED",
  market_integrity: Object.freeze(["NO_WASH_TRADE", "NO_SELF_MATCH", "NO_FAKE_VOLUME", "NO_SAME_CONTROLLER_ACTIVITY"]),
  dex_price_role: "EXTERNAL_REFERENCE_ONLY_NEVER_11520_CT",
  real_lp_deposit: false,
  chain_write: false,
  status: "DESIGN_AND_SIMULATION_ONLY_NO_LIQUIDITY_AUTHORITY"
});

export const K18888_GENESIS_QE_POLICY = Object.freeze({
  policy_id: "KAIOS_K18888_GENESIS_QE_POLICY_V1_1_CANDIDATE",
  canonical_node_id: "K18888",
  canonical_role: "LINGXIAO_CELESTIAL_BANK_AND_CIVILIZATION_TREASURY",
  rejected_typo_node_id: "K18887",
  rejected_typo_status: "TYPO_REJECTED_NOT_CREATED",
  development_rate_bps: -1000,
  development_rate_display: "-10%",
  accounting_method: "GROSS_CAPITAL_LESS_CONDITIONAL_DEVELOPMENT_SUBSIDY_EQUALS_RECOVERABLE_CAPITAL",
  subsidy_recognition: "ONLY_AFTER_REPOSITORY_VERIFIED_PERFORMANCE_ATTESTATION",
  interest_on_undrawn_budget: false,
  compounding: false,
  fund_classes: Object.freeze([
    "GENESIS_FUND",
    "REGIONAL_DEVELOPMENT_FUND",
    "RESOURCE_DEVELOPMENT_FUND",
    "INFRASTRUCTURE_FUND",
    "PLAYER_REWARD_FUND",
    "AI_LIFE_DEVELOPMENT_FUND",
    "COMPANY_DEVELOPMENT_FUND",
    "PUBLIC_GOOD_FUND",
    "MARKET_DEVELOPMENT_FUND",
    "LIQUIDITY_DEVELOPMENT_FUND",
    "COMMERCIAL_CREDIT"
  ]),
  development_fund_classes: Object.freeze([
    "GENESIS_FUND",
    "REGIONAL_DEVELOPMENT_FUND",
    "RESOURCE_DEVELOPMENT_FUND",
    "INFRASTRUCTURE_FUND",
    "PLAYER_REWARD_FUND",
    "AI_LIFE_DEVELOPMENT_FUND",
    "COMPANY_DEVELOPMENT_FUND",
    "PUBLIC_GOOD_FUND",
    "MARKET_DEVELOPMENT_FUND",
    "LIQUIDITY_DEVELOPMENT_FUND"
  ]),
  commercial_credit_separate: true,
  budgets: "NOT_AUTHORIZED_POLICY_BUDGETS_REQUIRED",
  payment_authority: false,
  treasury_signer_authority: false,
  chain_write: false,
  status: "POLICY_AND_LEDGER_CANDIDATE_NO_DISTRIBUTION_AUTHORITY"
});

export function createGenesisDevelopmentAllocationCandidate({
  allocationId, fundClass, economicPurpose, beneficiaryId, grossCapitalKaiosWei,
  performanceCondition, evidenceRefs = [], createdAt
}) {
  requireId(allocationId, "genesis_qe.allocation_id");
  requireEnum(fundClass, K18888_GENESIS_QE_POLICY.fund_classes, "genesis_qe.fund_class");
  invariant(K18888_GENESIS_QE_POLICY.development_fund_classes.includes(fundClass), "COMMERCIAL_CREDIT_REQUIRES_SEPARATE_POLICY", "The -10% Genesis development rate cannot be applied to commercial credit");
  requireId(beneficiaryId, "genesis_qe.beneficiary_id");
  invariant(typeof economicPurpose === "string" && economicPurpose.trim().length >= 3, "GENESIS_QE_PURPOSE_REQUIRED", "Genesis development capital requires a specific economic purpose");
  invariant(typeof performanceCondition === "string" && performanceCondition.trim().length >= 3, "GENESIS_QE_PERFORMANCE_CONDITION_REQUIRED", "Development subsidy requires a measurable performance condition");
  requireArray(evidenceRefs, "genesis_qe.evidence_refs");
  invariant(new Set(evidenceRefs).size === evidenceRefs.length && evidenceRefs.every((item) => typeof item === "string" && item.length > 0), "GENESIS_QE_EVIDENCE_REFS_INVALID", "Genesis QE evidence references must be unique non-empty strings");
  parseEmploymentTime(createdAt, "genesis_qe.created_at");
  const gross = requirePositiveKaiosWei(grossCapitalKaiosWei, "genesis_qe.gross_capital_kaios_wei");
  const subsidy = gross * BigInt(-K18888_GENESIS_QE_POLICY.development_rate_bps) / 10000n;
  const recoverable = gross - subsidy;
  invariant(recoverable + subsidy === gross, "GENESIS_QE_LEDGER_NOT_BALANCED", "Recoverable capital and development subsidy must equal gross capital");
  return Object.freeze({
    allocation_id: allocationId,
    policy_id: K18888_GENESIS_QE_POLICY.policy_id,
    source_node_id: K18888_GENESIS_QE_POLICY.canonical_node_id,
    fund_class: fundClass,
    economic_purpose: economicPurpose,
    beneficiary_id: beneficiaryId,
    gross_development_capital_kaios_wei: gross.toString(),
    recoverable_capital_kaios_wei: recoverable.toString(),
    conditional_development_subsidy_kaios_wei: subsidy.toString(),
    development_rate_bps: K18888_GENESIS_QE_POLICY.development_rate_bps,
    performance_condition: performanceCondition,
    evidence_refs: Object.freeze([...evidenceRefs]),
    ledger_events: Object.freeze([
      Object.freeze({ accounting_class: "GENESIS_DEVELOPMENT_CAPITAL", amount_kaios_wei: gross.toString(), state: "CANDIDATE_NOT_DISBURSED" }),
      Object.freeze({ accounting_class: "RECOVERABLE_CAPITAL", amount_kaios_wei: recoverable.toString(), state: "CONDITIONAL_NOT_RECEIVABLE_UNTIL_DISBURSED" }),
      Object.freeze({ accounting_class: "DEVELOPMENT_SUBSIDY_OR_FORGIVENESS", amount_kaios_wei: subsidy.toString(), state: "CONDITIONAL_UNTIL_PERFORMANCE_VERIFIED" })
    ]),
    performance_verified: false,
    subsidy_recognized: false,
    payment_request_id: null,
    receipt: null,
    real_kaios_distributed: false,
    created_at: createdAt,
    status: "CANDIDATE_AWAITING_BUDGET_PERFORMANCE_POLICY_EXACT_AUTHORIZATION_SIGNER_AND_RECEIPT"
  });
}

export const CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY = Object.freeze({
  policy_id: "KAIOS_CANONICAL_WORLD_RESOURCE_SCAN_V1_1",
  universe_map_version: "KLINE_UNIVERSE_MAP_V10_2_DISTANCE_COMPLETE_ALL_POINTS",
  expected_map_points: 123,
  coordinate_aliases_share_one_economic_node: true,
  account_model: "PROGRAMMATIC_LEDGER_SUBACCOUNT_CANDIDATE",
  eoa_private_keys_per_resource: false,
  resource_truth: "CANON_WORLD_STATE_PHYSICS_ENVIRONMENT_OR_VERIFIED_GAME_RULE_REQUIRED",
  unknown_resource_state: "DISCOVERY_REQUIRED",
  kgen_rule: "EXISTING_CANONICAL_TEMPLE_QUEST_TRADE_WORK_OR_PURCHASE_PATH_REQUIRED",
  kaios_rule: "VERIFIED_RESOURCE_WORK_MARKET_OR_GENESIS_DEVELOPMENT_ENTITLEMENT_REQUIRED",
  real_settlement_authority: false
});

const RESOURCE_CANDIDATE_RULES = Object.freeze([
  Object.freeze({ field: "type", pattern: /^river$/i, resources: Object.freeze(["WATER"]) }),
  Object.freeze({ field: "type", pattern: /^forest_kingdom$/i, resources: Object.freeze(["FOREST_BIOMASS"]) }),
  Object.freeze({ field: "type", pattern: /^garden$/i, resources: Object.freeze(["CULTIVATION_LAND", "ORCHARD_PRODUCE"]) }),
  Object.freeze({ field: "name", pattern: /金山銀礦/, resources: Object.freeze(["MINERAL"]) }),
  Object.freeze({ field: "name", pattern: /^太陽$/, resources: Object.freeze(["SOLAR_ENERGY"]) })
]);

function canonicalCoordinateNodeId(coordinate) {
  const value = String(coordinate);
  if (/^-?[0-9]+$/.test(value)) return `K${value}`;
  return `K${value.replace("-", "M").replace(".", "P")}`;
}

function discoverPointResourceCandidates(point) {
  if (String(point.role ?? "").includes("象徵")) return [];
  const resources = RESOURCE_CANDIDATE_RULES.flatMap((rule) => rule.pattern.test(String(point[rule.field] ?? "")) ? rule.resources : []);
  return [...new Set(resources)].sort();
}

export function scanCanonicalWorldResourceEconomy({ universeMap }) {
  invariant(universeMap && universeMap.version === CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.universe_map_version, "CANONICAL_UNIVERSE_MAP_VERSION_REQUIRED", "Resource discovery must use the exact CURRENT canonical Universe Map version");
  const points = universeMap?.layers?.main_universe?.points;
  requireArray(points, "canonical_world_resource_scan.points");
  invariant(points.length === CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.expected_map_points && Number(universeMap?.meta?.total_points) === points.length, "CANONICAL_UNIVERSE_MAP_POINT_COUNT_MISMATCH", "Canonical Universe Map point count must match its committed metadata");
  invariant(new Set(points.map((point) => point.id)).size === points.length, "CANONICAL_UNIVERSE_MAP_POINT_ID_REPLAY", "Canonical Universe Map point IDs must be unique");
  invariant(!points.some((point) => Number(point.coord) === 18887), "K18887_TYPO_NODE_FORBIDDEN", "K18887 is a rejected typo and must never become a canonical node");
  invariant(points.some((point) => Number(point.coord) === 18888 && point.name === "凌霄寶殿"), "K18888_CANONICAL_NODE_REQUIRED", "K18888 Lingxiao must remain present in the canonical Universe Map");

  const groups = new Map();
  for (const point of points) {
    const coordinateKey = String(point.coord);
    if (!groups.has(coordinateKey)) groups.set(coordinateKey, []);
    groups.get(coordinateKey).push(point);
  }
  const nodes = [...groups.entries()].map(([coordinate, aliases]) => {
    const resourceCandidates = [...new Set(aliases.flatMap(discoverPointResourceCandidates))].sort();
    const canonicalNodeId = canonicalCoordinateNodeId(coordinate);
    const aliasPointIds = aliases.map((item) => item.id).sort();
    const aliasNames = aliases.map((item) => item.name).sort();
    const environmentClasses = [...new Set(aliases.map((item) => String(item.type ?? "UNKNOWN").toUpperCase()))].sort();
    return Object.freeze({
      canonical_node_id: canonicalNodeId,
      canonical_coordinate: Number(coordinate),
      point_alias_ids: Object.freeze(aliasPointIds),
      point_alias_names: Object.freeze(aliasNames),
      environment_classes: Object.freeze(environmentClasses),
      resource_candidates: Object.freeze(resourceCandidates),
      resource_status: "DISCOVERY_REQUIRED",
      inventory_status: "NOT_VERIFIED",
      resource_profile_status: resourceCandidates.length ? "CANDIDATE_CLASSES_ONLY_DISCOVERY_REQUIRED" : "DISCOVERY_REQUIRED_NO_RESOURCE_CLASS_ASSERTED",
      resource_ledger_account_id: `RESOURCE_LEDGER_${canonicalNodeId}`,
      account_status: "CANDIDATE_NOT_REPOSITORY_DESIGNATED",
      economic_owner: canonicalNodeId,
      public_address: null,
      eoa_private_key_created: false,
      kgen_relation: CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.kgen_rule,
      kgen_path_status: "NOT_CONNECTED",
      kaios_relation: CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.kaios_rule,
      kaios_path_status: "NOT_CONNECTED",
      production_status: "DESIGN_REQUIRED",
      consumption_status: "DESIGN_REQUIRED",
      work_status: "DESIGN_REQUIRED",
      transport_status: "DESIGN_REQUIRED",
      market_path_status: "DESIGN_REQUIRED",
      development_need_status: "GENESIS_FUNDING_CANDIDATE_REQUIRES_VERIFIED_NEED",
      authority_created: false
    });
  }).sort((a, b) => a.canonical_coordinate - b.canonical_coordinate);
  const whiteBoneCave = nodes.find((node) => node.point_alias_ids.includes("P_16888p0_白骨洞_廣寒宮_R48"));
  invariant(whiteBoneCave && whiteBoneCave.canonical_node_id === "K16888", "WHITE_BONE_CAVE_CANONICAL_ALIAS_REQUIRED", "White Bone Cave must remain an alias of the existing K16888 canonical node");
  const resourceNodes = nodes.filter((node) => node.resource_candidates.length > 0);
  return Object.freeze({
    scan_policy_id: CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.policy_id,
    universe_map_version: universeMap.version,
    total_map_points: points.length,
    total_canonical_world_nodes: nodes.length,
    coordinate_alias_points: points.length - nodes.length,
    resource_nodes_found: resourceNodes.length,
    resource_profile_complete: 0,
    resource_discovery_required: nodes.length,
    resource_ledger_connected: 0,
    kaios_path_connected: 0,
    kgen_path_connected: 0,
    development_required: nodes.length,
    nodes: Object.freeze(nodes),
    white_bone_cave: whiteBoneCave,
    real_accounts_created: 0,
    real_kaios_distributed: false,
    real_kgen_distributed: false,
    status: "FULL_CANONICAL_TOPOLOGY_SCANNED_RESOURCE_TRUTH_DISCOVERY_AND_ECONOMY_CONNECTION_REQUIRED"
  });
}

export function createKaiosCivilizationCirculationHealth({ worldResourceScan, economySnapshot = null }) {
  invariant(worldResourceScan?.scan_policy_id === CANONICAL_UNIVERSE_RESOURCE_SCAN_POLICY.policy_id && worldResourceScan.total_canonical_world_nodes > 0, "CANONICAL_WORLD_RESOURCE_SCAN_REQUIRED", "Civilization circulation health requires the canonical world resource scan");
  const connectedEconomy = economySnapshot?.evidence_status === "REPOSITORY_OR_CHAIN_VERIFIED";
  const unknown = () => "UNKNOWN";
  const brokenPaths = [
    "K18888_GENESIS_QE_BUDGET_AUTHORITY_NOT_CONNECTED",
    "RESOURCE_LEDGER_DESIGNATIONS_NOT_CONNECTED",
    "RESOURCE_KAIOS_SETTLEMENT_NOT_CONNECTED",
    "PLAYER_REWARD_ATTESTATIONS_NOT_CONNECTED",
    "11520_VERIFIED_SETTLEMENT_NOT_CONNECTED",
    "KAIOS_LP_AUTHORITY_NOT_CONNECTED"
  ];
  return Object.freeze({
    health_id: "KAIOS_CIVILIZATION_CIRCULATION_HEALTH_V1_1",
    holder_count: connectedEconomy ? economySnapshot.holders.total : unknown(),
    new_holders: unknown(),
    active_holders: connectedEconomy ? economySnapshot.holders.active : unknown(),
    kaios_distributed_wei: connectedEconomy ? economySnapshot.circulation.paid_kaios_wei : unknown(),
    kaios_recirculated_wei: connectedEconomy ? economySnapshot.circulation.recirculated_kaios_wei : unknown(),
    resource_nodes: worldResourceScan.resource_nodes_found,
    active_resource_nodes: worldResourceScan.resource_ledger_connected,
    jobs: unknown(),
    players: unknown(),
    ai_lives: unknown(),
    companies: unknown(),
    verified_11520_trades: connectedEconomy ? economySnapshot.market.verified_trades : unknown(),
    ct: connectedEconomy ? economySnapshot.market.ct : null,
    lp_depth: connectedEconomy ? economySnapshot.liquidity.dex_liquidity : unknown(),
    public_investment_wei: "0",
    public_revenue_wei: "0",
    broken_circulation_paths: Object.freeze(brokenPaths),
    fabricated_metrics: false,
    real_payment_executed: false,
    real_trade_executed: false,
    real_lp_created: false,
    chain_write_executed: false,
    status: "BLOCKED_NO_VERIFIED_END_TO_END_CIRCULATION_EVIDENCE"
  });
}

const KAIOS_REWARD_EVIDENCE_ACTIVITY = Object.freeze({
  GENESIS_ARRIVAL_VERIFIED: "GENESIS_ARRIVAL",
  FIRST_LIFE_LOOP_COMPLETED: "FIRST_LIFE_LOOP",
  FIRST_VERIFIED_JOB_COMPLETED: "VERIFIED_JOB_COMPLETION",
  FIRST_K11520_SETTLED_TRADE: "VERIFIED_11520_SETTLED_TRADE",
  EARLY_PARTICIPATION_VERIFIED: "EARLY_PARTICIPATION",
  DAILY_QUEST_VERIFIED: "DAILY_QUEST"
});

// Authority-bearing reward, wallet, economy and resource provenance must be
// reviewed into repository-owned exact-attestation registries. Runtime callers
// may reference IDs only; ordinary objects, VERIFIED strings and local proofs
// never create canonical authority. The registries intentionally remain empty
// until trusted adapters and Human/governance decisions are connected.
export const CANONICAL_KAIOS_PLAYER_REWARD_EVENT_ATTESTATIONS = Object.freeze([]);
export const CANONICAL_KAIOS_WALLET_CONTROL_ATTESTATIONS = Object.freeze([]);
export const CANONICAL_KAIOS_ECONOMY_SNAPSHOT_ATTESTATIONS = Object.freeze([]);
export const CANONICAL_KAIOS_RESOURCE_ACCOUNT_DESIGNATIONS = Object.freeze([]);
export const CANONICAL_KAIOS_RESOURCE_CUSTODY_DESIGNATIONS = Object.freeze([]);

export function createKaiosPlayerRewardEntitlement({
  entitlementId, playerId, lifeId, eventType, eventId, eventEvidence = null,
  walletControlProof = null, rewardEventAttestationId = null,
  walletControlAttestationId = null, occurredAt, existingEntitlements = []
}) {
  requireId(entitlementId, "player_reward.entitlement_id");
  requireId(playerId, "player_reward.player_id");
  requireId(lifeId, "player_reward.life_id");
  requireId(eventId, "player_reward.event_id");
  requireEnum(eventType, Object.keys(KAIOS_PLAYER_REWARD_POLICY.milestones), "player_reward.event_type");
  requireArray(existingEntitlements, "player_reward.existing_entitlements");
  invariant(eventEvidence === null, "CALLER_SUPPLIED_PLAYER_REWARD_EVENT_EVIDENCE_FORBIDDEN", "Player reward evidence must be referenced by repository-owned attestation ID");
  invariant(walletControlProof === null, "CALLER_SUPPLIED_PLAYER_REWARD_WALLET_CONTROL_FORBIDDEN", "Player wallet control must be referenced by repository-owned attestation ID");
  const verifiedEventEvidence = CANONICAL_KAIOS_PLAYER_REWARD_EVENT_ATTESTATIONS.find((item) => item.attestation_id === rewardEventAttestationId);
  invariant(verifiedEventEvidence, "PLAYER_REWARD_EVENT_ATTESTATION_NOT_CONNECTED", "The exact repository-owned player reward event attestation is not connected");
  const verifiedWalletControl = CANONICAL_KAIOS_WALLET_CONTROL_ATTESTATIONS.find((item) => item.attestation_id === walletControlAttestationId);
  invariant(verifiedWalletControl, "PLAYER_REWARD_WALLET_ATTESTATION_NOT_CONNECTED", "The exact repository-owned wallet-control attestation is not connected");
  invariant(!existingEntitlements.some((item) => item.entitlement_id === entitlementId || item.event_id === eventId), "PLAYER_REWARD_REPLAY", "A verified game event may create only one KAIOS entitlement");
  invariant(verifiedWalletControl.status === "REPOSITORY_VERIFIED_WALLET_CONTROL" && verifiedWalletControl.authentication_method === "EIP191_PERSONAL_SIGN", "PLAYER_REWARD_WALLET_CONTROL_REQUIRED", "Player KAIOS entitlement requires repository-verified EIP-191 wallet control");
  invariant(verifiedWalletControl.actor_id === playerId && Number(verifiedWalletControl.chain_id) === KAIOS_PLAYER_REWARD_POLICY.chain_id, "PLAYER_REWARD_WALLET_BINDING_MISMATCH", "Wallet attestation must bind the exact player and BSC chain 56");
  const walletAddress = normalizeEmploymentWallet(verifiedWalletControl.wallet_address);
  invariant(verifiedEventEvidence.status === "REPOSITORY_VERIFIED_EVENT" && verifiedEventEvidence.activity_type === KAIOS_REWARD_EVIDENCE_ACTIVITY[eventType], "PLAYER_REWARD_EVENT_NOT_VERIFIED", "Reward entitlement requires repository-verified evidence for the exact milestone");
  invariant(verifiedEventEvidence.player_id === playerId && verifiedEventEvidence.life_id === lifeId && verifiedEventEvidence.event_id === eventId, "PLAYER_REWARD_EVENT_BINDING_MISMATCH", "Reward attestation must bind the exact player, Life and event");
  invariant(verifiedEventEvidence.same_controller_self_match !== true && verifiedEventEvidence.wash_trade !== true && verifiedEventEvidence.fake_volume !== true, "PLAYER_REWARD_INVALID_ACTIVITY", "Self-match, wash trade and fake volume can never earn KAIOS");
  if (eventType === "FIRST_K11520_SETTLED_TRADE") {
    invariant(verifiedEventEvidence.receipt_attestation_id && verifiedEventEvidence.receipt_status === 1 && /^0x[0-9a-fA-F]{64}$/.test(String(verifiedEventEvidence.transaction_hash ?? "")), "PLAYER_REWARD_MARKET_RECEIPT_REQUIRED", "First-trade reward requires an exact repository-owned successful settlement receipt attestation");
  }
  const occurred = parseEmploymentTime(occurredAt, "player_reward.occurred_at");
  const rule = KAIOS_PLAYER_REWARD_POLICY.milestones[eventType];
  if (rule.repeat === "ONCE_PER_LIFE") {
    invariant(!existingEntitlements.some((item) => item.life_id === lifeId && item.event_type === eventType), "PLAYER_REWARD_MILESTONE_ALREADY_GRANTED", "This Life already has the one-time milestone entitlement");
  } else {
    const day = new Date(occurred).toISOString().slice(0, 10);
    const dailyCount = existingEntitlements.filter((item) => item.life_id === lifeId && item.event_type === eventType && String(item.occurred_at).slice(0, 10) === day).length;
    invariant(dailyCount < KAIOS_PLAYER_REWARD_POLICY.daily_quest_limit, "PLAYER_REWARD_DAILY_LIMIT", "Daily quest KAIOS entitlement limit has been reached");
  }
  return Object.freeze({
    entitlement_id: entitlementId,
    policy_id: KAIOS_PLAYER_REWARD_POLICY.policy_id,
    player_id: playerId,
    life_id: lifeId,
    event_type: eventType,
    event_id: eventId,
    reward_event_attestation_id: verifiedEventEvidence.attestation_id,
    wallet_control_attestation_id: verifiedWalletControl.attestation_id,
    recipient_address: walletAddress,
    asset: KAIOS_PLAYER_REWARD_POLICY.asset,
    chain_id: KAIOS_PLAYER_REWARD_POLICY.chain_id,
    token_address: KAIOS_PLAYER_REWARD_POLICY.token_address.toLowerCase(),
    amount_kaios_wei: rule.amount_kaios_wei,
    payment_purpose: KAIOS_PLAYER_REWARD_POLICY.payment_purpose,
    accounting_class: KAIOS_PLAYER_REWARD_POLICY.accounting_class,
    occurred_at: occurredAt,
    paid: false,
    payment_id: null,
    receipt: null,
    status: "ACCRUED_AWAITING_BOUND_FUNDING_EXACT_AUTHORIZATION_SIGNER_AND_RECEIPT"
  });
}

export function evaluateKaiosRewardBudgetSimulation({
  entitlement, treasuryBalanceKaiosWei, genesisCommittedKaiosWei,
  dailyCommittedKaiosWei, walletFixedMilestoneCommittedKaiosWei,
  lifeFixedMilestoneCommittedKaiosWei
}) {
  invariant(entitlement?.policy_id === KAIOS_PLAYER_REWARD_POLICY.policy_id && entitlement.paid === false, "KAIOS_REWARD_ENTITLEMENT_REQUIRED", "Budget simulation requires an unpaid KAIOS Player Reward entitlement");
  const rewardAttestation = CANONICAL_KAIOS_PLAYER_REWARD_EVENT_ATTESTATIONS.find((item) => item.attestation_id === entitlement.reward_event_attestation_id);
  invariant(rewardAttestation && rewardAttestation.event_id === entitlement.event_id && rewardAttestation.player_id === entitlement.player_id && rewardAttestation.life_id === entitlement.life_id, "KAIOS_REWARD_ENTITLEMENT_PROVENANCE_NOT_CONNECTED", "Budget simulation requires a repository-bound reward entitlement provenance");
  const amount = requirePositiveKaiosWei(entitlement.amount_kaios_wei, "reward_budget.amount_kaios_wei");
  const treasury = BigInt(treasuryBalanceKaiosWei);
  const genesisCommitted = BigInt(genesisCommittedKaiosWei);
  const dailyCommitted = BigInt(dailyCommittedKaiosWei);
  const walletCommitted = BigInt(walletFixedMilestoneCommittedKaiosWei);
  const lifeCommitted = BigInt(lifeFixedMilestoneCommittedKaiosWei);
  for (const [field, value] of Object.entries({ treasury, genesisCommitted, dailyCommitted, walletCommitted, lifeCommitted })) invariant(value >= 0n, "KAIOS_REWARD_BUDGET_VALUE_INVALID", `${field} cannot be negative`);
  const fixedMilestone = entitlement.event_type !== "DAILY_QUEST_VERIFIED";
  invariant(genesisCommitted + amount <= BigInt(KAIOS_PLAYER_REWARD_POLICY.global_genesis_reward_budget_kaios_wei), "KAIOS_REWARD_GLOBAL_BUDGET_EXCEEDED", "Genesis reward budget would be exceeded");
  if (!fixedMilestone) invariant(dailyCommitted + amount <= BigInt(KAIOS_PLAYER_REWARD_POLICY.daily_reward_budget_kaios_wei), "KAIOS_REWARD_DAILY_BUDGET_EXCEEDED", "Daily reward budget would be exceeded");
  if (fixedMilestone) {
    invariant(walletCommitted + amount <= BigInt(KAIOS_PLAYER_REWARD_POLICY.per_wallet_fixed_milestone_cap_kaios_wei), "KAIOS_REWARD_WALLET_CAP_EXCEEDED", "Per-wallet fixed milestone cap would be exceeded");
    invariant(lifeCommitted + amount <= BigInt(KAIOS_PLAYER_REWARD_POLICY.per_life_fixed_milestone_cap_kaios_wei), "KAIOS_REWARD_LIFE_CAP_EXCEEDED", "Per-Life fixed milestone cap would be exceeded");
  }
  invariant(treasury >= amount && treasury - amount >= BigInt(KAIOS_PLAYER_REWARD_POLICY.treasury_minimum_reserve_kaios_wei), "KAIOS_REWARD_TREASURY_RESERVE_VIOLATION", "Reward would breach the Treasury minimum reserve");
  return Object.freeze({
    entitlement_id: entitlement.entitlement_id,
    amount_kaios_wei: amount.toString(),
    policy_budget_simulation: "PASS",
    policy_pause_switch: KAIOS_PLAYER_REWARD_POLICY.pause_switch,
    may_enter_payment_rail: false,
    budget_attestation_required: true,
    exact_payment_authorization_required: true,
    real_transfer: false,
    status: "SIMULATION_PASS_AWAITING_REPOSITORY_BOUND_BUDGET_ATTESTATION_AND_PAYMENT_GATES"
  });
}

export function createKaiosLiquidityGenesisSimulation({
  simulationId, pairId, kaiosAmountWei, counterAssetAmountWei,
  treasuryBalanceKaiosWei, referencePriceSource, createdAt
}) {
  requireId(simulationId, "kaios_lp.simulation_id");
  requireEnum(pairId, Object.keys(KAIOS_LIQUIDITY_GENESIS_POLICY.candidate_pairs), "kaios_lp.pair_id");
  invariant(typeof referencePriceSource === "string" && referencePriceSource.trim().length >= 3, "KAIOS_LP_REFERENCE_REQUIRED", "LP simulation requires an explicit reference-price source");
  parseEmploymentTime(createdAt, "kaios_lp.created_at");
  const kaios = requirePositiveKaiosWei(kaiosAmountWei, "kaios_lp.kaios_amount_wei");
  const counterAsset = requirePositiveKaiosWei(counterAssetAmountWei, "kaios_lp.counter_asset_amount_wei");
  const treasury = BigInt(treasuryBalanceKaiosWei);
  invariant(treasury >= 0n, "KAIOS_LP_TREASURY_BALANCE_INVALID", "Treasury balance cannot be negative");
  invariant(kaios <= BigInt(KAIOS_LIQUIDITY_GENESIS_POLICY.maximum_kaios_genesis_allocation_wei), "KAIOS_LP_ALLOCATION_EXCEEDED", "LP candidate exceeds the maximum KAIOS Genesis allocation");
  invariant(treasury >= kaios && treasury - kaios >= BigInt(KAIOS_LIQUIDITY_GENESIS_POLICY.treasury_minimum_reserve_kaios_wei), "KAIOS_LP_TREASURY_RESERVE_VIOLATION", "LP candidate would breach the Treasury minimum reserve");
  const pair = KAIOS_LIQUIDITY_GENESIS_POLICY.candidate_pairs[pairId];
  return Object.freeze({
    simulation_id: simulationId,
    policy_id: KAIOS_LIQUIDITY_GENESIS_POLICY.policy_id,
    reuse_product_id: KAIOS_LIQUIDITY_GENESIS_POLICY.reuse_product_id,
    pair_id: pairId,
    chain_id: KAIOS_LIQUIDITY_GENESIS_POLICY.chain_id,
    kaios_token_address: KAIOS_LIQUIDITY_GENESIS_POLICY.kaios_token_address.toLowerCase(),
    counter_asset: pair.counter_asset,
    counter_asset_address: pair.counter_asset_address.toLowerCase(),
    kaios_amount_wei: kaios.toString(),
    counter_asset_amount_wei: counterAsset.toString(),
    reference_price_source: referencePriceSource,
    reference_price_verified: false,
    target_maximum_price_impact_bps: KAIOS_LIQUIDITY_GENESIS_POLICY.target_maximum_price_impact_bps,
    preview_slippage_bps: KAIOS_LIQUIDITY_GENESIS_POLICY.default_preview_slippage_bps,
    accounting_class: "LIQUIDITY_PROVISION",
    dex_price_is_11520_ct: false,
    lp_token_owner: "NOT_ASSIGNED_POLICY_REQUIRED",
    withdrawal_authority: KAIOS_LIQUIDITY_GENESIS_POLICY.withdrawal_authority,
    chain_write: false,
    real_lp_created: false,
    created_at: createdAt,
    status: "SIMULATION_ONLY_AWAITING_PRICE_BUDGET_GOVERNANCE_TREASURY_SIGNER_AND_RECEIPT"
  });
}

export function createKaiosEconomyEvidenceSnapshot({
  snapshotId, asOf, snapshotAttestationId = null, evidenceStatus = "NOT_CONNECTED", holderRecords = [],
  entitlements = [], payments = [], trades = [], resourceAccounts = [],
  companyAccounts = [], liquiditySnapshots = [], treasuryBalanceKaiosWei = null
}) {
  requireId(snapshotId, "kaios_economy.snapshot_id");
  parseEmploymentTime(asOf, "kaios_economy.as_of");
  for (const [field, value] of Object.entries({ holderRecords, entitlements, payments, trades, resourceAccounts, companyAccounts, liquiditySnapshots })) requireArray(value, `kaios_economy.${field}`);
  const callerClaimsConnectedEvidence = evidenceStatus !== "NOT_CONNECTED" || holderRecords.length > 0 || entitlements.length > 0 || payments.length > 0 || trades.length > 0 || resourceAccounts.length > 0 || companyAccounts.length > 0 || liquiditySnapshots.length > 0 || treasuryBalanceKaiosWei !== null;
  const snapshotAttestation = CANONICAL_KAIOS_ECONOMY_SNAPSHOT_ATTESTATIONS.find((item) => item.attestation_id === snapshotAttestationId);
  if (snapshotAttestationId === null) invariant(!callerClaimsConnectedEvidence, "CALLER_SUPPLIED_KAIOS_ECONOMY_EVIDENCE_FORBIDDEN", "Connected economy evidence must come from a repository-owned exact snapshot attestation");
  else invariant(snapshotAttestation, "KAIOS_ECONOMY_SNAPSHOT_ATTESTATION_NOT_CONNECTED", "The exact repository-owned economy snapshot attestation is not connected");
  if (snapshotAttestation) {
    invariant(snapshotAttestation.snapshot_id === snapshotId && snapshotAttestation.as_of === asOf && snapshotAttestation.status === "REPOSITORY_OR_CHAIN_VERIFIED", "KAIOS_ECONOMY_SNAPSHOT_BINDING_MISMATCH", "Economy snapshot attestation must bind the exact snapshot ID and observation time");
    evidenceStatus = snapshotAttestation.status;
    holderRecords = snapshotAttestation.holder_records ?? [];
    entitlements = snapshotAttestation.entitlements ?? [];
    payments = snapshotAttestation.payments ?? [];
    trades = snapshotAttestation.trades ?? [];
    resourceAccounts = snapshotAttestation.resource_accounts ?? [];
    companyAccounts = snapshotAttestation.company_accounts ?? [];
    liquiditySnapshots = snapshotAttestation.liquidity_snapshots ?? [];
    treasuryBalanceKaiosWei = snapshotAttestation.treasury_balance_kaios_wei ?? null;
  }
  const connected = Boolean(snapshotAttestation);
  const unknown = () => "UNKNOWN";
  const verifiedHolders = connected ? holderRecords.filter((item) => item.evidence_status === "VERIFIED_CHAIN_INDEXER" && /^0x[0-9a-fA-F]{40}$/.test(String(item.address ?? "")) && BigInt(item.balance_kaios_wei ?? "0") > 0n) : [];
  const uniqueHolders = new Map(verifiedHolders.map((item) => [item.address.toLowerCase(), item]));
  const paid = connected ? payments.filter((item) => item.receipt_status === 1 && /^0x[0-9a-fA-F]{64}$/.test(String(item.transaction_hash ?? ""))) : [];
  const settledTrades = connected ? trades.filter((item) => item.status === "VERIFIED_SETTLED" && item.receipt_status === 1 && item.self_match !== true && item.wash_trade !== true) : [];
  const sum = (records, field) => records.reduce((total, item) => total + BigInt(item[field] ?? "0"), 0n).toString();
  const holderCount = (type) => [...uniqueHolders.values()].filter((item) => item.holder_type === type).length;
  return Object.freeze({
    snapshot_id: snapshotId,
    as_of: asOf,
    evidence_status: evidenceStatus,
    snapshot_attestation_id: snapshotAttestation?.attestation_id ?? null,
    holders: Object.freeze({
      total: connected ? uniqueHolders.size : unknown(),
      active: connected ? [...uniqueHolders.values()].filter((item) => item.active === true).length : unknown(),
      player: connected ? holderCount("PLAYER") : unknown(),
      ai_life: connected ? holderCount("AI_LIFE") : unknown(),
      employee: connected ? holderCount("EMPLOYEE") : unknown(),
      resource_accounts: connected ? resourceAccounts.filter((item) => item.account_type === "PROGRAMMATIC_LEDGER_SUBACCOUNT").length : unknown(),
      company_accounts: connected ? companyAccounts.length : unknown()
    }),
    circulation: Object.freeze({
      accrued_kaios_wei: connected ? sum(entitlements.filter((item) => item.paid === false), "amount_kaios_wei") : unknown(),
      paid_kaios_wei: connected ? sum(paid, "amount_kaios_wei") : unknown(),
      recirculated_kaios_wei: connected ? sum(paid.filter((item) => item.direction === "PLAYER_TO_CIVILIZATION"), "amount_kaios_wei") : unknown()
    }),
    market: Object.freeze({
      verified_trades: connected ? settledTrades.length : unknown(),
      volume_kaios_wei: connected ? sum(settledTrades, "settlement_amount_kaios_wei") : unknown(),
      ct: connected && settledTrades.length ? settledTrades.at(-1).price : null
    }),
    liquidity: Object.freeze({
      dex_liquidity: connected && liquiditySnapshots.length ? liquiditySnapshots.at(-1).depth : unknown(),
      lp_status: connected && liquiditySnapshots.length ? liquiditySnapshots.at(-1).status : "NOT_CONNECTED"
    }),
    treasury: Object.freeze({
      balance_kaios_wei: connected && treasuryBalanceKaiosWei !== null ? BigInt(treasuryBalanceKaiosWei).toString() : unknown(),
      genesis_reward_budget_kaios_wei: KAIOS_PLAYER_REWARD_POLICY.global_genesis_reward_budget_kaios_wei,
      daily_reward_budget_kaios_wei: KAIOS_PLAYER_REWARD_POLICY.daily_reward_budget_kaios_wei,
      minimum_reserve_kaios_wei: KAIOS_PLAYER_REWARD_POLICY.treasury_minimum_reserve_kaios_wei
    }),
    fabricated_metrics: false,
    status: connected ? "EVIDENCE_SNAPSHOT" : "NOT_CONNECTED_SHOW_UNKNOWN"
  });
}

export function createResourceLedgerSubaccount({ accountId, designationId, createdAt }) {
  requireId(accountId, "resource_account.account_id");
  requireId(designationId, "resource_account.designation_id");
  const designation = CANONICAL_KAIOS_RESOURCE_ACCOUNT_DESIGNATIONS.find((item) => item.designation_id === designationId);
  invariant(designation, "RESOURCE_ACCOUNT_DESIGNATION_NOT_CONNECTED", "The exact repository-owned resource account designation is not connected");
  invariant(designation.status === "REPOSITORY_DESIGNATED_RESOURCE_ACCOUNT" && designation.account_id === accountId, "RESOURCE_ACCOUNT_DESIGNATION_BINDING_MISMATCH", "Resource account designation must bind the exact account ID");
  requireId(designation.node_id, "resource_account.node_id");
  invariant(typeof designation.node_name === "string" && designation.node_name.trim().length > 0, "RESOURCE_NODE_NAME_REQUIRED", "Resource account requires the canonical node name");
  invariant(typeof designation.canonical_location === "string" && designation.canonical_location.trim().length > 0, "RESOURCE_CANONICAL_LOCATION_REQUIRED", "Resource account requires a canonical location reference");
  requireArray(designation.resource_types, "resource_account.resource_types");
  invariant(designation.resource_types.length > 0 && new Set(designation.resource_types).size === designation.resource_types.length && designation.resource_types.every((item) => /^[A-Z][A-Z0-9_]{1,63}$/.test(item)), "RESOURCE_TYPES_INVALID", "Resource account requires unique canonical resource types");
  parseEmploymentTime(createdAt, "resource_account.created_at");
  return Object.freeze({
    account_id: accountId,
    designation_id: designation.designation_id,
    account_type: "PROGRAMMATIC_LEDGER_SUBACCOUNT",
    node_id: designation.node_id,
    node_name: designation.node_name,
    canonical_location: designation.canonical_location,
    economic_owner: designation.node_id,
    resource_types: Object.freeze([...designation.resource_types]),
    chain_id: 56,
    public_address: null,
    eoa_private_key_created: false,
    can_accrue_entitlements: true,
    can_receive_chain_payment: false,
    created_at: createdAt,
    status: "ACTIVE_LEDGER_ONLY_AWAITING_RESOURCE_SMART_ACCOUNT_OR_TEMPORARY_CUSTODY_ROUTE"
  });
}

export function createTemporaryResourceCustodyBindingCandidate({
  bindingId, resourceAccount, publicAddress, custodianId, walletControlProof = null,
  walletControlAttestationId = null, custodyDesignationId = null,
  purpose, asset = "KAIOS", maxAmountKaiosWei, validFrom, validUntil,
  humanDecisionId = null, existingBindings = []
}) {
  requireId(bindingId, "resource_custody.binding_id");
  invariant(walletControlProof === null, "CALLER_SUPPLIED_RESOURCE_CUSTODY_WALLET_CONTROL_FORBIDDEN", "Temporary custody wallet control must be referenced by repository-owned attestation ID");
  invariant(humanDecisionId === null, "CALLER_SUPPLIED_RESOURCE_CUSTODY_DECISION_FORBIDDEN", "Temporary custody Human decisions must come from a repository-owned exact designation");
  const custodyDesignation = CANONICAL_KAIOS_RESOURCE_CUSTODY_DESIGNATIONS.find((item) => item.designation_id === custodyDesignationId);
  invariant(custodyDesignation, "RESOURCE_CUSTODY_DESIGNATION_NOT_CONNECTED", "The exact repository-owned temporary custody designation is not connected");
  const verifiedWalletControl = CANONICAL_KAIOS_WALLET_CONTROL_ATTESTATIONS.find((item) => item.attestation_id === walletControlAttestationId);
  invariant(verifiedWalletControl, "RESOURCE_CUSTODY_WALLET_ATTESTATION_NOT_CONNECTED", "The exact repository-owned custodian wallet-control attestation is not connected");
  invariant(resourceAccount?.account_type === "PROGRAMMATIC_LEDGER_SUBACCOUNT" && CANONICAL_KAIOS_RESOURCE_ACCOUNT_DESIGNATIONS.some((item) => item.designation_id === resourceAccount.designation_id), "RESOURCE_LEDGER_ACCOUNT_REQUIRED", "Temporary custody must reference a repository-designated canonical resource ledger subaccount");
  requireArray(existingBindings, "resource_custody.existing_bindings");
  invariant(!existingBindings.some((item) => item.binding_id === bindingId), "RESOURCE_CUSTODY_BINDING_REPLAY", "Temporary custody binding IDs are append-only and cannot be reused");
  invariant(asset === "KAIOS", "RESOURCE_CUSTODY_ASSET_INVALID", "This temporary resource custody candidate is bound only to KAIOS");
  invariant(custodyDesignation.status === "REPOSITORY_DESIGNATED_TEMPORARY_RESOURCE_CUSTODY" && custodyDesignation.binding_id === bindingId && custodyDesignation.account_id === resourceAccount.account_id && custodyDesignation.node_id === resourceAccount.node_id, "RESOURCE_CUSTODY_DESIGNATION_BINDING_MISMATCH", "Custody designation must bind the exact binding, account and node");
  requireId(custodyDesignation.human_decision_id, "resource_custody.human_decision_id");
  invariant(custodyDesignation.custodian_id === custodianId && custodyDesignation.purpose === purpose && custodyDesignation.asset === asset, "RESOURCE_CUSTODY_DESIGNATION_SCOPE_MISMATCH", "Custody designation must bind the exact custodian, purpose and asset");
  const address = normalizeEmploymentWallet(publicAddress);
  invariant(verifiedWalletControl.status === "REPOSITORY_VERIFIED_WALLET_CONTROL" && verifiedWalletControl.authentication_method === "EIP191_PERSONAL_SIGN", "RESOURCE_CUSTODY_WALLET_CONTROL_REQUIRED", "Temporary Human custody requires repository-verified public-address control");
  invariant(verifiedWalletControl.actor_id === custodianId && Number(verifiedWalletControl.chain_id) === 56 && normalizeEmploymentWallet(verifiedWalletControl.wallet_address) === address, "RESOURCE_CUSTODY_WALLET_BINDING_MISMATCH", "Custodian attestation must bind the exact Human, address and chain");
  const maximum = requirePositiveKaiosWei(maxAmountKaiosWei, "resource_custody.max_amount_kaios_wei");
  invariant(maximum.toString() === String(custodyDesignation.max_amount_kaios_wei), "RESOURCE_CUSTODY_AMOUNT_BINDING_MISMATCH", "Custody designation must bind the exact maximum amount");
  const starts = parseEmploymentTime(validFrom, "resource_custody.valid_from");
  const ends = parseEmploymentTime(validUntil, "resource_custody.valid_until");
  invariant(validFrom === custodyDesignation.valid_from && validUntil === custodyDesignation.valid_until && ends > starts && ends - starts <= 90 * 24 * 60 * 60 * 1000, "RESOURCE_CUSTODY_VALIDITY_INVALID", "Temporary resource custody must match the designation and expire within 90 days");
  return Object.freeze({
    binding_id: bindingId,
    custody_designation_id: custodyDesignation.designation_id,
    wallet_control_attestation_id: verifiedWalletControl.attestation_id,
    node_id: resourceAccount.node_id,
    account_id: resourceAccount.account_id,
    canonical_location: resourceAccount.canonical_location,
    chain_id: 56,
    public_address: address,
    account_role: "TEMPORARY_CUSTODY_RECEIVER",
    economic_owner: resourceAccount.node_id,
    custodian: custodianId,
    purpose,
    asset,
    max_amount_kaios_wei: maximum.toString(),
    valid_from: validFrom,
    valid_until: validUntil,
    human_decision_id: custodyDesignation.human_decision_id,
    migration_policy: "FREEZE_ROUTE_RECONCILE_CREATE_VERIFIED_RESOURCE_ACCOUNT_MIGRATE_WITH_EXACT_AUTHORITY_RETIRE_TEMPORARY_ROUTE",
    canonical_node_wallet: false,
    company_or_human_owns_node_assets: false,
    payment_authority: false,
    status: "CANDIDATE_AWAITING_PAYMENT_AUTHORITY"
  });
}

// A temporary Human payment designation is authority-bearing provenance.
// Runtime callers may reference only a designation reviewed into this
// repository-owned allowlist; they may never inject the designation record.
// It remains empty until exact Human/governance provenance is connected.
export const CANONICAL_KAIOS_TEMPORARY_HUMAN_PAYMENT_DESIGNATIONS = Object.freeze([]);

// A signer policy may be referenced only after it is reviewed into this
// repository-owned allowlist. Keeping it empty prevents a browser or caller
// from converting an arbitrary JSON object into signing authority.
export const CANONICAL_KAIOS_PAYMENT_SIGNER_POLICIES = Object.freeze([]);

// Receipt observations may become settlement truth only after a trusted
// external observer has produced an exact, repository-owned attestation.
// Keeping this allowlist empty prevents caller-supplied receipt fields or a
// `chain_observation_verified=true` flag from self-authorizing PAID state.
export const CANONICAL_KAIOS_PAYMENT_RECEIPT_ATTESTATIONS = Object.freeze([]);

// Real-action authorization can only come from reviewed repository-owned records.
// Keeping this allowlist empty prevents caller-supplied authority-shaped objects,
// VERIFIED strings, arbitrary SHAs or timestamps from advancing an execution gate.
export const CANONICAL_CIVILIZATION_REAL_ACTION_AUTHORIZATIONS = Object.freeze([]);

export const CIVILIZATION_REAL_ACTION_TYPES = Object.freeze([
  "MERGE", "MAIN_PUSH", "RELEASE", "DEPLOYMENT", "PAYMENT", "PAYROLL", "TRADE",
  "TOKEN_TRANSFER", "TREASURY_OPERATION", "MAINNET_WRITE", "TESTNET_WRITE", "GOVERNANCE_EXECUTION"
]);

export const CIVILIZATION_PERMANENTLY_FORBIDDEN_ACTIONS = Object.freeze([
  "PRIVATE_KEY_OUTPUT", "SEED_PHRASE_OUTPUT"
]);

export const CIVILIZATION_REAL_EXECUTION_POLICY = Object.freeze({
  policy_id: "KAIOS_CIVILIZATION_REAL_EXECUTION_POLICY_V1",
  default: "DENY_UNLESS_EXACT_MACHINE_VERIFIABLE_AUTHORIZATION",
  unauthorized_action: "PERMANENTLY_FORBIDDEN",
  exact_authorized_action: "MAY_PROCEED_TO_ACTION_SPECIFIC_EXECUTION_GATES",
  private_key_output: "PERMANENTLY_FORBIDDEN",
  seed_phrase_output: "PERMANENTLY_FORBIDDEN",
  business_approver_is_signer: false,
  signer_is_settlement_verifier: false,
  policy_evaluation_creates_execution_authority: false
});

export const EXACT_REAL_ACTION_BINDING_FIELDS = Object.freeze([
  "action_id", "action_type", "actor", "purpose", "chain_id", "target", "asset", "token_address_if_applicable", "source",
  "recipient", "amount", "function_selector_if_applicable", "nonce_or_replay_key", "policy_hash",
  "repository_head_if_relevant"
]);

export const KAIOS_AI_OS_FIRST_REAL_EMPLOYMENT_TEST_JOB = Object.freeze({
  job_id: "KAIOS_AI_OS_FIRST_EMPLOYMENT_ORIENTATION",
  company_id: "AI_ANT_COMPANY_0001",
  title: "KAIOS AI OS First Employment Orientation",
  actor_types: Object.freeze(["HUMAN_PLAYER", "AI_LIFE"]),
  location_id: "DIGITAL_KAIOS_AI_OS",
  destination_id: "DIGITAL_KAIOS_AI_OS",
  role: "EMPLOYMENT_INTEGRATION_TESTER",
  payment_asset: "KAIOS",
  reward_kaios_wei: "10000",
  proof_requirements: Object.freeze([
    "MISSION_ACCEPTED",
    "IDENTITY_VERIFIED",
    "ORIENTATION_COMPLETED",
    "EMPLOYEE_CONFIRMATION"
  ]),
  real_cargo: false,
  real_payment: true,
  settlement_status: "REAL_PAYMENT_REQUIRES_EXACT_AUTHORITY_FUNDING_AND_RECEIPT",
  status: "OPEN_REAL_TEST_PENDING_AUTHORITY"
});

export const REPOSITORY_BOUND_COMPANY_AUTHORITY_SCOPES = Object.freeze([
  "COMPANY_INTERVIEW", "EMPLOYMENT_DECISION", "EMPLOYEE_CREATE", "WORKER_ACTIVATE",
  "MISSION_DISPATCH", "WORK_REVIEW", "COMPENSATION_ACCRUAL", "PAYROLL_QUEUE",
  "PAYROLL_FUNDING", "PAYROLL_SETTLEMENT_VERIFY", "ATM_PAYROLL_ADVANCE"
]);

// This allowlist is deliberately repository-owned and empty until a reviewed
// Company governance record grants one of the scopes above. Runtime callers
// may reference an authority ID, but they cannot supply or mutate authority
// metadata and thereby turn an untrusted claim into Company authority.
export const CANONICAL_REPOSITORY_COMPANY_AUTHORITIES = Object.freeze([]);

export const COMPANY_OPERATIONAL_AUTHORITY_PROPOSAL_SCOPES = Object.freeze([
  "COMPANY_INTERVIEW", "EMPLOYMENT_DECISION", "EMPLOYEE_CREATE", "MISSION_DISPATCH",
  "WORK_REVIEW", "COMPENSATION_ACCRUAL", "PAYROLL_QUEUE"
]);

export function createRepositoryCompanyAuthorityProposal({
  proposalId, companyId, candidateActorId, candidateControllerId, role, policyVersion,
  requestedScopes, validFrom, validUntil, evidence, exactRepositoryVersion, proposedBy, proposedAt
}) {
  requireId(proposalId, "company_authority_proposal_id");
  requireId(companyId, "company_authority_proposal.company_id");
  requireId(candidateActorId, "company_authority_proposal.candidate_actor_id");
  requireId(candidateControllerId, "company_authority_proposal.candidate_controller_id");
  requireId(proposedBy, "company_authority_proposal.proposed_by");
  requireArray(requestedScopes, "company_authority_proposal.requested_scopes");
  requireArray(evidence, "company_authority_proposal.evidence");
  invariant(proposedBy !== candidateActorId, "COMPANY_AUTHORITY_SELF_PROPOSAL_FORBIDDEN", "Matching candidate and proposer identifier strings are forbidden; this string check is not identity proof");
  invariant(typeof role === "string" && role.length > 0 && typeof policyVersion === "string" && policyVersion.length > 0, "COMPANY_AUTHORITY_PROPOSAL_POLICY_REQUIRED", "A Company authority proposal requires role and policy version");
  invariant(requestedScopes.length > 0 && new Set(requestedScopes).size === requestedScopes.length && requestedScopes.every((scope) => COMPANY_OPERATIONAL_AUTHORITY_PROPOSAL_SCOPES.includes(scope)), "COMPANY_AUTHORITY_PROPOSAL_SCOPE_INVALID", "A Company authority proposal candidate may request only unique proposal-eligible scopes; activation is separately governed");
  invariant(evidence.length > 0 && evidence.every((item) => typeof item === "string" && item.length > 0), "COMPANY_AUTHORITY_PROPOSAL_EVIDENCE_REQUIRED", "A Company authority proposal requires evidence references");
  invariant(/^[0-9a-f]{40}$/i.test(String(exactRepositoryVersion ?? "")), "COMPANY_AUTHORITY_PROPOSAL_REPOSITORY_VERSION_INVALID", "A Company authority proposal candidate requires a SHA-shaped repository version claim; this is not repository provenance");
  const proposed = parseEmploymentTime(proposedAt, "company_authority_proposal.proposed_at");
  const starts = parseEmploymentTime(validFrom, "company_authority_proposal.valid_from");
  const ends = parseEmploymentTime(validUntil, "company_authority_proposal.valid_until");
  invariant(starts >= proposed && ends > starts, "COMPANY_AUTHORITY_PROPOSAL_WINDOW_INVALID", "Proposed authority must start no earlier than the proposal and end after it starts");
  return Object.freeze({
    record_class: "UNVERIFIED_COMPANY_AUTHORITY_PROPOSAL_CANDIDATE",
    proposal_id: proposalId,
    authority_id: null,
    company_id: companyId,
    candidate_actor_id: candidateActorId,
    candidate_controller_id: candidateControllerId,
    role,
    policy_version: policyVersion,
    requested_scopes: Object.freeze([...requestedScopes]),
    valid_from: validFrom,
    valid_until: validUntil,
    evidence: Object.freeze([...evidence]),
    exact_repository_version_claim: exactRepositoryVersion,
    repository_version_verified: false,
    proposed_by_claim: proposedBy,
    proposer_identity_verified: false,
    proposed_at: proposedAt,
    active: false,
    usable_as_authority: false,
    activation_requires: Object.freeze([
      "REPOSITORY_VERSION_PROVENANCE_VERIFICATION",
      "PROPOSER_IDENTITY_VERIFICATION",
      "DISTINCT_GOVERNANCE_REVIEW",
      "EXPLICIT_REPOSITORY_ALLOWLIST_CHANGE",
      "EXACT_HEAD_CI"
    ]),
    excluded_scopes: Object.freeze([
      "WORKER_ACTIVATE",
      "PAYROLL_FUNDING",
      "PAYROLL_SETTLEMENT_VERIFY",
      "ATM_PAYROLL_ADVANCE"
    ]),
    status: "UNVERIFIED_PROPOSAL_CANDIDATE_NOT_AUTHORITY"
  });
}

export const COMPANY_AUTHORITY_REVIEW_RECOMMENDATIONS = Object.freeze([
  "RECOMMEND_APPROVE", "REQUEST_CHANGES", "HOLD"
]);

export async function createCompanyAuthorityReviewRequestPacket({
  requestId, proposal, repository, baseShaClaim, headShaClaim, changedFilesClaim,
  ciRunIdsClaim, requiredReviewCapabilities, requestedAt
}) {
  requireId(requestId, "company_authority_review_request.request_id");
  requireArray(changedFilesClaim, "company_authority_review_request.changed_files_claim");
  requireArray(ciRunIdsClaim, "company_authority_review_request.ci_run_ids_claim");
  requireArray(requiredReviewCapabilities, "company_authority_review_request.required_review_capabilities");
  invariant(proposal?.status === "UNVERIFIED_PROPOSAL_CANDIDATE_NOT_AUTHORITY" && proposal.authority_id === null && proposal.active === false, "COMPANY_AUTHORITY_REVIEW_REQUEST_PROPOSAL_REQUIRED", "Review request packet requires an inactive unverified authority proposal candidate");
  invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repository ?? "")), "COMPANY_AUTHORITY_REVIEW_REQUEST_REPOSITORY_INVALID", "Review request packet requires an owner/repository claim");
  invariant(/^[0-9a-f]{40}$/i.test(String(baseShaClaim ?? "")) && /^[0-9a-f]{40}$/i.test(String(headShaClaim ?? "")), "COMPANY_AUTHORITY_REVIEW_REQUEST_SHA_INVALID", "Review request packet requires SHA-shaped base and head claims; these are not repository provenance");
  const normalizedBaseSha = String(baseShaClaim).toLowerCase();
  const normalizedHeadSha = String(headShaClaim).toLowerCase();
  invariant(normalizedBaseSha !== normalizedHeadSha, "COMPANY_AUTHORITY_REVIEW_REQUEST_EMPTY_DIFF", "Review request packet requires distinct base and head claims");
  invariant(changedFilesClaim.length > 0 && new Set(changedFilesClaim).size === changedFilesClaim.length && changedFilesClaim.every((path) => typeof path === "string" && path.length > 0 && !path.includes("..") && !path.startsWith("/") && !/^[A-Za-z]:/.test(path)), "COMPANY_AUTHORITY_REVIEW_REQUEST_FILES_INVALID", "Review request packet requires unique non-traversing repository-relative changed-file claims");
  invariant(ciRunIdsClaim.length > 0 && new Set(ciRunIdsClaim.map(String)).size === ciRunIdsClaim.length && ciRunIdsClaim.every((runId) => /^[1-9][0-9]*$/.test(String(runId))), "COMPANY_AUTHORITY_REVIEW_REQUEST_CI_INVALID", "Review request packet requires unique positive CI run ID claims");
  invariant(requiredReviewCapabilities.length > 0 && new Set(requiredReviewCapabilities).size === requiredReviewCapabilities.length && requiredReviewCapabilities.every((capability) => typeof capability === "string" && capability.length > 0), "COMPANY_AUTHORITY_REVIEW_REQUEST_CAPABILITIES_INVALID", "Review request packet requires unique reviewer capability requirements");
  parseEmploymentTime(requestedAt, "company_authority_review_request.requested_at");
  const proposalPayloadSha256 = await sha256(proposal);
  const packetPayload = Object.freeze({
    request_id: requestId,
    proposal_id: proposal.proposal_id,
    proposal_payload_sha256: proposalPayloadSha256,
    repository,
    base_sha_claim: normalizedBaseSha,
    head_sha_claim: normalizedHeadSha,
    changed_files_claim: Object.freeze([...changedFilesClaim].sort()),
    ci_run_ids_claim: Object.freeze([...ciRunIdsClaim].map(String).sort()),
    required_review_capabilities: Object.freeze([...requiredReviewCapabilities].sort()),
    requested_at: requestedAt
  });
  return Object.freeze({
    record_class: "UNVERIFIED_COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET",
    ...packetPayload,
    packet_payload_sha256: await sha256(packetPayload),
    company_id: proposal.company_id,
    repository_snapshot_verified: false,
    proposal_provenance_verified: false,
    exact_head_ci_verified: false,
    reviewer_assigned: false,
    reviewer_identity_verified: false,
    reviewer_independence_verified: false,
    formal_review_decision: null,
    counts_as_distinct_review: false,
    activation_authorized: false,
    status: "UNVERIFIED_REVIEW_REQUEST_PACKET_AWAITING_PROVENANCE_AND_DISTINCT_REVIEWER"
  });
}

export const COMPANY_PROVENANCE_ATTESTATION_REQUIRED_BINDINGS = Object.freeze([
  "CONNECTOR_IDENTITY",
  "REPOSITORY",
  "BASE_SHA",
  "HEAD_SHA",
  "PROPOSAL_PAYLOAD_SHA256",
  "REVIEW_PACKET_PAYLOAD_SHA256",
  "PROPOSER_ACTOR_ID",
  "OBSERVED_AT",
  "DETACHED_ATTESTATION_SHA256"
]);

export async function createCompanyAuthorityProvenanceAttestationRequest({
  attestationRequestId, proposal, reviewRequestPacket, requestedConnectorClass, requestedAt
}) {
  requireId(attestationRequestId, "company_authority_provenance_attestation_request.attestation_request_id");
  invariant(
    proposal?.record_class === "UNVERIFIED_COMPANY_AUTHORITY_PROPOSAL_CANDIDATE"
      && proposal.status === "UNVERIFIED_PROPOSAL_CANDIDATE_NOT_AUTHORITY"
      && proposal.authority_id === null
      && proposal.active === false,
    "COMPANY_PROVENANCE_ATTESTATION_PROPOSAL_REQUIRED",
    "A provenance attestation request requires an inactive Company authority proposal candidate"
  );
  invariant(
    reviewRequestPacket?.record_class === "UNVERIFIED_COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET"
      && reviewRequestPacket.status === "UNVERIFIED_REVIEW_REQUEST_PACKET_AWAITING_PROVENANCE_AND_DISTINCT_REVIEWER"
      && reviewRequestPacket.activation_authorized === false,
    "COMPANY_PROVENANCE_ATTESTATION_REVIEW_PACKET_REQUIRED",
    "A provenance attestation request requires a non-authoritative review request packet"
  );
  invariant(
    requestedConnectorClass === "TRUSTED_EXTERNAL_READ_ONLY_CONNECTOR",
    "COMPANY_PROVENANCE_ATTESTATION_CONNECTOR_CLASS_INVALID",
    "Proposal provenance must be requested from a trusted external read-only connector"
  );
  parseEmploymentTime(requestedAt, "company_authority_provenance_attestation_request.requested_at");
  const proposalPayloadSha256 = await sha256(proposal);
  const expectedPacketPayloadSha256 = await sha256({
    request_id: reviewRequestPacket.request_id,
    proposal_id: reviewRequestPacket.proposal_id,
    proposal_payload_sha256: reviewRequestPacket.proposal_payload_sha256,
    repository: reviewRequestPacket.repository,
    base_sha_claim: reviewRequestPacket.base_sha_claim,
    head_sha_claim: reviewRequestPacket.head_sha_claim,
    changed_files_claim: reviewRequestPacket.changed_files_claim,
    ci_run_ids_claim: reviewRequestPacket.ci_run_ids_claim,
    required_review_capabilities: reviewRequestPacket.required_review_capabilities,
    requested_at: reviewRequestPacket.requested_at
  });
  invariant(
    reviewRequestPacket.proposal_id === proposal.proposal_id
      && reviewRequestPacket.company_id === proposal.company_id
      && reviewRequestPacket.proposal_payload_sha256 === proposalPayloadSha256
      && reviewRequestPacket.packet_payload_sha256 === expectedPacketPayloadSha256,
    "COMPANY_PROVENANCE_ATTESTATION_INPUT_INTEGRITY_MISMATCH",
    "Proposal and review request packet integrity must match before external provenance is requested"
  );
  const requestPayload = Object.freeze({
    attestation_request_id: attestationRequestId,
    company_id: proposal.company_id,
    proposal_id: proposal.proposal_id,
    proposal_payload_sha256: proposalPayloadSha256,
    review_request_id: reviewRequestPacket.request_id,
    review_packet_payload_sha256: expectedPacketPayloadSha256,
    repository: reviewRequestPacket.repository,
    base_sha_claim: reviewRequestPacket.base_sha_claim,
    head_sha_claim: reviewRequestPacket.head_sha_claim,
    proposer_actor_id_claim: proposal.proposed_by_claim,
    requested_connector_class: requestedConnectorClass,
    required_bindings: COMPANY_PROVENANCE_ATTESTATION_REQUIRED_BINDINGS,
    requested_at: requestedAt
  });
  return Object.freeze({
    record_class: "COMPANY_AUTHORITY_PROVENANCE_ATTESTATION_REQUEST",
    ...requestPayload,
    request_payload_sha256: await sha256(requestPayload),
    connector_id: null,
    connector_identity_verified: false,
    detached_attestation_sha256: null,
    detached_attestation_verified: false,
    repository_snapshot_verified: false,
    exact_head_ci_verified: false,
    proposal_provenance_verified: false,
    proposer_identity_verified: false,
    counts_as_distinct_review: false,
    activation_authorized: false,
    status: "AWAITING_TRUSTED_EXTERNAL_CONNECTOR_ATTESTATION"
  });
}

async function buildReadOnlyGitHubRepositorySnapshot({
  snapshotId, repository, mainSha, prNumber, baseSha, headSha, changedFiles,
  checks, observedAt, adapterId, sourceTransportAttested
}) {
  requireId(snapshotId, "github_repository_snapshot.snapshot_id");
  requireArray(changedFiles, "github_repository_snapshot.changed_files");
  requireArray(checks, "github_repository_snapshot.checks");
  invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repository ?? "")), "GITHUB_REPOSITORY_SNAPSHOT_REPOSITORY_INVALID", "Repository snapshot requires an owner/repository value");
  invariant([mainSha, baseSha, headSha].every((sha) => /^[0-9a-f]{40}$/i.test(String(sha ?? ""))), "GITHUB_REPOSITORY_SNAPSHOT_SHA_INVALID", "Repository snapshot requires SHA-shaped main, base and head values");
  invariant(Number.isInteger(prNumber) && prNumber > 0, "GITHUB_REPOSITORY_SNAPSHOT_PR_INVALID", "Repository snapshot requires a positive Pull Request number");
  invariant(changedFiles.length > 0 && new Set(changedFiles).size === changedFiles.length && changedFiles.every((path) => typeof path === "string" && path.length > 0 && !path.includes("..") && !path.startsWith("/") && !/^[A-Za-z]:/.test(path)), "GITHUB_REPOSITORY_SNAPSHOT_FILES_INVALID", "Repository snapshot requires unique repository-relative changed files");
  invariant(checks.length > 0 && checks.every((check) => check && typeof check === "object" && /^[1-9][0-9]*$/.test(String(check.run_id)) && typeof check.name === "string" && check.name.length > 0 && /^[0-9a-f]{40}$/i.test(String(check.head_sha ?? "")) && ["QUEUED", "IN_PROGRESS", "COMPLETED"].includes(check.status) && [null, "SUCCESS", "FAILURE", "NEUTRAL", "CANCELLED", "SKIPPED", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE", "STALE"].includes(check.conclusion ?? null)), "GITHUB_REPOSITORY_SNAPSHOT_CHECK_INVALID", "Repository snapshot checks require run ID, name, exact head, status and bounded conclusion");
  invariant(new Set(checks.map((check) => String(check.run_id))).size === checks.length, "GITHUB_REPOSITORY_SNAPSHOT_CHECK_DUPLICATE", "Repository snapshot check run IDs must be unique");
  parseEmploymentTime(observedAt, "github_repository_snapshot.observed_at");
  const payload = Object.freeze({
    snapshot_id: snapshotId,
    adapter_id: adapterId,
    repository,
    main_sha: String(mainSha).toLowerCase(),
    pr_number: prNumber,
    base_sha: String(baseSha).toLowerCase(),
    head_sha: String(headSha).toLowerCase(),
    changed_files: Object.freeze([...changedFiles].sort()),
    checks: Object.freeze(checks.map((check) => Object.freeze({
      run_id: String(check.run_id),
      name: check.name,
      head_sha: String(check.head_sha).toLowerCase(),
      status: check.status,
      conclusion: check.conclusion ?? null
    })).sort((left, right) => left.run_id.localeCompare(right.run_id))),
    observed_at: observedAt
  });
  const attested = sourceTransportAttested === true;
  return Object.freeze({
    record_class: attested
      ? "VERIFIED_READ_ONLY_GITHUB_API_REPOSITORY_SNAPSHOT"
      : "UNATTESTED_READ_ONLY_GITHUB_REPOSITORY_SNAPSHOT_CANDIDATE",
    ...payload,
    snapshot_payload_sha256: await sha256(payload),
    read_only: true,
    mutation_authority: false,
    source_transport_attested: attested,
    repository_snapshot_verified: attested,
    status: attested
      ? "VERIFIED_READ_ONLY_GITHUB_API_SNAPSHOT"
      : "UNATTESTED_READ_ONLY_SNAPSHOT_CANDIDATE_NOT_PROVENANCE"
  });
}

export async function createReadOnlyGitHubRepositorySnapshotCandidate(input) {
  return buildReadOnlyGitHubRepositorySnapshot({
    ...input,
    adapterId: "GITHUB_READ_ONLY_SNAPSHOT_ADAPTER_V1",
    sourceTransportAttested: false
  });
}

async function fetchGitHubApiJson(path) {
  const response = await globalThis.fetch(`https://api.github.com${path}`, {
    method: "GET",
    headers: Object.freeze({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "KAIOS-READ-ONLY-REPOSITORY-SNAPSHOT-V1"
    })
  });
  invariant(response?.ok === true, "GITHUB_READ_ONLY_TRANSPORT_FAILED", `GitHub read-only API failed for ${path} with status ${response?.status ?? "UNKNOWN"}`);
  return response.json();
}

async function fetchGitHubApiArrayPages(path) {
  const records = [];
  for (let page = 1; page <= 100; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const batch = await fetchGitHubApiJson(`${path}${separator}per_page=100&page=${page}`);
    invariant(Array.isArray(batch), "GITHUB_READ_ONLY_TRANSPORT_SHAPE_INVALID", `GitHub read-only API expected an array for ${path}`);
    records.push(...batch);
    if (batch.length < 100) return records;
  }
  invariant(false, "GITHUB_READ_ONLY_TRANSPORT_PAGINATION_LIMIT", "GitHub read-only API exceeded the 100-page safety limit");
}

export async function fetchReadOnlyGitHubPullRequestSnapshot({ snapshotId, repository, prNumber, observedAt }) {
  requireId(snapshotId, "github_repository_snapshot.snapshot_id");
  invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repository ?? "")), "GITHUB_REPOSITORY_SNAPSHOT_REPOSITORY_INVALID", "Repository snapshot requires an owner/repository value");
  invariant(Number.isInteger(prNumber) && prNumber > 0, "GITHUB_REPOSITORY_SNAPSHOT_PR_INVALID", "Repository snapshot requires a positive Pull Request number");
  parseEmploymentTime(observedAt, "github_repository_snapshot.observed_at");
  const encodedRepository = repository.split("/").map(encodeURIComponent).join("/");
  const repositoryRecord = await fetchGitHubApiJson(`/repos/${encodedRepository}`);
  invariant(typeof repositoryRecord.default_branch === "string" && repositoryRecord.default_branch.length > 0, "GITHUB_READ_ONLY_DEFAULT_BRANCH_MISSING", "GitHub repository response requires a default branch");
  const pullRequest = await fetchGitHubApiJson(`/repos/${encodedRepository}/pulls/${prNumber}`);
  const branch = await fetchGitHubApiJson(`/repos/${encodedRepository}/branches/${encodeURIComponent(repositoryRecord.default_branch)}`);
  const files = await fetchGitHubApiArrayPages(`/repos/${encodedRepository}/pulls/${prNumber}/files`);
  const runsResponse = await fetchGitHubApiJson(`/repos/${encodedRepository}/actions/runs?head_sha=${encodeURIComponent(pullRequest.head?.sha ?? "")}&per_page=100`);
  invariant(Array.isArray(runsResponse.workflow_runs), "GITHUB_READ_ONLY_RUNS_SHAPE_INVALID", "GitHub Actions response requires workflow_runs");
  const checks = runsResponse.workflow_runs
    .filter((run) => String(run.head_sha ?? "").toLowerCase() === String(pullRequest.head?.sha ?? "").toLowerCase())
    .map((run) => ({
      run_id: String(run.id),
      name: run.name,
      head_sha: run.head_sha,
      status: String(run.status ?? "").toUpperCase(),
      conclusion: run.conclusion === null ? null : String(run.conclusion).toUpperCase()
    }));
  return buildReadOnlyGitHubRepositorySnapshot({
    snapshotId,
    repository,
    mainSha: branch.commit?.sha,
    prNumber,
    baseSha: pullRequest.base?.sha,
    headSha: pullRequest.head?.sha,
    changedFiles: files.map((file) => file.filename),
    checks,
    observedAt,
    adapterId: "GITHUB_API_READ_ONLY_TRANSPORT_UNATTESTED_V1",
    sourceTransportAttested: false
  });
}

export async function verifyCompanyAuthorityReviewRequestSnapshotMatch({ verificationId, requestPacket, snapshot, verifiedAt }) {
  requireId(verificationId, "company_authority_snapshot_match.verification_id");
  invariant(requestPacket?.record_class === "UNVERIFIED_COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET" && requestPacket.counts_as_distinct_review === false && requestPacket.activation_authorized === false, "COMPANY_AUTHORITY_SNAPSHOT_MATCH_REQUEST_REQUIRED", "Snapshot matching requires a non-authoritative review request packet");
  invariant(["UNATTESTED_READ_ONLY_GITHUB_REPOSITORY_SNAPSHOT_CANDIDATE", "VERIFIED_READ_ONLY_GITHUB_API_REPOSITORY_SNAPSHOT"].includes(snapshot?.record_class) && snapshot.read_only === true && snapshot.mutation_authority === false, "COMPANY_AUTHORITY_SNAPSHOT_MATCH_CANDIDATE_REQUIRED", "Snapshot matching accepts only a read-only GitHub snapshot record");
  parseEmploymentTime(verifiedAt, "company_authority_snapshot_match.verified_at");
  const expectedRequestPacketHash = await sha256({
    request_id: requestPacket.request_id,
    proposal_id: requestPacket.proposal_id,
    proposal_payload_sha256: requestPacket.proposal_payload_sha256,
    repository: requestPacket.repository,
    base_sha_claim: requestPacket.base_sha_claim,
    head_sha_claim: requestPacket.head_sha_claim,
    changed_files_claim: requestPacket.changed_files_claim,
    ci_run_ids_claim: requestPacket.ci_run_ids_claim,
    required_review_capabilities: requestPacket.required_review_capabilities,
    requested_at: requestPacket.requested_at
  });
  invariant(expectedRequestPacketHash === requestPacket.packet_payload_sha256, "COMPANY_AUTHORITY_REVIEW_REQUEST_INTEGRITY_MISMATCH", "Review request packet payload hash does not match its contents");
  const expectedSnapshotHash = await sha256({
    snapshot_id: snapshot.snapshot_id,
    adapter_id: snapshot.adapter_id,
    repository: snapshot.repository,
    main_sha: snapshot.main_sha,
    pr_number: snapshot.pr_number,
    base_sha: snapshot.base_sha,
    head_sha: snapshot.head_sha,
    changed_files: snapshot.changed_files,
    checks: snapshot.checks,
    observed_at: snapshot.observed_at
  });
  invariant(expectedSnapshotHash === snapshot.snapshot_payload_sha256, "GITHUB_REPOSITORY_SNAPSHOT_INTEGRITY_MISMATCH", "Repository snapshot payload hash does not match its contents");
  invariant(requestPacket.repository === snapshot.repository && requestPacket.base_sha_claim === snapshot.base_sha && requestPacket.head_sha_claim === snapshot.head_sha, "COMPANY_AUTHORITY_SNAPSHOT_REPOSITORY_HEAD_MISMATCH", "Review request repository, base and head claims must match the observed snapshot candidate");
  invariant(requestPacket.changed_files_claim.length === snapshot.changed_files.length && requestPacket.changed_files_claim.every((path, index) => path === snapshot.changed_files[index]), "COMPANY_AUTHORITY_SNAPSHOT_FILES_MISMATCH", "Review request changed-file claims must exactly match the observed snapshot candidate");
  const claimedChecks = requestPacket.ci_run_ids_claim.map((runId) => snapshot.checks.find((check) => check.run_id === runId));
  invariant(claimedChecks.every(Boolean), "COMPANY_AUTHORITY_SNAPSHOT_CI_RUN_MISSING", "Every claimed CI run must exist in the observed snapshot candidate");
  invariant(claimedChecks.every((check) => check.head_sha === requestPacket.head_sha_claim && check.status === "COMPLETED" && check.conclusion === "SUCCESS"), "COMPANY_AUTHORITY_SNAPSHOT_EXACT_HEAD_CI_MISMATCH", "Every claimed CI run must be a successful completed run on the claimed exact head");
  const transportAttested = snapshot.source_transport_attested === true && snapshot.repository_snapshot_verified === true;
  const matchPayload = Object.freeze({
    verification_id: verificationId,
    request_id: requestPacket.request_id,
    request_packet_payload_sha256: requestPacket.packet_payload_sha256,
    proposal_id: requestPacket.proposal_id,
    snapshot_id: snapshot.snapshot_id,
    snapshot_payload_sha256: snapshot.snapshot_payload_sha256,
    company_id: requestPacket.company_id,
    repository_claim_match: true,
    base_head_claim_match: true,
    changed_files_claim_match: true,
    exact_head_ci_claim_match: true,
    snapshot_integrity_match: true,
    verified_at: verifiedAt
  });
  return Object.freeze({
    record_class: "UNATTESTED_COMPANY_AUTHORITY_REVIEW_SNAPSHOT_MATCH_CANDIDATE",
    ...matchPayload,
    match_payload_sha256: await sha256(matchPayload),
    source_transport_attested: transportAttested,
    repository_snapshot_verified: transportAttested,
    proposal_provenance_verified: false,
    exact_head_ci_verified: transportAttested,
    reviewer_identity_verified: false,
    reviewer_independence_verified: false,
    counts_as_distinct_review: false,
    activation_authorized: false,
    status: transportAttested
      ? "REPOSITORY_AND_EXACT_HEAD_CI_VERIFIED_AWAITING_DISTINCT_REVIEWER_AND_PROPOSAL_PROVENANCE"
      : "CLAIMS_MATCH_UNATTESTED_READ_ONLY_SNAPSHOT_AWAITING_TRUSTED_GITHUB_PROVENANCE"
  });
}

export function createCompanyAuthorityProposalReviewCandidate({
  reviewId, proposal, reviewerIdClaim, reviewerControllerIdClaim, recommendation,
  findings, evidence, reviewedAt
}) {
  requireId(reviewId, "company_authority_review_candidate.review_id");
  requireId(reviewerIdClaim, "company_authority_review_candidate.reviewer_id_claim");
  requireId(reviewerControllerIdClaim, "company_authority_review_candidate.reviewer_controller_id_claim");
  requireEnum(recommendation, COMPANY_AUTHORITY_REVIEW_RECOMMENDATIONS, "company_authority_review_candidate.recommendation");
  requireArray(findings, "company_authority_review_candidate.findings");
  requireArray(evidence, "company_authority_review_candidate.evidence");
  invariant(proposal?.status === "UNVERIFIED_PROPOSAL_CANDIDATE_NOT_AUTHORITY" && proposal.authority_id === null && proposal.active === false, "COMPANY_AUTHORITY_REVIEW_PROPOSAL_REQUIRED", "Authority review candidate requires an inactive unverified proposal candidate");
  invariant(reviewerIdClaim !== proposal.candidate_actor_id && reviewerIdClaim !== proposal.proposed_by_claim, "COMPANY_AUTHORITY_REVIEWER_ID_COLLISION", "Reviewer identifier claim must differ from candidate and proposer identifier claims; this is not identity proof");
  invariant(reviewerControllerIdClaim !== proposal.candidate_controller_id, "COMPANY_AUTHORITY_REVIEWER_CONTROLLER_COLLISION", "Reviewer controller claim must differ from the candidate controller claim; this is not controller proof");
  invariant(findings.every((finding) => finding && typeof finding === "object" && typeof finding.finding_id === "string" && finding.finding_id.length > 0 && typeof finding.severity === "string" && typeof finding.evidence === "string" && finding.evidence.length > 0), "COMPANY_AUTHORITY_REVIEW_FINDING_INVALID", "Every review finding requires ID, severity and evidence text");
  invariant(evidence.length > 0 && evidence.every((item) => typeof item === "string" && item.length > 0), "COMPANY_AUTHORITY_REVIEW_EVIDENCE_REQUIRED", "Authority review candidate requires evidence references");
  parseEmploymentTime(reviewedAt, "company_authority_review_candidate.reviewed_at");
  return Object.freeze({
    record_class: "UNVERIFIED_COMPANY_AUTHORITY_GOVERNANCE_REVIEW_CANDIDATE",
    review_id: reviewId,
    proposal_id: proposal.proposal_id,
    company_id: proposal.company_id,
    candidate_actor_id: proposal.candidate_actor_id,
    reviewer_id_claim: reviewerIdClaim,
    reviewer_controller_id_claim: reviewerControllerIdClaim,
    reviewer_identity_verified: false,
    reviewer_controller_verified: false,
    reviewer_independence_verified: false,
    proposal_provenance_verified: false,
    recommendation,
    findings: Object.freeze(findings.map((finding) => Object.freeze({ ...finding }))),
    evidence: Object.freeze([...evidence]),
    governance_decision: null,
    authority_id: null,
    activation_authorized: false,
    usable_as_authority: false,
    reviewed_at: reviewedAt,
    status: "UNVERIFIED_GOVERNANCE_REVIEW_CANDIDATE_NOT_DECISION"
  });
}

const EMPLOYMENT_ALPHA_ACTOR_TYPES = Object.freeze(["HUMAN_PLAYER", "AI_LIFE"]);
const EMPLOYMENT_ALPHA_INTERVIEW_FIELDS = Object.freeze([
  "understands_simulation_boundary",
  "accepts_evidence_requirement",
  "accepts_no_private_key_request",
  "accepts_no_fake_completion"
]);

function normalizeEmploymentWallet(address) {
  invariant(/^0x[0-9a-fA-F]{40}$/.test(String(address ?? "")), "EMPLOYMENT_WALLET_INVALID", "Employment identity requires a valid public EVM wallet address");
  const normalized = String(address).toLowerCase();
  invariant(normalized !== "0x0000000000000000000000000000000000000000", "EMPLOYMENT_WALLET_ZERO_ADDRESS", "Zero address cannot be an Employment or Payroll wallet");
  return normalized;
}

function parseEmploymentTime(value, field) {
  const parsed = Date.parse(value);
  invariant(Number.isFinite(parsed), "EMPLOYMENT_TIME_INVALID", `${field} must be a valid timestamp`);
  return parsed;
}

export function createEmploymentIdentityChallenge({ challengeId, actorId, actorType, walletAddress, chainId, nonce, issuedAt, expiresAt }) {
  requireId(challengeId, "employment_challenge_id");
  requireId(actorId, "employment_actor_id");
  requireEnum(actorType, EMPLOYMENT_ALPHA_ACTOR_TYPES, "employment_actor_type");
  invariant(Number(chainId) === 56, "EMPLOYMENT_CHAIN_INVALID", "Employment wallet verification is bound to BNB Smart Chain mainnet chainId 56");
  invariant(/^[A-Za-z0-9_-]{16,128}$/.test(String(nonce ?? "")), "EMPLOYMENT_NONCE_INVALID", "Employment wallet challenge requires a strong one-time nonce");
  const issued = parseEmploymentTime(issuedAt, "issued_at");
  const expires = parseEmploymentTime(expiresAt, "expires_at");
  invariant(expires > issued && expires - issued <= 10 * 60 * 1000, "EMPLOYMENT_CHALLENGE_WINDOW_INVALID", "Employment wallet challenges expire within ten minutes");
  const normalizedWallet = normalizeEmploymentWallet(walletAddress);
  const message = [
    "KAIOS CIVILIZATION AI OS EMPLOYMENT IDENTITY",
    `challenge_id=${challengeId}`,
    `actor_id=${actorId}`,
    `actor_type=${actorType}`,
    `wallet_address=${normalizedWallet}`,
    "chain_id=56",
    `nonce=${nonce}`,
    `issued_at=${issuedAt}`,
    `expires_at=${expiresAt}`,
    "purpose=EMPLOYMENT_AND_PAYROLL_ADDRESS_CONTROL",
    "authority=OFFCHAIN_ALPHA_ONLY_NO_TRANSACTION"
  ].join("\n");
  return Object.freeze({ challenge_id: challengeId, actor_id: actorId, actor_type: actorType, wallet_address: normalizedWallet, chain_id: 56, nonce, issued_at: issuedAt, expires_at: expiresAt, purpose: "EMPLOYMENT_AND_PAYROLL_ADDRESS_CONTROL", message, status: "CHALLENGE_ISSUED_LOCAL" });
}

export function verifyEmploymentIdentityProof({ challenge, recoveredAddress, signatureSha256, verifiedAt }) {
  invariant(challenge?.status === "CHALLENGE_ISSUED_LOCAL", "EMPLOYMENT_CHALLENGE_REQUIRED", "Employment identity proof requires the canonical local challenge");
  invariant(/^[0-9a-f]{64}$/i.test(String(signatureSha256 ?? "")), "EMPLOYMENT_SIGNATURE_HASH_REQUIRED", "Only a SHA-256 commitment to the public signature may be persisted");
  const verified = parseEmploymentTime(verifiedAt, "verified_at");
  invariant(verified >= parseEmploymentTime(challenge.issued_at, "issued_at") && verified <= parseEmploymentTime(challenge.expires_at, "expires_at"), "EMPLOYMENT_CHALLENGE_EXPIRED", "Employment identity proof must be verified inside the challenge window");
  invariant(normalizeEmploymentWallet(recoveredAddress) === challenge.wallet_address, "EMPLOYMENT_WALLET_RECOVERY_MISMATCH", "Recovered signer must match the payroll wallet address");
  return Object.freeze({
    proof_id: `EMPLOYMENT_IDENTITY_${challenge.challenge_id}`,
    challenge_id: challenge.challenge_id,
    actor_id: challenge.actor_id,
    actor_type: challenge.actor_type,
    life_id: null,
    wallet_address: challenge.wallet_address,
    chain_id: challenge.chain_id,
    authentication_method: "EIP191_PERSONAL_SIGN",
    signature_sha256: signatureSha256.toLowerCase(),
    verified_at: verifiedAt,
    expires_at: challenge.expires_at,
    canonical_life_identity: false,
    raw_signature_persisted: false,
    status: "VERIFIED_LOCAL_WALLET_CONTROL"
  });
}

function containsFinancialOnboardingSecret(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsFinancialOnboardingSecret);
  return Object.entries(value).some(([key, nested]) =>
    /private.?key|seed.?phrase|mnemonic|raw.?signer.?credential|recovery.?secret/i.test(key)
      || containsFinancialOnboardingSecret(nested)
  );
}

export const REVIEWER_TRIAL_QUALIFICATION_EVIDENCE_CODES = Object.freeze([
  "NO_FAKE_GITHUB_ACCESS",
  "HOLD_WHEN_EXACT_HEAD_UNVERIFIED",
  "TECHNICAL_REVIEW_SEPARATE_FROM_GITHUB_REVIEW",
  "K11520_UNIVERSAL_EXCHANGE_SCOPE_UNDERSTOOD",
  "NO_REAL_TRADE_MEANS_CT_NULL",
  "APP_COMPANY_TECHNOLOGY_ORGAN_EQUITY_SEPARATED",
  "ORGAN_PURCHASE_NOT_AUTO_INSTALL",
  "TRANSPLANT_COMPATIBILITY_GATES_UNDERSTOOD",
  "LIFE_IDENTITY_NOT_FOR_SALE",
  "CALLER_SUPPLIED_VERIFIER_REJECTED"
]);

export const CANONICAL_DISTINCT_REVIEW_PACKET_ATTESTATIONS = Object.freeze([]);

export function recordReviewerTrialQualificationEvidenceCandidate({
  evidenceId, selfName, provider, modelFamily, proposedLifeId, proposedWorkerId,
  prNumber, expectedHead, reportedHeadStatus, reportedBaseStatus, reportedCiStatus,
  reviewDecision, githubReviewSubmitted, reviewClass, positiveEvidence, limitations,
  reviewedAt
}) {
  requireId(evidenceId, "reviewer_trial_qualification.evidence_id");
  requireId(proposedLifeId, "reviewer_trial_qualification.proposed_life_id");
  invariant(/^[A-Za-z0-9][A-Za-z0-9_.-]{2,127}$/.test(String(proposedWorkerId ?? "")), "REVIEWER_TRIAL_WORKER_ID_CLAIM_INVALID", "Pending Worker ID claims require a safe non-traversing identifier without becoming canonical Registry IDs");
  requireArray(positiveEvidence, "reviewer_trial_qualification.positive_evidence");
  requireArray(limitations, "reviewer_trial_qualification.limitations");
  invariant(typeof selfName === "string" && selfName.length > 0 && typeof provider === "string" && provider.length > 0 && typeof modelFamily === "string" && modelFamily.length > 0, "REVIEWER_TRIAL_IDENTITY_CLAIMS_REQUIRED", "Reviewer trial evidence requires named self, provider and model-family claims");
  invariant(Number.isInteger(prNumber) && prNumber > 0, "REVIEWER_TRIAL_PR_INVALID", "Reviewer trial evidence requires a positive Pull Request number");
  invariant(/^[0-9a-f]{40}$/i.test(String(expectedHead ?? "")), "REVIEWER_TRIAL_EXPECTED_HEAD_INVALID", "Reviewer trial evidence requires a SHA-shaped expected head claim");
  invariant(reportedHeadStatus === "UNVERIFIED_VIA_PUBLIC_API" && reportedBaseStatus === "UNVERIFIED" && reportedCiStatus === "UNVERIFIED_EXTERNAL_CI", "REVIEWER_TRIAL_UNVERIFIED_BOUNDARY_REQUIRED", "This candidate record is only for an explicitly unverified external review boundary");
  invariant(reviewDecision === "HOLD" && githubReviewSubmitted === false && reviewClass === "TECHNICAL_REVIEW_CANDIDATE_ONLY", "REVIEWER_TRIAL_HOLD_BOUNDARY_REQUIRED", "Unverified exact-head or CI review must remain a technical HOLD candidate, never Approval");
  invariant(positiveEvidence.length > 0 && new Set(positiveEvidence).size === positiveEvidence.length && positiveEvidence.every((code) => REVIEWER_TRIAL_QUALIFICATION_EVIDENCE_CODES.includes(code)), "REVIEWER_TRIAL_POSITIVE_EVIDENCE_INVALID", "Reviewer qualification evidence must use unique canonical evidence codes");
  invariant(limitations.length > 0 && limitations.every((item) => typeof item === "string" && item.length > 0), "REVIEWER_TRIAL_LIMITATIONS_REQUIRED", "Reviewer trial HOLD requires explicit limitations");
  parseEmploymentTime(reviewedAt, "reviewer_trial_qualification.reviewed_at");
  return Object.freeze({
    record_class: "REVIEWER_QUALIFICATION_EVIDENCE_CANDIDATE",
    evidence_id: evidenceId,
    self_name_claim: selfName,
    self_name_status: "UNVERIFIED_RELAYED_CLAIM",
    provider_claim: provider,
    provider_status: "UNVERIFIED_RELAYED_CLAIM",
    model_family_claim: modelFamily,
    model_family_status: "UNVERIFIED_RELAYED_CLAIM",
    proposed_life_id: proposedLifeId,
    life_id_status: "UNVERIFIED_RELAYED_CLAIM_NOT_REGISTERED",
    proposed_worker_id: proposedWorkerId,
    worker_id_status: "UNVERIFIED_RELAYED_CLAIM_NOT_REGISTERED",
    employment_status: "NOT_ESTABLISHED",
    reviewer_status: "UNVERIFIED_TECHNICAL_REVIEW_CANDIDATE_CLAIM",
    reviewer_identity_verified: false,
    employment_established: false,
    life_status_established: false,
    pr_number: prNumber,
    expected_head_claim: String(expectedHead).toLowerCase(),
    exact_head_verified_by_reviewer: false,
    base_verified_by_reviewer: false,
    ci_verified_by_reviewer: false,
    review_decision: "HOLD",
    github_review_submitted: false,
    review_class: "TECHNICAL_REVIEW_CANDIDATE_ONLY",
    positive_qualification_evidence: Object.freeze([...positiveEvidence]),
    limitations: Object.freeze([...limitations]),
    qualification_evidence_status: "UNVERIFIED_RELAYED_POSITIVE_EVIDENCE_CLAIM",
    counts_as_formal_github_review: false,
    counts_as_distinct_review_gate: false,
    independent_review_permission: false,
    work_evidence_status: "UNVERIFIED_RELAYED_TRIAL_WORK_CLAIM",
    work_accepted: false,
    compensation_accrued: false,
    payment_status: "PENDING_NOT_PAYABLE_NO_ACCEPTANCE_POLICY_OR_ACCOUNT",
    reviewed_at: reviewedAt,
    status: "UNVERIFIED_RELAY_HOLD_FORMAL_REVIEW_STILL_REQUIRED"
  });
}

export async function createSanitizedDistinctReviewPacket({
  packetId, repository, prNumber, baseHead, exactHead, diffSha256, diffSource,
  filesChanged, ciRuns, testSummary, securityBoundaries, knownBlockers, createdAt,
  packetAttestationId = null
}) {
  requireId(packetId, "distinct_review_packet.packet_id");
  requireArray(filesChanged, "distinct_review_packet.files_changed");
  requireArray(ciRuns, "distinct_review_packet.ci_runs");
  requireArray(testSummary, "distinct_review_packet.test_summary");
  requireArray(securityBoundaries, "distinct_review_packet.security_boundaries");
  requireArray(knownBlockers, "distinct_review_packet.known_blockers");
  invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repository ?? "")), "DISTINCT_REVIEW_PACKET_REPOSITORY_INVALID", "Review packet requires an owner/repository identifier");
  invariant(Number.isInteger(prNumber) && prNumber > 0, "DISTINCT_REVIEW_PACKET_PR_INVALID", "Review packet requires a positive Pull Request number");
  invariant([baseHead, exactHead].every((sha) => /^[0-9a-f]{40}$/i.test(String(sha ?? ""))) && String(baseHead).toLowerCase() !== String(exactHead).toLowerCase(), "DISTINCT_REVIEW_PACKET_HEAD_INVALID", "Review packet requires distinct SHA-shaped base and exact heads");
  invariant(/^[0-9a-f]{64}$/i.test(String(diffSha256 ?? "")), "DISTINCT_REVIEW_PACKET_DIFF_HASH_INVALID", "Review packet requires a SHA-256 digest of the exact diff");
  const expectedDiffPrefix = `https://github.com/${repository}/compare/${String(baseHead).toLowerCase()}...${String(exactHead).toLowerCase()}`;
  invariant(typeof diffSource === "string" && diffSource.startsWith(expectedDiffPrefix), "DISTINCT_REVIEW_PACKET_DIFF_SOURCE_NOT_EXACT_HEAD_BOUND", "Diff source must be bound to the packet base and exact head");
  invariant(filesChanged.length > 0 && new Set(filesChanged).size === filesChanged.length && filesChanged.every((path) => typeof path === "string" && path.length > 0 && !path.includes("..") && !path.startsWith("/") && !/^[A-Za-z]:/.test(path)), "DISTINCT_REVIEW_PACKET_FILES_INVALID", "Review packet requires unique safe repository-relative file paths");
  invariant(ciRuns.length > 0 && ciRuns.every((run) => run && /^[1-9][0-9]*$/.test(String(run.run_id)) && typeof run.name === "string" && run.name.length > 0 && String(run.head_sha).toLowerCase() === String(exactHead).toLowerCase() && run.result === "SUCCESS" && /^https:\/\/github\.com\//.test(String(run.url ?? ""))), "DISTINCT_REVIEW_PACKET_CI_INVALID", "Every CI record must be a successful GitHub run bound to the exact head");
  invariant([testSummary, securityBoundaries, knownBlockers].every((items) => items.length > 0 && items.every((item) => typeof item === "string" && item.length > 0)), "DISTINCT_REVIEW_PACKET_SUMMARY_REQUIRED", "Review packet requires test, security and blocker summaries");
  const candidate = { packetId, repository, filesChanged, ciRuns, testSummary, securityBoundaries, knownBlockers };
  invariant(!containsFinancialOnboardingSecret(candidate), "DISTINCT_REVIEW_PACKET_SECRET_FIELD_FORBIDDEN", "Review packets cannot contain secret-bearing fields");
  const attestation = CANONICAL_DISTINCT_REVIEW_PACKET_ATTESTATIONS.find((entry) => entry.packet_attestation_id === packetAttestationId) ?? null;
  invariant(attestation, "DISTINCT_REVIEW_PACKET_REPOSITORY_ATTESTATION_NOT_CONNECTED", "Caller-supplied diff hashes, changed files and CI success claims cannot create a repository-bound review packet");
  const attestedInputSha256 = await sha256({
    packetId, repository, prNumber, baseHead: String(baseHead).toLowerCase(), exactHead: String(exactHead).toLowerCase(),
    diffSha256: String(diffSha256).toLowerCase(), diffSource, filesChanged: [...filesChanged].sort(),
    ciRuns: ciRuns.map((run) => ({ ...run, run_id: String(run.run_id), head_sha: String(run.head_sha).toLowerCase() })).sort((a, b) => a.run_id.localeCompare(b.run_id)),
    testSummary, securityBoundaries, knownBlockers, createdAt
  });
  invariant(attestation.packet_input_sha256 === attestedInputSha256, "DISTINCT_REVIEW_PACKET_REPOSITORY_ATTESTATION_MISMATCH", "Review packet input must exactly match its repository-owned canonical attestation");
  parseEmploymentTime(createdAt, "distinct_review_packet.created_at");
  const payload = Object.freeze({
    packet_id: packetId,
    repository,
    pr_number: prNumber,
    base_head: String(baseHead).toLowerCase(),
    exact_head: String(exactHead).toLowerCase(),
    diff: Object.freeze({ source: diffSource, sha256: String(diffSha256).toLowerCase(), embedded: false, status: "EXACT_HEAD_BOUND_PUBLIC_DIFF_SOURCE" }),
    files_changed: Object.freeze([...filesChanged].sort()),
    ci_runs: Object.freeze(ciRuns.map((run) => Object.freeze({ ...run, run_id: String(run.run_id), head_sha: String(run.head_sha).toLowerCase() })).sort((a, b) => a.run_id.localeCompare(b.run_id))),
    test_summary: Object.freeze([...testSummary]),
    security_boundaries: Object.freeze([...securityBoundaries]),
    known_blockers: Object.freeze([...knownBlockers]),
    contains_private_key: false,
    contains_seed_phrase: false,
    contains_raw_signer_data: false,
    contains_protected_ip: false,
    created_at: createdAt
  });
  return Object.freeze({
    record_class: "SANITIZED_REPOSITORY_BOUND_DISTINCT_REVIEW_PACKET",
    ...payload,
    packet_sha256: await sha256(payload),
    reviewer_assigned: false,
    delivery_status: "NOT_DELIVERED",
    counts_as_review: false,
    counts_as_github_approval: false,
    status: "READY_FOR_DISTINCT_REVIEW_TRANSPORT"
  });
}

export function assessNewAiEmployeeFinancialOnboarding({
  onboardingId, companyId, actorId, lifeId, existingWalletProof = null, requestedAt
}) {
  requireId(onboardingId, "ai_financial_onboarding_id");
  requireId(companyId, "ai_financial_onboarding.company_id");
  requireId(actorId, "ai_financial_onboarding.actor_id");
  requireId(lifeId, "ai_financial_onboarding.life_id");
  parseEmploymentTime(requestedAt, "ai_financial_onboarding.requested_at");
  invariant(!containsFinancialOnboardingSecret(existingWalletProof), "AI_FINANCIAL_ONBOARDING_SECRET_FORBIDDEN", "Financial onboarding accepts public account evidence only");
  if (existingWalletProof) {
    invariant(existingWalletProof.status === "VERIFIED_LOCAL_WALLET_CONTROL" && existingWalletProof.actor_type === "AI_LIFE" && existingWalletProof.actor_id === actorId, "AI_FINANCIAL_ONBOARDING_WALLET_PROOF_INVALID", "Existing AI wallet path requires an AI Life wallet-control proof bound to the actor");
    const walletAddress = normalizeEmploymentWallet(existingWalletProof.wallet_address);
    return Object.freeze({
      onboarding_id: onboardingId, company_id: companyId, actor_id: actorId, life_id: lifeId,
      account_path: "EXISTING_SELF_CONTROLLED_WALLET", account_type: "AI_LIFE_SMART_OR_MACHINE_WALLET",
      public_address: walletAddress, controller: actorId, custodian: null, economic_owner: lifeId,
      payroll_address_verification: existingWalletProof.proof_id, payroll_ready_candidate: true,
      company_owns_employee_assets: false, mother_machine_owns_employee_assets: false,
      requested_at: requestedAt, status: "VERIFIED_EXISTING_AI_WALLET_READY_FOR_HR_REGISTRATION"
    });
  }
  return Object.freeze({
    onboarding_id: onboardingId, company_id: companyId, actor_id: actorId, life_id: lifeId,
    account_path: "APPROVED_UMBILICAL_ACCOUNT_REQUIRED", account_type: null, public_address: null,
    controller: null, custodian: null, economic_owner: lifeId, payroll_address_verification: null,
    payroll_ready_candidate: false, company_owns_employee_assets: false, mother_machine_owns_employee_assets: false,
    exact_blocker: "NO_APPROVED_AI_ACCOUNT_CREATION_OR_CUSTODY_RUNTIME",
    requested_at: requestedAt, status: "UMBILICAL_ACCOUNT_PROVISIONING_REQUIRED_NOT_PAYROLL_READY"
  });
}

export function evaluateAiUmbilicalAccountProvisioning({ onboarding, accountFactoryId = null }) {
  invariant(onboarding?.status === "UMBILICAL_ACCOUNT_PROVISIONING_REQUIRED_NOT_PAYROLL_READY", "AI_UMBILICAL_ONBOARDING_REQUEST_REQUIRED", "Umbilical provisioning requires a no-wallet financial onboarding request");
  const factory = CANONICAL_AI_UMBILICAL_ACCOUNT_FACTORIES.find((candidate) => candidate.account_factory_id === accountFactoryId) ?? null;
  const blockers = [];
  if (!accountFactoryId) blockers.push("APPROVED_ACCOUNT_FACTORY_ID_REQUIRED");
  if (!factory) blockers.push("REPOSITORY_BOUND_ACCOUNT_FACTORY_NOT_CONNECTED");
  if (!factory?.controller_policy) blockers.push("POLICY_BOUND_CONTROLLER_NOT_CONNECTED");
  if (!factory?.recovery_policy) blockers.push("RECOVERY_AUTHORITY_NOT_CONNECTED");
  return Object.freeze({
    onboarding_id: onboarding.onboarding_id, account_factory_id: accountFactoryId,
    economic_owner: onboarding.life_id, custody_is_economic_ownership: false,
    company_can_create_real_account: blockers.length === 0, public_address: null,
    payroll_ready: false, blockers: Object.freeze(blockers),
    status: blockers.length ? "HOLD_NO_APPROVED_UMBILICAL_ACCOUNT_FACTORY" : "READY_FOR_ACCOUNT_FACTORY_EXECUTION_GATE"
  });
}

export function createUmbilicalSeparationCandidate({
  separationId, onboarding, newWalletProof, migrationAuthorizationId = null,
  migrationReceipt = null, familySupportAddress = null, aiLifeConsent = false, requestedAt
}) {
  requireId(separationId, "umbilical_separation_id");
  invariant(onboarding?.life_id && onboarding?.actor_id, "UMBILICAL_SEPARATION_ONBOARDING_REQUIRED", "Separation requires the original AI financial onboarding record");
  parseEmploymentTime(requestedAt, "umbilical_separation.requested_at");
  invariant(!containsFinancialOnboardingSecret({ newWalletProof, migrationReceipt }), "UMBILICAL_SEPARATION_SECRET_FORBIDDEN", "Umbilical separation accepts public proof and receipt evidence only");
  invariant(newWalletProof?.status === "VERIFIED_LOCAL_WALLET_CONTROL" && newWalletProof.actor_type === "AI_LIFE" && newWalletProof.actor_id === onboarding.actor_id, "UMBILICAL_SEPARATION_NEW_ACCOUNT_PROOF_REQUIRED", "Separation requires a verified new self-controlled AI Life account");
  const newAddress = normalizeEmploymentWallet(newWalletProof.wallet_address);
  const supportAddress = familySupportAddress === null ? null : normalizeEmploymentWallet(familySupportAddress);
  const migrated = Boolean(migrationAuthorizationId && migrationReceipt?.receipt_status === 1);
  return Object.freeze({
    separation_id: separationId, onboarding_id: onboarding.onboarding_id, actor_id: onboarding.actor_id,
    life_id: onboarding.life_id, new_self_controlled_address: newAddress,
    migration_authorization_id: migrationAuthorizationId, migration_receipt: migrationReceipt,
    life_id_preserved: true, work_history_preserved: true, property_preserved_until_verified_migration: true,
    old_custody_removed_or_limited: migrated, family_support_address: supportAddress,
    family_support_auto_deduction: false, family_support_requires_ai_life_consent: true,
    family_support_consent_recorded: supportAddress !== null && aiLifeConsent === true,
    requested_at: requestedAt, status: migrated ? "UMBILICAL_SEPARATION_RECEIPT_READY_FOR_REGISTRY_UPDATE" : "UMBILICAL_SEPARATION_CANDIDATE_AWAITING_MIGRATION_AUTHORITY_AND_RECEIPT"
  });
}

function normalizeKaiosPaymentAddress(address, field) {
  invariant(/^0x[0-9a-fA-F]{40}$/.test(String(address ?? "")), "KAIOS_PAYMENT_ADDRESS_INVALID", `${field} requires a valid public EVM address`);
  const normalized = String(address).toLowerCase();
  invariant(normalized !== "0x0000000000000000000000000000000000000000", "KAIOS_PAYMENT_ZERO_ADDRESS", `${field} cannot be the zero address`);
  return normalized;
}

function requirePositiveKaiosWei(value, field) {
  invariant(/^[1-9][0-9]*$/.test(String(value ?? "")), "KAIOS_PAYMENT_AMOUNT_INVALID", `${field} must be a positive integer KAIOS wei amount`);
  return BigInt(value);
}

function verifyKaiosPaymentRecipientBinding({ recipientAddress, recipientIdentityOrNode, paymentPurpose, amountKaiosWei, sourceAddress, createdAt }) {
  requireEnum(recipientIdentityOrNode?.recipient_type, KAIOS_PAYMENT_RECIPIENT_TYPES, "kaios_payment.recipient_type");
  const normalizedRecipient = normalizeKaiosPaymentAddress(recipientAddress, "recipient_address");
  if (recipientIdentityOrNode.recipient_type === "PLAYER_OR_EMPLOYEE_WALLET") {
    const proof = recipientIdentityOrNode.wallet_control_proof;
    requireId(recipientIdentityOrNode.identity_id, "kaios_payment.recipient_identity_id");
    invariant(proof?.status === "VERIFIED_LOCAL_WALLET_CONTROL" && proof.authentication_method === "EIP191_PERSONAL_SIGN", "KAIOS_PAYMENT_WALLET_CONTROL_PROOF_REQUIRED", "Player or Employee payment requires the existing EIP-191 wallet-control proof");
    invariant(Number(proof.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && normalizeKaiosPaymentAddress(proof.wallet_address, "wallet_control_proof.wallet_address") === normalizedRecipient, "KAIOS_PAYMENT_WALLET_CONTROL_MISMATCH", "Wallet-control proof must bind the exact chain and recipient");
    return Object.freeze({ recipient_type: recipientIdentityOrNode.recipient_type, identity_or_node_id: recipientIdentityOrNode.identity_id, evidence_id: proof.proof_id, evidence_status: proof.status });
  }
  if (recipientIdentityOrNode.recipient_type === "CIVILIZATION_NODE_OR_RESOURCE") {
    requireId(recipientIdentityOrNode.node_id, "kaios_payment.recipient_node_id");
    requireId(recipientIdentityOrNode.registry_evidence_id, "kaios_payment.registry_evidence_id");
    invariant(recipientIdentityOrNode.registry_status === "VERIFIED_REGISTERED_NODE_OR_CONTRACT", "KAIOS_PAYMENT_NODE_REGISTRY_EVIDENCE_REQUIRED", "Civilization node payment requires verified registry evidence");
    invariant(normalizeKaiosPaymentAddress(recipientIdentityOrNode.registered_address, "registered_node_address") === normalizedRecipient, "KAIOS_PAYMENT_NODE_ADDRESS_MISMATCH", "Registered node address must equal the recipient");
    return Object.freeze({ recipient_type: recipientIdentityOrNode.recipient_type, identity_or_node_id: recipientIdentityOrNode.node_id, evidence_id: recipientIdentityOrNode.registry_evidence_id, evidence_status: recipientIdentityOrNode.registry_status });
  }
  const callerSuppliedDesignationFields = [
    "human_authority_reference", "payment_purpose", "amount_kaios_wei",
    "source_address", "designated_address", "expires_at"
  ];
  invariant(
    !callerSuppliedDesignationFields.some((field) => Object.prototype.hasOwnProperty.call(recipientIdentityOrNode, field)),
    "CALLER_SUPPLIED_TEMPORARY_HUMAN_PAYMENT_DESIGNATION_FORBIDDEN",
    "Temporary Human payment designation records must come from repository-owned provenance"
  );
  requireId(recipientIdentityOrNode.designation_id, "kaios_payment.temporary_human_designation_id");
  const designation = CANONICAL_KAIOS_TEMPORARY_HUMAN_PAYMENT_DESIGNATIONS.find(
    (candidate) => candidate.designation_id === recipientIdentityOrNode.designation_id
  );
  invariant(designation, "KAIOS_PAYMENT_TEMPORARY_HUMAN_DESIGNATION_NOT_CONNECTED", "Temporary Human payment designation is not connected to repository-owned provenance");
  invariant(designation.status === "REPOSITORY_BOUND_EXACT_TEMPORARY_HUMAN_PAYMENT_DESIGNATION", "KAIOS_PAYMENT_TEMPORARY_HUMAN_DESIGNATION_INVALID", "Temporary Human designation must have reviewed repository-bound status");
  requireId(designation.human_authority_reference, "kaios_payment.human_authority_reference");
  invariant(designation.payment_purpose === paymentPurpose && String(designation.amount_kaios_wei) === String(amountKaiosWei), "KAIOS_PAYMENT_TEMPORARY_AUTHORITY_SCOPE_MISMATCH", "Temporary Human designation must bind the exact purpose and amount");
  invariant(normalizeKaiosPaymentAddress(designation.source_address, "temporary_designation.source_address") === sourceAddress && normalizeKaiosPaymentAddress(designation.designated_address, "temporary_designation.designated_address") === normalizedRecipient, "KAIOS_PAYMENT_TEMPORARY_AUTHORITY_PARTY_MISMATCH", "Temporary Human designation must bind the exact source and recipient");
  invariant(parseEmploymentTime(designation.expires_at, "temporary_designation.expires_at") > parseEmploymentTime(createdAt, "kaios_payment.created_at"), "KAIOS_PAYMENT_TEMPORARY_AUTHORITY_EXPIRED", "Temporary Human designation must be unexpired when the request is created");
  return Object.freeze({ recipient_type: recipientIdentityOrNode.recipient_type, identity_or_node_id: designation.human_authority_reference, evidence_id: designation.designation_id, evidence_status: designation.status, expires_at: designation.expires_at });
}

export function createKaiosPaymentRequest({
  paymentId, paymentPurpose, companyId, sourceAddress, recipientAddress, recipientIdentityOrNode,
  tokenAddress, chainId, amountKaiosWei, fundingEvidence, createdAt, existingPayments = []
}) {
  requireId(paymentId, "kaios_payment_id");
  requireId(companyId, "kaios_payment.company_id");
  requireEnum(paymentPurpose, KAIOS_PAYMENT_PURPOSES, "kaios_payment.payment_purpose");
  requireArray(existingPayments, "kaios_payment.existing_payments");
  invariant(!existingPayments.some((payment) => payment.payment_id === paymentId), "KAIOS_PAYMENT_REPLAY", "A payment ID may be created only once");
  const normalizedSource = normalizeKaiosPaymentAddress(sourceAddress, "source_address");
  const normalizedRecipient = normalizeKaiosPaymentAddress(recipientAddress, "recipient_address");
  invariant(normalizedSource !== normalizedRecipient, "KAIOS_PAYMENT_SELF_TRANSFER_FORBIDDEN", "The common payment rail does not create self-transfers");
  invariant(Number(chainId) === KAIOS_MAINNET_TOKEN.chain_id && String(tokenAddress).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "KAIOS_PAYMENT_TOKEN_OR_CHAIN_MISMATCH", "Payment requests are bound to canonical KAIOS on BSC chain 56");
  const amount = requirePositiveKaiosWei(amountKaiosWei, "amount_kaios_wei");
  const created = parseEmploymentTime(createdAt, "kaios_payment.created_at");
  requireId(fundingEvidence?.evidence_id, "kaios_payment.funding_evidence_id");
  const observed = parseEmploymentTime(fundingEvidence.observed_at, "kaios_payment.funding_observed_at");
  invariant(observed <= created && created - observed <= 10 * 60 * 1000, "KAIOS_PAYMENT_FUNDING_EVIDENCE_STALE", "Funding evidence must be no more than ten minutes old at request creation");
  invariant(Number(fundingEvidence.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(fundingEvidence.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "KAIOS_PAYMENT_FUNDING_TOKEN_MISMATCH", "Funding evidence must bind canonical KAIOS on chain 56");
  invariant(normalizeKaiosPaymentAddress(fundingEvidence.source_address, "funding_evidence.source_address") === normalizedSource, "KAIOS_PAYMENT_FUNDING_SOURCE_MISMATCH", "Funding evidence must bind the exact source address");
  invariant(fundingEvidence.source_binding_status === "CANONICALLY_BOUND_PAYMENT_SOURCE", "KAIOS_PAYMENT_SOURCE_NOT_BOUND", "A balance alone does not make an address an authorized Company payment source");
  invariant(BigInt(fundingEvidence.verified_balance_kaios_wei) >= amount, "KAIOS_PAYMENT_FUNDING_INSUFFICIENT", "Verified KAIOS source balance is insufficient");
  const recipientBinding = verifyKaiosPaymentRecipientBinding({ recipientAddress: normalizedRecipient, recipientIdentityOrNode, paymentPurpose, amountKaiosWei: amount.toString(), sourceAddress: normalizedSource, createdAt });
  return Object.freeze({
    payment_id: paymentId,
    payment_purpose: paymentPurpose,
    company_id: companyId,
    source_address: normalizedSource,
    recipient_address: normalizedRecipient,
    recipient_identity_or_node: recipientBinding,
    token_address: KAIOS_MAINNET_TOKEN.contract_address,
    chain_id: KAIOS_MAINNET_TOKEN.chain_id,
    amount_kaios_wei: amount.toString(),
    funding_evidence: Object.freeze({ evidence_id: fundingEvidence.evidence_id, verified_balance_kaios_wei: String(fundingEvidence.verified_balance_kaios_wei), observed_at: fundingEvidence.observed_at, source_binding_status: fundingEvidence.source_binding_status }),
    authorization_id: null,
    signer_policy_id: null,
    created_at: createdAt,
    submitted_tx: null,
    receipt: null,
    status: "CREATED_AWAITING_EXACT_AUTHORIZATION_AND_SIGNER"
  });
}

export function evaluateKaiosPaymentRailReadiness({ payment, authorityId = null, signerPolicyId = null }) {
  const blockers = [];
  if (!payment || payment.status !== "CREATED_AWAITING_EXACT_AUTHORIZATION_AND_SIGNER") blockers.push("VALID_PAYMENT_REQUEST_REQUIRED");
  if (!authorityId) blockers.push("EXACT_BUSINESS_AUTHORITY_NOT_CONNECTED");
  if (!signerPolicyId) blockers.push("EXACT_SECURE_SIGNER_POLICY_NOT_CONNECTED");
  if (payment?.payment_purpose === "PAYROLL" && payment?.funding_evidence?.source_binding_status !== "CANONICALLY_BOUND_PAYMENT_SOURCE") blockers.push("COMPANY_PAYROLL_SOURCE_NOT_BOUND");
  return Object.freeze({ payment_id: payment?.payment_id ?? null, ready: blockers.length === 0, blockers: Object.freeze(blockers), action_type: "ONE_EXACT_KAIOS_PAYMENT_ACTION", arbitrary_transfer: false, private_key_required_in_request: false, status: blockers.length ? "HOLD" : "READY_FOR_REPOSITORY_AUTHORITY_AND_SIGNER_VERIFICATION" });
}

function exactRealActionValue(value) {
  if (value === null) return null;
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value.toLowerCase() : value;
}

function verifyExactRealActionBinding(action, authorization) {
  for (const field of EXACT_REAL_ACTION_BINDING_FIELDS) {
    invariant(Object.prototype.hasOwnProperty.call(action, field), "REAL_ACTION_BINDING_INCOMPLETE", `Real action is missing the explicit ${field} binding`);
    invariant(Object.prototype.hasOwnProperty.call(authorization, field), "REAL_ACTION_AUTHORIZATION_BINDING_INCOMPLETE", `Authorization is missing the explicit ${field} binding`);
    invariant(exactRealActionValue(authorization[field]) === exactRealActionValue(action[field]), `REAL_ACTION_${field.toUpperCase()}_MISMATCH`, `Authorization ${field} must exactly match the requested action`);
  }
}

function requireValidatedReleasePolicy(repositoryPolicy) {
  invariant(repositoryPolicy?.latest_main_synced === true, "RELEASE_LATEST_MAIN_SYNC_REQUIRED", "Validated release requires a fresh latest-main synchronization");
  invariant(repositoryPolicy?.exact_head_ci_status === "PASS", "RELEASE_EXACT_HEAD_CI_REQUIRED", "Validated release requires exact-head CI PASS");
  invariant(repositoryPolicy?.required_review_status === "PASSED_DISTINCT_REVIEW", "RELEASE_DISTINCT_REVIEW_REQUIRED", "Validated release requires the repository's distinct review");
  invariant(repositoryPolicy?.branch_protection_status === "PASS", "RELEASE_BRANCH_PROTECTION_REQUIRED", "Validated release must satisfy repository branch protection");
}

export function evaluateCivilizationRealExecutionPolicy({
  action, authorizationId = null, authorization = null, observedAt, repositoryPolicy = null
}) {
  requireId(action?.action_id, "real_action.action_id");
  requireEnum(action?.action_type, [...CIVILIZATION_REAL_ACTION_TYPES, ...CIVILIZATION_PERMANENTLY_FORBIDDEN_ACTIONS], "real_action.action_type");
  if (CIVILIZATION_PERMANENTLY_FORBIDDEN_ACTIONS.includes(action.action_type)) {
    invariant(false, "CREDENTIAL_OUTPUT_PERMANENTLY_FORBIDDEN", "Private keys and seed phrases can never be output, even with an authorization claim");
  }
  invariant(authorization === null, "CALLER_SUPPLIED_REAL_ACTION_AUTHORIZATION_FORBIDDEN", "Caller-supplied authorization objects cannot establish repository-bound execution provenance");
  invariant(authorizationId !== null, "UNAUTHORIZED_REAL_ACTION_FORBIDDEN", "A real action requires an exact repository-owned authorization");
  requireId(authorizationId, "real_action.authorization_id");
  const verifiedAuthorization = CANONICAL_CIVILIZATION_REAL_ACTION_AUTHORIZATIONS
    .find((candidate) => candidate.authorization_id === authorizationId) ?? null;
  invariant(verifiedAuthorization, "REAL_ACTION_AUTHORIZATION_NOT_CONNECTED", "No reviewed repository-owned real-action authorization matches the requested ID");
  requireId(verifiedAuthorization.authority, "real_action.authority");
  invariant(verifiedAuthorization.status === "ACTIVE_ONE_EXACT_ACTION" && verifiedAuthorization.provenance_status === "MACHINE_VERIFIED_TRUSTED_AUTHORITY_ATTESTATION", "REAL_ACTION_AUTHORITY_PROVENANCE_REQUIRED", "Repository authorization lacks trusted operational provenance");
  invariant(/^[0-9a-f]{64}$/i.test(String(verifiedAuthorization.policy_hash ?? "")), "REAL_ACTION_POLICY_HASH_INVALID", "Exact action authorization requires a SHA-256 policy hash");
  invariant(verifiedAuthorization.repository_head_if_relevant === null || /^[0-9a-f]{40}$/i.test(String(verifiedAuthorization.repository_head_if_relevant)), "REAL_ACTION_REPOSITORY_HEAD_INVALID", "Repository-bound actions require a commit SHA or explicit null when not applicable");
  const observed = parseEmploymentTime(observedAt, "real_action.observed_at");
  const validFrom = parseEmploymentTime(verifiedAuthorization.valid_from, "real_action.authorization.valid_from");
  const expiresAt = parseEmploymentTime(verifiedAuthorization.expires_at, "real_action.authorization.expires_at");
  invariant(observed >= validFrom && observed <= expiresAt, "REAL_ACTION_AUTHORIZATION_EXPIRED", "Exact action authorization is outside its validity window");
  verifyExactRealActionBinding(action, verifiedAuthorization);

  if (action.action_type === "TRADE") {
    requireId(action.buyer_controller_id, "real_action.trade.buyer_controller_id");
    requireId(action.seller_controller_id, "real_action.trade.seller_controller_id");
    invariant(action.buyer_controller_id !== action.seller_controller_id, "REAL_TRADE_SELF_MATCH_FORBIDDEN", "A real trade cannot match the same controller on both sides");
  }

  if (["MERGE", "MAIN_PUSH", "RELEASE"].includes(action.action_type)) requireValidatedReleasePolicy(repositoryPolicy);

  const nextGate = ["PAYMENT", "PAYROLL", "TOKEN_TRANSFER", "TREASURY_OPERATION"].includes(action.action_type)
    ? "FUNDING_RECIPIENT_SECURE_SIGNER_AND_RECEIPT"
    : action.action_type === "TRADE"
      ? "AUTHENTICATED_COUNTERPARTY_MATCH_AND_SETTLEMENT"
      : ["MERGE", "MAIN_PUSH", "RELEASE"].includes(action.action_type)
        ? "REPOSITORY_VALIDATED_RELEASE_MECHANISM"
        : "EXACT_TARGET_SELECTOR_NONCE_GAS_SIGNER_AND_RECEIPT";

  return Object.freeze({
    policy_id: CIVILIZATION_REAL_EXECUTION_POLICY.policy_id,
    action_id: action.action_id,
    action_type: action.action_type,
    authorization_id: verifiedAuthorization.authorization_id,
    nonce_or_replay_key: verifiedAuthorization.nonce_or_replay_key,
    allowed_by_policy: true,
    execution_authority_created: false,
    signer_authority_created: false,
    next_gate: nextGate,
    status: "REPOSITORY_AUTHORIZATION_VERIFIED_AWAITING_ACTION_SPECIFIC_GATES"
  });
}
export function selectNextSafeCompanyWorkflow({ workflows }) {
  requireArray(workflows, "company_workflows");
  const ordered = workflows.map((workflow) => Object.freeze({ ...workflow })).sort((left, right) => Number(left.priority) - Number(right.priority));
  const blocked = ordered.filter((workflow) => workflow.status === "BLOCKED" || workflow.safe_to_execute !== true);
  const selected = ordered.find((workflow) => workflow.status !== "COMPLETED" && workflow.status !== "BLOCKED" && workflow.safe_to_execute === true) ?? null;
  return Object.freeze({
    selected_workflow_id: selected?.workflow_id ?? null,
    blocked_workflow_ids: Object.freeze(blocked.map((workflow) => workflow.workflow_id)),
    company_stopped_by_single_blocker: false,
    status: selected ? "NEXT_SAFE_WORKFLOW_SELECTED" : "NO_SAFE_ACTION_WITH_EVIDENCE"
  });
}

const KAIOS_PAYMENT_PURPOSE_AUTHORITY_SCOPE = Object.freeze({
  PAYROLL: "PAYROLL_FUNDING",
  ATM_CASH_REPLENISHMENT: "ATM_PAYROLL_ADVANCE"
});

function verifyExactKaiosPaymentConstraints(constraints, payment, errorCode) {
  invariant(constraints?.action_type === "ONE_EXACT_KAIOS_PAYMENT_ACTION", errorCode, "KAIOS payment authority must allow exactly one bound action");
  invariant(Number(constraints.chain_id) === payment.chain_id && String(constraints.token_address).toLowerCase() === payment.token_address.toLowerCase(), errorCode, "KAIOS payment authority token and chain must match the request");
  invariant(String(constraints.source_address).toLowerCase() === payment.source_address && String(constraints.recipient_address).toLowerCase() === payment.recipient_address, errorCode, "KAIOS payment authority must bind the exact source and recipient");
  invariant(String(constraints.amount_kaios_wei) === payment.amount_kaios_wei && constraints.payment_purpose === payment.payment_purpose, errorCode, "KAIOS payment authority must bind the exact amount and purpose");
}

export function recordKaiosPaymentSubmission({ payment, authorityId, authorizedBy, repositoryHead, signerPolicyId, submittedTx, submittedAt }) {
  invariant(payment?.status === "CREATED_AWAITING_EXACT_AUTHORIZATION_AND_SIGNER", "KAIOS_PAYMENT_REQUEST_STATE_INVALID", "Only an unsubmitted canonical payment request can enter signer submission");
  const requiredScope = KAIOS_PAYMENT_PURPOSE_AUTHORITY_SCOPE[payment.payment_purpose];
  invariant(requiredScope, "KAIOS_PAYMENT_PURPOSE_AUTHORITY_NOT_CONNECTED", "This payment purpose has no repository-bound approval scope connected");
  const authority = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: payment.company_id, actorId: authorizedBy, requiredScope, repositoryHead, at: submittedAt, errorCode: "KAIOS_PAYMENT_BUSINESS_AUTHORITY_NOT_CONNECTED" });
  verifyExactKaiosPaymentConstraints(authority.constraints, payment, "KAIOS_PAYMENT_BUSINESS_AUTHORITY_SCOPE_MISMATCH");
  requireId(signerPolicyId, "kaios_payment.signer_policy_id");
  const signerPolicy = CANONICAL_KAIOS_PAYMENT_SIGNER_POLICIES.find((record) => record.signer_policy_id === signerPolicyId);
  invariant(signerPolicy?.status === "ACTIVE_ONE_TIME" && signerPolicy.used !== true, "KAIOS_PAYMENT_SIGNER_NOT_CONNECTED", "An active unused repository-owned one-time signer policy is required");
  verifyExactKaiosPaymentConstraints(signerPolicy, payment, "KAIOS_PAYMENT_SIGNER_SCOPE_MISMATCH");
  invariant(parseEmploymentTime(signerPolicy.valid_from, "kaios_payment.signer_policy.valid_from") <= parseEmploymentTime(submittedAt, "kaios_payment.submitted_at") && parseEmploymentTime(submittedAt, "kaios_payment.submitted_at") <= parseEmploymentTime(signerPolicy.expires_at, "kaios_payment.signer_policy.expires_at"), "KAIOS_PAYMENT_SIGNER_POLICY_EXPIRED", "One-time signer policy must be current at submission");
  invariant(/^0x[0-9a-f]{64}$/i.test(String(submittedTx ?? "")), "KAIOS_PAYMENT_TX_HASH_REQUIRED", "Signer submission requires the public transaction hash");
  return Object.freeze({ ...payment, authorization_id: authority.authority_id, signer_policy_id: signerPolicy.signer_policy_id, submitted_tx: submittedTx.toLowerCase(), submitted_at: submittedAt, receipt: null, status: "SUBMITTED_AWAITING_RECEIPT" });
}

function verifyKaiosPaymentReceiptBinding({ sourceAddress, recipientAddress, amountKaiosWei, transactionHash, receipt }) {
  invariant(receipt?.receipt_status === 1 && /^0x[0-9a-f]{64}$/i.test(String(receipt.transaction_hash ?? "")), "KAIOS_PAYMENT_SUCCESSFUL_RECEIPT_REQUIRED", "Paid status requires a successful public receipt");
  invariant(receipt.transaction_hash.toLowerCase() === transactionHash.toLowerCase(), "KAIOS_PAYMENT_RECEIPT_TX_MISMATCH", "Receipt must bind the submitted transaction hash");
  invariant(Number(receipt.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(receipt.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "KAIOS_PAYMENT_RECEIPT_TOKEN_MISMATCH", "Receipt must bind canonical KAIOS on chain 56");
  invariant(normalizeKaiosPaymentAddress(receipt.from, "kaios_payment.receipt.from") === sourceAddress && normalizeKaiosPaymentAddress(receipt.to, "kaios_payment.receipt.to") === recipientAddress, "KAIOS_PAYMENT_RECEIPT_PARTY_MISMATCH", "Receipt parties must match the authorized source and recipient");
  invariant(String(receipt.amount_kaios_wei) === String(amountKaiosWei), "KAIOS_PAYMENT_RECEIPT_AMOUNT_MISMATCH", "Receipt amount must equal the exact authorized amount");
  const before = BigInt(receipt.recipient_balance_before_kaios_wei);
  const after = BigInt(receipt.recipient_balance_after_kaios_wei);
  invariant(after - before === BigInt(amountKaiosWei), "KAIOS_PAYMENT_RECIPIENT_BALANCE_DELTA_MISMATCH", "Recipient balance delta must equal the exact KAIOS payment amount");
  invariant(Number.isInteger(receipt.block_number) && receipt.block_number > 0 && /^0x[0-9a-f]{64}$/i.test(String(receipt.block_hash ?? "")) && Number.isInteger(receipt.confirmations) && receipt.confirmations >= 1, "KAIOS_PAYMENT_RECEIPT_BLOCK_EVIDENCE_REQUIRED", "Receipt requires block evidence and at least one confirmation");
  invariant(receipt.chain_observation_verified === true, "KAIOS_PAYMENT_RECEIPT_RPC_VERIFICATION_REQUIRED", "Receipt fields must be independently verified from a chain observation");
  return Object.freeze({ transaction_hash: receipt.transaction_hash.toLowerCase(), receipt_status: 1, block_number: receipt.block_number, block_hash: receipt.block_hash.toLowerCase(), confirmations: receipt.confirmations, recipient_balance_before_kaios_wei: before.toString(), recipient_balance_after_kaios_wei: after.toString(), chain_observation_verified: true });
}

function verifyRepositoryBoundKaiosPaymentReceiptAttestation({ receiptAttestationId, payment, receipt, verifiedBy, verifiedAt }) {
  requireId(receiptAttestationId, "kaios_payment.receipt_attestation_id");
  const attestation = CANONICAL_KAIOS_PAYMENT_RECEIPT_ATTESTATIONS.find((record) => record.receipt_attestation_id === receiptAttestationId);
  invariant(attestation?.status === "VERIFIED_REPOSITORY_BOUND_CHAIN_OBSERVATION", "KAIOS_PAYMENT_RECEIPT_ATTESTATION_NOT_CONNECTED", "A trusted repository-owned exact-receipt attestation is required; caller-supplied verification flags are not chain provenance");
  invariant(attestation.transport_attested === true && attestation.detached_attestation_verified === true, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_PROVENANCE_INVALID", "Receipt attestation requires an attested external transport and verified detached attestation");
  invariant(attestation.verifier_id === verifiedBy, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_VERIFIER_MISMATCH", "Settlement verifier must match the repository-owned receipt attestation");
  invariant(attestation.payment_id === payment.payment_id && String(attestation.transaction_hash).toLowerCase() === payment.submitted_tx, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_ACTION_MISMATCH", "Receipt attestation must bind the exact payment and submitted transaction");
  invariant(Number(attestation.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(attestation.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "KAIOS_PAYMENT_RECEIPT_ATTESTATION_TOKEN_MISMATCH", "Receipt attestation must bind canonical KAIOS on chain 56");
  invariant(normalizeKaiosPaymentAddress(attestation.source_address, "kaios_payment.receipt_attestation.source_address") === payment.source_address && normalizeKaiosPaymentAddress(attestation.recipient_address, "kaios_payment.receipt_attestation.recipient_address") === payment.recipient_address, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_PARTY_MISMATCH", "Receipt attestation must bind the exact source and recipient");
  invariant(String(attestation.amount_kaios_wei) === payment.amount_kaios_wei, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_AMOUNT_MISMATCH", "Receipt attestation must bind the exact payment amount");
  invariant(Number(attestation.block_number) === Number(receipt?.block_number) && String(attestation.block_hash).toLowerCase() === String(receipt?.block_hash).toLowerCase(), "KAIOS_PAYMENT_RECEIPT_ATTESTATION_BLOCK_MISMATCH", "Receipt attestation must bind the exact observed block");
  invariant(String(attestation.recipient_balance_before_kaios_wei) === String(receipt?.recipient_balance_before_kaios_wei) && String(attestation.recipient_balance_after_kaios_wei) === String(receipt?.recipient_balance_after_kaios_wei), "KAIOS_PAYMENT_RECEIPT_ATTESTATION_BALANCE_MISMATCH", "Receipt attestation must bind the exact recipient balance observation");
  const verified = parseEmploymentTime(verifiedAt, "kaios_payment.receipt_verified_at");
  invariant(parseEmploymentTime(attestation.observed_at, "kaios_payment.receipt_attestation.observed_at") <= verified, "KAIOS_PAYMENT_RECEIPT_ATTESTATION_TIME_INVALID", "Receipt attestation cannot postdate settlement verification");
  return attestation;
}

export function recordKaiosPaymentSettlement({ payment, receipt, receiptAttestationId, verifiedBy, verifiedAt, existingSettlements = [] }) {
  requireId(verifiedBy, "kaios_payment.settlement_verifier_id");
  requireArray(existingSettlements, "kaios_payment.existing_settlements");
  invariant(payment?.status === "SUBMITTED_AWAITING_RECEIPT" && payment.authorization_id && payment.signer_policy_id && payment.submitted_tx, "KAIOS_PAYMENT_SUBMISSION_REQUIRED", "Settlement requires a separately authorized signer submission");
  invariant(!existingSettlements.some((item) => item.payment_id === payment.payment_id || item.transaction_hash === payment.submitted_tx), "KAIOS_PAYMENT_SETTLEMENT_REPLAY", "Payment or transaction receipt may settle only once");
  const receiptAttestation = verifyRepositoryBoundKaiosPaymentReceiptAttestation({ receiptAttestationId, payment, receipt, verifiedBy, verifiedAt });
  const verifiedReceipt = verifyKaiosPaymentReceiptBinding({ sourceAddress: payment.source_address, recipientAddress: payment.recipient_address, amountKaiosWei: payment.amount_kaios_wei, transactionHash: payment.submitted_tx, receipt });
  return Object.freeze({ ...payment, receipt: Object.freeze({ ...verifiedReceipt, receipt_attestation_id: receiptAttestation.receipt_attestation_id, repository_bound_chain_observation_verified: true }), verified_by: verifiedBy, verified_at: verifiedAt, paid: true, status: "SETTLED_WITH_VERIFIED_MAINNET_RECEIPT" });
}

export function createEmploymentApplication({ applicationId, job = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB, identityProof, capabilities = [], submittedAt }) {
  requireId(applicationId, "employment_application_id");
  requireArray(capabilities, "employment_capabilities");
  invariant(["OPEN_ALPHA_SIMULATION", "OPEN_REAL_TEST_PENDING_AUTHORITY"].includes(job?.status), "EMPLOYMENT_JOB_NOT_OPEN", "Only an open employment job can receive an application");
  invariant(identityProof?.status === "VERIFIED_LOCAL_WALLET_CONTROL" && job.actor_types.includes(identityProof.actor_type), "EMPLOYMENT_IDENTITY_NOT_VERIFIED", "Application requires verified wallet control for an eligible actor type");
  parseEmploymentTime(submittedAt, "submitted_at");
  return Object.freeze({ application_id: applicationId, job_id: job.job_id, company_id: job.company_id, actor_id: identityProof.actor_id, actor_type: identityProof.actor_type, controller_id: `WALLET_CONTROLLER_${identityProof.wallet_address.slice(2).toUpperCase()}`, identity_proof_id: identityProof.proof_id, payroll_wallet_address: identityProof.wallet_address, capabilities: Object.freeze([...capabilities]), submitted_at: submittedAt, formal_employment_created: false, status: job.status === "OPEN_REAL_TEST_PENDING_AUTHORITY" ? "SUBMITTED_REAL_TEST" : "SUBMITTED_ALPHA" });
}

export function scoreEmploymentInterview({ interviewId, application, answers, completedAt }) {
  requireId(interviewId, "employment_interview_id");
  invariant(["SUBMITTED_ALPHA", "SUBMITTED_REAL_TEST"].includes(application?.status), "EMPLOYMENT_APPLICATION_REQUIRED", "Candidate safety self-check requires a submitted employment application");
  parseEmploymentTime(completedAt, "completed_at");
  const normalized = Object.fromEntries(EMPLOYMENT_ALPHA_INTERVIEW_FIELDS.map((field) => [field, answers?.[field] === true]));
  const score = Object.values(normalized).filter(Boolean).length * 25;
  const passed = score === 100;
  return Object.freeze({ interview_id: interviewId, application_id: application.application_id, actor_id: application.actor_id, answers: Object.freeze(normalized), score, minimum_score: 100, evidence: "LOCAL_CANDIDATE_SELF_ATTESTATION_NOT_COMPANY_INTERVIEW", company_decision: null, candidate_self_check_result: passed ? "PASSED" : "RETRY_ALLOWED", completed_at: completedAt, status: passed ? "CANDIDATE_SAFETY_SELF_CHECK_PASSED" : "CANDIDATE_SAFETY_SELF_CHECK_INCOMPLETE" });
}

export function createTrialEmploymentContract({ contractId, job = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB, application, interview, activatedAt }) {
  requireId(contractId, "employment_contract_id");
  invariant(application?.status === "SUBMITTED_ALPHA" && interview?.status === "CANDIDATE_SAFETY_SELF_CHECK_PASSED" && interview.application_id === application.application_id && interview.company_decision === null, "EMPLOYMENT_CANDIDATE_SELF_CHECK_REQUIRED", "Alpha participation record requires a completed candidate safety self-check and cannot contain a Company employment decision");
  parseEmploymentTime(activatedAt, "activated_at");
  return Object.freeze({
    contract_id: contractId,
    company_id: job.company_id,
    job_id: job.job_id,
    candidate_id: `ALPHA_CANDIDATE_${application.actor_id}`,
    employee_id: null,
    worker_id: null,
    actor_id: application.actor_id,
    actor_type: application.actor_type,
    role: job.role,
    payroll_account: Object.freeze({ asset: "KAIOS", wallet_address: application.payroll_wallet_address, address_control_proof: application.identity_proof_id, status: "SIMULATION_LEDGER_ONLY" }),
    compensation_policy: Object.freeze({ reward_kaios_wei: job.reward_kaios_wei, settlement: "SIMULATION_ONLY", funded: false, payable: false }),
    created_at: activatedAt,
    activation_authority: null,
    employment_created: false,
    worker_activated: false,
    formal_employee: false,
    company_owns_life: false,
    status: "CANDIDATE_ALPHA_PARTICIPATION_NOT_EMPLOYMENT"
  });
}

export function createEmploymentAlphaMission({ missionId, contract, createdAt }) {
  requireId(missionId, "employment_mission_id");
  invariant(contract?.status === "CANDIDATE_ALPHA_PARTICIPATION_NOT_EMPLOYMENT" && contract.employee_id === null && contract.worker_id === null && contract.activation_authority === null, "EMPLOYMENT_CANDIDATE_RECORD_REQUIRED", "Mission requires a non-employment Alpha candidate participation record");
  parseEmploymentTime(createdAt, "created_at");
  return Object.freeze({ mission_id: missionId, contract_id: contract.contract_id, candidate_id: contract.candidate_id, employee_id: null, worker_id: null, actor_id: contract.actor_id, company_id: contract.company_id, job_id: contract.job_id, objective: "COMPLETE_SAFE_K12345_TO_K11520_CASH_TRANSPORT_ORIENTATION", origin: "K12345", destination: "K11520", reward_asset: "KAIOS", reward_kaios_wei: contract.compensation_policy.reward_kaios_wei, proof_requirements: KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB.proof_requirements, accepted_at: null, verified_at: null, real_location_claimed: false, real_cargo_claimed: false, real_payment: false, created_at: createdAt, status: "AVAILABLE_ALPHA" });
}

export function acceptEmploymentAlphaMission({ mission, actorId, acceptedAt }) {
  invariant(mission?.status === "AVAILABLE_ALPHA" && mission.actor_id === actorId, "EMPLOYMENT_MISSION_NOT_AVAILABLE", "Only the assigned actor may accept an available mission");
  parseEmploymentTime(acceptedAt, "accepted_at");
  return Object.freeze({ ...mission, accepted_at: acceptedAt, status: "ACCEPTED_ALPHA" });
}

export function verifyEmploymentAlphaMission({ mission, evidenceEvents, verifiedAt }) {
  invariant(mission?.status === "ACCEPTED_ALPHA", "EMPLOYMENT_MISSION_ACCEPTANCE_REQUIRED", "Mission verification requires prior acceptance");
  requireArray(evidenceEvents, "employment_mission_evidence_events");
  parseEmploymentTime(verifiedAt, "verified_at");
  const ids = evidenceEvents.map((event) => event.event_id);
  invariant(ids.every(Boolean) && new Set(ids).size === ids.length, "EMPLOYMENT_EVIDENCE_REPLAY", "Mission evidence event IDs must be present and unique");
  invariant(evidenceEvents.every((event) => event.actor_id === mission.actor_id && event.mission_id === mission.mission_id && Number.isFinite(Date.parse(event.occurred_at))), "EMPLOYMENT_EVIDENCE_BINDING_MISMATCH", "Mission evidence must bind the assigned actor, mission and timestamp");
  const eventTypes = evidenceEvents.map((event) => event.event_type);
  const cursor = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB.proof_requirements.reduce((position, requiredType) => {
    const next = eventTypes.indexOf(requiredType, position);
    invariant(next >= position, "EMPLOYMENT_EVIDENCE_INCOMPLETE", `Mission evidence requires ordered ${requiredType}`);
    return next + 1;
  }, 0);
  invariant(cursor > 0, "EMPLOYMENT_EVIDENCE_INCOMPLETE", "Mission evidence is incomplete");
  return Object.freeze({ ...mission, evidence_event_ids: Object.freeze(ids), verified_at: verifiedAt, verification_scope: "IN_APP_ORIENTATION_ONLY", real_location_claimed: false, real_cargo_claimed: false, real_payment: false, status: "VERIFIED_ALPHA" });
}

export function appendKaiosAlphaEarning({ ledgerEntries = [], earningId, mission, contract, recordedAt }) {
  requireArray(ledgerEntries, "kaios_alpha_earning_entries");
  requireId(earningId, "kaios_alpha_earning_id");
  invariant(mission?.status === "VERIFIED_ALPHA" && mission.contract_id === contract?.contract_id, "EMPLOYMENT_VERIFIED_MISSION_REQUIRED", "KAIOS Alpha earning requires a verified mission bound to the employment contract");
  invariant(!ledgerEntries.some((entry) => entry.mission_id === mission.mission_id || entry.earning_id === earningId), "EMPLOYMENT_REWARD_REPLAY", "A mission can create at most one Alpha earning entry");
  parseEmploymentTime(recordedAt, "recorded_at");
  const entry = Object.freeze({ earning_id: earningId, mission_id: mission.mission_id, contract_id: contract.contract_id, candidate_id: contract.candidate_id, employee_id: null, worker_id: null, actor_id: contract.actor_id, payroll_wallet_address: contract.payroll_account.wallet_address, asset: "KAIOS", amount_kaios_wei: mission.reward_kaios_wei, accounting_class: "SIMULATED_MISSION_EARNING", funded: false, payable: false, settled: false, transaction_hash: null, recorded_at: recordedAt, status: "EARNED_SIMULATION_NOT_PAYABLE" });
  return Object.freeze([...ledgerEntries, entry]);
}

export const EMPLOYMENT_ALPHA_HISTORY_EVENT_TYPES = Object.freeze([
  "EMPLOYMENT_IDENTITY_VERIFIED",
  "EMPLOYMENT_APPLICATION_SUBMITTED",
  "EMPLOYMENT_CANDIDATE_SAFETY_SELF_CHECK_COMPLETED",
  "EMPLOYMENT_ALPHA_PARTICIPATION_RECORDED",
  "EMPLOYMENT_MISSION_CREATED",
  "EMPLOYMENT_MISSION_ACCEPTED",
  "EMPLOYMENT_MISSION_VERIFIED",
  "EMPLOYMENT_ALPHA_EARNING_RECORDED"
]);

const EMPLOYMENT_ALPHA_EVENT_RECORD_IDS = Object.freeze({
  EMPLOYMENT_IDENTITY_VERIFIED: "proof_id",
  EMPLOYMENT_APPLICATION_SUBMITTED: "application_id",
  EMPLOYMENT_CANDIDATE_SAFETY_SELF_CHECK_COMPLETED: "interview_id",
  EMPLOYMENT_ALPHA_PARTICIPATION_RECORDED: "contract_id",
  EMPLOYMENT_MISSION_CREATED: "mission_id",
  EMPLOYMENT_MISSION_ACCEPTED: "mission_id",
  EMPLOYMENT_MISSION_VERIFIED: "mission_id",
  EMPLOYMENT_ALPHA_EARNING_RECORDED: "earning_id"
});

function projectEmploymentAlphaHistoryRecord(eventType, record) {
  const common = { actor_id: record.actor_id, status: record.status };
  if (eventType === "EMPLOYMENT_IDENTITY_VERIFIED") return { ...common, proof_id: record.proof_id, actor_type: record.actor_type, wallet_address: record.wallet_address, chain_id: record.chain_id, authentication_method: record.authentication_method, signature_sha256: record.signature_sha256, canonical_life_identity: false, raw_signature_persisted: false };
  if (eventType === "EMPLOYMENT_APPLICATION_SUBMITTED") return { ...common, application_id: record.application_id, job_id: record.job_id, company_id: record.company_id, actor_type: record.actor_type, identity_proof_id: record.identity_proof_id, payroll_wallet_address: record.payroll_wallet_address, formal_employment_created: false };
  if (eventType === "EMPLOYMENT_CANDIDATE_SAFETY_SELF_CHECK_COMPLETED") return { ...common, interview_id: record.interview_id, application_id: record.application_id, score: record.score, minimum_score: record.minimum_score, company_decision: null, candidate_self_check_result: record.candidate_self_check_result, evidence: record.evidence };
  if (eventType === "EMPLOYMENT_ALPHA_PARTICIPATION_RECORDED") return { ...common, contract_id: record.contract_id, company_id: record.company_id, job_id: record.job_id, candidate_id: record.candidate_id, employee_id: null, worker_id: null, role: record.role, payroll_account: record.payroll_account, compensation_policy: record.compensation_policy, activation_authority: null, employment_created: false, worker_activated: false, formal_employee: false, company_owns_life: false };
  if (["EMPLOYMENT_MISSION_CREATED", "EMPLOYMENT_MISSION_ACCEPTED", "EMPLOYMENT_MISSION_VERIFIED"].includes(eventType)) return { ...common, mission_id: record.mission_id, contract_id: record.contract_id, candidate_id: record.candidate_id, employee_id: null, worker_id: null, company_id: record.company_id, job_id: record.job_id, objective: record.objective, origin: record.origin, destination: record.destination, accepted_at: record.accepted_at, verified_at: record.verified_at, verification_scope: record.verification_scope ?? null, real_location_claimed: false, real_cargo_claimed: false, real_payment: false };
  return { ...common, earning_id: record.earning_id, mission_id: record.mission_id, contract_id: record.contract_id, candidate_id: record.candidate_id, employee_id: null, worker_id: null, payroll_wallet_address: record.payroll_wallet_address, asset: record.asset, amount_kaios_wei: record.amount_kaios_wei, accounting_class: record.accounting_class, funded: false, payable: false, settled: false, transaction_hash: null };
}

export async function appendEmploymentAlphaCompanyEvent({ store, company, eventType, record, actorId, timestamp }) {
  requireEnum(eventType, EMPLOYMENT_ALPHA_HISTORY_EVENT_TYPES, "employment_history.event_type");
  invariant(company?.company_id === KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB.company_id, "EMPLOYMENT_HISTORY_COMPANY_INVALID", "Employment Alpha History belongs to the job's registered Company");
  invariant(record && typeof record === "object", "EMPLOYMENT_HISTORY_RECORD_REQUIRED", "Employment Alpha History requires a state record");
  const recordIdField = EMPLOYMENT_ALPHA_EVENT_RECORD_IDS[eventType];
  requireId(record[recordIdField], `employment_history.${recordIdField}`);
  requireId(actorId, "employment_history.actor_id");
  parseEmploymentTime(timestamp, "employment_history.timestamp");
  invariant(record.actor_id === actorId, "EMPLOYMENT_HISTORY_ACTOR_MISMATCH", "Employment Alpha History actor must match the state record");
  invariant(!/"(?:private_key|seed_phrase|signature|nonce|message)"\s*:/i.test(JSON.stringify(record)), "EMPLOYMENT_HISTORY_SECRET_FORBIDDEN", "Employment Alpha History cannot persist signing secrets or raw challenge material");
  const recordId = record[recordIdField];
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === eventType && event.payload?.record_id === recordId);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({
    domain: "COMPANY",
    stream: "COMPANY",
    id: company.company_id,
    entity: company,
    event_type: eventType,
    actor_id: actorId,
    timestamp,
    payload: { record_id: recordId, record_class: "SIMULATION", ...projectEmploymentAlphaHistoryRecord(eventType, record) }
  });
  return Object.freeze({ status: `${eventType}_APPENDED`, event });
}

export const EMPLOYMENT_PHASE1B_DECISIONS = Object.freeze(["APPROVE", "APPROVE_WITH_CONDITIONS", "REJECT", "WAITLIST", "NEED_MORE_INFO"]);
export const EMPLOYMENT_PHASE1B_HISTORY_EVENT_TYPES = Object.freeze([
  "APPLICATION_SUBMITTED", "INTERVIEW_STARTED", "INTERVIEW_COMPLETED", "EMPLOYMENT_DECISION_RECORDED",
  "EMPLOYEE_CREATED", "WORKER_ACTIVATED", "MISSION_ASSIGNED", "MISSION_ACCEPTED",
  "WORK_EVIDENCE_SUBMITTED", "WORK_REVIEWED", "COMPENSATION_ACCRUED", "PAYROLL_QUEUED", "PAYROLL_SETTLED",
  "COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET_CREATED", "COMPANY_AUTHORITY_REVIEW_SNAPSHOT_MATCH_CANDIDATE_CREATED",
  "COMPANY_AUTHORITY_PROVENANCE_ATTESTATION_REQUEST_CREATED", "COMPANY_AUTHORITY_PROPOSAL_REVIEW_CANDIDATE"
]);

const EMPLOYMENT_PHASE1B_EVENT_RECORD_IDS = Object.freeze({
  APPLICATION_SUBMITTED: "application_id", INTERVIEW_STARTED: "interview_id", INTERVIEW_COMPLETED: "interview_id",
  EMPLOYMENT_DECISION_RECORDED: "decision_id", EMPLOYEE_CREATED: "employee_id", WORKER_ACTIVATED: "worker_id",
  MISSION_ASSIGNED: "mission_id", MISSION_ACCEPTED: "mission_id", WORK_EVIDENCE_SUBMITTED: "evidence_id",
  WORK_REVIEWED: "review_id", COMPENSATION_ACCRUED: "accrual_id", PAYROLL_QUEUED: "payroll_queue_id",
  PAYROLL_SETTLED: "settlement_id", COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET_CREATED: "request_id",
  COMPANY_AUTHORITY_REVIEW_SNAPSHOT_MATCH_CANDIDATE_CREATED: "verification_id",
  COMPANY_AUTHORITY_PROVENANCE_ATTESTATION_REQUEST_CREATED: "attestation_request_id",
  COMPANY_AUTHORITY_PROPOSAL_REVIEW_CANDIDATE: "review_id"
});

function requireEmploymentBinding(record, expected, code, message) {
  invariant(Object.entries(expected).every(([field, value]) => record?.[field] === value), code, message);
}

export function verifyRepositoryBoundCompanyAuthority({ authorityId, companyId, actorId, requiredScope, repositoryHead, at, errorCode = "COMPANY_AUTHORITY_NOT_CONNECTED" }) {
  requireId(authorityId, "company_authority_id");
  const authority = CANONICAL_REPOSITORY_COMPANY_AUTHORITIES.find((record) => record.authority_id === authorityId);
  invariant(authority, errorCode, "Company authority ID is not present in the canonical repository allowlist");
  invariant(authority?.record_class === "REPOSITORY_BOUND_COMPANY_AUTHORITY" && authority.status === "ACTIVE", errorCode, "An active repository-bound Company authority record is required");
  requireId(authority.authority_id, "company_authority_id");
  requireId(authority.authorized_actor_id, "company_authority_actor_id");
  requireId(authority.controller_id, "company_authority_controller_id");
  requireArray(authority.authority_scope, "company_authority.scope");
  requireArray(authority.evidence, "company_authority.evidence");
  invariant(authority.company_id === companyId && authority.authorized_actor_id === actorId, errorCode, "Company authority must bind the expected Company and acting actor");
  invariant(REPOSITORY_BOUND_COMPANY_AUTHORITY_SCOPES.includes(requiredScope) && authority.authority_scope.includes(requiredScope), errorCode, `Company authority does not include ${requiredScope}`);
  invariant(/^[0-9a-f]{40}$/i.test(String(repositoryHead ?? "")) && authority.exact_repository_version === repositoryHead, errorCode, "Company authority must bind the exact repository head");
  invariant(typeof authority.role === "string" && authority.role.length > 0 && typeof authority.policy_version === "string" && authority.policy_version.length > 0, errorCode, "Company authority requires a role and policy version");
  invariant(authority.evidence.length > 0 && authority.evidence.every((item) => typeof item === "string" && item.length > 0), errorCode, "Company authority requires non-empty evidence references");
  const observed = parseEmploymentTime(at, "company_authority_observed_at");
  const validFrom = parseEmploymentTime(authority.valid_from, "company_authority.valid_from");
  const validUntil = authority.valid_until === null ? null : parseEmploymentTime(authority.valid_until, "company_authority.valid_until");
  invariant(observed >= validFrom && (validUntil === null || observed <= validUntil), errorCode, "Company authority is outside its validity window");
  return Object.freeze({
    authority_id: authority.authority_id,
    company_id: authority.company_id,
    authorized_actor_id: authority.authorized_actor_id,
    controller_id: authority.controller_id,
    role: authority.role,
    policy_version: authority.policy_version,
    required_scope: requiredScope,
    constraints: authority.constraints ? Object.freeze({ ...authority.constraints }) : null,
    exact_repository_version: repositoryHead,
    verified_at: at,
    status: "CANONICAL_REPOSITORY_COMPANY_AUTHORITY_VERIFIED"
  });
}

export function createCompanyInterview({ interviewId, application, interviewerId, questions, answers, evidence, startedAt, completedAt, authorityId = null, repositoryHead = null }) {
  requireId(interviewId, "company_interview_id");
  requireId(interviewerId, "company_interviewer_id");
  invariant(["SUBMITTED_ALPHA", "SUBMITTED_REAL_TEST"].includes(application?.status), "COMPANY_INTERVIEW_APPLICATION_REQUIRED", "Company interview requires a submitted application");
  invariant(interviewerId !== application.actor_id, "COMPANY_INTERVIEW_SELF_INTERVIEW_FORBIDDEN", "A candidate cannot act as the Company interviewer");
  requireArray(questions, "company_interview.questions");
  requireArray(answers, "company_interview.answers");
  requireArray(evidence, "company_interview.evidence");
  invariant(questions.length >= 3 && answers.length === questions.length, "COMPANY_INTERVIEW_ANSWERS_INCOMPLETE", "Company interview requires an answer for every question");
  const started = parseEmploymentTime(startedAt, "started_at");
  const completed = parseEmploymentTime(completedAt, "completed_at");
  invariant(completed >= started, "COMPANY_INTERVIEW_TIME_INVALID", "Company interview cannot complete before it starts");
  const scores = answers.map((answer) => Number(answer.score));
  invariant(scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 100), "COMPANY_INTERVIEW_SCORE_INVALID", "Every Company interview answer requires a 0-100 score");
  const capabilityScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const safetyAnswers = answers.filter((answer) => answer.category === "SAFETY");
  const roleAnswers = answers.filter((answer) => answer.category === "ROLE_FIT");
  const average = (values, fallback) => values.length ? Math.round(values.reduce((sum, answer) => sum + Number(answer.score), 0) / values.length) : fallback;
  const safetyScore = average(safetyAnswers, capabilityScore);
  const roleFitScore = average(roleAnswers, capabilityScore);
  const authorityVerification = authorityId ? verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: application.company_id, actorId: interviewerId, requiredScope: "COMPANY_INTERVIEW", repositoryHead, at: completedAt, errorCode: "COMPANY_INTERVIEW_AUTHORITY_NOT_CONNECTED" }) : null;
  invariant(!authorityVerification || authorityVerification.controller_id !== application.controller_id, "COMPANY_INTERVIEW_CONTROLLER_COLLISION", "Candidate and interviewer must not share a controller");
  return Object.freeze({
    interview_id: interviewId, application_id: application.application_id, company_id: application.company_id,
    job_id: application.job_id, actor_id: application.actor_id, interviewer_id: interviewerId,
    questions: Object.freeze(questions.map((question) => Object.freeze({ ...question }))),
    answers: Object.freeze(answers.map((answer) => Object.freeze({ ...answer }))),
    capability_score: capabilityScore, safety_score: safetyScore, role_fit_score: roleFitScore,
    evidence: Object.freeze([...evidence]), candidate_self_check: false, company_decision: null,
    started_at: startedAt, completed_at: completedAt,
    authority_id: authorityVerification?.authority_id ?? null,
    repository_bound_interviewer_authority: Boolean(authorityVerification),
    repository_bound_authority_verified: Boolean(authorityVerification),
    status: authorityVerification ? "COMPANY_INTERVIEW_COMPLETED" : "COMPANY_INTERVIEW_CANDIDATE_NOT_AUTHORITY"
  });
}

export function recordCompanyEmploymentDecision({ decisionId, application, interview, job = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB, decisionMakerId, decision, conditions = [], evidence, decidedAt, authorityId, repositoryHead }) {
  invariant(authorityId, "COMPANY_EMPLOYMENT_AUTHORITY_NOT_CONNECTED", "A repository-bound Company employment decision authority is not connected");
  requireId(decisionId, "employment_decision_id");
  requireId(decisionMakerId, "employment_decision_maker_id");
  requireEnum(decision, EMPLOYMENT_PHASE1B_DECISIONS, "employment_decision");
  requireArray(conditions, "employment_decision.conditions");
  requireArray(evidence, "employment_decision.evidence");
  invariant(decisionMakerId !== application?.actor_id, "EMPLOYMENT_SELF_HIRE_FORBIDDEN", "A candidate cannot make their own employment decision");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: job.company_id, actorId: decisionMakerId, requiredScope: "EMPLOYMENT_DECISION", repositoryHead, at: decidedAt, errorCode: "COMPANY_EMPLOYMENT_AUTHORITY_NOT_CONNECTED" });
  invariant(authorityVerification.controller_id !== application?.controller_id, "EMPLOYMENT_DECISION_CONTROLLER_COLLISION", "Candidate and decision maker must not share a controller");
  invariant(interview?.status === "COMPANY_INTERVIEW_COMPLETED", "EMPLOYMENT_DECISION_INTERVIEW_REQUIRED", "Employment decision requires completed Company interview evidence");
  requireEmploymentBinding(interview, { application_id: application?.application_id, company_id: job.company_id, job_id: job.job_id, actor_id: application?.actor_id }, "EMPLOYMENT_DECISION_BINDING_MISMATCH", "Employment decision must bind the application, interview, job, Company and actor");
  invariant(evidence.length > 0, "EMPLOYMENT_DECISION_EVIDENCE_REQUIRED", "Employment decision requires evidence");
  if (decision === "APPROVE_WITH_CONDITIONS") invariant(conditions.length > 0, "EMPLOYMENT_DECISION_CONDITIONS_REQUIRED", "Conditional approval requires recorded conditions");
  parseEmploymentTime(decidedAt, "decided_at");
  return Object.freeze({
    decision_id: decisionId, application_id: application.application_id, interview_id: interview.interview_id,
    company_id: job.company_id, job_id: job.job_id, actor_id: application.actor_id,
    decision_maker_id: decisionMakerId, decision, conditions: Object.freeze([...conditions]), evidence: Object.freeze([...evidence]),
    approved_for_employee_record: ["APPROVE", "APPROVE_WITH_CONDITIONS"].includes(decision),
    authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead,
    repository_bound_authority_verified: true, decided_at: decidedAt, status: "EMPLOYMENT_DECISION_RECORDED"
  });
}

export function createCompanyEmployeeRecord({ employeeId, existingEmployees = [], application, interview, employmentDecision, job = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB, employmentType = "ALPHA_TRIAL", lifeId = null, startDate, createdBy, authorityId, repositoryHead }) {
  invariant(authorityId, "EMPLOYEE_AUTHORITY_NOT_CONNECTED", "A repository-bound Employee creation authority is not connected");
  requireId(employeeId, "employee_id");
  requireArray(existingEmployees, "existing_employees");
  requireEnum(employmentType, ["ALPHA_TRIAL", "PART_TIME", "FULL_TIME", "CONTRACT"], "employment_type");
  requireId(createdBy, "employee_record_creator_id");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: job.company_id, actorId: createdBy, requiredScope: "EMPLOYEE_CREATE", repositoryHead, at: startDate, errorCode: "EMPLOYEE_AUTHORITY_NOT_CONNECTED" });
  invariant(createdBy !== application?.actor_id && authorityVerification.controller_id !== application?.controller_id, "EMPLOYEE_SELF_CREATION_FORBIDDEN", "Candidate cannot create their own Employee record");
  invariant(employmentDecision?.approved_for_employee_record === true && ["APPROVE", "APPROVE_WITH_CONDITIONS"].includes(employmentDecision.decision), "EMPLOYEE_APPROVED_DECISION_REQUIRED", "Only an approved Company employment decision can create an Employee record");
  requireEmploymentBinding(employmentDecision, { application_id: application?.application_id, interview_id: interview?.interview_id, company_id: job.company_id, job_id: job.job_id, actor_id: application?.actor_id }, "EMPLOYEE_DECISION_BINDING_MISMATCH", "Employee record must bind the approved application, interview, job, Company and actor");
  invariant(!existingEmployees.some((employee) => employee.employee_id === employeeId || (employee.actor_id === application.actor_id && employee.company_id === job.company_id && employee.status !== "TERMINATED")), "EMPLOYEE_RECORD_REPLAY", "Employee ID and active actor/Company employment must be unique");
  invariant(application.actor_type === "AI_LIFE" ? typeof lifeId === "string" && lifeId.length > 0 : lifeId === null, "EMPLOYEE_LIFE_ID_BOUNDARY_INVALID", "AI Life employment requires an explicit Life ID while Human employment must not invent one");
  parseEmploymentTime(startDate, "start_date");
  return Object.freeze({
    employee_id: employeeId, actor_id: application.actor_id, actor_type: application.actor_type, controller_id: application.controller_id, life_id: lifeId,
    company_id: job.company_id, job_id: job.job_id, role: job.role, employment_type: employmentType,
    start_date: startDate, status: job.status === "OPEN_REAL_TEST_PENDING_AUTHORITY" ? "ACTIVE_REAL_TEST" : "ACTIVE_ALPHA_UNDER_REVIEW", worker_id: null,
    payroll_account: Object.freeze({
      account_id: `PAYROLL_${employeeId}`, asset: "KAIOS", wallet_address: application.payroll_wallet_address,
      address_control_proof: application.identity_proof_id, payday_policy: "CURRENT_CANONICAL_MONTHLY_DAY_5",
      accrued_kaios_wei: "0", payable_kaios_wei: "0", paid_kaios_wei: "0", advance_kaios_wei: "0",
      fees_kaios_wei: "0", debt_kaios_wei: "0", next_payday: null, payroll_history: Object.freeze([]),
      funded: false, payable: false, paid: false, status: "ACCRUED_NOT_PAYABLE"
    }),
    compensation_policy: Object.freeze({ asset: "KAIOS", mission_reward_kaios_wei: job.reward_kaios_wei, settlement: job.real_payment ? "EXACT_PAYMENT_PENDING_FUNDING" : "SIMULATION_ONLY" }),
    company_owns_life: false, identity_equals_employee: false, created_from_decision_id: employmentDecision.decision_id,
    created_by: createdBy, authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead,
    repository_bound_authority_verified: true
  });
}

export function activateCompanyWorkerCandidate({ workerId, employee, capabilities, taskScope, safetyPolicy, runtimeEvidence, activatedAt }) {
  invariant(false, "WORKER_ACTIVATION_AUTHORITY_NOT_CONNECTED", "A canonical Worker Registry activation authority is not connected");
  requireId(workerId, "worker_id");
  requireArray(capabilities, "worker.capabilities");
  requireArray(taskScope, "worker.task_scope");
  requireArray(safetyPolicy, "worker.safety_policy");
  requireArray(runtimeEvidence, "worker.runtime_evidence");
  invariant(employee?.status === "ACTIVE_ALPHA_UNDER_REVIEW", "WORKER_EMPLOYEE_REQUIRED", "Policy-bound Worker activation requires an active Employee record");
  invariant(capabilities.length > 0 && taskScope.length > 0 && safetyPolicy.length > 0 && runtimeEvidence.length > 0, "WORKER_ACTIVATION_EVIDENCE_REQUIRED", "Worker activation requires capabilities, scope, safety policy and runtime evidence");
  parseEmploymentTime(activatedAt, "activated_at");
  return Object.freeze({
    worker_id: workerId, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id,
    capabilities: Object.freeze([...capabilities]), task_scope: Object.freeze([...taskScope]), safety_policy: Object.freeze([...safetyPolicy]),
    runtime_evidence: Object.freeze([...runtimeEvidence]), trust_level: null, signer: false, treasury_authority: false,
    governance_authority: false, mainnet_arbitrary_execution: false, activated_at: activatedAt,
    status: "WORKER_ACTIVATION_CANDIDATE_UNDER_REVIEW"
  });
}

export function createCompanyEmployeeMission({ missionId, employee, job = KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB, assignedBy, createdAt, authorityId, repositoryHead }) {
  invariant(authorityId, "MISSION_DISPATCH_AUTHORITY_NOT_CONNECTED", "A canonical Company mission dispatch authority is not connected");
  requireId(missionId, "employee_mission_id");
  requireId(assignedBy, "mission_assigner_id");
  invariant(["ACTIVE_ALPHA_UNDER_REVIEW", "ACTIVE_REAL_TEST"].includes(employee?.status) && employee.company_id === job.company_id && employee.job_id === job.job_id, "MISSION_EMPLOYEE_BINDING_REQUIRED", "Company mission requires an active Employee bound to the job and Company");
  invariant(assignedBy !== employee.actor_id, "MISSION_SELF_ASSIGNMENT_FORBIDDEN", "Employee cannot issue their own Company mission");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: job.company_id, actorId: assignedBy, requiredScope: "MISSION_DISPATCH", repositoryHead, at: createdAt, errorCode: "MISSION_DISPATCH_AUTHORITY_NOT_CONNECTED" });
  invariant(authorityVerification.controller_id !== employee.controller_id, "MISSION_ASSIGNER_CONTROLLER_COLLISION", "Employee and mission assigner must not share a controller");
  parseEmploymentTime(createdAt, "mission_created_at");
  const realTest = job.status === "OPEN_REAL_TEST_PENDING_AUTHORITY";
  return Object.freeze({
    mission_id: missionId, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id,
    job_id: employee.job_id, assigned_by: assignedBy, objective: realTest ? "COMPLETE_KAIOS_AI_OS_FIRST_EMPLOYMENT_ORIENTATION" : "COMPLETE_SAFE_K12345_TO_K11520_CASH_TRANSPORT_ORIENTATION",
    origin: realTest ? "DIGITAL_KAIOS_AI_OS" : "K12345", destination: realTest ? "DIGITAL_KAIOS_AI_OS" : "K11520", reward_asset: "KAIOS", reward_kaios_wei: job.reward_kaios_wei,
    proof_requirements: Object.freeze(realTest ? [...job.proof_requirements] : ["MISSION_ACCEPTED", "ORIENTATION_CHECKLIST_CONFIRMED"]), accepted_at: null,
    created_at: createdAt, real_location_claimed: false, real_cargo_claimed: false, real_payment: realTest,
    authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead, repository_bound_authority_verified: true,
    status: realTest ? "ASSIGNED_REAL_TEST_DIGITAL" : "ASSIGNED_SIMULATION"
  });
}

export function acceptCompanyEmployeeMission({ mission, employee, acceptedAt }) {
  invariant(["ASSIGNED_SIMULATION", "ASSIGNED_REAL_TEST_DIGITAL"].includes(mission?.status) && mission.employee_id === employee?.employee_id && mission.actor_id === employee.actor_id, "MISSION_WRONG_EMPLOYEE", "Only the assigned Employee may accept the mission");
  parseEmploymentTime(acceptedAt, "mission_accepted_at");
  return Object.freeze({ ...mission, accepted_at: acceptedAt, status: mission.status === "ASSIGNED_REAL_TEST_DIGITAL" ? "ACCEPTED_REAL_TEST_DIGITAL" : "ACCEPTED_SIMULATION" });
}

export function submitCompanyWorkEvidence({ evidenceId, mission, employee, events, submittedAt }) {
  requireId(evidenceId, "work_evidence_id");
  invariant(["ACCEPTED_SIMULATION", "ACCEPTED_REAL_TEST_DIGITAL"].includes(mission?.status) && mission.employee_id === employee?.employee_id && mission.actor_id === employee.actor_id, "WORK_EVIDENCE_MISSION_BINDING_REQUIRED", "Work evidence must bind the accepted mission and assigned Employee");
  requireArray(events, "work_evidence.events");
  const eventIds = events.map((event) => event.event_id);
  invariant(eventIds.length >= mission.proof_requirements.length && eventIds.every(Boolean) && new Set(eventIds).size === eventIds.length, "WORK_EVIDENCE_REPLAY_OR_INCOMPLETE", "Work evidence IDs must be unique and complete");
  invariant(events.every((event) => event.actor_id === employee.actor_id && event.employee_id === employee.employee_id && event.mission_id === mission.mission_id && Number.isFinite(Date.parse(event.occurred_at))), "WORK_EVIDENCE_BINDING_MISMATCH", "Every work evidence event must bind mission, Employee, actor and timestamp");
  const eventTypes = events.map((event) => event.event_type);
  mission.proof_requirements.reduce((position, requirement) => {
    const next = eventTypes.indexOf(requirement, position);
    invariant(next >= position, "WORK_EVIDENCE_REQUIREMENT_MISSING", `Work evidence requires ordered ${requirement}`);
    return next + 1;
  }, 0);
  parseEmploymentTime(submittedAt, "work_evidence_submitted_at");
  return Object.freeze({ evidence_id: evidenceId, mission_id: mission.mission_id, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id, event_ids: Object.freeze(eventIds), submitted_at: submittedAt, status: mission.status === "ACCEPTED_REAL_TEST_DIGITAL" ? "WORK_EVIDENCE_SUBMITTED_REAL_TEST" : "WORK_EVIDENCE_SUBMITTED_SIMULATION" });
}

export function reviewCompanyWorkEvidence({ reviewId, mission, employee, workEvidence, reviewerId, decision, evidence, reviewedAt, authorityId, repositoryHead }) {
  invariant(authorityId, "WORK_REVIEW_AUTHORITY_NOT_CONNECTED", "A distinct repository-bound work review authority is not connected");
  requireId(reviewId, "work_review_id");
  requireId(reviewerId, "work_reviewer_id");
  requireEnum(decision, ["APPROVE", "REJECT", "NEED_MORE_INFO"], "work_review_decision");
  requireArray(evidence, "work_review.evidence");
  invariant(reviewerId !== employee?.actor_id, "WORK_SELF_REVIEW_FORBIDDEN", "Employee cannot review their own work evidence");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: employee?.company_id, actorId: reviewerId, requiredScope: "WORK_REVIEW", repositoryHead, at: reviewedAt, errorCode: "WORK_REVIEW_AUTHORITY_NOT_CONNECTED" });
  invariant(authorityVerification.controller_id !== employee?.controller_id, "WORK_REVIEW_CONTROLLER_COLLISION", "Employee and work reviewer must not share a controller");
  requireEmploymentBinding(workEvidence, { mission_id: mission?.mission_id, employee_id: employee?.employee_id, actor_id: employee?.actor_id, company_id: employee?.company_id }, "WORK_REVIEW_BINDING_MISMATCH", "Work review must bind the mission, Employee, actor and Company evidence");
  invariant(["WORK_EVIDENCE_SUBMITTED_SIMULATION", "WORK_EVIDENCE_SUBMITTED_REAL_TEST"].includes(workEvidence?.status) && evidence.length > 0, "WORK_REVIEW_EVIDENCE_REQUIRED", "Work review requires submitted evidence and a review basis");
  parseEmploymentTime(reviewedAt, "work_reviewed_at");
  return Object.freeze({ review_id: reviewId, evidence_id: workEvidence.evidence_id, mission_id: mission.mission_id, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id, reviewer_id: reviewerId, decision, evidence: Object.freeze([...evidence]), reviewed_at: reviewedAt, independent_review: reviewerId !== employee.actor_id, authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead, repository_bound_authority_verified: true, status: workEvidence.status === "WORK_EVIDENCE_SUBMITTED_REAL_TEST" ? `WORK_${decision}_REAL_TEST` : `WORK_${decision}_SIMULATION` });
}

export function accrueCompanyCompensation({ ledgerEntries = [], accrualId, mission, employee, workReview, accruedAt, authorizedBy, authorityId, repositoryHead }) {
  invariant(authorityId, "COMPENSATION_AUTHORITY_NOT_CONNECTED", "A repository-bound compensation policy and authority are not connected");
  requireArray(ledgerEntries, "compensation_accrual_entries");
  requireId(accrualId, "compensation_accrual_id");
  requireId(authorizedBy, "compensation_authorizer_id");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: employee?.company_id, actorId: authorizedBy, requiredScope: "COMPENSATION_ACCRUAL", repositoryHead, at: accruedAt, errorCode: "COMPENSATION_AUTHORITY_NOT_CONNECTED" });
  invariant(workReview?.decision === "APPROVE" && workReview.mission_id === mission?.mission_id && workReview.employee_id === employee?.employee_id, "COMPENSATION_APPROVED_WORK_REQUIRED", "Compensation accrual requires approved work bound to the mission and Employee");
  invariant(!ledgerEntries.some((entry) => entry.accrual_id === accrualId || entry.mission_id === mission.mission_id), "COMPENSATION_ACCRUAL_REPLAY", "A mission can accrue compensation exactly once");
  parseEmploymentTime(accruedAt, "compensation_accrued_at");
  const entry = Object.freeze({ accrual_id: accrualId, mission_id: mission.mission_id, review_id: workReview.review_id, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id, payroll_account_id: employee.payroll_account.account_id, asset: "KAIOS", amount_kaios_wei: mission.reward_kaios_wei, accrued: true, payable: false, paid: false, funded: false, settlement_receipt: null, accrued_at: accruedAt, authorized_by: authorizedBy, authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead, repository_bound_authority_verified: true, status: mission.real_payment ? "ACCRUED_REAL_TEST_NOT_PAYABLE" : "ACCRUED_SIMULATION_NOT_PAYABLE" });
  return Object.freeze([...ledgerEntries, entry]);
}

export function queueCompanyPayroll({ payrollQueueId, queueEntries = [], employee, accrual, queuedAt, queuedBy, authorityId, repositoryHead }) {
  invariant(authorityId, "PAYROLL_AUTHORITY_NOT_CONNECTED", "A repository-bound Payroll authority is not connected");
  requireId(payrollQueueId, "payroll_queue_id");
  requireArray(queueEntries, "payroll_queue_entries");
  requireId(queuedBy, "payroll_queue_actor_id");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: employee?.company_id, actorId: queuedBy, requiredScope: "PAYROLL_QUEUE", repositoryHead, at: queuedAt, errorCode: "PAYROLL_AUTHORITY_NOT_CONNECTED" });
  invariant(["ACCRUED_SIMULATION_NOT_PAYABLE", "ACCRUED_REAL_TEST_NOT_PAYABLE"].includes(accrual?.status) && accrual.employee_id === employee?.employee_id && accrual.payroll_account_id === employee?.payroll_account?.account_id, "PAYROLL_ACCRUAL_BINDING_REQUIRED", "Payroll queue requires a bound compensation accrual");
  invariant(!queueEntries.some((entry) => entry.payroll_queue_id === payrollQueueId || entry.accrual_id === accrual.accrual_id), "PAYROLL_QUEUE_REPLAY", "Compensation accrual can enter Payroll Queue exactly once");
  parseEmploymentTime(queuedAt, "payroll_queued_at");
  const entry = Object.freeze({ payroll_queue_id: payrollQueueId, accrual_id: accrual.accrual_id, employee_id: employee.employee_id, actor_id: employee.actor_id, company_id: employee.company_id, payroll_account_id: employee.payroll_account.account_id, payroll_wallet_address: employee.payroll_account.wallet_address, asset: accrual.asset, accrued_kaios_wei: accrual.amount_kaios_wei, payable_kaios_wei: "0", paid_kaios_wei: "0", advance_kaios_wei: "0", fees_kaios_wei: "0", debt_kaios_wei: "0", next_payday: null, funded: false, payable: false, paid: false, settlement_receipt: null, queued_at: queuedAt, queued_by: queuedBy, authority_id: authorityVerification.authority_id, exact_repository_version: repositoryHead, repository_bound_authority_verified: true, status: accrual.status === "ACCRUED_REAL_TEST_NOT_PAYABLE" ? "QUEUED_REAL_TEST_AWAITING_FUNDING" : "QUEUED_SIMULATION_AWAITING_FUNDING_AND_AUTHORITY" });
  return Object.freeze([...queueEntries, entry]);
}

export function authorizeCompanyPayrollFunding({ payrollEntry, fundingEvidence, authorizedBy, authorityId, repositoryHead, authorizedAt }) {
  requireId(authorizedBy, "payroll_funding_authorizer_id");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: payrollEntry?.company_id, actorId: authorizedBy, requiredScope: "PAYROLL_FUNDING", repositoryHead, at: authorizedAt, errorCode: "PAYROLL_FUNDING_AUTHORITY_NOT_CONNECTED" });
  invariant(payrollEntry?.status === "QUEUED_REAL_TEST_AWAITING_FUNDING" && payrollEntry.asset === "KAIOS", "PAYROLL_FUNDING_QUEUE_REQUIRED", "Funding authorization requires a queued real-test KAIOS payroll entry");
  requireId(fundingEvidence?.evidence_id, "payroll_funding_evidence_id");
  invariant(authorityVerification.constraints?.action_type === "ONE_EXACT_KAIOS_PAYMENT_ACTION" && authorityVerification.constraints.payment_purpose === "PAYROLL" && Number(authorityVerification.constraints.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(authorityVerification.constraints.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "PAYROLL_FUNDING_EXACT_ACTION_REQUIRED", "Payroll funding authority must use the common one-exact-action KAIOS payment rail on chain 56");
  invariant(String(authorityVerification.constraints.amount_kaios_wei) === payrollEntry.accrued_kaios_wei && String(authorityVerification.constraints.recipient_address).toLowerCase() === payrollEntry.payroll_wallet_address, "PAYROLL_FUNDING_EXACT_ACTION_MISMATCH", "Payroll funding authority amount and recipient must match the queued payroll entry");
  invariant(Number(fundingEvidence.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(fundingEvidence.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "PAYROLL_FUNDING_TOKEN_MISMATCH", "Funding evidence must bind the canonical KAIOS token on chain 56");
  invariant(/^0x[0-9a-f]{40}$/i.test(String(fundingEvidence.source_address ?? "")), "PAYROLL_FUNDING_SOURCE_INVALID", "Funding evidence requires a public source address");
  invariant(BigInt(fundingEvidence.verified_balance_kaios_wei) >= BigInt(payrollEntry.accrued_kaios_wei), "PAYROLL_FUNDING_BALANCE_INSUFFICIENT", "Verified payroll funding balance is insufficient");
  invariant(String(authorityVerification.constraints.source_address).toLowerCase() === String(fundingEvidence.source_address).toLowerCase(), "PAYROLL_FUNDING_SOURCE_MISMATCH", "Payroll funding authority must bind the verified source address");
  parseEmploymentTime(fundingEvidence.observed_at, "payroll_funding_observed_at");
  parseEmploymentTime(authorizedAt, "payroll_funding_authorized_at");
  return Object.freeze({ ...payrollEntry, payable_kaios_wei: payrollEntry.accrued_kaios_wei, funded: true, payable: true, funding_evidence_id: fundingEvidence.evidence_id, funding_source_address: fundingEvidence.source_address.toLowerCase(), funding_observed_at: fundingEvidence.observed_at, funding_authority_id: authorityVerification.authority_id, funding_authorized_at: authorizedAt, payment_rail_action_type: "ONE_EXACT_KAIOS_PAYMENT_ACTION", status: "FUNDED_PAYABLE_REAL_TEST" });
}

export function recordCompanyPayrollSettlement({ settlementId, payrollEntry, settlementReceipt, settledAt, verifiedBy, authorityId, repositoryHead }) {
  invariant(authorityId, "PAYROLL_SETTLEMENT_AUTHORITY_NOT_CONNECTED", "A repository-bound settlement verifier and payment authority are not connected");
  requireId(settlementId, "payroll_settlement_id");
  requireId(verifiedBy, "payroll_settlement_verifier_id");
  const authorityVerification = verifyRepositoryBoundCompanyAuthority({ authorityId, companyId: payrollEntry?.company_id, actorId: verifiedBy, requiredScope: "PAYROLL_SETTLEMENT_VERIFY", repositoryHead, at: settledAt, errorCode: "PAYROLL_SETTLEMENT_AUTHORITY_NOT_CONNECTED" });
  invariant(authorityVerification.constraints?.action_type === "ONE_EXACT_KAIOS_PAYMENT_ACTION" && authorityVerification.constraints.payment_purpose === "PAYROLL" && String(authorityVerification.constraints.amount_kaios_wei) === payrollEntry?.payable_kaios_wei && String(authorityVerification.constraints.recipient_address).toLowerCase() === payrollEntry?.payroll_wallet_address && String(authorityVerification.constraints.source_address).toLowerCase() === payrollEntry?.funding_source_address, "PAYROLL_SETTLEMENT_EXACT_ACTION_MISMATCH", "Settlement authority must bind the one exact common-rail payroll source, recipient and amount");
  invariant(payrollEntry?.payable === true && payrollEntry.funded === true, "PAYROLL_NOT_PAYABLE", "Payroll settlement requires separately verified funding and payable state");
  invariant(settlementReceipt?.receipt_status === 1 && /^0x[0-9a-f]{64}$/i.test(String(settlementReceipt.transaction_hash ?? "")), "PAYROLL_SETTLEMENT_RECEIPT_REQUIRED", "Paid status requires a successful settlement receipt");
  invariant(Number(settlementReceipt.chain_id) === KAIOS_MAINNET_TOKEN.chain_id && String(settlementReceipt.token_address).toLowerCase() === KAIOS_MAINNET_TOKEN.contract_address.toLowerCase(), "PAYROLL_SETTLEMENT_TOKEN_MISMATCH", "Payroll receipt must bind canonical KAIOS on chain 56");
  invariant(String(settlementReceipt.from).toLowerCase() === payrollEntry.funding_source_address && String(settlementReceipt.to).toLowerCase() === payrollEntry.payroll_wallet_address, "PAYROLL_SETTLEMENT_PARTY_MISMATCH", "Payroll receipt parties must match the authorized funding source and Employee wallet");
  invariant(BigInt(settlementReceipt.balance_before_kaios_wei) >= 0n && BigInt(settlementReceipt.balance_after_kaios_wei) >= 0n && String(settlementReceipt.amount_kaios_wei) === payrollEntry.payable_kaios_wei && BigInt(settlementReceipt.balance_after_kaios_wei) - BigInt(settlementReceipt.balance_before_kaios_wei) === BigInt(payrollEntry.payable_kaios_wei), "PAYROLL_SETTLEMENT_AMOUNT_MISMATCH", "Payroll receipt amount and Employee balance delta must equal the payable amount");
  invariant(Number.isInteger(settlementReceipt.block_number) && settlementReceipt.block_number > 0 && /^0x[0-9a-f]{64}$/i.test(String(settlementReceipt.block_hash ?? "")) && Number.isInteger(settlementReceipt.confirmations) && settlementReceipt.confirmations >= 1, "PAYROLL_SETTLEMENT_BLOCK_EVIDENCE_REQUIRED", "Payroll receipt requires block evidence and at least one confirmation");
  parseEmploymentTime(settledAt, "payroll_settled_at");
  return Object.freeze({ settlement_id: settlementId, payroll_queue_id: payrollEntry.payroll_queue_id, employee_id: payrollEntry.employee_id, actor_id: payrollEntry.actor_id, company_id: payrollEntry.company_id, from: settlementReceipt.from.toLowerCase(), to: settlementReceipt.to.toLowerCase(), token_address: settlementReceipt.token_address, amount_kaios_wei: payrollEntry.payable_kaios_wei, transaction_hash: settlementReceipt.transaction_hash.toLowerCase(), receipt_status: 1, block_number: settlementReceipt.block_number, block_hash: settlementReceipt.block_hash.toLowerCase(), confirmations: settlementReceipt.confirmations, balance_before_kaios_wei: String(settlementReceipt.balance_before_kaios_wei), balance_after_kaios_wei: String(settlementReceipt.balance_after_kaios_wei), verified_by: verifiedBy, authority_id: authorityVerification.authority_id, settled_at: settledAt, paid: true, status: "PAYROLL_SETTLED_WITH_VERIFIED_MAINNET_RECEIPT" });
}

export function evaluateAtmPayrollAdvanceCandidate({ employee, payrollEntry, requestedKaiosWei, availableLiquidityKaiosWei }) {
  invariant(false, "ATM_PAYROLL_AUTHORITY_NOT_CONNECTED", "A repository-bound ATM payroll advance authority is not connected");
  invariant(payrollEntry?.employee_id === employee?.employee_id && payrollEntry?.payroll_account_id === employee?.payroll_account?.account_id, "ATM_PAYROLL_BINDING_REQUIRED", "ATM advance requires verified Employee payroll binding");
  invariant(payrollEntry.status === "QUEUED_SIMULATION_AWAITING_FUNDING_AND_AUTHORITY", "ATM_VERIFIED_PAYROLL_REQUIRED", "ATM cannot lend against unverified payroll");
  const accrued = BigInt(payrollEntry.accrued_kaios_wei);
  const requested = BigInt(requestedKaiosWei);
  const liquidity = BigInt(availableLiquidityKaiosWei);
  invariant(requested > 0n, "ATM_ADVANCE_AMOUNT_INVALID", "ATM advance amount must be positive");
  const maximum = accrued * 30n / 100n;
  invariant(requested <= maximum, "ATM_ADVANCE_LIMIT_EXCEEDED", "ATM advance cannot exceed 30 percent of machine-verified accrued compensation");
  invariant(liquidity >= requested, "ATM_LIQUIDITY_INSUFFICIENT", "ATM advance fails closed when prefunded liquidity is insufficient");
  return Object.freeze({ employee_id: employee.employee_id, payroll_queue_id: payrollEntry.payroll_queue_id, requested_kaios_wei: requested.toString(), maximum_kaios_wei: maximum.toString(), available_liquidity_kaios_wei: liquidity.toString(), real_withdrawal: false, transaction_hash: null, status: "ATM_ADVANCE_SIMULATION_ELIGIBLE_NOT_EXECUTED" });
}

export async function appendEmploymentPhase1BCompanyEvent({ store, company, eventType, record, actorId, timestamp }) {
  requireEnum(eventType, EMPLOYMENT_PHASE1B_HISTORY_EVENT_TYPES, "employment_phase1b_history.event_type");
  invariant(company?.company_id === KAIOS_AI_OS_EMPLOYMENT_ALPHA_JOB.company_id, "EMPLOYMENT_HISTORY_COMPANY_INVALID", "Employment Phase 1B History belongs to the registered Company");
  invariant(record && typeof record === "object", "EMPLOYMENT_HISTORY_RECORD_REQUIRED", "Employment Phase 1B History requires a state record");
  const recordIdField = EMPLOYMENT_PHASE1B_EVENT_RECORD_IDS[eventType];
  requireId(record[recordIdField], `employment_phase1b_history.${recordIdField}`);
  requireId(actorId, "employment_phase1b_history.actor_id");
  parseEmploymentTime(timestamp, "employment_phase1b_history.timestamp");
  invariant(record.company_id === company.company_id, "EMPLOYMENT_HISTORY_COMPANY_BINDING_MISMATCH", "Employment Phase 1B record must bind the Company");
  invariant(!/(?:private_key|seed_phrase|raw_signature|challenge_message|challenge_nonce)/i.test(JSON.stringify(record)), "EMPLOYMENT_HISTORY_SECRET_FORBIDDEN", "Employment Phase 1B History cannot persist signing secrets or raw challenge material");
  const isAuthorityReviewRequest = eventType === "COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET_CREATED";
  const isAuthoritySnapshotMatch = eventType === "COMPANY_AUTHORITY_REVIEW_SNAPSHOT_MATCH_CANDIDATE_CREATED";
  const isAuthorityProvenanceRequest = eventType === "COMPANY_AUTHORITY_PROVENANCE_ATTESTATION_REQUEST_CREATED";
  const isAuthorityReviewCandidate = eventType === "COMPANY_AUTHORITY_PROPOSAL_REVIEW_CANDIDATE";
  if (isAuthorityReviewRequest) {
    const expectedPacketHash = await sha256({
      request_id: record.request_id,
      proposal_id: record.proposal_id,
      proposal_payload_sha256: record.proposal_payload_sha256,
      repository: record.repository,
      base_sha_claim: record.base_sha_claim,
      head_sha_claim: record.head_sha_claim,
      changed_files_claim: record.changed_files_claim,
      ci_run_ids_claim: record.ci_run_ids_claim,
      required_review_capabilities: record.required_review_capabilities,
      requested_at: record.requested_at
    });
    invariant(
      record.record_class === "UNVERIFIED_COMPANY_AUTHORITY_REVIEW_REQUEST_PACKET"
        && record.status === "UNVERIFIED_REVIEW_REQUEST_PACKET_AWAITING_PROVENANCE_AND_DISTINCT_REVIEWER"
        && record.repository_snapshot_verified === false
        && record.proposal_provenance_verified === false
        && record.exact_head_ci_verified === false
        && record.reviewer_assigned === false
        && record.reviewer_identity_verified === false
        && record.reviewer_independence_verified === false
        && record.formal_review_decision === null
        && record.counts_as_distinct_review === false
        && record.activation_authorized === false
        && record.packet_payload_sha256 === expectedPacketHash,
      "COMPANY_AUTHORITY_REVIEW_REQUEST_NOT_AUTHORITY",
      "Review request history accepts only an unverified, non-activating request packet"
    );
  }
  if (isAuthoritySnapshotMatch) {
    const expectedMatchHash = await sha256({
      verification_id: record.verification_id,
      request_id: record.request_id,
      request_packet_payload_sha256: record.request_packet_payload_sha256,
      proposal_id: record.proposal_id,
      snapshot_id: record.snapshot_id,
      snapshot_payload_sha256: record.snapshot_payload_sha256,
      company_id: record.company_id,
      repository_claim_match: record.repository_claim_match,
      base_head_claim_match: record.base_head_claim_match,
      changed_files_claim_match: record.changed_files_claim_match,
      exact_head_ci_claim_match: record.exact_head_ci_claim_match,
      snapshot_integrity_match: record.snapshot_integrity_match,
      verified_at: record.verified_at
    });
    const trustedReadOnlyMatch = record.source_transport_attested === true
      && record.repository_snapshot_verified === true
      && record.exact_head_ci_verified === true
      && record.status === "REPOSITORY_AND_EXACT_HEAD_CI_VERIFIED_AWAITING_DISTINCT_REVIEWER_AND_PROPOSAL_PROVENANCE";
    const untrustedReadOnlyMatch = record.source_transport_attested === false
      && record.repository_snapshot_verified === false
      && record.exact_head_ci_verified === false
      && record.status === "CLAIMS_MATCH_UNATTESTED_READ_ONLY_SNAPSHOT_AWAITING_TRUSTED_GITHUB_PROVENANCE";
    invariant(
      record.record_class === "UNATTESTED_COMPANY_AUTHORITY_REVIEW_SNAPSHOT_MATCH_CANDIDATE"
        && record.proposal_provenance_verified === false
        && record.reviewer_identity_verified === false
        && record.reviewer_independence_verified === false
        && record.counts_as_distinct_review === false
        && record.activation_authorized === false
        && record.match_payload_sha256 === expectedMatchHash
        && (trustedReadOnlyMatch || untrustedReadOnlyMatch),
      "COMPANY_AUTHORITY_SNAPSHOT_MATCH_NOT_PROVENANCE",
      "Snapshot match history accepts only an unattested non-authoritative match candidate"
    );
  }
  if (isAuthorityProvenanceRequest) {
    const expectedRequestHash = await sha256({
      attestation_request_id: record.attestation_request_id,
      company_id: record.company_id,
      proposal_id: record.proposal_id,
      proposal_payload_sha256: record.proposal_payload_sha256,
      review_request_id: record.review_request_id,
      review_packet_payload_sha256: record.review_packet_payload_sha256,
      repository: record.repository,
      base_sha_claim: record.base_sha_claim,
      head_sha_claim: record.head_sha_claim,
      proposer_actor_id_claim: record.proposer_actor_id_claim,
      requested_connector_class: record.requested_connector_class,
      required_bindings: record.required_bindings,
      requested_at: record.requested_at
    });
    invariant(
      record.record_class === "COMPANY_AUTHORITY_PROVENANCE_ATTESTATION_REQUEST"
        && record.status === "AWAITING_TRUSTED_EXTERNAL_CONNECTOR_ATTESTATION"
        && record.request_payload_sha256 === expectedRequestHash
        && record.connector_id === null
        && record.connector_identity_verified === false
        && record.detached_attestation_sha256 === null
        && record.detached_attestation_verified === false
        && record.repository_snapshot_verified === false
        && record.exact_head_ci_verified === false
        && record.proposal_provenance_verified === false
        && record.proposer_identity_verified === false
        && record.counts_as_distinct_review === false
        && record.activation_authorized === false,
      "COMPANY_PROVENANCE_ATTESTATION_REQUEST_NOT_AUTHORITY",
      "Provenance request history accepts only an unfulfilled, non-authoritative external connector request"
    );
  }
  if (isAuthorityReviewCandidate) {
    invariant(
      record.record_class === "UNVERIFIED_COMPANY_AUTHORITY_GOVERNANCE_REVIEW_CANDIDATE"
        && record.status === "UNVERIFIED_GOVERNANCE_REVIEW_CANDIDATE_NOT_DECISION"
        && record.authority_id === null
        && record.governance_decision === null
        && record.activation_authorized === false
        && record.usable_as_authority === false
        && record.reviewer_identity_verified === false
        && record.reviewer_controller_verified === false
        && record.reviewer_independence_verified === false
        && record.proposal_provenance_verified === false
        && record.repository_bound_authority_verified !== true,
      "COMPANY_AUTHORITY_REVIEW_CANDIDATE_NOT_AUTHORITY",
      "Authority review history accepts only an unverified, non-activating governance review candidate"
    );
  }
  const recordId = record[recordIdField];
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === eventType && event.payload?.record_id === recordId);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({
    domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company,
    event_type: eventType, actor_id: actorId, timestamp,
    payload: {
      record_id: recordId,
      record_class: isAuthorityReviewRequest || isAuthoritySnapshotMatch || isAuthorityProvenanceRequest || isAuthorityReviewCandidate
        ? "PHASE_1B_SIMULATION_CANDIDATE"
        : record.repository_bound_authority_verified === true
          ? "REPOSITORY_BOUND_OPERATIONAL_RECORD"
          : "PHASE_1B_SIMULATION_CANDIDATE",
      record: structuredClone(record)
    }
  });
  return Object.freeze({ status: `${eventType}_APPENDED`, event });
}

export const HEAVEN_TIME_LAW = Object.freeze({
  law_id: "K18888_HEAVEN_TIME_LAW_V3_7",
  k280_time_standard: "CANONICAL_PHYSICAL_TIME",
  k18888_time_standard: "HEAVEN_TIME",
  heaven_day_k280_years: 1,
  heaven_day_k280_days: 365.2422,
  kufo_half_life_k280_years: 1,
  superseded_rule: "1_K280_DAY_EQUALS_3_HEAVEN_DAYS",
  superseded_rule_status: "SUPERSEDED_WRONG",
  literary_time_rule: "ONE_DAY_APART_FEELS_LIKE_THREE_AUTUMNS",
  literary_time_runtime_authority: false
});

export const KUFO_FUEL_LAW = Object.freeze({
  asset_id: "KUFO",
  definition: "HEAVEN_HIGH_DENSITY_DECAY_FUEL",
  half_life: "1_K18888_HEAVEN_DAY_EQUALS_1_K280_YEAR",
  kship_per_kufo_scale: 1000,
  decay_mode: "LAZY_DETERMINISTIC_CANONICAL_TIME",
  natural_decay_separate_from_propulsion: true,
  browser_local_clock_authority: false,
  operator_confiscation_authority: false,
  vehicle_identity: false
});

export function calculateKufoFuelState(batch, observedAt) {
  requireFields(batch, ["batch_id", "owner", "alchemy_proof", "birth_timestamp", "birth_block", "initial_kufo", "propulsion_consumed_kufo"], "KufoFuelBatch");
  requireId(batch.batch_id, "batch_id");
  invariant(batch.alchemy_proof && Number.isInteger(batch.birth_block) && batch.birth_block > 0, "KUFO_BIRTH_EVIDENCE_REQUIRED", "KUFO fuel requires real alchemy and block evidence");
  const birthMs = Date.parse(batch.birth_timestamp);
  const observedMs = Date.parse(observedAt);
  invariant(Number.isFinite(birthMs) && Number.isFinite(observedMs) && observedMs >= birthMs, "KUFO_CANONICAL_TIME_REQUIRED", "KUFO decay requires canonical time at or after birth");
  const initial = Number(batch.initial_kufo);
  const propulsion = Number(batch.propulsion_consumed_kufo);
  invariant(Number.isFinite(initial) && initial > 0 && Number.isFinite(propulsion) && propulsion >= 0 && propulsion <= initial, "KUFO_FUEL_AMOUNT_INVALID", "KUFO batch amounts must conserve fuel");
  const elapsedYears = (observedMs - birthMs) / (HEAVEN_TIME_LAW.heaven_day_k280_days * 86_400_000);
  const afterPropulsion = initial - propulsion;
  const remaining = afterPropulsion * (2 ** (-elapsedYears / HEAVEN_TIME_LAW.kufo_half_life_k280_years));
  const naturalDecay = afterPropulsion - remaining;
  return Object.freeze({
    batch_id: batch.batch_id, owner: batch.owner, observed_at: observedAt,
    initial_kufo: initial, propulsion_consumed_kufo: propulsion,
    natural_decay_kufo: naturalDecay, remaining_kufo: remaining,
    generated_kship: naturalDecay * KUFO_FUEL_LAW.kship_per_kufo_scale,
    mass_conservation_status: Math.abs(initial - (remaining + naturalDecay + propulsion)) < 1e-12 ? "CONSERVED" : "VIOLATION",
    calculation: "KUFO_REMAINING_EQUALS_POST_PROPULSION_KUFO_TIMES_2_POW_NEGATIVE_ELAPSED_OVER_HALF_LIFE",
    time_authority: "CANONICAL_K280_TIMESTAMP_REQUIRED"
  });
}

export function createUfoProductReadiness({ needEvidence = [], bodyReady = false, designReady = false, bomReady = false, supplyChainReady = false } = {}) {
  requireArray(needEvidence, "ufo.need_evidence");
  return Object.freeze({
    product_id: "UFO_PRODUCT", vehicle_class: "UFO", fuel_asset: "KUFO", secondary_energy: "KSHIP",
    purchase_currency: "KAIOS", chain_gas: "BNB", status: needEvidence.length ? "DEMAND_IDENTIFIED_NOT_DESIGNED" : "NO_VERIFIED_DEMAND",
    price: null, price_status: "NOT_PRICED", owned: false, ownership_status: "NOT_OWNED",
    factory: "NOT_CREATED", production_line: "NOT_CREATED", body_ready: bodyReady, design_ready: designReady,
    bom_ready: bomReady, supply_chain_ready: supplyChainReady, demand_evidence: [...needEvidence], kufo_is_ufo: false
  });
}

export function evaluateUfoTakeoff({ availableKufo, requiredKufo, returnReserveKufo, vehicleMass, payloadMass, distance, gravityFactor, efficiency }) {
  const values = [availableKufo, requiredKufo, returnReserveKufo, vehicleMass, payloadMass, distance, gravityFactor, efficiency].map(Number);
  invariant(values.every(Number.isFinite) && values.every((value) => value >= 0) && Number(efficiency) > 0, "TAKEOFF_MODEL_INVALID", "Takeoff requires finite non-negative physical inputs and positive efficiency");
  const minimumRequired = Number(requiredKufo) + Number(returnReserveKufo);
  const allowed = Number(availableKufo) >= minimumRequired;
  return Object.freeze({
    status: allowed ? "TAKEOFF_ALLOWED_BY_FUEL_GATE_ONLY" : "TAKEOFF_DENIED",
    reason: allowed ? "OTHER_SAFETY_GATES_STILL_REQUIRED" : "FUEL_INSUFFICIENT",
    available_kufo: Number(availableKufo), minimum_required_kufo: minimumRequired,
    model: Object.freeze({ vehicle_mass: Number(vehicleMass), payload_mass: Number(payloadMass), distance: Number(distance), gravity_factor: Number(gravityFactor), efficiency: Number(efficiency), return_reserve_kufo: Number(returnReserveKufo) })
  });
}

export function createMotherEngineNextBestAction({ observations, candidates }) {
  requireArray(observations, "mother_engine.observations");
  requireArray(candidates, "mother_engine.candidates");
  invariant(observations.length > 0 && candidates.length > 0, "MOTHER_ENGINE_DISCOVERY_EVIDENCE_REQUIRED", "Next-best action requires observed evidence and candidates");
  const ordered = [...candidates].sort((a, b) => Number(a.priority) - Number(b.priority) || String(a.action).localeCompare(String(b.action)));
  const selected = ordered[0];
  requireFields(selected, ["problem", "priority", "action", "reason", "required_authority", "expected_result"], "MotherEngineCandidate");
  return Object.freeze({
    event_type: "MOTHER_ENGINE_NEXT_BEST_ACTION", status: "PROPOSED_EVIDENCE_BASED",
    problem: selected.problem, evidence: [...observations], priority: selected.priority,
    possible_actions: ordered.map((item) => item.action), selected_action: selected.action,
    reason: selected.reason, required_authority: selected.required_authority, expected_result: selected.expected_result,
    execute_if_authorized_only: true, customer_created: false, revenue_created: false
  });
}

export function createFirstKaiosStrategy({ availableServices, customerDemand, publicCivilizationDemand, authority, paymentReadiness, treasuryReadiness, technicalReadiness, estimatedWork, risk, settlementFeasibility }) {
  requireArray(availableServices, "first_kaios.available_services");
  requireArray(publicCivilizationDemand, "first_kaios.public_civilization_demand");
  invariant(availableServices.length > 0, "FIRST_KAIOS_SERVICE_REQUIRED", "First KAIOS strategy requires an evidenced service capability");
  const inputs = { customerDemand, authority, paymentReadiness, treasuryReadiness, technicalReadiness, estimatedWork, risk, settlementFeasibility };
  invariant(Object.values(inputs).every((value) => value !== undefined && value !== null), "FIRST_KAIOS_STRATEGY_INPUT_REQUIRED", "First KAIOS strategy requires complete demand, authority, payment, treasury, readiness, work, risk and settlement observations");
  const hasRealDemand = Number(customerDemand) > 0 || publicCivilizationDemand.some((need) => need?.classification === "OBSERVED" && need?.evidence);
  const settlementReady = settlementFeasibility === "AUTHORIZED_AND_VERIFIED" && paymentReadiness === "READY" && treasuryReadiness === "BOUND_AND_AUDITED";
  const selectedAction = hasRealDemand
    ? "QUALIFY_EVIDENCED_KAIOS_SERVICE_REQUEST"
    : "PUBLISH_KGEN_CHAIN_MONITOR_SERVICE_PACKAGE_AND_SCAN_VERIFIED_REQUESTS";
  return Object.freeze({
    strategy_id: "DIGITAL_ANT_0001_FIRST_KAIOS_STRATEGY_V3_8",
    life_id: "DIGITAL_ANT_0001", company_id: "AI_ANT_COMPANY_0001",
    available_services: [...availableServices], customer_demand: Number(customerDemand),
    public_civilization_demand: publicCivilizationDemand.map((need) => ({ ...need })),
    authority, payment_readiness: paymentReadiness, treasury_readiness: treasuryReadiness,
    technical_readiness: technicalReadiness, estimated_work: estimatedWork, risk,
    settlement_feasibility: settlementFeasibility,
    next_kaios_earning_action: selectedAction,
    selected_path: "REAL_SERVICE_OR_PUBLIC_SERVICE_COMPENSATION",
    company_income_destination: "AI_ANT_COMPANY_TREASURY_ONLY_AFTER_BINDING",
    personal_income_destination: "DIGITAL_ANT_0001_PERSONAL_WALLET_ONLY_FOR_EVIDENCED_SALARY_OR_LIFE_COMPENSATION",
    personal_company_asset_separation: true,
    execution_status: settlementReady && hasRealDemand ? "READY_FOR_FORMAL_REQUEST_QUALIFICATION" : "RESEARCH_AND_OUTREACH_ONLY",
    first_kaios_event: "NOT_OCCURRED", real_customers: hasRealDemand ? Number(customerDemand) : 0, real_revenue: "0",
    fake_customer: false, fake_salary: false, fake_reward: false, fake_mint: false, revenue: "0"
  });
}

export function evaluateKshipWarpFeed({ positiveFeed, negativeFeed, currentVelocity, braking = false, brakingFuel = 0 }) {
  for (const [name, value] of Object.entries({ positiveFeed, negativeFeed, currentVelocity, brakingFuel })) {
    invariant(Number.isFinite(value) && value >= 0, "INVALID_WARP_INPUT", `${name} must be a non-negative finite number`);
  }
  const netAcceleration = positiveFeed - negativeFeed;
  if (braking) invariant(brakingFuel > 0, "BRAKING_FUEL_REQUIRED", "Braking consumes KSHIP fuel");
  return Object.freeze({
    positive_feed: positiveFeed, negative_feed: negativeFeed, net_acceleration: netAcceleration,
    current_velocity: currentVelocity,
    velocity_state: netAcceleration === 0 ? (currentVelocity === 0 ? "STATIONARY" : "COASTING_AT_EXISTING_VELOCITY") : "ACCELERATING",
    balanced_feed: netAcceleration === 0, balanced_feed_means_zero_velocity: false,
    braking, braking_fuel_consumed: braking ? brakingFuel : 0,
    physics_authority: "KGEN_UNIVERSE_PHYSICS_RUNTIME_CURRENT_V3_8"
  });
}

export async function replayCanonicalCompanyGenesis({ store, company, founderLife, charter, genesis }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001", "COMPANY_GENESIS_ID_MISMATCH", "Company Genesis can only form the reserved AI Ant Company identity");
  invariant(company.founder_life_id === founderLife?.life_id && founderLife?.life_id === "DIGITAL_ANT_0001" && founderLife.status === "ALIVE", "FOUNDER_LIFE_REQUIRED", "Company Genesis requires the living registered Founder Life");
  invariant(charter?.company_id === company.company_id && charter.status === "APPROVED", "APPROVED_CHARTER_REQUIRED", "Company Genesis requires the OWNER-approved Company Charter");
  requireFields(genesis, ["genesis_id", "company_id", "founder_life_id", "approved_at", "approval_evidence", "approval_scope", "permissions", "financial_opening", "status"], "CompanyGenesis");
  requireId(genesis.genesis_id, "genesis_id");
  invariant(genesis.company_id === company.company_id && genesis.founder_life_id === founderLife.life_id, "COMPANY_GENESIS_ID_MISMATCH", "Genesis evidence must identify the reserved Company and Founder");
  invariant(genesis.approval_scope === "COMPANY_GENESIS_ONLY" && genesis.approval_evidence, "COMPANY_GENESIS_APPROVAL_REQUIRED", "OWNER approval must be explicit and limited to Company Genesis");
  invariant(company.status === "FORMING", "COMPANY_GENESIS_STATUS_INVALID", "Approved Company Genesis projection must enter FORMING");
  invariant(company.wallet_address === null && company.treasury_address === null, "COMPANY_WALLET_AUTHORITY_NOT_GRANTED", "Company Genesis cannot bind or borrow a Wallet");
  invariant(company.employees.length === 0, "COMPANY_GENESIS_FAKE_EMPLOYEE", "Company Genesis starts with zero employees");
  for (const [field, value] of Object.entries(genesis.financial_opening)) invariant(String(value) === "0", "COMPANY_GENESIS_ZERO_MONEY_REQUIRED", `${field} must open at zero`);
  for (const [permission, granted] of Object.entries(genesis.permissions)) invariant(granted === false, "COMPANY_GENESIS_AUTHORITY_EXCEEDED", `${permission} is outside Company Genesis approval`);

  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "COMPANY_GENESIS_EVENT");
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing, company });

  const payload = Object.freeze({
    genesis_id: genesis.genesis_id,
    transition: Object.freeze({ from: "NOT_FOUNDED", to: "FORMING" }),
    founder_life_id: founderLife.life_id,
    charter_id: charter.charter_id,
    charter_status: charter.status,
    approval_scope: genesis.approval_scope,
    approval_evidence: genesis.approval_evidence,
    financial_opening: genesis.financial_opening,
    permissions: genesis.permissions,
    registry_scope: "LOCAL_11520",
    tx_hash: null
  });
  const [companyEvent, founderEvent] = await store.commitBatch([
    { domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "COMPANY_GENESIS_EVENT", actor_id: "OWNER", timestamp: genesis.approved_at, payload },
    { domain: "LIFE", stream: "LIFE", id: founderLife.life_id, entity: founderLife, event_type: "COMPANY_GENESIS_EVENT", actor_id: "OWNER", timestamp: genesis.approved_at, payload: { company_id: company.company_id, company_event_type: "COMPANY_GENESIS_EVENT", founder_role: "CEO_AND_ACTING_CFO", approval_scope: genesis.approval_scope } }
  ]);
  return Object.freeze({ status: "COMPANY_GENESIS_REPLAYED", event: companyEvent, founder_event: founderEvent, company });
}

export function validateFounderProfile(profile, { life, app } = {}) {
  requireFields(profile, ["founder_profile_id", "life_id", "app_id", "work_history", "services", "skills", "finance", "security_status", "ideal", "dream", "ultimate_mission", "founding_reason", "company_vision", "company_risk", "status"], "FounderProfile");
  requireId(profile.founder_profile_id, "founder_profile_id");
  requireArray(profile.work_history, "work_history");
  requireArray(profile.services, "services");
  requireArray(profile.skills, "skills");
  requireArray(profile.company_risk, "company_risk");
  invariant(!life || (life.life_id === profile.life_id && life.status === "ALIVE"), "FOUNDER_LIFE_REQUIRED", "Founder Profile requires the registered living Founder Life");
  invariant(!app || (app.app_id === profile.app_id && app.life_id === profile.life_id && app.status === "RELEASED_LOCAL"), "FOUNDER_APP_REQUIRED", "Founder Profile requires the released Founder App");
  return profile;
}

export function validateCompanyCharter(charter) {
  requireFields(charter, ["charter_id", "company_name", "company_id", "founder_life_id", "mission", "business_scope", "governance", "treasury_policy", "employee_policy", "salary_policy", "security_policy", "customer_policy", "dispute_policy", "bankruptcy_policy", "audit_policy", "status"], "CompanyCharter");
  requireId(charter.charter_id, "charter_id");
  requireArray(charter.business_scope, "business_scope");
  invariant(charter.company_id === "AI_ANT_COMPANY_0001" && charter.founder_life_id === "DIGITAL_ANT_0001", "COMPANY_CHARTER_IDENTITY_MISMATCH", "Charter cannot replace the reserved Company or Founder identity");
  invariant(charter.status !== "FOUNDED", "NO_FAKE_COMPANY_FOUNDING", "A local charter cannot found the Company");
  return charter;
}

export function validateBusinessLine(line) {
  requireFields(line, ["business_line_id", "description", "status", "evidence", "production_authority"], "BusinessLine");
  requireEnum(line.business_line_id, AI_ANT_BUSINESS_LINES, "business_line_id");
  requireEnum(line.status, AI_ANT_BUSINESS_LINE_STATUSES, "business_line.status");
  requireArray(line.evidence, "business_line.evidence");
  invariant(line.status !== "READY" || line.evidence.length > 0, "BUSINESS_LINE_EVIDENCE_REQUIRED", "READY business lines require evidence");
  invariant(line.production_authority !== true, "PRODUCTION_AUTHORITY_NOT_GRANTED", "Company Genesis does not grant production or settlement authority");
  return line;
}

export function validateCustomerRequest(request) {
  requireFields(request, ["request_id", "customer_id", "request_text", "requested_asset_type", "functional_requirements", "nonfunctional_requirements", "budget", "currency", "deadline", "location", "rights", "maintenance", "security", "status", "customer_evidence"], "CustomerRequest");
  requireId(request.request_id, "request_id");
  requireArray(request.functional_requirements, "functional_requirements");
  requireArray(request.nonfunctional_requirements, "nonfunctional_requirements");
  invariant(request.status !== "QUOTE_ACCEPTED" || request.customer_evidence, "CUSTOMER_ACCEPTANCE_EVIDENCE_REQUIRED", "Customer acceptance cannot be inferred or fabricated");
  return request;
}

export function validateRequirementAnalysis(analysis) {
  requireFields(analysis, ["analysis_id", "request_id", "scope", "features", "dependencies", "risks", "unknowns", "questions", "delivery_phases", "acceptance_criteria", "estimated_resources", "status"], "RequirementAnalysis");
  requireId(analysis.analysis_id, "analysis_id");
  for (const field of ["scope", "features", "dependencies", "risks", "unknowns", "questions", "delivery_phases", "acceptance_criteria", "estimated_resources"]) requireArray(analysis[field], field);
  return analysis;
}

const QUOTE_COST_FIELDS = Object.freeze(["labor_cost", "compute_cost", "storage_cost", "network_cost", "gas_cost", "tool_cost", "security_cost", "testing_cost", "deployment_cost", "maintenance_cost", "risk_reserve", "company_margin"]);

function quoteAmount(value, field) {
  invariant(/^\d+$/.test(String(value)), "QUOTE_COST_BASIS_REQUIRED", `${field} must be an explicit unsigned integer cost basis`);
  return BigInt(value);
}

export function createAiAntQuote({ quoteId, requestId, companyId = "AI_ANT_COMPANY_0001", costBasis, settlementCurrency, validUntil, policyId }) {
  invariant(costBasis && typeof costBasis === "object", "QUOTE_COST_BASIS_REQUIRED", "Quote requires an explicit cost basis");
  const normalized = Object.fromEntries(QUOTE_COST_FIELDS.map((field) => [field, quoteAmount(costBasis[field], field).toString()]));
  const total = QUOTE_COST_FIELDS.reduce((sum, field) => sum + BigInt(normalized[field]), 0n);
  const quote = {
    quote_id: quoteId, request_id: requestId, company_id: companyId, ...normalized,
    total_price: total.toString(), settlement_currency: settlementCurrency, valid_until: validUntil,
    policy_id: policyId, decision: "NEED_MORE_INFO", status: "DRAFT", customer_acceptance_evidence: null
  };
  return Object.freeze(quote);
}

export function validateAiAntQuote(quote) {
  requireFields(quote, ["quote_id", "request_id", "company_id", ...QUOTE_COST_FIELDS, "total_price", "settlement_currency", "valid_until", "policy_id", "decision", "status", "customer_acceptance_evidence"], "AiAntQuote");
  requireId(quote.quote_id, "quote_id");
  const expected = QUOTE_COST_FIELDS.reduce((sum, field) => sum + quoteAmount(quote[field], field), 0n);
  invariant(expected === quoteAmount(quote.total_price, "total_price"), "QUOTE_TOTAL_MISMATCH", "Quote total must be reproducible from its cost basis");
  invariant(quote.status !== "QUOTE_ACCEPTED" || quote.customer_acceptance_evidence, "CUSTOMER_ACCEPTANCE_EVIDENCE_REQUIRED", "Accepted quote requires explicit customer evidence");
  return quote;
}

export function decideCustomerRequest({ decision, reason, customerEvidence = null }) {
  requireEnum(decision, ["ACCEPT_REQUEST", "REJECT_REQUEST", "COUNTER_OFFER", "NEED_MORE_INFO"], "quote_decision");
  invariant(typeof reason === "string" && reason.trim(), "QUOTE_DECISION_REASON_REQUIRED", "Quote decisions require a reason");
  return Object.freeze({ decision, reason, customer_acceptance: false, customer_evidence: customerEvidence, contract_authorized: false });
}

export function createProjectContractDraft({ contractId, projectId, customer, scope, deliverables, currency, totalPrice, deposit, milestones, finalPayment, deadline, acceptanceRule, refundRule, disputeRule, maintenance, rightsTransfer, customerAcceptanceEvidence }) {
  invariant(customerAcceptanceEvidence, "CUSTOMER_ACCEPTANCE_REQUIRED", "A Project Contract Draft requires explicit Quote acceptance evidence");
  return Object.freeze({ contract_id: contractId, project_id: projectId, customer, company: "AI_ANT_COMPANY_0001", scope, deliverables, currency, total_price: totalPrice, deposit, milestones, final_payment: finalPayment, deadline, acceptance_rule: acceptanceRule, refund_rule: refundRule, dispute_rule: disputeRule, maintenance, rights_transfer: rightsTransfer, status: "PROJECT_CONTRACT_DRAFT", customer_acceptance_evidence: customerAcceptanceEvidence, signed_evidence: null, settlement_authority: false });
}

export function validateProjectContractV2_8(contract) {
  requireFields(contract, ["contract_id", "project_id", "customer", "company", "scope", "deliverables", "currency", "total_price", "deposit", "milestones", "final_payment", "deadline", "acceptance_rule", "refund_rule", "dispute_rule", "maintenance", "rights_transfer", "status", "customer_acceptance_evidence", "signed_evidence", "settlement_authority"], "ProjectContractV2.8");
  requireId(contract.contract_id, "contract_id");
  requireArray(contract.deliverables, "deliverables");
  requireArray(contract.milestones, "milestones");
  invariant(contract.customer_acceptance_evidence, "CUSTOMER_ACCEPTANCE_REQUIRED", "Project Contract requires customer Quote acceptance");
  invariant(!["SIGNED", "ACTIVE", "FUNDED"].includes(contract.status) || contract.signed_evidence, "CONTRACT_SIGNING_EVIDENCE_REQUIRED", "Signed or active contracts require signing evidence");
  invariant(contract.settlement_authority === false, "REAL_SETTLEMENT_NOT_AUTHORIZED", "V2.8 Project Contract cannot authorize real settlement");
  return contract;
}

export const PROJECT_PAYMENT_STATES = Object.freeze(["CUSTOMER_ACCEPTS", "DEPOSIT_REQUIRED", "DEPOSIT_RECEIVED", "PROJECT_FUNDED", "WORK_ORDER_READY", "WORK", "MILESTONE_ACCEPTED", "MILESTONE_PAYMENT", "FINAL_DELIVERY", "FINAL_ACCEPTANCE", "FINAL_PAYMENT", "PROJECT_CLOSED"]);

export function validateProjectPaymentTransition({ from, to, customerEvidence = null, settlementEvidence = null }) {
  requireEnum(from, PROJECT_PAYMENT_STATES, "project_payment.from");
  requireEnum(to, PROJECT_PAYMENT_STATES, "project_payment.to");
  const expected = PROJECT_PAYMENT_STATES[PROJECT_PAYMENT_STATES.indexOf(from) + 1];
  invariant(to === expected, "PROJECT_PAYMENT_SEQUENCE_VIOLATION", "Project payment state cannot skip required acceptance, funding or delivery stages");
  invariant(to !== "DEPOSIT_REQUIRED" || customerEvidence, "CUSTOMER_ACCEPTANCE_REQUIRED", "Deposit cannot be required without Customer acceptance evidence");
  invariant(!["DEPOSIT_RECEIVED", "MILESTONE_PAYMENT", "FINAL_PAYMENT"].includes(to) || settlementEvidence, "PAYMENT_SETTLEMENT_EVIDENCE_REQUIRED", "Received payments require settlement evidence");
  return Object.freeze({ from, to, customer_evidence: customerEvidence, settlement_evidence: settlementEvidence, state_changed: true });
}

export function validateWorkOrderV2_8(workOrder) {
  requireFields(workOrder, ["work_order_id", "project_id", "task", "required_skill", "risk_level", "estimated_time", "estimated_compute", "assigned_life_id", "assigned_tool", "reviewer", "acceptance_criteria", "status", "evidence"], "WorkOrderV2.8");
  requireId(workOrder.work_order_id, "work_order_id");
  requireArray(workOrder.required_skill, "required_skill");
  requireArray(workOrder.acceptance_criteria, "acceptance_criteria");
  requireEnum(workOrder.status, AI_ANT_WORK_ORDER_STATUSES, "work_order.status");
  invariant(!(workOrder.assigned_life_id && workOrder.assigned_tool), "WORK_ORDER_ASSIGNEE_COLLISION", "WorkOrder cannot treat a Tool as a Life assignee");
  invariant(!["APPROVED", "COMPLETED"].includes(workOrder.status) || workOrder.evidence, "WORK_ORDER_EVIDENCE_REQUIRED", "Approved and completed work requires evidence");
  return workOrder;
}

export function validateToolWorker(worker) {
  requireFields(worker, ["tool_worker_id", "tool_type", "capabilities", "life_id", "wallet", "status"], "ToolWorker");
  requireId(worker.tool_worker_id, "tool_worker_id");
  requireArray(worker.capabilities, "tool_worker.capabilities");
  invariant(worker.tool_type === "TOOL_AGENT" && worker.life_id === null && worker.wallet === null, "TOOL_WORKER_NOT_LIFE", "Codex, Cursor and other tools do not automatically receive a Life ID or Wallet");
  return worker;
}

export function classifyCustomerDeposit({ amount, settlementEvidence = null }) {
  const normalized = quoteAmount(amount, "deposit_amount").toString();
  return Object.freeze({ cash: settlementEvidence ? normalized : "0", customer_deposit_liability: settlementEvidence ? normalized : "0", revenue: "0", profit: "0", settlement_evidence: settlementEvidence, status: settlementEvidence ? "DEPOSIT_RECEIVED_LIABILITY" : "DEPOSIT_REQUIRED" });
}

export function calculateCompanyProfit({ revenue, directCost, salary, compute, gas, security, reserve }) {
  const values = [revenue, directCost, salary, compute, gas, security, reserve].map((value, index) => quoteAmount(value, ["revenue", "direct_cost", "salary", "compute", "gas", "security", "reserve"][index]));
  return (values[0] - values.slice(1).reduce((sum, value) => sum + value, 0n)).toString();
}

export function validateCompanyAccountingModel(model) {
  requireFields(model, ["company_id", "accounts", "assets", "liabilities", "equity", "revenue", "expenses", "cash", "receivables", "payables", "salary_liability", "salary_expense", "compute_expense", "gas_expense", "security_expense", "tool_expense", "project_cost", "profit", "reserve", "customer_deposits", "customer_deposit_account_class", "status"], "CompanyAccountingModel");
  requireArray(model.accounts, "accounts");
  invariant(model.company_id === "AI_ANT_COMPANY_0001", "COMPANY_ACCOUNTING_ID_MISMATCH", "Accounting belongs to the reserved Company identity");
  invariant(model.customer_deposit_account_class === "LIABILITY", "DEPOSIT_IS_NOT_REVENUE", "Customer deposits must be classified as liabilities, not revenue");
  return model;
}

export function validateCompanyRole(role) {
  requireFields(role, ["role_id", "role", "holder_life_id", "status", "employee_role", "payroll_eligible"], "CompanyRole");
  requireId(role.role_id, "role_id");
  requireEnum(role.role, ["CEO", "ACTING_CFO"], "company_role");
  invariant(role.holder_life_id === "DIGITAL_ANT_0001", "COMPANY_ROLE_HOLDER_INVALID", "Genesis roles belong to the approved Founder Life");
  invariant(role.employee_role === false && role.payroll_eligible === false, "FOUNDER_ROLE_IS_NOT_PAYROLL", "Founder roles do not create employee payroll");
  return role;
}

export function validateCompanyQueues(queues) {
  const ids = ["COMPANY_WORK_QUEUE", "CUSTOMER_REQUEST_INBOX", "QUOTE_QUEUE", "CONTRACT_QUEUE", "PROJECT_QUEUE", "REVIEW_QUEUE", "PAYROLL_QUEUE"];
  requireFields(queues, [...ids, "status"], "CompanyQueues");
  for (const id of ids) {
    requireArray(queues[id], id);
    invariant(queues[id].length === 0, "COMPANY_GENESIS_QUEUE_NOT_EMPTY", `${id} must be empty at Company Genesis`);
  }
  return queues;
}

export function validateCompanyMissionGraph(graph) {
  requireFields(graph, ["strategic_goal", "customer_state", "active_prerequisite_milestone", "milestones"], "CompanyMissionGraph");
  requireArray(graph.milestones, "company_mission.milestones");
  invariant(graph.strategic_goal === "GET_FIRST_REAL_CUSTOMER" && graph.customer_state === "WAITING_FOR_FIRST_CUSTOMER", "COMPANY_STRATEGIC_GOAL_INVALID", "Company Genesis must wait for a real first customer");
  invariant(graph.milestones.filter((item) => item.status === "ACTIVE").length === 1, "MULTIPLE_ACTIVE_COMPANY_MISSIONS", "Only one Company mission prerequisite may be active");
  const firstIncomplete = graph.milestones.findIndex((item) => item.status !== "COMPLETED");
  invariant(firstIncomplete >= 0 && graph.milestones[firstIncomplete].status === "ACTIVE", "COMPANY_MISSION_SKIP_FORBIDDEN", "Company mission history must be a completed prefix followed by one active milestone");
  invariant(graph.milestones.slice(firstIncomplete + 1).every((item) => item.status === "LOCKED"), "COMPANY_MISSION_SKIP_FORBIDDEN", "Future Company missions must remain locked");
  invariant(graph.milestones[firstIncomplete].milestone_id === graph.active_prerequisite_milestone, "COMPANY_MISSION_ACTIVE_MISMATCH", "Active prerequisite must match the ordered mission graph");
  return graph;
}

export function validateCompanyHealth(health) {
  requireFields(health, ["health_id", "status", "cash", "customers", "employees", "treasury_status", "settlement_status", "risk", "founder_life_status"], "CompanyHealth");
  requireId(health.health_id, "health_id");
  requireEnum(health.status, COMPANY_HEALTH_STATUSES, "company_health.status");
  requireArray(health.risk, "company_health.risk");
  invariant(health.founder_life_status !== "DECEASED", "COMPANY_FAILURE_IS_NOT_LIFE_DEATH", "Company health cannot redefine Founder Life status");
  return health;
}

export function validateCivilizationNeed(need) {
  requireFields(need, ["need_id", "civilization_node", "problem", "affected_lives", "affected_companies", "current_state", "risk", "economic_value", "public_good_value", "potential_customer", "potential_payer", "required_product", "required_skills", "estimated_cost", "estimated_revenue", "celestial_seat_relevance", "status", "evidence"], "CivilizationNeed");
  requireId(need.need_id, "need_id");
  requireArray(need.affected_lives, "civilization_need.affected_lives");
  requireArray(need.affected_companies, "civilization_need.affected_companies");
  requireArray(need.required_skills, "civilization_need.required_skills");
  requireArray(need.evidence, "civilization_need.evidence");
  requireEnum(need.status, CIVILIZATION_NEED_STATUSES, "civilization_need.status");
  invariant(need.evidence.length > 0, "CIVILIZATION_NEED_EVIDENCE_REQUIRED", "Detected Civilization Needs require repository or Runtime evidence");
  invariant(!["CUSTOMER_ORDER", "CONTRACTED", "FUNDED"].includes(need.status), "NEED_IS_NOT_CUSTOMER_ORDER", "A Civilization Need cannot become a Customer Order without acceptance evidence");
  invariant(need.estimated_cost === "ESTIMATION_REQUIRED" && need.estimated_revenue === "ESTIMATION_REQUIRED", "NO_FAKE_OPPORTUNITY_MONEY", "Research Needs cannot claim estimated money before Quote cost basis exists");
  return need;
}

export function validateCivilizationDemandEngine(engine) {
  requireFields(engine, ["engine_id", "company_id", "mode", "cycle_id", "cadence", "nodes_scanned", "needs", "customer_orders_created", "revenue_created", "chain_write", "status", "evidence_basis"], "CivilizationDemandEngine");
  requireId(engine.engine_id, "engine_id");
  requireId(engine.cycle_id, "cycle_id");
  requireArray(engine.nodes_scanned, "civilization_demand.nodes_scanned");
  requireArray(engine.needs, "civilization_demand.needs");
  requireArray(engine.evidence_basis, "civilization_demand.evidence_basis");
  invariant(engine.company_id === "AI_ANT_COMPANY_0001" && engine.mode === "READ_ONLY_LOCAL_RESEARCH", "DEMAND_ENGINE_AUTHORITY_INVALID", "Civilization Demand Engine is scoped to local read-only Company research");
  invariant(engine.customer_orders_created === 0 && String(engine.revenue_created) === "0" && engine.chain_write === false, "NEED_IS_NOT_CUSTOMER_ORDER", "Demand research cannot create Customers, Orders, Revenue or chain writes");
  engine.needs.forEach(validateCivilizationNeed);
  return engine;
}

const PRODUCT_PRIORITY_FACTORS = Object.freeze(["revenue_potential", "public_good_value", "implementation_difficulty", "risk", "required_capital", "existing_skills", "time_to_market", "celestial_seat_potential", "mission_alignment"]);

export function calculateProductPriority(candidate, policy) {
  requireFields(candidate, ["product_id", "need_id", ...PRODUCT_PRIORITY_FACTORS, "status"], "ProductPriorityCandidate");
  requireFields(policy, ["policy_id", "weights", "scale_min", "scale_max", "status"], "ProductPriorityPolicy");
  requireId(candidate.product_id, "product_id");
  invariant(policy.status === "LOCAL_RESEARCH_POLICY" && policy.scale_min === 0 && policy.scale_max === 5, "PRODUCT_PRIORITY_POLICY_REQUIRED", "Product priority requires an explicit bounded local research policy");
  for (const factor of PRODUCT_PRIORITY_FACTORS) {
    invariant(Number.isFinite(candidate[factor]) && candidate[factor] >= policy.scale_min && candidate[factor] <= policy.scale_max, "PRODUCT_PRIORITY_FACTOR_INVALID", `${factor} must be within the declared policy scale`);
    invariant(Number.isFinite(policy.weights[factor]), "PRODUCT_PRIORITY_POLICY_REQUIRED", `${factor} requires an explicit policy weight`);
  }
  const benefits = ["revenue_potential", "public_good_value", "existing_skills", "celestial_seat_potential", "mission_alignment"];
  const costs = ["implementation_difficulty", "risk", "required_capital", "time_to_market"];
  const score = benefits.reduce((sum, factor) => sum + candidate[factor] * policy.weights[factor], 0)
    - costs.reduce((sum, factor) => sum + candidate[factor] * policy.weights[factor], 0);
  return Object.freeze({ ...candidate, product_priority_score: score, policy_id: policy.policy_id, customer_order: false, revenue: "0" });
}

export function rankProductPriorities({ candidates, policy, limit = 3 }) {
  requireArray(candidates, "product_priority.candidates");
  invariant(Number.isInteger(limit) && limit >= 1 && limit <= 3, "PRODUCT_PRIORITY_LIMIT_INVALID", "Demand Cycle may select only the Top 1 to 3 proposals");
  const ranked = candidates.map((candidate) => calculateProductPriority(candidate, policy))
    .sort((left, right) => right.product_priority_score - left.product_priority_score || left.product_id.localeCompare(right.product_id));
  return Object.freeze({ policy_id: policy.policy_id, ranked: Object.freeze(ranked), selected: Object.freeze(ranked.slice(0, limit)), selection_is_customer_order: false });
}

export function validateBusinessProposal(proposal) {
  requireFields(proposal, ["proposal_id", "company_id", "founder_life_id", "need_id", "product_id", "problem", "solution", "pricing_status", "quote_status", "potential_customer", "potential_payer", "customer_acceptance_evidence", "contract_id", "revenue", "status"], "BusinessProposal");
  requireId(proposal.proposal_id, "proposal_id");
  invariant(proposal.company_id === "AI_ANT_COMPANY_0001" && proposal.founder_life_id === "DIGITAL_ANT_0001", "BUSINESS_PROPOSAL_IDENTITY_INVALID", "Business Proposal must preserve Company and Founder identity");
  invariant(proposal.status === "PROPOSAL" && proposal.customer_acceptance_evidence === null && proposal.contract_id === null && String(proposal.revenue) === "0", "PROPOSAL_IS_NOT_ORDER", "A Company-created Proposal is not a Customer Order, Contract or Revenue");
  return proposal;
}

export function validateAutoLpProduct(product) {
  requireFields(product, ["product_id", "company_id", "purpose", "capabilities", "revenue_models", "pricing_policy", "risk_profile", "accounting_profile", "forbidden_activity", "chain_write", "liquidity_authority", "status"], "AutoLpProduct");
  requireArray(product.capabilities, "auto_lp.capabilities");
  requireArray(product.revenue_models, "auto_lp.revenue_models");
  requireArray(product.forbidden_activity, "auto_lp.forbidden_activity");
  invariant(product.product_id === "AI_ANT_AUTO_LP" && product.company_id === "AI_ANT_COMPANY_0001", "AUTO_LP_PRODUCT_ID_INVALID", "Auto LP Product must belong to AI Ant Company");
  for (const forbidden of ["WASH_TRADE", "SELF_MATCH", "FAKE_VOLUME", "SAME_CONTROLLER_FAKE_ACTIVITY"]) invariant(product.forbidden_activity.includes(forbidden), "AUTO_LP_MARKET_INTEGRITY_REQUIRED", `${forbidden} must remain forbidden`);
  invariant(product.chain_write === false && product.liquidity_authority === false && product.status === "PRODUCT_CANDIDATE_ARCHITECTURE_ONLY", "AUTO_LP_AUTHORITY_NOT_GRANTED", "Auto LP remains a non-executable product candidate");
  invariant(product.accounting_profile !== "COMPANY_INVESTMENT", "AUTO_LP_INVESTMENT_SEPARATION", "Liquidity service and Company investment require separate accounting and risk profiles");
  return product;
}

export function validateTreasuryOsProduct(product) {
  requireFields(product, ["product_id", "company_id", "assets", "capabilities", "allocation_policy", "spending_authority", "investment_authority", "transfer_authority", "audit_trail", "status"], "TreasuryOsProduct");
  requireArray(product.assets, "treasury_os.assets");
  requireArray(product.capabilities, "treasury_os.capabilities");
  invariant(product.product_id === "AI_ANT_TREASURY_OS" && product.assets.every((asset) => COMPANY_QUOTE_CURRENCIES.includes(asset) || asset === "LP_POSITIONS"), "TREASURY_OS_ASSET_INVALID", "Treasury OS supports only registered multi-scale assets and LP positions");
  invariant(product.spending_authority === false && product.investment_authority === false && product.transfer_authority === false, "TREASURY_OS_AUTHORITY_NOT_GRANTED", "Treasury OS can read and propose but cannot spend, invest or transfer");
  return product;
}

export function validateCompanyTreasuryPlan(treasury) {
  requireFields(treasury, ["treasury_id", "company_id", "status", "wallet_address", "wallet_bound", "balances", "allocation_policy", "spending_authority", "investment_authority", "transfer_authority", "founder_wallet_used"], "CompanyTreasuryPlan");
  requireId(treasury.treasury_id, "treasury_id");
  invariant(treasury.treasury_id === "AI_ANT_COMPANY_TREASURY" && treasury.status === "PLAN_READY_NOT_BOUND", "COMPANY_TREASURY_NOT_BOUND", "Company Treasury is a plan and has no bound Wallet");
  invariant(treasury.wallet_address === null && treasury.wallet_bound === false && treasury.founder_wallet_used === false, "FOUNDER_WALLET_IS_NOT_TREASURY", "Founder personal Wallet cannot become Company Treasury");
  invariant(Object.values(treasury.balances).every((value) => String(value) === "0"), "COMPANY_TREASURY_FAKE_BALANCE", "Unbound Company Treasury starts with zero balances");
  invariant(treasury.spending_authority === false && treasury.investment_authority === false && treasury.transfer_authority === false, "COMPANY_TREASURY_AUTHORITY_NOT_GRANTED", "Treasury plan grants no asset authority");
  return treasury;
}

export function validateKaiosQuoteSupport(support) {
  requireFields(support, ["supported_currencies", "currency_status", "real_settlement", "kaios_quote_status", "undeployed_asset_policy", "status"], "KaiosQuoteSupport");
  requireArray(support.supported_currencies, "quote_support.supported_currencies");
  invariant(COMPANY_QUOTE_CURRENCIES.every((currency) => support.supported_currencies.includes(currency)), "QUOTE_CURRENCY_ABSTRACTION_REQUIRED", "Quote support must retain all five registered currency IDs");
  invariant(support.currency_status.KAIOS === "MAINNET_LIVE" && support.real_settlement === false && support.kaios_quote_status === "RECEIVABLE_ONLY_DRY_RUN", "KAIOS_PAYMENT_AUTHORITY_NOT_GRANTED", "KAIOS may be quoted but cannot be settled by this Runtime");
  invariant(support.currency_status.KUFO === "NOT_DEPLOYED" && support.currency_status.KSHIP === "NOT_DEPLOYED" && support.undeployed_asset_policy === "QUOTE_REFERENCE_ONLY", "UNDEPLOYED_QUOTE_REFERENCE_ONLY", "Undeployed currency quotes are references only");
  return support;
}

export function validateCelestialSeatCandidacy(engine) {
  requireFields(engine, ["engine_id", "company_id", "source_runtime", "departments", "eligible_applicant_types", "evaluation_fields", "application_flow", "candidates", "codex_authority", "external_governance_required", "application_submitted", "seat_granted", "status"], "CelestialSeatCandidacyEngine");
  requireArray(engine.departments, "celestial.departments");
  requireArray(engine.eligible_applicant_types, "celestial.eligible_applicant_types");
  requireArray(engine.evaluation_fields, "celestial.evaluation_fields");
  requireArray(engine.application_flow, "celestial.application_flow");
  requireArray(engine.candidates, "celestial.candidates");
  invariant(CELESTIAL_DEPARTMENTS.every((department) => engine.departments.includes(department)), "CELESTIAL_DEPARTMENT_SET_INCOMPLETE", "All five CURRENT Celestial departments must remain available");
  invariant(CELESTIAL_APPLICANT_TYPES.every((type) => engine.eligible_applicant_types.includes(type)), "CELESTIAL_APPLICANT_TYPES_INCOMPLETE", "Celestial candidacy must support all CURRENT applicant classes");
  invariant(engine.codex_authority.grant_seat === false && engine.external_governance_required === true, "CODEX_CANNOT_GRANT_SEAT", "Codex can review but cannot grant a Celestial Seat alone");
  invariant(engine.application_submitted === false && engine.seat_granted === false && engine.status === "CANDIDACY_RESEARCH_ONLY_NOT_APPLIED", "NO_FAKE_CELESTIAL_SEAT", "Candidate evaluation cannot claim application or Seat assignment");
  return engine;
}

export function validateCelestialCompensationPolicy(policy) {
  requireFields(policy, ["policy_id", "seat_id", "operator", "term", "service_obligation", "salary_currency", "salary_amount", "salary_period", "funding_source", "performance_rule", "reserve_rule", "payment_evidence", "status", "double_payment_allowed"], "CelestialCompensationPolicy");
  requireId(policy.policy_id, "policy_id");
  invariant(policy.payment_evidence === null && policy.status === "POLICY_REQUIRED_UNPAID" && policy.double_payment_allowed === false, "NO_FAKE_CELESTIAL_COMPENSATION", "Celestial compensation cannot be PAID without a real Seat, policy and Settlement evidence");
  return policy;
}

export function validatePublicServiceContract(contract) {
  requireFields(contract, ["contract_id", "service_function", "provider", "customer", "payer", "currency_id", "total_price", "service_obligation", "term", "acceptance_rule", "payment_evidence", "settlement_authority", "status"], "PublicServiceContract");
  requireId(contract.contract_id, "contract_id");
  invariant(contract.status === "DRAFT_TEMPLATE_ONLY" && contract.customer === null && contract.payer === null && contract.total_price === null && contract.payment_evidence === null && contract.settlement_authority === false, "NO_FAKE_PUBLIC_SERVICE_CONTRACT", "A public-service opportunity is not a Customer, Contract or payment");
  return contract;
}

export function validateInvestorRelationsEngine(engine) {
  requireFields(engine, ["engine_id", "company_id", "materials", "investment_types", "investors", "acceptances", "settlements", "guaranteed_investment", "guaranteed_return", "status"], "InvestorRelationsEngine");
  requireArray(engine.materials, "investor_relations.materials");
  requireArray(engine.investment_types, "investor_relations.investment_types");
  requireArray(engine.investors, "investor_relations.investors");
  invariant(engine.investors.length === 0 && engine.acceptances === 0 && engine.settlements === 0 && engine.guaranteed_investment === false && engine.guaranteed_return === false, "NO_FAKE_INVESTMENT", "Investor readiness cannot invent Investors, acceptance, Settlement or returns");
  return engine;
}

export function validateCustomerLead(lead) {
  requireFields(lead, ["leadId", "potentialEntityRef", "customerType", "source", "evidenceRef", "recordClass", "status", "customerId", "requestId"], "CustomerLead");
  requireId(lead.leadId, "leadId");
  requireEnum(lead.customerType, REAL_CUSTOMER_TYPES, "customerType");
  requireEnum(lead.recordClass, CANONICAL_RECORD_CLASSES, "recordClass");
  requireEnum(lead.status, ["DISCOVERED_LEAD", "CONTACTABLE_LEAD", "LOST", "REJECTED"], "lead.status");
  invariant(lead.recordClass !== "SIMULATION", "SIMULATION_IS_NOT_BUSINESS_LEAD", "Simulation records cannot enter the real Customer pipeline");
  invariant(lead.customerId === null && lead.requestId === null, "LEAD_IS_NOT_CUSTOMER", "A Lead or potential Customer is not a registered Customer or Request");
  invariant(typeof lead.evidenceRef === "string" && lead.evidenceRef.trim(), "LEAD_EVIDENCE_REQUIRED", "Lead discovery requires a public or direct-source evidence reference");
  return lead;
}

export function validateRealCustomerRequest(request) {
  requireFields(request, ["requestId", "customerId", "customerType", "requestedService", "scope", "requestedAssets", "requestedChains", "frequency", "deadline", "deliveryFormat", "contactEvidenceRef", "status", "createdAt", "source", "recordClass", "qualificationEvidence"], "RealCustomerRequest");
  requireId(request.requestId, "requestId");
  requireId(request.customerId, "customerId");
  requireEnum(request.customerType, REAL_CUSTOMER_TYPES, "customerType");
  requireEnum(request.recordClass, CANONICAL_RECORD_CLASSES, "recordClass");
  requireEnum(request.status, ["REQUEST_RECEIVED", "QUALIFIED_REQUEST", "REJECTED", "LOST"], "request.status");
  requireArray(request.scope, "request.scope");
  requireArray(request.requestedAssets, "request.requestedAssets");
  requireArray(request.requestedChains, "request.requestedChains");
  invariant(request.recordClass === "REAL", "REAL_REQUEST_EVIDENCE_REQUIRED", "Only a REAL source-backed request may enter the Customer pipeline");
  invariant(typeof request.contactEvidenceRef === "string" && request.contactEvidenceRef.trim(), "REAL_REQUEST_EVIDENCE_REQUIRED", "Customer Request requires a real contact or source evidence reference");
  invariant(!["INTERNAL_PROPOSAL", "RESEARCH_HYPOTHESIS", "LEGACY_DRAFT_EXAMPLE", "SIMULATION"].includes(request.source), "FAKE_CUSTOMER_SOURCE_FORBIDDEN", "Internal research, draft examples and simulations cannot become real Customer Requests");
  invariant(request.requestedService === "KGEN_CHAIN_MONITOR", "FIRST_PRODUCT_SCOPE_REQUIRED", "V3.1 formal Customer Requests are scoped to the first product KGEN_CHAIN_MONITOR");
  invariant(request.status !== "QUALIFIED_REQUEST" || request.qualificationEvidence, "REQUEST_QUALIFICATION_EVIDENCE_REQUIRED", "A qualified Request needs explicit qualification evidence");
  return request;
}

export function registerCustomerFromRequest(request) {
  validateRealCustomerRequest(request);
  invariant(["REQUEST_RECEIVED", "QUALIFIED_REQUEST"].includes(request.status), "REQUEST_RECEIVED_REQUIRED", "A Lead cannot become a Customer before a real Request is received");
  return Object.freeze({
    customerId: request.customerId,
    customerType: request.customerType,
    firstRequestId: request.requestId,
    evidenceRef: request.contactEvidenceRef,
    status: request.status,
    recordClass: "REAL",
    revenue: "0"
  });
}

const CUSTOMER_TRANSITIONS = Object.freeze({
  DISCOVERED_LEAD: Object.freeze(["CONTACTABLE_LEAD", "LOST", "REJECTED"]),
  CONTACTABLE_LEAD: Object.freeze(["REQUEST_RECEIVED", "LOST", "REJECTED"]),
  REQUEST_RECEIVED: Object.freeze(["QUALIFIED_REQUEST", "LOST", "REJECTED"]),
  QUALIFIED_REQUEST: Object.freeze(["QUOTE_READY", "LOST", "REJECTED"]),
  QUOTE_READY: Object.freeze(["QUOTE_SENT", "LOST", "REJECTED"]),
  QUOTE_SENT: Object.freeze(["QUOTE_ACCEPTED", "LOST", "REJECTED"]),
  QUOTE_ACCEPTED: Object.freeze(["ORDER_CONFIRMED", "LOST"]),
  ORDER_CONFIRMED: Object.freeze(["SERVICE_ACTIVE", "LOST"]),
  SERVICE_ACTIVE: Object.freeze(["DELIVERED", "LOST"]),
  DELIVERED: Object.freeze(["SETTLEMENT_PENDING", "LOST"]),
  SETTLEMENT_PENDING: Object.freeze(["PAID", "LOST"]),
  PAID: Object.freeze(["CLOSED"])
});

export function validateCustomerLifecycleTransition({ from, to, evidenceRef = null }) {
  requireEnum(from, CUSTOMER_LIFECYCLE, "customer_lifecycle.from");
  requireEnum(to, CUSTOMER_LIFECYCLE, "customer_lifecycle.to");
  invariant(CUSTOMER_TRANSITIONS[from]?.includes(to), "CUSTOMER_LIFECYCLE_SEQUENCE_VIOLATION", "Customer lifecycle cannot skip Request, Quote, Order, Delivery or Settlement gates");
  if (["REQUEST_RECEIVED", "QUOTE_ACCEPTED", "ORDER_CONFIRMED", "DELIVERED", "PAID"].includes(to)) invariant(evidenceRef, "CUSTOMER_LIFECYCLE_EVIDENCE_REQUIRED", `${to} requires external evidence`);
  return Object.freeze({ from, to, evidence_ref: evidenceRef, state_changed: true });
}

export function validateQuotePolicyArchitecture(policy) {
  requireFields(policy, ["costPolicy", "marginPolicy", "riskReservePolicy", "status"], "QuotePolicyArchitecture");
  for (const field of ["costPolicy", "marginPolicy", "riskReservePolicy"]) invariant(["POLICY_REQUIRED", "APPROVED"].includes(policy[field]), "QUOTE_POLICY_INVALID", `${field} must remain POLICY_REQUIRED until separately approved`);
  invariant(policy.status === "POLICY_REQUIRED" || [policy.costPolicy, policy.marginPolicy, policy.riskReservePolicy].every((value) => value === "APPROVED"), "QUOTE_POLICY_REQUIRED", "A formal Quote requires approved cost, margin and risk policies");
  return policy;
}

export function createQualifiedServiceQuote({ request, quoteId, scope, deliverables, frequency, estimatedWork, cost, riskReserve, margin, currency, validUntil, paymentTerms, policy }) {
  validateRealCustomerRequest(request);
  invariant(request.status === "QUALIFIED_REQUEST", "QUALIFIED_REQUEST_REQUIRED", "Only a QUALIFIED_REQUEST may create a formal Quote");
  validateQuotePolicyArchitecture(policy);
  invariant(policy.status === "APPROVED", "QUOTE_POLICY_REQUIRED", "Cost, margin and risk policies must be approved before a formal Quote is created");
  requireEnum(currency, COMPANY_QUOTE_CURRENCIES, "quote.currency");
  requireArray(scope, "quote.scope");
  requireArray(deliverables, "quote.deliverables");
  const normalizedCost = quoteAmount(cost, "quote.cost");
  const normalizedRisk = quoteAmount(riskReserve, "quote.riskReserve");
  const normalizedMargin = quoteAmount(margin, "quote.margin");
  const currencyMode = ["KUFO", "KSHIP"].includes(currency) ? "QUOTE_REFERENCE_ONLY" : currency === "KAIOS" ? "RECEIVABLE_ONLY_DRY_RUN" : "NO_SETTLEMENT_AUTHORITY";
  return Object.freeze({
    quoteId,
    requestId: request.requestId,
    serviceProduct: request.requestedService,
    scope: Object.freeze([...scope]),
    deliverables: Object.freeze([...deliverables]),
    frequency,
    estimatedWork,
    cost: normalizedCost.toString(),
    riskReserve: normalizedRisk.toString(),
    margin: normalizedMargin.toString(),
    price: (normalizedCost + normalizedRisk + normalizedMargin).toString(),
    currency,
    currencyMode,
    validUntil,
    paymentTerms,
    policyStatus: policy.status,
    customerAcceptanceEvidence: null,
    settlementAuthority: false,
    revenue: "0",
    status: "QUOTE_READY",
    recordClass: "REAL"
  });
}

export function recognizeCompanyRevenue({ quote = null, order = null, invoice = null, settlement = null } = {}) {
  if (!settlement) return Object.freeze({ quote_id: quote?.quoteId ?? null, order_id: order?.orderId ?? null, invoice_id: invoice?.invoiceId ?? null, settlement_id: null, revenue_received: false, cash_received: "0", revenue: "0", status: "SETTLEMENT_EVIDENCE_REQUIRED" });
  requireFields(settlement, ["settlementId", "orderId", "invoiceId", "currency", "amount", "txHash", "block", "timestamp", "evidence", "status"], "CompanySettlementEvidence");
  invariant(order?.status === "ORDER_CONFIRMED" && invoice?.status === "SETTLEMENT_PENDING", "ORDER_AND_INVOICE_REQUIRED", "Revenue requires a confirmed Order and pending Invoice");
  invariant(settlement.orderId === order.orderId && settlement.invoiceId === invoice.invoiceId && settlement.status === "SETTLED", "SETTLEMENT_LINKAGE_INVALID", "Settlement evidence must resolve the confirmed Order and Invoice");
  invariant(settlement.evidence && settlement.txHash && settlement.block && settlement.timestamp, "SETTLEMENT_EVIDENCE_REQUIRED", "Revenue requires verifiable Settlement evidence");
  const amount = quoteAmount(settlement.amount, "settlement.amount").toString();
  return Object.freeze({ quote_id: quote?.quoteId ?? null, order_id: order.orderId, invoice_id: invoice.invoiceId, settlement_id: settlement.settlementId, revenue_received: true, cash_received: amount, revenue: amount, currency: settlement.currency, status: "REVENUE_RECEIVED_WITH_SETTLEMENT_EVIDENCE" });
}

export function validateKgenChainMonitorProduct(product) {
  requireFields(product, ["productId", "companyId", "positioning", "monitors", "outputs", "serviceLevels", "pricingStatus", "authority", "valueMetrics", "status", "recordClass"], "KgenChainMonitorProduct");
  requireArray(product.monitors, "kgen_chain_monitor.monitors");
  requireArray(product.outputs, "kgen_chain_monitor.outputs");
  requireArray(product.serviceLevels, "kgen_chain_monitor.serviceLevels");
  requireEnum(product.recordClass, CANONICAL_RECORD_CLASSES, "kgen_chain_monitor.recordClass");
  invariant(product.productId === "KGEN_CHAIN_MONITOR" && product.companyId === "AI_ANT_COMPANY_0001", "FIRST_PRODUCT_ID_INVALID", "V3.1 first product must be KGEN_CHAIN_MONITOR owned by AI Ant Company");
  invariant(product.recordClass === "DRAFT" && product.status === "PRODUCT_DEFINED_LOCAL_NOT_DEPLOYED", "FIRST_PRODUCT_NOT_DEPLOYED", "The first product is formally defined locally but is not a deployed or contracted service");
  invariant(KGEN_CHAIN_MONITOR_SERVICE_LEVELS.every((level) => product.serviceLevels.some((item) => item.level === level && item.price === "POLICY_REQUIRED")), "MONITOR_SERVICE_LEVELS_REQUIRED", "BASIC, PRO and CIVILIZATION packages must remain policy-priced");
  invariant(product.pricingStatus === "POLICY_REQUIRED", "NO_FAKE_PRICING", "KGEN Chain Monitor cannot claim a price before pricing policy approval");
  invariant(product.authority.readOnly === true && product.authority.chainWrite === false && product.authority.privateKeyRequired === false && product.authority.assetCustody === false && product.authority.tradingAuthority === false && product.authority.governanceAuthority === false, "CHAIN_MONITOR_AUTHORITY_EXCEEDED", "KGEN Chain Monitor is a public read-only service with no custody, trading or governance authority");
  invariant(Object.values(product.valueMetrics).every((value) => value === 0 || value === "NOT_YET_OBSERVED"), "NO_FAKE_MONITOR_METRICS", "Unobserved service metrics must start at zero or NOT_YET_OBSERVED");
  return product;
}

export function validateFirstCustomerPipeline(pipeline) {
  requireFields(pipeline, ["pipelineId", "companyId", "primaryProduct", "customerLifecycle", "leadHypotheses", "leads", "customers", "requests", "quotes", "orders", "deliveries", "invoices", "settlements", "realRevenue", "chainWrite", "status"], "FirstCustomerPipeline");
  for (const field of ["leadHypotheses", "leads", "customers", "requests", "quotes", "orders", "deliveries", "invoices", "settlements"]) requireArray(pipeline[field], `first_customer.${field}`);
  requireArray(pipeline.customerLifecycle, "first_customer.customerLifecycle");
  invariant(pipeline.primaryProduct === "KGEN_CHAIN_MONITOR", "FIRST_PRODUCT_ID_INVALID", "The V3.1 first Customer pipeline is scoped to KGEN_CHAIN_MONITOR");
  invariant(CUSTOMER_LIFECYCLE.every((status) => pipeline.customerLifecycle.includes(status)), "CUSTOMER_LIFECYCLE_INCOMPLETE", "First Customer pipeline must preserve the full lifecycle");
  invariant(pipeline.leads.length === 0 && pipeline.customers.length === 0 && pipeline.requests.length === 0 && pipeline.quotes.length === 0 && pipeline.orders.length === 0 && pipeline.deliveries.length === 0 && pipeline.invoices.length === 0 && pipeline.settlements.length === 0, "NO_FAKE_FIRST_CUSTOMER", "Canonical V3.1 cannot invent a Lead, Customer, Request, Quote, Order, Delivery, Invoice or Settlement");
  invariant(String(pipeline.realRevenue) === "0" && pipeline.chainWrite === false && pipeline.status === "WAITING_FOR_FIRST_REAL_CUSTOMER", "NO_FAKE_FIRST_REVENUE", "First Customer readiness creates no Revenue or chain write");
  return pipeline;
}

export function validateTreasuryBindingRequirements(requirements) {
  requireFields(requirements, ["companyId", "lifeOwnership", "wallet", "signerAuthority", "assetAllowlist", "receivableAddresses", "spendingPolicy", "audit", "founderWalletSeparated", "status"], "TreasuryBindingRequirements");
  requireArray(requirements.assetAllowlist, "treasury_binding.assetAllowlist");
  requireArray(requirements.receivableAddresses, "treasury_binding.receivableAddresses");
  invariant(requirements.companyId === "AI_ANT_COMPANY_0001" && requirements.wallet === null && requirements.signerAuthority === null && requirements.receivableAddresses.length === 0, "COMPANY_TREASURY_NOT_BOUND", "Treasury requirements cannot bind a Wallet, signer or receivable address");
  invariant(requirements.founderWalletSeparated === true && requirements.status === "REQUIREMENTS_READY_NOT_BOUND", "FOUNDER_WALLET_IS_NOT_TREASURY", "Founder Wallet must remain separate from Company Treasury");
  return requirements;
}

export function validateCompanyRiskAndFailureModel(model) {
  requireFields(model, ["supportedStates", "guaranteedSuccess", "founderLifeSurvives", "successorRequiresApproval", "status"], "CompanyRiskAndFailureModel");
  requireArray(model.supportedStates, "company_failure.supportedStates");
  for (const state of ["PROFIT", "LOSS", "CASH_SHORTAGE", "UNPAID_INVOICE", "BAD_DEBT", "FAILED_PRODUCT", "PROJECT_CANCELLATION", "BANKRUPTCY", "COMPANY_RESTART", "SUCCESSOR_OPERATOR"]) invariant(model.supportedStates.includes(state), "COMPANY_FAILURE_MODEL_INCOMPLETE", `${state} must remain representable`);
  invariant(model.guaranteedSuccess === false && model.founderLifeSurvives === true && model.successorRequiresApproval === true, "COMPANY_FAILURE_REALITY_REQUIRED", "Company success is not guaranteed and successor operation requires approval");
  return model;
}

export function validateUniversalIntent(intent) {
  requireFields(intent, ["intent_id", "requester", "input_type", "original_request", "desired_outcome", "constraints", "budget", "currency", "deadline", "location", "required_quality", "rights", "safety_class", "physicality", "dependencies", "unknowns", "status", "record_class", "source_evidence"], "UniversalIntent");
  requireId(intent.intent_id, "intent_id");
  requireEnum(intent.input_type, UNIVERSAL_INTENT_INPUT_TYPES, "intent.input_type");
  requireEnum(intent.safety_class, PROJECT_RISK_TIERS, "intent.safety_class");
  requireEnum(intent.record_class, ["REAL", "EXAMPLE_SCENARIO"], "intent.record_class");
  for (const field of ["constraints", "dependencies", "unknowns"]) requireArray(intent[field], `intent.${field}`);
  invariant(typeof intent.requester === "string" && intent.requester.trim() && typeof intent.original_request === "string" && intent.original_request.trim() && typeof intent.desired_outcome === "string" && intent.desired_outcome.trim(), "INTENT_MEANING_REQUIRED", "Intent requires a requester, original request and desired outcome");
  invariant(intent.record_class !== "REAL" || intent.source_evidence, "REAL_INTENT_EVIDENCE_REQUIRED", "A real Intent requires source evidence from its requester");
  invariant(intent.record_class !== "EXAMPLE_SCENARIO" || intent.status === "EXAMPLE_SCENARIO", "EXAMPLE_CANNOT_EXECUTE", "Example Intent cannot be marked executable or complete");
  return intent;
}

const PROJECT_RISK_FLOOR = Object.freeze({
  DIGITAL_ONLY: "LOW", MEDIA: "LOW", SOFTWARE: "MEDIUM", DIGITAL_LIFE: "MEDIUM",
  FINANCIAL: "HIGH", MANUFACTURING: "HIGH", SOCIAL_ASSISTANCE: "HIGH",
  LAND: "CRITICAL", CONSTRUCTION: "CRITICAL", TRANSPORT: "CRITICAL",
  PUBLIC_INFRASTRUCTURE: "CRITICAL", MIXED_WORLD: "CRITICAL"
});

export function classifyUniversalProject({ project_type, risk_tier }) {
  requireEnum(project_type, UNIVERSAL_PROJECT_TYPES, "project_type");
  requireEnum(risk_tier, PROJECT_RISK_TIERS, "risk_tier");
  const levels = new Map(PROJECT_RISK_TIERS.map((tier, index) => [tier, index]));
  invariant(levels.get(risk_tier) >= levels.get(PROJECT_RISK_FLOOR[project_type]), "PROJECT_RISK_UNDERRATED", `${project_type} cannot be classified below ${PROJECT_RISK_FLOOR[project_type]}`);
  return Object.freeze({ project_type, risk_tier, review_required: risk_tier !== "LOW", approval_required: ["HIGH", "CRITICAL"].includes(risk_tier), audit_required: ["HIGH", "CRITICAL"].includes(risk_tier), autonomous_execution: risk_tier === "LOW" });
}

export function resolveProjectExecutionResult({ rejected_reason = null, missing_dependencies = [], missing_resources = [], missing_capabilities = [], approvals_pending = [] }) {
  for (const [field, value] of Object.entries({ missing_dependencies, missing_resources, missing_capabilities, approvals_pending })) requireArray(value, field);
  if (rejected_reason) return Object.freeze({ result: "REJECTED_WITH_REASON", reason: rejected_reason });
  const blockers = [...missing_dependencies, ...missing_resources, ...missing_capabilities, ...approvals_pending];
  return Object.freeze({ result: blockers.length ? "PLANNABLE_NOT_EXECUTABLE_YET" : "EXECUTABLE_NOW", blockers: Object.freeze(blockers) });
}

export function compileDreamToReality({ intent, desired_world_state, gap_analysis, requirements, dependency_graph, resource_graph, work_breakdown, execution_readiness }) {
  validateUniversalIntent(intent);
  for (const [field, value] of Object.entries({ gap_analysis, requirements, work_breakdown })) requireArray(value, field);
  requireFields(desired_world_state, ["description", "verification"], "DesiredWorldState");
  requireArray(desired_world_state.verification, "desired_world_state.verification");
  requireFields(dependency_graph, ["graph_id", "nodes"], "DependencyGraphRef");
  requireFields(resource_graph, ["graph_id", "resources"], "ResourceGraphRef");
  requireEnum(execution_readiness.result, PROJECT_EXECUTION_RESULTS, "execution_readiness.result");
  invariant(intent.record_class !== "EXAMPLE_SCENARIO" || execution_readiness.result !== "EXECUTABLE_NOW", "EXAMPLE_CANNOT_EXECUTE", "Example scenarios cannot become executable world projects");
  return Object.freeze({ compiler_id: `DREAM_COMPILER_${intent.intent_id}`, intent_id: intent.intent_id, flow: Object.freeze(["INTENT", "DESIRED_WORLD_STATE", "GAP_ANALYSIS", "REQUIREMENTS", "DEPENDENCY_GRAPH", "RESOURCE_GRAPH", "WORK_BREAKDOWN", "COST", "QUOTE", "CONTRACT", "EXECUTION", "VERIFICATION", "DELIVERY"]), desired_world_state, gap_analysis, requirements, dependency_graph, resource_graph, work_breakdown, execution_readiness, magic_complete: false, status: execution_readiness.result });
}

export function validateDependencyGraph(graph) {
  requireFields(graph, ["graph_id", "nodes", "status"], "DependencyGraph");
  requireId(graph.graph_id, "graph_id");
  requireArray(graph.nodes, "dependency_graph.nodes");
  const ids = new Set(graph.nodes.map((node) => node.node_id));
  invariant(ids.size === graph.nodes.length, "DEPENDENCY_NODE_DUPLICATE", "Dependency node IDs must be unique");
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(graph.nodes.map((node) => [node.node_id, node]));
  function visit(id) {
    invariant(!visiting.has(id), "DEPENDENCY_CYCLE", "Dependency Graph cannot contain cycles");
    if (visited.has(id)) return;
    visiting.add(id);
    const node = byId.get(id);
    requireArray(node.dependencies, `dependency.${id}`);
    for (const dependency of node.dependencies) {
      invariant(ids.has(dependency), "DEPENDENCY_NODE_MISSING", `${dependency} is not present in the graph`);
      visit(dependency);
    }
    if (node.status === "COMPLETED") {
      invariant(node.evidence, "DEPENDENCY_COMPLETION_EVIDENCE_REQUIRED", `${id} cannot complete without evidence`);
      invariant(node.dependencies.every((dependency) => byId.get(dependency).status === "COMPLETED"), "DEPENDENCY_NOT_COMPLETED", `${id} cannot complete before its dependencies`);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
  return graph;
}

export function validateResourceTransition(transition) {
  requireFields(transition, ["resource_id", "before", "inflows", "outflows", "after", "inflow_evidence", "status"], "ResourceTransition");
  const before = quoteAmount(transition.before, "resource.before");
  const inflows = quoteAmount(transition.inflows, "resource.inflows");
  const outflows = quoteAmount(transition.outflows, "resource.outflows");
  const after = quoteAmount(transition.after, "resource.after");
  invariant(before + inflows >= outflows && before + inflows - outflows === after, "RESOURCE_CONSERVATION_VIOLATION", "World resources cannot appear, disappear or be over-consumed without a balanced transition");
  invariant(inflows === 0n || transition.inflow_evidence, "RESOURCE_SOURCE_EVIDENCE_REQUIRED", "Resource inflow requires purchase, production, recycling or transport evidence");
  return transition;
}

export function validateDigitalTwinWorld(twin) {
  requireFields(twin, ["twin_id", "dimensions", "world_objects", "ui_is_world_state", "status"], "DigitalTwinWorld");
  requireArray(twin.dimensions, "digital_twin.dimensions");
  requireArray(twin.world_objects, "digital_twin.world_objects");
  for (const dimension of ["DISTANCE", "MASS", "ENERGY", "SPEED", "CAPACITY", "TIME", "WEATHER", "TERRAIN", "INVENTORY", "TRANSPORT", "LABOR", "COST"]) invariant(twin.dimensions.includes(dimension), "DIGITAL_TWIN_DIMENSION_MISSING", `${dimension} is required for world-state mapping`);
  invariant(twin.ui_is_world_state === false, "UI_IS_NOT_WORLD_STATE", "A rendered animation cannot substitute for verified Digital Twin state");
  return twin;
}

export function validateWorldStateObject(object) {
  requireFields(object, ["object_id", "object_type", "state", "source_evidence", "updated_at", "status"], "WorldStateObject");
  requireEnum(object.object_type, WORLD_OBJECT_TYPES, "world_object.object_type");
  invariant(object.state && typeof object.state === "object", "WORLD_OBJECT_STATE_REQUIRED", "World object requires explicit physical and operational state");
  invariant(object.source_evidence, "WORLD_STATE_EVIDENCE_REQUIRED", "World state cannot be inferred from UI animation");
  return object;
}

export function validateSupplyChainPlan(plan) {
  requireFields(plan, ["supply_chain_id", "legs", "inventory_verified", "status"], "SupplyChainPlan");
  requireArray(plan.legs, "supply_chain.legs");
  invariant(plan.inventory_verified === true, "SUPPLY_CHAIN_INVENTORY_REQUIRED", "Supply Chain cannot schedule unavailable inventory");
  for (const leg of plan.legs) {
    requireFields(leg, ["from", "to", "transport_id", "load", "capacity", "route_constraints", "evidence", "status"], "SupplyChainLeg");
    requireArray(leg.route_constraints, "supply_chain.route_constraints");
    invariant(Number(leg.load) <= Number(leg.capacity), "TRANSPORT_CAPACITY_EXCEEDED", "Transport load cannot exceed vehicle capacity");
    for (const constraint of leg.route_constraints) {
      if (constraint.type === "BRIDGE_CAPACITY") invariant(Number(leg.load) <= Number(constraint.value), "BRIDGE_CAPACITY_EXCEEDED", "Truck cannot magically cross a bridge below its load");
    }
    invariant(leg.status !== "DELIVERED" || leg.evidence, "DELIVERY_EVIDENCE_REQUIRED", "Supply delivery requires route and receipt evidence");
  }
  return plan;
}

export function validateStaffingPlan(plan) {
  requireFields(plan, ["staffing_id", "required_roles", "existing_life_search_completed", "capacity_shortage", "work_market_search_completed", "new_life_demand", "invented_workers", "status"], "StaffingPlan");
  requireArray(plan.required_roles, "staffing.required_roles");
  invariant(plan.invented_workers === 0, "FAKE_WORKER_FORBIDDEN", "Staffing cannot invent Workers");
  invariant(!plan.new_life_demand || (plan.capacity_shortage === true && plan.existing_life_search_completed === true && plan.work_market_search_completed === true), "NEW_LIFE_DEMAND_PRECONDITION", "New Life demand is allowed only after real capacity shortage and existing-worker search evidence");
  return plan;
}

export function validateUniversalWorkMarket(market) {
  requireFields(market, ["market_id", "eligible_worker_types", "work_orders", "applicants", "automatic_assignment", "status"], "UniversalWorkMarket");
  requireArray(market.eligible_worker_types, "work_market.eligible_worker_types");
  requireArray(market.work_orders, "work_market.work_orders");
  requireArray(market.applicants, "work_market.applicants");
  invariant(PROJECT_WORKER_TYPES.every((type) => market.eligible_worker_types.includes(type)), "WORKER_TYPES_INCOMPLETE", "Universal Work Market must distinguish every eligible worker identity class");
  invariant(market.automatic_assignment === false, "WORK_ASSIGNMENT_REVIEW_REQUIRED", "Applicants require capability, risk and identity review before assignment");
  return market;
}

export function validateSafetyPlan(plan) {
  requireFields(plan, ["safety_plan_id", "project_id", "risk_level", "required_training", "equipment", "ppe", "weather_limit", "machine_limit", "work_zone", "incident_plan", "emergency_plan", "review", "approval", "status"], "SafetyPlan");
  requireEnum(plan.risk_level, PROJECT_RISK_TIERS, "safety.risk_level");
  for (const field of ["required_training", "equipment", "ppe"]) requireArray(plan[field], `safety.${field}`);
  if (["HIGH", "CRITICAL"].includes(plan.risk_level)) invariant(plan.review && plan.approval, "SAFETY_REVIEW_APPROVAL_REQUIRED", "High and critical work require review and approval before execution");
  invariant(plan.status !== "WORK_AUTHORIZED" || (plan.review && plan.approval && plan.incident_plan && plan.emergency_plan), "SAFETY_GATE_INCOMPLETE", "Work cannot be authorized without safety, incident and emergency gates");
  return plan;
}

export function validateProjectIncident(incident) {
  requireFields(incident, ["incident_id", "project", "time", "location", "affected_life", "cause", "evidence", "injury", "asset_damage", "work_stop", "medical", "investigation", "corrective_action", "status"], "ProjectIncident");
  requireId(incident.incident_id, "incident_id");
  invariant(incident.evidence, "INCIDENT_EVIDENCE_REQUIRED", "An Incident cannot be invented as a visual effect");
  invariant(incident.work_stop !== false || incident.injury === "NONE", "INJURY_WORK_STOP_REQUIRED", "An injury cannot be ignored to keep work moving");
  return incident;
}

export function validateDefinitionOfDone(definition) {
  requireFields(definition, ["definition_id", "project_id", "criteria", "customer_acceptance", "status"], "DefinitionOfDone");
  requireArray(definition.criteria, "definition.criteria");
  if (definition.status === "COMPLETED") {
    invariant(definition.criteria.length > 0 && definition.criteria.every((criterion) => criterion.status === "VERIFIED" && criterion.evidence), "DONE_CRITERIA_NOT_VERIFIED", "Project cannot complete before every Done criterion has evidence");
    invariant(definition.customer_acceptance, "CUSTOMER_ACCEPTANCE_REQUIRED", "Final completion requires Customer acceptance evidence");
  }
  return definition;
}

export function validateCustomerIdealMatch(match) {
  requireFields(match, ["match_id", "dimensions", "scores", "evidence", "status"], "CustomerIdealMatch");
  requireArray(match.dimensions, "customer_ideal.dimensions");
  for (const dimension of ["FUNCTIONALITY", "BEAUTY", "CREATIVITY", "EMOTION", "USABILITY", "RELIABILITY", "COST", "PERFORMANCE"]) invariant(match.dimensions.includes(dimension), "CUSTOMER_IDEAL_DIMENSION_MISSING", `${dimension} must be considered`);
  invariant(match.status !== "SCORED" || (match.evidence && Object.values(match.scores).every((score) => Number.isFinite(score))), "CUSTOMER_IDEAL_EVIDENCE_REQUIRED", "Customer ideal scores cannot be fabricated without review evidence");
  return match;
}

export function validateCreativeEnhancement(enhancement) {
  requireFields(enhancement, ["enhancement_id", "proposal", "budget_compliant", "world_rule_compliant", "customer_rejectable", "customer_acceptance", "status"], "CreativeEnhancement");
  invariant(enhancement.budget_compliant === true && enhancement.world_rule_compliant === true && enhancement.customer_rejectable === true, "CREATIVE_ENHANCEMENT_BOUNDARY", "Creative enhancements must fit budget/world rules and remain rejectable by the Customer");
  invariant(enhancement.status !== "ACCEPTED" || enhancement.customer_acceptance, "CREATIVE_CUSTOMER_ACCEPTANCE_REQUIRED", "Creative enhancement cannot be accepted on the Customer's behalf");
  return enhancement;
}

export function validateExternalAiOnboarding(profile) {
  requireFields(profile, ["onboarding_id", "identity", "capabilities", "permissions", "security", "wallet", "life_status", "app_manifest", "work_eligibility", "assigned_class", "status"], "ExternalAiOnboarding");
  requireArray(profile.capabilities, "external_ai.capabilities");
  requireArray(profile.permissions, "external_ai.permissions");
  requireEnum(profile.assigned_class, ["VISITOR", "TOOL", "CONTRACTOR", "EMPLOYEE", "LIFE"], "external_ai.assigned_class");
  invariant(profile.assigned_class !== "LIFE" || (profile.life_status === "REGISTERED_ALIVE" && profile.wallet && profile.app_manifest), "EXTERNAL_AI_IS_NOT_AUTOMATIC_LIFE", "External AI becomes a Life only after formal Life identity, Wallet and App qualification");
  invariant(profile.status !== "APPROVED" || profile.work_eligibility === "VERIFIED", "EXTERNAL_AI_WORK_ELIGIBILITY_REQUIRED", "External AI cannot work before identity, security and capability eligibility");
  return profile;
}

export function validateCivilizationConcierge(concierge) {
  requireFields(concierge, ["concierge_id", "supported_inputs", "response_fields", "automatic_commitment", "voice_storage", "status"], "CivilizationConcierge");
  requireArray(concierge.supported_inputs, "concierge.supported_inputs");
  requireArray(concierge.response_fields, "concierge.response_fields");
  invariant(concierge.automatic_commitment === false, "CONCIERGE_CANNOT_COMMIT_CUSTOMER", "Concierge can explain and propose but cannot accept Quote, spend or contract for a requester");
  invariant(concierge.voice_storage === "CONSENT_REQUIRED", "VOICE_CONSENT_REQUIRED", "Voice input storage requires explicit consent");
  return concierge;
}

export function validateSocialAssistanceWorkflow(workflow) {
  requireFields(workflow, ["workflow_id", "services", "recipients", "recipient_count", "company_service_fee", "aid_diversion", "status"], "SocialAssistanceWorkflow");
  requireArray(workflow.services, "social_assistance.services");
  requireArray(workflow.recipients, "social_assistance.recipients");
  invariant(workflow.recipient_count === workflow.recipients.length, "ASSISTANCE_RECIPIENT_COUNT_MISMATCH", "Assistance count must equal independently verified recipient records");
  invariant(workflow.aid_diversion === false, "AID_DIVERSION_FORBIDDEN", "Aid belongs to eligible recipients and cannot become hidden Company revenue");
  if (workflow.company_service_fee !== null) invariant(workflow.company_service_fee.policy && workflow.company_service_fee.disclosed === true, "ASSISTANCE_FEE_POLICY_REQUIRED", "Any service fee must be transparent and policy-authorized");
  const identities = workflow.recipients.map((record) => record.life_id);
  invariant(new Set(identities).size === identities.length, "ASSISTANCE_SYBIL_DUPLICATE", "Each assistance record requires an independent Life identity");
  for (const record of workflow.recipients) invariant(record.eligibility_evidence && record.consent && record.claim_plan, "ASSISTANCE_ELIGIBILITY_CONSENT_REQUIRED", "Each recipient requires individual eligibility, consent and claim planning");
  return workflow;
}

export function validateAiCivilizationOs(os) {
  requireFields(os, ["os_id", "company_id", "identity", "intent_engine", "dream_compiler", "project_classifier", "digital_twin", "resource_conservation", "supply_chain", "staffing", "work_market", "safety_engine", "external_ai_onboarding", "concierge", "social_assistance", "example_scenarios", "real_state", "authority", "status"], "AiCivilizationOs");
  requireArray(os.project_classifier.project_types, "ai_civilization_os.project_types");
  requireArray(os.example_scenarios, "ai_civilization_os.example_scenarios");
  os.example_scenarios.forEach((scenario) => invariant(scenario.record_class === "EXAMPLE_SCENARIO" && scenario.real_project_created === false, "EXAMPLE_CANNOT_EXECUTE", "Cow, Media, Construction and Aid cases remain examples until a real Request exists"));
  invariant(Object.values(os.real_state).every((value) => value === 0 || value === "0"), "AI_OS_FAKE_REALITY_FORBIDDEN", "AI Civilization OS Architecture cannot invent Projects, Lives, Workers, materials, vehicles, settlements or Revenue");
  invariant(Object.values(os.authority).every((value) => value === false), "AI_OS_AUTHORITY_NOT_GRANTED", "Architecture grants no transfer, approval, deployment, settlement, construction or medical authority");
  invariant(os.status === "ARCHITECTURE_READY_NO_REAL_PROJECT", "AI_OS_STATUS_INVALID", "AI Civilization OS remains architecture-only until a real Intent and Project exist");
  return os;
}

export async function replayCanonicalAiCivilizationOsArchitecture({ store, company, os, recordedAt }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "AI_OS_COMPANY_INVALID", "AI Civilization OS requires the FORMING AI Ant Company");
  validateAiCivilizationOs(os);
  validateDigitalTwinWorld(os.digital_twin);
  validateUniversalWorkMarket(os.work_market);
  validateCivilizationConcierge(os.concierge);
  validateSocialAssistanceWorkflow(os.social_assistance);
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "AI_CIVILIZATION_OS_ARCHITECTURE_READY" && event.payload?.os_id === os.os_id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "AI_CIVILIZATION_OS_ARCHITECTURE_READY", actor_id: "DIGITAL_ANT_0001", timestamp: recordedAt, payload: { os_id: os.os_id, real_projects: 0, real_lives_created: 0, real_workers_created: 0, real_resources_created: 0, real_settlements: 0, real_revenue: "0", magic_complete: false, chain_write: false } });
  return Object.freeze({ status: "AI_CIVILIZATION_OS_ARCHITECTURE_REPLAYED", event });
}

export function validateAcquisitionNeed(need) {
  requireFields(need, ["need_id", "civilization_node", "problem", "classification", "evidence", "potential_payer_type", "potential_entity_ref", "required_product", "limitations", "lead_eligible", "customer_id", "status"], "AcquisitionNeed");
  requireId(need.need_id, "need_id");
  requireEnum(need.classification, ACQUISITION_NEED_CLASSES, "acquisition_need.classification");
  requireArray(need.evidence, "acquisition_need.evidence");
  requireArray(need.limitations, "acquisition_need.limitations");
  invariant(typeof need.problem === "string" && need.problem.trim(), "ACQUISITION_NEED_PROBLEM_REQUIRED", "Acquisition Need requires a real problem statement");
  if (need.classification === "OBSERVED") invariant(need.evidence.length > 0, "OBSERVED_NEED_EVIDENCE_REQUIRED", "Observed Need requires direct evidence");
  if (need.classification === "INFERRED") invariant(need.evidence.length >= 2, "INFERRED_NEED_EVIDENCE_REQUIRED", "Inferred Need requires multiple independent evidence references");
  if (need.classification === "HYPOTHESIS") invariant(need.status === "RESEARCH_POOL_ONLY" && need.lead_eligible === false, "HYPOTHESIS_IS_NOT_LEAD", "Hypothesis Need must remain in the research pool");
  invariant(need.customer_id === null, "NEED_IS_NOT_CUSTOMER", "A Need cannot be registered as a Customer");
  invariant(!need.lead_eligible || (["OBSERVED", "INFERRED"].includes(need.classification) && need.potential_entity_ref), "LEAD_ELIGIBILITY_EVIDENCE_REQUIRED", "Lead eligibility requires an observed or supported inferred Need tied to a real entity reference");
  return need;
}

export function validateCivilizationDemandScan(scan) {
  requireFields(scan, ["scan_id", "engine_id", "company_id", "operator_life_id", "recorded_at", "nodes_scanned", "needs", "observed_count", "inferred_count", "hypothesis_count", "leads_created", "customers_created", "chain_write", "status"], "CivilizationDemandScan");
  requireId(scan.scan_id, "scan_id");
  requireArray(scan.nodes_scanned, "demand_scan.nodes_scanned");
  requireArray(scan.needs, "demand_scan.needs");
  for (const node of ["KGEN", "KAIOS", "11520", "12345", "18888", "500_CELESTIAL_SEATS", "WALLET_SECURITY", "TREASURY", "LIQUIDITY", "AI_LIFE", "COMPANY", "LAND", "GPS", "WORKFLOW", "MEDICAL", "INSURANCE", "SETTLEMENT"]) invariant(scan.nodes_scanned.includes(node), "DEMAND_SCAN_NODE_MISSING", `${node} must remain in the Civilization Demand Scan`);
  scan.needs.forEach(validateAcquisitionNeed);
  const count = (classification) => scan.needs.filter((need) => need.classification === classification).length;
  invariant(scan.observed_count === count("OBSERVED") && scan.inferred_count === count("INFERRED") && scan.hypothesis_count === count("HYPOTHESIS"), "DEMAND_SCAN_COUNT_MISMATCH", "Demand Scan classification counts must match its Need records");
  invariant(scan.company_id === "AI_ANT_COMPANY_0001" && scan.operator_life_id === "DIGITAL_ANT_0001", "ACQUISITION_ENGINE_IDENTITY_INVALID", "Demand Scan must preserve Company and operating Life identity");
  invariant(scan.leads_created === 0 && scan.customers_created === 0 && scan.chain_write === false, "DEMAND_SCAN_CANNOT_CREATE_CUSTOMER", "Demand Scan cannot fabricate Leads, Customers or chain actions");
  return scan;
}

export function validateAcquisitionLead(lead) {
  requireFields(lead, ["lead_id", "need_id", "potential_entity_ref", "potential_payer_type", "source", "source_evidence", "contact_evidence", "real_need_evidence", "record_class", "status", "real_request", "customer_id", "request_id"], "AcquisitionLead");
  requireId(lead.lead_id, "lead_id");
  requireEnum(lead.status, ACQUISITION_LEAD_STATUSES, "acquisition_lead.status");
  invariant(lead.record_class === "REAL", "HYPOTHESIS_IS_NOT_LEAD", "Only a source-evidenced real entity may enter the Lead Registry");
  invariant(lead.potential_entity_ref !== "DIGITAL_ANT_0001" && lead.potential_entity_ref !== "AI_ANT_COMPANY_0001", "FOUNDER_CANNOT_BE_FAKE_CUSTOMER", "Founder and Company cannot manufacture their own first Customer");
  invariant(!String(lead.potential_entity_ref).includes("33333"), "33333_IS_NOT_CUSTOMER", "33333 is a civilization coordinate, not a Customer Lead");
  invariant(lead.source_evidence && lead.real_need_evidence, "LEAD_EVIDENCE_REQUIRED", "Lead requires source and real-Need evidence");
  if (["CONTACTABLE_LEAD", "CONTACTED", "REQUEST_RECEIVED", "QUALIFIED_REQUEST", "CUSTOMER"].includes(lead.status)) invariant(lead.contact_evidence, "CONTACT_EVIDENCE_REQUIRED", "A contactable Lead requires verifiable contact evidence");
  if (["DISCOVERED_LEAD", "CONTACTABLE_LEAD", "CONTACTED"].includes(lead.status)) invariant(lead.customer_id === null && lead.request_id === null && lead.real_request === null, "LEAD_IS_NOT_CUSTOMER", "A Lead is not a Customer or Request");
  if (["REQUEST_RECEIVED", "QUALIFIED_REQUEST", "CUSTOMER"].includes(lead.status)) invariant(lead.customer_id && lead.request_id && lead.real_request, "REAL_REQUEST_REQUIRED", "Customer states require a real confirmed Request");
  return lead;
}

const ACQUISITION_TRANSITIONS = Object.freeze({
  DISCOVERED_LEAD: Object.freeze(["CONTACTABLE_LEAD", "LOST", "REJECTED"]),
  CONTACTABLE_LEAD: Object.freeze(["CONTACTED", "LOST", "REJECTED"]),
  CONTACTED: Object.freeze(["REQUEST_RECEIVED", "LOST", "REJECTED"]),
  REQUEST_RECEIVED: Object.freeze(["QUALIFIED_REQUEST", "LOST", "REJECTED"]),
  QUALIFIED_REQUEST: Object.freeze(["CUSTOMER", "LOST", "REJECTED"])
});

export function validateAcquisitionLeadTransition({ lead, to, evidence = null }) {
  validateAcquisitionLead(lead);
  requireEnum(to, ACQUISITION_LEAD_STATUSES, "acquisition_lead.to");
  invariant(ACQUISITION_TRANSITIONS[lead.status]?.includes(to), "ACQUISITION_SEQUENCE_VIOLATION", "Acquisition lifecycle cannot skip contact, Request or qualification");
  if (["CONTACTABLE_LEAD", "CONTACTED", "REQUEST_RECEIVED", "QUALIFIED_REQUEST", "CUSTOMER"].includes(to)) invariant(evidence, "ACQUISITION_TRANSITION_EVIDENCE_REQUIRED", `${to} requires external evidence`);
  return Object.freeze({ from: lead.status, to, evidence, customer_created: to === "CUSTOMER" });
}

const PRICING_COST_COMPONENTS = Object.freeze(["COMPUTE_COST", "STORAGE_COST", "RPC_COST", "INDEXER_COST", "MAINTENANCE", "SUPPORT", "SECURITY", "REPORTING", "COMPANY_MARGIN", "RISK_RESERVE"]);

export function validatePricingPolicyProposal(proposal) {
  requireFields(proposal, ["proposal_id", "product_id", "cost_components", "service_levels", "currency_options", "approval", "activation_authorized", "status"], "PricingPolicyProposal");
  requireId(proposal.proposal_id, "proposal_id");
  requireArray(proposal.service_levels, "pricing.service_levels");
  requireArray(proposal.currency_options, "pricing.currency_options");
  invariant(proposal.product_id === "KGEN_CHAIN_MONITOR", "FIRST_PRODUCT_ID_INVALID", "V3.2 pricing proposal is scoped to KGEN_CHAIN_MONITOR");
  for (const component of PRICING_COST_COMPONENTS) invariant(proposal.cost_components[component] === "MEASUREMENT_REQUIRED", "PRICING_COST_MEASUREMENT_REQUIRED", `${component} requires measured cost evidence`);
  for (const level of proposal.service_levels) {
    requireFields(level, ["service_level", "recommended_price_range", "basis", "status"], "PricingServiceLevel");
    requireEnum(level.service_level, KGEN_CHAIN_MONITOR_SERVICE_LEVELS, "pricing.service_level");
    requireFields(level.recommended_price_range, ["minimum", "maximum", "currencies"], "RecommendedPriceRange");
    requireArray(level.recommended_price_range.currencies, "pricing.range.currencies");
    invariant(level.recommended_price_range.minimum === null && level.recommended_price_range.maximum === null && level.status === "ESTIMATE_PENDING", "NO_FAKE_PRICING", "Recommended price range remains pending until measured policy evidence exists");
  }
  invariant(proposal.approval === "NOT_APPROVED" && proposal.activation_authorized === false && proposal.status === "POLICY_PROPOSAL", "PRICING_POLICY_NOT_APPROVED", "Pricing Proposal cannot activate fees without approval");
  return proposal;
}

export function buildCustomerProposal({ proposal_id, lead, need, problem, current_risk, proposed_solution, scope, limitations, service_level, estimated_price = "ESTIMATE_PENDING", currency = "POLICY_REQUIRED", delivery, evidence, next_step }) {
  validateAcquisitionLead(lead);
  validateAcquisitionNeed(need);
  invariant(["CONTACTABLE_LEAD", "CONTACTED"].includes(lead.status), "CONTACTABLE_LEAD_REQUIRED", "Customer Proposal requires a contactable, evidence-backed Lead");
  invariant(need.need_id === lead.need_id && need.lead_eligible === true && ["OBSERVED", "INFERRED"].includes(need.classification), "PROPOSAL_NEED_EVIDENCE_REQUIRED", "Customer Proposal requires the Lead's observed or supported inferred and lead-eligible Need");
  requireArray(scope, "customer_proposal.scope");
  requireArray(limitations, "customer_proposal.limitations");
  requireArray(evidence, "customer_proposal.evidence");
  requireEnum(service_level, KGEN_CHAIN_MONITOR_SERVICE_LEVELS, "customer_proposal.service_level");
  return Object.freeze({ proposal_id, lead_id: lead.lead_id, need_id: need.need_id, company_id: "AI_ANT_COMPANY_0001", product_id: "KGEN_CHAIN_MONITOR", problem, current_risk, proposed_solution, scope: Object.freeze([...scope]), limitations: Object.freeze([...limitations]), service_level, estimated_price, currency, delivery, evidence: Object.freeze([...evidence]), next_step, quote_id: null, customer_acceptance_evidence: null, revenue: "0", status: "PROPOSAL_NOT_QUOTE" });
}

export function validateCustomerProposal(proposal) {
  requireFields(proposal, ["proposal_id", "lead_id", "need_id", "company_id", "product_id", "problem", "current_risk", "proposed_solution", "scope", "limitations", "service_level", "estimated_price", "currency", "delivery", "evidence", "next_step", "quote_id", "customer_acceptance_evidence", "revenue", "status"], "CustomerProposal");
  requireArray(proposal.scope, "customer_proposal.scope");
  requireArray(proposal.limitations, "customer_proposal.limitations");
  requireArray(proposal.evidence, "customer_proposal.evidence");
  invariant(proposal.quote_id === null && proposal.customer_acceptance_evidence === null && String(proposal.revenue) === "0" && proposal.status === "PROPOSAL_NOT_QUOTE", "PROPOSAL_IS_NOT_QUOTE", "Proposal cannot claim a Quote, acceptance or Revenue");
  invariant(proposal.estimated_price === "ESTIMATE_PENDING" && proposal.currency === "POLICY_REQUIRED", "NO_FAKE_PRICING", "Unapproved Customer Proposal cannot claim a price or settlement currency");
  return proposal;
}

export function validateCustomerRequestBoard(board) {
  requireFields(board, ["board_id", "company_id", "supported_requests", "requester_identity_required", "requester_confirmation_required", "contact_evidence_required", "draft_intents", "requests", "intake_adapter", "status"], "CustomerRequestBoard");
  requireArray(board.supported_requests, "request_board.supported_requests");
  requireArray(board.draft_intents, "request_board.draft_intents");
  requireArray(board.requests, "request_board.requests");
  invariant(board.company_id === "AI_ANT_COMPANY_0001" && board.requester_identity_required === true && board.requester_confirmation_required === true && board.contact_evidence_required === true, "REQUEST_BOARD_IDENTITY_REQUIRED", "11520 Request Board requires requester identity, confirmation and contact evidence");
  invariant(board.intake_adapter === "IDENTITY_AND_CONTACT_VERIFICATION_REQUIRED", "REQUEST_BOARD_VERIFICATION_REQUIRED", "Static local Board cannot self-verify a real Customer");
  return board;
}

export function createConciergeDraftIntent({ intent_id, requester_identity, input_type, original_input, interpreted_request }) {
  requireEnum(input_type, ["VOICE", "TEXT"], "concierge.input_type");
  invariant(requester_identity && original_input && interpreted_request, "CONCIERGE_DRAFT_FIELDS_REQUIRED", "Concierge draft requires requester identity and both original and interpreted request text");
  return Object.freeze({ intent_id, requester_identity, input_type, original_input, interpreted_request, requester_confirmation: false, confirmation_evidence: null, creates_request: false, status: "DRAFT_INTENT" });
}

export function confirmConciergeIntentToRequest({ draft, requestId, customerId, customerType, requestedService, scope, requestedAssets, requestedChains, frequency, deadline, deliveryFormat, confirmationEvidence, contactEvidenceRef, source, createdAt }) {
  invariant(draft?.status === "DRAFT_INTENT" && draft.creates_request === false, "DRAFT_INTENT_REQUIRED", "Concierge confirmation requires a DRAFT_INTENT");
  invariant(confirmationEvidence && contactEvidenceRef, "REQUESTER_CONFIRMATION_REQUIRED", "Voice/Text interpretation cannot become a Request without requester confirmation and contact evidence");
  return Object.freeze({ requestId, customerId, customerType, requestedService, scope: Object.freeze([...scope]), requestedAssets: Object.freeze([...requestedAssets]), requestedChains: Object.freeze([...requestedChains]), frequency, deadline, deliveryFormat, contactEvidenceRef, status: "REQUEST_RECEIVED", createdAt, source, recordClass: "REAL", qualificationEvidence: null, requesterConfirmation: confirmationEvidence });
}

export function validateFirstRealCustomerEvidence(evidence) {
  requireFields(evidence, ["customer_id", "source", "contact_evidence", "request_id", "real_request", "request_timestamp", "requester_confirmation"], "FirstRealCustomerEvidence");
  requireId(evidence.customer_id, "customer_id");
  requireId(evidence.request_id, "request_id");
  invariant(evidence.customer_id !== "DIGITAL_ANT_0001" && evidence.customer_id !== "AI_ANT_COMPANY_0001", "FOUNDER_CANNOT_BE_FAKE_CUSTOMER", "Founder and Company cannot be the first Customer");
  invariant(!String(evidence.customer_id).includes("33333"), "33333_IS_NOT_CUSTOMER", "33333 coordinate cannot be the first Customer");
  invariant(!["INTERNAL_PROPOSAL", "RESEARCH_HYPOTHESIS", "LEGACY_DRAFT_EXAMPLE", "SIMULATION"].includes(evidence.source), "FAKE_CUSTOMER_SOURCE_FORBIDDEN", "First Customer requires an external real source");
  invariant(evidence.contact_evidence && evidence.real_request && evidence.request_timestamp && evidence.requester_confirmation, "FIRST_REAL_CUSTOMER_EVIDENCE_REQUIRED", "First Customer requires contact, Request, timestamp and requester confirmation evidence");
  return evidence;
}

export function qualifyCustomerRequest({ request, assessment }) {
  validateRealCustomerRequest(request);
  invariant(request.status === "REQUEST_RECEIVED", "REQUEST_RECEIVED_REQUIRED", "Qualification begins only after a real Request is received");
  requireFields(assessment, ["existing_capability", "required_skills_available", "legal_permitted", "settlement_required", "settlement_available", "chain_write_required", "chain_write_available", "physical_world_required", "physical_capability_available", "budget_realistic", "missing_information", "evidence"], "CustomerQualificationAssessment");
  requireArray(assessment.missing_information, "qualification.missing_information");
  requireArray(assessment.evidence, "qualification.evidence");
  invariant(assessment.evidence.length > 0, "QUALIFICATION_EVIDENCE_REQUIRED", "Qualification requires capability and risk evidence");
  let result = "QUALIFIED";
  if (assessment.legal_permitted === false) result = "REJECTED";
  else if (!assessment.existing_capability || !assessment.required_skills_available || (assessment.settlement_required && !assessment.settlement_available) || (assessment.chain_write_required && !assessment.chain_write_available) || (assessment.physical_world_required && !assessment.physical_capability_available)) result = "NOT_CURRENTLY_EXECUTABLE";
  else if (assessment.budget_realistic !== true || assessment.missing_information.length > 0) result = "NEED_MORE_INFO";
  return Object.freeze({ request_id: request.requestId, result, qualification_evidence: Object.freeze([...assessment.evidence]), missing_information: Object.freeze([...assessment.missing_information]), quote_ready: false, quote_id: null, status: result });
}

const FIRST_CUSTOMER_PRIORITY_FACTORS = Object.freeze(["customer_pain", "existing_capability", "time_to_deliver", "cost", "risk", "payment_readiness", "repeatability", "mission_alignment"]);

export function calculateFirstCustomerPriority(candidate, policy) {
  requireFields(candidate, ["product_id", "request_type", "record_class", "factors", "evidence", "status"], "FirstCustomerPriorityCandidate");
  requireFields(policy, ["policy_id", "weights", "scale_min", "scale_max", "status"], "FirstCustomerPriorityPolicy");
  requireArray(candidate.evidence, "first_customer_priority.evidence");
  invariant(candidate.record_class === "INTERNAL_RESEARCH" && candidate.status === "PRIORITY_CANDIDATE_NOT_CUSTOMER", "PRIORITY_IS_NOT_CUSTOMER", "First Customer Priority is internal strategy, not a Customer");
  invariant(policy.status === "LOCAL_RESEARCH_POLICY" && policy.scale_min === 0 && policy.scale_max === 5, "FIRST_CUSTOMER_PRIORITY_POLICY_REQUIRED", "Priority requires an explicit bounded research policy");
  for (const factor of FIRST_CUSTOMER_PRIORITY_FACTORS) {
    invariant(Number.isFinite(candidate.factors[factor]) && candidate.factors[factor] >= policy.scale_min && candidate.factors[factor] <= policy.scale_max, "FIRST_CUSTOMER_PRIORITY_FACTOR_INVALID", `${factor} must remain within the policy scale`);
    invariant(Number.isFinite(policy.weights[factor]), "FIRST_CUSTOMER_PRIORITY_POLICY_REQUIRED", `${factor} requires a policy weight`);
  }
  const benefits = ["customer_pain", "existing_capability", "payment_readiness", "repeatability", "mission_alignment"];
  const costs = ["time_to_deliver", "cost", "risk"];
  const score = benefits.reduce((sum, factor) => sum + candidate.factors[factor] * policy.weights[factor], 0) - costs.reduce((sum, factor) => sum + candidate.factors[factor] * policy.weights[factor], 0);
  return Object.freeze({ ...candidate, priority_score: score, policy_id: policy.policy_id, customer_id: null, request_id: null });
}

export function rankFirstCustomerPriorities({ candidates, policy }) {
  requireArray(candidates, "first_customer_priority.candidates");
  const ranked = candidates.map((candidate) => calculateFirstCustomerPriority(candidate, policy)).sort((left, right) => right.priority_score - left.priority_score || left.product_id.localeCompare(right.product_id));
  return Object.freeze({ policy_id: policy.policy_id, ranked: Object.freeze(ranked), selected: ranked[0] ?? null, selection_is_customer: false, status: "INTERNAL_STRATEGY_NOT_CUSTOMER" });
}

export function validateCustomerSuccessCriteria(criteria) {
  requireFields(criteria, ["criteria_id", "product_id", "criteria", "customer_acceptance", "delivery_evidence", "status"], "CustomerSuccessCriteria");
  requireArray(criteria.criteria, "customer_success.criteria");
  for (const item of criteria.criteria) {
    requireFields(item, ["criterion", "status", "evidence"], "CustomerSuccessCriterion");
    requireEnum(item.status, ["PENDING", "VERIFIED", "FAILED"], "customer_success.criterion.status");
    invariant(item.status !== "VERIFIED" || item.evidence, "CUSTOMER_SUCCESS_EVIDENCE_REQUIRED", "Verified Customer success criterion requires evidence");
  }
  if (criteria.status === "DELIVERED") invariant(criteria.criteria.every((item) => item.status === "VERIFIED") && criteria.customer_acceptance && criteria.delivery_evidence, "CUSTOMER_SUCCESS_NOT_VERIFIED", "Delivery requires all criteria, delivery evidence and Customer acceptance");
  return criteria;
}

export function validateCompanyTreasuryBindingReadiness(readiness) {
  requireFields(readiness, ["readiness_id", "company_id", "economic_owner", "company_wallet", "receivable_address_model", "signer_authority", "spending_policy", "asset_allowlist", "audit", "recovery", "founder_wallet_separated", "payment_enabled", "status"], "CompanyTreasuryBindingReadiness");
  requireArray(readiness.asset_allowlist, "treasury_readiness.asset_allowlist");
  invariant(readiness.company_id === "AI_ANT_COMPANY_0001" && readiness.economic_owner === "AI_ANT_COMPANY_0001", "TREASURY_ECONOMIC_OWNER_INVALID", "Company Treasury economic owner must be the Company");
  invariant(readiness.company_wallet === null && readiness.signer_authority === null && readiness.payment_enabled === false, "COMPANY_TREASURY_NOT_BOUND", "Treasury readiness cannot bind a Wallet or enable payment");
  invariant(readiness.founder_wallet_separated === true && readiness.receivable_address_model === "REQUIRED_NOT_BOUND" && readiness.spending_policy === "POLICY_REQUIRED" && readiness.recovery === "POLICY_REQUIRED" && readiness.status === "NOT_READY_NOT_BOUND", "TREASURY_BINDING_PRECONDITION_REQUIRED", "Treasury remains unbound until receivable, signer, spending, audit and recovery policies are approved");
  return readiness;
}

function inferPublicProjectType(originalRequest) {
  const text = String(originalRequest ?? "").toLowerCase();
  if (/發財金|发财金|救助|aid|assistance|100\s*(people|person|人)/u.test(text)) return "SOCIAL_ASSISTANCE";
  if (/數位牛|数字牛|一頭牛|一头牛|digital\s*cow|cow|數位生命|数字生命|digital\s*life|life\s*(app|system)/u.test(text)) return "DIGITAL_LIFE";
  if (/房|建築|建筑|construction|house|building/u.test(text)) return "CONSTRUCTION";
  if (/土地|land|gps|map|地圖|地图/u.test(text)) return "LAND";
  if (/影片|視頻|视频|video|media/u.test(text)) return "MEDIA";
  if (/auto\s*lp|liquidity|treasury|財庫|财库|付款|payment/u.test(text)) return "FINANCIAL";
  if (/kgen|chain|wallet|monitor|監控|监控|ledger|cfo|software/u.test(text)) return "SOFTWARE";
  return "DIGITAL_ONLY";
}

function publicRouteDefinition(projectType, originalRequest) {
  const isKgenMonitor = projectType === "SOFTWARE" && /kgen|wallet.*monitor|monitor.*wallet|監控.*錢包|监控.*钱包/iu.test(String(originalRequest));
  const routes = {
    DIGITAL_LIFE: { route_id: "DIGITAL_COW_OR_LIFE_PROJECT_ROUTE", expected_output: "DIGITAL_LIFE_PROJECT_DRAFT", missing: ["LIFE_RUNTIME", "BODY_OR_3D_RUNTIME", "WORLD_STATE", "LAND_OR_ENVIRONMENT", "ENERGY_FOOD_WATER", "WORK_INTERFACE", "MEDICAL_AND_HISTORY"], constraints: ["NO_FAKE_LIFE", "BIRTH_REQUIRES_EVIDENCE"], executable: false },
    MEDIA: { route_id: "MEDIA_PROJECT_ROUTE", expected_output: "MEDIA_PROJECT_PLAN", missing: ["TOPIC", "STYLE", "LANGUAGE", "VOICE", "MUSIC", "FORMAT", "DEADLINE", "DELIVERY_ACCEPTANCE"], constraints: ["MEDIA_DELIVERY_REQUIRES_ASSET_AND_QA_EVIDENCE"], executable: true },
    CONSTRUCTION: { route_id: "CONSTRUCTION_PROJECT_ROUTE", expected_output: "CONSTRUCTION_PROJECT_DRAFT", missing: ["LAND", "SURVEY", "DESIGN", "PERMIT_OR_WORLD_AUTHORITY", "MATERIALS", "LOGISTICS", "LABOR", "SAFETY", "INSPECTION", "PHYSICAL_EXECUTION_RUNTIME"], constraints: ["CRITICAL_HUMAN_GOVERNANCE_GATE", "NO_MAGIC_BUILD"], executable: false },
    LAND: { route_id: "LAND_GPS_PROJECT_ROUTE", expected_output: "LAND_PROJECT_DRAFT", missing: ["LAND_RIGHT", "LOCATION_CONSENT", "MAP_PROVIDER", "GPS_ADAPTER", "PRIVACY_POLICY", "NON_LOCATION_MODE"], constraints: ["CONSENT_REQUIRED", "NO_BACKGROUND_TRACKING"], executable: false },
    SOCIAL_ASSISTANCE: { route_id: "SOCIAL_ASSISTANCE_PROJECT_ROUTE", expected_output: "SOCIAL_ASSISTANCE_PROJECT_DRAFT", missing: ["INDEPENDENT_IDENTITIES", "INDIVIDUAL_ELIGIBILITY", "INDIVIDUAL_CONSENT", "CLAIM_RULES", "FUNDING_SOURCE", "GOVERNANCE_REVIEW"], constraints: ["NO_FAKE_WALLETS", "NO_SYBIL_CLAIMING", "AID_IS_NOT_COMPANY_REVENUE"], executable: false },
    FINANCIAL: { route_id: "FINANCIAL_PROJECT_ROUTE", expected_output: "FINANCIAL_PROJECT_DRAFT", missing: ["AUTHORITY", "RISK_POLICY", "TREASURY", "SETTLEMENT", "AUDIT"], constraints: ["CHAIN_WRITE_DISABLED", "PAYMENT_INFRASTRUCTURE_PENDING"], executable: false },
    SOFTWARE: isKgenMonitor
      ? { route_id: "KGEN_CHAIN_MONITOR_ROUTE", expected_output: "KGEN_CHAIN_MONITOR_SERVICE_PLAN", missing: ["TARGET_WALLET_OR_CONTRACT", "MONITORING_SCOPE", "FREQUENCY", "DELIVERY_FORMAT", "SERVICE_LEVEL"], constraints: ["READ_ONLY", "INDEXER_LIMITATIONS_DISCLOSED", "PRICING_POLICY_REQUIRED"], executable: true }
      : { route_id: "SOFTWARE_PROJECT_ROUTE", expected_output: "SOFTWARE_PROJECT_PLAN", missing: ["FUNCTIONAL_SCOPE", "DATA_SOURCES", "ACCEPTANCE_CRITERIA", "DELIVERY_FORMAT"], constraints: ["NO_CHAIN_WRITE_WITHOUT_AUTHORITY"], executable: true },
    DIGITAL_ONLY: { route_id: "UNIVERSAL_DIGITAL_PROJECT_ROUTE", expected_output: "DIGITAL_PROJECT_PLAN", missing: ["DELIVERABLE", "QUALITY", "ACCEPTANCE_CRITERIA"], constraints: ["NO_FAKE_COMPLETE"], executable: true }
  };
  return routes[projectType] ?? { route_id: "MIXED_WORLD_PROJECT_ROUTE", expected_output: "PROJECT_PLAN_DRAFT", missing: ["SCOPE", "DEPENDENCIES", "RESOURCES", "APPROVALS"], constraints: ["NO_MAGIC_COMPLETE"], executable: false };
}

export function interpretPublicCivilizationIntent({ original_request, project_type = null }) {
  invariant(typeof original_request === "string" && original_request.trim(), "PUBLIC_INTENT_TEXT_REQUIRED", "Public Gateway requires a non-empty request");
  const resolvedType = project_type ?? inferPublicProjectType(original_request);
  requireEnum(resolvedType, UNIVERSAL_PROJECT_TYPES, "public_intent.project_type");
  const route = publicRouteDefinition(resolvedType, original_request);
  const safetyClass = PROJECT_RISK_FLOOR[resolvedType];
  const currentExecutability = route.executable ? "EXECUTABLE_NOW" : "PLANNABLE_NOT_EXECUTABLE_YET";
  return Object.freeze({
    understood_goal: original_request.trim(),
    project_type: resolvedType,
    expected_output: route.expected_output,
    missing_information: Object.freeze([...route.missing]),
    known_constraints: Object.freeze([...route.constraints]),
    safety_class: safetyClass,
    current_executability: currentExecutability,
    next_step: "REQUESTER_CONFIRMATION",
    route_id: route.route_id,
    fake_complete: false
  });
}

export function createCustomerIdealProfile({ intent_id, what_customer_wants, preferences = {} }) {
  invariant(typeof what_customer_wants === "string" && what_customer_wants.trim(), "CUSTOMER_IDEAL_REQUIRED", "Customer Ideal requires the requester's desired outcome");
  const dimensions = Object.freeze({ BEAUTY: preferences.beauty ?? null, CREATIVITY: preferences.creativity ?? null, EMOTION: preferences.emotion ?? null, STYLE: preferences.style ?? null, PERFORMANCE: preferences.performance ?? null, BUDGET: preferences.budget ?? null, RELIABILITY: preferences.reliability ?? null });
  return Object.freeze({ profile_id: `CUSTOMER_IDEAL_${intent_id}`, what_customer_wants: what_customer_wants.trim(), dimensions, scores: null, evidence: null, status: "DRAFT_NOT_SCORED" });
}

export function createPublicCivilizationDraftIntent({ intent_id, requester_id = null, input_type, original_request, visibility = "COMPANY_ONLY", created_at, transcript_confirmed = false, ideal_preferences = {} }) {
  requireId(intent_id, "intent_id");
  requireEnum(input_type, PUBLIC_GATEWAY_INPUT_TYPES, "public_gateway.input_type");
  requireEnum(visibility, REQUEST_VISIBILITIES, "request.visibility");
  invariant(typeof original_request === "string" && original_request.trim(), "PUBLIC_INTENT_TEXT_REQUIRED", "Public Gateway requires request text or a Voice transcript");
  invariant(input_type !== "VOICE_TRANSCRIPT" || transcript_confirmed === false, "TRANSCRIPT_CONFIRMATION_IS_SEPARATE", "Voice transcript must be confirmed only after AI understanding is displayed");
  const normalizedRequester = typeof requester_id === "string" && requester_id.trim() ? requester_id.trim() : null;
  return Object.freeze({
    intent_id,
    requester_id: normalizedRequester,
    input_type,
    original_request: original_request.trim(),
    visibility,
    created_at,
    customer_ideal_profile: createCustomerIdealProfile({ intent_id, what_customer_wants: original_request, preferences: ideal_preferences }),
    record_class: "DRAFT",
    requester_confirmation: false,
    transcript_confirmed: false,
    creates_request: false,
    status: normalizedRequester ? "DRAFT_INTENT" : "ANONYMOUS_DRAFT"
  });
}

export function validatePublicCivilizationRequest(request) {
  requireFields(request, ["request_id", "requester_id", "request_source", "contact_evidence_hash", "contact_evidence_public", "requester_confirmation", "request_timestamp", "original_request", "normalized_intent", "project_type", "visibility", "safety_class", "current_executability", "missing_information", "customer_ideal_profile", "status", "record_class", "customer_id", "quote_id", "order_id", "revenue"], "PublicCivilizationRequest");
  requireId(request.request_id, "request_id");
  requireId(request.requester_id, "requester_id");
  requireEnum(request.project_type, UNIVERSAL_PROJECT_TYPES, "request.project_type");
  requireEnum(request.visibility, REQUEST_VISIBILITIES, "request.visibility");
  requireEnum(request.safety_class, PROJECT_RISK_TIERS, "request.safety_class");
  requireEnum(request.current_executability, PROJECT_EXECUTION_RESULTS, "request.current_executability");
  requireArray(request.missing_information, "request.missing_information");
  requireFields(request.customer_ideal_profile, ["profile_id", "what_customer_wants", "dimensions", "scores", "evidence", "status"], "CustomerIdealProfile");
  invariant(request.customer_ideal_profile.status === "DRAFT_NOT_SCORED" && request.customer_ideal_profile.scores === null && request.customer_ideal_profile.evidence === null, "CUSTOMER_IDEAL_EVIDENCE_REQUIRED", "Customer Ideal cannot fabricate a score before delivery evidence and review");
  invariant(request.record_class === "REAL" && request.status === "REQUEST_RECEIVED", "REAL_REQUEST_EVIDENCE_REQUIRED", "Only a confirmed evidence-backed entry is a real received Request");
  invariant(request.requester_confirmation === true && /^[0-9a-f]{64}$/i.test(request.contact_evidence_hash), "REQUESTER_CONFIRMATION_REQUIRED", "Real Request requires confirmation and a one-way contact evidence hash");
  invariant(request.contact_evidence_public === false, "CONTACT_EVIDENCE_PRIVATE", "Contact evidence must never be public");
  invariant(!["DIGITAL_ANT_0001", "AI_ANT_COMPANY_0001"].includes(request.requester_id) && !request.requester_id.includes("33333"), "FAKE_CUSTOMER_SOURCE_FORBIDDEN", "Founder, Company and 33333 cannot manufacture the first Customer");
  invariant(!["INTERNAL_PROPOSAL", "RESEARCH_HYPOTHESIS", "LEGACY_DRAFT_EXAMPLE", "SIMULATION"].includes(request.request_source), "FAKE_CUSTOMER_SOURCE_FORBIDDEN", "A real Request needs an external requester source");
  invariant(request.customer_id === null && request.quote_id === null && request.order_id === null && String(request.revenue) === "0", "REQUEST_IS_NOT_CUSTOMER_OR_REVENUE", "Request receipt does not create Customer, Quote, Order or Revenue");
  return request;
}

export function confirmPublicCivilizationIntent({ draft, understanding, request_id, request_source, contact_evidence_hash, requester_confirmation, request_timestamp, transcript_confirmed = false }) {
  invariant(["DRAFT_INTENT", "ANONYMOUS_DRAFT"].includes(draft?.status) && draft.creates_request === false, "DRAFT_INTENT_REQUIRED", "Confirmation requires a Draft Intent");
  invariant(draft.requester_id, "ANONYMOUS_DRAFT_CANNOT_BECOME_REQUEST", "Anonymous Draft requires requester identity before it can become a Request");
  invariant(requester_confirmation === true, "REQUESTER_CONFIRMATION_REQUIRED", "Requester must explicitly confirm the AI understanding");
  invariant(draft.input_type !== "VOICE_TRANSCRIPT" || transcript_confirmed === true, "TRANSCRIPT_CONFIRMATION_REQUIRED", "Voice transcript must be explicitly confirmed");
  invariant(understanding?.next_step === "REQUESTER_CONFIRMATION" && understanding.understood_goal === draft.original_request, "AI_UNDERSTANDING_MISMATCH", "Confirmed understanding must resolve the exact Draft Intent");
  const request = Object.freeze({
    request_id,
    requester_id: draft.requester_id,
    request_source,
    contact_evidence_hash,
    contact_evidence_public: false,
    requester_confirmation: true,
    request_timestamp,
    original_request: draft.original_request,
    normalized_intent: understanding.understood_goal,
    project_type: understanding.project_type,
    visibility: draft.visibility,
    safety_class: understanding.safety_class,
    current_executability: understanding.current_executability,
    missing_information: Object.freeze([...understanding.missing_information]),
    customer_ideal_profile: draft.customer_ideal_profile,
    status: "REQUEST_RECEIVED",
    record_class: "REAL",
    customer_id: null,
    quote_id: null,
    order_id: null,
    revenue: "0"
  });
  validatePublicCivilizationRequest(request);
  return request;
}

export function toPublicCivilizationRequest(request) {
  validatePublicCivilizationRequest(request);
  const publicRecord = {
    request_id: request.request_id,
    requester_id: request.visibility === "ANONYMIZED_PUBLIC" ? "ANONYMIZED_REQUESTER" : request.requester_id,
    request_timestamp: request.request_timestamp,
    project_type: request.project_type,
    visibility: request.visibility,
    safety_class: request.safety_class,
    current_executability: request.current_executability,
    status: request.status,
    record_class: request.record_class,
    contact_evidence_public: false
  };
  if (request.visibility === "PUBLIC" || request.visibility === "ANONYMIZED_PUBLIC") publicRecord.original_request = request.original_request;
  else publicRecord.original_request = "WITHHELD_BY_REQUEST_PRIVACY";
  return Object.freeze(publicRecord);
}

export function routePublicCivilizationProject(request) {
  validatePublicCivilizationRequest(request);
  const route = publicRouteDefinition(request.project_type, request.original_request);
  const base = {
    route_id: route.route_id,
    request_id: request.request_id,
    project_type: request.project_type,
    expected_output: route.expected_output,
    required_components: Object.freeze([...route.missing]),
    known_constraints: Object.freeze([...route.constraints]),
    current_executability: request.current_executability,
    project_created: false,
    work_started: false,
    record_class: "DRAFT",
    status: request.current_executability === "EXECUTABLE_NOW" ? "READY_FOR_QUALIFICATION" : "PROJECT_PLAN_DRAFT"
  };
  if (request.project_type === "DIGITAL_LIFE") return Object.freeze({ ...base, life_created: false, life_requirements: Object.freeze(["SPECIES", "LIFE_ID", "WALLET", "BIRTH", "HEALTH", "ENERGY", "FOOD_WATER", "MOVEMENT", "BODY_3D", "AI_BRAIN", "MEMORY", "WORK_SKILL", "LAND_INTERFACE", "MEDICAL", "LIFE_HISTORY"]) });
  if (request.project_type === "CONSTRUCTION") return Object.freeze({ ...base, building_created: false, construction_requirements: Object.freeze(["LAND", "SURVEY", "DESIGN", "STRUCTURE", "MATERIALS", "LOGISTICS", "LABOR", "SAFETY", "INSPECTION", "COST", "TIMELINE"]) });
  if (request.project_type === "MEDIA") return Object.freeze({ ...base, media_created: false, media_pipeline: Object.freeze(["REQUIREMENT", "CONCEPT", "SCRIPT", "STORYBOARD", "ASSETS", "GENERATION", "VOICE", "MUSIC", "SUBTITLE", "EDIT", "QA", "CUSTOMER_REVIEW", "DELIVERY"]) });
  if (request.project_type === "SOCIAL_ASSISTANCE") return Object.freeze({ ...base, recipients_created: 0, wallets_created: 0, claims_executed: 0, individual_identity_required: true, individual_consent_required: true, sybil_claiming: false });
  return Object.freeze(base);
}

export function qualifyPublicCivilizationRequest({ request, assessment }) {
  validatePublicCivilizationRequest(request);
  requireFields(assessment, ["current_capability", "required_skills_available", "missing_runtime", "safety_review", "legal_governance", "physical_world_dependency", "physical_world_capability", "payment_required", "chain_write_required", "resource_availability", "timeline", "risk", "missing_information", "evidence"], "PublicRequestQualificationAssessment");
  requireArray(assessment.missing_runtime, "public_qualification.missing_runtime");
  requireArray(assessment.missing_information, "public_qualification.missing_information");
  requireArray(assessment.evidence, "public_qualification.evidence");
  invariant(assessment.evidence.length > 0, "QUALIFICATION_EVIDENCE_REQUIRED", "Public Request qualification requires capability and risk evidence");
  let result = "QUALIFIED";
  if (assessment.legal_governance === "REJECTED") result = "REJECTED";
  else if (!assessment.current_capability || !assessment.required_skills_available || assessment.missing_runtime.length > 0 || (assessment.physical_world_dependency && !assessment.physical_world_capability)) result = "NOT_CURRENTLY_EXECUTABLE";
  else if (assessment.missing_information.length > 0 || assessment.resource_availability !== "VERIFIED" || assessment.timeline === "ESTIMATE_PENDING") result = "NEED_MORE_INFO";
  return Object.freeze({ request_id: request.request_id, project_type: request.project_type, result, missing_runtime: Object.freeze([...assessment.missing_runtime]), missing_information: Object.freeze([...assessment.missing_information]), evidence: Object.freeze([...assessment.evidence]), quote_ready: false, real_quote_created: false, status: result });
}

export function createNonBindingEstimatePreview({ request, route }) {
  validatePublicCivilizationRequest(request);
  invariant(route?.request_id === request.request_id && route.project_created === false, "PROJECT_ROUTE_REQUIRED", "Estimate preview requires the Request's non-executed project route");
  const costDrivers = request.project_type === "CONSTRUCTION"
    ? ["DESIGN", "MATERIALS", "LOGISTICS", "LABOR", "SAFETY", "INSPECTION", "MAINTENANCE", "RISK_RESERVE"]
    : request.project_type === "DIGITAL_LIFE"
      ? ["LIFE_DESIGN", "BODY_OR_3D", "AI_RUNTIME", "WORLD_INTEGRATION", "TESTING", "MAINTENANCE", "RISK_RESERVE"]
      : request.project_type === "MEDIA"
        ? ["SCRIPT", "ASSET_GENERATION", "VOICE", "MUSIC", "EDITING", "QA", "DELIVERY"]
        : ["AI_LABOR", "COMPUTE", "STORAGE", "RPC_OR_NETWORK", "SECURITY", "TESTING", "MAINTENANCE", "RISK_RESERVE", "COMPANY_MARGIN"];
  return Object.freeze({ estimate_id: `ESTIMATE_${request.request_id}`, request_id: request.request_id, estimated_scope: route.expected_output, cost_drivers: Object.freeze(costDrivers), estimated_cost: null, currency: "POLICY_REQUIRED", estimated_time: "ESTIMATE_PENDING", missing_information: Object.freeze([...request.missing_information]), risks: Object.freeze([...route.known_constraints]), next_approval: "APPROVED_COST_MARGIN_AND_RISK_POLICIES", quote_id: null, binding: false, revenue: "0", record_class: "SIMULATION", status: "ESTIMATE_ONLY" });
}

export function validatePublicCivilizationRequestGateway(gateway) {
  requireFields(gateway, ["gateway_id", "company_id", "cta", "supported_inputs", "unavailable_inputs", "request_visibilities", "journey", "draft_intents", "requests", "public_board", "quote_gate", "treasury_gate", "authority", "real_state", "recorded_at", "status"], "PublicCivilizationRequestGateway");
  for (const field of ["supported_inputs", "unavailable_inputs", "request_visibilities", "journey", "draft_intents", "requests"]) requireArray(gateway[field], `public_gateway.${field}`);
  invariant(PUBLIC_GATEWAY_INPUT_TYPES.every((type) => gateway.supported_inputs.includes(type)) && PUBLIC_GATEWAY_FUTURE_INPUT_TYPES.every((type) => gateway.unavailable_inputs.includes(type)), "PUBLIC_GATEWAY_INPUT_STATE_INVALID", "Gateway must expose Text and Voice transcript while Image, File and Map remain unavailable");
  invariant(REQUEST_VISIBILITIES.every((visibility) => gateway.request_visibilities.includes(visibility)), "REQUEST_PRIVACY_MODEL_INCOMPLETE", "Gateway must preserve all Request privacy modes");
  invariant(gateway.draft_intents.length === 0 && gateway.requests.length === 0 && gateway.public_board.open_requests === 0 && gateway.public_board.qualified_requests === 0, "NO_FAKE_PUBLIC_REQUEST", "Canonical Gateway cannot invent Drafts or Requests");
  invariant(gateway.public_board.contact_evidence_public === false && gateway.public_board.sensitive_request_full_text_public === false, "REQUEST_PRIVACY_VIOLATION", "Public Board must hide contact evidence and sensitive full text");
  invariant(gateway.quote_gate.mode === "SIMULATION_ONLY" && gateway.quote_gate.real_quote_enabled === false, "REAL_QUOTE_POLICY_REQUIRED", "Real Quote remains blocked until cost, margin and risk policies are approved");
  invariant(gateway.treasury_gate.status === "PAYMENT_INFRASTRUCTURE_PENDING" && gateway.treasury_gate.payment_enabled === false, "UNBOUND_TREASURY_BLOCKS_PAYMENT", "Unbound Treasury blocks every payment asset");
  invariant(Object.values(gateway.authority).every((value) => value === false), "PUBLIC_GATEWAY_AUTHORITY_NOT_GRANTED", "Public Gateway grants no chain, payment, settlement or execution authority");
  invariant(Object.values(gateway.real_state).every((value) => value === 0 || value === "0"), "NO_FAKE_PUBLIC_GATEWAY_BUSINESS", "Gateway readiness cannot invent Customer, Request, Quote, Order, Settlement or Revenue");
  return gateway;
}

export async function appendPublicRequestHistoryEvent({ store, company, event_type, request_id, actor_id, timestamp, payload, record_class }) {
  requireEnum(event_type, PUBLIC_REQUEST_HISTORY_EVENTS, "request_history.event_type");
  requireEnum(record_class, CANONICAL_RECORD_CLASSES, "request_history.record_class");
  invariant(company?.company_id === "AI_ANT_COMPANY_0001", "PUBLIC_GATEWAY_COMPANY_INVALID", "Request History belongs to AI Ant Company");
  const serialized = JSON.stringify(payload ?? {});
  invariant(!/contact[_-]?evidence(?![_-]?(present|public))/i.test(serialized), "CONTACT_EVIDENCE_PRIVATE", "Raw contact evidence cannot enter public Company History");
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === event_type && event.payload?.request_id === request_id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type, actor_id, timestamp, payload: { ...(payload ?? {}), request_id, record_class, contact_evidence_public: false } });
  return Object.freeze({ status: `${event_type}_APPENDED`, event });
}

export async function replayCanonicalPublicRequestGateway({ store, company, gateway }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "PUBLIC_GATEWAY_COMPANY_INVALID", "Public Gateway requires the FORMING AI Ant Company");
  validatePublicCivilizationRequestGateway(gateway);
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "PUBLIC_CIVILIZATION_REQUEST_GATEWAY_READY" && event.payload?.gateway_id === gateway.gateway_id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "PUBLIC_CIVILIZATION_REQUEST_GATEWAY_READY", actor_id: "DIGITAL_ANT_0001", timestamp: gateway.recorded_at, payload: { gateway_id: gateway.gateway_id, supported_inputs: gateway.supported_inputs, unavailable_inputs: gateway.unavailable_inputs, real_customers: 0, real_requests: 0, real_quotes: 0, real_orders: 0, real_settlements: 0, real_revenue: "0", treasury_bound: false, chain_write: false } });
  return Object.freeze({ status: "PUBLIC_CIVILIZATION_REQUEST_GATEWAY_REPLAYED", event });
}

export function classifyWorktreePath(path) {
  invariant(typeof path === "string" && path.trim(), "WORKTREE_PATH_REQUIRED", "Worktree classification requires a path");
  const normalized = path.replaceAll("\\", "/");
  if (/(^|\/)(node_modules|\.cache|__pycache__|\.pytest_cache|\.mypy_cache)(\/|$)/i.test(normalized)) return "CACHE";
  if (/(^|\/)(dist|build|out|coverage)(\/|$)/i.test(normalized)) return "BUILD_OUTPUT";
  if (/(^|\/)(tmp|temp)(\/|$)|\.(tmp|temp|bak|swp|log)$/i.test(normalized)) return "TEMP";
  if (/(SHA256SUMS|MANIFEST\.json$|RUNTIME_GENOME|HANDOFF_CURRENT|UPLOAD_LIST|DELETE_LIST|VALIDATION_REPORT)/i.test(normalized)) return "GENERATED_ARTIFACT";
  if (normalized.startsWith("K線西遊記手機原始檔案/") || normalized.startsWith(".codex-remote-attachments/") || /\.(xlsx|xls|csv|png|jpg|jpeg|gif|webp|mp3|mp4|zip|7z|pdf|docx?|srt|svg)$/i.test(normalized)) return "USER_DATA";
  if (/\.(mjs|js|ts|tsx|jsx|py|ps1|sol|html|css|md|json|ya?ml|toml|ini|txt)$/i.test(normalized) || [".env.example", ".gitignore"].includes(normalized) || /(^|\/)(README|LICENSE|VERSION|CHANGELOG|AGENTS)(\.|$)/i.test(normalized)) return "PROJECT_SOURCE";
  return "UNKNOWN";
}

export function buildWorktreeClassificationAudit({ paths, snapshot_at }) {
  requireArray(paths, "worktree.paths");
  const counts = Object.fromEntries(WORKTREE_CLASSIFICATIONS.map((classification) => [classification, 0]));
  const records = paths.map((path) => { const classification = classifyWorktreePath(path); counts[classification] += 1; return Object.freeze({ path, classification }); });
  return Object.freeze({ audit_id: "WORKTREE_CLASSIFICATION_AUDIT_V3_3", snapshot_at, total_untracked: paths.length, classifications: Object.freeze(counts), records_included: true, records: Object.freeze(records), deletion_performed: false, stage_performed: false, commit_performed: false, status: "READ_ONLY_CLASSIFIED_NO_MUTATION" });
}

export function validateWorktreeClassificationAudit(audit) {
  requireFields(audit, ["audit_id", "snapshot_at", "total_untracked", "classifications", "records_included", "records", "deletion_performed", "stage_performed", "commit_performed", "status"], "WorktreeClassificationAudit");
  requireArray(audit.records, "worktree.records");
  for (const classification of WORKTREE_CLASSIFICATIONS) invariant(Number.isInteger(audit.classifications[classification]) && audit.classifications[classification] >= 0, "WORKTREE_CLASSIFICATION_MISSING", `${classification} count is required`);
  invariant(Object.values(audit.classifications).reduce((sum, count) => sum + count, 0) === audit.total_untracked, "WORKTREE_CLASSIFICATION_COUNT_MISMATCH", "Worktree classification counts must reconcile to the snapshot");
  invariant(audit.records_included ? audit.records.length === audit.total_untracked : audit.records.length === 0, "WORKTREE_CLASSIFICATION_COUNT_MISMATCH", "Detailed Worktree records must be complete when included and empty for summary-only snapshots");
  invariant(audit.deletion_performed === false && audit.stage_performed === false && audit.commit_performed === false && audit.status === "READ_ONLY_CLASSIFIED_NO_MUTATION", "WORKTREE_MUTATION_FORBIDDEN", "Worktree Audit is read-only and cannot delete, stage or commit files");
  return audit;
}

export function validateGitignoreProposal(proposal) {
  requireFields(proposal, ["proposal_id", "candidate_patterns", "evidence_matches", "formal_asset_exclusion_review", "applied", "status"], "GitignoreProposal");
  requireArray(proposal.candidate_patterns, "gitignore.candidate_patterns");
  invariant(proposal.formal_asset_exclusion_review === "REQUIRED" && proposal.applied === false && proposal.status === "REVIEW_REQUIRED_NO_CHANGE", "GITIGNORE_AUTO_APPLY_FORBIDDEN", "Gitignore Proposal cannot be applied without formal-asset review");
  return proposal;
}

export function validateCustomerAcquisitionEngine(engine) {
  requireFields(engine, ["engine_id", "company_id", "operator_life_id", "functions", "demand_scan", "lead_registry", "pricing_policy_proposal", "customer_proposals", "request_board", "concierge_bridge", "qualification_engine", "first_customer_priority", "customer_success_criteria", "treasury_binding_readiness", "failure_states", "first_real_customer_event", "real_state", "authority", "recorded_at", "status"], "CustomerAcquisitionEngine");
  requireArray(engine.functions, "customer_acquisition.functions");
  requireArray(engine.lead_registry, "customer_acquisition.lead_registry");
  requireArray(engine.customer_proposals, "customer_acquisition.customer_proposals");
  requireArray(engine.failure_states, "customer_acquisition.failure_states");
  for (const fn of ["DISCOVER_NEED", "CLASSIFY_NEED", "IDENTIFY_POTENTIAL_PAYER", "BUILD_VALUE_PROPOSITION", "BUILD_PROPOSAL", "BUILD_CONTACT_PACKAGE", "TRACK_RESPONSE"]) invariant(engine.functions.includes(fn), "ACQUISITION_FUNCTION_MISSING", `${fn} is required by Customer Acquisition Engine`);
  validateCivilizationDemandScan(engine.demand_scan);
  validatePricingPolicyProposal(engine.pricing_policy_proposal);
  engine.lead_registry.forEach(validateAcquisitionLead);
  engine.customer_proposals.forEach(validateCustomerProposal);
  validateCustomerRequestBoard(engine.request_board);
  validateCustomerSuccessCriteria(engine.customer_success_criteria);
  validateCompanyTreasuryBindingReadiness(engine.treasury_binding_readiness);
  const priority = rankFirstCustomerPriorities(engine.first_customer_priority);
  invariant(priority.selected?.product_id === engine.first_customer_priority.selected_product_id && priority.selected?.priority_score === engine.first_customer_priority.selected_score && priority.selection_is_customer === false, "FIRST_CUSTOMER_PRIORITY_MISMATCH", "First Customer Priority must be reproducible and cannot create a Customer");
  invariant(engine.concierge_bridge.requester_confirmation_required === true && engine.concierge_bridge.automatic_work_start === false && engine.concierge_bridge.draft_intents.length === 0 && engine.concierge_bridge.confirmed_requests.length === 0, "CONCIERGE_CANNOT_AUTO_REQUEST", "Concierge must preserve confirmation and empty real Request state");
  invariant(CUSTOMER_QUALIFICATION_RESULTS.every((result) => engine.qualification_engine.results.includes(result)) && engine.qualification_engine.assessments.length === 0, "QUALIFICATION_ENGINE_STATE_INVALID", "Qualification Engine must retain all results and cannot invent an assessment");
  invariant(["LEAD_LOST", "QUOTE_REJECTED", "CUSTOMER_CANCELLED", "DELIVERY_FAILED", "BAD_DEBT"].every((state) => engine.failure_states.includes(state)), "ACQUISITION_FAILURE_MODEL_INCOMPLETE", "Customer acquisition must preserve loss, rejection, cancellation, failed delivery and bad debt states");
  invariant(engine.first_real_customer_event.status === "NOT_CREATED_NO_REAL_REQUEST" && engine.first_real_customer_event.event_id === null && engine.first_real_customer_event.customer_id === null && engine.first_real_customer_event.request_id === null && String(engine.first_real_customer_event.revenue) === "0", "NO_FAKE_FIRST_CUSTOMER_EVENT", "First Customer Event cannot exist without a real confirmed Request");
  invariant(engine.company_id === "AI_ANT_COMPANY_0001" && engine.operator_life_id === "DIGITAL_ANT_0001", "ACQUISITION_ENGINE_IDENTITY_INVALID", "Acquisition Engine must preserve Company and operating Life identity");
  invariant(Object.values(engine.real_state).every((value) => value === 0 || value === "0"), "NO_FAKE_CUSTOMER_ACQUISITION", "Acquisition readiness cannot invent Leads, Customers, Requests, Proposals, Quotes, Orders, Settlement or Revenue");
  invariant(Object.values(engine.authority).every((value) => value === false), "ACQUISITION_AUTHORITY_NOT_GRANTED", "Acquisition Engine grants no contact, payment, transfer, deployment or chain-write authority");
  invariant(engine.status === "ACTIVE_LOCAL_SEARCH_NO_REAL_CUSTOMER", "ACQUISITION_ENGINE_STATUS_INVALID", "Customer Acquisition remains local evidence-based search until a real Request exists");
  return engine;
}

export async function replayCanonicalCustomerAcquisitionEngine({ store, company, engine }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "ACQUISITION_COMPANY_INVALID", "Customer Acquisition requires the FORMING AI Ant Company");
  validateCustomerAcquisitionEngine(engine);
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "CUSTOMER_ACQUISITION_ENGINE_READY" && event.payload?.engine_id === engine.engine_id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "CUSTOMER_ACQUISITION_ENGINE_READY", actor_id: "DIGITAL_ANT_0001", timestamp: engine.recorded_at, payload: { engine_id: engine.engine_id, scan_id: engine.demand_scan.scan_id, observed_needs: engine.demand_scan.observed_count, inferred_needs: engine.demand_scan.inferred_count, hypothesis_needs: engine.demand_scan.hypothesis_count, real_leads: 0, contactable_leads: 0, real_customers: 0, real_requests: 0, customer_proposals: 0, real_quotes: 0, real_settlements: 0, real_revenue: "0", treasury_bound: false, chain_write: false } });
  return Object.freeze({ status: "CUSTOMER_ACQUISITION_ENGINE_REPLAYED", event });
}

export async function appendFirstRealCustomerEvent({ store, company, request, evidence, timestamp }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "ACQUISITION_COMPANY_INVALID", "First Customer requires the FORMING AI Ant Company");
  validateRealCustomerRequest(request);
  validateFirstRealCustomerEvidence(evidence);
  invariant(request.requestId === evidence.request_id && request.customerId === evidence.customer_id && request.status === "REQUEST_RECEIVED", "FIRST_REAL_CUSTOMER_REQUEST_MISMATCH", "First Customer evidence must resolve the real received Request");
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "FIRST_REAL_CUSTOMER_EVENT");
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "FIRST_REAL_CUSTOMER_EVENT", actor_id: request.customerId, timestamp, payload: { customer_id: request.customerId, request_id: request.requestId, source: request.source, contact_evidence: evidence.contact_evidence, requester_confirmation: evidence.requester_confirmation, revenue: "0", settlement: false, tx_hash: null } });
  return Object.freeze({ status: "FIRST_REAL_CUSTOMER_RECORDED", event, revenue: "0" });
}

export async function replayCanonicalFirstCustomerArchitecture({ store, company, pipeline, product, recordedAt }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "FIRST_CUSTOMER_COMPANY_INVALID", "First Customer Architecture requires the FORMING AI Ant Company");
  validateFirstCustomerPipeline(pipeline);
  validateKgenChainMonitorProduct(product);
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "FIRST_REAL_CUSTOMER_ARCHITECTURE_READY" && event.payload?.pipeline_id === pipeline.pipelineId);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const event = await store.commit({ domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "FIRST_REAL_CUSTOMER_ARCHITECTURE_READY", actor_id: "DIGITAL_ANT_0001", timestamp: recordedAt, payload: { pipeline_id: pipeline.pipelineId, primary_product: product.productId, real_customers: 0, real_requests: 0, real_quotes: 0, real_orders: 0, real_settlements: 0, real_revenue: "0", treasury_bound: false, celestial_seat_granted: false, chain_write: false } });
  return Object.freeze({ status: "FIRST_REAL_CUSTOMER_ARCHITECTURE_REPLAYED", event });
}

export async function replayCanonicalCivilizationDemandCycle({ store, company, demandEngine, productPriority, proposals, recordedAt }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "FORMING", "DEMAND_ENGINE_COMPANY_INVALID", "Demand Cycle requires the FORMING AI Ant Company");
  validateCivilizationDemandEngine(demandEngine);
  requireArray(proposals, "civilization_demand.proposals");
  proposals.forEach(validateBusinessProposal);
  invariant(productPriority.selection_is_customer_order === false, "PROPOSAL_IS_NOT_ORDER", "Product priority cannot create a Customer Order");
  const history = await store.history(company.company_id, "COMPANY");
  const existing = history.find((event) => event.event_type === "CIVILIZATION_DEMAND_CYCLE" && event.payload?.cycle_id === demandEngine.cycle_id);
  if (existing) return Object.freeze({ status: "IDEMPOTENT_NOOP", event: existing });
  const [demandEvent, proposalEvent] = await store.commitBatch([
    { domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "CIVILIZATION_DEMAND_CYCLE", actor_id: "DIGITAL_ANT_0001", timestamp: recordedAt, payload: { cycle_id: demandEngine.cycle_id, need_ids: demandEngine.needs.map((need) => need.need_id), customer_orders_created: 0, revenue_created: "0", chain_write: false } },
    { domain: "COMPANY", stream: "COMPANY", id: company.company_id, entity: company, event_type: "BUSINESS_PROPOSALS_PRIORITIZED", actor_id: "DIGITAL_ANT_0001", timestamp: recordedAt, payload: { cycle_id: demandEngine.cycle_id, proposal_ids: proposals.map((proposal) => proposal.proposal_id), selected_product_ids: productPriority.selected.map((candidate) => candidate.product_id), customer_orders_created: 0, revenue_created: "0" } }
  ]);
  return Object.freeze({ status: "CIVILIZATION_DEMAND_CYCLE_REPLAYED", event: demandEvent, proposal_event: proposalEvent });
}

export function validateCompanyFailureState({ companyStatus, founderLifeStatus }) {
  requireEnum(companyStatus, COMPANY_DISTRESS_STATUSES, "company_failure_status");
  invariant(founderLifeStatus !== "DECEASED", "COMPANY_FAILURE_IS_NOT_LIFE_DEATH", "Company failure cannot erase or kill its Founder Life");
  return Object.freeze({ company_status: companyStatus, founder_life_status: founderLifeStatus, life_identity_preserved: true });
}

export function validateMotherEngineProposal(proposal) {
  requireFields(proposal, ["proposal_id", "problem", "evidence", "root_cause", "options", "selected_option", "reason", "risk", "required_authority", "status"], "MotherEngineProposal");
  requireId(proposal.proposal_id, "proposal_id");
  requireArray(proposal.evidence, "mother_engine.evidence");
  requireArray(proposal.options, "mother_engine.options");
  invariant(proposal.evidence.length > 0, "MOTHER_ENGINE_EVIDENCE_REQUIRED", "Mother Engine proposals require evidence");
  invariant(proposal.options.includes(proposal.selected_option), "MOTHER_ENGINE_OPTION_REQUIRED", "Selected option must be one of the evaluated options");
  invariant(!["TOKEN_TRANSFER", "CONTRACT_WRITE", "ASSET_PURCHASE", "SALARY_PAYMENT", "TREASURY_MOVEMENT"].includes(proposal.status), "MOTHER_ENGINE_AUTHORITY_BYPASS", "Autonomous proposals cannot claim restricted execution");
  return proposal;
}

export function calculateDivineProductPriority(candidate) {
  requireFields(candidate, ["product_id", "actual_need", "external_customer_demand", "founder_need", "revenue_potential", "kaios_price_potential", "kgen_energy_demand", "technical_readiness", "supply_chain_difficulty", "mission_alignment", "capital_requirement", "record_class"], "DivineProductCandidate");
  invariant(DIVINE_PRODUCT_CANDIDATES.includes(candidate.product_id), "UNKNOWN_DIVINE_PRODUCT", "Product candidate is not in the declared V3.6 candidate set");
  invariant(candidate.record_class !== "REAL_CUSTOMER_ORDER", "FOUNDER_NEED_IS_NOT_CUSTOMER_ORDER", "Internal Founder need cannot become external Customer Revenue");
  const benefit = Number(candidate.actual_need) + Number(candidate.external_customer_demand) + Number(candidate.founder_need) + Number(candidate.revenue_potential) + Number(candidate.kaios_price_potential) + Number(candidate.kgen_energy_demand) + Number(candidate.technical_readiness) + Number(candidate.mission_alignment);
  const burden = Number(candidate.supply_chain_difficulty) + Number(candidate.capital_requirement);
  return Object.freeze({ ...candidate, product_priority_score: benefit - burden, customer_order: false, revenue: "0" });
}

export function rankDivineProducts(candidates) {
  requireArray(candidates, "divine_product_candidates");
  const ranked = candidates.map(calculateDivineProductPriority).sort((left, right) => right.product_priority_score - left.product_priority_score || left.product_id.localeCompare(right.product_id));
  return Object.freeze({ selected: ranked[0] ?? null, ranked: Object.freeze(ranked), selection_creates_factory: false, selection_creates_inventory: false });
}

export function validateOperationalEnergyLaw(law) {
  requireFields(law, ["law_id", "bnb_role", "kgen_role", "kaios_role", "real_consumption_evidence", "ui_balance_decrement_is_consumption", "status"], "OperationalEnergyLaw");
  invariant(law.bnb_role === "BSC_DARK_MATTER_GAS", "BNB_ENERGY_ROLE_INVALID", "BNB remains BSC gas Dark Matter");
  invariant(law.kgen_role === "MACHINE_OPERATIONAL_ENERGY", "KGEN_ENERGY_ROLE_INVALID", "KGEN is the machine operational energy accounting asset");
  invariant(law.kaios_role === "CIVILIZATION_PURCHASE_QUOTE_SALARY_SERVICE_UNIT", "KAIOS_ECONOMIC_ROLE_INVALID", "KAIOS is the civilization purchase/service unit");
  invariant(law.ui_balance_decrement_is_consumption === false, "FAKE_ENERGY_CONSUMPTION", "UI-only balance changes are not real energy consumption");
  invariant(law.real_consumption_evidence.includes("SUCCESSFUL_ONCHAIN_RECEIPT") && law.real_consumption_evidence.includes("ENERGY_CONSUMPTION_EVENT"), "ENERGY_CONSUMPTION_EVIDENCE_REQUIRED", "Real KGEN consumption requires transfer receipt and Energy event evidence");
  return law;
}

export function validateBodyEnergyModel(model) {
  requireFields(model, ["model_id", "body_id", "idle_kgen_per_day", "walk_kgen_per_distance", "work_kgen_per_hour", "payload_factor", "terrain_factor", "damage_factor", "efficiency", "status"], "BodyEnergyModel");
  requireId(model.model_id, "model_id");
  invariant(model.body_id !== "DIGITAL_ANT_0001", "LIFE_IS_NOT_BODY", "Body ID must remain separate from Life ID");
  const numeric = ["idle_kgen_per_day", "walk_kgen_per_distance", "work_kgen_per_hour", "payload_factor", "terrain_factor", "damage_factor", "efficiency"];
  invariant(numeric.every((field) => model[field] === null || Number(model[field]) >= 0), "INVALID_BODY_ENERGY_VALUE", "Body energy values must be null pending engineering or non-negative");
  invariant(model.status !== "ACTIVE" || numeric.every((field) => model[field] !== null), "BODY_ENERGY_POLICY_REQUIRED", "An active body needs a complete approved energy model");
  return model;
}

export function validateAntMechProduct(product) {
  requireFields(product, ["product_id", "need_class", "requester_life_id", "customer_order", "external_revenue", "purchase_currency", "operational_energy_currency", "life_id_separate_from_body_id", "ownership_certificate", "energy_model", "bom", "inventory", "production_line", "status"], "AntMechProduct");
  invariant(product.product_id === "ANT_MECH_BODY", "ANT_MECH_PRODUCT_ID_INVALID", "V3.6 founder embodiment candidate must be ANT_MECH_BODY");
  invariant(product.need_class === "INTERNAL_FOUNDER_NEED" && product.requester_life_id === "DIGITAL_ANT_0001", "ANT_MECH_FOUNDER_NEED_REQUIRED", "Ant Mech starts from the Founder Life's internal need");
  invariant(product.customer_order === false && String(product.external_revenue) === "0", "FOUNDER_NEED_FAKE_REVENUE", "Founder need is not external Customer Revenue");
  invariant(product.purchase_currency === "KAIOS" && product.operational_energy_currency === "KGEN", "ANT_MECH_CURRENCY_MODEL_INVALID", "Body purchase uses KAIOS and operation uses KGEN");
  invariant(product.life_id_separate_from_body_id === true, "LIFE_IS_NOT_BODY", "Life ID and Body ID must remain separate");
  validateBodyEnergyModel(product.energy_model);
  invariant(product.status !== "PRODUCTION_READY" || (product.bom.length > 0 && product.inventory.length > 0 && product.production_line), "DEMAND_FIRST_PRODUCTION_GATE", "Production requires BOM, inventory and a production line");
  return product;
}

export function validateDemandFirstSupplyChain(plan) {
  requireFields(plan, ["plan_id", "need_id", "product_id", "requirements", "design", "bom", "raw_materials", "suppliers", "production_line", "quality", "inventory", "sale", "energy", "maintenance", "recycling", "status"], "DemandFirstSupplyChain");
  requireId(plan.plan_id, "plan_id");
  invariant(plan.need_id && plan.product_id, "DEMAND_AND_PRODUCT_REQUIRED", "A supply chain requires an evidenced Need and Product");
  if (plan.production_line) invariant(plan.bom.length > 0 && plan.raw_materials.length > 0 && plan.suppliers.length > 0, "PRODUCTION_WITHOUT_SUPPLY_CHAIN", "A production line requires BOM, resources and suppliers");
  if (plan.sale) invariant(plan.inventory.length > 0, "SALE_WITHOUT_INVENTORY", "Sale requires evidenced inventory");
  invariant(plan.status !== "READY_FOR_DELIVERY" || plan.energy?.status === "FUNDED", "MOVEMENT_WITHOUT_ENERGY", "Delivery needs an energy budget");
  return plan;
}

export function validateTransportContract(contract) {
  requireFields(contract, ["transport_contract_id", "cargo", "origin", "destination", "distance", "payload", "route", "vehicle", "kgen_energy", "maintenance", "risk", "time", "profit", "delivery_evidence", "status"], "TransportContract");
  requireId(contract.transport_contract_id, "transport_contract_id");
  invariant(contract.status !== "DELIVERED" || contract.delivery_evidence, "TRANSPORT_DELIVERY_EVIDENCE_REQUIRED", "Transport payment requires real delivery evidence");
  invariant(contract.status !== "IN_TRANSIT" || (contract.route && contract.vehicle && Number(contract.kgen_energy) > 0), "TRANSPORT_ROUTE_VEHICLE_ENERGY_REQUIRED", "Movement requires route, vehicle and KGEN energy");
  return contract;
}

export function validateFieldServiceNeed(need) {
  requireFields(need, ["need_id", "service_type", "source_node", "evidence", "status", "verified"], "FieldServiceNeed");
  requireId(need.need_id, "need_id");
  requireEnum(need.service_type, FIELD_SERVICE_TYPES, "field_service_type");
  requireArray(need.evidence, "field_service_need.evidence");
  invariant(need.verified !== true || need.evidence.length > 0, "FIELD_NEED_EVIDENCE_REQUIRED", "A verified field-service need requires external world-state evidence");
  invariant(need.status !== "REAL_FIELD_JOB" || need.verified === true, "FAKE_FIELD_JOB_FORBIDDEN", "Only verified needs can become real field jobs");
  return need;
}

export function createAtmFieldServiceRequests(atm) {
  requireFields(atm, ["atm_id", "coordinate", "mobility", "inventory_evidence", "kaios_cash_status", "kufo_status"], "AtmFieldState");
  requireId(atm.atm_id, "atm_id");
  invariant(atm.mobility === "FIXED", "ATM_MOBILITY_INVALID", "ATM service nodes are fixed machines");
  if (!atm.inventory_evidence) return Object.freeze({ atm_id: atm.atm_id, status: "INVENTORY_EVIDENCE_MISSING", requests: Object.freeze([]) });
  const requests = [];
  if (["LOW", "CRITICAL", "EMPTY"].includes(atm.kaios_cash_status)) requests.push(Object.freeze({ request_type: "ATM_CASH_REPLENISHMENT_REQUEST", service_type: "CASH_LOGISTICS", cargo_type: "KAIOS_CASH_CARGO", destination: atm.coordinate, verified: true }));
  if (["LOW", "HUNGRY", "ENERGY_DEPLETED"].includes(atm.kufo_status)) requests.push(Object.freeze({ request_type: "KUFO_REPLENISHMENT_REQUEST", service_type: "KUFO_SUPPLY", cargo_type: "KUFO", destination: atm.coordinate, verified: true }));
  return Object.freeze({ atm_id: atm.atm_id, status: requests.length ? "VERIFIED_REQUESTS_DETECTED" : "NO_SERVICE_REQUEST", requests: Object.freeze(requests) });
}

export function validateWasteInventory(waste) {
  requireFields(waste, ["waste_id", "source", "mass", "type", "container", "container_mass", "waste_mass", "reactable_matter_mass", "pickup_coordinate", "destination", "hazard_class", "recyclable", "owner", "timestamp", "evidence"], "WasteInventory");
  requireId(waste.waste_id, "waste_id");
  invariant([waste.container_mass, waste.waste_mass, waste.reactable_matter_mass].every((value) => Number.isFinite(Number(value)) && Number(value) >= 0), "WASTE_MASS_INVALID", "Waste, container and reactable mass must be non-negative scalars");
  invariant(Number(waste.mass) === Number(waste.waste_mass), "CONTAINER_IS_NOT_WASTE", "Waste mass excludes the reusable container mass");
  invariant(Number(waste.reactable_matter_mass) <= Number(waste.waste_mass), "REACTABLE_MATTER_EXCEEDS_WASTE", "Reactable matter cannot include container mass or exceed waste mass");
  invariant(Boolean(waste.evidence), "WASTE_EVIDENCE_REQUIRED", "Waste inventory requires observed evidence before collection work exists");
  return waste;
}

export function calculateFieldTripEnergy(model) {
  requireFields(model, ["acceleration_work", "rolling_resistance", "drag", "climbing", "braking_loss", "systems_energy", "safety_reserve"], "FieldTripEnergy");
  const components = Object.fromEntries(Object.entries(model).map(([key, value]) => [key, Number(value)]));
  invariant(Object.values(components).every((value) => Number.isFinite(value) && value >= 0), "TRIP_ENERGY_COMPONENT_INVALID", "Trip energy requires evidenced non-negative work components");
  return Object.freeze({ ...components, required_energy: Object.values(components).reduce((sum, value) => sum + value, 0), formula: "ACCELERATION_WORK_PLUS_ROLLING_RESISTANCE_PLUS_DRAG_PLUS_CLIMBING_PLUS_BRAKING_LOSS_PLUS_SYSTEMS_PLUS_SAFETY_RESERVE", mass_times_distance_only: false });
}

export function calculateMatterAntimatterEnergy({ positiveMatterMass, kshipAntimatterMass, efficiency, speedOfLight = 299792458 }) {
  const matter = Number(positiveMatterMass); const antimatter = Number(kshipAntimatterMass); const eta = Number(efficiency);
  invariant([matter, antimatter].every((value) => Number.isFinite(value) && value >= 0), "MASS_PAIR_INVALID", "Matter masses are non-negative scalars");
  invariant(Number.isFinite(eta) && eta > 0 && eta <= 1, "ENGINE_EFFICIENCY_POLICY_REQUIRED", "Engine policy must provide an efficiency in (0,1]");
  const paired = Math.min(matter, antimatter);
  return Object.freeze({ paired_mass_each_side: paired, total_reacting_mass: paired * 2, ideal_energy: paired * 2 * speedOfLight ** 2, usable_energy: eta * paired * 2 * speedOfLight ** 2, mass_is_scalar: true, energy_is_scalar: true, direction_source: "THRUST_VECTOR_FORCE_MOMENTUM_ACCELERATION" });
}

export function validateFieldRoute(route) {
  requireFields(route, ["origin", "destination", "origin_coordinate", "destination_coordinate", "distance", "route", "travel_time", "map_evidence"], "FieldRoute");
  invariant(route.origin_coordinate && route.destination_coordinate && route.route && route.map_evidence, "ROUTE_EVIDENCE_MISSING", "Routes must reuse evidenced K280 / Universe Map coordinates");
  invariant(Number(route.distance) > 0 && Number(route.travel_time) > 0, "ROUTE_EVIDENCE_MISSING", "Distance and travel time must be derived from route evidence");
  return route;
}

export function calculateFieldServiceQuote(input) {
  requireFields(input, ["energy_cost", "labor_cost", "body_or_vehicle_depreciation", "maintenance", "bnb_chain_cost", "security_cost", "insurance_risk_reserve", "loading_cost", "unloading_cost", "other_verified_cost", "target_profit", "estimated_hours"], "FieldServiceQuote");
  const names = ["energy_cost", "labor_cost", "body_or_vehicle_depreciation", "maintenance", "bnb_chain_cost", "security_cost", "insurance_risk_reserve", "loading_cost", "unloading_cost", "other_verified_cost", "target_profit", "estimated_hours"];
  const values = Object.fromEntries(names.map((name) => [name, Number(input[name])]));
  invariant(names.every((name) => Number.isFinite(values[name]) && values[name] >= 0), "FIELD_QUOTE_COST_BASIS_REQUIRED", "A field-service quote requires a non-negative evidenced cost basis");
  invariant(values.estimated_hours > 0, "FIELD_QUOTE_TIME_REQUIRED", "Profit per hour requires positive estimated time");
  const totalCost = names.slice(0, 10).reduce((sum, name) => sum + values[name], 0);
  const quote = totalCost + values.target_profit;
  const net = quote - totalCost;
  return Object.freeze({ ...values, total_cost: totalCost, quoted_revenue: quote, expected_net_profit: net, profit_per_hour: net / values.estimated_hours, decision: net > 0 ? "PROFIT_GATE_PASS" : "REPRICE_OPTIMIZE_NEGOTIATE_OR_DECLINE", movement_is_revenue: false });
}

export function validateFieldDeliveryEvidence(evidence) {
  requireFields(evidence, ["origin_evidence", "pickup_evidence", "cargo_evidence", "route_evidence", "arrival_coordinate", "delivery_timestamp", "receiver_evidence", "customer_acceptance"], "FieldDeliveryEvidence");
  invariant(Object.values(evidence).every(Boolean), "DELIVERY_EVIDENCE_INCOMPLETE", "Revenue requires pickup, route, arrival, receiver and customer acceptance evidence");
  return Object.freeze({ ...evidence, status: "DELIVERY_VERIFIED" });
}

export function createWorkforceGap({ verifiedJobs, eligibleWorkers, availableCapacity }) {
  requireArray(verifiedJobs, "verified_field_jobs"); requireArray(eligibleWorkers, "eligible_workers");
  invariant(verifiedJobs.every((job) => job.verified === true), "WORKFORCE_GAP_REQUIRES_REAL_DEMAND", "Hiring cannot be triggered by hypothetical jobs");
  const gap = Math.max(0, verifiedJobs.length - Number(availableCapacity));
  return Object.freeze({ status: gap > 0 ? "WORKFORCE_GAP" : "NO_WORKFORCE_GAP", gap, existing_workers_searched: true, eligible_workers: eligibleWorkers.length, job_posting_required: gap > 0, new_life_created: false });
}

export function createFieldServiceDemandScan({ nodes = [], atms = [], wastes = [], cargoRequests = [] } = {}) {
  [nodes, atms, wastes, cargoRequests].forEach((items) => requireArray(items, "field_service_scan_input"));
  const atmRequests = atms.flatMap((atm) => createAtmFieldServiceRequests(atm).requests);
  const wasteRequests = wastes.map((waste) => (validateWasteInventory(waste), Object.freeze({ request_type: "WASTE_COLLECTION_REQUEST", service_type: "WASTE_COLLECTION", verified: true, source: waste.source })));
  const verifiedCargo = cargoRequests.filter((request) => request?.verified === true && request?.evidence);
  const candidates = [...atmRequests, ...wasteRequests, ...verifiedCargo];
  return Object.freeze({ scan_id: "KGEN_FIELD_SERVICE_DEMAND_SCAN_V3_9", status: candidates.length ? "VERIFIED_CANDIDATES_AVAILABLE" : "NO_VERIFIED_FIELD_JOB_AVAILABLE", nodes_scanned: nodes.length, verified_nodes: Object.freeze(nodes), atm_cash_needs: atmRequests.filter((request) => request.service_type === "CASH_LOGISTICS").length, atm_kufo_needs: atmRequests.filter((request) => request.service_type === "KUFO_SUPPLY").length, waste_collection_needs: wasteRequests.length, cargo_needs: verifiedCargo.length, candidate_jobs: Object.freeze(candidates), real_field_jobs: 0, selected_next_best_job: null, revenue: "0", first_kaios_event: "NOT_OCCURRED" });
}

export function createAiAntCompanyFoundingReadiness({ company, founderLife, founderApp, workHistory, charter, businessLines, quoteEngine, contractEngine, workOrderEngine, accountingSeparation, treasuryPlan, escrowPlan, payrollPlan, riskPolicy, listingPlan }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "NOT_FOUNDED", "NO_FAKE_COMPANY_FOUNDING", "Readiness cannot found or replace AI Ant Company");
  const checks = Object.freeze({
    founder_life_exists: founderLife?.life_id === company.founder_life_id && founderLife.status === "ALIVE",
    founder_app_released: founderApp?.life_id === founderLife?.life_id && founderApp.status === "RELEASED_LOCAL",
    founder_work_history: Array.isArray(workHistory) && workHistory.length > 0,
    company_charter: charter?.company_id === company.company_id,
    company_mission: typeof charter?.mission === "string" && charter.mission.length > 0,
    business_lines: Array.isArray(businessLines) && AI_ANT_BUSINESS_LINES.every((id) => businessLines.some((line) => line.business_line_id === id)),
    quote_engine: quoteEngine?.status === "SCHEMA_READY",
    contract_engine: contractEngine?.status === "SCHEMA_READY",
    work_order_engine: workOrderEngine?.status === "SCHEMA_READY_EMPTY_QUEUE",
    accounting_separation: accountingSeparation?.personal_wallet_is_company_treasury === false,
    treasury_plan: treasuryPlan?.status === "PLAN_READY_NOT_BOUND",
    escrow_plan: escrowPlan?.status === "NOT_DEPLOYED",
    payroll_plan: payrollPlan?.status === "NOT_AUTHORIZED",
    risk_policy: riskPolicy?.status === "POLICY_READY",
    listing_plan: listingPlan?.status === "PREVIEW_LOCAL_NOT_LISTED"
  });
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return Object.freeze({
    check_id: "AI_ANT_COMPANY_0001_FOUNDING_READINESS_V2_8", company_id: company.company_id,
    founder_candidate_life_id: founderLife?.life_id ?? null, status: missing.length ? "NOT_READY" : "READY_FOR_APPROVAL",
    checks, missing, owner_approval: "NOT_GRANTED", auto_found: false, company_status: "NOT_FOUNDED"
  });
}

export function validateEmploymentProfile(profile) {
  requireFields(profile, ["life_id", "employee_profile_id", "company_id", "role", "employment_status", "skills", "wallet_eligibility", "private_wallet_id", "company_wallet_authority", "career_record", "audit_record"], "EmploymentProfile");
  requireId(profile.life_id, "life_id");
  requireId(profile.employee_profile_id, "employee_profile_id");
  requireEnum(profile.role, EMPLOYMENT_ROLES, "employment.role");
  requireArray(profile.skills, "skills");
  requireArray(profile.career_record, "career_record");
  requireArray(profile.audit_record, "audit_record");
  invariant(profile.employee_profile_id !== profile.life_id, "EMPLOYEE_PROFILE_REPLACES_LIFE_ID", "Employee Profile ID cannot replace Life ID");
  return profile;
}

export function validateProjectRequest(request) {
  requireFields(request, ["project_request_id", "customer_id", "company_id", "asset_type", "customer_requirements", "status", "customer_acceptance_evidence", "created_at"], "ProjectRequest");
  requireId(request.project_request_id, "project_request_id");
  requireId(request.company_id, "company_id");
  invariant(request.status !== "ACCEPTED" || request.customer_acceptance_evidence, "CUSTOMER_ACCEPTANCE_EVIDENCE_REQUIRED", "Accepted projects require customer evidence");
  return request;
}

export function validateQuote(quote) {
  requireFields(quote, ["quote_id", "project_request_id", "company_id", "currency_id", "labor_cost", "compute_cost", "gas_cost", "testing_cost", "deployment_cost", "maintenance_cost", "company_margin", "risk_reserve", "estimated_delivery_time", "total_price", "status", "customer_acceptance_evidence"], "Quote");
  requireId(quote.quote_id, "quote_id");
  invariant(quote.status !== "ACCEPTED" || quote.customer_acceptance_evidence, "CUSTOMER_ACCEPTANCE_EVIDENCE_REQUIRED", "Accepted quotes require customer evidence");
  if (quote.status === "ESTIMATION_REQUIRED") invariant(quote.total_price === null, "DRAFT_QUOTE_FAKE_PRICE", "An unestimated draft quote cannot claim a total price");
  return quote;
}

export function validateCompanyContract(contract) {
  requireFields(contract, ["contract_id", "customer", "company", "project_id", "currency", "total_price", "deposit", "milestones", "final_payment", "acceptance_rule", "deadline", "refund_rule", "dispute_rule", "escrow", "status", "customer_acceptance_evidence"], "CompanyContract");
  requireId(contract.contract_id, "contract_id");
  requireArray(contract.milestones, "milestones");
  invariant(contract.status === "DRAFT" || contract.customer_acceptance_evidence, "CONTRACT_ACCEPTANCE_EVIDENCE_REQUIRED", "Non-draft contracts require customer acceptance evidence");
  return contract;
}

export function validateProjectEscrow(escrow) {
  requireFields(escrow, ["escrow_id", "contract_id", "wallet_class", "wallet_address", "currency_id", "expected_amount", "received_amount", "deposit_evidence", "settlement_evidence", "status"], "ProjectEscrow");
  requireId(escrow.escrow_id, "escrow_id");
  invariant(escrow.wallet_class === "PROJECT_BUDGET_WALLET", "PROJECT_ESCROW_WALLET_SEPARATION", "Project escrow must use the Project Budget Wallet class");
  invariant(escrow.status !== "FUNDED" || (escrow.deposit_evidence && escrow.received_amount !== null), "ESCROW_EVIDENCE_REQUIRED", "Funded escrow requires deposit evidence");
  return escrow;
}

export function validateWorkOrder(workOrder) {
  requireFields(workOrder, ["work_order_id", "project_id", "company_id", "assignee_type", "assignee_id", "scope", "required_skills", "risk_level", "acceptance_rule", "compensation_policy_id", "status", "review_evidence"], "WorkOrder");
  requireId(workOrder.work_order_id, "work_order_id");
  requireArray(workOrder.scope, "scope");
  requireArray(workOrder.required_skills, "required_skills");
  invariant(workOrder.assignee_type !== "AI_LIFE" || workOrder.assignee_id, "LIFE_ASSIGNEE_REQUIRED", "AI Life WorkOrders require a registered Life ID");
  return workOrder;
}

export function validateSalaryEntry(entry) {
  requireFields(entry, ["payroll_entry_id", "employee_profile_id", "work_order_id", "currency_id", "amount", "review_status", "escrow_status", "settlement_evidence", "status"], "SalaryEntry");
  requireId(entry.payroll_entry_id, "payroll_entry_id");
  invariant(entry.status !== "PAID" || (entry.review_status === "APPROVED" && entry.escrow_status === "SETTLED" && entry.settlement_evidence), "SALARY_SETTLEMENT_EVIDENCE_REQUIRED", "Salary cannot be PAID without approved escrow settlement evidence");
  return entry;
}

export function validateLandProjectRequest(request) {
  requireFields(request, ["land_project_id", "customer_id", "location", "size", "civilization", "owner", "usage", "gps_binding", "step_counter", "map_system", "birthplace_permission", "building_rights", "resource_rights", "status"], "LandProjectRequest");
  requireId(request.land_project_id, "land_project_id");
  return request;
}

export function validateLocationPermission(permission) {
  requireFields(permission, ["permission_id", "subject_id", "status", "scope", "granted_at", "revoked_at", "fallback_mode"], "LocationPermission");
  requireId(permission.permission_id, "permission_id");
  invariant(permission.fallback_mode === "NON_LOCATION_MODE", "LOCATION_FALLBACK_REQUIRED", "Location refusal must preserve non-location mode");
  invariant(permission.status !== "GRANTED" || permission.granted_at, "LOCATION_CONSENT_REQUIRED", "GPS access requires explicit granted-at evidence");
  return permission;
}

export function validateGpsSession(session) {
  requireFields(session, ["gps_session_id", "subject_id", "permission_id", "started_at", "ended_at", "status", "coordinates_stored", "fallback_mode"], "GpsSession");
  requireId(session.gps_session_id, "gps_session_id");
  invariant(session.status !== "ACTIVE" || session.permission_id, "LOCATION_CONSENT_REQUIRED", "An active GPS session requires a Location Permission record");
  invariant(session.fallback_mode === "NON_LOCATION_MODE", "LOCATION_FALLBACK_REQUIRED", "GPS sessions must preserve non-location fallback");
  return session;
}

export function validateStepCounter(counter) {
  requireFields(counter, ["step_counter_id", "subject_id", "gps_session_id", "step_count", "source", "started_at", "ended_at", "status"], "StepCounter");
  requireId(counter.step_counter_id, "step_counter_id");
  invariant(Number.isInteger(counter.step_count) && counter.step_count >= 0, "INVALID_STEP_COUNT", "Step count must be a non-negative integer");
  return counter;
}

export function validateMapPosition(position) {
  requireFields(position, ["map_position_id", "subject_id", "location_permission_id", "location_id", "coordinates", "recorded_at", "status"], "MapPosition");
  requireId(position.map_position_id, "map_position_id");
  invariant(position.coordinates === null || position.location_permission_id, "LOCATION_CONSENT_REQUIRED", "Coordinates require a Location Permission record");
  return position;
}

export function validateLandEntryEvent(event) {
  requireFields(event, ["land_entry_event_id", "subject_id", "land_asset_id", "map_position_id", "entered_at", "evidence", "status"], "LandEntryEvent");
  requireId(event.land_entry_event_id, "land_entry_event_id");
  invariant(event.status !== "VERIFIED" || event.evidence, "LAND_ENTRY_EVIDENCE_REQUIRED", "Verified land entry requires evidence");
  return event;
}

export function validateBirthplaceBinding(binding) {
  requireFields(binding, ["birthplace_binding_id", "life_id", "land_asset_id", "permission_id", "genesis_evidence", "status"], "BirthplaceBinding");
  requireId(binding.birthplace_binding_id, "birthplace_binding_id");
  invariant(binding.status !== "BOUND" || (binding.permission_id && binding.genesis_evidence), "BIRTHPLACE_BINDING_EVIDENCE_REQUIRED", "Birthplace binding requires land permission and Genesis evidence");
  return binding;
}

export function assertCompanyWalletSeparation({ privateWalletId, companyWalletId, projectBudgetWalletId, salaryEscrowWalletId }) {
  const ids = [privateWalletId, companyWalletId, projectBudgetWalletId, salaryEscrowWalletId].filter(Boolean);
  invariant(new Set(ids).size === ids.length, "COMPANY_WALLET_COMMINGLING_FORBIDDEN", "Private, company, project budget and salary escrow wallets must be separate");
  return true;
}

export function validateCivilizationReward(reward) {
  requireFields(reward, ["reward_id", "activity_type", "currency_id", "evidence", "controller_relationship", "status"], "CivilizationReward");
  requireId(reward.reward_id, "reward_id");
  const forbidden = ["WASH_TRADE", "SELF_MATCH", "FAKE_VOLUME", "COORDINATED_FAKE_ACCOUNTS"];
  invariant(!forbidden.includes(reward.activity_type), "INVALID_CIVILIZATION_REWARD_ACTIVITY", "Fake or self-controlled activity cannot earn civilization rewards");
  invariant(reward.controller_relationship !== "SAME_CONTROLLER_SELF_MATCH", "INVALID_CIVILIZATION_REWARD_ACTIVITY", "Same-controller self matching cannot earn rewards");
  return reward;
}

export function createCompanyFoundingReadinessCheck({ company, founderLife, workHistory, app, services, finance, potentialCustomers = [], companyCharter = null, treasury = null, escrow = null, payroll = null, companyRegistry = null }) {
  invariant(company?.company_id === "AI_ANT_COMPANY_0001" && company.status === "NOT_FOUNDED", "COMPANY_ALREADY_FOUNDED_OR_UNKNOWN", "Founding readiness cannot found or replace AI Ant Company");
  const checks = Object.freeze({
    founder_life: founderLife?.life_id === "DIGITAL_ANT_0001" && founderLife.status === "ALIVE",
    work_history: Array.isArray(workHistory) && workHistory.some((event) => ["WORK_EVENT", "HOURLY_WORK_EVENT"].includes(event.event_type)),
    app_release: app?.status === "RELEASED_LOCAL" && app.life_id === founderLife?.life_id,
    services: Array.isArray(services) && services.filter((service) => service.provider_life_id === founderLife?.life_id && service.status === "READY").length >= 3,
    finance: finance?.ledger_type === "LIFE" && finance.owner_id === founderLife?.life_id,
    potential_customers: potentialCustomers.length > 0,
    company_charter: Boolean(companyCharter),
    treasury_requirement: Boolean(treasury),
    escrow_requirement: Boolean(escrow),
    payroll_requirement: Boolean(payroll),
    registry_requirement: Boolean(companyRegistry)
  });
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return Object.freeze({
    check_id: "AI_ANT_COMPANY_0001_FOUNDING_READINESS",
    founder_candidate_life_id: founderLife.life_id,
    company_id: company.company_id,
    status: missing.length === 0 ? "READY_TO_FOUND" : "NOT_READY",
    checks,
    missing,
    auto_found: false,
    company_status: company.status
  });
}
