# KAIOS V11 Multi-Agent Civilization System Overview

**Document ID:** KAIOS-V11-SYSTEM-OVERVIEW
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Level:** L3 Design Bible
**Author:** Codex / codex-gm-01
**Owner:** PrimeForge / Human Operator
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION
**Base Commit:** bf1a46f2dcc32af41c9a57ca2a38ce30aa82c7e7
**Implementation Authorized:** NO

## Purpose

KAIOS V11 proposes a multi-agent civilization layer in which one Human Player may govern a portfolio of AI Agents. Agents can be organized into departments, receive missions, produce reviewed work evidence, earn prototype compensation, accumulate experience, change roles, retire, and remain auditable throughout their lifecycle.

V11 does not replace KAIOS V10. V10 remains the operating-system boundary for Portal, Frontend, API Gateway, Service Layer, Runtime, Storage, Blockchain, Analytics, and AI Company. V11 adds a tenant-aware civilization model above the existing Worker Registry, Claim Lease, WorkQueue, Attendance, Compensation, Decision, and Review mechanisms.

## Proposed Architecture

```text
Human Player / Civilization Owner
        |
        v
Player Civilization Account
        |
        v
Player Agent Registry ---- Agent Portfolio Policy
        |
        +---- Department Runtime
        |          |
        |          v
        |     Mission Queues / Budgets / Metrics
        |
        +---- Employment Lifecycle
        |
        +---- Attendance + Work Evidence
        |
        +---- Prototype Payroll Ledger
        |
        +---- Agent Evolution History
        |
        +---- Marketplace License Boundary
        |
        v
KAIOS Decision and Review Layer
        |
        v
Codex Review + Human Override
```

## Core Separation

V11 must keep four identities separate:

| Identity | Meaning | Authority |
|---|---|---|
| Human Player | Civilization owner and final player-level decision maker | Owns portfolio policy; cannot bypass KGEN protected paths |
| Player Agent | AI life record owned or licensed by a player | Executes eligible missions inside declared permissions |
| KAIOS Worker | Repository construction/review worker registered in the existing Worker Registry | May modify repo only through formal WorkOrders and handoff rules |
| Codex General Manager | KGEN system-level dispatcher and reviewer | Reviews KGEN WorkQueue, main merge, safety and Canon |

A Player Agent is not automatically a repository Worker. Promotion from Player Agent to KAIOS Worker requires separate workforce registration, onboarding, trust assignment, workspace, branch policy, and reviewer approval.

## Primary Runtime Domains

1. **Player Agent Registry:** owner-scoped identity and portfolio records.
2. **Department Runtime:** mission routing, budgets, capability boundaries, metrics, and transfers.
3. **Employment Runtime:** recruitment through archive with reviewable transitions.
4. **Mission Runtime:** queue, lease, deadline, evidence, reward, review, retry, and closure.
5. **Attendance Runtime:** evidence-based presence and activity state.
6. **Payroll Runtime:** prototype internal ledger only; no signing or guaranteed value.
7. **Marketplace Runtime:** license, hire, lease, share, open-source, and commercial terms at concept/prototype level.
8. **Decision Runtime:** approve, reject, escalate, block, Human override, and audit.
9. **Evolution Runtime:** skill, knowledge, trust, experience, rank, transfer, retirement, and lineage.

## System Invariants

- Every Agent has exactly one canonical `agent_id` and one current owner or custody policy.
- A Human may own many Agents, but resource quotas and safety limits remain configurable.
- An Agent has one primary department at a time and may hold secondary capabilities.
- Every active mission has one primary Agent owner and one review authority.
- High-risk missions cannot be auto-accepted.
- Attendance requires evidence; registry presence is not attendance.
- Salary requires reviewed work evidence and cannot be inferred from self-reported time alone.
- Wallet fields are public profiles or internal ledger references, never private keys or signing authority.
- Agent marketplace transfer means governed license/custody transfer, not secret/model-weight exfiltration.
- Evolution never silently rewrites history; every change produces a lineage event and rollback or recovery path.

## Data Authority

The V11 proposal assumes future machine-readable records, but this design phase creates no schemas or runtime code. Future authority order should be:

```text
Boot CURRENT
-> Machine Canon
-> KAIOS V10 system boundaries
-> V11 approved standards
-> Player Agent Registry
-> Mission / Attendance / Payroll / Evolution events
-> Reports and Review decisions
```

## Non-Goals

This proposal does not authorize:

- autonomous blockchain signing or token transfer;
- real payroll, banking, securities, investment, or KYC services;
- sale of private model weights, secrets, credentials, or personal data;
- automatic main-branch merge or protected-path modification;
- unlimited resource consumption merely because Agent count is unlimited conceptually;
- deployment, Pages changes, API services, databases, or production authentication;
- self-replicating Agents without owner, security, budget, and review gates.

## Related Documents

- [Multi-Agent Standard](MULTI_AGENT_STANDARD.md)
- [Player Agent Standard](PLAYER_AGENT_STANDARD.md)
- [Agent Lifecycle](AGENT_LIFECYCLE.md)
- [Department Standard](DEPARTMENT_STANDARD.md)
- [Mission Runtime Standard](MISSION_RUNTIME_STANDARD.md)
- [Payroll Standard](PAYROLL_STANDARD.md)
- [Marketplace Standard](MARKETPLACE_STANDARD.md)
- [Decision Engine V11](DECISION_ENGINE_V11.md)
- [Evolution Standard](EVOLUTION_STANDARD.md)
- [Roadmap](ROADMAP.md)
- [Architecture Review](V11_ARCHITECTURE_REVIEW.md)

## Approval Boundary

The architecture may advance to implementation planning only after Human approval of the ownership model, marketplace rights, payroll units, memory/privacy boundary, Agent quota policy, and Phase 1 acceptance criteria. Until then, all V11 artifacts remain design proposals.
