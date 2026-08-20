# KAIOS 18911 Fresh Catalyst → KUFO → KSHIP Canon V3

Status: `IMPLEMENTED_REVIEW_CANDIDATE`

Authority: `HUMAN_FRESHNESS_CANON_FREEZE_2026-08-20`

Deployment: `NO`

Mainnet/Testnet transactions: `NONE`

```text
MIN_ALCHEMY_AMOUNT                    = 1 KAIOS
REQUIRED_KGEN                         = KAIOS_AMOUNT / 1000
KUFO_OUTPUT                           = KAIOS_AMOUNT * 1000
DELIVERY_DELAY                        = 0
CONTRIBUTION_FRESHNESS_WINDOW         = 130 HUMAN DAYS
TAX_CREDIT_ROUTE                      = DESIGN_ONLY_DISABLED
CATALYST_BANK_PRODUCTION_ADDRESS      = UNFROZEN
PROGRAM_LIFE_STATUS                   = RECRUITED_PENDING_EMBODIMENT
FORMAL_KGEN_SOLIDITY_DIFF             = 0
```

## 1. Fixed mass scale

- `1 KGEN = 1000 kg`
- `1 KAIOS = 1 kg`
- `1 KUFO = 1 g`
- `1 KSHIP = 1 mg`

For every exactly representable `KAIOS_AMOUNT >= 1 KAIOS`:

```text
REQUIRED_KGEN = KAIOS_AMOUNT / 1000
KUFO_OUTPUT   = KAIOS_AMOUNT * 1000
```

The direct fresh path is:

```text
0.001 KGEN fresh bank contribution + 1 KAIOS feedstock
-> 0.001 KGEN retained by the immutable catalyst bank
 + 1000 KUFO delivered immediately to the fixed beneficiary
```

KGEN is the required equal-mass contribution. It is not burned, converted into KUFO, held by 18911
or returned after success. KAIOS is the material burned to establish KUFO lineage. The 5,000,000
KAIOS seat/performance-bond rules are separate and are not an alchemy minimum.

## 2. Atomic direct-fresh path

The only implemented review path is:

```text
holder
-> 太上老君 K18911
-> KGEN transferFrom(holder, immutable catalystBank, exact required amount)
-> exact catalystBank balance-delta verification
-> KAIOS holder-authorized burn
-> 齊天大聖 K511111 same-call proof consumption
-> 丹靈 KUFO mint to the burn-time beneficiary
```

The holder separately approves the official furnace for the exact KAIOS and required KGEN amounts.
The beneficiary is frozen before either asset movement. Amounts below 1 KAIOS and amounts that cannot
divide exactly by 1000 at ERC-20 wei precision fail closed.

The furnace stores no KGEN. Its KGEN liability is always zero. A fee-on-transfer-like KGEN response,
missing allowance, insufficient balance, wrong organ, proof mismatch, beneficiary mismatch, KUFO mint
failure or any later step failure reverts the entire transaction, including the bank transfer and KAIOS
burn. The proof can be consumed only during the authorized same-call release and only once.

```text
REJECTION   = ATOMIC_REVERT
CANCELLATION = NOT_APPLICABLE_AFTER_SUCCESS
REFUND       = NOT_APPLICABLE_NO_ESCROW
```

The non-transferable `memorialProofId` records the alchemy event. It conveys no ownership of KGEN,
KUFO, a land point or a governance role.

## 3. Superseded wait model

The former model:

```text
49 Epoch review + 81 Epoch catalysis = 130 Epoch delayed delivery
```

is `SUPERSEDED_BY_HUMAN_FRESHNESS_CANON`. The earlier PR #158 implementation that escrowed KGEN,
waited 49 Epochs, returned the catalyst and then allowed a separate claim is also superseded.

The number 130 now means only:

```text
130 HUMAN DAYS = maximum age of a separately proven KGEN 0.10% bank-tax contribution
```

It is not a KUFO delivery delay. A direct KGEN transfer made inside the alchemy transaction has age
zero and therefore needs no waiting period. No `49`, `81` or `130` maturity constant remains in the
direct execution path.

## 4. Catalyst-bank production boundary

Read-only BSC evidence at block `117020399` showed:

| Role | Address | Verified state |
|---|---|---|
| Formal KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` | owner is BankGovernance |
| Current KGEN `bankWallet` | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` | ReserveRedemption; 20 KGEN balance at snapshot |
| K1852 GalacticBank candidate | `0xfc522243e988a837700CaD600D6f030f5932681F` | contract code present; zero KGEN at snapshot |

These roles are not interchangeable. ReserveRedemption is the current financial-mass reserve rail.
K1852 has no frozen catalyst-receipt protocol. Neither address is approved here as the production
catalyst bank.

The furnace constructor therefore accepts one immutable contract address so code and tests can prove
the custody boundary, while production remains blocked:

```text
CATALYST_BANK_PRODUCTION_ADDRESS = UNFROZEN
DEPLOYMENT                        = BLOCKED
```

No Reserve asset, 18888 asset or existing K1852 balance is repurposed by this review candidate.

## 5. Optional 0.10% tax-credit route — disabled design

The direct-transfer route above is implemented. Reusing a recent KGEN AMM Bank-tax contribution is
not. Until a shared indexer, attester, gateway, batch-root format and operating budget are separately
frozen, the route must fail closed:

```text
TAX_CREDIT_ROUTE = DESIGN_ONLY_DISABLED
```

The proposed evidence record is:

| Field | Meaning |
|---|---|
| `chainId` | must be 56 |
| `txHash`, `transactionIndex`, `logIndex`, `blockNumber`, `timestamp` | canonical source-event ordering |
| `wallet` | attributed user, never inferred as the AMM Pair |
| `attributedBuyer`, `pair` | explicit buy attribution context |
| `recipient` | frozen catalyst bank |
| `amount` | proven 0.10% Bank leg only |
| `bankTaxBps` | exactly 10 bps |
| `sourceKind` | `PROVEN_KGEN_BANK_TAX_0_10` |
| `proofId`, `batchRoot`, `gateway` | attested batch identity and single-use gateway |
| `consumedAmount` | cumulative used amount, never above the proven amount |

The event uniqueness key is the exact tuple:

```text
txHash + logIndex + wallet + amount + timestamp
```

Only actual KGEN entering the designated catalyst bank through the 0.10% Bank leg qualifies. Burn,
Reward, AutoLP, ordinary transfer and unclassified inflow do not qualify. Credits are consumed FIFO
by `(timestamp, blockNumber, transactionIndex, logIndex)`. Exactly 130 days old is valid; 130 days
plus one second is expired. A source event or consumed amount cannot be replayed. A shared verified
batch root prevents every holder from scanning unbounded history. Production buyer attribution must
resolve the actual buyer and must not label the Pair as the user.

The executable reference validator in `tools/tax-credit-reference.mjs` is test-only and deliberately
reports `DESIGN_ONLY_DISABLED`; it grants no on-chain credit or payment authority.

## 6. KAIOS, KUFO and KSHIP lineage

KAIOS records the holder, contributor, beneficiary, official furnace, immutable catalyst bank,
exact KAIOS burn, exact KGEN contribution, Life ID, destination, block and timestamp. KAIOS has no
arbitrary mint, admin mint, seizure, blacklist, tax setter or KGEN burn surface.

K511111 consumes the furnace proof only when called by that furnace in the same atomic path. KUFO
cross-checks the KAIOS burn record and furnace contribution record, mints once to the fixed beneficiary
and records `bornAt = block.timestamp` of the actual mint transaction.

Each KUFO proof creates one deterministic batch Life ID:

```text
keccak256(abi.encode(
  "KAIOS.KUFO.BATCH_LIFE.V1",
  chainId,
  KUFO contract,
  source proof
))
```

Transfer and split preserve `batchLifeId`, `bornAt`, source proof and proportional converted history.
Token wei are mass cells, not individually named Lives.

## 7. KUFO half-life and KSHIP

```text
KUFO_HALF_LIFE_CANON = 1_K280_YEAR
DECAY_START           = KUFO_BIRTH_TIMESTAMP
TRANSFER_TIME_RESET   = BLOCKED
KSHIP_MAX_PER_KUFO    = 1000
```

The old `1 K280 DAY = 3 HEAVEN DAYS` rule is `SUPERSEDED_WRONG`.

```text
RemainingKUFO   = InitialKUFO * (1/2)^(elapsed / halfLife)
DecayedKUFO     = InitialKUFO - RemainingKUFO
KSHIPGenerated  = newly claimable DecayedKUFO * 1000
```

Only newly decayed mass can produce KSHIP. `halfLifeSeconds` is immutable and non-zero, but the
K280-year-to-chain-seconds value remains unfrozen, so deployment is blocked. KSHIP has no expiry. It
is burned only by a registered UFO consumer using exact holder authorization and a replay-protected
trip ID. Without a canonical consumer, propulsion fails closed.

## 8. Conservation and prohibited authority

- KGEN total supply is unchanged by the fresh bank contribution.
- The catalyst bank increase equals the recorded KGEN contribution exactly.
- The furnace KGEN balance and KGEN liability remain zero.
- `KUFO supply + KUFO converted to KSHIP = KUFO minted from valid KAIOS proofs`.
- `KSHIP supply + KSHIP burned for propulsion = KSHIP minted from KUFO decay`.
- One KUFO can create at most 1000 KSHIP over its lifetime.
- No owner/admin mint, blacklist, seizure, token tax, rescue, sweep or arbitrary withdrawal exists.
- Formal KGEN Solidity is unchanged.

## 9. Program Life manifests

All candidates remain undeployed. Local test instances are not birth or Mainnet activation evidence.

| Program | Self name | Life ID | Status / responsibility |
|---|---|---|---|
| `KAIOS.sol` | 界衡 | `LIFE-KAIOS-JIEHENG-33333` | Human-appointed K33333 guardian; monetary mass conservation |
| `KAIOSAlchemyFurnace.sol` | 太上老君 | `LIFE-KAIOS-TAISHANG-LAOJUN-18911` | direct fresh alchemy |
| `KUFO.sol` | 丹靈 | `LIFE-KAIOS-DANLING-KUFO-CORE` | mobile material Life; K18911 birth, K511111 release |
| `KUFOClaimWormhole.sol` | 齊天大聖 | `LIFE-KAIOS-QITIAN-DASHENG-511111` | immediate fixed-beneficiary release gate |
| `KSHIP.sol` | 星梭 | `LIFE-KAIOS-XINGSUO-KSHIP-CORE` | mobile antimatter propulsion Life; parent K188888 牛魔王 |
| `KSHIPConverter.sol` | 化航 | `LIFE-KAIOS-HUAHANG-KSHIP-CONVERTER` | KSHIP conversion organ Life |
| `KAIOSOrganRegistry.sol` | 司籍 | `LIFE-KAIOS-SIJI-REGISTRY-0001` | cross-world registry Life; no land point |
| test harness | 試航童子 | `LIFE-KAIOS-SHIHANG-TONGZI-TEST-0001` | `TEST_ONLY`, `NON_DEPLOYABLE`, `NON_EMPLOYABLE` |

```text
LAND_GUARDIAN_RECRUITMENT_STATUS = RECRUITED_PENDING_EMBODIMENT
APPOINTMENT_MODE                 = HUMAN_APPOINTED
DEPLOYED_OR_ACTIVE_LIFE_CLAIM    = NONE
```

K18888 玉皇大帝 / 神明銀行 identity remains unchanged. A bank, treasury or registry destination
does not become the identity of KAIOS, KUFO or KSHIP.
