# ORG-P2-011 — NPC Evolution Constraints Review

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-011 |
| Date | 2026-07-12 |
| Base Commit | 0f256af |
| Branch | `cursor-handoff/ORG-P2-011` |
| Author Worker ID | cursor-01 |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | NPC |

---

## Files Read

| File | Purpose |
|------|---------|
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Boot and worker gate |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Protocol rules |
| `KGEN-AI-Company/CURSOR_REPORTING_RULES.md` | Required report fields |
| `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md` | WorkOrder standard |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Live task source |
| `KGEN-Organization/NPC/README.md` | NPC office position |
| `KGEN-Organization/NPC/ROLE.md` | NPC role and authority |
| `KGEN-Organization/NPC/RESPONSIBILITY.md` | NPC responsibilities |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected path rules |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable Canon |
| `KGEN-KAIOS/V8.1/NPC_STANDARD.md` | KAIOS V8.1 NPC definition and fields |
| `KGEN-KAIOS/V8.1/LIFE_CYCLE_STANDARD.md` | Lifecycle stages for all living entities |

## Files Modified

| File | Change |
|------|--------|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ORG-P2-011 status OPEN → IN_PROGRESS → REVIEW |
| `KGEN-AI-Company/reports/ORG-P2-011_NPC_EVOLUTION_REVIEW.md` | Created (this report) |

## Protected Paths Checked

All protected paths confirmed untouched. No runtime, contract, temple, wallet, bridge, or boot files modified.

---

## Task Result

**PASS.** NPC evolution constraints are identifiable from Canon, NPC Standard, and Life Cycle Standard. No contradictions found. Three gaps require follow-up WorkOrders.

---

## NPC Identity and Position (from Canon + V8.1)

NPC appears in the engineering chain:
```
Universe → Civilization → World → Temple → Land → Building → NPC → AI → Module → DNA → Function → Code
```

NPC sits **between Building and AI** in the engineering chain. NPC is not a player character but a system-controlled or AI-assisted civilization life with identity, lifecycle, profession, residence, and service scope.

NPC office position: "NPC 管理居民、商人、修行者、守衛、服務角色與 AI 生命行為。"

No-overreach rule: "不得讓 NPC 破壞玩家資產或繞過治理；不得讓 NPC 無限制生成經濟資源。"

---

## NPC Evolution Constraints

### Constraint 1 — NPC must follow the Life Cycle Standard

NPC is a living entity under KAIOS V8.1. It must pass through lifecycle stages in order:

| Stage | NPC Context | Notes |
|-------|------------|-------|
| Create | NPC record created with `npc_id`, `name`, `role`, `residence` | Required by V8.1 NPC Standard |
| Grow | NPC obtains basic state, profession, service capacity | Time- or XP-gated |
| Learn | NPC gains profession skill or AI guidance integration | Quest/school/work |
| Work | NPC produces service: shopkeeping, guiding, guarding, temple reception | Output record required |
| Trade | NPC may buy/sell through economy loop (baseline only; must be visibly marked as simulation) | V8.1 AI Boundary rule |
| Upgrade | NPC improves profession, service scope, or AI module | Governance approval required for significant upgrades |
| Retire | NPC leaves active operation | Retired status with final state recorded |
| Archive | NPC preserved for history | Archive metadata required |

**Skip-stage restriction:** NPC cannot jump from Create to Upgrade without passing through Grow, Learn, and Work stages. This mirrors the Building evolution skip-level prohibition.

---

### Constraint 2 — NPC economy role is bounded

From V8.1 NPC Standard:
> "NPC market activity must be visibly marked as system or simulation activity."

**Hard limits:**
- NPC **cannot** generate unlimited economic resources.
- NPC **cannot** destroy or seize player assets outside governed war rules.
- NPC **cannot** bypass governance when making marketplace transactions.
- NPC economy participation is baseline-service only (tutorial, shopkeeping, temple reception, bank simulation, mission dispatch, craft service).

---

### Constraint 3 — NPC AI integration boundary

From V8.1 NPC Standard:
> "An NPC may use AI, but any AI-generated advice, price, or transaction recommendation must be labeled as assistance, not guaranteed outcome."

**Hard limits:**
- AI-generated NPC outputs are advisory, not authoritative.
- NPC + AI combination cannot make binding governance decisions.
- NPC AI link must reference a declared AI module (`ai_link` field).
- NPC with AI cannot take actions that a non-AI NPC is not permitted to take (AI does not elevate NPC permission level).

---

### Constraint 4 — NPC cannot change Runtime or code

From NPC No-overreach rule and DO_NOT_TOUCH:
- NPC evolution **does not touch** `K線西遊記/temples/12345` runtime files.
- NPC behavior changes require a documented WorkOrder before any code is modified.
- NPC logic in existing runtime modules must not be rewritten during NPC department governance tasks.

---

### Constraint 5 — NPC status machine

NPC has five valid statuses per V8.1:

| Status | Meaning | Allowed Transitions |
|--------|---------|-------------------|
| Active | Operational | → Dormant, → Retired |
| Dormant | Temporarily inactive | → Active, → Retired |
| Retired | Left active operation | → Archived |
| Archived | Preserved for history | No further transitions |
| Disputed | Under governance review | → Active (resolved), → Retired (ruled out) |

NPC cannot go from Archived back to Active without a new Create event with a new identity record.

---

## Checks Run

### Check 1 — Canon alignment

| NPC constraint | Canon basis | Aligned |
|---------------|-------------|---------|
| NPC sits in engineering chain between Building and AI | `engineering_chain` | ✅ |
| NPC cannot bypass governance | "Land may be conquered by governed war" implies governance rules apply universally | ✅ |
| NPC cannot generate unlimited economic resources | No-overreach rule + Economy Loop risk rules | ✅ |
| NPC can work in temples, exchanges, banks, shops | "11520 Huaguo Mountain Exchange is the marketplace for App, Land, Temple, AI, DNA..." | ✅ |

### Check 2 — No runtime code modified

No runtime file was read or modified. NPC constraints are documentation-layer only.

**Result:** PASS.

### Check 3 — Lifecycle completeness for NPC

All 11 lifecycle stages from V8.1 Life Cycle Standard apply to NPC. NPC-specific interpretations for each stage are listed in Constraint 1 above.

**Result:** PASS.

---

## Problems Found

| # | Problem | Severity | Type |
|---|---------|----------|------|
| 1 | No document defines specific XP thresholds or governance triggers for NPC Upgrade transitions. | Low | Technical Debt |
| 2 | NPC role categories (guide, vendor, guard, banker, exchange operator, teacher, builder, temple keeper) are listed in V8.1 but not mapped to which buildings/temples they serve. | Low | Gap |
| 3 | Disputed status resolution path is undefined (who resolves? what governance body?). | Low | Gap |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| NPC with uncontrolled AI module could generate misleading prices/recommendations | Medium | V8.1 AI Boundary rule enforces advisory-only labeling |
| NPC Upgrade without governance approval could create overpowered simulation NPCs | Medium | Governance approval requirement for upgrades |
| Disputed NPCs with no resolution path could become permanently blocked | Low | Define governance resolution body in follow-up WorkOrder |

---

## Technical Debt

1. NPC Upgrade preconditions (XP thresholds, governance triggers) not defined.
2. NPC role-to-building mapping not documented.
3. Disputed status resolution governance body not defined.

---

## Suggested WorkOrders (PROPOSED)

| Suggested ID | Scope | Reason |
|-------------|-------|--------|
| ORG-P2-011A | Define NPC Upgrade preconditions and governance triggers | Addresses Tech Debt 1 |
| ORG-P2-011B | Map NPC roles to buildings, temples, and service nodes | Addresses Gap 2 |
| ORG-P2-011C | Define Disputed NPC resolution process | Addresses Gap 3 |

---

## Do Not Do

- Do not modify any runtime modules, temple, or contract files.
- Do not rewrite NPC logic in existing game code.
- Do not create NPC-specific Canon rules without Codex assignment.

## Blockers

None.

## Recommendation

**APPROVE.** NPC evolution constraints are clear, Canon-consistent, and grounded in KAIOS V8.1 standards. The five key constraints (lifecycle order, economy bounds, AI advisory-only, no-code-touch, status machine) are sufficient for documentation governance. Three technical debt items should be addressed in follow-up WorkOrders.

## Need Codex Review

Yes.

## Need Human Decision

No.
