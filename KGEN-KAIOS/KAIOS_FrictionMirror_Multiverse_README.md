# KAIOS Friction Mirror Multiverse - CURRENT

**Authority:** Human Final Canon, 2026-08-09
**Status:** SINGLE SOURCE OF TRUTH
**Deployment:** Mainnet transaction not authorized

## Mass and denomination law

```text
1 KGEN  = 1 metric ton = 1,000 kg
1 KAIOS = 1 kg
1 actually and permanently burned KGEN = 1,000 KAIOS
1 KAIOS = 1,000 KUFO
1 KUFO  = 1 gram
```

KGEN Genesis Supply is `72,000,000 KGEN`. The theoretical first-generation
maximum is exactly `72,000,000,000 KAIOS`.

Earlier `1:10,000` and `720,000,000,000 KAIOS` definitions are superseded.
They are not valid inputs for contracts, tests, deployment tooling, Current
Runtime, or AI decisions.

## Friction Mirror

KAIOS minting observes actual canonical KGEN supply destruction. No Human,
administrator, oracle, verifier, signer, or script supplies the burned amount.

```text
historicalBurn = 72,000,000 KGEN - KGEN.totalSupply()
newlySettledBurn = historicalBurn - KAIOS.settledKgenBurned()
KAIOS minted = newlySettledBurn * 1,000
```

All calculations use `uint256` or JavaScript `BigInt` with 18 decimals. JS
floating-point arithmetic is forbidden. Settlement is monotonic and replay
safe; a call with no new KGEN destruction must not mint again.

## Point identities and addresses

- `36000` = White Hole. It recognizes real canonical KGEN `totalSupply()` reduction.
- `33333` = Gold & Silver Island, the KAIOS token deployment point and universe-point identity.
- `18888` = Lingxiao Celestial Bank, the first-generation KAIOS settlement bank.

Point IDs are not wallets, EOAs, treasuries, recipients, or EVM addresses.
Formal token and Bank proxy addresses exist only after deployment as `0x...`.

```text
real KGEN supply destruction
-> 36000 White Hole
-> KAIOS token born at point 33333
-> KAIOS.settleWhiteHoleMass()
-> _mint(formal18888Proxy, newlySettledBurn * 1,000)
```

There is no `33333 wallet -> 18888 transfer` step.

## 18888 bank boundary

18888 is a liquid civilization bank, not a permanently locked vault. It may
pay lawful 500 Celestial Seat salaries and approved civilization funding under
auditable bank rules. It must not expose an unrestricted owner withdrawal,
sweep, player `transferFrom`, clawback, freeze, blacklist, or confiscation path.

V2 separates the seat/payroll decision from custody. A payment needs a proposer,
a different approver, a one-hour technical delay, a fixed beneficiary and amount,
a purpose hash, and beneficiary claim. Default Admin has no direct transfer method.

## Organ boundaries

- `8888` = Gao Lao Zhuang People's Bank prototype for daily people/company
  accounts and internal payroll ledgers; not 18888 and not a licensed production bank.
- `8895` = Yunzhang Cave shadow-bank/real-economy underwriting concept using its
  own capital and risk; it cannot alter genesis scale, use 8888 deposits, or demand
  unconditional 18888 rescue.
- `11520` = Universe Exchange and life/civilization admission, listing, market,
  and exchange gateway.
- `12345` = TempleHeart civilization/financial heart and Temple interaction organ;
  it is not the formal salary treasury.
- `16888` = Moon/Guanghan celestial point and independent lunar life/land domain.
- `33333` = KAIOS Gold & Silver Island token deployment point only.
- `36000` = White Hole actual KGEN-destruction observation boundary.
- `18888` = Lingxiao Celestial Bank and KAIOS settlement bank.

No new function is assigned to an organ merely because an older document used
the same number. Unresolved future services remain unset until Human Canon.

## Alchemy lineage

18911 performs holder-authorized KAIOS burn/alchemy. KAIOS stores the immutable
Alchemy Burn Record used by downstream proof consumers. The separate conversion
is unchanged: `1 KAIOS -> 1,000 KUFO`.

Correcting KGEN-to-KAIOS must never change `KUFO_PER_KAIOS = 1_000`.

## Genesis inscription

```text
NO KGEN BURN, NO KAIOS MINT.
ONE BURNED KGEN CREATES ONE THOUSAND KAIOS.
NO DISCRETIONARY MINTING.
CIVILIZATION MASS SHALL BE CONSERVED.
```

The official Mainnet Genesis amount is generated from chain state after the
settlement transaction. It is never copied from chat or entered manually.
