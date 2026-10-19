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

## BOOT-FIRST engineering evidence (2026-10-06)

The existing CLI also validates the additional new-work/session receipt required
by `KGEN-KAIOS/workforce/WORKER_BOOT_SOP.md`. It creates no Worker runtime, registry,
claim, permission or dispatch. The existing identity/security command contracts
and the historical 74-test baseline remain unchanged.

Run from this folder (POSIX example; use the corresponding PowerShell PYTHONPATH
setup above on Windows):

```sh
PYTHONPATH=src python -m company_boot validate-workflow \
  --evidence /path/to/pre-code-evidence.json \
  --repository /path/to/isolated-repository \
  --expected-main <independently-verified-full-main-sha> \
  --expected-work <work-id> --expected-session <session-id> \
  --expected-workspace <non-private-workspace-id>
```

The command reads sources from the bound Git commit and emits JSON to stdout;
it does not write files or contact the network. Preserve the receipt and output
with the work's existing evidence/handoff. Source paths, blobs, ordered receipts,
the Company snapshot and stages are covered by `record_sha256`, computed with
the existing `record_hash(record, "record_sha256")` helper. Schema definition:
`KAIOS_COMPANY_BOOT_RUNTIME_V0_1_SCHEMA.json#/$defs/engineeringWorkflowEvidence`.

Start with one `PRE_CODE` checkpoint containing only READ_CANON, LINEAGE,
EXISTING_RUNTIME, ACTIVE_WORK and DESIGN. To record a real source refresh or
completed CODE/TEST, append one checkpoint and pass `--previous-evidence` pointing
to the immutable prior record. Earlier checkpoints and their historical main SHAs
remain unchanged. POST_TEST adds actual CODE and TEST refs; it does not fabricate
CI, browser results or release approval. The latest checkpoint must match freshly
observed main, and that commit must be an ancestor of the checked-out HEAD.

### Rework cycles and source refresh

Every current checkpoint has `CYCLE` with `number`, `previous_checkpoint_id`,
`pre_code_checkpoint_id`, `reason`, `reason_ref` and `test_outcome`.

- Initial PRE_CODE: cycle 1, previous checkpoint null, reason INITIAL, PRE_CODE
  binding to itself, test outcome NOT_RUN.
- Refresh before testing: same cycle, reason SOURCE_REFRESH or REWORK, previous
  checkpoint bound exactly, new PRE_CODE binding to itself, outcome NOT_RUN.
- POST_TEST: same cycle, reason TEST_RESULT, previous checkpoint and PRE_CODE
  binding both point to that cycle's latest PRE_CODE. Main/read-source snapshot
  and first five stages must match. Record actual PASS, FAIL or BLOCKED.
- Rework after POST_TEST: cycle N+1, reason REWORK or SOURCE_REFRESH, previous
  checkpoint bound to the previous result, new PRE_CODE binding and NOT_RUN.

Thus PRE_CODE -> POST_TEST(FAIL) -> next-cycle PRE_CODE -> POST_TEST(PASS) is valid
without erasing the failure. A source refresh after a pass likewise needs a new
PRE_CODE before the next POST_TEST. Number skips/resets, orphan results, mismatched
PRE_CODE/source bindings and inheriting an old PASS into PRE_CODE fail closed.

Older prototype receipts without CYCLE are retained only as a historical prefix;
their cycle/outcome data is NOT_RECORDED. A real forward PRE_CODE can start cycle 1
with reason LEGACY_FORWARD_CHECKPOINT and link to the last old checkpoint, using
the exact previous evidence file. Never backfill CYCLE onto old records. An old
receipt alone fails the new cycle-evidence requirement rather than receiving a
retroactive PASS.

Output exposes `current_cycle`, `current_test_outcome` and the historical missing-
cycle count. `readiness_evaluated` is always false. Even a PASS is a self-reported
test outcome whose underlying evidence still requires operator/reviewer checks;
record consistency is not current readiness or release authority.

### Bounded history

One evidence record is limited to 128 total checkpoints, including historical
entries and PRE_CODE refreshes. This is not a promise of 128 complete cycles:
with only PRE_CODE/POST_TEST pairs, the maximum is 64 cycles, and additional
history/refresh checkpoints reduce that count. Cycle numbers are independently
bounded at 128 as an input-validation ceiling, not extra storage capacity.

The validator fails closed when the total bound is exceeded. Do not trim old
checkpoints, reset cycle numbers, or rewrite prior outcomes to make room. Preserve
the complete record. Continuation beyond this bound requires an explicitly
reviewed linked-successor evidence design, which this prototype does not implement.
Any eventual successor needs a genuinely new, freshly booted session, context-bound
evidence and an explicit link to the retained prior record. This CLI implements
neither automatic rollover/archival, cross-session authority transfer nor unbounded
persistence.

Path drift must be explicit: read Boot/Neural and a trusted tracked index, retain
the requested path, bind its real tracked path/blob and record why. Physics stays
behind CURRENT; the current map manifest/base are resolved from `docs/maps/README.md`.
Missing sources, unknown fields, wrong context, stale main, rewritten history,
unresolved affected-scope Canon conflicts and out-of-order stages fail closed.
An unrelated track's P0 or CI wait can be recorded without blocking this scope.

`CONSISTENT` verifies self-reported receipt/Git consistency only. It does not
authenticate authorship, establish cognitive reading, verify remote freshness,
decide source relevance or prove Human authorization. `actions_granted` is always
empty. Operator/reviewer still verifies current remote state, actual reading and
all existing permission/security/release gates. A receipt cannot become a Company
Boot Result, identity attestation, capability grant or name-based exemption.
Old evidence is retained as history and never backdated to meet this new rule.
