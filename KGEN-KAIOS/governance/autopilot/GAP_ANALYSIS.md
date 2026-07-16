---
TITLE: "PrimeForge Company Autopilot Gap Analysis"
VERSION: "0.3.0"
REVISION: "2026-07-15.3"
STATUS: "ARCHITECTURE_GAP_ANALYSIS"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-OS-BOOT-001"
CHANGE_REASON: "Add the P0 shared Boot, Kernel launch, Session checkpoint, and provider-conformance gaps."
ANCESTOR: "SOURCE_AUDIT.md"
SOURCE_OF_TRUTH: "FALSE"
---

# Gap Analysis

| Gap | Current condition | Proposed closure | Priority |
|---|---|---|---|
| GAP-001 Invocation persistence | Daily Operation exists but Human often has to request it | Bind it to every Codex invocation | P0 |
| GAP-002 Source manifest | Required sources are spread across Boot and protocols | Ordered machine boot manifest with hashes/status | P0 |
| GAP-003 Source conflict | Priority exists but no standard conflict output | `BLOCKED_SOURCE_CONFLICT` evidence envelope | P0 |
| GAP-004 Review-first dispatch | Rule exists in prose | Explicit state machine preventing execution before reviews | P0 |
| GAP-005 Task Envelope | WorkQueue entry is human-readable only | Machine envelope binding Human decision, scope, and stop conditions | P0 |
| GAP-006 Handoff package | Report + branch are current minimum | Add task-specific `HANDOFF.md` and `handoff.json` | P0 |
| GAP-007 Commit identity | Report is expected to name its own final commit | Separate `content_commit` from externally observed `handoff_tip` | P1 |
| GAP-008 Claim identity | `claim_id` is stored in notes | First-class immutable `claim_id` in a reviewed schema revision | P0 |
| GAP-009 Review custody | Lease can expire while Codex is reviewing | Freeze worker expiry at submission; manager owns closeout SLA | P0 |
| GAP-010 Repair continuity | Rejection often creates a new task | Metadata/content repair stays on the same task lineage | P0 |
| GAP-011 Company Inbox | No durable Human intake lifecycle | `COMPANY_INBOX.md` and `company_inbox.json` proposal | P0 |
| GAP-012 Human Inbox routing | No formal classifier | Router consumes Company Inbox records | P0 |
| GAP-013 Priority Scheduler | Priorities are distributed and partly line-based | Fixed Review > Repair > Human Decision > Architecture > Implementation order | P0 |
| GAP-014 Repository Maintenance | Network mode exists, but routine sync depends on prompts | Codex-owned maintenance state machine and safe retry policy | P0 |
| GAP-015 Legacy suppression | Old prompts can be treated as authority | Machine list of loaded/suppressed legacy rules | P1 |
| GAP-016 Health snapshot | Existing snapshots become stale | Per-invocation observation with explicit freshness | P1 |
| GAP-017 Network split | GitHub and Pages can disagree | Separate DNS, TCP/HTTPS/Remote, Actions, and Pages status | P0 |
| GAP-018 Human network blocking | A remote outage previously blocked the whole task | Block only remote-dependent actions; keep Inbox and architecture active | P0 |
| GAP-019 Runtime enablement | Architecture may be mistaken for active automation | Explicit `implementation_started=false` and separate approval gate | P0 |
| GAP-020 Claim serialization | Formal main shows the Worker IDLE while separate handoff branches each contain a claim | Design one canonical atomic claim authority and compare-and-set lease version before auto-dispatch | P0 |
| GAP-021 Shared Company Boot | Codex and Cursor have role-specific Boot prose but no common machine layer contract | Fixed fourteen-layer `company_os_boot.json` shared by all providers | P0 |
| GAP-022 Provider interpretation | Each AI can currently infer startup differently | Reject reordered, skipped, or provider-specific layer semantics | P0 |
| GAP-023 Company Session | No invocation checkpoint binds Boot, claim, decision, and review state | Session lifecycle with immutable linked checkpoints | P0 |
| GAP-024 Module launcher | Inbox, scheduler, and maintenance proposals do not yet have one launcher | Company Kernel is their only permitted launcher | P0 |
| GAP-025 Implementation ambiguity | Layer order names Implementation before final Human Decision | Define Layer 10 as authorization gate only; action waits until Layer 13 | P0 |

## Rules That Must Be Extended, Not Duplicated

1. Extend `CODEX_MANAGER_PROTOCOL.md` with the invocation state machine after approval.
2. Extend `DECISION_ENGINE_STANDARD.md` with source freshness, Inbox, scheduler, and split network health.
3. Revise `task_claim_schema.json` only after Human implementation approval.
4. Extend `CODEX_PRE_MERGE_CHECKLIST.md` with Task Envelope and Handoff package checks.
5. Extend Cursor Boot/Handoff documents with legacy suppression and content-commit semantics.
6. Keep the official WorkQueue, Review Log, Worker Registry, and Decision Log at their existing paths.
7. Reuse Maintenance Mode and the GitHub Connectivity Runbook as lower-level network authorities.

## Explicit Non-Gaps

- No need for another Worker Registry.
- No need for another WorkQueue.
- No need for another Decision Engine.
- No need for another protected-path list.
- No need for an autonomous merge or push agent.
- No background scheduler or daemon is implemented in this phase.
- Company Kernel is not a new Universe or Civilization Kernel.
