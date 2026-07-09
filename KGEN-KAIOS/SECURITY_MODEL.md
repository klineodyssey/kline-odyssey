# Security Model

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

KAIOS defines role-based permissions so workers can join safely.

## Permission Tiers

| Tier | Role | Permission |
|---|---|---|
| L0 | Human | Final authority, protected path exception approval |
| L1 | CEO / Codex | Dispatch, review, merge, push main |
| L2 | PM | Plan tasks, propose queue updates, no direct main push |
| L3 | Reviewer | Review reports and advise, no main push by default |
| L4 | Worker | Claim tasks, create reports, push handoff branches |
| L5 | Guest | Read-only analysis unless promoted |

## Protected Path Rule

Workers must not modify protected paths without explicit human authorization. Reviewers must reject unauthorized protected path changes.

## Main Branch Rule

Only Codex or explicitly authorized maintainers may push `origin/main`.

## Security Events

- Unauthorized main push.
- Protected path diff.
- Missing report.
- Worker exceeds permission.
- Handoff branch rewrites review evidence.
