# Dispatch Audit Standard

**Document ID:** KAIOS-V9.3-DISPATCH-AUDIT  
**Version:** V9.3  
**Status:** Draft for Review

Every Dispatch Hold release, rejection, pause, re-hold, and rollback must leave a durable audit record.

## Audit Fields

| Field | Meaning |
|---|---|
| `audit_id` | Unique audit event ID |
| `workorder_id` | Related WorkOrder |
| `previous_dispatch_state` | State before event |
| `new_dispatch_state` | State after event |
| `dispatch_hold_before` | Previous hold value |
| `dispatch_hold_after` | New hold value |
| `actor` | Codex or Human |
| `reason` | Human-readable explanation |
| `timestamp` | UTC timestamp |
| `related_report` | Release, reject, pause, re-hold or rollback report |
| `commit_sha` | Commit that recorded the event, when available |

## Live Audit Path

V9.3 live audit entries are stored in:

`KGEN-KAIOS/V9.3/reports/V9_3_DISPATCH_AUDIT_LOG.md`

