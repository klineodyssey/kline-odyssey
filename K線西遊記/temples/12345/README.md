# KGEN 12345 五指山悟空財神殿

## VERSION
V10.37.4 COMPLETE_RUNTIME_GOVERNANCE_CLEAN

## BUILD
20260516-V10.37.4-COMPLETE-RUNTIME-GOVERNANCE-CLEAN

## BASE_FROM
KGEN1_12345_V10_37_1TRANSFORMER_STABLE_AXIS_C_SCENE_FULL

## 主檔位置
`K線西遊記/temples/12345/index.html`

## 橋接入口
- 根目錄 `12345.html`
- 根目錄 `wallet-12345.html`

## 重要規則

- GitHub 根目錄 `README.md` 是官網首頁，不得用 12345 README 覆蓋。
- 本檔 `K線西遊記/temples/12345/README.md` 只屬於 12345 神殿。
- 正式 runtime 檔名不得帶版本號。
- 帶版本號、歷史 patch、參考器官，一律放入 `modules/archive/` 或 reference 目錄。
- assets 只使用固定四檔名：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
- ZIP 資料結構必須等於 GitHub 部署結構。

## 本版處理

- 清理 `modules/` 根目錄，不再保留 `kgen-12345-v10.xx-*` 正式 runtime。
- 將版本檔移入 `modules/archive/`。
- 更新 `index.html` 顯示版號與 module 引用。
- 補齊 `VERSION_GOVERNANCE`、`SHA256SUMS`、`PACKAGE_MANIFEST`。
- 保留主檔 `index.html` 在 12345 神殿資料層。
- 修正 Countdown Core：heartbeat / ignite / 跨年槽分流。
