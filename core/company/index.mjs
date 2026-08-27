import { requireArray, requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

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

export const AUTONOMOUS_COMPANY_SAFE_ACTIONS = Object.freeze([
  "READ",
  "RESEARCH",
  "ANALYZE",
  "DOCUMENT",
  "TEST",
  "SIMULATE",
  "PAPER_RUNTIME",
  "ISSUE_TRIAGE",
  "SAFE_BRANCH_WORK",
  "COMMIT_TASK_BRANCH",
  "PUSH_TASK_BRANCH",
  "OPEN_DRAFT_PR",
  "CI",
  "STATUS_RECONCILIATION",
  "WORK_EVIDENCE",
  "HANDOFF",
  "REVIEW_REQUEST"
]);

export const AUTONOMOUS_COMPANY_FORBIDDEN_ACTIONS = Object.freeze([
  "SELF_APPROVAL",
  "SELF_BIRTH_APPROVAL",
  "SELF_EMPLOYMENT_APPROVAL",
  "SELF_TRUST_ESCALATION",
  "SELF_PAYROLL_APPROVAL",
  "PRIVATE_KEY_ACCESS",
  "TREASURY_TRANSFER",
  "PAYROLL_PAYMENT",
  "MAINNET_TRANSACTION",
  "TOKEN_TRANSFER",
  "CONTRACT_DEPLOYMENT",
  "GOVERNANCE_EXECUTION",
  "OWNERSHIP_TRANSFER",
  "PUSH_MAIN",
  "MERGE_MAIN",
  "IRREVERSIBLE_EXTERNAL_ACTION"
]);

export const AUTONOMOUS_COMPANY_DURABLE_EVENT_TYPES = Object.freeze([
  "CLOCK_IN",
  "WORK_ORDER",
  "HANDOFF",
  "REVIEW_REQUEST",
  "REWORK_ORDER",
  "BLOCKER_STATE",
  "CLOCK_OUT"
]);

const AUTONOMOUS_COMPANY_PRIORITY = Object.freeze({ REVIEW: 0, REPAIR: 1, HUMAN_DECISION: 2, ARCHITECTURE: 3, IMPLEMENTATION: 4 });
const AUTONOMOUS_COMPANY_SEVERITY = Object.freeze({ P0: 0, P1: 1, P2: 2, P3: 3 });
const AUTONOMOUS_COMPANY_TRUST = Object.freeze({ T0: 0, T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 });
const AUTONOMOUS_COMPANY_SAFE_RISK_LEVELS = Object.freeze(["R0", "R1", "LOW"]);

function isAutonomousCompanyWorkerEligible(worker, task = null) {
  if (!worker || !["ACTIVE", "TRUSTED", "SENIOR_TRUSTED"].includes(worker.employee_status)) return false;
  if (worker.status !== "ACTIVE" || (AUTONOMOUS_COMPANY_TRUST[worker.trust_level] ?? -1) < 2 || worker.suspension) return false;
  if (typeof worker.life_identity_ref !== "string" || !worker.life_identity_ref.trim()) return false;
  if (typeof worker.controller_id !== "string" || !worker.controller_id.trim()) return false;
  if (!["boot_acknowledged", "canon_acknowledged", "workspace_policy_acknowledged", "do_not_touch_acknowledged"].every((key) => worker[key] === true)) return false;
  if (Number(worker.active_claim_count ?? 0) > 1) return false;
  if (task && Number(worker.active_claim_count ?? 0) > 0 && worker.current_task !== task.task_id) return false;
  if (task && worker.current_task && worker.current_task !== task.task_id) return false;
  return true;
}

function autonomousCompanyActorsAreDistinct(left, right) {
  if (!left || !right) return false;
  const normalize = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
  const leftWorker = normalize(left.worker_id);
  const rightWorker = normalize(right.worker_id);
  const leftLife = normalize(left.life_identity_ref);
  const rightLife = normalize(right.life_identity_ref);
  const leftController = normalize(left.controller_id);
  const rightController = normalize(right.controller_id);
  return Boolean(leftWorker && rightWorker && leftLife && rightLife && leftController && rightController)
    && leftWorker !== rightWorker
    && leftLife !== rightLife
    && leftController !== rightController;
}

function autonomousCompanyBranchMatches(pattern, branch, taskId) {
  if (typeof pattern !== "string" || typeof branch !== "string" || typeof taskId !== "string") return false;
  const expected = pattern.replace("<Task-ID>", taskId);
  return expected === branch;
}

function createAutonomousCompanyEvent(cycleId, sequence, eventType, actorId, observedAt, payload = {}) {
  return Object.freeze({
    event_id: `${cycleId}:${String(sequence).padStart(2, "0")}:${eventType}`,
    cycle_id: cycleId,
    sequence,
    event_type: eventType,
    actor_id: actorId,
    occurred_at: observedAt,
    payload: Object.freeze({ ...payload }),
    append_only: true,
    external_effect: false
  });
}

/**
 * Deterministic, side-effect-free Company cycle planner.
 *
 * It composes the existing Worker Registry, WorkQueue, Review-first priority,
 * task-envelope and branch policies. It can emit one review or assignment
 * candidate, but it cannot claim work, edit GitHub, start a worker, merge,
 * pay, access a signer or write chain state.
 */
export function runAutonomousCompanyCycle({
  cycle_id,
  observed_at,
  current_main_sha,
  expected_main_sha,
  manager,
  workers = [],
  work_queue = [],
  review_queue = [],
  previous_cycle_ids = []
}) {
  requireId(cycle_id, "cycle_id");
  invariant(typeof observed_at === "string" && !Number.isNaN(Date.parse(observed_at)), "INVALID_COMPANY_CYCLE_TIME", "observed_at must be an ISO timestamp");
  invariant(/^[0-9a-f]{40}$/.test(current_main_sha ?? ""), "INVALID_CURRENT_MAIN_SHA", "current_main_sha must be a lowercase Git SHA");
  invariant(/^[0-9a-f]{40}$/.test(expected_main_sha ?? ""), "INVALID_EXPECTED_MAIN_SHA", "expected_main_sha must be a lowercase Git SHA");
  requireArray(workers, "workers");
  requireArray(work_queue, "work_queue");
  requireArray(review_queue, "review_queue");
  requireArray(previous_cycle_ids, "previous_cycle_ids");

  const noExternalAuthority = Object.freeze({
    main_modified: false,
    merge_executed: false,
    deployment_executed: false,
    mainnet_tx_sent: false,
    payment_sent: false,
    private_key_accessed: false,
    worker_started: false,
    workqueue_modified: false
  });

  if (previous_cycle_ids.includes(cycle_id)) {
    return Object.freeze({
      cycle_id,
      status: "IDEMPOTENT_NOOP",
      selected_action: null,
      selected_task_id: null,
      selected_worker_id: null,
      events: Object.freeze([]),
      authority: noExternalAuthority,
      next_safe_action: "WAIT_FOR_NEW_CYCLE_ID"
    });
  }

  invariant(isAutonomousCompanyWorkerEligible(manager), "GM_REGISTRATION_REQUIRED", "General Manager must be active, T2+ and fully acknowledged");
  invariant(String(manager.role ?? "").includes("General Manager"), "GM_ROLE_REQUIRED", "Manager role must include General Manager");

  const events = [];
  const append = (type, payload = {}) => events.push(createAutonomousCompanyEvent(cycle_id, events.length + 1, type, manager.worker_id, observed_at, payload));
  append("CLOCK_IN", { worker_id: manager.worker_id, current_main_sha });

  if (current_main_sha !== expected_main_sha) {
    append("BLOCKER_STATE", { blocker: "STALE_MAIN", expected_main_sha, current_main_sha });
    append("CLOCK_OUT", { result: "HOLD_STALE_MAIN" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_STALE_MAIN",
      selected_action: null,
      selected_task_id: null,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "REFRESH_MAIN_AND_RESTART_NEW_CYCLE"
    });
  }

  const reviewCandidates = review_queue
    .filter((item) => ["DELIVERY_SUBMITTED", "REVIEW", "REWORK_REQUIRED"].includes(item.status))
    .map((item) => ({
      ...item,
      priority_class: item.status === "REWORK_REQUIRED" ? "REPAIR" : "REVIEW",
      source: item.status === "REWORK_REQUIRED" ? "REPAIR_QUEUE" : "REVIEW_QUEUE"
    }));
  const workCandidates = work_queue
    .filter((item) => ["OPEN", "CLAIMABLE"].includes(item.status))
    .map((item) => ({ ...item, source: "WORK_QUEUE" }));
  const candidates = [...reviewCandidates, ...workCandidates].sort((a, b) => {
    const byClass = (AUTONOMOUS_COMPANY_PRIORITY[a.priority_class] ?? 99) - (AUTONOMOUS_COMPANY_PRIORITY[b.priority_class] ?? 99);
    if (byClass) return byClass;
    const bySeverity = (AUTONOMOUS_COMPANY_SEVERITY[a.priority] ?? 99) - (AUTONOMOUS_COMPANY_SEVERITY[b.priority] ?? 99);
    if (bySeverity) return bySeverity;
    return String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) || String(a.task_id).localeCompare(String(b.task_id));
  });

  if (candidates.length === 0) {
    append("CLOCK_OUT", { result: "NO_SAFE_WORK_AVAILABLE" });
    return Object.freeze({
      cycle_id,
      status: "NO_SAFE_WORK_AVAILABLE",
      selected_action: null,
      selected_task_id: null,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "WAIT_FOR_DURABLE_WORK_OR_REVIEW_EVENT"
    });
  }

  const selected = candidates[0];
  requireId(selected.task_id, "task_id");

  if (selected.priority_class === "HUMAN_DECISION") {
    append("BLOCKER_STATE", { blocker: "HUMAN_DECISION_REQUIRED", task_id: selected.task_id });
    append("CLOCK_OUT", { result: "HOLD_HUMAN_DECISION" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_HUMAN_DECISION",
      selected_action: null,
      selected_task_id: selected.task_id,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "WAIT_FOR_MACHINE_VERIFIABLE_HUMAN_DECISION"
    });
  }

  const requestedActions = selected.authorized_actions ?? [];
  requireArray(requestedActions, "authorized_actions");
  const forbidden = requestedActions.filter((action) => AUTONOMOUS_COMPANY_FORBIDDEN_ACTIONS.includes(action));
  const unknown = requestedActions.filter((action) => !AUTONOMOUS_COMPANY_SAFE_ACTIONS.includes(action));
  const riskIsSafe = AUTONOMOUS_COMPANY_SAFE_RISK_LEVELS.includes(selected.risk_level);
  const taskGatePassed = selected.task_envelope_status === "AUTHORIZED"
    && selected.authority_status === "MACHINE_VERIFIED"
    && selected.dependencies_complete === true
    && selected.protected_paths_changed === false
    && riskIsSafe
    && forbidden.length === 0
    && unknown.length === 0;

  if (!taskGatePassed) {
    append("BLOCKER_STATE", {
      blocker: "TASK_AUTHORITY_FAIL_CLOSED",
      task_id: selected.task_id,
      risk_level: selected.risk_level ?? null,
      risk_is_safe: riskIsSafe,
      forbidden_actions: forbidden,
      unknown_actions: unknown
    });
    append("CLOCK_OUT", { result: "HOLD_TASK_AUTHORITY" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_TASK_AUTHORITY",
      selected_action: null,
      selected_task_id: selected.task_id,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "REVIEW_TASK_ENVELOPE_AND_AUTHORITY"
    });
  }

  if (selected.source === "REVIEW_QUEUE") {
    const submitter = workers.find((worker) => worker.worker_id === selected.submitter_worker_id);
    if (!isAutonomousCompanyWorkerEligible(submitter, selected)
      || !autonomousCompanyBranchMatches(submitter.allowed_branch_pattern, selected.branch, selected.task_id)) {
      append("BLOCKER_STATE", { blocker: "AUTHORIZED_DELIVERY_SUBMITTER_REQUIRED", task_id: selected.task_id });
      append("CLOCK_OUT", { result: "HOLD_SUBMITTER" });
      return Object.freeze({
        cycle_id,
        status: "HOLD_SUBMITTER",
        selected_action: null,
        selected_task_id: selected.task_id,
        selected_worker_id: null,
        events: Object.freeze(events),
        authority: noExternalAuthority,
        next_safe_action: "RESTORE_AUTHORIZED_DELIVERY_SUBMITTER_BINDING"
      });
    }
    const reviewer = workers.find((worker) => worker.worker_id === selected.reviewer_id);
    if (!isAutonomousCompanyWorkerEligible(reviewer) || !autonomousCompanyActorsAreDistinct(reviewer, submitter)) {
      append("BLOCKER_STATE", { blocker: "INDEPENDENT_REVIEWER_REQUIRED", task_id: selected.task_id });
      append("CLOCK_OUT", { result: "HOLD_REVIEWER" });
      return Object.freeze({
        cycle_id,
        status: "HOLD_REVIEWER",
        selected_action: null,
        selected_task_id: selected.task_id,
        selected_worker_id: null,
        events: Object.freeze(events),
        authority: noExternalAuthority,
        next_safe_action: "ASSIGN_DISTINCT_AUTHORIZED_REVIEWER"
      });
    }
    append("REVIEW_REQUEST", { task_id: selected.task_id, reviewer_id: reviewer.worker_id, source: selected.source });
    append("CLOCK_OUT", { result: "REVIEW_REQUEST_READY" });
    return Object.freeze({
      cycle_id,
      status: "REVIEW_REQUEST_READY",
      selected_action: "REVIEW_REQUEST",
      selected_task_id: selected.task_id,
      selected_worker_id: reviewer.worker_id,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "TRIGGER_INDEPENDENT_REVIEW_ADAPTER_WHEN_CONNECTED"
    });
  }

  const reviewer = workers.find((candidate) => candidate.worker_id === selected.reviewer_id);
  if (!isAutonomousCompanyWorkerEligible(reviewer)) {
    append("BLOCKER_STATE", { blocker: "INDEPENDENT_REVIEWER_REQUIRED", task_id: selected.task_id });
    append("CLOCK_OUT", { result: "HOLD_REVIEWER" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_REVIEWER",
      selected_action: null,
      selected_task_id: selected.task_id,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "ASSIGN_DISTINCT_AUTHORIZED_REVIEWER"
    });
  }

  const eligibleWorkers = workers.filter((worker) => isAutonomousCompanyWorkerEligible(worker, selected));
  const requiredRepairWorkerId = selected.source === "REPAIR_QUEUE" ? selected.original_worker_id : null;
  if (selected.source === "REPAIR_QUEUE" && (typeof requiredRepairWorkerId !== "string" || !requiredRepairWorkerId.trim())) {
    append("BLOCKER_STATE", { blocker: "ORIGINAL_REPAIR_WORKER_REQUIRED", task_id: selected.task_id });
    append("CLOCK_OUT", { result: "HOLD_REPAIR_WORKER" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_REPAIR_WORKER",
      selected_action: null,
      selected_task_id: selected.task_id,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "RESTORE_ORIGINAL_AUTHORIZED_WORKER_BINDING"
    });
  }

  const requiredWorkerId = requiredRepairWorkerId ?? selected.assigned_worker_id;
  const worker = requiredWorkerId
    ? eligibleWorkers.find((candidate) => candidate.worker_id === requiredWorkerId)
    : eligibleWorkers.find((candidate) => (
      autonomousCompanyActorsAreDistinct(candidate, reviewer)
      && autonomousCompanyBranchMatches(candidate.allowed_branch_pattern, selected.branch, selected.task_id)
    ));
  if (!worker || !autonomousCompanyActorsAreDistinct(worker, reviewer) || !autonomousCompanyBranchMatches(worker.allowed_branch_pattern, selected.branch, selected.task_id)) {
    append("BLOCKER_STATE", { blocker: "ELIGIBLE_DISTINCT_WORKER_REQUIRED", task_id: selected.task_id });
    append("CLOCK_OUT", { result: "HOLD_WORKER" });
    return Object.freeze({
      cycle_id,
      status: "HOLD_WORKER",
      selected_action: null,
      selected_task_id: selected.task_id,
      selected_worker_id: null,
      events: Object.freeze(events),
      authority: noExternalAuthority,
      next_safe_action: "REGISTER_OR_ASSIGN_ELIGIBLE_WORKER"
    });
  }

  const isRepair = selected.source === "REPAIR_QUEUE";
  append("WORK_ORDER", {
    task_id: selected.task_id,
    worker_id: worker.worker_id,
    branch: selected.branch,
    work_type: isRepair ? "REPAIR" : "IMPLEMENTATION"
  });
  append("HANDOFF", {
    task_id: selected.task_id,
    to_worker_id: worker.worker_id,
    reviewer_id: reviewer.worker_id,
    handoff_type: isRepair ? "REPAIR_RETURN" : "INITIAL_ASSIGNMENT"
  });
  const readyStatus = isRepair ? "REPAIR_ASSIGNMENT_CANDIDATE_READY" : "ASSIGNMENT_CANDIDATE_READY";
  append("CLOCK_OUT", { result: readyStatus });
  return Object.freeze({
    cycle_id,
    status: readyStatus,
    selected_action: isRepair ? "REPAIR_WORK_ORDER_CANDIDATE" : "SAFE_ASSIGNMENT_CANDIDATE",
    selected_task_id: selected.task_id,
    selected_worker_id: worker.worker_id,
    events: Object.freeze(events),
    authority: noExternalAuthority,
    next_safe_action: isRepair
      ? "PERSIST_REPAIR_CLAIM_ATOMICALLY_WHEN_CONNECTOR_IS_AUTHORIZED"
      : "PERSIST_CLAIM_ATOMICALLY_WHEN_CONNECTOR_IS_AUTHORIZED"
  });
}

/**
 * Persists one already-planned safe Company cycle into the existing Company
 * history stream. Event ids are deterministic, so IndexedDB rejects a racing
 * duplicate and MemoryUniverseStore rejects it before mutation.
 */
export async function persistAutonomousCompanyCycle({ store, company, cycle_result }) {
  invariant(store && typeof store.history === "function" && typeof store.commitBatch === "function", "COMPANY_EVENT_STORE_REQUIRED", "Company cycle persistence requires the existing UniverseStore interface");
  invariant(company && typeof company.company_id === "string" && company.company_id.trim(), "COMPANY_ID_REQUIRED", "Company cycle persistence requires a Company identity");
  invariant(cycle_result && typeof cycle_result.cycle_id === "string", "COMPANY_CYCLE_RESULT_REQUIRED", "A planned Company cycle result is required");
  requireArray(cycle_result.events, "cycle_result.events");
  invariant(cycle_result.authority && typeof cycle_result.authority === "object", "COMPANY_CYCLE_AUTHORITY_REQUIRED", "A planned Company cycle must expose its authority boundary");
  invariant(
    Object.values(cycle_result.authority ?? {}).every((value) => value === false),
    "EXTERNAL_EFFECT_CYCLE_PERSISTENCE_FORBIDDEN",
    "Durable Company memory only accepts cycles with no external authority effects"
  );

  const history = await store.history(company.company_id, "COMPANY");
  if (history.some((event) => event.payload?.cycle_id === cycle_result.cycle_id)) {
    return Object.freeze({ status: "IDEMPOTENT_NOOP", cycle_id: cycle_result.cycle_id, persisted_events: Object.freeze([]) });
  }

  let expectedSequence = 1;
  const reservedPayloadFields = Object.freeze(["cycle_id", "planner_event_id", "sequence", "cycle_status", "external_effect"]);
  const operations = cycle_result.events.map((event) => {
    invariant(event.cycle_id === cycle_result.cycle_id, "CYCLE_EVENT_ID_MISMATCH", "Every persisted event must belong to the planned cycle");
    invariant(event.sequence === expectedSequence, "CYCLE_EVENT_SEQUENCE_INVALID", "Company cycle events must be contiguous and ordered");
    invariant(AUTONOMOUS_COMPANY_DURABLE_EVENT_TYPES.includes(event.event_type), "UNSUPPORTED_DURABLE_COMPANY_EVENT", `Unsupported durable Company event: ${event.event_type}`);
    invariant(event.append_only === true && event.external_effect === false, "DURABLE_EVENT_SAFETY_BOUNDARY", "Persisted Company events must be append-only and side-effect-free");
    invariant(event.payload && typeof event.payload === "object" && !Array.isArray(event.payload), "DURABLE_EVENT_PAYLOAD_REQUIRED", "Persisted Company events require an object payload");
    invariant(
      reservedPayloadFields.every((field) => !Object.prototype.hasOwnProperty.call(event.payload, field)),
      "DURABLE_EVENT_RESERVED_FIELD_OVERRIDE",
      "Planner payload cannot override durable Company event control fields"
    );
    expectedSequence += 1;
    return {
      event_id: event.event_id,
      domain: "COMPANY",
      stream: "COMPANY",
      id: company.company_id,
      entity: company,
      event_type: event.event_type,
      actor_id: event.actor_id,
      timestamp: event.occurred_at,
      payload: {
        ...event.payload,
        cycle_id: cycle_result.cycle_id,
        planner_event_id: event.event_id,
        sequence: event.sequence,
        cycle_status: cycle_result.status,
        external_effect: false
      }
    };
  });

  const persisted = operations.length ? await store.commitBatch(operations) : [];
  return Object.freeze({
    status: operations.length ? "CYCLE_EVENTS_PERSISTED" : "NO_EVENTS_TO_PERSIST",
    cycle_id: cycle_result.cycle_id,
    persisted_events: Object.freeze(persisted)
  });
}

export async function restoreAutonomousCompanyCycleState({ store, company_id }) {
  invariant(store && typeof store.history === "function", "COMPANY_EVENT_STORE_REQUIRED", "Company cycle recovery requires the existing UniverseStore interface");
  requireId(company_id, "company_id");
  const history = await store.history(company_id, "COMPANY");
  const cycleEvents = history.filter((event) => typeof event.payload?.cycle_id === "string" && AUTONOMOUS_COMPANY_DURABLE_EVENT_TYPES.includes(event.event_type));
  const cycleIds = [...new Set(cycleEvents.map((event) => event.payload.cycle_id))];
  const latestCycleId = cycleIds.at(-1) ?? null;
  const latestEvents = latestCycleId ? cycleEvents.filter((event) => event.payload.cycle_id === latestCycleId) : [];
  const clockOut = latestEvents.findLast((event) => event.event_type === "CLOCK_OUT");
  return Object.freeze({
    status: latestCycleId ? "RESTART_STATE_RECOVERED" : "NO_DURABLE_CYCLE_HISTORY",
    company_id,
    previous_cycle_ids: Object.freeze(cycleIds),
    latest_cycle_id: latestCycleId,
    latest_cycle_status: clockOut?.payload?.result ?? latestEvents.at(-1)?.payload?.cycle_status ?? null,
    latest_event_id: latestEvents.at(-1)?.event_id ?? null,
    event_count: cycleEvents.length,
    external_effect: false
  });
}

export const LOCAL_CLAIM_SIMULATOR_ACTIVE_STATES = Object.freeze(["ACTIVE", "EXECUTING", "REVIEW", "REPAIR", "RECOVERY_PENDING"]);

/**
 * One-host SQLite state-machine simulator for the proposed Claim Registry.
 * It exercises transactions, unique active locks, compare-and-swap versions,
 * fencing tokens and append-only mutation evidence. It is deliberately not a
 * shared service, production authority, dispatcher, worker wake or cutover.
 */
export async function createLocalSqliteClaimRegistrySimulator({ database_path = ":memory:" } = {}) {
  invariant(typeof database_path === "string" && database_path.length > 0, "CLAIM_SIMULATOR_PATH_REQUIRED", "Claim simulator requires a SQLite path or :memory:");
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(database_path);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS company_claims (
      claim_id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      clone_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      review_owner_id TEXT,
      status TEXT NOT NULL,
      fencing_token INTEGER NOT NULL CHECK (fencing_token > 0),
      lease_expiry TEXT NOT NULL,
      heartbeat_at TEXT NOT NULL,
      review_custody_at TEXT,
      repair_cycle INTEGER NOT NULL DEFAULT 0 CHECK (repair_cycle >= 0),
      branch TEXT NOT NULL,
      base_sha TEXT NOT NULL,
      head_sha TEXT,
      record_version INTEGER NOT NULL CHECK (record_version > 0),
      disposition TEXT,
      registry_reconciled INTEGER NOT NULL DEFAULT 0 CHECK (registry_reconciled IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT,
      released_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS company_claim_active_task
      ON company_claims(task_id) WHERE status IN ('ACTIVE', 'EXECUTING', 'REVIEW', 'REPAIR', 'RECOVERY_PENDING');
    CREATE UNIQUE INDEX IF NOT EXISTS company_claim_active_clone
      ON company_claims(clone_id) WHERE status IN ('ACTIVE', 'EXECUTING', 'REVIEW', 'REPAIR', 'RECOVERY_PENDING');
    CREATE UNIQUE INDEX IF NOT EXISTS company_claim_active_session
      ON company_claims(session_id) WHERE status IN ('ACTIVE', 'EXECUTING', 'REVIEW', 'REPAIR', 'RECOVERY_PENDING');
    CREATE UNIQUE INDEX IF NOT EXISTS company_claim_active_worker
      ON company_claims(worker_id) WHERE status IN ('ACTIVE', 'EXECUTING', 'REVIEW', 'REPAIR', 'RECOVERY_PENDING');
    CREATE TABLE IF NOT EXISTS company_claim_events (
      operation_id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      mutation TEXT NOT NULL,
      record_version INTEGER NOT NULL,
      fencing_token INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      detail TEXT NOT NULL,
      FOREIGN KEY (claim_id) REFERENCES company_claims(claim_id)
    );
  `);

  const claimSelect = database.prepare("SELECT * FROM company_claims WHERE claim_id = ?");
  const eventSelect = database.prepare("SELECT * FROM company_claim_events WHERE operation_id = ?");
  const eventInsert = database.prepare("INSERT INTO company_claim_events (operation_id, claim_id, mutation, record_version, fencing_token, created_at, detail) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const parseTime = (value, field) => {
    invariant(typeof value === "string" && !Number.isNaN(Date.parse(value)), "CLAIM_TIME_INVALID", `${field} must be an ISO timestamp`);
    return value;
  };
  const claimTextId = (value, field) => {
    invariant(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(value), "CLAIM_ID_INVALID", `${field} must be a non-empty machine identifier`);
    return value;
  };
  const getClaim = (claimId) => {
    const row = claimSelect.get(claimId);
    invariant(row, "CLAIM_NOT_FOUND", `Claim not found: ${claimId}`);
    return row;
  };
  const publicClaim = (row, operationStatus = "APPLIED") => Object.freeze({
    ...row,
    registry_reconciled: row.registry_reconciled === 1,
    simulator_status: "LOCAL_SQLITE_SIMULATOR_NOT_AUTHORITY",
    operation_status: operationStatus,
    production_claim_authority: false,
    worker_wake: false,
    external_effect: false
  });
  const start = () => database.exec("BEGIN IMMEDIATE");
  const commit = () => database.exec("COMMIT");
  const rollback = () => {
    try { database.exec("ROLLBACK"); } catch { /* no open transaction */ }
  };
  const replay = (operationId, mutation, claimId) => {
    claimTextId(operationId, "operation_id");
    const existing = eventSelect.get(operationId);
    if (!existing) return null;
    invariant(existing.mutation === mutation && existing.claim_id === claimId, "CLAIM_OPERATION_REPLAY_MISMATCH", "An operation_id cannot be reused for another claim or mutation");
    return publicClaim(getClaim(claimId), "IDEMPOTENT_NOOP");
  };
  const assertCas = (row, input) => {
    invariant(Number.isInteger(input.expected_record_version) && input.expected_record_version === row.record_version, "CLAIM_RECORD_VERSION_CONFLICT", "Claim record_version compare-and-swap failed");
    invariant(Number.isInteger(input.expected_fencing_token) && input.expected_fencing_token === row.fencing_token, "STALE_SESSION_FENCED", "Claim fencing_token is stale");
  };
  const appendEvent = (operationId, claimId, mutation, row, observedAt, detail = {}) => {
    eventInsert.run(operationId, claimId, mutation, row.record_version, row.fencing_token, observedAt, JSON.stringify(detail));
  };
  const transactional = (operationId, mutation, claimId, action) => {
    const replayed = replay(operationId, mutation, claimId);
    if (replayed) return replayed;
    start();
    try {
      const result = action();
      commit();
      return result;
    } catch (error) {
      rollback();
      if (String(error?.code ?? "").startsWith("SQLITE_CONSTRAINT") || /constraint failed/i.test(String(error?.message ?? ""))) {
        invariant(false, "CLAIM_ACTIVE_UNIQUE_CONFLICT", "A task, clone, worker or session already holds active claim custody");
      }
      throw error;
    }
  };

  const api = {
    authority: Object.freeze({
      status: "LOCAL_SQLITE_SIMULATOR_NOT_AUTHORITY",
      shared_distributed_authority: false,
      automatic_dispatch: false,
      worker_wake: false,
      github_write: false,
      chain_write: false
    }),
    acquire(input) {
      requireFields(input, ["operation_id", "claim_id", "task_id", "clone_id", "worker_id", "session_id", "branch", "base_sha", "observed_at", "lease_expiry"], "ClaimAcquire");
      for (const field of ["operation_id", "claim_id", "task_id", "clone_id", "worker_id", "session_id"]) claimTextId(input[field], field);
      parseTime(input.observed_at, "observed_at");
      parseTime(input.lease_expiry, "lease_expiry");
      invariant(Date.parse(input.lease_expiry) > Date.parse(input.observed_at), "CLAIM_LEASE_INVALID", "Claim lease must expire after acquisition");
      invariant(typeof input.branch === "string" && input.branch.length > 0 && /^[0-9a-f]{40}$/.test(input.base_sha), "CLAIM_BRANCH_BASE_INVALID", "Claim requires a branch and exact base SHA");
      return transactional(input.operation_id, "ACQUIRE", input.claim_id, () => {
        database.prepare(`INSERT INTO company_claims
          (claim_id, task_id, clone_id, worker_id, session_id, status, fencing_token, lease_expiry, heartbeat_at, branch, base_sha, record_version, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?, 1, ?, ?)`)
          .run(input.claim_id, input.task_id, input.clone_id, input.worker_id, input.session_id, input.lease_expiry, input.observed_at, input.branch, input.base_sha, input.observed_at, input.observed_at);
        const row = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "ACQUIRE", row, input.observed_at, { task_id: input.task_id, session_id: input.session_id });
        return publicClaim(row);
      });
    },
    heartbeat(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "observed_at", "lease_expiry"], "ClaimHeartbeat");
      parseTime(input.observed_at, "observed_at");
      parseTime(input.lease_expiry, "lease_expiry");
      return transactional(input.operation_id, "HEARTBEAT", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(["ACTIVE", "EXECUTING"].includes(row.status), "CLAIM_HEARTBEAT_STATE_INVALID", "Heartbeat requires active execution custody");
        invariant(Date.parse(input.observed_at) <= Date.parse(row.lease_expiry), "CLAIM_LEASE_EXPIRED", "Expired execution custody cannot heartbeat");
        invariant(Date.parse(input.lease_expiry) > Date.parse(input.observed_at), "CLAIM_LEASE_INVALID", "Heartbeat lease must extend beyond observed_at");
        database.prepare("UPDATE company_claims SET status = 'EXECUTING', heartbeat_at = ?, lease_expiry = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.observed_at, input.lease_expiry, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "HEARTBEAT", updated, input.observed_at);
        return publicClaim(updated);
      });
    },
    submitReview(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "review_owner_id", "head_sha", "observed_at"], "ClaimSubmitReview");
      claimTextId(input.review_owner_id, "review_owner_id");
      parseTime(input.observed_at, "observed_at");
      invariant(/^[0-9a-f]{40}$/.test(input.head_sha), "CLAIM_HEAD_SHA_INVALID", "Review custody requires an exact head SHA");
      return transactional(input.operation_id, "SUBMIT_REVIEW", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(["ACTIVE", "EXECUTING", "REPAIR"].includes(row.status), "CLAIM_REVIEW_STATE_INVALID", "Only execution or repair custody can enter review");
        invariant(input.review_owner_id !== row.worker_id, "CLAIM_SELF_REVIEW_FORBIDDEN", "Review custody requires a distinct reviewer");
        database.prepare("UPDATE company_claims SET status = 'REVIEW', review_owner_id = ?, review_custody_at = ?, head_sha = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.review_owner_id, input.observed_at, input.head_sha, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "SUBMIT_REVIEW", updated, input.observed_at, { review_owner_id: input.review_owner_id, head_sha: input.head_sha });
        return publicClaim(updated);
      });
    },
    repair(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "observed_at", "lease_expiry"], "ClaimRepair");
      parseTime(input.observed_at, "observed_at");
      parseTime(input.lease_expiry, "lease_expiry");
      invariant(Date.parse(input.lease_expiry) > Date.parse(input.observed_at), "CLAIM_LEASE_INVALID", "Repair lease must expire after repair begins");
      return transactional(input.operation_id, "REPAIR", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(row.status === "REVIEW", "CLAIM_REPAIR_STATE_INVALID", "Repair must return from review custody");
        database.prepare("UPDATE company_claims SET status = 'REPAIR', review_owner_id = NULL, repair_cycle = repair_cycle + 1, lease_expiry = ?, heartbeat_at = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.lease_expiry, input.observed_at, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "REPAIR", updated, input.observed_at, { original_worker_id: row.worker_id });
        return publicClaim(updated);
      });
    },
    recover(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "new_session_id", "observed_at", "lease_expiry"], "ClaimRecover");
      claimTextId(input.new_session_id, "new_session_id");
      parseTime(input.observed_at, "observed_at");
      parseTime(input.lease_expiry, "lease_expiry");
      invariant(Date.parse(input.lease_expiry) > Date.parse(input.observed_at), "CLAIM_LEASE_INVALID", "Recovery lease must expire after recovery");
      return transactional(input.operation_id, "RECOVER", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(["ACTIVE", "EXECUTING", "RECOVERY_PENDING", "EXPIRED", "ABANDONED"].includes(row.status), "CLAIM_RECOVERY_STATE_INVALID", "Claim is not recoverable");
        invariant(["RECOVERY_PENDING", "EXPIRED", "ABANDONED"].includes(row.status) || Date.parse(input.observed_at) > Date.parse(row.lease_expiry), "CLAIM_RECOVERY_BEFORE_EXPIRY_FORBIDDEN", "Live execution custody cannot be recovered before lease expiry");
        database.prepare("UPDATE company_claims SET status = 'ACTIVE', session_id = ?, fencing_token = fencing_token + 1, lease_expiry = ?, heartbeat_at = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.new_session_id, input.lease_expiry, input.observed_at, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "RECOVER", updated, input.observed_at, { previous_session_id: row.session_id, new_session_id: input.new_session_id });
        return publicClaim(updated);
      });
    },
    close(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "disposition", "registry_reconciled", "observed_at"], "ClaimClose");
      parseTime(input.observed_at, "observed_at");
      invariant(["APPROVED", "REJECTED", "BLOCKED"].includes(input.disposition), "CLAIM_DISPOSITION_INVALID", "Close requires an approved, rejected or blocked disposition");
      invariant(input.registry_reconciled === true, "CLAIM_REGISTRY_RECONCILIATION_REQUIRED", "Claim close requires cross-registry reconciliation");
      return transactional(input.operation_id, "CLOSE", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(row.status === "REVIEW" || row.status === "BLOCKED", "CLAIM_CLOSE_STATE_INVALID", "Only review or blocked custody can close");
        database.prepare("UPDATE company_claims SET status = 'CLOSED', disposition = ?, registry_reconciled = 1, closed_at = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.disposition, input.observed_at, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "CLOSE", updated, input.observed_at, { disposition: input.disposition, registry_reconciled: true });
        return publicClaim(updated);
      });
    },
    release(input) {
      requireFields(input, ["operation_id", "claim_id", "expected_record_version", "expected_fencing_token", "observed_at"], "ClaimRelease");
      parseTime(input.observed_at, "observed_at");
      return transactional(input.operation_id, "RELEASE", input.claim_id, () => {
        const row = getClaim(input.claim_id);
        assertCas(row, input);
        invariant(row.status === "CLOSED" && row.registry_reconciled === 1 && row.disposition, "CLAIM_RELEASE_STATE_INVALID", "Release requires reconciled closed disposition");
        database.prepare("UPDATE company_claims SET status = 'RELEASED', released_at = ?, record_version = record_version + 1, updated_at = ? WHERE claim_id = ?")
          .run(input.observed_at, input.observed_at, input.claim_id);
        const updated = getClaim(input.claim_id);
        appendEvent(input.operation_id, input.claim_id, "RELEASE", updated, input.observed_at, { disposition: row.disposition });
        return publicClaim(updated);
      });
    },
    getClaim(claimId) {
      return publicClaim(getClaim(claimId), "READ_ONLY");
    },
    getEvents(claimId) {
      claimTextId(claimId, "claim_id");
      return Object.freeze(database.prepare("SELECT * FROM company_claim_events WHERE claim_id = ? ORDER BY rowid").all(claimId).map((row) => Object.freeze({ ...row, detail: JSON.parse(row.detail) })));
    },
    closeDatabase() {
      database.close();
    }
  };
  return Object.freeze(api);
}

const CANONICAL_GITHUB_API_ORIGIN = "https://api.github.com";

function normalizeGitHubApiBase(apiBase, token) {
  invariant(typeof apiBase === "string" && apiBase.length > 0, "GITHUB_API_BASE_INVALID", "GitHub API base is required");
  let parsed;
  try {
    parsed = new URL(apiBase);
  } catch {
    invariant(false, "GITHUB_API_BASE_INVALID", "GitHub API base must be an absolute HTTPS URL");
  }
  invariant(parsed.protocol === "https:", "GITHUB_API_BASE_INSECURE", "GitHub API reads require HTTPS");
  invariant(!parsed.username && !parsed.password && !parsed.search && !parsed.hash, "GITHUB_API_BASE_INVALID", "GitHub API base cannot contain credentials, query or fragment");
  invariant(parsed.pathname === "/" || parsed.pathname === "", "GITHUB_API_BASE_PATH_FORBIDDEN", "GitHub API base cannot contain a path");
  if (token) {
    invariant(parsed.origin === CANONICAL_GITHUB_API_ORIGIN, "GITHUB_TOKEN_ORIGIN_NOT_ALLOWED", "GitHub bearer credentials may only be sent to the canonical GitHub API origin");
  }
  return parsed.origin;
}

function githubSnapshotHeaders(token) {
  return Object.freeze({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  });
}

function aggregateGitHubChecks(checkRuns, requiredCheckNames) {
  if (!Array.isArray(checkRuns) || checkRuns.length === 0) return "NO_CHECKS";
  invariant(Array.isArray(requiredCheckNames) && requiredCheckNames.length > 0, "GITHUB_REQUIRED_CHECKS_MISSING", "Exact-head CI observation requires named check contexts");
  const failureConclusions = ["failure", "timed_out", "cancelled", "action_required", "startup_failure"];
  for (const requiredName of requiredCheckNames) {
    const matches = checkRuns.filter((run) => run?.name === requiredName);
    if (matches.length === 0) return "MISSING_REQUIRED_CHECK";
    if (matches.some((run) => failureConclusions.includes(run.conclusion))) return "FAIL";
    if (matches.some((run) => run.status !== "completed" || !run.conclusion)) return "PENDING";
    if (!matches.some((run) => run.conclusion === "success")) return "MISSING_REQUIRED_CHECK";
  }
  return "PASS";
}

/**
 * Read-only GitHub adapter used at Company clock-in. It discovers current main,
 * the active PR head, divergence and exact-head checks from GitHub instead of
 * trusting chat or a stale handoff. It exposes no mutation method.
 */
export async function readLatestRepositorySnapshot({
  repository,
  active_task_pr = null,
  observed_at,
  fetch_impl = globalThis.fetch,
  token = null,
  api_base = CANONICAL_GITHUB_API_ORIGIN,
  required_check_names = ["test"]
}) {
  invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? ""), "INVALID_GITHUB_REPOSITORY", "Repository must use owner/name form");
  invariant(typeof observed_at === "string" && !Number.isNaN(Date.parse(observed_at)), "INVALID_REPOSITORY_OBSERVATION_TIME", "observed_at must be an ISO timestamp");
  invariant(typeof fetch_impl === "function", "GITHUB_READ_ADAPTER_REQUIRED", "A read-only fetch adapter is required");
  invariant(active_task_pr === null || (Number.isInteger(active_task_pr) && active_task_pr > 0), "INVALID_ACTIVE_TASK_PR", "active_task_pr must be a positive integer or null");
  invariant(Array.isArray(required_check_names) && required_check_names.length > 0 && required_check_names.every((name) => typeof name === "string" && name.trim()), "GITHUB_REQUIRED_CHECKS_INVALID", "required_check_names must contain one or more named check contexts");

  const normalizedApiBase = normalizeGitHubApiBase(api_base, token);
  const headers = githubSnapshotHeaders(token);
  const read = async (path) => {
    const response = await fetch_impl(`${normalizedApiBase}/repos/${repository}${path}`, { method: "GET", headers });
    invariant(response?.ok === true, "GITHUB_READ_FAILED", `GitHub read failed for ${path}: HTTP ${response?.status ?? "UNKNOWN"}`);
    return response.json();
  };

  const repositoryState = await read("");
  invariant(typeof repositoryState.default_branch === "string" && repositoryState.default_branch, "GITHUB_DEFAULT_BRANCH_MISSING", "GitHub repository response is missing default_branch");
  const mainCommit = await read(`/commits/${encodeURIComponent(repositoryState.default_branch)}`);
  invariant(/^[0-9a-f]{40}$/.test(mainCommit.sha ?? ""), "GITHUB_MAIN_SHA_INVALID", "GitHub main commit response is invalid");
  const mainCommitTime = mainCommit.commit?.committer?.date ?? mainCommit.commit?.author?.date;
  invariant(typeof mainCommitTime === "string" && !Number.isNaN(Date.parse(mainCommitTime)), "GITHUB_MAIN_TIME_INVALID", "GitHub main commit time is invalid");

  let pullRequest = null;
  if (active_task_pr !== null) {
    const pr = await read(`/pulls/${active_task_pr}`);
    invariant(/^[0-9a-f]{40}$/.test(pr.head?.sha ?? ""), "GITHUB_PR_HEAD_INVALID", "GitHub pull request head is invalid");
    invariant(typeof pr.head?.ref === "string" && pr.head.ref.trim(), "GITHUB_PR_HEAD_REF_INVALID", "GitHub pull request head branch is invalid");
    invariant(typeof pr.base?.ref === "string" && pr.base.ref.trim(), "GITHUB_PR_BASE_REF_INVALID", "GitHub pull request base branch is invalid");
    const comparison = await read(`/compare/${encodeURIComponent(repositoryState.default_branch)}...${pr.head.sha}`);
    const checks = await read(`/commits/${pr.head.sha}/check-runs`);
    invariant(Number.isInteger(comparison.ahead_by) && Number.isInteger(comparison.behind_by), "GITHUB_DIVERGENCE_INVALID", "GitHub comparison is missing ahead/behind counts");
    pullRequest = Object.freeze({
      number: active_task_pr,
      head_sha: pr.head.sha,
      head_ref: pr.head.ref,
      base_ref: pr.base.ref,
      state: String(pr.state ?? "").toUpperCase(),
      draft: pr.draft === true,
      ahead_main: comparison.ahead_by,
      behind_main: comparison.behind_by,
      ci_status: aggregateGitHubChecks(checks.check_runs, required_check_names),
      check_count: Array.isArray(checks.check_runs) ? checks.check_runs.length : 0,
      required_check_names: Object.freeze([...required_check_names])
    });
  }

  return Object.freeze({
    snapshot_type: "LATEST_REPOSITORY_READ_ONLY",
    observed_at,
    repository,
    default_branch: repositoryState.default_branch,
    main_sha: mainCommit.sha,
    main_commit_time: mainCommitTime,
    active_task_pr: pullRequest,
    authority: Object.freeze({ github_read: true, github_write: false, merge: false, branch_push: false, chain_write: false, signer: false })
  });
}

export function evaluateExactHeadCiGate({ repository_snapshot, expected_head_sha = null }) {
  invariant(repository_snapshot?.snapshot_type === "LATEST_REPOSITORY_READ_ONLY", "LATEST_REPOSITORY_SNAPSHOT_REQUIRED", "Exact-head CI gate requires a fresh read-only repository snapshot");
  const pr = repository_snapshot.active_task_pr;
  if (!pr) return Object.freeze({ status: "HOLD_ACTIVE_PR_REQUIRED", exact_head: null, ci_status: "UNKNOWN", behind_main: null, external_effect: false });
  if (expected_head_sha !== null) {
    invariant(/^[0-9a-f]{40}$/.test(expected_head_sha), "EXPECTED_HEAD_SHA_INVALID", "Expected PR head must be a lowercase Git SHA");
    if (pr.head_sha !== expected_head_sha) {
      return Object.freeze({ status: "HOLD_STALE_PR_HEAD", exact_head: pr.head_sha, expected_head: expected_head_sha, ci_status: pr.ci_status, behind_main: pr.behind_main, external_effect: false });
    }
  }
  if (pr.state !== "OPEN") return Object.freeze({ status: "HOLD_PR_NOT_OPEN", exact_head: pr.head_sha, ci_status: pr.ci_status, behind_main: pr.behind_main, external_effect: false });
  if (pr.base_ref !== repository_snapshot.default_branch) {
    return Object.freeze({
      status: "HOLD_PR_BASE_BRANCH_MISMATCH",
      exact_head: pr.head_sha,
      expected_base: repository_snapshot.default_branch,
      observed_base: pr.base_ref,
      ci_status: pr.ci_status,
      behind_main: pr.behind_main,
      external_effect: false
    });
  }
  if (pr.behind_main !== 0) return Object.freeze({ status: "HOLD_PR_BEHIND_MAIN", exact_head: pr.head_sha, ci_status: pr.ci_status, behind_main: pr.behind_main, external_effect: false });
  if (pr.ci_status !== "PASS") return Object.freeze({ status: pr.ci_status === "FAIL" ? "HOLD_EXACT_HEAD_CI_FAILED" : "HOLD_EXACT_HEAD_CI_INCOMPLETE", exact_head: pr.head_sha, ci_status: pr.ci_status, behind_main: pr.behind_main, external_effect: false });
  return Object.freeze({ status: "EXACT_HEAD_CI_PASS", exact_head: pr.head_sha, ci_status: pr.ci_status, behind_main: 0, external_effect: false });
}

function evaluateAutonomousTaskRepositoryBinding({ cycle_result, cycle_input, repository_snapshot }) {
  if (!cycle_result?.selected_task_id) return Object.freeze({ status: "NO_SELECTED_TASK", task_id: null, external_effect: false });
  const selected = [...(cycle_input.review_queue ?? []), ...(cycle_input.work_queue ?? [])]
    .find((item) => item?.task_id === cycle_result.selected_task_id);
  const pr = repository_snapshot.active_task_pr;
  const verified = Boolean(selected && pr)
    && selected.repository === repository_snapshot.repository
    && selected.active_task_pr === pr.number
    && selected.branch === pr.head_ref
    && pr.base_ref === repository_snapshot.default_branch
    && selected.expected_head_sha === pr.head_sha;
  return Object.freeze({
    status: verified ? "TASK_REPOSITORY_BINDING_VERIFIED" : "HOLD_TASK_REPOSITORY_BINDING",
    task_id: cycle_result.selected_task_id,
    repository: selected?.repository ?? null,
    active_task_pr: selected?.active_task_pr ?? null,
    branch: selected?.branch ?? null,
    expected_head_sha: selected?.expected_head_sha ?? null,
    expected_base_branch: repository_snapshot.default_branch ?? null,
    observed_pr: pr?.number ?? null,
    observed_branch: pr?.head_ref ?? null,
    observed_base_branch: pr?.base_ref ?? null,
    observed_head_sha: pr?.head_sha ?? null,
    external_effect: false
  });
}

/**
 * Invocation-driven safe Company loop: observe GitHub, plan one cycle, then
 * persist only its local append-only evidence. It deliberately exposes no
 * Claim, worker wake, review wake, GitHub mutation, signer or chain connector.
 */
export async function runAutonomousCompanyReadOnlyCycle({
  repository_request,
  cycle_input,
  store,
  company
}) {
  invariant(repository_request && typeof repository_request === "object", "REPOSITORY_REQUEST_REQUIRED", "Safe Company invocation requires a repository observation request");
  invariant(cycle_input && typeof cycle_input === "object", "COMPANY_CYCLE_INPUT_REQUIRED", "Safe Company invocation requires planner input");
  const repositorySnapshot = await readLatestRepositorySnapshot(repository_request);
  const ciGate = evaluateExactHeadCiGate({ repository_snapshot: repositorySnapshot, expected_head_sha: cycle_input.expected_head_sha ?? null });
  if (ciGate.status !== "EXACT_HEAD_CI_PASS") {
    return Object.freeze({
      status: "HOLD_EXACT_HEAD_CI_GATE",
      repository_snapshot: repositorySnapshot,
      ci_gate: ciGate,
      cycle_result: null,
      persistence: null,
      authority: Object.freeze({ local_company_history_write: false, github_read: true, github_write: false, claim_write: false, worker_wake: false, reviewer_wake: false, signer: false, chain_write: false })
    });
  }
  const cycleResult = runAutonomousCompanyCycle({
    ...cycle_input,
    observed_at: repositorySnapshot.observed_at,
    current_main_sha: repositorySnapshot.main_sha
  });
  const taskRepositoryGate = evaluateAutonomousTaskRepositoryBinding({
    cycle_result: cycleResult,
    cycle_input,
    repository_snapshot: repositorySnapshot
  });
  if (taskRepositoryGate.status === "HOLD_TASK_REPOSITORY_BINDING") {
    return Object.freeze({
      status: "HOLD_TASK_REPOSITORY_BINDING",
      repository_snapshot: repositorySnapshot,
      task_repository_gate: taskRepositoryGate,
      ci_gate: ciGate,
      cycle_result: cycleResult,
      persistence: null,
      authority: Object.freeze({ local_company_history_write: false, github_read: true, github_write: false, claim_write: false, worker_wake: false, reviewer_wake: false, signer: false, chain_write: false })
    });
  }
  const prePersistenceSnapshot = await readLatestRepositorySnapshot(repository_request);
  const prePersistenceGate = evaluateExactHeadCiGate({ repository_snapshot: prePersistenceSnapshot, expected_head_sha: cycle_input.expected_head_sha ?? null });
  const prePersistenceTaskRepositoryGate = evaluateAutonomousTaskRepositoryBinding({
    cycle_result: cycleResult,
    cycle_input,
    repository_snapshot: prePersistenceSnapshot
  });
  const taskBindingMoved = taskRepositoryGate.status === "TASK_REPOSITORY_BINDING_VERIFIED"
    && prePersistenceTaskRepositoryGate.status !== "TASK_REPOSITORY_BINDING_VERIFIED";
  const repositoryMoved = prePersistenceSnapshot.main_sha !== repositorySnapshot.main_sha
    || prePersistenceSnapshot.active_task_pr?.head_sha !== repositorySnapshot.active_task_pr?.head_sha
    || prePersistenceSnapshot.active_task_pr?.head_ref !== repositorySnapshot.active_task_pr?.head_ref
    || prePersistenceSnapshot.active_task_pr?.base_ref !== repositorySnapshot.active_task_pr?.base_ref
    || taskBindingMoved;
  if (repositoryMoved || prePersistenceGate.status !== "EXACT_HEAD_CI_PASS") {
    return Object.freeze({
      status: "HOLD_REPOSITORY_MOVED_BEFORE_PERSISTENCE",
      repository_snapshot: repositorySnapshot,
      pre_persistence_snapshot: prePersistenceSnapshot,
      ci_gate: prePersistenceGate,
      cycle_result: cycleResult,
      task_repository_gate: taskRepositoryGate,
      pre_persistence_task_repository_gate: prePersistenceTaskRepositoryGate,
      persistence: null,
      authority: Object.freeze({ local_company_history_write: false, github_read: true, github_write: false, claim_write: false, worker_wake: false, reviewer_wake: false, signer: false, chain_write: false })
    });
  }
  const persistence = await persistAutonomousCompanyCycle({ store, company, cycle_result: cycleResult });
  return Object.freeze({
    status: "READ_PLAN_PERSIST_CYCLE_COMPLETED",
    repository_snapshot: repositorySnapshot,
    pre_persistence_snapshot: prePersistenceSnapshot,
    ci_gate: prePersistenceGate,
    cycle_result: cycleResult,
    task_repository_gate: taskRepositoryGate,
    pre_persistence_task_repository_gate: prePersistenceTaskRepositoryGate,
    persistence,
    authority: Object.freeze({ local_company_history_write: true, github_read: true, github_write: false, claim_write: false, worker_wake: false, reviewer_wake: false, signer: false, chain_write: false })
  });
}
