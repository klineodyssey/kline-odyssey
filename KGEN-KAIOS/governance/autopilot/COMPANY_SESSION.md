---
TITLE: "PrimeForge Company Session Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define restart-safe Session evidence and checkpoint semantics for every Company AI invocation."
ANCESTOR: "COMPANY_OS_BOOT.md; KGEN-KAIOS/decision/DECISION_ENGINE_STANDARD.md"
SOURCE_OF_TRUTH: true
---

# Company Session

## Purpose

Every Company AI invocation must have one Session. A Session binds actor identity, Boot evidence, repository state, task/claim custody, decisions, review, and the next legal action so a future invocation can recover without relying on hidden chat memory.

Company Session is an architecture contract, not an implemented database or background service.

## Lifecycle

```text
CREATED
-> BOOTING
-> ACTIVE or HOLD or FAILED_CLOSED
-> CHECKPOINTING
-> CLOSED

CLOSED or FAILED_CLOSED
-> RECOVERABLE
-> NEW_SESSION_WITH_PREVIOUS_SESSION_ID
```

An old Session is never reopened in place. Recovery creates a new Session linked by `previous_session_id`.

## Required Session Fields

- `session_id`
- `previous_session_id`
- `actor_id`
- `provider_id`
- `worker_id`
- `role`
- `trust_level`
- `started_at`
- `ended_at`
- `workspace_id`
- `branch`
- `base_sha`
- `observed_origin_main`
- `human_decision_ids`
- `task_id`
- `claim_id`
- `current_layer`
- `layer_results`
- `repository_health`
- `protected_path_result`
- `implementation_authorized`
- `session_status`
- `next_legal_action`

## End Checkpoint

Every Session end records the Human-required six categories:

| Category | Required record |
|---|---|
| Checkpoint | `checkpoint_id`, source hashes, refs, layer results, timestamp |
| Evidence | reports, tests, diffs, provenance, protected-path result |
| Decision | Human and manager decision IDs plus unresolved decision requests |
| State | queue, runtime, network, Pages, worktree, architecture/implementation state |
| Claim | task, claim, lease, custody, repair cycle, release state |
| Review | review ID, reviewer, result, warnings, next review requirement |

The checkpoint also stores `session_chain_hash` when hashing is later implemented. It stores no secret value.

## Close Rules

A Session cannot report `CLOSED` unless:

1. every reached layer has a result;
2. state-changing actions have evidence or are explicitly `NONE`;
3. task and claim custody are unambiguous or marked `BLOCKED_CLAIM_STATE_CONFLICT`;
4. unresolved reviews and Human decisions are listed;
5. protected-path status is recorded;
6. next legal action is explicit;
7. checkpoint persistence succeeds.

If checkpoint persistence fails, status is `FAILED_CLOSED_CHECKPOINT` and no implementation, merge, push, deployment, or claim release may be reported complete.

## Recovery Rules

Recovery must revalidate:

- Constitution and Company OS Boot versions;
- actor and Worker Registry status;
- `origin/main` and affected handoff tips;
- current Human Decision;
- task/claim/lease custody;
- protected paths;
- source hashes used by the prior decision.

Any mismatch starts a complete new fourteen-layer pass. A checkpoint is evidence, not authority to skip CURRENT sources.

## Privacy and Security

Sessions must not persist tokens, API keys, private keys, seed phrases, passwords, private KYC data, exact private GPS, private provider prompts, or local personal identifiers. Workspace values use logical IDs, not private machine paths.

## Current Boundary

No Session store, checkpoint writer, resume engine, scheduler, implementation task, commit, push, or deployment is created in this architecture-only round.

## GM Main Work Page

Observed at `2026-08-29T16:09:56+08:00`; every later invocation must refresh these mutable values before acting.

| Field | Current evidence |
|---|---|
| `NOW_WORKING_ON` | `KAIOS-GM-AUTONOMOUS-BATCH-SOURCE-SYNC-001` |
| `LAST_COMPLETED` | Exact-authorized real-execution policy evaluator and tests on PR #191 |
| `BLOCKED` | Real applicant, reviewed operational authority, bound payroll source, exact signer, receipt verifier and distinct PR reviewer remain absent |
| `WAITING_REVIEW` | PR #191 exact-head independent review |
| `WAITING_EXTERNAL` | Real applicant wallet-control proof and action-specific authority infrastructure |
| `READY_NEXT` | Reconcile the heartbeat source, publication classification and current PR/queue evidence |
| `LATEST_MAIN` | `4b698537c44df8a56a295d955d8e4844e957de41` |
| `ACTIVE_BRANCH` | `codex/kaios-ai-os-employment-alpha-v1` |
| `ACTIVE_PR` | `#191 / OPEN_DRAFT` |
| `WEBSITE_STATUS` | Branch candidate verified; production Main unchanged |
| `COMPANY_HEALTH` | `AMBER_REVIEW_AND_EXTERNAL_AUTHORITY_GAPS` |

`GM_OPERATIONS_SECRETARY` is not present as an independently registered Worker. Until one is recruited and bound, `codex-gm-01` performs the mechanical reconciliation duty as `ACTING_GM_OPERATIONS_SECRETARY`; this does not create independent review, approval, signer, treasury or governance authority.

