# -*- coding: utf-8 -*-
"""
TX + BTC 轉檔總控（Autopilot 用）
- TX：批次處理 kline-taifex/raw/*.csv → 更新 master/台指近全.xlsx（呼叫你既有的 tx_full_day_pipeline_v882_UTF8BOM.py）
- BTC：若 raw 裡有檔（xlsx/csv）就合併；若沒有，就自動從 Binance 抓 1d K 線更新 master/BTCUSDT_1d_1000.xlsx

注意：這個檔是「工具層」，可公開。私有策略/模型不要放這裡。
"""
from __future__ import annotations

import argparse
import glob
from pathlib import Path
import pandas as pd
import subprocess
import sys

HERE = Path(__file__).resolve().parent
BTC_FETCH = HERE / "btc_fetch_binance.py"

def run_tx_pipeline(tx_raw_dir: Path, tx_master: Path):
    # 你的既有 pipeline 路徑（repo 內）
    pipeline = Path("K線西遊記/kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py")
    if not pipeline.exists():
        raise FileNotFoundError(f"TX pipeline not found: {pipeline}")

    tx_raw_dir.mkdir(parents=True, exist_ok=True)
    tx_master.parent.mkdir(parents=True, exist_ok=True)

    csvs = sorted(glob.glob(str(tx_raw_dir / "*.csv")))
    if not csvs:
        print("[convert] TX: no raw csv, skip.")
        return

    cmd = [sys.executable, str(pipeline), *csvs, "--master", str(tx_master)]
    print("[convert] TX cmd:", " ".join(cmd))
    subprocess.check_call(cmd)

def _read_btc_raw_any(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    raise ValueError(f"Unsupported BTC raw: {path}")

def merge_btc_master_from_raw(btc_raw_dir: Path, btc_master: Path):
    btc_raw_dir.mkdir(parents=True, exist_ok=True)
    btc_master.parent.mkdir(parents=True, exist_ok=True)

    raws = sorted(list(btc_raw_dir.glob("*.xlsx"))) + sorted(list(btc_raw_dir.glob("*.csv")))
    if not raws:
        return False

    # 取最新檔名（你也可以改成全部合併）
    raw = raws[-1]
    df = _read_btc_raw_any(raw)

    # 期望欄位：日期/開高低收量（容錯：英文字欄位）
    colmap = {}
    for c in df.columns:
        lc = str(c).strip().lower()
        if lc in ("date","日期","time"):
            colmap[c] = "日期"
        elif lc in ("open","開","開盤","開盤價"):
            colmap[c] = "開盤"
        elif lc in ("high","最高","最高價"):
            colmap[c] = "最高"
        elif lc in ("low","最低","最低價"):
            colmap[c] = "最低"
        elif lc in ("close","收","收盤","收盤價"):
            colmap[c] = "收盤"
        elif lc in ("volume","量","成交量"):
            colmap[c] = "成交量"
    df = df.rename(columns=colmap)

    need = ["日期","開盤","最高","最低","收盤","成交量"]
    for n in need:
        if n not in df.columns:
            raise ValueError(f"BTC raw missing column: {n} in {raw}")

    df = df[need].copy()
    df["日期"] = pd.to_numeric(df["日期"].astype(str).str.replace(r"[^\d]","", regex=True).str.slice(0,8), errors="coerce").astype("Int64")

    if btc_master.exists():
        old = pd.read_excel(btc_master)
    else:
        old = pd.DataFrame(columns=need)
    for n in need:
        if n not in old.columns:
            old[n] = pd.NA
    old = old[need].copy()
    old["日期"] = pd.to_numeric(old["日期"], errors="coerce").astype("Int64")

    new_dates = set(df["日期"].dropna().astype(int).tolist())
    old = old[~old["日期"].astype("Int64").isin(new_dates)]
    merged = pd.concat([old, df], ignore_index=True).sort_values("日期").reset_index(drop=True)
    merged.to_excel(btc_master, index=False)
    print(f"[convert] BTC merged from raw={raw.name} rows={len(merged)}")
    return True

def update_btc_master_from_binance(btc_master: Path):
    cmd = [sys.executable, str(BTC_FETCH), "--master", str(btc_master), "--symbol", "BTCUSDT", "--interval", "1d", "--limit", "1000"]
    print("[convert] BTC fetch cmd:", " ".join(cmd))
    subprocess.check_call(cmd)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_raw_dir", required=True)
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_raw_dir", required=True)
    ap.add_argument("--btc_master", required=True)
    args = ap.parse_args()

    run_tx_pipeline(Path(args.tx_raw_dir), Path(args.tx_master))

    ok = merge_btc_master_from_raw(Path(args.btc_raw_dir), Path(args.btc_master))
    if not ok:
        update_btc_master_from_binance(Path(args.btc_master))

if __name__ == "__main__":
    main()
