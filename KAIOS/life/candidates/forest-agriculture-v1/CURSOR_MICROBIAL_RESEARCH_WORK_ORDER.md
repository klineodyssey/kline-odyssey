# Cursor Work Order: Microbial Decomposer Research

Task ID: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Worker: `cursor-01`

Planned branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Status: `PREPARATION_ONLY / CURSOR_RESEARCH_PROPOSAL_ONLY`

Claim state: `NOT_CLAIMED / NOT_DISPATCHED`

Task envelope: `TASK-ENVELOPE-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-V1`

Preparation source commit: `7008e4f9449f6df050171cf47ec6ec56419925e9`

## Objective

Produce bounded research proposals for abstract microbial-decomposer resource
cycling that may inform a future separately reviewed life package or Ecology
Runtime extension. Reuse current Canonical Life, Ecology V1, soil, nutrient,
decomposition-pool and Fungi candidate terminology by reference. Do not create
a microbial Life identity, executable Runtime or Ecology admission claim.

## Prepared Task Envelope

This work order records non-authoritative intent only. It does not assign the
task to `cursor-01`, dispatch work, create a Session, create a branch or
worktree, bind an execution base, or grant execution authority.

- Reviewer: `codex-gm-01`
- Preparation source commit:
  `7008e4f9449f6df050171cf47ec6ec56419925e9`
- Execution base: `null / NOT_BOUND`
- Planned branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- Branch state: `NOT_CREATED`
- Isolated worktree state: `NOT_CREATED`
- Authorized path: `KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`
- Dispatch state: `NOT_DISPATCHED`
- Active claims: `0`
- Prior Worker Registry Git object / SHA-256:
  `93342ab913d0adab57c29a85017b9907b05b026e` /
  `af348f1ad3967ffc7aca13387a3d0a45827bc84fe2aa99804570435a67df34b2`
- Prior canonical queue Git object / SHA-256:
  `c0596410cc1b32190f4b8369c98b23b9539351b4` /
  `b2e044cf29ef031f2f47a04442001f4a0376cb14819e9834ede3dd200d75544b`

## Two-Stage Activation Gate

After this preparation PR is merged, Codex must:

1. Record the exact preparation merge SHA.
2. Create `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001` at exactly that
   SHA.
3. Create and verify an isolated Cursor worktree at exactly that SHA.
4. Open a separate activation PR that binds the exact execution base, branch
   and worktree evidence.
5. Define fail-closed effective expiry and revalidation semantics in that
   activation record.
6. Record `CLAIMED` only after the activation PR is independently reviewed and
   merged.

No ancestor check, descendant wildcard, moving branch tip or symbolic main ref
authorizes execution. The exact preparation merge SHA must be recorded and
equal to the branch/worktree base used by the future Cursor task.

### Expected Files

Exactly these eight files are authorized:

- `CURSOR_MICROBIAL_DECOMPOSER_RESEARCH_REPORT.md`
- `microbial-decomposer-process-proposals.json`
- `microbial-environment-threshold-proposals.json`
- `microbial-resource-accounting-scenarios.json`
- `microbial-competition-and-succession-proposals.json`
- `microbial-safety-boundaries.json`
- `microbial-test-scenarios.json`
- `CURSOR_MICROBIAL_RESEARCH_IMPROVEMENT_PROPOSAL.md`

### Actions After Activation Only

- Read repository context from the exact execution base bound by the later
  activation PR.
- Write only the eight expected files under the authorized path.
- Run bounded local tests.
- Record Git object and SHA-256 provenance.
- Commit exactly the eight expected files.
- Stop at pending Codex review.

### Forbidden Paths

- `KGEN-KAIOS/**`
- `KGEN/**`
- `KAIOS/**/Runtime/**`
- `KAIOS/**/Wallet/**`
- `**/*CURRENT*`
- `api/**`
- `docs/**`
- `README.md`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`

## Allowed Output Path

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`

Required outputs:

- `CURSOR_MICROBIAL_DECOMPOSER_RESEARCH_REPORT.md`
- `microbial-decomposer-process-proposals.json`
- `microbial-environment-threshold-proposals.json`
- `microbial-resource-accounting-scenarios.json`
- `microbial-competition-and-succession-proposals.json`
- `microbial-safety-boundaries.json`
- `microbial-test-scenarios.json`
- `CURSOR_MICROBIAL_RESEARCH_IMPROVEMENT_PROPOSAL.md`

## Evidence Requirements

- Record the task, branch, source commit, Git object and SHA-256 provenance.
- Distinguish `SOURCE_DERIVED`, `REPOSITORY_DERIVED`, `MODEL_INFERENCE`,
  `RESEARCH_PROPOSAL`, `ASSUMPTION` and `SOURCE_UNDERSPECIFIED`.
- Keep every numeric proposal unit-bearing, bounded, confidence-labeled and
  `validation_required: true`.
- Cover substrate intake, moisture, temperature, oxygen proxy, energy proxy,
  biomass custody, waste, decomposition contribution, nutrient-return
  proposal, competition, succession, mortality and time causality.
- Include deterministic positive, blocked and failure scenarios with closed
  mass, moisture, nutrient-proxy, energy-proxy and time ledgers.
- Identify missing active life types and owner APIs without inventing bacteria,
  fungi, pathogens or chemistry as validated biological facts.

## Required Boundaries

`RESEARCH_PROPOSAL_ONLY`, `PENDING_CODEX_REVIEW`,
`NO_PRODUCTION_AUTHORITY`, no Life ID creation, no Canonical promotion, no
Ecology admission, no real microbiology, cultivation, food-safety, medical or
environmental guidance, no uncontrolled replication, and no Runtime, CURRENT,
Wallet, KGEN, Rights authority, Economy authority, deployment or merge changes.

Cursor has no authority to perform these actions from this preparation PR.
After a separately reviewed activation, Cursor stops after committing exactly
the eight allowed files. Codex owns all PR, review, release and next-dispatch
decisions. No claim, lease, Session, automatic dispatch, transactional
authority or Production authority is implied by this preparation record.
