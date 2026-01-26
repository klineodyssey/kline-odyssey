# -*- coding: utf-8 -*-
"""
TX + BTC 轉檔總控（Stable+++）

TX：
- 讀 K線西遊記/kline-taifex/raw/*.csv
- 呼叫既有 tx pipeline
- 更新 master/台指近全.xlsx

BTC：
- 優先吃 raw（你手機手動抓的 6cols xlsx/csv 都可以）
  例如：BTCUSDT_1d_1000_6cols_20260126.xlsx
- raw 沒檔時：自動從 Binance 公開 API 抓 BTCUSDT 1d（limit=1000）
- 若 Binance 抓失敗：BTC 略過（不影響 TX）
- BTC master：持續累加、去重、排序（不限 1000 根）

輸出：
- BTC master 固定寫入：K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx
  （檔名固定，內容不限 1000 根）
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Optional

import pandas as pd


# ===== TX pipeline =====
def run_tx_pipeline(tx_pipeline: Path, tx_raw_dir: Path, tx_master: Path) -> None:
    tx_raw_dir.mkdir(parents=True, exist_ok=True)
    tx_master.parent.mkdir(parents=True, exist_ok=True)

    csvs = sorted(tx_raw_dir.glob("*.csv"))
    if not csvs:
        print("[tx_btc_convert] TX raw empty -> skip TX")
        return

    if not tx_pipeline.exists():
        raise FileNotFoundError(f"TX pipeline not found: {tx_pipeline}")

    cmd = [sys.executable, str(tx_pipeline)] + [str(p) for p in csvs] + ["--master", str(tx_master)]
    print("[tx_btc_convert] run TX pipeline:", " ".join(cmd))
    subprocess.check_call(cmd)


# ===== BTC helpers =====
def _read_any(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path)


def _normalize_btc(df: pd.DataFrame) -> pd.DataFrame:
    """
    標準化 BTC 欄位：date, open, high, low, close, volume
    支援：
    - 你手機 6cols 檔（date/open/high/low/close/volume）
    - Binance klines（open_time/open/high/low/close/volume）
    - 一般自備（date/日期 + OHLCV）
    """
    cols = {str(c).lower(): c for c in df.columns}

    # (1) 已是 6cols
    if all(k in cols for k in ["date", "open", "high", "low", "close", "volume"]):
        out = df.copy()
        out["date"] = pd.to_datetime(out[cols["date"]], errors="coerce").dt.strftime("%Y-%m-%d")
        for k in ["open", "high", "low", "close", "volume"]:
            out[k] = pd.to_numeric(out[cols[k]], errors="coerce")
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # (2) open_time 格式（binance klines）
    if "open_time" in cols and all(k in cols for k in ["open", "high", "low", "close", "volume"]):
        out = df.copy()
        out["date"] = pd.to_datetime(out[cols["open_time"]], errors="coerce").dt.strftime("%Y-%m-%d")
        for k in ["open", "high", "low", "close", "volume"]:
            out[k] = pd.to_numeric(out[cols[k]], errors="coerce")
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # (3) 一般 date/日期
    if "date" in cols:
        dcol = cols["date"]
    elif "日期" in df.columns:
        dcol = "日期"
    else:
        raise ValueError("BTC 檔找不到 date/日期 欄位")

    out = df.rename(columns={dcol: "date"}).copy()
    out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.strftime("%Y-%m-%d")

    def pick(name: str) -> pd.Series:
        if name in df.columns:
            return pd.to_numeric(df[name], errors="coerce")
        if name.upper() in df.columns:
            return pd.to_numeric(df[name.upper()], errors="coerce")
        if name.lower() in cols:
            return pd.to_numeric(df[cols[name.lower()]], errors="coerce")
        return pd.Series([pd.NA] * len(df))

    out["open"] = pick("open")
    out["high"] = pick("high")
    out["low"] = pick("low")
    out["close"] = pick("close")
    out["volume"] = pick("volume")

    return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])


def _fetch_binance_1d_1000(symbol: str = "BTCUSDT", limit: int = 1000) -> pd.DataFrame:
    import requests

    url = "https://api.binance.com/api/v3/klines"
    r = requests.get(url, params={"symbol": symbol, "interval": "1d", "limit": limit}, timeout=30)
    r.raise_for_status()
    data = r.json()

    cols = [
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "num_trades",
        "taker_buy_base", "taker_buy_quote", "ignore"
    ]
    df = pd.DataFrame(data, columns=cols)
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    for c in ["open", "high", "low", "close", "volume"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def _pick_latest_raw_file(btc_raw_dir: Path) -> Optional[Path]:
    # 接受你手動檔名：BTCUSDT_1d_1000_6cols_YYYYMMDD.xlsx / csv
    files = []
    for ext in ("*.xlsx", "*.xls", "*.csv"):
        files += list(btc_raw_dir.glob(ext))
    if not files:
        return None

    # 以檔名中的 YYYYMMDD 優先，其次用 mtime
    def key(p: Path):
        import re, os, time
        m = re.search(r"(\d{8})", p.name)
        ymd = int(m.group(1)) if m else 0
        try:
            mt = p.stat().st_mtime
        except Exception:
            mt = 0
        return (ymd, mt, p.name)

    files.sort(key=key)
    return files[-1]


def update_btc_master(btc_raw_dir: Path, btc_master: Path) -> None:
    btc_raw_dir.mkdir(parents=True, exist_ok=True)
    btc_master.parent.mkdir(parents=True, exist_ok=True)

    # 先吃 raw
    raw = _pick_latest_raw_file(btc_raw_dir)
    df_new: Optional[pd.DataFrame] = None

    if raw is not None:
        print(f"[tx_btc_convert] BTC raw detected: {raw.name}")
        df_new = _normalize_btc(_read_any(raw))
    else:
        # raw 沒檔 → 抓 Binance
        try:
            print("[tx_btc_convert] BTC raw empty -> fetch Binance BTCUSDT 1d (limit=1000)")
            df_api = _fetch_binance_1d_1000(symbol="BTCUSDT", limit=1000)
            df_new = _normalize_btc(df_api)
        except Exception as e:
            print(f"[tx_btc_convert] Binance fetch failed -> skip BTC. err={e}")
            return

    if df_new is None or df_new.empty:
        print("[tx_btc_convert] BTC new data empty -> skip BTC")
        return

    if btc_master.exists():
        try:
            df_old = _normalize_btc(pd.read_excel(btc_master))
        except Exception:
            df_old = pd.DataFrame(columns=["date","open","high","low","close","volume"])
    else:
        df_old = pd.DataFrame(columns=["date","open","high","low","close","volume"])

    # 合併：去重、排序（不限 1000 根）
    df = pd.concat([df_old, df_new], ignore_index=True)
    df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"], keep="last").sort_values("date")

    btc_master.parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(btc_master, index=False)
    print(f"[tx_btc_convert] BTC master updated: {btc_master} rows={len(df)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_raw_dir", required=True)
    ap.add_argument("--tx_pipeline", required=True)
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_raw_dir", required=True)
    ap.add_argument("--btc_master", required=True)
    args = ap.parse_args()

    run_tx_pipeline(Path(args.tx_pipeline), Path(args.tx_raw_dir), Path(args.tx_master))
    update_btc_master(Path(args.btc_raw_dir), Path(args.btc_master))


if __name__ == "__main__":
    main()
