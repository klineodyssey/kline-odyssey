# 11520 載具／C 曲速能力正典

## Metadata
- STATUS: ACTIVE / SOURCE_OF_TRUTH
- REVISION: 2026-09-03.1
- HUMAN_AUTHORITY: 沈英明
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 基本世界規則
- 一般角色／一般物體不得任意超光速。
- 玩家即使沒有特殊載具，仍必須能以正常走路／跑步方式完成 5D 世界遊戲（走路取經）。
- 超光速不是單純 UI 把 C 拉高；必須具有對應能力的特殊載具，例如變形載具／飛碟載具。

## 2. 載具是器官系統
載具不是裝飾模型。可包含獨立生命／器官：
- 導航
- 地圖
- 音響／通訊
- 遙測
- 記憶
- 眼睛／視覺
- 動力／曲速器官
- 防護／結構器官

每一器官應有 identity、state、durability/energy、input/output、failure state 與 persistence boundary。

## 3. C 能力
- 載具必須聲明 `maxC` 或等價能力上限。
- `requestedC > vehicle.maxC` 必須拒絕。
- 必要器官失效時，即使 UI 設定更高 C，也不得進入該能力狀態。
- 地球人／一般物體的具體 C 上限，以及各種載具的 maxC，由各載具正式規格決定；不得在共用 runtime 任意猜值。

## 4. KGEN 燃料與交易本金分離
- 交易本金遵循 `KGEN_TRADING_SPEC.md`：下幾口 = 幾 KGEN 本金。
- 載具 KGEN 燃料／能力儲備是另一個資源層，不得拿來改寫交易本金公式。
- 「是否需要額外 100× 本金／燃料儲備才能取得特定 C 能力」目前為 `UNRESOLVED`；在新 Human Decision 前不得寫死為 production 規則。

## 5. 器官衰退／解體
高 C／能源不足或其他正式 damage rule 可使載具逐級失能。基本狀態鏈：
`NORMAL -> FUEL_LOW -> ORGAN_DAMAGED -> ORGAN_ZERO -> WARP_DISABLED -> VEHICLE_DISASSEMBLED`

器官歸零的效果必須對應該器官，而不是隨機刪功能，例如：
- 導航歸零 -> 自動導航不可用。
- 地圖歸零 -> 載具地圖器官不可用。
- 遙測歸零 -> 遠端感測資訊不可用。
- 記憶歸零 -> 對應載具記憶／路線保存能力失效。
- 眼睛歸零 -> 對應視覺感知能力受限。
- 曲速器官歸零 -> 退出超光速／曲速狀態。
- 核心結構歸零 -> 載具解體。

## 6. 玩家生命保護
- 載具解體不等於刪除玩家生命。
- 失去載具後，玩家返回可用的普通 XYZ 移動模式；最差仍可走路取經。
- 不得因載具器官歸零而把角色、背包、交易帳戶等不相干生命／器官一起刪除。

## 7. UI/客服要求
任何高 C 操作必須讓玩家看得懂：
- 當前載具
- requested C / maxC
- KGEN 交易本金
- 載具燃料／能力儲備（若該載具規格啟用）
- 器官健康狀態
- 哪一器官不足而限制 C
- 失效後會降級成什麼能力

文字客服必須存在；語音可作輔助但不得代替風險確認。

## 8. 變更控制
任何人要把 C、交易槓桿、載具燃料或器官耐久合併成另一套公式，必須先取得新的明確 Human Decision，並同步更新正典、CHANGELOG、runtime 與 tests。