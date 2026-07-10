# Codex Release Protocol

**Document ID:** KAIOS-V9.3-CODEX-RELEASE-PROTOCOL  
**Version:** V9.3  
**Status:** Draft for Review  
**Authority:** Codex only

Only Codex may convert an AI-synced WorkOrder from `OPEN + Dispatch Hold: true` to `OPEN + Dispatch Hold: false`.

## 20-Point Release Checklist

Codex must verify all items before release:

1. WorkOrder exists in `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
2. Sync Audit exists.
3. Promotion Decision exists.
4. Dispatch Hold is currently `true`.
5. Risk Level is releasable.
6. Human Review is complete if required.
7. Dependencies are satisfied.
8. Owner is valid.
9. Reviewer is valid.
10. Worker Registry has at least one eligible Worker.
11. Branch Pattern is correct.
12. Report Path is correct.
13. Protected Paths are correct.
14. Acceptance Criteria are executable.
15. Output Path has no conflict.
16. Same asset has no active `IN_PROGRESS` task.
17. No stale handoff branch blocks execution.
18. No `BLOCKED` or `PAUSED` signal exists.
19. Base Commit is not too stale for the task risk.
20. Human Pause is false.

## Release Action

If every check passes, Codex updates the WorkQueue record:

```text
Dispatch Hold: false
Dispatch Status: RELEASED
Claimable: true
Released by: Codex
Released at: <timestamp>
Release review ID: <id>
Release commit SHA: <commit>
```

## Failure Action

If any check fails, Codex keeps `Dispatch Hold: true`, writes a release review report, and classifies the outcome as `RELEASE_REJECTED`, `HUMAN_PAUSED`, `REHOLD_PENDING`, or `BLOCKED`.

