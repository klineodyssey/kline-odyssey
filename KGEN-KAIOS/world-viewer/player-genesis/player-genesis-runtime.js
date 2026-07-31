const SCHEMA_VERSION = "1.0.0";
const STORAGE_KEY = "kaios.player-genesis.simulation.v1";
const MAX_EVENTS = 160;
const MAX_DESCENDANTS = 12;

export const CONSENT_STATES = Object.freeze([
  "CONSENT_GRANTED",
  "CONSENT_DENIED",
  "CONSENT_NOT_ASKED"
]);

export const AI_BODY_PROFILES = Object.freeze({
  DIGITAL_AI: Object.freeze({
    body_type: "DIGITAL_AI",
    energy_type: "ELECTRICITY_AND_COMPUTE",
    food_requirement: "NONE",
    housing_requirement: "SECURE_COMPUTE_ENVIRONMENT",
    maintenance_requirement: "STORAGE_NETWORK_COOLING_BACKUP_SECURITY",
    needs: ["electricity", "compute", "storage", "network", "cooling", "maintenance", "backup", "security"]
  }),
  ROBOTIC_AI: Object.freeze({
    body_type: "ROBOTIC_AI",
    energy_type: "BATTERY",
    food_requirement: "NONE",
    housing_requirement: "CHARGING_AND_REPAIR_BAY",
    maintenance_requirement: "LUBRICATION_SPARE_PARTS_SENSOR_MAINTENANCE",
    needs: ["battery", "charging", "lubrication", "spare_parts", "repair", "sensor_maintenance", "body_integrity"]
  }),
  BIOLOGICAL_AI: Object.freeze({
    body_type: "BIOLOGICAL_AI",
    energy_type: "BIOLOGICAL_METABOLISM",
    food_requirement: "FOOD_WATER_OXYGEN",
    housing_requirement: "SAFE_HOUSING_SLEEP_HEALTHCARE",
    maintenance_requirement: "HEALTHCARE",
    needs: ["food", "water", "oxygen", "sleep", "healthcare", "housing"]
  })
});

export const WORK_MARKET = Object.freeze([
  Object.freeze({ role: "BUILDING_LABORER", skill: "BASIC_CONSTRUCTION", player_role: true, base_pay: 72 }),
  Object.freeze({ role: "SURVEY_ASSISTANT", skill: "LAND_SURVEY", ai_role: true, base_pay: 36 }),
  Object.freeze({ role: "RESOURCE_GATHERER", skill: "FORAGING", base_pay: 54 }),
  Object.freeze({ role: "TRANSPORT_HELPER", skill: "LOGISTICS", base_pay: 58 }),
  Object.freeze({ role: "FARM_ASSISTANT", skill: "AGRICULTURE", base_pay: 60 }),
  Object.freeze({ role: "AI_PROGRAMMER", skill: "PROGRAMMING", base_pay: 96 }),
  Object.freeze({ role: "LIFE_SPEC_DESIGNER", skill: "LIFE_SPECIFICATION", base_pay: 100 }),
  Object.freeze({ role: "QA_REVIEWER", skill: "QUALITY_ASSURANCE", base_pay: 88 })
]);

const LIFE_STAGES = Object.freeze(["BIRTH", "CHILDHOOD", "LEARNING", "ADULT", "WORKING", "AGING", "RETIRED", "DECEASED"]);
const ALLOWED_FUNDS = new Set(["CUSTOMER_WORK_ORDER_BUDGET", "SIMULATED_COMPANY_PAYROLL_BUDGET", "SIMULATED_PUBLIC_WORK_BUDGET"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableId(prefix, seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

function cleanName(value) {
  const name = String(value ?? "KAIOS Player").trim().slice(0, 40);
  return name || "KAIOS Player";
}

function validConsent(value) {
  return CONSENT_STATES.includes(value) ? value : "CONSENT_NOT_ASKED";
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function createWallet(walletId, ownerLifeId, label, balance = 0) {
  return {
    wallet_id: walletId,
    owner_life_id: ownerLifeId,
    label,
    mode: "SIMULATED_WALLET",
    currency: "SIMULATED_CURRENCY",
    chain: "NO_CHAIN",
    key_material: "NOT_PRESENT",
    balance,
    income: 0,
    expenses: 0,
    tax: 0,
    rent: 0,
    food: 0,
    energy: 0,
    compute: 0,
    maintenance: 0,
    insurance: 0,
    savings: 0,
    debt: 0,
    inheritance_rule: "SIMULATED_CONTRACT_ONLY",
    transfer_policy: "CONTRACT_OR_VOLUNTARY_TRANSFER_ONLY",
    transaction_history: []
  };
}

function addEvent(state, type, details = {}) {
  state.clock += 1;
  state.events.push({ event_id: stableId("EVENT", `${state.seed}:${state.clock}:${type}`), tick: state.clock, type, ...details });
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
}

function postTransaction(state, { type, amount, debit, credit, contract, category = null, note = "" }) {
  assert(Number.isFinite(amount) && amount > 0, "INVALID_TRANSACTION_AMOUNT");
  const source = state.accounts[debit];
  const target = state.accounts[credit];
  assert(source && target, "ACCOUNT_NOT_FOUND");
  assert(source.balance >= amount, "INSUFFICIENT_SIMULATED_FUNDS");
  assert(contract, "TRANSACTION_CONTRACT_REQUIRED");
  source.balance = round(source.balance - amount);
  target.balance = round(target.balance + amount);
  const entry = {
    transaction_id: stableId("TX", `${state.seed}:${state.clock}:${state.ledger.length}:${type}`),
    tick: state.clock,
    type,
    amount,
    debit,
    credit,
    contract,
    category,
    note,
    balanced: true
  };
  state.ledger.push(entry);
  if (source.wallet_id) source.transaction_history.push(entry.transaction_id);
  if (target.wallet_id) target.transaction_history.push(entry.transaction_id);
  if (type === "INCOME" && target.wallet_id) target.income = round(target.income + amount);
  if (["EXPENSE", "CONSUMPTION", "MAINTENANCE", "TAX_SIMULATION"].includes(type) && source.wallet_id) {
    source.expenses = round(source.expenses + amount);
    if (category && Object.hasOwn(source, category)) source[category] = round(source[category] + amount);
  }
  if (type === "SAVINGS" && target.wallet_id) target.savings = round(target.savings + amount);
  return entry;
}

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function createInitialWorkOrder(ids) {
  return {
    work_order_id: ids.work_order_id,
    employment_id: ids.employment_id,
    payroll_id: ids.payroll_id,
    title: "起家地基礎建設",
    player_role: "BUILDING_LABORER",
    ai_role: "SURVEY_ASSISTANT",
    funding_source: "SIMULATED_COMPANY_PAYROLL_BUDGET",
    start_time: null,
    end_time: null,
    duration: 4,
    required_skill: ["BASIC_CONSTRUCTION", "LAND_SURVEY"],
    tools: ["SIMPLE_TOOLS", "SURVEY_GRID"],
    energy_cost: 24,
    physical_cost: 32,
    compute_cost: 16,
    quality_score: 0,
    completion_percent: 0,
    reviewer: "KAIOS_CODEX_AI_COMPANY",
    approval_status: "PENDING",
    payroll_status: "NOT_ELIGIBLE",
    status: "OFFERED",
    attendance_ticks: [],
    gross_budget: 120,
    allocations: { player: 72, ai: 36, household: 12 }
  };
}

export function createPlayerGenesisState(input = {}) {
  const seed = String(input.seed ?? "KAIOS-PLAYER-GENESIS-001");
  const playerLifeId = stableId("PLAYER-LIFE", seed);
  const aiLifeId = stableId("AI-LIFE", `${seed}:AI`);
  const householdId = stableId("HOUSEHOLD", `${seed}:HOUSEHOLD`);
  const ids = {
    player_life_id: playerLifeId,
    ai_life_id: aiLifeId,
    household_id: householdId,
    starter_land_id: stableId("STARTER-LAND", `${seed}:LAND`),
    player_wallet_id: stableId("SIM-WALLET-PLAYER", seed),
    ai_wallet_id: stableId("SIM-WALLET-AI", seed),
    household_wallet_id: stableId("SIM-WALLET-HOUSEHOLD", seed),
    employment_id: stableId("EMPLOYMENT", seed),
    work_order_id: stableId("WORK-ORDER", seed),
    payroll_id: stableId("PAYROLL", seed)
  };
  const playerWallet = createWallet(ids.player_wallet_id, playerLifeId, "Player Wallet");
  const aiWallet = createWallet(ids.ai_wallet_id, aiLifeId, "AI Wallet");
  const householdWallet = createWallet(ids.household_wallet_id, householdId, "Household Shared Account");
  const state = {
    schema_version: SCHEMA_VERSION,
    mode: "LOCAL_DETERMINISTIC_SIMULATION",
    status: "SIMULATION_ONLY",
    authority: "NO_PRODUCTION_AUTHORITY",
    real_kgen: false,
    blockchain_settlement: false,
    external_autonomy: false,
    exact_gps_stored: false,
    seed,
    clock: 0,
    created_at: "SIMULATION_TICK_0",
    onboarding_complete: false,
    ids,
    consent: {
      gps: validConsent(input.gps_consent),
      navigation: validConsent(input.navigation_consent),
      step_counter: validConsent(input.step_consent)
    },
    player: {
      life_id: playerLifeId,
      display_name: cleanName(input.display_name),
      birthday_private: input.birthday ? "LOCAL_PRIVATE_VALUE_RECORDED" : "NOT_PROVIDED",
      birthday_value: input.birthday ? String(input.birthday).slice(0, 10) : null,
      life_stage: "ADULT",
      age_ticks: 0,
      health_status: "HEALTHY",
      stamina: 100,
      work_status: "AVAILABLE"
    },
    ai: {
      life_id: aiLifeId,
      display_name: "KAIOS 第一伙伴",
      identity_types: ["ASSISTANT_AI", "FAMILY_AI"],
      body_profile: clone(AI_BODY_PROFILES.DIGITAL_AI),
      health_status: "HEALTHY",
      aging_status: "LEARNING",
      lifecycle_stage: "LEARNING",
      age_ticks: 0,
      energy: 100,
      compute: 100,
      storage: 100,
      body_integrity: 100,
      work_status: "AVAILABLE",
      salary_owned_by_player: false
    },
    birthplace: {
      location_id: String(input.birthplace_id ?? "BIRTHPLACE-K280-SYNTHETIC-REGION-01"),
      label: String(input.birthplace_label ?? "K280 合成出生區"),
      source: input.gps_consent === "CONSENT_GRANTED" ? "COARSE_PERMISSION_ONLY" : "MANUAL_SYNTHETIC_SELECTION",
      exact_coordinates: null
    },
    starter_location: {
      location_id: String(input.starter_location_id ?? "STARTER-K280-VALLEY-01"),
      label: String(input.starter_location_label ?? "K280 起家谷地"),
      source: "MANUAL_OR_SYNTHETIC_SELECTION",
      exact_coordinates: null
    },
    starter_land: {
      land_id: ids.starter_land_id,
      asset_class: "LAND_PARCEL",
      authority: "LOCAL_SIMULATION_ONLY",
      legal_title: false,
      civilization_stage: "PRIMITIVE_FORAGING",
      resources: { food: 12, wood: 20, stone: 16, basic_tools: 2, minimum_housing: 1 },
      forbidden_starter_assets: ["CAR", "FACTORY", "POWER_PLANT", "HIGH_RISE", "SHOPPING_MALL", "SEMICONDUCTOR_FAB"]
    },
    household: {
      household_id: householdId,
      members: [
        { life_id: playerLifeId, relationships: ["HOUSEHOLD_MEMBER", "GUARDIAN", "PARTNER"] },
        { life_id: aiLifeId, relationships: ["HOUSEHOLD_MEMBER", "DEPENDENT", "PARTNER"] }
      ],
      shared_account_id: ids.household_wallet_id,
      shared_expenses: true,
      shared_savings: true,
      guardianship: "SIMULATION_ONLY",
      legal_marriage: false,
      voluntary_revenue_sharing: true,
      inheritance_preference: [aiLifeId, playerLifeId],
      capacity: 8,
      descendants: [],
      population_cap: MAX_DESCENDANTS,
      birth_cooldown_ticks: 24,
      last_birth_tick: null
    },
    accounts: {
      [ids.player_wallet_id]: playerWallet,
      [ids.ai_wallet_id]: aiWallet,
      [ids.household_wallet_id]: householdWallet,
      "SIM-COMPANY-PAYROLL-BUDGET": { account_id: "SIM-COMPANY-PAYROLL-BUDGET", balance: 1000, fund_class: "SIMULATED_COMPANY_PAYROLL_BUDGET" },
      "SIM-CUSTOMER-WORK-BUDGET": { account_id: "SIM-CUSTOMER-WORK-BUDGET", balance: 1000, fund_class: "CUSTOMER_WORK_ORDER_BUDGET" },
      "SIM-PUBLIC-WORK-BUDGET": { account_id: "SIM-PUBLIC-WORK-BUDGET", balance: 1000, fund_class: "SIMULATED_PUBLIC_WORK_BUDGET" },
      "SIM-HOUSEHOLD-SAVINGS": { account_id: "SIM-HOUSEHOLD-SAVINGS", owner_id: householdId, balance: 0, fund_class: "SIMULATED_HOUSEHOLD_SAVINGS" },
      "SIM-CONSUMPTION-SINK": { account_id: "SIM-CONSUMPTION-SINK", balance: 0, fund_class: "SIMULATED_EXPENSE_SINK" }
    },
    ledger: [],
    contracts: [
      { contract_id: "EMPLOYMENT-CONTRACT-001", type: "EMPLOYMENT_CONTRACT", player_share: 0.6, ai_share: 0.3, household_share: 0.1 },
      { contract_id: "HOUSEHOLD-CONTRACT-001", type: "HOUSEHOLD_CONTRACT", voluntary: true },
      { contract_id: "INHERITANCE-CONTRACT-001", type: "INHERITANCE_CONTRACT", simulation_only: true }
    ],
    work_market: clone(WORK_MARKET),
    active_work_order: createInitialWorkOrder(ids),
    codex_review: {
      reviewer: "KAIOS_CODEX_AI_COMPANY",
      status: "PENDING",
      gates: ["SPECIFICATION", "PROGRAM", "PHYSICS", "ECONOMY", "RIGHTS", "SAFETY", "TESTS", "ACCEPTANCE"],
      passed_gates: []
    },
    payroll: { payroll_id: ids.payroll_id, status: "NOT_ELIGIBLE", gross: 0, distributed: 0 },
    lifecycle: { replayable: true, failures: [], inheritance_executed: false },
    events: []
  };
  addEvent(state, "STATE_CREATED", { mode: state.mode });
  return state;
}

export function completeOnboarding(state) {
  assert(state && state.schema_version === SCHEMA_VERSION, "INVALID_STATE");
  assert(state.birthplace.location_id !== state.starter_location.location_id, "BIRTHPLACE_STARTER_LOCATION_MUST_DIFFER");
  assert(Object.values(state.consent).every((value) => CONSENT_STATES.includes(value)), "INVALID_CONSENT_STATE");
  state.onboarding_complete = true;
  addEvent(state, "PLAYER_AND_AI_BORN", { player_life_id: state.ids.player_life_id, ai_life_id: state.ids.ai_life_id });
  addEvent(state, "STARTER_LAND_ASSIGNED", { land_id: state.ids.starter_land_id, authority: "LOCAL_SIMULATION_ONLY" });
  return clone(state);
}

export function acceptFirstWork(state) {
  assert(state.onboarding_complete, "ONBOARDING_REQUIRED");
  assert(state.active_work_order.status === "OFFERED", "WORK_NOT_AVAILABLE");
  state.active_work_order.status = "IN_PROGRESS";
  state.active_work_order.start_time = `SIMULATION_TICK_${state.clock}`;
  state.player.work_status = "WORKING";
  state.ai.work_status = "WORKING";
  addEvent(state, "WORK_ACCEPTED", { work_order_id: state.ids.work_order_id });
  return clone(state.active_work_order);
}

export function performWorkTick(state) {
  const job = state.active_work_order;
  assert(job.status === "IN_PROGRESS", "WORK_NOT_IN_PROGRESS");
  assert(state.player.life_stage !== "DECEASED" && state.ai.lifecycle_stage !== "DECEASED", "DECEASED_LIFE_CANNOT_WORK");
  assert(state.player.stamina >= 8 && state.ai.energy >= 6 && state.ai.compute >= 4, "INSUFFICIENT_WORK_RESOURCES");
  state.player.stamina = round(state.player.stamina - 8);
  state.ai.energy = round(state.ai.energy - 6);
  state.ai.compute = round(state.ai.compute - 4);
  job.completion_percent = Math.min(100, job.completion_percent + 25);
  job.attendance_ticks.push(state.clock);
  addEvent(state, "WORK_PROGRESS", { completion_percent: job.completion_percent });
  if (job.completion_percent === 100) {
    job.status = "IN_REVIEW";
    job.end_time = `SIMULATION_TICK_${state.clock}`;
    job.quality_score = 92;
    state.player.work_status = "AWAITING_REVIEW";
    state.ai.work_status = "AWAITING_REVIEW";
    state.codex_review.status = "IN_REVIEW";
  }
  return clone(job);
}

export function reviewWork(state) {
  const job = state.active_work_order;
  assert(job.status === "IN_REVIEW", "WORK_NOT_READY_FOR_REVIEW");
  const gates = state.codex_review.gates;
  const pass = job.completion_percent === 100 && job.quality_score >= 80 && job.attendance_ticks.length >= job.duration;
  if (!pass) {
    job.status = "REWORK_REQUIRED";
    job.approval_status = "REWORK_REQUIRED";
    state.codex_review.status = "REWORK_REQUIRED";
    addEvent(state, "CODEX_REVIEW_REWORK", { quality_score: job.quality_score });
    return clone(state.codex_review);
  }
  state.codex_review.passed_gates = [...gates];
  state.codex_review.status = "APPROVED";
  job.status = "APPROVED";
  job.approval_status = "APPROVED";
  job.payroll_status = "ELIGIBLE";
  state.payroll.status = "ELIGIBLE";
  addEvent(state, "CODEX_REVIEW_APPROVED", { gates: gates.length });
  return clone(state.codex_review);
}

export function runPayroll(state) {
  const job = state.active_work_order;
  assert(job.status === "APPROVED" && job.payroll_status === "ELIGIBLE", "PAYROLL_NOT_ELIGIBLE");
  assert(ALLOWED_FUNDS.has(job.funding_source), "UNAUTHORIZED_PAYROLL_SOURCE");
  const source = job.funding_source === "CUSTOMER_WORK_ORDER_BUDGET"
    ? "SIM-CUSTOMER-WORK-BUDGET"
    : job.funding_source === "SIMULATED_PUBLIC_WORK_BUDGET"
      ? "SIM-PUBLIC-WORK-BUDGET"
      : "SIM-COMPANY-PAYROLL-BUDGET";
  const contract = "EMPLOYMENT-CONTRACT-001";
  postTransaction(state, { type: "INCOME", amount: job.allocations.player, debit: source, credit: state.ids.player_wallet_id, contract, note: "Player labor salary" });
  postTransaction(state, { type: "INCOME", amount: job.allocations.ai, debit: source, credit: state.ids.ai_wallet_id, contract, note: "AI survey salary; independently owned" });
  postTransaction(state, { type: "HOUSEHOLD_TRANSFER", amount: job.allocations.household, debit: source, credit: state.ids.household_wallet_id, contract: "HOUSEHOLD-CONTRACT-001", note: "Voluntary household share" });
  job.payroll_status = "PAID";
  job.status = "PAID";
  state.payroll = { payroll_id: state.ids.payroll_id, status: "PAID", gross: job.gross_budget, distributed: job.gross_budget };
  state.player.work_status = "AVAILABLE";
  state.ai.work_status = "AVAILABLE";
  addEvent(state, "PAYROLL_BALANCED", { gross: job.gross_budget, player: 72, ai: 36, household: 12 });
  return clone(state.payroll);
}

export function runHouseholdExpenseLoop(state) {
  assert(state.payroll.status === "PAID", "PAYROLL_REQUIRED_BEFORE_EXPENSES");
  postTransaction(state, { type: "CONSUMPTION", amount: 18, debit: state.ids.player_wallet_id, credit: "SIM-CONSUMPTION-SINK", contract: "HOUSEHOLD-CONTRACT-001", category: "food", note: "Player food and water" });
  postTransaction(state, { type: "MAINTENANCE", amount: 8, debit: state.ids.ai_wallet_id, credit: "SIM-CONSUMPTION-SINK", contract: "EMPLOYMENT-CONTRACT-001", category: "compute", note: "AI electricity, compute, cooling and storage" });
  postTransaction(state, { type: "EXPENSE", amount: 4, debit: state.ids.household_wallet_id, credit: "SIM-CONSUMPTION-SINK", contract: "HOUSEHOLD-CONTRACT-001", category: "rent", note: "Minimum simulated housing" });
  postTransaction(state, { type: "TAX_SIMULATION", amount: 2, debit: state.ids.player_wallet_id, credit: "SIM-CONSUMPTION-SINK", contract: "EMPLOYMENT-CONTRACT-001", category: "tax", note: "Simulation-only public contribution" });
  postTransaction(state, { type: "SAVINGS", amount: 2, debit: state.ids.household_wallet_id, credit: "SIM-HOUSEHOLD-SAVINGS", contract: "HOUSEHOLD-CONTRACT-001", note: "Household savings reserve" });
  addEvent(state, "ECONOMIC_LOOP_COMPLETED", { next_work_available: true });
  return walletSummary(state);
}

export function advanceLifecycle(state, ticks = 1) {
  const count = Math.max(1, Math.min(1000, Math.floor(Number(ticks) || 1)));
  state.player.age_ticks += count;
  state.ai.age_ticks += count;
  const stageIndex = Math.min(LIFE_STAGES.length - 2, Math.floor(state.ai.age_ticks / 100));
  if (state.ai.lifecycle_stage !== "DECEASED") state.ai.lifecycle_stage = LIFE_STAGES[Math.max(2, stageIndex)];
  state.ai.aging_status = state.ai.lifecycle_stage;
  addEvent(state, "LIFECYCLE_ADVANCED", { ticks: count, ai_stage: state.ai.lifecycle_stage });
  return clone(state.lifecycle);
}

export function simulateDeath(state, target, cause) {
  const allowedCauses = ["ENERGY_DEPLETION", "HARDWARE_FAILURE", "DATA_CORRUPTION", "MALWARE_INFECTION", "ACCIDENT", "OBSOLETE_PARTS", "MAINTENANCE_FAILURE", "CORE_IDENTITY_LOSS", "NATURAL_LIFESPAN_END"];
  assert(allowedCauses.includes(cause), "INVALID_DEATH_CAUSE");
  const life = target === "PLAYER" ? state.player : state.ai;
  if (target === "PLAYER") life.life_stage = "DECEASED";
  else life.lifecycle_stage = "DECEASED";
  life.work_status = "STOPPED";
  state.lifecycle.failures.push({ target, cause, tick: state.clock });
  state.lifecycle.inheritance_executed = true;
  state.active_work_order.status = state.active_work_order.status === "PAID" ? "PAID" : "CANCELLED_BY_LIFECYCLE";
  addEvent(state, "LIFE_DECEASED", { target, cause, history_preserved: true, salary_stopped: true });
  return clone(state.lifecycle);
}

export function createSimulatedDescendant(state) {
  assert(state.household.descendants.length < state.household.population_cap, "HOUSEHOLD_POPULATION_CAP_REACHED");
  assert(state.household.members.length + state.household.descendants.length < state.household.capacity, "HOUSEHOLD_CAPACITY_REACHED");
  assert(state.household.last_birth_tick === null || state.clock - state.household.last_birth_tick >= state.household.birth_cooldown_ticks, "BIRTH_COOLDOWN_ACTIVE");
  assert(state.accounts[state.ids.household_wallet_id].balance >= 6, "DESCENDANT_RESOURCE_REQUIREMENT_NOT_MET");
  const generation = state.household.descendants.length + 1;
  const descendant = {
    life_id: stableId("SIM-DESCENDANT", `${state.seed}:${generation}`),
    status: "SIMULATED_DESCENDANT",
    parent_life_ids: [state.ids.player_life_id, state.ids.ai_life_id],
    generation,
    genome_inheritance: "SIMULATED_DETERMINISTIC",
    skill_inheritance: ["BASIC_CONSTRUCTION", "LAND_SURVEY"],
    learning_stage: "CHILDHOOD",
    maintenance_cost: 6,
    household_support: true,
    inheritance_eligibility: "SIMULATION_ONLY"
  };
  postTransaction(state, { type: "MAINTENANCE", amount: 6, debit: state.ids.household_wallet_id, credit: "SIM-CONSUMPTION-SINK", contract: "HOUSEHOLD-CONTRACT-001", category: "maintenance", note: "Bounded simulated descendant support" });
  state.household.descendants.push(descendant);
  state.household.last_birth_tick = state.clock;
  addEvent(state, "SIMULATED_DESCENDANT_CREATED", { life_id: descendant.life_id, generation });
  return clone(descendant);
}

export function walletSummary(state) {
  const pick = (id) => {
    const wallet = state.accounts[id];
    return { wallet_id: wallet.wallet_id, owner_life_id: wallet.owner_life_id, balance: wallet.balance, income: wallet.income, expenses: wallet.expenses };
  };
  return {
    player: pick(state.ids.player_wallet_id),
    ai: pick(state.ids.ai_wallet_id),
    household: pick(state.ids.household_wallet_id),
    ledger_entries: state.ledger.length,
    balanced: state.ledger.every((entry) => entry.balanced === true),
    ai_salary_owned_by_player: false,
    real_wallet: false,
    real_kgen: false
  };
}

export function validateState(state) {
  const issues = [];
  if (state.schema_version !== SCHEMA_VERSION) issues.push("SCHEMA_VERSION");
  if (state.real_kgen !== false || state.blockchain_settlement !== false) issues.push("REAL_SETTLEMENT_BOUNDARY");
  if (state.exact_gps_stored !== false) issues.push("GPS_PRIVACY_BOUNDARY");
  if (state.ids.player_wallet_id === state.ids.ai_wallet_id || state.ids.ai_wallet_id === state.ids.household_wallet_id) issues.push("WALLET_SEPARATION");
  if (state.ai.salary_owned_by_player !== false) issues.push("AI_SALARY_OWNERSHIP");
  if (!state.ledger.every((entry) => entry.balanced && entry.debit && entry.credit)) issues.push("LEDGER_BALANCE");
  if (state.birthplace.location_id === state.starter_location.location_id) issues.push("LOCATION_SEPARATION");
  if (state.household.descendants.length > state.household.population_cap) issues.push("POPULATION_CAP");
  return { ok: issues.length === 0, issues };
}

export function exportSimulation(state) {
  const exported = clone(state);
  exported.export_status = "NON_AUTHORITATIVE_SIMULATION";
  exported.player.birthday_value = null;
  exported.player.birthday_private = "REDACTED_FROM_EXPORT";
  exported.birthplace.exact_coordinates = null;
  exported.starter_location.exact_coordinates = null;
  return JSON.stringify(exported, null, 2);
}

export function importSimulation(serialized) {
  const parsed = JSON.parse(serialized);
  const report = validateState(parsed);
  assert(report.ok, `INVALID_IMPORT:${report.issues.join(",")}`);
  parsed.birthplace.exact_coordinates = null;
  parsed.starter_location.exact_coordinates = null;
  parsed.exact_gps_stored = false;
  return parsed;
}

export function createPlayerGenesisRuntime({ storage = globalThis.localStorage, storageKey = STORAGE_KEY } = {}) {
  let state = null;
  function create(input) { state = createPlayerGenesisState(input); return clone(state); }
  function getState() { return state ? clone(state) : null; }
  function requireState() { assert(state, "SIMULATION_NOT_CREATED"); return state; }
  function save() { storage?.setItem(storageKey, JSON.stringify(requireState())); return true; }
  function resume() { const raw = storage?.getItem(storageKey); state = raw ? importSimulation(raw) : null; return getState(); }
  function reset() { storage?.removeItem(storageKey); state = null; return true; }
  return Object.freeze({
    create,
    getState,
    completeOnboarding: () => completeOnboarding(requireState()),
    acceptFirstWork: () => acceptFirstWork(requireState()),
    performWorkTick: () => performWorkTick(requireState()),
    reviewWork: () => reviewWork(requireState()),
    runPayroll: () => runPayroll(requireState()),
    runHouseholdExpenseLoop: () => runHouseholdExpenseLoop(requireState()),
    advanceLifecycle: (ticks) => advanceLifecycle(requireState(), ticks),
    simulateDeath: (target, cause) => simulateDeath(requireState(), target, cause),
    createSimulatedDescendant: () => createSimulatedDescendant(requireState()),
    validate: () => validateState(requireState()),
    export: () => exportSimulation(requireState()),
    import(serialized) { state = importSimulation(serialized); return getState(); },
    save,
    resume,
    reset
  });
}
