import { TestEmailProvider } from "../src/identity.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Wallet, verifyMessage } from "ethers";
import {
  SQLiteDatabaseAdapter,
  FileObjectStorageAdapter,
  AuthoritativeRooms,
  LocalQueueAdapter,
} from "../src/adapters/local.mjs";
import { createBackend } from "../src/service.mjs";
import { canonical, hash, id, RateLimiter, stmt } from "../src/primitives.mjs";
import {
  validateState,
  migrate,
  backupPackage,
  chainReceiptProjection,
  retentionPolicy,
} from "../src/model.mjs";
import { createLocalPlayerStore } from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
import {
  createPlayerCloudSync,
  cloudGameState,
} from "../../../K線西遊記/temples/11520/runtime/player-cloud-sync.mjs";
const origin = "https://test.kaios.example";
function memory() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}
function player() {
  const storage = memory(),
    store = createLocalPlayerStore({ storage });
  store.createPlayer();
  return { storage, store, p: store.activePlayer() };
}
async function fixture(t, { now = () => Date.now(), limiter } = {}) {
  const dir = await mkdtemp(tmpdir() + "/kaios-"),
    db = new SQLiteDatabaseAdapter(dir + "/db.sqlite");
  db.migrate(
    await readFile(new URL("../deploy/0001.sql", import.meta.url), "utf8"),
  );
  db.migrate(
    await readFile(
      new URL("../deploy/0002_identity.sql", import.meta.url),
      "utf8",
    ),
  );
  const emailProvider = new TestEmailProvider(),
    trusted = new Map();
  let activeAccountToken, activeCode;
  const objects = new FileObjectStorageAdapter(dir + "/objects"),
    realtime = new AuthoritativeRooms(),
    queue = new LocalQueueAdapter(),
    logs = [];
  const api = createBackend({
    database: db,
    emailProvider,
    enrollmentAuthority: {
      verify: async ({ accountId, playerId, proof }) =>
        trusted.get(accountId) === playerId &&
        proof === "TEST_TRUSTED_AUTHORITY",
    },
    objects,
    realtime,
    queue,
    now,
    limiter,
    config: {
      identityKey: "ab".repeat(32),
      domain: origin,
      origins: [origin],
      maxRequestBytes: 512000,
      chainIds: [97],
      secureCookies: true,
    },
    signatureVerifier: async (m, s, w) => {
      try {
        return verifyMessage(m, s).toLowerCase() === w;
      } catch {
        return false;
      }
    },
    logger: (r) => logs.push(r),
  });
  t.after(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });
  async function call(
    path,
    { body, token, key = id(), originHeader = origin } = {},
  ) {
    if (path.startsWith("/auth/")) {
      token ??= activeAccountToken;
      if (body)
        body = { ...body, recoveryCode: body.recoveryCode ?? activeCode };
    }
    const response = await api.fetch(
      new Request(origin + "/api/v1" + path, {
        method: body ? "POST" : "GET",
        headers: {
          origin: originHeader,
          ...(body
            ? { "content-type": "application/json", "idempotency-key": key }
            : {}),
          ...(token ? { authorization: "Bearer " + token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
    await api.flushEmail();
    return {
      status: response.status,
      data: await response.json(),
      headers: response.headers,
    };
  }
  async function login(p, w = Wallet.createRandom()) {
    const browserSecret = "cd".repeat(32);
    const email = "test-" + id() + "@example.test";
    await call("/account/email/request", {
      body: { email, purpose: "signup", browserSecret },
    });
    const signup = await call("/account/email/verify", {
      body: {
        token: emailProvider.messages.at(-1).token,
        purpose: "signup",
        browserSecret,
      },
    });
    assert.equal(signup.status, 200);
    activeAccountToken = signup.headers
      .get("set-cookie")
      .match(/kaios_account=([^;]+)/)[1];
    activeCode = signup.data.recoveryCodes[0];
    trusted.set(signup.data.accountId, p.playerId);
    await call("/account/life/enroll", {
      token: activeAccountToken,
      body: {
        legacyPlayerId: p.playerId,
        migrationProof: "TEST_TRUSTED_AUTHORITY",
      },
    });
    const challenge = await call(
      "/auth/challenge?" +
        new URLSearchParams({
          walletAddress: w.address,
          chainId: 97,
          playerId: p.playerId,
        }),
    );
    const c = challenge.data,
      body = {
        challengeId: c.challengeId,
        signature: await w.signMessage(c.message),
        walletAddress: w.address,
        chainId: 97,
        domain: origin,
      };
    const verified = await call("/auth/verify", { body });
    assert.equal(verified.status, 200);
    return {
      recoveryCodes: signup.data.recoveryCodes,
      token: activeAccountToken,
      wallet: w,
      challenge: c,
      body,
    };
  }
  return {
    db,
    objects,
    realtime,
    queue,
    logs,
    call,
    login,
    dir,
    emailProvider,
  };
}
const sync = (f, auth, p, revision = 0, key = id()) =>
  f.call("/player/state/sync", {
    token: auth.token,
    key,
    body: { baseRevision: revision, state: cloudGameState(p) },
  });
test("canonical serialization, strict game data, chain boundary, retention", async () => {
  assert.equal(canonical({ b: 2, a: [1] }), '\u007b"a":[1],"b":2}');
  assert.equal(await hash({ a: 1, b: 2 }), await hash({ b: 2, a: 1 }));
  const { p } = player();
  const state = cloudGameState(p);
  assert.throws(() => validateState({ ...state, cameraPan: 1 }, p.playerId));
  assert.throws(() =>
    validateState({ ...state, player: { ...p, xp: 100 } }, p.playerId),
  );
  assert.throws(() => chainReceiptProjection({}));
  assert.equal(
    retentionPolicy(
      Array.from({ length: 35 }, (_, i) => ({
        snapshotId: "" + i,
        reason: i === 31 ? "pre-restore" : "manual",
      })),
    ).deleteCandidates.length,
    4,
  );
});
test("wallet signature challenges reject wrong signer/domain/chain, expiry and replay; short sessions", async (t) => {
  let clock = 1700000000000;
  const f = await fixture(t, { now: () => clock }),
    { p } = player(),
    a = await f.login(p);
  for (const patch of [
    { signature: await Wallet.createRandom().signMessage(a.challenge.message) },
    { domain: "https://evil.example" },
    { chainId: 56 },
    { walletAddress: Wallet.createRandom().address },
  ]) {
    const c = await f.call(
      "/auth/challenge?" +
        new URLSearchParams({
          walletAddress: a.wallet.address,
          chainId: 97,
          playerId: p.playerId,
        }),
    );
    const body = {
      ...a.body,
      challengeId: c.data.challengeId,
      signature: await a.wallet.signMessage(c.data.message),
      ...patch,
    };
    assert.equal((await f.call("/auth/verify", { body })).status, 401);
  }
  assert.equal((await f.call("/auth/verify", { body: a.body })).status, 401);
  clock += 1;
  const c = await f.call(
    "/auth/challenge?" +
      new URLSearchParams({
        walletAddress: a.wallet.address,
        chainId: 97,
        playerId: p.playerId,
      }),
  );
  clock += 300001;
  assert.equal(
    (
      await f.call("/auth/verify", {
        body: {
          ...a.body,
          challengeId: c.data.challengeId,
          signature: await a.wallet.signMessage(c.data.message),
        },
      })
    ).status,
    403,
  );
  clock += 1800000;
  assert.equal((await f.call("/player/me", { token: a.token })).status, 401);
  assert.ok(f.logs.every((x) => !JSON.stringify(x).includes(a.body.signature)));
});
test("backup A/B, preview+confirmation, pre-restore, monotonically increasing revisions and game receipts", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  assert.equal((await sync(f, a, p)).data.revision, 1);
  const A = await f.call("/backups/create", {
    token: a.token,
    body: { baseRevision: 1, reason: "manual" },
  });
  const pB = { ...p, lastXYZ: { x: 30, y: 2, z: -7 } };
  assert.equal((await sync(f, a, pB, 1)).data.revision, 2);
  const B = await f.call("/backups/create", {
    token: a.token,
    body: { baseRevision: 2, reason: "milestone" },
  });
  assert.equal(
    (await sync(f, a, { ...p, lastXYZ: { x: 99, y: 0, z: 0 } }, 2)).data
      .revision,
    3,
  );
  for (const [snapshot, revision, expected] of [
    [A.data.snapshot, 3, p.lastXYZ],
    [B.data.snapshot, 4, pB.lastXYZ],
  ]) {
    const preview = await f.call("/recovery/preview", {
      token: a.token,
      body: { snapshotId: snapshot.snapshotId, baseRevision: revision },
    });
    assert.equal(preview.status, 200);
    const body = {
        previewId: preview.data.previewId,
        baseRevision: revision,
        confirm: true,
      },
      key = id();
    assert.equal(
      (
        await f.call("/recovery/restore", {
          token: a.token,
          body: { ...body, confirm: false },
        })
      ).status,
      400,
    );
    const r = await f.call("/recovery/restore", { token: a.token, body, key });
    assert.equal(r.status, 200);
    assert.equal(r.data.revision, revision + 1);
    assert.equal(r.data.preRestoreSnapshot.reason, "pre-restore");
    assert.equal(
      r.data.recoveryReceipt.scope,
      "BACKEND_GAME_ONLY_NOT_BLOCKCHAIN_RECEIPT",
    );
    assert.deepEqual(
      (await f.call("/recovery/restore", { token: a.token, body, key })).data,
      r.data,
    );
    assert.equal(
      (await f.call("/recovery/restore", { token: a.token, body })).status,
      409,
    );
    assert.deepEqual(
      (await f.call("/player/state", { token: a.token })).data.state.player
        .lastXYZ,
      expected,
    );
  }
  assert.equal(
    (await f.call("/game/receipts", { token: a.token })).data.recoveryReceipts
      .length,
    2,
  );
  assert.ok(f.queue.jobs.length > 0);
});
test("two devices: revision 5 rejects revision 4 and retains both versions without silent overwrite", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await sync(f, a, { ...p, lastXYZ: { x: i, y: 0, z: 0 } }, i)).status,
      200,
    );
  const stale = await sync(f, a, { ...p, lastXYZ: { x: 100, y: 0, z: 0 } }, 4);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.code, "CONFLICT");
  const state = (await f.call("/player/state", { token: a.token })).data;
  assert.equal(state.revision, 5);
  assert.equal(state.state.player.lastXYZ.x, 4);
  assert.equal(state.health, "CONFLICT");
  assert.equal(state.conflict.candidateState.player.lastXYZ.x, 100);
  assert.equal(state.conflict.currentState.player.lastXYZ.x, 4);
});
test("corrupted object verifies CORRUPTED and cannot preview or restore even after valid preview", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p),
    s = (await sync(f, a, p)).data.snapshot;
  const preview = await f.call("/recovery/preview", {
    token: a.token,
    body: { snapshotId: s.snapshotId, baseRevision: 1 },
  });
  await writeFile(f.objects.path(s.payloadReference), "{}");
  assert.equal(
    (await f.call("/backups/" + s.snapshotId + "/verify", { token: a.token }))
      .data.status,
    "CORRUPTED",
  );
  assert.equal(
    (
      await f.call("/recovery/preview", {
        token: a.token,
        body: { snapshotId: s.snapshotId, baseRevision: 1 },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await f.call("/recovery/restore", {
        token: a.token,
        body: {
          previewId: preview.data.previewId,
          baseRevision: 1,
          confirm: true,
        },
      })
    ).status,
    422,
  );
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    1,
  );
});
test("players cannot read/export/preview/restore each other; wallet binding is server proof, not local storage", async (t) => {
  const f = await fixture(t),
    one = player(),
    two = player(),
    a = await f.login(one.p),
    b = await f.login(two.p);
  const s = (await sync(f, a, one.p)).data.snapshot;
  await sync(f, b, two.p);
  for (const suffix of ["", "/verify", "/export"])
    assert.equal(
      (await f.call("/backups/" + s.snapshotId + suffix, { token: b.token }))
        .status,
      404,
    );
  assert.equal(
    (
      await f.call("/recovery/preview", {
        token: b.token,
        body: { snapshotId: s.snapshotId, baseRevision: 1 },
      })
    ).status,
    404,
  );
  assert.equal((await sync(f, b, one.p, 1)).status, 403);
  const preview = await f.call("/recovery/preview", {
    token: a.token,
    body: { snapshotId: s.snapshotId, baseRevision: 1 },
  });
  assert.equal(
    (
      await f.call("/recovery/restore", {
        token: b.token,
        body: {
          previewId: preview.data.previewId,
          baseRevision: 1,
          confirm: true,
        },
      })
    ).status,
    409,
  );
  const stranger = Wallet.createRandom(),
    challenge = await f.call(
      "/auth/challenge?" +
        new URLSearchParams({
          walletAddress: stranger.address,
          chainId: 97,
          playerId: one.p.playerId,
        }),
    );
  assert.equal(challenge.status, 403);
});
test("idempotency duplicate, changed request, concurrent sync and stale preview", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p),
    key = id();
  const result = await sync(f, a, p, 0, key);
  assert.deepEqual((await sync(f, a, p, 0, key)).data, result.data);
  assert.equal(
    (await sync(f, a, { ...p, lastXYZ: { x: 1, y: 0, z: 0 } }, 0, key)).status,
    409,
  );
  assert.equal(
    (await f.call("/backups", { token: a.token })).data.snapshots.length,
    1,
  );
  const preview = await f.call("/recovery/preview", {
    token: a.token,
    body: { snapshotId: result.data.snapshot.snapshotId, baseRevision: 1 },
  });
  const outcomes = await Promise.all([
    sync(f, a, p, 1),
    sync(f, a, { ...p, lastXYZ: { x: 2, y: 0, z: 0 } }, 1),
  ]);
  assert.equal(outcomes.filter((x) => x.status === 200).length, 1);
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    2,
  );
  assert.equal(
    (
      await f.call("/recovery/restore", {
        token: a.token,
        body: {
          previewId: preview.data.previewId,
          baseRevision: 1,
          confirm: true,
        },
      })
    ).status,
    409,
  );
});
test("storage outage and partial DB transaction never destroy current; retry after lost response is exact", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  await sync(f, a, p);
  f.objects.failNext = true;
  assert.equal((await sync(f, a, p, 1)).status, 503);
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    1,
  );
  const original = f.db.atomic.bind(f.db);
  let armed = true;
  f.db.atomic = async (statements) => {
    if (
      armed &&
      statements.some((s) => s.sql.startsWith("INSERT INTO player_state"))
    ) {
      armed = false;
      return original([
        ...statements,
        stmt("INSERT INTO nonexistent VALUES(1)"),
      ]);
    }
    return original(statements);
  };
  assert.equal((await sync(f, a, p, 1)).status, 503);
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    1,
  );
  assert.equal(
    (await f.call("/backups", { token: a.token })).data.snapshots.length,
    1,
  );
  assert.ok(
    (
      await f.db.all(
        "SELECT * FROM staging_operations WHERE phase!='COMMITTED'",
      )
    ).length >= 2,
  );
  f.db.atomic = original;
  const key = id(),
    r = await sync(f, a, p, 1, key);
  assert.equal(r.status, 200);
  assert.deepEqual((await sync(f, a, p, 1, key)).data, r.data);
});
test("export/import hash, ownership, schema migration, original kept on failed migration", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p),
    s = (await sync(f, a, p)).data.snapshot;
  const pkg = (
    await f.call("/backups/" + s.snapshotId + "/export", { token: a.token })
  ).data;
  assert.equal(pkg.format, "KAIOS_PLAYER_BACKUP");
  const source = { ...pkg, payload: { ...pkg.payload, schemaVersion: 0 } };
  delete source.payload.coordinates;
  source.manifest = {
    ...source.manifest,
    schemaVersion: 0,
    contentHash: await hash(source.payload),
  };
  const preview = await f.call("/recovery/preview", {
    token: a.token,
    body: { package: source, baseRevision: 1 },
  });
  assert.equal(preview.status, 200);
  assert.equal(
    (
      await f.call("/recovery/restore", {
        token: a.token,
        body: {
          previewId: preview.data.previewId,
          baseRevision: 1,
          confirm: true,
        },
      })
    ).status,
    200,
  );
  const bad = { ...pkg, payload: { ...pkg.payload, schemaVersion: 99 } };
  bad.manifest = {
    ...bad.manifest,
    schemaVersion: 99,
    contentHash: await hash(bad.payload),
  };
  assert.equal(
    (
      await f.call("/recovery/preview", {
        token: a.token,
        body: { package: bad, baseRevision: 2 },
      })
    ).status,
    422,
  );
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    2,
  );
  const corrupted = structuredClone(pkg);
  corrupted.payload.player.lastXYZ.x = 99;
  assert.equal(
    (
      await f.call("/recovery/preview", {
        token: a.token,
        body: { package: corrupted, baseRevision: 2 },
      })
    ).status,
    422,
  );
});
test("API origin/auth/rate limit/request size/schema defenses", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("/player/me")).status, 401);
  assert.equal(
    (await f.call("/health", { originHeader: "https://evil.example" })).status,
    403,
  );
  assert.equal(
    (await f.call("/auth/verify", { body: { signature: "x".repeat(512001) } }))
      .status,
    413,
  );
  const limited = await fixture(t, { limiter: new RateLimiter({ limit: 1 }) });
  assert.equal((await limited.call("/health")).status, 200);
  assert.equal((await limited.call("/health")).status, 429);
});
test("room authority enforces sequence/revision and idempotency; no MMO claim", async () => {
  const room = new AuthoritativeRooms(),
    p = player().p.playerId,
    command = {
      worldId: "11520",
      playerId: p,
      sequence: 1,
      expectedRevision: 0,
      idempotencyKey: id(),
      position: { x: 0, y: 0, z: 0 },
      now: Date.now(),
    };
  const a = await room.command(command);
  assert.equal(a.scope, "FOUNDATION_ONLY");
  assert.deepEqual(await room.command(command), a);
  await assert.rejects(
    room.command({ ...command, idempotencyKey: id(), expectedRevision: 1 }),
    /WORLD_REPLAY/,
  );
  await assert.rejects(
    room.command({ ...command, idempotencyKey: id(), sequence: 2 }),
    /WORLD_REVISION_CONFLICT/,
  );
});
test("local-first transport retries identical pending request after timeout; explicit conflict choice", async () => {
  const { p, store, storage } = player();
  let fail = true,
    keys = [];
  const client = createPlayerCloudSync({
    localStore: store,
    storage,
    fetch: async (url, req) => {
      keys.push(req.headers["idempotency-key"]);
      if (fail) {
        fail = false;
        throw new Error("timeout");
      }
      return Response.json({ revision: 1 });
    },
  });
  client.enqueue();
  assert.equal((await client.flush()).status, "OFFLINE_PENDING");
  assert.equal((await client.flush()).status, "SYNCED");
  assert.equal(keys[0], keys[1]);
  const conflicted = createPlayerCloudSync({
    localStore: store,
    storage,
    fetch: async () =>
      Response.json({ code: "CONFLICT", currentRevision: 5 }, { status: 409 }),
  });
  conflicted.enqueue();
  assert.equal((await conflicted.flush()).status, "CONFLICT");
  assert.throws(() => conflicted.acceptServerRevision(5), /EXPLICIT/);
  assert.equal(store.activePlayer().playerId, p.playerId);
});
test("local restore uses canonical owner, explicit consent and pre-copy, preserving local wallet/profile", () => {
  const { p, store, storage } = player();
  store.saveProgress({ lastXYZ: { x: 10, y: 0, z: 0 } });
  const revision = store.snapshot().revision;
  assert.throws(
    () => store.restoreGameBackup(p, { expectedRevision: revision }),
    /EXPLICIT/,
  );
  assert.throws(
    () =>
      store.restoreGameBackup(p, {
        expectedRevision: revision - 1,
        confirmGameRestore: true,
      }),
    /REVISION/,
  );
  store.restoreGameBackup(p, {
    expectedRevision: revision,
    confirmGameRestore: true,
  });
  assert.deepEqual(store.activePlayer().lastXYZ, p.lastXYZ);
  assert.ok(
    storage.getItem(
      "KAIOS_PLAYER_PRE_RESTORE_V1:" + p.playerId + ":" + revision,
    ),
  );
});
test("refresh does not relabel stale local state as the latest server revision", async () => {
  const { store, storage } = player();
  const client = createPlayerCloudSync({
    localStore: store,
    storage,
    fetch: async (url, req) =>
      req.method === "GET"
        ? Response.json({
            revision: 5,
            health: "HEALTHY",
            state: cloudGameState(store.activePlayer()),
          })
        : Response.json(
            { code: "CONFLICT", baseRevision: 0, currentRevision: 5 },
            { status: 409 },
          ),
  });
  await client.refresh();
  assert.equal(client.status().revision, 0);
  assert.equal(client.status().status, "REMOTE_NEWER");
  client.enqueue();
  assert.equal(client.status().pending.baseRevision, 0);
  assert.equal((await client.flush()).status, "CONFLICT");
});
test("wallet binding idempotency returns same result without extra session", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    w = Wallet.createRandom(),
    auth = await f.login(p, w);
  const c = (
    await f.call(
      "/auth/challenge?" +
        new URLSearchParams({
          walletAddress: w.address,
          chainId: 97,
          playerId: p.playerId,
        }),
      { token: auth.token },
    )
  ).data;
  const body = {
      challengeId: c.challengeId,
      signature: await w.signMessage(c.message),
      walletAddress: w.address,
      chainId: 97,
      domain: origin,
      recoveryCode: auth.recoveryCodes[1],
    },
    key = id();
  const a = await f.call("/auth/verify", { body, key, token: auth.token }),
    b = await f.call("/auth/verify", { body, key, token: auth.token });
  assert.equal(a.status, 200);
  assert.deepEqual(a.data, b.data);
  assert.equal((await f.db.all("SELECT * FROM sessions")).length, 2);
});

test("database unavailable reads fail closed; completed runtime projections remain game only", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  const state = cloudGameState(p, {
    gameReceipts: [
      {
        receiptId: "game-1",
        playerId: p.playerId,
        type: "DIGITAL_ANT_DELIVERY",
        missionId: "mission-1",
        requestId: "request-1",
        completedAt: Date.now(),
        scope: "BACKEND_GAME_ONLY",
      },
    ],
    missions: [
      {
        missionId: "mission-1",
        requestId: "request-1",
        playerId: p.playerId,
        courierLifeId: p.playerId,
        status: "DELIVERED",
        completedAt: Date.now(),
        receiptId: "game-1",
        runtime: "DIGITAL_ANT",
        cargoGameMetadata: { kind: "GAME_CARGO", units: 1 },
      },
    ],
  });
  assert.equal(
    (
      await f.call("/player/state/sync", {
        token: a.token,
        body: { baseRevision: 0, state },
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.call("/logistics/missions", { token: a.token })).data.missions[0]
      .missionId,
    "mission-1",
  );
  assert.equal(
    (await f.call("/chain/receipts", { token: a.token })).data.balances,
    null,
  );
  const get = f.db.get;
  f.db.get = async () => {
    throw new Error("DB unavailable");
  };
  assert.equal((await f.call("/player/state", { token: a.token })).status, 503);
  f.db.get = get;
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    1,
  );
});
test("Recovery Center can preview and explicitly choose preserved conflict candidate", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  await sync(f, a, p);
  const conflict = await sync(
    f,
    a,
    { ...p, lastXYZ: { x: 42, y: 0, z: 0 } },
    0,
  );
  const preview = await f.call("/recovery/preview", {
    token: a.token,
    body: { conflictId: conflict.data.conflictId, baseRevision: 1 },
  });
  assert.equal(preview.status, 200);
  assert.equal(preview.data.summary.candidate.lastXYZ.x, 42);
  const restore = await f.call("/recovery/restore", {
    token: a.token,
    body: { previewId: preview.data.previewId, baseRevision: 1, confirm: true },
  });
  assert.equal(restore.status, 200);
  const state = (await f.call("/player/state", { token: a.token })).data;
  assert.equal(state.state.player.lastXYZ.x, 42);
  assert.equal(state.conflict, null);
});
test("simultaneous duplicate backup returns one result; arbitrary public IDs cannot create ghost accounts", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  await sync(f, a, p);
  const body = { baseRevision: 1, reason: "manual" },
    key = id(),
    out = await Promise.all([
      f.call("/backups/create", { token: a.token, body, key }),
      f.call("/backups/create", { token: a.token, body, key }),
    ]);
  assert.equal(out[0].status, 200);
  assert.equal(out[1].status, 200);
  assert.deepEqual(out[0].data, out[1].data);
  assert.equal(
    (await f.call("/backups", { token: a.token })).data.snapshots.length,
    2,
  );
  const before = (await f.db.all("SELECT * FROM players")).length;
  const attempts = await Promise.all(
    [player().p, player().p].map((p) =>
      f.call(
        "/auth/challenge?" +
          new URLSearchParams({
            walletAddress: Wallet.createRandom().address,
            chainId: 97,
            playerId: p.playerId,
          }),
        { token: a.token },
      ),
    ),
  );
  assert.ok(attempts.every((r) => r.status === 403));
  assert.equal((await f.db.all("SELECT * FROM players")).length, before);
});
test("completed receipt identity cannot silently change payload", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  const state = cloudGameState(p, {
    gameReceipts: [
      {
        receiptId: "immutable",
        playerId: p.playerId,
        type: "GAME_ACHIEVEMENT",
        completedAt: 1,
        scope: "BACKEND_GAME_ONLY",
      },
    ],
  });
  assert.equal(
    (
      await f.call("/player/state/sync", {
        token: a.token,
        body: { baseRevision: 0, state },
      })
    ).status,
    200,
  );
  state.gameReceipts[0].completedAt = 2;
  const changed = await f.call("/player/state/sync", {
    token: a.token,
    body: { baseRevision: 1, state },
  });
  assert.equal(changed.status, 409);
  assert.equal(changed.data.code, "GAME_RECEIPT_MISMATCH");
  assert.equal(
    (await f.call("/player/state", { token: a.token })).data.revision,
    1,
  );
});
test("milestone synchronization automatically writes a milestone snapshot", async (t) => {
  const f = await fixture(t),
    { p } = player(),
    a = await f.login(p);
  await sync(f, a, p);
  const milestone = {
    ...p,
    journeyProgress: { ...p.journeyProgress, storyComplete: true },
  };
  const result = await sync(f, a, milestone, 1);
  assert.equal(result.status, 200);
  assert.equal(result.data.snapshot.reason, "milestone");
  assert.equal(
    (await f.call("/backups", { token: a.token })).data.snapshots.length,
    2,
  );
});
