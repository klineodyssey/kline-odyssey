# K11520 Player Life — canonical local domain

STATUS: IMPLEMENTATION_CANDIDATE
VERSION: 2.8.0
OWNER: codex-gm-01
SOURCE: Human KAIOS V2.8 PLAYER LIFE SYSTEM work order, 2026-10-01
BASE: 37269353e4e1677b287c4419d1bcf9faf9ff47e4
SCOPE: LOCAL_GAME_CANDIDATE / NO_CHAIN_AUTHORITY

## Authority and reuse

Player Life is a game identity, not an EVM account, employee Life, NFT or title.
The domain owns profile, appearance, progression, local home, inventory and
journey records. Provider-specific authentication and storage are adapters.
`runtime/player-life-runtime.mjs` under `K線西遊記/temples/11520/` is its single
versionless schema/transition/store authority. Its cloud interface stays
NOT_CONFIGURED; no Firebase/Supabase/Cloudflare account or dependency is required.
The existing `evm-wallet-runtime.mjs`, backpack, tutorial and settlement organs
remain their respective owners; this is not a second trading or reward ledger.

The older `docs/constitution/09_Player_Genesis.md` is a design candidate for
server-authoritative genesis. Human's 2026-10-01 decision authorizes guest-first
local game plots without email, wallet, GPS or real birthday. It does not grant
real ownership, server authority or economic value to client-created records.

## Identity and privacy contract

- Random, crypto-generated `KAIOS-P-...` identity, independent of wallet addresses.
  It persists on this browser while storage remains available. Clearing browser
  data loses local records unless a player retained a backup. A random identifier
  is not a login secret, authorization capability or global uniqueness registry.
- One player may deliberately link multiple EVM wallets by an explicit wallet
  signature challenge bound to player, domain, chain, nonce and expiry. Merely
  connecting a wallet or changing accounts never creates verified ownership.
- Account changes switch the existing wallet-specific simulation view within
  the same Player ID, not the character, home or inventory. A deliberate local
  player change saves and reloads all runtime owners; no cross-player caches.
- Shared-device local profiles are not confidential against another person with
  device access, browser DevTools or XSS. Future cloud authentication must enforce
  server ACL/RLS, ownership constraints and revocable sessions on every request.
- Real birthday, birthplace, gender, location history and private credentials
  are not required. Optional pronoun/appearance is a character choice. Reality
  journey consent is disabled initially, revocable, and grants no browser sensor
  permission in this phase. No GPS/motion prompt or raw track collection occurs.

## Schema and consistency

Canonical record: playerId, displayName, createdAt, lastSeenAt,
characterAppearance, optional pronoun/ageRange, homeWorld, homePlotId,
level/xp, engineLevel/engineXp, inventory, achievements, journeyProgress,
lastWorld/lastXYZ, walletLinks, settings, privacyConsent.
Home: homePlotId, worldId, ownerPlayerId, xyz, plotLevel, houseLevel.
Executable validation is exported by the domain; profile patching cannot set
XP, levels, reward totals, foreign ownership or binding evidence.

Local events are bounded and deduplicated. Levels derive from XP rather than
accepting a caller's arbitrary level. House stages are a data table (empty,
hut, house, cave, warehouse, shop, ATM, portal) and not contracts or NFT tiers.
Future service buildings are game stages, not permission to move any asset.
The inventory field references `SCOPED_BACKPACK` plus ownerPlayerId; captured
items are not duplicated into a second Player Life ledger. A bounded, once-only
legacy guest XP/engine-XP baseline is explicitly unverified local migration.

The local envelope uses a revision guard to reject stale-tab writes and one
serialized save per domain transition. Invalid/corrupt saves are preserved,
not silently overwritten as valid. Storage failures keep gameplay in a clearly
labelled memory-only session; persistence must not be claimed in that state.
Schema validation catches malformed/tampered structures and inconsistent state,
but a device owner can forge a consistent local history. It is never economic
proof or a substitute for a server signature/receipt.

## Migration and backup

One migration claimant may copy preserved V2.7 guest XYZ/tutorial/backpack and
guest simulation data into its player namespace. Originals are retained.
No address string imports another old wallet ledger or links a wallet.
Other new players get empty separate records. Account-specific economic data
remains in the existing ledger, additionally namespaced by Player ID.

Export/import is an explicitly untrusted local game backup, not cloud login.
The UI bundle includes the validated existing backpack beside the profile;
import rejects mismatched ownership, duplicate identities and malformed items.
The domain save and companion backpack save are separate local writes. A quota
failure between them is explicitly IMPORT_INCOMPLETE_STORAGE_FAILURE, not a
successful restore; retain the source backup and reload/recover storage.
Wallet ownership proofs, real holdings, trading ledger and payable claimable
are excluded. Imported records cannot authorize KGEN/KAIOS, and wallet links
must be freshly proven. Same-device import must not clone a reward/plot grant.
Automatic cross-device restore requires a future selected/authenticated cloud;
the local adapter can only restore a user-carried valid local backup.

## Cloud decision (research only; checked 2026-10-01)

| Area | Firebase / Google Cloud | Supabase / PostgreSQL | Cloudflare |
|---|---|---|---|
| Authentication | Firebase Auth; strong mobile SDKs | Auth + Postgres RLS | Application-managed consumer auth or chosen identity provider |
| Database / realtime | Firestore documents/listeners | SQL, transactions, constraints, Realtime | D1 SQLite plus custom Durable Object WebSockets |
| Offline | Native/Web SDK sync; web opt-in, last-write-wins conflicts | Application outbox/cache/conflict policy needed | Application outbox/cache/conflict policy needed |
| Backup | Firestore backup/PITR requires billing | Free manual offsite backup; Pro daily7days; blobs separate | D1 Time Travel free7days / paid30days; export separately |
| Free tier | Firestore1GiB,50kreads/day,20kwrites/day,10GiB/month egress | 500MB DB,50kMAU,1GB storage,2M realtime messages,200 connections | D1 5M rows read/day,100k rows written/day,5GB |
| Paid baseline | Usage-priced Blaze; not approved | Pro fromUS$25/month plus usage; not approved | Workers paid fromUS$5/month plus usage; not approved |
| Web/PWA/mobile | Web, Android, Apple SDKs | Web/mobile SDKs and HTTP | Web/HTTP; native app integration must be built |
| Security / migration | Rules/server validation; document/rule portability work | RLS + server functions; SQL/data portability strongest here | Worker auth/ownership validation; SQLite portable, DO state logic less portable |

Recommendation: evaluate Supabase/Postgres first for future authenticated
ownership, unique wallet links and transactional game events. This is an
engineering recommendation, not a vendor selection or spending approval.
Firebase is attractive for rapid offline/native integration; Cloudflare for
edge deployment when the team can own auth and synchronization. None of these
make offline client XP or financial claims authoritative automatically.
Free quotas are not a capacity guarantee; estimate MAU, traffic, storage,
backups and realtime before selecting a plan. Cost overruns, privacy/data
location and restore drills require a separate Human-approved deployment plan.

Official sources:
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/firestore/manage-data/enable-offline
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/self-hosting/restore-from-platform
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

## V2.9 gameplay-first extension (2026-10-01)

The existing `runtime/player-life-runtime.mjs` remains the sole XP/level
projection. Old V2.8 event weights, schema and level formulas are unchanged.
`recordEvents` commits a bounded batch atomically; replay or storage failure
cannot save only half of a kill/loot XP batch. This remains untrusted local
candidate data, not authentication, economic authority or proof of play.

- `GAMEPLAY_UNLOCKS`: Slash at Lv1; Golden Rain Lv2; Phantom Axe/stronger
  monsters Lv3; Boss Lv5; synthetic market training Lv5/Engine2; rare
  encounters/loot Lv6/Engine2. Home stages retain their existing rules.
- `JOURNEY_MONSTER_KILL`: 10 player XP / 4 engine XP; `BOSS_DEFEAT`: 50/30;
  six-phase practice: 5/8 once per encounter; quest: 15/12 once per allowed ID.
  Existing loot event remains 5/0. Values live in one configuration table.
- Daily Journey uses UTC local-candidate time: 3 kills, one signed-phase hit,
  50m actual accumulated movement. Ten bounded 5m samples/day; no GPS or
  teleport credit. Claim grants 25/20 plus a game item, once per day. Clock
  and local storage are not a server-authenticated anti-cheat authority.
- The existing Player Life sheet contains PLAYER and GA600 XP, content
  unlocks, daily progress, encounter selection and existing inventory/home.
  No second persistent HUD card, inventory or settlement ledger is added.
- `runtime/world-runtime.mjs` owns encounter profiles, six body phases,
  Boss rage/low-HP/strikes and deterministic local item rarity. It reads
  unlocks from Player Life, never produces an independent XP balance.
- Existing backpack owns game items and bounded consumed reward identifiers;
  stacking/discarding must not make a consumed reward redeemable again.
  XP and backpack are separate local stores, not one economic transaction.
  Capacity or storage failure is reported, never called chain settlement.
- `assets/kaios-audio.mjs` owns dynamic music states, original synth event
  identities and ducking. One scheduler/context; mute, visibility and #461
  gesture-recovery semantics remain. Bounded visual cues complement sound.

### GA600 inventory and boundary

Repository inventory found conceptual lineage in
`K線西遊記/temples/16888/README.md`,
`K線西遊記/temples/11520/RUNTIME_GENOME.json`, and legacy whitepapers
`whitepaper/KGEN_主白皮書_Genesis_v1.0.md`,
`whitepaper/KGEN_系統框架白皮書_v1.0.md`,
`whitepaper/KlineApp_KGEN_募資白皮書_5000萬正式版.md`.
These are not a verified full engine or historical dataset adapter.
`GA600_FULL_ENGINE = NOT_INTEGRATED`.
Trend/Crash/Range Boss use explicitly synthetic regime game profiles;
they are not historical returns, forecasts, fund performance or advice.
Game/Engine levels never alter C production caps, real funds, Oracle policy,
treasury, signer authority or automatic trading. Production >1C remains locked.

## Delivery / second-layer review

Required: domain/security tests, preserved settlement tests, actual Chromium
390x844/844x390, direct screenshot inspection, all responsive profiles and
exact-head Game/Responsive/Universal CI. Include guest/reload/offline/corrupt
storage/two players/home/XP/wallet proofs/account switch/export-import.
GM provides PR/head/evidence to Human for ChatGPT second-layer review; it must
not claim that second review already occurred. No automatic cross-thread
message, cloud purchase, Mainnet write or KAIOS payout is part of this release.

## Atomic local authority successor: inert Stage1 (2026-10-05)

STATUS: MEDIUM_RISK_DRAFT / UNINTEGRATED_LIFE_ONLY / P0_ACCEPTANCE_INCOMPLETE
BASE_MAIN: b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720
SOURCE_PR: #506
SOURCE_HEAD: 8db98fb9d50828e9024daa2d811498c4e05201dd
REASON: Broaden reviewed local-store protection to the requested canonical Player
Life boundary; preserve the cooperative-lock prototype and its evidence unchanged.

This clean-main successor is not stacked on explanation-only #505 and does not
copy its UI/version changes. Stage1 adds an inert primitive inside the existing
player-life-runtime.mjs and tests inside the existing Player Life suite. No
production caller uses it. Existing game persistence remains unchanged. It does
not authorize real-user migration, release, backend provisioning, or chain action.

### Canonical replacement design and current limits

The intended reviewed endpoint is one IndexedDB write authority for existing Life,
backpack, local simulation product and Courier records, including session/tutorial
inputs that can flow back into Life. Their domain owners remain canonical. There
will be no parallel authoritative ledger, dual-writing, or post-cutover fallback
to legacy localStorage. The current Stage1 supports only PLAYER_LIFE; other domains
fail DOMAIN_NOT_IMPLEMENTED. Its marker explicitly records coverage PLAYER_LIFE
and integration UNINTEGRATED_DRAFT. A full-system integrator must reject this
partial marker as incomplete, never infer completed migration from its existence.

The constructor/import are inert. Explicit open creates structural schema only.
Explicit initialize or confirmed migration is separate. Commands carry complete
authority epoch, shared-selection epoch and expected Life revision; stale commands
conflict rather than silently rebase. Existing Life validation applies to every
loaded/drafted envelope. The adapter owns monotonic revisions and selection epoch;
ordinary commands cannot modify another player, registry, selection or consumed
event/nonce history. Snapshot clones do not expose stored state.

One readwrite transaction coordinates the records. Success is acknowledged only
on transaction completion, never on an individual put. Exceptions/validation and
request failures abort the transaction. Reducers are trusted existing domain-transition
code, not user patches; structural validation does not replace import/profile/wallet-proof
policy. Stage2 must retain those original exclusions. Reducers are synchronous and
cannot receive IDB handles or replace validation. Closure/versionchange fences pending admission.
A retained initialization sentinel and archive identity distinguish missing canonical
records from a genuinely empty database. Whole-origin deletion cannot be detected
from erased local evidence. Missing/corrupt canonical data stays blocked. Unsupported/open failures never
delete the database or initialize a fallback identity.

Prepared migration candidates preserve exact raw Life source, SHA-256, source key
and validated owner/selection summary. Immutable candidate and protection identities
use add, not overwrite. Observed legacy source divergence holds the commit; originals
remain untouched. This source recheck cannot prove an atomic multi-key legacy
snapshot. The eventual full migration requires an explicit preserved candidate and
cross-domain validation. Restore currently fails RESTORE_NOT_IMPLEMENTED: replay
retention and atomic cross-domain restore must be reviewed before it is enabled.
Sanitized user/cloud exports have not changed.

### Evidence and remaining gates

Regression-first tests use fake-indexeddb 6.2.5, Apache-2.0, from its
[official repository](https://github.com/dumbmatter/fakeIndexedDB) and the npm registry.
Recorded npm integrity is
`sha512-CGnyrvbhPlWYMngksqrSSUT1BAVP49dZocrHuK0SvtR0D5TMs5wP0o3j7jexDJW01KSadjBp1M/71o/KR3nD1w==`.
Both existing Product and Backend Node steps install this exact test-only version
with scripts disabled. No jobs, triggers, permission scope or timeout budgets are
added. This adds one small package install per affected existing invocation.
Missing dependencies fail; tests are not silently skipped. In-memory results are
not native concurrency, disk durability, browser restart, or old-client proof.

The browser platform explicitly provides no localStorage locking assumption;
Web Locks coordinate participating scripts. IndexedDB supplies atomic transactions
with overlapping readwrite serialization. Strict durability remains a browser hint,
not a guarantee against device loss. Sources: [Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html),
[Web Locks](https://www.w3.org/TR/web-locks/),
[IndexedDB transaction model](https://www.w3.org/TR/IndexedDB/#transaction-concept).

Stage2 must route every writer/read projection through the replacement authority,
retain receipt tombstones, implement safe restore, and preserve real-wallet behavior.
Required native proof includes N/N conflict/reload/retry, exact pinned-old Life,
backpack/product/Courier/session/tutorial interference after cutover, migration and
restore interruption, real persistent-profile restart, schema/corruption/quota,
selection/Life isolation, and actual production conflict/recovery feedback. Missing
BFCache evidence remains explicit. Separate direct visual QA is required.

FINAL: Life-only authority primitive; production persistence unchanged;
Player Life/backpack/product/Courier cutover and P0 acceptance incomplete.

```json
{"WORK_ID":"DOT-PLAYER-LIFE-ATOMIC-20261005","TRACK":"A_LOCAL_SAVE_INTEGRITY","RISK":"MEDIUM","BASE_MAIN":"b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720","SOURCE_PR":506,"SOURCE_HEAD":"8db98fb9d50828e9024daa2d811498c4e05201dd","STAGE":"LIFE_ONLY_AUTHORITY_PRIMITIVE","INTEGRATION":"UNINTEGRATED_DRAFT","SUPPORTED_DOMAINS":["PLAYER_LIFE"],"OTHER_DOMAINS":"DOMAIN_NOT_IMPLEMENTED","RESTORE":"NOT_IMPLEMENTED","PRODUCTION_CALLERS":0,"PLAYER_LIFE_P0_ACCEPTANCE":"INCOMPLETE","NATIVE_QA":"NOT_RUN","SELF_MERGE":false}
```

### Stage2A1: inert strict domain validators

Additive validation APIs now reside in the existing pure owners:

- `backpack-runtime.mjs`: `validateCanonicalBackpack` checks exact Player owner,
  capacities, items/living identities and retained reward receipts. It does not
  call the separate legacy `restoreBackpack` normalizer.
- `kgen-margin-runtime.mjs`: `validateLocalSimulationProductRecord` checks only
  LOCAL_SIMULATION_PRODUCT persistence, including existing simulation engine
  records, namespace and receipt relationships. Existing formulas, settlement,
  real-wallet behavior and evm product-transition ownership are unchanged.
- `digital-ant-logistics-runtime.mjs`: `validateCanonicalCourierEnvelope` checks
  stored mission/index/owner/clock/insurance/receipt consistency and the existing
  economics/cooldown/terminal-raid derivations, without altering those reducers.

These functions return the original valid object or throw. They neither coerce nor
insert defaults, change timestamps, generate identifiers, discard extensions,
read storage, or write data. Non-JSON values, accessors, hidden/symbol fields and
sparse arrays are rejected without calling property getters. Canonical receipt
spelling is exact; historical noncanonical spelling needs explicit, raw-preserving
migration review rather than silent normalization.

Historical terminal missions and receipt IDs without binding metadata are not
proof of credit. The future authority wrapper must record migration-derived
LEGACY_UNBOUND identifiers immutably and forbid downgrading an existing bound
receipt by deleting metadata. It must compare product/Courier records in the same
transaction. Neither validator success, DELIVERED nor PAID alone authorizes credit.
No historical reward, missing binding or backpay is inferred here.

Stage2A1 does not import these modules into the authority and adds no production
callers. Therefore the Stage1 coverage marker still supports only PLAYER_LIFE;
other domains remain DOMAIN_NOT_IMPLEMENTED and restore remains unavailable.
Future loading must be explicit and use a fixed registry. Static new imports from
Player Life would break Recovery Center's current two-file asset allowlist; its
exact pure dependency graph must be tested and added separately before integration.

Focused tests validate genuine existing reducer output, malformed records and
frozen byte-preservation. Pending-credit fixtures are explicitly labeled shapes,
not evidence that pending integration exists on this successor. Atomic multi-domain
commands, immutable binding transitions, complete migration/cutover, asynchronous
production integration, native old-client and browser-restart acceptance remain
INCOMPLETE. The session/tutorial and pending-insurance-payment legacy keys must
not become automatic post-cutover state inputs.

### Follow-up strict Life input admission

The inert primitive now checks original JSON data before cloning initialization
or command inputs, and checks reducer drafts before equality/serialization.
Descriptor-based admission rejects values JSON would drop or transform, including
undefined/function/symbol/hidden fields, accessors, sparse arrays and non-finite
numbers. It does not invoke getters. The existing envelope/schema validation then
runs against the original validated data before making a detached draft.

Regressions confirm rejected initialization creates no authority/archive and
rejected commands do not advance revision or change bytes. This is strict
admission hardening in an unintegrated API, not a production incident, a new CAS
claim or completion of the multi-domain P0 gate.

### Stage2A2: unintegrated full-record transaction mechanics

This checkpoint adds `openGame`, `readGame` and `commandGame` to the same inert
`createLocalGameAuthority` adapter. It is a storage-mechanics prototype, not a
complete game-command authority or a production cutover. There are still zero
production callers. No public method initializes, migrates, restores or promotes
full-mode records. Tests seed only isolated fake-IndexedDB fixtures directly.
Importing or constructing the adapter opens no database, reads no legacy storage,
and changes no live writer.

`openGame` explicitly loads a fixed lazy registry of the three existing pure
domain validators before starting transactions. This preserves the current
Recovery Center's Life-only loading path; its two-file asset allowlist is not
expanded here. `openGame` alone creates no authority marker. Life-only and full
APIs reject the other mode's marker, and no partial marker is silently upgraded.

Full mode requires `KAIOS_LOCAL_GAME_FULL_DRAFT_V1`, `UNINTEGRATED_DRAFT`, and exact
coverage of PLAYER_LIFE, BACKPACK, PRODUCT and COURIER. One object store remains the
transaction boundary. A typed fixed catalog identifies the existing Life
envelope, per-Life backpack, per-Life/owner local product envelope and shared
Courier envelope. Product means local simulation persistence, not chain balances,
margin authority or a second ledger. Every Life must have declared backpack and
guest-product entries. A declaration of ABSENT has revision null and no physical
row; this differs from a missing PRESENT row, an omitted caller expectation or an
undeclared physical row, all of which fail closed. This prototype cannot create
or mutate ABSENT rows, add players, add namespaces, or change the catalog.

Every read validates the complete catalog, physical-key census, original JSON,
existing domain schemas, exact owner namespaces and cross-domain receipt links.
It rejects data that JSON would coerce or omit without calling accessors. Catalog
size is bounded to 128 entries and the aggregate metadata/domain JSON to 8,000,000
characters; the stricter existing per-domain limits also apply. Valid unknown
extension fields survive. Corrupt or oversized data is not repaired or overwritten.

Every command supplies the authority epoch, shared selection epoch, catalog
revision and all catalog references/revisions, including explicit null entries.
The complete vector is checked inside the same native readwrite transaction that
reloads, validates, creates detached drafts, validates the result and persists all
changed records. The adapter owns revision increments; each changed record moves
forward once, unchanged records are not rewritten. A no-op writes nothing.
Selection uses a dedicated SWITCH command and increments its shared epoch only
when the active Life changes. Stale contexts must reload and explicitly retry;
there is no automatic stale replay. Any request failure or abort rejects the whole
operation. An acknowledgement is returned only from transaction completion, and
closing/versionchange invalidates pending operations. Fake-IndexedDB proves only
the modeled mechanics; native browser lifecycle and durability remain unverified.

The synchronous internal reducer receives only detached domain payloads. It
cannot change catalog metadata, revisions, other Lives/owners or undeclared
mission participants. Async/thenable and reentrant reducers fail. The admitted
prototype kinds are PLAYER_UPDATE, INVENTORY_UPDATE, PRODUCT_UPDATE,
OWN_COURIER_TRANSACTION and SWITCH. These are not public gameplay intents: most
gameplay semantics still need their existing trusted reducer wrappers and typed
commands before integration. Arbitrary external callers must not receive this
mechanical mutation API. No network waits or external effects belong inside it.

Consumed Life events/nonces, backpack reward IDs, product receipt indexes/bindings
and simulation order/position/receipt identities are retained. Simulation history
cannot be reset, terminal records cannot be rewritten and observations cannot
roll back. Product cumulative counters cannot decrease. Existing bound receipts
cannot lose or alter their binding. Legacy unbound receipt/terminal-mission
classifications must match immutable `legacyUnbound` metadata; missing bindings
do not create new legacy provenance and never authorize inferred backpayment.

OWN_COURIER_TRANSACTION is limited to a named mission belonging to the selected
Life and selected product owner. It cannot create missions, activate quoted
insurance, raid, claim cross-Life loot, change custody of terminal missions or
recover CLOCK_REVIEW. DELIVERED/FAILED missions are immutable; ROBBED permits only
its already-approved insurance progression. Premium activation remains explicitly
held until a typed atomic debit command is reviewed.

New confirmed credits require both the canonical mission link and the exact
existing local product delta in the same commit. The pure
`validateLocalCourierCreditTransition` API in `kgen-margin-runtime.mjs` verifies
receipt, namespace, purpose and amount, delivery XP/event updates, insurance event
updates and wallet-owner claimable changes under the existing rules. It rejects
metadata-only acknowledgements, unrelated balance/history changes, legacy
backpayment and duplicate credit. Its revision argument is supplied only by the
adapter from the actual changed-record set; the validator alone is not a write
guard. An already-bound credit permits confirmation with unchanged product bytes
and revision. This checkpoint does not import the frozen clock-recovery candidate.

Targeted regression coverage includes complete-vector N/N conflict, non-target
staleness, explicit reload, absence/census corruption, scope isolation, shared
selection, abort after one product request, exact delivery/insurance credit plus
acknowledgement, confirm-only, immutable history/provenance, premium HOLD and
coerced-ID rejection. These use fake-indexeddb 6.2.5 and synthetic data only.
Native multi-tab, persistent-browser restart, quota/disk failure, BFCache, exact
old-client interference, full raw-preserving migration/backup/restore, typed
custody/world-effect replay and production conflict/recovery UI are still gates.
No current browser result establishes the user's whole-Player-Life P0 acceptance.

The published Stage1 head's shared Product QA baseline has failures in unchanged
browser harnesses. Preserve that evidence and resolve the shared baseline before
another queued heavy run; small in-memory checks do not replace it.

```json
{"STAGE":"FULL_RECORD_STORAGE_MECHANICS_PROTOTYPE","INTEGRATION":"UNINTEGRATED_DRAFT","SOURCE_PR":508,"PRODUCTION_CALLERS":0,"FULL_MARKER_PUBLIC_INITIALIZER":false,"PARTIAL_MARKER_AUTO_UPGRADE":false,"FULL_MIGRATION":"NOT_IMPLEMENTED","RESTORE":"NOT_IMPLEMENTED","PREMIUM_ACTIVATION":"TYPED_ATOMIC_DEBIT_REQUIRED","CROSS_LIFE_CUSTODY":"NOT_IMPLEMENTED","MODEL_TEST_ENGINE":"fake-indexeddb@6.2.5","NATIVE_FULL_MODE_QA":"NOT_RUN","HEAVY_ACCEPTANCE":"BLOCKED_SHARED_QA_BASELINE","PLAYER_LIFE_P0_ACCEPTANCE":"INCOMPLETE","SELF_MERGE":false}
```

### Versioned lossless migration-source digest

New Life-only candidates record `hashEncoding: JSON_SOURCE_STRING_V1`. The digest
is SHA-256 over UTF-8 encoding of the deterministic JSON representation
`JSON.stringify({present:true,raw})`, where `raw` is the exact original
localStorage string. localStorage exposes UTF-16 strings, not disk bytes. The
[ECMAScript JSON string quoting algorithm](https://tc39.es/ecma262/multipage/structured-data.html#sec-quotejsonstring)
escapes lone surrogate code units so distinct source strings remain distinct in
this hash input. The original string is preserved separately and compared exactly
on migration confirmation. SHA-256 provides integrity checking, not authenticated
ownership or authorship.

Candidates without the supported encoding version fail with
UNSUPPORTED_MIGRATION_HASH_ENCODING_HOLD. Their stored candidate and legacy source
are left unchanged; an old hash is never silently reinterpreted. Synthetic tests
show two source strings that direct TextEncoder would conflate now have different
digests, and historical unsupported candidates cannot commit. This remains an
inert, Life-only candidate correction with no new production callers or cutover.

### Stage2B: inert full migration capture for review

`prepareGameMigration({sourceStorage})` and `readGameCandidate(id)` require an
explicit completed `openGame()`. They neither default to global localStorage nor
install/promote a full authority. They do not restore, delete, copy back, normalize
source strings, or change any production caller. Preparation rejects existing
partial/full authority and unexpected initialization evidence before source reads,
then rechecks inside the same transaction as add-only candidate insertion.

The allowlist is restricted to existing local-game data: Life and shared Courier;
exact scoped backpack, local-product, player-session and tutorial names; their
recognized unscoped legacy equivalents; the legacy-owner claim; pending insurance
payment; and lastMission. Scoped values are read only when their exact canonical
Life ID exists in the valid captured Life registry. Owner suffixes are exactly
guest or lowercase canonical wallet addresses. Wallet identity, providers,
authentication and other unrelated keys are excluded. Unknown/orphan scoped key
names remain unexamined HOLD evidence: their values are never read. The existing
scoped/unscoped `k11520.market-life.training` companion is explicitly recognized
but remains unread with UNSUPPORTED_TRAINING_COMPANION. This checkpoint does not
expand that domain's authority.

Preparation makes two bounded captures separated by first-pass hashing. It stores
both sorted relevant-key censuses, the first exact allowed source strings and
presence flags, second-pass presence/digests, and the direct string-comparison
result. Observed changes yield an immutable SOURCE_DIVERGED_HOLD candidate. Native
getItem null is absence; the present string `null` is invalid source data. Proposal
catalog entries distinguish PRESENT, ABSENT and INVALID; INVALID is review-only
and can never pass the full-authority catalog validator. Duplicate/disappearing
enumeration entries, unreadable sources or unstable lengths reject preparation
with a typed HOLD error and create no candidate. Corrupt strings successfully
captured within budget remain preserved inside a HOLD candidate.

The [HTML storage standard](https://html.spec.whatwg.org/multipage/webstorage.html#storage)
does not provide a cross-tab locking assumption, and enumeration order can change
with mutations. Two equal passes are only observed stability. REVIEWABLE_CAPTURE
never means atomic snapshot, latest state, migration-ready or production-ready.
No retry-until-quiet loop conceals this boundary. Source writes occurring after
these observations are not fenced by this preparation API. A later cutover needs
its separately reviewed explicit snapshot boundary and divergence handling.

Candidate records bind `STRICT_SCOPED_REVIEW_V1`, exact source strings, lossless
per-source encoding/digests, censuses, owner/coverage summaries, limits, HOLD
reasons, legacy classifications and review proposals into one manifest digest.
Per-source hashing uses JSON_SOURCE_STRING_V1 with the actual presence boolean and
raw string (or null for absence). The manifest hashes the deterministic JSON body
excluding its own digest. Reads verify source hashes, ID/schema/encoding, the
manifest and deterministic interpretation before returning detached data.
Unsupported policy/encoding versions HOLD; nothing is silently reinterpreted.
Hashes prove integrity relative to the digest, not authenticated owner identity.
Raw captures stay local and are never added to sanitized exports or public QA.

V1 product conversion exists only as a review proposal. The original string stays
unchanged. Existing schema, owner, revision, ledger, progress, events and every
counter must be valid. A pre-existing playerId cannot conflict with the scoped
key. Only these absent fields receive explicit defaults:

- courierReceipts: []
- courierInsuranceReceipts: {}
- courierReceiptBindings: {}
- courierInsuranceBindings: {}

Explicit null or malformed recognized fields HOLD. No missing ledger/progress
container or counter is manufactured. The proposed V2 adds playerId from the
verified scoped-key/Life-registry relationship and preserves opaque JSON extension
fields without treating them as authority. Receipt spelling is never normalized;
IDs/amounts are not deduplicated or truncated. Valid unique histories above 1000
entries now pass the pure read validator only within its existing 2MB UTF-8 record
bound. This changes no production append policy, reward rule or backpay permission.
Unbound histories remain immutable LEGACY_UNBOUND classifications. Canonical
cross-domain references and unresolved duplicate living identities are checked.
Generic item IDs, including per-Life daily rewards, remain scoped to their owner.

Unscoped monetary/inventory/session data, generic legacy backpack ownership,
conflicting owners, orphan namespaces, missing required records, session/tutorial
mismatches, pending insurance-payment evidence, unsupported companions and
invalid cross-domain records HOLD. The legacy-owner claim cannot assign monetary
ownership. lastMission is only a hint and never proves custody or payment.
Many existing users may therefore require explicit migration review; no release
or migration UX approval is implied.

Safeguards are intentionally explicit and reviewable:

- 4096 names enumerated per pass; 512 relevant/source entries; relevant name length
  at most 256 code units
- 4,000,000 UTF-16 code units per source; 8,000,000 captured code units across both
  passes combined, counting each observed string even when unchanged
- 16,000,000 bytes for the UTF-8 encoded candidate JSON
- At most 8 candidate records and 32,000,000 total encoded candidate bytes; count
  and aggregate admission are checked atomically with insertion

Capacity failures preserve all source data and existing candidates. There is no
truncation, eviction or partial replacement; a rejected attempt has no new archive.
Hashing occurs before the insertion transaction and close-generation fencing
prevents abandoned work from writing. Transaction completion remains the only
acknowledgement. Budget/count races, duplicate IDs and insertion aborts retain
prior evidence.

Synthetic fake-IndexedDB tests cover V1/V2 proposals,1001 histories, explicit null,
corrupt/ambiguous/orphan sources, unread value boundaries, source/census races,
authority appearing during capture, generation fencing, policy/manifest tampering,
lossless surrogates, count/byte budgets and zero source writes. These are model
checks only. Full migration/promotion/restore, trusted live command wrappers,
custody/world replay, Chromium old-client tests, persistent restart and production
conflict/recovery feedback remain incomplete. No new heavy CI batch is claimed.

```json
{"STAGE":"FULL_MIGRATION_CAPTURE_REVIEW_ONLY","INTEGRATION":"UNINTEGRATED_DRAFT","POLICY":"STRICT_SCOPED_REVIEW_V1","HASH_ENCODING":"JSON_SOURCE_STRING_V1","PRODUCTION_CALLERS":0,"AUTHORITY_INSTALLATION":false,"SOURCE_WRITES":0,"FULL_MIGRATION":"NOT_IMPLEMENTED","RESTORE":"NOT_IMPLEMENTED","CAPTURE_ATOMICITY":"NOT_CLAIMED","RAW_ARCHIVE_EXPORT":"LOCAL_ONLY","NATIVE_FULL_MODE_QA":"NOT_RUN","PLAYER_LIFE_P0_ACCEPTANCE":"INCOMPLETE","SELF_MERGE":false}
```

### Prepared native IndexedDB adapter diagnostic mode

The existing Player Life browser harness now has a mutually exclusive
`--native-idb-only` mode. Its branch precedes ordinary wallet fixtures, signing
setup, game boot and ordinary report creation. The ordinary harness body remains
unchanged. This mode is prepared source; no native execution or PASS is claimed
until the exact candidate's queued CI evidence is available.

A separate mandatory Product workflow job has an eight-minute maximum and a
240-second scenario cap. It adds up to eight runner-minutes per workflow event,
or sixteen for both push and pull-request events. Existing jobs/assertions and
script budgets are unchanged. The accepted desktop/mobile Courier split must be
retained during dependency reconciliation before a new heavy run.

The native mode uses Playwright 1.51.1 with a newly created disposable Chromium
persistent profile and one fixed loopback origin. It uses the browser's native
IndexedDB, never fake-indexeddb. The all-domain fixture is seeded directly in an
isolated test database and is explicitly synthetic, not a full migration or a
production cutover. External requests, service workers and provider/signing
activity are blocked. Unexpected attempted network/provider activity fails the
mode even when the request was blocked.

Mandatory cases cover two tabs admitting the same revision vector, stale-write
refusal, simultaneous CAS (exactly one commit/conflict), reload and explicit retry,
shared selection epoch/Life isolation, a real native request followed by injected
transaction abort, atomic Courier credit/acknowledgement, corrupt-record
preservation and review-capture source preservation. The abort injection is not
actual disk or quota failure.

Actual old modules and their static transitive dependencies are pinned to
b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720 and routed under the same test origin. The
old tab's caches are created before newer canonical writes. Each old Life,
product, Courier, backpack, session and tutorial mutation must successfully change
its native localStorage string; an independent IndexedDB read must then retain
all canonical records/revisions/consumed receipts unchanged. Refusal, activation
alone or a no-op cannot satisfy that proof. This demonstrates the tested adapter
keyspace boundary, not that the production game has adopted it.

The required old-writer case avoids debugger scheduling dependence. Exact
pause-after-read/before-set interleaving is explicitly NOT_EXERCISED in this mode;
no shared-renderer pause or scheduling hook is represented as a passing atomicity
case. BFCache and genuine disk/quota/power-loss tests also remain NOT_EXERCISED.

For CLEAN_BROWSER_RESTART, all transaction acknowledgements complete first. The
harness records canonical evidence, observes both persistent-context close and
browser disconnection, verifies the old browser is disconnected, and relaunches
with exactly the same profile directory and origin. No storageState import,
reseeding, clearing or repair occurs after reopening. All canonical records,
revision vectors and replay evidence must reopen unchanged. This is clean restart
proof only. The pinned Playwright version uses close/disconnected events and
browser.isConnected rather than APIs introduced in later versions. See the
[Playwright persistent-context contract](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context).

The independent report is checkpointed after each case and on failure, with
HEAD/tree/dirty status, served source hashes, pinned source identity, browser and
driver versions, mandatory outcomes and explicit remaining gaps. Available
artifacts upload even when a case fails. Missing cases, JSON or required screenshots
fail nonzero. The before/after-restart screenshots show the diagnostic fixture,
not the production game, and cannot produce VISUAL_QA PASS. Raw capture archives
are not exported as browser artifacts.

Result scope is NATIVE_ADAPTER_DIAGNOSTICS. Full migration, restore, live trusted
command integration, conflict/recovery UI and world/custody behavior remain
INCOMPLETE. The ordinary product functional/visual gates and the user's
whole-Player-Life P0 requirements remain separate release blockers.

### Narrow shared-QA prerequisites for the queued native batch

The clean-main candidate reuses only the reviewed Courier desktop/mobile split
and bounded read-only timing/restoration diagnostics. Provenance is #507 local
91572879e324f670cb1826d8baa95f88eaca019e (published20ede27b), subsequently reused
unchanged by Track C in fe6ee6f6fcbb94b7664e7267afe980965a64e128
(published #509 head7e0b1d1d537c55fde58e625e9f21d8a2f2308383). This is a selective
test-only prerequisite, not a merge of #507 or any wallet/HUD runtime branch.

The original desktop block gets its own mandatory90-second invocation. The
ordinary mobile block retains its90-second cap, original gameplay assertions and
wait predicates. This adds up to90 seconds of aggregate Product QA time. Required
desktop screenshots and both timing reports are checked. Diagnostics preserve
failed restoration state without altering timers, authority or receipt behavior.
The native-IDB job and all authority code remain unchanged by this prerequisite.
Exact-candidate browser evidence is still required; prior passes do not validate
this candidate, and production cutover remains HOLD.
