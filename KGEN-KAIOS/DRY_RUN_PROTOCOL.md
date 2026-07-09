# KAIOS V7.1 Dry Run Protocol

**Protocol ID:** KAIOS-DRYRUN-V7-1
**Dry Run Task:** KAIOS-DRYRUN-001
**Status:** Ready for Cursor execution
**Owner:** Cursor
**Reviewer:** Codex
**Expected Branch:** `cursor-handoff/KAIOS-DRYRUN-001`
**Expected Report:** `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md`

## Purpose

This dry run verifies that the KAIOS V7.1 minimal worker layer can operate without entering V7.2 construction. It tests Worker Registry, Task Claim Lease, Cursor Handoff Branch, and Codex Pre-Merge Checklist as one complete loop.

Codex creates only the task and protocol. Codex must not execute the worker task itself.

## What Cursor Must Test

Cursor must verify:

1. Worker Registry can identify Cursor as a worker.
2. Task Claim Lease can move the task from `OPEN` to `CLAIMED` and then `IN_PROGRESS`.
3. Cursor uses the expected handoff branch only: `cursor-handoff/KAIOS-DRYRUN-001`.
4. Cursor writes the expected report: `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md`.
5. Cursor moves the task to `REVIEW` only after the report exists.
6. Cursor commits and pushes the handoff branch, not `main`.
7. Codex can review the handoff branch with `CODEX_PRE_MERGE_CHECKLIST.md`.

## Cursor Execution Boundary

Cursor may update only files necessary for the dry run report and task status. Cursor must not modify protected paths.

Cursor must not create a new architecture, new Runtime, new Boot, new worker system, or V7.2 Dashboard files during this dry run.

## Expected Cursor Output

Cursor should report:

- Task ID: KAIOS-DRYRUN-001
- Branch: `cursor-handoff/KAIOS-DRYRUN-001`
- Commit SHA
- Report path: `KGEN-KAIOS/reports/KAIOS-DRYRUN-001_REPORT.md`
- WorkQueue status: `REVIEW`
- Protected path check result

## Codex Review Boundary

Codex reviews after Cursor pushes the handoff branch. Codex checks:

- Handoff branch exists.
- Cursor commit is visible.
- Expected report exists.
- Diff is limited to dry run report and WorkQueue status.
- Protected paths are untouched.
- KAIOS task lifecycle was followed.
- Review log can record the decision.

## Pass Criteria

The dry run passes only if:

- KAIOS-DRYRUN-001 is claimed by Cursor.
- No second worker claims the same task.
- Handoff branch is pushed to `origin`.
- Report exists at the expected path.
- Codex can apply the pre-merge checklist without exceptions.
- Main is updated only after Codex approval.

## Fail Criteria

The dry run fails if:

- Cursor asks the user what to do instead of reading WorkQueue.
- Cursor skips KAIOS-DRYRUN-001.
- Cursor pushes directly to `main`.
- Cursor modifies protected paths.
- Report is missing.
- Branch or commit is not visible to Codex.