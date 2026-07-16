---
TITLE: "KAIOS Responsive Layout Runtime Architecture"
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
CHANGE_REASON: "Define deterministic desktop, tablet, Android, iPhone, orientation and theme layout checks."
ANCESTOR: "KGEN-KAIOS/ui-governor/UI_STYLE_CANON_V1.md; KGEN-KAIOS/world-viewer/UI_LAYOUT_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# Responsive Layout Runtime

## 1. Canonical Daily Profiles

The eight profiles are deterministic test contracts, not claims that one viewport represents every device.

| Profile | Viewport | DPR | Orientation | Theme | Safe area |
|---|---:|---:|---|---|---|
| `DESKTOP_LIGHT` | 1440 x 900 | 1 | landscape | light | none |
| `DESKTOP_DARK` | 1440 x 900 | 1 | landscape | dark | none |
| `TABLET_PORTRAIT_LIGHT` | 820 x 1180 | 2 | portrait | light | profile supplied |
| `TABLET_LANDSCAPE_DARK` | 1180 x 820 | 2 | landscape | dark | profile supplied |
| `ANDROID_PORTRAIT_LIGHT` | 412 x 915 | profile supplied | portrait | light | profile supplied |
| `ANDROID_LANDSCAPE_DARK` | 915 x 412 | profile supplied | landscape | dark | profile supplied |
| `IPHONE_PORTRAIT_LIGHT` | 390 x 844 | 3 | portrait | light | profile supplied |
| `IPHONE_LANDSCAPE_DARK` | 844 x 390 | 3 | landscape | dark | profile supplied |

Each of the ten surfaces runs all eight profiles, so every surface receives Desktop, Tablet, Android, iPhone, portrait, landscape, light and dark evidence every day.

## 2. Geometry Measurements

Every run records:

```text
layout_viewport
visual_viewport
document_bounds
scroll_bounds
safe_area_insets
fixed_regions
sticky_regions
drawer_bounds
dialog_bounds
panel_bounds
toolbar_bounds
bottom_action_bounds
interactive_target_bounds
focus_bounds
overlap_pairs
clipped_nodes
hidden_expected_nodes
```

Screen coordinates are inspection evidence only and never become land, ownership or world coordinates.

## 3. Invariants

- No horizontal document overflow at any profile.
- Text wraps, scales or scrolls without clipping controls.
- Primary content retains a nonzero usable viewport.
- Touch target rectangles do not overlap adjacent actions.
- Fixed controls remain inside the visual viewport and safe area.
- Drawer and Dialog state do not move underlying layout tracks.
- Background is inert and scroll-locked during modal overlays.
- Bottom actions remain visible above safe area and virtual keyboard.
- Top-right controls share the active size token.
- Orientation change produces one stable final layout without orphan overlays.
- Theme change does not alter geometry beyond approved font-rendering tolerance.

## 4. Drawer Test Sequence

```text
CAPTURE_CLOSED_GEOMETRY
-> OPEN_DRAWER
-> VERIFY_FULLSCREEN_ON_MOBILE
-> VERIFY_SAFE_AREA
-> VERIFY_BACKGROUND_INERT
-> ATTEMPT_BACKGROUND_SCROLL
-> VERIFY_FOCUS_CONTAINMENT
-> ROTATE_PROFILE
-> VERIFY_DRAWER_RELAYOUT
-> CLOSE_DRAWER
-> VERIFY_SCROLL_AND_FOCUS_RESTORED
-> COMPARE_PRIMARY_LAYOUT_GEOMETRY
```

Any primary-layout displacement while the Drawer is open is `UI-CANON-P0-004`.

## 5. Overlap and Hidden UI

The probe checks visible expected controls against other visible layers. Intersections are classified as intentional containment, approved overlay, transient animation, or defect. Zero-area, clipped, offscreen, transparent, covered or `visibility:hidden` expected actions fail unless the active state contract permits them.

## 6. Responsive Result

```text
PASS
PASS_WITH_APPROVED_EXCEPTION
FAIL_REFLOW
FAIL_OVERFLOW
FAIL_OVERLAP
FAIL_HIDDEN_UI
FAIL_SAFE_AREA
FAIL_TARGET_SIZE
FAIL_DRAWER
INVALID_PROFILE
```

Exceptions have owner, reason, expiry, affected profiles and review evidence. An exception cannot be permanent by omission.

## 7. Architecture Boundary

No CSS, viewport script, device emulator, browser runner, screenshot or responsive repair is created in this phase.
