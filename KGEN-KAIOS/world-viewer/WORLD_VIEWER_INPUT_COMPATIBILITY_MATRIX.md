---
TITLE: "KAIOS World Viewer V1 Input Compatibility Matrix"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "INTERNAL_REVIEW_PROPOSAL"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001"
CHANGE_REASON: "Define equivalent mouse, touch, keyboard and assistive interaction contracts for the World Viewer review."
ANCESTOR: "KGEN-KAIOS/world-viewer/CAMERA_STANDARD.md; KGEN-KAIOS/world-viewer/SELECTION_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# World Viewer Input Compatibility Matrix

## 1. Principle

All primary navigation and selection outcomes must be available without a mouse. Gesture input changes the mechanism, not authority or land state.

## 2. Compatibility Matrix

| Intent | Mouse / trackpad | Touch | Keyboard / assistive | Arbitration rule | V1 status |
|---|---|---|---|---|---|
| Select object | Left click | Single tap | Focus object + Enter | Cancel if movement exceeds click tolerance | REQUIRED |
| Enter child level | Double click | Double tap | Enter on selected object | Requires valid child and stable selection | REQUIRED |
| Open Parcel menu | Right click | Long press | Shift+F10 / Menu key | Only a selected eligible Parcel may open actions | REQUIRED |
| Pan | Primary-button drag | One-finger drag | Arrow keys | Pointer capture after drag threshold | REQUIRED |
| Zoom | Wheel / trackpad pinch | Two-finger pinch | `+` / `-` controls | Anchor at pointer/gesture center; keyboard uses viewport center | REQUIRED |
| Back one level | Escape / breadcrumb | Visible Back button; compatible system-back action | Escape / breadcrumb | Do not hijack browser back without recoverable history | REQUIRED |
| Return home | Home control | Floating Home control | Focusable Home control | Uses mock/account Home Anchor, never GPS ownership | REQUIRED |
| Return Earth | Earth control | Earth control in compact menu | Focusable Earth control | Always restores valid K280 bounds | REQUIRED |
| Close menu | Outside click / Escape | Outside tap / Back | Escape | Must restore prior focus | REQUIRED |
| Inspect | Selection opens panel | Selection opens bottom sheet | Selection announcement and focusable Inspector | Does not move map unexpectedly | REQUIRED |
| Multi-select | Modifier + click | Explicit mode only | Explicit mode only | No implicit multi-select | FUTURE |

## 3. Gesture Thresholds

The following are implementation-review starting values, not frozen constants:

| Setting | Suggested start | Rule |
|---|---:|---|
| Mouse drag threshold | 6 CSS px | Movement beyond threshold suppresses click |
| Touch drag threshold | 10 CSS px | Cancels tap and long press |
| Mouse double-click interval | Platform default, capped near 300 ms | Must remain configurable |
| Touch double-tap interval | About 350 ms | Must not delay single-tap feedback excessively |
| Long-press delay | 500-700 ms | Cancel on movement, second pointer or system interruption |
| Wheel zoom step | Normalized adapter value | Trackpad deltas must not be treated as mouse notches |

Device-pixel ratio must not change logical gesture thresholds. Thresholds are measured in CSS pixels.

## 4. Input Mode Contract

```text
input_mode:
  MOUSE
  TRACKPAD
  TOUCH
  KEYBOARD
  ASSISTIVE
  UNKNOWN
```

`input_mode` selects hints and gesture arbitration only. It must not become a fingerprint, identity attribute, permission decision or analytics identifier.

The runtime must switch modes when the latest meaningful input changes; it must not assume a touchscreen device never uses a mouse or keyboard.

## 5. Pointer Arbitration

1. Pointer down creates a tentative tap/click candidate.
2. Crossing the drag threshold converts the gesture to Pan and suppresses selection.
3. A second touch pointer cancels tap/long press and enters Pinch.
4. Right click or completed long press resolves the Parcel before opening the menu.
5. Camera movement closes transient context menus.
6. Pointer cancellation, window blur and orientation change terminate the gesture safely.
7. No gesture may submit a proposal without an explicit focused action activation.

## 6. Mobile Back Behavior

World Viewer must expose a visible `BACK_LAYER` control. Browser or operating-system Back may map to semantic history only when the current viewer state was deliberately added to history and returning is reversible. It must never trap the user, erase a proposal draft or intercept platform navigation unconditionally.

## 7. Keyboard And Screen Reader Contract

- Tab enters the map control group and can continue to the Inspector.
- Arrow keys pan by a documented step.
- `+` and `-` zoom.
- Enter selects or enters the focused child.
- Shift+F10 opens the selected Parcel menu.
- Escape closes a menu, then exits the current semantic level when no transient surface remains.
- Selection, semantic-level changes and blocked actions use concise live-region announcements.
- A text list or next/previous object mechanism must exist when spatial keyboard navigation cannot reach a rendered feature reliably.

## 8. Touch And Layout Safety

- The full-screen map may capture gestures only inside its interaction surface.
- Bottom-sheet drag handles must not pan the map beneath them.
- Context actions use a bounded action sheet when pointer anchoring is unstable.
- Controls remain reachable in portrait and landscape orientation.
- Touch targets require an approved minimum size before implementation.
- Text scaling must not cover the map attribution or Home/Back controls.

## 9. Failure Cases

| Case | Expected result |
|---|---|
| Drag interpreted as click | FAIL; selection must be suppressed |
| Long press fires while panning | FAIL |
| Right click changes ownership | FAIL CLOSED |
| Touch has no Back Layer | FAIL |
| Keyboard cannot open context menu | FAIL |
| Reduced motion blocks camera input | FAIL |
| Orientation change loses world bounds | Restore checkpoint or parent bounds |
| Unknown input device | Use neutral controls and `UNKNOWN` mode |

## 10. Review Status

The input architecture is compatible across desktop and mobile after the gesture thresholds, semantic history and assistive list behavior are incorporated as amendments. No executable input handler is authorized by this document.

