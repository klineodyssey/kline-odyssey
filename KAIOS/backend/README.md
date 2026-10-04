# KAIOS Backend / Recovery V1

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
