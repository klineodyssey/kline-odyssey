---
TITLE: "PrimeForge Architecture Backlog Registry"
VERSION: "1.0.2"
REVISION: "2026-07-16.5"
STATUS: "ACTIVE_MANAGED_REGISTRY"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "CODEX_DELEGATED_GM"
SOURCE_COMMIT: "d5d9b2cc5bafd67ec600fccb2701f638020d9741"
TASK_ID: "HUMAN-MERGE-CONFLICT-001"
CHANGE_REASON: "Reconcile Company Decision Center and UI Governor additions while preserving both proposal histories and all existing baselines."
ANCESTOR: "Company Inbox; Priority Scheduler; Architecture Governance Board"
SOURCE_OF_TRUTH: true
---

# Architecture Backlog Registry

## Rules

This registry inventories proposals; it does not approve Architecture by existence. Worktree values are logical IDs so public documents do not expose private local paths. Every proposal remains in its own commit scope.

Priority order is reviewed proposals, amendments, dependency blockers, Company OS/coordination, Kernel/Laws, Life OS/Boot, Land/Civilization, World Viewer, Life Manufacturing, Economy/Mining, then future ideas.

## Backlog

| Proposal | Review | Score | Risk | Baseline / implementation | Next action |
|---|---|---:|---|---|---|
| Company Autopilot / Company OS | APPROVED_BY_DELEGATION | 93 | Level B | Documentation baseline; local commit `6936d6f` | Validate and publish integration branch |
| Company Decision Center V1 | PROPOSAL_COMPLETE | 91 | Level B R2 Architecture | Proposal commit `080ae7f`; command cutover disabled | Independent review, Resolution and ADR before baseline |
| Worker Swarm | INTERNAL_REVIEW_READY | 90 | Level B | Proposal; local commit `8ed6fc6` | External review before baseline |
| Boot / Life Integrity | INTERNAL_REVIEW_READY | 91 | Level B | Proposal; local commit `190d8d5` | Independent review before baseline |
| World Viewer | APPROVE_WITH_AMENDMENTS_RESOLVED | 88 | Level B | `WORLD-VIEWER-V1.0` frozen; local commit `780ffee` | Offer Synthetic Demo after current queue priority |
| Life OS | INTERNAL_REVIEW_COMPLETE | 89 | Level B | `LIFE-OS-V1.0` frozen; local commit `5baeb80` | External review before sandbox implementation |
| Life Manufacturing | MAJOR_REVISION | 61 | HOLD | No baseline | Preserve review evidence; do not implement |
| Cursor Control | PREPUBLICATION_STRUCTURE_AUDIT_COMPLETE | null | Level B candidate | Proposal; local commit `299d275` | Architecture review before effective cutover |
| Kernel Law Layer | MISSING_PROPOSAL | null | HOLD | Not created | Architecture proposal before Kernel freeze |
| Company Memory | MISSING_PROPOSAL | null | HOLD | Not created | Define only after Session/Registry baseline |
| Land / Civilization Economy | MERGED_EQUIVALENT | 100 | Frozen docs | Baselines on main | No duplicate merge |
| Kernel V1 | MAIN_ARCHITECTURE_PRESENT | null | HOLD | Freeze deferred | Wait for Kernel Law Layer review |
| V11 Baseline | FROZEN | 100 | Level C core | Implementation hold | Human decision required for core change |
| Canonical Atomic Claim Authority | PROPOSAL | 87 | Level B planning | Local commit `6936d6f`; implementation not started | Independent security/consistency review |
| Genesis DNA Evolution | SOURCE_AUDIT_COMPLETE | null | Level B R2 architecture | Published review candidate `e6d7a96`; implementation not started | Independent architecture review before resolution or baseline |
| UI Governor / Style Canon V1 | CODEX_DRAFT_COMPLETE | 86 | Level B R2 architecture | Proposal branch; automation and implementation not started | Independent UI architecture review |

## Current Decisions

- Do not merge stale Land/Civilization worktree duplicates; main already contains the frozen baselines.
- Do not promote Life Manufacturing at score 61.
- Do not freeze Kernel V1 before Kernel Law Layer.
- World Viewer amendments are resolved and its frozen Architecture permits only the prepared synthetic, non-production sandbox plan.
- Life OS is reconciled with Species OS at Architecture level; external review remains required before implementation.
- Cursor Control is published only as a proposal and does not replace CURRENT Worker rules.
- Distributed automatic Cursor dispatch remains disabled until the canonical Claim authority exists.
- Company Decision Center is a target command control plane only; existing Decision, Inbox, WorkQueue and Review sources remain current until an explicit Human cutover.
- Genesis DNA normalizes legacy GA levels without changing Physics CURRENT or GEN-007; private engine artifacts remain outside Git.
- UI Governor defines 80 daily surface/profile cells and fourteen check families, but executable coverage remains zero until independent review and implementation authorization.

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

