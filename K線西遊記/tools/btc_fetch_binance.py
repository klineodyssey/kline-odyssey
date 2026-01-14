# -*- coding: utf-8 -*-
"""
Binance Klines downloader (BTCUSDT 1d)
- 目的：GitHub Actions 直接從 Binance 公開 API 抓最新 1d K 線，合併到 master/BTCUSDT_1d_1000.xlsx
- 依賴：requests, pandas, openpyxl
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import requests

BINANCE_BASE = "https://api.binance.com"

def fetch_klines(symbol: str="BTCUSDT", interval: str="1d", limit: int=1000) -> pd.DataFrame:
    url = f"{BINANCE_BASE}/api/v3/klines"
    r = requests.get(url, params={"symbol": symbol, "interval": interval, "limit": limit}, timeout=30)
    r.raise_for_status()
    data = r.json()
    cols = ["open_time","open","high","low","close","volume","close_time","quote_volume",
            "num_trades","taker_buy_base","taker_buy_quote","ignore"]
    df = pd.DataFrame(data, columns=cols)

    # 轉型
    for c in ["open","high","low","close","volume","quote_volume","taker_buy_base","taker_buy_quote"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    df["close_time"] = pd.to_datetime(df["close_time"], unit="ms", utc=True)

    # 增加 YYYYMMDD（以 UTC 日期為準）
    df["date"] = df["open_time"].dt.strftime("%Y%m%d").astype(int)

    # 常用輸出欄（你之後引擎若要其他欄，也可加）
    out = df[["date","open","high","low","close","volume"]].copy()
    out.columns = ["日期","開盤","最高","最低","收盤","成交量"]
    return out

def merge_master(master_path: Path, new_df: pd.DataFrame) -> pd.DataFrame:
    if master_path.exists():
        old = pd.read_excel(master_path)
    else:
        old = pd.DataFrame(columns=list(new_df.columns))

    # 欄位齊備
    for c in new_df.columns:
        if c not in old.columns:
            old[c] = pd.NA
    old = old[new_df.columns].copy()

    # 去重後合併
    old["日期"] = pd.to_numeric(old["日期"], errors="coerce").astype("Int64")
    new_df["日期"] = pd.to_numeric(new_df["日期"], errors="coerce").astype("Int64")

    new_dates = set(new_df["日期"].dropna().astype(int).tolist())
    old = old[~old["日期"].astype("Int64").isin(new_dates)]
    merged = pd.concat([old, new_df], ignore_index=True).sort_values("日期").reset_index(drop=True)
    return merged

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True)
    ap.add_argument("--symbol", default="BTCUSDT")
    ap.add_argument("--interval", default="1d")
    ap.add_argument("--limit", type=int, default=1000)
    args = ap.parse_args()

    master = Path(args.master)
    master.parent.mkdir(parents=True, exist_ok=True)

    df = fetch_klines(args.symbol, args.interval, args.limit)
    merged = merge_master(master, df)
    merged.to_excel(master, index=False)
    print(f"OK: wrote {master} rows={len(merged)} last_date={merged['日期'].dropna().astype(int).max()}")

if __name__ == "__main__":
    main()
