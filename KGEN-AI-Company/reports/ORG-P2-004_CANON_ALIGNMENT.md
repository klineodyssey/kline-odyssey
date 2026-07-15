# ORG-P2-004 Canon Alignment

**Task ID:** ORG-P2-004  
**Status:** Report for Codex Review  
**Owner:** Cursor (`cursor-01`)  
**Reviewer:** Codex (`codex-gm-01`)  
**Priority:** P0  
**Department:** Canon  
**Date:** 2026-07-15  
**Base Commit:** `7a692c34df50861ab10f8bd80959d95251b1071c`  
**Scope:** Verify Civilization Core Canon against Genesis Library and Canon JSON. Report only — no Canon rewrites. No protected-path edits.

## Claim Lease Evidence

| Field | Value |
|---|---|
| `claim_id` | `CLAIM-ORG-P2-004-20260715T0239-cursor-01` |
| `worker_id` | `cursor-01` |
| `claimed_at` | `2026-07-15T02:39:02Z` |
| `lease_expires_at` | `2026-07-15T06:39:02Z` |
| `heartbeat` | `2026-07-15T02:40:09Z` |
| `base_commit` | `7a692c34df50861ab10f8bd80959d95251b1071c` |
| `branch` | `cursor-handoff/ORG-P2-004-20260715` |
| `report_path` | `KGEN-AI-Company/reports/ORG-P2-004_CANON_ALIGNMENT.md` |
| Claim JSON | `KGEN-AI-Company/reports/CLAIM-ORG-P2-004-20260715T0239-cursor-01.json` |

**Registration:** ACTIVE / T2 / `can_push_main=false`. **Single active execution this turn:** ORG-P2-004 only.

**Queue note:** First OPEN on `origin/main` was ORG-P2-003F-FIX1, but that task already holds an active REVIEW lease (`CLAIM-ORG-P2-003F-FIX1-20260715T0205-cursor-01`, expires `2026-07-15T06:05:59Z`). Per claim protocol it was **not** re-claimed. Next OPEN claimed: **ORG-P2-004**.

---

## 1. BOOT

| Check | Result |
|---|---|
| Boot file | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` ACTIVE / CURRENT |
| User request | `Claim one task` |
| Task | ORG-P2-004 (next claimable OPEN) |
| Roles | Cursor executes; Codex reviews |

## 2. MUST READ

| Item | Value |
|---|---|
| `worker_id` | `cursor-01` |
| Trust / status | T2 / ACTIVE |
| Branch permission | `cursor-handoff/<Task-ID>`; `can_push_main=false` |
| Reviewer | `codex-gm-01` |
| Allowed | **Yes** |

## 3. PROTECTED PATH CHECK

No protected paths edited (Canon text / Genesis / JSON / Boot / 12345 / contracts untouched).

## 4. TASK PLAN

Re-verify Org Core vs GEN-002 / GEN-004 / Machine JSON on current main; report wording risks; WorkQueue → REVIEW.

## 5. EXECUTION

```text
Claim → Alignment QA (docs only) → REPORT → REVIEW → Stop for Codex
```

**Verification Only / No Canon Rewrite**

---

## Executive Summary

**No hard Canon conflicts.** Organization Civilization Core Canon (L2 operating), Genesis GEN-002 (L1), GEN-004 (constitution), and `KGEN_CANON_MASTER.json` align on prime laws, economy loop, token facts, AI boundary, and review chain.

**Hard conflicts: 0**  
**Wording / projection drifts: documented below (non-negating)**

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Confirm no Canon conflict and list wording risk | ✅ 0 hard conflicts; drifts W1–W8 |
| Files read/modified, checks, risks, blockers, recommendation | ✅ |
| No protected path modified | ✅ |

## Hierarchy Under Test

```text
L0 Genesis + Boot CURRENT
  → L1 GEN-002 Canon
  → Genesis L2 Constitution (GEN-004) [separate scope]
  → L2 Org Operating Canon (KGEN_CIVILIZATION_CORE_CANON.md)
  → Machine Canon JSON (projection; must not override)
```

JSON `source_of_truth_order` places Organization V2.0 **last** — consistent with hierarchy.

## Hard Conflict Check

| Area | Result |
|---|---|
| Prime laws vs GEN-002 | ✅ No negation |
| Token 72M / 0.30% AMM / W2W no tax | ✅ Org §8 + JSON `token` + GEN-002 finance snapshot |
| AI cannot rewrite Canon | ✅ Org §7 + GEN AI Canon |
| Org below Genesis | ✅ |
| Canon Office No-Overreach | ✅ No deletes / no Genesis overturn in this task |

**Hard conflicts: 0**

## Cross-Layer Prime Rule Matrix (2026-07-15 re-audit)

| Rule | GEN-002 | Org Core §2 | JSON `canon_rules` | Verdict |
|---|---|---|---|---|
| 一圖一神殿 | ✅ | ✅ | ✅ | Aligned |
| 一神殿一生命 | ✅ | ✅ | ✅ | Aligned |
| 一土地一民宅 | ✅ | ✅ | ✅ | Aligned |
| 一民宅一商店 | ✅ | ⚠️ only「一民宅可演化」 | ✅ | **W1** |
| Wild Land / creator does not sell all land | ✅ | ⚠️ not in §2 | ✅ | **W2** |
| App is life | ✅ | ✅ | ✅ | Aligned |
| AI life organ | ✅ | ✅ | ✅ | Aligned |
| DNA / GA cores | ✅ | ✅ | ✅ | Aligned |
| 11520 exchange | ✅ | ✅ | ✅ | Aligned |
| KGEN 0.30% AMM | ✅ | ✅ §8 | ✅ | Aligned |
| NPC may evolve | ✅ (life evolve) | ✅ NPC 可演化 | ⚠️ no NPC bullet in `canon_rules` | **W3** |
| Physical temple / commerce | ✅ | absent §2 | ✅ | **W4** |
| Universe Portal | ✅ | ✅ §2 | ⚠️ not in `canon_rules` | **W5** |
| PrimeForge Mother Engine | ✅ | ✅ §2 | ⚠️ not in `canon_rules` | **W6** |

## Life Chain & Economy Loop

| Source | Content |
|---|---|
| Org Core §3 | Includes **NPC** between Building and App |
| GEN-002 engineering chain | Includes NPC → Module → Function |
| JSON `life_chain` | Omits NPC (Building → App) — **W3** |
| JSON `engineering_chain` | Includes NPC |
| Org §5 / JSON `economy_loop` | Identical English loop |

**Verdict:** No rule contradiction; NPC omission is projection drift only.

## Machine Canon Integrity

| Check | Result |
|---|---|
| `organization_v2` paths resolve | ✅ 8/8 |
| `civilization_core_canon` pointer | ✅ |
| `protected_paths` temple alias `KLINE_ODYSSEY_TEMPLE_12345` | ⚠️ vs path `K線西遊記/temples/12345` — **W7** |
| `official_links` X / Telegram | ✅ VERIFIED (updated since earlier drafts) |
| Provenance / workforce / biological blocks in JSON | ✅ present; Org Core silent — **W8** additive, not conflict |

## Wording Risk Register

| ID | Risk | Severity | Suggestion |
|---|---|---|---|
| **W1** | Org §2 lacks explicit「一民宅一商店」 | Low | Cumulative Org Core wording (Codex) |
| **W2** | Org §2 lacks explicit no-creator-total-sale | Low | Mirror GEN-002 / JSON bullet |
| **W3** | JSON `life_chain` omits NPC; `canon_rules` silent on NPC | Low | Align life_chain with Org §3 / engineering |
| **W4** | Physical commerce prime absent from Org §2 | Low | Optional add |
| **W5** | Universe Portal not in JSON `canon_rules` | Low | Optional |
| **W6** | PrimeForge not in JSON `canon_rules` | Low | Optional |
| **W7** | Temple protected-path alias spelling | Low | Document alias or unify string |
| **W8** | Org Core does not yet reference workforce/provenance governance | Low | Future Canon Office WO |

None of W1–W8 overturn Genesis.

## Files Read

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` (CURRENT header)
- `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Organization/Canon/README.md`, `ROLE.md`, `RESPONSIBILITY.md`
- `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md`
- `KGEN-Genesis/GEN-002_Canon/KGEN_Canon_V1.0.md` (snapshot + finance/token)
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN-KAIOS/worker_registry.json`
- `KGEN-OFFICIAL-LINKS.json` / `OfficialLinks.json` (existence)

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-004 OPEN → IN_PROGRESS → REVIEW + claim fields
- `KGEN-AI-Company/reports/ORG-P2-004_CANON_ALIGNMENT.md` — this report
- `KGEN-AI-Company/reports/CLAIM-ORG-P2-004-20260715T0239-cursor-01.json` — claim lease

## Files Deleted

None.

## Protected Paths Checked

No protected-path modifications.

## Checks Run

| Check | Result |
|---|---|
| Registration | ✅ ACTIVE T2 |
| Single execution claim | ✅ ORG-P2-004 (FIX1 skipped: active REVIEW lease) |
| Hard conflict scan | ✅ 0 |
| Path resolve `organization_v2` | ✅ 8/8 |
| Token facts | ✅ aligned |
| Claim JSON fields | ✅ |

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Agents treat Org Core as superseding Genesis | Medium | Hierarchy + `source_of_truth_order` |
| W1/W2 omission copied into product copy | Medium | Prefer GEN-002 / JSON explicit bullets until Org updated |

## Blockers

None.

## Recommendation

**APPROVE** ORG-P2-004. No hard Canon conflict. Optional follow-up: Codex-authorized wording pass for W1–W2 on Org Core (separate WO; still no Genesis rewrite).

---

## 6. FINAL REPORT

| Field | Value |
|---|---|
| Task | ORG-P2-004 |
| Result | Canon alignment verified; 0 hard conflicts; wording risks listed |
| Status requested | **REVIEW** |
| Branch | `cursor-handoff/ORG-P2-004-20260715` |
| Next | Codex Review |
