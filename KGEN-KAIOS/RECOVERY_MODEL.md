# Recovery Model

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

KAIOS must recover when any worker, branch, report, or review state fails.

## Recovery Cases

| Failure | Recovery Direction |
|---|---|
| Worker disappears | Check heartbeat, expire lease, mark task BLOCKED, re-open or assign FIX |
| Branch missing | Do not review; require worker to push handoff branch |
| Commit invisible | Do not review; require branch push or corrected commit SHA |
| Stale branch | Rebase or reissue handoff before review |
| Report missing | Reject or block until report exists |
| Protected path changed | Reject unless explicit human authorization exists |
| Merge conflict | Block and create FIX task with conflict notes |
| Wrong push to main | Incident review; do not force rewrite without human decision |
| Dashboard stale | Rebuild from WorkQueue, reports, branches, and review log |

## Recovery Principle

Preserve evidence first. Do not force push, reset, delete, or hide state.

## Relationship To Existing Recovery

`KGEN-AI-Company/WORKTREE_RECOVERY.md` remains the current operational recovery guide. KAIOS generalizes it for multi-worker operation.
