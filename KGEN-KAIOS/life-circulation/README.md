# Whole-Life Circulation Candidate

Status: `REVIEW_ONLY_CANDIDATE`

This package is the candidate implementation boundary for per-Life KAIOS circulation. It does not replace `KGEN_TempleHeart_Upgradeable.sol`, does not deploy a keeper, does not hold private keys, and does not move assets.

## Package index

| Path | Purpose |
|---|---|
| `KGEN-KAIOS/life-circulation/WHOLE_LIFE_CIRCULATION_RUNTIME_CANDIDATE.md` | Cumulative architecture, accounting, health, custody, and review gates |
| `KGEN-KAIOS/life-circulation/schemas/life-circulatory-runtime.schema.json` | Recursively closed Organ, Blood Bank, Vessel, Pulse, ledger, and recovery schema |
| `KGEN-KAIOS/life-circulation/runtime/life-circulatory-runtime.mjs` | Deterministic allocation, conservation, health, recovery, fractal coordinate, and persistent replay implementation |
| `KGEN-KAIOS/life-circulation/runtime/b4-micro-circulation-adapter.mjs` | Exact B4 label-to-coordinate distance, Heart eligibility, meal, movement/fare, PR #169 market, food/waste, and purpose-ledger adapter |
| `KGEN-KAIOS/life-circulation/runtime/life-transaction-gate.mjs` | Fail-closed Life intent, policy, durable replay reservation, and canonical receipt gate; contains no signer or broadcaster |
| `KGEN-KAIOS/life-circulation/policies/hengyao-life-transaction-policy.candidate.json` | Machine-readable four-method K12345 allowlist; current authority remains A1 and inactive |
| `KGEN-KAIOS/life-circulation/examples/whole-life-circulation.candidate.json` | Ten-organ review fixture with separated KAIOS, native BNB, and WBNB ledgers |
| `KGEN-KAIOS/life-circulation/examples/hengyao-b4-micro-circulation.candidate.json` | Hash-bound 2026-08-24 read-only evidence snapshot; no transaction, movement, trade, or payment is represented as completed |
| `KGEN-KAIOS/life-circulation/tests/life-circulatory-runtime.test.mjs` | Boundary, replay, fuzz, invariant, health, custody, and conservation tests |
| `KGEN-KAIOS/life-circulation/tests/b4-micro-circulation.test.mjs` | Exact-distance, policy, return-reserve, CT, custody, food/waste, purpose-ledger, schema, and UI tests |
| `KGEN-KAIOS/life-circulation/schemas/b4-micro-circulation.schema.json` | Recursively closed schema for the B4 mission evidence packet |
| `KGEN-KAIOS/life-circulation/schemas/life-transaction-policy.schema.json` | Recursively closed policy schema with explicit activation and private-key boundaries |
| `KGEN-KAIOS/life-circulation/review/b4-micro-circulation-review.html` | Static review-only status surface with no signer or transaction control |
| `KGEN-KAIOS/life-circulation/reports/WHOLE_LIFE_CIRCULATION_HANDOFF.md` | Exact implementation and independent-review handoff |
| `KGEN-KAIOS/life-circulation/reports/B4_MICRO_CIRCULATION_HANDOFF.md` | Durable canon-composition, live-read evidence, blocker, PR #169 compatibility, and mission-resume handoff |
| `KGEN-KAIOS/life-circulation/reports/SECURE_TRANSACTION_AND_REVIEWER_GATE_HANDOFF.md` | Reviewer workforce audit, minimal governance decision, transaction-gate boundary, and activation status |
| `KGEN-KAIOS/life-circulation/tests/life-transaction-gate.test.mjs` | Allowlist, authority, replay, receipt, finality, custody, and secret-boundary tests |

## Naming boundary

The existing Solidity `KAIOSOrganRegistry` is a timelocked registry of replaceable contract addresses. This package's Organ records are per-Life asset and health accounts. They are deliberately not named or represented as a replacement Solidity registry, and no second Runtime CURRENT is created.

No file in this package is Canonical, Production, deployed, or authorized to sign or broadcast a transaction.

The transaction gate prepares and reserves a strictly allowlisted intent for an
external secure signer only after a separately approved trusted-context adapter
proves A2 authority. No such adapter is included here. The committed policy
records the current truth—A1, not authorized, signer disconnected—and therefore
rejects caller-provided approval labels and cannot itself grant chain-write
power.

The B4 adapter composes the existing CURRENT signed-universe floor and K-index
linear scale with Human-frozen `label × 10^-8` mission coordinates. It does not
rewrite Physics CURRENT, create a second Universe Runtime, mutate the canonical
Life location, or claim that a digital folder body is a real-world humanoid.
