# Human Operator Guide

## Cursor Start Command

Paste this in Cursor:

```text
gi，上班
```

Cursor must not ask what to do today. Cursor reads WorkQueue, executes the first OPEN task, pushes `cursor-handoff/<Task-ID>`, reports the branch and commit, and stops.

## Codex Review Command

Paste this in Codex after Cursor reports a handoff branch:

```text
Codex，Review Cursor 最新 REVIEW 任務，核准則 push，拒絕則退回修正。
```

## User Flow

1. Paste `gi，上班` in Cursor.
2. Cursor completes one WorkOrder.
3. Cursor pushes `cursor-handoff/<Task-ID>`.
4. Cursor reports Task ID, Branch, Commit SHA, and Report Path.
5. Paste Cursor output to Codex.
6. Codex fetches the handoff branch, reviews, merges/pushes main if approved, or rejects and creates a FIX task.
7. Paste `gi，上班` in Cursor again.
8. Repeat until the WorkQueue has no OPEN tasks.

## Main Paths

- WorkQueue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- Cursor handoff branch: `cursor-handoff/<Task-ID>`
- Cursor reports: `KGEN-AI-Company/reports/`
- Codex review log: `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`
