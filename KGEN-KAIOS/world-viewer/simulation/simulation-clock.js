import {
  boundedPush,
  createNotifier,
  integer,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "SimulationClock";
const SCHEMA_VERSION = "1.0.0";
const MINUTES_PER_DAY = 1440;
const DAYS_PER_YEAR = 360;
const MAX_ADVANCE_MINUTES = 30 * MINUTES_PER_DAY;
const SEASONS = Object.freeze(["SPRING", "SUMMER", "AUTUMN", "WINTER"]);

function derived(state) {
  const total = state.elapsed_minutes;
  const calendarMinutes = state.start_minute_of_day + total;
  const absoluteDay = Math.floor(calendarMinutes / MINUTES_PER_DAY);
  const minuteOfDay = calendarMinutes % MINUTES_PER_DAY;
  const dayOfYear = absoluteDay % DAYS_PER_YEAR;
  const timestamp = new Date(state.epoch_ms + total * 60_000).toISOString();
  return {
    runtime: "CIVILIZATION_SIMULATION_CLOCK",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    timestamp,
    elapsed_minutes: total,
    minute: minuteOfDay % 60,
    hour: Math.floor(minuteOfDay / 60),
    day: absoluteDay + 1,
    day_of_year: dayOfYear + 1,
    week: Math.floor(dayOfYear / 7) + 1,
    season: SEASONS[Math.min(3, Math.floor(dayOfYear / 90))],
    year: Math.floor(absoluteDay / DAYS_PER_YEAR) + 1,
    revision: state.revision,
    running: state.running,
    events: state.events
  };
}

export function createSimulationClock({
  start = "2036-03-20T06:00:00Z",
  storage,
  storageKey = "kaios.world-viewer.civilization-clock.v1"
} = {}) {
  const epochMs = Date.parse(start);
  if (!Number.isFinite(epochMs)) throw new TypeError("Simulation clock start must be an ISO timestamp");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let timer = null;
  let state = {
    epoch_ms: epochMs,
    start_minute_of_day: new Date(epochMs).getUTCHours() * 60 + new Date(epochMs).getUTCMinutes(),
    elapsed_minutes: 0,
    revision: 0,
    running: false,
    events: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => (
    value?.schema_version === SCHEMA_VERSION
    && value?.state?.epoch_ms === epochMs
    && Number.isInteger(value?.state?.elapsed_minutes)
  ));
  if (restored) state = { ...state, ...restored.state, running: false, events: restored.state.events?.slice(-120) ?? [] };

  const getSnapshot = () => snapshot(derived(state));
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state: { ...state, running: false } });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Simulation clock has been destroyed");
  };

  function advance(minutes = 60) {
    usable();
    const amount = integer(minutes, 0);
    if (amount <= 0 || amount > MAX_ADVANCE_MINUTES) {
      throw runtimeError(RUNTIME, "INVALID_ADVANCE", `Advance must be 1-${MAX_ADVANCE_MINUTES} minutes`);
    }
    state.elapsed_minutes += amount;
    state.revision += 1;
    boundedPush(state.events, {
      event_id: stableId("clock", state.revision),
      type: "TIME_ADVANCED",
      minutes: amount,
      elapsed_minutes: state.elapsed_minutes
    });
    persist();
    notifier.emit("TIME_ADVANCED", { minutes: amount });
    return getSnapshot();
  }

  function startAuto({ intervalMs = 1000, minutesPerTick = 60 } = {}) {
    usable();
    if (timer !== null) return false;
    if (!Number.isFinite(intervalMs) || intervalMs < 250) throw runtimeError(RUNTIME, "INVALID_INTERVAL", "Auto interval must be at least 250ms");
    state.running = true;
    timer = globalThis.setInterval(() => advance(minutesPerTick), intervalMs);
    notifier.emit("AUTO_STARTED", { interval_ms: intervalMs, minutes_per_tick: minutesPerTick });
    return true;
  }

  function stopAuto() {
    if (timer === null) return false;
    globalThis.clearInterval(timer);
    timer = null;
    state.running = false;
    notifier.emit("AUTO_STOPPED");
    return true;
  }

  function integrityReport() {
    const value = derived(state);
    const issues = [];
    if (!Number.isInteger(state.elapsed_minutes) || state.elapsed_minutes < 0) issues.push("invalid elapsed_minutes");
    if (state.events.length > 120) issues.push("event history exceeded 120");
    if (!SEASONS.includes(value.season)) issues.push("invalid season");
    return snapshot({ ok: issues.length === 0, runtime: value.runtime, event_count: state.events.length, issues });
  }

  return Object.freeze({
    getSnapshot,
    advance,
    startAuto,
    stopAuto,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      stopAuto();
      notifier.clear();
      destroyed = true;
      return true;
    }
  });
}

export const SIMULATION_CALENDAR = Object.freeze({
  minutes_per_day: MINUTES_PER_DAY,
  days_per_year: DAYS_PER_YEAR,
  seasons: SEASONS
});
