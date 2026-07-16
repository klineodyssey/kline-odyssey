---
TITLE: "Architecture Drift Detection Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/ARCHITECTURE_DRIFT_STANDARD.md"
---

# Architecture Drift Standard

## 1. Purpose

Architecture Drift Detector compares approved intent with observed repository and runtime evidence. It never silently repairs core architecture.

## 2. Required Comparisons

The detector checks:

- CURRENT selector versus loaded Runtime;
- approved ADR versus implementation;
- protected-path policy versus changed files;
- CURRENT rules versus legacy prompts and SOPs;
- schema and protocol versions;
- Worker Boot versions;
- effective autonomy level versus Human grant;
- event contract versus producers and consumers;
- Claim contract versus canonical storage;
- approved scale versus advertised capability;
- baseline manifest versus current hashes.

## 3. Drift Record

```text
drift_id
detected_at
detector_version
domain
expected_source
expected_version
observed_source
observed_version
affected_files
affected_workers
affected_claims
severity
evidence
automatic_containment
resolution_proposal
status
review_owner
```

## 4. Severity

| Severity | Example | Action |
|---|---|---|
| P0 | Human authority, Claim, protected path, Runtime CURRENT or autonomy drift | Block mutation, `SAFE_HOLD`, report immediately |
| P1 | Approved ADR or schema incompatibility | Block affected module and propose resolution |
| P2 | Documentation, dashboard or non-authoritative projection drift | Report and schedule correction |
| INFO | Expected version rollout state | Observe with expiry |

## 5. Response Flow

```text
DETECT
-> VERIFY EVIDENCE
-> CLASSIFY
-> BLOCK AFFECTED ACTION
-> REPORT
-> PROPOSE RESOLUTION
-> REVIEW
-> HUMAN DECISION when required
-> APPLY APPROVED CHANGE
-> VERIFY CLOSED
```

Core architecture, CURRENT selectors and frozen baselines are never auto-corrected.

## 6. Legacy Rule Re-entry

Boot manifests record every loaded Boot, SOP, Queue, Claim, Handoff and Agent rule version. A stale or conflicting source is suppressed as `STALE_PROTOCOL_BLOCKED`. The record identifies the effective CURRENT source and requires a new preflight.

Historical prompts and branches remain evidence. They cannot regain authority through repeated use.

## 7. Autonomous Authority Drift

The detector compares requested action, effective autonomy grant, Human Anchor, task scope, environment and protected paths. A higher observed level immediately reduces the actor to Level 0 or `SAFE_HOLD` and records a P0 event.

## 8. Contract Drift

Event and Claim producers publish schema/version metadata. Unknown major versions are quarantined. Compatible minor-version projections may remain read-only until validation completes.

## 9. Repository Drift

Fetch and compare determine whether snapshots, branches, queue metadata and remote history agree. A stale `PENDING_PUSH` entry whose commit is already in `origin/main` is classified `STALE_METADATA`, preserving history without blocking on a nonexistent push.

## 10. Observability

Metrics include drift count by severity, mean classification time, unresolved age class, suppressed legacy sources, contract mismatch, autonomy mismatch and repeated offender domain. Raw sensitive evidence is not exposed on dashboards.

## 11. Conformance Tests

Tests include changed Runtime hash, stale ADR implementation, protected-path diff, old Cursor Boot, schema major mismatch, expired Human grant, unauthorized autonomy increase, wildcard event subscription, branch-local Claim and stale queue snapshot.

## 12. Architecture Boundary

```text
Architecture Drift Detector: STANDARD_UNDER_REVIEW
Automatic core repair: FORBIDDEN
Detector implementation: NOT_STARTED
```
