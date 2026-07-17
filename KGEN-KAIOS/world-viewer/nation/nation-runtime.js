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
import { createDiplomacyRuntime } from "./diplomacy-runtime.js";
import { createPublicFinanceRuntime } from "./public-finance-runtime.js";
import { createResourceEconomyRuntime } from "./resource-economy-runtime.js";

const RUNTIME = "NationRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_EVENTS = 180;

export const GOVERNMENT_V2_POLICIES = Object.freeze([
  "TAX_POLICY",
  "BUDGET",
  "PUBLIC_SPENDING",
  "MILITARY",
  "DIPLOMACY",
  "IMMIGRATION",
  "TRADE_POLICY",
  "INFRASTRUCTURE",
  "EMERGENCY"
]);

function validateConfig(config) {
  if (!config?.nation || !config?.public_finance || !config?.resources || !config?.diplomacy) {
    throw new TypeError("Nation Runtime requires Nation, finance, resource and diplomacy configuration");
  }
  const policyIds = config.nation.government_policies?.map(({ policy_id: id }) => id);
  if (JSON.stringify(policyIds) !== JSON.stringify(GOVERNMENT_V2_POLICIES)) {
    throw runtimeError(RUNTIME, "INVALID_GOVERNMENT_V2", "Government V2 must contain the approved nine policies in order");
  }
}

export function createNationRuntime({
  world,
  populationRuntime,
  governmentRuntime,
  storage,
  storageKey = "kaios.world-viewer.nation.v1"
} = {}) {
  if (!world || !populationRuntime || !governmentRuntime) {
    throw new TypeError("Nation Runtime requires world, Population and Government runtimes");
  }
  const config = world.nation_timeline_alpha;
  validateConfig(config);
  const nationConfig = config.nation;
  const storageRef = resolveStorage(storage);
  const finance = createPublicFinanceRuntime({ config: config.public_finance, storage, storageKey: `${storageKey}.finance` });
  const resources = createResourceEconomyRuntime({ config: config.resources, storage, storageKey: `${storageKey}.resources` });
  const diplomacy = createDiplomacyRuntime({ config: config.diplomacy, nationId: nationConfig.nation_id, storage, storageKey: `${storageKey}.diplomacy` });
  let destroyed = false;
  let state = {
    revision: 0,
    status: "NATION_CANDIDATE",
    established_revision: null,
    governance_cycles: 0,
    policy_version: 1,
    government_policies: nationConfig.government_policies.map((policy) => ({ ...policy })),
    events: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      government_policies: restored.state.government_policies?.map((policy) => ({ ...policy })) ?? state.government_policies,
      events: restored.state.events?.slice(-MAX_EVENTS) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Nation Runtime has been destroyed");
  };
  const established = () => {
    if (state.status !== "ESTABLISHED_SYNTHETIC") throw runtimeError(RUNTIME, "NATION_NOT_ESTABLISHED", "Establish the synthetic Nation before using national powers");
  };

  function record(type, details = {}) {
    state.revision += 1;
    boundedPush(state.events, {
      event_id: stableId("nation-event", state.revision),
      type,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      ...details
    }, MAX_EVENTS);
  }

  function foundingRequirements() {
    const population = populationRuntime.getSnapshot();
    const government = governmentRuntime.getSnapshot();
    const publicFinance = finance.getSnapshot();
    const territoryIds = nationConfig.territory.parcel_ids;
    const worldParcelIds = new Set((world.parcels ?? []).map(({ id }) => id));
    return [
      {
        requirement_id: "POPULATION",
        pass: Number(population.metrics?.population ?? 0) >= nationConfig.founding.minimum_population,
        evidence: `${population.metrics?.population ?? 0} registered synthetic Citizens`
      },
      {
        requirement_id: "TERRITORY",
        pass: territoryIds.length >= nationConfig.founding.minimum_parcels && territoryIds.every((id) => worldParcelIds.has(id)),
        evidence: `${territoryIds.length} referenced K280 synthetic Parcels`
      },
      {
        requirement_id: "GOVERNMENT",
        pass: government.hierarchy?.some(({ level_id: id }) => id === "NATION") === true && governmentRuntime.integrityReport().ok,
        evidence: "Nation-level Government V1 reviewed and available"
      },
      {
        requirement_id: "SOVEREIGNTY",
        pass: nationConfig.sovereignty.evidence_status === "RECORDED" && nationConfig.sovereignty.review_status === "REVIEWED_SYNTHETIC",
        evidence: nationConfig.sovereignty.declaration_id
      },
      {
        requirement_id: "TREASURY",
        pass: finance.integrityReport().ok && publicFinance.treasury.total_assets >= nationConfig.founding.minimum_treasury_assets,
        evidence: `${publicFinance.treasury.total_assets} ${publicFinance.official_currency.currency_code}`
      },
      {
        requirement_id: "OFFICIAL_CURRENCY",
        pass: publicFinance.official_currency.status === "ACTIVE_SYNTHETIC" && publicFinance.official_currency.currency_code !== "KGEN",
        evidence: publicFinance.official_currency.currency_code
      }
    ].map((requirement) => ({ ...requirement, status: requirement.pass ? "PASS" : "BLOCKED" }));
  }

  const getSnapshot = () => {
    const requirements = foundingRequirements();
    return snapshot({
      runtime: "NATION_TIMELINE_NATION_ALPHA",
      schema_version: SCHEMA_VERSION,
      decision_id: config.decision_id,
      synthetic: true,
      authoritative: false,
      nation: {
        nation_id: nationConfig.nation_id,
        label: nationConfig.label,
        planet_id: nationConfig.territory.planet_id,
        surface_k: nationConfig.territory.surface_k,
        status: state.status,
        population: populationRuntime.getSnapshot().metrics?.population ?? 0,
        territory: nationConfig.territory,
        government_runtime_id: nationConfig.government_runtime_id,
        sovereignty: nationConfig.sovereignty,
        treasury_id: config.public_finance.treasury.treasury_id,
        official_currency: finance.getSnapshot().official_currency,
        established_revision: state.established_revision,
        real_sovereignty: false,
        legal_authority: false
      },
      founding_requirements: requirements,
      founding_ready: requirements.every(({ pass }) => pass),
      government_v2: {
        government_runtime_id: nationConfig.government_runtime_id,
        policies: state.government_policies,
        policy_version: state.policy_version,
        cycle_count: state.governance_cycles,
        real_military_operations: false,
        real_government_authority: false
      },
      public_finance: finance.getSnapshot(),
      resources: resources.getSnapshot(),
      diplomacy: diplomacy.getSnapshot(),
      events: state.events,
      revision: state.revision
    });
  };
  const notifier = createNotifier(getSnapshot);

  function establishNation() {
    usable();
    if (state.status === "ESTABLISHED_SYNTHETIC") return getSnapshot();
    const requirements = foundingRequirements();
    const blocked = requirements.filter(({ pass }) => !pass);
    if (blocked.length) throw runtimeError(RUNTIME, "FOUNDING_REQUIREMENTS_BLOCKED", `Nation founding blocked by ${blocked.map(({ requirement_id: id }) => id).join(", ")}`);
    record("NATION_ESTABLISHED", { nation_id: nationConfig.nation_id, requirements: requirements.map(({ requirement_id: id }) => id) });
    state.status = "ESTABLISHED_SYNTHETIC";
    state.established_revision = state.revision;
    persist();
    notifier.emit("NATION_ESTABLISHED", { nation_id: nationConfig.nation_id });
    return getSnapshot();
  }

  function runGovernmentV2Cycle() {
    usable();
    established();
    state.governance_cycles += 1;
    state.policy_version += 1;
    for (const policy of state.government_policies) {
      policy.version = Number(policy.version ?? 1) + 1;
      policy.review_status = "REVIEWED_SYNTHETIC";
      policy.last_cycle = state.governance_cycles;
    }
    record("GOVERNMENT_V2_CYCLE_COMPLETED", { cycle_count: state.governance_cycles, policy_count: state.government_policies.length });
    persist();
    notifier.emit("GOVERNMENT_V2_CYCLE_COMPLETED", { cycle_count: state.governance_cycles });
    return getSnapshot();
  }

  function setTaxRate(taxId, rateBps) {
    usable();
    established();
    finance.setTaxRate(taxId, rateBps, `NATION_POLICY_V${state.policy_version}`);
    record("NATION_TAX_POLICY_UPDATED", { tax_id: taxId, rate_bps: Number(rateBps) });
    persist();
    notifier.emit("NATION_TAX_POLICY_UPDATED", { tax_id: taxId });
    return getSnapshot();
  }

  function settleTaxInvoice(taxId, taxableAmount, payerId) {
    usable();
    established();
    finance.settleInvoice({ taxId, taxableAmount, payerId });
    record("NATION_TAX_INVOICE_SETTLED", { tax_id: taxId, taxable_amount: Number(taxableAmount) });
    persist();
    notifier.emit("NATION_TAX_INVOICE_SETTLED", { tax_id: taxId });
    return getSnapshot();
  }

  function allocateBudget(category, amount) {
    usable();
    established();
    finance.allocateBudget(category, amount);
    record("NATION_BUDGET_ALLOCATED", { category, amount: Number(amount) });
    persist();
    notifier.emit("NATION_BUDGET_ALLOCATED", { category, amount: Number(amount) });
    return getSnapshot();
  }

  function tradeResource(resourceId, direction, quantity, counterpartyId) {
    usable();
    established();
    const quote = resources.quoteTrade({ direction, resourceId, quantity });
    const plannedReference = stableId("resource-plan", state.revision + 1);
    if (direction === "IMPORT") finance.payResourceImport(quote.total_value_credit, plannedReference);
    const result = resources.executeTrade({ direction, resourceId, quantity, counterpartyId });
    if (direction === "EXPORT") finance.recordResourceRevenue(result.trade.total_value_credit, result.trade.trade_id);
    record("NATION_RESOURCE_TRADE_COMPLETED", { trade_id: result.trade.trade_id, direction, resource_id: resourceId });
    persist();
    notifier.emit("NATION_RESOURCE_TRADE_COMPLETED", { trade_id: result.trade.trade_id });
    return getSnapshot();
  }

  function exchangeResources(details) {
    usable();
    established();
    const result = resources.exchange(details);
    record("NATION_RESOURCE_EXCHANGE_COMPLETED", { trade_id: result.trade.trade_id });
    persist();
    notifier.emit("NATION_RESOURCE_EXCHANGE_COMPLETED", { trade_id: result.trade.trade_id });
    return getSnapshot();
  }

  function proposeDiplomacy(type, counterpartyId) {
    usable();
    established();
    diplomacy.propose({ type, counterpartyId });
    record("NATION_DIPLOMACY_PROPOSED", { agreement_type: type, counterparty_id: counterpartyId });
    persist();
    notifier.emit("NATION_DIPLOMACY_PROPOSED", { agreement_type: type });
    return getSnapshot();
  }

  function reviewDiplomacy(agreementId, decision = "APPROVE") {
    usable();
    established();
    diplomacy.review(agreementId, decision);
    record("NATION_DIPLOMACY_REVIEWED", { agreement_id: agreementId, decision });
    persist();
    notifier.emit("NATION_DIPLOMACY_REVIEWED", { agreement_id: agreementId, decision });
    return getSnapshot();
  }

  function setCurrencyPolicy(policyId) {
    usable();
    established();
    finance.setExchangePolicy(policyId);
    record("NATION_CURRENCY_POLICY_UPDATED", { policy_id: policyId });
    persist();
    notifier.emit("NATION_CURRENCY_POLICY_UPDATED", { policy_id: policyId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    const requirements = foundingRequirements();
    if (JSON.stringify(state.government_policies.map(({ policy_id: id }) => id)) !== JSON.stringify(GOVERNMENT_V2_POLICIES)) issues.push("Government V2 policy catalog changed");
    if (state.government_policies.some((policy) => policy.policy_id === "MILITARY" && policy.real_world_operation !== false)) issues.push("military policy crossed simulation boundary");
    if (state.status === "ESTABLISHED_SYNTHETIC" && requirements.some(({ pass }) => !pass)) issues.push("established Nation no longer satisfies founding requirements");
    if (!finance.integrityReport().ok) issues.push("public finance integrity failed");
    if (!resources.integrityReport().ok) issues.push("resource economy integrity failed");
    if (!diplomacy.integrityReport().ok) issues.push("diplomacy integrity failed");
    if (state.events.length > MAX_EVENTS) issues.push("Nation event limit exceeded");
    return snapshot({
      ok: issues.length === 0,
      runtime: "NATION_TIMELINE_NATION_ALPHA",
      issues,
      reports: {
        public_finance: finance.integrityReport(),
        resources: resources.integrityReport(),
        diplomacy: diplomacy.integrityReport()
      }
    });
  }

  return Object.freeze({
    getSnapshot,
    establishNation,
    runGovernmentV2Cycle,
    setTaxRate,
    settleTaxInvoice,
    allocateBudget,
    tradeResource,
    exchangeResources,
    proposeDiplomacy,
    reviewDiplomacy,
    setCurrencyPolicy,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      finance.destroy();
      resources.destroy();
      diplomacy.destroy();
      destroyed = true;
      return true;
    }
  });
}
