# KAIOS Company Boot Runtime V0.1

Status: LOCAL_CLI_PROTOTYPE
Scheduler: NOT_APPROVED
Auto Dispatch: NOT_APPROVED
Cursor Dispatch: NOT_APPROVED
Deployment: NOT_STARTED

This folder contains the minimum local CLI prototype for KAIOS Company Boot Runtime V0.1.

The prototype verifies a session birth record, Life ID, identity attestation, capability grant, revocation status, canonical current state, main SHA, parent handoff, WorkOrder authorization and lock state. It can also close a passed session by producing a handoff record and archived copy.

## Commands

Run from this folder with `PYTHONPATH=src`.

```powershell
$env:PYTHONPATH = "src"
python -m company_boot validate-session `
  --session tests/fixtures/valid_session.json `
  --current-state tests/fixtures/current_state.json `
  --agent-registry tests/fixtures/agent_registry.json `
  --handoff tests/fixtures/parent_handoff.json `
  --output reports/boot_result.json
```

```powershell
$env:PYTHONPATH = "src"
python -m company_boot close-session `
  --boot-result reports/boot_result.json `
  --handoff-output reports/handoff.json `
  --archive-dir reports/archive
```

## Boundaries

The prototype does not:

- create a scheduler
- auto-dispatch work
- dispatch Cursor
- modify WorkQueue
- modify Runtime CURRENT
- modify Universe Map CURRENT
- modify token contracts
- deploy
- use Real KGEN
- create PRs
- merge

## Tests

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests
```
