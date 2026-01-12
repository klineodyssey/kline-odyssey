# -*- coding: utf-8 -*-
import argparse
import subprocess
from pathlib import Path

def find_entry(engine_dir: Path) -> Path:
    candidates = []
    for p in engine_dir.rglob("*.py"):
        name = p.name.lower()
        if "step1" in name or "launcher" in name:
            candidates.append(p)

    if not candidates:
        raise FileNotFoundError("找不到引擎入口檔：請確認 engine_dir 內含 step1 或 launcher 的 .py")

    candidates.sort(key=lambda x: (0 if "step1" in x.name.lower() else 1, len(str(x))))
    return candidates[0]

def show_context(path: Path, lineno: int, radius: int = 3) -> None:
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception as e:
        print(f"[run_public] cannot read for context: {e}")
        return

    start = max(1, lineno - radius)
    end = min(len(lines), lineno + radius)
    print(f"[run_public] ---- error context: {path} (line {lineno}) ----")
    for i in range(start, end + 1):
        marker = ">>" if i == lineno else "  "
        # 顯示可見化（把 tab 顯示成 \t）
        raw = lines[i-1].replace("\t", "\\t")
        print(f"{marker} {i:4d}: {raw}")
    print("[run_public] -------------------------------------------")

def preflight_compile(entry: Path) -> None:
    src = entry.read_text(encoding="utf-8", errors="ignore")
    try:
        compile(src, str(entry), "exec")
    except IndentationError as e:
        print(f"[run_public] IndentationError: {e}")
        if getattr(e, "lineno", None):
            show_context(entry, e.lineno)
        raise
    except SyntaxError as e:
        print(f"[run_public] SyntaxError: {e}")
        if getattr(e, "lineno", None):
            show_context(entry, e.lineno)
        raise

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

    print(f"[run_public] master={master}")
    print(f"[run_public] engine_dir={engine_dir}")
    print(f"[run_public] entry={entry}")

    # ✅ 先預編譯：如果縮排/語法炸，會印出「錯誤行上下文」
    preflight_compile(entry)

    cmd = [
        "python",
        str(entry),
        "--input", str(master),
        "--outdir", str(outdir),
    ]
    print("[run_public] cmd:")
    print(" ".join(cmd))

    r = subprocess.run(cmd)
    if r.returncode != 0:
        raise SystemExit(r.returncode)

    print("[run_public] OK")

if __name__ == "__main__":
    main()
