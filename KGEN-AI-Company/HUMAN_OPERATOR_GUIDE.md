# Human Operator Guide

## First Day

Open Cursor Agent and paste this once:

```text
gi，上班，啟動西遊記，專案開始。
```

## After First Day

Do not keep pasting manual tasks into Cursor. Cursor should read GitHub WorkQueue by itself.

## What Cursor Reads

- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`

## What User Watches

The user watches Codex reports. Codex manages WorkQueue, reviews Cursor reports, commits approved changes, and pushes to GitHub.

## Main Paths

- WorkQueue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- Cursor reports: `KGEN-AI-Company/reports/`
- Codex review log: `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

## V4 One-Command Workflow

Cursor start command:

```text
gi，上班
```

Codex Review command:

```text
Codex，Review Cursor 最新 REVIEW 任務，核准則 push，拒絕則退回修正。
```

User flow:

1. Paste `gi，上班` in Cursor.
2. Cursor completes one WorkOrder and reports commit SHA, report path, and task status.
3. Paste Cursor output to Codex.
4. Codex reviews, approves/pushes or rejects/returns correction.
5. Paste `gi，上班` in Cursor again.
6. Repeat until WorkQueue has no OPEN tasks.
