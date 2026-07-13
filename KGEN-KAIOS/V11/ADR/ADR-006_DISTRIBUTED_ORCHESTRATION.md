# ADR-006: Distributed Orchestration

- Status: **UNDER_REVIEW**
- Classification: **PARTIAL_ACCEPT**
- Target: **V11.1 DESIGN / PHASE 4+ IMPLEMENTATION**
- Implementation: **NOT_STARTED**

## Context

V11 defines a deterministic dispatcher, department queues, priority, claim leases, sharding, worker patterns, backpressure and stale recovery. It intentionally does not select a broker, scheduler topology or distributed coordinator.

## Decision

Design queue partitions, priority fairness, scheduler ownership, durable lease authority, worker pools, retries, dead-letter handling, shard rebalancing, idempotency and recovery before selecting technology.

## Consequences

The logical state machine stays stable while infrastructure can evolve. No broker, cluster or production scheduler is authorized by this ADR.

## Rejected Alternative

Reject a global scheduler that scans every Agent and reject concurrent primary ownership of one mission.
