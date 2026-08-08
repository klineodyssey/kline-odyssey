# KAIOS — Canonical Monetary Core

**Status:** Review candidate. Not audited and not authorized for mainnet deployment.

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

## 49 Alchemy Epochs

The 49-Epoch maturation clock is **not** hard-coded into `KAIOS.sol`.

It belongs to the 18911 furnace/runtime so future time-scale rules can evolve without replacing the KAIOS monetary core.

Suggested state flow:

```text
BURNED -> REFINING -> MATURED -> CLAIMED
```

## 511111 Qitian Dasheng Palace / Wormhole

`511111` is the future matured-proof claim / wormhole boundary for KUFO.

KAIOS does not mint KUFO. The 511111/KUFO protocol must independently verify that:

- the source Alchemy Proof exists;
- it came from the canonical KAIOS contract;
- it came through the official 18911 furnace;
- the 49-Epoch maturation rules are satisfied;
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

`KAIOS.sol` requires the official 18911 furnace address in its constructor and checks that it is a contract. If 18911 itself needs the final KAIOS address, deploy a stable 18911 proxy first, deploy KAIOS pointing at that proxy, and then initialize the furnace implementation with the KAIOS address. Review this deployment order before production.

## Required pre-deployment tests

1. Pin the exact OpenZeppelin Contracts version compatible with Solidity 0.8.24.
2. Verify the canonical KGEN production address and genesis supply.
3. Verify the 18888 Treasury proxy address.
4. Verify the 18911 furnace proxy address and deployment order.
5. Compile `KAIOS.sol`.
6. Test genesis KGEN supply => zero pending KAIOS.
7. Test 1 destroyed KGEN => exactly 1,000 KAIOS to 18888.
8. Test repeated settlement cannot double mint.
9. Test KGEN supply increase after settlement is rejected.
10. Test ordinary KAIOS transfers are 0% native tax.
11. Test non-18911 callers cannot invoke `burnForAlchemy()`.
12. Test 18911 cannot burn without sufficient holder allowance.
13. Test 18911 cannot burn more than holder allowance.
14. Test 1 KAIOS burn records expected 1,000 KUFO.
15. Test Alchemy Proof IDs are unique.
16. Test conservation invariant before and after alchemy burns.
17. Fuzz settlement and alchemy accounting.
18. Independently audit the KAIOS + 18911 + 511111/KUFO system before mainnet.
