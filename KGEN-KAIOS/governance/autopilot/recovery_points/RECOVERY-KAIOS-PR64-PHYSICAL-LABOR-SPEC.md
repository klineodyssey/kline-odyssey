# Recovery Point - KAIOS PR64 Physical Labor Specification

Status: `MERGED_VALIDATED`

Task ID: `KAIOS-PR64-PHYSICAL-LABOR-CONSTRUCTION-SPEC-001`

Created At: `2026-08-01T10:01:16+08:00`

## Repository State

- Previous main: `cd386121322373fdcd74245cd3650d3e5ffdd826`
- Branch: `codex/kaios-pr64-physical-labor-construction-spec`
- Pull request: `#64`
- Reviewed head: `8c16ba35778b8aa479fa37abf10508081abd19bc`
- Merge method: `MERGE_COMMIT`
- Merge commit: `6510caea03a9e34dbbbce9a06ac9f8de1d97e86b`

## Recovered Specification Baseline

- One physical life, body, primary location and primary physical job contract.
- Travel, shift, meal, toilet, rest and sleep conflict codes.
- Bounded digital AI concurrency without physical-body duplication.
- Conserved brick labor accounting in detailed and aggregate modes.
- Workforce skills, supervision, safety, machine operation and crowding gates.
- Ordered twelve-stage residential construction specification.
- Draft 2020-12 machine contracts and executable specification tests.

The PR #63 eight-stage `BASIC_HOUSE_FOUNDATION` runtime remains unchanged.
PR #64 is a specification baseline and does not activate a complete construction
runtime.

## Verification

- PR #64 specification tests: `23 / 23 PASS`
- Company Boot tests: `74 / 74 PASS`
- PR #49 identity tests: `86 / 86 PASS`
- PR #63 causal runtime tests: `40 / 40 PASS`
- Player Genesis tests: `36 / 36 PASS`
- Static acceptance: `76 files / 91 JSON / 107 local references PASS`
- Repository JSON: `571 / 571 PASS`
- JSON Schema structural validation: `2 / 2 PASS`
- UTF-8: `2111 / 2111 PASS`
- BOM, corruption, secrets and protected violations: `0`
- GitHub Product QA: runs `30678954499` and `30678964857` passed

## Rollback

Revert merge commit `6510caea03a9e34dbbbce9a06ac9f8de1d97e86b`
through a normal reviewed revert PR. Do not reset shared history and do not
modify Runtime CURRENT. PR #63 remains the executable fallback baseline.

## Authority Boundaries

- Mode: `SPECIFICATION_ONLY`
- Production Runtime: `NOT_ACTIVATED`
- Real wallet: `NONE`
- Real KGEN: `DISABLED`
- Real labor or machinery control: `NONE`
- Protected-path violations: `0`
