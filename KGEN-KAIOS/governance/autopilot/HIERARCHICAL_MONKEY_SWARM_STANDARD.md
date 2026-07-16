---
TITLE: "Hierarchical Monkey Swarm Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
ANCESTOR: "worker-swarm/WORKER_SWARM_RUNTIME.md; MONKEY_SWARM_REVIEW_RUNTIME.md"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/HIERARCHICAL_MONKEY_SWARM_STANDARD.md"
---

# Hierarchical Monkey Swarm Standard

## 1. Purpose

This standard replaces the unbounded single-Dispatcher assumption with bounded control domains. It is an architecture amendment, not an enabled distributed service.

## 2. Control Hierarchy

```text
Human PrimeForge
-> Codex General Manager
-> Federation Controller
-> Region Controller
-> Company Controller
-> Department Dispatcher
-> Monkey Squad Leader
-> Monkey Clone
```

Each node manages only direct registered children. Authority flows down through signed or otherwise integrity-protected envelopes; evidence, health and review outcomes flow up. No child may bypass a parent controller or contact Human as a dispatch transport.

## 3. Supported Scale

V1 architecture is bounded to S0 and S1:

- S0: 1-10 Workers, one local Company partition.
- S1: 11-1,000 Workers, multiple bounded squads and departments.
- S2: future federation architecture.
- S3: not supported and not claimed.

S1 requires partitioned registries, local aggregation and explicit failure domains. A successful S0 test does not prove S1 readiness.

## 4. Mandatory Quotas

Every controller and Clone budget declares:

```text
max_workers
max_sessions
max_active_claims
max_spawn_rate
max_compute_budget
max_memory
max_event_rate
max_retry_rate
max_recovery_rate
```

No quota means no spawn. A child cannot increase its own quota. Parent capacity is not implicitly available to children.

## 5. Clone Spawn Budget

`CLONE_SPAWN_BUDGET` requires:

```text
spawn_budget_id
human_authority_ref
dispatcher_id
parent_controller_id
parent_clone_id
allowed_worker_types
max_clones
max_concurrent_sessions
authorized_tasks
authorized_paths
compute_budget
memory_budget
network_policy
starts_at
expires_at
fencing_epoch
revocation_state
```

Creation is denied when the budget is absent, expired, exhausted, revoked, outside scope or inconsistent with canonical Claim state.

## 6. Squad Rules

- A Squad Leader coordinates bounded child Clones but cannot review its own squad's evidence.
- Squad size is a policy value constrained by parent quota; it is not hard-coded as a planetary constant.
- One Clone holds at most one active Claim.
- One Task has one Primary Owner.
- Cross-squad work requires an integration owner and non-overlapping Task Envelopes.
- Clone creation and Claim allocation are separate atomic decisions.

## 7. Hierarchical Heartbeat

```text
Clone Heartbeat
-> Squad Aggregator
-> Department Aggregator
-> Regional Health Summary
-> Company Health
```

Clone heartbeats are adaptive and jittered. Active workers report more frequently; idle or stable workers back off. Aggregators send batches and state changes rather than forwarding every raw event. Lease expiry and fencing tokens remain authoritative; heartbeat is only a liveness signal.

Required mechanisms:

- adaptive interval;
- randomized jitter;
- batch heartbeat;
- health summary;
- failure suspicion window;
- exponential backoff;
- lease expiry;
- fencing token;
- per-layer event-rate quota.

Raw heartbeat telemetry receives a disposable retention class and is never kept forever.

## 8. Failure Domains

Clone, Squad, Department, Company and Region are explicit failure domains. A lower-domain failure is contained locally when possible. Recovery cannot recursively spawn unlimited replacements; `max_recovery_rate` and a circuit breaker bound cascades.

## 9. Observability Hierarchy

```text
Clone Telemetry
-> Squad Summary
-> Department Summary
-> Region Summary
-> Company Dashboard
```

Minimum metrics are active workers, Claim latency, review latency, failure rate, recovery rate, heartbeat health, queue depth, evidence integrity, resource usage, authority level and architecture drift. Higher layers receive aggregates and alerts, not permanent raw telemetry.

## 10. Collaboration and Collusion Boundary

The Registry records owner, parent, reviewer, contribution and shared-resource relationships. Clones controlled by the same Owner cannot review each other. Reviewer rotation, contribution caps, conflict-of-interest detection and anomaly signals are mandatory before S1 enablement.

## 11. Enablement Gate

This hierarchy remains design-only until canonical Claim authority, identity attestation, quotas, heartbeat aggregation, failure containment, observability and security conformance tests pass.

```text
Architecture: MAJOR_REVISION_IN_PROGRESS
S0/S1: ARCHITECTURE_TARGET
S2: FUTURE
S3: NOT_SUPPORTED
Runtime enabled: false
```
