# KAIOS Earthworm Candidate Package

Task: `KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`

This directory contains one bounded, noncanonical earthworm-analog Life package
for future soil and decomposition simulation research. It references the merged
Canonical Life shared core and the approved `ANIMAL_EXTENSION`; it does not copy,
replace, or modify either owner.

## Candidate Identity

- Life ID: `LIFE-KAIOS-EARTHWORM-CANDIDATE-001`
- Species ID: `SPECIES-KAIOS-EARTHWORM-CANDIDATE`
- Genome ID: `GENOME-KAIOS-EARTHWORM-CANDIDATE-001`
- Package ID: `CANDIDATE-EARTHWORM-SOIL-DETRITIVORE-V1`
- Life type: `ANIMAL_LIFE`
- Approved extension: `ANIMAL_EXTENSION`

These are project-level candidate identifiers. They create no canonical species,
Ecology population, legal person, organism registration, ownership, breeding
authority, market asset, wallet, KGEN balance, or Production Runtime entity.

## Composition And Owners

`life.manifest.json` consumes `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` as the
read-only shared core. `taxonomy.json` references
`KAIOS_CANONICAL_LIFE_TAXONOMY_V1.json`; `ANIMAL_EXTENSION` membership is
controlled only by `KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json`.

Ecology remains the foreign owner of habitats, populations, detritus,
dead-biomass, decomposition, water, soil, and nutrient state. The current
Ecology schema does not admit this Species ID. Habitat IDs in this package are
compatibility proposals only, and every owner mutation remains blocked.

Rights, custody, operation, use, breeding, transfer, and control remain separate
and ungranted. Economy records contain no price, listing, inventory lot, revenue,
yield, service value, or settlement claim.

## Model Boundary

All numeric parameters are bounded simulation proxies with explicit units,
sources, confidence, risk, and `validation_required: true`. They are not measured
earthworm traits or recommended conditions. Temperature, moisture, oxygen,
compatibility, movement, health, mass, volume, energy, food, and lifecycle values
must not be converted into real biological or soil-management guidance.

The deterministic fixture uses signed integer micro-units. It closes structural
mass, water, energy, food, waste, dead-biomass, pending decomposition custody,
population, generation, and elapsed-time ledgers. Its normal path is a
hypothetical validation oracle, not an Ecology admission. Blocked fixtures make
missing admission, habitat, food, water, environmental fit, time, reproduction
authorization, population capacity, generation capacity, custody, or ledger
closure fail without state change.

`DETRITUS_POOL`, `DEAD_BIOMASS`, and `MICROBIAL_DECOMPOSITION_PROXY` retain their
repository meanings as abstract Ecology-owned resource pools. This package does
not create microbes, empirical chemistry, a carbon model, a nutrient conversion,
or an automatic soil-fertility effect. Decomposition contribution means only a
named pending mass-custody transfer.

## Files

- `life.manifest.json`: Canonical shared-core candidate manifest.
- `taxonomy.json`: proposed identity and taxonomy crosswalk.
- `physics.json`: physical proxy and conservation boundaries.
- `environment.json`: soil-habitat compatibility proposal and gates.
- `growth_or_formation.json`: non-instant lifecycle stage proposal.
- `health_or_integrity.json`: bounded health and stress proxy.
- `reproduction_or_change.json`: controlled reproduction, mortality, and caps.
- `economy.json`: null economic projection and owner boundary.
- `rights.json`: ungranted and separated rights projection.
- `runtime.json`: non-executable deterministic positive and blocked fixtures.
- `viewer.json`: read-only candidate projection contract.
- `api.json`: read-only static data contract with no mutation endpoint.
- `provenance.json`: immutable source and dispatch Git-blob evidence.
- `integrity.json`: package digest and objective validation manifest.
- `event_log.json`: hash-linked candidate and fixture history.

## Prohibited Interpretation

Nothing here is real biology guidance, husbandry advice, soil-management advice,
compost guidance, a production formula, a release recommendation, an ecological
approval, a safety guarantee, a product endorsement, a yield promise, a legal
certification, or an environmental claim.

Codex review is mandatory. Cursor cannot promote, admit, activate, merge, deploy,
register, or self-approve this package.
