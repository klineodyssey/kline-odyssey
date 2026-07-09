# KAIOS Master Plan

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Goal

Create the minimum architecture that can scale KGEN AI Company from a Cursor-only pilot into a multi-worker operating system.

## Plan

| Phase | Goal | Output |
|---|---|---|
| V7.0 | Architecture first | KAIOS architecture files and readiness review |
| V7.1 | Worker normalization | Worker registry, generic worker protocol, branch namespace |
| V7.2 | Dispatcher hardening | Claim leases, stale branch detection, WorkQueue metadata |
| V7.3 | Review pipeline hardening | Pre-merge checklist, review state machine, rejection routing |
| V7.4 | Dashboard model | Worker/task/review/blocker health dashboard |
| V7.5 | Recovery drills | Lost branch, stale branch, dead worker, conflict, bad push handling |

## Success Criteria

- A worker can join without private chat memory.
- A worker can claim exactly one task.
- A worker can be reviewed without touching Human Main.
- Codex can reject or merge without ambiguity.
- Dashboard state can be reconstructed from GitHub artifacts.

## Do Not Do Yet

- Do not create 100 workers.
- Do not create automation scripts.
- Do not rewrite the existing WorkQueue yet.
- Do not migrate protected path naming yet.
- Do not replace AI Company documents.
