# Cursor Handoff Branch Workflow V5.0

**Status:** Active / Draft for Review  
**Manager:** Codex  
**Worker:** Cursor  
**Branch Pattern:** `cursor-handoff/<Task-ID>` (sole executable namespace)

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

## Dispatch Branch Normalization

The dispatcher normalizes branch input before a claim or Git branch exists:

| Requested input | Effective branch |
|---|---|
| `cursor-handoff/<Task-ID>` | `cursor-handoff/<Task-ID>` |
| `cursor/<feature-name>` | `cursor-handoff/<Task-ID>` |
| anything else | `BRANCH_POLICY_MISMATCH` |

`cursor/<feature-name>` is an input alias only. Cursor must never create, commit, push, review, recover, or close out that alias. The Task ID is authoritative, so normalization is deterministic and does not derive identity from the feature slug.

## Codex Review Rule

Codex must:

1. Run `git fetch origin --prune`.
2. Check out or inspect `origin/cursor-handoff/<Task-ID>`.
3. Review diff against `origin/main`.
4. Read the Cursor report.
5. Check protected paths and Canon alignment.
6. If approved, merge to main and push `origin main`.
7. If rejected, write the rejection in `CODEX_REVIEW_LOG.md`, mark the task REJECTED, and create a FIX task for Cursor.

## Completion, Closeout, And Recovery

- Cursor completion means a report, commit, pushed canonical handoff branch, and `PENDING_CODEX_REVIEW`; it does not mean approval or Canonical status.
- Codex alone records review outcome, merge eligibility, closeout, and any promotion from candidate status.
- Recovery keeps the same Task ID and claim lineage and resumes only `cursor-handoff/<Task-ID>`.
- Cursor never merges, deploys, pushes main, or closes its own task.

## Branch Names

Examples:

- `cursor-handoff/ORG-P2-002`
- `cursor-handoff/FIX-001`

## Protected Paths

Contracts, 12345 temple runtime, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, and KGEN Token contract remain protected unless the human explicitly authorizes a scoped exception.
