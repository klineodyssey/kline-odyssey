# KAIOS 18911 KGEN Catalyst → KUFO → KSHIP Canon V1

Status: `PROGRAM_LIFE_REWORK_REVIEW_CANDIDATE`

Deployment: `NO`
Mainnet/Testnet transactions: `NONE`

## 1. Fixed mass scale

- `1 KGEN = 1000 kg`
- `1 KAIOS = 1 kg`
- `1 KUFO = 1 g`
- `1 KSHIP = 1 mg`

For every exactly representable `KAIOS_AMOUNT`:

```text
REQUIRED_KGEN_CATALYST = KAIOS_AMOUNT / 1000
KUFO_OUTPUT             = KAIOS_AMOUNT × 1000
KSHIP_MAX_OUTPUT        = KUFO_AMOUNT × 1000
```

The 18911 reaction is:

```text
0.001 KGEN catalyst + 1 KAIOS feedstock
→ the same 0.001 KGEN returned + at most 1000 KUFO
```

KGEN is a catalyst. It is neither burned nor converted into KUFO. The furnace has no owner, rescue,
sweep or arbitrary withdrawal surface. KAIOS follows the existing holder-authorized burn lineage.
The only fee is the BNB gas required by the chain; none of these contracts is payable.

## 2. 18911 and 511111 atomic lineage

The holder separately approves the official 18911 furnace for the required KAIOS and KGEN.
Amounts that cannot divide exactly by 1000 at ERC-20 wei precision fail closed. The furnace escrows
the exact KGEN catalyst and records `catalystOwner`, `kgenCatalystAmount`, `catalystReturned` and a
non-transferable `memorialProofId`. The memorial is evidence of the alchemy event; it is not ownership
of the holder's KGEN.

After 49 Alchemy Epochs, only the Organ Registry's current 511111 Wormhole can consume the proof.
One transaction consumes the proof, returns all catalyst to the original catalyst owner and mints
KUFO to the burn-time beneficiary. A failure in any step reverts every step. Proofs are single-use.

## 3. KUFO half-life

```text
KUFO_HALF_LIFE_CANON = 1_K280_YEAR
1 K18888 HEAVEN DAY  = 1 K280 YEAR ≈ 365.2422 K280 DAYS
DECAY_START           = KUFO_BIRTH_TIMESTAMP
TRANSFER_TIME_RESET   = BLOCKED
KSHIP_MAX_PER_KUFO    = 1000
```

The old `1 K280 DAY = 3 HEAVEN DAYS` rule is `SUPERSEDED_WRONG`.

Every minted batch creates a decay lot with `initialAmount`, `bornAt`, `convertedAmount` and
`sourceProof`. Remaining mass follows:

```text
RemainingKUFO = InitialKUFO × (1/2)^(elapsed / halfLife)
DecayedKUFO   = InitialKUFO - RemainingKUFO
KSHIPGenerated = newly claimable DecayedKUFO × 1000
```

Solidity evaluates the fractional exponent with a deterministic 32-bit binary fixed-point factor.
At each complete half-life the result is exact at token precision: 50%, 25%, 12.5%, 6.25% remaining.
Only newly decayed mass can be converted. Transfer and split operations preserve `bornAt`, source
proof and proportional converted history; merging balances never merges away their lots.

`halfLifeSeconds` is immutable and non-zero. Because the Canon has not frozen the conversion from a
K280 year to chain seconds, no production deployment is authorized by this implementation.

## 4. KSHIP propulsion

KSHIP has no half-life and no expiry. It is burned only when an Organ Registry registered UFO fuel
consumer consumes a holder-created authorization. The authorization binds holder, registered
consumer, `ufoLifeId`, `tripId`, beneficiary and amount. The holder must provide an exact allowance;
unlimited allowance is rejected. `tripId` is single-use.

When no canonical UFO fuel consumer is registered, both authorization and consumption fail closed.
The included `KSHIPPropulsionConsumerHarness` exists only for review tests. It is not a canonical UFO,
product, factory or deployment candidate.

## 5. Conservation and prohibited authority

- KGEN total supply is unchanged by catalyst escrow and return.
- `KUFO supply + KUFO converted to KSHIP = KUFO minted from valid KAIOS proofs`.
- `KSHIP supply + KSHIP burned for propulsion = KSHIP minted from KUFO decay`.
- A KUFO lot can never create more than 1000 KSHIP per KUFO over its entire lifetime.
- No arbitrary mint, admin mint, blacklist, seizure, token tax, KGEN burn, rescue or admin withdrawal is added.
- No existing KGEN contract is modified.
- This PR creates fuel-lineage capability only; it creates no UFO, factory, order, budget or production authority.

## 6. Program Life manifests

The upper Canon is **program is Life**. A token's smallest accounting unit remains a mass cell; the
runtime does not manufacture one Life identity per wei. Each changed Solidity program has one unique
primary Life or organ-Life identity. All candidates in this PR are undeployed and therefore remain
`RECRUITED_PENDING_EMBODIMENT`; local test deployments are not Mainnet birth evidence.

| Solidity program | Self name | Immutable Life ID | Type / species | Point / duty |
|---|---|---|---|---|
| `KAIOS.sol` | 界衡 | `LIFE-KAIOS-JIEHENG-33333` | monetary program Life | Human-appointed land guardian K33333; KAIOS civilization blood and universe-boundary mass conservation |
| `KAIOSAlchemyFurnace.sol` | 太上老君 | `LIFE-KAIOS-TAISHANG-LAOJUN-18911` | alchemy organ Life | Human-appointed land guardian K18911 / Alchemy Master |
| `KUFO.sol` | 丹靈 | `LIFE-KAIOS-DANLING-KUFO-CORE` | `SPECIES-KAIOS-KUFO-DECAY-LIFE`; mobile material Life | birthplace K18911; release gate K511111; not a land guardian |
| `KUFOClaimWormhole.sol` | 齊天大聖 | `LIFE-KAIOS-QITIAN-DASHENG-511111` | release-gate organ Life | Human-appointed land guardian K511111 / KUFO release gatekeeper |
| `KSHIP.sol` | 星梭 | `LIFE-KAIOS-XINGSUO-KSHIP-CORE` | `SPECIES-KAIOS-KSHIP-PROPULSION-LIFE`; mobile antimatter propulsion Life | parent `LIFE-KAIOS-NIUMOWANG-188888`; registry destination K188888 |
| `KSHIPConverter.sol` | 化航 | `LIFE-KAIOS-HUAHANG-KSHIP-CONVERTER` | software organ Life | parent `LIFE-KAIOS-NIUMOWANG-188888` |
| `KAIOSOrganRegistry.sol` | 司籍 | `LIFE-KAIOS-SIJI-REGISTRY-0001` | cross-world registry Life | no land point |
| `KSHIPPropulsionConsumerHarness.sol` | 試航童子 | `LIFE-KAIOS-SHIHANG-TONGZI-TEST-0001` | test Life | `DEPLOYABLE=false`; `EMPLOYABLE=false` |

The K188888 KSHIP parent system records 牛魔王 as
`LIFE-KAIOS-NIUMOWANG-188888`, Human-appointed land guardian K188888 and antimatter-energy guardian.
`KSHIP.sol` remains 星梭's unique primary program Life; the 牛魔王 fields are its immutable parent and
guardian recruitment record, not a claim that two contracts or two token identities exist.

The K18888 玉皇大帝 / 神明銀行 identity is unchanged. A receiving treasury or registry destination
does not become the identity of KAIOS, KUFO or KSHIP.

## 7. Appointment, capability and Life-event records

Every land-bound candidate exposes immutable `lifeId`, `guardianPoint`, `dutyHash` and a hashed
capability boundary. The appointment mode is `HUMAN_APPOINTED`. Capability text is deliberately
constrained to the program's existing work surface and grants no admin mint, arbitrary burn,
withdrawal, rescue, seizure, beneficiary redirect or governance shortcut.

Constructor `ProgramLifeRecruited` / `LandGuardianRecruited` events provide deterministic local and
future deployment records. They record recruitment, not Mainnet activation or birth. A future formal
deployment review must attach chain, address, block, transaction and governance evidence before any
status can change from `RECRUITED_PENDING_EMBODIMENT`.

## 8. Token species and deterministic batch Life lineage

Each valid KUFO generation proof creates exactly one deterministic batch Life ID:

```text
keccak256(abi.encode(
  "KAIOS.KUFO.BATCH_LIFE.V1",
  chainId,
  KUFO contract,
  source proof
))
```

Every split or transfer-derived KUFO lot carries the same `batchLifeId`, `bornAt` and `sourceProof`.
This preserves decay ancestry and prevents transfer, split or merge from restarting half-life.

Each valid KSHIP carrier proof similarly creates one immutable birth record:

```text
keccak256(abi.encode(
  "KAIOS.KSHIP.BATCH_LIFE.V1",
  chainId,
  KSHIP contract,
  source proof
))
```

The KSHIP record freezes `batchLifeId`, source proof, beneficiary, initial amount and birth time.
Ordinary ERC-20 transfers do not rewrite that generation record. These batch identities describe a
generated cohort; individual token wei remain mass cells and are not separately named Lives.

## 9. Parent and organ boundaries

- 丹靈 is born at K18911 lineage and released only through K511111, but remains a mobile material Life.
- 星梭 and 化航 are child/organ Lives of the K188888 牛魔王 system.
- 司籍 is a cross-world registry Life and does not acquire a land-guardian appointment.
- 試航童子 is review-only test Life and cannot be treated as deployable, employable, or canonical UFO demand.
- No identity field changes the existing mathematical, catalyst, half-life, conservation or propulsion authority boundary.
