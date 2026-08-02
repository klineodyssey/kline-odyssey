# Cursor Work Order: Fruit Tree Candidate Packages

Task ID: `KAIOS-CURSOR-FRUIT-TREE-PACKAGES-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-FRUIT-TREE-PACKAGES-001`

Status: `DISPATCHED / CANDIDATE_ONLY`

Base commit: `9329560df73a6668f74a5eb05910d951fa079a38`

## Objective

Produce bounded fruit-tree research and candidate datasets that reuse the
existing `TREE_ALPHA`, `FRUIT_ALPHA`, Canonical Life, Life Runtime V1, Ecology,
Agriculture, Economy and Physical Labor owners. The work must distinguish an
aggregate fruit resource class from a validated fruit-tree species and must not
create a second tree, crop, agriculture, inventory or economy Runtime.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/fruit-trees/`

Required outputs:

- `CURSOR_FRUIT_TREE_PACKAGES_REPORT.md`
- `fruit-tree-catalog-candidates.json`
- `fruit-tree-environment-thresholds.json`
- `fruit-tree-growth-stage-proposals.json`
- `fruit-tree-resource-flow-proposal.json`
- `fruit-tree-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of Git blob bytes at the declared source base commit.
- Preserve owner-native taxonomy, including `subspecies` and `category`, and
  use a separate Canonical Life crosswalk. Never map `subspecies` to an
  individual `life_instance`.
- Use the native units of every owner Runtime or provide an explicit,
  reversible conversion contract.
- Provide at least one complete fixed-point numerical oracle with initial
  pools, ordered deltas, final pools and a reproducible SHA-256.
- Keep structural biomass, nutrients, water and energy in distinct pools.
- Require propagation source, compatible soil, water, nutrients, sunlight,
  temperature, labor and elapsed time. No instant tree, fruit or harvest.
- Mark species-specific values `SOURCE_UNDERSPECIFIED` when repository evidence
  supports only the aggregate `FRUIT_ALPHA` class.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
