# KGEN Workforce Governance

**Status:** ACTIVE / FAIL-CLOSED PRECHECK ONLY
**Version:** 1.2
**Revision:** 2026-10-10.TEMPORARY_WORKER_ELIGIBILITY
**Last Updated:** 2026-10-10
**Updated By:** Codex
**Reviewed By:** INDEPENDENT_SECURITY_REVIEWER
**Source Commit:** 558326d664730a3750cfe0f11a85767ffeae4985
**Task ID:** KAIOS-TEMP-WORKER-ELIGIBILITY-20261010-001
**Change Reason:** Separate ordinary temporary-work eligibility from formal Digital Life, employment and payroll while preserving WorkOrder, review and protected financial gates.
**Source Of Truth:** TRUE

## Purpose

This folder is the machine-readable workforce layer for KAIOS. It does not replace AI Company, Agent Office, Organization, WorkQueue, Life canon or provenance. Formal worker authority lives in `KGEN-KAIOS/worker_registry.json`; `employee_roster.json` is the HR roster projection, `recruitment_queue.json` is the candidate/decision queue, and `agent_registry.json` maps Agent work units only. These scoped records are one system, not competing employee databases.

## Formal Employee Rule

A worker is a formal KGEN employee only when all of these are true:

- `worker_id` exists in `KGEN-KAIOS/worker_registry.json`
- `employee_status` is `ACTIVE`, `TRUSTED`, or `SENIOR_TRUSTED`
- `trust_level` is at least `T2`
- `role`, `permission`, `workspace`, `allowed_branch_pattern`, and `reviewer` are defined
- `can_push_main` is false unless the worker is Codex / system maintainer
- Boot, Canon, Workspace Policy, WorkQueue, and DO_NOT_TOUCH acknowledgments are recorded
- no suspension, ban, expired credential, or active blocking violation exists

If any requirement is missing, the worker is not a formal registered worker. That does not by itself prohibit ordinary temporary work.

## Temporary Worker Rule

A temporary worker may claim bounded ordinary R0/R1 work without a Digital Life ID, species, birthplace, birth date, birth ceremony, formal employee record or permanent Worker ID. The temporary lane reuses the same WorkQueue and review system; it is not a second company system.

Every temporary claim must ultimately have all of the following canonical evidence:

- a verifiable task-scoped work identity and evidence reference;
- a verified claim channel and explicit Worker ACK;
- one current, bounded WorkOrder with scope, non-main branch, risk level, expiry/protected actions and a distinct reviewer;
- demonstrated capability for the assigned scope;
- a public BSC56 recipient wallet whose ownership is verified without obtaining a seed, private key or signature authority;
- delivery evidence and independent acceptance before any task compensation is calculated.

Life identity is optional for this lane and cannot substitute for work identity. A recipient wallet is a payment destination only and grants no Treasury, signer, governance or payroll authority. Mainnet transactions, real-asset movement, Treasury, payroll execution, signer/secret use, governance, production deployment and irreversible actions remain Human-protected.

The repository-only `validateTemporaryWorkerClaim` function performs schema and consistency prechecks only. The current architecture has no canonical evidence resolver, signature verifier or durable registry lookup, so a passing precheck returns `eligible: false` and `canonical_verification_required: true`. Caller-supplied `VERIFIED` strings or evidence references never establish eligibility.

DOT is the primary dispatcher for ordinary engineering. The General Manager owns HR policy, company management, integration, audit and review routing, and may route overflow to another qualified worker. Dispatch, implementation and independent review must remain distinct whenever the same subject would otherwise approve its own delivery.

## Files

| File | Purpose |
|---|---|
| `WORKER_BOOT_SOP.md` | Required visible BOOT, MUST READ, protected path, task plan, execution, and final report flow for every worker task |
| `WORKER_EXECUTION_REPORT_TEMPLATE.md` | Standard report template that every Codex, Cursor, Generic Worker, and Human Engineer task must use |
| `WORKER_CREDENTIAL_SCHEMA.json` | Required fields for each start-day credential and task claim |
| `WORKER_TRUST_SCHEMA.json` | Trust levels, status, promotion, demotion, and review requirements |
| `WORKER_PERFORMANCE_SCHEMA.json` | Performance scoring and promotion evidence |
| `WORKER_VIOLATION_SCHEMA.json` | Violation event record format |
| `WORKER_AUTONOMY_SCOPE_SCHEMA.json` | Limited autonomy whitelist and forbidden areas |
| `WORKER_SUSPENSION_SCHEMA.json` | Suspension, revocation, and reinstatement format |
| `WORKER_AUDIT_LOG.json` | Current baseline workforce audit log |
| `EMPLOYEE_ROSTER.md` | Human-readable formal employee roster, status and assignment summary |
| `employee_roster.json` | Machine-readable HR projection; formal worker authority remains in `KGEN-KAIOS/worker_registry.json` |
| `OFFICE_DESK_STANDARD.md` | Logical workspace / worktree / branch namespace desk rules |
| `office_desks.json` | Machine-readable office desk registry |
| `TOOL_ACCESS_MATRIX.md` | Human-readable tool and permission matrix |
| `tool_access_matrix.json` | Machine-readable tool access matrix |
| `ATTENDANCE_STANDARD.md` | Worker check-in, heartbeat, report and check-out event rules |
| `attendance_log.jsonl` | Append-only attendance event baseline |
| `attendance_snapshot.json` | Current duty status snapshot |
| `DAILY_ATTENDANCE_REPORT.md` | Human-readable daily attendance report |
| `daily_attendance.json` | Machine-readable daily attendance summary |
| `WORKER_CONFLICT_PROTOCOL.md` | Conflict, duplicate work and unauthorized change handling protocol |
| `PERFORMANCE_AND_DISCIPLINE_STANDARD.md` | Performance, discipline and reward rules |
| `RECRUITMENT_STANDARD.md` | Unified job, application, assessment, interview, hiring and onboarding workflow |
| `recruitment_queue.json` | Machine-readable candidate queue |
| `EMPLOYEE_APPLICATION_TEMPLATE.md` | Application, standardized assessment and separate identity/permission/payroll gate template |
| `AGENT_WORKFORCE_V2_STANDARD.md` | V2 rule: every Agent work unit is one employee with permanent UUID |
| `agent_registry.json` | Legacy Agent work-unit UUID/desk compatibility mapping; not employment or authority canon |
| `desk_registry.json` | V2 per-Agent office desk registry |
| `department_registry.json` | V2 department registry and staffing counts |
| `agent_runtime_status.json` | V2 runtime status snapshot for current working agents, commits, PRs and errors |
| `agent_daily_report.json` | V2 daily workforce report |
| `COMPENSATION_STANDARD.md` | V4 KAIOS salary classification, legacy-ledger continuity and protected execution rules |
| `payroll_policy.json` | V4 machine-readable payroll eligibility, separation and execution gates |
| `salary_ledger.jsonl` | V3 append-only prototype payroll ledger |
| `payroll_snapshot.json` | V3 current payroll summary for dashboard display |
| `bonus_penalty_rules.json` | V3 quality bonus, research bonus, bug bounty, withholding and penalty rules |

## Non-Negotiable Rule

No worker, including Senior Trusted workers, may bypass protected paths, contract review, wallet / bridge safety, Runtime CURRENT governance, Canon, Boot, legal review, security review, or Codex-controlled main merge.

## Current Workforce Snapshot

The current roster is projected from `KGEN-KAIOS/worker_registry.json`. After applying the no-active-suspension rule, the 2026-10-08 audit records two formal active employees (`codex-gm-01`, `chatgpt-01`); `cursor-01` retains a registered identity but remains suspended by the Human cost decision. No current October runtime heartbeat exists, so none is claimed to be working now. DOT accepted the CTDO position proposal in a session-scoped record, but the HR decision remains `PENDING_REVIEW` and formal appointment remains incomplete pending identity/onboarding gates. Digital Ant reuses the existing `DIGITAL_ANT_0001` Life and remains pending separate Worker/Controller/payroll resolution.

## HR Lifecycle

The single HR lifecycle is:

`JOB -> APPLICATION -> IDENTITY -> ASSESSMENT -> TRIAL -> REVIEW -> INTERVIEW -> DECISION -> ONBOARDING -> WORK -> PERFORMANCE -> PAYROLL_ELIGIBILITY -> TRANSFER/SUSPENSION/EXIT`.

Employment, Worker ID, Life ID, Controller/runtime binding, temporary-work identity, tool permission, reviewer qualification, task-compensation eligibility and payroll eligibility are independent gates. HR maintains and reconciles these records but cannot mint identities outside their canon or execute protected payroll/asset actions.

## Workforce V2 Agent Model

V2 records in `agent_registry.json` are retained only as legacy Agent work-unit UUID/desk mappings. Their status, activation and current-work fields are not operational authority. `KGEN-KAIOS/worker_registry.json` controls formal worker status, and current runtime activity requires fresh evidence. A legacy Agent UUID never creates employment, Worker/Life identity, Controller binding or payroll eligibility.

## Workforce V4 Compensation And Bank Model

V4 keeps 12345 as the civilization heart and reward source, while 8888 People Bank is an internal ledger only. Current salary policy is KAIOS prepaid living salary on day 5 UTC+8, with amounts pending an approved salary table. Salary, task compensation, creator royalty, freight revenue, Heartbeat reward and cargo principal remain separate. Payroll execution is not live and always requires the protected financial gates in `payroll_policy.json`.

Related records:

- `KGEN-KAIOS/bank/8888/employee_accounts.json`
- `KGEN-KAIOS/bank/8888/payroll_reserve.json`
- `KGEN-KAIOS/bank/8888/claim_queue.json`
- `KGEN-KAIOS/game/mission_wallets.json`
- `KGEN-KAIOS/bank/8888/robo_registry.json`

All V3 payroll, game mission and Robo records are Prototype / Simulation / Internal Ledger records. They are not banking, investment advice, guaranteed return, KYC / AML service, securities service or autonomous real-money trading.
