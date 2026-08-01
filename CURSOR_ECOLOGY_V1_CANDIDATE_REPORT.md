# Cursor Ecology V1 Candidate Report

## BOOT

- Task ID: `KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001`
- Worker ID: `cursor-01`
- Worker type: Cursor
- Worker classes: `FOUNDATIONAL_LIFE_CREATOR`, `LIFE_RESEARCH_ANALYST`
- Employee status: `ACTIVE`
- Trust level: `T2`
- Reviewer: `codex-gm-01`
- Authority: `CANDIDATE_ONLY`
- Base commit: `46518a75ec7aedd5fce10290952f47b9fca96963`
- Authorization evidence: Codex dispatch commit `856f519`, PR #75
- Authoritative envelope: `KAIOS/life/ecology/KAIOS_ECOLOGY_CURSOR_TASK_ENVELOPE.json` at dispatch commit
- Branch: `cursor-handoff/KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001`
- Continue decision: `AUTHORIZED`

The dispatch envelope and repaired `cursor-01` registry state were read directly from commit `856f519`. Those governance files were not copied into this branch.

## MUST READ

Read and acknowledged:

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
- `AGENTS.md`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-KAIOS/WORKER_REGISTRY.md`
- `KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md`
- `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md`
- `KGEN-KAIOS/STALE_HANDOFF_BRANCH_POLICY.md`
- `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
- `KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md`
- `KGEN-KAIOS/governance/cursor/CURSOR_HANDOFF_STANDARD.md`
- Canonical Life V1 specification, schema, taxonomy, extensions, physics, economy and rights files
- Life Runtime V1 implementation and tests
- Grass, Tree, Fish, Shrimp, Mountain, Soil, Water and River candidate packages

## PROTECTED PATH CHECK

- Protected paths in scope: `NONE`
- Runtime engine changes: `0`
- Canonical schema changes: `0`
- CURRENT changes: `0`
- Wallet access: `false`
- Real KGEN access: `false`
- Deployment changes: `0`
- Merge authority: `false`
- Protected path violations: `0`

## TASK PLAN

Create data-only candidate artifacts for:

1. Foundational food relationships.
2. Habitat compatibility.
3. Species environmental thresholds.
4. Deterministic population scenario fixtures.
5. Read-only ecosystem viewer cards.
6. Candidate data validation.

Only the eight existing foundational canonical species IDs are used. Missing living producers, decomposers and aquatic food organisms are represented only by the three authorized abstract resource pools.

## EXECUTION

Created five JSON datasets and one Node test. The datasets:

- preserve all eight existing species IDs;
- reuse environmental thresholds from existing candidate packages;
- mark Mountain, Soil, Water and River as `NO_REPRODUCTION`;
- provide finite carrying capacities and generation limits;
- include drought, pollution, overcapacity and restoration fixtures;
- mark fishpond data `ECOLOGICAL_SIMULATION_ONLY` with no settlement;
- expose only read-only viewer-card data;
- do not implement an ecosystem Runtime engine.

Abstract resources are limited to:

- `AQUATIC_PRIMARY_FOOD_POOL`
- `DETRITUS_POOL`
- `MICROBIAL_DECOMPOSITION_PROXY`

Each is marked `ABSTRACT_RESOURCE_POOL` and `NOT_FULL_LIFE_RUNTIME`.

### Integration note

The pre-existing `KAIOS/life/tests/validate_foundational_life_candidates.py` assumes that every directory below `KAIOS/life/candidates/` is one of exactly eight life packages. The newly authorized `ecology-v1/` data directory therefore triggers its directory-count assertion before content validation. Updating that legacy validator is outside this task's path allowlist. Codex should teach it to ignore candidate dataset directories or scope it to the eight package names when integrating this Draft PR.

## FINAL REPORT

- Codex review decision: `APPROVED_WITH_REPAIRS`
- P1 repair: applied hard total population cap `500`; all habitat and species capacities are `<=500`; biological baseline total is `476`; candidate tests enforce both limits
- Result: `PASS_WITH_OUT_OF_SCOPE_INTEGRATION_NOTE`
- Output status: `CANDIDATE_ONLY / PENDING_CODEX_REVIEW`
- Files added: 7
- Files modified: 0
- Files deleted: 0
- Branch base: `46518a75ec7aedd5fce10290952f47b9fca96963`
- Head commit: resolve from the pushed branch tip; the report is part of that commit
- Report path: `CURSOR_ECOLOGY_V1_CANDIDATE_REPORT.md`

### Checks

- Candidate data test: `PASS`
- Strict JSON parse: `PASS (5/5)`
- Canonical ID match: `PASS (8/8)`
- No terrain/soil/water/river reproduction: `PASS`
- Abstract resource boundary: `PASS (3/3)`
- Finite population limits: `PASS`
- Codex P1 population-cap repair: `PASS`
- UTF-8: `PASS`
- BOM scan: `PASS`
- Secret scan: `PASS`
- Protected path scan: `PASS`
- `git diff --check`: `PASS`
- Legacy exact-eight-directory validator: `OUT_OF_SCOPE_INTEGRATION_NOTE`

### State sequence

`BOOT -> CLAIM -> WORK -> TEST -> REPORT -> REVIEW -> READY_FOR_PUSH`

Cursor does not self-assign `DONE`. Codex must independently review the datasets, address the legacy validator integration, and decide whether any content is accepted.

Final status: `CURSOR_ECOLOGY_CANDIDATES_READY_FOR_CODEX_REVIEW`
