---
title: KAIOS Software Life Registry Report
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
status: CODEX_REVIEWED_REGISTRY
schema_version: 1.0.0
runtime_revision: 2026.08.02
authority: SIMULATION_ONLY
production_authorized: false
---

# KAIOS Software Life Registry Report

## Result

The generated Registry binds **33** existing software lives to stable,
version-free Life, Species and Genome identities. It records **109** hashed
organs and assigns all **52** public `api/kaios/**/*.json` projections to
exactly one read-only API life.

| Life type | Count |
|---|---:|
| Application | 2 |
| Viewer | 8 |
| Runtime | 7 |
| Schema | 9 |
| Worker | 1 |
| API | 6 |

| Runtime status | Count |
|---|---:|
| `ACTIVE_SIMULATION` | 16 |
| `READ_ONLY_PROJECTION` | 8 |
| `SCHEMA_ONLY` | 5 |
| `SPECIFICATION_ONLY` | 4 |

Forest/Agriculture, Supply Chain and Physical Labor remain explicitly
`SPECIFICATION_ONLY`; the Registry does not manufacture missing Runtime
coverage from similarly named documents.

## Compatibility

The manifest composes these existing owners:

- `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json`
- `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json`
- `KGEN-KAIOS/organism/taxonomy_registry.json`
- `KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md`

It does not edit or supersede them. Every entry carries all exact twelve-level
and 19-layer bindings, Git birth lineage, current code hash, aggregate artifact
hash, dependency references, rights, security and event history.

## Migration State

Nine lives have a planned version-free path and remain
`MIGRATION_PENDING`. No compatibility alias is claimed before it exists. The
later rename PRs must create the canonical embodiment first and preserve the
old location as a generated `LEGACY_ALIAS / NOT_CANONICAL /
DEPRECATION_PENDING` projection.

## Validation

- Manifest and Registry JSON: strict parse PASS
- Unique Life IDs: 33/33
- Unique Species IDs: 33/33
- Unique Genome IDs: 33/33
- Organ hashes: 109/109 verified from recorded Git blobs
- Public JSON projection ownership: 52/52 exactly once
- Dependency graph: acyclic
- Deterministic generation: byte-for-byte replay PASS
- World Viewer Product QA: 181 PASS / 0 FAIL / 8 SKIP on isolated local
  server; the first attempt on occupied port 8080 was discarded after its
  report proved a navigation timeout caused by two existing listeners.
- Wallet, real KGEN, on-chain transfer, external autonomy and Production
  authority: false

No executable, public route, CURRENT, Constitution source, Wallet or KGEN file
is changed by this package.
