# KAIOS V8.0 Data Model

**Status:** Active Schema Index / Draft for Review

## Schema Inventory

| Schema | Purpose |
|---|---|
| `player.schema.json` | Player identity, wallet reference and entry assets |
| `picture.schema.json` | Picture-only entry and temple blueprint fields |
| `temple.schema.json` | Temple life object with AI, DNA, Runtime and governance |
| `land.schema.json` | Land coordinates, zoning, permission, market and rental state |
| `building.schema.json` | Building organ for residence, store, bank, exchange, warehouse and factory |
| `residence.schema.json` | Residence and evolution options |
| `business.schema.json` | Store, restaurant, convenience-store type and mall business model |
| `bank.schema.json` | Bank simulation runtime and legal boundary |
| `exchange.schema.json` | Huaguo Exchange 11520 runtime data |
| `listing.schema.json` | Asset listing, pricing, disclosure, risk and legal restrictions |
| `transaction.schema.json` | Simulated transaction and settlement state |
| `real_world_link.schema.json` | Virtual Twin and adapter data |
| `task_generator.schema.json` | Codex-generated WorkOrder data |

## Data Boundary

All examples use fictional data. No schema implies real brand authorization, bank account, securities right, real property right or regulated exchange approval.

## Validation Rule

Every JSON file under `schemas/` and `examples/` must parse successfully before V8 is considered valid. Schema conformance is progressively enforced by later QA WorkOrders.