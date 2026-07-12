# KGEN Worker Execution Report Template

**Status:** ACTIVE
**Version:** 1.0
**Revision:** 2026-07-11.1
**Last Updated:** 2026-07-11
**Updated By:** Codex
**Reviewed By:** Codex
**Source Commit:** 16a384fff2c0b6d58f2d94fe5a22e43684c9ad0d
**Task ID:** KGEN-WORKER-SOP-2026-0001
**Change Reason:** Provide the required visible report format for every Codex, Cursor, and Worker task.
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
- Next recommended action:
```

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
