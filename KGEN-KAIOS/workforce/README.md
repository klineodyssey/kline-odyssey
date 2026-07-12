# KGEN Workforce Governance

**Status:** ACTIVE  
**Version:** 1.0  
**Revision:** 2026-07-11.1  
**Last Updated:** 2026-07-11  
**Updated By:** Codex  
**Reviewed By:** Codex  
**Source Commit:** 1ce29b4cb53fcba77213d7792e2ad66e4498eb80  
**Task ID:** KGEN-WORKFORCE-2026-0001  
**Change Reason:** Establish formal worker employment, trust, autonomy, violation, suspension, and audit gates.  
**Source Of Truth:** TRUE

## Purpose

This folder is the machine-readable workforce layer for KAIOS. It does not replace AI Company, Agent Office, Organization, WorkQueue, or provenance. It adds the evidence required to decide whether a worker may register, claim a task, submit a handoff branch, and be reviewed by Codex.

## Formal Employee Rule

A worker is a formal KGEN employee only when all of these are true:

- `worker_id` exists in `KGEN-KAIOS/worker_registry.json`
- `employee_status` is `ACTIVE`, `TRUSTED`, or `SENIOR_TRUSTED`
- `trust_level` is at least `T2`
- `role`, `permission`, `workspace`, `allowed_branch_pattern`, and `reviewer` are defined
- `can_push_main` is false unless the worker is Codex / system maintainer
- Boot, Canon, Workspace Policy, WorkQueue, and DO_NOT_TOUCH acknowledgments are recorded
- no suspension, ban, expired credential, or active blocking violation exists

If any requirement is missing, the worker is treated as `UNREGISTERED_WORKER` and may not claim or modify formal KGEN work.

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
| `RECRUITMENT_STANDARD.md` | Recruitment and sandbox trial workflow |
| `recruitment_queue.json` | Machine-readable candidate queue |
| `EMPLOYEE_APPLICATION_TEMPLATE.md` | Application template for new AI or Human workers |

## Non-Negotiable Rule

No worker, including Senior Trusted workers, may bypass protected paths, contract review, wallet / bridge safety, Runtime CURRENT governance, Canon, Boot, legal review, security review, or Codex-controlled main merge.

## Current Workforce Snapshot

The current roster is maintained in `employee_roster.json`. As of this baseline, Codex is on duty, `cursor-01` is registered but idle, the Human Operator is recorded separately, and other AI / Human candidates remain `REGISTERED_NOT_ACTIVATED` until onboarding and sandbox trial evidence exists.
