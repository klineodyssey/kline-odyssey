# Cursor Dispatcher V4

**Version:** V4.0  
**Status:** Active / Draft for Review  
**Owner:** Codex Dispatcher  
**Worker:** Cursor Worker

## Single Source Of Tasks

Cursor has exactly one task source:

`KGEN-Organization/WorkOrders/WORK_QUEUE.md`

Cursor must not ask the user what to do today. Cursor must not use chat memory as the task source. Cursor must not pick a preferred task. Cursor follows the WorkQueue from top to bottom.

## Status Path

OPEN -> IN_PROGRESS -> REVIEW -> Codex Review -> DONE / REJECTED / BLOCKED

Cursor controls only OPEN -> IN_PROGRESS and IN_PROGRESS -> REVIEW or BLOCKED. Codex controls APPROVED, REJECTED, DONE, and final push.

## One Task Rule

Cursor does exactly one WorkOrder per start command. After completing the report and committing locally, Cursor stops and waits for Codex Review. The next `gi，上班` starts the next OPEN WorkOrder.

## Safety Rule

Cursor must not push, force push, reset user work, modify protected paths, or create new project direction. Cursor produces a report and stops.
