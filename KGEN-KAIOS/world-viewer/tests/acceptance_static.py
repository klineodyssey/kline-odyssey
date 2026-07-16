#!/usr/bin/env python3
"""Offline acceptance checks for KAIOS World Viewer Sprint 001."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
FIXTURE = ROOT / "data" / "synthetic-world.json"

REQUIRED_FILES = (
    "index.html",
    "app.js",
    "ui/styles.css",
    "ui/shell.js",
    "ui/context-menu.js",
    "camera/camera-controller.js",
    "renderer/map-renderer.js",
    "selection/selection-controller.js",
    "inspector/inspector-view.js",
    "lod/lod-controller.js",
    "input/input-controller.js",
    "life/life-os-viewer.js",
    "data/world-store.js",
    "data/synthetic-world.json",
)

PROTECTED_PREFIXES = (
    "contracts/",
    "wallet/",
    "bridge/",
    "KGEN/contracts/",
    "K線西遊記/temples/12345/",
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
    "docs/maps/UniverseMap_",
    "final-whitepaper/",
)

LAND_USES = {
    "RESIDENTIAL",
    "FARM",
    "FOREST",
    "FACTORY",
    "MARKETPLACE",
    "TEMPLE",
    "MINE",
    "ROAD",
}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def entity_ids(data: dict) -> list[str]:
    entities = [data.get("earth")]
    for key in ("regions", "cities", "parcels", "buildings", "rooms", "lifeProfiles"):
        entities.extend(data.get(key, []))
    return [str(entity.get("id")) for entity in entities if isinstance(entity, dict)]


def main() -> int:
    errors: list[str] = []

    for relative_path in REQUIRED_FILES:
        if not (ROOT / relative_path).is_file():
            fail(errors, f"missing file: {relative_path}")

    if (ROOT / "assets").exists() and any((ROOT / "assets").iterdir()):
        fail(errors, "legacy assets/ contains duplicate runtime modules")

    try:
        data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(errors, f"fixture JSON invalid: {error}")
        data = {}

    meta = data.get("meta", {})
    checks = {
        "synthetic fixture": meta.get("synthetic") is True,
        "non-authoritative fixture": meta.get("non_authoritative") is True,
        "Earth K280": data.get("earth", {}).get("surface_k") == 280,
        "one region": len(data.get("regions", [])) == 1,
        "one city overlay": len(data.get("cities", [])) == 1,
        "twelve parcels": len(data.get("parcels", [])) == 12,
        "two buildings": len(data.get("buildings", [])) == 2,
        "three rooms": len(data.get("rooms", [])) == 3,
        "life profiles": len(data.get("lifeProfiles", [])) >= 2,
        "unknown parcel": any(parcel.get("status") == "UNKNOWN" for parcel in data.get("parcels", [])),
    }
    for label, passed in checks.items():
        if not passed:
            fail(errors, f"fixture check failed: {label}")

    action_ids = {
        action if isinstance(action, str) else action.get("id")
        for action in data.get("proposalActions", [])
    }
    if action_ids != LAND_USES:
        fail(errors, f"land-use actions mismatch: {sorted(action_ids)}")

    ids = entity_ids(data)
    if len(ids) != len(set(ids)):
        fail(errors, "world entity IDs are not unique")

    valid_parents = {
        "regions": {data.get("earth", {}).get("id")},
        "cities": {item.get("id") for item in data.get("regions", [])},
        "parcels": {item.get("id") for item in data.get("cities", [])},
        "buildings": {item.get("id") for item in data.get("parcels", [])},
        "rooms": {item.get("id") for item in data.get("buildings", [])},
    }
    for collection, parents in valid_parents.items():
        for entity in data.get(collection, []):
            if entity.get("parent_id") not in parents:
                fail(errors, f"invalid parent: {collection}/{entity.get('id')}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if 'src="./app.js"' not in html or 'href="./ui/styles.css"' not in html:
        fail(errors, "index.html does not use the approved module entry and stylesheet")
    if html.count("<script") != 1:
        fail(errors, "index.html must have exactly one script entry")

    public_text = "\n".join(
        path.read_text(encoding="utf-8", errors="replace")
        for path in ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in {".html", ".js", ".json", ".md", ".css", ".py"}
    )
    secret_patterns = (
        r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
        r"\b(?:seed phrase|mnemonic)\s*[:=]",
        r"\b(?:api[_ -]?key|private[_ -]?key)\s*[:=]\s*[\"'][^\"']+",
        r"\b(?:sk|pk)_[a-zA-Z0-9]{24,}\b",
    )
    for pattern in secret_patterns:
        if re.search(pattern, public_text, flags=re.IGNORECASE):
            fail(errors, f"possible secret matched pattern: {pattern}")

    changed = [line.strip() for line in sys.stdin if line.strip()] if not sys.stdin.isatty() else []
    for path in changed:
        normalized = path.replace("\\", "/").lstrip("./")
        if any(normalized.startswith(prefix) for prefix in PROTECTED_PREFIXES):
            fail(errors, f"protected path in changed-file input: {normalized}")

    if errors:
        print("FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print(
        "PASS",
        f"{len(REQUIRED_FILES)} files;",
        f"{len(checks)} fixture checks;",
        "8 proposal actions; protected-path input clean",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
