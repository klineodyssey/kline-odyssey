# Civilization Economy Runtime V1.0 — Architecture Specification

**Version:** `CIV-ECONOMY-V1.0`  
**Decision:** `HUMAN-CIV-ECONOMY-BASELINE-001`  
**Status:** `ARCHITECTURE_APPROVED` / Baseline `ARCHITECTURE_BASELINE_FROZEN`  
**Implementation:** `NOT_STARTED`  
**Date:** 2026-07-13T19:30:00Z

## 1. Formal Judgment

| Field | Value |
|-------|-------|
| Architecture | APPROVED |
| Architecture Baseline | FROZEN |
| Implementation | NOT_STARTED |
| Implementation Planning | HOLD |
| WorkQueue | NOT_CREATED |
| Deployment | DOCUMENTATION_ONLY |
| Runtime Entities | ZERO_STATE / PROTOTYPE_ONLY |

## 2. Master Economy Flow

```
Universe → Planet → Land → Building → Citizen → AI Employee
  → Mission → Evidence → Review → Salary → Bank → Market → Asset
  → Civilization Growth
```

Land step **imports LAND RUNTIME V1**; this runtime does not redefine K280 / Parcel / Coordinate / Ownership Geometry.

## 3. Biological 19-Layer Taxonomy (Formal)

1. `Domain`
2. `Kingdom`
3. `Phylum`
4. `Class`
5. `Order`
6. `Family`
7. `Genus`
8. `Species`
9. `Individual`
10. `OrganSystem`
11. `Organ`
12. `Tissue`
13. `Cell`
14. `Organelle`
15. `Genome`
16. `DNA`
17. `RNA`
18. `Gene`
19. `Expression`

### Species → Program Mapping

- `program_entry`
- `manifest`
- `schema`
- `runtime_adapter`
- `capability_set`
- `version`
- `lineage`

### Individual → Worker Mapping

- `worker_id`
- `owner_id`
- `desk_id`
- `current_task`
- `runtime_state`
- `attendance`
- `payroll_account`

### Digital Life Reproduction Pipeline

`Parent Selection → Compatibility Check → Trait Selection → Sandbox Birth → Test → Review → Species Registration → Human Approval → Activation`

**Forbidden:** direct overwrite of Canon, Secrets, private memory, or cross-tenant data.

## 4. Payroll

```
Base Salary
+ Mission Reward
+ Performance Bonus
+ Promotion Bonus
+ Civilization Contribution
+ Special Reward
- Penalty
- Withholding
```

Every payroll item requires: Evidence, Review, Pricing Unit, Ledger Entry, Approval Status.

## 5. Promotion

Based on: Skill, Mission, Attendance, Contribution, Performance.  
Human must not bypass evidence to change formal rank.

## 6. Land & Residence Binding

Player ≠ Land. Player fields and protections per LAND RUNTIME V1.  
CORE_HOMELAND / RESIDENTIAL_PROTECTED: no permanent transfer from a single conflict.

## 7. Governance / Tax / Defense Separation

Per parcel/territory overlay: owner_id, governor_id, tax_authority_id, defense_authority_id, airspace_authority_id, orbital_authority_id.

## 8. Territory Zones

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

Zone change: Proposal → Resident Impact Review → Governance Review → Human Approval → Registry Update.

## 9. War & Governance Transfer

War reallocates governance/tax/customs/transit/resource/airspace/orbital/border/outpost rights — **not** private homes.  
Postwar: civilian_protection, tax_transition_period, rent_protection, reconstruction_fund, appeal_window, audit_log.

## 10. Economic Conflict Priority Forms

- `TARIFF_WAR`
- `TRADE_RESTRICTION`
- `PORT_FEE_COMPETITION`
- `RESOURCE_QUOTA_CONFLICT`
- `MARKET_ACCESS_RESTRICTION`
- `BANK_CLEARING_RESTRICTION`
- `LOGISTICS_BLOCKADE_SIM`
- `SANCTION_SIM`
- `BORDER_TAX_CONFLICT`

## 11. Taxation

Types: `income_tax`, `land_tax`, `transaction_tax`, `customs_tax`, `port_fee`, `market_fee`, `resource_royalty`, `airspace_fee`, `orbital_fee`.

Constrained by: tax_cap, resident_protection, minimum_living_standard, appeal_rule, audit, expiry, Human Governance Policy.  
No unlimited wartime taxation.

## 12. Border Defense Margin

- `LONG_BORDER_MARGIN` — construction, settlement, infrastructure, population capacity, border prosperity commitment.
- `SHORT_BORDER_MARGIN` — blockade, suppression, risk control, expansion restraint, defense commitment.

Settlement outcomes: RETURNED, PARTIALLY_SLASHED, FULLY_SLASHED, TRANSFERRED_TO_RECONSTRUCTION, REWARDED, FROZEN_FOR_REVIEW.

**Prototype Ledger only.** Must not enter real finance or on-chain contracts.

## 13. Title / Seat / Realm

Generic model fields:

`realm_id`, `k_anchor`, `seat_id`, `title_id`, `title_name`, `governor_id`, `authority_scope`, `tax_scope`, `defense_scope`, `appointment_method`, `challenge_rule`, `term_rule`, `succession_rule`, `revocation_rule`

### Example — K11520

| Field | Value |
|-------|-------|
| Realm | 花果山 |
| Capital / Seat | 水簾洞 |
| Title | 美猴王 |
| Authority Type | CAVE_LORD / REALM_GOVERNOR |

Represents: governance, tax, mission publish, border management, civilization build, title/reputation.  
Does **not** auto-own all private land, confiscate homes, become permanently unchallengeable, or confer real-world political/legal power.

Also illustrative: K12345 五指山; K18888 凌霄寶殿; K23333 靈山.

**Title ≠ Land Ownership.**

## 14. Space & Moon

`K280 → K411 → K1852 → Orbital Infrastructure → Lunar Gate → Moon / K16888`

Arrival unlocks outpost capabilities only; Moon has independent registry (Land Runtime).

## 15. Weapons Safety

T0–T5 abstract tiers only. Game / Civilization Simulation Abstraction.  
Forbidden: real manufacture steps, materials, yields, ranges, real targets, real attack plans, operable military parameters.  
Priority: **BUILD_MORE_THAN_DESTROY**.

## 16. Change Control

Proposal → Independent Review → Resolution → ADR → Human Approval → Baseline Update.
