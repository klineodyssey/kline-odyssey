# Cursor Work Order: Microbial Decomposer Research

Task ID: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`

Status: `CLAIMED / CURSOR_RESEARCH_PROPOSAL_ONLY`

Claim state: `MANUAL_DISPATCH_NON_ATOMIC / ACTIVE_STATIC_CLAIM`

Claim ID: `CLAIM-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-001`

Task envelope: `TASK-ENVELOPE-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-V1`

Source base commit: `7008e4f9449f6df050171cf47ec6ec56419925e9`

## Objective

Produce bounded research proposals for abstract microbial-decomposer resource
cycling that may inform a future separately reviewed life package or Ecology
Runtime extension. Reuse current Canonical Life, Ecology V1, soil, nutrient,
decomposition-pool and Fungi candidate terminology by reference. Do not create
a microbial Life identity, executable Runtime or Ecology admission claim.

## Claimed Task Envelope

This work order carries one reviewed pre-cutover manual claim for `cursor-01`.
It is recorded as `MANUAL_DISPATCH_NON_ATOMIC` because the selected dedicated
transactional claim authority remains unimplemented. This Git-backed record is
auditable but is not represented as an atomic distributed lock.

- Reviewer: `codex-gm-01`
- Source base: `7008e4f9449f6df050171cf47ec6ec56419925e9`
- Execution branch base: the merged claim-record commit, which must descend
  from the source base; worker execution cannot begin from this Draft branch.
- Authorized path: `KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`
- Dispatch mode: `MANUAL_DISPATCH_NON_ATOMIC`
- Claim issued: `2026-08-02T13:53:00Z`
- Lease expiry: `2026-08-03T01:53:00Z`
- Fencing token: `1`
- Record version: `1`
- Prior Worker Registry Git object / SHA-256:
  `93342ab913d0adab57c29a85017b9907b05b026e` /
  `af348f1ad3967ffc7aca13387a3d0a45827bc84fe2aa99804570435a67df34b2`
- Prior canonical queue Git object / SHA-256:
  `c0596410cc1b32190f4b8369c98b23b9539351b4` /
  `b2e044cf29ef031f2f47a04442001f4a0376cb14819e9834ede3dd200d75544b`

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
PR, review, release and next-dispatch decisions. The claim is valid only for
this bounded envelope and lease. No automatic, transactional or Production
dispatch authority is implied.
