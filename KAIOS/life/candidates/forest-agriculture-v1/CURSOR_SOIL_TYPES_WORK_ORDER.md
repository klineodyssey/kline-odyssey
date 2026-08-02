# Cursor Work Order: Soil Type Candidate Data

Task ID: `KAIOS-CURSOR-SOIL-TYPES-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-SOIL-TYPES-001`

Status: `DISPATCHED / CANDIDATE_ONLY`

Base commit: `614b4e02edb8f705848ad7cb49132ae37e8f5b7e`

## Objective

Produce bounded soil-type research and candidate datasets that reference the
existing Canonical Life `SOIL_EXTENSION`, Soil Life Runtime, Ecology,
Agriculture, Causal Construction and Rights owners. The output is a
compatibility dataset, not a new soil Runtime, legal land classification,
agronomic recommendation or foundation certification.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/soil-types/`

Required outputs:

- `CURSOR_SOIL_TYPES_REPORT.md`
- `soil-type-catalog-candidates.json`
- `soil-physical-property-proposals.json`
- `soil-water-nutrient-thresholds.json`
- `soil-compatibility-matrix.json`
- `soil-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of exact Git blob bytes at the declared source base commit.
- Preserve owner-native units and identify every proposed conversion.
- Keep texture/composition, moisture, fertility, organic matter, compaction,
  erosion and contamination as distinct properties.
- Separate crop-support compatibility from foundation-support compatibility.
- Do not infer land ownership, legal use, environmental approval or safety
  certification from a soil type.
- Require causal water, nutrient, erosion, compaction and restoration flows;
  fertility and soil mass cannot appear without a recorded source.
- Provide deterministic scenarios for infiltration, drought, erosion,
  contamination, nutrient removal/return and construction loading.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
