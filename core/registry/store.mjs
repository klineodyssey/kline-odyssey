import { clone } from "../shared/utils.mjs";
import { createHistoryEvent } from "../history/index.mjs";
import { invariant } from "../shared/errors.mjs";

function orderEventChain(events) {
  if (events.length < 2) return events;
  const nextByPrevious = new Map(events.map((event) => [event.previous_event_id, event]));
  const ordered = [];
  let current = nextByPrevious.get(null);
  while (current && !ordered.some((event) => event.event_id === current.event_id)) {
    ordered.push(current);
    current = nextByPrevious.get(current.event_id);
  }
  return ordered.length === events.length ? ordered : events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function hasExpectedPreviousEvent(operation) {
  return Object.prototype.hasOwnProperty.call(operation, "expected_previous_event_id");
}

function assertExpectedPreviousEvent(operation, actualPreviousEventId) {
  if (!hasExpectedPreviousEvent(operation)) return;
  invariant(operation.expected_previous_event_id === actualPreviousEventId,
    "HISTORY_EXPECTED_PREVIOUS_EVENT_MISMATCH",
    `Expected previous event ${operation.expected_previous_event_id ?? "null"} but found ${actualPreviousEventId ?? "null"}`);
}

export class MemoryUniverseStore {
  #entities = new Map();
  #events = [];

  async hydrate(domain, entities, idField, options = {}) {
    for (const entity of entities) {
      const key = `${domain}:${entity[idField]}`;
      const existing = this.#entities.get(key);
      if (!existing) this.#entities.set(key, clone(entity));
      else if (options.forceCanonical === true && JSON.stringify(existing) !== JSON.stringify(entity)) {
        await this.commit({ domain, stream: options.stream, id: entity[idField], entity, event_type: "CANONICAL_SEED_UPGRADED", actor_id: "CANONICAL_MIGRATOR", payload: { canonical_version: options.canonicalVersion } });
      }
    }
  }

  async getEntity(domain, id) { return clone(this.#entities.get(`${domain}:${id}`) ?? null); }
  async listEntities(domain) {
    return [...this.#entities.entries()].filter(([key]) => key.startsWith(`${domain}:`)).map(([, value]) => clone(value));
  }
  async history(subjectId, stream = null) {
    return this.#events.filter((event) => event.subject_id === subjectId && (!stream || event.stream === stream)).map(clone);
  }
  async allEvents() { return this.#events.map(clone); }

  async commit(operation) { return (await this.commitBatch([operation]))[0]; }

  async commitBatch(operations) {
    const stagedEvents = [];
    for (const operation of operations) {
      const existing = [...this.#events, ...stagedEvents].filter((event) => event.subject_id === operation.id && event.stream === operation.stream);
      assertExpectedPreviousEvent(operation, existing.at(-1)?.event_id ?? null);
      const event = await createHistoryEvent({
        event_id: operation.event_id,
        stream: operation.stream,
        event_type: operation.event_type,
        subject_id: operation.id,
        actor_id: operation.actor_id,
        payload: operation.payload,
        tx_hash: operation.tx_hash,
        timestamp: operation.timestamp
      }, existing.at(-1)?.event_id ?? null);
      stagedEvents.push(event);
    }
    const stagedIds = new Set();
    for (const event of stagedEvents) {
      invariant(!stagedIds.has(event.event_id), "DUPLICATE_EVENT_ID", `Duplicate event id: ${event.event_id}`);
      invariant(!this.#events.some((existing) => existing.event_id === event.event_id), "DUPLICATE_EVENT_ID", `Duplicate event id: ${event.event_id}`);
      stagedIds.add(event.event_id);
    }
    const tails = new Map();
    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index];
      const key = `${operation.stream}:${operation.id}`;
      if (!tails.has(key)) {
        const current = this.#events.filter((event) => event.subject_id === operation.id && event.stream === operation.stream);
        tails.set(key, current.at(-1)?.event_id ?? null);
      }
      assertExpectedPreviousEvent(operation, tails.get(key));
      tails.set(key, stagedEvents[index].event_id);
    }
    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index];
      this.#entities.set(`${operation.domain}:${operation.id}`, clone(operation.entity));
      this.#events.push(stagedEvents[index]);
    }
    return stagedEvents.map(clone);
  }
}

export class IndexedDbUniverseStore {
  constructor(name = "KGEN_11520_UNIVERSE_V2", { openTimeoutMs = 2500 } = {}) {
    invariant(globalThis.indexedDB, "INDEXEDDB_UNAVAILABLE", "IndexedDB is unavailable in this runtime");
    invariant(
      Number.isInteger(openTimeoutMs) && openTimeoutMs > 0,
      "INVALID_INDEXEDDB_OPEN_TIMEOUT",
      "IndexedDB open timeout must be a positive integer"
    );
    this.name = name;
    this.dbPromise = this.#open(openTimeoutMs);
  }

  #open(openTimeoutMs) {
    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(this.name, 1);
      let settled = false;
      const finish = (handler, value) => {
        if (settled) return false;
        settled = true;
        globalThis.clearTimeout(timeout);
        handler(value);
        return true;
      };
      const fail = (code, message, cause = undefined) => {
        const error = new Error(message, cause === undefined ? undefined : { cause });
        error.code = code;
        finish(reject, error);
      };
      const timeout = globalThis.setTimeout(() => {
        fail("INDEXEDDB_OPEN_TIMEOUT", `IndexedDB open timed out after ${openTimeoutMs}ms`);
      }, openTimeoutMs);
      request.onupgradeneeded = () => {
        const db = request.result;
        const entities = db.createObjectStore("entities", { keyPath: "key" });
        entities.createIndex("domain", "domain", { unique: false });
        const events = db.createObjectStore("events", { keyPath: "event_id" });
        events.createIndex("subject_id", "subject_id", { unique: false });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!finish(resolve, db)) {
          db?.close?.();
          return;
        }
        db.onversionchange = () => db.close();
      };
      request.onerror = () => fail(
        "INDEXEDDB_OPEN_FAILED",
        request.error?.message || "IndexedDB open failed",
        request.error
      );
      request.onblocked = () => fail(
        "INDEXEDDB_OPEN_BLOCKED",
        "IndexedDB open was blocked by another page"
      );
    });
  }

  async ready() {
    await this.dbPromise;
    return this;
  }

  async #request(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async hydrate(domain, entities, idField, options = {}) {
    const db = await this.dbPromise;
    for (const entity of entities) {
      const key = `${domain}:${entity[idField]}`;
      const existing = await this.#request(db.transaction("entities").objectStore("entities").get(key));
      if (!existing) {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction("entities", "readwrite");
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.objectStore("entities").put({ key, domain, entity: clone(entity) });
        });
      } else if (options.forceCanonical === true && JSON.stringify(existing.entity) !== JSON.stringify(entity)) {
        await this.commit({ domain, stream: options.stream, id: entity[idField], entity, event_type: "CANONICAL_SEED_UPGRADED", actor_id: "CANONICAL_MIGRATOR", payload: { canonical_version: options.canonicalVersion } });
      }
    }
  }

  async getEntity(domain, id) {
    const db = await this.dbPromise;
    const row = await this.#request(db.transaction("entities").objectStore("entities").get(`${domain}:${id}`));
    return clone(row?.entity ?? null);
  }

  async listEntities(domain) {
    const db = await this.dbPromise;
    const rows = await this.#request(db.transaction("entities").objectStore("entities").index("domain").getAll(domain));
    return rows.map((row) => clone(row.entity));
  }

  async history(subjectId, stream = null) {
    const db = await this.dbPromise;
    const rows = await this.#request(db.transaction("events").objectStore("events").index("subject_id").getAll(subjectId));
    return orderEventChain(rows.filter((event) => !stream || event.stream === stream)).map(clone);
  }

  async allEvents() {
    const db = await this.dbPromise;
    return (await this.#request(db.transaction("events").objectStore("events").getAll())).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(clone);
  }

  async commit(operation) { return (await this.commitBatch([operation]))[0]; }

  async commitBatch(operations) {
    const events = [];
    for (const operation of operations) {
      const prior = [...await this.history(operation.id, operation.stream), ...events.filter((event) => event.subject_id === operation.id && event.stream === operation.stream)];
      assertExpectedPreviousEvent(operation, prior.at(-1)?.event_id ?? null);
      events.push(await createHistoryEvent({
        event_id: operation.event_id,
        stream: operation.stream,
        event_type: operation.event_type,
        subject_id: operation.id,
        actor_id: operation.actor_id,
        payload: operation.payload,
        tx_hash: operation.tx_hash,
        timestamp: operation.timestamp
      }, prior.at(-1)?.event_id ?? null));
    }
    const db = await this.dbPromise;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(["entities", "events"], "readwrite");
      let compareAndSetError = null;
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(compareAndSetError ?? transaction.error);
      const entityStore = transaction.objectStore("entities");
      const eventStore = transaction.objectStore("events");
      const groups = new Map();
      operations.forEach((operation, index) => {
        const key = `${operation.stream}:${operation.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ operation, index });
      });
      const pendingGroups = [...groups.values()];
      let remaining = pendingGroups.length;
      const writeBatch = () => operations.forEach((operation, index) => {
        entityStore.put({ key: `${operation.domain}:${operation.id}`, domain: operation.domain, entity: clone(operation.entity) });
        eventStore.add(clone(events[index]));
      });
      if (remaining === 0) return;
      for (const group of pendingGroups) {
        const request = eventStore.index("subject_id").getAll(group[0].operation.id);
        request.onerror = () => { compareAndSetError = request.error; transaction.abort(); };
        request.onsuccess = () => {
          try {
            const stream = group[0].operation.stream;
            const current = orderEventChain(request.result.filter((event) => event.stream === stream));
            let tail = current.at(-1)?.event_id ?? null;
            for (const { operation, index } of group) {
              assertExpectedPreviousEvent(operation, tail);
              tail = events[index].event_id;
            }
            remaining -= 1;
            if (remaining === 0) writeBatch();
          } catch (error) {
            compareAndSetError = error;
            transaction.abort();
          }
        };
      }
    });
    return events.map(clone);
  }
}
