# KGEN Runtime Specification V1.0
## Cursor Implementation Contract
## KGEN_Runtime_Specification_V1_0.md

STATUS: ACTIVE
TYPE: Runtime / Cursor Implementation Specification
VERSION: V1.0
SOURCE_OF_TRUTH_DEPENDENCY:
- KGEN_Universe_Physics_Runtime_V3_1_Territory_Unified.md

PURPOSE:
This file is not a new universe constitution.
This file converts the current KGEN Universe Constitution into a stable implementation contract for Cursor, frontend, JSON runtime, and future app development.

---

# 1. 開發總原則

Cursor 可以開始動工，但不可把宇宙常數寫死在程式碼內。

所有宇宙規則必須由 JSON 載入。

正確架構：

UI Layer
↓
Runtime Loader
↓
Universe JSON
↓
Data Registry
↓
Rendering / Wallet / Exchange / NFT UI

禁止：

if (k === 11520)
if (planet === "花果山")
hardcoded territory constants

---

# 2. 目前可立即開工範圍

Cursor 可立即實作：

- Temple UI
- Wallet UI
- Login / Account UI
- Asset Loader
- Message System
- NFT Card UI
- Inventory UI
- Universe Map Renderer
- Exchange UI Skeleton
- Runtime JSON Loader
- Territory Viewer
- K-index Search
- Civilization Card
- App Organism Card

---

# 3. 暫不寫死範圍

以下只能做介面與資料結構，不可寫死邏輯：

- LandNFT pricing
- PlanetNFT minting
- KGEN economics
- Civilization level formula
- Mass allocation
- Energy allocation
- Territory conflict resolution
- LP gravity runtime
- BNB dark matter runtime

---

# 4. 核心宇宙資料模型

## 4.1 UniverseConfig

```json
{
  "runtimeVersion": "V1.0",
  "constitutionVersion": "V3.1",
  "universe": "KGEN",
  "origin": {
    "K0": 0,
    "meaning": "Genesis Singularity"
  },
  "token": {
    "symbol": "KGEN",
    "totalSupply": 72000000,
    "unit": "Universe Embryo Cell",
    "massUnit": "kg",
    "energyFormula": "E=mc^2"
  }
}
```

---

## 4.2 Territory Registry

K-index 是座標。
Kcenter ± Range 是文明領土。
Territory 可重疊。
LandNFT 不可重複。

```json
{
  "territories": [
    {
      "id": "taiwan-flower-fruit-mountain",
      "kCenter": 11520,
      "range": 3000,
      "kStart": 8520,
      "kEnd": 14520,
      "nameZh": "花果山",
      "civilization": "台灣文明區",
      "type": "CivilizationTerritory"
    },
    {
      "id": "china-heaven-palace",
      "kCenter": 18888,
      "range": 3000,
      "kStart": 15888,
      "kEnd": 21888,
      "nameZh": "靈霄寶殿",
      "civilization": "中國文明區",
      "type": "CivilizationTerritory"
    },
    {
      "id": "america-continent",
      "kCenter": 88888,
      "range": 50000,
      "kStart": 38888,
      "kEnd": 138888,
      "nameZh": "美洲大陸",
      "civilization": "美國文明區",
      "type": "CivilizationTerritory"
    },
    {
      "id": "japan-east-island",
      "kCenter": 14888,
      "range": 1500,
      "kStart": 13388,
      "kEnd": 16388,
      "nameZh": "東瀛日本",
      "civilization": "日本文明區",
      "type": "CivilizationTerritory",
      "status": "DRAFT"
    }
  ]
}
```

---

# 5. LandNFT 資料格式

LandNFT 代表 K-range 所有權，不代表文明領土本身。

```json
{
  "landId": "land-k-8520-9000-000001",
  "kStart": 8520,
  "kEnd": 9000,
  "owner": "wallet_address",
  "sourceTerritory": "taiwan-flower-fruit-mountain",
  "rights": [
    "BUILD",
    "TRADE",
    "LEASE",
    "COLLATERAL"
  ],
  "status": "ACTIVE"
}
```

規則：

- 同一段 K-range 不可被重複出售。
- Territory 可以重疊。
- LandNFT ownership 不可重疊。
- 若有重疊購買請求，Runtime 必須拒絕。

---

# 6. Universe Map Node 格式

```json
{
  "kIndex": 12345,
  "nameZh": "五指山",
  "type": "CivilizationCoordinate",
  "description": "悟空財神殿文明座標",
  "territoryId": null,
  "assets": [],
  "status": "ACTIVE"
}
```

---

# 7. Runtime Loader 規則

程式啟動時必須依序載入：

1. universe-config.json
2. territory-registry.json
3. universe-map.json
4. land-registry.json
5. app-organism-registry.json
6. vehicle-registry.json
7. wallet-state.json

若 JSON 不存在，UI 應顯示空資料，不可崩潰。

---

# 8. 建議資料夾結構

```text
/K線西遊記/
  runtime/
    universe-config.json
    territory-registry.json
    universe-map.json
    land-registry.json
    app-organism-registry.json
    vehicle-registry.json

  modules/
    runtime-loader.js
    territory-engine.js
    land-registry-engine.js
    universe-map-renderer.js
    wallet-adapter.js
    nft-card-renderer.js
    exchange-ui.js

  temples/
    12345/
      index.html
      assets/
        bull-front.png
        bear-rear.png
        heart-front.png
        fairy-rear.png
        warp-core.png
```

---

# 9. 必須遵守的資產路徑

正式資產固定檔名：

```text
/K線西遊記/temples/12345/assets/bull-front.png
/K線西遊記/temples/12345/assets/bear-rear.png
/K線西遊記/temples/12345/assets/heart-front.png
/K線西遊記/temples/12345/assets/fairy-rear.png
/K線西遊記/temples/12345/assets/warp-core.png
```

不可自行改名。

---

# 10. Cursor 第一階段任務

## Task 1
建立 runtime-loader.js

功能：
- 載入 runtime/*.json
- 提供 getUniverseConfig()
- 提供 getTerritories()
- 提供 getUniverseMap()
- 提供 getLandRegistry()

## Task 2
建立 territory-engine.js

功能：
- calculateRange(kCenter, range)
- findTerritoryByK(kIndex)
- listOverlappingTerritories(kStart, kEnd)

## Task 3
建立 land-registry-engine.js

功能：
- checkLandAvailable(kStart, kEnd)
- reject duplicated K-range
- registerLandNFT(payload)

## Task 4
建立 universe-map-renderer.js

功能：
- 顯示 K-index
- 顯示文明名稱
- 顯示 Territory Range
- 顯示 LandNFT 狀態

## Task 5
接入 Temple UI

功能：
- 在 12345 頁面顯示 Universe Runtime Status
- 顯示 V3.1 constitution version
- 顯示 territory registry loaded / failed

---

# 11. Cursor 禁止事項

Cursor 不可：

- 任意改宇宙公理
- 任意改 KGEN 定義
- 任意改 72,000,000
- 任意改資產檔名
- 任意把 K-index 當土地面積
- 任意把 LandNFT 當 Territory
- 任意讓同一段 K-range 被重複買賣

---

# 12. Runtime Final Law

K-index 是座標。
Kcenter ± Range 是文明領土。
Territory 可重疊。
LandNFT 不可重複。
KGEN 是宇宙胚胎細胞。
KGEN 可質能轉換。
Energy 是土地開發能力。
所有宇宙規則必須 JSON 化。
前端只能讀 Runtime，不可硬寫宇宙。
