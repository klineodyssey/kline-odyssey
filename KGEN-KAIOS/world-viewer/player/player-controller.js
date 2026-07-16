const DEFAULT_SCENE_BOUNDS = Object.freeze([0, 0, 1, 1]);
const TRAIL_LIMIT = 64;
const EPSILON = 1e-9;

export const PlayerMovementState = Object.freeze({
  OFFLINE: "OFFLINE",
  IDLE: "IDLE",
  WALKING: "WALKING"
});

export const PlayerFacing = Object.freeze({
  NORTH: "NORTH",
  EAST: "EAST",
  SOUTH: "SOUTH",
  WEST: "WEST"
});

/**
 * DOM-independent navigation for the synthetic Digital Earth demo. It only
 * works with caller-provided world data and never reads GPS, network, or storage.
 */
export function createPlayerController({ world, now = () => Date.now() } = {}) {
  if (!isRecord(world)) throw new TypeError("world must be an object");
  if (typeof now !== "function") throw new TypeError("now must be a function");

  const listeners = new Set();
  const defaultBounds = normalizeBounds(world.scene_bounds ?? world.sceneBounds ?? DEFAULT_SCENE_BOUNDS);
  let destroyed = false;
  let state = createOfflineState(defaultBounds, readTime(now));

  function getSnapshot() {
    return immutableCopy(state);
  }

  function startSession(player, spawnEntity) {
    assertUsable();
    if (state.sessionActive) throw new Error("A player session is already active");

    const playerCopy = normalizePlayer(player);
    const entityCopy = normalizeEntity(spawnEntity);
    const timestamp = readTime(now);
    const sceneBounds = resolveSceneBounds(entityCopy, defaultBounds);
    const position = clampPoint(resolveSpawnPoint(entityCopy, sceneBounds), sceneBounds);
    const sessionId = normalizeOptionalId(
      playerCopy.session_id ?? playerCopy.sessionId,
      "player session id"
    ) ?? createSessionId(playerCopy.player_id ?? playerCopy.playerId ?? playerCopy.id, timestamp);

    return commit("SESSION_STARTED", {
      revision: state.revision,
      sessionActive: true,
      sessionId,
      player: playerCopy,
      currentEntity: entityCopy,
      sceneBounds,
      position,
      movementState: PlayerMovementState.IDLE,
      facing: PlayerFacing.SOUTH,
      stepCount: 0,
      trail: [createTrailEntry(position, entityCopy, timestamp, "SPAWN")],
      startedAt: timestamp,
      endedAt: null,
      updatedAt: timestamp
    });
  }

  function endSession() {
    assertUsable();
    if (!state.sessionActive) return getSnapshot();
    const timestamp = readTime(now);
    return commit("SESSION_ENDED", {
      ...state,
      sessionActive: false,
      movementState: PlayerMovementState.OFFLINE,
      endedAt: timestamp,
      updatedAt: timestamp
    });
  }

  function enter(entity) {
    assertActiveSession();
    const entityCopy = normalizeEntity(entity);
    const timestamp = readTime(now);
    const sceneBounds = resolveSceneBounds(entityCopy, defaultBounds);
    const position = clampPoint(resolveSpawnPoint(entityCopy, sceneBounds), sceneBounds);
    const trail = appendTrail(
      state.trail,
      createTrailEntry(position, entityCopy, timestamp, "ENTER")
    );

    return commit("ENTITY_ENTERED", {
      ...state,
      currentEntity: entityCopy,
      sceneBounds,
      position,
      movementState: PlayerMovementState.IDLE,
      trail,
      updatedAt: timestamp
    });
  }

  function walkBy(dx, dy, options = {}) {
    assertActiveSession();
    const delta = assertPoint({ x: dx, y: dy }, "movement delta");
    const bounds = resolveMovementBounds(options.bounds);
    return moveTo(
      {
        x: state.position.x + delta.x,
        y: state.position.y + delta.y
      },
      bounds,
      "WALK_BY"
    );
  }

  function walkTo(point, options = {}) {
    assertActiveSession();
    const target = assertPoint(point, "walk target");
    const bounds = resolveMovementBounds(options.bounds);
    const clampedTarget = clampPoint(target, bounds);
    const maxStep = normalizeMaxStep(options.maxStep);
    const deltaX = clampedTarget.x - state.position.x;
    const deltaY = clampedTarget.y - state.position.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= maxStep || maxStep === Number.POSITIVE_INFINITY) {
      return moveTo(clampedTarget, bounds, "WALK_TO");
    }

    const scale = maxStep / distance;
    return moveTo(
      {
        x: state.position.x + deltaX * scale,
        y: state.position.y + deltaY * scale
      },
      bounds,
      "WALK_TO"
    );
  }

  function moveTo(candidate, bounds, reason) {
    const position = clampPoint(candidate, bounds);
    const deltaX = position.x - state.position.x;
    const deltaY = position.y - state.position.y;
    const moved = Math.hypot(deltaX, deltaY) > EPSILON;
    const timestamp = readTime(now);

    if (!moved && sameBounds(bounds, state.sceneBounds)) return getSnapshot();

    return commit(reason, {
      ...state,
      sceneBounds: bounds,
      position,
      movementState: moved ? PlayerMovementState.WALKING : PlayerMovementState.IDLE,
      facing: moved ? facingForDelta(deltaX, deltaY, state.facing) : state.facing,
      stepCount: state.stepCount + (moved ? 1 : 0),
      trail: moved
        ? appendTrail(state.trail, createTrailEntry(position, state.currentEntity, timestamp, reason))
        : state.trail,
      updatedAt: timestamp
    });
  }

  function subscribe(listener, { emitCurrent = true } = {}) {
    assertUsable();
    if (typeof listener !== "function") throw new TypeError("Player subscriber must be a function");
    listeners.add(listener);
    if (emitCurrent) {
      listener(getSnapshot(), immutableCopy({ type: "PLAYER_SUBSCRIBED", previous: null }));
    }
    return () => listeners.delete(listener);
  }

  function reset() {
    assertUsable();
    const timestamp = readTime(now);
    return commit("PLAYER_RESET", createOfflineState(defaultBounds, timestamp));
  }

  function destroy() {
    if (destroyed) return;
    listeners.clear();
    destroyed = true;
  }

  function resolveMovementBounds(bounds) {
    return bounds === undefined ? state.sceneBounds : normalizeBounds(bounds);
  }

  function commit(type, candidate) {
    const previous = state;
    state = {
      ...candidate,
      revision: previous.revision + 1
    };
    const snapshot = getSnapshot();
    const event = immutableCopy({ type, previous: immutableCopy(previous) });
    for (const listener of [...listeners]) {
      try {
        listener(snapshot, event);
      } catch (error) {
        globalThis.console?.error?.("Player subscriber failed", error);
      }
    }
    return snapshot;
  }

  function assertUsable() {
    if (destroyed) throw new Error("Player controller has been destroyed");
  }

  function assertActiveSession() {
    assertUsable();
    if (!state.sessionActive) throw new Error("An active player session is required");
  }

  return Object.freeze({
    startSession,
    endSession,
    enter,
    walkBy,
    walkTo,
    getSnapshot,
    subscribe,
    reset,
    destroy
  });
}

function createOfflineState(sceneBounds, timestamp) {
  return {
    revision: 0,
    sessionActive: false,
    sessionId: null,
    player: null,
    currentEntity: null,
    sceneBounds: [...sceneBounds],
    position: null,
    movementState: PlayerMovementState.OFFLINE,
    facing: PlayerFacing.SOUTH,
    stepCount: 0,
    trail: [],
    startedAt: null,
    endedAt: null,
    updatedAt: timestamp
  };
}

function normalizePlayer(player) {
  if (!isRecord(player)) throw new TypeError("player must be an object");
  const playerId = player.player_id ?? player.playerId ?? player.id;
  if (playerId === undefined || playerId === null || playerId === "") {
    throw new TypeError("player must provide player_id, playerId, or id");
  }
  return cloneValue(player);
}

function normalizeEntity(entity) {
  if (!isRecord(entity)) throw new TypeError("semantic entity must be an object");
  if (entity.id === undefined || entity.id === null || entity.id === "") {
    throw new TypeError("semantic entity must provide id");
  }
  return cloneValue(entity);
}

function resolveSceneBounds(entity, fallback) {
  const candidate = entity.scene_bounds ?? entity.sceneBounds;
  return candidate === undefined ? [...fallback] : normalizeBounds(candidate);
}

function resolveSpawnPoint(entity, bounds) {
  const explicit = entity.spawn_point ?? entity.spawnPoint ?? entity.position;
  if (explicit !== undefined) return assertPoint(explicit, "entity spawn point");

  const viewBounds = entity.view?.bounds;
  if (viewBounds !== undefined) {
    const geometry = normalizeBounds(viewBounds);
    return {
      x: geometry[0] + geometry[2] / 2,
      y: geometry[1] + geometry[3] / 2
    };
  }

  return {
    x: bounds[0] + bounds[2] / 2,
    y: bounds[1] + bounds[3] / 2
  };
}

function createSessionId(playerId, timestamp) {
  const safePlayerId = String(playerId).replace(/[^A-Za-z0-9_-]+/g, "-");
  const safeTime = String(timestamp).replace(/[^A-Za-z0-9_-]+/g, "-");
  return `SESSION-${safePlayerId}-${safeTime}`;
}

function createTrailEntry(position, entity, timestamp, reason) {
  return {
    x: position.x,
    y: position.y,
    entityId: String(entity.id),
    timestamp,
    reason
  };
}

function appendTrail(trail, entry) {
  return [...trail, entry].slice(-TRAIL_LIMIT);
}

function facingForDelta(dx, dy, fallback) {
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > EPSILON) {
    return dx > 0 ? PlayerFacing.EAST : PlayerFacing.WEST;
  }
  if (Math.abs(dy) > EPSILON) return dy > 0 ? PlayerFacing.SOUTH : PlayerFacing.NORTH;
  return fallback;
}

function normalizeBounds(value) {
  let x;
  let y;
  let width;
  let height;
  if (Array.isArray(value) && value.length === 4) {
    [x, y, width, height] = value;
  } else if (isRecord(value)) {
    x = value.x ?? value.minX;
    y = value.y ?? value.minY;
    width = value.width ?? value.w;
    height = value.height ?? value.h;
    if (width === undefined && value.maxX !== undefined && x !== undefined) width = value.maxX - x;
    if (height === undefined && value.maxY !== undefined && y !== undefined) height = value.maxY - y;
  } else {
    throw new TypeError("bounds must be [x, y, width, height] or a bounds object");
  }

  const numbers = [x, y, width, height].map(Number);
  if (!numbers.every(Number.isFinite) || numbers[2] <= 0 || numbers[3] <= 0) {
    throw new RangeError("bounds must contain finite coordinates and positive dimensions");
  }
  return numbers;
}

function clampPoint(point, bounds) {
  return {
    x: clamp(point.x, bounds[0], bounds[0] + bounds[2]),
    y: clamp(point.y, bounds[1], bounds[1] + bounds[3])
  };
}

function assertPoint(point, label) {
  if (!isRecord(point)) throw new TypeError(`${label} must be an object`);
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new TypeError(`${label} must contain finite x and y values`);
  }
  return { x, y };
}

function normalizeMaxStep(value) {
  if (value === undefined) return Number.POSITIVE_INFINITY;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError("maxStep must be a positive finite number");
  }
  return number;
}

function normalizeOptionalId(value, label) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError(`${label} must be a string or number`);
  }
  return String(value);
}

function readTime(now) {
  const value = now();
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("now() must return a finite number or stable scalar value");
  }
  if (!["string", "number"].includes(typeof value)) {
    throw new TypeError("now() must return a string or finite number");
  }
  return value;
}

function sameBounds(left, right) {
  return left.every((value, index) => value === right[index]);
}

function cloneValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) throw new TypeError("player and entity data must not contain cycles");
  const clone = Array.isArray(value) ? [] : {};
  seen.set(value, clone);
  for (const [key, child] of Object.entries(value)) clone[key] = cloneValue(child, seen);
  seen.delete(value);
  return clone;
}

function immutableCopy(value) {
  return deepFreeze(cloneValue(value));
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
