---
TITLE: "KAIOS UI Governor Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Specify a permanent evidence-first UI inspection and remediation control plane."
ANCESTOR: "KGEN-KAIOS/ui-governor/README.md"
SOURCE_OF_TRUTH: false
---

# UI Governor Runtime

## 1. Role

UI Governor is a proposed Company control-plane module. It observes UI artifacts and creates reviewable evidence. It is not a rendering engine, UI framework, browser authority, ownership authority, WorkQueue authority, Claim authority or deployment authority.

```text
Company Boot
-> Repository and Pages Health
-> UI Inspection Plan
-> Deterministic Capture
-> Rule Evaluation
-> Screenshot Diff
-> Accessibility and Performance Evaluation
-> Finding Normalization
-> Issue Deduplication
-> Proposed WorkOrder
-> Canonical Claim
-> Cursor UI Worker
-> Handoff Evidence
-> Codex Review
-> Release Gate
```

The final seven transitions are architectural only and disabled in this proposal.

## 2. Runtime Modules

| Module | Responsibility | Explicit non-authority |
|---|---|---|
| Inspection Planner | Build surface/profile/state matrix | Cannot approve baselines |
| Browser Adapter | Drive an approved deterministic browser | Cannot retain credentials |
| Screenshot Capture | Produce content-addressed artifacts | Cannot overwrite history |
| Screenshot Diff | Compare approved baseline and candidate | Cannot approve a visual change |
| Layout Probe | Measure geometry and visibility | Cannot mutate CSS |
| Accessibility Probe | Collect semantic and input evidence | Cannot claim full conformance alone |
| Performance Probe | Capture timing, frame and resource evidence | Cannot hide failed samples |
| Link and Console Probe | Record network, route and runtime errors | Cannot ignore allowlist drift |
| Finding Normalizer | Produce stable issue fingerprints | Cannot close an Issue without evidence |
| Issue Adapter | Create or update one deduplicated Issue | Cannot create a Claim |
| WorkQueue Adapter | Propose a bounded WorkOrder | Cannot publish `OPEN` without authority |
| Dispatch Adapter | Request canonical Claim allocation | Disabled until atomic authority exists |
| Review Adapter | Attach rerun evidence to Codex review | Cannot self-approve Worker output |

## 3. Daily Inspection Contract

The proposed schedule runs once per Company day and may also run on an approved UI commit, release candidate, Human request, or post-deployment verification.

```text
DISCOVER_SURFACES
-> FREEZE_SOURCE_SHA
-> LOAD_PROFILE_MATRIX
-> VERIFY_BASELINES
-> CAPTURE_80_CELLS
-> RUN_14_RULE_FAMILIES
-> NORMALIZE_FINDINGS
-> DEDUPLICATE
-> CLASSIFY_PRIORITY
-> EMIT_HEALTH_REPORT
-> PROPOSE_ISSUES_AND_WORKORDERS
-> WAIT_FOR_LEGAL_CLAIM_AUTHORITY
```

If source SHA, route mapping, baseline hash, browser version, theme, viewport, consent state or artifact store is ambiguous, the affected cell is `INVALID_RUN`, not PASS.

## 4. Surface Registry

Every surface record contains:

```text
surface_id
display_name
canonical_route
route_aliases
owner_module
protected_path_class
required_states
authentication_mode
fixture_profile
dynamic_regions
privacy_class
baseline_policy
enabled
```

The first ten IDs are `HOMEPAGE`, `TEMPLE`, `WORLD_VIEWER`, `LAND`, `LIFE`, `MISSION`, `MARKETPLACE`, `COMPANY`, `DNA`, and `PLAYER`.

A route alias may support navigation but cannot silently satisfy a missing canonical surface. For example, `EXCHANGE` may be related to Marketplace and `MEMBERSHIP` to Player, but those aliases require a reviewed mapping before they count as canonical coverage.

## 5. Required Rule Families

| Rule family | Required evidence |
|---|---|
| Safe Area | Insets, viewport, fixed regions and occlusion geometry |
| Button Size | Visible control box, token and exception reason |
| Touch Area | Hit target rectangle and nearest-target distance |
| Overlap | Pairwise intersection and z-order |
| Hidden UI | Expected-visible selector, clipping and opacity state |
| Overflow | Document, container and axis overflow measurements |
| Panel Width | Panel bounds against profile contract |
| Drawer Height | Drawer mode, visual viewport and safe-area bounds |
| FPS | Frame samples, percentile and sample duration |
| Loading | Navigation, first usable state and timeout evidence |
| Console Error | Complete console event list and allowlist revision |
| Broken Link | URL, source element, response and redirect chain |
| Responsive | Profile invariant and reflow evidence |
| Accessibility | Automated rule results plus manual-gate requirements |

## 6. Inspection Evidence

Every scenario emits an immutable `UIInspectionEvidence` record:

```text
evidence_id
inspection_run_id
surface_id
profile_id
source_commit
deployment_sha
route
browser_engine
browser_version
viewport
device_pixel_ratio
orientation
color_scheme
fixture_id
baseline_id
screenshot_hash
dom_snapshot_hash
console_log_hash
network_log_hash
accessibility_report_hash
performance_report_hash
rule_results
started_at
completed_at
causation_id
previous_evidence_hash
tamper_status
```

Raw secrets, wallet state, private GPS, KYC, session tokens and private player data are forbidden in evidence. Test fixtures use synthetic or explicitly public data.

## 7. Finding Priority

| Priority | Definition | Automatic behavior after enablement |
|---|---|---|
| P0 | Security/privacy exposure, protected-state mutation, unusable critical route, or release-wide corruption | Block release; Human escalation when required |
| P1 | Core action inaccessible, severe overlap, mobile UI blocked, repeated console crash | Create Issue and proposed WorkOrder |
| P2 | Material responsive, accessibility or performance regression | Create or update Issue; schedule bounded repair |
| P3 | Cosmetic deviation without task loss | Record, deduplicate and batch |

No score may hide a P0 failure.

## 8. Release Gate

A UI release candidate fails closed when any of these is true:

- unresolved P0;
- required surface/profile cell missing or invalid;
- screenshot baseline lacks approval;
- console error or broken route violates the active policy;
- critical accessibility operation is impossible;
- protected-path change lacks exact Human authorization;
- Claim or Handoff provenance is incomplete;
- evidence chain is broken;
- rollback cannot be demonstrated.

## 9. Automatic Remediation Boundary

The intended future low-risk flow does not require Human to relay routine UI defects:

```text
Finding
-> Issue
-> Priority
-> Evidence
-> Screenshot
-> Proposed WorkOrder
-> Canonical Claim
-> Cursor Handoff
-> Codex Review
```

However, this proposal cannot enable that flow. The current canonical atomic Claim service is not implemented. Any finding against the Temple 12345 protected runtime, Runtime CURRENT, wallet, contracts, Token, frozen baselines or another protected path stops at `PROTECTED_PATH_CHANGE_PROPOSAL`.

## 10. State Machine

```text
DRAFT_PLAN
-> READY_TO_CAPTURE
-> CAPTURING
-> EVALUATING
-> REPORT_READY
-> ISSUE_CANDIDATE
-> WORKORDER_CANDIDATE
-> WAITING_CLAIM_AUTHORITY
-> DISPATCHED
-> REVIEW
-> VERIFIED
-> CLOSED
```

Failure states are `INVALID_RUN`, `BLOCKED_SOURCE`, `BLOCKED_BASELINE`, `BLOCKED_PRIVACY`, `BLOCKED_PROTECTED_PATH`, `BLOCKED_CLAIM_AUTHORITY`, and `SAFE_HOLD`.

## 11. Architecture Boundary

```text
Architecture: UNDER_REVIEW
Implementation: NOT_STARTED
Daily Runtime: NOT_RUNNING
Issue Generator: DESIGNED_NOT_ENABLED
WorkQueue Generator: DESIGNED_NOT_ENABLED
Cursor Dispatch: DISABLED
WorkQueue Created: false
Deployment: false
Runtime CURRENT modified: false
Universe Map modified: false
Protected UI modified: false
```
