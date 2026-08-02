# KAIOS Software Life

Status: `SIMULATION_ONLY / CONTROLLED_MIGRATION`

This directory owns the reviewed compatibility layer that treats KAIOS
software as broad life while preserving the existing Canonical Life,
Organism Manifest, taxonomy, Physics, Rights and Genome authorities.

## Naming and Identity

- `KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json`: complete tracked-file and JSON
  identity audit at its recorded source commit.
- `KAIOS_SOFTWARE_LIFE_NAMING_AUDIT_REPORT.md`: human-readable audit result.
- `KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json`: dependency-aware migration plan;
  every entry begins `PLANNED_NOT_EXECUTED`.
- `KAIOS_SOFTWARE_LIFE_IDENTITY_STANDARD.md`: stable identity and version
  placement rules.
- `KAIOS_SOFTWARE_LIFE_TAXONOMY_CROSSWALK.json`: exact reuse of the existing
  twelve-level and 19-layer taxonomy owners.
- `tools/audit-software-life-names.mjs`: version-free reproducible audit tool.

## Manifest and Registry

- `KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json`: compatibility manifest that
  requires stable Life, Species and Genome IDs, taxonomy, organs, interfaces,
  rights, lifecycle, provenance, hashes and denied production authorities.
- `KAIOS_SOFTWARE_LIFE_REGISTRY.json`: generated registry of authoritative
  applications, Runtimes, viewers, schemas, workers and read-only APIs.
- `KAIOS_SOFTWARE_LIFE_REGISTRY_REPORT.md`: coverage, migration and authority
  review for the generated Registry.
- `tools/generate-software-life-registry.mjs`: deterministic Git-lineage and
  artifact-hash generator.
- `tests/software-life-registry.test.mjs`: identity, taxonomy, ownership,
  dependency, hash, replay and security validation.

## Operations

- `KAIOS_AI_WORKFORCE_24H_SCHEDULER.md`: bounded execution and stop policy.
- `KAIOS_AI_WORKFORCE_24H_QUEUE.json`: machine-readable rolling queue.
- `KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md`: actual work and pause evidence.
- `tests/software-life-naming-audit.test.mjs`: audit, taxonomy and boundary
  validation.

The naming and Registry packages perform no rename and create no public route. Runtime,
CURRENT, Wallet, KGEN, contracts, Constitution sources and Production
authority are outside its write scope.
