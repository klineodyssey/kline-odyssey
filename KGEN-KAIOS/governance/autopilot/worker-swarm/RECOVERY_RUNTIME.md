---
TITLE: "KAIOS Worker Swarm Recovery Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge required"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORKER-SWARM-RUNTIME-001"
CHANGE_REASON: "Preserve Claim, Evidence, Review, Session and Checkpoint while preventing split-brain execution after interruption."
ANCESTOR: "Candidate KGEN-KAIOS/governance/autopilot/COMPANY_SESSION.md; KGEN-KAIOS/kernel/kernel_sleep_cycle.md"
SOURCE_OF_TRUTH: "FALSE"
DOMAIN: "KGENVERSE"
KINGDOM: "DigitalLife"
PHYLUM: "RuntimeArchitecture"
CLASS: "RecoveryCoordination"
ORDER: "SessionRecovery"
FAMILY: "KAIOSWorkerSwarm"
GENUS: "FencedRecovery"
SPECIES: "KAIOSSwarmRecoveryArchitecture"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/worker-swarm/RECOVERY_RUNTIME.md"
---

# Recovery Runtime

## 1. Goal

If Cursor or another Worker disconnects, the company must retain Claim, Evidence, Review, Session and Checkpoint state. Recovery creates a new Session; it never silently reopens an old chat window or gives the Task to an unrelated Worker.

## 2. Interruption Detection

Signals include:

- heartbeat soft timeout;
- heartbeat hard timeout;
- provider disconnect;
- workspace unavailable;
- process or browser termination;
- explicit Worker stop;
- invalid Session token;
- repository or source conflict discovered after resume.

Timeouts are configurable and do not by themselves prove abandonment.

## 3. Recovery States

```text
ACTIVE
-> SUSPECTED_LOST
-> RECOVERY_PENDING
-> FENCED
-> RECOVERY_VALIDATING
-> RECOVERING
-> ACTIVE

RECOVERY_VALIDATING -> BLOCKED_RECOVERY
RECOVERING -> WAITING_REVIEW
ANY -> HUMAN_REVIEW_REQUIRED
```

## 4. Recovery Flow

```text
detect interruption
-> freeze dispatch for the Task and Clone
-> read last valid heartbeat and checkpoint
-> verify Claim and Review custody
-> revalidate Human Decision, Task Envelope and CURRENT sources
-> compare origin/main, branch, base and head
-> verify Evidence and protected paths
-> increment fencing_token atomically
-> mark old Session FENCED
-> create Recovery Session
-> bind same Claim lineage
-> issue bounded next action
```

If no valid checkpoint exists, the system preserves visible Git/report evidence and enters `BLOCKED_RECOVERY`; it does not invent missing state from chat memory.

## 5. Fencing Rule

Every state-changing request carries `fencing_token`. Recovery increments it before the new Session starts. Requests from an older token are rejected as `STALE_SESSION_FENCED` even if the old provider reconnects.

This prevents two Sessions from executing the same Claim after a network partition.

## 6. Recovery Session Fields

- `recovery_id`
- `new_session_id`
- `recovery_of_session_id`
- `clone_id`
- `worker_id`
- `task_id`
- `claim_id`
- `previous_fencing_token`
- `new_fencing_token`
- `checkpoint_id`
- `checkpoint_hash`
- `branch`
- `base_sha`
- `observed_head_sha`
- `observed_origin_main`
- `evidence_refs`
- `review_state`
- `recovery_reason`
- `validation_results`
- `authorized_action`
- `authorized_by`
- `created_at`

## 7. Claim Preservation

Recovery retains the original Task and Claim lineage. It does not create a second Claim. If the original Worker is suspended, unavailable long-term or unauthorized, reassignment requires a formal Claim disposition and Human/Codex decision; it is not ordinary Session recovery.

## 8. Review Recovery

If interruption occurs after Handoff submission, no execution resumes. The Recovery Session restores Review custody, verifies Evidence visibility and waits for the Review Owner. It cannot amend the Handoff unless `REPAIR_REQUIRED` is issued.

## 9. Checkpoint Trust

A checkpoint is accepted only when identity, Claim, Session, fencing token, hash, source versions, branch, protected-path result and timestamp are valid. Checkpoints carry facts, not authority. All permissions and CURRENT sources are revalidated.

## 10. Fail-Closed Cases

- checkpoint hash mismatch;
- Claim points to another active Session;
- branch or head changed without Evidence;
- Task Envelope missing or expired;
- Worker suspended or revoked;
- source priority conflict;
- protected-path modification;
- secret exposure;
- Review state disagreement;
- registry version conflict.

Each case preserves evidence and returns `HUMAN_REVIEW_REQUIRED` or a bounded same-task Repair recommendation.

## 11. Architecture Boundary

No watchdog, heartbeat daemon, recovery executor, checkpoint store, Session allocator or automatic Worker reassignment is implemented here.

