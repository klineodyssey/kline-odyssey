---
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: ACTIVE / APPROVED
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PrimeForge / 樂天帝 / HUMAN-AGB-APPROVAL-001"
SOURCE_COMMIT: "0bb29a46bbe163ef0eb8c36bb8f1c81b0087746f"
TASK_ID: "KAIOS-AGB-20260713"
CHANGE_REASON: "Establish a single architecture governance board and evidence-based review path before any implementation begins."
ANCESTOR: "KGEN-KAIOS/V11/ARCHITECTURE_REVIEW_RESOLUTION.md"
SOURCE_OF_TRUTH: true
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: GovernanceDocument
CLASS: ArchitectureGovernance
ORDER: ArchitectureReviewBoard
FAMILY: KAIOS
GENUS: Governance
SPECIES: ArchitectureGovernanceBoard
CANONICAL_FILE: "KGEN-KAIOS/governance/ARCHITECTURE_GOVERNANCE_BOARD.md"
---

# KAIOS Architecture Governance Board (AGB)

## 1. Status

| Field | Value |
|---|---|
| Architecture Governance Board | **APPROVED** |
| Implementation | **NOT STARTED** |
| V11 Phase 1 | **NOT STARTED** |
| Production | **NOT AUTHORIZED** |
| Human Review | **APPROVED FOR GOVERNANCE PUBLICATION ONLY** |
| Final Authority | Human PrimeForge / 樂天帝 |

AGB 是 KGEN / KAIOS 既有治理體系中的 Architecture gate，不是另一間公司，也不是新的 Runtime。它負責把重大架構提案轉成可追溯的 Review、Resolution 與 ADR，再交由 Human PrimeForge 作最終批准。

Human Approval `HUMAN-AGB-APPROVAL-001` 只批准本治理制度發布。它不批准 V11 Phase 1 Planning、Implementation、Production 或任何 protected-path 變更。

## 2. Mandate

下列重大變更必須先經 AGB：

- KAIOS control plane、data plane、Runtime、worker orchestration 或 review authority 變更。
- Canon hierarchy、正式 state machine、全域 ID、schema compatibility 或 database boundary 變更。
- Tenant isolation、RBAC、security boundary、secret handling 或 protected-path policy 變更。
- Provider adapter、plugin capability、API contract、scheduler、queue、sharding 或 recovery model 變更。
- Production deployment、main merge authority、wallet、payment、banking、exchange settlement 或 regulated boundary 變更。
- 會影響多個 Library、版本遷移、資料相容性或 rollback 能力的架構調整。

拼字、已知連結、內容不變的格式修正可沿既有低風險 WorkOrder 流程處理；一旦改變正式行為、權限、狀態或資料契約，就必須進入 AGB。

## 3. Board Members

### 3.1 Human PrimeForge / 樂天帝

- **Role:** Chief Architect
- **Authority:** FINAL APPROVAL
- **AGB Status:** `ACTIVE_FINAL_AUTHORITY`
- **Responsibilities:** 決定架構方向、接受或拒絕 Resolution、批准 Implementation Planning、批准 Production 或高風險行動。
- **Boundary:** Human approval 必須以可追蹤的 approval ID、時間與範圍記錄，不以模糊聊天記憶代替。

### 3.2 ChatGPT

- **Role:** System Architect
- **AGB Status:** `ACTIVE_ADVISORY_ARCHITECT`
- **Authority:** Architecture Proposal、World Model、Governance、Runtime Design。
- **Boundary:** ChatGPT 是已啟用的 advisory architecture role，不是 repository Worker。它沒有 repository write、commit、merge、push、protected-path 或 implementation-start 權限。提案必須由 Human 轉交，再由 Codex 存檔、驗證並建立 ADR。

### 3.3 Codex

- **Role:** Implementation Architect
- **AGB Status:** `ACTIVE_IMPLEMENTATION_ARCHITECT`
- **Authority:** Implementation Planning、ADR、Schema、Runtime design translation、review evidence integration。
- **Registered Identity:** `codex-gm-01`。
- **Boundary:** Codex 可建立提案與 ADR，但不能代替 Human 作最終 Architecture approval。main merge 權限不等於 Architecture approval 權限。

### 3.4 Grok

- **Role:** Independent Architecture Reviewer
- **AGB Status:** `ACTIVE_EXTERNAL_REVIEWER`
- **Authority:** Independent Technical Review、Risk Assessment、Scalability Review。
- **Employment Status:** External review source; not a registered KAIOS worker unless separately onboarded.
- **Boundary:** No claim, no repository write, no merge authority, no main push authority, no Production authority. Review 必須由 Human 或 Codex 以來源證據匯入。

### 3.5 Future Members

Claude、Gemini、OpenHands、GitHub Copilot 與 Research AI 可在未來加入 Review Registry，目前一律為 `REGISTERED_NOT_ACTIVATED`。列名不等於在職、上班或有權限；啟用前必須完成 Worker registration、Boot acknowledgment、permission assignment 與 conflict-of-interest 檢查。

## 4. Required Architecture Flow

```text
Proposal
-> Independent Review
-> Architecture Resolution
-> ADR
-> Human Architecture Approval
-> Implementation Planning
-> Human Implementation Approval
-> Implementation
-> Evidence
-> Review
-> Merge / Release
```

正式狀態如下：

1. `PROPOSAL_DRAFT`: 提案尚未送審。
2. `PROPOSAL_SUBMITTED`: 提案、來源與影響範圍已完整。
3. `INDEPENDENT_REVIEW`: 由非提案作者執行技術、風險與可擴展性審查。
4. `RESOLUTION_DRAFT`: Codex 彙整 `ACCEPT / PARTIAL_ACCEPT / REJECT / DEFERRED`。
5. `ADR_RECORDED`: 決策、替代方案與後果已記錄。
6. `HUMAN_REVIEW`: 等待 Chief Architect 最終決定。
7. `APPROVED_FOR_IMPLEMENTATION_PLANNING`: 只允許建立 Implementation Plan，不允許施工。
8. `IMPLEMENTATION_PLANNING`: 產生 WorkOrders、依賴、風險、測試與 rollback 計畫。
9. `HUMAN_IMPLEMENTATION_APPROVAL`: Human 明確批准實作範圍。
10. `IMPLEMENTATION`: 已批准的 Worker 在合法 branch 執行。
11. `VALIDATION`: Review、test、security 與 protected-path gate。
12. `RELEASE_REVIEW`: 驗證 evidence、tests、security 與 release boundary。
13. `MERGE_RELEASE`: 只有既有 merge/release gate 與任何適用的 Production approval 都完成後才成立。

退回狀態為 `NEEDS_REVISION`、`REJECTED` 或 `DEFERRED`。任何退回都要保存原因，不刪除歷史。

## 5. Gate Requirements

### Proposal Gate

每份 Proposal 至少要有：

- `proposal_id`、title、author、source task、source commit 與 timestamp。
- Problem、scope、non-goals、current architecture、proposed architecture。
- Affected systems、files、schemas、workers 與 tenants。
- Alternatives、risk、security、compatibility、migration、rollback。
- Implementation 未開始的明確聲明。

### Independent Review Gate

- Reviewer 不得與 Proposal author 相同。
- Reviewer 必須揭露身份、能力、限制與可能利益衝突。
- Review 必須包含 technical correctness、Canon compatibility、security、scalability、operations、cost 與 rollback。
- 外部 AI review 必須保存來源，且不因名稱存在而取得 repository 權限。

### Resolution Gate

- 每一項 finding 必須分類為 `ACCEPT`、`PARTIAL_ACCEPT`、`REJECT` 或 `DEFERRED`。
- Resolution 必須說明理由、影響、被拒替代方案與目標 phase。
- 不得把 Independent Review 直接等同 Human approval。

### ADR Gate

每份 ADR 必須記錄：

- Proposal
- Reviewer
- Resolution
- Accepted
- Rejected
- Deferred
- Human Approval
- Implementation Phase

並應包含 `adr_id`、status、context、decision、consequences、risk、compatibility、migration、rollback、affected files 與 source commit。

### Human Approval Gate

Human approval 至少要記錄：

- `human_approval_id`
- approver
- approved scope
- rejected/deferred scope
- timestamp
- conditions
- expiry or supersession rule

Architecture approval 只允許進入 Implementation Planning。真正施工仍需獨立的 Human Implementation Approval；Production 另需明確批准。

## 6. Authority and Separation of Duties

- Proposal author 不得擔任唯一 Independent Reviewer。
- Independent Reviewer 不得 merge 自己的 review 結果。
- Codex 可形成 Resolution 與 ADR，但 Human 是最終架構批准者。
- Worker 只能執行已批准的 WorkOrder；不能在施工中自行改變 Architecture。
- Reviewer 可建議，不可把建議直接改為 Implementation。
- 任何 AI 都不得直接修改已核准 Architecture。重大修訂必須建立新 Proposal 並引用 ancestor decision。
- 任何 AI 都不得自行啟動 Production、繞過 protected paths、使用 secrets 或進行真實金融動作。

## 7. Architecture Review Registry

正式 machine-readable 入口：

- Board: `KGEN-KAIOS/governance/architecture_governance_board.json`
- Reviewers and reviews: `KGEN-KAIOS/governance/architecture_review_registry.json`
- Append-only history: `KGEN-KAIOS/governance/architecture_review_history.jsonl`

Registry 接受 ChatGPT、Codex、Grok、Claude、Gemini、OpenHands、GitHub Copilot、Research AI 與未來 reviewer 的 Review，但每筆都必須標記 `workforce_status`、`review_authority`、來源與是否可寫入 repo。未註冊 reviewer 的結果只能是 external advisory evidence。

## 8. Review Quorum

一般重大 Architecture Proposal 的最低 quorum：

1. 一位 Proposal author。
2. 一位與 author 不同的 Independent Reviewer。
3. Codex 形成 Resolution 與 ADR，或由另一位正式 Implementation Architect 完成並交 Codex 驗證。
4. Human PrimeForge 作 FINAL APPROVAL。

R3 / R4、security、legal、finance、protected paths、Production 或不可逆遷移不得使用快速通道。

## 9. Current V11 Relationship

V11 Genesis Design 與 Grok Independent CTO Review 已在 `origin/codex/v11-genesis-design` 留下設計、Resolution 與 ADR 證據。它們目前仍是 `PENDING_HUMAN_REVIEW`：

- Design commit: `fbb40b5fc28fc01a8062ed1ddd2e672db123e46c`
- Resolution commit: `cab345b31c05301b7a9f0e749e87650a4869230a`
- Review publication commit: `84d1f30c573e5a18e8d56cbec0ce485426b4782c`

AGB 不回溯性地把上述內容視為已批准。它只把既有證據登錄為第一個可追蹤案例；Implementation 仍為 `NOT_STARTED`。

## 10. Prohibited Actions

任何 AI 或 reviewer 均不得：

- 以 Review 或 ADR 取代 Human FINAL APPROVAL。
- 未經批准直接改寫 Architecture、Canon、Boot 或 Runtime CURRENT。
- 直接建立 Production deployment、真實交易、合約部署或 wallet signing。
- 將未啟用 reviewer 宣稱為正式上班員工。
- 刪除 rejected、deferred、conflicting 或 superseded evidence。
- 在同一 branch 混入未授權 Implementation。

## 11. Human Approval Record

| Field | Value |
|---|---|
| Approval ID | `HUMAN-AGB-APPROVAL-001` |
| Approver | PrimeForge / 樂天帝 |
| Decision | APPROVE AGB |
| Approved Scope | Governance publication only |
| Architecture Board | APPROVED |
| V11 Phase 1 Planning | NOT APPROVED / NOT STARTED |
| Implementation | NOT APPROVED / NOT STARTED |
| Production | NOT AUTHORIZED |

下一個 Human 決策必須明確選擇 `APPROVE_FOR_PHASE_1_PLANNING` 或 `HOLD_V11`。在此之前，Codex 不得建立 V11 Implementation WorkQueue。

## 12. Final Declaration

```text
Architecture Governance Board: APPROVED
Implementation: NOT STARTED
V11 Phase 1: NOT STARTED
Human Review: APPROVED FOR GOVERNANCE PUBLICATION ONLY
```
