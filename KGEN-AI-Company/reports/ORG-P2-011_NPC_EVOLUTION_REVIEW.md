# ORG-P2-011 — NPC Evolution Constraints Review

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-011 |
| Date | 2026-07-16 |
| Base Commit | `89f3c35` |
| Branch | `cursor-handoff/ORG-P2-011-20260716` |
| Commit SHA | `a621875` |
| Author Worker ID | cursor-01 |
| Worker Agent ID | cursor-agent-0014 |
| Session ID | SESSION-20260716-15-EPHEMERAL |
| Spawned By | 本尊 |
| Supersedes | `2a449222` (`cursor-handoff/ORG-P2-011`, rejected 2026-07-13 — missing claim lease) |
| Start Status | OPEN (main WORK_QUEUE; Cursor does not modify WORK_QUEUE this session) |
| End Status | REVIEW (handoff report submitted; WQ status update = Codex only) |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | NPC |

---

## Files Read

| File | Purpose |
|------|---------|
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Worker boot gate |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Auto-work protocol |
| `KGEN-AI-Company/CURSOR_REPORTING_RULES.md` | Required report fields |
| `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md` | WorkOrder standard |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Task ORG-P2-011 acceptance criteria (read-only) |
| `KGEN-Organization/NPC/README.md` | NPC office position, cooperation model, no-overreach rule |
| `KGEN-Organization/NPC/ROLE.md` | NPC role definition and authority boundary |
| `KGEN-Organization/NPC/RESPONSIBILITY.md` | Core responsibilities and required outputs |
| `KGEN-Organization/NPC/HANDOFF.md` | Department handoff table |
| `KGEN-Organization/NPC/REPORT_TEMPLATE.md` | Department report shape |
| `KGEN-Organization/NPC/WORK_QUEUE.md` | Department-local queue (ORG-NPC-001..003) |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected path rules |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable Canon (`engineering_chain`, `canon_rules`) |
| `KGEN-KAIOS/V8.1/NPC_STANDARD.md` | NPC identity, fields, economy role, AI boundary |
| `KGEN-KAIOS/V8.1/LIFE_CYCLE_STANDARD.md` | Lifecycle stages for living entities including NPC |
| `KGEN-KAIOS/V8.1/PROFESSION_STANDARD.md` | Profession as economic role for Citizen/NPC/AI/App |
| `KGEN-KAIOS/V8.1/UNIVERSE_GRAPH.md` | NPC as system/AI-controlled service life |
| `KGEN-KAIOS/V8.1/runtime/RUNTIME_RELATIONSHIP_MAP.md` | Temple/AI runtime links to NPC |
| `KGEN-KAIOS/boot-runtime/SPECIES_OS_STANDARD.md` | `NPC_OS` role overlay rules |
| `KGEN-KAIOS/genesis-dna/GENESIS_DNA_EVOLUTION_RUNTIME.md` | Cross-layer evolution architecture (UNDER_REVIEW on main) |
| `KGEN-KAIOS/genesis-dna/ROLE_CAPABILITY_PROFILES.md` | RoleCapabilityProfile; NPC fair-access to GA107/108 |
| `KGEN-KAIOS/V8.3/TIME_ENGINE.md` | Time-state requirement for NPC (read for evolution context) |

## Files Modified

| File | Change |
|------|--------|
| `KGEN-AI-Company/reports/ORG-P2-011_NPC_EVOLUTION_REVIEW.md` | Created (this report) |

**Not modified (per spawn directive):** `KGEN-Organization/WorkOrders/WORK_QUEUE.md` and all protected paths.

## Protected Paths Checked

| Path | Touched |
|------|---------|
| `contracts` | No |
| `K線西遊記/temples/12345` | No |
| `wallet` | No |
| `bridge` | No |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | No |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | No |
| `docs/physics/final-whitepaper/` | No |
| `KGEN/contracts/KGEN_Token_V7_5_2.sol` | No |

---

## Task Result

**PASS.** NPC evolution limits and risks are identifiable from NPC department governance docs, KAIOS V8.1 standards, Species OS overlay rules, and the genesis-dna architecture proposal on base `89f3c35`. No hard Canon contradictions. Four documentation gaps remain for follow-up WorkOrders (PROPOSED only).

---

## Department Alignment (NPC README / ROLE / RESPONSIBILITY)

| Source | Requirement | Evolution implication |
|--------|-------------|----------------------|
| README — Department Position | NPC manages residents, merchants, cultivators, guards, service roles, and AI life behavior | Evolution is **role + lifecycle + service-scope** governance, not ad-hoc runtime patches |
| README — No-Overreach Rule | Must not destroy player assets, bypass governance, or generate unlimited economic resources | Hard ceiling on NPC **Upgrade**, **Trade**, and **AI-assisted** outputs |
| ROLE — Authority Boundary | Same no-overreach rule; department-scoped execution only | NPC evolution docs cannot authorize contract/temple/wallet changes |
| RESPONSIBILITY | Align with Canon; check protected paths; report risks and Codex decisions | This report satisfies required outputs without touching runtime |

---

## NPC Identity and Chain Position

From `KGEN_CANON_MASTER.json`:

```text
engineering_chain: Universe → Civilization → World → Temple → Land → Building → NPC → AI → Module → DNA → Function → Code
```

NPC sits **between Building and AI**. NPC is a system-controlled or AI-assisted civilization life with identity, lifecycle, profession, residence, and service scope — not a filler object (`NPC_STANDARD.md`).

NPC office position (Traditional Chinese, authoritative in dept docs): *NPC 管理居民、商人、修行者、守衛、服務角色與 AI 生命行為。*

---

## NPC Evolution Constraints

### C1 — Lifecycle order (V8.1 Life Cycle Standard)

NPC is explicitly in scope of the Life Cycle Standard. Applicable stages and NPC-specific meaning:

| Stage | NPC context | Constraint |
|-------|-------------|------------|
| Create | `npc_id`, `name`, `role`, `residence` recorded | Required entry; no anonymous economy actors |
| Grow | Basic state, profession, service capacity | Time/XP/onboarding gated |
| Learn | Profession skill or AI guidance integration | Quest/school/work evidence |
| Work | Shopkeeping, guiding, guarding, temple reception, missions | Output + employer/business link required |
| Trade | Baseline economy loop participation | Must be marked **system/simulation** activity |
| Build | Contribute to construction or service node setup | Build dependency recorded |
| Upgrade | Profession, service scope, or AI module improvement | **Governance approval** for significant upgrades |
| Reproduce | Concept-layer inheritance (population expansion) | Parent/child relationship; not unbounded spawn |
| Retire | Leaves active operation | `Retired` status + final state |
| Archive | Historical preservation | Archive metadata; no silent resurrection |
| Delete | Reversible/non-production only | Production deletion requires audit/consent/governance |

**Skip-stage prohibition:** NPC cannot jump Create → Upgrade without Grow, Learn, and Work (mirrors Building skip-level rule from ORG-P2-010 pattern).

Each transition must record: `from_stage`, `to_stage`, `actor`, `timestamp`, `runtime`, `reason`, `dependencies`, `risk_level`, `recovery_path`.

---

### C2 — Economy bounds (NPC Standard + dept no-overreach)

From V8.1 NPC Standard:

> NPC market activity must be visibly marked as system or simulation activity.

**Hard limits:**

- No unlimited resource generation.
- No player asset destruction or seizure outside **governed war** rules (Canon: land may be conquered by governed war).
- No governance bypass for marketplace transactions.
- Baseline services only: tutorial, shopkeeping, temple reception, bank simulation, exchange listing review, guard patrol, mission dispatch, craft service.

---

### C3 — AI integration boundary

From V8.1 NPC Standard:

> AI-generated advice, price, or transaction recommendation must be labeled as assistance, not guaranteed outcome.

**Hard limits:**

- AI outputs are advisory, not authoritative.
- NPC + AI cannot make binding governance decisions.
- `ai_link` must reference a declared AI module.
- AI does **not** elevate NPC permission beyond non-AI NPC limits (`AI_RUNTIME.md`: AI serves NPC assistance).

---

### C4 — Species OS overlay (`NPC_OS`)

From `SPECIES_OS_STANDARD.md`:

- `NPC_OS` is a **role overlay** on a reviewed underlying Species profile (Human, Robot, etc.).
- Overlay **must not erase** underlying Species identity.
- Reproduction model inherits underlying profile or is not applicable.

**Evolution implication:** NPC Upgrade cannot change underlying Species OS without a governed Species/Genome mutation path (genesis-dna layer).

---

### C5 — Genesis DNA cross-layer bounds (proposal on main `89f3c35`)

`GENESIS_DNA_EVOLUTION_RUNTIME.md` and `ROLE_CAPABILITY_PROFILES.md` are **ARCHITECTURE_PROPOSAL_UNDER_REVIEW** — not runtime law yet, but they define intended evolution ceilings:

| Rule | NPC impact |
|------|------------|
| Atom count `0..108` independent of Evolution XP / Training Level | NPC capability growth ≠ automatic atom unlock |
| `RoleCapabilityProfile` is curated atom selection, not caste | NPC profession/role titles do **not** grant atoms by themselves |
| Fair access: eligible player, AI, **NPC**, or life share same GA107/108 eligibility path | NPC may pursue high atoms only through evidence/review gates — not purchase or inheritance |
| GA108 never overrides Human Final Authority | NPC evolution cannot claim constitutional supremacy |

Until genesis-dna is promoted beyond UNDER_REVIEW, treat these as **design constraints** aligned with dept no-overreach, not enforced runtime hooks.

---

### C6 — Status machine (V8.1 NPC Standard)

| Status | Meaning | Allowed transitions |
|--------|---------|---------------------|
| Active | Operational | → Dormant, → Retired |
| Dormant | Temporarily inactive | → Active, → Retired |
| Retired | Left active operation | → Archived |
| Archived | Preserved for history | None (new Create = new identity) |
| Disputed | Under governance review | → Active (resolved), → Retired (ruled out) |

Archived → Active requires a new Create event with new identity record.

---

### C7 — No runtime / protected-path mutation

Per DO_NOT_TOUCH and NPC RESPONSIBILITY:

- NPC evolution governance tasks are **documentation-layer only**.
- Behavior changes in `K線西遊記/temples/12345` or contracts require explicit Codex + human authorized WorkOrder.
- V8.3 TIME_ENGINE requires time-state for NPC growth/decay — implementation is future Runtime work, not in scope here.

---

## Checks Run

### Check 1 — Canon alignment matrix

| Constraint | Canon / standard basis | Result |
|------------|------------------------|--------|
| NPC in engineering chain (Building → NPC → AI) | `engineering_chain` | ✅ Aligned |
| NPC cannot bypass governance | Canon land/war + dept no-overreach | ✅ Aligned |
| NPC cannot mint unlimited economy | Dept no-overreach + simulation marking | ✅ Aligned |
| NPC serves temples, exchanges, banks, shops | Canon rule on 11520 exchange scope | ✅ Aligned |
| NPC lifecycle applies | `LIFE_CYCLE_STANDARD.md` explicit NPC scope | ✅ Aligned |
| NPC_OS preserves Species identity | `SPECIES_OS_STANDARD.md` §6 | ✅ Aligned |

### Check 2 — Protected path integrity

No protected path read for write. Report-only handoff.

**Result:** PASS.

### Check 3 — Dept doc consistency

README, ROLE, and RESPONSIBILITY agree on position and no-overreach rule. No internal contradiction.

**Result:** PASS.

### Check 4 — Supersedes prior handoff `2a449222`

Prior report content validated against current main; genesis-dna and Species OS overlay constraints added for `89f3c35` lineage. Prior rejection reason (missing claim lease) addressed by ephemeral session metadata block above; atomic claim service remains NOT_IMPLEMENTED company-wide.

**Result:** PASS (content supersession complete).

---

## Problems Found

| # | Problem | Severity | Type |
|---|---------|----------|------|
| 1 | No document defines XP thresholds or governance triggers for NPC **Upgrade** transitions | Low | Technical debt |
| 2 | NPC role categories (guide, vendor, guard, banker, exchange operator, teacher, builder, temple keeper) not mapped to buildings/temples/service nodes | Low | Gap |
| 3 | **Disputed** status resolution body/process undefined | Low | Gap |
| 4 | genesis-dna proposal vs V8.1 NPC fields not yet bridged in a single runtime schema | Low | Cross-layer gap (proposal only) |

---

## Risks

| Risk | Severity | Owner | Mitigation |
|------|----------|-------|------------|
| Uncontrolled AI module on NPC emits misleading prices/recommendations | Medium | AI Runtime + NPC | V8.1 advisory-only labeling; `ai_link` declaration |
| NPC Upgrade without governance spawns overpowered simulation actors | Medium | Codex / Governance | Require governance approval for significant upgrades (C1) |
| Disputed NPCs with no resolver stall indefinitely | Low | Codex | Define resolution WorkOrder (PROPOSED below) |
| Premature implementation of genesis-dna atom rules on NPC before review promotion | Medium | Architecture | Keep genesis-dna UNDER_REVIEW; no runtime code this task |

---

## Technical Debt

1. NPC Upgrade preconditions (XP, governance triggers, evidence gates).
2. NPC role → building/temple/service-node mapping table.
3. Disputed NPC governance resolution path.
4. Formal bridge document: V8.1 `npc_id` record ↔ genesis-dna `LifeProfile` / `RoleCapabilityProfile`.

---

## Evolution Opportunities

- **Time-state evolution (V8.3):** NPC grow/decay/work/rest cycles can drive organic service capacity changes without unbounded resource minting.
- **Profession path (V8.1):** NPC evolution can follow Profession Standard upgrade paths tied to buildings and missions.
- **RoleCapabilityProfile (genesis-dna):** Non-hereditary archetype overlays (e.g. service/stewardship profiles) could replace fixed NPC “levels” once promoted.

---

## Research Direction

- Compare temple runtime NPC instances in `K線西遊記/` (read-only survey) against V8.1 field model — future QA task, not this handoff.
- Evaluate whether `ORG-NPC-003` (department PROPOSED WorkOrder) should become formal P2 follow-up after Codex accepts this review.

---

## Suggested WorkOrders (Status: PROPOSED)

| Suggested ID | Scope | Reason |
|-------------|-------|--------|
| ORG-P2-011A | Define NPC Upgrade preconditions and governance triggers | Tech debt 1 |
| ORG-P2-011B | Map NPC roles to buildings, temples, and service nodes | Gap 2 |
| ORG-P2-011C | Define Disputed NPC resolution process | Gap 3 |
| ORG-P2-011D | Draft V8.1 ↔ genesis-dna NPC/LifeProfile schema bridge (doc only) | Gap 4 |

Cursor does **not** edit live WORK_QUEUE for these suggestions.

---

## Do Not Do

- Do not modify runtime modules, temple shells, contracts, wallet, or bridge.
- Do not rewrite NPC logic in existing game code during governance tasks.
- Do not promote genesis-dna proposal to Canon without Codex assignment.
- Do not edit `WORK_QUEUE.md` from this worker session (spawn directive: report only).

---

## Blockers

None for documentation-layer constraint definition.

---

## Recommendation

**APPROVE.** NPC evolution constraints are clear, Canon-consistent, and grounded in NPC department governance plus KAIOS V8.1 standards. Five constraint classes (lifecycle, economy, AI boundary, Species OS overlay, status machine) plus genesis-dna design bounds are sufficient for P2 documentation governance. Follow-up PROPOSED WorkOrders address remaining gaps.

---

## Need Codex Review

Yes.

## Need Human Decision

No.
