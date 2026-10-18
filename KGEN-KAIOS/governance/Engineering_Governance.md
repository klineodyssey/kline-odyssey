---
TITLE: "Engineering Governance"
VERSION: "1.0.0"
REVISION: "2026-07-17.1"
STATUS: "HUMAN_APPROVED_ARCHITECTURE"
ARCHITECTURE: "APPROVED"
IMPLEMENTATION: "FORBIDDEN"
LAST_UPDATED: "2026-07-17"
UPDATED_BY: "Codex / codex-gm-01"
HUMAN_DECISION_ID: "KAIOS WORLD ASSET & LIFE SPECIFICATION V1.0"
CANONICAL_FILE: "KGEN-KAIOS/governance/Engineering_Governance.md"
---

# Engineering Governance

## 1. Purpose

This document defines the architecture-only governance rules for engineering traceability, review, repair, and escalation.

## 2. Engineering Log Policy

No engineering problem may be left undocumented.

Every material issue must be recorded in at least one formal channel:

- `Issue`
- `Review Log`
- `Repair Request`
- `Blocked Reason`
- `Human Decision`

If a defect, ambiguity, review finding, or blocked condition exists and none of the five records exists, the engineering governance contract is violated.

## 3. Minimum Record Requirements

Every engineering record should contain, when applicable:

```text
record_id
record_type
title
scope
description
affected_files
status
owner
reviewer
created_at
updated_at
evidence_ref
next_action
```

## 4. Record Types

| Record Type | Purpose |
|---|---|
| `ISSUE` | Defect, gap, drift, inconsistency, or observed failure |
| `REVIEW_LOG` | Review outcome, evidence summary, and decision trace |
| `REPAIR_REQUEST` | Explicit request to rework or patch an approved scope |
| `BLOCKED_REASON` | A formal stop condition with evidence and escalation target |
| `HUMAN_DECISION` | Human authority instruction, approval, rejection, or amendment |

## 5. Review First

Review has priority over silent accumulation of unresolved work.

When engineering evidence already exists, the preferred order is:

```text
Review
-> Repair or Close
-> Re-validate
-> Archive
```

## 6. Forbidden Practices

The following are not allowed:

- silent known failure
- undocumented repair
- undocumented blocked condition
- merging unresolved review findings without record
- changing scope without updating a formal record

## 7. Architecture Boundary

This governance file defines policy only. It does not create:

- workqueue runtime
- ticketing service
- database
- automation engine
- merge authority beyond existing governance

## 8. BOOT-FIRST evidence for new engineering work (2026-10-06)

Human order `Sentinel_b9c9a6cfa0a08191b922a26478c6d8fa` requires V1.4 Boot as
the first repository document for each new KAIOS work item and Cloud/worktree/
session, followed by its CURRENT/Neural lineage, Company sync, then execution of
the Human prompt. The current [Worker Boot SOP](../workforce/WORKER_BOOT_SOP.md)
defines the complete process and source/conflict rules.

The engineering sequence is `READ_CANON -> LINEAGE -> EXISTING_RUNTIME ->
ACTIVE_WORK -> DESIGN -> CODE -> TEST`. A PRE_CODE checkpoint cannot claim CODE
or TEST. Later completion and source refreshes append checkpoints to the same
work/session record. New work/session contexts must not reuse an old receipt.
Retain old records as history; missing old evidence is `NOT_RECORDED`.

Iteration is explicit: PRE_CODE refreshes remain in the current numbered cycle;
after POST_TEST, a REWORK/SOURCE_REFRESH opens the next cycle and clears only its
new test outcome to NOT_RUN. Earlier results remain immutable. Each POST_TEST
must bind its matching latest PRE_CODE and source snapshot, and records the real
PASS/FAIL/BLOCKED outcome. An old pass cannot establish the new cycle's readiness.

The existing Company Boot Runtime V0.1 schema and `validate-workflow` CLI check
record integrity, stage order, path/blob/main bindings, Company snapshot coverage,
domain reads, explicit conflicts and append-only continuity. No second Worker
runtime, live identity registry, scheduler or authority service is established.

The operator/reviewer must independently refresh main and evaluate source
relevance, authenticated Human authorization and action-specific gates.
Consistency hashes prove neither authorship nor cognitive reading. Receipt
validation is an additional prerequisite and grants no permissions. Separately
authorized bounded external-maintainer work remains bounded; existing financial,
protected-path and release restrictions remain in force. Record other tracks'
P0/P1 or external waits without turning them into unrelated blanket stops.
