# KAIOS — Canonical Monetary Core

**Status:** MAINNET_GENESIS_LIVE on BNB Smart Chain Mainnet (Chain ID 56).

This file is the canonical README for `KAIOS.sol`. It records the live first-generation KAIOS monetary core and the current 18911 -> future 511111 -> KUFO architecture.

## Current Mainnet identity

```text
KAIOS Token Core
0xD4E67B3a69e41524c424150E6b6e921b01D036db

Network
BNB Smart Chain Mainnet

Chain ID
56

Genesis block
115637581

Genesis time
2026-08-13 13:05:37 UTC+8

Genesis evidence commit
2d6d152e0d3c885822745c43d4d96a0836bf4e0e
```

The full current address index is `KAIOS_MAINNET_GENESIS_ADDRESS_MANIFEST_CURRENT.md`.

Historical pre-Genesis statements such as `Review candidate`, `MAINNET_TRANSACTION = NOT_AUTHORIZED`, and `PREVIEW_NOT_FINAL` describe earlier review stages and do not override the later verified Genesis state.

## Canonical mass / denomination law

```text
1 KGEN  = 1 metric ton = 1,000 kg
1 KAIOS = 1 kg
1 KGEN  = 1,000 KAIOS
1 KAIOS = 1,000 KUFO
1 KUFO  = 1 g
```

KGEN genesis supply is `72,000,000 KGEN`, therefore the first-generation KAIOS ceiling is:

```text
72,000,000 × 1,000 = 72,000,000,000 KAIOS
```

The old `1 KGEN = 10,000 KAIOS` and `720,000,000,000 KAIOS` definitions are superseded and must not be treated as current.

## 0% native KAIOS tax

KAIOS has no native transfer tax, buy tax or sell tax. Normal ERC-20 transfers do not burn KAIOS and do not create KUFO.

## First-generation birth: 36000 White Hole

Canonical flow:

```text
KGEN market friction / canonical supply destruction
-> KGEN totalSupply() permanently falls
-> 36000 White Hole accounting boundary
-> KAIOS.settleWhiteHoleMass()
-> exactly 1,000 KAIOS per newly destroyed 1 KGEN
-> 18888 Lingxiao Treasury
```

The KAIOS contract does not accept a manually entered KGEN burn amount and does not use a `BURN_PROOF_MINTER_ROLE`.

It reads the canonical KGEN `totalSupply()` directly:

```text
actual KGEN destroyed = 72,000,000 KGEN - current KGEN totalSupply()
```

Only the not-yet-settled difference can be mirrored. The caller cannot choose the mint amount or the recipient.

The verified Genesis settlement recorded:

```text
KGEN supply at settlement
71,977,786.091069583125268765 KGEN

Recognized historical KGEN burn
22,213.908930416874731235 KGEN

Actual Genesis KAIOS
22,213,908.930416874731235 KAIOS

18888 KAIOS balance after Genesis
22,213,908.930416874731235 KAIOS
```

Genesis settlement transaction:
`0xc9fab344cc0055cab2e8dad1105f0a913fa94c15b39c76a241d3f190eb18767a`

## 18888 Lingxiao Treasury

Every first-generation KAIOS mint is sent to the immutable 18888 Treasury address supplied at deployment.

Current public 18888 Bank proxy:

```text
0x11d34c0F723aCd334B8F95076f73F07f06202aab
```

The proxy is the public bank endpoint; its implementation address must not be substituted as the public bank address.

## 33333 Gold & Silver Island

`33333` is the semantic KAIOS deployment point. It is not the EVM contract address.

Current KAIOS EVM address:

```text
0xD4E67B3a69e41524c424150E6b6e921b01D036db
```

## 18911 Taishang Laojun Alchemy Furnace

The old direct `enterChildUniverseWhiteHole()` player-burn interface is removed from the canonical KAIOS core.

The current official path is:

```text
holder owns KAIOS
-> holder explicitly approves 18911 furnace allowance
-> official 18911 furnace calls KAIOS.burnForAlchemy(...)
-> KAIOS is truly burned from parent totalSupply
-> KAIOS records a unique Alchemy Proof
-> expected child denomination = 1 KAIOS : 1,000 KUFO
```

Current deployed 18911 Furnace:

```text
0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1
```

The furnace cannot burn more than the holder has explicitly approved. KAIOS contains no owner/admin confiscation burn path.

## 49 Alchemy Epochs

The 49-Epoch maturation clock is **not** hard-coded into `KAIOS.sol`.

It belongs to the 18911 furnace/runtime so future time-scale rules can evolve without replacing the KAIOS monetary core.

Suggested state flow:

```text
BURNED -> REFINING -> MATURED -> CLAIMED
```

## 511111 Qitian Dasheng Palace / Wormhole

`511111` is the future matured-proof claim / wormhole boundary for KUFO.

As of the KAIOS Genesis evidence:

```text
511111 / KUFO = FUTURE_NOT_DEPLOYED
```

KAIOS does not mint KUFO. The future 511111/KUFO protocol must independently verify that:

- the source Alchemy Proof exists;
- it came from the canonical KAIOS contract;
- it came through the official 18911 furnace;
- the 49-Epoch maturation rules are satisfied;
- the proof has not already been claimed;
- the KUFO output matches `1 KAIOS = 1,000 KUFO`.

GitHub source existence for `KUFO.sol`, `KUFOClaimWormhole.sol`, `KSHIP.sol`, or `KSHIPConverter.sol` is not Mainnet deployment proof.

## Conservation invariant

The KAIOS core exposes:

```solidity
conservationInvariantHolds()
```

with the intended accounting relation:

```text
KAIOS totalSupply
+ cumulative KAIOS burned at 18911
= settled destroyed KGEN × 1,000
```

This distinguishes normal transfers/black-hole-classified balances from true supply destruction.

## Black-hole rule

A black hole is not automatically `address(0)` and not automatically a burn. Any nonzero address can be classified by the game/universe layer as a black-hole-like custody/trap address. Tokens at such an address remain part of ERC-20 `totalSupply()` unless the token contract actually burns them.

## No discretionary monetary authority

The canonical monetary core intentionally has:

```text
no owner mint
no admin mint
no arbitrary mint recipient
no BURN_PROOF_MINTER_ROLE
no blacklist
no sweep/confiscation function
no automatic tax burn
no generic public burn()
no direct child-token mint
```

## Deployment dependency note

`KAIOS.sol` permanently binds the canonical KGEN token, the first-generation 18888 settlement treasury and one `KAIOSOrganRegistry`. It does not permanently bind a Furnace implementation. The registry bootstrap is configured once and irreversibly sealed; later organ changes require the registry governance delay.

The deployed/current and future organ lineage is:

```text
KAIOSOrganRegistry                     DEPLOYED
-> current KAIOSAlchemyFurnace 18911  DEPLOYED
-> KUFOClaimWormhole 511111            FUTURE_NOT_DEPLOYED
-> KUFO                                FUTURE_NOT_DEPLOYED
-> KSHIPConverter                      SOURCE EXISTS / DEPLOYMENT NOT PROVEN BY GENESIS
-> KSHIP                               SOURCE EXISTS / DEPLOYMENT NOT PROVEN BY GENESIS
-> KAIOSPairRegistry                   FUTURE_NOT_DEPLOYED AT GENESIS
```

Future KUFO must validate each claim against the immutable KAIOS burn record and the originating Furnace proof. Future KSHIP must validate each claim against the immutable KUFO carrier burn record. Replacing an organ therefore must not create token lineage without a real upstream holder-authorized burn.

## Genesis validation record

The Genesis evidence records:

```text
chainId56 = PASS
first21Deployments = PASS
allExpectedAddresses = PASS
bank18888 = PASS
bank8888 = PASS
celestialSeat500 = PASS
settlement11520 = PASS
furnace18911 = PASS
governanceFinalization = PASS
kgenGenesisAccounting = PASS
kaiosGenesisAccounting = PASS
arbitraryMint = NONE
arbitraryDrain = BLOCKED
legacyHeartTouched = NO
57 / 57 Mainnet transactions = SUCCESS
```

The original pre-deployment compile/fuzz/invariant/security checklist remains historical evidence of the review process. Future 511111/KUFO/KSHIP deployment requires its own independent deployment authorization, receipts and evidence; the KAIOS Genesis record must not be rewritten to imply those future organs were already deployed.
