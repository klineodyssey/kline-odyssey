# Generic Worker Protocol

**Version:** V7.1 Minimal Worker Layer
**Status:** Active / Draft for Review

## Purpose

This protocol converts the Cursor-only workflow into a worker-neutral KAIOS workflow. It applies to Cursor, Claude, Gemini, OpenHands, GitHub Copilot, ChatGPT, Deep Research, and Human Engineers.

## Worker Boot Order

A worker must read, in order:

1. `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
2. `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
3. `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
4. `AGENTS.md`
5. `KGEN-KAIOS/WORKER_REGISTRY.md`
6. `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md`
7. `KGEN-KAIOS/STALE_HANDOFF_BRANCH_POLICY.md`
8. `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
9. `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`
10. `KGEN-KAIOS/workforce/WORKER_EXECUTION_REPORT_TEMPLATE.md`

## Visible Boot SOP Rule

Every worker task must visibly report the six required execution sections defined in `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`:

1. BOOT
2. MUST READ
3. PROTECTED PATH CHECK
4. TASK PLAN
5. EXECUTION
6. FINAL REPORT

Verification-only work is not exempt. The Execution section must explicitly state `Verification Only / No File Change`.

## Worker Operating Loop

```text
Read registry
-> confirm worker_id
-> verify employee status and trust level
-> find eligible task
-> claim task
-> create handoff branch
-> work only assigned scope
-> write report
-> push handoff branch
-> move task to REVIEW
-> stop for Codex review
```

## Branch Rule

A worker may only push branches matching its registry `allowed_branch_pattern`. Workers must not push `main` unless `can_push_main` is true.

## Report Rule

Each worker report must include:

- Task ID
- Worker ID
- Worker Type
- BOOT evidence
- MUST READ evidence
- Protected path check evidence
- Task plan
- Execution mode
- Final pass / fail result
- Branch
- Base Commit
- Head Commit
- Report Path
- Files Read
- Files Modified
- Protected Paths Checked
- Checks Run
- Risks
- Blockers
- Recommendation

## Stop Rule

A worker stops after one task. A worker does not continue to the next task without a new claim cycle.

## Protected Path Rule

Workers must not modify protected paths without explicit WorkOrder permission and human approval.

## Registration Gate

Before any claim, a worker must prove:

- `worker_id` exists in `KGEN-KAIOS/worker_registry.json`
- `employee_status` is not `PENDING_REGISTRATION`, `SUSPENDED`, `REVOKED`, or `ARCHIVED`
- `trust_level` is high enough for the WorkOrder risk level
- Boot, Canon, Workspace Policy, and DO_NOT_TOUCH acknowledgments are true
- no other active claim exists beyond the worker trust limit

If verification fails, the worker must stop and output only:

```text
REGISTRATION_REQUIRED
```

## R&D Suggestion Rule

Workers may include `Suggested WorkOrders` in their report, but every suggestion starts as `PROPOSED`. A worker must not promote its own suggestion to `DRAFT`, `OPEN`, `CLAIMED`, or `IN_PROGRESS`.

## Violation Handling

If a worker uses the wrong branch, bundles multiple tasks, modifies protected paths, pushes main, omits the report, omits provenance, or bypasses Codex review, Codex records a violation event under `KGEN-KAIOS/workforce/WORKER_AUDIT_LOG.json` or a follow-up audit report. The handoff is blocked or rejected until the evidence is complete.
