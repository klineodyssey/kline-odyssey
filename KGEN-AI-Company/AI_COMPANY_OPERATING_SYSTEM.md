# KGEN AI Company Operating System

## Metadata

| Field | Value |
|---|---|
| VERSION | V3.0 |
| REVISION | 2026-10-07.CUSTOMER_DIGITAL_WORLD_REQUIREMENT_ADAPTER.2 |
| STATUS | DRAFT |
| LAST_UPDATED | 2026-10-07 |
| UPDATED_BY | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 |
| REVIEWED_BY | PENDING; local focused tests are not registered Reviewer authority |
| SOURCE_COMMIT | 58aa7a9428b31b12ddb8d3c557248d94f5c4f5bb |
| TASK_ID | KAIOS_AI_COMPANY_CUSTOMER_PROJECT_RUNTIME_V2 |
| CHANGE_REASON | Add bounded digital-world requirement drafts while preserving the house and Backend owners. |
| ANCESTOR | KGEN-AI-Company/AI_COMPANY_OPERATING_SYSTEM.md at e26f3a76ef0be7f43058225f46def3fbe123371e; preserved local research lineage 0bbfa5cc5c6f4f391743a50f4b42f208ca397b4e |
| SOURCE_OF_TRUTH | FALSE |

This metadata describes the Customer Project candidate revision only. Existing
owner/document version identities and inherited governance content are preserved.
It does not promote this branch or its local prototype to a production authority.

**Version:** V3.0  
**Status:** Active / Draft for Review  
**Source:** KGEN Organization V2.0, Agent Office, Machine-Readable Canon

## 1. Company Model

KGEN AI Company is a GitHub-native work system. It treats Codex as management and Cursor as employee. The company does not depend on private memory, repeated human prompts, or hidden chat context.

## 2. Management Layer

Codex is the management layer. Codex creates tasks, splits WorkOrders, updates GitHub WorkQueue, reviews Cursor reports, decides whether changes are accepted, commits approved changes, pushes to origin/main, and reports to the user.

## 3. Employee Layer

Cursor is the employee layer. Cursor reads the WorkQueue, accepts one OPEN task, marks it IN_PROGRESS, performs scoped work, writes a report, marks the task REVIEW, and waits for Codex.

## 4. Handoff Layer

GitHub is the only handoff center. The live queue is `KGEN-Organization/WorkOrders/WORK_QUEUE.md`. Cursor reports are stored in `KGEN-AI-Company/reports/`. Codex review records are stored in `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md`.

## 5. Canon Layer

All work must obey Boot V1.4, Runtime CURRENT, Universe Map, AGENTS, `KGEN-Canon/KGEN_CANON_MASTER.json`, Genesis Library, Runtime Library, SDK Library, and Organization V2.0.

## 6. Protected Layer

No AI Company task may modify contracts, $templePath, wallet, bridge, Boot, Runtime CURRENT, final-whitepaper, or KGEN Token contract without explicit human authorization.

## 7. Daily Rhythm

Cursor checks the queue every 10 minutes, writes progress every 2 hours, writes integration status every 10 hours, and writes a daily report every 24 hours. Codex reviews every REVIEW task.

## 8. Customer project research prototype

Task: `KAIOS_AI_COMPANY_CUSTOMER_PROJECT_RUNTIME_V2`.
Source baseline: `b2a349c36d3670327aa419802f6a80a4ed339a4e`.
Status: `LOCAL_TEST_ONLY_NOT_DURABLE`; publication and backend integration remain held.

This additive prototype proves request, versioned simulated quote, explicit
customer acceptance and exactly-once planned-project semantics inside the existing
Company owner. It creates no live customer, formal Company, Life, Worker, Claim,
registry entry, payment, supplier order or completed house. One workspace per
prototype instance is an initial technical test bound, not a permanent product
rule or a cross-process uniqueness guarantee.

### Owner map and preserved history

| Concern | Existing owner and boundary |
| --- | --- |
| Company and customer model | `core/company/index.mjs`; existing `AI_ANT_COMPANY_0001` identity only. |
| Formal identities and assets | `core/life/index.mjs`, `core/assets/index.mjs`, `core/registry/`; read-only references, no mutations. |
| Player and home | `K線西遊記/temples/11520/runtime/player-life-runtime.mjs`; retain home eligibility and local-coordinate semantics. |
| Project simulation | `KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js`; frozen #97 dependency, no edits. |
| Construction and labor | #63 causal runtime, #64 physical-labor/construction contracts; no parallel engine. |
| Supply chain | #65 supply/inventory/finance contracts; planning is not received inventory. |
| Marketplace and delivery | Existing Creator Marketplace and `digital-ant-logistics-runtime.mjs`; no replacement or new dispatch path. |
| Future persistence | Existing `KAIOS/backend/`; no service, database, migration or cloud configuration is changed by this prototype. |

#62/#63/#64/#65/#93/#97/#103/#124/#137/#489 were recovered from actual PR and
source evidence. At the source baseline, the repository canonical records show
one FORMING company and empty real customer/request/quote/order/settlement
collections with zero recorded real revenue. This is repository-record scope,
not a live database or external-business assertion. #182 remains a stale open
Draft; merged #410 requires `KEEP_OPEN_DRAFT_HOLD_WITHOUT_TRANSPLANT`.

### Prototype interfaces and authority

`createCustomerProjectPrototype` accepts code-level trusted host ports. The
identity adapter synchronously captures an active `SIMULATION_CUSTOMER_CONTEXT`
at each command/read invocation. The queued operation remains bound to that
identity and rechecks the current context before replacing state. This adapter
contract is not authentication; an eventual backend must supply its authenticated
Account -> enrolled Player context. No new signup or Life enrollment is needed.

The quote planner is a trusted host function, not command data. It provides a
complete twelve-stage plan, explicit synthetic cost basis, BOM hash, conditions,
assumptions and validity. Its output is copied immediately. HTTP/service exposure
does not exist, and payload-supplied identity, authority, PASS results, pricing
policies and extra fields are rejected.

Commands are limited to `SUBMIT_REQUEST`, `CLARIFY_REQUEST`,
`ISSUE_SIMULATED_QUOTE`, and `ACCEPT_QUOTE`. Reads do not advance work. Every
issued quote hash binds quote ID, revision and complete immutable content.
Issuance time is sampled after asynchronous planning. Acceptance binds the exact
current revision/hash and acknowledgement hash, with explicit accept intent.

Commands are serialized within the prototype instance. Exact-key retries return
the saved result; changed content under that key fails. Another key for the same
accepted semantic intent returns `ALREADY_ACCEPTED`, even with an old expected
revision or after expiry, and adds only a response-journal entry. Different
acknowledgements fail; changed quote/request scope requires a future change-order
feature. No failed command replaces state. This is in-memory behavior, not SQL
atomicity, restart durability, server authentication or cross-device support.

`createFrozenV1CustomerProjectTestAdapter({mode: "LOCAL_TEST_ONLY"})` explicitly
opts into the unchanged V1 library. It creates only a replay-validated planning
snapshot with zero opening cash. The allowed calls submit/analyze/check a fixture
request, prepare a proposal, and, after outer acceptance, approve/create/decompose
the internal V1 plan. It never calls `runDemonstration`, contract/deposit creation,
procurement, assignment, execution, delivery or closeout. V1 fixture worker IDs
remain local simulation data, never formal Life/Worker registrations.

### Small house completion remains held

The outer desired plan has twelve stages: SURVEY, DESIGN, SITE_CLEARING,
EXCAVATION, FOUNDATION, STRUCTURE, ROOF, UTILITIES, INTERIOR, INSPECTION, REWORK,
COMPLETE. V1 supplies seven coordinator tasks and its #63 binding represents the
eight-stage BASIC_HOUSE_FOUNDATION. That evidence cannot complete the full house.
The prototype always returns `PLANNED_EXECUTION_HELD` with
`HOUSE_STAGE_ADAPTER_REQUIRED`; asset, delivery and receipt remain null.

Future completion requires owner-provided time/material/labor/route evidence,
material conservation, nonoverlapping physical assignments, all mandatory stages,
passing inspection and explicit rework decisions. A simulated BUILDING projection
must respect the existing Player home/Asset owners without granting legal title,
changing XP or inventing canonical XYZ. Delivery and customer acceptance are
separate. Only the latter may produce one clearly simulated, nonredeemable receipt.

### Validation and next boundary

Focused tests live in the existing `tests/universal-exchange.test.mjs` under the
`Customer project V2` prefix. They cover missing requirements, immutable revisions,
hash/acknowledgement/expiry checks, exact retry, semantic duplicate acceptance,
conflicts, capacity rollback, identity switches/revocation during queued work,
mutable planner output, delayed issuance and the frozen V1 planning-only boundary.

Run only that name pattern during the current resource hold. Full regression,
browser/visual QA, CI, persistence/recovery and production validation remain
unperformed for this prototype. Runtime UI is unchanged. No commit or publication
is implied by local tests.

Later backend work should use one aggregate/event/idempotency transaction, stable
pre-creation tenant scope, UNIQUE(owner_player_id) for the initial bounded slice,
and expected-version guards. Do not dual-write Company IndexedDB, extend Player
schema 2 with arbitrary project fields or claim Recovery Center support. See the
customer-project appendix in `KAIOS/backend/KAIOS_BACKEND_ARCHITECTURE.md`.

This prototype uses only existing code/test/document paths. Any future new
migration or formal document must receive full-path README/index registration.
Boot CURRENT requires separate scoped authorization; no Boot, V1.4 ancestor,
CURRENT, historical branch or frozen V1 source is changed here.

Design references: [ERPNext Quotation](https://docs.frappe.io/erpnext/quotation),
[Sales Order](https://docs.frappe.io/erpnext/sales-order),
[Work Order](https://docs.frappe.io/erpnext/work-order),
[Quality Inspection](https://docs.frappe.io/erpnext/quality-inspection),
[Workflows](https://docs.frappe.io/erpnext/workflows), and
[AWS idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).
These are process references, not Company pricing, contract or execution authority.

### Local database checkpoint milestone

The next bounded prototype adds `createCustomerProjectPersistencePrototype` in
the existing `KAIOS/backend/src/service.mjs`, explicitly gated by
`mode: "LOCAL_TEST_ONLY"`. It is never connected to `createBackend`, HTTP routes,
signup, local-server startup, production configuration or deployment. The pure
Company model remains `LOCAL_TEST_ONLY_NOT_DURABLE`; its hashed responses remain
unchanged. A separate `LOCAL_DATABASE_SIMULATION_PROTOTYPE` envelope reports a
committed local database checkpoint and its storageVersion.

The schema exists only inside the existing universal-exchange test file. No
applied SQL migration, new migration path, Account/Life onboarding, formal registry
or financial state is changed. SQLite temporary-file tests use preseeded fictional
Account/Player bindings and the existing `DatabaseAdapter.atomic` implementation.

Each checkpoint stores exact command, trusted planner snapshot, clock observations,
response and resulting state hash. Restart reconstructs the pure model by replay;
historical operations never call the live planner/clock. Replay consumption,
operation-to-commandJournal correspondence, table events and idempotency responses
must agree exactly. Inconsistent records fail closed instead of being repaired
with invented fixture state.

The initial local schema enforces one workspace per Player as a technical bound,
explicit `account_lives` ownership, and unique event sequence within each workspace.
Trigger-based storageVersion/payloadHash guards fail the whole transaction on a
race. State, new domain events and response journal commit together. A new-key
ALREADY_ACCEPTED checkpoint advances storageVersion only; its domain revision and
event sequence remain unchanged. Exact retries change neither counter.

Evidence is limited to the local SQLite prototype. Acceptance uses the recorded
trusted service decision time; a subsequent lock wait is not proof of a database
commit before quote expiry. Concurrent duplicate issuance may call the side-effect-free
trusted planner twice, while only one outcome commits. Hash/replay checks detect
inconsistent corruption, not an adversary rewriting the entire database coherently
or restoring an older valid file. D1, production authentication, cross-device UI,
backup/restore and full-house execution remain unverified or unimplemented.

### Quote-bound legacy execution evidence, with house coverage held

The existing `LOCAL_TEST_ONLY` V1 adapter now offers a read-only `auditSubplan`.
Its trusted host `projectSource.read()` must expose the explicitly accepted quote;
this remains a local simulation contract, not authentication. A synthetic resource
fixture is committed in that quote's acknowledged assumptions by SHA-256, while
its material quantities bind the BOM hash. Its opening simulated credit equals
the quoted total, deposit is zero, and all work uses V1's existing fixture workers,
equipment, materials, route timing and accounting. No funding or state is written
to the parent Company model, Backend, Asset, Player, registry or logistics owner.

Small fixtures execute the frozen V1 task DAG with material arrival, reservations,
elapsed work, explicit inspection, defect/rework and reinspection. The audit uses
V1's strict replay, then binds the request (including intended use), quote version,
hash, synthetic resources and inspection measurements. The internal QA inspector
comes from V1's existing synthetic workforce. Default V1 PASS is rejected as
insufficient evidence. The successful late-QA case waits for the next V1 shift
after minimum rest, with the rule both quoted and checked against actual repair
timing. It ends at coordinator `ACCEPTANCE_PENDING`; no customer-delivery acceptance,
revenue recognition, closeout or receipt is performed.

The negative early-SURVEY case remains explicit: after a two-hour repair, V1's
shifted downstream schedule produces `REST_REQUIREMENT_CONFLICT`. The rejected
assignment preserves all task state; the audit reports `REPLAN_REQUIRED`. This is
an unresolved canonical scheduler/replan dependency, not permission to weaken rest
rules. The late-QA case proves only its bounded fixture path.

Neither result completes a twelve-stage house. The seven coordinator tasks omit
mandatory stage evidence. V1's separate eight-stage `BASIC_HOUSE_FOUNDATION` binding
uses its own fixed location and does not consume the quote's house location; those
records cannot be combined into coverage for one accepted house. `FINAL_ACCEPTANCE`
is internal V1 QA, not the customer's delivery acceptance. Audit output therefore
retains `HOUSE_STAGE_ADAPTER_REQUIRED`, `houseComplete:false`, and null asset,
delivery and receipt. Legacy delivery flags about rights/documentation/accounting
remain unverified subplan assertions. New Asset ownership and transport receipts
require their existing owners' separately reviewed evidence contracts.

### Immutable local execution-evidence checkpoint (2026-10-06)

This successor preserves the three original local milestones from `0bbfa5cc`
without replacing Company, Backend, construction, Market or Logistics owners.
It adds only `CHECKPOINT_SUBPLAN_EVIDENCE` to the local prototype. This command
requires an already accepted simulated quote/project, the current aggregate
revision, exact project/acceptance IDs and exact SHA-256 digests for the quoted
resource fixture and V1 export. It does not approve a proposal, accept a new quote,
create an order, advance construction or authorize delivery.

A code-level trusted evidence source supplies the bytes. The command cannot
supply an audit result, PASS, reviewer identity or authority flags. The frozen
existing V1 auditor replays those bytes, checks the accepted quote/customer and
resource/inspection bindings, and produces the evidence. A separate immutable
`executionEvidence` projection binds workspace/customer, project, source revision,
acceptance ID/time, quote ID/revision/hash, input hashes and audit result/hash.
The parent project remains byte-identical: `PLANNED_EXECUTION_HELD`,
`HOUSE_STAGE_ADAPTER_REQUIRED`, `houseComplete:false`, and null asset/delivery/
receipt. V1 `ACCEPTANCE_PENDING` is retained as a coordinator observation only.
`authenticatedWorkerReview:false` explicitly disclaims real reviewer authority.

This slice admits one immutable evidence checkpoint per workspace. Same-key
retries return the exact saved result; changed content under that key fails.
A new key with the current revision and the identical binding returns
`ALREADY_CHECKPOINTED`, recording only the response journal. Stale new-key
revisions and replacement evidence fail closed. That one-checkpoint bound is a
local experiment limit, not a permanent product or customer entitlement.

The Backend helper records complete inputs once and re-audits them on recovery.
Its version-2 journal retains the unchanged version-1 operations and hashes;
version-1-only workspaces remain readable without a schema/table migration.
No live planner, clock or evidence-source call is needed during replay. Missing,
changed or inconsistent inputs/results/cache/event rows block both reads and
retries. The existing 512 KB workspace, 128 event and 256 operation bounds remain
unchanged; an oversized experiment is rejected rather than split into another
store. No runtime-facing route or production caller is added.

This is local SQLite evidence persistence, separate from the unchanged pure
model's `durable:false`. It is not authenticated production storage, cloud/D1
verification, power-loss durability, backup restore, Recovery Center support or
full-house completion. Full-house stages, source-authorized final inspection,
Asset/Player projections, transport and customer delivery acceptance remain held.
The file/process recovery proof applies to the tested installed auditor/runtime
revision only. Result/state hashes reject changed replay outcomes but do not
authenticate code provenance or detect source changes with identical outcomes.
Cross-version auditor retention/admission and migration remain future work.

### Remaining house-to-receipt boundary

The next release cannot promote this V1 subplan merely because replay succeeds.
A reviewed implementation in the existing construction ownership boundary must
supply all twelve stages at the accepted location, including material/energy/
water conservation, actual simulated work time, worker/equipment non-overlap,
route arrival and rest constraints. The separate fixed-location foundation
fixture must not be unioned into coverage. Inspection must bind the current build
revision and actual measured observations; a caller-supplied PASS or reviewer name
is not evidence. An explicit no-rework decision or completed rework/reinspection
must resolve every blocking defect without skipping the REWORK gate.

Only that complete owner evidence may enable an immutable simulation-only
BUILDING projection referencing the existing Asset/Player owners. No Registry
insertion, home eligibility, XP, legal title or Universe-coordinate authority is
implied. A delivery record must bind the precise build/asset/inspection revision
and existing Logistics evidence where transport is required. Delivery changes
only to customer-acceptance pending. The same customer must explicitly accept
that exact delivery revision; rejection preserves the delivery and opens rework.
The final acceptance and one nonredeemable simulation receipt belong in one
Backend aggregate/event/idempotency transaction. No V1 `acceptProject` call is
used as a shortcut: its revenue-recognition side effect is outside this slice.


## Local revision history / release record

This cumulative record covers all seven paths in [Draft #520](https://github.com/klineodyssey/kline-odyssey/pull/520),
including the earlier request/quote acceptance, SQLite persistence, frozen V1
subplan audit, immutable evidence checkpoint and ordinary-CI Node 24 milestones.
It does not declare a new semantic release. Company uses its stable CURRENT
rolling source entry; this document remains V3.0 and Backend remains V1.

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | Company CURRENT / document V3.0 / Backend V1; 2026-10-06.CUSTOMER_PROJECT_LOCAL_EVIDENCE_METADATA.1 | KAIOS_AI_COMPANY_CUSTOMER_PROJECT_RUNTIME_V2 | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 | dot, scoped source review and metadata-scope approval only; no registered Reviewer role or authority grant | `core/company/index.mjs`; `KAIOS/backend/src/service.mjs`; `KGEN-AI-Company/AI_COMPANY_OPERATING_SYSTEM.md`; `KAIOS/backend/KAIOS_BACKEND_ARCHITECTURE.md`; `tests/universal-exchange.test.mjs`; `tests/universal-exchange-workflow-security.test.mjs`; `.github/workflows/universal_exchange_v2.yml` | Record all reviewed local Customer milestones and their revision/provenance; this successor adds only headers and release documentation. | No executable, production migration, route, trigger, permission, or journal-schema change in this metadata successor. Existing v2 helper reads v1 and v2 local journals. | Revert only this metadata successor to recover the reviewed d2d6c892 source bytes. Functional rollback needs separate review: a v1-only helper cannot read a v2 evidence journal; preserve the DB and evidence, do not reset or delete data. |

The source-review record is scoped engineering review, not admission of dot as a
registered Worker or Reviewer. Metadata-scope approval does not manufacture a
new exact-head validation result. The existing CI, local SQLite/process-reopen
proof and ten Recovery Center screenshots remain bound to source
`d2d6c892a9e2c1870638107f9193b3ff0a9c0e7f`, tree
`492e9041fc2d658ac835ec33fe0fe6b15c771339`; they are not relabeled for this successor.
The comment-stripped executable-byte comparison and any subsequent review must
identify their own source tree. No new CI, publication, merge or deployment is
implied by this release record.

## Digital-world requirement draft checkpoint (2026-10-07)

The next bounded Customer V2 increment reuses `core/company/index.mjs` and the
existing `tests/universal-exchange.test.mjs`. It adds no file, route, database,
Company, Registry, Life, logistics engine or resource simulator. The preserved
#520 source is `e95ae3a0e4c772af50644bf628e15801de65b97e`; current-main inspection
found `f7f67950418ebbb6f7a5a309a32d529232fcb3b6` with no overlap in these owners.
The new continuation must retain #520 as its parent, not replace its checkpoint.

`createDigitalWorldCustomerRequirementDraft({text, objective, requirements})` is
a pure draft schema and completeness check. Its output always names
`KAIOS_DIGITAL_WORLD`, is non-durable, and has no real-world construction effect.
The explicitly selected objective is initially `SMALL_HOUSE`,
`FISH_POND_ECOSYSTEM`, or null while clarification is pending. House/fishpond
keyword matches are suggestions only, including ambiguous or negated sentences;
they never select an objective, invent critical parameters, submit a request,
accept a quote, create an order, or authorize work. Other objectives remain
unsupported instead of being silently mapped to either template. This is the
first schema/fixture checkpoint, not a completed general-language parser.

Shared requirements cover location, rights, quality, quantity, simulated budget,
deadline, intended use, acceptance criteria and maintenance. The Fish Pond
extension requires explicit references for pond design, species, water source,
oxygen, temperature, pH, feed, plants, microorganisms, waste, risk, density,
growth, harvest, logistics and DigitalLife policy. Missing references remain
individually visible. Supplied references are proposed requirements, not proof
that resources, rights, entities, compatible ecology or adapters exist. No pH,
oxygen, stocking-density, growth or health threshold is invented here.

A structurally complete draft becomes `READY_FOR_OWNER_FEASIBILITY_REVIEW`,
while feasibility remains `NOT_EVALUATED` and execution remains `HELD`. Its
SHA-256 binds the full draft. The existing AI Company V1 remains project/DAG/
inspection/delivery owner; existing Aquaculture V1 remains the 17-stage pond,
water, feed, oxygen, growth, harvest and conservation owner. Asset/Life and
Logistics references are not registrations or dispatch. Plant/microorganism
coverage must be audited in the ecology owner before any integrated execution
claim. The existing HOUSE command model, accepted snapshots and Backend local
v1/v2 journals remain unchanged. No draft is automatically fed into them.

Local validation: 23/23 selected tests passed under Node 24.19.0, comprising
18 preserved `Customer project V2` cases and five `Digital world` cases. The
latter cover ambiguity, all sixteen missing ecosystem fields, deterministic
hashing, copied input, explicit bounds/units, payload-authority rejection,
no fabricated feasibility/assets/acceptance/revenue, and unchanged house quote
acceptance behavior. Syntax checks passed. Earlier incomplete-materialization
module-load failures were resolved before this final selected run. Full CI,
Backend regression, UI/browser QA and generalized persistence are not claimed.

Next bounded work is a read-only owner-mapping/feasibility adapter, then a
revision-bound simulated quote mapping, explicit same-customer acceptance,
resource/time-conserving task execution, inspection/rework, delivery acceptance
and one nonredeemable simulated receipt. Existing local Backend atomic journal
is reused only after deterministic replay compatibility is tested. Neither
#520's seven-task V1 house audit nor this requirement draft completes a house
or pond. No merge, deployment, real procurement, payment or payroll occurs.

Release record: Company CURRENT / document V3.0, revision
`2026-10-07.CUSTOMER_DIGITAL_WORLD_REQUIREMENT_DRAFT.1`; task
`KAIOS_AI_COMPANY_CUSTOMER_PROJECT_RUNTIME_V2`; actor dot under Human continuous
engineering authorization 2026-10-07; review pending. Files are the existing
Company runtime, Company operating-system document and Universal test file.
Rollback removes only this additive draft function/constants/tests and restores
the prior metadata. No saved project or database is reset or migrated.

### Bound Fish Pond configuration adapter checkpoint

`createFrozenFishpondRequirementTestAdapter({mode: "LOCAL_TEST_ONLY"})` now
resolves a complete digital Pond draft and its configuration fixture through
code-level read ports. Both exact SHA-256 bindings are supplied, the draft is
re-derived, all policy references must match, and the site must match the draft's
location and simulated usage-right reference. The adapter rejects extra fields
and privileged pond overrides, including completion/status, installed facilities
or prefilled water. Finite dimensions must have physically consistent capacity
(`capacity_l <= area_m2 * depth_m * 1000`); all numbers remain digital fixtures.

Only the installed Aquaculture V1 `selectLand` and `designPond` methods run in a
disposable paused instance. A temporary SELECT_LAND failure against the old
default pond size is not final evidence; the result is read after both requested
site and pond design are installed. The adapter reads all whitelisted values
back, asserts zero time, stages, populations, orders, delivery, ledger and
revenue changes, rechecks the draft source, and destroys the instance. It never
starts construction, stocks fish, applies a policy, calls `advanceDelivery`, or
invokes the legacy buyer auto-acceptance/revenue pathway. Frozen owners remain
byte-identical. No general callback/runtime factory or replacement physics is
accepted.

Even a successful configuration returns
`OWNER_CONFIGURATION_INSPECTED_EXECUTION_HELD`. It exposes site blockers from
the existing owner plus an explicit missing-electricity hold. Seeded cash,
materials, water, workers and equipment are not customer-provided evidence.
Resource provenance, labor location/travel/rest, water/policy binding, plant
population integration, microorganism proxy limits, build inspection/rework
and explicit delivery acceptance remain holds. Opaque requested references are
not silently treated as applied numerical settings or verified resources.
A policy-rich request therefore cannot become an accepted feasibility result.

Five new focused cases cover exact configuration/hash readback, site and power
blockers, stale draft/fixture/policy/location rejection, completion/resource
injection, impossible geometry, and source changes. The selected combined run
passed 28/28 with zero failures/skips on Node 24.19.0, including all 18 preserved
house-command cases and the five earlier draft cases. Syntax/whitespace checks
passed. The original HOUSE command/audit implementation after its shared helper
boundary is byte-identical to #520. No browser/UI claim is made.

Revision `2026-10-07.CUSTOMER_DIGITAL_WORLD_REQUIREMENT_ADAPTER.2` is a successor
to `58aa7a9428b31b12ddb8d3c557248d94f5c4f5bb`, within the same three existing
Company code/test/document paths. Review is pending. Rollback removes this
additive inspection adapter and tests only; stored #520 journals are unaffected.

An expanded 54/54 bounded run also passed in 26.0 seconds: preserved Customer
V2 commands, frozen V1 subplan audits, 19 local SQLite recovery/concurrency/
transaction cases, and the ten new draft/adapter cases. This includes fresh-OS-
process recovery of the existing accepted-house journal; it does not persist the
new draft or configuration report. Groups overlap and are not additive.

Two additional focused cases verify unchanged owner file bytes, no fetch or
browser-storage capability use, the adapter's inspect-only surface, malformed
numbers, overflowed geometric capacity and excess authority/policy fields. The
final selected command/requirements/adapter run is 30/30 with zero failures or
skips; this supersedes only the narrower 28-case run, not historical CI.
