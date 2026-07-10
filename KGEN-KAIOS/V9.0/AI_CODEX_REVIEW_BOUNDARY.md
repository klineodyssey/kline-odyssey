# AI Codex Review Boundary

**Document ID:** KAIOS-V9.0-AI-CODEX-REVIEW-BOUNDARY  
**Status:** Draft for Review / Prototype

## 1. Purpose

Codex is the mainline merge reviewer and review authority for AI-generated drafts.

## 2. Codex Must Check

Codex must review:

- Canon.
- Risk.
- Protected Paths.
- State Validity.
- Decision Evidence.
- WorkOrder Quality.
- Legal Boundary.
- Security Boundary.
- Duplicate Task.
- Dependency Conflict.

## 3. Review Outcomes

- Approve as WorkOrder.
- Request revision.
- Reject.
- Block.
- Archive.

## 4. Mainline Boundary

AI cannot merge to main. Cursor cannot push main. Codex reviews handoff or draft state and decides whether to commit and push.
