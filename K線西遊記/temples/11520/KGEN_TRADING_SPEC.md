# 11520 KGEN 交易數學正典

## Metadata
- STATUS: ACTIVE / SOURCE_OF_TRUTH
- REVISION: 2026-09-03.1
- HUMAN_AUTHORITY: 沈英明
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 核心單位
- `1 KGEN = 1 口`。
- 下單幾口，就必須配置幾 KGEN 作為該筆交易本金／保證金。
- `principalKgen = abs(lots)`。
- C 不得用來減少本金／保證金。

## 2. C 曲速與損益
- C 是曲速／光速級損益倍率，也是 5D 世界的空間能力概念；不得再以傳統交易所 `L` 模型取代。
- 交易損益：`PnL_KGEN = priceDifference × direction × lots × C`。
- 多方 direction = +1；空方 direction = -1。
- 每點損益絕對值：`abs(lots × C)` KGEN。
- 在沒有其他已核准風控規則介入時，理論反向歸零距離：`1 / C` 點（C > 0）。

### 例
- 100 口 -> 本金 100 KGEN。
- 100 口、1C -> 每點 ±100 KGEN；反向 1 點即耗盡該筆本金。
- 100 口、0.001C -> 每點 ±0.1 KGEN；約反向 1000 點耗盡本金。
- 1000 口、0.000001C -> 本金 1000 KGEN；每點 ±0.001 KGEN；約反向 1,000,000 點耗盡本金。

## 3. 單筆清算邊界
- 每筆訂單的本金是該筆交易的風險池。
- 當該筆累積虧損達到本金，該筆部位歸零／清算。
- 不得在未有新正典決定時自動向錢包其他 Free KGEN 追繳該筆虧損。
- Preview / Cancel 不得改變本金、錢包餘額、持倉或已實現損益。

## 4. KGEN 帳戶分帳
KGEN 錢包餘額不等於全部都是保證金。UI/runtime 必須分開：
- Wallet / verified chain balance：鏈上查得的 KGEN。
- Free：可供新交易配置的 KGEN。
- Locked Principal / Margin：已配置到開倉部位的本金。
- Reserved Orders：真正待成交委託所預留的 KGEN。
- Unrealized PnL：未平倉損益。
- Realized PnL：已平倉損益。

## 5. KX / KY / KZ
- KX、KY、KZ 是三個獨立交易軸。
- 每軸保留自己的 market、side、lots、C、position/order state。
- 調整 KX 不得洗掉 KY/KZ 狀態。
- 下單確認必須顯示 axis、market、side、lots、C、本金、每點損益、風險／歸零距離、資料時間。

## 6. 禁止復活的錯誤模型
以下模型已被人類明確否決，屬 `REJECTED / SUPERSEDED`：
- `margin = lots / leverage`
- `margin = lots / C`
- C 越高所以本金越少
- 在 PnL 中把同一槓桿重複乘兩次

任何 runtime/test/UI 再引入上述模型應視為 regression。

## 7. 真實交易邊界
- 真實錢包連線與 `balanceOf` 可以獨立存在。
- 未驗證正式 settlement contract、ABI、chain、custody、receipt 前，衍生下單必須 fail-closed 或明示 simulation/off-chain。
- 不得把 local `FILLED` 冒充鏈上真實成交。

## 8. 變更控制
若要修改以上公式，必須先有新的明確 Human Decision，再同步修改本文件、GAME_UI_SPEC.md、CHANGELOG.md、runtime 與 regression tests。不得為配合現有程式而反向改寫正典。