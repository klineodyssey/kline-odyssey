---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Define a fail-closed, machine-readable authorization envelope for one Cursor task."
ANCESTOR: "KGEN-Organization/WorkOrders/WORKORDER_STANDARD.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: TaskAuthorization
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: CursorTaskEnvelopeArchitecture
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md"
---

# Cursor Task Envelope Standard Proposal

## 1. Purpose

A Task Envelope is the bounded authorization object between a Human Decision, a canonical WorkOrder and one Cursor execution. It does not replace either source. It resolves them into an executable scope that can fail closed.

No Task Envelope means no Cursor work.

## 2. Required Fields

Every envelope must contain all of the following fields:

| Field | Rule |
|---|---|
| `task_id` | Must identify one canonical WorkOrder. |
| `human_decision_id` | Must identify the Human decision that authorizes the scope. |
| `title` | Human-readable task title. |
| `objective` | Single bounded outcome. |
| `authorized_actions` | Explicit allowlist of actions. |
| `forbidden_actions` | Explicit denylist; denial wins on overlap. |
| `authorized_paths` | Normalized path allowlist. |
| `forbidden_paths` | Task-specific path denylist. |
| `protected_paths` | Loaded protected path snapshot. |
| `required_sources` | Exact CURRENT, baseline and ADR sources. |
| `required_tests` | Tests required before handoff. |
| `required_evidence` | Evidence artifacts required before handoff. |
| `branch_name` | Must match the registered worker branch pattern. |
| `worktree_name` | Must identify an isolated worker worktree. |
| `base_sha` | Full commit SHA validated against current origin state. |
| `commit_allowed` | Explicit Boolean. |
| `push_allowed` | Explicit Boolean; means handoff push only. |
| `merge_allowed` | Must be `false` for Cursor. |
| `deploy_allowed` | Must be `false` for Cursor. Deployment requires a separately authorized release actor and process. |
| `reviewer` | Registered reviewer; normally Codex. |
| `handoff_target` | Named review destination. |
| `stop_conditions` | Applicable stop-condition IDs. |
| `expiry` | ISO 8601 time after which the envelope is invalid. |
| `status` | Envelope lifecycle status. |

Recommended traceability fields are `worker_id`, `claim_id`, `risk_level`, `dependencies`, `applicable_adr_ids`, `go_required`, `created_at`, `created_by` and `source_state_sha`.

## 3. Lifecycle

```text
PROPOSED
-> VALIDATING
-> AUTHORIZED
-> ACTIVE
-> HANDOFF_SUBMITTED
-> CLOSED
```

Exceptional terminal or holding states are:

```text
BLOCKED
EXPIRED
REVOKED
REJECTED
```

Only an envelope in `AUTHORIZED` or `ACTIVE` may permit execution. Cursor cannot promote its own envelope.

## 4. Validation Rules

An envelope passes only when all checks pass:

1. Human Decision exists, is current and covers the exact objective.
2. WorkOrder exists and is eligible for claim.
3. Registered `worker_id`, status, trust level and claim lease are valid.
4. No second active task exists for the worker.
5. `authorized_paths` do not intersect protected or forbidden paths.
6. Planned actions are a subset of `authorized_actions`.
7. `base_sha` is visible and not stale for the authorized scope.
8. Branch matches the Worker Registry pattern. The current Cursor pattern is `cursor-handoff/<Task-ID>`.
9. Worktree is isolated from Human Main.
10. Dependencies exist and are satisfied.
11. Required CURRENT selectors, baseline and exact ADRs are visible.
12. Permission fields are explicit Booleans, not inferred defaults.
13. Reviewer and handoff target are registered.
14. Expiry has not passed.
15. Required tests and evidence are objectively checkable.

Any ambiguity returns `BLOCKED`; Cursor must not repair or broaden the envelope itself.

## 5. Action and Path Resolution

- Deny rules override allow rules.
- The narrowest path rule wins only when it remains inside every higher authority.
- A directory allowlist does not grant permission to edit protected descendants.
- Unlisted paths and actions are denied.
- Discovery of useful out-of-scope work produces an observation or follow-up proposal, not a change.

## 6. Permission Semantics

- `commit_allowed: true` permits a task-branch commit only.
- `push_allowed: true` permits only the registered handoff ref; it never permits `main`.
- `merge_allowed` is always `false` for Cursor.
- `deploy_allowed` is always `false` for Cursor; an architecture, planning or deployment approval does not turn Cursor into the release actor.
- Human approval does not silently alter an existing envelope. A revised, traceable envelope is required.

## 7. Non-Authorization

This proposal defines the envelope contract only. It creates no WorkOrder, claim, active envelope, implementation permission or deployment permission.
