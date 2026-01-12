# -*- coding: utf-8 -*-
"""
kline-engine-public/run_public.py
公開入口：不放核心引擎，只負責在 engine_bin 裡找出「可執行的引擎入口」並呼叫它。

設計目標：
- workflow 永遠只 call 這支檔
- 私有引擎 zip 換版本、檔名改了，只要仍含 launcher.py 或 step1*.py，就能跑
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional, List


def eprint(*args):
    print(*args, file=sys.stderr)


def find_entry(engine_dir: Path) -> Path:
    """
    依優先序找入口：
    1) launcher.py（最穩定，建議你之後引擎都提供這個檔名）
    2) 含 step1 的 .py
    3) 退而求其次：含 'step1' 或 'launcher' 關鍵字的任何 .py
    """
    if not engine_dir.exists():
        raise FileNotFoundError(f"engine_dir not found: {engine_dir}")

    # 1) launcher.py
    launcher = engine_dir / "launcher.py"
    if launcher.is_file():
        return launcher

    # 有些壓縮包會解出一層資料夾，把 engine_dir 當根找
    # 例如 engine_bin/engine/launcher.py
    candidates: List[Path] = []

    # 2) step1*.py
    for p in engine_dir.rglob("*.py"):
        name = p.name.lower()
        if "step1" in name:
            candidates.append(p)

    if candidates:
        # 取路徑最短(最靠近根)者，避免抓到測試檔/舊檔
        candidates.sort(key=lambda x: (len(x.parts), str(x)))
        return candidates[0]

    # 3) fallback: any py with keywords
    fallback: List[Path] = []
    for p in engine_dir.rglob("*.py"):
        name = p.name.lower()
        if ("launcher" in name) or ("step1" in name):
            fallback.append(p)

    if fallback:
        fallback.sort(key=lambda x: (len(x.parts), str(x)))
        return fallback[0]

    # 找不到就列目錄，讓 Actions log 直接顯示內容
    files = [str(p.relative_to(engine_dir)) for p in engine_dir.rglob("*") if p.is_file()]
    files.sort()
    preview = "\n".join(files[:200])
    raise FileNotFoundError(
        "找不到引擎入口檔：請確認 engine zip 內含 launcher.py 或 step1*.py\n"
        f"engine_dir={engine_dir}\n"
        f"files(top200):\n{preview}"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="台指近全.xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="解壓後的引擎資料夾（engine_bin）")
    ap.add_argument("--outdir", required=True, help="輸出資料夾（public/output）")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] outdir={outdir}")

    if not master.is_file():
        raise FileNotFoundError(f"MASTER not found: {master}")

    outdir.mkdir(parents=True, exist_ok=True)

    entry = find_entry(engine_dir)
    print(f"[run_public] entry={entry}")

    # 你之前的引擎 log 顯示參數是 --input / --outdir
    cmd = [
        sys.executable,
        str(entry),
        "--input",
        str(master),
        "--outdir",
        str(outdir),
    ]
    print("[run_public] cmd:")
    print(" ".join(cmd))

    # 讓引擎用自己的工作目錄（entry 所在資料夾），避免相對路徑失敗
    cwd = entry.parent

    r = subprocess.run(cmd, cwd=str(cwd))
    if r.returncode != 0:
        raise SystemExit(r.returncode)

    print("[run_public] done.")


if __name__ == "__main__":
    main()
