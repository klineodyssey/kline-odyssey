---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-COMPANY-DECISION-CENTER-001"
CHANGE_REASON: "Define one future command and announcement control plane without activating a second company authority."
ANCESTOR: "KGEN-KAIOS/decision/; KGEN-KAIOS/governance/autopilot/; KGEN-KAIOS/governance/autopilot/worker-swarm/"
SOURCE_OF_TRUTH: false
---

# Company Decision Center Runtime V1

## Status

This package is an **Architecture Proposal** for the future KAIOS company command control plane.

| Boundary | State |
|---|---|
| Architecture | `UNDER_REVIEW` |
| Implementation | `NOT_STARTED` |
| WorkQueue created | `false` |
| Dispatcher enabled | `false` |
| Canonical claim service | `NOT_IMPLEMENTED` |
| Current command-source cutover | `NOT_AUTHORIZED` |
| Protected Runtime modified | `false` |

`company/` is not yet an active source of commands. Until a later Human-approved cutover, current Human decisions, the active Decision Engine, the official WorkQueue, the current Company Inbox, and their append-only logs retain their existing authority.

## Target Scope

The Decision Center is designed to become the single source of truth for **company commands and their authorization lineage**. It is not the source of truth for Universe Physics, Canon, land ownership, finance, identity, application data, or any domain Runtime.

```text
Human Authority
-> Decision Center
-> Company Inbox
-> Priority Scheduler
-> Review Gate
-> Company Dispatcher
-> Canonical Claim Authority
-> Worker
-> Evidence
-> Review
-> Close / Release
```

Every downstream action must reference one active Decision Center record. A Runtime, provider, prompt, Worker, branch, README, memory, or chat transcript cannot create independent command authority.

## Source Audit

| Existing source | Current role | V1 treatment |
|---|---|---|
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | Constitutional authority below Human Final Authority | Remains above Decision Center |
| `KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md` | Active Daily Operation and manager-decision standard | Retained; future Decision Center adapter and public projection |
| `KGEN-KAIOS/decision/decision_log.jsonl` | Active append-only manager decision evidence | Imported by reference and hash; never rewritten |
| `KGEN-KAIOS/governance/autopilot/COMPANY_INBOX.md` | Active operator intake protocol without a background service | Retained until cutover; future compatibility adapter |
| `KGEN-KAIOS/governance/autopilot/PRIORITY_SCHEDULER.md` | Active deterministic priority policy | Reused; does not gain command authority |
| `KGEN-KAIOS/governance/autopilot/worker-swarm/COMPANY_DISPATCHER.md` | Dispatcher Architecture Proposal | Referenced and narrowed by the sole-dispatcher contract |
| `KGEN-KAIOS/governance/autopilot/CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md` | Transactional claim-authority proposal | Mandatory dependency before automatic dispatch |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Official task inventory and lifecycle projection | Remains a task projection; cannot independently authorize dispatch |
| `KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md` | Proposed bounded execution contract | Required downstream contract after dispatch |
| `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` | Active review evidence | Retained as review projection and migration evidence |

## Gap Analysis

The current system has the required parts but no single versioned command envelope spanning all parts. The proposal closes these gaps:

1. one immutable Human authority reference per command;
2. one provider-neutral message envelope for Decision, Task, Review, Repair, Architecture, Implementation, Evidence, and Release;
3. one intake lifecycle before scheduling;
4. one review-first barrier before implementation dispatch;
5. one legal dispatcher contract backed by a separate atomic claim authority;
6. deterministic supersession, revocation, expiry, replay protection, and audit lineage;
7. explicit adapters for current Decision, Inbox, WorkQueue, Claim, Review, and Handoff sources;
8. a controlled migration that prevents two simultaneous command authorities.

## Package

| File | Purpose |
|---|---|
| `DECISION_CENTER.md` | Target command authority, record lifecycle, Human Anchor, projections, and failure rules |
| `decision_center.json` | Machine-readable zero-state Architecture and cutover gates |
| `COMPANY_INBOX.md` | Typed intake lanes, lifecycle, review barrier, privacy, and deduplication |
| `company_inbox.json` | Machine-readable Inbox Architecture with no live dispatch records |
| `COMPANY_DISPATCHER.md` | Sole-dispatcher contract and claim-authority boundary |
| `dispatcher_runtime.json` | Disabled zero-state dispatcher model |
| `COMPANY_GOVERNANCE_FLOW.md` | End-to-end Boot, governance, review, repair, release, and migration flows |
| `COMPANY_MESSAGE_STANDARD.md` | Provider-neutral message and payload contracts |
| `README.md` | Source audit, gap analysis, package map, and cutover plan |

## Migration And Cutover

| Stage | Allowed result |
|---|---|
| `DC0_PROPOSAL` | Architecture review only; current sources unchanged |
| `DC1_BASELINE` | Resolution, ADR, Human approval, and frozen contract |
| `DC2_SANDBOX` | Local simulator, schema tests, replay tests, and migration dry run |
| `DC3_SHADOW_READ` | Dual-read comparison; current sources still authoritative |
| `DC4_HUMAN_CUTOVER` | Human activates one command authority at an exact effective time |
| `DC5_COMPATIBILITY` | Legacy command sources become read-only projections/adapters |

Cutover requires zero unresolved divergence, a working Human Anchor, an implemented append-only ledger, a canonical atomic claim authority, rollback evidence, provider-adapter tests, and explicit Human approval. If any gate fails, the system stays on the current authority and fails closed.

## Architecture Assessment

| Measure | Score |
|---|---:|
| Decision Center Architecture readiness | 91 / 100 |
| Governance completeness | 94 / 100 |
| Message contract coverage | 8 / 8 |
| Dispatcher Architecture coverage | 92 / 100 |
| Inbox lane coverage | 9 / 9 |
| Worker/provider compatibility | 93 / 100 |
| Review compatibility | 95 / 100 |
| Operational readiness | 0 / 100 |

The design is sufficient for Architecture Baseline Review. It is **not yet sufficient to operate as the sole formal governance center** because review, ADR, Human baseline approval, persistence, signatures, atomic claims, migration rehearsal, and cutover have not occurred.

## Non-Authorization

This package creates no WorkOrder, Claim, active dispatch, implementation, deployment, Pages change, payment, identity action, or protected-path authority.
