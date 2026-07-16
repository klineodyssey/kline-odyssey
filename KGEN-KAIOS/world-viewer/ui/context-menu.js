export const APPROVED_PROPOSAL_ACTION_IDS = Object.freeze([
  "RESIDENTIAL",
  "FARM",
  "FOREST",
  "MARKETPLACE",
  "FACTORY",
  "TEMPLE",
  "RESEARCH",
  "PUBLIC_FACILITY"
]);

const ACTION_GLYPHS = Object.freeze({
  RESIDENTIAL: "R",
  FARM: "F",
  FOREST: "T",
  MARKETPLACE: "M",
  FACTORY: "X",
  TEMPLE: "S",
  RESEARCH: "Q",
  PUBLIC_FACILITY: "P"
});

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function proposalId(parcelId) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `LAND-PROP-${parcelId}-${random}`;
}

function normalizeProposalActions(actions) {
  if (!Array.isArray(actions)) throw new TypeError("Validated world.proposalActions are required");
  const normalized = actions.map((action) => {
    const id = String(typeof action === "string" ? action : action?.id ?? "").toUpperCase();
    const label = typeof action === "object" && action?.label ? String(action.label) : id;
    return Object.freeze({ id, label, glyph: ACTION_GLYPHS[id] ?? id.slice(0, 1) });
  });
  const orderedIds = normalized.map(({ id }) => id);
  const uniqueIds = new Set(orderedIds);
  const exactMatch = orderedIds.length === APPROVED_PROPOSAL_ACTION_IDS.length
    && uniqueIds.size === APPROVED_PROPOSAL_ACTION_IDS.length
    && APPROVED_PROPOSAL_ACTION_IDS.every((id) => uniqueIds.has(id));
  if (!exactMatch) {
    throw new Error(`world.proposalActions must be ${APPROVED_PROPOSAL_ACTION_IDS.join(", ")}`);
  }
  const byId = new Map(normalized.map((action) => [action.id, action]));
  return Object.freeze(APPROVED_PROPOSAL_ACTION_IDS.map((id) => byId.get(id)));
}

function delegateId(entry) {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === "string" || typeof entry === "number") return String(entry);
  return entry.requester_id ?? entry.player_id ?? entry.delegate_id ?? entry.id ?? null;
}

function entries(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function requesterRole(parcel, requesterId) {
  if (requesterId === null || requesterId === undefined) return null;
  const id = String(requesterId);
  if (String(parcel.owner_id ?? parcel.owner ?? "") === id) return "OWNER";
  const delegates = [
    ...entries(parcel.delegate_ids),
    ...entries(parcel.delegated_requester_ids),
    ...entries(parcel.delegated_governor_ids),
    ...entries(parcel.authorized_requester_ids),
    ...entries(parcel.delegates)
  ].map(delegateId).filter(Boolean).map(String);
  return delegates.includes(id) ? "DELEGATE" : null;
}

export function createContextMenu({
  host,
  actions,
  sourceSnapshotId = "UNKNOWN",
  sourceGeometryRevision = "SYNTHETIC-1",
  onDraft,
  onClose,
  getRequesterId
}) {
  if (!host) throw new Error("Context menu host is required");
  const proposalActions = normalizeProposalActions(actions);

  let menu = null;
  let previousFocus = null;
  let activeParcel = null;

  function close(reason = "CLOSED") {
    if (!menu) return;
    const closing = menu;
    menu = null;
    activeParcel = null;
    closing.remove();
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
    onClose?.(reason);
  }

  function keepFocusInside(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close("ESCAPE");
      return;
    }
    if (event.key !== "Tab" || !menu) return;
    const controls = [...menu.querySelectorAll("button:not([disabled])")];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function buildDraft(parcel, requestedLandUse, requesterId, role) {
    return {
      proposal_id: proposalId(parcel.id),
      proposal_type: "LAND_USE_PROPOSAL",
      parcel_id: parcel.id,
      requester_id: requesterId,
      requester_role: role,
      requested_land_use: requestedLandUse,
      current_land_use: parcel.land_use ?? "UNKNOWN",
      reason: "LOCAL_PREVIEW",
      estimated_cost: "UNKNOWN",
      environment_impact: "REVIEW_REQUIRED",
      neighbor_impact: "REVIEW_REQUIRED",
      required_permissions: ["OWNER_OR_DELEGATE", "LAND_USE_REVIEW"],
      evidence: [],
      source_snapshot_id: parcel.snapshot_id || sourceSnapshotId,
      source_geometry_revision: parcel.geometry_revision || sourceGeometryRevision,
      review_status: "DRAFT_LOCAL",
      created_at: new Date().toISOString(),
      persisted: false
    };
  }

  function placeDesktop(element, x, y) {
    const margin = 12;
    element.style.left = `${Math.max(margin, x)}px`;
    element.style.top = `${Math.max(margin, y)}px`;
    requestAnimationFrame(() => {
      const box = element.getBoundingClientRect();
      element.style.left = `${Math.max(margin, Math.min(x, window.innerWidth - box.width - margin))}px`;
      element.style.top = `${Math.max(margin, Math.min(y, window.innerHeight - box.height - margin))}px`;
    });
  }

  function open({ x = 0, y = 0, parcel, mobile = false }) {
    close("REPLACED");
    if (!parcel) return;
    previousFocus = document.activeElement;
    activeParcel = parcel;

    menu = makeElement("div", mobile ? "context-menu action-sheet" : "context-menu");
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", `Land use proposal for ${parcel.label || parcel.id}`);
    menu.addEventListener("keydown", keepFocusInside);

    const header = makeElement("header", "context-menu-header");
    const heading = makeElement("div", "context-menu-heading");
    heading.append(makeElement("strong", "", "Proposal Only"));
    heading.append(makeElement("span", "", parcel.label || parcel.id));
    const closeButton = makeElement("button", "context-menu-close", "X");
    closeButton.type = "button";
    closeButton.setAttribute("role", "menuitem");
    closeButton.setAttribute("aria-label", "Close land use proposal menu");
    closeButton.addEventListener("click", () => close("BUTTON"));
    header.append(heading, closeButton);
    menu.append(header);

    const requesterId = getRequesterId?.() ?? null;
    const role = requesterRole(parcel, requesterId);
    const canPropose = role !== null
      && parcel.capabilities?.includes("PROPOSE")
      && parcel.status === "ACTIVE";
    const grid = makeElement("div", "context-menu-grid");
    for (const action of proposalActions) {
      const button = makeElement("button", "context-action");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.disabled = !canPropose;
      button.title = canPropose
        ? `${action.label}: Proposal Only`
        : "Read-only: owner or delegate proposal permission required";
      button.setAttribute("aria-label", `${action.id}, Proposal Only${canPropose ? "" : ", unavailable"}`);
      const icon = makeElement("span", "context-action-icon", action.glyph);
      icon.setAttribute("aria-hidden", "true");
      const copy = makeElement("span", "context-action-copy");
      copy.append(
        makeElement("strong", "", action.id),
        makeElement("small", "", "Proposal Only")
      );
      button.append(icon, copy);
      button.addEventListener("click", () => {
        if (!canPropose || activeParcel !== parcel) return;
        onDraft?.(buildDraft(parcel, action.id, requesterId, role));
        close("DRAFT_CREATED");
      });
      grid.append(button);
    }
    menu.append(grid);

    const note = makeElement(
      "p",
      `context-menu-note${canPropose ? " is-authorized" : ""}`,
      canPropose
        ? `${role} access / local draft only`
        : requesterId
          ? "Read only / owner or delegate required"
          : "Mock login required / owner or delegate only"
    );
    note.setAttribute("role", "status");
    menu.append(note);

    host.append(menu);
    if (!mobile) placeDesktop(menu, x, y);
    requestAnimationFrame(() => {
      const target = menu?.querySelector(".context-action:not([disabled])")
        ?? menu?.querySelector(".context-menu-close");
      target?.focus();
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (menu && !menu.contains(event.target)) close("OUTSIDE");
  }, true);

  return {
    open,
    close,
    isOpen: () => Boolean(menu),
    getActiveParcel: () => activeParcel,
    actions: proposalActions
  };
}
