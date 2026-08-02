---
title: KAIOS AI Workforce 24H Scheduler
schedule_version: 1.0.0
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
status: ACTIVE
authority: CODEX_CONTROLLED
---

# KAIOS AI Workforce 24H Scheduler

Maximum execution window: `2026-08-02T09:35:00Z` through
`2026-08-03T09:35:00Z`.

The window is a maximum, not a claim of uninterrupted computation. Every
actual command, wait, service pause and completed PR is recorded in
`KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md`. Work may continue across goal
continuations while the platform supports it. No elapsed time is fabricated.

## Controller

- Controller: `codex-gm-01`
- Authority: audit, specification, implementation, review, merge and deploy
  within the user-authorized boundaries
- Repository concurrency: one Codex migration branch at a time
- Cursor concurrency: `ONE_TASK_AT_A_TIME`
- Cursor reviewer: `codex-gm-01`
- Mainline rule: synchronize after each merged PR

## Queue Policy

1. Select the first dependency-ready `QUEUED` package.
2. Create a bounded branch and Recovery point.
3. Open Draft, independently review and classify P0/P1/P2.
4. Repair P1/P2; stop on P0 or a mandatory boundary.
5. Mark Ready, merge, synchronize main and deploy when public files changed.
6. Verify production rather than inferring success from local tests.
7. Delete the completed branch and start the next dependency-ready package.

## Cursor Policy

Cursor receives exactly one registered task. When its current task completes,
Codex reviews every artifact, closes or merges it under candidate authority,
and releases the claim. Release may prepare the next approved item, but must
stop before dispatch. Worker execution may start only after a separate reviewed
claim transition succeeds and the active claim is recorded consistently across
the Worker Registry and canonical queue. Until the transactional claim authority
is implemented, dispatch remains `MANUAL_DISPATCH_NON_ATOMIC`; preparation is
not a claim. Cursor cannot rename authoritative software, change Canonical
schemas, merge, deploy, or approve itself.

Current Cursor state:

- current task: `null`
- current branch: `null`
- status: `IDLE / ZERO_ACTIVE_CLAIMS`
- prepared task: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- prepared status: `READY_FOR_ATOMIC_CLAIM`
- output `RESEARCH_PROPOSAL_ONLY / PENDING_CODEX_REVIEW`
- reviewer: `codex-gm-01`
- source base: `beb982fda885fa7acc4dc35407df611d1019a544`
- authorized path: `KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`
- expected files: exactly eight, bound by the prepared work-order envelope

Earthworm and fungi candidate packages completed independent Codex review. The
Fungi claim was explicitly closed and then released; no active claim remains.
The microbial decomposer research task is prepared for a future atomic claim,
not dispatched. The weather dataset proposal is next after that task completes
its future review and release cycle. The software-life manifest candidate task
remains queued behind the pre-existing forest/agriculture queue.

## Mandatory Stops

- P0 security issue
- real wallet, private key or mnemonic access
- real KGEN activation or on-chain transfer
- protected CURRENT conflict
- Constitution lineage overwrite
- destructive migration without recovery
- irreconcilable Canonical conflict
- repository access failure
- external autonomous execution
- Production authority activation

## Completion Modes

- `COMPLETE`: all approved packages merged, deployed where applicable,
  production verified and branches clean.
- `BACKLOG_EXHAUSTED`: no approved dependency-ready work remains.
- `WINDOW_LIMIT`: the maximum execution window elapsed; remaining queue is
  preserved without a false completion claim.
- `MANDATORY_GATE`: a stop condition occurred and evidence is preserved.
