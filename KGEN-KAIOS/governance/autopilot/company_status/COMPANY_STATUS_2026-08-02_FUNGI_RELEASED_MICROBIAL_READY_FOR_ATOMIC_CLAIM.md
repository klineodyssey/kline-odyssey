# Company Status: Fungi Candidate Released, Microbial Research Ready for Atomic Claim

Date: `2026-08-02`

Company Boot: `BOOT_PASS`

Queue mode: `ACTIVE / ONE_TASK_AT_A_TIME`

## Fungi Release Ledger

- Task: `KAIOS-CURSOR-FUNGI-CANDIDATE-001`
- Candidate PR: `#113`
- Candidate commit: `a4fe488eecdf6652ea9fad257195f3ba8fe853aa`
- Candidate merge: `beb982fda885fa7acc4dc35407df611d1019a544`
- Independent review: `P0=0 / P1=0 / P2=0 / APPROVED_CANDIDATE`
- Final authority: `CURSOR_RESEARCH_CANDIDATE_ONLY`
- Event 1: `CLAIM_CLOSED`
- Event 2: `CLAIM_RELEASED`
- Event order: explicit and append-only; release occurred only after close.
- Active claims after release: `0`

## Prepared Microbial Task

- Worker: `cursor-01`
- Task: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- Status: `READY_FOR_ATOMIC_CLAIM`
- Claim state: `UNCLAIMED / NO_ACTIVE_WORKER_CLAIM`
- Current worker task: `null`
- Current worker branch: `null`
- Reviewer: `codex-gm-01`
- Source base: `beb982fda885fa7acc4dc35407df611d1019a544`
- Envelope: `TASK-ENVELOPE-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-V1`
- Output authority: `CURSOR_RESEARCH_PROPOSAL_ONLY`
- Authorized path:
  `KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`

Exactly these eight files are authorized:

1. `CURSOR_MICROBIAL_DECOMPOSER_RESEARCH_REPORT.md`
2. `microbial-decomposer-process-proposals.json`
3. `microbial-environment-threshold-proposals.json`
4. `microbial-resource-accounting-scenarios.json`
5. `microbial-competition-and-succession-proposals.json`
6. `microbial-safety-boundaries.json`
7. `microbial-test-scenarios.json`
8. `CURSOR_MICROBIAL_RESEARCH_IMPROVEMENT_PROPOSAL.md`

Authorized actions are limited to reading repository context, writing only
those eight files under the authorized path, running bounded local tests,
recording Git/SHA-256 provenance, committing exactly those eight files, and
stopping at pending Codex review. A separate reviewed claim transition is
required before work. The transactional claim authority remains unimplemented,
so any later dispatch must be recorded as `MANUAL_DISPATCH_NON_ATOMIC`.

Forbidden paths include `KGEN-KAIOS/**`, `KGEN/**`, `KAIOS/**/Runtime/**`,
`KAIOS/**/Wallet/**`, `**/*CURRENT*`, `api/**`, `docs/**`, `README.md`, and
`PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`.

## Boundaries

No Runtime, CURRENT, Canonical Schema, Organism Schema, Universe Law, Rights
authority, Economy authority, Wallet, KGEN, Production authority, deployment,
real microbiology, cultivation guidance or external autonomous action is
enabled. The prepared task is not dispatched and does not hold a worker claim.
