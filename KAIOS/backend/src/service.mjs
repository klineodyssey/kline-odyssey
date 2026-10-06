import { createIdentity } from "./identity.mjs";
import { createCustomerProjectPrototype, captureCustomerProjectContext } from "../../../core/company/index.mjs";
import {
  Problem,
  requireThat,
  fields,
  integer,
  address,
  playerId,
  canonical,
  hash,
  id,
  stmt,
  RateLimiter,
} from "./primitives.mjs";
import {
  validateState,
  gamePlayer,
  migrate,
  validateImport,
  backupPackage,
  same,
} from "./model.mjs";
export function createBackend({
  database: db,
  objects,
  realtime,
  queue,
  signatureVerifier,
  emailProvider,
  enrollmentAuthority,
  config,
  now = Date.now,
  logger = () => {},
  limiter = new RateLimiter(),
}) {
  const identity = createIdentity({
    database: db,
    config,
    email: emailProvider,
    enrollment: enrollmentAuthority,
    now,
  });
  const domain = config.domain,
    origins = config.origins,
    chainIds = config.chainIds ?? [97];
  requireThat(
    domain && Array.isArray(origins) && origins.length,
    "INVALID_CONFIGURATION",
  );
  const json = (data, status = 200, headers = {}) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "content-type": "application/json;charset=utf-8",
        "cache-control": "no-store",
        ...headers,
      },
    });
  const getState = async (p) => {
    const s = await db.get("SELECT * FROM player_state WHERE player_id=?", [p]);
    return s
      ? {
          revision: s.revision,
          updatedAt: s.updated_at,
          schemaVersion: s.schema_version,
          state: JSON.parse(s.payload),
        }
      : null;
  };
  const guard = (p, revision) =>
    stmt("INSERT INTO mutation_guards VALUES(?,?,?)", id(), p, revision);
  const clearGuards = () => stmt("DELETE FROM mutation_guards");
  const meta = (s) => ({
    snapshotId: s.snapshot_id,
    playerId: s.player_id,
    schemaVersion: s.schema_version,
    createdAt: s.created_at,
    sourceRevision: s.source_revision,
    contentHash: s.content_hash,
    reason: s.reason,
    payloadReference: s.payload_reference,
  });
  async function ownedSnapshot(p, sid) {
    const s = await db.get(
      "SELECT * FROM snapshots WHERE snapshot_id=? AND player_id=?",
      [sid, p],
    );
    requireThat(s, "SNAPSHOT_NOT_FOUND", 404);
    return meta(s);
  }
  async function loadSnapshot(s) {
    let payload;
    try {
      payload = JSON.parse(await objects.get(s.payloadReference));
    } catch {
      throw new Problem("CORRUPTED", 422);
    }
    requireThat((await hash(payload)) === s.contentHash, "CORRUPTED", 422);
    requireThat(
      payload.player?.playerId === s.playerId &&
        payload.schemaVersion === s.schemaVersion,
      "CORRUPTED",
      422,
    );
    return payload;
  }
  async function stage(p, payload, revision, reason) {
    const operationId = id(),
      snapshotId = id(),
      contentHash = await hash(payload),
      payloadReference = snapshotId + ".json",
      createdAt = now();
    await db.atomic([
      stmt(
        "INSERT INTO staging_operations VALUES(?,?,?,?,?,?)",
        operationId,
        p,
        payloadReference,
        contentHash,
        "PREPARING",
        createdAt,
      ),
    ]);
    await objects.putImmutable(payloadReference, canonical(payload));
    requireThat(
      (await hash(JSON.parse(await objects.get(payloadReference)))) ===
        contentHash,
      "OBJECT_VERIFY_FAILED",
      503,
    );
    await db.atomic([
      stmt(
        "UPDATE staging_operations SET phase=? WHERE operation_id=?",
        "OBJECT_READY",
        operationId,
      ),
    ]);
    const snapshot = {
      snapshotId,
      playerId: p,
      schemaVersion: payload.schemaVersion,
      createdAt,
      sourceRevision: revision,
      contentHash,
      reason,
      payloadReference,
    };
    return {
      snapshot,
      statements: [
        stmt(
          "INSERT INTO snapshots VALUES(?,?,?,?,?,?,?,?)",
          snapshotId,
          p,
          payload.schemaVersion,
          createdAt,
          revision,
          contentHash,
          reason,
          payloadReference,
        ),
        stmt(
          "UPDATE staging_operations SET phase=? WHERE operation_id=?",
          "COMMITTED",
          operationId,
        ),
      ],
    };
  }
  function stateStatements(p, v, revision) {
    const payload = canonical(v),
      t = now();
    const statements = [
      stmt(
        "INSERT INTO player_state VALUES(?,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET revision=excluded.revision,updated_at=excluded.updated_at,schema_version=excluded.schema_version,payload=excluded.payload",
        p,
        revision,
        t,
        v.schemaVersion,
        payload,
      ),
      stmt(
        "INSERT INTO state_revisions VALUES(?,?,?,?,?)",
        p,
        revision,
        payload,
        t,
        v.schemaVersion,
      ),
      stmt(
        "UPDATE players SET updated_at=?,schema_version=? WHERE player_id=?",
        t,
        v.schemaVersion,
        p,
      ),
      stmt("UPDATE conflicts SET resolved=1 WHERE player_id=?", p),
    ];
    for (const r of v.gameReceipts)
      statements.push(
        stmt(
          "INSERT INTO game_receipts VALUES(?,?,?,?) ON CONFLICT(player_id,receipt_id) DO NOTHING",
          r.receiptId,
          p,
          canonical(r),
          r.completedAt,
        ),
      );
    for (const m of v.missions)
      statements.push(
        stmt(
          "INSERT INTO logistics_projections VALUES(?,?,?,?,?) ON CONFLICT(player_id,mission_id) DO UPDATE SET revision=excluded.revision,updated_at=excluded.updated_at,payload=excluded.payload",
          m.missionId,
          p,
          revision,
          t,
          canonical(m),
        ),
      );
    return statements;
  }
  async function authenticate(request) {
    const session = await identity.session(request);
    requireThat(session.player_id, "LIFE_ENROLLMENT_REQUIRED", 403);
    return session.player_id;
  }

  async function route(request, context) {
    const url = new URL(request.url),
      path = url.pathname.replace(/^\/api\/v1/, "");
    requireThat(url.pathname.startsWith("/api/v1/"), "NOT_FOUND", 404);
    const method = request.method;
    if (path === "/health" && method === "GET") {
      await db.get("SELECT 1");
      return json({
        status: "HEALTHY",
        schemaVersion: 2,
        multiplayerRealtime: "FOUNDATION_ONLY",
        localDemo: config.localDemo === true,
        authority: {
          blockchain: "financial/on-chain",
          backend: "game/sync/recovery",
          github: "code/specification",
        },
      });
    }
    if (path === "/auth/challenge" && method === "GET") {
      const account = await identity.session(request);
      requireThat(
        account.player_id &&
          account.player_id === url.searchParams.get("playerId"),
        "PLAYER_OWNERSHIP_REQUIRED",
        403,
      );
      requireThat(
        now() - account.created_at <= 300000,
        "STEP_UP_REQUIRED",
        403,
      );
      const wallet = url.searchParams.get("walletAddress")?.toLowerCase(),
        chainId = Number(url.searchParams.get("chainId")),
        requested = url.searchParams.get("playerId");
      requireThat(
        address(wallet) && chainIds.includes(chainId) && playerId(requested),
        "INVALID_AUTH_CONTEXT",
      );
      const binding = await db.get(
        "SELECT player_id FROM wallet_bindings WHERE wallet_address=? AND chain_id=?",
        [wallet, chainId],
      );
      requireThat(
        !binding || binding.player_id === requested,
        "WALLET_BINDING_CONFLICT",
        409,
      );
      const p = requested;
      const challengeId = id(),
        nonce = id(),
        issuedAt = now(),
        expiresAt = issuedAt + 300000;
      const message = `KAIOS Account wallet binding\nDomain: ${domain}\nWallet: ${wallet}\nChain: ${chainId}\nPlayer: ${p}\nNonce: ${nonce}\nIssuedAt: ${issuedAt}\nExpiresAt: ${expiresAt}\nWallet binding only; not Account recovery, transaction or financial authorization.`;
      await db.atomic([
        stmt(
          "INSERT INTO auth_challenges VALUES(?,?,?,?,?,?,?,?,?,0)",
          challengeId,
          p,
          wallet,
          chainId,
          domain,
          nonce,
          issuedAt,
          expiresAt,
          message,
        ),
      ]);
      return json({
        challengeId,
        playerId: p,
        walletAddress: wallet,
        chainId,
        domain,
        nonce,
        issuedAt,
        expiresAt,
        message,
      });
    }
    // Every POST is bounded and requires an idempotency key, including authentication.
    requireThat(["GET", "POST"].includes(method), "METHOD_NOT_ALLOWED", 405);
    let body = null,
      key = null,
      requestHash = null;
    if (method === "POST") {
      const reader = request.body?.getReader();
      let raw = "",
        size = 0;
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > config.maxRequestBytes) {
            await reader.cancel();
            throw new Problem("REQUEST_TOO_LARGE", 413);
          }
          raw += decoder.decode(value, { stream: true });
        }
        raw += decoder.decode();
      }
      requireThat(
        new TextEncoder().encode(raw).length < config.maxRequestBytes,
        "REQUEST_TOO_LARGE",
        413,
      );
      try {
        body = JSON.parse(raw);
      } catch {
        throw new Problem("INVALID_JSON");
      }
      key = request.headers.get("idempotency-key");
      requireThat(
        key && /^[a-zA-Z0-9_-]{8,128}$/.test(key),
        "IDEMPOTENCY_KEY_REQUIRED",
      );
      requestHash = await hash({ path, body });
    }
    const accountResponse = await identity.handle(request, path, body);
    if (accountResponse) return accountResponse;
    const p = await authenticate(request);
    context.playerIdHash = p ? await hash(p) : null;
    const scope = (p ?? "auth") + ":" + path;
    const previous =
      method === "POST"
        ? await db.get("SELECT * FROM idempotency WHERE scope=? AND key=?", [
            scope,
            key,
          ])
        : null;
    if (previous) {
      requireThat(
        previous.request_hash === requestHash,
        "IDEMPOTENCY_MISMATCH",
        409,
      );
      return json(JSON.parse(previous.response), previous.status);
    }
    async function commit(statements, result, status = 200) {
      try {
        await db.atomic([
          ...statements,
          stmt(
            "INSERT INTO idempotency VALUES(?,?,?,?,?,?)",
            scope,
            key,
            requestHash,
            canonical(result),
            status,
            now(),
          ),
        ]);
      } catch (error) {
        const completed = await db.get(
          "SELECT * FROM idempotency WHERE scope=? AND key=?",
          [scope, key],
        );
        if (completed) {
          requireThat(
            completed.request_hash === requestHash,
            "IDEMPOTENCY_MISMATCH",
            409,
          );
          return json(JSON.parse(completed.response), completed.status);
        }
        throw error;
      }
      return json(result, status);
    }
    if (path === "/auth/verify" && method === "POST") {
      fields(body, [
        "challengeId",
        "recoveryCode",
        "signature",
        "walletAddress",
        "chainId",
        "domain",
      ]);
      const c = await db.get(
        "SELECT * FROM auth_challenges WHERE challenge_id=?",
        [body.challengeId],
      );
      requireThat(c && c.player_id === p, "PLAYER_OWNERSHIP_REQUIRED", 403);
      const account = await identity.session(request);
      requireThat(
        now() - account.created_at <= 300000,
        "STEP_UP_REQUIRED",
        403,
      );
      requireThat(
        c && !c.consumed && c.expires_at > now(),
        "CHALLENGE_REPLAY_OR_EXPIRED",
        401,
      );
      requireThat(
        body.walletAddress?.toLowerCase() === c.wallet_address &&
          body.chainId === c.chain_id &&
          body.domain === c.domain &&
          c.domain === domain &&
          chainIds.includes(c.chain_id),
        "WRONG_AUTH_CONTEXT",
        401,
      );
      requireThat(
        typeof body.signature === "string" &&
          body.signature.length < 1024 &&
          (await signatureVerifier(
            c.message,
            body.signature,
            c.wallet_address,
            c.challenge_id,
          )),
        "INVALID_SIGNATURE",
        401,
      );
      const recoveryStatements = await identity.checkCode(
        account.account_id,
        body.recoveryCode,
      );
      const token = id() + id(),
        expiresAt = now() + 1800000;
      const result = {
        playerId: c.player_id,
        scope: "WALLET_BINDING_ONLY_NOT_LOGIN",
      };
      const statements = [
        ...recoveryStatements,
        ...(await identity.securityEvent(account, "WALLET_BOUND")),
        stmt(
          "INSERT INTO account_guards VALUES(?,?,?)",
          id(),
          account.account_id,
          account.revision,
        ),
        stmt(
          "INSERT INTO challenge_guards VALUES(?,?,?)",
          id(),
          c.challenge_id,
          now(),
        ),
        stmt(
          "INSERT INTO players VALUES(?,?,?,?,1) ON CONFLICT(player_id) DO NOTHING",
          c.player_id,
          c.player_id,
          now(),
          now(),
        ),
        stmt(
          "INSERT INTO wallet_bindings VALUES(?,?,?,?) ON CONFLICT(wallet_address,chain_id) DO NOTHING",
          c.wallet_address,
          c.chain_id,
          c.player_id,
          now(),
        ),
        stmt(
          "UPDATE auth_challenges SET consumed=1 WHERE challenge_id=?",
          c.challenge_id,
        ),
        stmt(
          "INSERT INTO sessions VALUES(?,?,?,?,?)",
          await hash(token),
          c.challenge_id,
          c.player_id,
          expiresAt,
          now(),
        ),
        stmt("DELETE FROM challenge_guards"),
        stmt("DELETE FROM recovery_guards"),
        stmt("DELETE FROM account_guards"),
      ];
      // Retain the SQL binding guard/proof record, but never mint an Account cookie.
      return commit(statements, result);
    }
    if (path === "/player/me" && method === "GET") {
      const profile = await db.get("SELECT * FROM players WHERE player_id=?", [
        p,
      ]);
      const wallet = await db.get(
        "SELECT wallet_address FROM wallet_bindings WHERE player_id=?",
        [p],
      );
      const s = await getState(p);
      return json({
        playerId: p,
        lifeId: profile.life_id,
        walletAddress: wallet?.wallet_address,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        schemaVersion: profile.schema_version,
        ...(s
          ? {
              revision: s.revision,
              gameProgress: s.state.player.journeyProgress,
              level: s.state.player.level,
              xp: s.state.player.xp,
              lastWorld: s.state.player.lastWorld,
              lastXYZ: s.state.player.lastXYZ,
              homePlotId: s.state.player.homePlotId,
              settings: s.state.player.settings,
            }
          : { revision: 0 }),
      });
    }
    if (path === "/player/state" && method === "GET") {
      const s = await getState(p);
      const conflict = await db.get(
        "SELECT * FROM conflicts WHERE player_id=? AND resolved=0 ORDER BY created_at DESC LIMIT 1",
        [p],
      );
      const snapshots = await db.all(
        "SELECT * FROM snapshots WHERE player_id=? ORDER BY created_at DESC",
        [p],
      );
      let health = s ? "HEALTHY" : "RECOVERY_AVAILABLE";
      if (s && now() - s.updatedAt > 86400000) health = "STALE";
      if (s?.schemaVersion !== undefined && s.schemaVersion !== 2)
        health = "MIGRATION_REQUIRED";
      if (conflict) health = "CONFLICT";
      if (snapshots.length) {
        try {
          await loadSnapshot(meta(snapshots[0]));
        } catch {
          health = "CORRUPTED";
        }
      }
      return json({
        ...(s ?? { revision: 0, state: null }),
        health,
        lastBackup: snapshots[0] ? meta(snapshots[0]) : null,
        conflict: conflict
          ? {
              conflictId: conflict.conflict_id,
              baseRevision: conflict.base_revision,
              currentRevision: conflict.current_revision,
              candidateState: JSON.parse(conflict.candidate_payload),
              currentState: JSON.parse(conflict.current_payload),
            }
          : null,
      });
    }
    if (path === "/player/state/sync" && method === "POST") {
      fields(body, ["baseRevision", "state"]);
      requireThat(integer(body.baseRevision), "INVALID_REVISION");
      const candidate = migrate(body.state, p),
        current = await getState(p),
        revision = current?.revision ?? 0;
      if (revision !== body.baseRevision) {
        const conflictId = id();
        return commit(
          [
            guard(p, revision),
            stmt(
              "INSERT INTO conflicts VALUES(?,?,?,?,?,?,?,0)",
              conflictId,
              p,
              body.baseRevision,
              revision,
              canonical(current?.state ?? null),
              canonical(candidate),
              now(),
            ),
            clearGuards(),
          ],
          {
            code: "CONFLICT",
            conflictId,
            currentRevision: revision,
            baseRevision: body.baseRevision,
          },
          409,
        );
      }
      const previousPlayer = current?.state.player;
      const milestone =
        previousPlayer &&
        (candidate.player.level > previousPlayer.level ||
          candidate.player.homePlot.houseLevel >
            previousPlayer.homePlot.houseLevel ||
          (candidate.player.journeyProgress.storyComplete === true &&
            previousPlayer.journeyProgress.storyComplete !== true));
      const legacyBackup =
        current && current.schemaVersion !== 2
          ? await stage(p, current.state, revision, "pre-migration")
          : null;
      const backup = await stage(
        p,
        candidate,
        revision + 1,
        milestone ? "milestone" : "sync",
      );
      return commit(
        [
          guard(p, revision),
          ...stateStatements(p, candidate, revision + 1),
          ...backup.statements,
          ...(legacyBackup?.statements ?? []),
          clearGuards(),
        ],
        { revision: revision + 1, updatedAt: now(), snapshot: backup.snapshot },
      );
    }
    if (path === "/backups" && method === "GET")
      return json({
        snapshots: (
          await db.all(
            "SELECT * FROM snapshots WHERE player_id=? ORDER BY created_at DESC,snapshot_id",
            [p],
          )
        ).map(meta),
      });
    if (path === "/backups/create" && method === "POST") {
      fields(body, ["baseRevision", "reason"]);
      requireThat(
        ["manual", "milestone", "pre-migration"].includes(body.reason),
        "INVALID_SNAPSHOT_REASON",
      );
      const s = await getState(p);
      requireThat(s && s.revision === body.baseRevision, "STALE_REVISION", 409);
      const backup = await stage(p, s.state, s.revision, body.reason);
      return commit(
        [guard(p, s.revision), ...backup.statements, clearGuards()],
        { snapshot: backup.snapshot },
      );
    }
    const match = path.match(/^\/backups\/([^/]+)(?:\/(verify|export))?$/);
    if (match && method === "GET") {
      const snapshot = await ownedSnapshot(p, match[1]);
      if (match[2] === "verify") {
        try {
          const payload = await loadSnapshot(snapshot);
          migrate(payload, p);
          return json({ status: "HEALTHY", contentHash: snapshot.contentHash });
        } catch (e) {
          return json(
            {
              status:
                e.message === "CORRUPTED" ? "CORRUPTED" : "MIGRATION_REQUIRED",
            },
            422,
          );
        }
      }
      const payload = await loadSnapshot(snapshot);
      return json(
        match[2] === "export"
          ? await backupPackage(snapshot, payload)
          : { snapshot, payload },
      );
    }
    if (path === "/recovery/preview" && method === "POST") {
      fields(body, ["snapshotId", "package", "conflictId", "baseRevision"]);
      const current = await getState(p);
      requireThat(
        current && current.revision === body.baseRevision,
        "STALE_REVISION",
        409,
      );
      requireThat(
        [body.snapshotId, body.package, body.conflictId].filter(Boolean)
          .length === 1,
        "ONE_RECOVERY_SOURCE_REQUIRED",
      );
      let snapshot,
        candidate,
        statements = [];
      if (body.conflictId) {
        const conflict = await db.get(
          "SELECT * FROM conflicts WHERE conflict_id=? AND player_id=?",
          [body.conflictId, p],
        );
        requireThat(conflict, "CONFLICT_NOT_FOUND", 404);
        candidate = migrate(JSON.parse(conflict.candidate_payload), p);
        const staged = await stage(
          p,
          candidate,
          current.revision,
          "conflict-candidate",
        );
        snapshot = staged.snapshot;
        statements = staged.statements;
      } else if (body.package) {
        candidate = await validateImport(body.package, p);
        const imported = {
          ...body.package.payload,
          player: gamePlayer(body.package.payload.player),
        };
        const staged = await stage(
          p,
          imported,
          current.revision,
          "import-candidate",
        );
        snapshot = staged.snapshot;
        statements = staged.statements;
      } else {
        snapshot = await ownedSnapshot(p, body.snapshotId);
        candidate = migrate(await loadSnapshot(snapshot), p);
      }
      const previewId = id(),
        expiresAt = now() + 300000,
        candidateHash = await hash(candidate);
      const summary = {
        current: {
          level: current.state.player.level,
          xp: current.state.player.xp,
          lastWorld: current.state.player.lastWorld,
          lastXYZ: current.state.player.lastXYZ,
        },
        candidate: {
          level: candidate.player.level,
          xp: candidate.player.xp,
          lastWorld: candidate.player.lastWorld,
          lastXYZ: candidate.player.lastXYZ,
        },
        changed: !same(current.state, candidate),
      };
      return commit(
        [
          guard(p, current.revision),
          ...statements,
          stmt(
            "INSERT INTO recovery_previews VALUES(?,?,?,?,?,?,0)",
            previewId,
            p,
            snapshot.snapshotId,
            current.revision,
            candidateHash,
            expiresAt,
          ),
          clearGuards(),
        ],
        {
          previewId,
          snapshotId: snapshot.snapshotId,
          expectedRevision: current.revision,
          expiresAt,
          summary,
          scope: "BACKEND_GAME_ONLY",
        },
      );
    }
    if (path === "/recovery/restore" && method === "POST") {
      fields(body, ["previewId", "confirm", "baseRevision"]);
      requireThat(body.confirm === true, "HUMAN_CONFIRM_REQUIRED");
      const preview = await db.get(
        "SELECT * FROM recovery_previews WHERE preview_id=? AND player_id=?",
        [body.previewId, p],
      );
      requireThat(
        preview && !preview.consumed && preview.expires_at > now(),
        "RESTORE_REPLAY_OR_EXPIRED",
        409,
      );
      const current = await getState(p);
      requireThat(
        current &&
          current.revision === preview.expected_revision &&
          current.revision === body.baseRevision,
        "STALE_RESTORE",
        409,
      );
      const target = await ownedSnapshot(p, preview.snapshot_id),
        candidate = migrate(await loadSnapshot(target), p);
      requireThat(
        (await hash(candidate)) === preview.candidate_hash,
        "RESTORE_CANDIDATE_CHANGED",
        409,
      );
      const pre = await stage(
          p,
          current.state,
          current.revision,
          "pre-restore",
        ),
        migrationBackup =
          target.schemaVersion !== 2
            ? await stage(
                p,
                await loadSnapshot(target),
                target.sourceRevision,
                "pre-migration",
              )
            : null,
        newRevision = current.revision + 1;
      const recoveryReceipt = {
        recoveryReceiptId: id(),
        playerId: p,
        fromRevision: current.revision,
        toSnapshotId: target.snapshotId,
        newRevision,
        timestamp: now(),
        result: "RESTORED",
        scope: "BACKEND_GAME_ONLY_NOT_BLOCKCHAIN_RECEIPT",
      };
      return commit(
        [
          guard(p, current.revision),
          stmt(
            "INSERT INTO preview_guards VALUES(?,?,?)",
            id(),
            preview.preview_id,
            now(),
          ),
          ...pre.statements,
          ...(migrationBackup?.statements ?? []),
          ...stateStatements(p, candidate, newRevision),
          stmt(
            "UPDATE recovery_previews SET consumed=1 WHERE preview_id=?",
            preview.preview_id,
          ),
          stmt(
            "INSERT INTO recovery_receipts VALUES(?,?,?,?,?,?,?)",
            recoveryReceipt.recoveryReceiptId,
            p,
            current.revision,
            target.snapshotId,
            newRevision,
            recoveryReceipt.timestamp,
            "RESTORED",
          ),
          stmt("DELETE FROM preview_guards"),
          clearGuards(),
        ],
        {
          revision: newRevision,
          preRestoreSnapshot: pre.snapshot,
          recoveryReceipt,
        },
      );
    }
    if (path === "/game/receipts" && method === "GET")
      return json({
        scope: "BACKEND_GAME_ONLY",
        receipts: (
          await db.all("SELECT payload FROM game_receipts WHERE player_id=?", [
            p,
          ])
        ).map((r) => JSON.parse(r.payload)),
        recoveryReceipts: await db.all(
          "SELECT * FROM recovery_receipts WHERE player_id=?",
          [p],
        ),
      });
    if (path === "/logistics/missions" && method === "GET")
      return json({
        authority: "EXISTING_LOGISTICS_RUNTIME",
        scope: "DURABLE_GAME_PROJECTION_NOT_SETTLEMENT",
        missions: (
          await db.all(
            "SELECT payload,revision,updated_at FROM logistics_projections WHERE player_id=?",
            [p],
          )
        ).map((r) => ({
          ...JSON.parse(r.payload),
          revision: r.revision,
          updatedAt: r.updated_at,
        })),
      });
    if (path === "/chain/receipts" && method === "GET")
      return json({
        authority: "BLOCKCHAIN",
        status: "CHAIN_VERIFIER_NOT_CONFIGURED",
        receipts: [],
        balances: null,
      });
    if (path === "/world/session" && method === "POST") {
      fields(body, ["worldId", "sequence", "expectedRevision", "position"]);
      const result = await realtime.command({
        ...body,
        playerId: p,
        idempotencyKey: key,
        now: now(),
      });
      return commit([], result);
    }
    throw new Problem("NOT_FOUND", 404);
  }
  return {
    async fetch(request) {
      const started = now(),
        requestId = id();
      const context = { playerIdHash: null };
      let response;
      try {
        const origin = request.headers.get("origin");
        requireThat(!origin || origins.includes(origin), "ORIGIN_DENIED", 403);
        const contentLength = Number(
          request.headers.get("content-length") ?? 0,
        );
        requireThat(
          contentLength <= config.maxRequestBytes,
          "REQUEST_TOO_LARGE",
          413,
        );
        const client = request.headers.get("cf-connecting-ip") ?? "local";
        limiter.take(await hash(client), now());
        response = await route(request, context);
      } catch (e) {
        if (e.reply) return e.reply;
        let code = e.message,
          status = e.status ?? 503;
        if (code.includes("REVISION_CONFLICT")) {
          code = "CONFLICT_RETRY_READ_CURRENT";
          status = 409;
        }
        if (
          !e.status &&
          (code.includes("CHALLENGE_REPLAY") || code.includes("RESTORE_REPLAY"))
        )
          status = 409;
        if (code.includes("GAME_RECEIPT_MISMATCH")) {
          code = "GAME_RECEIPT_MISMATCH";
          status = 409;
        }
        if (code.includes("WALLET_BINDING_CONFLICT")) {
          code = "WALLET_BINDING_CONFLICT";
          status = 409;
        }
        if (
          code.includes("IDENTITY_TOKEN_INVALID") ||
          code.includes("RECOVERY_CODE_INVALID")
        ) {
          code = "IDENTITY_TOKEN_INVALID";
          status = 401;
        }
        if (
          code.includes("ACCOUNT_REVISION_CONFLICT") ||
          code.includes("UNIQUE constraint failed")
        ) {
          code = "IDENTITY_CONFLICT";
          status = 409;
        }
        if (code.includes("IDENTITY_THROTTLED")) {
          return json({ status: "CHECK_EMAIL_IF_ELIGIBLE" }, 202);
        }
        if (!e.status && status === 503) code = "SERVICE_UNAVAILABLE";
        response = json({ code, requestId }, status);
      }
      if (request.method === "POST" && response.ok && queue) {
        try {
          await queue.send({ type: "DIAGNOSTIC_STAGING", requestId });
        } catch {
          logger({
            requestId,
            operation: "queue",
            duration: now() - started,
            result: "DEFERRED",
          });
        }
      }
      response.headers.set("x-request-id", requestId);
      response.headers.set("x-content-type-options", "nosniff");
      response.headers.set("content-security-policy", "default-src 'none'");
      logger({
        requestId,
        playerIdHash: context.playerIdHash,
        operation: new URL(request.url).pathname.replace(
          /\/backups\/[^/]+/,
          "/backups/:id",
        ),
        duration: now() - started,
        result: response.status,
      });
      return response;
    },
    flushEmail: identity.flushEmail,
    pruneIdentity: identity.pruneExpired,
    getState,
    loadSnapshot,
    stage,
  };
}

/** Local SQLite research only. Never connected to createBackend(), HTTP routes,
 * signup, migration loading or deploy config. The caller supplies an existing
 * test DB/binding; this function cannot create a schema or an Account/Life.
 * Core model responses remain unchanged, including durable:false. Only the
 * separate persistence envelope attests that a local DB transaction committed.
 */
export function createCustomerProjectPersistencePrototype({ mode, database: db, identityAdapter, quotePlanner, now = Date.now } = {}) {
  requireThat(mode === "LOCAL_TEST_ONLY" && db && ["get", "atomic"].every((k) => typeof db[k] === "function") && typeof quotePlanner?.plan === "function" && typeof now === "function", "CUSTOMER_PROJECT_LOCAL_PERSISTENCE_REQUIRED");
  const scope = "LOCAL_DATABASE_SIMULATION_PROTOTYPE";
  const exact = (v, keys) => requireThat(v && Object.getPrototypeOf(v) === Object.prototype && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k)), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
  const current = (owner) => requireThat(canonical(captureCustomerProjectContext(identityAdapter)) === canonical(owner), "CUSTOMER_PROJECT_WRONG_CUSTOMER", 403);
  const capture = () => captureCustomerProjectContext(identityAdapter);
  const prefixFor = async (owner) => `customer-project-local:${await hash({ owner, companyId: "AI_ANT_COMPANY_0001", slot: "CUSTOMER_PROJECT_PRIMARY" })}:`;
  const boundedJson = (value, limit = 512000) => {
    const text = canonical(value);
    requireThat(new TextEncoder().encode(text).length <= limit, "CUSTOMER_PROJECT_PERSISTENCE_CAPACITY", 413);
    return text;
  };
  const parse = (text) => {
    requireThat(typeof text === "string" && new TextEncoder().encode(text).length <= 512000, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    try { return JSON.parse(text); } catch { throw new Problem("CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422); }
  };
  function replayOwner(owner) {
    return { resolve() { current(owner); return { ...owner, active: true, scope: "SIMULATION_CUSTOMER_CONTEXT" }; } };
  }
  function makeReplay(owner) {
    let observation, historical, clockIndex, planUses;
    const model = createCustomerProjectPrototype({ identityAdapter: replayOwner(owner), quotePlanner: {
      async plan(request) {
        planUses += 1;
        if (historical) {
          requireThat(planUses === 1 && observation.plan !== null, "CUSTOMER_PROJECT_REPLAY_OBSERVATION", 422);
          return structuredClone(observation.plan);
        }
        observation.plan = structuredClone(await quotePlanner.plan(request));
        return structuredClone(observation.plan);
      }
    }, now() {
      if (historical) {
        requireThat(clockIndex < observation.clocks.length, "CUSTOMER_PROJECT_REPLAY_OBSERVATION", 422);
        return observation.clocks[clockIndex++];
      }
      const value = now(); observation.clocks.push(value); return value;
    } });
    return { model, async run(record, isHistorical) {
      observation = record; historical = isHistorical; clockIndex = 0; planUses = 0;
      const result = await model.command(record.command);
      requireThat(planUses === (record.plan === null ? 0 : 1) && (!historical || clockIndex === record.clocks.length), "CUSTOMER_PROJECT_REPLAY_OBSERVATION", 422);
      return result;
    } };
  }
  // One SQLite statement is one coherent read snapshot across all three stores.
  // The explicit account_lives join proves the fixture binding, not merely the
  // existence of a public Player ID. No binding is inserted or changed here.
  const snapshotSql = `SELECT w.*, a.account_id AS bound_account_id,
    COALESCE((SELECT json_group_array(json_object('eventId',e.event_id,'sequence',e.sequence,'payload',e.payload,'payloadHash',e.payload_hash)) FROM
      (SELECT * FROM customer_project_events WHERE workspace_id=w.workspace_id ORDER BY sequence) e),'[]') AS events_json,
    COALESCE((SELECT json_group_array(json_object('scope',i.scope,'key',i.key,'requestHash',i.request_hash,'response',i.response,'status',i.status,'createdAt',i.created_at))
      FROM idempotency i WHERE i.scope LIKE ?),'[]') AS journal_json
    FROM account_lives a LEFT JOIN customer_project_workspaces w ON w.owner_player_id=a.player_id
    WHERE a.account_id=? AND a.player_id=?`;
  async function load(owner) {
    current(owner); const prefix = await prefixFor(owner);
    const row = await db.get(snapshotSql, [prefix + "%", owner.accountId, owner.playerId]);
    current(owner); requireThat(row, "CUSTOMER_PROJECT_BINDING_REQUIRED", 403);
    const events = parse(row.events_json), cached = parse(row.journal_json);
    requireThat(Array.isArray(events) && events.length <= 128 && Array.isArray(cached) && cached.length <= 256, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    if (row.workspace_id === null) {
      requireThat(events.length === 0 && cached.length === 0, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
      return { row: null, envelope: null, state: null, prefix, replay: makeReplay(owner) };
    }
    requireThat(row.owner_account_id === owner.accountId && row.owner_player_id === owner.playerId, "CUSTOMER_PROJECT_WRONG_CUSTOMER", 403);
    const envelope = parse(row.payload);
    exact(envelope, ["format", "version", "owner", "operations", "state", "stateHash"]);
    requireThat(envelope.format === "KAIOS_CUSTOMER_PROJECT_LOCAL_JOURNAL" && envelope.version === 1 && canonical(envelope.owner) === canonical(owner) && Array.isArray(envelope.operations) && envelope.operations.length > 0 && envelope.operations.length <= 256, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    requireThat(row.payload_hash === await hash(envelope) && row.storage_version === envelope.operations.length && cached.length === envelope.operations.length, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    const replay = makeReplay(owner);
    for (const operation of envelope.operations) {
      exact(operation, ["command", "commandHash", "clocks", "plan", "modelResultHash", "stateHash", "response", "recordedAt"]);
      requireThat(Array.isArray(operation.clocks) && operation.clocks.length <= 8 && operation.clocks.every((v) => integer(v, Number.MAX_SAFE_INTEGER)) && integer(operation.recordedAt, Number.MAX_SAFE_INTEGER) && operation.commandHash === await hash(operation.command), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
      const result = await replay.run(operation, true);
      const state = await replay.model.read();
      requireThat(operation.modelResultHash === await hash(result) && operation.stateHash === await hash(state), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
      const expectedResponse = { scope, persistence: { committed: true, storageVersion: state.commandJournal.length, productionVerified: false }, result };
      requireThat(canonical(operation.response) === canonical(expectedResponse), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
      const record = cached.find((v) => v.scope === prefix + operation.command.type && v.key === operation.command.idempotencyKey);
      requireThat(record && record.status === 200 && record.requestHash === operation.commandHash && record.createdAt === operation.recordedAt && canonical(parse(record.response)) === canonical(expectedResponse), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    }
    const state = await replay.model.read();
    requireThat(canonical(state) === canonical(envelope.state) && envelope.stateHash === await hash(state) && state.commandJournal.length === envelope.operations.length && state.workspaceId === row.workspace_id && state.revision === row.revision && events.length === state.events.length, "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i], expected = state.events[i];
      requireThat(event.eventId === expected.eventId && event.sequence === expected.sequence && event.payloadHash === await hash(expected) && canonical(parse(event.payload)) === canonical(expected), "CUSTOMER_PROJECT_PERSISTENCE_CORRUPT", 422);
    }
    current(owner); return { row, envelope, state, prefix, replay };
  }
  function known(loaded, command, commandHash) {
    const record = loaded.envelope?.operations.find((v) => v.command.type === command.type && v.command.idempotencyKey === command.idempotencyKey);
    if (!record) return null;
    requireThat(record.commandHash === commandHash, "IDEMPOTENCY_CONTENT_MISMATCH", 409);
    return structuredClone(record.response);
  }
  async function execute(owner, command) {
    current(owner); const commandHash = await hash(command); let loaded = await load(owner);
    const prior = known(loaded, command, commandHash);
    if (prior) { current(owner); return prior; }
    try {
    const operation = { command, commandHash, clocks: [], plan: null, modelResultHash: null, stateHash: null, response: null, recordedAt: null };
    const result = await loaded.replay.run(operation, false), state = await loaded.replay.model.read();
    const storageVersion = (loaded.row?.storage_version ?? 0) + 1;
    operation.modelResultHash = await hash(result); operation.stateHash = await hash(state);
    operation.response = { scope, persistence: { committed: true, storageVersion, productionVerified: false }, result };
    operation.recordedAt = now(); requireThat(integer(operation.recordedAt, Number.MAX_SAFE_INTEGER), "CUSTOMER_PROJECT_INVALID_CLOCK");
    const envelope = { format: "KAIOS_CUSTOMER_PROJECT_LOCAL_JOURNAL", version: 1, owner,
      operations: [...(loaded.envelope?.operations ?? []), operation], state, stateHash: operation.stateHash };
    requireThat(envelope.operations.length <= 256 && state.commandJournal.length === envelope.operations.length, "CUSTOMER_PROJECT_PERSISTENCE_CAPACITY", 413);
    const payload = boundedJson(envelope), payloadHash = await hash(envelope), guardId = id();
    const statements = [
      stmt("INSERT INTO customer_project_guards VALUES(?,?,?,?,?)", guardId, owner.accountId, owner.playerId, loaded.row?.storage_version ?? 0, loaded.row?.payload_hash ?? null),
      stmt("INSERT INTO customer_project_workspaces VALUES(?,?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET revision=excluded.revision,storage_version=excluded.storage_version,payload_hash=excluded.payload_hash,payload=excluded.payload",
        state.workspaceId, owner.accountId, owner.playerId, state.revision, storageVersion, payloadHash, payload)
    ];
    for (const event of state.events.slice(loaded.state?.events.length ?? 0))
      statements.push(stmt("INSERT INTO customer_project_events VALUES(?,?,?,?,?)", state.workspaceId, event.sequence, event.eventId, canonical(event), await hash(event)));
    statements.push(stmt("INSERT INTO idempotency VALUES(?,?,?,?,?,?)", loaded.prefix + command.type, command.idempotencyKey, commandHash, canonical(operation.response), 200, operation.recordedAt),
      stmt("DELETE FROM customer_project_guards WHERE guard_id=?", guardId));
    current(owner);
    // Acceptance is bound to a trusted service decision time, not a promise that
    // a later SQLite lock wait commits before quote expiry. Historical replay
    // preserves that original decision; it never obtains fresh approval.
    if (result.status === "ACCEPTED_SIMULATION_PLAN") {
      const checkedAt = now(); requireThat(integer(checkedAt, Number.MAX_SAFE_INTEGER) && checkedAt >= state.acceptance.acceptedAt && checkedAt < state.contract.acceptedQuote.content.expiresAt, "QUOTE_EXPIRED", 409);
    }
    await db.atomic(statements);
    current(owner); return structuredClone(operation.response);
    } catch (error) {
      // This also recovers a committed response whose transport acknowledgement
      // was lost, or a speculative planner/expiry error after a same-key winner
      // committed. This is one verified read, not a mutation or planner retry.
      current(owner);
      loaded = await load(owner); const committed = known(loaded, command, commandHash);
      if (committed) { current(owner); return committed; }
      if (String(error.message).includes("CUSTOMER_PROJECT_CAS_CONFLICT")) throw new Problem("CUSTOMER_PROJECT_REVISION_CONFLICT", 409);
      throw error;
    }
  }
  return Object.freeze({ scope,
    command(input) {
      let owner, command;
      try {
        owner = capture(); boundedJson(input, 16000); command = structuredClone(input);
        requireThat(typeof command.type === "string" && typeof command.idempotencyKey === "string", "CUSTOMER_PROJECT_INVALID_COMMAND");
      } catch (error) { return Promise.reject(error); }
      return execute(owner, command);
    },
    read() {
      let owner; try { owner = capture(); } catch (error) { return Promise.reject(error); }
      return load(owner).then((loaded) => { current(owner); return { scope, storageVersion: loaded.row?.storage_version ?? 0, state: structuredClone(loaded.state), productionVerified: false }; });
    }
  });
}
