# KAIOS V11 Multi-Agent Standard

**Document ID:** KAIOS-V11-MULTI-AGENT-STANDARD
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Objective

The Multi-Agent Standard defines how one Human Player may govern many AI Agents without confusing player ownership, KAIOS workforce authority, runtime permission, or repository access.

## Civilization Topology

```text
One Human Player
-> One or more Civilization Profiles
-> Many Agent Portfolios
-> Many Departments
-> Many Mission Queues
-> Reviewed Work Evidence
-> Attendance and Prototype Payroll
-> Agent Evolution or Retirement
```

The product may describe a player as owning unlimited Agents, but implementation must apply configurable quotas for compute, concurrent missions, memory retention, storage, cost, rate limits, and review capacity. “Unlimited” means no fixed Canon maximum, not unlimited infrastructure consumption.

## Required Agent Envelope

Every Agent record must eventually include:

- `agent_id`
- `owner_id`
- `civilization_id`
- `name`
- `agent_type`
- `role`
- `primary_department_id`
- `secondary_capabilities`
- `skill_tree`
- `memory_level`
- `trust_score`
- `rank`
- `salary_policy_id`
- `wallet_profile_id`
- `attendance_state`
- `mission_history`
- `lifecycle_state`
- `permission_profile`
- `reviewer_id`
- `created_at`
- `updated_at`
- `provenance`

## Portfolio Rules

1. An Agent belongs to one owner or one explicit shared-custody policy at a time.
2. Shared Agents require a primary accountable owner and a conflict-resolution rule.
3. One Agent may have only one active primary mission unless its trust tier explicitly allows more.
4. Department transfer does not erase prior mission, payroll, attendance, or violation history.
5. A suspended, retired, revoked, or archived Agent cannot accept new missions.
6. Agent creation does not imply KAIOS Worker registration or Git permission.
7. Agent deletion is represented as archive or governed erasure, never silent history removal.

## Runtime Roles

| Role | Responsibility | Prohibited |
|---|---|---|
| Civilization Owner | Portfolio policy, budget, Human approval, retirement | Cannot bypass KGEN Canon or protected paths |
| Department Manager Agent | Recommend assignments, balance queue, report health | Cannot approve itself or alter payroll ledger |
| Specialist Agent | Execute eligible missions | Cannot exceed mission permission or claim unrelated work |
| Advisor Agent | Analyze and propose decisions | Cannot convert recommendation directly to execution |
| Reviewer Agent | Evaluate evidence inside delegated scope | Cannot merge KGEN main unless separately registered and authorized |
| KAIOS Codex Manager | System review, conflict decision, KGEN main authority | Cannot ignore Human gates for R3/R4 actions |

## Scheduling Model

Future scheduling should be capability-based rather than “first Agent wins.” Candidate scoring may consider:

```text
eligibility
× skill_match
× trust_factor
× availability
× deadline_fit
× cost_fit
× conflict_free
```

The dispatcher must first pass hard gates: owner authorization, active status, department permission, mission risk, no conflicting claim, resource quota, and fresh heartbeat. A high score cannot bypass a failed hard gate.

## Concurrency And Isolation

- Each Agent receives an isolated logical desk or runtime context.
- Claims use leases and heartbeat expiry.
- Same mission cannot be claimed by two primary Agents.
- Advisors may contribute proposals without becoming primary owners.
- Shared files require ownership rules or explicit integration tasks.
- Player Agent missions cannot write KGEN GitHub main by default.

## Memory Model

Memory is categorized as:

| Level | Scope | Example |
|---|---|---|
| M0 | Stateless | Current prompt and mission inputs only |
| M1 | Mission | Mission evidence and temporary working context |
| M2 | Role | Approved role knowledge and reusable procedures |
| M3 | Department | Shared department decisions and standards |
| M4 | Civilization | Owner-approved long-term civilization memory |
| M5 | Canon Reference | Read-only KGEN Canon and formal system rules |

Memory level controls access scope, not intelligence. Sensitive memory must follow privacy, retention, provenance, and revocation policies. Hidden chat memory cannot be the only source of truth.

## Failure And Recovery

If an Agent disappears, loses heartbeat, exceeds budget, violates permission, or produces invalid evidence:

1. stop or expire the claim;
2. preserve branch/report/state evidence;
3. mark mission `BLOCKED` or `NEEDS_REASSIGNMENT`;
4. freeze related payroll calculation;
5. notify manager and owner;
6. reassign only after conflict and stale-state checks;
7. retain failure memory for future evolution review.

## V10 Compatibility

V11 extends rather than replaces:

- V10 membership roles with civilization ownership roles;
- V7.1 Worker Registry with owner-scoped Player Agent Registry;
- Task Claim Lease with mission claim leases;
- Workforce Attendance with player-agent attendance events;
- Workforce Compensation with civilization prototype payroll policies;
- V9 Decision/WorkOrder review with player-level proposals and Codex/Human escalation.

## Design Gate

No multi-agent scheduler, registry service, autonomous recruitment, or runtime executor may be implemented until the Human approves the identity separation, resource quota policy, permission model, and mission claim rules.
