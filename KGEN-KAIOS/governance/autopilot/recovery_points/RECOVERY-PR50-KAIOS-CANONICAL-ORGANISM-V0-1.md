# RECOVERY-PR50-KAIOS-CANONICAL-ORGANISM-V0-1

Status: `RECOVERY_POINT_CREATED`

Created At: `2026-07-25T21:51:37+08:00`

Scope: PR #50 KAIOS canonical organism schema and natural instantiation
pipeline V0.1 merge and closeout.

## Anchors

- Rollback Target: `94e07c3ef1811b2a8f462040668d81b103fffab9`
- PR Final Head: `e74f644dabac596a4530d1252cf1dba836ef6343`
- Merge SHA: `5570756d9343fc83e16acfe594f93334ecb0e258`
- Main SHA before closeout commit:
  `5570756d9343fc83e16acfe594f93334ecb0e258`
- Merge Method: `MERGE_COMMIT`
- Merged At: `2026-07-25T21:51:37+08:00`
- Model: `gpt-5.6-sol`
- Reasoning Level: `medium`
- Agent: `codex-gm-01`
- Session: current Codex task; live Company Session record not persisted

## Validation

- Organism tests: `46 / 46 PASS`
- PR #49 identity tests: `86 / 86 PASS`
- Relevant PR #50 total: `132 / 132 PASS`
- Company Boot tests: `74 / 74 PASS`
- Repository JSON: `528 / 528 PASS`
- JSON Schema contract: `5 / 5 PASS`
- Markdown links: `44 / 44 PASS`
- Secret hits: `0`
- Protected path violations: `0`
- `git diff --check`: `PASS`

## Explicit Non-Activations

- Live organisms created: `0`
- Wallet created: `false`
- K11520 settlement: `false`
- Production Runtime: `false`
- Runtime authority: `false`
- Codex birth: `false`
- New Thread authorized: `false`
- Scheduler: `NOT_APPROVED`
- Automatic Agent Creation: `NOT_APPROVED`
- Cursor dispatched: `false`
- Real KGEN: `NOT_AUTHORIZED`

## Recovery

Revert the closeout commit to remove only post-merge state records. Revert
merge commit `5570756d9343fc83e16acfe594f93334ecb0e258` only with an
explicit high-risk Human decision. Do not rewrite history.
