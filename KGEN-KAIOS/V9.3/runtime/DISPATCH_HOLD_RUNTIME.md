# Dispatch Hold Runtime

**Runtime ID:** KAIOS-V9.3-RUNTIME-DISPATCH-HOLD  
**Purpose:** Determine whether a WorkOrder is locked, released, claimable, paused, or re-held.

## Inputs

- Live WorkQueue row.
- WorkQueue detail block.
- Dispatch release result.
- Human pause or re-hold events.

## Output

The runtime outputs one dispatch state:

- `OPEN + HOLD`
- `RELEASE_REVIEW`
- `RELEASE_VALIDATING`
- `RELEASE_READY`
- `OPEN + RELEASED`
- `CLAIMABLE`
- `CLAIMED`
- `IN_PROGRESS`
- `RELEASE_REJECTED`
- `HUMAN_PAUSED`
- `REHOLD_PENDING`
- `RELEASE_ROLLBACK`

It never edits WorkQueue directly. Codex records the state change.

