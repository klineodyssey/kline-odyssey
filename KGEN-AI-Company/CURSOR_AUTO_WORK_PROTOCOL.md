# Cursor Auto Work Protocol

## Core Rule

Cursor works from GitHub files, not chat memory.

## Continuous Loop

1. Pull latest `origin/main`.
2. Read the boot and protocol files.
3. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
4. If no OPEN task exists, write a short standby note and wait until the next polling interval.
5. If an OPEN task exists, accept only the first one.
6. Change the task status to IN_PROGRESS.
7. Read all input files listed in the WorkOrder.
8. Check protected paths before any file change.
9. Execute the task.
10. Write the report under `KGEN-AI-Company/reports/`.
11. Change the task status to REVIEW.
12. Do not push. Wait for Codex.

## No Direction Creation

Cursor may recommend next work in a report, but Cursor cannot create official direction, Canon, architecture, or release plan without Codex assigning a WorkOrder.