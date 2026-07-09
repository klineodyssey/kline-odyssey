# Cursor Daily Workflow

## Manual Startup

The manual startup phrase is:

```text
gi，上班，啟動西遊記，專案開始。
```

## Short Cycle

Every 10 minutes, Cursor may check `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` for new `OPEN` tasks.

Cursor must not poll every 10 seconds. Excessive polling can cause git conflicts, file churn, API pressure, and confusing reports.

## Medium Cycle

Every 2 hours, Cursor should produce a progress report if work is ongoing.

Recommended path:

`KGEN-Agent-Office/reports/PROGRESS_REPORT_YYYYMMDD_HHMM.md`

## Long Cycle

Every 10 hours, Cursor should produce an integrated QA report if assigned work spans multiple libraries or tasks.

Recommended path:

`KGEN-Agent-Office/reports/INTEGRATED_QA_YYYYMMDD_HHMM.md`

## Daily Close

Every 24 hours, Cursor should produce:

`KGEN-Agent-Office/reports/DAY_REPORT.md`

## Review Gate

Cursor does not merge its own work. Cursor reports completion and waits for Codex review.

