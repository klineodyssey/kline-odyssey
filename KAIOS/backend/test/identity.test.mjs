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
