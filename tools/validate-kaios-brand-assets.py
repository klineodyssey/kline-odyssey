import hashlib,json,struct
from pathlib import Path
from xml.etree import ElementTree
R=Path(__file__).resolve().parents[1];O=R/"assets"/"kaios";m=json.loads((O/"brand-manifest.json").read_text())
assert m["status"]=="REVIEW_CANDIDATE_NOT_CURRENT" and m["websiteReplacementAuthorized"] is False
req={"kaios-logo.svg","kaios-logo-256.png","kaios-token-512.png","kaios-og-1200x630.png","kufo-token-512.png","kship-token-512.png","kaios-logo-light.svg","kaios-logo-dark.svg","kaios-logo-monochrome.svg","kaios-favicon-32.png","kaios-apple-touch-icon-180.png"};assert req<={Path(x["path"]).name for x in m["assets"]}
for x in m["assets"]:
 p=R/x["path"];assert hashlib.sha256(p.read_bytes()).hexdigest()==x["sha256"]
 if p.suffix==".svg":assert ElementTree.parse(p).getroot().attrib["viewBox"]==x["viewBox"]
 else:
  q=p.read_bytes();w,h=struct.unpack(">II",q[16:24]);assert q[:8]==b"\x89PNG\r\n\x1a\n" and [w,h]==[x["width"],x["height"]]
  if "og-" not in p.name:assert x["mode"]=="RGBA"
print(f"KAIOS_BRAND_ASSET_VALIDATION=PASS assets={len(m['assets'])}")
