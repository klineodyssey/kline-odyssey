from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "kaios"
MASTER_SVG = ROOT / "assets" / "kgen" / "kgen-logo.svg"
MASTER_PNG = ROOT / "assets" / "kgen" / "kgen-logo-256.png"
FONT = Path("C:/Windows/Fonts/arialbd.ttf")
RESAMPLE = Image.Resampling.LANCZOS


def font(size: int):
    return ImageFont.truetype(str(FONT), size) if FONT.exists() else ImageFont.load_default()


def master_mark(size: int) -> Image.Image:
    with Image.open(MASTER_PNG) as source:
        image = source.convert("RGBA")
        return image.copy() if size == 256 else image.resize((size, size), RESAMPLE)


def write_text_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)


def named_svg(name: str) -> str:
    return MASTER_SVG.read_text(encoding="utf-8").replace('aria-label="KGEN"', f'aria-label="{name}"')


def og_card() -> Image.Image:
    image = Image.new("RGB", (1200, 630), "#080808")
    draw = ImageDraw.Draw(image)
    mark = master_mark(420)
    image.paste(mark, (75, 105), mark)
    draw.text((535, 160), "KAIOS", font=font(110), fill="#f6c34a")
    draw.text((540, 292), "KGEN SHARED CIVILIZATION MARK", font=font(31), fill="#fff1a8")
    draw.text((540, 356), "KAIOS · KUFO · KSHIP", font=font(34), fill="#ffffff")
    draw.text((540, 424), "SAME MASTER MARK · DIFFERENT SYMBOL NAME", font=font(22), fill="#c5b991")
    draw.text((540, 470), "SHARED BRAND REVIEW · TOKEN STATES DIFFER", font=font(20), fill="#9d9d9d")
    return image


def record(path: Path) -> dict:
    item = {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    if path.suffix == ".svg":
        item["viewBox"] = "0 0 32 32"
    else:
        with Image.open(path) as image:
            item.update(width=image.width, height=image.height, mode=image.mode)
    return item


OUT.mkdir(parents=True, exist_ok=True)

for filename, label in {
    "kaios-logo.svg": "KAIOS",
    "kaios-logo-light.svg": "KAIOS light",
    "kaios-logo-dark.svg": "KAIOS dark",
    "kaios-logo-monochrome.svg": "KAIOS monochrome",
}.items():
    write_text_lf(OUT / filename, named_svg(label))

for size in (32, 64, 128, 256, 512):
    destination = OUT / f"kaios-logo-{size}.png"
    if size == 256:
        shutil.copyfile(MASTER_PNG, destination)
    else:
        master_mark(size).save(destination, optimize=True)

for filename, size in {
    "kaios-favicon-32.png": 32,
    "kaios-favicon-64.png": 64,
    "kaios-apple-touch-icon-180.png": 180,
    "kaios-token-512.png": 512,
    "kufo-token-512.png": 512,
    "kship-token-512.png": 512,
}.items():
    master_mark(size).save(OUT / filename, optimize=True)

og_card().save(OUT / "kaios-og-1200x630.png", optimize=True)

asset_paths = sorted(path for path in OUT.iterdir() if path.suffix in {".png", ".svg"})
manifest = {
    "schemaVersion": "2.0.0",
    "status": "REVIEW_CANDIDATE_NOT_CURRENT",
    "visualSystem": "SAME_KGEN_MASTER_MARK_DIFFERENT_SYMBOL_NAMES",
    "masterAsset": "assets/kgen/kgen-logo.svg",
    "masterRasterAsset": "assets/kgen/kgen-logo-256.png",
    "sharedMark": True,
    "source": "Repository canonical KGEN black-gold mark; no third-party visual assets",
    "licenseStatus": "HUMAN_APPROVED_REPOSITORY_OWNED_MASTER_MARK",
    "humanVisualDirection": {
        "decisionId": "KAIOS_HENGYAO_MASTER_COMPANY_AND_11520_GPU_REAL_MARKET_WORK_ORDER_V3_FINAL",
        "decision": "SAME_MASTER_MARK_DIFFERENT_SYMBOL_NAMES",
        "authorizedBy": "沈英明",
        "signedAtUtc": "2026-08-27T04:17:44Z",
        "status": "HUMAN_APPROVED",
    },
    "websiteReplacementAuthorized": False,
    "externalMetadataSubmissionStatus": "NOT_SUBMITTED_ACCOUNT_OWNERSHIP_GATE",
    "tokenMetadata": {
        "network": "BNB Smart Chain Mainnet",
        "chainId": 56,
        "address": "0xD4E67B3a69e41524c424150E6b6e921b01D036db",
        "deploymentTransaction": "0x731bccd9d1116831d9b43966672cb27d9017c75b6806c32109c5c210d2c3be9c",
        "name": "KAIOS Civilization Credit",
        "symbol": "KAIOS",
        "decimals": 18,
        "tokenStatus": "MAINNET_LIVE",
        "marketStatus": "NO_VERIFIED_PAIR_AT_OBSERVED_BLOCK",
        "priceStatus": "UNAVAILABLE",
        "observedBlock": 118404108,
        "observedAtUtc": "2026-08-27T15:01:55Z",
        "logo": "assets/kaios/kaios-token-512.png",
    },
    "externalDiscovery": {
        "bscScanTokenInfo": "ACCOUNT_OWNERSHIP_GATE_NOT_SUBMITTED",
        "trustWalletAssets": "NOT_SUBMITTED",
        "pancakeTokenList": "NOT_SUBMITTED",
        "coinMarketCap": "NOT_SUBMITTED",
        "coinGecko": "NOT_SUBMITTED",
    },
    "assets": [record(path) for path in asset_paths],
}
write_text_lf(OUT / "brand-manifest.json", json.dumps(manifest, indent=2) + "\n")

cards = [
    ("kaios-logo.svg", "KAIOS shared master mark"),
    ("kaios-token-512.png", "KAIOS token mark"),
    ("kufo-token-512.png", "KUFO token mark"),
    ("kship-token-512.png", "KSHIP token mark"),
    ("kaios-logo-256.png", "KAIOS 256 pixel mark"),
    ("kaios-favicon-64.png", "KAIOS favicon"),
    ("kaios-apple-touch-icon-180.png", "KAIOS Apple touch icon"),
]
review = """<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAIOS shared brand review</title><link rel="icon" href="kaios-favicon-32.png"><link rel="apple-touch-icon" href="kaios-apple-touch-icon-180.png"><style>body{margin:0;background:#080808;color:#fff;font:16px system-ui}main{max-width:1100px;margin:auto;padding:32px}h1{color:#f6c34a;font-size:clamp(2rem,7vw,4.8rem)}p{color:#c5b991}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.card{background:#15120b;border:1px solid #8a520b;border-radius:20px;padding:22px}.card img{display:block;width:100%;height:220px;object-fit:contain}.og{width:100%;border-radius:18px}</style></head><body><main><p>REVIEW CANDIDATE · NOT CURRENT · NO WEBSITE REPLACEMENT</p><h1>KGEN FAMILY MARK</h1><p>KAIOS、KUFO、KSHIP 共用 GitHub 既有 KGEN 黑金母圖，只以 token symbol／名稱區分；鏈上合約地址與代幣身分仍各自獨立。</p><img class="og" src="kaios-og-1200x630.png" alt="KGEN shared black-gold civilization mark for KAIOS KUFO and KSHIP"><section class="grid">""" + "".join(
    f'<article class="card"><img src="{path}" alt="{alt}"><b>{alt}</b></article>' for path, alt in cards
) + """</section></main></body></html>"""
write_text_lf(OUT / "review.html", review)

write_text_lf(
    OUT / "README.md",
    """# KAIOS / KUFO / KSHIP shared brand review candidate

Status: `REVIEW_CANDIDATE_NOT_CURRENT`; shared visual direction: `HUMAN_APPROVED`.

The Human-approved visual direction is `SAME_KGEN_MASTER_MARK_DIFFERENT_SYMBOL_NAMES`, recorded by decision ID `KAIOS_HENGYAO_MASTER_COMPANY_AND_11520_GPU_REAL_MARKET_WORK_ORDER_V3_FINAL`. The canonical black-gold KGEN mark in `assets/kgen/kgen-logo.svg` is the visual master. KAIOS, KUFO and KSHIP reuse the same graphic; their symbol, contract address, lineage and deployment status remain separate metadata fields.

KAIOS is live on BSC chain 56 at `0xD4E67B3a69e41524c424150E6b6e921b01D036db`, but the latest fixed-endpoint observation found no verified KAIOS/WBNB, KAIOS/KGEN or KAIOS/USDT pair. Therefore `TOKEN_LIVE`, `MARKET_NOT_LIVE` and `PRICE_UNAVAILABLE` are separate states. The identical mark does not imply identical contracts, fungibility, conversion, deployment, price or authority.

This Draft does not replace the website or submit token metadata to BscScan, MetaMask, Trust Wallet, PancakeSwap, CoinMarketCap or CoinGecko. External submissions remain gated by the relevant authenticated account, ownership proof and platform review.

All PNG token marks have transparent backgrounds. The 512-pixel KAIOS, KUFO and KSHIP token images are pixel-identical by design. Recommended alt text is token-specific even when the graphic is shared.
""",
)
