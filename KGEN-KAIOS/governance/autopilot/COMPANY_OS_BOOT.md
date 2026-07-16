---
TITLE: "PrimeForge Company Operating System Boot Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define one fail-closed Company Boot shared by Codex, Cursor, ChatGPT, and future AI runtimes."
ANCESTOR: "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md; CODEX_GENERAL_MANAGER_BOOT.md; company_boot_manifest.json"
SOURCE_OF_TRUTH: true
---

# Company Operating System Boot

## 1. Purpose

Company OS Boot is the proposed deterministic startup contract for every AI runtime participating in PrimeForge Company. It is not another company, feature, Universe Kernel, or implementation runtime. It composes current Constitution, Registry, Physics, Runtime, Daily Operation, Maintenance, Inbox, Review, Claim, Evidence, and Human authority into one ordered boot.

Once approved and implemented, Codex, Cursor, ChatGPT, and future AI providers must load the same machine manifest. Provider-specific prompts may add capability adapters after identity resolution, but they may not reorder, skip, reinterpret, or replace the common layers.

## 2. Session Preamble

Every invocation starts with a neutral Session envelope before Layer 0:

```text
SESSION_OPEN
-> assign session_id
-> record actor, provider, worker_id, invocation time, workspace and observed branch
-> retain the Human message as unprocessed input
-> enter Layer 0
```

The preamble grants no authority and performs no repository write. The Human message is not interpreted until the Company Kernel launches Company Inbox.

## 3. Formal Layer Order

| Layer | Name | Required outcome | Failure result |
|---:|---|---|---|
| 0 | Company Constitution | Current Constitution exists, parses, and establishes Human Final Authority | `FAIL_CLOSED_CONSTITUTION` |
| 1 | Company Kernel | Boot manifest validates; kernel identity and module launch contract load | `FAIL_CLOSED_KERNEL` |
| 2 | Company Registry | Actor, worker, role, trust, permissions, workspace, and status resolve | `FAIL_CLOSED_REGISTRY` |
| 3 | Universe Physics | CURRENT Physics selector and protected read boundary resolve | `FAIL_CLOSED_PHYSICS` |
| 4 | Current Runtime | Applicable CURRENT selectors and frozen baselines resolve without conflict | `FAIL_CLOSED_RUNTIME` |
| 5 | Daily Operation | Queue, workforce, attendance, decisions, worktrees, and health snapshot complete | `FAIL_CLOSED_DAILY_OPERATION` |
| 6 | Repository Maintenance | Network, fetch, compare, Actions, Pages, refs, and protected diffs resolve | `FAIL_CLOSED_MAINTENANCE_ACTION` |
| 7 | Inbox Router | Company Inbox record is classified without creating unauthorized work | `FAIL_CLOSED_INBOX` |
| 8 | Review Queue | Existing handoffs, PRs, repairs, and Human review gates are classified | `FAIL_CLOSED_REVIEW_QUEUE` |
| 9 | Claim Lease | Canonical claim state, overlap, lease, and one-task lock validate | `FAIL_CLOSED_CLAIM` |
| 10 | Implementation | Authorization, task envelope, scope, and stop conditions validate; no work executes here | `FAIL_CLOSED_IMPLEMENTATION_AUTHORITY` |
| 11 | Evidence | Required report, provenance, tests, diff, and protected evidence resolve | `FAIL_CLOSED_EVIDENCE` |
| 12 | Review | Applicable Codex, Human, security, legal, and risk reviews resolve | `FAIL_CLOSED_REVIEW` |
| 13 | Human Decision | Final allowed action is bound to a current Human Decision or explicit standing authority | `HUMAN_DECISION_REQUIRED` |

All fourteen layers must emit `PASS` or an explicitly permitted `HOLD`. Any `FAIL` immediately ends action processing and moves the Session to `FAILED_CLOSED`.

## 4. Company Kernel

Company Kernel is the Layer 1 governance orchestrator. It is not the KAIOS Universe Physics Kernel and is not a seventh civilization kernel. It has no business logic, payment authority, merge authority, or protected-path authority.

Company Kernel performs only:

1. verify the signed/hashed Boot contract when such a mechanism is later approved;
2. run layers in fixed numeric order;
3. start the proposed Company modules in governed mode;
4. collect layer evidence and state transitions;
5. enforce fail-closed behavior;
6. transfer one fully validated next action to the actor after Layer 13;
7. close or checkpoint the Company Session.

## 5. Kernel-Launched Modules

| Module | Kernel launch point | Activation boundary |
|---|---|---|
| Company Inbox | Layer 1 | Captures the invocation envelope; routing waits for Layer 7 |
| Priority Scheduler | Layer 1 | May calculate priority; dispatch waits for Layers 8-13 |
| Repository Maintenance Runtime | Layer 1 registration, Layer 6 execution | Read/health/fetch/compare only until action authority passes |

No module may start itself from a Human prompt, provider memory, README instruction, or legacy rule. `standalone_start_allowed` is false.

## 6. Layer Output Contract

Every layer returns:

```text
session_id
layer_number
layer_id
started_at
completed_at
status
sources_loaded
source_hashes
checks
evidence_refs
warnings
failure_code
next_layer
```

Layer output is append-only within the Session. A provider cannot change an earlier layer result without creating a superseding Session event.

## 7. Implementation Layer Safety

Layer 10 does not implement anything. It only proves whether implementation is requested, authorized, and bound to a valid Task Envelope. An architecture-only Session records `PASS_NOT_APPLICABLE` and continues. If implementation is requested without authority or envelope, the layer returns `FAIL_CLOSED_IMPLEMENTATION_AUTHORITY` and the Session stops immediately.

This preserves:

- Architecture Before Implementation;
- Review Before Merge;
- Human Final Authority;
- one task, one claim, one branch, one worktree, one handoff;
- protected Runtime boundaries.

## 8. Fail-Closed Rule

On any failure:

1. stop layer advancement that could mutate state;
2. preserve already collected evidence;
3. create a failure checkpoint;
4. release no claim unless the existing closeout authority permits it;
5. perform no merge, push, deploy, payment, KYC, GPS, or protected write;
6. report the exact failed layer and next Human or maintenance action.

Network failure is scoped to remote-dependent actions. Company Inbox intake, local architecture analysis, and Human decisions remain available through a checkpointed `NETWORK_RETRY_MODE` Session.

## 9. Recovery

A new invocation may resume from a prior checkpoint only after revalidating Constitution, Boot manifest, actor identity, `origin/main`, affected handoff tips, protected paths, and Human authority. If any source hash or ref changed, the system starts a new full layer pass instead of blindly continuing.

## 10. Architecture Boundary

This document is architecture only. Company Kernel, Session persistence, automatic scheduling, implementation, commit, push, deployment, Runtime CURRENT changes, Universe Map changes, and protected-path changes remain not started.
