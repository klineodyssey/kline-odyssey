# WorkQueue Execution Rules

## How Cursor Finds The Next Task

Cursor scans `KGEN-Organization/WorkOrders/WORK_QUEUE.md` from top to bottom.

Cursor ignores:

- DONE
- REVIEW
- BLOCKED
- APPROVED
- REJECTED
- IN_PROGRESS tasks owned by another active run

Cursor executes the first OPEN task it sees. Cursor must not skip task numbers. Cursor must not run two tasks at the same time.

## If There Is No OPEN Task

Cursor writes a standby note in `KGEN-AI-Company/reports/` and stops. Codex must decide whether to create more WorkOrders or close the cycle.

## Completion Rule

A Cursor task is ready for Codex only when the report exists, task status is REVIEW, local commit exists, and protected paths were checked.
