# KGEN Workspace Policy

**Status:** Active / Minimum Governance
**Version:** V1.0
**Owner:** Codex
**Scope:** Human main workspace isolation, Cursor handoff branch, Codex clean review worktree.

## Purpose

This policy prevents AI review and execution work from polluting the human main working tree. KGEN uses three separated workspaces for the minimum safe governance model:

1. Human Main Workspace
2. Cursor Worker Workspace
3. Codex Review Workspace

The policy is intentionally small. It does not create a new organization layer. It only defines where each actor works and how handoff branches are reviewed.

## Workspace Roles

| Workspace | Suggested Path | Owner | Purpose |
|---|---|---|---|
| Human Main Workspace | `C:\Desktop\kline-odyssey` | Human | Human daily work, local drafts, uncommitted files |
| Cursor Worker Workspace | Cursor local checkout or worker worktree | Cursor | Execute one WorkOrder at a time and push a handoff branch |
| Codex Review Workspace | `C:\Desktop\kline-odyssey-codex-review` | Codex | Clean review, merge, and push to `origin/main` |

## Human Main Workspace Rules

The Human Main Workspace is the user's workspace. AI agents must treat it as read-only by default.

AI agents must not perform these actions in the Human Main Workspace unless the user explicitly asks for that exact operation:

- construction work
- commit
- merge
- reset
- stash
- push
- delete files
- rewrite branches
- overwrite uncommitted files

If the Human Main Workspace has uncommitted files, agents must not auto-clean them. The correct behavior is to list the files and continue from the Codex Review Workspace.

## Cursor Worker Workspace Rules

Cursor executes WorkOrders from `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.

Cursor must use the branch pattern:

```text
cursor-handoff/<Task-ID>
```

Cursor may commit and push only the handoff branch. Cursor must not push `main`.

Cursor must report:

- Task ID
- Branch
- Commit SHA
- Report Path

Cursor must stop after completing one WorkOrder and wait for Codex review.

## Codex Review Workspace Rules

Codex reviews from a clean review workspace, suggested path:

```text
C:\Desktop\kline-odyssey-codex-review
```

The Codex Review Workspace must be clean before review. Codex may fetch `origin/main` and `origin/cursor-handoff/<Task-ID>`, inspect the diff, read the report, check protected paths, and merge only if approved.

Codex is the only actor allowed to push approved work to `origin/main`.

## Dirty Human Main Handling

If `C:\Desktop\kline-odyssey` has uncommitted files:

1. Do not stash.
2. Do not reset.
3. Do not delete files.
4. Do not commit user files.
5. List the dirty files for the human.
6. Continue work in the Codex Review Workspace.

## Missing Handoff Branch Handling

If Cursor says a task is complete but `cursor-handoff/<Task-ID>` is not visible on origin:

1. Codex must not review the task.
2. Codex must not approve the task.
3. Mark the task as BLOCKED or keep it awaiting handoff.
4. Ask Cursor to push `cursor-handoff/<Task-ID>`.
5. Resume review only after the branch and commit SHA are visible from origin.

## Protected Paths

This policy does not authorize changes to protected paths:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

## Final Rule

Human Main is for the human. Cursor handoff branches are for work submission. Codex Review Workspace is for review, merge, and push.
