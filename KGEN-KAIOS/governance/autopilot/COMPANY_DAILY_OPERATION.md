---
TITLE: "PrimeForge Company Daily Operation Integration Profile"
VERSION: "0.3.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Make Daily Operation Layer 5 of one checkpointed Company OS Session."
ANCESTOR: "KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md"
SOURCE_OF_TRUTH: true
---

# PrimeForge Daily Operation

This profile imports the active Decision Engine gate. It adds freshness, split health, review-first semantics, and automatic repository-maintenance architecture without creating a second Daily Operation standard.

## Mandatory Checks

1. Boot CURRENT and Constitution.
2. Canon and CURRENT selectors.
3. Workspace Policy and Human Main status.
4. Worker Registry and attendance freshness.
5. WorkQueue parse and status consistency.
6. Active claims, concurrent claims, and lease timestamps.
7. Visible handoff branches and tips.
8. Handoffs in `REVIEW` before new execution work.
9. Repair and Human-review queues.
10. Pending commits and pending push patches.
11. DNS, GitHub TCP 443, GitHub HTTPS, and remote Git independently.
12. GitHub Actions availability and latest known run freshness.
13. Pages homepage and Decision Center status.
14. Proposal worktrees and their approval state.
15. Protected-path changes across relevant diffs.
16. Decision Log, Review Log, and JSON/JSONL integrity.
17. Architecture baseline and implementation authorization.
18. Company Inbox capture and Human Inbox classification.
19. Priority Scheduler selection.
20. Repository Maintenance state and next retry.
21. Company Session ID, current layer, prior checkpoint, and close readiness.

## Gate Results

| Result | Meaning |
|---|---|
| `GREEN` | Sources fresh; no blocking review/push/protected alert |
| `AMBER_REVIEW_FIRST` | Existing handoff or repair must be resolved first |
| `AMBER_PROVISIONAL_ONLY` | Local audit/design is allowed but cannot change formal state |
| `NETWORK_RETRY_MODE` | Remote actions wait and retry; Human Inbox and architecture work continue |
| `RED_BLOCKED_SOURCE_CONFLICT` | Authority is ambiguous |
| `RED_PROTECTED_ALERT` | Unauthorized protected diff exists |

## Current Invocation Observation

Observation time: `2026-07-15T17:29:48+08:00`.

```text
COMPANY STATUS
GitHub: PASS (DNS, TCP443, HTTPS, remote Git and fetch PASS)
Main: origin/main 7a692c3; remote freshness verified; HEAD matches
Company OS Boot: P0 ARCHITECTURE AMENDMENT UNDER REVIEW; not active
Company Session: architecture contract only; runtime store not implemented
Human Main: DIRTY, read-only, untouched
WorkQueue: 37 detailed tasks; 24 OPEN; 11 DONE; 2 REJECTED on current main
Active Claims: no unexpired branch lease at observation time; ORG-P2-003F-FIX1 remains in review/repair custody
Claim State: CONFLICT (formal main registry is IDLE; multiple branch-local claim snapshots overlap)
Cursor Handoffs: 003F-FIX1 REPAIR_REQUIRED; 8 overlapping July 15 refs classified unauthorized evidence
Pending Review: 0 unclassified; formal ledger publication deferred by no-commit boundary
Pending Repair: 1 (ORG-P2-003F-FIX1)
Pending Commit: 0 local-only commits; uncommitted proposal worktrees exist
Pending Push: 0 local branch tips absent from origin refs
Actions: PASS (latest observed run completed successfully at origin/main 7a692c3)
Open Draft PRs: 13; retained for later formal maintenance; no remote PR mutation this round
Pages: PASS (homepage, Decision Center, Workforce and Operating Center HTTP 200)
Protected Violations: 0 in reviewed handoff set and proposal diff
Human Decisions Pending: Company OS Boot P0 review; Kernel baseline/law direction
Overall Status: AMBER_ARCHITECTURE_ONLY; repository network HEALTHY
```

## Report Rule

Every invocation reports observed time and freshness. Stale snapshots must be labeled stale; they cannot silently stand in for the current state.
