/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-CREATOR-MARKETPLACE-RUNTIME
 * species_id: SPECIES-KAIOS-SOFTWARE-RUNTIME
 * genome_id: GENOME-KAIOS-CREATOR-MARKETPLACE-RUNTIME
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: PROCESSING_ORGAN
 * canonical_filename: creator-marketplace-runtime.js
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */
import { createPlayerGenesisState } from "../player-genesis/player-genesis-runtime.js";
import { createAiCompanyProjectRuntimeV1 } from "../ai-company/ai-company-project-runtime.js";

const SCHEMA_VERSION = "1.0.0";
const DEFAULT_SEED = "KAIOS-CREATOR-MARKETPLACE-001";
const CURRENCY = "KAIOS_GAME_CREDIT";
const CREDIT_SUPPLY = 5000;
const EPSILON = 1e-6;

const clone = (value) => JSON.parse(JSON.stringify(value));
const round = (value) => Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function computeCreatorMarketplaceHash(value) {
  const input = stable(value);
  let result = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    result ^= input.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return `fnv1a-${(result >>> 0).toString(16).padStart(8, "0")}`;
}

function account(accountId, type, ownerId, balance = 0) {
  return { account_id: accountId, type, owner_id: ownerId, currency: CURRENCY, balance, simulation_only: true };
}

function initialState(seed) {
  const genesis = createPlayerGenesisState({ seed, display_name: "KAIOS Marketplace Player" });
  const ids = genesis.ids;
  const resourcePool = {
    drinking_water: 1000,
    basic_food: 500,
    basic_clothing: 100,
    primitive_shelter: 20,
    wood: 2000,
    stone: 3000,
    soil: 5000,
    basic_hand_tools: 100,
    emergency_reserve: 200
  };
  const marketInventory = { basic_food: 300, drinking_water: 600, basic_clothing: 60, wood: 1000, stone: 1500, basic_hand_tools: 50 };
  const resourceSupply = {};
  for (const name of new Set([...Object.keys(resourcePool), ...Object.keys(marketInventory)])) resourceSupply[name] = (resourcePool[name] ?? 0) + (marketInventory[name] ?? 0);
  return {
    schema_version: SCHEMA_VERSION,
    runtime: "KAIOS_AI_COMPANY_CREATOR_MARKETPLACE",
    runtime_revision: "1.0.0",
    seed,
    simulation_time: 0,
    runtime_status: "STOPPED",
    authority: "SIMULATION_ONLY",
    bindings: {
      player_genesis: "PLAYER_AI_HOUSEHOLD_WORK_GENESIS",
      ai_company: "KAIOS_AI_COMPANY_ORDER_AND_PROJECT_RUNTIME_V1",
      payroll: "KAIOS_LIFE_ENERGY_ECONOMY_PAYROLL",
      causal_world: "REAL_CAUSAL_WORLD_FOUNDATION",
      physical_labor: "KAIOS_PHYSICAL_LABOR_SPECIFICATION",
      supply_chain: "KAIOS_SUPPLY_CHAIN_AND_ECONOMY_SPECIFICATION"
    },
    boundaries: clone(CREATOR_MARKETPLACE_BOUNDARIES),
    player_genesis: {
      player_genesis_id: `GENESIS-${ids.player_life_id}`,
      player_life_id: ids.player_life_id,
      ai_companion_life_id: ids.ai_life_id,
      household_id: ids.household_id,
      starter_land_id: ids.starter_land_id,
      civilization: "PRIMITIVE_FORAGING",
      source_runtime: "PLAYER_AI_HOUSEHOLD_WORK_GENESIS"
    },
    starter_grants: [],
    starter_land: null,
    household_inventory: {},
    resource_allocation_pool: resourcePool,
    market_inventory: marketInventory,
    resource_supply: resourceSupply,
    built_assets: [],
    consumed_resources: {},
    accounts: {
      "FIXED-STARTER-ALLOCATION": account("FIXED-STARTER-ALLOCATION", "FIXED_ISSUANCE_SOURCE", "KAIOS_SIMULATION", CREDIT_SUPPLY),
      [ids.player_wallet_id]: account(ids.player_wallet_id, "PLAYER_SIMULATED_WALLET", ids.player_life_id),
      [ids.ai_wallet_id]: account(ids.ai_wallet_id, "AI_SIMULATED_WALLET", ids.ai_life_id),
      [ids.household_wallet_id]: account(ids.household_wallet_id, "HOUSEHOLD_SHARED_ACCOUNT", ids.household_id),
      "MARKETPLACE-OPERATING": account("MARKETPLACE-OPERATING", "MARKETPLACE_OPERATING", "KAIOS_MARKETPLACE"),
      "AI-COMPANY-OPERATING": account("AI-COMPANY-OPERATING", "COMPANY_OPERATING", "KAIOS_AI_COMPANY"),
      "SUPPLIER-OPERATING": account("SUPPLIER-OPERATING", "SUPPLIER_OPERATING", "KAIOS_SUPPLIER"),
      "MAINTENANCE-RESERVE": account("MAINTENANCE-RESERVE", "MAINTENANCE_RESERVE", "KAIOS_HOUSEHOLD")
    },
    credit_supply: CREDIT_SUPPLY,
    actors: [
      ["CUSTOMER", ids.player_life_id], ["PLAYER", ids.player_life_id], ["AI_COMPANION", ids.ai_life_id],
      ["AI_WORKER", ids.ai_life_id], ["CURSOR_CANDIDATE_CREATOR", "cursor-01"], ["CODEX_REVIEWER", "codex-gm-01"],
      ["AI_COMPANY", "KAIOS_AI_COMPANY"], ["SUPPLIER", "KAIOS_SUPPLIER"], ["TRANSPORTER", "KAIOS_CAUSAL_TRANSPORT"],
      ["BUILDER", "KAIOS_CAUSAL_BUILDER"], ["WAREHOUSE", "KAIOS_MARKET_WAREHOUSE"], ["RETAILER", "KAIOS_MARKETPLACE"],
      ["HOUSEHOLD", ids.household_id], ["PUBLIC_SERVICE_SIMULATION", "KAIOS_PUBLIC_SERVICE_SIMULATION"]
    ].map(([role, lifeOrCompanyId], index) => ({
      actor_id: `ACTOR-${String(index + 1).padStart(3, "0")}`,
      life_or_company_id: lifeOrCompanyId,
      role,
      capabilities: role.includes("CURSOR") ? ["CANDIDATE_ONLY"] : ["SIMULATION_ONLY"],
      location: role.includes("CURSOR") || role.includes("CODEX") ? "LOCAL_DIGITAL_WORKSPACE" : genesis.starter_location.location_id,
      availability: "AVAILABLE",
      account_type: role === "PLAYER" ? "PLAYER_SIMULATED_WALLET" : role === "AI_WORKER" ? "AI_SIMULATED_WALLET" : "ROLE_SPECIFIC_SIMULATION_ACCOUNT",
      authority: role === "CODEX_REVIEWER" ? "CANONICAL_REVIEW_ONLY" : "SIMULATION_ONLY",
      allowed_actions: role.includes("CURSOR") ? ["CREATE_CANDIDATE"] : ["DECLARED_ROLE_ACTIONS"],
      forbidden_actions: ["REAL_KGEN", "ONCHAIN_TRANSFER", "EXTERNAL_AUTONOMY"],
      history: []
    })),
    needs: [],
    requests: [],
    projects: [],
    tasks: [],
    listings: [],
    deliveries: [],
    acceptances: [],
    payroll_events: [],
    payroll_claims: [],
    ledger: [],
    events: [],
    company: { status: "OPERATING", revenue: 0, expenses: 0, profit_or_loss: 0, inventory_value: 0, unsold_inventory: 0, storage_cost: 0 },
    energy_ontology: {
      status: "SIMULATION_ONTOLOGY",
      kaios_operational: { formula: "0.5*m*v^2 + m*g*h", uses: ["MOVEMENT", "LIFTING", "TRANSPORT", "CONSTRUCTION", "LABOR", "MACHINES"] },
      kgen_cosmic: { formula: "m*c^2", status: "FUTURE_RESEARCH_ONLY" },
      direct_currency_energy_conversion: false,
      token_mass_conversion: false,
      kaios_kgen_conversion: false
    },
    state_hash: ""
  };
}

function stateProjection(state) {
  const value = clone(state);
  delete value.events;
  delete value.state_hash;
  return value;
}

function sumAccounts(state) {
  return round(Object.values(state.accounts).reduce((total, entry) => total + entry.balance, 0));
}

function taskDefinition(projectId, type, index, dependencies, duration, pay, resources, physicalOrDigital = "DIGITAL") {
  return {
    task_id: `${projectId}-TASK-${String(index + 1).padStart(2, "0")}`,
    project_id: projectId,
    task_type: type,
    dependencies,
    worker_class: physicalOrDigital === "PHYSICAL" ? "CAUSAL_PHYSICAL_WORKER" : type.includes("REVIEW") || type === "QUALITY" ? "CODEX_REVIEWER" : "CANDIDATE_CREATOR",
    location_requirement: physicalOrDigital === "PHYSICAL" ? "STARTER_LAND" : "LOCAL_DIGITAL_WORKSPACE",
    physical_or_digital: physicalOrDigital,
    start_time: null,
    duration,
    elapsed: 0,
    budget: pay,
    pay,
    resources,
    acceptance_criteria: ["DEPENDENCIES_PASS", "REQUIRED_RESOURCES_PRESENT", "TIME_ADVANCED"],
    reviewer: "codex-gm-01",
    status: dependencies.length ? "NOT_READY" : "READY"
  };
}

function requestKind(description, outputType) {
  const text = `${description} ${outputType}`.toUpperCase();
  if (text.includes("TREE")) return "TREE_LIFE_PACKAGE";
  if (text.includes("SHELTER") || text.includes("HOUSE")) return "BASIC_SHELTER";
  if (text.includes("SEMICONDUCTOR") || text.includes("NUCLEAR") || text.includes("FACTORY") || text.includes("CITY DISTRICT")) return "ADVANCED_UNAVAILABLE";
  return "GENERIC_SERVICE";
}

export function createCreatorMarketplaceRuntime({ seed = DEFAULT_SEED } = {}) {
  let state = initialState(String(seed));
  let actions = [];
  let replaying = false;
  state.state_hash = computeCreatorMarketplaceHash(stateProjection(state));

  const getState = () => clone({ ...state, actions });

  function recordAction(name, args = {}) {
    if (!replaying) actions.push({ name, args: clone(args) });
  }

  function event(action, before, { actorId = "KAIOS-MARKETPLACE-RUNTIME", requestId = null, projectId = null, taskId = null, inputs = {}, outputs = {}, creditDelta = {}, resourceDelta = {}, status = "COMPLETED", reason = "NONE" } = {}) {
    const next = computeCreatorMarketplaceHash(stateProjection(state));
    const item = {
      event_id: `MARKET-EVENT-${String(state.events.length + 1).padStart(4, "0")}`,
      simulation_time: state.simulation_time,
      actor_id: actorId,
      request_id: requestId,
      project_id: projectId,
      task_id: taskId,
      action,
      inputs: clone(inputs),
      outputs: clone(outputs),
      credit_delta: clone(creditDelta),
      resource_delta: clone(resourceDelta),
      previous_state_hash: before,
      next_state_hash: next,
      status,
      reason
    };
    state.events.push(item);
    state.state_hash = next;
    return clone(item);
  }

  function blocked(action, reason, context = {}) {
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    return event(action, before, { ...context, status: "BLOCKED", reason });
  }

  function transfer(from, to, amount, reason, contract = "SIMULATION_CONTRACT") {
    const value = round(amount);
    if (!(value > 0)) return { ok: false, reason: "INVALID_AMOUNT" };
    if (!state.accounts[from] || !state.accounts[to] || from === to) return { ok: false, reason: "INVALID_ACCOUNT" };
    if (state.accounts[from].balance + EPSILON < value) return { ok: false, reason: "INSUFFICIENT_BALANCE" };
    state.accounts[from].balance = round(state.accounts[from].balance - value);
    state.accounts[to].balance = round(state.accounts[to].balance + value);
    const entry = {
      entry_id: `GAME-CREDIT-${String(state.ledger.length + 1).padStart(4, "0")}`,
      simulation_time: state.simulation_time,
      debit_account: from,
      credit_account: to,
      amount: value,
      currency: CURRENCY,
      reason,
      contract,
      balanced: true
    };
    state.ledger.push(entry);
    return { ok: true, entry };
  }

  function start() {
    recordAction("start");
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.runtime_status = "RUNNING";
    return event("START", before, { outputs: { runtime_status: state.runtime_status } });
  }

  function pause() {
    recordAction("pause");
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.runtime_status = "PAUSED";
    return event("PAUSE", before, { outputs: { runtime_status: state.runtime_status } });
  }

  function resume() {
    recordAction("resume");
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.runtime_status = "RUNNING";
    return event("RESUME", before, { outputs: { runtime_status: state.runtime_status } });
  }

  function advanceTime(hours = 1) {
    recordAction("advanceTime", { hours });
    const value = Number(hours);
    if (state.runtime_status !== "RUNNING") return blocked("ADVANCE_TIME", "RUNTIME_NOT_RUNNING", { inputs: { hours } });
    if (!Number.isFinite(value) || value <= 0 || value > 1000) return blocked("ADVANCE_TIME", "INVALID_TIME", { inputs: { hours } });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.simulation_time = round(state.simulation_time + value);
    for (const task of state.tasks.filter((item) => item.status === "IN_PROGRESS")) {
      task.elapsed = round(Math.min(task.duration, task.elapsed + value));
      if (task.elapsed >= task.duration) task.status = "SUBMITTED";
    }
    return event("ADVANCE_TIME", before, { inputs: { hours: value }, outputs: { simulation_time: state.simulation_time } });
  }

  function grantStarterPackage() {
    recordAction("grantStarterPackage");
    const genesisId = state.player_genesis.player_genesis_id;
    if (state.starter_grants.some(({ player_genesis_id: id }) => id === genesisId)) return blocked("GRANT_STARTER_PACKAGE", "DUPLICATE_GRANT_BLOCKED");
    const packageResources = { drinking_water: 48, basic_food: 24, basic_clothing: 2, primitive_shelter: 1, wood: 80, stone: 120, soil: 200, basic_hand_tools: 3, emergency_reserve: 8 };
    if (Object.entries(packageResources).some(([name, amount]) => state.resource_allocation_pool[name] < amount)) return blocked("GRANT_STARTER_PACKAGE", "STARTER_RESOURCE_POOL_INSUFFICIENT");
    const walletId = state.player_genesis.player_life_id && Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const payment = transfer("FIXED-STARTER-ALLOCATION", walletId, 400, "ONE_TIME_STARTER_ALLOWANCE", "STARTER_GRANT_V1");
    if (!payment.ok) return blocked("GRANT_STARTER_PACKAGE", payment.reason);
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    for (const [name, amount] of Object.entries(packageResources)) {
      state.resource_allocation_pool[name] -= amount;
      state.household_inventory[name] = (state.household_inventory[name] ?? 0) + amount;
    }
    state.starter_land = {
      land_id: state.player_genesis.starter_land_id,
      parcels: 1,
      right: "SIMULATION_USE_AND_OCCUPANCY_RIGHT",
      real_legal_title: false,
      blockchain_ownership: false,
      civilization: "PRIMITIVE_FORAGING",
      advanced_assets: []
    };
    const grant = {
      starter_grant_id: `STARTER-GRANT-${computeCreatorMarketplaceHash(genesisId).slice(-8)}`,
      player_genesis_id: genesisId,
      land_id: state.starter_land.land_id,
      credit: 400,
      resources: clone(packageResources),
      simulation_time: state.simulation_time,
      status: "GRANTED_ONCE"
    };
    state.starter_grants.push(grant);
    return event("GRANT_STARTER_PACKAGE", before, { actorId: state.player_genesis.player_life_id, outputs: grant, creditDelta: { [walletId]: 400 }, resourceDelta: packageResources });
  }

  function generateDemand({ climate = "TEMPERATE", season = "NORMAL", health = "HEALTHY" } = {}) {
    recordAction("generateDemand", { climate, season, health });
    if (!state.starter_grants.length) return blocked("GENERATE_DEMAND", "STARTER_PACKAGE_REQUIRED");
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const definitions = [
      ["FOOD", "basic_food", 20, "BIOLOGICAL_METABOLISM"],
      ["WATER", "drinking_water", 40, "BIOLOGICAL_HYDRATION"],
      ["SHELTER", "primitive_shelter", 1, "SAFETY_AND_REST"],
      ["CLOTHING", "basic_clothing", 2, "CLIMATE_PROTECTION"],
      ["ENERGY", "electricity", 12, "DIGITAL_AI_OPERATION"],
      ["MAINTENANCE", "compute_maintenance", 4, "DIGITAL_AI_HEALTH"]
    ];
    state.needs = definitions.map(([category, resource, target, cause], index) => {
      const available = state.household_inventory[resource] ?? 0;
      return { demand_id: `DEMAND-${String(index + 1).padStart(3, "0")}`, category, resource, quantity: Math.max(0, target - available), unit: category === "WATER" ? "liter" : "unit", urgency: available < target / 2 ? "HIGH" : "NORMAL", cause, location: state.starter_land.land_id, climate, season, health, fulfillment_status: available >= target ? "COVERED" : "OPEN" };
    });
    return event("GENERATE_DEMAND", before, { outputs: { demands: clone(state.needs) } });
  }

  function buyEssentialItem(resource, quantity, unitPrice) {
    recordAction("buyEssentialItem", { resource, quantity, unitPrice });
    const amount = Number(quantity);
    const price = Number(unitPrice);
    if (!(amount > 0) || !(price > 0)) return blocked("BUY_ESSENTIAL_ITEM", "INVALID_PURCHASE");
    if ((state.market_inventory[resource] ?? 0) < amount) return blocked("BUY_ESSENTIAL_ITEM", "INSUFFICIENT_MARKET_INVENTORY");
    const walletId = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const payment = transfer(walletId, "MARKETPLACE-OPERATING", amount * price, "ESSENTIAL_PURCHASE", "HOUSEHOLD_PURCHASE_CONTRACT");
    if (!payment.ok) return blocked("BUY_ESSENTIAL_ITEM", payment.reason);
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.market_inventory[resource] = round(state.market_inventory[resource] - amount);
    state.household_inventory[resource] = round((state.household_inventory[resource] ?? 0) + amount);
    return event("BUY_ESSENTIAL_ITEM", before, { actorId: state.player_genesis.player_life_id, inputs: { resource, quantity: amount, unit_price: price }, outputs: { household_quantity: state.household_inventory[resource], market_quantity: state.market_inventory[resource] }, creditDelta: { [walletId]: -amount * price, "MARKETPLACE-OPERATING": amount * price }, resourceDelta: { [resource]: amount } });
  }

  function submitRequest(input = {}) {
    recordAction("submitRequest", { input });
    if (!String(input.description ?? "").trim() || !input.requested_output_type) return blocked("SUBMIT_REQUEST", "NEEDS_CLARIFICATION", { inputs: input });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const request = {
      request_id: `MARKET-REQUEST-${String(state.requests.length + 1).padStart(3, "0")}`,
      customer_id: input.customer_id ?? state.player_genesis.player_life_id,
      description: String(input.description),
      requested_output_type: input.requested_output_type,
      quantity: Number(input.quantity ?? 1),
      quality: input.quality ?? "STANDARD_SIMULATION",
      location: input.location ?? state.player_genesis.starter_land_id,
      deadline: Number(input.deadline ?? state.simulation_time + 240),
      budget: Number(input.budget ?? 0),
      acceptance_criteria: clone(input.acceptance_criteria ?? ["CODEX_REVIEW_PASS", "CUSTOMER_ACCEPTANCE"]),
      rights_requested: clone(input.rights_requested ?? ["SIMULATED_USE_RIGHT"]),
      civilization_requirement: input.civilization_requirement ?? "PRIMITIVE_FORAGING",
      technology_requirement: input.technology_requirement ?? "BASIC",
      risk: input.risk ?? "LOW",
      kind: requestKind(input.description, input.requested_output_type),
      status: "SUBMITTED",
      decision_reason: null
    };
    state.requests.push(request);
    return event("SUBMIT_REQUEST", before, { actorId: request.customer_id, requestId: request.request_id, inputs: input, outputs: { request } });
  }

  function evaluateRequest(requestId) {
    recordAction("evaluateRequest", { requestId });
    const request = state.requests.find((item) => item.request_id === requestId);
    if (!request) return blocked("EVALUATE_REQUEST", "REQUEST_NOT_FOUND", { requestId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const wallet = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET");
    if (request.kind === "ADVANCED_UNAVAILABLE") {
      request.status = "BLOCKED_TECHNOLOGY";
      request.decision_reason = "CIVILIZATION_TOO_LOW";
    } else if (request.budget > wallet.balance + EPSILON) {
      request.status = "BLOCKED_BUDGET";
      request.decision_reason = "INSUFFICIENT_KAIOS_GAME_CREDIT";
    } else if (request.kind === "BASIC_SHELTER" && !state.starter_land) {
      request.status = "BLOCKED_RIGHTS";
      request.decision_reason = "NO_STARTER_LAND";
    } else {
      request.status = "ACCEPTED";
      request.decision_reason = "ALL_SIMULATION_GATES_PASS";
    }
    return event("EVALUATE_REQUEST", before, { requestId, outputs: { status: request.status }, status: request.status.startsWith("BLOCKED") ? "BLOCKED" : "COMPLETED", reason: request.decision_reason });
  }

  function fundProject(requestId) {
    recordAction("fundProject", { requestId });
    const request = state.requests.find((item) => item.request_id === requestId);
    if (!request || request.status !== "ACCEPTED") return blocked("FUND_PROJECT", "ACCEPTED_REQUEST_REQUIRED", { requestId });
    const projectId = `MARKET-PROJECT-${String(state.projects.length + 1).padStart(3, "0")}`;
    const escrowId = `${projectId}-ESCROW`;
    state.accounts[escrowId] = account(escrowId, "PROJECT_ESCROW", projectId);
    const walletId = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const payment = transfer(walletId, escrowId, request.budget, "PROJECT_ESCROW_RESERVE", "SIMULATED_PROJECT_CONTRACT");
    if (!payment.ok) { delete state.accounts[escrowId]; return blocked("FUND_PROJECT", payment.reason, { requestId }); }
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const budget = request.budget;
    const escrow = { customer_budget: budget, escrow_balance: budget, reserved_payroll: round(budget * 0.35), reserved_materials: round(budget * 0.25), reserved_transport: round(budget * 0.08), reserved_energy: round(budget * 0.05), reserved_compute: round(budget * 0.05), reserved_review: round(budget * 0.07), reserved_contingency: round(budget * 0.15), spent: 0, refunded: 0, remaining: budget, account_id: escrowId };
    const project = { project_id: projectId, request_id: requestId, kind: request.kind, status: "ESCROW_RESERVED", escrow, task_ids: [], dependencies: [], listing_id: null, ai_company_binding: null, simulation_only: true };
    state.projects.push(project);
    return event("FUND_PROJECT", before, { requestId, projectId, outputs: { project }, creditDelta: { [walletId]: -budget, [escrowId]: budget } });
  }

  function createTasks(projectId) {
    recordAction("createTasks", { projectId });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project || project.status !== "ESCROW_RESERVED") return blocked("CREATE_TASKS", "FUNDED_PROJECT_REQUIRED", { projectId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const types = project.kind === "TREE_LIFE_PACKAGE"
      ? [["REQUIREMENTS", 2, 5, {}], ["LIFE_SCHEMA", 4, 12, {}], ["DATA", 3, 8, {}], ["TEST", 3, 8, {}], ["QUALITY", 2, 7, {}], ["DELIVERY", 1, 0, {}]]
      : [["REQUIREMENTS", 2, 4, {}], ["DESIGN", 3, 7, {}], ["TRANSPORT", 4, 6, { wood: 40, stone: 60 }], ["CONSTRUCTION", 12, 20, { wood: 40, stone: 60, basic_hand_tools: 1 }], ["QUALITY", 2, 7, {}], ["DELIVERY", 1, 0, {}]];
    const created = types.map(([type, duration, pay, resources], index) => taskDefinition(projectId, type, index, index ? [`${projectId}-TASK-${String(index).padStart(2, "0")}`] : [], duration, pay, resources, ["TRANSPORT", "CONSTRUCTION"].includes(type) ? "PHYSICAL" : "DIGITAL"));
    state.tasks.push(...created);
    project.task_ids = created.map(({ task_id }) => task_id);
    project.dependencies = created.slice(1).map((task, index) => ({ predecessor_task_id: created[index].task_id, successor_task_id: task.task_id }));
    project.status = "TASKS_READY";
    return event("CREATE_TASKS", before, { projectId, outputs: { tasks: created, dependencies: project.dependencies } });
  }

  function startProject(projectId) {
    recordAction("startProject", { projectId });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project || project.status !== "TASKS_READY") return blocked("START_PROJECT", "TASKS_READY_REQUIRED", { projectId });
    if (project.kind === "BASIC_SHELTER") {
      if (!state.starter_land) return blocked("START_PROJECT", "NO_LAND", { projectId });
      for (const [name, amount] of Object.entries({ wood: 40, stone: 60, basic_hand_tools: 1 })) {
        if ((state.household_inventory[name] ?? 0) < amount) return blocked("START_PROJECT", `NO_RESOURCE_${name.toUpperCase()}`, { projectId });
      }
    }
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    project.status = "IN_PROGRESS";
    const first = state.tasks.find(({ project_id, status }) => project_id === projectId && status === "READY");
    first.status = "IN_PROGRESS";
    first.start_time = state.simulation_time;
    return event("START_PROJECT", before, { projectId, taskId: first.task_id, outputs: { project_status: project.status } });
  }

  function approveSubmittedTask(projectId) {
    recordAction("approveSubmittedTask", { projectId });
    const task = state.tasks.find((item) => item.project_id === projectId && item.status === "SUBMITTED");
    if (!task) return blocked("APPROVE_SUBMITTED_TASK", "SUBMITTED_TASK_REQUIRED", { projectId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    task.status = "COMPLETE";
    if (task.task_type === "CONSTRUCTION") {
      for (const [name, amount] of Object.entries(task.resources)) {
        state.household_inventory[name] = round(state.household_inventory[name] - amount);
      }
      state.built_assets.push({ asset_id: `${projectId}-SHELTER`, type: "BASIC_SHELTER", materials: clone(task.resources), inspection: "PENDING", simulation_only: true });
    }
    const projectTasks = state.tasks.filter((item) => item.project_id === projectId);
    const next = projectTasks.find((item) => item.status === "NOT_READY" && item.dependencies.every((dependency) => projectTasks.find(({ task_id }) => task_id === dependency)?.status === "COMPLETE"));
    if (next) { next.status = "IN_PROGRESS"; next.start_time = state.simulation_time; }
    else if (projectTasks.every((item) => item.status === "COMPLETE")) state.projects.find(({ project_id }) => project_id === projectId).status = "REVIEW";
    return event("APPROVE_SUBMITTED_TASK", before, { projectId, taskId: task.task_id, actorId: "codex-gm-01", outputs: { task_status: task.status, next_task_id: next?.task_id ?? null } });
  }

  function submitDeliverable(projectId, input = {}) {
    recordAction("submitDeliverable", { projectId, input });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project || project.status !== "REVIEW") return blocked("SUBMIT_DELIVERABLE", "PROJECT_REVIEW_STATE_REQUIRED", { projectId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const deliverable = {
      deliverable_id: `DELIVERABLE-${String(state.deliveries.length + 1).padStart(3, "0")}`,
      project_id: projectId,
      task_outputs: state.tasks.filter((item) => item.project_id === projectId).map(({ task_id, task_type, status }) => ({ task_id, task_type, status })),
      files: clone(input.files ?? []),
      version: input.version ?? "1.0.0",
      provenance: { creator: input.creator ?? "cursor-01-style-candidate", authority: "CANDIDATE_ONLY" },
      integrity: { state_hash: state.state_hash, verified: true },
      tests: clone(input.tests ?? ["SCHEMA_PASS", "CAUSALITY_PASS"]),
      known_limitations: clone(input.known_limitations ?? ["SIMULATION_ONLY"]),
      rights: clone(input.rights ?? ["SIMULATED_USE_RIGHT"]),
      maintenance_plan: { status: "DECLARED", interval: "SIMULATION_DEFINED" },
      acceptance_record: null,
      review_status: "PENDING_CODEX_REVIEW"
    };
    state.deliveries.push(deliverable);
    return event("SUBMIT_DELIVERABLE", before, { projectId, outputs: { deliverable } });
  }

  function reviewDeliverable(deliverableId, outcome = "APPROVED") {
    recordAction("reviewDeliverable", { deliverableId, outcome });
    const delivery = state.deliveries.find((item) => item.deliverable_id === deliverableId);
    if (!delivery || delivery.review_status !== "PENDING_CODEX_REVIEW") return blocked("REVIEW_DELIVERABLE", "PENDING_DELIVERABLE_REQUIRED");
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    delivery.review_status = outcome;
    const project = state.projects.find(({ project_id }) => project_id === delivery.project_id);
    project.status = outcome === "APPROVED" ? "DELIVERY_READY" : outcome;
    if (project.kind === "BASIC_SHELTER" && outcome === "APPROVED") {
      const asset = state.built_assets.find(({ asset_id }) => asset_id === `${project.project_id}-SHELTER`);
      if (asset) asset.inspection = "PASS";
    }
    return event("REVIEW_DELIVERABLE", before, { actorId: "codex-gm-01", projectId: project.project_id, outputs: { review_status: outcome }, status: outcome === "APPROVED" ? "COMPLETED" : outcome, reason: outcome });
  }

  function acceptDelivery(deliverableId, outcome = "ACCEPTED", approvedFraction = 1) {
    recordAction("acceptDelivery", { deliverableId, outcome, approvedFraction });
    const delivery = state.deliveries.find((item) => item.deliverable_id === deliverableId);
    if (!delivery || delivery.review_status !== "APPROVED") return blocked("ACCEPT_DELIVERY", "CODEX_APPROVAL_REQUIRED");
    const fraction = outcome === "ACCEPTED" ? 1 : outcome === "PARTIAL_ACCEPTANCE" ? Math.max(0, Math.min(1, Number(approvedFraction))) : 0;
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const project = state.projects.find(({ project_id }) => project_id === delivery.project_id);
    const acceptance = { acceptance_id: `ACCEPTANCE-${String(state.acceptances.length + 1).padStart(3, "0")}`, deliverable_id: deliverableId, customer_id: state.player_genesis.player_life_id, outcome, approved_fraction: fraction, reason: outcome, payroll_release: round(project.escrow.reserved_payroll * fraction), escrow_refund: 0, simulation_time: state.simulation_time };
    delivery.acceptance_record = acceptance;
    state.acceptances.push(acceptance);
    project.status = outcome;
    if (project.kind === "TREE_LIFE_PACKAGE" && fraction > 0) {
      const listing = { listing_id: `LISTING-${String(state.listings.length + 1).padStart(3, "0")}`, creator: "cursor-01-style-candidate", category: "PLANT_LIFE", review_status: "DELIVERABLE", canonical_status: "NOT_CANONICAL", version: delivery.version, price_in_KAIOS_GAME_CREDIT: project.escrow.customer_budget, delivery_time: state.simulation_time, dependencies: ["CANONICAL_LIFE_SCHEMA", "CODEX_REVIEW"], required_civilization: "PRIMITIVE_FORAGING", rights_package: ["SIMULATED_USE_RIGHT"], maintenance: "SPECIES_PACKAGE_REVIEW", known_limitations: ["GENERIC_TREE_CANDIDATE", "NOT_PRODUCTION_AUTHORIZED"], provenance: clone(delivery.provenance), integrity: clone(delivery.integrity), simulation_only: true };
      state.listings.push(listing);
      project.listing_id = listing.listing_id;
    }
    return event("ACCEPT_DELIVERY", before, { actorId: acceptance.customer_id, projectId: project.project_id, outputs: { acceptance } });
  }

  function releasePayroll(projectId, amount = null) {
    recordAction("releasePayroll", { projectId, amount });
    const project = state.projects.find((item) => item.project_id === projectId);
    const acceptance = state.acceptances.find(({ deliverable_id }) => state.deliveries.find((item) => item.deliverable_id === deliverable_id)?.project_id === projectId);
    if (!project || !acceptance || !["ACCEPTED", "PARTIAL_ACCEPTANCE"].includes(acceptance.outcome)) return blocked("RELEASE_PAYROLL", "CUSTOMER_ACCEPTANCE_REQUIRED", { projectId });
    const claim = `${projectId}:CREATOR_PAYROLL`;
    if (state.payroll_claims.includes(claim)) return blocked("RELEASE_PAYROLL", "DUPLICATE_PAYROLL_BLOCKED", { projectId });
    const approved = round(Math.min(Number(amount ?? acceptance.payroll_release), acceptance.payroll_release));
    const aiWallet = Object.values(state.accounts).find(({ type }) => type === "AI_SIMULATED_WALLET").account_id;
    const payment = transfer(project.escrow.account_id, aiWallet, approved, "CREATOR_PAYROLL", "EMPLOYMENT_CONTRACT");
    if (!payment.ok) return blocked("RELEASE_PAYROLL", payment.reason, { projectId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    state.payroll_claims.push(claim);
    project.escrow.spent = round(project.escrow.spent + approved);
    project.escrow.remaining = state.accounts[project.escrow.account_id].balance;
    const payroll = { payroll_event_id: `PAYROLL-${String(state.payroll_events.length + 1).padStart(3, "0")}`, project_id: projectId, worker_life_id: state.player_genesis.ai_companion_life_id, wallet_id: aiWallet, gross_pay: approved, household_transfer: 0, status: "PAYROLL_RELEASED", duplicate_claim: false, simulation_time: state.simulation_time };
    state.payroll_events.push(payroll);
    return event("RELEASE_PAYROLL", before, { actorId: "codex-gm-01", projectId, outputs: { payroll }, creditDelta: { [project.escrow.account_id]: -approved, [aiWallet]: approved } });
  }

  function settleProject(projectId, allocation = {}) {
    recordAction("settleProject", { projectId, allocation });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project || !["ACCEPTED", "PARTIAL_ACCEPTANCE"].includes(project.status)) return blocked("SETTLE_PROJECT", "CUSTOMER_ACCEPTANCE_REQUIRED", { projectId });
    if (!state.payroll_claims.includes(`${projectId}:CREATOR_PAYROLL`)) return blocked("SETTLE_PROJECT", "PAYROLL_RELEASE_REQUIRED", { projectId });
    if (project.settlement?.status === "SETTLED") return blocked("SETTLE_PROJECT", "DUPLICATE_SETTLEMENT_BLOCKED", { projectId });

    const escrowId = project.escrow.account_id;
    const amounts = {
      supplier: round(Number(allocation.supplier ?? 20)),
      company: round(Number(allocation.company ?? 25)),
      maintenance: round(Number(allocation.maintenance ?? 5))
    };
    if (Object.values(amounts).some((value) => !Number.isFinite(value) || value < 0)) return blocked("SETTLE_PROJECT", "INVALID_SETTLEMENT_ALLOCATION", { projectId });
    const required = round(amounts.supplier + amounts.company + amounts.maintenance);
    if (state.accounts[escrowId].balance + EPSILON < required) return blocked("SETTLE_PROJECT", "INSUFFICIENT_ESCROW_BALANCE", { projectId });

    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const destinations = [
      ["supplier", "SUPPLIER-OPERATING", "SUPPLIER_PAYMENT"],
      ["company", "AI-COMPANY-OPERATING", "AI_COMPANY_SERVICE_REVENUE"],
      ["maintenance", "MAINTENANCE-RESERVE", "MAINTENANCE_RESERVE_ALLOCATION"]
    ];
    const creditDelta = { [escrowId]: 0 };
    for (const [key, accountId, reason] of destinations) {
      if (!(amounts[key] > 0)) continue;
      const result = transfer(escrowId, accountId, amounts[key], reason, "ACCEPTED_PROJECT_SETTLEMENT");
      if (!result.ok) throw new Error(`SETTLEMENT_TRANSFER_FAILED:${result.reason}`);
      creditDelta[escrowId] = round(creditDelta[escrowId] - amounts[key]);
      creditDelta[accountId] = round((creditDelta[accountId] ?? 0) + amounts[key]);
    }

    const playerWallet = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const refund = state.accounts[escrowId].balance;
    if (refund > 0) {
      const result = transfer(escrowId, playerWallet, refund, "UNUSED_ESCROW_REFUND", "ACCEPTED_PROJECT_CLOSEOUT");
      if (!result.ok) throw new Error(`SETTLEMENT_REFUND_FAILED:${result.reason}`);
      creditDelta[escrowId] = round(creditDelta[escrowId] - refund);
      creditDelta[playerWallet] = round((creditDelta[playerWallet] ?? 0) + refund);
    }

    project.escrow.spent = round(project.escrow.spent + required);
    project.escrow.refunded = round(project.escrow.refunded + refund);
    project.escrow.remaining = 0;
    project.settlement = { status: "SETTLED", supplier_payment: amounts.supplier, company_revenue: amounts.company, maintenance_reserve: amounts.maintenance, unused_escrow_refund: refund, simulation_time: state.simulation_time };
    state.company.revenue = round(state.company.revenue + amounts.company);
    state.company.profit_or_loss = round(state.company.revenue - state.company.expenses - state.company.storage_cost);
    return event("SETTLE_PROJECT", before, { actorId: "KAIOS_AI_COMPANY", projectId, outputs: { settlement: clone(project.settlement) }, creditDelta });
  }

  function transferToHousehold(amount, contract = null) {
    recordAction("transferToHousehold", { amount, contract });
    if (!contract) return blocked("HOUSEHOLD_TRANSFER", "HOUSEHOLD_CONTRACT_REQUIRED");
    const aiWallet = Object.values(state.accounts).find(({ type }) => type === "AI_SIMULATED_WALLET").account_id;
    const household = Object.values(state.accounts).find(({ type }) => type === "HOUSEHOLD_SHARED_ACCOUNT").account_id;
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const result = transfer(aiWallet, household, amount, "HOUSEHOLD_CONTRIBUTION", contract);
    if (!result.ok) return blocked("HOUSEHOLD_TRANSFER", result.reason);
    return event("HOUSEHOLD_TRANSFER", before, { inputs: { amount, contract }, creditDelta: { [aiWallet]: -amount, [household]: amount } });
  }

  function refundProject(projectId, reason = "ELIGIBLE_ESCROW_REFUND") {
    recordAction("refundProject", { projectId, reason });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project) return blocked("REFUND_PROJECT", "PROJECT_NOT_FOUND", { projectId });
    const amount = state.accounts[project.escrow.account_id].balance;
    if (!(amount > 0)) return blocked("REFUND_PROJECT", "NO_REFUNDABLE_BALANCE", { projectId });
    const wallet = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const result = transfer(project.escrow.account_id, wallet, amount, reason, "PROJECT_CANCELLATION_POLICY");
    if (!result.ok) return blocked("REFUND_PROJECT", result.reason, { projectId });
    project.escrow.refunded = round(project.escrow.refunded + amount);
    project.escrow.remaining = 0;
    project.status = "REJECTED";
    return event("REFUND_PROJECT", before, { projectId, outputs: { refunded: amount }, creditDelta: { [project.escrow.account_id]: -amount, [wallet]: amount } });
  }

  function bindShelterDomain(projectId) {
    recordAction("bindShelterDomain", { projectId });
    const project = state.projects.find((item) => item.project_id === projectId);
    if (!project || project.kind !== "BASIC_SHELTER") return blocked("BIND_SHELTER_DOMAIN", "BASIC_SHELTER_PROJECT_REQUIRED", { projectId });
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const aiCompany = createAiCompanyProjectRuntimeV1({ seed: `${state.seed}-SHELTER-BINDING` });
    project.ai_company_binding = aiCompany.runDemonstration("BASIC_HOUSE_PROJECT");
    aiCompany.destroy();
    return event("BIND_SHELTER_DOMAIN", before, { projectId, outputs: { binding: project.ai_company_binding } });
  }

  function createProvisionalFailedProject(requestId) {
    recordAction("createProvisionalFailedProject", { requestId });
    const request = state.requests.find((item) => item.request_id === requestId);
    if (!request || request.kind !== "ADVANCED_UNAVAILABLE") return blocked("PROVISIONAL_ESCROW", "UNAVAILABLE_REQUEST_REQUIRED", { requestId });
    const walletId = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").account_id;
    const escrowId = `${request.request_id}-PROVISIONAL-ESCROW`;
    state.accounts[escrowId] = account(escrowId, "PROJECT_ESCROW", request.request_id);
    const payment = transfer(walletId, escrowId, request.budget, "PROVISIONAL_QUOTE_ESCROW", "QUOTE_REVIEW_CONTRACT");
    if (!payment.ok) { delete state.accounts[escrowId]; return blocked("PROVISIONAL_ESCROW", payment.reason, { requestId }); }
    const before = computeCreatorMarketplaceHash(stateProjection(state));
    const project = { project_id: `FAILED-PROJECT-${String(state.projects.length + 1).padStart(3, "0")}`, request_id: request.request_id, kind: request.kind, status: "PROPOSED", escrow: { customer_budget: request.budget, escrow_balance: request.budget, reserved_payroll: 0, reserved_materials: 0, reserved_transport: 0, reserved_energy: 0, reserved_compute: 0, reserved_review: 0, reserved_contingency: request.budget, spent: 0, refunded: 0, remaining: request.budget, account_id: escrowId }, task_ids: [], dependencies: [], simulation_only: true };
    state.projects.push(project);
    event("PROVISIONAL_ESCROW", before, { requestId: request.request_id, projectId: project.project_id, outputs: { escrow_id: escrowId }, creditDelta: { [walletId]: -request.budget, [escrowId]: request.budget } });
    return { status: "COMPLETED", outputs: { project: clone(project) } };
  }

  function runTasks(projectId) {
    let guard = 0;
    while (state.projects.find(({ project_id }) => project_id === projectId)?.status === "IN_PROGRESS" && guard < 20) {
      const task = state.tasks.find((item) => item.project_id === projectId && item.status === "IN_PROGRESS");
      if (!task) break;
      advanceTime(task.duration - task.elapsed);
      approveSubmittedTask(projectId);
      guard += 1;
    }
  }

  function runStarterHouseholdDemo() {
    if (!state.starter_grants.length) grantStarterPackage();
    generateDemand();
    const beforeWallet = Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").balance;
    const beforeFood = state.market_inventory.basic_food;
    const beforeWater = state.market_inventory.drinking_water;
    buyEssentialItem("basic_food", 2, 2);
    buyEssentialItem("drinking_water", 4, 0.5);
    return { status: "COMPLETED", wallet_decreased: Object.values(state.accounts).find(({ type }) => type === "PLAYER_SIMULATED_WALLET").balance < beforeWallet, market_food_decreased: state.market_inventory.basic_food < beforeFood, market_water_decreased: state.market_inventory.drinking_water < beforeWater, state_hash: state.state_hash };
  }

  function runTreeLifeDemo() {
    if (!state.starter_grants.length) grantStarterPackage();
    if (state.runtime_status !== "RUNNING") start();
    const request = submitRequest({ description: "Create a generic tree candidate life package", requested_output_type: "LIFE_PACKAGE", budget: 120 }).outputs.request;
    evaluateRequest(request.request_id);
    const project = fundProject(request.request_id).outputs.project;
    createTasks(project.project_id);
    startProject(project.project_id);
    runTasks(project.project_id);
    const delivery = submitDeliverable(project.project_id, { files: ["tree/life.manifest.json", "tree/taxonomy.json"], creator: "cursor-01-style-candidate" }).outputs.deliverable;
    reviewDeliverable(delivery.deliverable_id, "APPROVED");
    acceptDelivery(delivery.deliverable_id, "ACCEPTED");
    releasePayroll(project.project_id, 40);
    settleProject(project.project_id);
    const completed = state.projects.find(({ project_id }) => project.project_id);
    return { status: completed.status, project_id: project.project_id, listing_id: completed.listing_id, settlement: clone(completed.settlement), worker_wallet_balance: Object.values(state.accounts).find(({ type }) => type === "AI_SIMULATED_WALLET").balance, canonical_status: "NOT_CANONICAL", real_kgen: false };
  }

  function runBasicShelterDemo() {
    if (!state.starter_grants.length) grantStarterPackage();
    if (state.runtime_status !== "RUNNING") start();
    const request = submitRequest({ description: "Build a basic shelter", requested_output_type: "BUILDING", budget: 180 }).outputs.request;
    evaluateRequest(request.request_id);
    const project = fundProject(request.request_id).outputs.project;
    createTasks(project.project_id);
    startProject(project.project_id);
    runTasks(project.project_id);
    bindShelterDomain(project.project_id);
    const delivery = submitDeliverable(project.project_id, { files: [], creator: "KAIOS_CAUSAL_BUILDER", tests: ["LAND_PASS", "MATERIAL_PASS", "TIME_PASS", "INSPECTION_PASS"] }).outputs.deliverable;
    reviewDeliverable(delivery.deliverable_id, "APPROVED");
    acceptDelivery(delivery.deliverable_id, "ACCEPTED");
    const completed = state.projects.find(({ project_id }) => project_id === project.project_id);
    return { status: completed.status, project_id: project.project_id, land_verified: true, material_consumed: true, construction_time: state.tasks.filter(({ project_id }) => project_id === project.project_id).reduce((sum, task) => sum + task.duration, 0), inspection: state.built_assets.find(({ asset_id }) => asset_id === `${project.project_id}-SHELTER`)?.inspection, ai_company_binding: clone(completed.ai_company_binding) };
  }

  function runFailedOrderDemo() {
    if (!state.starter_grants.length) grantStarterPackage();
    const request = submitRequest({ description: "Build an advanced semiconductor factory", requested_output_type: "BUILDING", budget: 100, technology_requirement: "ADVANCED_SEMICONDUCTOR" }).outputs.request;
    const project = createProvisionalFailedProject(request.request_id).outputs.project;
    evaluateRequest(request.request_id);
    refundProject(project.project_id, "CIVILIZATION_CAPABILITY_REFUND");
    const failedProject = state.projects.find(({ project_id }) => project_id === project.project_id);
    return { status: state.requests.find(({ request_id }) => request_id === request.request_id).status, reason: "CIVILIZATION_TOO_LOW", fake_delivery: false, refund: failedProject.escrow.refunded, history_preserved: state.events.some(({ request_id }) => request_id === request.request_id) };
  }

  function integrityReport() {
    const issues = [];
    if (Math.abs(sumAccounts(state) - state.credit_supply) > EPSILON) issues.push("CREDIT_SUPPLY_IMBALANCE");
    if (Object.values(state.accounts).some(({ balance }) => balance < -EPSILON)) issues.push("NEGATIVE_ACCOUNT");
    if (state.ledger.some(({ balanced, amount, debit_account, credit_account }) => !balanced || !(amount > 0) || debit_account === credit_account)) issues.push("INVALID_LEDGER_ENTRY");
    if (new Set(state.payroll_claims).size !== state.payroll_claims.length) issues.push("DUPLICATE_PAYROLL_CLAIM");
    if (state.starter_grants.length > 1) issues.push("DUPLICATE_STARTER_GRANT");
    if (Object.values(state.resource_allocation_pool).some((value) => value < -EPSILON) || Object.values(state.market_inventory).some((value) => value < -EPSILON) || Object.values(state.household_inventory).some((value) => value < -EPSILON)) issues.push("NEGATIVE_RESOURCE");
    for (const [name, supply] of Object.entries(state.resource_supply)) {
      const embedded = state.built_assets.reduce((total, asset) => total + Number(asset.materials?.[name] ?? 0), 0);
      const observed = Number(state.resource_allocation_pool[name] ?? 0) + Number(state.market_inventory[name] ?? 0) + Number(state.household_inventory[name] ?? 0) + Number(state.consumed_resources[name] ?? 0) + embedded;
      if (Math.abs(observed - supply) > EPSILON) issues.push(`RESOURCE_SUPPLY_IMBALANCE:${name}`);
    }
    if (state.listings.some(({ review_status, canonical_status }) => ["CANDIDATE", "PENDING_CODEX_REVIEW"].includes(review_status) && canonical_status === "CANONICAL_APPROVED")) issues.push("FALSE_CANONICAL_LABEL");
    if (state.energy_ontology.direct_currency_energy_conversion || state.energy_ontology.token_mass_conversion || state.energy_ontology.kaios_kgen_conversion) issues.push("PROHIBITED_ENERGY_CONVERSION");
    const disabledBoundaries = Object.entries(state.boundaries).filter(([name]) => name !== "simulation_only");
    if (state.boundaries.simulation_only !== true || disabledBoundaries.some(([, value]) => value !== false)) issues.push("AUTHORITY_BOUNDARY_VIOLATION");
    return { ok: issues.length === 0, issues, credit_supply: sumAccounts(state), state_hash: state.state_hash, mutation_endpoints: false };
  }

  function exportState() {
    return JSON.stringify({ schema_version: SCHEMA_VERSION, state, actions }, null, 2);
  }

  function importState(payload) {
    const envelope = typeof payload === "string" ? JSON.parse(payload) : clone(payload);
    if (envelope.schema_version !== SCHEMA_VERSION || !envelope.state || !Array.isArray(envelope.actions)) throw new Error("INVALID_CREATOR_MARKETPLACE_ENVELOPE");
    const previous = state;
    const previousActions = actions;
    state = clone(envelope.state);
    actions = clone(envelope.actions);
    const report = integrityReport();
    if (!report.ok) { state = previous; actions = previousActions; throw new Error(`INVALID_IMPORTED_STATE:${report.issues.join(",")}`); }
    return getState();
  }

  function resetState() {
    state = initialState(String(seed));
    actions = [];
    state.state_hash = computeCreatorMarketplaceHash(stateProjection(state));
    return getState();
  }

  function dispatch({ name, args }) {
    const commands = { start, pause, resume, advanceTime: () => advanceTime(args.hours), grantStarterPackage, generateDemand: () => generateDemand(args), buyEssentialItem: () => buyEssentialItem(args.resource, args.quantity, args.unitPrice), submitRequest: () => submitRequest(args.input), evaluateRequest: () => evaluateRequest(args.requestId), fundProject: () => fundProject(args.requestId), createTasks: () => createTasks(args.projectId), startProject: () => startProject(args.projectId), approveSubmittedTask: () => approveSubmittedTask(args.projectId), submitDeliverable: () => submitDeliverable(args.projectId, args.input), reviewDeliverable: () => reviewDeliverable(args.deliverableId, args.outcome), acceptDelivery: () => acceptDelivery(args.deliverableId, args.outcome, args.approvedFraction), releasePayroll: () => releasePayroll(args.projectId, args.amount), settleProject: () => settleProject(args.projectId, args.allocation), transferToHousehold: () => transferToHousehold(args.amount, args.contract), refundProject: () => refundProject(args.projectId, args.reason), bindShelterDomain: () => bindShelterDomain(args.projectId), createProvisionalFailedProject: () => createProvisionalFailedProject(args.requestId) };
    if (!commands[name]) throw new Error(`UNKNOWN_REPLAY_ACTION:${name}`);
    return commands[name]();
  }

  function replayEvents() {
    const source = clone(actions);
    state = initialState(String(seed));
    state.state_hash = computeCreatorMarketplaceHash(stateProjection(state));
    actions = [];
    replaying = true;
    for (const action of source) dispatch(action);
    replaying = false;
    actions = source;
    return getState();
  }

  return Object.freeze({
    getState, start, pause, resume, advanceTime,
    grantStarterPackage, generateDemand, buyEssentialItem,
    submitRequest, evaluateRequest, fundProject, createTasks, startProject, approveSubmittedTask,
    submitDeliverable, reviewDeliverable, acceptDelivery, releasePayroll, settleProject, transferToHousehold, refundProject,
    runStarterHouseholdDemo, runTreeLifeDemo, runBasicShelterDemo, runFailedOrderDemo,
    integrityReport, exportState, importState, resetState, replayEvents
  });
}

export const CREATOR_MARKETPLACE_BOUNDARIES = Object.freeze({
  simulation_only: true,
  real_wallet: false,
  real_kgen: false,
  onchain_transfer: false,
  production_authority: false,
  uncontrolled_mint: false,
  external_autonomy: false,
  direct_currency_energy_conversion: false,
  mutation_endpoints: false
});
