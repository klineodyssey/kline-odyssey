# Cursor Work Order: Pollinator Research

Task ID: `KAIOS-CURSOR-POLLINATOR-RESEARCH-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-POLLINATOR-RESEARCH-001`

Status: `DISPATCHED / RESEARCH_PROPOSAL_ONLY`

Source base commit: `c91d736c9812781d309bfda422b8ed42cd12eb49`

## Objective

Produce bounded research proposals for future pollination behavior in forest
and agriculture simulations. The work may analyze relationships among existing
candidate plants, candidate insects, habitat, season, time and resource pools,
but it must not create or activate a pollination Runtime, crop yield authority,
pest-control behavior or a new Canonical life package.

## Allowed Output Path

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/pollinator-research/`

Required outputs:

- `CURSOR_POLLINATOR_RESEARCH_REPORT.md`
- `pollinator-relationship-proposals.json`
- `pollinator-habitat-season-proposals.json`
- `pollination-resource-time-scenarios.json`
- `pollinator-risk-boundary-proposals.json`
- `pollinator-test-scenarios.json`

Every numeric parameter must include `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record exact source commit, Git object and SHA-256 provenance.
- Reuse merged Canonical Life, Life Runtime, Ecology Runtime and candidate
  packages as read-only sources.
- Keep every proposed relationship explicitly noncanonical and non-executable.
- Require causal habitat, location, season, temperature, time, energy-proxy,
  worker-independent resource and population-cap gates.
- Separate visitation, pollen-transfer proxy and any future yield effect.
- Preserve mass, water, energy proxy and event-accounting boundaries.
- Include positive, blocked, boundary and deterministic replay scenarios.
- Label every empirical-looking value as a proposal requiring validation.

## Required Boundaries

No authoritative Runtime, Canonical promotion, Organism Schema change,
Universe Physics change, CURRENT, Wallet, KGEN, Rights authority, Economy
authority, deployment or merge changes. No real bioengineering, agronomic
advice, pesticide recommendation, disease claim, guaranteed yield, external
autonomy or uncontrolled reproduction.

Cursor stops after committing the six allowed files. Codex performs the
independent review and all PR, merge, release and next-dispatch decisions.
