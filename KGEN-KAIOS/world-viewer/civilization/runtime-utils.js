export function clamp(value, minimum = 0, maximum = 100) {
  const number = Number(value);
  return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : minimum));
}

export function integer(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

export function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

export function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(freeze);
  return value;
}

export function snapshot(value) {
  return freeze(clone(value));
}

export function runtimeError(runtime, code, message) {
  const error = new Error(message);
  error.name = `${runtime}Error`;
  error.code = code;
  return error;
}

export function resolveStorage(storage) {
  if (storage === null) return null;
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadEnvelope(storage, key, validator) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const value = JSON.parse(raw);
    return validator(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveEnvelope(storage, key, value) {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function createNotifier(getSnapshot) {
  const listeners = new Set();
  return Object.freeze({
    emit(type, details = {}) {
      if (listeners.size === 0) return false;
      const message = snapshot({ type, details, snapshot: getSnapshot() });
      for (const listener of [...listeners]) {
        try { listener(message); } catch { /* Observers cannot break a runtime. */ }
      }
      return true;
    },
    subscribe(listener, { emitCurrent = false } = {}) {
      if (typeof listener !== "function") throw new TypeError("listener must be a function");
      listeners.add(listener);
      if (emitCurrent) listener(snapshot({ type: "CURRENT", details: {}, snapshot: getSnapshot() }));
      return () => listeners.delete(listener);
    },
    clear() { listeners.clear(); }
  });
}

export function boundedPush(list, value, limit = 120) {
  list.push(value);
  if (list.length > limit) list.splice(0, list.length - limit);
  return value;
}

export function stableId(prefix, revision) {
  return `${prefix}-${String(revision).padStart(6, "0")}`;
}
