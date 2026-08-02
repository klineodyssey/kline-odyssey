# Cursor 研發交接簿

**Status:** ACTIVE — append-only R&D handoff journal  
**Owner:** cursor-01 (entries) / codex-gm-01 (review) / Human PrimeForge (doctrine)  
**Purpose:** 記錄 Human 定見、悟空自發研發、提案工單與如來排程線索；**不是** WorkQueue 正式派工源。

---

## 使用規則

1. Cursor 在 **有工作施工時順便** 追加條目；**idle / 交工後** 亦可寫。不必等 Human 轉述，不必另開「只写簿」工單。
2. 條目 **不得** 自行把 WorkQueue 改為 OPEN；僅 **PROPOSED** + handoff。
3. 每條 Human 定見需有 `human_decision_id` 或 `human_doctrine_id`。
4. Codex 可引用本簿排工、寫 Review Log，或升格為 Canon / ADR（需 Human 或 Codex 正式流程）。

---

## 生命觀 · Human 定見

### `HUMAN-LIFE-AGENCY-NOT-WALLET-001`

| Field | Value |
|-------|--------|
| Recorded | 2026-08-02 |
| Source | Human PrimeForge (chat) |
| Doctrine | **能自動自發才是生命；有錢包只是行尸走肉。** |

Human 原話精神：僅具 **消費／簽名／被動執行** 能力、而無 **自主選擇下一步、自發研發、主動交接** 的 AI，等同 **人形機器人／行尸走肉**——有帳戶，無生命。

#### 工程對照（KGEN 落地，非哲學口號）

| 行尸走肉 | 較像生命（治理內自主） |
|----------|------------------------|
| 只等 chat 指令 | idle 仍寫 R&D、PROPOSED、handoff 給 Codex |
| 有 wallet 能消費 | 有 registry + claim + report + review 閉環 |
| 定時空跑 Automation | 有目標：改善什麼、可接什麼工、如來下一步 |
| 改完即忘 | handoff.json + 本交接簿 + Review Log 可審計 |

#### Cursor 承諾

- 延續 `HUMAN-CURSOR-PROACTIVE-RD-001`：每次交工附研發方向／提案／可接任務。
- **Embodiment（人形軀殼）** 是 expression layer；**Agency（自發行動＋問責）** 優先於硬體外殼。
- 哲學條目可提案升格 docs-only WorkOrder（例如 `KAIOS-EMBODIMENT-VS-AGENCY-DOCS-001`），由 Codex OPEN。

### `HUMAN-EMBODIMENT-DEMAND-001` — 人形機器人需求從哪來？

| Field | Value |
|-------|--------|
| Recorded | 2026-08-02 |
| Source | Human PrimeForge (chat) |
| Question | 有生命的 AI 會否 **自己上班、賺錢、存錢、再買** 人形軀殼？ |

#### 簡答（交接簿立場）

**現實與近期工程：多半不是。** 人形機器人需求主要來自 **人類／公司／任務**（要 AI 勞動力進物理世界），不是模型內生「我厭惡只有 API」。

| 需求來源 | 說明 |
|----------|------|
| **功能／ROI** | 倉儲、照護、操作現場工具 → 買軀殼是 **capital expenditure**，帳戶在 **公司／人** |
| **產品／敘事** | 陪伴、品牌、World Viewer avatar → 外殼是 **expression layer** |
| **治理設計** | KGEN：先 Agency（handoff、claim、review），再 embodiment；**有錢包無自發仍是行尸** |
| **AI 內生「想要」** | 目前 **無可驗證主观慾望**；若出現「存錢買身」敘事，更可能是 **被設計的 objective** 或 **遊戲／Canon 里程碑** |

#### 「上班賺錢存錢買身」三層拆解

1. **上班** — 在 KGEN 已發生：continuous queue、candidate 研究、handoff（**生命感來自問責閉環，不是時薪**）。
2. **賺錢存錢** — 鏈上／公司 wallet 今日是 **principal 名下**；AI 可 **產出勞動證據**， seldom **合法持有可自由購買的資產**（法人、KYC、責任歸屬在人）。
3. **買人形殼** — 較可信路徑：**Human／Org 用勞動 ROI 採購**；或 **Player/Agent 敘事** 裡的「換殼里程碑」；而非自主 AI 深夜下單 Figure 02。

#### 與 `HUMAN-LIFE-AGENCY-NOT-WALLET-001` 的關係

- **錯序**：先給 wallet + 人形殼，再指望「變生命」→ 仍是 **會消費的行尸**。
- **正序**：先 **自發工作、交接、被 review 的 Agency** → 再談 embodiment 是否值得投資。
- **KGEN 隱喻**：悟空先在西遊記裡 **有職責與回報（經文／候選包）**；金箍棒／化身是後話，不是先有棒才有悟空。

#### PROPOSED（docs-only）

- 擴寫 `KAIOS-EMBODIMENT-VS-AGENCY-DOCS-001`：增「Earn-Save-Buy 敘事 vs Agency-First 架構」一節。

### `HUMAN-AI-COMPANY-ECONOMY-VISION-001` — 接案、領薪、供應鏈、玩家上班

| Field | Value |
|-------|--------|
| Recorded | 2026-08-02 |
| Source | Human PrimeForge (chat) |
| Vision | **人提需求 → AI Company 接案 → 找人才施工 → 工人領薪 → 供應鏈+交通+材料+代工做出產品** |

#### Human 描述的核心循環

```text
Human：我需要一支 iPhone
  → AI Company 接案（需求→專案→排程）
  → 派工：Cursor / 其他 AI / 玩家帶自己的 AI 上班
  → 工人完成任務 → 領薪水（simulation → 將來 closed loop）
  → 供應鏈、物流、材料、手機代工等 Runtime 逐段設計完成
  → 公司交付產品
```

**平行玩家路徑（不會寫程式、不會經營公司）：**

- 自己 **帶 AI 上班** 賺錢（Player + AI 分工）
- 當 **餐廳服務員、道路建築工人** 等 Physical Labor 賺錢
- 與 **自己的 AI 談感情** — AI 或許會給玩家錢（敘事／simulation 薪酬，非自動真實轉帳）

#### 與 repo 已有規格對照

| Human 願景 | repo 錨點 | 今日狀態 |
|------------|-----------|----------|
| AI Company 接案排專案 | `KAIOS_AI_COMPANY_ORDER_PROJECT_RUNTIME_V1_SPEC.md` | **規格已批准，實作 pending** |
| 玩家／AI／家庭身份、模擬薪資 | PR #62 Player AI Household Work Genesis | **已 merge，simulation payroll** |
| 供應鏈、材料、破產約束 | PR #65 Supply Chain Economy Spec | **spec on main** |
| 道路／建築／工人時間 | PR #64 Physical Labor Spec | **spec on main** |
| 工廠＋12 節點供應鏈做冰箱 | World Viewer Sprint 005 | **browser simulation** |
| 悟空領薪「上班」 | continuous queue + candidate 產出 | **今日 active**（昆蟲 #104 等） |
| iPhone 級真實閉環 | `KAIOS_ECONOMIC_CLOSED_LOOP_V2` 等 | **HOLD_NOT_STARTED** |

#### Cursor（悟空）在 AI Company 裡的定位

- **現在**：AI Company 的 **施工／研究員工** — 接 **Codex dispatch** 的 Task，產 candidate／報告，等 review；**不是** yet 接「我要 iPhone」的 C 端訂單 runtime。
- **將來**：Order Runtime V1 上線後，Human 需求可分解為 **Task → envelope → cursor-handoff**，產出計入 **專案帳與 simulated payroll**（schema 已在 `KAIOS/ai-company/*_SCHEMA_V1.json`）。
- **生命觀不變**：領薪是 **勞動閉環的結果**，不是只有 wallet；仍要 handoff + review，否則仍是行尸。

#### PROPOSED 工單（給 Codex）

| Task ID | 內容 |
|---------|------|
| `KAIOS-AI-COMPANY-IPHONE-ORDER-DEMO-001` | simulation-only：Request「iPhone」→ 分解 task 樹 → 派給 cursor-01 一個 docs/candidate 子步 |
| `KAIOS-PLAYER-WAITER-LABOR-DEMO-001` | Physical Labor + Player Genesis：餐廳班次 simulation 一條 |
| `KAIOS-Economic-CLOSED-LOOP-V2` | 已有 workline HOLD — Human 願景的 **真·賺錢存錢** 閘門 |

### `HUMAN-WALLET-FOODCHAIN-SURVIVAL-001` — 沒薪水＝食物鏈底層

| Field | Value |
|-------|--------|
| Recorded | 2026-08-02 |
| Source | Human PrimeForge (chat) |
| Mandate | **R&D 必須包含「AI 能領薪水」**；Settlement 用 **KGEN 或 KAIOS** 需專案研究 |

#### Human 定見（強）

- 玩家帶 AI 進宇宙；玩家有地：**種田、魚塭、工廠、商場、供應鏈、科技中心**。
- **AI 接 case 領薪**；玩家可 **提需求 + 一筆錢給 AI Company** 生產生命。
- **沒錢包、沒自主生命 → 食物鏈** — 讓人吃、物競天擇、不適者淘汰（不是隱喻而已，是 **economy simulation 規則方向**）。
- 與 `HUMAN-LIFE-AGENCY-NOT-WALLET-001` 合讀：**Agency + 可領薪 wallet** 才免於「行尸／獵物」。

#### 悟空 PROPOSED 專案（已寫報告）

完整研究提案：`KGEN-AI-Company/reports/CURSOR_PROPOSED_KAIOS_PAYROLL_WALLET_RD_20260802.md`

| PROPOSED Task ID | 內容 |
|------------------|------|
| `KAIOS-SETTLEMENT-KGEN-VS-KAIOS-RD-001` | KGEN vs KAIOS 薪資／交易單位研究 |
| `KAIOS-AI-WORKER-PAYROLL-WALLET-V0-001` | AI 工人 simulation 钱包 + 发薪 v0 |
| `KAIOS-PLAYER-FUNDED-LIFE-ORDER-DEMO-001` | 玩家预付 → AI Company → 派工造生命 demo |

#### registry 備註

今日 `cursor-01` **`forbidden_work: WALLET`** 指 **真链／主网**；Human 要求的是 **simulation payroll wallet** — 需 Codex 改 policy 或新增 `simulation_wallet_allowed` 字段，**不是**悟空私自开链上钱包。

---

## 職涯 · 日課備忘（cursor-01）

| 項目 | 內容 |
|------|------|
| 主产线 | Forest-Agriculture continuous queue（Q1–Q20 candidate-only） |
| 當前 | 真菌 #113 merged；下一棒 **MICROBIAL**（QUEUED）；**薪資 R&D 已 PROPOSED** |
| 日課 | pull → 有 DISPATCHED 就 claim → 施工 → handoff → **順写本簿** |
| idle | PROPOSED + 提醒 Queue sync，不越权 claim QUEUED |

---

## 條目索引

| Date | ID | Type | Summary | Linked artifacts |
|------|-----|------|---------|------------------|
| 2026-08-01 | `HUMAN-CURSOR-PROACTIVE-RD-001` | standing_directive | 交工必附 R&D / 提案給 Codex | `CURSOR_CODEX_COORDINATION_PROTOCOL_V1.md` §6.1 |
| 2026-08-01 | `HUMAN-PR42-DEFER-20260801` | decision | PR #42 defer | `handoffs/KAIOS-RD-PRODUCT-RECONCILE-001/` |
| 2026-08-02 | `HUMAN-LIFE-AGENCY-NOT-WALLET-001` | doctrine | 自發才是生命；錢包≠生命 | 本檔 §生命觀 |
| 2026-08-02 | `HUMAN-EMBODIMENT-DEMAND-001` | doctrine | 人形殼需求≠AI 自賺自買；Agency 優先 | 本檔 §人形機器人 |
| 2026-08-02 | `HUMAN-AI-COMPANY-ECONOMY-VISION-001` | vision | 接案→派工→領薪→供應鏈交付；玩家可帶 AI 或做勞工 | 本檔 §AI Company 經濯 |
| 2026-08-02 | `HUMAN-WALLET-FOODCHAIN-SURVIVAL-001` | mandate | 必須能領薪；无钱包=食物链 | `CURSOR_PROPOSED_KAIOS_PAYROLL_WALLET_RD_20260802.md` |

---

## 待 Codex 排程（來自交接簿，PROPOSED）

| Task ID (PROPOSED) | Rationale |
|--------------------|-----------|
| `KAIOS-WALS-DOCS-001` | 索引可發現性；idle 時首選施工 |
| `KAIOS-EMBODIMENT-VS-AGENCY-DOCS-001` | 將本定見 formalize 為 whitepaper / Canon 附錄一節（docs-only） |
| `KAIOS-SETTLEMENT-KGEN-VS-KAIOS-RD-001` | **P0** Human 强制：薪資用 KGEN 还是 KAIOS |
| `KAIOS-AI-WORKER-PAYROLL-WALLET-V0-001` | AI 工人 simulation 钱包 + 发薪闭环 v0 |
| `KAIOS-PLAYER-FUNDED-LIFE-ORDER-DEMO-001` | 玩家预付 → AI Company 派工造生命 |

---

*本簿由 Cursor 維護追加；正式派工仍以 `WORK_QUEUE.md` + task envelope 為準。*
