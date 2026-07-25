# KAIOS Organism Schema Migration Guide V0.1

## Scope

This guide migrates legacy organism manifest `1.0` records to canonical schema
`2.0`. Migration is opt-in and dry-run only.

## Preserved Fields

All version `1.0` fields keep their original meaning. No identity, lineage,
canonical path, or historical value may be discarded.

## New Required Fields

Version `2.0` adds:

- explicit schema, organism, and Life category versions;
- twelve-level taxonomy and Species reference;
- DNA, RNA, organ, cell, Runtime, energy, embodiment, lifecycle,
  reproduction, mutation, trade, ownership, and authority references;
- structured Runtime and Life behavior contracts;
- non-active release evidence;
- creation timestamp and integrity hash.

## Defaults

Defaults may be proposed only in migration output:

| Legacy source | Candidate 2.0 field |
|---|---|
| `version` | `organism_version` |
| `life_type` | `organism_class` |
| flat taxonomy | first eight `taxonomy` ranks |
| `canonical_file` | `program_filename` when it is executable or a declared representation |
| `runtime_entry` | `runtime_entrypoint` and `runtime_ref` |
| `dna_schema` | `dna_ref` |
| `compatible_mates` | `compatible_species` |

Cell, Organ, Runtime, Civilization, RNA, energy, embodiment, trade, ownership,
and authority data have no safe universal default. Migration must request or
reference category-specific evidence.

## Compatibility

- `1.0` records remain readable and valid.
- `2.0` records must pass all expanded validation.
- a legacy record is never silently treated as active `2.0`;
- placeholder values are permitted only in a dry-run input and rejected as live;
- unknown category-specific fields must be retained in a migration evidence
  block until mapped.

## Dry-Run Migration

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
python KGEN-KAIOS/organism/natural_instantiation.py migrate `
  KGEN-KAIOS/examples/organisms/app-kaios-dashboard.organism.json
```

The command writes no files. It prints a candidate mapping and unresolved
fields.

## Rollback

Migration does not mutate the source record. Rollback is therefore the act of
discarding the dry-run output. A future persisted migration must retain the
original record and integrity hash as immutable ancestry.

## Integrity

Canonical hashes use UTF-8 without BOM, sorted JSON keys, compact separators,
and no trailing newline. The `integrity_hash` field is excluded from its own
hash calculation.

## No Data Loss

No automatic migration may delete, rename, or overwrite an existing organism
record. Ambiguous values remain unresolved and require review.
