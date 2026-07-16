---
TITLE: "KAIOS World Viewer V1 Internal Independent UI Architecture Review"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "INTERNAL_INDEPENDENT_UI_REVIEW_COMPLETE"
ARCHITECTURE: "UNDER_INDEPENDENT_REVIEW"
EXTERNAL_REVIEW: "STILL_REQUIRED"
IMPLEMENTATION: "NOT_STARTED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_AUTHORIZED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent review; Human review required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001"
HUMAN_DECISION_ID: "HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001"
CHANGE_REASON: "Review the World Viewer V1 architecture boundary, interaction model, scale, usability, security and implementation readiness without starting implementation."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: ArchitectureReview
CLASS: WorldViewerReview
ORDER: IndependentUIReview
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerV1InternalArchitectureReview
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_REVIEW.md"
---

# World Viewer V1 Architecture Review

## 1. Review Identity

This is an `INTERNAL_INDEPENDENT_UI_REVIEW` performed by Codex against the proposal created by Codex. It is a structured second-pass challenge, not organizationally independent third-party evidence.

```text
EXTERNAL_UI_REVIEW_STILL_REQUIRED
```

The review does not modify the original eight proposal files, the frozen Land baseline, Runtime CURRENT, Universe Map or any executable application file.

## 2. Final Verdict

```text
APPROVE_WITH_AMENDMENTS
```

The proposal has the correct product and authority boundary. Web First is appropriate; K280 and ownership coordinates remain outside the viewer; land actions remain proposals; desktop and mobile both use a map-first interaction model. It is not yet ready to freeze because several implementation-facing contracts are described but not explicit enough to test consistently.

| Review area | Score / 100 | Judgment |
|---|---:|---|
| Architecture Boundary | 94 | Strong separation from registry and Runtime authority |
| Desktop Interaction | 91 | Complete primary interaction model |
| Mobile Interaction | 86 | Sound direction; gesture arbitration needs a testable contract |
| Coordinate Integrity | 96 | K280, geodetic, projection, screen and ENU frames are separated |
| LOD / Scalability | 82 | Correct pattern; budgets and eviction rules need amendment |
| UI Usability | 84 | Map-first and stable inspector are good; player-home flow needs a formal state path |
| Accessibility | 83 | Core requirements exist; operable non-pointer alternatives need acceptance tests |
| Security | 93 | Client is correctly treated as untrusted |
| Privacy | 94 | GPS is optional and non-authoritative |
| GitHub Pages Compatibility | 89 | Static read shell is viable; path and cache policy need freezing |
| Implementation Readiness | 77 | Data projections, engine choice and budgets remain unresolved |
| **Overall** | **88** | **Approve with amendments; do not implement yet** |

## 3. Preserved Decisions

The following architecture is accepted without change:

1. `EARTH_K280 -> REGION -> CITY_VIEWER_OVERLAY -> LAND_PARCEL -> BUILDING -> ROOM`.
2. `CITY` is a semantic viewer overlay and may not rewrite Region, County, Town, Parcel ID, registry identity or ownership lineage.
3. Mouse drag, wheel zoom, left selection and right context menu remain primary desktop operations.
4. Touch drag, pinch, tap, double tap and long press provide mobile parity.
5. Every land-use action creates `LAND_USE_PROPOSAL`; it never mutates ownership, rights or `land_use` directly.
6. Canonical coordinates and ownership geometry remain controlled by Land Runtime projections.
7. `index.html` will be the single application entry but not a monolithic implementation file.
8. V1 remains 2D. Art direction, 3D and large animation are excluded.

## 4. Web First Review

**Finding: APPROVED.** GitHub Pages can host the first read-only viewer shell, static manifests, versioned public projections, synthetic demo data and client-side map interaction.

GitHub Pages is not sufficient for authentication authority, private location storage, proposal authorization or registry mutation. Those remain behind a future reviewed command gateway.

Future implementation should remain modular:

```text
index.html                 application entry and semantic shell
assets/styles.css          responsive layout and state styling
assets/app.js              composition root
assets/camera.js           camera state and operations
assets/selection.js        hit testing and selection state
assets/coordinate.js       canonical/display/local adapters
assets/inspector.js        typed data projection
assets/context-menu.js     proposal action presentation
assets/data-loader.js      manifests, chunks, cache and cancellation
assets/accessibility.js    focus, announcements and keyboard parity
```

These are future implementation boundaries, not files created by this review. ES modules are preferred. A single huge script embedded in `index.html` is rejected.

### Technology evolution

| Technology | V1 judgment | Future role |
|---|---|---|
| HTML / CSS / JavaScript | Required foundation | Stable application shell |
| SVG | Suitable for small, accessible vector layers | Region and low-count parcel overlays |
| Canvas | Preferred candidate for dense V1 parcel rendering | Batched 2D rendering and hit-test index |
| WebGL | Deferred | Very large layers, terrain or high-density overlays |
| Three.js | Deferred; not needed for V1 | Future 3D globe, buildings or space view |
| PWA | Deferred | Offline manifest/cache after privacy and update-policy review |

## 5. Camera Contract Review

The existing camera model is directionally correct. Before baseline freeze it should expose the following aliases or equivalent typed fields:

```text
camera_x
camera_y
zoom_level
min_zoom
max_zoom
viewport_width
viewport_height
world_bounds
focus_target
animation_state
input_mode
coordinate_frame
semantic_level
source_snapshot_id
```

Required behavior:

- Drag begins only after a configurable movement threshold.
- Wheel and pinch zoom around the pointer or gesture center.
- Zoom is clamped to `[min_zoom, max_zoom]`.
- Pan is clamped to valid bounds with a recoverable overscroll allowance only if later approved.
- Inertia defaults to disabled on reduced-motion or low-end mode and must never prevent immediate input.
- Resize and orientation changes preserve the geographic focus, then clamp and refit if necessary.
- Player focus uses authenticated mock `starter_parcel_id` or `home_parcel`, never GPS ownership inference.
- `RETURN_HOME`, `RESET_TO_EARTH` and `EXIT_TO_PARENT_LEVEL` must always recover a valid camera.
- Layer transitions keep a parent checkpoint and do not depend on animation completion.

## 6. Projection Review

| Option | Strength | Risk | V1 decision |
|---|---|---|---|
| Synthetic Local Grid | Fastest deterministic demo | Not global geography | Use for synthetic acceptance fixtures |
| Local ENU Parcel View | Accurate building/parcel work | Requires selected geodetic anchor | Use at Parcel, Building and Room levels |
| Simple Equirectangular Earth View | Simple Earth-to-Region overview | Polar and area distortion | Acceptable neutral global overview |
| Web Mercator Display Adapter | Familiar map behavior and libraries | Pole cutoff, area distortion, provider terms | Candidate only after license/privacy review |
| Custom K-Sphere Projection | Closest thematic model | Highest math, accessibility and test risk | Defer beyond V1 |

Recommended V1 path:

```text
Simple Equirectangular or neutral synthetic Earth overview
-> Region / City semantic overlay
-> Synthetic Parcel fixture for the demo
-> Local ENU for Parcel / Building / Room
```

Every view retains `canonical_coordinate`; projected, camera, pointer and hit-area coordinates are disposable render derivatives.

## 7. Required Amendments Before Baseline

| ID | Priority | Amendment | Acceptance evidence |
|---|---|---|---|
| WV-AMEND-001 | P0 | Freeze explicit CameraState names, bounds, threshold, resize and recovery rules | Camera contract test matrix |
| WV-AMEND-002 | P0 | Add desktop/mobile gesture arbitration, including tap vs drag and long-press cancellation | Input compatibility tests |
| WV-AMEND-003 | P0 | Add visual selection states `NONE`, `HOVERED`, `SELECTED`, `FOCUSED`, `LOCKED`, `DISABLED`, `PENDING_PROPOSAL`; reserve `MULTI_SELECTED` | State transition table |
| WV-AMEND-004 | P0 | Expand `LAND_USE_PROPOSAL` draft fields and require owner/governor capability projection | Schema draft and negative authorization cases |
| WV-AMEND-005 | P0 | Separate Inspector data into Canonical, Viewer, Proposal and Unknown groups | Inspector projection fixture |
| WV-AMEND-006 | P0 | Establish measurable LOD, entity, memory and interaction budgets | Performance harness plan |
| WV-AMEND-007 | P0 | Freeze GitHub Pages base-path, module, cache and source-integrity policy | Route and cold-cache test plan |
| WV-AMEND-008 | P0 | Require command idempotency, replay protection and server-side revalidation for any future submission | Security threat tests |
| WV-AMEND-009 | P1 | Select and license-review a proven 2D map engine | Dependency decision record |
| WV-AMEND-010 | P1 | Define browser-ready Region, City, Parcel, Building, Room and Player projection schemas | Schema review, not runtime mutation |
| WV-AMEND-011 | P1 | Define a visible player-home boot state so login never produces a blank map | Synthetic demo acceptance run |
| WV-AMEND-012 | P1 | Define accessibility acceptance tests for keyboard, screen reader, contrast, text scaling and touch targets | Accessibility review evidence |

## 8. Selection And Proposal Review

Required visual selection states:

```text
NONE
HOVERED
SELECTED
FOCUSED
LOCKED
DISABLED
PENDING_PROPOSAL
MULTI_SELECTED  // reserved, not enabled in V1
```

`LOCKED` and `DISABLED` describe interaction capability, not ownership. `PENDING_PROPOSAL` does not imply approval.

The future draft proposal must include at least:

```text
proposal_id
parcel_id
requester_id
requested_land_use
current_land_use
reason
estimated_cost
environment_impact
neighbor_impact
required_permissions
evidence
source_snapshot_id
source_geometry_revision
review_status
```

Owner or delegated governor capability must be checked from a trusted projection. A disabled button is presentation only and is never an authorization control.

## 9. Inspector Review

The Inspector must label four groups:

1. **Canonical Data:** stable IDs, canonical coordinate, surface K, registry source and source revision.
2. **Viewer Data:** projected coordinate, current LOD, visibility, freshness and display status.
3. **Proposal Data:** requested use, proposal ID, cost/impact estimates and review status.
4. **Unknown Data:** fields absent, stale, restricted or unresolved.

Required fields are Owner, Governor, Parcel ID, Global UID, Coordinate, Surface K, Area, Current Land Use, Proposed Land Use, Buildings, Population, AI Workers, Protection Zone, Tax Authority, Defense Authority, Airspace Authority, Data Freshness and Source.

Missing values render `UNKNOWN`; restricted values render `RESTRICTED`; stale values render `STALE`. Zero is shown only when the source explicitly provides a verified numeric zero.

## 10. Player Location Review

Approved prototype flow:

```text
Mock Login
-> Mock Location Consent
-> Coarse Region Focus
-> Synthetic Starter Parcel Application
-> Mock Review
-> Virtual Parcel Grant Fixture
-> Focus Home Anchor
-> Open Inspector
```

GPS remains optional, one-time and coarse. It is not legal address evidence, ownership evidence or a continuously tracked signal. V1 may use only mock GPS and synthetic Starter Parcels.

The authenticated prototype home state must expose these recoverable controls:

```text
MY_LAND
RETURN_HOME
WORLD_VIEW
ZOOM_IN
ZOOM_OUT
BACK_LAYER
OPEN_INSPECTOR
CLOSE_CONTEXT_MENU
```

The initial focus sequence must end with a visible map, selected Home Anchor or explicit public Earth fallback; a blank map is a failed state.

## 11. Layout And Accessibility Review

Desktop may evolve to a top status bar, collapsible left navigation, central map, fixed right Inspector and contextual bottom proposal toolbar. The top bar projects Player, World, K Point and a bounded resource summary. The left navigation vocabulary is `World`, `Land`, `Life`, `AI`, `Mission`, `Market`, `Bank` and `Settings`. Navigation must not reduce the map to a decorative preview.

Mobile uses a compact top bar, full-screen map, bottom-sheet Inspector, visible Home/Back controls and a bounded long-press action sheet. The desktop three-column layout must not be scaled down wholesale.

Baseline requirements:

- Full keyboard navigation and visible focus.
- Programmatic labels and polite selection announcements.
- Icon + label + pattern for land use; color alone is insufficient.
- High-contrast mode and text zoom without clipping.
- Minimum touch target policy established before implementation.
- Reduced-motion mode with immediate camera completion.
- Named loading, empty, offline, degraded and error states.

## 12. Security And Privacy Review

The client is untrusted. A future mutation path must perform authentication, authorization, owner/governor validation, parcel and revision validation, proposal review, replay prevention, settlement/approval and registry update on trusted infrastructure.

The static viewer must never expose raw KYC, exact private GPS, auth tokens, private keys, unrestricted owner records or private precise parcel-to-person relationships. External tile/provider requests require a separate privacy and license decision.

## 13. Performance Budget Summary

The recommended targets are review budgets, not frozen production promises:

- Critical compressed first load: no more than 1.5 MB excluding optional map tiles.
- Critical JavaScript: no more than 500 KB gzip including the selected 2D engine.
- Time to interactive: target 3 seconds desktop and 5 seconds representative low-end mobile on Fast 4G.
- Visible Parcels: target 2,000 desktop and 750 mobile before clustering/simplification.
- Pan/zoom: target 60 FPS desktop, 45 FPS representative mobile, minimum 30 FPS fallback.
- Mobile memory: target below 160 MiB; desktop below 256 MiB for the synthetic fixture.
- Parcel hit test: p95 at or below 16 ms.
- Inspector open: p95 at or below 100 ms after data is locally available.

Exact budgets must be validated using the synthetic fixture and revised from evidence.

## 14. Synthetic Demo Acceptance Fixture

The later implementation review must use synthetic, non-legal data containing exactly the minimum requested fixture:

- 1 Earth K280 view.
- 1 Region.
- 1 City semantic overlay.
- 12 Land Parcels.
- 1 player Starter Parcel.
- 3 existing land-use types: `RESIDENTIAL`, `FARM` and `FOREST`.
- 8 proposal options.
- 2 Buildings.
- 3 Rooms.
- 1 AI Worker.
- 1 NPC.
- 1 Parcel containing explicit `UNKNOWN` fields.

No fixture may claim real land title, real KYC, real GPS ownership or Production registry status.

## 15. Gate Status

| Gate | Status |
|---|---|
| Internal Independent UI Review | COMPLETE |
| External UI Review | STILL_REQUIRED |
| Human UI Architecture Review | REQUIRED |
| Baseline Freeze | NOT_AUTHORIZED |
| Implementation Planning | NOT_AUTHORIZED |
| Implementation | NOT_STARTED |
| WorkQueue | NOT_CREATED |
| Deployment | NOT_AUTHORIZED |

Recommended next Human decision:

```text
ACCEPT_WORLD_VIEWER_REVIEW_AND_REQUEST_ARCHITECTURE_AMENDMENTS
```
