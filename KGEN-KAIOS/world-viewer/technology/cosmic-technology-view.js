const PANELS = Object.freeze([
  ["TREE", "Tech Tree"],
  ["RESEARCH", "Research"],
  ["RESOURCES", "Resources"],
  ["FLEET", "Fleet"],
  ["ABILITIES", "Abilities"],
  ["COORDINATES", "Coordinates"],
  ["EXPLORATION", "Exploration"]
]);

let activePanel = "TREE";

function node(documentRef, tag, className = "", text = "") {
  const element = documentRef.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = String(text);
  return element;
}

function label(value, fallback = "UNKNOWN") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("_", " ");
}

function section(documentRef, title) {
  const result = node(documentRef, "section", "civilization-section technology-section");
  result.append(node(documentRef, "h2", "civilization-section__title", title));
  return result;
}

function action(documentRef, text, actionId, callback, disabled = false, primary = false) {
  const result = node(documentRef, "button", `civilization-action${primary ? " civilization-action--primary" : ""}`, text);
  result.type = "button";
  result.dataset.civilizationAction = actionId;
  result.disabled = disabled;
  result.addEventListener("click", callback);
  return result;
}

function facts(documentRef, rows) {
  const result = node(documentRef, "dl", "civilization-data");
  for (const [name, value] of rows) {
    const row = node(documentRef, "div");
    row.append(node(documentRef, "dt", "", name), node(documentRef, "dd", "", label(value)));
    result.append(row);
  }
  return result;
}

function renderTree(documentRef, model, callbacks) {
  const result = section(documentRef, "Technology Evolution");
  result.append(facts(documentRef, [
    ["Current Age", model.technology?.current_age_id],
    ["Unlocked", `${model.technology?.unlocked_count ?? 0} / 14`],
    ["Knowledge", model.research?.knowledge],
    ["Civilization XP", model.research?.civilization_experience]
  ]));
  const track = node(documentRef, "ol", "technology-age-track");
  for (const technology of model.technology?.nodes ?? []) {
    const item = node(documentRef, "li", "technology-age-card");
    item.dataset.unlocked = String(technology.unlocked === true);
    item.dataset.ready = String(technology.readiness?.ready === true);
    item.append(
      node(documentRef, "span", "technology-age-card__index", String(Number(technology.index) + 1).padStart(2, "0")),
      node(documentRef, "strong", "", technology.label),
      node(documentRef, "small", "", technology.technology_id),
      node(documentRef, "span", "technology-age-card__status", technology.unlocked ? "UNLOCKED" : technology.readiness?.ready ? "READY" : `${model.research?.research_points?.[technology.technology_id] ?? 0}/${technology.required_research_points}`)
    );
    const controls = node(documentRef, "div", "technology-card-actions");
    controls.append(
      action(documentRef, "Research", `RESEARCH_${technology.technology_id}`, () => callbacks.onCosmicResearch?.(technology.technology_id), technology.unlocked),
      action(documentRef, "Unlock", `UNLOCK_${technology.technology_id}`, () => callbacks.onCosmicUnlock?.(technology.technology_id), technology.unlocked || !technology.readiness?.ready, true)
    );
    item.append(controls);
    track.append(item);
  }
  result.append(track);
  return result;
}

function renderResearch(documentRef, model) {
  const result = section(documentRef, "Research Runtime");
  result.append(facts(documentRef, [
    ["Facilities", model.research?.facilities?.join(", ")],
    ["Roles", model.research?.roles?.join(", ")],
    ["Repositories", model.research?.repositories?.join(", ")],
    ["Evidence", model.research?.evidence?.length ?? 0]
  ]));
  const note = node(documentRef, "p", "technology-boundary-note", "Research, knowledge, civilization level, material, and energy must all pass before an unlock. No high technology is a player default.");
  result.append(note);
  return result;
}

function renderResources(documentRef, model, callbacks) {
  const result = section(documentRef, "Cosmic Material & Energy");
  const grid = node(documentRef, "div", "technology-resource-grid");
  for (const material of model.materials?.records ?? []) {
    const item = node(documentRef, "article", "technology-resource-card");
    item.append(node(documentRef, "strong", "", material.material_id), node(documentRef, "span", "", `${material.stock} / ${material.capacity}`), node(documentRef, "small", "", material.hazard_class));
    item.append(action(documentRef, "Survey", `SURVEY_${material.material_id}`, () => callbacks.onCosmicMaterial?.(material.material_id)));
    grid.append(item);
  }
  for (const energy of model.energy?.records ?? []) {
    const item = node(documentRef, "article", "technology-resource-card technology-resource-card--energy");
    item.append(node(documentRef, "strong", "", energy.energy_id), node(documentRef, "span", "", `${energy.reserve} / ${energy.capacity}`), node(documentRef, "small", "", energy.minimum_age));
    item.append(action(documentRef, "Generate", `GENERATE_${energy.energy_id}`, () => callbacks.onCosmicEnergy?.(energy.energy_id)));
    grid.append(item);
  }
  result.append(grid, node(documentRef, "p", "technology-boundary-note", "Uranium, antimatter, dark energy, and all advanced resources are abstract simulation records. No extraction or reaction instructions are present."));
  return result;
}

function renderFleet(documentRef, model, callbacks) {
  const result = section(documentRef, "Vehicle Runtime");
  const grid = node(documentRef, "div", "technology-list-grid");
  for (const vehicle of model.vehicles?.blueprints ?? []) {
    const card = node(documentRef, "article", "technology-list-card");
    const delegated = vehicle.external_timeline_runtime || vehicle.research_archetype_only;
    card.append(
      node(documentRef, "strong", "", label(vehicle.vehicle_id)),
      node(documentRef, "span", "", label(vehicle.required_technology)),
      node(documentRef, "small", "", vehicle.timeline_authority ? "SOLE TIMELINE TRANSPORT" : vehicle.readiness?.ready ? "BUILD READY" : "GATED")
    );
    card.append(action(documentRef, delegated ? "Timeline Gate" : "Build", `BUILD_${vehicle.vehicle_id}`, () => callbacks.onCosmicVehicle?.(vehicle.vehicle_id), delegated || !vehicle.readiness?.ready, !delegated));
    grid.append(card);
  }
  result.append(grid);
  return result;
}

function renderAbilities(documentRef, model, callbacks) {
  const result = section(documentRef, "Special Ability Runtime");
  const grid = node(documentRef, "div", "technology-list-grid");
  for (const ability of model.abilities?.abilities ?? []) {
    const card = node(documentRef, "article", "technology-list-card");
    card.dataset.unlocked = String(ability.unlocked === true);
    card.append(node(documentRef, "strong", "", label(ability.ability_id)), node(documentRef, "span", "", `${ability.training} / ${ability.required_training}`), node(documentRef, "small", "", ability.sandbox_proposal_only ? "SANDBOX PROPOSAL ONLY" : label(ability.status)));
    card.append(action(documentRef, "Train", `TRAIN_${ability.ability_id}`, () => callbacks.onCosmicAbility?.(ability.ability_id), ability.unlocked));
    grid.append(card);
  }
  result.append(grid);
  return result;
}

function renderCoordinates(documentRef, model, callbacks) {
  const result = section(documentRef, "Cosmic Coordinate Runtime");
  const grid = node(documentRef, "div", "technology-list-grid");
  for (const coordinate of model.coordinates?.coordinates ?? []) {
    const card = node(documentRef, "article", "technology-list-card");
    const discovered = coordinate.discovery_status === "DISCOVERED";
    card.dataset.unlocked = String(discovered);
    card.append(node(documentRef, "strong", "", coordinate.canonical_reference ?? coordinate.coordinate_id), node(documentRef, "span", "", coordinate.coordinate_type), node(documentRef, "small", "", `${coordinate.planet_id ?? "NO PLANET"} / ${coordinate.discovery_status}`));
    card.append(action(documentRef, "Discover", `DISCOVER_${coordinate.coordinate_id}`, () => callbacks.onCosmicCoordinate?.(coordinate.coordinate_id), discovered));
    grid.append(card);
  }
  result.append(grid, node(documentRef, "p", "technology-boundary-note", "Coordinates are fixture records and CURRENT references. They are not hardcoded navigation, ownership, or sovereignty commands."));
  return result;
}

function renderExploration(documentRef, model, callbacks) {
  const result = section(documentRef, "Space Exploration Foundation");
  const discovered = (model.coordinates?.coordinates ?? []).filter(({ discovery_status: status }) => status === "DISCOVERED");
  const target = discovered.at(-1)?.coordinate_id;
  const grid = node(documentRef, "div", "technology-list-grid");
  for (const activity of model.exploration?.activities ?? []) {
    const technologyReady = model.technology?.nodes?.find(({ technology_id: id }) => id === activity.required_technology)?.unlocked === true;
    const card = node(documentRef, "article", "technology-list-card");
    card.append(node(documentRef, "strong", "", activity.activity_id), node(documentRef, "span", "", activity.required_technology), node(documentRef, "small", "", activity.proposal_only ? "PROPOSAL ONLY" : `${activity.energy_cost} ${activity.energy_id}`));
    card.append(action(documentRef, "Launch", `EXPLORE_${activity.activity_id}`, () => callbacks.onSpaceExploration?.(activity.activity_id, target), !target || !technologyReady, true));
    grid.append(card);
  }
  result.append(grid, facts(documentRef, [["Missions", model.exploration?.missions?.length ?? 0], ["Colony Proposals", model.exploration?.proposals?.length ?? 0], ["Default Target", target]]));
  return result;
}

export function renderCosmicTechnologyView(documentRef, civilizationModel = {}, callbacks = {}) {
  const model = civilizationModel.cosmic_technology ?? {};
  const fragment = documentRef.createDocumentFragment();
  const overview = section(documentRef, "Cosmic Technology Alpha");
  overview.classList.add("technology-overview");
  overview.append(facts(documentRef, [
    ["Decision", model.decision_id],
    ["Current Age", model.technology?.current_age_id],
    ["Research Evidence", model.research?.evidence?.length ?? 0],
    ["UFO V2 Gates", model.ufo_v2_gates?.ready ? "READY" : "LOCKED"],
    ["Boundary", model.simulation_only ? "SIMULATION ONLY" : "UNKNOWN"]
  ]));

  const tabs = node(documentRef, "div", "technology-panel-tabs");
  tabs.setAttribute("role", "tablist");
  const panelHost = node(documentRef, "div", "technology-panel-host");
  const renderers = {
    TREE: () => renderTree(documentRef, model, callbacks),
    RESEARCH: () => renderResearch(documentRef, model),
    RESOURCES: () => renderResources(documentRef, model, callbacks),
    FLEET: () => renderFleet(documentRef, model, callbacks),
    ABILITIES: () => renderAbilities(documentRef, model, callbacks),
    COORDINATES: () => renderCoordinates(documentRef, model, callbacks),
    EXPLORATION: () => renderExploration(documentRef, model, callbacks)
  };
  const show = (panelId) => {
    activePanel = panelId;
    panelHost.replaceChildren(renderers[panelId]());
    for (const tab of tabs.children) {
      const selected = tab.dataset.technologyPanel === panelId;
      tab.setAttribute("aria-selected", String(selected));
      tab.classList.toggle("is-active", selected);
    }
  };
  for (const [id, name] of PANELS) {
    const tab = action(documentRef, name, `TECH_PANEL_${id}`, () => show(id));
    tab.dataset.technologyPanel = id;
    tab.setAttribute("role", "tab");
    tabs.append(tab);
  }
  show(activePanel);
  fragment.append(overview, tabs, panelHost);
  return fragment;
}
