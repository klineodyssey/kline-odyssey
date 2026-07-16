import {
  UNKNOWN_VALUE,
  projectLifeProfile,
  resolveLifeProfiles
} from "../life/life-os-viewer.js";

export const INSPECTOR_ENTITY_TYPES = Object.freeze([
  "EARTH",
  "REGION",
  "CITY",
  "PARCEL",
  "BUILDING",
  "ROOM"
]);

const COLLECTION_TYPES = Object.freeze([
  ["PARCEL", "parcels"],
  ["BUILDING", "buildings"],
  ["ROOM", "rooms"]
]);

const REQUIRED_FIELD_LABELS = Object.freeze([
  "Owner",
  "Governor",
  "Parcel ID",
  "Global UID",
  "Coordinate",
  "Surface K",
  "Area",
  "Current Land Use",
  "Proposed Land Use",
  "Buildings",
  "Population",
  "AI Workers",
  "Protection Zone",
  "Tax Authority",
  "Defense Authority",
  "Airspace Authority",
  "Data Freshness",
  "Source"
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
  return Array.isArray(value) ? value : [value];
}

function normalizeId(value) {
  return isKnown(value) ? String(value) : null;
}

function selectionId(selection) {
  if (typeof selection === "string" || typeof selection === "number") {
    return String(selection);
  }
  if (!isRecord(selection)) return null;
  return normalizeId(
    firstKnown(
      selection.selectedId,
      selection.selected_id,
      selection.objectId,
      selection.object_id,
      selection.id
    )
  );
}

function normalizeEntityType(value) {
  if (!isKnown(value)) return null;
  const type = String(value).toUpperCase();
  if (["PLANET", "EARTH_K280"].includes(type)) return "EARTH";
  if (["CITY_OVERLAY", "COUNTY", "TOWN"].includes(type)) return "CITY";
  if (["LAND_PARCEL", "PARCEL_OVERLAY"].includes(type)) return "PARCEL";
  return type;
}

function requestedEntityType(selection) {
  if (!isRecord(selection)) return null;
  const type = firstKnown(
    selection.entityType,
    selection.entity_type,
    selection.objectType,
    selection.object_type,
    selection.type
  );
  return normalizeEntityType(type);
}

function rootCandidates(world) {
  return [
    ["EARTH", world?.earth],
    ["REGION", world?.region],
    ...asArray(world?.regions).map((entity) => ["REGION", entity]),
    ["CITY", world?.cityOverlay ?? world?.city],
    ...asArray(world?.cities).map((entity) => ["CITY", entity])
  ];
}

function inferEntityType(world, entity) {
  const declared = requestedEntityType(entity);
  if (INSPECTOR_ENTITY_TYPES.includes(declared)) return declared;

  for (const [type, candidate] of rootCandidates(world)) {
    if (candidate === entity) return type;
  }
  for (const [type, collectionName] of COLLECTION_TYPES) {
    if (asArray(world?.[collectionName]).includes(entity)) return type;
  }
  return null;
}

/** Resolve only the six approved World Viewer semantic entity types. */
export function resolveInspectorEntity(world, selection) {
  if (!isRecord(world)) return null;

  if (isRecord(selection?.entity)) {
    const explicitType = requestedEntityType(selection) ?? inferEntityType(world, selection.entity);
    if (!INSPECTOR_ENTITY_TYPES.includes(explicitType)) return null;
    return {
      type: explicitType,
      id: normalizeId(selection.entity.id),
      entity: selection.entity
    };
  }

  const id = selectionId(selection);
  const typeHint = requestedEntityType(selection);

  for (const [type, entity] of rootCandidates(world)) {
    if (!isRecord(entity)) continue;
    if ((typeHint === type && !id) || normalizeId(entity.id) === id) {
      return { type, id: normalizeId(entity.id), entity };
    }
  }

  for (const [type, collectionName] of COLLECTION_TYPES) {
    if (typeHint && typeHint !== type) continue;
    const entity = asArray(world[collectionName]).find(
      (candidate) => isRecord(candidate) && normalizeId(candidate.id) === id
    );
    if (entity) return { type, id, entity };
  }

  if (!id && !typeHint && isRecord(world.earth)) {
    return { type: "EARTH", id: normalizeId(world.earth.id), entity: world.earth };
  }

  return null;
}

function formatScalar(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (typeof value === "boolean") return value ? "YES" : "NO";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : UNKNOWN_VALUE;
  if (typeof value === "string") return value;
  return UNKNOWN_VALUE;
}

function formatCoordinate(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (Array.isArray(value)) {
    return value.length ? value.map(formatScalar).join(", ") : UNKNOWN_VALUE;
  }
  if (!isRecord(value)) return formatScalar(value);

  const latitude = firstKnown(value.latitude_deg, value.latitude, value.lat);
  const longitude = firstKnown(value.longitude_deg, value.longitude, value.lon, value.lng);
  const altitude = firstKnown(value.altitude_m, value.altitude, value.alt_m);
  if (isKnown(latitude) || isKnown(longitude) || isKnown(altitude)) {
    return [
      `lat ${formatScalar(latitude)}`,
      `lon ${formatScalar(longitude)}`,
      `alt ${formatScalar(altitude)} m`
    ].join(", ");
  }

  const x = firstKnown(value.x, value.camera_x, value.screen_x);
  const y = firstKnown(value.y, value.camera_y, value.screen_y);
  if (isKnown(x) || isKnown(y)) {
    return `x ${formatScalar(x)}, y ${formatScalar(y)}`;
  }

  if (Array.isArray(value.bounds) && value.bounds.length > 0) {
    const prefix = isKnown(value.shape) ? `${formatScalar(value.shape)} ` : "";
    return `${prefix}bounds ${value.bounds.map(formatScalar).join(", ")}`;
  }

  return UNKNOWN_VALUE;
}

function formatArea(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  const formatted = formatScalar(value);
  return formatted === UNKNOWN_VALUE ? UNKNOWN_VALUE : `${formatted} m2`;
}

function formatCollection(value) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (Array.isArray(value)) {
    if (value.length === 0) return "0";
    return value.map((entry) => {
      if (isRecord(entry)) return formatScalar(firstKnown(entry.label, entry.name, entry.id));
      return formatScalar(entry);
    }).join(", ");
  }
  if (isRecord(value)) return formatScalar(firstKnown(value.label, value.name, value.id));
  return formatScalar(value);
}

function formatLinkedCollection(value, candidates = [], { includeCount = false } = {}) {
  if (!isKnown(value)) return UNKNOWN_VALUE;
  if (!Array.isArray(value)) return formatCollection(value);
  if (value.length === 0) return "0";
  const labels = value.map((entry) => {
    if (isRecord(entry)) return formatScalar(firstKnown(entry.label, entry.display_name, entry.name, entry.id));
    const id = normalizeId(entry);
    const match = candidates.find((candidate) => normalizeId(candidate?.id) === id);
    return formatScalar(firstKnown(match?.label, match?.display_name, match?.name, match?.id, entry));
  });
  return includeCount ? `${value.length} / ${labels.join(", ")}` : labels.join(", ");
}

function surfaceK(entity, world) {
  const canonical = isRecord(entity?.canonical) ? entity.canonical : {};
  const direct = firstKnown(
    entity?.surface_k,
    entity?.surfaceK,
    canonical.surface_k,
    world?.earth?.surface_k,
    world?.earth?.surfaceK
  );
  if (isKnown(direct)) return formatScalar(direct).startsWith("K") ? formatScalar(direct) : `K${direct}`;

  const frame = firstKnown(canonical.coordinate_frame, entity?.coordinate_frame, world?.earth?.coordinate_frame);
  const match = typeof frame === "string" ? frame.match(/^K(\d+)/i) : null;
  return match ? `K${match[1]}` : UNKNOWN_VALUE;
}

function matchingProposal(proposal, entityId) {
  const proposals = asArray(proposal);
  return proposals.find((candidate) => {
    if (!isRecord(candidate)) return false;
    return normalizeId(firstKnown(candidate.parcel_id, candidate.entity_id, candidate.object_id)) === entityId;
  }) ?? null;
}

function parentParcel(world, resolved) {
  if (resolved.type === "PARCEL") return resolved.entity;

  let parcelId = null;
  if (resolved.type === "BUILDING") {
    parcelId = normalizeId(resolved.entity.parcel_id);
  } else if (resolved.type === "ROOM") {
    const buildingId = normalizeId(resolved.entity.building_id);
    const building = asArray(world.buildings).find(
      (candidate) => isRecord(candidate) && normalizeId(candidate.id) === buildingId
    );
    parcelId = normalizeId(building?.parcel_id);
  }

  return asArray(world.parcels).find(
    (candidate) => isRecord(candidate) && normalizeId(candidate.id) === parcelId
  ) ?? null;
}

function dataFreshness(entity, meta) {
  const direct = firstKnown(entity.data_freshness, entity.generated_at, meta.generated_at);
  if (isKnown(direct)) return formatScalar(direct);
  return ["STALE", "RESTRICTED", "UNKNOWN"].includes(entity.status)
    ? entity.status
    : UNKNOWN_VALUE;
}

function relatedBuildings(world, resolved) {
  const buildings = asArray(world.buildings).filter(isRecord);
  const explicit = firstKnown(resolved.entity.buildings, resolved.entity.building_ids);
  if (isKnown(explicit)) return formatLinkedCollection(explicit, buildings, { includeCount: true });
  if (resolved.type === "BUILDING") return formatCollection([resolved.entity]);
  if (resolved.type === "ROOM") {
    const buildingId = normalizeId(resolved.entity.building_id);
    const building = buildings.find((candidate) => normalizeId(candidate.id) === buildingId);
    return building ? formatCollection([building]) : UNKNOWN_VALUE;
  }
  if (resolved.type !== "PARCEL") return UNKNOWN_VALUE;

  const matches = buildings.filter(
    (building) => isRecord(building) && normalizeId(building.parcel_id) === resolved.id
  );
  return matches.length ? `${matches.length} / ${formatCollection(matches)}` : "0";
}

function relatedAiWorkers(world, resolved) {
  const profiles = [
    ...asArray(world.lifeProfiles),
    ...asArray(world.aiWorkers)
  ].filter(isRecord);
  const explicit = firstKnown(
    resolved.entity.ai_workers,
    resolved.entity.aiWorkers,
    resolved.entity.ai_worker_ids,
    resolved.entity.aiWorkerIds,
    resolved.entity.ai_worker_count
  );
  if (isKnown(explicit)) {
    return Array.isArray(explicit)
      ? formatLinkedCollection(explicit, profiles, { includeCount: true })
      : formatScalar(explicit);
  }

  const relationField = resolved.type === "PARCEL"
    ? "parcel_id"
    : resolved.type === "BUILDING"
      ? "building_id"
      : resolved.type === "ROOM"
        ? "room_id"
        : null;
  if (!relationField) return UNKNOWN_VALUE;

  const matches = profiles.filter(
    (worker) => normalizeId(worker[relationField]) === resolved.id
      && String(firstKnown(worker.life_type, worker.species_code, "")).toUpperCase().includes("AI")
  );
  return matches.length
    ? `${matches.length} / ${formatCollection(matches)}`
    : "0";
}

function canonicalCoordinate(entity) {
  const canonical = isRecord(entity.canonical) ? entity.canonical : {};
  return formatCoordinate(firstKnown(
    entity.canonical_coordinate,
    canonical.coordinate,
    canonical.earth_surface_position,
    Object.keys(canonical).length ? canonical : null,
    entity.coordinate
  ));
}

function projectedCoordinate(entity) {
  return formatCoordinate(firstKnown(
    entity.projected_screen_coordinate,
    entity.viewer_coordinate,
    entity.view,
    entity.viewer
  ));
}

function rowsToObject(rows) {
  return Object.fromEntries(rows.map(([label, value]) => [label, value]));
}

/** Build the four-group read-only Inspector projection. */
export function createInspectorProjection({
  world = {},
  selection = null,
  proposal = null,
  viewerState = {}
} = {}) {
  const resolved = resolveInspectorEntity(world, selection);
  if (!resolved) return null;

  const entity = resolved.entity;
  const canonical = isRecord(entity.canonical) ? entity.canonical : {};
  const meta = isRecord(world.meta) ? world.meta : {};
  const draft = matchingProposal(proposal, resolved.id);
  const parcel = parentParcel(world, resolved);
  const parcelCanonical = isRecord(parcel?.canonical) ? parcel.canonical : {};
  const entityCoordinate = canonicalCoordinate(entity);
  const coordinate = entityCoordinate === UNKNOWN_VALUE && parcel && parcel !== entity
    ? canonicalCoordinate(parcel)
    : entityCoordinate;

  const canonicalRows = [
    ["Owner", formatScalar(firstKnown(entity.owner_id, entity.owner, parcel?.owner_id, parcel?.owner))],
    ["Governor", formatScalar(firstKnown(
      entity.viewer_governor,
      entity.governor_id,
      entity.governor,
      parcel?.governor_id,
      parcel?.governor
    ))],
    ["Parcel ID", formatScalar(firstKnown(
      canonical.parcel_id,
      parcelCanonical.parcel_id,
      parcel?.id,
      resolved.type === "PARCEL" ? entity.id : undefined
    ))],
    ["Global UID", formatScalar(firstKnown(canonical.global_uid, entity.global_uid, parcelCanonical.global_uid))],
    ["Coordinate", coordinate],
    ["Surface K", surfaceK(entity, world)],
    ["Area", formatArea(firstKnown(entity.area_m2, canonical.area_m2, canonical.ground_m2, parcel?.area_m2))],
    ["Current Land Use", formatScalar(firstKnown(
      entity.current_land_use,
      entity.land_use,
      parcel?.current_land_use,
      parcel?.land_use
    ))],
    ["Protection Zone", formatScalar(firstKnown(entity.protection_zone, entity.zone_type, parcel?.protection_zone))],
    ["Tax Authority", formatScalar(firstKnown(entity.tax_authority_id, entity.tax_authority, parcel?.tax_authority_id))],
    ["Defense Authority", formatScalar(firstKnown(entity.defense_authority_id, entity.defense_authority, parcel?.defense_authority_id))],
    ["Airspace Authority", formatScalar(firstKnown(entity.airspace_authority_id, entity.airspace_authority, parcel?.airspace_authority_id))],
    ["Source", formatScalar(firstKnown(entity.source, canonical.source, parcel?.source, meta.source))]
  ];

  const viewerRows = [
    ["Entity Type", resolved.type],
    ["Label", formatScalar(firstKnown(entity.label, entity.name))],
    ["Projected Coordinate", projectedCoordinate(entity)],
    ["LOD", formatScalar(firstKnown(viewerState.lod, viewerState.lod_level, entity.lod))],
    ["Visibility", formatScalar(firstKnown(viewerState.visibility, entity.visibility, entity.status))],
    ["Buildings", relatedBuildings(world, resolved)],
    ["Population", formatScalar(firstKnown(entity.population, entity.population_count, parcel?.population))],
    ["AI Workers", relatedAiWorkers(world, resolved)],
    ["Data Freshness", dataFreshness(entity, meta)],
    ["Source Revision", formatScalar(firstKnown(entity.source_revision, canonical.source_revision, meta.source_revision))]
  ];

  const proposalRows = [
    ["Proposal ID", formatScalar(firstKnown(draft?.proposal_id, draft?.intent_id, draft?.id))],
    ["Proposed Land Use", formatScalar(firstKnown(draft?.requested_land_use, draft?.land_use))],
    ["Review Status", formatScalar(firstKnown(draft?.review_status, draft?.status))],
    ["Estimated Cost", formatScalar(draft?.estimated_cost)],
    ["Environmental Impact", formatScalar(draft?.environment_impact)],
    ["Neighbor Impact", formatScalar(draft?.neighbor_impact)]
  ];

  const combined = new Map([...canonicalRows, ...viewerRows, ...proposalRows]);
  const unknownRows = REQUIRED_FIELD_LABELS
    .filter((label) => !combined.has(label) || combined.get(label) === UNKNOWN_VALUE)
    .map((label) => [label, UNKNOWN_VALUE]);
  if (unknownRows.length === 0) unknownRows.push(["Missing Fields", "NONE"]);

  const lifeProfiles = resolveLifeProfiles({ world, entity });
  return Object.freeze({
    type: resolved.type,
    id: resolved.id,
    entity,
    canonicalData: Object.freeze(rowsToObject(canonicalRows)),
    viewerData: Object.freeze(rowsToObject(viewerRows)),
    proposalData: Object.freeze(rowsToObject(proposalRows)),
    unknownData: Object.freeze(rowsToObject(unknownRows)),
    lifeProfiles: Object.freeze(lifeProfiles.map(projectLifeProfile)),
    lifeProfileSources: Object.freeze([...lifeProfiles])
  });
}

function createElement(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

function renderDataGroup(documentRef, title, values, modifier) {
  const section = createElement(
    documentRef,
    "section",
    `inspector-view__group inspector-view__group--${modifier}`
  );
  section.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", title));
  const list = createElement(documentRef, "dl", "inspector-view__data");

  Object.entries(values).forEach(([label, value]) => {
    const term = createElement(documentRef, "dt", "inspector-view__label", label);
    const detail = createElement(
      documentRef,
      "dd",
      value === UNKNOWN_VALUE
        ? "inspector-view__value inspector-view__value--unknown"
        : "inspector-view__value",
      value
    );
    list.append(term, detail);
  });

  section.appendChild(list);
  return section;
}

function renderLandLifeSummary(documentRef, projection) {
  const lifeNames = projection.lifeProfiles.map((profile) => (
    profile.displayName === UNKNOWN_VALUE ? profile.lifeId : profile.displayName
  ));
  const rows = [
    ["Owner", projection.canonicalData.Owner],
    ["Parcel ID", projection.canonicalData["Parcel ID"]],
    ["K280", projection.canonicalData["Surface K"]],
    ["Coordinate", projection.canonicalData.Coordinate],
    ["Land Use", projection.canonicalData["Current Land Use"]],
    ["Building", projection.viewerData.Buildings],
    ["Life", lifeNames.length ? `${lifeNames.length} / ${lifeNames.join(", ")}` : "0"],
    ["AI Worker", projection.viewerData["AI Workers"]]
  ];
  const section = createElement(documentRef, "section", "inspector-view__summary");
  section.setAttribute("aria-label", "Land and life summary");
  section.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", "Land and Life"));
  const list = createElement(documentRef, "dl", "inspector-view__summary-data");
  rows.forEach(([label, value]) => {
    list.append(
      createElement(documentRef, "dt", "inspector-view__summary-label", label),
      createElement(
        documentRef,
        "dd",
        value === UNKNOWN_VALUE
          ? "inspector-view__summary-value inspector-view__value--unknown"
          : "inspector-view__summary-value",
        value
      )
    );
  });
  section.appendChild(list);
  return section;
}

function actionButton(documentRef, label, className, handler, options = {}) {
  const button = createElement(documentRef, "button", className, label);
  button.type = "button";
  button.title = options.title ?? label;
  button.setAttribute("aria-label", options.ariaLabel ?? label);
  if (options.expanded !== undefined) {
    button.setAttribute("aria-expanded", String(options.expanded));
  }
  if (options.disabled) button.disabled = true;
  if (typeof handler === "function") button.addEventListener("click", handler);
  return button;
}

/** Render the responsive right-panel / mobile-bottom-sheet Inspector shell. */
export function renderInspectorView(container, input = {}, callbacks = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("Inspector container must be a DOM element");
  }
  const documentRef = container.ownerDocument ?? globalThis.document;
  if (!documentRef?.createElement) throw new TypeError("Inspector requires a DOM document");

  const projection = createInspectorProjection(input);
  const expanded = Boolean(input.expanded);
  const root = createElement(documentRef, "section", "inspector-view");
  root.dataset.desktopPosition = "right";
  root.dataset.mobilePosition = "bottom-sheet";
  root.dataset.expanded = String(expanded);
  root.setAttribute("aria-label", "World object inspector");

  const header = createElement(documentRef, "header", "inspector-view__header");
  header.appendChild(
    createElement(
      documentRef,
      "h2",
      "inspector-view__title",
      projection ? `${projection.type} Inspector` : "Inspector"
    )
  );
  const actions = createElement(documentRef, "div", "inspector-view__actions");
  actions.appendChild(actionButton(
    documentRef,
    expanded ? "Collapse" : "Expand",
    "inspector-view__action inspector-view__action--expand",
    () => callbacks.onToggleExpanded?.(!expanded, projection),
    { expanded, ariaLabel: expanded ? "Collapse inspector" : "Expand inspector" }
  ));
  actions.appendChild(actionButton(
    documentRef,
    "Close",
    "inspector-view__action inspector-view__action--close",
    () => callbacks.onClose?.(projection),
    { ariaLabel: "Close inspector" }
  ));
  header.appendChild(actions);
  root.appendChild(header);

  if (!projection) {
    root.appendChild(createElement(
      documentRef,
      "p",
      "inspector-view__empty",
      "Select Earth, Region, City, Parcel, Building, or Room."
    ));
    container.replaceChildren(root);
    return null;
  }

  root.append(
    renderLandLifeSummary(documentRef, projection),
    renderDataGroup(documentRef, "Land Record (Read Only)", projection.canonicalData, "canonical"),
    renderDataGroup(documentRef, "Viewer Context", projection.viewerData, "viewer"),
    renderDataGroup(documentRef, "Local Proposal (Proposal Only)", projection.proposalData, "proposal"),
    renderDataGroup(documentRef, "Unavailable Fields", projection.unknownData, "unknown")
  );

  const lifeSection = createElement(documentRef, "section", "inspector-view__life");
  lifeSection.appendChild(createElement(documentRef, "h3", "inspector-view__group-title", "Life OS"));
  if (projection.lifeProfiles.length === 0) {
    lifeSection.appendChild(actionButton(
      documentRef,
      "Life: UNKNOWN",
      "inspector-view__life-action",
      null,
      { disabled: true }
    ));
  } else {
    projection.lifeProfiles.forEach((profile, index) => {
      const label = profile.displayName === UNKNOWN_VALUE
        ? `Life ${profile.lifeId}`
        : profile.displayName;
      lifeSection.appendChild(actionButton(
        documentRef,
        label,
        "inspector-view__life-action",
        () => callbacks.onOpenLife?.(profile, projection, projection.lifeProfileSources[index]),
        { ariaLabel: `Open Life OS status for ${label}` }
      ));
    });
  }
  root.appendChild(lifeSection);

  container.replaceChildren(root);
  return projection;
}

export function createInspectorView({
  container,
  onClose,
  onExpandedChange,
  onOpenLife
}) {
  let expanded = false;
  let visible = true;
  let lastInput = {};
  let lastProjection = null;

  function render(input = lastInput) {
    lastInput = input;
    container.hidden = !visible;
    if (!visible) return lastProjection;
    lastProjection = renderInspectorView(
      container,
      { ...input, expanded },
      {
        onClose(projection) {
          visible = false;
          container.hidden = true;
          onClose?.(projection);
        },
        onToggleExpanded(nextExpanded, projection) {
          expanded = Boolean(nextExpanded);
          render(lastInput);
          onExpandedChange?.(expanded, projection);
        },
        onOpenLife
      }
    );
    return lastProjection;
  }

  return Object.freeze({
    render,
    open(input = lastInput) {
      visible = true;
      return render(input);
    },
    close() {
      visible = false;
      container.hidden = true;
      onClose?.(lastProjection);
    },
    setExpanded(nextExpanded) {
      expanded = Boolean(nextExpanded);
      return render(lastInput);
    },
    snapshot() {
      return Object.freeze({ expanded, visible, projection: lastProjection });
    }
  });
}
