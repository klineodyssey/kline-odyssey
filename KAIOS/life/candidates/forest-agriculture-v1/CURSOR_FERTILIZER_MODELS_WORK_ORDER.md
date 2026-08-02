# Cursor Work Order: Fertilizer Model Research

Task ID: `KAIOS-CURSOR-FERTILIZER-MODELS-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-FERTILIZER-MODELS-001`

Status: `DISPATCHED / RESEARCH_PROPOSAL_ONLY`

Base commit: `1650191f35567d43016473420cfd2cba22b00aea`

## Objective

Produce bounded fertilizer-model research and deterministic candidate fixtures
that reference the existing Soil, Plant, Ecology, Agriculture, Supply Chain,
Labor, Rights and Economy owners. The output is a proposal set, not an
agronomic recommendation, product endorsement, environmental approval,
production formula or fertilizer Runtime.

## Allowed Output Paths

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/fertilizer-models/`

Required outputs:

- `CURSOR_FERTILIZER_MODELS_REPORT.md`
- `fertilizer-catalog-proposals.json`
- `nutrient-composition-proposals.json`
- `application-response-model-proposals.json`
- `environmental-risk-scenarios.json`
- `fertilizer-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of exact Git blob bytes at the declared source base commit.
- Preserve nutrient mass, carrier mass, water and energy accounting.
- Separate soil amendment, nutrient input, application method, storage,
  transport, runoff, leaching, volatilization and contamination risks.
- Model bounded response ranges; no yield or safety guarantee is permitted.
- Require explicit inventory, labor, equipment, timing and application events.
- Provide deterministic scenarios for deficiency, bounded application,
  over-application, runoff, leaching, storage loss and recovery.
- Label every value as a simulation proposal requiring owner validation.

## Required Boundaries

No Runtime code, Canonical promotion, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or merge changes. Status remains
`CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.
