# -*- coding: utf-8 -*-
"""
TX + BTC 轉檔總控（Stable++ 修好版）

目標：
- TX：把 K線西遊記/kline-taifex/raw/*.csv 用指定 pipeline 併進 master/台指近全.xlsx
- BTC：兩種來源（二選一）
  A) 若 K線西遊記/kline-btc/raw/ 放了 CSV / XLSX（你自己丟資料），就合併進 master
  B) 若 raw 目錄沒有任何檔，就自動從 Binance 公開 API 抓 BTCUSDT 1d（需要 requests）

注意：
- 這支只做「資料準備」，不做運算。
- 產出檔案只寫到 master 指定路徑（避免多 copy 多檔名）。
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
import subprocess
from pathlib import Path

import pandas as pd


# ===== Repo Root（確保在 Actions / local 都可用）=====
THIS = Path(__file__).resolve()
REPO_ROOT = THIS.parents[2]  # .../K線西遊記/tools/ -> repo root
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ===== TX master 19欄（用來建立空 master，避免 workflow test -f 失敗）=====
TX_HEADERS19 = [
    "交易日期","契約","到期月份(週別)","開盤價","最高價","最低價","收盤價",
    "漲跌價","漲跌%","成交量","結算價","未沖銷契約數","最後最佳買價","最後最佳賣價",
    "歷史最高價","歷史最低價","是否因訊息面暫停交易","交易時段","價差對單式委託成交量"
]


def _ensure_empty_tx_master(tx_master: Path) -> None:
    """若 TX master 不存在，建立空的 19欄 Excel，避免 workflow 直接炸。"""
    tx_master.parent.mkdir(parents=True, exist_ok=True)
    if tx_master.exists():
        return
    df = pd.DataFrame(columns=TX_HEADERS19)
    df.to_excel(tx_master, index=False, sheet_name="台指近全")
    print(f"[tx_btc_convert] created empty TX master: {tx_master}")


def run_tx_pipeline(tx_pipeline: Path, tx_raw_dir: Path, tx_master: Path) -> None:
    tx_raw_dir.mkdir(parents=True, exist_ok=True)
    tx_master.parent.mkdir(parents=True, exist_ok=True)

    # 無 raw 檔時：仍要確保 master 存在（workflow 會 test -f）
    csvs = sorted(tx_raw_dir.glob("*.csv"))
    if not csvs:
        print("[tx_btc_convert] TX raw empty -> skip TX pipeline")
        _ensure_empty_tx_master(tx_master)
        return

    if not tx_pipeline.exists():
        print(f"[tx_btc_convert] TX pipeline not found -> skip TX pipeline: {tx_pipeline}")
        _ensure_empty_tx_master(tx_master)
        return

    cmd = [sys.executable, str(tx_pipeline)] + [str(p) for p in csvs] + ["--master", str(tx_master)]
    print("[tx_btc_convert] run TX pipeline:")
    print(" ", " ".join(cmd))

    # 用 repo root 當 cwd，避免路徑被重組成 K線西遊記/.../K線西遊記/... 的怪 bug
    subprocess.check_call(cmd, cwd=str(REPO_ROOT))

    # pipeline 本身應該會更新 --master 指向的 latest（你 hotfix 版已加）
    # 這裡只做最後保險
    _ensure_empty_tx_master(tx_master)


def _read_any(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path)


def _normalize_btc(df: pd.DataFrame) -> pd.DataFrame:
    """
    標準化 BTC 欄位：date, open, high, low, close, volume
    支援：
    - 你自備資料（date/日期 + OHLCV）
    - Binance klines（含 open_time）
    - 任何大小寫欄位
    """
    cols = {str(c).lower(): c for c in df.columns}

    # 1) 已是標準 6 欄
    if all(k in cols for k in ["date", "open", "high", "low", "close", "volume"]):
        out = df.rename(columns={cols["date"]: "date"}).copy()
        out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.strftime("%Y-%m-%d")
        for k in ["open", "high", "low", "close", "volume"]:
            out[k] = pd.to_numeric(out[cols[k]], errors="coerce")
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # 2) open_time 格式（Binance 原始 klines）
    if "open_time" in cols:
        out = df.copy()
        out["date"] = pd.to_datetime(out[cols["open_time"]], errors="coerce").dt.strftime("%Y-%m-%d")
        for k in ["open", "high", "low", "close", "volume"]:
            # 可能是小寫欄或大寫欄
            key = cols.get(k, cols.get(k.upper().lower(), k))
            out[k] = pd.to_numeric(out.get(key, pd.NA), errors="coerce")
        return out[["date", "open", "high", "low", "close", "volume"]].dropna(subset=["date"])

    # 3) 一般 date / 日期
    if "date" in cols:
        dcol = cols["date"]
    elif "日期" in df.columns:
        dcol = "日期"
    else:
        raise ValueError("BTC raw 檔找不到 date/日期 欄位")

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


def _load_fetch_binance() -> object:
    """
    用檔案路徑載入 btc_fetch_binance.py，避免 package import 失敗（Actions 常見）。
    期待路徑：K線西遊記/tools/btc_fetch_binance.py
    """
    mod_path = REPO_ROOT / "K線西遊記" / "tools" / "btc_fetch_binance.py"
    if not mod_path.exists():
        raise FileNotFoundError(f"btc_fetch_binance.py not found: {mod_path}")

    spec = importlib.util.spec_from_file_location("btc_fetch_binance", str(mod_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load module spec: {mod_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[attr-defined]
    return mod


def update_btc_master(btc_raw_dir: Path, btc_master: Path) -> None:
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
        # 沒 raw：用 Binance 抓
        print("[tx_btc_convert] BTC raw empty -> fetch Binance BTCUSDT 1d")
        mod = _load_fetch_binance()
        fetch = getattr(mod, "fetch_binance_klines_1d", None)
        if fetch is None:
            raise AttributeError("btc_fetch_binance.py missing fetch_binance_klines_1d()")
        df_new = fetch(symbol="BTCUSDT", interval="1d", limit=1000)
        df_new = _normalize_btc(df_new)

    if btc_master.exists():
        try:
            df_old = _normalize_btc(pd.read_excel(btc_master))
        except Exception:
            df_old = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])
    else:
        df_old = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])

    df = pd.concat([df_old, df_new], ignore_index=True)
    df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"], keep="last").sort_values("date")
    df.to_excel(btc_master, index=False)
    print(f"[tx_btc_convert] BTC master updated: {btc_master} rows={len(df)}")


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
