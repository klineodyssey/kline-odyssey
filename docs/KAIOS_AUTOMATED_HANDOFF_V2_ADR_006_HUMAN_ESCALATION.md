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

# ADR-006: Human escalation

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Protected actions, missing bindings, ambiguous effects and exhausted budgets cannot be resolved by claiming more authority.

## Decision

Escalate only a concrete decision or unavailable authority, with bounded safe evidence; preserve automated transport as the goal without bypassing consent.

## Alternatives rejected

Reject silence as consent, third-party instructions as Human approval and routine Human copy/paste as successful automation.

## Consequences and limits

Some cases remain blocked. A Human-approved ordinary merge is distinct from production identity, deployment or financial execution.

## Verification before adoption

Test malicious approval text, expired grant, protected scope and ambiguous effect; require the exact authorized revision before resume.

## Evidence and related design

See [Human escalation design](KAIOS_AUTOMATED_HANDOFF_V2_THREAT_MODEL.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
