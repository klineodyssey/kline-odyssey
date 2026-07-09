# WorkOrder Lifecycle

## Status Values

| Status | Meaning | Owner |
|---|---|---|
| OPEN | Ready for Cursor to accept | Codex |
| IN_PROGRESS | Cursor accepted and is working on `cursor-handoff/<Task-ID>` | Cursor |
| BLOCKED | Work cannot continue without Codex or human decision | Cursor or Codex |
| REVIEW | Cursor pushed `cursor-handoff/<Task-ID>` and waits for Codex | Cursor |
| APPROVED | Codex accepted the handoff branch | Codex |
| REJECTED | Codex rejected the handoff branch and requires correction | Codex |
| DONE | Codex merged to main and pushed origin/main | Codex |

## Normal Lifecycle

OPEN -> IN_PROGRESS -> REVIEW -> APPROVED -> DONE

## Handoff Branch Lifecycle

1. OPEN: Cursor sees the task.
2. IN_PROGRESS: Cursor creates or reuses `cursor-handoff/<Task-ID>`.
3. REVIEW: Cursor commits and pushes `origin cursor-handoff/<Task-ID>`.
4. APPROVED: Codex reviews diff, report, protected paths, and Canon.
5. DONE: Codex merges to main and pushes `origin main`.

## Rejection Lifecycle

REVIEW -> REJECTED -> FIX-001 OPEN

If rejected, Codex creates a FIX task and states exactly what Cursor must repair. Cursor does not rewrite history or force push.
