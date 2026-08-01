# KAIOS PR65 Specification Test Plan

Status: `ACTIVE_FOR_PR65_SPECIFICATION_VALIDATION`

## Contract Tests

`KGEN-KAIOS/world-viewer/tests/industrial_supply_chain_spec.test.mjs` validates:

- exact dependency, status, block-reason, company-state and court-process sets
- all seven generic reference products and every required product field
- no trademarked canonical product names
- missing demand, design, license, material, component, machine, factory,
  power, water, workers, transport, warehouse, channel or working capital blocks
- industrial capability does not imply dependency availability
- inventory quantity, mass, reservation, capacity and value conservation
- storage cost, damage, spoilage, obsolescence and capital-freeze effects
- forecast/order/plan/safety stock and overproduction/stockout/dead-stock rules
- unsold production does not recognize revenue
- sale, receivable, cash, cost-of-goods and return accounting
- balanced ledgers and `assets = liabilities + equity`
- warning and insolvency state order
- simulated court process and preserved asset disposition
- distributions cannot exceed realized proceeds
- closed-loop cash and material return
- deterministic replay, serialization and no-production boundaries

## Regression And Repository Gates

Run Company Boot, identity, PR #63 causal runtime, PR #64 specification,
production integrity, settlement/economy integrity and static acceptance tests.
Validate all repository JSON, four schemas, Markdown links, UTF-8, BOM,
corruption, secrets, protected paths and `git diff --check`.

Merge requires `P0=0`, unresolved `P1=0`, unresolved `P2=0`.
