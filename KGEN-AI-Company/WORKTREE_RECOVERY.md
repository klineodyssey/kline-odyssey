# KGEN Worktree Recovery

**Status:** Active / Minimum Governance
**Version:** V1.0
**Owner:** Codex
**Related Policy:** `KGEN-AI-Company/WORKSPACE_POLICY.md`

## Purpose

This document defines recovery steps when the workspace, worktree, branch, or handoff state is not clean enough for safe review. It prevents Codex, Cursor, and future agents from guessing, overwriting, or force-fixing user work.

## Recovery Principle

When uncertain, stop and preserve state. Do not delete, reset, stash, or force push unless the human explicitly authorizes that exact action.

## Case 1: Handoff Branch Does Not Exist

Symptoms:

- `origin/cursor-handoff/<Task-ID>` cannot be fetched.
- `git ls-remote` does not show the branch.

Recovery:

1. Codex must not review.
2. Codex must not approve.
3. Keep the task in REVIEW or mark it BLOCKED with reason: handoff branch missing.
4. Ask Cursor to push:

```text
git push origin cursor-handoff/<Task-ID>
```

5. Resume only after the branch is visible on origin.

## Case 2: Commit Is Not Visible

Symptoms:

- Cursor reports a commit SHA.
- Codex cannot fetch or inspect that SHA.

Recovery:

1. Do not accept screenshots or chat summaries as review evidence.
2. Ask Cursor to push the handoff branch containing the commit.
3. Verify the remote branch head matches the reported commit SHA.
4. If SHA mismatch remains, block review and request a corrected handoff report.

## Case 3: `origin/main` Has Advanced

Symptoms:

- Codex Review Workspace is behind `origin/main`.
- Handoff branch was based on an older main.

Recovery:

1. Fetch origin.
2. Inspect whether handoff can merge cleanly.
3. If clean, merge in the Codex Review Workspace.
4. If conflict appears, do not guess.
5. Mark task BLOCKED or REJECTED with clear conflict notes and create a FIX task for Cursor.

## Case 4: Dirty Codex Review Workspace

Symptoms:

- Review workspace has uncommitted files before review.

Recovery:

1. Stop review.
2. List dirty files.
3. Determine whether files are from current review work.
4. If unrelated, do not stash or delete automatically.
5. Use a fresh clean review worktree or ask the human for direction.

## Case 5: Dirty Human Main Workspace

Symptoms:

- `C:\Desktop\kline-odyssey` has modified or untracked files.

Recovery:

1. Do not modify the Human Main Workspace.
2. Do not stash.
3. Do not reset.
4. Do not delete.
5. Report the file list.
6. Continue in the Codex Review Workspace.

## Case 6: Merge Conflict

Symptoms:

- Handoff branch cannot merge cleanly into main.

Recovery:

1. Do not force merge.
2. Do not edit protected paths unless explicitly authorized.
3. Record conflict files in `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.
4. Mark the task BLOCKED or REJECTED.
5. Create a FIX WorkOrder with conflict details.

## Case 7: Cursor Pushed Main By Mistake

Symptoms:

- Cursor commit appears directly on `origin/main` without Codex approval.

Recovery:

1. Do not force push or rewrite history automatically.
2. Fetch and inspect the commit.
3. Check protected paths.
4. Create a Codex incident review entry.
5. Ask the human whether to keep, revert, or create a corrective commit.
6. Update policy if needed to prevent repeat mistakes.

## Case 8: Incomplete Handoff

Symptoms:

- Branch exists but report is missing.
- Branch exists but WorkQueue status is not REVIEW.
- Branch exists but commit SHA was not reported.

Recovery:

1. Do not approve.
2. Mark task BLOCKED or request Cursor correction.
3. Ask Cursor to add the missing report/status/metadata on the same handoff branch.
4. Resume after complete handoff data exists.

## Case 9: Report Does Not Exist

Symptoms:

- WorkQueue points to `KGEN-AI-Company/reports/...`.
- The file is missing on the handoff branch.

Recovery:

1. Do not infer report content from diff alone.
2. Reject or block the task.
3. Ask Cursor to create the required report.
4. Review only after the report exists on the handoff branch.

## Protected Path Recovery Rule

If a handoff branch modifies protected paths without explicit authorization:

1. Do not merge.
2. Record the protected path diff.
3. Mark the task REJECTED or BLOCKED.
4. Create a FIX task asking Cursor to remove protected path changes or obtain human authorization.

## Final Rule

Recovery should preserve evidence, avoid destructive operations, and return the task to a reviewable branch state.
