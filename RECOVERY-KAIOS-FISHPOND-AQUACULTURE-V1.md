# Recovery Point - KAIOS Fishpond Aquaculture V1

Task: `KAIOS-FISHPOND-AQUACULTURE-RUNTIME-V1-001`

Previous main: `7b7e2e8188831c8cdc0750f138e31c12b7bd9e81`

Specification main: `1e4eeab9c2c8851fcd83306ccb83a78e0148c3a6`

Runtime branch: `codex/kaios-fishpond-aquaculture-runtime-v1`

Runtime PR: `#81`

Runtime merge: `74da556366445ce845ccae8a256e33d62868fbd2`

Production-QA repair PR: `#82`

Production-QA repair merge: `64f92eb91deebf83fcdf56f2f1d641b262f2a1b8`

Pages runs: `30719231518 / 30719949668` (`SUCCESS`)

Production verification: `HTTP 200 / 189 of 189 Product QA / 4 of 4 responsive viewports`

## Scope

- Runtime: `KGEN-KAIOS/world-viewer/aquaculture/`
- Viewer: `world-viewer/aquaculture-v1/`
- Public APIs: `api/kaios/aquaculture/v1/`
- Schemas and reports: `KAIOS/life/aquaculture/`
- Focused tests: `KGEN-KAIOS/world-viewer/tests/fishpond-aquaculture-*.test.mjs`
- Discoverability: official homepage, Full World Viewer, README and capability audit

## Rollback

Revert Runtime merge commit `74da556366445ce845ccae8a256e33d62868fbd2`. This
removes the orchestrator, dedicated Viewer, static API projection, navigation
entries, tests and reports without changing Canonical Life, Organism Schema V2,
Ecology Runtime, Causal Runtime, Constitution sources, Wallet, KGEN or CURRENT.
Do not delete the earlier Cursor candidate or merged specification evidence.

## Boundaries

`SIMULATION_ONLY / NO_REAL_WALLET / NO_REAL_KGEN / NO_ONCHAIN_TRANSFER /
NO_REAL_BIOENGINEERING / NO_REAL_FOOD_SAFETY_CERTIFICATION /
NO_REAL_LEGAL_EFFECT / NO_PRODUCTION_AUTHORITY`
