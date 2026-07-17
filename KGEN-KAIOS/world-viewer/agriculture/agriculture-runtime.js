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

const RUNTIME = "AgricultureRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;
const WAREHOUSE_CAPACITY = 300;

export const CROP_CATALOG = Object.freeze({
  RICE: Object.freeze({ crop_id: "RICE", type: "CROP", growth_hours: 24, yield_units: 8, water_per_hour: 1.1, energy_per_hour: 0.6 }),
  VEGETABLE: Object.freeze({ crop_id: "VEGETABLE", type: "CROP", growth_hours: 12, yield_units: 6, water_per_hour: 0.9, energy_per_hour: 0.45 }),
  FRUIT: Object.freeze({ crop_id: "FRUIT", type: "TREE", growth_hours: 48, yield_units: 10, water_per_hour: 0.75, energy_per_hour: 0.35 })
});

function defaultPlots(parcelId) {
  return [
    { plot_id: "starter-garden-001", label: "Kitchen Garden", parcel_id: parcelId, state: "EMPTY" },
    { plot_id: "starter-field-001", label: "Starter Field", parcel_id: parcelId, state: "EMPTY" },
    { plot_id: "starter-orchard-001", label: "Young Orchard", parcel_id: parcelId, state: "EMPTY" }
  ].map((plot) => ({
    ...plot,
    crop_id: null,
    growth_percent: 0,
    elapsed_hours: 0,
    water_used: 0,
    energy_used: 0,
    ai_assistance: 0,
    revision: 0,
    history: []
  }));
}

function initialState(parcelId) {
  return {
    revision: 0,
    plots: defaultPlots(parcelId),
    seeds: { RICE: 4, VEGETABLE: 4, FRUIT: 3 },
    warehouse: {},
    events: []
  };
}

function restore(candidate, fallback) {
  if (!candidate || !Array.isArray(candidate.plots)) return fallback;
  return {
    ...fallback,
    ...candidate,
    plots: candidate.plots.map((plot) => ({ ...plot, history: Array.isArray(plot.history) ? plot.history.slice(-60) : [] })),
    seeds: { ...fallback.seeds, ...(candidate.seeds ?? {}) },
    warehouse: { ...(candidate.warehouse ?? {}) },
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_EVENTS) : []
  };
}

function warehouseCount(warehouse) {
  return Object.values(warehouse).reduce((sum, quantity) => sum + (Number(quantity) || 0), 0);
}

export function createAgricultureRuntime({
  parcelId = "parcel-001",
  storage,
  storageKey = "kaios.world-viewer.agriculture.v1"
} = {}) {
  const storageRef = resolveStorage(storage);
  const defaults = initialState(parcelId);
  let state = defaults;
  let destroyed = false;
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.plots));
  if (restored) state = restore(restored.state, defaults);

  const getSnapshot = () => snapshot({
    runtime: "AGRICULTURE_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    parcel_id: parcelId,
    plots: state.plots,
    seeds: state.seeds,
    warehouse: state.warehouse,
    warehouse_capacity: WAREHOUSE_CAPACITY,
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Agriculture Runtime has been destroyed");
  };
  const plotById = (plotId) => {
    const plot = state.plots.find((item) => item.plot_id === plotId);
    if (!plot) throw runtimeError(RUNTIME, "PLOT_NOT_FOUND", `Unknown plot ${plotId}`);
    return plot;
  };

  function event(type, details) {
    state.revision += 1;
    return boundedPush(state.events, { event_id: stableId("farm", state.revision), type, ...details }, MAX_EVENTS);
  }

  function plant({ plotId, cropId } = {}) {
    usable();
    const plot = plotById(plotId);
    const crop = CROP_CATALOG[cropId];
    if (!crop) throw runtimeError(RUNTIME, "CROP_NOT_FOUND", `Unknown crop ${cropId}`);
    if (!["EMPTY", "HARVESTED"].includes(plot.state)) throw runtimeError(RUNTIME, "PLOT_OCCUPIED", `${plotId} is not ready for planting`);
    if ((state.seeds[cropId] ?? 0) < 1) throw runtimeError(RUNTIME, "NO_SEEDS", `No ${cropId} starter seeds remain`);
    state.seeds[cropId] -= 1;
    Object.assign(plot, { state: "GROWING", crop_id: cropId, growth_percent: 0, elapsed_hours: 0, water_used: 0, energy_used: 0, ai_assistance: 0 });
    plot.revision += 1;
    boundedPush(plot.history, { type: "PLANTED", crop_id: cropId, revision: plot.revision }, 60);
    event("PLANTED", { plot_id: plotId, crop_id: cropId });
    persist();
    notifier.emit("PLANTED", { plot_id: plotId, crop_id: cropId });
    return getSnapshot();
  }

  function advance({ elapsedHours = 1, aiAssistance = 0 } = {}) {
    usable();
    const hours = Number(elapsedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw runtimeError(RUNTIME, "INVALID_ADVANCE", "Farm advance must be 0-720 hours");
    const assistance = clamp(aiAssistance, 0, 0.35);
    for (const plot of state.plots.filter((item) => item.state === "GROWING")) {
      const crop = CROP_CATALOG[plot.crop_id];
      const effectiveHours = hours * (1 + assistance);
      plot.elapsed_hours += effectiveHours;
      plot.growth_percent = clamp((plot.elapsed_hours / crop.growth_hours) * 100);
      plot.water_used += crop.water_per_hour * hours;
      plot.energy_used += crop.energy_per_hour * hours;
      plot.ai_assistance = assistance;
      plot.revision += 1;
      if (plot.growth_percent >= 100) {
        plot.state = "READY";
        boundedPush(plot.history, { type: "READY", crop_id: plot.crop_id, revision: plot.revision }, 60);
      }
    }
    event("FARM_ADVANCED", { elapsed_hours: hours, ai_assistance: assistance });
    persist();
    notifier.emit("FARM_ADVANCED", { elapsed_hours: hours, ai_assistance: assistance });
    return getSnapshot();
  }

  function harvest(plotId) {
    usable();
    const plot = plotById(plotId);
    if (plot.state !== "READY") throw runtimeError(RUNTIME, "NOT_READY", `${plotId} is not ready to harvest`);
    const crop = CROP_CATALOG[plot.crop_id];
    const quantity = Math.max(1, Math.floor(crop.yield_units * (1 + plot.ai_assistance)));
    if (warehouseCount(state.warehouse) + quantity > WAREHOUSE_CAPACITY) throw runtimeError(RUNTIME, "WAREHOUSE_FULL", "Farm warehouse capacity exceeded");
    state.warehouse[plot.crop_id] = (state.warehouse[plot.crop_id] ?? 0) + quantity;
    const result = { plot_id: plotId, resource_id: plot.crop_id, quantity };
    plot.state = "HARVESTED";
    plot.growth_percent = 100;
    plot.revision += 1;
    boundedPush(plot.history, { type: "HARVESTED", quantity, revision: plot.revision }, 60);
    event("HARVESTED", result);
    persist();
    notifier.emit("HARVESTED", result);
    return snapshot({ result, snapshot: getSnapshot() });
  }

  function takeFromWarehouse(resourceId, quantity = 1) {
    usable();
    const units = integer(quantity);
    if (units <= 0 || (state.warehouse[resourceId] ?? 0) < units) throw runtimeError(RUNTIME, "INSUFFICIENT_WAREHOUSE_STOCK", `Farm warehouse lacks ${resourceId}`);
    state.warehouse[resourceId] -= units;
    event("WAREHOUSE_OUT", { resource_id: resourceId, quantity: units });
    persist();
    notifier.emit("WAREHOUSE_OUT", { resource_id: resourceId, quantity: units });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    for (const plot of state.plots) {
      if (!['EMPTY', 'GROWING', 'READY', 'HARVESTED'].includes(plot.state)) issues.push(`${plot.plot_id}: invalid state`);
      if (plot.growth_percent < 0 || plot.growth_percent > 100) issues.push(`${plot.plot_id}: invalid growth`);
      if (plot.history.length > 60) issues.push(`${plot.plot_id}: history limit exceeded`);
    }
    if (warehouseCount(state.warehouse) > WAREHOUSE_CAPACITY) issues.push("warehouse capacity exceeded");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "AGRICULTURE_ALPHA", plot_count: state.plots.length, warehouse_units: warehouseCount(state.warehouse), issues });
  }

  return Object.freeze({
    getSnapshot,
    plant,
    advance,
    harvest,
    takeFromWarehouse,
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
