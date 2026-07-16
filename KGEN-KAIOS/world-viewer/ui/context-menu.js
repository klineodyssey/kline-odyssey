const LAND_USE_ACTIONS = [
  ["RESIDENTIAL", "R", "Residential"],
  ["FARM", "F", "Farm"],
  ["FOREST", "T", "Forest"],
  ["FACTORY", "X", "Factory"],
  ["MARKETPLACE", "M", "Marketplace"],
  ["TEMPLE", "S", "Temple"],
  ["MINE", "N", "Mine"],
  ["ROAD", "D", "Road"]
];

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

export function createContextMenu({ host, onDraft, onClose, getRequesterId }) {
  if (!host) throw new Error("Context menu host is required");

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

  function buildDraft(parcel, requestedLandUse, requesterId) {
    return {
      proposal_id: proposalId(parcel.id),
      proposal_type: "LAND_USE_PROPOSAL",
      parcel_id: parcel.id,
      requester_id: requesterId,
      requested_land_use: requestedLandUse,
      current_land_use: parcel.land_use ?? "UNKNOWN",
      reason: "LOCAL_PREVIEW",
      estimated_cost: "UNKNOWN",
      environment_impact: "REVIEW_REQUIRED",
      neighbor_impact: "REVIEW_REQUIRED",
      required_permissions: ["OWNER_OR_DELEGATED_GOVERNOR", "LAND_USE_REVIEW"],
      evidence: [],
      source_snapshot_id: parcel.snapshot_id || "WV-SYNTHETIC-20260716-001",
      source_geometry_revision: parcel.geometry_revision || "SYNTHETIC-1",
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
    header.append(makeElement("strong", "", "Land use proposal"));
    header.append(makeElement("span", "", parcel.label || parcel.id));
    menu.append(header);

    const requesterId = getRequesterId?.() ?? null;
    const requesterAuthorized = requesterId !== null && (
      parcel.owner_id === requesterId
      || parcel.authorized_requester_ids?.includes(requesterId)
    );
    const canPropose = requesterAuthorized
      && parcel.capabilities?.includes("PROPOSE")
      && parcel.status === "ACTIVE";
    const grid = makeElement("div", "context-menu-grid");
    for (const [id, glyph, label] of LAND_USE_ACTIONS) {
      const button = makeElement("button", "context-action");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.disabled = !canPropose;
      if (!canPropose) button.title = "Read-only: proposal permission unavailable";
      const icon = makeElement("span", "context-action-icon", glyph);
      icon.setAttribute("aria-hidden", "true");
      button.append(icon, makeElement("span", "", label));
      button.addEventListener("click", () => {
        if (!canPropose || activeParcel !== parcel) return;
        onDraft?.(buildDraft(parcel, id, requesterId));
        close("DRAFT_CREATED");
      });
      grid.append(button);
    }
    menu.append(grid);

    if (!canPropose) {
      const note = makeElement(
        "p",
        "context-menu-note",
        requesterId ? "Read-only parcel" : "Mock login required for proposal access"
      );
      note.setAttribute("role", "status");
      menu.append(note);
    }

    host.append(menu);
    if (!mobile) placeDesktop(menu, x, y);
    requestAnimationFrame(() => menu?.querySelector("button:not([disabled])")?.focus());
  }

  document.addEventListener("pointerdown", (event) => {
    if (menu && !menu.contains(event.target)) close("OUTSIDE");
  }, true);

  return {
    open,
    close,
    isOpen: () => Boolean(menu),
    getActiveParcel: () => activeParcel,
    actions: LAND_USE_ACTIONS.map(([id, , label]) => ({ id, label }))
  };
}
