# Codex Script: Review Cursor Reports

Codex review pass:

1. Pull latest origin/main.
2. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
3. Find tasks with Status: REVIEW.
4. Read the listed Cursor report under `KGEN-AI-Company/reports/`.
5. Inspect diff and protected paths.
6. Check Canon and JSON/Markdown validity.
7. Mark APPROVED, REJECTED, BLOCKED, or DONE.
8. Update `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.
9. Commit and push only approved work.

## V5 Handoff Branch Review

Codex fetches `origin/cursor-handoff/<Task-ID>`, reviews diff/report/protected paths/Canon, then merges to main only if approved.
