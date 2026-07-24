# KAIOS Canonical Organism Implementation V0.1

Status: `CANDIDATE_ONLY`

Runtime authority: `false`

This directory implements the shared, non-production organism contract defined
by the existing KGEN biology sources. It extends the canonical schema at
`KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json`; it does not create a
second organism schema.

## Components

| Path | Purpose |
|---|---|
| `KAIOS_CANONICAL_ORGANISM_SOURCE_INVENTORY_V0_1.md` | Source classification and conflicts |
| `KAIOS_CANONICAL_ORGANISM_SCHEMA_GAP_ANALYSIS_V0_1.md` | Field-by-field gap analysis |
| `KAIOS_ORGANISM_SCHEMA_MIGRATION_GUIDE_V0_1.md` | Legacy-to-2.0 migration |
| `taxonomy_registry.json` | Twelve-level taxonomy and 19-layer compatibility |
| `species_registry.json` | Species-to-program and Runtime bindings |
| `profiles/` | Shared energy, embodiment, reproduction, mutation, and trade profiles |
| `package-template/` | One complete non-live organism package |
| `natural_instantiation.py` | Dry-run instantiation pipeline |
| `validate_organism.py` | Schema, package, taxonomy, and boundary validator |
| `tests/` | Unit and boundary tests |

## Canonical Path

```text
SPECIFICATION
-> VALIDATION
-> TAXONOMY
-> ORGANISM_ID
-> RELEASE
-> RUNTIME_LIFE
```

V0.1 executes only through a dry-run candidate release. It never starts
Runtime Life.

## Boundaries

- no live organism registry transaction
- no Production Runtime activation
- no wallet or private key
- no K11520 settlement
- no autonomous agent
- no Codex birth
- no new thread authorization
- no CURRENT modification
