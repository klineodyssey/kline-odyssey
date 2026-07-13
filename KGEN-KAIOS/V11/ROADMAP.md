# KAIOS V11 Design-to-Implementation Roadmap

**Document ID:** KAIOS-V11-ROADMAP  
**Version:** V11 Design Proposal 1.0  
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED  
**Level:** L3 Design Bible  
**Author:** Codex / codex-gm-01  
**Owner:** PrimeForge / Human Operator  
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION  
**Base Commit:** bf1a46f2dcc32af41c9a57ca2a38ce30aa82c7e7  
**Implementation Authorized:** NO

## Gate 0: Human Design Approval

No implementation phase may start until the Human approves or revises the V11 architecture review. Gate 0 must decide:

- whether ownership is custodial, licensed, or mixed;
- whether Agent count is limited by quota, budget, or resource capacity;
- the memory isolation and privacy model;
- permitted marketplace license modes;
- prototype payroll units and Human approval boundaries;
- maximum automatic mission risk;
- whether Agent-created recruitment proposals are allowed; and
- the exact Phase 1 acceptance criteria.

Gate 0 output is a traceable decision record. Silence is not approval.

## Phase 1: Identity and Registry Sandbox

**Goal:** Establish tenant-safe identity and lifecycle foundations without executing missions or compensation.

Proposed scope after approval:

1. Define machine-readable Player Civilization, Player Agent, owner/custody, and lifecycle schemas.
2. Introduce unique Agent ID allocation and collision checks.
3. Build a sandbox registry with privacy and quota validation.
4. Add compatibility adapters that read existing V10 Worker records without converting them into Player Agents.
5. Add deterministic tests for ownership isolation, role validation, archive, and recovery.

Exit criteria:

- no identity collision in the test corpus;
- cross-player reads are denied by default;
- no secret or signing material is stored;
- V10 Worker Registry remains authoritative for repository workers;
- migration can be rolled back by removing the adapter and sandbox data.

Explicitly excluded: marketplace settlement, payroll execution, automatic missions, production authentication, and blockchain integration.

## Phase 2: Departments, Missions, and Attendance Simulation

**Goal:** Validate multi-agent coordination and evidence collection in a simulation-only environment.

Proposed scope after Phase 1 approval:

1. Add Department records, membership, budgets, and capability maps.
2. Add Mission Queue, priority, lease, deadline, status, evidence, and reviewer assignment.
3. Add evidence-based attendance events and daily summaries.
4. Enforce one primary Agent per mission and one active lease per claim.
5. Add read-only operational views for owner, department, mission, and attendance state.
6. Test duplicate claims, stale leases, Agent disappearance, department transfer, and review rejection.

Exit criteria:

- duplicate claim tests pass;
- R2 and above cannot auto-start;
- every completed mission has evidence and review;
- attendance cannot be inferred from registry presence alone;
- no repository WorkOrder is modified through the Player Agent runtime;
- all state changes have recovery paths.

## Phase 3: Payroll, Marketplace, and Evolution Simulation

**Goal:** Test reviewed economic and evolution records without real settlement or unrestricted autonomy.

Proposed scope after Phase 2 approval:

1. Add prototype compensation calculation with separated units.
2. Add department budget and reviewed reward allocation.
3. Add marketplace listing, license, lease, transfer, dispute, and delisting simulations.
4. Add skill, knowledge, trust, rank, transfer, retirement, and lineage events.
5. Add Human approval gates for financial, legal, privacy, security, and ownership-impacting changes.
6. Run adversarial tests for trust gaming, duplicate rewards, license conflict, private-memory leakage, and unauthorized forks.

Exit criteria:

- no real payment or blockchain signing occurs;
- reward totals reconcile against reviewed evidence;
- marketplace tests cannot transfer secrets or private memory;
- evolution events are traceable and reversible where policy permits;
- R3 requires Human plus Codex approval and R4 remains blocked;
- legal and security reviewers approve any proposed move beyond simulation.

## Migration Sequence From V10

```text
V10 Worker / Service Records
-> Read-only Compatibility Adapter
-> New Player Civilization Identity
-> New Player Agent Sandbox Records
-> Department and Mission Simulation
-> Attendance Evidence
-> Payroll / Marketplace / Evolution Simulation
```

Migration is additive. V10 records are not renamed, deleted, or automatically reassigned. A repository Worker and a Player Agent remain separate identities unless a reviewed mapping explicitly links them.

## Rollback Strategy

Each phase must be deployable behind a disabled-by-default capability flag or isolated sandbox boundary. Rollback restores the previous authoritative read path and archives new events; it must not delete evidence or rewrite V10 history.

## Schedule Policy

This roadmap defines dependency order, not a delivery promise. Time estimates require approved scope, worker capacity, security review, test resources, and Human decisions. Phase overlap is prohibited where it would bypass an earlier gate.

## Current Decision

`WAITING_FOR_HUMAN_APPROVAL`. No Phase 1 WorkOrder may be opened from this proposal until the architecture review receives an explicit Human decision.
