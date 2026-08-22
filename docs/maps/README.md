# KGEN Universe Maps

STATUS: ACTIVE
TYPE: Shared Universe Coordinate Registry
SOURCE_OF_TRUTH_SCOPE: Cross-universe shared maps

## Purpose

`/docs/maps` is the official shared map layer for KGEN / K線西遊記.

Maps are not temple-local files.
Maps are not physics laws.
Maps are cross-universe coordinate infrastructure.

## Governance Rules

1. Shared universe maps live here.
2. Temples, Portal, Game Runtime, AI Runtime and Autopilot must reference maps here instead of copying them into local temple folders.
3. Map versions must be additive. Do not overwrite old universe maps without recording lineage.
4. Any new map file must be registered in `/neural/NEURAL_MAP.json` and dependencies must be recorded in `/neural/RUNTIME_DEPENDENCY.json`.
5. Missing or duplicate map references must be recorded in `/neural/MISSING_NEURAL_LINK_REPORT.md`.

## Current Shared Map

- `UniverseMap_V10_3_COMPLETE_ALL_POINTS.json`
  - ACTIVE latest map manifest
  - Inherits every point from `UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
  - Resolved total: 123 points
  - All points retained; identical coordinates are not deduplicated
  - Applies canonical story overrides after loading the complete V10.2 base map
  - Distance scale: `16888 = 月球距離 384400 km`
  - Shared axis rule: XYZ / K-Sphere
  - Profit axis: Z-KZ
  - Explore axes: X-KX, Y-KY

## Canonical Point Update

### 6888 松樹國

`6888` is the official **松樹國** story anchor.

孫悟空在斜月三星洞學藝期間，為炫耀所學而變作松樹，並自立為國，不將菩提祖師看在眼裡；菩提祖師震怒，將悟空掃地出門。

This event is classified as:

- 西遊記主線
- 悟空修行轉折
- 炫技 / 傲氣 / 自立
- 掃地出門 / 逐出師門
- 悟空命運轉折

## Previous Complete Base Map

- `UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
  - 123 points
  - Preserved as the complete distance-data base layer
  - V10.3 loads this file first, then applies canonical overrides

## Review-Only Derived Frames

- `mars-centered-reference-frame/`
  - `REVIEW_ONLY_CANDIDATE`; independent review required
  - Adds a derived `MARS_CENTERED` frame without changing either complete map
  - Preserves `UNIVERSE/K0` as Genesis and treats `MARS/K0` as a frame-qualified local origin
  - Preserves `EARTH_CIV/K108000` as a non-distance civilization gate
  - Registered in the neural indexes with boot/runtime loading disabled

PrimeForge 以母機之名，開啟金融生命。
花果山台灣・信念不滅・市場無界。
Where the Market Becomes the Myth.
—— 樂天帝 ⌖
