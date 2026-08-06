# 《18888 靈霄寶殿神明銀行 × KAIOS 文明質量守恆白皮書》
## Celestial Autonomous Bank 18888 × KAIOS Civilization-Mass Conservation Whitepaper
### V1.3 Automatic Burn-Proof Mint & Civilization Vault Edition｜自動燒毀證明鑄造與文明金庫版

---

**文件狀態：** CANONICAL SPECIFICATION / GITHUB EDITION  
**取代版本：** V1.2  
**版本日期：** 2026-08-06  
**創世者與最高 Human Authority：** 樂天帝（PrimeForge）  
**中央銀行座標：** 18888 靈霄寶殿  
**人民銀行座標：** 8888 高老莊  
**特殊實業金融座標：** 8895 雲棧洞  
**悟空心臟座標：** 12345 悟空財神殿  
**文明市場：** 11520 花果山悟空交易所

> NO KGEN BURN, NO KAIOS MINT.  
> CIVILIZATION MASS SHALL BE CONSERVED.

---

# 0. V1.3 改版核心

```text
KAIOS_GENESIS_SUPPLY = 0
KAIOS_MAX_SUPPLY = 720,000,000,000
KAIOS_PER_BURNED_KGEN = 10,000
KAIOS_DISCRETIONARY_MINT = DISABLED
KAIOS_NATIVE_TRANSFER_TAX = 0
KAIOS_NATIVE_BUY_SELL_TAX = 0
KAIOS_TRUE_BURN = DISABLED
```

V1.3 新增：

```text
SYSTEM_AMM_BURN
VOLUNTARY_PLAYER_OFFERING
AUTOMATIC_BURN_PROOF_MINT
NO_PER_TRANSACTION_EMPEROR_APPROVAL
BLACK_HOLE_VAULT
WHITE_HOLE_PURPOSE_VAULT
GENESIS_INSCRIPTION
```

---

# 1. KGEN 與 KAIOS 的宇宙關係

KGEN 是創世宇宙質量：

```text
KGEN_GENESIS_SUPPLY = 72,000,000
KGEN_ADDITIONAL_MINT = PROHIBITED
1 KGEN = 1 kg
```

KAIOS 是文明宇宙的守恆質量與交換能量：

```text
1 KGEN 永久白洞 Burn
→ 10,000 KAIOS Mint
```

這個比例是創世守恆比例，不是市場匯率，也不得由玉帝、八戒、銀行、AI、治理或管理員修改。

---

# 2. KGEN 稅制

一般錢包互轉：

```text
KGEN_TRANSFER_TAX = 0
KGEN_TRANSFER_BURN = 0
```

只有正式 AMM Pair 買入或賣出收取：

```text
TOTAL_AMM_TAX = 0.30%
```

| 流向 | 稅率 |
|---|---:|
| KGEN White-Hole Burn | 0.10% |
| 18888 Celestial Bank | 0.10% |
| LP Gravity Pool | 0.05% |
| Treasure | 0.05% |

---

# 3. 兩種合法 KGEN 白洞來源

## 3.1 系統 AMM Burn

```text
KGEN AMM Buy/Sell
→ 0.10% System White-Hole Burn
→ Unique Burn Proof
→ Automatic KAIOS Mint
→ 18888 Public Civilization Reserve
```

事件至少記錄：

```text
source = SYSTEM_AMM_TAX
pair
transactionHash
logIndex
burnAmount
burnProofId
```

系統辨認的是交易與 Burn Proof，不需將公共交易稅視為個人奉獻。

## 3.2 玩家自願白洞奉獻

玩家必須透過官方白洞合約呼叫，不得把零地址轉帳當成合法證明：

```text
offerKgenToWhiteHole(amount, civilizationId, purposeCode, wishHash)
```

流程：

```text
玩家確認不可逆
→ 官方合約 Burn KGEN
→ 建立唯一 Burn Proof
→ 自動 Mint KAIOS
→ Offering Router 依固定政策分配
→ Merit Registry 記錄香火、功德與文明貢獻
```

事件至少記錄：

```text
source = VOLUNTARY_PLAYER_OFFERING
burner
playerId / civilizationId
purposeCode
wishHash
burnAmount
burnProofId
recipientVault
```

合法 Burn Proof 成立後，KAIOS 自動生成，不需玉帝逐筆同意。

---

# 4. Mint 權力邊界

```text
KAIOS_MINT_AUTHORITY
= VERIFIED_KGEN_BURN_PROOF_ONLY
```

玉帝可以在創世治理中核准官方合約、治理架構與緊急規則，但不得逐筆選人 Mint，也不得輸入任意 Mint 數量。

AI 只能驗證、模擬、稽核與警告，不得持有自由鑄幣權。

同一 Burn Proof 永遠只能使用一次。

---

# 5. KAIOS 接收與分配

系統 AMM Burn 生成的 KAIOS：

```text
100% → 18888 Public Civilization Reserve
```

玩家自願奉獻生成的 KAIOS，不直接返還玩家；由公開固定的 Offering Router 分配至：

```text
指定文明用途 Vault
18888 公共文明儲備
神界／地府／功德／公共建設帳本
```

分配比例不得由管理員逐筆臨時更改；任何版本調整只影響未來新奉獻，且需治理、Timelock 與公開事件。

玩家獲得的是可驗證奉獻紀錄、功德、聲望、任務或資格，不保證現實土地、豪宅、財富、健康或願望實現。

---

# 6. KAIOS 零摩擦主幣

```text
KAIOS_TRANSFER_TAX = 0
KAIOS_BUY_TAX = 0
KAIOS_SELL_TAX = 0
KAIOS_NATIVE_EXCHANGE_FEE = 0
```

外部區塊鏈 Gas、DEX LP 費、滑點、跨鏈橋及第三方平台費仍可能存在。

KAIOS 主代幣不得加入：

```text
blacklist
sell restriction
max wallet
arbitrary pause of normal transfers
owner sweep
arbitrary mint
public burn
```

---

# 7. KAIOS 創造後不再真正 Burn

KAIOS 是文明宇宙守恆質量。創造後只允許：

```text
流通
託管
鎖定
黑洞封存
白洞用途轉換
文明內部帳本轉移
```

禁止：

```text
KAIOS_TRUE_BURN
KAIOS(1)
KAIOS(2)
平行代幣遞迴 Mint
```

零地址與已知死亡地址不屬官方黑洞或白洞。

---

# 8. KAIOS 黑洞

黑洞由獨立 `KAIOSBlackHoleVault` 管理，不放入主幣。

黑洞不等於普通鎖倉；鎖倉只是其中一種模式：

```text
TIME_LOCK_BLACK_HOLE
CIVILIZATION_GESTATION_BLACK_HOLE
PERMANENT_TATHAGATA_BLACK_HOLE
```

黑洞資產仍在 Vault，`totalSupply` 不變。

永久如來黑洞：

```text
NO_WITHDRAW
NO_RELEASE
NO_OWNER_SWEEP
```

黑洞內若形成文明，只能使用內部帳本記錄土地、住宅、工作、公司與 App；總 KAIOS 不得逃離事件視界。

黑洞文明誕生必須同時滿足時間、質量、土地、App、生命、工作與治理門檻，不以單一日期自動誕生。

---

# 9. KAIOS 白洞用途 Vault

白洞由獨立 `KAIOSWhiteHolePurposeVault` 管理。

它不是 KGEN 的 Burn 白洞；此處是 KAIOS 已創造後的不可逆用途轉換：

```text
神界奉獻
地府信用
功德
公共建設
災難救濟
紀念與文化用途
```

KAIOS 不消失，而是從一般流通帳本轉入用途鎖定帳本。原玩家不得取回，管理員不得任意改收款人。

---

# 10. 四個座標的權責分離

## 12345 悟空財神殿

```text
免費許願 = 不 Burn、不 Mint
還願回 Heart = KGEN Heart↔Brain 循環，不 Mint KAIOS
主動白洞奉獻 = 另走官方 KGEN White-Hole Controller
```

## 8888 高老莊人民銀行

負責人民日常帳戶、薪資、支付、正規存貸、工作與生活金融，不承擔 8895 高風險契約。

## 8895 雲棧洞八戒地下錢莊

負責土地、農業、建築、物流、旅宿、抵押、過橋與高風險分潤。額外 0%～100%收益只能來自自有資本、已鎖定準備或實際淨利，不能改 Mint 比例。

## 18888 靈霄寶殿

負責 Burn Proof 驗證、KAIOS 條件鑄造、公共文明儲備、治理、審計與災難恢復；不得為 8895 無條件填補虧損。

---

# 11. 18888 儲備門檻

```text
HARD_FLOOR = 18,888 KGEN
GENESIS_RESERVE = 72,000 KGEN
TARGET_RESERVE = 720,000 KGEN
CONCENTRATION_WARNING = 3,600,000 KGEN
```

KGEN 儲備不是 KAIOS 固定兌回承諾。

---

# 12. 建議合約架構

```text
KAIOSV02_BurnProofGenesis
KGENWhiteHoleController
KAIOSOfferingRouter
KAIOSBlackHoleVault
KAIOSWhiteHolePurposeVault
KAIOSGenesisInscription
CelestialBank18888
PeopleBank8888
YunzhanShadowBank8895
MeritRegistry
BankAuditRegistry
```

KAIOS 主幣只管供應、Mint、Proof 防重播、守恆與短碑文。

---

# 13. 核心不變量

```text
KAIOS_GENESIS_SUPPLY == 0
KAIOS_TOTAL_MINTED == VERIFIED_KGEN_BURNED * 10,000
KAIOS_TOTAL_SUPPLY <= 720,000,000,000
DISCRETIONARY_MINT == 0
BURN_PROOF_USE_COUNT <= 1
KAIOS_TRUE_BURN == 0
NORMAL_TRANSFER_TAX == 0
NO_OWNER_SWEEP
NO_SINGLE_KEY_CONTROL
```

KAIOS 守恆總帳：

```text
TOTAL_CREATED_KAIOS
=
CIRCULATING
+ CELESTIAL_RESERVE
+ BLACK_HOLE_LOCKED
+ WHITE_HOLE_PURPOSE_LOCKED
+ ESCROW
+ OTHER_AUDITED_VAULTS
```

---

# 14. 創世碑文

主幣保存短碑文與碑文 Hash；完整碑文由獨立 `KAIOSGenesisInscription` 合約及 GitHub 文件保存。

不得把長篇銀行、土地、許願或工作規則塞入 Token 合約。

---

# 15. 部署狀態

```text
WHITEPAPER = CANONICAL DESIGN
TOKEN_CODE = REVIEW DRAFT
SIMULATION = AUTHORIZED
TESTNET = NOT AUTHORIZED
MAINNET = NOT AUTHORIZED
AUDIT = REQUIRED
```

主網前必須完成 Solidity 編譯、單元測試、Fuzz、Invariant、攻擊測試、測試網、多簽、Timelock、第三方審計及 Human 最終授權。

---

# 16. 最終天條

> KGEN 是宇宙質量。KAIOS 是文明質量。沒有 KGEN 永久白洞燒毀，就沒有新的 KAIOS。每燒毀 1 KGEN，只能生成 10,000 KAIOS。任何玉帝、神明、人類、AI、銀行或管理員，均不得任意創造 KAIOS。KAIOS 創造後不被消滅，只會流通、封存、鎖定或轉換文明用途。
