# Worker Eligibility Runtime

**Runtime ID:** KAIOS-V9.3-RUNTIME-WORKER-ELIGIBILITY  
**Purpose:** Check whether at least one registered Worker can claim a released WorkOrder.

For `AI-ECONOMY-2026-0001`, `cursor-01` is registered, has no main push permission, and uses `cursor-handoff/<Task-ID>`. Because the registry shows `IDLE`, the result is `ELIGIBLE_AFTER_HEARTBEAT` rather than immediate active assignment.

