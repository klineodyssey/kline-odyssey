import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { Wallet, verifyMessage } from "ethers";
import { createBackend } from "../src/service.mjs";
import { TestEmailProvider, normalizeEmail } from "../src/identity.mjs";
import {
  SQLiteDatabaseAdapter,
  FileObjectStorageAdapter,
} from "../src/adapters/local.mjs";
import { migrate, validateState, coordinateProjection } from "../src/model.mjs";
import { hash, id } from "../src/primitives.mjs";
import { cloudGameState } from "../../../K線西遊記/temples/11520/runtime/player-cloud-sync.mjs";
import { createLocalPlayerStore } from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
const origin = "https://identity.example.test",
  browserSecret = "12".repeat(32);
async function fixture(t) {
  const dir = await mkdtemp("/tmp/kaios-identity-"),
    db = new SQLiteDatabaseAdapter(dir + "/db");
  for (const f of ["0001.sql", "0002_identity.sql"])
    db.migrate(
      await readFile(new URL("../deploy/" + f, import.meta.url), "utf8"),
    );
  const email = new TestEmailProvider(),
    logs = [];
  let clock = 1700000000000;
  const api = createBackend({
    database: db,
    objects: new FileObjectStorageAdapter(dir + "/objects"),
    emailProvider: email,
    now: () => clock,
    config: {
      domain: origin,
      origins: [origin],
      chainIds: [97],
      identityKey: "ab".repeat(32),
      maxRequestBytes: 512000,
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
  async function call(path, body, token, key = id(), requestOrigin = origin) {
    const r = await api.fetch(
      new Request(origin + "/api/v1" + path, {
        method: body ? "POST" : "GET",
        headers: {
          origin: requestOrigin,
          ...(body
            ? { "content-type": "application/json", "idempotency-key": key }
            : {}),
          ...(token ? { authorization: "Bearer " + token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
    return {
      status: r.status,
      data: await r.json(),
      token: r.headers.get("set-cookie")?.match(/kaios_account=([^;]+)/)?.[1],
    };
  }
  async function request(emailAddress, purpose = "signup", token) {
    await call(
      "/account/email/request",
      { email: emailAddress, purpose, browserSecret },
      token,
    );
    await api.flushEmail();
    return email.messages.findLast(
      (m) => m.to === emailAddress && m.purpose === purpose,
    );
  }
  async function signup(address = "p-" + id() + "@example.test") {
    const message = await request(address);
    const result = await call("/account/email/verify", {
      token: message.token,
      purpose: "signup",
      browserSecret,
    });
    assert.equal(result.status, 200);
    return { ...result, email: address };
  }
  return {
    db,
    email,
    api,
    logs,
    call,
    request,
    signup,
    tick: (n) => (clock += n),
  };
}
test("email policy, valid signup, server-assigned Life, no wallet identity or public-ID preclaim", async (t) => {
  const f = await fixture(t);
  assert.equal(
    normalizeEmail("Player+one@EXAMPLE.test"),
    "Player+one@example.test",
  );
  assert.notEqual(
    normalizeEmail("Player@example.test"),
    normalizeEmail("player@example.test"),
  );
  assert.throws(() => normalizeEmail("a..b@example.test"));
  const a = await f.signup(),
    b = await f.signup();
  const e = await f.call("/account/life/enroll", {}, a.token);
  assert.equal(e.status, 200);
  assert.match(e.data.playerId, /^KAIOS-P-/);
  assert.notEqual(a.data.accountId, e.data.playerId);
  const preclaim = await f.call(
    "/account/life/enroll",
    { legacyPlayerId: e.data.playerId, migrationProof: "public-id-and-wallet" },
    b.token,
  );
  assert.equal(preclaim.status, 403);
  assert.equal(
    (
      await f.call(
        "/account/life/enroll",
        { playerId: e.data.playerId },
        b.token,
      )
    ).status,
    400,
  );
  assert.equal((await f.call("/account/life/enroll", {}, a.token)).status, 409);
  const w = Wallet.createRandom();
  assert.equal(
    (
      await f.call(
        "/auth/challenge?" +
          new URLSearchParams({
            walletAddress: w.address,
            chainId: 97,
            playerId: e.data.playerId,
          }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await f.call(
        "/auth/challenge?" +
          new URLSearchParams({
            walletAddress: w.address,
            chainId: 97,
            playerId: e.data.playerId,
          }),
        null,
        b.token,
      )
    ).status,
    403,
  );
  assert.equal((await f.db.all("SELECT * FROM account_lives")).length, 1);
  const sync = await f.call(
    "/player/state/sync",
    { baseRevision: 0, state: cloudGameState(e.data.initialPlayer) },
    a.token,
  );
  assert.equal(sync.status, 200);
  const state = (await f.call("/player/state", null, a.token)).data.state;
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.coordinates.universe.xyz, null);
  assert.equal(state.coordinates.universe.anchorAddress, "0.00011520");
  const forged = structuredClone(state);
  forged.coordinates.universe.xyz = { x: 1, y: 2, z: 3 };
  assert.throws(() => validateState(forged, e.data.playerId));
  assert.ok(
    !JSON.stringify(await f.db.all("SELECT * FROM accounts")).includes(a.email),
  );
  assert.ok(!JSON.stringify(f.logs).includes(a.email));
});
test("verification rejects wrong, expired, replay and browser/purpose substitution; concurrent signup once", async (t) => {
  const f = await fixture(t),
    mail = await f.request("one@example.test");
  const body = { token: mail.token, purpose: "signup", browserSecret };
  for (const patch of [
    { token: "ff".repeat(32) },
    { browserSecret: "00".repeat(32) },
    { purpose: "login" },
  ])
    assert.equal(
      (await f.call("/account/email/verify", { ...body, ...patch })).status,
      401,
    );
  const pair = await Promise.all([
    f.call("/account/email/verify", body),
    f.call("/account/email/verify", body),
  ]);
  assert.equal(pair.filter((r) => r.status === 200).length, 1);
  assert.equal((await f.call("/account/email/verify", body)).status, 401);
  assert.equal((await f.db.all("SELECT * FROM accounts")).length, 1);
  const expired = await f.request("expired@example.test");
  f.tick(600001);
  assert.equal(
    (
      await f.call("/account/email/verify", {
        token: expired.token,
        purpose: "signup",
        browserSecret,
      })
    ).status,
    401,
  );
});
test("email enumeration, resend throttle, resend invalidation and CSRF", async (t) => {
  const f = await fixture(t),
    a = await f.signup();
  f.tick(60001);
  const existing = await f.call("/account/email/request", {
    email: a.email,
    purpose: "signup",
    browserSecret,
  });
  const missing = await f.call("/account/email/request", {
    email: "missing@example.test",
    purpose: "login",
    browserSecret,
  });
  const throttled = await f.call("/account/email/request", {
    email: "missing@example.test",
    purpose: "login",
    browserSecret,
  });
  assert.deepEqual(existing, missing);
  assert.deepEqual(missing, throttled);
  const m1 = await f.request("resend@example.test");
  f.tick(60001);
  const m2 = await f.request("resend@example.test");
  assert.notEqual(m1.token, m2.token);
  assert.equal(
    (
      await f.call("/account/email/verify", {
        token: m1.token,
        purpose: "signup",
        browserSecret,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await f.call(
        "/account/email/request",
        { email: "csrf@example.test", purpose: "signup", browserSecret },
        null,
        id(),
        "https://evil.test",
      )
    ).status,
    403,
  );
});
test("account recovery requires established email and saved code, revokes sessions and rejects replay", async (t) => {
  const f = await fixture(t),
    a = await f.signup();
  await f.call("/account/life/enroll", {}, a.token);
  f.tick(60001);
  const m = await f.request(a.email, "recovery"),
    body = { token: m.token, purpose: "recovery", browserSecret };
  assert.equal((await f.call("/account/email/verify", body)).status, 401);
  const recovered = await f.call("/account/email/verify", {
    ...body,
    recoveryCode: a.data.recoveryCodes[0],
  });
  assert.equal(recovered.status, 200);
  assert.equal((await f.call("/account/me", null, a.token)).status, 401);
  assert.equal(
    (await f.call("/account/me", null, recovered.token)).status,
    200,
  );
  assert.equal(
    (
      await f.call("/account/email/verify", {
        ...body,
        recoveryCode: a.data.recoveryCodes[0],
      })
    ).status,
    401,
  );
  await f.api.flushEmail();
  assert.ok(f.email.messages.some((m) => m.type === "SECURITY_NOTIFICATION"));
  f.tick(1800001);
  assert.equal(
    (await f.call("/account/me", null, recovered.token)).status,
    401,
  );
});
test("email change needs fresh session plus offline code and new verification; ownership preserved", async (t) => {
  const f = await fixture(t),
    a = await f.signup(),
    e = await f.call("/account/life/enroll", {}, a.token);
  const mail = await f.request("changed@example.test", "change", a.token),
    body = { token: mail.token, purpose: "change", browserSecret };
  assert.equal(
    (await f.call("/account/email/verify", body, a.token)).status,
    401,
  );
  const changed = await f.call(
    "/account/email/verify",
    { ...body, recoveryCode: a.data.recoveryCodes[0] },
    a.token,
  );
  assert.equal(changed.status, 200);
  assert.equal((await f.call("/account/me", null, a.token)).status, 401);
  const me = await f.call("/account/me", null, changed.token);
  assert.equal(me.data.playerId, e.data.playerId);
  assert.equal(me.data.accountId, a.data.accountId);
  await f.api.flushEmail();
  assert.equal(
    f.email.messages.filter((m) => m.type === "SECURITY_NOTIFICATION").length,
    2,
  );
  assert.equal(
    (await f.call("/account/passkeys/remove", {}, changed.token)).status,
    403,
  );
});
test("wallet binding, wrong signer, takeover rejection and expired step-up", async (t) => {
  const f = await fixture(t),
    a = await f.signup(),
    b = await f.signup(),
    ea = await f.call("/account/life/enroll", {}, a.token),
    eb = await f.call("/account/life/enroll", {}, b.token),
    w = Wallet.createRandom();
  const path = (p) =>
    "/auth/challenge?" +
    new URLSearchParams({ walletAddress: w.address, chainId: 97, playerId: p });
  const c = (await f.call(path(ea.data.playerId), null, a.token)).data;
  const body = {
    challengeId: c.challengeId,
    walletAddress: w.address,
    chainId: 97,
    domain: origin,
    recoveryCode: a.data.recoveryCodes[0],
    signature: await Wallet.createRandom().signMessage(c.message),
  };
  assert.equal((await f.call("/auth/verify", body, a.token)).status, 401);
  body.signature = await w.signMessage(c.message);
  assert.equal((await f.call("/auth/verify", body, a.token)).status, 200);
  assert.equal(
    (await f.call(path(eb.data.playerId), null, b.token)).status,
    409,
  );
  f.tick(300001);
  assert.equal(
    (await f.call(path(ea.data.playerId), null, a.token)).status,
    403,
  );
  assert.equal((await f.db.all("SELECT * FROM wallet_bindings")).length, 1);
});
test("legacy XYZ migration is lossless local data, no invented universe truth; recovery after identity migration", async (t) => {
  const f = await fixture(t),
    a = await f.signup(),
    e = await f.call("/account/life/enroll", {}, a.token),
    p = e.data.initialPlayer;
  p.lastXYZ = { x: 123, y: -2, z: 88 };
  p.homePlot.xyz = { x: 128, y: -2, z: 88 };
  p.lastWorld = "11520";
  const legacy = cloudGameState(p),
    m = migrate(legacy, p.playerId);
  assert.deepEqual(legacy.player, p);
  assert.deepEqual(m.player.lastXYZ, p.lastXYZ);
  assert.deepEqual(m.coordinates.local.homePlot.xyz, p.homePlot.xyz);
  assert.equal(m.coordinates.universe.xyz, null);
  assert.equal(m.coordinates.universe.anchorAddress, "0.00011520");
  assert.equal(
    coordinateProjection({ ...p, lastWorld: "18888" }).universe.anchorAddress,
    "0.00018888",
  );
  const first = await f.call(
    "/player/state/sync",
    { baseRevision: 0, state: legacy },
    a.token,
  );
  assert.equal(first.status, 200);
  const backup = first.data.snapshot,
    preview = await f.call(
      "/recovery/preview",
      { snapshotId: backup.snapshotId, baseRevision: 1 },
      a.token,
    );
  assert.equal(preview.status, 200);
  const restored = await f.call(
    "/recovery/restore",
    { previewId: preview.data.previewId, baseRevision: 1, confirm: true },
    a.token,
  );
  assert.equal(restored.status, 200);
  const current = (await f.call("/player/state", null, a.token)).data;
  assert.equal(current.revision, 2);
  assert.deepEqual(current.state.player.lastXYZ, p.lastXYZ);
  assert.equal(current.state.coordinates.universe.xyz, null);
  assert.equal(
    (
      await f.call(
        "/player/state/sync",
        { baseRevision: 1, state: legacy },
        a.token,
      )
    ).status,
    409,
  );
  assert.equal((await f.db.all("SELECT * FROM accounts")).length, 1);
});
test("two Accounts race for wallet binding: one winner, no cross-player corruption", async (t) => {
  const f = await fixture(t),
    accounts = [await f.signup(), await f.signup()],
    w = Wallet.createRandom(),
    bodies = [];
  for (const a of accounts) {
    const e = await f.call("/account/life/enroll", {}, a.token);
    const c = (
      await f.call(
        "/auth/challenge?" +
          new URLSearchParams({
            walletAddress: w.address,
            chainId: 97,
            playerId: e.data.playerId,
          }),
        null,
        a.token,
      )
    ).data;
    bodies.push({
      challengeId: c.challengeId,
      walletAddress: w.address,
      chainId: 97,
      domain: origin,
      recoveryCode: a.data.recoveryCodes[0],
      signature: await w.signMessage(c.message),
    });
  }
  const result = await Promise.all(
    accounts.map((a, i) => f.call("/auth/verify", bodies[i], a.token)),
  );
  assert.equal(result.filter((r) => r.status === 200).length, 1);
  assert.equal(result.filter((r) => r.status === 409).length, 1);
  assert.equal((await f.db.all("SELECT * FROM wallet_bindings")).length, 1);
  assert.equal((await f.db.all("SELECT * FROM account_lives")).length, 2);
  const consumed = await f.db.all(
    "SELECT * FROM recovery_codes WHERE consumed=1",
  );
  assert.equal(consumed.length, 1);
});
test("concurrent recovery consumes one code, email collision cannot merge Accounts, idempotency rejects changed body", async (t) => {
  const f = await fixture(t),
    a = await f.signup(),
    b = await f.signup();
  f.tick(60001);
  const mail = await f.request(a.email, "recovery"),
    body = {
      token: mail.token,
      purpose: "recovery",
      browserSecret,
      recoveryCode: a.data.recoveryCodes[0],
    };
  const outcomes = await Promise.all([
    f.call("/account/email/verify", body),
    f.call("/account/email/verify", body),
  ]);
  assert.equal(outcomes.filter((r) => r.status === 200).length, 1);
  const recovered = outcomes.find((r) => r.status === 200);
  f.tick(60001);
  const collision = await f.call(
    "/account/email/request",
    { email: b.email, purpose: "change", browserSecret },
    recovered.token,
  );
  assert.equal(collision.status, 202);
  await f.api.flushEmail();
  assert.ok(
    !f.email.messages.some((m) => m.to === b.email && m.purpose === "change"),
  );
  const key = id(),
    enroll = await f.call("/account/life/enroll", {}, recovered.token, key),
    replay = await f.call("/account/life/enroll", {}, recovered.token, key);
  assert.equal(enroll.status, 200);
  assert.equal(replay.data.playerId, enroll.data.playerId);
  assert.equal(
    (
      await f.call(
        "/account/life/enroll",
        { legacyPlayerId: enroll.data.playerId },
        recovered.token,
        key,
      )
    ).status,
    409,
  );
  assert.equal((await f.db.all("SELECT * FROM accounts")).length, 2);
});
test("existing schema1 current gets pre-migration snapshot and remains recoverable with Account auth", async (t) => {
  const f = await fixture(t),
    a = await f.signup(),
    e = await f.call("/account/life/enroll", {}, a.token),
    legacy = cloudGameState(e.data.initialPlayer),
    p = e.data.playerId;
  await f.db.atomic([
    {
      sql: "INSERT INTO player_state VALUES(?,1,?,1,?)",
      params: [p, 1700000000000, JSON.stringify(legacy)],
    },
    {
      sql: "INSERT INTO state_revisions VALUES(?,1,?,?,1)",
      params: [p, JSON.stringify(legacy), 1700000000000],
    },
  ]);
  const synced = await f.call(
    "/player/state/sync",
    { baseRevision: 1, state: legacy },
    a.token,
  );
  assert.equal(synced.status, 200);
  const snapshots = (await f.call("/backups", null, a.token)).data.snapshots,
    old = snapshots.find((s) => s.reason === "pre-migration");
  assert.equal(old.schemaVersion, 1);
  const exported = (
    await f.call("/backups/" + old.snapshotId + "/export", null, a.token)
  ).data;
  assert.deepEqual(exported.payload, legacy);
  assert.equal(exported.manifest.contentHash, await hash(legacy));
  const preview = await f.call(
    "/recovery/preview",
    { snapshotId: old.snapshotId, baseRevision: 2 },
    a.token,
  );
  assert.equal(preview.status, 200);
  const restored = await f.call(
    "/recovery/restore",
    { previewId: preview.data.previewId, baseRevision: 2, confirm: true },
    a.token,
  );
  assert.equal(restored.status, 200);
  const state = (await f.call("/player/state", null, a.token)).data;
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.revision, 3);
  assert.deepEqual(state.state.player.lastXYZ, legacy.player.lastXYZ);
});

function deferredRecovery() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const settleRecovery = () => new Promise((resolve) => setImmediate(resolve));

async function recoveryEntryFixture({
  autoStart = false,
  healthWait,
  factoryError,
  realStorage,
  serverPlayer,
} = {}) {
  const source = await readFile(
    new URL("../web/app.mjs", import.meta.url),
    "utf8",
  );
  const nodes = new Map(),
    calls = [],
    stores = [],
    mutations = [],
    clouds = [],
    events = [];
  const preparations = [],
    mutationWaits = new Map(),
    apiWaits = new Map();
  const storage = realStorage ?? {},
    player = serverPlayer ?? {
      playerId: "recovery-player",
      level: 2,
      xp: 12,
      lastWorld: "11520",
    };
  let selectedPlayer = player,
    availablePlayers = [player],
    serverRevision = 7;
  let handlerAssignments = 0,
    factoryCalls = 0,
    accountHasLife = true,
    accountId = "account-a",
    accountPlayer = player,
    verificationCalls = 0,
    verificationResult = {
      accountId: "account-a",
      recoveryCodes: ["test-only-code"],
    };
  const downloads = [],
    blobs = new Map();
  const element = () =>
    new Proxy(
      {
        hidden: true,
        value: "",
        checked: false,
        disabled: false,
        addEventListener() {},
        append() {},
        replaceChildren() {},
        scrollIntoView() {},
        click() {
          if (this.download)
            downloads.push({
              filename: this.download,
              blob: blobs.get(this.href),
            });
        },
      },
      {
        set(target, key, value) {
          if (key === "onclick" || key === "onchange") handlerAssignments++;
          target[key] = value;
          return true;
        },
      },
    );
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    },
    createElement: element,
  };
  function mutate(kind, store, args, commit) {
    const mutation = { kind, store, args, committed: false };
    mutations.push(mutation);
    const finish = () => {
      const result = commit();
      mutation.committed = true;
      events.push({ kind: kind + "-committed", store });
      return result;
    };
    const wait = mutationWaits.get(kind)?.shift();
    return wait ? wait.promise.then(finish) : finish();
  }
  const storeFactory = (options) => {
    factoryCalls++;
    if (factoryError) throw factoryError;
    assert.equal(options.storage, storage);
    let own = selectedPlayer;
    const ownedPlayers = [...availablePlayers];
    const store = realStorage
      ? createLocalPlayerStore(options)
      : {
          activePlayer: () => own,
          listPlayers: () => ownedPlayers,
          snapshot: () => ({ revision: 4 }),
          select: (p) => {
            own = p;
          },
          activatePlayer: (...args) =>
            mutate("select", store, args, () => {
              own = ownedPlayers.find((p) => p.playerId === args[0]);
              selectedPlayer = own;
              return own;
            }),
          restoreGameBackup: (...args) =>
            mutate("restore", store, args, () => own),
          importPlayer: (...args) =>
            mutate("import", store, args, () => {
              own = JSON.parse(args[0]).player;
              selectedPlayer = own;
              if (!ownedPlayers.some((p) => p.playerId === own.playerId))
                ownedPlayers.push(own);
              if (!availablePlayers.some((p) => p.playerId === own.playerId))
                availablePlayers.push(own);
              return own;
            }),
          ensurePlayer: () => {
            throw new Error("UNEXPECTED_GUEST_CREATION");
          },
          createPlayer: () => {
            throw new Error("UNEXPECTED_GUEST_CREATION");
          },
          migrateLegacy: () => {
            throw new Error("UNEXPECTED_MIGRATION");
          },
        };
    stores.push(store);
    const wait = preparations.shift();
    return wait ? wait.promise.then(() => store) : store;
  };
  const cloudFactory = ({ localStore, storage: cloudStorage }) => {
    assert.equal(cloudStorage, storage);
    assert.ok(stores.includes(localStore));
    const cloud = {
      localStore,
      refresh: async () => {
        events.push({ kind: "cloud-refresh", store: localStore });
      },
      status: () => ({ status: "SYNCED", pending: false }),
      enqueue() {
        events.push({ kind: "enqueue", store: localStore });
      },
      flush: async () => {
        events.push({ kind: "flush", store: localStore });
        return { status: "SYNCED" };
      },
      acceptServerRevision: (...args) => {
        mutations.push({ kind: "accept", localStore, args });
        events.push({ kind: "accept", store: localStore });
      },
    };
    clouds.push(cloud);
    return cloud;
  };
  const fetch = async (url, options) => {
    const path = url.replace("/api/v1", "");
    calls.push({ path, options });
    const responses = {
      "/health": { localDemo: true },
      "/player/me": { playerId: accountPlayer.playerId },
      "/player/state": {
        revision: serverRevision,
        health: "HEALTHY",
        state: { player: accountPlayer },
      },
      "/backups": { snapshots: [] },
      "/account/email/verify": structuredClone(verificationResult),
      "/account/me": {
        accountId,
        playerId: accountHasLife ? accountPlayer.playerId : null,
      },
      "/account/life/enroll": {
        accountId,
        playerId: accountPlayer.playerId,
        initialPlayer: accountPlayer,
      },
      "/recovery/preview": {
        previewId: "preview-test",
        expectedRevision: serverRevision,
        summary: {
          current: { ...player, lastXYZ: { x: 0, y: 0, z: 0 } },
          candidate: { ...player, lastXYZ: { x: 1, y: 0, z: 0 } },
        },
      },
      "/recovery/restore": {
        revision: serverRevision + 1,
        recoveryReceipt: { recoveryReceiptId: "test-receipt" },
      },
    };
    assert.ok(path in responses, `Unexpected Recovery API request: ${path}`);
    let status = 200;
    if (path === "/account/email/verify" && verificationCalls++ > 0) {
      status = 400;
      responses[path] = { code: "IDENTITY_TOKEN_INVALID" };
    }
    if (path === "/health" && healthWait) await healthWait;
    const wait = apiWaits.get(path)?.shift();
    if (wait) await wait.promise;
    return {
      status,
      ok: status === 200,
      headers: { get: () => "application/json" },
      json: async () => responses[path],
    };
  };
  // Execute the production function body with local dependencies. Only module
  // syntax and, for explicit-start tests, the existing page-entry call are removed.
  let executable = source
    .replace(/^import[\s\S]*?from "[^"\n]+";\n/gm, "")
    .replace(/^export (?=function startRecoveryCenter)/m, "");
  if (!autoStart)
    executable = executable.replace(
      /\nstartRecoveryCenter\(\)\.catch\([\s\S]*$/,
      "\n",
    );
  const start = new Function(
    "createLocalPlayerStore",
    "createPlayerCloudSync",
    "PLAYER_LIFE_SCHEMA",
    "PLAYER_LIFE_SCOPE",
    "document",
    "localStorage",
    "fetch",
    "crypto",
    "confirm",
    "URL",
    "setTimeout",
    executable + "\nreturn startRecoveryCenter;",
  )(
    autoStart
      ? storeFactory
      : () => {
          throw new Error("BYPASSED_RECOVERY_FACTORY");
        },
    cloudFactory,
    "test-schema",
    "test-scope",
    document,
    storage,
    fetch,
    { randomUUID: () => "test-request-id" },
    () => true,
    {
      createObjectURL(blob) {
        const url = "blob:test-" + blobs.size;
        blobs.set(url, blob);
        return url;
      },
      revokeObjectURL() {},
    },
    (fn) => fn(),
  );
  const queue = (map, key) => {
    const wait = deferredRecovery();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(wait);
    return wait;
  };
  return {
    source,
    start,
    storeFactory,
    nodes,
    stores,
    mutations,
    clouds,
    calls,
    events,
    player,
    downloads,
    setAccount(id, nextPlayer = player) {
      accountId = id;
      accountPlayer = nextPlayer;
    },
    setVerificationResult(result) {
      verificationResult = result;
      verificationCalls = 0;
    },
    handlerAssignments: () => handlerAssignments,
    factoryCalls: () => factoryCalls,
    requestEnrollment: () => {
      accountHasLife = false;
    },
    deferPreparation() {
      const wait = deferredRecovery();
      preparations.push(wait);
      return wait;
    },
    deferMutation: (kind) => queue(mutationWaits, kind),
    deferAPI: (path) => queue(apiWaits, path),
    setServerRevision: (revision) => {
      serverRevision = revision;
    },
    changeSelection(p, players = [p, player]) {
      selectedPlayer = p;
      availablePlayers = players;
    },
  };
}

test("Recovery entry explicit startup memoizes in-flight/completed initialization", async () => {
  let releaseHealth;
  const healthWait = new Promise((resolve) => {
    releaseHealth = resolve;
  });
  const f = await recoveryEntryFixture({ healthWait });
  assert.equal(f.stores.length, 0);
  assert.equal(f.calls.length, 0);
  assert.equal(f.handlerAssignments(), 0);
  const first = f.start({ storeFactory: f.storeFactory });
  assert.equal(f.start({ storeFactory: f.storeFactory }), first);
  await settleRecovery();
  assert.equal(f.stores.length, 1);
  assert.equal(f.calls.filter((c) => c.path === "/health").length, 1);
  const wired = f.handlerAssignments();
  assert.ok(wired > 0);
  releaseHealth();
  await first;
  assert.equal(f.stores.length, 2);
  const handlers = [...f.nodes.values()].map((n) => [n.onclick, n.onchange]);
  assert.equal(f.start({ storeFactory: f.storeFactory }), first);
  await first;
  assert.equal(f.handlerAssignments(), wired);
  assert.deepEqual(
    [...f.nodes.values()].map((n) => [n.onclick, n.onchange]),
    handlers,
  );
  assert.equal(f.calls.filter((c) => c.path === "/health").length, 1);
  assert.equal(f.stores.length, 2);
  assert.throws(
    () => f.start({ storeFactory: () => {} }),
    /RECOVERY_CENTER_ALREADY_STARTED/,
  );
});

test("Recovery entry centralizes startup, refresh, sync and apply stores without changing enrollment", async () => {
  const f = await recoveryEntryFixture();
  assert.match(f.source, /export function startRecoveryCenter/);
  assert.equal(
    (f.source.match(/storeFactory\(\{ storage: localStorage \}\)/g) ?? [])
      .length,
    1,
  );
  assert.equal((f.source.match(/createLegacyStore\(\)/g) ?? []).length, 4);
  assert.doesNotMatch(f.source, /createLocalPlayerStore\(/);
  await f.start({ storeFactory: f.storeFactory });
  assert.equal(f.stores.length, 2);
  await f.nodes.get("refresh").onclick();
  assert.equal(f.stores.length, 3);
  await f.nodes.get("sync").onclick();
  assert.equal(f.stores.length, 5);
  assert.equal(f.nodes.get("message").textContent, "本機旅程已同步。");
  await f.nodes.get("apply").onclick();
  assert.equal(f.stores.length, 7);
  const restored = f.mutations.find((m) => m.kind === "restore");
  assert.equal(restored.store, f.stores[5]);
  assert.deepEqual(restored.args[1], {
    expectedRevision: 4,
    confirmGameRestore: true,
  });
  assert.equal(
    f.mutations.find((m) => m.kind === "accept").localStore,
    restored.store,
  );
  f.requestEnrollment();
  await f.nodes.get("verifyEmail").onclick();
  assert.equal(f.stores.length, 8);
  assert.equal(f.mutations.find((m) => m.kind === "import").store, f.stores[6]);
  assert.equal(
    f.calls.filter((c) => c.path === "/account/life/enroll").length,
    1,
  );
  assert.equal(f.nodes.get("dashboard").hidden, false);
});

test("Recovery entry still auto-starts from the existing app module", async () => {
  const f = await recoveryEntryFixture({ autoStart: true });
  assert.match(f.source, /\nstartRecoveryCenter\(\)\.catch\(/);
  await f.start();
  assert.equal(f.calls.filter((c) => c.path === "/health").length, 1);
  assert.equal(f.stores.length, 2);
  assert.equal(f.nodes.get("demo").hidden, false);
  assert.equal(f.nodes.get("message").textContent, "已載入玩家生命。");
});

test("Recovery entry preserves startup failure without silently creating a second consumer", async () => {
  const failure = new Error("TEST_STORE_UNAVAILABLE");
  const f = await recoveryEntryFixture({
    autoStart: true,
    factoryError: failure,
  });
  const failedStart = f.start();
  await assert.rejects(failedStart, (error) => error === failure);
  assert.equal(f.start(), failedStart);
  await assert.rejects(f.start(), (error) => error === failure);
  assert.equal(f.factoryCalls(), 1);
  assert.equal(f.handlerAssignments(), 0);
  assert.equal(f.calls.length, 0);
  assert.equal(f.nodes.get("message").textContent, failure.message);
});

test("Recovery entry awaits startup preparation and memoizes asynchronous rejection without fallback", async () => {
  for (const reject of [false, true]) {
    const f = await recoveryEntryFixture();
    const wait = f.deferPreparation();
    const started = f.start({ storeFactory: f.storeFactory });
    await settleRecovery();
    assert.equal(f.factoryCalls(), 1);
    assert.equal(f.handlerAssignments(), 0);
    assert.equal(f.calls.length, 0);
    assert.equal(f.mutations.length, 0);
    if (reject) {
      wait.reject(new Error("PREPARATION_REJECTED"));
      await assert.rejects(started, /PREPARATION_REJECTED/);
      assert.equal(f.start({ storeFactory: f.storeFactory }), started);
      assert.equal(f.factoryCalls(), 1);
      assert.equal(f.handlerAssignments(), 0);
      assert.equal(f.calls.length, 0);
    } else {
      wait.resolve();
      await started;
      assert.equal(f.factoryCalls(), 2);
      assert.equal(f.nodes.get("message").textContent, "已載入玩家生命。");
    }
  }
});

test("Recovery entry awaits refresh, sync and apply preparations and fails closed on each rejection", async () => {
  for (const action of ["refresh", "sync", "apply"]) {
    for (const reject of [false, true]) {
      const f = await recoveryEntryFixture();
      await f.start({ storeFactory: f.storeFactory });
      const before = {
        calls: f.calls.length,
        events: f.events.length,
        stores: f.factoryCalls(),
      };
      const wait = f.deferPreparation();
      const pending = f.nodes.get(action).onclick();
      await settleRecovery();
      assert.equal(f.factoryCalls(), before.stores + 1);
      assert.equal(f.calls.length, before.calls);
      assert.equal(f.events.length, before.events);
      assert.equal(f.mutations.length, 0);
      assert.equal(f.nodes.get("message").textContent, "已載入玩家生命。");
      if (reject) wait.reject(new Error("PREPARATION_REJECTED"));
      else wait.resolve();
      await pending;
      if (reject) {
        assert.equal(f.calls.length, before.calls);
        assert.equal(f.factoryCalls(), before.stores + 1);
        assert.equal(f.events.length, before.events);
        assert.equal(f.mutations.length, 0);
        assert.equal(
          f.nodes.get("message").textContent,
          "PREPARATION_REJECTED",
        );
      } else {
        assert.ok(f.calls.length > before.calls);
        if (action === "sync")
          assert.ok(f.events.some((event) => event.kind === "enqueue"));
        if (action === "apply")
          assert.ok(
            f.mutations.some(
              (mutation) => mutation.kind === "restore" && mutation.committed,
            ),
          );
      }
    }
  }
});

test("Recovery entry rejects out-of-order preparation results and stale rejections", async () => {
  for (const rejectOlder of [false, true]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    const olderWait = f.deferPreparation();
    const older = f.nodes.get("refresh").onclick();
    const olderStore = f.stores.at(-1);
    const newerWait = f.deferPreparation();
    const newer = f.nodes.get("refresh").onclick();
    const newerStore = f.stores.at(-1);
    f.setServerRevision(9);
    newerWait.resolve();
    await newer;
    const calls = f.calls.length,
      events = f.events.length;
    f.nodes.get("message").textContent = "newer context";
    if (rejectOlder) olderWait.reject(new Error("OLD_PREPARATION_FAILURE"));
    else olderWait.resolve();
    await older;
    assert.equal(f.calls.length, calls);
    assert.equal(f.events.length, events);
    assert.equal(f.nodes.get("message").textContent, "newer context");
    assert.equal(f.nodes.get("revision").textContent, 9);
    assert.equal(f.clouds.at(-1).localStore, newerStore);
    assert.ok(!f.clouds.some((cloud) => cloud.localStore === olderStore));
  }
});

test("Recovery entry rejects a changed selection during preparation and a mismatched prepared store", async () => {
  for (const change of ["context", "prepared"]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    const wait = f.deferPreparation(),
      calls = f.calls.length;
    const pending = f.nodes.get("apply").onclick();
    const other = { ...f.player, playerId: "other-player" };
    if (change === "context") f.stores.at(-2).select(other);
    else f.stores.at(-1).select(other);
    wait.resolve();
    await pending;
    assert.equal(f.calls.length, calls);
    assert.equal(f.mutations.length, 0);
    assert.equal(f.events.filter((event) => event.kind === "accept").length, 0);
    assert.match(f.nodes.get("message").textContent, /本機玩家已變更/);
  }
});

test("Recovery entry enrollment waits for import commit acknowledgement before enqueue or success", async () => {
  for (const reject of [false, true]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    f.requestEnrollment();
    f.changeSelection(null, []);
    await f.nodes.get("refresh").onclick();
    const wait = f.deferMutation("import"),
      stores = f.factoryCalls();
    const pending = f.nodes.get("verifyEmail").onclick();
    await settleRecovery();
    assert.equal(f.mutations.length, 1);
    assert.equal(f.mutations[0].committed, false);
    assert.equal(f.factoryCalls(), stores);
    assert.ok(!f.events.some((event) => event.kind === "enqueue"));
    assert.equal(
      f.nodes.get("message").textContent,
      "已重新載入本機與雲端旅程狀態。",
    );
    if (reject) wait.reject(new Error("IMPORT_REJECTED"));
    else wait.resolve();
    await pending;
    if (reject) {
      assert.equal(f.mutations[0].committed, false);
      assert.equal(f.factoryCalls(), stores);
      assert.ok(!f.events.some((event) => event.kind === "enqueue"));
      assert.equal(f.nodes.get("message").textContent, "IMPORT_REJECTED");
    } else {
      const committed = f.events.findIndex(
        (event) => event.kind === "import-committed",
      );
      const enqueued = f.events.findIndex((event) => event.kind === "enqueue");
      assert.ok(committed >= 0 && enqueued > committed);
      assert.equal(f.events[committed].store, f.events[enqueued].store);
      assert.match(f.nodes.get("message").textContent, /^已登入 Account/);
    }
  }
});

test("Recovery entry selection acknowledgement precedes restore and failed selection never imports a fallback", async () => {
  for (const reject of [false, true]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    f.changeSelection({ ...f.player, playerId: "other-player" });
    await f.nodes.get("refresh").onclick();
    const wait = f.deferMutation("select"),
      stores = f.factoryCalls();
    const pending = f.nodes.get("apply").onclick();
    await settleRecovery();
    assert.deepEqual(
      f.mutations.map((mutation) => mutation.kind),
      ["select"],
    );
    assert.equal(f.mutations[0].committed, false);
    assert.equal(f.factoryCalls(), stores + 1);
    if (reject) wait.reject(new Error("SELECTION_REJECTED"));
    else wait.resolve();
    await pending;
    assert.ok(!f.mutations.some((mutation) => mutation.kind === "import"));
    if (reject) {
      assert.deepEqual(
        f.mutations.map((mutation) => mutation.kind),
        ["select"],
      );
      assert.equal(f.factoryCalls(), stores + 1);
      assert.equal(f.nodes.get("message").textContent, "SELECTION_REJECTED");
    } else {
      assert.deepEqual(
        f.mutations.map((mutation) => mutation.kind),
        ["select", "restore", "accept"],
      );
      assert.equal(f.mutations[0].committed, true);
      assert.equal(f.mutations[1].committed, true);
    }
  }
});

test("Recovery entry restore and new-device import finish before revision acceptance, refresh and success", async () => {
  for (const kind of ["restore", "import"]) {
    for (const reject of [false, true]) {
      const f = await recoveryEntryFixture();
      await f.start({ storeFactory: f.storeFactory });
      if (kind === "import") {
        f.changeSelection(null, []);
        await f.nodes.get("refresh").onclick();
      }
      const wait = f.deferMutation(kind),
        stores = f.factoryCalls();
      const pending = f.nodes.get("apply").onclick();
      await settleRecovery();
      assert.equal(f.mutations.length, 1);
      assert.equal(f.mutations[0].committed, false);
      assert.equal(f.factoryCalls(), stores + 1);
      assert.ok(!f.events.some((event) => event.kind === "accept"));
      assert.equal(
        f.nodes.get("message").textContent,
        kind === "import"
          ? "已重新載入本機與雲端旅程狀態。"
          : "已載入玩家生命。",
      );
      if (reject) wait.reject(new Error("LOCAL_COMMIT_REJECTED"));
      else wait.resolve();
      await pending;
      if (reject) {
        assert.equal(f.mutations[0].committed, false);
        assert.equal(f.factoryCalls(), stores + 1);
        assert.ok(!f.events.some((event) => event.kind === "accept"));
        assert.equal(
          f.nodes.get("message").textContent,
          "LOCAL_COMMIT_REJECTED",
        );
      } else {
        const committed = f.events.findIndex(
          (event) => event.kind === kind + "-committed",
        );
        const accepted = f.events.findIndex((event) => event.kind === "accept");
        assert.ok(committed >= 0 && accepted > committed);
        assert.equal(f.events[committed].store, f.events[accepted].store);
        assert.equal(f.factoryCalls(), stores + 2);
        assert.equal(
          f.nodes.get("message").textContent,
          "雲端旅程已載入本機，原本資料已保護保存。",
        );
      }
    }
  }
});

test("Recovery entry suppresses stale post-commit effects without claiming to cancel an acknowledged commit", async () => {
  for (const change of ["selection", "newer-action"]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    const wait = f.deferMutation("restore");
    const pending = f.nodes.get("apply").onclick();
    await settleRecovery();
    if (change === "selection")
      f.stores.at(-1).select({ ...f.player, playerId: "other-player" });
    else await f.nodes.get("refresh").onclick();
    const calls = f.calls.length,
      stores = f.factoryCalls();
    f.nodes.get("message").textContent = "newer context";
    wait.resolve();
    await pending;
    assert.equal(f.mutations[0].committed, true);
    assert.equal(f.calls.length, calls);
    assert.equal(f.factoryCalls(), stores);
    assert.ok(!f.events.some((event) => event.kind === "accept"));
    if (change === "selection")
      assert.match(f.nodes.get("message").textContent, /本機玩家已變更/);
    else assert.equal(f.nodes.get("message").textContent, "newer context");
  }
});

test("Recovery entry ignores older server projections and late restore results after cancel", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const oldState = f.deferAPI("/player/state");
  const oldRefresh = f.nodes.get("refresh").onclick();
  await settleRecovery();
  f.setServerRevision(11);
  await f.nodes.get("refresh").onclick();
  oldState.resolve();
  await oldRefresh;
  assert.equal(f.nodes.get("revision").textContent, 11);
  f.nodes.get("import").files = [{ size: 10, text: async () => "{}" }];
  await f.nodes.get("import").onchange();
  f.nodes.get("confirm").checked = true;
  const restore = f.deferAPI("/recovery/restore");
  const pending = f.nodes.get("restore").onclick();
  await settleRecovery();
  f.nodes.get("cancel").onclick();
  f.nodes.get("message").textContent = "preview closed";
  const calls = f.calls.length;
  restore.resolve();
  await pending;
  assert.equal(f.calls.length, calls);
  assert.equal(f.nodes.get("preview").hidden, true);
  assert.equal(f.nodes.get("receipt")?.textContent, undefined);
  assert.equal(f.nodes.get("message").textContent, "preview closed");
});

test("Recovery entry initial refresh rejection keeps the original owner and exposes failure without enrollment", async () => {
  const health = deferredRecovery();
  const f = await recoveryEntryFixture({ healthWait: health.promise });
  const pending = f.start({ storeFactory: f.storeFactory });
  await settleRecovery();
  const prepare = f.deferPreparation();
  health.resolve();
  await settleRecovery();
  prepare.reject(new Error("PREPARATION_REJECTED"));
  await pending;
  assert.equal(f.factoryCalls(), 2);
  assert.deepEqual(
    f.calls.map((call) => call.path),
    ["/health"],
  );
  assert.equal(f.mutations.length, 0);
  assert.equal(f.clouds.length, 0);
  assert.equal(f.nodes.get("dashboard")?.hidden, undefined);
  assert.equal(f.nodes.get("message").textContent, "PREPARATION_REJECTED");
});

test("Recovery entry out-of-order local commits only advance the newest presentation and revision acceptance", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const firstCommit = f.deferMutation("restore");
  const first = f.nodes.get("apply").onclick();
  await settleRecovery();
  const secondCommit = f.deferMutation("restore");
  const second = f.nodes.get("apply").onclick();
  await settleRecovery();
  assert.equal(f.mutations.length, 2);
  const firstStore = f.mutations[0].store,
    secondStore = f.mutations[1].store;
  assert.notEqual(firstStore, secondStore);
  secondCommit.resolve();
  await second;
  const accepted = f.events.filter((event) => event.kind === "accept");
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].store, secondStore);
  f.nodes.get("message").textContent = "newer completed operation";
  const calls = f.calls.length,
    stores = f.factoryCalls();
  firstCommit.resolve();
  await first;
  assert.equal(f.mutations[0].committed, true);
  assert.equal(f.mutations[1].committed, true);
  assert.equal(f.calls.length, calls);
  assert.equal(f.factoryCalls(), stores);
  assert.equal(f.events.filter((event) => event.kind === "accept").length, 1);
  assert.equal(f.nodes.get("message").textContent, "newer completed operation");
});

test("Recovery entry stale enrollment acknowledgement cannot enqueue or refresh the new context", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  f.requestEnrollment();
  f.changeSelection(null, []);
  await f.nodes.get("refresh").onclick();
  const commit = f.deferMutation("import");
  const pending = f.nodes.get("verifyEmail").onclick();
  await settleRecovery();
  await f.nodes.get("refresh").onclick();
  f.nodes.get("message").textContent = "newer account view";
  const calls = f.calls.length,
    stores = f.factoryCalls();
  commit.resolve();
  await pending;
  assert.equal(f.mutations[0].committed, true);
  assert.equal(f.calls.length, calls);
  assert.equal(f.factoryCalls(), stores);
  assert.ok(!f.events.some((event) => event.kind === "enqueue"));
  assert.equal(f.nodes.get("message").textContent, "newer account view");
});

test("Recovery entry cloud restore waits for acknowledgement before receipt, refresh and success", async () => {
  for (const reject of [false, true]) {
    const f = await recoveryEntryFixture();
    await f.start({ storeFactory: f.storeFactory });
    f.nodes.get("import").files = [{ size: 10, text: async () => "{}" }];
    await f.nodes.get("import").onchange();
    f.nodes.get("confirm").checked = true;
    const commit = f.deferAPI("/recovery/restore");
    const stores = f.factoryCalls();
    const pending = f.nodes.get("restore").onclick();
    await settleRecovery();
    assert.equal(f.factoryCalls(), stores);
    assert.equal(f.nodes.get("receipt")?.textContent, undefined);
    assert.equal(f.nodes.get("message").textContent, "已載入玩家生命。");
    if (reject) commit.reject(new Error("SERVER_RESTORE_REJECTED"));
    else commit.resolve();
    await pending;
    if (reject) {
      assert.equal(f.factoryCalls(), stores);
      assert.equal(f.nodes.get("receipt")?.textContent, undefined);
      assert.equal(
        f.nodes.get("message").textContent,
        "SERVER_RESTORE_REJECTED",
      );
    } else {
      assert.equal(f.factoryCalls(), stores + 1);
      assert.match(f.nodes.get("receipt").textContent, /test-receipt/);
      assert.equal(f.nodes.get("message").textContent, "恢復成功。");
    }
  }
});

test("Recovery entry default remains legacy and does not enable canonical admission, promotion or fallback", async () => {
  const f = await recoveryEntryFixture();
  assert.match(f.source, /storeFactory = createLocalPlayerStore/);
  assert.doesNotMatch(
    f.source,
    /indexedDB|createAtomic|prepareCanonical|ensurePlayer\(|createPlayer\(|migrateLegacy\(/,
  );
  assert.deepEqual(
    [...f.source.matchAll(/from "([^"]+)"/g)].map((match) => match[1]),
    [
      "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs",
      "../../../K線西遊記/temples/11520/runtime/player-cloud-sync.mjs",
    ],
  );
});

test("Recovery entry explicit refresh adopts external selection from real private legacy snapshots without writes", async () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const owner = createLocalPlayerStore({ storage });
  const a = owner.createPlayer(),
    b = owner.createPlayer();
  owner.activatePlayer(a.playerId);
  const f = await recoveryEntryFixture({
    realStorage: storage,
    serverPlayer: a,
  });
  await f.start({ storeFactory: f.storeFactory });
  const retained = f.stores.at(-1);
  createLocalPlayerStore({ storage }).activatePlayer(b.playerId);
  const durable = [...values];
  assert.equal(retained.activePlayer().playerId, a.playerId);
  for (let count = 0; count < 2; count++) {
    const calls = f.calls.length;
    await f.nodes.get("refresh").onclick();
    assert.ok(f.calls.length > calls);
    assert.equal(f.stores.at(-1).activePlayer().playerId, b.playerId);
    assert.equal(f.nodes.get("sync").disabled, true);
    assert.equal(
      f.nodes.get("message").textContent,
      "已重新載入本機與雲端旅程狀態。",
    );
    assert.deepEqual([...values], durable);
  }
  assert.equal(retained.activePlayer().playerId, a.playerId);
});

test("Recovery entry mutation preparation reports external selection conflict and explicit refresh remains usable", async () => {
  for (const action of ["sync", "apply"]) {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const owner = createLocalPlayerStore({ storage });
    const a = owner.createPlayer(),
      b = owner.createPlayer();
    owner.activatePlayer(a.playerId);
    const f = await recoveryEntryFixture({
      realStorage: storage,
      serverPlayer: a,
    });
    await f.start({ storeFactory: f.storeFactory });
    createLocalPlayerStore({ storage }).activatePlayer(b.playerId);
    const durable = [...values],
      calls = f.calls.length;
    await f.nodes.get(action).onclick();
    assert.match(f.nodes.get("message").textContent, /本機玩家已變更/);
    assert.equal(f.calls.length, calls);
    assert.deepEqual([...values], durable);
    assert.ok(
      !f.events.some((event) => ["enqueue", "accept"].includes(event.kind)),
    );
    await f.nodes.get("refresh").onclick();
    assert.equal(f.stores.at(-1).activePlayer().playerId, b.playerId);
    // A new explicit Apply still targets the displayed server Player, through
    // the existing selection and restore owners and the existing confirmation.
    await f.nodes.get("apply").onclick();
    assert.equal(
      createLocalPlayerStore({ storage }).activePlayer().playerId,
      a.playerId,
    );
    assert.equal(
      f.nodes.get("message").textContent,
      "雲端旅程已載入本機，原本資料已保護保存。",
    );
  }
});

test("Recovery entry newer explicit read supersedes an older private-snapshot preparation", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const wait = f.deferPreparation();
  const older = f.nodes.get("refresh").onclick();
  const oldStore = f.stores.at(-1);
  const b = { ...f.player, playerId: "other-player" };
  f.changeSelection(b);
  assert.equal(oldStore.activePlayer().playerId, f.player.playerId);
  await f.nodes.get("refresh").onclick();
  const calls = f.calls.length;
  wait.resolve();
  await older;
  assert.equal(f.calls.length, calls);
  assert.equal(f.stores.at(-1).activePlayer().playerId, b.playerId);
  assert.equal(f.nodes.get("sync").disabled, true);
});

test("Recovery entry double verification click shares the one-use request and retains its successful result", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const wait = f.deferAPI("/account/email/verify");
  const first = f.nodes.get("verifyEmail").onclick();
  await settleRecovery();
  const second = f.nodes.get("verifyEmail").onclick();
  assert.equal(second, first);
  assert.equal(
    f.calls.filter((call) => call.path === "/account/email/verify").length,
    1,
  );
  wait.resolve();
  await Promise.all([first, second]);
  assert.match(f.nodes.get("message").textContent, /^已登入 Account/);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
  assert.equal(await f.downloads[0].blob.text(), "test-only-code");
});

test("Recovery entry unrelated refresh cannot discard committed one-use verification output", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const wait = f.deferAPI("/account/email/verify");
  const pending = f.nodes.get("verifyEmail").onclick();
  await f.nodes.get("refresh").onclick();
  wait.resolve();
  await pending;
  assert.match(f.nodes.get("message").textContent, /^已登入 Account/);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
  assert.equal(await f.downloads[0].blob.text(), "test-only-code");
});

test("Recovery entry replay failure and no-code same-account success preserve earlier one-time material", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  await f.nodes.get("verifyEmail").onclick();
  await f.nodes.get("verifyEmail").onclick();
  assert.equal(f.nodes.get("message").textContent, "IDENTITY_TOKEN_INVALID");
  await f.nodes.get("saveCodes").onclick();
  assert.equal(await f.downloads[0].blob.text(), "test-only-code");
  f.setVerificationResult({ accountId: "account-a" });
  await f.nodes.get("verifyEmail").onclick();
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 2);
  assert.equal(await f.downloads[1].blob.text(), "test-only-code");
});

test("Recovery entry successful verification remains bound to its originating Account after context change", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  f.requestEnrollment();
  const wait = f.deferAPI("/account/email/verify");
  const pending = f.nodes.get("verifyEmail").onclick();
  f.setAccount("account-b");
  wait.resolve();
  await pending;
  assert.match(f.nodes.get("message").textContent, /Account 已變更/);
  assert.equal(
    f.calls.filter((call) => call.path === "/account/life/enroll").length,
    0,
  );
  assert.equal(f.mutations.length, 0);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 0);
  assert.match(f.nodes.get("message").textContent, /Account 已變更/);
  f.setAccount("account-a");
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
  assert.equal(await f.downloads[0].blob.text(), "test-only-code");
});

test("Recovery entry rejects enrollment for a different Account after a valid originating-account precheck", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  f.requestEnrollment();
  const wait = f.deferAPI("/account/me");
  const pending = f.nodes.get("verifyEmail").onclick();
  await settleRecovery();
  f.setAccount("account-b");
  wait.resolve();
  await pending;
  assert.equal(
    f.calls.filter((call) => call.path === "/account/life/enroll").length,
    1,
  );
  assert.equal(f.mutations.length, 0);
  assert.ok(!f.events.some((event) => event.kind === "enqueue"));
  assert.match(f.nodes.get("message").textContent, /Account 已變更/);
  f.setAccount("account-a");
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
});

test("Recovery entry existing-life follow-through rejects a different server Player after account precheck", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  const wait = f.deferAPI("/account/me");
  const pending = f.nodes.get("verifyEmail").onclick();
  await settleRecovery();
  f.setAccount("account-a", {
    ...f.player,
    playerId: "different-account-life",
  });
  wait.resolve();
  await pending;
  assert.equal(f.mutations.length, 0);
  assert.match(f.nodes.get("message").textContent, /Account 已變更/);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
});

test("Recovery entry changed local Player prevents enrollment but preserves Account-bound codes", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  f.requestEnrollment();
  const wait = f.deferAPI("/account/email/verify");
  const pending = f.nodes.get("verifyEmail").onclick();
  f.changeSelection({ ...f.player, playerId: "other-local-player" });
  await f.nodes.get("refresh").onclick();
  wait.resolve();
  await pending;
  assert.equal(
    f.calls.filter((call) => call.path === "/account/life/enroll").length,
    0,
  );
  assert.equal(f.mutations.length, 0);
  assert.match(f.nodes.get("message").textContent, /本機玩家已變更/);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
});

test("Recovery entry download cannot publish a retained record replaced by another Account while awaiting", async () => {
  const f = await recoveryEntryFixture();
  await f.start({ storeFactory: f.storeFactory });
  await f.nodes.get("verifyEmail").onclick();
  const wait = f.deferAPI("/account/me");
  const pending = f.nodes.get("saveCodes").onclick();
  await settleRecovery();
  f.setAccount("account-b");
  f.setVerificationResult({
    accountId: "account-b",
    recoveryCodes: ["other-test-only-code"],
  });
  await f.nodes.get("verifyEmail").onclick();
  wait.resolve();
  await pending;
  assert.equal(f.downloads.length, 0);
  await f.nodes.get("saveCodes").onclick();
  assert.equal(f.downloads.length, 1);
  assert.equal(await f.downloads[0].blob.text(), "other-test-only-code");
});
