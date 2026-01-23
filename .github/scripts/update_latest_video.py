#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Auto-update root README.md "Latest Video" block by scanning newest daily post
and extracting the newest YouTube link.

Rules:
- Only updates content between:
  <!-- LATEST_VIDEO:START -->  and  <!-- LATEST_VIDEO:END -->
- Finds newest daily markdown under: K線西遊記/daily/YYYY-MM-DD/*.md
- Extracts first YouTube URL found in that file:
    - https://youtu.be/xxxx
    - https://www.youtube.com/watch?v=xxxx
    - https://youtube.com/shorts/xxxx
- If no link found, does nothing.
"""

from __future__ import annotations
import re
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]  # repo root
README = ROOT / "README.md"
DAILY_DIR = ROOT / "K線西遊記" / "daily"

START = "<!-- LATEST_VIDEO:START -->"
END = "<!-- LATEST_VIDEO:END -->"

YOUTUBE_RE = re.compile(
    r"(https?://(?:www\.)?youtu\.be/[A-Za-z0-9_-]+(?:\?[^\s)]+)?)"
    r"|"
    r"(https?://(?:www\.)?youtube\.com/(?:watch\?v=|shorts/)[A-Za-z0-9_-]+(?:\?[^\s)]+)?)",
    re.IGNORECASE,
)

def newest_daily_markdown() -> Path | None:
    if not DAILY_DIR.exists():
        return None

    # folders like 2026-01-23
    date_dirs = []
    for p in DAILY_DIR.iterdir():
        if p.is_dir():
            try:
                datetime.strptime(p.name, "%Y-%m-%d")
                date_dirs.append(p)
            except ValueError:
                pass

    if not date_dirs:
        return None

    date_dirs.sort(key=lambda x: x.name, reverse=True)  # newest first
    newest_dir = date_dirs[0]

    # pick the first .md file in that folder (prefer same name as folder)
    same_name = newest_dir / f"{newest_dir.name}.md"
    if same_name.exists():
        return same_name

    md_files = sorted(newest_dir.glob("*.md"))
    return md_files[0] if md_files else None

def extract_youtube_url(text: str) -> str | None:
    m = YOUTUBE_RE.search(text)
    if not m:
        return None
    # m.group(1) or m.group(2)
    return next(g for g in m.groups() if g)

def update_readme(latest_url: str) -> bool:
    if not README.exists():
        raise FileNotFoundError("README.md not found at repo root")

    content = README.read_text(encoding="utf-8")

    if START not in content or END not in content:
        raise RuntimeError("README.md missing LATEST_VIDEO markers")

    before, rest = content.split(START, 1)
    middle, after = rest.split(END, 1)

    block = f"""{START}
---

## 🔥 Latest Video｜最新發布

▶ **最新影片（YouTube）**  
👉 {latest_url}

> 本區由 GitHub Actions 自動更新  
> 主影片（頁首 iframe）維持固定世界觀主軸影片
{END}"""

    new_content = before + block + after

    if new_content == content:
        return False

    README.write_text(new_content, encoding="utf-8")
    return True

def main() -> int:
    daily_md = newest_daily_markdown()
    if not daily_md:
        print("No daily markdown found; skip.")
        return 0

    text = daily_md.read_text(encoding="utf-8", errors="ignore")
    url = extract_youtube_url(text)
    if not url:
        print(f"No YouTube URL found in: {daily_md}")
        return 0

    changed = update_readme(url)
    print(f"Latest URL: {url}")
    print("README updated." if changed else "README already up-to-date.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
