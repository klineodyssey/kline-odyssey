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
  listen("inspector-close", "click", () => setInspectorOpen(false));
  listen("inspector-toggle", "click", () => setInspectorOpen(!elements.inspector.classList.contains("is-open")));
  listen("proposal-discard", "click", () => callbacks.onDiscardProposal?.());
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
      ? `${proposal.requested_land_use} / ${proposal.parcel_id} / ${proposal.review_status}`
      : "";
  }

  function setLoggedIn(player) {
    elements.login.textContent = player ? player.display_name : "Mock login";
    elements.login.classList.toggle("is-authenticated", Boolean(player));
  }

  function setReady(ready) {
    elements.loading.hidden = ready;
    elements.shell.classList.toggle("is-ready", ready);
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
      clearTimeout(toastTimer);
    }
  };
}
