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

## Organs, Interfaces And Transplantation

- `KAIOS_SOFTWARE_ORGAN_STANDARD.md`: complete organ identity, interface,
  resource, energy, lifecycle and compatibility contract.
- `KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md`: fail-closed donor/host review,
  migration, rollback and event-history process.
- `KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json`: machine-readable Organ
  Manifest, fourteen-gate compatibility review and transplant record.
- `evidence/SOFTWARE_ORGAN_GATE_EVIDENCE_FIXTURE.json`: fixture-only typed
  gate-attestation bundle for identity-bound negative and replay tests.
- `tools/validate-software-organ-transplant.mjs`: fail-closed cross-record
  identity, evidence, rights, transition, hash-chain and rollback validator.
- `tests/software-organ-standards.test.mjs`: structural and semantic valid and
  invalid fixtures, Registry policy and denied-authority validation.

## Operations

- `KAIOS_AI_WORKFORCE_24H_SCHEDULER.md`: bounded execution and stop policy.
- `KAIOS_AI_WORKFORCE_24H_QUEUE.json`: machine-readable rolling queue.
- `KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md`: actual work and pause evidence.
- `tests/software-life-naming-audit.test.mjs`: audit, taxonomy and boundary
  validation.

The naming, Registry and organ-governance packages perform no rename, organ
transplant or public-route change. Runtime, CURRENT, Wallet, KGEN, contracts,
Constitution sources and Production authority are outside their write scope.
