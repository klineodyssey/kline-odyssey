# KAIOS Backend / Recovery V1

## Metadata

| Field | Value |
|---|---|
| VERSION | V1 |
| REVISION | 2026-10-07.RECOVERY_VERIFY_FEEDBACK.1 |
| STATUS | DRAFT |
| LAST_UPDATED | 2026-10-07 |
| UPDATED_BY | dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05 |
| REVIEWED_BY | dot (bounded source/probe self-review; exact-head CI and visual review pending) |
| SOURCE_COMMIT | eacb58a4004495f0675e09e260ccd9f09e66fb6d |
| TASK_ID | RECOVERY-VERIFY-FEEDBACK-20261007 |
| CHANGE_REASON | Preserve the async caller prerequisite and fence stale Verify failure feedback on a current-main successor. |
| ANCESTOR | Preserved PR #521 at eacb58a4, integrated with main f7f67950; existing Backend / Recovery V1 and 2cdf30d5 seam. |
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



### 2026-10-07 bounded verification-feedback successor

The preserved #521 source is reconciled with main
`f7f67950418ebbb6f7a5a309a32d529232fcb3b6`, retaining the accepted #519/#522
behavior. The only new runtime behavior is a generation check before presenting a
failed email verification result. A newer page action keeps its own feedback; the
submitted request is not cancelled, and successful Account-bound recovery codes
and existing follow-through checks are unchanged.

A deterministic caller-contract regression reproduces an older failed Verify
overwriting a newer successful Refresh. Since those controls normally occupy
mutually exclusive visible sections, it is not represented as a native browser
click sequence. A second regression covers the directly reachable login flow:
pending Verify failure after newer Request Email success. Both preserve current
failure feedback and release the single-flight guard; the Refresh case also
checks retained codes and unchanged dashboard identity/revision. Severity is P2
presentation correctness; this is not evidence of data loss or an identity breach.

| Date | Version / Revision | Task ID | Actor | Reviewer | Files | Reason | Compatibility | Rollback |
|---|---|---|---|---|---|---|---|---|
| 2026-10-07 | V1 / 2026-10-07.RECOVERY_VERIFY_FEEDBACK.1 | RECOVERY-VERIFY-FEEDBACK-20261007 | dot, Human-authorized temporary engineering maintainer | dot, bounded source/probe self-review; fresh acceptance pending | `web/app.mjs`, `test/identity.test.mjs`, `README.md` | Fence stale Verify failure presentation and add delayed-failure regressions on a current-main successor. | No request cancellation, recovery-code persistence, Account policy, Player Life owner or canonical IDB change. | Revert only the generation-fenced failure presentation and its tests; keep accepted main and existing data/identity policy. |

The original #521 head and main are not changed by creating this successor. Exact
head/tree, current CI, fresh browser evidence and direct visual-review results are
recorded in the successor Draft PR. Local tests do not establish fresh VISUAL_QA;
no merge, deployment or provider/identity authority is granted by this record.
