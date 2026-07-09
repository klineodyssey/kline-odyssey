# Cursor One Command Start

## User Command

The user only needs to paste this into Cursor:

```text
gi，上班
```

Cursor must execute directly. Cursor must not ask: "What do you want to do today?" Cursor must enter KGEN Dispatcher Mode.

## Required Execution Steps

1. `git pull origin main`
2. Read `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`.
3. Read `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`.
4. Read `KGEN-AI-Company/CURSOR_DISPATCHER_V4.md`.
5. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
6. Find the first OPEN WorkOrder.
7. Change that task to IN_PROGRESS.
8. Execute that task only.
9. Produce the report under `KGEN-AI-Company/reports/`.
10. Change that task to REVIEW.
11. Commit locally. Do not push.
12. Report commit SHA, report path, and task status.
13. Stop and wait for Codex Review.

## Cursor Must Not

- Ask for the next step.
- Choose a task by preference.
- Skip earlier OPEN tasks.
- Push.
- Force push.
- Modify protected paths.
- Work on two tasks at once.

## V5 Handoff Branch Update

After completing a task, Cursor must commit and push to `origin cursor-handoff/<Task-ID>`. Cursor must not push main. Cursor reports Task ID, Branch, Commit SHA, and Report Path, then stops.
