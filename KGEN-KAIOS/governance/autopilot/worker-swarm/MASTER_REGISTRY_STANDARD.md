---
TITLE: "KAIOS Worker Swarm Master Registry Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Define one logical consistency facade over Clone, Session, Claim, Evidence, Decision and Review registries."
ANCESTOR: "KGEN-KAIOS/worker_registry.json; KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md; KGEN-KAIOS/decision/decision_log.jsonl; KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "CivilizationLifeform"
PHYLUM: "RegistryArchitecture"
CLASS: "CompanyStateRegistry"
ORDER: "MasterRegistry"
FAMILY: "KAIOSWorkerSwarm"
GENUS: "RegistryConsistencyFacade"
SPECIES: "KAIOSMasterRegistryArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/MASTER_REGISTRY_STANDARD.md"
---

# Master Registry Standard

## 1. Definition

Master Registry is a logical consistency facade over six governed registries:

1. Clone Registry
2. Session Registry
3. Claim Registry
4. Evidence Registry
5. Decision Registry
6. Review Registry

It is not a new giant JSON file, not a seventh source of truth, and not a replacement for existing formal logs. It provides identity resolution, referential integrity, version checks and atomic transition boundaries.

## 2. Registry Authority Map

| Logical registry | Existing formal source | Proposed addition |
|---|---|---|
| Clone | Workforce / Worker registries | Clone runtime identity and pointers |
| Session | No active main source | Immutable Session and checkpoint records |
| Claim | Claim Lease protocol, schema and WorkQueue | Canonical lock, version and fencing token |
| Evidence | Reports and provenance governance | Immutable evidence package index |
| Decision | `decision_log.jsonl` | Stable decision lookup and cross-reference |
| Review | `CODEX_REVIEW_LOG.md` and task reports | Stable review identity and disposition lookup |

Existing files remain authoritative within their domains until a separately approved migration establishes a transactional store. Candidate Company OS files do not become CURRENT by being referenced here.

## 3. Common Record Envelope

Every registry record exposes:

```text
registry_name
record_id
record_type
record_version
status
created_at
updated_at
created_by
source_event_id
source_decision_id
correlation_id
previous_record_version
content_hash
evidence_refs
```

## 4. Transaction Envelope

Cross-registry changes use:

```text
transaction_id
expected_registry_versions
operations
invariants_checked
fencing_token
actor_id
authority_decision_id
started_at
committed_at
result
rollback_reference
```

The transaction commits all required pointer changes or none. A future implementation may use database transactions or an equivalent compare-and-set coordinator, but technology selection is out of scope.

## 5. Cross-Registry Invariants

- Clone worker identity exists and is eligible.
- Session belongs to the same Clone and Worker.
- Claim belongs to the same Session, Clone, Worker and Task.
- Evidence references the exact Claim, Session, branch and head SHA.
- Review references the Evidence and assigned Review Owner.
- Decision references the Review or explains why Review is not applicable.
- Close / Release cannot precede required Review and Decision.
- No active Task or Clone has conflicting Claim pointers.
- All writes carry the current fencing token and expected versions.

## 6. Consistency Model

Strong consistency is required for Claim acquisition, Session fencing, Review custody and Close / Release. Read-only dashboards may use eventually consistent snapshots when they display `as_of`, source versions and freshness.

Last-write-wins is prohibited for identity, Claim, ownership, Review or Decision state.

## 7. Evidence Registry

Evidence records contain metadata and content references, not secret payloads:

```text
evidence_id
task_id
claim_id
clone_id
session_id
branch
base_sha
head_sha
report_path
changed_files
test_refs
protected_path_result
content_hashes
submitted_at
submitted_by
validation_status
```

## 8. Decision and Review Immutability

A Decision or Review is never edited in place to change history. Corrections append a superseding record with `supersedes_id`, reason and authority.

## 9. Scale and Partitioning

Future storage may partition by stable hashed IDs and maintain secondary indexes for Worker, Task, status and time. Claim allocation still requires a unique Task lock and Clone lock. Sharding must not permit two partitions to allocate the same Task.

## 10. Migration Boundary

A future implementation must first inventory active files, define migration mappings, preserve legacy IDs, validate cross-references, run shadow reads and obtain Human approval before switching authority. This proposal performs none of those actions.

