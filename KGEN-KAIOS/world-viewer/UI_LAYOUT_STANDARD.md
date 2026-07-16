---
TITLE: "KAIOS World Viewer UI Layout Standard"
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
CHANGE_REASON: "Define a map-first desktop and mobile layout without visual art, 3D or control proliferation."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: UILayoutContract
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerUILayoutStandard
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/UI_LAYOUT_STANDARD.md"
---

# UI Layout Standard

## 1. First Screen

The first screen is the working map. It is not a marketing landing page and has no hero section.

Desktop composition:

```text
+-------------------------------------------------------------+
| Brand / Breadcrumb / minimal status / locate                |
+-----------------------------------------+-------------------+
|                                         | Inspector         |
|                                         | Owner             |
|              MAP SURFACE                | Parcel ID         |
|                                         | Coordinate        |
|                                         | Ground (K280)     |
|                                         | Area              |
|                                         | Building          |
|                                         | Population        |
|                                         | AI Workers        |
+-----------------------------------------+-------------------+
```

The map track is `minmax(0, 1fr)`. The desktop Inspector track is constrained to approximately 300-360 CSS pixels and never resizes based on selected content.

## 2. Persistent Regions

### Top strip

- KAIOS World Viewer identity.
- Semantic breadcrumb: Earth / Region / City / Parcel / Building / Room.
- Source and degraded-status indicator.
- Locate action when session or consent permits.

### Map surface

- Occupies all remaining working space.
- Receives drag, zoom, select and context input.
- Contains only essential map controls.

### Inspector

- Fixed to the right on desktop.
- Scrolls internally when content exceeds height.
- Does not push or resize the map after selection.
- Is an unframed application panel, not nested cards.

## 3. Required Inspector Fields

Display order:

1. Owner
2. Parcel ID
3. Coordinate
4. Ground (`K280`)
5. Area
6. Building
7. Population
8. AI Workers

Supplemental status may include source revision, registry status, zone and rights summary after review.

Unknown and restricted values must be explicit:

```text
UNAVAILABLE
RESTRICTED
STALE
DISPUTED
```

They must not be rendered as zero or empty strings.

## 4. Context Menu

The context menu is anchored to the pointer while remaining inside viewport bounds. It contains the eight land-use proposal choices and no unrelated navigation buttons.

Menu labels:

```text
Residential
Farm
Forest
Factory
Marketplace
Temple
Mine
Road
```

The menu closes on Escape, outside click, camera movement or snapshot invalidation.

## 5. Minimal Controls

Use familiar icons with tooltips for:

- Zoom in.
- Zoom out.
- Return to Earth.
- Locate Player land.
- Return to parent level.

Do not duplicate map actions as large text buttons. Do not add dashboards, metrics or explanatory feature cards to the primary viewer surface.

## 6. Mobile Layout

On narrow screens:

- Map remains full viewport.
- The right Inspector becomes a bottom sheet.
- Bottom sheet has stable collapsed, half and expanded positions.
- Context actions use a bounded action sheet if pointer placement is impractical.
- Breadcrumb scrolls horizontally without wrapping over map controls.
- Touch targets meet accessible size requirements.

This is the mobile equivalent of the fixed Inspector, not a different application.

## 7. Responsive Safety

- No viewport-width font scaling.
- No content-dependent map resizing.
- Stable icon-button dimensions.
- Long Parcel IDs wrap or use copy affordance without overflow.
- Inspector labels and values use a stable two-column definition layout where space permits.
- Map attribution remains visible and unobstructed.
- Context menu never opens outside the visual viewport.

## 8. Runtime States In UI

| Runtime state | Layout response |
|---|---|
| Loading | Keep map frame stable; show bounded loading status |
| Ready | Enable valid navigation and selection |
| Empty selection | Inspector shows world-level summary, not instructions |
| Degraded read only | Preserve navigation; hide or disable proposal actions |
| Source conflict | Show source error and affected layer; no intents |
| GPS denied | Preserve account/manual navigation |
| Offline | Show cached public snapshot only when version-valid |

## 9. Accessibility

- Map has an accessible name and current semantic-level description.
- Inspector heading reflects the selected object.
- Selection updates use a polite live region.
- Context menu uses menu semantics and keyboard focus management.
- Color is never the sole status signal.
- Focus order is top strip, map controls, map, inspector, context action.
- Reduced motion removes non-essential camera easing.

## 10. Visual Boundary

This architecture intentionally does not choose colors, imagery, map tiles, icon style, typeface, 3D assets or animation language. Those belong to a later UI implementation and art review after functional architecture approval.
