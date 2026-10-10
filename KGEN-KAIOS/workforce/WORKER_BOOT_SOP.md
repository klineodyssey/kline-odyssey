# KGEN Worker Boot SOP

**Status:** DRAFT / PENDING INDEPENDENT REVIEW
**Version:** 1.1
**Revision:** 2026-10-10.TEMPORARY_WORKER_ELIGIBILITY
**Last Updated:** 2026-10-10
**Updated By:** Codex
**Reviewed By:** INDEPENDENT_REVIEW_PENDING
**Source Commit:** PENDING_PR_HEAD
**Task ID:** KAIOS-TEMP-WORKER-ELIGIBILITY-20261010-001
**Change Reason:** Permit verified task-scoped temporary workers to perform ordinary R0/R1 work without Digital Life birth while preserving visible authorization and safety evidence.
**Ancestor:** KGEN-KAIOS/workforce/README.md
**Source Of Truth:** TRUE

## Biological Classification

| Rank | Value |
|---|---|
| Domain / 域 | KGEN Governance |
| Kingdom / 界 | KAIOS Workforce |
| Phylum / 門 | Worker Execution |
| Class / 綱 | Boot Procedure |
| Order / 目 | Task Authorization |
| Family / 科 | Workforce SOP |
| Genus / 屬 | WorkerBoot |
| Species / 種 | WorkerBootSOP |

## Purpose

This SOP is the formal visible start-of-work procedure for every KGEN / KAIOS worker. It applies to formal employees and task-scoped temporary workers, including Codex, Cursor, Generic Workers and Human Engineers.

No worker may treat hidden chat memory, informal conversation, or a previous local state as sufficient authorization. Each task must show the six sections below in its execution report.

## Scope

This SOP applies to:

- code review
- documentation edits
- validation-only tasks
- Cursor handoff work
- Codex review and merge work
- dashboard and Pages verification
- WorkQueue, report, registry, and provenance updates

Verification-only tasks still require this SOP. In that case the Execution section must explicitly state: `Verification Only / No File Change`.

## Required Worker Flow

### 1. BOOT

The worker must read:

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`

The worker must report:

- Boot file read result
- CURRENT / OFFICIAL / RUNTIME entry confirmed
- whether the user request is inside the worker's authorized scope
- whether the task requires Codex, Cursor, Generic Worker, or Human review

### 2. MUST READ

The worker must read the required Boot Pack and workforce files for its role.

Common required files:

- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `KGEN-AI-Company/WORKSPACE_POLICY.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-KAIOS/workforce/README.md`

Codex must also read:

- `KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md`
- `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md`
- `KGEN-AI-Company/CODEX_REVIEW_AND_MERGE_RULES.md`
- `KGEN-KAIOS/CODEX_PRE_MERGE_CHECKLIST.md`
- `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`

Cursor and Generic Workers must also read:

- `KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md`
- `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`

The worker must report:

- permanent `worker_id`, or temporary `work_identity_id` plus evidence reference;
- worker type;
- formal trust/employee status, or `NOT_APPLICABLE_TEMPORARY`;
- exact WorkOrder, claim channel and ACK status;
- branch permission;
- owned public compensation wallet verification status (never a seed/private key/signature request);
- reviewer;
- whether the worker is allowed to continue.

Digital Life ID, species, birthplace and birth ceremony are not required for ordinary temporary R0/R1 work. If neither permanent identity nor task-scoped work identity can be verified, the worker must stop and output:

```text
WORK_IDENTITY_REQUIRED
```

If a temporary worker lacks any other gate, it must stop with the exact missing gate, such as `CLAIM_ACK_NOT_VERIFIED`, `WORK_ORDER_NOT_CLAIMABLE`, `PAYMENT_WALLET_NOT_VERIFIED`, `INDEPENDENT_REVIEWER_REQUIRED` or `PROTECTED_ACTION_FORBIDDEN`. Passing the repository schema precheck does not verify canonical evidence and must not be reported as eligibility.

### 3. PROTECTED PATH CHECK

The worker must check whether the task would touch protected paths:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

The worker must report:

- protected path scan result
- whether any protected path is in scope
- whether explicit user authorization exists
- whether the task is allowed to continue

If a protected path is touched without explicit authorization, the task must be blocked.

### 4. TASK PLAN

Before execution, the worker must report:

- what will be done
- files to read
- files to modify
- files that will not be touched
- expected outputs
- validation plan
- commit / push plan, if authorized

The plan must be narrow. It must not include unrelated cleanup, refactors, or new architecture unless the WorkOrder explicitly authorizes them.

### 5. EXECUTION

The worker must execute according to the KGEN lifecycle:

```text
Draft
-> Review
-> Release
```

For Cursor and Generic Workers:

```text
Claim
-> Handoff Branch
-> Report
-> Push Handoff
-> Stop for Codex Review
```

For Codex:

```text
Boot
-> Inspect Handoff
-> Validate Evidence
-> Merge / Reject / Block
-> Update WorkQueue
-> Update Review Log
-> Push main only when authorized
```

For validation-only work, the worker must write:

```text
Verification Only / No File Change
```

### 6. FINAL REPORT

Every worker final report must include:

- pass / fail
- task ID
- worker ID
- worker status and trust level
- files read
- files modified
- files intentionally not modified
- JSON validation result
- Pages validation result, when applicable
- protected path violation result
- report path
- branch
- commit SHA, if a commit was created
- push status
- follow-up risks
- recommended next action

## Codex Review Gate

Codex must reject or block a handoff when the report omits this SOP evidence and the missing evidence affects authorization, protected paths, provenance, WorkQueue state, or merge safety.

Low-risk formatting omissions may be accepted only with a follow-up WorkOrder if:

- no protected path was touched
- the diff is fully visible
- worker identity is registered
- the report exists
- provenance is recoverable

## Non-Bypass Rule

No trust level grants permanent exemption from this SOP. Trusted and Senior Trusted workers may receive faster review only inside approved low-risk autonomy scope, but they must still produce visible boot and execution evidence.
