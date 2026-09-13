# KAIOS 11520 Layout Scope Rollback R1 — 2026-09-14

TASK_ID = KAIOS-11520-LAYOUT-SCOPE-ROLLBACK-R1-20260914  
OWNER = codex-gm-01 / chatgpt-01  
HUMAN_AUTHORITY = 沈英明  
RISK = R1 / UI ONLY  
STATUS = READY_FOR_AUTONOMOUS_REPAIR

## Human defect report

Production screenshot at ~390x844 is visually unacceptable after #345/#346. The repair expanded beyond the requested scope and changed unrelated HUD geometry.

VISUAL_QA = FAIL

Observed production defects:

- floating `座標`, `生命`, `地圖`, `參數` pills appear in unrelated positions;
- C 曲速 / 口數 controls drift into the left map/status region instead of remaining one bottom three-rail group;
- remaining-axis rail is detached toward center and the three rails no longer read as one group;
- `K市場` pill intrudes on the KZ market card header;
- top market cards still visually crowd/occlude the status content below;
- unrelated controls were moved although Human did not request their redesign;
- the result is materially less coherent than the pre-#345 mobile layout.

## Root-cause boundary

Commit #345 (`62ceb1cc95ab45e49533eff1d377889718182ad6`) changed both:

- `K線西遊記/temples/11520/runtime/market-origin-wallet-layout-runtime.mjs`
- `K線西遊記/temples/11520/runtime/mobile-control-layout.mjs`

and widened the task from targeted fixes into broader mobile HUD repositioning. #346 only refined utility-master visibility and did not restore the unrelated layout changes.

## Restoration baseline

Use `5c82666282c8bba6c11cddcc7042069bceba570b` as the visual/layout comparison baseline for unrelated geometry.

Do NOT wholesale reset current main. Preserve later canonical Life-selection, AI Ant bank, wallet continuity, navigation, safety, QA and other post-baseline functionality.

Perform a forward-only current-main repair.

## Allowed retained changes from #345/#346

Only these Human-requested UI changes are authorized to survive:

1. right-side utility controls may collapse to one master button and expand from that one button;
2. three vertical control thumbs must remain true circles and may use the approved Wukong artwork crop;
3. remaining-axis visible label must be compact (`X 縱搖桿`, `Y 縱搖桿`, or `Z 縱搖桿`) with long energy text moved out of the narrow card;
4. KX/KY/KZ market cards must leave safe non-overlapping space for the status/life content below.

Everything else should match the prior stable layout semantics unless a fresh screenshot demonstrates a real defect requiring a minimal local correction.

## Explicitly revert / remove unintended redesign

- remove floating/repositioned `座標`, `生命`, `地圖`, `參數` pills when they were introduced or relocated solely by the broad HUD redesign;
- restore C / lots / remaining-axis controls to one coherent bottom three-rail group;
- restore map/minimap, joystick, combat controls, life/status cards and market controls to their prior intended zones;
- do not move unrelated controls merely to satisfy synthetic overlap metrics;
- `K市場` must not cover KZ title/header content;
- no label may overflow or float over the game scene without an explicit Human requirement.

## Scope discipline rule

For this repair, changing an unrelated element is a defect unless required by a measured collision caused by one of the four retained changes above.

Do not redesign the whole HUD. Do not treat "tests pass" as visual acceptance.

## Required QA loop

1. start from latest main;
2. compare against the pre-#345 visual/layout baseline;
3. implement the smallest forward-only patch;
4. run full functional tests;
5. launch real Chromium at 390x844;
6. capture screenshot;
7. directly inspect screenshot visually;
8. if any element is misplaced, overlapping, clipped, newly floating, or less coherent than baseline, repair and repeat;
9. repeat until both Functional QA and Visual QA pass;
10. merge only exact-head green;
11. verify GitHub Pages exact deployed SHA;
12. inspect production screenshot again before closeout.

## Acceptance checklist

- no unintended floating pills;
- top KX/KY/KZ row readable and aligned;
- World/Life/status content below market row fully visible;
- joystick remains left-bottom and unobstructed;
- C / lots / remaining-axis remain one aligned three-rail group;
- right utility collapsed state shows exactly one master;
- expanded utility set does not cover KZ or gameplay-critical content;
- circular thumbs are visually circular in the screenshot, not only CSS dimensions;
- no KAIOS/KGEN balance clipping;
- no unrelated HUD element moved from baseline without documented reason;
- 390x844 screenshot direct visual review = PASS;
- production screenshot direct visual review = PASS.

## Protected boundaries

No Mainnet, payment, treasury, signer, token movement, governance, KYC, external paid agent launch, wallet identity change, KX/KY/KZ semantic change, XYZ semantic change, or Temple wallet-continuity change.

## Closeout response

Return only:

CURRENT_MAIN =  
REPAIR_PR =  
RESTORED_FROM_SCOPE_CREEP =  
RETAINED_REQUESTED_CHANGES =  
FUNCTIONAL_QA =  
VISUAL_QA =  
SCREENSHOT_ITERATIONS =  
PAGES_SHA =  
PRODUCTION_VISUAL_QA =  
NEXT_AUTONOMOUS_TASK =  
HUMAN_ACTION_REQUIRED =
