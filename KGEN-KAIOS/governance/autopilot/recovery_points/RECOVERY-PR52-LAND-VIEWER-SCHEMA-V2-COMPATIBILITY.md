# RECOVERY-PR52-LAND-VIEWER-SCHEMA-V2-COMPATIBILITY

Status: `RECOVERY_POINT_CREATED`

Created At: `2026-07-26T06:06:31+08:00`

Scope: PR #52 Land Viewer compatibility for canonical Organism Manifest
Schema V2, merge verification, and closeout.

## Anchors

- Rollback Target: `19229217dcbf793173103924995a5d5fd384aefe`
- PR Final Head: `c799cda4406e212db7b54d5550610f52b52ada0d`
- Merge SHA: `7df3e48530fb00f56d2af49c40d38f64de46c475`
- Main SHA before closeout commit:
  `7df3e48530fb00f56d2af49c40d38f64de46c475`
- Merge Method: `MERGE_COMMIT`
- Merged At: `2026-07-26T06:05:14+08:00`
- Model: `gpt-5.6-sol`
- Reasoning Level: `medium`
- Agent: `codex-gm-01`
- Session: current Codex task; live Company Session record not persisted

## Validation

- Viewer Schema V2 tests: `33 / 33 PASS`
- Organism tests: `46 / 46 PASS`
- PR #49 identity tests: `86 / 86 PASS`
- Company Boot tests: `74 / 74 PASS`
- Relevant unit tests: `239 / 239 PASS`
- Viewer static acceptance: `76 files / 89 JSON records / 103 references PASS`
- Repository JSON: `530 / 530 PASS`
- Responsive browser matrix: `4 / 4 PASS`
- GitHub Actions: `2 / 2 PASS`
- Secret hits: `0`
- Protected path violations: `0`
- `git diff --check`: `PASS`

## Explicit Non-Activations

- Live ownership records created: `0`
- Wallet created: `false`
- K11520 settlement: `false`
- Production Runtime: `false`
- Runtime authority: `false`
- Codex birth: `false`
- New Thread authorized: `false`
- Scheduler: `NOT_APPROVED`
- Automatic Agent Creation: `NOT_APPROVED`
- Cursor dispatched: `false`

## Recovery

Revert the closeout commit to remove only post-merge state records. Revert
merge commit `7df3e48530fb00f56d2af49c40d38f64de46c475` only through
the repository's governed rollback process. Do not rewrite history.
