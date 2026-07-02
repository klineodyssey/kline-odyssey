# AGENTS.md

Guidance for AI agents working in the KLINE Odyssey repository.

## Project overview

KLINE Odyssey is a static Web3 × finance narrative site (GitHub Pages) with Python market-data pipelines and optional on-chain KGEN contracts. There is no `package.json`, Docker, or database.

## Cursor Cloud specific instructions

### Services to run locally

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| Static HTTP server | 8080 | `python3 -m http.server 8080` (from repo root) | Required for all frontends. Run in a tmux session if long-lived. |
| Python pipelines | — | See below | Optional; only needed for data/autopilot work |
| BSC RPC / MetaMask | — | External | Required only for wallet/on-chain interactions |

No Jekyll, Node, or Hardhat setup is required for frontend development. `ethers.js` is vendored in temple folders.

### Key local URLs (server on port 8080)

- Galaxy portal: `http://localhost:8080/K線西遊記/index.html`
- Temple 12345 (悟空財神殿): `http://localhost:8080/K線西遊記/temples/12345/index.html`
- Temple 16888 (廣寒宮): `http://localhost:8080/K線西遊記/temples/16888/index.html`
- Wukong temple (legacy): `http://localhost:8080/wukong-temple/index.html`

Production uses GitHub Pages base URL `/kline-odyssey`; local dev serves from repo root without that prefix.

### Python data pipeline

Install deps are handled by the VM update script. To run the TX+BTC conversion (matches `.github/workflows/autopilot_all.yml`):

```bash
python3 K線西遊記/tools/tx_btc_convert.py \
  --tx_raw_dir K線西遊記/kline-taifex/raw \
  --tx_pipeline K線西遊記/kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py \
  --tx_master K線西遊記/kline-taifex/master/台指近全.xlsx \
  --btc_raw_dir K線西遊記/kline-btc/raw \
  --btc_master K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx
```

The proprietary K-line engine (`ENGINE_ZIP_B64` secret) is not in the repo; engine steps are skipped without it.

### Lint / test

There is no committed ESLint, pytest, or npm test suite. Validation is via:

- CI workflows in `.github/workflows/` (Python 3.10)
- Manual browser check of temple UIs
- Running `tx_btc_convert.py` against committed raw CSV samples

### Gotchas

- **CORS on Binance API**: Temple 16888 and some game shells call `api.binance.com` directly; browsers on `localhost` will log CORS errors. UI still renders; live klines may fall back or fail silently.
- **Wallet features**: Require MetaMask (or compatible) on BSC mainnet (chainId 56). No local chain is pre-wired.
- **Hardhat/KGEN deploy**: `KGEN/scripts/*.js` expect a Hardhat project that is not scaffolded in-repo.
- **KGEN tax immutability**: `KGEN/contracts/KGEN_Token_V7_5_2.sol` fixes tax at 0.30% via `constant` bps; there is no tax-rate setter. DappBay may show "Can Modify Tax" because of `setTaxWallets` / `setTaxExempt` / `Ownable` heuristics — see `docs/KGEN_TAX_IMMUTABILITY.md`. **稅率不可改，不得為了 DappBay 重新開 tax setter 或重新部署 token。**
- **Pipeline side effects**: Running `tx_btc_convert.py` updates `master/*.xlsx` and may write `*_near_full_v86.xlsx` under `raw/`. Revert or commit intentionally.
