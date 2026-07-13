# KAIOS V11 Mission Runtime Standard

**Document ID:** KAIOS-V11-MISSION-RUNTIME-STANDARD
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / NOT AN ACTIVE RUNTIME
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Purpose

The Mission Runtime Standard adapts the existing KAIOS WorkOrder and claim-lease model to player-owned Agent civilizations. A mission is a governed unit of work with a source, owner, deadline, reward, evidence, review, and recovery path.

## Mission Record

Every future mission requires:

- `mission_id`
- `civilization_id`
- `department_id`
- `source_type`
- `source_id`
- `requester_id`
- `title`
- `objective`
- `priority`
- `deadline`
- `risk_level`
- `status`
- `dependencies`
- `required_skills`
- `required_tools`
- `prohibited_tools`
- `budget_limit`
- `reward_policy_id`
- `primary_agent_id`
- `advisor_agent_ids`
- `reviewer_id`
- `claim_id`
- `lease_expires_at`
- `expected_outputs`
- `acceptance_criteria`
- `evidence_paths`
- `result`
- `recovery_path`
- timestamps and provenance

## Status Model

```text
DRAFT
-> UNDER_REVIEW
-> OPEN
-> CLAIMABLE
-> CLAIMED
-> IN_PROGRESS
-> REPORT_SUBMITTED
-> REVIEW
-> APPROVED
-> REWARD_PENDING
-> DONE
```

Alternative states are `NEEDS_REVISION`, `REJECTED`, `BLOCKED`, `PAUSED`, `EXPIRED`, `CANCELLED`, `NEEDS_REASSIGNMENT`, and `ARCHIVED`.

## Priority

| Priority | Meaning |
|---|---|
| P0 | Safety, Canon, security, or civilization-critical incident |
| P1 | Core mission or dependency blocker |
| P2 | Product, department, economy, or player mission |
| P3 | Documentation, media, publishing, or maintenance |
| P4 | Research, experiment, or optional exploration |

Priority does not override eligibility, dependencies, risk, budget, owner pause, or protected boundaries.

## Automatic Acceptance

An Agent may automatically accept a mission only when every condition is true:

- mission status is `CLAIMABLE`;
- risk is R0 or R1;
- owner policy allows auto-accept for the mission type;
- Agent is active, present, eligible, and within concurrency limit;
- skills and tools satisfy hard requirements;
- dependencies are complete;
- budget is reserved;
- no asset/file/mission conflict exists;
- lease can be created atomically;
- rollback or cancellation is available.

R2 requires explicit reviewer release. R3 requires Human plus Codex review. R4 cannot be automatically accepted or executed.

## Claim Lease

Mission claim leases inherit KAIOS Task Claim principles. One mission has one primary claim. Advisors do not receive write ownership. Heartbeats extend a lease only inside maximum mission duration and budget.

Lease expiry must preserve work evidence and change the mission to `NEEDS_REASSIGNMENT` or `BLOCKED`; it must not silently hand partial state to another Agent.

## Deadline And Stop Conditions

Deadlines are advisory until a mission policy defines consequences. Missing a deadline cannot trigger irreversible punishment or asset transfer automatically.

Every executable mission requires stop conditions for:

- budget exhausted;
- maximum retries reached;
- risk escalation;
- owner pause;
- stale heartbeat;
- invalid output;
- protected-boundary conflict;
- legal/security alert;
- dependency invalidation.

## Evidence And Review

Completion requires outputs, checks, problems, risks, technical debt, evolution opportunities, and Human/Codex review requirements. A mission may generate suggested missions, but they begin as `PROPOSED` or `DRAFT`; the Agent cannot open them itself.

## Reward Boundary

Reward calculation occurs only after review. Rejected missions do not receive full mission reward. Partial rewards require an explicit decision recognizing reusable evidence or recovery value. Rewards may use internal units but cannot imply guaranteed token or fiat value.

## Recovery

Recovery options include retry, revision, reassignment, rollback, archive, or cancellation. Failed missions remain part of Agent history and evolution evidence.

## KGEN Repository Boundary

Player missions do not become repository WorkOrders automatically. Any mission that would modify KGEN files must be promoted through the existing AI WorkOrder review, Worker Registry, branch, report, Codex review, and protected-path gates.
