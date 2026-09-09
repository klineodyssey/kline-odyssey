# 花果山台灣交易所｜11520 產品規格說明白皮書

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-08.1
- STATUS: ACTIVE PRODUCT WHITEPAPER
- PRODUCT_ID: KGEN_11520_UNIVERSAL_EXCHANGE
- PLACE_ID: 11520
- HUMAN_AUTHORITY: 沈英明
- CANONICAL_DEPENDENCIES: `GAME_UI_SPEC.md`, `KGEN_TRADING_SPEC.md`, `VEHICLE_C_SPEC.md`, `MARKET_LIFE_AI_SPEC.md`, `LOGISTICS_UNIVERSE_SPEC.md`, canonical KGEN Universe Physics Runtime
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.
- PHYSICS_RULE: formulas/constants already defined by canonical physics documents MUST be read and reused; do not ask Human to repeat a definition that exists in-repository.

## 0. 一句話產品
花果山台灣交易所 11520 是把市場、生命、3D 世界、KGEN 交易、KAIOS 文明、倉儲物流、ATM 配送與 Market Life AI 統一成同一個可玩的世界：市場不是背景數字，市場本身就是會賺錢、怕死、成長、組隊、戰鬥與送貨的生命。

## 1. 產品定位
11520 不是把交易面板貼在普通 RPG 上，也不是把怪物放在 K 線旁邊。正式產品以全螢幕 3D 世界為主：玩家、Market Life、Digital Ant、運鈔車、ATM 飛碟與其他生命在同一世界活動；KX/KY/KZ 的持倉、方向、物流任務與市場結算直接驅動角色關係、編隊、戰鬥與配送。

## 2. KGEN / KAIOS 文明分工
### KGEN
KGEN 是市場交易與市場資本層：KX/KY/KZ 持倉、本金/保證金、lots、C、PnL、risk pool 與 Market Life 資本。既有 Physics Runtime 對 KGEN 的質量/指數等單位定義必須依 canonical CURRENT lineage 使用，不得由 11520 自行改寫。

### KAIOS
KAIOS 是 XYZ 世界的生命、生活、任務、戰鬥、物流需求與世界活動價值。KAIOS 不得與 KGEN 交易本金混成同一帳。

## 3. XYZ 三維世界、三操作平面與六方向
世界保留完整 X/Y/Z 三維座標，不因地面或 UI 模式限制座標值。

正式控制：
- XZ 操作面：圓盤控制 X/Z，右縱桿控制 Y；法向作功市場為 KY。
- XY 操作面：圓盤控制 X/Y，右縱桿控制 Z；法向作功市場為 KZ。
- YZ 操作面：圓盤控制 Y/Z，右縱桿控制 X；法向作功市場為 KX。
- 三個基本空間維度形成六個方向：+X/-X、+Y/-Y、+Z/-Z。
- 碰撞可以阻止角色實體穿過地面/物件，但不得藉此把 intent XYZ 數值硬鎖死；未來太空世界仍沿用同一座標系。

## 4. K 球膜、法向量與三軸行情
K 不是質量；K 是 Sphere Membrane Layer（球膜宇宙層）。KX/KY/KZ 是同一個 3D/5D 市場宇宙中的三個球膜法向市場，不是三個互相隔離的遊戲頁。

只有當前操作平面的法向量作功：
- XZ 平面 → 法向 Y → KY 作功。
- XY 平面 → 法向 Z → KZ 作功。
- YZ 平面 → 法向 X → KX 作功。

上方 KX/KY/KZ 三軸行情應同時存在；切換左下操作圖只切換操控/觀察平面，並高亮對應法向作功軸，不應偷偷改變持倉或關閉其他市場。

## 5. 價格就是 K 球膜位置；小數不得任意放大
市場報價的完整小數值可直接作 K 球膜位置。例如：
- `0.00012345` → `K=0.00012345`
- `0.00011520` → `K=0.00011520`
- `0.0002524` → `K=0.0002524`

不得在沒有明示單位轉換的情況下，把 `0.00012345` 偷換成 `K12345`。

線性宇宙距離使用 canonical Physics Runtime 的地月錨點：

```text
16888 K-index = 384400 km
1 K-index ≈ 22.761724 km
D_linear = |K_destination - K_origin| × 22.761724 km
```

例一：

```text
0.00012345 → 0.00011520
ΔK = 0.00000825
D ≈ 0.00000825 × 22.761724 km
  ≈ 0.187784 m
  ≈ 18.7784 cm
```

例二：

```text
0.0002524 → 0.0002888
ΔK = 0.0000364
D ≈ 0.828527 m
  ≈ 82.8527 cm
```

這使真實 K 線價格變化可以映射成可走、可飛、可護送、可攔截的世界距離。

## 6. C、速度與到達 K 層
K、M、C 必須分離：
- K = 球膜宇宙位置/層。
- M = KGEN 質量、生命承受力/血量/油量/本金等 canonical 對應。
- C = 到達/穿透 K 層的曲速倍率與既有交易尺度。

canonical Physics Runtime 已定義：

```text
c_earth ≈ 3×10^8 m/s
光速 1 秒 ≈ 13180 K-index
C_required = K_target / 13180
```

運輸 ETA、速度、能耗等若已有更精確 canonical 公式，Runtime 必須讀取該公式，不得由本白皮書另造互相衝突的常數。

## 7. Market Life：怪物是有生命的市場參與者
每一隻怪物都是 Market Life，不是等玩家扣血的 NPC。它至少有 LIFE_ID、智慧等級、K-space 能力、資本、持倉、生命值、記憶、生存壓力與策略。

生命具有七情六慾與求生本能。它會害怕死亡、會貪利、會憤怒、會依戀、會逃跑，也可能因個性/利益選擇冒險。高恐懼、低生命、強威脅時可以 RETREAT；健康、憤怒或競爭動機強時可以 OPPOSE；獲利動機強時可 FOLLOW 有利行情。禁止把所有怪物寫成永遠死戰的固定 NPC。

牛魔王級生命可同時觀察多市場曝險，選擇 FOLLOW、OPPOSE、HEDGE、REALLOCATE、REDUCE、RETREAT、REENTER。

## 8. 同向同行、反向對戰
玩家與 Market Life 在同一軸同方向時為 ALIGNED，可同行、編隊、護送；反方向時為 OPPOSED，可進入攔截/攻擊/市場對戰。

動畫本身不得宣布金融勝負。真正市場結果應由價格、lots、C、capital/risk 與正式 settlement 決定，再映射成受傷、擊退、撤退、破產、死亡或勝利。

高階生命可同時出現 KX 同行、KY 對戰、KZ 中立等混合關係。

## 9. 11520 倉儲物流與所有 K 點位
`0.00011520` 是 11520 世界可用的倉儲/交易所錨點，但物流系統不得只支援固定兩站。任何經 registry/世界資料承認的 K 球膜點位都可成為 origin/destination，例如 `0.00012345`、`0.00011520`、`0.00018888` 等。

每一筆物流任務至少包含：
- MISSION_ID
- cargo type（KGEN/KAIOS/遊戲內貨物）
- cargo amount/unit
- origin K/XYZ
- destination K/XYZ
- departure time
- target/estimated arrival time
- carrier LIFE_ID
- vehicle ID/type
- route direction
- distance
- speed/C
- energy/fuel estimate
- salary estimate
- maintenance estimate
- time cost
- risk/robbery estimate
- freight quote
- tip mode
- expected value / expected profit
- status

## 10. Digital Ant = CEO + CFO 的自主物流決策生命
Digital Ant 不只是接到任務就必送的搬運 NPC。作為物流決策生命，它必須像 CEO + CFO 一樣先算經濟帳，再決定：

```text
LONG_DELIVER
SHORT_REVERSE_DELIVER
HOLD / NO_DELIVERY
REQUOTE
RETREAT / RETURN
```

三維空間有六個基本方向，但不保證每個時刻一定有可盈利方向。若六方向扣除成本/風險後都沒有足夠正期望值，正確決策是 HOLD/NO_DELIVERY，而不是強迫出車。

方向候選可使用：

```text
EV(direction)
= marketEdge
+ freightIncome
+ shortagePremium
+ eligibleTip
- fuelEnergyCost
- salaryCost
- maintenanceCost
- timeCost
- robberyCombatRisk
- otherCanonicalCosts
```

只有最佳 EV 超過正式最低安全/利潤門檻才出車。若反方向 EV 更高，可以反向運輸。

## 11. 運費、薪水與多空小費
純送貨與市場方向押注必須分帳。

### 純送貨 / 觀望
承運者只取得正式運費/薪資等物流收入，不因市場方向取得多空小費：

```text
TIP = 0
```

### 做多送貨 / 做空送貨
若生命選擇承擔市場方向風險，且符合正式 settlement/小費規則，才可取得方向小費。小費不是保證收益，也不得在市場尚未結算前憑動畫製造。

```text
TotalExpectedRevenue
= freight
+ shortagePremium
+ eligibleMarketTip

TotalExpectedCost
= fuel/energy
+ salary
+ maintenance
+ time
+ risk reserve
+ other canonical costs

ExpectedProfit = TotalExpectedRevenue - TotalExpectedCost
```

若小費公式、薪資係數、燃料係數已有 repository canonical source，必須引用該 source；若尚未定義，標記 `CANONICAL_INPUT_REQUIRED`，不得偷偷杜撰。

## 12. ATM、飛碟、運鈔車與自然出現
ATM 飛碟、運鈔車、護送生命與怪物不是固定時間硬刷。它們應由市場/物流需求、缺貨程度、EV、生命狀態與世界事件自然產生。

目的 ATM 必須來自正式 ATM registry，以 ATM_ID + LIFE_ID + XYZ/K 定位。生命抵達交付範圍並取得有效交付證據後，任務才可標記 DELIVERED。

物流狀態：

```text
CREATED → QUOTED → ASSIGNED → LOAD → IN_TRANSIT → DELIVERED
                                      ↘ RETURN / RETREAT / FAILED
```

## 13. 強盜、護送與戰鬥
路途中可以遇到強盜/敵對 Market Life。風險應進入報價與出車決策，而不是出車後才假裝沒有成本。

同向生命可形成 Formation/護送；反向生命可以攔截。玩家若與牛魔王/怪物的市場方向相反，可以形成 OPPOSED 並進入攻擊對戰；若同向則可能同行、競爭同一訂單或互不侵犯，不因同向強制成朋友。

## 14. 死亡、奈何橋、孟婆與暗物質重生
Market Life 是有生命的，所以死亡前必須有保命決策。

```text
ALIVE
→ WOUNDED / LOSS / RISK
→ RETREAT_OR_FIGHT
→ DEAD
→ NAIHE
→ MENGPO_RECOVERY
→ REBIRTH
→ REENTER_WORLD
```

怪物若因長期跑錯方向、資本/生命耗盡、戰鬥失敗等死亡，可以進入奈何橋/孟婆生命循環。孟婆恢復可降低上一生命週期的戰鬥怒氣/悲傷等狀態。

BNB 暗物質若作為重生能量，現階段只能依既有生命/暗物質 canonical 邊界表達；不得由遊戲 AI 自動送 BNB Mainnet 交易、付款或 Treasury 動作。

## 15. 108 原子運算引擎
11520 預留多空 108 原子運算引擎接口，作為未來 KX/KY/KZ 市場狀態、Market Life strategy、物流 EV 與 settlement lineage 的正式訊號來源之一。

在正式 108 原子名稱、輸入、公式、權重、8 軌域聚合與版本證據尚未接入前，必須 fail-closed；不得自行杜撰 108 原子並冒充正典。測試訊號必須標示 simulation/test。

## 16. 真實資產、託管與鏈上安全邊界
生命可以在遊戲劇情/AI 行為中產生違約、搶劫或 ABSCOND_ATTEMPT，但正式資產系統不得允許司機任意捲走真實資產。

未有正式合約、ABI、chain config、授權、custody/escrow 與 receipt 驗證前：
- 不得冒充真實成交；
- 不得未經玩家簽名動用 KGEN/KAIOS；
- 不得把遊戲 DELIVERED 冒充鏈上轉帳完成；
- 不得保證盈利；
- 不得讓 Market Life/Digital Ant AI 自行送不可逆 Mainnet 交易；
- 不得自行 TOKEN_TRANSFER、PAYMENT、TREASURY_ACTION、GOVERNANCE_CHANGE、SECRET_EXPORT 或 PRIVATE_KEY_EXPOSURE。

## 17. 一圖一生命，一眼看懂
正式 3D 畫面中的生命至少可依需要顯示：
- 名稱/LIFE_ID（精簡）
- KX/KY/KZ + / - / 0
- HP/vitality
- KGEN capital/risk
- cargo/route/destination
- strategy / ALIGNED / OPPOSED / RETREAT
- 當前情緒/求生狀態（需要時）

HP=0 與 capital=0 必須分開：沒血是生命死亡；沒錢是市場資本耗盡/破產風險。

## 18. 核心 Gameplay Loop
1. 玩家進入全螢幕 3D/5D 世界。
2. 三軸 K 球膜行情持續存在，操作平面決定當下法向作功軸。
3. 世界/ATM/市場產生真實遊戲內物流需求。
4. Digital Ant/其他生命計算六方向距離、成本、風險與 EV。
5. 生命選擇做多運、做空反向運、純送貨觀望、加價、拒單或等待。
6. 車輛/飛碟自然出發；時間、速度、距離、能量、成本可被追蹤。
7. 同向生命可能護送/同行；反向生命可能攔截/戰鬥。
8. 正式 settlement 決定市場結果；世界把結果映射到資本、生命、情緒、撤退與死亡。
9. 死亡生命進奈何/孟婆/重生循環。
10. 玩家看到的是一個會自行算帳、怕死、運貨、搶貨、戰鬥與重生的市場文明。

## 19. 產品器官架構
正式實作採器官化，不把全部塞進 `game-5d.html`：
- game/world shell
- 3D character + animation runtime
- three-plane controller + normal-market presentation runtime
- KGEN trading/position/risk runtime
- K-sphere distance/physics adapter
- Market Life identity/perception/psyche/decision runtime
- market relation + K-space visual runtime
- market settlement adapter
- logistics universe runtime
- Digital Ant logistics CEO/CFO runtime
- six-direction route/EV runtime
- Freight Market / quote runtime
- Formation / Leader-Follower runtime
- ATM registry + delivery runtime
- vehicle energy/fuel/maintenance runtime
- Naihe/Mengpo lifecycle runtime
- 108 atom adapter（canonical source required）
- wallet/contract/receipt boundary
- AI help/customer-service explanation layer

## 20. 尚未可自行杜撰的 Canonical Inputs
以下若 repository 已有正式文件/公式，實作者必須自行搜尋、讀取並引用，不應要求 Human 重複；只有確認 canonical source 不存在或互相衝突時才回報 Human：

- 精確速度/C→實際速度函數（若超出目前 Physics Runtime 定義）。
- 載具/貨物能耗與燃料係數。
- KGEN/KAIOS 貨物的 canonical 質量/載重換算，尤其不得混用已被 supersede 的舊尺度。
- 運鈔員/物流生命薪資公式。
- 多空小費正式 settlement 公式。
- 維修/折舊公式。
- 強盜/路段危險率、保險/風險準備金公式。
- 各 ATM/倉儲/文明點位正式 registry。

若找到多份互相矛盾文件，優先依 CURRENT/verified lineage/Boot 規則處理並標記衝突，不得靜默選舊稿。

## 21. 開發與 QA 原則
11520 是 live game/product surface，不是靜態 mockup。所有 UI/遊戲工作必須遵守 `AGENTS.md`：真 browser runtime、至少 390x844 mobile QA、runtime screenshot 與人工 visual inspection。

```text
FUNCTIONAL_PASS + VISUAL_FAIL = NOT_COMPLETE
```

不得為加入新功能刪除既有正式器官。正式檔名不帶版本號，版本寫在 Metadata/CHANGELOG/Git commit。

## 22. 產品願景
花果山台灣交易所的核心不是讓玩家面對一堆表格，而是讓市場文明變成可看、可走、可飛、可戰、可護送、可交易、可成長的生命世界。

價格本身就是 K 球膜位置；K 線變化可以成為可計算的空間距離。Digital Ant 不是死板派車器，而是會算六方向盈虧的 CEO+CFO 生命；牛魔王與怪物也不是送死 NPC，而是有七情六慾、會怕死、會追求利益、會撤退與重生的 Market Life。

市場、物理、物流、生命與戰鬥必須由同一組可追溯 canonical 規則連成一個世界。