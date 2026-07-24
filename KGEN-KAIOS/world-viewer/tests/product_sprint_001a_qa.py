#!/usr/bin/env python3
"""Product Sprint 001A automated QA gates."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path("/workspace")
EVIDENCE = ROOT / "assets/product-sprint-001a-evidence"
BASE = "97165d9520f0608e04567c20dade5cdb647fd9eb"

AUTHORIZED = {
    "index.html",
    "assets/product-shell.css",
    "assets/product-shell.js",
    "assets/product-sprint-001a-evidence",
    "KGEN-KAIOS/world-viewer/index.html",
    "KGEN-KAIOS/world-viewer/ui/styles.css",
    "KGEN-KAIOS/world-viewer/tests/product_sprint_001a_screenshots.mjs",
    "KGEN-KAIOS/world-viewer/tests/product_sprint_001a_qa.py",
}


def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ROOT)


results = []

# HTTP smoke
for path in ["/index.html", "/KGEN-KAIOS/world-viewer/index.html"]:
    code = run(f"curl -s -o /dev/null -w '%{{http_code}}' http://127.0.0.1:8765{path}").stdout.strip()
    results.append({"test": f"HTTP{path}", "pass": code == "200", "detail": code})

html = (ROOT / "index.html").read_text(encoding="utf-8")
checks = [
    ("NAV_LABELS_ZH", all(x in html for x in ["首頁", "世界", "生命", "市場", "神殿", "公司", "設定", "返回"])),
    ("WORLD_VIEWER_HERO_CTA", "KGEN-KAIOS/world-viewer/index.html" in html),
    ("SAFE_AREA_VIEWPORT", "viewport-fit=cover" in html),
    ("PRODUCT_DOCK_FIXED", "product-dock" in html and "position: fixed" in (ROOT / "assets/product-shell.css").read_text()),
    ("HISTORY_FORWARD_BTN", "product-nav-forward" in html),
    ("STAGE_ERROR_PANEL", "product-feature-stage-error" in html),
    ("QUICK_START_PANEL", "product-start-panel" in html),
]
for name, ok in checks:
    results.append({"test": name, "pass": ok, "detail": ""})

# Screenshots
for shot in [
    "desktop-1440-hero.png",
    "desktop-1440-world-nav.png",
    "mobile-390-portrait-hero.png",
    "mobile-390-portrait-nav.png",
    "tablet-834-portrait.png",
    "mobile-844-landscape.png",
    "mobile-safe-area-simulated.png",
]:
    p = EVIDENCE / shot
    results.append({"test": f"SCREENSHOT_{shot}", "pass": p.is_file() and p.stat().st_size > 1000, "detail": str(p)})

# Protected paths
changed = run("git diff --name-only HEAD").stdout.strip().splitlines()
untracked = run("git ls-files --others --exclude-standard").stdout.strip().splitlines()
all_changed = [c for c in changed + untracked if c]
bad = []
for c in all_changed:
    ok = any(c == a or c.startswith(a + "/") for a in AUTHORIZED)
    ok = ok or c.startswith("KGEN-AI-Company/reports/")
    if not ok:
        bad.append(c)
results.append({"test": "PROTECTED_PATH_DIFF", "pass": len(bad) == 0, "detail": {"changed": all_changed, "unauthorized": bad}})

# Runtime CURRENT
for forbidden in [
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
    "docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json",
]:
    diff = run(f"git diff {BASE} HEAD -- {forbidden}").stdout.strip()
    results.append({"test": f"UNCHANGED_{forbidden.split('/')[-1]}", "pass": diff == "", "detail": "no diff"})

report = {
    "task_id": "KAIOS-PRODUCT-SPRINT-001A",
    "claim_id": "CLAIM-KAIOS-PRODUCT-SPRINT-001A-20260717T2237-cursor-01",
    "results": results,
    "summary": {
        "total": len(results),
        "pass": sum(1 for r in results if r["pass"]),
        "fail": sum(1 for r in results if not r["pass"]),
    },
}
out = EVIDENCE / "qa-automation.json"
out.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report["summary"], indent=2))
raise SystemExit(0 if report["summary"]["fail"] == 0 else 1)
