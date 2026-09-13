# KAIOS-11520-LIFE-CANVAS-CURRENT-MAIN-CLOSEOUT-R1-20260914

- Priority: P1
- Risk: R1
- Source PR: #332
- Exact base: `5c10518fd1591113c85b1b6ba3eb023fb9b4910d`
- Source head: `c08611bfe0bd5b6dee7e5ece6b6b18e30692843b`
- Successor branch: `chatgpt-handoff/11520-life-canvas-current-main-20260914`

## Objective

Make a real Chromium pointer tap on a raycast-visible 3D Life deterministically select that exact Life and expose its canonical LIFE_ID, HP/MAX HP and XYZ. Preserve player, world-object and ground routing.

## Scope

- `K線西遊記/temples/11520/runtime/game-5d-main.mjs`
- `K線西遊記/temples/11520/tests/11520-browser-living-world.mjs`
- `K線西遊記/temples/11520/tests/11520-browser-mobile-hud.mjs`

## Acceptance

- Exact source diff transplanted on latest main without conflicts.
- Runtime and invariant tests pass.
- Real Chromium pointer selection passes.
- 390×844 screenshot gate and visual inspection pass for the selected-Life interaction.
- Exact-head required CI passes; no unresolved review thread or blocking comment.
- No Mainnet, payment, governance, secret, Worker/Life activation or protected Canon change.
