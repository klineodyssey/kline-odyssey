export const SelectionState = Object.freeze({
  NONE: "NONE",
  HOVERED: "HOVERED",
  SELECTED: "SELECTED",
  FOCUSED: "FOCUSED",
  LOCKED: "LOCKED",
  DISABLED: "DISABLED",
  PENDING_PROPOSAL: "PENDING_PROPOSAL"
});

export const SELECTION_STATES = Object.freeze(Object.values(SelectionState));

const CONSTRAINED_STATES = new Set([
  SelectionState.LOCKED,
  SelectionState.DISABLED
]);

function normalizeId(id, name = "id") {
  if (id === null || id === undefined || id === "") return null;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new TypeError(`${name} must be a string, number, or null`);
  }
  return String(id);
}

function sortedFrozen(values) {
  return Object.freeze([...values].sort());
}

function snapshotsEqual(left, right) {
  return left.state === right.state
    && left.activeId === right.activeId
    && left.selectedId === right.selectedId
    && left.focusedId === right.focusedId
    && left.hoveredId === right.hoveredId
    && left.pendingProposalIds.join("\u0000") === right.pendingProposalIds.join("\u0000")
    && left.lockedIds.join("\u0000") === right.lockedIds.join("\u0000")
    && left.disabledIds.join("\u0000") === right.disabledIds.join("\u0000");
}

/**
 * DOM-independent interaction state. This controller records viewer intent only;
 * it never grants rights or mutates land, ownership, or proposal records.
 */
export class SelectionController {
  constructor() {
    this._listeners = new Set();
    this._pendingProposalIds = new Set();
    this._lockedIds = new Set();
    this._disabledIds = new Set();
    this._destroyed = false;
    this._revision = 0;
    this._selectedId = null;
    this._focusedId = null;
    this._hoveredId = null;
    this._activeId = null;
    this._preferredState = SelectionState.NONE;
    this._snapshot = this._buildSnapshot();
  }

  snapshot() {
    return this._snapshot;
  }

  getSelectedId() {
    return this._selectedId;
  }

  getFocusedId() {
    return this._focusedId;
  }

  getHoveredId() {
    return this._hoveredId;
  }

  select(id, options = {}) {
    this._assertActive();
    const nextId = normalizeId(id);
    if (nextId === null) return this.clear("selection", { reason: options.reason ?? "select-clear" });

    const requestedState = options.state ?? SelectionState.SELECTED;
    if (![SelectionState.SELECTED, SelectionState.LOCKED, SelectionState.DISABLED, SelectionState.PENDING_PROPOSAL].includes(requestedState)) {
      throw new RangeError("select state must be SELECTED, LOCKED, DISABLED, or PENDING_PROPOSAL");
    }

    this._selectedId = nextId;
    this._activeId = nextId;
    this._preferredState = requestedState;
    if (requestedState === SelectionState.LOCKED) this._lockedIds.add(nextId);
    if (requestedState === SelectionState.DISABLED) this._disabledIds.add(nextId);
    if (requestedState === SelectionState.PENDING_PROPOSAL) this._pendingProposalIds.add(nextId);
    return this._commit(options.reason ?? "select");
  }

  hover(id, options = {}) {
    this._assertActive();
    const nextId = normalizeId(id);
    this._hoveredId = nextId;
    if (nextId === null) {
      this._useBestRemainingTarget();
    } else {
      this._activeId = nextId;
      this._preferredState = SelectionState.HOVERED;
    }
    return this._commit(options.reason ?? (nextId ? "hover" : "hover-clear"));
  }

  focus(id, options = {}) {
    this._assertActive();
    const nextId = normalizeId(id);
    this._focusedId = nextId;
    if (nextId === null) {
      this._useBestRemainingTarget();
    } else {
      this._activeId = nextId;
      this._preferredState = SelectionState.FOCUSED;
    }
    return this._commit(options.reason ?? (nextId ? "focus" : "focus-clear"));
  }

  markProposal(id, pending = true, options = {}) {
    this._assertActive();
    const targetId = normalizeId(id);
    if (targetId === null) throw new TypeError("proposal id is required");

    if (pending) this._pendingProposalIds.add(targetId);
    else this._pendingProposalIds.delete(targetId);

    if (pending) {
      this._activeId = targetId;
      this._preferredState = SelectionState.PENDING_PROPOSAL;
    } else if (this._activeId === targetId && this._preferredState === SelectionState.PENDING_PROPOSAL) {
      this._useBestRemainingTarget();
    }
    return this._commit(options.reason ?? (pending ? "proposal-pending" : "proposal-cleared"));
  }

  setObjectState(id, state = SelectionState.NONE, options = {}) {
    this._assertActive();
    const targetId = normalizeId(id);
    if (targetId === null) throw new TypeError("object id is required");
    if (![SelectionState.NONE, SelectionState.LOCKED, SelectionState.DISABLED].includes(state)) {
      throw new RangeError("object state must be NONE, LOCKED, or DISABLED");
    }

    this._lockedIds.delete(targetId);
    this._disabledIds.delete(targetId);
    if (state === SelectionState.LOCKED) this._lockedIds.add(targetId);
    if (state === SelectionState.DISABLED) this._disabledIds.add(targetId);

    if (state !== SelectionState.NONE) {
      this._activeId = targetId;
      this._preferredState = state;
    } else if (this._activeId === targetId && CONSTRAINED_STATES.has(this._preferredState)) {
      this._useBestRemainingTarget();
    }
    return this._commit(options.reason ?? "object-state");
  }

  clear(scope = "all", options = {}) {
    this._assertActive();
    const scopes = new Set(Array.isArray(scope) ? scope : [scope]);
    const validScopes = new Set(["all", "selection", "focus", "hover", "proposal", "constraints"]);
    for (const value of scopes) {
      if (!validScopes.has(value)) throw new RangeError(`unknown clear scope: ${value}`);
    }

    if (scopes.has("all") || scopes.has("selection")) this._selectedId = null;
    if (scopes.has("all") || scopes.has("focus")) this._focusedId = null;
    if (scopes.has("all") || scopes.has("hover")) this._hoveredId = null;
    if (scopes.has("all") || scopes.has("proposal")) this._pendingProposalIds.clear();
    if (scopes.has("all") || scopes.has("constraints")) {
      this._lockedIds.clear();
      this._disabledIds.clear();
    }
    this._useBestRemainingTarget();
    return this._commit(options.reason ?? `clear-${[...scopes].join("-")}`);
  }

  subscribe(listener, { emitCurrent = true } = {}) {
    this._assertActive();
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    this._listeners.add(listener);
    if (emitCurrent) listener(this._snapshot, Object.freeze({ reason: "subscribe", previousSnapshot: null }));
    return () => this._listeners.delete(listener);
  }

  destroy() {
    this._listeners.clear();
    this._destroyed = true;
  }

  _useBestRemainingTarget() {
    if (this._selectedId !== null) {
      this._activeId = this._selectedId;
      this._preferredState = SelectionState.SELECTED;
    } else if (this._focusedId !== null) {
      this._activeId = this._focusedId;
      this._preferredState = SelectionState.FOCUSED;
    } else if (this._hoveredId !== null) {
      this._activeId = this._hoveredId;
      this._preferredState = SelectionState.HOVERED;
    } else {
      this._activeId = null;
      this._preferredState = SelectionState.NONE;
    }
  }

  _resolveState() {
    if (this._activeId === null) return SelectionState.NONE;
    if (this._disabledIds.has(this._activeId)) return SelectionState.DISABLED;
    if (this._lockedIds.has(this._activeId)) return SelectionState.LOCKED;
    if (this._pendingProposalIds.has(this._activeId)) return SelectionState.PENDING_PROPOSAL;
    return this._preferredState;
  }

  _buildSnapshot() {
    return Object.freeze({
      revision: this._revision,
      state: this._resolveState(),
      activeId: this._activeId,
      selectedId: this._selectedId,
      focusedId: this._focusedId,
      hoveredId: this._hoveredId,
      pendingProposalIds: sortedFrozen(this._pendingProposalIds),
      lockedIds: sortedFrozen(this._lockedIds),
      disabledIds: sortedFrozen(this._disabledIds)
    });
  }

  _commit(reason) {
    const previousSnapshot = this._snapshot;
    const candidate = this._buildSnapshot();
    if (snapshotsEqual(previousSnapshot, candidate)) return previousSnapshot;

    this._revision += 1;
    this._snapshot = this._buildSnapshot();
    const event = Object.freeze({ reason, previousSnapshot });
    for (const listener of [...this._listeners]) {
      try {
        listener(this._snapshot, event);
      } catch (error) {
        globalThis.console?.error?.("Selection subscriber failed", error);
      }
    }
    return this._snapshot;
  }

  _assertActive() {
    if (this._destroyed) throw new Error("SelectionController has been destroyed");
  }
}

export function createSelectionController(options) {
  return new SelectionController(options);
}
