---
TITLE: "AGB Company Autonomous Runtime V1 Review Resolution"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Architecture Governance Board / Human PrimeForge"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/COMPANY_AUTONOMOUS_RUNTIME_REVIEW_RESOLUTION.md"
---

# Company Autonomous Runtime V1 Review Resolution

## 1. AGB Decision

```text
Decision: MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT
Company Autonomous Runtime V1: MAJOR_REVISION_IN_PROGRESS
Fully Autonomous Runtime: DISABLED
Baseline Freeze: DENIED
Auto Dispatch: DISABLED
Maximum Autonomous Level: LEVEL_2_ARCHITECTURE_LIMIT
Architecture target: S0 / S1
S2 / S3: FUTURE_ARCHITECTURE_ONLY
Implementation: NOT_STARTED
```

The existing proposal is retained as design history. This resolution does not enable a runtime, claim production scale, create a database, dispatch a Worker or modify a frozen baseline.

## 2. Review Inputs and Provenance

| Input | Decision | Evidence boundary |
|---|---|---|
| Gemini External Product Review | `APPROVE_WITH_AMENDMENTS` | Product amendments were transmitted and adopted by Human PrimeForge |
| Grok External CTO Review | `MAJOR_REVISION_REQUIRED` | Twenty P0 risks were transmitted and adopted by Human PrimeForge |
| Codex Architecture Proposal | `PROPOSED_NOT_ENABLED` | Local proposal package in this worktree |
| AGB Resolution | `MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT` | `AGB-COMPANY-AUTONOMOUS-RUNTIME-001` |

The repository does not contain the original Gemini or Grok source artifacts for this review. This resolution records the Human-supplied findings and does not invent external quotations or signatures.

## 3. Source Audit

Existing authoritative or ancestor documents remain in force:

- `COMPANY_OS_BOOT.md` and `COMPANY_SESSION.md` define fail-closed startup and Session checkpointing.
- `worker-swarm/WORKER_SWARM_RUNTIME.md` defines the earlier single-company Swarm candidate.
- `CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md` defines the prior claim-authority candidate.
- `DELEGATED_AUTONOMY_STANDARD.md` defines delegated risk authority.
- `CURSOR_HANDOFF_AUTO_REVIEW.md` and `CLAIM_AND_LEASE_CONTROLLER.md` define review custody and lease rules.

The requested files did not exist. The new standards are resolution-scoped amendments, not active replacement sources. Supersession requires independent review, AGB resolution and Human approval.

## 4. Gemini Product Amendments

All five product amendments are accepted:

1. add `Tribe` and `Settlement` between Family and City;
2. use progressive disclosure based on life stage, training level, civilization stage, permission and role;
3. model symbiosis, parasitism, competition, predation, cooperation and mutualism;
4. enforce environmental carrying capacity across food, water, energy, land, pollution, population, biodiversity, climate, waste and disease;
5. create ecological backlash from overdevelopment.

They are isolated in `PRODUCT_EVOLUTION_AMENDMENTS.md`. They do not change Company Swarm infrastructure or frozen domain baselines in this revision.

## 5. Grok P0 Risk Resolution

Every P0 risk is accepted as a valid blocker. Architecture mitigations are defined, but no P0 is operationally resolved until implementation, conformance testing and independent review pass.

| Risk | Title | Architecture response | Status |
|---|---|---|---|
| P0-001 | Central Dispatcher Bottleneck | Hierarchical controllers and bounded fan-out | `OPEN_MITIGATION_DESIGNED` |
| P0-002 | Clone Registry State Explosion | Partitioning, lifecycle tiers, pruning and archive classes | `OPEN_MITIGATION_DESIGNED` |
| P0-003 | Heartbeat Storm | Adaptive heartbeats, local aggregation, jitter and summaries | `OPEN_MITIGATION_DESIGNED` |
| P0-004 | Monkey Swarm Collusion | Attestation, review separation, rotation and anomaly signals | `OPEN_MITIGATION_DESIGNED` |
| P0-005 | Infinite Clone Spawning | Mandatory `CLONE_SPAWN_BUDGET` and hierarchical quotas | `OPEN_MITIGATION_DESIGNED` |
| P0-006 | State Divergence | Per-domain consistency classes, revisions and replay | `OPEN_MITIGATION_DESIGNED` |
| P0-007 | Company Memory Version Conflict | Versioned partitions, migrations and conflict rules | `OPEN_MITIGATION_DESIGNED` |
| P0-008 | Life OS Boundary Leakage | Explicit runtime boundaries and negative contract tests | `OPEN_MITIGATION_DESIGNED` |
| P0-009 | Evidence Tampering | Immutable Evidence Chain and review signatures | `OPEN_MITIGATION_DESIGNED` |
| P0-010 | Autonomous Authority Drift | Fixed autonomy ladder and Human Anchor checks | `OPEN_MITIGATION_DESIGNED` |
| P0-011 | Legacy Rule Re-entry | Version gates, suppression and drift detector | `OPEN_MITIGATION_DESIGNED` |
| P0-012 | Review / Human Decision Deadlock | Timeout, escalation, bounded repair and `SAFE_HOLD` | `OPEN_MITIGATION_DESIGNED` |
| P0-013 | Session Recovery Cascade | Recovery quotas, circuit breakers and failure domains | `OPEN_MITIGATION_DESIGNED` |
| P0-014 | Identity Persistence Failure | Immutable identity lineage and attestation | `OPEN_MITIGATION_DESIGNED` |
| P0-015 | Security Key Rotation Missing | Key lifecycle, revocation and compromise containment | `OPEN_MITIGATION_DESIGNED` |
| P0-016 | Long-term Archival Missing | Hot, warm, cold, immutable and disposable tiers | `OPEN_MITIGATION_DESIGNED` |
| P0-017 | State Pruning Missing | Retention, compaction, tombstones and replay anchors | `OPEN_MITIGATION_DESIGNED` |
| P0-018 | Disaster Recovery Missing | Failure matrix, RPO/RTO classes and drills | `OPEN_MITIGATION_DESIGNED` |
| P0-019 | Architecture Drift Missing | Drift detector with block, report and proposal flow | `OPEN_MITIGATION_DESIGNED` |
| P0-020 | Cross-runtime Event Bus Expansion | Domain namespaces, ACLs, rate limits and no wildcard access | `OPEN_MITIGATION_DESIGNED` |

P0 risks open: `20`. P0 risks resolved: `0`. Architecture mitigations designed: `20`.

## 6. Scale Resolution

| Scale | Worker range | V1 status | Architecture rule |
|---|---:|---|---|
| S0 | 1-10 | `ARCHITECTURE_TARGET` | Local development and one bounded company |
| S1 | 11-1,000 | `ARCHITECTURE_TARGET` | Hierarchical squads and departments within one company or region |
| S2 | 1,001-1,000,000 | `FUTURE` | Federation, partitioned state and regional failover require separate review |
| S3 | 1,000,001-100,000,000 | `NOT_SUPPORTED` | Planetary distributed runtime is outside V1 |

No operational scale is claimed because implementation has not started.

## 7. Hierarchical Control Plane

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

Every layer receives a quota and may manage only bounded direct children. A controller cannot borrow another partition's quota or create a Clone without a `CLONE_SPAWN_BUDGET` and canonical Claim allocation.

## 8. State and Evidence Resolution

- Strong consistency: Claim ownership, money ledger, land ownership, Human Decisions and authorization.
- Eventual consistency: heartbeat, presence, UI state, analytics and observability.
- Append-only immutable: evidence, decisions, reviews, handoffs and audit history.
- Event sourcing plus snapshot/replay: authoritative state reconstruction.
- CRDTs: limited to approved low-risk presence or aggregate views, never Claims, money, land or authority.
- Partitioned state: Company and Region boundaries for S1; S2 remains future.

Auto Dispatch remains disabled until Canonical Atomic Claim Authority implements compare-and-swap, fencing and conformance tests.

## 9. Human and Autonomy Resolution

The current maximum is `LEVEL_2`: observe, review, report and dispatch already approved tasks. Level 3 and Level 4 require a separate Human decision. Level 5 is Human only.

Every major Session and autonomy change requires `HUMAN_ANCHOR_CHECK` with authority identity, decision signature, scope, expiry, revocation state, emergency stop, override, appeal and audit references. Timeout never means automatic approval.

## 10. Deadlock and Safe Hold

Queue dependencies are represented as a directed graph and checked for cycles. Decision timeout, review escalation, repair limit, Claim expiry and Human escalation are policy-configurable. When progress cannot be made safely, the state becomes `SAFE_HOLD`, preserving evidence and preventing new dispatch. No queue timeout silently changes architecture or grants authority.

## 11. Secondary Risks

P1 risks: privacy retention error, migration incompatibility, federation policy mismatch, observability cost, reviewer scarcity and recovery drill failure.

P2 risks: dashboard discoverability, terminology drift, optional analytics lag and documentation navigation.

These do not reduce the P0 blocker count.

## 12. Review Scores

Scores measure architecture documentation only, not runtime capability:

| Dimension | Score / 100 |
|---|---:|
| Architecture | 82 |
| Scalability | 68 |
| Security | 77 |
| Maintainability | 76 |
| Fault Tolerance | 69 |
| State Integrity | 80 |
| Governance | 91 |
| Human Control | 95 |
| S0 Readiness | 84 |
| S1 Readiness | 72 |
| S2 Readiness | 40 |
| S3 Readiness | 18 |
| Hundred-year Readiness | 32 |

No average can override the twenty open P0 risks. Baseline Freeze and enablement remain blocked.

## 13. Required Gates

Before another enablement decision:

1. complete independent review of every new standard;
2. resolve or accept each P0 with testable exit criteria;
3. validate Canonical Claim Authority design and conformance plan;
4. validate S0 failure, security, evidence and Human Anchor scenarios;
5. re-score without averaging away P0 failures;
6. obtain a new Human Architecture Decision.

The next Human decision is `HOLD_FOR_P0_REVISION` or, after independent review, `APPROVE_REVISED_ARCHITECTURE_FOR_S0_BASELINE_REVIEW`. It is not an implementation authorization.
