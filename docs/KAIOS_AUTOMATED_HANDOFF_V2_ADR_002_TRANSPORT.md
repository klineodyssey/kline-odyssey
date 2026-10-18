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

# ADR-002: Transport

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

GitHub, Codex, email, webhooks and queues offer different addressability and delivery semantics; none is already proven to satisfy the full employee ACK chain.

## Decision

Keep a provider-neutral envelope. Use GitHub for the current research deliverable; select a real transport only after endpoint capability verification.

## Alternatives rejected

Reject PR-comment-as-ACK, email-read assumptions and an invented Codex employee API. Do not create a new paid service or noisy issue-per-message workflow.

## Consequences and limits

A later adapter can be swapped without changing authorization. More verification work is required before a zero-copy-paste demo is truthful.

## Verification before adoption

Demonstrate exact recipient addressing, auth, durable receipt, application ACK, bounded retry, privacy and outage behavior on the actual approved endpoint.

## Evidence and related design

See [Transport design](KAIOS_AUTOMATED_HANDOFF_V2_TRANSPORT_MATRIX.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
