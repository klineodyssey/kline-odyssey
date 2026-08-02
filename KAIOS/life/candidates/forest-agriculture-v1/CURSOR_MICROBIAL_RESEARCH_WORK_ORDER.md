# Cursor Work Order: Microbial Decomposer Research

Task ID: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Status: `READY_FOR_ATOMIC_CLAIM / CURSOR_RESEARCH_PROPOSAL_ONLY`

Claim state: `UNCLAIMED / NO_ACTIVE_WORKER_CLAIM`

Task envelope: `TASK-ENVELOPE-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-V1`

Source base commit: `beb982fda885fa7acc4dc35407df611d1019a544`

## Objective

Produce bounded research proposals for abstract microbial-decomposer resource
cycling that may inform a future separately reviewed life package or Ecology
Runtime extension. Reuse current Canonical Life, Ecology V1, soil, nutrient,
decomposition-pool and Fungi candidate terminology by reference. Do not create
a microbial Life identity, executable Runtime or Ecology admission claim.

## Prepared Task Envelope

This work order is prepared for a future atomic claim. Preparation does not
assign the task to `cursor-01`; the worker has no current task or branch until
the claim succeeds.

- Reviewer: `codex-gm-01`
- Source base: `beb982fda885fa7acc4dc35407df611d1019a544`
- Authorized path: `KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`
- Claim gate: `ATOMIC_CLAIM_BEFORE_WORK`

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

### Authorized Actions

- Read repository context from the source base.
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

Cursor stops after committing exactly the eight allowed files. Codex owns all
PR, review, release and next-dispatch decisions. This task remains
`READY_FOR_ATOMIC_CLAIM` until an explicit atomic claim is recorded.
