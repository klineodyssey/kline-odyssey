# KAIOS Digital Life Implementations

This directory contains bounded implementations that reuse the canonical
schemas and registries under `KGEN-KAIOS`.

## K280

`K280/` implements the simulation-only K280 digital-life MVP. Its first
organism is `KAIOS-RAPTOR-K280-001`.

Public interfaces:

- [KAIOS Full World Viewer](../world-viewer/)
- [K280 World Viewer](../world-viewer/k280/)
- [K280 public data](../api/kaios/k280/)
- [Life Runtime V1](../world-viewer/life-runtime/)
- [Life Runtime V1 public data](../api/kaios/life-runtime-v1/)
- [Forest and Agriculture Runtime V1 specification](life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md)
- [Forest and Agriculture Cursor queue](life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json)

## Foundational Life Runtime V1

`life/runtime/` executes the eight PR #69 foundational candidates in a
bounded local deterministic simulation. The candidates remain candidate-only;
runtime execution does not promote them to Canonical status or grant
Production Runtime authority.

Review and operations records:

- [Life Runtime V1 specification](life/KAIOS_LIFE_RUNTIME_V1_SPEC.md)
- [Life Runtime V1 report](life/KAIOS_LIFE_RUNTIME_V1_REPORT.md)
- [PR #69 / PR #70 integration decision](life/KAIOS_PR69_PR70_INTEGRATION_DECISION.md)
- [Recovery point](../RECOVERY-KAIOS-LIFE-RUNTIME-V1.md)
- [Closeout](../KAIOS_LIFE_RUNTIME_V1_CLOSEOUT.md)

Canonical registry and policy sources remain under `KGEN-KAIOS`. Nothing in
this directory activates Production Runtime, a wallet, real KGEN settlement,
or real-world biological engineering.
