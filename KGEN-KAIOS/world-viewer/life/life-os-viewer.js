export const UNKNOWN_VALUE = "UNKNOWN";

export const LIFE_OS_FORBIDDEN_DOMAINS = Object.freeze([
  "payroll",
  "salary",
  "market",
  "marketplace",
  "bank",
  "wallet",
  "land",
  "land_authority",
  "occupation",
  "family",
  "marriage",
  "property",
  "attendance",
  "mission",
  "company",
  "government",
  "military",
  "temple",
  "review",
  "kernel",
  "company_dispatch",
  "workqueue",
  "civilization_policy",
  "memory",
  "learning",
  "emotion",
  "reasoning",
  "personality",
  "dream",
  "faith",
  "knowledge",
  "behavior",
  "decision"
]);

const ENTITY_COLLECTIONS = Object.freeze([
  ["REGION", "regions"],
  ["CITY", "cities"],
  ["PARCEL", "parcels"],
  ["BUILDING", "buildings"],
  ["ROOM", "rooms"],
  ["LIFE_PROFILE", "lifeProfiles"],
  ["AI_WORKER", "aiWorkers"],
  ["NPC", "npcs"],
  ["ENTITY", "entities"]
]);

const PROFILE_ID_FIELDS = Object.freeze([
  "profile_id",
  "life_profile_id",
  "life_id",
  "individual_id",
  "id"
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isKnown(value) {
  return value !== undefined && value !== null && value !== "";
}

function firstKnown(...values) {
  return values.find(isKnown);
}

function asArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (isRecord(value)) return Object.values(value);
  return [value];
}

function normalizeIdentifier(value) {
  return isKnown(value) ? String(value) : null;
}

function profileIdentifier(profile) {
  if (!isRecord(profile)) return null;
  for (const field of PROFILE_ID_FIELDS) {
    const id = normalizeIdentifier(profile[field]);
    if (id) return id;
  }
  return null;
}

function selectionIdentifier(selection) {
  if (typeof selection === "string" || typeof selection === "number") {
    return String(selection);
  }
  if (!isRecord(selection)) return null;
  return normalizeIdentifier(
    firstKnown(
      selection.selectedId,
      selection.selected_id,
      selection.objectId,
      selection.object_id,
      selection.id
    )
  );
}

function resolveWorldEntity(world, selection) {
  if (!isRecord(world)) return null;
  if (isRecord(selection?.entity)) return selection.entity;

  const selectedId = selectionIdentifier(selection);
  const roots = [world.earth, world.region, world.cityOverlay, world.city];
  for (const root of roots) {
    if (isRecord(root) && normalizeIdentifier(root.id) === selectedId) return root;
  }

  for (const [, collectionName] of ENTITY_COLLECTIONS) {
    const entity = asArray(world[collectionName]).find(
      (candidate) =>
        isRecord(candidate) && normalizeIdentifier(candidate.id) === selectedId
    );
    if (entity) return entity;
  }

  return null;
}

function allProfileRecords(world, suppliedProfiles) {
  const source = suppliedProfiles ??
    world?.lifeProfiles ??
    world?.life_profiles ??
    world?.lifeRegistry?.profiles ??
    world?.life_registry?.profiles;
  return asArray(source).filter(isRecord);
}

function directProfiles(entity) {
  if (!isRecord(entity)) return [];
  return [
    ...asArray(entity.life_profile),
    ...asArray(entity.lifeProfile),
    ...asArray(entity.life_profiles),
    ...asArray(entity.lifeProfiles)
  ].filter(isRecord);
}

function directProfileReferences(entity) {
  if (!isRecord(entity)) return [];
  return [
    ...asArray(entity.life_profile_id),
    ...asArray(entity.lifeProfileId),
    ...asArray(entity.life_profile_ids),
    ...asArray(entity.lifeProfileIds),
    ...asArray(entity.life_ids),
    ...asArray(entity.lifeIds)
  ].map(normalizeIdentifier).filter(Boolean);
}

function entityRelation(entity, world) {
  if (!isRecord(entity)) return null;
  const id = normalizeIdentifier(entity.id);
  if (!id) return null;

  if (asArray(world?.parcels).includes(entity)) return { field: "parcel_id", id };
  if (asArray(world?.buildings).includes(entity)) return { field: "building_id", id };
  if (asArray(world?.rooms).includes(entity)) return { field: "room_id", id };
  return { field: "entity_id", id };
}

function relationMatches(profile, relation) {
  if (!relation || !isRecord(profile)) return false;
  const context = isRecord(profile.context) ? profile.context : {};
  return normalizeIdentifier(firstKnown(profile[relation.field], context[relation.field])) === relation.id;
}

function relatedEntities(world, relation) {
  if (!isRecord(world) || !relation) return [];
  const relationField = relation.field;
  const result = [];

  for (const [, collectionName] of ENTITY_COLLECTIONS) {
    for (const entity of asArray(world[collectionName])) {
      if (!isRecord(entity)) continue;
      if (normalizeIdentifier(entity[relationField]) === relation.id) result.push(entity);
    }
  }

  return result;
}

function deduplicateProfiles(profiles) {
  const ids = new Set();
  const objects = new Set();
  return profiles.filter((profile) => {
    if (!isRecord(profile) || objects.has(profile)) return false;
    objects.add(profile);
    const id = profileIdentifier(profile);
    if (!id) return true;
    if (ids.has(id)) return false;
    ids.add(id);
    return true;
  });
}

/**
 * Resolve only explicitly attached or context-linked life profiles. The
 * resolver never scans arbitrary object graphs, which keeps upper-layer and
 * private domains outside the Life OS presentation boundary.
 */
export function resolveLifeProfiles({
  world = {},
  selection = null,
  entity = null,
  profiles = null
} = {}) {
  const target = entity ?? resolveWorldEntity(world, selection);
  if (!isRecord(target)) return [];

  const registryProfiles = allProfileRecords(world, profiles);
  const profileIndex = new Map();
  registryProfiles.forEach((profile) => {
    const id = profileIdentifier(profile);
    if (id) profileIndex.set(id, profile);
  });

  const relation = entityRelation(target, world);
  const resolved = [
    ...(profileIndex.get(profileIdentifier(target)) === target ? [target] : []),
    ...directProfiles(target),
    ...directProfileReferences(target).map((id) => profileIndex.get(id)).filter(Boolean),
    ...registryProfiles.filter((profile) => relationMatches(profile, relation))
  ];

  for (const related of relatedEntities(world, relation)) {
    resolved.push(...directProfiles(related));
    for (const id of directProfileReferences(related)) {
      const profile = profileIndex.get(id);
      if (profile) resolved.push(profile);
    }
  }

  return deduplicateProfiles(resolved);
}

const LIFE_LAYER_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "body", label: "Body" }),
  Object.freeze({ key: "speciesOs", sourceKey: "species_os", label: "Species OS" }),
  Object.freeze({ key: "individualLifeOs", sourceKey: "individual_life_os", label: "Individual Life OS" }),
  Object.freeze({ key: "mindRuntime", sourceKey: "mind_runtime", label: "Mind Runtime" }),
  Object.freeze({ key: "citizenRuntime", sourceKey: "citizen_runtime", label: "Citizen Runtime" })
]);

function nestedLayerSource(profile) {
  if (isRecord(profile.life_stack)) return profile.life_stack;
  if (isRecord(profile.lifeStack)) return profile.lifeStack;
  if (isRecord(profile.layers)) return profile.layers;
  return {};
}

function layerRecord(profile, definition) {
  const sourceKey = definition.sourceKey ?? definition.key;
  const nested = nestedLayerSource(profile);
  const direct = firstKnown(
    profile[sourceKey],
    profile[definition.key],
    nested[sourceKey],
    nested[definition.key]
  );
  return isRecord(direct) ? direct : {};
}

function normalizeLayer(profile, definition) {
  const source = layerRecord(profile, definition);
  const sourceKey = definition.sourceKey ?? definition.key;
  return Object.freeze({
    key: definition.key,
    sourceKey,
    label: definition.label,
    id: String(firstKnown(
      source.id,
      source[`${sourceKey}_id`],
      source.life_os_id,
      UNKNOWN_VALUE
    )),
    status: String(firstKnown(source.status, source.state, UNKNOWN_VALUE)),
    version: String(firstKnown(
      source.version,
      source[`${sourceKey}_version`],
      UNKNOWN_VALUE
    )),
    reason: String(firstKnown(source.reason, UNKNOWN_VALUE))
  });
}

function metricNumber(metric) {
  const source = isRecord(metric)
    ? firstKnown(metric.value, metric.current, metric.percent, metric.level)
    : metric;
  const value = typeof source === "number" ? source : Number(source);
  return Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : UNKNOWN_VALUE;
}

function metricValue(metric) {
  const value = metricNumber(metric);
  return value === UNKNOWN_VALUE ? UNKNOWN_VALUE : String(value);
}

function normalizeOrganSystems(profile, body) {
  const systems = firstKnown(
    body.organ_systems,
    body.organSystems,
    profile.organ_systems,
    profile.organSystems
  );

  return asArray(systems).map((system, index) => {
    if (!isRecord(system)) {
      const name = isKnown(system) ? String(system) : UNKNOWN_VALUE;
      return Object.freeze({
        id: name === UNKNOWN_VALUE ? `ORGAN_SYSTEM_${index + 1}` : name,
        name,
        status: UNKNOWN_VALUE,
        integrity: UNKNOWN_VALUE
      });
    }

    return Object.freeze({
      id: String(firstKnown(system.organ_system_id, system.id, `ORGAN_SYSTEM_${index + 1}`)),
      name: String(firstKnown(system.name, system.label, system.organ_system_id, system.id, UNKNOWN_VALUE)),
      status: String(firstKnown(system.status, system.state, UNKNOWN_VALUE)),
      integrity: metricValue(firstKnown(system.integrity, system.integrity_state))
    });
  });
}

function normalizeDnaSummary(profile, body) {
  const source = isRecord(body.dna_summary)
    ? body.dna_summary
    : isRecord(body.dnaSummary)
      ? body.dnaSummary
      : isRecord(profile.dna_summary)
        ? profile.dna_summary
        : {};
  const traits = Object.freeze(
    asArray(source.traits)
      .filter((trait) => typeof trait === "string" && trait.length > 0)
      .map(String)
  );
  const traitCount = Number.isInteger(source.trait_count)
    ? source.trait_count
    : Number.isInteger(source.traitCount)
      ? source.traitCount
      : traits.length || UNKNOWN_VALUE;

  return Object.freeze({
    summaryId: String(firstKnown(source.summary_id, source.summaryId, UNKNOWN_VALUE)),
    classification: String(firstKnown(source.classification, UNKNOWN_VALUE)),
    traitCount,
    traits,
    disclosure: String(firstKnown(source.disclosure, UNKNOWN_VALUE))
  });
}

function dnaSummaryText(summary) {
  if (summary.classification === UNKNOWN_VALUE) return UNKNOWN_VALUE;
  const count = summary.traitCount === UNKNOWN_VALUE
    ? "unknown traits"
    : `${summary.traitCount} public traits`;
  return `${summary.classification} / ${count}`;
}

function inventoryText(value) {
  if (Array.isArray(value)) {
    const labels = value.map((item) => isRecord(item)
      ? `${firstKnown(item.item_id, item.id, item.name, UNKNOWN_VALUE)} x${firstKnown(item.quantity, item.count, UNKNOWN_VALUE)}`
      : String(item));
    return labels.join(", ") || "EMPTY";
  }
  if (!isRecord(value)) return UNKNOWN_VALUE;
  const labels = Object.entries(value)
    .filter(([, quantity]) => typeof quantity === "number" || typeof quantity === "string")
    .map(([item, quantity]) => `${item} x${quantity}`);
  return labels.join(", ") || "EMPTY";
}

/** Create an allowlisted, privacy-minimized Life stack projection. */
export function projectLifeProfile(profile = {}) {
  const safeProfile = isRecord(profile) ? profile : {};
  const layerEntries = LIFE_LAYER_DEFINITIONS.map((definition) => [
    definition.key,
    normalizeLayer(safeProfile, definition)
  ]);
  const layers = Object.freeze(Object.fromEntries(layerEntries));
  const lifeStack = Object.freeze(layerEntries.map(([, layer]) => layer));
  const body = layerRecord(safeProfile, LIFE_LAYER_DEFINITIONS[0]);
  const species = layerRecord(safeProfile, LIFE_LAYER_DEFINITIONS[1]);
  const individual = layerRecord(safeProfile, LIFE_LAYER_DEFINITIONS[2]);
  const mind = layerRecord(safeProfile, LIFE_LAYER_DEFINITIONS[3]);
  const citizen = layerRecord(safeProfile, LIFE_LAYER_DEFINITIONS[4]);
  const vitalsSource = isRecord(safeProfile.vitals)
    ? safeProfile.vitals
    : isRecord(safeProfile.public_vitals)
      ? safeProfile.public_vitals
      : {};
  const vitals = Object.freeze({
    health: metricNumber(firstKnown(vitalsSource.health, safeProfile.health)),
    energy: metricNumber(firstKnown(vitalsSource.energy, safeProfile.energy)),
    food: metricNumber(firstKnown(vitalsSource.food, safeProfile.food)),
    water: metricNumber(firstKnown(vitalsSource.water, safeProfile.water)),
    oxygen: metricNumber(firstKnown(vitalsSource.oxygen, safeProfile.oxygen))
  });
  const dnaSummary = normalizeDnaSummary(safeProfile, body);
  const heartbeat = isRecord(safeProfile.heartbeat) ? safeProfile.heartbeat : {};
  const resolvedProfileId = firstKnown(profileIdentifier(safeProfile), UNKNOWN_VALUE);
  const gaSource = isRecord(safeProfile.ga) ? safeProfile.ga : {};
  const gaCountValue = firstKnown(safeProfile.ga_count, safeProfile.gaCount, gaSource.count);
  const gaCount = Number.isInteger(gaCountValue) ? gaCountValue : UNKNOWN_VALUE;

  const rawAgeDays = firstKnown(safeProfile.age_days, individual.age_days);
  const numericAgeDays = Number(rawAgeDays);
  return Object.freeze({
    profileId: String(resolvedProfileId),
    lifeId: String(firstKnown(safeProfile.life_id, safeProfile.lifeId, resolvedProfileId)),
    individualId: String(firstKnown(safeProfile.individual_id, safeProfile.individualId, layers.individualLifeOs.id)),
    displayName: String(firstKnown(safeProfile.display_name, safeProfile.name, safeProfile.label, UNKNOWN_VALUE)),
    lifeType: String(firstKnown(safeProfile.life_type, safeProfile.lifeType, UNKNOWN_VALUE)),
    speciesCode: String(firstKnown(species.species_code, safeProfile.species_code, safeProfile.life_type, UNKNOWN_VALUE)),
    bodyId: layers.body.id,
    bodyProfile: String(firstKnown(body.profile, body.body_type, UNKNOWN_VALUE)),
    speciesOsId: layers.speciesOs.id,
    speciesOsVersion: layers.speciesOs.version,
    individualLifeOsId: layers.individualLifeOs.id,
    mindRuntimeId: layers.mindRuntime.id,
    mindProfile: String(firstKnown(mind.profile, UNKNOWN_VALUE)),
    citizenRuntimeId: layers.citizenRuntime.id,
    citizenProfile: String(firstKnown(citizen.profile, UNKNOWN_VALUE)),
    lifeState: String(firstKnown(individual.life_state, individual.existence_state, UNKNOWN_VALUE)),
    runtimeState: String(firstKnown(individual.life_state, individual.existence_state, UNKNOWN_VALUE)),
    activityState: String(firstKnown(individual.activity_state, UNKNOWN_VALUE)),
    healthState: String(firstKnown(individual.health_state, UNKNOWN_VALUE)),
    lifeStage: String(firstKnown(individual.life_stage, UNKNOWN_VALUE)),
    stateVersion: String(firstKnown(individual.state_version, UNKNOWN_VALUE)),
    health: metricValue(vitals.health),
    energy: metricValue(vitals.energy),
    food: metricValue(vitals.food),
    water: metricValue(vitals.water),
    rest: metricValue(firstKnown(vitalsSource.rest, safeProfile.rest)),
    integrity: metricValue(firstKnown(vitalsSource.integrity, safeProfile.integrity)),
    occupation: String(firstKnown(citizen.occupation, UNKNOWN_VALUE)),
    ageDays: Number.isFinite(numericAgeDays)
      ? String(Math.round(numericAgeDays * 100) / 100)
      : UNKNOWN_VALUE,
    inventory: inventoryText(safeProfile.inventory),
    gaCount,
    gaProfile: String(firstKnown(safeProfile.ga_profile, safeProfile.gaProfile, gaSource.profile, UNKNOWN_VALUE)),
    dnaSummary,
    dnaSummaryText: dnaSummaryText(dnaSummary),
    heartbeatStatus: String(firstKnown(heartbeat.status, heartbeat.state, safeProfile.heartbeat_status, UNKNOWN_VALUE)),
    heartbeatAt: String(firstKnown(heartbeat.last_at, heartbeat.recorded_at, safeProfile.last_heartbeat_at, safeProfile.heartbeat_at, UNKNOWN_VALUE)),
    heartbeatSequence: String(firstKnown(heartbeat.sequence, safeProfile.heartbeat_sequence, UNKNOWN_VALUE)),
    vitals,
    layers,
    lifeStack,
    organSystems: Object.freeze(normalizeOrganSystems(safeProfile, body))
  });
}

function createElement(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

function appendRows(documentRef, parent, rows) {
  const list = createElement(documentRef, "dl", "life-os-viewer__data");
  rows.forEach(([label, value]) => {
    const displayValue = isKnown(value) ? value : UNKNOWN_VALUE;
    const valueState = displayValue === UNKNOWN_VALUE
      ? " life-os-viewer__value--unknown"
      : displayValue === "NOT_APPLICABLE"
        ? " life-os-viewer__value--not-applicable"
        : "";
    const term = createElement(documentRef, "dt", "life-os-viewer__label", label);
    const detail = createElement(
      documentRef,
      "dd",
      `life-os-viewer__value${valueState}`,
      displayValue
    );
    list.append(term, detail);
  });
  parent.appendChild(list);
}

function layerRows(projection, layer) {
  const rows = [
    ["ID", layer.id],
    ["Status", layer.status],
    ["Version", layer.version]
  ];

  if (layer.key === "body") {
    rows.push(
      ["Body profile", projection.bodyProfile],
      ["DNA summary", projection.dnaSummaryText],
      ["Body systems", projection.organSystems.map(({ name }) => name).join(", ") || UNKNOWN_VALUE]
    );
  } else if (layer.key === "speciesOs") {
    rows.push(["Species", projection.speciesCode]);
  } else if (layer.key === "individualLifeOs") {
    rows.push(
      ["Life State", projection.lifeState],
      ["Activity", projection.activityState],
      ["Health State", projection.healthState],
      ["Life stage", projection.lifeStage],
      ["State version", projection.stateVersion],
      ["Heartbeat", projection.heartbeatStatus]
    );
  } else if (layer.key === "mindRuntime") {
    rows.push(["Mind profile", projection.mindProfile]);
  } else if (layer.key === "citizenRuntime") {
    rows.push(
      ["Citizen profile", projection.citizenProfile],
      ["Occupation", projection.occupation]
    );
  }

  if (layer.status === "NOT_APPLICABLE") rows.push(["Reason", layer.reason]);
  return rows;
}

function renderLifeStack(documentRef, projection) {
  const section = createElement(documentRef, "section", "life-os-viewer__stack-section inspector-section");
  section.appendChild(createElement(documentRef, "h5", "life-os-viewer__section-title", "Five-layer stack"));
  const stack = createElement(documentRef, "ol", "life-os-viewer__stack");
  stack.setAttribute("data-layer-count", String(projection.lifeStack.length));

  projection.lifeStack.forEach((layer, index) => {
    const item = createElement(documentRef, "li", "life-os-viewer__layer");
    item.setAttribute("data-life-layer", layer.sourceKey);
    item.appendChild(createElement(
      documentRef,
      "h6",
      "life-os-viewer__layer-title",
      `${index + 1}. ${layer.label}`
    ));
    appendRows(documentRef, item, layerRows(projection, layer));
    stack.appendChild(item);
  });

  section.appendChild(stack);
  return section;
}

function renderVitalRow(documentRef, label, value) {
  const row = createElement(documentRef, "div", "vital-row life-os-viewer__vital");
  row.appendChild(createElement(documentRef, "span", "life-os-viewer__vital-label", label));
  const track = createElement(documentRef, "div", "vital-track");
  track.setAttribute("role", "meter");
  track.setAttribute("aria-label", label);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  const numericValue = typeof value === "number" ? value : null;
  if (numericValue === null) {
    track.setAttribute("aria-valuetext", UNKNOWN_VALUE);
  } else {
    track.setAttribute("aria-valuenow", String(numericValue));
  }
  const fill = createElement(documentRef, "div", "vital-fill");
  fill.style.width = `${numericValue ?? 0}%`;
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(createElement(
    documentRef,
    "output",
    numericValue === null
      ? "life-os-viewer__vital-value life-os-viewer__value--unknown"
      : "life-os-viewer__vital-value",
    numericValue ?? UNKNOWN_VALUE
  ));
  return row;
}

function renderVitals(documentRef, projection) {
  const section = createElement(documentRef, "section", "life-os-viewer__vitals inspector-section");
  section.appendChild(createElement(documentRef, "h5", "life-os-viewer__section-title", "Vitals"));
  for (const [key, label] of [
    ["health", "Health"],
    ["energy", "Energy"],
    ["food", "Food"],
    ["water", "Water"],
    ["oxygen", "Oxygen"]
  ]) {
    section.appendChild(renderVitalRow(documentRef, label, projection.vitals[key]));
  }
  return section;
}

function renderPublicCapabilities(documentRef, projection) {
  const section = createElement(documentRef, "section", "life-os-viewer__capabilities inspector-section");
  section.appendChild(createElement(documentRef, "h5", "life-os-viewer__section-title", "Public capability profile"));
  appendRows(documentRef, section, [
    ["DNA class", projection.dnaSummary.classification],
    ["DNA traits", projection.dnaSummary.traits.join(", ") || UNKNOWN_VALUE],
    ["GA count", projection.gaCount],
    ["GA profile", projection.gaProfile]
  ]);
  return section;
}

function renderDailyLife(documentRef, projection, callbacks) {
  const section = createElement(documentRef, "section", "life-os-viewer__daily inspector-section");
  section.appendChild(createElement(documentRef, "h5", "life-os-viewer__section-title", "Daily life simulation"));
  appendRows(documentRef, section, [
    ["Age (days)", projection.ageDays],
    ["Occupation", projection.occupation],
    ["Activity", projection.activityState],
    ["Inventory", projection.inventory]
  ]);
  if (typeof callbacks.onAction === "function") {
    const actions = createElement(documentRef, "div", "life-os-viewer__actions");
    actions.setAttribute("role", "toolbar");
    actions.setAttribute("aria-label", `Actions for ${projection.displayName}`);
    ["EAT", "DRINK", "SLEEP", "WAKE", "WORK"].forEach((action) => {
      const button = createElement(documentRef, "button", "inspector-view__life-action", action);
      button.type = "button";
      button.addEventListener("click", () => callbacks.onAction(action, projection));
      actions.appendChild(button);
    });
    section.appendChild(actions);
  }
  return section;
}

function renderProjectedProfile(documentRef, projection, callbacks) {
  const article = createElement(documentRef, "article", "life-os-viewer__profile");
  article.setAttribute("data-life-profile", projection.profileId);
  const heading = createElement(
    documentRef,
    "h4",
    "life-os-viewer__profile-title",
    projection.displayName === UNKNOWN_VALUE ? "Life profile" : projection.displayName
  );
  article.appendChild(heading);

  appendRows(documentRef, article, [
    ["Life ID", projection.lifeId],
    ["Life type", projection.lifeType]
  ]);
  article.appendChild(renderLifeStack(documentRef, projection));
  article.appendChild(renderVitals(documentRef, projection));
  article.appendChild(renderDailyLife(documentRef, projection, callbacks));
  article.appendChild(renderPublicCapabilities(documentRef, projection));
  return article;
}

/**
 * Render the Life OS projection without HTML parsing or authoritative writes.
 * Returns the projections used by the view for integration and tests.
 */
export function renderLifeOsViewer(container, input = {}, callbacks = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("Life OS viewer container must be a DOM element");
  }

  const documentRef = container.ownerDocument ?? globalThis.document;
  if (!documentRef?.createElement) {
    throw new TypeError("Life OS viewer requires a DOM document");
  }

  const rawProfiles = input.profile
    ? [input.profile]
    : input.resolvedProfiles
      ? asArray(input.resolvedProfiles)
      : resolveLifeProfiles(input);
  const projections = rawProfiles.filter(isRecord).map(projectLifeProfile);

  const root = createElement(documentRef, "section", "life-os-viewer");
  root.setAttribute("aria-label", "Life OS Alpha local public synthetic status");
  root.appendChild(createElement(documentRef, "h3", "life-os-viewer__title", "Life OS Alpha"));
  root.appendChild(createElement(
    documentRef,
    "p",
    "life-os-viewer__privacy",
    "Local-only PUBLIC_SYNTHETIC projection. Actions update browser simulation only; no private DNA, identity, GPS, or registry authority."
  ));

  if (projections.length === 0) {
    root.appendChild(
      createElement(documentRef, "p", "life-os-viewer__unknown", UNKNOWN_VALUE)
    );
  } else {
    projections.forEach((projection) => {
      root.appendChild(renderProjectedProfile(documentRef, projection, callbacks));
    });
  }

  container.replaceChildren(root);
  return Object.freeze(projections);
}

export function createLifeOsViewer(container, callbacks = {}) {
  let lastInput = {};
  return Object.freeze({
    render(input = lastInput) {
      lastInput = input;
      return renderLifeOsViewer(container, input, callbacks);
    },
    clear() {
      lastInput = {};
      container.replaceChildren();
    }
  });
}
