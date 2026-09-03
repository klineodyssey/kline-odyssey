# 界曜｜11520 CURRENT Handoff

## Metadata
- VERSION: 1.2.0
- REVISION: 2026-09-03.3
- STATUS: ACTIVE_CONSTRUCTION
- OWNER_PAGE_IDENTITY: 界曜
- HUMAN_AUTHORITY: 沈英明
- PURPOSE: 新施工頁從 GitHub 自動接續，不要求人類重講已定義規格。
- FORMAL_RULE: 檔名固定不帶版本；版本/revision 寫文件內。

## 1. 開工必讀正典（順序）
1. 開機規範 / AGENTS
2. `GAME_UI_SPEC.md`
3. `KGEN_TRADING_SPEC.md`
4. `VEHICLE_C_SPEC.md`
5. `MANIFEST.json`
6. `CHANGELOG.md`
7. `game-5d.html`
8. `runtime/world-runtime.mjs`

**CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.**
程式與正典衝突時先判 regression；不得叫人類重新解釋，也不得偷偷改正典配合錯誤程式。

## 2. 永久防退步規則
- 左下 MOBA 搖桿：內圈 XZ 移動；外圈沿圓周拖曳 = 角色旋轉/heading。
- 左搖桿角色旋轉與右手第三人稱鏡頭旋轉分離。
- 0C 不得鎖死普通步行；沒有載具仍能走路取經。
- 保留 KayKit Adventurers CC0 Knight / GLB + GLTFLoader + AnimationMixer 可替換動畫人物管線；primitive 只能是載入失敗 fallback。
- KX/KY/KZ 三軸獨立 market/side/lots/C/order/position state。
- `1 KGEN = 1口`；下幾口 = 幾 KGEN 本金／保證金。
- `PnL = price difference × direction × lots × C`。
- 禁止 `margin = lots / leverage`、`margin = lots / C`。
- KGEN wallet 不等於全部 margin；Free / Locked Principal / Reserved / UPnL / RPnL 分帳。
- 一般角色/物體不得任意超光速；高 C 需要有能力的變形載具／飛碟等。
- 載具器官（導航、地圖、通訊、遙測、記憶、眼睛、曲速、結構等）失效只影響對應能力；載具解體不刪玩家生命，返回步行模式。
- 額外 100× 燃料/能力儲備門檻目前 `UNRESOLVED`，不得擅自寫死。
- 真錢包 balance 可以讀；真衍生下單在 settlement contract/ABI/chain/custody/receipt 未驗證前必須 fail-closed/明示 simulation。

## 3. 必須保留的產品器官
主城世界(5D)、K場交易、持倉、委託、歷史、資產、統計、市場、背包、角色、世界地圖、ATM、設定、AI/客服、下單確認、desktop rail、mobile dock、XZ/Y/C/戰鬥/交易控制全部累積保留。修改一器官不得讓另一器官消失。

## 4. 已存在世界 runtime
`runtime/world-runtime.mjs` 是正式 XYZ gameplay organ；延續它，不另建同功能 runtime。已有世界邊界、HOME/ATM/SHOP collision、怪物 Life ID、HP、aggro、追擊、攻擊距離/cooldown、死亡與 8 秒重生。只有真正擊殺才給 KAIOS。

## 5. 當前施工方向
P0：依正典恢復/鎖住歷史功能並補 regression tests：
- 3D Knight animation pipeline
- 內圈 XZ + 外圈角色旋轉
- 右手鏡頭
- 三軸獨立交易狀態
- 正確 KGEN 本金/C/PnL/清算模型
- wallet verified balance 與 local accounting 分離
- 每個器官與按鍵 browser/mobile 驗證

P1：載具 runtime：vehicle identity/maxC/fuel reserve/organ health/failure/degrade/disassembly；無載具/失效後回普通步行。

P1：真交易 adapter 只有在正式 settlement evidence 完整後啟用；不得把 local FILLED 冒充 Mainnet fill。

## 6. Change control
任何行為規格改變都必須：Human Decision -> 正典文件 -> CHANGELOG -> runtime -> regression tests。舊 commit 中與 CURRENT 正典衝突的實作只能作歷史證據，不能復活為現行規則。