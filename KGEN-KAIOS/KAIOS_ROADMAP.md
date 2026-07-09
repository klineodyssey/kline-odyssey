# KAIOS Roadmap

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Roadmap

| Stage | Focus | Condition To Start |
|---|---|---|
| V7.0 | Architecture | Current task |
| V7.1 | Generic workers | Architecture review accepted |
| V7.2 | Task metadata | Worker registry defined |
| V7.3 | Claim locks | Dispatcher state stable |
| V7.4 | Dashboard | Reports and events standardized |
| V7.5 | Recovery exercises | Failure model documented |
| V8.0 | Automation | Manual KAIOS process has passed repeated reviews |

## Scale Targets

| Scale | Target |
|---|---|
| 10 workers | Manual review remains acceptable |
| 100 workers | Requires worker registry, claims, and dashboard |
| 1000 workers | Requires automation and sharded queues |
| 10000 WorkOrders | Requires indexed queue state and event compaction |

## Roadmap Guardrail

KAIOS should not scale execution faster than review, recovery, and security can safely support.
