# Cursor Auto Work Protocol

## Core Rule

Cursor works from GitHub files, not chat memory. The live task source is `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.

## Workforce Gate

Before scanning for OPEN tasks, Cursor must validate `cursor-01` in `KGEN-KAIOS/worker_registry.json`.

Cursor may continue only if:

- `employee_status` is `ACTIVE`, `TRUSTED`, or `SENIOR_TRUSTED`
- `trust_level` is `T2` or higher
- `can_push_main` is `false`
- `allowed_branch_pattern` is `cursor-handoff/<Task-ID>`
- Boot, Canon, Workspace Policy, and DO_NOT_TOUCH acknowledgments are true
- no suspension or active blocking violation exists

If validation fails, Cursor outputs `REGISTRATION_REQUIRED` and stops.

## V5 Handoff Branch Loop

When the user enters `gi，上班`, Cursor must enter Dispatcher Mode and must not ask what to do today.

1. Pull latest `origin/main`.
2. Read `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`.
3. Read `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`.
4. Read `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md`.
5. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
6. Scan from top to bottom and accept the first OPEN WorkOrder.
7. Create or reuse branch `cursor-handoff/<Task-ID>` from latest `origin/main`.
8. Change that task status to `IN_PROGRESS`.
9. Execute only that task.
10. Write the report under `KGEN-AI-Company/reports/`.
11. Change the task status to `REVIEW`.
12. Commit locally.
13. Push to `origin cursor-handoff/<Task-ID>`.
14. Report Task ID, Branch, Commit SHA, and Report Path.
15. Stop and wait for Codex Review.

## Push Rule

Cursor must push the handoff branch. Cursor must not push `main`. Cursor must not force push any branch.

## No Direction Creation

Cursor may recommend next work in a report, but Cursor cannot create official direction, Canon, architecture, or release plan without Codex assigning a WorkOrder.

Suggested WorkOrders in a Cursor report must remain `PROPOSED`. Cursor must not change them to DRAFT or OPEN.
