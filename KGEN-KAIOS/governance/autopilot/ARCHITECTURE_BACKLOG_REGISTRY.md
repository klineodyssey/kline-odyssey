---
TITLE: "PrimeForge Architecture Backlog Registry"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_MANAGED_REGISTRY"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "CODEX_DELEGATED_GM"
SOURCE_COMMIT: "PENDING_LEVEL_B_PUBLICATION"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Inventory isolated proposals, dependencies, review scores and safe next actions without combining unrelated commits."
ANCESTOR: "Company Inbox; Priority Scheduler; Architecture Governance Board"
SOURCE_OF_TRUTH: "FALSE_UNTIL_PUBLISHED"
---

# Architecture Backlog Registry

## Rules

This registry inventories proposals; it does not approve Architecture by existence. Worktree values are logical IDs so public documents do not expose private local paths. Every proposal remains in its own commit scope.

Priority order is reviewed proposals, amendments, dependency blockers, Company OS/coordination, Kernel/Laws, Life OS/Boot, Land/Civilization, World Viewer, Life Manufacturing, Economy/Mining, then future ideas.

## Backlog

| Proposal | Review | Score | Risk | Baseline / implementation | Next action |
|---|---|---:|---|---|---|
| Company Autopilot / Company OS | APPROVED_BY_DELEGATION | 93 | Level B | Documentation baseline candidate | Commit and publish scoped governance package |
| Worker Swarm | INTERNAL_REVIEW_READY | 90 | Level B | Architecture only | Add review evidence, then publish with Company coordination dependency |
| Boot / Life Integrity | INTERNAL_REVIEW_READY | 91 | Level B | Architecture only | Publish proposal; independent review before baseline |
| World Viewer | APPROVE_WITH_AMENDMENTS | 88 | Level B | Sandbox eligible | Resolution, ADR, baseline and Synthetic Demo plan |
| Life OS | REVIEW_REQUIRED | null | Level B candidate | Architecture only | Independent review against Species OS amendment |
| Life Manufacturing | MAJOR_REVISION | 61 | HOLD | No baseline | Preserve review evidence; do not implement |
| Cursor Control | INTERNAL_REVIEW_REQUIRED | null | Level B candidate | Architecture only | Review after Company OS publication |
| Kernel Law Layer | MISSING_PROPOSAL | null | HOLD | Not created | Architecture proposal before Kernel freeze |
| Company Memory | MISSING_PROPOSAL | null | HOLD | Not created | Define only after Session/Registry baseline |
| Land / Civilization Economy | MERGED_EQUIVALENT | 100 | Frozen docs | Baselines on main | No duplicate merge |
| Kernel V1 | MAIN_ARCHITECTURE_PRESENT | null | HOLD | Freeze deferred | Wait for Kernel Law Layer review |
| V11 Baseline | FROZEN | 100 | Level C core | Implementation hold | Human decision required for core change |
| Canonical Atomic Claim Authority | PROPOSAL | 87 | Level B planning | Implementation not started | Independent security/consistency review |

## Current Decisions

- Do not merge stale Land/Civilization worktree duplicates; main already contains the frozen baselines.
- Do not promote Life Manufacturing at score 61.
- Do not freeze Kernel V1 before Kernel Law Layer.
- World Viewer may enter a synthetic, non-production sandbox after amendment resolution.
- Life OS must be reconciled with Species OS before baseline.
- Distributed automatic Cursor dispatch remains disabled until the canonical Claim authority exists.

## Commit Isolation

Recommended commit families remain separate:

```text
docs(governance)
docs(worker-swarm)
docs(boot-integrity)
docs(life-os)
docs(world-viewer)
feat(world-viewer-sandbox)
test(...)
chore(indexes)
```

