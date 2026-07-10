# Do Not Touch

Cursor and other worker agents must not modify these paths unless Codex and the human user explicitly authorize the exact change.

## Protected Paths

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`, unless the task explicitly says to update Boot
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md`, preserved ancestor unless the task explicitly says to update Boot history
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- KGEN Token contract files
- any uncommitted user files

## Forbidden Operations

- Force push.
- `git reset --hard`.
- Delete unconfirmed files.
- Overwrite local user work.
- Create duplicate runtime folders or same-function versioned files.
- Create patch, hotfix, final, stable, or duplicate-function files for official organs.

## If A Task Requires A Protected Path

Stop and report:

```text
BLOCKED: protected path requires Codex and human approval.
```
