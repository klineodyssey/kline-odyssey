---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Define a bounded internal Codex engineering organization that removes single-Session concentration without creating new company governance."
ANCESTOR: "KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md; KGEN-KAIOS/governance/autopilot/worker-swarm/WORKER_SWARM_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Codex Swarm Runtime V1

## Status

| Boundary | State |
|---|---|
| Architecture | `UNDER_REVIEW` |
| Implementation | `NOT_STARTED` |
| Codex Internal Clones active | `0` |
| WorkQueue created | `false` |
| Second governance system created | `false` |
| Second dispatcher created | `false` |
| Automatic internal allocation | `DISABLED` |
| Runtime CURRENT modified | `false` |

Codex Swarm V1 models Codex as one Chief Engineering Organization with bounded internal execution identities. It does not turn Codex into ten independent authorities and does not activate background Agents.

## Source Audit

| Source | Current role | Codex Swarm treatment |
|---|---|---|
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | Human-led constitutional authority | Unchanged and above every Clone |
| `KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md` | Active General Manager duties | Parent organization authority; no longer assumed to be one editing Session after cutover |
| `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md` | Active Cursor handoff dispatch/review rules | Used by the Dispatcher Clone through the existing Company Dispatcher |
| `KGEN-AI-Company/CODEX_REVIEW_AND_MERGE_RULES.md` | Active review and main integration rules | Split into Review evidence and Git execution responsibilities |
| `KGEN-KAIOS/governance/autopilot/COMPANY_OS_BOOT.md` | Shared fail-closed Company Boot | Every internal Clone must run it |
| `KGEN-KAIOS/governance/autopilot/COMPANY_SESSION.md` | Session/checkpoint Architecture | Reused; no second Session model |
| `KGEN-KAIOS/governance/autopilot/worker-swarm/WORKER_SWARM_RUNTIME.md` | Current Worker Swarm proposal | Parent architecture; its one-Clone-per-Worker V1 limit is amended only for registered Codex-derived actors |
| `KGEN-KAIOS/governance/autopilot/worker-swarm/MASTER_REGISTRY_STANDARD.md` | Logical identity/claim/evidence facade | Reused; Codex Internal Registry is a namespace/view, not a seventh registry |
| `KGEN-KAIOS/governance/autopilot/CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md` | Required future atomic Claim authority | Hard dependency before parallel execution |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Official task inventory | Reused unchanged; no Codex-specific WorkQueue |
| `company/` on `codex/company-decision-center-architecture` | Candidate company command control plane | Candidate dependency only; current sources remain authoritative until cutover |
| `KGEN-KAIOS/governance/autopilot/COMPANY_AUTONOMOUS_RUNTIME_REVIEW_RESOLUTION.md` on its proposal branch | Candidate AGB P0 resolution | Its Level 2, quota, Human Anchor, security and Auto Dispatch holds are preserved |

## Compatibility Decision

Current Worker Swarm V1 states that one Worker maps to one active Clone and requires a new Human-approved revision for multi-clone pools. `HUMAN-CODEX-SWARM-001` authorizes that Architecture Proposal.

The safe revision does not share `worker_id` across concurrent Clones. It introduces one parent organization and unique derived execution principals:

```text
organization_id = CODEX-ENGINEERING-ORG-001
parent_worker_id = codex-gm-01
internal_actor_id = codex-architecture-001
clone_id = CODEX-CLONE-ARCH-000001
session_id = CODEX-SESSION-20260716-001
claim_id = one canonical Claim
```

No derived actor may execute until it is registered, attested, scoped, and bound to the existing Worker/Claim governance. Internal Clones are runtime identities, not automatically new employees, managers, or merge authorities.

## Package

| File | Purpose |
|---|---|
| `CODEX_SWARM_RUNTIME.md` | Overall topology, lifecycle, invariants, failure and recovery |
| `CODEX_INTERNAL_ORGANIZATION.md` | Ten internal role classes and authority boundaries |
| `CODEX_CLONE_GOVERNANCE_STANDARD.md` | Identity, Session, Claim, worktree, write-set and quota contract |
| `CODEX_REVIEW_DISPATCH_AND_GIT_SEPARATION.md` | Segregation of authoring, review, Cursor dispatch and integration |
| `CODEX_SWARM_CAPACITY_MODEL.md` | S0 capacity, metrics, bottleneck analysis and readiness |
| `codex_swarm_runtime.json` | Machine-readable zero-state Architecture |
| `README.md` | Source audit, compatibility and package index |

## Readiness

| Measure | Architecture target | Current operational state |
|---|---:|---:|
| Codex Swarm readiness | 90 / 100 | 0 / 100 |
| Internal parallelism | 10 active Clones maximum | 1 Codex Session |
| Review capacity | 2 concurrent non-conflicting reviews | 1 Session |
| Dispatcher capacity | 1 exclusive Cursor dispatch operator | Manual / non-atomic |
| Architecture capacity | 4 non-overlapping proposal lanes | 1 Session |
| Git integration capacity | 1 serialized integration lane | 1 Session |

The Architecture is sufficient to address the single-Session concentration bottleneck. It does not remove the operational bottleneck until registries, atomic Claims, worktree isolation, path reservations, checkpoints, role attestation, metrics and recovery are implemented and reviewed.

## Non-Authorization

This package creates no Clone, Session, Claim, WorkOrder, dispatch, implementation, merge, main push, deployment, or protected-path authority.
