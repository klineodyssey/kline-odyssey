#!/usr/bin/env python3
"""Repeatable browser Product QA gate for the KAIOS World Viewer Alpha."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urljoin, urlsplit

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)


TEST_ROOT = Path(__file__).resolve().parent
VIEWER_ROOT = TEST_ROOT.parent
FIXTURE_PATH = VIEWER_ROOT / "data" / "synthetic-world.json"
REPORT_SCHEMA = "KAIOS_WORLD_VIEWER_PRODUCT_QA_V1"

PERFORMANCE_BUDGETS = {
    "desktop_first_usable_ms": 2500.0,
    "touch_first_usable_ms": 2500.0,
    "critical_payload_bytes": 1_572_864,
    "minimum_fps": 30.0,
    "maximum_render_ms": 50.0,
    "desktop_heap_bytes": 268_435_456,
    "touch_heap_bytes": 167_772_160,
}

PROPOSAL_ACTIONS = (
    "RESIDENTIAL",
    "FARM",
    "FOREST",
    "FACTORY",
    "MARKETPLACE",
    "TEMPLE",
    "RESEARCH",
    "PUBLIC_FACILITY",
)

LIFE_LAYER_LABELS = (
    "Body",
    "Species OS",
    "Individual Life OS",
    "Mind",
    "Citizen",
)

FORBIDDEN_LIFE_LABELS = re.compile(
    r"(?:raw\s*kyc|exact\s*gps|wallet(?:\s*address)?|salary|payroll|private\s*key|"
    r"seed\s*phrase|mnemonic|password|auth\s*token)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ViewportCase:
    slug: str
    family: str
    orientation: str
    width: int
    height: int
    theme: str
    touch: bool
    device_scale_factor: float
    user_agent: str | None = None


MATRIX = (
    ViewportCase("desktop-dark", "desktop", "landscape", 1440, 900, "dark", False, 1),
    ViewportCase("desktop-light", "desktop", "landscape", 1280, 800, "light", False, 1),
    ViewportCase("tablet-portrait-light", "tablet", "portrait", 820, 1180, "light", True, 1),
    ViewportCase("tablet-landscape-dark", "tablet", "landscape", 1180, 820, "dark", True, 1),
    ViewportCase(
        "android-portrait-dark",
        "android",
        "portrait",
        412,
        915,
        "dark",
        True,
        2,
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36",
    ),
    ViewportCase(
        "android-landscape-light",
        "android",
        "landscape",
        915,
        412,
        "light",
        True,
        2,
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36",
    ),
    ViewportCase(
        "iphone-portrait-light",
        "iphone",
        "portrait",
        390,
        844,
        "light",
        True,
        2,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    ),
    ViewportCase(
        "iphone-landscape-dark",
        "iphone",
        "landscape",
        844,
        390,
        "dark",
        True,
        2,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    ),
)


def stable_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(text, encoding="utf-8", newline="\n")
    temporary.replace(path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value)).strip()


def relative_url(url: str, origin: str) -> str:
    return url[len(origin):] or "/" if url.startswith(origin) else url


class Gate:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []
        self.browser_observations: list[dict[str, Any]] = []
        self.performance: list[dict[str, Any]] = []
        self.screenshots: list[dict[str, Any]] = []

    def add(
        self,
        check_id: str,
        category: str,
        status: str,
        *,
        case: str | None = None,
        details: Any = None,
    ) -> None:
        item: dict[str, Any] = {
            "category": category,
            "id": check_id,
            "status": status,
        }
        if case is not None:
            item["case"] = case
        if details is not None:
            item["details"] = details
        self.checks.append(item)

    def expect(
        self,
        check_id: str,
        category: str,
        condition: bool,
        *,
        case: str | None = None,
        details: Any = None,
    ) -> bool:
        self.add(
            check_id,
            category,
            "PASS" if condition else "FAIL",
            case=case,
            details=details,
        )
        return condition

    def guarded(
        self,
        check_id: str,
        category: str,
        callback: Callable[[], tuple[bool, Any] | bool],
        *,
        case: str | None = None,
    ) -> bool:
        try:
            outcome = callback()
            if isinstance(outcome, tuple):
                condition, details = outcome
            else:
                condition, details = bool(outcome), None
            return self.expect(
                check_id,
                category,
                bool(condition),
                case=case,
                details=details,
            )
        except Exception as error:  # The report must survive individual gate failures.
            self.add(
                check_id,
                category,
                "FAIL",
                case=case,
                details={"error": clean_text(error)},
            )
            return False

    @property
    def failed(self) -> bool:
        return any(item["status"] == "FAIL" for item in self.checks)

    def summary(self) -> dict[str, int]:
        counts = {"failed": 0, "passed": 0, "skipped": 0, "total": len(self.checks)}
        for item in self.checks:
            key = {"PASS": "passed", "FAIL": "failed", "SKIP": "skipped"}[item["status"]]
            counts[key] += 1
        return counts


class BrowserMonitor:
    def __init__(self, page: Page, base_url: str) -> None:
        self.origin = f"{urlsplit(base_url).scheme}://{urlsplit(base_url).netloc}"
        self.console_errors: list[str] = []
        self.page_errors: list[str] = []
        self.request_failures: list[dict[str, str]] = []
        self.bad_responses: list[dict[str, Any]] = []
        self.external_requests: list[dict[str, str]] = []
        self.mutating_requests: list[dict[str, str]] = []
        page.on("console", self._on_console)
        page.on("pageerror", self._on_page_error)
        page.on("requestfailed", self._on_request_failed)
        page.on("response", self._on_response)
        page.on("request", self._on_request)

    def _display_url(self, url: str) -> str:
        return relative_url(url, self.origin)

    def _on_console(self, message: Any) -> None:
        if message.type == "error":
            self.console_errors.append(clean_text(message.text))

    def _on_page_error(self, error: Any) -> None:
        self.page_errors.append(clean_text(error))

    def _on_request_failed(self, request: Any) -> None:
        self.request_failures.append({
            "failure": clean_text(request.failure or "UNKNOWN"),
            "method": request.method,
            "url": self._display_url(request.url),
        })

    def _on_response(self, response: Any) -> None:
        if response.status >= 400:
            self.bad_responses.append({
                "status": response.status,
                "url": self._display_url(response.url),
            })

    def _on_request(self, request: Any) -> None:
        parsed = urlsplit(request.url)
        request_origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else ""
        if request_origin and request_origin != self.origin and parsed.scheme not in {"data", "blob"}:
            self.external_requests.append({"method": request.method, "url": request.url})
        if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
            self.mutating_requests.append({
                "method": request.method.upper(),
                "url": self._display_url(request.url),
            })

    def report(self, case: str) -> dict[str, Any]:
        return {
            "bad_responses": sorted(self.bad_responses, key=lambda item: (item["url"], item["status"])),
            "case": case,
            "console_errors": sorted(set(self.console_errors)),
            "external_requests": sorted(
                self.external_requests, key=lambda item: (item["url"], item["method"])
            ),
            "mutating_requests": sorted(
                self.mutating_requests, key=lambda item: (item["url"], item["method"])
            ),
            "page_errors": sorted(set(self.page_errors)),
            "request_failures": sorted(
                self.request_failures,
                key=lambda item: (item["url"], item["method"], item["failure"]),
            ),
        }


def new_context(browser: Browser, case: ViewportCase) -> BrowserContext:
    options: dict[str, Any] = {
        "viewport": {"width": case.width, "height": case.height},
        "device_scale_factor": case.device_scale_factor,
        "has_touch": case.touch,
        "is_mobile": case.family in {"android", "iphone"},
        "color_scheme": case.theme,
        "reduced_motion": "reduce",
        "locale": "en-US",
    }
    if case.user_agent:
        options["user_agent"] = case.user_agent
    return browser.new_context(**options)


def load_page(page: Page, base_url: str, theme: str) -> dict[str, Any]:
    page.set_default_timeout(7000)
    response = page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
    if response is None or response.status >= 400:
        raise AssertionError(f"navigation failed: {response.status if response else 'NO_RESPONSE'}")
    page.wait_for_function(
        """() => document.documentElement.dataset.worldViewerRendered === "true"
          && document.getElementById("loading-state")?.hidden === true""",
        timeout=10000,
    )
    page.add_style_tag(content="""
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-duration: 0.001ms !important;
      }
    """)
    page.evaluate("document.getElementById('toast-region')?.classList.remove('is-visible')")
    set_theme(page, theme)
    page.evaluate("""
      async () => {
        for (let index = 0; index < 8; index += 1) {
          document.getElementById(index % 2 ? "zoom-out-button" : "zoom-in-button")?.click();
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
      }
    """)
    page.wait_for_timeout(60)
    return read_performance(page)


def set_theme(page: Page, target: str) -> None:
    current = page.locator("#app-shell").get_attribute("data-theme")
    if current != target:
        page.evaluate("document.getElementById('theme-button')?.click()")
        page.wait_for_function(
            "theme => document.getElementById('app-shell')?.dataset.theme === theme",
            arg=target,
        )
    actual = page.locator("#app-shell").get_attribute("data-theme")
    if actual != target:
        raise AssertionError(f"theme is {actual}, expected {target}")


def read_performance(page: Page) -> dict[str, Any]:
    metrics = page.evaluate("""
      () => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const resources = performance.getEntriesByType("resource");
        const paints = Object.fromEntries(
          performance.getEntriesByType("paint").map(entry => [entry.name, entry.startTime])
        );
        const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
        return {
          dom_content_loaded_ms: number(navigation?.domContentLoadedEventEnd),
          first_contentful_paint_ms: number(paints["first-contentful-paint"]),
          first_usable_ms: number(performance.now()),
          heap_bytes: number(performance.memory?.usedJSHeapSize),
          load_event_ms: number(navigation?.loadEventEnd),
          renderer_fps: number(document.documentElement.dataset.worldViewerFps),
          renderer_ms: number(document.documentElement.dataset.worldViewerRenderMs),
          resource_count: resources.length,
          transfer_bytes: resources.reduce((total, entry) => (
            total + (entry.transferSize || entry.encodedBodySize || 0)
          ), navigation?.transferSize || navigation?.encodedBodySize || 0)
        };
      }
    """)
    return {
        key: round(value, 3) if isinstance(value, float) else value
        for key, value in metrics.items()
    }


def assess_performance(case: ViewportCase, metrics: dict[str, Any]) -> dict[str, Any]:
    first_usable_budget = (
        PERFORMANCE_BUDGETS["touch_first_usable_ms"]
        if case.touch
        else PERFORMANCE_BUDGETS["desktop_first_usable_ms"]
    )
    heap_budget = (
        PERFORMANCE_BUDGETS["touch_heap_bytes"]
        if case.touch
        else PERFORMANCE_BUDGETS["desktop_heap_bytes"]
    )
    results = {
        "critical_payload": metrics.get("transfer_bytes") is not None
        and metrics["transfer_bytes"] <= PERFORMANCE_BUDGETS["critical_payload_bytes"],
        "first_usable": metrics.get("first_usable_ms") is not None
        and metrics["first_usable_ms"] <= first_usable_budget,
        "heap": metrics.get("heap_bytes") in {None, 0}
        or metrics["heap_bytes"] <= heap_budget,
        "renderer_fps": metrics.get("renderer_fps") is not None
        and metrics["renderer_fps"] >= PERFORMANCE_BUDGETS["minimum_fps"],
        "renderer_time": metrics.get("renderer_ms") is not None
        and metrics["renderer_ms"] <= PERFORMANCE_BUDGETS["maximum_render_ms"],
    }
    return {
        "budgets": {
            "first_usable_ms": first_usable_budget,
            "heap_bytes": heap_budget,
            "minimum_fps": PERFORMANCE_BUDGETS["minimum_fps"],
            "maximum_render_ms": PERFORMANCE_BUDGETS["maximum_render_ms"],
            "transfer_bytes": PERFORMANCE_BUDGETS["critical_payload_bytes"],
        },
        "case": case.slug,
        "metrics": metrics,
        "results": results,
        "status": "PASS" if all(results.values()) else "FAIL",
    }


def measure_overflow(page: Page) -> dict[str, Any]:
    return page.evaluate("""
      () => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden"
            && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
        };
        const selectors = [
          ".app-shell", ".topbar", ".toolbar", ".workspace", ".mode-rail",
          "#world-canvas", ".map-status"
        ];
        const offenders = selectors.flatMap(selector => [...document.querySelectorAll(selector)])
          .filter(visible)
          .map(element => {
            const rect = element.getBoundingClientRect();
            return {
              selector: element.id ? `#${element.id}` : `.${element.classList[0] || element.tagName}`,
              left: Math.round(rect.left * 10) / 10,
              right: Math.round(rect.right * 10) / 10,
              top: Math.round(rect.top * 10) / 10,
              bottom: Math.round(rect.bottom * 10) / 10
            };
          })
          .filter(rect => rect.left < -1 || rect.right > innerWidth + 1
            || rect.top < -1 || rect.bottom > innerHeight + 1);
        return {
          document_height: document.documentElement.scrollHeight,
          document_width: document.documentElement.scrollWidth,
          offenders,
          viewport_height: innerHeight,
          viewport_width: innerWidth
        };
      }
    """)


def measure_touch_targets(page: Page) -> dict[str, Any]:
    return page.evaluate("""
      () => {
        const candidates = [...document.querySelectorAll(
          "button, a[href], input, select, textarea, [role=button], [role=menuitem]"
        )];
        const visible = candidates.filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return !element.closest("[hidden], .visually-hidden")
            && style.display !== "none" && style.visibility !== "hidden"
            && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
            && rect.right > 0 && rect.left < innerWidth
            && rect.bottom > 0 && rect.top < innerHeight;
        });
        const violations = visible.map(element => {
          const rect = element.getBoundingClientRect();
          return {
            height: Math.round(rect.height * 10) / 10,
            name: element.getAttribute("aria-label") || element.title
              || element.textContent.trim().replace(/\\s+/g, " ").slice(0, 80)
              || element.id || element.tagName,
            width: Math.round(rect.width * 10) / 10
          };
        }).filter(item => item.width < 43.5 || item.height < 43.5);
        return {checked: visible.length, violations};
      }
    """)


def measure_safe_area(page: Page) -> dict[str, Any]:
    return page.evaluate("""
      async () => {
        const root = document.documentElement;
        const names = ["--safe-top", "--safe-right", "--safe-bottom", "--safe-left"];
        const previous = Object.fromEntries(names.map(name => [name, root.style.getPropertyValue(name)]));
        root.style.setProperty("--safe-top", "17px");
        root.style.setProperty("--safe-right", "11px");
        root.style.setProperty("--safe-bottom", "19px");
        root.style.setProperty("--safe-left", "13px");
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const bounds = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom};
        };
        const result = {
          brand: bounds(".brand-mark"),
          inspector: bounds("#inspector-panel"),
          mobile: matchMedia("(max-width: 900px)").matches,
          rail: bounds(".mode-rail"),
          toolbar: bounds(".toolbar"),
          viewport_height: innerHeight,
          viewport_width: innerWidth
        };
        names.forEach(name => {
          if (previous[name]) root.style.setProperty(name, previous[name]);
          else root.style.removeProperty(name);
        });
        await new Promise(resolve => requestAnimationFrame(resolve));
        return result;
      }
    """)


def assess_safe_area(measurement: dict[str, Any]) -> bool:
    brand = measurement.get("brand") or {}
    toolbar = measurement.get("toolbar") or {}
    if brand.get("left", -math.inf) < 12.5 or brand.get("top", -math.inf) < 16.5:
        return False
    if toolbar.get("right", math.inf) > measurement["viewport_width"] - 10.5:
        return False
    if measurement.get("mobile"):
        rail = measurement.get("rail") or {}
        inspector = measurement.get("inspector") or {}
        if rail.get("left", -math.inf) < 12.5:
            return False
        if inspector.get("left", -math.inf) < 12.5:
            return False
        if inspector.get("right", math.inf) > measurement["viewport_width"] - 10.5:
            return False
    return True


def inspect_accessibility(page: Page) -> dict[str, Any]:
    result = page.evaluate("""
      () => {
        const ids = [...document.querySelectorAll("[id]")].map(element => element.id);
        const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return !element.closest("[hidden]") && style.display !== "none"
            && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
            && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight;
        };
        const controls = [...document.querySelectorAll(
          "button, a[href], input, select, textarea, [role=button], [role=menuitem]"
        )].filter(visible);
        const missing_names = controls.filter(element => !(
          element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")
          || element.title || element.textContent.trim() || element.getAttribute("value")
        )).map(element => element.id || element.tagName);
        const images_without_alt = [...document.querySelectorAll("img")]
          .filter(image => !image.hasAttribute("alt"))
          .map(image => image.src);
        return {
          canvas_labelled: Boolean(document.querySelector(
            "#world-canvas[tabindex][role][aria-label]"
          )),
          duplicate_ids: duplicates,
          html_lang: document.documentElement.lang,
          images_without_alt,
          live_region: Boolean(document.querySelector("[aria-live]")),
          main_landmark: Boolean(document.querySelector("main")),
          missing_control_names: missing_names,
          named_navigation: [...document.querySelectorAll("nav")].every(nav => (
            nav.getAttribute("aria-label") || nav.getAttribute("aria-labelledby")
          )),
          title: document.title
        };
      }
    """)
    page.locator("body").press("Tab")
    focus = page.evaluate("""
      () => {
        const element = document.activeElement;
        const style = getComputedStyle(element);
        return {
          name: element?.getAttribute?.("aria-label") || element?.textContent?.trim() || element?.tagName,
          outline_style: style.outlineStyle,
          outline_width: style.outlineWidth,
          tag: element?.tagName
        };
      }
    """)
    page.evaluate("document.activeElement?.blur()")
    result["keyboard_focus"] = focus
    return result


def accessibility_passes(result: dict[str, Any]) -> bool:
    focus = result.get("keyboard_focus", {})
    focus_visible = focus.get("tag") not in {None, "BODY", "HTML"} and (
        focus.get("outline_style") not in {None, "none"}
        and focus.get("outline_width") not in {None, "0px"}
    )
    return all((
        bool(result.get("html_lang")),
        bool(result.get("title")),
        result.get("main_landmark") is True,
        result.get("named_navigation") is True,
        result.get("canvas_labelled") is True,
        result.get("live_region") is True,
        not result.get("duplicate_ids"),
        not result.get("missing_control_names"),
        not result.get("images_without_alt"),
        focus_visible,
    ))


def check_local_links(context: BrowserContext, page: Page, base_url: str) -> dict[str, Any]:
    origin = f"{urlsplit(base_url).scheme}://{urlsplit(base_url).netloc}"
    references = page.evaluate("""
      () => [...document.querySelectorAll("a[href], link[href], script[src]")].map(element => ({
        tag: element.tagName.toLowerCase(),
        value: element.getAttribute("href") || element.getAttribute("src")
      }))
    """)
    checked: list[dict[str, Any]] = []
    external: list[str] = []
    for item in references:
        value = item.get("value") or ""
        if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
            continue
        resolved = urljoin(base_url, value)
        parsed = urlsplit(resolved)
        resolved_origin = f"{parsed.scheme}://{parsed.netloc}"
        if resolved_origin != origin:
            external.append(resolved)
            continue
        response = context.request.get(resolved, fail_on_status_code=False, timeout=7000)
        checked.append({
            "status": response.status,
            "tag": item["tag"],
            "url": relative_url(resolved, origin),
        })
    return {
        "checked": sorted(checked, key=lambda item: (item["url"], item["tag"])),
        "external": sorted(set(external)),
    }


def image_diff(
    current_path: Path,
    baseline_path: Path,
    diff_path: Path,
    pixel_threshold: int,
) -> dict[str, Any]:
    with Image.open(current_path) as current_image, Image.open(baseline_path) as baseline_image:
        current = current_image.convert("RGBA")
        baseline = baseline_image.convert("RGBA")
        if current.size != baseline.size:
            return {
                "baseline_size": list(baseline.size),
                "current_size": list(current.size),
                "mismatch_ratio": 1.0,
                "reason": "SIZE_MISMATCH",
            }
        difference = ImageChops.difference(current, baseline)
        red, green, blue, alpha = difference.split()
        maximum = ImageChops.lighter(ImageChops.lighter(red, green), ImageChops.lighter(blue, alpha))
        mask = maximum.point(lambda value: 255 if value > pixel_threshold else 0)
        histogram = mask.histogram()
        mismatched = sum(histogram[1:])
        total = current.size[0] * current.size[1]
        ratio = mismatched / total if total else 0.0
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        amplified = difference.point(lambda value: min(255, value * 4))
        amplified.save(diff_path, format="PNG", optimize=False)
        return {
            "diff_image": diff_path.as_posix(),
            "mean_absolute_difference": round(sum(ImageStat.Stat(difference).mean) / 4, 4),
            "mismatch_pixels": mismatched,
            "mismatch_ratio": round(ratio, 8),
            "pixel_threshold": pixel_threshold,
            "reason": "COMPARED",
        }


def capture_screenshot(
    page: Page,
    case: ViewportCase,
    output_dir: Path,
    baseline_dir: Path | None,
    pixel_threshold: int,
) -> dict[str, Any]:
    screenshot_dir = output_dir / "screenshots"
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    target = screenshot_dir / f"{case.slug}.png"
    page.evaluate("document.activeElement?.blur(); document.getElementById('toast-region')?.classList.remove('is-visible')")
    page.screenshot(
        path=str(target),
        animations="disabled",
        caret="hide",
        full_page=False,
        scale="device",
    )
    with Image.open(target) as image:
        rgb = image.convert("RGB")
        extrema = rgb.getextrema()
        variance = round(sum(ImageStat.Stat(rgb).var) / 3, 3)
        expected_size = [
            round(case.width * case.device_scale_factor),
            round(case.height * case.device_scale_factor),
        ]
        result: dict[str, Any] = {
            "actual_size": list(image.size),
            "case": case.slug,
            "expected_size": expected_size,
            "path": target.relative_to(output_dir).as_posix(),
            "pixel_variance": variance,
            "sha256": sha256_file(target),
            "visual_range": max(channel[1] - channel[0] for channel in extrema),
        }

    if baseline_dir is not None:
        baseline = baseline_dir / f"{case.slug}.png"
        if baseline.is_file():
            diff = image_diff(
                target,
                baseline,
                output_dir / "diffs" / f"{case.slug}.png",
                pixel_threshold,
            )
            if "diff_image" in diff:
                diff["diff_image"] = Path(diff["diff_image"]).relative_to(output_dir).as_posix()
            result["baseline"] = {
                "path": (
                    baseline.relative_to(VIEWER_ROOT).as_posix()
                    if baseline.is_relative_to(VIEWER_ROOT)
                    else baseline.name
                ),
                "sha256": sha256_file(baseline),
            }
            result["diff"] = diff
        else:
            result["diff"] = {"reason": "BASELINE_MISSING"}
    else:
        result["diff"] = {"reason": "BASELINE_NOT_CONFIGURED"}
    return result


def fixture() -> dict[str, Any]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


def entity_by_id(world: dict[str, Any], entity_id: str) -> dict[str, Any]:
    for key in ("regions", "cities", "parcels", "buildings", "rooms", "lifeProfiles"):
        for entity in world.get(key, []):
            if entity.get("id") == entity_id:
                return entity
    raise AssertionError(f"fixture entity not found: {entity_id}")


def parent_id(entity: dict[str, Any]) -> str:
    value = entity.get("parent_id") or entity.get("building_id") or entity.get("parcel_id")
    if not value:
        raise AssertionError(f"entity lacks parent: {entity.get('id')}")
    return str(value)


def navigation_chain(world: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    room = world["rooms"][0]
    building = entity_by_id(world, parent_id(room))
    parcel = entity_by_id(world, parent_id(building))
    city = entity_by_id(world, parent_id(parcel))
    region = entity_by_id(world, parent_id(city))
    return [
        ("REGION", region),
        ("CITY", city),
        ("LAND_PARCEL", parcel),
        ("BUILDING", building),
        ("ROOM", room),
    ]


def activate_accessible_entity(page: Page, entity: dict[str, Any], expected_level: str) -> None:
    label = str(entity.get("label") or entity["id"])
    options = page.locator("#entity-access-list [role=option]").filter(has_text=label)
    if options.count() != 1:
        raise AssertionError(f"expected one accessible object for {label}, found {options.count()}")
    options.first.dispatch_event("dblclick", {"button": 0, "detail": 2})
    page.wait_for_function(
        "level => document.documentElement.dataset.worldViewerLevel === level",
        arg=expected_level,
    )


def navigate_to_city(page: Page, world: dict[str, Any]) -> None:
    page.evaluate("document.getElementById('world-button')?.click()")
    page.wait_for_function(
        "() => document.documentElement.dataset.worldViewerLevel === 'EARTH'"
    )
    region = world["regions"][0]
    city = world["cities"][0]
    activate_accessible_entity(page, region, "REGION")
    activate_accessible_entity(page, city, "CITY")


def entity_client_point(page: Page, entity: dict[str, Any]) -> tuple[float, float]:
    bounds = entity.get("view", {}).get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        raise AssertionError(f"entity has no view bounds: {entity.get('id')}")
    camera = page.evaluate("""
      () => ({
        camera: document.documentElement.dataset.worldViewerCamera,
        zoom: Number(document.documentElement.dataset.worldViewerZoom),
        canvas: (() => {
          const rect = document.getElementById("world-canvas").getBoundingClientRect();
          return {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
        })()
      })
    """)
    camera_x, camera_y = (float(value) for value in camera["camera"].split(","))
    world_x = float(bounds[0]) + float(bounds[2]) / 2
    world_y = float(bounds[1]) + float(bounds[3]) / 2
    canvas = camera["canvas"]
    client_x = canvas["left"] + (world_x - camera_x) * camera["zoom"] + canvas["width"] / 2
    client_y = canvas["top"] + (world_y - camera_y) * camera["zoom"] + canvas["height"] / 2
    return client_x, client_y


def open_parcel_menu_with_mouse(page: Page, parcel: dict[str, Any]) -> None:
    x, y = entity_client_point(page, parcel)
    page.mouse.click(x, y, button="right")
    page.locator(".context-menu").wait_for(state="visible")


def browser_clean(monitor: BrowserMonitor, case: str, gate: Gate) -> None:
    observation = monitor.report(case)
    gate.browser_observations.append(observation)
    clean = all(not observation[key] for key in (
        "bad_responses",
        "console_errors",
        "external_requests",
        "mutating_requests",
        "page_errors",
        "request_failures",
    ))
    gate.expect(
        f"{case}.browser-clean",
        "browser-errors",
        clean,
        case=case,
        details=observation,
    )


def run_matrix_case(
    browser: Browser,
    case: ViewportCase,
    args: argparse.Namespace,
    gate: Gate,
    first_case: bool,
) -> None:
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        metrics = load_page(page, args.base_url, case.theme)
        performance = assess_performance(case, metrics)
        gate.performance.append(performance)
        gate.expect(
            f"{case.slug}.performance-budget",
            "performance",
            performance["status"] == "PASS",
            case=case.slug,
            details=performance,
        )
        gate.expect(
            f"{case.slug}.theme",
            "responsive-matrix",
            page.locator("#app-shell").get_attribute("data-theme") == case.theme,
            case=case.slug,
            details={"theme": case.theme},
        )
        gate.expect(
            f"{case.slug}.fatal-error",
            "browser-errors",
            not page.locator("#fatal-error").is_visible(),
            case=case.slug,
        )

        overflow = measure_overflow(page)
        gate.expect(
            f"{case.slug}.overflow",
            "responsive-matrix",
            overflow["document_width"] <= overflow["viewport_width"] + 1
            and overflow["document_height"] <= overflow["viewport_height"] + 1
            and not overflow["offenders"],
            case=case.slug,
            details=overflow,
        )

        if case.touch:
            targets = measure_touch_targets(page)
            gate.expect(
                f"{case.slug}.touch-targets",
                "touch-controls",
                targets["checked"] > 0 and not targets["violations"],
                case=case.slug,
                details=targets,
            )

        safe_area = measure_safe_area(page)
        gate.expect(
            f"{case.slug}.safe-area",
            "responsive-matrix",
            assess_safe_area(safe_area),
            case=case.slug,
            details=safe_area,
        )

        accessibility = inspect_accessibility(page)
        gate.expect(
            f"{case.slug}.accessibility",
            "accessibility",
            accessibility_passes(accessibility),
            case=case.slug,
            details=accessibility,
        )

        if first_case:
            links = check_local_links(context, page, args.base_url)
            gate.expect(
                "local-links",
                "links",
                bool(links["checked"])
                and all(item["status"] < 400 for item in links["checked"]),
                details=links,
            )

        screenshot = capture_screenshot(
            page,
            case,
            args.output_dir,
            args.baseline_dir,
            args.pixel_threshold,
        )
        gate.screenshots.append(screenshot)
        gate.expect(
            f"{case.slug}.screenshot",
            "screenshots",
            screenshot["actual_size"] == screenshot["expected_size"]
            and screenshot["pixel_variance"] > 2
            and screenshot["visual_range"] > 10,
            case=case.slug,
            details=screenshot,
        )
        diff = screenshot["diff"]
        if diff["reason"] == "COMPARED":
            gate.expect(
                f"{case.slug}.screenshot-diff",
                "screenshots",
                diff["mismatch_ratio"] <= args.max_diff_ratio,
                case=case.slug,
                details={
                    "allowed_mismatch_ratio": args.max_diff_ratio,
                    **diff,
                },
            )
        elif args.require_baselines:
            gate.add(
                f"{case.slug}.screenshot-diff",
                "screenshots",
                "FAIL",
                case=case.slug,
                details=diff,
            )
        else:
            gate.add(
                f"{case.slug}.screenshot-diff",
                "screenshots",
                "SKIP",
                case=case.slug,
                details=diff,
            )
        browser_clean(monitor, case.slug, gate)
    except Exception as error:
        gate.add(
            f"{case.slug}.execution",
            "responsive-matrix",
            "FAIL",
            case=case.slug,
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, case.slug, gate)
    finally:
        context.close()


def run_mouse_and_navigation(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = MATRIX[0]
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    world = fixture()
    try:
        load_page(page, args.base_url, "dark")
        canvas = page.locator("#world-canvas")
        box = canvas.bounding_box()
        if box is None:
            raise AssertionError("canvas has no visible bounds")
        zoom_before = float(page.locator("html").get_attribute("data-world-viewer-zoom") or 0)
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.wheel(0, -500)
        page.wait_for_timeout(100)
        zoom_after = float(page.locator("html").get_attribute("data-world-viewer-zoom") or 0)
        camera_before = page.locator("html").get_attribute("data-world-viewer-camera")
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 2 + 90, box["y"] + box["height"] / 2 + 55)
        page.mouse.up()
        page.wait_for_timeout(100)
        camera_after = page.locator("html").get_attribute("data-world-viewer-camera")
        gate.expect(
            "mouse.pan-and-zoom",
            "mouse-interaction",
            zoom_after > zoom_before and camera_after != camera_before,
            case="desktop-dark",
            details={
                "camera_changed": camera_after != camera_before,
                "zoom_after": zoom_after,
                "zoom_before": zoom_before,
            },
        )

        page.evaluate("document.getElementById('world-button')?.click()")
        levels = ["EARTH"]
        for expected_level, entity in navigation_chain(world):
            activate_accessible_entity(page, entity, expected_level)
            levels.append(page.locator("html").get_attribute("data-world-viewer-level"))
        gate.expect(
            "navigation.six-level",
            "navigation",
            levels == ["EARTH", "REGION", "CITY", "LAND_PARCEL", "BUILDING", "ROOM"],
            case="desktop-dark",
            details={"levels": levels},
        )
        page.locator("#back-button").click()
        page.wait_for_function(
            "() => document.documentElement.dataset.worldViewerLevel === 'BUILDING'"
        )
        gate.expect(
            "navigation.back",
            "navigation",
            page.locator("html").get_attribute("data-world-viewer-level") == "BUILDING",
            case="desktop-dark",
        )
        browser_clean(monitor, "mouse-navigation", gate)
    except Exception as error:
        gate.add(
            "mouse-navigation.execution",
            "mouse-interaction",
            "FAIL",
            case="desktop-dark",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "mouse-navigation", gate)
    finally:
        context.close()


def dispatch_touch_drag(context: BrowserContext, page: Page, start: tuple[float, float]) -> None:
    session = context.new_cdp_session(page)
    x, y = start
    session.send("Input.dispatchTouchEvent", {
        "type": "touchStart",
        "touchPoints": [{"x": x, "y": y, "radiusX": 8, "radiusY": 8, "force": 1}],
    })
    page.wait_for_timeout(40)
    session.send("Input.dispatchTouchEvent", {
        "type": "touchMove",
        "touchPoints": [{"x": x - 72, "y": y - 45, "radiusX": 8, "radiusY": 8, "force": 1}],
    })
    page.wait_for_timeout(60)
    session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    session.detach()


def dispatch_long_press(
    context: BrowserContext,
    page: Page,
    point: tuple[float, float],
) -> None:
    session = context.new_cdp_session(page)
    x, y = point
    session.send("Input.dispatchTouchEvent", {
        "type": "touchStart",
        "touchPoints": [{"x": x, "y": y, "radiusX": 8, "radiusY": 8, "force": 1}],
    })
    page.wait_for_timeout(700)
    session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    session.detach()


def run_touch_interaction(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = next(item for item in MATRIX if item.slug == "android-portrait-dark")
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    world = fixture()
    try:
        load_page(page, args.base_url, "dark")
        page.evaluate("""
          () => {
            for (let index = 0; index < 9; index += 1) {
              document.getElementById('zoom-in-button')?.click();
            }
          }
        """)
        page.wait_for_timeout(160)
        canvas_box = page.locator("#world-canvas").bounding_box()
        if canvas_box is None:
            raise AssertionError("touch canvas has no bounds")
        camera_before = page.locator("html").get_attribute("data-world-viewer-camera")
        dispatch_touch_drag(
            context,
            page,
            (
                canvas_box["x"] + canvas_box["width"] / 2,
                canvas_box["y"] + canvas_box["height"] / 2,
            ),
        )
        page.wait_for_timeout(120)
        camera_after = page.locator("html").get_attribute("data-world-viewer-camera")
        gate.expect(
            "touch.pan",
            "touch-interaction",
            camera_after != camera_before,
            case=case.slug,
            details={"camera_changed": camera_after != camera_before},
        )

        navigate_to_city(page, world)
        starter = entity_by_id(world, world["player"]["starter_parcel_id"])
        dispatch_long_press(context, page, entity_client_point(page, starter))
        page.locator(".context-menu").wait_for(state="visible")
        gate.expect(
            "touch.long-press",
            "touch-interaction",
            page.locator(".context-action").count() == 8,
            case=case.slug,
            details={"actions": page.locator(".context-action").count()},
        )
        browser_clean(monitor, "touch-interaction", gate)
    except Exception as error:
        gate.add(
            "touch-interaction.execution",
            "touch-interaction",
            "FAIL",
            case=case.slug,
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "touch-interaction", gate)
    finally:
        context.close()


def complete_genesis(page: Page, amount: int = 88) -> None:
    dialog = page.locator("#genesis-dialog[open]")
    if not dialog.count() or not dialog.is_visible():
        return
    dialog.locator(f"[data-amount='{amount}']").click()
    page.wait_for_function("() => document.documentElement.dataset.genesisComplete === 'true'")
    dialog.get_by_role("button", name="Enter world").click()


def start_mock_session(page: Page, *, with_location: bool) -> None:
    page.locator("#login-button").click()
    dialog = visible_consent_dialog(page)
    if with_location:
        page.locator("#mock-location-consent").check()
        page.locator("#mock-consent-accept").click()
    else:
        dialog.get_by_role("button", name="Continue without location").click()
    page.wait_for_function(
        "() => document.getElementById('login-button')?.textContent.trim() === 'End mock session'"
    )
    complete_genesis(page)
    page.wait_for_function(
        "() => document.documentElement.dataset.worldViewerLevel === 'LAND_PARCEL'"
    )


def run_genesis_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    source = MATRIX[4]
    case = ViewportCase(
        "genesis-mobile", source.family, source.orientation, source.width,
        source.height, source.theme, source.touch, source.device_scale_factor,
        source.user_agent,
    )
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        page.locator("#login-button").click()
        visible_consent_dialog(page).get_by_role("button", name="Continue without location").click()
        dialog = page.locator("#genesis-dialog[open]")
        dialog.wait_for(state="visible")
        dialog_text = clean_text(dialog.inner_text())
        bounds = dialog.bounding_box() or {}
        choices = dialog.locator("[data-amount]")
        gate.expect(
            "genesis.mobile-gate",
            "civilization-genesis",
            choices.count() == 6
            and all(token in dialog_text.upper() for token in ("UNIVERSE BOOT", "PLANET CHECK", "LIFE OS BOOT", "K12345"))
            and bounds.get("width", 0) >= source.width - 2,
            case=case.slug,
            details={"choices": choices.count(), "bounds": bounds},
        )
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        choices.filter(has_text="888 KGEN").click()
        page.wait_for_function("() => document.documentElement.dataset.genesisComplete === 'true'")
        dialog.get_by_role("button", name="Enter world").click()
        page.wait_for_function("() => document.documentElement.dataset.worldViewerLevel === 'LAND_PARCEL'")
        gate.expect(
            "genesis.mobile-enter-world",
            "civilization-genesis",
            page.evaluate("document.documentElement.dataset.genesisStage") == "ENTER_WORLD"
            and page.locator("#player-command-center").get_attribute("data-session") == "active",
            case=case.slug,
        )
        browser_clean(monitor, "genesis-mobile", gate)
    except Exception as error:
        gate.add(
            "genesis-mobile.execution",
            "civilization-genesis",
            "FAIL",
            case=case.slug,
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "genesis-mobile", gate)
    finally:
        context.close()


def run_proposal_permissions(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = MATRIX[0]
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    world = fixture()
    starter = entity_by_id(world, world["player"]["starter_parcel_id"])
    try:
        load_page(page, args.base_url, "dark")
        navigate_to_city(page, world)
        open_parcel_menu_with_mouse(page, starter)
        actions = page.locator(".context-action")
        anonymous_disabled = sum(actions.nth(index).is_disabled() for index in range(actions.count()))
        gate.expect(
            "proposal.logged-out",
            "proposal-permissions",
            actions.count() == 8 and anonymous_disabled == 8,
            details={"actions": actions.count(), "disabled": anonymous_disabled},
        )

        page.evaluate("document.getElementById('world-button')?.click()")
        start_mock_session(page, with_location=False)
        navigate_to_city(page, world)
        open_parcel_menu_with_mouse(page, starter)
        enabled = sum(not actions.nth(index).is_disabled() for index in range(actions.count()))
        gate.expect(
            "proposal.owner-enabled",
            "proposal-permissions",
            actions.count() == 8 and enabled == 8,
            details={"actions": actions.count(), "enabled": enabled},
        )

        fixture_land_use = starter.get("land_use", "UNKNOWN")
        created: list[str] = []
        for action in PROPOSAL_ACTIONS:
            action_record = next(
                item for item in world["proposalActions"]
                if (item if isinstance(item, str) else item.get("id")) == action
            )
            label = action_record if isinstance(action_record, str) else action_record["label"]
            button = page.locator(f".context-action[aria-label^='{action},']")
            if button.count() != 1 or button.is_disabled():
                raise AssertionError(f"proposal action unavailable: {action}")
            button.click()
            page.locator("#proposal-bar").wait_for(state="visible")
            summary = page.locator("#proposal-summary").inner_text()
            if action not in summary:
                raise AssertionError(f"proposal summary lacks action {action}: {summary}")
            created.append(action)
            page.locator("#proposal-discard").click()
            page.locator("#proposal-bar").wait_for(state="hidden")
            if action != PROPOSAL_ACTIONS[-1]:
                open_parcel_menu_with_mouse(page, starter)

        static_land_use = page.evaluate(
            """async ({url, id}) => {
              const data = await fetch(url, {cache: "no-store"}).then(response => response.json());
              return data.parcels.find(parcel => parcel.id === id)?.land_use ?? "UNKNOWN";
            }""",
            {"url": "./data/synthetic-world.json", "id": starter["id"]},
        )
        gate.expect(
            "proposal.all-eight-local-only",
            "proposal-permissions",
            tuple(created) == PROPOSAL_ACTIONS
            and static_land_use == fixture_land_use
            and not monitor.mutating_requests,
            details={
                "created": created,
                "fixture_land_use_unchanged": static_land_use == fixture_land_use,
                "mutating_requests": monitor.mutating_requests,
            },
        )

        other = next(
            parcel for parcel in world["parcels"]
            if parcel.get("id") != starter["id"]
            and parcel.get("status") == "ACTIVE"
            and "PROPOSE" in parcel.get("capabilities", [])
        )
        open_parcel_menu_with_mouse(page, other)
        other_actions = page.locator(".context-action")
        other_disabled = sum(
            other_actions.nth(index).is_disabled() for index in range(other_actions.count())
        )
        gate.expect(
            "proposal.non-owner-denied",
            "proposal-permissions",
            other_actions.count() == 8 and other_disabled == 8,
            details={"actions": other_actions.count(), "disabled": other_disabled},
        )
        browser_clean(monitor, "proposal-permissions", gate)
    except Exception as error:
        gate.add(
            "proposal-permissions.execution",
            "proposal-permissions",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "proposal-permissions", gate)
    finally:
        context.close()


def location_trigger(page: Page) -> Any:
    selectors = (
        "#location-button",
        "#locate-button",
        "#mock-location-button",
        "[data-action='mock-location']",
        "[data-action='location']",
        "[data-location-trigger]",
    )
    for selector in selectors:
        candidate = page.locator(selector)
        if candidate.count():
            return candidate.first
    found = page.evaluate("""
      () => {
        const pattern = /(?:mock\\s*)?(?:location|locate|gps)/i;
        const button = [...document.querySelectorAll("button")].find(element => pattern.test([
          element.id, element.dataset.action, element.getAttribute("aria-label"),
          element.title, element.textContent
        ].filter(Boolean).join(" ")));
        if (!button) return false;
        button.setAttribute("data-product-qa-location-trigger", "true");
        return true;
      }
    """)
    if not found:
        raise AssertionError("mock location trigger was not found")
    return page.locator("[data-product-qa-location-trigger]")


def visible_consent_dialog(page: Page) -> Any:
    selectors = (
        "dialog[open]",
        "[role=dialog]:visible",
        "#location-consent-dialog:not([hidden])",
        ".location-consent:not([hidden])",
        "[data-location-consent]:visible",
    )
    for selector in selectors:
        candidate = page.locator(selector)
        if candidate.count() and candidate.first.is_visible():
            return candidate.first
    raise AssertionError("explicit mock location consent dialog was not shown")


def button_matching(container: Any, pattern: re.Pattern[str]) -> Any:
    buttons = container.locator("button")
    for index in range(buttons.count()):
        button = buttons.nth(index)
        name = " ".join(filter(None, (
            button.get_attribute("aria-label"),
            button.get_attribute("title"),
            button.inner_text(),
        )))
        if pattern.search(name):
            return button
    raise AssertionError(f"consent button not found: {pattern.pattern}")


def consent_state(page: Page) -> dict[str, Any]:
    return page.evaluate("""
      () => {
        const trigger = document.querySelector(
          "#location-button, #locate-button, #mock-location-button, "
          + "[data-action='mock-location'], [data-location-trigger], "
          + "[data-product-qa-location-trigger]"
        );
        const datasets = [document.documentElement, document.getElementById("app-shell"), trigger]
          .filter(Boolean).flatMap(element => Object.entries(element.dataset))
          .filter(([key]) => /location|consent/i.test(key));
        return {
          aria_pressed: trigger?.getAttribute("aria-pressed"),
          datasets: Object.fromEntries(datasets),
          trigger_text: trigger?.textContent?.trim() || "",
          visible_status: [...document.querySelectorAll(
            "#toast-region, [data-location-status], .location-status, [role=status]"
          )].filter(element => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden"
              && rect.width > 0 && rect.height > 0;
          }).map(element => element.textContent.trim()).join(" | ")
        };
      }
    """)


def state_is_consented(state: dict[str, Any]) -> bool:
    serialized = json.dumps(state, sort_keys=True).lower()
    return state.get("aria_pressed") == "true" or bool(re.search(
        r"(?:consent|location)[^\n\"]{0,24}(?:true|granted|allowed)|"
        r"(?:true|granted|allowed)[^\n\"]{0,24}(?:consent|location)|coarse location focused",
        serialized,
    ))


def run_login_and_consent(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = MATRIX[0]
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        gate.expect(
            "login.initial",
            "consent-login",
            page.locator("#login-button").inner_text().strip() == "Mock login",
        )
        page.locator("#login-button").click()
        dialog = visible_consent_dialog(page)
        dialog_text = clean_text(dialog.inner_text())
        gate.expect(
            "location.explicit-prompt",
            "consent-login",
            "mock" in dialog_text.lower()
            and "location" in dialog_text.lower()
            and "not requested" in dialog_text.lower()
            and "not performed" in dialog_text.lower(),
            details={"dialog_text": dialog_text},
        )
        dialog.get_by_role("button", name="Continue without location").click()
        page.wait_for_function(
            "() => document.getElementById('login-button')?.textContent.trim() === 'End mock session'"
        )
        complete_genesis(page)
        declined = clean_text(page.locator("#starter-parcel-status").inner_text())
        gate.expect(
            "location.decline",
            "consent-login",
            "not used" in declined.lower() and "no gps or kyc" in declined.lower(),
            details={"starter_status": declined},
        )
        page.locator("#login-button").click()
        page.wait_for_function(
            "() => document.getElementById('login-button')?.textContent.trim() === 'Mock login'"
        )
        start_mock_session(page, with_location=True)
        granted = clean_text(page.locator("#starter-parcel-status").inner_text())
        gate.expect(
            "location.allow-mock-coarse",
            "consent-login",
            "consented" in granted.lower() and "no gps or kyc" in granted.lower(),
            details={"starter_status": granted},
        )
        page.locator("#login-button").click()
        page.wait_for_function(
            "() => document.getElementById('login-button')?.textContent.trim() === 'Mock login'"
        )
        gate.expect(
            "login.logout",
            "consent-login",
            page.locator("#login-button").inner_text().strip() == "Mock login",
        )
        browser_clean(monitor, "consent-login", gate)
    except Exception as error:
        gate.add(
            "consent-login.execution",
            "consent-login",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "consent-login", gate)
    finally:
        context.close()


def choose_life_profile(page: Page, expected_label: str) -> dict[str, Any]:
    root = page.locator(".life-os-viewer")
    root.wait_for(state="visible")
    selectors = root.locator("select")
    if selectors.count():
        select = selectors.first
        options = select.locator("option")
        selected = False
        for index in range(options.count()):
            option = options.nth(index)
            if expected_label.lower() in option.inner_text().lower():
                select.select_option(option.get_attribute("value"))
                selected = True
                break
        if not selected and options.count() > 1:
            select.select_option(index=1)
        page.wait_for_timeout(80)
        return {"mechanism": "select", "options": options.count()}

    choices = root.locator(
        "[data-life-profile-id], [data-profile-id], .life-profile-choice, "
        ".life-os-viewer__profile-choice"
    )
    if choices.count():
        choice = choices.filter(has_text=expected_label)
        (choice.first if choice.count() else choices.first).click()
        page.wait_for_timeout(80)
        return {"mechanism": "button", "options": choices.count()}

    articles = root.locator(".life-os-viewer__profile, [data-life-profile]")
    return {"mechanism": "context-selection", "options": articles.count()}


def inspect_life_view(page: Page, expected_label: str) -> dict[str, Any]:
    root = page.locator(".life-os-viewer")
    text = clean_text(root.inner_text())
    labels = root.locator("dt, [data-life-field-label]").all_inner_texts()
    layer_attributes = root.locator("[data-life-layer]").evaluate_all(
        "elements => elements.map(element => element.dataset.lifeLayer)"
    )
    headings = root.locator("h2, h3, h4, h5, h6, legend").all_inner_texts()
    layer_evidence: dict[str, bool] = {}
    combined = " | ".join([*layer_attributes, *headings, text])
    for layer in LIFE_LAYER_LABELS:
        pattern = {
            "Mind": r"\bMind(?: Runtime)?\b",
            "Citizen": r"\bCitizen(?: Runtime)?\b",
        }.get(layer, rf"\b{re.escape(layer)}\b")
        layer_evidence[layer] = bool(re.search(pattern, combined, re.IGNORECASE))
    write_controls = [
        value for value in root.locator("button, input[type=submit]").all_inner_texts()
        if re.search(r"save|edit|delete|submit|update|mutate|approve", value, re.IGNORECASE)
    ]
    privacy_safe = not any(FORBIDDEN_LIFE_LABELS.search(label) for label in labels)
    privacy_marked = bool(re.search(
        r"PUBLIC_SYNTHETIC|PUBLIC_LIFE_STATUS|public synthetic|privacy|read[- ]only",
        text,
        re.IGNORECASE,
    ))
    return {
        "chosen_profile_visible": expected_label.lower() in text.lower(),
        "field_labels": labels,
        "layer_evidence": layer_evidence,
        "privacy_marked": privacy_marked,
        "privacy_safe": privacy_safe,
        "write_controls": write_controls,
    }


def run_life_stack(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = MATRIX[0]
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    world = fixture()
    expected_profile = next(
        profile for profile in world["lifeProfiles"]
        if profile.get("parcel_id") == world["player"]["starter_parcel_id"]
    )
    expected_label = str(expected_profile.get("label") or expected_profile["id"])
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='LIFE']").click()
        selection = choose_life_profile(page, expected_label)
        life = inspect_life_view(page, expected_label)
        gate.expect(
            "life.chosen-profile",
            "life-privacy",
            life["chosen_profile_visible"] and selection["options"] >= 1,
            details={"expected_profile": expected_label, "selection": selection},
        )
        gate.expect(
            "life.five-layer-view",
            "life-privacy",
            all(life["layer_evidence"].values()),
            details={"layers": life["layer_evidence"]},
        )
        gate.expect(
            "life.privacy-read-only",
            "life-privacy",
            life["privacy_marked"] and life["privacy_safe"] and not life["write_controls"],
            details={
                "field_labels": life["field_labels"],
                "privacy_marked": life["privacy_marked"],
                "privacy_safe": life["privacy_safe"],
                "write_controls": life["write_controls"],
            },
        )
        browser_clean(monitor, "life-stack", gate)
    except Exception as error:
        gate.add(
            "life-stack.execution",
            "life-privacy",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "life-stack", gate)
    finally:
        context.close()


def run_digital_earth_alpha(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = ViewportCase("digital-earth-desktop", "desktop", "landscape", 1440, 900, "dark", False, 1)
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    world = fixture()
    starter = entity_by_id(world, world["player"]["starter_parcel_id"])
    home = entity_by_id(world, world["player"]["home_building_id"])
    living_room = entity_by_id(world, world["player"]["home_room_id"])
    player_life = entity_by_id(world, world["player"]["life_id"])
    workshop = entity_by_id(world, "room-workshop-001")
    ai_worker = entity_by_id(world, "life-wukong-001")
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.wait_for_function(
            "() => document.documentElement.dataset.worldViewerPlayerMarker === 'true'"
        )
        player_hud = clean_text(page.locator("#player-command-center").inner_text())
        gate.expect(
            "digital-earth.player-session",
            "digital-earth",
            "Starter Residence" in player_hud
            and not page.locator("#player-step-right-button").is_disabled(),
            details={"hud": player_hud},
        )

        inspector_text = clean_text(page.locator("#inspector-content").inner_text())
        gate.expect(
            "digital-earth.land-history",
            "land-integrity",
            all(label in inspector_text for label in (
                "Parcel Version", "Revision History", "Ownership Timeline"
            )),
            details={"required": ["Parcel Version", "Revision History", "Ownership Timeline"]},
        )

        navigate_to_city(page, world)
        open_parcel_menu_with_mouse(page, starter)
        page.locator(".context-action[aria-label^='FARM,']").click()
        page.locator("#proposal-bar").wait_for(state="visible")
        page.locator("#land-save-button").click()
        page.wait_for_function(
            "() => document.getElementById('land-save-button')?.disabled === true"
        )
        storage_keys = page.evaluate("Object.keys(localStorage).sort()")
        gate.expect(
            "digital-earth.land-draft-save",
            "land-integrity",
            any("land-runtime" in key for key in storage_keys),
            details={"storage_keys": storage_keys},
        )
        page.locator("#land-undo-button").click()
        page.wait_for_function(
            "() => document.getElementById('land-redo-button')?.disabled === false"
        )
        page.locator("#land-redo-button").click()
        gate.expect(
            "digital-earth.land-undo-redo",
            "land-integrity",
            page.locator("#proposal-bar").is_visible(),
        )

        page.locator("#home-button").click()
        page.wait_for_function(
            "() => document.documentElement.dataset.worldViewerLevel === 'LAND_PARCEL'"
        )
        activate_accessible_entity(page, home, "BUILDING")
        building_text = clean_text(page.locator("#inspector-content").inner_text())
        gate.expect(
            "digital-earth.building-runtime",
            "building-integrity",
            all(label in building_text for label in ("Template / Type", "Health", "Capacity", "Lifecycle")),
            details={"building": home["id"]},
        )

        activate_accessible_entity(page, living_room, "ROOM")
        page.wait_for_function(
            "() => Number(document.documentElement.dataset.worldViewerLifeEntities) >= 3"
        )
        room_text = clean_text(page.locator("#inspector-content").inner_text())
        gate.expect(
            "digital-earth.room-runtime",
            "room-integrity",
            all(label in room_text for label in ("Furniture", "Equipment", "Organisms", "Life", "Content Chain"))
            and int(page.evaluate("document.documentElement.dataset.worldViewerLifeEntities")) >= 3,
            details={"room": living_room["id"]},
        )

        activate_accessible_entity(page, player_life, "ROOM")
        life_root = page.locator(".life-os-viewer")
        life_root.wait_for(state="visible")
        life_before = clean_text(life_root.inner_text())
        life_root.get_by_role("button", name="EAT").click()
        page.wait_for_timeout(100)
        life_after = clean_text(life_root.inner_text())
        gate.expect(
            "digital-earth.life-runtime",
            "life-integrity",
            all(label in life_after for label in ("Health", "Food", "Water", "Oxygen", "Energy", "Age (days)", "Occupation", "Inventory"))
            and life_before != life_after,
            details={"life": player_life["id"]},
        )
        life_root.get_by_role("button", name="SLEEP").click()
        page.locator("#simulation-advance-button").click()
        page.wait_for_timeout(100)
        life_root.get_by_role("button", name="WAKE").click()

        page.locator("#player-step-right-button").click()
        page.wait_for_function(
            "() => document.getElementById('player-hud-movement')?.textContent === 'WALKING'"
        )
        gate.expect(
            "digital-earth.player-walking",
            "digital-earth",
            page.locator("#player-hud-movement").inner_text() == "WALKING"
            and page.evaluate("document.documentElement.dataset.worldViewerPlayerMarker") == "true",
        )

        screenshot = capture_screenshot(
            page, case, args.output_dir, None, args.pixel_threshold
        )
        gate.screenshots.append(screenshot)
        gate.expect(
            "digital-earth.visual-nonblank",
            "visual-regression",
            screenshot["pixel_variance"] >= 15 and screenshot["visual_range"] >= 32,
            details=screenshot,
        )

        page.locator("[data-mode='WORLD']").click()
        page.locator("#back-button").click()
        page.wait_for_function(
            "() => document.documentElement.dataset.worldViewerLevel === 'BUILDING'"
        )
        activate_accessible_entity(page, workshop, "ROOM")
        activate_accessible_entity(page, ai_worker, "ROOM")
        ai_text = clean_text(page.locator(".life-os-viewer").inner_text())
        gate.expect(
            "digital-earth.ai-worker-visible",
            "life-integrity",
            "Wukong 001" in ai_text and "AI_WORKER" in ai_text,
            details={"worker": ai_worker["id"], "room": workshop["id"]},
        )

        page.reload(wait_until="domcontentloaded")
        page.wait_for_function(
            "() => document.documentElement.dataset.worldViewerRendered === 'true'"
        )
        start_mock_session(page, with_location=False)
        page.locator("#proposal-bar").wait_for(state="visible")
        canonical_use = page.evaluate(
            """async ({url, id}) => {
              const data = await fetch(url, {cache: "no-store"}).then(response => response.json());
              return data.parcels.find(parcel => parcel.id === id)?.land_use ?? "UNKNOWN";
            }""",
            {"url": "./data/synthetic-world.json", "id": starter["id"]},
        )
        gate.expect(
            "digital-earth.reload-recovery",
            "regression",
            canonical_use == "RESIDENTIAL"
            and "FARM" in page.locator("#proposal-summary").inner_text(),
            details={"canonical_land_use": canonical_use, "draft_recovered": True},
        )
        browser_clean(monitor, "digital-earth-alpha", gate)
    except Exception as error:
        gate.add(
            "digital-earth.execution",
            "digital-earth",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "digital-earth-alpha", gate)
    finally:
        context.close()


def run_digital_earth_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    base = next(case for case in MATRIX if case.slug == "iphone-portrait-light")
    case = ViewportCase("digital-earth-mobile", base.family, base.orientation, base.width, base.height, base.theme, base.touch, base.device_scale_factor, base.user_agent)
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "light")
        start_mock_session(page, with_location=True)
        page.locator("#inspector-close").click()
        page.locator("#player-step-down-button").click()
        layout = measure_overflow(page)
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "digital-earth.mobile-living-world",
            "mobile-interaction",
            layout["document_width"] <= layout["viewport_width"]
            and layout["document_height"] <= layout["viewport_height"]
            and not layout["offenders"]
            and page.locator("#player-hud-movement").inner_text() == "WALKING"
            and screenshot["pixel_variance"] >= 15,
            details={"layout": layout, "screenshot": screenshot},
        )
        browser_clean(monitor, "digital-earth-mobile", gate)
    except Exception as error:
        gate.add(
            "digital-earth.mobile-execution",
            "mobile-interaction",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "digital-earth-mobile", gate)
    finally:
        context.close()


def run_civilization_alpha(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = ViewportCase("civilization-alpha", "desktop", "landscape", 1440, 900, "dark", False, 1)
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.wait_for_function("() => document.documentElement.dataset.civilizationReady === 'true'")

        page.locator("[data-civilization-action='TAB_GENESIS']").click()
        genesis_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "genesis.boot-and-fortune",
            "civilization-genesis",
            all(label in genesis_text for label in (
                "Civilization Birth", "ENTER WORLD", "88 KAIOS CREDIT (KGEN REFERENCE)",
                "Planet Environment", "Starter Survival Pack", "K12345",
            )),
            details={"genesis_complete": page.evaluate("document.documentElement.dataset.genesisComplete")},
        )
        gate.expect(
            "genesis.planet-profile",
            "planet-environment",
            all(label in genesis_text for label in (
                "Atmosphere", "Oxygen", "Gravity", "Temperature", "Pressure",
                "Water", "Radiation", "Magnetic Field", "Day", "Year", "Human",
            )),
        )
        page.locator("[data-civilization-action='TAB_TODAY']").click()

        today_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "civilization.daily-schedule",
            "civilization-life",
            all(label in today_text for label in (
                "Sleep", "Wake", "Breakfast", "Work", "Lunch", "Study",
                "Shopping", "Dinner", "Exercise", "Entertainment",
            )),
            details={"required_count": 11},
        )
        gate.expect(
            "civilization.citizen-needs",
            "civilization-life",
            all(label in today_text for label in (
                "Hunger", "Thirst", "Fatigue", "Mood", "Health", "Knowledge",
                "Money", "Housing", "Relationship", "Safety",
            )),
        )

        page.locator("[data-civilization-action='TAB_BIOLOGY']").click()
        biology_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "biology.registry-and-taxonomy",
            "biology-registry",
            all(label in biology_text for label in (
                "Universal Biology Foundation", "26 synthetic Species", "9 ranks",
                "Animal", "Plant", "Fungus", "Microorganism", "Human",
                "AI Organism", "App Organism", "Company Organism", "Robot",
                "Future Species", "Domain", "Kingdom", "Phylum", "Class",
                "Order", "Family", "Genus", "Species", "Subspecies",
            ))
            and page.evaluate("document.documentElement.dataset.biologyReady") == "true"
            and page.evaluate("document.documentElement.dataset.biologySpecies") == "26",
        )
        gate.expect(
            "biology.genome-and-atoms",
            "genome-evolution",
            all(label in biology_text for label in (
                "Genome and DNA", "Chromosomes", "Genes", "Mutations", "Inheritance",
                "Verified Capability Evolution", "108 / 108 cataloged", "Active GA",
                "Life Support", "Learning and Memory", "Genesis Integration", "Role Fixed NO",
            ))
            and page.evaluate("document.documentElement.dataset.biologyAtoms") == "108",
        )
        page.locator("[data-civilization-action='ADVANCE_LEARNING']").click()
        page.wait_for_function("() => document.documentElement.dataset.biologyHumanAtoms === '1'")
        gate.expect(
            "biology.evidence-gated-evolution",
            "genome-evolution",
            "1 / 108" in clean_text(page.locator(".civilization-view").inner_text())
            and "LV2" in clean_text(page.locator(".civilization-view").inner_text()),
        )
        page.locator("[data-civilization-action='PROPOSE_CLONE']").click()
        page.wait_for_function("() => document.documentElement.dataset.biologyReproduction === '1'")
        gate.expect(
            "biology.clone-proposal-boundary",
            "reproduction-integrity",
            "PROPOSAL ONLY REVIEW REQUIRED" in clean_text(page.locator(".civilization-view").inner_text())
            and "Population Mutation DISABLED FROM VIEWER" in clean_text(page.locator(".civilization-view").inner_text()),
        )
        gate.expect(
            "biology.planet-ecology",
            "planet-ecology",
            all(label in clean_text(page.locator(".civilization-view").inner_text()) for label in (
                "Earth", "Compatible", "Moon", "Base Required", "Mars", "Jupiter",
                "Not Survivable", "Future Planet", "Unknown Review Required",
            )),
        )

        page.locator("[data-civilization-action='TAB_ECOSYSTEM']").click()
        ecosystem_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "production.cambrian-lineage",
            "ecosystem",
            all(label in ecosystem_text for label in (
                "Unicellular Life", "Cambrian Ocean", "Fish", "Amphibian",
                "Reptile", "Bird", "Mammal", "Primitive Human", "Industrial",
                "AI Civilization",
            )),
        )
        gate.expect(
            "production.food-chain",
            "ecosystem",
            all(label in ecosystem_text for label in (
                "Food Chain V2 Energy", "Producer Input", "Consumer Demand",
                "Decomposer Recovery", "Species Population", "Producer", "Herbivore",
                "Carnivore", "Omnivore", "Predator", "Scavenger", "Decomposer",
                "Bacteria", "Tiger", "Lion", "Elephant", "Bee", "Rice", "Mushroom",
            ))
            and page.evaluate("document.documentElement.dataset.foodChainV2") == "true"
            and page.evaluate("document.documentElement.dataset.ecosystemStatus")
            in {"BALANCED", "CONSTRAINED", "COLLAPSE_RISK"},
        )
        page.locator("[data-civilization-action='TAB_TODAY']").click()

        page.locator("[data-civilization-action='ADVANCE_HOUR']").click()
        page.wait_for_function("() => document.documentElement.dataset.civilizationActivity === 'BREAKFAST'")
        page.locator("[data-civilization-action='ADVANCE_HOUR']").click()
        page.wait_for_function("() => document.documentElement.dataset.civilizationActivity === 'WORK'")
        gate.expect(
            "civilization.ai-schedule",
            "ai-schedule",
            page.evaluate("document.documentElement.dataset.civilizationAiAction") == "FARM"
            and page.evaluate("Number(document.documentElement.dataset.civilizationBalance)") == 106,
            details={
                "activity": page.evaluate("document.documentElement.dataset.civilizationActivity"),
                "ai_action": page.evaluate("document.documentElement.dataset.civilizationAiAction"),
                "balance": page.evaluate("document.documentElement.dataset.civilizationBalance"),
            },
        )

        page.locator("[data-civilization-action='TAB_FARM']").click()
        garden = page.locator(".farm-plot").filter(has_text="Kitchen Garden")
        garden.get_by_role("button", name="Veg").click()
        gate.expect(
            "civilization.crop-planted",
            "agriculture",
            "GROWING / VEGETABLE" in clean_text(garden.inner_text()),
        )
        page.locator("[data-civilization-action='TAB_TODAY']").click()
        page.locator("[data-civilization-action='ADVANCE_DAY']").click(timeout=20000)
        page.locator("[data-civilization-action='TAB_FARM']").click()
        garden = page.locator(".farm-plot").filter(has_text="Kitchen Garden")
        gate.expect(
            "civilization.crop-ready",
            "agriculture",
            "READY / VEGETABLE" in clean_text(garden.inner_text()),
        )
        garden.get_by_role("button", name="Harvest").click()
        warehouse = page.locator(".civilization-section").filter(has_text="Farm Warehouse")
        gate.expect(
            "civilization.harvest-storage",
            "food-balance",
            "VEGETABLE" in clean_text(warehouse.inner_text())
            and "Sell VEGETABLE" in clean_text(warehouse.inner_text()),
        )
        facility = page.locator(".production-row").filter(has_text="Vegetable Farm")
        facility_text = clean_text(facility.inner_text())
        gate.expect(
            "production.agriculture-organism",
            "agriculture",
            "VEGETABLE FARM / READY" in facility_text
            and "Collect" in facility_text,
        )
        facility.get_by_role("button", name="Collect").click()
        gate.expect(
            "production.agriculture-collection",
            "agriculture",
            "VEGETABLE FARM / ACTIVE" in clean_text(facility.inner_text()),
        )
        balance_before_sale = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        warehouse.get_by_role("button", name="Sell VEGETABLE").click()
        balance_after_sale = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        gate.expect(
            "civilization.harvest-sale",
            "economy-integrity",
            balance_after_sale == balance_before_sale + 4,
            details={"before": balance_before_sale, "after": balance_after_sale},
        )

        page.locator("[data-civilization-action='TAB_PRODUCTION']").click()
        production_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "production.factory-supply-chain",
            "production",
            all(label in production_text for label in (
                "Factory Organism", "Hsinchu Living Appliance Factory", "Supply Chain",
                "Electricity Grid", "Industrial Water", "Engineers", "Workers",
                "Production Equipment", "Silicon Supply", "Chemical Supply",
                "Industrial Gas", "Transportation", "Warehouse", "Prototype Finance",
                "AI Company", "Product Lifecycle", "Refrigerator Alpha", "REPAIR", "RECYCLE",
            )),
        )
        produced_before = int(page.evaluate("document.documentElement.dataset.productionTotal"))
        page.locator("[data-civilization-action='RUN_FACTORY']").click()
        page.wait_for_function(
            "previous => Number(document.documentElement.dataset.productionTotal) === previous + 1",
            arg=produced_before,
        )
        gate.expect(
            "production.factory-cycle",
            "production",
            page.evaluate("document.documentElement.dataset.factoryStatus") in {"READY", "BLOCKED"}
            and int(page.evaluate("document.documentElement.dataset.productionTotal")) == produced_before + 1,
        )

        page.locator("[data-civilization-action='TAB_COMPANY']").click()
        company_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "production.ai-company-organism",
            "company",
            all(label in company_text for label in (
                "AI Company Organism", "Company Life", "Company DNA", "Employees",
                "AI Workers", "Reputation", "Prototype Company Finance", "Operating Cost",
                "Company Assets", "LOCAL SYNTHETIC LEDGER",
            ))
            and page.evaluate("document.documentElement.dataset.companyStatus")
            in {"ACTIVE", "CONSTRAINED", "DISTRESSED", "EXPANSION_READY"},
        )
        company_sale = page.locator("[data-civilization-action='SELL_COMPANY_PRODUCT']")
        gate.expect(
            "production.company-product-inventory",
            "company",
            company_sale.count() == 1 and company_sale.is_enabled(),
        )
        company_sale.click()

        page.locator("[data-civilization-action='TAB_MARKET']").click()
        rice = page.locator(".market-listing").filter(has_text="FOOD / 6 CR")
        balance_before_buy = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        rice.get_by_role("button", name="Buy").click()
        balance_after_buy = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        gate.expect(
            "civilization.market-purchase",
            "economy-integrity",
            balance_after_buy == balance_before_buy - 6
            and "stock 119" in clean_text(rice.inner_text()),
            details={"before": balance_before_buy, "after": balance_after_buy},
        )
        exchange_candidate = page.locator(".exchange-candidate").filter(has_text="REFRIGERATOR ALPHA")
        gate.expect(
            "production.k11520-candidate-only",
            "exchange",
            "CANDIDATE REVIEW REQUIRED" in clean_text(exchange_candidate.inner_text())
            and "NO REAL" not in clean_text(exchange_candidate.inner_text()),
        )
        exchange_candidate.get_by_role("button", name="Request review").click()
        gate.expect(
            "production.k11520-review-request",
            "exchange",
            "REVIEW REQUESTED" in clean_text(exchange_candidate.inner_text())
            and "Listed 0" in clean_text(page.locator(".civilization-view").inner_text()),
        )

        page.locator("[data-civilization-action='TAB_POPULATION']").click()
        settlement_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "settlement.population-hierarchy",
            "settlement-population",
            all(label in settlement_text for label in (
                "Settlement Population", "Family to Civilization", "Starter Household",
                "Genesis Village", "Hukou Alpha", "Hsinchu Alpha", "Taiwan Alpha",
                "KAIOS Civilization Alpha", "Citizens and Families",
            )),
        )
        page.locator("[data-civilization-action='REGISTER_MARRIAGE']").click()
        gate.expect(
            "settlement.marriage-consent",
            "settlement-population",
            page.locator("[data-civilization-action='REGISTER_MARRIAGE']").is_disabled()
            and page.locator("[data-civilization-action='REGISTER_BIRTH']").is_enabled(),
        )
        page.locator("[data-civilization-action='REGISTER_BIRTH']").click()
        page.wait_for_function("() => document.documentElement.dataset.populationTotal === '4'")
        gate.expect(
            "settlement.birth-capacity",
            "settlement-population",
            "Genesis Child 1" in clean_text(page.locator(".civilization-view").inner_text())
            and page.evaluate("document.documentElement.dataset.populationFamilies") == "1",
        )
        inheritance_before = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        page.locator("[data-civilization-action='SETTLE_INHERITANCE']").click()
        inheritance_after = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        gate.expect(
            "settlement.inheritance-once",
            "settlement-economy",
            inheritance_after == inheritance_before + 20
            and page.locator("[data-civilization-action='SETTLE_INHERITANCE']").is_disabled(),
            details={"before": inheritance_before, "after": inheritance_after},
        )
        jobs_before = int(page.evaluate("document.documentElement.dataset.logisticsJobs"))
        page.locator("[data-civilization-action='DISPATCH_DOMESTIC']").click()
        page.locator("[data-civilization-action='DISPATCH_EXPORT']").click()
        gate.expect(
            "settlement.logistics-gate",
            "logistics",
            int(page.evaluate("document.documentElement.dataset.logisticsJobs")) == jobs_before + 2
            and "READY" in clean_text(page.locator(".civilization-view").inner_text()),
        )
        pollution_before = float(page.evaluate("document.documentElement.dataset.logisticsPollution"))
        page.locator("[data-civilization-action='RECOVER_ECOLOGY']").click()
        pollution_after = float(page.evaluate("document.documentElement.dataset.logisticsPollution"))
        gate.expect(
            "settlement.ecology-recovery",
            "ecology",
            pollution_after < pollution_before,
            details={"before": pollution_before, "after": pollution_after},
        )

        page.locator("[data-civilization-action='TAB_ECONOMY']").click()
        economy_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "settlement.currency-layers",
            "settlement-economy",
            all(label in economy_text for label in (
                "KAIOS CREDIT", "KGEN", "USDT / TWD / OTHER FIAT",
                "REFERENCE ONLY", "Permanent Peg false", "Guaranteed Return false",
                "0.30% UNCHANGED",
            )),
        )
        cycle_before = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        page.locator("[data-civilization-action='RUN_SETTLEMENT']").click()
        cycle_after = int(page.evaluate("document.documentElement.dataset.civilizationBalance"))
        gate.expect(
            "settlement.salary-tax-rent",
            "settlement-economy",
            cycle_after == cycle_before + 18
            and all(label in clean_text(page.locator(".civilization-view").inner_text()) for label in ("SALARY", "TAX", "RENT")),
            details={"before": cycle_before, "after": cycle_after},
        )
        gate_balance = cycle_after
        page.locator("[data-civilization-action='REQUEST_KGEN']").click()
        page.locator("[data-civilization-action='REQUEST_TWD']").click()
        page.wait_for_function("() => document.documentElement.dataset.settlementRequests === '2'")
        gate.expect(
            "settlement.official-gates",
            "financial-boundary",
            int(page.evaluate("document.documentElement.dataset.civilizationBalance")) == gate_balance
            and clean_text(page.locator(".civilization-view").inner_text()).count("PENDING OFFICIAL SETTLEMENT") >= 2
            and page.evaluate("document.documentElement.dataset.settlementCurrency") == "KAIOS_CREDIT",
        )
        page.locator("[data-civilization-action='REQUEST_MORTGAGE']").click()
        page.locator("[data-civilization-action='REQUEST_INSURANCE']").click()
        gate.expect(
            "settlement.architecture-only-services",
            "financial-boundary",
            page.evaluate("document.documentElement.dataset.mortgageProposals") == "1"
            and page.evaluate("document.documentElement.dataset.insuranceProposals") == "1"
            and int(page.evaluate("document.documentElement.dataset.civilizationBalance")) == gate_balance,
        )

        page.locator("[data-civilization-action='TAB_GOVERNMENT']").click()
        government_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "governance.hierarchy-and-rights",
            "civilization-governance",
            all(label in government_text for label in (
                "Civilization Government", "Village to Planet Government", "Genesis Village Council",
                "Hukou Town Hall", "Hsinchu City Government", "Taiwan Province Alpha",
                "Taiwan Nation Alpha", "Earth Planet Government Alpha", "Citizen Rights",
                "Identity", "Citizenship", "Residence", "Family", "Education", "Occupation",
                "Health", "Property", "Tax Record", "Reputation", "Contribution",
            )),
        )
        cycles_before = int(page.evaluate("document.documentElement.dataset.governmentCycles"))
        page.locator("[data-civilization-action='RUN_GOVERNANCE']").click()
        page.locator("[data-civilization-action='JUSTICE_AI']").click()
        gate.expect(
            "governance.review-and-justice-boundary",
            "justice-integrity",
            int(page.evaluate("document.documentElement.dataset.governmentCycles")) == cycles_before + 1
            and page.evaluate("document.documentElement.dataset.justiceCases") == "1"
            and "no conviction, prison, penalty, or Citizen mutation" in clean_text(page.locator(".civilization-view").inner_text()),
        )

        page.locator("[data-civilization-action='TAB_SERVICES']").click()
        services_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "governance.public-services-network",
            "public-services",
            all(label in services_text for label in (
                "Public Services", "Government Budget", "Service Treasury", "Public Spending",
                "Public Projects", "Emergency Fund", "Education", "Medical", "Justice", "Police",
                "Fire Department", "Transportation", "Public Utilities", "Communication",
                "Disaster Response", "Social Welfare", "Education and Medical Network",
                "School", "College", "University", "Research Center", "AI Academy", "DNA Laboratory",
                "Hospital", "Clinic", "Emergency Center", "SIMULATION ONLY",
            ))
            and page.evaluate("document.documentElement.dataset.publicServices") == "10",
        )
        treasury_before = int(float(page.evaluate("document.documentElement.dataset.publicTreasury")))
        page.locator("[data-civilization-action='FUND_EDUCATION']").click()
        gate.expect(
            "governance.public-finance-ledger",
            "public-finance",
            int(float(page.evaluate("document.documentElement.dataset.publicTreasury"))) == treasury_before + 10
            and float(page.evaluate("document.documentElement.dataset.publicServiceQuality")) >= 0,
        )

        page.locator("[data-civilization-action='TAB_RESILIENCE']").click()
        resilience_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "governance.environment-and-resilience",
            "resilience",
            all(label in resilience_text for label in (
                "Civilization Resilience", "Readiness", "Environment", "Air Quality", "Water Quality",
                "Forest", "River", "Ocean", "Wildlife", "Pollution", "Carbon", "Ecology Recovery",
                "Earthquake", "Flood", "Typhoon", "Volcano", "Pandemic", "War",
                "Economic Crisis", "Food Crisis", "Power Failure", "NO REAL PREDICTION",
            )),
        )
        drills_before = int(page.evaluate("document.documentElement.dataset.resilienceDrills"))
        page.locator("[data-civilization-action='DRILL_EARTHQUAKE']").click()
        page.locator("[data-civilization-action='RESILIENCE_RECOVERY']").click()
        gate.expect(
            "governance.drill-and-recovery",
            "resilience",
            int(page.evaluate("document.documentElement.dataset.resilienceDrills")) == drills_before + 1
            and float(page.evaluate("document.documentElement.dataset.resilienceReadiness")) >= 0,
        )

        page.locator("[data-civilization-action='TAB_CITY']").click()
        city_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "civilization.city-runtime",
            "city-integrity",
            all(label in city_text for label in (
                "Population", "Employment", "Unemployment", "Food", "Water", "Energy",
                "Housing", "Roads", "Pollution", "Happiness", "Industry",
                "Supply Chain", "Ecology", "Ecology Recovery", "Education", "Logistics",
                "Settlement Integrity", "Company Health", "Public Services", "Government Trust",
                "Justice Integrity", "Resilience", "Civilization Stage",
            ))
            and page.evaluate("document.documentElement.dataset.civilizationCity") in {"STABLE", "THRIVING", "STRAINED", "AT_RISK"},
        )

        storage_before = page.evaluate("Object.values(localStorage).reduce((sum, value) => sum + value.length, 0)")
        page.locator("[data-civilization-action='TAB_TODAY']").click()
        for _ in range(10):
            page.locator("[data-civilization-action='ADVANCE_DAY']").click(timeout=20000)
        storage_after = page.evaluate("Object.values(localStorage).reduce((sum, value) => sum + value.length, 0)")
        gate.expect(
            "civilization.memory-bound",
            "memory-leak",
            storage_after < 500_000 and storage_after - storage_before < 250_000,
            details={"before_bytes": storage_before, "after_bytes": storage_after},
        )

        layout = measure_overflow(page)
        canvas_widths = page.locator("#world-canvas").evaluate(
            "element => ({canvas: element.getBoundingClientRect().width, parent: element.parentElement.getBoundingClientRect().width})"
        )
        gate.expect(
            "civilization.responsive-canvas",
            "responsive",
            abs(canvas_widths["canvas"] - canvas_widths["parent"]) <= 1
            and layout["document_width"] <= layout["viewport_width"]
            and not layout["offenders"],
            details={"canvas": canvas_widths, "layout": layout},
        )

        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "civilization.visual-nonblank",
            "visual-regression",
            screenshot["pixel_variance"] >= 15 and screenshot["visual_range"] >= 32,
            details=screenshot,
        )
        browser_clean(monitor, "civilization-alpha", gate)
    except Exception as error:
        gate.add(
            "civilization.execution",
            "civilization",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "civilization-alpha", gate)
    finally:
        context.close()


def run_production_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    base = next(case for case in MATRIX if case.slug == "android-portrait-dark")
    case = ViewportCase(
        "production-mobile", base.family, base.orientation, base.width, base.height,
        base.theme, base.touch, base.device_scale_factor, base.user_agent,
    )
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.locator("[data-civilization-action='TAB_PRODUCTION']").click()
        layout = measure_overflow(page)
        mobile = page.evaluate("""
          () => {
            const inspector = document.getElementById("inspector-panel")?.getBoundingClientRect();
            const tabs = document.querySelector(".civilization-tabs");
            return {
              factory: document.documentElement.dataset.factoryStatus,
              inspector: inspector ? {width: inspector.width, height: inspector.height, left: inspector.left, top: inspector.top} : null,
              tabs_client: tabs?.clientWidth ?? 0,
              tabs_scroll: tabs?.scrollWidth ?? 0,
              viewport: {width: innerWidth, height: innerHeight}
            };
          }
        """)
        targets = measure_touch_targets(page)
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "production.mobile-runtime",
            "mobile-interaction",
            mobile["factory"] in {"READY", "BLOCKED"}
            and mobile["inspector"] is not None
            and mobile["inspector"]["width"] >= mobile["viewport"]["width"] - 1
            and layout["document_width"] <= layout["viewport_width"]
            and layout["document_height"] <= layout["viewport_height"]
            and not layout["offenders"]
            and not targets["violations"]
            and screenshot["pixel_variance"] >= 15,
            details={"layout": layout, "mobile": mobile, "targets": targets, "screenshot": screenshot},
        )
        browser_clean(monitor, "production-mobile", gate)
    except Exception as error:
        gate.add(
            "production.mobile-execution",
            "mobile-interaction",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "production-mobile", gate)
    finally:
        context.close()


def run_settlement_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    base = next(case for case in MATRIX if case.slug == "iphone-portrait-light")
    case = ViewportCase(
        "settlement-mobile", base.family, base.orientation, base.width, base.height,
        base.theme, base.touch, base.device_scale_factor, base.user_agent,
    )
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "light")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.locator("[data-civilization-action='TAB_ECONOMY']").click()
        page.locator("[data-civilization-action='RUN_SETTLEMENT']").click()
        page.locator("[data-civilization-action='REQUEST_KGEN']").click()
        economy_text = clean_text(page.locator(".civilization-view").inner_text())
        layout = measure_overflow(page)
        targets = measure_touch_targets(page)
        mobile = page.evaluate("""
          () => {
            const inspector = document.getElementById("inspector-panel")?.getBoundingClientRect();
            const tabs = document.querySelector(".civilization-tabs");
            const layerGrid = document.querySelector(".currency-layer-grid");
            return {
              inspector: inspector ? {width: inspector.width, height: inspector.height, left: inspector.left, top: inspector.top} : null,
              tabs_client: tabs?.clientWidth ?? 0,
              tabs_scroll: tabs?.scrollWidth ?? 0,
              layer_columns: layerGrid ? getComputedStyle(layerGrid).gridTemplateColumns.split(" ").length : 0,
              viewport: {width: innerWidth, height: innerHeight}
            };
          }
        """)
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "settlement.mobile-economy",
            "mobile-interaction",
            all(label in economy_text for label in ("KAIOS CREDIT", "KGEN", "PENDING OFFICIAL SETTLEMENT"))
            and mobile["inspector"] is not None
            and mobile["inspector"]["width"] >= mobile["viewport"]["width"] - 1
            and mobile["tabs_scroll"] > mobile["tabs_client"]
            and mobile["layer_columns"] == 1
            and layout["document_width"] <= layout["viewport_width"]
            and not layout["offenders"]
            and not targets["violations"]
            and screenshot["pixel_variance"] >= 15,
            details={"layout": layout, "mobile": mobile, "targets": targets, "screenshot": screenshot},
        )
        page.locator("[data-civilization-action='TAB_POPULATION']").click()
        population_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "settlement.mobile-population",
            "mobile-interaction",
            all(label in population_text for label in ("Settlement Population", "Family to Civilization", "Logistics and Ecology")),
        )
        browser_clean(monitor, "settlement-mobile", gate)
    except Exception as error:
        gate.add(
            "settlement.mobile-execution",
            "mobile-interaction",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "settlement-mobile", gate)
    finally:
        context.close()


def run_governance_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    base = next(case for case in MATRIX if case.slug == "android-portrait-dark")
    case = ViewportCase(
        "governance-mobile", base.family, base.orientation, base.width, base.height,
        base.theme, base.touch, base.device_scale_factor, base.user_agent,
    )
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.locator("[data-civilization-action='TAB_SERVICES']").click()
        page.locator("[data-civilization-action='FUND_MEDICAL']").click()
        services_text = clean_text(page.locator(".civilization-view").inner_text())
        layout = measure_overflow(page)
        targets = measure_touch_targets(page)
        mobile = page.evaluate("""
          () => {
            const inspector = document.getElementById("inspector-panel")?.getBoundingClientRect();
            const tabs = document.querySelector(".civilization-tabs");
            return {
              inspector: inspector ? {width: inspector.width, height: inspector.height, left: inspector.left, top: inspector.top} : null,
              tabs_client: tabs?.clientWidth ?? 0,
              tabs_scroll: tabs?.scrollWidth ?? 0,
              services: document.documentElement.dataset.publicServices,
              viewport: {width: innerWidth, height: innerHeight}
            };
          }
        """)
        page.locator("[data-civilization-action='TAB_RESILIENCE']").click()
        page.locator("[data-civilization-action='DRILL_TYPHOON']").click()
        resilience_text = clean_text(page.locator(".civilization-view").inner_text())
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "governance.mobile-services-and-resilience",
            "mobile-interaction",
            all(label in services_text for label in ("Public Services", "Education and Medical Network"))
            and all(label in resilience_text for label in ("Civilization Resilience", "Synthetic Hazard Coverage"))
            and mobile["services"] == "10"
            and mobile["inspector"] is not None
            and mobile["inspector"]["width"] >= mobile["viewport"]["width"] - 1
            and mobile["tabs_scroll"] > mobile["tabs_client"]
            and layout["document_width"] <= layout["viewport_width"]
            and not layout["offenders"]
            and not targets["violations"]
            and screenshot["pixel_variance"] >= 15,
            details={"layout": layout, "mobile": mobile, "targets": targets, "screenshot": screenshot},
        )
        browser_clean(monitor, "governance-mobile", gate)
    except Exception as error:
        gate.add(
            "governance.mobile-execution",
            "mobile-interaction",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "governance-mobile", gate)
    finally:
        context.close()


def run_nation_timeline_alpha(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    case = ViewportCase("nation-timeline-alpha", "desktop", "landscape", 1440, 900, "dark", False, 1)
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "dark")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.wait_for_function("() => document.documentElement.dataset.nationFoundingReady === 'true'")

        page.locator("[data-civilization-action='TAB_NATION']").click()
        nation_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "nation.six-founding-requirements",
            "nation-runtime",
            all(label in nation_text for label in (
                "POPULATION", "TERRITORY", "GOVERNMENT", "SOVEREIGNTY", "TREASURY", "OFFICIAL CURRENCY",
            ))
            and page.evaluate("document.documentElement.dataset.nationStatus") == "NATION_CANDIDATE",
        )
        page.locator("[data-civilization-action='ESTABLISH_NATION']").click()
        page.wait_for_function("() => document.documentElement.dataset.nationStatus === 'ESTABLISHED_SYNTHETIC'")
        gate.expect(
            "nation.synthetic-founding",
            "nation-runtime",
            "SYNTHETIC ONLY" in clean_text(page.locator(".civilization-view").inner_text()),
        )

        policy_before = int(page.evaluate("document.documentElement.dataset.nationTaxPolicy"))
        page.locator("[data-civilization-action='SET_NATION_TAX']").click()
        page.locator("[data-civilization-action='SETTLE_NATION_TAX']").click()
        page.wait_for_function(
            "before => Number(document.documentElement.dataset.nationTaxPolicy) === before + 1",
            arg=policy_before,
        )
        page.locator("[data-civilization-action='TRADE_NATION_RESOURCE']").click()
        page.wait_for_function("() => Number(document.documentElement.dataset.nationResourceTrades) === 1")
        gate.expect(
            "nation.finance-and-resource-economy",
            "nation-economy",
            float(page.evaluate("document.documentElement.dataset.nationTreasury")) > 0
            and page.evaluate("document.documentElement.dataset.nationResourceTrades") == "1"
            and all(label in clean_text(page.locator(".civilization-view").inner_text()) for label in (
                "Tax Policy and Treasury", "Planet Resources", "KAIOS CREDIT",
            )),
        )

        page.locator("[data-civilization-action='PROPOSE_NATION_DIPLOMACY']").click()
        page.wait_for_function("() => document.documentElement.dataset.nationDiplomacyPending === '1'")
        page.locator("[data-civilization-action='REVIEW_NATION_DIPLOMACY']").click()
        page.wait_for_function("() => document.documentElement.dataset.nationDiplomacyPending === '0'")
        gate.expect(
            "nation.reviewed-diplomacy",
            "nation-diplomacy",
            "NO AGREEMENTS PENDING REVIEW" in clean_text(page.locator(".civilization-view").inner_text()),
        )

        page.locator("[data-civilization-action='TAB_TIMELINE']").click()
        for _ in range(2):
            page.locator("[data-civilization-action='RESEARCH_TIMELINE_ERA']").click()
        for _ in range(4):
            page.locator("[data-civilization-action='RESEARCH_TIMELINE_VEHICLE']").click()
        page.locator("[data-civilization-action='SUPPLY_TIMELINE_VEHICLE']").click()
        page.locator("[data-civilization-action='BUILD_TIMELINE_VEHICLE']").click()
        page.wait_for_function("() => document.documentElement.dataset.timelineVehicle === 'OPERATIONAL'")
        timeline_text = clean_text(page.locator(".civilization-view").inner_text())
        gate.expect(
            "timeline.research-material-civilization-checksum-gates",
            "timeline-runtime",
            all(label in timeline_text for label in (
                "Pocket Time Cloaked UFO", "VERIFIED", "Civilization Gate PASS", "Cambrian RESEARCH READY",
            )),
        )

        page.locator("[data-civilization-action='TRAVEL_TIMELINE']").click()
        page.wait_for_function("() => document.documentElement.dataset.timelineEra === 'CAMBRIAN'")
        page.locator("[data-civilization-action='RETURN_TIMELINE_ORIGIN']").click()
        page.wait_for_function("() => document.documentElement.dataset.timelineEra === 'AI_CIVILIZATION'")
        layout = measure_overflow(page)
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "timeline.synthetic-round-trip",
            "timeline-runtime",
            page.evaluate("document.documentElement.dataset.timelineJourneys") == "2"
            and "Canonical Mutation false" in clean_text(page.locator(".civilization-view").inner_text())
            and not layout["offenders"],
            details={"layout": layout, "screenshot": screenshot},
        )
        browser_clean(monitor, "nation-timeline-alpha", gate)
    except Exception as error:
        gate.add(
            "nation-timeline.execution",
            "nation-timeline",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "nation-timeline-alpha", gate)
    finally:
        context.close()


def run_nation_timeline_mobile(browser: Browser, args: argparse.Namespace, gate: Gate) -> None:
    source = next(case for case in MATRIX if case.slug == "iphone-portrait-light")
    case = ViewportCase(
        "nation-timeline-mobile", source.family, source.orientation, source.width,
        source.height, source.theme, source.touch, source.device_scale_factor, source.user_agent,
    )
    context = new_context(browser, case)
    page = context.new_page()
    monitor = BrowserMonitor(page, args.base_url)
    try:
        load_page(page, args.base_url, "light")
        start_mock_session(page, with_location=False)
        page.locator("[data-mode='CIVILIZATION']").click()
        page.locator("[data-civilization-action='TAB_NATION']").click()
        nation_layout = measure_overflow(page)
        page.locator("[data-civilization-action='TAB_TIMELINE']").click()
        timeline_layout = measure_overflow(page)
        active_tab_visible = page.evaluate("""
          () => {
            const tabs = document.querySelector('.civilization-tabs');
            const active = tabs?.querySelector('[aria-selected="true"]');
            if (!tabs || !active) return false;
            const container = tabs.getBoundingClientRect();
            const target = active.getBoundingClientRect();
            return target.left >= container.left && target.right <= container.right;
          }
        """)
        screenshot = capture_screenshot(page, case, args.output_dir, None, args.pixel_threshold)
        gate.screenshots.append(screenshot)
        gate.expect(
            "nation-timeline.mobile-responsive",
            "mobile-interaction",
            not nation_layout["offenders"]
            and not timeline_layout["offenders"]
            and page.locator(".inspector-panel").evaluate("element => element.classList.contains('is-open')")
            and page.locator("[data-civilization-action='TAB_TIMELINE']").get_attribute("aria-selected") == "true"
            and active_tab_visible
            and screenshot["pixel_variance"] >= 15,
            details={"nation": nation_layout, "timeline": timeline_layout, "active_tab_visible": active_tab_visible, "screenshot": screenshot},
        )
        browser_clean(monitor, "nation-timeline-mobile", gate)
    except Exception as error:
        gate.add(
            "nation-timeline.mobile-execution",
            "mobile-interaction",
            "FAIL",
            details={"error": clean_text(error)},
        )
        browser_clean(monitor, "nation-timeline-mobile", gate)
    finally:
        context.close()


def reports(args: argparse.Namespace, gate: Gate) -> tuple[dict[str, Any], dict[str, Any]]:
    matrix = [asdict(case) for case in MATRIX]
    qa_report = {
        "base_url": args.base_url,
        "browser_engine": "chromium",
        "checks": sorted(gate.checks, key=lambda item: item["id"]),
        "errors": sorted(gate.browser_observations, key=lambda item: item["case"]),
        "gate": "KAIOS_WORLD_VIEWER_PRODUCT_QA",
        "matrix": matrix,
        "schema": REPORT_SCHEMA,
        "screenshots": sorted(gate.screenshots, key=lambda item: item["case"]),
        "status": "FAIL" if gate.failed else "PASS",
        "summary": gate.summary(),
    }
    performance_report = {
        "budgets": PERFORMANCE_BUDGETS,
        "cases": sorted(gate.performance, key=lambda item: item["case"]),
        "gate": "KAIOS_WORLD_VIEWER_PERFORMANCE_QA",
        "schema": REPORT_SCHEMA,
        "status": "FAIL" if any(
            item["status"] == "FAIL" for item in gate.performance
        ) else "PASS",
    }
    return qa_report, performance_report


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080/KGEN-KAIOS/world-viewer/index.html",
        help="Served World Viewer index URL.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=TEST_ROOT / "output",
        help="Directory for deterministic reports and screenshots.",
    )
    parser.add_argument(
        "--baseline-dir",
        type=Path,
        help="Optional screenshot baseline directory; existing files are never overwritten.",
    )
    parser.add_argument(
        "--require-baselines",
        action="store_true",
        help="Fail when any matrix baseline is missing.",
    )
    parser.add_argument(
        "--max-diff-ratio",
        type=float,
        default=0.005,
        help="Maximum fraction of pixels above the per-pixel threshold.",
    )
    parser.add_argument(
        "--pixel-threshold",
        type=int,
        default=12,
        help="Per-channel screenshot difference threshold from 0 through 255.",
    )
    parser.add_argument("--headed", action="store_true", help="Run Chromium headed.")
    parser.add_argument(
        "--browser-executable",
        type=Path,
        help="Optional local Chromium/Chrome executable. CI uses Playwright Chromium when omitted.",
    )
    args = parser.parse_args(argv)
    args.output_dir = args.output_dir.resolve()
    args.baseline_dir = args.baseline_dir.resolve() if args.baseline_dir else None
    args.browser_executable = (
        args.browser_executable.resolve() if args.browser_executable else None
    )
    if args.require_baselines and args.baseline_dir is None:
        parser.error("--require-baselines requires --baseline-dir")
    if not 0 <= args.max_diff_ratio <= 1:
        parser.error("--max-diff-ratio must be between 0 and 1")
    if not 0 <= args.pixel_threshold <= 255:
        parser.error("--pixel-threshold must be between 0 and 255")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    args.output_dir.mkdir(parents=True, exist_ok=True)
    gate = Gate()
    try:
        with sync_playwright() as playwright:
            launch_options: dict[str, Any] = {"headless": not args.headed}
            if args.browser_executable:
                launch_options["executable_path"] = str(args.browser_executable)
            browser = playwright.chromium.launch(**launch_options)
            try:
                warm_context = browser.new_context(viewport={"width": 1024, "height": 768})
                try:
                    warm_page = warm_context.new_page()
                    warm_page.goto(args.base_url, wait_until="domcontentloaded", timeout=15000)
                    warm_page.wait_for_function(
                        "() => document.documentElement.dataset.worldViewerRendered === 'true'",
                        timeout=10000,
                    )
                finally:
                    warm_context.close()
                for index, case in enumerate(MATRIX):
                    run_matrix_case(browser, case, args, gate, index == 0)
                run_mouse_and_navigation(browser, args, gate)
                run_touch_interaction(browser, args, gate)
                run_login_and_consent(browser, args, gate)
                run_genesis_mobile(browser, args, gate)
                run_proposal_permissions(browser, args, gate)
                run_life_stack(browser, args, gate)
                run_digital_earth_alpha(browser, args, gate)
                run_digital_earth_mobile(browser, args, gate)
                run_civilization_alpha(browser, args, gate)
                run_production_mobile(browser, args, gate)
                run_settlement_mobile(browser, args, gate)
                run_governance_mobile(browser, args, gate)
                run_nation_timeline_alpha(browser, args, gate)
                run_nation_timeline_mobile(browser, args, gate)
            finally:
                browser.close()
    except Exception as error:
        gate.add(
            "browser-launch",
            "infrastructure",
            "FAIL",
            details={"error": clean_text(error)},
        )

    qa_report, performance_report = reports(args, gate)
    stable_json(args.output_dir / "qa-report.json", qa_report)
    stable_json(args.output_dir / "performance-report.json", performance_report)
    print(
        qa_report["status"],
        f"{qa_report['summary']['passed']} passed;",
        f"{qa_report['summary']['failed']} failed;",
        f"{qa_report['summary']['skipped']} skipped;",
        f"reports: {args.output_dir}",
    )
    return 1 if gate.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
