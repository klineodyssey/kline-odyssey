# KGEN 12345 五指山悟空財神殿

VERSION: V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip

## 正式入口

- Canonical app: `K線西遊記/temples/12345/index.html`
- Root bridge: `12345.html`
- Wallet bridge: `wallet-12345.html`

## 本版處理

本版由 V10.40.2 起修，保留已恢復的 V9 recorder core 與左下 MOVE 平面遙桿。

修正重點：

- 移除 active runtime 對 `wukong_heart_v10_4.png` 的需求。
- active asset 檢查改為 `assets/heart.png`。
- 補手機版 layout safe patch，避免左上面板、底部 HUD、中央主圖與遙桿互相遮擋。
- 根目錄兩個 HTML 只作橋接，不再放完整 app。

## 不可動規則

- 不刪 GitHub 既有 `assets/`。
- 不改四個正式資產檔名：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
- 不移除 `#move-joystick-wrap` / `#move-joystick-knob`。
- 不移除 V9 recorder core。
