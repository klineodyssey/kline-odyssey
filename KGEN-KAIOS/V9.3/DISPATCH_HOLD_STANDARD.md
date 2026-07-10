# Dispatch Hold Standard

**Document ID:** KAIOS-V9.3-DISPATCH-HOLD-STANDARD  
**Version:** V9.3  
**Status:** Draft for Review  
**Level:** L4 Runtime Governance

Dispatch Hold is a safety lock on a WorkOrder that is already visible in the live WorkQueue. It prevents Worker auto-claim until Codex confirms that the synced task is still safe, current, non-duplicative, dependency-complete, and eligible for the intended Worker class.

## Formal Meaning

| State | Meaning |
|---|---|
| `OPEN` + `Dispatch Hold: true` | The WorkOrder exists, but no Worker may claim it. |
| `OPEN` + `Dispatch Hold: false` | The WorkOrder is visible and released for the normal claim protocol. |
| `dispatch_status: RELEASED` | Codex has passed the release gates. |
| `claimable: true` | A valid Worker may claim through the handoff branch workflow. |

## Non-Goals

- Dispatch Hold release does not mean the task is complete.
- Dispatch Hold release does not authorize main branch push by Cursor.
- Dispatch Hold release does not allow protected-path edits unless a later WorkOrder explicitly permits them and Codex approves.
- Dispatch Hold release does not authorize token transfer, financial service, contract deployment, legal commitment, or production governance action.

## Required Metadata

Released tasks must record:

- `released_by: Codex`
- `released_at`
- `release_review_id`
- `release_commit_sha`
- `dispatch_status`
- `claimable`
- `recommended_worker`
- `human_pause_allowed`

