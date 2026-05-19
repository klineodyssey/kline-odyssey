# PROGRAM_HISTORY｜KGEN 12345

## V10.42.6｜2026-05-20

BIRTH: 2026-05-20  
BASE_FROM: `index_12345_Heart_UI_V10_2_FESTIVAL_RUNTIME_LOCK.html`  
UPGRADE_FROM: `12345-TEMPLE-V10.2-FESTIVAL-RUNTIME-LOCK`  
DEATH: ACTIVE  

### 本版目的

將 V10.2 單檔 UI 母版直接升成正式 modules 結構，避免 V10.40/V10.42 runtime patch 多層疊加造成畫面跑版。

### 核心治理

- index.html 保留畫面結構與外部 CDN。
- CSS 拆至 `modules/kgen-12345-core.css`。
- JS 拆至 `modules/kgen-12345-runtime.js`。
- 圖片路徑改綁正式資產名。
- 不新增 `wukong_heart_core.jpg`、`wukong_caishen.png` 等漂移資產。
