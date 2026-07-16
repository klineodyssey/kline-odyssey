import { loadSyntheticWorld } from "./data-loader.js";
import { createCamera } from "./camera.js";
import { createSelection } from "./selection.js";
import { renderInspector } from "./inspector.js";
import { createContextMenu } from "./context-menu.js";
import { setupAccessibility } from "./accessibility.js";

const state = {
  world: null,
  proposalDraft: null,
  loggedIn: false,
  semanticLevel: "parcel"
};

async function main() {
  const svg = document.getElementById("map-svg");
  const inspector = document.getElementById("inspector");
  const breadcrumb = document.getElementById("breadcrumb");
  const proposalBanner = document.getElementById("proposal-banner");

  state.world = await loadSyntheticWorld();
  renderMap(svg, state.world);
  const camera = createCamera();
  const cameraApi = camera.bind(svg);
  const selection = createSelection();

  const contextMenu = createContextMenu(state.world, (draft) => {
    state.proposalDraft = draft;
    proposalBanner.hidden = false;
    proposalBanner.textContent = `Local proposal draft: ${draft.land_use} on ${draft.parcel_id} (cleared on refresh)`;
    renderInspector(inspector, state.world, selection.get(), state.proposalDraft);
  });

  selection.onChange((id) => {
    selection.applyVisual(svg);
    renderInspector(inspector, state.world, id, state.proposalDraft);
    const p = state.world.parcels.find((x) => x.id === id);
    breadcrumb.textContent = p
      ? `Earth / ${state.world.region.label} / ${state.world.cityOverlay.label} / ${p.label}`
      : `Earth / ${state.world.region.label} / ${state.world.cityOverlay.label}`;
  });

  svg.addEventListener("click", (e) => {
    if (camera.didPan()) return;
    const target = e.target.closest("[data-parcel-id]");
    if (!target) return;
    selection.select(target.getAttribute("data-parcel-id"));
  });

  svg.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const target = e.target.closest("[data-parcel-id]");
    if (!target) return;
    const parcel = state.world.parcels.find((p) => p.id === target.getAttribute("data-parcel-id"));
    if (parcel) contextMenu.show(e.clientX, e.clientY, parcel);
  });

  setupAccessibility({
    svg,
    selection,
    cameraApi,
    parcels: state.world.parcels,
    onLogin: () => {
      state.loggedIn = true;
      selection.select(state.world.homeParcelId);
    }
  });

  breadcrumb.textContent = `Earth / ${state.world.region.label} / ${state.world.cityOverlay.label}`;
  renderInspector(inspector, state.world, null, null);
}

function renderMap(svg, world) {
  svg.innerHTML = "";
  const ns = "http://www.w3.org/2000/svg";
  world.parcels.forEach((p) => {
    const g = document.createElementNS(ns, "g");
    g.setAttribute("data-parcel-id", p.id);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", p.label);

    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", p.viewer.x);
    rect.setAttribute("y", p.viewer.y);
    rect.setAttribute("width", p.viewer.w);
    rect.setAttribute("height", p.viewer.h);
    rect.setAttribute("rx", "8");
    rect.classList.add("parcel-shape");
    if (p.status === "UNKNOWN") rect.classList.add("parcel-unknown");
    if (p.status === "RESTRICTED") rect.classList.add("parcel-restricted");
    if (p.status === "STALE") rect.classList.add("parcel-stale");
    if (p.land_use === "RESIDENTIAL") rect.classList.add("use-residential");
    if (p.land_use === "FARM") rect.classList.add("use-farm");
    if (p.land_use === "FOREST") rect.classList.add("use-forest");

    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", p.viewer.x + 12);
    text.setAttribute("y", p.viewer.y + 28);
    text.textContent = p.label;

    g.appendChild(rect);
    g.appendChild(text);
    svg.appendChild(g);
  });
}

main().catch((err) => {
  const el = document.getElementById("load-error");
  if (el) {
    el.hidden = false;
    el.textContent = String(err);
  }
  console.error(err);
});
