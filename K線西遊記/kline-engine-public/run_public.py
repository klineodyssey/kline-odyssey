# -*- coding: utf-8 -*-
"""
K線西遊記 · 公開入口（Stable）
- 只負責：用 master 檔當 input，去 engine_dir 找引擎入口檔並執行
- 引擎本體放在 GitHub Secrets 的 ENGINE_ZIP_B64（或 Release），repo 不放引擎
"""

from __future__ import annotations
import argparse
import base64
import os
import sys
import subprocess
from pathlib import Path

BOM = b"\xef\xbb\xbf"

def _write_model_from_secret(engine_dir: Path) -> Path | None:
    b64 = os.environ.get("ENGINE_MODEL_B64", "").strip()
    if not b64:
        return None
    out = engine_dir / "_secret_model.json"
    out.write_bytes(base64.b64decode(b64))
    return out

def _strip_bom_py(root: Path) -> None:
    for f in root.rglob("*.py"):
        b = f.read_bytes()
        if b.startswith(BOM):
            f.write_bytes(b[len(BOM):])

def _find_entry(engine_dir: Path) -> Path:
    """找引擎入口（最穩：用 pattern + 避免抓到測試檔）。"""
    patterns = [
        "K線西遊記_Tplus1_pm500_step1_多空運算*.py",
        "啟動西遊記運算*.py",
        "kline_engine_main*.py",
    ]
    hits: list[Path] = []
    for pat in patterns:
        hits += list(engine_dir.rglob(pat))
    if not hits:
        raise SystemExit("找不到引擎入口檔：請確認 engine.zip 內含 step1 或 啟動器。")

    # 避免抓到 __pycache__/tests/venv 之類
    def score(p: Path):
        s = str(p).lower()
        bad = any(x in s for x in ["__pycache__", "/tests/", "\\tests\\", "/venv/", "\\venv\\"])
        return (bad, len(str(p)), str(p))
    hits.sort(key=score)
    return hits[0]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="輸入 master xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="已解壓的引擎資料夾（例如 engine_bin）")
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

    cmd = [sys.executable, str(entry), "--input", str(master), "--outdir", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]

    print("[run_public] cmd:", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(entry.parent))
    raise SystemExit(proc.returncode)

if __name__ == "__main__":
    main()
