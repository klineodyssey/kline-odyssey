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

## Worker Operating Loop

```text
Read registry
-> confirm worker_id
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