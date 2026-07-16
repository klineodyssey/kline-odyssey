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

const RUNTIME = "CitizenDailyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 160;

export const CITIZEN_DAILY_SCHEDULE = Object.freeze([
  Object.freeze({ start_hour: 0, activity: "SLEEP", label: "Sleep" }),
  Object.freeze({ start_hour: 6, activity: "WAKE", label: "Wake" }),
  Object.freeze({ start_hour: 7, activity: "BREAKFAST", label: "Breakfast" }),
  Object.freeze({ start_hour: 8, activity: "WORK", label: "Work" }),
  Object.freeze({ start_hour: 12, activity: "LUNCH", label: "Lunch" }),
  Object.freeze({ start_hour: 13, activity: "STUDY", label: "Study" }),
  Object.freeze({ start_hour: 15, activity: "SHOPPING", label: "Shopping" }),
  Object.freeze({ start_hour: 17, activity: "EXERCISE", label: "Exercise" }),
  Object.freeze({ start_hour: 18, activity: "DINNER", label: "Dinner" }),
  Object.freeze({ start_hour: 19, activity: "ENTERTAINMENT", label: "Entertainment" }),
  Object.freeze({ start_hour: 22, activity: "SLEEP", label: "Sleep" })
]);

function profiles(world) {
  return (world?.lifeProfiles ?? world?.life_profiles ?? []).filter((profile) => (
    profile?.synthetic === true
    && profile?.citizen_runtime?.status !== "NOT_APPLICABLE"
    && profile?.life_type !== "PLANT"
  ));
}

function scheduleAt(hour) {
  let selected = CITIZEN_DAILY_SCHEDULE[0];
  for (const entry of CITIZEN_DAILY_SCHEDULE) {
    if (hour >= entry.start_hour) selected = entry;
  }
  return selected;
}

function initialCitizen(profile, startingMoney) {
  const vitals = profile.vitals ?? {};
  return {
    life_id: String(profile.id),
    display_name: String(profile.label ?? profile.id),
    occupation: String(profile.citizen_runtime?.occupation ?? "Citizen"),
    life_state: String(profile.individual_life_os?.life_state ?? "ALIVE"),
    current_activity: "WAKE",
    previous_activity: null,
    activity_revision: 0,
    clock_hour: 6,
    needs: {
      health: clamp(vitals.health ?? 100),
      hunger: clamp(100 - (vitals.food ?? 75)),
      thirst: clamp(100 - (vitals.water ?? 75)),
      fatigue: clamp(100 - (vitals.energy ?? 75)),
      mood: 72,
      knowledge: profile.life_type === "PLAYER" ? 42 : 58,
      money: profile.life_type === "PLAYER" ? startingMoney : 180,
      housing: profile.building_id ? 95 : 25,
      relationship: 64,
      safety: 88
    },
    revision: 0,
    events: []
  };
}

function normalizePersisted(candidate, fallback) {
  if (candidate?.life_id !== fallback.life_id) return fallback;
  const result = { ...fallback, ...candidate, needs: { ...fallback.needs, ...(candidate.needs ?? {}) } };
  for (const key of Object.keys(result.needs)) result.needs[key] = clamp(result.needs[key], 0, key === "money" ? 1_000_000 : 100);
  result.events = Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : [];
  return result;
}

function applyActivity(state, activity, hours) {
  const needs = state.needs;
  needs.hunger = clamp(needs.hunger + (activity === "SLEEP" ? 0.35 : activity === "WORK" ? 1.7 : 0.8) * hours);
  needs.thirst = clamp(needs.thirst + (activity === "SLEEP" ? 0.45 : activity === "WORK" ? 2 : 1.05) * hours);
  needs.fatigue = clamp(needs.fatigue + (activity === "SLEEP" ? -5 : activity === "EXERCISE" ? 2.5 : activity === "WORK" ? 1.6 : 0.45) * hours);

  if (["BREAKFAST", "LUNCH", "DINNER"].includes(activity)) {
    needs.hunger = clamp(needs.hunger - 25 * Math.min(hours, 1));
    needs.thirst = clamp(needs.thirst - 18 * Math.min(hours, 1));
    needs.mood = clamp(needs.mood + 2 * Math.min(hours, 1));
  }
  if (activity === "STUDY") needs.knowledge = clamp(needs.knowledge + 1.5 * hours);
  if (activity === "WORK") needs.mood = clamp(needs.mood - 0.35 * hours);
  if (activity === "EXERCISE") {
    needs.health = clamp(needs.health + 0.7 * hours);
    needs.mood = clamp(needs.mood + 1.2 * hours);
  }
  if (activity === "ENTERTAINMENT") {
    needs.mood = clamp(needs.mood + 2 * hours);
    needs.relationship = clamp(needs.relationship + 0.8 * hours);
  }
  if (needs.hunger > 85 || needs.thirst > 85 || needs.fatigue > 90) needs.health = clamp(needs.health - 1.5 * hours);
}

export function createCitizenDailyRuntime({
  world,
  storage,
  storageKey = "kaios.world-viewer.citizen-daily.v1",
  startingMoney = 500
} = {}) {
  const sourceProfiles = profiles(world);
  if (!sourceProfiles.length) throw runtimeError(RUNTIME, "NO_CITIZENS", "Synthetic world has no active Citizen Runtime profiles");
  const storageRef = resolveStorage(storage);
  const defaults = new Map(sourceProfiles.map((profile) => [String(profile.id), initialCitizen(profile, startingMoney)]));
  let states = new Map([...defaults].map(([id, value]) => [id, structuredClone(value)]));
  let destroyed = false;
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.states));
  if (restored) {
    for (const candidate of restored.states) {
      if (defaults.has(candidate?.life_id)) states.set(candidate.life_id, normalizePersisted(candidate, defaults.get(candidate.life_id)));
    }
  }

  const getSnapshot = (lifeId = world?.player?.life_id ?? sourceProfiles[0].id) => {
    const state = states.get(String(lifeId));
    if (!state) throw runtimeError(RUNTIME, "CITIZEN_NOT_FOUND", `Unknown citizen ${lifeId}`);
    return snapshot({ ...state, schedule: CITIZEN_DAILY_SCHEDULE, current_schedule: scheduleAt(state.clock_hour ?? 0) });
  };
  const listSnapshots = () => [...states.keys()].map((id) => getSnapshot(id));
  const notifier = createNotifier(() => snapshot({ citizens: listSnapshots() }));
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, states: [...states.values()] });

  function advance({ elapsedMinutes = 60, clockSnapshot, lifeSnapshots = [] } = {}) {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Citizen Daily Runtime has been destroyed");
    const minutes = Number(elapsedMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Citizen advance must be 1-1440 minutes");
    const hour = Number(clockSnapshot?.hour ?? 0);
    const activity = scheduleAt(hour);
    const lifeIndex = new Map(lifeSnapshots.map((life) => [String(life.life_id), life]));

    for (const state of states.values()) {
      const previous = state.current_activity;
      state.previous_activity = previous;
      state.current_activity = activity.activity;
      state.clock_hour = hour;
      state.revision += 1;
      if (previous !== activity.activity) state.activity_revision += 1;
      applyActivity(state, activity.activity, minutes / 60);
      const life = lifeIndex.get(state.life_id);
      if (life) {
        state.life_state = life.life_state;
        state.needs.health = clamp(life.health);
        state.needs.hunger = clamp(100 - life.food);
        state.needs.thirst = clamp(100 - life.water);
        state.needs.fatigue = clamp(100 - life.energy);
      }
      boundedPush(state.events, {
        event_id: stableId(`citizen-${state.life_id}`, state.revision),
        type: previous === activity.activity ? "SCHEDULE_CONTINUED" : "SCHEDULE_TRANSITION",
        activity: activity.activity,
        day: clockSnapshot?.day ?? 1,
        hour
      }, MAX_EVENTS);
    }
    persist();
    notifier.emit("CITIZENS_ADVANCED", { minutes, activity: activity.activity });
    return listSnapshots();
  }

  function setMoney(lifeId, amount) {
    const state = states.get(String(lifeId));
    if (!state) throw runtimeError(RUNTIME, "CITIZEN_NOT_FOUND", `Unknown citizen ${lifeId}`);
    state.needs.money = clamp(amount, 0, 1_000_000);
    state.revision += 1;
    persist();
    notifier.emit("MONEY_SYNCED", { life_id: state.life_id });
    return getSnapshot(state.life_id);
  }

  function integrityReport() {
    const issues = [];
    for (const state of states.values()) {
      for (const [key, value] of Object.entries(state.needs)) {
        const maximum = key === "money" ? 1_000_000 : 100;
        if (!Number.isFinite(value) || value < 0 || value > maximum) issues.push(`${state.life_id}: invalid ${key}`);
      }
      if (state.events.length > MAX_EVENTS) issues.push(`${state.life_id}: event limit exceeded`);
    }
    return snapshot({ ok: issues.length === 0, runtime: "CITIZEN_DAILY_RUNTIME", citizen_count: states.size, issues });
  }

  return Object.freeze({
    getSnapshot,
    listSnapshots,
    advance,
    setMoney,
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
