# -*- coding: utf-8 -*-
"""
K線西遊記/tools/tx_btc_convert.py
TX + BTC 轉檔總控（Stable FINAL｜貼上就能跑）

✅ 目標（你要的規則）
- TX：
  - 讀：K線西遊記/kline-taifex/raw/*.csv
  - 呼叫你既有的 TX pipeline
  - 更新：K線西遊記/kline-taifex/master/台指近全.xlsx
  - TX pipeline 找不到 / raw 沒檔 → 只印訊息，略過，不讓 workflow 掛掉

- BTC：
  - BTC raw 路徑：K線西遊記/kline-btc/raw/
  - BTC master 固定檔名：K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx（檔名固定，但內容可累加不限 1000 根）
  - 規則：優先吃 raw（你手機手動抓的 6cols xlsx/csv，例如 BTCUSDT_1d_1000_6cols_20260126.xlsx）
  - raw 沒檔 → 自動抓 Binance BTCUSDT 1d（limit=1000）
  - Binance 抓不到（例如 451）→ 只印訊息，略過 BTC，不影響 TX

✅ 用法（Actions / 本機都一致）
python K線西遊記/tools/tx_btc_convert.py \
  --tx_raw_dir K線西遊記/kline-taifex/raw \
  --tx_pipeline K線西遊記/kline-taifex/scripts/tx_full_day_pipeline_v882_UTF8BOM.py \
  --tx_master K線西遊記/kline-taifex/master/台指近全.xlsx \
  --btc_raw_dir K線西遊記/kline-btc/raw \
  --btc_master K線西遊記/kline-btc/master/BTCUSDT_1d_1000.xlsx
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Optional

import pandas as pd


# ---------------- TX ----------------
def run_tx_pipeline(tx_pipeline: Path, tx_raw_dir: Path, tx_master: Path) -> None:
    try:
        tx_raw_dir.mkdir(parents=True, exist_ok=True)
        tx_master.parent.mkdir(parents=True, exist_ok=True)

        csvs = sorted(tx_raw_dir.glob("*.csv"))
        if not csvs:
            print("[tx_btc_convert] TX raw empty -> skip TX")
            return

        if not tx_pipeline.exists():
            print(f"[tx_btc_convert] TX pipeline not found: {tx_pipeline} -> skip TX")
            return

        cmd = [sys.executable, str(tx_pipeline)] + [str(p) for p in csvs] + ["--master", str(tx_master)]
        print("[tx_btc_convert] run TX pipeline:")
        print(" ", " ".join(cmd))
        subprocess.check_call(cmd)

    except Exception as e:
        # TX 任何錯誤都不讓整條掛掉（Stable）
        print(f"[tx_btc_convert] TX failed -> skip. err={e}")


# ---------------- BTC helpers ----------------
def _read_any(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path)


def _normalize_btc(df: pd.DataFrame) -> pd.DataFrame:
    """
    輸出固定 6 欄：date, open, high, low, close, volume
    支援：
    - 你手機 6cols 檔（date/open/high/low/close/volume）
    - Binance klines（open_time/open/high/low/close/volume）
    - 其他自備（date/日期 + OHLCV）
    """
    cols = {str(c).lower(): c for c in df.columns}

    # (1) 已是 6cols
    if all(k in cols for k in ["date", "open", "high", "low", "close", "volume"]):
        out = df.copy()
        out["date"] = pd.to_datetime(out[cols["date"]], errors="coerce").dt.strftime("%Y-%m-%d")
        for k in ["open", "high", "low", "close", "volume"]:
            out[k] = pd.to_numeric(out[cols[k]], errors="coerce")
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # (2) open_time（Binance klines）
    if "open_time" in cols and all(k in cols for k in ["open", "high", "low", "close", "volume"]):
        out = df.copy()
        # open_time 可能是 ms 或字串時間
        s = df[cols["open_time"]]
        if pd.api.types.is_numeric_dtype(s):
            out["date"] = pd.to_datetime(s, unit="ms", utc=True, errors="coerce").dt.strftime("%Y-%m-%d")
        else:
            out["date"] = pd.to_datetime(s, errors="coerce").dt.strftime("%Y-%m-%d")
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


def _pick_latest_raw_file(btc_raw_dir: Path) -> Optional[Path]:
    """
    取最新 raw 檔：
    - 支援你手動檔名：BTCUSDT_1d_1000_6cols_YYYYMMDD.xlsx / csv
    - 若檔名有 YYYYMMDD → 以日期優先
    - 否則以 mtime
    """
    files: list[Path] = []
    for ext in ("*.xlsx", "*.xls", "*.csv"):
        files += list(btc_raw_dir.glob(ext))
    if not files:
        return None

    import re

    def key(p: Path):
        m = re.search(r"(\d{8})", p.name)
        ymd = int(m.group(1)) if m else 0
        try:
            mt = p.stat().st_mtime
        except Exception:
            mt = 0
        return (ymd, mt, p.name)

    files.sort(key=key)
    return files[-1]


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
    # normalize 會處理 open_time
    return df


def update_btc_master(btc_raw_dir: Path, btc_master: Path) -> None:
    try:
        btc_raw_dir.mkdir(parents=True, exist_ok=True)
        btc_master.parent.mkdir(parents=True, exist_ok=True)

        df_new: Optional[pd.DataFrame] = None

        # 1) 先吃 raw
        raw = _pick_latest_raw_file(btc_raw_dir)
        if raw is not None:
            print(f"[tx_btc_convert] BTC raw detected: {raw.name}")
            df_new = _normalize_btc(_read_any(raw))
        else:
            # 2) raw 沒檔 → 抓 Binance
            try:
                print("[tx_btc_convert] BTC raw empty -> fetch Binance BTCUSDT 1d (limit=1000)")
                df_api = _fetch_binance_1d_1000("BTCUSDT", 1000)
                df_new = _normalize_btc(df_api)
            except Exception as e:
                print(f"[tx_btc_convert] Binance fetch failed -> skip BTC. err={e}")
                return

        if df_new is None or df_new.empty:
            print("[tx_btc_convert] BTC new data empty -> skip BTC")
            return

        # 3) 讀舊 master（沒有也沒關係）
        if btc_master.exists():
            try:
                df_old = _normalize_btc(pd.read_excel(btc_master))
            except Exception:
                df_old = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])
        else:
            df_old = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])

        # 4) 合併：累加不限 1000 根、去重、排序
        df = pd.concat([df_old, df_new], ignore_index=True)
        df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"], keep="last").sort_values("date")

        df.to_excel(btc_master, index=False)
        print(f"[tx_btc_convert] BTC master updated: {btc_master} rows={len(df)}")

    except Exception as e:
        # BTC 任何錯誤都不讓整條掛掉（Stable）
        print(f"[tx_btc_convert] BTC failed -> skip. err={e}")


# ---------------- main ----------------
def main() -> None:
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
```0
