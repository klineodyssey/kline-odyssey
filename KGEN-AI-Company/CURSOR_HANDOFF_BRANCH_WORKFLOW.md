# Cursor Handoff Branch Workflow V5.0

**Status:** Active / Draft for Review  
**Manager:** Codex  
**Worker:** Cursor  
**Branch Pattern:** `cursor-handoff/<Task-ID>`

## Problem Solved

Cursor local commits are invisible to Codex. V5.0 requires Cursor to push each completed WorkOrder to a task-specific handoff branch so Codex can fetch, inspect, review, merge, and push main safely.

## Cursor Completion Rule

For each WorkOrder, Cursor must:

1. Start from latest `origin/main`.
2. Create or reuse `cursor-handoff/<Task-ID>`.
3. Make the task changes and report.
4. Commit locally.
5. Push to `origin cursor-handoff/<Task-ID>`.
6. Report Task ID, Branch, Commit SHA, and Report Path.
7. Stop and wait for Codex Review.

Cursor must not push `main`. Cursor must not force push. Cursor must not modify protected paths.

## Codex Review Rule

Codex must:

1. Run `git fetch origin --prune`.
2. Check out or inspect `origin/cursor-handoff/<Task-ID>`.
3. Review diff against `origin/main`.
4. Read the Cursor report.
5. Check protected paths and Canon alignment.
6. If approved, merge to main and push `origin main`.
7. If rejected, write the rejection in `CODEX_REVIEW_LOG.md`, mark the task REJECTED, and create a FIX task for Cursor.

## Branch Names

Examples:

- `cursor-handoff/ORG-P2-002`
- `cursor-handoff/FIX-001`

## Protected Paths

Contracts, 12345 temple runtime, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, and KGEN Token contract remain protected unless the human explicitly authorizes a scoped exception.
