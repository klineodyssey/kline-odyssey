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
CHANGE_REASON: "Define traceable memory layers and daily memory boundaries for 悟空001."
ANCESTOR: "KGEN-KAIOS/kernel/KERNEL_V1.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: AgentKernelComponent
ORDER: SingleAgentRuntime
FAMILY: KAIOS
GENUS: KernelV1
SPECIES: KernelMemoryModel
CANONICAL_FILE: "KGEN-KAIOS/kernel/kernel_memory_model.md"
---

# Kernel Memory Model

## 1. Principle

Kernel memory 是可追溯的 Runtime input，不是不可見的聊天直覺。悟空001可以使用短期推理上下文，但任何會影響正式任務、Review 或 Reward 的記憶都必須能指向正式來源、snapshot 或 evidence。

## 2. Memory Layers

| Layer | Persistence | Mutability | Purpose |
|---|---|---|---|
| Identity Memory | Permanent | Human-governed | Agent ID、owner、role、authority |
| Constitution Memory | Versioned | Read-only | KAIOS 最高治理 |
| Canon Memory | Versioned | Read-only | KGEN universe rules |
| Mission Memory | Mission lifetime | Assigned record only | Mission scope、risk、acceptance |
| Working Memory | Current day | Ephemeral | Steps、temporary observations、tool results |
| Evidence Memory | Append-only | Reviewer-correctable by new event | Outputs、diff、tests、reports |
| Review Memory | Append-only | Reviewer-owned | Findings、decision、revision |
| Reward Memory | Append-only | Human / manager governed | Prototype reward events |
| Failure Memory | Versioned history | Append-only | Incidents、root cause、recovery |

## 3. Source Priority

記憶衝突時依序採用：

1. Human Final Authority decision。
2. KAIOS Constitution。
3. KGEN Official Canon。
4. Human-approved Architecture / Runtime specification。
5. Current Mission。
6. Reviewed evidence。
7. Working memory。
8. Provider conversation memory。

較低來源不得覆蓋較高來源。無法判定時進入 `WAITING`，交由 Codex / Human 決策。

## 4. Memory Manifest

每次 Boot 載入一份 concept-level manifest：

- `memory_manifest_id`
- `agent_id`
- `kernel_day_id`
- `source_type`
- `source_path_or_id`
- `source_version`
- `source_hash`
- `created_at`
- `last_reviewed_at`
- `retention_class`
- `sensitivity`
- `read_permission`
- `write_permission`
- `expires_at`
- `status`

Manifest 不保存 secret value。若來源需要秘密才能使用，Kernel 只記錄 secret reference 與 authorization result，不記錄內容。

## 5. Load Rules

- 只載入完成當日 Mission 所需的最小記憶。
- Constitution 與 Canon 以版本、hash 與 path 載入。
- 前一日 working memory 預設不直接載入；只載入經 Sleep 封存的 checkpoint summary。
- 被 Review 判定錯誤的 memory 不刪除，而是標記 superseded / invalid。
- 過期、來源消失或 hash 不符的記憶不可用於正式決策。

## 6. Write Rules

悟空001可寫入：

- 當日 working memory。
- action log。
- evidence draft。
- checkpoint proposal。

悟空001不可直接寫入：

- Constitution memory。
- Canon memory。
- Human decision。
- Review result。
- Reward approval。
- Worker authority。
- protected Runtime。

## 7. Daily Memory Lifecycle

1. `BOOT`：驗證 manifest 與上次 checkpoint。
2. `READY`：建立當日 working memory container。
3. `WORKING`：記錄 actions、observations、assumptions 與 tool outputs。
4. `WAITING`：凍結可寫入範圍，只允許加入等待證據。
5. `REVIEW`：working memory 轉為唯讀 review input。
6. `REWARD`：加入 review-approved outcome reference。
7. `SLEEP`：保留必要 summary，清除未核准 transient data。
8. `OFFLINE`：沒有可變 working memory。

## 8. Retention

| Class | Example | Rule |
|---|---|---|
| PERMANENT | Identity、Human decision、Constitution reference | Append-only lineage |
| VERSIONED | Canon、Architecture、Failure memory | 保留 ancestor 與 superseded 狀態 |
| MISSION | Mission inputs、working notes | Mission closeout 後依 review 保留 |
| EPHEMERAL | Temporary reasoning、cache | Sleep 時清除或摘要化 |
| SENSITIVE_REFERENCE | Secret reference、private source marker | 不保存 secret content |

## 9. Privacy and Safety

- 不把 Human 私人資料載入公開 evidence。
- 不把本機真實路徑、Token、Email、IP、private key 或 seed 寫入公開記憶。
- Provider 不得把 Kernel memory 用作未授權外部訓練或同步的正式假設。
- Memory export 需保留來源與 sensitivity label。

## 10. Recovery

有效 checkpoint 必須通過 hash、agent ID、kernel day、review status 與 state 驗證。Recovery 只恢復到最後一個合法 checkpoint；損壞資料保留 evidence 後隔離，不以聊天摘要補寫。

## 11. Human Review Questions

- 正式來源與 hidden memory 的界線是否足夠清楚？
- retention 是否能兼顧追溯與最小資料原則？
- Agent 的可寫入記憶是否過大？
- Sleep 後是否能確認沒有殘留 active working context？
