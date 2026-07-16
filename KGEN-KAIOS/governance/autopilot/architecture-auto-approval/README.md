---
TITLE: "Architecture Auto Approval Runtime"
VERSION: "0.1.0"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
HUMAN_DECISION_ID: "HUMAN-ARCHITECTURE-AUTO-APPROVAL-001"
OWNER: "Human PrimeForge"
ARCHITECT: "Codex / codex-gm-01"
IMPLEMENTATION: "NOT_STARTED"
AUTO_APPROVAL_ENABLED: false
CONTINUOUS_DISPATCH_ENABLED: false
---

# Architecture Auto Approval Runtime

This package proposes a bounded Architecture approval gate and a future Monkey
Continuous Dispatch contract. It does not activate either runtime.

## Source Audit

| Source | Status | Authority used by this proposal |
|---|---|---|
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | CURRENT | Human Final Authority and governed evolution remain invariant. |
| `KGEN-KAIOS/governance/ARCHITECTURE_GOVERNANCE_BOARD.md` | APPROVED | Role separation, review, ADR, and traceability remain required. |
| `KGEN-KAIOS/governance/autopilot/DELEGATED_AUTONOMY_STANDARD.md` | ACTIVE | Defines bounded Level B delegation and Human override. |
| `KGEN-KAIOS/governance/autopilot/CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md` | PROPOSAL_ONLY | Establishes the unresolved atomic claim dependency. |
| `origin/codex/company-autonomous-runtime-architecture` | CANDIDATE | Its AGB resolution caps autonomy at Level 2 and disables Auto Dispatch pending canonical claim authority. |
| `origin/codex/company-decision-center-architecture` | CANDIDATE | Defines the future Decision Center and Dispatcher, but is not CURRENT. |
| `origin/codex/codex-swarm-runtime-architecture` | CANDIDATE | Provides author, reviewer, dispatcher, and Git role separation. |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | CURRENT | Remains unchanged; Architecture approval cannot create implementation work. |

No existing equivalent Auto Approval Runtime or Continuous Dispatch Runtime was
found. Candidate documents are referenced as dependencies, not promoted to
CURRENT by this package.

## Governance Resolution

The Human decision authorizes this proposal. It does not allow the proposal to
approve or enable itself. One bootstrap Human decision is required after review
because activation changes the operating interpretation of AGB approval.

After activation, the standing Human delegation may approve only reversible,
low-risk, non-CURRENT Architecture artifacts that pass every gate. Constitution,
Human Authority, AGB, autonomy controls, claim authority, Decision Center
authority, frozen core invariants, and this Auto Approval Runtime remain Human
approval subjects.

| Requested behavior | Resolution |
|---|---|
| Automatic low-risk Architecture approval | `ACCEPT_WITH_BOOTSTRAP_GATE` |
| Merge to a non-CURRENT Architecture baseline | `ACCEPT_WITH_IMMUTABLE_NON_DEPLOYED_REF` |
| Notify Dispatcher | `ACCEPT_AS_INFORMATIONAL_EVENT_ONLY` |
| Continuous dispatch after Claim close | `ACCEPT_AFTER_CANONICAL_ATOMIC_CLAIM_AUTHORITY` |
| Queues must never be empty | `MODIFY_TO_EMPTY_HEALTHY`; fabricated work is forbidden |

## Package

- `ARCHITECTURE_AUTO_APPROVAL_RUNTIME.md`: authority and state model.
- `AUTO_APPROVAL_GATE_STANDARD.md`: fail-closed eligibility contract.
- `MONKEY_CONTINUOUS_DISPATCH.md`: future dispatch lifecycle and claim gates.
- `QUEUE_HEALTH_AND_AUTOMATIC_PROPOSAL_STANDARD.md`: queue health and bounded scouts.
- `architecture_auto_approval_runtime.json`: machine-readable approval contract.
- `continuous_dispatch_runtime.json`: machine-readable dispatch contract.

## Status

| Capability | Architecture readiness | Operational state |
|---|---:|---|
| Architecture Auto Approval | 87 / 100 | DISABLED_PENDING_REVIEW_AND_BOOTSTRAP_APPROVAL |
| Monkey Continuous Dispatch | 78 / 100 | DISABLED_PENDING_CANONICAL_ATOMIC_CLAIM_AUTHORITY |
| Queue health model | 92 / 100 | PROPOSAL_ONLY |

Current Monkey utilization and average idle time are `NOT_MEASURED`. No telemetry
runtime or automatic dispatcher is active, so inventing an observed percentage
or duration would be false evidence.

## Non-Goals

- No Runtime CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS CURRENT,
  Land CURRENT, or Civilization CURRENT change.
- No implementation, WorkQueue mutation, deployment, Pages publication, or release.
- No automatic approval of Token, contracts, tax, wallet, real funds, identity,
  legal land, protected paths, or irreversible changes.
- No fabricated task, claim, worker, utilization, or idle-time evidence.
