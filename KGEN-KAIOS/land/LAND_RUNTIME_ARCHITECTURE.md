# LAND RUNTIME V1 — Architecture Specification

**Version:** `LAND-RUNTIME-V1.0`  
**Decision:** `HUMAN-CIV-ECONOMY-BASELINE-001` — `APPROVE_CIVILIZATION_ECONOMY_RUNTIME_V1_ARCHITECTURE` (includes K280 / LAND RUNTIME V1)  
**Status:** `ARCHITECTURE_APPROVED`  
**Implementation:** `NOT_STARTED`  
**Date:** 2026-07-13T19:30:00Z

## 1. Formal Architecture Judgment

| Field | Value |
|-------|-------|
| Architecture | APPROVED |
| Architecture Baseline | TO_BE_FROZEN / FROZEN (see baseline files) |
| Implementation | NOT_STARTED |
| Implementation Planning | HOLD |
| WorkQueue | NOT_CREATED |
| Deployment | DOCUMENTATION_ONLY |
| Runtime Entities | ZERO_STATE / PROTOTYPE_ONLY |

## 2. Core Principle

**Player and Land are distinct objects.**

A player may hold references:

- `home_parcel`
- `residence_id`
- `owned_parcels`
- `leased_parcels`
- `farmland_rights`
- `commercial_rights`
- `airspace_rights`
- `orbital_rights`
- `underground_rights`

Holding a title or governance seat **does not** automatically grant ownership of all private parcels in a realm.

## 3. K280 Anchor

K280 is the planetary / celestial land-runtime anchor for Earth-side parcels and the start of the space path:

`K280 → K411 → K1852 → Orbital Infrastructure → Lunar Gate → Moon / K16888`

K280 defines the binding between Universe Map points and Land Registry parcels. Coordinate geometry and ownership geometry are defined **only** in this Land Runtime package. Civilization Runtime must import by reference.

## 4. Rights Separation (Mandatory)

Every Territory / Parcel Overlay may carry distinct authority fields:

| Field | Meaning |
|-------|---------|
| `owner_id` | Private ownership of parcel / residence assets |
| `governor_id` | Governance authority |
| `tax_authority_id` | Tax collection authority |
| `defense_authority_id` | Defense / border authority |
| `airspace_authority_id` | Airspace authority |
| `orbital_authority_id` | Orbital slot / orbital fee authority |

These four+ rights **may be held by different roles**. Ownership ≠ Governance ≠ Tax ≠ Defense.

## 5. Territory Zones

Formal zone types:

- `CIVIL_ZONE`
- `RESIDENTIAL_SAFE_ZONE`
- `NON_WAR_ZONE`
- `BORDER_ZONE`
- `CONTESTED_ZONE`
- `WAR_ELIGIBLE_ZONE`
- `FRONTIER_ZONE`
- `WILDERNESS`
- `RESOURCE_ZONE`
- `MYTHIC_REALM`

### Zone Rules (Architecture)

- **CIVIL_ZONE** — No civilization combat; life, work, trade, agriculture, housing allowed.
- **RESIDENTIAL_SAFE_ZONE** — Residences, occupancy assets, and basic living facilities protected.
- **NON_WAR_ZONE** — Diplomacy, commerce, and governance competition only.
- **BORDER_ZONE** — Border defense, customs, transit, economic competition.
- **CONTESTED_ZONE** — Governance and resource rights may be reallocated via campaign simulation.
- **WAR_ELIGIBLE_ZONE** — Gamified civilization campaigns allowed; protected residences must not be destroyed.
- **FRONTIER_ZONE / WILDERNESS** — Unowned or low-governance; exploration, settlement, outposts, new civilizations.
- **RESOURCE_ZONE** — Resource extraction under quota / royalty rules.
- **MYTHIC_REALM** — Narrative / mythic overlay; still subject to residence protection and Human Governance Policy.

### Zone Change Flow

Landlord may propose zone changes but **cannot unilaterally** convert inhabited civil zones into war zones.

Major zone changes require:

`Proposal → Resident Impact Review → Governance Review → Human Approval → Registry Update`

## 6. Residence Protection

- `CORE_HOMELAND` and `RESIDENTIAL_PROTECTED` **must not** permanently transfer due to a single civilization conflict.
- Private residence ownership is preserved across governance transfer.
- Postwar protections (architecture-level): `civilian_protection`, `tax_transition_period`, `rent_protection`, `reconstruction_fund`, `appeal_window`, `audit_log`.

## 7. War Outcome = Rights Reallocation (Not Home Confiscation)

Civilization war primary results reallocate:

- `governance_right`
- `tax_collection_right`
- `customs_right`
- `transit_right`
- `resource_quota`
- `airspace_right`
- `orbital_slot`
- `border_control`
- `outpost_license`

**Not** private home confiscation. New Governor may collect governance tax under established tax caps; may not arbitrarily evict or confiscate.

## 8. Lunar Land

Moon uses an **independent celestial body and land registry**. Reaching the Moon unlocks Outpost / Research / Mining / Energy / Trade / Housing / Defense / Logistics — **not** ownership of the entire Moon.

## 9. Prototype Boundary

All ledgers, registries, and authority assignments in this package are **Prototype / Zero-State**. No real chain settlement, NFT mint, or real-world legal effect.

## 10. Change Control

Proposal → Independent Review → Resolution → ADR → Human Approval → Baseline Update.
