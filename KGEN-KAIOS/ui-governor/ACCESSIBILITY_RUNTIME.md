---
TITLE: "KAIOS Accessibility Runtime Architecture"
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
CHANGE_REASON: "Define automated and manual accessibility evidence for every UI surface."
ANCESTOR: "KGEN-KAIOS/ui-governor/UI_STYLE_CANON_V1.md"
SOURCE_OF_TRUTH: false
---

# Accessibility Runtime

## 1. Target

The proposal targets WCAG 2.2 AA-compatible behavior as an engineering goal, while recognizing that automated checks alone cannot certify conformance. Every report distinguishes `AUTOMATED_PASS`, `MANUAL_REVIEW_REQUIRED`, `FAIL`, and `NOT_TESTED`.

## 2. Automated Checks

- document language, title and landmark structure;
- accessible names, roles and states;
- duplicate IDs and invalid ARIA references;
- form labels and error association;
- heading order and meaningful regions;
- focus visibility and offscreen focus;
- keyboard reachability and focus traps;
- target dimensions and target overlap;
- color-independent state evidence;
- contrast under approved theme tokens;
- text scaling and reflow;
- reduced-motion behavior;
- live-region noise and status announcements;
- image alternatives and decorative-image treatment.

## 3. Manual Gates

Automated evidence is supplemented by reviewed tasks for:

- logical reading and focus order;
- screen reader meaning of dynamic surfaces;
- keyboard equivalence for drag, selection and context actions;
- long-press alternatives;
- error clarity and recovery;
- map, canvas and game-state alternatives;
- cognitive load and progressive disclosure;
- voice, audio and caption requirements;
- high contrast and non-color state comprehension.

## 4. Overlay Accessibility

Drawer, Dialog and Context Menu tests require:

1. labelled container and trigger;
2. focus moves to a valid target;
3. background becomes inert for modal overlays;
4. focus remains within the active modal region;
5. Escape or documented equivalent closes when safe;
6. focus returns to the invoking control;
7. screen reader announcement is concise;
8. orientation change preserves focus and close access.

## 5. Input Equivalence

| Pointer/touch action | Required equivalent |
|---|---|
| Click/tap select | Keyboard select and semantic control |
| Double click/tap enter | Keyboard enter/open command |
| Right click/long press | Context-action button or keyboard menu key |
| Drag map | Keyboard pan or focus-based navigation |
| Wheel/pinch zoom | Zoom controls and keyboard commands |
| Swipe/back gesture | Visible Back control |

## 6. Finding Record

```text
rule_id
surface_id
profile_id
state_id
selector_or_region
impact
description
expected_behavior
actual_behavior
automated_evidence
manual_evidence
assistive_technology
theme
status
```

## 7. Release Gate

Critical task flows must be operable without pointer-only input. Unknown manual coverage cannot be converted to PASS. An inaccessible close action, focus loss, hidden critical control or color-only safety state blocks release.

## 8. Architecture Boundary

No accessibility library, assistive-technology runner, DOM mutation or remediation code is added in this phase.
