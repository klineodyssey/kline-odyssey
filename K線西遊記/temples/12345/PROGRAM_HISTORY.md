## V10.43 FINAL RUNTIME ARCHITECTURE CONSTITUTION｜2026-05-20

本版是 V10.42.10 之後的正式 Runtime 架構版。重點不是新增 UI，而是將啟動、自檢、免疫、死亡管理、遞迴驗證與核心 runtime 變成實際檔案。

新增細胞也必須被檢查，因此所有新增 runtime 皆加入 FILE_CERTIFICATE，並列入 MANIFEST.json 與 verify_manifest.js。



## V10.42.10｜Health Registry Check

- 建立 MANIFEST.json 正式戶口名冊。
- 新增 verify_manifest.js 自動體檢腳本。
- 新增 INSTALL_CHECKLIST.md、ORPHAN_REPORT.md、MISSING_REPORT.md、HEALTH_REPORT.md。
- 安裝後可檢查失蹤人口、孤兒檔案、死亡細胞、斷神經引用。
- 版本升級為 `12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK`。

# PROGRAM HISTORY

## V10.42.8 NERVE CONVERGENCE｜2026-05-20

本版不是新增器官，而是修正 V10.42.7 的神經路徑風險。深層資料夾如果沒有總神經圖管理，容易成為遺忘器官，造成畫面半身不遂。本版將器官檔與 registry 收斂回 `/modules`，維持器官履歷但不再讓深層路徑參與執行。

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


## V10.42.7 ORGAN LIFECYCLE SYSTEM｜2026-05-20

- 新增 Organ Lifecycle System：每個視窗區塊視為「器官」，具備出生、活化、休眠、死亡、復活與履歷事件。
- 新增悟空財神殿控制台器官 `ORGAN_12345_WUKONG_CONTROL_CONSOLE`。
- 本版控制台為新生器官，非舊器官移植；只安全路由既有 app / web3 / templeOps 功能。
- 新增器官註冊表與 JSON 履歷匯出，避免下版忘記器官來源、版本與死亡狀態。
- 保持正式資產治理：不新增漂移圖片名，只認 `bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。


## V10.42.9 Death Cell Cleanup｜2026-05-20

- 建立死亡細胞治理：DEATH_CERTIFICATE.md。
- 建立倖存檔案清單：SURVIVOR_LIST.txt。
- 建立引用稽核：REFERENCE_AUDIT.md。
- DELETE_LIST.txt 升級為癌化神經切除清單。
- 不新增 /modules/organs/，所有器官神經集中於 /modules 根層。
- 程式開頭版本升為 12345-TEMPLE-V10.42.9-DEATH-CELL-CLEANUP。
