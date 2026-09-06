# KAIOS UFO Propulsion Physics — GM Review Package V1

STATUS: DRAFT / READY_FOR_GM_ENGINEERING_REVIEW

## Exact-head evidence

Verified exact-head before this review-document commit:

`6d24a1f5b6f00d4c6eccd217455422f7ee18a27e`

GitHub Actions workflow: `KAIOS UFO App Organ Life Review`
Result: `SUCCESS`

The successful run covered:
- Solidity compile
- UFO App/Life unit tests
- UFO Propulsion Physics local-EVM tests
- `git diff --check`

This document does not claim deployment, Mainnet activation, formal Life birth, token movement, signer use, governance action, or merge.

## Machine-verified physics/runtime properties

1. Positive-matter and KSHIP mass-equivalent flow must be equal for the V1 annihilation model; mismatched flow reverts.
2. Engine allocation fractions must sum to 10000 bps.
3. Reaction efficiency cannot exceed 10000 bps.
4. Effective exhaust velocity must be > 0 and < c.
5. The simulator is pure/read-only: it cannot move KSHIP, trade KGEN, mint KGOD, create White-Hole credits, or execute propulsion.
6. Reference local-EVM case is tested for approximately:
   - KSHIP flow: 1 mg/s
   - positive matter flow: 1 mg/s
   - ship mass: 1000 kg
   - duration: 60 s
   - reaction efficiency: 100%
   - propulsion fraction: 30%
   - effective exhaust velocity: approximately 0.1c
   - total reaction power: approximately 179.75 GW
   - thrust: approximately 3.6 kN
   - acceleration: approximately 3.6 m/s^2
   - delta-v over 60 s: approximately 216 m/s
   - distance under constant-acceleration non-relativistic approximation: approximately 6.48 km
7. Invalid efficiency allocation, matter mismatch, and exhaust velocity >= c fail closed.

## Engineering assumptions — NOT universal canon

The following are deliberately not asserted as final KAIOS physical constants:

- `1 KSHIP token == X kg` physical scale.
- `1 KGEN White-Hole burn == X kg positive matter` final scale.
- fixed UFO propulsion efficiency.
- fixed KGOD recovery fraction.
- fixed radiation/heat fraction.
- fixed exhaust velocity or specific impulse.
- the non-relativistic constant-mass flight approximation at high delta-v.
- real-world physical feasibility of storing or directing macroscopic antimatter reactions.

These must remain explicit model/profile inputs or require separate canonical reconciliation before production activation.

## Conservation boundary

`KAIOSUFOPropulsionPhysicsV1.sol` is a deterministic simulator only.

Actual consumption/mint authority remains downstream/upstream in the Product_06 conservation lineage:

`verified White-Hole positive matter + KSHIP -> K108000 reaction receipt -> propulsion/recoverable/KGOD/radiation-heat allocation`

KGOD must not be minted merely because the simulator reports a nonzero KGOD potential.

## GM review checklist

Codex/GM should return P0/P1/P2 and GO / GO_WITH_FIXES / NO_GO after checking:

- exact-head identity and CI evidence
- fixed-point integer precision and truncation
- overflow bounds for large ship masses, durations, flow rates, and c^2 multiplication
- dimensional consistency of WAD/mg/kg/J/W/N units
- non-relativistic approximation boundary and required guard/label
- whether thrust approximation `F = 2P/v_e` is accepted only for the stated directed-exhaust model
- whether a photon-drive profile needs a separate formula rather than reusing the exhaust approximation
- compatibility with SHIP_ID, White-Hole Matter Source, KSHIPV5, K108000 reactor, and KGOD proof lineage
- no asset-moving authority in the simulator
- no Mainnet/deployment claim

## Deployment gate

`DEPLOYMENT_ALLOWED = NO`

Deployment remains blocked until independent GM review resolves any P0/P1 findings and explicitly authorizes the next deployment workflow. No private key, signer, registry mutation, Mainnet transaction, merge, payment, or governance action is authorized by this package.
