# KAIOS Components

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Component Map

| Component | File | Responsibility |
|---|---|---|
| Architecture | `KAIOS_ARCHITECTURE.md` | Defines system layers and operating loop |
| Master Plan | `KAIOS_MASTER_PLAN.md` | Defines rollout phases |
| Runtime Bus | `AI_RUNTIME_BUS.md` | Normalizes worker and task signals |
| Worker Registry | `WORKER_REGISTRY.md` | Tracks worker identity and current state |
| Task Dispatcher | `TASK_DISPATCHER.md` | Routes tasks through lifecycle |
| Claim Protocol | `TASK_CLAIM_PROTOCOL.md` | Prevents two workers claiming one task |
| Review Pipeline | `REVIEW_PIPELINE.md` | Defines Codex review to merge pipeline |
| Message Bus | `MESSAGE_BUS.md` | Defines GitHub artifact communication |
| Event Model | `EVENT_MODEL.md` | Defines system events |
| State Machine | `STATE_MACHINE.md` | Defines state transitions |
| Dashboard | `DASHBOARD_MODEL.md` | Defines visible company health |
| Recovery | `RECOVERY_MODEL.md` | Defines failure recovery |
| Security | `SECURITY_MODEL.md` | Defines permission tiers |

## Component Rule

Every component must be reconstructable from GitHub state. KAIOS must not depend on hidden chat memory.

## Integration Points

- AI Company: daily worker operation.
- Organization: departments and WorkQueue.
- Agent Office: operational support and protected path discipline.
- Machine Canon: machine-readable rules.
- Genesis / Runtime / SDK libraries: source of authority and reference.
