# Generic Worker Protocol

**Version:** V7.1.1 Candidate
**Status:** Candidate / Distinct Technical Review Pending

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

## Human-Delegated Candidate Trial Loop

`KGEN-KAIOS/workforce/RECRUITMENT_STANDARD.md` permits one separate, bounded R0/R1 trial when a Human has authorized the exact candidate and scope. The candidate does not enter the registered-worker loop and must not invent a `worker_id`, `worker_type`, Life ID, Controller binding, trust level, reviewer status, or employee status.

```text
Read mandatory Boot and governance
-> verify complete privately retained Human authorization evidence
-> bind a non-public company trial correlation reference
-> bind exact WorkOrder, branch, base, scope, actions and R0/R1 ceiling
-> verify one writer, lease, revocation and no conflicting live claim
-> verify current tool/platform permission
-> work only inside the bound scope
-> test and write a candidate report
-> push only the authorized non-main branch
-> open or update only the authorized Draft PR
-> stop for the distinct reviewer
```

The public record stores only the `HUMAN_AUTHORIZED_CANDIDATE` classification and external verification state. Private message IDs, personal names, runtime/session identifiers and derived correlation references stay in private task evidence. A company-local trial reference is correlation data only and proves no platform session, identity, employment, Worker/Life/Controller registration, review authority, payroll eligibility, or protected authority. The trial claim must use `claimant_kind: HUMAN_DELEGATED_TRIAL` in `KGEN-KAIOS/task_claim_schema.json`.

Schema-valid fixtures prove structural compatibility only. They do not verify the private Human evidence, runtime identity, current lease/revocation, unique writer, exact scope, reviewer independence or live tool result. The executing controller must enforce those facts from external evidence; absent such enforcement, the task reports `LIVE_RUNTIME_ENFORCEMENT_UNVERIFIED` and cannot treat the fixture as formal ACK or active authority.

## Branch Rule

A worker may only push branches matching its registry `allowed_branch_pattern`. Workers must not push `main` unless `can_push_main` is true.

A Human-delegated trial candidate may use only the exact non-main branch in its trial record. It may not merge, push main, retarget the branch, broaden scope, or continue after expiry/revocation/first denial.

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

A Human-delegated trial report replaces formal worker identity fields with claimant kind, public Human-authorized classification, private-evidence verification state, lease/revocation state, exact allowed and forbidden scope, bounded output, single-writer evidence, denial log, distinct-review state, and a separate live-runtime-enforcement result. It must omit private source/person/runtime/reference data and state that no formal identity or grant was activated.

## Stop Rule

A worker stops after one task. A worker does not continue to the next task without a new claim cycle.

## Visible Completion State

Every worker report must show this state sequence and the evidence for each completed state:

```text
BOOT
-> CLAIM
-> WORK
-> TEST
-> REPORT
-> REVIEW
-> READY_FOR_PUSH
-> DONE
```

Workers may report `READY_FOR_PUSH` only after their branch, commit, report, tests, and protected-path result are visible. Workers do not self-assign `DONE`; Codex closes the task after review and required merge/push completion.

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

The sole alternative is the fully bound Human-delegated trial path above. If any required trial field is absent or invalid, the candidate also stops with `REGISTRATION_REQUIRED`; if a previously valid trial expires, is revoked, conflicts, leaves scope, or encounters a policy/platform denial, it stops the exact action as `BLOCKED` and records the denial without trying another route.

## R&D Suggestion Rule

Workers may include `Suggested WorkOrders` in their report, but every suggestion starts as `PROPOSED`. A worker must not promote its own suggestion to `DRAFT`, `OPEN`, `CLAIMED`, or `IN_PROGRESS`.

## Violation Handling

If a worker uses the wrong branch, bundles multiple tasks, modifies protected paths, pushes main, omits the report, omits provenance, or bypasses Codex review, Codex records a violation event under `KGEN-KAIOS/workforce/WORKER_AUDIT_LOG.json` or a follow-up audit report. The handoff is blocked or rejected until the evidence is complete.
