---
TITLE: "KAIOS World Viewer V1 Architecture Baseline"
VERSION: "WORLD-VIEWER-V1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_BASELINE_FROZEN"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent UI review; Human delegated approval"
SOURCE_COMMIT: "BASE_ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-001"
HUMAN_DECISION_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Freeze the amended World Viewer V1 architecture while isolating synthetic sandbox implementation."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_RESOLUTION.md; KGEN-KAIOS/world-viewer/ADR/ADR-WV-001-WEB-FIRST-SYNTHETIC-VIEWER.md"
SOURCE_OF_TRUTH: true
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: ArchitectureBaseline
CLASS: WorldViewerBaseline
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: FrozenViewerArchitecture
SPECIES: WorldViewerArchitectureV1
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md"
---

# World Viewer V1 Architecture Baseline

## Baseline

| Field | Value |
|---|---|
| Version | `WORLD-VIEWER-V1.0` |
| Status | `ARCHITECTURE_BASELINE_FROZEN` |
| Review | `APPROVE_WITH_AMENDMENTS`, 88/100 |
| Approval | `CODEX_DELEGATED_GM` under `HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001` |
| Human override | `AVAILABLE` |
| Implementation | `NOT_STARTED` |
| Production deployment | `NOT_AUTHORIZED` |

## Frozen Invariants

1. Earth K280, Region, City Viewer Overlay, Parcel, Building and Room form semantic zoom levels.
2. City never rewrites Region, County, Town, Parcel ID or ownership parentage.
3. Canonical geodetic and spherical geometry remains separate from projection, camera and pointer coordinates.
4. The client is an untrusted display and proposal-intent surface, never registry authority.
5. All eight context actions create `LAND_USE_PROPOSAL`; none mutates land or ownership.
6. Unknown, restricted and stale values are explicit; missing data is never fabricated as zero.
7. Desktop, touch, keyboard and assistive input receive equivalent recoverable operations.
8. Data loading is viewport- and LOD-bounded; global entities are never loaded at once.
9. GPS is voluntary focus only; V1 uses Mock Login, Mock GPS and synthetic land.
10. No protected Runtime, Universe Map, Token, wallet, contract or real ownership source changes.

## Controlled Evolution

Changes require Proposal, Review, Resolution, ADR, delegated-authority check or Human approval, baseline update and append-only evolution evidence. The machine companion records SHA-256 evidence for the frozen set.
