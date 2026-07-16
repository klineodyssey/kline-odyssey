---
TITLE: "KAIOS World Viewer V1 Architecture"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_BASELINE_FROZEN"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent UI review; Human delegated approval"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-001"
HUMAN_DECISION_ID: "HUMAN-WORLD-VIEWER-001; HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001; HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define a map-first, Web-first viewer architecture for K280 land navigation and governed action intents."
ANCESTOR: "KGEN-KAIOS/V8.1/index.html; KGEN-KAIOS/land/LAND_RUNTIME_ARCHITECTURE_BASELINE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: WorldViewer
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerV1Architecture
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
---

# World Viewer Architecture

## 1. Objective

World Viewer V1 is the player's primary visual entry to K280 land. The map is the application, not a dashboard surrounding a small preview.

Primary interaction:

```text
Mouse Drag -> Move camera
Mouse Wheel / Trackpad -> Zoom semantic level
Left Click -> Select object
Right Click -> Open governed context actions
```

The architecture must remain usable as static files on GitHub Pages. It must not require a backend for read-only navigation.

## 2. Non-Goals

This phase does not authorize:

- HTML, CSS, JavaScript or map-engine implementation.
- 3D globe, terrain, buildings or room rendering.
- Art direction, textures, particle effects or large animation systems.
- Real login, KYC, GPS collection or continuous tracking.
- Land ownership mutation, Starter Parcel issuance or registry writes.
- Real payments, Land NFT, contract calls or wallet signing.
- Pages route or workflow modification.

## 3. Runtime Topology

```text
Future index.html
-> Viewer Shell
-> Static Snapshot Loader
-> Map Engine Adapter
-> Camera Controller
-> Semantic Level Resolver
-> Layer Controller
-> Spatial Index
-> Selection Controller
-> Inspector Projection
-> Context Action Resolver
-> Intent Gateway Adapter
```

Data dependencies remain outside the viewer:

```text
Universe Map Selector
Land Runtime Snapshot
Region / City Index
Parcel Geometry Projection
Building Projection
Room Projection
Player Session Projection
```

The viewer never becomes the authoritative registry.

## 4. Single Entry Rule

The future source entry is exactly:

```text
KGEN-KAIOS/world-viewer/index.html
```

Rules:

1. No versioned entry such as `world-viewer-v1.html`.
2. No second application boot file.
3. Public `/world-viewer/` resolves to this entry through Pages packaging.
4. Supporting assets may be split for caching and maintenance.
5. A direct asset URL never becomes an alternate application entry.

## 5. Map Engine Boundary

V1 is a two-dimensional geographic viewer. Implementation must use a proven 2D map library through `MapEngineAdapter` rather than hand-building pan, zoom, projection and accessibility primitives.

An implementation review may evaluate a Leaflet-compatible 2D engine with Canvas or SVG polygon rendering. Library version, license, vendoring, Subresource Integrity, offline behavior and tile-provider terms remain unresolved and require approval before code is added.

The map engine owns viewport mechanics only. It does not own:

- K280 meaning.
- Parcel identity.
- Ownership geometry.
- Owner or authority records.
- Land-use decisions.
- Player identity.

## 6. Semantic Hierarchy

| Level | Primary frame | Visible objects | Selection result |
|---|---|---|---|
| `EARTH` | K280 geodetic | Planet outline, broad regions | Earth or Region |
| `REGION` | K280 geodetic | Region boundaries, city clusters | Region or City |
| `CITY` | K280 geodetic | City boundary, parcel clusters | City or Parcel |
| `LAND_PARCEL` | Geodetic polygon | Parcel boundaries and land-use overlays | Parcel |
| `BUILDING` | Parcel Local ENU | Building footprints and entrances | Building |
| `ROOM` | Building / floor local frame | Floors and rooms | Room |

Semantic thresholds are configuration, not ownership logic. Zooming does not create or destroy entities.

## 7. Interaction Model

### 7.1 Primary map actions

- Drag pans the camera.
- Wheel, trackpad pinch or touch pinch changes zoom.
- Left click selects the top eligible object at the current semantic level.
- Right click opens a context menu for the selected Parcel.
- Double click or Enter drills into the selected object.
- Breadcrumb Back moves to the parent semantic level.

### 7.2 Parcel action vocabulary

The V1 context vocabulary is:

```text
RESIDENTIAL
FARM
FOREST
FACTORY
MARKETPLACE
TEMPLE
MINE
ROAD
```

These labels create a `LAND_USE_PROPOSAL` intent. They do not directly mutate `land_use`, rights, ownership or registry status.

## 8. Read And Write Boundaries

| Capability | Static Pages V1 | Future governed runtime |
|---|---|---|
| Load public map snapshots | Allowed | Allowed |
| Pan, zoom and select | Allowed | Allowed |
| Show owner and parcel information | Public projection only | Capability-scoped projection |
| Locate account Starter Parcel | Mock/session adapter only | Authenticated account lookup |
| Request one-time location | Not implemented | Consent-gated adapter |
| Preview land-use proposal | Allowed locally | Allowed |
| Persist proposal | Not allowed | Approved command gateway only |
| Change ownership or rights | Not allowed | Separate high-risk workflow |

## 9. Data Projection Contracts

The viewer consumes projections, never raw private registries:

```text
WorldViewerManifest
RegionProjection
CityProjection
ParcelProjection
BuildingProjection
RoomProjection
PlayerLandProjection
```

Every projection declares:

- `snapshot_id`
- `schema_version`
- `source_revision`
- `generated_at`
- `privacy_class`
- `stale_after`
- `objects`

The implementation must fail closed when source revision, coordinate model or schema is incompatible.

## 10. Privacy And GPS

GPS is optional input, not ownership evidence.

Future login flow:

```text
Authenticated Player
-> Resolve starter_parcel_id from account projection
-> Load Parcel by ID
-> Fit Camera to Parcel boundary
```

Optional location flow:

```text
Explicit one-time consent
-> Browser location adapter
-> Coarse Region / City match
-> Candidate birth or navigation anchor
-> Discard precise reading unless separately authorized
```

The viewer must not expose precise private coordinates, store location in URLs, write location to logs, or treat location as proof of ownership.

## 11. Failure Model

| Failure | Viewer behavior |
|---|---|
| Map tiles unavailable | Continue with KGEN vector overlays and neutral background if available |
| Registry snapshot unavailable | Show `DEGRADED_READ_ONLY`; no context actions |
| Geometry invalid | Quarantine object; never guess ownership boundary |
| Schema incompatible | Stop affected layer and report version conflict |
| GPS denied | Continue with account parcel or manual navigation |
| Session missing | Public read-only mode |
| Command gateway absent | Keep proposal local and clearly unsubmitted |

## 12. Architecture Risks

1. Frozen Land Runtime currently has no browser-ready parcel dataset.
2. Building and Room geometry are not approved.
3. Static Pages cannot securely persist authorized commands.
4. External tile services introduce availability, privacy and licensing constraints.
5. Web Mercator display can distort area and boundaries.
6. Exact GPS can expose sensitive personal location.
7. Large parcel sets require LOD, tiling and spatial indexes.
8. Semantic zoom can confuse users if selection changes without visible hierarchy state.

All eight risks must be resolved or accepted during independent UI architecture review.

## 13. Review Gate

Architecture remains `UNDER_HUMAN_REVIEW`. Implementation planning, dependencies, schemas, Pages routes and executable files require a later Human decision.
