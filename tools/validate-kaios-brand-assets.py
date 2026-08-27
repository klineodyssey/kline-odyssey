import hashlib
import json
import struct
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "kaios"
manifest = json.loads((OUT / "brand-manifest.json").read_text(encoding="utf-8"))

assert manifest["status"] == "REVIEW_CANDIDATE_NOT_CURRENT"
assert manifest["visualSystem"] == "SAME_KGEN_MASTER_MARK_DIFFERENT_SYMBOL_NAMES"
assert manifest["sharedMark"] is True
assert manifest["licenseStatus"] == "HUMAN_APPROVAL_EVIDENCE_REQUIRED"
assert manifest["websiteReplacementAuthorized"] is False
assert manifest["externalMetadataSubmissionStatus"] == "NOT_SUBMITTED_ACCOUNT_OWNERSHIP_GATE"

required = {
    "kaios-logo.svg", "kaios-logo-256.png", "kaios-token-512.png",
    "kaios-og-1200x630.png", "kufo-token-512.png", "kship-token-512.png",
    "kaios-logo-light.svg", "kaios-logo-dark.svg", "kaios-logo-monochrome.svg",
    "kaios-favicon-32.png", "kaios-apple-touch-icon-180.png",
}
assert required <= {Path(item["path"]).name for item in manifest["assets"]}

for item in manifest["assets"]:
    path = ROOT / item["path"]
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"]
    if path.suffix == ".svg":
        assert ElementTree.parse(path).getroot().attrib["viewBox"] == item["viewBox"] == "0 0 32 32"
    else:
        data = path.read_bytes()
        width, height = struct.unpack(">II", data[16:24])
        assert data[:8] == b"\x89PNG\r\n\x1a\n"
        assert [width, height] == [item["width"], item["height"]]
        if "og-" not in path.name:
            assert item["mode"] == "RGBA"

shared_tokens = [OUT / name for name in ("kaios-token-512.png", "kufo-token-512.png", "kship-token-512.png")]
assert len({hashlib.sha256(path.read_bytes()).hexdigest() for path in shared_tokens}) == 1
assert hashlib.sha256((OUT / "kaios-logo-256.png").read_bytes()).hexdigest() == hashlib.sha256((ROOT / "assets/kgen/kgen-logo-256.png").read_bytes()).hexdigest()

print(f"KAIOS_BRAND_ASSET_VALIDATION=PASS assets={len(manifest['assets'])} shared_mark=PASS")
