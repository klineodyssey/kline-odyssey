---
TITLE: "PrimeForge Company Autopilot Governance Merge Plan"
VERSION: "0.3.0"
REVISION: "2026-07-15.3"
STATUS: "MIGRATION_PLAN_ONLY"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-COMPANY-OS-BOOT-001"
CHANGE_REASON: "Integrate the P0 Company OS Boot without creating provider-specific boot systems or a duplicate Kernel."
ANCESTOR: "SOURCE_AUDIT.md; GAP_ANALYSIS.md"
SOURCE_OF_TRUTH: "FALSE"
---

# Merge Plan

No step in this plan is authorized in the present architecture-only round.

## Stage 0: Human Architecture Decision

Human selects one of:

- `APPROVE_COMPANY_OS_BOOT_P0_AMENDMENT`
- `REQUEST_COMPANY_OS_BOOT_P0_REVISION`
- `HOLD_COMPANY_AUTOPILOT`
- `REJECT_COMPANY_AUTOPILOT_ARCHITECTURE`

Approval of architecture does not authorize implementation, merge, push or deployment.

## Stage 1: Source Revalidation

Network recovered during this architecture round. The reusable process is:

1. Enter `NETWORK_RETRY_MODE` if any required remote signal fails.
2. Fetch without force, reset, stash, or Human Main changes when connectivity returns.
3. Confirm `origin/main` and `origin/cursor-handoff/ORG-P2-003F-FIX1` tips.
4. Re-run the handoff diff and source-conflict audit.
5. If a tip changed, supersede stale review evidence and inspect the new tip.

## Stage 2: Existing Handoff Closeout

1. Keep `ORG-P2-003F-FIX1` as the sole active task.
2. Issue a same-task metadata repair envelope.
3. Require Task Envelope, `HANDOFF.md`, `handoff.json`, test evidence and content commit.
4. Re-review the new tip.
5. Only after approval, update WorkQueue, Claim Registry, Worker Registry, Review Log and Decision Log together.
6. Release the lease and allow the next claim only after the main closeout is visible.

## Stage 2A: Company OS Boot P0

After separate implementation approval:

1. publish one stable Company OS Boot selector without replacing Boot CURRENT;
2. validate the fourteen-layer machine order;
3. implement Session open/checkpoint/recovery in a non-secret local store;
4. bind Codex, Cursor, ChatGPT, and provider adapters to the same manifest;
5. make Company Kernel the sole launcher for Inbox, Scheduler, and Maintenance;
6. keep Layer 10 non-executing until Layer 13 authority passes;
7. test fail-closed and rollback before any automatic dispatch.

## Stage 3: Cumulative Governance Updates

| Existing authority | Proposed cumulative update |
|---|---|
| `CODEX_MANAGER_PROTOCOL.md` | Per-message Company Boot, review-first state machine, Company Inbox, Priority Scheduler, and Repository Maintenance orchestration |
| `DECISION_ENGINE_STANDARD.md` | Source freshness, Human Inbox and split network health |
| `MAINTENANCE_MODE_STANDARD.md` | Reusable retry/recovery states without Human-level blocking |
| `TASK_CLAIM_LEASE_PROTOCOL.md` | Review custody, repair lineage and active release states |
| `task_claim_schema.json` | First-class `claim_id`, review and release timestamps |
| `CODEX_PRE_MERGE_CHECKLIST.md` | Task Envelope and Handoff package validation |
| Cursor Boot/Handoff protocols | Legacy suppression and one-task evidence contract |
| Boot CURRENT | Add only a stable pointer after explicit protected Boot authorization |

The official WorkQueue, Worker Registry, Review Log and Decision Log remain in place. They are not copied into this folder.

## Stage 4: Machine Contract Validation

- JSON and JSONL parse.
- Required source paths exist.
- Source priorities are unique and ordered.
- Twenty-eight compliance scenarios match expected decisions.
- No protected path is modified.
- Human Main remains untouched.
- No secret, credential, private path or personal data is emitted.

## Stage 5: Optional Enablement

Enablement requires a separate Human implementation decision. It may add a local read-only checker and scheduler, but it must not add unattended merge, push, deploy, payment, KYC, GPS, or protected-path authority.

## Rollback

Because this proposal is documentation-only, rejection means preserving it as reviewed evidence or deleting it only through a Human-approved archival change. If later enabled behavior is defective, disable the integration manifest and fall back to the existing manager, decision, claim and review protocols without rewriting history.
