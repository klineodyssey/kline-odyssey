# Codex Dispatcher Protocol V5.0

Codex is the Dispatcher. Cursor works on handoff branches. Codex reviews and publishes main.

## Codex Handoff Review Steps

1. Run `git fetch origin --prune`.
2. Identify the Cursor branch `cursor-handoff/<Task-ID>`.
3. Inspect `origin/cursor-handoff/<Task-ID>`.
4. Review diff against `origin/main`.
5. Read the report under `KGEN-AI-Company/reports/`.
6. Check protected paths.
7. Check Canon alignment.
8. Decide APPROVED or REJECTED.

## If Approved

1. Merge the handoff branch into main.
2. Update `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.
3. Change the WorkOrder status from REVIEW to DONE.
4. Push `origin main`.

## If Rejected

1. Write the rejection reason in `CODEX_REVIEW_LOG.md`.
2. Change the WorkOrder status from REVIEW to REJECTED.
3. Add a new FIX task such as `FIX-001` to the WorkQueue.
4. State exactly what Cursor must fix next time.
5. Do not merge the handoff branch.

## Dispatcher Responsibilities

- Keep WorkQueue clean.
- Keep Cursor supplied with OPEN tasks.
- Never force push.
- Never reset user work.
- Never approve a task if the handoff branch, report, or commit SHA is missing.
