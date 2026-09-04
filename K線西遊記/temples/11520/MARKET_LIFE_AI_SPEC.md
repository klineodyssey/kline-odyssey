# 11520 KGEN / KAIOS 文明｜Market Life AI 市場生命規格

## Metadata
- VERSION: 1.1.0
- REVISION: 2026-09-04.2
- STATUS: ACTIVE / SOURCE_OF_TRUTH
- HUMAN_AUTHORITY: 沈英明
- PRODUCT_ID: KGEN_11520_UNIVERSAL_EXCHANGE
- PLACE_ID: 11520
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 文明核心
11520 的世界不是把金融市場貼在普通打怪遊戲上。KGEN / KAIOS 文明把市場本身表現為有生命、有記憶、有資本、有風險、有生存慾望、會學習與成長的 Market Life AI。

- KGEN：KX/KY/KZ 市場交易、持倉、本金/保證金、PnL 與市場資本的主要文明資產。
- KAIOS：XYZ 世界中的生命、生活、任務、戰鬥與世界活動價值；不得與 KGEN 交易本金混為同一帳。
- 市場怪物不是等待玩家扣 HP 的傻 NPC；怪物就是市場生命本身。
- 玩家與市場生命都以生存、收益、風險控制和成長為目標。AI 不被規定必須輸給玩家。

## 2. Market Life Identity
每一個市場生命至少具有：
- LIFE_ID
- species / form / name
- intelligence tier
- market-dimension capability
- capital / risk pool
- positions / exposure
- Life HP / vitality
- memory / learned state
- fear / survival pressure
- profit motive
- current strategy and confidence
- alive / wounded / retreating / dead / Naihe / rebirth state

生命資料與交易帳務必須可分開驗證。HP 不得直接冒充 KGEN balance，KGEN balance 也不得直接冒充 HP。

## 3. 小怪與大怪
### 3.1 小型 Market Life
低階生命可以只感知與操作單一市場，例如只在一個 KX/KY/KZ market 上生存。它可以觀察玩家在其市場的部位，決定順向、反向、觀望、減倉或撤退。

### 3.2 高階 Market Life
越聰明、越成熟、越大型的 AI 生命，可以跨更多市場維度感知與操作。其能力不是固定外觀數值，而是生命成長的一部分。

例如牛魔王級 Market Life 可以：
- 同時觀察玩家 KX/KY/KZ 多維曝險；
- 綜合不同市場的價格、方向、PnL、資本與風險；
- 將自己其他市場的可用部位/風險配置調度到與玩家相關的市場維度；
- 與玩家同向加成、共同順勢獲利；
- 與玩家反向對作；
- 跨市場對沖、誘導、撤退、重新配置；
- 在自己的生存機率惡化時優先保命，而不是固定攻擊。

禁止把高階 AI 寫成 `player long => monster short` 之類固定反向機器。

## 4. 感知與自主決策
Market Life AI 可在授權的遊戲/模擬資料邊界內感知：
- 玩家可公開/可用的 KX/KY/KZ position direction、lots、C、PnL、risk state；
- 自己的持倉、資本、HP、歷史結果與記憶；
- 其 intelligence tier 允許的市場價格與跨市場關聯。

每次決策至少要考慮：PROFIT、SURVIVAL、RISK、CAPITAL、VITALITY、MEMORY、MARKET STATE。決策輸出可包括 HOLD / FOLLOW / OPPOSE / HEDGE / REALLOCATE / REDUCE / RETREAT / REENTER。

AI 的目標是自己活下去並賺錢。它可以選擇不戰、逃跑、減倉或暫時與玩家同向；不得為了提供玩家獎勵而故意送死。

## 5. KX / KY / KZ 方向與生命關係
KX、KY、KZ 必須與玩家角色及 Market Life 的實際部位同步，不得只做 UI 標籤。

- `KX+ / KY+ / KZ+` = 該生命在對應軸作多。
- `KX- / KY- / KZ-` = 該生命在對應軸作空。
- 沒有持倉的軸 = `KX0 / KY0 / KZ0`。

### 5.1 同向 = 順作 / 同行
若玩家與某 Market Life 在同一個有效市場軸方向相同，例如雙方都是 `KX+`，則該軸關係為 `ALIGNED / FOLLOW / TRAVEL`，不是戰鬥。

產品語義：雙方在同方向市場旅行、一起承受同方向行情；可以表現成結伴、同行、牽手旅遊／渡蜜月等非敵對狀態。市場結果仍各自按自己的 lots、C、capital、PnL 結算，不得把兩個生命帳戶合併。

### 5.2 反向 = 對作 / 戰鬥
若玩家與 Market Life 在同一個有效市場軸方向相反，例如玩家 `KX+`、怪物 `KX-`，或玩家 `KX-`、怪物 `KX+`，則該軸關係為 `OPPOSED / COMBAT`。

這才構成該市場軸上的正式對作戰鬥。戰鬥結果由市場價格、lots、C、capital/risk 與生命規則決定，不是單純按攻擊鍵扣固定 HP。

### 5.3 多維關係
高階 Market Life 可同時在 KX/KY/KZ 多個軸持倉，因此玩家與怪物可以同時存在混合關係，例如：
- KX 同向、KY 反向、KZ 無部位；
- KX 反向戰鬥，但 KY 同向同行；
- 牛魔王可把其他軸部位 REALLOCATE 到正在與玩家對作或順作的市場。

UI 必須逐軸顯示 `+ / - / 0` 與 `ALIGNED / OPPOSED / NEUTRAL`，不能只用一個總體「敵人/朋友」標籤蓋掉多維狀態。

### 5.4 角色同步
玩家下單、加減倉、平倉、切換方向後，角色的 KX/KY/KZ 狀態必須立即同步。Market Life 每次自主決策後也必須同步它自己的 KX/KY/KZ 狀態。畫面、Market Life runtime、position/risk runtime 三者不得長時間不同步。

## 6. 市場戰鬥不是普通扣血
「打怪」的核心是玩家與 Market Life 在市場及 XYZ 世界中的生命對抗，不等於按攻擊鍵直接 `monster.hp -= n` 再增加玩家 KAIOS。

正式模型至少分開：
1. MARKET ACTION：雙方市場操作與持倉結果；
2. RELATION：逐軸判斷 ALIGNED / OPPOSED / NEUTRAL；
3. CAPITAL/RISK RESULT：KGEN 本金、PnL、風險池變化；
4. LIFE IMPACT：市場結果與世界事件如何影響生命 HP/vitality；
5. KAIOS RESULT：只有符合正式世界事件/擊殺/任務規則才產生 KAIOS；不得用 UI 動畫假造 reward。

現有簡單 HP/attack/8 秒 respawn 僅可作核爆場/測試 fallback，不能冒充完整 Market Life AI settlement。

## 7. 怕死、撤退與成長
所有 Market Life 都具有生存偏好。當風險、資本或生命狀態惡化時，AI 可以：
- 降低曝險；
- 改變市場；
- 對沖；
- 逃離玩家；
- 停止攻擊；
- 保存資本等待再入場。

活得越久、累積越多資本/經驗/記憶且 intelligence 成長的生命，可以逐步解鎖更多市場維度與更複雜策略，從小怪成長為大怪。成長必須有可追蹤 state/evidence，不能只靠外觀變大。

## 8. 奈何橋／孟婆湯生命循環
Market Life 真正死亡後，不是單純 JavaScript timer 將 HP 設回最大值。

生命循環：
ALIVE -> WOUNDED/RISK -> RETREAT_OR_FIGHT -> DEAD -> NAIHE -> MENGPO_RECOVERY -> REBIRTH -> REENTER_WORLD

- 死亡前 AI 應有保命行為；它不想死，也不想去奈何橋。
- 孟婆湯是死亡後恢復/重生生命循環的一部分。
- 重生後哪些記憶、資本、能力保留或清除，必須由後續正式規格定義；在定義前不得自行假設完全失憶或完全保留。
- 既有 8 秒 respawn 只屬測試時間參數，不等於完整孟婆湯正典。

## 9. 可交易／可飼養生命
魚、牛、鴨等生命不必全部是敵對怪物。可建立 TAMABLE / TRADABLE LIFE 類型，讓玩家依正式交易/所有權規則取得並帶回飼養。

可飼養生命仍有自己的 LIFE_ID、生命狀態與 AI，不因被玩家取得就降級成沒有生命的 inventory item。所有權、照護、繁殖、死亡、交易、KGEN/KAIOS 經濟關係另立規格；未定義前不得自行啟用真資產轉移。

## 10. 安全與真實交易邊界
- GitHub Pages/static frontend 不得冒充 persistent multiplayer backend。
- 未有正式 contract/ABI/chain/custody/receipt 驗證前，Market Life 的交易操作必須標示 simulation/off-chain 或 fail-closed。
- AI 不得在沒有玩家授權與正式 settlement 邊界的情況下動用玩家真實 KGEN、簽名或送鏈上交易。
- AI 感知玩家部位只使用產品明確允許的資料；不得聲稱讀到實際不存在或未授權的持倉。

## 11. Runtime architecture
正式實作應分器官，不把全部塞回 game-5d.html：
- market-life-identity runtime
- market-life-perception runtime
- market-life-decision runtime
- market-life-position/risk runtime
- market-life-relation runtime（逐軸 ALIGNED / OPPOSED / NEUTRAL）
- market-life-vitality runtime
- Naihe/Mengpo lifecycle runtime
- tamable-life runtime（若啟用）
- KAIOS reward boundary

每個器官需有 identity、input、output、state、persistence、error/failure state 與 deterministic test seam。

## 12. Regression locks
以下任一情況均屬 regression：
- 把怪物重新定義成只會追人、站著挨打的 NPC；
- 固定規定怪物永遠反玩家方向；
- KX/KY/KZ 的 `+/-/0` 與真實 position state 不同步；
- 同向部位被誤判成戰鬥；
- 反向部位被誤判成同行；
- 多維怪物只剩單一總體敵友狀態，丟失逐軸關係；
- 把 KGEN balance 直接當 HP；
- 玩家按一次攻擊鍵就無條件增加 KAIOS；
- 高階怪物宣稱跨市場但沒有獨立 market state/risk state；
- AI 沒有撤退/保命選項；
- 8 秒 timer 被宣稱為完整奈何橋/孟婆湯生命循環；
- AI 未經授權操作玩家真錢包或真交易；
- 刪除既有 KX/KY/KZ、XYZ、3D、錢包、地圖或其他正式器官來換取此功能。

## 13. Product principle
11520 的怪物文明不是「玩家必勝的提款機」。市場生命會觀察、學習、害怕死亡、追求利益、改變策略並成長；越聰明的 AI 生命能跨越越多 K-market 維度興風作浪。玩家面對的是另一個想活、想賺錢的生命，而不是等待被收割的數值。

同方向，是同行；反方向，才是對作戰鬥。