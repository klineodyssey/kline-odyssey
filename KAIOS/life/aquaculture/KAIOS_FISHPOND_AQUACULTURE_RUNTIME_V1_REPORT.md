# KAIOS Fishpond Aquaculture Runtime V1 Report

Current candidate revision: `2026-10-07.CUSTOMER_CLOSED_WORLD_CONSTRUCTION.1`.
Status: `DRAFT`, review pending, source parent
`1b32087243ee9489c855b56db786a165184367ab`. The historical deployed report below
is preserved; it does not claim this additive candidate is deployed.

Task: `KAIOS-FISHPOND-AQUACULTURE-RUNTIME-V1-001`

Status: `KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1_DEPLOYED`

Mode: `LOCAL_DETERMINISTIC_SIMULATION / SIMULATION_ONLY`

## Runtime

The authoritative orchestrator is
`KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js`. It consumes the
merged aquaculture schemas and reuses the existing Causal World route engine
and Reproduction and Ecology Runtime binding. It does not create another Life,
population, water, route, ledger, Wallet, KGEN, or authority engine.

The runtime enforces suitable land and simulated usage rights, all 17 ordered
construction stages, finite labor, equipment, materials, energy and time,
balanced pond water, causal water quality, transported and quarantined fish and
shrimp stocking, shared carrying capacity, feed and oxygen-dependent growth,
bounded reproduction, mortality and dead-biomass custody, harvest mass
accounting, cold-chain routing, confirmed demand, inventory costs, revenue
recognition after accepted delivery, distress, restructuring and simulated
liquidation with asset continuity.

## Determinism

Every command records a deterministic event envelope with input/output deltas,
state hashes, seed, time, location, actor, reason and status. State can be
paused, resumed, exported, imported, reset and replayed. Identical initial state,
seed, actions and environmental inputs produce identical state.

## Public Projection

Eleven generated JSON documents under `api/kaios/aquaculture/v1/` project the
demonstration state as static, read-only data. They advertise
`mutation_endpoints: false`, `simulation_only: true`, and
`authority: NO_PRODUCTION_AUTHORITY`.

## Safety

- Real Wallet: `NONE`
- Real KGEN: `DISABLED`
- On-chain transfer: `DISABLED`
- Real bioengineering: `NONE`
- Real food-safety certification: `NONE`
- Real legal effect: `NONE`
- Production authority: `DISABLED`
- Constitution source modification: `NONE`
- Uncontrolled reproduction: `DISABLED`

## Validation

The focused runtime and public integration suites cover land, construction,
water, stocking, growth, oxygen, mortality, decomposition, harvest, cold chain,
causal transport, demand, inventory, accounting, insolvency, replay, public
routes and boundaries. Final repository-wide and browser evidence is recorded
in the task Closeout.

Final independent review: `P0 = 0 / P1 = 0 / P2 = 0`.

Runtime PR #81 merged at `74da556366445ce845ccae8a256e33d62868fbd2`.
Production-QA repair PR #82 merged at
`64f92eb91deebf83fcdf56f2f1d641b262f2a1b8`. GitHub Pages and main Product
QA completed successfully; direct production verification passed 189 of 189
checks and all four required responsive viewports.

## Opt-in closed-world construction candidate (2026-10-07)

Human continuous engineering scope: Customer Project V2 digital Fish Pond,
existing Aquaculture owner only. This checkpoint modifies the existing
`KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js`, its existing
`KGEN-KAIOS/world-viewer/tests/fishpond-aquaculture-runtime-v1.test.mjs`, and this
report. No new file, Runtime, species, rate, public route, schema, workflow,
production identity or finance permission is introduced.

`configureLocalFixture` explicitly opts into `LOCAL_CLOSED_WORLD_TEST`. It is
allowed only at untouched paused revision zero, on the existing canonical
parcel. Exact field lists bind a fixture ID, complete finite equipment/
material/energy/water/feed pools, and the existing worker Life IDs. Resource
quantities and feed quality cannot exceed the owner's canonical starting
values. No resource or worker is created. Remote worker locations require an
explicit positive declared travel time; that is a synthetic fixture input,
not proof of a geographic route. The immutable configuration is an ordinary
owner event/action and replays with the installed engine. Exact retries do
not configure twice. Changed retry content, foreign parcel/worker IDs,
privileged fields and configuration after activity are rejected unchanged.

For this opt-in path only, each construction step records a stable per-stage
reservation ID, declared worker/equipment/material/energy requirements, site,
start/end time, and held-versus-released status. Repeated partial steps share
the stage reservation; they are not additive stock allocations. These are
exclusive resources inside one closed-world owner instance, not global
multi-project reservations, registry claims or physical dispatch authority.
The existing stage engine still enforces actual finite pools, work hours,
shift/stamina rules and nonzero elapsed time; it performs the consumption.

`inspectLocalConstruction` reads measured owner evidence. It checks ordered
completed stages, material/energy/water reconciliation, declared travel,
nonoverlapping worker logs, effective work/shift capacity, reservations,
funding, owner integrity and replay. Unscoped resource mutations or actions
keep evidence held. A valid 17-stage run produces
`CONSTRUCTION_EVIDENCE_READY`, with its exact owner revision/state hash; this
is not customer acceptance, a completed ecosystem, a registered asset, a
delivery or a receipt. FNV owner hashes are consistency checks, not signatures
or authenticated review; Customer's outer journal must retain SHA-256 binding.

The baseline standalone factory requires no new option and preserves its old
state/events. The market-order, delivery, automatic legacy buyer acceptance
and revenue methods are byte-identical. A separate synthetic compatibility
scenario runs construction, stocking, feed/growth, harvest, cold chain and
legacy delivery through both preserved and candidate modules and produces
byte-identical serialized state. That compatibility exercise is not a
Customer V2 acceptance or real revenue event.

Local verification: 46/46 owner tests (42 preserved plus four new), zero
failures/skips, Node 24.19.0; syntax and whitespace checks pass. New tests cover
strict finite configuration, no new identities/increased resources, exact
retry/replay, forged status, remote zero-time travel, a two-hour declared
commute, all 17 actual construction stages, per-stage reservations, measured
conservation, and held inspection after unscoped mutation. No biology rates
were added. Broader ordinary CI and browser regression remain pending until
this exact candidate is published through the allocated normal workflow lane.

Ecology source review confirms that microbes/plankton remain abstract resource
pools, not full Life runtimes. Aquatic-plant species and species-specific
oxygen/nutrient conversion coefficients are absent. The next exchange port
must preserve units and total recorded pools and reuse existing owner dynamics;
it cannot invent biological efficacy or silently turn a bank-plant/proxy
fixture into a complete aquatic ecosystem. Customer delivery/acceptance and
nonredeemable receipt remain separate guarded work.

Rollback: remove this additive opt-in path and its tests only when no saved
configuration action requires its reader. Preserve any such local snapshots
and fail closed under unsupported code; do not reset data. No deployment,
real procurement, payment, payroll, new Life, Registry or customer acceptance
is authorized by this report.
