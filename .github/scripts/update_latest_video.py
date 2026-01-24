#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import subprocess
from pathlib import Path

HANDLE = os.getenv("YT_HANDLE", "@klineodyssey").strip()
README_PATH = Path(os.getenv("README_PATH", "README.md"))
MARKER_START = "<!-- LATEST_VIDEO_START -->"
MARKER_END = "<!-- LATEST_VIDEO_END -->"

def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr}")
    return p.stdout.strip()

def get_latest_video_id_and_title(handle: str) -> tuple[str, str]:
    # 用 yt-dlp 直接讀「最新一支」影片
    # 1) 先拿影片 ID
    video_id = run([
        "yt-dlp",
        f"https://www.youtube.com/{handle}/videos",
        "--flat-playlist",
        "--playlist-items", "1",
        "--print", "%(id)s",
    ])
    if not video_id:
        raise RuntimeError("Could not fetch latest video id from handle page.")

    # 2) 再拿標題（對該影片做一次查詢）
    title = run([
        "yt-dlp",
        f"https://www.youtube.com/watch?v={video_id}",
        "--print", "%(title)s",
        "--no-warnings",
    ])
    return video_id, title or "Latest Video"

def update_readme(readme_path: Path, video_id: str, title: str) -> None:
    if not readme_path.exists():
        raise FileNotFoundError(f"{readme_path} not found")

    text = readme_path.read_text(encoding="utf-8")

    youtube_short = f"https://youtu.be/{video_id}"
    youtube_watch = f"https://www.youtube.com/watch?v={video_id}"

    block = f"""{MARKER_START}
🔥 Latest Video｜最新發布

▶ 最新影片（YouTube）
👉 {youtube_short}

（自動更新：GitHub Actions 會依 {HANDLE} 最新上傳替換此連結）
{MARKER_END}"""

    if MARKER_START in text and MARKER_END in text:
        pattern = re.compile(rf"{re.escape(MARKER_START)}.*?{re.escape(MARKER_END)}", re.S)
        text = pattern.sub(block, text, count=1)
    else:
        # 找不到 marker 就加到 README 最後（不改你原本文）
        text = text.rstrip() + "\n\n" + block + "\n"

    readme_path.write_text(text, encoding="utf-8")

def main():
    video_id, title = get_latest_video_id_and_title(HANDLE)
    update_readme(README_PATH, video_id, title)
    print(f"Updated {README_PATH} -> {video_id} ({title})")

if __name__ == "__main__":
    main()
