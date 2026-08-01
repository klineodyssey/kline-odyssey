# KAIOS Charter Foundation Gap Closure V1 Specification

Status: `APPROVED_SPECIFICATION_FOR_PR_B_AFTER_PR_A_MERGE`

Authority: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

## Selected Components

### Shared Simulation Clock Adapter

- Problem: World Viewer, K280, Life Runtime and Causal Runtime expose separate clock shapes.
- Sources: time, lifecycle, labor, transport and civilization Program Units.
- Existing coverage: executable clocks exist; a canonical non-owning adapter is missing.
- Owner: `KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js`.
- Contract: normalize day/hour/minute/second into deterministic seconds without changing source clocks.

### Deterministic Event Envelope

- Problem: event fields and state-hash conventions vary across runtimes.
- Contract: immutable envelope with actor, action, inputs, outputs, deltas, previous/next hash, status and reason.
- Security: local deterministic simulation only; no external dispatch.

### Shared Environment State Projection

- Problem: environmental dependencies are represented separately by causal-world and life runtimes.
- Contract: read-only normalized temperature, gravity, water, oxygen, terrain and location projection.

### Energy, Material and Rights Capability Interfaces

- Problem: causal accounting and rights separation exist, but shared bounded evaluators are missing.
- Contract: reject negative conservation, insufficient energy/materials, missing capability and production authority.

## State Machine

`INPUT_VALIDATION -> NORMALIZATION -> CAUSAL_GATE -> CAPABILITY_GATE -> RESULT`

Failures stop at the failing gate and return deterministic reason codes.

## API and UI

No mutable network API. PR B updates only the read-only Program Center status projection.

## Migration

None. Existing runtime state is passed through adapters and never rewritten.

## Tests

Clock determinism, event hashing, serialization, conservation, environment validation, capability denial, no Runtime authority, no wallet, no KGEN, and existing runtime regressions.

## Rollback

Remove the adapter import and module; existing runtimes remain unchanged.

## Acceptance

All adapters deterministic, no duplicate clock owner, no state mutation, P0/P1/P2 zero, and all regression suites pass.
