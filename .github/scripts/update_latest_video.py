# -*- coding: utf-8 -*-
import re
import feedparser

# 你的 YouTube RSS（免登入、免 cookie）
RSS_URL = "https://www.youtube.com/feeds/videos.xml?user=klineodyssey"

README_PATH = "README.md"

START = "<!-- LATEST_VIDEO_START -->"
END = "<!-- LATEST_VIDEO_END -->"

def main():
    feed = feedparser.parse(RSS_URL)
    if not feed.entries:
        raise RuntimeError("RSS has no entries. Check RSS_URL.")

    entry = feed.entries[0]
    video_url = entry.link
    title = entry.title

    new_block = f"""{START}
---

## 🔥 Latest Video｜最新發布

▶ {title}  
👉 {video_url}

（本區由 GitHub Actions 自動更新；首頁 iframe 保持固定世界觀主軸影片）
{END}"""

    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(rf"{re.escape(START)}.*?{re.escape(END)}", re.S)

    if pattern.search(content):
        content = pattern.sub(new_block, content)
    else:
        # 若 README 沒 marker，就把區塊加到最底部（不改你原本文）
        content = content.rstrip() + "\n\n" + new_block + "\n"

    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
