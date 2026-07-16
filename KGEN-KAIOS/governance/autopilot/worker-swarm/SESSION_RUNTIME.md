---
TITLE: "KAIOS Worker Swarm Session Runtime"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define one immutable Session per chat window with one active Claim and restart-safe checkpoints."
ANCESTOR: "Candidate KGEN-KAIOS/governance/autopilot/COMPANY_SESSION.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "DigitalLife"
PHYLUM: "AgentRuntime"
CLASS: "SessionCoordination"
ORDER: "WorkerSession"
FAMILY: "KAIOSWorkerSwarm"
GENUS: "CheckpointedSession"
SPECIES: "KAIOSSwarmSessionArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/SESSION_RUNTIME.md"
---

# Session Runtime

## 1. Definition

Each chat window or provider invocation is one immutable Session Runtime. A Session is an execution envelope, not an employee, Worker, Clone, Task or Claim.

Example display IDs:

```text
SESSION-20260716-001
SESSION-20260716-002
SESSION-20260716-003
```

The Master Registry allocates the daily sequence and stores a collision-resistant `session_uid`. A provider cannot assign or recycle a Session ID locally.

## 2. Claim Rule

Each Session may have at most one Claim in any active custody state:

```text
ACTIVE
EXECUTING
REVIEW
REPAIR
RECOVERY_PENDING
```

A second Claim request returns `REJECT_UNAUTHORIZED_ALREADY_HOLDING_ACTIVE_TASK`. A Session with no Claim may perform permitted Boot, read-only health, Inbox classification or architecture analysis, but it cannot implement.

## 3. Lifecycle

```text
CREATED
-> BOOTING
-> READY
-> CLAIM_ACTIVE
-> EXECUTING
-> HANDOFF_SUBMITTED
-> WAITING_REVIEW
-> CHECKPOINTING
-> CLOSED

WAITING_REVIEW -> REPAIR -> EXECUTING
ANY_ACTIVE -> BLOCKED
ANY_ACTIVE -> RECOVERY_PENDING
RECOVERY_PENDING -> FENCED
FENCED -> CLOSED
```

An old Session is never reopened. Recovery creates a new Session linked by `previous_session_id` and `recovery_of_session_id`.

## 4. Required Fields

- `session_id`
- `session_uid`
- `previous_session_id`
- `recovery_of_session_id`
- `clone_id`
- `worker_id`
- `provider_id`
- `workspace_id`
- `branch`
- `base_sha`
- `observed_origin_main`
- `human_decision_ids`
- `task_id`
- `claim_id`
- `review_owner_id`
- `fencing_token`
- `boot_version`
- `boot_time`
- `session_status`
- `last_heartbeat_at`
- `last_checkpoint_id`
- `evidence_refs`
- `review_id`
- `started_at`
- `ended_at`
- `next_legal_action`

## 5. Session Checkpoint

A checkpoint contains only recoverable governance state:

```text
checkpoint_id
session_id
clone_id
claim_id
task_id
fencing_token
source_hashes
base_sha
head_sha
branch
work_state
files_observed
files_changed
evidence_refs
test_refs
review_state
protected_path_result
created_at
checkpoint_hash
```

It must not contain secrets, private keys, tokens, passwords, private KYC data, exact private GPS or hidden provider memory.

## 6. Close Conditions

A Session closes only when:

1. every reached Boot layer has a result;
2. Claim custody is explicit;
3. changed files and Evidence are recorded or `NONE`;
4. protected-path result is present;
5. Review state and next legal action are explicit;
6. checkpoint persistence succeeds;
7. the current fencing token is valid.

Checkpoint failure returns `FAILED_CLOSED_CHECKPOINT`. It cannot be reported as Done.

## 7. Recovery Boundary

The new Recovery Session must revalidate CURRENT governance, worker eligibility, task, branch, main SHA, handoff tip, Claim state, checkpoint hash and protected paths. A checkpoint preserves state but does not preserve expired authority.

## 8. Architecture Boundary

No Session store, sequence allocator, checkpoint writer, heartbeat service or resume engine is implemented by this proposal.

