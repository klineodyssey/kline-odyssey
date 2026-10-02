# 11520 倉儲物流宇宙｜Logistics Universe Spec

## Metadata
- VERSION: 1.2.0
- REVISION: 2026-10-03.1
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
