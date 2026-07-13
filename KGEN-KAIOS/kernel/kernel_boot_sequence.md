---
VERSION: "1.0"
REVISION: "2026-07-13.1"
STATUS: "DRAFT_FOR_HUMAN_REVIEW"
ARCHITECTURE: "RESEARCH_ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "2160366a7f62fd87da243594b1b55a0d8021786c"
TASK_ID: "KAIOS-KERNEL-V1-DESIGN-20260713"
HUMAN_DECISION_ID: "HUMAN-KERNEL-V1-001"
CHANGE_REASON: "Define the guarded daily boot contract for 悟空001."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelBootSequence
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_boot_sequence.md"
---

# Kernel Boot Sequence

## 1. Purpose

Kernel Boot 是悟空001每天取得任何執行權前的強制驗證階段。Boot 不執行 Mission、不修改檔案、不延續前一日權限；它只確認今日 Runtime 是否有資格進入 `READY`。

## 2. Entry and Exit

| Item | Requirement |
|---|---|
| Entry State | `OFFLINE` |
| Entry Event | `WAKE_REQUESTED` |
| Success State | `READY` |
| Failure State | `OFFLINE` |
| Agent | `KAIOS-AGENT-WUKONG-001 / 悟空001` |
| Implementation | `NOT_STARTED` |

## 3. Mandatory Boot Sources

Boot controller 必須讀取並記錄 hash：

1. `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
2. `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md`
3. `KGEN-Canon/KGEN_CANON_MASTER.json`
4. `KGEN-AI-Company/WORKSPACE_POLICY.md`
5. `KGEN-KAIOS/WORKER_REGISTRY.md`
6. `KGEN-KAIOS/worker_registry.json`
7. 今日 Mission envelope
8. 前一個合法 Sleep checkpoint

Runtime CURRENT、12345 Runtime 與 contracts 只可作為明確 Mission 所需的唯讀來源，不是 Boot 自動載入的可寫入資料。

## 4. Boot Gates

### Gate B1: Identity

- Agent ID 必須是 `KAIOS-AGENT-WUKONG-001`。
- 同一 Kernel 不得出現第二個 active instance。
- Human owner、manager 與 reviewer 必須可辨識。
- Agent 不得以 provider session 或聊天名稱取代永久 ID。

### Gate B2: Authority

- 確認今日 Human / Codex 授權範圍。
- 確認 `can_push_main=false`。
- 確認 `can_modify_protected_runtime=false`。
- 未明確授權的 tool 一律 DENIED。

### Gate B3: Workspace

- Workspace 必須獨立於 Human Main。
- 工作樹狀態必須可判定。
- Base commit、branch 與 remote visibility 必須記錄。
- 不得自動 stash、reset、clean 或刪除 Human 資料。

### Gate B4: Policy Integrity

- Constitution status 必須是 `ACTIVE`。
- Canon 與 Boot source 必須存在且可讀。
- 若來源 hash 與前次預期不同，標記 change 並重新驗證，不得靜默沿用快取。

### Gate B5: Memory Integrity

- 前一日 checkpoint 必須有 snapshot ID、hash 與 completion status。
- 未完成或損毀的 working memory 不得直接載入。
- Hidden chat memory 不得成為唯一恢復來源。

### Gate B6: Runtime Health

- Network、filesystem、Git 與必要工具逐項標記 `HEALTHY`、`DEGRADED` 或 `UNAVAILABLE`。
- `DEGRADED` 只允許不依賴該工具的 Mission。
- 關鍵工具不可用且 Mission 依賴時，Boot 可完成但 Agent 進入 `WAITING` 前不得開始施工。

## 5. Boot Procedure

1. 接收 `WAKE_REQUESTED`。
2. 建立唯一 `boot_event_id` 與 `kernel_day_id`。
3. 驗證沒有其他 active Agent / Mission。
4. 載入 mandatory Boot sources 並計算 hashes。
5. 驗證 identity、authority、workspace 與 protected-path boundary。
6. 驗證前次 Sleep checkpoint。
7. 載入允許的 persistent memory manifest。
8. 記錄 tool health，不開啟未授權 tool。
9. 產生 Boot Evidence。
10. 全部 gate 通過後發出 `BOOT_PASSED` 並進入 `READY`。

## 6. Boot Evidence

Boot Evidence 至少包含：

- `boot_event_id`
- `kernel_day_id`
- `agent_id`
- `requested_by`
- `requested_at`
- `base_commit`
- `workspace_id`
- `source_hashes`
- `previous_checkpoint_id`
- `identity_result`
- `authority_result`
- `workspace_result`
- `memory_result`
- `health_result`
- `protected_path_result`
- `result`
- `next_state`

## 7. Failure Rules

任一 mandatory gate 失敗時：

1. 發出 `BOOT_FAILED`。
2. 將 state 設回 `OFFLINE`。
3. 不讀取 Mission content 以外的執行資料。
4. 不啟用 filesystem write、Git write、network mutation 或 external actions。
5. 產生 failure evidence 並等待 Codex / Human。

Boot controller 不得自動修正 Registry、Constitution、Canon、Workspace 或 checkpoint。

## 8. Review Questions

- Mandatory sources 是否足夠但未把十幾份文件全文塞入 memory？
- identity 與 provider session 是否明確分離？
- Boot failure 是否真正 fail closed？
- 前一日權限是否被禁止自動延續？
