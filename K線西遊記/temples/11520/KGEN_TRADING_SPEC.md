# 11520 KGEN 交易數學正典

## Metadata
- STATUS: ACTIVE / SOURCE_OF_TRUTH
- REVISION: 2026-09-30.1
- HUMAN_AUTHORITY: 沈英明
- CHANGE_RULE: CODE MUST IMPLEMENT SPEC; CODE DOES NOT REDEFINE SPEC.

## 1. 核心單位
- `1 KGEN = 1 口`。
- 下單幾口，就必須配置幾 KGEN 作為該筆交易本金／保證金。
- `principalKgen = abs(lots)`。
- C 不得用來減少本金／保證金。

### Human P0 admission / exit policy — 2026-09-30

- AUTHORITY: `KAIOS_K11520_P0_BLOCKER_RESOLUTION_DECISION_V1`。
- minPrice/maxPrice 是新增風險區間，不是既有權益的結算價格截斷。
- 超界進入 EXIT_ONLY；新 Order/Position 拒絕。既有倉位依實際 accepted
  observation 平倉／清算，120 不得截成110，80不得截成90。
- Oracle source/quorum/freshness/complete round/timestamp/sequence/deviation
  保持有效；Oracle 失效不准偽造結算，也不消除 Principal/Position/Claimable。
- Oracle Trading Capability 為可到期、可撤銷的 max acceptable C 證據核定，
  加上更嚴格新增風險 age、absolute spread、source timestamp skew。
  未核定、到期、0C能力或超過能力時 NO_NEW_RISK；不影響合法退出。
- 已 pending 的訂單成交前重驗 capability 和 range；玩家解鎖100C不保證可開倉。
- Reserved Settlement Liability 仍為原 admission envelope 的 gross reserve；
  真實價格超界的額外確定盈利不得消失，資金不足部分依原 Brain claim accounting
  記帳並於補資後清償，不挪用他人本金，不宣稱有限資本保證無限行情。
- Mainnet candidate 使用 USD INDEX；不得把現有 USDT reference UI 或 Testnet
  route 無聲改成真資金 USD 執行。正式 activation 仍須 exact manifest 核准。

## 2. C 槓桿與損益
- AUTHORITY: Human `KAIOS_K11520_COMPLETE_PRODUCT_HANDOFF_TO_CODEX_GM_V1` 第六、七節及 `CONTINUE_TO_COMPLETE` 明確核定本節；不是以程式倒推正典。
- C 是帶方向的隔離槓桿倍率，`abs(C)` 上限為 `100`；不得再以傳統交易所 `L` 模型取代。
- 交易損益：`PnL_KGEN = (markIndex - entryIndex) × signed C × lots`，模型為 `INDEX_DELTA_C_LOTS_V1`。
- Solidity WAD：`(markPriceWad - entryPriceWad) * cWad * lots / 1e18`；不得除以 entryPrice。
- 多方 direction = +1；空方 direction = -1。
- 標的每變動 1 index 的損益絕對值：`abs(lots × C)` KGEN；若顯示 1% 範例，必須乘該 entryIndex × 0.01，不能用百分比損益模型替代。
- 理想化反向本金耗盡距離：`1 / abs(C)` index；相對報酬率為 `1 / (abs(C) × entryIndex)`。實際鏈上以 maintenance margin、整數計算與同一 accepted observation 判定，不能寫死 1%。
- KGEN executable C 為 ±0.001/0.01/0.1/1，以及 ±5..100 每5一檔；0C 不開倉。小於0.001C的 KAIOS 遊戲行為不建立 KGEN margin/position/PnL。

### 例
- 100 口 -> 本金 100 KGEN。
- 100 口、100C -> 變動0.01 index 即 ±100 KGEN；理想化反向0.01 index耗盡本金。
- 100 口、50C -> 變動0.01 index 即 ±50 KGEN；理想化反向0.02 index耗盡本金。
- 100 口、1C -> 變動1 index 即 ±100 KGEN；理想化反向1 index耗盡本金。

### 歷史模型（僅 lineage，不是新交易 authority）
2026-09-24.1 的 `(mark-entry)/entry × signed C × lots` 與「100C反向1%」已由上述 Human handoff 明確取代。既有公開 BSC97 舊合約仍依舊 bytecode 運作，adapter 必須標示 `NOTIONAL_RETURN_V1`，不能把新公式假裝已部署。新候選 ABI/模型僅在 manifest capability 驗證後使用。

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
- Brain Total = principal；Available/Withdrawable = principal - locked。Equity = principal + unrealized PnL + 已結算未付 Player Claimable；Claimable 不得冒充可立即提款的現金。
- Settlement Capital 為實際 funding 收到的獨立資金，Player Deposit 不增加 Settlement Capital。Insurance 亦獨立，Treasury surplus 不得挪用以上負債。
- 開倉在同一 transaction 預留 collateral 與依 oracle bounds 計算的最大有利損益。Reserved Settlement Liability 為所有倉位 gross sum；不可樂觀淨額抵銷。不足則整筆 revert。
- 市場有 open positions 時鎖定該市場風控／價格範圍／oracle configuration，避免已預留 liability 被事後失效。
- 未付盈利寫入 Player Claimable 與 per-position claim；補資後可部分／完全清償給原 trader principal。未補資不向其他玩家追扣，也不阻擋有足額 custody 的 principal 提款。

## 5. KX / KY / KZ
- KX、KY、KZ 是三個獨立交易軸。
- 每軸保留自己的 market、side、lots、C、position/order state。
- 調整 KX 不得洗掉 KY/KZ 狀態。
- 下單確認必須顯示 axis、market、side、lots、C、本金、每 1% 損益、風險／歸零距離、資料時間。

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
