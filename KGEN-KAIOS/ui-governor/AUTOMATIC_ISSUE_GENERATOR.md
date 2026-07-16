---
TITLE: "KAIOS Automatic UI Issue Generator Architecture"
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
CHANGE_REASON: "Define evidence-backed, deduplicated UI Issue creation without enabling it."
ANCESTOR: "KGEN-KAIOS/ui-governor/UI_GOVERNOR_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Automatic Issue Generator

## 1. Objective

After future enablement, ordinary UI findings are converted to traceable Issues without requiring Human to relay them. Issue creation is not permission to edit code, create a Claim or deploy.

## 2. Finding Fingerprint

```text
hash(
  surface_id
  + state_id
  + profile_family
  + rule_id
  + normalized_region
  + normalized_selector
  + failure_signature
)
```

Theme- or orientation-specific defects remain linked variants of one Issue when the root cause is shared.

## 3. Issue Record

```text
issue_id
fingerprint
title
priority
surface_id
affected_profiles
affected_states
rule_ids
first_seen_at
last_seen_at
occurrence_count
source_commits
baseline_ids
evidence_ids
screenshot_artifacts
console_artifacts
privacy_class
protected_path_class
suspected_owner_module
status
duplicate_of
recommended_action
```

## 4. State Machine

```text
CANDIDATE
-> EVIDENCE_VALIDATED
-> DEDUPLICATED
-> OPEN
-> WORKORDER_CANDIDATE
-> IN_REPAIR
-> VERIFYING
-> RESOLVED
-> CLOSED
```

Side states are `FLAKY`, `FALSE_POSITIVE`, `BLOCKED_PROTECTED_PATH`, `BLOCKED_PRIVACY`, and `SAFE_HOLD`.

## 5. Deduplication and Reopen

- Same fingerprint updates occurrence and evidence; it does not create issue spam.
- A resolved Issue reopens when the same failure returns on a newer source commit.
- A new root cause receives a new Issue even when the screenshot region matches.
- Issues are not auto-closed by one passing retry; the affected matrix must pass its verification window.

## 6. Privacy

The generator redacts private fixtures before artifact publication. A redaction failure blocks Issue creation and stores only a restricted incident reference. Public Issues cannot contain KYC, exact GPS, wallet secrets, tokens, private player data or Heaven Secret content.

## 7. Current Boundary

```text
Issue adapter: NOT_IMPLEMENTED
GitHub token: NOT_STORED
Issue creation: DISABLED
Human relay requirement after enablement: NOT_REQUIRED_FOR_ORDINARY_LOW_RISK_UI
Protected or Level C finding: HUMAN_DECISION_REQUIRED
```
