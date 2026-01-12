# -*- coding: utf-8 -*-
"""
K線西遊記 · 引擎公開入口（最終穩定版）
用途：
- Repo 公開：只放這支入口與 output
- 私有引擎：放在 Release 資產 ENGINE_ZIP_B64.zip（Actions 下載解壓到 engine_bin）
- 本入口會在 engine_dir 內自動找「真正引擎入口檔」並以參數方式執行

入口偵測優先順序：
1) K線西遊記_Tplus1_pm500_step1_多空運算*.py
2) 啟動西遊記運算*.py
3) 其他：報錯（避免跑錯檔）
"""

from __future__ import annotations
import argparse
import base64
import os
import re
import sys
import subprocess
from pathlib import Path


ENTRY_PATTERNS = [
    "K線西遊記_Tplus1_pm500_step1_多空運算*.py",
    "啟動西遊記運算*.py",
]


def _strip_py_bom(root: Path) -> int:
    fixed = 0
    for f in root.rglob("*.py"):
        b = f.read_bytes()
        if b.startswith(b"\xef\xbb\xbf"):
            f.write_bytes(b[3:])
            fixed += 1
    return fixed


def _write_model_from_secret(engine_dir: Path) -> Path | None:
    """
    若有 ENGINE_MODEL_B64，會寫成 engine_dir/_secret_model.json
    """
    b64 = os.environ.get("ENGINE_MODEL_B64", "").strip()
    if not b64:
        return None

    # 清掉非 base64 字元（防止貼入換行空白）
    b64_clean = re.sub(r"[^A-Za-z0-9+/=]", "", b64)
    if len(b64_clean) < 50:
        return None

    out = engine_dir / "_secret_model.json"
    out.write_bytes(base64.b64decode(b64_clean))
    return out


def _find_entry(engine_dir: Path) -> Path | None:
    hits_all: list[Path] = []
    for pat in ENTRY_PATTERNS:
        hits = list(engine_dir.rglob(pat))
        if hits:
            hits_all = hits
            # 取「路徑最短」通常就是你要的那支
            hits_all.sort(key=lambda p: (len(str(p)), str(p)))
            return hits_all[0]
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="台指近全.xlsx 路徑")
    ap.add_argument("--engine_dir", required=True, help="已解壓的引擎資料夾（例如 engine_bin）")
    ap.add_argument("--outdir", required=True, help="輸出資料夾（repo 內 output）")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    if not master.exists():
        print(f"[run_public] MASTER not found: {master}", file=sys.stderr)
        return 2
    if not engine_dir.exists():
        print(f"[run_public] engine_dir not found: {engine_dir}", file=sys.stderr)
        return 2

    outdir.mkdir(parents=True, exist_ok=True)

    # 再做一次 BOM strip（雙保險：就算 workflow 忘了做也能救）
    fixed = _strip_py_bom(engine_dir)
    if fixed:
        print(f"[run_public] BOM stripped: {fixed} file(s)")

    model_path = _write_model_from_secret(engine_dir)
    entry = _find_entry(engine_dir)
    if not entry:
        print("[run_public] 找不到引擎入口檔，請確認 Release ZIP 內含：", file=sys.stderr)
        for p in ENTRY_PATTERNS:
            print(f"  - {p}", file=sys.stderr)
        return 3

    print(f"[run_public] master  : {master}")
    print(f"[run_public] engine  : {engine_dir}")
    print(f"[run_public] outdir  : {outdir}")
    print(f"[run_public] entry   : {entry}")
    if model_path:
        print(f"[run_public] model(secret) : {model_path}")

    # 組命令：盡量用統一參數（step1/launcher 都吃得到最好）
    cmd = [sys.executable, str(entry), "--input", str(master), "--outdir", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]

    # 讓引擎自己讀 key（若有用到）
    # os.environ.get("KLINE_ENGINE_KEY") 會由 Actions env 帶入，這裡不干涉。

    print("[run_public] cmd:", " ".join(cmd))

    # 重要：cwd 用 entry 所在資料夾，避免引擎用相對路徑找不到資源
    proc = subprocess.run(cmd, cwd=str(entry.parent))
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
