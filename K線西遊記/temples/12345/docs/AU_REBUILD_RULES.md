# AU REBUILD RULES
VERSION: V10.39.1_TEMPLE_ARCHITECTURE_MASTER

## 優先讀取
1. TEMPLE_ARCHITECTURE_MASTER.md
2. PANEL_CONTROL_MAP.md
3. ASSET_BINDING_MAP.md
4. WARP_ELEVATOR_STRUCTURE.md
5. VERSION_GOVERNANCE.json

## 禁止
- 不得新增帶版本號的正式 module 檔名
- 不得改 assets 正式四檔名
- 不得把 12345 擴充成 11520 交易所
- 不得讓總收合控制三聖盃 workflow
- 不得刪除 warp-core.png 曲速電梯綁定


## V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX 補充

BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX

- 本版只做安全修復：正式資產回歸 `assets/heart.png`，不再要求 `wukong_heart_v10_4.png`。
- 左下 MOVE joystick 與 V9 recorder core 必須保留。
- 手機版只修排版與層級，不改合約地址、不改 wallet 流程。
- `12345.html` 與 `wallet-12345.html` 是根目錄橋接檔。
