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

const RUNTIME = "TechnologyTreeRuntime";
export const TECHNOLOGY_AGE_IDS = Object.freeze([
  "STONE_AGE", "BRONZE_AGE", "IRON_AGE", "INDUSTRIAL_AGE", "ELECTRICAL_AGE",
  "COMPUTER_AGE", "AI_AGE", "QUANTUM_AGE", "ANTI_GRAVITY_AGE", "WARP_AGE",
  "TIMELINE_AGE", "INTERSTELLAR_AGE", "DIMENSIONAL_AGE", "MULTIVERSE_AGE"
]);

export function createTechnologyTreeRuntime({
  config,
  researchRuntime,
  materialRuntime,
  energyRuntime,
  civilizationProvider,
  storage,
  storageKey = "kaios.world-viewer.technology-tree.v1"
} = {}) {
  if (JSON.stringify(config?.map(({ age_id: id }) => id)) !== JSON.stringify(TECHNOLOGY_AGE_IDS)) {
    throw new TypeError("Technology Tree Runtime requires the approved fourteen-age catalog");
  }
  if (!researchRuntime || !materialRuntime || !energyRuntime || typeof civilizationProvider !== "function") {
    throw new TypeError("Technology Tree Runtime requires research, material, energy, and Civilization providers");
  }
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    unlocked: Object.fromEntries(config.map((node) => [node.technology_id, node.initially_unlocked === true])),
    unlock_history: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, unlocked: { ...state.unlocked, ...restored.state.unlocked }, unlock_history: restored.state.unlock_history?.slice(-80) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Technology Tree Runtime has been destroyed");
  };
  const findNode = (technologyId) => {
    const node = config.find(({ technology_id: id }) => id === technologyId);
    if (!node) throw runtimeError(RUNTIME, "UNKNOWN_TECHNOLOGY", `Unknown technology ${technologyId}`);
    return node;
  };

  function readiness(node) {
    const research = researchRuntime.getSnapshot();
    const civilization = civilizationProvider() ?? {};
    const checks = [
      { check_id: "DEPENDENCIES", pass: node.dependencies.every((id) => state.unlocked[id] === true), evidence: node.dependencies.join(", ") || "ROOT" },
      { check_id: "RESEARCH", pass: researchRuntime.progress(node.technology_id) >= node.required_research_points, evidence: `${researchRuntime.progress(node.technology_id)} / ${node.required_research_points}` },
      { check_id: "KNOWLEDGE", pass: research.knowledge >= node.required_knowledge, evidence: `${research.knowledge} / ${node.required_knowledge}` },
      { check_id: "CIVILIZATION", pass: Number(civilization.score ?? 0) >= node.minimum_civilization_score, evidence: `${civilization.score ?? 0} / ${node.minimum_civilization_score}` },
      { check_id: "MATERIAL", pass: materialRuntime.has(node.material_costs), evidence: Object.keys(node.material_costs).join(", ") || "NONE" },
      { check_id: "ENERGY", pass: energyRuntime.has(node.energy_costs), evidence: Object.keys(node.energy_costs).join(", ") || "NONE" }
    ].map((check) => ({ ...check, status: check.pass ? "PASS" : "BLOCKED" }));
    return snapshot({ ready: checks.every(({ pass }) => pass), checks });
  }

  const getSnapshot = () => {
    const nodes = config.map((node) => ({
      ...node,
      unlocked: state.unlocked[node.technology_id] === true,
      readiness: readiness(node)
    }));
    const current = [...nodes].reverse().find(({ unlocked }) => unlocked) ?? nodes[0];
    return snapshot({
      runtime: "COSMIC_TECHNOLOGY_TREE_ALPHA",
      decision_id: "HUMAN-SPRINT-010-COSMIC-TECHNOLOGY",
      ages: TECHNOLOGY_AGE_IDS,
      nodes,
      current_age_id: current.age_id,
      current_technology_id: current.technology_id,
      unlocked_count: nodes.filter(({ unlocked }) => unlocked).length,
      unlock_history: state.unlock_history,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function unlock(technologyId) {
    usable();
    const node = findNode(technologyId);
    if (state.unlocked[technologyId]) return getSnapshot();
    const gate = readiness(node);
    if (!gate.ready) {
      const blockers = gate.checks.filter(({ pass }) => !pass).map(({ check_id: id }) => id);
      throw runtimeError(RUNTIME, "TECHNOLOGY_UNLOCK_BLOCKED", `${technologyId} blocked by ${blockers.join(", ")}`);
    }
    materialRuntime.consumeBundle(node.material_costs, `TECHNOLOGY_UNLOCK:${technologyId}`);
    energyRuntime.consumeBundle(node.energy_costs, `TECHNOLOGY_UNLOCK:${technologyId}`);
    state.revision += 1;
    state.unlocked[technologyId] = true;
    boundedPush(state.unlock_history, {
      unlock_id: stableId("technology-unlock", state.revision),
      technology_id: technologyId,
      age_id: node.age_id,
      evidence_status: "VERIFIED",
      review_status: "REVIEWED_SYNTHETIC"
    }, 80);
    persist();
    notifier.emit("TECHNOLOGY_UNLOCKED", { technology_id: technologyId, age_id: node.age_id });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const nodes = getSnapshot().nodes;
    if (nodes.length !== 14 || JSON.stringify(nodes.map(({ age_id: id }) => id)) !== JSON.stringify(TECHNOLOGY_AGE_IDS)) issues.push("technology age catalog changed");
    for (const node of config) {
      if (state.unlocked[node.technology_id] && node.dependencies.some((id) => !state.unlocked[id])) issues.push(`${node.technology_id} bypassed a dependency`);
    }
    if (!state.unlocked.STONE_FOUNDATIONS) issues.push("root technology is locked");
    return snapshot({ ok: issues.length === 0, runtime: "COSMIC_TECHNOLOGY_TREE_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    unlock,
    isUnlocked: (technologyId) => {
      findNode(technologyId);
      return state.unlocked[technologyId] === true;
    },
    readinessFor: (technologyId) => readiness(findNode(technologyId)),
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
