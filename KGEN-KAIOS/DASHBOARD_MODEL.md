# Dashboard Model

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Company Dashboard shows KAIOS health without requiring humans to inspect every branch and report manually.

## Dashboard Sections

| Section | Data |
|---|---|
| Workers | Worker ID, type, status, task, heartbeat |
| Tasks | Count by OPEN, CLAIMED, IN_PROGRESS, REVIEW, APPROVED, MERGED, DONE, REJECTED, FIX, BLOCKED |
| Review | Tasks waiting for Codex, stale reviews, failed reviews |
| Blocked | Block reason, owner, required decision |
| Progress | Completed tasks, active tasks, throughput |
| Health | Stale branches, missing reports, dirty review workspace, protected path alerts |

## Data Sources

- Worker Registry.
- WorkQueue.
- Handoff branches.
- Reports.
- Codex Review Log.
- Recovery notes.

## V7.0 Boundary

This file defines the dashboard data model. It does not build a UI.
