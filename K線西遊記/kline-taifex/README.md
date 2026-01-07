# KLINE-TAIFEX｜台指期貨 TX 近月全日K 自動轉檔（V8.8.2_pro）

你只要把期交所原始 CSV 丟進 `raw/`，GitHub 會自動：
1) 轉出近月「全日K」
2) 合併進主檔（去重後追加、按日期排序）
3) 更新 `master/台指近全.xlsx`（latest）並留存歷史版到 `master/history/`

---

## 📁 Repo 結構

```
KLINE-TAIFEX/
├─ raw/                     # 放原始 CSV（例如 20260106-07.csv）
├─ master/
│  ├─ 台指近全.xlsx         # 永遠最新主檔（latest）
│  └─ history/              # 每次產出歷史備份（台指近全YYYYMMDD.xlsx）
├─ scripts/
│  └─ tx_full_day_pipeline_v882_UTF8BOM.py
└─ .github/workflows/
   └─ auto_transfer.yml
```

---

## ✅ 本機手動跑（有電腦時）

```bash
python scripts/tx_full_day_pipeline_v882_UTF8BOM.py raw/20260106-07.csv --master master/台指近全.xlsx
```

---

## ✅ GitHub 自動跑（手機也可）

把 CSV 上傳到 `raw/`（commit/push）即可。  
Actions 會自動跑並 commit 回 repo（master/ 與 history/ 都會更新）。

---

## 🧠 金標準規則（摘要）

- 固定 19 欄、固定欄序、不更名
- 契約只取 TX，排除含 `/` 的跨月價差列
- 近月 = 到期月份(週別) 擷取最小 6 碼
- 全日K合併：夜盤開 / 日盤收 / 高低取極值 / 量=日+夜 / 結算價與OI取日盤末
- Excel：凍結 A2
