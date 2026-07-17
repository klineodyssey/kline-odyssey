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

const RUNTIME = "DiplomacyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_AGREEMENTS = 120;
const MAX_AUDIT = 160;

export const DIPLOMACY_TYPES = Object.freeze([
  "ALLIANCE",
  "TRADE_AGREEMENT",
  "EMBASSY",
  "VISA",
  "PEACE_TREATY",
  "SANCTION"
]);

function validateConfig(config) {
  if (!config || JSON.stringify(config.agreement_types) !== JSON.stringify(DIPLOMACY_TYPES)) {
    throw new TypeError("Diplomacy Runtime requires the approved six agreement types");
  }
}

export function createDiplomacyRuntime({
  config,
  nationId,
  storage,
  storageKey = "kaios.world-viewer.diplomacy.v1"
} = {}) {
  validateConfig(config);
  if (!nationId) throw new TypeError("Diplomacy Runtime requires a Nation ID");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, agreements: [], audit_log: [] };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      agreements: restored.state.agreements?.slice(-MAX_AGREEMENTS) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Diplomacy Runtime has been destroyed");
  };

  const getSnapshot = () => snapshot({
    runtime: "NATION_DIPLOMACY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    real_world_authority: false,
    nation_id: nationId,
    agreement_types: DIPLOMACY_TYPES,
    agreements: state.agreements,
    active_agreements: state.agreements.filter(({ status }) => status === "ACTIVE_SYNTHETIC"),
    pending_review: state.agreements.filter(({ status }) => status === "PROPOSAL_REVIEW_REQUIRED"),
    audit_log: state.audit_log,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function record(type, details = {}) {
    boundedPush(state.audit_log, {
      audit_id: stableId("diplomacy-audit", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_AUDIT);
  }

  function propose({ type, counterpartyId, scope = "CIVILIZATION_SIMULATION" } = {}) {
    usable();
    if (!DIPLOMACY_TYPES.includes(type)) throw runtimeError(RUNTIME, "UNKNOWN_AGREEMENT", `Unknown diplomacy type ${type}`);
    if (!counterpartyId || counterpartyId === nationId) throw runtimeError(RUNTIME, "INVALID_COUNTERPARTY", "Diplomacy requires a distinct counterparty");
    state.revision += 1;
    const agreement = {
      agreement_id: stableId("diplomacy", state.revision),
      type,
      parties: [nationId, counterpartyId],
      scope,
      rights: config.templates[type]?.rights ?? [],
      obligations: config.templates[type]?.obligations ?? [],
      start_time: "AFTER_SYNTHETIC_APPROVAL",
      expiry: config.default_expiry,
      breach_rule: "EVIDENCE_REVIEW_AND_SAFE_HOLD",
      termination_rule: "MUTUAL_NOTICE_OR_GOVERNANCE_REVIEW",
      evidence: [{ evidence_id: stableId("diplomacy-evidence", state.revision), type: "SYNTHETIC_POLICY_STATEMENT" }],
      review: { required: true, status: "PENDING" },
      approval: "NOT_APPROVED",
      status: "PROPOSAL_REVIEW_REQUIRED",
      real_world_authority: false,
      land_ownership_change: false,
      military_execution: false
    };
    boundedPush(state.agreements, agreement, MAX_AGREEMENTS);
    record("DIPLOMACY_PROPOSED", { agreement_id: agreement.agreement_id, agreement_type: type });
    persist();
    notifier.emit("DIPLOMACY_PROPOSED", { agreement_id: agreement.agreement_id, type });
    return getSnapshot();
  }

  function review(agreementId, decision = "APPROVE") {
    usable();
    const agreement = state.agreements.find(({ agreement_id: id }) => id === agreementId);
    if (!agreement) throw runtimeError(RUNTIME, "UNKNOWN_AGREEMENT_ID", `Unknown agreement ${agreementId}`);
    if (agreement.status !== "PROPOSAL_REVIEW_REQUIRED") throw runtimeError(RUNTIME, "ALREADY_REVIEWED", `${agreementId} is no longer pending review`);
    if (!["APPROVE", "REJECT"].includes(decision)) throw runtimeError(RUNTIME, "INVALID_REVIEW", "Diplomacy review must APPROVE or REJECT");
    state.revision += 1;
    agreement.review = { required: true, status: decision === "APPROVE" ? "PASS_SYNTHETIC" : "REJECTED_SYNTHETIC" };
    agreement.approval = decision === "APPROVE" ? "SYNTHETIC_GOVERNANCE_APPROVED" : "REJECTED";
    agreement.status = decision === "APPROVE" ? "ACTIVE_SYNTHETIC" : "REJECTED_SYNTHETIC";
    agreement.review_id = stableId("diplomacy-review", state.revision);
    record("DIPLOMACY_REVIEWED", { agreement_id: agreementId, decision });
    persist();
    notifier.emit("DIPLOMACY_REVIEWED", { agreement_id: agreementId, decision });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    if (JSON.stringify(config.agreement_types) !== JSON.stringify(DIPLOMACY_TYPES)) issues.push("diplomacy type catalog changed");
    const ids = new Set();
    for (const agreement of state.agreements) {
      if (ids.has(agreement.agreement_id)) issues.push(`duplicate agreement ${agreement.agreement_id}`);
      ids.add(agreement.agreement_id);
      if (agreement.parties.length !== 2 || agreement.parties[0] === agreement.parties[1]) issues.push(`${agreement.agreement_id} has invalid parties`);
      if (agreement.real_world_authority !== false || agreement.land_ownership_change !== false || agreement.military_execution !== false) issues.push(`${agreement.agreement_id} crossed diplomacy safety boundary`);
    }
    if (state.agreements.length > MAX_AGREEMENTS || state.audit_log.length > MAX_AUDIT) issues.push("diplomacy history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "NATION_DIPLOMACY_ALPHA", issues, agreement_count: state.agreements.length });
  }

  return Object.freeze({
    getSnapshot,
    propose,
    review,
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
