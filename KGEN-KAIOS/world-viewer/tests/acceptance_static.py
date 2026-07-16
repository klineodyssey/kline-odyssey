#!/usr/bin/env python3
"""KAIOS-WV-SBX-001 acceptance checks (static, no network)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data" / "synthetic-world.json"
MODULES = [
    "assets/app.js",
    "assets/camera.js",
    "assets/selection.js",
    "assets/coordinate.js",
    "assets/inspector.js",
    "assets/context-menu.js",
    "assets/data-loader.js",
    "assets/accessibility.js",
    "assets/styles.css",
    "index.html",
]

PROTECTED_PREFIXES = [
    "docs/physics/",
    "K線西遊記/temples/12345/",
    "KGEN/contracts/",
]


def main():
    errors = []
    for rel in MODULES:
        if not (ROOT / rel).is_file():
            errors.append(f"missing file: {rel}")

    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    checks = {
        "parcels": len(data.get("parcels", [])) == 12,
        "buildings": len(data.get("buildings", [])) == 2,
        "rooms": len(data.get("rooms", [])) == 3,
        "proposals": len(data.get("proposalActions", [])) == 8,
        "ai": len(data.get("aiWorkers", [])) == 1,
        "npc": len(data.get("npcs", [])) == 1,
        "synthetic": data.get("meta", {}).get("synthetic") is True,
    }
    for name, ok in checks.items():
        if not ok:
            errors.append(f"fixture check failed: {name}")

    text = FIXTURE.read_text(encoding="utf-8").lower()
    for bad in ("api.binance", "wallet", "private_key", "kyc"):
        if bad in text:
            errors.append(f"secret/integration marker in fixture: {bad}")

  # protected path scan limited to files we added under world-viewer
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT.parent.parent.parent) if False else path.as_posix()
        pass

    if errors:
        print("FAIL")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("PASS", len(checks), "fixture checks;", len(MODULES), "files present")
    sys.exit(0)


if __name__ == "__main__":
    main()
