---
TITLE: "KAIOS Worker Swarm Runtime Architecture Index"
VERSION: "0.2.0"
REVISION: "2026-07-16.2"
STATUS: "INTERNAL_REVIEW_COMPLETE_BASELINE_HOLD"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex delegated GM internal review; external or Human baseline review required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
HUMAN_DECISION_ID: "HUMAN-WORKER-SWARM-RUNTIME-001; HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define and internally review the Company Runtime worker coordination layer without claiming that architecture is an implemented atomic dispatcher."
ANCESTOR: "KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md; KGEN-KAIOS/TASK_DISPATCHER.md; KGEN-KAIOS/workforce/AGENT_WORKFORCE_V2_STANDARD.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "CivilizationLifeform"
PHYLUM: "GovernanceArchitecture"
CLASS: "CompanyRuntimeCoordination"
ORDER: "WorkerSwarm"
FAMILY: "KAIOS"
GENUS: "WorkerCoordinationLayer"
SPECIES: "KAIOSWorkerSwarmArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/README.md"
---

# KAIOS Worker Swarm Runtime

## Status

| Boundary | State |
|---|---|
| Architecture | `INTERNAL_REVIEW_COMPLETE_BASELINE_HOLD` |
| Company coordination layer | `DESIGNED` |
| New Kernel | `NO` |
| Implementation | `NOT_STARTED` |
| WorkQueue | `NOT_CREATED` |
| Commit / Push | `AUTHORIZED_FOR_PROPOSAL_PUBLICATION` |
| Deployment | `NOT_STARTED` |
| External or Human baseline review | `REQUIRED` |

Worker Swarm Runtime is a proposed coordination layer inside Company Runtime. It does not replace Company OS Boot, Company Kernel, Workforce Registry, WorkQueue, Claim Lease, Decision Log, Review Log, or Human Final Authority.

## Architecture Placement

```text
Company OS Boot
-> Company Kernel
-> Company Dispatcher
-> Worker Swarm Runtime
-> Clone / Session / Claim coordination
-> Evidence and Review custody
-> Close / Release or Recovery
```

The proposed Company OS and Company Session package at `KGEN-KAIOS/governance/autopilot/` is not yet on formal main. This proposal treats it as an explicit candidate dependency, not as a CURRENT source. If that package is rejected or changed, Worker Swarm must be reviewed again before any implementation planning.

## Source Audit

| Source | Current classification | Reused authority |
|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | CURRENT Boot | Role boot order and finish-existing-work rule |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | ACTIVE Constitution | Human Final Authority, least authority, fail closed |
| `KGEN-KAIOS/worker_registry.json` | ACTIVE registry | Formal worker identity and permission |
| `KGEN-KAIOS/workforce/agent_registry.json` | ACTIVE Workforce V2 registry | Permanent employee and Agent identities |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | CURRENT queue | Task lifecycle and task source |
| `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md` | ACTIVE protocol | One-task claim and lease lifecycle |
| `KGEN-KAIOS/task_claim_schema.json` | ACTIVE schema | Existing claim envelope |
| `KGEN-KAIOS/TASK_DISPATCHER.md` | ACTIVE draft architecture | Dispatch lifecycle |
| `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md` | ACTIVE protocol | Codex review and disposition authority |
| `KGEN-KAIOS/decision/decision_log.jsonl` | ACTIVE log | Decision evidence |
| `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` | ACTIVE log | Review evidence |
| `KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md` | CANDIDATE, not main | Shared Company Boot integration direction |
| `KGEN-KAIOS/governance/autopilot/COMPANY_SESSION.md` | CANDIDATE, not main | Session and checkpoint direction |

## Gap Analysis

Current main has worker and Agent identities, but no `clone_id`. It has claim files, but branch-local claim snapshots cannot provide an atomic company-wide lock. It has reports and review logs, but no logical Master Registry that validates cross-registry references. It has checkpoint concepts in Kernel and candidate Company Session architecture, but no recovery fencing contract for a disconnected Cursor execution instance.

This package fills those architecture gaps without creating live registries or changing existing records.

## Package

| File | Purpose |
|---|---|
| `WORKER_SWARM_RUNTIME.md` | Coordination boundary, lifecycle, invariants and scale model |
| `MONKEY_CLONE_MODEL.md` | Formal Cursor execution-instance identity model |
| `SESSION_RUNTIME.md` | One-chat-window Session lifecycle and one-claim lock |
| `COMPANY_DISPATCHER.md` | Dispatcher authority, queues and transition algorithm |
| `CLONE_REGISTRY_STANDARD.md` | Clone record, uniqueness and heartbeat contract |
| `MASTER_REGISTRY_STANDARD.md` | Logical registry facade and consistency rules |
| `RECOVERY_RUNTIME.md` | Checkpoint takeover, fencing and split-brain prevention |
| `worker_swarm_runtime.json` | Machine-readable architecture contract |
| `WORKER_SWARM_ARCHITECTURE_REVIEW.md` | Internal independent review and delegated-authority boundary |
| `worker_swarm_architecture_review.json` | Machine-readable scores, findings and disposition |

## Non-Goals

- No autonomous worker creation or activation.
- No runtime service, database, queue worker, heartbeat daemon or scheduler.
- No new Kernel.
- No replacement of Workforce V2 employee identity.
- No Cursor authority to dispatch, review, merge, push main or deploy.
- No implementation task or WorkQueue entry.
- No protected-path change.

## Review Gate

The proposal may be published under delegated Level A authority. Baseline freeze remains held pending an external or explicit Human architecture review because Claim allocation, fencing and recovery are company-control behavior rather than low-risk presentation work. Approval of the architecture would not authorize implementation planning.
