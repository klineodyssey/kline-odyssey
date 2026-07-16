---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Define bounded S0 throughput targets and honest bottleneck metrics for Codex Swarm."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/PRIORITY_SCHEDULER.md; KGEN-KAIOS/governance/autopilot/worker-swarm/WORKER_SWARM_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Codex Swarm Capacity Model

## 1. S0 Capacity

V1 defines role quotas, not guaranteed throughput:

| Role pool | Maximum active Clones | Serialization rule |
|---|---:|---|
| Architecture | 2 | Different proposal IDs and non-overlapping write sets |
| Review | 2 | Different target lineages; no shared author identity |
| Dispatcher | 1 | One dispatch mutation transaction at a time |
| Kernel | 1 | No protected CURRENT writes |
| Life | 1 | No Life OS CURRENT writes |
| UI | 1 | Sandbox/non-protected scope only when authorized |
| Git | 1 | One integration/release transaction at a time |
| Documentation | 1 | Shared index updates serialized |
| Testing | 2 | Fixed refs; resource quota applies |
| Company | 1 | Observation, reconciliation and reporting only |

The global limit is 10 active Clones, so role maxima cannot all be consumed simultaneously.

## 2. Capacity Answers

| Requested measure | Architecture target | Current measured state |
|---|---:|---|
| Internal Parallelism | 10 active Claims maximum | 1 Session; runtime not implemented |
| Review Capacity | 2 concurrent reviews | 1 Session |
| Dispatcher Capacity | 1 exclusive operator; queued decisions may accumulate | Manual/non-atomic, no service |
| Architecture Capacity | 4 concurrent non-overlapping lanes across Architecture plus domain specialists | 1 Session |
| Git Capacity | 1 integration at a time | 1 Session |
| Testing Capacity | 2 concurrent fixed-ref test Claims | 1 Session |

Architecture capacity of four means one or two Architecture Clones plus non-overlapping Kernel, Life or UI design work. It does not permit four Clones to edit one baseline.

## 3. Scheduling

Normal company priority remains:

```text
REVIEW
-> REPAIR
-> HUMAN_DECISION
-> ARCHITECTURE
-> IMPLEMENTATION
```

Within Codex organization, allocation additionally considers:

1. role capability;
2. author/reviewer/integrator separation;
3. write-set availability;
4. dependency readiness;
5. source freshness;
6. risk and autonomy ceiling;
7. compute and memory quota;
8. oldest eligible item.

Idle capacity never creates a task. Queue-empty inspection may create observations or proposals only under a separately approved policy.

## 4. Metrics

Future measurement requires:

```text
active_codex_clones
ready_codex_clones
claims_by_role
queue_depth_by_lane
claim_wait_time
review_wait_time
repair_cycle_time
git_integration_wait_time
clone_utilization
average_idle_time
write_set_conflicts
stale_base_rate
recovery_rate
evidence_rejection_rate
human_escalation_rate
```

Current `Monkey Utilization` and `Average Idle Time` are `NOT_MEASURED`; no live registry or telemetry exists. Architecture documents must not invent percentages or durations.

## 5. Bottleneck Analysis

Codex Swarm removes these single-Session pressures at Architecture level:

- architecture authoring can proceed independently of review;
- review can continue while unrelated authoring proceeds;
- Git maintenance no longer consumes the author/reviewer Session;
- testing and documentation can run on fixed, isolated scopes;
- Cursor dispatch has a dedicated non-editing operator.

It deliberately preserves serialized safety points:

- Human/Decision authority;
- atomic Claim allocation;
- same-artifact Review custody;
- shared-index integration;
- main integration and release.

The design shifts the bottleneck from one chat Session to explicit queues and bounded critical sections. That is healthier, observable and recoverable, but not infinitely parallel.

## 6. Enablement Gates

Operational capacity remains zero until all pass:

1. independent Architecture review and approval;
2. Codex derived-actor registry and attestation;
3. canonical atomic Claim authority;
4. Session and checkpoint persistence;
5. worktree and write-set reservation;
6. Review independence enforcement;
7. Git integration queue and exact-tree verification;
8. Human Anchor and autonomy-level enforcement;
9. S0 failure/recovery tests;
10. observability and truthful capacity metrics.

## 7. Readiness Score

| Dimension | Score / 100 |
|---|---:|
| Architecture boundaries | 95 |
| Role separation | 96 |
| Identity and Claim integrity | 91 |
| Worktree isolation | 93 |
| Review independence | 94 |
| Dispatcher safety | 92 |
| Git safety | 94 |
| Recovery design | 84 |
| Observability design | 82 |
| Implementation readiness | 0 |

Overall Architecture readiness is `90 / 100`. Operational bottleneck removal remains `NOT_STARTED`.
