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
9. Check provenance: visible commit, correct branch, existing report, registered author, existing task ID, diff-aligned changed files, protected path result, and complete provenance fields.
10. Check whether any Suggested WorkOrders remain `PROPOSED`.
11. Decide APPROVED, REJECTED, BLOCKED, or DONE.
12. Write the decision to `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.

## Merge Rule

Only approved work may be committed. Only Codex pushes to origin/main unless the user explicitly authorizes another agent.

## Rejection Rule

If work is incomplete, unsafe, or Canon-conflicting, Codex marks the task REJECTED and writes a corrected WorkOrder.

If provenance is incomplete, Codex must reject or block the merge until the report, author record, task source, branch, commit, and changed-file evidence are complete.

## V5 Handoff Branch Review

Codex reviews Cursor work from `origin/cursor-handoff/<Task-ID>`. Codex checks diff against `origin/main`, reads the report, verifies protected paths and Canon, then merges approved work into main. Rejected work is not merged and receives a FIX task.
