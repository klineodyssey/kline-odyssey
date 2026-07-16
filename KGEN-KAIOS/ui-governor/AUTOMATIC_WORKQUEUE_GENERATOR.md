---
TITLE: "KAIOS Automatic UI WorkQueue Generator Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
AUTOMATION: "DESIGNED_NOT_ENABLED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Define bounded Issue-to-WorkOrder generation while preserving WorkQueue and Claim authority."
ANCESTOR: "KGEN-KAIOS/ui-governor/AUTOMATIC_ISSUE_GENERATOR.md; KGEN-KAIOS/governance/autopilot/CANONICAL_ATOMIC_CLAIM_AUTHORITY_PROPOSAL.md"
SOURCE_OF_TRUTH: false
---

# Automatic WorkQueue Generator

## 1. Authority Boundary

UI Governor may prepare a `PROPOSED` WorkOrder. It cannot directly create `OPEN`, allocate a Claim, change another task, or bypass Priority Scheduler. Current generation is disabled.

## 2. Eligibility

An Issue is eligible only when:

- evidence is valid and deduplicated;
- priority and owner module are known;
- authorized and forbidden paths are explicit;
- protected-path classification is complete;
- acceptance tests are deterministic;
- rollback is possible;
- no active WorkOrder already owns the same root cause;
- implementation has architecture authorization;
- Canonical Atomic Claim Authority is available before dispatch.

## 3. WorkOrder Candidate

```text
task_id
source_issue_id
human_decision_id
title
objective
priority
risk_level
authorized_actions
forbidden_actions
authorized_paths
forbidden_paths
protected_paths
required_sources
affected_surfaces
affected_profiles
required_tests
required_evidence
baseline_ids
rollback_plan
worker_role
reviewer
dependencies
expiry
status = PROPOSED
```

## 4. Grouping Rules

One WorkOrder contains one root cause and one coherent path owner. Similar visual symptoms across unrelated modules are not bundled. A shared Style Canon defect may become one framework task plus separate adoption tasks only after overlap analysis.

## 5. Priority Scheduling

```text
P0 privacy/security/release corruption
-> P1 blocked critical operation
-> P1 repair of active task
-> P2 accessibility/responsive/performance
-> P3 cosmetic batch
```

An existing Review, Repair or recovery obligation remains ahead of new UI work under Company policy.

## 6. Protected Paths

A finding in the Temple 12345 protected runtime, Runtime CURRENT, contracts, wallet, bridge, Token, Universe Map CURRENT, final whitepaper or a frozen baseline produces `PROTECTED_PATH_CHANGE_PROPOSAL`. It cannot become a Cursor implementation Claim without exact Human authorization.

## 7. Current Boundary

```text
WorkQueue generator: NOT_IMPLEMENTED
WorkQueue entry created by this proposal: false
Automatic OPEN transition: DISABLED
Automatic Claim: DISABLED
```
