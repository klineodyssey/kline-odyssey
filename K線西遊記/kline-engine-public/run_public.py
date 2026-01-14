# -*- coding: utf-8 -*-
"""
K線西遊記 · TX 引擎公開入口（Stable）
- 只負責：用 master/台指近全.xlsx 當 input，去 engine_dir 找入口並執行
- 引擎本體：由 workflow 從 Secret 還原成 engine_bin/（不放 repo）
"""

from __future__ import annotations

import argparse
import base64
import os
import sys
import subprocess
from pathlib import Path


def _write_model_from_secret(engine_dir: Path) -> Path | None:
    b64 = os.environ.get("ENGINE_MODEL_B64", "").strip()
    if not b64:
        return None
    out = engine_dir / "_secret_model.json"
    out.write_bytes(base64.b64decode(b64))
    return out


def _strip_bom_py(engine_dir: Path) -> None:
    bom = b"\xef\xbb\xbf"
    for f in engine_dir.rglob("*.py"):
        b = f.read_bytes()
        if b.startswith(bom):
            f.write_bytes(b[len(bom):])


def _find_entry(engine_dir: Path) -> Path:
    # 優先順序：你現在 engine.zip 裡最常見的入口
    patterns = [
        "K線西遊記_Tplus1_pm500_step1_多空運算*.py",
        "launcher.py",
        "啟動西遊記運算*.py",
    ]
    for pat in patterns:
        hits = list(engine_dir.rglob(pat))
        if hits:
            hits.sort(key=lambda p: (len(str(p)), str(p)))
            return hits[0]
    raise SystemExit("找不到引擎入口檔：請確認 engine.zip 內含 step1 / launcher / 啟動器。")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="master/台指近全.xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="引擎解壓資料夾（例如 engine_bin）")
    ap.add_argument("--outdir", required=True, help="輸出資料夾（repo 內 output）")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        raise SystemExit(f"MASTER not found: {master}")
    if not engine_dir.exists():
        raise SystemExit(f"engine_dir not found: {engine_dir}")

    outdir.mkdir(parents=True, exist_ok=True)

    _strip_bom_py(engine_dir)
    model_path = _write_model_from_secret(engine_dir)
    entry = _find_entry(engine_dir)

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] entry={entry}")
    if model_path:
        print(f"[run_public] model(from secret)={model_path}")

    # 你的 step1(V3.4.3) 本身支援：--input --outdir --model
    cmd = [sys.executable, str(entry), "--input", str(master), "--outdir", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]

    print("[run_public] cmd:", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(entry.parent))
    raise SystemExit(proc.returncode)


if __name__ == "__main__":
    main()
