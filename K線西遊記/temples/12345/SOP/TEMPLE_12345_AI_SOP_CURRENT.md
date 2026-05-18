# TEMPLE 12345 AI SOP V1.4

VERSION: V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE
BUILD: 20260518-V10.40.5-MIRROR-CENTER-BULLBEAR-RESTORE
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip

## 本版優先規則

1. 先改 VERSION / BUILD / CHANGELOG / VERSION_GOVERNANCE，再改程式。
2. `12345.html` 與 `wallet-12345.html` 只能當根目錄橋接檔。
3. 正式程式入口為 `K線西遊記/temples/12345/index.html`。
4. active runtime 不得依賴 `wukong_heart_v10_4.png`。
5. 正式資產只能使用：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
6. 不刪 GitHub 既有 assets，不用零 byte placeholder 覆蓋正式圖。
7. 左下 MOVE 平面遙桿不可移除、不可隱藏、不可改壞。
8. V9 recorder core 不可移除。

## V10.40.3 修改範圍

- install-check asset 改為 `assets/heart.png`。
- index 加入 mobile layout safe patch。
- root bridge 檔重寫為輕量入口。
- 文件與 manifest 同步更新。
