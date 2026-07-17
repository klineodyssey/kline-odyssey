import { createCameraController } from "./camera/camera-controller.js";
import { createBuildingRuntime } from "./building/building-runtime.js";
import { createCivilizationRuntime } from "./civilization/civilization-runtime.js";
import { createCivilizationView } from "./civilization/civilization-view.js";
import { loadSyntheticWorld } from "./data/world-store.js";
import { createGenesisView } from "./genesis/genesis-view.js";
import { createInputController } from "./input/input-controller.js";
import { createInspectorView } from "./inspector/inspector-view.js";
import { createLandRuntime } from "./land/land-runtime.js";
import { createLifeRuntime } from "./life/life-runtime.js";
import { createLifeOsViewer, resolveLifeProfiles } from "./life/life-os-viewer.js";
import { createLodController } from "./lod/lod-controller.js";
import { createPlayerController } from "./player/player-controller.js";
import { createMapRenderer, getItemBounds } from "./renderer/map-renderer.js";
import { createRoomRuntime } from "./room/room-runtime.js";
import { createSelectionController } from "./selection/selection-controller.js";
import { createContextMenu } from "./ui/context-menu.js";
import { createShell } from "./ui/shell.js";

const canvas = document.getElementById("world-canvas");
const inspectorContent = document.getElementById("inspector-content");
const contextHost = document.getElementById("context-menu-host");
const inspectorKind = document.getElementById("inspector-kind");
const inspectorTitle = document.getElementById("inspector-title");
const accessList = document.getElementById("entity-access-list");
const genesisDialog = document.getElementById("genesis-dialog");

let world;
let inspectorWorld;
let worldIndex;
let player = null;
let mockLocationConsent = false;
let proposal = null;
let activeLifeProfile = null;
let mode = "WORLD";
let frameRequested = false;
let lastMetrics = null;
let landRuntime = null;
let buildingRuntime = null;
let roomRuntime = null;
let lifeRuntime = null;
let civilizationRuntime = null;
let playerController = null;
const selectedLandRevisions = new Map();

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
let civilizationView = null;
let genesisView = null;
let contextMenu = null;

const shell = createShell({
  onBack: () => navigateBack(),
  onWorld: () => navigateWorld(),
  onHome: () => focusHome(),
  onZoomIn: () => camera.zoomAtScreenPoint(1.22, viewportCenter()),
  onZoomOut: () => camera.zoomAtScreenPoint(1 / 1.22, viewportCenter()),
  onLogin: () => handleMockLogin(),
  onMockSession: (decision) => startMockSession(decision),
  onMode: (nextMode) => setMode(nextMode),
  onBreadcrumb: (index) => navigateBreadcrumb(index),
  onDiscardProposal: () => discardProposal(),
  onEnterSelected: () => activateEntity(currentEntity()),
  onPlayerStep: (direction) => movePlayer(direction),
  onSimulationAdvance: () => advanceSimulation(),
  onSimulationAuto: () => toggleSimulation(),
  onLandUndo: () => changeLandHistory("UNDO"),
  onLandRedo: () => changeLandHistory("REDO"),
  onLandSave: () => saveLandDraft(),
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

function entityType(entity) {
  return String(entity?.type ?? entity?.object_type ?? "");
}

function resolveEntityContext(entity = currentEntity()) {
  const type = entityType(entity);
  const roomId = type === "ROOM" ? entity?.id : entity?.room_id ?? null;
  const room = roomId ? worldIndex?.get(String(roomId)) : null;
  const buildingId = type === "BUILDING"
    ? entity?.id
    : entity?.building_id ?? room?.parent_id ?? null;
  const building = buildingId ? worldIndex?.get(String(buildingId)) : null;
  const parcelId = type === "LAND_PARCEL"
    ? entity?.id
    : entity?.parcel_id ?? building?.parent_id ?? null;
  return {
    type,
    parcelId: parcelId ? String(parcelId) : null,
    buildingId: buildingId ? String(buildingId) : null,
    roomId: roomId ? String(roomId) : null
  };
}

function landSnapshot(parcelId) {
  if (!landRuntime || !parcelId) return null;
  const requestedRevision = selectedLandRevisions.get(parcelId) ?? null;
  try {
    return landRuntime.getParcelSnapshot(parcelId, requestedRevision);
  } catch {
    selectedLandRevisions.delete(parcelId);
    return landRuntime.getParcelSnapshot(parcelId);
  }
}

function runtimeProjection(entity = currentEntity()) {
  const context = resolveEntityContext(entity);
  const buildingSnapshots = context.buildingId
    ? [buildingRuntime?.getBuildingSnapshot(context.buildingId)].filter(Boolean)
    : context.parcelId
      ? buildingRuntime?.listByParcel(context.parcelId) ?? []
      : [];
  const roomSnapshots = context.roomId
    ? [roomRuntime?.getRoomSnapshot(context.roomId)].filter(Boolean)
    : context.buildingId
      ? roomRuntime?.listByBuilding(context.buildingId) ?? []
      : buildingSnapshots.flatMap(({ buildingId }) => roomRuntime?.listByBuilding(buildingId) ?? []);
  const lifeSnapshots = lifeRuntime?.listSnapshots().filter((snapshot) => {
    if (context.type === "LIFE_PROFILE") return snapshot.life_id === String(entity.id);
    if (context.roomId) return snapshot.room_id === context.roomId;
    if (context.buildingId) return snapshot.building_id === context.buildingId;
    if (context.parcelId) return snapshot.parcel_id === context.parcelId;
    return false;
  }) ?? [];
  return {
    land: context.parcelId ? [landSnapshot(context.parcelId)].filter(Boolean) : [],
    building: buildingSnapshots,
    room: roomSnapshots,
    player: playerController ? [playerController.getSnapshot()] : [],
    life: lifeSnapshots
  };
}

function profileWithRuntime(profile) {
  if (!profile || !lifeRuntime) return profile;
  let snapshot;
  try {
    snapshot = lifeRuntime.getSnapshot(profile.id ?? profile.life_id ?? profile.profile_id);
  } catch {
    return profile;
  }
  return {
    ...profile,
    age_days: snapshot.age_days,
    inventory: snapshot.inventory,
    vitals: {
      ...profile.vitals,
      health: snapshot.health,
      food: snapshot.food,
      water: snapshot.water,
      energy: snapshot.energy
    },
    individual_life_os: {
      ...profile.individual_life_os,
      life_state: snapshot.life_state,
      activity_state: snapshot.activity_state,
      health_state: snapshot.health_state,
      state_version: snapshot.revision
    }
  };
}

function interactionState() {
  const snapshot = selection.snapshot();
  return {
    selectedId: snapshot.selectedId,
    hoveredId: snapshot.hoveredId,
    focusedId: snapshot.focusedId,
    player: playerController?.getSnapshot() ?? null
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
    document.documentElement.dataset.worldViewerPlayerMarker = String(lastMetrics.player_marker_drawn === true);
    document.documentElement.dataset.worldViewerLifeMarkers = String(lastMetrics.life_markers_drawn ?? 0);
    document.documentElement.dataset.worldViewerLifeEntities = String(lastMetrics.life_entities_drawn ?? 0);
    document.documentElement.dataset.worldViewerPlayerEntity = String(
      playerController?.getSnapshot().currentEntity?.id ?? "NONE"
    );
    document.documentElement.dataset.worldViewerSceneEntity = String(lod.getScene().current?.id ?? "NONE");
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

function syncAccessibleScene(snapshot = selection.snapshot()) {
  for (const option of accessList.querySelectorAll("[data-entity-id]")) {
    const selected = option.dataset.entityId === snapshot.selectedId;
    const focused = option.dataset.entityId === snapshot.focusedId;
    option.setAttribute("aria-selected", String(selected));
    option.classList.toggle("is-selected", selected);
    option.classList.toggle("is-focused", focused);
  }
}

function renderAccessibleScene(scene) {
  const activeElement = document.activeElement;
  const hadSceneFocus = accessList.contains(activeElement);
  const previouslyFocusedId = hadSceneFocus ? activeElement?.dataset?.entityId : null;
  accessList.replaceChildren();
  for (const entity of scene.items) {
    const option = document.createElement("button");
    option.type = "button";
    option.setAttribute("role", "option");
    option.dataset.entityId = String(entity.id);
    option.setAttribute("aria-selected", String(selection.snapshot().selectedId === String(entity.id)));
    option.textContent = `${entity.type}: ${entity.label}`;
    option.addEventListener("focus", () => {
      activeLifeProfile = null;
      selection.focus(entity.id, { reason: "a11y-focus" });
    });
    option.addEventListener("click", () => selectEntity(entity));
    option.addEventListener("dblclick", () => activateEntity(entity));
    option.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (selection.snapshot().selectedId === String(entity.id)) {
          activateEntity(entity);
        } else {
          selectEntity(entity);
        }
      } else if ((event.key === "F10" && event.shiftKey) || event.key === "ContextMenu") {
        event.preventDefault();
        openContext({ hit: entity, point: viewportCenter() });
      }
    });
    accessList.append(option);
  }
  syncAccessibleScene();

  if (hadSceneFocus) {
    const options = [...accessList.querySelectorAll("[data-entity-id]")];
    const nextFocus = options.find(({ dataset }) => dataset.entityId === previouslyFocusedId)
      ?? options.find(({ dataset }) => dataset.entityId === selection.snapshot().selectedId)
      ?? options[0];
    requestAnimationFrame(() => nextFocus?.focus({ preventScroll: true }));
  }
}

function renderInspector() {
  if (!world) return;
  const entity = currentEntity() ?? lod.getScene().current ?? world.earth;

  if (mode === "CIVILIZATION") {
    inspectorKind.textContent = "CIVILIZATION";
    inspectorTitle.textContent = "Hsinchu Living District";
    civilizationView.render(civilizationRuntime.getSnapshot());
  } else if (mode === "LIFE") {
    if (activeLifeProfile) {
      const runtimeProfile = profileWithRuntime(activeLifeProfile);
      inspectorKind.textContent = "LIFE";
      inspectorTitle.textContent = runtimeProfile.display_name
        ?? runtimeProfile.label
        ?? runtimeProfile.name
        ?? runtimeProfile.id
        ?? "Life OS";
      lifeViewer.render({ profile: runtimeProfile });
    } else {
      inspectorKind.textContent = entity.type ?? entity.object_type ?? "LIFE";
      inspectorTitle.textContent = entity.label ?? entity.id ?? "Life OS";
      const profiles = resolveLifeProfiles({ world: inspectorWorld, selection: entity.id })
        .map(profileWithRuntime);
      lifeViewer.render({ resolvedProfiles: profiles });
    }
  } else {
    inspectorKind.textContent = entity.type ?? entity.object_type ?? "WORLD";
    inspectorTitle.textContent = entity.label ?? entity.id ?? "World Viewer";
    inspector.open({
      world: inspectorWorld,
      selection: entity.id,
      proposal,
      viewerState: {
        lod: lod.getState().level,
        visibility: entity.status ?? "VISIBLE",
        frame_metrics: lastMetrics
      },
      runtime: runtimeProjection(entity)
    });
  }
  syncCommandState();
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
  renderInspector();
  shell.setInspectorOpen(true);
}

function selectEntity(entity) {
  activeLifeProfile = null;
  if (!entity) {
    selection.clear(["selection", "focus"], { reason: "canvas-empty" });
    shell.setCoordinates("K280 / --");
    return;
  }
  selection.select(entity.id, { reason: "viewer-select" });
  inspectorContent.scrollTop = 0;
  const parcelId = resolveEntityContext(entity).parcelId;
  if ((proposal?.parcel_id ?? null) !== parcelId) syncProposalForParcel(parcelId);
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
  if (entityType(entity) === "LIFE_PROFILE") {
    openLifeProfile(entity, entity);
    return;
  }
  selectEntity(entity);
  const result = lod.enter(entity.id);
  if (!result.ok) {
    shell.showToast(result.reason === "DEEPEST_LEVEL" ? "Deepest viewer layer reached" : "This object cannot be entered", "neutral");
  } else {
    if (playerController?.getSnapshot().sessionActive) {
      playerController.enter(result.state.scene.current ?? entity);
    }
    if (matchMedia("(max-width: 900px)").matches) shell.setInspectorOpen(false);
  }
}

function navigateBack() {
  contextMenu?.close("NAVIGATION");
  const result = lod.back();
  if (!result.ok) {
    shell.showToast("Already at Earth K280", "neutral");
  } else {
    if (playerController?.getSnapshot().sessionActive) playerController.enter(result.state.scene.current);
    selectEntity(result.state.scene.current);
  }
}

function navigateWorld() {
  contextMenu?.close("NAVIGATION");
  lod.world();
  if (playerController?.getSnapshot().sessionActive) playerController.enter(world.earth);
  selectEntity(world.earth);
}

function navigateBreadcrumb(targetIndex) {
  const state = lod.getState();
  const steps = Math.max(0, state.path.length - 1 - targetIndex);
  for (let index = 0; index < steps; index += 1) lod.back();
  if (playerController?.getSnapshot().sessionActive) playerController.enter(lod.getScene().current);
  selectEntity(lod.getScene().current);
}

function updateStarterParcelStatus(statusOverride = null) {
  const parcelId = player?.starter_parcel_id ?? null;
  const parcel = parcelId ? worldIndex?.get(parcelId) : null;
  shell.setStarterParcel({
    sessionActive: Boolean(player),
    parcelId,
    status: statusOverride ?? parcel?.status ?? (player ? "UNAVAILABLE" : null),
    locationConsent: mockLocationConsent
  });
}

function syncProposalForParcel(parcelId) {
  if (proposal) selection.markProposal(proposal.parcel_id, false, { reason: "proposal-sync" });
  proposal = parcelId ? landRuntime?.getActiveDraft(parcelId) ?? null : null;
  if (proposal) selection.markProposal(proposal.parcel_id, true, { reason: "proposal-sync" });
  shell.setProposal(proposal);
}

function canEnterEntity(entity) {
  if (!entity || !lod) return false;
  if (entityType(entity) === "LIFE_PROFILE") return true;
  return lod.getScene().items.some(({ id }) => String(id) === String(entity.id));
}

function syncCommandState() {
  if (!world || !lod) return;
  const entity = currentEntity();
  const playerState = playerController?.getSnapshot() ?? null;
  const context = resolveEntityContext(entity);
  const snapshot = landSnapshot(context.parcelId);
  const activeDraft = snapshot?.active_draft ?? null;
  shell.setPlayerHud({
    sessionActive: Boolean(playerState?.sessionActive),
    location: playerState?.currentEntity?.label ?? playerState?.currentEntity?.id ?? null,
    movement: playerState?.movementState ?? null,
    worldRevision: snapshot?.local_parcel_version ?? playerState?.revision ?? 0
  });
  shell.setPlayerControls({
    canEnter: Boolean(playerState?.sessionActive && canEnterEntity(entity)),
    canMove: Boolean(playerState?.sessionActive),
    canAdvance: Boolean(playerState?.sessionActive && civilizationRuntime)
  });
  shell.setLandControls({
    canUndo: snapshot?.can_undo === true,
    canRedo: snapshot?.can_redo === true,
    canSave: Boolean(activeDraft && activeDraft.local_saved !== true),
    dirty: Boolean(activeDraft && activeDraft.local_saved !== true)
  });
}

function focusHome() {
  if (!player) {
    shell.showToast("Mock login is required to focus a starter parcel", "warning");
    return;
  }
  const result = lod.home();
  if (!result.ok) {
    updateStarterParcelStatus("UNAVAILABLE");
    shell.showToast("Starter parcel is unavailable", "warning");
    return;
  }
  updateStarterParcelStatus();
  shell.setMode("LAND");
  mode = "LAND";
  const parcel = worldIndex.get(player.starter_parcel_id);
  if (playerController?.getSnapshot().sessionActive) playerController.enter(parcel);
  syncProposalForParcel(player.starter_parcel_id);
  selectEntity(parcel);
  shell.setInspectorOpen(true);
}

function startMockSession({ locationConsent = false } = {}) {
  if (!world || player) return;
  mockLocationConsent = Boolean(locationConsent);
  player = Object.freeze({
    ...world.player,
    location_consent: mockLocationConsent,
    location_mode: mockLocationConsent ? world.player.location_mode : "NOT_USED"
  });
  shell.setLoggedIn(player);
  let genesisSnapshot;
  try {
    genesisSnapshot = civilizationRuntime.beginGenesis().genesis;
  } catch (error) {
    updateStarterParcelStatus("BIRTH_BLOCKED");
    shell.showToast(`Genesis verification failed: ${error.message}`, "error");
    return;
  }
  if (!genesisSnapshot.completed) {
    updateStarterParcelStatus("BIRTH_PENDING");
    genesisView.open(genesisSnapshot);
    shell.showToast("Complete Civilization Genesis before entering Earth K280.", "neutral");
    return;
  }
  activatePlayerSession();
}

function activatePlayerSession() {
  if (!player || playerController.getSnapshot().sessionActive) return;
  genesisView.close();
  lod.setHomeParcel(player.starter_parcel_id);
  playerController.startSession(player, worldIndex.get(player.starter_parcel_id));
  updateStarterParcelStatus();
  focusHome();
  shell.showToast(
    mockLocationConsent
      ? "Mock session loaded with voluntary synthetic location consent."
      : "Mock session loaded without location. Starter Parcel opened.",
    "success"
  );
}

function claimGenesisFortune(amount) {
  if (!player || !civilizationRuntime) return;
  genesisView.setBusy(true);
  try {
    const snapshot = civilizationRuntime.claimGenesisFortune(amount);
    genesisView.update(snapshot.genesis);
    shell.showToast(`${amount} prototype KGEN and the Starter Survival Pack were recorded.`, "success");
  } catch (error) {
    shell.showToast(error.message, "warning");
  } finally {
    genesisView.setBusy(false);
  }
}

function endMockSession() {
  genesisView?.close();
  civilizationRuntime?.stop();
  shell.setSimulationRunning(false);
  playerController?.endSession();
  player = null;
  mockLocationConsent = false;
  activeLifeProfile = null;
  shell.setLoggedIn(null);
  updateStarterParcelStatus();
  syncProposalForParcel(null);
  navigateWorld();
  shell.showToast(
    proposal ? "Mock session ended. Local proposal draft retained." : "Mock session ended.",
    "neutral"
  );
}

function handleMockLogin() {
  if (player) {
    endMockSession();
  } else {
    shell.openMockConsent();
  }
}

function movePlayer(direction) {
  const deltas = {
    UP: [0, -28],
    DOWN: [0, 28],
    LEFT: [-28, 0],
    RIGHT: [28, 0]
  };
  const delta = deltas[direction];
  if (!delta || !playerController?.getSnapshot().sessionActive) return;
  playerController.walkBy(delta[0], delta[1]);
  shell.announce(`Player moved ${direction.toLowerCase()}`);
}

function advanceSimulation() {
  advanceCivilization(60);
}

function activeSessionRequired() {
  if (playerController?.getSnapshot().sessionActive) return true;
  shell.showToast("Start the mock player session before changing Civilization Alpha.", "warning");
  return false;
}

function advanceCivilization(minutes) {
  if (!civilizationRuntime || !activeSessionRequired()) return;
  try {
    civilizationRuntime.advance(minutes);
    shell.showToast(`Civilization advanced by ${minutes >= 1440 ? `${minutes / 1440} day` : `${minutes / 60} hour`}.`, "success");
  } catch (error) {
    shell.showToast(error.message, "warning");
  }
}

function toggleSimulation() {
  if (!civilizationRuntime || !activeSessionRequired()) return;
  const current = civilizationRuntime.getSnapshot().running;
  if (current) civilizationRuntime.stop();
  else civilizationRuntime.start({ intervalMs: 1000, minutesPerTick: 60 });
  shell.setSimulationRunning(!current);
  shell.showToast(current ? "Civilization time paused." : "Civilization time is running.", "success");
}

function civilizationAction(action, successMessage) {
  if (!civilizationRuntime || !activeSessionRequired()) return;
  try {
    action();
    shell.showToast(successMessage, "success");
  } catch (error) {
    shell.showToast(error.message, "warning");
  }
}

function performLifeAction(action, snapshot) {
  const lifeId = snapshot?.life_id ?? snapshot?.lifeId ?? snapshot?.id;
  if (!lifeId) return;
  try {
    lifeRuntime.act(lifeId, action);
    shell.showToast(`${action} recorded for ${snapshot.display_name ?? lifeId}.`, "success");
  } catch (error) {
    shell.showToast(error.message, "warning");
  }
}

function selectedParcelId() {
  return resolveEntityContext().parcelId ?? proposal?.parcel_id ?? null;
}

function changeLandHistory(direction) {
  const parcelId = selectedParcelId();
  if (!parcelId || !landRuntime) return;
  const result = direction === "UNDO"
    ? landRuntime.undo(parcelId)
    : landRuntime.redo(parcelId);
  proposal = result;
  selectedLandRevisions.delete(parcelId);
  syncProposalForParcel(parcelId);
  renderInspector();
  shell.showToast(result ? `${direction} restored a local land draft.` : `Nothing to ${direction.toLowerCase()}.`, "neutral");
}

function saveLandDraft() {
  const parcelId = selectedParcelId();
  if (!parcelId || !landRuntime) return;
  try {
    const saved = landRuntime.saveDraft(parcelId);
    proposal = saved;
    syncProposalForParcel(parcelId);
    renderInspector();
    shell.showToast(saved ? "Draft saved locally. Registry ownership remains unchanged." : "No active draft to save.", saved ? "success" : "neutral");
  } catch (error) {
    shell.showToast(error.message, "warning");
  }
}

function selectLandRevision(revision) {
  const parcelId = selectedParcelId();
  const revisionId = revision?.revision_id ?? revision?.id ?? null;
  if (!parcelId || !revisionId) return;
  selectedLandRevisions.set(parcelId, revisionId);
  renderInspector();
  shell.showToast(`Revision ${revisionId} opened read-only.`, "neutral");
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
  if (proposal) {
    selection.markProposal(proposal.parcel_id, false, { reason: "proposal-replaced" });
  }
  proposal = landRuntime.setDraft(draft);
  selectedLandRevisions.delete(draft.parcel_id);
  selection.markProposal(draft.parcel_id, true, { reason: "local-proposal" });
  shell.setProposal(proposal);
  renderInspector();
  shell.showToast("Local proposal draft created. No registry data was changed.", "success");
}

function discardProposal() {
  if (!proposal) return;
  const parcelId = proposal.parcel_id;
  selection.markProposal(parcelId, false, { reason: "proposal-discarded" });
  landRuntime.discardDraft(parcelId);
  proposal = landRuntime.getActiveDraft(parcelId);
  shell.setProposal(proposal);
  renderInspector();
}

function handleTransientBack() {
  if (contextMenu?.isOpen()) {
    contextMenu.close("ESCAPE");
    return true;
  }
  return false;
}

function resizeViewer() {
  const rect = canvas.parentElement.getBoundingClientRect();
  camera.resizeViewport(rect.width, rect.height, Math.min(devicePixelRatio || 1, 3));
}

function resolveLifeSource(profile, sourceProfile) {
  if (sourceProfile) return sourceProfile;
  const candidateIds = new Set([
    profile?.profileId,
    profile?.lifeId,
    profile?.individualId
  ].filter(Boolean).map(String));
  return world?.lifeProfiles?.find((candidate) => (
    [candidate.id, candidate.profile_id, candidate.life_id, candidate.individual_id]
      .filter(Boolean)
      .some((id) => candidateIds.has(String(id)))
  )) ?? null;
}

function openLifeProfile(profile, sourceProfile) {
  activeLifeProfile = resolveLifeSource(profile, sourceProfile);
  if (!activeLifeProfile) {
    shell.showToast("The selected Life profile is unavailable", "warning");
    return;
  }
  shell.setMode("LIFE");
  setMode("LIFE");
  inspectorContent.scrollTop = 0;
  shell.announce(`${profile.displayName ?? activeLifeProfile.label ?? "Life profile"} opened`);
}

function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

async function start() {
  const loaded = await loadSyntheticWorld();
  ({ world, inspectorWorld, index: worldIndex } = loaded);
  const storage = safeLocalStorage();
  landRuntime = createLandRuntime({
    world,
    storage,
    storageKey: `${world.meta.storage_namespace}.land`
  });
  buildingRuntime = createBuildingRuntime({ world });
  roomRuntime = createRoomRuntime({ world, buildingRuntime });
  lifeRuntime = createLifeRuntime({
    world,
    storage,
    storageKey: `${world.meta.storage_namespace}.life`
  });
  playerController = createPlayerController({ world });
  civilizationRuntime = createCivilizationRuntime({
    world,
    lifeRuntime,
    buildingRuntime,
    storage,
    storagePrefix: `${world.meta.storage_namespace}.civilization`
  });
  genesisView = createGenesisView(genesisDialog, {
    onClaim: (amount) => claimGenesisFortune(amount),
    onEnterWorld: () => activatePlayerSession(),
    onCancel: () => endMockSession()
  });
  lod = createLodController({ ...world, homeParcelId: world.player.starter_parcel_id });
  renderer = createMapRenderer(canvas, { maxVisibleItems: 250 });
  lifeViewer = createLifeOsViewer(inspectorContent, {
    onAction: (action, projection) => {
      const snapshot = lifeRuntime.getSnapshot(projection.lifeId);
      performLifeAction(action, snapshot);
    }
  });
  civilizationView = createCivilizationView(inspectorContent, {
    onAdvance: (minutes) => advanceCivilization(minutes),
    onBuy: (listingId, quantity) => civilizationAction(
      () => civilizationRuntime.buy(listingId, quantity),
      "Prototype purchase completed in the local synthetic ledger."
    ),
    onPlant: (plotId, cropId) => civilizationAction(
      () => civilizationRuntime.plant(plotId, cropId),
      `${cropId} planted on the Starter Parcel.`
    ),
    onHarvest: (plotId) => civilizationAction(
      () => civilizationRuntime.harvest(plotId),
      "Harvest moved into the local farm warehouse."
    ),
    onSellHarvest: (resourceId, quantity) => civilizationAction(
      () => civilizationRuntime.sellHarvest(resourceId, quantity),
      `${resourceId} sold through the prototype market.`
    ),
    onCollectFacility: (facilityId) => civilizationAction(
      () => civilizationRuntime.collectFacility(facilityId),
      "Agriculture Organism output moved into bounded local storage."
    ),
    onRunProduction: () => civilizationAction(
      () => civilizationRuntime.runProductionCycle(),
      "Factory cycle completed through the synthetic supply chain."
    ),
    onSellCompanyProduct: (productId, quantity) => civilizationAction(
      () => civilizationRuntime.sellCompanyProduct(productId, quantity),
      "Synthetic product sale recorded in the prototype company ledger."
    ),
    onExchangeReview: (candidateId) => civilizationAction(
      () => civilizationRuntime.requestExchangeReview(candidateId),
      "K11520 review requested. No listing or trade was executed."
    ),
    onRunSettlement: () => civilizationAction(
      () => civilizationRuntime.runSettlementCycle(),
      "Salary, tax, and rent settled in the balanced KAIOS Credit ledger."
    ),
    onRegisterMarriage: () => civilizationAction(
      () => civilizationRuntime.registerMarriage(),
      "Marriage registered with mutual synthetic consent."
    ),
    onRegisterBirth: () => civilizationAction(
      () => civilizationRuntime.registerBirth(),
      "Birth registered after food, water, housing, and ecology checks."
    ),
    onSettleInheritance: () => civilizationAction(
      () => civilizationRuntime.settleInheritance(),
      "Inheritance settled once through the KAIOS Credit ledger."
    ),
    onDispatchLogistics: (routeId, resourceId, quantity, direction) => civilizationAction(
      () => civilizationRuntime.dispatchLogistics(routeId, resourceId, quantity, direction),
      direction === "DOMESTIC" ? "Domestic shipment delivered." : "Export request stopped at the official settlement gate."
    ),
    onRecoverEcology: (waterUnits, effort) => civilizationAction(
      () => civilizationRuntime.recoverEcology(waterUnits, effort),
      "Water-backed ecology recovery completed."
    ),
    onAdvanceEvolution: (speciesId, pathway) => civilizationAction(
      () => civilizationRuntime.advanceSpeciesEvolution(speciesId, pathway),
      `${speciesId} gained reviewed ${pathway.toLowerCase()} evidence. GA unlocks remain compatibility gated.`
    ),
    onSpeciesReproduction: (speciesId, mode) => civilizationAction(
      () => civilizationRuntime.requestSpeciesReproduction(speciesId, mode),
      mode === "CLONE" ? "Clone proposal recorded for review. No population was created." : "Synthetic lineage event recorded without direct population mutation."
    ),
    onRequestKgen: (amount) => civilizationAction(
      () => civilizationRuntime.requestKgenSettlement(amount),
      "KGEN settlement request created. No blockchain transfer occurred."
    ),
    onRequestExternal: (asset, amount) => civilizationAction(
      () => civilizationRuntime.requestExternalSettlement(asset, amount),
      `${asset} settlement request created. No fiat transfer occurred.`
    ),
    onRequestMortgage: () => civilizationAction(
      () => civilizationRuntime.requestMortgage(),
      "Mortgage architecture proposal created. No debt was issued."
    ),
    onRequestInsurance: () => civilizationAction(
      () => civilizationRuntime.requestInsurance(),
      "Insurance architecture proposal created. No policy was issued."
    ),
    onRunGovernance: () => civilizationAction(
      () => civilizationRuntime.runGovernanceCycle(),
      "Citizen rights and public authority completed a synthetic governance review."
    ),
    onFundService: (serviceId, amount) => civilizationAction(
      () => civilizationRuntime.fundPublicService(serviceId, amount),
      `${serviceId} received ${amount} KAIOS Credit through the balanced public ledger.`
    ),
    onSubmitJustice: (lawId) => civilizationAction(
      () => civilizationRuntime.submitJusticeCase(lawId),
      `${lawId} case proposal recorded. No penalty or Citizen mutation was executed.`
    ),
    onRunDrill: (hazardType) => civilizationAction(
      () => civilizationRuntime.runResilienceDrill(hazardType),
      `${hazardType} synthetic drill completed with evidence and review.`
    ),
    onRunResilienceRecovery: (effort) => civilizationAction(
      () => civilizationRuntime.runResilienceRecovery(effort),
      "Synthetic resilience recovery completed."
    )
  });
  inspector = createInspectorView({
    container: inspectorContent,
    onClose: () => shell.setInspectorOpen(false),
    onOpenLife: (profile, _projection, sourceProfile) => openLifeProfile(profile, sourceProfile),
    onUndoLand: () => changeLandHistory("UNDO"),
    onRedoLand: () => changeLandHistory("REDO"),
    onSaveDraft: () => saveLandDraft(),
    onSelectRevision: (revision) => selectLandRevision(revision),
    onEnterEntity: (snapshot) => {
      const id = snapshot?.buildingId ?? snapshot?.roomId ?? snapshot?.id;
      activateEntity(id ? worldIndex.get(String(id)) : null);
    },
    onLifeAction: (action, snapshot) => performLifeAction(action, snapshot)
  });
  contextMenu = createContextMenu({
    host: contextHost,
    actions: world.proposalActions,
    sourceSnapshotId: world.meta?.snapshot_id,
    sourceGeometryRevision: world.meta?.source_revision,
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
  landRuntime.subscribe(({ parcel_id: parcelId }) => {
    selectedLandRevisions.delete(String(parcelId));
    if (resolveEntityContext().parcelId === parcelId) syncProposalForParcel(parcelId);
    renderInspector();
    scheduleRender();
  });
  lifeRuntime.subscribe(() => {
    renderInspector();
    scheduleRender();
  });
  civilizationRuntime.subscribe(({ snapshot }) => {
    shell.setSimulationClock(snapshot.clock);
    shell.setSimulationRunning(snapshot.running);
    document.documentElement.dataset.civilizationReady = "true";
    document.documentElement.dataset.civilizationTime = snapshot.clock.timestamp;
    document.documentElement.dataset.civilizationActivity = snapshot.citizen.current_activity;
    document.documentElement.dataset.civilizationAiAction = snapshot.aiWorker.current_action;
    document.documentElement.dataset.civilizationCity = snapshot.city.status;
    document.documentElement.dataset.civilizationStage = snapshot.civilization_progress.stage_id;
    document.documentElement.dataset.civilizationBalance = String(snapshot.economy.player_balance);
    document.documentElement.dataset.populationTotal = String(snapshot.population.metrics.population);
    document.documentElement.dataset.populationFamilies = String(snapshot.population.metrics.families);
    document.documentElement.dataset.settlementCurrency = snapshot.settlement.executable_currency;
    document.documentElement.dataset.settlementRequests = String(snapshot.settlement.asset_requests.length);
    document.documentElement.dataset.logisticsStatus = snapshot.logistics.status;
    document.documentElement.dataset.logisticsPollution = String(snapshot.logistics.pollution);
    document.documentElement.dataset.logisticsJobs = String(snapshot.logistics.jobs.length);
    document.documentElement.dataset.mortgageProposals = String(snapshot.settlement.mortgage_proposals.length);
    document.documentElement.dataset.insuranceProposals = String(snapshot.settlement.insurance_proposals.length);
    document.documentElement.dataset.governmentCycles = String(snapshot.government.cycle_count);
    document.documentElement.dataset.biologyReady = String(snapshot.biology?.registry_count > 0);
    document.documentElement.dataset.biologySpecies = String(snapshot.biology?.registry_count ?? 0);
    document.documentElement.dataset.biologyAtoms = String(snapshot.biology?.evolution?.catalog?.atoms?.length ?? 0);
    document.documentElement.dataset.biologyHumanAtoms = String(snapshot.biology?.registry?.find(({ species_id: id }) => id === "HUMAN_ALPHA")?.evolution?.active_atom_ids?.length ?? 0);
    document.documentElement.dataset.biologyReproduction = String(snapshot.biology?.reproduction?.history?.length ?? 0);
    document.documentElement.dataset.foodChainV2 = String(Object.keys(snapshot.ecosystem?.population_balance?.role_counts ?? {}).length === 7);
    document.documentElement.dataset.citizenRights = String(snapshot.government.citizen_rights.length);
    document.documentElement.dataset.justiceCases = String(snapshot.government.justice.cases.length);
    document.documentElement.dataset.publicServices = String(snapshot.public_services.services.length);
    document.documentElement.dataset.publicServiceQuality = String(snapshot.city.public_services);
    document.documentElement.dataset.publicTreasury = String(snapshot.public_services.public_finance.public_service_balance);
    document.documentElement.dataset.resilienceReadiness = String(snapshot.resilience.readiness_score);
    document.documentElement.dataset.resilienceDrills = String(snapshot.resilience.drills.length);
    document.documentElement.dataset.ecosystemStatus = snapshot.ecosystem.food_chain_status;
    document.documentElement.dataset.factoryStatus = snapshot.production.factory.status;
    document.documentElement.dataset.productionTotal = String(snapshot.production.factory.total_produced);
    document.documentElement.dataset.companyStatus = snapshot.ai_company.company.status;
    document.documentElement.dataset.genesisStage = snapshot.genesis.stage;
    document.documentElement.dataset.genesisComplete = String(snapshot.genesis.completed);
    if (mode === "CIVILIZATION") renderInspector();
    scheduleRender();
  }, { emitCurrent: true });
  playerController.subscribe(() => {
    syncCommandState();
    renderInspector();
    scheduleRender();
  }, { emitCurrent: false });
  selection.subscribe((snapshot) => {
    syncAccessibleScene(snapshot);
    renderInspector();
    scheduleRender();
  });
  lod.subscribe(updateLodUi);
  resizeViewer();
  camera.fitWorld(48);
  selection.select(world.earth.id, { reason: "initial-world" });
  shell.setReady(true);
  shell.setLoggedIn(null);
  updateStarterParcelStatus();
  shell.setCoordinates("K280 / Earth surface shell");
  shell.setSimulationClock(civilizationRuntime.getSnapshot().clock);
  shell.showToast("Civilization Alpha ready", "success");
}

start().catch((error) => {
  console.error(error);
  shell.showFatal(error);
});

window.addEventListener("beforeunload", () => {
  input?.destroy();
  selection.destroy();
  renderer?.destroy();
  landRuntime?.destroy();
  civilizationRuntime?.destroy();
  lifeRuntime?.destroy();
  playerController?.destroy();
  shell.destroy();
}, { once: true });
