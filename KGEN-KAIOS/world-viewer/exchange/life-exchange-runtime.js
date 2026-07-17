import {
  boundedPush,
  clone,
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot,
  stableId
} from "../civilization/runtime-utils.js";

const RUNTIME = "LifeExchangeRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 120;
const REVIEW_STATES = new Set(["CANDIDATE_REVIEW_REQUIRED", "REVIEW_REQUESTED", "HELD", "APPROVED_NOT_LISTED"]);

function initialState(config) {
  return {
    revision: 0,
    candidates: clone(config.candidates),
    events: []
  };
}

export function createLifeExchangeRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.life-exchange.v1"
} = {}) {
  if (!config?.exchange_id || !Array.isArray(config?.candidates)) {
    throw new TypeError("Life Exchange Runtime requires K11520 candidate fixture data");
  }
  const storageRef = resolveStorage(storage);
  const defaults = initialState(config);
  let state = defaults;
  let destroyed = false;
  const saved = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && Array.isArray(value?.state?.candidates));
  if (saved) {
    const candidates = new Map(saved.state.candidates.map((candidate) => [candidate.candidate_id, candidate]));
    state = {
      ...defaults,
      ...saved.state,
      candidates: defaults.candidates.map((candidate) => ({ ...candidate, ...(candidates.get(candidate.candidate_id) ?? {}) })),
      events: Array.isArray(saved.state.events) ? saved.state.events.slice(-MAX_EVENTS) : []
    };
  }

  const getSnapshot = () => snapshot({
    runtime: "K11520_LIFE_EXCHANGE_ALPHA",
    schema_version: SCHEMA_VERSION,
    exchange_id: config.exchange_id,
    label: config.label,
    synthetic: true,
    real_trade: false,
    legal_securities: false,
    automatic_listing: false,
    candidate_types: config.candidate_types,
    rights_types: config.rights_types,
    candidates: state.candidates,
    listed_count: 0,
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Life Exchange Runtime has been destroyed");
  };

  function requestReview(candidateId) {
    usable();
    const candidate = state.candidates.find((item) => item.candidate_id === candidateId);
    if (!candidate) throw runtimeError(RUNTIME, "CANDIDATE_NOT_FOUND", `Unknown K11520 candidate ${candidateId}`);
    if (candidate.review_status === "REVIEW_REQUESTED") return getSnapshot();
    if (candidate.review_status !== "CANDIDATE_REVIEW_REQUIRED") {
      throw runtimeError(RUNTIME, "LISTING_REVIEW_REQUIRED", `${candidateId} cannot advance from ${candidate.review_status}`);
    }
    candidate.review_status = "REVIEW_REQUESTED";
    state.revision += 1;
    boundedPush(state.events, {
      event_id: stableId("exchange", state.revision),
      type: "LISTING_REVIEW_REQUESTED",
      candidate_id: candidateId,
      no_trade_executed: true
    }, MAX_EVENTS);
    persist();
    notifier.emit("LISTING_REVIEW_REQUESTED", { candidate_id: candidateId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const ids = new Set();
    for (const candidate of state.candidates) {
      if (ids.has(candidate.candidate_id)) issues.push(`${candidate.candidate_id}: duplicate candidate`);
      ids.add(candidate.candidate_id);
      if (!config.candidate_types.includes(candidate.asset_type)) issues.push(`${candidate.candidate_id}: unsupported asset type`);
      if (!candidate.rights_offered?.every((right) => config.rights_types.includes(right))) issues.push(`${candidate.candidate_id}: unsupported right`);
      if (!REVIEW_STATES.has(candidate.review_status)) issues.push(`${candidate.candidate_id}: invalid review status`);
    }
    if (getSnapshot().listed_count !== 0) issues.push("automatic listing is forbidden");
    if (state.events.length > MAX_EVENTS) issues.push("event limit exceeded");
    return snapshot({
      ok: issues.length === 0,
      runtime: "K11520_LIFE_EXCHANGE_ALPHA",
      candidate_count: state.candidates.length,
      listed_count: 0,
      issues
    });
  }

  return Object.freeze({
    getSnapshot,
    requestReview,
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
