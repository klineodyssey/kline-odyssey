# K線西遊記/kline-engine-public/run_public.py
# Public entry (safe): find engine entry inside engine_dir, sanitize BOM, pre-compile, then run.

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


def _sanitize_bom_for_py(py_path: Path) -> bool:
    """
    Remove UTF-8 BOM / U+FEFF from a .py file safely.
    Return True if modified.
    """
    try:
        raw = py_path.read_bytes()
    except Exception:
        return False

    changed = False

    # Remove UTF-8 BOM at file start
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
        changed = True

    # Remove any stray U+FEFF in text (rare)
    try:
        txt = raw.decode("utf-8", errors="strict")
        if "\ufeff" in txt:
            txt = txt.replace("\ufeff", "")
            raw = txt.encode("utf-8")
            changed = True
    except Exception:
        # If decoding fails, don't touch it further.
        return changed

    if changed:
        py_path.write_bytes(raw)
    return changed


def _sanitize_all_py(engine_dir: Path) -> int:
    n = 0
    for p in engine_dir.rglob("*.py"):
        if _sanitize_bom_for_py(p):
            n += 1
    return n


def _py_compile_check(py_path: Path) -> tuple[bool, str]:
    """
    Compile check without executing. Return (ok, err_text).
    """
    try:
        import py_compile

        py_compile.compile(str(py_path), doraise=True)
        return True, ""
    except Exception as e:
        return False, str(e)


def _pick_engine_entry(engine_dir: Path) -> Path:
    """
    Strategy:
    1) launcher.py (or similar)
    2) any file contains 'step1' and '多空運算'
    3) fallback: newest (by name) file contains 'Tplus1' and endswith .py
    """
    candidates: list[Path] = []

    # 1) explicit launcher
    for name in ["launcher.py", "launch.py", "run_engine.py", "engine.py"]:
        p = engine_dir / name
        if p.exists():
            return p

    # 2) step1 多空運算
    for p in engine_dir.rglob("*.py"):
        s = p.name
        if ("step1" in s.lower()) and ("多空運算" in s):
            candidates.append(p)

    if candidates:
        # prefer "NO_BOM" or "UTF8" in filename, then lexicographically last
        def score(x: Path):
            n = x.name
            return (
                1 if "NO_BOM" in n.upper() else 0,
                1 if "UTF8" in n.upper() else 0,
                n,
            )

        candidates.sort(key=score)
        return candidates[-1]

    # 3) fallback: Tplus1
    for p in engine_dir.rglob("*.py"):
        s = p.name
        if ("Tplus1" in s) or ("tplus1" in s.lower()):
            candidates.append(p)

    if candidates:
        candidates.sort(key=lambda x: x.name)
        return candidates[-1]

    raise FileNotFoundError("找不到引擎入口檔：請確認 engine_dir 內含 launcher 或 step1 多空運算程式。")


def _run_subprocess(cmd: list[str]) -> int:
    print("[run_public] cmd:")
    print(" ".join(cmd))
    p = subprocess.run(cmd)
    return p.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, help="path to 台指近全.xlsx")
    ap.add_argument("--engine_dir", required=True, help="path to engine_bin directory")
    ap.add_argument("--outdir", required=True, help="output directory")
    ap.add_argument("--tries", type=int, default=4, help="retry times")
    args = ap.parse_args()

    master = Path(args.master)
    engine_dir = Path(args.engine_dir)
    outdir = Path(args.outdir)

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    outdir.mkdir(parents=True, exist_ok=True)

    if not master.exists():
        raise SystemExit(f"MASTER not found: {master}")
    if not engine_dir.exists():
        raise SystemExit(f"ENGINE_DIR not found: {engine_dir}")

    # sanitize BOM for all python files (best effort)
    n = _sanitize_all_py(engine_dir)
    print(f"[run_public] sanitized_py_count={n}")

    entry = _pick_engine_entry(engine_dir)
    print(f"[run_public] entry={entry}")

    # pre-compile check (after sanitize)
    ok, err = _py_compile_check(entry)
    if not ok:
        print("[run_public] py_compile failed:", err)
        # still allow retries because sanitize/runner can differ
    else:
        print("[run_public] py_compile OK")

    # run with retry
    last_code = 1
    for t in range(1, args.tries + 1):
        cmd = [
            sys.executable,
            str(entry),
            "--input",
            str(master),
            "--outdir",
            str(outdir),
        ]
        code = _run_subprocess(cmd)
        last_code = code
        if code == 0:
            print("[run_public] OK")
            return 0

        print(f"[run_public] engine failed (try={t}) exit_code={code}")

        # If error is BOM-related, sanitize again and retry
        _sanitize_bom_for_py(entry)

    raise SystemExit(f"[run_public] engine failed after {args.tries} tries. last_exit_code={last_code}")


if __name__ == "__main__":
    main()
