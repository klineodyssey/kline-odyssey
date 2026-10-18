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

# ADR-008: Cost control

Decision status: **PROPOSED — research/design only**. This ADR does not authorize implementation, credentials, production or protected actions.

## Context

Repeated full-repository scans, unbounded retries and high-frequency polling can consume tokens, API limits and runner time without new evidence.

## Decision

Use change-driven bounded work, persisted SHA checkpoints, conditional retrieval, content caches, retry budgets and a lower background priority than K11520.

## Alternatives rejected

Reject full boot rereads for every heartbeat, cache-based authorization without freshness, and unlimited model/queue retries.

## Consequences and limits

Cache immutable blobs by repository+SHA+path+digest, parsed schemas by version and research by access date. Invalidate on relevant diff, policy/registry revocation changes or unverifiable checkpoints.

## Verification before adoption

Measure messages, model tokens, API calls, queue operations, bytes, retries, age and runner minutes per Work ID. Pause/escalate at approved caps; never spend beyond a grant.

## Proposed initial experiment budget

One active work item, eight transport attempts, 30-minute delivery deadline, 120-second lease/30-second heartbeat and 256 KiB envelope limit. Large artifacts travel as authorized digest-bound references. These are design starting points, not provider limits or measured costs. Model token ceiling and currency spending ceiling must be supplied by the approved experiment grant; absence means no paid provider activation.

Persist the last verified main SHA and compare changed paths before rereading relevant sources. Cache hits may avoid content parsing, but never skip current revocation, grant expiry, work revision or fence checks. Coalesce identical status notifications; do not send one comment per heartbeat. Capture estimated and actual cost separately. Stop background work if it contends with the active K11520 release.

## Evidence and related design

See [Cost control design](KAIOS_AUTOMATED_HANDOFF_V2_ARCHITECTURE.md) and the dated primary-source catalog in [Research](KAIOS_AUTOMATED_HANDOFF_V2_RESEARCH.md). Repository baseline is pinned in this document's metadata.
