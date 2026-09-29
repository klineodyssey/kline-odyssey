# 11520 花果山 5D｜玩家操作與交易說明書

## 系統分工
- XYZ 世界：角色移動、戰鬥、怪物、建築、生活器官，結算 KAIOS。
- KX / KY / KZ：三個獨立交易軸，市場、方向、口數、C、委託、持倉與 PnL 互不覆蓋，結算 KGEN。

## 左手角色控制
- 內圈：XZ 地面移動。
- 外圈：沿圓周拖曳，控制角色朝向旋轉。
- 放手停止移動，但保留最後朝向。
- 0C 仍可用一般走路取經速度遊戲；C 不是步行開關。
- 右手空白區控制第三人稱鏡頭，不取代角色旋轉。

## KGEN 本金／保證金定義
11520 不採用「口數 ÷ 槓桿 = 保證金」模型。正式規則：

- 1 KGEN = 1 口本金。
- 下幾口，就需要幾 KGEN 本金／保證金。
- 10 口 = 10 KGEN。
- 100 口 = 100 KGEN。
- C 不降低本金需求。

錢包 KGEN 總額不是全部自動成為保證金。只有實際建立的訂單本金才從可用 KGEN 鎖定；其他 KGEN 維持可用。

## C 曲速／光速規則
C 是帶方向的隔離槓桿，絕對值最大為 100：

依 Human COMPLETE_PRODUCT_HANDOFF V1，候選與 simulation 使用：

`PnL = ΔIndex × signed C × 正整數口數`

舊公開 Testnet 合約尚未部署此候選，仍標示 `NOTIONAL_RETURN_V1`；不能拿候選的顯示公式冒充舊 bytecode 已更新。

理論反向歸零距離：

`最大反向 index 距離 = 1 / abs(C)`

例：
- 100 口、100C：本金 100 KGEN；理想反向0.01 index虧100 KGEN。
- 100 口、50C：本金仍是100 KGEN；理想反向0.02 index虧100 KGEN。
- 100 口、1C：本金仍是100 KGEN；理想反向1 index虧100 KGEN。
- 鏈上實際 liquidation trigger 另計 maintenance、整數精度與有效 oracle observation；跳空採實際 observed settlement price，不假裝成交在觸發線。

單筆最大損失限制在該筆本金。該筆本金耗盡即清算，不再從本單之外的錢包 KGEN 追繳。

## 光速能力與燃料
一般玩家可以完全不交易，使用走路取經速度遊戲。高 C 是高威力能力，不是免費加速器。

「額外 100 倍本金／燃料門檻」目前在本次 repo 搜尋中沒有找到可機器驗證的已鎖定公式，因此程式暫不把 100× 偷寫成正式硬門檻；待正典值確認後再加入 capability gate。

## KGEN 帳戶顯示
帳戶分成：Wallet KGEN/BNB、Brain Total、Available、Locked Margin、Unrealized PnL、Equity、Realized PnL、Player Claimable、Withdrawable。Claimable 是已結算未付盈利，不是可立即提款的現金。

候選交易所另有實際補入的 Settlement Capital、Reserved Settlement Liability、Insurance。玩家 Deposit 不會被當成交易所資本；新倉風險超過可用資本時整筆拒絕。補資後 Claim 才能增加玩家自己的 Available。

Connect 不會自動授權。Deposit 前讀 allowance；不足時明示最大額度授權，由錢包另行確認。一次 Deposit 可多次下單；Withdraw 只提 Available，不提 Locked。

## 錢包連線
核爆試驗頁 `wallet-trade.html` 直接連接使用者注入式 EVM 錢包，BSC chain 56 上讀：地址、Chain ID、BNB 餘額、正式 KGEN ERC-20 balanceOf。

KGEN token：`0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be`。

這些讀取是真實鏈上資料，不是本機假餘額。

## 下單流程
1. 選 KX / KY / KZ。
2. 選市場。
3. 選多或空。
4. 選口數。
5. 選 C。
6. Preview 顯示本金、deployment PnL model、每 index 損益、理想價格距離／正式 liquidation estimate及可用餘額；舊部署明示舊模型。`abs(C)` 不得超過100，低於0.001C不得建立 KGEN 交易。
7. Confirm 才能繼續。
8. 取消 Preview / Confirm 不得改變任何資產。

目前 KX/KY/KZ 衍生交易在 `wallet-trade.html` 仍是核爆模擬。正式 11520 Settlement 合約地址、ABI、custody、成交／拒單 receipt 未驗證完成前，程式不得廣播或把模擬 Filled 冒充鏈上成交。

## 語音與客服
Preview、確認、成交、拒單、清算、平倉可使用瀏覽器繁中語音。客服必須說明當前軸、市場、口數、C、本金、ΔIndex 損益與風險；語音永遠不能代替使用者確認或錢包簽名。

## 安全
- 私鑰、Seed Phrase、Token 不得進入程式或客服訊息。
- 未驗證 Settlement adapter 時，衍生下單必須 fail-closed。
- 網路失敗不能假造 Filled。
- 本地模擬不能改動鏈上 KGEN。
