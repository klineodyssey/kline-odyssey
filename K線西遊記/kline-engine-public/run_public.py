# -*- coding: utf-8 -*-
"""
KLINE Odyssey - Public Runner
- 目的：讓 GitHub Actions 可以用「固定介面」呼叫你的私有運算引擎（engine.zip 解壓後的內容）
- 注意：此檔可公開；真正引擎在 secret 的 engine.zip，不會進 repo。

用法（Actions 會這樣呼叫）：
python K線西遊記/kline-engine-public/run_public.py --master <xlsx> --engine_dir engine_bin --outdir <outdir>

它會做：
1) 確認 outdir 存在
2) 找出 engine_dir 內的「主入口」(優先：kline_engine_main.py，其次：任何含 '啟動西遊記運算' 的 .py，最後：唯一的 .py)
3) 以 subprocess 執行該入口，把 master/outdir 帶進去
"""
from __future__ import annotations

import argparse
import os
import sys
import subprocess
from pathlib import Path

def _pick_engine_entry(engine_dir: Path) -> Path:
    # 1) 固定入口（若你未來願意在引擎內放這個檔名）
    p = engine_dir / "kline_engine_main.py"
    if p.exists():
        return p

    # 2) 找「啟動西遊記運算」類型檔名
    cand = sorted(engine_dir.rglob("*.py"))
    for f in cand:
        if "啟動西遊記運算" in f.name:
            return f

    # 3) 找最像核心運算的檔名
    for f in cand:
        if "多空運算" in f.name or "Tplus1" in f.name:
            return f

    # 4) 若只有一個 py，就用它
    if len(cand) == 1:
        return cand[0]

    raise FileNotFoundError(f"找不到引擎入口：{engine_dir} 內沒有可用 .py")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="輸入主檔 xlsx（台指近全 或 BTC master）")
    ap.add_argument("--engine_dir", required=True, help="engine.zip 解壓後的資料夾")
    ap.add_argument("--outdir", required=True, help="輸出資料夾（會產生 latest.json / today.txt / 圖）")
    ap.add_argument("--extra_args", default="", help="額外參數（若引擎需要）")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        print(f"[run_public] ERROR: master not found: {master}", file=sys.stderr)
        return 2
    if not engine_dir.exists():
        print(f"[run_public] ERROR: engine_dir not found: {engine_dir}", file=sys.stderr)
        return 2

    outdir.mkdir(parents=True, exist_ok=True)

    entry = _pick_engine_entry(engine_dir)
    print(f"[run_public] engine entry = {entry}")

    # 兼容：不同引擎入口參數名可能不同
    # 我們先嘗試通用參數：--master --outdir
    cmd = [sys.executable, str(entry), "--master", str(master), "--outdir", str(outdir)]
    if args.extra_args.strip():
        cmd += args.extra_args.strip().split()

    print("[run_public] cmd =", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(entry.parent))
    return proc.returncode

if __name__ == "__main__":
    raise SystemExit(main())
