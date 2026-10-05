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

## Local product/Courier integrity Draft experiment (2026-10-05)

STATUS: MEDIUM_RISK_DRAFT / INTEGRATION_AND_RELEASE_BLOCKED
TASK: DOT-LOCAL-STORE-INTEGRITY-20261005
BASE: 765d0e24e3fbe7353a80329c99bc3b5c3025fd12
IDENTITY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
DEPENDS_ON: PR #505 / c14801ae9eb0b78f08da1e32a914251060fbeb75 / DRAFT_DEPENDENCY_NOT_RELEASED

This bounded local-game experiment is not an approved single-tab product policy,
live migration, merge decision or release. No Worker/Life/Employee identity,
signer, deployment or real-asset authority is adopted. Frozen clock-recovery
PR #503 is not imported. Rewards, insurance amounts, clock thresholds, canonical
XYZ and real-wallet/on-chain settlement behavior are unchanged.

### BOOT, scope and canonical writers

Root/11520 AGENTS, repository/AI Company Boot, Canon/Physics/Map, workspace and
workforce rules, WorkQueue, protected paths, manifests and open PR ownership were
checked from clean main. Human's temporary external-maintainer exception is the
contribution authority. No registry record or company claim is created.

The existing product and Courier envelopes remain their sole storage owners:

- Player-scoped k11520.local-product.v1:<owner> in evm-wallet-runtime.mjs.
- Origin-wide K11520_PLAYER_COURIER in digital-ant-logistics-runtime.mjs.

Product activation/session, events/playtime, loot/XP, spend, reward/insurance,
scoped legacy migration and simulation submit/observe/close/cancel share the
writer guard. The production simulation adapter wraps its entire synchronous
mutation in transactLedger. All Courier writes reload the full shared envelope.
No second ledger, backend, reward authority or mission-specific store is added.

### Coordination and failure contract

One stable Web Lock, k11520.local-game-writer, covers both envelopes and ALL
player/wallet namespaces on this origin. Same-realm consumers share a refcounted
lease using underlying storage identity. Lock order is the lifetime origin lease,
then one synchronous transaction; no nested mission/global lock is acquired.
Reentrant writes and account changes during a transaction are rejected.

Factories expose ready, snapshot().writeCapability, requestWriter and dispose.
Product refresh and Courier reload explicitly recover canonical state. Acquisition
is asynchronous, exclusive and ifAvailable. Followers can read these stores but
cannot persist their activation or mutations. Missing locks/storage fail closed.
Disposal revokes that consumer; last-reference disposal releases the shared lock.
pagehide revokes the generation. BFCache return requires explicit reacquisition
and refresh. Browser destruction releases the native lock, not pending credit.

Guarded writes reload, validate, draft, persist and verify exact readback before
acknowledging success. Failed/uncertain persistence rolls back live memory and
blocks further writes until explicit refresh. Old bytes are never written back
as compensation. This protocol is cooperative, not a global localStorage CAS or
an atomic transaction spanning multiple keys.

### Delivery, insurance and migration

Eligible ordinary ACTIVE delivery first stores DELIVERY_PENDING_CREDIT in the
existing mission. resolveCreditPort(courierLifeId) explicitly supplies the
canonical product store port. Player ID, current settlement-time owner namespace,
mission, original receipt, amount and purpose become immutable at first pending
intent. Missing owner/port preserves the mission and cargo. Exact durable product
receipt evidence is required before DELIVERED and destination ownership.
reconcileCredit retries the same bound intent. claimInsurancePayout similarly
uses pending intent, existing product credit and receipt-verified PAID acknowledgement.
No historical DELIVERED mission is automatically converted or backpaid.

Schema V2 stays at the existing product key. New receipt metadata and dedupe
indexes persist together. Legacy IDs remain replay tombstones without invented
amounts or backpay. Supported unknown fields survive already-scoped migration. An absent scoped guest
record alongside any unscoped product save stays LEGACY_PRODUCT_REVIEW_REQUIRED,
regardless of another store's legacy-owner claim. Product wrappers do not claim
that ownership. Refresh, account roundtrips and writer takeover cannot silently
clear this hold. Some existing players therefore need reviewed migration/UX
before final release; original bytes remain unchanged. New receipts are
refused at the supported capacity; old evidence is not evicted. Unsupported,
malformed, conflicting, oversized or wrong-namespace records remain untouched.

### Review and release gates

- A separate glue commit wires the explicit shell resolver, pending retry and
  insurance pending/credit/ack routing. The existing loader is memoized so
  overlapping opens share one consumer; failed initialization disposes it. This
  still needs final exact-head browser/integration QA.
- Different-player tabs also contend for this lease. The resulting product/UX
  tradeoff needs Human review before release.
- Player Life, backpack, world state and preferences remain outside this lease.
  No whole-game read-only or cross-store atomicity claim is made. Existing combat
  ordering and reward feedback need separate integration validation.
- Mixed-version rollout is unsupported. Evaluation requires closing/reloading
  old tabs. Rollback must preserve V2 evidence for a compatible reader; reverting
  code is not a data downgrade or permission to delete receipts.
- Node coverage includes ownership/lifecycle, concurrent consumers, durability,
  pending-credit retries, namespace binding, migration and capacity boundaries.
  Local Chromium cannot start because socket() is not permitted; no bypass was
  attempted. FUNCTIONAL_QA is store/Node only; VISUAL_QA is NOT_RUN.
- Real multi-tab, close/crash/takeover, BFCache, mixed-version, account switches,
  interrupted credit/ack, existing browser suites and inspected mobile/landscape
  screenshots remain required at the final integrated head.

FINAL: MEDIUM_RISK_DRAFT / HOLD. Unit results do not authorize merge, live player
migration, expansion to other stores, or real KGEN/KAIOS/chain actions.
