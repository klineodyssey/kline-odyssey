# ADR-010: Future Scale

- Status: **UNDER_REVIEW**
- Classification: **PARTIAL_ACCEPT**
- Target: **V11.1 AND V12**
- Implementation: **NOT_STARTED**

## Context

V11 defines indexed queues, tenant/civilization partitions, sharded workers, event projection, distributed leases and backpressure for 10 to 500+ Agents. It does not size a 100,000-Agent production control plane.

## Decision

| Scale | Decision |
|---|---|
| 100 | Current V11 design baseline is sufficient for architecture review |
| 1,000 | Add durable queue, lease store, review pool and aggregated observability in V11.1 |
| 10,000 | Add event streaming, shard coordinator, distributed worker pools and SLO capacity planning in V11.1 architecture |
| 100,000 | `DEFER_TO_V12`; require multi-region control plane, failover, global quotas and SRE |

## Rejected Alternative

Do not build or purchase 100,000-Agent infrastructure during Genesis Design. Capacity must be justified by measured pilot evidence.

## Consequences

The architecture remains evolvable without overcommitting to a premature platform topology.
