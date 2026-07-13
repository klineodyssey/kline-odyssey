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
CHANGE_REASON: "Define the V11 multi-agent civilization architecture before implementation."
ANCESTOR: "KGEN-KAIOS/V10/SYSTEM_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Civilization Runtime"
Class: "System Architecture"
Order: "Multi-Agent"
Family: "V11 Genesis Design"
Genus: "KAIOS Architecture"
Species: "KGEN-KAIOS/V11/SYSTEM_ARCHITECTURE.md"
---

# KAIOS V11 System Architecture

## 1. Purpose

KAIOS V11 extends the V10 Operating System into a provider-neutral Multi-Agent Civilization Runtime. A Human player may own and govern a logical AI company, organize Agents into departments, assign missions, evaluate evidence, account for prototype payroll, and preserve each Agent's history without giving an Agent unrestricted authority.

This document is architecture only. It defines boundaries and contracts; it does not deploy a service, create a production database, connect a real payment rail, sign a blockchain transaction, or activate an external AI provider.

## 2. Architectural Principles

1. **Human sovereignty:** the Human owner controls creation, suspension, retirement and high-risk approval.
2. **Provider neutrality:** ChatGPT, Codex, Cursor, Claude, Gemini, OpenHands, Copilot and future providers connect through adapters, not special-case core code.
3. **Durable state:** GitHub and future governed stores hold formal state; hidden chat memory is never the sole source.
4. **Least privilege:** an Agent receives only the capabilities required by a mission.
5. **One active owner:** every mission has one Primary Agent and one review route.
6. **Evidence before reward:** payroll, promotion and evolution require accepted mission evidence.
7. **Review before effect:** protected, regulated, financial, legal and production actions require Codex and/or Human review.
8. **Evolution without Canon override:** Agents may gain skill and context but may not rewrite Genesis, Canon or protected Runtime.
9. **Archive before deletion:** auditable identity, mission and decision history is retained even when an Agent retires.
10. **V10 compatibility:** V11 adds orchestration; it does not replace V10 Portal, Gateway, Service, Runtime, Storage or Audit boundaries.

## 3. Logical Topology

```text
Human / Player
  -> Player Account + Human Override
  -> Civilization Tenant
      -> AI Company
          -> Departments
              -> Agent Registry
                  -> Agent Runtime
                      -> Provider Plugin Adapter
                      -> Skill / Tool Grants
                      -> Mission Claim Lease
                      -> Evidence + Report
          -> Mission Dispatcher
          -> Attendance / Payroll Prototype
          -> Decision + Review Pipeline
      -> Temple / Land / Business / Economy Context
  -> Codex Review Boundary
  -> Approved durable state
```

The existing V10 stack remains below this topology:

```text
Portal -> Frontend -> API Gateway -> Service Layer -> Runtime
       -> Storage -> Analytics -> AI Company -> Audit
```

## 4. Control Plane And Data Plane

### 4.1 Control Plane

The control plane owns identity, policy and transitions:

- Player and Civilization tenancy;
- Agent registration and lifecycle;
- Plugin installation and capability grants;
- Department membership;
- Mission dispatch, claim lease and priority;
- Human override and Codex review;
- risk classification, suspension and recovery; and
- audit event production.

Control-plane commands are idempotent, permission-checked and audit-producing. A provider response never becomes formal state until the relevant runtime validates it.

### 4.2 Data Plane

The data plane carries bounded mission inputs and outputs:

- Canon and approved state snapshots;
- mission context;
- provider requests and responses;
- tool invocation requests and results;
- reports, evidence and review decisions;
- attendance events;
- prototype payroll entries; and
- evolution observations.

Secrets, private keys, seed phrases and unrestricted credentials are excluded from the data plane.

## 5. Core Logical Services

| Service | Responsibility | Authoritative Output |
|---|---|---|
| Identity Service | Resolve Human, Player, Civilization and Agent IDs | identity record |
| Tenant Service | Isolate one player's civilization from another | tenant policy |
| Agent Registry Service | Register Agent identity, provider type and status | agent record |
| Plugin Registry Service | Validate manifests and capability requests | plugin grant |
| Department Service | Assign role, manager, budget class and queue | department membership |
| Mission Dispatcher | Select eligible Agent and issue claim lease | mission assignment |
| Agent Runtime | Execute Boot-to-report lifecycle | mission evidence |
| Memory Service | Store source-attributed memory records | memory reference |
| Attendance Service | Record evidence-backed duty events | attendance event |
| Payroll Service | Calculate prototype rewards from accepted evidence | payroll proposal |
| Evolution Service | Propose skill/rank changes | evolution proposal |
| Review Service | Apply Codex/Human gates | review decision |
| Audit Service | Preserve append-only actions and decisions | audit event |

All services are logical boundaries in Genesis Design. They are not claims of deployed microservices.

## 6. Identity And Tenancy

Every record carries `tenant_id`, `civilization_id` and an immutable domain identifier. Ownership and operational control are distinct:

- `owner_id` identifies the Human or governed organization that owns the Agent record;
- `manager_agent_id` identifies the current operational manager;
- `provider_account_ref` is an opaque external reference and must not contain a secret;
- `runtime_instance_id` identifies one bounded execution context; and
- `authority_scope` lists granted actions, not assumed rights.

Cross-tenant reads are denied by default. Cross-civilization collaboration requires an explicit, time-bounded agreement and produces audit events on both sides.

## 7. Database Draft

V11 proposes a future normalized store plus append-only event log. GitHub remains the design-phase source; no database is created now.

| Draft table / collection | Primary key | Important relations |
|---|---|---|
| `players` | `player_id` | owns civilizations and Agents |
| `civilizations` | `civilization_id` | belongs to player; contains companies |
| `companies` | `company_id` | belongs to civilization |
| `departments` | `department_id` | belongs to company |
| `agents` | `agent_id` | owner, department, provider plugin |
| `agent_runtime_instances` | `runtime_instance_id` | one Agent, one bounded session |
| `plugins` | `plugin_id` | provider-neutral manifest |
| `plugin_grants` | `grant_id` | plugin, tenant, permissions, expiry |
| `missions` | `mission_id` | owner, priority, risk, lifecycle |
| `mission_claims` | `claim_id` | mission, Agent, lease |
| `mission_evidence` | `evidence_id` | mission, report, source hash |
| `memory_records` | `memory_id` | Agent, source, retention class |
| `attendance_events` | `event_id` | Agent, mission, evidence |
| `payroll_entries` | `payroll_id` | accepted mission evidence |
| `evolution_events` | `evolution_event_id` | prior state, proposed state, review |
| `review_decisions` | `review_id` | target record, reviewer, outcome |
| `audit_events` | `audit_event_id` | immutable actor/action trail |

Foreign keys must include tenant scope. Mutable aggregates use optimistic versioning; audit events are append-only. Deletes create tombstones and archival events rather than erasing review evidence.

## 8. Event Model

Minimum events include:

```text
PLAYER_REGISTERED
CIVILIZATION_CREATED
COMPANY_CREATED
AGENT_REGISTERED
PLUGIN_VALIDATED
PLUGIN_GRANTED
MISSION_OPENED
MISSION_CLAIMED
MISSION_STARTED
MISSION_REPORTED
MISSION_REVIEWED
MISSION_DONE
ATTENDANCE_RECORDED
PAYROLL_PROPOSED
PAYROLL_APPROVED
EVOLUTION_PROPOSED
AGENT_SUSPENDED
AGENT_RETIRED
HUMAN_OVERRIDE_RECORDED
```

Each event requires `event_id`, `tenant_id`, actor, timestamp, source state version, target, correlation ID, risk, evidence and schema version.

## 9. Consistency And Recovery

- Claim creation is atomic per mission.
- Provider calls use an idempotency key and may be retried safely.
- Mission state changes use compare-and-set version checks.
- Review decisions never overwrite history; a later decision supersedes by reference.
- Orphaned runtime instances become `STALE` and cannot continue writing.
- Expired claims return to Codex-controlled recovery, not automatic reassignment for high-risk work.
- Provider outage pauses only affected adapters; the civilization state remains readable.
- Audit and evidence records must survive Agent retirement and plugin removal.

## 10. Scale Model

The design supports horizontal partitioning by `tenant_id` and `civilization_id`. A single scheduler must not scan all Agents. Dispatch uses indexed queues by status, priority, department and capability.

| Scale | Design expectation |
|---|---|
| 10 Agents | single tenant, simple queue, full review |
| 50 Agents | department queues and per-provider rate limits |
| 100 Agents | sharded mission workers and event projection |
| 500+ Agents | tenant partitions, distributed leases and backpressure |

The phrase "unlimited Agents" is a product ownership model, not unlimited compute. Quotas, budgets, provider limits and abuse controls remain mandatory.

## 11. Security Boundaries

- External provider credentials stay in approved secret stores.
- A plugin receives short-lived scoped credentials, never repository secrets.
- Tool invocations require explicit capability grants.
- Network egress is deny-by-default for sandboxed Agents.
- Agent-created code cannot deploy itself.
- R3 requires Human plus Codex review; R4 cannot execute.
- Protected paths always require the existing governed review boundary.
- Payroll and banking remain Prototype / Internal Ledger unless separately authorized.

## 12. Compatibility With V10

V11 maps directly onto V10:

| V10 | V11 extension |
|---|---|
| AI Company | per-player AI Company tenant |
| AI Agent Standard | Agent Runtime lifecycle |
| Plugin Standard | provider-neutral Plugin Framework and manifest |
| API Gateway | Player, Agent, Mission and Plugin API draft |
| Membership | player ownership and role scopes |
| Audit Standard | append-only civilization and Agent events |
| Security Standard | plugin sandbox, grants and tenant isolation |

No V10 file is renamed or superseded by this design.

## 13. Architecture Decision Gates

Human review must decide before implementation:

1. tenant and identity authority;
2. first persistent store;
3. first provider adapter;
4. sandbox technology;
5. retention and deletion policy;
6. payroll unit and legal wording;
7. maximum pilot Agent count; and
8. whether GitHub remains the primary control-plane store during Phase 1.

## 14. Status Boundary

- Architecture: **DRAFT_FOR_HUMAN_REVIEW**
- Runtime implementation: **NOT_STARTED**
Production deployment: **PROHIBITED_IN_THIS_PHASE**
