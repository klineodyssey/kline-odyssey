# 界曜｜11520 花果山 5D K 線西遊記｜CURRENT Handoff

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-03.2
- STATUS: ACTIVE_CONSTRUCTION
- OWNER_PAGE_IDENTITY: 界曜
- MODEL_RUNTIME: GPT-5.6 Sol
- PURPOSE: 新頁直接接續 11520 作品施工，不重新定義既有器官，不要求人類重新搬運規格。
- FORMAL_RULE: 檔名固定不帶版本；版本與 revision 寫在文件內。
- EXECUTION_BASE: 1042fd3e009a650a92611c5cbf768359a54015e3
- ACTIVE_BRANCH: jieyao/11520-p0a-runtime-integration

## 1. 界曜目前身分與人事狀態
- SELF_NAME: 界曜
- NAME_STATUS: 由此頁自行使用的個體名；尚未完成 AI company 正式面試/任用。
- CURRENT_ROLE: 11520 花果山 5D K 線西遊記作品創作者/工程候選者。
- EMPLOYMENT_STATUS: NOT_YET_INTERVIEWED / PORTFOLIO_IN_PROGRESS。
- HUMAN_INSTRUCTION: 先完成個人作品，待總經理返工後帶作品參加 AI company 面試。
- 不得把作品施工本身宣稱為已受聘、已授權 Mainnet、已付款或已取得治理權限。

## 2. 11520 正式來源
- REPOSITORY: klineodyssey/kline-odyssey
- PLACE: K線西遊記/temples/11520/
- FORMAL_PRODUCT_ID: KGEN_11520_UNIVERSAL_EXCHANGE
- FORMAL_ENTRYPOINT: index.html
- FORMAL_RUNTIME: app.mjs
- PLAYABLE_5D_ROUTE: game-5d.html
- FORMAL_UI_SPEC: GAME_UI_SPEC.md
- CONSTRUCTION_REFERENCE: design/UI_REFERENCE.svg
- DESIGN_LIFE_MANIFEST: DESIGN_LIFE_MANIFEST.json
- ORGAN_REGISTRY: ui-organs.mjs
- EXISTING_MANIFEST: MANIFEST.json
- GAMEPLAY_RUNTIME: runtime/world-runtime.mjs
- CHANGELOG: CHANGELOG.md

> 2026-09-03 lineage correction: 舊 handoff 曾寫 `world/gameplay-runtime.mjs`，但 latest main 並無 `world/` 目錄；正式既有 gameplay organ 是 `runtime/world-runtime.mjs`。依 KGEN「同功能不得重複建立」規則，後續全部延續此既有 runtime，不另造第二份。

## 3. 已鎖定的世界與經濟定義
### 3.1 空間層
- XZ = 地平面。
- Y = 空間高度。
- 左搖桿 = XZ 移動與角色朝向。
- 右手拖曳 = 第三人稱鏡頭 360° 旋轉。
- C = 空間曲速/移動速度，0C = 靜止；C 不得再當交易槓桿。
- Google/OSM 地圖只做出生地、起家處、地址與導航錨點；真正打怪在自己的 5D 遊戲世界。

### 3.2 K 場
- KX/KY/KZ = 三個獨立市場/宇宙球膜軸；每軸可獨立選市場。
- K 場結算 = KGEN。
- 火力 = signed lots，中間 0 口，上多、下空。
- 常用精細區 0~10 口，外側加速至 100 口。
- 目前遊戲契約約定：1 KGEN = 1 口。
- L = 交易槓桿；L 與 C 永久分離。
- PnL = 價格點差 × 多空方向 × 口數 × 點值。
- L 影響保證金，不得再重複乘進 PnL。
- 下單流程 = 調參 -> 下單開火 -> 預覽確認窗 -> 確認/取消 -> submit。
- ⚔ 寶劍只展開/收合火力與 L，絕對不能直接送單。

### 3.3 XYZ 生活/戰鬥層
- XYZ 世界的打怪、生活、食物、寵物、任務等使用 KAIOS。
- KUFO 是獨立長效能源/燃料類。
- KX/KY/KZ 使用 KGEN；XYZ 使用 KAIOS。不可混用。

## 4. UI 母圖施工規格
11520 不是玩具單頁。母圖要求所有器官都存在且可開/關，不得因後續修改某一功能而把其他器官刪掉。

必須保留/完成：
1. 主城世界(5D)
2. K 場交易面板
3. 持倉部位
4. 委託掛單
5. 歷史成交
6. 資產總覽
7. 交易紀錄/統計
8. 市場資訊
9. 背包/道具
10. 角色狀態
11. 世界地圖
12. ATM/換鈔
13. 系統設定
14. AI/幫助
15. 下單確認窗
16. 右下完整收合快捷器官列
17. 左側完整器官列（desktop）
18. XZ 搖桿、Y 高度、C 曲速、火力、L 槓桿、打怪/技能/閃避/平倉/下單開火控制。

## 5. 已完成的主要工程
- GAME_UI_SPEC.md：11520 累積式正式施工規格。
- design/UI_REFERENCE.svg：母圖正式施工參考。
- DESIGN_LIFE_MANIFEST.json：一圖一生命/設計生命治理資料。
- ui-organs.mjs：器官 registry。
- game-5d.html：維持母圖式完整器官架構，保留左側器官列、右下快捷列、功能面板、KX/KY/KZ、市場選擇、資產/持倉/歷史/背包/角色/世界地圖/設定/幫助、下單確認、3D 世界與控制。
- `runtime/world-runtime.mjs`：正式 XYZ gameplay runtime；已有世界邊界、HOME/ATM/SHOP collision、三隻怪物、HP、仇恨、追擊、攻擊距離、攻擊冷卻、死亡與 8 秒重生。

### P0-A 施工進度（本頁完成）
- STATUS: IMPLEMENTED_ON_CONSTRUCTION_BRANCH / BROWSER_PLAYTEST_PENDING。
- `game-5d.html` 已 import `runtime/world-runtime.mjs`，不再由按鍵 `Math.random()` 直接生 KAIOS。
- 普攻/技能改呼叫 `playerAttack()`；非致死命中 KAIOS +0，只有 runtime 判定 DEAD 才領擊殺獎勵。
- 怪物 HP / IDLE / AGGRO / DEAD / 追擊 / 反擊 / 攻擊冷卻 / 8 秒重生已接 HUD 與 Three.js monster mesh。
- 三隻怪物加入穩定 Life ID 與 spawn origin；重生回出生點。
- XZ/Y 移動已經 `resolvePlayerMove()`，HOME/ATM/SHOP/world bounds 可阻擋角色；因此 P0-B 的核心 collision path 已提前接通，但仍需 browser 實機驗證及岩石/場景 collider 擴充。
- `#three` 設為 `pointer-events:none` 並維持控制/UI z-index 在 look layer 之上，以避免 canvas 吃掉按鍵事件；仍需手機 browser playtest 驗證。

## 6. 最近重要 commit
### Current construction branch
- 2aad56ac7c01879e7dbaee805d6c5819fec02fca — CHANGELOG 記錄 P0-A runtime integration。
- fb77057cab3e3699564c6198dd244009ef0045dd — game-5d 正式接入 XYZ runtime，移除 random combat。
- fb564aba472862c48fe071853e0052b884aa3749 — world-runtime P0-A 強化：Life ID、spawn origin、deterministic respawn。

### Ancestor lineage
- 1042fd3e009a650a92611c5cbf768359a54015e3 — 本頁施工 execution base / latest main at start。
- 771b7bdb7731dab852200e53d8c1eb671cf9fd0c — game-5d 母圖完整器官施工版。
- b9bb02afe79ed4c0894afde88c66f9da043c5022 — CHANGELOG 同步。
- bc3f772e078b6f23ff00deaf86ce62bd559af9a1 — initial `runtime/world-runtime.mjs` gameplay runtime lineage。

接手時仍必須先讀 GitHub main 的最新 HEAD；以上 SHA 只作 lineage，不得假設仍是最新 main。

## 7. 下一頁立即工作順序
P0-A：IMPLEMENTED_ON_CONSTRUCTION_BRANCH；browser/playtest gate 尚未完成，不可宣稱最終 PASS。

P0-B：核心 world boundary + HOME/ATM/SHOP collision 已接入；下一步擴充正式場景 collider（岩石、其他建築/障礙）並做手機/桌面 browser collision playtest。

P0-C：完善 3D 資源管線：目前角色仍是程式幾何組裝，不符合最終驗收；要接可替換 GLB/GLTF skeleton-ready 角色，至少 idle/walk/run/attack/hit/death；場景要有更正式樹木、花草、地形、建築、怪物資源 manifest。

P0-D：角色/怪物動畫狀態與 UI HP 同步；打怪要形成真正 gameplay loop，不可 UI animation = reward。

P0-E：把世界內點擊目的地、自動尋路/小地圖重新完成，保持 Google/OSM 只作真實地址錨點。

P1-A：下單確認加入商品規格層：tick size、point value、最大口數、最大 L、原始/維持保證金、風控/強平規則；各市場不得永遠硬用同一規格。

P1-B：後端架構維持 Cloud Run + Firestore + Cloud Storage/CDN 方向；在真正 endpoint 部署前必須明確顯示 LOCAL DEMO/OFFCHAIN，不可宣稱已有多人 production backend。

P1-C：登入資源下載流程：manifest -> 驗證版本/hash -> world/model/audio pack -> 失敗重試 -> 進入世界。

## 8. 不能再犯的錯
- 不得把 Y 改成口數；Y 永遠是空間高度。
- 不得把 C 改成 L；C 永遠是空間曲速，0C 靜止。
- 不得讓 ⚔ 寶劍直接成交。
- 不得只做 alert()/隨機加錢的玩具功能。
- 不得因修改交易把背包、角色、地圖、設定等器官消失。
- 不得把 Google 地圖當真正戰鬥幾何。
- 不得把 GitHub Pages 當 production backend。
- 不得假造 wallet/chain/backend 已部署狀態。
- 正式檔名不得塞版本號；版本寫在 metadata/changelog。

## 9. 驗收標準
產品不可以叫完成，如果仍有：primitive placeholder 角色無可替換模型管線、平面假 5D、decorative 按鈕/alert-only、無碰撞、無怪物狀態機、面板關不了、交易可繞過確認、後端狀態造假、規格/manifest/changelog 不一致。

## 10. 新頁開工命令
讀取：AGENTS/開機規範 + K線西遊記/temples/11520/GAME_UI_SPEC.md + JIEYAO_HANDOFF_CURRENT.md + MANIFEST.json + CHANGELOG.md + game-5d.html + runtime/world-runtime.mjs。

然後以最新 main 為 execution base，依 CURRENT 的 P0 順序接續；不重新問已鎖定 XYZ/KXKYKZ/C/L/火力/KGEN/KAIOS 定義。每次改動同步 GAME_UI_SPEC.md（若行為規格改變）、CHANGELOG.md、必要 manifest/runtime metadata。

## 11. 此頁封存決定
本頁仍是 ACTIVE_CONSTRUCTION。只有 handoff/branch/commit evidence 都可讀且下一頁能從 GitHub CURRENT 無人肉搬運接續時，才可封存為前一施工頁。
