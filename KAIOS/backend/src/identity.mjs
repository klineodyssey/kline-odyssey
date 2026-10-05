import { createLocalPlayerStore } from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
import { hash, id, stmt, requireThat, fields, Problem } from "./primitives.mjs";

// Mailbox and migration proof are different authorities. No public-ID fallback.
export class EmailProviderAdapter {
  async send() {
    throw new Problem("EMAIL_PROVIDER_NOT_CONFIGURED", 503);
  }
}
export class TestEmailProvider extends EmailProviderAdapter {
  constructor() {
    super();
    this.messages = [];
  }
  async send(message) {
    this.messages.push(structuredClone(message));
  }
}
export class KYCProviderAdapter {
  async status() {
    return { status: "NOT_CONFIGURED", proofing: "NONE" };
  }
}
export class LifeEnrollmentAuthority {
  async verify() {
    return false;
  }
}
export function normalizeEmail(value) {
  requireThat(
    typeof value === "string" && value.length <= 254,
    "INVALID_EMAIL",
  );
  const v = value.trim();
  requireThat(
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(
      v,
    ),
    "INVALID_EMAIL",
  );
  const [local, domain] = v.split("@");
  requireThat(
    !local.startsWith(".") &&
      !local.endsWith(".") &&
      !local.includes("..") &&
      !domain.includes("..") &&
      domain
        .split(".")
        .every((label) =>
          /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label),
        ),
    "INVALID_EMAIL",
  );
  return local + "@" + domain.toLowerCase();
}
const secret = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
const hex = (bytes) =>
  Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
const bytes = (value) =>
  new Uint8Array(value.match(/../g).map((x) => parseInt(x, 16)));
export function createIdentity({
  database: db,
  config,
  email = new EmailProviderAdapter(),
  enrollment = new LifeEnrollmentAuthority(),
  now = Date.now,
}) {
  async function key(use) {
    requireThat(
      typeof config.identityKey === "string" &&
        /^[0-9a-f]{64}$/.test(config.identityKey),
      "IDENTITY_KEY_NOT_CONFIGURED",
      503,
    );
    return crypto.subtle.importKey(
      "raw",
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(config.identityKey + ":" + use),
      ),
      use === "encrypt"
        ? { name: "AES-GCM" }
        : { name: "HMAC", hash: "SHA-256" },
      false,
      use === "encrypt" ? ["encrypt", "decrypt"] : ["sign"],
    );
  }
  async function lookup(address) {
    return hex(
      new Uint8Array(
        await crypto.subtle.sign(
          "HMAC",
          await key("lookup"),
          new TextEncoder().encode("email:" + address),
        ),
      ),
    );
  }
  async function encrypt(address) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return (
      hex(iv) +
      ":" +
      hex(
        new Uint8Array(
          await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            await key("encrypt"),
            new TextEncoder().encode(address),
          ),
        ),
      )
    );
  }
  async function decrypt(cipher) {
    const [iv, data] = cipher.split(":");
    return new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes(iv) },
        await key("encrypt"),
        bytes(data),
      ),
    );
  }
  const response = (data, status = 200, headers = {}) =>
    Response.json(data, {
      status,
      headers: { "cache-control": "no-store", ...headers },
    });
  const cookie = (token) =>
    `kaios_account=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800${config.secureCookies === false ? "" : "; Secure"}`;
  async function session(request) {
    const token =
      request.headers.get("authorization")?.replace(/^Bearer /, "") ??
      request.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)kaios_account=([^;]+)/)?.[1];
    requireThat(token && token.length <= 128, "ACCOUNT_AUTH_REQUIRED", 401);
    const s = await db.get(
      "SELECT s.*,a.email_lookup,a.email_cipher,a.revision,l.player_id FROM account_sessions s JOIN accounts a ON a.account_id=s.account_id LEFT JOIN account_lives l ON l.account_id=a.account_id WHERE s.token_hash=? AND s.expires_at>? AND s.account_revision=a.revision",
      [await hash(token), now()],
    );
    requireThat(s, "SESSION_EXPIRED", 401);
    return s;
  }
  const audit = (a, op) =>
    stmt("INSERT INTO identity_audit VALUES(?,?,?,?)", id(), a, op, now());
  function issue(a, revision, token) {
    return stmt(
      "INSERT INTO account_sessions VALUES(?,?,?,?,?)",
      token,
      a,
      revision,
      now(),
      now() + 1800000,
    );
  }
  async function consume(t) {
    return [
      stmt(
        "INSERT INTO identity_guards VALUES(?,?,?)",
        id(),
        t.token_hash,
        now(),
      ),
      stmt(
        "UPDATE identity_tokens SET consumed=1 WHERE token_hash=?",
        t.token_hash,
      ),
    ];
  }
  async function checkCode(accountId, code) {
    requireThat(
      typeof code === "string" && code.length === 64,
      "RECOVERY_CODE_INVALID",
      401,
    );
    const h = await hash(code),
      r = await db.get(
        "SELECT * FROM recovery_codes WHERE code_hash=? AND account_id=? AND consumed=0",
        [h, accountId],
      );
    requireThat(r, "RECOVERY_CODE_INVALID", 401);
    return [
      stmt("INSERT INTO recovery_guards VALUES(?,?,?)", id(), h, accountId),
      stmt("UPDATE recovery_codes SET consumed=1 WHERE code_hash=?", h),
    ];
  }
  async function outbox(message) {
    return stmt(
      "INSERT INTO identity_outbox VALUES(?,?,?,NULL)",
      id(),
      await encrypt(JSON.stringify(message)),
      now(),
    );
  }
  async function flushEmail() {
    const pending = await db.all(
      "SELECT * FROM identity_outbox WHERE delivered_at IS NULL ORDER BY created_at LIMIT 20",
    );
    for (const row of pending) {
      await email.send({
        ...JSON.parse(await decrypt(row.payload_cipher)),
        deliveryId: row.message_id,
      });
      await db.atomic([
        stmt(
          "UPDATE identity_outbox SET delivered_at=? WHERE message_id=?",
          now(),
          row.message_id,
        ),
      ]);
    }
  }
  async function notification(cipher, event) {
    return outbox({
      to: await decrypt(cipher),
      type: "SECURITY_NOTIFICATION",
      event,
    });
  }
  async function handle(request, path, body) {
    if (!path.startsWith("/account/")) return null;
    if (path === "/account/me" && request.method === "GET") {
      const s = await session(request);
      return response({
        accountId: s.account_id,
        playerId: s.player_id,
        assurance: "GAME_ONLY",
        assetAccess: "BLOCKED",
        revision: s.revision,
      });
    }
    requireThat(request.method === "POST", "METHOD_NOT_ALLOWED", 405);
    const operationKey = request.headers.get("idempotency-key");
    requireThat(
      operationKey && /^[a-zA-Z0-9_-]{8,128}$/.test(operationKey),
      "IDEMPOTENCY_KEY_REQUIRED",
    );
    const protectedPath = ["/account/life/enroll", "/account/logout"].includes(
      path,
    );
    const owner = protectedPath
      ? (await session(request)).account_id
      : "anonymous";
    const scope = owner + ":" + path,
      requestHash = await hash({ path, body });
    const previous = await db.get(
      "SELECT * FROM identity_requests WHERE scope=? AND key=?",
      [scope, operationKey],
    );
    if (previous) {
      requireThat(
        previous.request_hash === requestHash,
        "IDEMPOTENCY_MISMATCH",
        409,
      );
      return response(JSON.parse(previous.result));
    }
    async function commit(statements, result) {
      try {
        await db.atomic([
          ...statements,
          stmt(
            "INSERT INTO identity_requests VALUES(?,?,?,?,?)",
            scope,
            operationKey,
            requestHash,
            JSON.stringify(result),
            now(),
          ),
          stmt("DELETE FROM account_guards"),
        ]);
      } catch (error) {
        const complete = await db.get(
          "SELECT * FROM identity_requests WHERE scope=? AND key=?",
          [scope, operationKey],
        );
        if (complete) {
          requireThat(
            complete.request_hash === requestHash,
            "IDEMPOTENCY_MISMATCH",
            409,
          );
          const replay = new Error("IDENTITY_REPLAY");
          replay.reply = response(JSON.parse(complete.result));
          throw replay;
        }
        throw error;
      }
    }
    const accountGuard = (s) =>
      stmt(
        "INSERT INTO account_guards VALUES(?,?,?)",
        id(),
        s.account_id,
        s.revision,
      );

    if (path === "/account/email/request") {
      fields(body, ["email", "purpose", "browserSecret"]);
      requireThat(
        ["signup", "login", "recovery", "change"].includes(body.purpose),
        "INVALID_PURPOSE",
      );
      requireThat(
        typeof body.browserSecret === "string" &&
          /^[0-9a-f]{64}$/.test(body.browserSecret),
        "BROWSER_BINDING_REQUIRED",
      );
      const address = normalizeEmail(body.email),
        l = await lookup(address),
        cipher = await encrypt(address),
        t = now();
      const s = body.purpose === "change" ? await session(request) : null;
      const bucket = "email:" + l,
        old = await db.get("SELECT * FROM identity_budgets WHERE bucket=?", [
          bucket,
        ]);
      // The same body/status on throttle and account existence prevents enumeration.
      if (
        old &&
        (t - old.last_sent < 60000 ||
          (t - old.window_start < 3600000 && old.count >= 5))
      )
        return response({ status: "CHECK_EMAIL_IF_ELIGIBLE" }, 202);
      const account = await db.get(
        "SELECT * FROM accounts WHERE email_lookup=?",
        [l],
      );
      const eligible =
        body.purpose === "signup"
          ? !account
          : body.purpose === "change"
            ? !account
            : !!account;
      const token = secret();
      await commit(
        [
          stmt(
            "INSERT INTO identity_budgets VALUES(?,?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN excluded.last_sent-identity_budgets.window_start>=3600000 THEN 1 ELSE identity_budgets.count+1 END,window_start=CASE WHEN excluded.last_sent-identity_budgets.window_start>=3600000 THEN excluded.last_sent ELSE identity_budgets.window_start END,last_sent=excluded.last_sent",
            bucket,
            t,
            t,
          ),
          stmt(
            "UPDATE identity_tokens SET consumed=1 WHERE email_lookup=? AND purpose=?",
            l,
            body.purpose,
          ),
          ...(eligible
            ? [
                await outbox({
                  to: address,
                  type: "VERIFY_EMAIL",
                  purpose: body.purpose,
                  token,
                  expiresAt: t + 600000,
                }),
              ]
            : []),
          stmt(
            "INSERT INTO identity_tokens VALUES(?,?,?,?,?,?,?,0,?)",
            await hash(token),
            body.purpose,
            l,
            cipher,
            s?.account_id ?? account?.account_id ?? null,
            await hash(body.browserSecret),
            t + 600000,
            t,
          ),
        ],
        { status: "CHECK_EMAIL_IF_ELIGIBLE" },
      );
      // Test provider only in this candidate. Production dispatch must use a private outbox.

      return response({ status: "CHECK_EMAIL_IF_ELIGIBLE" }, 202);
    }
    if (path === "/account/email/verify") {
      fields(body, ["token", "browserSecret", "purpose", "recoveryCode"]);
      requireThat(
        typeof body.token === "string" && /^[0-9a-f]{64}$/.test(body.token),
        "IDENTITY_TOKEN_INVALID",
        401,
      );
      const t = await db.get(
        "SELECT * FROM identity_tokens WHERE token_hash=?",
        [await hash(body.token)],
      );
      requireThat(
        t &&
          !t.consumed &&
          t.expires_at > now() &&
          t.purpose === body.purpose &&
          t.browser_hash === (await hash(body.browserSecret ?? "")),
        "IDENTITY_TOKEN_INVALID",
        401,
      );
      const existing = await db.get(
        "SELECT * FROM accounts WHERE email_lookup=?",
        [t.email_lookup],
      );
      let a = existing?.account_id,
        revision = existing?.revision,
        statements = await consume(t),
        recoveryCode,
        recoveryCodes;
      const token = secret();
      if (t.purpose === "signup") {
        requireThat(!existing, "IDENTITY_TOKEN_INVALID", 401);
        a = id();
        revision = 1;
        recoveryCode = secret();
        recoveryCodes = Array.from({ length: 7 }, secret);
        statements.push(
          stmt(
            "INSERT INTO accounts VALUES(?,?,?,1,?,?)",
            a,
            t.email_lookup,
            t.email_cipher,
            now(),
            now(),
          ),
          stmt(
            "INSERT INTO recovery_codes VALUES(?,?,0,?)",
            await hash(recoveryCode),
            a,
            now(),
          ),
        );
        for (const code of recoveryCodes)
          statements.push(
            stmt(
              "INSERT INTO recovery_codes VALUES(?,?,0,?)",
              await hash(code),
              a,
              now(),
            ),
          );
        recoveryCodes.unshift(recoveryCode);
      } else if (t.purpose === "change") {
        const s = await session(request);
        requireThat(
          s.account_id === t.account_id && !existing,
          "IDENTITY_TOKEN_INVALID",
          401,
        );
        requireThat(now() - s.created_at <= 300000, "STEP_UP_REQUIRED", 403);
        statements.push(
          accountGuard(s),
          ...(await checkCode(s.account_id, body.recoveryCode)),
        );
        a = s.account_id;
        revision = s.revision + 1;
        recoveryCode = secret();
        statements.push(await notification(s.email_cipher, "EMAIL_CHANGED"));
        statements.push(
          stmt(
            "UPDATE accounts SET email_lookup=?,email_cipher=?,revision=?,updated_at=? WHERE account_id=?",
            t.email_lookup,
            t.email_cipher,
            revision,
            now(),
            a,
          ),
          stmt("DELETE FROM account_sessions WHERE account_id=?", a),
          stmt(
            "INSERT INTO recovery_codes VALUES(?,?,0,?)",
            await hash(recoveryCode),
            a,
            now(),
          ),
        );
      } else {
        requireThat(
          existing && existing.account_id === t.account_id,
          "IDENTITY_TOKEN_INVALID",
          401,
        );
        if (t.purpose === "recovery") {
          statements.push(
            accountGuard(existing),
            ...(await checkCode(a, body.recoveryCode)),
          );
          revision++;
          recoveryCode = secret();
          statements.push(
            stmt(
              "UPDATE accounts SET revision=?,updated_at=? WHERE account_id=?",
              revision,
              now(),
              a,
            ),
            stmt("DELETE FROM account_sessions WHERE account_id=?", a),
            stmt(
              "INSERT INTO recovery_codes VALUES(?,?,0,?)",
              await hash(recoveryCode),
              a,
              now(),
            ),
          );
        }
      }
      statements.push(
        issue(a, revision, await hash(token)),
        audit(a, t.purpose),
        stmt("DELETE FROM identity_guards"),
        stmt("DELETE FROM recovery_guards"),
      );
      if (["recovery", "change"].includes(t.purpose))
        statements.push(
          await notification(t.email_cipher, "ACCOUNT_SECURITY_CHANGED"),
        );
      await commit(statements, {
        accountId: a,
        assurance: "GAME_ONLY",
        status: "COMPLETED_REAUTHENTICATE_IF_COOKIE_LOST",
      });

      return response(
        {
          accountId: a,
          assurance: "GAME_ONLY",
          ...(recoveryCodes
            ? { recoveryCodes }
            : recoveryCode
              ? { recoveryCode }
              : {}),
        },
        200,
        { "set-cookie": cookie(token) },
      );
    }
    if (path === "/account/life/enroll") {
      fields(body, ["legacyPlayerId", "migrationProof"]);
      const s = await session(request);
      requireThat(!s.player_id, "LIFE_ALREADY_ENROLLED", 409);
      const store = createLocalPlayerStore({ storage: null, now });
      store.createPlayer();
      const initialPlayer = store.activePlayer();
      let p = initialPlayer.playerId;
      if (body.legacyPlayerId) {
        requireThat(
          await enrollment.verify({
            accountId: s.account_id,
            playerId: body.legacyPlayerId,
            proof: body.migrationProof,
          }),
          "LEGACY_ENROLLMENT_PROOF_REQUIRED",
          403,
        );
        p = body.legacyPlayerId;
      }
      requireThat(/^KAIOS-P-[0-9a-f]{32}$/.test(p), "INVALID_PLAYER_ID");
      await commit(
        [
          accountGuard(s),
          stmt(
            "INSERT INTO players VALUES(?,?,?,?,1) ON CONFLICT(player_id) DO NOTHING",
            p,
            p,
            now(),
            now(),
          ),
          stmt(
            "INSERT INTO account_lives VALUES(?,?,?)",
            s.account_id,
            p,
            now(),
          ),
          audit(s.account_id, "LIFE_ENROLL"),
        ],
        { accountId: s.account_id, playerId: p },
      );
      return response({
        accountId: s.account_id,
        playerId: p,
        ...(!body.legacyPlayerId ? { initialPlayer } : {}),
      });
    }
    if (path === "/account/logout") {
      const s = await session(request);
      await commit(
        [stmt("DELETE FROM account_sessions WHERE token_hash=?", s.token_hash)],
        { status: "SIGNED_OUT" },
      );
      return response({ status: "SIGNED_OUT" }, 200, {
        "set-cookie":
          "kaios_account=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
      });
    }
    throw new Problem("ACCOUNT_ACTION_NOT_AVAILABLE", 403);
  }
  async function pruneExpired() {
    await db.atomic([
      stmt("DELETE FROM identity_tokens WHERE expires_at<?", now() - 86400000),
      stmt("DELETE FROM identity_outbox WHERE created_at<?", now() - 86400000),
      stmt("DELETE FROM account_sessions WHERE expires_at<?", now()),
      stmt("DELETE FROM identity_budgets WHERE last_sent<?", now() - 86400000),
      stmt(
        "DELETE FROM recovery_codes WHERE consumed=1 AND created_at<?",
        now() - 2592000000,
      ),
    ]);
  }
  async function securityEvent(account, event) {
    return [
      audit(account.account_id, event),
      await notification(account.email_cipher, event),
    ];
  }
  return {
    handle,
    session,
    checkCode,
    flushEmail,
    pruneExpired,
    securityEvent,
  };
}
