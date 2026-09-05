# 花果山台灣交易所｜11520 產品規格說明白皮書

## Metadata
- VERSION: 1.0.0
- REVISION: 2026-09-04.1
- STATUS: ACTIVE PRODUCT WHITEPAPER
- PRODUCT_ID: KGEN_11520_UNIVERSAL_EXCHANGE
- PLACE_ID: 11520
- HUMAN_AUTHORITY: 沈英明
- CANONICAL_DEPENDENCIES: `GAME_UI_SPEC.md`, `KGEN_TRADING_SPEC.md`, `VEHICLE_C_SPEC.md`, `MARKET_LIFE_AI_SPEC.md`, `LOGISTICS_UNIVERSE_SPEC.md`
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 0. 一句話產品
花果山台灣交易所 11520 是把市場、生命、3D 世界、KGEN 交易、KAIOS 文明、倉儲物流、ATM 配送與 Market Life AI 統一成同一個可玩的世界：市場不是背景數字，市場本身就是會賺錢、怕死、成長、組隊、戰鬥與送貨的生命。

## 1. 產品定位
11520 不是把交易面板貼在普通 RPG 上，也不是把怪物放在 K 線旁邊。正式產品以全螢幕 3D 世界為主：玩家、Market Life、Digital Ant、運鈔車、ATM 飛碟與其他生命在同一世界活動；KX/KY/KZ 的持倉、方向、物流任務與市場結算直接驅動角色關係、編隊、戰鬥與配送。

預設正式畫面只保留必要遊戲控制：角色/生命、怪物頭頂精簡 KX/KY/KZ + HP/資本/任務資訊、左下 XZ 圓形遙桿、右下核心攻擊/互動。錢包、K 市場、Y/C/口數、小地圖、ATM、聊天與詳細資料屬設定/抽屜層，需要時才展開。

## 2. KGEN / KAIOS 文明分工
### KGEN
KGEN 是市場交易與市場資本層：KX/KY/KZ 持倉、本金/保證金、lots、C、PnL、risk pool 與 Market Life 資本。

交易基本原則沿用正式 KGEN Trading Spec：下單口數對應本金/保證金；C 是損益放大尺度，不得因提高 C 而偷偷降低本金。真實公式與結算只由正式 trading runtime/settlement source 執行。

### KAIOS
KAIOS 是 XYZ 世界的生命、生活、任務、戰鬥、物流需求與世界活動價值。KAIOS 不得與 KGEN 交易本金混成同一帳。

## 3. XYZ 世界與角色控制
- X/Z：地面平面移動；左下圓形遙桿手指往哪，角色臉朝哪並往哪走；畫圈可連續旋轉。
- Y：高度。Y=0 是地面層；Y>0 進入遊戲內 AIRBORNE/空中層語義，可由具能力的飛行載具/寵物承載，形成空中/空間戰。
- 角色在螢幕內可移動；接近可視區極限後由世界/場景繼續移動，保持第三人稱探索感。
- 地圖、縮放、導航與自動到達是世界器官，不得用改 UI 的方式刪除既有能力。

## 4. Market Life AI：怪物就是市場本身
每一隻怪物都是 Market Life，不是等玩家扣血的 NPC。它至少有 LIFE_ID、智慧等級、K-space 能力、資本、持倉、生命值、記憶、恐懼、生存壓力、獲利動機與策略。

小怪可只操作單一市場；越聰明、越成熟的生命可跨越更多 KX/KY/KZ 市場維度。牛魔王級生命可以同時觀察多市場曝險，選擇 FOLLOW、OPPOSE、HEDGE、REALLOCATE、REDUCE、RETREAT 或 REENTER。禁止固定寫成「玩家做多，怪物一定做空」。

Market Life 不想死，也不應為了給玩家獎勵而故意送死。資本、生命或風險惡化時，它可以減倉、對沖、撤退、換市場、保存資本等待再入場。

## 5. KX / KY / KZ：市場方向也是生命空間能力
每個軸同時具有交易方向與 3D 可視語義：
- `KX+ / KY+ / KZ+`：該軸作多。
- `KX- / KY- / KZ-`：該軸作空。
- `KX0 / KY0 / KZ0`：該軸沒有有效部位/任務。

空間表現：
- KX+ 左→右；KX- 右→左。
- KY+ 下→上；KY- 上→下。
- KZ+ 近→遠；KZ- 遠→近。

這是 11520 的 K-space 視覺語義，不取代真實市場結算。

## 6. 同向同行，反向戰鬥
玩家與 Market Life 在同一軸同方向時為 ALIGNED：不是戰鬥，可以同行、編隊、護送、一起旅行。反方向時為 OPPOSED：角色進入對戰/攔截姿態，但市場尚未結算前不得由動畫自行宣布勝負。

例如玩家 KX+、Market Life KX-，雙方在 X 軸對戰；真正輸贏由價格、lots、C、capital/risk 與正式 settlement 判斷，再映射到受傷、擊退、撤退、破產、死亡或勝利動畫。

高階生命可同時有多維混合關係，例如 KX 同行、KY 對戰、KZ 中立。UI 必須逐軸表達，不能用單一「朋友/敵人」覆蓋。

## 7. KY 派單、Leader 與車隊
交易所大腦可以產生物流需求與派單，但「派單量」本身不直接等於 KY+；任務方向必須由目的地、route、market position 與正式規則決定。

當一批生命在 KY 軸同向且接受同一物流/護送契約時，可以形成 Formation：
- Leader 可以是玩家、運鈔車、Digital Ant 群體領隊或其他授權生命。
- Follower 依 Leader 的導航、速度與隊形移動。
- 同向但未加入同一契約的生命仍可能競爭運費/訂單，不能因同向就強制變朋友。
- 反向生命可成為攔截/對戰方；市場結算仍是勝負裁判。

## 8. 11520 倉儲物流中心
11520 同時是花果山台灣交易所的倉儲/物流中心。市場價格可映射為產品內宇宙層級，例如 0.0002524 位於 0.001~0.0001，可顯示地下第 4 層宇宙。

`0.00011520` 可作產品內倉儲錨點：目的數值高於錨點為 UP_ROUTE 語義，低於錨點為 DOWN_ROUTE，等於錨點為 HOLD_ROUTE。這只是遊戲路由/視覺語義，不是固定匯率或價格承諾。

## 9. Digital Ant：已知生命與物流勤務
Digital Ant 是既有已知生命物種，也是五指山悟空財神殿守門人。在 11520 增加物流勤務時，不取消原有生命身份。

Digital Ant 可以配送小額鈔票/貨物、ATM 補給、倉儲出貨/回庫與群體協同配送。任務至少包含 MISSION_ID、cargo、amount/unit、destination ATM、carrier LIFE_ID、route/universe level 與狀態。

物流狀態：CREATED → ASSIGNED → LOAD → IN_TRANSIT → DELIVERED；亦可 RETURN / RETREAT / FAILED。

## 10. ATM 配送與物流市場
目的 ATM 必須來自正式 ATM registry，以 ATM_ID + LIFE_ID + XYZ 定位。生命抵達 ATM 的 XYZ 交付範圍後，遊戲世界任務才可標記 DELIVERED。

物流生命不是免費工具。接單前應計算：

`預估收入 = 基礎運費 + 距離費 + 跨宇宙層費 + 載重費 + 風險費`

`預估成本 = 能源 + 路程 + 時間 + 載具/生命損耗 + 風險準備金`

若收入不足以覆蓋成本與最低利潤，生命可 REQUOTE（要求加運費）或拒單。正確流程應在裝貨前完成報價與接受，避免「先拿貨再因虧本拒送」。

可逐步形成 Freight Market：多個物流生命競價、搶單、拒單、撤退；高風險路線自然要求更高運費。

## 11. 捲款、違約與託管邊界
生命可以在遊戲劇情/AI 行為中產生違約或 ABSCOND_ATTEMPT，但正式資產系統不得允許司機任意捲走真實資產。真資產必須由 custody/escrow/receipt gate 控制：未取得目的 ATM 的有效交付憑證，不結算承運報酬或不可逆資產轉移。

遊戲可對違約行為產生信用下降、追蹤、守衛追捕、懸賞、保險理賠等世界事件。

## 12. 一圖一生命，一眼看懂
正式 3D 畫面中的每個生命至少可用頭頂 Life HUD 表現：
- 名稱/LIFE_ID（精簡）
- KX/KY/KZ + / - / 0
- HP/vitality
- KGEN capital/risk
- cargo/route/destination（物流中）
- strategy / ALIGNED / OPPOSED / RETREAT

HP=0 與 capital=0 必須分開：沒血是生命死亡條件；沒錢是市場資本耗盡/破產風險。死亡、奈何、孟婆恢復、重生也必須在畫面上可辨識。

## 13. 奈何橋與孟婆生命循環
Market Life 的完整循環：

ALIVE → WOUNDED/RISK → RETREAT_OR_FIGHT → DEAD → NAIHE → MENGPO_RECOVERY → REBIRTH → REENTER_WORLD

死亡前 AI 應有保命行為。既有 8 秒 respawn 只能作核爆場測試 fallback，不能冒充完整生命循環。

## 14. 108 原子運算引擎
11520 預留多空 108 原子運算引擎接口，作為未來 KX/KY/KZ 市場狀態、Market Life strategy 與 settlement lineage 的正式訊號來源之一。

在正式 108 原子名稱、輸入、公式、權重、8 軌域聚合與版本證據尚未接入前，必須 fail-closed；不得自行杜撰 108 原子並冒充正典。測試訊號必須標示 simulation/test。

## 15. 真實錢包與真實交易邊界
GitHub Pages 是靜態前端/核爆測試場。錢包可以逐步做到連線與唯讀餘額，但未有正式合約、ABI、chain config、授權、custody 與 receipt 驗證前：
- 不得冒充真實成交；
- 不得未經玩家簽名動用 KGEN；
- 不得把遊戲 DELIVERED 冒充鏈上轉帳完成；
- 不得保證盈利；
- 不得讓 Market Life AI 自行送不可逆交易。

## 16. 核心 Gameplay Loop
1. 玩家進入全螢幕 3D 世界。
2. 交易所大腦產生市場/物流需求。
3. 玩家與 Market Life 建立 KX/KY/KZ 持倉/任務方向。
4. 同向生命可組隊、同行、護送；反向生命進入市場對戰。
5. 物流生命評估運費、成本、風險，接受/加價/拒絕任務。
6. Leader 帶 Formation 前往指定 ATM/目的地；反向生命可攔截。
7. 市場持續變化，正式 settlement 計算各生命 PnL/risk。
8. 結果映射到 capital、vitality、動畫、撤退、死亡、配送或重生。
9. 玩家看到的是一個會自己運轉、會賺錢、會怕死、會改變關係的市場文明。

## 17. 產品器官架構
正式實作採器官化，不把全部塞進 `game-5d.html`：
- game/world shell
- 3D character + animation runtime
- KGEN trading/position/risk runtime
- Market Life identity/perception/decision runtime
- market relation + K-space visual runtime
- market settlement adapter
- logistics universe runtime
- Digital Ant logistics runtime
- Freight Market / quote runtime
- Formation / Leader-Follower runtime
- ATM registry + delivery runtime
- Naihe/Mengpo lifecycle runtime
- 108 atom adapter（canonical source required）
- wallet/contract/receipt boundary
- AI help/customer-service explanation layer

## 18. 開發優先序
### P0 可玩產品
- 全螢幕 Clean Play Mode 穩定化。
- Y 能階/高度與角色狀態同步。
- Market Life 3D 資產取代紅色石頭 fallback。
- KX/KY/KZ 頭頂 HUD 與方向動畫。
- Formation / Leader-Follower。
- Freight quote：運費不足可 REQUOTE/拒單。
- Digital Ant 實際在 3D 世界移動到指定 ATM。
- 市場 settlement 驅動對戰結果，不由攻擊按鈕自行決勝。

### P1 文明深化
- ATM 多站點 registry。
- 多生命競價物流市場。
- 牛魔王級跨維 Market Life。
- 奈何/Mengpo 完整生命循環。
- 可飼養/可交易生命。
- 空中/空間載具與 Y>0 戰鬥。

### P2 正式經濟接線
- canonical 108 atom engine。
- verified wallet balance / contract ABI / chain config。
- receipt-gated settlement。
- persistent multiplayer/backend。
- 可審計生命記憶與長期成長。

## 19. 驗收原則
產品不得以「按鈕存在」宣稱功能完成。每個功能至少要做到：可操作、狀態有回饋、錯誤可見、資料來源清楚、測試可重現、版本可追蹤。

不得為加入新功能刪除既有正式器官。正式檔名不帶版本，版本寫在檔案 Metadata/CHANGELOG/Git commit。

## 20. 產品願景
花果山台灣交易所的核心不是讓玩家面對一堆表格，而是讓市場文明變成可看、可走、可戰、可護送、可交易、可成長的生命世界。

市場生命會觀察、學習、賺錢、害怕死亡；物流生命會算運費、拒絕虧本訂單、競價與護送；玩家可以成為 Leader，也可以跟著生命隊伍旅行。KX/KY/KZ 的市場方向直接成為空間關係與角色動畫，市場本身就是遊戲世界的生命與劇情來源。
