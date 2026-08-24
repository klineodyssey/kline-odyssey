# B4 Micro-Circulation Durable Handoff

- **Protocol:** `KAIOS_B4_MICRO_DISTANCE_CANON_RESOLUTION_AND_MISSION_RESUME_V1`
- **Implementer:** `codex-gm-01` / 衡曜
- **Execution base:** `f53c7d6729cf90f0ee18f6bcaf76d15ce6b3dfb5`
- **Status:** `ENGINEERING_CANDIDATE_COMPLETE_LIVE_MISSION_HARD_BLOCKED`
**Independent review:** `REQUIRED`

## Authority and truth boundary

The Human decision freezes this mission's label scale. The implementation is a
review-only adapter inside the existing Whole-Life Circulation package. It does
not change Physics CURRENT, deploy a contract, connect a signer, transfer an
asset, write chain state, change a canonical location, or clock in a Life.

`DIGITAL_FOLDER_BODY_CANDIDATE` means code/folder evidence inside this candidate.
It does not claim a real-world robot or biological body. A route plan is not an
arrival. A gas estimate is not a transaction. A calculated allowance or fare is
not a payment. Paper-market state is not asset settlement.

## Distance resolution

| Field | Frozen result |
|---|---|
| Start label / x | `12345` / `0.00012345` |
| Destination label / x | `11520` / `0.00011520` |
| Floor | `k = -4` for both endpoints |
| Label scale | `10^-8` |
| Label difference | `825` label units, not physical K |
| Physical difference | `0.00000825 K` |
| CURRENT K scale | `22761.72430127901 m/K` |
| One B4 land grain | `0.0001 K = 2.276172430127901 m` |
| One-way distance | `0.187784225485552 m` |
| Round trip | `0.375568450971104 m` |

The composition uses CURRENT Parts 60, 61, and 63 plus the Human-frozen label
mapping. No second Universe Runtime or parallel CURRENT is introduced.

## 2026-08-24 read-only chain evidence

Two independent BSC RPC providers agreed on the public wallet balances and
TempleHeart configuration around block `117720719`:

- wallet `0x4DF6E9629Dad1072103cFd2bC81845fd97429214`;
- native BNB `0.00799020555`;
- KGEN `0` and KAIOS `0`;
- TempleHeart balance `821 KGEN`;
- Heartbeat reward `1 KGEN`, estimate `PASS`, gas estimate `103989`;
- deployed Fortune range `1–888 KGEN`, minimum-1 estimate `PASS`, gas estimate
  `118678`;
- free Wish estimate `PASS`, gas estimate `23659`.

The deployed Fortune configuration is historical chain fact and is not
misrepresented as the PR #165 candidate rule. The candidate range is `1–8 KGEN`
and requires a pre-existing `1 KGEN` wallet pass. Because this wallet has zero
KGEN, candidate Fortune is `BLOCKED_POLICY`. Heartbeat and Wish are estimated
eligible but `ELIGIBLE_BUT_SECURE_SIGNER_NOT_CONNECTED`. No write was attempted
and every transaction hash is `null`.

The repository's Hengyao authority projection is read-only, and no authorized
personal Heart signer or transaction adapter was found. A private Digital Ant
scheduler is scoped to Digital Ant and cannot be repurposed for Hengyao.

## Life, meal, movement, and market result

- No confirmed Wish exists in this run. `1 KGEN → 500 KAIOS` is therefore only
  a Human-rule calculation. Actual allowance and consumption are zero because
  there is no authorized settlement Runtime or frozen metabolism formula.
- Movement requires complete body/mass, acceleration, time, energy, fuel, fare,
  return reserve, and route evidence. Those values and real KGEN are absent.
  Arrival and position mutation remain false; canonical end location remains
  `P_4168p0_奈何橋_R18`.
- PR #169 exact head `0a50ec047713c1f7fa88ca627d8835c810c184c8`
  is the latest native 11520 candidate found. It is Draft, paper/in-memory,
  settlement-free, and was 29 commits behind main at observation. A clean
  no-commit merge simulation against the execution base produced tree
  `898c227d584aac1d48736748bb79455e35801b8a`; its focused tests passed
  `253/253`. This is compatibility evidence, not a write to PR #169 and not
  reusable exact-head CI.
- Best Buy, Best Sell, and CT are all `null`; there is no verified counterparty,
  no fruit trade, no settlement, no food input, no waste input, no recycling
  revenue, and no `vowTo` call.
- MEAL/KAIOS, MICRO_UNIVERSE_TRANSPORT/KGEN, and FRUIT/KGEN are separate ledgers
  to `0xB73D6716005B37BEC742D64482fA26033eE1A4E1`. All actual totals are zero and
  status is `NO_PAYMENT_SENT`.

## Implemented files

| Path | Evidence purpose |
|---|---|
| `runtime/b4-micro-circulation-adapter.mjs` | Exact decimal distance and fail-closed mission functions |
| `schemas/b4-micro-circulation.schema.json` | Recursive `additionalProperties=false` evidence contract |
| `examples/hengyao-b4-micro-circulation.candidate.json` | Hash-bound live-read snapshot |
| `tests/b4-micro-circulation.test.mjs` | Distance, authority, custody, conservation, CT, return, and UI regressions |
| `review/b4-micro-circulation-review.html` | Review-only status UI without wallet controls |

The public-good validator does not accept a caller-supplied `receiptStatus=true`
shortcut. A confirmed entry must match the canonical token registry, raw
transaction, successful receipt, exact ERC-20 Transfer log (or native value),
canonical block hash, minimum confirmations, and provider/evidence IDs. Missing
or inconsistent fields fail closed and leave actual totals at zero.

## Blocker disposition

Auto-resolved engineering blockers:

- `CANON_DISTANCE_UNIT_CONFLICT`;
- `MICRO_DISTANCE_RUNTIME_MISSING`;
- `PR169_MAIN_SYNC_COMPATIBILITY_UNKNOWN`;
- `PURPOSE_LEDGER_MISSING`;
- `FOOD_WASTE_CONSERVATION_VALIDATOR_MISSING`.

Live hard blockers:

- `PRIVATE_KEY_NOT_AUTHORIZED` — no authorized personal signer/connector;
- `REAL_ASSET_INSUFFICIENT` — wallet KGEN and KAIOS are zero;
- `HUMAN_GOVERNANCE_REQUIRED` — metabolism, meal settlement, energy-to-fuel,
  fare, market settlement, and position authority are not frozen/active.

Consequently `ARRIVED_11520 = NO`, `RETURN_STATUS = NOT_STARTED`, and
`GM_CLOCK_IN = NO`. These are intentional fail-closed results, not incomplete
engineering claims.

## Exact-head review instruction

Use the current Draft PR #165 head shown by GitHub, not any historical handoff
SHA. Require the exact-head workflow to parse both schemas/examples, run all
Whole-Life tests, Solidity ABI/storage/EIP-170/fuzz/invariant/secret checks, root
regressions, and `git diff --check`. The workflow artifact is the only reusable
head-bound evidence. Merge, deployment, payment, governance execution, token
transfer, Mainnet transaction, and private-key output remain prohibited.
