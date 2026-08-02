# KAIOS Fungi Candidate Package

Task: `KAIOS-CURSOR-FUNGI-CANDIDATE-001`

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW / NO_PRODUCTION_AUTHORITY`

This directory contains one bounded synthetic fungi-analog Life package for
future decomposition, soil-nutrient, and forest simulation research. It
references the merged Canonical Life shared core and the approved
`MICROBIAL_EXTENSION`; it does not copy, replace, or modify either owner.

## Candidate Identity

- Life ID: `LIFE-KAIOS-MYCOFORM-CANDIDATE-001`
- Species ID: `SPECIES-KAIOS-MYCOFORM-DECOMPOSER-CANDIDATE`
- Genome ID: `GENOME-KAIOS-MYCOFORM-CANDIDATE-001`
- Package ID: `CANDIDATE-FUNGI-MYCOFORM-DECOMPOSER-V1`
- Life type: `MICROBIAL_LIFE`
- Approved extension: `MICROBIAL_EXTENSION`

These project-level candidate identifiers are distinct from the legacy viewer
record `MUSHROOM_ALPHA`. They create no Canonical Species, Ecology population,
legal person, organism registration, ownership, replication authority, market
asset, wallet, KGEN balance, or Production Runtime entity.

## Composition And Owners

`life.manifest.json` consumes `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` as the
read-only shared core. `taxonomy.json` references
`KAIOS_CANONICAL_LIFE_TAXONOMY_V1.json`; `MICROBIAL_EXTENSION` membership and
its exact six fields remain controlled only by
`KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json`.

Ecology remains the foreign owner of habitats, populations, detritus,
dead-biomass, decomposition, water, soil, and nutrient state. The current
Ecology schema does not admit this Species ID. `MICROBIAL_DECOMPOSITION_PROXY`
remains an Ecology-owned `ABSTRACT_RESOURCE_POOL / NOT_FULL_LIFE_RUNTIME`; this
candidate does not replace it or convert it into a Life instance.

Rights, custody, operation, use, replication, transfer, and control remain
separate and ungranted. Economy records contain no price, listing, inventory
lot, revenue, yield, service value, or settlement claim.

## Model Boundary

All numeric parameters are bounded simulation proxies with explicit units,
sources, confidence, risk, and `validation_required: true`. Biological
assumptions are labeled `SIMULATION_APPROXIMATION` or `MODEL_INFERENCE`. No
parameter is a measured fungal trait or a recommended condition, and no value
may be converted into cultivation, food-safety, agricultural, environmental,
medical, or bioengineering guidance.

The deterministic fixture uses signed integer micro-units. It closes structural
mass, moisture/water, nutrient, energy, substrate, processed-residual,
inactive-biomass, pending-decomposition custody, population, generation, and
elapsed-time ledgers. Its positive path is a hypothetical validation oracle,
not Ecology admission or operational authorization. Blocked fixtures reject
missing admission, habitat, substrate, moisture, nutrients, energy,
environmental fit, time, replication authority, population capacity,
generation capacity, bounded dispersal, custody, or ledger/hash closure without
state change.

Candidate microbial activity is only
`BOUNDED_FUNGAL_ACTIVITY_PROXY / SIMULATION_APPROXIMATION`. Carbon behavior and
empirical chemistry are `NOT_MODELED`. Nutrient values are conserved abstract
accounting units, not chemical species or fertility claims. Processed material
and inactive biomass end in retained candidate custody or named pending Ecology
custody; owner acceptance and soil nutrient deltas remain zero.

## Files

- `life.manifest.json`: Canonical shared-core candidate manifest.
- `taxonomy.json`: proposed identity and taxonomy crosswalk.
- `physics.json`: physical proxy and conservation boundaries.
- `environment.json`: habitat and environment compatibility proposal.
- `growth_or_formation.json`: non-instant colony-stage proposal.
- `health_or_integrity.json`: bounded integrity and stress proxy.
- `reproduction_or_change.json`: controlled replication, dispersal, and caps.
- `economy.json`: null economic projection and owner boundary.
- `rights.json`: ungranted and separated rights projection.
- `runtime.json`: non-executable positive and blocked fixtures.
- `viewer.json`: read-only candidate projection contract.
- `api.json`: read-only static data contract with no mutation endpoint.
- `provenance.json`: immutable source and dispatch Git-blob evidence.
- `integrity.json`: package digest and objective validation manifest.
- `event_log.json`: hash-linked candidate and fixture history.

## Prohibited Interpretation

Nothing here is real biology or cultivation guidance, an inoculation or release
instruction, a production formula, a food or medical claim, a decomposition or
fertility performance claim, a safety guarantee, a product endorsement, a
yield promise, an environmental approval, or a legal certification.

Codex review is mandatory. Cursor cannot promote, admit, activate, merge,
deploy, register, or self-approve this package.
