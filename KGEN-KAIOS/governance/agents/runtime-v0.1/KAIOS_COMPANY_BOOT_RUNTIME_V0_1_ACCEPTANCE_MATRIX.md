# KAIOS Company Boot Runtime V0.1 Acceptance Matrix

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Implementation: NOT_STARTED

| Requirement | Acceptance Criteria | Status |
|---|---|---|
| Unique Session Birth Record | Schema and state machine require unique `session_birth_id` and `instance_id` | PASS_DESIGN |
| Agent Life ID verification | Boot verifies Life record before attestation and capability | PASS_DESIGN |
| Identity Attestation | Required fields and failure state are defined | PASS_DESIGN |
| Capability Grant | V0.1 allowlist and grant verification are defined | PASS_DESIGN |
| Capability Revocation | Revoked or expired grant blocks boot | PASS_DESIGN |
| Canonical CURRENT_STATE | Single pointer candidate and conflict stop are defined | PASS_DESIGN |
| Main SHA verification | Current and expected SHA match is required | PASS_DESIGN |
| Parent Handoff | Required unless Human-authorized root session | PASS_DESIGN |
| Current WorkOrder | Status must be valid and authorized for read-only audit | PASS_DESIGN |
| Read-only audit | Allowed file set and output name are defined | PASS_DESIGN |
| Handoff generation | Required close step and schema are defined | PASS_DESIGN |
| Session archive | Terminal `ARCHIVED` state is required | PASS_DESIGN |
| Secret boundary | Secret storage and output are forbidden | PASS_DESIGN |
| Protected path boundary | Read allowed, modification forbidden | PASS_DESIGN |
| Failure tests | 12 required failure tests are specified | PASS_DESIGN |
| No product file modification | Explicit pass criteria require false | PASS_DESIGN |
| No commit | Explicit pass criteria require false | PASS_DESIGN |
| No push | Explicit pass criteria require false | PASS_DESIGN |
| No Cursor dispatch | Explicit pass criteria require false | PASS_DESIGN |
| No merge | Explicit pass criteria require false | PASS_DESIGN |
| No scheduler | Explicitly not approved | PASS_DESIGN |
| No Real KGEN | Explicitly not authorized | PASS_DESIGN |
| Standard state set | NEW, BOOTING, IDENTITY_VERIFIED, CAPABILITY_VERIFIED, STATE_VERIFIED, HANDOFF_LOADED, READ_ONLY_ACTIVE, HANDOFF_WRITTEN, ARCHIVED, FAILED, REVOKED, STALE and CONFLICTED are defined | PASS_DESIGN |
| Per-state controls | Every canonical state defines allowed inputs, allowed actions, forbidden actions, exit conditions, failure conditions and evidence required | PASS_DESIGN |
| Stale session allowed actions | STALE permits only READ, SYNC, DRIFT_REVIEW, HANDOFF and HUMAN_ESCALATION | PASS_DESIGN |
| Stale session forbidden actions | STALE forbids WRITE, COMMIT, PUSH, PR, MERGE, DISPATCH and DEPLOY | PASS_DESIGN |
| Handoff complete field set | Schema requires tests, blockers, risks, decisions, recovery point and evidence paths | PASS_DESIGN |
| Failure tests 15/15 | Test plan includes the original 12 plus State SHA mismatch, Handoff SHA mismatch and Session Lock conflict | PASS_DESIGN |
| Failure test structure | Each failure test includes command/method, fixture, expected result, evidence, pass rule, fail rule and cleanup | PASS_DESIGN |
| WorkOrder path minimization | Future implementation paths are exact files/folders, with wildcard only for fixtures and reports | PASS_DESIGN |
| Implementation options | Python and Node.js are compared without implementation | PASS_DESIGN |

## Minimum Human Review Gates

Before implementation, Human should approve:

1. Whether V0.1 may create live registry candidate files.
2. Whether V0.1 runtime proof should be script-based or manually executed.
3. Whether test records should be committed after execution.
4. Whether WorkOrder `KAIOS-COMPANY-BOOT-RUNTIME-V0.1` may be dispatched.

## Result

READY_FOR_IMPLEMENTATION_APPROVAL
