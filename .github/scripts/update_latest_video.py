# -*- coding: utf-8 -*-
import argparse
import contextlib
import io
import json
import re
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from types import SimpleNamespace

import feedparser

# 你的 YouTube RSS（免登入、免 cookie）
CHANNEL_ID = "UC2UE0sZXbKnvR-N0Ew6Z6NA"
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
CHANNEL_VIDEOS_URL = f"https://www.youtube.com/channel/{CHANNEL_ID}/videos"
RSS_RETRY_STATUSES = frozenset({500, 502, 503, 504})
RSS_RETRY_DELAYS = (1, 2)

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


def _channel_page_matches(page_text):
    """Confirm that a YouTube page belongs to the configured canonical channel."""
    identity_markers = (
        f'"browseId":"{CHANNEL_ID}"',
        f'"channelId":"{CHANNEL_ID}"',
        f"youtube.com/channel/{CHANNEL_ID}",
    )
    return any(marker in page_text for marker in identity_markers)


def _find_video_renderer(value):
    if isinstance(value, dict):
        renderer = value.get("videoRenderer")
        if isinstance(renderer, dict):
            return renderer
        lockup = value.get("lockupViewModel")
        if (
            isinstance(lockup, dict)
            and lockup.get("contentType") == "LOCKUP_CONTENT_TYPE_VIDEO"
        ):
            title = (
                lockup.get("metadata", {})
                .get("lockupMetadataViewModel", {})
                .get("title", {})
                .get("content")
            )
            return {
                "videoId": lockup.get("contentId"),
                "title": {"simpleText": title},
            }
        for child in value.values():
            found = _find_video_renderer(child)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _find_video_renderer(child)
            if found is not None:
                return found
    return None


def _extract_latest_video_from_channel_page(page_text):
    """Extract the first channel video from YouTube's structured initial page data."""
    markers = ("var ytInitialData = ", 'window["ytInitialData"] = ')
    initial_data = None
    for marker in markers:
        marker_index = page_text.find(marker)
        if marker_index == -1:
            continue
        payload = page_text[marker_index + len(marker) :]
        try:
            initial_data, _ = json.JSONDecoder().raw_decode(payload)
        except json.JSONDecodeError:
            continue
        break

    if initial_data is None:
        raise RuntimeError("canonical YouTube channel page has no parseable initial data")

    renderer = _find_video_renderer(initial_data)
    if renderer is None:
        return None

    video_id = renderer.get("videoId")
    title_data = renderer.get("title", {})
    title = title_data.get("simpleText")
    if not title:
        title = "".join(
            run.get("text", "")
            for run in title_data.get("runs", [])
            if isinstance(run, dict)
        )
    if not isinstance(video_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise RuntimeError("canonical YouTube channel page has an invalid first video id")
    if not title:
        raise RuntimeError("canonical YouTube channel page first video is missing a title")
    return SimpleNamespace(
        title=title,
        link=f"https://www.youtube.com/watch?v={video_id}",
    )


def _fetch_url(url, urlopen=urllib.request.urlopen):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; KLINE-Odyssey-RSS-Updater/1.0)"},
    )
    try:
        with urlopen(request, timeout=20) as response:
            return response.getcode(), response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()
    except Exception as exc:
        raise RuntimeError(f"YouTube request failed for {url}") from exc


def _load_feed(feed_parser=feedparser.parse, urlopen=urllib.request.urlopen, sleep=time.sleep):
    """Retry selected transient HTTP errors; verified page fallback remains 404-only."""
    for attempt in range(len(RSS_RETRY_DELAYS) + 1):
        status_code, rss_body = _fetch_url(RSS_URL, urlopen)
        if status_code not in RSS_RETRY_STATUSES:
            break
        if attempt == len(RSS_RETRY_DELAYS):
            raise RuntimeError(
                f"RSS_TRANSIENT_HTTP_EXHAUSTED: status {status_code} after {attempt + 1} attempts; "
                "README unchanged"
            )
        delay = RSS_RETRY_DELAYS[attempt]
        print(
            f"WARNING: RSS_TRANSIENT_HTTP: status {status_code}; "
            f"attempt {attempt + 1}/3; retrying in {delay}s",
            file=sys.stderr,
        )
        sleep(delay)

    if status_code != 404:
        if not isinstance(status_code, int) or not 200 <= status_code < 300:
            raise RuntimeError(f"RSS_HTTP_NON_RETRYABLE: status {status_code!r}; README unchanged")
        feed = feed_parser(rss_body)
        if not getattr(feed, "version", ""):
            raise RuntimeError("RSS_UNRECOGNIZED_FEED: HTTP success body is not a recognized RSS/Atom feed; README unchanged")
        feed.status = status_code
        return feed

    page_status, page_body = _fetch_url(CHANNEL_VIDEOS_URL, urlopen)
    page_text = page_body.decode("utf-8", errors="replace")

    if page_status != 200 or not _channel_page_matches(page_text):
        raise RuntimeError(
            "YouTube RSS returned 404 but the canonical channel page could not be verified"
        )

    latest_video = _extract_latest_video_from_channel_page(page_text)
    print(
        "WARNING: YouTube RSS returned 404; using the verified canonical channel page fallback",
        file=sys.stderr,
    )
    entries = [] if latest_video is None else [latest_video]
    return SimpleNamespace(status=200, bozo=False, entries=entries)


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

        # YouTube may return RSS 404 even when the channel page remains available.
        # The fallback must bind to the exact channel and parse structured page data.
        page_prefix = f'{{"browseId":"{CHANNEL_ID}"}}'
        empty_channel = page_prefix + "var ytInitialData = {\"contents\":[]};"
        assert _channel_page_matches(empty_channel) is True
        assert _extract_latest_video_from_channel_page(empty_channel) is None
        assert _channel_page_matches('{"browseId":"UC_WRONG"}') is False

        populated_channel = page_prefix + (
            'var ytInitialData = {"contents":[{"videoRenderer":'
            '{"videoId":"abcdefghijk","title":{"runs":[{"text":"Example Video"}]}}}]};'
        )
        latest = _extract_latest_video_from_channel_page(populated_channel)
        assert latest.title == "Example Video"
        assert latest.link == "https://www.youtube.com/watch?v=abcdefghijk"

        lockup_channel = page_prefix + (
            'var ytInitialData = {"contents":[{"lockupViewModel":'
            '{"contentId":"zyxwvutsrqp","contentType":"LOCKUP_CONTENT_TYPE_VIDEO",'
            '"metadata":{"lockupMetadataViewModel":{"title":{"content":"Lockup Video"}}}}}]};'
        )
        latest = _extract_latest_video_from_channel_page(lockup_channel)
        assert latest.title == "Lockup Video"
        assert latest.link == "https://www.youtube.com/watch?v=zyxwvutsrqp"

        class FakeResponse:
            def __init__(self, status, body):
                self._status = status
                self._body = body

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def getcode(self):
                return self._status

            def read(self):
                return self._body

        def fake_urlopen(request, timeout):
            assert timeout == 20
            if request.full_url == RSS_URL:
                return FakeResponse(404, b"not found")
            if request.full_url == CHANNEL_VIDEOS_URL:
                return FakeResponse(200, lockup_channel.encode("utf-8"))
            raise AssertionError(f"unexpected URL: {request.full_url}")

        fallback_feed = _load_feed(urlopen=fake_urlopen)
        fallback_entries = _validate_feed(fallback_feed)
        assert len(fallback_entries) == 1
        assert fallback_entries[0].title == "Lockup Video"

        # Transient HTTP retry is bounded; error bodies never reach the parser.
        def retry_case(statuses, expected_delays, expected_error=None, http_error=False):
            readme.write_text(seed, encoding="utf-8")
            before = readme.read_bytes()
            calls, delays, parsed = [], [], []
            remaining = iter(statuses)

            def open_sequence(request, timeout):
                assert timeout == 20
                calls.append(request.full_url)
                if request.full_url == CHANNEL_VIDEOS_URL:
                    return FakeResponse(200, lockup_channel.encode("utf-8"))
                assert request.full_url == RSS_URL
                status = next(remaining)
                body = b"valid-feed" if status == 200 else b"untrusted-error-body"
                if http_error and status >= 400:
                    raise urllib.error.HTTPError(request.full_url, status, "error", {}, io.BytesIO(body))
                return FakeResponse(status, body)

            def parse_valid(body):
                parsed.append(body)
                assert body == b"valid-feed", "HTTP error body reached parser"
                return SimpleNamespace(version="atom10", bozo=False, entries=[SimpleNamespace(
                    title="Recovered Video", link="https://www.youtube.com/watch?v=abcdefghijk"
                )])

            with contextlib.redirect_stderr(io.StringIO()):
                try:
                    feed = _load_feed(parse_valid, open_sequence, delays.append)
                    update_latest_video(feed, readme)
                except RuntimeError as exc:
                    assert expected_error and expected_error in str(exc), str(exc)
                    assert readme.read_bytes() == before
                else:
                    assert expected_error is None, "expected fail-closed HTTP error"
            assert delays == expected_delays
            assert calls.count(RSS_URL) == len(statuses)
            assert calls.count(CHANNEL_VIDEOS_URL) == int(statuses[-1] == 404)
            assert len(parsed) == int(statuses[-1] == 200)

        retry_case([500, 200], [1])
        retry_case([502, 503, 200], [1, 2])
        retry_case([500, 404], [1])
        retry_case([500, 200], [1], http_error=True)
        for status in sorted(RSS_RETRY_STATUSES):
            retry_case([status] * 3, [1, 2], "RSS_TRANSIENT_HTTP_EXHAUSTED")
        for status in (400, 401, 403, 429, 501):
            retry_case([status], [], "RSS_HTTP_NON_RETRYABLE")

        # Real parser coverage: an HTTP 200 error document may have entries and
        # bozo=False without being a recognized feed. Never publish that body.
        valid_atom = (
            b'<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">'
            b'<title>Channel</title><entry><title>Recovered Video</title>'
            b'<link href="https://www.youtube.com/watch?v=abcdefghijk"/>'
            b'</entry></feed>'
        )
        empty_atom = b'<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"/>'
        error_with_item = (
            b'<?xml version="1.0"?><error><item><title>Upstream error</title>'
            b'<link>https://example.invalid/error</link></item></error>'
        )

        def real_body_case(body, retry=False, expected_error=None, expected_change=False):
            readme.write_text(seed, encoding="utf-8")
            responses = [(200, body)]
            if retry:
                responses.insert(0, (500, error_with_item))
            remaining = iter(responses)
            calls, delays = [], []

            def open_body(request, timeout):
                assert request.full_url == RSS_URL
                assert timeout == 20
                calls.append(request.full_url)
                return FakeResponse(*next(remaining))

            with contextlib.redirect_stderr(io.StringIO()):
                try:
                    feed = _load_feed(urlopen=open_body, sleep=delays.append)
                    changed = update_latest_video(feed, readme)
                except RuntimeError as exc:
                    assert expected_error and expected_error in str(exc), str(exc)
                    assert readme.read_bytes() == seed.encode("utf-8")
                else:
                    assert expected_error is None
                    assert changed is expected_change
                    if not expected_change:
                        assert readme.read_bytes() == seed.encode("utf-8")
                    else:
                        assert "Recovered Video" in readme.read_text(encoding="utf-8")
                        assert "example.invalid/error" not in readme.read_text(encoding="utf-8")
            assert len(calls) == len(responses)
            assert delays == ([1] if retry else [])

        for retry in (False, True):
            for body in (b'', b'<html><body>Error</body></html>', error_with_item):
                real_body_case(body, retry, "RSS_UNRECOGNIZED_FEED")
            real_body_case(empty_atom, retry)
            real_body_case(valid_atom, retry, expected_change=True)

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

    feed = _load_feed()
    update_latest_video(feed, README_PATH)


if __name__ == "__main__":
    main()
