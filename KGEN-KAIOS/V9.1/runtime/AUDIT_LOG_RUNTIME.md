# Audit Log Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-AUDIT-LOG  
**Status:** Prototype  
**Mode:** Append-only record design.

The Audit Log Runtime records every state transition in the review loop.

## Event Types

- DRAFT received.
- Review started.
- Promotion approved.
- Revision requested.
- Rejection recorded.
- Block recorded.
- Archive recorded.
- Human override recorded.

## Source of Truth

In V9.1, audit records are published as Markdown reports and JSON examples. Future runtime layers may make them fully machine-managed, but the authority remains GitHub-traceable documents.
