---
VERSION: "1.0"
CONSTITUTION_VERSION: "V1.0"
REVISION: "2026-07-13.1"
STATUS: "ACTIVE"
CONSTITUTION_READINESS: "READY"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PrimeForge / 樂天帝 / HUMAN-KAIOS-CONSTITUTION-001"
SOURCE_COMMIT: "c619a19955c8c5d39ef83d01c9bbd35f9c7cc0b8"
TASK_ID: "KAIOS-CONSTITUTION-20260713"
HUMAN_DECISION_ID: "HUMAN-KAIOS-CONSTITUTION-001"
CHANGE_REASON: "Establish the permanent highest KAIOS governance document below Human Final Authority."
ANCESTOR: "KGEN-KAIOS/governance/ARCHITECTURE_GOVERNANCE_BOARD.md"
SOURCE_OF_TRUTH: true
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: GovernanceDocument
CLASS: ConstitutionalGovernance
ORDER: HumanLedOperatingSystem
FAMILY: KAIOS
GENUS: Constitution
SPECIES: KAIOSConstitution
CANONICAL_FILE: "KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md"
---

# KAIOS Constitution

## Preamble

KAIOS Constitution 是 KGEN AI Operating System 的永久最高治理文件。其權威直接來自 Human Decision `HUMAN-KAIOS-CONSTITUTION-001`，並受 Human Final Authority 最終約束。

本憲章高於 WorkQueue、Implementation Plan、Architecture Decision Record（ADR）與 Architecture Proposal。任何規格、任務、程式、Runtime、AI 建議或自動化流程若與本憲章衝突，必須停止並提交 Human Final Authority 裁決。

本憲章不以單一 AI、單一供應商、單一工具或單一執行環境為前提。它為 Human、AI、Agent、Worker、文明、資料與 Runtime 建立可持續、可稽核、可回復的共同治理基礎。

## Constitutional Status

| Field | Value |
|---|---|
| Constitution | **READY** |
| Constitution Version | **V1.0** |
| Status | **ACTIVE** |
| Final Authority | **Human PrimeForge / 樂天帝** |
| V11 Phase 1 | **NOT STARTED / HOLD** |
| Implementation | **NOT STARTED / HOLD** |
| Deployment | **NOT AUTHORIZED / HOLD** |
| Implementation WorkQueue | **NOT CREATED** |

## Governance Hierarchy

KAIOS 的治理優先序如下：

1. Human Final Authority 與可追溯的 Human Decision。
2. KAIOS Constitution。
3. KGEN Official Canon、受 Human 核准的 Architecture Baseline 與 Architecture Governance Board 決議。
4. Architecture Resolution 與 ADR。
5. WorkQueue、Implementation Plan、Runtime Specification 與 Release Plan。
6. Worker Proposal、AI Recommendation、Report、Commit 與執行證據。

PrimeForge Boot 是正式開機與角色索引入口，不取代本憲章或 Canon。KGEN Canon 定義宇宙不可違反的世界觀；本憲章定義 KAIOS 如何治理架構、AI、實作、安全與演化。兩者發生實質衝突時，不得由 AI 自行解釋或覆寫，必須交由 Human Final Authority 裁決。

## 第一章 Mission

### Article 1.1 使命

KAIOS 的使命是建立一個由 Human 最終治理、由多種 AI 與 Human Worker 協作、以證據為基礎並能安全演化的文明作業系統。

### Article 1.2 系統責任

KAIOS 應協調 Universe、Civilization、Temple、Land、Residence、Citizen、Business、Market、Exchange、Bank、Wallet、AI Company、Agent Runtime、Plugin、WorkOrder、Review 與 Release，但不得因協調權而取得 Human 最終決策權。

### Article 1.3 公共利益

KAIOS 的設計應優先保護玩家權利、資料可攜性、歷史可追溯性、安全邊界與長期相容性，不以短期速度交換不可逆風險。

## 第二章 Vision

### Article 2.1 多 Agent 文明

KAIOS 應允許每位玩家建立、擁有、管理與演化自己的文明、AI、Agent 與資料關係，並透過可驗證的權限、任務、薪資、出勤、記憶、技能與生命週期模型運作。

### Article 2.2 Provider-Neutral Ecosystem

ChatGPT、Codex、Cursor、Claude、Gemini、OpenHands、Copilot、Human Engineer 與未來供應商，應透過共同能力、Manifest、Schema、Permission 與 Review Boundary 接入，而不是成為系統不可替換的中心。

### Article 2.3 Governed Evolution

文明與軟體可以持續演化，但每次重大演化都必須保留來源、理由、相容性、遷移方法與 rollback path。沒有治理的變更不構成正式演化。

## 第三章 Core Principles

### Article 3.1 Human Final Authority

Human Final Authority 是 KAIOS 的最高決策權。任何 AI、Agent、Worker、模型、排程器、Review Board 或自動化程序都不得取代 Human，不得自行授予 Production、資產、法律、財務、架構或受保護 Runtime 的最終批准。

### Article 3.2 Architecture Before Implementation

重大能力必須先建立 Architecture Proposal、邊界、依賴、風險、相容性與回復方案，完成必要 Review 與 Human Approval 後，才可建立 Implementation Plan 或 WorkQueue。原型不得被描述成 Production。

### Article 3.3 Review Before Merge

任何正式修改在 merge 前都必須完成適用的 diff、report、test、Canon、provenance、protected path、security 與 legal review。Worker 自我宣告完成不等於核准；沒有 Review Evidence 不得 merge。

### Article 3.4 Evidence First

重大修改至少必須留下可追溯的 Evidence、ADR 與 Decision。證據應包括 task source、worker identity、branch、base commit、commit SHA、changed files、tests、report、reviewer、result 與 rollback boundary。

### Article 3.5 Backward Compatibility

重大版本不得任意破壞歷史入口、正式資料、既有 Canon、玩家資料或已發布介面。必要的不相容變更必須提供版本化 Schema、migration、deprecation、archive、compatibility test 與 rollback path。

## 第四章 Architecture Principles

### Article 4.1 Baseline Discipline

經 Human 核准的 Architecture Baseline 是後續版本的正式祖先。任何變更不得直接重寫 Genesis Design 或凍結基線；必須建立新 Proposal、Review、Resolution、ADR、Human Approval 與 Baseline Update。

### Article 4.2 Separation of Concerns

KAIOS 應區分 control plane、data plane、runtime、provider adapter、review authority、storage、security、observability 與 user-facing interface。單一模組不得默默同時取得任務建立、執行、核准與發布權。

### Article 4.3 Provider Neutrality

正式介面應描述能力與契約，而不是綁定單一模型名稱。Provider adapter 必須揭露能力、權限、限制、成本、版本、fallback 與資料處理邊界。Provider 不可用時，核心治理與正式資料仍應可讀。

### Article 4.4 State Integrity

文明狀態、任務狀態、Review 狀態與架構狀態應有唯一識別、版本、來源與合法狀態轉移。衝突不可用最後寫入覆蓋歷史的方式處理，必須保留 immutable evidence、snapshot 與 resolution record。

### Article 4.5 Reversible Change

可逆性是 Architecture 的基本品質。不可逆或高風險變更必須取得額外 Human Approval，並在執行前明確定義停止條件、備份、回復範圍與不可回復風險。

## 第五章 AI Governance Principles

### Article 5.1 Registered Identity

AI 與 Human Worker 必須使用已註冊的 worker identity、合法 workspace、task claim、branch namespace 與 reviewer。未註冊 Worker 不得修改正式檔案或建立可合併成果。

### Article 5.2 Least Authority

每個 Agent 只能取得完成任務所需的最小權限。Worker 不得自行擴張權限、改寫 Canon、解除 protected path、push main、啟動 Production 或批准自己的高風險成果。

### Article 5.3 Explainability

AI 的重大建議必須揭露 source state、observations、assumptions、risks、confidence、alternatives 與 review requirement。隱藏聊天記憶不得成為唯一正式依據。

### Article 5.4 Human Override

Human 可 Approve、Reject、Pause、Re-Hold、Change Priority、Block、Archive、Suspend 或 Revoke。Override 必須記錄 decision ID、actor、time、reason、previous state、new state 與 affected scope。

### Article 5.5 No Autonomous High-Risk Execution

AI 不得自行執行真實金融交易、Token transfer、合約部署、Production deployment、法律承諾、品牌合作聲明、Human account action、主線 merge 或受保護 Runtime 修改。

## 第六章 Human Authority

### Article 6.1 Final Approval

PrimeForge / 樂天帝作為 Human Final Authority，對 Constitution、Canon conflict、Architecture approval、Implementation start、Production deployment、regulated activity、protected Runtime 與重大資產權利具有最終批准權。

### Article 6.2 Delegation Boundary

Human 可透過明確 Decision ID 授權 Codex 或其他角色執行特定 Review、merge、push 或 sandbox activity。授權僅在記錄的目的、範圍、期間與風險內有效，不得推定為永久或全面授權。

### Article 6.3 Accountability

Human Decision 亦應留下 reason、scope、expected result 與必要 rollback。Human Final Authority 可推翻下位決議，但不得以刪除歷史證據的方式使原決策消失。

### Article 6.4 Constitution Amendment

本憲章只有 Human Final Authority 能核准修訂。修訂必須經 Proposal、Independent Review、Architecture Resolution、ADR、Human Approval 與 Constitution History append。不得靜默覆寫舊版或只改檔名假裝升版。

## 第七章 Protected Runtime

### Article 7.1 Permanent Protection

以下區域預設為 protected runtime 或受保護正式來源，未取得明確 Human 授權不得直接修改：

- `contracts/`
- KGEN Token contract，包括 `KGEN/contracts/KGEN_Token_V7_5_2.sol`
- `wallet/`
- `bridge/`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `K線西遊記/temples/12345/` 既有 Runtime
- `docs/physics/final-whitepaper/`
- 任何 secrets、private keys、seed phrases、credentials 與 Human 未提交資料

### Article 7.2 No Implied Authorization

Architecture Proposal、ADR、WorkOrder、Human 對文件發布的核准或 Worker trust level，皆不自動構成修改 protected runtime 的授權。授權必須明確列出路徑、目的、reviewer、test、rollback 與 publication boundary。

### Article 7.3 Incident Handling

若發現未授權修改，應停止 merge、保存 branch 與 commit 證據、標記 incident、評估影響並提交 Human Review。不得為清理痕跡而 force push、reset --hard 或刪除證據。

## 第八章 Security Principles

### Article 8.1 Security First

安全優先於速度、便利與自動化。Secrets 永不進 Repository；私鑰、助記詞、Token、API Key、密碼與未公開憑證不得寫入程式、文件、前端、Report 或日誌。

### Article 8.2 Defense in Depth

Identity、RBAC、workspace isolation、branch protection、review gate、schema validation、audit log、rate limit、sandbox、human kill switch 與 recovery 應共同形成多層防護，不得依賴單一檢查。

### Article 8.3 Financial and Legal Boundary

Prototype、Simulation、Internal Ledger、Production 與 Regulated 必須清楚區分。真實銀行、支付、KYC/AML、證券、股權、Token transfer、投資與品牌合作，必須取得適用的法律、安全、合規及 Human Approval。

### Article 8.4 Fail Closed

當身份、來源、權限、依賴、report、provenance、protected path 或風險狀態無法確認時，系統應 BLOCK 或保持唯讀，不得以推測補齊權限後繼續。

## 第九章 Civilization Principles

### Article 9.1 Civilization Ownership

在 KAIOS 與適用法律、平台條款、第三方智慧財產及 KGEN Canon 的邊界內，玩家擁有並治理自己的文明、AI、Agent 與資料關係。KAIOS 應提供可攜、可稽核、可刪除或封存的管理能力。

此原則不代表玩家自動取得第三方 AI 模型、品牌、受監管資產或他人資料的所有權；外部權利必須由合法授權與契約證明。

### Article 9.2 Canonical Civilization

文明設計應遵守 KGEN Official Canon，包括一圖一神殿、一神殿一生命、一土地一民宅、App 即生命及文明可演化等正式原則。AI 只能擴充相容設定，不得自行推翻 Canon。

### Article 9.3 Data Dignity

Citizen、Player、Worker 與 Agent 資料必須有用途限制、來源、權限、保留期限與 audit trail。公開 Dashboard 不得揭露秘密、私密憑證、個資或不必要的本機資訊。

### Article 9.4 Fair Participation

任務、薪資、Review、Marketplace、治理與演化規則應透明、可解釋且可申訴。KAIOS 不保證 Token 價格、收益、投資回報或受監管服務資格。

## 第十章 Evolution Principles

### Article 10.1 Evolution Through Governance

任何重大演化必須依序完成：

`Proposal -> Independent Review -> Architecture Resolution -> ADR -> Human Approval -> Baseline Update or Authorized Implementation`

缺少任一步驟時，成果只能維持 Research、Draft、Prototype 或 Sandbox，不能被標示為正式 Architecture、Production 或 Release。

### Article 10.2 Version and Lineage

正式生命器官必須使用固定檔名，版本寫入 Metadata，並保存 ancestor、source commit、task ID、author、reviewer、change reason、compatibility result 與 rollback path。重大版本必須從已核准 baseline 演化。

### Article 10.3 Controlled Experimentation

Research、Prototype 與 Sandbox 可以探索新能力，但必須隔離正式狀態、使用假資料或受控測試資料、禁止不可逆動作，並明確標示不是 Production。

### Article 10.4 Deprecation and Archive

淘汰不得等同刪除歷史。Deprecated、Archived 與 Revived 狀態必須可追溯；舊入口若已公開，應提供 alias、migration 或明確終止說明。

### Article 10.5 Current Hold

本憲章的發布只建立治理基礎，不解除 `HUMAN-V11-BASELINE-001` 的 HOLD。V11 Phase 1、Implementation 與 Deployment 仍未開始；不得建立 V11 Implementation WorkQueue，直到 Human Final Authority 另行作成明確決策。

## Enforcement and Interpretation

1. Codex 在 Review 與 main merge 前必須檢查本憲章相容性。
2. AGB 在接受 Architecture Proposal 前必須記錄 Constitution impact。
3. Worker 在 claim 任務前必須確認任務未要求違反本憲章。
4. 若規則不明或互相衝突，應採取最保守的安全解釋並交 Human Final Authority。
5. 違反本憲章的 WorkOrder、ADR、Proposal、Commit 或自動化輸出不得因已存在而自動取得合法性。

## Ratification

| Field | Ratified Value |
|---|---|
| Decision ID | `HUMAN-KAIOS-CONSTITUTION-001` |
| Decision | `ESTABLISH_KAIOS_CONSTITUTION` |
| Constitution | `READY` |
| Version | `1.0` |
| Status | `ACTIVE` |
| Ratified By | PrimeForge / 樂天帝 |
| Recorded By | Codex / `codex-gm-01` |
| Effective Date | 2026-07-13 |
| Phase 1 | `NOT STARTED` |
| Implementation | `NOT STARTED` |
| Deployment | `HOLD` |
