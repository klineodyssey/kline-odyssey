# -*- coding: utf-8 -*-
import argparse
import contextlib
import io
import re
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

import feedparser

# 你的 YouTube RSS（免登入、免 cookie）
RSS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UC2UE0sZXbKnvR-N0Ew6Z6NA"

README_PATH = "README.md"

START = "<!-- LATEST_VIDEO_START -->"
END = "<!-- LATEST_VIDEO_END -->"


def _validate_feed(feed):
    """Fail closed on transport/HTTP/parser errors; allow a valid empty feed as a no-op."""
    status = getattr(feed, "status", None)
    if status is not None:
        try:
            status_code = int(status)
        except (TypeError, ValueError) as exc:
            raise RuntimeError(f"RSS returned invalid HTTP status: {status!r}") from exc
        if not 200 <= status_code < 300:
            raise RuntimeError(f"RSS HTTP request failed with status {status_code}")

    if getattr(feed, "bozo", False):
        detail = getattr(feed, "bozo_exception", None)
        suffix = f": {detail}" if detail else ""
        raise RuntimeError(f"RSS parse/transport failure{suffix}")

    entries = getattr(feed, "entries", None)
    if entries is None:
        raise RuntimeError("RSS parser returned no entries collection")
    return entries


def update_latest_video(feed, readme_path=README_PATH):
    entries = _validate_feed(feed)
    if not entries:
        print(
            "WARNING: YouTube RSS returned a valid empty feed; keeping README latest-video block unchanged",
            file=sys.stderr,
        )
        return False

    entry = entries[0]
    video_url = getattr(entry, "link", None)
    title = getattr(entry, "title", None)
    if not video_url or not title:
        raise RuntimeError("RSS first entry is missing title or link")

    new_block = f"""{START}
---

## 🔥 Latest Video｜最新發布

▶ {title}  
👉 {video_url}

（本區由 GitHub Actions 自動更新；首頁 iframe 保持固定世界觀主軸影片）
{END}"""

    path = Path(readme_path)
    content = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"{re.escape(START)}.*?{re.escape(END)}", re.S)

    if pattern.search(content):
        updated = pattern.sub(new_block, content)
    else:
        # 若 README 沒 marker，就把區塊加到最底部（不改你原本文）
        updated = content.rstrip() + "\n\n" + new_block + "\n"

    if updated == content:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def _expect_runtime_error(feed, readme_path, label):
    before = Path(readme_path).read_bytes()
    try:
        update_latest_video(feed, readme_path)
    except RuntimeError:
        pass
    else:
        raise AssertionError(f"expected RuntimeError: {label}")
    after = Path(readme_path).read_bytes()
    assert after == before, f"README mutated on failure: {label}"


def self_test():
    seed = f"before\n{START}\nold\n{END}\nafter\n"
    with tempfile.TemporaryDirectory() as tmpdir:
        readme = Path(tmpdir) / "README.md"

        # A successfully retrieved, parse-valid empty feed is a safe no-op.
        readme.write_text(seed, encoding="utf-8")
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            changed = update_latest_video(
                SimpleNamespace(status=200, bozo=False, entries=[]),
                readme,
            )
        assert changed is False
        assert readme.read_text(encoding="utf-8") == seed
        assert "valid empty feed" in stderr.getvalue()

        # Parser/transport failure must stay red and must not mutate README.
        readme.write_text(seed, encoding="utf-8")
        _expect_runtime_error(
            SimpleNamespace(
                status=200,
                bozo=True,
                bozo_exception=ValueError("malformed XML"),
                entries=[],
            ),
            readme,
            "bozo parser failure",
        )

        # HTTP failure must stay red and must not mutate README.
        readme.write_text(seed, encoding="utf-8")
        _expect_runtime_error(
            SimpleNamespace(status=503, bozo=False, entries=[]),
            readme,
            "HTTP non-success",
        )

        # An invalid HTTP status representation must fail closed without mutation.
        readme.write_text(seed, encoding="utf-8")
        _expect_runtime_error(
            SimpleNamespace(status="not-a-status", bozo=False, entries=[]),
            readme,
            "invalid HTTP status",
        )

        # A parser result without an entries collection is not a valid empty feed.
        readme.write_text(seed, encoding="utf-8")
        _expect_runtime_error(
            SimpleNamespace(status=200, bozo=False),
            readme,
            "missing entries collection",
        )

        # A malformed first entry must remain red and must not mutate README.
        readme.write_text(seed, encoding="utf-8")
        _expect_runtime_error(
            SimpleNamespace(
                status=200,
                bozo=False,
                entries=[SimpleNamespace(title="Missing Link")],
            ),
            readme,
            "malformed first entry",
        )

        # Valid content still replaces exactly the governed marker block.
        readme.write_text(seed, encoding="utf-8")
        changed = update_latest_video(
            SimpleNamespace(
                status=200,
                bozo=False,
                entries=[SimpleNamespace(title="Test Video", link="https://example.invalid/video")],
            ),
            readme,
        )
        updated = readme.read_text(encoding="utf-8")
        assert changed is True
        assert "Test Video" in updated
        assert "https://example.invalid/video" in updated
        assert updated.count(START) == 1
        assert updated.count(END) == 1

    print("[update-latest-video-self-test] PASS")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="run deterministic feed/error/no-mutation regression coverage without network access",
    )
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    feed = feedparser.parse(RSS_URL)
    update_latest_video(feed, README_PATH)


if __name__ == "__main__":
    main()
