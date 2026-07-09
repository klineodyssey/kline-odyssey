# KGEN Worktree Setup

**Status:** Active / Minimum Governance
**Version:** V1.0
**Owner:** Codex
**Related Policy:** `KGEN-AI-Company/WORKSPACE_POLICY.md`

## Purpose

This guide defines the minimum workspace layout for safe KGEN AI collaboration. It keeps human work, Cursor execution, and Codex review separate.

## Required Workspaces

### 1. Human Main Workspace

Suggested path:

```text
C:\Desktop\kline-odyssey
```

Purpose:

- Human daily work
- local notes
- drafts
- uncommitted files

Rules:

- AI agents may inspect status if needed.
- AI agents must not modify, stash, reset, delete, commit, merge, or push from this workspace by default.

### 2. Cursor Worker Workspace

Suggested pattern:

```text
<cursor-local-checkout-or-worktree>
```

Purpose:

- Cursor executes one WorkOrder at a time.
- Cursor writes the required report.
- Cursor commits task results.
- Cursor pushes only a handoff branch.

Required branch pattern:

```text
cursor-handoff/<Task-ID>
```

Cursor must not push `main`.

### 3. Codex Review Workspace

Suggested path:

```text
C:\Desktop\kline-odyssey-codex-review
```

Purpose:

- clean review
- fetch handoff branches
- inspect diff
- check reports
- check protected paths
- merge approved handoff work
- push `origin/main`

Rules:

- Must be clean before review.
- Must not contain human draft files.
- Must not be used for unrelated experiments.

## Setup Model

The exact local command can vary by machine, but the target layout is:

```text
C:\Desktop\kline-odyssey                 Human Main Workspace
C:\Desktop\kline-odyssey-codex-review   Codex Review Workspace
<cursor workspace>                        Cursor Worker Workspace
```

## Codex Review Preparation Checklist

Before reviewing a Cursor task, Codex should confirm:

- The review workspace is clean.
- `origin/main` is fetched.
- `origin/cursor-handoff/<Task-ID>` is fetched.
- The reported commit SHA matches the remote branch head.
- The report file exists.
- Protected path diff is empty unless explicitly authorized.

## Cursor Submission Checklist

Before stopping, Cursor must confirm:

- The task branch is named `cursor-handoff/<Task-ID>`.
- The task report exists under `KGEN-AI-Company/reports/`.
- The task status is moved to REVIEW.
- The commit exists locally.
- The handoff branch is pushed to origin.
- Cursor reports Task ID, Branch, Commit SHA, and Report Path.

## Main Push Rule

Only Codex pushes approved work to `origin/main`. Cursor and other worker agents submit branches only.
