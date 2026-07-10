# Rollback Runtime

**Runtime ID:** KAIOS-V9.2-RUNTIME-ROLLBACK  
**Status:** Prototype  
**Mode:** Codex-only.

Rollback returns a synced `OPEN` task to `APPROVED_FOR_OPEN` when an insertion error, late conflict or Human decision requires stopping execution.

Rollback records are append-only and do not erase sync history.
