# -*- coding: utf-8 -*-
"""
Binance Klines downloader (BTCUSDT 1d)
- GitHub Actions 直接從 Binance 公開 API 抓最新 1d K 線
- 依賴：requests, pandas
"""
from __future__ import annotations

import pandas as pd
import requests

BINANCE_BASE = "https://api.binance.com"

def fetch_binance_klines_1d(symbol: str = "BTCUSDT", interval: str = "1d", limit: int = 1000) -> pd.DataFrame:
    url = f"{BINANCE_BASE}/api/v3/klines"
    r = requests.get(url, params={"symbol": symbol, "interval": interval, "limit": limit}, timeout=30)
    r.raise_for_status()
    data = r.json()
    cols = ["open_time","open","high","low","close","volume","close_time","quote_volume",
            "num_trades","taker_buy_base","taker_buy_quote","ignore"]
    df = pd.DataFrame(data, columns=cols)
    # type conversions
    for c in ["open","high","low","close","volume","quote_volume","taker_buy_base","taker_buy_quote"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    df["close_time"] = pd.to_datetime(df["close_time"], unit="ms", utc=True)
    return df
