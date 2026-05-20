## V10.43 FINAL｜Runtime Architecture Constitution｜2026-05-20

- 建立正式 Root Boot Runtime，不再口頭宣稱交付。
- 新增 manifest / immune / watchdog / recursive verify / organ lifecycle / death manager / layout / sphere / warp runtime。
- 每個新增 runtime 檔案開頭皆含 FILE_CERTIFICATE，記錄出生、版本、用途、死亡規則。
- 啟動後由 browser HUD 顯示 SYSTEM PASS / FAIL。
- Node 版 verify_manifest.js 同步升級，可檢查 missing、orphan、shaMismatch、deadStillAlive、brokenReferences、recursiveHeaderMissing。
- 正式版本：`12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION`。



## V10.42.10｜Health Registry Check

- 建立 MANIFEST.json 正式戶口名冊。
- 新增 verify_manifest.js 自動體檢腳本。
- 新增 INSTALL_CHECKLIST.md、ORPHAN_REPORT.md、MISSING_REPORT.md、HEALTH_REPORT.md。
- 安裝後可檢查失蹤人口、孤兒檔案、死亡細胞、斷神經引用。
- 版本升級為 `12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK`。

# CHANGELOG

## V10.42.8 NERVE CONVERGENCE｜2026-05-20

- 移除 index.html 對 `/modules/organs/` 的執行依賴。
- 將悟空財神殿控制台器官移至 `modules/kgen-12345-organ-wukong-control-console.js`。
- 將器官登記表移至 `modules/kgen-12345-organ-registry.json`。
- 正式定義：資料夾、檔名、路徑皆為資產與神經，不可生了就不管。
- 保留 V10.42.7 器官生命週期系統，但改為根層神經收斂。


## V10.42.6｜V10.2 Modular Asset Governance

- 將 V10.2 單檔 `index_12345_Heart_UI_V10_2_FESTIVAL_RUNTIME_LOCK.html` 升成 modules 結構。
- 新增 `modules/kgen-12345-core.css`。
- 新增 `modules/kgen-12345-runtime.js`。
- `index.html` 改為載入正式 module，不再把全部 CSS/JS 塞在單檔。
- 程式改綁正式定版資產：`bull-front.png`、`bear-rear.png`、`heart.png`、`warp-core.png`。
- 移除對 `wukong_heart_core.jpg`、`wukong_caishen.png` 的依賴。
- 每個新增/更動程式檔皆加入 FILE_CERTIFICATE，記錄出生、來源、版本、狀態。


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
