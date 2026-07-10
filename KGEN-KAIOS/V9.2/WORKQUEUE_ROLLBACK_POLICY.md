# WorkQueue Rollback Policy

**Document ID:** KAIOS-V9.2-WORKQUEUE-ROLLBACK  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Rollback from `OPEN` to `APPROVED_FOR_OPEN`.

## 1. Rollback Flow

```text
OPEN -> SYNC_ROLLBACK_PENDING -> APPROVED_FOR_OPEN
```

Rollback is used if an OPEN task was synced incorrectly or a Human pause/reject decision arrives after insertion.

## 2. Required Rollback Record

| Field | Requirement |
|---|---|
| `rollback_id` | Unique rollback ID. |
| `reason` | Why rollback is required. |
| `previous_status` | Normally `OPEN`. |
| `new_status` | Normally `APPROVED_FOR_OPEN`. |
| `affected_workorder` | Formal WorkOrder ID. |
| `reviewer` | Codex or Human. |
| `timestamp` | UTC timestamp. |
| `related_commit` | Commit that inserted or corrected the WorkQueue entry. |

## 3. History Rule

Rollback must not delete history. The original sync result and rollback event both remain in V9.2 reports.

## 4. V9.2 Rollback Dry Run

V9.2 tests rollback as a dry-run event only. It does not rollback the successful `AI-ECONOMY-2026-0001` insertion.
