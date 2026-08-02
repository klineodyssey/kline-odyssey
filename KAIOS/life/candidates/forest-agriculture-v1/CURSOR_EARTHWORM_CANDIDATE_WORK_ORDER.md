# Cursor Work Order: Earthworm Candidate Package

Task ID: `KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`

Worker: `cursor-01`

Branch: `cursor-handoff/KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`

Status: `DISPATCHED / CURSOR_RESEARCH_CANDIDATE_ONLY`

Source base commit: `745952dc389d62cf85545a86b18e279d8eca9c73`

## Objective

Create one bounded earthworm candidate life package for future soil and
decomposition research. Reuse the merged Canonical Life shared core and the
approved animal extension without changing either owner. The package must not
be admitted to Ecology Runtime, promoted to Canonical, or presented as real
soil-management or biological guidance.

## Allowed Output Path

Only files under:

`KAIOS/life/candidates/forest-agriculture-v1/earthworm/`

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
- Use a unique candidate Life ID, Species ID and Genome ID.
- Bind the repository's existing taxonomy and Canonical Life schema by
  reference; do not create another taxonomy or schema.
- Model mass, moisture, temperature, oxygen, soil compatibility, food or
  detritus input, energy proxy, growth, health, reproduction, mortality,
  decomposition contribution and event history as bounded proposals.
- Keep numeric values unit-bearing, bounded, sourced, confidence-labeled and
  marked `validation_required`.
- Include deterministic positive and blocked fixtures with time, resource and
  mass-accounting checks.

## Required Boundaries

`CANDIDATE_ONLY`, `PENDING_CODEX_REVIEW`, `NO_PRODUCTION_AUTHORITY`, no
Canonical promotion, no Ecology admission, no real bioengineering, no farm
guidance, no uncontrolled reproduction, no Runtime, CURRENT, Wallet, KGEN,
Rights authority, Economy authority, deployment or merge changes.

Cursor stops after committing exactly the sixteen allowed files. Codex owns
all PR, review, release and next-dispatch decisions.
