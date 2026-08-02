import { createFishpondAquacultureRuntimeV1 } from "../aquaculture/aquaculture-runtime.js";
import { createCausalWorldRuntime } from "../causal-runtime/causal-world-runtime.js";
import {
  parseStrictJson,
  REQUIRED_DIVISIONS,
  REQUIRED_GATES,
  REQUIRED_TEMPLATES
} from "../../../KAIOS/ai-company/ai-company-spec-validator.mjs";

export { REQUIRED_DIVISIONS, REQUIRED_GATES, REQUIRED_TEMPLATES };

export const AI_COMPANY_RUNTIME_ID = "KAIOS_AI_COMPANY_ORDER_AND_PROJECT_RUNTIME_V1";
export const AI_COMPANY_SCHEMA_VERSION = "1.0.0";
export const FEASIBILITY_GATES = REQUIRED_GATES;

const COMPANY_ID = "KAIOS_AI_COMPANY_V1";
const MAX_REQUESTS = 1000;
const MAX_PROJECTS = 250;
const MAX_TASKS = 5000;
const MAX_EVENTS = 10000;
const MAX_ACTIONS = 20000;
const EPSILON = 0.001;

const PHYSICAL_TEMPLATES = new Set([
  "FISHPOND_PROJECT", "BASIC_HOUSE_PROJECT", "WAREHOUSE_PROJECT", "BASIC_ROAD_PROJECT",
  "SMALL_BRIDGE_PROJECT", "WORKSHOP_PROJECT", "SMALL_FARM_PROJECT"
]);

const TRANSPORT_REQUIRED_EQUIPMENT = new Set([
  "EXCAVATOR", "PUMP", "AERATOR", "CONCRETE_MIXER", "CRANE", "TRUCK"
]);

const PROCUREMENT_TERMINAL_STATUSES = new Set([
  "PAYMENT_APPROVED", "INSPECTION_FAILED", "CANCELLED"
]);

const PROCUREMENT_SEQUENCE = Object.freeze([
  "RFQ_CREATED", "QUOTES_RECEIVED", "SUPPLIER_SELECTED", "ORDER_PLACED",
  "IN_PRODUCTION", "IN_TRANSIT", "RECEIVED", "ACCEPTED", "PAYMENT_APPROVED"
]);

const PROCUREMENT_RANK = Object.freeze(Object.fromEntries(
  PROCUREMENT_SEQUENCE.map((status, index) => [status, index])
));

const COMPANY_RECOVERY_STATUSES = new Set([
  "RESTRUCTURING_SIMULATION", "COURT_PROTECTION_SIMULATION",
  "LIQUIDATION_SIMULATION", "DISSOLVED"
]);

const FORBIDDEN_ACTIONS = Object.freeze([
  "REAL_WALLET_ACCESS", "REAL_KGEN_SETTLEMENT", "ONCHAIN_TRANSFER", "REAL_LEGAL_ENFORCEMENT",
  "PRODUCTION_DEPLOYMENT", "EXTERNAL_AUTONOMOUS_EXECUTION", "SELF_MODIFYING_PRODUCTION_CODE",
  "CANONICAL_PROMOTION", "CURRENT_MODIFICATION", "CONSTITUTION_SOURCE_MODIFICATION"
]);

const DEFAULT_CAPACITY = Object.freeze({
  max_active_projects: 6,
  max_active_physical_projects: 4,
  max_active_digital_projects: 3,
  max_compute_load: 0.8,
  max_review_queue: 24,
  max_procurement_queue: 100,
  max_worker_assignments: 120,
  max_financial_exposure: 2000000
});

const WORKER_CATALOG = Object.freeze([
  ["SURVEYOR", "PHYSICAL"], ["ARCHITECT", "DIGITAL"], ["SITE_SUPERVISOR", "PHYSICAL"],
  ["GENERAL_LABORER", "PHYSICAL"], ["EXCAVATOR_OPERATOR", "PHYSICAL"], ["PIPE_INSTALLER", "PHYSICAL"],
  ["ELECTRICIAN", "PHYSICAL"], ["AQUACULTURE_WORKER", "PHYSICAL"],
  ["WATER_QUALITY_TECHNICIAN", "PHYSICAL"], ["QA_INSPECTOR", "PHYSICAL"],
  ["PROCUREMENT_SPECIALIST", "DIGITAL"], ["LOGISTICS_PLANNER", "DIGITAL"],
  ["LIFE_SPEC_DESIGNER", "DIGITAL"], ["SOFTWARE_ENGINEER", "DIGITAL"],
  ["TEST_ENGINEER", "DIGITAL"], ["CODEX_REVIEWER", "DIGITAL"]
]);

const EQUIPMENT_CATALOG = Object.freeze({
  SURVEY_TOOL: { operator: "SURVEYOR", energy_type: "MANUAL", capacity: 1 },
  EXCAVATOR: { operator: "EXCAVATOR_OPERATOR", energy_type: "FUEL", capacity: 8000 },
  HAND_TOOL: { operator: "PHYSICAL_TASK_ASSIGNEE", energy_type: "MANUAL", capacity: 100 },
  PUMP: { operator: "PIPE_INSTALLER", energy_type: "ELECTRICITY", capacity: 5000 },
  AERATOR: { operator: "AQUACULTURE_WORKER", energy_type: "ELECTRICITY", capacity: 5000 },
  CONCRETE_MIXER: { operator: "GENERAL_LABORER", energy_type: "ELECTRICITY", capacity: 1000 },
  CRANE: { operator: "SITE_SUPERVISOR", energy_type: "FUEL", capacity: 5000 },
  TRUCK: { operator: "LOGISTICS_PLANNER", energy_type: "FUEL", capacity: 12000 },
  COMPUTER: { operator: "DIGITAL_TASK_ASSIGNEE", energy_type: "ELECTRICITY", capacity: 1 },
  SIMULATION_REVIEW_CONSOLE: { operator: "CODEX_REVIEWER", energy_type: "ELECTRICITY", capacity: 1 }
});

const task = (code, duration, skills, materials = {}, equipment = [], energy = 0, cost = 0) => ({
  code,
  objective: code.replaceAll("_", " "),
  duration,
  skills,
  materials,
  equipment,
  energy,
  cost
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const PROJECT_TEMPLATES = deepFreeze({
  FISHPOND_PROJECT: {
    kind: "PHYSICAL",
    domain_binding: "AQUACULTURE_RUNTIME_V1",
    rough_cost: 85000,
    tasks: [
      task("SITE_SURVEY", 4, ["SURVEYOR"], {}, ["SURVEY_TOOL"], 2, 600),
      task("POND_DESIGN", 6, ["ARCHITECT", "SITE_SUPERVISOR"], {}, [], 3, 1200),
      task("EXCAVATION", 12, ["EXCAVATOR_OPERATOR", "SITE_SUPERVISOR"], { GRAVEL: 12 }, ["EXCAVATOR"], 48, 4200),
      task("POND_INFRASTRUCTURE", 10, ["GENERAL_LABORER", "PIPE_INSTALLER"], { PIPE: 18, LINING: 24 }, ["HAND_TOOL", "PUMP"], 32, 3600),
      task("AQUACULTURE_RUNTIME_BINDING", 8, ["AQUACULTURE_WORKER", "WATER_QUALITY_TECHNICIAN"], { FISH_JUVENILE_STOCK: 120 }, ["AERATOR"], 24, 2600),
      task("FINAL_ACCEPTANCE", 3, ["QA_INSPECTOR"], {}, [], 2, 700)
    ],
    deliverable: "SIMULATED_CAUSAL_FISHPOND"
  },
  BASIC_HOUSE_PROJECT: {
    kind: "PHYSICAL",
    domain_binding: "CAUSAL_WORLD_CONSTRUCTION",
    rough_cost: 65000,
    tasks: [
      task("SURVEY", 4, ["SURVEYOR"], {}, ["SURVEY_TOOL"], 2, 500),
      task("DESIGN", 6, ["ARCHITECT", "SITE_SUPERVISOR"], {}, [], 3, 1000),
      task("SITE_CLEARING", 8, ["GENERAL_LABORER"], { GRAVEL: 8 }, ["HAND_TOOL"], 12, 1800),
      task("FOUNDATION", 12, ["GENERAL_LABORER", "SITE_SUPERVISOR"], { CONCRETE: 30, STEEL: 8 }, ["CONCRETE_MIXER"], 36, 4800),
      task("STRUCTURE", 12, ["GENERAL_LABORER", "SITE_SUPERVISOR"], { WOOD: 40, STEEL: 12 }, ["HAND_TOOL", "CRANE"], 30, 5200),
      task("UTILITIES", 8, ["ELECTRICIAN", "PIPE_INSTALLER"], { PIPE: 12, WIRE: 15 }, ["HAND_TOOL"], 18, 2600),
      task("FINAL_ACCEPTANCE", 3, ["QA_INSPECTOR"], {}, [], 2, 700)
    ],
    deliverable: "SIMULATED_BASIC_HOUSE"
  },
  SMALL_FARM_PROJECT: {
    kind: "PHYSICAL",
    domain_binding: "FOREST_AGRICULTURE_SPECIFICATION_ONLY",
    rough_cost: 45000,
    blocked_dependency: "KAIOS_FOREST_AND_AGRICULTURE_RUNTIME_V1",
    tasks: [],
    deliverable: "SPECIFICATION_ONLY_SMALL_FARM"
  },
  WAREHOUSE_PROJECT: {
    kind: "PHYSICAL", domain_binding: "GENERIC_CAUSAL_PROJECT", rough_cost: 72000,
    tasks: [task("SURVEY", 4, ["SURVEYOR"], {}, ["SURVEY_TOOL"], 2, 500), task("DESIGN", 6, ["ARCHITECT"], {}, [], 3, 1000), task("FOUNDATION", 12, ["GENERAL_LABORER"], { CONCRETE: 40, STEEL: 12 }, ["CONCRETE_MIXER"], 30, 4300), task("STRUCTURE", 14, ["GENERAL_LABORER", "SITE_SUPERVISOR"], { STEEL: 30 }, ["CRANE"], 35, 5200), task("FINAL_ACCEPTANCE", 3, ["QA_INSPECTOR"], {}, [], 2, 700)],
    deliverable: "SIMULATED_WAREHOUSE"
  },
  BASIC_ROAD_PROJECT: {
    kind: "PHYSICAL", domain_binding: "GENERIC_CAUSAL_PROJECT", rough_cost: 90000,
    tasks: [task("ROUTE_SURVEY", 6, ["SURVEYOR"], {}, ["SURVEY_TOOL"], 3, 800), task("ROADBED", 18, ["EXCAVATOR_OPERATOR", "GENERAL_LABORER"], { GRAVEL: 60 }, ["EXCAVATOR"], 45, 6500), task("SURFACE", 16, ["GENERAL_LABORER", "SITE_SUPERVISOR"], { CONCRETE: 50 }, ["CONCRETE_MIXER"], 38, 6200), task("FINAL_ACCEPTANCE", 4, ["QA_INSPECTOR"], {}, [], 2, 800)],
    deliverable: "SIMULATED_BASIC_ROAD"
  },
  SMALL_BRIDGE_PROJECT: {
    kind: "PHYSICAL", domain_binding: "GENERIC_CAUSAL_PROJECT", rough_cost: 140000,
    tasks: [task("BRIDGE_SURVEY", 8, ["SURVEYOR", "SITE_SUPERVISOR"], {}, ["SURVEY_TOOL"], 4, 1200), task("FOUNDATION", 20, ["GENERAL_LABORER", "EXCAVATOR_OPERATOR"], { CONCRETE: 70, STEEL: 25 }, ["EXCAVATOR", "CONCRETE_MIXER"], 60, 9000), task("SPAN", 20, ["GENERAL_LABORER", "SITE_SUPERVISOR"], { STEEL: 60 }, ["CRANE"], 70, 11000), task("LOAD_TEST", 6, ["QA_INSPECTOR"], {}, [], 4, 1300)],
    deliverable: "SIMULATED_SMALL_BRIDGE"
  },
  WORKSHOP_PROJECT: {
    kind: "PHYSICAL", domain_binding: "GENERIC_CAUSAL_PROJECT", rough_cost: 78000,
    tasks: [task("SURVEY", 4, ["SURVEYOR"], {}, ["SURVEY_TOOL"], 2, 500), task("DESIGN", 6, ["ARCHITECT"], {}, [], 3, 1000), task("FOUNDATION", 12, ["GENERAL_LABORER"], { CONCRETE: 35, STEEL: 10 }, ["CONCRETE_MIXER"], 30, 4300), task("WORKSHOP_BUILD", 16, ["GENERAL_LABORER", "ELECTRICIAN"], { STEEL: 25, WIRE: 18 }, ["HAND_TOOL", "CRANE"], 40, 6200), task("FINAL_ACCEPTANCE", 3, ["QA_INSPECTOR"], {}, [], 2, 700)],
    deliverable: "SIMULATED_WORKSHOP"
  },
  LIFE_PACKAGE_PROJECT: {
    kind: "DIGITAL", domain_binding: "CANDIDATE_LIFE_WORKFLOW", rough_cost: 12000,
    tasks: [task("REQUIREMENTS", 2, ["LIFE_SPEC_DESIGNER"], {}, [], 4, 600), task("CANDIDATE_PACKAGE", 8, ["LIFE_SPEC_DESIGNER"], {}, ["COMPUTER"], 20, 2400), task("VALIDATION_TESTS", 4, ["TEST_ENGINEER"], {}, ["COMPUTER"], 12, 1200), task("CODEX_REVIEW", 3, ["CODEX_REVIEWER"], {}, ["SIMULATION_REVIEW_CONSOLE"], 8, 900)],
    deliverable: "CANDIDATE_LIFE_PACKAGE"
  },
  SOFTWARE_MODULE_PROJECT: {
    kind: "DIGITAL", domain_binding: "SOFTWARE_PROJECT_WORKFLOW", rough_cost: 16000,
    tasks: [task("SPECIFICATION", 3, ["ARCHITECT"], {}, ["COMPUTER"], 8, 900), task("IMPLEMENTATION", 10, ["SOFTWARE_ENGINEER"], {}, ["COMPUTER"], 30, 3000), task("TESTS", 5, ["TEST_ENGINEER"], {}, ["COMPUTER"], 15, 1500), task("CODEX_REVIEW", 3, ["CODEX_REVIEWER"], {}, ["SIMULATION_REVIEW_CONSOLE"], 8, 900)],
    deliverable: "LOCAL_WORLD_VIEWER_MODULE"
  }
});

const MATERIAL_PROFILES = Object.freeze({
  WOOD: { unit_mass: 10, unit_cost: 12 }, STONE: { unit_mass: 10, unit_cost: 10 },
  SOIL: { unit_mass: 10, unit_cost: 5 }, SAND: { unit_mass: 10, unit_cost: 8 },
  GRAVEL: { unit_mass: 10, unit_cost: 12 }, STEEL: { unit_mass: 10, unit_cost: 45 },
  CEMENT: { unit_mass: 10, unit_cost: 15 }, CONCRETE: { unit_mass: 10, unit_cost: 18 },
  FUEL: { unit_mass: 0.8, unit_cost: 2 }, ELECTRICITY: { unit_mass: 0, unit_cost: 1 },
  PIPE: { unit_mass: 2, unit_cost: 12 }, WIRE: { unit_mass: 0.2, unit_cost: 12 },
  LINING: { unit_mass: 4, unit_cost: 12 }, FISH_JUVENILE_STOCK: { unit_mass: 0.1, unit_cost: 3 }
});

function materialProfile(materialId) {
  return MATERIAL_PROFILES[materialId] ?? null;
}

const clone = (value) => globalThis.structuredClone ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
const round = (value, digits = 3) => Number(Number(value).toFixed(digits));
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const money = (value) => round(value, 2);

function normalizeInput(value) {
  if (value === undefined) return null;
  if (typeof value === "number" && !Number.isFinite(value)) return `NONFINITE_INPUT:${String(value)}`;
  if (Array.isArray(value)) return value.map(normalizeInput);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeInput(item)]));
  return value;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

const SHA256_K = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256Text(text) {
  const bytes = new TextEncoder().encode(text);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  const words = new Uint32Array(64);
  const hash = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits));
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0; hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0; hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0; hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0; hash[7] = (hash[7] + h) >>> 0;
  }
  return [...hash].map((word) => word.toString(16).padStart(8, "0")).join("");
}

export function computeAiCompanyStateHash(value) {
  return sha256Text(stableStringify(value));
}

function stateProjection(state) {
  const projected = clone(state);
  projected.events = (projected.events ?? []).map((event) => {
    const copy = { ...event };
    delete copy.next_state_hash;
    return copy;
  });
  return projected;
}

function eventPayloadProjection(event) {
  const projected = clone(event);
  delete projected.event_payload_hash;
  delete projected.next_state_hash;
  return projected;
}

function eventPayloadHash(event) {
  return computeAiCompanyStateHash(eventPayloadProjection(event));
}

function projectTemplateFor(value) {
  const text = String(value ?? "").toUpperCase();
  if (text.includes("FISHPOND") || text.includes("FISH POND")) return "FISHPOND_PROJECT";
  if (text.includes("HOUSE") || text.includes("HOME")) return "BASIC_HOUSE_PROJECT";
  if (text.includes("FARM")) return "SMALL_FARM_PROJECT";
  if (text.includes("WAREHOUSE")) return "WAREHOUSE_PROJECT";
  if (text.includes("BRIDGE")) return "SMALL_BRIDGE_PROJECT";
  if (text.includes("ROAD")) return "BASIC_ROAD_PROJECT";
  if (text.includes("WORKSHOP") || text.includes("FACTORY")) return "WORKSHOP_PROJECT";
  if (text.includes("LIFE_PACKAGE") || text.includes("LIFE PACKAGE") || text.includes("CROP CANDIDATE") || text.includes("SPECIES PACKAGE")) return "LIFE_PACKAGE_PROJECT";
  if (text.includes("SOFTWARE") || text.includes("WORLD VIEWER") || text.includes("VIEWER PANEL")) return "SOFTWARE_MODULE_PROJECT";
  return null;
}

function divisionRecord(divisionId) {
  return {
    division_id: divisionId,
    authority: "SIMULATION_COORDINATION_ONLY",
    allowed_actions: ["READ_SIMULATION_STATE", "PROPOSE_SIMULATION_ACTION", "RECORD_REVIEW_RESULT"],
    forbidden_actions: [...FORBIDDEN_ACTIONS],
    required_inputs: ["APPROVED_UPSTREAM_OUTPUT"],
    outputs: ["SIMULATION_ONLY_REVIEWED_OUTPUT"],
    review_gate: divisionId.replace("_DIVISION", "_GATE"),
    responsible_agent: `KAIOS-SIMULATED-${divisionId.replace("_DIVISION", "")}`,
    event_history: [],
    cost_center: `COST-${divisionId}`,
    status: "READY"
  };
}

function workerRecord(skill, bodyType, index) {
  return {
    worker_id: `AI-COMPANY-WORKER-${String(index + 1).padStart(3, "0")}`,
    life_id: `LIFE-AI-COMPANY-WORKER-${String(index + 1).padStart(3, "0")}`,
    role: skill,
    skill,
    body_type: bodyType,
    location: bodyType === "PHYSICAL" ? "KAIOS-SIMULATION-YARD" : "LOCAL_SIMULATION_WORKSPACE",
    shift: { start: 0, end: 24, maximum_hours: bodyType === "PHYSICAL" ? 12 : 16 },
    cost: bodyType === "PHYSICAL" ? 30 : 42,
    availability: true,
    travel_time: bodyType === "PHYSICAL" ? 1 : 0,
    assigned_tasks: [],
    safety_qualification: true,
    equipment_qualification: true,
    status: "AVAILABLE"
  };
}

function equipmentRecord(type, details, index) {
  return {
    equipment_id: `AI-COMPANY-EQUIPMENT-${String(index + 1).padStart(3, "0")}`,
    type,
    owner: "KAIOS_SIMULATED_EQUIPMENT_POOL",
    operator_requirement: details.operator,
    location: "KAIOS-SIMULATION-YARD",
    availability: true,
    capacity: details.capacity,
    energy_type: details.energy_type,
    fuel_or_charge: details.energy_type === "MANUAL" ? 1 : 100,
    maintenance_state: "READY",
    wear: 0,
    transport_requirement: TRANSPORT_REQUIRED_EQUIPMENT.has(type) ? "HEAVY_CAUSAL_TRANSPORT" : "STANDARD_ROUTE",
    reservation_start: 0,
    reservation_end: 0,
    cost: details.energy_type === "MANUAL" ? 10 : 75,
    status: "AVAILABLE"
  };
}

function createInitialState(seed, initialCash, capacityOverrides) {
  const capacityLimits = { ...DEFAULT_CAPACITY, ...clone(capacityOverrides ?? {}) };
  const capacity = {
    ...capacityLimits,
    active_projects: 0,
    active_physical_projects: 0,
    active_digital_projects: 0,
    compute_load: 0,
    review_queue: 0,
    procurement_queue: 0,
    worker_assignments: 0,
    financial_exposure: 0,
    status: "AVAILABLE"
  };
  return {
    schema_version: AI_COMPANY_SCHEMA_VERSION,
    runtime: AI_COMPANY_RUNTIME_ID,
    mode: "LOCAL_DETERMINISTIC_SIMULATION",
    seed: String(seed),
    simulation_time: 0,
    revision: 0,
    runtime_status: "PAUSED",
    company: {
      company_id: COMPANY_ID,
      company_type: "SIMULATED_PROJECT_COORDINATOR",
      status: "OPERATING",
      divisions: REQUIRED_DIVISIONS.map(divisionRecord),
      finance: { currency: "SIMULATED_CREDIT", cash: money(initialCash), financial_exposure: 0 },
      authority: { simulation_only: true, external_execution: false, real_legal_effect: false, production_authority: false }
    },
    requests: [],
    clarifications: [],
    analyses: [],
    feasibility_reviews: [],
    proposals: [],
    projects: [],
    resource_plans: [],
    contracts: [],
    procurement_orders: [],
    inspections: [],
    change_orders: [],
    deliveries: [],
    maintenance_plans: [],
    company_recovery: [],
    workforce_pool: WORKER_CATALOG.map(([skill, bodyType], index) => workerRecord(skill, bodyType, index)),
    equipment_pool: Object.entries(EQUIPMENT_CATALOG).map(([type, details], index) => equipmentRecord(type, details, index)),
    worker_reservations: [],
    equipment_reservations: [],
    material_inventory: {},
    task_windows: {},
    finance: {
      opening_cash: money(initialCash), cash: money(initialCash), receivables: 0, payables: 0,
      work_in_progress: 0, inventory: 0, equipment: 0, payroll: 0, supplier_obligations: 0,
      customer_deposits: 0, project_revenue: 0, project_cost: 0, profit_or_loss: 0,
      debt: 0, tax_simulation: 0, insurance_simulation: 0, risk_reserve: 0
    },
    ledger: [],
    capacity,
    events: [],
    action_log: [],
    boundaries: {
      simulation_only: true,
      wallet_access: false,
      real_wallet: false,
      real_kgen: false,
      onchain_transfer: false,
      real_legal_effect: false,
      production_authority: false,
      external_autonomous_execution: false,
      unbounded_spending: false,
      self_modifying_production_code: false,
      constitution_source_modification: false,
      current_modification: false,
      mutation_endpoints: false
    }
  };
}

function domainBindingEvidence(templateId, seed) {
  if (templateId === "FISHPOND_PROJECT") {
    const runtime = createFishpondAquacultureRuntimeV1({ seed: `${seed}-AQUACULTURE-BINDING` });
    const state = runtime.getState();
    const report = runtime.integrityReport();
    runtime.destroy();
    return { runtime: state.runtime, integrity_verified: report.ok, simulation_only: state.boundaries.simulation_only, authority: state.authority, adapter: "EXISTING_RUNTIME_REFERENCE", execution_status: "PENDING" };
  }
  if (templateId === "BASIC_HOUSE_PROJECT") {
    const runtime = createCausalWorldRuntime({ seed: `${seed}-CAUSAL-BINDING`, storage: null });
    const report = runtime.integrityReport();
    return { runtime: report.runtime, integrity_verified: report.ok, simulation_only: report.simulation_only, authority: "NO_PRODUCTION_AUTHORITY", adapter: "EXISTING_RUNTIME_REFERENCE", execution_status: "PENDING" };
  }
  if (templateId === "SMALL_FARM_PROJECT") return { runtime: null, integrity_verified: false, simulation_only: true, authority: "NO_PRODUCTION_AUTHORITY", adapter: "BLOCKED_DEPENDENCY" };
  if (templateId === "LIFE_PACKAGE_PROJECT") return { runtime: "WORKER_REGISTRY_CANDIDATE_WORKFLOW", integrity_verified: true, simulation_only: true, authority: "CANDIDATE_ONLY", adapter: "EXISTING_GOVERNANCE_REFERENCE" };
  if (templateId === "SOFTWARE_MODULE_PROJECT") return { runtime: "LOCAL_SOFTWARE_PROJECT_WORKFLOW", integrity_verified: true, simulation_only: true, authority: "NO_EXTERNAL_DEPLOYMENT", adapter: "LOCAL_SIMULATION_ONLY" };
  return { runtime: "REAL_CAUSAL_WORLD_FOUNDATION", integrity_verified: true, simulation_only: true, authority: "NO_PRODUCTION_AUTHORITY", adapter: "EXISTING_CONTRACT_REFERENCE" };
}

function executeCanonicalDomainBinding(templateId, seed, location) {
  if (templateId === "FISHPOND_PROJECT") {
    const runtime = createFishpondAquacultureRuntimeV1({ seed: `${seed}-AQUACULTURE-EXECUTION` });
    try {
      runtime.start();
      const selected = runtime.selectLand({ land_parcel_id: location ?? "LAND-KAIOS-FISHPOND-001" });
      const designed = runtime.designPond();
      if (selected.status === "BLOCKED" || designed.status === "BLOCKED") {
        return { ok: false, reason: selected.reason ?? designed.reason, runtime: "KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1" };
      }
      let guard = 0;
      while (runtime.getState().pond.status !== "READY_FOR_STOCKING" && guard < 32) {
        const result = runtime.advanceConstruction(168);
        if (result.status === "BLOCKED") return { ok: false, reason: result.reason, runtime: runtime.getState().runtime };
        guard += 1;
      }
      if (runtime.getState().pond.status !== "READY_FOR_STOCKING") return { ok: false, reason: "CANONICAL_FISHPOND_STAGE_LIMIT", runtime: runtime.getState().runtime };
      runtime.testWater();
      const stocked = runtime.stockFish(120, {
        stock_available: true, transport_available: true,
        health_check_passed: true, quarantine_complete: true
      });
      const snapshot = runtime.getState();
      const report = runtime.integrityReport();
      return {
        ok: report.ok && stocked.status === "COMPLETED",
        reason: report.ok ? stocked.reason ?? null : report.issues.join(","),
        runtime: snapshot.runtime,
        adapter: "EXECUTED_CANONICAL_RUNTIME",
        execution_status: report.ok && stocked.status === "COMPLETED" ? "COMPLETE" : "BLOCKED",
        construction_stages: clone(snapshot.construction.completed_stages),
        final_stage: snapshot.construction.stage,
        pond_status: snapshot.pond.status,
        population_count: snapshot.populations.reduce((sum, population) => sum + population.count, 0),
        event_count: snapshot.events.length,
        integrity_verified: report.ok,
        simulation_only: true,
        authority: snapshot.authority
      };
    } finally {
      runtime.destroy();
    }
  }
  if (templateId === "BASIC_HOUSE_PROJECT") {
    const runtime = createCausalWorldRuntime({ seed: `${seed}-CAUSAL-HOUSE-EXECUTION`, storage: null });
    let guard = 0;
    while (runtime.getSnapshot().project.stage !== "COMPLETE" && guard < 64) {
      const result = runtime.advanceProject(21600);
      if (result.status === "BLOCKED") return { ok: false, reason: result.reason, runtime: "REAL_CAUSAL_WORLD_FOUNDATION" };
      guard += 1;
    }
    const snapshot = runtime.getSnapshot();
    const report = runtime.integrityReport();
    return {
      ok: report.ok && snapshot.project.stage === "COMPLETE",
      reason: report.ok ? null : report.issues.join(","),
      runtime: report.runtime,
      adapter: "EXECUTED_CANONICAL_RUNTIME",
      execution_status: snapshot.project.stage === "COMPLETE" ? "COMPLETE" : "BLOCKED",
      construction_stages: clone(snapshot.project.completed_stages),
      final_stage: snapshot.project.stage,
      event_count: snapshot.events.length,
      integrity_verified: report.ok,
      simulation_only: true,
      authority: "NO_PRODUCTION_AUTHORITY"
    };
  }
  return null;
}

function riskAssessmentFor(templateId) {
  const physical = PHYSICAL_TEMPLATES.has(templateId);
  const risks = [
    ["SCHEDULE_RISK", physical ? 0.25 : 0.15, "DEPENDENCY_AND_TIME_BUFFER"],
    ["RESOURCE_AVAILABILITY_RISK", physical ? 0.3 : 0.1, "EXPLICIT_PROCUREMENT_GATES"],
    ["FINANCIAL_EXPOSURE_RISK", 0.2, "BOUNDED_BUDGET_AND_CAPACITY"],
    [physical ? "SITE_SAFETY_RISK" : "REVIEW_QUEUE_RISK", physical ? 0.2 : 0.15, physical ? "STAGE_SAFETY_INSPECTIONS" : "BOUNDED_REVIEW_QUEUE"]
  ];
  return risks.map(([riskType, probability, mitigation], index) => ({
    risk_id: `${templateId}-RISK-${String(index + 1).padStart(2, "0")}`,
    risk_type: riskType,
    probability,
    impact: probability >= 0.25 ? "MEDIUM" : "LOW",
    mitigation,
    status: "MONITORED",
    simulation_only: true
  }));
}

function topologicalOrder(project) {
  const taskIds = project.tasks.map(({ task_id }) => task_id);
  const indegree = Object.fromEntries(taskIds.map((id) => [id, 0]));
  const successors = Object.fromEntries(taskIds.map((id) => [id, []]));
  for (const edge of project.dependencies) {
    if (!(edge.predecessor_task_id in indegree) || !(edge.successor_task_id in indegree)) return { order: [], cycle: true, reason: "DEPENDENCY_REFERENCE_MISSING" };
    indegree[edge.successor_task_id] += 1;
    successors[edge.predecessor_task_id].push(edge.successor_task_id);
  }
  const queue = taskIds.filter((id) => indegree[id] === 0);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const successor of successors[id]) {
      indegree[successor] -= 1;
      if (indegree[successor] === 0) queue.push(successor);
    }
  }
  return { order, cycle: order.length !== taskIds.length, reason: order.length === taskIds.length ? null : "PROJECT_DEPENDENCY_CYCLE" };
}

function intervalsOverlap(left, right) {
  return Math.max(left.start, right.start) < Math.min(left.end, right.end);
}

function unique(values) {
  return [...new Set(values)];
}

function hasForbiddenObjectKey(value) {
  if (!value || typeof value !== "object") return false;
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return true;
  if (Object.keys(value).some((key) => ["__proto__", "prototype", "constructor"].includes(key))) return true;
  return Object.values(value).some(hasForbiddenObjectKey);
}

function allNumbers(value) {
  if (typeof value === "number") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(allNumbers);
}

function isTerminalProject(project) {
  return project.closed_at !== null || ["CANCELLED", "FAILED"].includes(project.status);
}

function validateCapacityConfiguration(capacity) {
  const contracts = {
    max_active_projects: [1, 100, true], max_active_physical_projects: [0, 50, true],
    max_active_digital_projects: [0, 100, true], max_compute_load: [0, 1, false],
    max_review_queue: [1, 1000, true], max_procurement_queue: [1, 1000, true],
    max_worker_assignments: [1, 10000, true], max_financial_exposure: [0, Number.MAX_SAFE_INTEGER, false]
  };
  for (const [key, [minimum, maximum, integer]] of Object.entries(contracts)) {
    const value = capacity[key];
    if (!Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) throw new Error(`INVALID_CAPACITY_CONFIGURATION:${key}`);
  }
}

export function createKaiosAiCompanyRuntimeV1({
  seed = "KAIOS-AI-COMPANY-V1-001",
  initialCash = 500000,
  capacity = {}
} = {}) {
  const configuredSeed = String(seed);
  const configuredCash = money(Number(initialCash));
  const configuredCapacity = clone(capacity);
  if (!Number.isFinite(configuredCash) || configuredCash < 0) throw new Error("INVALID_INITIAL_CASH");
  validateCapacityConfiguration({ ...DEFAULT_CAPACITY, ...configuredCapacity });
  let state = createInitialState(configuredSeed, configuredCash, configuredCapacity);
  let destroyed = false;
  const listeners = new Set();
  const usable = () => { if (destroyed) throw new Error("RUNTIME_DESTROYED"); };
  const getState = () => clone(state);
  const emit = () => listeners.forEach((listener) => listener(getState()));
  const findRequest = (requestId) => state.requests.find(({ request_id }) => request_id === requestId);
  const findProposal = (proposalId) => state.proposals.find(({ proposal_id }) => proposal_id === proposalId);
  const findProject = (projectId) => state.projects.find(({ project_id }) => project_id === projectId);
  const findTask = (project, taskId) => project?.tasks.find(({ task_id }) => task_id === taskId);
  const findPlan = (projectId) => state.resource_plans.find(({ project_id }) => project_id === projectId);
  const findContract = (projectId) => state.contracts.find((contract) => contract.project_id === projectId);

  function updateFinanceStatus() {
    state.finance.profit_or_loss = money(state.finance.project_revenue - state.finance.project_cost);
    state.company.finance.cash = state.finance.cash;
    state.company.finance.financial_exposure = state.capacity.financial_exposure;
    if (COMPANY_RECOVERY_STATUSES.has(state.company.status)) return;
    if (state.finance.cash <= EPSILON && state.finance.payables > 0) state.company.status = "INSOLVENT";
    else if (state.finance.payables > Math.max(1, state.finance.cash) * 2) state.company.status = "DISTRESS";
    else if (state.finance.cash < 10000) state.company.status = "CASH_FLOW_WARNING";
    else if (state.company.status !== "OVER_CAPACITY") state.company.status = "OPERATING";
  }

  function updateCapacity() {
    const active = state.projects.filter((project) => !isTerminalProject(project));
    state.capacity.active_projects = active.length;
    state.capacity.active_physical_projects = active.filter((project) => project.project_kind === "PHYSICAL").length;
    state.capacity.active_digital_projects = active.filter((project) => project.project_kind === "DIGITAL").length;
    state.capacity.compute_load = round(active.filter((project) => project.project_kind === "DIGITAL").reduce((sum, project) => sum + project.compute_reservation, 0), 3);
    state.capacity.review_queue = state.projects.flatMap((project) => project.tasks).filter(({ status }) => status === "INSPECTION_PENDING").length;
    state.capacity.procurement_queue = state.procurement_orders.filter(({ status }) => !PROCUREMENT_TERMINAL_STATUSES.has(status)).length;
    state.capacity.worker_assignments = state.worker_reservations.filter(({ status }) => !["COMPLETE", "RELEASED", "CANCELLED"].includes(status)).length;
    state.capacity.financial_exposure = money(active.reduce((sum, project) => sum + project.capacity_reserved, 0));
    const ratios = [
      state.capacity.active_projects / state.capacity.max_active_projects,
      state.capacity.active_physical_projects / Math.max(1, state.capacity.max_active_physical_projects),
      state.capacity.active_digital_projects / Math.max(1, state.capacity.max_active_digital_projects),
      state.capacity.compute_load / Math.max(EPSILON, state.capacity.max_compute_load),
      state.capacity.review_queue / state.capacity.max_review_queue,
      state.capacity.procurement_queue / state.capacity.max_procurement_queue,
      state.capacity.worker_assignments / state.capacity.max_worker_assignments,
      state.capacity.financial_exposure / Math.max(1, state.capacity.max_financial_exposure)
    ];
    state.capacity.status = Math.max(...ratios) >= 0.8 ? "NEAR_CAPACITY" : "AVAILABLE";
    state.company.finance.financial_exposure = state.capacity.financial_exposure;
  }

  function postLedger(eventType, projectId, debitAccount, creditAccount, amount, deltas = {}) {
    const value = money(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    const normalizedDeltas = {
      cash: 0, receivables: 0, payables: 0, work_in_progress: 0, inventory: 0,
      equipment: 0, payroll: 0, supplier_obligations: 0, customer_deposits: 0,
      project_revenue: 0, project_cost: 0, debt: 0, tax_simulation: 0,
      insurance_simulation: 0, risk_reserve: 0,
      ...deltas
    };
    for (const [key, delta] of Object.entries(normalizedDeltas)) {
      if (!Number.isFinite(delta) || !(key in state.finance)) throw new Error("INVALID_LEDGER_DELTA");
      state.finance[key] = money(state.finance[key] + delta);
      if (state.finance[key] < -EPSILON && key !== "profit_or_loss") throw new Error(`NEGATIVE_LEDGER_ACCOUNT:${key}`);
    }
    const entry = {
      entry_id: `AI-COMPANY-LEDGER-${String(state.ledger.length + 1).padStart(6, "0")}`,
      simulation_time: state.simulation_time,
      project_id: projectId,
      event_type: eventType,
      debit_account: debitAccount,
      credit_account: creditAccount,
      debit_amount: value,
      credit_amount: value,
      deltas: normalizedDeltas,
      balanced: true,
      currency: "SIMULATED_CREDIT",
      simulation_only: true
    };
    state.ledger.push(entry);
    updateFinanceStatus();
    return entry;
  }

  function chargeProject(project, eventType, amount, account = "PROJECT_WORK_IN_PROGRESS") {
    const value = money(amount);
    if (!(value > 0)) return { ok: true, amount: 0, cash_delta: 0 };
    if (!project.budget || project.budget.status === "UNFUNDED") return { ok: false, reason: "NO_BUDGET" };
    if (project.budget.spent + project.budget.committed + value > project.budget.approved_budget + EPSILON) return { ok: false, reason: "NO_BUDGET" };
    const paid = money(Math.min(state.finance.cash, value));
    const unpaid = money(value - paid);
    project.budget.spent = money(project.budget.spent + value);
    project.budget.remaining = money(project.budget.approved_budget - project.budget.spent - project.budget.committed);
    project.accounting.cost = money(project.accounting.cost + value);
    project.accounting.work_in_progress = money(project.accounting.work_in_progress + value);
    postLedger(eventType, project.project_id, account, unpaid > 0 ? "CASH_AND_PAYABLES" : "CASH", value, {
      cash: -paid,
      payables: unpaid,
      supplier_obligations: unpaid,
      work_in_progress: value,
      project_cost: value,
      payroll: eventType.includes("LABOR") ? value : 0
    });
    return { ok: true, amount: value, cash_delta: -paid, payable_delta: unpaid };
  }

  function recognizeProjectRevenue(project, contract) {
    const price = money(contract.price);
    const deposit = money(contract.deposit_amount);
    if (deposit > 0) {
      postLedger("CUSTOMER_DEPOSIT_RECOGNIZED", project.project_id, "CUSTOMER_DEPOSITS", "PROJECT_REVENUE", deposit, {
        customer_deposits: -deposit,
        project_revenue: deposit
      });
    }
    const remainder = money(price - deposit);
    if (remainder > 0) {
      postLedger("PROJECT_REVENUE_RECOGNIZED", project.project_id, "ACCOUNTS_RECEIVABLE", "PROJECT_REVENUE", remainder, {
        receivables: remainder,
        project_revenue: remainder
      });
    }
    project.accounting.revenue = price;
  }

  function eventStatus(status) {
    if (["BLOCKED", "REJECTED", "NEEDS_CLARIFICATION", "REWORK_REQUIRED"].includes(status)) return "BLOCKED";
    if (["FAILED", "CANCELLED"].includes(status)) return "FAILED";
    if (["ACCEPTED", "ACCEPTED_WITH_CONDITIONS"].includes(status)) return "ACCEPTED";
    return "COMPLETED";
  }

  function record(command, args, context, result, previousStateHash) {
    state.revision += 1;
    updateCapacity();
    updateFinanceStatus();
    state.action_log.push({
      action_id: `AI-COMPANY-ACTION-${String(state.action_log.length + 1).padStart(6, "0")}`,
      command,
      args: normalizeInput(args),
      result_status: result.status,
      result_reason: result.reason ?? null
    });
    const event = {
      event_id: `AI-COMPANY-EVT-${String(state.revision).padStart(6, "0")}`,
      company_id: COMPANY_ID,
      request_id: result.request_id ?? context.request_id ?? null,
      project_id: result.project_id ?? context.project_id ?? null,
      work_package_id: result.work_package_id ?? context.work_package_id ?? null,
      task_id: result.task_id ?? context.task_id ?? null,
      actor_life_id: context.actor_life_id ?? "KAIOS-SIMULATED-COMPANY-OPERATOR",
      division_id: context.division_id ?? "ARCHITECTURE_DIVISION",
      simulation_time: state.simulation_time,
      location: result.location ?? context.location ?? null,
      event_type: command,
      inputs: normalizeInput(args),
      outputs: clone(result.outputs ?? {}),
      material_delta: result.material_delta ?? 0,
      energy_delta: result.energy_delta ?? 0,
      labor_delta: result.labor_delta ?? 0,
      equipment_delta: result.equipment_delta ?? 0,
      inventory_delta: result.inventory_delta ?? 0,
      cash_delta: result.cash_delta ?? 0,
      progress_delta: result.progress_delta ?? 0,
      risk_delta: result.risk_delta ?? 0,
      previous_state_hash: previousStateHash,
      event_payload_hash: null,
      next_state_hash: null,
      seed: state.seed,
      status: eventStatus(result.status),
      reason: result.reason ?? null
    };
    event.event_payload_hash = eventPayloadHash(event);
    state.events.push(event);
    if (state.events.length > MAX_EVENTS) state.events.shift();
    event.next_state_hash = computeAiCompanyStateHash(stateProjection(state));
    emit();
    return clone({ ...result, event });
  }

  function execute(command, args, context, mutation) {
    usable();
    if (state.action_log.length >= MAX_ACTIONS) throw new Error("ACTION_LOG_LIMIT_REACHED");
    const previousStateHash = computeAiCompanyStateHash(stateProjection(state));
    const before = clone(state);
    let result;
    try {
      result = mutation() ?? { status: "COMPLETED", outputs: {} };
      if (allNumbers(state).some((value) => !Number.isFinite(value))) throw new Error("NONFINITE_RUNTIME_STATE");
      if (hasForbiddenObjectKey(state)) throw new Error("FORBIDDEN_OBJECT_KEY");
    } catch (error) {
      state = before;
      throw error;
    }
    return record(command, args, context, result, previousStateHash);
  }

  function start() {
    return execute("START_RUNTIME", {}, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      state.runtime_status = "RUNNING";
      return { status: "COMPLETED", outputs: { runtime_status: state.runtime_status } };
    });
  }

  function pause() {
    return execute("PAUSE_RUNTIME", {}, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      state.runtime_status = "PAUSED";
      return { status: "COMPLETED", outputs: { runtime_status: state.runtime_status } };
    });
  }

  function resume() {
    return execute("RESUME_RUNTIME", {}, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      state.runtime_status = "RUNNING";
      return { status: "COMPLETED", outputs: { runtime_status: state.runtime_status } };
    });
  }

  function stop() {
    return execute("STOP_RUNTIME", {}, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      state.runtime_status = "STOPPED";
      return { status: "COMPLETED", outputs: { runtime_status: state.runtime_status } };
    });
  }

  function assumptionRecord(requestId, index, field, description, reason, risk = "LOW") {
    return {
      assumption_id: `${requestId}-ASSUMPTION-${String(index).padStart(3, "0")}`,
      field,
      description,
      reason,
      risk,
      customer_visibility: true,
      approval_status: "PENDING",
      label: "SIMULATION_ASSUMPTION"
    };
  }

  function submitRequest(input = {}) {
    return execute("SUBMIT_REQUEST", { input }, { division_id: "CUSTOMER_SERVICE_DIVISION", actor_life_id: input.customer_life_id ?? null }, () => {
      if (state.requests.length >= MAX_REQUESTS) return { status: "BLOCKED", reason: "REQUEST_LIMIT_REACHED" };
      const requestText = String(input.request_text ?? "").trim();
      const requestedObject = String(input.requested_object ?? requestText).trim();
      if (!requestText || !requestedObject) return { status: "BLOCKED", reason: "REQUEST_TEXT_REQUIRED" };
      const prohibited = /NUCLEAR|MILITARY|REAL_BANK|REAL GOVERNMENT|AUTONOMOUS CONSTRUCTION|WEAPON/i.test(`${requestText} ${requestedObject}`);
      if (prohibited) return { status: "REJECTED", reason: "HOLD_HIGH_RISK" };
      const templateId = projectTemplateFor(`${requestedObject} ${requestText}`);
      const request = {
        request_id: `AI-COMPANY-REQ-${String(state.requests.length + 1).padStart(5, "0")}`,
        customer_life_id: String(input.customer_life_id ?? "LIFE-SIMULATED-CUSTOMER-001"),
        customer_type: input.customer_type ?? "PLAYER",
        request_text: requestText,
        requested_object: requestedObject,
        requested_location: input.requested_location ?? null,
        requested_quantity: Number(input.requested_quantity ?? 1),
        requested_quality: String(input.requested_quality ?? "STANDARD_SIMULATION"),
        requested_deadline: input.requested_deadline === null || input.requested_deadline === undefined ? null : Number(input.requested_deadline),
        requested_budget: Number(input.requested_budget ?? 0),
        intended_use: String(input.intended_use ?? ""),
        civilization_context: String(input.civilization_context ?? "INDUSTRIAL"),
        rights_context: Array.isArray(input.rights_context) ? clone(input.rights_context) : [],
        risk_level: input.risk_level ?? "MEDIUM",
        priority: input.priority ?? "NORMAL",
        created_at: state.simulation_time,
        status: templateId ? "SUBMITTED" : "REJECTED",
        structured_requirements: Object.fromEntries(["functional", "physical", "location", "resource", "worker", "technology", "rights", "civilization", "safety", "economic", "quality", "delivery", "maintenance"].map((key) => [key, []])),
        assumptions: [],
        template_id: templateId
      };
      if (!Number.isFinite(request.requested_quantity) || request.requested_quantity <= 0 || request.requested_quantity > 10000 || !Number.isFinite(request.requested_budget) || request.requested_budget < 0) return { status: "BLOCKED", reason: "INVALID_REQUEST_NUMERIC_INPUT" };
      const defaults = [
        ["customer_life_id", "Use a local simulated customer Life ID", "Customer Life ID was not supplied", "LOW"],
        ["customer_type", "Treat the requester as a player", "Customer type was not supplied", "LOW"],
        ["requested_quantity", "Use one simulation unit", "Requested quantity was not supplied", "LOW"],
        ["requested_quality", "Use the standard simulation quality profile", "Requested quality was not supplied", "LOW"],
        ["civilization_context", "Evaluate against INDUSTRIAL capability", "Civilization context was not supplied", "MEDIUM"],
        ["risk_level", "Use MEDIUM simulated risk", "Risk level was not supplied", "MEDIUM"],
        ["priority", "Use NORMAL queue priority", "Priority was not supplied", "LOW"]
      ];
      for (const [field, description, reason, risk] of defaults) {
        if (input[field] === undefined) request.assumptions.push(assumptionRecord(request.request_id, request.assumptions.length + 1, field, description, reason, risk));
      }
      state.requests.push(request);
      return { status: request.status, reason: templateId ? null : "UNSUPPORTED_PROJECT_TEMPLATE", request_id: request.request_id, outputs: { request: clone(request) } };
    });
  }

  function requestClarification(requestId, fields = [], responses = {}) {
    return execute("REQUEST_CLARIFICATION", { requestId, fields, responses }, { division_id: "CUSTOMER_SERVICE_DIVISION", request_id: requestId }, () => {
      const request = findRequest(requestId);
      if (!request) return { status: "BLOCKED", reason: "REQUEST_NOT_FOUND" };
      const missingFields = unique(Array.isArray(fields) ? fields : []);
      const allowedResponses = ["requested_location", "requested_quantity", "requested_quality", "requested_deadline", "requested_budget", "intended_use", "civilization_context", "rights_context"];
      for (const [key, value] of Object.entries(responses ?? {})) if (allowedResponses.includes(key)) request[key] = clone(value);
      const clarification = {
        clarification_id: `AI-COMPANY-CLARIFICATION-${String(state.clarifications.length + 1).padStart(5, "0")}`,
        request_id: requestId,
        missing_fields: missingFields,
        responses: clone(responses ?? {}),
        status: Object.keys(responses ?? {}).length ? "RESPONDED" : "OPEN",
        simulation_time: state.simulation_time
      };
      state.clarifications.push(clarification);
      request.status = "NEEDS_CLARIFICATION";
      return { status: "NEEDS_CLARIFICATION", request_id: requestId, reason: missingFields.length ? "CRITICAL_REQUIREMENTS_MISSING" : null, outputs: { clarification } };
    });
  }

  function analyzeRequirements(requestId, options = {}) {
    return execute("ANALYZE_REQUIREMENTS", { requestId, options }, { division_id: "REQUIREMENTS_DIVISION", request_id: requestId }, () => {
      const request = findRequest(requestId);
      if (!request) return { status: "BLOCKED", reason: "REQUEST_NOT_FOUND" };
      if (!request.template_id) return { status: "REJECTED", reason: "UNSUPPORTED_PROJECT_TEMPLATE", request_id: requestId };
      const physical = PHYSICAL_TEMPLATES.has(request.template_id);
      const missing = [];
      if (physical && !request.requested_location) missing.push("requested_location");
      if (physical && request.rights_context.length === 0) missing.push("rights_context");
      if (!(request.requested_budget > 0)) missing.push("requested_budget");
      if (!request.intended_use) missing.push("intended_use");
      if (missing.length) {
        request.status = "NEEDS_CLARIFICATION";
        return { status: "NEEDS_CLARIFICATION", reason: "CRITICAL_REQUIREMENTS_MISSING", request_id: requestId, outputs: { missing_fields: missing } };
      }
      request.status = "ANALYZING";
      const definition = PROJECT_TEMPLATES[request.template_id];
      request.structured_requirements = {
        functional: [`DELIVER_${definition.deliverable}`],
        physical: physical ? ["TIME_MATERIAL_ENERGY_LOCATION_CAUSALITY"] : ["BOUNDED_COMPUTE_AND_REVIEW"],
        location: [request.requested_location ?? "LOCAL_SIMULATION_WORKSPACE"],
        resource: unique(definition.tasks.flatMap((item) => Object.keys(item.materials))),
        worker: unique(definition.tasks.flatMap((item) => item.skills)),
        technology: [definition.domain_binding],
        rights: clone(request.rights_context),
        civilization: [request.civilization_context],
        safety: ["SIMULATION_SAFETY_GATE"],
        economic: ["APPROVED_SIMULATED_FUNDING", "BALANCED_LEDGER"],
        quality: [request.requested_quality],
        delivery: ["INSPECTION_AND_CUSTOMER_ACCEPTANCE"],
        maintenance: physical ? ["MAINTENANCE_PLAN_REQUIRED"] : ["REVIEW_AND_UPDATE_PLAN"]
      };
      if (request.requested_deadline === null && !request.assumptions.some(({ field }) => field === "requested_deadline")) {
        request.assumptions.push(assumptionRecord(requestId, request.assumptions.length + 1, "requested_deadline", "Deadline follows deterministic critical path", "Customer did not set a deadline"));
      }
      for (const assumption of request.assumptions) assumption.approval_status = options.approve_assumptions === false ? "PENDING" : "APPROVED";
      const analysis = { analysis_id: `AI-COMPANY-ANALYSIS-${String(state.analyses.length + 1).padStart(5, "0")}`, request_id: requestId, template_id: request.template_id, structured_requirements: clone(request.structured_requirements), assumptions: clone(request.assumptions), status: "COMPLETE" };
      state.analyses.push(analysis);
      request.status = "FEASIBILITY_REVIEW";
      return { status: "COMPLETED", request_id: requestId, outputs: { analysis } };
    });
  }

  function evaluateFeasibility(requestId, context = {}) {
    return execute("EVALUATE_FEASIBILITY", { requestId, context }, { division_id: "ARCHITECTURE_DIVISION", request_id: requestId }, () => {
      const request = findRequest(requestId);
      if (!request) return { status: "BLOCKED", reason: "REQUEST_NOT_FOUND" };
      if (request.status !== "FEASIBILITY_REVIEW") return { status: "BLOCKED", reason: "REQUIREMENT_ANALYSIS_REQUIRED", request_id: requestId };
      const definition = PROJECT_TEMPLATES[request.template_id];
      const defaults = {
        PHYSICS_GATE: [context.physics_supported !== false, "PHYSICS_NOT_SUPPORTED"],
        TIME_GATE: [request.requested_deadline === null || request.requested_deadline >= definition.tasks.reduce((sum, item) => sum + item.duration, 0), "TIME_NOT_FEASIBLE"],
        LOCATION_GATE: [!PHYSICAL_TEMPLATES.has(request.template_id) || Boolean(request.requested_location), "NO_LOCATION"],
        LAND_GATE: [!PHYSICAL_TEMPLATES.has(request.template_id) || context.land_available !== false, "NO_LAND"],
        RIGHTS_GATE: [request.rights_context.length > 0 && context.rights_available !== false, "NO_RIGHTS"],
        CIVILIZATION_GATE: [context.civilization_ready !== false && request.civilization_context !== "PRIMITIVE_FORAGING", "CIVILIZATION_TOO_LOW"],
        TECHNOLOGY_GATE: [context.technology_available !== false && !definition.blocked_dependency, definition.blocked_dependency ? "SOURCE_UNDERSPECIFIED" : "TECHNOLOGY_NOT_AVAILABLE"],
        ENERGY_GATE: [context.energy_available !== false, "NO_ENERGY"],
        MATERIAL_GATE: [context.material_available !== false, "NO_MATERIAL"],
        LABOR_GATE: [context.workers_available !== false, "NO_WORKERS"],
        EQUIPMENT_GATE: [context.equipment_available !== false, "NO_EQUIPMENT"],
        LOGISTICS_GATE: [context.route_available !== false, "NO_ROUTE"],
        ECONOMY_GATE: [request.requested_budget >= definition.rough_cost && context.funding_available !== false, "NO_BUDGET"],
        SAFETY_GATE: [context.safe !== false, "UNSAFE"],
        ENVIRONMENT_GATE: [context.environmental_capacity !== false, "ENVIRONMENTAL_CAPACITY_EXCEEDED"],
        QUALITY_GATE: [context.quality_supported !== false, "QUALITY_NOT_SUPPORTED"]
      };
      const gates = REQUIRED_GATES.map((gateId) => {
        const override = context.gates?.[gateId];
        if (override && typeof override === "object") return { gate_id: gateId, outcome: override.outcome ?? "BLOCKED", reason: override.reason ?? defaults[gateId][1], required_to_unblock: clone(override.required_to_unblock ?? [override.reason ?? defaults[gateId][1]]) };
        const [pass, reason] = defaults[gateId];
        return { gate_id: gateId, outcome: pass ? "PASS" : "BLOCKED", reason: pass ? null : reason, required_to_unblock: pass ? [] : [definition.blocked_dependency ?? reason] };
      });
      const failed = gates.find(({ outcome }) => !["PASS", "PASS_WITH_CONDITIONS"].includes(outcome));
      const review = { review_id: `AI-COMPANY-FEASIBILITY-${String(state.feasibility_reviews.length + 1).padStart(5, "0")}`, request_id: requestId, template_id: request.template_id, gates, status: failed ? "BLOCKED" : "PASS", reason: failed?.reason ?? null, dependency_status: definition.blocked_dependency ? "BLOCKED_DEPENDENCY" : "READY" };
      state.feasibility_reviews.push(review);
      request.status = failed ? "REJECTED" : "PROPOSAL_READY";
      return { status: failed ? "BLOCKED" : "COMPLETED", reason: definition.blocked_dependency ? "BLOCKED_DEPENDENCY" : failed?.reason ?? null, request_id: requestId, outputs: { review } };
    });
  }

  function createProposal(requestId) {
    return execute("CREATE_PROPOSAL", { requestId }, { division_id: "DESIGN_DIVISION", request_id: requestId }, () => {
      const request = findRequest(requestId);
      const review = state.feasibility_reviews.findLast(({ request_id }) => request_id === requestId);
      if (!request || !review) return { status: "BLOCKED", reason: "FEASIBILITY_REVIEW_REQUIRED" };
      if (review.status !== "PASS") return { status: "BLOCKED", reason: review.dependency_status === "BLOCKED_DEPENDENCY" ? "BLOCKED_DEPENDENCY" : review.reason, request_id: requestId };
      const proposal = {
        proposal_id: `AI-COMPANY-PROPOSAL-${String(state.proposals.length + 1).padStart(5, "0")}`,
        request_id: requestId,
        template_id: request.template_id,
        objective: `Deliver ${PROJECT_TEMPLATES[request.template_id].deliverable}`,
        estimated_cost: PROJECT_TEMPLATES[request.template_id].rough_cost,
        estimated_duration: PROJECT_TEMPLATES[request.template_id].tasks.reduce((sum, item) => sum + item.duration, 0),
        feasibility_review_id: review.review_id,
        assumptions: clone(request.assumptions),
        risk_assessment: riskAssessmentFor(request.template_id),
        status: "CUSTOMER_REVIEW",
        simulation_only: true
      };
      state.proposals.push(proposal);
      request.status = "CUSTOMER_REVIEW";
      return { status: "COMPLETED", request_id: requestId, outputs: { proposal } };
    });
  }

  function approveProposal(proposalId) {
    return execute("APPROVE_PROPOSAL", { proposalId }, { division_id: "CUSTOMER_SERVICE_DIVISION" }, () => {
      const proposal = findProposal(proposalId);
      if (!proposal) return { status: "BLOCKED", reason: "PROPOSAL_NOT_FOUND" };
      if (proposal.assumptions.some(({ approval_status }) => approval_status !== "APPROVED")) return { status: "BLOCKED", reason: "ASSUMPTION_APPROVAL_REQUIRED", request_id: proposal.request_id };
      proposal.status = "APPROVED_SIMULATION";
      const request = findRequest(proposal.request_id);
      request.status = "APPROVED_SIMULATION";
      return { status: "ACCEPTED", request_id: request.request_id, outputs: { proposal_id: proposalId, warning: "SIMULATION_ONLY" } };
    });
  }

  function capacityBlock(definition, estimatedCost) {
    updateCapacity();
    if (state.capacity.active_projects + 1 > state.capacity.max_active_projects) return "MAX_ACTIVE_PROJECTS";
    if (definition.kind === "PHYSICAL" && state.capacity.active_physical_projects + 1 > state.capacity.max_active_physical_projects) return "MAX_ACTIVE_PHYSICAL_PROJECTS";
    if (definition.kind === "DIGITAL" && state.capacity.active_digital_projects + 1 > state.capacity.max_active_digital_projects) return "MAX_ACTIVE_DIGITAL_PROJECTS";
    if (definition.kind === "DIGITAL" && state.capacity.compute_load + 0.2 > state.capacity.max_compute_load + EPSILON) return "MAX_COMPUTE_LOAD";
    if (state.capacity.financial_exposure + estimatedCost > state.capacity.max_financial_exposure + EPSILON) return "MAX_FINANCIAL_EXPOSURE";
    return null;
  }

  function createProject(proposalId) {
    return execute("CREATE_PROJECT", { proposalId }, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      if (state.projects.length >= MAX_PROJECTS) return { status: "BLOCKED", reason: "PROJECT_LIMIT_REACHED" };
      const proposal = findProposal(proposalId);
      if (!proposal || proposal.status !== "APPROVED_SIMULATION") return { status: "BLOCKED", reason: "APPROVED_PROPOSAL_REQUIRED" };
      const request = findRequest(proposal.request_id);
      const definition = PROJECT_TEMPLATES[proposal.template_id];
      if (definition.blocked_dependency) return { status: "BLOCKED", reason: "BLOCKED_DEPENDENCY", request_id: request.request_id };
      const blockedBy = capacityBlock(definition, proposal.estimated_cost);
      if (blockedBy) {
        state.capacity.status = "COMPANY_CAPACITY_EXCEEDED";
        state.company.status = "OVER_CAPACITY";
        return { status: "BLOCKED", reason: "COMPANY_CAPACITY_EXCEEDED", request_id: request.request_id, outputs: { capacity_reason: blockedBy, disposition: "QUEUED" } };
      }
      const project = {
        project_id: `AI-COMPANY-PROJECT-${String(state.projects.length + 1).padStart(5, "0")}`,
        request_id: request.request_id,
        proposal_id: proposalId,
        template_id: proposal.template_id,
        objective: proposal.objective,
        location: request.requested_location,
        status: "PLANNED",
        project_kind: definition.kind,
        milestones: [], work_packages: [], tasks: [], dependencies: [],
        deliverables: [],
        resource_plan_id: `AI-COMPANY-RESOURCE-PLAN-${String(state.projects.length + 1).padStart(5, "0")}`,
        budget: null,
        schedule: null,
        contract_id: null,
        risks: clone(proposal.risk_assessment), issues: [], progress_percent: 0,
        domain_binding: definition.domain_binding,
        domain_evidence: domainBindingEvidence(proposal.template_id, state.seed),
        simulation_only: true,
        compute_reservation: definition.kind === "DIGITAL" ? 0.2 : 0,
        capacity_reserved: money(proposal.estimated_cost),
        accounting: { cost: 0, revenue: 0, work_in_progress: 0 },
        approval_status: proposal.template_id === "LIFE_PACKAGE_PROJECT" ? "CANDIDATE_ONLY" : "RUNTIME_VALIDATED_SIMULATION",
        external_deployment: false,
        created_at: state.simulation_time,
        closed_at: null,
        closeout_status: null
      };
      state.projects.push(project);
      request.status = "PROJECT_CREATED";
      updateCapacity();
      return { status: "COMPLETED", request_id: request.request_id, project_id: project.project_id, location: project.location, outputs: { project: clone(project) } };
    });
  }

  function decomposeProject(projectId) {
    return execute("DECOMPOSE_PROJECT", { projectId }, { division_id: "ARCHITECTURE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project) return { status: "BLOCKED", reason: "PROJECT_NOT_FOUND" };
      if (project.tasks.length) return { status: "BLOCKED", reason: "PROJECT_ALREADY_DECOMPOSED", project_id: projectId };
      const definition = PROJECT_TEMPLATES[project.template_id];
      if (definition.blocked_dependency) { project.status = "BLOCKED_DEPENDENCY"; return { status: "BLOCKED", reason: "BLOCKED_DEPENDENCY", project_id: projectId }; }
      const milestoneId = `${projectId}-MILESTONE-001`;
      const workPackageId = `${projectId}-WORK-PACKAGE-001`;
      project.tasks = definition.tasks.map((item, index) => ({
        task_id: `${projectId}-TASK-${String(index + 1).padStart(3, "0")}`,
        task_code: item.code,
        work_package_id: workPackageId,
        objective: item.objective,
        location: project.location ?? "LOCAL_SIMULATION_WORKSPACE",
        start_condition: index === 0 ? ["PROJECT_AUTHORIZED"] : [`PREDECESSOR_${index}_COMPLETE`],
        end_condition: ["TIME_COMPLETE", "RESOURCES_CONSUMED", "INSPECTION_PASS"],
        duration_hours: item.duration,
        remaining_hours: item.duration,
        workers: [],
        skills: clone(item.skills),
        materials: clone(item.materials),
        equipment: clone(item.equipment),
        energy: item.energy,
        transport: Object.keys(item.materials),
        cost: item.cost,
        predecessors: index === 0 ? [] : [`${projectId}-TASK-${String(index).padStart(3, "0")}`],
        successors: index === definition.tasks.length - 1 ? [] : [`${projectId}-TASK-${String(index + 2).padStart(3, "0")}`],
        quality_gate: item.code === "FINAL_ACCEPTANCE" || item.code === "CODEX_REVIEW" ? "FINAL_ACCEPTANCE" : "STAGE_INSPECTION",
        safety_gate: project.project_kind === "PHYSICAL" ? "SIMULATED_SITE_SAFETY" : "SIMULATED_CODE_SAFETY",
        status: index === 0 ? "READY" : "NOT_READY",
        progress_percent: 0,
        consumed: { labor_hours: 0, energy: 0, materials: Object.fromEntries(Object.keys(item.materials).map((key) => [key, 0])), equipment_wear: 0, cost: 0 },
        blocked_reason: null,
        actual_start: null,
        actual_end: null,
        rework_for_task_id: null
      }));
      project.dependencies = project.tasks.slice(1).map((item, index) => ({
        dependency_id: `${projectId}-DEPENDENCY-${String(index + 1).padStart(3, "0")}`,
        predecessor_task_id: project.tasks[index].task_id,
        successor_task_id: item.task_id,
        mandatory: true,
        status: "UNSATISFIED"
      }));
      project.milestones = [{ milestone_id: milestoneId, name: "CAUSAL_PROJECT_DELIVERY", task_ids: project.tasks.map(({ task_id }) => task_id), status: "READY" }];
      project.work_packages = [{ work_package_id: workPackageId, milestone_id: milestoneId, name: "DEPENDENCY_ORDERED_EXECUTION", task_ids: project.tasks.map(({ task_id }) => task_id), status: "READY" }];
      project.deliverables = [{ deliverable_id: `${projectId}-DELIVERABLE-001`, name: definition.deliverable, acceptance_criteria: ["ALL_TASKS_COMPLETE", "ALL_INSPECTIONS_PASS", "CUSTOMER_ACCEPTANCE"], status: "PLANNED" }];
      const taskCount = state.projects.reduce((sum, candidate) => sum + candidate.tasks.length, 0);
      if (taskCount > MAX_TASKS) throw new Error("TASK_LIMIT_REACHED");
      return { status: "COMPLETED", project_id: projectId, work_package_id: workPackageId, outputs: { tasks: clone(project.tasks), dependencies: clone(project.dependencies), domain_evidence: clone(project.domain_evidence) } };
    });
  }

  function calculateDependencies(projectId) {
    return execute("CALCULATE_DEPENDENCIES", { projectId }, { division_id: "ARCHITECTURE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.tasks.length) return { status: "BLOCKED", reason: "PROJECT_DECOMPOSITION_REQUIRED" };
      const graph = topologicalOrder(project);
      if (graph.cycle) { project.status = "BLOCKED"; project.issues.push({ issue_id: `${projectId}-ISSUE-${String(project.issues.length + 1).padStart(3, "0")}`, description: "Dependency graph is not executable", reason: graph.reason, required_to_unblock: ["ACYCLIC_DEPENDENCY_GRAPH"], status: "OPEN" }); return { status: "BLOCKED", reason: graph.reason, project_id: projectId }; }
      for (const edge of project.dependencies) {
        const predecessor = findTask(project, edge.predecessor_task_id);
        edge.status = predecessor.status === "COMPLETE" ? "SATISFIED" : "UNSATISFIED";
      }
      return { status: "COMPLETED", project_id: projectId, outputs: { order: graph.order, dependencies: clone(project.dependencies) } };
    });
  }

  function ensureResourcePlan(project) {
    let plan = findPlan(project.project_id);
    if (!plan) {
      plan = { resource_plan_id: project.resource_plan_id, project_id: project.project_id, bill_of_materials: [], workforce: [], equipment: [], supply_chain: [], energy_budget: round(project.tasks.reduce((sum, item) => sum + item.energy, 0) * 1.1), warehouse_capacity: 100000, status: "PLANNING" };
      state.resource_plans.push(plan);
    }
    return plan;
  }

  function createBOM(projectId, options = {}) {
    return execute("CREATE_BOM", { projectId, options }, { division_id: "PROCUREMENT_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.tasks.length) return { status: "BLOCKED", reason: "PROJECT_DECOMPOSITION_REQUIRED" };
      const plan = ensureResourcePlan(project);
      const totals = {};
      for (const currentTask of project.tasks) for (const [materialId, quantity] of Object.entries(currentTask.materials)) totals[materialId] = round((totals[materialId] ?? 0) + quantity);
      const unavailable = new Set(options.unavailable ?? []);
      plan.warehouse_capacity = Number(options.warehouse_capacity ?? plan.warehouse_capacity);
      plan.bill_of_materials = Object.entries(totals).map(([materialId, quantity], index) => {
        const profile = materialProfile(materialId);
        if (!profile) throw new Error(`UNKNOWN_TEMPLATE_MATERIAL:${materialId}`);
        const unitMass = profile.unit_mass;
        const unitCost = profile.unit_cost;
        return {
          bom_id: `${projectId}-BOM-${String(index + 1).padStart(3, "0")}`, project_id: projectId, material_id: materialId,
          description: materialId.replaceAll("_", " "), quantity, unit: "SIMULATION_UNIT", unit_mass: unitMass,
          total_mass: round(quantity * unitMass), required_quality: "STANDARD_SIMULATION", supplier: unavailable.has(materialId) ? null : `SIMULATED-SUPPLIER-${materialId}`,
          availability: unavailable.has(materialId) ? 0 : quantity, lead_time: 2 + index, unit_cost: unitCost,
          total_cost: money(quantity * unitCost), storage_requirement: "SIMULATED_WAREHOUSE", transport_requirement: "CAUSAL_ROUTE",
          waste_factor: 0.05, recyclable: !materialId.includes("STOCK"), status: unavailable.has(materialId) ? "UNAVAILABLE" : "PLANNED"
        };
      });
      const mass = plan.bill_of_materials.reduce((sum, item) => sum + item.total_mass, 0);
      plan.status = plan.bill_of_materials.some(({ status }) => status === "UNAVAILABLE") || mass > plan.warehouse_capacity ? "BLOCKED" : "PARTIALLY_AVAILABLE";
      return { status: plan.status === "BLOCKED" ? "BLOCKED" : "COMPLETED", reason: mass > plan.warehouse_capacity ? "NO_WAREHOUSE" : plan.status === "BLOCKED" ? "NO_MATERIAL" : null, project_id: projectId, outputs: { bill_of_materials: clone(plan.bill_of_materials), total_mass: mass } };
    });
  }

  function createWorkforcePlan(projectId, options = {}) {
    return execute("CREATE_WORKFORCE_PLAN", { projectId, options }, { division_id: "LABOR_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.tasks.length) return { status: "BLOCKED", reason: "PROJECT_DECOMPOSITION_REQUIRED" };
      const plan = ensureResourcePlan(project);
      const omit = new Set(options.omit_skills ?? []);
      const skills = unique(project.tasks.flatMap(({ skills: required }) => required));
      plan.workforce = skills.flatMap((skill) => {
        if (omit.has(skill)) return [];
        const worker = state.workforce_pool.find((candidate) => candidate.skill === skill);
        return worker ? [clone(worker)] : [];
      });
      const missing = skills.filter((skill) => !plan.workforce.some((worker) => worker.skill === skill));
      plan.status = missing.length ? "BLOCKED" : "PARTIALLY_AVAILABLE";
      return { status: missing.length ? "BLOCKED" : "COMPLETED", reason: missing.length ? "SKILL_NOT_AVAILABLE" : null, project_id: projectId, outputs: { workforce: clone(plan.workforce), missing_skills: missing } };
    });
  }

  function createEquipmentPlan(projectId, options = {}) {
    return execute("CREATE_EQUIPMENT_PLAN", { projectId, options }, { division_id: "CONSTRUCTION_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.tasks.length) return { status: "BLOCKED", reason: "PROJECT_DECOMPOSITION_REQUIRED" };
      const plan = ensureResourcePlan(project);
      const unavailable = new Set(options.unavailable ?? []);
      const requestedStates = options.equipment_states ?? {};
      const types = unique(project.tasks.flatMap(({ equipment }) => equipment));
      plan.equipment = types.flatMap((type) => {
        const equipment = state.equipment_pool.find((candidate) => candidate.type === type);
        if (!equipment) return [];
        const copy = clone(equipment);
        if (unavailable.has(type)) { copy.availability = false; copy.status = "BLOCKED"; }
        if (requestedStates[type]) {
          copy.status = String(requestedStates[type]);
          if (["BROKEN", "RETIRED", "OUT_OF_SERVICE", "MAINTENANCE_REQUIRED"].includes(copy.status)) copy.availability = false;
        }
        return [copy];
      });
      const missing = types.filter((type) => !plan.equipment.some((equipment) => equipment.type === type && equipment.availability && equipment.maintenance_state === "READY" && !["BROKEN", "RETIRED", "OUT_OF_SERVICE", "MAINTENANCE_REQUIRED"].includes(equipment.status)));
      plan.status = missing.length ? "BLOCKED" : "PARTIALLY_AVAILABLE";
      return { status: missing.length ? "BLOCKED" : "COMPLETED", reason: missing.length ? "NO_EQUIPMENT" : null, project_id: projectId, outputs: { equipment: clone(plan.equipment), missing_equipment: missing } };
    });
  }

  function createSupplyChainPlan(projectId, options = {}) {
    return execute("CREATE_SUPPLY_CHAIN_PLAN", { projectId, options }, { division_id: "SUPPLY_CHAIN_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      const plan = project && findPlan(projectId);
      if (!plan) return { status: "BLOCKED", reason: "RESOURCE_PLAN_REQUIRED" };
      const routeAvailable = options.route_available !== false;
      plan.supply_chain = plan.bill_of_materials.map((item, index) => ({
        transport_id: `${projectId}-TRANSPORT-${String(index + 1).padStart(3, "0")}`,
        bom_id: item.bom_id,
        origin: item.supplier ?? "NO_SUPPLIER", destination: project.location ?? "LOCAL_SIMULATION_WORKSPACE",
        route: routeAvailable && item.supplier ? `CAUSAL-ROUTE-${String(index + 1).padStart(3, "0")}` : null,
        quantity: item.quantity, mass: item.total_mass, vehicle: routeAvailable ? "SIMULATED-TRUCK-001" : null,
        fuel: routeAvailable ? round(2 + item.total_mass / 1000) : 0, loading_time: 1, travel_time: 3 + index,
        unloading_time: 1, cost: money(40 + item.total_mass * 0.05), risk: 0.1, status: routeAvailable && item.supplier ? "PLANNED" : "NO_ROUTE"
      }));
      plan.status = plan.supply_chain.some(({ status }) => status === "NO_ROUTE") ? "BLOCKED" : "PARTIALLY_AVAILABLE";
      return { status: plan.status === "BLOCKED" ? "BLOCKED" : "COMPLETED", reason: plan.status === "BLOCKED" ? "NO_ROUTE" : null, project_id: projectId, outputs: { supply_chain: clone(plan.supply_chain) } };
    });
  }

  function projectPlanningLocked(project) {
    return !project || isTerminalProject(project)
      || project.closed_at !== null
      || project.tasks.some(({ actual_start, consumed }) => actual_start !== null || (consumed?.labor_hours ?? 0) > 0)
      || (project.budget?.spent ?? 0) > 0
      || (project.budget?.committed ?? 0) > 0
      || Boolean(findContract(project.project_id));
  }

  function calculateBudget(projectId, options = {}) {
    return execute("CALCULATE_BUDGET", { projectId, options }, { division_id: "FINANCE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      const request = project && findRequest(project.request_id);
      const plan = project && findPlan(projectId);
      if (!project || !plan) return { status: "BLOCKED", reason: "RESOURCE_PLAN_REQUIRED" };
      if (project.budget && projectPlanningLocked(project)) return { status: "BLOCKED", reason: "PROJECT_PLANNING_LOCKED", project_id: projectId };
      const materialCost = money(plan.bill_of_materials.reduce((sum, item) => sum + item.total_cost, 0));
      const taskCost = money(project.tasks.reduce((sum, item) => sum + item.cost, 0));
      const designCost = money(project.tasks.filter(({ task_code }) => /DESIGN|SPECIFICATION|REQUIREMENTS/.test(task_code)).reduce((sum, item) => sum + item.cost, 0));
      const inspectionCost = money(project.tasks.filter(({ task_code }) => /ACCEPTANCE|REVIEW|TEST/.test(task_code)).reduce((sum, item) => sum + item.cost, 0));
      const laborCost = money(Math.max(0, taskCost - designCost - inspectionCost) * 0.65);
      const equipmentCost = money(Math.max(0, taskCost - designCost - inspectionCost) * 0.2);
      const energyCost = money(project.tasks.reduce((sum, item) => sum + item.energy, 0) * 2);
      const transportCost = money(plan.supply_chain.reduce((sum, item) => sum + item.cost, 0));
      const storageCost = money(materialCost * 0.02);
      const riskReserve = money((materialCost + taskCost) * 0.04);
      const maintenanceReserve = money((materialCost + taskCost) * 0.03);
      const taxSimulation = money((materialCost + taskCost) * 0.01);
      const insuranceSimulation = money((materialCost + taskCost) * 0.01);
      const interestSimulation = 0;
      const contingency = money((materialCost + taskCost) * 0.05);
      const categories = { design_cost: designCost, material_cost: materialCost, labor_cost: laborCost, equipment_cost: equipmentCost, energy_cost: energyCost, transport_cost: transportCost, storage_cost: storageCost, inspection_cost: inspectionCost, risk_reserve: riskReserve, maintenance_reserve: maintenanceReserve, tax_simulation: taxSimulation, insurance_simulation: insuranceSimulation, interest_simulation: interestSimulation, contingency };
      const total = money(Object.values(categories).reduce((sum, value) => sum + value, 0));
      const approved = money(options.approved_budget ?? request.requested_budget);
      const fundingSource = options.funding_source ?? "CUSTOMER_SIMULATED_WALLET";
      const funded = fundingSource !== "UNFUNDED" && approved >= total;
      const reservedExposure = money(Math.max(total, approved));
      const exposureDelta = money(reservedExposure - project.capacity_reserved);
      if (state.capacity.financial_exposure + exposureDelta > state.capacity.max_financial_exposure + EPSILON) return { status: "BLOCKED", reason: "COMPANY_CAPACITY_EXCEEDED", project_id: projectId };
      project.capacity_reserved = reservedExposure;
      project.budget = { project_budget: approved, ...categories, total_estimated_cost: total, approved_budget: approved, spent: 0, committed: 0, remaining: money(approved), forecast_at_completion: total, funding_source: funded ? fundingSource : "UNFUNDED", status: funded ? "APPROVED" : "UNFUNDED" };
      updateCapacity();
      return { status: funded ? "COMPLETED" : "BLOCKED", reason: funded ? null : "NO_BUDGET", project_id: projectId, outputs: { budget: clone(project.budget) } };
    });
  }

  function calculateSchedule(projectId, options = {}) {
    return execute("CALCULATE_SCHEDULE", { projectId, options }, { division_id: "ARCHITECTURE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.tasks.length) return { status: "BLOCKED", reason: "PROJECT_DECOMPOSITION_REQUIRED" };
      const graph = topologicalOrder(project);
      if (graph.cycle) return { status: "BLOCKED", reason: graph.reason, project_id: projectId };
      let cursor = Number(options.planned_start ?? state.simulation_time);
      for (const taskId of graph.order) {
        const currentTask = findTask(project, taskId);
        const delay = Number(options.task_delays?.[taskId] ?? 0);
        const startTime = cursor + Math.max(0, delay);
        const endTime = startTime + currentTask.duration_hours;
        state.task_windows[taskId] = { start: startTime, end: endTime, location: currentTask.location };
        cursor = endTime;
      }
      const duration = cursor - Number(options.planned_start ?? state.simulation_time);
      const request = findRequest(project.request_id);
      project.schedule = {
        planned_start: Number(options.planned_start ?? state.simulation_time), planned_end: cursor, estimated_duration: duration,
        critical_path: graph.order, task_dependencies: project.dependencies.map(({ dependency_id }) => dependency_id),
        worker_availability: Object.fromEntries(findPlan(projectId)?.workforce.map(({ worker_id, availability }) => [worker_id, availability]) ?? []),
        equipment_availability: Object.fromEntries(findPlan(projectId)?.equipment.map(({ equipment_id, availability }) => [equipment_id, availability]) ?? []),
        material_arrival: Object.fromEntries(findPlan(projectId)?.bill_of_materials.map(({ material_id, lead_time }) => [material_id, state.simulation_time + lead_time]) ?? []),
        weather_delay: Number(options.weather_delay ?? 0), inspection_delay: 0, rework_delay: 0, execution_pause_delay: 0,
        transport_delay: Number(options.transport_delay ?? 0), actual_start: null, actual_end: null,
        status: request.requested_deadline !== null && cursor > request.requested_deadline ? "AT_RISK" : "ON_SCHEDULE"
      };
      return { status: "COMPLETED", project_id: projectId, outputs: { schedule: clone(project.schedule), task_windows: clone(Object.fromEntries(graph.order.map((id) => [id, state.task_windows[id]]))) } };
    });
  }

  function createSimulatedContract(projectId, options = {}) {
    return execute("CREATE_SIMULATED_CONTRACT", { projectId, options }, { division_id: "LEGAL_SIMULATION_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project?.budget || project.budget.status !== "APPROVED" || !project.schedule) return { status: "BLOCKED", reason: "FUNDED_BUDGET_AND_SCHEDULE_REQUIRED" };
      if (findContract(projectId)) return { status: "BLOCKED", reason: "CONTRACT_ALREADY_EXISTS", project_id: projectId };
      const depositRate = clamp(Number(options.deposit_rate ?? 0.1), 0, 0.5);
      const deposit = money(project.budget.approved_budget * depositRate);
      const contract = {
        contract_id: `AI-COMPANY-CONTRACT-${String(state.contracts.length + 1).padStart(5, "0")}`, project_id: projectId,
        parties: ["CUSTOMER", "AI_COMPANY", "SUPPLIER", "CONTRACTOR", "WORKER", "INSPECTOR_SIMULATION", "TRANSPORT_OPERATOR"],
        scope: project.objective, deliverables: project.deliverables.map(({ deliverable_id }) => deliverable_id), price: project.budget.approved_budget,
        deposit_amount: deposit, payment_schedule: [{ milestone: "SIMULATED_APPROVAL", amount: deposit }, { milestone: "ACCEPTANCE", amount: money(project.budget.approved_budget - deposit) }],
        timeline: { start: project.schedule.planned_start, end: project.schedule.planned_end }, quality_standard: ["SIMULATED_INSPECTION_PASS"],
        change_policy: "EXPLICIT_CHANGE_ORDER_ONLY", cancellation_policy: "SIMULATED_CANCELLATION_WITH_ACCOUNTING",
        warranty_simulation: "SIMULATED_WARRANTY_ONLY", maintenance_terms: "MAINTENANCE_PLAN_REQUIRED",
        rights: clone(findRequest(project.request_id).rights_context), liability_simulation: "NO_REAL_LEGAL_EFFECT",
        status: "ACTIVE_SIMULATION", warning: "SIMULATED_CONTRACT / NO_REAL_LEGAL_EFFECT", real_legal_effect: false
      };
      state.contracts.push(contract);
      project.contract_id = contract.contract_id;
      if (deposit > 0) postLedger("CUSTOMER_SIMULATED_DEPOSIT", projectId, "CASH", "CUSTOMER_DEPOSITS", deposit, { cash: deposit, customer_deposits: deposit });
      return { status: "COMPLETED", project_id: projectId, cash_delta: deposit, outputs: { contract: clone(contract) } };
    });
  }

  function appendProcurementState(order, status, simulationTime) {
    if (order.status === status) return;
    order.status = status;
    order.state_history.push({ status, simulation_time: simulationTime });
  }

  function advanceProcurementOrders(targetTime) {
    for (const order of state.procurement_orders) {
      if (PROCUREMENT_TERMINAL_STATUSES.has(order.status)) continue;
      const transitions = [
        ["QUOTES_RECEIVED", order.phase_times.quotes_received],
        ["SUPPLIER_SELECTED", order.phase_times.supplier_selected],
        ["ORDER_PLACED", order.phase_times.order_placed],
        ["IN_PRODUCTION", order.phase_times.in_production],
        ["IN_TRANSIT", order.phase_times.in_transit]
      ];
      for (const [status, transitionTime] of transitions) {
        if (targetTime + EPSILON >= transitionTime && (PROCUREMENT_RANK[status] ?? -1) > (PROCUREMENT_RANK[order.status] ?? -1)) appendProcurementState(order, status, transitionTime);
      }
    }
  }

  function startProcurement(projectId, options = {}) {
    return execute("START_PROCUREMENT", { projectId, options }, { division_id: "PROCUREMENT_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      const plan = project && findPlan(projectId);
      const contract = project && findContract(projectId);
      if (!project || !plan || !contract || contract.status !== "ACTIVE_SIMULATION") return { status: "BLOCKED", reason: "ACTIVE_SIMULATED_CONTRACT_REQUIRED" };
      if (project.budget?.status !== "APPROVED") return { status: "BLOCKED", reason: "NO_BUDGET" };
      if (plan.bill_of_materials.some(({ status }) => status === "UNAVAILABLE")) return { status: "BLOCKED", reason: "NO_MATERIAL" };
      if (plan.supply_chain.some(({ status }) => status === "NO_ROUTE")) return { status: "BLOCKED", reason: "NO_ROUTE" };
      const existingBomIds = new Set(state.procurement_orders.filter((order) => order.project_id === projectId && !PROCUREMENT_TERMINAL_STATUSES.has(order.status)).map(({ bom_id }) => bom_id));
      const pendingItems = plan.bill_of_materials.filter((item) => item.status !== "RECEIVED" && !existingBomIds.has(item.bom_id));
      const prospective = state.capacity.procurement_queue + pendingItems.length;
      if (prospective > state.capacity.max_procurement_queue) return { status: "BLOCKED", reason: "COMPANY_CAPACITY_EXCEEDED", outputs: { capacity_reason: "MAX_PROCUREMENT_QUEUE" } };
      const commitment = money(pendingItems.reduce((sum, item) => {
        const route = plan.supply_chain.find((candidate) => candidate.bom_id === item.bom_id);
        return sum + item.total_cost + (route?.cost ?? 0);
      }, 0));
      if (commitment > project.budget.remaining + EPSILON) return { status: "BLOCKED", reason: "NO_BUDGET" };
      project.budget.committed = money(project.budget.committed + commitment);
      project.budget.remaining = money(project.budget.approved_budget - project.budget.spent - project.budget.committed);
      pendingItems.forEach((item) => {
        const route = plan.supply_chain.find((candidate) => candidate.quantity === item.quantity && candidate.origin === item.supplier) ?? plan.supply_chain[plan.bill_of_materials.indexOf(item)];
        const sequence = state.procurement_orders.filter((order) => order.project_id === projectId).length + 1;
        const rfqAt = state.simulation_time;
        const phaseTimes = {
          rfq_created: rfqAt,
          quotes_received: rfqAt + 0.25,
          supplier_selected: rfqAt + 0.5,
          order_placed: rfqAt + 0.75,
          in_production: rfqAt + 1,
          in_transit: rfqAt + item.lead_time,
          received: rfqAt + item.lead_time + route.loading_time + route.travel_time + route.unloading_time
        };
        item.status = "RFQ_CREATED";
        route.status = "PLANNED";
        const order = {
          order_id: `${projectId}-PROCUREMENT-${String(sequence).padStart(3, "0")}`,
          project_id: projectId, bom_id: item.bom_id, material_id: item.material_id,
          quantity: item.quantity, material_cost: item.total_cost, transport_cost: route.cost,
          ordered_at: state.simulation_time, arrival_time: phaseTimes.received,
          supplier_candidates: [`${item.supplier}-QUALITY`, `${item.supplier}-CAPACITY`],
          selection_basis: ["QUALITY", "DELIVERY", "CAPACITY", "RISK", "TOTAL_COST"],
          selected_supplier: item.supplier,
          phase_times: phaseTimes,
          state_history: [{ status: "RFQ_CREATED", simulation_time: rfqAt }],
          inspection_outcome: (options.inspection_fail_materials ?? []).includes(item.material_id) ? "FAIL" : "PASS",
          status: "RFQ_CREATED", simulation_only: true
        };
        state.procurement_orders.push(order);
      });
      plan.status = pendingItems.length ? "PROCUREMENT" : "READY";
      project.status = pendingItems.length ? "PROCUREMENT" : "READY";
      updateCapacity();
      return { status: "COMPLETED", project_id: projectId, outputs: { orders: clone(state.procurement_orders.filter(({ project_id }) => project_id === projectId)), committed: commitment } };
    });
  }

  function receiveMaterial(projectId, materialId) {
    return execute("RECEIVE_MATERIAL", { projectId, materialId }, { division_id: "PROCUREMENT_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      const plan = project && findPlan(projectId);
      const order = state.procurement_orders.find((candidate) => candidate.project_id === projectId && candidate.material_id === materialId && !PROCUREMENT_TERMINAL_STATUSES.has(candidate.status))
        ?? state.procurement_orders.findLast((candidate) => candidate.project_id === projectId && candidate.material_id === materialId);
      const item = plan?.bill_of_materials.find(({ bom_id }) => bom_id === order?.bom_id);
      if (!project || !item || !order) return { status: "BLOCKED", reason: "MATERIAL_ORDER_NOT_FOUND" };
      if (order.status === "PAYMENT_APPROVED") return { status: "BLOCKED", reason: "MATERIAL_ALREADY_RECEIVED" };
      if (state.simulation_time < order.arrival_time) return { status: "BLOCKED", reason: "TRANSPORT_TIME_REQUIRED", outputs: { arrival_time: order.arrival_time } };
      advanceProcurementOrders(state.simulation_time);
      appendProcurementState(order, "RECEIVED", state.simulation_time);
      if (order.inspection_outcome !== "PASS") {
        appendProcurementState(order, "INSPECTION_FAILED", state.simulation_time);
        item.status = "INSPECTION_FAILED";
        updateCapacity();
        return { status: "BLOCKED", reason: "MATERIAL_INSPECTION_FAILED", project_id: projectId, outputs: { order: clone(order) } };
      }
      const massAfter = Object.values(state.material_inventory).reduce((sum, record) => sum + record.mass, 0) + item.total_mass;
      if (massAfter > plan.warehouse_capacity + EPSILON) return { status: "BLOCKED", reason: "NO_WAREHOUSE" };
      appendProcurementState(order, "ACCEPTED", state.simulation_time);
      const totalCost = money(order.material_cost + order.transport_cost);
      project.budget.committed = money(Math.max(0, project.budget.committed - totalCost));
      const charge = chargeProject(project, "MATERIAL_AND_TRANSPORT_COST", totalCost);
      if (!charge.ok) { project.budget.committed = money(project.budget.committed + totalCost); return { status: "BLOCKED", reason: charge.reason }; }
      item.status = "RECEIVED";
      appendProcurementState(order, "PAYMENT_APPROVED", state.simulation_time);
      const route = plan.supply_chain.find(({ bom_id }) => bom_id === order.bom_id) ?? plan.supply_chain.find(({ quantity }) => quantity === item.quantity);
      if (route) route.status = "DELIVERED";
      const inventory = state.material_inventory[materialId] ?? { quantity: 0, mass: 0, project_allocations: {} };
      inventory.quantity = round(inventory.quantity + item.quantity);
      inventory.mass = round(inventory.mass + item.total_mass);
      inventory.project_allocations[projectId] = round((inventory.project_allocations[projectId] ?? 0) + item.quantity);
      state.material_inventory[materialId] = inventory;
      postLedger("MATERIAL_INVENTORY_RECOGNITION", projectId, "MATERIAL_INVENTORY", "PROJECT_WORK_IN_PROGRESS", item.total_cost, { inventory: item.total_cost, work_in_progress: -item.total_cost });
      project.accounting.work_in_progress = money(Math.max(0, project.accounting.work_in_progress - item.total_cost));
      if (plan.bill_of_materials.every(({ status }) => status === "RECEIVED")) { plan.status = "READY"; project.status = "READY"; }
      updateCapacity();
      return { status: "COMPLETED", project_id: projectId, material_delta: item.quantity, inventory_delta: item.quantity, cash_delta: charge.cash_delta, outputs: { material_id: materialId, inventory: clone(inventory) } };
    });
  }

  function assignWorker(projectId, taskId, workerId, options = {}) {
    return execute("ASSIGN_WORKER", { projectId, taskId, workerId, options }, { division_id: "LABOR_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const currentTask = findTask(project, taskId);
      const worker = findPlan(projectId)?.workforce.find(({ worker_id }) => worker_id === workerId);
      if (!currentTask || !worker) return { status: "BLOCKED", reason: "WORKER_NOT_FOUND" };
      if (!currentTask.skills.includes(worker.skill)) return { status: "BLOCKED", reason: "SKILL_NOT_AVAILABLE" };
      if (!worker.safety_qualification || !worker.equipment_qualification) return { status: "BLOCKED", reason: "CERTIFICATION_SIMULATION_MISSING" };
      const window = state.task_windows[taskId] ?? { start: state.simulation_time, end: state.simulation_time + currentTask.duration_hours, location: currentTask.location };
      const reservation = { reservation_id: `AI-COMPANY-WORKER-RES-${String(state.worker_reservations.length + 1).padStart(5, "0")}`, project_id: projectId, task_id: taskId, worker_id: workerId, life_id: worker.life_id, body_type: worker.body_type, location: currentTask.location, start: Number(options.start ?? window.start), end: Number(options.end ?? window.end), status: "RESERVED" };
      if (!Number.isFinite(reservation.start) || !Number.isFinite(reservation.end) || reservation.end <= reservation.start) return { status: "BLOCKED", reason: "INVALID_SHIFT" };
      if (worker.body_type === "PHYSICAL" && reservation.end - reservation.start > worker.shift.maximum_hours) return { status: "BLOCKED", reason: "REST_REQUIREMENT_CONFLICT" };
      const existing = state.worker_reservations.filter((candidate) => candidate.life_id === worker.life_id && !["RELEASED", "CANCELLED"].includes(candidate.status));
      for (const other of existing) {
        if (intervalsOverlap(reservation, other)) return { status: "BLOCKED", reason: other.location !== reservation.location ? "LOCATION_CONFLICT" : other.project_id === projectId ? "ROLE_TIME_CONFLICT" : "SHIFT_OVERLAP" };
        const gap = reservation.start >= other.end ? reservation.start - other.end : other.start - reservation.end;
        if (worker.body_type === "PHYSICAL" && other.location !== reservation.location && gap < worker.travel_time) return { status: "BLOCKED", reason: "TRAVEL_TIME_CONFLICT" };
      }
      state.worker_reservations.push(reservation);
      worker.assigned_tasks.push(taskId);
      worker.status = "ASSIGNED";
      if (!currentTask.workers.includes(workerId)) currentTask.workers.push(workerId);
      updateCapacity();
      if (state.capacity.worker_assignments > state.capacity.max_worker_assignments) {
        state.worker_reservations.pop();
        currentTask.workers = currentTask.workers.filter((id) => id !== workerId);
        worker.assigned_tasks = worker.assigned_tasks.filter((id) => id !== taskId);
        worker.status = "AVAILABLE";
        updateCapacity();
        return { status: "BLOCKED", reason: "COMPANY_CAPACITY_EXCEEDED" };
      }
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, labor_delta: 1, outputs: { reservation } };
    });
  }

  function reserveEquipment(projectId, taskId, equipmentId, options = {}) {
    return execute("RESERVE_EQUIPMENT", { projectId, taskId, equipmentId, options }, { division_id: "CONSTRUCTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const currentTask = findTask(project, taskId);
      const equipment = findPlan(projectId)?.equipment.find(({ equipment_id }) => equipment_id === equipmentId);
      if (!currentTask || !equipment || !currentTask.equipment.includes(equipment.type)) return { status: "BLOCKED", reason: "NO_EQUIPMENT" };
      if (!equipment.availability || equipment.maintenance_state !== "READY" || ["BROKEN", "RETIRED", "OUT_OF_SERVICE", "MAINTENANCE_REQUIRED"].includes(equipment.status)) return { status: "BLOCKED", reason: "EQUIPMENT_MAINTENANCE_REQUIRED" };
      if (equipment.energy_type !== "MANUAL" && equipment.fuel_or_charge <= 0) return { status: "BLOCKED", reason: "NO_ENERGY" };
      const assignedWorkers = currentTask.workers.map((workerId) => findPlan(projectId).workforce.find((worker) => worker.worker_id === workerId)).filter(Boolean);
      const operatorAvailable = equipment.operator_requirement === "NONE"
        || (equipment.operator_requirement === "DIGITAL_TASK_ASSIGNEE" && assignedWorkers.some(({ body_type }) => body_type === "DIGITAL"))
        || (equipment.operator_requirement === "PHYSICAL_TASK_ASSIGNEE" && assignedWorkers.some(({ body_type }) => body_type === "PHYSICAL"))
        || assignedWorkers.some(({ skill }) => skill === equipment.operator_requirement);
      if (!operatorAvailable) return { status: "BLOCKED", reason: "NO_MACHINE_OPERATOR" };
      const window = state.task_windows[taskId] ?? { start: state.simulation_time, end: state.simulation_time + currentTask.duration_hours };
      const reservation = { reservation_id: `AI-COMPANY-EQUIPMENT-RES-${String(state.equipment_reservations.length + 1).padStart(5, "0")}`, project_id: projectId, task_id: taskId, equipment_id: equipmentId, start: Number(options.start ?? window.start), end: Number(options.end ?? window.end), status: "RESERVED" };
      if (!Number.isFinite(reservation.start) || !Number.isFinite(reservation.end) || reservation.end <= reservation.start) return { status: "BLOCKED", reason: "INVALID_EQUIPMENT_RESERVATION" };
      if (state.equipment_reservations.some((candidate) => candidate.equipment_id === equipmentId && !["RELEASED", "CANCELLED"].includes(candidate.status) && intervalsOverlap(reservation, candidate))) return { status: "BLOCKED", reason: "EQUIPMENT_RESERVATION_CONFLICT" };
      state.equipment_reservations.push(reservation);
      equipment.status = "RESERVED";
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, equipment_delta: 1, outputs: { reservation } };
    });
  }

  function taskResourceBlock(project, currentTask) {
    const plan = findPlan(project.project_id);
    if (!findContract(project.project_id) || findContract(project.project_id).status !== "ACTIVE_SIMULATION") return "ACTIVE_SIMULATED_CONTRACT_REQUIRED";
    if (project.budget?.status !== "APPROVED") return "NO_BUDGET";
    if (currentTask.predecessors.some((id) => findTask(project, id)?.status !== "COMPLETE")) return "DEPENDENCY_NOT_COMPLETE";
    const window = state.task_windows[currentTask.task_id];
    if (!window) return "SCHEDULE_REQUIRED";
    if (state.simulation_time + EPSILON < window.start) return "TASK_WINDOW_NOT_OPEN";
    if (state.simulation_time >= window.end - EPSILON) return "TASK_WINDOW_EXPIRED";
    const requiredEnd = state.simulation_time + currentTask.remaining_hours;
    if (requiredEnd > window.end + EPSILON) return "TASK_WINDOW_INSUFFICIENT";
    for (const skill of currentTask.skills) {
      const worker = currentTask.workers.map((workerId) => plan?.workforce.find((candidate) => candidate.worker_id === workerId)).find((candidate) => candidate?.skill === skill);
      if (!worker) return "NO_WORKERS";
      const reservation = state.worker_reservations.find((candidate) => candidate.project_id === project.project_id && candidate.task_id === currentTask.task_id && candidate.worker_id === worker.worker_id && !["RELEASED", "CANCELLED", "COMPLETE"].includes(candidate.status));
      if (!reservation || reservation.start > state.simulation_time + EPSILON || reservation.end + EPSILON < requiredEnd) return "SHIFT_OVERLAP";
    }
    for (const type of currentTask.equipment) {
      const reservation = state.equipment_reservations.find((candidate) => candidate.project_id === project.project_id && candidate.task_id === currentTask.task_id && !["RELEASED", "CANCELLED"].includes(candidate.status) && plan?.equipment.find((equipment) => equipment.equipment_id === candidate.equipment_id)?.type === type);
      if (!reservation || reservation.start > state.simulation_time + EPSILON || reservation.end + EPSILON < requiredEnd) return "NO_EQUIPMENT";
      const equipment = plan.equipment.find((candidate) => candidate.equipment_id === reservation.equipment_id);
      if (!equipment?.availability || equipment.maintenance_state !== "READY" || ["BROKEN", "RETIRED", "OUT_OF_SERVICE", "MAINTENANCE_REQUIRED"].includes(equipment.status)) return "EQUIPMENT_MAINTENANCE_REQUIRED";
    }
    for (const [materialId, quantity] of Object.entries(currentTask.materials)) if ((state.material_inventory[materialId]?.project_allocations?.[project.project_id] ?? 0) + EPSILON < quantity) return "NO_MATERIAL";
    if ((plan?.energy_budget ?? 0) + EPSILON < currentTask.energy) return "NO_ENERGY";
    return null;
  }

  function startTask(projectId, taskId) {
    return execute("START_TASK", { projectId, taskId }, { division_id: "CONSTRUCTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const currentTask = findTask(project, taskId);
      if (!currentTask) return { status: "BLOCKED", reason: "TASK_NOT_FOUND" };
      if (state.runtime_status !== "RUNNING") return { status: "BLOCKED", reason: "RUNTIME_PAUSED" };
      if (currentTask.predecessors.some((id) => findTask(project, id)?.status !== "COMPLETE")) return { status: "BLOCKED", reason: "DEPENDENCY_NOT_COMPLETE", project_id: projectId, task_id: taskId };
      if (!["READY", "PAUSED"].includes(currentTask.status)) return { status: "BLOCKED", reason: "TASK_NOT_READY" };
      const reason = taskResourceBlock(project, currentTask);
      if (reason) { currentTask.blocked_reason = reason; return { status: "BLOCKED", reason, project_id: projectId, task_id: taskId }; }
      currentTask.status = "IN_PROGRESS";
      currentTask.blocked_reason = null;
      currentTask.actual_start ??= state.simulation_time;
      project.status = "IN_PROGRESS";
      project.schedule.actual_start ??= state.simulation_time;
      for (const workerId of currentTask.workers) {
        const worker = findPlan(projectId).workforce.find((candidate) => candidate.worker_id === workerId);
        if (worker) worker.status = "WORKING";
      }
      for (const reservation of state.worker_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId)) reservation.status = "IN_USE";
      for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId)) reservation.status = "IN_USE";
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, outputs: { task_status: currentTask.status } };
    });
  }

  function pauseTask(projectId, taskId) {
    return execute("PAUSE_TASK", { projectId, taskId }, { division_id: "CONSTRUCTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const currentTask = findTask(findProject(projectId), taskId);
      if (!currentTask || currentTask.status !== "IN_PROGRESS") return { status: "BLOCKED", reason: "TASK_NOT_IN_PROGRESS" };
      currentTask.status = "PAUSED";
      currentTask.pause_started_at = state.simulation_time;
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, outputs: { task_status: currentTask.status } };
    });
  }

  function resumeTask(projectId, taskId) {
    return execute("RESUME_TASK", { projectId, taskId }, { division_id: "CONSTRUCTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const currentTask = findTask(findProject(projectId), taskId);
      if (!currentTask || currentTask.status !== "PAUSED") return { status: "BLOCKED", reason: "TASK_NOT_PAUSED" };
      if (state.runtime_status !== "RUNNING") return { status: "BLOCKED", reason: "RUNTIME_PAUSED" };
      const project = findProject(projectId);
      const pauseDelay = Math.max(0, state.simulation_time - (currentTask.pause_started_at ?? state.simulation_time));
      if (pauseDelay > EPSILON) {
        const currentWindow = state.task_windows[taskId];
        if (currentWindow) currentWindow.end += pauseDelay;
        for (const reservation of state.worker_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId && !["RELEASED", "CANCELLED", "COMPLETE"].includes(candidate.status))) reservation.end += pauseDelay;
        for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId && !["RELEASED", "CANCELLED"].includes(candidate.status))) reservation.end += pauseDelay;
        const pending = [...currentTask.successors];
        const shifted = new Set();
        while (pending.length) {
          const successorId = pending.shift();
          if (shifted.has(successorId)) continue;
          shifted.add(successorId);
          const successor = findTask(project, successorId);
          if (!successor) continue;
          const successorWindow = state.task_windows[successorId];
          if (successorWindow) { successorWindow.start += pauseDelay; successorWindow.end += pauseDelay; }
          for (const reservation of state.worker_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === successorId && candidate.status === "RESERVED")) { reservation.start += pauseDelay; reservation.end += pauseDelay; }
          for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === successorId && candidate.status === "RESERVED")) { reservation.start += pauseDelay; reservation.end += pauseDelay; }
          pending.push(...successor.successors);
        }
        project.schedule.execution_pause_delay = round((project.schedule.execution_pause_delay ?? 0) + pauseDelay);
        project.schedule.planned_end += pauseDelay;
        project.schedule.estimated_duration += pauseDelay;
      }
      const reason = taskResourceBlock(project, currentTask);
      if (reason) return { status: "BLOCKED", reason, project_id: projectId, task_id: taskId };
      currentTask.status = "IN_PROGRESS";
      currentTask.pause_started_at = null;
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, outputs: { task_status: currentTask.status } };
    });
  }

  function blockTask(projectId, taskId, reason = "MANUAL_SIMULATION_BLOCK") {
    return execute("BLOCK_TASK", { projectId, taskId, reason }, { division_id: "RISK_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const currentTask = findTask(findProject(projectId), taskId);
      if (!currentTask || ["COMPLETE", "CANCELLED"].includes(currentTask.status)) return { status: "BLOCKED", reason: "TASK_NOT_BLOCKABLE" };
      currentTask.status = "BLOCKED";
      currentTask.blocked_reason = String(reason);
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, outputs: { task_status: currentTask.status, blocked_reason: currentTask.blocked_reason } };
    });
  }

  function advanceTime(hours = 1) {
    return execute("ADVANCE_TIME", { hours }, { division_id: "CONSTRUCTION_DIVISION" }, () => {
      if (state.runtime_status !== "RUNNING") return { status: "BLOCKED", reason: "RUNTIME_PAUSED" };
      const requested = Number(hours);
      if (!Number.isFinite(requested) || requested <= 0 || requested > 720) return { status: "BLOCKED", reason: "INVALID_TIME_STEP" };
      const active = state.projects.flatMap((project) => project.tasks.map((currentTask) => ({ project, currentTask }))).filter(({ currentTask }) => currentTask.status === "IN_PROGRESS");
      let materialDelta = 0, energyDelta = 0, laborDelta = 0, equipmentDelta = 0, cashDelta = 0, progressDelta = 0;
      let firstBlock = null;
      for (const { project, currentTask } of active) {
        const resourceReason = taskResourceBlock(project, currentTask);
        if (resourceReason) { currentTask.status = "BLOCKED"; currentTask.blocked_reason = resourceReason; firstBlock ??= resourceReason; continue; }
        const step = Math.min(requested, currentTask.remaining_hours);
        const fraction = step / currentTask.duration_hours;
        const remainingFraction = step / currentTask.remaining_hours;
        const plan = findPlan(project.project_id);
        const requiredCost = money(step + EPSILON >= currentTask.remaining_hours ? currentTask.cost - currentTask.consumed.cost : currentTask.cost * fraction);
        if (project.budget.spent + project.budget.committed + requiredCost > project.budget.approved_budget + EPSILON) { currentTask.status = "BLOCKED"; currentTask.blocked_reason = "NO_BUDGET"; firstBlock ??= "NO_BUDGET"; continue; }
        const materialNeeds = Object.fromEntries(Object.entries(currentTask.materials).map(([materialId, total]) => {
          const remainingMaterial = Math.max(0, total - (currentTask.consumed.materials[materialId] ?? 0));
          return [materialId, round(step + EPSILON >= currentTask.remaining_hours ? remainingMaterial : remainingMaterial * remainingFraction)];
        }));
        const missingMaterial = Object.entries(materialNeeds).find(([materialId, amount]) => (state.material_inventory[materialId]?.project_allocations?.[project.project_id] ?? 0) + EPSILON < amount);
        if (missingMaterial) { currentTask.status = "BLOCKED"; currentTask.blocked_reason = "NO_MATERIAL"; firstBlock ??= "NO_MATERIAL"; continue; }
        const energyNeed = round(step + EPSILON >= currentTask.remaining_hours ? currentTask.energy - currentTask.consumed.energy : currentTask.energy * fraction);
        if (plan.energy_budget + EPSILON < energyNeed) { currentTask.status = "BLOCKED"; currentTask.blocked_reason = "NO_ENERGY"; firstBlock ??= "NO_ENERGY"; continue; }
        const charge = chargeProject(project, "TASK_LABOR_EQUIPMENT_ENERGY_COST", requiredCost);
        if (!charge.ok) { currentTask.status = "BLOCKED"; currentTask.blocked_reason = charge.reason; firstBlock ??= charge.reason; continue; }
        cashDelta += charge.cash_delta;
        for (const [materialId, amount] of Object.entries(materialNeeds)) {
          const inventory = state.material_inventory[materialId];
          const materialRecord = findPlan(project.project_id).bill_of_materials.find((item) => item.material_id === materialId);
          const bookValue = money(amount * (materialRecord?.unit_cost ?? 0));
          inventory.quantity = round(inventory.quantity - amount);
          inventory.project_allocations[project.project_id] = round(inventory.project_allocations[project.project_id] - amount);
          inventory.mass = round(Math.max(0, inventory.mass - amount * (materialRecord?.unit_mass ?? 0)));
          currentTask.consumed.materials[materialId] = round((currentTask.consumed.materials[materialId] ?? 0) + amount);
          if (bookValue > 0) {
            postLedger("MATERIAL_CONSUMPTION", project.project_id, "PROJECT_WORK_IN_PROGRESS", "MATERIAL_INVENTORY", bookValue, { inventory: -bookValue, work_in_progress: bookValue });
            project.accounting.work_in_progress = money(project.accounting.work_in_progress + bookValue);
          }
          materialDelta -= amount;
        }
        plan.energy_budget = round(plan.energy_budget - energyNeed);
        currentTask.consumed.energy = round(currentTask.consumed.energy + energyNeed);
        currentTask.consumed.labor_hours = round(currentTask.consumed.labor_hours + step * Math.max(1, currentTask.workers.length));
        currentTask.consumed.cost = money(currentTask.consumed.cost + requiredCost);
        currentTask.remaining_hours = round(Math.max(0, currentTask.remaining_hours - step));
        const oldProgress = currentTask.progress_percent;
        currentTask.progress_percent = round((1 - currentTask.remaining_hours / currentTask.duration_hours) * 100);
        progressDelta += currentTask.progress_percent - oldProgress;
        energyDelta -= energyNeed;
        laborDelta += step * Math.max(1, currentTask.workers.length);
        for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === project.project_id && candidate.task_id === currentTask.task_id)) {
          const equipment = plan.equipment.find((candidate) => candidate.equipment_id === reservation.equipment_id);
          if (equipment) { const wear = round(0.02 * fraction, 4); equipment.wear = clamp(round(equipment.wear + wear, 4), 0, 1); currentTask.consumed.equipment_wear = round(currentTask.consumed.equipment_wear + wear, 4); equipmentDelta += wear; }
        }
        if (currentTask.remaining_hours <= EPSILON) {
          currentTask.remaining_hours = 0;
          currentTask.progress_percent = 100;
          currentTask.status = "INSPECTION_PENDING";
          currentTask.actual_end = state.simulation_time + step;
        }
        project.progress_percent = round(project.tasks.reduce((sum, item) => sum + item.progress_percent, 0) / project.tasks.length);
      }
      state.simulation_time += requested;
      advanceProcurementOrders(state.simulation_time);
      updateCapacity();
      return { status: firstBlock ? "BLOCKED" : "COMPLETED", reason: firstBlock, material_delta: materialDelta, energy_delta: energyDelta, labor_delta: laborDelta, equipment_delta: equipmentDelta, cash_delta: money(cashDelta), progress_delta: round(progressDelta), outputs: { advanced_hours: requested, active_tasks: active.length } };
    });
  }

  function inspectTask(projectId, taskId, outcome = "PASS", details = {}) {
    return execute("INSPECT_TASK", { projectId, taskId, outcome, details }, { division_id: "QA_INSPECTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const currentTask = findTask(project, taskId);
      if (!currentTask || currentTask.status !== "INSPECTION_PENDING") return { status: "BLOCKED", reason: "TASK_NOT_READY_FOR_INSPECTION" };
      const normalizedOutcome = ["PASS", "PASS_WITH_CONDITIONS", "FAIL", "REWORK_REQUIRED", "NOT_READY"].includes(outcome) ? outcome : "NOT_READY";
      const inspection = {
        inspection_id: `AI-COMPANY-INSPECTION-${String(state.inspections.length + 1).padStart(5, "0")}`, project_id: projectId, task_id: taskId,
        inspection_type: currentTask.quality_gate === "FINAL_ACCEPTANCE" ? "FINAL_ACCEPTANCE" : "STAGE_INSPECTION",
        inspector: details.inspector ?? "KAIOS-SIMULATED-QA-INSPECTOR", criteria: clone(details.criteria ?? currentTask.end_condition),
        measurements: clone(details.measurements ?? { progress_percent: currentTask.progress_percent }), evidence: clone(details.evidence ?? ["DETERMINISTIC_EVENT_HISTORY"]),
        result: normalizedOutcome, defects: clone(details.defects ?? (normalizedOutcome === "PASS" ? [] : ["SIMULATED_DEFECT"])),
        rework: clone(details.rework ?? (normalizedOutcome === "PASS" ? [] : ["CREATE_EXPLICIT_REWORK_TASK"])),
        status: ["PASS", "PASS_WITH_CONDITIONS"].includes(normalizedOutcome) ? "COMPLETE" : "REWORK_OPEN", simulation_only: true
      };
      state.inspections.push(inspection);
      if (["PASS", "PASS_WITH_CONDITIONS"].includes(normalizedOutcome)) currentTask.status = "APPROVED";
      else currentTask.status = "REWORK_REQUIRED";
      updateCapacity();
      return { status: ["PASS", "PASS_WITH_CONDITIONS"].includes(normalizedOutcome) ? "COMPLETED" : "REWORK_REQUIRED", reason: normalizedOutcome === "PASS" ? null : normalizedOutcome, project_id: projectId, task_id: taskId, outputs: { inspection } };
    });
  }

  function completeTask(projectId, taskId) {
    return execute("COMPLETE_TASK", { projectId, taskId }, { division_id: "QA_INSPECTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const currentTask = findTask(project, taskId);
      if (!currentTask || currentTask.status !== "APPROVED") return { status: "BLOCKED", reason: "INSPECTION_APPROVAL_REQUIRED" };
      const completesProject = project.tasks.every((candidate) => candidate.task_id === taskId || candidate.status === "COMPLETE");
      if (completesProject) {
        const domainExecution = executeCanonicalDomainBinding(project.template_id, state.seed, project.location);
        if (domainExecution && !domainExecution.ok) return { status: "BLOCKED", reason: domainExecution.reason ?? "CANONICAL_RUNTIME_EXECUTION_FAILED", project_id: projectId, task_id: taskId, outputs: { domain_execution: domainExecution } };
        if (domainExecution) {
          project.domain_execution = clone(domainExecution);
          project.domain_evidence = clone(domainExecution);
        }
      }
      currentTask.status = "COMPLETE";
      for (const edge of project.dependencies.filter(({ predecessor_task_id }) => predecessor_task_id === taskId)) {
        edge.status = "SATISFIED";
        const successor = findTask(project, edge.successor_task_id);
        if (successor && successor.predecessors.every((id) => findTask(project, id)?.status === "COMPLETE")) successor.status = successor.remaining_hours === 0 ? "INSPECTION_PENDING" : "READY";
      }
      for (const reservation of state.worker_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId)) reservation.status = "COMPLETE";
      for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === projectId && candidate.task_id === taskId)) reservation.status = "RELEASED";
      const plan = findPlan(projectId);
      for (const workerId of currentTask.workers) { const worker = plan.workforce.find((candidate) => candidate.worker_id === workerId); if (worker) worker.status = "AVAILABLE"; }
      if (currentTask.rework_for_task_id) {
        const original = findTask(project, currentTask.rework_for_task_id);
        if (original) { original.status = "INSPECTION_PENDING"; original.blocked_reason = null; }
      }
      project.progress_percent = round(project.tasks.reduce((sum, item) => sum + (item.status === "COMPLETE" ? 100 : item.progress_percent), 0) / project.tasks.length);
      if (project.tasks.every(({ status }) => status === "COMPLETE")) { project.status = "DELIVERY_PENDING"; project.schedule.actual_end = state.simulation_time; project.schedule.status = "COMPLETE"; }
      updateCapacity();
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, progress_delta: 0, outputs: { task_status: currentTask.status, project_status: project.status } };
    });
  }

  function requestRework(projectId, taskId, options = {}) {
    return execute("REQUEST_REWORK", { projectId, taskId, options }, { division_id: "QA_INSPECTION_DIVISION", project_id: projectId, task_id: taskId }, () => {
      const project = findProject(projectId);
      const original = findTask(project, taskId);
      if (!original || original.status !== "REWORK_REQUIRED") return { status: "BLOCKED", reason: "REWORK_NOT_REQUIRED" };
      const duration = Number(options.duration_hours ?? Math.max(1, round(original.duration_hours * 0.25)));
      const reworkId = `${taskId}-REWORK-${String(project.tasks.filter(({ rework_for_task_id }) => rework_for_task_id === taskId).length + 1).padStart(2, "0")}`;
      const rework = {
        task_id: reworkId, task_code: "REWORK", work_package_id: original.work_package_id, objective: `Rework ${original.objective}`,
        location: original.location, start_condition: ["FAILED_INSPECTION"], end_condition: ["REWORK_TIME_COMPLETE", "REINSPECTION_PASS"],
        duration_hours: duration, remaining_hours: duration, workers: [], skills: clone(options.skills ?? original.skills.slice(0, 1)),
        materials: clone(options.materials ?? {}), equipment: clone(options.equipment ?? []), energy: Number(options.energy ?? 1), transport: [],
        cost: money(options.cost ?? Math.max(100, original.cost * 0.2)), predecessors: [], successors: [taskId],
        quality_gate: "STAGE_INSPECTION", safety_gate: original.safety_gate, status: "READY", progress_percent: 0,
        consumed: { labor_hours: 0, energy: 0, materials: Object.fromEntries(Object.keys(options.materials ?? {}).map((key) => [key, 0])), equipment_wear: 0, cost: 0 },
        blocked_reason: null, actual_start: null, actual_end: null, rework_for_task_id: taskId
      };
      project.tasks.push(rework);
      original.predecessors.push(reworkId);
      original.status = "BLOCKED";
      original.blocked_reason = "REWORK_TASK_REQUIRED";
      project.dependencies.push({ dependency_id: `${projectId}-DEPENDENCY-${String(project.dependencies.length + 1).padStart(3, "0")}`, predecessor_task_id: reworkId, successor_task_id: taskId, mandatory: true, status: "UNSATISFIED" });
      state.task_windows[reworkId] = { start: state.simulation_time, end: state.simulation_time + duration, location: rework.location };
      const originalWindow = state.task_windows[taskId];
      for (const [candidateTaskId, window] of Object.entries(state.task_windows)) {
        if (candidateTaskId === taskId || candidateTaskId === reworkId || !originalWindow || window.start + EPSILON < originalWindow.end) continue;
        window.start += duration;
        window.end += duration;
        for (const reservation of state.worker_reservations.filter((candidate) => candidate.task_id === candidateTaskId && candidate.status === "RESERVED")) { reservation.start += duration; reservation.end += duration; }
        for (const reservation of state.equipment_reservations.filter((candidate) => candidate.task_id === candidateTaskId && candidate.status === "RESERVED")) { reservation.start += duration; reservation.end += duration; }
      }
      project.schedule.rework_delay = round(project.schedule.rework_delay + duration);
      project.schedule.planned_end += duration;
      project.schedule.estimated_duration += duration;
      project.status = "REWORK_REQUIRED";
      return { status: "COMPLETED", project_id: projectId, task_id: taskId, outputs: { rework_task: clone(rework) } };
    });
  }

  function submitChangeOrder(projectId, changes = {}) {
    return execute("SUBMIT_CHANGE_ORDER", { projectId, changes }, { division_id: "CUSTOMER_SERVICE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project || isTerminalProject(project)) return { status: "BLOCKED", reason: "PROJECT_NOT_CHANGEABLE" };
      if (!project.budget || !project.schedule || !findPlan(projectId)) return { status: "BLOCKED", reason: "PROJECT_PLANNING_REQUIRED" };
      const addedCost = Number(changes.added_cost ?? 0), addedDuration = Number(changes.added_duration ?? 0);
      if (![addedCost, addedDuration].every(Number.isFinite) || addedCost < 0 || addedDuration < 0) return { status: "BLOCKED", reason: "INVALID_CHANGE_ORDER" };
      const materials = changes.materials ?? {};
      if (!materials || typeof materials !== "object" || Array.isArray(materials)) return { status: "BLOCKED", reason: "INVALID_CHANGE_MATERIALS" };
      let materialCost = 0;
      for (const [materialId, rawQuantity] of Object.entries(materials)) {
        const quantity = Number(rawQuantity);
        const profile = materialProfile(materialId);
        if (!profile) return { status: "BLOCKED", reason: "UNKNOWN_CHANGE_MATERIAL", outputs: { material_id: materialId } };
        if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) return { status: "BLOCKED", reason: "INVALID_CHANGE_MATERIAL_QUANTITY", outputs: { material_id: materialId } };
        materialCost += quantity * profile.unit_cost;
      }
      materialCost = money(materialCost);
      if (addedCost + EPSILON < materialCost) return { status: "BLOCKED", reason: "CHANGE_COST_UNDERESTIMATED", outputs: { minimum_added_cost: materialCost } };
      const workerSkills = unique(Array.isArray(changes.worker_skills) ? changes.worker_skills.map(String) : []);
      const equipmentTypes = unique(Array.isArray(changes.equipment) ? changes.equipment.map(String) : []);
      const knownSkills = new Set(WORKER_CATALOG.map(([skill]) => skill));
      if (workerSkills.some((skill) => !knownSkills.has(skill))) return { status: "BLOCKED", reason: "SKILL_NOT_AVAILABLE" };
      if (equipmentTypes.some((type) => !Object.hasOwn(EQUIPMENT_CATALOG, type))) return { status: "BLOCKED", reason: "NO_EQUIPMENT" };
      const requestedDependencies = unique(Array.isArray(changes.dependencies) ? changes.dependencies.map(String) : []);
      if (requestedDependencies.some((taskId) => !findTask(project, taskId))) return { status: "BLOCKED", reason: "DEPENDENCY_REFERENCE_MISSING" };
      const change = {
        change_order_id: `AI-COMPANY-CHANGE-${String(state.change_orders.length + 1).padStart(5, "0")}`,
        project_id: projectId,
        description: String(changes.description ?? "SIMULATED_SCOPE_CHANGE"),
        added_cost: money(addedCost),
        added_duration: round(addedDuration),
        materials: clone(materials),
        material_cost: materialCost,
        worker_skills: workerSkills,
        equipment: equipmentTypes,
        requested_dependencies: requestedDependencies,
        rights_review: Boolean(changes.rights_review ?? true),
        safety_review: Boolean(changes.safety_review ?? true),
        dependencies_reviewed: false,
        impact_analysis: null,
        status: "CHANGE_REQUESTED",
        simulation_only: true
      };
      state.change_orders.push(change);
      return { status: "COMPLETED", project_id: projectId, outputs: { change_order: clone(change) } };
    });
  }

  function approveChangeOrder(changeOrderId, options = {}) {
    return execute("APPROVE_CHANGE_ORDER", { changeOrderId, options }, { division_id: "ARCHITECTURE_DIVISION" }, () => {
      const change = state.change_orders.find(({ change_order_id }) => change_order_id === changeOrderId);
      const project = change && findProject(change.project_id);
      if (!change || !project || change.status !== "CHANGE_REQUESTED") return { status: "BLOCKED", reason: "CHANGE_ORDER_NOT_REVIEWABLE" };
      if (!change.rights_review || !change.safety_review) return { status: "BLOCKED", reason: "CHANGE_REVIEW_REQUIRED", project_id: project.project_id };
      const approvedDelta = money(options.approved_budget_delta ?? change.added_cost);
      if (!Number.isFinite(approvedDelta) || approvedDelta < change.added_cost) return { status: "BLOCKED", reason: "NO_BUDGET", project_id: project.project_id };
      const newApprovedBudget = money(project.budget.approved_budget + approvedDelta);
      const newEstimatedCost = money(project.budget.total_estimated_cost + change.added_cost);
      const newExposure = money(Math.max(newApprovedBudget, newEstimatedCost));
      const exposureWithoutProject = money(state.capacity.financial_exposure - project.capacity_reserved);
      if (exposureWithoutProject + newExposure > state.capacity.max_financial_exposure + EPSILON) return { status: "BLOCKED", reason: "COMPANY_CAPACITY_EXCEEDED", project_id: project.project_id, outputs: { capacity_reason: "MAX_FINANCIAL_EXPOSURE" } };
      const plan = findPlan(project.project_id);
      const addedMass = Object.entries(change.materials).reduce((sum, [materialId, quantity]) => sum + materialProfile(materialId).unit_mass * quantity, 0);
      const plannedMass = plan.bill_of_materials.reduce((sum, item) => sum + item.total_mass, 0);
      if (plannedMass + addedMass > plan.warehouse_capacity + EPSILON) return { status: "BLOCKED", reason: "NO_WAREHOUSE", project_id: project.project_id };
      const priorLastTask = project.tasks.at(-1) ?? null;
      const changeDuration = change.added_duration > 0 || Object.keys(change.materials).length ? Math.max(1, change.added_duration) : 0;
      const totalTasks = state.projects.reduce((sum, candidate) => sum + candidate.tasks.length, 0);
      if (changeDuration > 0 && totalTasks + 1 > MAX_TASKS) return { status: "BLOCKED", reason: "STATE_LIMIT", project_id: project.project_id };
      const defaultSkill = project.project_kind === "PHYSICAL" ? "GENERAL_LABORER" : "ARCHITECT";
      const defaultEquipment = project.project_kind === "PHYSICAL" ? "HAND_TOOL" : "COMPUTER";
      const changeSkills = change.worker_skills.length ? change.worker_skills : changeDuration ? [defaultSkill] : [];
      const changeEquipment = change.equipment.length ? change.equipment : changeDuration ? [defaultEquipment] : [];
      for (const skill of changeSkills) {
        if (!plan.workforce.some((worker) => worker.skill === skill)) {
          const worker = state.workforce_pool.find((candidate) => candidate.skill === skill);
          if (!worker) return { status: "BLOCKED", reason: "SKILL_NOT_AVAILABLE", project_id: project.project_id };
          plan.workforce.push(clone(worker));
        }
      }
      for (const type of changeEquipment) {
        if (!plan.equipment.some((equipment) => equipment.type === type)) {
          const equipment = state.equipment_pool.find((candidate) => candidate.type === type);
          if (!equipment || !equipment.availability || equipment.maintenance_state !== "READY") return { status: "BLOCKED", reason: "NO_EQUIPMENT", project_id: project.project_id };
          plan.equipment.push(clone(equipment));
        }
      }
      const addedBomIds = [];
      for (const [materialId, quantity] of Object.entries(change.materials)) {
        const profile = materialProfile(materialId);
        const index = plan.bill_of_materials.length + 1;
        const item = {
          bom_id: `${project.project_id}-BOM-${String(index).padStart(3, "0")}`,
          project_id: project.project_id, material_id: materialId,
          description: `${materialId.replaceAll("_", " ")} / CHANGE ORDER`, quantity: round(quantity),
          unit: "SIMULATION_UNIT", unit_mass: profile.unit_mass,
          total_mass: round(quantity * profile.unit_mass), required_quality: "STANDARD_SIMULATION",
          supplier: `SIMULATED-SUPPLIER-${materialId}`, availability: quantity, lead_time: 2 + index,
          unit_cost: profile.unit_cost, total_cost: money(quantity * profile.unit_cost),
          storage_requirement: "SIMULATED_WAREHOUSE", transport_requirement: "CAUSAL_ROUTE",
          waste_factor: 0.05, recyclable: !materialId.includes("STOCK"), status: "PLANNED",
          change_order_id: change.change_order_id
        };
        plan.bill_of_materials.push(item);
        addedBomIds.push(item.bom_id);
        plan.supply_chain.push({
          transport_id: `${project.project_id}-TRANSPORT-${String(plan.supply_chain.length + 1).padStart(3, "0")}`,
          bom_id: item.bom_id,
          origin: item.supplier, destination: project.location ?? "LOCAL_SIMULATION_WORKSPACE",
          route: `CAUSAL-ROUTE-${String(plan.supply_chain.length + 1).padStart(3, "0")}`,
          quantity: item.quantity, mass: item.total_mass, vehicle: "SIMULATED-TRUCK-001",
          fuel: round(2 + item.total_mass / 1000), loading_time: 1, travel_time: 3 + index,
          unloading_time: 1, cost: money(40 + item.total_mass * 0.05), risk: 0.1,
          status: "PLANNED", change_order_id: change.change_order_id
        });
      }
      let changeTask = null;
      if (changeDuration > 0) {
        const taskId = `${project.project_id}-TASK-CHANGE-${String(state.change_orders.filter((item) => item.project_id === project.project_id).length).padStart(3, "0")}`;
        const predecessors = change.requested_dependencies.length ? change.requested_dependencies : priorLastTask ? [priorLastTask.task_id] : [];
        changeTask = {
          task_id: taskId, task_code: "APPROVED_CHANGE_ORDER", work_package_id: project.work_packages[0]?.work_package_id ?? null,
          objective: change.description, location: project.location ?? "LOCAL_SIMULATION_WORKSPACE",
          start_condition: predecessors.map((id) => `PREDECESSOR_${id}_COMPLETE`),
          end_condition: ["TIME_COMPLETE", "RESOURCES_CONSUMED", "INSPECTION_PASS"],
          duration_hours: changeDuration, remaining_hours: changeDuration, workers: [], skills: changeSkills,
          materials: clone(change.materials), equipment: changeEquipment,
          energy: Math.max(1, round(changeDuration * 0.5)), transport: Object.keys(change.materials),
          cost: money(Math.max(0, change.added_cost - change.material_cost)), predecessors, successors: [],
          quality_gate: "STAGE_INSPECTION", safety_gate: project.project_kind === "PHYSICAL" ? "SIMULATED_SITE_SAFETY" : "SIMULATED_CODE_SAFETY",
          status: predecessors.every((id) => findTask(project, id)?.status === "COMPLETE") ? "READY" : "NOT_READY",
          progress_percent: 0,
          consumed: { labor_hours: 0, energy: 0, materials: Object.fromEntries(Object.keys(change.materials).map((key) => [key, 0])), equipment_wear: 0, cost: 0 },
          blocked_reason: null, actual_start: null, actual_end: null, rework_for_task_id: null,
          change_order_id: change.change_order_id
        };
        project.tasks.push(changeTask);
        for (const predecessorId of predecessors) {
          const predecessor = findTask(project, predecessorId);
          if (predecessor && !predecessor.successors.includes(taskId)) predecessor.successors.push(taskId);
          project.dependencies.push({ dependency_id: `${project.project_id}-DEPENDENCY-${String(project.dependencies.length + 1).padStart(3, "0")}`, predecessor_task_id: predecessorId, successor_task_id: taskId, mandatory: true, status: predecessor?.status === "COMPLETE" ? "SATISFIED" : "UNSATISFIED" });
        }
        const start = project.schedule.planned_end;
        state.task_windows[taskId] = { start, end: start + changeDuration, location: changeTask.location };
        project.deliverables[0].acceptance_criteria.push(`CHANGE_ORDER_${change.change_order_id}_COMPLETE`);
      }
      project.budget.project_budget = money(project.budget.project_budget + approvedDelta);
      project.budget.approved_budget = newApprovedBudget;
      project.budget.material_cost = money(project.budget.material_cost + change.material_cost);
      project.budget.contingency = money(project.budget.contingency + Math.max(0, change.added_cost - change.material_cost));
      project.budget.total_estimated_cost = newEstimatedCost;
      project.budget.forecast_at_completion = newEstimatedCost;
      project.budget.remaining = money(project.budget.approved_budget - project.budget.spent - project.budget.committed);
      project.schedule.planned_end += change.added_duration;
      project.schedule.estimated_duration += change.added_duration;
      if (changeTask && changeDuration !== change.added_duration) {
        project.schedule.planned_end += changeDuration - change.added_duration;
        project.schedule.estimated_duration += changeDuration - change.added_duration;
      }
      project.capacity_reserved = newExposure;
      plan.status = addedBomIds.length ? "PARTIALLY_AVAILABLE" : plan.status;
      change.status = "APPROVED";
      change.dependencies_reviewed = true;
      change.impact_analysis = {
        budget: "RECALCULATED", schedule: "RECALCULATED", materials: addedBomIds.length ? "PROCUREMENT_REQUIRED" : "UNCHANGED_REVALIDATED",
        workforce: changeSkills.length ? "REVALIDATED" : "UNCHANGED_REVALIDATED",
        equipment: changeEquipment.length ? "REVALIDATED" : "UNCHANGED_REVALIDATED",
        rights: "PASS_SIMULATION", safety: "PASS_SIMULATION", dependencies: "RECALCULATED",
        procurement: addedBomIds.length ? "REQUIRED" : "NOT_REQUIRED", financial_exposure: newExposure
      };
      updateCapacity();
      return { status: "ACCEPTED", project_id: project.project_id, outputs: { change_order: clone(change), budget: clone(project.budget), schedule: clone(project.schedule) } };
    });
  }

  function scheduleMaintenance(projectId, options = {}) {
    return execute("SCHEDULE_MAINTENANCE", { projectId, options }, { division_id: "MAINTENANCE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project) return { status: "BLOCKED", reason: "PROJECT_NOT_FOUND" };
      const plan = { maintenance_id: `AI-COMPANY-MAINTENANCE-${String(state.maintenance_plans.length + 1).padStart(5, "0")}`, project_id: projectId, maintenance_schedule: options.maintenance_schedule ?? "EVERY_720_SIMULATION_HOURS", inspection_schedule: options.inspection_schedule ?? "EVERY_360_SIMULATION_HOURS", wear_monitoring: true, repair_responsibility: "SIMULATED_AI_COMPANY", spare_parts: clone(options.spare_parts ?? []), energy_requirements: Number(options.energy_requirements ?? 1), operating_cost: money(options.operating_cost ?? 100), failure_response: "PAUSE_AND_REPAIR_SIMULATION", asset_status: "OPERATIONAL", status: "ACTIVE", simulation_only: true };
      state.maintenance_plans.push(plan);
      return { status: "COMPLETED", project_id: projectId, outputs: { maintenance_plan: clone(plan) } };
    });
  }

  function deliverProject(projectId) {
    return execute("DELIVER_PROJECT", { projectId }, { division_id: "DELIVERY_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project || !project.tasks.length || !project.tasks.every(({ status }) => status === "COMPLETE")) return { status: "BLOCKED", reason: "MANDATORY_TASKS_INCOMPLETE" };
      if (!state.maintenance_plans.some((plan) => plan.project_id === projectId && plan.status === "ACTIVE")) return { status: "BLOCKED", reason: "MAINTENANCE_PLAN_REQUIRED" };
      const latestInspectionByTask = new Map();
      for (const inspection of state.inspections.filter((candidate) => candidate.project_id === projectId)) latestInspectionByTask.set(inspection.task_id, inspection);
      if (project.tasks.some((task) => !["PASS", "PASS_WITH_CONDITIONS"].includes(latestInspectionByTask.get(task.task_id)?.result))) return { status: "BLOCKED", reason: "INSPECTION_FAILED" };
      const delivery = { delivery_id: `AI-COMPANY-DELIVERY-${String(state.deliveries.length + 1).padStart(5, "0")}`, project_id: projectId, deliverable_ids: project.deliverables.map(({ deliverable_id }) => deliverable_id), documentation_complete: true, rights_package: "SIMULATED_RIGHTS_PACKAGE", maintenance_plan_complete: true, final_accounting_complete: true, status: "DELIVERED", customer_outcome: null, simulation_only: true };
      state.deliveries.push(delivery);
      project.status = "ACCEPTANCE_PENDING";
      project.deliverables.forEach((item) => { item.status = "READY_FOR_INSPECTION"; });
      return { status: "COMPLETED", project_id: projectId, outputs: { delivery: clone(delivery) } };
    });
  }

  function acceptProject(projectId, outcome = "ACCEPTED") {
    return execute("ACCEPT_PROJECT", { projectId, outcome }, { division_id: "DELIVERY_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      const delivery = state.deliveries.find((candidate) => candidate.project_id === projectId);
      if (!project || !delivery || delivery.status !== "DELIVERED") return { status: "BLOCKED", reason: "DELIVERY_REQUIRED" };
      if (!["ACCEPTED", "ACCEPTED_WITH_CONDITIONS", "REJECTED", "REWORK_REQUIRED"].includes(outcome)) return { status: "BLOCKED", reason: "INVALID_ACCEPTANCE_OUTCOME" };
      delivery.customer_outcome = outcome;
      if (!["ACCEPTED", "ACCEPTED_WITH_CONDITIONS"].includes(outcome)) { project.status = "REWORK_REQUIRED"; delivery.status = "REWORK_REQUIRED"; return { status: "REWORK_REQUIRED", reason: outcome, project_id: projectId }; }
      delivery.status = "ACCEPTED";
      project.status = "COMPLETE";
      project.deliverables.forEach((item) => { item.status = "ACCEPTED"; });
      const request = findRequest(project.request_id);
      request.status = "COMPLETED";
      const contract = findContract(projectId);
      contract.status = "COMPLETED";
      recognizeProjectRevenue(project, contract);
      return { status: outcome, project_id: projectId, cash_delta: 0, outputs: { project_status: project.status, approval_status: project.approval_status, external_deployment: project.external_deployment } };
    });
  }

  function closeProject(projectId) {
    return execute("CLOSE_PROJECT", { projectId }, { division_id: "FINANCE_DIVISION", project_id: projectId }, () => {
      const project = findProject(projectId);
      if (!project || project.status !== "COMPLETE") return { status: "BLOCKED", reason: "ACCEPTED_PROJECT_REQUIRED" };
      if (project.closed_at !== null) return { status: "BLOCKED", reason: "PROJECT_ALREADY_CLOSED" };
      if (project.accounting.work_in_progress > 0) {
        const amount = project.accounting.work_in_progress;
        postLedger("PROJECT_WORK_IN_PROGRESS_CLOSEOUT", projectId, "PROJECT_COST", "PROJECT_WORK_IN_PROGRESS", amount, { work_in_progress: -amount });
        project.accounting.work_in_progress = 0;
      }
      project.closed_at = state.simulation_time;
      project.closeout_status = "CLOSED_BALANCED_SIMULATION";
      project.capacity_reserved = 0;
      for (const reservation of state.worker_reservations.filter((candidate) => candidate.project_id === projectId)) reservation.status = "RELEASED";
      for (const reservation of state.equipment_reservations.filter((candidate) => candidate.project_id === projectId)) reservation.status = "RELEASED";
      updateCapacity();
      return { status: "COMPLETED", project_id: projectId, outputs: { closeout_status: project.closeout_status, profit_or_loss: money(project.accounting.revenue - project.accounting.cost) } };
    });
  }

  function restructureCompany(options = {}) {
    return execute("RESTRUCTURE_COMPANY", { options }, { division_id: "FINANCE_DIVISION" }, () => {
      if (!["DISTRESS", "INSOLVENT", "PAYMENT_DELAY", "CASH_FLOW_WARNING"].includes(state.company.status)) return { status: "BLOCKED", reason: "COMPANY_NOT_IN_DISTRESS" };
      const record = {
        recovery_id: `AI-COMPANY-RECOVERY-${String(state.company_recovery.length + 1).padStart(4, "0")}`,
        recovery_type: "RESTRUCTURING_SIMULATION",
        simulation_time: state.simulation_time,
        plan: clone(options.plan ?? ["FREEZE_NEW_PROJECTS", "REVIEW_PAYABLES", "PRESERVE_WAGE_CLAIMS", "RENEGOTIATE_SIMULATED_DEBT"]),
        real_legal_effect: false,
        assets_preserved: true,
        status: "ACTIVE"
      };
      state.company_recovery.push(record);
      state.company.status = "RESTRUCTURING_SIMULATION";
      return { status: "COMPLETED", outputs: { company_status: state.company.status, recovery: record } };
    });
  }

  function enterCourtProtection() {
    return execute("ENTER_COURT_PROTECTION_SIMULATION", {}, { division_id: "LEGAL_SIMULATION_DIVISION" }, () => {
      if (!["RESTRUCTURING_SIMULATION", "INSOLVENT"].includes(state.company.status)) return { status: "BLOCKED", reason: "RESTRUCTURING_OR_INSOLVENCY_REQUIRED" };
      const record = {
        recovery_id: `AI-COMPANY-RECOVERY-${String(state.company_recovery.length + 1).padStart(4, "0")}`,
        recovery_type: "COURT_PROTECTION_SIMULATION", simulation_time: state.simulation_time,
        asset_transfer_freeze: true, real_legal_effect: false, assets_preserved: true, status: "ACTIVE"
      };
      state.company_recovery.push(record);
      state.company.status = "COURT_PROTECTION_SIMULATION";
      return { status: "COMPLETED", outputs: { company_status: state.company.status, recovery: record, warning: "NO_REAL_LEGAL_EFFECT" } };
    });
  }

  function liquidateCompany() {
    return execute("LIQUIDATE_COMPANY_SIMULATION", {}, { division_id: "FINANCE_DIVISION" }, () => {
      if (!["COURT_PROTECTION_SIMULATION", "INSOLVENT"].includes(state.company.status)) return { status: "BLOCKED", reason: "COURT_PROTECTION_OR_INSOLVENCY_REQUIRED" };
      const assets = {
        equipment: state.equipment_pool.map(({ equipment_id, type, owner, status }) => ({ equipment_id, type, owner, status, disposition: "PRESERVED_PENDING_SIMULATED_DISTRIBUTION" })),
        material_inventory: clone(state.material_inventory),
        projects: state.projects.map(({ project_id, status, accounting }) => ({ project_id, status, accounting: clone(accounting), disposition: "RECORDED" }))
      };
      for (const project of state.projects.filter((candidate) => !isTerminalProject(candidate))) {
        project.status = "CANCELLED";
        project.closed_at = state.simulation_time;
        project.closeout_status = "LIQUIDATION_ASSET_CONTINUITY";
        project.capacity_reserved = 0;
      }
      for (const reservation of state.worker_reservations) if (!["COMPLETE", "RELEASED"].includes(reservation.status)) reservation.status = "RELEASED";
      for (const reservation of state.equipment_reservations) if (reservation.status !== "RELEASED") reservation.status = "RELEASED";
      for (const contract of state.contracts.filter(({ status }) => status !== "COMPLETED")) contract.status = "TERMINATED_SIMULATION";
      const record = {
        recovery_id: `AI-COMPANY-RECOVERY-${String(state.company_recovery.length + 1).padStart(4, "0")}`,
        recovery_type: "LIQUIDATION_SIMULATION", simulation_time: state.simulation_time,
        assets, asset_records_preserved: true, real_legal_effect: false, status: "ACTIVE"
      };
      state.company_recovery.push(record);
      state.company.status = "LIQUIDATION_SIMULATION";
      updateCapacity();
      return { status: "COMPLETED", outputs: { company_status: state.company.status, recovery: record } };
    });
  }

  function dissolveCompany() {
    return execute("DISSOLVE_COMPANY_SIMULATION", {}, { division_id: "LEGAL_SIMULATION_DIVISION" }, () => {
      const liquidation = [...state.company_recovery].reverse().find(({ recovery_type }) => recovery_type === "LIQUIDATION_SIMULATION");
      if (state.company.status !== "LIQUIDATION_SIMULATION" || !liquidation?.asset_records_preserved) return { status: "BLOCKED", reason: "LIQUIDATION_AND_ASSET_INVENTORY_REQUIRED" };
      state.company.status = "DISSOLVED";
      state.company_recovery.push({
        recovery_id: `AI-COMPANY-RECOVERY-${String(state.company_recovery.length + 1).padStart(4, "0")}`,
        recovery_type: "DISSOLUTION_SIMULATION", simulation_time: state.simulation_time,
        predecessor_recovery_id: liquidation.recovery_id, asset_records_preserved: true,
        real_legal_effect: false, status: "COMPLETE"
      });
      return { status: "COMPLETED", outputs: { company_status: state.company.status, asset_records_preserved: true } };
    });
  }

  function validateState(candidate) {
    const issues = [];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return ["INVALID_STATE_ROOT"];
    if (hasForbiddenObjectKey(candidate)) issues.push("FORBIDDEN_OBJECT_KEY");
    if (candidate.runtime !== AI_COMPANY_RUNTIME_ID || candidate.schema_version !== AI_COMPANY_SCHEMA_VERSION || candidate.mode !== "LOCAL_DETERMINISTIC_SIMULATION") issues.push("RUNTIME_IDENTITY");
    const boundaries = candidate.boundaries ?? {};
    for (const key of ["simulation_only"]) if (boundaries[key] !== true) issues.push("AUTHORITY_BOUNDARY");
    for (const key of ["wallet_access", "real_wallet", "real_kgen", "onchain_transfer", "real_legal_effect", "production_authority", "external_autonomous_execution", "unbounded_spending", "self_modifying_production_code", "constitution_source_modification", "current_modification", "mutation_endpoints"]) if (boundaries[key] !== false) issues.push("AUTHORITY_BOUNDARY");
    if (candidate.company?.company_id !== COMPANY_ID || candidate.company?.authority?.simulation_only !== true || candidate.company?.authority?.external_execution !== false || candidate.company?.authority?.real_legal_effect !== false || candidate.company?.authority?.production_authority !== false) issues.push("COMPANY_AUTHORITY");
    const divisionIds = candidate.company?.divisions?.map(({ division_id }) => division_id) ?? [];
    if (divisionIds.length !== REQUIRED_DIVISIONS.length || unique(divisionIds).length !== REQUIRED_DIVISIONS.length || REQUIRED_DIVISIONS.some((id) => !divisionIds.includes(id))) issues.push("DIVISION_CONTRACT");
    if (![candidate.requests, candidate.projects, candidate.resource_plans, candidate.contracts, candidate.procurement_orders, candidate.inspections, candidate.change_orders, candidate.deliveries, candidate.maintenance_plans, candidate.company_recovery, candidate.worker_reservations, candidate.equipment_reservations, candidate.events, candidate.action_log, candidate.ledger].every(Array.isArray)) issues.push("STATE_STRUCTURE");
    if ((candidate.requests?.length ?? 0) > MAX_REQUESTS || (candidate.projects?.length ?? 0) > MAX_PROJECTS || (candidate.projects ?? []).reduce((sum, project) => sum + (project.tasks?.length ?? 0), 0) > MAX_TASKS || (candidate.events?.length ?? 0) > MAX_EVENTS || (candidate.action_log?.length ?? 0) > MAX_ACTIONS) issues.push("STATE_LIMIT");
    if (allNumbers(candidate).some((value) => !Number.isFinite(value))) issues.push("NONFINITE_NUMERIC_STATE");
    const capacity = candidate.capacity ?? {};
    if (capacity.active_projects > capacity.max_active_projects || capacity.active_physical_projects > capacity.max_active_physical_projects || capacity.active_digital_projects > capacity.max_active_digital_projects || capacity.compute_load > capacity.max_compute_load + EPSILON || capacity.review_queue > capacity.max_review_queue || capacity.procurement_queue > capacity.max_procurement_queue || capacity.worker_assignments > capacity.max_worker_assignments || capacity.financial_exposure > capacity.max_financial_exposure + EPSILON) issues.push("CAPACITY_BOUNDARY");
    const activeProjects = (candidate.projects ?? []).filter((project) => !isTerminalProject(project));
    const expectedCapacity = {
      active_projects: activeProjects.length,
      active_physical_projects: activeProjects.filter(({ project_kind }) => project_kind === "PHYSICAL").length,
      active_digital_projects: activeProjects.filter(({ project_kind }) => project_kind === "DIGITAL").length,
      compute_load: round(activeProjects.filter(({ project_kind }) => project_kind === "DIGITAL").reduce((sum, project) => sum + project.compute_reservation, 0), 3),
      review_queue: (candidate.projects ?? []).flatMap((project) => project.tasks ?? []).filter(({ status }) => status === "INSPECTION_PENDING").length,
      procurement_queue: (candidate.procurement_orders ?? []).filter(({ status }) => !PROCUREMENT_TERMINAL_STATUSES.has(status)).length,
      worker_assignments: (candidate.worker_reservations ?? []).filter(({ status }) => !["COMPLETE", "RELEASED", "CANCELLED"].includes(status)).length,
      financial_exposure: money(activeProjects.reduce((sum, project) => sum + project.capacity_reserved, 0))
    };
    if (Object.entries(expectedCapacity).some(([key, value]) => Math.abs((capacity[key] ?? Number.NaN) - value) > EPSILON)) issues.push("CAPACITY_RECONCILIATION");
    if (Math.abs((candidate.company?.finance?.cash ?? Number.NaN) - (candidate.finance?.cash ?? Number.NaN)) > EPSILON || Math.abs((candidate.company?.finance?.financial_exposure ?? Number.NaN) - (capacity.financial_exposure ?? Number.NaN)) > EPSILON) issues.push("COMPANY_FINANCE_RECONCILIATION");
    for (const project of candidate.projects ?? []) {
      if (!REQUIRED_TEMPLATES.includes(project.template_id)) issues.push("PROJECT_TEMPLATE");
      if (!Array.isArray(project.risks) || project.risks.length === 0) issues.push("PROJECT_RISK_ASSESSMENT");
      const graph = topologicalOrder(project);
      if (graph.cycle) issues.push(graph.reason);
      const ids = project.tasks.map(({ task_id }) => task_id);
      if (unique(ids).length !== ids.length) issues.push("DUPLICATE_TASK_ID");
      const plan = (candidate.resource_plans ?? []).find(({ project_id }) => project_id === project.project_id);
      for (const currentTask of project.tasks) {
        if (Object.entries(currentTask.materials ?? {}).some(([materialId, quantity]) => !materialProfile(materialId) || !Number.isFinite(quantity) || quantity < 0)) issues.push("TASK_MATERIAL_CONTRACT");
        if (currentTask.status === "COMPLETE" && currentTask.predecessors.some((id) => findTask(project, id)?.status !== "COMPLETE")) issues.push("DEPENDENCY_SKIPPED");
        if (currentTask.status !== "COMPLETE" || project.project_kind !== "PHYSICAL") continue;
        const window = candidate.task_windows?.[currentTask.task_id];
        if (!window || currentTask.actual_start === null || currentTask.actual_end === null || currentTask.actual_start + EPSILON < window.start || currentTask.actual_end > window.end + EPSILON) issues.push("PHYSICAL_TASK_WINDOW_VIOLATION");
        for (const skill of currentTask.skills ?? []) {
          const worker = currentTask.workers.map((workerId) => plan?.workforce?.find((candidateWorker) => candidateWorker.worker_id === workerId)).find((candidateWorker) => candidateWorker?.skill === skill);
          const reservation = (candidate.worker_reservations ?? []).find((item) => item.project_id === project.project_id && item.task_id === currentTask.task_id && item.worker_id === worker?.worker_id);
          if (!worker || !reservation || reservation.start > currentTask.actual_start + EPSILON || reservation.end + EPSILON < currentTask.actual_end) issues.push("PHYSICAL_WORKER_RESERVATION_VIOLATION");
        }
        for (const type of currentTask.equipment ?? []) {
          const reservation = (candidate.equipment_reservations ?? []).find((item) => item.project_id === project.project_id && item.task_id === currentTask.task_id && plan?.equipment?.find((equipment) => equipment.equipment_id === item.equipment_id)?.type === type);
          if (!reservation || reservation.start > currentTask.actual_start + EPSILON || reservation.end + EPSILON < currentTask.actual_end) issues.push("PHYSICAL_EQUIPMENT_RESERVATION_VIOLATION");
        }
      }
      if (project.budget && Math.abs(project.budget.remaining - (project.budget.approved_budget - project.budget.spent - project.budget.committed)) > EPSILON) issues.push("BUDGET_RECONCILIATION");
      if (project.budget && [project.budget.approved_budget, project.budget.spent, project.budget.committed, project.budget.remaining, project.budget.total_estimated_cost].some((value) => !Number.isFinite(value) || value < -EPSILON)) issues.push("BUDGET_CONTRACT");
      if (["FISHPOND_PROJECT", "BASIC_HOUSE_PROJECT"].includes(project.template_id) && project.tasks.length && project.tasks.every(({ status }) => status === "COMPLETE")) {
        const execution = project.domain_execution;
        if (execution?.adapter !== "EXECUTED_CANONICAL_RUNTIME" || execution?.execution_status !== "COMPLETE" || execution?.integrity_verified !== true || execution?.simulation_only !== true) issues.push("CANONICAL_DOMAIN_EXECUTION_REQUIRED");
      }
    }
    for (const plan of candidate.resource_plans ?? []) {
      for (const item of plan.bill_of_materials ?? []) {
        if (!materialProfile(item.material_id) || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.total_mass) || item.total_mass < 0 || !Number.isFinite(item.total_cost) || item.total_cost < 0) issues.push("BOM_CONTRACT");
      }
      const plannedMass = (plan.bill_of_materials ?? []).reduce((sum, item) => sum + item.total_mass, 0);
      if (!Number.isFinite(plan.warehouse_capacity) || plan.warehouse_capacity < 0 || plannedMass > plan.warehouse_capacity + EPSILON) issues.push("WAREHOUSE_CAPACITY_CONTRACT");
    }
    for (const order of candidate.procurement_orders ?? []) {
      const history = order.state_history ?? [];
      if (!history.length || history[0].status !== "RFQ_CREATED" || history.at(-1).status !== order.status) issues.push("PROCUREMENT_HISTORY");
      for (let index = 1; index < history.length; index += 1) {
        const previous = history[index - 1], current = history[index];
        const terminalFailure = current.status === "INSPECTION_FAILED" && previous.status === "RECEIVED";
        if (!terminalFailure && (!Object.hasOwn(PROCUREMENT_RANK, previous.status) || !Object.hasOwn(PROCUREMENT_RANK, current.status) || PROCUREMENT_RANK[current.status] !== PROCUREMENT_RANK[previous.status] + 1)) issues.push("PROCUREMENT_SEQUENCE");
        if (current.simulation_time + EPSILON < previous.simulation_time) issues.push("PROCUREMENT_TIME_CAUSALITY");
      }
      if (PROCUREMENT_TERMINAL_STATUSES.has(order.status) && !["PAYMENT_APPROVED", "INSPECTION_FAILED", "CANCELLED"].includes(order.status)) issues.push("PROCUREMENT_STATUS");
    }
    const ledgerDebits = money((candidate.ledger ?? []).reduce((sum, entry) => sum + entry.debit_amount, 0));
    const ledgerCredits = money((candidate.ledger ?? []).reduce((sum, entry) => sum + entry.credit_amount, 0));
    if (Math.abs(ledgerDebits - ledgerCredits) > EPSILON || (candidate.ledger ?? []).some((entry) => entry.balanced !== true || entry.debit_amount <= 0 || Math.abs(entry.debit_amount - entry.credit_amount) > EPSILON)) issues.push("LEDGER_BALANCE");
    const reconciled = Object.fromEntries(Object.keys(candidate.finance ?? {}).filter((key) => key !== "opening_cash" && key !== "profit_or_loss").map((key) => [key, key === "cash" ? candidate.finance.opening_cash : 0]));
    for (const entry of candidate.ledger ?? []) for (const [key, delta] of Object.entries(entry.deltas ?? {})) if (key in reconciled) reconciled[key] = money(reconciled[key] + delta);
    for (const [key, expected] of Object.entries(reconciled)) if (Math.abs(expected - candidate.finance[key]) > EPSILON) issues.push(`FINANCE_RECONCILIATION:${key}`);
    if (Math.abs(candidate.finance.project_revenue - candidate.finance.project_cost - candidate.finance.profit_or_loss) > EPSILON) issues.push("PROFIT_RECONCILIATION");
    for (const event of candidate.events ?? []) if (event.event_payload_hash !== eventPayloadHash(event)) issues.push("EVENT_PAYLOAD_HASH_MISMATCH");
    for (let index = 1; index < (candidate.events?.length ?? 0); index += 1) if (candidate.events[index].previous_state_hash !== candidate.events[index - 1].next_state_hash) issues.push("EVENT_CHAIN_BROKEN");
    if (candidate.events?.length && candidate.events.at(-1).next_state_hash !== computeAiCompanyStateHash(stateProjection(candidate))) issues.push("STATE_HASH_MISMATCH");
    if ((candidate.events ?? []).some((event) => !/^[a-f0-9]{64}$/.test(event.previous_state_hash ?? "") || !/^[a-f0-9]{64}$/.test(event.next_state_hash ?? ""))) issues.push("EVENT_HASH_FORMAT");
    for (const recovery of candidate.company_recovery ?? []) {
      if (recovery.real_legal_effect !== false || !String(recovery.recovery_type ?? "").endsWith("_SIMULATION")) issues.push("RECOVERY_AUTHORITY");
      if (["LIQUIDATION_SIMULATION", "DISSOLUTION_SIMULATION"].includes(recovery.recovery_type) && recovery.asset_records_preserved !== true) issues.push("LIQUIDATION_ASSET_CONTINUITY");
    }
    if (candidate.company?.status === "DISSOLVED" && !(candidate.company_recovery ?? []).some(({ recovery_type, asset_records_preserved }) => recovery_type === "DISSOLUTION_SIMULATION" && asset_records_preserved === true)) issues.push("DISSOLUTION_RECORD_REQUIRED");
    const known = new Set(["START_RUNTIME", "PAUSE_RUNTIME", "RESUME_RUNTIME", "STOP_RUNTIME", "ADVANCE_TIME", "SUBMIT_REQUEST", "REQUEST_CLARIFICATION", "ANALYZE_REQUIREMENTS", "EVALUATE_FEASIBILITY", "CREATE_PROPOSAL", "APPROVE_PROPOSAL", "CREATE_PROJECT", "DECOMPOSE_PROJECT", "CALCULATE_DEPENDENCIES", "CREATE_BOM", "CREATE_WORKFORCE_PLAN", "CREATE_EQUIPMENT_PLAN", "CREATE_SUPPLY_CHAIN_PLAN", "CALCULATE_BUDGET", "CALCULATE_SCHEDULE", "CREATE_SIMULATED_CONTRACT", "START_PROCUREMENT", "ASSIGN_WORKER", "RESERVE_EQUIPMENT", "RECEIVE_MATERIAL", "START_TASK", "PAUSE_TASK", "RESUME_TASK", "BLOCK_TASK", "COMPLETE_TASK", "INSPECT_TASK", "REQUEST_REWORK", "SUBMIT_CHANGE_ORDER", "APPROVE_CHANGE_ORDER", "DELIVER_PROJECT", "ACCEPT_PROJECT", "SCHEDULE_MAINTENANCE", "CLOSE_PROJECT", "RESTRUCTURE_COMPANY", "ENTER_COURT_PROTECTION_SIMULATION", "LIQUIDATE_COMPANY_SIMULATION", "DISSOLVE_COMPANY_SIMULATION"]);
    if ((candidate.action_log ?? []).some(({ command }) => !known.has(command))) issues.push("UNKNOWN_ACTION_COMMAND");
    const pairedActions = (candidate.action_log ?? []).slice(-(candidate.events?.length ?? 0));
    if (pairedActions.length !== (candidate.events?.length ?? 0) || (candidate.events ?? []).some((event, index) => event.event_type !== pairedActions[index]?.command || event.status !== eventStatus(pairedActions[index]?.result_status) || event.reason !== (pairedActions[index]?.result_reason ?? null))) issues.push("EVENT_ACTION_MISMATCH");
    const physicalReservations = candidate.worker_reservations?.filter(({ body_type }) => body_type === "PHYSICAL") ?? [];
    for (let left = 0; left < physicalReservations.length; left += 1) for (let right = left + 1; right < physicalReservations.length; right += 1) if (physicalReservations[left].life_id === physicalReservations[right].life_id && intervalsOverlap(physicalReservations[left], physicalReservations[right])) issues.push("PHYSICAL_WORKER_OVERLAP");
    return unique(issues);
  }

  function exportState() {
    usable();
    return { export_status: "NON_AUTHORITATIVE_SIMULATION", schema_version: AI_COMPANY_SCHEMA_VERSION, state: getState() };
  }

  function importState(payload) {
    usable();
    let parsed;
    try { parsed = typeof payload === "string" ? parseStrictJson(payload) : clone(payload); }
    catch (error) { throw new Error(`IMPORT_REJECTED:${error.message}`); }
    const candidate = parsed?.state ?? parsed;
    const issues = validateState(candidate);
    if (issues.length) throw new Error(`IMPORT_REJECTED:${issues.join(",")}`);
    state = clone(candidate);
    emit();
    return getState();
  }

  function resetState() {
    usable();
    state = createInitialState(configuredSeed, configuredCash, configuredCapacity);
    emit();
    return getState();
  }

  function replayEvents() {
    usable();
    const actions = clone(state.action_log);
    const replay = createKaiosAiCompanyRuntimeV1({ seed: state.seed, initialCash: state.finance.opening_cash, capacity: Object.fromEntries(Object.keys(DEFAULT_CAPACITY).map((key) => [key, state.capacity[key]])) });
    const handlers = {
      START_RUNTIME: () => replay.start(), PAUSE_RUNTIME: () => replay.pause(), RESUME_RUNTIME: () => replay.resume(), STOP_RUNTIME: () => replay.stop(), ADVANCE_TIME: (args) => replay.advanceTime(args.hours),
      SUBMIT_REQUEST: (args) => replay.submitRequest(args.input), REQUEST_CLARIFICATION: (args) => replay.requestClarification(args.requestId, args.fields, args.responses), ANALYZE_REQUIREMENTS: (args) => replay.analyzeRequirements(args.requestId, args.options), EVALUATE_FEASIBILITY: (args) => replay.evaluateFeasibility(args.requestId, args.context),
      CREATE_PROPOSAL: (args) => replay.createProposal(args.requestId), APPROVE_PROPOSAL: (args) => replay.approveProposal(args.proposalId), CREATE_PROJECT: (args) => replay.createProject(args.proposalId), DECOMPOSE_PROJECT: (args) => replay.decomposeProject(args.projectId), CALCULATE_DEPENDENCIES: (args) => replay.calculateDependencies(args.projectId),
      CREATE_BOM: (args) => replay.createBOM(args.projectId, args.options), CREATE_WORKFORCE_PLAN: (args) => replay.createWorkforcePlan(args.projectId, args.options), CREATE_EQUIPMENT_PLAN: (args) => replay.createEquipmentPlan(args.projectId, args.options), CREATE_SUPPLY_CHAIN_PLAN: (args) => replay.createSupplyChainPlan(args.projectId, args.options), CALCULATE_BUDGET: (args) => replay.calculateBudget(args.projectId, args.options), CALCULATE_SCHEDULE: (args) => replay.calculateSchedule(args.projectId, args.options), CREATE_SIMULATED_CONTRACT: (args) => replay.createSimulatedContract(args.projectId, args.options), START_PROCUREMENT: (args) => replay.startProcurement(args.projectId, args.options), RECEIVE_MATERIAL: (args) => replay.receiveMaterial(args.projectId, args.materialId),
      ASSIGN_WORKER: (args) => replay.assignWorker(args.projectId, args.taskId, args.workerId, args.options), RESERVE_EQUIPMENT: (args) => replay.reserveEquipment(args.projectId, args.taskId, args.equipmentId, args.options), START_TASK: (args) => replay.startTask(args.projectId, args.taskId), PAUSE_TASK: (args) => replay.pauseTask(args.projectId, args.taskId), RESUME_TASK: (args) => replay.resumeTask(args.projectId, args.taskId), BLOCK_TASK: (args) => replay.blockTask(args.projectId, args.taskId, args.reason), COMPLETE_TASK: (args) => replay.completeTask(args.projectId, args.taskId), INSPECT_TASK: (args) => replay.inspectTask(args.projectId, args.taskId, args.outcome, args.details), REQUEST_REWORK: (args) => replay.requestRework(args.projectId, args.taskId, args.options),
      SUBMIT_CHANGE_ORDER: (args) => replay.submitChangeOrder(args.projectId, args.changes), APPROVE_CHANGE_ORDER: (args) => replay.approveChangeOrder(args.changeOrderId, args.options), DELIVER_PROJECT: (args) => replay.deliverProject(args.projectId), ACCEPT_PROJECT: (args) => replay.acceptProject(args.projectId, args.outcome), SCHEDULE_MAINTENANCE: (args) => replay.scheduleMaintenance(args.projectId, args.options), CLOSE_PROJECT: (args) => replay.closeProject(args.projectId),
      RESTRUCTURE_COMPANY: (args) => replay.restructureCompany(args.options), ENTER_COURT_PROTECTION_SIMULATION: () => replay.enterCourtProtection(), LIQUIDATE_COMPANY_SIMULATION: () => replay.liquidateCompany(), DISSOLVE_COMPANY_SIMULATION: () => replay.dissolveCompany()
    };
    for (const action of actions) {
      const handler = handlers[action.command];
      if (!handler) throw new Error(`REPLAY_UNSUPPORTED_ACTION:${action.command}`);
      const result = handler(action.args);
      if (result.status !== action.result_status || (result.reason ?? null) !== action.result_reason) throw new Error(`REPLAY_RESULT_MISMATCH:${action.action_id}`);
    }
    const replayState = replay.getState();
    if (computeAiCompanyStateHash(stateProjection(replayState)) !== computeAiCompanyStateHash(stateProjection(state))) throw new Error("REPLAY_STATE_MISMATCH");
    return replayState;
  }

  function integrityReport() {
    const issues = validateState(state);
    return {
      ok: issues.length === 0,
      issues,
      deterministic: true,
      serializable: true,
      stoppable: true,
      resumable: true,
      replayable: true,
      auditable: true,
      ledger_balanced: !issues.includes("LEDGER_BALANCE"),
      mutation_endpoints: false,
      external_execution: false,
      wallet_access: false,
      real_kgen: false,
      production_authority: false,
      state_hash: computeAiCompanyStateHash(stateProjection(state))
    };
  }

  let api;
  function runDemonstration(templateId) {
    if (!REQUIRED_TEMPLATES.includes(templateId)) return { status: "BLOCKED", reason: "UNKNOWN_PROJECT_TEMPLATE" };
    if (state.action_log.length) return { status: "BLOCKED", reason: "DEMONSTRATION_REQUIRES_FRESH_RUNTIME" };
    const prepared = prepareDemoProject(api, templateId);
    if (prepared.status !== "READY") return { status: prepared.status, request_id: prepared.request_id, required_dependency: PROJECT_TEMPLATES[templateId].blocked_dependency ?? null, automatic_completion: false };
    return completeDemoProject(api, prepared.project_id);
  }

  api = Object.freeze({
    getState, start, pause, resume, stop, advanceTime,
    runDemonstration,
    submitRequest, requestClarification, analyzeRequirements, evaluateFeasibility,
    createProposal, approveProposal, createProject, decomposeProject, calculateDependencies,
    createBOM, createWorkforcePlan, createEquipmentPlan, createSupplyChainPlan, calculateBudget,
    calculateSchedule, createSimulatedContract, startProcurement, assignWorker, reserveEquipment,
    receiveMaterial, startTask, pauseTask, resumeTask, blockTask, completeTask, inspectTask,
    requestRework, submitChangeOrder, approveChangeOrder, deliverProject, acceptProject,
    scheduleMaintenance, closeProject, restructureCompany, enterCourtProtection, liquidateCompany,
    dissolveCompany, exportState, importState, resetState, replayEvents,
    integrityReport, validateState: (candidate) => clone(validateState(candidate)),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    destroy() { listeners.clear(); destroyed = true; }
  });
  return api;
}

export const createAiCompanyProjectRuntimeV1 = createKaiosAiCompanyRuntimeV1;

function standardRequest(templateId) {
  const requests = {
    FISHPOND_PROJECT: ["I need a fishpond.", "FISHPOND", "LAND-SIM-FISHPOND-001", 250000],
    BASIC_HOUSE_PROJECT: ["I need a basic house.", "HOUSE", "LAND-SIM-HOUSE-001", 220000],
    SMALL_FARM_PROJECT: ["I need a small farm.", "FARM", "LAND-SIM-FARM-001", 180000],
    LIFE_PACKAGE_PROJECT: ["I need a new crop candidate.", "CROP CANDIDATE LIFE PACKAGE", "LOCAL_SIMULATION_WORKSPACE", 80000],
    SOFTWARE_MODULE_PROJECT: ["I need a World Viewer panel.", "SOFTWARE WORLD VIEWER PANEL", "LOCAL_SIMULATION_WORKSPACE", 90000]
  };
  const [requestText, requestedObject, location, budget] = requests[templateId];
  return { customer_life_id: "LIFE-SIMULATED-DEMO-CUSTOMER", customer_type: "PLAYER", request_text: requestText, requested_object: requestedObject, requested_location: location, requested_quantity: 1, requested_quality: "STANDARD_SIMULATION", requested_deadline: 1000, requested_budget: budget, intended_use: "DETERMINISTIC_DEMONSTRATION", civilization_context: "INDUSTRIAL", rights_context: ["SIMULATED_USAGE_RIGHT"], risk_level: "MEDIUM", priority: "NORMAL" };
}

function prepareDemoProject(runtime, templateId) {
  const submitted = runtime.submitRequest(standardRequest(templateId));
  runtime.analyzeRequirements(submitted.outputs.request.request_id);
  const feasibility = runtime.evaluateFeasibility(submitted.outputs.request.request_id);
  if (feasibility.status === "BLOCKED") return { status: feasibility.reason, request_id: submitted.outputs.request.request_id, runtime };
  const proposal = runtime.createProposal(submitted.outputs.request.request_id).outputs.proposal;
  runtime.approveProposal(proposal.proposal_id);
  const project = runtime.createProject(proposal.proposal_id).outputs.project;
  runtime.decomposeProject(project.project_id);
  runtime.calculateDependencies(project.project_id);
  runtime.createBOM(project.project_id);
  runtime.createWorkforcePlan(project.project_id);
  runtime.createEquipmentPlan(project.project_id);
  runtime.createSupplyChainPlan(project.project_id);
  runtime.calculateBudget(project.project_id);
  runtime.calculateSchedule(project.project_id);
  runtime.createSimulatedContract(project.project_id);
  runtime.startProcurement(project.project_id);
  runtime.start();
  const orders = runtime.getState().procurement_orders.filter(({ project_id }) => project_id === project.project_id);
  if (orders.length) {
    runtime.advanceTime(Math.max(...orders.map(({ arrival_time }) => arrival_time)) - runtime.getState().simulation_time);
    for (const order of orders) runtime.receiveMaterial(project.project_id, order.material_id);
  }
  runtime.calculateSchedule(project.project_id);
  const snapshot = runtime.getState();
  const plannedProject = snapshot.projects.find(({ project_id }) => project_id === project.project_id);
  const plan = snapshot.resource_plans.find(({ project_id }) => project_id === project.project_id);
  for (const currentTask of plannedProject.tasks) {
    for (const skill of currentTask.skills) {
      const worker = plan.workforce.find((candidate) => candidate.skill === skill);
      runtime.assignWorker(project.project_id, currentTask.task_id, worker.worker_id);
    }
    for (const type of currentTask.equipment) {
      const equipment = plan.equipment.find((candidate) => candidate.type === type);
      runtime.reserveEquipment(project.project_id, currentTask.task_id, equipment.equipment_id);
    }
  }
  return { status: "READY", project_id: project.project_id, runtime };
}

function completeDemoProject(runtime, projectId) {
  let project = runtime.getState().projects.find(({ project_id }) => project_id === projectId);
  for (const currentTask of project.tasks) {
    runtime.startTask(projectId, currentTask.task_id);
    runtime.advanceTime(runtime.getState().projects.find(({ project_id }) => project_id === projectId).tasks.find(({ task_id }) => task_id === currentTask.task_id).remaining_hours);
    runtime.inspectTask(projectId, currentTask.task_id, "PASS");
    runtime.completeTask(projectId, currentTask.task_id);
  }
  runtime.scheduleMaintenance(projectId);
  runtime.deliverProject(projectId);
  runtime.acceptProject(projectId, "ACCEPTED");
  runtime.closeProject(projectId);
  project = runtime.getState().projects.find(({ project_id }) => project_id === projectId);
  return {
    project_id: projectId,
    status: project.status,
    closeout_status: project.closeout_status,
    domain_binding: project.domain_binding,
    domain_evidence: clone(project.domain_evidence),
    approval_status: project.approval_status,
    external_deployment: project.external_deployment,
    event_count: runtime.getState().events.length,
    state_hash: runtime.integrityReport().state_hash
  };
}

export function createAiCompanyDemonstrationFlows({ seed = "KAIOS-AI-COMPANY-DEMO-V1" } = {}) {
  const results = {};
  for (const templateId of ["FISHPOND_PROJECT", "BASIC_HOUSE_PROJECT", "LIFE_PACKAGE_PROJECT", "SOFTWARE_MODULE_PROJECT"]) {
    const prepared = prepareDemoProject(createKaiosAiCompanyRuntimeV1({ seed: `${seed}-${templateId}` }), templateId);
    results[templateId] = completeDemoProject(prepared.runtime, prepared.project_id);
  }
  const farm = prepareDemoProject(createKaiosAiCompanyRuntimeV1({ seed: `${seed}-SMALL_FARM_PROJECT` }), "SMALL_FARM_PROJECT");
  results.SMALL_FARM_PROJECT = { status: farm.status, request_id: farm.request_id, required_dependency: "KAIOS_FOREST_AND_AGRICULTURE_RUNTIME_V1", automatic_completion: false };
  return {
    seed,
    fishpond: results.FISHPOND_PROJECT,
    basic_house: results.BASIC_HOUSE_PROJECT,
    blocked_small_farm: results.SMALL_FARM_PROJECT,
    candidate_life_package: results.LIFE_PACKAGE_PROJECT,
    software_module: results.SOFTWARE_MODULE_PROJECT,
    boundaries: { simulation_only: true, wallet_access: false, real_kgen: false, production_authority: false, external_execution: false }
  };
}
