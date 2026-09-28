# KGEN CoinMarketCap Circulating Supply Verification

Status: `CURRENT_API_WITH_APPEND_ONLY_HISTORICAL_SUBMISSION_EVIDENCE`

Contract: `0xba3d3810e58735cb6813bc1cdc5458c0d71432be`

Network: `BNB Smart Chain`

Decimals: `18`

## Public APIs

- Total Supply:
  https://klineodyssey.github.io/kline-odyssey/api/kgen/total-supply.txt
- Circulating Supply:
  https://klineodyssey.github.io/kline-odyssey/api/kgen/circulating-supply.txt

Each endpoint contains one plain base-10 number only. Neither endpoint returns
JSON, labels, markup, or wallet data.

The original extensionless routes remain deployed for backward compatibility.
The `.txt` routes are the canonical CoinMarketCap endpoints because GitHub Pages
serves them with a plain-text Content-Type.

## Current read-only supply state — 2026-08-27

The API endpoints and `kgen_cmc_supply_snapshot.json` were refreshed from a
single frozen BSC block. The July Annex A, XLSX, CSV and emission package below
remain immutable historical submission evidence; they are not silently
rewritten to impersonate a current external-platform filing.

| Field | Value |
|---|---:|
| BSC block | `118355844` |
| Block timestamp | `2026-08-27T08:59:50Z` |
| Nominal maximum supply | `72,000,000 KGEN` |
| Current totalSupply, net of burns | `71,976,169.974243092224959062 KGEN` |
| Verifiably burned | `23,830.025756907775040938 KGEN` |
| Excluded current balances | `67,622,278.423930992599787732 KGEN` |
| Evidence-based circulating supply | `4,353,891.550312099625171330 KGEN` |
| Current owner | `0xa2792fbdcc8a8aac364053431d44e0a8d335e166` (`BankGovernance`) |
| Deployment creator/indexer provenance | `0xb3c54ca96de0ded4ca0151f629ff9781506ba261` |
| Current bankWallet | `0xa06ef53c9ad4af739fd13ca1ded446437134b0ee` |
| Historical bank reserve | `0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c` |

The current owner and deployment creator are intentionally distinct fields.
The historical bank reserve remains excluded from circulating supply even
after `bankWallet()` changed; an address-role change does not make retained
reserve assets public circulation.

## Historical frozen submission snapshot — 2026-07-28

| Field | Value |
|---|---:|
| BSC block | `112570686` |
| Block hash | `0x0f2c4a7d148cf7737535c6e8113ea97857991041728ec86bec76d781e870532d` |
| Block timestamp | `2026-07-28T05:32:49Z` |
| Holder count | `88` |
| Major-holder threshold | `>= 1% of totalSupply` |
| Nominal maximum supply | `72,000,000 KGEN` |
| Current totalSupply, net of burns | `71,980,505.786117825703641 KGEN` |
| Verifiably burned | `19,494.213882174296359 KGEN` |
| Excluded current balances | `67,613,626.800181525642423578 KGEN` |
| Evidence-based circulating supply | `4,366,878.985936300061217422 KGEN` |

The raw values, role addresses, integrity digest, and machine-readable evidence
are in
[`kgen_cmc_supply_snapshot.json`](./kgen_cmc_supply_snapshot.json).

## Method

CoinMarketCap describes circulating supply as the best approximation of assets
in the general public's hands and generally excludes locked, insider,
team/foundation, treasury, escrow, and other non-public allocations. This
snapshot therefore uses:

`circulating_supply = total_supply - excluded_current_balances`

Source:
[CoinMarketCap Supply Methodology](https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max).

The holder index identifies the current ranked addresses. Every listed balance
below was then read again from the KGEN contract with `balanceOf` at the single
frozen block above. The current contract roles were independently read with
`owner`, `bankWallet`, `rewardWallet`, and `autoLPWallet`.

Ownership-unverified addresses remain circulating unless affirmative evidence
shows project control, a lock, vesting, treasury or reserve custody, or another
non-circulating condition. Lack of ownership evidence alone is not evidence for
exclusion. Tokens in the public PancakeSwap pair are included because they are
available to the public market; ownership of the LP tokens is a separate
question from the KGEN balance held by the pair.

## Major Holders

| Address | Balance KGEN | Classification | Circulating | Evidence and reason |
|---|---:|---|---|---|
| `0xb3c54ca96de0ded4ca0151f629ff9781506ba261` | `41,775,638.372417177049704684` | `FOUNDER_OR_TEAM_CONTROLLED` | No | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xb3c54ca96de0ded4ca0151f629ff9781506ba261); current owner and original mint recipient |
| `0xe87f6975fa3d4f3d56dce49fc978884285a3ed85` | `7,808,747.106941087148180620` | `TREASURY` | No | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xe87f6975fa3d4f3d56dce49fc978884285a3ed85); current `autoLPWallet` |
| `0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c` | `7,219,494.213882174296359000` | `BANK` | No | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c); current `bankWallet` |
| `0x0fd21cf643211d067a18a416da219827da26e288` | `7,209,747.106941087148179274` | `REWARD` | No | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0x0fd21cf643211d067a18a416da219827da26e288); current `rewardWallet` |
| `0xcd60bf474e691f2484950a0276eaf507616ca4b9` | `3,600,000.000000000000000000` | `FOUNDER_OR_TEAM_CONTROLLED` | No | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xcd60bf474e691f2484950a0276eaf507616ca4b9); repository runtime records identify it as `MOTHER` |
| `0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2` | `1,060,310.050838289978556142` | `LIQUIDITY_POOL` | Yes | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2); canonical PancakeSwap V2 pair |
| `0xb73d6716005b37bec742d64482fa26033ee1a4e1` | `735,378.467588936466040620` | `PUBLIC_CIRCULATING` | Yes | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xb73d6716005b37bec742d64482fa26033ee1a4e1); `OWNERSHIP_UNVERIFIED`; no evidence of project control, lock, vesting or non-circulation |
| `0xef83804c264b47378fcf150086943b53fb90a90b` | `734,989.145708089993065291` | `PUBLIC_CIRCULATING` | Yes | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xef83804c264b47378fcf150086943b53fb90a90b); `OWNERSHIP_UNVERIFIED`; no evidence of project control, lock, vesting or non-circulation |

The ranked source extended below 1%, so all holders meeting the declared
major-holder threshold are included.

## Other Classifications

| Address | Balance KGEN | Classification | Treatment |
|---|---:|---|---|
| `0x0000000000000000000000000000000000000000` | `0` | `BURN_ADDRESS` | Burns reduce `totalSupply`; the burned amount is outside current balances and is not subtracted twice |
| KGEN token contract | `0` | `CONTRACT_HELD` | Non-circulating if a future snapshot is non-zero |

No separately evidenced `LOCKED` KGEN holder was present among major holders.
The PancakeSwap LP tokens are reported as locked by the holder index, but the
KGEN inside the public pair remains market liquidity.

## CoinGecko Vested/Locked Wallet Submission Package

Only the five evidenced project-controlled non-circulating wallets below belong
in the submission package. `Lock Status` remains `NOT_EVIDENCED`; the package
does not misrepresent project control as an on-chain time lock. No scheduled
unlock has been established. CoinGecko's
[Supply Update Form guide](https://support.coingecko.com/hc/en-us/articles/32227012396441-Guide-How-to-Use-the-CoinGecko-Supply-Update-Form)
uses this field for locked, vested, foundation, treasury, and team allocations.

| Address | Label | Balance KGEN | Classification | Unlock Date | Evidence |
|---|---|---:|---|---|---|
| `0xb3c54ca96de0ded4ca0151f629ff9781506ba261` | Contract owner and original mint recipient | `41,775,638.372417177049704684` | `PROJECT_CONTROLLED_NON_CIRCULATING` | `No scheduled unlock` | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xb3c54ca96de0ded4ca0151f629ff9781506ba261) |
| `0xe87f6975fa3d4f3d56dce49fc978884285a3ed85` | autoLPWallet reserve | `7,808,747.106941087148180620` | `TREASURY_NON_CIRCULATING` | `No scheduled unlock` | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xe87f6975fa3d4f3d56dce49fc978884285a3ed85) |
| `0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c` | bankWallet | `7,219,494.213882174296359000` | `BANK_NON_CIRCULATING` | `No scheduled unlock` | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c) |
| `0x0fd21cf643211d067a18a416da219827da26e288` | rewardWallet | `7,209,747.106941087148179274` | `REWARD_NON_CIRCULATING` | `No scheduled unlock` | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0x0fd21cf643211d067a18a416da219827da26e288) |
| `0xcd60bf474e691f2484950a0276eaf507616ca4b9` | MOTHER repository reference | `3,600,000.000000000000000000` | `PROJECT_CONTROLLED_NON_CIRCULATING` | `No scheduled unlock` | [BscScan](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be?a=0xcd60bf474e691f2484950a0276eaf507616ca4b9) |

The two `OWNERSHIP_UNVERIFIED` major holders are not included in this package
and are not described as vested, locked, team, treasury, bank, or reward
wallets.

## Reconciliation

```text
4,366,878.985936300061217422
+ 67,613,626.800181525642423578
= 71,980,505.786117825703641
```

```text
71,980,505.786117825703641
+ 19,494.213882174296359
= 72,000,000
```

Both equations are performed in raw 18-decimal integer units by the validator.

## Boundaries

This is a read-only verification snapshot, not an external CoinMarketCap
submission. It transferred no token, connected no wallet, accessed no private
key, changed no contract or token configuration, and created no custody action.
The static values should be refreshed after any transfer or burn that changes a
classified balance.
