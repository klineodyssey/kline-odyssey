# KAIOS Colony Resource Ledger Specification V1

Status: `APPROVED_SPECIFICATION`

## Scope

The ledger supports `ANT_COLONY`, `BEE_HIVE`, `FISH_SCHOOL`, `SHRIMP_POND`,
`AI_WORK_TEAM`, `HOUSEHOLD` and `COMPANY`. It records custody, contribution and
allocation. It never creates biological resources.

Required fields are defined by `KAIOS_COLONY_RESOURCE_LEDGER_SCHEMA_V1.json`.
Every distribution links to an inventory debit and a recipient allocation or
consumption record. Shortages are first-class events.

## Ant Colony Demonstration

`resource discovered -> collection work -> transport -> colony food inventory
-> ANT_WORK_CREDIT -> ANT_COLONY_RATION -> biological consumption -> remaining
inventory`

Queen, larvae and workers consume finite food. A positive contribution balance
cannot prevent starvation when food inventory is zero.

## Bee Hive Demonstration

`nectar/pollen discovered -> collection -> transport -> hive inventory ->
causal honey processing -> POLLINATION_CREDIT -> HIVE_HONEY_SHARE -> biological
consumption -> remaining inventory`

Honey output must debit nectar and processing energy/time. A positive share
cannot replace missing nectar, pollen, water or honey.

## Accounting Rules

- Group credits are nontransferable outside the declared group in V1.
- Contribution records do not change physical inventory.
- Ration allocation reserves inventory; consumption debits it.
- Every debit has one named custody destination, consumption sink or loss event.
- No negative inventory, duplicate distribution or silent adjustment is valid.
- Export/import/replay must reproduce identical balances and history.
