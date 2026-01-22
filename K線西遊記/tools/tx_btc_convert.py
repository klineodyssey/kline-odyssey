# -*- coding: utf-8 -*-
"""
TX + BTC 轉檔總控（Stable）

目標：
- TX：把 K線西遊記/kline-taifex/raw/*.csv 用 pipeline 併進 master/台指近全.xlsx（latest）
- BTC：兩種來源（二選一）
  A) 若 K線西遊記/kline-btc/raw/ 放了 CSV / XLSX（你自己丟資料），就合併進 master
  B) 若 raw 目錄沒有任何檔，就自動從 Binance 公開 API 抓 BTCUSDT 1d（需要 requests）

注意：
- 這支只做「資料準備」，不做運算。
- 產出檔案只寫到 master 指定路徑（避免多 copy 多檔名）。
- 修正：避免 cwd 導致 tx_pipeline 路徑被重複（scripts/K線西遊記/...）而找不到檔案。
"""

from __future__ import annotations

import argparse
import os
import sys
import subprocess
from pathlib import Path
from typing import Optional

import pandas as pd


# -------------------------
# Repo Root：用檔案位置推回去
#   .../<repo>/K線西遊記/tools/tx_btc_convert.py
# parents[0]=tools, [1]=K線西遊記, [2]=repo
# -------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]


def _abspath(p: Path) -> Path:
    """把相對路徑（以 repo root 為準）轉成絕對路徑。"""
    p = Path(p)
    if p.is_absolute():
        return p
    return (REPO_ROOT / p).resolve()


def run_tx_pipeline(tx_pipeline: Path, tx_raw_dir: Path, tx_master: Path) -> None:
    tx_pipeline = _abspath(tx_pipeline)
    tx_raw_dir = _abspath(tx_raw_dir)
    tx_master = _abspath(tx_master)

    tx_raw_dir.mkdir(parents=True, exist_ok=True)
    tx_master.parent.mkdir(parents=True, exist_ok=True)

    csvs = sorted(tx_raw_dir.glob("*.csv"))
    if not csvs:
        print("[tx_btc_convert] TX raw empty -> skip TX pipeline")
        return

    if not tx_pipeline.exists():
        raise FileNotFoundError(f"[tx_btc_convert] TX pipeline not found: {tx_pipeline}")

    # 用 sys.executable 避免 python 指到錯版本
    cmd = [sys.executable, str(tx_pipeline)] + [str(p) for p in csvs] + ["--master", str(tx_master)]
    print("[tx_btc_convert] run TX pipeline:", " ".join(cmd))

    # 重要：不要把 cwd 切到 scripts，否則會導致路徑重複錯誤
    subprocess.check_call(cmd, cwd=str(REPO_ROOT))

    # pipeline 會負責更新：
    # - dated：台指近全YYYYMMDD.xlsx
    # - latest：你指定的 --master（台指近全.xlsx）
    if not tx_master.exists():
        raise RuntimeError(f"[tx_btc_convert] TX master not generated: {tx_master}")


def _read_any(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path)


def _normalize_btc(df: pd.DataFrame) -> pd.DataFrame:
    """把各種 BTC 來源整理成標準欄位：date, open, high, low, close, volume"""
    cols = {str(c).lower(): c for c in df.columns}

    # Binance klines downloader 會有 open_time
    if "open_time" in cols:
        out = df.copy()
        out["date"] = pd.to_datetime(out[cols["open_time"]], errors="coerce").dt.date.astype(str)
        for k in ["open", "high", "low", "close", "volume"]:
            src = cols.get(k, cols.get(k.upper(), k))
            out[k] = pd.to_numeric(out[src], errors="coerce") if src in out.columns else pd.NA
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # 常見：date 或 日期
    if "date" in cols:
        dcol = cols["date"]
    elif "日期" in df.columns:
        dcol = "日期"
    else:
        raise ValueError("BTC raw 檔找不到 date/日期 欄位")

    out = df.rename(columns={dcol: "date"}).copy()
    out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.date.astype(str)

    for k in ["open", "high", "low", "close", "volume"]:
        if k in df.columns:
            out[k] = pd.to_numeric(out[k], errors="coerce")
        elif k.upper() in df.columns:
            out[k] = pd.to_numeric(out[k.upper()], errors="coerce")
        else:
            out[k] = pd.to_numeric(out.get(k, pd.NA), errors="coerce")

    return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])


def fetch_binance_klines_1d(symbol: str = "BTCUSDT", interval: str = "1d", limit: int = 1000) -> pd.DataFrame:
    """
    Binance 公開 API 抓 K 線（避免 package import 問題）
    回傳欄位至少包含：open_time, open, high, low, close, volume
    """
    import requests

    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": int(limit)}
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()

    # Binance 回傳格式：
    # [
    #  [ openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, trades, ... ],
    #  ...
    # ]
    rows = []
    for it in data:
        rows.append(
            {
                "open_time": int(it[0]),
                "open": it[1],
                "high": it[2],
                "low": it[3],
                "close": it[4],
                "volume": it[5],
            }
        )
    df = pd.DataFrame(rows)
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True).dt.tz_convert(None)
    return df


def update_btc_master(btc_raw_dir: Path, btc_master: Path) -> None:
    btc_raw_dir = _abspath(btc_raw_dir)
    btc_master = _abspath(btc_master)

    btc_raw_dir.mkdir(parents=True, exist_ok=True)
    btc_master.parent.mkdir(parents=True, exist_ok=True)

    raw_files = sorted(
        list(btc_raw_dir.glob("*.csv"))
        + list(btc_raw_dir.glob("*.xlsx"))
        + list(btc_raw_dir.glob("*.xls"))
    )

    if raw_files:
        newest = raw_files[-1]
        print(f"[tx_btc_convert] BTC raw detected: {newest.name}")
        df_new = _normalize_btc(_read_any(newest))
    else:
        print("[tx_btc_convert] BTC raw empty -> fetch Binance BTCUSDT 1d")
        df_new = _normalize_btc(fetch_binance_klines_1d(symbol="BTCUSDT", interval="1d", limit=1000))

    if btc_master.exists():
        df_old = _normalize_btc(pd.read_excel(btc_master))
    else:
        df_old = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])

    # merge by date (keep newest)
    df = pd.concat([df_old, df_new], ignore_index=True)
    df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"], keep="last").sort_values("date")
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
