---
TITLE: "KAIOS World Viewer V1 Synthetic Sandbox Implementation Plan"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "APPROVED_FOR_ISOLATED_SANDBOX_TASK"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex delegated GM"
SOURCE_COMMIT: "BASE_ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "KAIOS-WV-SBX-001"
HUMAN_DECISION_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define a bounded implementation plan for the reviewed synthetic viewer without real land or production authority."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: SandboxImplementationPlan
CLASS: WorldViewerSandbox
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: SyntheticViewerPlan
SPECIES: WorldViewerV1SandboxPlan
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_SANDBOX_IMPLEMENTATION_PLAN.md"
---

# World Viewer V1 Sandbox Plan

## Scope

Create a static synthetic demo at `KGEN-KAIOS/world-viewer/index.html` with subordinate ES modules, CSS and JSON fixture. It contains one Earth K280 context, one Region, one City Overlay, 12 Parcels, one synthetic Home Parcel, three existing land uses, eight proposal actions, two Buildings, three Rooms, one AI Worker, one NPC and one Parcel with `UNKNOWN` data.

## Module Contract

- `index.html`: semantic shell and single entry.
- `assets/app.js`: state composition and lifecycle.
- `assets/camera.js`: pan, zoom, clamp and semantic navigation.
- `assets/selection.js`: pointer/touch/keyboard hit and selection states.
- `assets/coordinate.js`: synthetic display mapping with canonical coordinate labels.
- `assets/inspector.js`: canonical/viewer/proposal/unknown projections.
- `assets/context-menu.js`: capability-aware local proposal draft.
- `assets/data-loader.js`: validated synthetic fixture loading.
- `assets/accessibility.js`: focus, announcements and reduced-motion behavior.
- `assets/styles.css`: responsive desktop and mobile layout.
- `data/synthetic-world.json`: non-authoritative test fixture.

## Required Behavior

Mouse drag, wheel, click, double click and context menu must coexist with touch drag, pinch, tap, double tap and long press. Keyboard focus, Enter, Escape, arrows and zoom controls must remain available. Login uses a mock profile and focuses the synthetic Home Parcel; denied location leaves a valid Earth fallback.

Context actions create an in-memory `LAND_USE_PROPOSAL` draft only. Refresh may clear it. No fetch to a write endpoint, GitHub, wallet or external identity provider is allowed.

## Acceptance Tests

1. All JSON parses and all ES module imports return 200 under repository-relative Pages paths.
2. Fixture cardinality exactly matches the approved synthetic demo.
3. Desktop and mobile navigation can reach Earth through Room and return safely.
4. Pan after pointer movement above threshold does not trigger selection.
5. Pinch cancels tap/long press; long press never submits a proposal directly.
6. Unauthorized Parcel actions are disabled/read-only.
7. Inspector renders `UNKNOWN`, `RESTRICTED` and `STALE` distinctly.
8. Screen X/Y never overwrites canonical coordinates.
9. Keyboard, focus indicator, non-color selection, touch targets and reduced motion pass review.
10. Protected-path diff and secret scan return zero.
11. No real GPS, KYC, ownership, wallet, payment or production endpoint exists.
12. Desktop and mobile screenshots show no overlap, blank viewer or text overflow.

## Delivery

Cursor commits only to `cursor-handoff/KAIOS-WV-SBX-001`, produces task-specific `HANDOFF.md` and `handoff.json`, and waits for Codex review. Cursor cannot merge, push main or deploy.
