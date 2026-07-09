# Review Pipeline

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Review Pipeline is the Codex-controlled path from worker output to main.

## Pipeline

```text
Worker
-> Handoff Branch
-> Report
-> Codex Review
-> APPROVED / REJECTED / BLOCKED
-> Merge
-> Push
-> Dashboard Update
```

## Required Review Checks

- Handoff branch exists.
- Report exists.
- Commit SHA matches branch head.
- Base commit is fresh or stale branch is explicitly handled.
- Protected path diff is safe.
- Canon is not violated.
- Merge is clean.
- WorkQueue status is updated.
- Review log is updated.

## Reviewer Authority

Codex is the default CEO reviewer and merge authority. Other reviewers may advise, but they do not push main unless explicitly granted permission.
