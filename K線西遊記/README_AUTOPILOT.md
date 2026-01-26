# KLINE Autopilot (TX + BTC) - Stable

本文件說明：本 repo 的「自動轉檔 + 自動運算（可選）+ 自動回推」流水線。
目標是讓任何人（包含不同分頁/不同裝置）一看就知道：
- 哪個 workflow 會跑
- 會用到哪些程式
- 檔案要放哪
- 會產出什麼
- 哪些地方最容易壞、要注意什麼

---

## 1. 系統總覽

本 Autopilot 分成三層：

A) 轉檔層（必跑，不可被擋）
- TX：raw CSV -> 轉成「台指近全.xlsx」
- BTC：raw（你手動放）或 Binance API -> 累加成「BTC master」

B) 引擎層（可選，有 secret 才跑）
- 由 GitHub Secrets 還原 engine.zip 到 engine_bin/
- 找入口檔執行，輸出到 output/

C) 回推層（必跑）
- master 一律 commit 回 repo
- output 若存在就 commit 回 repo

---

## 2. 關聯檔案與路徑

### 2.1 GitHub Actions Workflow（總控）
檔案：
- `.github/workflows/autopilot_all.yml`

用途：
- 監聽 raw/ 與 scripts/ 等路徑變更
- 先跑轉檔（TX + BTC）
- 再嘗試還原引擎並運算（若 secret 具備）
- 最後回推 master + output

---

### 2.2 轉檔總控（TX + BTC）
檔案：
- `K線西遊記/tools/tx_btc_convert.py`

用途：
- TX：呼叫既有台指 pipeline，把 raw CSV 合併更新到 TX master
- BTC：優先吃 raw（你手動放到 btc raw 的檔），若 raw 沒檔才改抓 Binance API
- BTC master 會「累加、去重、排序」，內容不限 1000 根

---

### 2.3 台指 pipeline（TX 19欄金標準）
檔案：
- `K線西遊記/kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py`

用途：
- 將期交所 19 欄 CSV（可能多行拆欄）整理
- 依 V8.8.2 金標準產出「近月全日K」並更新：
  - dated：台指近全YYYYMMDD.xlsx
  - latest：台指近全.xlsx（workflow 依賴此檔存在）

注意：
- 這支是 TX 核心金標準，除非升版，不建議亂動

---

### 2.4 引擎公開入口（可選）
檔案：
- `K線西遊記/kline-engine-public/run_public.py`

用途：
- workflow 還原 engine_bin 後，用這支去找引擎入口並執行
- 把 master 當 input，輸出到 output/tx 或 output/btc

引擎來源：
- 不放 repo，從 GitHub Secrets 還原 engine.zip

---

## 3. 資料放置規則

### 3.1 TX raw 放哪裡
- `K線西遊記/kline-taifex/raw/*.csv`

你只要把期交所原始 CSV 放到這裡，workflow 就會自動轉檔更新 master。

### 3.2 BTC raw 放哪裡
- `K線西遊記/kline-btc/raw/`

你手機手動抓的檔案（xlsx 或 csv）丟這裡即可。
範例檔名：
- `BTCUSDT_1d_1000_6cols_20260126.xlsx`

raw 有檔就優先用 raw；raw 沒檔才會改走 Binance API。

---

## 4. 產出檔案（Outputs）

### 4.1 TX master
- latest（固定給後續用）：
  - `K線西遊記/kline-taifex/master/台指近全.xlsx`
- dated（歷史留存，日期）：
  - `K線西遊記/kline-taifex/master/台指近全YYYYMMDD.xlsx`

### 4.2 BTC master（固定檔名，不限長度）
- `K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx`

注意：
- 檔名保留 1000 字樣是為了相容舊流程，但內容會持續累加，不受 1000 根限制。

### 4.3 引擎 output（若 engine 有跑）
- `K線西遊記/kline-engine-public/output/tx/`
- `K線西遊記/kline-engine-public/output/btc/`

---

## 5. Secrets（引擎相關）

Workflow 使用的 secrets：
- `ENGINE_ZIP_B64`：base64 的 engine.zip
- `ENGINE_MODEL_B64`：base64 的模型（通常是 json）

若 `ENGINE_ZIP_B64` 不存在：
- 引擎會跳過
- 轉檔與回推仍會照常進行（master 照樣更新）

---

## 6. 常見問題與排查

1) TX master 沒更新
- 檢查 `kline-taifex/raw/` 是否真的有 csv
- 檢查 pipeline 路徑是否存在：
  `kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py`

2) BTC master 沒更新
- 先檢查 `kline-btc/raw/` 有沒有檔
- 沒檔的話才看 Binance API 是否被擋（Actions 可能偶發）
- BTC 抓不到時會略過，不影響 TX

3) 引擎不跑
- 先確認 `ENGINE_ZIP_B64` 是否有設
- 再確認 engine.zip 內有入口檔（step1/launcher/啟動器）

---

## 7. 最重要原則

- 轉檔永遠優先且不可被 engine 擋住
- master 永遠要回推更新
- engine 可以失敗，但不能阻斷資料準備
