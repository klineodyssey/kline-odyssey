---
TITLE: "PrimeForge Company End of Day Review Architecture"
VERSION: "0.3.0"
REVISION: "2026-07-16.3"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "AGB / MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT; next independent review required"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
CHANGE_REASON: "Add hierarchical health closeout, retention tiers, drift, disaster-recovery and P0 safe-hold gates."
ANCESTOR: "COMPANY_SESSION.md; COMPANY_DAILY_OPERATION.md; worker-swarm/RECOVERY_RUNTIME.md"
SOURCE_OF_TRUTH: "FALSE"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/COMPANY_END_OF_DAY_REVIEW.md"
---

# Company End of Day Review

## 1. Meaning of End of Day

`END_OF_DAY_REVIEW` runs whenever Codex prepares to end a Company Session. It is a Session-closing gate, not a calendar-only event. Boot, Resume and End Session all invoke the same review discovery contract with different checkpoints.

Codex must not assume Cursor remained idle while Codex was performing architecture, source audit, validation or other long work.

## 2. Closing Flow

```text
REQUEST_SESSION_CLOSE
-> freeze new dispatch
-> refresh repository and registry observations
-> scan every Monkey Clone
-> scan Session Registry
-> scan Claim Registry
-> scan Handoff Queue
-> scan Review Queue
-> scan Repair Queue
-> classify expiring leases and orphan claims
-> acquire review custody for unseen handoffs
-> persist checkpoint, evidence and decisions
-> verify recovery pointer
-> emit Company Closing Report
-> SESSION_CLOSED or SESSION_CLOSE_BLOCKED
```

The freeze blocks new dispatch only. It does not cancel running authorized Clones or erase their leases.

## 3. Mandatory Closing Checks

| Check | Passing condition |
|---|---|
| Clone scan | Every registered active Clone has a current state or explicit `UNKNOWN` alert |
| Session scan | No two unfenced Sessions own one Clone |
| Claim scan | Every active Claim has a Worker, Session, Task, lease and fencing token |
| Handoff scan | Every new handoff is classified and has review custody |
| Review scan | Every pending review has owner, priority and recovery pointer |
| Repair scan | Repair remains tied to its original task lineage |
| Lease scan | Expiring leases have an action or alert |
| Orphan scan | Claims without a live Session are queued for recovery or expiry |
| Heartbeat scan | Squad and Department summaries reconcile with bounded raw heartbeat windows |
| Legacy scan | Stale Boot, SOP, Queue, Claim and Handoff versions are intercepted |
| Protected audit | No reviewed diff modifies protected paths without Level C Human approval |
| Checkpoint | State, evidence, decisions, claims and reviews are durably referenced |
| Recovery scan | Failure domains, fencing epochs, restore pointers and recovery quotas reconcile |
| Drift scan | CURRENT, ADR, schema, Boot, Claim, event and autonomy contracts have no unclassified drift |

`UNKNOWN` is not silently converted to zero or idle.

## 4. Long-Running Operation Rule

Any Codex operation expected to last 30 minutes or more must:

1. save an intermediate Company Session checkpoint;
2. invoke a bounded Swarm rescan at least every 30 minutes;
3. avoid dispatching overlapping work based on stale state;
4. perform a complete final rescan before close;
5. record handoffs discovered during the operation separately from its primary output.

This is an architecture requirement. No background timer or daemon is claimed to exist in the repository.

## 5. Lease Disposition

| Observed state | Closing action |
|---|---|
| `ACTIVE` with healthy heartbeat | Retain Claim and checkpoint ownership |
| `HANDOFF_SUBMITTED` | Move custody to Review Queue immediately |
| `REVIEW` | Confirm Codex review owner and recovery pointer |
| `REPAIR` | Preserve same Claim lineage and repair instruction |
| Expiring without handoff | Alert and schedule lease evaluation |
| Expired without handoff | Mark recovery/expiry candidate; do not invent evidence |
| Orphaned | Fence stale Session and enter Review Recovery |
| Approved | Atomically close and release after all ledgers agree |
| Unauthorized | Preserve as evidence; do not grant retroactive authority |

Codex does not wait for a valid completed handoff lease to expire naturally. It reviews and disposes it.

## 6. Closing Checkpoint Contract

```text
checkpoint_id
company_session_id
created_at
manager
managed_main_sha
origin_main_sha
clone_registry_revision
session_registry_revision
claim_registry_revision
handoff_scan_cursor
review_queue_revision
repair_queue_revision
active_claims
pending_reviews
pending_repairs
orphan_claims
expiring_leases
decisions_recorded
evidence_refs
company_memory_cursor
legacy_suppression_events
protected_path_result
recovery_pointer
close_status
```

The checkpoint contains references and public operational metadata only. It must not contain secrets, private Human files or credentials.

## 7. Close Conditions

Session close is allowed when:

- all discovered handoffs are classified;
- every pending review has durable custody;
- every active Claim has a resumable checkpoint or explicit risk record;
- no unresolved protected-path alert is hidden;
- the recovery pointer can reproduce the state;
- the closing report is generated.

Pending work may remain across Sessions. It must be visible and recoverable; it need not be falsely marked done.

Session close is blocked by:

- unclassified handoff;
- missing review owner;
- missing or conflicting Claim identity;
- checkpoint persistence failure;
- unknown protected-path impact;
- registry revision conflict;
- secret or private-data exposure;
- Level C decision awaiting safe containment.

An architecture-only Human Decision may remain under review, but it must not be converted into an implementation dispatch during closeout.

The failure code is `SESSION_CLOSE_BLOCKED_CHECKPOINT_REQUIRED` when durable state cannot be produced.

## 8. Company Closing Report

The final report includes:

```text
Company Health
Managed Main SHA
Human Main Protected
Clones Scanned
Active Claims
New Handoffs
Reviews Classified
Pending Reviews
Pending Repairs
Expiring Leases
Orphan Claims
Tasks Closed
Tasks Released
Protected Violations
Level C Decisions Pending
Recovery Checkpoint
Next Automatic Action
```

It distinguishes architecture observation from a committed registry transition.

## 9. Current Session Closing Rule

The initial eight remote Cursor handoffs discovered on 2026-07-16 are classified `REJECT_UNAUTHORIZED / EVIDENCE_ONLY`. A closing fetch found 13 additional tips; none has a canonical atomic Claim, so they are classified `REJECT_NO_CANONICAL_CLAIM / EVIDENCE_ONLY`. No branch is merged or deleted and no underlying WorkOrder is closed. The existing WorkQueue, Review Log and Decision Log record the intake decisions; this metadata does not enable Auto Dispatch.

## 10. Daily Autonomous Cycle

The closing runtime verifies that the fixed daily sequence was observed:

```text
Company Boot
-> Git Health
-> Pages Health
-> Review Queue
-> Cursor Queue
-> Repair
-> Architecture Queue
-> Human Inbox
-> Authorized Dispatch
-> Checkpoint
-> Daily Review
-> Company Close
```

It records any skipped stage as `DAILY_CYCLE_INCOMPLETE`. Human reminder is not a valid substitute for the checkpoint.

## 11. Company Memory Closeout

Before close, Codex writes or queues durable memory references for Decisions, Reviews, Architecture, Rejections, Lessons Learned, Technical Debt and Roadmap. Records are append-only and superseded rather than overwritten. Secret, KYC, GPS, credential and Human-private workspace content is excluded.

Memory closeout assigns hot, warm, cold, immutable or disposable retention. Raw heartbeat and temporary telemetry are not retained forever. Snapshot, replay, compaction, pruning and archive actions require hashes and audit evidence.

Drift observations are preserved separately from formal state. For example, a stale `PENDING_PUSH` snapshot does not become a real pending push after the referenced commit is found in `origin/main`.

## 12. P0 Safe Hold

Unreconciled authority, broken Evidence Chain, corrupt snapshot, recovery cascade, architecture drift or missing Human Anchor enters `SAFE_HOLD`. Closing may preserve a durable hold checkpoint, but it cannot mark the Company healthy or enable a new dispatch.

## 13. Architecture Boundary

This document does not implement a timer, closing daemon, database transaction, registry write, claim release, WorkQueue mutation, commit, push or deployment.

```text
Architecture: ARCHITECTURE_REVISION_P0
Company Closing Runtime: PROPOSED
Auto Dispatch: DISABLED
Implementation: NOT_STARTED
```
