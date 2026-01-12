#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_public.py (AUTO-ENTRY, STABLE)
用途：在 GitHub Actions 內呼叫引擎（engine_dir），自動找入口 .py 並執行
"""

import argparse
import subprocess
import sys
from pathlib import Path


def list_py(engine_dir: Path):
    return sorted([p for p in engine_dir.rglob("*.py") if p.is_file()])


def pick_entry(engine_dir: Path) -> Path:
    pys = list_py(engine_dir)
    if not pys:
        raise FileNotFoundError(f"[run_public] engine_dir 裡找不到任何 .py：{engine_dir}")

    # 1) 最優先：檔名含 step1
    cands = [p for p in pys if "step1" in p.name.lower()]
    if cands:
        return cands[0]

    # 2) 次優先：launcher / 啟動
    cands = [p for p in pys if ("launcher" in p.name.lower()) or ("啟動" in p.name)]
    if cands:
        return cands[0]

    # 3) 如果只有一支 .py，直接用
    if len(pys) == 1:
        return pys[0]

    # 4) 再退一步：檔名含 多空運算 / Tplus1
    keys = ["多空運算", "tplus1", "pm500"]
    for k in keys:
        cands = [p for p in pys if k.lower() in p.name.lower() or k in p.name]
        if cands:
            return cands[0]

    # 都不符合：直接報錯，並列出前 50 個檔案讓你定位
    preview = "\n".join(str(p) for p in pys[:50])
    raise RuntimeError(
        "[run_public] 找不到可辨識的引擎入口檔。\n"
        f"engine_dir={engine_dir}\n"
        f"已掃描到的 .py（前50個）:\n{preview}\n"
        "請把你真正要跑的入口檔名改成包含 step1 或 啟動/launcher，或告訴我入口檔名我就改規則。"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="主檔 xlsx 路徑（台指近全.xlsx）")
    ap.add_argument("--engine_dir", required=True, help="引擎資料夾（engine_bin）")
    ap.add_argument("--outdir", required=True, help="輸出資料夾")
    ap.add_argument("--model", default="", help="可選：模型 JSON 路徑（若引擎支援 --model）")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] outdir={outdir}")

    if not master.exists():
        raise FileNotFoundError(f"[run_public] MASTER not found: {master}")
    if not engine_dir.exists():
        raise FileNotFoundError(f"[run_public] ENGINE_DIR not found: {engine_dir}")

    outdir.mkdir(parents=True, exist_ok=True)

    entry = pick_entry(engine_dir)
    print(f"[run_public] entry={entry}")

    # 組命令：你的 step1 引擎（你貼給我的那支）是吃 --input / --outdir / --model
    cmd = [sys.executable, str(entry), "--input", str(master), "--outdir", str(outdir)]

    if args.model.strip():
        cmd += ["--model", args.model.strip()]

    print("[run_public] cmd:")
    print(" ".join(cmd))

    # 執行
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
