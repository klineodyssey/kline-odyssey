# HANDBOOK - KLINE Autopilot (TX + BTC)

本手冊用於：
- 交接給不同分頁/不同裝置
- 新人接手不會迷路
- 任何錯誤都能快速定位是哪一段壞掉

---

## 0. 你現在這條流水線在做什麼

每天你會做的事只有兩種：
1) 把 TX raw CSV 丟到 `kline-taifex/raw/`
2) 把 BTC 你手機抓好的檔丟到 `kline-btc/raw/`（或不丟，讓系統自己抓）

其他全部交給 GitHub Actions 自動做：
- 轉檔合併 master
- 若引擎具備則運算出 output
- commit 回 repo

---

## 1. 檔案角色清單（每支程式是什麼、跟誰有關）

### 1.1 `.github/workflows/autopilot_all.yml`
角色：總控排程器
依賴：
- Python 3.10
- pandas / openpyxl / numpy / requests
會呼叫：
- `K線西遊記/tools/tx_btc_convert.py`
- `K線西遊記/kline-engine-public/run_public.py`（只有 engine_ok 才跑）
會寫入：
- TX master、BTC master、engine output（若有）

### 1.2 `K線西遊記/tools/tx_btc_convert.py`
角色：轉檔總控（資料準備層）
依賴：
- TX pipeline：`kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py`
- BTC 若用 API：requests（直接在此檔內抓 Binance）
輸入：
- TX raw dir：`kline-taifex/raw/*.csv`
- BTC raw dir：`kline-btc/raw/*.xlsx|*.csv`（你手機丟的）
輸出：
- TX master：`kline-taifex/master/台指近全.xlsx`
- BTC master：`kline-btc/master/BTCUSDT_1d_1000.xlsx`

BTC 策略：
- raw 有檔：吃 raw（你手動抓的 6cols）
- raw 沒檔：抓 Binance API（1d, limit=1000）
- API 也抓不到：略過 BTC（不影響 TX）

### 1.3 `kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py`
角色：台指金標準 pipeline（19 欄）
核心規則（不可亂動）：
- 近月判定：第三個星期三結算日 + 結算價=0 判定輔助
- 全日K合併：成交量=日+夜，OI/結算價取日盤，夜盤無OI/結算價
輸出：
- latest：台指近全.xlsx
- dated：台指近全YYYYMMDD.xlsx

### 1.4 `kline-engine-public/run_public.py`
角色：公開引擎入口（運算層）
依賴：
- engine_bin/（由 secret 還原）
- 可能用到 `ENGINE_MODEL_B64`（模型從 secret 寫出來）
輸入：
- master（TX 或 BTC）
輸出：
- output/tx 或 output/btc

---

## 2. BTC 檔案格式規格（你手機抓的檔）

推薦你的 6cols 格式：
- date, open, high, low, close, volume

檔名可以自由，但建議包含日期方便挑最新：
- BTCUSDT_1d_1000_6cols_YYYYMMDD.xlsx

放置位置：
- `K線西遊記/kline-btc/raw/`

系統會挑「檔名含 YYYYMMDD 最大的」作為最新；沒有日期就用檔案修改時間。

---

## 3. 引擎 secrets 是什麼

`ENGINE_ZIP_B64`
- 這不是檔名
- 這是把 engine.zip 做 base64 之後放進 GitHub Secrets 的值
- 沒有它，workflow 仍會跑轉檔，但不會跑引擎

`ENGINE_MODEL_B64`
- 同理，不是檔名
- 是模型檔內容（通常 json）做 base64 後放到 Secrets
- 引擎跑的時候才會把它寫到 engine_dir 裡供入口程式讀取

---

## 4. 故障排除（最常見）

A) workflow 跑了但 TX master 沒更新
- raw 是否有 csv
- pipeline 路徑是否存在
- pipeline 是否有產出 latest（台指近全.xlsx）

B) BTC master 沒更新
- raw 是否有檔
- raw 檔是否真的有 date/open/high/low/close/volume
- 若 raw 沒檔：Binance API 是否被暫時封鎖（偶發）

C) 引擎不跑
- 確認 GitHub Secrets 有沒有 `ENGINE_ZIP_B64`
- engine.zip 是否能 unzip -t
- engine.zip 內是否有入口檔（step1 / launcher / 啟動器）

---

## 5. 升級規則（避免 repo 變成垃圾堆）

- 任何新增程式前，要先寫清楚：
  1) 這支程式是什麼
  2) 被誰呼叫
  3) 輸入輸出
  4) 注意事項
- 先本機/手機驗證能跑，再提交到 GitHub
- 舊檔不亂刪，改用升版檔名或用 handbook 記錄淘汰原因
