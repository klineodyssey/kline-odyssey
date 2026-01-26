# K線西遊記｜創作 × 資料 × 引擎（主世界線）

本資料夾為《K線西遊記／花果山台灣》之「創作與系統」母資料夾，包含：
- 原始資料（行情輸入）
- 轉檔結果（台指近全.xlsx 等）
- 每日創作輸出（貼文／英文語音／字幕）
- 系統接口（事件 JSON、連結清單）
- 封存（歷史版本）

---

## 1) 公開與未公開邊界（重要）

### 公開（可下載／可檢視）
- 轉檔結果：台指近全.xlsx（全歷史彙整）
- 轉檔引擎：資料清洗與格式化流程（用於可重現與透明化）
- 每日創作輸出：貼文、英文語音稿、字幕（依 daily 結構）

### 未公開（保留）
- 運算引擎（策略／模型／權重／判斷規則）
- 核心參數與內部決策流程

> 資料透明、流程透明、判斷保留。

---

## 2) 資料夾結構（固定）

/K線西遊記/
- README.md（本文件）
- raw/（原始輸入資料）
- converter/（轉檔引擎與說明）
- data/（轉檔後資料成果，例如台指近全.xlsx）
- engine/（運算引擎：未公開）
- out/（運算結果輸出：可視狀況公開「結果」不公開「方法」）
- daily/（每日創作輸出：貼文／英文語音／字幕）
- assets/（封面圖、劇情圖、素材）
- archive/（歷史封存）

---

## 3) daily 檔名與規範（固定）

### 每日資料夾
/K線西遊記/daily/YYYY-MM-DD/

### 每日三件套（固定）
- YYYY-MM-DD_post.md
- YYYY-MM-DD_voice.txt
- YYYY-MM-DD_subtitle.srt

> 規則：貼文中文；語音稿與字幕為英文版（必要時可雙語，但以英文為主）。

---

## 4) 平台輸出原則（固定）

- 影片：以 YouTube / TikTok 連結為主（不直接把影片檔放 GitHub）
- GitHub：存「原始稿、字幕、語音文字、封面圖、事件 JSON、連結清單」
- 官網（Repo 根目錄 README.md）：只放官網入口與核心影片嵌入，不放 daily 細節

---

## 5) 事件接口（預留）

/K線西遊記/events/
- gate_hit.json
- burn.json
- reward.json
- heartbeat_daily.json

事件只描述「發生什麼」，不暴露運算細節。

---

## 6) 品牌固定尾章（唯一有效）

PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
⌖ —— 樂天帝

---

# （追加）Autopilot / Interfaces / Hooks（不影響影片組原文）

> 本區為「自動化轉檔 + 引擎運算 + 對外接口」說明，**不改動**上方影片組原文規範。

## A. 轉檔與主檔（TX + BTC）

- TX RAW：`K線西遊記/kline-taifex/raw/`
- TX Pipeline：`K線西遊記/kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py`
- TX Master（latest）：`K線西遊記/kline-taifex/master/台指近全.xlsx`

- BTC RAW（手機手動 6cols 檔優先）：`K線西遊記/kline-btc/raw/`
- BTC Master（固定檔名、內容不限 1000 根）：`K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx`

> 自動流程若找不到 BTC RAW，會改用 Binance 公開 API 抓 1d（limit=1000）。

## B. 引擎運算（可選）

- 引擎 zip 來源：`secrets.ENGINE_ZIP_B64`（Actions 會解壓至 `engine_bin/`）
- 模型檔來源：`secrets.ENGINE_MODEL_B64`（會寫成 `engine_bin/_secret_model.json`）
- 公開入口腳本：`K線西遊記/kline-engine-public/run_public.py`
  - 參數：`--master <xlsx> --engine_dir engine_bin --outdir <outdir>`

輸出目錄：
- TX：`K線西遊記/kline-engine-public/output/tx/`
- BTC：`K線西遊記/kline-engine-public/output/btc/`

## C. 狀態接口（status.json）

- 產出位置：`K線西遊記/kline-engine-public/status/status.json`
- 由：`K線西遊記/tools/write_status.py` 產生
- 內容（摘要）：
```json
{
  "ts_utc": "<ISO 時間>",
  "tx": { "master": ".../台指近全.xlsx", "latest_date": "YYYY-MM-DD", "out_latest": {...}, "updated": true },
  "btc": { "master": ".../BTCUSDT_1d_1000.xlsx", "latest_date": "YYYY-MM-DD", "out_latest": {...}, "updated": true, "source": "raw|api|auto|unknown" },
  "engine": { "enabled": true, "ok": true },
  "interfaces": { "status_path": "...", "tx_master_path": "...", "btc_master_path": "...", "outdir_tx": "...", "outdir_btc": "..." },
  "brand": { "closing_oath": "PrimeForge..." },
  "version": "status_iface_v1.0"
}
