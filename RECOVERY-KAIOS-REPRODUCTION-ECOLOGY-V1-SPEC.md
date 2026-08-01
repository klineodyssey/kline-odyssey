# Recovery - KAIOS Reproduction and Ecology Runtime V1 Specification

Task: `KAIOS-CHARTER-REPRODUCTION-ECOLOGY-PROGRAM-001`

PR: `#75`

Base main: `46518a75ec7aedd5fce10290952f47b9fca96963`

Branch: `codex/kaios-reproduction-ecology-v1-spec`

## Scope

- 13-chapter source crosswalk
- Runtime V1 specification and state schema
- test plan and specification tests
- Cursor candidate-data decision and task envelope
- stale PR #69 Cursor claim closure

## Rollback

Revert PR #75 with a merge-preserving revert. This removes only specification, registry assignment, task-envelope and documentation changes. It does not alter Constitution sources, Canonical Life, Organism Schema V2, Life Runtime V1, ecosystem runtime code, Wallet, KGEN, on-chain state or Production authority.

Cursor candidate work remains independently reviewable and cannot be merged or deployed by Cursor.

Security boundaries: `SIMULATION_ONLY`, `NO_REAL_WALLET`, `NO_REAL_KGEN`, `NO_REAL_BIOENGINEERING`, `NO_PRODUCTION_AUTHORITY`, `NO_UNCONTROLLED_POPULATION`.
