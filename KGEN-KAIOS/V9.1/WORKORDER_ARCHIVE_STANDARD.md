# WorkOrder Archive Standard

**Document ID:** KAIOS-V9.1-WORKORDER-ARCHIVE  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Retention and archive rules for rejected or closed DRAFT WorkOrders.

## 1. Archive Principle

KAIOS does not delete rejected, blocked or superseded DRAFT WorkOrders from history. The archive preserves why a task was not executed.

## 2. Archive Triggers

Archive a DRAFT when:

- It is rejected and no revision path is needed.
- It duplicates an already accepted WorkOrder.
- It conflicts with Canon.
- It is superseded by a broader or safer WorkOrder.
- It is R4 and cannot be rewritten safely.
- Human explicitly archives it.

## 3. Archive Record

An archive record should include:

- WorkOrder ID.
- Decision ID.
- Final status.
- Reason.
- Risk level.
- Duplicate or dependency findings.
- Reviewer.
- Timestamp.
- Replacement task, if any.

## 4. Future Reuse

An archived idea may inform a future task, but the future task must receive a new review record. Archived status is never silently reversed.
