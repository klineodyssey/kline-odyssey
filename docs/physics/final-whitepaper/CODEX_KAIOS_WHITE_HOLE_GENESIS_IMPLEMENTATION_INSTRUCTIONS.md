# CODEX — KAIOS White Hole Genesis Implementation Instructions

**INTERNAL VERSION:** V2.0 MASS-RECONCILED FRICTION-MIRROR EDITION
**STATUS:** CURRENT IMPLEMENTATION INSTRUCTION
**TARGET:** BNB Chain / Solidity 0.8.24
**SOURCE OF TRUTH:** `KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md` + `KAIOS_FrictionMirror_Multiverse_README.md`

## 0. Fixed Canon

```text
1 KGEN = 1 metric ton = 1,000 kg
1 KAIOS = 1 kg
1 permanently destroyed KGEN = 1,000 KAIOS
KGEN genesis supply = 72,000,000 KGEN
KAIOS first-generation ceiling = 72,000,000,000 KAIOS
33333 = Gold & Silver Island / KAIOS token deployment point
36000 = White Hole
18888 = Lingxiao Celestial Bank / first-generation settlement destination
```

33333 is a universe point identity, not an EVM wallet or Treasury. The deployed KAIOS contract receives its own `0x...` address.

## 1. Friction Mirror — No Manual Burn Amount

Do not implement a user-supplied `convertToKAIOS(kgenAmount, recipient, ...)` mint path for first-generation settlement. The canonical KAIOS contract reads the formal KGEN `totalSupply()` and recognizes only the not-yet-settled permanent supply reduction.

```text
historicalBurn = 72,000,000 KGEN - KGEN.totalSupply()
unsettledBurn = historicalBurn - alreadyRecognizedBurn
newKAIOS = unsettledBurn × 1,000
recipient = immutable 18888 Bank Proxy
```

Anyone may trigger `settleWhiteHoleMass()`, but the caller cannot choose burn amount, mint amount, or recipient. Repeated settlement with no new KGEN destruction must mint nothing / revert according to the canonical contract.

## 2. No Guaranteed Reverse Redemption

`1 KGEN → 1,000 KAIOS` is a one-way creation ratio, not a guaranteed market peg. Do not implement an official `1,000 KAIOS → 1 KGEN` redemption promise. Reverse exchange, if available, occurs through disclosed market liquidity at the prevailing price.

## 3. Mainnet Genesis

The first settlement must recognize all historical KGEN supply destruction from the 72,000,000 genesis supply up to the actual settlement block. Do not hardcode a chat-time preview amount. Use integer base units / BigInt only; no JavaScript floating point.

After the transaction, generate a machine-readable and human-readable genesis record from actual receipt/state values, including KGEN supply at settlement, recognized burn, actual KAIOS minted, 18888 balance delta, KAIOS totalSupply delta, transaction hash, block, timestamp, chainId, and contract addresses.

## 4. Required Security Gates

- no discretionary owner/admin mint
- no caller-chosen mint recipient
- no caller-supplied KGEN burn amount
- no duplicate historical settlement
- exact `1 KGEN burned = 1,000 KAIOS`
- theoretical max `72,000,000,000 KAIOS`
- 33333 remains point identity, not wallet
- 18888 is settlement destination
- 36000 is White Hole point
- KAIOS native transfer/buy/sell tax remains 0% unless a later Human Canon explicitly changes it

## 5. Separate Conversion Lines

Do not confuse KGEN→KAIOS with KAIOS→KUFO. The currently defined alchemy line is separate:

```text
1 KAIOS burn → expected 1,000 KUFO
```

Changing the KGEN→KAIOS ratio must not modify `KUFO_PER_KAIOS = 1_000`.

## 6. Required Tests

```text
1 KGEN destroyed → 1,000 KAIOS
0.5 KGEN destroyed → 500 KAIOS
no new KGEN destruction → no duplicate KAIOS
72,000,000 KGEN theoretical destruction → max 72,000,000,000 KAIOS
first-generation recipient → formal 18888 Proxy only
caller cannot redirect mint
caller cannot supply mint amount
```

Run compile, unit, integration, fuzz/invariant, lineage, storage where applicable, EIP-170 where applicable, secret scan, and `git diff --check` before any Mainnet authorization.

**MAINNET TRANSACTION:** NOT AUTHORIZED BY THIS FILE.
