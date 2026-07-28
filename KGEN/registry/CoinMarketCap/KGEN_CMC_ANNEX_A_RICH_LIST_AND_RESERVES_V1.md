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
| Verified circulating supply | 2896511.372639273602111511 |
| Excluded current balances | 69083994.413478552101529489 |
| Verified burns outside current holder balances | 19494.213882174296359 |

The Annex A arithmetic is exact:

`2896511.372639273602111511 + 69083994.413478552101529489 = 71980505.786117825703641`

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

No holder is classified as `LOCKED` without verified lock evidence. Major
`UNKNOWN` balances are conservatively excluded until public-float evidence is
recorded. Public PancakeSwap V2 KGEN/WBNB liquidity is included because the
tokens are available to the market; LP-token ownership is a separate question.
Burned tokens reduce `totalSupply` and are not subtracted from it a second time.

## Public Downloads

- [Annex A XLSX](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx)
- [Annex A CSV](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv)
- [Annex A Markdown](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.md)

## SHA-256

| File | SHA-256 |
|---|---|
| `KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx` | `c65ecb7eee667871a82f82bca1a89784cb11df76bac4974eea7c7cdb519059f4` |
| `KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv` | `5534c66af24b2ab167b69b9eb295aa17514ac8cad94f5ce837a046e259b64826` |

## Evidence

- [Frozen machine-readable snapshot](./kgen_cmc_supply_snapshot.json)
- [Supply verification report](./KGEN_CMC_CIRCULATING_SUPPLY_VERIFICATION.md)
- [BscScan token page](https://bscscan.com/token/0xba3d3810e58735cb6813bc1cdc5458c0d71432be)
- [CoinMarketCap supply definitions](https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max)

This is a read-only evidence package. It does not transfer tokens, connect a
wallet, change the contract, or submit an external CoinMarketCap application.
