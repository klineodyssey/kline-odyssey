# Cursor Script: Check WorkQueue

Every 10 minutes, Cursor checks:

`KGEN-Organization/WorkOrders/WORK_QUEUE.md`

If there is an OPEN task and Cursor is not already working, accept the first OPEN task. If all tasks are REVIEW, BLOCKED, APPROVED, or DONE, write a standby note and wait.