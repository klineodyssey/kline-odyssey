# Approved Draft Sync Standard

**Document ID:** KAIOS-V9.2-APPROVED-DRAFT-SYNC  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Safe transition from `APPROVED_FOR_OPEN` to `OPEN`.

## 1. Purpose

V9.1 approves AI-generated DRAFT WorkOrders. V9.2 synchronizes those approved drafts into the official WorkQueue only after Codex performs a second validation pass. This prevents a reviewed draft from becoming executable work without checking WorkQueue conflicts, ID allocation, insertion safety and Human pause gates.

## 2. Official Sync State Machine

```mermaid
stateDiagram-v2
    APPROVED_FOR_OPEN --> SYNC_PENDING
    SYNC_PENDING --> SYNC_VALIDATING
    SYNC_VALIDATING --> SYNC_READY
    SYNC_READY --> OPEN
```

## 3. Failure State

```mermaid
stateDiagram-v2
    SYNC_VALIDATING --> SYNC_REJECTED
```

## 4. Conflict State

```mermaid
stateDiagram-v2
    SYNC_VALIDATING --> SYNC_CONFLICT
```

## 5. Human Pause State

```mermaid
stateDiagram-v2
    APPROVED_FOR_OPEN --> HUMAN_PAUSED
```

## 6. Rollback State

```mermaid
stateDiagram-v2
    OPEN --> SYNC_ROLLBACK_PENDING
    SYNC_ROLLBACK_PENDING --> APPROVED_FOR_OPEN
```

## 7. Non-Execution Rule

Sync creates an `OPEN` WorkQueue entry. It does not execute the task. In V9.2, synced tasks may include `Dispatch Hold: true` so Cursor cannot treat the sync event as an automatic execution order.

## 8. Source Integrity

Every synced WorkOrder must reference:

- Source AI decision.
- V9.1 promotion decision.
- V9.1 review report.
- V9.1 audit record.
- V9.2 sync validation.
- V9.2 sync audit event.
