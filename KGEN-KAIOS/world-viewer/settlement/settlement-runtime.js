import { ECONOMY_ACCOUNT_IDS } from "../economy/economy-runtime.js";
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

const RUNTIME = "SettlementRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_RECORDS = 140;
const EXTERNAL_ASSETS = Object.freeze(["USDT", "TWD", "OTHER_FIAT"]);

function initialState() {
  return {
    revision: 0,
    obligations: [],
    asset_requests: [],
    mortgage_proposals: [],
    insurance_proposals: [],
    events: []
  };
}

function cleanState(candidate, fallback) {
  if (!candidate || typeof candidate !== "object") return fallback;
  return {
    ...fallback,
    ...candidate,
    obligations: Array.isArray(candidate.obligations) ? candidate.obligations.slice(-MAX_RECORDS).map((item) => ({ ...item })) : [],
    asset_requests: Array.isArray(candidate.asset_requests) ? candidate.asset_requests.slice(-MAX_RECORDS).map((item) => ({ ...item })) : [],
    mortgage_proposals: Array.isArray(candidate.mortgage_proposals) ? candidate.mortgage_proposals.slice(-80).map((item) => ({ ...item })) : [],
    insurance_proposals: Array.isArray(candidate.insurance_proposals) ? candidate.insurance_proposals.slice(-80).map((item) => ({ ...item })) : [],
    events: Array.isArray(candidate.events) ? candidate.events.slice(-MAX_RECORDS).map((item) => ({ ...item })) : []
  };
}

export function createSettlementRuntime({
  economyRuntime,
  populationRuntime,
  playerId = "mock-player-001",
  playerLifeId = "life-player-001",
  storage,
  storageKey = "kaios.world-viewer.settlement.v1"
} = {}) {
  if (!economyRuntime || !populationRuntime) throw runtimeError(RUNTIME, "DEPENDENCY_REQUIRED", "Settlement Runtime requires Economy and Population runtimes");
  const storageRef = resolveStorage(storage);
  const defaults = initialState();
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  let state = cleanState(restored?.state, defaults);
  let destroyed = false;

  const getSnapshot = () => snapshot({
    runtime: "SETTLEMENT_ECONOMY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    executable_currency: "KAIOS_CREDIT",
    bootstrap_reference: {
      pair: "KGEN/KAIOS_CREDIT",
      rate: 1,
      status: "REFERENCE_ONLY",
      permanent_peg: false,
      guaranteed_return: false,
      governance_adjustable: true
    },
    official_boundaries: {
      KGEN: "REQUEST_ONLY_NO_CHAIN_CONNECTION",
      external_assets: "REQUEST_ONLY_NO_FIAT_CONNECTION",
      kgen_tax: "0.30% UNCHANGED"
    },
    obligations: state.obligations,
    asset_requests: state.asset_requests,
    mortgage_proposals: state.mortgage_proposals,
    insurance_proposals: state.insurance_proposals,
    revision: state.revision,
    events: state.events
  });
  const notifier = createNotifier(getSnapshot);
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Settlement Runtime has been destroyed");
  };

  function record(type, details = {}) {
    state.revision += 1;
    return boundedPush(state.events, { event_id: stableId("settlement", state.revision), type, ...details, synthetic: true }, MAX_RECORDS);
  }

  function obligation(type, amount, from, to, ledgerEntryId) {
    const item = {
      obligation_id: stableId("obligation", state.revision + 1),
      type,
      amount: Number(amount),
      currency: "KAIOS_CREDIT",
      from,
      to,
      ledger_entry_id: ledgerEntryId,
      status: "SETTLED",
      synthetic: true
    };
    boundedPush(state.obligations, item, MAX_RECORDS);
    return item;
  }

  function settleCredit({ type, from, to, amount, reason }) {
    const result = economyRuntime.transfer({ from, to, amount, reason, category: type });
    return obligation(type, amount, from, to, result.entry.entry_id);
  }

  function runLivingCycle({ salary = 24, tax = 2, rent = 4 } = {}) {
    usable();
    const values = [salary, tax, rent].map(Number);
    if (values.some((value) => !Number.isFinite(value) || value < 0) || values[0] <= values[1] + values[2]) {
      throw runtimeError(RUNTIME, "INVALID_LIVING_CYCLE", "Salary must remain positive after bounded tax and rent");
    }
    const entries = [];
    entries.push(settleCredit({ type: "SALARY", from: ECONOMY_ACCOUNT_IDS.EMPLOYER, to: playerId, amount: values[0], reason: "SETTLEMENT_EMPLOYMENT" }));
    if (values[1] > 0) entries.push(settleCredit({ type: "TAX", from: playerId, to: ECONOMY_ACCOUNT_IDS.GOVERNMENT, amount: values[1], reason: "SETTLEMENT_TAX" }));
    if (values[2] > 0) entries.push(settleCredit({ type: "RENT", from: playerId, to: ECONOMY_ACCOUNT_IDS.LANDLORD, amount: values[2], reason: "SETTLEMENT_RENT" }));
    record("LIVING_CYCLE_SETTLED", { obligation_ids: entries.map(({ obligation_id }) => obligation_id), net_income: values[0] - values[1] - values[2] });
    persist();
    notifier.emit("LIVING_CYCLE_SETTLED", { count: entries.length });
    return getSnapshot();
  }

  function requestAssetSettlement({ asset, direction = "KGEN_TO_CREDIT", amount, requesterId = playerId } = {}) {
    usable();
    const assetId = String(asset ?? "").toUpperCase();
    const value = Number(amount);
    if (assetId !== "KGEN" && !EXTERNAL_ASSETS.includes(assetId)) throw runtimeError(RUNTIME, "ASSET_NOT_SUPPORTED", "Only KGEN or approved external settlement assets may be requested");
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) throw runtimeError(RUNTIME, "INVALID_AMOUNT", "Settlement request amount is invalid");
    const request = {
      request_id: stableId("asset-settlement", state.revision + 1),
      requester_id: requesterId,
      asset: assetId,
      direction: String(direction),
      amount: value,
      reference_credit_amount: assetId === "KGEN" ? value : null,
      reference_rate: assetId === "KGEN" ? 1 : null,
      reference_only: true,
      status: "PENDING_OFFICIAL_SETTLEMENT",
      executable: false,
      balance_mutation: false,
      requires_governance: true,
      synthetic: true
    };
    boundedPush(state.asset_requests, request, MAX_RECORDS);
    record("ASSET_SETTLEMENT_REQUESTED", { request_id: request.request_id, asset: assetId });
    persist();
    notifier.emit("ASSET_SETTLEMENT_REQUESTED", { request_id: request.request_id });
    return snapshot(request);
  }

  function requestMortgage({ parcelId = "parcel-starter-001", principal = 120, termMonths = 12 } = {}) {
    usable();
    const proposal = {
      proposal_id: stableId("mortgage", state.revision + 1),
      parcel_id: String(parcelId),
      principal: Number(principal),
      currency: "KAIOS_CREDIT",
      term_months: Number(termMonths),
      status: "ARCHITECTURE_ONLY_REVIEW_REQUIRED",
      creates_debt: false,
      executable: false,
      synthetic: true
    };
    boundedPush(state.mortgage_proposals, proposal, 80);
    record("MORTGAGE_PROPOSAL_CREATED", { proposal_id: proposal.proposal_id });
    persist();
    notifier.emit("MORTGAGE_PROPOSAL_CREATED", { proposal_id: proposal.proposal_id });
    return snapshot(proposal);
  }

  function requestInsurance({ subjectId = playerLifeId, coverage = "LIFE_OS_RECOVERY" } = {}) {
    usable();
    const proposal = {
      proposal_id: stableId("insurance", state.revision + 1),
      subject_id: String(subjectId),
      coverage: String(coverage),
      status: "ARCHITECTURE_ONLY_REVIEW_REQUIRED",
      creates_policy: false,
      executable: false,
      synthetic: true
    };
    boundedPush(state.insurance_proposals, proposal, 80);
    record("INSURANCE_PROPOSAL_CREATED", { proposal_id: proposal.proposal_id });
    persist();
    notifier.emit("INSURANCE_PROPOSAL_CREATED", { proposal_id: proposal.proposal_id });
    return snapshot(proposal);
  }

  function settleInheritance({ estateCitizenId = "citizen-ancestor-001", beneficiaryId = playerLifeId, amount = 20 } = {}) {
    usable();
    const population = populationRuntime.getSnapshot();
    const estate = population.citizens.find(({ citizen_id: id }) => id === String(estateCitizenId));
    const beneficiary = population.citizens.find(({ citizen_id: id }) => id === String(beneficiaryId));
    if (!estate || estate.lifecycle_state !== "DECEASED") throw runtimeError(RUNTIME, "ESTATE_NOT_ELIGIBLE", "Inheritance requires a deceased registered citizen");
    if (estate.inheritance_status === "SETTLED") throw runtimeError(RUNTIME, "INHERITANCE_ALREADY_SETTLED", "Estate inheritance is already settled");
    if (!beneficiary || beneficiary.lifecycle_state !== "ALIVE") throw runtimeError(RUNTIME, "BENEFICIARY_NOT_ELIGIBLE", "Beneficiary must be a living registered citizen");
    const recordId = stableId("inheritance", state.revision + 1);
    const transfer = economyRuntime.transfer({
      from: ECONOMY_ACCOUNT_IDS.ESTATE,
      to: playerId,
      amount,
      reason: `INHERITANCE:${estateCitizenId}`,
      category: "INHERITANCE"
    });
    populationRuntime.recordInheritance({ recordId, estateCitizenId, beneficiaryId, amount, ledgerEntryId: transfer.entry.entry_id });
    obligation("INHERITANCE", amount, ECONOMY_ACCOUNT_IDS.ESTATE, playerId, transfer.entry.entry_id);
    record("INHERITANCE_SETTLED", { record_id: recordId, estate_citizen_id: estateCitizenId, beneficiary_id: beneficiaryId, amount: Number(amount) });
    persist();
    notifier.emit("INHERITANCE_SETTLED", { record_id: recordId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    for (const obligationItem of state.obligations) {
      if (obligationItem.currency !== "KAIOS_CREDIT" || obligationItem.status !== "SETTLED") issues.push(`${obligationItem.obligation_id}: invalid credit obligation`);
      if (!obligationItem.ledger_entry_id) issues.push(`${obligationItem.obligation_id}: missing ledger evidence`);
    }
    for (const request of state.asset_requests) {
      if (request.status !== "PENDING_OFFICIAL_SETTLEMENT" || request.executable !== false || request.balance_mutation !== false) issues.push(`${request.request_id}: official settlement gate bypassed`);
    }
    if (state.asset_requests.length > MAX_RECORDS || state.events.length > MAX_RECORDS) issues.push("settlement history exceeded limit");
    const dependencies = [economyRuntime.integrityReport(), populationRuntime.integrityReport()];
    for (const report of dependencies) if (!report.ok) issues.push(`${report.runtime}: dependency integrity failed`);
    return snapshot({ ok: issues.length === 0, runtime: "SETTLEMENT_ECONOMY_ALPHA", obligations: state.obligations.length, pending_official_requests: state.asset_requests.length, issues });
  }

  return Object.freeze({
    getSnapshot,
    runLivingCycle,
    requestAssetSettlement,
    requestMortgage,
    requestInsurance,
    settleInheritance,
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
