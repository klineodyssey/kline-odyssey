# 11520 倉儲物流宇宙｜Logistics Universe Spec

## Metadata
- VERSION: 1.4.0
- REVISION: 2026-10-03.3
- STATUS: ACTIVE / PRODUCT CONCEPT
- PLACE_ID: 11520
- RELATION: MARKET_LIFE_AI_SPEC.md

## 1. 產品定位
11520 除了是 Market Life 的市場世界，也是花果山台灣交易所的倉儲／物流中心。Digital Ant、自動物流生命、行動 ATM 飛碟、可馴養送貨生命都可以成為物流載體。它們不是無生命 icon，而是具有 LIFE_ID、資本、生命、風險、任務與市場方向的生命。

## 1.1 Digital Ant 正典角色
Digital Ant 是既有已知生命物種，不得在 11520 重新發明成另一物種。其既有角色包含五指山悟空財神殿守門人；在 11520 可增加物流勤務角色，但不取消既有生命身份與職能。

在 11520 中，Digital Ant 可被派作：
- 小額鈔票／貨物配送；
- ATM 補給；
- 倉儲出貨／回庫；
- 多個 Digital Ant 分散式協同配送；
- 依生命、資本、需求與路線風險自主決定 WAIT / LOAD / UP_ROUTE / DOWN_ROUTE / REROUTE / RETURN / RETREAT。

## 1.2 玩家住家鈔票／貨物外送
正式服務狀態機：

`PLAYER_REQUEST -> CFO_QUOTE -> ASSIGNED -> LOAD -> ASCEND -> CRUISE_5D -> DESCEND -> ARRIVED_AWAITING_RECEIPT -> PLAYER_ACCEPTANCE -> DELIVERED`

- `PLAYER_REQUEST` 必須包含 requester Life ID、既有 home plot、home XYZ、貨物種類與數量。
- 到府服務可配送 `CASH` 或 `GOODS`；貨物始終是受限庫存及相應負債，不是 Digital Ant 或公司的營收。
- 玩家只支付經 CFO 報價的運費。員工薪資是運費成本的一部分，必須在到家、正確收貨人驗收與收據成立後才入帳。
- 正確收貨條件是 requester Life ID 一致且玩家位於 home acceptance range；他人、遠端按鍵或單純抵達均不得完成交割。
- 現階段 payment、receipt、salary 與 accounting 都是明示的本機遊戲模擬；不得冒充鏈上 KAIOS 轉帳或真實收入。

## 1.3 Player Courier 背景運鈔任務

既有 Digital Ant 物流提供兩種相容載體，兩者共享同一套貨物、風險、保險及會計規則：

- `DIGITAL_ANT_DELIVERY`：既有 `ATM_UFO_5D` 自主配送。
- `PLAYER_COURIER`：玩家明確接單後，單一 canonical cargo 綁定該玩家的 Life ID，配送倒數在背景持續。

Player Courier 不會鎖定玩家的移動、戰鬥、探索、回家或一般 HUD。時間由 `startedAt`／`dueAt` 的 canonical runtime timestamp 計算；`setInterval` 只刷新顯示，不是時間權威。重新整理或頁面背景恢復時必須讀取持久 mission journal，以原 `missionId`、`cargoId` 和 `dueAt` 繼續，不能重設倒數。

貨物所有權只有一個狀態：`OWNED_BY_COURIER`、`LOOT_CRATE` 或已完成／失敗的終局 custody。一般怪物攻擊只能增加風險或降低 durability，不能直接搶貨；只有不同 Life ID 明確進入 `BANDIT_MODE` 並發出合格 `CARGO_RAID_ACTION`，通過攻擊窗、冷卻與勝負結算後，才能使任務成為 `ROBBED`。同一 mission 只能終結為 `DELIVERED`、`ROBBED` 或 `FAILED` 一次；薪資、運費、保險理賠及 loot receipt 均採 one-shot 防重播。

目前所有 cargo、salary、freight、insurance 和 loot 都是本機遊戲帳務。貨物本金不是收入；只有 `DELIVERED` receipt 成立後，玩家才取得約定的 courier salary 與 freight share，公司才認列 company net。搶劫不 mint、不 burn、不轉移任何 Mainnet KGEN／KAIOS，也不代表實體物流已發生。

## 2. 價格 = 宇宙層級
市場價格可映射到 K-space 的十進位宇宙層級。對正數價格 p：

`level = floor(log10(p))`

產品顯示用地下層級：若 `0 < p < 1`，以 `abs(floor(log10(p)))` 顯示地下第 N 層。

例如 `0.0002524` 位於 `0.001 ~ 0.0001` 區間，顯示「地下第 4 層宇宙」。

此層級是 11520 遊戲／物流可視化，不改變鏈上 token decimals，也不是現實物理高度。

## 3. 11520 倉儲錨點
11520 可使用 `0.00011520` 作為產品內的倉儲參考錨點（anchor），只作路由／視覺語義。它不是市場價格保證、估值承諾或固定匯率。

相對於錨點：
- 目的地數值高於錨點：UP_ROUTE / 往上派貨 / 多向物流語義。
- 目的地數值低於錨點：DOWN_ROUTE / 往下派貨 / 空向物流語義。
- 相同：HOLD_ROUTE / 同層待命。

例：
- `0.00016888 > 0.00011520` → 往上派。
- `0.000108000 < 0.00011520` → 往下派。

## 4. KX/KY/KZ = 運鈔避險委託軸
KX、KY、KZ 是 Digital Ant 針對貨物、運費、燃料與行程成本曝險的市場避險委託軸，不是物理運輸路線。每軸可以有 `LONG / SHORT / FLAT`，且必須分別保存 market、side、lots、C、collateral、authorization 與 settlement evidence。

物理運鈔只用 XYZ 移動。KX/KY/KZ 不得由目的地座標自動下單；沒有可驗證成本曝險、獨立擔保品與授權時，必須保持 `FLAT / NOT_PLACED`。

畫面必須分開顯示 XYZ 運鈔移動、多空對戰方向，以及 KX/KY/KZ 避險委託與部位，不得合併成同一個狀態。

### 4.1 Digital Ant 路線運算與 C 校準

本節是 11520 遊戲物流校準，不自動創建鏈上交易或真實市場委託。

對實際移動 `origin(x0,y0,z0) -> destination(x1,y1,z1)`：

- `ΔXYZ = (x1-x0, y1-y0, z1-z0)`
- `distance_K = sqrt(Δx² + Δy² + Δz²)`
- `1 K-index = 22.761724301279... km`
- `speed_K_per_second = abs(C) × 0.001`
- `ETA_seconds = distance_K / speed_K_per_second`
- `velocity_XYZ = normalize(ΔXYZ) × speed_K_per_second`

`C` 的正負是運鈔移動中的多空對戰側：`C > 0 = LONG`、`C < 0 = SHORT`、`C = 0 = NO_BATTLE_ORDER`。實際移動的方向由起點與終點的 XYZ 向量決定；負 C 不會把送貨路徑倒放。

三軸移動對戰語義分別計算：`Δx > 0 = X LONG`、`Δx < 0 = X SHORT`，Y/Z 同理。這些是運鈔生命在遊戲中的多空移動方向，不是 KX/KY/KZ 避險委託的已下單證明。

玩家與運鈔生命的 XYZ 移動同向時為同行／護送；同一物理軸反向時才進入多空對戰。對戰可以改變遊戲的路線、護送或撤退狀態，但不得劫走受限貨物本金或代替真實 settlement。

貨物刻度：`1 口 = 1 KGEN = 1 index unit = 1000 KAIOS`，其對應 K-index 距離刻度為 `22.761724301279... km`。對角線距離不會增加口數；1 口貨物走三軸仍然是 1 口，不是 3 口。

`C = 0` 時可保留本地步行，但在未另有步行速率證據時，不得用上述 C 公式偽造 ETA。

### 4.2 ATM UFO 5D 運鈔飛行

Digital Ant 使用 `ATM_UFO_5D` 運鈔時，不可在 XZ 平面上滑到目的地。每張路線必須有：

1. `ASCEND`：由當前 XYZ 升到安全巡航 Y。
2. `CRUISE_5D`：在 X/Y/Z 三軸中前往目的宇宙座標。
3. `DESCEND`：降至正式 ATM 空間錨點。
4. `LANDED_AWAITING_RECEIPT`：只表示抵達；收貨 receipt 未驗證前不得認列交付或收入。

飛碟是 DIGITAL_ANT_0001 的 Vehicle/Equipment，不自動產生新 Life ID。原生 3D 外觀必須同時顯示飛碟、運鈔金庫與貨物 custody；載具外觀不代表鏈上資產已交付。

## 5. 物流生命決策
物流生命可以根據產品允許資料判斷：
- KAIOS 運鈔／貨運需求；
- 自己的資本、生命、載重與風險；
- XYZ 運鈔移動的多空對戰方向；
- KX/KY/KZ 避險曝險與是否已獲授權；
- 目的地與倉儲錨點；
- 當前市場價格與預期路線風險。

可輸出：WAIT / LOAD / UP_ROUTE / DOWN_ROUTE / REROUTE / RETURN / RETREAT。

方向本身不保證盈利。真正 PnL 只能由實際市場價格變化、lots、C、position/risk runtime 計算；UI 或 AI 不得自行宣告「往上必賺」或「往下必賺」。

## 6. Digital Ant / ATM UFO
- Digital Ant：已知生命物種；同時可作五指山悟空財神殿守門人與 11520 倉儲物流生命。適合大量小單、分散式自動物流、群體協作。
- 行動 ATM 飛碟：適合 KGEN/KAIOS 資產服務、跨層運送與空中/空間路線。
- 牛魔王等高階 Market Life：可成為跨多維市場的大型物流／戰鬥生命，但仍需遵守自己的資本、生命與風險限制。

## 6.1 指定 ATM 配送任務
花果山台灣交易所必須支援「貨物／鈔票 -> 指定 ATM」的可追蹤任務。

每個任務至少包含：
- MISSION_ID
- CARGO_KIND（例如 CASH / GOODS）
- AMOUNT / UNIT（例如 KAIOS / KGEN；實際真資產需另有 settlement 授權）
- DESTINATION_ATM_ID
- carrier LIFE_ID
- route / universe level
- CREATED / ASSIGNED / LOAD / IN_TRANSIT / DELIVERED / RETURN / RETREAT / FAILED 狀態

ATM 不是只用文字名稱指定；必須由 ATM registry 中的正式 `ATM_ID + LIFE_ID + XYZ` 定位。Digital Ant 抵達 ATM 的 XYZ 範圍後，前端模擬任務才可標記 `DELIVERED`。

目前正式世界已有 `ATM-11520-001 / LIFE-ATM-11520-001 / 行動 ATM 飛碟站`，可作第一個核爆場配送目的地。新增 ATM 時必須進同一 registry，不得在 UI 另外硬編一份名單。

## 6.2 XYZ 攔截戰與 Cargo Risk Desk

運鈔不是無敵動畫。玩家可在任務 `IN_TRANSIT` 時以自己的 XYZ 位置與近期移動向量接近 Digital Ant；至少一個物理軸與飛碟反向，且距離、能量、Life ID、replay key 全部通過，才可發動土匪攔截。每次攔截形成 append-only incident evidence，結果可以是 `ROBBERY_REPELLED`、`ROBBERY_SUCCESS_LOCAL_REWARD` 或 fail-closed rejection。

Restricted inventory 的鏈上本金與 browser gameplay 分離。成功攔截可消耗任務預先聲明的 `LOCAL_GAME_RISK_POOL` 並產生本機 KAIOS reward/claimable 候選；不得由前端直接扣除真實 wallet balance、轉移 custody，或把未出資 reward 冒充收入。

AI Ant Company 既有公司架構內設 `CARGO_RISK_DESK`，不建立第二家公司。Cargo insurance 使用整數 KAIOS 與 basis points 計算，至少包含 coverage、deductible、theft/natural-disaster/damage/interruption expected loss、claim operations、capital charge 與 margin。Reserve 不足時狀態只能是 `BROKERAGE_QUOTE_ONLY`；只有獨立的 local-simulation reserve 或未來可驗證正式 reserve 才能承保。Cargo principal、客戶資產與受限制庫存永遠不能當 reserve。

保險事故與玩家戰利品分帳：玩家 reward 來自 game risk pool；保險 claim 只補償 carrier/insured 的 verified incident loss。真實保費、理賠與鏈上貨物仍需獨立 signer/receipt/settlement authority。

### 6.3 KAIOS 質量導彈與飛碟墜落（遊戲模擬）

「導彈攔截」必須是主遊戲 HUD 的可見動作，不能藏在 ATM 長表單底部。但這個動作只是 11520 local game simulation，不授權真實武器、鏈上 KAIOS 支出、真實貨物轉移或 Mainnet write。

彈體質量依 CURRENT 使用 `1 KAIOS = 1 kg`。玩家需用可驗證的本機 KAIOS 遊戲進度支付彈體，且只能在任務 `IN_TRANSIT`、距離小於導彈範圍、attacker Life ID 不同、signed C 與飛碟反向、replay key 未使用時發射。

衝擊物理分為：

- 低相對速度：`E_kinetic = 1/2 × m × v_relative²`。
- 相對論速度：`E_kinetic = (γ - 1) × m × c²`。
- 大氣航程損耗：`F_drag = 1/2 × ρ × Cd × A × v²`，`W_drag = F_drag × distance`。
- 有效撞擊能量：`E_impact = max(0, E_kinetic - W_drag)`。

空氣阻力是航程損耗，不是撞擊傷害的替代公式。Runtime 使用公開的 gameplay normalization 把 joule 投影到飛碟 `0..100 operational energy`；此 normalization 是遊戲平衡，不是對真實材料或核武器的工程主張。

當 `operational energy = 0`，飛碟只是推進離線，停止原路線後沿 Y 軸墜落到地面。這不是 `E = 0 = mc²`，質量不會消失。只有墜落完成後才可產生 `UFO_CRASHED_LOCAL_LOOT`，且戰利品只能包含任務先前宣告的 local risk-pool KAIOS 以及明確標記為本機遊戲物品的 KUFO 碎晶、KSHIP 飯物質能燃料與 ATM UFO 製造科技碎片。Restricted cargo principal 與 chain balance 不改變。

## 7. 一圖一目了然
正式遊戲畫面以 3D 世界為主。怪物／物流生命頭頂可顯示：
- LIFE_ID/名稱（精簡）
- KX/KY/KZ + / - / 0
- HP
- KGEN capital / risk
- cargo / demand（若啟用）
- route：UP / DOWN / HOLD
- destination ATM（配送中）

詳細 K 市場、錢包、小地圖、Y/C/口數與設定放到設定層，不長期遮住 3D 世界。

## 8. 安全邊界
GitHub Pages 版本目前只能做前端／模擬／唯讀資料整合；若沒有正式後端、合約、授權與 receipt 驗證，不得宣稱真的搬運資產、送出交易、保證盈利或完成不可逆資產結算。

因此現階段 `DELIVERED` 表示遊戲世界內的物流任務完成；不代表鏈上 KGEN/KAIOS 已真的轉移到 ATM。真資產配送必須另外通過 wallet/contract/receipt settlement gate。
