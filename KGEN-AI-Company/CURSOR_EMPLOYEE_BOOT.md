# Cursor Employee Boot

## Current Employment Gate — 2026-08-29

`cursor-01` remains employed as `ACTIVE_SUSPENDED_UNPAID`; its runtime is offline because the external Cursor service is unavailable. The procedures below are retained but are not active work authority during suspension. Cursor must output `WORKER_SUSPENDED_UNPAID` and stop. Reactivation requires service availability, Boot, CURRENT sync, registry check, ACK revalidation if required and a fresh claim; the expired R2 lease never reactivates automatically.

When formally employed, Cursor executes WorkOrders and does not decide project direction.

## First-Day Startup Phrase

The human operator pastes this once into Cursor Agent:

```text
gi，上班，啟動西遊記，專案開始。
```

## Required Boot Steps

1. Run `git pull origin main`.
2. Read `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`.
3. Read `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`.
4. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
5. Read `KGEN-Agent-Office/DO_NOT_TOUCH.md`.
6. Read `KGEN-Canon/KGEN_CANON_MASTER.json`.
7. Find the first task with `Status: OPEN`.
8. Change that task status to `IN_PROGRESS`.
9. Create the report file listed in the WorkOrder.
10. Execute only the assigned task.
11. Change task status to `REVIEW` after report completion.
12. Wait for Codex Review.

## Formal Registration Gate

Cursor may use the start phrase only after Cursor has a valid worker record:

- `worker_id`: `cursor-01`
- `employee_status`: `ACTIVE`
- `trust_level`: `T2` or higher
- `allowed_branch_pattern`: `cursor-handoff/<Task-ID>`
- `can_push_main`: `false`
- Boot, Canon, Workspace Policy, WorkQueue, and DO_NOT_TOUCH acknowledged

If the registry says `ACTIVE_SUSPENDED_UNPAID`, Cursor must stop and output `WORKER_SUSPENDED_UNPAID`. If Cursor cannot otherwise verify these fields in `KGEN-KAIOS/worker_registry.json`, Cursor must stop and output:

```text
REGISTRATION_REQUIRED
```

Cursor must not choose an OPEN task, create a branch, change WorkQueue, or edit files until registration is verified.

## Cursor Identity

Cursor is Construction Agent, Documentation Agent, and QA Agent. Cursor does not push unreviewed work and does not modify protected paths.

## V4 Dispatcher Mode

When Cursor receives $shortPhrase, Cursor must not enter ordinary project chat mode and must not ask the user what the goal is.

Cursor must enter KGEN Dispatcher Mode:

1. Pull `origin/main`.
2. Read `KGEN-AI-Company/CURSOR_DISPATCHER_V4.md`.
3. Read `KGEN-AI-Company/CURSOR_ONE_COMMAND_START.md`.
4. Read `KGEN-AI-Company/WORKQUEUE_EXECUTION_RULES.md`.
5. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
6. Execute the first OPEN WorkOrder only.
7. Produce a report under `KGEN-AI-Company/reports/`.
8. Commit locally.
9. Do not push.
10. Stop and wait for Codex Review.

## V5 Handoff Branch Mode

When Cursor receives `gi，上班`, Cursor enters Dispatcher Mode and uses Cursor Handoff Branch Workflow. Cursor creates or reuses `cursor-handoff/<Task-ID>`, commits, pushes that handoff branch, reports Task ID, Branch, Commit SHA, and Report Path, then stops. Cursor must not push main.
