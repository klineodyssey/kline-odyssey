# -*- coding: utf-8 -*-
"""
K線西遊記 · Autopilot 狀態接口（Unified Interface）
write_status.py

【這支程式是做什麼】
- 產生「跨專案可串接」的狀態檔：status.json
- 讓別頁／別模組（自動影片輸出、官網抓最新、YouTube 同步、Telegram/LINE 推播…）
  不需要理解你的內部流程，只要讀 status.json 就知道：
  - TX/BTC master 是否存在、最後日期、資料筆數
  - 引擎是否啟用、是否成功
  - outputs 目錄是否有新輸出、最新輸出檔時間
  - 這次 Autopilot 的基本狀態（成功/失敗/部分成功）

【它跟哪些程式有關】
- GitHub Actions: .github/workflows/autopilot_all.yml
  會在轉檔/運算後呼叫本程式
- 轉檔器：K線西遊記/tools/tx_btc_convert.py
  轉出 master 檔（TX_MASTER / BTC_MASTER）
- 公開引擎入口：K線西遊記/kline-engine-public/run_public.py
  產出 outputs（OUTDIR_TX / OUTDIR_BTC）

【注意事項】
- 這支只寫 status.json，不會改任何 master、也不會執行引擎。
- 就算某些檔案不存在，也會產出 status.json（把狀態寫成 missing），
  讓外部模組能「有檔可讀」而不爆炸。

【輸出位置（固定接口）】
- K線西遊記/kline-engine-public/status/status.json
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import pandas as pd


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _safe_stat(p: Path) -> Dict[str, Any]:
    if not p.exists():
        return {"exists": False}
    st = p.stat()
    return {
        "exists": True,
        "size_bytes": int(st.st_size),
        "mtime_utc": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }


def _find_latest_file(dir_path: Path) -> Optional[Path]:
    if not dir_path.exists():
        return None
    files = [p for p in dir_path.rglob("*") if p.is_file()]
    if not files:
        return None
    files.sort(key=lambda p: (p.stat().st_mtime, p.name))
    return files[-1]


def _read_excel_last_date_and_rows(xlsx: Path, date_col_candidates: Tuple[str, ...]) -> Tuple[Optional[str], int, Optional[str]]:
    """
    回傳：
      - last_date (ISO yyyy-mm-dd or yyyymmdd string) 盡量標準化
      - rows
      - date_col_used
    """
    try:
        df = pd.read_excel(xlsx)
    except Exception:
        return None, 0, None

    rows = int(len(df))
    if rows == 0:
        return None, 0, None

    date_col = None
    for c in date_col_candidates:
        if c in df.columns:
            date_col = c
            break

    if date_col is None:
        return None, rows, None

    s = df[date_col]

    # 嘗試轉成 datetime
    last_val = None
    try:
        dt = pd.to_datetime(s, errors="coerce")
        dt = dt.dropna()
        if len(dt) > 0:
            last_val = dt.iloc[-1].date().isoformat()
            return last_val, rows, date_col
    except Exception:
        pass

    # 退而求其次：字串取最後一筆
    try:
        ss = s.astype(str).dropna()
        if len(ss) > 0:
            last_val = ss.iloc[-1]
            return str(last_val), rows, date_col
    except Exception:
        pass

    return None, rows, date_col


def _build_master_info(path: Path, kind: str) -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "kind": kind,
        "path": str(path).replace("\\", "/"),
        "file": _safe_stat(path),
        "rows": 0,
        "last_date": None,
        "date_col": None,
    }

    if not path.exists():
        return info

    if kind == "TX":
        # 台指主檔欄位固定：交易日期
        last_date, rows, used = _read_excel_last_date_and_rows(path, ("交易日期", "date", "Date"))
        info["rows"] = rows
        info["last_date"] = last_date
        info["date_col"] = used
        return info

    # BTC：你標準化後是 date
    last_date, rows, used = _read_excel_last_date_and_rows(path, ("date", "Date", "日期"))
    info["rows"] = rows
    info["last_date"] = last_date
    info["date_col"] = used
    return info


def _build_output_info(outdir: Path) -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "path": str(outdir).replace("\\", "/"),
        "exists": outdir.exists(),
        "latest_file": None,
        "latest_file_stat": None,
    }
    latest = _find_latest_file(outdir)
    if latest is not None:
        info["latest_file"] = str(latest).replace("\\", "/")
        info["latest_file_stat"] = _safe_stat(latest)
    return info


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_master", required=True)
    ap.add_argument("--outdir_tx", required=True)
    ap.add_argument("--outdir_btc", required=True)

    # 由 workflow 帶入（沒有也行）
    ap.add_argument("--tx_updated", default="0")
    ap.add_argument("--btc_updated", default="0")
    ap.add_argument("--btc_source", default="unknown")  # raw / api / unknown
    ap.add_argument("--engine_enabled", default="0")
    ap.add_argument("--engine_ok", default="0")

    # 可選：覆寫輸出位置
    ap.add_argument("--status_dir", default="K線西遊記/kline-engine-public/status")
    ap.add_argument("--status_file", default="status.json")
    args = ap.parse_args()

    tx_master = Path(args.tx_master)
    btc_master = Path(args.btc_master)
    outdir_tx = Path(args.outdir_tx)
    outdir_btc = Path(args.outdir_btc)

    status_dir = Path(args.status_dir)
    status_dir.mkdir(parents=True, exist_ok=True)
    status_path = status_dir / args.status_file

    tx_info = _build_master_info(tx_master, "TX")
    btc_info = _build_master_info(btc_master, "BTC")
    out_tx_info = _build_output_info(outdir_tx)
    out_btc_info = _build_output_info(outdir_btc)

    # 摘要狀態：外部模組最愛讀的 key
    ok_tx = bool(tx_info["file"]["exists"])
    ok_btc = bool(btc_info["file"]["exists"])
    engine_enabled = str(args.engine_enabled).strip() in ("1", "true", "True", "yes", "YES")
    engine_ok = str(args.engine_ok).strip() in ("1", "true", "True", "yes", "YES")

    # 只要 TX 或 BTC 其中之一有 master，就算資料層成功
    data_ok = ok_tx or ok_btc
    overall = "ok" if (data_ok and (not engine_enabled or engine_ok)) else ("partial" if data_ok else "fail")

    payload: Dict[str, Any] = {
        "schema": "kline-autopilot-status-v1",
        "generated_utc": _utc_now_iso(),
        "overall": overall,
        "data_ok": data_ok,
        "engine": {
            "enabled": engine_enabled,
            "ok": engine_ok,
        },
        "update_flags": {
            "tx_updated": str(args.tx_updated).strip(),
            "btc_updated": str(args.btc_updated).strip(),
            "btc_source": str(args.btc_source).strip(),  # unknown/raw/api
        },
        "masters": {
            "tx": tx_info,
            "btc": btc_info,
        },
        "outputs": {
            "tx": out_tx_info,
            "btc": out_btc_info,
        },
        "interfaces": {
            "status_json": str(status_path).replace("\\", "/"),
            "tx_master": str(tx_master).replace("\\", "/"),
            "btc_master": str(btc_master).replace("\\", "/"),
            "outdir_tx": str(outdir_tx).replace("\\", "/"),
            "outdir_btc": str(outdir_btc).replace("\\", "/"),
        },
    }

    # 寫檔（UTF-8）
    status_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[write_status] wrote: {status_path}")
    print(f"[write_status] overall={overall} data_ok={data_ok} engine_enabled={engine_enabled} engine_ok={engine_ok}")


if __name__ == "__main__":
    main()
