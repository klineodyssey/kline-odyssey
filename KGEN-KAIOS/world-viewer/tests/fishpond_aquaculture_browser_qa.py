#!/usr/bin/env python3
"""Responsive browser QA for the public Fishpond Aquaculture Viewer."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from playwright.sync_api import sync_playwright


@dataclass(frozen=True)
class Viewport:
    width: int
    height: int


VIEWPORTS = (
    Viewport(360, 800),
    Viewport(390, 844),
    Viewport(768, 1024),
    Viewport(1440, 900),
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8001")
    args = parser.parse_args()
    failures: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            for viewport in VIEWPORTS:
                label = f"{viewport.width}x{viewport.height}"
                context = browser.new_context(viewport={"width": viewport.width, "height": viewport.height})
                page = context.new_page()
                console_errors: list[str] = []
                page.on(
                    "console",
                    lambda message: console_errors.append(
                        f"{page.url} {message.location.get('url', '')}:{message.location.get('lineNumber', '')} {message.text}"
                    ) if message.type == "error" and message.location.get("url", "").startswith(args.base_url) else None,
                )
                page.on("pageerror", lambda error: console_errors.append(str(error)))
                try:
                    page.goto(f"{args.base_url}/", wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_selector("#aquaculture-runtime", state="visible", timeout=10000)
                    if page.get_by_text("KAIOS 魚塭水產世界", exact=True).count() < 1:
                        failures.append(f"{label}: homepage marker missing")
                    if page.locator('a[href="./world-viewer/aquaculture-v1/"]').count() < 2:
                        failures.append(f"{label}: homepage navigation/card links missing")
                    if page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"):
                        failures.append(f"{label}: homepage horizontal overflow")

                    page.goto(f"{args.base_url}/world-viewer/aquaculture-v1/", wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_function("document.querySelector('#runtime-state')?.textContent !== 'LOADING'", timeout=10000)
                    if not page.get_by_role("heading", name="KAIOS Fishpond Aquaculture Runtime V1").is_visible():
                        failures.append(f"{label}: viewer heading hidden")
                    if not page.get_by_role("link", name="返回官方首頁").is_visible():
                        failures.append(f"{label}: home link hidden")
                    if page.locator("#error").is_visible():
                        failures.append(f"{label}: runtime error state visible")
                    if page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"):
                        failures.append(f"{label}: viewer horizontal overflow")
                    for control in ("#select-land", "#start", "#advance", "#run-scenario", "#reset"):
                        box = page.locator(control).bounding_box()
                        if not box or box["height"] < 40:
                            failures.append(f"{label}: impractical touch target {control}")
                    page.locator("#select-land").click()
                    page.locator("#start").click()
                    page.locator("#advance").click()
                    if page.locator("#error").is_visible():
                        failures.append(f"{label}: basic interaction entered error state")
                    if console_errors:
                        failures.append(f"{label}: console errors: {' | '.join(console_errors)}")
                finally:
                    context.close()
                print(f"PASS {label}" if not any(item.startswith(label) for item in failures) else f"FAIL {label}")
        finally:
            browser.close()

    if failures:
        for failure in failures:
            print(f"ERROR {failure}")
        return 1
    print("PASS fishpond aquaculture responsive browser QA")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
