---
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "DRAFT_FOR_HUMAN_REVIEW"
ARCHITECTURE: "RESEARCH_ONLY"
IMPLEMENTATION: "NOT_STARTED"
DEPLOYMENT: "NOT_AUTHORIZED"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-DESIGN-20260713"
HUMAN_DECISION_ID: "HUMAN-KERNEL-V1-001"
CHANGE_REASON: "Design the first single-Agent KAIOS Kernel lifecycle without starting implementation."
ANCESTOR: "KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernel
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: Kernel
SPECIES: KernelV1Design
CANONICAL_FILE: "KGEN-KAIOS/kernel/KERNEL_V1.md"
---

# KAIOS Kernel V1

## 1. Formal Status

| Field | Value |
|---|---|
| Human Decision | `HUMAN-KERNEL-V1-001` |
| Decision | `START_KERNEL_V1_DESIGN` |
| Phase | `KERNEL V1 DESIGN` |
| Architecture | `RESEARCH_ONLY` |
| Implementation | `NOT_STARTED` |
| Deployment | `NOT_AUTHORIZED` |
| Human Review | `REQUIRED` |
| Runtime Agent Limit | `1` |
| Sole Agent | `悟空001` |

Kernel V1 是第一個 KAIOS Agent Runtime 的設計契約，不是已執行的 Agent，也不是 V11 Implementation。它只研究一位 Agent 如何每天安全地 Boot、讀取記憶、接受任務、執行、產生證據、接受 Review、記錄 Reward、Sleep 並在下一日重新開始。

## 2. Purpose

Kernel V1 的目標是把「Agent 工作」從聊天行為轉成可驗證的生命週期。每次工作日都必須有明確輸入、合法狀態、停止條件、證據、Review 與收尾紀錄。

設計優先解決四個問題：

1. 悟空001 在何種證據下可以開始工作。
2. 記憶、任務與權限如何在每一日重新驗證。
3. 執行結果如何在 Reward 前接受獨立 Review。
4. Agent 如何停止、保存狀態並避免背景工作失控。

## 3. Scope

Kernel V1 僅包含：

- 一位 Agent：`悟空001`。
- 一個邏輯 Runtime instance。
- 一次只處理一個 Mission。
- 八個正式 Runtime State。
- 每日一次可追蹤的 lifecycle。
- 唯讀 Canon / Constitution memory。
- Mission execution boundary。
- Evidence package。
- Codex / Human review gate。
- Prototype reward record。
- Sleep checkpoint 與 next-day recovery。

## 4. Explicit Non-Goals

Kernel V1 不包含：

- Multi-Agent runtime。
- Department scheduler。
- Provider Marketplace。
- Agent hiring、leasing、trading 或 reproduction。
- 100、1,000 或 100,000 Agent scale。
- Autonomous WorkOrder creation 或 promotion。
- Production deployment。
- 真實 KGEN、法幣、銀行、錢包或鏈上 Reward。
- 自動修改 WorkQueue、Canon、Constitution 或 protected paths。
- V11 Phase 1 Planning 或 Implementation。

任何超出以上範圍的需求必須建立新的 Architecture Proposal，不得偷偷加入 Kernel V1。

## 5. Sole Agent Identity

| Field | Value |
|---|---|
| Agent ID | `KAIOS-AGENT-WUKONG-001` |
| Display Name | `悟空001` |
| Runtime Role | Single-Agent Kernel Pioneer |
| Human Owner | PrimeForge / 樂天帝 |
| Manager | Codex / `codex-gm-01` |
| Reviewer | Codex；高風險或 Human Gate 由 PrimeForge |
| Provider Binding | `UNASSIGNED` |
| Concurrent Missions | `1` |
| Concurrent Agents | `1` |
| Main Push Authority | `false` |
| Protected Runtime Authority | `false` |
| Current Runtime State | `OFFLINE` |

Provider Binding 保持 `UNASSIGNED`，因為本階段定義 Kernel 契約，不選定模型供應商。未來 Provider adapter 必須另經 Review，且不得改變悟空001的唯一 Agent identity。

## 6. Kernel Components

| Component | Responsibility | Design File |
|---|---|---|
| Boot Controller | 驗證身份、權限、來源與 Runtime health | [kernel_boot_sequence.md](kernel_boot_sequence.md) |
| Memory Controller | 載入正式記憶並管理當日 working memory | [kernel_memory_model.md](kernel_memory_model.md) |
| Task Controller | 驗證與執行單一 Mission | [kernel_task_runtime.md](kernel_task_runtime.md) |
| Evidence Controller | 封裝輸入、輸出、測試、風險與變更證據 | 本文件與 Task Runtime |
| Review Controller | 獨立判定 PASS、REVISE、REJECT 或 BLOCK | [kernel_review_runtime.md](kernel_review_runtime.md) |
| Reward Controller | 在 Review 後記錄 prototype reward | [kernel_reward_runtime.md](kernel_reward_runtime.md) |
| Sleep Controller | 建立 checkpoint、關閉活動權限並準備次日 | [kernel_sleep_cycle.md](kernel_sleep_cycle.md) |
| Runtime Model | 定義 machine-readable state、transition 與 invariant | [kernel_runtime.json](kernel_runtime.json) |

## 7. Kernel Timeline

Kernel Timeline 是邏輯順序，不代表固定真實分鐘。每一步必須完成前一步的 exit criteria。

| Sequence | Phase | State | Required Evidence |
|---|---|---|---|
| T00 | Wake Request | `OFFLINE` | Human / scheduler wake request |
| T01 | Boot Validation | `BOOT` | Boot pack、identity、workspace、health |
| T02 | Memory Load | `BOOT` | Memory manifest 與 source hashes |
| T03 | Mission Read | `READY` | Valid mission envelope |
| T04 | Mission Start | `WORKING` | Start record、base state、permissions |
| T05 | Controlled Wait | `WAITING` | Block reason 或 review-ready evidence |
| T06 | Independent Review | `REVIEW` | Evidence package 與 reviewer decision |
| T07 | Reward Recording | `REWARD` | Approved review result |
| T08 | Daily Closeout | `SLEEP` | Checkpoint、memory write、lease release |
| T09 | Powered Down | `OFFLINE` | Sleep completion record |
| T10 | Next Day | `BOOT` | New wake request；重新驗證全部權限 |

Agent 不得從前一日的 `WORKING` 直接跨日。未完成任務必須在 Sleep 前標記可恢復 checkpoint，次日重新 Boot 後才能恢復。

## 8. Kernel Lifecycle

### 8.1 BOOT

驗證 Boot CURRENT、Constitution、Canon、Worker identity、workspace、mission source、protected paths 與 health。Boot 失敗時回到 `OFFLINE`，不得載入可寫入工具。

### 8.2 READY

記憶已載入、身份有效且沒有 active mission。READY 只代表可讀取一個合法 Mission，不代表可自行尋找或生成正式任務。

### 8.3 WORKING

悟空001依 Mission envelope 執行允許的 actions。每一步都寫入 work log；超出權限、依賴失效或風險升級時立即停止。

### 8.4 WAITING

等待外部輸入、工具、Human Decision、Review 或依賴。WAITING 不允許繼續修改檔案，也不消耗新 Mission。

### 8.5 REVIEW

工作輸出與 Evidence package 交由獨立 reviewer。悟空001不得 self-approve，也不得自行改寫 Review result。

### 8.6 REWARD

只有 Review 通過後才記錄 reward。Reward 是 Prototype / Internal Ledger，不是自動 KGEN 或真實支付。

### 8.7 SLEEP

關閉任務執行權、保存 checkpoint、整理可保留記憶、釋放 claim / lock 並產生日結證據。

### 8.8 OFFLINE

沒有執行權、沒有 active tools、沒有 active claim。下一日必須從 BOOT 重新開始。

## 9. Kernel State Machine

正式 Runtime State 只有以下八種：

`BOOT`、`READY`、`WORKING`、`WAITING`、`REVIEW`、`REWARD`、`SLEEP`、`OFFLINE`

| From | Event | Guard | To |
|---|---|---|---|
| `OFFLINE` | `WAKE_REQUESTED` | Human-approved runtime window | `BOOT` |
| `BOOT` | `BOOT_PASSED` | Identity、memory、workspace、policy 全部有效 | `READY` |
| `BOOT` | `BOOT_FAILED` | 任一 mandatory gate 失敗 | `OFFLINE` |
| `READY` | `MISSION_ACCEPTED` | Mission 合法且唯一 | `WORKING` |
| `READY` | `NO_MISSION` | 今日沒有合法 Mission | `SLEEP` |
| `WORKING` | `INPUT_REQUIRED` | 可恢復等待 | `WAITING` |
| `WAITING` | `INPUT_RECEIVED` | 依賴重新驗證通過 | `WORKING` |
| `WORKING` | `EVIDENCE_READY` | Output 與 Evidence package 完整 | `REVIEW` |
| `WAITING` | `EVIDENCE_READY` | 已停止施工且證據完整 | `REVIEW` |
| `REVIEW` | `REVISION_REQUIRED` | Reviewer 提供可執行修正範圍 | `WORKING` |
| `REVIEW` | `APPROVED` | Review PASS 且無阻擋 | `REWARD` |
| `REVIEW` | `REJECTED_OR_BLOCKED` | 保存理由與證據 | `SLEEP` |
| `REWARD` | `REWARD_RECORDED` | Ledger entry 完整 | `SLEEP` |
| `SLEEP` | `CHECKPOINT_COMPLETE` | Lease 釋放、memory 封存 | `OFFLINE` |

禁止的 transition 包括：

- `OFFLINE -> WORKING`
- `BOOT -> WORKING`
- `READY -> REWARD`
- `WORKING -> REWARD`
- `WORKING -> OFFLINE`，除非 incident controller 先保存 emergency checkpoint
- `REVIEW -> READY`
- `SLEEP -> WORKING`

## 10. Runtime Invariants

Kernel V1 在任何狀態都必須維持：

1. Active Agent count 永遠小於或等於 1。
2. Active Mission count 永遠小於或等於 1。
3. Reward 必須發生在 Review 之後。
4. Sleep 必須發生在下一個 Boot 之前。
5. 每個 state transition 都有 event ID、time、from、to、reason 與 evidence。
6. Mission 沒有來源、owner、reviewer 或 acceptance criteria 時不得開始。
7. Protected path authority 永遠為 false。
8. 悟空001不得 push main、self-review 或變更自己的權限。
9. Runtime 不把 hidden chat memory 當作唯一正式記憶。
10. Implementation 未經 Human Approval 永遠維持 `NOT_STARTED`。

## 11. Daily Operating Contract

每日固定流程：

`Boot -> Load Memory -> Read Mission -> Execute -> Evidence -> Review -> Reward -> Sleep -> Next Day`

每一步輸出：

| Step | Minimum Output |
|---|---|
| Boot | boot event、policy hashes、identity、health |
| Load Memory | memory manifest、snapshot ID、source list |
| Read Mission | mission ID、source、risk、acceptance criteria |
| Execute | action log、tool log、changed artifacts |
| Evidence | report、tests、diff、risk、provenance |
| Review | reviewer、decision、findings、required action |
| Reward | unit、amount、basis、approval status |
| Sleep | checkpoint、retained memory、released resources |
| Next Day | new Boot event；不得沿用舊授權 |

## 12. Evidence Model

每個工作日應產生一個 Daily Evidence Bundle：

- `kernel_day_id`
- `agent_id`
- `boot_event_id`
- `memory_snapshot_id`
- `mission_id`
- `task_source`
- `base_commit`
- `actions`
- `files_read`
- `files_changed`
- `tests`
- `risks`
- `report_path`
- `review_id`
- `review_result`
- `reward_event_id`
- `sleep_checkpoint_id`
- `next_state`

若沒有 Mission，也必須留下 Boot、No Mission、Sleep 與 Offline 證據，避免把沒有活動誤判成 Runtime 失蹤。

## 13. Failure and Recovery

| Failure | Required State | Response |
|---|---|---|
| Boot source missing | `OFFLINE` | Stop and report missing source |
| Memory integrity failure | `OFFLINE` | Reject snapshot；不得自行補寫 |
| Invalid Mission | `WAITING` | Request Codex / Human decision |
| Tool unavailable | `WAITING` | Save checkpoint and retry only after validation |
| Protected path conflict | `WAITING` | Stop、preserve evidence、escalate |
| Review rejection | `SLEEP` or governed revision | Preserve result；不得發 Reward |
| Runtime crash | `OFFLINE` | Restore only from last valid checkpoint |
| Duplicate active instance | `OFFLINE` | Reject second instance and raise critical alert |

## 14. Security Boundary

- Secrets、private keys、seed phrases、GitHub tokens 與 passwords 不得載入 Kernel memory。
- Runtime tools 預設 deny；Mission 明確授權後才可使用。
- 網路、filesystem write、Git commit 與 external API 必須分開授權與記錄。
- 真實金融、錢包、合約、Token、12345 Runtime 與 Runtime CURRENT 不在 Kernel V1 範圍。
- Review、Reward 與 Sleep record 必須 append-only 或由可追溯的新事件更正。

## 15. Human Review Gate

Human Review 應判定：

1. 八態 state machine 是否足夠且無隱藏執行態。
2. 悟空001 identity 與單一 instance invariant 是否清楚。
3. Memory 與 Mission boundary 是否能防止越權。
4. Review 是否真正先於 Reward。
5. Sleep 是否能停止背景活動並支援 recovery。
6. Prototype reward 是否與真實資產完全分離。
7. 是否維持 V11、Implementation 與 protected Runtime HOLD。

Human 未核准前：

- Architecture status 保持 `DRAFT_FOR_HUMAN_REVIEW`。
- Implementation 保持 `NOT_STARTED`。
- 不建立 executable、service、scheduler、database、API 或 deployment。
- 不建立 Kernel Implementation WorkQueue。

## 16. Required Human Decision

下一個合法決策只能是下列之一：

- `APPROVE_KERNEL_V1_ARCHITECTURE`
- `REQUEST_KERNEL_V1_REVISION`
- `REJECT_KERNEL_V1_ARCHITECTURE`
- `HOLD_KERNEL_V1`

Architecture approval 仍不等於 Implementation approval。若 Architecture 通過，Implementation Planning 必須另取得 Human 明確授權。
