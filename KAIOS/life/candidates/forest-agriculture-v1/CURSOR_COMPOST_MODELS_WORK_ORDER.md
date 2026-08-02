# Cursor Work Order: Compost Model Research

Task ID: `KAIOS-CURSOR-COMPOST-MODELS-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-COMPOST-MODELS-001`

Status: `DISPATCHED / RESEARCH_PROPOSAL_ONLY`

Source base commit: `976f91ac59ecf43a5e28b0afa5df0a9f948d9c76`

## Objective

Produce bounded compost-model research and deterministic candidate fixtures
that reference existing biomass, decomposition, soil, Ecology, Agriculture,
Supply Chain, Labor, Rights and Economy owners. The output is not a compost
Runtime, microbial life package, agronomic prescription, product endorsement,
environmental approval or production process.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/compost-models/`

Required outputs:

- `CURSOR_COMPOST_MODELS_REPORT.md`
- `compost-feedstock-catalog-proposals.json`
- `compost-process-stage-proposals.json`
- `compost-resource-accounting-proposals.json`
- `compost-risk-scenarios.json`
- `compost-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of exact Git blob bytes at the declared source base commit.
- Preserve feedstock mass, water, nutrient, energy and labor accounting.
- Keep carbon and microbial activity as explicitly labeled simulation proxies.
- Separate incoming custody, processing, emissions proxy, leachate, rejects,
  finished-output custody and recorded disposal.
- Require time, location, labor, equipment, energy, storage and owner events.
- Provide deterministic scenarios for accepted feedstock, contamination hold,
  moisture stress, energy shortage, incomplete processing and closed output.
- Do not create living microbes, fertilizer inventory, soil truth or prices.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
