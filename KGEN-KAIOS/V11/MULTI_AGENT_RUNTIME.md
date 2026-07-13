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
CHANGE_REASON: "Design multi-agent scheduling, isolation, claims, evidence and recovery."
ANCESTOR: "KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Civilization Runtime"
Class: "Runtime Standard"
Order: "Multi-Agent"
Family: "V11 Genesis Design"
Genus: "Agent Coordination"
Species: "KGEN-KAIOS/V11/MULTI_AGENT_RUNTIME.md"
---

# KAIOS V11 Multi-Agent Runtime

## 1. Runtime Objective

The Multi-Agent Runtime coordinates many independently registered Agents for one or more player-owned civilizations. It extends the existing Worker Registry, WorkQueue, Claim Lease, Message Bus and Review Pipeline rather than replacing them.

The Runtime guarantees bounded ownership, one primary claim per mission, durable evidence and review-controlled effects. It does not guarantee that an AI provider is available, correct or safe.

## 2. Runtime Entities

| Entity | Purpose |
|---|---|
| `Agent` | durable worker identity owned by a player or governed company |
| `Runtime Instance` | one bounded execution session |
| `Department` | capability and budget routing boundary |
| `Mission` | desired outcome with risk and acceptance criteria |
| `Claim Lease` | exclusive time-bounded reservation |
| `Capability Grant` | permission to use one tool or data scope |
| `Context Bundle` | immutable references supplied for one mission |
| `Evidence Bundle` | outputs, tests, hashes and report references |
| `Review Decision` | Codex/Human outcome |
| `Evolution Proposal` | requested skill, rank or policy change |

## 3. Agent Runtime State Machine

```text
REGISTERED
-> BOOTING
-> READY
-> CLAIMED
-> WORKING
-> REPORTING
-> WAITING_REVIEW
-> IDLE
```

Exceptional transitions:

```text
BOOTING / WORKING -> BLOCKED
WORKING -> OFFLINE -> RECOVERY_REQUIRED
READY / IDLE -> SUSPENDED
IDLE / SUSPENDED -> RETIRED -> ARCHIVED
```

Only validated transitions emit formal events. A provider message cannot directly alter lifecycle state.

## 4. Mission State Machine

The existing KAIOS lifecycle remains authoritative:

```text
DRAFT -> OPEN -> CLAIMED -> IN_PROGRESS -> REVIEW
      -> APPROVED -> MERGED -> DONE
```

Failure paths remain:

```text
REVIEW -> REJECTED -> FIX -> REVIEW
ANY_ACTIVE_STATE -> BLOCKED
```

V11 adds tenant, department, capability and budget checks before `OPEN` and before `CLAIMED`.

## 5. Dispatch Algorithm

Dispatch is deterministic and explainable:

1. filter missions by tenant and `OPEN` status;
2. remove missions with unresolved dependencies or active holds;
3. filter Agents by registry status, department, skill and permission;
4. remove Agents with active claims, expired heartbeat or suspension;
5. enforce provider quota, cost budget and risk ceiling;
6. rank by priority, dependency completion, oldest-ready time and capability fit;
7. issue one lease with a unique `claim_id`; and
8. publish the assignment event.

Automatic claiming is permitted only in a future Human-approved implementation policy. Genesis Design specifies the checks but performs no claim.

## 6. Claim Lease Contract

Every claim includes:

- `claim_id`, `mission_id`, `agent_id`, `tenant_id`;
- `base_state_version` and source commit or snapshot;
- `branch` or execution namespace;
- `claimed_at`, `lease_expires_at`, heartbeat interval;
- required report and evidence paths;
- capability grants;
- risk level and review route; and
- cancellation and recovery instructions.

The lease is exclusive for the mission's Primary Agent. Advisors may read a bounded context but cannot write to the same output scope.

## 7. Context Assembly

Context is assembled from approved references:

1. CURRENT Boot;
2. Machine Canon;
3. relevant Runtime and World State snapshots;
4. mission specification and dependencies;
5. ownership and permission records;
6. previous accepted reports; and
7. explicit Human instructions.

Each context item carries a URI/path, version or commit, hash where available, classification and retention policy. Hidden chat memory may assist reasoning but cannot be the only evidence for a formal decision.

## 8. Communication Model

Agents communicate through the KAIOS Message Bus abstraction:

- mission events;
- context references;
- reports;
- review decisions;
- blocked notices;
- advisory proposals; and
- recovery instructions.

Messages require `message_id`, sender, recipient or topic, tenant, correlation ID, schema version, timestamp, expiry and payload reference. Free-form inter-Agent chat is non-authoritative.

## 9. Tool Execution

An Agent may invoke a tool only when all are true:

- the plugin manifest declares the tool;
- a grant exists for the current tenant and mission;
- the risk level is within the Agent's trust ceiling;
- input passes schema validation;
- rate and cost limits remain available; and
- no Human pause or system suspension is active.

Tool output is untrusted until validated. Side-effect tools require a two-step prepare/approve model. Irreversible effects remain Human-controlled.

## 10. Multi-Agent Collaboration Patterns

V11 permits four governed patterns:

| Pattern | Rule |
|---|---|
| Primary + Advisors | one Agent writes; Advisors submit proposals |
| Pipeline | each Agent owns a separate stage and artifact |
| Review pair | Worker submits; Reviewer evaluates without editing output |
| Department coordinator | manager decomposes a mission into DRAFT sub-missions for approval |

Unbounded swarms, shared writable folders and multiple Agents committing to one branch are prohibited.

## 11. Failure And Recovery

| Failure | Runtime response |
|---|---|
| heartbeat expired | freeze claim; preserve branch and evidence |
| provider unavailable | mark instance OFFLINE; keep mission BLOCKED |
| duplicate claim | reject later claim and emit conflict event |
| stale base | stop write actions and request rebase/reissue |
| invalid report | return mission to FIX or NEEDS_REVISION |
| tool policy breach | revoke grant and suspend instance |
| protected-path attempt | immediate BLOCKED plus Codex/Human review |
| context corruption | quarantine bundle; rebuild from authoritative sources |

Recovery never deletes the failed branch, report or audit history.

## 12. Scheduling Fairness And Backpressure

- Per-player queues prevent one civilization from consuming all capacity.
- Department quotas prevent a single function from starving Security or Operations.
- Provider rate limits are separate from mission priority.
- High-risk missions cannot bypass review due to queue age.
- Cost budget exhaustion pauses new claims without invalidating accepted work.
- Backpressure exposes `WAITING_CAPACITY`, `WAITING_BUDGET` and `WAITING_PROVIDER` rather than silently dropping missions.

## 13. Observability

Required metrics include:

- registered, ready, working, blocked and offline Agents;
- claim latency, lease expiry and duplicate claim count;
- mission completion and review pass rates;
- provider error and throttle rates;
- tool denials and protected-path alerts;
- context size and cost estimates;
- evidence completeness; and
- recovery duration.

Metrics must not expose prompts containing secrets, personal data or private credentials.

## 14. Acceptance Criteria For Future Implementation

A future sandbox implementation must demonstrate:

1. two provider adapters can execute the same mock mission contract;
2. duplicate claims are rejected atomically;
3. a missing heartbeat freezes the claim without data loss;
4. a Human pause prevents further tool calls;
5. reports and evidence are source-attributed;
6. an Agent cannot access another tenant's context;
7. protected paths remain blocked; and
8. no Agent can merge or deploy without the existing review boundary.

## 15. Status Boundary

- Runtime design: **DRAFT_FOR_HUMAN_REVIEW**
- Scheduler implementation: **NOT_STARTED**
- Automatic claim: **DISABLED**
Production execution: **NOT_AUTHORIZED**
