# Codex WorkQueue Sync Protocol

**Document ID:** KAIOS-V9.2-CODEX-WORKQUEUE-SYNC  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Codex-only sync from approved draft to official WorkQueue.

## 1. Authority

Only Codex may write an `APPROVED_FOR_OPEN` AI draft into:

`KGEN-Organization/WorkOrders/WORK_QUEUE.md`

AI, Cursor and other workers may not sync, insert, reorder or claim approved drafts.

## 2. Mandatory 17-Point Sync Checklist

Codex must confirm all items before sync:

| # | Check | Required Result |
|---|---|---|
| 1 | Promotion Decision exists | V9.1 promotion JSON is present and parseable. |
| 2 | Review Report exists | V9.1 review report is present. |
| 3 | Audit Log exists | V9.1 audit record is present. |
| 4 | Risk Level acceptable | R0-R2 may sync; R3 needs Human Review; R4 forbidden. |
| 5 | Human Review need | If required, Human record must exist before sync. |
| 6 | WorkOrder ID unique | Formal ID does not exist in WorkQueue. |
| 7 | Branch Pattern unique | No active task uses the same branch. |
| 8 | Report Path unique | No active task uses the same report path. |
| 9 | Output Path conflict | Expected outputs do not overwrite existing tasks. |
| 10 | Dependencies exist | All required dependency paths exist or are explicitly non-file references. |
| 11 | Dependencies complete | Required prior tasks or reports are complete. |
| 12 | Protected Paths correct | Task does not request protected path modification. |
| 13 | Owner / Reviewer valid | Owner and reviewer are valid KAIOS roles. |
| 14 | Priority valid | Priority uses P0-P4. |
| 15 | Acceptance Criteria complete | Criteria are concrete and reviewable. |
| 16 | Source Decision traceable | AI source decision is traceable. |
| 17 | Existing same task | WorkQueue has no unresolved equivalent task. |

## 3. Sync Sequence

1. Set state to `SYNC_PENDING`.
2. Set state to `SYNC_VALIDATING`.
3. Run 17-point checklist.
4. Run conflict detection.
5. Allocate formal WorkOrder ID.
6. Prepare WorkQueue insertion block.
7. Record sync audit.
8. Insert the OPEN task.
9. Set sync state to `OPEN`.

## 4. Execution Hold

V9.2 sync does not dispatch work. A synced WorkOrder may include:

```text
Dispatch Hold: true
Cursor auto-claim: disabled until Codex releases hold
```

This preserves the formal OPEN state while preventing immediate Cursor claim.
