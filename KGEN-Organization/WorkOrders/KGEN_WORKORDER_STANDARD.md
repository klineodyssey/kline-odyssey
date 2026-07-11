# KGEN WorkOrder Standard

**Document ID:** KGEN-WORKORDER-STANDARD-V2.0  
**Status:** Draft for Review  
**Level:** L5 Implementation  
**Maintainer:** KGEN WorkOrders Office / Codex  
**GitHub Path:** `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`

## 1. Purpose

This standard defines how Codex assigns work, how Cursor accepts work, how Cursor submits results, and how Codex reviews and publishes work.

## 2. Codex Assignment

Codex checks origin/main, protected paths, active Canon, current WorkQueue, and dependency impact. Codex then writes a scoped WorkOrder with target files, allowed actions, forbidden actions, output report, and acceptance criteria.

Every WorkOrder must have a traceable source. Codex must not create a source-less WorkOrder. Required provenance fields:

- `task_id`
- `task_source_type`
- `task_source_id`
- `task_source_actor`
- `task_source_file`
- `task_source_commit`
- `task_source_reason`
- `created_by`
- `created_at`
- `owner`
- `reviewer`
- `priority`
- `risk_level`
- `dependencies`
- `status`

Allowed `task_source_type` values are `HUMAN_REQUEST`, `AI_RECOMMENDATION`, `CURSOR_REPORT`, `CODEX_REVIEW`, `QA_FINDING`, `RUNTIME_ALERT`, `CANON_GAP`, `ROADMAP`, `SECURITY_FINDING`, and `LEGAL_FINDING`.

## 3. Cursor Acceptance

Cursor reads the Cursor Agent Prompt, WorkQueue, Daily Workflow, DO_NOT_TOUCH, Canon Master JSON, Master Library Index, and assigned WorkOrder. Cursor accepts only one OPEN task at a time.

Before acceptance, Cursor must pass the formal worker gate in `KGEN-KAIOS/worker_registry.json`. If Cursor cannot verify `worker_id`, `employee_status`, `trust_level`, acknowledgments, branch pattern, and reviewer, Cursor must output `REGISTRATION_REQUIRED` and stop.

## 4. Cursor Execution

Cursor states purpose before modifying files, performs only allowed changes, runs checks, produces a report, and moves the task to REVIEW.

## 5. Cursor Delivery

Delivery includes files read, files modified, checks run, risks, blockers, recommendation, and whether Codex or human review is required.

Cursor reports must also include `Problems Found`, `Technical Debt`, `Evolution Opportunities`, `Research Direction`, `Suggested WorkOrders`, and `Do Not Do`. Cursor may propose future work, but every Suggested WorkOrder starts as `PROPOSED`. Cursor cannot promote suggestions to `DRAFT` or `OPEN`.

## 6. Codex Review

Codex checks diff, protected paths, Canon conflict, JSON validity, Pages deployment impact, report completeness, and commit scope. Codex may accept, revise, or return the task.

Codex also checks provenance before merge:

- commit is visible
- branch matches the WorkOrder branch pattern
- report exists
- author is registered
- `task_id` exists
- `changed_files` match the diff
- protected paths are not modified without explicit approval
- provenance fields are complete
- worker is registered and active
- worker trust level is sufficient for task risk
- worker is not suspended, revoked, archived, or in pending registration
- branch matches the worker allowed branch pattern

## 7. Status Model

PROPOSED means a worker suggested future work but Codex has not reviewed it. DRAFT means Codex accepted the suggestion into review planning. OPEN means available. IN_PROGRESS means Cursor is working. REVIEW means Codex must inspect. DONE means Codex accepted the result. BLOCKED means the task cannot continue without explicit input.

## 8. Commit Rule

Only Codex commits and pushes unless a human explicitly authorizes another agent. Commit messages must describe the document or system area.

## 9. Forbidden Actions

No force push. No reset hard. No deletion of unconfirmed files. No overwrite of user local work. No protected path modification without explicit approval. No Canon rewrite without cumulative update.

## 10. Report Path

**Primary report intake:** `KGEN-AI-Company/reports/` (ORG-P2-003 D3 ALIAS).

Cursor writes WorkOrder reports to the output path listed in the live WorkQueue, which is normally under `KGEN-AI-Company/reports/`. `KGEN-Organization/Reports/` holds department templates and local scaffolding. `KGEN-Agent-Office/reports/` is a legacy alias for historical Agent Office TASK reports only.

## 11. Evidence Rule

Every review must cite paths and checks. Claims without path evidence remain unaccepted.

## 12. Human Decision Rule

Token facts, contracts, wallet, bridge, Boot, Runtime CURRENT, final whitepaper, and 12345 temple changes require human decision unless the task explicitly authorizes a narrow document-only reference.

## 13. Rollback Rule

Rollback must be a new reviewed change. Agents must not use destructive reset commands to hide mistakes.

## 14. Completion Rule

A task is complete only when the report exists, checks pass or risks are recorded, Codex accepts the result, and the WorkQueue is updated.

## 15. Revision History

| Version | Date | Description |
|---|---|---|
| V2.2 | 2026-07-11 | Added formal workforce registration, trust level, and credential gates. |
| V2.1 | 2026-07-11 | Added source provenance, R&D suggestion, PROPOSED status, and Codex provenance gate. |
| V2.0 | 2026-07-10 | Established WorkOrder standard for Organization V2.0. |
