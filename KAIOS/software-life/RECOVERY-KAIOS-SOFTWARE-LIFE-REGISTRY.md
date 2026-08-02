---
title: Recovery - KAIOS Software Life Registry
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
status: RECOVERY_READY
authority: SIMULATION_ONLY
---

# Recovery - KAIOS Software Life Registry

## Scope

This recovery point covers only the Software Life Manifest Schema, generated
Registry, generator, tests, report and documentation references in the
Registry PR.

## Rollback

Revert the Registry PR merge commit. This removes the compatibility layer
without changing any registered application, Runtime, public route, API
projection, existing Canonical schema, protected CURRENT, Wallet, KGEN or
Constitution source.

The generated Registry can be reproduced from its recorded `source_commit`
and `generated_at` with:

```powershell
node KAIOS/software-life/tools/generate-software-life-registry.mjs `
  --source-commit=<recorded-sha> `
  --generated-at=<recorded-time>
```

Never use rollback to rewrite existing Life IDs or delete provenance.
