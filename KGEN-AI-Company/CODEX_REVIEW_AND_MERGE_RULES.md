# Codex Review And Merge Rules

## Review Checklist

Codex reviews every Cursor task before commit or push.

1. Read the WorkOrder.
2. Read the Cursor report.
3. Check `git diff`.
4. Check protected paths.
5. Check Canon alignment.
6. Check JSON validity if JSON changed.
7. Check local links if Markdown changed.
8. Check Pages impact if public docs changed.
9. Decide APPROVED, REJECTED, BLOCKED, or DONE.
10. Write the decision to `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.

## Merge Rule

Only approved work may be committed. Only Codex pushes to origin/main unless the user explicitly authorizes another agent.

## Rejection Rule

If work is incomplete, unsafe, or Canon-conflicting, Codex marks the task REJECTED and writes a corrected WorkOrder.

## V5 Handoff Branch Review

Codex reviews Cursor work from `origin/cursor-handoff/<Task-ID>`. Codex checks diff against `origin/main`, reads the report, verifies protected paths and Canon, then merges approved work into main. Rejected work is not merged and receives a FIX task.
