import { ECONOMY_ACCOUNT_IDS } from "../economy/economy-runtime.js";
import {
  boundedPush,
  clamp,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "PublicServicesRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_HISTORY = 120;
const MAX_PROJECTS = 60;

export const PUBLIC_SERVICE_IDS = Object.freeze([
  "EDUCATION", "MEDICAL", "JUSTICE", "POLICE", "FIRE_DEPARTMENT",
  "TRANSPORTATION", "PUBLIC_UTILITIES", "COMMUNICATION", "DISASTER_RESPONSE", "SOCIAL_WELFARE"
]);

const SERVICE_DEFAULTS = Object.freeze({
  EDUCATION: [76, 62, 14], MEDICAL: [72, 58, 12], JUSTICE: [68, 46, 8], POLICE: [73, 52, 10],
  FIRE_DEPARTMENT: [75, 44, 9], TRANSPORTATION: [78, 66, 16], PUBLIC_UTILITIES: [82, 70, 18],
  COMMUNICATION: [84, 61, 13], DISASTER_RESPONSE: [70, 48, 11], SOCIAL_WELFARE: [67, 55, 9]
});

const EDUCATION_FACILITIES = Object.freeze([
  "SCHOOL", "COLLEGE", "UNIVERSITY", "RESEARCH_CENTER", "AI_ACADEMY", "DNA_LABORATORY"
].map((facility_type, index) => Object.freeze({
  facility_id: `education-facility-${String(index + 1).padStart(2, "0")}`,
  facility_type,
  status: "OPEN_SYNTHETIC",
  authoritative_credentials: false
})));

const MEDICAL_FACILITIES = Object.freeze([
  ["HOSPITAL", "DOCTOR_AND_MEDICAL_AI"],
  ["CLINIC", "DOCTOR"],
  ["EMERGENCY_CENTER", "MEDICAL_AI_REVIEWED"]
].map(([facility_type, staffing], index) => Object.freeze({
  facility_id: `medical-facility-${String(index + 1).padStart(2, "0")}`,
  facility_type,
  staffing,
  medicine: "SIMULATION_INVENTORY_ONLY",
  disease_response: "GAME_STATE_ONLY",
  vaccination: "ARCHITECTURE_ONLY",
  real_medical_advice: false
})));

export const AI_GOVERNMENT_ROLES = Object.freeze([
  "GOVERNMENT_AI", "MEDICAL_AI", "EDUCATION_AI", "JUSTICE_AI",
  "POLICE_AI", "TRAFFIC_AI", "AGRICULTURE_AI", "ENVIRONMENTAL_AI"
].map((role) => Object.freeze({
  worker_id: `worker-${role.toLowerCase().replaceAll("_", "-")}-001`,
  role,
  life_os: "READY",
  audit_status: "VERIFIED",
  evidence_status: "RECORDED",
  permission: `${role}_RECOMMENDATION_ONLY`,
  review_status: "HUMAN_REVIEW_AVAILABLE",
  real_world_authority: false
})));

function createServices(config = {}) {
  return PUBLIC_SERVICE_IDS.map((service_id) => {
    const configured = config.services?.find((entry) => entry.service_id === service_id) ?? {};
    const [capacity, demand, staff] = SERVICE_DEFAULTS[service_id];
    return {
      service_id,
      capacity: clamp(configured.capacity ?? capacity),
      demand: clamp(configured.demand ?? demand),
      staff: Number(configured.staff ?? staff),
      budget: Number(configured.budget ?? 0),
      quality: clamp(configured.quality ?? capacity - Math.max(0, demand - capacity) * 0.5),
      status: "OPERATIONAL_SYNTHETIC"
    };
  });
}

export function createPublicServicesRuntime({
  economyRuntime,
  populationRuntime,
  settlementRuntime,
  config = {},
  storage,
  storageKey = "kaios.world-viewer.public-services.v1"
} = {}) {
  if (!economyRuntime || !populationRuntime || !settlementRuntime) {
    throw new TypeError("Public Services Runtime requires Economy, Population and Settlement runtimes");
  }
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, cycle_count: 0, services: createServices(config), appropriations: [], projects: [], history: [] };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      services: restored.state.services ?? state.services,
      appropriations: restored.state.appropriations?.slice(-MAX_PROJECTS) ?? [],
      projects: restored.state.projects?.slice(-MAX_PROJECTS) ?? [],
      history: restored.state.history?.slice(-MAX_HISTORY) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Public Services Runtime has been destroyed");
  };

  function financeSnapshot() {
    const economy = economyRuntime.getSnapshot();
    const obligations = settlementRuntime.getSnapshot().obligations ?? [];
    return {
      currency: "KAIOS_CREDIT",
      government_budget: economy.balances[ECONOMY_ACCOUNT_IDS.GOVERNMENT] ?? 0,
      public_service_balance: economy.balances[ECONOMY_ACCOUNT_IDS.PUBLIC_SERVICES] ?? 0,
      tax_records: obligations.filter(({ category }) => String(category).includes("TAX")).length,
      public_spending: state.appropriations.reduce((sum, entry) => sum + Number(entry.amount), 0),
      infrastructure: state.projects.filter(({ project_type }) => project_type === "INFRASTRUCTURE").length,
      public_projects: state.projects.length,
      emergency_fund: state.services.find(({ service_id }) => service_id === "DISASTER_RESPONSE")?.budget ?? 0,
      real_finance: false
    };
  }

  const getSnapshot = () => snapshot({
    runtime: "PUBLIC_SERVICES_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    services: state.services,
    education: { facilities: EDUCATION_FACILITIES, civilization_knowledge: "PUBLIC_SYNTHETIC_CURRICULUM" },
    medical: { facilities: MEDICAL_FACILITIES, clinical_service: false },
    ai_government: AI_GOVERNMENT_ROLES,
    public_finance: financeSnapshot(),
    appropriations: state.appropriations,
    public_projects: state.projects,
    cycle_count: state.cycle_count,
    history: state.history,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.history, {
      event_id: stableId("public-service", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_HISTORY);
  }

  function runCycle({ city = {}, resilience = {} } = {}) {
    usable();
    const population = Number(populationRuntime.getSnapshot().metrics?.population ?? 1);
    const hazardPressure = Number(resilience.active_incidents?.length ?? 0) * 6;
    state.services = state.services.map((service) => {
      const demand = clamp(service.demand + Math.min(5, population * 0.08) + (service.service_id === "DISASTER_RESPONSE" ? hazardPressure : 0));
      const infrastructureBonus = service.service_id === "TRANSPORTATION" ? Number(city.roads ?? 50) * 0.08 : 0;
      const quality = clamp(service.capacity - Math.max(0, demand - service.capacity) * 0.7 + service.budget * 0.12 + infrastructureBonus);
      return { ...service, demand: Number(demand.toFixed(1)), quality: Number(quality.toFixed(1)), status: quality < 40 ? "STRAINED" : "OPERATIONAL_SYNTHETIC" };
    });
    state.cycle_count += 1;
    if (state.cycle_count % 720 === 0) {
      record("PUBLIC_SERVICES_MONTHLY_SUMMARY", { population, average_quality: averageQuality(state.services), summarized_hours: 720 });
    }
    persist();
    notifier.emit("PUBLIC_SERVICES_CYCLE_COMPLETED", { cycle_count: state.cycle_count });
    return getSnapshot();
  }

  function fundService({ serviceId = "EDUCATION", amount = 10, projectType = "PUBLIC_PROJECT" } = {}) {
    usable();
    const service = state.services.find((entry) => entry.service_id === serviceId);
    if (!service) throw runtimeError(RUNTIME, "UNKNOWN_SERVICE", `Unknown public service ${serviceId}`);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 100) throw runtimeError(RUNTIME, "INVALID_APPROPRIATION", "Appropriation must be between 1 and 100 KAIOS Credit");
    const transfer = economyRuntime.transfer({
      from: ECONOMY_ACCOUNT_IDS.GOVERNMENT,
      to: ECONOMY_ACCOUNT_IDS.PUBLIC_SERVICES,
      amount: value,
      reason: `PUBLIC_APPROPRIATION:${serviceId}`,
      category: "PUBLIC_SPENDING"
    });
    service.budget = Number((service.budget + value).toFixed(2));
    service.capacity = Number(clamp(service.capacity + value * 0.08).toFixed(1));
    const sequence = state.revision + 1;
    const appropriation = {
      appropriation_id: stableId("appropriation", sequence),
      service_id: serviceId,
      amount: value,
      currency: "KAIOS_CREDIT",
      ledger_entry_id: transfer.entry.entry_id,
      evidence_status: "RECORDED",
      approval_status: "REVIEWED_SYNTHETIC"
    };
    const project = {
      project_id: stableId("public-project", sequence),
      service_id: serviceId,
      project_type: projectType,
      status: "FUNDED_SYNTHETIC",
      real_world_execution: false
    };
    boundedPush(state.appropriations, appropriation, MAX_PROJECTS);
    boundedPush(state.projects, project, MAX_PROJECTS);
    record("PUBLIC_SERVICE_FUNDED", { appropriation_id: appropriation.appropriation_id, project_id: project.project_id });
    persist();
    notifier.emit("PUBLIC_SERVICE_FUNDED", { service_id: serviceId, amount: value });
    return getSnapshot();
  }

  function averageQuality(services = state.services) {
    return services.length ? Number((services.reduce((sum, service) => sum + service.quality, 0) / services.length).toFixed(1)) : 0;
  }

  function integrityReport() {
    const issues = [];
    if (state.services.length !== PUBLIC_SERVICE_IDS.length) issues.push("public service catalog incomplete");
    if (state.services.some(({ capacity, demand, quality }) => [capacity, demand, quality].some((value) => !Number.isFinite(value) || value < 0 || value > 100))) issues.push("public service score out of bounds");
    if (AI_GOVERNMENT_ROLES.some((worker) => !worker.life_os || !worker.audit_status || !worker.evidence_status || !worker.permission || !worker.review_status)) issues.push("AI Government boundary incomplete");
    if (AI_GOVERNMENT_ROLES.some((worker) => worker.real_world_authority !== false)) issues.push("AI Government gained real authority");
    if (state.appropriations.some(({ amount, ledger_entry_id }) => !(amount > 0) || !ledger_entry_id)) issues.push("appropriation missing ledger evidence");
    if (state.history.length > MAX_HISTORY || state.projects.length > MAX_PROJECTS) issues.push("public service history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "PUBLIC_SERVICES_ALPHA", average_quality: averageQuality(), issues });
  }

  return Object.freeze({
    getSnapshot,
    runCycle,
    fundService,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}
