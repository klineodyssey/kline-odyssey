---
TITLE: "Distributed State Consistency Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/DISTRIBUTED_STATE_CONSISTENCY_STANDARD.md"
---

# Distributed State Consistency Standard

## 1. Principle

Company Runtime does not use one consistency model for every datum. Integrity, availability, latency, privacy and replay needs are classified per domain before storage technology is selected.

## 2. Consistency Classes

### Class A: Strong Consistency

Required for:

- Claim ownership and fencing epoch;
- money and payroll ledger state;
- land ownership and rights;
- Human Decisions and revocation;
- authorization and autonomy level;
- Spawn Budget consumption.

Writes require atomic compare-and-swap or an equivalent linearizable transaction. During partition, unavailable is safer than double ownership.

### Class B: Eventual Consistency

Allowed for:

- heartbeat and worker presence;
- UI status and dashboards;
- analytics and observability;
- non-authoritative resource summaries;
- cached architecture views.

Updates carry monotonic time, source revision and staleness. UI projections never become authorization sources.

### Class C: Append-only Immutable

Required for:

- Evidence Chain;
- Decision Log;
- Review Log;
- Handoff history;
- audit and security history;
- architecture evolution history.

Corrections append a superseding event. Historical records are never silently rewritten.

## 3. Pattern Selection

| Pattern | Approved use | Forbidden use |
|---|---|---|
| Event Sourcing | Claims, decisions, review custody, evidence and auditable transitions | Unbounded raw telemetry |
| Append-only Ledger | Financial, land, authorization and audit events | Mutable presence cache |
| Snapshot + Replay | Materialized state recovery from immutable events | Replacing the immutable log |
| Strong Transaction | Claim, authority, money and land mutations | Every heartbeat write |
| Eventual Projection | UI, presence, analytics and health summaries | Ownership or permission checks |
| CRDT | Explicitly approved low-risk counters or presence sets | Claims, money, land, Human authority or evidence verdicts |
| Partitioned State Store | Company and Region aggregates | Cross-partition mutation without coordinator |

## 4. State Envelope

Every authoritative mutation includes:

```text
aggregate_type
aggregate_id
partition_id
revision
epoch
event_id
causation_id
correlation_id
idempotency_key
actor_id
authorization_ref
occurred_at
recorded_at
schema_version
payload_hash
previous_event_hash
```

Stale `revision` or `epoch` fails closed. Duplicate `idempotency_key` returns the existing result without reapplying a mutation.

## 5. Partition Model

S0 may use one bounded Company partition. S1 partitions by Company, Department or another reviewed ownership boundary. Cross-partition operations use a coordinator and compensating or rollback design; they never pretend to be atomic when they are not.

S2 regional federation and S3 planetary distribution require a separate architecture review.

## 6. Snapshot and Replay

A snapshot records aggregate revision, event cursor, schema version, checksum, source partition and creation authority. Restore verifies the checksum and replays later immutable events. A corrupt snapshot is quarantined and never used as a silent fallback.

Snapshots are performance artifacts, not historical truth. The immutable log and approved Canon remain authoritative.

## 7. Conflict Resolution

| Conflict | Resolution |
|---|---|
| Claim ownership | Strong transaction and fencing; loser is rejected |
| Human Decision | Higher current Human authority event supersedes; history retained |
| Money or land | Stop and reconcile against authoritative ledger |
| Heartbeat | Latest valid source epoch and monotonic timestamp wins in projection |
| UI state | Rebuild from authoritative source |
| Evidence | Never merge payloads; append a superseding evidence event |
| Company Memory | Type-specific rule, schema migration and Human/Codex resolution when ambiguous |

No generic last-write-wins rule is allowed for authority or ownership.

## 8. Domain Event Bus

There is no unrestricted global event bus. Events are separated into:

- `life.events`;
- `mind.events`;
- `citizen.events`;
- `company.events`;
- `economy.events`;
- `land.events`;
- `worker.events`;
- `audit.events`.

Every event contract declares:

```text
namespace
event_type
schema
version
retention
rate_limit
authorization
producer_list
consumer_list
privacy_class
dead_letter_policy
```

Wildcard cross-domain subscriptions are forbidden. A consumer receives only fields needed for its declared capability.

## 9. Life OS Boundary

Life OS may publish and consume only life-maintenance events. It cannot access Company Dispatch, WorkQueue, Payroll, Land Registry, Marketplace Settlement, Git, Review Authority or Company Memory.

Mind Runtime owns reasoning and behavior. Citizen Runtime owns social roles. Company Runtime owns company work. Boundary tests must prove denied API calls, denied event subscriptions and denied state mutations.

## 10. Dead-letter and Backpressure

Each Domain owns a bounded dead-letter policy. Repeated failure triggers backoff, quarantine and alerting; it does not create infinite retry. Event-rate quota and consumer lag are visible in observability summaries.

## 11. Failure Semantics

- Strong state unavailable: `SAFE_HOLD_NO_NEW_MUTATION`.
- Eventual projection stale: display freshness and continue read-only where safe.
- Immutable chain invalid: quarantine, block dependent review and escalate.
- Partition conflict: stop cross-partition operation and preserve both histories.

## 12. Architecture Boundary

This standard selects consistency contracts, not a production database or broker.

```text
Architecture: MAJOR_REVISION_IN_PROGRESS
Database deployed: false
Event bus deployed: false
S0/S1: ARCHITECTURE_TARGET
S2/S3: FUTURE
```
