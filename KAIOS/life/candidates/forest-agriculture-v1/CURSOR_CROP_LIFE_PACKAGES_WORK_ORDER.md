# Cursor Work Order: Crop Life Packages

Task ID: `KAIOS-CURSOR-CROP-LIFE-PACKAGES-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-CROP-LIFE-PACKAGES-001`

Status: `DISPATCHED / CANDIDATE_ONLY`

Base commit: `176e8b96e40894a542da5823c436e9d49f663f0e`

## Objective

Produce bounded crop research and candidate datasets for the existing
Agriculture Alpha classes `RICE`, `VEGETABLE` and `FRUIT`. The work must reuse
Canonical Life, Agriculture, Ecology, Economy and Physical Labor ownership. It
must not create a second crop, agriculture, inventory or economy Runtime.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/crops/`

Required outputs:

- `CURSOR_CROP_LIFE_PACKAGES_REPORT.md`
- `crop-catalog-candidates.json`
- `crop-environment-thresholds.json`
- `crop-growth-stage-proposals.json`
- `crop-resource-flow-proposal.json`
- `crop-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of Git blob bytes at the declared source base commit; do not
  hash platform-transformed checkout bytes.
- Use explicit units and conversion contracts.
- Provide at least one complete numerical oracle with initial pools, ordered
  deltas, final pools and an independently reproducible SHA-256.
- Use deterministic fixed-point integer transition arithmetic; direct binary
  floating-point state addition is forbidden.
- Keep structural biomass, nutrients, water and energy in distinct pools.
- Require seed/propagation source, compatible soil, water, nutrients, sunlight,
  temperature, labor and elapsed time. No instant growth or harvest.
- Treat fertilizer, harvest and warehouse quantities as references to their
  existing authoritative owners.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
