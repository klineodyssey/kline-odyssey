---
TITLE: "KAIOS UI Style Canon V1 Architecture Candidate"
VERSION: "1.0.0-CANDIDATE"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_CANON_CANDIDATE_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Unify structural UI primitives and make six mobile corrections mandatory for future implementation."
ANCESTOR: "KGEN-Genesis/GEN-010_Design_System/KGEN_Design_System_V1.0.md; KGEN-KAIOS/world-viewer/UI_LAYOUT_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# UI Style Canon V1

## 1. Status and Scope

This is a review candidate beneath the KAIOS Constitution, GEN-010 Design System, approved module baselines and Human decisions. It defines shared structural behavior for future KAIOS and Temple UI. It does not rewrite an existing UI, freeze a baseline or authorize a protected Temple change.

Every implementation may provide brand colors and imagery through reviewed semantic tokens, but component geometry, accessibility, overlay behavior and motion safety must follow this contract.

## 2. Token Foundations

### Spacing

```text
space-0: 0
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 24px
space-6: 32px
space-7: 48px
```

### Radius

```text
radius-control: 6px
radius-panel: 8px
radius-dialog: 8px
radius-round: 999px only for circular controls, pills or status indicators
```

Page sections are not floating cards. Cards are reserved for repeated items, modals and genuinely framed tools. Cards never nest inside cards.

### Shadow

```text
shadow-none
shadow-raised
shadow-overlay
shadow-focus
```

Shadows express elevation or focus, not decoration. They cannot be the only boundary in high-contrast mode.

### Motion

```text
motion-instant: 0ms
motion-fast: 120ms
motion-standard: 180ms
motion-deliberate: 240ms
easing-standard: cubic-bezier(0.2, 0, 0, 1)
```

Reduced-motion mode uses `motion-instant` for non-essential movement. No infinite decorative movement is required for task completion.

### Typography

```text
text-xs: 12px / 1.4
text-sm: 14px / 1.45
text-md: 16px / 1.5
text-lg: 20px / 1.35
text-xl: 24px / 1.25
text-display: 32px / 1.15, reserved for true page-level display use
letter-spacing: 0
```

Font size does not scale with viewport width. User text scaling must not clip labels or controls.

## 3. Button Canon

- Icon control box: stable `44px x 44px` minimum.
- Primary touch target: `48px x 48px` minimum on touch-first surfaces.
- Text button minimum height: `44px`.
- Icon size: `20px` to `24px` without changing control geometry.
- Top-right utility controls use one shared size token and alignment grid.
- Familiar actions use familiar icons plus accessible names and tooltips where needed.
- Disabled state remains legible and cannot be enabled by removing a CSS class.
- Loading state preserves dimensions and accessible name.

## 4. Panel and Inspector Canon

- Panels are full-height work regions or bounded tools, not decorative cards.
- Desktop Inspector width is a stable `320px` to `360px` token range.
- Compact operational panels use compact headings, not hero typography.
- Content scrolls inside its region; it does not resize the primary viewport unexpectedly.
- Unknown data is `UNKNOWN`, never fabricated as zero.
- Panel width, min/max height and overflow mode are explicit at every breakpoint.

## 5. Dialog Canon

- Dialog is modal only when the underlying task must pause.
- It has a labelled title, initial focus, focus containment, Escape policy and focus restoration.
- Desktop max width defaults to `640px`; complex tools require a reviewed exception.
- Mobile dialog may become full screen when content or keyboard safety requires it.
- Background content becomes inert and is excluded from pointer and assistive interaction.

## 6. Drawer Canon

Desktop drawers may use a bounded overlay rail. Mobile drawers are always full screen:

```text
position: fixed
inset: 0
width: 100dvw
height: 100dvh
max-width: none
max-height: none
border-radius: 0
padding-top: env(safe-area-inset-top)
padding-right: env(safe-area-inset-right)
padding-bottom: env(safe-area-inset-bottom)
padding-left: env(safe-area-inset-left)
```

The Drawer overlays the application and never changes the primary layout tracks. Opening it stores the previous scroll position, locks background scroll, makes the background inert, and moves focus into the Drawer. Closing restores scroll and focus.

## 7. Context Menu Canon

- Context Menu is anchored to the action point but clamped to the visual viewport.
- Keyboard invocation anchors to the selected object.
- Touch uses long press or an equivalent accessible action.
- Items are commands or state choices, not navigation clutter.
- Permission-denied actions are disabled with a reason; hiding them must not be the authorization mechanism.
- Menu closes on Escape, outside action, source invalidation or parent navigation.

## 8. Toolbar Canon

- Toolbars use stable control dimensions and predictable grouping.
- The top-right group uses the shared utility-control token.
- Overflow becomes a menu before labels or controls overlap.
- Icons require accessible names; active toggles expose pressed state.
- Toolbar placement cannot cover primary content or safe-area insets.

## 9. Bottom Action Canon

Mobile bottom actions are fixed above the bottom safe area:

```text
position: fixed
left: 0
right: 0
bottom: 0
padding-bottom: env(safe-area-inset-bottom)
```

The content viewport reserves the measured action-bar height. Buttons remain reachable in portrait, landscape and virtual-keyboard states. The bar cannot be hidden behind an open Drawer and cannot overlap the Drawer close action.

## 10. Six Mandatory First-Implementation Amendments

| ID | Requirement | Acceptance evidence |
|---|---|---|
| UI-CANON-P0-001 | Mobile Drawer is full screen | Portrait and landscape geometry capture |
| UI-CANON-P0-002 | All fixed UI supports four safe-area insets | iPhone portrait/landscape occlusion scan |
| UI-CANON-P0-003 | Top-right controls use one stable size | Bounding-box token comparison |
| UI-CANON-P0-004 | Drawer is overlay and never pushes layout | Before/open/close primary-layout geometry diff |
| UI-CANON-P0-005 | Background scroll and interaction lock while open | Scroll, pointer, keyboard and inert-state evidence |
| UI-CANON-P0-006 | Bottom actions remain fixed and safe | Visual viewport, keyboard and safe-bottom evidence |

These are architecture requirements, not completed fixes. Existing protected Temple files remain unchanged.

## 11. Theme and Color Boundary

- Every semantic color has light, dark and high-contrast definitions.
- Information is never encoded by color alone; icon, label or pattern accompanies it.
- A module may use its identity palette, but shared components retain consistent state semantics.
- No theme may make focus, disabled, error, selection or warning states indistinguishable.
- Theme switching cannot alter geometry enough to trigger reflow or overlap.

## 12. Adoption Gate

Adoption requires independent UI review, component examples, accessibility evidence, visual baselines, migration impact by surface and exact Human authorization for protected paths. Until then this remains `UI_STYLE_CANON_V1_CANDIDATE`.
