# KGEN CoinMarketCap Annex A: Rich List and Reserves V1

Status: `VERIFIED_PUBLIC_EVIDENCE_PACKAGE`

Snapshot block: `112570686`

Snapshot time: `2026-07-28T05:32:49Z`

Contract: `0xba3d3810e58735cb6813bc1cdc5458c0d71432be`

## Supply Reconciliation

| Measure | KGEN |
|---|---:|
| Max supply | 72000000 |
| Verified total supply | 71980505.786117825703641 |
| Verified circulating supply | 4366878.985936300061217422 |
| Excluded current balances | 67613626.800181525642423578 |
| Verified burns outside current holder balances | 19494.213882174296359 |

The Annex A arithmetic is exact:

`4366878.985936300061217422 + 67613626.800181525642423578 = 71980505.786117825703641`

The max-supply reconciliation is also exact:

`71980505.786117825703641 + 19494.213882174296359 = 72000000`

## Classification Method

The package uses these CoinMarketCap supply-review classifications:

- `PUBLIC_CIRCULATING`
- `LIQUIDITY_POOL`
- `FOUNDER_OR_TEAM_CONTROLLED`
- `TREASURY`
- `BANK`
- `REWARD`
- `LOCKED`
- `BURN_ADDRESS`
- `CONTRACT_HELD`
- `UNKNOWN`

No holder is classified as `LOCKED` without verified lock evidence. The two
major ownership-unverified balances are classified `PUBLIC_CIRCULATING`
because no evidence establishes project control, lock, vesting, treasury or
reserve custody. Public PancakeSwap V2 KGEN/WBNB liquidity is included because
the tokens are available to the market; LP-token ownership is a separate
question. Only the five evidenced project-controlled wallets with non-zero
balances are excluded. Burned tokens reduce `totalSupply` and are not
subtracted from it a second time.

## Public Downloads

- [Annex A XLSX](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx)
- [Annex A CSV](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv)
- [Annex A Markdown](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.md)

## SHA-256

| File | SHA-256 |
|---|---|
| `KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx` | `9d5136e9b18c98db520eb85f46824aa10b05fa652de95aea6fd55b684d8f1c63` |
| `KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv` | `cb38cbd6c7650288c56468e8ab37a0c3d3dd30f96d7caebe1ad9fe5c36d38bdd` |

## Evidence

- [Frozen machine-readable snapshot](./kgen_cmc_supply_snapshot.json)
- [Supply verification report](./KGEN_CMC_CIRCULATING_SUPPLY_VERIFICATION.md)
- [BscScan token page](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be)
- [CoinMarketCap supply definitions](https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max)

This is a read-only evidence package. It does not transfer tokens, connect a
wallet, change the contract, or submit an external CoinMarketCap application.
