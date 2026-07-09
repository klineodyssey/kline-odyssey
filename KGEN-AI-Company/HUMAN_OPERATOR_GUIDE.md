# Human Operator Guide

## Main Rule

The human operator does not need to manage Git worktrees, branches, merges, or recovery steps. Cursor and Codex follow the workspace policy automatically.

The human only needs to:

1. Paste `gi，上班` in Cursor.
2. Paste Cursor's report back to Codex.
3. Paste Codex's review result back to Cursor if needed.
4. Let Codex and Cursor handle branch, review, merge, and recovery under policy.

## Cursor Start Command

Paste this in Cursor:

```text
gi，上班
```

Cursor must not ask what to do today. Cursor reads WorkQueue, executes the first OPEN task, pushes `cursor-handoff/<Task-ID>`, reports the branch and commit, and stops.

## Codex Review Command

Paste this in Codex after Cursor reports a handoff branch:

```text
Codex，Review Cursor 最新 REVIEW 任務，核准則 push，拒絕則退回修正。
```

## User Flow

1. Paste `gi，上班` in Cursor.
2. Cursor completes one WorkOrder.
3. Cursor pushes `cursor-handoff/<Task-ID>`.
4. Cursor reports Task ID, Branch, Commit SHA, and Report Path.
5. Paste Cursor output to Codex.
6. Codex uses a clean review workspace to fetch the handoff branch, review, merge/push main if approved, or reject and create a FIX task.
7. Paste Codex result back to Cursor only if Cursor needs the next instruction.
8. Repeat until the WorkQueue has no OPEN tasks.

## Workspace Policy

KGEN uses the minimum safe workspace model:

| Workspace | Suggested Path | Purpose |
|---|---|---|
| Human Main Workspace | `C:\Desktop\kline-odyssey` | Human daily work; AI does not modify by default |
| Cursor Worker Workspace | Cursor local checkout or worker worktree | Cursor executes WorkOrders and pushes handoff branches |
| Codex Review Workspace | `C:\Desktop\kline-odyssey-codex-review` | Codex clean review, merge, and push |

The human does not need to create or repair these during normal operation. If a workspace is dirty or a handoff branch is missing, Codex reports the issue and follows `WORKTREE_RECOVERY.md`.

## Human Main Protection

If the Human Main Workspace has uncommitted files, Codex and Cursor must not auto-stash, reset, delete, or commit them. They list the files and continue from the Codex Review Workspace.

## Main Paths

- Workspace policy: `KGEN-AI-Company/WORKSPACE_POLICY.md`
- Worktree setup: `KGEN-AI-Company/WORKTREE_SETUP.md`
- Worktree recovery: `KGEN-AI-Company/WORKTREE_RECOVERY.md`
- WorkQueue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- Cursor handoff branch: `cursor-handoff/<Task-ID>`
- Cursor reports: `KGEN-AI-Company/reports/`
- Codex review log: `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`
