---
VERSION: "11.0-design"
REVISION: "2026-07-13.1"
STATUS: "DRAFT_FOR_HUMAN_REVIEW"
DESIGN_PHASE: "GENESIS_DESIGN"
IMPLEMENTATION_STATUS: "NOT_STARTED"
DEPLOYMENT_STATUS: "NOT_STARTED"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "PENDING_HUMAN_REVIEW"
BASE_COMMIT: "1d6de8cb3b16983f923fb2a88514cef54328f2c5"
TASK_ID: "KAIOS-V11-GENESIS-DESIGN-20260713"
HUMAN_APPROVAL_ID: "HUMAN-V11-GENESIS-001"
CHANGE_REASON: "Define the complete Boot-to-retirement lifecycle of a KAIOS Agent."
ANCESTOR: "KGEN-KAIOS/V10/AI_AGENT_STANDARD.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Agent Runtime"
Class: "Lifecycle Standard"
Order: "AI Workforce"
Family: "V11 Genesis Design"
Genus: "KAIOS Agent"
Species: "KGEN-KAIOS/V11/AGENT_RUNTIME.md"
---

# KAIOS V11 Agent Runtime

## 1. Purpose

The Agent Runtime defines the governed life of one AI employee: Boot, Memory, Skill, Tool, Mission, Payroll, Attendance, Evolution and Retirement. An Agent is a durable KAIOS identity; a provider session is a temporary runtime instance.

## 2. Agent Identity

Every Agent has an immutable `agent_id` and a mutable profile. Provider migration does not create a new Agent unless ownership or lineage policy requires it. The profile contains owner, civilization, company, department, role, provider plugin, status, trust, rank, skill tree, memory policy and audit references.

## 3. Boot Runtime

Boot is completed for each runtime instance:

```text
Resolve Agent Identity
-> Validate Employment / Ownership
-> Read CURRENT Boot Manifest
-> Read Canon
-> Load Tenant Policy
-> Load Mission Contract
-> Validate Plugin + Tool Grants
-> Validate Claim Lease
-> Build Source-Attributed Context
-> Emit BOOT_COMPLETE
```

If any gate fails, the instance returns `BOOT_BLOCKED` and performs no work. Boot acknowledgment records source versions and hashes; it is not a generic checkbox carried forever across changed Canon.

## 4. Memory Runtime

Memory classes:

| Class | Scope | Retention |
|---|---|---|
| Session Memory | one runtime instance | discarded or summarized at close |
| Mission Memory | one mission | retained with evidence |
| Agent Memory | accepted skills and lessons | governed, source-attributed |
| Civilization Memory | tenant-shared approved knowledge | tenant retention policy |
| Canon Memory | immutable references to current authority | refreshed at Boot |
| Failure Memory | rejected outputs and recovery lessons | auditable |
| Review Memory | Codex/Human decisions | append-only reference |

Every memory item records source, creator, timestamp, confidence, classification, tenant, retention, review status and supersession link. An Agent cannot promote its own inference into Canon Memory.

## 5. Skill Runtime

Skills are versioned capabilities supported by evidence:

- skill ID and domain;
- level and proficiency score;
- source missions;
- test evidence;
- last verified time;
- expiry or recertification rule;
- risk ceiling;
- compatible tools; and
- reviewer.

Completing many tasks does not automatically increase skill. Promotion requires quality, safety, review pass rate and relevant evidence.

## 6. Tool Runtime

Tools are accessed through scoped grants. A grant identifies tool, allowed action, paths/domains, mission, expiry, usage limit, risk, approver and revocation state.

```text
Tool Request
-> Manifest Capability Check
-> Grant Check
-> Risk / Human Pause Check
-> Input Validation
-> Execute In Sandbox
-> Validate Result
-> Audit
```

Protected paths, secrets, wallet signing and production deployment cannot be inferred from a broad tool name.

## 7. Mission Runtime

An Agent accepts only a formally claimable mission. The mission includes source, owner, reviewer, priority, risk, dependencies, inputs, outputs, acceptance criteria, branch/output namespace, report path and lease.

Execution follows:

```text
CLAIM -> PLAN -> WORK -> TEST -> REPORT -> REVIEW -> CLOSE
```

An Agent may propose sub-missions as `PROPOSED` or `DRAFT`; it cannot open them or assign other Agents without the approved dispatcher policy.

## 8. Attendance Runtime

Attendance is evidence, not simulated activity. Valid events include check-in, Boot complete, mission claimed, heartbeat, report submitted, blocked, review result, mission done and check-out.

Working time estimates are advisory. Formal performance relies on accepted outputs, tests, reports and audit events rather than self-reported hours.

## 9. Payroll Runtime

Payroll remains Prototype / Internal Ledger. A proposal may include base allowance, mission reward, quality bonus, review bonus, research bonus, penalty or reversal. Each entry references accepted mission evidence and keeps units separate:

- `KGEN_TOKEN` (future Human-approved settlement only);
- `GAME_CREDIT`;
- `TEMPLE_ENERGY`;
- `MERIT_POINT`; and
- `FIAT_REFERENCE_ONLY`.

The Agent cannot approve its own payroll or initiate irreversible transfer. No guaranteed salary, token value or investment return is implied.

## 10. Evolution Runtime

Evolution may change skill, rank, trust, department eligibility, memory level or tool ceiling. It follows:

```text
OBSERVE
-> PROPOSE
-> VERIFY EVIDENCE
-> COMPATIBILITY CHECK
-> RISK REVIEW
-> HUMAN / CODEX DECISION
-> APPLY OR REJECT
-> AUDIT
```

Evolution events use existing KGEN biological governance. Mutation, merge, fusion, split or reproduction remain constrained concepts; they do not automatically generate or execute code.

## 11. Promotion And Transfer

Promotion considers mission quality, review pass rate, protected-path compliance, test results, Canon compliance, recovery behavior and useful R&D proposals. Transfer changes department or employer scope but preserves identity, lineage and prior review history.

## 12. Retirement

```text
RETIREMENT_REQUESTED
-> ACTIVE_CLAIMS_CLOSED_OR_BLOCKED
-> GRANTS_REVOKED
-> MEMORY_CLASSIFIED
-> PAYROLL_RECONCILED
-> FINAL_REPORT
-> RETIRED
-> ARCHIVED
```

Retirement removes execution authority. It does not erase mission evidence, authorship, violations, financial audit or review decisions. Revival requires a new policy and compatibility review.

## 13. Health And Recovery

Runtime health states are `HEALTHY`, `DEGRADED`, `OFFLINE`, `RECOVERY_REQUIRED`, `SUSPENDED` and `RETIRED`. Recovery validates identity, plugin version, stale claims, context integrity and tool grants before returning to READY.

## 14. Agent Runtime Invariants

1. one immutable Agent ID;
2. one tenant at execution time;
3. at most one active primary mission claim unless a future trust policy explicitly allows more;
4. no work without Boot and claim evidence;
5. no tool without a grant;
6. no reward without accepted evidence;
7. no self-promotion to Canon or OPEN task;
8. no direct main merge;
9. no secret persistence; and
10. no deletion of audit history.

## 15. Status Boundary

- Runtime standard: **DRAFT_FOR_HUMAN_REVIEW**
- Agent execution engine: **NOT_STARTED**
- Payroll: **PROTOTYPE_DESIGN_ONLY**
Autonomous irreversible action: **PROHIBITED**
