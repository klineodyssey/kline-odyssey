# Worker Eligibility Protocol

**Document ID:** KAIOS-V9.3-WORKER-ELIGIBILITY  
**Version:** V9.3  
**Status:** Draft for Review

Worker eligibility determines whether a released WorkOrder can be claimed by a registered Worker. It does not automatically assign the Worker.

## Required Checks

| Check | Required Result |
|---|---|
| `worker_id` registered | true |
| `status` | `ACTIVE` preferred; `IDLE` may be recommended but must heartbeat before claim |
| `workspace` defined | true |
| `allowed_branch_pattern` | matches handoff branch policy |
| `can_push_main` | false for Cursor and other Workers |
| Active claim | none |
| Role/domain match | Worker permission covers task domain |
| Risk permission | Worker permission supports risk level |
| Suspended | false |
| Heartbeat | recent before claim |

## V9.3 Cursor Result

`cursor-01` exists, has `can_push_main: false`, and uses `cursor-handoff/<Task-ID>`. Its registry status is `IDLE`, so V9.3 may recommend Cursor, but Cursor must still perform a fresh pull and claim workflow before starting.

