---
TITLE: "KAIOS Monkey Clone Model"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define a unique and recoverable execution identity for each controlled Cursor Worker."
ANCESTOR: "KGEN-KAIOS/worker_registry.json; KGEN-KAIOS/workforce/agent_registry.json"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "DigitalLife"
PHYLUM: "AgentRuntime"
CLASS: "ControlledExecutionWorker"
ORDER: "MonkeyClone"
FAMILY: "KAIOSWorker"
GENUS: "CursorWorkerClone"
SPECIES: "KAIOSMonkeyCloneArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/MONKEY_CLONE_MODEL.md"
---

# Monkey Clone Model

## 1. Formal Meaning

`Monkey Clone` is the KAIOS technical name for one controlled Cursor execution identity. It is not a claim that every Cursor window is automatically an employee, and it does not grant ownership, architecture authority or autonomous reproduction rights.

A new window is normally a new Session for an existing Clone. A new Clone exists only after Dispatcher validation of a unique Worker identity and formal registration authority.

## 2. Required Fields

Every Clone record contains at least:

- `clone_id`
- `session_id`
- `worker_id`
- `claim_id`
- `review_owner_id`
- `current_status`
- `heartbeat_at`
- `boot_time`

The complete architecture record also contains:

- `employee_uuid`
- `agent_id`
- `provider_type`
- `worker_registry_version`
- `trust_level_snapshot`
- `permission_snapshot`
- `workspace_id`
- `branch_namespace`
- `boot_manifest_version`
- `current_task_id`
- `current_branch`
- `fencing_token`
- `last_checkpoint_id`
- `evidence_refs`
- `created_at`
- `updated_at`
- `archived_at`

`session_id`, `claim_id` and task fields may be `null` only while the Clone is not executing or awaiting review.

## 3. Identifier Format

Recommended display form:

```text
CLONE-CURSOR-000001
```

The registry allocates the numeric sequence. A Clone cannot choose its own ID. The durable record also carries an immutable collision-resistant `clone_uid`; display sequence and durable UID must resolve to the same record.

## 4. Identity Validation

Before `READY`, the Dispatcher verifies:

1. Worker exists and is eligible in Worker Registry.
2. Agent and Employee UUID resolve in Workforce V2.
3. Clone ID and UID are not already assigned.
4. Worker is not suspended or revoked.
5. Boot acknowledgment and required sources are current.
6. Logical workspace and branch namespace are authorized.
7. Review Owner exists and may review this risk class.
8. No second unfenced Session exists for the Clone.

Failure produces `CLONE_IDENTITY_BLOCKED` and no Claim.

## 5. Heartbeat

Heartbeat records:

```text
heartbeat_id
clone_id
session_id
claim_id
observed_at
sequence
fencing_token
runtime_status
checkpoint_id
health
```

Cadence and timeout are configurable policy values. A heartbeat is never accepted from a stale fencing token and never counts as Evidence that a task was completed.

## 6. Boot Evidence

Clone Boot must bind:

- current Human Decision and Task Envelope when work is requested;
- Company OS Boot version;
- Constitution and CURRENT source hashes;
- Worker and Agent registry versions;
- protected-path policy version;
- observed main SHA;
- workspace and branch;
- Session ID;
- boot timestamp and result.

## 7. Authority Boundary

A Monkey Clone may execute only an allocated Claim. It cannot self-register, self-promote, create another Clone, dispatch a Task, change registry authority, release its Claim, approve its work, merge main, push main, deploy or bypass protected paths.

## 8. Archive

Archived Clone IDs remain permanently reserved. Archive removes execution eligibility but preserves Session, Claim, Evidence, Review and Decision lineage.

