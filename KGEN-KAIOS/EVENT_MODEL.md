# Event Model

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

Events make KAIOS observable. V7.0 defines event names and intent, not implementation.

## Event List

| Event | Meaning |
|---|---|
| `worker.registered` | Worker added to registry |
| `worker.heartbeat` | Worker reported activity |
| `task.opened` | Task created or re-opened |
| `task.claimed` | Worker claimed task |
| `task.in_progress` | Worker started work |
| `task.report_submitted` | Report exists and task moved to REVIEW |
| `review.started` | Codex began review |
| `review.approved` | Codex approved |
| `review.rejected` | Codex rejected |
| `review.blocked` | Codex blocked review |
| `task.merged` | Approved work merged |
| `task.done` | Task closed |
| `recovery.started` | Recovery process opened |
| `security.violation` | Protected path or permission violation |

## Event Payload Intent

Each event should eventually carry:

- Event ID
- Time
- Actor
- Task ID
- Branch
- Commit SHA
- Report path
- Decision path
- Notes
