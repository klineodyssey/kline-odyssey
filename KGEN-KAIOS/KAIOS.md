# KAIOS — Canonical Monetary Core

**Status:** KAIOS V1 is Mainnet live. V3 successor organs are implemented review candidates and are
not authorized for deployment. `KAIOS.sol` must remain identical to latest `main`.

This file is the canonical README for `KAIOS.sol`. It merges the latest Friction Mirror monetary core with the current 18911 -> 511111 -> KUFO architecture.

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

## 18888 Lingxiao Treasury

Every first-generation KAIOS mint is sent to the immutable 18888 Treasury address supplied at deployment. The production address should preferably be a stable Treasury proxy so the Treasury implementation can evolve while its public receiving address remains constant.

## 33333 Gold & Silver Island

`33333` is the semantic KAIOS deployment point. It is not the EVM contract address.

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

The furnace cannot burn more than the holder has explicitly approved. KAIOS contains no owner/admin confiscation burn path.

## Deployed V1 and V3 successor timing

The deployed old 18911 body uses 49 Epoch maturity. That is `DEPLOYED_V1_HISTORY`, not V3 successor
behavior, and it is not hard-coded into `KAIOS.sol`.

The V3 review candidate requires an exact KGEN/1000 direct contribution to an immutable catalyst
bank, then uses the existing five-argument KAIOS burn ABI and same-transaction 511111 release. Its
delivery delay is zero. The 130-human-day number applies only to a future contribution-credit route,
which remains `DESIGN_ONLY_DISABLED`.

## 511111 Qitian Dasheng Palace / Wormhole

`511111` is the future V3 same-transaction proof-consumption / wormhole boundary for KUFO. It is not deployed.

KAIOS does not mint KUFO. The 511111/KUFO protocol must independently verify that:

- the source Alchemy Proof exists;
- it came from the canonical KAIOS contract;
- it came through the official 18911 furnace;
- the V3 Furnace proof records an exact bank receipt and is consumed in the same transaction;
- the proof has not already been claimed;
- the KUFO output matches `1 KAIOS = 1,000 KUFO`.

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

`KAIOS.sol` permanently binds the canonical KGEN token, the first-generation
18888 settlement treasury and one `KAIOSOrganRegistry`. It does not permanently
bind a Furnace implementation. The registry bootstrap is configured once and
irreversibly sealed; later organ changes require the registry governance delay.

The implemented review-only organ chain is:

```text
KAIOSOrganRegistry
-> current KAIOSAlchemyFurnace (18911)
-> current KUFOClaimWormhole (511111)
-> current KSHIPConverter
-> current KAIOSPairRegistry
```

KUFO validates each claim against the immutable KAIOS burn record and the
originating Furnace proof. KSHIP validates each claim against the immutable
KUFO carrier burn record. Replacing an organ therefore cannot create token mass
without a real upstream holder-authorized burn.

## Required pre-deployment tests

1. Pin the exact OpenZeppelin Contracts version compatible with Solidity 0.8.24.
2. Verify the canonical KGEN production address and genesis supply.
3. Verify the 18888 Treasury proxy address.
4. Verify the old 18911 address, Organ Registry active body and successor predecessor binding.
5. Compile `KAIOS.sol`.
6. Test genesis KGEN supply => zero pending KAIOS.
7. Test 1 destroyed KGEN => exactly 1,000 KAIOS to 18888.
8. Test repeated settlement cannot double mint.
9. Test KGEN supply increase after settlement is rejected.
10. Test ordinary KAIOS transfers are 0% native tax.
11. Test non-18911 callers cannot invoke `burnForAlchemy()`.
12. Test V3 requires exact independent KAIOS and KGEN allowances.
13. Test V3 rejects an excess, deficient or fee-like allowance/receipt path atomically.
14. Test 1 KAIOS burn records expected 1,000 KUFO.
15. Test Alchemy Proof IDs are unique.
16. Test conservation invariant before and after alchemy burns.
17. Fuzz settlement and alchemy accounting.
18. Independently audit the KAIOS + 18911 + 511111/KUFO system before mainnet.
