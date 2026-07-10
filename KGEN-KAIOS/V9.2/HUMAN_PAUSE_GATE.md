# Human Pause Gate

**Document ID:** KAIOS-V9.2-HUMAN-PAUSE-GATE  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Human / Codex  
**Scope:** Human pause, reject, archive and priority change before execution.

## 1. Human Actions

Human may apply the following to an approved draft or synced OPEN WorkOrder before execution:

- `PAUSE`
- `REJECT`
- `CHANGE_PRIORITY`
- `ARCHIVE`

## 2. Required Human Decision Fields

| Field | Requirement |
|---|---|
| `human_decision_id` | Unique decision ID. |
| `reviewer` | Human reviewer or role. |
| `reason` | Explanation. |
| `timestamp` | UTC timestamp. |
| `previous_status` | Previous sync or WorkQueue status. |
| `new_status` | New status. |
| `related_workorder` | Formal WorkOrder ID or source draft ID. |

## 3. Pause Rule

`HUMAN_PAUSED` blocks synchronization or execution until Human or Codex records a later decision. Cursor must not claim a paused task.

## 4. Priority Change Rule

Human may change priority, but Codex must record the change in sync audit before updating WorkQueue.
