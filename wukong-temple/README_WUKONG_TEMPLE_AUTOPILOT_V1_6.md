# 五指山・悟空財神殿｜Autopilot 規則說明 V1.6（設計文件）

## 0. 核心結論（先講一句）
- 出金與回金同一池：public_good_treasury
- 自動化不是「沒人呼叫也自己出金」：區塊鏈合約必須有人送交易（使用者或 keeper/bot）
- 合約地址沒有私鑰；出金靠函式規則 + 誰來呼叫

## 1. 固定真值（已鎖死）
- KGEN Token：0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be
- KUFO（補油/質能轉換）：0xef83804c264B47378FCf150086943B53fB90A90b
- 公益 Treasury（出金/回金同池）：0xB73D6716005B37BEC742D64482fA26033eE1A4E1
- 往生（通縮）：0x0000000000000000000000000000000000000000
- deployer：0xb3c54ca96de0ded4ca0151f629ff9781506ba261
- mother：0xcd60bf474e691f2484950a0276eaf507616ca4b9
- reward：0x0fd21cf643211d067a18a416da219827da26e288

## 2. 呼吸與心跳（時間規格）
- 呼吸：UTC+8 每日 00:00（可設 00:00~00:10 為點火窗口）
- 心跳：每 1 小時（整點）留事件
- 原則：若無人點火，mother/keeper 可補一次「事件」讓宇宙有呼吸證據

## 3. 發財金（三層制度）
### Tier 1（凡人呼吸層）
- 冷卻：1 天
- 不強制先還願（鼓勵成長）
- 目的：讓新人能湊到 5000 KGEN 走向豪宅

### Tier 2（修行累積層）
- 門檻：擲筊至少 1 聖筊（前端門檻）
- 冷卻：可設 72 天 / 1 個月（建議上鏈後做）
- 目的：把「儀式」轉成「節律」與「自制」

### Tier 3（豪宅候補層）
- 唯一硬門檻：5000 KGEN 還願事實
- 豪宅：500 席位、500 年、每月 5 日發薪（鏈上可接）

## 4. 每月 5 日發薪水（你問的「怎樣設計最好」）
### 最穩版（不爆炸、不被搬空）
- 薪水不做「按持有量比例」直接空投給所有 holder（那會很重、也容易被刷地址）
- 改為：只有達標者（5000 KGEN 還願 + 先前領過發財金）才可 claim
- 發薪採用「可領式 claim」：使用者自己來領（避免合約一次發太多 gas）

### 金額模式（建議）
- 固定額（baseSalary）：例如每月 5 日每人可領 X KGEN
- 加上上限：合約餘額不足時，按比例縮放或直接停止
- 參數要可調：baseSalary / maxMonthlyUsers / monthlyBudget

### 觸發條件（建議）
- 只在 UTC+8 的每月 5 日 00:00~23:59 可 claim（或縮短窗口）
- 每地址每月只能領一次（cooldown by monthId）

## 5. 除夕 / 跨年倒數 10 分鐘（每分鐘活動）
### 現實限制
- 合約無法自己「每分鐘主動發」；一定要有人或 bot 送交易
### 最穩做法
- 寫一個「NewYearWindow」函式：
  - 在指定時間區間內（10分鐘）允許 claim
  - 每分鐘最多 1 次（minuteId 限制）
  - 若無人來領，就只留下 keeper 的事件（宇宙仍有紀錄）
- 獎勵金額：
  - 固定額（最穩）
  - 或依合約餘額按比例（容易被最後一分鐘搬空，不建議）

## 6. 安全與權限（你要的「凡人死後一萬年」）
- deployer 不長期持權限
- owner/keeper 交給 mother（0xcd60...）
- 合約不提供「任意提領」給任何人
- 若要升級規則：只能發新版合約（版本化部署），舊合約保留做歷史

## 7. 前端 index.html 要做什麼（已做）
- 擲筊 3 次（每日重置）
- 三層制度顯示
- 出金/回金同池地址顯示與 BscScan 連結
- Debug 面板（任何錯誤可視化）
- Faucet 合約部署後：填入 FAUCET_CONTRACT，按鈕改成 igniteAndClaim()

## 8. 下一步（你筆電 hardhat 部署前必做）
- 決定 keeper：mother 自己的 bot 地址 / Gelato / Chainlink
- 決定 claimAmount、rescueAmount、window（00:00~00:10 UTC+8 或 UTC）
- 部署 Faucet 合約後：
  - 把 Faucet 地址記錄到 archive/（永久）
  - 回填到 index.html 的 FAUCET_CONTRACT
  - 把 Faucet 合約先「入金」KGEN（可從 treasury transfer 到 faucet）

# 五指山・悟空財神殿｜Autopilot 規則說明 V1.6

## 0. 核心結論
- 出金與回金同一池：public_good_treasury
- 合約地址沒有私鑰；出金靠函式規則 + 誰來呼叫
- 自動化＝使用者呼叫或 keeper/bot 呼叫（合約不會自己發交易）

## 1. 固定真值（已鎖死）
- KGEN Token：0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be
- KUFO：0xef83804c264B47378FCf150086943B53fB90A90b
- 公益 Treasury（出金/回金同池）：0xB73D6716005B37BEC742D64482fA26033eE1A4E1
- 往生：0x0000000000000000000000000000000000000000
- deployer：0xb3c54ca96de0ded4ca0151f629ff9781506ba261
- mother：0xcd60bf474e691f2484950a0276eaf507616ca4b9
- reward：0x0fd21cf643211d067a18a416da219827da26e288

## 2. 呼吸與心跳
- 呼吸：UTC+8 每日 00:00（可設 00:00~00:10 為點火窗口）
- 心跳：每 1 小時（整點）留事件
- 無人點火：mother/keeper 可補一次事件

## 3. 發財金（三層制度）
- Tier 1：每日一次（不強制先還願）
- Tier 2：擲筊至少 1 聖筊才啟用入口
- Tier 3：5000 KGEN 豪宅硬門檻（不改）

## 4. 每月 5 日發薪（設計原則）
- 最穩版：只給達標者 claim（避免全 holder 空投被刷地址）
- 金額可採固定額 baseSalary，可再加上 monthlyBudget 上限
- 規則要改＝部署新版本（版本化保存）

## 5. 除夕 / 跨年倒數 10 分鐘（每分鐘活動）
- 合約不會自己每分鐘發：要有人或 bot 送交易
- 最穩做法：限定窗口 + minuteId 限制 + 固定額獎勵

## 6. 前端（index.html）已包含
- 來訪統計（CountAPI）
- 錢包連線 + 讀 KGEN 餘額（你/treasury/kufo）
- 擲筊 3 次（每日重置）
- 發財金三層展示
- 還願（transfer）到三地址（含 5000 一鍵）
- 語音客服話術（會講清楚震災/孤兒院/自由民主/孤兒基金池等）
- Debug 面板（所有錯誤可視化）

## 7. Faucet 合約接線點
- index.html 內 FAUCET_CONTRACT 目前空白
- 你部署 Faucet 後，把地址填進去，發財金按鈕就能改成鏈上 igniteAndClaim()
