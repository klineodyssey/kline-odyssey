import {
  boundedPush,
  clamp,
  createNotifier,
  integer,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "LogisticsRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_JOBS = 120;
const MAX_EVENTS = 40;

const DEFAULT_ROUTES = Object.freeze([
  { route_id: "route-farm-warehouse", from: "FARM", to: "WAREHOUSE", modes: ["DOMESTIC"], capacity: 120 },
  { route_id: "route-warehouse-market", from: "WAREHOUSE", to: "MARKETPLACE", modes: ["DOMESTIC", "EXPORT"], capacity: 100 },
  { route_id: "route-factory-market", from: "FACTORY", to: "MARKETPLACE", modes: ["DOMESTIC", "EXPORT"], capacity: 80 },
  { route_id: "route-city-settlement-gate", from: "CITY", to: "OFFICIAL_SETTLEMENT_GATE", modes: ["EXPORT", "IMPORT"], capacity: 40 }
]);

function initialState(routes) {
  return {
    revision: 0,
    routes: (routes?.length ? routes : DEFAULT_ROUTES).map((route) => ({ ...route, modes: [...route.modes] })),
    warehouses: [{ warehouse_id: "warehouse-alpha", capacity: 5_000, occupied: 0, status: "READY" }],
    jobs: [],
    pollution: 18,
    ecology_recovery: 72,
    events: []
  };
}

function cleanState(candidate, fallback) {
  if (!candidate || typeof candidate !== "object") return fallback;
  return {
    ...fallback,
    ...candidate,
    routes: Array.isArray(candidate.routes) ? candidate.routes.map((route) => ({ ...route, modes: [...(route.modes ?? [])] })) : fallback.routes,
    warehouses: Array.isArray(candidate.warehouses) ? candidate.warehouses.map((item) => ({ ...item })) : fallback.warehouses,
    jobs: Array.isArray(candidate.jobs) ? candidate.jobs.slice(-MAX_JOBS).map((item) => ({ ...item })) : [],
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS).map((item) => ({ ...item })) : []
  };
}

export function createLogisticsRuntime({ routes, storage, storageKey = "kaios.world-viewer.logistics.v1" } = {}) {
  const storageRef = resolveStorage(storage);
  const defaults = initialState(routes);
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.routes));
  let state = cleanState(restored?.state, defaults);
  let destroyed = false;

  const getSnapshot = () => snapshot({
    runtime: "SETTLEMENT_LOGISTICS_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    routes: state.routes,
    warehouses: state.warehouses,
    jobs: state.jobs,
    pollution: Number(state.pollution.toFixed(2)),
    ecology_recovery: Number(state.ecology_recovery.toFixed(2)),
    status: state.pollution >= 85 ? "ECOLOGY_CRITICAL" : state.pollution >= 55 ? "CONSTRAINED" : "READY",
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Logistics Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    return boundedPush(state.events, { event_id: stableId("logistics", state.revision), type, ...details, synthetic: true }, MAX_EVENTS);
  }

  function dispatch({ routeId, resourceId, quantity = 1, mode = "DOMESTIC" } = {}) {
    usable();
    const route = state.routes.find(({ route_id }) => route_id === String(routeId));
    const units = integer(quantity);
    const normalizedMode = String(mode).toUpperCase();
    if (!route) throw runtimeError(RUNTIME, "ROUTE_NOT_FOUND", `Unknown route ${routeId}`);
    if (!route.modes.includes(normalizedMode)) throw runtimeError(RUNTIME, "MODE_NOT_ALLOWED", `${normalizedMode} is not allowed on ${route.route_id}`);
    if (!resourceId || units <= 0 || units > route.capacity) throw runtimeError(RUNTIME, "CAPACITY_EXCEEDED", "Shipment exceeds route capacity");
    const job = {
      job_id: stableId("shipment", state.revision + 1),
      route_id: route.route_id,
      resource_id: String(resourceId).toUpperCase(),
      quantity: units,
      mode: normalizedMode,
      from: route.from,
      to: route.to,
      status: normalizedMode === "DOMESTIC" ? "DELIVERED" : "PENDING_OFFICIAL_GATE",
      executable_external_transfer: false,
      synthetic: true
    };
    boundedPush(state.jobs, job, MAX_JOBS);
    state.pollution = clamp(state.pollution + units * 0.015);
    state.ecology_recovery = clamp(state.ecology_recovery - units * 0.008);
    record("LOGISTICS_JOB_CREATED", { job_id: job.job_id, route_id: job.route_id, mode: normalizedMode });
    persist();
    notifier.emit("LOGISTICS_JOB_CREATED", { job_id: job.job_id });
    return snapshot(job);
  }

  function advance({ elapsedHours = 1, productionPollution = 0, ecosystemHealth = 70 } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Logistics advance must be 1-720 hours");
    state.pollution = clamp(state.pollution + clamp(productionPollution) * hours / 2_400 - clamp(ecosystemHealth) * hours / 24_000);
    state.ecology_recovery = clamp(100 - state.pollution * 0.65 + clamp(ecosystemHealth) * 0.2);
    record("LOGISTICS_ADVANCED", { hours, pollution: Number(state.pollution.toFixed(2)) });
    persist();
    notifier.emit("LOGISTICS_ADVANCED", { hours });
    return getSnapshot();
  }

  function recoverEcology({ waterUnits = 1, effort = 10 } = {}) {
    usable();
    const water = integer(waterUnits);
    const recovery = clamp(effort, 1, 30);
    if (water <= 0 || water > 20) throw runtimeError(RUNTIME, "WATER_REQUIRED", "Ecology recovery requires 1-20 water units");
    state.pollution = clamp(state.pollution - recovery * 0.7 - water * 0.4);
    state.ecology_recovery = clamp(state.ecology_recovery + recovery + water * 0.5);
    record("ECOLOGY_RECOVERY", { water_units: water, effort: recovery, pollution: Number(state.pollution.toFixed(2)) });
    persist();
    notifier.emit("ECOLOGY_RECOVERY", { water_units: water, effort: recovery });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const routeIds = new Set();
    for (const route of state.routes) {
      if (routeIds.has(route.route_id)) issues.push(`${route.route_id}: duplicate route`);
      routeIds.add(route.route_id);
      if (!Number.isFinite(route.capacity) || route.capacity <= 0) issues.push(`${route.route_id}: invalid capacity`);
    }
    for (const job of state.jobs) {
      if (!routeIds.has(job.route_id)) issues.push(`${job.job_id}: unknown route`);
      if (["EXPORT", "IMPORT"].includes(job.mode) && job.status !== "PENDING_OFFICIAL_GATE") issues.push(`${job.job_id}: external shipment bypassed gate`);
    }
    if (state.jobs.length > MAX_JOBS) issues.push("logistics job history exceeded limit");
    if (state.events.length > MAX_EVENTS) issues.push("logistics event history exceeded limit");
    if (state.pollution < 0 || state.pollution > 100) issues.push("pollution is out of bounds");
    return snapshot({ ok: issues.length === 0, runtime: "SETTLEMENT_LOGISTICS_ALPHA", pollution: state.pollution, jobs: state.jobs.length, issues });
  }

  return Object.freeze({
    getSnapshot,
    dispatch,
    advance,
    recoverEcology,
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
