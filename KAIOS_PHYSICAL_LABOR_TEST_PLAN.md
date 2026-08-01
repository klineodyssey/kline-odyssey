# KAIOS Physical Labor Specification Test Plan

Status: `ACTIVE_FOR_PR64_SPECIFICATION_VALIDATION`

Scope: schemas, documents and reference-contract tests only

## Automated Contract Suite

`KGEN-KAIOS/world-viewer/tests/physical_labor_spec.test.mjs` validates:

1. Required files, JSON syntax and Draft 2020-12 declarations.
2. Required timeline fields and all 14 timeline states.
3. Every required conflict code.
4. Single body, single physical location and single physical job rules.
5. Shift overlap, travel, meal, toilet, rest and sleep conflicts.
6. Effective work subtraction with no negative result.
7. Digital AI concurrency, compute exhaustion and physical-body boundary.
8. Brick count, mass, distance, time, vertical energy and worker-hour totals.
9. Equivalent totals for `ONE_STEP_ONE_RECORD` and `AGGREGATED_BATCH`.
10. Fatigue and safety-limit blocking.
11. Minimum/optimal/maximum workforce, skill, supervisor, safety, operator and
    workspace-capacity requirements.
12. Diminishing returns and crowding policy.
13. Exact dependency and 12-stage construction order.
14. Required materials, tools, machines, workers, transport and stage gates.
15. Replay and serialization clauses.
16. `SPECIFICATION_ONLY` and `NO_PRODUCTION_AUTHORITY` boundaries.

## Regression

Run Company Boot, PR #49 identity, causal runtime, Player Genesis and static
acceptance tests. Because PR #64 changes no runtime or UI, visual deployment QA
is not a merge requirement; existing browser routes remain regression-protected
by static acceptance and causal tests.

## Repository Gates

- all JSON parses
- Markdown local links resolve
- UTF-8 decode passes
- unexpected BOM count is zero
- corruption signatures are zero
- secrets are zero
- protected-path changes are zero
- `git diff --check` passes
- working tree is clean after closeout

Required review result: `P0=0`, unresolved `P1=0`, unresolved `P2=0`.
