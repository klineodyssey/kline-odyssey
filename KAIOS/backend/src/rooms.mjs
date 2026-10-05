import {
  RealtimeStateAdapter,
  requireThat,
  clone,
  canonical,
} from "./primitives.mjs";
export class AuthoritativeRooms extends RealtimeStateAdapter {
  constructor() {
    super();
    this.rooms = new Map();
  }
  async command({
    worldId,
    playerId,
    sequence,
    expectedRevision,
    idempotencyKey,
    position,
    now,
  }) {
    requireThat(
      ["11520", "12345", "16888"].includes(worldId) &&
        Number.isSafeInteger(sequence) &&
        sequence > 0 &&
        Number.isSafeInteger(expectedRevision) &&
        expectedRevision >= 0 &&
        typeof idempotencyKey === "string" &&
        idempotencyKey.length <= 128,
      "INVALID_WORLD_COMMAND",
    );
    requireThat(
      position &&
        Object.keys(position).sort().join(",") === "x,y,z" &&
        Object.values(position).every(
          (v) => Number.isFinite(v) && Math.abs(v) <= 1e7,
        ),
      "INVALID_POSITION",
    );
    const room = this.rooms.get(worldId) ?? {
      revision: 0,
      players: {},
      requests: {},
    };
    const key = playerId + ":" + idempotencyKey;
    const fingerprint = canonical({ sequence, expectedRevision, position });
    if (room.requests[key]) {
      requireThat(
        room.requests[key].fingerprint === fingerprint,
        "IDEMPOTENCY_MISMATCH",
        409,
      );
      return clone(room.requests[key].result);
    }
    requireThat(
      expectedRevision === room.revision,
      "WORLD_REVISION_CONFLICT",
      409,
    );
    requireThat(
      sequence > (room.players[playerId]?.sequence ?? 0),
      "WORLD_REPLAY",
      409,
    );
    room.revision++;
    room.players[playerId] = {
      playerId,
      position: clone(position),
      sequence,
      revision: room.revision,
      updatedAt: now,
      expiresAt: now + 60000,
    };
    const result = {
      scope: "FOUNDATION_ONLY",
      worldId,
      revision: room.revision,
      presence: clone(room.players[playerId]),
      monsters: [],
      missions: [],
    };
    room.requests[key] = { fingerprint, result };
    // Bounded local reference; production DO persists the same owner state.
    for (const [k, v] of Object.entries(room.players))
      if (v.expiresAt < now) delete room.players[k];
    const keys = Object.keys(room.requests);
    for (const k of keys.slice(0, Math.max(0, keys.length - 1000)))
      delete room.requests[k];
    this.rooms.set(worldId, room);
    return clone(result);
  }
}
