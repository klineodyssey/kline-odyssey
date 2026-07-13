# ADR-009: Security Boundary

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Implementation: **NOT_STARTED**

## Context

V11 already excludes secrets from state, uses opaque references and short-lived grants, requires sandboxing and least privilege, denies high-risk capabilities, supports Human override and blocks protected actions.

## Decision

Treat capability grant, sandbox, risk gate and Codex/Human review together as the V11 Execution Guard. Add a threat model and negative test matrix in V11.1 instead of creating a parallel authority layer.

## Never Delegated

Secrets export, private keys, wallet signing, contract deployment, protected path write, main merge, production deploy and R4 execution remain denied to ordinary Agents.

## Consequences

Security policy remains centralized in auditable grants and review evidence while provider adapters remain replaceable.
