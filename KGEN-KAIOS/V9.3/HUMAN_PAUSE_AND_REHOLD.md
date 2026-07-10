# Human Pause and Re-Hold

**Document ID:** KAIOS-V9.3-HUMAN-PAUSE-REHOLD  
**Version:** V9.3  
**Status:** Draft for Review

Human operators retain final authority over release timing and priority.

## Human Actions

| Action | Result |
|---|---|
| `PAUSE` | Hold remains true or released task becomes paused. |
| `REHOLD` | Released task returns to `OPEN + HOLD`. |
| `CHANGE_PRIORITY` | Priority changes; audit required. |
| `REASSIGN` | Worker recommendation changes; eligibility must rerun. |
| `REJECT` | Task exits release path. |
| `ARCHIVE` | Task is preserved but no longer claimable. |

## Required Human Decision Fields

- `human_decision_id`
- `reviewer`
- `timestamp`
- `reason`
- `previous_dispatch_state`
- `new_dispatch_state`
- `related_workorder_id`

V9.3 dry run includes a Human Pause test and a Re-Hold test. The live `AI-ECONOMY-2026-0001` release has `Human Pause: false` at release time and keeps `Human Pause Allowed: true` after release.

