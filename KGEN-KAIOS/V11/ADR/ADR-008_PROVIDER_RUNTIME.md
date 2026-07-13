# ADR-008: Provider Runtime

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Target: **V11.1 ROUTING POLICY**
- Implementation: **NOT_STARTED**

## Context

V11 already defines provider-neutral adapters, capability discovery, health checks, fallback, normalized errors and routing based on capability, health, latency and cost metadata.

## Decision

Keep the existing Provider Runtime. V11.1 should formalize deterministic route scoring, budget ceilings, health windows, fallback chains, provider terms flags and route evidence.

## Consequences

Provider names remain adapter targets, not trust signals or partnership claims. A fallback cannot silently change mission acceptance criteria or permission scope.

## Evidence

- `PLUGIN_FRAMEWORK.md`
- `PLUGIN_API_DRAFT.md`
- `PLUGIN_MANIFEST_STANDARD.md`
