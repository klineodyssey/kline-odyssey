# KAIOS Company Boot Runtime V0.1

Status: LOCAL_CLI_PROTOTYPE_REPAIRED
Scheduler: NOT_APPROVED
Auto Dispatch: NOT_APPROVED
Cursor Dispatch: NOT_APPROVED
Deployment: NOT_STARTED

This folder contains the minimum local CLI prototype for KAIOS Company Boot Runtime V0.1.

The prototype verifies a session birth record, Life ID, identity attestation, capability grant, revocation status, canonical current state, main SHA, baseline ID/status, parent handoff, WorkOrder authorization and lock state. It can also close a passed session by producing a handoff record and archived copy.

The Boot Result is revalidated as untrusted input. Missing or incorrect hashes, unknown fields, invalid identity bindings, unauthorized actions, secrets, stale/conflicted state or missing close-session capabilities return failure and create no handoff or archive output.

Boot and handoff records include:

- `content_sha256` for stable semantic content
- `record_sha256` for full dynamic record evidence
- `result_sha256` as a V0.1 compatibility alias for `record_sha256`

The CLI enforces the approved state-machine transition guard. Invalid transitions return `COMPANY_BOOT_FAILED` with `INVALID_STATE_TRANSITION`.

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
$env:PYTHONDONTWRITEBYTECODE = "1"
python -m unittest discover -s tests -v
```

Current second targeted-integrity suite: 74 / 74 PASS (34 existing and 40 new).
