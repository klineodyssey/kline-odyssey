# KAIOS V9.1 Runtime Modules

This folder defines the conceptual runtime modules for the AI WorkOrder Review Loop. These modules are governance and review runtimes, not autonomous execution engines.

| Runtime | Purpose |
|---|---|
| Draft Review Runtime | Reads a DRAFT and prepares Codex review inputs. |
| Promotion Runtime | Applies the 15-point checklist before `OPEN`. |
| Rejection Runtime | Records invalid or unsafe DRAFT closure. |
| Revision Runtime | Sends incomplete DRAFTs back for correction. |
| Human Gate Runtime | Enforces Human review for R3 and overrides. |
| Duplicate Detection Runtime | Detects duplicate or merge-candidate WorkOrders. |
| Dependency Validation Runtime | Checks required files, reports, branches and prior tasks. |
| Audit Log Runtime | Records all review state transitions. |

All runtimes are read-only planning modules in V9.1. They do not modify protected paths or execute WorkOrders.
