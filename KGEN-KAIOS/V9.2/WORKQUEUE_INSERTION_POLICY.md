# WorkQueue Insertion Policy

**Document ID:** KAIOS-V9.2-WORKQUEUE-INSERTION  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Safe insertion into `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.

## 1. Insertion Rules

Codex sync must:

- Keep existing WorkQueue order.
- Avoid overwriting existing tasks.
- Avoid rewriting the whole file.
- Insert only the new OPEN task block.
- Record `inserted_at`.
- Record `source_decision_id`.
- Record `promotion_review_id`.
- Record `sync_commit_sha`.
- Record `reviewer: Codex`.
- Record `human_pause_allowed: true`.

## 2. Summary Row Rule

If WorkQueue has summary tables, Codex may add one summary row for the synced task. The summary row must not change existing task status.

## 3. Detail Block Rule

Every synced WorkOrder must include a detail block with:

- Status.
- Owner.
- Reviewer.
- Priority.
- Department.
- Branch.
- Dispatch hold.
- Source decision.
- Promotion review.
- Sync report path.
- Input files.
- Output report path.
- Protected paths.
- Acceptance criteria.

## 4. No Auto-Claim Rule

When sync is meant to be visible but not executable yet, the detail block must state:

```text
Dispatch Hold: true
Cursor Auto-Claim: Disabled until Codex explicitly releases hold
```

Codex must place held synced tasks after earlier OPEN tasks so Cursor's first-OPEN policy will not claim it ahead of active queue priorities.
