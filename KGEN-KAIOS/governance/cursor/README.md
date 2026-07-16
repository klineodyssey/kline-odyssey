---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
SOURCE_FRESHNESS: "LAST_KNOWN_ORIGIN; GITHUB_TCP443_UNAVAILABLE_AT_REVIEW_TIME"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
HUMAN_DECISION_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Propose a governed Cursor control bootstrap that reconciles existing Cursor rules without creating a second workforce system."
ANCESTOR: "KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md + KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: CursorControl
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: KAIOSCursorControlBootstrapProposal
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/README.md"
---

# KAIOS Cursor Control Bootstrap

## 1. Formal Status

```text
Cursor Position: KAIOS Controlled Execution Worker
Cursor Control Runtime: ARCHITECTURE_PROPOSAL_UNDER_REVIEW
Cursor Implementation: NOT_STARTED
Cursor WorkQueue: NOT_CREATED
Deployment: NOT_STARTED
Effective Current Rules Changed: false
Human Approval Required: true
```

本套件不是第二間 AI 公司、不是新的 live WorkQueue，也不是可執行 Runtime。它是對既有 Cursor、Workforce、Workspace、Claim、Handoff 與 Review 文件的控制層提案。Human 核准遷移前，既有正式來源繼續有效。

## 2. Proposal Files

| File | Purpose |
|---|---|
| `README.md` | 既有規則 Audit、差異報告與 migration plan |
| `CURSOR_CONTROL_RUNTIME.md` | Control plane、角色、狀態機、Legacy suppression 與 Compliance Test |
| `CURSOR_BOOT_PROTOCOL.md` | 啟動順序、15-step preflight 與輸出格式 |
| `CURSOR_TASK_ENVELOPE_STANDARD.md` | 每項任務的 machine-readable 授權契約 |
| `CURSOR_PROTECTED_PATH_POLICY.md` | 寫檔前與提交前的雙重 protected-path gate |
| `CURSOR_HANDOFF_STANDARD.md` | `HANDOFF.md` 與 `handoff.json` 完成交接契約 |
| `CURSOR_STOP_CONDITIONS.md` | 立即停止條件與 BLOCKED 輸出 |
| `CURSOR_START_COMMAND.md` | Human 可貼入 Cursor 的短啟動指令 |
| `cursor_control_runtime.json` | Machine-readable control state、schema draft 與 12 項 compliance cases |
| `cursor_boot_manifest.json` | 有序必讀來源、優先級與 legacy suppression |
| `cursor_start_command.json` | 啟動指令的 machine-readable companion |

## 3. Existing Rule Audit

| Existing Source | Current Role | Audit Decision | Reason |
|---|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | Stable Boot CURRENT | `REUSE` | Fixed bootstrap entry; this proposal cannot replace it. |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | Highest governance below Human | `REUSE` | Human authority, least authority and fail-closed rules are binding. |
| `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md` | Visible Worker boot SOURCE_OF_TRUTH | `REUSE_AND_EXTEND_BY_PROPOSAL` | Six visible sections remain mandatory; Task Envelope and source precedence are additions. |
| `KGEN-KAIOS/GENERIC_WORKER_PROTOCOL.md` | Worker-neutral lifecycle | `REUSE` | Registration, one-task and handoff rules remain valid. |
| `KGEN-KAIOS/TASK_CLAIM_LEASE_PROTOCOL.md` | Claim and lease model | `REUSE` | Cursor Control must validate, not duplicate, leases. |
| `KGEN-AI-Company/WORKSPACE_POLICY.md` | Human/Cursor/Codex workspace separation | `REUSE` | Human Main remains read-only for AI by default. |
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Cursor-specific legacy/current boot mix | `MIGRATE` | Contains V4 and V5 contradictions and auto-selection behavior. |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Automatic first-OPEN loop | `MIGRATE` | Future control requires a Human Decision and complete Task Envelope first. |
| `KGEN-AI-Company/CURSOR_DISPATCHER_V4.md` | Local-only V4 dispatcher | `SUPPRESS_CONFLICTING_CLAUSES` | Its no-push rule conflicts with V5 handoff push. |
| `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md` | V5 remote handoff | `REUSE_WITH_ENVELOPE_GATE` | Handoff branch remains valid after preflight and claim. |
| `KGEN-AI-Company/CURSOR_ONE_COMMAND_START.md` | Legacy shortcut | `MIGRATE` | `gi，上班` cannot bypass registration, Human Decision or envelope. |
| `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` | Superseded queue history | `SUPPRESS` | File already declares the Organization WorkQueue as live. |
| `KGEN-Agent-Office/CURSOR_AGENT_PROMPT.md` | Legacy prompt | `SUPPRESS_CONFLICTING_CLAUSES` | Still points to the superseded Agent Office queue and automatic execution. |
| `.cursorrules` / `.cursor/rules` | None found in this audit | `NOT_PRESENT` | Future local rules remain subordinate to Human and CURRENT governance. |

## 4. Material Conflicts

| Conflict ID | Existing Conflict | Proposed Resolution |
|---|---|---|
| `CC-001` | V4 says commit locally and do not push; V5 requires handoff push. | Task Envelope controls `commit_allowed` and `push_allowed`; Cursor never pushes main. |
| `CC-002` | Legacy flow automatically selects the first OPEN row. | A complete Human Decision, Task Envelope and eligible WorkQueue entry are all required. |
| `CC-003` | Legacy instructions use `git pull origin main` before checking workspace. | Fetch in an isolated worker workspace; never pull into dirty Human Main. |
| `CC-004` | Agent Office queue still contains OPEN history. | Suppress it because its banner names Organization WorkQueue as live. |
| `CC-005` | Suggested `cursor/<task>-<name>` differs from Registry pattern. | Keep effective `cursor-handoff/<Task-ID>` until Human approves registry migration. |
| `CC-006` | “Latest ADR” could mean newest by timestamp rather than relevant approved ADR. | Task Envelope lists exact required ADR IDs and accepted status. |
| `CC-007` | Chat memory or old prompts may appear newer than repository evidence. | Human Decision and CURRENT/Frozen sources win; conflicts cause STOP. |
| `CC-008` | Cursor can currently change WorkQueue status while delivering its own branch. | Envelope must explicitly authorize any WorkQueue edit; no implicit queue mutation. |

## 5. Proposed Migration Plan

This is a plan only. No migration is authorized now.

1. **Human Architecture Review:** Accept, modify, reject or hold this package.
2. **Resolution:** Resolve `CC-001` through `CC-008` and branch namespace policy.
3. **ADR:** Record Cursor authority, envelope requirement and legacy suppression.
4. **Human Implementation Planning Approval:** Explicitly authorize a bounded documentation migration.
5. **Cumulative Updates:** Update existing Boot/SOP/Cursor files in place; do not create parallel active rules.
6. **Registry Alignment:** Update worker branch pattern only if Human chooses a new namespace.
7. **Compliance Trial:** Run all 12 sandbox cases with no protected paths and no main push.
8. **Cutover:** Mark legacy clauses superseded, retain files as history, and publish one effective manifest.
9. **Rollback:** Restore prior source selection through a reviewed decision; never delete evidence.

## 6. Source Precedence

```text
Human Decision
> KAIOS Constitution
> CURRENT Runtime / Active Selector
> Human-approved Frozen Baseline
> Approved ADR
> Approved Proposal
> Candidate
> Historical
> Archive
```

The stable Boot file is the mandatory loader that locates these sources. It does not outrank Human Final Authority or the Constitution.

## 7. Network Freshness Boundary

At proposal time DNS and GitHub Pages were healthy, while GitHub TCP 443 and HTTPS timed out. The local last-known `origin/main` was `7a692c34df50861ab10f8bd80959d95251b1071c`. This is acceptable only for an uncommitted Architecture Proposal. Before review publication, migration or implementation, Codex must fetch and repeat the source audit.

## 8. Non-Authorization

This package does not authorize a Cursor task, branch, commit, handoff push, main push, merge, deployment, protected-path modification or WorkQueue creation.
