# KGEN Contracts (V7.5.2)

## K11520 settlement candidate — 2026-09-25

Existing versionless Brain custody + Risk + Position are extended by
`KGEN/contracts/KGEN_OrderTriggerEngine.sol`, the unique pending/touch/cross
one-shot order organ. No contract is deployed by merging these sources.
The historical versioned-file policy below is lineage, not authority to duplicate
active organs. `docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json` is a **blocked**
execution package, not a deployment receipt.

Run `node KGEN/contracts/tests/brain-position-integration-evm.test.mjs` with the
pinned dependencies in `.github/workflows/11520-trading-readiness.yml` for actual
Brain proxy + Position + Trigger integration. Risk is compiled into the engines.
The token/feeds and chain are local test fixtures. Generated
`artifacts/settlement-local-evm.json` records real local addresses/transactions/gas
and source hashes, **not Testnet evidence**.

Brain `SETTLEMENT_ROLE` must be Position only; Position `executor` must be Trigger
only. Keeper cannot supply a price or arbitrary trader. C is signed WAD ±100,
lots1..100, margin=lots KGEN, PnL=return×signedC×lots. Maintenance derives from
mark notional; no hidden fee or fixed1% threshold. Reported liquidation boundary
uses guaranteed-trigger integer rounding; the actual equity predicate always
checks the first accepted observation. Off-chain ticks never delivered by feeds
and keeper cannot be observed by a contract.

This is a **fresh empty PositionEngine** deployment candidate. Legacy orderId=0
position migration is unsupported, not silently mapped into the Trigger path.
Use pause-new-risk controls, not disabling a market with open positions (which
blocks its exits). No upgrade/deploy/role transaction is authorized here.

Game uses the existing ledger for session-only SIMULATION pending/fill/SL/TP/
liquidation and immutable local receipts. Wallet shows separate available,
locked, equity, unrealized and realized fields; on-chain balance is read-only.
`K線西遊記/temples/11520/tests/11520-browser-settlement.mjs` exercises the actual
Chromium entry at390×844 and844×390. Public quotes are reference data, not a
real-funds settlement oracle. Production feed/role/Testnet blockers are explicit
in the manifest; no Mainnet-ready claim without those receipts.

## 合約定位與使用說明（給工程/審計/合作方）

---

## 0. 一句話總結
KGEN V7.5.2 由三個核心合約構成：
- Token：KGEN 主幣
- Bank：Galactic Bank（五指山制度中樞）
- Genesis：Genesis Inscription（創世權利系統）

---

## 1. 合約清單（Repo 內）
- /KGEN/contracts/KGEN_Token_V7_5_2.sol
- /KGEN/contracts/KGEN_GalacticBank_V7_5_2.sol
- /KGEN/contracts/KGEN_Genesis_Inscription_V7_5_2.sol

---

## 2. 各合約角色（務必分清）
### A) KGEN_Token_V7_5_2.sol
主幣合約（KGEN）
- 定義供給、轉帳、基礎權限
- 與回流 / 稅制 / 交易限制等機制對接（依實際合約為準）

### B) KGEN_GalacticBank_V7_5_2.sol
Galactic Bank（五指山）
- 制度金庫與分配中樞
- 用途：建設支出、獎勵分配、制度回流承接
- 所有資金流以鏈上事件與交易紀錄可查驗

### C) KGEN_Genesis_Inscription_V7_5_2.sol
Genesis Inscription（創世銘文/權利）
- 創世權利的識別與規則載體
- 可作為分潤/治理/App 權限的根基（依實際合約功能為準）

---

## 3. 「五指山收租」在技術上代表什麼？
「收租」不是鎖死，也不是不可動用。
技術上等同：
- 交易回流（fee / tax / energy reflux）導入銀行
- 銀行依制度規則進行：支出、分配、燃燒、獎勵

注意：
本 Repo 文字描述只做制度定位。
實際比例、白名單、權限、事件名稱與限制，請以合約程式碼為準。

---

## 4. 版本策略（不可覆蓋舊文明）
- 新版本一律新增檔案，不覆蓋舊檔
- 版本命名沿用：V7_5_2、V7_5_3…
- 若升級合約，需補：
  - upgrade note
  - migration note
  - 新舊地址對照（若有）

---

## 5. 參考文件
- 白皮書：
  /KGEN/whitepaper/KGEN_Whitepaper_GalacticBank_500Y_Epoch_V7.5.2.md
- 500Y Epoch：
  /KGEN/timeline/500Y_Epoch.md
