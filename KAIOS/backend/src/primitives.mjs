export class Problem extends Error {
  constructor(code, status = 400) {
    super(code);
    this.status = status;
  }
}
export const requireThat = (ok, code, status = 400) => {
  if (!ok) throw new Problem(code, status);
};
export const clone = (value) => structuredClone(value);
export function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    requireThat(Number.isFinite(value), "INVALID_NUMBER");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  requireThat(
    value &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype,
    "INVALID_JSON",
  );
  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
      .join(",") +
    "}"
  );
}
export async function hash(value) {
  const bytes = new TextEncoder().encode(
    typeof value === "string" ? value : canonical(value),
  );
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export const id = () => crypto.randomUUID();
export const fields = (v, allowed) =>
  requireThat(
    v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v).every((k) => allowed.includes(k)),
    "FIELD_NOT_ALLOWED",
  );
export const integer = (v, max = 1e9) =>
  Number.isSafeInteger(v) && v >= 0 && v <= max;
export const address = (v) =>
  typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);
export const playerId = (v) =>
  typeof v === "string" && /^KAIOS-P-[0-9a-f]{32}$/.test(v);
export const stmt = (sql, ...params) => ({ sql, params });
export class DatabaseAdapter {
  async get() {
    throw new Error("NOT_IMPLEMENTED");
  }
  async all() {
    throw new Error("NOT_IMPLEMENTED");
  }
  async atomic() {
    throw new Error("NOT_IMPLEMENTED");
  }
}
export class ObjectStorageAdapter {
  async putImmutable() {
    throw new Error("NOT_IMPLEMENTED");
  }
  async get() {
    throw new Error("NOT_IMPLEMENTED");
  }
}
export class RealtimeStateAdapter {
  async command() {
    throw new Error("NOT_IMPLEMENTED");
  }
}
export class QueueAdapter {
  async send() {
    throw new Error("NOT_IMPLEMENTED");
  }
}
export class RateLimiter {
  constructor({ limit = 120, windowMs = 60000, capacity = 10000 } = {}) {
    Object.assign(this, { limit, windowMs, capacity });
    this.buckets = new Map();
  }
  take(key, now) {
    for (const [k, b] of this.buckets)
      if (b.until <= now) this.buckets.delete(k);
    let b = this.buckets.get(key);
    if (!b) {
      requireThat(this.buckets.size < this.capacity, "RATE_LIMIT", 429);
      b = { until: now + this.windowMs, n: 0 };
      this.buckets.set(key, b);
    }
    requireThat(++b.n <= this.limit, "RATE_LIMIT", 429);
  }
}
