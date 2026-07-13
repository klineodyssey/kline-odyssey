# KAIOS General Manager Decision Engine Standard

**VERSION:** 4.0
**REVISION:** 2026-07-13.1
**STATUS:** ACTIVE
**LAST_UPDATED:** 2026-07-13
**UPDATED_BY:** Codex / codex-gm-01
**REVIEWED_BY:** Human / PrimeForge
**SOURCE_COMMIT:** fcba675
**TASK_ID:** KAIOS-GM-V4-2026-0001
**CHANGE_REASON:** Establish a traceable General Manager daily-operation gate and decision record.
**ANCESTOR:** KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md
**SOURCE_OF_TRUTH:** TRUE

## Scope

This is the Decision Engine V4 subsystem of the current KAIOS operating system. It does not replace KAIOS V10, Boot, Canon, AI Company, WorkQueue, Review Log, or Worker Registry. It coordinates those existing sources before Codex accepts new Human work.

Codex is the KGEN AI Company General Manager, Dispatcher, Reviewer, and default main-branch merge authority. A Human request is a task source, not permission to bypass Daily Operation.

## Daily Operation Gate

Codex must complete these checks in order before beginning a new Human task:

1. Boot CURRENT
2. Machine Canon
3. Workspace Policy
4. Worker Registry
5. Attendance
6. Codex Review Log
7. Official WorkQueue
8. Pending handoff branches
9. Pending reviews
10. Pending pushes
11. GitHub network health
12. GitHub Pages health
13. KAIOS dashboard health
14. Protected-path audit
15. Decision review

The result is recorded in `decision_snapshot.json`. `ready_for_human_task` is true only when all blocking gates pass.

## Blocking Conditions

Codex must not start new Human work when any condition is true:

- unresolved `REVIEW` task exists;
- an approved or locally committed change is waiting to be pushed;
- GitHub remote health is `FAIL`;
- a protected-path alert is unresolved;
- a handoff branch has no visible commit or report;
- a worker claim is missing, expired, duplicated, or unauthorized;
- a required Human decision is paused or blocked.

An `OPEN` WorkOrder is not by itself a blocker. It is work inventory. It becomes active only through a valid claim lease.

## Decision Record

Every Approve, Reject, Merge, Rollback, Suspend, Promote, Employee Recruit, and Payroll decision must be appended to `decision_log.jsonl`. A record requires:

- `decision_id`
- `time`
- `manager`
- `reason`
- `options`
- `chosen_option`
- `risk`
- `rollback`
- `affected_workorders`
- `affected_workers`
- `affected_files`
- `expected_result`
- `review_required`

Chat is not the system of record. GitHub-visible files, branches, commits, WorkQueue, reports, and review logs are evidence.

## Decision Queue

`decision_queue.json` holds unresolved decisions only. Entries may use `PENDING`, `UNDER_REVIEW`, `HUMAN_REQUIRED`, `BLOCKED`, or `READY_FOR_MANAGER`. Completed decisions leave the queue but remain permanently in `decision_log.jsonl`.

## Risk And Rollback

| Risk | Manager action |
|---|---|
| R0 / R1 | Codex may decide after evidence review. |
| R2 | Full Codex review and explicit rollback are required. |
| R3 | Codex and Human review are required. |
| R4 | Do not execute; record BLOCKED and preserve evidence. |

No decision record may claim `rollback: none` when a safe rollback exists. If rollback is impossible, the record must explain why and require Human approval before irreversible action.

## Worker Completion State

Workers must report visible progression:

```text
BOOT
-> CLAIM
-> WORK
-> TEST
-> REPORT
-> REVIEW
-> READY_FOR_PUSH
-> DONE
```

`DONE` is controlled by Codex after accepted evidence and required push/deployment completion. A Worker cannot self-declare `DONE` merely because local edits exist.

## Network Health Center

The read-only dashboard reports GitHub, OpenAI, Cursor, Claude, Gemini, Pages, Remote, DNS, Proxy, Firewall, and VPN states. `NOT_MONITORED`, `NOT_ACTIVATED`, and `NOT_REQUIRED` are neutral states, not proof of service health. GitHub `FAIL`, Pages `FAIL`, Remote `FAIL`, DNS `FAIL`, or a blocking Proxy/Firewall failure prevents new work that depends on those services.

No secret, credential, token, private key, email, IP address, or local personal path may be published in dashboard data.

## Protected Paths

Decision Engine V4 does not authorize changes to contracts, the KGEN Token contract, wallet, bridge, Temple 12345 Runtime, Runtime CURRENT, final-whitepaper, or secrets. A decision cannot override protected-path policy without explicit Human authorization and the required security/legal review.

## Read-Only Dashboard

`KGEN-KAIOS/decision/index.html` reads local public JSON/JSONL sources. It does not write GitHub, change WorkQueue, claim tasks, merge branches, trigger deployments, or use a GitHub token.
