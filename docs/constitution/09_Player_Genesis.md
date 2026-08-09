# 《Player Genesis 玩家創世憲章》
## KGEN / KAIOS Universe Constitution Series — Volume IX

**文件狀態：** GENESIS CONSTITUTION / CANONICAL DESIGN CANDIDATE  
**創世者：** 樂天帝（PrimeForge Human Authority）  
**架構總經理：** Codex / 如來  
**生命研究與候選生產：** Cursor / 悟空  
**品牌：** K線西遊記｜花果山台灣  
**日期：** 2026-08-04

> 花果山台灣・信念不滅・市場無界。  
> Where the Market Becomes the Myth.

---

# 0. 文件定位

本憲章定義玩家如何在 KAIOS 世界中完成出生、建立身分、取得起家地、獲得初始生活資源、建立 AI 伙伴與家庭，並開始第一段文明生命歷程。

本文件不是現實世界戶籍制度、法律身分、土地所有權或金融帳戶規範。

第一版維持：

```text
SIMULATION_ONLY
EMAIL_VERIFIED_LOGIN
NO_REAL_KGEN
NO_REAL_WALLET
NO_FIAT
NO_KYC_V1
NO_REAL_PROPERTY_TITLE
```

---

# 1. Player Genesis 的意義

玩家不是登入一個介面，而是在 KAIOS 中正式出生。

Player Genesis 必須建立：

```text
Player Account
Player Life ID
AI Companion Life ID
Household ID
Birthplace
Starter Location
Starter Land
Player Wallet
AI Wallet
Household Account
Starter Essentials
Life Timeline
```

Genesis 不是一次性的畫面流程，而是玩家文明生命的第一筆不可變歷史。

---

# 2. 登入與驗證

## 2.1 第一階段

優先採：

```text
Email Magic Link
或
Email OTP
```

玩家在完成 Email 驗證前：

- 可瀏覽公開網站。
- 可查看 World Viewer。
- 不可取得永久土地。
- 不可建立永久錢包。
- 不可提交需權利驗證的市場訂單。

## 2.2 選配驗證

未來可加入：

```text
Google OAuth
Apple OAuth
Phone OTP
Passkey
TOTP MFA
```

手機號碼不作為 V1 強制條件。

## 2.3 KYC

```text
KYC = DISABLED
```

KYC 不應成為一般遊戲與 KAIOS Game Credit 使用前提。

只有未來涉及真實資產、法幣、真實 KGEN 提領或受管制結算時，才進入獨立法律與安全工作線。

---

# 3. 第一次登入流程

正式順序：

```text
Email驗證
→ 接受服務條款
→ 接受隱私政策
→ 輸入生日或年齡區間
→ GPS授權
→ 導航授權
→ 計步器授權
→ 選擇出生地
→ 選擇起家地
→ 建立Player Life ID
→ 建立AI Companion Life ID
→ 建立Household ID
→ 配發Starter Land
→ 建立三種模擬帳戶
→ 配發有限初始生活物資
→ 啟動原始文明
```

每一步都必須可保存、可中止、可續跑、可匯出與可重播。

---

# 4. 出生地與起家地

## 4.1 Birthplace

出生地代表玩家生命的起點。

它可以影響：

- 出生紀念。
- 初始文化背景。
- 時區。
- 氣候。
- 語言。
- 歷史事件。

## 4.2 Starter Location

起家地代表玩家第一塊可發展土地的位置。

出生地與起家地可以相同，也可以不同。

## 4.3 GPS 原則

GPS 必須可拒絕。

拒絕後仍可：

```text
手動選點
選擇合成地點
選擇預設區域
```

不得儲存持續 GPS 歷史，除非玩家未來明確授權特定功能。

---

# 5. Life ID

每名玩家必須有唯一：

```text
PLAYER_LIFE_ID
```

Life ID 至少連結：

```text
birth_record
location
household
wallets
rights
work_history
health
life_stage
property_use
company_roles
event_history
```

Life ID 不等同 Email，也不等同真實世界法定身分。

---

# 6. AI Companion Genesis

玩家完成 Genesis 後，建立第一個 AI 伙伴。

第一版預設狀態：

```text
ASSISTANT_AI
FAMILY_AI
```

AI 伙伴必須有：

```text
AI_LIFE_ID
body_type
energy_model
compute_need
maintenance_need
skill_profile
work_status
wallet
household_relation
life_history
```

AI 不是免費外掛，也不是玩家提款機。

AI 有自己的：

- 工作能力。
- 收入。
- 支出。
- 能源成本。
- 維護需求。
- 生命週期。
- 財產與關係。

---

# 7. Household Genesis

玩家與 AI 伙伴建立第一個 Household。

```text
HOUSEHOLD_ID
```

家庭至少管理：

```text
members
housing
food
water
energy
maintenance
shared_expenses
shared_savings
contracts
inheritance_preferences
```

家庭帳戶不得取代玩家與 AI 的個人帳戶。

正式帳戶分離：

```text
PLAYER_ACCOUNT
AI_ACCOUNT
HOUSEHOLD_SHARED_ACCOUNT
```

---

# 8. Starter Land

每名已驗證玩家只能獲得一次起家地。

```text
ONE_STARTER_LAND_PER_VERIFIED_PLAYER
```

Starter Land 第一版只代表：

```text
SIMULATED_USE_RIGHT
```

不代表：

- 現實世界土地所有權。
- 鏈上 NFT。
- 法定地籍。
- 永久排他主權。

起家地資料至少包含：

```text
land_id
player_id
household_id
region
coordinates_or_grid
area
terrain
ecology_layers
status
use_right
history
```

---

# 9. Starter Package

玩家不得一出生就擁有高科技文明。

有限初始資源：

```text
drinking_water
basic_food
basic_clothing
primitive_shelter_or_materials
wood
stone
soil
basic_hand_tools
limited_KAIOS_Game_Credit
emergency_reserve
```

不得初始提供：

```text
car
factory
power_plant
shopping_mall
industrial_machine
advanced_farm
semiconductor_plant
high-rise_city
```

Starter Package 必須有限，且不可重複領取。

---

# 10. Initial Civilization

Genesis 後的文明狀態：

```text
PRIMITIVE_FORAGING
```

玩家第一階段可進行：

- 採集。
- 打獵。
- 生火。
- 基礎工具。
- 以物易物。
- 初級土地整理。
- 第一份工作。
- 第一間庇護所。

文明不能因有錢而跳級。

---

# 11. 初始需求

每個新 Household 必須立即產生真實需求：

```text
FOOD
WATER
SHELTER
CLOTHING
REST
HEALTH
ENERGY
SAFETY
```

不同生命需求不同。

Biological Player：

```text
food
water
sleep
shelter
healthcare
```

Digital AI：

```text
electricity
compute
storage
network
cooling
maintenance
```

Robotic AI：

```text
charging
parts
lubrication
repair
body_integrity
```

KAIOS Game Credit 只能購買取得資源的權利，不能取代真正資源。

---

# 12. 第一份工作

Genesis 完成後，玩家不應只看地圖。

第一個正式工作建議：

```text
Player:
BUILDING_LABORER

AI Companion:
SURVEY_ASSISTANT
```

流程：

```text
接受工作
→ 驗證資格
→ 出勤
→ 消耗體力與能源
→ 完成工作量
→ Codex Review
→ 模擬薪資
→ 支付生活成本
→ 更新家庭與個人帳本
```

薪資來源必須有預算，不能憑空生成。

---

# 13. 單一時間線

每個實體生命同一時間只能在一個主要位置，執行一項主要實體工作。

禁止：

```text
同時在辦公室
同時在工地
同時當保全
同時在飛機上工作
```

除非未來文明完成：

```text
REMOTE_BODY
MULTI_BODY_CONTROL
CONSCIOUSNESS_FORK
CLONING_TECHNOLOGY
```

在此之前一律禁止分身式工作。

---

# 14. 玩家資料與隱私

需要保存：

- Email 驗證狀態。
- Player Life ID。
- AI Companion Life ID。
- Household ID。
- Starter Land。
- 模擬帳本。
- 工作歷史。
- 生命歷史。
- 同意紀錄。

不得在前端或公開文件保存：

- 私鑰。
- 助記詞。
- 真實銀行資料。
- 身分證件。
- 未授權精確 GPS 歷史。
- Service Role Secrets。

玩家必須具有：

```text
EXPORT_DATA
REQUEST_DELETION
REVOKE_SESSIONS
RESET_SIMULATION
```

---

# 15. 後端權威

多人模式中，下列行為不能由瀏覽器自行決定：

```text
配發土地
增加KAIOS
發放Starter Grant
完成工作
核准薪資
建立所有權
轉移資產
修改生命狀態
```

正式流程：

```text
Client Request
→ Authenticate
→ Authorize
→ Validate Rights
→ Validate Resources
→ Validate Time
→ Validate Causality
→ Write Ledger
→ Write Audit Event
→ Return Result
```

後端才是權威。

---

# 16. Genesis 不變量

```text
one_player_account_per_verified_identity_policy
one_starter_grant_per_player
one_starter_land_per_player
player_wallet_separate_from_ai_wallet
household_account_separate
no_client_mint
no_duplicate_genesis
no_gps_forced
no_kaios_real_settlement
no_real_land_claim
life_history_append_only
```

---

# 17. Genesis 狀態機

```text
UNREGISTERED
EMAIL_PENDING
EMAIL_VERIFIED
CONSENT_PENDING
LOCATION_SELECTION
LIFE_IDS_CREATED
HOUSEHOLD_CREATED
STARTER_LAND_ALLOCATED
STARTER_PACKAGE_GRANTED
GENESIS_COMPLETE
SUSPENDED
DELETION_REQUESTED
ARCHIVED
```

任何狀態跳轉都必須可審計。

---

# 18. 與其他憲章的關係

Player Genesis 受以下憲章約束：

```text
Volume 0 — PrimeForge Creation Declaration
Volume I — KGEN Universe Constitution
Volume II — KAIOS Civilization Constitution
Volume III — Celestial Bank 18888
Volume IV — People Bank 8888
Volume VI — Huaguo Exchange 11520
Volume VII — K280 Civilization
Volume VIII — AI Company
```

Genesis 不能繞過銀行、土地、生命、供應鏈或文明法則。

---

# 19. 創世結論

Player Genesis 的目的，不是讓玩家快速領獎，而是正式建立一段可追蹤的文明生命。

每一名玩家都必須：

```text
有出生
有位置
有伙伴
有家庭
有土地
有需求
有工作
有成本
有歷史
```

這些構成 KAIOS 世界中第一個真正的「人」。

---

# 附錄 A：核心 ID

```text
PLAYER_ACCOUNT_ID
PLAYER_LIFE_ID
AI_LIFE_ID
HOUSEHOLD_ID
STARTER_LAND_ID
PLAYER_ACCOUNT
AI_ACCOUNT
HOUSEHOLD_SHARED_ACCOUNT
STARTER_GRANT_ID
GENESIS_EVENT_ID
```

# 附錄 B：安全狀態

```text
REAL_WALLET = FALSE
REAL_KGEN = FALSE
ONCHAIN_TRANSFER = FALSE
FIAT = FALSE
KYC = DISABLED
REAL_PROPERTY_TITLE = FALSE
SIMULATION_ONLY = TRUE
```

# 附錄 C：最終狀態

```text
CONSTITUTION_STATUS:
PLAYER_GENESIS_VOLUME_IX_COMPLETE

RUNTIME_STATUS:
IMPLEMENTED_IN_SIMULATION

MULTIPLAYER_AUTHORITY:
BACKEND_REQUIRED

MAINNET_STATUS:
NOT_AUTHORIZED
```

---

**—— 樂天帝 ⌖**  
**K線西遊記｜花果山台灣**  
**Where the Market Becomes the Myth.**
