# KGEN 12345 ASSET MANIFEST｜V10.40.3

BASE_FROM: V10.27.1 asset governance
BUILD: 20260518-V10.40.5-MIRROR-CENTER-BULLBEAR-RESTORE

正式資產固定檔名：

- `assets/bull-front.png`：多方主圖
- `assets/bear-rear.png`：空方主圖
- `assets/heart.png`：操作觸發心臟圖 / 中央悟空核心 fallback / install-check required asset
- `assets/warp-core.png`：宇宙電梯 / WARP 核心圖

本版修正：

- active runtime 不再依賴 `wukong_heart_v10_4.png`。
- active runtime 不再依賴 `wukong_heart_core.jpg` 或 `wukong_caishen.png` 作為中心圖 fallback。
- 舊檔名只可存在於 archive/history 紀錄，不得作為 active runtime 必要資產。

規則：

- 不新增 `heart-drive.png`、`warp-universe.png` 等漂移命名。
- 換圖只替換同名檔案，不改 JS 路徑。
- GitHub 既有 assets 不得刪除。
- 若 zip 中缺少或省略圖片，以 GitHub 現有正式 assets 為準；不得用零 byte 圖覆蓋正式圖。
