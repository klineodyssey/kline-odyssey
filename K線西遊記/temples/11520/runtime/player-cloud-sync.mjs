/** Optional local-first transport. Player Life remains the local game owner. */
import { validatePlayerLifePlayer } from "./player-life-runtime.mjs";
const copy = (v) => structuredClone(v);
export function cloudGameState(
  player,
  { monsterHistory = [], gameReceipts = [], missions = [] } = {},
) {
  validatePlayerLifePlayer(player);
  const p = copy(player);
  p.displayName = "取經旅人";
  p.pronoun = "";
  p.ageRange = null;
  p.walletLinks = [];
  p.privacyConsent = { location: false, motion: false, analytics: false };
  return {
    schemaVersion: 1,
    player: p,
    monsterHistory: copy(monsterHistory),
    gameReceipts: copy(gameReceipts),
    missions: copy(missions),
  };
}
export function createPlayerCloudSync({
  localStore,
  storage,
  apiBase = "/api/v1",
  fetch: request = globalThis.fetch,
  crypto = globalThis.crypto,
} = {}) {
  const p = localStore.activePlayer();
  if (!p) throw new Error("NO_ACTIVE_PLAYER");
  const key = "KAIOS_CLOUD_SYNC_V1:" + p.playerId;
  let cached;
  try {
    cached = JSON.parse(storage?.getItem(key) ?? "null") ?? {
      revision: 0,
      pending: null,
      status: "LOCAL_ONLY",
    };
  } catch {
    throw new Error("CLOUD_JOURNAL_CORRUPTED");
  }
  const persist = () => storage?.setItem(key, JSON.stringify(cached));
  async function call(path, body, idempotencyKey) {
    const res = await request(apiBase + path, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body
        ? {
            "content-type": "application/json",
            "idempotency-key": idempotencyKey,
          }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { res, data };
  }
  return Object.freeze({
    status: () => copy(cached),
    enqueue(projections = {}) {
      if (localStore.activePlayer()?.playerId !== p.playerId)
        throw new Error("PLAYER_CHANGED");
      if (cached.pending) throw new Error("SYNC_PENDING_RESOLVE_OR_RETRY");
      cached.pending = {
        baseRevision: cached.revision,
        state: cloudGameState(localStore.activePlayer(), projections),
        key: crypto.randomUUID(),
      };
      cached.status = "PENDING";
      persist();
      return copy(cached);
    },
    async flush() {
      if (!cached.pending) return copy(cached);
      const pending = cached.pending;
      try {
        const { res, data } = await call(
          "/player/state/sync",
          { baseRevision: pending.baseRevision, state: pending.state },
          pending.key,
        );
        if (res.status === 409) {
          cached.status = "CONFLICT";
          cached.conflict = data;
          persist();
          return copy(cached);
        }
        if (!res.ok) throw new Error(data.code ?? "SYNC_UNAVAILABLE");
        cached.revision = data.revision;
        cached.pending = null;
        cached.status = "SYNCED";
        delete cached.conflict;
        persist();
        return copy(cached);
      } catch {
        cached.status = "OFFLINE_PENDING";
        persist();
        return copy(cached);
      }
    },
    async refresh() {
      const { res, data } = await call("/player/state");
      if (!res.ok) throw new Error(data.code);
      if (data.state?.player.playerId !== p.playerId && data.state)
        throw new Error("WRONG_PLAYER");
      if (cached.pending && data.revision !== cached.pending.baseRevision) {
        cached.status = "CONFLICT";
        cached.conflict = data;
      } else if (!cached.pending) {
        cached.status =
          cached.revision === data.revision ? data.health : "REMOTE_NEWER";
      }
      persist();
      return data;
    },
    // Explicit recovery choice only; it never silently discards an offline candidate.
    acceptServerRevision(revision, { confirmDiscardPending = false } = {}) {
      if (cached.pending && !confirmDiscardPending)
        throw new Error("EXPLICIT_CONFLICT_CHOICE_REQUIRED");
      if (!Number.isSafeInteger(revision) || revision < 0)
        throw new Error("INVALID_REVISION");
      cached = { revision, pending: null, status: "LOCAL_ONLY" };
      persist();
    },
  });
}
