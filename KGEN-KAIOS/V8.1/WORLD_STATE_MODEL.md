# KAIOS V8.1 World State Model

## Purpose

World State is a read model of the Universe Graph at a specific time. It allows Codex, Cursor, future engines, and frontend viewers to understand the current state without mutating the canonical graph.

## Snapshot Types

| Snapshot | Scope |
|---|---|
| World Snapshot | World, temples, lands, citizens, economy and governance summary. |
| Civilization Snapshot | Civilization scale, member worlds, active temples, treasury, active missions. |
| Temple Snapshot | Temple life state, AI, DNA, runtime, land, services, citizens, apps, economy. |
| Economy Snapshot | Businesses, markets, listings, transactions, banks, exchange state. |
| Citizen Snapshot | Citizen identity, residence, profession, inventory, wallet, health, skill, reputation. |
| Market Snapshot | Market status, listings, price model, depth, volume, settlement, dispute state. |

## Snapshot Envelope

```json
{
  "snapshot_id": "KGEN-SNAP-WRD-20260710-000001",
  "snapshot_type": "World Snapshot",
  "source_graph_id": "KGEN-GRAPH-20260710-000001",
  "root_entity_id": "KGEN-WRD-20260710-000001",
  "created_at": "2026-07-10T00:00:00Z",
  "entities": [],
  "relationships": [],
  "metrics": {},
  "status": "Prototype"
}
```

## Snapshot Rules

1. Snapshot is read-only.
2. Snapshot does not replace canonical entity records.
3. Snapshot must record source graph ID.
4. Snapshot may be cached for frontend viewers.
5. Snapshot must not be used as proof of regulated ownership.
6. Snapshot creation must not modify protected paths.

## Metrics

Common metrics:

- active citizen count
- active profession count
- land count by status
- residence occupancy
- business revenue simulation
- market listing count
- transaction count
- governance proposal count
- AI service count
- app organism count
- economy loop completion score