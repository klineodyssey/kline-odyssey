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

const RUNTIME = "AiWorkerRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 160;

export const AI_WORKER_ACTIONS = Object.freeze([
  "CLOCK_IN",
  "WORK",
  "PATROL",
  "FARM",
  "BUILD",
  "REST",
  "RECHARGE",
  "CLOCK_OUT"
]);

export const AI_WORKER_SCHEDULE = Object.freeze([
  Object.freeze({ start_hour: 0, action: "REST" }),
  Object.freeze({ start_hour: 6, action: "RECHARGE" }),
  Object.freeze({ start_hour: 7, action: "CLOCK_IN" }),
  Object.freeze({ start_hour: 8, action: "FARM" }),
  Object.freeze({ start_hour: 10, action: "BUILD" }),
  Object.freeze({ start_hour: 12, action: "RECHARGE" }),
  Object.freeze({ start_hour: 13, action: "PATROL" }),
  Object.freeze({ start_hour: 15, action: "FARM" }),
  Object.freeze({ start_hour: 17, action: "WORK" }),
  Object.freeze({ start_hour: 18, action: "CLOCK_OUT" }),
  Object.freeze({ start_hour: 19, action: "REST" })
]);

function actionAt(hour) {
  let selected = AI_WORKER_SCHEDULE[0];
  for (const entry of AI_WORKER_SCHEDULE) if (hour >= entry.start_hour) selected = entry;
  return selected.action;
}

function aiProfiles(world) {
  return (world?.lifeProfiles ?? []).filter((profile) => profile?.synthetic === true && profile?.life_type === "AI_WORKER");
}

function initial(profile) {
  return {
    worker_id: String(profile.id),
    life_id: String(profile.id),
    display_name: String(profile.label ?? profile.id),
    parcel_id: profile.parcel_id ?? null,
    building_id: profile.building_id ?? null,
    current_action: "REST",
    current_status: "OFF_DUTY",
    attendance_status: "CLOCKED_OUT",
    energy: clamp(profile.vitals?.energy ?? 80),
    fatigue: clamp(100 - (profile.vitals?.energy ?? 80)),
    production: 0,
    farm_hours: 0,
    build_hours: 0,
    patrol_hours: 0,
    work_hours: 0,
    revision: 0,
    events: []
  };
}

function restore(candidate, fallback) {
  if (candidate?.worker_id !== fallback.worker_id) return fallback;
  return {
    ...fallback,
    ...candidate,
    energy: clamp(candidate.energy),
    fatigue: clamp(candidate.fatigue),
    production: Math.max(0, Number(candidate.production) || 0),
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

export function createAiWorkerRuntime({
  world,
  storage,
  storageKey = "kaios.world-viewer.ai-worker.v1"
} = {}) {
  const profiles = aiProfiles(world);
  if (!profiles.length) throw runtimeError(RUNTIME, "NO_AI_WORKERS", "Synthetic world has no AI workers");
  const storageRef = resolveStorage(storage);
  const defaults = new Map(profiles.map((profile) => [String(profile.id), initial(profile)]));
  let states = new Map([...defaults].map(([id, value]) => [id, structuredClone(value)]));
  let destroyed = false;
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.states));
  if (restored) for (const candidate of restored.states) if (defaults.has(candidate?.worker_id)) states.set(candidate.worker_id, restore(candidate, defaults.get(candidate.worker_id)));

  const getSnapshot = (workerId = profiles[0].id) => {
    const state = states.get(String(workerId));
    if (!state) throw runtimeError(RUNTIME, "WORKER_NOT_FOUND", `Unknown AI worker ${workerId}`);
    return snapshot({ ...state, schedule: AI_WORKER_SCHEDULE });
  };
  const listSnapshots = () => [...states.keys()].map((id) => getSnapshot(id));
  const notifier = createNotifier(() => snapshot({ workers: listSnapshots() }));
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, states: [...states.values()] });

  function advance({ elapsedMinutes = 60, clockSnapshot } = {}) {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "AI Worker Runtime has been destroyed");
    const minutes = Number(elapsedMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "AI advance must be 1-1440 minutes");
    const hours = minutes / 60;
    const action = actionAt(Number(clockSnapshot?.hour ?? 0));
    for (const state of states.values()) {
      const previous = state.current_action;
      state.current_action = action;
      if (action === "CLOCK_IN") state.attendance_status = "CLOCKED_IN";
      if (action === "CLOCK_OUT") state.attendance_status = "CLOCKED_OUT";
      state.current_status = ["REST", "RECHARGE", "CLOCK_OUT"].includes(action) ? "OFF_DUTY" : "WORKING";

      if (action === "RECHARGE") {
        state.energy = clamp(state.energy + 14 * hours);
        state.fatigue = clamp(state.fatigue - 16 * hours);
      } else if (action === "REST") {
        state.energy = clamp(state.energy + 7 * hours);
        state.fatigue = clamp(state.fatigue - 8 * hours);
      } else if (!["CLOCK_IN", "CLOCK_OUT"].includes(action)) {
        const cost = action === "BUILD" ? 6 : action === "FARM" ? 5 : 4;
        state.energy = clamp(state.energy - cost * hours);
        state.fatigue = clamp(state.fatigue + cost * hours);
        state.production += (action === "WORK" ? 4 : 2.5) * hours;
        const metric = `${action.toLowerCase()}_hours`;
        if (metric in state) state[metric] += hours;
      }
      if (state.energy < 15) {
        state.current_action = "RECHARGE";
        state.current_status = "RECOVERY";
      }
      state.revision += 1;
      boundedPush(state.events, {
        event_id: stableId(`ai-${state.worker_id}`, state.revision),
        type: previous === state.current_action ? "ACTION_CONTINUED" : "ACTION_TRANSITION",
        action: state.current_action,
        day: clockSnapshot?.day ?? 1,
        hour: clockSnapshot?.hour ?? 0
      }, MAX_EVENTS);
    }
    persist();
    notifier.emit("AI_WORKERS_ADVANCED", { minutes, action });
    return listSnapshots();
  }

  function integrityReport() {
    const issues = [];
    for (const state of states.values()) {
      if (!AI_WORKER_ACTIONS.includes(state.current_action)) issues.push(`${state.worker_id}: invalid action`);
      if (state.energy < 0 || state.energy > 100 || state.fatigue < 0 || state.fatigue > 100) issues.push(`${state.worker_id}: invalid needs`);
      if (state.events.length > MAX_EVENTS) issues.push(`${state.worker_id}: event limit exceeded`);
    }
    return snapshot({ ok: issues.length === 0, runtime: "AI_WORKER_DAILY_RUNTIME", worker_count: states.size, issues });
  }

  return Object.freeze({
    getSnapshot,
    listSnapshots,
    advance,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      states.clear();
      destroyed = true;
      return true;
    }
  });
}
