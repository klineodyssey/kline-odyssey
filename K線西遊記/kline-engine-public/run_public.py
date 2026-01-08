# -*- coding: utf-8 -*-
"""
Public runner (safe)
- 這支檔案可以公開：只負責「呼叫核心引擎」並把輸出放到 outdir
- 核心引擎放在 engine_dir（由 GitHub Actions 下載解壓後提供）
"""

from __future__ import annotations
import argparse
import os
import sys
import subprocess
from pathlib import Path


def _must_exist(p: Path, label: str):
    if not p.exists():
        raise SystemExit(f"[ERROR] {label} not found: {p}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="input master xlsx, e.g. 台指近全.xlsx")
    ap.add_argument("--engine_dir", required=True, help="directory that contains the private engine files")
    ap.add_argument("--outdir", required=True, help="output directory")
    args = ap.parse_args()

    master = Path(args.master).resolve()
    engine_dir = Path(args.engine_dir).resolve()
    outdir = Path(args.outdir).resolve()

    _must_exist(master, "MASTER")
    _must_exist(engine_dir, "ENGINE_DIR")
    outdir.mkdir(parents=True, exist_ok=True)

    # 你私有引擎解壓後，通常會有一個入口 python 檔，例如 engine_main.py
    # 下面我做「自動尋找」：依序找常見入口檔名，找不到就列出檔案讓你看 log
    candidates = [
        engine_dir / "engine_main.py",
        engine_dir / "main.py",
        engine_dir / "run.py",
        engine_dir / "app.py",
        engine_dir / "entry.py",
        engine_dir / "啟動西遊記運算.py",
        engine_dir / "啟動西遊記運算_全版本整合_V3.1_花果山紀錄版.py",
    ]
    entry = next((p for p in candidates if p.exists()), None)

    if entry is None:
        # 列出 engine_dir 內容，方便你從 Actions log 看到實際檔名
        files = "\n".join([str(p.name) for p in sorted(engine_dir.glob("**/*")) if p.is_file()])
        raise SystemExit(
            "[ERROR] Cannot find engine entry file in engine_dir.\n"
            f"ENGINE_DIR={engine_dir}\n"
            "Files:\n" + files
        )

    # 這裡用 subprocess 去跑你的私有引擎
    # 你私有引擎如果參數不同，就把下面參數改成你私有引擎吃的格式
    cmd = [
        sys.executable,
        str(entry),
        "--master", str(master),
        "--outdir", str(outdir),
    ]

    # 若你要用 KLINE_ENGINE_KEY 做授權檢查，私有引擎自行讀 env 即可
    print(f"[INFO] Running engine: {entry}")
    print(f"[INFO] CMD: {' '.join(cmd)}")
    subprocess.check_call(cmd)

    print(f"[OK] Done. Output dir: {outdir}")


if __name__ == "__main__":
    main()
  
