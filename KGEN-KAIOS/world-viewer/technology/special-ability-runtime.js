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

const RUNTIME = "SpecialAbilityRuntime";
export const SPECIAL_ABILITY_IDS = Object.freeze([
  "TRANSFORMATIONS_72", "TRANSFORMATIONS_108", "THIRD_EYE", "CLONE", "INVISIBILITY",
  "AVATAR", "MIND_COMMUNICATION", "TIMELINE_NAVIGATION", "REALITY_MAPPING"
]);

export function createSpecialAbilityRuntime({ config, technologyRuntime, storage, storageKey = "kaios.world-viewer.special-ability.v1" } = {}) {
  if (JSON.stringify(config?.map(({ ability_id: id }) => id)) !== JSON.stringify(SPECIAL_ABILITY_IDS)) throw new TypeError("Special Ability Runtime requires the approved nine-ability catalog");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    training: Object.fromEntries(SPECIAL_ABILITY_IDS.map((id) => [id, 0])),
    unlocked: Object.fromEntries(SPECIAL_ABILITY_IDS.map((id) => [id, false])),
    proposals: [],
    evidence: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, training: { ...state.training, ...restored.state.training }, unlocked: { ...state.unlocked, ...restored.state.unlocked }, proposals: restored.state.proposals?.slice(-60) ?? [], evidence: restored.state.evidence?.slice(-120) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Special Ability Runtime has been destroyed");
  };
  const ability = (abilityId) => {
    const found = config.find(({ ability_id: id }) => id === abilityId);
    if (!found) throw runtimeError(RUNTIME, "UNKNOWN_ABILITY", `Unknown special ability ${abilityId}`);
    return found;
  };
  const getSnapshot = () => snapshot({
    runtime: "SPECIAL_ABILITY_ALPHA",
    simulation_only: true,
    external_system_access: false,
    abilities: config.map((entry) => ({ ...entry, training: state.training[entry.ability_id], unlocked: state.unlocked[entry.ability_id], status: state.unlocked[entry.ability_id] ? "UNLOCKED_SYNTHETIC" : "LOCKED" })),
    capability_aliases: {
      AI_NAVIGATION: technologyRuntime.isUnlocked("AI_NAVIGATION") && state.unlocked.TIMELINE_NAVIGATION,
      SHAPE_SHIFT_CAPABILITY: state.unlocked.TRANSFORMATIONS_72
    },
    proposals: state.proposals,
    evidence: state.evidence,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function train(abilityId, amount = 25) {
    usable();
    const profile = ability(abilityId);
    const points = Number(amount);
    if (!Number.isFinite(points) || points <= 0 || points > profile.required_training) throw runtimeError(RUNTIME, "INVALID_ABILITY_TRAINING", "Ability training is outside the bounded range");
    state.revision += 1;
    state.training[abilityId] = Math.min(profile.required_training, state.training[abilityId] + points);
    boundedPush(state.evidence, {
      evidence_id: stableId("ability-evidence", state.revision),
      ability_id: abilityId,
      points,
      review_status: "REVIEWED_SYNTHETIC"
    }, 120);
    if (state.training[abilityId] >= profile.required_training && technologyRuntime.isUnlocked(profile.required_technology)) {
      if (profile.sandbox_proposal_only) {
        if (!state.proposals.some(({ ability_id: id }) => id === abilityId)) boundedPush(state.proposals, {
          proposal_id: stableId("ability-proposal", state.revision),
          ability_id: abilityId,
          status: "SANDBOX_REVIEW_REQUIRED",
          execution: false
        }, 60);
      } else {
        state.unlocked[abilityId] = true;
      }
    }
    persist();
    notifier.emit("SPECIAL_ABILITY_TRAINED", { ability_id: abilityId, points });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (Object.values(state.training).some((value) => value < 0 || value > 100)) issues.push("ability training outside bounds");
    if (state.unlocked.CLONE) issues.push("Clone ability executed instead of creating a sandbox proposal");
    if (state.proposals.some(({ execution }) => execution !== false)) issues.push("ability proposal crossed execution boundary");
    return snapshot({ ok: issues.length === 0, runtime: "SPECIAL_ABILITY_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    train,
    isUnlocked: (abilityId) => {
      ability(abilityId);
      return state.unlocked[abilityId] === true;
    },
    capabilityReady: (capabilityId) => getSnapshot().capability_aliases[capabilityId] === true,
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
