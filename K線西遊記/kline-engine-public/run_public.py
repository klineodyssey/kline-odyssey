# -*- coding: utf-8 -*-

"""
K線西遊記 · TX 引擎公開入口（方案2安全版）
- 目標：在 GitHub Actions 上，用 repo 內的台指近全.xlsx 作為資料來源，
        但核心引擎（含策略/參數/回測邏輯）不進 repo，只從 secrets 還原 zip 後執行。

執行策略（自動偵測）：
1) engine_dir 內若找到「K線西遊記_Tplus1_pm500_step1_多空運算*.py」→ 用它當入口（支援 --input/--model/--outdir）
2) 否則若找到「啟動西遊記運算*.py」→ 直接執行（可依你引擎內部邏輯再擴充參數）
3) 兩者都找不到 → 直接報錯

可選：ENGINE_MODEL_B64（secret）會被還原成 engine_dir/_secret_model.json，並自動帶入 --model
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

def _find_entry(engine_dir: Path) -> Path | None:
    # 尋找 step1（優先）
    patterns = [
        "K線西遊記_Tplus1_pm500_step1_多空運算*.py",
        "啟動西遊記運算*.py",
    ]
    for pat in patterns:
        hits = list(engine_dir.rglob(pat))
        if hits:
            # 取最短路徑（通常是你要的）
            hits.sort(key=lambda p: (len(str(p)), str(p)))
            return hits[0]
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="台指近全.xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="已解壓的引擎資料夾（例如 engine_bin）")
    ap.add_argument("--outdir", default="output", help="輸出資料夾")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        raise SystemExit(f"MASTER not found: {master}")
    if not engine_dir.exists():
        raise SystemExit(f"engine_dir not found: {engine_dir}")

    outdir.mkdir(parents=True, exist_ok=True)

    model_path = _write_model_from_secret(engine_dir)
    entry = _find_entry(engine_dir)
    if not entry:
        raise SystemExit("找不到引擎入口檔：請確認 ENGINE_ZIP_B64 內含 step1 或 launcher。")

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] entry={entry}")
    if model_path:
        print(f"[run_public] model(from secret)={model_path}")

    # 組 command
    cmd = [sys.executable, str(entry)]
    name = entry.name

    if "Tplus1_pm500_step1_多空運算" in name:
        # 這支支援 --input/--model/--outdir
        cmd += ["--input", str(master), "--outdir", str(outdir)]
        if model_path:
            cmd += ["--model", str(model_path)]
    else:
        # launcher：先盡量用通用參數，若你的 launcher 沒吃參數也不會壞
        # 你可在引擎內把 launcher 改成接受 --input/--outdir，這裡就能全自動
        cmd += ["--input", str(master), "--outdir", str(outdir)]
        if model_path:
            cmd += ["--model", str(model_path)]

    print("[run_public] cmd:", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(entry.parent))
    if proc.returncode != 0:
        raise SystemExit(proc.returncode)

if __name__ == "__main__":
    main()
