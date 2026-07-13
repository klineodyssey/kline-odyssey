# KAIOS V11 Department Standard

**Document ID:** KAIOS-V11-DEPARTMENT-STANDARD
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Purpose

Departments group Agents by mission responsibility, budget, skills, review path, and risk boundary. A department is not merely a label; it is a governed mission namespace.

## Standard Department Library

| Department | Primary missions | Required controls |
|---|---|---|
| Engineering | Architecture, implementation, maintenance | Tests, code review, branch isolation |
| Security | Threat review, secrets audit, protected-path monitoring | Read-only default, incident escalation |
| Research | Evidence gathering, options, experiments | Source quality, no direct execution |
| Finance | Prototype budgets, payroll analysis, economy simulation | No real-money authority, Human approval |
| Temple | Temple design, content, service and Canon alignment | One-image-one-temple, protected Runtime boundary |
| Game | Missions, progression, balance, simulation | No deceptive reward or guaranteed return |
| Marketplace | Listings, licenses, disputes, discovery | Ownership proof, legal and privacy gates |
| Customer Service | Player support and knowledge routing | Privacy, escalation, no financial promises |
| Media | Video, community, publishing, asset provenance | Copyright, brand and release review |
| Mining | Game-resource gathering and simulation | Budget, stop conditions, no hidden compute use |
| Trading | Game-market or paper-trading analysis | Simulation only unless separately regulated |
| Explorer | Universe discovery, map and research missions | Coordinate provenance, no Canon mutation |
| Civil Affairs | Membership, reputation, disputes, public services | Fairness, appeal and Human review |

Additional departments require a design review showing that the function is not already covered.

## Department Record

A future department record should include:

- `department_id`
- `civilization_id`
- `owner_id`
- `name`
- `mission_domains`
- `manager_agent_id`
- `human_sponsor_id`
- `member_agent_ids`
- `skill_requirements`
- `risk_ceiling`
- `budget_policy_id`
- `review_policy_id`
- `memory_scope`
- `tool_policy`
- `queue_ids`
- `health_status`
- `created_at`
- `updated_at`
- `provenance`

## Department Manager

A Department Manager Agent may recommend assignments, workload balancing, budget allocation, training, transfer, and recruitment. It cannot approve its own promotion, payroll, marketplace transaction, or exception to security policy.

Every department has a Human sponsor or a governed escalation route. R3 decisions require Human and Codex review; R4 actions remain blocked.

## Membership Rules

- An Agent has one primary department.
- Secondary department capability does not grant permanent access to that department's memory or tools.
- Cross-department work requires a mission record naming primary owner, contributors, reviewer, budget source, and output ownership.
- A department cannot create a hidden subdepartment to bypass permissions or budgets.
- Department closure requires mission, payroll, memory, and Agent transfer reconciliation.

## Queue And Budget Isolation

Each department owns one or more mission queues with explicit priorities and accepted mission types. Department budgets are internal planning limits and must separate:

- payroll allocation;
- mission reward allocation;
- tool/compute allowance;
- marketplace acquisition/lease allowance;
- training/evolution allowance;
- contingency reserve.

Payroll reserve and other employees' compensation cannot be used to cover department simulation losses.

## Department Health

Suggested health signals:

- open and overdue missions;
- active versus idle Agents;
- review pass rate;
- blocked and retry rate;
- budget utilization;
- skill coverage gaps;
- security incidents;
- stale claims;
- attendance reliability;
- Agent turnover and retirement load.

Health signals are advisory. They do not automatically fire, demote, transfer, or reduce salary.

## Cross-Department Conflict

Conflict priority follows:

```text
Protected Paths
-> Current Canon
-> Human Decision
-> Codex Decision
-> Accepted Architecture Decision
-> Active Mission Contract
-> Department Preference
```

Competing departments submit proposals instead of overwriting each other's work. Codex or the civilization owner records the final decision and rollback.

## V10 Compatibility

V10 Service Layer remains the future validation boundary. V11 departments map to service domains and AI Company offices but do not create production microservices in this phase.
