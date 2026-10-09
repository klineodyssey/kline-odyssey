# Task Claim Lease Protocol

**Version:** V7.1.1 Candidate
**Status:** Candidate / Distinct Technical Review Pending

## Purpose

The Task Claim Lease Protocol prevents two AI workers from doing the same WorkOrder at the same time. It extends the V7.0 Task Claim Protocol with a lease model and a complete task lifecycle.

## Task Lifecycle

```text
OPEN
-> CLAIMED
-> IN_PROGRESS
-> REVIEW
-> APPROVED
-> MERGED
-> DONE
```

Failure path:

```text
REVIEW
-> REJECTED
-> FIX
-> REVIEW
```

Blocked path:

```text
OPEN / CLAIMED / IN_PROGRESS / REVIEW
-> BLOCKED
-> OPEN / FIX / DONE
```

## Status Definitions

| Status | Meaning | Controller |
|---|---|---|
| OPEN | Ready to be claimed | Codex / PM |
| CLAIMED | Worker reserved the task | Worker |
| IN_PROGRESS | Worker is actively executing | Worker |
| REVIEW | Worker submitted report and branch | Worker |
| APPROVED | Codex accepted the task result | Codex |
| MERGED | Codex merged result to main | Codex |
| DONE | Task is closed | Codex |
| REJECTED | Codex rejected result | Codex |
| FIX | Follow-up correction required | Codex / Worker |
| BLOCKED | Cannot proceed without resolution | Codex / Worker |

## Claim Lease Fields

| Field | Required | Meaning |
|---|---|---|
| `task_id` | Yes | WorkOrder ID |
| `worker_id` | Yes | Claiming worker |
| `worker_type` | Yes | Worker type from registry |
| `status` | Yes | Current task status |
| `branch` | Yes | Expected handoff branch |
| `base_commit` | Yes | Main commit at claim time |
| `claimed_at` | Yes | Claim timestamp |
| `lease_expires_at` | Yes | Time when claim becomes stale |
| `heartbeat` | Yes | Last worker activity |
| `report_path` | Yes | Required report path |
| `reviewer` | Yes | Assigned reviewer |

The table above is the registered-worker path. A backward-compatible claim may omit `claimant_kind`; such a record is treated as `REGISTERED_WORKER` and still requires `worker_id` and `worker_type`.

## Human-Delegated Trial Lease Fields

A specifically Human-authorized candidate uses `claimant_kind: HUMAN_DELEGATED_TRIAL` and must not populate `worker_id` or `worker_type`. The temporary path requires all common lease fields plus:

| Field | Required | Meaning |
|---|---|---|
| `temporary_contributor_ref` | Yes | Non-authoritative candidate label; never identity proof |
| `temporary_execution_ref` | Yes | Unique company correlation reference |
| `temporary_execution_ref_kind` | Yes | Must be `COMPANY_TEMP_WORK_REF_NOT_PLATFORM_ID` |
| `authorization_evidence` | Yes | Complete exact Human source, issuer, time, decision and scope |
| `work_order_id` | Yes | Exact WorkOrder or bounded delegated work ID |
| `risk_level` | Yes | `R0` or `R1` only |
| `allowed_paths` | Yes | Exact writable paths |
| `allowed_actions` | Yes | Exact least-privilege actions |
| `forbidden_actions` | Yes | Protected/irreversible actions explicitly denied |
| `acceptance_criteria` | Yes | Test and output gates for handoff |
| `single_writer` | Yes | Must be `true` |
| `grant_status` | Yes | `ACTIVE`, `REVOKED`, or `EXPIRED` |
| `reviewer_independence_required` | Yes | Must be `true` |

The temporary reference is not a platform-issued session ID and does not mint an employee, Worker, Life, Controller, trust level, reviewer qualification, payroll right, credential, or tool permission. Claim data is evidence to evaluate; it cannot override a tool, host, GitHub, branch-protection, or policy denial.

## Claim Rules

1. A worker claims only one OPEN task at a time.
2. A claimed task must record worker ID and branch.
3. A task in CLAIMED or IN_PROGRESS cannot be claimed by another worker unless the lease expires or Codex releases it.
4. A worker must update heartbeat before the lease expires.
5. If a lease expires, Codex may mark the task BLOCKED, reopen it, or create a FIX task.

## Human-Delegated Trial Rules

1. The Human evidence must authorize the exact candidate, R0/R1 task, explicitly enumerated bounded paths, non-main branch, actions, output, and review boundary.
2. Exactly one live writer may hold the WorkOrder/branch/path scope. Any overlap, duplicate reference, or ambiguous ownership fails closed before writing.
3. The branch and base commit must match the record. Rebasing, retargeting, expanding paths/actions, or extending expiry requires new explicit evidence.
4. The implementer and reviewer must be distinct. The implementer may request review but cannot record review PASS, APPROVED, MERGED, or DONE.
5. `grant_status` must be `ACTIVE`, current time must be before `lease_expires_at`, and no revocation may exist before every write, commit, push, or Draft PR action.
6. The first policy/platform/tool denial stops that exact action. Record the action, target, reason, UTC time, and available request/review ID; do not switch accounts, tools, paths, branches, or transports to obtain the same denied effect.
7. Main push/merge, deployment, Mainnet/Testnet, real assets, Treasury, signer/private keys/credentials/secrets, governance/admin roles, payroll, production oracle, unauthorized protected paths, and irreversible/destructive actions are always outside this trial path.
8. A schema/protocol candidate branch or Draft PR is not an active grant. Activation requires a separate valid trial record and all current external permissions after the rule is accepted.

## Machine Schema

The machine-readable claim schema lives at:

```text
KGEN-KAIOS/task_claim_schema.json
```
