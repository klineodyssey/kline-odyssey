# Sync Audit Standard

**Document ID:** KAIOS-V9.2-SYNC-AUDIT  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Required audit trail for WorkQueue sync.

## 1. Required Fields

| Field | Requirement |
|---|---|
| `sync_audit_id` | Unique sync audit ID. |
| `timestamp` | UTC timestamp. |
| `actor` | Codex or Human. |
| `source_draft_id` | Original draft ID. |
| `formal_workorder_id` | Allocated WorkOrder ID. |
| `previous_status` | Previous status. |
| `new_status` | New status. |
| `promotion_decision` | Path to V9.1 promotion decision. |
| `sync_result` | Path to V9.2 sync result. |
| `workqueue_path` | WorkQueue path. |
| `sync_commit_sha` | Commit that inserted the OPEN item. |
| `reason` | Human-readable reason. |
| `reviewer` | Codex or Human. |

## 2. Audit Rules

- Every sync attempt must be recorded.
- Conflict, pause and rollback events are audit events.
- History is never deleted.
- Rollback returns status to `APPROVED_FOR_OPEN`, but does not erase the prior `OPEN` record from reports.

## 3. V9.2 Audit Location

Primary sync audit report:

`KGEN-KAIOS/V9.2/reports/V9_2_SYNC_AUDIT_LOG.md`
