function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing shell element: ${id}`);
  return element;
}

export function createShell(callbacks = {}) {
  const elements = {
    shell: byId("app-shell"),
    breadcrumbs: byId("breadcrumbs"),
    level: byId("level-badge"),
    coordinates: byId("coordinate-readout"),
    live: byId("a11y-live"),
    toast: byId("toast-region"),
    loading: byId("loading-state"),
    fatal: byId("fatal-error"),
    login: byId("login-button"),
    consentDialog: byId("mock-consent-dialog"),
    consentInput: byId("mock-location-consent"),
    consentAccept: byId("mock-consent-accept"),
    starterStatus: byId("starter-parcel-status"),
    starterState: byId("starter-parcel-state"),
    starterDetail: byId("starter-parcel-detail"),
    commandCenter: byId("player-command-center"),
    playerLocation: byId("player-hud-location"),
    playerMovement: byId("player-hud-movement"),
    worldRevision: byId("world-revision-value"),
    simulationClock: byId("simulation-clock-value"),
    enterSelected: byId("enter-selected-button"),
    stepUp: byId("player-step-up-button"),
    stepLeft: byId("player-step-left-button"),
    stepRight: byId("player-step-right-button"),
    stepDown: byId("player-step-down-button"),
    simulationAdvance: byId("simulation-advance-button"),
    simulationAuto: byId("simulation-auto-button"),
    landUndo: byId("land-undo-button"),
    landRedo: byId("land-redo-button"),
    landSave: byId("land-save-button"),
    inspector: byId("inspector-panel"),
    inspectorToggle: byId("inspector-toggle"),
    proposalBar: byId("proposal-bar"),
    proposalSummary: byId("proposal-summary")
  };
  const cleanup = [];
  let toastTimer = null;
  let theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

  function listen(id, event, handler) {
    const element = byId(id);
    element.addEventListener(event, handler);
    cleanup.push(() => element.removeEventListener(event, handler));
  }

  listen("back-button", "click", () => callbacks.onBack?.());
  listen("world-button", "click", () => callbacks.onWorld?.());
  listen("home-button", "click", () => callbacks.onHome?.());
  listen("zoom-in-button", "click", () => callbacks.onZoomIn?.());
  listen("zoom-out-button", "click", () => callbacks.onZoomOut?.());
  listen("login-button", "click", () => callbacks.onLogin?.());
  listen("mock-location-consent", "change", () => {
    elements.consentAccept.disabled = !elements.consentInput.checked;
  });
  listen("mock-consent-dialog", "close", () => {
    elements.login.setAttribute("aria-expanded", "false");
    const decision = elements.consentDialog.returnValue;
    const accepted = decision === "with-location" && elements.consentInput.checked;
    if (decision === "without-location" || accepted) {
      callbacks.onMockSession?.({ locationConsent: accepted });
    } else {
      callbacks.onMockConsentCancel?.();
    }
    elements.consentInput.checked = false;
    elements.consentAccept.disabled = true;
  });
  listen("inspector-close", "click", () => setInspectorOpen(false));
  listen("inspector-toggle", "click", () => setInspectorOpen(!elements.inspector.classList.contains("is-open")));
  listen("proposal-discard", "click", () => callbacks.onDiscardProposal?.());
  listen("enter-selected-button", "click", () => callbacks.onEnterSelected?.());
  listen("player-step-up-button", "click", () => callbacks.onPlayerStep?.("UP"));
  listen("player-step-left-button", "click", () => callbacks.onPlayerStep?.("LEFT"));
  listen("player-step-right-button", "click", () => callbacks.onPlayerStep?.("RIGHT"));
  listen("player-step-down-button", "click", () => callbacks.onPlayerStep?.("DOWN"));
  listen("simulation-advance-button", "click", () => callbacks.onSimulationAdvance?.());
  listen("simulation-auto-button", "click", () => callbacks.onSimulationAuto?.());
  listen("land-undo-button", "click", () => callbacks.onLandUndo?.());
  listen("land-redo-button", "click", () => callbacks.onLandRedo?.());
  listen("land-save-button", "click", () => callbacks.onLandSave?.());
  listen("theme-button", "click", () => {
    theme = theme === "dark" ? "light" : "dark";
    elements.shell.dataset.theme = theme;
    callbacks.onTheme?.(theme);
    announce(`${theme} theme`);
  });

  for (const button of document.querySelectorAll("[data-mode]")) {
    const handler = () => {
      const mode = button.dataset.mode;
      setMode(mode);
      callbacks.onMode?.(mode);
    };
    button.addEventListener("click", handler);
    cleanup.push(() => button.removeEventListener("click", handler));
  }

  function setBreadcrumbs(items) {
    elements.breadcrumbs.replaceChildren();
    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      button.disabled = index === items.length - 1;
      button.addEventListener("click", () => callbacks.onBreadcrumb?.(index, item));
      elements.breadcrumbs.append(button);
      if (index < items.length - 1) {
        const separator = document.createElement("span");
        separator.textContent = "/";
        separator.setAttribute("aria-hidden", "true");
        elements.breadcrumbs.append(separator);
      }
    });
  }

  function setMode(mode) {
    for (const button of document.querySelectorAll("[data-mode]")) {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    elements.shell.dataset.mode = mode;
  }

  function setInspectorOpen(open) {
    elements.inspector.classList.toggle("is-open", open);
    elements.inspector.setAttribute("aria-expanded", String(open));
    elements.inspectorToggle.setAttribute("aria-label", open ? "Collapse inspector" : "Expand inspector");
    callbacks.onInspector?.(open);
  }

  function announce(message) {
    elements.live.textContent = "";
    requestAnimationFrame(() => { elements.live.textContent = message; });
  }

  function showToast(message, tone = "info") {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.dataset.tone = tone;
    elements.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
  }

  function dismissToast() {
    clearTimeout(toastTimer);
    elements.toast.classList.remove("is-visible");
  }

  function setProposal(proposal) {
    elements.proposalBar.hidden = !proposal;
    elements.proposalSummary.textContent = proposal
      ? `${proposal.requested_land_use} / ${proposal.parcel_id} / ${proposal.review_status} / local only`
      : "";
  }

  function setLoggedIn(player) {
    elements.login.textContent = player ? "End mock session" : "Mock login";
    elements.login.classList.toggle("is-authenticated", Boolean(player));
    elements.login.setAttribute("aria-label", player
      ? `End mock session for ${player.display_name}`
      : "Open mock login and voluntary location consent");
    elements.login.setAttribute("aria-expanded", "false");
  }

  function setStarterParcel({ sessionActive = false, parcelId = null, status = null, locationConsent = false } = {}) {
    const state = sessionActive ? (status || "UNKNOWN") : "NOT LOADED";
    elements.starterStatus.dataset.state = state;
    elements.starterState.textContent = parcelId && sessionActive ? `${state} / ${parcelId}` : state;
    elements.starterDetail.textContent = sessionActive
      ? `Synthetic fixture / mock location ${locationConsent ? "consented" : "not used"} / no GPS or KYC`
      : "Mock login required / no GPS or KYC";
  }

  function setPlayerHud({ sessionActive = false, location = null, movement = null, worldRevision = null } = {}) {
    elements.commandCenter.dataset.session = sessionActive ? "active" : "inactive";
    elements.playerLocation.textContent = displayValue(location, sessionActive ? "UNKNOWN" : "OFFLINE");
    elements.playerMovement.textContent = displayMovement(movement);
    setWorldRevision(worldRevision);
  }

  function setWorldRevision(revision) {
    const value = displayValue(revision, "R0");
    elements.worldRevision.textContent = /^R/i.test(value) ? value : `R${value}`;
  }

  function setSimulationClock(snapshot = null) {
    if (!snapshot) {
      elements.simulationClock.textContent = "--:--";
      return;
    }
    const hour = Number(snapshot.hour ?? snapshot.hour_of_day ?? 0);
    const minute = Number(snapshot.minute ?? snapshot.minute_of_hour ?? 0);
    const day = Number(snapshot.day ?? snapshot.day_of_year ?? 1);
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    elements.simulationClock.textContent = `D${day} ${time}`;
    elements.simulationClock.title = `${snapshot.season ?? "SEASON"} / week ${snapshot.week ?? 1} / year ${snapshot.year ?? 1}`;
  }

  function setSimulationRunning(running) {
    elements.simulationAuto.setAttribute("aria-pressed", String(Boolean(running)));
    elements.simulationAuto.classList.toggle("is-active", Boolean(running));
    elements.simulationAuto.title = running ? "Pause time" : "Run time";
    elements.simulationAuto.setAttribute("aria-label", running
      ? "Pause automatic civilization time"
      : "Start automatic civilization time");
  }

  function setPlayerControls({ canEnter = false, canMove = false, canAdvance = false } = {}) {
    elements.enterSelected.disabled = !canEnter;
    elements.simulationAdvance.disabled = !canAdvance;
    elements.simulationAuto.disabled = !canAdvance;
    for (const button of [elements.stepUp, elements.stepLeft, elements.stepRight, elements.stepDown]) {
      button.disabled = !canMove;
    }
  }

  function setLandControls({ canUndo = false, canRedo = false, canSave = false, dirty = false } = {}) {
    elements.landUndo.disabled = !canUndo;
    elements.landRedo.disabled = !canRedo;
    elements.landSave.disabled = !canSave;
    elements.commandCenter.dataset.dirty = String(Boolean(dirty));
  }

  function openMockConsent() {
    if (elements.consentDialog.open) return false;
    elements.consentDialog.returnValue = "cancel";
    elements.consentInput.checked = false;
    elements.consentAccept.disabled = true;
    elements.login.setAttribute("aria-expanded", "true");
    if (typeof elements.consentDialog.showModal === "function") {
      elements.consentDialog.showModal();
    } else {
      elements.consentDialog.setAttribute("open", "");
    }
    requestAnimationFrame(() => elements.consentInput.focus({ preventScroll: true }));
    return true;
  }

  function closeMockConsent() {
    if (!elements.consentDialog.open) return false;
    elements.consentDialog.close("cancel");
    return true;
  }

  function setReady(ready) {
    elements.loading.hidden = ready;
    elements.shell.classList.toggle("is-ready", ready);
    elements.login.disabled = !ready;
  }

  elements.shell.dataset.theme = theme;

  return {
    elements,
    setBreadcrumbs,
    setLevel: (level) => { elements.level.textContent = level; },
    setCoordinates: (value) => { elements.coordinates.textContent = value; },
    setMode,
    setInspectorOpen,
    setProposal,
    setLoggedIn,
    setStarterParcel,
    setPlayerHud,
    setWorldRevision,
    setSimulationClock,
    setSimulationRunning,
    setPlayerControls,
    setLandControls,
    openMockConsent,
    closeMockConsent,
    setReady,
    announce,
    showToast,
    dismissToast,
    showFatal(error) {
      elements.fatal.hidden = false;
      elements.fatal.textContent = error instanceof Error ? error.message : String(error);
      setReady(true);
    },
    destroy() {
      cleanup.forEach((fn) => fn());
      if (elements.consentDialog.open) elements.consentDialog.close("cancel");
      clearTimeout(toastTimer);
    }
  };
}

function displayValue(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value !== "object") return fallback;

  const direct = value.label
    ?? value.location
    ?? value.entity_id
    ?? value.entityId
    ?? value.facing
    ?? value.state
    ?? value.revision;
  if (direct !== null && direct !== undefined && direct !== "") return String(direct);

  if (Number.isFinite(value.x) && Number.isFinite(value.y)) {
    return `${Number(value.x).toFixed(1)}, ${Number(value.y).toFixed(1)}`;
  }
  return fallback;
}

function displayMovement(value) {
  if (value && typeof value === "object") {
    const facing = value.facing ?? value.direction ?? value.state ?? null;
    const steps = value.step_count ?? value.stepCount ?? value.steps ?? null;
    if (facing && Number.isFinite(Number(steps))) return `${facing} / ${steps}`;
  }
  return displayValue(value, "IDLE");
}
