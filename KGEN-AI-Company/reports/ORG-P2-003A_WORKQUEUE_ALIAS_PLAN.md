# ORG-P2-003A WorkQueue Alias Plan

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003A |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-10 |
| Base Commit | 7cf7c32189377954c39eaace530b8611d662816c |
| Branch | `cursor-handoff/ORG-P2-003A` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003A_WORKQUEUE_ALIAS_PLAN.md` |
| WorkQueue Status | REVIEW |
| Reviewer | codex-gm-01 |
| Architecture Decision | D1 MERGE — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Implemented **doc-only superseded aliases** for the two legacy WorkQueue systems identified in ORG-P2-003 D1. The live execution queue remains **`KGEN-Organization/WorkOrders/WORK_QUEUE.md`**. Legacy queues are preserved for archaeology and now carry visible SUPERSEDED banners pointing to the live queue. No folders deleted, no queue files removed, no protected paths modified.

## Live vs Legacy WorkQueue Map

| Role | Path | Status | Cursor action |
|---|---|---|---|
| **Live** | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ACTIVE | ✅ Read and execute first OPEN task |
| Legacy QA pack | `KGEN-Cursor-WorkOrders/` (CURSOR-001..010) | SUPERSEDED | ❌ Do not use as task source |
| Legacy desk queue | `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` | SUPERSEDED | ❌ Do not use as task source |

## D1 Implementation

### 1. `KGEN-Cursor-WorkOrders/README.md`

Added superseded banner at top:

```markdown
> **SUPERSEDED — Not a live WorkQueue**
> Live queue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
> Decision: ORG-P2-003 D1 (MERGE). This folder remains as historical Cursor QA WorkOrders (CURSOR-001..010).
```

Changed `Status:` line from `Draft for Review` to `Superseded / Archaeology Only`.

### 2. `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`

Added superseded banner at top:

```markdown
> **SUPERSEDED — Not a live WorkQueue**
> Live queue: `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
> Decision: ORG-P2-003 D1 (MERGE). This file remains as legacy Agent Office task history.
```

### 3. Cross-reference index (no file change required)

`KGEN_MASTER_LIBRARY_INDEX.md` already lists both Organization WorkOrders and Cursor WorkOrders. Future ORG-P2-003E may add explicit alias labels; this task does not modify the master index.

## Alias Routing Rules (for workers)

```text
Cursor boot
  → read KGEN-Organization/WorkOrders/WORK_QUEUE.md ONLY
  → ignore KGEN-Cursor-WorkOrders task statuses
  → ignore KGEN-Agent-Office/CURSOR_WORK_QUEUE.md task statuses
  → use cursor-handoff/<Task-ID> for push
```

## KAIOS compatibility

KAIOS `GENERIC_WORKER_PROTOCOL.md` step 8 already points to `KGEN-Organization/WorkOrders/WORK_QUEUE.md`. Legacy queues are now explicitly marked SUPERSEDED so KAIOS and V5 handoff rules align with D1.

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`
- `KGEN-Cursor-WorkOrders/README.md`
- `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `KGEN_MASTER_LIBRARY_INDEX.md` (alias context)

## Files Modified

- `KGEN-Cursor-WorkOrders/README.md` — superseded banner + status label
- `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md` — superseded banner
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003A OPEN → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003A_WORKQUEUE_ALIAS_PLAN.md` — this report (created)

## Protected Paths Checked

No modifications to protected paths.

## Checks Run

| Check | Result |
|---|---|
| Clean branch from `origin/main` | ✅ `cursor-handoff/ORG-P2-003A` @ `7cf7c32` |
| First OPEN task | ✅ ORG-P2-003A |
| Legacy files preserved | ✅ No deletions |
| Protected path diff | ✅ Clean |
| Live queue unchanged except status | ✅ Only ORG-P2-003A status → REVIEW |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Human bookmarks to legacy README may ignore banner | Low |
| R2 | CURSOR-001..010 content still readable; agents may execute without reading banner | Medium — mitigated by WORKQUEUE_EXECUTION_RULES |

## Blockers

None.

## Recommendation

1. **Codex:** Approve and merge `cursor-handoff/ORG-P2-003A`.
2. **Next:** ORG-P2-003B (report routing language).
3. **Do not** delete `KGEN-Cursor-WorkOrders/` or `CURSOR_WORK_QUEUE.md`.

## Need Codex Review

**Yes.**

## Need Human Decision

**No.**
