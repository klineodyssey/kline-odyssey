# -*- coding: utf-8 -*-
"""
KLINE Autopilot - Status Writer (Unified Interface)

用途：
- 在 workflow 結尾產出 status.json 作為「唯一對外接口」
- 讓其他專案（影片/官網/YT）只讀這個檔就能接續，不互相硬接內部路徑

輸出固定：
K線西遊記/kline-engine-public/status/status.json
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _file_exists(p: str) -> bool:
    try:
        return Path(p).exists()
    except Exception:
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tx_master", required=True)
    ap.add_argument("--btc_master", required=True)
    ap.add_argument("--outdir_tx", required=True)
    ap.add_argument("--outdir_btc", required=True)

    ap.add_argument("--tx_updated", default="0")  # 1/0
    ap.add_argument("--btc_updated", default="0")  # 1/0
    ap.add_argument("--btc_source", default="skip")  # raw/binance_api/skip
    ap.add_argument("--btc_raw_file_used", default="")  # optional
    ap.add_argument("--btc_error", default="")  # optional

    ap.add_argument("--engine_enabled", default="0")  # 1/0
    ap.add_argument("--engine_ok", default="0")  # 1/0
    ap.add_argument("--engine_error", default="")  # optional

    ap.add_argument("--tx_master_dated", default="")  # optional
    args = ap.parse_args()

    status_dir = Path("K線西遊記/kline-engine-public/status")
    status_dir.mkdir(parents=True, exist_ok=True)
    out_path = status_dir / "status.json"

    repo = os.environ.get("GITHUB_REPOSITORY", "")
    branch = os.environ.get("GITHUB_REF_NAME", "")
    commit = os.environ.get("GITHUB_SHA", "")
    run_id = os.environ.get("GITHUB_RUN_ID", "")

    payload = {
        "meta": {
            "run_id": run_id,
            "run_time_utc": _now_utc_iso(),
            "git": {
                "repo": repo,
                "branch": branch,
                "commit": commit,
            },
        },
        "tx": {
            "updated": args.tx_updated == "1",
            "master_latest": args.tx_master,
            "master_dated": args.tx_master_dated or None,
            "exists": _file_exists(args.tx_master),
        },
        "btc": {
            "updated": args.btc_updated == "1",
            "source": args.btc_source,
            "master_latest": args.btc_master,
            "raw_file_used": args.btc_raw_file_used or None,
            "error": args.btc_error or None,
            "exists": _file_exists(args.btc_master),
        },
        "engine": {
            "enabled": args.engine_enabled == "1",
            "ok": args.engine_ok == "1",
            "out_tx_dir": args.outdir_tx if _file_exists(args.outdir_tx) else None,
            "out_btc_dir": args.outdir_btc if _file_exists(args.outdir_btc) else None,
            "error": args.engine_error or None,
        },
    }

    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[write_status] wrote: {out_path}")


if __name__ == "__main__":
    main()
