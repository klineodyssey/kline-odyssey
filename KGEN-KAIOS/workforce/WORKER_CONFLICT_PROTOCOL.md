# KGEN Worker Conflict Protocol

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-07-12  
**Task ID:** KGEN-WORKFORCE-ROSTER-2026-0001

## Conflict Types

`TASK_CLAIM_CONFLICT`, `FILE_OWNERSHIP_CONFLICT`, `ARCHITECTURE_DISAGREEMENT`, `CANON_CONFLICT`, `STALE_BRANCH_CONFLICT`, `DUPLICATE_WORK`, `UNAUTHORIZED_CHANGE`, `REVIEW_DISAGREEMENT`, `MERGE_CONFLICT`.

## Decision Priority

1. Protected Paths.
2. Current Canon.
3. Human Decision.
4. Codex Review Decision.
5. Accepted Architecture Decision.
6. Current WorkOrder.
7. Worker Proposal.

## Primary Owner Rule

One WorkOrder has exactly one Primary Owner. Other workers may act as Advisor or Reviewer, but may not simultaneously modify the same files unless Codex explicitly splits the task.

## Architecture Disagreement

Workers submit separate proposals and do not overwrite each other. Codex creates a decision record. High-risk disagreements go to Human decision.

## Unauthorized Change

Unauthorized changes are preserved as evidence, not deleted. Codex classifies them as reviewable, blocked, rejected or security incident and creates a fix WorkOrder when needed.
