---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Define ordered Cursor authority loading and a mandatory preflight report."
ANCESTOR: "KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: CursorBoot
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: CursorBootProtocolArchitecture
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/CURSOR_BOOT_PROTOCOL.md"
---

# Cursor Boot Protocol Architecture Proposal

## 1. Bootstrap Anchor

Cursor first opens `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` only as the fixed loader and validates its registered worker identity. The authority-resolution sequence then loads the task sources below in order. This preserves the permanent Boot rule while ensuring Human Decision is the highest task authority.

## 2. Required Authority Load Order

1. Human Decision identified by exact `human_decision_id`.
2. CURRENT Constitution.
3. V11 Architecture Baseline.
4. Active Runtime Selector and CURRENT Runtime entry.
5. Protected Path Policy.
6. Machine-readable Task Envelope.
7. Relevant Human-approved module baseline.
8. Current canonical WorkQueue entry.
9. Exact approved ADR IDs required by the envelope.
10. Latest handoff for this Task ID, if one exists.
11. Branch and isolated worktree state.
12. Repo health, network freshness and dependency status.

"Latest ADR" never means newest filename or timestamp. It means the exact applicable, approved ADR named by the Task Envelope or current baseline manifest.

## 3. Fifteen-Step Preflight

1. Identify Human Decision ID.
2. Identify Task ID.
3. Confirm authorized scope.
4. Confirm forbidden scope.
5. Fetch latest origin state; if unavailable, block executable work and record source freshness.
6. Inspect current branch and worktree.
7. Confirm Human Main is untouched.
8. Load CURRENT selectors.
9. Load protected path list.
10. Load relevant module baseline.
11. Validate dependencies, claim lease and single-task limit.
12. Create a bounded execution plan.
13. Print the complete Preflight Report.
14. Wait for explicit GO when `go_required` is true.
15. Start only the authorized work.

Cursor must not modify files before Step 13 returns `PASS` and Step 14 is satisfied when required.

## 4. CURSOR PREFLIGHT Output

```text
CURSOR PREFLIGHT

Human Decision ID:
Task ID:
Worker ID:
Worker Status:
Trust Level:
Branch:
Worktree:
Base SHA:
Current Main SHA:
Source Freshness:
Authorized Paths:
Forbidden Paths:
Protected Paths Loaded:
CURRENT Runtime Loaded:
Baseline Loaded:
ADR Loaded:
WorkQueue Loaded:
Task Envelope Loaded:
Claim Lease:
Dependencies:
Known Conflicts:
Legacy Rules Loaded:
Legacy Rules Suppressed:
Implementation Authorized:
Commit Authorized:
Push Authorized:
Merge Authorized:
Deploy Authorized:
GO Required:
GO Evidence:
Status:
```

If any field needed for authority is unknown, `Status: BLOCKED`.

## 5. Conflict Behavior

When two loaded sources conflict, Cursor stops and reports:

```text
CONFLICT_ID
HIGHER_SOURCE
LOWER_SOURCE
CONFLICT_DESCRIPTION
AFFECTED_TASK
FILES_NOT_MODIFIED
RECOMMENDED_HUMAN_DECISION
```

Cursor does not choose an interpretation, even when the lower source appears newer.

## 6. Preflight Result

Only these outcomes are allowed:

- `PASS_READY`
- `WAITING_FOR_GO`
- `REGISTRATION_REQUIRED`
- `BLOCKED`
- `EXPIRED`
- `SUSPENDED`

There is no “best effort” execution state.
