---
TITLE: "Company Memory Retention Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/COMPANY_MEMORY_RETENTION_STANDARD.md"
---

# Company Memory Retention Standard

## 1. Principle

Company Memory is a partitioned, versioned and governed memory system. It is never one infinitely growing JSON file, one chat transcript or one mutable snapshot.

## 2. Logical Partitions

Company Memory separates:

1. `IMMUTABLE_DECISIONS`;
2. `APPROVED_BASELINES`;
3. `ACTIVE_STATE`;
4. `WORKING_MEMORY`;
5. `HISTORICAL_ARCHIVE`;
6. `LESSONS_LEARNED`;
7. `PRIVATE_DATA`;
8. `HEAVEN_SECRET`;
9. `DIVINE_VAULT_REFERENCES`.

`DIVINE_VAULT_REFERENCES` contains identifiers and access policy only, never secret content. Public Git receives no KYC, exact GPS, credential, private key, seed phrase or private artifact.

## 3. Lifecycle Tiers

| Tier | Purpose | Typical content |
|---|---|---|
| Hot State | Current operational reads | Active Claims, queue projections, current Session pointers |
| Warm History | Recent recovery and review | Recent checkpoints, review evidence and task history |
| Cold Archive | Long-term auditable history | Closed projects, superseded standards and migration history |
| Immutable Canon | Permanent governed records | Constitution, approved Human Decisions, frozen baselines and audit roots |
| Disposable Telemetry | Short-lived operational signal | Raw heartbeat, transient UI state and low-value metrics |

Raw heartbeat and temporary telemetry are never permanently retained by default.

## 4. Memory Record Contract

```text
memory_id
memory_type
partition_id
aggregate_id
version
schema_version
source
source_sha
decision_id
causation_id
created_at
supersedes
status
visibility
retention_class
archival_class
legal_class
privacy_class
restore_priority
destruction_policy
evidence_refs
payload_hash
encryption_ref
next_action
```

## 5. Version and Migration

Every partition has a schema version and migration graph. Migration is append-only: the old representation remains auditable, the new representation points to its source, and validation proves invariant preservation.

Unknown versions fail closed for mutation. Read-only archival tools may preserve unknown records without interpreting them.

## 6. Snapshot and Replay

Snapshots include partition, aggregate revision, event cursor, schema version, checksum and creation authority. Restore verifies the checksum and replays immutable events after the cursor. A snapshot cannot erase source events.

Rollback selects a prior valid projection and replays from an approved point. It does not rewrite historical decisions.

## 7. Conflict Resolution

- Immutable Decision conflict: preserve both, apply Human authority and supersession rules.
- Active Claim conflict: defer to Canonical Claim Authority.
- Working Memory conflict: merge only by a type-specific strategy; otherwise `SAFE_HOLD`.
- Baseline conflict: AGB and Human approval required.
- Telemetry conflict: choose the valid source epoch for projection and discard expired duplicates.

Generic last-write-wins is forbidden for authority, ownership, evidence and frozen architecture.

## 8. Retention and Pruning

Each record has a reviewed retention policy. Pruning requires eligibility, dependency check, legal/privacy check, archive check and a destruction event. Immutable Canon and required audit roots are not pruned.

Compaction may replace many operational events with a verified summary plus replay anchor. It cannot remove evidence needed to validate the summary.

Deletion uses tombstones or destruction certificates where history must prove that a governed removal occurred. Private-data deletion must not leave recoverable plaintext in public artifacts.

## 9. Archival and Restore

Archives include checksums, manifests, schema readers, restore instructions, privacy classification and ownership. Restore priority classes are:

- `RESTORE_P0_AUTHORITY_AND_LEDGER`;
- `RESTORE_P1_EVIDENCE_AND_BASELINE`;
- `RESTORE_P2_ACTIVE_OPERATIONS`;
- `RESTORE_P3_ANALYTICS`;
- `NO_RESTORE_DISPOSABLE`.

## 10. Growth Controls

Partition quotas, maximum snapshot size, maximum replay window, compaction schedule, telemetry TTL and archive budget are policy fields. Quota exhaustion blocks new low-value telemetry before it threatens authority or evidence records.

## 11. Audit

Every migration, compaction, archive, restore, rollback, prune and destruction action writes an immutable audit event with actor, reason, scope, hashes and authorization.

## 12. Architecture Boundary

```text
Company Memory architecture: UNDER_INDEPENDENT_REVIEW
Storage implementation: NOT_STARTED
One giant JSON: FORBIDDEN
Hundred-year operation claimed: false
```
