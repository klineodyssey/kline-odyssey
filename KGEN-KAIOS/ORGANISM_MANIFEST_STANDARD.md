# KGEN Organism Manifest Standard

## Metadata

| Field | Value |
|---|---|
| VERSION | 1.0 |
| REVISION | 2026-07-11.1 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-07-11 |
| UPDATED_BY | Codex |
| REVIEWED_BY | Codex |
| SOURCE_COMMIT | e0acc39c6c1b5d5dead5b619ad48c85a85743262 |
| TASK_ID | KGEN-GOV-BIO-2026-0001 |
| CHANGE_REASON | Define required organism manifest fields. |
| ANCESTOR | KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md |
| SOURCE_OF_TRUTH | TRUE |

## Required Manifest Fields

Every KGEN organism manifest must contain:

- `organism_id`
- `life_type`
- `domain`
- `kingdom`
- `phylum`
- `class`
- `order`
- `family`
- `genus`
- `species`
- `canonical_file`
- `runtime_entry`
- `dna_schema`
- `parent_species`
- `ancestor_versions`
- `compatible_mates`
- `mutation_rules`
- `fusion_rules`
- `split_rules`
- `upgrade_path`
- `status`
- `version`
- `author_agent`
- `reviewer_agent`
- `source_commit`

## Canonical File Rule

The `canonical_file` must be an existing formal path or an approved future path created by the same WorkOrder. A manifest without a canonical file remains an idea and cannot be treated as an active organism.

## Runtime Entry Rule

The `runtime_entry` must identify the file that boots, renders, validates, or governs the organism. For documentation-only organisms, the runtime entry may be a standard, schema, or read-only dashboard.
