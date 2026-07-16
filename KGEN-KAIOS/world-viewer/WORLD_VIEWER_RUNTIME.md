---
TITLE: "KAIOS World Viewer Runtime Architecture"
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
CHANGE_REASON: "Define the module, state, event and data-loading contracts for a static-first World Viewer."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: ViewerRuntime
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerRuntimeArchitecture
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_RUNTIME.md"
---

# World Viewer Runtime

## 1. Runtime Boundary

This document specifies a future browser runtime. It does not provide executable code.

The runtime is:

- Web first.
- Static-read capable.
- Provider neutral.
- Snapshot versioned.
- Map first.
- Intent producing, not registry mutating.

## 2. Modules

| Module | Responsibility | Must not do |
|---|---|---|
| `ViewerBoot` | Validate manifest, source versions and feature flags | Start with incompatible sources |
| `StaticSnapshotLoader` | Fetch public projections with cancellation and cache policy | Read secrets or private registries |
| `MapEngineAdapter` | Pan, zoom, project and render 2D layers | Define ownership or K280 meaning |
| `CameraController` | Maintain camera state and semantic level | Modify entity state |
| `SemanticLevelResolver` | Resolve Earth through Room visibility | Derive ownership from zoom |
| `LayerController` | Activate layers for the current level | Load every object at once |
| `SpatialIndex` | Find visible and selectable candidates | Decide legal rights |
| `SelectionController` | Maintain hover, focus and selection | Persist land mutations |
| `ContextActionResolver` | Filter proposal actions by public capability projection | Grant rights |
| `InspectorProjection` | Present selected-object fields | Reveal private data |
| `PlayerLocatorAdapter` | Resolve account parcel or consented coarse location | Treat GPS as ownership proof |
| `IntentGatewayAdapter` | Preview or submit governed intents when authorized | Write without a reviewed gateway |
| `ViewerErrorBoundary` | Isolate failed layers and expose diagnostics | Hide source conflicts |

## 3. Runtime State Machine

```text
OFFLINE
-> BOOTSTRAPPING
-> LOADING_MANIFEST
-> LOADING_WORLD
-> READY
```

Interactive substates of `READY`:

```text
NAVIGATING
SELECTING
CONTEXT_OPEN
LOCATING_PLAYER
PREVIEWING_INTENT
```

Failure states:

```text
DEGRADED_READ_ONLY
SOURCE_CONFLICT
PRIVACY_BLOCKED
ERROR
```

Rules:

1. `SOURCE_CONFLICT` disables affected selection and all intents.
2. `DEGRADED_READ_ONLY` may retain camera navigation.
3. A failed optional base-map provider does not invalidate KGEN registry geometry.
4. No state transitions directly to registry mutation.

## 4. Boot Sequence

```text
Load WorldViewerManifest
-> Validate viewer schema version
-> Validate K280 / Land source references
-> Load Earth and hierarchy index
-> Initialize 2D map adapter
-> Restore privacy-safe camera checkpoint
-> Load visible Region projections
-> Enter READY
```

Deferred layers load only when the semantic level requires them.

## 5. Data Load Order

| Priority | Projection | Loading rule |
|---|---|---|
| P0 | Viewer manifest and source revisions | Blocking |
| P1 | Earth, Region and City hierarchy | Blocking for navigation |
| P2 | Visible Parcel tiles | Viewport scoped |
| P3 | Selected Parcel detail | On selection |
| P4 | Building footprints | Parcel / Building level only |
| P5 | Floors and Rooms | Selected Building only |
| P6 | Player land projection | Authenticated and consent scoped |

Requests must support cancellation when the camera leaves a viewport or semantic level.

## 6. Runtime Events

```text
VIEWER_BOOT_STARTED
VIEWER_READY
SOURCE_CONFLICT_DETECTED
CAMERA_CHANGED
SEMANTIC_LEVEL_CHANGED
LAYER_LOAD_STARTED
LAYER_LOAD_COMPLETED
LAYER_LOAD_FAILED
SELECTION_CHANGED
CONTEXT_MENU_OPENED
CONTEXT_MENU_CLOSED
PLAYER_LOCATE_REQUESTED
PLAYER_LOCATE_COMPLETED
PLAYER_LOCATE_DENIED
LAND_USE_INTENT_PREVIEWED
LAND_USE_INTENT_SUBMISSION_BLOCKED
```

Events are local telemetry drafts. They must not include private GPS, secrets, wallet credentials or unrestricted owner records.

## 7. Snapshot Consistency

Every loaded object is bound to one `snapshot_id` and `source_revision`. The viewer may not combine a Parcel from one registry revision with Building or Room records from an incompatible revision.

Selection retains:

```text
object_id
object_type
snapshot_id
source_revision
geometry_revision
```

If a newer snapshot arrives, selection is revalidated by stable ID. Geometry is never silently reused after revision mismatch.

## 8. Scale Strategy

V1 architecture requires:

- Semantic LOD.
- Viewport data tiling.
- Region / City / Parcel spatial indexes.
- Lazy Building and Room loading.
- Request cancellation.
- Versioned client cache.
- Worker-compatible geometry validation boundary.

Feature-count limits and tile dimensions remain configurable. They must be established by performance evidence, not guessed in this proposal.

## 9. Player Location Runtime

Preferred locate order:

1. Authenticated `starter_parcel_id`.
2. Authenticated `home_parcel`.
3. Explicitly selected owned or leased parcel.
4. One-time consented Region / City location.
5. Public default Earth view.

GPS is never required to view the world and never changes ownership.

## 10. Command Boundary

The only V1 architecture command is a draft intent:

```text
LandUseProposalIntent {
  intent_id
  player_id
  parcel_id
  requested_use
  source_snapshot_id
  source_geometry_revision
  created_at
  consent_reference
  capability_reference
  status
}
```

Allowed local status values:

```text
DRAFT_LOCAL
PREVIEW_VALIDATED
SUBMISSION_UNAVAILABLE
```

Future remote statuses require a separately approved command gateway and are not defined here.

## 11. Observability

Architecture-level health signals:

- Manifest load latency.
- Visible tile load latency.
- Geometry rejection count.
- Selection latency.
- Stale snapshot detection.
- Base-map provider failure.
- Context action denied reason.
- GPS consent result without precise coordinates.

Public telemetry must be aggregate and privacy safe.

## 12. Stop Conditions

Runtime implementation must stop when:

- No authoritative Land projection source is approved.
- Region, City, Building or Room identity is ambiguous.
- Map dependency license or integrity is unresolved.
- A requirement needs direct GitHub write from the browser.
- GPS collection lacks privacy review.
- A context action would bypass Land Runtime review.
- A protected Runtime or frozen baseline must be changed.
