---
TITLE: "Company Disaster Recovery Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent reliability and security review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
ANCESTOR: "worker-swarm/RECOVERY_RUNTIME.md; COMPANY_END_OF_DAY_REVIEW.md"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/DISASTER_RECOVERY_STANDARD.md"
---

# Disaster Recovery Standard

## 1. Recovery Principle

Recovery restores verified custody and state; it does not recreate authority from chat memory. Every recovery preserves evidence, fences stale writers and limits cascade through quotas and circuit breakers.

## 2. Recovery Objective Classes

| Class | Data | RPO target | RTO priority |
|---|---|---|---|
| DR-0 | Human authority, Claim, money, land and authorization | `ZERO_ACKNOWLEDGED_EVENT_LOSS` | `PRIORITY_0_SAFE_CONTROL` |
| DR-1 | Evidence, decisions, reviews, baselines and audit roots | `ZERO_VERIFIED_EVENT_LOSS` | `PRIORITY_1_AUDIT_RECOVERY` |
| DR-2 | Active Session, queue projection and working memory | `LAST_VERIFIED_CHECKPOINT` | `PRIORITY_2_OPERATION_RECOVERY` |
| DR-3 | UI, analytics and health summaries | `BOUNDED_STALENESS` | `PRIORITY_3_REBUILD` |
| DR-4 | Disposable telemetry | `LOSS_ACCEPTABLE` | `NO_RESTORE_REQUIRED` |

These are target classes, not measured production commitments.

## 3. Failure Matrix

| Failure | Detection | Containment | Failover / Recovery | Rollback | Human escalation |
|---|---|---|---|---|---|
| Single Clone failure | Missed heartbeat, process or Session error | Fence Session, stop writes | Recover from last verified checkpoint under quota | Revert unreviewed workspace changes only through evidence-aware process | Escalate on protected or ambiguous evidence |
| Squad failure | Aggregator loss or widespread suspicion | Freeze squad dispatch | Reassign health custody to standby Squad controller | Restore last squad projection | Escalate if Claims cannot reconcile |
| Dispatcher failure | Lease and command timeout | Block new allocations | Activate standby with higher controller epoch | Replay dispatch events | Human if split-brain suspected |
| Registry failure | Read/write quorum or checksum failure | `SAFE_HOLD`, no ownership mutation | Restore verified snapshot and replay immutable log | Select previous valid snapshot | Human for unreconciled authority |
| Region failure | Regional health loss | Isolate Region and stop cross-region mutation | Fail over approved read paths; Claims remain fenced by Region epoch | Restore regional projection | Human before cross-region custody transfer |
| Network partition | Connectivity and epoch disagreement | No new cross-partition strong mutations | Continue safe local read or already fenced work only | Reconcile after partition using authoritative log | Human for conflicting ownership |
| Corrupt snapshot | Hash or replay mismatch | Quarantine snapshot | Use previous verified snapshot and replay | Discard corrupt projection, retain evidence | Human if no valid restore point |
| Bad deployment | Health regression and version mismatch | Stop rollout | Return to last approved artifact and schema-compatible projection | Version rollback with audit | Human for irreversible migration |
| Credential compromise | Revocation signal or anomaly | Revoke credential, fence Sessions, freeze sensitive Claims | Rotate keys and re-attest identities | Replace credentials, never rewrite signed history | Immediate Human security decision |
| Evidence corruption | Broken hash chain or missing artifact | Quarantine dependent review | Restore verified artifact or append corruption finding | Revert decision only through superseding review | Human if approval relied on corrupt evidence |

## 4. Recovery State Machine

```text
HEALTHY
-> SUSPECTED
-> CONTAINED
-> SAFE_HOLD
-> RECOVERY_PLANNED
-> RECOVERING
-> VALIDATING
-> RESTORED

VALIDATING -> ROLLBACK
ANY -> HUMAN_ESCALATION
```

Recovery cannot skip validation or create a lower fencing epoch.

## 5. Cascade Prevention

Each controller defines `max_recovery_rate`, retry budget, backoff, jitter, concurrent recovery limit and circuit-breaker threshold. A failed recovery does not automatically spawn another Clone. When budget is exhausted, the system remains in `SAFE_HOLD`.

## 6. Backup and Restore Evidence

Backup manifests include source revisions, event cursors, checksums, schema versions, encryption references, privacy class and restore priority. A backup is not valid until a restore verification succeeds in an isolated environment.

## 7. Disaster Recovery Drills

Before S0 enablement, drills must cover Clone loss, stale fencing token, corrupt snapshot, evidence hash break and Human emergency stop. S1 additionally requires Squad, Dispatcher, Registry and network-partition drills.

Drill evidence records scenario, expected state, actual state, data loss class, recovery path, elapsed class, residual risk and reviewer.

## 8. Architecture Boundary

```text
Disaster recovery architecture: UNDER_INDEPENDENT_REVIEW
Recovery service deployed: false
RPO/RTO measured: false
S0/S1 drills executed: false
```
