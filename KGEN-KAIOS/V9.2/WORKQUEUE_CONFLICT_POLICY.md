# WorkQueue Conflict Policy

**Document ID:** KAIOS-V9.2-WORKQUEUE-CONFLICT  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Conflict detection before WorkQueue sync.

## 1. Conflict Signals

If any of the following is true, Codex must not sync:

- Same task ID.
- Same output path.
- Same branch pattern.
- Same report path.
- Same asset.
- Same source decision.
- Same unresolved dependency.

## 2. Conflict State

```text
SYNC_VALIDATING -> SYNC_CONFLICT
```

## 3. Conflict Report

Every conflict produces a report containing:

- Conflict ID.
- Source draft.
- Formal WorkOrder ID candidate.
- Conflict type.
- Existing task or file.
- Codex decision.
- Required fix.

## 4. V9.2 Conflict Test

V9.2 includes an intentional dry-run conflict:

```text
AI-ECONOMY-2026-0001 duplicate ID
```

Expected result:

```text
SYNC_CONFLICT
```
