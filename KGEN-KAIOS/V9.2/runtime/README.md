# KAIOS V9.2 Runtime Modules

These runtime documents define the Codex-only sync layer between V9.1 approved drafts and the official KGEN WorkQueue.

| Runtime | Purpose |
|---|---|
| Approved Draft Sync Runtime | Coordinates sync state transitions. |
| ID Allocation Runtime | Allocates formal `AI-<DOMAIN>-<YEAR>-<SEQUENCE>` IDs. |
| Validation Runtime | Runs the 17-point Codex sync checklist. |
| Conflict Detection Runtime | Blocks duplicate WorkQueue insertions. |
| Insertion Runtime | Inserts an OPEN task without rewriting the queue. |
| Rollback Runtime | Returns OPEN to APPROVED_FOR_OPEN when needed. |
| Human Pause Runtime | Applies Human pause, reject, archive or priority change. |
| Sync Audit Runtime | Records all sync events. |
