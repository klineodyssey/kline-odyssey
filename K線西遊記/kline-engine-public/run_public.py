#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Public entry (safe wrapper)

目標：
- public repo 只放這個入口，不放核心引擎碼
- workflow 解壓 ENGINE_ZIP_B64.zip 到 engine_bin/
- 本入口負責：
  1) 自動尋找 engine_bin/ 內的引擎入口 .py（launcher/step1/啟動器…）
  2) 用多種參數格式嘗試執行（--input / --master / 位置參數）
  3) 把輸出寫到 outdir
"""

import argparse
import os
import sys
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple


PREFERRED_KEYWORDS = [
    "啟動西遊記運算",
    "launcher",
    "step1",
    "Tplus1_pm500_step1",
    "多空運算",
    "整合",
    "花果山",
]


def _score_path(p: Path) -> Tuple[int, int]:
    """
    分數越高越優先：
    - 命中關鍵字越多越高
    - 路徑越短（越靠近根）越高
    """
    s = 0
    name = p.name
    for k in PREFERRED_KEYWORDS:
        if k.lower() in name.lower():
            s += 10
    depth = len(p.parts)
    return (s, -depth)


def find_engine_entry(engine_dir: Path) -> Optional[Path]:
    if not engine_dir.exists():
        return None

    candidates = []
    for p in engine_dir.rglob("*.py"):
        # 排除明顯不是入口的
        if p.name.startswith("_"):
            continue
        if p.name in ("setup.py",):
            continue
        candidates.append(p)

    if not candidates:
        return None

    # 先挑「看起來最像入口」的
    candidates.sort(key=_score_path, reverse=True)

    # 最低保障：至少要有 launcher/step1/啟動器 其中之一，否則很可能抓到錯檔
    for p in candidates[:50]:
        n = p.name.lower()
        if ("launcher" in n) or ("step1" in n) or ("啟動" in p.name) or ("tplus1_pm500_step1" in n):
            return p

    # 退而求其次：就回傳最高分那個
    return candidates[0]


def run_with_variants(entry: Path, master: Path, outdir: Path) -> None:
    """
    引擎參數在不同版本可能不一樣，所以這裡做「多套參數」逐一嘗試：
    1) --input MASTER --outdir OUT
    2) --master MASTER --outdir OUT
    3) positional: MASTER OUT
    4) positional: MASTER --outdir OUT
    """

    exe = sys.executable
    attempts: List[List[str]] = [
        [exe, str(entry), "--input", str(master), "--outdir", str(outdir)],
        [exe, str(entry), "--master", str(master), "--outdir", str(outdir)],
        [exe, str(entry), str(master), str(outdir)],
        [exe, str(entry), str(master), "--outdir", str(outdir)],
    ]

    last_err = None

    for i, cmd in enumerate(attempts, 1):
        print(f"[run_public] try#{i}: {' '.join(cmd)}", flush=True)
        p = subprocess.run(cmd, capture_output=True, text=True)
        print(p.stdout, end="")
        if p.returncode == 0:
            print(f"[run_public] OK (try#{i})", flush=True)
            return

        # 印出錯誤給 Actions log 看
        err = p.stderr.strip()
        if err:
            print(err, file=sys.stderr)
        last_err = (i, p.returncode, err)

    i, code, err = last_err if last_err else (-1, 1, "unknown")
    raise SystemExit(f"[run_public] engine failed after {len(attempts)} tries. last_try={i} exit_code={code}\n{err}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="path to 台指近全.xlsx")
    ap.add_argument("--engine_dir", required=True, help="directory where engine zip was unzipped (e.g. engine_bin)")
    ap.add_argument("--outdir", required=True, help="output directory to write results")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] outdir={outdir}")

    if not master.exists():
        raise SystemExit(f"[run_public] MASTER not found: {master}")

    if not engine_dir.exists():
        raise SystemExit(f"[run_public] ENGINE_DIR not found: {engine_dir}")

    outdir.mkdir(parents=True, exist_ok=True)

    entry = find_engine_entry(engine_dir)
    if not entry:
        raise SystemExit("[run_public] 找不到引擎入口檔：請確認 Release 的 ENGINE_ZIP_B64.zip 內含 launcher/step1/啟動器 .py")

    print(f"[run_public] entry={entry}")
    run_with_variants(entry, master, outdir)


if __name__ == "__main__":
    main()
