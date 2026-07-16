---
TITLE: "ADR-LIFE-001 Species-Scoped Life OS"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ACCEPTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex delegated GM"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-LIFE-OS-ARCHITECTURE-001"
HUMAN_DECISION_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Record the decision to share contracts while isolating Species OS policy and Individual state."
ANCESTOR: "KGEN-KAIOS/life/LIFE_OS_ARCHITECTURE_RESOLUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: ArchitectureDecisionRecord
CLASS: LifeOSADR
ORDER: SpeciesScopedRuntime
FAMILY: KAIOS
GENUS: LifeArchitectureDecision
SPECIES: ADRLife001
CANONICAL_FILE: "KGEN-KAIOS/life/ADR/ADR-LIFE-001-SPECIES-SCOPED-LIFE-OS.md"
---

# ADR-LIFE-001: Species-Scoped Life OS

## Context

KAIOS needs consistent life events and invariants across Human, Plant, Animal, Robot and digital organisms. Their viability, growth, repair, reproduction and nutrition rules cannot safely share one executable implementation.

## Decision

Share a transport-neutral Life OS compatibility contract. Place immutable lifecycle policy in Species OS and mutable per-identity state in Individual Life OS. Bind every command, event, snapshot and migration to both identities and versions.

## Consequences

- Cross-species tooling can validate a stable contract.
- Species retain distinct capabilities and safety limits.
- Individuals cannot self-enable prohibited capability or rewrite Species policy.
- Migration requires compatibility evidence, review and rollback.
- More registries and version checks are required before implementation.

## Rejected Alternatives

- One universal executable Life OS: unsafe semantic coupling.
- Entirely unrelated per-species APIs: prevents portable validation and future interoperability.
- Put life maintenance in Mind or Citizen Runtime: violates separation of concerns.

## Status And Authority

`ACCEPTED` under delegated Level B architecture authority. Human override is available. This ADR does not authorize implementation.
