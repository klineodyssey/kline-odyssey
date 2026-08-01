# Codex Review - Cursor Ecology V1 Candidate Data

Task: `KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001`

Cursor branch: `cursor-handoff/KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001`

Draft PR: `#76`

Reviewed head: `2bc81b0d7caab0a598a478e7c04e026b24d5f3ab`

Decision: `APPROVED_WITH_REPAIRS`

Output status remains: `CANDIDATE_ONLY`

## File Decisions

| File | Decision | Evidence |
|---|---|---|
| `food-relationships.json` | `APPROVED` | Only approved species and three abstract pools; mass-transfer requirements; no invented life |
| `habitat-compatibility.json` | `APPROVED_WITH_REPAIRS` | Seven habitats and canonical IDs; all capacities repaired to <=500 |
| `environmental-thresholds.json` | `APPROVED` | Thresholds match existing candidate package evidence; terrain/water use `NO_REPRODUCTION` |
| `population-scenarios.json` | `APPROVED_WITH_REPAIRS` | Hard total cap 500, baseline biological total 476, deterministic scenarios and no automatic species |
| `viewer-cards.json` | `APPROVED` | Read-only candidate preview; mutation, Wallet and settlement controls absent |
| `ecology-v1-candidate-data.test.mjs` | `APPROVED_WITH_REPAIRS` | Enforces IDs, abstract boundaries, nonreproduction, all caps and biological total |
| `CURSOR_ECOLOGY_V1_CANDIDATE_REPORT.md` | `APPROVED` | Preserves provenance, branch, authority and review gate |

## Findings

P0: `0`

P1: `1 REPAIRED` - initial habitat/population values exceeded the approved hard cap. Repair commit `2bc81b0d7caab0a598a478e7c04e026b24d5f3ab` resolves the issue and adds regression assertions.

P2: `0`

Unresolved P0/P1/P2: `0/0/0`

The pre-existing foundational-candidate validator assumed exactly eight directories. Codex repaired it in PR #75 to scope Life packages explicitly and permit the authorized `ecology-v1` data directory without treating it as a ninth Life type.

## Boundary Review

Canonical compatibility: `PASS`

Physics and mass-accounting readiness: `PASS_AS_CANDIDATE_DATA`

Time/environment requirements: `PASS`

Rights boundaries: `PASS`

Duplicate Runtime: `0`

Uncontrolled reproduction: `false`

Wallet/KGEN: `NONE / DISABLED`

Protected changes: `0`

Cursor may not merge PR #76. Codex may integrate the approved candidate data after PR #75 establishes the canonical specification and governance envelope.
