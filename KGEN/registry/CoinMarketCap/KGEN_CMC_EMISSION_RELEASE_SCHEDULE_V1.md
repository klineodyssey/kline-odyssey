# KGEN CoinMarketCap Emission and Release Schedule V1

Status: `VERIFIED_NO_FUTURE_EMISSION_SCHEDULE`

Policy: `NO_SCHEDULED_ADDITIONAL_EMISSION`

## Supply Policy

- Initial fixed max supply: `72000000 KGEN`
- Initial event: one constructor mint to the initial owner
- Future minting schedule: none
- Inflation schedule: none
- Verified total supply at BSC block `112570686`:
  `71980505.786117825703641 KGEN`
- Verified circulating supply at that block:
  `4366878.985936300061217422 KGEN`
- Verified cumulative burn difference from max supply:
  `19494.213882174296359 KGEN`

The verified token source fixes `TOTAL_SUPPLY` at `72_000_000 * 10**18` and
mints it once in the constructor. The schedule does not characterize AMM
liquidity movements, wallet transfers, or burns as new emission. No ICO, IEO,
future vesting date, or future release date is asserted.

## Public Downloads

- [Emission XLSX](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.xlsx)
- [Emission CSV](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.csv)
- [Emission Markdown](https://klineodyssey.github.io/kline-odyssey/KGEN/registry/CoinMarketCap/KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.md)

## SHA-256

| File | SHA-256 |
|---|---|
| `KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.xlsx` | `4044872d9d710270dcf93d953f362000f1f7e5d5f9a783738131954d2fce772a` |
| `KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.csv` | `dd4d7d2b6df79152346bdcf36a9d013ad7d9990f2a612fcd954abaf4b7bfaeac` |

## Evidence

- [Verified token source](../../contracts/KGEN_Token_V7_5_2.sol)
- [Frozen supply snapshot](./kgen_cmc_supply_snapshot.json)
- [Supply verification report](./KGEN_CMC_CIRCULATING_SUPPLY_VERIFICATION.md)

This is a public disclosure artifact only. It does not mint, burn, transfer,
release, lock, or vest tokens.
