# Cursor Work Order: Fungi Candidate Package

Task ID: `KAIOS-CURSOR-FUNGI-CANDIDATE-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-FUNGI-CANDIDATE-001`

Status: `CLOSED -> RELEASED / CURSOR_RESEARCH_CANDIDATE_ONLY`

Claim events: `CLAIM_CLOSED` (sequence 1) -> `CLAIM_RELEASED` (sequence 2)

Claim event IDs:

- `CLAIM-EVENT-KAIOS-CURSOR-FUNGI-CANDIDATE-001-001`
- `CLAIM-EVENT-KAIOS-CURSOR-FUNGI-CANDIDATE-001-002`

Active claims after release: `0`

Source base commit: `eb17536ff6affb34f93bce6c5622d7bab018d230`

## Objective

Create one bounded synthetic fungi-analog candidate life package for future
decomposition, soil-nutrient and forest research. Reuse the merged Canonical
Life shared core and its existing `MICROBIAL_LIFE` plus
`MICROBIAL_EXTENSION` binding without changing either owner. The package must
not be admitted to Ecology Runtime, promoted to Canonical, or presented as
real biological, cultivation, food-safety or agricultural guidance.

## Allowed Output Path

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/fungi/`

Required outputs:

- `README.md`
- `life.manifest.json`
- `taxonomy.json`
- `physics.json`
- `environment.json`
- `growth_or_formation.json`
- `health_or_integrity.json`
- `reproduction_or_change.json`
- `economy.json`
- `rights.json`
- `runtime.json`
- `viewer.json`
- `api.json`
- `provenance.json`
- `integrity.json`
- `event_log.json`

## Evidence Requirements

- Record source commit, Git object and SHA-256 provenance.
- Use unique candidate Life, Species and Genome IDs.
- Bind the repository's existing taxonomy, Canonical Life schema and
  `MICROBIAL_EXTENSION` by reference; do not create another taxonomy, schema
  or extension.
- Include all 47 Universal Core fields and exactly these six approved
  microbial extension fields: `cell_structure`, `metabolism`,
  `substrate_need`, `replication`, `colony_model`,
  `environment_tolerance`.
- Model mass, moisture, temperature, oxygen, substrate input, energy proxy,
  bounded colony growth, health, bounded dispersal proxy, mortality,
  decomposition contribution and event history as explicit proposals.
- Keep numeric values unit-bearing, bounded, source-typed,
  confidence-labeled and marked `validation_required`.
- Include deterministic positive and blocked fixtures with time, resource,
  mass, moisture and nutrient-accounting checks.
- Mark all biological assumptions `SIMULATION_APPROXIMATION` or
  `MODEL_INFERENCE`; do not claim universal fungi biology.

## Required Boundaries

`CANDIDATE_ONLY`, `PENDING_CODEX_REVIEW`, `NO_PRODUCTION_AUTHORITY`, no
Canonical promotion, no Ecology admission, no real bioengineering, no
cultivation guidance, no uncontrolled replication, no Runtime, CURRENT,
Wallet, KGEN, Rights authority, Economy authority, deployment or merge
changes.

Cursor stops after committing exactly the sixteen allowed files. Codex owns
all PR, review, release and next-dispatch decisions.
