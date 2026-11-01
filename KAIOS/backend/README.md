# KAIOS Backend / Recovery V1

## Metadata

| Field | Value |
|---|---|
| VERSION | V1 |
| REVISION | 2026-10-06.RECOVERY_ASYNC_CALLER.1 |
| STATUS | DRAFT |
| LAST_UPDATED | 2026-10-06 |
| UPDATED_BY | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 |
| REVIEWED_BY | dot (independent source and localization review; final candidate evidence in PR #521) |
| SOURCE_COMMIT | e1c84739a887cdcff78867c01b7c4c8393f402a8 |
| TASK_ID | RECOVERY-ASYNC-CALLER-20261006 |
| CHANGE_REASON | Record the bounded Recovery async caller prerequisite, localized login feedback, compatibility and rollback. |
| ANCESTOR | Existing Backend / Recovery V1 at e26f3a76; explicit Recovery seam at 2cdf30d5. |
| SOURCE_OF_TRUTH | FALSE |

Review candidate; no production deployment. Begin with [Local development](LOCAL_DEVELOPMENT.md).

- [Architecture and canon ownership](KAIOS_BACKEND_ARCHITECTURE.md)
- [Backup / restore specification](KAIOS_BACKUP_RECOVERY_SPEC.md)
- [Security and financial boundary](KAIOS_BACKEND_SECURITY_BOUNDARY.md)

File inventory: `src/primitives.mjs` (ports/policy/hash), `src/model.mjs` (canonical
projection/migration), `src/service.mjs` (versioned authenticated API), `src/rooms.mjs`
(room owner), `src/adapters/local.mjs`, `src/adapters/cloudflare.mjs`,
`src/local-server.mjs`; `web/index.html`, `web/style.css`, `web/app.mjs`;
`deploy/0001.sql`, `deploy/worker.mjs`, `deploy/wrangler.example.toml`,
`deploy/build.mjs`; `test/backend.test.mjs`, `test/browser.mjs`, `test/syntax.mjs`;
`package.json`, `package-lock.json`, `.gitignore`.

Integration: existing `player-life-runtime.mjs` adds explicit game-only local recovery;
`player-cloud-sync.mjs` holds the optional local-first outbox; `player-life-ui.mjs`
adds one Recovery Center link. Default `createCloudPlayerStore()` still fails closed
until configured; no game/camera/trading authority is replaced.


PR489 P1 remediation inventory:
- `KAIOS/backend/KAIOS_IDENTITY_AUTH_RESEARCH.md`: official-source comparison,
  architecture decision, assurance gates and attack matrix.
- `KAIOS/backend/src/identity.mjs`: Account/session/email/recovery and fail-closed
  Life enrollment, TestEmailProvider and KYC adapter boundary.
- `KAIOS/backend/deploy/0002_identity.sql`: additive private identity migration.
- `KAIOS/backend/test/identity.test.mjs`: adversarial identity/coordinate tests.

Schema 2 preserves legacy local XYZ and adds explicit unresolved Universe XYZ.
Account login replaces wallet-first Life claims. Passkey/asset assurance is deferred
and disabled, not simulated as production authentication. Read current security and
local-development additions before applying old V1 examples.


## Local changelog

This cumulative record supplements the existing V1 inventory and PR489 identity
remediation above. It does not create a new owner, release version, storage
implementation or authority.

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | V1 / 2026-10-06.RECOVERY_ASYNC_CALLER.1 | RECOVERY-ASYNC-CALLER-20261006 | dot, Human-authorized temporary engineering maintainer | dot, independent source and localization reviews; final candidate evidence in PR #521 | `web/app.mjs`, `test/identity.test.mjs`, `README.md` | Await all four existing store preparations and local import/selection/restore acknowledgements; fence superseded presentation; allow explicit selection refresh; retain one-use Account-bound verification output; localize `ACCOUNT_AUTH_REQUIRED`; add regression/provenance evidence. | Existing synchronous legacy default and endpoint/server policies remain. No schema migration, credential persistence, permission change or canonical IDB promotion. | Revert the source change to the preceding legacy Recovery implementation; retain existing backend DB, objects and local game data. No data deletion or identity-policy downgrade. |

The source lineage is reviewed local `b6523a04`, equivalent published tree
`72aa733a01090b089784e964e628d2d9032997f3` at `e1c84739`, and the bounded
localization/provenance follow-up in [Draft PR #521](https://github.com/klineodyssey/kline-odyssey/pull/521).
The [first-head QA run](https://github.com/klineodyssey/kline-odyssey/actions/runs/37455467150)
passed legacy Recovery interactions. Direct screenshot review found untranslated
required-login feedback; the follow-up maps that code without changing auth
behavior. First-head evidence does not validate a later source head.

Caller checks cannot cancel an already committed operation, prove a private
snapshot is current against another writer, or atomically fence an external
session switch between separate HTTP requests. Canonical IDB and cross-domain
transaction authority remain disabled. Exact-head browser evidence and final
review remain release gates; this changelog grants no merge or deployment authority.
