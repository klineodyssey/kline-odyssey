# -*- coding: utf-8 -*-
"""
K線西遊記 · 引擎公開入口（Stable++）
- 只負責：用 master(.xlsx) 當 input，去 engine_dir 找入口並執行
- 引擎本體：由 workflow 從 Secret 還原成 engine_bin/（不放 repo）
- 特色：自動偵測入口 + 自動嘗試多種常見 CLI 參數組合（不同引擎版本也能跑）
"""

from __future__ import annotations

import argparse
import base64
import os
import sys
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple


def _write_model_from_secret(engine_dir: Path) -> Optional[Path]:
    b64 = os.environ.get("ENGINE_MODEL_B64", "").strip()
    if not b64:
        return None
    out = engine_dir / "_secret_model.json"
    out.write_bytes(base64.b64decode(b64))
    return out


def _strip_bom_py(engine_dir: Path) -> None:
    bom = b"\xef\xbb\xbf"
    for f in engine_dir.rglob("*.py"):
        try:
            b = f.read_bytes()
        except Exception:
            continue
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


def _run_once(cmd: List[str], cwd: Path) -> Tuple[int, str]:
    """
    回傳 (returncode, tag)
    tag 用來在 log 上辨識是哪一套參數組合。
    """
    print("[run_public] cmd:", " ".join(cmd))
    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    print(proc.stdout)
    return proc.returncode, " ".join(cmd)


def _candidate_cmds(entry: Path, master: Path, outdir: Path, model_path: Optional[Path]) -> List[List[str]]:
    py = sys.executable
    base = [py, str(entry)]

    # 常見參數組合：依你引擎演進版本做「兼容嘗試」
    candidates: List[List[str]] = []

    # A) 你目前假設的（最常見）
    cmd = base + ["--input", str(master), "--outdir", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]
    candidates.append(cmd)

    # B) 有些版本叫 master/output
    cmd = base + ["--master", str(master), "--outdir", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]
    candidates.append(cmd)

    cmd = base + ["--master", str(master), "--output", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]
    candidates.append(cmd)

    # C) 有些版本叫 input/output
    cmd = base + ["--input", str(master), "--output", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]
    candidates.append(cmd)

    # D) 有些版本用短參數
    cmd = base + ["-i", str(master), "-o", str(outdir)]
    if model_path:
        cmd += ["--model", str(model_path)]
    candidates.append(cmd)

    # E) 最後保底：不帶參數（讓引擎用自己的預設路徑）
    candidates.append(base)

    # 去重（避免重複跑）
    uniq: List[List[str]] = []
    seen = set()
    for c in candidates:
        key = tuple(c)
        if key not in seen:
            uniq.append(c)
            seen.add(key)
    return uniq


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="master xlsx 路徑（TX/BTC master 都可）")
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
    print(f"[run_public] outdir={outdir}")
    if model_path:
        print(f"[run_public] model(from secret)={model_path}")
    else:
        print("[run_public] model(from secret)=<none> (ENGINE_MODEL_B64 empty)")

    # 依序嘗試多套參數，成功就停
    cmds = _candidate_cmds(entry, master, outdir, model_path)
    last_rc = 1

    for idx, cmd in enumerate(cmds, start=1):
        print(f"\n[run_public] === try #{idx}/{len(cmds)} ===")
        rc, tag = _run_once(cmd, cwd=entry.parent)
        last_rc = rc
        if rc == 0:
            print(f"[run_public] SUCCESS with: {tag}")
            raise SystemExit(0)

    print("[run_public] All candidates failed. Last return code =", last_rc)
    raise SystemExit(last_rc)


if __name__ == "__main__":
    main()
