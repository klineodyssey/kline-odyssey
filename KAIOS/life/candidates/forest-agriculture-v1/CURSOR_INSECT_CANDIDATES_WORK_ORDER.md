# Cursor Work Order: Insect Candidate Packages

Task ID: `KAIOS-CURSOR-INSECT-CANDIDATES-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-INSECT-CANDIDATES-001`

Status: `DISPATCHED / CANDIDATE_ONLY`

Source base commit: `56d3b8f20a63c4a8a5d19251ed72f7f9fe4e78c9`

## Objective

Produce bounded insect candidate-package research for future forest and
agriculture simulations. The task may propose herbivore, predator and
detritivore ecological roles, but must not activate pollination, pest-control,
disease, pesticide, farm, food-chain or population Runtime behavior.

All packages must consume the merged Canonical Life template as a read-only
contract and remain `CANDIDATE_ONLY / PENDING_CODEX_REVIEW`.

## Allowed Output Path

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/insect-candidates/`

Required outputs:

- `CURSOR_INSECT_CANDIDATES_REPORT.md`
- `insect-candidate-manifests.json`
- `insect-taxonomy-proposals.json`
- `insect-physics-environment-proposals.json`
- `insect-lifecycle-resource-proposals.json`
- `insect-rights-economy-proposals.json`
- `insect-test-scenarios.json`

Every numeric parameter must provide `parameter_name`, `unit`, `minimum`,
`default`, `maximum`, `rationale`, `source_type`, `confidence`, `risk` and
`validation_required`.

Allowed source labels: `SOURCE_DERIVED`, `REPOSITORY_DERIVED`,
`MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION` and
`SOURCE_UNDERSPECIFIED`.

## Evidence Requirements

- Record SHA-256 of exact source Git blob bytes at the source base commit.
- Use `SHARED_CORE + APPROVED_TYPE_EXTENSION` without changing either.
- Keep taxonomy proposals complete and explicitly noncanonical.
- Conserve mass, water, energy proxy, food input, waste and dead biomass.
- Require causal location, time, habitat, temperature, water and food gates.
- Bound lifecycle, reproduction, population and generation fixtures.
- Keep pollination behavior for the separately queued pollinator workline.
- Include negative tests for missing habitat, food, water, provenance, rights,
  mass closure, lifecycle cause and population caps.

## Required Boundaries

No authoritative Runtime, Canonical promotion, Organism Schema change,
Universe Physics change, CURRENT, Wallet, KGEN, Rights authority, Economy
authority, deployment or merge changes. No real bioengineering, agricultural
advice, pesticide recommendation, disease claim or external autonomy.

Cursor stops after committing the seven allowed files. Codex performs the
independent review and all PR, merge, release and next-dispatch decisions.
