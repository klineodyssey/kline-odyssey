---
TITLE: "KAIOS Clone Registry Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define unique Clone identity, current custody pointers, heartbeat and evidence references."
ANCESTOR: "KGEN-KAIOS/worker_registry.json; KGEN-KAIOS/workforce/agent_registry.json; KGEN-KAIOS/workforce/agent_runtime_status.json"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "DigitalLife"
PHYLUM: "RegistryArchitecture"
CLASS: "WorkerRuntimeRegistry"
ORDER: "CloneRegistry"
FAMILY: "KAIOSWorkerSwarm"
GENUS: "CloneIdentityRegistry"
SPECIES: "KAIOSCloneRegistryArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/CLONE_REGISTRY_STANDARD.md"
---

# Clone Registry Standard

## 1. Boundary

Clone Registry records runtime execution identities. It references, but does not duplicate or supersede, Workforce V2 Employee / Agent identity or Worker Registry authorization.

No live `clone_registry.json` is created in this architecture round. The record below is a schema-level proposal.

## 2. Clone Record

```text
clone_id
clone_uid
employee_uuid
agent_id
worker_id
provider_type
current_session_id
current_claim_id
current_task_id
review_owner_id
current_status
heartbeat_at
boot_time
boot_version
worker_registry_version
trust_level_snapshot
permission_snapshot
workspace_id
branch_namespace
current_branch
fencing_token
last_checkpoint_id
evidence_refs
created_at
updated_at
archived_at
record_version
```

## 3. Required Invariants

- `clone_id` and `clone_uid` are globally unique and immutable.
- One active `worker_id` maps to one active Clone in V1.
- `employee_uuid`, `agent_id` and `worker_id` must resolve to compatible records.
- `current_session_id` is null or points to one unfenced active Session.
- `current_claim_id` is null or points to the same Session and Task.
- `review_owner_id` must resolve before Claim allocation.
- `heartbeat_at` must be produced by the current fencing token.
- `record_version` changes through compare-and-set, never blind overwrite.
- Archive does not delete history or release unresolved Claim custody.

## 4. Events

Clone history is append-only:

- `CLONE_REGISTERED`
- `BOOT_STARTED`
- `BOOT_COMPLETED`
- `SESSION_BOUND`
- `CLAIM_BOUND`
- `HEARTBEAT_RECORDED`
- `HANDOFF_SUBMITTED`
- `REVIEW_CUSTODY_ENTERED`
- `REPAIR_ASSIGNED`
- `RECOVERY_FENCED`
- `RECOVERY_SESSION_BOUND`
- `CLAIM_CLOSED`
- `CLAIM_RELEASED`
- `SESSION_CLOSED`
- `CLONE_SUSPENDED`
- `CLONE_ARCHIVED`

Snapshots are derived from events and carry an event cursor or registry version.

## 5. Uniqueness and Conflict

Duplicate Clone ID, duplicate active Worker mapping, duplicate active Session, claim pointer mismatch or stale record version returns `REGISTRY_CONFLICT`. The Dispatcher must not repair this by last-write-wins. It preserves both observations and requests Review.

## 6. Privacy

Registry records use logical workspace IDs. They do not store private local paths, private prompts, token values, secrets, private keys, passwords, exact private GPS, private KYC or personal contact data.

## 7. Registration Authority

Creating a Clone record does not activate a Worker. Registration requires existing workforce governance and Human/Codex authority. A Worker or Cursor window cannot create its own formal Clone entry.

