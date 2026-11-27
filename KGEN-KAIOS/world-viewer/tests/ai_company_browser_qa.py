#!/usr/bin/env python3
"""Responsive browser QA for the public KAIOS AI Company Viewer."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import os
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright


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


def exercise_countdown(page: Page, base_url: str) -> None:
    page.goto(f"{base_url}/world-viewer/ai-company-v1/?order=AIANT-556-TIMER-001")
    display = page.get_by_role("timer")
    status = page.get_by_role("status")
    seconds = page.get_by_label("設定秒數")
    start = page.get_by_role("button", name="開始", exact=True)
    pause = page.get_by_role("button", name="暫停", exact=True)
    reset = page.get_by_role("button", name="歸零", exact=True)
    expect(page.get_by_role("heading", name="倒數計時器")).to_be_visible()
    expect(display).to_have_text("0")
    page.evaluate("""() => {
        window.expirations = 0;
        const status = document.querySelector('#timer-status');
        new MutationObserver(() => {
            if (status.textContent === '時間到！') window.expirations++;
        }).observe(status, {childList: true, subtree: true});
    }""")
    seconds.fill("5")
    start.click()
    expect(display).to_have_text("5")
    expect(display).to_have_text("4")
    pause.click()
    expect(status).to_have_text("已暫停")
    frozen = display.inner_text()
    assert 0 < int(frozen) < 5
    page.wait_for_timeout(5100)
    expect(display).to_have_text(frozen)
    assert page.evaluate("window.expirations") == 0
    start.click()
    expect(display).to_have_text(frozen)
    expect(status).to_have_text("時間到！", timeout=7000)
    expect(display).to_have_text("0")
    page.wait_for_timeout(1100)
    assert page.evaluate("window.expirations") == 1
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    for button in (start, pause, reset):
        box = button.bounding_box()
        assert box and box["height"] >= 44 and box["width"] >= 44
    if os.environ.get("RUNNER_TEMP"):
        directory = Path(os.environ["RUNNER_TEMP"]) / "world-viewer-product-qa"
        directory.mkdir(exist_ok=True, parents=True)
        page.screenshot(path=directory / "AIANT-556-TIMER-001-390x844.png")
    seconds.fill("2")
    start.click()
    expect(display).to_have_text("1")
    reset.click()
    expect(display).to_have_text("0")
    page.wait_for_timeout(2200)
    expect(status).to_have_text("已歸零")
    expect(display).to_have_text("0")
    assert page.evaluate("window.expirations") == 1
    print(f"PASS AIANT-556-TIMER-001: 5 -> {frozen}; paused 5.1s; resumed -> 0; one notice; reset -> 0 with no late notice")


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
                context = browser.new_context(
                    viewport={"width": viewport.width, "height": viewport.height}
                )
                homepage = context.new_page()
                console_errors: list[str] = []
                homepage_errors: list[str] = []
                try:
                    if viewport == Viewport(390, 844):
                        timer = context.new_page()
                        exercise_countdown(timer, args.base_url)
                        timer.close()
                    homepage.on(
                        "console",
                        lambda message, page=homepage: homepage_errors.append(
                            f"{page.url} {message.location.get('url', '')}:"
                            f"{message.location.get('lineNumber', '')} {message.text}"
                        )
                        if message.type == "error"
                        and message.location.get("url", "").startswith(args.base_url)
                        else None,
                    )
                    homepage.on("pageerror", lambda error: homepage_errors.append(str(error)))
                    homepage.goto(f"{args.base_url}/", wait_until="domcontentloaded", timeout=20000)
                    homepage.wait_for_function(
                        "document.querySelector('#researchArchiveCards [data-world-id=\"ai-company\"]') !== null",
                        timeout=10000,
                    )
                    archive = homepage.locator("#researchArchive")
                    if archive.get_attribute("open") is not None:
                        failures.append(f"{label}: research should not dominate first-screen playable worlds")
                    homepage.locator("#researchArchive > summary").click()
                    card = homepage.locator('#researchArchiveCards [data-world-id="ai-company"]')
                    if not card.is_visible() or card.get_attribute("data-status") != "RESEARCH":
                        failures.append(f"{label}: informational AI Company disclosure unavailable")
                    if "NO EXTERNAL AUTONOMY" not in card.inner_text():
                        failures.append(f"{label}: informational authority boundary missing")
                    info_link = card.get_by_role("link", name="了解更多 ↗", exact=True)
                    if info_link.count() != 1 or not info_link.get_attribute("href").endswith(
                        "/world-viewer/ai-company-v1/"
                    ):
                        failures.append(f"{label}: canonical AI Company informational route missing")
                    if card.locator('[data-world-id="ai-company"]').count() or "PLAYABLE" in card.inner_text():
                        failures.append(f"{label}: research falsely promoted as playable")
                    if homepage.evaluate(
                        "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
                    ):
                        failures.append(f"{label}: homepage horizontal overflow")
                    if homepage_errors:
                        failures.append(f"{label}: homepage console errors: {' | '.join(homepage_errors)}")
                    info_link.click()
                    homepage.wait_for_url("**/world-viewer/ai-company-v1/")
                    if not homepage.get_by_role("heading", name="KAIOS AI Company").is_visible():
                        failures.append(f"{label}: Portal research link did not reach the actual Viewer")
                    homepage.close()

                    page = context.new_page()
                    page.on(
                        "console",
                        lambda message, page=page: console_errors.append(
                            f"{page.url} {message.location.get('url', '')}:"
                            f"{message.location.get('lineNumber', '')} {message.text}"
                        )
                        if message.type == "error"
                        and message.location.get("url", "").startswith(args.base_url)
                        else None,
                    )
                    page.on("pageerror", lambda error: console_errors.append(str(error)))

                    page.goto(
                        f"{args.base_url}/world-viewer/ai-company-v1/",
                        wait_until="domcontentloaded",
                        timeout=20000,
                    )
                    page.wait_for_function(
                        "document.querySelector('#runtime-state')?.textContent !== 'LOADING'",
                        timeout=10000,
                    )
                    if not page.get_by_role("heading", name="KAIOS AI Company").is_visible():
                        failures.append(f"{label}: viewer heading hidden")
                    if not page.get_by_role("link", name="返回官方首頁").is_visible():
                        failures.append(f"{label}: home link hidden")
                    if page.locator("#error").is_visible():
                        failures.append(f"{label}: runtime error state visible")
                    if page.evaluate(
                        "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
                    ):
                        failures.append(f"{label}: viewer horizontal overflow")
                    for control in (
                        "#submit-request",
                        "#analyze",
                        "#feasibility",
                        "#advance",
                        "#run-demo",
                        "#reset",
                    ):
                        box = page.locator(control).bounding_box()
                        if not box or box["height"] < 40:
                            failures.append(f"{label}: impractical touch target {control}")
                    page.locator("#submit-request").click()
                    page.locator("#analyze").click()
                    page.locator("#feasibility").click()
                    if page.locator("#error").is_visible():
                        failures.append(f"{label}: basic interaction entered error state")

                    page.locator("#reset").click()
                    page.locator("#demo-select").select_option("FISHPOND_PROJECT")
                    page.locator("#run-demo").click()
                    page.wait_for_function(
                        "document.querySelector('#notice')?.textContent.includes('COMPLETE')",
                        timeout=30000,
                    )
                    view_values = page.locator("#view-select option").evaluate_all(
                        "options => options.map(option => option.value)"
                    )
                    for view_value in view_values:
                        page.locator("#view-select").select_option(view_value)
                        if page.locator("#error").is_visible():
                            failures.append(f"{label}: {view_value} view entered error state")
                            break
                    if page.evaluate(
                        "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
                    ):
                        failures.append(f"{label}: populated viewer horizontal overflow")

                    page.locator("#reset").click()
                    page.locator("#demo-select").select_option("SMALL_FARM_PROJECT")
                    page.locator("#run-demo").click()
                    if "BLOCKED_DEPENDENCY" not in page.locator("#notice").inner_text():
                        failures.append(f"{label}: farm dependency was not truthfully blocked")
                    if console_errors:
                        failures.append(f"{label}: console errors: {' | '.join(console_errors)}")
                finally:
                    context.close()
                print(
                    f"PASS {label}"
                    if not any(item.startswith(label) for item in failures)
                    else f"FAIL {label}"
                )
        finally:
            browser.close()

    if failures:
        for failure in failures:
            print(f"ERROR {failure}")
        return 1
    print("PASS AI Company responsive browser QA")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
