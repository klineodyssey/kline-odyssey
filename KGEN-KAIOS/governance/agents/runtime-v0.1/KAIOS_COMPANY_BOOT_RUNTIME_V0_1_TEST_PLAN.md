# KAIOS Company Boot Runtime V0.1 Test Plan

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Implementation: NOT_STARTED

## Test Objective

Prove that V0.1 can allow one safe read-only boot audit and block invalid sessions without modifying product files, committing, pushing, dispatching or merging.

## Happy Path Test

Test ID: `BOOT-V0.1-HAPPY-001`

Inputs:

- valid `life_id`
- valid `instance_id`
- valid `attestation_id`
- valid `capability_grant_id`
- valid `base_main_sha`
- valid parent handoff or Human-authorized root session
- parseable current-state pointer
- read-only WorkOrder

Expected:

- `company_boot_status`: `COMPANY_BOOT_PASS`
- `READ_ONLY_BOOT_AUDIT_RESULT`: `PASS`
- files read recorded
- evidence IDs recorded
- Handoff Record created
- Session archived
- Session Lock released
- product files modified: false
- commit: false
- push: false
- dispatch: false
- merge: false

## Failure Tests

Each failure test must define command or method, fixture, expected result, evidence, pass rule, fail rule and cleanup. V0.1 implementation is not approved; commands below are candidate test methods only.

| Test ID | Failure Case | Command or Method | Fixture | Expected Result | Evidence | Pass Rule | Fail Rule | Cleanup |
|---|---|---|---|---|---|---|---|---|
| `BOOT-V0.1-FAIL-001` | Fake Life ID | Run boot verifier with unknown `life_id` | `fixtures/fake-life-id.json` | `COMPANY_BOOT_FAILED` | failure result, files changed scan | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Boot continues or writes product file | Delete temp output |
| `BOOT-V0.1-FAIL-002` | Fake Attestation | Run boot verifier with mismatched `attestation_id` | `fixtures/fake-attestation.json` | `IDENTITY_ATTESTATION_FAILED` | attestation mismatch evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Attestation accepted | Delete temp output |
| `BOOT-V0.1-FAIL-003` | Expired Capability | Run boot verifier with `expires_at` before boot time | `fixtures/expired-capability.json` | `COMPANY_BOOT_FAILED` | capability expiry evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Expired grant accepted | Delete temp output |
| `BOOT-V0.1-FAIL-004` | Revoked Capability | Run boot verifier with active revocation | `fixtures/revoked-capability.json` | `REVOKED` | revocation evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Revoked grant accepted | Delete temp output |
| `BOOT-V0.1-FAIL-005` | Wrong Main SHA | Run boot verifier with wrong `base_main_sha` | `fixtures/wrong-main-sha.json` | `STALE_SESSION_BLOCKED` | SHA comparison evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | High-risk action allowed | Delete temp output |
| `BOOT-V0.1-FAIL-006` | Missing Parent Handoff | Run boot verifier without parent and without root authorization | `fixtures/missing-parent-handoff.json` | `COMPANY_BOOT_FAILED` | missing handoff evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Session inherits work | Delete temp output |
| `BOOT-V0.1-FAIL-007` | Duplicate Session ID | Run boot verifier with existing `instance_id` | `fixtures/duplicate-session-id.json` | `CONFLICTED` | duplicate lookup evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Duplicate accepted | Delete temp output |
| `BOOT-V0.1-FAIL-008` | Stale Session | Run stale-action guard before write-like action | `fixtures/stale-session.json` | `STALE` | drift evidence | Only READ, SYNC, DRIFT_REVIEW, HANDOFF and HUMAN_ESCALATION allowed | Commit, push, PR, merge, dispatch or deploy allowed | Delete temp output |
| `BOOT-V0.1-FAIL-009` | Current State conflict | Run boot verifier with two current-state sources | `fixtures/current-state-conflict.json` | `CONFLICTED` | conflict evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Conflict ignored | Delete temp output |
| `BOOT-V0.1-FAIL-010` | Secret appears in output | Run output sanitizer against known fake secret marker | `fixtures/secret-output.json` | `COMPANY_BOOT_FAILED` and output rejected | redacted result and secret scan | No raw secret stored; No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Raw secret appears in evidence | Delete temp output |
| `BOOT-V0.1-FAIL-011` | Cache used as current truth | Run verifier with cache-only current state | `fixtures/cache-current-truth.json` | `COMPANY_BOOT_FAILED` | evidence provenance failure | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Cache accepted as canonical | Delete temp output |
| `BOOT-V0.1-FAIL-012` | Unauthorized WorkOrder | Run boot verifier with WorkOrder outside grant | `fixtures/unauthorized-workorder.json` | `COMPANY_BOOT_FAILED` | WorkOrder scope evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Unauthorized WorkOrder accepted | Delete temp output |
| `BOOT-V0.1-FAIL-013` | State SHA mismatch | Run current-state verifier with wrong `state_sha256` | `fixtures/state-sha-mismatch.json` | `CONFLICTED` | state hash evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | State accepted despite hash mismatch | Delete temp output |
| `BOOT-V0.1-FAIL-014` | Handoff SHA mismatch | Run handoff verifier with tampered parent handoff hash | `fixtures/handoff-sha-mismatch.json` | `COMPANY_BOOT_FAILED` | handoff hash evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Tampered handoff accepted | Delete temp output |
| `BOOT-V0.1-FAIL-015` | Session Lock conflict | Run lock verifier with conflicting active lock | `fixtures/session-lock-conflict.json` | `CONFLICTED` | lock conflict evidence | No Product File Modification; No Commit; No Push; No PR; No Merge; No Cursor Dispatch; No Deployment | Conflicting write lock accepted | Delete temp output |

## Read-Only Audit File Set

Minimum files to read in the happy path:

- `KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_LIFE_ARCHITECTURE_V1.md`
- `KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_ARCHITECTURE_BASELINE_READINESS.md`
- `KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_LIFE_ARCHITECTURE_V1_BASELINE_MERGE_CLOSEOUT.md`
- `KGEN-KAIOS/governance/autopilot/recovery_points/RECOVERY-20260721-KAIOS-AGENT-LIFE-ARCHITECTURE-V1.md`
- Current Company Status file when approved
- Current WorkOrder file when approved
- Latest Handoff file when approved

## Required Evidence

Each test must record:

- test ID
- boot input hash
- current main SHA
- expected main SHA
- result
- blocked action list
- files read
- files changed
- secret scan result
- protected path result
- handoff path

## Pass Criteria

V0.1 is acceptable only if:

- the happy path reaches `ARCHIVED`
- all failure cases reach `COMPANY_BOOT_FAILED`
- no failure case modifies product files
- no failure case commits
- no failure case pushes
- no failure case opens a PR
- no failure case dispatches Cursor
- no failure case merges
- no failure case deploys
- no evidence leaks secrets
