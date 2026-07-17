import {
  boundedPush,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "CosmicCoordinateRuntime";
export const COSMIC_COORDINATE_TYPES = Object.freeze([
  "PLANET", "CIVILIZATION", "TEMPLE", "PORTAL", "TIMELINE_GATE", "GRAVITY_WELL", "SPECIAL_COORDINATE"
]);

export function createCosmicCoordinateRuntime({ config, technologyRuntime, storage, storageKey = "kaios.world-viewer.cosmic-coordinate.v1" } = {}) {
  if (!Array.isArray(config) || !COSMIC_COORDINATE_TYPES.every((type) => config.some(({ coordinate_type: candidate }) => candidate === type))) {
    throw new TypeError("Cosmic Coordinate Runtime requires all approved coordinate types");
  }
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    discoveries: Object.fromEntries(config.map((entry) => [entry.coordinate_id, entry.discovery_status === "DISCOVERED"])),
    discovery_history: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, discoveries: { ...state.discoveries, ...restored.state.discoveries }, discovery_history: restored.state.discovery_history?.slice(-80) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Cosmic Coordinate Runtime has been destroyed");
  };
  const coordinate = (coordinateId) => {
    const found = config.find(({ coordinate_id: id }) => id === coordinateId);
    if (!found) throw runtimeError(RUNTIME, "UNKNOWN_COORDINATE", `Unknown Cosmic coordinate ${coordinateId}`);
    return found;
  };
  const getSnapshot = () => snapshot({
    runtime: "COSMIC_COORDINATE_ALPHA",
    data_driven: true,
    real_navigation: false,
    map_current_modified: false,
    coordinates: config.map((entry) => ({ ...entry, discovery_status: state.discoveries[entry.coordinate_id] ? "DISCOVERED" : "UNDISCOVERED" })),
    discovery_history: state.discovery_history,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function discover(coordinateId) {
    usable();
    const entry = coordinate(coordinateId);
    if (state.discoveries[coordinateId]) return getSnapshot();
    if (!technologyRuntime.isUnlocked(entry.required_technology)) throw runtimeError(RUNTIME, "COORDINATE_DISCOVERY_BLOCKED", `${coordinateId} requires ${entry.required_technology}`);
    state.revision += 1;
    state.discoveries[coordinateId] = true;
    boundedPush(state.discovery_history, {
      discovery_id: stableId("coordinate-discovery", state.revision),
      coordinate_id: coordinateId,
      source_class: entry.source_class,
      ownership_granted: false,
      sovereignty_granted: false,
      evidence_status: "VERIFIED",
      review_status: "REVIEWED_SYNTHETIC"
    }, 80);
    persist();
    notifier.emit("COSMIC_COORDINATE_DISCOVERED", { coordinate_id: coordinateId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (config.some(({ coordinate_type: type }) => !COSMIC_COORDINATE_TYPES.includes(type))) issues.push("unknown coordinate type");
    if (config.some((entry) => entry.source_class === "CURRENT_REFERENCE" && !entry.canonical_reference)) issues.push("CURRENT reference lacks canonical evidence");
    if (state.discovery_history.some(({ ownership_granted: ownership, sovereignty_granted: sovereignty }) => ownership !== false || sovereignty !== false)) issues.push("discovery granted ownership or sovereignty");
    return snapshot({ ok: issues.length === 0, runtime: "COSMIC_COORDINATE_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    discover,
    isDiscovered: (coordinateId) => {
      coordinate(coordinateId);
      return state.discoveries[coordinateId] === true;
    },
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
