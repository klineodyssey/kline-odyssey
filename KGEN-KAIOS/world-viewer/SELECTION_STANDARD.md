---
TITLE: "KAIOS World Viewer Selection Standard"
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
CHANGE_REASON: "Define deterministic object picking and governed parcel context actions."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: SelectionContract
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerSelectionStandard
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/SELECTION_STANDARD.md"
---

# Selection Standard

## 1. Selection Principle

Selection identifies an object in a specific snapshot. It does not grant rights, change ownership or mutate land use.

## 2. Selection State

```text
SelectionState {
  selection_id
  object_type
  object_id
  parent_object_id
  semantic_level
  source_snapshot_id
  source_revision
  geometry_revision
  selected_at
  selection_method
  public_capabilities
}
```

Allowed `object_type` values for V1:

```text
EARTH
REGION
CITY
LAND_PARCEL
BUILDING
ROOM
```

## 3. Pointer Rules

### Left click

1. Reject if the gesture was a drag.
2. Convert screen point through the active coordinate adapter.
3. Query the visible spatial index.
4. Perform exact geometry tests for candidates.
5. Select the highest-priority eligible object.
6. Update the inspector.

### Right click

1. Prevent the browser menu only inside the map interaction surface.
2. Resolve or retain the Parcel selection.
3. Evaluate public capability and zone projections.
4. Open a bounded context menu.
5. Emit no mutation until an explicit action is chosen.

Touch uses a deliberate long press as the context-menu equivalent. It must not conflict with map pan.

## 4. Geometry Picking

| Level | Candidate test |
|---|---|
| Earth / Region / City | Map-engine feature query plus authoritative ID validation |
| Parcel | Geodetic point-in-polygon against the source geometry model |
| Building | Point-in-polygon in Parcel Local ENU |
| Room | Point-in-polygon in Building / Floor local frame |

Screen pixels and rendered line width are not ownership geometry.

## 5. Candidate Priority

Priority is deterministic:

1. Current semantic level.
2. Smallest containing eligible geometry.
3. Explicit visual stacking order.
4. Stable object ID as final tie-breaker.

If materially different rights-bearing objects remain ambiguous, show a disambiguation list. Do not choose by last-loaded order.

## 6. Parcel Context Actions

| Menu value | Intent value | Required projection |
|---|---|---|
| Residential | `RESIDENTIAL` | Building right eligibility |
| Farm | `FARM` | Farming right eligibility |
| Forest | `FOREST` | Conservation / forestry eligibility |
| Factory | `FACTORY` | Industrial eligibility |
| Marketplace | `MARKETPLACE` | Commercial eligibility |
| Temple | `TEMPLE` | Temple-use eligibility |
| Mine | `MINE` | Resource right eligibility |
| Road | `ROAD` | Public infrastructure / access eligibility |

All actions create the same intent type:

```text
LAND_USE_PROPOSAL
```

The menu is not proof that an action will be approved.

## 7. Context Eligibility

Context actions are hidden or disabled when:

- The selected object is not a Parcel.
- The registry snapshot is stale or invalid.
- The player session is absent for a non-public action.
- Ownership or delegated capability is missing.
- The Parcel is disputed, suspended or archived.
- A protected zone forbids the proposed use.
- Required rights or impact review are unavailable.
- No approved Intent Gateway exists.

A disabled action exposes a concise reason through accessible help text or tooltip.

## 8. Selection And Inspector

Every valid Parcel selection projects at least:

```text
Owner
Parcel ID
Coordinate
Ground (K280)
Area
Building
Population
AI Workers
```

Unknown values display `UNAVAILABLE`, not zero. Restricted values display `RESTRICTED`, not placeholder personal data.

## 9. Selection Events

```text
SELECTION_REQUESTED
SELECTION_CHANGED
SELECTION_CLEARED
SELECTION_AMBIGUOUS
SELECTION_REJECTED
CONTEXT_MENU_OPENED
CONTEXT_ACTION_PREVIEWED
CONTEXT_ACTION_BLOCKED
```

## 10. Keyboard And Assistive Input

- Tab reaches map controls and the inspector.
- Enter selects the focused map object or drills down.
- Shift+F10 opens the context menu for the selected Parcel.
- Escape closes the menu or clears transient hover.
- Selection changes are announced through a concise live region.

## 11. Security Boundary

Selection payloads must not contain credentials, private GPS, raw KYC, private wallet data or unrestricted owner identity. The browser may display only the approved public or session-scoped projection.
