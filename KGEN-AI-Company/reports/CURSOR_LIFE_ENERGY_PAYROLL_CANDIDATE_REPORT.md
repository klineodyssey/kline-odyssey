# CURSOR Life Energy Payroll — Candidate Report

**Work Package ID:** `KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001`  
**Worker:** cursor-01  
**Reviewer:** codex-gm-01  
**Human:** PrimeForge  
**Branch:** `cursor-handoff/KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001`  
**Base main SHA:** `57573a6b` (at preflight)  
**Final Status:** `CURSOR_LIFE_ENERGY_PAYROLL_CANDIDATES_BLOCKED`

---

## CURSOR PREFLIGHT

| Check | Result |
|-------|--------|
| Worker registry `cursor-01` | PASS — ACTIVE / T2 / `can_push_main: false` |
| Task envelope on `origin/main` | **FAIL** — not found |
| Canonical life-energy payroll schema on main | **FAIL** — not merged |
| `WORK_QUEUE.md` CLAIMABLE row | **FAIL** — task not present |
| Continuous queue dispatch | **FAIL** — not listed; Q12 `MICROBIAL` = `PREPARATION_ONLY` |
| Work order status | `OPEN_BY_CODEX_REQUIRED` |
| Codex footer gate | 「核准後方可開工」 — **not satisfied on main** |

**Stop code:** `AWAITING_CODEX_CANONICAL_SCHEMA_AND_ENVELOPE`

---

## Response to Codex review of `CURSOR-RD-ECONOMY-PAYROLL-WALLET-20260802`

**Classification accepted:** APPROVED_AS_RESEARCH_INPUT / NOT_CANONICAL / REQUIRES_CONCEPTUAL_REPAIR

### Accepted (cursor-01 acknowledges)

- Simulation payroll must be auditable; project budgets fund pay; delivery + review + approval gate release.
- KAIOS Credit suitable for v0 simulation; real KGEN and chain wallets remain forbidden.
- Proactive R&D handoff continues.

### Required correction — **accepted and recorded**

Prior R&D (`HUMAN-WALLET-FOODCHAIN-SURVIVAL-001` handoff language) conflated **no wallet** with **not alive / prey / food-chain consumed**. Codex canonical model:

| Dimension | Independent |
|-----------|-------------|
| `LIFE_EXISTENCE` | Being registered / operational as life |
| `AGENCY_LEVEL` | Autonomous action, handoff, claim |
| `ECONOMIC_CAPABILITY` | Wallet, payroll, market participation |

**No wallet** ⇒ no independent **economic** participation — **not** ⇒ `NOT_ALIVE`.

Economic failure states: `UNEMPLOYED`, `DEPENDENT_SUPPORT`, `RESOURCE_STRESSED`, `MAINTENANCE_UNFUNDED`, `SUSPENDED`, `ARCHIVED`.

Food-chain consumption applies to **compatible ecological life and resources** only (ant food, bee nectar/honey), not AI metaphysics.

**Payroll scenario fix:** `PAYROLL_MISSING_WALLET` ⇒ life remains; payment blocked with `WALLET_REQUIRED_FOR_PAYMENT`, not `NOT_ALIVE`.

---

## Work Package (deferred until Codex dispatch)

| Deliverable | Path | Status |
|-------------|------|--------|
| AI worker payroll fixtures | `KAIOS/economy/candidates/payroll-v0/CURSOR_AI_WORKER_PAYROLL_FIXTURES_V0.json` | **NOT_STARTED** |
| Project escrow fixtures | `KAIOS/economy/candidates/payroll-v0/CURSOR_PROJECT_ESCROW_FIXTURES_V0.json` | **NOT_STARTED** |
| Ant colony ledger | `KAIOS/economy/candidates/colony-ledger-v0/CURSOR_ANT_COLONY_RESOURCE_LEDGER_V0.json` | **NOT_STARTED** |
| Bee hive ledger | `KAIOS/economy/candidates/colony-ledger-v0/CURSOR_BEE_HIVE_RESOURCE_LEDGER_V0.json` | **NOT_STARTED** |
| Viewer cards | `KAIOS/world-viewer/candidates/life-energy-payroll/CURSOR_LIFE_ENERGY_PAYROLL_VIEWER_CARDS_V0.json` | **NOT_STARTED** |
| Test scenarios | `KAIOS/economy/candidates/payroll-v0/CURSOR_LIFE_ENERGY_PAYROLL_TEST_SCENARIOS_V0.json` | **NOT_STARTED** |
| Candidate tests | `KAIOS/economy/candidates/payroll-v0/tests/` | **NOT_STARTED** |

---

## Delivery checklist (blocked run)

| Field | Value |
|-------|--------|
| Canonical Schema Version | **PENDING** — awaiting Codex merge |
| Allowed Paths | As specified in work order; envelope required |
| Files Created | Report + handoff only (this blocked acknowledgment) |
| Tests Added | 0 (blocked) |
| Assumptions | KAIOS_CREDIT simulation-only; credit ≠ food/energy/materials |
| Known Limitations | Cannot implement fixtures without canonical schema version |
| Protected Files Modified | **None** |
| Wallet Access | **None** |
| KGEN Access | **None** |
| Real Settlement | **None** |
| Schema Validation | N/A |
| Ledger Balance | N/A |

---

## Cross-references (repository-derived)

| Anchor | Use |
|--------|-----|
| `KGEN-KAIOS/world-viewer/SPRINT_006_SETTLEMENT_ECONOMY_ARCHITECTURE.md` | KAIOS_CREDIT balanced ledger |
| `KGEN-KAIOS/civilization/PAYROLL_STANDARD.md` | Evidence + review payroll lines |
| `KGEN-AI-Company/reports/CURSOR_PROPOSED_KAIOS_PAYROLL_WALLET_RD_20260802.md` | Prior research input (repaired) |

---

## Unblock requirements (for Codex)

1. Merge canonical life-energy payroll specification with **schema version id**.
2. Publish `*.task_envelope.json` on main for this Task ID.
3. Update `worker_registry.json` / queue dispatch to `DISPATCHED` or `READY_FOR_ATOMIC_CLAIM`.
4. Re-run cursor-01 on same branch to produce candidate fixtures + tests.

---

## Proactive R&D note (research recommendation)

**RESEARCH_RECOMMENDATION:** After unblock, implement all nine required scenarios in `CURSOR_LIFE_ENERGY_PAYROLL_TEST_SCENARIOS_V0.json` before viewer cards, so credit–resource separation (ant/bee) is test-first.

**SOURCE_DERIVED:** Codex work order 2026-08-03 (chat dispatch packet).

---

*Cursor stops here per 「核准後方可開工」. No candidate JSON fixtures in this commit.*
