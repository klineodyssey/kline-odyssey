# Stale Handoff Branch Policy

**Version:** V7.1 Minimal Worker Layer
**Status:** Active / Draft for Review

## Purpose

This policy prevents Codex from merging stale, incomplete, or invisible worker output. It applies to all worker handoff branches.

## Cases

| Case | Required Codex Decision |
|---|---|
| Branch does not exist | Do not review. Mark task BLOCKED and ask worker to push branch. |
| Commit is not visible | Do not review. Ask worker to push branch or correct SHA. |
| Report does not exist | Do not approve. Ask worker to add required report. |
| Base commit is too old | Do not merge until rebase, reissue, or explicit Codex decision. |
| Main has advanced | Compare diff against latest `origin/main`; reject if stale branch removes newer files. |
| Worker disappeared | Check lease and heartbeat; mark BLOCKED or reassign. |
| Handoff timed out | Expire lease, mark BLOCKED, create recovery or FIX task. |

## Stale Branch Signal

A handoff branch is stale when any of these are true:

- branch base commit is older than current `origin/main`
- branch diff deletes files added after its base commit
- branch does not include current policy files required by WorkQueue
- branch report references a base commit that is no longer current
- branch has no recent heartbeat or report update

## Merge Rule

Codex must not merge a stale handoff branch until one of these happens:

1. Worker rebases or reissues the branch on current main.
2. Codex confirms the stale diff is harmless and records the reason.
3. Human explicitly authorizes a scoped exception.

## Recovery Output

A stale branch review must record:

- Task ID
- Branch
- Worker ID
- Report Path
- Current `origin/main` SHA
- Branch head SHA
- Stale reason
- Required fix