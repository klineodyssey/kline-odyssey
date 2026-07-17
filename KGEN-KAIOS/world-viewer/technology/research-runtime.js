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

const RUNTIME = "CosmicResearchRuntime";

export function createCosmicResearchRuntime({ config, technologyIds, storage, storageKey = "kaios.world-viewer.cosmic-research.v1" } = {}) {
  if (!config || !Array.isArray(technologyIds) || technologyIds.length !== 14) throw new TypeError("Cosmic Research Runtime requires the fourteen-node tree");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = {
    revision: 0,
    research_points: Object.fromEntries(technologyIds.map((id) => [id, Number(config.initial_research_points ?? 0)])),
    knowledge: Number(config.initial_knowledge ?? 0),
    civilization_experience: Number(config.initial_civilization_experience ?? 0),
    evidence: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state, research_points: { ...state.research_points, ...restored.state.research_points }, evidence: restored.state.evidence?.slice(-160) ?? [] };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Cosmic Research Runtime has been destroyed");
  };
  const getSnapshot = () => snapshot({
    runtime: "COSMIC_RESEARCH_ALPHA",
    facilities: config.facilities,
    roles: config.roles,
    repositories: config.repositories,
    research_points: state.research_points,
    knowledge: state.knowledge,
    civilization_experience: state.civilization_experience,
    evidence: state.evidence,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function contribute(technologyId, points = 25, knowledge = 20, civilizationExperience = 10) {
    usable();
    if (!technologyIds.includes(technologyId)) throw runtimeError(RUNTIME, "UNKNOWN_TECHNOLOGY", `Unknown technology ${technologyId}`);
    const amount = Number(points);
    const knowledgeAmount = Number(knowledge);
    const experienceAmount = Number(civilizationExperience);
    if (![amount, knowledgeAmount, experienceAmount].every((value) => Number.isFinite(value) && value >= 0) || amount <= 0 || amount > 100) {
      throw runtimeError(RUNTIME, "INVALID_RESEARCH_CONTRIBUTION", "Research contribution is outside the bounded range");
    }
    state.revision += 1;
    state.research_points[technologyId] = Math.min(1000, state.research_points[technologyId] + amount);
    state.knowledge = Math.min(10000, state.knowledge + knowledgeAmount);
    state.civilization_experience = Math.min(10000, state.civilization_experience + experienceAmount);
    boundedPush(state.evidence, {
      evidence_id: stableId("cosmic-research-evidence", state.revision),
      technology_id: technologyId,
      research_points: amount,
      knowledge: knowledgeAmount,
      civilization_experience: experienceAmount,
      review_status: "REVIEWED_SYNTHETIC"
    }, 160);
    persist();
    notifier.emit("COSMIC_RESEARCH_CONTRIBUTED", { technology_id: technologyId, points: amount });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (Object.keys(state.research_points).length !== 14) issues.push("technology research ledger is incomplete");
    if (Object.values(state.research_points).some((value) => value < 0 || value > 1000)) issues.push("research points are outside bounds");
    if (state.knowledge < 0 || state.civilization_experience < 0) issues.push("research totals became negative");
    if (state.evidence.length > 160) issues.push("research evidence limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "COSMIC_RESEARCH_ALPHA", issues });
  }

  return Object.freeze({
    getSnapshot,
    contribute,
    progress: (technologyId) => Number(state.research_points[technologyId] ?? 0),
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
