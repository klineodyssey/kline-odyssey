# Task Claim Protocol

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Task Claim Protocol prevents two workers from taking the same task.

## Claim Flow

```text
Worker reads WorkQueue
-> finds first eligible OPEN task
-> writes CLAIMED state with Worker ID
-> records expected handoff branch
-> starts work
```

## Claim Fields

| Field | Purpose |
|---|---|
| Task ID | WorkOrder identifier |
| Worker ID | Claiming worker |
| Branch | Expected handoff branch |
| Claim Time | When claim began |
| Lease Expiry | When claim becomes stale |
| Status | CLAIMED or IN_PROGRESS |

## Lease Rule

If a worker disappears past lease expiry and no report or heartbeat exists, Codex may mark the task BLOCKED and re-open it or create a recovery task.

## V7.0 Boundary

This file defines the claim protocol only. It does not implement locking.
