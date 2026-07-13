# ADR-007: Resource Management

- Status: **UNDER_REVIEW**
- Classification: **PARTIAL_ACCEPT**
- Target: **V11.1**
- Implementation: **NOT_STARTED**

## Context

V11 includes quotas, department/provider budgets, rate limits, cost telemetry and backpressure. Reservation, reconciliation, circuit breaker state and chargeback boundaries are incomplete.

## Decision

Define `Quota -> Reservation -> Consumption -> Reconciliation`, budget ceilings, provider rate windows, circuit breaker states, graceful degradation and simulation-only cost ledger records.

## Boundary

Real billing, payment, salary settlement and financial transfers are out of scope. Irreversible spending requires Human approval under existing finance and security policies.

## Consequences

Capacity and cost become schedulable constraints. Exhausted quota blocks or degrades work instead of causing uncontrolled provider spend.
