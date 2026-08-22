# Whole-Life Circulation Candidate

Status: `REVIEW_ONLY_CANDIDATE`

This package is the candidate implementation boundary for per-Life KAIOS circulation. It does not replace `KGEN_TempleHeart_Upgradeable.sol`, does not deploy a keeper, does not hold private keys, and does not move assets.

## Package index

| Path | Purpose |
|---|---|
| `WHOLE_LIFE_CIRCULATION_RUNTIME_CANDIDATE.md` | Cumulative architecture, accounting, health, custody, and review gates |
| `schemas/life-circulatory-runtime.schema.json` | Recursively closed Organ, Blood Bank, Vessel, Pulse, ledger, and recovery schema |
| `runtime/life-circulatory-runtime.mjs` | Deterministic allocation, conservation, health, recovery, fractal coordinate, and persistent replay implementation |
| `examples/whole-life-circulation.candidate.json` | Ten-organ review fixture with separated KAIOS, native BNB, and WBNB ledgers |
| `tests/life-circulatory-runtime.test.mjs` | Boundary, replay, fuzz, invariant, health, custody, and conservation tests |
| `reports/WHOLE_LIFE_CIRCULATION_HANDOFF.md` | Exact implementation and independent-review handoff |

## Naming boundary

The existing Solidity `KAIOSOrganRegistry` is a timelocked registry of replaceable contract addresses. This package's Organ records are per-Life asset and health accounts. They are deliberately not named or represented as a replacement Solidity registry, and no second Runtime CURRENT is created.

No file in this package is Canonical, Production, deployed, or authorized to sign or broadcast a transaction.
