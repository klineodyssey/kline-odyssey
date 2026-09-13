# KAIOS 11520 Single Utility Master Closeout R1

```yaml
task_id: KAIOS-11520-SINGLE-UTILITY-MASTER-CLOSEOUT-R1-20260914
risk: R1
status: IMPLEMENTED_PENDING_EXACT_HEAD_CI
owner: chatgpt-01
base_branch: main
exact_base_sha: 62ceb1cc95ab45e49533eff1d377889718182ad6
work_branch: chatgpt-handoff/KAIOS-11520-MOBILE-HUD-VISUAL-REPAIR-R1-20260914
supersedes_local_stale_base: 5c82666282c8bba6c11cddcc7042069bceba570b
protected_execution: false
mainnet: false
payment: false
treasury: false
signer: false
governance: false
external_agent_launch: false
```

## Exact-base defect evidence

PR #345 safely delivered the Human-provided Wukong poster crop, circular control thumbs, flowing status rows and a compact utility menu. Direct inspection of its exact-head 390×844 screenshot artifact `10322645029` found one remaining mismatch with the Human requirement that the collapsed right utility area show exactly one button: `#k11520HudCollapseAll` remained visible beside `#k11520UtilityMaster`.

The all-HUD action remains a separate function, but it belongs inside the expanded utility set. Hiding its button while the set is collapsed does not couple its behavior to utility collapse.

## Bounded implementation

- Add `#k11520HudCollapseAll` to the optional utility set.
- Hide it with the other utilities while `k11520UtilitiesOpen` is false.
- Reveal it after the single master opens the utility set.
- Keep its existing all-HUD click behavior unchanged.
- Update runtime report expectations and browser regressions so collapsed mode accepts only `#k11520UtilityMaster`.

## Machine-verifiable acceptance

- Fresh 390×844 boot shows `#k11520UtilityMaster` and hides `#k11520HudCollapseAll`, dock, wallet, chat, AI, BGM, backpack and settings.
- One master tap reveals `#k11520HudCollapseAll` and every existing utility without auto-opening the organ submenu.
- Clicking `#k11520HudCollapseAll` still collapses/restores the whole HUD independently.
- Whole-HUD collapse leaves only its restore action visible; wallet, backpack, settings and the utility master do not remain as stray controls.
- Closing the utility set hides `#k11520HudCollapseAll` again and leaves one right-side master.
- Runtime reports `version: 1.7.1`, `hiddenWhenCollapsed: true`, `allReachable: true` and PASS.
- Real Chromium 390×844 collapsed and expanded screenshots receive direct visual inspection.
- Exact-head required CI must be green before expected-head merge; post-merge main checks and Pages must match the merge SHA.

## Stop conditions

Do not merge on moving main/head, stale base, red exact-head CI, missing screenshot evidence, visual failure, unresolved thread, protected-Canon conflict or protected-action expansion.
