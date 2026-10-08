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

# ADR-005: Reviewer independence

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Different instances or sessions can share a builder controller; even different model vendors may be orchestrated by one controller.

## Decision

For an independence claim, require distinct verified Life, Worker, controller domain and credential principal, plus exact-result review authorization. Unknown fails closed.

## Alternatives rejected

Reject builder self-review and two caller-selected identity labels as independent review. Do not invent a mandatory second reviewer for ordinary merges.

## Consequences and limits

Same-controller QA remains valuable but is labelled as such. Human merge approval follows existing policy and does not retroactively prove independence.

## Verification before adoption

Verify bindings and shared-control limits; test identical Life/Worker/controller/key and missing fields; ensure review target SHA cannot be substituted.

## Evidence and related design

See [Reviewer independence design](KAIOS_AUTOMATED_HANDOFF_V2_IDENTITY_MODEL.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
