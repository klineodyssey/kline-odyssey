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

# ADR-003: Delivery semantics

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

A send timeout may follow successful delivery; broker acceptance differs from receiver acceptance. Vendor exactly-once contracts have documented boundaries.

## Decision

Assume at-least-once delivery attempts with durable idempotent acceptance and explicit application ACK/result states. Do not promise universal exactly-once effects.

## Alternatives rejected

Reject fire-and-forget, transport success as completion, and marking delivery failed solely because a response was lost.

## Consequences and limits

Duplicate work is controlled within the transactional/effect scope. External effects without idempotency or reconciliation stop as unknown rather than being blindly retried.

## Verification before adoption

Inject lost receipts/ACKs, duplicate publishes, out-of-order callbacks and post-effect crashes; prove stored outcomes and effect counts.

## Evidence and related design

See [Delivery semantics design](KAIOS_AUTOMATED_HANDOFF_V2_STATE_MACHINE.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
