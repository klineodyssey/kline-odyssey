# Cursor Work Order: Vegetable Candidate Packages

Task ID: `KAIOS-CURSOR-VEGETABLE-PACKAGES-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-VEGETABLE-PACKAGES-001`

Status: `DISPATCHED / CANDIDATE_ONLY`

Base commit: `e218dde35683285795714e821389806427948efe`

## Objective

Produce bounded vegetable research and candidate datasets that reuse the
existing Agriculture Alpha `VEGETABLE` resource class, Canonical Life, Ecology,
Economy and Physical Labor owners. Repository evidence does not identify a
validated `VEGETABLE_ALPHA` species package, so the work must keep aggregate
resource/facility records separate from species taxonomy and must not invent a
vegetable species or create a second agriculture, inventory or economy Runtime.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/vegetables/`

Required outputs:

- `CURSOR_VEGETABLE_PACKAGES_REPORT.md`
- `vegetable-catalog-candidates.json`
- `vegetable-environment-thresholds.json`
- `vegetable-growth-stage-proposals.json`
- `vegetable-resource-flow-proposal.json`
- `vegetable-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of exact Git blob bytes at the declared source base commit.
- Preserve owner-native IDs and units. Do not convert synthetic water, energy,
  yield or facility units without an explicit reversible conversion contract.
- Mark species taxonomy, cultivar, real growing conditions and food-safety
  details `SOURCE_UNDERSPECIFIED` unless an approved repository owner exists.
- Provide one complete fixed-point numerical oracle with initial pools,
  ordered deltas, final pools and a reproducible SHA-256.
- Keep structural biomass, nutrients, water, energy, labor and harvested
  inventory in distinct named pools.
- Require propagation input, compatible soil, water, nutrients, sunlight,
  temperature, labor and elapsed time. No instant crop, harvest or inventory.
- Make harvest and residue custody explicit; dead or rejected biomass cannot
  disappear without a recorded decomposition, compost or removal path.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
