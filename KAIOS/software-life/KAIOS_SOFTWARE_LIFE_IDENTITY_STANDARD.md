---
title: KAIOS Software Life Identity Standard
standard_id: KAIOS-SOFTWARE-LIFE-IDENTITY
standard_version: 1.0.0
runtime_revision: 2026.08.02
status: REVIEWED_STANDARD
authority: SIMULATION_ONLY
production_authorized: false
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
---

# KAIOS Software Life Identity Standard

Official Chinese term: **廣義相對論生物生命命名法**

Official English term: **KAIOS General-Relativistic Biological Life Naming
System**

## 1. Purpose

KAIOS represents an application, Runtime, API, schema, viewer, worker or data
package as broad software life. This is an identity and governance model. It
does not claim that software has animal physiology, legal personhood,
consciousness, ownership rights, production authority or autonomous external
agency.

The model adopts these equivalences:

| Software concept | Broad-life concept |
|---|---|
| Program | Life |
| Application | Organism |
| Module | Organ |
| Function | Biological function |
| Interface | Organ connection |
| Data schema | Genome expression contract |
| State | Physiological state |
| Event log | Life memory |
| Dependency | Ecological or organ dependency |
| Process | Metabolic or behavioral process |
| API | Organ communication channel |
| Package | Life package |
| Deployment | Embodiment |
| Fork | Reproductive branch |
| Merge | Controlled genetic or organ integration |
| Patch | Healing or bounded mutation |
| Deprecation | Retirement |
| Deletion | Death or archival termination |

## 2. Existing Authority

This standard composes existing repository owners; it does not redefine them.

| Owner | Binding |
|---|---|
| `KAIOS_CANONICAL_LIFE_SCHEMA_V1.json` | Universal Life shared core and type-extension authority |
| `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` | Existing Organism Manifest compatibility contract |
| `KGEN-KAIOS/organism/taxonomy_registry.json` | Twelve-level Life taxonomy registry |
| `KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md` | Existing 19-layer taxonomy extension |
| `KGEN-KAIOS/genesis-dna/SPECIES_GENOME_STANDARD.md` | Genome and bounded-trait source proposal |
| `KAIOS_CANONICAL_LIFE_RIGHTS_V1.md` | Shared rights boundary |
| `KGEN-KAIOS/genesis-dna/DNA_LICENSE_STANDARD.md` | Simulated license and provenance boundary |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Read-only active physics authority |

Where these owners disagree, the protected current authority and merged
Canonical Life definitions prevail. This standard records a compatibility
gap; it never silently reconciles one.

## 3. Permanent Identity

Every authoritative software life has exactly one stable `life_id`, one stable
`canonical_name`, and one authoritative implementation path. A new genome
revision does not create a new Life ID. A governed descendant, fork or
reproductive branch does.

Permanent executable, organ, module and public-route names must not encode:

- semantic or release versions;
- `final`, `latest`, `new`, `copy`, `backup`, `rev` or `revision` labels;
- an implementation generation masquerading as species identity.

Version metadata belongs in the Life Manifest, Genome Manifest, Organ
Manifest, release record, changelog, Git commit, Recovery and Closeout.

Required identity fields:

```text
life_id, species_id, genome_id, organism_name, canonical_name, display_name,
life_type, taxonomy, generation, genome_version, runtime_revision,
birth_commit, birth_time, creator, maintainer, location, embodiment,
energy_profile, resource_profile, rights, dependencies, organs, interfaces,
compatibility, reproduction_policy, mutation_policy, transplant_policy,
marketplace_policy, lifecycle_state, health_state, event_history, provenance,
security_boundary, authority_level
```

`life_id`, `species_id` and `genome_id` are immutable after birth. Corrections
use aliases and lineage records. They are never silently rewritten in saved
state or historical events.

## 4. Version Placement

The permanent source path is version-free:

```text
KAIOS/ai-company/generate-ai-company-api.mjs
KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js
world-viewer/ai-company/
api/kaios/ai-company/projects.json
```

Its mutable genome metadata carries version:

```json
{
  "life_id": "LIFE-KAIOS-AI-COMPANY-API",
  "species_id": "SPECIES-KAIOS-SOFTWARE-SERVICE",
  "genome_id": "GENOME-KAIOS-AI-COMPANY-API",
  "genome_version": "1.0.0",
  "generation": 1,
  "runtime_revision": "2026.08.02",
  "compatibility_epoch": "KAIOS-GENESIS",
  "previous_revision": null
}
```

Schema versions remain explicit inside schema metadata. Versioned schema
filenames may remain temporary aliases while consumers migrate, but they are
not the permanent canonical schema identity.

## 5. Taxonomy

Software Life uses the existing twelve-level registry and 19-layer extension.
It does not create a twentieth rank or a second taxonomy. The normative
software mapping is machine-readable in
`KAIOS_SOFTWARE_LIFE_TAXONOMY_CROSSWALK.json`.

The biological terms are analogical contracts for software. They do not force
animal physiology on digital, terrain, water, building or company life.

## 6. Lifecycle

Allowed lifecycle states are:

```text
CONCEIVED
SPECIFIED
BORN
ACTIVE
STRESSED
DEGRADED
HEALING
MUTATING
REPRODUCTION_REVIEW
TRANSPLANT_REVIEW
RETIRED
ARCHIVED
DEAD
```

Transitions require an event, actor, simulation time, reason, previous state
hash and next state hash. `DEAD` and `ARCHIVED` preserve immutable history.
Neither means erasing provenance.

## 7. One Organism, One Implementation

A compatibility alias may preserve an old import or public URL, but it cannot
contain an independent implementation. The unversioned canonical path owns
behavior. The alias must declare:

```text
LEGACY_ALIAS
NOT_CANONICAL
DEPRECATION_PENDING
```

Static GitHub Pages JSON aliases may be emitted by the same generator as the
canonical projection. Viewer aliases may redirect or load thin wrappers that
delegate to canonical assets. Alias removal requires production-link, cache,
consumer and rollback evidence.

## 8. Organs and Interfaces

An application decomposes into organs with identity, owner, input/output
contracts, resource and energy costs, dependencies, health, event history and
compatibility signatures. A function can be a cell-level expression without
receiving a separate Life ID. Organ transplantation is governed by
`KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md`: it defaults to denied and may
advance only through a complete Codex-reviewed simulation record. Software
reproduction remains prohibited until its dedicated standard and review gates
pass.

## 9. Reproduction and Mutation

A normal patch updates the existing genome revision and mutation history. A
new descendant requires new Life and Genome IDs, parent provenance, rights,
compatibility review, a candidate birth, tests and Codex review.

There is no unrestricted self-reproduction, automatic Canonical promotion or
self-modifying production code. Cursor may create only explicitly dispatched
candidate artifacts.

## 10. Rights and K11520

Identity does not imply ownership or tradeability. Owner, custodian, operator,
maintainer, user, modifier, reproducer and transplant recipient are separate
roles. K11520 eligibility is simulated review metadata only.

This standard grants no real property, legal, financial, wallet, token,
settlement or on-chain right.

## 11. Source Headers

Authoritative source files use a parser-safe life header where the language
permits. JSON uses a metadata object. Markdown uses front matter when it does
not conflict with an existing cumulative-document format. HTML uses metadata
elements or comments that do not affect rendering.

Headers identify the source; they do not activate it. Generated projections
may inherit identity metadata from a manifest rather than duplicate mutable
authority in every file.

## 12. Validation

A software life is valid only when:

1. Life, Species and Genome IDs are unique in their owner registry.
2. The canonical executable and route names are version-free.
3. Version metadata is present in manifests and release history.
4. Taxonomy references resolve to existing owners.
5. Organs, interfaces and dependencies resolve.
6. Rights, security, energy and resource boundaries are explicit.
7. Code and artifact hashes are present for released records.
8. Compatibility aliases resolve to one implementation.
9. Reproduction and transplantation default to denied until reviewed.
10. Wallet, real KGEN, on-chain transfer, external autonomy and Production
    authority remain disabled.

## 13. Migration Rule

No repository-wide blind rename is permitted. Every migration batch must begin
from `KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json`, resolve collisions, update imports
and links, preserve aliases, run regressions, create Recovery, deploy when
public paths change, verify production and record Closeout.
