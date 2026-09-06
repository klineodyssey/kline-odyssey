# KAIOS UFO Propulsion & Mass-Energy Whitepaper V1

Status: DRAFT ENGINEERING CANDIDATE — NOT MAINNET / NOT DEPLOYED

## 1. Purpose
This document defines the first deterministic propulsion-accounting model for KAIOS UFO products. It connects the existing Product_06 lineage (KSHIP antimatter + verified White-Hole positive-matter credit + K108000 conservation receipts + KGOD) to a ship-level physics simulation. It is not a claim that KAIOS tokens are literal physical matter and it is not an experimental aerospace specification.

## 2. Canonical product lineage used
- KAIOS -> K18911 -> KUFO.
- KUFO follows the Three-Autumn terminal-decay policy and ultimately yields KSHIP.
- KSHIP is the KAIOS stable antimatter/fuel accounting asset and has no configured half-life.
- Positive matter must come from an independently verified White-Hole burn lineage. Product_06 must not reuse the KAIOS already consumed upstream to create KUFO/KSHIP.
- K108000 is the controlled mass-energy reaction/conversion organ.
- KGOD can only be minted from an authorized reaction receipt; propulsion simulation itself never mints KGOD.
- A UFO is authenticated by SHIP_ID and its organ/controller registry lineage.

## 3. KGEN White-Hole boundary
The historical KGEN tax/burn percentage is an upstream token-economy rule. This propulsion runtime does NOT multiply a trade by 0.10% itself. It consumes only an already verified positive-matter-equivalent credit from the White-Hole matter source. This avoids charging the burn twice and permits the KGEN burn verifier/scale lineage to evolve independently under review.

Any example that combines `1 KGEN = 1000 kg` with a 0.10% KGEN burn is an engineering scale example until the exact CURRENT KGEN physics/White-Hole lineage is independently reconciled and approved. It is not hard-coded in `KAIOSUFOPropulsionPhysicsV1.sol`.

## 4. Reaction model
For a full matter/antimatter reaction candidate, positive-matter mass-equivalent flow must equal KSHIP antimatter mass-equivalent flow. Let each side flow at m_dot kg/s. Total input mass flow is 2*m_dot.

The ideal rest-energy accounting is:

E = m_total * c^2

The runtime then applies a configurable reaction-efficiency factor. The reacted energy is partitioned into four buckets whose basis-point fractions MUST total exactly 10,000:

1. propulsion energy,
2. recoverable energy,
3. KGOD mass-equivalent allocation,
4. radiation/heat.

This prevents the same reacted energy from being counted twice.

## 5. Propulsion model V1
V1 uses a non-relativistic directed-exhaust approximation for simulation/accounting:

P_propulsion = E_propulsion / duration
F ~= 2 * P_propulsion / v_exhaust
acceleration = F / ship_mass
delta_v = acceleration * duration
distance ~= 0.5 * acceleration * duration^2

This approximation is intentionally bounded: exhaust velocity must be below c, and long-duration/high-relativistic trajectories require a future relativistic runtime. V1 must not be marketed as a real-world propulsion prediction.

## 6. Reference engineering example
Reference only, not a canonical engine constant:

- KSHIP flow: 1 mg/s
- verified positive matter: 1 mg/s
- total input: 2 mg/s
- reaction efficiency: 100%
- propulsion allocation: 30%
- exhaust velocity: 0.1c

The ideal total reaction power before allocation is approximately 179.75 GW. Under the V1 directed-exhaust approximation, the 30% propulsion allocation produces approximately 3.60 kN thrust. A 1,000 kg simulated craft would have about 3.60 m/s^2 initial acceleration under the simplified assumptions.

These figures are reference calculations only. Real antimatter propulsion requires containment, reaction products, momentum coupling, shielding, thermal rejection and other engineering that this blockchain runtime does not model.

## 7. Engine profiles and ship value
No single efficiency is declared universal. Different UFO classes may define reviewed Engine Profiles with:
- reaction efficiency,
- propulsion fraction,
- recoverable-energy fraction,
- KGOD fraction,
- radiation/heat fraction,
- effective exhaust velocity,
- rated mass-flow limits,
- thermal and structural limits in later versions.

A UFO's economic value should not be hard-coded from fuel alone. Candidate valuation inputs include verified ship identity, engine efficiency, maximum sustainable thrust, KSHIP consumption rate, White-Hole matter acquisition capability, KGOD recovery capability, organ health, maintenance state and verified operating history. Market price remains a market outcome rather than a physics constant.

## 8. Anti-abuse and conservation requirements
- SHIP_ID must be authenticated.
- White-Hole matter credit must originate from verified eligible activity.
- self-match/wash-trade credit is rejected by the upstream matter engine.
- a burn/credit proof cannot be replayed.
- positive-matter credit is consumed once.
- KSHIP reaction fuel is consumed once.
- propulsion and KGOD cannot each claim 100% of the same input energy.
- simulation functions cannot mint, transfer, deploy or change Mainnet state.

## 9. Contract
`KGEN-KAIOS/contracts/KAIOSUFOPropulsionPhysicsV1.sol`

The contract is a pure deterministic calculator. Inputs include SHIP_ID, ship mass, KSHIP/positive-matter mass-equivalent flow, duration and an Engine Profile. Outputs include consumed mass, reacted mass, energy, average power, thrust, acceleration, delta-v, distance, recoverable energy, KGOD mass-equivalent potential and radiation/heat.

## 10. Production gate
Before any chain deployment:
1. Solidity compile and exact-head tests must pass.
2. numeric/unit/fuzz/boundary tests must cover fixed-point rounding and overflow limits.
3. Product_06 receipt and SHIP_ID interfaces must be independently reviewed.
4. CURRENT KGEN physical scale and White-Hole burn lineage must be reconciled before displaying KGEN-per-second or kg-per-second as canonical production values.
5. Codex/GM must review P0/P1/P2 findings.
6. Mainnet deployment remains a separate human-authorized action.
