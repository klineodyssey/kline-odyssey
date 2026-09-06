# KAIOS UFO App / Organ / Life Spec V1

## Status
DRAFT PRODUCT CANDIDATE. Not deployed. Not Mainnet live. Not a formal KAIOS Life birth record by itself.

## Purpose
Build one authenticated UFO organism runtime on top of the verified Product_06 mass-energy lineage without duplicating KSHIP, White-Hole Matter, K108000, KGOD, or exchange runtimes.

## Identity
- `SHIP_ID` is the primary UFO machine identity.
- `controller` comes from `KAIOSShipIdentityRegistryV1`.
- `LIFE_ID` is optional at deployment time and may remain zero / NOT_ASSIGNED until an external canonical KAIOS birth process assigns one.
- Changing chat pages, app sessions, or controllers does not create a new UFO life automatically.

## Body and organs
`KAIOSUFOOrganRuntimeV1` is a read-only organ projection. It does not own funds and cannot replace organs.

Critical flight organs:
- Trading Engine
- White-Hole Positive Matter Engine
- K108000 Mass-Energy Reactor
- KSHIP fuel core
- Navigation

Additional organs:
- KGOD stable-material output
- K8888 Mobile ATM / Bank

The organ runtime reads canonical addresses from `IKAIOSOrganRegistry`. Missing critical organs fail closed.

## Life state machine
`KAIOSUFOLifeV1` states:
- DORMANT
- ALIVE
- FLIGHT
- MAINTENANCE
- RETIRED

Only the current authenticated ship controller may change life state or emit operating intent.

Entering FLIGHT requires `readyForFlight() == true` from the organ runtime. The life contract itself cannot transfer tokens, trade KGEN, burn KSHIP, mint KGOD, replace organs, or alter registry bindings.

## Energy / economy lineage
The UFO consumes no free energy.

Positive-matter lineage:
`real KGEN market trade -> verified White-Hole burn receipt -> ship-bound Positive Matter Credit`

Antimatter lineage:
`KAIOS -> KUFO -> Three-Autumn decay -> KSHIP`

Reaction lineage:
`SHIP_ID + KSHIP + equal positive matter -> K108000 -> propulsion + recoverable energy + KGOD + radiation/heat`

All K108000 outputs must equal total mass-energy input. A burn receipt, matter credit, KSHIP reaction proof, and KGOD reaction proof are single-use.

## Trading-engine safety
The UFO must not manufacture energy by wash trading. Energy/matter credit is valid only when the upstream burn verifier marks the trade as a real AMM trade and rejects self-match or wash-trade lineage.

## App runtime
`app/ufo-runtime-v1.mjs` is a fail-closed UI projection. It exposes identity, state, organs, capabilities, and action guards. The app does not infer readiness from labels or optimistic UI state; it consumes verified contract state.

## K8888 relationship
K8888 Mobile ATM / Bank is an optional organ of the UFO organism. It is not merged into the life contract and remains independently replaceable/versioned.

## Upgrade policy
Core material contracts remain immutable/versioned. UFO organs are replaced through registry lineage, not by silently mutating historic bytecode. The life runtime is a versioned candidate; a V2 is a new deployment/version.

## Review gates
Before any production use:
1. exact-head Solidity compile PASS;
2. app/life unit tests PASS;
3. ship identity/controller tests PASS;
4. organ fail-closed tests PASS;
5. Product_06 remains lineage-compatible;
6. Codex/GM independent review;
7. explicit deployment authorization.
