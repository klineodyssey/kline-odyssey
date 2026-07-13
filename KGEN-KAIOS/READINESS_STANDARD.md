# KAIOS Readiness Standard

**Document ID:** KAIOS-READINESS-STANDARD  
**Version:** 1.0  
**Status:** ACTIVE  
**Owner:** Codex General Manager  
**Task ID:** KAIOS-V11-READINESS-RECOVERY-20260713  
**Source Of Truth:** TRUE

## Purpose

This standard prevents a readiness report from failing solely because generating the report creates new files. It also prevents dirty system work from being hidden behind a clean reporting worktree.

## Dirty State Classes

### SYSTEM_DIRTY

`SYSTEM_DIRTY` blocks readiness. It includes:

- uncommitted work in an active Codex review, merge, worker, or deployment worktree;
- a local patch not preserved on a remote evidence, draft, handoff, or approved branch;
- an unresolved merge, rebase, cherry-pick, conflict, index lock, or pending push;
- unadjudicated handoff submissions;
- an unapproved draft still mixed with an active system branch; or
- any protected-path change without explicit authorization.

### REPORT_GENERATION_DIRTY

`REPORT_GENERATION_DIRTY` does not by itself block readiness. It is limited to the readiness report, its machine-readable snapshot, and explicitly listed governance closeout files created in the current readiness task.

It is permitted only when:

1. the worktree was clean before report generation;
2. every changed file is declared in the report;
3. no implementation, deployment, Runtime, Canon, Boot, wallet, contract, bridge, final-whitepaper, or protected path is changed;
4. JSON and Markdown validation passes;
5. the changes are committed together as a governance closeout; and
6. final verification after push confirms the system worktrees remain clean.

Any unexpected file converts the state to `SYSTEM_DIRTY`.

### HUMAN_MAIN_ISOLATED

Human Main may contain Human-owned uncommitted files. Under Workspace Policy, AI must not stash, reset, delete, overwrite, or include them. A dirty Human Main is recorded as `HUMAN_MAIN_ISOLATED`, not `SYSTEM_DIRTY`, when all AI work occurs in separate clean worktrees and no system operation depends on those files.

## Handoff Readiness

A remote handoff branch is pending only until Codex records one allowed disposition with branch, tip, base, report, claim, purity, protected-path, and queue evidence. An approved, rejected, blocked, duplicate, or evidence-only branch remains visible for audit but is no longer pending.

Branch existence alone is not a pending review. Conversely, a new tip after an earlier decision creates a new pending submission and requires a new decision.

## Pending Commit And Push

- A local commit whose patch is already integrated may be preserved under an `archive-evidence/` ref and excluded from pending push.
- An unapproved research draft may be preserved under a `draft/` ref and excluded from pending push and handoff counts.
- Evidence preservation never implies approval or merge eligibility.
- A unique unreviewed patch remains pending until it is approved, rejected, blocked, or preserved as evidence with a recorded decision.

## READY Conditions

Readiness is `READY` only when:

- pending reviews are zero;
- pending handoff decisions are zero;
- pending push patches are zero;
- system worktrees are clean;
- protected-path violations are zero;
- GitHub DNS, HTTPS, TCP 443, and fetch are healthy;
- the latest required Pages workflow and health routes are healthy;
- unapproved drafts are isolated; and
- every unique local patch has a recorded disposition.

`REPORT_GENERATION_DIRTY` may coexist with `READY` only until the governance closeout commit is pushed and verified.

## Start Boundary

A `READY` result authorizes only the next explicitly approved planning step. It does not authorize implementation, deployment, Pages changes, protected-path changes, or automatic adoption of archived drafts.

