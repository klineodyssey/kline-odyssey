import {
  DatabaseAdapter,
  ObjectStorageAdapter,
  RealtimeStateAdapter,
  QueueAdapter,
  requireThat,
} from "../primitives.mjs";
import { AuthoritativeRooms } from "../rooms.mjs";
export class D1DatabaseAdapter extends DatabaseAdapter {
  constructor(binding) {
    super();
    this.binding = binding;
  }
  async get(sql, params = []) {
    return this.binding
      .prepare(sql)
      .bind(...params)
      .first();
  }
  async all(sql, params = []) {
    return (
      await this.binding
        .prepare(sql)
        .bind(...params)
        .all()
    ).results;
  }
  async atomic(statements) {
    if (statements.length)
      await this.binding.batch(
        statements.map(({ sql, params = [] }) =>
          this.binding.prepare(sql).bind(...params),
        ),
      );
  }
}
export class R2ObjectStorageAdapter extends ObjectStorageAdapter {
  constructor(binding) {
    super();
    this.binding = binding;
  }
  async putImmutable(key, value) {
    const existing = await this.binding.get(key);
    if (existing) {
      requireThat(
        (await existing.text()) === value,
        "IMMUTABLE_OBJECT_MISMATCH",
        409,
      );
      return;
    }
    const result = await this.binding.put(key, value, {
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: { contentType: "application/json" },
    });
    if (!result) {
      const object = await this.binding.get(key);
      requireThat(
        object && (await object.text()) === value,
        "IMMUTABLE_OBJECT_MISMATCH",
        409,
      );
    }
  }
  async get(key) {
    const object = await this.binding.get(key);
    requireThat(object, "OBJECT_MISSING", 503);
    return object.text();
  }
}
export class DurableObjectRealtimeAdapter extends RealtimeStateAdapter {
  constructor(binding) {
    super();
    this.binding = binding;
  }
  async command(command) {
    const room = this.binding.get(this.binding.idFromName(command.worldId));
    const r = await room.fetch("https://room.internal/command", {
      method: "POST",
      body: JSON.stringify(command),
    });
    const result = await r.json();
    requireThat(r.ok, result.code, r.status);
    return result;
  }
}
export class CloudflareQueueAdapter extends QueueAdapter {
  constructor(binding) {
    super();
    this.binding = binding;
  }
  async send(job) {
    await this.binding.send(job);
  }
}
/** Only a private service binding reaches this room; browsers cannot choose player identity. */
export class KAIOSWorldRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.owner = new AuthoritativeRooms();
    ctx.blockConcurrencyWhile(async () => {
      const rooms = await ctx.storage.get("rooms");
      if (rooms) this.owner.rooms = new Map(rooms);
    });
  }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      try {
        const result = await this.owner.command(await request.json());
        await this.ctx.storage.put("rooms", [...this.owner.rooms]);
        return Response.json(result);
      } catch (e) {
        return Response.json({ code: e.message }, { status: e.status ?? 503 });
      }
    });
  }
}
