# Local development and deployment candidate

Requires Node 24+ (built-in SQLite); no cloud account or paid resource is needed.
From repository root:

```sh
npm ci --prefix KAIOS/backend --ignore-scripts
npm run --prefix KAIOS/backend dev
```

The single dev command starts API, durable SQLite database, immutable file objects,
local room/queue adapters and Recovery Center at http://127.0.0.1:8787/recovery.
Choose **體驗本機測試玩家** for a labelled stub signer, or use a human-controlled
BSC97 wallet signature. Neither sends a transaction. Data persists in ignored
`KAIOS/backend/.local/`; never commit it. Do not expose this demo port publicly.
Same-browser local game data shares the origin only if gameplay is served at that
same origin. GitHub Pages does not acquire a backend automatically; the game entry
links to a candidate Recovery Center which reports unavailable until an authorized
same-origin API/proxy deployment exists. Cross-origin cookie/hosting integration is
not silently enabled by this PR.

```sh
npm run --prefix KAIOS/backend check
npm run --prefix KAIOS/backend test
node --test 'K線西遊記/temples/11520/tests/11520-player-life.test.mjs'
cd KAIOS/backend
npx playwright install chromium
npm run test:browser
npm run candidate
```

For system Chromium: `KAIOS_CHROMIUM=/usr/bin/chromium npm run test:browser`.
Browser tests use an isolated temporary database and emit reviewed screenshots and
JSON results in ignored `evidence/`. The dedicated GitHub Actions workflow uploads
these as artifacts and never deploys. All dependencies are pinned with a lockfile.

## Environment / bindings schema

| Name | Reference | Validation / scope |
|---|---|---|
| KAIOS_LOCAL_PORT | 8787 | Local loopback port; use a different test port if occupied |
| KAIOS_LOCAL_DATA_DIR | `.local/` | Local-only private filesystem; test temporary directory |
| KAIOS_DOMAIN | Configured HTTPS origin | Signed challenge domain; one canonical API origin |
| KAIOS_ALLOWED_ORIGINS | JSON HTTPS origin array | Explicit browser Origin allowlist; no wildcard |
| KAIOS_CHAIN_IDS | `[97]` | Allowed identity chain contexts; not trading authorization |
| DB | D1 binding candidate | Private relational data; migration `deploy/0001.sql` |
| BACKUPS | R2 binding candidate | Private immutable snapshot objects |
| WORLD_ROOMS | Durable Object binding | Internal authoritative room foundation |
| JOBS | Queue binding | Diagnostic background jobs |
| ASSETS | Workers static assets | UI + generated exact canonical validator/transport copies |

`deploy/wrangler.example.toml` contains placeholders, not real resource IDs or
credentials. `npm run candidate` bundles `.candidate/worker.mjs` and copies public
assets locally. It does not run wrangler, create resources or deploy. Do not deploy
this example unchanged. Live provider execution remains NOT_VERIFIED.

## Authorized future rollout and rollback

1. Independent review + Human approval for provider/production; supply bindings through
   authorized account mechanisms, never chat secrets.
2. Backup the existing game DB/object inventory; apply additive migration in staging.
3. Configure approved HTTPS domain/Origin, distributed ingress quotas, privacy access,
   monitoring, retention and private backups. Disable all demo code outside loopback.
4. Verify health, wallet challenge and synthetic nonfinancial recovery in staging.
5. Only after separate authorization promote the candidate. No automatic deploy workflow.

Rollback: stop new writes first, retain immutable objects and all state revisions;
route back to the previous API bundle. Do not roll back a DB file while accepting
new revisions. This first candidate only adds tables; do not drop them during rollback.
A failed schema migration or restore must leave previous CURRENT untouched. Inspect
staging phase counts; preserve orphan objects until published references and receipt
journals are reconciled. Never "repair" a financial balance using backend data.
