# KGEN Worker Boot SOP

**Status:** ACTIVE
**Version:** 1.0
**Revision:** 2026-07-11.1
**Last Updated:** 2026-07-11
**Updated By:** Codex
**Reviewed By:** Codex
**Source Commit:** 16a384fff2c0b6d58f2d94fe5a22e43684c9ad0d
**Task ID:** KGEN-WORKER-SOP-2026-0001
**Change Reason:** Require every Codex, Cursor, and Worker task to show visible boot, authorization, protected path, task plan, execution, and final report evidence.
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

This SOP is the formal visible start-of-work procedure for every KGEN / KAIOS worker. It applies to Codex, Cursor, Generic Workers, Human Engineers, and future registered agents.

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

### Current entry-order amendment: 2026-10-06

Human source: `Sentinel_b9c9a6cfa0a08191b922a26478c6d8fa` at
2026-10-06T00:28:15Z. For every new work item or Cloud/worktree/session:

`BOOT V1.4 FIRST -> COMPLETE BOOT/CURRENT/NEURAL LINEAGE -> COMPANY SYNC -> HUMAN PROMPT`

The first repository document is `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`.
Continue through the stable Boot, CURRENT Physics, current Map/base, Signed Math,
Safety, Authority, Life and task-domain Canon. This changes entry ordering only;
both protected Boot documents and the physical/mathematical/map laws are retained.
The older stable-first wording in section 1 below is historical and superseded
for new entries by this amendment. Latest explicit Human decisions take priority
over old chat summaries; a reference in an input payload is not authenticated
Human authority.

Company sync must cover current main, existing runtime, registry, active work,
handoffs, queue, PR/CI, P0/P1, owners, closeout, outages and Human decisions. Store
bounded source refs, exact known revisions and statuses, not private conversation
dumps, credentials or unrelated personal data. Scope blockers to affected actions.
Unrelated CI waits or another owner's P0 do not stop independently authorized work.

Before code complete `READ_CANON -> LINEAGE -> EXISTING_RUNTIME -> ACTIVE_WORK ->
DESIGN`; append `CODE -> TEST` only after those stages actually occur. A new session
needs a new context-bound record. Within that session, refresh by appending an
immutable checkpoint, preserving all previous checkpoints. Never backdate a read,
relabel an old job compliant, or overwrite earlier evidence when main changes.

#### Machine-checkable receipt

Reuse `../governance/agents/runtime-v0.1/` and its existing schema/CLI. The schema
definition is `engineeringWorkflowEvidence`; no new Worker or session registry is
introduced. Required checkpoint fields are:

- `BOOT_FILE`: exact V1.4 repository path, also first in `READ_RECEIPTS`.
- `BOOT_BLOB`: actual Git blob at `LATEST_MAIN`, not a copied version label.
- `LATEST_MAIN`: full independently refreshed main SHA.
- `COMPANY_SYNC`: main-bound source revisions and all twelve sync categories.
- `DOMAIN_CANON_READ`: applicable tracked source paths with read receipts.
- `CANON_CONFLICT`: explicit precedence resolution, affected-scope stop or
  outside-scope record. No silent Canon edits.
- `PATH_RESOLUTIONS`: missing requested path, tracked resolved path, trusted
  lineage index and reason. For example Boot's lowercase `docs/whitepaper/` is
  resolved by `docs/KGEN_MASTER_INDEX.md` to the tracked `docs/Whitepaper/` path.
- `STAGES`: first five stages at `PRE_CODE`; all seven at `POST_TEST`.
- `CYCLE`: sequential number, exact previous checkpoint, matching PRE_CODE ID,
  reason/ref and recorded test outcome. Initial cycle is 1; PRE_CODE has
  `NOT_RUN`, while POST_TEST records `PASS`, `FAIL` or `BLOCKED` honestly.

Within one work/session, a source/design refresh before testing stays in the
current cycle and appends a new PRE_CODE. POST_TEST must bind that cycle's latest
PRE_CODE and the same main/source snapshot, preserving its first five stages.
After POST_TEST, rework or a fresh-main refresh opens cycle N+1 with reason
`REWORK` or `SOURCE_REFRESH`, an exact predecessor link and `NOT_RUN`. Reusing the
old cycle number, skipping a number, emitting another POST_TEST without a new
PRE_CODE, or carrying the previous PASS into PRE_CODE is rejected. A recorded
FAIL/BLOCKED is valid evidence, not permission or a successful test.

Pre-cycle prototype receipts may remain only as an immutable historical prefix.
Their missing cycle/outcome evidence stays `NOT_RECORDED`. Introduce cycle 1 with
an actual `LEGACY_FORWARD_CHECKPOINT` linked to the last historical checkpoint;
do not add fields to old records or replay them as a current prerequisite. Output
reports the latest cycle/outcome only and always leaves readiness unevaluated.

Run the existing CLI with the evidence file, repository, independently verified
main and exact expected work/session/workspace IDs. When appending, also provide
the immutable previous evidence file. Revalidate before construction and before
commit/push/PR/merge/release. Source drift requires a real reread and fresh Company
checkpoint; changing a hash alone does not satisfy the human reading duty.

`CONSISTENT` means the receipt matches local Git and the supplied observed main.
It does **not** prove that remote main is still latest, who authored a statement,
that an agent understood a file, that a selected domain source is sufficient, or
that a Human authorized an action. Operator/reviewer must verify those separately.
The command grants no actions and cannot replace `validate-session`, capability,
protected-path or release checks. Invocation is an operator/reviewer checklist
requirement; it is not an automatically enforced CI/admission gate or a deployed
service intercepting filesystem or tool actions.

Historical records without this evidence remain `NOT_RECORDED`. Preserve them;
record only the next actual checkpoint. A bounded Human registration exception,
independently verified outside this receipt, remains effective only within its
approved scope and duration. It never creates Life/Worker/Employee identity,
trust-level, payroll, treasury, signer or Mainnet authority.

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

- worker_id
- worker type
- trust level
- employee status
- branch permission
- reviewer
- whether the worker is allowed to continue

If the worker identity cannot be verified, the worker must stop and output:

```text
REGISTRATION_REQUIRED
```

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
