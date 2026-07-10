# Approved Draft Sync Runtime

**Runtime ID:** KAIOS-V9.2-RUNTIME-APPROVED-DRAFT-SYNC  
**Status:** Prototype  
**Mode:** Codex-only.

This runtime moves a V9.1 `APPROVED_FOR_OPEN` draft into the V9.2 sync state machine. It does not execute the task and does not allow Cursor to claim automatically.

## Inputs

- V9.1 promotion decision.
- V9.1 review report.
- V9.1 audit log.
- Candidate WorkOrder ID.

## Output

- Sync request.
- Sync validation.
- Sync result.
- Sync audit event.
