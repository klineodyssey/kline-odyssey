# KGEN Office Desk Standard

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-07-12  
**Task ID:** KGEN-WORKFORCE-ROSTER-2026-0001

## Purpose

An office desk is a logical workspace, worktree, branch namespace, permission boundary and tool seat. It is not a claim that every AI has a physical computer.

## Desk Rules

- Human Main is reserved for Human work. AI must not build, commit, merge, reset, stash, push or delete files there by default.
- Codex Review uses a clean review worktree and may merge/push main only after review gates pass.
- Cursor Worker uses an independent worker workspace and may push only `cursor-handoff/<Task-ID>`.
- Other agents use `<agent>-handoff/<Task-ID>` after registration and sandbox trial.
- One task has one primary owner. Other workers may advise or review, not concurrently edit the same task.

## Required Desk Fields

`desk_id`, `worker_id`, `workspace_type`, `workspace_path`, `base_branch`, `handoff_namespace`, `allowed_paths`, `protected_paths`, `available_tools`, `restricted_tools`, `current_task`, `claim_expires_at`, `health_status`, `last_clean_check`, `last_sync_commit`.

## Machine-Readable Source

See `KGEN-KAIOS/workforce/office_desks.json`.
