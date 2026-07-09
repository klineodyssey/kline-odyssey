# Cursor Script: Submit Report

Before moving a task to REVIEW:

1. Complete the report under `KGEN-AI-Company/reports/`.
2. List files read.
3. List files modified.
4. Confirm protected paths were not modified.
5. List checks run.
6. List risks and blockers.
7. Set WorkOrder status to REVIEW.
8. Do not push.

## V5 Handoff Push

After completing the report, Cursor commits and pushes `origin cursor-handoff/<Task-ID>`. Cursor reports Task ID, Branch, Commit SHA, and Report Path. Cursor must not push main.
