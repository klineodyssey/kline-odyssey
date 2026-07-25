# KGEN Organism Manifest Standard

## Metadata

| Field | Value |
|---|---|
| VERSION | 2.0 |
| REVISION | 2026-07-25.1 |
| STATUS | ACTIVE_CANDIDATE_EXTENSION |
| LAST_UPDATED | 2026-07-25 |
| UPDATED_BY | Codex |
| REVIEWED_BY | HUMAN_REVIEW_REQUIRED |
| SOURCE_COMMIT | PENDING_PR |
| TASK_ID | KAIOS-CANONICAL-ORGANISM-V0-1 |
| CHANGE_REASON | Add canonical Species, Runtime, behavior, release, ownership, and authority bindings. |
| ANCESTOR | KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md |
| SOURCE_OF_TRUTH | TRUE |

## Compatibility

Version `1.0` records remain valid legacy manifests. New records use
`schema_version: "2.0"` and must satisfy the expanded contract in
`KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json`.

The extension preserves the original fields and meanings. It does not rewrite
existing organism data or activate an organism.

## Legacy Manifest Fields

Version `1.0` requires:

- `organism_id`, `life_type`
- `domain`, `kingdom`, `phylum`, `class`, `order`, `family`, `genus`, `species`
- `canonical_file`, `runtime_entry`, `dna_schema`
- `parent_species`, `ancestor_versions`, `compatible_mates`
- `mutation_rules`, `fusion_rules`, `split_rules`, `upgrade_path`
- `status`, `version`, `author_agent`, `reviewer_agent`, `source_commit`

## Version 2.0 Extension

Version `2.0` additionally requires:

- organism identity: `organism_name`, `organism_version`, `organism_class`, `life_category`
- twelve-level taxonomy and `species_ref`
- DNA, RNA, organ, cell, Runtime, energy, embodiment, lifecycle,
  reproduction, mutation, trade, ownership, and authority references
- a resolvable `runtime_binding`
- category-appropriate `life_behavior`
- a non-active `release`
- `created_at` and `integrity_hash`

## Canonical File And Runtime Rules

`canonical_file` and every repository reference must:

1. be repository-relative;
2. contain no traversal;
3. resolve to an existing file when validation runs;
4. remain inside the repository;
5. identify a shared canonical specification rather than a divergent temple copy.

`program_filename` identifies the concrete program or non-executable lifecycle
representation. `runtime_entrypoint` identifies the same executable artifact or
an explicitly resolvable handler.

## Taxonomy Rule

The canonical eight biological ranks remain:

`Domain -> Kingdom -> Phylum -> Class -> Order -> Family -> Genus -> Species`.

The KAIOS Life binding appends `Cell -> Organ -> Runtime -> Civilization`.
The existing 19-layer standard remains a compatible detail extension and is
referenced rather than duplicated.

## Natural Instantiation Boundary

Ordinary low-risk candidates use:

`SPECIFICATION -> VALIDATION -> TAXONOMY -> ORGANISM_ID -> RELEASE -> RUNTIME_LIFE`.

This V0.1 implementation stops at a dry-run candidate result. Version `2.0`
release records must state:

- `release_status`: `DRY_RUN` or `CANDIDATE_ONLY`
- `activation_status`: `NOT_ACTIVE`
- production, Runtime, wallet, and exchange settlement authority: `false`

High-risk authority remains a separate governed decision.

## Placeholder Rule

`AUTO_GENERATE`, `NOT_CREATED`, `PENDING`, and equivalent placeholders may be
used only in dry-run specifications. They must fail live-record validation and
must never be persisted as active organism identities.
