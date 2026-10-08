---
VERSION: "0.2.0-design"
REVISION: "2026-10-05.1"
STATUS: "RESEARCH_DESIGN_DRAFT_NOT_OPERATIONAL"
LAST_UPDATED: "2026-10-05"
UPDATED_BY: "dot (temporary external maintainer)"
REVIEWED_BY: "NOT_YET_REVIEWED"
SOURCE_COMMIT: "27a21b031afad333468d9d3847d1933bc053487e"
TASK_ID: "KAIOS-AUTOMATED-HANDOFF-V2-RESEARCH-20261005"
CHANGE_REASON: "Human-requested research and design; no operational authority."
ANCESTOR: "company/COMPANY_MESSAGE_STANDARD.md; historical PR #177"
SOURCE_OF_TRUTH: false
---

# ADR-001: Identity

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Text fields, unkeyed hashes and branch-local registries are self-consistency checks. They cannot establish who authored a task. Existing registry entries have incomplete controller bindings.

## Decision

Use an approved external trust bootstrap and short-lived, attributable bindings; separate Life, Worker, Instance, Session and Controller. Define WORKER_IDENTITY_AUTHORITY as an interface only.

## Alternatives rejected

Reject self-signed enrollment and reuse of Player Account/wallet authentication as Worker authority. A repository/transport account alone does not establish a KAIOS role.

## Consequences and limits

No credentials or registrations are created. Unknown, stale or revoked identity blocks admission. Issuer compromise and hidden shared control remain residual trust risks.

## Verification before adoption

Prove challenge possession, audience and freshness; reject fabricated registry, revoked key, wrong instance and replay; review enrollment/rotation/revocation administration separately.

## Evidence and related design

See [Identity design](KAIOS_AUTOMATED_HANDOFF_V2_IDENTITY_MODEL.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
