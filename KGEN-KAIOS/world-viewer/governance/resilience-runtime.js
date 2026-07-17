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

const RUNTIME = "ResilienceRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_HISTORY = 120;
const MAX_INCIDENTS = 40;

export const RESILIENCE_HAZARDS = Object.freeze([
  "EARTHQUAKE", "FLOOD", "TYPHOON", "VOLCANO", "PANDEMIC",
  "WAR", "ECONOMIC_CRISIS", "FOOD_CRISIS", "POWER_FAILURE"
]);

export function createResilienceRuntime({
  logisticsRuntime,
  ecosystemRuntime,
  publicServicesRuntime,
  storage,
  storageKey = "kaios.world-viewer.resilience.v1"
} = {}) {
  if (!logisticsRuntime || !ecosystemRuntime || !publicServicesRuntime) {
    throw new TypeError("Resilience Runtime requires Logistics, Ecosystem and Public Services runtimes");
  }
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    environment: { air_quality: 82, water_quality: 76, forest: 72, river: 74, ocean: 70, wildlife: 73, carbon: 28 },
    active_incidents: [],
    drills: [],
    recovery_records: [],
    history: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      environment: { ...state.environment, ...(restored.state.environment ?? {}) },
      active_incidents: restored.state.active_incidents?.slice(-MAX_INCIDENTS) ?? [],
      drills: restored.state.drills?.slice(-MAX_HISTORY) ?? [],
      recovery_records: restored.state.recovery_records?.slice(-MAX_HISTORY) ?? [],
      history: restored.state.history?.slice(-MAX_HISTORY) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Resilience Runtime has been destroyed");
  };

  function environmentSnapshot() {
    const logistics = logisticsRuntime.getSnapshot();
    const ecosystem = ecosystemRuntime.getSnapshot();
    return {
      ...state.environment,
      pollution: Number(clamp(logistics.pollution ?? 0).toFixed(1)),
      ecology_recovery: Number(clamp(logistics.ecology_recovery ?? ecosystem.average_health ?? 0).toFixed(1)),
      biodiversity: Number(clamp(ecosystem.biodiversity ?? ecosystem.average_health ?? 0).toFixed(1)),
      source: "LOGISTICS_AND_ECOSYSTEM_RUNTIME"
    };
  }

  function readinessScore() {
    const services = publicServicesRuntime.getSnapshot().services;
    const relevant = services.filter(({ service_id }) => ["MEDICAL", "POLICE", "FIRE_DEPARTMENT", "PUBLIC_UTILITIES", "COMMUNICATION", "DISASTER_RESPONSE", "SOCIAL_WELFARE"].includes(service_id));
    return relevant.length ? Number((relevant.reduce((sum, service) => sum + service.quality, 0) / relevant.length).toFixed(1)) : 0;
  }

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_RESILIENCE_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    real_prediction: false,
    real_emergency_instruction: false,
    hazards: RESILIENCE_HAZARDS,
    environment: environmentSnapshot(),
    readiness_score: readinessScore(),
    active_incidents: state.active_incidents,
    drills: state.drills,
    recovery_records: state.recovery_records,
    history: state.history,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.history, {
      event_id: stableId("resilience", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_HISTORY);
  }

  function advance({ elapsedHours = 1, city = {} } = {}) {
    usable();
    const hours = Math.max(0, Number(elapsedHours) || 0);
    const pollution = Number(logisticsRuntime.getSnapshot().pollution ?? 0);
    const ecologicalPressure = Math.min(1.5, hours * (pollution / 100) * 0.04);
    state.environment.air_quality = Number(clamp(state.environment.air_quality - ecologicalPressure).toFixed(2));
    state.environment.water_quality = Number(clamp(state.environment.water_quality - ecologicalPressure * 0.7).toFixed(2));
    state.environment.carbon = Number(clamp(state.environment.carbon + ecologicalPressure * 0.8).toFixed(2));
    if (Number(city.energy ?? 100) < 20 && !state.active_incidents.some(({ hazard_type }) => hazard_type === "POWER_FAILURE")) {
      boundedPush(state.active_incidents, {
        incident_id: stableId("incident", state.revision + 1),
        hazard_type: "POWER_FAILURE",
        severity: "T1_SIMULATION",
        status: "RECOVERY_REQUIRED",
        executable_response: false
      }, MAX_INCIDENTS);
    }
    persist();
    return getSnapshot();
  }

  function runDrill(hazardType = "EARTHQUAKE") {
    usable();
    if (!RESILIENCE_HAZARDS.includes(hazardType)) throw runtimeError(RUNTIME, "UNKNOWN_HAZARD", `Unknown hazard ${hazardType}`);
    const drill = {
      drill_id: stableId("resilience-drill", state.revision + 1),
      hazard_type: hazardType,
      readiness_score: readinessScore(),
      status: "SIMULATION_DRILL_COMPLETE",
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      real_emergency_instruction: false
    };
    boundedPush(state.drills, drill, MAX_HISTORY);
    record("RESILIENCE_DRILL_COMPLETED", { drill_id: drill.drill_id, hazard_type: hazardType });
    persist();
    notifier.emit("RESILIENCE_DRILL_COMPLETED", { hazard_type: hazardType });
    return getSnapshot();
  }

  function recover({ effort = 10 } = {}) {
    usable();
    const value = clamp(effort, 1, 25);
    state.environment.air_quality = Number(clamp(state.environment.air_quality + value * 0.12).toFixed(2));
    state.environment.water_quality = Number(clamp(state.environment.water_quality + value * 0.1).toFixed(2));
    state.environment.forest = Number(clamp(state.environment.forest + value * 0.08).toFixed(2));
    state.environment.wildlife = Number(clamp(state.environment.wildlife + value * 0.06).toFixed(2));
    state.environment.carbon = Number(clamp(state.environment.carbon - value * 0.1).toFixed(2));
    const resolved = state.active_incidents.shift() ?? null;
    const recovery = {
      recovery_id: stableId("recovery", state.revision + 1),
      incident_id: resolved?.incident_id ?? null,
      effort: value,
      status: "RECOVERY_REVIEWED_SYNTHETIC",
      evidence_status: "RECORDED"
    };
    boundedPush(state.recovery_records, recovery, MAX_HISTORY);
    record("RESILIENCE_RECOVERY_COMPLETED", { recovery_id: recovery.recovery_id, incident_id: recovery.incident_id });
    persist();
    notifier.emit("RESILIENCE_RECOVERY_COMPLETED", { recovery_id: recovery.recovery_id });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const environment = environmentSnapshot();
    for (const [key, value] of Object.entries(environment)) {
      if (key === "source") continue;
      if (!Number.isFinite(value) || value < 0 || value > 100) issues.push(`invalid environment score ${key}`);
    }
    if (RESILIENCE_HAZARDS.length !== 9) issues.push("resilience hazard catalog incomplete");
    if (state.drills.some(({ real_emergency_instruction }) => real_emergency_instruction !== false)) issues.push("drill contains real emergency instruction");
    if (state.history.length > MAX_HISTORY || state.active_incidents.length > MAX_INCIDENTS) issues.push("resilience history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_RESILIENCE_ALPHA", readiness_score: readinessScore(), issues });
  }

  return Object.freeze({
    getSnapshot,
    advance,
    runDrill,
    recover,
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
