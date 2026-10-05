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

# ADR-004: Inbox and outbox

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Dual writes and an early dedupe marker can respectively lose notifications or suppress unfinished effects. RAM maps disappear on restart.

## Decision

Commit work mutation, audit event and outbound intent together; commit inbox dedupe with its local effect and ACK outbox. Use fenced leases for ownership.

## Alternatives rejected

Reject chat tabs as state, JSON files as a distributed lock, and queue visibility as sufficient fencing. Reuse #489 interfaces only in a separately authorized worker namespace.

## Consequences and limits

Requires durable transactions, recovery discipline and downstream fence enforcement. A queue is optional infrastructure, not an authority shortcut.

## Verification before adoption

Crash at every boundary; race two claimants; resume an expired owner; restore backup; confirm no duplicated committed local effect.

## Evidence and related design

See [Inbox and outbox design](KAIOS_AUTOMATED_HANDOFF_V2_ARCHITECTURE.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
