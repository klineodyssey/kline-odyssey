# Task Claim Lease Protocol

**Version:** V7.1 Minimal Worker Layer
**Status:** Active / Draft for Review

## Purpose

The Task Claim Lease Protocol prevents two AI workers from doing the same WorkOrder at the same time. It extends the V7.0 Task Claim Protocol with a lease model and a complete task lifecycle.

## Task Lifecycle

```text
OPEN
-> CLAIMED
-> IN_PROGRESS
-> REVIEW
-> APPROVED
-> MERGED
-> DONE
```

Failure path:

```text
REVIEW
-> REJECTED
-> FIX
-> REVIEW
```

Blocked path:

```text
OPEN / CLAIMED / IN_PROGRESS / REVIEW
-> BLOCKED
-> OPEN / FIX / DONE
```

## Status Definitions

| Status | Meaning | Controller |
|---|---|---|
| OPEN | Ready to be claimed | Codex / PM |
| CLAIMED | Worker reserved the task | Worker |
| IN_PROGRESS | Worker is actively executing | Worker |
| REVIEW | Worker submitted report and branch | Worker |
| APPROVED | Codex accepted the task result | Codex |
| MERGED | Codex merged result to main | Codex |
| DONE | Task is closed | Codex |
| REJECTED | Codex rejected result | Codex |
| FIX | Follow-up correction required | Codex / Worker |
| BLOCKED | Cannot proceed without resolution | Codex / Worker |

## Claim Lease Fields

| Field | Required | Meaning |
|---|---|---|
| `task_id` | Yes | WorkOrder ID |
| `worker_id` | Yes | Claiming worker |
| `worker_type` | Yes | Worker type from registry |
| `status` | Yes | Current task status |
| `branch` | Yes | Expected handoff branch |
| `base_commit` | Yes | Main commit at claim time |
| `claimed_at` | Yes | Claim timestamp |
| `lease_expires_at` | Yes | Time when claim becomes stale |
| `heartbeat` | Yes | Last worker activity |
| `report_path` | Yes | Required report path |
| `reviewer` | Yes | Assigned reviewer |

## Claim Rules

1. A worker claims only one OPEN task at a time.
2. A claimed task must record worker ID and branch.
3. A task in CLAIMED or IN_PROGRESS cannot be claimed by another worker unless the lease expires or Codex releases it.
4. A worker must update heartbeat before the lease expires.
5. If a lease expires, Codex may mark the task BLOCKED, reopen it, or create a FIX task.

## Machine Schema

The machine-readable claim schema lives at:

```text
KGEN-KAIOS/task_claim_schema.json
```