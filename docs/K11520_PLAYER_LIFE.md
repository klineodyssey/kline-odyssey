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
