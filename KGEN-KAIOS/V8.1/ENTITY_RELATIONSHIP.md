# KAIOS V8.1 Entity Relationship Standard

## Core Record

Every Universe entity uses the same minimum relationship envelope:

```json
{
  "id": "ENT-EXAMPLE-000001",
  "entity_type": "Temple",
  "owner": "PLAYER-0001",
  "parent": "WORLD-0001",
  "children": ["LAND-0001"],
  "runtime": "Temple Runtime",
  "state": {},
  "version": "1.0.0",
  "create_time": "2026-07-10T00:00:00Z",
  "update_time": "2026-07-10T00:00:00Z",
  "dependencies": [],
  "permissions": {},
  "status": "Active"
}
```

## Ownership

Ownership is a control claim inside the data layer. It can represent a player account, civilization treasury, DAO, system service, AI, or legal entity reference. V8.1 ownership is not a legal deed by itself. Where legal, financial, or regulated ownership is required, the entity must also include proof, agreement, signature, or compliance reference.

## Parent and Children

Parent and children form the canonical containment tree. An entity may have only one canonical parent. It may have many children. Cross-links are stored separately as relationship records.

## Dependencies

Dependencies may point to:

- Another entity ID
- A schema path
- A runtime document path
- A Canon document
- A legal authorization record
- A production system module

Dependencies are not optional for Production status. If dependencies are missing, status must remain Draft, Prototype, Blocked, or Disputed.

## Permissions

Permissions define allowed actions. Common keys:

| Permission | Meaning |
|---|---|
| `read` | May inspect entity record. |
| `write` | May update non-critical data. |
| `upgrade` | May change level, runtime, or lifecycle stage. |
| `trade` | May list or transfer in a market. |
| `rent` | May create rental rights. |
| `govern` | May vote, delegate, or change policy. |
| `archive` | May retire or archive the entity. |

## Status

| Status | Meaning |
|---|---|
| Draft | Record is being designed. |
| Prototype | Record is usable for demo or simulation. |
| Active | Record is active inside the KGEN world. |
| Dormant | Record exists but is not operating. |
| Locked | Record cannot be changed until condition is cleared. |
| Retired | Record ended normal operation. |
| Archived | Record is preserved for history. |
| Deleted | Record is deleted in a non-production or reversible context. |
| Disputed | Ownership, data, or compliance is under challenge. |

## Relationship Record

A relationship record is separate from an entity record when the connection is not a canonical parent-child relation.

```json
{
  "relationship_id": "REL-000001",
  "source_id": "CITIZEN-0001",
  "target_id": "PROFESSION-0001",
  "relationship_type": "works_as",
  "status": "Active",
  "create_time": "2026-07-10T00:00:00Z",
  "update_time": "2026-07-10T00:00:00Z"
}
```

## Conflict Handling

If parent, owner, or status conflicts appear, the graph enters `Disputed` status for the affected entity and must create a Governance or Review record before further transfer or upgrade.