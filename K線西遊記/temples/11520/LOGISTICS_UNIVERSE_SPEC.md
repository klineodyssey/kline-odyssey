# 11520 倉儲物流宇宙｜Logistics Universe Spec

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-04.2
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

## 4. KX/KY/KZ = 物流／市場空間能力
KX、KY、KZ 同時表示 Market Life 可活動的 K-space 維度。每一軸可以有：
- `+`：往正方向／往上／多向任務。
- `-`：往負方向／往下／空向任務。
- `0`：沒有該軸任務或部位。

畫面必須同步顯示生命在哪些軸活動、方向、血量、資本、貨物、任務與目的地。

## 5. 物流生命決策
物流生命可以根據產品允許資料判斷：
- KAIOS 運鈔／貨運需求；
- 自己的資本、生命、載重與風險；
- KX/KY/KZ 的市場方向；
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