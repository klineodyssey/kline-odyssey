---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Define the Codex Internal Organization role catalog and separation of duties."
ANCESTOR: "KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md; KGEN-KAIOS/governance/autopilot/worker-swarm/CLONE_REGISTRY_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# Codex Internal Organization

## 1. Parent Organization

| Field | Value |
|---|---|
| Organization | `CODEX-ENGINEERING-ORG-001` |
| Parent authority principal | `codex-gm-01` |
| Company role | Chief Engineering Organization |
| Human authority | PrimeForge |
| Command source | Current Company authority; future Decision Center after cutover |
| Task inventory | Existing WorkQueue only |
| Claim authority | Existing manual governance; future canonical atomic authority |

The parent organization does not edit files while acting as controller. Editing, testing, review, dispatch and Git actions occur through role-scoped Clones.

## 2. Role Catalog

| Role | Allowed work | Required output | Forbidden work |
|---|---|---|---|
| `ARCHITECTURE_CLONE` | Source audit, proposal, model, ADR candidate, gap analysis | Architecture package and evidence | Implementation, self-review, merge, release |
| `REVIEW_CLONE` | Diff, Architecture, security, schema, evidence and compliance review | Immutable Review disposition | Implementation, repair edits, dispatch, merge, self-review |
| `DISPATCHER_CLONE` | Operate existing Company Dispatcher for Cursor tasks | Dispatch decision and Task Envelope references | Program/Architecture edits, review, merge, self-claim |
| `KERNEL_CLONE` | Kernel-domain research, Architecture or separately authorized sandbox work | Kernel-scoped artifact and evidence | Runtime CURRENT, unrelated modules, self-approval |
| `LIFE_CLONE` | Life/Life OS domain research, Architecture or authorized sandbox work | Life-scoped artifact and evidence | Company OS leakage, CURRENT changes, self-approval |
| `UI_CLONE` | UI Architecture, sandbox UI, accessibility and visual evidence when authorized | UI artifact, screenshots and tests | Domain ownership mutation, production deployment |
| `GIT_CLONE` | Fetch, compare, branch, merge approved change, release evidence, repo health | Integration result and rollback reference | Authoring, substantive repair, approval invention, force push |
| `DOCUMENTATION_CLONE` | Documentation, indexes, links, machine-readable documentation | Scoped documentation artifact | Runtime implementation, architecture approval, merge |
| `TESTING_CLONE` | Test design/execution, validation, performance and reproducibility | Test evidence and hashes | Product implementation, approval, source alteration outside test scope |
| `COMPANY_CLONE` | Daily Operation, health, backlog reconciliation, reports and drift observations | Company status and proposal inputs | Implementation, Cursor dispatch, merge, Human approval |

## 3. Role Immutability

A Clone cannot change roles inside a Session. A new role requires:

1. close or checkpoint current Claim;
2. release or retain custody according to Review state;
3. create a new registered Clone/Session identity;
4. acquire a new Claim through existing authority.

This prevents an Architecture author from becoming the Review Clone or Git Clone for the same artifact by changing a label.

## 4. Authority Matrix

| Capability | Architecture | Review | Dispatcher | Domain | Git | Docs | Testing | Company |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Author Architecture | Yes | No | No | Scoped | No | Support | No | Proposal input |
| Implement | No | No | No | Authorized sandbox only | No | Docs only | Tests only | No |
| Review | No | Yes | No | No self-review | No | No | Evidence only | Intake only |
| Dispatch Cursor | No | No | Yes | No | No | No | No | No |
| Merge / push reviewed non-protected work | No | No | No | No | Delegated execution only | No | No | No |
| Modify WorkQueue | No | No | Projection request only | No | Approved closeout only | No | No | Reconciliation proposal only |
| Modify protected CURRENT | No | No | No | No | No without exact Human authority | No | No | No |
| Human approval | No | No | No | No | No | No | No | No |

## 5. Cursor Boundary

Cursor remains a Monkey Worker. Cursor task dispatch follows:

```text
Current command authority
-> Priority Scheduler
-> Company Dispatcher
-> Dispatcher Clone adapter
-> canonical Claim or explicit pre-cutover assignment
-> Cursor Task Envelope
```

No other Codex Clone may dispatch Cursor, add a second Claim, or bypass Review First. Dispatcher Clone cannot implement the task it dispatches.

## 6. Review Independence

Internal role separation is necessary but not equivalent to external independent review. A Review Clone may provide `INTERNAL_INDEPENDENT_REVIEW` only when:

- `author_clone_id != reviewer_clone_id`;
- Sessions and worktrees differ;
- reviewer had no write access to the target artifact;
- no shared active Claim exists;
- conflict-of-interest checks pass.

AGB-required external or Human review remains required where the governing Architecture says so.

## 7. Git Delegation

Git Clone is an execution arm of existing Codex merge authority. It needs an accepted Review and an authorized Release message. It cannot modify reviewed content except deterministic conflict-free integration metadata. Any substantive change returns to Repair and a new Review.

## 8. Current Boundary

These are role definitions only. No internal actor, Clone, Session, permission, registry entry or authority is activated.
