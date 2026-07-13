---
VERSION: "11.0-review-resolution"
REVISION: "2026-07-13.1"
STATUS: "UNDER_REVIEW"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "cab345b"
TASK_ID: "KAIOS-V11-ARCH-REVIEW-RESOLUTION-20260713"
CHANGE_REASON: "Resolve the independent state-versioning comment."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: false
Domain: "KGENVERSE"
Kingdom: "CivilizationLifeform"
Phylum: "GovernanceDocument"
Class: "ArchitectureDecisionRecord"
Order: "ReviewResolution"
Family: "KAIOS"
Genus: "V11"
Species: "ADR003StateVersioning"
canonical_file: "KGEN-KAIOS/V11/ADR/ADR-003_STATE_VERSIONING.md"
---

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
