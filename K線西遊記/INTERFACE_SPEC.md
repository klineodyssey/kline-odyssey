# KLINE Autopilot Interface Spec (Unified)

目的：
讓不同專案模組（TX/BTC 轉檔、引擎運算、影片輸出、官網發布、YouTube 抓取）
能用「同一套接口」串接，而不是各自硬接路徑。

核心原則：
- 本 repo 每次 Autopilot 跑完，都會產生一份「狀態檔 status.json」
- 其他模組只要讀 status.json 就能接續工作
- 模組間不要互相讀彼此內部資料夾結構（避免改版就全斷）

---

## A. 狀態檔（唯一對外出口）

固定路徑：
- `K線西遊記/kline-engine-public/status/status.json`

格式（JSON）必含欄位：

### 1) meta
- run_id: GitHub Actions run id（或時間戳）
- run_time_utc: 本次跑完時間（UTC ISO8601）
- git:
  - repo
  - branch
  - commit

### 2) tx
- updated: true/false
- master_latest: 路徑（固定）
- master_dated: 本次若產生 dated，給路徑；沒有就 null
- rows: 近似列數（可選）
- raw_files_seen: 本次看到的 raw csv 檔名清單（可選）

### 3) btc
- updated: true/false
- source: "raw" | "binance_api" | "skip"
- master_latest: 路徑（固定）
- rows: 近似列數（可選）
- raw_file_used: 若 source=raw，記錄用到的檔名；否則 null
- error: 若 skip，給原因；否則 null

### 4) engine
- enabled: true/false（由 secret 決定）
- ok: true/false
- out_tx_dir: 若有產出，給路徑；否則 null
- out_btc_dir: 若有產出，給路徑；否則 null
- error: 若失敗，給錯誤摘要；否則 null

---

## B. 其他模組如何接

### 影片輸出模組
- 讀 status.json
- 若 tx.updated=true 或 btc.updated=true，開始做當日影片素材、字幕、封面生成
- 成品可寫回自己的 output（但不要改 master）

### 官網模組（GitHub Pages）
- 讀 status.json
- 用 commit + 產出路徑更新首頁「最新資料日期」
- 若 engine 有輸出，可把 output 轉成網站可讀格式

### YouTube 抓取模組
- 讀 status.json 取得今天的日期與主題
- 抓取 YouTube 最新影片後，更新官網「最新影片」欄位

---

## C. 版本規則
- 任何模組只依賴 status.json，不直接依賴 repo 內部結構
- 若未來改路徑，只要 status.json 仍維持欄位與意義不變，外部模組不需要改
