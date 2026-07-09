# Cursor Polling Rules

## Safe Cadence

- WorkQueue check: every 10 minutes.
- Progress report: every 2 hours during active work.
- Integration report: every 10 hours during long work.
- Daily report: every 24 hours.

## Forbidden Cadence

Do not poll every 10 seconds. Very short polling causes Git conflicts, file churn, unnecessary API pressure, and confusing reports.

## Polling Source

Cursor polls only `KGEN-Organization/WorkOrders/WORK_QUEUE.md` for task status.

## Codex Trigger

Whenever Cursor changes a task to REVIEW, Codex should review it on the next Codex pass.