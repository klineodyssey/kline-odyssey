# KGEN Temple Gameplay Map V0.2

**對應：** `K線西遊記/data/kgen-5d-world-map.json` V0.2

## 節點總覽

| kIndex | ID | nameZh | type | gameplay | npc | economyRole |
|--------|-----|--------|------|----------|-----|-------------|
| 0 | 12345 | 悟空財神殿 | Temple | Heart / 發財金 / 心跳 | 悟空財神 | 多方基地 |
| 16888 | 16888 | 廣寒宮 | Temple | K線引擎 / 空方基地 | 嫦娥 | 空方基地 |
| -1200 | 11520 | 花果山交易所 | Exchange | Swap / LP / Organ 上架 | 神猴交易員 | Organ Exchange |
| 108000 | 108000 | 火星齊天豪宅 | SeatSystem | 500 席位 / 分紅 | 火星分身 | NFT Seat |
| 18888 | 18888 | 靈霄寶殿神明銀行 | Bank | Treasury / 清算 | 神明銀行長 | Divine Bank |
| 18921 | 18921 | 斬妖台 Auto LP | AutoLP | LP 鍛造 / 斬妖 | 斬妖將軍 | Auto LP Forge |
| 8888 | 8888 | 高老莊人民銀行 | Bank | 借貸 / 地下錢莊 | 高老莊莊主 | Underground Bank |
| 8895 | 8895 | 八戒雲棧洞 | Bank | 器官抵押 | 豬八戒 | 雲棧金融 |
| 20888 | 20888 | 火焰山 | RiskArena | 爆倉 / 燃燒教育 | 鐵扇公主 | 風險清算場 |
| 21319 | 21319 | 雷音寺 | LevelNode | 雷音試煉 | 如來使者 | 靈山前哨 |
| 21520 | 21520 | 大雄寶殿 | LevelNode | 佛法任務 | 大雄法王 | 中階聖地 |
| 21666 | 21666 | 佛光普照 | LevelNode | 淨化任務 | 光明菩薩 | 淨化節點 |
| 21888 | 21888 | 恐懼女鬼 | LevelNode | 恐懼試煉 | 恐懼女鬼 | 心理風險 |
| 22188 | 22188 | 貪婪魔影 | LevelNode | Boss 戰 | 貪婪魔影 | 5D Boss 原型 |
| 23333 | 23333 | 靈山 | LevelNode | 終局取經 | 靈山守門人 | 終極聖地 |

## 5D Game 戰場對應

```
[12345 多方基地] —塔— [11520] — [18888] — [18921] —塔— [16888 空方基地]
                      [8888]     [20888]
```

- K 線漲 → 多方推進
- K 線跌 → 空方反撲
- 佔領中路節點 → 經濟加成
- Boss「貪婪魔影」出現在 22188 / 5D 戰場

## 導航路徑

每個神殿 `index.html` 均含：

- 返回 Portal (`../../index.html`)
- 12345 神殿
- 5D Game
- 其他節點入口卡（`KGEN_TempleHub.renderEntryCards`）

## collateralRole 與 organDecompositionRule

| 節點 | 抵押角色 | 分解規則 |
|------|----------|----------|
| 11520 | 上架保證金 | 不足 → 模組回收交易所 |
| 18888 | 全宇宙清算 | 清算觸發分解動畫 |
| 8888/8895 | 借貸抵押 | 逾期 → 器官分解 |
| 18921 | LP 保證金 | 妖氣過高 / LP 不足 |
| 20888 | 高槓桿 | 爆倉全燃燒分解 |
| 關卡節點 | 試煉押金 | 失敗押金分解 |

## 與 Physics Runtime 關係

本文件為 **前端遊戲成品** 映射，不修改 `KGEN_Universe_Physics_Runtime_CURRENT.md`。  
宇宙常數仍以 Runtime CURRENT 為準；前端僅做敘事與 Demo 模擬。

---

## Human目標：123點可玩／2026-11-04基準盤點

Human 的最高整合目標是讓正式地圖 **123 個 PointID 全部可到達、可操作，且有任務或互動結果**。宇宙電梯、生活財務、AutoLP 與個別神殿工作是此整合目標的子範圍，不取代全圖可玩驗收。本節為原文件的累積增補；上文 V0.2 的 15 節點敘事與資料完整保留，不用來宣稱 123 點已完成。

### 來源、CURRENT 與資料口徑

- 來源 Git HEAD：`fff530f97a67093503c13844928d6d7847e8a80d`；這是本次盤點快照，不宣稱網站最新部署或下游 CI 已通過。
- 正式完整底圖：`docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`。
- 底圖 SHA-256：`bfde25dfb2737e6f698850aa705ea221c64bb0f228ff8e3a7f2740f0ae123451`。
- `point_index_sorted` 為 **123 筆、123 個唯一 ID、108 個不同數值座標**；`layers.main_universe.points` 也是同一組 123 個 ID 的完整資料。兩個集合不是 246 個地點。
- 共有 12 個同座標群組，多出 15 筆不同 ID；依底圖 `meta.rule` 全數保留，不按座標、名稱或共用 URL 去重。117 筆來自 Excel，6 筆為原 JSON 補入。
- `scaled_universes` 的兩層各有 2 個 projection；這 4 個投影不是額外正式 PointID。
- `docs/maps/README.md` 指定 `UniverseMap_V10_3_COMPLETE_ALL_POINTS.json` 為 ACTIVE latest manifest：先載 V10.2 完整底圖，再以 ID 套用 canonical story overrides，總數仍為 123。V10.3 對 K6888／K12800 的故事與地名承接不得被本表覆蓋；本表明列的是指定 V10.2 底圖的 ID、名稱與數值。
- 物理規則以 `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`（此快照為 CURRENT / V3.8）為準。底圖 K 座標、PointID、物理球膜尺度、場景 local XYZ、金融 KX/KY/KZ 與舊 15-node `kIndex` 是不同欄位／座標體系，不能直接互換。例如舊資料把 12345 的 `kIndex` 寫為 0、11520 寫為 -1200，不能因此移動正式 12345／11520 點。
- 原始點位的 `runtime_mapping` 是宣告資料，不是已完成 loader、到站、任務、玩家存檔或權利登記的執行證據。

### 入口、說明頁與死鏈的有界查核

| 查核範圍 | 本次可驗證數量／結果 | 可以支持的結論 |
|---|---|---|
| `K線西遊記/temples/*/index.html` | 16 個現存座標入口，對到本表 21 個不同 PointID；另 102 個 ID 無同座標 temple 入口 | 只證明檔案存在／缺少同座標獨立頁；102 點不因此被要求各建新頁 |
| Portal `assets/kaios-world-registry.mjs` | 22 entries：2 PLAYABLE、2 BETA、7 RESEARCH、11 UNDER_CONSTRUCTION | 是入口分類，不是 123 點互動驗收數 |
| Portal 可導航 entries | 11520、88888、12345、16888 共 4 個；其 4 個座標涉及 9 個底圖 ID | 9 個 ID 僅為同座標候選對應，不是 9 點可玩或已到站證據 |
| 共用遊戲入口 | 88888 明列 `routeOnly: true`、`canonicalWorldId: '11520'`，共用原玩家／存檔 | 新入口名稱不自動建立新的 PointID 場景或任務 |
| Portal 7 個 RESEARCH URL | 7 個本機目標均存在；`INFORMATION_ONLY`、不可由 `isNavigable` 當遊玩入口 | 說明／研究展示，不能計為已開放世界 |
| Portal 11 個 UNDER_CONSTRUCTION entries | `entryUrl: null` | 是刻意不開放的入口，不是 11 個失效 URL |
| 舊 V0.2 JSON 與 shared game-core | 15 nodes，15 條 JSON `route` 的目標檔案均存在 | 保留舊導航；其 `PRODUCTION/LIVE` 文字不證明逐 PointID 遊戲完成 |
| 16 個 temple HTML 的靜態同源 anchor | 本輪解析 49 個 anchor，缺少目標檔案 0 個；shared hub 的既有 `K線西遊記/game/kline-5d/index.html` 目標存在 | 僅限 HTML 靜態 anchor／本機路徑；未覆蓋動態 href、imports、fragment、HTTP、網路與操作結果 |
| 舊 5D 頁動態節點卡片 | `temple-hub.js` 原樣使用 `../<id>/index.html`；從 `K線西遊記/game/kline-5d/index.html` 解析後，15/15 指向不存在的 `K線西遊記/game/<id>/index.html` | 已觀察到來源／路徑解析缺陷；不是 HTTP 或瀏覽器實測結論，也不等於 15 個 temple 正確路徑不存在 |

本節不把「沒有同座標專頁」記成 dead link；只在某個實際導覽 URL 已被給出、其目標缺失時才可記 dead link。16 個 temple HTML 的 49 個靜態 anchor 未見缺檔，但舊 5D 頁動態卡片有上述 15 條錯誤路徑；例如原本應到 temple 12345 的相對連結，在該頁會解析為 `K線西遊記/game/12345/index.html`。不能宣稱全站無死鏈。18888 的 funding／BankPause 功能、其他模擬面板或鏈上 ABI 存在，也不等同整個正式地圖點已可玩。

### 可共用的既有 gameplay owner 與計畫

此處的 owner 指既有程式責任模組；不是替任何 AI／人員補造 Writer、角色或 lease。

| 既有責任模組 | 可沿用能力 | 本次不能宣稱的能力 |
|---|---|---|
| `K線西遊記/temples/11520/runtime/game-5d-bootstrap.mjs`、`game-5d-main.mjs` | 共用遊戲啟動、XYZ 移動／碰撞、遊戲迴圈及原 HUD | 123 個 ID 各有場景與任務 |
| `K線西遊記/temples/11520/runtime/xyz-map-navigation-runtime.mjs` | local XYZ waypoint、正規化方向、到達停止，沿原移動碰撞 owner | 正式 K 座標可直接當 XYZ，或同座標 ID 已區分到站 |
| `K線西遊記/temples/11520/runtime/map-object-navigation-runtime.mjs` | 物件 inspect、map hit、設定 waypoint | 查看資料或設定路線已完成該點任務 |
| `K線西遊記/temples/11520/runtime/digital-ant-logistics-runtime.mjs` | mission、運送、到站、明確 acceptance 與 receipt | 未發生的交付、付款或獎勵 |
| `K線西遊記/temples/11520/runtime/player-life-runtime.mjs` | 本機 Player、旅程、XYZ、進度保存 | 未配置的 cloud store 或跨裝置戶籍已完成 |
| `KGEN-KAIOS/world-viewer/app.js` 及 `timeline/timeline-runtime.js` | synthetic world 的建築／房間導航、九時代與隔離旅程 receipt | synthetic 場景或九時代已接正式 123 點 |
| `core/registry/universe-runtime.mjs`、`core/locations/index.mjs` | typed location registry；該快照 seed 有 7 locations | 7 locations 等同 123 PointID adapter |
| `K線西遊記/modules/kgen-game-core.js`、`universe-runtime/temple-hub.js` | 舊 15-node 導航、NPC／quest 資訊及 Demo 面板 | 文字 quest、Demo 數值或動畫即為可靠任務結果 |
| `K線西遊記/game/kline-5d/index.html`、`K線西遊記/modules/universe-runtime/kline-5d-engine.js` | 舊引擎直接啟動；畫面按鈕呼叫 `claimNode()`，引擎定義 5 個可 claim 戰略節點，claim 11520 可完成 q1 | 不是現代 11520 shared game 重導，也不是 123 個正式 PointID adapter |

沿用既有計畫與驗收入口，不建立第二套市場、玩家、導航或派工系統：

- `K線西遊記/temples/11520/SPECIFICATION.md`、`LOGISTICS_UNIVERSE_SPEC.md`。
- `KGEN-KAIOS/world-viewer/COORDINATE_MAPPING_STANDARD.md`、`SPRINT_005_PRODUCTION_RUNTIME_ARCHITECTURE.md`、`SPRINT_010_COSMIC_TECHNOLOGY_ARCHITECTURE.md`。
- `KGEN-KAIOS/world-viewer/FULL_WORLD_VIEWER_CAPABILITY_AUDIT.md` 與其 `tests/full_world_official_route.test.mjs`：full-world／k280 仍為 RESEARCH、INFORMATION_ONLY，不把公開 adapter 當正式遊玩入口。
- 11520 既有 `tests/11520-xyz-map-navigation.test.mjs`、`11520-runtime.test.mjs`、`11520-player-life.test.mjs`、`11520-browser-plane-map.mjs`、`11520-browser-living-world.mjs`。本輪僅盤點，未執行這些測試或啟動瀏覽器。

### 每個 PointID 的最小可玩驗收

1. **可到達**：沿正式入口與現有遊戲導航到目標，無 404／import 錯誤；實際場景讀回的 PointID 必須等於目標 ID，並帶明確座標 frame。同座標另一 ID、入口名稱或 URL 不能代替到站。
2. **可操作**：在 390×844 直版與 844×390 橫版，以實際 pointer 完成該點已定義的一項具名操作；控件可見、可觸及，操作有可觀察回饋。不為填滿表格臆造任務、獎勵或權限。
3. **有結果**：取得與 Player／PointID 綁定的既有任務或互動結果；需要保存的狀態在重開後可讀回，重播不重複記帳。介紹、inspect、waypoint、拒絕提示與真實遊戲結果分開記錄。
4. **證據**：保存來源 HEAD／map hash、PointID、操作、前後狀態或 result/receipt ID、重開／重播結果，以及上述直／橫 runtime 截圖與人工檢視結論。Functional QA 與 Visual QA 分開；模組的歷史測試通過不能直接填成逐點通過。

### 完整 123 PointID 映射表

本表依 `point_index_sorted` 原順序逐筆生成。入口僅按同數值座標查找既有 `temples/<coord>/index.html`，不是確認的 PointID→scene adapter；同頁對到多個 ID 仍各列一行。「無同座標 temple 入口」不排除未來沿原共用遊戲實現，也不表示要新增專頁。

本輪沒有進行 123 點的到達／操作／結果／畫面 runtime 驗收，因此每列 **Functional QA = NOT_VERIFIED、Visual QA = NOT_VERIFIED**。這不是否定既有模組的限定 QA，也沒有產生「已可玩」總數。

| 正式 PointID | 名稱（V10.2底圖） | coord | 同座標現有入口（僅檔案存在） | Functional QA | Visual QA |
|---|---|---:|---|---|---|
| `P_m37p63_石油_R2` | 石油 | -37.63 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_m1p0_宇宙_R3` | 宇宙 | -1 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_0p0_恐龍_R4` | 恐龍 | 0 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1p0_玩家創建_R5` | 玩家創建 | 1 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_72p0_最輕恐龍_R6` | 最輕恐龍 | 72 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_144p0_一四四時間之門_R7` | 一四四時間之門 | 144 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_188p0_地嶽_R8` | 地嶽 | 188 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_188p0_地獄門_Rjson` | 地獄門 | 188 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_233p0_二三三波動門_R9` | 二三三波動門 | 233 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_280p0_地球表面_R10` | 地球表面 | 280 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_377p0_三七七銀河峽谷_R11` | 三七七銀河峽谷 | 377 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_411p0_大氣層_R12` | 大氣層 | 411 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_720p0_七二零轉生門_R13` | 七二零轉生門 | 720 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1111p0_閻王殿_R14` | 閻王殿 | 1111 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1852p0_人造衛星高度_R15` | 人造衛星高度 | 1852 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_3141p0_影像迷宮_R16` | 影像迷宮 | 3141 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_4040p0_暗網交易所_R17` | 暗網交易所 | 4040 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_4168p0_奈何橋_R18` | 奈何橋 | 4168 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_4444p0_地府_R19` | 地府 | 4444 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_5048p0_九齒釘耙_R20` | 九齒釘耙 | 5048 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_5048p0_降妖寶杖_R21` | 降妖寶杖 | 5048 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_5168p0_金山銀礦_R22` | 金山銀礦 | 5168 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_5555p0_南海龍房_R23` | 南海龍房 | 5555 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_6128p0_斜月三星洞_R24` | 斜月三星洞 | 6128 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_6666p0_東海龍房_R25` | 東海龍房 | 6666 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_6888p0_松樹國_R26` | 松樹國 | 6888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_7200p0_畫杆方天戟_R27` | 畫杆方天戟 | 7200 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_7744p0_流沙河_R28` | 流沙河 | 7744 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_7777p0_西海龍房_R29` | 西海龍房 | 7777 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_8888p0_高老莊_R30` | 高老莊 | 8888 | `K線西遊記/temples/8888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_8895p0_雲棧洞_R31` | 雲棧洞 | 8895 | `K線西遊記/temples/8895/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_9444p0_黑風谷_R32` | 黑風谷 | 9444 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_9995p0_龍珠綠_R33` | 龍珠綠 | 9995 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_9999p0_北海龍房_R34` | 北海龍房 | 9999 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_11111p0_定海神針_R35` | 定海神針 | 11111 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_11520p0_花果山_R36` | 花果山 | 11520 | `K線西遊記/temples/11520/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_12345p0_五指山_R37` | 五指山 | 12345 | `K線西遊記/temples/12345/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_12345p0_小五指山_Rjson` | 小五指山 | 12345 | `K線西遊記/temples/12345/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_12682p0_阿斗起飛_R38` | 阿斗起飛 | 12682 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_12800p0_靈台方寸山_R39` | 靈台方寸山 | 12800 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_13500p0_金箍棒_R40` | 金箍棒 | 13500 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_13888p0_東土大唐_R41` | 東土大唐 | 13888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_14520p0_大仙女_巧雲__R43` | 大仙女(巧雲) | 14520 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_14520p0_巧雲_R42` | 巧雲 | 14520 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_14866p0_二仙女_巧虹__R45` | 二仙女(巧虹) | 14866 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_14866p0_巧虹_R44` | 巧虹 | 14866 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_16184p0_三仙女_巧芝__R47` | 三仙女(巧芝) | 16184 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_16184p0_巧芝_R46` | 巧芝 | 16184 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_16888p0_四仙女_巧仙__R50` | 四仙女(巧仙) | 16888 | `K線西遊記/temples/16888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_16888p0_巧仙_R49` | 巧仙 | 16888 | `K線西遊記/temples/16888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_16888p0_月球_Rjson` | 月球 | 16888 | `K線西遊記/temples/16888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_16888p0_白骨洞_廣寒宮_R48` | 白骨洞 / 廣寒宮 | 16888 | `K線西遊記/temples/16888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_17347p0_五仙女_巧蘭__R52` | 五仙女(巧蘭) | 17347 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_17347p0_巧蘭_R51` | 巧蘭 | 17347 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18000p0_黑洞層_R53` | 黑洞層 | 18000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18056p0_六仙女_巧梅__R55` | 六仙女(巧梅) | 18056 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18056p0_巧梅_R54` | 巧梅 | 18056 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18319p0_四大天門_R56` | 四大天門 | 18319 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18459p0_七仙女_巧靈__R58` | 七仙女(巧靈) | 18459 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18459p0_巧靈_R57` | 巧靈 | 18459 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18520p0_四大天王_R59` | 四大天王 | 18520 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18888p0_凌霄寶殿_R60` | 凌霄寶殿 | 18888 | `K線西遊記/temples/18888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_18889p0_敖欽_R61` | 敖欽 | 18889 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18890p0_敖廣_R62` | 敖廣 | 18890 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18891p0_敖順_R63` | 敖順 | 18891 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18892p0_敖吉_R64` | 敖吉 | 18892 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18893p0_總卒元將府_R65` | 總卒元將府 | 18893 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18894p0_總兵元帥府_R66` | 總兵元帥府 | 18894 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18911p0_煉丹爐_R67` | 煉丹爐 | 18911 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_18921p0_斬妖台_R68` | 斬妖台 | 18921 | `K線西遊記/temples/18921/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_18999p0_玉帝_R69` | 玉帝 | 18999 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_20000p0_女兒國_R70` | 女兒國 | 20000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_20732p0_創世之門_R71` | 創世之門 | 20732 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_20888p0_火焰山_R72` | 火焰山 | 20888 | `K線西遊記/temples/20888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_21319p0_雷音寺_R73` | 雷音寺 | 21319 | `K線西遊記/temples/21319/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_21344p0_參軍將_R74` | 參軍將 | 21344 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_21444p0_五丈原界碑_R75` | 五丈原界碑 | 21444 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_21520p0_大雄寶殿_R76` | 大雄寶殿 | 21520 | `K線西遊記/temples/21520/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_21588p0_如來佛_R77` | 如來佛 | 21588 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_21666p0_佛光普照之地_R78` | 佛光普照之地 | 21666 | `K線西遊記/temples/21666/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_21777p0_白龍門下層_R79` | 白龍門下層 | 21777 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_21888p0_恐懼女鬼_R80` | 恐懼女鬼 | 21888 | `K線西遊記/temples/21888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_22188p0_貪婪魔影_R81` | 貪婪魔影 | 22188 | `K線西遊記/temples/22188/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_22200p0_魔影之谷_R82` | 魔影之谷 | 22200 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_22400p0_幻市魔影之門_R83` | 幻市魔影之門 | 22400 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_22888p0_白龍門_R84` | 白龍門 | 22888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_23333p0_靈山_R85` | 靈山 | 23333 | `K線西遊記/temples/23333/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_24449p0_雲端神將_R86` | 雲端神將 | 24449 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_24888p0_佛祖金鋼殿_R87` | 佛祖金鋼殿 | 24888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_33333p0_黃金鑽石_R88` | 黃金鑽石 | 33333 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_36000p0_白洞層_R89` | 白洞層 | 36000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_44444p0_南海龍宮_R90` | 南海龍宮 | 44444 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_55555p0_東海龍宮_R91` | 東海龍宮 | 55555 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_66666p0_西海龍宮_R92` | 西海龍宮 | 66666 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_72000p0_大爆炸奇點_R93` | 大爆炸奇點 | 72000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_77777p0_北海龍宮_R94` | 北海龍宮 | 77777 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_80000p0_多重宇宙邊界_R95` | 多重宇宙邊界 | 80000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_88888p0_美州大陸_R96` | 美州大陸 | 88888 | `K線西遊記/temples/88888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_88888p0_美洲大陸_Rjson` | 美洲大陸 | 88888 | `K線西遊記/temples/88888/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_88895p0_蟠桃園_R97` | 蟠桃園 | 88895 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_99995p0_龍珠紅_R98` | 龍珠紅 | 99995 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_99999p0_命運之神_R99` | 命運之神 | 99999 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_99999p0_銀河主脈_R100` | 銀河主脈 | 99999 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_100000p0_玉皇宮_R101` | 玉皇宮 | 100000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_108000p0_點石成金_R102` | 點石成金 | 108000 | `K線西遊記/temples/108000/index.html`（入口存在） | NOT_VERIFIED | NOT_VERIFIED |
| `P_111111p0_如來神掌_R103` | 如來神掌 | 111111 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_123456p0_時間輪盤_R104` | 時間輪盤 | 123456 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_126500p0_最重的恐龍_R105` | 最重的恐龍 | 126500 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_126588p0_平天大聖宮_R106` | 平天大聖宮 | 126588 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_168000p0_月球基地L2_R107` | 月球基地L2 | 168000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_168888p0_筋斗雲_R108` | 筋斗雲 | 168888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_188888p0_地球神域_R109` | 地球神域 | 188888 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_511111p0_齊天大聖宮_R110` | 齊天大聖宮 | 511111 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_555550p0_東海龍宮_深淵殿_R111` | 東海龍宮·深淵殿 | 555550 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_654321p0_大五指山_Rjson` | 大五指山 | 654321 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1000000p0_玉皇大宇宙殿_R112` | 玉皇大宇宙殿 | 1000000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1234567p0_變形金鋼_R113` | 變形金鋼 | 1234567 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_1800000p0_金星_R114` | 金星 | 1800000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_6570000p0_太陽_R115` | 太陽 | 6570000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_7200000p0_天規石碑_R116` | 天規石碑 | 7200000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_28100000p0_木星_R117` | 木星 | 28100000 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_87654321p0_天堂_R118` | 天堂 | 87654321 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
| `P_87654321p0_天庭_Rjson` | 天庭 | 87654321 | 無同座標 temple 入口 | NOT_VERIFIED | NOT_VERIFIED |
