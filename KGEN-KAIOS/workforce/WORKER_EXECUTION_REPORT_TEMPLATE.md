# KGEN Worker Execution Report Template

**Status:** ACTIVE BASE / CANDIDATE ADDITION NOT ACTIVE
**Version:** 1.2-candidate
**Revision:** 2026-10-09.1-candidate
**Last Updated:** 2026-10-09
**Updated By:** DOT delegated candidate (runtime unbound)
**Reviewed By:** PENDING_DISTINCT_TECHNICAL_REVIEW
**Source Commit:** PENDING_CANDIDATE_HEAD
**Task ID:** KAIOS-HUMAN-DELEGATED-TRIAL-ADMISSION-CANDIDATE-20261009
**Change Reason:** Add fail-closed reporting fields for a bounded Human-delegated R0/R1 candidate trial without activating formal identity or tool authority.
**Ancestor:** KGEN-Agent-Office/CURSOR_REPORT_TEMPLATE.md
**Source Of Truth:** TRUE

## Biological Classification

| Rank | Value |
|---|---|
| Domain / 域 | KGEN Governance |
| Kingdom / 界 | KAIOS Workforce |
| Phylum / 門 | Worker Execution |
| Class / 綱 | Reporting Procedure |
| Order / 目 | Task Evidence |
| Family / 科 | Workforce Report |
| Genus / 屬 | WorkerExecution |
| Species / 種 | WorkerExecutionReportTemplate |

## Required Template

Copy this structure into every Codex, Cursor, Generic Worker, or Human Engineer task report.

```markdown
# Worker Execution Report

## State Progress

- BOOT:
- CLAIM:
- WORK:
- TEST:
- REPORT:
- REVIEW:
- READY_FOR_PUSH:
- DONE: Codex controlled / not yet / completed

## 1. BOOT

- Boot file read:
- CURRENT / OFFICIAL / RUNTIME entry confirmed:
- Task authorization scope:
- Worker role for this task:
- Result: PASS / FAIL

## 2. MUST READ

- Boot Pack files read:
- Workforce Governance files read:
- Worker Registry read:
- worker_id:
- worker_type:
- employee_status:
- trust_level:
- allowed_branch_pattern:
- can_push_main:
- reviewer:
- Credential result: PASS / FAIL / REGISTRATION_REQUIRED

### Human-Delegated Trial Identity (use instead of formal worker fields only when applicable)

- claimant_kind: HUMAN_DELEGATED_TRIAL
- temporary_contributor_ref:
- temporary_execution_ref:
- temporary_execution_ref_kind: COMPANY_TEMP_WORK_REF_NOT_PLATFORM_ID
- Formal worker / employee / Life / Controller activated: NO
- Human authorization source / issuer / issued_at / decision:
- WorkOrder / bounded work ID:
- risk_level: R0 / R1
- exact branch / base commit:
- lease start / expiry / heartbeat:
- grant_status: ACTIVE / REVOKED / EXPIRED
- single_writer evidence:
- conflict / duplicate-scope check:
- allowed paths:
- allowed actions:
- forbidden actions:
- output and acceptance criteria:
- implementer reference:
- distinct reviewer reference:
- reviewer independence check: PASS / FAIL / PENDING
- current tool/platform permission check:
- first denial log (action / target / reason / UTC time / request or review ID): NONE / details
- Candidate result: PASS / FAIL / REGISTRATION_REQUIRED / BLOCKED

## 3. PROTECTED PATH CHECK

- Protected paths checked:
  - contracts:
  - K線西遊記/temples/12345:
  - wallet:
  - bridge:
  - Runtime CURRENT:
  - final-whitepaper:
  - KGEN Token contract:
- Explicit authorization needed:
- Explicit authorization present:
- Result: PASS / FAIL / BLOCKED

## 4. TASK PLAN

- Task ID:
- Task source:
- Work to perform:
- Files to read:
- Files to modify:
- Files intentionally not modified:
- Expected outputs:
- Validation plan:
- Commit / push plan:

## 5. EXECUTION

- Execution mode: Draft / Review / Release / Verification Only
- Branch:
- Base commit:
- Head commit:
- Files read:
- Files modified:
- Checks run:
- JSON validation:
- Pages validation:
- Problems found:
- Risks:
- Technical debt:
- Evolution opportunities:
- Suggested WorkOrders:

## 6. FINAL REPORT

- Final result: PASS / FAIL
- Modified files:
- Unmodified protected files:
- Report path:
- Commit SHA:
- Push status:
- WorkQueue update:
- Review Log update:
- Protected path violation:
- Human decision needed:
- Codex review needed:
- Distinct technical review status: PENDING / PASS / FAIL / NOT_APPLICABLE
- Trial activation status: NOT_ACTIVATED / ACTIVE_BY_SEPARATE_VALID_RECORD / REVOKED / EXPIRED
- Next recommended action:
```

## State Authority

A Worker may reach `READY_FOR_PUSH` after its handoff evidence is visible. Only Codex may mark `DONE` after review and required merge/push completion. A report that says only "Done" is incomplete.

## Verification-Only Rule

If no files were changed, the Execution section must explicitly include:

```text
Verification Only / No File Change
```

The final report must still include protected path, JSON, Pages, and pass / fail evidence.

## Suggested WorkOrders Rule

Worker suggestions are allowed, but they must remain:

```text
Status: PROPOSED
```

Only Codex may promote:

```text
PROPOSED -> DRAFT -> OPEN
```

## Protected Path Rule

If any protected path appears in `Files Modified`, the report must include the exact user authorization and Codex review boundary. Without that evidence, the task is BLOCKED.

## Human-Delegated Trial Reporting Rule

The temporary-trial section is mandatory for `claimant_kind: HUMAN_DELEGATED_TRIAL`. A candidate must not copy values into formal worker fields, assert reviewer PASS for its own work, or treat a temporary reference, branch, commit, Draft PR, CI result, shared account, provider name, or role label as identity/authority proof. The report must fail closed when authorization, scope, lease, revocation, single-writer, branch/base, tool permission, or distinct-review evidence is missing or inconsistent.
