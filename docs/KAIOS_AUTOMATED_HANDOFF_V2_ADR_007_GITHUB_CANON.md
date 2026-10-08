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

# ADR-007: GitHub canon

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Current main, #489 and #492 own relevant seams. Historical #177 is not a production base. Mutable comments and branch names cannot prove immutable task results.

## Decision

Preserve GitHub as code/specification canon and sanitized evidence projection; use exact commits and a single Draft PR for this package.

## Alternatives rejected

Reject refreshing/merging #177, parallel dispatcher implementation, issue spam and treating PR bodies as the atomic operational database.

## Consequences and limits

Boot remains protected. Existing README/index conventions register research; the minimal Boot inventory gap is explicit, not silently bypassed.

## Verification before adoption

Verify remote head, exact diff, links, existing owner compatibility and current CI; keep operational state claims separate.

## Evidence and related design

See [GitHub canon design](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
