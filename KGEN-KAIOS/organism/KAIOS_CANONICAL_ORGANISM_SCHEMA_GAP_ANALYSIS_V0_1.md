# KAIOS Canonical Organism Schema Gap Analysis V0.1

Baseline schema: `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` version `1.0`

## Organism Fields

| Field | Before V0.1 |
|---|---|
| `organism_id` | EXISTS |
| `organism_name`, `organism_version`, `organism_class`, `life_category` | MISSING |
| eight-rank taxonomy | EXISTS as flat fields |
| twelve-level `taxonomy` | PARTIAL |
| `species_ref`, `rna_ref`, `organs_ref`, `cells_ref` | MISSING |
| `dna_ref` | DERIVED from `dna_schema` |
| `runtime_ref` | DERIVED from `runtime_entry` |
| energy, embodiment, lifecycle profiles | MISSING |
| reproduction and mutation references | PARTIAL as inline arrays |
| trade, ownership, authority profiles | MISSING |
| `status` | EXISTS without candidate-only enum |
| `release`, `created_at`, `integrity_hash` | MISSING |

## Species Fields

| Field group | Before V0.1 |
|---|---|
| identity and version | PARTIAL in organism manifest and viewer examples |
| Domain through Species | EXISTS |
| Species manifest and schema version | PARTIAL |
| `program_filename`, `runtime_entrypoint` | PARTIAL under `canonical_file` and `runtime_entry` |
| compatibility and reproduction | PARTIAL |
| mutation/evolution | PARTIAL |
| energy, embodiment, trade | PARTIAL across architecture documents |
| organ, cell, lifecycle, release policy | MISSING as one resolvable Species contract |
| integrity hash | MISSING |

## Runtime Binding Fields

`runtime_entry` EXISTS. Program filename, Runtime type/version, execution
environment, required organs/cells, startup/shutdown, health check, state,
memory, and archive paths were MISSING as a structured binding.

## Life Behavior Fields

Energy, food/fuel, growth, repair, reproduction, mutation, evolution, shutdown,
trade, ownership, occupancy, and authority definitions EXIST across multiple
documents but were MISSING from the canonical machine schema.

## Resolution

Schema version `2.0` adds the missing structured fields. Version `1.0` remains
accepted as a legacy record. New fields are required only when
`schema_version` is `2.0`.
