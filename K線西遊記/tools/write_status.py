# -*- coding: utf-8 -*-
"""
寫出統一狀態接口（status.json）
檔案：K線西遊記/tools/write_status.py

【做什麼】
- 讀取 TX / BTC master 的最新日期
- 蒐集 TX / BTC 引擎 outdir 的最新輸出檔
- 紀錄引擎是否啟用 / 是否成功還原
- 產出 JSON：K線西遊記/kline-engine-public/status/status.json
  給別頁（影片組 / 官網 / YouTube 抓取腳本等）串接

【輸入參數】
--tx_master, --btc_master, --outdir_tx, --outdir_btc
--tx_updated, --btc_updated                (0/1)
--btc_source                               ("raw" / "api" / "auto" / "unknown")
--engine_enabled, --engine_ok              ("1"/"0"；若空值當 0)

【注意】
- 所有欄位皆容錯，檔案不存在就寫 null/空
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import pandas as pd


def _latest_date_tx(path: Path) -> Optional[str]:
    if not path.exists():
        return None
    try:
        df = pd.read_excel(path)
        col = "交易日期"
        if col not in df.columns:
            return None
        # 交易日期可能是 int(YYYYMMDD) 或 字串
        s = df[col].astype(str).str.replace(r"[^\d]", "", regex=True).str.slice(0, 8)
        s = s[s.str.len() == 8]
        if s.empty:
            return None
        return "-".join([s.max()[0:4], s.max()[4:6], s.max()[6:8]])
    except Exception:
        return None


def _latest_date_btc(path: Path) -> Optional[str]:
    if not path.exists():
        return None
    try:
        df = pd.read_excel(path)
        if "date" not in df.columns:
            return None
        s = pd.to_datetime(df["date"], errors="coerce", utc=True)
        s = s.dropna()
        if s.empty:
            return None
        return s.max().date().isoformat()
    except Exception:
        return None


def _latest_file_info(d: Path) -> Optional[dict]:
    if not d.exists() or not d.is_dir():
        return None
    files = [p for p in d.rglob("*") if p.is_file()]
    if not files:
        return None
    files.sort(key=lambda p: (p.stat().st_mtime, p.name))
    f = files[-1]
    return {
        "path": str(f),
        "name": f.name,
        "mtime": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
        "size": f.stat().st_size,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_master", required=True)
    ap.add_argument("--outdir_tx", required=True)
    ap.add_argument("--outdir_btc", required=True)
    ap.add_argument("--tx_updated", default="0")
    ap.add_argument("--btc_updated", default="0")
    ap.add_argument("--btc_source", default="unknown")
    ap.add_argument("--engine_enabled", default="0")
    ap.add_argument("--engine_ok", default="0")
    args = ap.parse_args()

    tx_master = Path(args.tx_master)
    btc_master = Path(args.btc_master)
    outdir_tx = Path(args.outdir_tx)
    outdir_btc = Path(args.outdir_btc)

    status_dir = Path("K線西遊記/kline-engine-public/status")
    status_dir.mkdir(parents=True, exist_ok=True)
    status_path = status_dir / "status.json"

    now = datetime.now(tz=timezone.utc).isoformat()

    data = {
        "ts_utc": now,
        "tx": {
            "master": str(tx_master),
            "latest_date": _latest_date_tx(tx_master),
            "out_latest": _latest_file_info(outdir_tx),
            "updated": True if str(args.tx_updated) == "1" else False,
        },
        "btc": {
            "master": str(btc_master),
            "latest_date": _latest_date_btc(btc_master),
            "out_latest": _latest_file_info(outdir_btc),
            "updated": True if str(args.btc_updated) == "1" else False,
            "source": args.btc_source,
        },
        "engine": {
            "enabled": True if str(args.engine_enabled) == "1" else False,
            "ok": True if str(args.engine_ok) == "1" else False,
        },
        "brand": {
            "closing_oath": "PrimeForge 以母機之名，開啟金融生命。 花果山台灣・信念不滅・市場無界。 Where the Market Becomes the Myth. —— 樂天帝 ⌖"
        },
        "interfaces": {
            "status_path": str(status_path),
            "tx_master_path": str(tx_master),
            "btc_master_path": str(btc_master),
            "outdir_tx": str(outdir_tx),
            "outdir_btc": str(outdir_btc),
        },
        "version": "status_iface_v1.0",
    }

    status_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[write_status] OK -> {status_path}")


if __name__ == "__main__":
    main()
