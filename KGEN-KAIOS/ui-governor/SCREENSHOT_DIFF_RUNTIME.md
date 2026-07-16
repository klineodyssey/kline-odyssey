---
TITLE: "KAIOS Screenshot Diff Runtime Architecture"
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
CHANGE_REASON: "Define deterministic, content-addressed screenshot comparison evidence."
ANCESTOR: "KGEN-KAIOS/ui-governor/UI_GOVERNOR_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Screenshot Diff Runtime

## 1. Inputs

Every comparison requires an exact tuple:

```text
surface_id
state_id
profile_id
source_commit
browser_engine
browser_version
viewport
device_pixel_ratio
orientation
color_scheme
fixture_id
font_bundle_hash
asset_manifest_hash
baseline_id
mask_revision
```

If any required value is missing or incompatible, the result is `INVALID_COMPARISON`.

## 2. Capture Stability

Capture begins only after:

1. document ready and surface-specific ready signal;
2. approved fonts and critical assets settle;
3. deterministic fixtures load;
4. animations and blinking cursors are frozen by the test adapter;
5. dynamic network regions reach an approved stable or masked state;
6. a quiet window has no new layout shift, console error or required network request.

Timeout is a failure artifact, not a blank screenshot baseline.

## 3. Artifact Set

```text
baseline.png
candidate.png
pixel-diff.png
perceptual-diff.png
layout-boxes.json
mask-regions.json
comparison.json
```

Artifacts are content addressed. A new artifact never overwrites a prior hash. Public artifacts must contain no private player identity, wallet data, exact GPS, KYC, secrets or private chat content.

## 4. Comparison Layers

| Layer | Detects |
|---|---|
| Pixel comparison | Exact raster changes |
| Perceptual comparison | Visible changes resilient to minor rendering noise |
| Structural geometry | Moved, resized, clipped or missing regions |
| Text snapshot | Unexpected label, status or truncation changes |
| Semantic snapshot | Role, name, state and focus-order changes |

The architecture permits a future proven library for raster and perceptual comparison. It does not prescribe a home-grown image algorithm.

## 5. Masks

Masks are reviewed exceptions for timestamps, live prices, randomized decorative particles or privacy redaction. A mask includes owner, reason, selectors/region, created revision, expiry and reviewer. It cannot cover controls, errors, ownership data, transaction status or an entire page.

Mask growth is itself a P1 finding.

## 6. Provisional Threshold Policy

Thresholds are profile- and surface-specific. Initial candidates for stable synthetic fixtures are:

```text
pixel_diff_ratio <= 0.001: PASS candidate
0.001 < pixel_diff_ratio <= 0.01: REVIEW
pixel_diff_ratio > 0.01: FAIL
missing_required_region: FAIL
unexpected_geometry_shift: FAIL
new_text_truncation: FAIL
```

These are architecture defaults, not final production constants. No aggregate ratio can override a missing critical control or P0 privacy finding.

## 7. Result Contract

```text
comparison_id
baseline_id
candidate_evidence_id
pixel_diff_ratio
perceptual_score
changed_regions
layout_shifts
text_changes
semantic_changes
mask_hits
threshold_policy_id
result
review_status
artifact_hashes
```

Allowed results are `PASS`, `REVIEW`, `FAIL`, and `INVALID_COMPARISON`.

## 8. Architecture Boundary

No browser, screenshot file, image library, baseline store or comparison job is created in this phase.
