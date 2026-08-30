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

const RUNTIME = "ResourceEconomyRuntime";
const SCHEMA_VERSION = "1.0.0";
const MAX_TRADES = 160;
const MAX_AUDIT = 180;

export const RESOURCE_ACCOUNT_TYPES = Object.freeze([
  "PROGRAMMATIC_LEDGER_SUBACCOUNT",
  "SMART_CONTRACT_NODE_ACCOUNT",
  "RESOURCE_SMART_ACCOUNT_CANDIDATE",
  "TEMPORARY_CUSTODY_RECEIVER"
]);

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const KAIOS_BSC_TOKEN = "0xd4e67b3a69e41524c424150e6b6e921b01d036db";

// These registries are deliberately repository-owned and empty until a separate,
// reviewed connector installs exact attestations. Callers cannot mutate them.
const RESOURCE_CUSTODY_ATTESTATIONS = new Map();
const RESOURCE_EVENT_ATTESTATIONS = new Map();
const RESOURCE_FUNDING_ATTESTATIONS = new Map();
const RESOURCE_PAYMENT_AUTHORIZATIONS = new Map();
const RESOURCE_PAYMENT_RAIL_RELEASES = new Map();
const ISSUED_RESOURCE_CUSTODY_BINDINGS = new WeakSet();
const ISSUED_RESOURCE_ENTITLEMENTS = new WeakSet();

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw runtimeError(RUNTIME, "MISSING_RESOURCE_ACCOUNT_FIELD", `${field} is required`);
  }
  return value.trim();
}

function positiveWei(value, field = "amount_kaios_wei") {
  const text = String(value ?? "");
  if (!/^[1-9][0-9]*$/.test(text)) {
    throw runtimeError(RUNTIME, "INVALID_KAIOS_AMOUNT", `${field} must be a positive integer`);
  }
  return text;
}

function normalizePublicAddress(value) {
  const address = requiredText(value, "public_address");
  if (!EVM_ADDRESS.test(address) || address.toLowerCase() === ZERO_ADDRESS) {
    throw runtimeError(RUNTIME, "INVALID_PUBLIC_ADDRESS", "A non-zero public EVM address is required");
  }
  return address;
}

function resolveRepositoryAttestation(registry, attestationId, code, label) {
  const id = requiredText(attestationId, "attestation_id");
  const attestation = registry.get(id);
  if (!attestation) {
    throw runtimeError(RUNTIME, code, `${label} is not connected to a repository-owned attestation`);
  }
  return attestation;
}

function assertExactAttestation(attestation, claims, code) {
  for (const [field, value] of Object.entries(claims)) {
    if (String(attestation[field] ?? "") !== String(value ?? "")) {
      throw runtimeError(RUNTIME, code, `${field} does not match the repository-owned attestation`);
    }
  }
}

export function createResourceNodeAccount({
  accountId,
  nodeId,
  nodeName,
  canonicalLocation,
  parentNodeId = null,
  resourceTypes = [],
  economicOwner,
  accountType = "PROGRAMMATIC_LEDGER_SUBACCOUNT"
} = {}) {
  if (!RESOURCE_ACCOUNT_TYPES.includes(accountType) || accountType === "TEMPORARY_CUSTODY_RECEIVER") {
    throw runtimeError(RUNTIME, "INVALID_RESOURCE_ACCOUNT_TYPE", "Resource node accounts must use a non-custody account type");
  }
  if (!Array.isArray(resourceTypes) || resourceTypes.length === 0) {
    throw runtimeError(RUNTIME, "RESOURCE_TYPES_REQUIRED", "At least one canonical resource type is required");
  }
  return snapshot({
    account_id: requiredText(accountId, "account_id"),
    node_id: requiredText(nodeId, "node_id"),
    node_name: requiredText(nodeName, "node_name"),
    canonical_location: requiredText(canonicalLocation, "canonical_location"),
    parent_node_id: parentNodeId,
    resource_types: [...new Set(resourceTypes.map((value) => requiredText(value, "resource_type")))],
    economic_owner: requiredText(economicOwner, "economic_owner"),
    account_type: accountType,
    public_address: null,
    custody_status: "NO_PRIVATE_KEY_REQUIRED",
    status: "REGISTERED_OFFCHAIN_NO_EOA"
  });
}

export function createTemporaryCustodyBinding({
  bindingId,
  nodeId,
  nodeName,
  canonicalLocation,
  chainId,
  publicAddress,
  accountRole,
  economicOwner,
  custodian,
  purpose,
  asset,
  maxAmountKaiosWei,
  validFrom,
  validUntil,
  decisionId,
  migrationPolicy,
  custodyAttestationId,
  walletControlProof
} = {}) {
  const address = normalizePublicAddress(publicAddress);
  if (walletControlProof !== undefined && walletControlProof !== null) {
    throw runtimeError(RUNTIME, "CALLER_SUPPLIED_WALLET_CONTROL_PROOF_FORBIDDEN", "Wallet-control proof objects are untrusted caller claims");
  }
  const attestation = resolveRepositoryAttestation(
    RESOURCE_CUSTODY_ATTESTATIONS,
    custodyAttestationId,
    "RESOURCE_CUSTODY_ATTESTATION_NOT_CONNECTED",
    "Resource custody"
  );
  if (attestation.status !== "MACHINE_VERIFIED_REPOSITORY_BOUND_CUSTODY") {
    throw runtimeError(RUNTIME, "RESOURCE_CUSTODY_ATTESTATION_INVALID", "Resource custody attestation is not machine verified");
  }
  assertExactAttestation(attestation, {
    binding_id: bindingId,
    node_id: nodeId,
    node_name: nodeName,
    canonical_location: canonicalLocation,
    chain_id: Number(chainId),
    public_address: address,
    account_role: accountRole,
    economic_owner: economicOwner,
    custodian,
    purpose,
    asset,
    max_amount_kaios_wei: String(maxAmountKaiosWei),
    valid_from: validFrom,
    valid_until: validUntil,
    decision_id: decisionId,
    migration_policy: migrationPolicy
  }, "RESOURCE_CUSTODY_ATTESTATION_MISMATCH");
  const proof = attestation.wallet_control_proof;
  if (Number(chainId) !== 56) throw runtimeError(RUNTIME, "INVALID_CHAIN", "Temporary KAIOS custody must bind BSC chain 56");
  if (accountRole !== "TEMPORARY_CUSTODY_RECEIVER") {
    throw runtimeError(RUNTIME, "INVALID_ACCOUNT_ROLE", "Temporary bindings must use TEMPORARY_CUSTODY_RECEIVER");
  }
  if (!proof || proof.status !== "MACHINE_VERIFIED_PUBLIC_WALLET_CONTROL") {
    throw runtimeError(RUNTIME, "WALLET_CONTROL_PROOF_REQUIRED", "Repository-bound wallet control evidence is required");
  }
  if (String(proof.address).toLowerCase() !== address.toLowerCase()) {
    throw runtimeError(RUNTIME, "WALLET_CONTROL_ADDRESS_MISMATCH", "Wallet proof must bind the proposed public address");
  }
  const owner = requiredText(economicOwner, "economic_owner");
  const controller = requiredText(custodian, "custodian");
  if (owner === controller) {
    throw runtimeError(RUNTIME, "OWNER_CUSTODIAN_NOT_SEPARATED", "Canonical node ownership and temporary address custody must be separate");
  }
  const from = Date.parse(requiredText(validFrom, "valid_from"));
  const until = Date.parse(requiredText(validUntil, "valid_until"));
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) {
    throw runtimeError(RUNTIME, "INVALID_BINDING_WINDOW", "Temporary custody requires a bounded validity window");
  }
  const binding = snapshot({
    binding_id: requiredText(bindingId, "binding_id"),
    node_id: requiredText(nodeId, "node_id"),
    node_name: requiredText(nodeName, "node_name"),
    canonical_location: requiredText(canonicalLocation, "canonical_location"),
    chain_id: 56,
    public_address: address,
    account_role: accountRole,
    economic_owner: owner,
    custodian: controller,
    purpose: requiredText(purpose, "purpose"),
    asset: requiredText(asset, "asset"),
    max_amount_kaios_wei: positiveWei(maxAmountKaiosWei, "max_amount_kaios_wei"),
    valid_from: new Date(from).toISOString(),
    valid_until: new Date(until).toISOString(),
    decision_id: requiredText(decisionId, "decision_id"),
    migration_policy: requiredText(migrationPolicy, "migration_policy"),
    wallet_control_proof_id: requiredText(proof.proof_id, "wallet_control_proof_id"),
    custody_attestation_id: requiredText(custodyAttestationId, "custody_attestation_id"),
    status: "ACTIVE_TEMPORARY_CUSTODY_CANDIDATE",
    transfers_resource_ownership: false
  });
  ISSUED_RESOURCE_CUSTODY_BINDINGS.add(binding);
  return binding;
}

export function createResourceValueEntitlement({
  entitlementId,
  replayKey,
  accountId,
  policyId,
  resourceEventAttestationId,
  event,
  amountKaiosWei,
  existingEntitlements = []
} = {}) {
  if (event !== undefined && event !== null) {
    throw runtimeError(RUNTIME, "CALLER_SUPPLIED_RESOURCE_EVENT_FORBIDDEN", "Resource-event objects are untrusted caller claims");
  }
  const attestation = resolveRepositoryAttestation(
    RESOURCE_EVENT_ATTESTATIONS,
    resourceEventAttestationId,
    "RESOURCE_EVENT_ATTESTATION_NOT_CONNECTED",
    "Resource event"
  );
  if (attestation.status !== "MACHINE_VERIFIED_REPOSITORY_BOUND_RESOURCE_EVENT") {
    throw runtimeError(RUNTIME, "RESOURCE_EVENT_ATTESTATION_INVALID", "Resource event attestation is not machine verified");
  }
  const resolvedEvent = attestation.event;
  if (!resolvedEvent || resolvedEvent.status !== "VERIFIED_RESOURCE_EVENT") {
    throw runtimeError(RUNTIME, "VERIFIED_RESOURCE_EVENT_REQUIRED", "Resource existence alone cannot create a KAIOS entitlement");
  }
  for (const field of ["event_id", "node_id", "resource_type", "quantity", "quality", "world_state_evidence", "scarcity_evidence", "demand_evidence", "transport_evidence"]) {
    if (resolvedEvent[field] === undefined || resolvedEvent[field] === null || resolvedEvent[field] === "") {
      throw runtimeError(RUNTIME, "INCOMPLETE_RESOURCE_EVENT", `${field} is required for resource value evidence`);
    }
  }
  const normalizedEntitlementId = requiredText(entitlementId, "entitlement_id");
  const normalizedReplayKey = requiredText(replayKey, "replay_key");
  if (String(attestation.replay_key) !== normalizedReplayKey || String(attestation.account_id) !== String(accountId) || String(attestation.policy_id) !== String(policyId) || String(attestation.amount_kaios_wei) !== String(amountKaiosWei)) {
    throw runtimeError(RUNTIME, "RESOURCE_EVENT_ATTESTATION_MISMATCH", "Entitlement claims do not match the repository-owned resource event attestation");
  }
  if (existingEntitlements.some((item) => item.entitlement_id === normalizedEntitlementId || item.replay_key === normalizedReplayKey)) {
    throw runtimeError(RUNTIME, "RESOURCE_ENTITLEMENT_REPLAY", "Entitlement ID and replay key must be unique");
  }
  const entitlement = snapshot({
    entitlement_id: normalizedEntitlementId,
    replay_key: normalizedReplayKey,
    account_id: requiredText(accountId, "account_id"),
    policy_id: requiredText(policyId, "policy_id"),
    resource_event_attestation_id: requiredText(resourceEventAttestationId, "resource_event_attestation_id"),
    resource_event_id: resolvedEvent.event_id,
    node_id: resolvedEvent.node_id,
    resource_type: resolvedEvent.resource_type,
    amount_kaios_wei: positiveWei(amountKaiosWei),
    accounting_classification: "RESOURCE_SETTLEMENT",
    status: "ACCRUED_PENDING_SETTLEMENT",
    paid: false
  });
  ISSUED_RESOURCE_ENTITLEMENTS.add(entitlement);
  return entitlement;
}

export function evaluateResourceSettlementReadiness({
  entitlement,
  custodyBinding,
  fundingEvidenceAttestationId,
  exactAuthorizationAttestationId,
  paymentRailReleaseAttestationId,
  fundingEvidence,
  exactAuthorization,
  paymentRailAdapter,
  now = new Date()
} = {}) {
  const blockers = [];
  if (fundingEvidence !== undefined && fundingEvidence !== null) blockers.push("CALLER_SUPPLIED_FUNDING_EVIDENCE_FORBIDDEN");
  if (exactAuthorization !== undefined && exactAuthorization !== null) blockers.push("CALLER_SUPPLIED_AUTHORIZATION_FORBIDDEN");
  if (paymentRailAdapter !== undefined && paymentRailAdapter !== null) blockers.push("CALLER_SUPPLIED_PAYMENT_RAIL_ADAPTER_FORBIDDEN");
  if (!ISSUED_RESOURCE_ENTITLEMENTS.has(entitlement)) blockers.push("REPOSITORY_ISSUED_ENTITLEMENT_REQUIRED");
  if (!ISSUED_RESOURCE_CUSTODY_BINDINGS.has(custodyBinding)) blockers.push("REPOSITORY_ISSUED_CUSTODY_BINDING_REQUIRED");

  const funding = RESOURCE_FUNDING_ATTESTATIONS.get(String(fundingEvidenceAttestationId ?? ""));
  const authorization = RESOURCE_PAYMENT_AUTHORIZATIONS.get(String(exactAuthorizationAttestationId ?? ""));
  const railRelease = RESOURCE_PAYMENT_RAIL_RELEASES.get(String(paymentRailReleaseAttestationId ?? ""));
  if (!funding) blockers.push("RESOURCE_FUNDING_ATTESTATION_NOT_CONNECTED");
  if (!authorization) blockers.push("RESOURCE_PAYMENT_AUTHORIZATION_NOT_CONNECTED");
  if (!railRelease) blockers.push("COMMON_KAIOS_PAYMENT_RAIL_NOT_RELEASED");

  const nowMs = new Date(now).getTime();
  const fundingBalance = /^[0-9]+$/.test(String(funding?.balance_kaios_wei ?? "")) ? BigInt(funding.balance_kaios_wei) : null;
  const entitlementAmount = /^[0-9]+$/.test(String(entitlement?.amount_kaios_wei ?? "")) ? BigInt(entitlement.amount_kaios_wei) : null;
  if (!entitlement || entitlement.status !== "ACCRUED_PENDING_SETTLEMENT" || entitlement.paid !== false) blockers.push("VALID_ENTITLEMENT_REQUIRED");
  if (!custodyBinding || custodyBinding.status !== "ACTIVE_TEMPORARY_CUSTODY_CANDIDATE") blockers.push("ACTIVE_CUSTODY_BINDING_REQUIRED");
  if (!Number.isFinite(nowMs) || nowMs < Date.parse(custodyBinding?.valid_from) || nowMs >= Date.parse(custodyBinding?.valid_until)) blockers.push("CUSTODY_BINDING_NOT_CURRENT");
  if (entitlementAmount !== null && /^[0-9]+$/.test(String(custodyBinding?.max_amount_kaios_wei ?? "")) && entitlementAmount > BigInt(custodyBinding.max_amount_kaios_wei)) blockers.push("CUSTODY_AMOUNT_CAP_EXCEEDED");
  if (!funding || funding.status !== "MACHINE_VERIFIED_REPOSITORY_BOUND_FUNDING" || fundingBalance === null || entitlementAmount === null || fundingBalance < entitlementAmount || !EVM_ADDRESS.test(String(funding.source_address ?? ""))) blockers.push("VERIFIED_FUNDING_REQUIRED");
  if (!authorization || authorization.status !== "MACHINE_VERIFIED_REPOSITORY_BOUND_AUTHORIZATION" || authorization.action_type !== "ONE_EXACT_KAIOS_PAYMENT_ACTION") blockers.push("EXACT_AUTHORIZATION_REQUIRED");
  if (authorization) {
    if (Number(authorization.chain_id) !== 56) blockers.push("AUTHORIZATION_CHAIN_MISMATCH");
    if (String(authorization.token_address).toLowerCase() !== KAIOS_BSC_TOKEN) blockers.push("AUTHORIZATION_TOKEN_MISMATCH");
    if (!EVM_ADDRESS.test(String(authorization.source_address ?? "")) || String(authorization.source_address).toLowerCase() !== String(funding?.source_address).toLowerCase()) blockers.push("AUTHORIZATION_SOURCE_MISMATCH");
    if (String(authorization.recipient_address).toLowerCase() !== String(custodyBinding?.public_address).toLowerCase()) blockers.push("AUTHORIZATION_RECIPIENT_MISMATCH");
    if (String(authorization.amount_kaios_wei) !== String(entitlement?.amount_kaios_wei)) blockers.push("AUTHORIZATION_AMOUNT_MISMATCH");
    if (!["RESOURCE_PURCHASE", "RESOURCE_SETTLEMENT"].includes(authorization.purpose)) blockers.push("AUTHORIZATION_PURPOSE_MISMATCH");
    if (authorization.replay_key !== entitlement?.replay_key) blockers.push("AUTHORIZATION_REPLAY_KEY_MISMATCH");
    if (!requiredAuthorizationText(authorization.authorization_id) || !requiredAuthorizationText(authorization.signer_policy_id)) blockers.push("AUTHORIZATION_EVIDENCE_INCOMPLETE");
    if (!authorization.valid_from || Date.parse(authorization.valid_from) > nowMs) blockers.push("AUTHORIZATION_NOT_YET_VALID");
    if (!authorization.expires_at || Date.parse(authorization.expires_at) <= nowMs) blockers.push("AUTHORIZATION_EXPIRED");
  }
  if (!railRelease || railRelease.status !== "MACHINE_VERIFIED_REVIEWED_RELEASE") blockers.push("COMMON_KAIOS_PAYMENT_RAIL_NOT_RELEASED");
  return snapshot({
    status: blockers.length === 0 ? "READY_FOR_ACTION_SPECIFIC_SIGNER_GATE" : "BLOCKED",
    blockers: [...new Set(blockers)],
    paid: false,
    chain_write_executed: false
  });
}

function requiredAuthorizationText(value) {
  return typeof value === "string" && value.trim() !== "";
}

export const REQUIRED_PLANET_RESOURCES = Object.freeze([
  "WATER",
  "FOREST",
  "STONE",
  "IRON",
  "COPPER",
  "GOLD",
  "OIL",
  "GAS",
  "RARE_EARTH",
  "FOOD",
  "ENERGY"
]);

function positiveQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw runtimeError(RUNTIME, "INVALID_QUANTITY", "Resource quantity must be positive");
  return Number(parsed.toFixed(3));
}

function validateConfig(config) {
  if (!config || !Array.isArray(config.catalog)) throw new TypeError("Resource Economy Runtime requires a resource catalog");
  if (JSON.stringify(config.catalog.map(({ resource_id: id }) => id)) !== JSON.stringify(REQUIRED_PLANET_RESOURCES)) {
    throw runtimeError(RUNTIME, "INVALID_RESOURCE_CATALOG", "Planet Resource catalog must contain the approved eleven resources in order");
  }
  for (const resource of config.catalog) {
    if (![resource.initial_quantity, resource.capacity, resource.minimum_reserve, resource.reference_value_credit].every(Number.isFinite)) {
      throw runtimeError(RUNTIME, "INVALID_RESOURCE", `${resource.resource_id} has invalid numeric configuration`);
    }
    if (resource.initial_quantity < 0 || resource.initial_quantity > resource.capacity || resource.minimum_reserve < 0) {
      throw runtimeError(RUNTIME, "INVALID_RESOURCE", `${resource.resource_id} has invalid inventory bounds`);
    }
  }
}

export function createResourceEconomyRuntime({
  config,
  storage,
  storageKey = "kaios.world-viewer.resource-economy.v1"
} = {}) {
  validateConfig(config);
  const storageRef = resolveStorage(storage);
  const catalog = new Map(config.catalog.map((resource) => [resource.resource_id, Object.freeze({ ...resource })]));
  let destroyed = false;
  let state = {
    revision: 0,
    quantities: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, resource.initial_quantity])),
    net_movements: Object.fromEntries(config.catalog.map((resource) => [resource.resource_id, 0])),
    movements: [],
    trades: [],
    audit_log: []
  };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === SCHEMA_VERSION && value?.state);
  if (restored) {
    state = {
      ...state,
      ...restored.state,
      quantities: { ...state.quantities, ...restored.state.quantities },
      net_movements: { ...state.net_movements, ...restored.state.net_movements },
      movements: restored.state.movements?.slice(-MAX_TRADES) ?? [],
      trades: restored.state.trades?.slice(-MAX_TRADES) ?? [],
      audit_log: restored.state.audit_log?.slice(-MAX_AUDIT) ?? []
    };
  }
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: SCHEMA_VERSION, state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Resource Economy Runtime has been destroyed");
  };

  function resource(resourceId) {
    const record = catalog.get(resourceId);
    if (!record) throw runtimeError(RUNTIME, "UNKNOWN_RESOURCE", `Unknown resource ${resourceId}`);
    return record;
  }

  function quoteTrade({ direction, resourceId, quantity }) {
    usable();
    if (!["IMPORT", "EXPORT"].includes(direction)) throw runtimeError(RUNTIME, "INVALID_DIRECTION", "Resource trade direction must be IMPORT or EXPORT");
    const definition = resource(resourceId);
    const normalized = positiveQuantity(quantity);
    const current = Number(state.quantities[resourceId] ?? 0);
    if (direction === "EXPORT") {
      if (definition.export_enabled !== true) throw runtimeError(RUNTIME, "EXPORT_DISABLED", `${resourceId} export is disabled by trade policy`);
      if (current - normalized < definition.minimum_reserve) throw runtimeError(RUNTIME, "RESERVE_PROTECTED", `${resourceId} export would breach the national reserve`);
    } else {
      if (definition.import_enabled !== true) throw runtimeError(RUNTIME, "IMPORT_DISABLED", `${resourceId} import is disabled by trade policy`);
      if (current + normalized > definition.capacity) throw runtimeError(RUNTIME, "CAPACITY_EXCEEDED", `${resourceId} import exceeds storage capacity`);
    }
    return snapshot({
      direction,
      resource_id: resourceId,
      quantity: normalized,
      unit: definition.unit,
      unit_value_credit: definition.reference_value_credit,
      total_value_credit: Number((normalized * definition.reference_value_credit).toFixed(2)),
      before_quantity: current,
      after_quantity: Number((current + (direction === "IMPORT" ? normalized : -normalized)).toFixed(3))
    });
  }

  function executeTrade({ direction, resourceId, quantity, counterpartyId = "synthetic-trade-partner-001" } = {}) {
    const quote = quoteTrade({ direction, resourceId, quantity });
    state.revision += 1;
    state.quantities[resourceId] = quote.after_quantity;
    state.net_movements[resourceId] = Number((state.net_movements[resourceId] + (direction === "IMPORT" ? quote.quantity : -quote.quantity)).toFixed(3));
    const trade = {
      trade_id: stableId("resource-trade", state.revision),
      ...quote,
      counterparty_id: counterpartyId,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      settlement: "KAIOS_CREDIT_PROTOTYPE_LEDGER",
      real_trade: false
    };
    boundedPush(state.trades, trade, MAX_TRADES);
    boundedPush(state.movements, {
      movement_id: stableId("resource-movement", state.revision),
      resource_id: resourceId,
      delta: direction === "IMPORT" ? quote.quantity : -quote.quantity,
      cause: direction,
      reference_id: trade.trade_id
    }, MAX_TRADES);
    boundedPush(state.audit_log, {
      audit_id: stableId("resource-audit", state.revision),
      type: "RESOURCE_TRADE_COMPLETED",
      trade_id: trade.trade_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    }, MAX_AUDIT);
    persist();
    notifier.emit("RESOURCE_TRADE_COMPLETED", { trade_id: trade.trade_id, direction, resource_id: resourceId });
    return { snapshot: getSnapshot(), trade: snapshot(trade) };
  }

  function exchange({ giveResourceId, giveQuantity, receiveResourceId, receiveQuantity, counterpartyId = "synthetic-exchange-partner-001" } = {}) {
    usable();
    if (giveResourceId === receiveResourceId) throw runtimeError(RUNTIME, "INVALID_EXCHANGE", "Resource exchange requires two distinct resources");
    const give = resource(giveResourceId);
    const receive = resource(receiveResourceId);
    const giveAmount = positiveQuantity(giveQuantity);
    const receiveAmount = positiveQuantity(receiveQuantity);
    const giveCurrent = Number(state.quantities[giveResourceId] ?? 0);
    const receiveCurrent = Number(state.quantities[receiveResourceId] ?? 0);
    if (giveCurrent - giveAmount < give.minimum_reserve) throw runtimeError(RUNTIME, "RESERVE_PROTECTED", `${giveResourceId} exchange would breach reserve`);
    if (receiveCurrent + receiveAmount > receive.capacity) throw runtimeError(RUNTIME, "CAPACITY_EXCEEDED", `${receiveResourceId} exchange exceeds capacity`);
    state.revision += 1;
    state.quantities[giveResourceId] = Number((giveCurrent - giveAmount).toFixed(3));
    state.quantities[receiveResourceId] = Number((receiveCurrent + receiveAmount).toFixed(3));
    state.net_movements[giveResourceId] = Number((state.net_movements[giveResourceId] - giveAmount).toFixed(3));
    state.net_movements[receiveResourceId] = Number((state.net_movements[receiveResourceId] + receiveAmount).toFixed(3));
    const trade = {
      trade_id: stableId("resource-exchange", state.revision),
      direction: "EXCHANGE",
      give: { resource_id: giveResourceId, quantity: giveAmount, unit: give.unit },
      receive: { resource_id: receiveResourceId, quantity: receiveAmount, unit: receive.unit },
      counterparty_id: counterpartyId,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC",
      real_trade: false
    };
    boundedPush(state.trades, trade, MAX_TRADES);
    for (const [resourceId, delta] of [[giveResourceId, -giveAmount], [receiveResourceId, receiveAmount]]) {
      boundedPush(state.movements, {
        movement_id: `${stableId("resource-movement", state.revision)}-${resourceId}`,
        resource_id: resourceId,
        delta,
        cause: "EXCHANGE",
        reference_id: trade.trade_id
      }, MAX_TRADES);
    }
    boundedPush(state.audit_log, {
      audit_id: stableId("resource-audit", state.revision),
      type: "RESOURCE_EXCHANGE_COMPLETED",
      trade_id: trade.trade_id,
      evidence_status: "RECORDED",
      review_status: "REVIEWED_SYNTHETIC"
    }, MAX_AUDIT);
    persist();
    notifier.emit("RESOURCE_EXCHANGE_COMPLETED", { trade_id: trade.trade_id });
    return { snapshot: getSnapshot(), trade: snapshot(trade) };
  }

  const getSnapshot = () => snapshot({
    runtime: "PLANET_RESOURCE_ECONOMY_ALPHA",
    schema_version: SCHEMA_VERSION,
    synthetic: true,
    authoritative: false,
    planet_id: config.planet_id,
    resources: config.catalog.map((definition) => ({
      ...definition,
      quantity: state.quantities[definition.resource_id],
      available_for_export: Number(Math.max(0, state.quantities[definition.resource_id] - definition.minimum_reserve).toFixed(3)),
      utilization_percent: Number((state.quantities[definition.resource_id] / definition.capacity * 100).toFixed(1))
    })),
    trades: state.trades,
    movements: state.movements,
    net_movements: state.net_movements,
    audit_log: state.audit_log,
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function integrityReport() {
    const issues = [];
    if (JSON.stringify(config.catalog.map(({ resource_id: id }) => id)) !== JSON.stringify(REQUIRED_PLANET_RESOURCES)) issues.push("resource catalog changed");
    for (const definition of config.catalog) {
      const expected = Number((definition.initial_quantity + state.net_movements[definition.resource_id]).toFixed(3));
      const actual = Number(state.quantities[definition.resource_id]);
      if (Math.abs(expected - actual) > 0.001) issues.push(`${definition.resource_id} conservation mismatch`);
      if (actual < 0 || actual > definition.capacity) issues.push(`${definition.resource_id} inventory outside capacity`);
    }
    if (state.trades.some((trade) => trade.real_trade !== false || trade.review_status !== "REVIEWED_SYNTHETIC")) issues.push("resource trade crossed simulation boundary");
    if (state.trades.length > MAX_TRADES || state.movements.length > MAX_TRADES || state.audit_log.length > MAX_AUDIT) issues.push("resource history limit exceeded");
    return snapshot({ ok: issues.length === 0, runtime: "PLANET_RESOURCE_ECONOMY_ALPHA", issues, trade_count: state.trades.length });
  }

  return Object.freeze({
    getSnapshot,
    quoteTrade,
    executeTrade,
    exchange,
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
