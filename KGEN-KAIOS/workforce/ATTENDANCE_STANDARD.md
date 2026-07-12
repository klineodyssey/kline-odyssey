# KGEN Attendance Standard

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-07-12  
**Task ID:** KGEN-WORKFORCE-ROSTER-2026-0001

## Purpose

Attendance proves that a worker is actually on duty. A registry entry alone does not count as attendance.

## Event Types

`CHECK_IN`, `BOOT_COMPLETE`, `TASK_CLAIMED`, `TASK_STARTED`, `HEARTBEAT`, `REPORT_SUBMITTED`, `REVIEW_STARTED`, `REVIEW_COMPLETED`, `TASK_DONE`, `BLOCKED`, `CHECK_OUT`, `SUSPENDED`, `REVOKED`.

## Required Event Fields

`event_id`, `worker_id`, `event_type`, `timestamp`, `task_id`, `branch`, `commit_sha`, `report_path`, `workspace`, `evidence`, `health`, `notes`.

## Rules

- No worker may claim attendance without Boot evidence.
- No worker may claim a task without WorkQueue and lease evidence.
- Cursor handoff reports must include branch, commit, base commit and report path.
- Codex review events must record review result and protected path check.
- Daily attendance is summarized in `daily_attendance.json` and `DAILY_ATTENDANCE_REPORT.md`.
