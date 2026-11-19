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

### 12682／88888 共用遊戲的模擬帳本補充

依 Human 2026-11-20 確認，遊戲新成交使用 `UNIVERSE_ENTRY_FLOOR_DELTA_C_LOTS_V1`。以實際成交 USDT 價格固定金融樓層 `k=floor(log10(entry))`，一個 K 點的尺度為 `10^k` USDT。模擬損益為 `((mark-entry)/10^k) × signed C × lots` KGEN。行情、觸發和成交價格仍以原始 USDT 表示。跨樓層後維持成交尺度，與玩家物理 XYZ 無關。

隔離保證金仍為每口 1 KGEN，零維持保證金及零費用。反向歸零距離為 `10^k/abs(C)` USDT，觸及價格即清算。跳價以觀察價計算，實現虧損以該筆保證金為限，超出部分保留在收據。BTC 75,000 成交的 +1C／2 口，85,000 平倉實現 +2 KGEN，74,999 浮虧 0.0002 KGEN，強平價為 65,000。

舊未平倉部位保留原計價至結算。原持倉和回執照原存檔讀取，不回算已實現損益或餘額。尚未成交委託保留原識別值與價格，可原樣取消，成交時使用當時的新模擬模型。新成交與結算收據附模型及尺度。本補充適用於共用遊戲的手動與模擬自駕。上文鏈上與測試網模型照原部署。

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

## 9. 模擬自動操盤核心候選（2026-11-18）

本節記錄 Human「多空 XYZ 導航之上的自動駕駛，能自動切換多空部位」
要求的一個軟體元件；不改上列金融公式、口數、費用、C 或市場綁定。
核心最初獨立交付時，#523 的遊戲畫面、導航、座標與測試 HOLD 仍在，未以
另一個 Runtime／bootstrap 繞過。Human 於本頁後續明確授權處理並解除 #523
普通工程阻塞，現行接線沿 PR673 與原檔完成；原歷史、其他具體 HOLD 及
真實資產操作邊界保留。完整整合仍須精確 head 的 CI／實景驗收及原站交付。

替代來源 `b58e850a2fc48491bcc7a3fb9f0728446407aef4` 已保存及 push 原 PR673；
#523 已於 UTC `2026-11-17T21:51:57Z`（台灣11月18日05:51:57）closed、
merged=false，原分支、body與提交歷史保留。它的舊 HOLD 不再阻擋本範圍
普通工程；後續驗收沿原 PR673 接續。此為處置回執，不代表已部署或真交易。

既有「導航／自駕地圖」提供三市場獨立選擇、物理 XYZ 目的地、距離／ETA、
多空目標價情境損益及明確確認後的模擬自駕。物理操控面可自由切換；明確
選市場後不再隨操控面改市場。目的地與情境價格分欄，不能把原始 USDT
報價當成世界高度。跨世界 18911 航路與正式價格至全球座標投影尚未配置，
本地導航不冒充飛抵 18911。

移動使用單一 elapsed motion clock，隱藏／換身份後不補跑時間；碰撞後才
提交位置與觀測速度 ETA。普通空倉為原步行速度，只有已成交 OPEN 部位 C
提供引擎速度，草稿與 pending 委託不點火。模擬自駕由既有一秒帳本 tick
呼叫；切市場、玩家、錢包、執行模式、唯讀檢視或離開畫面停止決策，重新
載入不自動 arm。停止決策不取消待成交委託、不自動清倉；原委託／持倉頁
仍是處理既有風險的入口。到站預設停決策，只有明選選項才繼續模擬操盤。

既有 `runtime/real-trading-order-intent.mjs` 增加
`createSimulationAutopilot({adapter, getContext})`：

- `adapter` 必須是同模組 `createExecutionAdapter` 建立的 SIMULATION 實例。
  偽造 `{mode:'SIMULATION'}`、ON_CHAIN、BSC_TESTNET 或 provider callback
  都不會成為可接受的自駕執行器。
- `getContext()` 必須回傳目前 Player Life 範圍的非空識別字串，或
  `{id, readOnly}`。每次決策、每個非同步接續點都重驗身分與唯讀狀態。
  原保存用的 `beforeMutation` hook 返回後、真正修改帳本前也重驗，避免
  hook 內切換帳號或停止策略後，舊動作仍寫入帳本。
  它不以 `snapshot().wallet` 或頁面旗標推定簽署／交易權限。
- `arm(config)` 明確啟動；`step({now})` 由既有呼叫端提供一輪決策；
  `snapshot()` 讀狀態；`stop()` 停止後續決策。沒有內建定時器或自動恢復。
  建立新實例／重新載入必定 DISARMED。

啟動設定不得省略以下欄位，核心不代填交易或風控數字：

| 欄位 | 意義 |
|---|---|
| `axis`、`market` | 沿原 KX/BTCUSDT、KY/ETHUSDT、KZ/BNBUSDT 綁定 |
| `lots`、`cMagnitude` | 沿原口數／正值 V1 C 檔位；多方使用正 C，空方負 C |
| `longAbove`、`shortBelow` | 價格達上界時多方訊號、達下界時空方訊號；下界必須小於上界 |
| `maxLossKgen` | 此次啟動所屬部位的已實現加未實現淨虧損停止門檻 |
| `maxOrders` | 此次啟動允許建立的新委託數量上限 |

可選 `longStopPrice`、`longTakeProfitPrice`、`shortStopPrice`、
`shortTakeProfitPrice`，皆按原委託模型與該方向驗證絕對價格。
反手不沿用另一方向的停損／止盈價格。

決策沿原 `quote → preview → submit`；提交成功仍僅為 PENDING_TRIGGER，
須後續有效 observation 觸及／穿越才可能成交。核心不製造行情、FILL 或回執，
不改原觸價成交規則。已有 pending 時不重複建立同軸委託。

與現有多空方向相反時，先以原 `close` 平倉，再同時核對成功結果、同部位
SETTLEMENT 回執、CLOSED 終態、歸零保證金與帳本保存的回執，才可預覽及
建立反向委託。清算不冒充成功平倉；未知結果、失敗或缺回執即停止，沒有
自動重試。不得接管啟動前／其他操作者建立的同軸委託或部位。
延後成交時被原帳本拒絕的委託、外部取消、遺失的策略委託或外部手動平倉
也會停止策略；不能靠相反訊號重新送單。

`maxLossKgen` 依原 `positionRisk` 和原帳本回執計算；到達門檻時嘗試確認
平掉本控制器的既有部位並停止。它不是跳空／滑價／過期行情下的保證最大損失。
停止或出錯不會自動取消既有 pending 或擅自平倉；它們仍保留在原帳本，須沿
原明確取消／平倉流程處理。`stop()` 不等於帳本已空倉。

以上核心最初交付時僅離線模擬，當時尚無 UI／路線 ETA／情境損益整合或
實景驗收；該歷史不代表本節上方已接線的候選又被撤回。現行整合沿原
PR673 驗收，仍沒有價格至全球 XYZ 映射、真錢包自動多空、簽署或送鏈能力。
不得把元件測試通過當成完整產品、手機或主網驗收。

### 原 BSC97 舊本金退出恢復（2026-11-18 接續）

原退出檢視的部署至今區塊跨度已超過既有 2,000,000 上限，完整委託／
部位歷史無法在原界線內恢復。只對明確 `exitOnly`、非唯讀且跨度超限的
原部署，沿既有 ABI 以同一區塊及 canonical hash 核對 code、proxy、
連結、錢包、principal／locked／available；不擴大掃描、不枚舉已知 ID，
不新增 indexer、合約、地址或經濟規則。

初次候選 `e92ae1504` 以 `!capitalEnabled` 額外限縮，原 CI 已證明它未涵蓋
實際舊退出部署的 `ISOLATED_V1` 設定，故當時仍被原 history guard 擋下；
該失敗保留。修正適用條件不更動該能力、manifest 或非退出候選的完整恢復。

`LEGACY_PRINCIPAL_ONLY` 只證明本金與可用額；完整歷史標記
`INDEXER_REQUIRED`，委託、部位、PnL、Claim 與 oracle 狀態為 `UNKNOWN`。
它們不能顯示成空倉、零損益或驗收完成。僅原 Available 提款可用；平倉、
撤單及 Claim 暫停，入金／授權／新增風險仍拒絕。完整恢復的原區塊跨度
與 `nextOrderId` 上限、M1 唯讀與原模擬帳本都保留。

提款仍經原可用額重核、`eth_call`、gas 上限、本人錢包確認、收據身分與
canonical block 核對。每次非同步身分核對返回後重驗 generation，A→B→A
不得繼續舊錢包請求。成功收據先保存；若後續本金讀取失敗，餘額清為未知、
暫停提款，但同錢包／鏈／部署仍可看已確認的交易雜湊及勿重送提示。
換錢包、錯鏈或另一部署不繼承該回執。這不是主網提款、實際資金入帳、
完整歷史恢復或真自動操盤的證據。
