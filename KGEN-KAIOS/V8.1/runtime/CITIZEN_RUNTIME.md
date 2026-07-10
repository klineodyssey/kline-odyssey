# KAIOS V8.1 Citizen Runtime

## Definition

Citizen Runtime manages Citizen lifecycle, profession assignment, residence link, work, trade readiness, skill growth, reputation, inventory, wallet reference, DNA link, AI link, and App link.

## Runtime Flow

```text
Residence -> Citizen -> Profession -> Work -> Output -> Business -> Economy
```

## Inputs

- Citizen record
- Residence record
- Profession record
- Life cycle events
- Inventory records
- AI and App links

## Outputs

- Citizen snapshot
- profession relationship
- work output event
- skill update event
- reputation update event

## Boundary

Citizen Runtime does not equal Player Runtime. Player may operate the citizen, but citizen remains a civilization life record.