# ORG-P2-003C Canon Hierarchy Map

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003C |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-10 |
| Base Commit | bd632db3f9c6337359a77fb7ac69da93b229d258 |
| Branch | `cursor-handoff/ORG-P2-003C` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003C_CANON_HIERARCHY_MAP.md` |
| WorkQueue Status | REVIEW |
| Reviewer | Codex |
| Architecture Decision | D4 KEEP — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Mapped the official Canon hierarchy per ORG-P2-003 D4: **L0 Genesis → L1 Published Canon → L2 Organization Canon → Machine Canon (JSON projection)**. No Canon files were rewritten. **Nine wording-drift items** were identified; none are hard contradictions with Genesis prime laws or token facts.

**Reissue note:** Prior handoff `6bad0f4` was based on `bfb40a0` and was not merged. This delivery rebases the same hierarchy map onto current `origin/main` (`bd632db`), updating Boot CURRENT path (`PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`).

## Official Hierarchy (D4)

```text
L0 Genesis
  ├─ KGEN-Genesis/GEN-001_Genesis_Bible/
  └─ PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md   (Boot CURRENT / formal entry; protected)
       · ancestor: PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md
       ↓
L1 Canon (published)
  └─ KGEN-Genesis/GEN-002_Canon/
       ↓
L2 Organization Canon (operating)
  └─ KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md
       ↓
Machine Canon (projection — must not override L0–L2)
  └─ KGEN-Canon/KGEN_CANON_MASTER.json
```

| Level | Authority | Path | Status label | Rule |
|---|---|---|---|---|
| **L0 Genesis** | Origin / Boot | `KGEN-Genesis/GEN-001_Genesis_Bible/` + `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` (CURRENT; V1_4 ancestor) | Official V1.0 Full Canon Set (GEN-001) | Highest origin; Boot CURRENT is AI mandatory entry |
| **L1 Canon** | Published world rules | `KGEN-Genesis/GEN-002_Canon/` | Official V1.0 Full Canon Set | Human-readable official Canon; may not be negated |
| **L2 Organization Canon** | Company operating Canon | `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md` | Draft for Review | Converts L0–L1 into agent/department operating rules |
| **Machine Canon** | JSON projection | `KGEN-Canon/KGEN_CANON_MASTER.json` | Draft for Review | Machine-readable projection of L0–L2; **must not override** them |

## Related Layers (Not Competing Canon)

| Layer | Path | Relation to hierarchy |
|---|---|---|
| GEN-004 Civilization Constitution | `KGEN-Genesis/GEN-004_…` | Genesis **L2 Constitution** (document-level L2) — governance constitution, not Org operating Canon |
| Runtime CURRENT | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Above Org in `source_of_truth_order`; physics law, not Canon rewrite |
| Universe Map V10.2 | `docs/maps/UniverseMap_V10_2_…json` | Coordinate authority; cited by all Canon layers |
| Org standards (Economy/Temple/Land/App) | `KGEN-Organization/*/KGEN_*_STANDARD.md` | L3 Design / L4 Runtime references under L2 Org Canon |

**Note:** Genesis Library uses “L2 Constitution” for GEN-004. Organization D4 uses “L2 Organization Canon” for Civilization Core. These are **different L2 scopes** — document-level vs company-operating. Do not merge them.

## Machine Canon `source_of_truth_order`

From `KGEN_CANON_MASTER.json`:

```text
Boot V1.4 → Runtime CURRENT → Universe Map → Genesis Library
→ Runtime Library → SDK Library → KGEN V7.5.2 Contract → KGEN Organization V2.0
```

This places Organization **below** Genesis Library — consistent with D4 (Org extends; does not supersede L0/L1).

## Cross-Layer Alignment Snapshot

| Topic | L1 GEN-002 | L2 Org Core | Machine JSON | Drift? |
|---|---|---|---|---|
| 一圖一神殿 | ✅ | ✅ | ✅ | No |
| 一神殿一生命 | ✅ | ✅ | ✅ | No |
| 一土地一民宅 | ✅ | ✅ | ✅ | No |
| 一民宅一商店 | ✅ | ⚠️ 「一民宅可演化」only | ✅ One house, one shop | **W1** |
| Wild Land / no creator total sale | ✅ | implied | ✅ | **W2** (Org §2 not explicit) |
| App 即生命 | ✅ | ✅ | ✅ | No |
| AI life organ | ✅ | ✅ | ✅ | No |
| DNA / GA | ✅ | ✅ | ✅ | No |
| 11520 exchange | ✅ | ✅ | ✅ | No |
| Economy loop | ✅ ZH | ✅ EN | ✅ EN | No (language only) |
| Life chain NPC | engineering chain | includes NPC | `life_chain` omits NPC | **W3** |
| Token 0.30% AMM | ✅ | ✅ §8 | ✅ | No |
| Physical temple link | ✅ | absent §2 | ✅ | **W4** |

## Wording Drift Register (No Rewrite)

| ID | Drift | Severity | Suggested fix (future Codex WorkOrder) |
|---|---|---|---|
| **W0** | Org Core header says `Level: L1 Canon`; D4 defines it as **L2 Organization Canon** | High (label) | Cumulative header fix: Level → L2 Organization Canon |
| **W1** | Org §2 omits explicit「一民宅一商店」 | Medium | Add bullet in cumulative Org Canon update |
| **W2** | Org §2 omits「創世者不販售所有土地」 | Low | Add bullet; Land Standard already states it |
| **W3** | JSON `life_chain` omits NPC; Org includes NPC; JSON has separate `engineering_chain` | Low | Document NPC belongs to engineering_chain / Org life chain |
| **W4** | Physical commerce rule in JSON/GEN-002, not Org §2 | Low | Cross-ref Temple Standard or add bullet |
| **W5** | GEN-001/002 status Official vs Org/JSON Draft for Review | Medium | Harmonize status when Org Canon is promoted |
| **W6** | Dual “L2” meaning: GEN-004 Constitution vs Org Operating Canon | Medium | Always qualify: “Genesis L2 Constitution” vs “Org L2 Operating Canon” |
| **W7** | JSON `protected_paths` uses `KLINE_ODYSSEY_TEMPLE_12345` vs filesystem `K線西遊記/temples/12345` | Medium | Align string in Machine Canon (ORG-P2-019) |
| **W8** | Org Core lists「PrimeForge is Mother Engine」not in JSON `canon_rules` | Low | Add to JSON or mark Org operational extension |
| **W9** | Boot formal entry is now `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`; V1_4 is ancestor. Org Core / older docs still say「Boot V1.4」 | Medium | Cumulative wording update to「Boot CURRENT」with V1_4 as ancestor |

## Hard Conflicts

**None.** No L2 or Machine Canon rule negates L0/L1 prime laws, Boot authority, or KGEN V7.5.2 token facts.

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Map L0 / L1 / L2 / Machine Canon | ✅ |
| Identify wording drift only; do not rewrite Canon | ✅ Report-only; no Canon body edits |
| No protected path modified | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Genesis/GEN-001_Genesis_Bible/README.md`
- `KGEN-Genesis/GEN-002_Canon/README.md`
- `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003C OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003C_CANON_HIERARCHY_MAP.md` — this report (created)

## Protected Paths Checked

No modifications to: `contracts/`, `K線西遊記/temples/12345/`, `wallet/`, `bridge/`, Boot V1.4, Runtime CURRENT, final-whitepaper, `KGEN_Token_V7_5_2.sol`.

## Checks Run

| Check | Result |
|---|---|
| Clean branch from `origin/main` | ✅ @ `bfb40a0` |
| First OPEN task | ✅ ORG-P2-003C |
| Canon body rewrite | ✅ None |
| Protected path diff | ✅ Clean |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Agents treating Org Core as L1 may bypass GEN-002 | High until W0 fixed |
| R2 | Dual L2 vocabulary confuses Constitution vs Operating Canon | Medium |

## Blockers

None.

## Recommendation

1. **Codex:** Approve ORG-P2-003C hierarchy map.
2. **Follow-up:** Assign a Canon cumulative update for **W0** (Level label) as highest priority wording fix.
3. **Cursor next:** ORG-P2-003D or ORG-P2-004 (P0 Canon alignment — may reuse this map).

## Need Codex Review

**Yes.**

## Need Human Decision

**No** for this mapping task. Human decision only if promoting Org Canon from Draft to Official.
