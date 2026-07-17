import {
  boundedPush,
  clamp,
  clone,
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
const SCHEMA_VERSION = "2.0.0";
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

function defaultFacilities(facilities) {
  return (facilities ?? []).map((facility) => ({
    ...clone(facility),
    state: "ACTIVE",
    health: 94,
    energy: 90,
    disease_risk: 6,
    progress_hours: 0,
    cycles_completed: 0,
    input_used: {},
    missing_inputs: [],
    revision: 0,
    history: []
  }));
}

function initialState(parcelId, facilities, resources) {
  return {
    revision: 0,
    plots: defaultPlots(parcelId),
    facilities: defaultFacilities(facilities),
    resources: { ...(resources ?? {}) },
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
    facilities: fallback.facilities.map((facility) => {
      const restored = candidate.facilities?.find(({ facility_id: id }) => id === facility.facility_id) ?? {};
      return { ...facility, ...restored, input_used: { ...(restored.input_used ?? {}) }, history: Array.isArray(restored.history) ? restored.history.slice(-60) : [] };
    }),
    resources: { ...fallback.resources, ...(candidate.resources ?? {}) },
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
  facilities = [],
  resources = {},
  storage,
  storageKey = "kaios.world-viewer.agriculture.v1"
} = {}) {
  const storageRef = resolveStorage(storage);
  const defaults = initialState(parcelId, facilities, resources);
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
    facilities: state.facilities,
    resources: state.resources,
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
  const facilityById = (facilityId) => {
    const facility = state.facilities.find((item) => item.facility_id === facilityId);
    if (!facility) throw runtimeError(RUNTIME, "FACILITY_NOT_FOUND", `Unknown agriculture facility ${facilityId}`);
    return facility;
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
    for (const facility of state.facilities) {
      if (facility.state === "READY") continue;
      const requirements = facility.required_inputs ?? [];
      const missing = requirements
        .filter(({ resource_id: resourceId, per_hour: rate }) => (state.resources[resourceId] ?? 0) < Number(rate) * hours)
        .map(({ resource_id: resourceId }) => resourceId);
      facility.missing_inputs = missing;
      if (missing.length) {
        facility.state = "BLOCKED";
        facility.health = clamp(facility.health - 0.45 * hours);
        facility.energy = clamp(facility.energy - 0.2 * hours);
        facility.disease_risk = clamp(facility.disease_risk + 0.15 * hours);
      } else {
        for (const { resource_id: resourceId, per_hour: rate } of requirements) {
          const used = Number(rate) * hours;
          state.resources[resourceId] = Math.max(0, (state.resources[resourceId] ?? 0) - used);
          facility.input_used[resourceId] = (facility.input_used[resourceId] ?? 0) + used;
        }
        facility.state = "ACTIVE";
        facility.progress_hours = Math.min(facility.cycle_hours, facility.progress_hours + hours * (1 + assistance));
        facility.health = clamp(facility.health + 0.04 * hours);
        facility.energy = clamp(facility.energy - 0.02 * hours);
        facility.disease_risk = clamp(facility.disease_risk - 0.04 * hours);
        if (facility.progress_hours >= facility.cycle_hours) {
          facility.state = "READY";
          boundedPush(facility.history, { type: "FACILITY_READY", revision: facility.revision + 1 }, 60);
        }
      }
      facility.revision += 1;
    }
    event("FARM_ADVANCED", { elapsed_hours: hours, ai_assistance: assistance });
    persist();
    notifier.emit("FARM_ADVANCED", { elapsed_hours: hours, ai_assistance: assistance });
    return getSnapshot();
  }

  function collectFacility(facilityId) {
    usable();
    const facility = facilityById(facilityId);
    if (facility.state !== "READY") throw runtimeError(RUNTIME, "FACILITY_NOT_READY", `${facilityId} has no completed output`);
    const resourceId = facility.output?.resource_id;
    const quantity = integer(facility.output?.quantity);
    if (!resourceId || quantity <= 0) throw runtimeError(RUNTIME, "FACILITY_OUTPUT_INVALID", `${facilityId} has an invalid output contract`);
    if (resourceId === "WATER") {
      state.resources.WATER = (state.resources.WATER ?? 0) + quantity;
    } else {
      if (warehouseCount(state.warehouse) + quantity > WAREHOUSE_CAPACITY) throw runtimeError(RUNTIME, "WAREHOUSE_FULL", "Farm warehouse capacity exceeded");
      state.warehouse[resourceId] = (state.warehouse[resourceId] ?? 0) + quantity;
    }
    facility.state = "ACTIVE";
    facility.progress_hours = 0;
    facility.cycles_completed += 1;
    facility.energy = clamp(facility.energy + 8);
    facility.revision += 1;
    const result = { facility_id: facilityId, resource_id: resourceId, quantity };
    boundedPush(facility.history, { type: "FACILITY_COLLECTED", ...result, revision: facility.revision }, 60);
    event("FACILITY_COLLECTED", result);
    persist();
    notifier.emit("FACILITY_COLLECTED", result);
    return snapshot({ result, snapshot: getSnapshot() });
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
    const facilityIds = new Set();
    for (const facility of state.facilities) {
      if (facilityIds.has(facility.facility_id)) issues.push(`${facility.facility_id}: duplicate facility`);
      facilityIds.add(facility.facility_id);
      if (!['ACTIVE', 'READY', 'BLOCKED'].includes(facility.state)) issues.push(`${facility.facility_id}: invalid state`);
      if (!facility.species_os_id || !facility.life_os_profile_id) issues.push(`${facility.facility_id}: organism layers incomplete`);
      if (facility.health < 0 || facility.health > 100) issues.push(`${facility.facility_id}: invalid health`);
      if (facility.disease_risk < 0 || facility.disease_risk > 100) issues.push(`${facility.facility_id}: invalid disease risk`);
      if (facility.history.length > 60) issues.push(`${facility.facility_id}: history limit exceeded`);
    }
    for (const [resource, quantity] of Object.entries(state.resources)) {
      if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) issues.push(`${resource}: invalid agriculture resource`);
    }
    if (warehouseCount(state.warehouse) > WAREHOUSE_CAPACITY) issues.push("warehouse capacity exceeded");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "AGRICULTURE_ALPHA", plot_count: state.plots.length, facility_count: state.facilities.length, warehouse_units: warehouseCount(state.warehouse), issues });
  }

  return Object.freeze({
    getSnapshot,
    plant,
    advance,
    harvest,
    collectFacility,
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
