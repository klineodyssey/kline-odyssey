# KGEN AI Company Operating System

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
