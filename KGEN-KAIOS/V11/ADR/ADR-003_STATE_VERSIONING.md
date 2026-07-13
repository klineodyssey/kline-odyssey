# ADR-003: Immutable Civilization State Versioning

- Status: **UNDER_REVIEW**
- Classification: **PARTIAL_ACCEPT**
- Target: **V11.1**
- Implementation: **NOT_STARTED**

## Context

V11 already uses optimistic versioning, compare-and-set, idempotency, append-only audit, supersession, tombstones and rollback concepts. A first-class immutable Civilization State graph and snapshot policy are not yet defined.

## Decision

V11.1 should define `state_version_id`, parent version, source event range, expected-version write, conflict outcome, snapshot checksum, rollback target, migration status and retention.

Snapshots are derived read models. They must not replace append-only evidence or erase rejected versions.

## Consequences

Concurrent Agent changes become detectable and recoverable. Storage, retention and migration costs must be measured before implementation.

## Evidence

- `SYSTEM_ARCHITECTURE.md`: optimistic versioning and append-only audit.
- `MULTI_AGENT_RUNTIME.md`: idempotent claims and recovery.
- `AGENT_RUNTIME.md`: superseded memory and durable history.
