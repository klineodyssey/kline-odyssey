---
TITLE: "PrimeForge Architecture Backlog Registry"
VERSION: "1.0.1"
REVISION: "2026-07-16.4"
STATUS: "ACTIVE_MANAGED_REGISTRY"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "CODEX_DELEGATED_GM"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Register the Codex Swarm Runtime V1 Architecture Proposal and its enablement gates."
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
| Codex Swarm Runtime V1 | PROPOSAL_COMPLETE | 90 | Level B R2 Architecture | Proposal commit `b24c936`; Clones inactive | Independent review before any registry or runtime enablement |
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

## Current Decisions

- Do not merge stale Land/Civilization worktree duplicates; main already contains the frozen baselines.
- Do not promote Life Manufacturing at score 61.
- Do not freeze Kernel V1 before Kernel Law Layer.
- World Viewer amendments are resolved and its frozen Architecture permits only the prepared synthetic, non-production sandbox plan.
- Life OS is reconciled with Species OS at Architecture level; external review remains required before implementation.
- Cursor Control is published only as a proposal and does not replace CURRENT Worker rules.
- Distributed automatic Cursor dispatch remains disabled until the canonical Claim authority exists.
- Codex Swarm is a scoped internal-identity amendment to Worker Swarm; it creates no second Governance, Dispatcher or WorkQueue and activates no Clone.
- Genesis DNA normalizes legacy GA levels without changing Physics CURRENT or GEN-007; private engine artifacts remain outside Git.

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

