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
| Workforce credential | Worker is registered, active, trusted enough for task risk, and not suspended |
| Branch authority | Branch matches the worker's allowed branch pattern and does not bundle unrelated tasks |
| Worker Boot SOP evidence | Report includes BOOT, MUST READ, PROTECTED PATH CHECK, TASK PLAN, EXECUTION, and FINAL REPORT sections |

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
11. Worker is present in `KGEN-KAIOS/worker_registry.json` with valid `employee_status`, `trust_level`, reviewer, branch pattern, and boot acknowledgments.
12. Worker has no active suspension, revocation, or blocking violation.
13. Worker report follows `KGEN-KAIOS/workforce/WORKER_EXECUTION_REPORT_TEMPLATE.md` or contains equivalent visible SOP evidence.

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
- worker is missing from the registry or is `PENDING_REGISTRATION`, `SUSPENDED`, `REVOKED`, or `ARCHIVED`
- worker branch does not match `allowed_branch_pattern`
- handoff mixes multiple WorkOrders without explicit Codex authorization
- worker pushes main or force pushes
- worker omits required Boot SOP evidence and the missing evidence affects authorization, protected paths, provenance, WorkQueue state, or merge safety

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
- Worker credential result
- Trust level result
