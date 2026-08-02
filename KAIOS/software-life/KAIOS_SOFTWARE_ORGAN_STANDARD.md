---
title: KAIOS Software Organ Standard
life_id: LIFE-KAIOS-SOFTWARE-ORGAN-STANDARD
species_id: SPECIES-KAIOS-SOFTWARE-STANDARD
genome_id: GENOME-KAIOS-SOFTWARE-ORGAN-STANDARD
genome_version: 1.0.0
generation: 1
canonical_filename: KAIOS_SOFTWARE_ORGAN_STANDARD.md
lifecycle_state: ACTIVE
standard_id: KAIOS-SOFTWARE-ORGAN-STANDARD
standard_version: 1.0.0
runtime_revision: 2026.08.02
status: REVIEWED_STANDARD
authority: SIMULATION_ONLY
production_authorized: false
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
---

# KAIOS Software Organ Standard

## 1. Purpose

This standard defines how a KAIOS software-life organism exposes bounded,
replaceable organs without creating a second Runtime, taxonomy, Rights owner or
Canonical Life schema. It composes:

- `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` for the shared Life envelope;
- `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` for Organism Manifest
  compatibility;
- `KGEN-KAIOS/organism/taxonomy_registry.json` and
  `KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md` for taxonomy;
- `KGEN-KAIOS/genesis-dna/SPECIES_GENOME_STANDARD.md` for bounded Genome
  revisions;
- `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md` for separated Rights; and
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` as the read-only
  active Physics authority.

The biological language is an identity and compatibility model. It grants no
sentience, legal personhood, external autonomy, Production authority, Wallet,
real KGEN or on-chain capability.

## 2. Identity Layers

An organism Registry entry contains compact organ references: `organ_id`,
`organ_type`, repository path and content hash. A full Organ Manifest uses
`KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json`. The full record does not
replace the Registry entry; both must agree on identity, owner and hash. The
compact and full schemas use the same twenty-value organ vocabulary and a
cross-schema regression test prevents drift.

An organ is not an independent organism unless a separate reviewed Life
Manifest grants a distinct `life_id`. Functions remain cell-level expressions
and do not receive Life IDs merely because they are callable.

Every organ requires:

```text
organ_id
organ_type
owner_life_id
genome_contract
input_interface
output_interface
resource_cost
energy_cost
state
health
compatibility_signature
transplantable
required_host_capabilities
forbidden_hosts
dependency_list
event_history
version_metadata
```

IDs are stable. Version information belongs in `version_metadata`; executable
organ filenames remain version-free.

## 3. Organ Types

The allowed types are:

| Organ type | Responsibility |
|---|---|
| `INPUT_ORGAN` | Validate and admit bounded input. |
| `OUTPUT_ORGAN` | Emit declared results without hidden authority. |
| `MEMORY_ORGAN` | Persist governed simulation state and history. |
| `IDENTITY_ORGAN` | Resolve stable Life, Species, Genome and Organ IDs. |
| `PHYSICS_ORGAN` | Bind to, but never redefine, Physics authority. |
| `TIME_ORGAN` | Advance or read deterministic simulation time. |
| `LOCATION_ORGAN` | Bind state and actions to an explicit location. |
| `ENERGY_ORGAN` | Account for bounded compute or simulated energy. |
| `ECONOMY_ORGAN` | Bind balanced simulated ledgers and demand. |
| `RIGHTS_ORGAN` | Query separated Rights; it cannot grant them locally. |
| `SECURITY_ORGAN` | Enforce authority, integrity and input boundaries. |
| `COMMUNICATION_ORGAN` | Exchange declared messages or events. |
| `PROCESSING_ORGAN` | Perform deterministic domain transformations. |
| `STORAGE_ORGAN` | Store permitted local or repository state. |
| `VIEWER_ORGAN` | Project inspectable UI without becoming authority. |
| `API_ORGAN` | Expose a declared communication contract. |
| `MUTATION_ORGAN` | Prepare bounded revision candidates for review. |
| `REPRODUCTION_ORGAN` | Prepare descendant candidates; never self-promote. |
| `HEALING_ORGAN` | Apply reviewed repair and rollback procedures. |
| `AUDIT_ORGAN` | Preserve evidence, hashes and event history. |

## 4. Genome Expression Contract

`genome_contract` binds the organ to its owner Genome and records:

- Genome ID and compatibility epoch;
- expression contract ID;
- state and event schema hashes;
- code or artifact hash;
- required host Life type and minimum Genome version.

A contract revision changes Genome metadata, not the permanent filename or
Organ ID. A breaking contract requires compatibility review and may require a
new descendant organism rather than mutation of the current organism.

## 5. Interfaces

Every input and output interface has a stable ID, direction, protocol,
contract hash, data classification, cardinality and mutation boundary. Inputs
must be validated before processing. Outputs must declare whether they are
read-only projections or state-changing local simulation commands.

An interface cannot silently expand its authority. A read-only API alias must
delegate to the same canonical organ and must not contain a second
implementation.

Compatible interfaces require all of:

1. matching protocol or a reviewed adapter;
2. compatible contract and state schema hashes;
3. compatible units and data classifications;
4. no authority escalation;
5. bounded resource and energy use;
6. deterministic behavior where the host requires replay.

## 6. Resource And Energy Accounting

Every organ declares bounded compute, memory, storage and network estimates,
plus an energy unit and maximum per operation. `UNBOUNDED` is invalid. Static
documents may use zero execution cost but still declare repository storage.

If host capacity is insufficient, the organ remains inactive with
`RESOURCE_CAPACITY_UNAVAILABLE` or `ENERGY_CAPACITY_UNAVAILABLE`. Capacity is
not fabricated by simulated payment.

## 7. Lifecycle And Health

Organ states are:

```text
CONCEIVED
SPECIFIED
AVAILABLE
ACTIVE
PAUSED
STRESSED
DEGRADED
HEALING
TRANSPLANT_REVIEW
TRANSPLANTING
RETIRED
ARCHIVED
FAILED
```

Health is `HEALTHY`, `AT_RISK`, `DEGRADED`, `FAILED`, `HEALING` or
`UNKNOWN`. A failed required organ can degrade or stop the host, but its event
history and provenance remain immutable.

Each state change records actor, simulation time, inputs, outputs, reason,
previous state hash and next state hash. Replay with the same initial state,
seed and actions must produce the same event chain.

## 8. Ownership, Rights And Custody

Organ owner, host owner, code creator, custodian, operator, maintainer,
license holder, mutation reviewer and transplant reviewer are separate roles.
Owning a host does not automatically grant rights over a donor organ.

All current operations are `SIMULATED_RIGHTS_ONLY`. Mutation,
reproduction, transplant, transfer and commercial use default to denied unless
their dedicated review record explicitly approves the simulated action.

## 9. Compatibility And Dependency Rules

`compatibility_signature` is a SHA-256 digest over canonicalized identity,
Genome contract, interfaces, dependencies, required capabilities and security
boundary. The semantic validator recomputes this digest; a caller-provided
64-character value is not evidence. A changed signed field requires a new
signature and event.

Every dependency must resolve to an existing Life or Organ ID, an explicitly
declared repository authority, or an approved external read-only dependency.
Cycles must be classified and cannot be hidden.

`forbidden_hosts` is evaluated before positive capability matching. A host on
that list cannot accept the organ even if other capabilities match.

## 10. Filename And Alias Rule

Authoritative executable organ filenames and canonical routes contain no
version token. Legacy versioned names may remain only as thin aliases marked:

```text
LEGACY_ALIAS
NOT_CANONICAL
DEPRECATION_PENDING
```

The alias and canonical path must resolve to one implementation and one Organ
ID. Version metadata remains in the Organ Manifest, Genome, changelog, Git
history, Recovery and Closeout.

## 11. Validation

An organ is reviewable only when:

1. its owner Life exists in the Software Life Registry;
2. Organ ID and compatibility signature are unique;
3. all required fields and explicit units are present;
4. Genome, state, event and artifact hashes are SHA-256;
5. interfaces and dependencies resolve;
6. resource and energy maxima are bounded;
7. Rights and security boundaries are explicit;
8. automatic mutation, reproduction and transplant are false;
9. real Wallet, KGEN, on-chain transfer, external autonomy and Production
   authority are false; and
10. deterministic tests, rollback and event-chain checks pass;
11. every passing gate binds a gate-specific semantic subject hash, not only a
    check-token label;
12. historical Worker Registry authority provides only the maximum grant and
    the current Registry has not revoked or suspended the actor; and
13. review provenance binds an immutable repository authority epoch and
    evidence bundle while explicitly declaring that Git provenance is not
    cryptographic user authentication.

Cross-record identity, evidence, state-transition, event-hash and rollback
rules are enforced by
`tools/validate-software-organ-transplant.mjs`; they are not delegated to
nonstandard JSON Schema annotations.

This standard defines a simulation review contract. It does not perform a
transplant or activate any organ.
