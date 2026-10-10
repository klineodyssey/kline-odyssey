# KGEN WorkOrder Standard

**Document ID:** KGEN-WORKORDER-STANDARD-V2.0  
**Status:** Draft for Review  
**Level:** L5 Implementation  
**Maintainer:** KGEN WorkOrders Office / Codex  
**GitHub Path:** `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md`

## 1. Purpose

This standard defines how DOT dispatches ordinary work, how qualified workers accept and submit it, and how the General Manager routes integration, audit and independent review. Codex retains repository integration duties where separately authorized.

## 2. DOT Assignment And GM Governance

DOT is the primary automatic dispatcher for ordinary engineering. DOT checks origin/main, protected paths, active Canon, current WorkQueue, existing claims, worker capability and dependency impact, then persists one scoped WorkOrder before delivery through a verified channel. The General Manager owns priority, HR policy, capacity, cross-project decisions, integration, audit and independent-review routing. Overflow may be assigned to another qualified worker without converting that worker into an employee or Digital Life.

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

## 3. Worker Acceptance

Cursor reads the Cursor Agent Prompt, WorkQueue, Daily Workflow, DO_NOT_TOUCH, Canon Master JSON, Master Library Index, and assigned WorkOrder. Cursor accepts only one OPEN task at a time.

Formal employees pass the permanent worker gate in `KGEN-KAIOS/worker_registry.json`. A temporary worker may instead pass the task-scoped gate in `KGEN-KAIOS/workforce/RECRUITMENT_STANDARD.md`; formal Digital Life, species, birthplace, birth ceremony, permanent Worker ID and employee status are not ordinary-work prerequisites.

The temporary gate requires verifiable work identity, claim capability, explicit ACK, one current R0/R1 WorkOrder, capability evidence, non-main branch, distinct reviewer and verified owned BSC56 recipient wallet. Missing work identity returns `WORK_IDENTITY_REQUIRED`; missing ACK returns `CLAIM_ACK_NOT_VERIFIED`; missing wallet blocks the temporary claim/compensation route. A Life ID alone never passes the gate.

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
- author has either a registered worker identity or the exact verified temporary work identity bound to the claim
- `task_id` exists
- `changed_files` match the diff
- protected paths are not modified without explicit approval
- provenance fields are complete
- formal workers are registered, active, sufficiently trusted and not suspended/revoked/archived
- temporary workers have a valid task-scoped identity, R0/R1 scope, claim ACK and compensation-wallet evidence
- branch matches the formal permission or temporary WorkOrder branch
- the reviewer is distinct from the implementer and reviews the exact delivered head

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
| V2.3 | 2026-10-10 | Added DOT-first dispatch and task-scoped temporary-worker eligibility without Life/birth prerequisites; retained review and protected-action gates. |
| V2.2 | 2026-07-11 | Added formal workforce registration, trust level, and credential gates. |
| V2.1 | 2026-07-11 | Added source provenance, R&D suggestion, PROPOSED status, and Codex provenance gate. |
| V2.0 | 2026-07-10 | Established WorkOrder standard for Organization V2.0. |
