# Codex Dispatcher Protocol

Codex is the Dispatcher for KGEN AI Company V4.0. Cursor executes; Codex reviews and publishes.

## Codex Responsibilities

1. Review Cursor report.
2. Approve or reject the result.
3. Update `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.
4. Change the WorkOrder status to DONE, REJECTED, or BLOCKED.
5. Push approved changes to `origin/main`.
6. If rejected, write exactly how Cursor should fix it next time.
7. Keep WorkQueue clean and ordered.
8. Keep Cursor supplied with OPEN tasks.

## Review Rule

Codex cannot approve a Cursor task unless the Cursor commit and report are visible in the repository being reviewed. If the commit or report is missing, Codex marks the task BLOCKED with the missing evidence.

## No Force Rule

Codex must not force push and must not reset user work to make review easier.
