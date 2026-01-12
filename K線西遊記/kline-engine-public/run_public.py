#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kline-engine-public/run_public.py

用途：
- GitHub Actions 下載並解壓引擎 zip 到 engine_dir 後
- 本腳本會自動尋找「引擎入口 .py」並執行
- 把 master xlsx 當作 --input 傳入，引擎輸出到 outdir

設計重點：
- 不依賴固定檔名（因為你引擎檔名一直在變）
- 只要 zip 裡有可執行的入口 .py 就能跑起來
"""

import argparse
import os
import sys
import subprocess
from pathlib import Path


def eprint(*a):
    print(*a, file=sys.stderr)


def list_tree(root: Path, max_lines: int = 250):
    """印出資料夾樹狀（最多 max_lines 行）"""
    lines = []
    if not root.exists():
        return ["(missing)"]
    for p in sorted(root.rglob("*")):
        if p.is_file():
            rel = p.relative_to(root).as_posix()
            lines.append(rel)
            if len(lines) >= max_lines:
                lines.append("... (truncated)")
                break
    return lines


def pick_entry(engine_dir: Path) -> Path:
    """
    入口挑選規則（由強到弱）：
    1) 檔名含 step1 / launcher / entry / main
    2) 檔名含 Tplus1 或 pm500 或 多空運算
    3) 任何 .py（排除 __init__.py、測試檔、run_public.py）
    """
    if not engine_dir.exists():
        raise FileNotFoundError(f"engine_dir not found: {engine_dir}")

    py_files = []
    for p in engine_dir.rglob("*.py"):
        name = p.name.lower()
        if name in {"__init__.py"}:
            continue
        if "test" in name or "tests" in p.parts:
            continue
        py_files.append(p)

    if not py_files:
        raise FileNotFoundError("No .py found under engine_dir")

    def score(p: Path) -> int:
        n = p.name.lower()
        s = 0
        # 強關鍵字
        for kw in ["step1", "launcher", "entry", "main"]:
            if kw in n:
                s += 50
        # 你的引擎常見關鍵字
        for kw in ["tplus1", "pm500", "多空", "運算"]:
            if kw in n:
                s += 20
        # 越靠近根目錄越高分（避免被深層雜檔干擾）
        depth = len(p.relative_to(engine_dir).parts)
        s += max(0, 10 - depth)
        return s

    py_files.sort(key=lambda p: (score(p), -p.stat().st_mtime), reverse=True)
    return py_files[0]


def run_entry(entry: Path, master: Path, outdir: Path):
    """
    用最通用的方式呼叫引擎：
    - 優先用 --input（你提供的引擎就是 --input/--outdir）
    - 若引擎不吃 --input，會回傳 exit code !=0，你再看 log 改參數
    """
    cmd = [
        sys.executable,
        str(entry),
        "--input", str(master),
        "--outdir", str(outdir),
    ]
    print(f"[run_public] entry={entry}")
    print(f"[run_public] master={master}")
    print(f"[run_public] outdir={outdir}")
    print(f"[run_public] cmd: {' '.join(cmd)}")
    subprocess.check_call(cmd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="主檔 xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="引擎解壓後資料夾（engine_bin）")
    ap.add_argument("--outdir", required=True, help="輸出資料夾")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        raise FileNotFoundError(f"MASTER not found: {master}")

    outdir.mkdir(parents=True, exist_ok=True)

    # Debug tree（你每次 zip 內容不同，先印出來最保險）
    print("[run_public] engine_dir tree (files):")
    for line in list_tree(engine_dir):
        print("  -", line)

    # 找入口
    try:
        entry = pick_entry(engine_dir)
    except Exception as e:
        eprint("找不到引擎入口檔：請確認 ENGINE_ZIP_B64.zip 解壓後有 .py 檔")
        eprint(str(e))
        sys.exit(1)

    # 跑
    try:
        run_entry(entry, master, outdir)
    except subprocess.CalledProcessError as e:
        eprint(f"引擎執行失敗，exit code={e.returncode}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
