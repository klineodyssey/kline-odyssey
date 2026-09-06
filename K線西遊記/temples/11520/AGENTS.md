# 11520 AGENTS.md

Scope: every AI / coding agent working under `K線西遊記/temples/11520/`.

This file is a mandatory local instruction layer in addition to the repository root `AGENTS.md` and `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`.

## 11520 product principle

11520 is a live game/product surface, not a static mockup. Functional tests alone are not sufficient. A change is not product-PASS until runtime visual QA has also passed on the real rendered page.

The GitHub Pages site is the designated live experiment surface for human playtesting after the approved QA gate. Do not hide a QA-passed candidate only on an obscure branch when the task explicitly authorizes publication to the GitHub Pages experiment surface.

## Mandatory runtime screenshot / visual QA

For every 11520 UI, control-layout, responsive, HUD, world-view, wallet-panel, organ-dock, combat-panel, joystick, map, modal, or mobile interaction change:

1. Start the real production entry through a local HTTP server or the exact GitHub Pages candidate.
2. Run the page in an actual browser runtime (Playwright/Chromium or equivalent), not DOM-only inspection.
3. Capture runtime screenshots after boot and after relevant interaction states.
4. At minimum include a 390x844 mobile viewport. Add other target sizes when the change affects responsive layout.
5. Inspect the screenshot itself before claiming PASS. DOM existence, clickability, coordinates, unit tests, and `pageerror=0` do not prove visual correctness.
6. If screenshot evidence shows overlap, clipping, missing images, blank/opaque overlays, displaced controls, wrong z-index, unreadable labels, or a stale version label, visual QA is FAIL even if functional CI is green.
7. Save screenshots as CI artifacts or otherwise make them reviewable from the workflow/job. Prefer deterministic filenames tied to the tested SHA and viewport.
8. A final 11520 QA report must distinguish at least `FUNCTIONAL_QA` and `VISUAL_QA`. Do not collapse them into one PASS.

## Visual defects that must be actively checked

Agents must proactively inspect for these classes of regression instead of waiting for Human to point them out:

- large blank, black, translucent, or invisible overlays blocking the 3D world;
- joystick thumb/logo missing, stationary, off-center, or outside its track;
- XZ HUD direction matching while the avatar actually moves the opposite world direction;
- Y fairy control overlapping bag, dock, combat, order, skill, or menu controls;
- lots/KGEN and C-warp/UFO controls oversized, misaligned, off-track, or covering the world/combat dashboard;
- duplicate backpack or duplicate organ controls;
- dock expansion hidden below other layers or moving the toggle unexpectedly;
- modal close/send/confirm controls blocked by wallet or other fixed surfaces;
- combat/order buttons covered by transparent pointer-catching elements;
- world canvas visually reachable but not pointer-reachable;
- version text not matching the delivered product/runtime version;
- any control that is visible but dead, or any organ present without an operational response.

## 11520 interaction acceptance

Human-approved control semantics remain:

- XZ joystick: right = world X+, left = X-, up = Z+, down = Z-.
- XZ visual/HUD direction and the avatar's actual world displacement must agree; never repair a model-facing bug by reversing canonical coordinate semantics.
- Y control: upward drag = Y+, downward drag = Y-; the visible fairy thumb follows the finger.
- Lots control: KGEN-logo thumb moves vertically; upward increases lots, downward decreases; value updates during drag and retains after release.
- C warp control: UFO thumb moves vertically; upward increases warp level, downward decreases; value updates during drag and retains after release.
- Empty-world tap must respond with navigation/movement behavior; tapping an entity/object must identify what was hit before offering movement/action.
- No meaningful player tap should silently do nothing. If the target has no direct action, an appropriate UI/service response is expected.

## 11520 release gate

Before telling Human that a 11520 build is ready to play, verify the same candidate SHA for:

- functional/runtime tests PASS;
- mobile browser interaction smoke PASS;
- runtime screenshot captured;
- screenshot visually inspected;
- VISUAL_QA PASS;
- no Mainnet transaction, token transfer, payment, treasury action, or governance mutation unless separately and explicitly authorized.

If functional QA passes but screenshot review fails, the status is `FUNCTIONAL_PASS / VISUAL_FAIL` and work continues.

## Self-diagnosis rule

Treat 11520 as an organism with organs: an agent is expected to know the current organ/control map, notice missing or dead organs, and investigate regressions without relying on Human to discover every defect. When a visible organ is non-functional, overlapping, missing, duplicated, or blocked, record it as a defect and repair/test it before declaring completion.

Signed policy source: Human feedback captured 2026-09-06; installed as persistent 11520 agent guidance so future pages/agents do not require the Human to repeat these rules.
