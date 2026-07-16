import { createCameraController } from "./camera/camera-controller.js";
import { loadSyntheticWorld } from "./data/world-store.js";
import { createInputController } from "./input/input-controller.js";
import { createInspectorView } from "./inspector/inspector-view.js";
import { createLifeOsViewer } from "./life/life-os-viewer.js";
import { createLodController } from "./lod/lod-controller.js";
import { createMapRenderer, getItemBounds } from "./renderer/map-renderer.js";
import { createSelectionController } from "./selection/selection-controller.js";
import { createContextMenu } from "./ui/context-menu.js";
import { createShell } from "./ui/shell.js";

const canvas = document.getElementById("world-canvas");
const inspectorContent = document.getElementById("inspector-content");
const contextHost = document.getElementById("context-menu-host");
const inspectorKind = document.getElementById("inspector-kind");
const inspectorTitle = document.getElementById("inspector-title");
const accessList = document.getElementById("entity-access-list");

let world;
let inspectorWorld;
let worldIndex;
let player = null;
let proposal = null;
let mode = "WORLD";
let frameRequested = false;
let lastMetrics = null;

const camera = createCameraController({
  worldBounds: [0, 0, 1200, 760],
  minZoom: 0.22,
  maxZoom: 6
});
const selection = createSelectionController();
let lod = null;
let renderer = null;
let input = null;
let inspector = null;
let lifeViewer = null;
let contextMenu = null;

const shell = createShell({
  onBack: () => navigateBack(),
  onWorld: () => navigateWorld(),
  onHome: () => focusHome(),
  onZoomIn: () => camera.zoomAtScreenPoint(1.22, viewportCenter()),
  onZoomOut: () => camera.zoomAtScreenPoint(1 / 1.22, viewportCenter()),
  onLogin: () => mockLogin(),
  onMode: (nextMode) => setMode(nextMode),
  onBreadcrumb: (index) => navigateBreadcrumb(index),
  onDiscardProposal: () => discardProposal(),
  onTheme: () => scheduleRender()
});

function viewportCenter() {
  const state = camera.getState();
  return { x: state.viewport_width / 2, y: state.viewport_height / 2 };
}

function currentEntity() {
  const snapshot = selection.snapshot();
  const activeId = snapshot.activeId ?? snapshot.selectedId;
  return activeId ? worldIndex?.get(String(activeId)) ?? lod?.getEntity(activeId) : null;
}

function interactionState() {
  const snapshot = selection.snapshot();
  return {
    selectedId: snapshot.selectedId,
    hoveredId: snapshot.hoveredId,
    focusedId: snapshot.focusedId
  };
}

function scheduleRender() {
  if (frameRequested || !renderer || !lod) return;
  frameRequested = true;
  requestAnimationFrame(() => {
    frameRequested = false;
    lastMetrics = renderer.render(lod.getScene(), camera.getState(), interactionState());
    document.documentElement.dataset.worldViewerRendered = "true";
    const cameraState = camera.getState();
    document.documentElement.dataset.worldViewerLevel = lod.getState().level;
    document.documentElement.dataset.worldViewerZoom = cameraState.zoom_level.toFixed(3);
    document.documentElement.dataset.worldViewerCamera = `${cameraState.camera_x.toFixed(2)},${cameraState.camera_y.toFixed(2)}`;
    document.documentElement.dataset.worldViewerRenderMs = String(lastMetrics.render_ms ?? "UNKNOWN");
    document.documentElement.dataset.worldViewerFps = String(lastMetrics.estimated_fps ?? "UNKNOWN");
  });
}

function fitScene() {
  const scene = lod.getScene();
  const items = scene.items;
  if (!items.length) {
    camera.fitBounds(scene.bounds, 36);
    return;
  }
  const bounds = items.map(getItemBounds);
  const minX = Math.min(...bounds.map(({ x }) => x));
  const minY = Math.min(...bounds.map(({ y }) => y));
  const maxX = Math.max(...bounds.map(({ x, width }) => x + width));
  const maxY = Math.max(...bounds.map(({ y, height }) => y + height));
  camera.fitBounds([minX, minY, maxX - minX, maxY - minY], 54);
}

function renderAccessibleScene(scene) {
  accessList.replaceChildren();
  for (const entity of scene.items) {
    const option = document.createElement("button");
    option.type = "button";
    option.setAttribute("role", "option");
    option.textContent = `${entity.type}: ${entity.label}`;
    option.addEventListener("focus", () => selection.focus(entity.id, { reason: "a11y-focus" }));
    option.addEventListener("click", () => selectEntity(entity));
    option.addEventListener("dblclick", () => activateEntity(entity));
    option.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        activateEntity(entity);
      } else if ((event.key === "F10" && event.shiftKey) || event.key === "ContextMenu") {
        event.preventDefault();
        openContext({ hit: entity, point: viewportCenter() });
      }
    });
    accessList.append(option);
  }
}

function renderInspector() {
  if (!world) return;
  const entity = currentEntity() ?? lod.getScene().current ?? world.earth;
  inspectorKind.textContent = entity.type ?? entity.object_type ?? "WORLD";
  inspectorTitle.textContent = entity.label ?? entity.id ?? "World Viewer";

  if (mode === "LIFE") {
    lifeViewer.render({ world: inspectorWorld, selection: entity.id });
  } else {
    inspector.open({
      world: inspectorWorld,
      selection: entity.id,
      proposal,
      viewerState: {
        lod: lod.getState().level,
        visibility: entity.status ?? "VISIBLE",
        frame_metrics: lastMetrics
      }
    });
  }
}

function updateLodUi(state) {
  shell.setBreadcrumbs(state.path);
  shell.setLevel(state.level === "LAND_PARCEL" ? "PARCEL" : state.level);
  renderAccessibleScene(state.scene);
  fitScene();
  renderInspector();
  shell.announce(`${state.level} layer, ${state.scene.items.length} visible objects`);
  scheduleRender();
}

function setMode(nextMode) {
  mode = nextMode;
  if (mode === "LIFE") {
    const entity = currentEntity() ?? lod?.getScene().current;
    if (entity) lifeViewer.render({ world: inspectorWorld, selection: entity.id });
  } else {
    renderInspector();
  }
  shell.setInspectorOpen(true);
}

function selectEntity(entity) {
  if (!entity) {
    selection.clear(["selection", "focus"], { reason: "canvas-empty" });
    shell.setCoordinates("K280 / --");
    return;
  }
  selection.select(entity.id, { reason: "viewer-select" });
  const coordinate = entity.coordinate;
  shell.setCoordinates(coordinate
    ? `K280 / ${coordinate.latitude_deg.toFixed(4)}, ${coordinate.longitude_deg.toFixed(4)}`
    : `K280 / ${entity.id}`);
  renderInspector();
  shell.setInspectorOpen(true);
  shell.announce(`${entity.label} selected`);
}

function selectFromInput(context) {
  const entity = context?.hit;
  selectEntity(entity);
  if (
    entity?.type === "LAND_PARCEL"
    && matchMedia("(max-width: 900px)").matches
  ) {
    camera.fitBounds(entity.view.bounds, 56);
  }
}

function activateEntity(entity) {
  if (!entity) return;
  selectEntity(entity);
  const result = lod.enter(entity.id);
  if (!result.ok) {
    shell.showToast(result.reason === "DEEPEST_LEVEL" ? "Deepest viewer layer reached" : "This object cannot be entered", "neutral");
  } else if (matchMedia("(max-width: 900px)").matches) {
    shell.setInspectorOpen(false);
  }
}

function navigateBack() {
  contextMenu?.close("NAVIGATION");
  const result = lod.back();
  if (!result.ok) {
    shell.showToast("Already at Earth K280", "neutral");
  } else {
    selectEntity(result.state.scene.current);
  }
}

function navigateWorld() {
  contextMenu?.close("NAVIGATION");
  lod.world();
  selectEntity(world.earth);
}

function navigateBreadcrumb(targetIndex) {
  const state = lod.getState();
  const steps = Math.max(0, state.path.length - 1 - targetIndex);
  for (let index = 0; index < steps; index += 1) lod.back();
  selectEntity(lod.getScene().current);
}

function focusHome() {
  if (!player) {
    shell.showToast("Mock login is required to focus a starter parcel", "warning");
    return;
  }
  const result = lod.home();
  if (!result.ok) {
    shell.showToast("Starter parcel is unavailable", "warning");
    return;
  }
  shell.setMode("LAND");
  mode = "LAND";
  selectEntity(worldIndex.get(player.starter_parcel_id));
}

function mockLogin() {
  player = player ? null : world.player;
  shell.setLoggedIn(player);
  if (player) {
    lod.setHomeParcel(player.starter_parcel_id);
    focusHome();
    shell.showToast("Synthetic player loaded. GPS remains mocked.", "success");
  } else {
    navigateWorld();
    shell.showToast("Mock session ended", "neutral");
  }
}

function openContext(context) {
  const entity = context?.hit;
  if (!entity || entity.type !== "LAND_PARCEL") {
    shell.showToast("Land-use proposals are available at the Parcel layer", "neutral");
    return;
  }
  selectEntity(entity);
  shell.dismissToast();
  const rect = canvas.getBoundingClientRect();
  contextMenu.open({
    x: rect.left + (context.point?.x ?? rect.width / 2),
    y: rect.top + (context.point?.y ?? rect.height / 2),
    parcel: entity,
    mobile: matchMedia("(max-width: 760px)").matches
  });
}

function acceptDraft(draft) {
  proposal = Object.freeze(draft);
  selection.markProposal(draft.parcel_id, true, { reason: "local-proposal" });
  shell.setProposal(proposal);
  renderInspector();
  shell.showToast("Local proposal draft created. No registry data was changed.", "success");
}

function discardProposal() {
  if (!proposal) return;
  selection.markProposal(proposal.parcel_id, false, { reason: "proposal-discarded" });
  proposal = null;
  shell.setProposal(null);
  renderInspector();
}

function handleTransientBack() {
  if (contextMenu?.isOpen()) {
    contextMenu.close("ESCAPE");
    return true;
  }
  if (proposal) {
    discardProposal();
    return true;
  }
  return false;
}

function resizeViewer() {
  const rect = canvas.getBoundingClientRect();
  camera.resizeViewport(rect.width, rect.height, Math.min(devicePixelRatio || 1, 3));
}

async function start() {
  const loaded = await loadSyntheticWorld();
  ({ world, inspectorWorld, index: worldIndex } = loaded);
  lod = createLodController({ ...world, homeParcelId: world.player.starter_parcel_id });
  renderer = createMapRenderer(canvas, { maxVisibleItems: 250 });
  lifeViewer = createLifeOsViewer(inspectorContent);
  inspector = createInspectorView({
    container: inspectorContent,
    onClose: () => shell.setInspectorOpen(false),
    onOpenLife: () => {
      shell.setMode("LIFE");
      setMode("LIFE");
    }
  });
  contextMenu = createContextMenu({
    host: contextHost,
    onDraft: acceptDraft,
    getRequesterId: () => player?.player_id ?? null
  });
  input = createInputController({
    element: canvas,
    camera,
    hitTest: (point) => renderer.hitTest(point, lod.getScene(), camera.getState(), { tolerancePx: 5 }),
    callbacks: {
      onSelect: selectFromInput,
      onActivate: ({ hit }) => activateEntity(hit),
      onContext: openContext,
      onTransientBack: handleTransientBack,
      onBack: navigateBack,
      getActiveTarget: () => currentEntity()
    }
  });

  new ResizeObserver(resizeViewer).observe(canvas.parentElement);
  camera.subscribe(scheduleRender);
  selection.subscribe(() => {
    renderInspector();
    scheduleRender();
  });
  lod.subscribe(updateLodUi);
  resizeViewer();
  camera.fitWorld(48);
  selection.select(world.earth.id, { reason: "initial-world" });
  shell.setReady(true);
  shell.setCoordinates("K280 / Earth surface shell");
  shell.showToast("World Viewer Sprint 001 ready", "success");
}

start().catch((error) => {
  console.error(error);
  shell.showFatal(error);
});

window.addEventListener("beforeunload", () => {
  input?.destroy();
  selection.destroy();
  renderer?.destroy();
  shell.destroy();
}, { once: true });
