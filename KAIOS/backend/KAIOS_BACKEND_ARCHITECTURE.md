# KAIOS Backend V1 — review candidate

This adds a service layer, not a second gameplay or financial engine. No production
service, paid resource or public multiplayer world is created by this PR.

## Canon inventory (main 14c6937078518e8026f31f642e82221ad0e3ab82)

| Domain | Existing owner | Backend role |
|---|---|---|
| Player Life | `K線西遊記/temples/11520/runtime/player-life-runtime.mjs` | Import the existing validator; authenticated durable projection |
| Player storage | `KAIOS_PLAYER_LIFE_V1`, player-scoped browser stores | Local-first remains; separate revision journal/outbox |
| Logistics / Player Courier | `digital-ant-logistics-runtime.mjs` | Completed mission/receipt projection using existing IDs |
| Market Life | `market-life-runtime.mjs`, `world-runtime.mjs` | Completed training growth only, never pending predictions |
| GA600 | Player Life Engine XP; full engine NOT_INTEGRATED | Game progress projection, no research-engine claim |
| Wallet | `evm-wallet-runtime.mjs`, `wallet-game-bridge.mjs` | Server challenge proof, never wallet custody or balance authority |
| Trading | `real-trading-order-intent.mjs`, existing settlement / chain | Read-model interface only; no settlement implementation |
| 12345 | Existing Heart runtime-main / runtime-state | No modifications |

Boot, AGENTS, Physics CURRENT, UniverseMap CURRENT, 11520 HANDOFF_CURRENT,
Player Life, Digital Ant, Market Life and V10 backend standards were read before
implementation. Existing Player Life documents propose cloud research but do not
select an operational provider. The old `11520/backend/server.mjs` is a simulation
service, not an authenticated Player Life recovery authority. This candidate follows
V10's service/adapter/security boundaries without adopting that simulation ledger.

## Three authorities

- **Blockchain**: financial/on-chain truth. Balances, allowance, deposit, position,
  claimable and withdrawals must be read from their canonical chain/settlement owner.
- **Backend**: authenticated game state, synchronization, version history and recovery.
  Client game progress remains an untrusted game candidate, not anti-cheat proof.
- **GitHub**: code and specification truth. A Draft PR does not activate a production authority.

```mermaid
flowchart LR
  Local[Existing local Player Life owner] --> Outbox[Player-scoped revision + durable outbox]
  Outbox --> API[Portable Fetch API /api/v1]
  API --> DB[DatabaseAdapter: atomic relational writes]
  API --> Objects[ObjectStorageAdapter: immutable hash snapshots]
  API --> Room[RealtimeStateAdapter: authoritative room foundation]
  API --> Queue[QueueAdapter: diagnostic background jobs]
  Chain[Canonical chain / settlement] --> Index[Verified index interface only]
```

## Ports and reference adapters

`src/primitives.mjs` defines DatabaseAdapter (get/all/atomic statements),
ObjectStorageAdapter (immutable put/get), RealtimeStateAdapter (owned command),
QueueAdapter (send), rate-limit policy and canonical serialization/hash primitives.
Core service/model/room modules use portable Web APIs; no Node or vendor SDK imports.
The Player Life validator is imported from its original source, including in the
Workers bundle. Generated copies are build assets, not separately edited authority.

| Port | Local reference | Cloudflare candidate |
|---|---|---|
| Database | SQLite / Node 24 `node:sqlite`, WAL, FK, BEGIN IMMEDIATE | D1 prepared statements / atomic batch |
| Object storage | Write-once files | R2 conditional immutable put |
| Realtime | Single local authoritative room owner | Private Durable Object binding, serialized durable room state |
| Queue | Local diagnostic queue, drain interface | Queue producer/diagnostic consumer |

Cloudflare bindings have **not** been provisioned or tested against a live provider.
They are a locally bundled reference candidate. Multi-isolate abuse control needs
provider ingress limits in addition to the bounded per-isolate middleware before
any production approval. The room is FOUNDATION_ONLY: WorldSession, Presence and
PlayerPositionProjection; MonsterProjection/MissionProjection placeholders are
empty arrays. It is not a live MMO or peer-to-peer trust system.

## Models and ownership

PlayerProfile (`/player/me`) contains playerId, lifeId (the canonical Player Life ID,
not an employee or browser fingerprint), verified wallet projection, createdAt,
updatedAt, schemaVersion, revision, gameProgress, level, XP, lastWorld, LOCAL XYZ,
homePlotId and settings. Wallet address plus chain context has a unique binding.
Account sessions select the independently enrolled Life. Wallet signatures cannot
claim a public ID. Legacy migration requires a trusted ownership proof adapter;
without one, preserve local saves and refuse enrollment rather than guessing ownership.

State is schemaVersion 2 plus the canonical game-only player, completed monster
training growth, game receipts and completed logistics missions. Player profile PII
is omitted/reset before transport and server persistence. Events, XP/level/home
constraints are validated by the existing Player Life validator; no new XP formula
is introduced. Inventory remains the existing player-scoped backpack **reference**;
V1 does not replicate the backpack's item ledger. Do not advertise a full backpack
restore or full GA600 integration.

The browser transport persists a fixed candidate + idempotency key before network
I/O. Timeouts replay that same request. Refresh never relabels stale local data with
a newer cloud revision. A stale device receives CONFLICT; both complete versions
remain in the server conflict journal. Recovery Center lets the player inspect,
preview/restore a preserved conflict candidate or historical version, or explicitly load the server version to local; it
never silently picks last-write-wins. Frame/animation/camera/pointer/modal/FX state
and pending monster predictions are excluded. Sync is explicitly requested through
the Recovery Center or the reusable outbox API; V1 does not background-sync every
gameplay event or silently enable a cloud provider.

## API

| Method | `/api/v1` path | Purpose |
|---|---|---|
| GET | `/health` | DB check, authority labels, configuration mode |
| GET | `/auth/challenge` | Bounded wallet/chain/player challenge issuance |
| POST | `/auth/verify` | One-time signature verification, 30-minute session |
| GET | `/player/me`, `/player/state` | Own profile/current health/conflict candidate |
| POST | `/player/state/sync` | Compare baseRevision; save durable sync snapshot |
| GET | `/backups`, `/backups/:id` | Own immutable version metadata/payload |
| POST | `/backups/create` | Manual/milestone/pre-migration backup |
| GET | `/backups/:id/verify`, `/backups/:id/export` | Verify or portable JSON export |
| POST | `/recovery/preview`, `/recovery/restore` | Snapshot/import preview; explicit confirmed restore |
| GET | `/game/receipts`, `/logistics/missions` | Durable game-only projections |
| GET | `/chain/receipts` | Fail-closed unconfigured verified-chain index boundary |
| POST | `/world/session` | Private authenticated room command, sequence/revision |

Every POST requires `Idempotency-Key` (8–128 safe characters). Auth challenge GET
is intentionally a fresh nonce issuance, not a player-state mutation. Reusing a POST
key with different content returns 409; response replay does not perform mutation
again. Auth response replay returns the same public metadata without issuing another
session; if the first cookie was lost, request a fresh challenge. No bearer token is
stored in response journals or displayed by the UI.

## Repository registration

README and `docs/KGEN_MASTER_INDEX.md` register the candidate and its file inventory.
Boot CURRENT is a protected authority and this task did not explicitly authorize a
Boot update; it remains unchanged. GM may register an approved service activation
in Boot under a separate explicit authorization after independent review.


Identity remediation adds Account/AccountSession/AccountLife ownership independently
of game snapshots. EmailProviderAdapter and TestEmailProvider remain portable. Private
SQL outbox dispatch is separate from request responses; credentials and PII never enter
game backup/export. `0002_identity.sql` is additive, not a second backend. Legacy
wallet sessions are invalid for Account access. Fresh signup creates a new Life;
it does not silently relabel/import existing local guest data as verified ownership.

Coordinate schema 2 uses `coordinates.universe` (KGEN_UNIVERSE_XYZ, xyz=null,
UNRESOLVED, explicit address anchor and no transform) and `coordinates.local`
(LOCAL_RENDER_SCENE, world ID, legacy scene units, lastXYZ/home XYZ). Existing
`player.lastXYZ`/`homePlot.xyz` remain compatibility aliases explicitly local-only.
No API promotes client-supplied universe triples. Human address examples are decimal
anchor metadata, not 3-axis position or currency exchange rates. A future authoritative
position adapter must supply provenance/frame/transform before coordinates can resolve.

## Customer project research prototype and future integration boundary

Task `KAIOS_AI_COMPANY_CUSTOMER_PROJECT_RUNTIME_V2`, source baseline
`b2a349c36d3670327aa419802f6a80a4ed339a4e`. The existing Company owner now has a
pure local test prototype for request -> immutable simulated quote -> explicit
acceptance -> planned project. It is `LOCAL_TEST_ONLY_NOT_DURABLE`. No Backend
service, route, data model, SQL migration, provider binding or deployment was
changed to enable it. Player schema 2 still rejects arbitrary project fields.

The cumulative owner map and acceptance rules are in
`KGEN-AI-Company/AI_COMPANY_OPERATING_SYSTEM.md`, section 8. The unchanged #97
library is used only by an explicit test planning adapter. No house completion,
asset registration, real customer/revenue, procurement or payment follows from
the prototype. #182/#410 remain HOLD with no stale code transplant.

If a later implementation is authorized, reuse this Backend's Account -> enrolled
Player session, DatabaseAdapter, idempotency journal, hashing and conflict policy.
The prototype's synchronous simulation identity context must be supplied only
after server authentication; it is not a new authenticator. Do not create a new
account, claim a legacy Life, configure persistent access or mutate a registry as
a shortcut to testing the project flow.

Proposed next changes, not implemented:

- `src/model.mjs`: separate strict customer-project aggregate, leaving Player
  `SCHEMA_VERSION=2` and game-only receipts unchanged.
- `src/service.mjs`: default-off owned workspace read/command routes; resolve
  session identity before reads, command execution and idempotency lookup.
- Additive `deploy/0003_customer_projects.sql`: current aggregate, append-only
  event and project-specific revision-guard tables in the existing database.
  Reuse the existing idempotency table; do not edit applied 0001/0002 migrations.
- `src/local-server.mjs`: load the additive migration only in the separately
  approved local prototype configuration. Do not enable production worker flags.
- Existing backend tests: add restart, statement-by-statement rollback,
  concurrent first submission, wrong-tenant and conflict preservation coverage.

The first database slice may have one workspace per enrolled Player as a bounded
technical scope, not a permanent product entitlement. Enforce workspace ID as the
primary key and `owner_player_id` independently UNIQUE; a composite uniqueness
constraint alone does not enforce the one-workspace bound. Use a stable
Account/Player/company/primary-slot command scope before a workspace ID exists.
Initial creation uses expected revision zero and a guarded absent row.

For state-changing commands, atomically check workspace revision and prior event
hash, replace the aggregate, append its event, and store the exact key/hash/response.
Accepted quote, simulated contract and planned project must become visible together.
For a new-key duplicate of the exact accepted intent, guard the immutable accepted
hash and cache only the ALREADY_ACCEPTED response; do not advance state/event
revision. Changed payload under an existing key fails with a content mismatch.
Retries never receive a silent new key. Cross-process guarantees must be tested
against the database; the pure prototype's in-memory queue does not prove them.

Project backup/export/import/restore must use a separately versioned project
envelope and preserve accepted-baseline history. The existing Player snapshot
loader is deliberately incompatible and must not be weakened. R2 snapshots,
Recovery Center integration, multi-device UI, full-house construction coverage,
Asset/Player projections and final simulated receipts are deferred. No automatic
cross-store Company IndexedDB writes or public REAL business events are planned.

Any future new file needs its full path/purpose registered in Backend README,
repository README and KGEN indexes. Boot CURRENT remains protected and requires
explicit scoped authorization. This existing-document appendix does not authorize
that update, production activation, heavy CI, funding, legal commitments or real
external effects.
