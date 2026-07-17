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

function list(value) {
  return Array.isArray(value) ? value : [];
}

function section(documentRef, title, modifier = "") {
  const result = node(documentRef, "section", `civilization-section ${modifier}`.trim());
  result.append(node(documentRef, "h2", "civilization-section__title", title));
  return result;
}

function facts(documentRef, rows, className = "civilization-data") {
  const result = node(documentRef, "dl", className);
  for (const [name, value] of rows) {
    const row = node(documentRef, "div");
    row.append(node(documentRef, "dt", "", name), node(documentRef, "dd", "", label(value)));
    result.append(row);
  }
  return result;
}

function button(documentRef, text, action, callback, disabled = false, primary = false) {
  const result = node(documentRef, "button", `civilization-action${primary ? " civilization-action--primary" : ""}`, text);
  result.type = "button";
  result.dataset.civilizationAction = action;
  result.disabled = disabled;
  result.addEventListener("click", callback);
  return result;
}

function progress(documentRef, labelText, value, maximum) {
  const safeMaximum = Math.max(1, Number(maximum) || 1);
  const safeValue = Math.max(0, Math.min(safeMaximum, Number(value) || 0));
  const result = node(documentRef, "div", "timeline-progress");
  const copy = node(documentRef, "div", "timeline-progress__copy");
  copy.append(node(documentRef, "span", "", labelText), node(documentRef, "strong", "", `${safeValue} / ${maximum}`));
  const track = node(documentRef, "div", "timeline-progress__track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", labelText);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(maximum));
  track.setAttribute("aria-valuenow", String(safeValue));
  const fill = node(documentRef, "span", "timeline-progress__fill");
  fill.style.width = `${safeValue / safeMaximum * 100}%`;
  track.append(fill);
  result.append(copy, track);
  return result;
}

export function renderTimelineView(documentRef, model = {}, callbacks = {}) {
  const fragment = documentRef.createDocumentFragment();
  const timeline = model.timeline ?? {};
  const vehicle = timeline.vehicle ?? {};
  const eras = list(timeline.eras);

  const overview = section(documentRef, "Civilization Timeline", "civilization-section--timeline");
  overview.append(facts(documentRef, [
    ["Current Era", timeline.current_era_id],
    ["Origin Era", timeline.origin_era_id],
    ["Journeys", list(timeline.journeys).length],
    ["Transport", vehicle.vehicle_type],
    ["Canonical History", timeline.canonical_history_mutation === false ? "IMMUTABLE" : "UNKNOWN"],
    ["Reality Boundary", timeline.real_time_travel === false ? "SYNTHETIC ONLY" : "UNKNOWN"]
  ]));
  const eraTrack = node(documentRef, "ol", "timeline-era-track");
  for (const era of eras) {
    const item = node(documentRef, "li", "timeline-era-card");
    item.dataset.current = String(era.current === true);
    item.dataset.ready = String(era.research_ready === true);
    item.append(
      node(documentRef, "span", "timeline-era-card__index", String(Number(era.index) + 1).padStart(2, "0")),
      node(documentRef, "strong", "", era.label),
      node(documentRef, "small", "", era.current ? "CURRENT" : era.research_ready ? "RESEARCH READY" : `${era.research_points}/${era.required_research_points}`)
    );
    eraTrack.append(item);
  }
  overview.append(eraTrack);
  fragment.append(overview);

  const targetSection = section(documentRef, "Era Research and Travel");
  const selectable = eras.filter(({ current }) => !current);
  if (selectable.length) {
    const control = node(documentRef, "label", "nation-control");
    control.append(node(documentRef, "span", "", "Target Era"));
    const select = node(documentRef, "select");
    for (const era of selectable) {
      const option = node(documentRef, "option", "", era.label);
      option.value = era.era_id;
      select.append(option);
    }
    control.append(select);
    const researchButton = button(documentRef, "Research Era", "RESEARCH_TIMELINE_ERA", () => callbacks.onResearchEra?.(select.value));
    const travelButton = button(documentRef, "Travel", "TRAVEL_TIMELINE", () => callbacks.onTravel?.(select.value), false, true);
    const updateEraActions = () => {
      const selected = eras.find(({ era_id: id }) => id === select.value);
      researchButton.disabled = selected?.research_ready === true;
      travelButton.disabled = timeline.era_readiness?.[select.value]?.ready !== true;
    };
    select.addEventListener("change", updateEraActions);
    updateEraActions();
    const actions = node(documentRef, "div", "nation-controls");
    actions.append(
      control,
      researchButton,
      travelButton,
      button(documentRef, "Return to Origin", "RETURN_TIMELINE_ORIGIN", () => callbacks.onReturnOrigin?.(), timeline.current_era_id === timeline.origin_era_id)
    );
    targetSection.append(actions);
  }
  fragment.append(targetSection);

  const vehicleSection = section(documentRef, "Pocket Time Cloaked UFO", "civilization-section--vehicle");
  vehicleSection.append(facts(documentRef, [
    ["Status", vehicle.status],
    ["Vehicle ID", vehicle.vehicle_id],
    ["Checksum", vehicle.checksum_verified ? "VERIFIED" : "PENDING"],
    ["Energy", `${vehicle.energy_reserve ?? 0} / ${vehicle.energy_capacity ?? 0}`],
    ["Travel Cost", vehicle.travel_energy_cost],
    ["Civilization Gate", vehicle.civilization_gate?.ready ? "PASS" : "BLOCKED"]
  ]));
  for (const requirement of list(vehicle.technology_requirements)) {
    vehicleSection.append(progress(documentRef, label(requirement.technology_id), requirement.progress, requirement.required_points));
  }
  const materialGrid = node(documentRef, "div", "nation-status-grid");
  for (const requirement of list(vehicle.material_requirements)) {
    const card = node(documentRef, "article", "nation-status-card");
    card.dataset.status = requirement.ready ? "PASS" : "BLOCKED";
    const materialAmount = vehicle.built ? requirement.consumed : requirement.stockpiled;
    card.append(
      node(documentRef, "strong", "", label(requirement.material_id)),
      node(documentRef, "span", "", `${vehicle.built ? "consumed" : "stockpiled"} ${materialAmount} / ${requirement.quantity}`)
    );
    materialGrid.append(card);
  }
  vehicleSection.append(materialGrid);
  const vehicleActions = node(documentRef, "div", "civilization-actions civilization-actions--wrap");
  vehicleActions.append(
    button(documentRef, "Research Program", "RESEARCH_TIMELINE_VEHICLE", () => callbacks.onResearchVehicle?.(), vehicle.built === true || list(vehicle.technology_requirements).every(({ ready }) => ready)),
    button(documentRef, "Supply Materials", "SUPPLY_TIMELINE_VEHICLE", () => callbacks.onSupplyVehicle?.(), vehicle.built === true || list(vehicle.material_requirements).every(({ ready }) => ready)),
    button(documentRef, "Build Vehicle", "BUILD_TIMELINE_VEHICLE", () => callbacks.onBuildVehicle?.(), vehicle.status !== "CONSTRUCTION_READY", true),
    button(documentRef, "Charge", "CHARGE_TIMELINE_VEHICLE", () => callbacks.onChargeVehicle?.(), vehicle.built !== true || vehicle.energy_reserve >= vehicle.energy_capacity)
  );
  vehicleSection.append(vehicleActions);
  fragment.append(vehicleSection);

  const history = section(documentRef, "Journey Evidence");
  const journeys = list(timeline.journeys).slice(-8).reverse();
  if (!journeys.length) history.append(node(documentRef, "p", "civilization-empty", "NO TIMELINE JOURNEYS"));
  for (const journey of journeys) {
    history.append(facts(documentRef, [
      [journey.from_era_id, journey.to_era_id],
      ["Vehicle", journey.vehicle_type],
      ["Review", journey.review_status],
      ["Canonical Mutation", journey.canonical_history_mutated]
    ], "civilization-data civilization-data--compact timeline-journey"));
  }
  fragment.append(history);
  return fragment;
}
