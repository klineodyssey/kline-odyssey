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

const RUNTIME = "CosmicVehicleRuntime";
export const COSMIC_VEHICLE_IDS = Object.freeze([
  "HORSE", "SHIP", "AIRCRAFT", "ROCKET", "SPACECRAFT", "GOLDEN_CLOUD",
  "POCKET_TIME_CLOAKED_UFO", "WARP_SHIP", "TIMELINE_VEHICLE"
]);

export function createCosmicVehicleRuntime({ config, technologyRuntime, materialRuntime, energyRuntime, civilizationProvider, storage, storageKey = "kaios.world-viewer.cosmic-vehicle.v1" } = {}) {
  if (JSON.stringify(config?.map(({ vehicle_id: id }) => id)) !== JSON.stringify(COSMIC_VEHICLE_IDS)) throw new TypeError("Cosmic Vehicle Runtime requires the approved nine-vehicle catalog");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, fleet: [], build_history: [] };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, fleet: restored.state.fleet?.slice(-60) ?? [], build_history: restored.state.build_history?.slice(-80) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Cosmic Vehicle Runtime has been destroyed");
  };
  const blueprint = (vehicleId) => {
    const found = config.find(({ vehicle_id: id }) => id === vehicleId);
    if (!found) throw runtimeError(RUNTIME, "UNKNOWN_VEHICLE", `Unknown vehicle ${vehicleId}`);
    return found;
  };

  function readiness(entry) {
    const civilization = civilizationProvider() ?? {};
    const checks = [
      { check_id: "TECHNOLOGY", pass: technologyRuntime.isUnlocked(entry.required_technology) },
      { check_id: "MATERIAL", pass: materialRuntime.has(entry.material_costs) },
      { check_id: "ENERGY", pass: energyRuntime.has(entry.energy_costs) },
      { check_id: "CIVILIZATION", pass: Number(civilization.score ?? 0) >= 20 },
      { check_id: "EVIDENCE", pass: true },
      { check_id: "REVIEW", pass: true }
    ].map((check) => ({ ...check, status: check.pass ? "PASS" : "BLOCKED" }));
    return snapshot({ ready: checks.every(({ pass }) => pass), checks });
  }

  const getSnapshot = () => snapshot({
    runtime: "COSMIC_VEHICLE_ALPHA",
    simulation_only: true,
    real_vehicle_design: false,
    blueprints: config.map((entry) => ({ ...entry, readiness: readiness(entry) })),
    fleet: state.fleet,
    build_history: state.build_history,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function build(vehicleId) {
    usable();
    const entry = blueprint(vehicleId);
    if (entry.external_timeline_runtime) throw runtimeError(RUNTIME, "TIMELINE_RUNTIME_REQUIRED", "Pocket Time Cloaked UFO construction belongs to Timeline Runtime V2");
    if (entry.research_archetype_only) throw runtimeError(RUNTIME, "NON_EXECUTABLE_ARCHETYPE", "Generic Timeline Vehicle is a research archetype only");
    const gate = readiness(entry);
    if (!gate.ready) throw runtimeError(RUNTIME, "VEHICLE_BUILD_BLOCKED", `${vehicleId} build gates are incomplete`);
    materialRuntime.consumeBundle(entry.material_costs, `VEHICLE_BUILD:${vehicleId}`);
    energyRuntime.consumeBundle(entry.energy_costs, `VEHICLE_BUILD:${vehicleId}`);
    state.revision += 1;
    const vehicle = {
      fleet_vehicle_id: stableId(`vehicle-${vehicleId.toLowerCase()}`, state.revision),
      vehicle_id: vehicleId,
      status: "BUILT_SYNTHETIC",
      real_vehicle: false,
      timeline_authority: false,
      evidence_status: "VERIFIED",
      review_status: "REVIEWED_SYNTHETIC"
    };
    boundedPush(state.fleet, vehicle, 60);
    boundedPush(state.build_history, { ...vehicle, build_id: stableId("vehicle-build", state.revision) }, 80);
    persist();
    notifier.emit("COSMIC_VEHICLE_BUILT", { vehicle_id: vehicleId, fleet_vehicle_id: vehicle.fleet_vehicle_id });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (state.fleet.some(({ vehicle_id: id, timeline_authority: authority }) => id === "TIMELINE_VEHICLE" || authority !== false)) issues.push("fleet crossed Timeline authority boundary");
    if (state.fleet.length > 60 || state.build_history.length > 80) issues.push("vehicle history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "COSMIC_VEHICLE_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    build,
    readinessFor: (vehicleId) => readiness(blueprint(vehicleId)),
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
