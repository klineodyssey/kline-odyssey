---
TITLE: "ADR-WV-001 Web-First Synthetic World Viewer"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ACCEPTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex delegated GM"
SOURCE_COMMIT: "BASE_ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-001"
HUMAN_DECISION_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Record the static, 2D, modular and untrusted-client architecture for the first synthetic viewer."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: ArchitectureDecisionRecord
CLASS: WorldViewerADR
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: ViewerArchitectureDecision
SPECIES: ADRWorldViewer001
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/ADR/ADR-WV-001-WEB-FIRST-SYNTHETIC-VIEWER.md"
---

# ADR-WV-001: Web-First Synthetic Viewer

## Context

The first player land surface must run on GitHub Pages, support mouse and touch navigation and preserve K280 geodetic authority without requiring a backend, real GPS or global parcel dataset.

## Decision

Use one semantic `index.html` shell with ES modules and a bounded synthetic fixture. Use SVG through a replaceable renderer adapter for 12 Parcels; retain camera, selection, coordinate, inspector, context-menu, data and accessibility modules. Screen coordinates remain derived display data. Every action creates only a local `LAND_USE_PROPOSAL` draft.

## Consequences

- The first demo is inspectable, mobile-compatible and deployable as static files.
- No map provider, API key, real KYC, real GPS or authoritative write service is needed.
- SVG is intentionally bounded to the synthetic fixture; Canvas/WebGL remain future adapter options.
- A later global viewer needs licensed projection data, chunks, spatial indexes and a trusted command gateway.

## Rejected Alternatives

- Monolithic `index.html`: poor testability and cache behavior.
- 3D/WebGL first: unnecessary interaction and performance risk.
- Browser-owned land state: violates registry and authorization boundaries.
- Real GPS Starter Parcel grant: privacy and ownership violation.

## Status

`ACCEPTED` under delegated Level B authority. This ADR authorizes only the scoped sandbox plan and does not authorize production ownership or backend implementation.
