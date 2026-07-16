---
TITLE: "KAIOS World Viewer Architecture Package"
VERSION: "1.3.0"
REVISION: "2026-07-17.1"
STATUS: "SPRINT_003_DIGITAL_EARTH_ALPHA_COMPLETE"
ARCHITECTURE: "BASELINE_FROZEN_V1.0"
IMPLEMENTATION: "DIGITAL_EARTH_ALPHA"
WORKQUEUE: "KAIOS-WV-SPRINT-003_READY_FOR_REVIEW"
DEPLOYMENT: "STATIC_PAGES_COMPATIBLE"
LAST_UPDATED: "2026-07-17"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent UI review; Human delegated approval"
SOURCE_COMMIT: "RECORDED_BY_SPRINT_003_GIT_HANDOFF"
TASK_ID: "KAIOS-WV-SPRINT-003"
HUMAN_DECISION_ID: "HUMAN-SPRINT-003-001"
CHANGE_REASON: "Evolve the Viewer into a local synthetic Living World with land history, buildings, rooms, life simulation, player movement and autonomous regression QA."
ANCESTOR: "KGEN-KAIOS/V8.1/index.html; KGEN-KAIOS/land/LAND_RUNTIME_ARCHITECTURE_BASELINE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: WorldViewer
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerArchitecturePackage
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/README.md"
---

# KAIOS World Viewer V1

## 1. Decision Status

| Field | Value |
|---|---|
| Human Decision | `HUMAN-SPRINT-003-001` |
| Architecture | `BASELINE_FROZEN_V1.0` |
| Implementation | `SPRINT_003_DIGITAL_EARTH_ALPHA_COMPLETE` |
| Sprint Task Envelope | `DONE` |
| Deployment | `STATIC_GITHUB_PAGES_COMPATIBLE` |
| Executable `index.html` | `CREATED` |
| Art / 3D / animation | `OUT_OF_SCOPE` |

This package now includes the first working KAIOS Digital Earth control surface. It uses synthetic public fixtures, local-only proposal drafts and bounded browser simulation; it does not modify a registry, grant land, perform real authentication, request real GPS, or create authoritative ownership state.

## 2. Architecture Verdict

Create a separate, versionless World Viewer architecture rather than extending the V8.1 card viewer in place.

The runtime has one executable entry:

```text
KGEN-KAIOS/world-viewer/index.html
```

The intended permanent public alias is:

```text
/world-viewer/
```

JavaScript, CSS and synthetic data are subordinate resources; they are not alternate application entry points. The repository path is directly compatible with static HTTP hosting and GitHub Pages.

## 3. Required Navigation Hierarchy

```text
EARTH / K280
-> REGION
-> CITY
-> LAND_PARCEL
-> BUILDING
-> ROOM
```

The hierarchy is semantic zoom, not six unrelated pages. Drag, zoom and selection remain the primary navigation model.

## 4. Source Audit

| Source | Classification | Finding | World Viewer Rule |
|---|---|---|---|
| `HUMAN-WORLD-VIEWER-001` | Human Decision | Authorizes UI architecture only | Highest task authority |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | CURRENT Constitution | Architecture before implementation; Human final authority | Mandatory |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Protected CURRENT Runtime | Defines XYZ observation axes, K-Sphere and K-index scale | Read only; never modified here |
| `docs/maps/README.md` | CURRENT map selector | Selects Universe Map V10.2 as current shared coordinate map | Coordinate context only |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | CURRENT shared map | Contains Earth surface point `coord=280` and historical distance data | Not a parcel registry |
| `KGEN-KAIOS/land/LAND_RUNTIME_ARCHITECTURE_BASELINE.md` | Frozen baseline | Owns K280, Parcel, ownership geometry and rights separation | Viewer imports by reference |
| `KGEN-KAIOS/land/land_runtime_architecture.json` | Approved architecture model | Zero-state, prototype-only, implementation not started | No state mutation |
| `KGEN-KAIOS/V8.1/index.html` | Historical prototype | Read-only cards, tabs and graph relationships | Preserve; do not overwrite |
| `KGEN-KAIOS/V8.1/v81.js` | Historical prototype | No geographic drag, zoom, parcel picking or context actions | Reuse concepts only |
| `KGEN-KAIOS/V8/schemas/land.schema.json` | Historical schema | Generic coordinates and zoning; not sufficient for spherical parcel picking | Compatibility adapter only |
| `KGEN-KAIOS/V8/schemas/building.schema.json` | Historical schema | Building identity exists; no floor/room geometry contract | Gap to resolve before implementation |
| Isolated K280 proposal worktree | Candidate evidence | Defines geodetic position, spherical polygon and Local ENU in greater detail | Informative only; frozen baseline wins on conflict |

## 5. Gap Analysis

The repository has no approved implementation contract for all of the following together:

- Region and City spatial indexes.
- Parcel geometry snapshots consumable by a browser.
- Building footprint and floor geometry.
- Room identity and local geometry.
- Player session to Starter Parcel binding.
- Consent-scoped location lookup.
- Secure command persistence from a static GitHub Pages client.

World Viewer V1 therefore defines adapter boundaries and draft projections. It does not promote those projections into Land Runtime schemas or a new Source of Truth.

## 6. Package Files

| File | Purpose |
|---|---|
| `WORLD_VIEWER_ARCHITECTURE.md` | System boundary, hierarchy and review decisions |
| `WORLD_VIEWER_RUNTIME.md` | Modules, state machine, loading and command boundaries |
| `CAMERA_STANDARD.md` | Drag, zoom, semantic level and camera transitions |
| `SELECTION_STANDARD.md` | Parcel picking, context menu and intent rules |
| `COORDINATE_MAPPING_STANDARD.md` | K280 geodetic, screen and Local ENU mapping |
| `UI_LAYOUT_STANDARD.md` | Map-first responsive layout and inspector contract |
| `world_viewer_architecture.json` | Machine-readable architecture proposal |
| `WORLD_VIEWER_V1_ARCHITECTURE_RESOLUTION.md` | Resolution of the twelve review amendments |
| `ADR/ADR-WV-001-WEB-FIRST-SYNTHETIC-VIEWER.md` | Web-first 2D and untrusted-client decision record |
| `WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md` | Frozen V1 architecture baseline |
| `world_viewer_v1_architecture_baseline.json` | Baseline manifest and SHA-256 evidence |
| `WORLD_VIEWER_V1_SANDBOX_IMPLEMENTATION_PLAN.md` | Bounded synthetic-demo plan |
| `tasks/KAIOS-WV-SBX-001.task-envelope.json` | Single-task Cursor execution envelope |
| `tasks/KAIOS-WV-SPRINT-001.task-envelope.json` | Sprint 001 execution and closeout envelope |
| `tasks/KAIOS-WV-SPRINT-002.task-envelope.json` | Sprint 002 Alpha execution and closeout envelope |
| `SPRINT_002_ALPHA_REPORT.md` | Alpha, architecture diff, implementation diff, QA, performance and Sprint 003 recommendation |
| `tasks/KAIOS-WV-SPRINT-003.task-envelope.json` | Sprint 003 Digital Earth execution envelope |
| `SPRINT_003_DIGITAL_EARTH_REPORT.md` | Digital Earth demo, diffs, QA, performance and next-sprint recommendation |
| `index.html` | Unique executable World Viewer entry |
| `app.js` | Application orchestration and read-only proposal flow |
| `camera/`, `renderer/`, `lod/` | Bounded camera, Canvas renderer and six-level semantic navigation |
| `input/`, `selection/` | Mouse, touch, keyboard and selection state controllers |
| `inspector/`, `life/` | Canonical-data inspector and Life OS status projection |
| `land/`, `building/`, `room/`, `player/` | Local Land history, read-only structure integrity and player movement runtimes |
| `ui/` | Responsive shell, context menu and visual system |
| `data/` | Validated synthetic world fixture and loader |
| `tests/acceptance_static.py` | Offline package, fixture and safety validation |
| `tests/product_qa.py` | Browser, responsive, accessibility, interaction and performance gate |
| `tests/runtime_integrity.mjs` | Land, Building, Room, Life and Player invariant gate |
| `tests/baselines/sprint-003/` | Required desktop, tablet, Android and iPhone visual baselines |
| `tests/evidence/sprint-002/` | Alpha screenshots plus machine-readable QA and performance reports |
| `.github/workflows/world-viewer-product-qa.yml` | Pull-request and push Product QA workflow |

## 7. Implementation Boundary

GitHub Pages can safely serve public snapshots and the read-only interaction shell. It cannot be trusted to authorize ownership changes or protect private credentials. Any future write action requires a separately approved command gateway, authentication design, persistence model, audit trail and Human-approved implementation plan.

Until that gate exists, context-menu actions produce a previewable `LAND_USE_PROPOSAL` intent only.

## 8. Sprint 002 Alpha Result

Sprint 002 preserves Earth K280 through Room navigation and adds an explicit mock-location consent flow, a complete Body-to-Citizen Life stack, the approved eight-option land proposal set, a richer Parcel Inspector and automated Product QA. The final local gate reports `93 PASS`, `0 FAIL` and eight initial visual-baseline skips across desktop, tablet, Android and iPhone profiles.

See `SPRINT_002_ALPHA_REPORT.md` for the Alpha demo, architecture diff, implementation diff, QA report, performance report and Sprint 003 recommendation. Real ownership, KYC, GPS, backend writes and settlement remain outside this implementation.

No decision in this package authorizes real land, KYC, GPS, ownership mutation, backend write service, financial settlement or production authority.

## 9. Sprint 003 Digital Earth Result

Sprint 003 preserves the frozen World Viewer architecture and adds a bounded product layer:

- Local Land Runtime V2 history, parcel revisions, ownership timeline, draft save and undo/redo.
- Eight Building templates with health, level, capacity and lifecycle projections.
- Room-to-Furniture-to-Equipment-to-Organism-to-Life integrity links.
- Synthetic Life simulation for Player, AI Worker, NPC, Pet and Plant profiles.
- Player walking, room entry, visible map marker and a persistent local-only land draft.
- Required visual baselines and automatic runtime, accessibility, responsive, performance and regression checks.

See `SPRINT_003_DIGITAL_EARTH_REPORT.md` and `tests/evidence/sprint-003/` for the reviewed implementation and QA evidence. Architecture baselines, Runtime CURRENT, Universe Map CURRENT and all protected paths remain unchanged.
