# Automation Schedule

## Cursor Manual Startup

The user starts Cursor by pasting:

```text
gi，上班，啟動西遊記，專案開始
```

## Cursor Automatic Polling

Cursor may read `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` every 10 minutes.

## Progress Report

Cursor should produce a progress report every 2 hours during active work.

## Integrated QA

Cursor should produce an integrated QA report every 10 hours during long-running work.

## Daily Close

Cursor should produce `DAY_REPORT.md` every 24 hours if it has active work or completed tasks.

## Codex Review

After Cursor completes a task, Codex reviews the report. Cursor does not automatically merge unreviewed content.

## Prohibited Automation

- Do not poll every 10 seconds.
- Do not force push.
- Do not run `git reset --hard`.
- Do not delete unconfirmed files.
- Do not overwrite user local worktrees.
- Do not merge unreviewed Cursor output.

