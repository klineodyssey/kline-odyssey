# KGEN TempleHeart V3.3.1 Upgradeable — 12345 香火／發財金／網頁動畫規格

狀態：**REVIEW DRAFT ONLY**。未審計、未授權主網部署。

## 1. 版本目的

V3.3.1 是 12345 悟空財神殿 UUPS Proxy 世代的修正版。

本版把四件事分開：

1. **香火供奉**：香、金紙、燈、發財符、還願，底層是已驗證的 KGEN Burn。
2. **KAIOS 創生**：仍由 `KAIOSV02_BurnProofGenesis` 處理，守恆固定 `1 KGEN burn -> 10,000 KAIOS`。
3. **發財金**：30 天一次，1~8 KGEN，金額由鏈上祈福值決定，玩家不能自己輸入 777/888。
4. **K線多空彩金遊戲**：不塞進 Heart；改成獨立 `fortuneGame` / jackpot 模組，未來可用 VRF、彩金池、commit/settle，不污染 Heart storage。

土地系統目前未定稿，本版不處理、不發地、不抽地。

## 2. 香與金紙到底是什麼

第一版不需要真的鑄造「香 NFT」或「金紙 NFT」。

網頁上要有真實遊戲物件：

- 一炷香 / 三炷香
- 金紙
- 光明燈
- 發財符
- 還願供品
- 香爐 / 金爐 / 白洞

但鏈上真相仍然是 **KGEN Burn Proof**。

建議流程：

`玩家選供品`
→ `網頁顯示待焚化物件`
→ `Wallet 確認 KGEN Burn / 白洞流程`
→ `KAIOS BurnProofGenesis 產生有效 proof`
→ `12345 recordBurnOffering(burnProofId, type)`
→ `鏈上驗證成功`
→ `前端才播放完整燃燒、煙霧、金光、化灰動畫`
→ `福運增加`

**禁止** Wallet 還沒成功就先顯示「已燒完」。

如果 Wallet 取消或交易 reverted：
- 供品仍留在畫面
- 顯示「尚未完成供奉」
- 不增加福運
- 不計香客有效經濟行為

## 3. Burn Offering Purpose Codes

V3.3.1 預設：

- `KGEN_12345_INCENSE`
- `KGEN_12345_JOSS_PAPER`
- `KGEN_12345_BLESSING_LAMP`
- `KGEN_12345_FORTUNE_CHARM`
- `KGEN_12345_VOW_OFFERING`

Heart 直接讀 KAIOS BurnProofGenesis：

- source 必須是 `VoluntaryPlayerOffering`
- burner 必須等於 `msg.sender`
- civilizationId 必須等於目前 Wish
- wishHash 必須等於目前 Wish
- purposeCode 必須符合所選供品
- `kaiosMintAmount == kgenBurnAmount * 10,000`

proof 一次性，不能重複拿來上香。

## 4. 香火福運

本版把供奉變成 **Blessing Power**，而不是「花越多保證賺越多」。

預設每整數 KGEN Burn 的祈福值倍率：

- 香 Incense：1
- 金紙 JossPaper：3
- 光明燈 BlessingLamp：5
- 發財符 FortuneCharm：8
- 還願 VowOffering：12

這些參數可治理調整。

心跳：
- 每 Wallet + Civilization 最快 1 小時一次
- 預設 +1 Blessing Power
- 不直接支付 KGEN

跨日呼吸：
- UTC 每日一次
- 不限 00:00~00:10
- 預設 +8 Blessing Power
- 不直接支付 KGEN

## 5. 發財金 1~8 KGEN

發財金仍需：

- 有 Wish
- 三聖盃 3/3 proof
- 有指定 `KGEN_12345_FORTUNE_GENESIS` 的 KGEN Burn Proof
- wallet 30 天 cooldown
- civilizationId 30 天 cooldown
- 30 天 Epoch 500 次上限
- Heart 有足夠 KGEN

福運階梯：

- 0~7：1 KGEN
- 8~27：2
- 28~87：3
- 88~187：4
- 188~387：5
- 388~687：6
- 688~887：7
- >=888：8

這是 deterministic progression，不使用 `block.timestamp`、`prevrandao` 等假亂數控制เงินจริง payout。

## 6. 香客統計

鏈上保留：

- `totalPilgrims`
- `dailyNewPilgrims[day]`
- `dailyActivePilgrims[day]`
- `totalWishers`
- `totalHolyCupPassed`
- `totalFortuneClaimants`
- 每類供奉次數
- 每類 KGEN Burn 總量
- 心跳總數
- 呼吸總數

Civilization ID 是主要香客身份；不能只用 Wallet 數量當真人數。

## 7. 18888 玉帝金庫

`lingxiaoBank` 保留為 18888 靈霄寶殿／玉帝金庫地址欄位。

**注意：** `KAIOSV02_BurnProofGenesis` 的 `recipientVault` 是 Burn proof 記錄的一部分。正式部署前 Codex 必須確認 KAIOS 最終規則是否要求所有供奉生成的 KAIOS 都直接 mint 到 18888。

若要強制：
`recipientVault == lingxiaoBank`
應在 KAIOS 定稿及 18888 地址確認後再加 hard requirement，避免現在把未定稿貨幣規則鎖死。

## 8. K線多空彩金遊戲

Heart V3.3.1 **不內建 monetary randomness**。

只保留：
`address public fortuneGame`

未來獨立合約負責：

`玩家選多/空`
→ `交易先上鏈鎖單`
→ `再取得不可預知的 VRF/randomness`
→ `生成隨機 K 線`
→ `settle`
→ `Jackpot Pool 自動付款`

絕對禁止 16888 類型 bug：

`前端先算輸贏`
→ `玩家看到輸`
→ `取消交易`

正確順序只能是：

`鎖單成功`
→ `之後才知道未來 K 線`
→ `自動結算`

建議下一個獨立合約：
`KGEN_FortuneKlineGame_V1_0_0_Upgradeable.sol`

它自己有：
- UUPS Proxy
- VRF adapter
- Jackpot Pool
- long / short position
- round state
- max payout
- pool floor
- daily outflow limit
- emergency pause

Heart 只讀遊戲成就或福運結果，不保存高風險亂數邏輯。

## 9. 網頁動畫規格

路徑仍是：
`/temples/12345/`

優先使用 Web 技術即可，不需要 App：
- CSS transforms
- Canvas/WebGL
- Three.js（需要 3D 時）
- 粒子煙霧 / 火星
- 金紙 edge-burn shader 或 sprite animation
- 手機 touch drag

建議四區：

1. 供桌／香爐
2. 金爐／白洞
3. 許願／三聖盃
4. 悟空求財盤（外接 K線彩金遊戲）

動畫狀態必須由 transaction state 驅動：
- prepared
- wallet_pending
- chain_pending
- proof_verified
- burning_animation
- completed
- failed/cancelled

## 10. Codex 必做測試

### Proxy
- initializer only once
- implementation initializer disabled
- unauthorized upgrade rejected
- authorized upgrade preserves state
- storage layout validation

### Burn Offering
- nonexistent proof rejected
- wrong source rejected
- wrong burner rejected
- wrong civilization rejected
- wrong wish rejected
- wrong purpose rejected
- KAIOS 1:10000 mismatch rejected
- same proof replay rejected
- successful proof increases correct blessing power

### Pilgrim / rhythm
- one civilization counted once
- daily active dedupe
- hourly heartbeat wallet + civilization lock
- cross-day breath wallet + civilization lock

### Fortune
- 30-day wallet cooldown
- 30-day civilization cooldown
- epoch 500 cap
- player cannot select reward amount
- reward tier exactly 1..8
- proof replay rejected
- insufficient Heart balance rejected

### Frontend
- cancelled wallet transaction never plays completed burn animation
- reverted transaction never increases displayed Blessing Power
- only confirmed BurnProof triggers final burn animation
- mobile touch works
- animation reduced-motion fallback
- no monetary game result is generated client-side before chain lock

## 11. 部署規則

V3.3.1 目前只進 review branch，不直接主網部署。

Codex 下一步：
1. compile
2. tests
3. storage compare against V3.3.0 genesis Proxy layout
4. fix any incompatibility by append-only storage or deploy V3.3.1 as first Proxy genesis if V3.3.0 never deployed
5. confirm KAIOS ABI
6. confirm 18888 recipientVault rule
7. build frontend burn animation prototype
8. prepare deployment scripts
9. wait for explicit human mainnet approval

如果 V3.3.0 **尚未部署 Proxy**，建議直接以 V3.3.1 作為第一個正式 Proxy implementation。
