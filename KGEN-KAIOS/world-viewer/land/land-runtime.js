export const LAND_RUNTIME_STORAGE_NAMESPACE = "kaios.world-viewer.land-runtime.v2";

const STORAGE_SCHEMA_VERSION = 2;
const DEFAULT_COMMAND_LIMIT = 64;
const MAX_STORAGE_BYTES = 2_000_000;
const MAX_STORED_EVENTS = 10_000;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const STORAGE_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const EVENT_TYPES = new Set([
  "DRAFT_SET",
  "DRAFT_SAVED",
  "DRAFT_DISCARDED",
  "UNDO_APPLIED",
  "REDO_APPLIED"
]);
const COMMAND_TYPES = new Set(["SET_DRAFT", "SAVE_DRAFT", "DISCARD_DRAFT"]);
const DRAFT_INPUT_FIELDS = new Set([
  "proposal_id",
  "proposal_type",
  "parcel_id",
  "requester_id",
  "requester_role",
  "requested_land_use",
  "current_land_use",
  "reason",
  "estimated_cost",
  "environment_impact",
  "neighbor_impact",
  "required_permissions",
  "evidence",
  "source_snapshot_id",
  "source_geometry_revision",
  "review_status",
  "created_at",
  "updated_at",
  "saved_at",
  "draft_revision",
  "local_saved",
  "registry_persisted",
  "persisted"
]);

export class LandRuntimeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LandRuntimeError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new LandRuntimeError(code, message);
}

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneValue(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!isRecord(value)) fail("INVALID_VALUE", "Land Runtime accepts JSON-compatible records only.");

  const clone = {};
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) {
      fail("INVALID_FIELD", `Unsafe field is not allowed: ${key}`);
    }
    clone[key] = cloneValue(child);
  }
  return clone;
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

function immutableClone(value) {
  return deepFreeze(cloneValue(value));
}

function safeCopy(value) {
  return value === undefined ? undefined : cloneValue(value);
}

function validId(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}

export function isValidLandRuntimeId(value) {
  return validId(value);
}

export function resolveLandStorageKey(storageKey = "default") {
  if (typeof storageKey !== "string" || !STORAGE_SEGMENT_PATTERN.test(storageKey)) {
    fail("INVALID_STORAGE_KEY", "storageKey must be a short ASCII namespace segment.");
  }
  return storageKey.startsWith(`${LAND_RUNTIME_STORAGE_NAMESPACE}:`)
    ? storageKey
    : `${LAND_RUNTIME_STORAGE_NAMESPACE}:${storageKey}`;
}

function normalizeText(value, field, { required = false, max = 512 } = {}) {
  if (value === null || value === undefined || value === "") {
    if (required) fail("INVALID_DRAFT", `${field} is required.`);
    return null;
  }
  if (typeof value !== "string") fail("INVALID_DRAFT", `${field} must be a string.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    fail("INVALID_DRAFT", `${field} must contain 1-${max} characters.`);
  }
  return normalized;
}

function normalizeId(value, field, { required = false } = {}) {
  const normalized = normalizeText(value, field, { required, max: 128 });
  if (normalized === null) return null;
  if (!validId(normalized)) fail("INVALID_ID", `${field} contains an invalid identifier.`);
  return normalized;
}

function normalizeStringList(value, field, maxItems = 32) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    fail("INVALID_DRAFT", `${field} must be an array with at most ${maxItems} entries.`);
  }
  return value.map((entry, index) => normalizeText(
    entry,
    `${field}[${index}]`,
    { required: true, max: 256 }
  ));
}

function normalizeEvidence(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 32) {
    fail("INVALID_DRAFT", "evidence must contain at most 32 references.");
  }
  return value.map((entry, index) => {
    if (typeof entry === "string") {
      return normalizeText(entry, `evidence[${index}]`, { required: true, max: 256 });
    }
    if (!isRecord(entry)) fail("INVALID_DRAFT", `evidence[${index}] is invalid.`);
    const allowed = new Set(["evidence_id", "artifact_hash", "summary"]);
    for (const key of Object.keys(entry)) {
      if (!allowed.has(key)) fail("INVALID_DRAFT", `evidence[${index}].${key} is not allowed.`);
    }
    return {
      evidence_id: normalizeId(entry.evidence_id, `evidence[${index}].evidence_id`, { required: true }),
      artifact_hash: normalizeText(entry.artifact_hash, `evidence[${index}].artifact_hash`, { max: 160 }),
      summary: normalizeText(entry.summary, `evidence[${index}].summary`, { max: 256 })
    };
  });
}

function normalizeCost(value) {
  if (value === undefined || value === null || value === "") return "UNKNOWN";
  if (typeof value === "string") {
    return normalizeText(value, "estimated_cost", { required: true, max: 128 });
  }
  if (Number.isFinite(value) && value >= 0) return value;
  fail("INVALID_DRAFT", "estimated_cost must be a non-negative number or short label.");
}

function normalizeTimestamp(value, field) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) fail("INVALID_TIMESTAMP", `${field} is invalid.`);
  return date.toISOString();
}

function currentTimestamp(now) {
  return normalizeTimestamp(now(), "now()");
}

function historyVersion(entry) {
  if (!isRecord(entry)) return 0;
  for (const key of ["local_version", "parcel_version", "revision", "version"]) {
    if (Number.isInteger(entry[key]) && entry[key] >= 0) return entry[key];
  }
  return 0;
}

function identifierSequence(value) {
  if (typeof value !== "string") return 0;
  const match = value.match(/:(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function safeHistory(parcel, field) {
  const value = parcel[field];
  if (value === undefined) return deepFreeze([]);
  if (!Array.isArray(value)) fail("INVALID_WORLD", `${parcel.id}.${field} must be an array.`);
  return immutableClone(value);
}

function normalizeStorage(storage) {
  if (storage === null || storage === undefined) return null;
  if (
    typeof storage.getItem !== "function"
    || typeof storage.setItem !== "function"
    || typeof storage.removeItem !== "function"
  ) {
    fail("INVALID_STORAGE", "storage must implement getItem, setItem, and removeItem.");
  }
  return storage;
}

function actionIds(world) {
  const values = Array.isArray(world.proposalActions) ? world.proposalActions : [];
  return new Set(values.map((action) => (
    typeof action === "string" ? action : action?.id
  )).filter((value) => typeof value === "string" && value.length > 0));
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function lastItem(items) {
  return items.length ? items[items.length - 1] : null;
}

function trimStack(stack, limit) {
  if (stack.length > limit) stack.splice(0, stack.length - limit);
}

function normalizeDraft({
  parcel,
  input,
  existing = null,
  allowedLandUses,
  timestamp,
  makeProposalId,
  fromStorage = false
}) {
  if (!isRecord(input)) fail("INVALID_DRAFT", "Draft must be an object.");
  for (const field of Object.keys(input)) {
    if (!DRAFT_INPUT_FIELDS.has(field)) fail("INVALID_DRAFT", `${field} is not a permitted draft field.`);
  }

  const merged = { ...(existing ?? {}), ...input };
  if (merged.proposal_type !== undefined && merged.proposal_type !== "LAND_USE_PROPOSAL") {
    fail("INVALID_DRAFT", "Only LAND_USE_PROPOSAL drafts are supported.");
  }
  if (merged.parcel_id !== undefined && merged.parcel_id !== parcel.id) {
    fail("INVALID_DRAFT", "Draft parcel_id does not match the selected parcel.");
  }

  const requestedLandUse = normalizeText(
    merged.requested_land_use,
    "requested_land_use",
    { required: true, max: 64 }
  );
  if (allowedLandUses.size && !allowedLandUses.has(requestedLandUse)) {
    fail("INVALID_LAND_USE", `Unsupported land use: ${requestedLandUse}`);
  }

  const proposalId = normalizeId(
    merged.proposal_id ?? makeProposalId(),
    "proposal_id",
    { required: true }
  );
  const createdAt = merged.created_at
    ? normalizeTimestamp(merged.created_at, "created_at")
    : timestamp;
  const draftRevision = fromStorage
    ? merged.draft_revision
    : (Number.isInteger(existing?.draft_revision) ? existing.draft_revision + 1 : 1);
  if (!Number.isInteger(draftRevision) || draftRevision < 1) {
    fail("INVALID_DRAFT", "draft_revision must be a positive integer.");
  }

  const localSaved = fromStorage ? merged.local_saved === true : false;
  const savedAt = localSaved
    ? normalizeTimestamp(merged.saved_at, "saved_at")
    : null;

  return immutableClone({
    proposal_id: proposalId,
    proposal_type: "LAND_USE_PROPOSAL",
    parcel_id: parcel.id,
    requester_id: normalizeId(merged.requester_id, "requester_id"),
    requester_role: normalizeText(merged.requester_role, "requester_role", { max: 64 }),
    requested_land_use: requestedLandUse,
    current_land_use: typeof parcel.land_use === "string" ? parcel.land_use : "UNKNOWN",
    reason: normalizeText(merged.reason, "reason", { max: 512 }) ?? "LOCAL_PREVIEW",
    estimated_cost: normalizeCost(merged.estimated_cost),
    environment_impact: normalizeText(
      merged.environment_impact,
      "environment_impact",
      { max: 128 }
    ) ?? "REVIEW_REQUIRED",
    neighbor_impact: normalizeText(
      merged.neighbor_impact,
      "neighbor_impact",
      { max: 128 }
    ) ?? "REVIEW_REQUIRED",
    required_permissions: normalizeStringList(merged.required_permissions, "required_permissions"),
    evidence: normalizeEvidence(merged.evidence),
    source_snapshot_id: normalizeText(merged.source_snapshot_id, "source_snapshot_id", { max: 160 }),
    source_geometry_revision: normalizeText(
      merged.source_geometry_revision,
      "source_geometry_revision",
      { max: 160 }
    ),
    review_status: "DRAFT_LOCAL",
    created_at: createdAt,
    updated_at: fromStorage
      ? normalizeTimestamp(merged.updated_at, "updated_at")
      : timestamp,
    saved_at: savedAt,
    draft_revision: draftRevision,
    local_saved: localSaved,
    registry_persisted: false,
    persisted: false
  });
}

function normalizeStoredEvent(entry, record, allowedLandUses) {
  if (!isRecord(entry) || !EVENT_TYPES.has(entry.event_type)) {
    fail("CORRUPT_STORAGE", "Stored proposal event is invalid.");
  }
  const parcelId = normalizeId(entry.parcel_id, "event.parcel_id", { required: true });
  if (parcelId !== record.parcel.id) fail("CORRUPT_STORAGE", "Stored event parcel does not match.");
  const localVersion = entry.local_version;
  if (!Number.isInteger(localVersion) || localVersion < 1) {
    fail("CORRUPT_STORAGE", "Stored event version is invalid.");
  }
  const occurredAt = normalizeTimestamp(entry.occurred_at, "event.occurred_at");
  const draft = entry.draft === null ? null : normalizeDraft({
    parcel: record.parcel,
    input: entry.draft,
    allowedLandUses,
    timestamp: occurredAt,
    makeProposalId: () => entry.proposal_id,
    fromStorage: true
  });
  return immutableClone({
    event_id: normalizeId(entry.event_id, "event.event_id", { required: true }),
    event_type: entry.event_type,
    parcel_id: parcelId,
    proposal_id: entry.proposal_id === null
      ? null
      : normalizeId(entry.proposal_id, "event.proposal_id", { required: true }),
    command_id: normalizeId(entry.command_id, "event.command_id", { required: true }),
    original_command_type: entry.original_command_type === null
      ? null
      : normalizeText(entry.original_command_type, "event.original_command_type", { max: 64 }),
    local_version: localVersion,
    occurred_at: occurredAt,
    draft,
    registry_persisted: false
  });
}

function normalizeStoredRevision(entry, record) {
  if (!isRecord(entry)) fail("CORRUPT_STORAGE", "Stored revision event is invalid.");
  const parcelId = normalizeId(entry.parcel_id, "revision.parcel_id", { required: true });
  if (parcelId !== record.parcel.id) fail("CORRUPT_STORAGE", "Stored revision parcel does not match.");
  const localVersion = entry.local_version;
  if (!Number.isInteger(localVersion) || localVersion < 1) {
    fail("CORRUPT_STORAGE", "Stored revision version is invalid.");
  }
  return immutableClone({
    revision_id: normalizeId(entry.revision_id, "revision.revision_id", { required: true }),
    parcel_id: parcelId,
    local_version: localVersion,
    event_type: normalizeText(entry.event_type, "revision.event_type", { required: true, max: 64 }),
    command_id: normalizeId(entry.command_id, "revision.command_id", { required: true }),
    recorded_at: normalizeTimestamp(entry.recorded_at, "revision.recorded_at"),
    canonical_owner_id: entry.canonical_owner_id === null
      ? null
      : normalizeId(entry.canonical_owner_id, "revision.canonical_owner_id", { required: true }),
    canonical_land_use: normalizeText(
      entry.canonical_land_use,
      "revision.canonical_land_use",
      { required: true, max: 64 }
    ),
    active_proposal_id: entry.active_proposal_id === null
      ? null
      : normalizeId(entry.active_proposal_id, "revision.active_proposal_id", { required: true }),
    requested_land_use: entry.requested_land_use === null
      ? null
      : normalizeText(entry.requested_land_use, "revision.requested_land_use", { max: 64 }),
    ownership_mutated: false,
    registry_persisted: false,
    source: "LOCAL_SANDBOX"
  });
}

function normalizeStoredCommand(entry, record, allowedLandUses) {
  if (!isRecord(entry) || !COMMAND_TYPES.has(entry.command_type)) {
    fail("CORRUPT_STORAGE", "Stored command is invalid.");
  }
  const parcelId = normalizeId(entry.parcel_id, "command.parcel_id", { required: true });
  if (parcelId !== record.parcel.id) fail("CORRUPT_STORAGE", "Stored command parcel does not match.");
  const normalizedDraft = (value, label) => value === null ? null : normalizeDraft({
    parcel: record.parcel,
    input: value,
    allowedLandUses,
    timestamp: normalizeTimestamp(value.updated_at, `${label}.updated_at`),
    makeProposalId: () => value.proposal_id,
    fromStorage: true
  });
  return immutableClone({
    command_id: normalizeId(entry.command_id, "command.command_id", { required: true }),
    command_type: entry.command_type,
    parcel_id: parcelId,
    created_at: normalizeTimestamp(entry.created_at, "command.created_at"),
    before: normalizedDraft(entry.before, "command.before"),
    after: normalizedDraft(entry.after, "command.after")
  });
}

export function createLandRuntime({
  world,
  storage = null,
  storageKey = "default",
  now = () => new Date(),
  commandLimit = DEFAULT_COMMAND_LIMIT
} = {}) {
  if (!isRecord(world) || !Array.isArray(world.parcels)) {
    fail("INVALID_WORLD", "world.parcels must be an array.");
  }
  if (typeof now !== "function") fail("INVALID_NOW", "now must be a function.");
  if (!Number.isInteger(commandLimit) || commandLimit < 1 || commandLimit > 256) {
    fail("INVALID_COMMAND_LIMIT", "commandLimit must be an integer between 1 and 256.");
  }

  const localStorage = normalizeStorage(storage);
  const resolvedStorageKey = resolveLandStorageKey(storageKey);
  const allowedLandUses = actionIds(world);
  const records = new Map();
  const subscribers = new Set();
  let destroyed = false;
  let sequence = 0;
  let lastParcelId = null;
  let storageStatus = localStorage ? "EMPTY" : "UNAVAILABLE";

  for (const sourceParcel of world.parcels) {
    if (!isRecord(sourceParcel) || !validId(sourceParcel.id)) {
      fail("INVALID_WORLD", "Every parcel must have a valid ASCII id.");
    }
    if (records.has(sourceParcel.id)) fail("INVALID_WORLD", `Duplicate parcel id: ${sourceParcel.id}`);

    const parcel = immutableClone(sourceParcel);
    const seedRevisionHistory = safeHistory(parcel, "revision_history");
    const seedOwnershipTimeline = safeHistory(parcel, "ownership_timeline");
    const seedProposalHistory = safeHistory(parcel, "proposal_history");
    const seedVersion = Math.max(
      Number.isInteger(parcel.parcel_version) ? parcel.parcel_version : 0,
      ...seedRevisionHistory.map(historyVersion)
    );
    records.set(parcel.id, {
      parcel,
      seedRevisionHistory,
      seedOwnershipTimeline,
      seedProposalHistory,
      seedVersion,
      localVersion: seedVersion,
      activeDraft: null,
      localProposalHistory: [],
      localRevisionHistory: [],
      undoStack: [],
      redoStack: []
    });
  }

  function assertActive() {
    if (destroyed) fail("RUNTIME_DESTROYED", "Land Runtime has been destroyed.");
  }

  function getRecord(parcelId) {
    if (!validId(parcelId)) fail("INVALID_ID", "parcelId is invalid.");
    const record = records.get(parcelId);
    if (!record) fail("UNKNOWN_PARCEL", `Unknown parcel: ${parcelId}`);
    return record;
  }

  function resolveRecord(parcelId) {
    if (parcelId !== undefined && parcelId !== null) return getRecord(parcelId);
    if (lastParcelId && records.has(lastParcelId)) return records.get(lastParcelId);
    const active = [...records.values()].filter((record) => record.activeDraft);
    if (active.length === 1) return active[0];
    fail("PARCEL_ID_REQUIRED", "parcelId is required when no unique active parcel exists.");
  }

  function nextId(prefix, parcelId) {
    sequence += 1;
    const compactTime = currentTimestamp(now).replace(/[-:.TZ]/g, "");
    const parcelToken = parcelId.slice(0, 48);
    return `${prefix}:${parcelToken}:${compactTime}:${sequence}`;
  }

  function checkpoint(record) {
    return {
      activeDraft: record.activeDraft,
      localVersion: record.localVersion,
      localProposalHistory: record.localProposalHistory.slice(),
      localRevisionHistory: record.localRevisionHistory.slice(),
      undoStack: record.undoStack.slice(),
      redoStack: record.redoStack.slice()
    };
  }

  function restore(record, saved) {
    Object.assign(record, saved);
  }

  function eventFor(record, eventType, command, timestamp) {
    return immutableClone({
      event_id: nextId("land-event", record.parcel.id),
      event_type: eventType,
      parcel_id: record.parcel.id,
      proposal_id: record.activeDraft?.proposal_id ?? command.before?.proposal_id ?? null,
      command_id: command.command_id,
      original_command_type: ["UNDO_APPLIED", "REDO_APPLIED"].includes(eventType)
        ? command.command_type
        : null,
      local_version: record.localVersion,
      occurred_at: timestamp,
      draft: record.activeDraft,
      registry_persisted: false
    });
  }

  function revisionFor(record, eventType, command, timestamp) {
    return immutableClone({
      revision_id: nextId("land-revision", record.parcel.id),
      parcel_id: record.parcel.id,
      local_version: record.localVersion,
      event_type: eventType,
      command_id: command.command_id,
      recorded_at: timestamp,
      canonical_owner_id: validId(record.parcel.owner_id) ? record.parcel.owner_id : null,
      canonical_land_use: typeof record.parcel.land_use === "string"
        ? record.parcel.land_use
        : "UNKNOWN",
      active_proposal_id: record.activeDraft?.proposal_id ?? null,
      requested_land_use: record.activeDraft?.requested_land_use ?? null,
      ownership_mutated: false,
      registry_persisted: false,
      source: "LOCAL_SANDBOX"
    });
  }

  function appendHistory(record, eventType, command, timestamp) {
    record.localVersion += 1;
    record.localProposalHistory.push(eventFor(record, eventType, command, timestamp));
    record.localRevisionHistory.push(revisionFor(record, eventType, command, timestamp));
  }

  function serializedState() {
    return {
      schema_version: STORAGE_SCHEMA_VERSION,
      namespace: LAND_RUNTIME_STORAGE_NAMESPACE,
      registry_persisted: false,
      updated_at: currentTimestamp(now),
      parcels: [...records.values()]
        .filter((record) => (
          record.activeDraft
          || record.localProposalHistory.length
          || record.localRevisionHistory.length
          || record.undoStack.length
          || record.redoStack.length
        ))
        .map((record) => ({
          parcel_id: record.parcel.id,
          local_version: record.localVersion,
          active_draft: record.activeDraft,
          proposal_history: record.localProposalHistory,
          revision_history: record.localRevisionHistory,
          undo_stack: record.undoStack,
          redo_stack: record.redoStack
        }))
    };
  }

  function persist() {
    if (!localStorage) return false;
    const serialized = JSON.stringify(serializedState());
    if (serialized.length > MAX_STORAGE_BYTES) {
      fail("STORAGE_LIMIT", "Land Runtime local state exceeds the storage safety limit.");
    }
    try {
      localStorage.setItem(resolvedStorageKey, serialized);
      storageStatus = "READY";
      return true;
    } catch (error) {
      storageStatus = "WRITE_FAILED";
      fail("STORAGE_WRITE_FAILED", `Unable to save local Land Runtime state: ${error?.message ?? "unknown error"}`);
    }
  }

  function notify(type, record) {
    const message = immutableClone({
      type,
      parcel_id: record?.parcel.id ?? null,
      local_version: record?.localVersion ?? null,
      active_draft: record?.activeDraft ?? null,
      can_undo: Boolean(record?.undoStack.length),
      can_redo: Boolean(record?.redoStack.length),
      registry_persisted: false
    });
    for (const listener of [...subscribers]) {
      try {
        listener(message);
      } catch {
        // Subscriber failures cannot mutate or stop the runtime.
      }
    }
  }

  function runCommand(record, commandType, after, eventType, persistAfter) {
    const before = record.activeDraft;
    if (sameValue(before, after)) return before;
    const timestamp = currentTimestamp(now);
    const command = immutableClone({
      command_id: nextId("land-command", record.parcel.id),
      command_type: commandType,
      parcel_id: record.parcel.id,
      created_at: timestamp,
      before,
      after
    });
    const saved = checkpoint(record);
    record.activeDraft = after;
    record.undoStack.push(command);
    trimStack(record.undoStack, commandLimit);
    record.redoStack = [];
    appendHistory(record, eventType, command, timestamp);

    try {
      if (persistAfter) persist();
    } catch (error) {
      restore(record, saved);
      throw error;
    }
    lastParcelId = record.parcel.id;
    notify(eventType, record);
    return record.activeDraft;
  }

  function loadStoredState() {
    if (!localStorage) return;
    let raw;
    try {
      raw = localStorage.getItem(resolvedStorageKey);
    } catch {
      storageStatus = "READ_FAILED";
      return;
    }
    if (raw === null) return;
    if (typeof raw !== "string" || raw.length > MAX_STORAGE_BYTES) {
      storageStatus = "CORRUPT_IGNORED";
      return;
    }

    const savedRecords = new Map([...records.entries()].map(([id, record]) => [id, checkpoint(record)]));
    try {
      const payload = JSON.parse(raw);
      if (
        !isRecord(payload)
        || payload.schema_version !== STORAGE_SCHEMA_VERSION
        || payload.namespace !== LAND_RUNTIME_STORAGE_NAMESPACE
        || payload.registry_persisted !== false
        || !Array.isArray(payload.parcels)
        || payload.parcels.length > records.size
      ) {
        fail("CORRUPT_STORAGE", "Stored Land Runtime envelope is invalid.");
      }

      const seen = new Set();
      let eventCount = 0;
      for (const item of payload.parcels) {
        if (!isRecord(item)) fail("CORRUPT_STORAGE", "Stored parcel state is invalid.");
        const parcelId = normalizeId(item.parcel_id, "stored.parcel_id", { required: true });
        if (seen.has(parcelId)) fail("CORRUPT_STORAGE", "Stored parcel state is duplicated.");
        seen.add(parcelId);
        const record = getRecord(parcelId);
        const proposalHistory = Array.isArray(item.proposal_history) ? item.proposal_history : [];
        const revisionHistory = Array.isArray(item.revision_history) ? item.revision_history : [];
        const undoStack = Array.isArray(item.undo_stack) ? item.undo_stack : [];
        const redoStack = Array.isArray(item.redo_stack) ? item.redo_stack : [];
        eventCount += proposalHistory.length + revisionHistory.length;
        if (eventCount > MAX_STORED_EVENTS || undoStack.length > commandLimit || redoStack.length > commandLimit) {
          fail("CORRUPT_STORAGE", "Stored Land Runtime history exceeds safety limits.");
        }

        record.activeDraft = item.active_draft === null
          ? null
          : normalizeDraft({
            parcel: record.parcel,
            input: item.active_draft,
            allowedLandUses,
            timestamp: normalizeTimestamp(item.active_draft.updated_at, "active_draft.updated_at"),
            makeProposalId: () => item.active_draft.proposal_id,
            fromStorage: true
          });
        record.localProposalHistory = proposalHistory.map((entry) => (
          normalizeStoredEvent(entry, record, allowedLandUses)
        ));
        record.localRevisionHistory = revisionHistory.map((entry) => (
          normalizeStoredRevision(entry, record)
        ));
        record.undoStack = undoStack.map((entry) => (
          normalizeStoredCommand(entry, record, allowedLandUses)
        ));
        record.redoStack = redoStack.map((entry) => (
          normalizeStoredCommand(entry, record, allowedLandUses)
        ));
        sequence = Math.max(
          sequence,
          ...record.localProposalHistory.map((entry) => identifierSequence(entry.event_id)),
          ...record.localRevisionHistory.map((entry) => identifierSequence(entry.revision_id)),
          ...record.undoStack.map((entry) => identifierSequence(entry.command_id)),
          ...record.redoStack.map((entry) => identifierSequence(entry.command_id))
        );
        const storedVersion = Number.isInteger(item.local_version) ? item.local_version : 0;
        record.localVersion = Math.max(
          record.seedVersion,
          storedVersion,
          ...record.localProposalHistory.map(historyVersion),
          ...record.localRevisionHistory.map(historyVersion)
        );
      }
      sequence = Math.max(sequence, eventCount);
      storageStatus = "READY";
    } catch {
      for (const [id, saved] of savedRecords) restore(records.get(id), saved);
      storageStatus = "CORRUPT_IGNORED";
    }
  }

  loadStoredState();

  function setDraft(parcelIdOrDraft, maybeDraft) {
    assertActive();
    const input = maybeDraft === undefined && isRecord(parcelIdOrDraft)
      ? parcelIdOrDraft
      : maybeDraft;
    const parcelId = maybeDraft === undefined && isRecord(parcelIdOrDraft)
      ? parcelIdOrDraft.parcel_id
      : parcelIdOrDraft;
    const record = getRecord(parcelId);
    const timestamp = currentTimestamp(now);
    const after = normalizeDraft({
      parcel: record.parcel,
      input,
      existing: record.activeDraft,
      allowedLandUses,
      timestamp,
      makeProposalId: () => nextId("land-proposal", record.parcel.id)
    });
    return safeCopy(runCommand(record, "SET_DRAFT", after, "DRAFT_SET", false));
  }

  function saveDraft(parcelId) {
    assertActive();
    const record = resolveRecord(parcelId);
    if (!record.activeDraft) return null;
    if (record.activeDraft.local_saved) return safeCopy(record.activeDraft);
    if (!localStorage) fail("STORAGE_UNAVAILABLE", "saveDraft requires a localStorage-compatible adapter.");
    const timestamp = currentTimestamp(now);
    const after = immutableClone({
      ...record.activeDraft,
      updated_at: timestamp,
      saved_at: timestamp,
      local_saved: true,
      registry_persisted: false,
      persisted: false
    });
    return safeCopy(runCommand(record, "SAVE_DRAFT", after, "DRAFT_SAVED", true));
  }

  function discardDraft(parcelId) {
    assertActive();
    const record = resolveRecord(parcelId);
    if (!record.activeDraft) return false;
    runCommand(record, "DISCARD_DRAFT", null, "DRAFT_DISCARDED", Boolean(localStorage));
    return true;
  }

  function moveCommand(parcelId, direction) {
    assertActive();
    const record = resolveRecord(parcelId);
    const source = direction === "UNDO" ? record.undoStack : record.redoStack;
    const target = direction === "UNDO" ? record.redoStack : record.undoStack;
    if (!source.length) return null;

    const saved = checkpoint(record);
    const command = source.pop();
    record.activeDraft = direction === "UNDO" ? command.before : command.after;
    target.push(command);
    trimStack(target, commandLimit);
    const eventType = direction === "UNDO" ? "UNDO_APPLIED" : "REDO_APPLIED";
    const timestamp = currentTimestamp(now);
    appendHistory(record, eventType, command, timestamp);
    try {
      if (localStorage) persist();
    } catch (error) {
      restore(record, saved);
      throw error;
    }
    lastParcelId = record.parcel.id;
    notify(eventType, record);
    return safeCopy(record.activeDraft);
  }

  function getParcelSnapshot(parcelId, revision = null) {
    assertActive();
    const record = getRecord(parcelId);
    const revisionHistory = [
      ...record.seedRevisionHistory,
      ...record.localRevisionHistory
    ];
    const proposalHistory = [
      ...record.seedProposalHistory,
      ...record.localProposalHistory
    ];
    let selectedRevision = lastItem(revisionHistory);
    if (revision !== null && revision !== undefined) {
      selectedRevision = revisionHistory.find((entry) => (
        typeof revision === "number"
          ? historyVersion(entry) === revision
          : entry?.revision_id === revision || entry?.id === revision
      )) ?? null;
      if (!selectedRevision) fail("UNKNOWN_REVISION", `Unknown parcel revision: ${revision}`);
    }

    const parcel = safeCopy(record.parcel);
    delete parcel.revision_history;
    delete parcel.ownership_timeline;
    delete parcel.proposal_history;
    return safeCopy({
      ...parcel,
      canonical_parcel_version: record.seedVersion,
      local_parcel_version: record.localVersion,
      active_draft: record.activeDraft,
      revision_history: revisionHistory,
      ownership_timeline: record.seedOwnershipTimeline,
      proposal_history: proposalHistory,
      revision_viewer: {
        selected_revision: selectedRevision,
        latest_revision_id: lastItem(revisionHistory)?.revision_id
          ?? lastItem(revisionHistory)?.id
          ?? null,
        revision_count: revisionHistory.length,
        proposal_event_count: proposalHistory.length
      },
      can_undo: record.undoStack.length > 0,
      can_redo: record.redoStack.length > 0,
      ownership_mutated: false,
      local_registry_persisted: false,
      storage_status: storageStatus
    });
  }

  function getActiveDraft(parcelId) {
    assertActive();
    return safeCopy(resolveRecord(parcelId).activeDraft);
  }

  function subscribe(listener) {
    assertActive();
    if (typeof listener !== "function") fail("INVALID_LISTENER", "subscribe requires a function.");
    subscribers.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      subscribers.delete(listener);
    };
  }

  function clearLocalState(parcelId = null) {
    assertActive();
    const targets = parcelId === null ? [...records.values()] : [getRecord(parcelId)];
    const savedRecords = new Map(targets.map((record) => [record.parcel.id, checkpoint(record)]));
    for (const record of targets) {
      record.localVersion = record.seedVersion;
      record.activeDraft = null;
      record.localProposalHistory = [];
      record.localRevisionHistory = [];
      record.undoStack = [];
      record.redoStack = [];
    }

    let storageCleared = !localStorage;
    try {
      if (localStorage) {
        if (parcelId === null) localStorage.removeItem(resolvedStorageKey);
        else persist();
        storageCleared = true;
        storageStatus = parcelId === null ? "EMPTY" : "READY";
      }
    } catch (error) {
      for (const [id, saved] of savedRecords) restore(records.get(id), saved);
      throw error;
    }
    lastParcelId = null;
    targets.forEach((record) => notify("LOCAL_STATE_CLEARED", record));
    return { cleared_parcels: targets.length, storage_cleared: storageCleared };
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    subscribers.clear();
    lastParcelId = null;
  }

  return Object.freeze({
    setDraft,
    saveDraft,
    discardDraft,
    undo: (parcelId) => moveCommand(parcelId, "UNDO"),
    redo: (parcelId) => moveCommand(parcelId, "REDO"),
    getParcelSnapshot,
    getActiveDraft,
    subscribe,
    clearLocalState,
    destroy
  });
}
