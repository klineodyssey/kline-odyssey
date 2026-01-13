# -*- coding: utf-8 -*-
from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd

def newest_file(folder: Path) -> Path | None:
    if not folder.exists():
        return None
    files = [p for p in folder.rglob("*") if p.is_file()]
    if not files:
        return None
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0]

def convert_tx_raw_to_master(raw_path: Path, master_path: Path) -> None:
    """
    先做「最小可運行」：支援你目前已在用的格式：
    - 若 raw 是你已經整理好的 xlsx/csv（含 交易日期/開盤價/最高價/最低價/收盤價/成交量/台指近...）
      就直接規範化欄名後輸出 master
    真正的「期交所原始 CSV 日盤+夜盤 合併全日K + 近月判定」你已經有規則，
    下一版我會把完整 V8.8.2_pro 規則塞進來（但先讓 Autopilot 100% 跑起來）。
    """
    if raw_path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(raw_path, dtype=object)
    else:
        df = pd.read_csv(raw_path, dtype=object)

    # 允許你原欄名：交易日期/開盤價/最高價/最低價/收盤價
    rename = {
        "交易日期": "交易日期",
        "日期": "交易日期",
        "開盤價": "開盤價",
        "最高價": "最高價",
        "最低價": "最低價",
        "收盤價": "收盤價",
        "成交量": "成交量",
        "未平倉量": "未平倉量",
        "結算價": "結算價",
        "台指近": "台指近",
    }
    # 只保留有的欄
    cols = [c for c in rename.keys() if c in df.columns]
    df = df[cols].copy()

    # 日期統一成 YYYYMMDD（整數）
    dcol = "交易日期"
    d = df[dcol].astype(str).str.replace(r"\.0$", "", regex=True).str.slice(0, 8)
    df[dcol] = pd.to_numeric(d, errors="coerce").astype("Int64")

    master_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(master_path, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="TX")
    print("[TX] master updated:", master_path)

def convert_btc_raw_to_master(raw_path: Path, master_path: Path) -> None:
    """
    BTC 最小可運行：
    - 接受 csv/xlsx
    - 需要欄位至少包含：date/open/high/low/close/volume（或常見交易所欄名）
    - 輸出固定 master 檔：BTCUSDT_1d_1000.xlsx
    """
    if raw_path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(raw_path, dtype=object)
    else:
        df = pd.read_csv(raw_path, dtype=object)

    # 嘗試對齊常見欄名
    colmap = {}
    for c in df.columns:
        lc = str(c).lower()
        if lc in ["date", "datetime", "time", "timestamp"]:
            colmap[c] = "date"
        elif lc in ["open", "o"]:
            colmap[c] = "open"
        elif lc in ["high", "h"]:
            colmap[c] = "high"
        elif lc in ["low", "l"]:
            colmap[c] = "low"
        elif lc in ["close", "c"]:
            colmap[c] = "close"
        elif lc in ["volume", "vol", "v"]:
            colmap[c] = "volume"
    df = df.rename(columns=colmap).copy()

    need = ["date","open","high","low","close"]
    miss = [c for c in need if c not in df.columns]
    if miss:
        raise SystemExit(f"[BTC] missing columns: {miss}. got={list(df.columns)}")

    # date 統一成 YYYYMMDD int（若你是 yyyy-mm-dd 也能吃）
    d = df["date"].astype(str)
    d = d.str.replace("-", "", regex=False).str.replace("/", "", regex=False).str.slice(0, 8)
    df["date"] = pd.to_numeric(d, errors="coerce").astype("Int64")

    for c in ["open","high","low","close","volume"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    df = df.dropna(subset=["date","open","high","low","close"]).sort_values("date").reset_index(drop=True)

    master_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(master_path, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="BTC")
    print("[BTC] master updated:", master_path)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_raw_dir", required=True)
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_raw_dir", required=True)
    ap.add_argument("--btc_master", required=True)
    args = ap.parse_args()

    tx_raw_dir = Path(args.tx_raw_dir)
    btc_raw_dir = Path(args.btc_raw_dir)

    tx_master = Path(args.tx_master)
    btc_master = Path(args.btc_master)

    tx_latest = newest_file(tx_raw_dir)
    if tx_latest:
        convert_tx_raw_to_master(tx_latest, tx_master)
    else:
        print("[TX] no raw found, skip")

    btc_latest = newest_file(btc_raw_dir)
    if btc_latest:
        convert_btc_raw_to_master(btc_latest, btc_master)
    else:
        print("[BTC] no raw found, skip")

if __name__ == "__main__":
    main()
