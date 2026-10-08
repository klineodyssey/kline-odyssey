# KGEN Workforce Governance

**Status:** ACTIVE
**Version:** 1.1
**Revision:** 2026-10-08.HR_SYSTEM
**Last Updated:** 2026-10-08
**Updated By:** Codex
**Reviewed By:** Codex
**Source Commit:** 1ce29b4cb53fcba77213d7792e2ad66e4498eb80
**Task ID:** KAIOS-HR-SYSTEM-20261008-001
**Change Reason:** Extend the existing workforce canon into an operational recruitment, onboarding, identity-audit, permission, performance and payroll-eligibility lifecycle without creating a second employee database.
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

If any requirement is missing, the worker is not a formal registered worker. A specifically Human-authorized candidate may still perform one identity-bound, bounded R0/R1 trial under `RECRUITMENT_STANDARD.md`; that trial does not create formal employment, Worker/Life identity, review authority or payroll eligibility.

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
| `employee_roster.json` | Machine-readable source of truth for worker identity, status, workspace, task and authority |
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
| `agent_registry.json` | V2 machine-readable Agent employee registry |
| `desk_registry.json` | V2 per-Agent office desk registry |
| `department_registry.json` | V2 department registry and staffing counts |
| `agent_runtime_status.json` | V2 runtime status snapshot for current working agents, commits, PRs and errors |
| `agent_daily_report.json` | V2 daily workforce report |
| `COMPENSATION_STANDARD.md` | V3 salary, reward, penalty, 8888 bank and Human approval compensation rules |
| `payroll_policy.json` | V3 machine-readable payroll policy, units, claim options and approval matrix |
| `salary_ledger.jsonl` | V3 append-only prototype payroll ledger |
| `payroll_snapshot.json` | V3 current payroll summary for dashboard display |
| `bonus_penalty_rules.json` | V3 quality bonus, research bonus, bug bounty, withholding and penalty rules |

## Non-Negotiable Rule

No worker, including Senior Trusted workers, may bypass protected paths, contract review, wallet / bridge safety, Runtime CURRENT governance, Canon, Boot, legal review, security review, or Codex-controlled main merge.

## Current Workforce Snapshot

The current roster is maintained in `employee_roster.json` and projected from `KGEN-KAIOS/worker_registry.json`. The 2026-10-08 audit records three formal employees (`codex-gm-01`, `cursor-01`, `chatgpt-01`) but no current October runtime heartbeat, so none is claimed to be working now. The Human Operator is recorded separately. DOT has a conditional onboarding record backed by Human policy issue #559, while Digital Ant reuses the existing `DIGITAL_ANT_0001` Life and remains pending separate Worker/Controller/payroll resolution.

## HR Lifecycle

The single HR lifecycle is:

`JOB -> APPLICATION -> IDENTITY -> ASSESSMENT -> TRIAL -> REVIEW -> INTERVIEW -> DECISION -> ONBOARDING -> WORK -> PERFORMANCE -> PAYROLL_ELIGIBILITY -> TRANSFER/SUSPENSION/EXIT`.

Employment, Worker ID, Life ID, Controller/runtime binding, tool permission, reviewer qualification and payroll eligibility are independent gates. HR maintains and reconciles these records but cannot mint identities outside their canon or execute protected payroll/asset actions.

## Workforce V2 Agent Model

V2 preserves the V1 files and adds `agent_registry.json` as the current Agent-per-employee source. `cursor-01` is not deleted; it is mapped as the legacy worker ID for `cursor-agent-0001`. New Cursor work units must use `cursor-agent-0002`, `cursor-agent-0003`, and so on. Candidates remain `WAITING` or `OFFLINE` until Boot, desk, claim, branch, report and review evidence exists.

## Workforce V4 Compensation And Bank Model

V4 keeps 12345 as the civilization heart and reward source, while 8888 People Bank is an internal ledger only. Current salary policy is KAIOS prepaid living salary on day 5 UTC+8, with amounts pending an approved salary table. Salary, task compensation, creator royalty, freight revenue, Heartbeat reward and cargo principal remain separate. Payroll execution is not live and always requires the protected financial gates in `payroll_policy.json`.

Related records:

- `KGEN-KAIOS/bank/8888/employee_accounts.json`
- `KGEN-KAIOS/bank/8888/payroll_reserve.json`
- `KGEN-KAIOS/bank/8888/claim_queue.json`
- `KGEN-KAIOS/game/mission_wallets.json`
- `KGEN-KAIOS/bank/8888/robo_registry.json`

All V3 payroll, game mission and Robo records are Prototype / Simulation / Internal Ledger records. They are not banking, investment advice, guaranteed return, KYC / AML service, securities service or autonomous real-money trading.
