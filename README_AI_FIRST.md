# README_AI_FIRST

**STATUS:** ACTIVE  
**PHASE:** PHASE_1_CIVILIZATION_INDEX  
**ALIGNMENT_TARGET:** V10.49.1_CIVILIZATION_BRAIN_CODE_SYNC  
**SCAN_BASE:** `git ls-files`（507 tracked files，2026-06-07 掃描）  
**PURPOSE:** AI / Agent / Cursor 進入 kline-odyssey 的第一份必讀文明索引

---

## 0. 使用規則

1. **先讀本檔，再讀神經層，再碰執行層。**
2. **Physics SoT：** `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md`
3. **主 Runtime 目標：** `K線西遊記/temples/12345/`
4. **找不到原檔不可創作冒充原版。** 記錄至 `neural/MISSING_NEURAL_LINK_REPORT.md`
5. **版本 / 狀態不可只靠檔名推論。** 必須交叉讀內容宣告、README、SOP、manifest、文明索引。
6. **禁止新增** `patch.js` / `fix.js` / `hotfix.js` / `stable.js` 或版本名器官檔名

---

## 1. 專案定位

`kline-odyssey` 是 **KLINE Odyssey / K線西遊記** repo：以金融生命、文明索引、神殿 Runtime、資料管線與鏈上 KGEN 協議組成的多層系統。新 AI / Cursor Agent 進場時，先把它視為「文明 repo」，不是單一前端專案。

| 層 | 定位 | 第一索引 |
|----|------|----------|
| `K線西遊記` | 主世界線：Portal、temples、資料 / autopilot 管線、daily output | `docs/civilization/KLINE_XIYOUJI_INDEX.json` |
| `KGEN` | 鏈上層：Token、Bank、civilization contracts、deploy/runtime scripts | `docs/civilization/KGEN_INDEX.json` |
| Portal / frontend | 前端入口與橋接層；Portal 負責導航，不取代神殿 runtime | `docs/civilization/PORTAL_INDEX.json` + `docs/civilization/FRONTEND_INDEX.json` |
| temples / runtimes | 12345 / 16888 / 108000 神殿 runtime；12345 是 PRIMARY MVP | `docs/civilization/TEMPLE_INDEX.json` |
| data / autopilot | TX / BTC / NASDAQ / public engine / autopilot / tools / daily | `docs/civilization/KLINE_XIYOUJI_INDEX.json` |
| species / contracts | 文明依賴、物種樹、合約對應與衝突 | `docs/civilization/SPECIES_TREE.json` + `docs/civilization/CONTRACT_INDEX.json` |

**治理邊界：** Phase 1 主要是索引 / 導讀 / 稽核。未獲明確授權前，不改鎖定 runtime、KGEN 合約 / scripts、physics SoT、部署合約相關檔，也不以橋接頁當作正式 runtime 版本來源。

---

## 2. AI 必讀順序（精簡）

| # | 檔案 | 用途 |
|---|------|------|
| 1 | `README_AI_FIRST.md` | 本檔：文明總索引入口 |
| 2 | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_2.md` | 母機開機檔 |
| 3 | `SOP/PRIMEFORGE_GENESIS_RUNTIME_SOP_V1_0.md` | 母機 SOP |
| 4 | `MASTER_CONTROL.md` | 主腦規則 |
| 5 | `docs/runtime/KGEN_Runtime_Boot_Sequence_V1_0.md` | Runtime 啟動 |
| 6 | `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md` | Physics SoT |
| 7 | `docs/biology/KGEN_Civilization_Biology_Runtime_V1_0.md` | 文明生物學 |
| 8 | `docs/runtime/KGEN_UFO_Runtime_Control_System_V3_0.md` | UFO Runtime |
| 9 | `docs/neural/KGEN_Universe_Neural_System_V1_0.md` | 神經系統憲章 |
| 10 | `docs/neural/CIVILIZATION_BRAIN_ROLLCALL.json` | 文明腦點名表 |
| 11 | `docs/civilization/BRAIN_INDEX.json` | 機讀文明總索引 |
| 12 | `docs/civilization/KLINE_XIYOUJI_INDEX.json` | K線西遊記主世界線 |
| 13 | `docs/civilization/KGEN_INDEX.json` | KGEN 鏈上層 |
| 14 | `docs/civilization/PORTAL_INDEX.json` | Portal 導航層 |
| 15 | `docs/civilization/FRONTEND_INDEX.json` | 前端 / bridge / index.html 全表 |
| 16 | `docs/civilization/TEMPLE_INDEX.json` | 神殿 Runtime 總表 |
| 17 | `docs/civilization/CONTRACT_INDEX.json` | 合約 / civilization 對應 |
| 18 | `docs/civilization/SPECIES_TREE.json` | 物種樹 / 依賴關係 |
| 19 | `neural/NEURAL_MAP.json` | 路徑總索引 |
| 20 | `neural/ORGAN_INDEX.json` | 器官索引（含 species_12345 雙軌） |
| 21 | `neural/RUNTIME_DEPENDENCY.json` | 依賴樹（含 temple_12345） |
| 22 | `neural/CIVILIZATION_GRAPH.json` | 文明節點圖 |
| 23 | `neural/DNA_RELATIONS.json` | DNA 相容規則 |
| 24 | `neural/MISSING_NEURAL_LINK_REPORT.md` | 失聯 / 衝突回報 |
| 25 | `docs/civilization/TEMPLE_12345_INDEX.json` | 12345 專屬索引 |
| 26 | `K線西遊記/temples/12345/LIFE_MANIFEST.json` | 12345 生命名冊 |
| 27 | `K線西遊記/temples/12345/RUNTIME_GENOME.json` | 12345 Runtime genome |
| 28 | `K線西遊記/temples/12345/VERSION` | 12345 Version DNA |
| 29 | `K線西遊記/temples/12345/SOP/TEMPLE_12345_AI_SOP_CURRENT.md` | 12345 現行 AI SOP |
| 30 | `K線西遊記/temples/12345/index.html` | 12345 主生命（讀點名表後才可申請施工） |

---

## 3. Repo 文明分區（實際掃描）

| 分區 ID | 路徑前綴 | tracked 檔案數 | 角色 |
|---------|----------|---------------|------|
| `temples` | `K線西遊記/temples/` | 212 | 神殿 Runtime（12345 / 16888 / 108000） |
| `kline_universe` | `K線西遊記/`（不含 temples 重複計） | 100 | 宇宙入口、管線、工具 |
| `kgen_chain` | `KGEN/` | 41 | 合約、腳本、鏈上 Runtime |
| `whitepaper` | `whitepaper/` | 37 | 白皮書、制度文件 |
| `wukong_temple` | `wukong-temple/` | 28 | 獨立神殿站點 |
| `root_other` | 根目錄雜項 | 38 | 橋接頁、VERSION、MANIFEST 等 |
| `github_ci` | `.github/` | 14 | CI / Autopilot workflow |
| `docs_constitution` | `docs/runtime` `docs/physics` `docs/biology` `docs/neural` `docs/maps` | 12 | 宇宙憲章層 |
| `neural` | `neural/` | 7 | 神經索引層 |
| `archive` | `archive/` | 10 | 死亡細胞 / 舊版 |
| `boot_sop` | Boot + SOP + AGENTS + MASTER_CONTROL | 4 | 開機治理 |
| `genome_handoff` | `genome/` `handoff/` | 3 | Genome schema / 交接 |
| `constraints` | `constrains/` | 1 | 宇宙天條 |

**合計：** 507 tracked files

**索引快查：**

- `docs/civilization/KLINE_XIYOUJI_INDEX.json`：主世界線總覽 → `PORTAL_INDEX` / `TEMPLE_INDEX` / `FRONTEND_INDEX`
- `docs/civilization/FRONTEND_INDEX.json`：`index_html_registry`（12 個 tracked `index.html`）、`wallet_html_registry`、`bridge_12345_html_registry`
- `docs/civilization/KGEN_INDEX.json`：鏈上層總覽 → `BANK_INDEX` / `CONTRACT_INDEX` / `TOKEN_INDEX` / `STONE_INDEX` / `HEART_INDEX` / `BRAIN_CONTRACT_INDEX` / `TREASURY_INDEX`
- `docs/civilization/TREASURY_INDEX.json`：Treasury 多層索引；區分 8888 高老莊、18888 Divine Treasury / LingxiaoDeityBank、Galactic Bank，不可只靠檔名判斷版本 / 狀態
- `docs/civilization/CONTRACT_INDEX.json#108000` + `docs/civilization/TEMPLE_108000_INDEX.json`：MarsSeats 108000；不可只靠檔名判斷版本 / 狀態

---

## 4. 神殿文明節點（實際存在）

| Species ID | 名稱 | 入口 | tracked 檔案數 | 狀態 |
|------------|------|------|---------------|------|
| **12345** | 五指山悟空財神殿 | `K線西遊記/temples/12345/index.html` | 190 | **PRIMARY MVP** |
| **16888** | 廣寒宮 | `K線西遊記/temples/16888/index.html` | 20 | ACTIVE |
| **108000** | 花果山火星齊天豪宅 | `K線西遊記/temples/108000/index.html` | 2 | STUB |

**12345 DNA 檔（必查，不猜路徑）：**

- `K線西遊記/temples/12345/LIFE_MANIFEST.json`
- `K線西遊記/temples/12345/RUNTIME_GENOME.json`
- `K線西遊記/temples/12345/MANIFEST.json`
- `K線西遊記/temples/12345/VERSION`
- `K線西遊記/temples/12345/modules/`（器官區）

**12345 雙軌器官（Phase 0 已登錄）：**

- 正式目標：`runtime-*`
- 現役 alias：`kgen-12345-*`
- 詳見：`neural/ORGAN_INDEX.json` → `species_12345`
- 載入樹：`neural/RUNTIME_DEPENDENCY.json` → `temple_12345`

---

## 5. 前端清單與橋接邊界

**前端總索引：** `docs/civilization/FRONTEND_INDEX.json`

- `index_html_registry` 是所有 tracked `index.html` 的 canonical registry（12 個，大小寫敏感）。
- `wallet_html_registry` 記錄 `wallet.html`、根目錄 `wallet-12345.html`、temple 內 `wallet-12345.html`。
- `bridge_12345_html_registry` 記錄根目錄 `12345.html`；它是 bridge，不是正式 runtime。

| ID | 路徑 | 用途 |
|----|------|------|
| `repo_root_index` | `Index.html` | GitHub Pages root landing；有已知 link drift |
| `universe_gate` | `K線西遊記/index.html` | 銀河宇宙入口 Portal V2.1 |
| `temple_12345` | `K線西遊記/temples/12345/index.html` | 悟空財神殿主生命 |
| `temple_16888` | `K線西遊記/temples/16888/index.html` | 廣寒宮 |
| `temple_108000` | `K線西遊記/temples/108000/index.html` | 火星豪宅 stub |
| `kline_app_game` | `K線西遊記/kline-app-game/index.html` | BTC 4D cockpit / game frontend |
| `kline_btc_pipeline` | `K線西遊記/kline-btc/index.html` | BTC pipeline frontend placeholder |
| `bridge_12345` | `12345.html` | ASCII 神殿橋接入口（→ `temples/12345/index.html`） |
| `bridge_wallet_social` | `wallet.html` | LINE/Facebook 社群錢包中繼（`?to=12345\|portal\|16888`） |
| `bridge_wallet_root` | `wallet-12345.html` | 12345 ASCII 錢包橋接（SOP / LIFE_MANIFEST 登錄） |
| `bridge_wallet_temple` | `K線西遊記/temples/12345/wallet-12345.html` | temple 內 wallet bridge copy |
| `wukong_temple` | `wukong-temple/index.html` | 獨立悟空神殿站 |
| `whitepaper_gate` | `whitepaper/index.html` | 白皮書入口 |
| `archive_gate` | `K線西遊記/archive/INDEX.html` | Portal V2.0.2 archive |

**邊界：** `K線西遊記/index.html` 是 Portal 導航殼；`K線西遊記/temples/*/index.html` 才是神殿 runtime。`12345.html`、`wallet.html`、`wallet-12345.html` 是 bridge / deeplink / wallet relay，不可作為正式 runtime 版本來源。

---

## 6. 資料管線分區（實際存在）

| 管線 | 路徑 | 檔案數 | 入口檔 |
|------|------|--------|--------|
| 台指期 | `K線西遊記/kline-taifex/` | 30 | `README.md` |
| BTC | `K線西遊記/kline-btc/` | 6 | `README.md` |
| NASDAQ | `K線西遊記/kline-nasdaq/` | 1 | `README.md` |
| 公開引擎 | `K線西遊記/kline-engine-public/` | 8 | `README.md` |
| App Game | `K線西遊記/kline-app-game/` | 4 | `README.md` |
| Autopilot | `K線西遊記/autopilot/` | 9 | — |
| Engine | `K線西遊記/engine/` | 2 | — |
| Tools | `K線西遊記/tools/` | 5 | — |
| Daily | `K線西遊記/daily/` | 20 | — |

---

## 7. 文明節點關係（摘要）

來源：`neural/CIVILIZATION_GRAPH.json`

```text
11520（花果山台灣 Brain）──┐
18888（靈霄寶殿 Treasury）──┼──→ 12345（悟空財神殿 Core）
                            │
16888（廣寒宮 Cockpit）←── 12345
20888（火焰山）←── 12345
108000（火星豪宅）←── 18888
8895（雲棧洞錢莊）←── 18888
```

---

## 8. 版本治理規則

1. **不可只靠檔名判斷版本 / 狀態。** 必須交叉讀 source 內容宣告、contract declaration、README、SOP、manifest、VERSION、BUILD、CHANGELOG、文明索引。
2. **衝突要記錄，不要自行解釋成一致。** 若 filename / title / UI header / SOP / contract declaration / deployed docs 不一致，將衝突寫入或引用索引與 `neural/MISSING_NEURAL_LINK_REPORT.md`。
3. **KGEN 合約版本政策：** `KGEN/contracts/README.md` 規定「新版本一律新增檔案，不覆蓋舊檔」；升級合約需補 upgrade note、migration note、新舊地址對照（若有）。
4. **12345 版本漂移是已知狀態。** 詳見 `neural/MISSING_NEURAL_LINK_REPORT.md`、`docs/civilization/FRONTEND_INDEX.json#version_drift`、`docs/civilization/TEMPLE_12345_INDEX.json#version_layers`。
5. **12345 雙軌器官仍在 transition。** `runtime-*` 是正式目標，`kgen-12345-*` 是現役 alias；詳見 `neural/ORGAN_INDEX.json`、`neural/RUNTIME_DEPENDENCY.json`、`docs/civilization/TEMPLE_12345_INDEX.json`。
6. **禁止命名型版本器官：** `patch`、`hotfix`、`fix`、`stable`、`v10-`、`v104` 屬治理限制；不要新增同類 runtime/source 檔。
7. **Bridge 不是正式 runtime 版本來源。** `12345.html`、`wallet.html`、`wallet-12345.html` 只能證明 bridge 行為，不可反推 temple runtime 版本。
8. **寫程式前先改 / 確認 metadata。** 對任何已獲授權的 source/runtime edit，動手寫 code 前，先更新或確認對應 manifest / header / governance doc 內的 `VERSION`、`BUILD`、`CHANGELOG`、`BASE_FROM`。索引 / 稽核任務不得為了補版本而改 runtime/source。

---

## 9. 禁止事項

- 未經明確授權，不改 `K線西遊記/temples/12345/index.html` 或 `K線西遊記/temples/12345/modules/*`。
- 未經明確授權，不改 `KGEN/contracts/*`、`KGEN/scripts/*`、`docs/physics/*`、部署合約相關檔。
- 不從檔名單獨推論版本、部署狀態、正式性或生命狀態。
- 不創作缺失原檔、缺失合約、缺失部署地址；缺口記錄到既有 report / index。
- 不新增 `patch` / `fix` / `hotfix` / `stable` / `v10-` / `v104` 類器官檔或版本名 source/runtime 檔。
- 任務若是 indexing / audit-only，只改索引 / 文件；不順手修改 source/runtime。
- 必須區分 bridge page 與 formal runtime：bridge 可導流，不能取代 `temples/*/index.html` 的 runtime 身分。

---

## 10. 已知衝突（AI 不可忽略）

來源：`neural/MISSING_NEURAL_LINK_REPORT.md`（STATUS: ACTIVE）

| 衝突 | 說明 |
|------|------|
| Physics V1_2 vs V1_6 | Boot 仍 cite V1_2；Neural 已統一 V1_6 |
| 雙軌器官 | `runtime-*` 與 `kgen-12345-*` 同時存活 |
| 6 個 MISSING_FILENAME | `runtime-heart/brain/boundary/autopilot/sphere/hud.js` 在 12345 無同名檔 |
| 版本漂移 | V10.47.1 / V10.48.1 / V10.49.1 / V10.49.2 共存 |
| index 點名表過期 | SOP/archive 標 MISSING 但實際存在 |
| 癌化命名 | `runtime-v10-40-6-stable-patch.js` 等仍在 modules 正式區 |
| Bank 地址衝突 | Portal 顯示 `0xfc522...681F` 為 18888 Bank / Galactic Bank；KGEN README 未列 Bank 部署地址，詳見 `docs/civilization/BANK_INDEX.json` |
| MarsSeats 108000 | Portal/前端顯示 deployed address，但 `KGEN/README.md` 未列；108000 前端 ABI 與 repo Solidity source 有函式面差異，改 runtime 前需確認 deployed ABI |

**待樂天帝決策：** D1–D8（見 `neural/MISSING_NEURAL_LINK_REPORT.md` §7）

---

## 11. MVP 鎖定範圍

**ONLY focus（施工主戰場）：**

```text
K線西遊記/temples/12345/
```

**可讀不可亂改（除非明確授權）：**

```text
K線西遊記/temples/12345/modules/kgen-12345-runtime.js   ← 主邏輯仍在這
K線西遊記/temples/12345/index.html                        ← 讀點名表後才改
```

**封存區（不可當正式器官）：**

```text
archive/
K線西遊記/temples/12345/archive/
K線西遊記/temples/12345/modules/archive/
wukong-temple/archive/
```

---

## 12. Phase 狀態

| Phase | 內容 | 狀態 |
|-------|------|------|
| Phase 0 | Neural 神經對齊（7 檔） | ✅ 已 commit `PHASE_0_NEURAL_SYNC_V10.49.1` |
| Phase 1 | 文明索引建立（本檔） | ✅ 進行中 |
| Phase 2 | index 點名表 / 載入順序 | ⏳ 待批准 |
| Phase 3 | 雙軌收斂 / 癌化封存 | ⏳ 待 D1–D8 決策 |

---

## 13. 驗證指令

```powershell
cd C:\Desktop\kline-odyssey

# 必讀檔存在性
Test-Path README_AI_FIRST.md
Test-Path neural\NEURAL_MAP.json
Test-Path docs\physics\KGEN_Universe_Physics_Runtime_V1_6.md
Test-Path "K線西遊記\temples\12345\index.html"

# Neural JSON 語法
node -e "['NEURAL_MAP','ORGAN_INDEX','RUNTIME_DEPENDENCY','CIVILIZATION_GRAPH','DNA_RELATIONS'].forEach(f=>JSON.parse(require('fs').readFileSync('neural/'+f+'.json','utf8'))); console.log('NEURAL JSON OK')"

# tracked 檔案總數
git ls-files | Measure-Object -Line
```

---

**PrimeForge 以母機之名，開啟金融生命。**

花果山台灣・信念不滅・市場無界。

Where the Market Becomes the Myth.

—— 樂天帝 ⌖
