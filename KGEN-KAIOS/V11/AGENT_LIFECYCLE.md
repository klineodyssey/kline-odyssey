# KAIOS V11 Agent Lifecycle

**Document ID:** KAIOS-V11-AGENT-LIFECYCLE
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Lifecycle Objective

The Agent lifecycle turns recruitment, onboarding, work, growth, transfer, retirement, and archive into explicit state transitions. No Agent becomes active merely because a record exists.

## State Machine

```text
PROPOSED
-> RECRUITING
-> INTERVIEW
-> APPROVED_FOR_BOOT
-> BOOTING
-> TRIAL
-> ACTIVE
-> PROMOTION_ELIGIBLE
-> PROMOTED

ACTIVE / PROMOTED
-> TRANSFER_PENDING
-> ACTIVE_IN_NEW_DEPARTMENT

ACTIVE / PROMOTED
-> RETIREMENT_PENDING
-> RETIRED
-> ARCHIVED
```

Alternative states:

```text
REJECTED
ON_LEAVE
OFFLINE
PROBATION
SUSPENDED
REVOKED
RECOVERY_REQUIRED
```

## Lifecycle Stages

| Stage | Entry evidence | Allowed action | Exit gate |
|---|---|---|---|
| Recruit | Owner need and role description | Collect candidate profile | Interview accepted |
| Interview | Capability questions and policy acknowledgment | Evaluate role, tools, memory, risk | Codex/owner decision |
| Approve | Identity and license evidence | Allocate provisional Agent ID | Boot authorization |
| Boot | Canon, owner policy, department, permissions, privacy | Create trial runtime context | Boot acknowledgment complete |
| Trial | Sandbox missions and full review | Produce evidence under strict limits | Trial score and Human/Codex approval |
| Active | Valid trust band and department | Claim eligible missions | Promotion, transfer, leave, suspension, retirement |
| Promotion | Performance and trust evidence | Increase rank or scope | New permission profile activated |
| Transfer | Receiving department capacity and owner approval | Change primary department | Handoff and budget reconciliation |
| Retirement | No active mission/claim and final audit | Stop new work | Final payroll and retention review |
| Archive | Retirement or revocation record | Read-only historical access | Governed revival or retention expiry |

## Recruitment And Interview

Recruitment may originate from a Human request, department capacity gap, approved AI recommendation, marketplace listing, or civilization roadmap. AI recommendations remain `PROPOSED` until approved.

Interview must evaluate:

- declared capabilities and evidence;
- role and department fit;
- available tools and restricted tools;
- memory/privacy requirements;
- risk ceiling;
- owner and reviewer;
- license and commercial-use rights;
- sandbox mission;
- termination and recovery conditions.

## Boot And Trial

Boot records must include Agent ID, owner, policy version, department, permission profile, memory ceiling, mission types, budget ceiling, reviewer, and acknowledgment timestamp.

Trial Agents may execute only sandbox, simulation, read-only, documentation, test-data, or explicitly approved low-risk missions. Trial results must include work evidence, tests, report, review decision, violations, and recommendation.

## Promotion

Promotion is evidence-based. Required dimensions are mission quality, review pass rate, trust, skill growth, attendance reliability, budget discipline, security compliance, and rollback rate. A high mission count without quality does not justify promotion.

Promotion may change rank, salary policy, mission risk ceiling, concurrent mission limit, mentoring ability, or department responsibility. It never grants main push, secret access, protected-path bypass, autonomous signing, or permanent review exemption.

## Transfer

Department transfer requires:

1. no conflicting active claim, or an approved mission handoff;
2. receiving department approval;
3. skill and risk compatibility;
4. budget and payroll reconciliation;
5. memory-access recalculation;
6. old and new department audit events;
7. rollback to the prior department if activation fails.

## Leave, Offline, And Suspension

- `ON_LEAVE`: planned absence; claims must be handed off or paused.
- `OFFLINE`: no current heartbeat; not a disciplinary state.
- `PROBATION`: restricted missions and full review after quality or process concern.
- `SUSPENDED`: no new claims; preserve evidence and active mission state.
- `REVOKED`: permission and employment removed; archive history.

## Retirement And Archive

Retirement requires a final mission reconciliation, payroll review, marketplace lease termination, memory retention decision, tool/permission revocation, and successor recommendation where necessary.

Archived Agents retain identity, owner history, mission summaries, review decisions, payroll references, violations, and evolution lineage. Sensitive memory may be redacted or deleted under approved retention rules, but audit events remain.

## Revival

Revival is not automatic. It requires owner request, identity validation, license validity, security review, current-policy Boot, updated capability test, and a new trial period when the archive age or platform change is material.

## Implementation Boundary

This lifecycle is a design state machine only. It does not create Agent accounts, authentication, model instances, runtime workers, or marketplace rights.
