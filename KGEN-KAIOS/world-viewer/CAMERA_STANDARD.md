---
TITLE: "KAIOS World Viewer Camera Standard"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_BASELINE_FROZEN"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent UI review; Human delegated approval"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-001"
HUMAN_DECISION_ID: "HUMAN-WORLD-VIEWER-001; HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001; HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define two-dimensional camera, semantic zoom and navigation behavior for Earth-to-Room traversal."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: CameraContract
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerCameraStandard
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/CAMERA_STANDARD.md"
---

# Camera Standard

## 1. Scope

The V1 camera is a 2D map camera with semantic zoom. It is not a free-flight 3D camera.

## 2. Camera State

```text
CameraState {
  camera_id
  coordinate_frame
  center
  zoom_scalar
  semantic_level
  bearing_deg
  viewport_width_px
  viewport_height_px
  bounds
  parent_object_id
  focus_object_id
  source_snapshot_id
  updated_at
}
```

V1 default `bearing_deg` is zero. Rotation is not required. Pitch is fixed at zero and is not part of the V1 contract.

## 3. Coordinate Frames

| Semantic level | Camera frame | Center fields |
|---|---|---|
| Earth | `K280_GEODETIC` | latitude / longitude |
| Region | `K280_GEODETIC` | latitude / longitude |
| City | `K280_GEODETIC` | latitude / longitude |
| Land Parcel | `K280_GEODETIC` | latitude / longitude |
| Building | `PARCEL_LOCAL_ENU` | east / north |
| Room | `BUILDING_LOCAL_2D` | x / y plus floor reference |

Frame changes are explicit transitions. Camera coordinates may never be copied between frames without a declared adapter.

## 4. Semantic Levels

```text
EARTH
REGION
CITY
LAND_PARCEL
BUILDING
ROOM
```

Zoom thresholds are stored in viewer configuration and require hysteresis. This prevents rapid level switching near a threshold.

Threshold rules:

1. Ordered and non-overlapping.
2. Configurable without changing entity identity.
3. Validated against viewport size and data density.
4. Never used to infer legal area or ownership.
5. Building and Room entry requires a valid parent selection, not zoom alone.

## 5. Input Mapping

| Input | Camera action |
|---|---|
| Primary-button drag | Pan |
| Mouse wheel | Zoom around pointer anchor |
| Trackpad pinch | Zoom around gesture center |
| Touch drag | Pan |
| Touch pinch | Zoom |
| Double click / Enter | Fit selected child object |
| Breadcrumb Back / Escape | Fit parent object |
| Home action | Fit Earth K280 |
| Locate action | Fit authorized Player parcel or coarse location |

Drag must not accidentally trigger selection when movement exceeds the configured click tolerance.

## 6. Camera Operations

```text
PAN_BY_SCREEN_DELTA
ZOOM_AT_SCREEN_POINT
FIT_GEODETIC_BOUNDS
FIT_LOCAL_BOUNDS
FOCUS_OBJECT
ENTER_CHILD_LEVEL
EXIT_TO_PARENT_LEVEL
RESTORE_SAFE_CHECKPOINT
RESET_TO_EARTH
```

All operations return a new CameraState. They do not mutate Land, Building or Room records.

## 7. Drill-Down Rules

```text
Earth selection -> fit Region
Region selection -> fit City
City selection -> fit Parcel cluster or Parcel
Parcel selection -> fit Parcel and enable Building layer
Building selection -> fit footprint and enable Floor / Room projection
Room selection -> focus Room; no deeper V1 semantic level
```

When multiple children occupy the pointer location, the Selection Controller resolves the candidate before Camera enters a child level.

## 8. Camera Checkpoint

A privacy-safe local checkpoint may store:

- semantic level;
- coarse center;
- zoom scalar;
- selected public object ID;
- source snapshot ID.

It must not store precise GPS, private residence coordinates, auth tokens or owner-only data. A stale checkpoint is discarded when its snapshot or schema is incompatible.

## 9. Accessibility

The future implementation must support:

- Arrow-key pan.
- `+` and `-` zoom.
- Enter to drill into selection.
- Escape to return to parent.
- Focus-visible controls.
- Reduced-motion transitions.
- A text-equivalent breadcrumb and selected-object name.

Camera movement never depends on animation completion.

## 10. Failure Rules

- Invalid coordinates: reject camera operation.
- Missing parent frame: remain at current level.
- Empty bounds: do not guess a fit.
- Projection singularity: use approved map-engine handling and report degradation.
- Incompatible snapshot: reset affected focus and preserve the last valid parent state.
