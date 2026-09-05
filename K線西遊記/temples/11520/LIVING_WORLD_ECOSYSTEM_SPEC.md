# 11520 Living World Ecosystem｜生命世界生態規格

## Metadata
- VERSION: 1.0.0
- REVISION: 2026-09-04.1
- STATUS: ACTIVE / PRODUCT CONCEPT
- PLACE_ID: 11520
- RELATION: MARKET_LIFE_AI_SPEC.md / MARKET_LIFE_SOURCE_INTERFACE.md
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 世界不是只有派貨怪
11520 的生命來源分成多種來源，不能把所有生命都限定為 Exchange Brain 派貨才出現。

正式 source types：
- `BRAIN_LOGISTICS`：Exchange Brain / 108 原子 / Digital Ant 等派貨與市場需求形成的 Market Life。
- `WILD_ECOLOGY`：世界本身自然存在的基礎生命與市場不確定性，例如魚、蝦、牛、羊、野生怪、樹、花。
- `PLAYER_OWNED`：玩家已取得、馴養、種植、移植或帶回自己土地的生命。
- `WORLD_EVENT`：天氣、災害、季節、突發事件、資源生成等世界事件造成的生命/環境狀態。

四種來源可使用同一個 world/source interface，但必須保留 `sourceType`，不得混淆來源原因。

## 2. 基礎怪物 = 世界不確定性
基礎怪可以常態或機率性出現，用來表現市場與自然世界永遠存在的不確定性。它們不需要有物流任務，也不必等待 ATM 需求。

基礎怪仍需有 LIFE_ID、生命狀態、位置、行為、可見性、出生/消失原因。若其同時具有 Market Life 能力，可再帶 KX/KY/KZ position/risk 狀態；若只是生態生命，則不得硬塞市場持倉。

## 3. 動物與植物都是生命
魚、蝦、牛、羊、樹、花等不是背景 decoration，而是可持續存在的生命實體。

至少可逐步支持：
- 出生 / 生長 / 成熟 / 老化 / 死亡；
- 飢餓、健康、能量、水分、環境需求；
- 移動、覓食、逃跑、群聚；
- 種植、採集、捕捉、馴養、移植；
- 帶回玩家自己的土地；
- 養殖、耕田、收成、繁殖；
- 與市場、物流、KGEN/KAIOS 經濟產生後續關係。

## 4. 玩家土地
玩家可有自己的空地/土地器官。生命帶回土地後，不得降級成純 inventory item。

土地需逐步具備：
- LAND_ID / owner relation；
- XYZ 範圍與碰撞；
- soil / water / capacity / structures；
- planted life / animal life registry；
- growth tick / care state / harvest state；
- 可建農田、牧場、魚池、倉庫等器官。

未有正式 ownership/settlement 前，土地與生命所有權只能作遊戲世界狀態，不得冒充鏈上真資產。

## 5. 真實物理世界映射原則
11520 可以逐步模擬現實物理世界會發生的現象，例如重力、碰撞、天氣、溫度、光照、水循環、植物生長、動物行為、耕作、運輸、建築與生態互動。

但「真實物理世界所有會發生的事」是產品長期方向，不代表目前 runtime 已完整模擬現實世界。每一項物理/生態規則必須有可驗證的模型、參數與測試，不能用文字宣稱完成。

## 6. Source lifecycle
所有外部/內部生命來源都統一為：
`SPAWN -> ACTIVE/UPDATE -> RETREAT/HIDDEN/DEAD -> DESPAWN`

其中：
- `BRAIN_LOGISTICS` 的 spawn reason 必須可追到 demand/mission/dispatch。
- `WILD_ECOLOGY` 的 spawn reason 必須可追到 habitat/seed/world rule/random seed。
- `PLAYER_OWNED` 必須可追到 acquisition/transfer/capture/plant event。
- `WORLD_EVENT` 必須可追到 event id / world condition。

## 7. 不確定性必須可重現
核爆場可用 seeded randomness 表現自然與市場不確定性，但測試必須可重現。正式 QA 不接受完全不可追的 `Math.random()` 直接決定關鍵生命事件。

## 8. Product principle
11520 最終不是只有交易所，而是一個 Living World：市場生命會交易與物流，自然生命會生長與繁殖，玩家可以生活、耕田、養殖、採集、建造、旅行與戰鬥。所有生命都必須保有自己的 identity、state、來源原因與生命週期。