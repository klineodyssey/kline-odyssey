# System Architecture

**Document ID:** KAIOS-V10-SYSTEM-ARCHITECTURE  
**Version:** V10.0  
**Status:** Draft for Review

V10 architecture connects every KGEN surface through one operating map:

```text
Browser
-> Portal
-> Frontend
-> API Gateway
-> Service Layer
-> Runtime
-> Blockchain
-> Storage
-> Analytics
-> AI Company
```

## Layer Responsibilities

| Layer | Responsibility | V10 Boundary |
|---|---|---|
| Browser | User interaction | No authority over state |
| Portal | Route users to temples, dashboards and apps | No wallet signing |
| Frontend | Display, validate and prepare commands | No secret storage |
| API Gateway | Future ingress, rate limit, auth check | Prototype only |
| Service Layer | Domain services and permission checks | Architecture only |
| Runtime | State machine and lifecycle rules | Standard only |
| Blockchain | Settlement and proof layer | No new deployment |
| Storage | Documents, JSON state, future DB | No production DB |
| Analytics | Metrics and governance signals | Read-only |
| AI Company | Observe, recommend, dispatch, review | Codex approval required |

## KOS Contract

Every module must declare:

- service ID
- owner
- inputs
- outputs
- state transitions
- permissions
- audit events
- protected path boundary
- risk level
- production status

