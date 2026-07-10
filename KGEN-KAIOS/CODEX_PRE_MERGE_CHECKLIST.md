# Codex Pre-Merge Checklist

**Version:** V7.1 Minimal Worker Layer
**Status:** Active / Draft for Review

## Purpose

This checklist defines the minimum evidence Codex must review before merging any worker handoff branch into `origin/main`.

## Checklist

| Check | Required Result |
|---|---|
| Diff | Review full diff against latest `origin/main` |
| Report | Required report exists and names task, worker, branch, base commit, head commit |
| Protected paths | No unauthorized protected path changes |
| Canon | No conflict with Boot, Runtime CURRENT, Machine Canon, Genesis, or Organization Canon |
| JSON validity | Any changed JSON parses successfully |
| PDF / DOCX safety | Existing PDF/DOCX files are not corrupted, deleted, or replaced without scope |
| Pages deploy | Public Pages paths are not broken by doc or site changes |
| WorkQueue status | Task state is valid and moved according to lifecycle |
| Review Log | Decision is recorded in `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` |
| Provenance | Source, author, reviewer, branch, commit, task ID, report path, and changed files are traceable |
| R&D suggestions | Suggested WorkOrders remain `PROPOSED` until Codex promotes them |
| Formal file metadata | Changed formal organs include required version metadata or an explicit follow-up risk |

## Approve Conditions

Codex may approve only when:

1. Handoff branch exists.
2. Branch head matches reported commit SHA.
3. Report exists.
4. Protected path check passes.
5. Stale branch policy passes.
6. WorkQueue state is correct.
7. Merge is clean.
8. Author is registered in `KGEN-KAIOS/provenance/AUTHOR_REGISTRY.json`.
9. Changed files match the reported `changed_files`.
10. Formal organism or runtime changes satisfy versioning and taxonomy gates when applicable.

## Reject / Block Conditions

Codex rejects or blocks when:

- branch is missing
- commit is invisible
- report is missing
- branch is stale and unsafe
- protected paths changed without authorization
- Canon conflict is present
- JSON is invalid
- required PDF/DOCX artifact is damaged
- WorkQueue state is inconsistent
- provenance is incomplete
- a worker promotes its own suggestion past `PROPOSED`
- a formal organism has no canonical file or runtime entry

## Output

Every review must produce or update a review log entry with:

- Task ID
- Worker ID
- Branch
- Commit SHA
- Report Path
- Decision
- Protected path result
- Notes
