# KAIOS Fishpond Aquaculture Runtime V1 Report

Current candidate revision: `2026-10-07.LOCAL_PAIRED_BIOMASS_CANDIDATE.3`.
Status: `DRAFT`, review pending, source parent
`a6906b91508691cd0c62ba34fe36d8125ba19d0d`. The historical deployed report below
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

## Independent proof review and opt-in repair

Review of `6e4763c496425ecaa91640110ecb302306f83110` found two real issues
despite successful ordinary CI. P1: the existing owner replay comparison omits
events/action history/revision, so forged or missing reservation evidence could
pass the new inspection. P2: legacy per-call shift capacity could be reset by
several short calls, producing 16 effective work hours in one day for an
8-hour worker while the new inspector still reported evidence ready.

This successor repairs only the opt-in closed-world path. Inspection now
compares the complete canonical replayed state, including all event outputs,
action history and revision. It also requires the retained fixture event and
exactly one released completion reservation for each completed stage, so a
matching but truncated event ring cannot masquerade as full construction
evidence. Empty events, forged allocation fields, changed revision and duplicate
configuration actions keep evidence held. The legacy general replay/import
behavior and standalone acceptance/revenue path are not silently rewritten.

Fixture construction now allocates effective hours within their recorded
windows against the existing per-calendar-day shift capacity. Previous logs
consume the same day's capacity across subsequent calls. A short step cannot
reset that allowance; it blocks without moving the worker, advancing time or
consuming resources if no capacity remains. The inspector independently checks
the same cumulative feasibility, in addition to nonoverlap and work/travel/rest
totals. This is deterministic aggregate calendar-day capacity evidence, not a
claim of independently observed minute-by-minute labor or a new biological/
minimum-rest law. Existing stamina and rest-state gates remain.

Five new regression cases cover forged/deleted reservation evidence and
revision/history, split-call daily capacity with standalone compatibility,
imported cumulative overwork, and partitioned short travel windows. Against a
declared two-hour commute, 1h + 1h (or a 2h window) remains blocked at origin;
a later 8h window records two travel hours and six effective work hours. The
current owner does not accumulate partial commute progress across blocked calls.

Final local owner suite: 51/51, zero failures/skips, Node 24.19.0. The 27-event
legacy scenario remains byte-identical to the preserved baseline. Syntax and
whitespace checks pass. The same three files are changed; no workflow, timeout,
public UI, scientific coefficient or customer acceptance is added. Source
re-review and the new ordinary exact-head CI/browser batch must be recorded
separately before closing these findings.

Source re-review also found and repaired a calendar-boundary logging mismatch:
a 23h survey followed by a 10h design window spans two days and legitimately
fits 9 effective hours (1 + 8). Fixture logs now record the actual computed
window capacity instead of the legacy per-call value of 8; a dedicated
23h/10h regression reaches evidence-ready completion. Standalone logs are
unchanged.

Scoped source re-review verified runtime blob
`f0d6a76091ce2036a80a52017b792559611ee7e3` and closed all three reported
findings. Nine focused cases and twelve independent boundary-window cases
passed with exact replay equality. This is scoped source validation, not a
registered Reviewer role or production/merge authority. Successor CI/browser
results still require their own source binding.

## Paired dead-biomass candidate, admitted-stock window only

This successor adds explicit `LOCAL_PAIRED_EXCHANGE_TEST` owner options and a
pure candidate preparer within the existing Aquaculture owner. The unchanged
default APIs expose neither the new Aquaculture debit nor the new Ecology
receipt. No biological coefficient, default resource/population, alpha interface
or standalone acceptance/revenue behavior is changed. The existing Ecology
owner receives an optional entry point; this is not another ecology engine.

The proof window begins after **5 kg of explicitly admitted stock**. Existing
Aquaculture stocking checks an availability Boolean but does not debit a finite
juvenile inventory. Therefore this checkpoint is not end-to-end finite stocking
or procurement proof. Existing low-oxygen mortality over 24 explicit Aquaculture
hours, with every environmental water flow set to zero, leaves 4.7 kg living
and 0.3 kg dead biomass. The initial valid construction export is retained
separately; later stocking/ecology operations must not weaken its inspection.

The receiver uses the existing canonical wetland and ecosystem identities,
no populations and zero resource pools. Its exact frozen genesis is retained;
it does not adopt Ecology's default pond inventory or fish/shrimp populations.
This prevents double-counting Aquaculture's pond against the separate default
Ecology FISHPOND. Both incoming exports and the construction/genesis/fixture
are SHA-256-bound and reconstructed through their owners before preparation.
Full exported events, actions, revisions and state must match replay.

One manifest binds the same exchange ID, fixture hash, endpoint identities,
revisions/FNV consistency hashes, resource and exact integer-gram quantity.
Aquaculture debits in exact integer grams; Ecology credits in safe integer
milligrams at its existing six-decimal kg precision. Unsafe magnitude, loss
of an increment, fractional grams, source shortage, duplicate IDs, wrong
unit/resource/endpoint, stale hashes/revisions and unmatched historical halves
are rejected. FNV and SHA-256 provide consistency, not authentication.

The candidate fixture transfers **0.200 kg**: Aquaculture dead biomass becomes
0.100 kg and the disjoint receiver holds 0.200 kg. Ingress is explicitly not
decomposition: the receiver event records zero decomposed mass and zero nutrient
return. One subsequent existing Ecology tick yields 0.150 kg dead biomass,
0.030 kg decomposition and 0.020 kg nutrients. Together with 4.7 kg living and
0.1 kg remaining Aquaculture dead biomass, the admitted window still totals
5 kg. Existing abstract proxy labels remain `ABSTRACT_RESOURCE_POOL` and
`NOT_FULL_LIFE_RUNTIME`; no scientific fish-farming efficacy is implied.

`prepareLocalDeadBiomassExchange` accepts bounded data snapshots, never live
owner objects or arbitrary callbacks. It clones inputs, validates a successful
construction prefix and the exact disjoint genesis, checks full replay and
paired prior manifest histories, prepares the donor then receiver in disposable
instances, verifies equal mass and unchanged unrelated state, then returns both
exports together as `PAIRED_TRANSFER_CANDIDATE_NOT_COMMITTED`. A receiver failure
after donor preparation discards both candidates and leaves caller/live data
unchanged. Source and destination clocks remain separate; there is no invented
hour-to-tick conversion. Constructor-captured Ecology genesis must be preserved
for future restart; importing into a fresh default receiver is not equivalent.

The result remains non-durable and contains no asset, customer acceptance,
delivery, receipt, production authority or revenue. Backend integration is a
separate future checkpoint: both exports, exact genesis and manifest belong in
one existing aggregate/event/idempotency transaction, not independent owner
writes. This preparer enforces the existing 512,000-byte payload boundary.
The older House checkpoint must not be relaxed to accept arbitrary Pond pairs.

Local regression: 62 Aquaculture node:test cases pass, plus all 32 checks in the
preserved Ecology test script; the combined Node runner reports 63 subtests
because that script is one wrapper subtest. Zero failures/skips. New cases
cover exact 0.200 kg transfer, existing decomposition and 5 kg balance, caller
immutability, unsafe amounts, source shortage, stale bindings, wrong genesis,
forged histories, receiver rejection after donor preparation, duplicate IDs,
unmatched halves and no default API expansion. The standalone Ecology three-
tick export equals the preserved SHA-256
`d450e861554a3d589ef32a238bfdbac892ce18d44ed0ea1e36b29af60ff242fa`; standalone
Aquaculture's 27-event compatibility state remains byte-identical. Source
review and normal CI/browser results must bind this successor separately.

Changed paths are the existing Aquaculture runtime, existing Ecology runtime,
existing fishpond runtime test and this report. No new file, schema, rate,
workflow, Backend mutation, real settlement or automatic customer acceptance.
Rollback requires retaining readers for saved transfer actions/genesis, or
failing closed while preserving their snapshots; no automatic data reset.

Paired source review identified and repaired four hardening gaps before
publication: non-index array properties could escape canonical hash/size
measurement; cloning could invoke accessors before validation; matching prior
receipts were not also checked against the current fixture; and the direct
donor port needed safe resulting-mass/next-revision bounds. Original inputs
now undergo descriptor-based dense-JSON validation with a UTF-8 byte and
traversal budget before cloning. Accessors, sparse/custom-property arrays,
symbols and non-enumerable fields are rejected. Prior paired manifests must
match the actual construction fixture hash and current owner identities. Both
ports reject unsafe integer-milligram values, lost increments and unsafe
revisions before mutation. The full coordinator already rejected forged
unsafe owner histories; this also hardens direct local ports.

Four further regression cases cover those findings and a second 50 g transfer
after an independent Ecology tick. Both receipts remain replayable with saved
genesis and separate clocks; admitted-window conservation and caller-owned
data remain unchanged. No persistent pair commit or customer delivery is
claimed.

Final scoped re-review verified Aquaculture blob
`be1a5e2aee57706aa9ad2b7230139045e61c794a` and Ecology blob
`a631bdced9b317e67af2d14d30fb40e94c3c9870`, closing all reported findings.
A residual initial-milligram round-trip case was included in the repair and
negative tests before publication. The final source-only re-review does not
relabel earlier independent probes as a fresh full suite; final 11-case paired
and combined 62-plus-Ecology verification are the implementation test results.
No formal Reviewer authority, merge, deployment or customer acceptance follows.
