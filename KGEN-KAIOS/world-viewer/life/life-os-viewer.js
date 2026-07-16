export const UNKNOWN_VALUE = "UNKNOWN";

export const LIFE_OS_FORBIDDEN_DOMAINS = Object.freeze([
  "payroll",
  "market",
  "bank",
  "land_authority",
  "mission",
  "review",
  "kernel",
  "company_dispatch"
]);

const ENTITY_COLLECTIONS = Object.freeze([
  ["REGION", "regions"],
  ["CITY", "cities"],
  ["PARCEL", "parcels"],
  ["BUILDING", "buildings"],
  ["ROOM", "rooms"],
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

function metricValue(metric) {
  if (!isKnown(metric)) return UNKNOWN_VALUE;
  if (!isRecord(metric)) return String(metric);

  const value = firstKnown(
    metric.value,
    metric.current,
    metric.percent,
    metric.level,
    metric.status,
    metric.state
  );
  if (!isKnown(value)) return UNKNOWN_VALUE;
  return metric.unit ? `${value} ${metric.unit}` : String(value);
}

function normalizeOrganSystems(profile) {
  const body = isRecord(profile.body) ? profile.body : {};
  const systems = firstKnown(
    profile.organ_systems,
    profile.organSystems,
    body.organ_systems,
    body.organSystems
  );

  return asArray(systems).map((system, index) => {
    if (!isRecord(system)) {
      const name = isKnown(system) ? String(system) : UNKNOWN_VALUE;
      return {
        id: name === UNKNOWN_VALUE ? `ORGAN_SYSTEM_${index + 1}` : name,
        name,
        status: UNKNOWN_VALUE,
        integrity: UNKNOWN_VALUE
      };
    }

    return {
      id: String(firstKnown(system.organ_system_id, system.id, `ORGAN_SYSTEM_${index + 1}`)),
      name: String(firstKnown(system.name, system.label, system.organ_system_id, system.id, UNKNOWN_VALUE)),
      status: String(firstKnown(system.status, system.state, UNKNOWN_VALUE)),
      integrity: metricValue(firstKnown(system.integrity, system.integrity_state))
    };
  });
}

/** Create a privacy-minimized, read-only Life OS V1 projection. */
export function projectLifeProfile(profile = {}) {
  const safeProfile = isRecord(profile) ? profile : {};
  const species = isRecord(safeProfile.species_os)
    ? safeProfile.species_os
    : isRecord(safeProfile.speciesOs)
      ? safeProfile.speciesOs
      : {};
  const speciesOsValue = firstKnown(safeProfile.species_os, safeProfile.speciesOs);
  const state = isRecord(safeProfile.runtime_state)
    ? safeProfile.runtime_state
    : isRecord(safeProfile.runtimeState)
      ? safeProfile.runtimeState
      : isRecord(safeProfile.state)
        ? safeProfile.state
        : {};
  const runtimeStateValue = firstKnown(
    state.existence,
    state.runtime_state,
    isRecord(safeProfile.runtime_state) ? undefined : safeProfile.runtime_state,
    isRecord(safeProfile.runtimeState) ? undefined : safeProfile.runtimeState,
    safeProfile.life_state,
    safeProfile.status
  );
  const vitals = isRecord(safeProfile.public_vitals)
    ? safeProfile.public_vitals
    : isRecord(safeProfile.publicVitals)
      ? safeProfile.publicVitals
      : isRecord(safeProfile.vitals)
        ? safeProfile.vitals
        : {};
  const heartbeat = isRecord(safeProfile.heartbeat) ? safeProfile.heartbeat : {};
  const resolvedProfileId = firstKnown(profileIdentifier(safeProfile), UNKNOWN_VALUE);

  return Object.freeze({
    profileId: String(resolvedProfileId),
    lifeId: String(firstKnown(safeProfile.life_id, safeProfile.lifeId, resolvedProfileId)),
    individualId: String(firstKnown(safeProfile.individual_id, safeProfile.individualId, UNKNOWN_VALUE)),
    displayName: String(firstKnown(safeProfile.display_name, safeProfile.name, safeProfile.label, UNKNOWN_VALUE)),
    speciesCode: String(firstKnown(safeProfile.species_code, safeProfile.life_type, species.species_code, UNKNOWN_VALUE)),
    speciesOsId: String(firstKnown(
      safeProfile.species_os_id,
      isRecord(speciesOsValue) ? undefined : speciesOsValue,
      species.species_os_id,
      UNKNOWN_VALUE
    )),
    speciesOsVersion: String(firstKnown(safeProfile.species_os_version, species.species_os_version, UNKNOWN_VALUE)),
    runtimeState: String(firstKnown(runtimeStateValue, UNKNOWN_VALUE)),
    activityState: String(firstKnown(state.activity, safeProfile.activity_state, UNKNOWN_VALUE)),
    lifeStage: String(firstKnown(state.life_stage, safeProfile.life_stage, UNKNOWN_VALUE)),
    health: metricValue(firstKnown(safeProfile.health, state.health, state.health_state, vitals.health)),
    energy: metricValue(firstKnown(safeProfile.energy, state.energy, safeProfile.energy_state, vitals.energy)),
    rest: metricValue(firstKnown(safeProfile.rest, state.rest, state.activity, vitals.rest)),
    integrity: metricValue(firstKnown(safeProfile.integrity, safeProfile.integrity_state, state.integrity, vitals.integrity)),
    heartbeatStatus: String(firstKnown(heartbeat.status, heartbeat.state, safeProfile.heartbeat_status, UNKNOWN_VALUE)),
    heartbeatAt: String(firstKnown(heartbeat.last_at, heartbeat.recorded_at, safeProfile.last_heartbeat_at, safeProfile.heartbeat_at, UNKNOWN_VALUE)),
    heartbeatSequence: String(firstKnown(heartbeat.sequence, safeProfile.heartbeat_sequence, UNKNOWN_VALUE)),
    organSystems: Object.freeze(normalizeOrganSystems(safeProfile).map(Object.freeze))
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
    const term = createElement(documentRef, "dt", "life-os-viewer__label", label);
    const detail = createElement(
      documentRef,
      "dd",
      value === UNKNOWN_VALUE
        ? "life-os-viewer__value life-os-viewer__value--unknown"
        : "life-os-viewer__value",
      value
    );
    list.append(term, detail);
  });
  parent.appendChild(list);
}

function renderProjectedProfile(documentRef, projection) {
  const article = createElement(documentRef, "article", "life-os-viewer__profile");
  const heading = createElement(
    documentRef,
    "h4",
    "life-os-viewer__profile-title",
    projection.displayName === UNKNOWN_VALUE ? "Life profile" : projection.displayName
  );
  article.appendChild(heading);

  appendRows(documentRef, article, [
    ["Life ID", projection.lifeId],
    ["Individual", projection.individualId],
    ["Species", projection.speciesCode],
    ["Species OS", projection.speciesOsId],
    ["Species OS version", projection.speciesOsVersion],
    ["Runtime state", projection.runtimeState],
    ["Activity", projection.activityState],
    ["Life stage", projection.lifeStage],
    ["Health", projection.health],
    ["Energy", projection.energy],
    ["Rest", projection.rest],
    ["Integrity", projection.integrity],
    ["Heartbeat", projection.heartbeatStatus],
    ["Heartbeat at", projection.heartbeatAt],
    ["Heartbeat sequence", projection.heartbeatSequence]
  ]);

  const organSection = createElement(documentRef, "section", "life-os-viewer__organs");
  organSection.appendChild(createElement(documentRef, "h5", null, "Organ systems"));
  if (projection.organSystems.length === 0) {
    organSection.appendChild(
      createElement(documentRef, "p", "life-os-viewer__unknown", UNKNOWN_VALUE)
    );
  } else {
    const list = createElement(documentRef, "ul", "life-os-viewer__organ-list");
    projection.organSystems.forEach((system) => {
      const item = createElement(documentRef, "li", "life-os-viewer__organ");
      appendRows(documentRef, item, [
        ["System", system.name],
        ["Status", system.status],
        ["Integrity", system.integrity]
      ]);
      list.appendChild(item);
    });
    organSection.appendChild(list);
  }
  article.appendChild(organSection);
  return article;
}

/**
 * Render the Life OS projection without HTML parsing or write capabilities.
 * Returns the projections used by the view for integration and tests.
 */
export function renderLifeOsViewer(container, input = {}) {
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
  root.setAttribute("aria-label", "Life OS V1 status");
  root.appendChild(createElement(documentRef, "h3", "life-os-viewer__title", "Life OS V1"));

  if (projections.length === 0) {
    root.appendChild(
      createElement(documentRef, "p", "life-os-viewer__unknown", UNKNOWN_VALUE)
    );
  } else {
    projections.forEach((projection) => {
      root.appendChild(renderProjectedProfile(documentRef, projection));
    });
  }

  container.replaceChildren(root);
  return Object.freeze(projections);
}

export function createLifeOsViewer(container) {
  let lastInput = {};
  return Object.freeze({
    render(input = lastInput) {
      lastInput = input;
      return renderLifeOsViewer(container, input);
    },
    clear() {
      lastInput = {};
      container.replaceChildren();
    }
  });
}
