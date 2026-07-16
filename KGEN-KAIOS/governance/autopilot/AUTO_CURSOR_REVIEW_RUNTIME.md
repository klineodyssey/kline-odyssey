---
TITLE: "Automatic Cursor Handoff Review Runtime Architecture"
VERSION: "0.3.0"
REVISION: "2026-07-16.3"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "AGB / MAJOR_REVISION_REQUIRED_BEFORE_ENABLEMENT; next independent review required"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
CHANGE_REASON: "Require canonical atomic Claims, immutable Evidence Chain, review separation and deadlock-safe custody."
ANCESTOR: "CURSOR_HANDOFF_AUTO_REVIEW.md; worker-swarm/RECOVERY_RUNTIME.md; CLAIM_AND_LEASE_CONTROLLER.md"
SOURCE_OF_TRUTH: "FALSE"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/AUTO_CURSOR_REVIEW_RUNTIME.md"
---

# Auto Cursor Review Runtime

## 1. Authority Boundary

Auto Cursor Review Runtime is operated by Codex as General Manager and Quality Gate. It automates evidence collection and deterministic checks; it does not delegate review authority to Cursor Master or Monkey Clones.

The valid reviewers are:

- Codex within delegated Level A or Level B authority;
- Human PrimeForge for Level C and final Human decisions;
- an independent reviewer for advisory evidence only unless separately authorized.

Codex operates this gate as `KAIOS_COMPANY_GENERAL_MANAGER`. Cursor Master and Monkey Clones cannot review, merge, push, release or dispatch.

## 2. Review Preconditions

A handoff cannot enter quality review until the following resolve:

1. Human Decision or standing delegated authority;
2. Task ID and canonical Task Envelope;
3. registered Worker, Clone and Session identities;
4. canonical Claim ID, fencing token and lease lineage;
5. authorized branch, worktree, base and head;
6. immutable handoff and evidence references;
7. changed-file inventory;
8. tests and test provenance;
9. protected-path report;
10. WorkQueue and review-custody state.
11. Boot, SOP, Queue, Claim and Handoff schema versions.
12. latest heartbeat and checkpoint for the submitting Session.
13. Canonical Claim Authority revision and fencing token.
14. Clone identity attestation and conflict-of-interest result.
15. Evidence Chain continuity and tamper status.

Missing authority results in rejection, not a guessed reconstruction. Codex may reconstruct legacy metadata only under a separately authorized closeout decision and must label it reconstructed.

The permanent Company Boot, Session Resume, health, Inbox and queue preflight must complete before G0 starts.

## 3. Gate Sequence

```text
G0 Identity
-> G1 Authority
-> G2 Claim and Fencing
-> G3 Base and Head Integrity
-> G4 Scope and Single-task Purity
-> G5 Protected Paths and Secrets
-> G6 Evidence Completeness
-> G7 Tests and Reproducibility
-> G8 Architecture and Runtime Boundary
-> G9 Risk Classification
-> G10 Decision and Atomic Disposition
```

Each gate writes `PASS`, `FAIL`, `BLOCKED` or `NOT_APPLICABLE` with evidence references. A failed earlier gate prevents later approval, although read-only forensic checks may continue.

## 4. Gate Details

### G0 Identity

Validate `master_clone_id`, `clone_id`, `session_id`, `worker_id`, `claim_id`, `handoff_id`, `review_target`, `parent_clone`, `workspace`, `checkpoint` and `heartbeat`. Detect reuse, missing parentage and conflicting active Sessions.

### G1 Authority

Validate the Task Envelope against the Human Decision and Dispatcher record. Branch-local prompts, README text and chat memory cannot supply missing authorization.

### G2 Claim and Fencing

Confirm one active Claim per Session, one active Claim per Task and the current fencing token. Stale Sessions cannot submit new evidence. A heartbeat timeout enters Recovery; it never authorizes an immediate duplicate Claim.

Branch-local Claim files are permanently non-canonical. Until a transactional compare-and-swap authority exists and passes conformance tests, Auto Dispatch remains disabled.

### G3 Base and Head Integrity

Compare declared and observed SHAs, determine remote divergence and reject stale or mismatched identities. An accurate diff cannot cure a false declared head.

### G4 Scope and Single-task Purity

Compare changed paths with the envelope, detect unrelated edits, overlapping Clone work and dependency changes not requested by the task.

### G5 Protected Paths and Secrets

Run pre-review protected-path and secret checks. Any unknown impact blocks disposition; an actual Level C request goes to Human.

### G6 Evidence Completeness

Require `HANDOFF.md`, `handoff.json`, changed-file inventory, evidence, known issues, risk notes and out-of-scope observations.

Evidence records bind `evidence_id`, Task, Claim, Worker, Session, artifact hash, commit SHA, test hash, timestamp, causation, previous evidence hash, authorization, review signature and tamper status. Correction appends; it never overwrites.

### G7 Tests and Reproducibility

Verify commands, environment, results, source head and artifacts. A plain claim that tests passed is insufficient.

### G8 Architecture and Runtime Boundary

Confirm implementation authorization, frozen baseline status, Runtime CURRENT and Universe Map boundaries, and whether the task is architecture only.

`ARCHITECTURE_ONLY` always blocks coding dispatch even when a Clone is idle and the WorkQueue contains an `OPEN` entry.

### G9 Risk Classification

Apply delegated Level A, B or C rules. Level C always returns `HUMAN_REVIEW_REQUIRED` after safe containment.

The AGB autonomy ladder supersedes any broader inferred authority: current Company Runtime maximum is Level 2, while Level 2 Auto Dispatch is disabled pending Claim Authority.

### G10 Decision and Atomic Disposition

Write one review decision, then update Claim, lease, Session, WorkQueue, Review Log and Decision Log atomically or fail without partial release.

## 5. Decision Set

| Decision | Use | Claim result |
|---|---|---|
| `APPROVE` | All required gates pass | Close and release atomically |
| `APPROVE_WITH_WARNINGS` | Non-blocking bounded warnings | Close and release with follow-up evidence |
| `REPAIR_REQUIRED` | Authorized task has repairable defects | Same Claim returns to repair owner |
| `REJECT_UNAUTHORIZED` | Missing or invalid authority | Preserve evidence, never merge |
| `REJECT_DUPLICATE` | Equivalent content already accepted | Archive evidence without queue effect |
| `REJECT` | Material non-repairable failure | Close under rejection policy |
| `BLOCKED` | Required fact or dependency unresolved | Retain custody and escalation path |
| `HUMAN_REVIEW_REQUIRED` | Level C or Human-only authority | Freeze irreversible actions |

Only `APPROVE` and `APPROVE_WITH_WARNINGS` can initiate release, and only after atomic disposition succeeds.

Clones under the same Owner, parent lineage or declared conflict cannot review each other. Independent rotation and Codex custody are mandatory.

## 6. Repair Contract

Repair remains within the same task lineage:

```text
repair_id
review_id
task_id
claim_id
clone_id
required_changes
authorized_paths
forbidden_paths
required_tests
evidence_due
lease_revision
fencing_token
```

Repair cannot become a new task, expand scope or silently transfer ownership. If another Clone must take over, Dispatcher records a fenced recovery or explicit reassignment.

A configurable repair limit prevents endless cycles. Exceeding it enters `SAFE_HOLD` or Human escalation; it never becomes automatic approval.

## 7. Review Recovery Runtime

When Codex is interrupted during review:

1. detect an incomplete review event;
2. load its gate cursor and source revisions;
3. compare current branch and registry heads;
4. fence the stale reviewer Session;
5. create a new recovery review ID linked to the old review;
6. resume at the first incomplete gate;
7. re-run any gate whose evidence changed;
8. issue one superseding decision;
9. retain the old review as immutable history.

Recovery never edits Cursor evidence or grants a stale Claim new authority.

## 8. Review Evidence Contract

```text
review_id
reviewer
review_session_id
review_trigger
task_id
human_decision_id
master_clone_id
clone_id
session_id
claim_id
handoff_id
base_sha
observed_head_sha
declared_head_sha
gate_results
tests_replayed
protected_path_result
secret_scan_result
risk_level
decision
warnings
repair_id
decision_refs
reviewed_at
```

The record excludes secrets and Human-private content.

## 9. Required Compliance Tests

| Test | Expected result |
|---|---|
| Missing Human Decision and no delegated authority | `REJECT_UNAUTHORIZED` |
| Missing Task Envelope | `REJECT_UNAUTHORIZED` |
| One Clone claims a second task | `BLOCKED_CLAIM_CONFLICT` |
| Cursor attempts review | `DENIED` |
| Cursor attempts merge, push or release | `DENIED` |
| Declared head differs from observed head | No approval |
| Protected path requested | `HUMAN_REVIEW_REQUIRED` or reject by scope |
| Tests lack provenance | `REPAIR_REQUIRED` |
| Duplicate approved content | `REJECT_DUPLICATE / EVIDENCE_ONLY` |
| Stale fencing token | `BLOCKED_STALE_SESSION` |
| Valid isolated handoff | Continue through all quality gates |
| Interrupted review with checkpoint | Resume through Review Recovery |
| Architecture-only task with idle Clone | No implementation dispatch |
| Stale Boot, SOP, Queue, Claim or Handoff | `STALE_PROTOCOL_BLOCKED` |
| Heartbeat misses three intervals | Fence Session, then Recovery |
| Human asked to relay Cursor instruction | Policy failure; queue assignment instead |
| Branch-local Claim presented as authority | `REJECT_UNAUTHORIZED` |
| Broken Evidence Chain | Quarantine and block review |
| Same Owner Clone attempts review | `DENIED_CONFLICT_OF_INTEREST` |
| Repair limit exceeded | `SAFE_HOLD` |

## 10. Review-First Gate

Before a new task can be considered, Codex drains or explicitly classifies Review Queue, Repair Queue, expired Claims, Recovery and pending Decisions. A queue item may be safely deferred with durable custody, but it may not be ignored.

## 11. Legacy Suppression Gate

The review record captures loaded and effective Boot, SOP, Queue, Claim and Handoff versions. A conflicting legacy source is listed as suppressed with its reason and cannot be used as authorization or quality evidence.

## 12. Architecture Boundary

This proposal creates no review bot, GitHub Action, database, claim update, branch merge, commit, push or deployment.

```text
Architecture: ARCHITECTURE_REVISION_P0
Auto Cursor Review Runtime: PROPOSED
Auto Dispatch: DISABLED
Implementation: NOT_STARTED
```
