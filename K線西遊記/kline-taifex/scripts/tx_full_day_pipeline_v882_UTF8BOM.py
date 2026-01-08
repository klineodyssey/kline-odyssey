# -*- coding: utf-8 -*-
"""
《K線西遊記·台指期貨轉檔系統》
tx_full_day_pipeline_v882_UTF8BOM.py
最終相容版 V8.8.2（基於 V8.6，不刪不改原邏輯；僅「增補」功能）

【保留的既有規則（出自 V7.9.4～V8.6）】
- 欄位固定 19 欄、固定順序，不更名、不改型。
- 僅處理契約 = "TX"；排除含 "/" 的跨月價差列。
- 近月：每日獨立判定（本版增補，仍符合 V8.8.2 金標準）
- 全日K合併（核心專利邏輯，沿用原演算法）
  開盤：夜盤首筆；若無則取日盤首筆
  收盤：日盤最後一筆；若無則取夜盤最後一筆
  最高 / 最低：日夜極值（max/min）
  成交量：日 + 夜 相加
  其他欄：以日盤優先行；若無則以該日最後一筆填補
- 輸出：<csv>_near_full_v86.xlsx（為保下游相容，沿用 v86 字樣）；
        主檔：台指近全YYYYMMDD.xlsx
- Excel：凍結第一列 A2，自動欄寬
- 合併主檔：先去重（刪舊日），再追加新日，按日期升冪

【本版新增補強（不破壞既有行為）】
- CSV 多行相容：來源一筆可能被拆成 2～3 行，按「累積到 19 欄就收斂一筆」的方式自動組回。
- 交易時段相容：同時支援
    日盤：一般 / @
    夜盤：盤後 / L
- 跨月結算（整月檔/多檔批次皆可）：
    期交所原始資料：結算日該到期合約「結算價=0」
    本系統以「日盤（一般/@）結算價=0」視為該月結算日 → 排除該月份作為 near 候選
    near 以每日獨立判定，確保結算後（T+1）自動換月
- CLI 批次模式：input_csv 支援多個檔（raw/*.csv 展開後也可直接跑）
    python tx_full_day_pipeline_v882_UTF8BOM.py raw/*.csv --master master/台指近全.xlsx

使用方式：
python tx_full_day_pipeline_v882_UTF8BOM.py 20251023tx.csv --master 台指近全20251022.xlsx
python tx_full_day_pipeline_v882_UTF8BOM.py raw/*.csv --master master/台指近全.xlsx
"""
from __future__ import annotations

import os, re
from typing import List, Iterable, Optional

import numpy as np
import pandas as pd
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

# ---- 固定 19 欄（不可改名／不可變動順序） ----
HEADERS19: List[str] = [
    "交易日期","契約","到期月份(週別)","開盤價","最高價","最低價","收盤價",
    "漲跌價","漲跌%","成交量","結算價","未沖銷契約數","最後最佳買價","最後最佳賣價",
    "歷史最高價","歷史最低價","是否因訊息面暫停交易","交易時段","價差對單式委託成交量"
]

ENCODINGS = ["utf-8","utf-8-sig","cp950","big5"]

DAY_TAGS = {"一般", "@"}
NIGHT_TAGS = {"盤後", "L"}

# ---------- I/O 與相容讀取 ----------
def _read_text_any(path: str) -> str:
    last = None
    for enc in ENCODINGS:
        try:
            with open(path, "r", encoding=enc, errors="strict") as f:
                return f.read()
        except Exception as e:
            last = e
    raise RuntimeError(f"讀檔失敗（無相容編碼）：{last}")

def _looks_like_date(s: str) -> bool:
    s = str(s).strip()
    if not s: 
        return False
    if re.match(r"^\d{4}[-/]\d{2}[-/]\d{2}$", s): 
        return True
    if s.isdigit() and len(s) in (7,8):  # 2025102 / 20251023
        return True
    return False

def read_csv_strict_19_multiline(path: str) -> pd.DataFrame:
    """
    支援「英文逗號分隔、單筆記錄拆成 2～3 行」的 CSV。
    收斂規則：
      - 逐行 split(',') 累積 tokens；只要 >=19 就每 19 欄切成一筆；餘數留待下一行補
      - 若遇到新日期開頭且 buffer 內尚有欄位未收斂：以 "" 補到 19 欄後收斂成一筆
      - 檔尾殘留 1..18 欄：以 "" 補到 19 欄後收斂
      - 首列若等於 HEADERS19 → 視為表頭；否則直接套 HEADERS19
    """
    text = _read_text_any(path)
    lines = text.replace("\r\n","\n").replace("\r","\n").split("\n")
    rows, buf = [], []
    date_pat = re.compile(r"^\s*\d{4}/\d{2}/\d{2}\s*$")

    for ln in lines:
        if not ln.strip():
            continue
        parts = [p.strip() for p in ln.split(",")]

        # 若此行似為新日期起始，先把上一筆補齊收斂
        if parts and date_pat.match(parts[0]) and len(buf) > 0:
            if len(buf) % 19 != 0:
                pad = 19 - (len(buf) % 19)
                buf.extend([""] * pad)
            while len(buf) >= 19:
                rows.append(buf[:19])
                buf = buf[19:]

        buf.extend(parts)

        while len(buf) >= 19:
            rows.append(buf[:19])
            buf = buf[19:]

    # 檔尾殘留：補至 19 欄收斂
    if 0 < len(buf) < 19:
        buf.extend([""] * (19 - len(buf)))
        rows.append(buf)
        buf = []
    elif len(buf) == 19:
        rows.append(buf)
        buf = []

    if not rows:
        raise ValueError("未解析到任何資料列。")

    # 首列是否為表頭
    if [c.strip() for c in rows[0]] == HEADERS19:
        data = rows[1:]
    else:
        data = rows

    df = pd.DataFrame(data, columns=HEADERS19)

    # 相容檢查：若第一列交易日期不像日期，保留勘誤掛鉤
    if len(df) and not _looks_like_date(df.iloc[0, 0]):
        pass

    return df

# ---------- 工具：每日近月判定（支援結算價=0 規則） ----------
def _extract_months(g: pd.DataFrame) -> List[int]:
    months = (
        g["到期月份(週別)"].astype(str)
        .str.extract(r"(\d{6})")[0]
        .dropna()
        .astype(int)
        .unique()
        .tolist()
    )
    return sorted(months)

def _pick_near_month_for_day(g: pd.DataFrame) -> int:
    """
    每日近月判定（V8.8.2 增補規則，符合使用者定義）：
    - 候選月份：當天所有到期月份六碼（TX、非價差已在上層過濾）
    - 期交所原始資料：結算日該到期合約「日盤結算價=0」
      → 排除該月份作為 near 候選
    - near = 排除後的最小月份；若全被排除則回退到最小月份（保底）
    """
    months = _extract_months(g)
    if not months:
        raise ValueError("當天找不到任何到期月份六碼。")

    g_day = g[g["交易時段"].astype(str).isin(DAY_TAGS)].copy()

    valid: List[int] = []
    for m in months:
        gm_day = g_day[g_day["到期月份(週別)"].astype(str).str.contains(str(m), na=False)]
        settle = pd.to_numeric(gm_day["結算價"], errors="coerce")

        # 只要日盤結算價出現 0（或全為 0/空時視為 0），視為結算日 → 排除該月
        if settle.notna().any() and (settle.fillna(0) == 0).any():
            continue

        valid.append(m)

    return valid[0] if valid else months[0]

# ---------- 近月全日K 產出 ----------
def make_near_full_day(df19: pd.DataFrame) -> pd.DataFrame:
    """
    依 V7.9.4～V8.6 規則產出「近月全日K」多日資料（19 欄、不改名）。
    近月判定：每日獨立（支援結算價=0 自動換月）。
    全日K合併：夜盤開、日盤收、極值取日夜 max/min、成交量相加、其餘日盤優先行。
    """
    df = df19.copy()

    # 僅 TX，排除跨月
    df = df[df["契約"].astype(str).str.strip().str.upper() == "TX"].copy()
    df = df[~df["到期月份(週別)"].astype(str).str.contains("/", na=False)].copy()

    # 交易時段排序：夜盤在前、日盤在後（支援 盤後/L 與 一般/@）
    sort_map = {"盤後": 0, "L": 0, "一般": 1, "@": 1}
    df["_seq"] = df["交易時段"].astype(str).map(sort_map).fillna(1)
    df = df.sort_values(["交易日期","_seq"]).copy()

    # 數值欄轉為數字（容錯）
    num_cols = ["開盤價","最高價","最低價","收盤價","成交量","結算價","未沖銷契約數",
                "最後最佳買價","最後最佳賣價","歷史最高價","歷史最低價","漲跌價"]
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    records = []
    for d, g in df.groupby("交易日期"):
        try:
            near = _pick_near_month_for_day(g)
        except Exception:
            continue

        g_near = g[g["到期月份(週別)"].astype(str).str.contains(str(near), na=False)].copy()
        if g_near.empty:
            continue

        # 開盤：夜盤首筆，否則日盤首筆
        n_open = g_near[g_near["交易時段"].astype(str).isin(NIGHT_TAGS)]["開盤價"].dropna()
        if n_open.empty:
            n_open = g_near[g_near["交易時段"].astype(str).isin(DAY_TAGS)]["開盤價"].dropna()
        open_px = float(n_open.iloc[0]) if not n_open.empty else np.nan

        # 高 / 低：日夜極值
        high_px = g_near["最高價"].max(skipna=True)
        low_px  = g_near["最低價"].min(skipna=True)

        # 收盤：日盤最後一筆，否則夜盤最後一筆
        d_close = g_near[g_near["交易時段"].astype(str).isin(DAY_TAGS)]["收盤價"].dropna()
        if d_close.empty:
            d_close = g_near[g_near["交易時段"].astype(str).isin(NIGHT_TAGS)]["收盤價"].dropna()
        close_px = float(d_close.iloc[-1]) if not d_close.empty else np.nan

        # 成交量：加總（夜+日）
        vol = g_near["成交量"].fillna(0).sum()

        # 其他欄：日盤優先行；若無則取該日最後一筆
        day_part = g_near[g_near["交易時段"].astype(str).isin(DAY_TAGS)]
        base_row = day_part.iloc[-1] if not day_part.empty else g_near.iloc[-1]

        pct_str = str(base_row.get("漲跌%", "")).strip()
        if pct_str and "%" not in pct_str and pct_str.lower() not in ("nan","none",""):
            pct_str = pct_str + "%"

        rec = {
            "交易日期": d,
            "契約": "TX",
            "到期月份(週別)": str(near),
            "開盤價": open_px,
            "最高價": high_px,
            "最低價": low_px,
            "收盤價": close_px,
            "漲跌價": base_row.get("漲跌價", ""),
            "漲跌%": pct_str,
            "成交量": vol,
            "結算價": base_row.get("結算價", ""),
            "未沖銷契約數": base_row.get("未沖銷契約數", ""),
            "最後最佳買價": base_row.get("最後最佳買價", ""),
            "最後最佳賣價": base_row.get("最後最佳賣價", ""),
            "歷史最高價": base_row.get("歷史最高價", ""),
            "歷史最低價": base_row.get("歷史最低價", ""),
            "是否因訊息面暫停交易": base_row.get("是否因訊息面暫停交易", ""),
            "交易時段": "全日",
            "價差對單式委託成交量": base_row.get("價差對單式委託成交量", ""),
        }
        records.append(rec)

    return pd.DataFrame(records, columns=HEADERS19)

# ---------- Excel 視覺化（凍結 A2 + 欄寬） ----------
def _freeze_first_row_and_autowidth(xlsx_path: str, sheet_name: str = None):
    wb = load_workbook(xlsx_path)
    ws = wb.active if (sheet_name is None or sheet_name not in wb.sheetnames) else wb[sheet_name]
    ws.freeze_panes = "A2"
    for i, col in enumerate(ws[1], start=1):
        header = str(col.value) if col.value is not None else ""
        ws.column_dimensions[get_column_letter(i)].width = max(12, len(header) + 2)
    wb.save(xlsx_path)

def _standard_master_name(date_yyyymmdd: int) -> str:
    return f"台指近全{date_yyyymmdd}.xlsx"

def _norm_date_series(s: pd.Series) -> pd.Series:
    return s.astype(str).str.replace(r"[^\d]", "", regex=True).str.slice(0,8).astype(int)

# ---------- CLI ----------
def _cli():
    import argparse

    ap = argparse.ArgumentParser(
        description="台指期 TX 近月全日K 轉檔 v8.8.2（多行CSV相容＋全日合併＋跨月結算價=0換月＋批次多檔）"
    )
    ap.add_argument("input_csv", nargs="+", help="期交所 TX 19欄 CSV（可一次給多個檔；glob 展開可直接丟 raw/*.csv）")
    ap.add_argument("--master", help="現有主檔（xlsx）。未提供則新建。", default=None)
    ap.add_argument("-o", "--output", help="近月全日K輸出檔 (xlsx/csv)。批次模式下僅作用於單檔；預設：<csv>_near_full_v86.xlsx", default=None)
    args = ap.parse_args()

    # 讀 master 一次
    master_path = args.master
    if master_path and os.path.exists(master_path):
        master = pd.read_excel(master_path)
    else:
        master = pd.DataFrame(columns=HEADERS19)

    # 欄位齊備
    for col in HEADERS19:
        if col not in master.columns:
            master[col] = np.nan
    master = master[HEADERS19].copy()

    # 正規化 master 日期
    if not master.empty:
        master["交易日期"] = _norm_date_series(master["交易日期"])

    last_master_out: Optional[str] = None
    printed_any = False

    # 逐檔處理（排序以確保日期順序穩定）
    for csv_path in sorted(args.input_csv):
        # 讀檔（多行相容）
        df19 = read_csv_strict_19_multiline(csv_path)

        # 產出近月全日（可多日）
        near = make_near_full_day(df19)
        if near.empty:
            continue

        # 單日/多日 near 輸出（沿用 v86 命名以保下游相容）
        near_out = args.output
        if not near_out:
            base = os.path.splitext(os.path.basename(csv_path))[0]
            near_out = os.path.join(os.path.dirname(csv_path), f"{base}_near_full_v86.xlsx")

        if near_out.lower().endswith(".csv"):
            near.to_csv(near_out, index=False, encoding="utf-8-sig")
        else:
            near.to_excel(near_out, index=False)
            _freeze_first_row_and_autowidth(near_out, sheet_name="Sheet1")

        print(near_out)
        printed_any = True

        # 合併主檔（去重 + 追加）
        near_norm = near.copy()
        near_norm["交易日期"] = _norm_date_series(near_norm["交易日期"])

        new_dates = sorted(near_norm["交易日期"].unique().tolist())
        if not new_dates:
            continue

        if not master.empty:
            master = master[~master["交易日期"].isin(new_dates)].copy()

        master = (
            pd.concat([master, near_norm], ignore_index=True)
              .sort_values("交易日期")
              .reset_index(drop=True)
        )

        out_date = new_dates[-1]
        out_dir = os.path.dirname(master_path) if master_path else os.path.dirname(csv_path)
        last_master_out = os.path.join(out_dir, _standard_master_name(out_date))

    # 最後輸出一次 master
    if last_master_out:
        master.to_excel(last_master_out, index=False, sheet_name="台指近全")
        _freeze_first_row_and_autowidth(last_master_out, sheet_name="台指近全")
        print(last_master_out)
        printed_any = True

    if not printed_any:
        raise SystemExit("沒有產出任何檔案（請確認輸入CSV內是否有 TX 資料）。")

if __name__ == "__main__":
    _cli()
