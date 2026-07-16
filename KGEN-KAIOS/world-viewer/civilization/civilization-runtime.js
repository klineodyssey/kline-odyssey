import { createAgricultureRuntime } from "../agriculture/agriculture-runtime.js";
import { createAiWorkerRuntime } from "../ai/ai-worker-runtime.js";
import { createCitizenDailyRuntime, CITIZEN_DAILY_SCHEDULE } from "../citizen/citizen-daily-runtime.js";
import { createCityRuntime } from "../city/city-runtime.js";
import { createEconomyRuntime } from "../economy/economy-runtime.js";
import { createSimulationClock } from "../simulation/simulation-clock.js";
import { boundedPush, createNotifier, runtimeError, snapshot, stableId } from "./runtime-utils.js";

const RUNTIME = "CivilizationRuntime";
const MAX_EVENTS = 180;

function scheduleAt(hour) {
  let selected = CITIZEN_DAILY_SCHEDULE[0];
  for (const entry of CITIZEN_DAILY_SCHEDULE) if (hour >= entry.start_hour) selected = entry;
  return selected.activity;
}

export function createCivilizationRuntime({
  world,
  lifeRuntime,
  buildingRuntime,
  storage,
  storagePrefix = "kaios.world-viewer.civilization-alpha"
} = {}) {
  if (!world || !lifeRuntime) throw new TypeError("Civilization Runtime requires the synthetic world and Life Runtime");
  const config = world.civilization_alpha ?? {};
  const playerId = world.player?.player_id ?? "mock-player-001";
  const playerLifeId = world.player?.life_id ?? "life-player-001";
  const clock = createSimulationClock({ start: config.clock_start, storage, storageKey: `${storagePrefix}.clock` });
  const citizen = createCitizenDailyRuntime({ world, storage, storageKey: `${storagePrefix}.citizen`, startingMoney: config.prototype_balance ?? 500 });
  const aiWorker = createAiWorkerRuntime({ world, storage, storageKey: `${storagePrefix}.ai-worker` });
  const economy = createEconomyRuntime({ playerId, playerBalance: config.prototype_balance ?? 500, storage, storageKey: `${storagePrefix}.economy` });
  const agriculture = createAgricultureRuntime({ parcelId: world.player?.starter_parcel_id, storage, storageKey: `${storagePrefix}.agriculture` });
  const city = createCityRuntime({ cityId: config.city_id, label: world.cities?.find(({ id }) => id === config.city_id)?.label, storage, storageKey: `${storagePrefix}.city` });
  let running = false;
  let timer = null;
  let destroyed = false;
  let revision = 0;
  const events = [];

  const getSnapshot = () => snapshot({
    runtime: "CIVILIZATION_ALPHA",
    synthetic: true,
    source_of_truth: false,
    playerId,
    playerLifeId,
    running,
    revision,
    clock: clock.getSnapshot(),
    citizen: citizen.getSnapshot(playerLifeId),
    citizens: citizen.listSnapshots(),
    aiWorker: aiWorker.getSnapshot(config.ai_worker_id),
    aiWorkers: aiWorker.listSnapshots(),
    economy: economy.getSnapshot(),
    agriculture: agriculture.getSnapshot(),
    city: city.getSnapshot(),
    events
  });
  const notifier = createNotifier(getSnapshot);
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Civilization Runtime has been destroyed");
  };

  function record(type, details = {}) {
    revision += 1;
    boundedPush(events, { event_id: stableId("civilization", revision), type, ...details }, MAX_EVENTS);
  }

  function buildings() {
    if (!buildingRuntime) return world.buildings ?? [];
    return (world.parcels ?? []).flatMap((parcel) => buildingRuntime.listByParcel(parcel.id));
  }

  function refreshCity() {
    return city.refresh({
      citizens: citizen.listSnapshots(),
      aiWorkers: aiWorker.listSnapshots(),
      economy: economy.getSnapshot(),
      agriculture: agriculture.getSnapshot(),
      buildings: buildings(),
      world
    });
  }

  function tryLifeAction(action) {
    try { lifeRuntime.act(playerLifeId, action); return true; } catch { return false; }
  }

  function handleCitizenTransition(previous, next) {
    if (previous === next) return;
    if (["BREAKFAST", "LUNCH", "DINNER"].includes(next)) {
      const ate = tryLifeAction("EAT");
      const drank = tryLifeAction("DRINK");
      try { economy.consume({ ownerId: playerId, resourceId: "RICE", quantity: 1, reason: next }); } catch { /* Food shortage is reflected by needs. */ }
      try { economy.consume({ ownerId: playerId, resourceId: "WATER", quantity: 1, reason: next }); } catch { /* Water shortage is reflected by needs. */ }
      record("MEAL", { activity: next, ate, drank });
    } else if (next === "WORK") {
      tryLifeAction("WORK");
      try { economy.payReward({ ownerId: playerId, amount: 15, reason: "DAILY_WORK" }); } catch { /* Prototype treasury can enter a constrained state. */ }
      record("WORK_STARTED", { reward: 15 });
    } else if (next === "SLEEP") {
      tryLifeAction("SLEEP");
      record("SLEEP_STARTED");
    } else if (next === "WAKE") {
      tryLifeAction("WAKE");
      record("WAKE_STARTED");
    }
  }

  function advance(minutes = 60) {
    usable();
    const total = Number(minutes);
    if (!Number.isFinite(total) || total <= 0 || total > 30 * 1440) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Civilization advance must be 1-43200 minutes");
    let remaining = Math.floor(total);
    while (remaining > 0) {
      const chunk = Math.min(60, remaining);
      const previousActivity = citizen.getSnapshot(playerLifeId).current_activity;
      const clockSnapshot = clock.advance(chunk);
      const nextActivity = scheduleAt(clockSnapshot.hour);
      handleCitizenTransition(previousActivity, nextActivity);
      lifeRuntime.advance({ elapsedMs: chunk * 60_000 });
      aiWorker.advance({ elapsedMinutes: chunk, clockSnapshot });
      const workerSnapshots = aiWorker.listSnapshots();
      const assistance = workerSnapshots.some((worker) => worker.current_action === "FARM") ? 0.25 : 0;
      agriculture.advance({ elapsedHours: chunk / 60, aiAssistance: assistance });
      citizen.advance({ elapsedMinutes: chunk, clockSnapshot, lifeSnapshots: lifeRuntime.listSnapshots() });
      citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
      remaining -= chunk;
    }
    refreshCity();
    record("TIME_ADVANCED", { minutes: Math.floor(total) });
    notifier.emit("TIME_ADVANCED", { minutes: Math.floor(total) });
    return getSnapshot();
  }

  function buy(listingId, quantity = 1) {
    usable();
    economy.buy({ listingId, buyerId: playerId, quantity });
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("MARKET_PURCHASE", { listing_id: listingId, quantity });
    notifier.emit("MARKET_PURCHASE", { listing_id: listingId, quantity });
    return getSnapshot();
  }

  function plant(plotId, cropId) {
    usable();
    agriculture.plant({ plotId, cropId });
    record("CROP_PLANTED", { plot_id: plotId, crop_id: cropId });
    notifier.emit("CROP_PLANTED", { plot_id: plotId, crop_id: cropId });
    return getSnapshot();
  }

  function harvest(plotId) {
    usable();
    const result = agriculture.harvest(plotId).result;
    refreshCity();
    record("CROP_HARVESTED", result);
    notifier.emit("CROP_HARVESTED", result);
    return getSnapshot();
  }

  function sellHarvest(resourceId, quantity = 1) {
    usable();
    agriculture.takeFromWarehouse(resourceId, quantity);
    economy.deposit({ ownerId: playerId, resourceId, quantity, source: "FARM_WAREHOUSE" });
    economy.sell({ sellerId: playerId, resourceId, quantity, unitPrice: 4 });
    citizen.setMoney(playerLifeId, economy.getSnapshot().player_balance);
    refreshCity();
    record("HARVEST_SOLD", { resource_id: resourceId, quantity });
    notifier.emit("HARVEST_SOLD", { resource_id: resourceId, quantity });
    return getSnapshot();
  }

  function start({ intervalMs = 1000, minutesPerTick = 60 } = {}) {
    usable();
    if (timer !== null) return false;
    if (!Number.isFinite(intervalMs) || intervalMs < 250) throw runtimeError(RUNTIME, "INVALID_INTERVAL", "Auto interval must be at least 250ms");
    running = true;
    timer = globalThis.setInterval(() => {
      try { advance(minutesPerTick); } catch { stop(); }
    }, intervalMs);
    notifier.emit("AUTO_STARTED", { interval_ms: intervalMs, minutes_per_tick: minutesPerTick });
    return true;
  }

  function stop() {
    if (timer === null) return false;
    globalThis.clearInterval(timer);
    timer = null;
    running = false;
    notifier.emit("AUTO_STOPPED");
    return true;
  }

  function integrityReport() {
    const reports = {
      clock: clock.integrityReport(),
      citizen: citizen.integrityReport(),
      ai_worker: aiWorker.integrityReport(),
      economy: economy.integrityReport(),
      agriculture: agriculture.integrityReport(),
      city: city.integrityReport()
    };
    const issues = Object.entries(reports).filter(([, report]) => !report.ok).map(([name]) => `${name} integrity failed`);
    if (events.length > MAX_EVENTS) issues.push("civilization event limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "CIVILIZATION_ALPHA", reports, event_count: events.length, issues });
  }

  refreshCity();

  return Object.freeze({
    getSnapshot,
    advance,
    buy,
    plant,
    harvest,
    sellHarvest,
    start,
    stop,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      stop();
      notifier.clear();
      clock.destroy();
      citizen.destroy();
      aiWorker.destroy();
      economy.destroy();
      agriculture.destroy();
      city.destroy();
      destroyed = true;
      return true;
    }
  });
}
