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

const RUNTIME = "SpaceExplorationRuntime";
export const SPACE_EXPLORATION_ACTIVITY_IDS = Object.freeze([
  "PLANET_DISCOVERY", "SPACE_ROUTE", "RESOURCE_SURVEY", "COLONY_PLANNING", "DEEP_SPACE_MISSION"
]);

export function createSpaceExplorationRuntime({ config, technologyRuntime, coordinateRuntime, vehicleRuntime, energyRuntime, storage, storageKey = "kaios.world-viewer.space-exploration.v1" } = {}) {
  if (JSON.stringify(config?.map(({ activity_id: id }) => id)) !== JSON.stringify(SPACE_EXPLORATION_ACTIVITY_IDS)) throw new TypeError("Space Exploration Runtime requires the approved five-activity catalog");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, missions: [], proposals: [] };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, missions: restored.state.missions?.slice(-80) ?? [], proposals: restored.state.proposals?.slice(-60) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Space Exploration Runtime has been destroyed");
  };
  const activity = (activityId) => {
    const found = config.find(({ activity_id: id }) => id === activityId);
    if (!found) throw runtimeError(RUNTIME, "UNKNOWN_EXPLORATION_ACTIVITY", `Unknown exploration activity ${activityId}`);
    return found;
  };
  const getSnapshot = () => snapshot({
    runtime: "SPACE_EXPLORATION_ALPHA",
    simulation_only: true,
    real_navigation: false,
    activities: config,
    missions: state.missions,
    proposals: state.proposals,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function launch(activityId, coordinateId) {
    usable();
    const entry = activity(activityId);
    if (!technologyRuntime.isUnlocked(entry.required_technology)) throw runtimeError(RUNTIME, "EXPLORATION_TECHNOLOGY_REQUIRED", `${activityId} requires ${entry.required_technology}`);
    if (!coordinateRuntime.isDiscovered(coordinateId)) throw runtimeError(RUNTIME, "EXPLORATION_COORDINATE_REQUIRED", `${coordinateId} must be discovered first`);
    const fleetReady = vehicleRuntime.getSnapshot().fleet.length > 0 || activityId === "RESOURCE_SURVEY";
    if (!fleetReady) throw runtimeError(RUNTIME, "EXPLORATION_VEHICLE_REQUIRED", `${activityId} requires a synthetic fleet vehicle`);
    if (!energyRuntime.has({ [entry.energy_id]: entry.energy_cost })) throw runtimeError(RUNTIME, "EXPLORATION_ENERGY_REQUIRED", `${activityId} requires ${entry.energy_id}`);
    energyRuntime.consume(entry.energy_id, entry.energy_cost, `EXPLORATION:${activityId}`);
    state.revision += 1;
    const mission = {
      mission_id: stableId("space-mission", state.revision),
      activity_id: activityId,
      coordinate_id: coordinateId,
      status: entry.proposal_only ? "PROPOSAL_REVIEW_REQUIRED" : "COMPLETE_SYNTHETIC",
      evidence_status: "VERIFIED",
      review_status: "REVIEWED_SYNTHETIC",
      ownership_granted: false,
      sovereignty_granted: false,
      resource_title_granted: false,
      real_navigation: false
    };
    boundedPush(state.missions, mission, 80);
    if (entry.proposal_only) boundedPush(state.proposals, { ...mission, proposal_id: stableId("colony-proposal", state.revision), executable: false }, 60);
    persist();
    notifier.emit("SPACE_EXPLORATION_RECORDED", { mission_id: mission.mission_id, activity_id: activityId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (state.missions.some(({ ownership_granted: ownership, sovereignty_granted: sovereignty, resource_title_granted: resources, real_navigation: navigation }) => ownership !== false || sovereignty !== false || resources !== false || navigation !== false)) issues.push("exploration crossed authority boundary");
    if (state.proposals.some(({ executable }) => executable !== false)) issues.push("colony proposal became executable");
    return snapshot({ ok: issues.length === 0, runtime: "SPACE_EXPLORATION_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    launch,
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
