---
TITLE: "Cursor Handoff Auto Review Integration Profile"
VERSION: "0.3.0"
REVISION: "2026-07-15.3"
STATUS: "APPROVED_IN_PRINCIPLE_P0_AMENDMENT_UNDER_REVIEW"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-OS-BOOT-001"
CHANGE_REASON: "Bind Cursor handoff intake and quality review to the shared Company OS layer sequence."
ANCESTOR: "CODEX_DISPATCHER_PROTOCOL.md; CURSOR_HANDOFF_BRANCH_WORKFLOW.md; CODEX_PRE_MERGE_CHECKLIST.md"
SOURCE_OF_TRUTH: "FALSE"
---

# Cursor Handoff Auto Review

This is an integration profile over the existing Dispatcher and Pre-Merge rules. Auto Review means automatic inspection and classification when Codex is invoked. It never means automatic merge, push, or self-approval.

## Company OS Placement

All providers use the shared Company OS Boot before a handoff can be inspected. Layer 8 loads and reconciles the Review Queue; Layer 12 performs the evidence-bound quality decision after the authorized work gate and evidence layer have passed. A provider cannot reorder these stages or start this review profile directly.

Cursor remains a controlled execution worker. It can produce evidence at Layer 11 but cannot perform Layer 12 Codex review or satisfy Layer 13 Human authority on its own.

## Review-First Trigger

When any task has a newly visible handoff or `handoff_status=REVIEW`, Codex processes it before routing a new Human instruction to execution.

## Required Evidence Package

1. Human Decision ID or valid WorkOrder source.
2. Machine Task Envelope.
3. Claim ID and lease lineage.
4. Correct task branch.
5. Task-specific `HANDOFF.md`.
6. Task-specific `handoff.json`.
7. Worker report.
8. Content commit and externally observed handoff tip.
9. Full diff against latest verified `origin/main`.
10. Tests and reproducible result evidence.
11. Protected-path report.
12. Registered author and reviewer.
13. WorkQueue lifecycle consistency.

Existing submissions created before this architecture is approved are judged against their then-active rules. Missing future artifacts are warnings unless the current Human Decision explicitly requires them or the missing evidence prevents provenance, scope, or merge safety.

## Commit Identity Model

A file cannot reliably contain the hash of the commit that contains that file. The proposed contract separates:

- `content_commit`: commit containing task output and report;
- `handoff_metadata_commit`: optional later commit containing handoff metadata;
- `observed_branch_tip`: recorded by Codex after fetch;
- `reviewed_tree_hash`: tree reviewed by Codex.

Approval binds to the externally observed tip and tree, not a self-referential SHA claim.

## Decisions

| Decision | Meaning |
|---|---|
| `APPROVE` | All required evidence passes |
| `APPROVE_WITH_WARNINGS` | Safe result with non-blocking debt |
| `REPAIR_REQUIRED` | Same task must repair missing or incorrect evidence |
| `REJECT` | Submission violates authority or cannot be safely repaired |
| `BLOCKED` | External state prevents a decision |
| `HUMAN_REVIEW_REQUIRED` | Human authority is required |

## ORG-P2-003F-FIX1 Review

| Check | Result |
|---|---|
| Verified branch tip | `e6e5d2fa251ba84b0f49eff1bd341329b381dc67` |
| Base | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| Task commits | 3, single task |
| Changed files | 4: report, claim, worker registry, WorkQueue |
| Protected-path changes | 0 |
| Temple 12345 changes | 0 |
| Public route preservation | PASS |
| Module inventory | PASS: runtime 25, kgen-12345 45, kgen-v 2, other 1, archive 20 |
| Content-pair difference checks | PASS: 5 of 5 pairs differ as reported |
| Claim fields under current schema | PASS |
| Claim submitted before expiry | PASS |
| First-class `claim_id` | MISSING; value only in `notes` |
| Task Envelope | MISSING |
| Task-specific Handoff pair | MISSING |
| Report head/content commit | MISSING |
| Latest remote confirmation | PASS: fetch completed; main and tip unchanged |

### Decision

`REPAIR_REQUIRED`

The plan itself is technically acceptable and the original one-task rejection screen was healthy enforcement. Formal approval and lease release are withheld because the complete provenance package is unavailable. Remote freshness is no longer a blocker.

### Same-Task Repair Instruction

1. Do not claim another WorkOrder.
2. Preserve `ORG-P2-003F-FIX1` and branch history.
3. After Human approval of the artifact contract, add a machine Task Envelope and task-specific `HANDOFF.md` / `handoff.json` on the same task branch.
4. Record test commands/results, `content_commit`, claim ID, and all changed files.
5. Do not touch Temple 12345 or other protected paths.
6. Codex already refreshed the tip; after repair it reruns the full diff and either approves or returns a bounded repair.

No new FIX WorkOrder is created. `ORG-P2-004` remains unavailable for claim until this task is formally closed and released.

## Concurrent Handoff Evidence

Eight later July 15 refs overlap the `003F-FIX1` lease window:

| Branch | Tip | Classification reason |
|---|---|---|
| `cursor-handoff/ORG-P2-019` | `fa22c12` | No standard claim artifact; overlaps active custody |
| `cursor-handoff/ORG-P2-004-20260715` | `3831c9d` | Wrong/duplicate branch and nonstandard claim; overlaps active custody |
| `cursor-handoff/ORG-P2-004` | `91f9736` | Concurrent claim; overlaps active custody |
| `cursor-handoff/ORG-P2-020` | `af6220b` | Concurrent claim; incomplete handoff |
| `cursor-handoff/ORG-P2-021` | `334e729` | No standard claim artifact; overlaps active custody |
| `cursor-handoff/ORG-P2-022` | `8ba69c1` | Concurrent claim; overlaps active custody |
| `cursor-handoff/ORG-P2-005` | `d4de14e` | Concurrent claim; overlaps active custody |
| `cursor-handoff/ORG-P2-006` | `646bdc0` | Concurrent claim; overlaps active custody |

All eight have zero detected protected-path changes but lack a Task Envelope and task-specific Handoff JSON. They are classified `REJECT_UNAUTHORIZED` or `REJECT_NO_CLAIM` according to evidence and remain unmerged branch history. No remote branch is deleted.
