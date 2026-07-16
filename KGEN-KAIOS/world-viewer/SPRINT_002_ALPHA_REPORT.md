# KAIOS World Viewer Alpha - Sprint 002

## Delivery

| Field | Value |
|---|---|
| Human decision | `HUMAN-SPRINT-002-001` |
| Task | `KAIOS-WV-SPRINT-002` |
| Product state | `ALPHA_COMPLETE` |
| Entry | `KGEN-KAIOS/world-viewer/index.html` |
| Hosting | Static Web / GitHub Pages |
| Data | Public synthetic fixture only |
| Authority | Read-only Viewer plus local proposal drafts |

The Alpha keeps the six-level path `Earth K280 -> Region -> City -> Parcel -> Building -> Room`. A player can start a mock session, optionally consent to a coarse synthetic location, focus the Starter Parcel, inspect land and Life data, and create a local `LAND_USE_PROPOSAL` draft.

## Alpha Demo

- Desktop: drag, wheel zoom, click, double click, right click, keyboard navigation and Inspector.
- Mobile: one-finger drag, pinch zoom, tap, double tap, long press and overlay Bottom Sheet.
- Starter Parcel: explicit mock session and location-consent boundary; no browser geolocation call.
- Land proposals: `RESIDENTIAL`, `FARM`, `FOREST`, `MARKETPLACE`, `FACTORY`, `TEMPLE`, `RESEARCH` and `PUBLIC_FACILITY`.
- Life projection: Body, Species OS, Individual Life OS, Mind Runtime and Citizen Runtime.
- Life fields: Health, Energy, Food, Water, public DNA summary, GA profile/count, Occupation and Life State.
- Synthetic profiles: player-owned AI Worker, NPC and Plant, including explicit `NOT_APPLICABLE` layers where appropriate.

## Architecture Diff

The frozen World Viewer, Land and Life OS Architecture baselines are unchanged. Sprint 002 only realizes their approved client-side projection:

1. The prior generic Life status card is expanded into a validated five-layer read-only projection.
2. Mock Login now requires an explicit choice about optional synthetic location use.
3. Proposal vocabulary is aligned to the Sprint 002 product decision.
4. Product QA becomes an executable repository workflow with static, browser, responsive, accessibility, performance and safety gates.

No Runtime CURRENT, Universe Map CURRENT, frozen baseline or authoritative registry contract changed.

## Implementation Diff

| Area | Increment |
|---|---|
| Fixture / loader | Schema `2.0.0`, three Life profiles, strict public-field and range validation |
| Life Viewer | Five-layer stack, vitals, DNA/GA, occupation, state and privacy boundary |
| Session | Consent dialog, location-free path, mock-location path and Starter Parcel focus |
| Inspector | Owner, Parcel ID, K280, geodetic coordinate, Building, Life, AI Worker and Land Use |
| Proposal flow | Eight owner/delegate actions, replacement-safe local draft, no persistence or mutation |
| Mobile UI | Stable authenticated icon, overlay Bottom Sheet and action sheet |
| Product QA | Eight-viewport matrix, interactions, permission tests, console/link checks and evidence artifacts |

## QA Report

Machine-readable report: `tests/evidence/sprint-002/qa-report.json`

| Result | Count |
|---|---:|
| PASS | 93 |
| FAIL | 0 |
| SKIP | 8 |

The eight skips are the first-release pixel-diff baselines. All eight current viewport screenshots are captured and hashed; the diff engine is implemented, but no older Sprint 002 Alpha image is treated as an approved visual baseline. Static acceptance passed with 14 program files, 11 JSON records and 14 local references.

## Performance Report

Machine-readable report: `tests/evidence/sprint-002/performance-report.json`

Across desktop, tablet, Android and iPhone profiles:

- First usable: `467.1-648.2 ms` against a `2500 ms` budget.
- Renderer: `54.1-60.6 FPS` against a `30 FPS` minimum.
- Render time: `0.4-0.6 ms` against a `50 ms` maximum.
- Critical payload: `235,932 bytes` against a `1,572,864 byte` budget.
- Heap: approximately `3.1 MB`, below both mobile and desktop budgets.

All eight performance cases pass.

## Evidence

- `tests/evidence/sprint-002/screenshots/`: eight responsive viewport captures.
- `tests/evidence/sprint-002/alpha-demo/alpha-location-consent-desktop.png`
- `tests/evidence/sprint-002/alpha-demo/alpha-starter-parcel-desktop.png`
- `tests/evidence/sprint-002/alpha-demo/alpha-life-os-desktop.png`
- `tests/evidence/sprint-002/alpha-demo/alpha-land-proposal-mobile.png`

## Safety Boundary

- Real KYC: `false`
- Real GPS: `false`
- Real or legal land data: `false`
- Ownership mutation: `false`
- Registry persistence: `false`
- Wallet or payment: `false`
- Runtime CURRENT modified: `false`
- Universe Map CURRENT modified: `false`
- Token Contract modified: `false`
- Protected path violations: `0`

## Sprint 003 Recommendation

Build a bounded Land and Building sandbox adapter: local draft persistence, parcel proposal history, building/room detail transitions and richer Life-to-Building relationships. Keep the adapter synthetic until authentication, authorization, authoritative registry writes and settlement receive separate approval.
