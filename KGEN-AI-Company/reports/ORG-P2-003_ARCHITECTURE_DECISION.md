# ORG-P2-003 Architecture Decision

**Task ID:** ORG-P2-003  
**Decision Date:** 2026-07-10  
**Reviewed Branch:** `cursor-handoff/ORG-P2-003`  
**Reviewed Commit:** `1b31fcb49613c59a9e37a90e8a9bb708ec243b0f`  
**Cursor Report:** `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DUPLICATE_CHECK.md`  
**Codex Decision:** APPROVE  
**Scope:** Documentation and architecture governance only. No file deletion, no folder merge, no protected path edit.

## Review Result

Codex approves ORG-P2-003 as an architecture duplicate and same-function audit. The report identifies real governance overlap without modifying protected systems. The handoff branch contains reports for ORG-P2-001 and ORG-P2-002 in its history; those tasks remain REVIEW and require separate Codex review. This decision approves only ORG-P2-003.

## Protected Path Check

No changes were found under:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

## Architecture Decision Summary

| ID | Topic | Decision | Official Position | Required Follow-up |
|---|---|---|---|---|
| D1 | Three WorkQueue systems | MERGE | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` is the single live WorkQueue. Legacy queues remain readable but must become superseded pointers. | ORG-P2-003A |
| D2 | AI-Company vs Agent-Office | KEEP | `KGEN-AI-Company/` is the company operating system; `KGEN-Agent-Office/` is daily operations, protected-path discipline, and legacy onboarding support. | ORG-P2-003B |
| D3 | Reports | ALIAS | `KGEN-AI-Company/reports/` is the primary report path. Other report folders are department or legacy aliases, not live intake points. | ORG-P2-003B |
| D4 | Canon / Genesis / Organization Canon / JSON Canon | KEEP | Establish hierarchy: L0 Genesis, L1 Canon, L2 Organization Canon, Machine Canon as machine-readable projection. | ORG-P2-003C |
| D5 | `wukong-temple` vs `K線西遊記/temples/12345` | ARCHIVE | `K線西遊記/temples/12345/` is Current and protected. `wukong-temple/` is Legacy and should be labeled as such, without code migration. | ORG-P2-003D |
| D6 | Physics Runtime byte-identical copies | ALIAS | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` is the Single Source of Truth. Byte-identical historical copies should become reference-only where allowed. | ORG-P2-003D |
| D7 | Master Indexes | ALIAS | `KGEN_MASTER_LIBRARY_INDEX.md` is the unique library-level Master. `docs/KGEN_MASTER_INDEX.md` is repo inventory. `KGEN-Genesis/KGEN_MASTER_INDEX.md` is Genesis sub-index. | ORG-P2-003E |
| D8 | `runtime-*` and `kgen-12345-*` module names | FUTURE MIGRATION | No protected path edit now. Future work must draft a naming migration plan before touching 12345 runtime files. | ORG-P2-003F |

## D1 Decision - Three WorkQueue Systems

**Decision:** MERGE.

`KGEN-Organization/WorkOrders/WORK_QUEUE.md` is the only live queue for Cursor execution. `KGEN-Cursor-WorkOrders/` and `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` should not be deleted. They should be converted into superseded references that point to the Organization WorkQueue. This keeps archaeology readable while preventing Cursor from receiving conflicting task sources.

## D2 Decision - AI-Company vs Agent-Office

**Decision:** KEEP.

The two folders have distinct roles:

- `KGEN-AI-Company/` = company operating system, dispatcher, employee boot, handoff branch workflow, Codex review, and official reports.
- `KGEN-Agent-Office/` = daily operating desk, protected-path rules, onboarding support, and legacy prompt/report references.

They do not need a folder merge. They do need clearer cross-links so Cursor always treats AI-Company as the live operating system.

## D3 Decision - Reports

**Decision:** ALIAS.

The primary report intake is `KGEN-AI-Company/reports/`. Department reports may keep local templates under `KGEN-Organization/Reports/`, and older Agent Office reports may remain as archive/legacy references. Future docs should make all non-primary report paths point back to AI-Company reports.

## D4 Decision - Canon Hierarchy

**Decision:** KEEP.

Official hierarchy:

| Level | Authority | Path | Rule |
|---|---|---|---|
| L0 Genesis | Genesis / Boot authority | `KGEN-Genesis/GEN-001_Genesis_Bible/`, `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | Highest origin and AI boot authority |
| L1 Canon | Published Canon | `KGEN-Genesis/GEN-002_Canon/` | Human-readable official Canon |
| L2 Organization Canon | Operating Canon | `KGEN-Organization/Canon/KGEN_CIVILIZATION_CORE_CANON.md` | Company execution and department governance |
| Machine Canon | Machine-readable Canon | `KGEN-Canon/KGEN_CANON_MASTER.json` | JSON projection of L0-L2; must not override them |

This avoids conflict by treating JSON Canon as an operational projection, not a competing source of truth.

## D5 Decision - Wukong Temple vs 12345

**Decision:** ARCHIVE.

`K線西遊記/temples/12345/` is Current and protected. `wukong-temple/` is Legacy. It may remain accessible for historical and compatibility reasons, but should be labeled as Legacy and should point users toward 12345. No code migration, deletion, redirect, or wallet change is approved by this decision.

## D6 Decision - Physics Copies

**Decision:** ALIAS.

If byte-identical physics runtime copies exist, they should not be deleted in this task. `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` remains Single Source of Truth. Historical copies should receive reference notes only through a future scoped WorkOrder, and protected paths require explicit human authorization before edit.

## D7 Decision - Master Index

**Decision:** ALIAS.

`KGEN_MASTER_LIBRARY_INDEX.md` is the unique library-level Master Index. Other master-like indexes stay useful when their scope is explicit:

- `docs/KGEN_MASTER_INDEX.md`: full repository inventory.
- `KGEN-Genesis/KGEN_MASTER_INDEX.md`: Genesis Library sub-index.

Future documentation should label these as aliases/sub-indexes rather than competing masters.

## D8 Decision - Runtime and 12345 Module Naming

**Decision:** FUTURE MIGRATION.

No 12345 runtime or module file may be changed in this decision. Future migration must begin with a naming registry and compatibility plan. The plan must map existing `runtime-*` and `kgen-12345-*` modules, identify current boot order, and define one official naming pattern before any protected file is touched.

## Follow-up WorkOrders

Codex creates follow-up WorkOrders so Cursor can process decisions incrementally:

- ORG-P2-003A: Add superseded/alias notes for legacy WorkQueues.
- ORG-P2-003B: Normalize AI-Company / Agent-Office / reports routing language.
- ORG-P2-003C: Document L0/L1/L2/Machine Canon hierarchy without rewriting Canon.
- ORG-P2-003D: Draft legacy temple and physics-copy reference policy without protected edits.
- ORG-P2-003E: Clarify Master Index alias hierarchy.
- ORG-P2-003F: Draft future 12345 module naming migration plan without protected edits.

## Final Decision

APPROVE ORG-P2-003. Merge the handoff branch and this Codex decision into `main`. Keep ORG-P2-001 and ORG-P2-002 in REVIEW for separate approval.