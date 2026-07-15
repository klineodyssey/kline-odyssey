# ORG-P2-003F-FIX1 — 12345 Module Naming Migration Plan (Claim)

## 1. BOOT

| Check | Result |
|---|---|
| Boot file | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` read |
| CURRENT / OFFICIAL / RUNTIME | Confirmed via Boot CURRENT entry |
| User request | `Claim one task` — within Cursor worker scope |
| Reviewer required | Codex (`codex-gm-01`) |

## 2. MUST READ / REGISTRY

| Field | Value |
|---|---|
| worker_id | `cursor-01` |
| worker_type | Cursor |
| trust_level | T2 |
| employee_status | ACTIVE |
| branch permission | `cursor-handoff/<Task-ID>` |
| reviewer | `codex-gm-01` |
| continue allowed | YES |

Acknowledgments: boot / canon / workspace policy / DO_NOT_TOUCH = true. Suspension = null.

## 3. PROTECTED PATH

No edits to contracts, `K線西遊記/temples/12345/`, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or token contract.

Claim action touches only WorkQueue, claim lease, worker registry heartbeat, and this report.

Result: **PASS**

## 4. TASK CLAIM LEASE

```json
{
  "claim_id": "CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01",
  "task_id": "ORG-P2-003F-FIX1",
  "worker_id": "cursor-01",
  "worker_type": "Cursor",
  "status": "CLAIMED",
  "branch": "cursor-handoff/ORG-P2-003F-FIX1",
  "base_commit": "7a692c34df50861ab10f8bd80959d95251b1071c",
  "claimed_at": "2026-07-15T02:05:59Z",
  "lease_expires_at": "2026-07-15T06:05:59Z",
  "heartbeat": "2026-07-15T02:05:59Z",
  "report_path": "KGEN-AI-Company/reports/ORG-P2-003F_FIX1_12345_MODULE_NAMING_MIGRATION_PLAN.md",
  "reviewer": "codex-gm-01",
  "notes": "Single-task claim. Prior remote handoff REJECT_NO_CLAIM; reissue from latest origin/main 7a692c34df50861ab10f8bd80959d95251b1071c."
}
```

| Field | Value |
|---|---|
| claim_id | `CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01` |
| Concurrent tasks | **NONE** |
| Machine claim file | `KGEN-AI-Company/reports/claims/ORG-P2-003F-FIX1_claim.json` |

Lifecycle stage: **CLAIMED** (execution not started in this commit).

## 5. EXECUTION

- Mode: Claim only
- Branch from `origin/main` @ `7a692c34df50861ab10f8bd80959d95251b1071c`
- Plan/report work for 12345 module naming migration **not yet executed**
- Temple 12345: **not edited**

## 6. FINAL REPORT (CLAIM)

| Item | Value |
|---|---|
| Task | ORG-P2-003F-FIX1 |
| Status | CLAIMED |
| Branch | `cursor-handoff/ORG-P2-003F-FIX1` |
| Base | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| Implementation of naming plan | PENDING (next worker turn / continue) |
| Protected path violations | 0 |

