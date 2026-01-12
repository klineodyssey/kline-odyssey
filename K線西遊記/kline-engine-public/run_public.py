#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import sys
import subprocess
from pathlib import Path


def _strip_utf8_bom_file(p: Path) -> bool:
    """
    Remove UTF-8 BOM (0xEF,0xBB,0xBF) if present at file head.
    Return True if modified.
    """
    try:
        b = p.read_bytes()
    except Exception:
        return False
    bom = b"\xef\xbb\xbf"
    if b.startswith(bom):
        p.write_bytes(b[len(bom):])
        return True
    return False


def _find_engine_entry(engine_dir: Path) -> Path:
    """
    Priority:
      1) engine_bin/launcher.py
      2) any *.py contains 'step1' in filename
      3) any *.py under engine_dir (fallback)
    """
    if not engine_dir.exists():
        raise FileNotFoundError(f"engine_dir not found: {engine_dir}")

    # (1) launcher
    launcher = engine_dir / "launcher.py"
    if launcher.exists():
        return launcher

    # (2) step1 in name
    step1 = sorted(engine_dir.glob("*step1*.py"))
    if step1:
        return step1[0]

    # (3) any py
    any_py = sorted(engine_dir.glob("*.py"))
    if any_py:
        return any_py[0]

    raise FileNotFoundError(f"no runnable entry found in engine_dir: {engine_dir}")


def _run_cmd(cmd: list[str], tries: int = 4) -> None:
    last_err = None
    for t in range(1, tries + 1):
        try:
            p = subprocess.run(cmd, check=True, text=True)
            return
        except subprocess.CalledProcessError as e:
            last_err = e
            print(f"[run_public] engine failed (try={t}/{tries}), exit={e.returncode}", file=sys.stderr)
    raise last_err  # type: ignore


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="Path to master xlsx (ONLY this file is consumed)")
    ap.add_argument("--engine_dir", required=True, help="Path to extracted engine_bin directory")
    ap.add_argument("--outdir", required=True, help="Output directory to write results")
    ap.add_argument("--model", default="", help="Optional model json path (if you want)")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)
    model = Path(args.model) if args.model else None

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] outdir={outdir}")
    if model:
        print(f"[run_public] model={model}")

    if not master.exists():
        print(f"[run_public] MASTER not found: {master}", file=sys.stderr)
        return 2

    outdir.mkdir(parents=True, exist_ok=True)

    entry = _find_engine_entry(engine_dir)
    print(f"[run_public] entry={entry}")

    # extra safety: strip BOM in entry (and all *.py in engine_dir)
    modified = False
    for py in engine_dir.glob("*.py"):
        if _strip_utf8_bom_file(py):
            modified = True
    if modified:
        print("[run_public] stripped UTF-8 BOM on some engine files")

    cmd = [sys.executable, str(entry)]
    # Our engine step1 supports: --input, --outdir, --model
    # launcher.py forwards args to step1.
    cmd += ["--input", str(master), "--outdir", str(outdir)]
    if model and model.exists():
        cmd += ["--model", str(model)]

    print("[run_public] cmd:")
    print(" ".join(cmd))

    try:
        _run_cmd(cmd, tries=4)
    except Exception as e:
        # print a tiny context if it is a syntax/indent error
        print(f"[run_public] ERROR: {e}", file=sys.stderr)
        return 1

    print("[run_public] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
