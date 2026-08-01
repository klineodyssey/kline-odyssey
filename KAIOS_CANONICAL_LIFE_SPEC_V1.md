# KAIOS Canonical Life Specification V1

Status: `CANONICAL_SPECIFICATION`
Mode: `SPECIFICATION_FIRST`
Composition: `SHARED_CORE + APPROVED_TYPE_EXTENSION`

## Purpose

This specification gives broad KAIOS Life a shared identity, physics, economy,
rights, provenance and integration envelope without pretending every Life type
has animal physiology. It covers biological, digital, robotic, plant, animal,
marine, microbial, terrain, water-body, land, building, infrastructure,
company, city, planet, temple and universe Life.

It does not activate Production Runtime, legal personhood, a wallet, real KGEN,
on-chain transfer or real K11520 settlement.

## Composition Contract

Every package contains all Universal Core keys, a `field_applicability` decision
for type-sensitive fields, and at least one approved extension. Applicability is
one of `REQUIRED`, `OPTIONAL`, or `NOT_APPLICABLE`. A non-applicable field must
remain structurally empty and explain why; it must never be populated with
invented animal data.

The supported `life_type` values are defined exactly in
`KAIOS_CANONICAL_LIFE_SCHEMA_V1.json`. Extension membership is controlled by
`KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json`.

## Universal Core

The required envelope includes identity, taxonomy, origin/formation, location,
physical measures, composition, energy and resource flows, environment,
development, aging, integrity, damage, repair, reproduction or replication,
change, termination, history, separated rights and authority, economy,
civilization, runtime/viewer/API bindings, provenance, integrity, deterministic
seed and event log.

`species_id` may be null only when its applicability is explicitly
`NOT_APPLICABLE`; `life_id` remains mandatory for every instance. Taxonomy uses
the nine universal ranks and may preserve the canonical 19-layer biological
extension. A Life ID is a project identifier, not evidence of sentience,
personhood, ownership or legal registration.

## Type Boundaries

- Plant, animal, marine and microbial extensions model biological functions.
- Terrain models geology, formation, erosion, stability and collapse.
- Water bodies model source, flow, balance, quality, flood and drought.
- Soil models fertility, moisture, contamination and physical support.
- Land separates parcel identity, title, occupancy and land use.
- Buildings and infrastructure model constructed systems, condition and service.
- Digital and robotic Life model bounded software/compute or embodied machinery.
- Company, city, planet, temple and universe extensions model system state and
  governance without asserting biological organs or legal personhood.

## Compatibility

An organism package can include a Canonical Life manifest while keeping its
Schema V2 organism manifest. IDs and references must agree. This specification
does not copy or supersede `ORGANISM_MANIFEST_SCHEMA.json`, the Species registry,
or the K280 package. Future migration is a separate reviewed workline.

## Validation Invariants

1. The Life type must have its required approved extension.
2. All universal fields and applicability decisions must be present.
3. Physics quantities use explicit units and respect conservation.
4. Ownership, custody, operation, use and control remain separate.
5. Economic value needs a documented demand, use or resource basis.
6. Runtime/viewer/API bindings cannot grant Production authority.
7. Integrity uses SHA-256 and names the covered records.
8. Events form a deterministic hash-linked history.
9. `NO_REAL_KGEN`, `NO_ONCHAIN_TRANSFER`, and `SIMULATED_K11520_ONLY`
   are immutable V1 boundaries.

## Adoption

New packages may adopt V1 after schema validation and canonical review. Existing
packages are unchanged until a dedicated migration validates compatibility.
Cursor dispatch is not performed by this specification task.
