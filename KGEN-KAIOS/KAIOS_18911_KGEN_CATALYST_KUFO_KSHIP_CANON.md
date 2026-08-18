# KAIOS 18911 KGEN Catalyst → KUFO → KSHIP Canon V1

Status: `IMPLEMENTED_REVIEW_CANDIDATE`

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
