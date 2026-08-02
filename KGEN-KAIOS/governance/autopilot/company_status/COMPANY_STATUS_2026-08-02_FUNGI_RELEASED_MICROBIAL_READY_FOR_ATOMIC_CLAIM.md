# Company Status: Fungi Candidate Released, Microbial Research Preparation Only

The historical filename is retained to avoid creating another versioned status
artifact. Its current content supersedes the earlier ready-for-claim wording.

Date: `2026-08-02`

Company Boot: `BOOT_PASS`

Queue mode: `PREPARATION_ONLY / ONE_TASK_AT_A_TIME / ZERO_ACTIVE_CLAIMS`

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
- Status: `PREPARATION_ONLY`
- Claim state: `NOT_CLAIMED / NOT_DISPATCHED`
- Current worker task: `null`
- Current worker branch: `null`
- Reviewer: `codex-gm-01`
- Preparation source: `7008e4f9449f6df050171cf47ec6ec56419925e9`
- Execution base: `null / NOT_BOUND`
- Planned branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- Branch/worktree state: `NOT_CREATED / NOT_CREATED`
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
stopping at pending Codex review, but none of those actions is authorized by
this preparation record.

After this preparation PR is merged, Codex must record its exact merge SHA,
create the planned branch at exactly that SHA, and verify an isolated worktree
at exactly that SHA. A separate activation PR must then bind that exact base and
define fail-closed effective expiry and revalidation semantics. Only after the
activation PR is independently reviewed and merged may `CLAIMED` be recorded.
No descendant wildcard or moving ref may authorize execution.

Forbidden paths include `KGEN-KAIOS/**`, `KGEN/**`, `KAIOS/**/Runtime/**`,
`KAIOS/**/Wallet/**`, `**/*CURRENT*`, `api/**`, `docs/**`, `README.md`, and
`PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`.

## Boundaries

No Runtime, CURRENT, Canonical Schema, Organism Schema, Universe Law, Rights
authority, Economy authority, Wallet, KGEN, Production authority, deployment,
real microbiology, cultivation guidance or external autonomous action is
enabled. The prepared task is not dispatched, does not hold a worker claim and
does not create a Session, lease, branch, worktree or execution base.
