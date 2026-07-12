# Universe Office

**Department Path:** KGEN-Organization/Universe/  
**Status:** Active / Draft for Review  
**Reports To:** CEO_Codex  
**Works With:** Canon、Civilization、Game、Runtime、Frontend

## Department Position

Universe 負責 Universe Map、座標、Portal、跨宇宙文明邊界。

## Universe Map Single Source of Truth

| Role | Path | Rule |
|---|---|---|
| **Formal Universe Map** | `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | Coordinate SSOT; do not duplicate into Organization folders |
| Map governance | `docs/maps/README.md` | Shared map layer rules |
| Map index doc | `docs/KGEN_UNIVERSE_MAP.md` | Inventory and mermaid reference |
| Physics law (separate) | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Runtime CURRENT — not a map replacement |

Organization standards reference Universe Map by concept; implementations must load coordinates from the formal path above, not invent parallel map files under `KGEN-Organization/`.

## Cooperation Model

This department receives tasks from Codex or PMO, checks related Canon and indexes, performs only the assigned scope, writes a handoff note, and sends the result to QA and Codex Review. Cross-department work must link the source department and the report path.

## No-Overreach Rule

不得建立第二套 Universe Runtime；不得硬寫與 Universe Map 衝突的座標常數。

## Files

- [ROLE.md](ROLE.md)
- [RESPONSIBILITY.md](RESPONSIBILITY.md)
- [WORK_QUEUE.md](WORK_QUEUE.md)
- [HANDOFF.md](HANDOFF.md)
- [REPORT_TEMPLATE.md](REPORT_TEMPLATE.md)
## Organization Links

- [Organization Index](../README.md)
- [Second Stage WorkQueue](../WorkOrders/WORK_QUEUE.md)
- [WorkOrder Standard](../WorkOrders/KGEN_WORKORDER_STANDARD.md)
- [Reports](../Reports/README.md)