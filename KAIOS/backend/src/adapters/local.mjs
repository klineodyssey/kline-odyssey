import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  DatabaseAdapter,
  ObjectStorageAdapter,
  RealtimeStateAdapter,
  QueueAdapter,
  requireThat,
  clone,
  canonical,
} from "../primitives.mjs";
export class SQLiteDatabaseAdapter extends DatabaseAdapter {
  constructor(path = ":memory:") {
    super();
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
    );
    this.failNext = false;
  }
  migrate(sql) {
    this.db.exec(sql);
  }
  async get(sql, params = []) {
    return this.db.prepare(sql).get(...params) ?? null;
  }
  async all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }
  async atomic(statements) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const { sql, params = [] } of statements) {
        if (this.failNext) {
          this.failNext = false;
          throw new Error("DB_UNAVAILABLE");
        }
        this.db.prepare(sql).run(...params);
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.db.close();
  }
}
export class FileObjectStorageAdapter extends ObjectStorageAdapter {
  constructor(root) {
    super();
    this.root = root;
    this.failNext = false;
  }
  path(key) {
    requireThat(/^[a-zA-Z0-9-]+\.json$/.test(key), "INVALID_OBJECT_KEY");
    return `${this.root}/${key}`;
  }
  async putImmutable(key, value) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("OBJECT_STORAGE_UNAVAILABLE");
    }
    await mkdir(this.root, { recursive: true });
    try {
      await writeFile(this.path(key), value, { flag: "wx" });
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      requireThat(
        (await this.get(key)) === value,
        "IMMUTABLE_OBJECT_MISMATCH",
        409,
      );
    }
  }
  async get(key) {
    return readFile(this.path(key), "utf8");
  }
}
export { AuthoritativeRooms } from "../rooms.mjs";
export class LocalQueueAdapter extends QueueAdapter {
  constructor() {
    super();
    this.jobs = [];
  }
  async send(job) {
    this.jobs.push(clone(job));
  }
  async drain(handler) {
    while (this.jobs.length) await handler(this.jobs.shift());
  }
}
