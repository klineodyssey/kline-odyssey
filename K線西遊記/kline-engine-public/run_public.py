# -*- coding: utf-8 -*-
import argparse
import subprocess
from pathlib import Path

MAX_FIX_TRIES = 6

def find_entry(engine_dir: Path) -> Path:
    candidates = []
    for p in engine_dir.rglob("*.py"):
        n = p.name.lower()
        if "step1" in n or "launcher" in n:
            candidates.append(p)
    if not candidates:
        raise FileNotFoundError("找不到引擎入口檔：請確認 engine_dir 內含 step1 或 launcher 的 .py")
    candidates.sort(key=lambda x: (0 if "step1" in x.name.lower() else 1, len(str(x))))
    return candidates[0]

def _indent_len(s: str) -> int:
    # 僅算「行首空白」(tab視為4)
    i = 0
    n = 0
    while i < len(s):
        ch = s[i]
        if ch == " ":
            n += 1
        elif ch == "\t":
            n += 4
        elif ch == "\u00a0":  # NBSP
            n += 1
        else:
            break
        i += 1
    return n

def _leading_ws(s: str) -> str:
    i = 0
    while i < len(s) and s[i] in (" ", "\t", "\u00a0"):
        i += 1
    return s[:i]

def _strip_leading_ws(s: str) -> str:
    return s[len(_leading_ws(s)) :]

def show_context(path: Path, lineno: int, radius: int = 3) -> None:
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    start = max(1, lineno - radius)
    end = min(len(lines), lineno + radius)
    print(f"[run_public] ---- error context: {path} (line {lineno}) ----")
    for i in range(start, end + 1):
        marker = ">>" if i == lineno else "  "
        raw = lines[i - 1].replace("\t", "\\t")
        print(f"{marker} {i:4d}: {raw}")
    print("[run_public] -------------------------------------------")

def sanitize_text(txt: str) -> str:
    # 全檔殺 U+FEFF、CRLF->LF、行首 tab/NBSP 正規化
    txt = txt.replace("\ufeff", "")
    txt = txt.replace("\r\n", "\n").replace("\r", "\n")
    out_lines = []
    for line in txt.split("\n"):
        lead = _leading_ws(line).replace("\u00a0", " ").replace("\t", "    ")
        out_lines.append(lead + _strip_leading_ws(line))
    return "\n".join(out_lines)

def auto_fix_unexpected_indent(path: Path, lineno: int) -> bool:
    """
    專打 IndentationError: unexpected indent
    策略：
    - 找上一個「非空白」行 prev
    - 如果 prev 以 ':' 結尾 => 這行應該比 prev 多 4
    - 否則 => 這行應該跟 prev 同層
    """
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    if lineno < 1 or lineno > len(lines):
        return False

    idx = lineno - 1
    # 找 prev 非空白行
    j = idx - 1
    while j >= 0 and lines[j].strip() == "":
        j -= 1
    if j < 0:
        return False

    prev = lines[j]
    prev_indent = _indent_len(prev)
    prev_stripped = prev.strip()

    target_indent = prev_indent + 4 if prev_stripped.endswith(":") else prev_indent

    cur = lines[idx]
    cur_stripped = _strip_leading_ws(cur)

    new_line = (" " * target_indent) + cur_stripped
    if new_line == cur:
        return False

    lines[idx] = new_line
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[run_public] auto-fix unexpected indent at line {lineno}: set indent={target_indent}")
    return True

def preflight_compile_with_autofix(entry: Path) -> None:
    # 先做一次基本 sanitize（就算 workflow 做過，也保險）
    src0 = entry.read_text(encoding="utf-8", errors="ignore")
    src1 = sanitize_text(src0)
    if src1 != src0:
        entry.write_text(src1, encoding="utf-8")
        print("[run_public] sanitized entry text")

    for t in range(1, MAX_FIX_TRIES + 1):
        src = entry.read_text(encoding="utf-8", errors="ignore")
        try:
            compile(src, str(entry), "exec")
            print(f"[run_public] compile OK (try={t})")
            return
        except IndentationError as e:
            print(f"[run_public] IndentationError (try={t}): {e}")
            if getattr(e, "lineno", None):
                show_context(entry, e.lineno)
                # 只針對 unexpected indent 自動修
                if "unexpected indent" in str(e).lower():
                    fixed = auto_fix_unexpected_indent(entry, e.lineno)
                    if fixed:
                        continue
            raise
        except SyntaxError as e:
            print(f"[run_public] SyntaxError (try={t}): {e}")
            if getattr(e, "lineno", None):
                show_context(entry, e.lineno)
            raise

    raise RuntimeError("[run_public] compile failed after max tries")

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

    # ✅ 先預編譯 + 自動修 unexpected indent
    preflight_compile_with_autofix(entry)

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
