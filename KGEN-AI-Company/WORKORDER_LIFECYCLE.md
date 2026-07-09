# WorkOrder Lifecycle

## Status Values

| Status | Meaning | Owner |
|---|---|---|
| OPEN | Ready for Cursor to accept | Codex |
| IN_PROGRESS | Cursor accepted and is working | Cursor |
| BLOCKED | Work cannot continue without Codex or human decision | Cursor or Codex |
| REVIEW | Cursor finished report and waits for Codex | Cursor |
| APPROVED | Codex accepted the result | Codex |
| REJECTED | Codex rejected the result and requires correction | Codex |
| DONE | Codex merged, committed, pushed, or closed the task | Codex |

## Lifecycle

OPEN -> IN_PROGRESS -> REVIEW -> APPROVED -> DONE

Alternative paths:

- IN_PROGRESS -> BLOCKED
- REVIEW -> REJECTED -> OPEN
- REVIEW -> BLOCKED

## Rule

Cursor can move OPEN to IN_PROGRESS and IN_PROGRESS to REVIEW or BLOCKED. Codex controls APPROVED, REJECTED, DONE, and reopening.