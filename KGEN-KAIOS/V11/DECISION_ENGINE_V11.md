# KAIOS V11 Civilization Decision Engine

**Document ID:** KAIOS-V11-DECISION-ENGINE
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Purpose

The V11 Decision Engine governs player-level Agent portfolios, departments, missions, payroll, marketplace actions, and evolution. It extends the existing KAIOS General Manager Decision Engine; it does not replace Codex or Human authority over KGEN system operations.

## Decision Levels

| Level | Scope | Default authority |
|---|---|---|
| D0 Agent | Mission method and low-risk local choice | Assigned Agent within mission policy |
| D1 Department | Queue ordering, recommendation, low-risk allocation | Department Manager plus audit |
| D2 Civilization | Agent recruitment, transfer, budget, promotion, marketplace terms | Human Player or delegated policy |
| D3 KAIOS | WorkOrder promotion, repository changes, system policy | Codex Review |
| D4 Human Critical | Legal, security, financial, protected, irreversible, R3 | Human plus Codex |
| D5 Prohibited | R4 or disallowed action | BLOCKED; alert only |

## Decision Types

- `APPROVE`
- `REJECT`
- `ESCALATE`
- `BLOCK`
- `PAUSE`
- `REASSIGN`
- `PROMOTE`
- `DEMOTE`
- `TRANSFER`
- `RETIRE`
- `ARCHIVE`
- `BUDGET_ADJUST`
- `PAYROLL_APPROVE`
- `MARKETPLACE_APPROVE`
- `ROLLBACK`

## Required Decision Record

Every material decision requires:

- `decision_id`
- `civilization_id`
- `owner_id`
- `decision_level`
- `decision_type`
- `time`
- `decision_maker`
- `source_state`
- `reason`
- `options`
- `chosen_option`
- `rejected_alternatives`
- `risk_level`
- `assumptions`
- `affected_agents`
- `affected_departments`
- `affected_missions`
- `affected_budgets`
- `expected_result`
- `rollback`
- `human_review_required`
- `codex_review_required`
- `status`
- evidence and provenance

## Decision Flow

```text
OBSERVE
-> ANALYZE
-> PROPOSE
-> RISK_CLASSIFY
-> CHECK AUTHORITY
-> APPROVE / REJECT / ESCALATE / BLOCK
-> EXECUTE ONLY IF AUTHORIZED
-> VERIFY
-> AUDIT
-> ROLLBACK OR CLOSE
```

An Agent recommendation is never execution authority by itself.

## Risk Gates

| Risk | Decision rule |
|---|---|
| R0 | Agent or department may act within an approved policy |
| R1 | Delegated action allowed with audit and rollback |
| R2 | Explicit reviewer approval required |
| R3 | Human Player plus Codex review required where KGEN/system boundaries are involved |
| R4 | Cannot execute; block, preserve evidence, and alert |

Financial transfer, wallet signing, real employment/legal commitment, marketplace custody, memory export, protected paths, production deployment, and KGEN main merge are never treated as ordinary low-risk Agent decisions.

## Human Override

Human may approve, reject, pause, change priority, reassign, block, retire, archive, or request rollback. Override records must state previous decision, new decision, reason, identity, time, affected records, risk, and recovery impact.

Human override cannot lawfully authorize secret leakage, private-key exposure, unlicensed financial services, or removal of mandatory audit evidence.

## Codex Boundary

Codex remains the KGEN General Manager for repository WorkOrders, protected paths, Canon, Runtime governance, main merge, and system publication. A civilization owner may govern its Player Agents but cannot convert them into KGEN Workers or main-branch authorities without workforce onboarding.

## Conflict Resolution

When Agents disagree:

1. preserve each proposal;
2. compare evidence and source versions;
3. apply Canon, owner policy, mission contract, risk, and budget;
4. detect conflicts of interest;
5. escalate to department/civilization manager;
6. escalate to Codex or Human for system/high-risk issues;
7. record chosen and rejected alternatives;
8. retain rollback.

## Decision Health

Metrics may include decision latency, reversal rate, evidence completeness, escalation rate, blocked-risk detection, duplicate decisions, Human override frequency, and outcome accuracy. Metrics are diagnostic and cannot automatically remove Human rights or punish Agents.

## Non-Execution Rule

This document defines governance only. It does not add an autonomous decision service, API, model, database, worker, scheduler, or execution hook.
