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
| `WORKER_CREDENTIAL_SCHEMA.json` | Required fields for each start-day credential and task claim |
| `WORKER_TRUST_SCHEMA.json` | Trust levels, status, promotion, demotion, and review requirements |
| `WORKER_PERFORMANCE_SCHEMA.json` | Performance scoring and promotion evidence |
| `WORKER_VIOLATION_SCHEMA.json` | Violation event record format |
| `WORKER_AUTONOMY_SCOPE_SCHEMA.json` | Limited autonomy whitelist and forbidden areas |
| `WORKER_SUSPENSION_SCHEMA.json` | Suspension, revocation, and reinstatement format |
| `WORKER_AUDIT_LOG.json` | Current baseline workforce audit log |

## Non-Negotiable Rule

No worker, including Senior Trusted workers, may bypass protected paths, contract review, wallet / bridge safety, Runtime CURRENT governance, Canon, Boot, legal review, security review, or Codex-controlled main merge.

