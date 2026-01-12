# -*- coding: utf-8 -*-
import argparse
import subprocess
from pathlib import Path

def find_entry(engine_dir: Path) -> Path:
    # 你的引擎常見入口命名：step1 / launcher
    candidates = []
    for p in engine_dir.rglob("*.py"):
        name = p.name.lower()
        if "step1" in name or "launcher" in name:
            candidates.append(p)

    if not candidates:
        raise FileNotFoundError("找不到引擎入口檔：請確認 engine_dir 內含 step1 或 launcher 的 .py")

    # 優先選 step1（你現在的就是這支）
    candidates.sort(key=lambda x: (0 if "step1" in x.name.lower() else 1, len(str(x))))
    return candidates[0]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="主檔（台指近全.xlsx）路徑")
    ap.add_argument("--engine_dir", required=True, help="解壓後的 engine_bin 目錄")
    ap.add_argument("--outdir", required=True, help="輸出目錄")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        raise FileNotFoundError(f"MASTER not found: {master}")
    if not engine_dir.exists():
        raise FileNotFoundError(f"ENGINE_DIR not found: {engine_dir}")

    outdir.mkdir(parents=True, exist_ok=True)

    entry = find_entry(engine_dir)

    cmd = [
        "python",
        str(entry),
        "--input", str(master),
        "--outdir", str(outdir),
    ]

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] entry={entry}")
    print("[run_public] cmd:")
    print(" ".join(cmd))

    # 直接跑，讓 workflow 的 BOM 清理先做完
    r = subprocess.run(cmd, capture_output=False)
    if r.returncode != 0:
        raise SystemExit(r.returncode)

    print("[run_public] OK")

if __name__ == "__main__":
    main()
