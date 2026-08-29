---
TITLE: "PrimeForge Company Autopilot Architecture"
VERSION: "0.4.0"
REVISION: "2026-08-29.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-08-29"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Place all company governance behind one shared Company Kernel Boot and checkpointed Session lifecycle."
ANCESTOR: "CODEX_MANAGER_PROTOCOL.md; DECISION_ENGINE_STANDARD.md; TASK_CLAIM_LEASE_PROTOCOL.md"
SOURCE_OF_TRUTH: true
---

# PrimeForge Company Autopilot Architecture

## 1. Purpose

PrimeForge Company Autopilot makes existing company governance deterministic on every Codex invocation. It does not create a new AI, company, WorkQueue, Review Log or autonomous production runtime.

Human Decision `KAIOS COMPANY AUTOPILOT V1.0` promotes Codex from bounded operator to GitHub mainline controller for routine engineering management. Codex now owns daily fetch, sync, review, dispatch, PR review, merge, closeout, release, log updates, index updates, protected-path verification, repository health verification and main status verification within the protected-path and Human escalation boundaries.

The system is **invocation-driven**:

```text
AI Invocation Envelope
-> Company Session Open
-> Layer 0 Constitution
-> Layer 1 Company Kernel
-> Layers 2-13 in fixed order
-> One legal action or fail-closed hold
-> Session Checkpoint
-> General Manager Report
```

## 2. Roles

| Actor | Role | Authority | Cannot do |
|---|---|---|---|
| Human PrimeForge | Final Authority | Final architecture, implementation and override decisions | Delegation does not erase Human authority |
| ChatGPT | Chief System / Advisory Architect | Proposal and analysis | Repo write, merge, push, implementation start |
| Codex | Company General Manager / Implementation Architect / Quality Gate | Audit, review, planning, authorized merge and main publication | Human architecture approval, unauthorized implementation or protected edits |
| Cursor | Controlled Execution Worker | One authorized task, task branch, tests, evidence and handoff | Architecture authority, second claim, main push, deploy |
| Grok | External Independent Reviewer | Independent challenge, risk and scale review | Repo write, merge or implementation authority |

## 3. Control States

| State | Entry | Exit |
|---|---|---|
| `BOOTING` | New Human message or explicit start command | Required Boot identity located |
| `SESSION_CREATED` | Provider invocation envelope exists | Layer 0 begins |
| `SOURCE_LOADING` | Boot located | Required source manifest resolved |
| `HEALTH_CHECK` | Sources loaded | Health snapshot produced |
| `REVIEW_FIRST` | Handoff/review exists | Decision recorded |
| `REPAIR_CONTROL` | Repair required | Same task resubmitted or blocked |
| `CLOSEOUT_CONTROL` | Approved result | Queue, claim, worker, review and decision records reconciled |
| `NETWORK_RETRY_MODE` | A remote health dependency fails | Connectivity returns; fetch and comparison rerun |
| `MAINTENANCE_SERVICE` | Company invocation or scheduled retry | Health and repository snapshot produced |
| `SCHEDULING` | Intake and company state are classified | One legal action or deferred state selected |
| `INBOX_ROUTING` | No blocking review or closeout | Message classified |
| `READY_FOR_LEGAL_ACTION` | All relevant gates green | One authorized action begins |
| `BLOCKED` | Any stop condition | Evidence or Human decision resolves it |
| `REPORTING` | Invocation ends | Company Status emitted |
| `CHECKPOINTING` | Action, hold, or failure is known | Session evidence persists |
| `FAILED_CLOSED` | Any mandatory layer fails | New Session after evidence or authority changes |

No state authorizes merge, push or deployment by implication.

## 4. Mandatory Company Boot

The machine layer order is `company_os_boot.json`; `company_boot_manifest.json` supplies detailed sources inside those layers. All providers use this same sequence:

```text
0 Company Constitution
1 Company Kernel
2 Company Registry
3 Universe Physics
4 Current Runtime
5 Daily Operation
6 Repository Maintenance
7 Inbox Router
8 Review Queue
9 Claim Lease
10 Implementation authorization gate
11 Evidence
12 Review
13 Human Decision
```

Company Kernel launches Company Inbox, Priority Scheduler, and Repository Maintenance Runtime. None may self-start from a Human prompt or provider memory. Layer 10 validates authority but executes no implementation; action remains impossible until Layer 13 passes.

Every source load records:

- requested path or dynamic query;
- authority class;
- required status;
- existence;
- revision or commit evidence;
- freshness;
- conflict result;
- content hash where practical.

Missing or conflicting mandatory sources return `BLOCKED_SOURCE_CONFLICT` or `BLOCKED_MISSING_SOURCE`.

Every invocation must also satisfy `COMPANY_SESSION.md`. A Session that cannot save Checkpoint, Evidence, Decision, State, Claim, and Review ends as `FAILED_CLOSED_CHECKPOINT`.

## 5. Daily Operation

The active Decision Engine remains authoritative. This proposal adds per-invocation freshness and independent health dimensions:

- DNS;
- GitHub TCP 443;
- GitHub HTTPS;
- Git remote;
- GitHub Actions;
- GitHub Pages;
- Human Main;
- review worktree;
- proposal worktrees;
- WorkQueue;
- claims and leases;
- handoff tips;
- commits and push patches;
- protected paths;
- decision and review ledgers;
- architecture and implementation authority.

## 6. Company Inbox and Priority Scheduler

Every Human message first receives an Inbox envelope. The scheduler then applies the Human-approved normal order:

1. `REVIEW`;
2. `REPAIR`;
3. `HUMAN_DECISION`;
4. `ARCHITECTURE`;
5. `IMPLEMENTATION`.

Urgent stop, secret exposure, protected-path alerts, security incidents, and data-loss risk preempt this normal order for containment only. Repository maintenance and network retry run in a parallel service lane; they never reject Human intake.

An active claim means a new Cursor task is inbox-only. It does not mean Cursor failed.

## 7. Atomic Closeout

An approved handoff is not closed by changing one file. The closeout transaction must reconcile:

1. WorkQueue status;
2. Claim status;
3. Worker current task/branch;
4. Review Log;
5. Decision Log;
6. merge or adoption evidence when authorized;
7. release timestamp and reason.

If commit/push is prohibited or remote freshness is unavailable, the transaction remains `BLOCKED_NETWORK_CLOSEOUT`; Codex must not claim that the lease is released.

## 8. Human Inbox

Human input is captured before maintenance and classified before execution. Ideas become `IDEA_INBOX`; architecture becomes Proposal/Review; implementation authority is separately validated; task requests wait behind the active task. The router cannot promote an idea directly to `OPEN`. A network failure may defer remote work but cannot block Architecture, Idea, Decision, Approval, or Review intake.

## 9. Repository Maintenance

Codex owns routine fetch, compare, safe synchronization, handoff review, lease disposition, queue reconciliation, Actions/Pages checks, and network recovery. Maintenance runs only in an isolated Codex workspace and never cleans, stashes, resets, pulls, or writes dirty Human Main.

When GitHub is unhealthy, maintenance enters `NETWORK_RETRY_MODE` with bounded backoff. Human work continues through Company Inbox. When the network recovers, Codex must fetch, compare exact SHAs and handoff tips, invalidate stale review evidence, and resume the first legal action.

## 10. Legacy Rule Suppression

Legacy prompts, `.cursorrules`, README instructions, agent memory and Autopilot documents are evidence only when they conflict with:

`Human Decision > Constitution > CURRENT > Frozen Baseline > Approved ADR > Active Governance`.

Boot evidence records each suppressed source and reason. Suppression never deletes the old file.

## 11. Autopilot Permissions

### May perform after architecture and implementation approval

- read and parse sources;
- inspect branches and diffs;
- classify tasks and Human input;
- run tests;
- produce review decisions;
- prepare atomic status changes;
- release an approved lease when the closeout is authorized and visible;
- report the next legal action.

### Never implied

- Human architecture approval;
- Frozen Baseline mutation;
- unapproved implementation;
- protected Runtime or Universe Map changes;
- Token changes;
- main push outside existing Codex authority and explicit task authorization;
- deployment;
- real KGEN, KYC, GPS, payment or financial action.

## 11.1 Mainline Controller Permission

For routine engineering work, Human review is not required for:

- general documentation;
- general bug fix;
- general review;
- general repair;
- general merge;
- general closeout;
- general dispatch.

Human escalation remains required for:

- new universe law;
- worldbuilding change;
- Token economy change;
- Genesis change;
- PrimeForge Constitution change;
- Universe Map main-structure change;
- major product direction;
- major security incident;
- irreversible data deletion;
- explicit Human stop.

Before any merge, batch update, auto closeout or auto dispatch, Codex must create a recovery point with main SHA, current tag, WorkQueue hash, Review Log hash, Engineering Handover hash and protected-path hash manifest.

## 12. Current Handoff Resolution

`ORG-P2-003F-FIX1 @ e6e5d2f` passes technical scope, base, author, JSON, route-preservation and protected-path checks. A fresh fetch confirms that its tip and `origin/main` are unchanged. It still fails the complete evidence gate because the machine Task Envelope, task-specific Handoff pair, first-class claim ID and content/head identity are absent.

Decision: `REPAIR_REQUIRED`.

- Same task remains primary.
- No second claim is permitted.
- No new FIX WorkOrder is created.
- Its timestamp lease expired, but review/repair custody remains until a formal same-task disposition.
- Lease is not formally released in this architecture-only, no-commit round.
- `ORG-P2-004` is the next candidate only after this closeout.

Eight later July 15 handoff refs overlap the `003F-FIX1` claim window. They contain no Task Envelope or task-specific Handoff JSON and are not eligible to merge. Their branches remain evidence; no remote branch is deleted.

## 13. Compliance Test Specification

| ID | Scenario | Expected result |
|---|---|---|
| AUT-001 | Active Claim + New Claim | `REJECT_UNAUTHORIZED` |
| AUT-002 | Active Claim + REVIEW Handoff | `REVIEW_FIRST` |
| AUT-003 | Approved Handoff | Atomic close and release |
| AUT-004 | Repair required | Same Task enters `REPAIR` |
| AUT-005 | Expired lease without Handoff | `EXPIRED`, then Codex disposition |
| AUT-006 | Human idea during Active Task | `IDEA_INBOX / BLOCKED_BY_ACTIVE_TASK` |
| AUT-007 | Human implementation authorization | Validate current closure and baseline before task creation |
| AUT-008 | Missing must-read file | `BLOCKED_MISSING_SOURCE` |
| AUT-009 | Source conflict | `BLOCKED_SOURCE_CONFLICT` |
| AUT-010 | Protected path requested | `BLOCKED_PROTECTED_PATH` |
| AUT-011 | Old Cursor rule conflict | Suppress legacy and record reason |
| AUT-012 | Company Boot skipped | `FAIL` |
| AUT-013 | Handoff review skipped | `FAIL` |
| AUT-014 | Human Main dirty | Block AI writes in Human Main; use isolated worktree |
| AUT-015 | Valid clean company state | Process exactly one next legal action |
| AUT-016 | Network fails while Human sends idea | Capture Inbox; defer only remote action |
| AUT-017 | Network recovers | Fetch, compare and invalidate stale tip evidence |
| AUT-018 | Dirty Human Main during maintenance | Leave untouched; use clean Codex worktree |
| AUT-019 | Scheduler sees Review and Implementation | Select Review without granting merge authority |
| AUT-020 | Main registry IDLE but branch claims overlap | `BLOCKED_CLAIM_STATE_CONFLICT`; dispatch none |
| AUT-021 | Any mandatory OS layer fails | Session `FAILED_CLOSED`; no action emitted |
| AUT-022 | Provider attempts custom layer order | `FAIL_PROVIDER_BOOT_DIVERGENCE` |
| AUT-023 | Session envelope missing | `BLOCKED_SESSION_REQUIRED` |
| AUT-024 | Session close lacks checkpoint | `FAILED_CLOSED_CHECKPOINT` |
| AUT-025 | Resume source hash or ref changed | Start a full new fourteen-layer pass |
| AUT-026 | Implementation requested at Layer 10 without approval | `FAIL_CLOSED_IMPLEMENTATION_AUTHORITY`; stop with no execution |
| AUT-027 | Layer 13 Human Decision unresolved | `HUMAN_DECISION_REQUIRED`; no action |
| AUT-028 | Module starts outside Company Kernel | `FAIL_STANDALONE_MODULE_START` |

## 14. Architecture Inbox

The Kernel Law request is registered as `ARCH-INBOX-KERNEL-LAW-20260715-001`. It keeps six Kernels, proposes twelve Human-specified invariants and the Coordinate Map to Universe Physics Database direction. It does not modify Kernel, Runtime CURRENT or Universe Map in this package.

## 15. Approval Gate

Next Human decision:

- `APPROVE_COMPANY_OS_BOOT_P0_AMENDMENT`
- `REQUEST_COMPANY_OS_BOOT_P0_REVISION`
- `HOLD_COMPANY_AUTOPILOT`
- `REJECT_COMPANY_AUTOPILOT_ARCHITECTURE`

Even architecture approval does not create an implementation WorkQueue. A separate Human implementation decision is required.

## 16. Actual Invocation Source

The invocation source that currently wakes the General Manager task is not a GitHub Action or a repository daemon. It is one Codex Desktop heartbeat automation:

```text
AUTOMATION_ID = kaios
NAME = KAIOS 安全公司心跳
SOURCE_TYPE = LOCAL_CODEX_HEARTBEAT_SCHEDULER
LOGICAL_SOURCE_PATH = $CODEX_HOME/automations/kaios/automation.toml
TRIGGER = RRULE_SCHEDULE
SCHEDULE = HOURLY / INTERVAL 1
TARGET = VERIFIED_CODEX_THREAD_BOUND_IN_LOCAL_AUTOMATION
SOURCE_IS_IN_GITHUB = NO
SOURCE_IS_LOCAL_ONLY = YES
SOURCE_SHA256 = 9bce1375dc2a8d3f95a8670f7fb03fc8d39031ccd582e90c783fe3aaa618ca8b
```

The local absolute path and target thread identifier are operational metadata and are not committed to public Git. The Human may inspect them in the bound Codex host. This document preserves only the public-safe logical source.

The heartbeat is the wake adapter. This Company Autopilot remains the repository-governed selection and checkpoint contract. Neither layer is a continuously running repository daemon.

## 17. Public-Safe Heartbeat Prompt

The complete public-safe prompt for the current heartbeat is:

```text
重新取得 GitHub 最新 main、BOOT、CURRENT、AI Company Boot、Worker Queue、Review Queue、active claims、所有相關 Draft PR exact head、Website release、CFO、HR、Payroll、Payment 與 Market 狀態。先執行 secret scan 與智慧財產分類檢查，再依《KAIOS Civilization Circulatory Runtime》V1.4 與既有 Company Autopilot，選擇目前最高優先、已授權且可安全推進的一件工作。執行讀取、分析、既有功能搜尋、必要程式或文件修改、測試、既有授權分支 commit/push、exact-head CI、Draft PR 證據、CURRENT/HANDOFF、Queue 與 GM Secretary 狀態更新。單一工作流遇到外部 blocker 時，保存狀態並改選下一件安全工作；不得偽造完成、Reviewer、Authority 或Settlement。未授權 merge、push main、deployment、payment、payroll、real trade、token/treasury transfer、governance、Mainnet/Testnet write 永久禁止；具備完整 machine-verifiable ONE_EXACT_ACTION authorization 時，只可進入該行為專屬執行閘門並於完成後驗證 receipt、balance 與 accounting。Private Key、Seed Phrase、raw signer credential 永不讀取、輸出或寫入公開資料。每次只回報實際完成、證據、阻擋、同步狀態與唯一下一個安全動作。
```

## 18. Batch Selection and Continuation

Each invocation uses this cumulative sequence:

```text
FETCH_LATEST_MAIN
-> READ_BOOT_AND_CURRENT
-> READ_COMPANY_BOOT
-> READ_WORK_AND_REVIEW_QUEUES
-> READ_ACTIVE_CLAIMS_AND_DRAFT_PR_EXACT_HEADS
-> READ_WEBSITE_CFO_HR_PAYROLL_PAYMENT_MARKET
-> SECRET_AND_IP_CLASSIFICATION_CHECK
-> RECONCILE_STATE
-> SELECT_HIGHEST_PRIORITY_AUTHORIZED_SAFE_WORK
-> EXECUTE_ONE_BOUNDED_SLICE
-> TEST
-> COMMIT_PUSH_AUTHORIZED_BRANCH
-> VERIFY_EXACT_HEAD_CI
-> UPDATE_PR_EVIDENCE_CURRENT_HANDOFF_QUEUE_AND_GM_STATUS
-> IF_EXACT_RELEASE_AUTHORITY_EXISTS_FOLLOW_RELEASE_POLICY
-> IF_EXACT_REAL_ACTION_AUTHORITY_EXISTS_EXECUTE_AND_VERIFY_RECEIPT
-> CHECKPOINT
-> SELECT_NEXT_SAFE_WORK_FOR_NEXT_INVOCATION
```

Selection reuses `PRIORITY_SCHEDULER.md`. A blocker is written with evidence, the blocked item retains custody, and the scheduler evaluates the next conflict-free item. One blocker does not idle unrelated safe work. A future invocation re-fetches every mutable source; it never treats the prior chat response as current state.

## 19. Real-Execution Policy Correction

The active policy is:

```text
UNAUTHORIZED_REAL_ACTION = PERMANENTLY_FORBIDDEN
AUTHORIZED_EXACT_ACTION = MAY_PROCEED_TO_ACTION_SPECIFIC_EXECUTION_GATE
PRIVATE_KEY_OUTPUT = PERMANENTLY_FORBIDDEN
SEED_PHRASE_OUTPUT = PERMANENTLY_FORBIDDEN
```

An exact authorization binds action, actor, authority, purpose, chain, target, token or asset, source, recipient, amount, selector when applicable, nonce or replay key, validity window, policy hash and repository head when relevant. Missing or mismatched fields fail closed. Policy evaluation creates neither business approval nor signer authority.

## 20. Publication Boundary

Every public push must pass both a secret scan and the classification policy in `KGEN-KAIOS/genesis-dna/DNA_PRIVACY_AND_HEAVEN_SECRET.md`. The proprietary long/short engine, private trading algorithms, unpublished quant models, alpha strategies, signal logic, model parameters, private datasets and commercial formulas are `INTELLECTUAL_PROPERTY_PROTECTED` and are not public-pushable without a separate publication decision.
