# ORG-P2-020 — DevOps Pages QA (Claim)

## 1. BOOT

| Check | Result |
|---|---|
| Boot file | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` read |
| Canon | `KGEN-Canon/KGEN_CANON_MASTER.json` read |
| User request | `Claim one task` — within Cursor worker scope |
| Reviewer | `codex-gm-01` |

## 2. MUST READ / REGISTRY

| Field | Value |
|---|---|
| worker_id | `cursor-01` |
| worker_type | Cursor |
| trust_level | T2 |
| employee_status | ACTIVE |
| branch permission | `cursor-handoff/<Task-ID>` |
| continue allowed | YES |

Acknowledgments: boot / canon / workspace policy / DO_NOT_TOUCH = true. Suspension = null.

## 3. PROTECTED PATH

No edits to contracts, `K線西遊記/temples/12345/`, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or token contract.

Claim action touches only WorkQueue, claim lease, worker registry heartbeat, and this report.

Result: **PASS**

## 4. TASK CLAIM LEASE

```json
{
  "claim_id": "CLAIM-ORG-P2-020-20260715T024330Z-cursor-01",
  "task_id": "ORG-P2-020",
  "worker_id": "cursor-01",
  "worker_type": "Cursor",
  "status": "CLAIMED",
  "branch": "cursor-handoff/ORG-P2-020",
  "base_commit": "7a692c34df50861ab10f8bd80959d95251b1071c",
  "claimed_at": "2026-07-15T02:43:30Z",
  "lease_expires_at": "2026-07-15T06:43:30Z",
  "heartbeat": "2026-07-15T02:43:30Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-020_DEVOPS_PAGES_QA.md",
  "reviewer": "codex-gm-01",
  "notes": "First OPEN without remote handoff. ORG-P2-004 through ORG-P2-019 already have origin handoffs at REVIEW."
}
```

| Field | Value |
|---|---|
| claim_id | `CLAIM-ORG-P2-020-20260715T024330Z-cursor-01` |
| Concurrent tasks | **NONE** |
| Machine claim file | `KGEN-AI-Company/reports/claims/ORG-P2-020_claim.json` |

Lifecycle stage: **CLAIMED** (DevOps Pages QA execution not started in this commit).

## 5. EXECUTION

- Mode: Claim only
- Branch from `origin/main` @ `7a692c34df50861ab10f8bd80959d95251b1071c`
- Pages workflow verification **not yet executed**
- Protected paths: **not edited**

## 6. FINAL REPORT (CLAIM)

| Item | Value |
|---|---|
| Task | ORG-P2-020 |
| Title | Verify Pages workflow publishes KGEN-Organization without Jekyll |
| Status | CLAIMED |
| Branch | `cursor-handoff/ORG-P2-020` |
| Base | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| Implementation | PENDING (next worker turn) |
| Protected path violations | 0 |
