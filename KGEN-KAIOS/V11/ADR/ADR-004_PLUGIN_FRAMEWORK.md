# ADR-004: Plugin Framework Coverage

- Status: **UNDER_REVIEW**
- Classification: **ACCEPT**
- Coverage: **ALREADY_COVERED**
- Implementation: **NOT_STARTED**

## Context

V11 already defines provider-neutral adapters, capability manifests, API and schema versions, compatibility ranges, sandbox profiles, permission review, integrity, health, fallback and rollback.

## Decision

Keep the existing Plugin Framework. Do not create a second SDK or manifest. After Human approval, add conformance fixtures, integrity/signature policy and compatibility tests.

## Consequences

Provider-specific implementations remain adapters behind a stable KAIOS contract. `ENABLED` never implies unrestricted authority.

## Evidence

- `PLUGIN_FRAMEWORK.md`
- `PLUGIN_API_DRAFT.md`
- `PLUGIN_MANIFEST_STANDARD.md`
