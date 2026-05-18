# EXECUTION MAP
VERSION: V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip

## 部署路徑

1. 根目錄放置：`12345.html`、`wallet-12345.html`。
2. 正式 app 放置：`K線西遊記/temples/12345/index.html`。
3. modules 放置：`K線西遊記/temples/12345/modules/`。
4. assets 使用 GitHub 現有正式資產，不得以零 byte placeholder 覆蓋。

## 本版執行順序

- 先更新版本治理檔。
- 再修正 active asset references。
- 再加手機 layout safe patch。
- 最後重建 PACKAGE_MANIFEST / SHA256SUMS。

## 保護項目

- 左下 MOVE joystick 保留。
- V9 recorder core 保留。
- Wallet / 合約地址未變更。
