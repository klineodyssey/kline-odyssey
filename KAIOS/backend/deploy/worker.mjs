import { verifyMessage } from "ethers";
import { createBackend } from "../src/service.mjs";
import {
  D1DatabaseAdapter,
  R2ObjectStorageAdapter,
  DurableObjectRealtimeAdapter,
  CloudflareQueueAdapter,
  KAIOSWorldRoom,
} from "../src/adapters/cloudflare.mjs";
export { KAIOSWorldRoom };
const instances = new WeakMap();
export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith("/api/v1/"))
      return env.ASSETS.fetch(request);
    const config = {
      domain: env.KAIOS_DOMAIN,
      origins: JSON.parse(env.KAIOS_ALLOWED_ORIGINS),
      chainIds: JSON.parse(env.KAIOS_CHAIN_IDS ?? "[97]"),
      maxRequestBytes: 512000,
      secureCookies: true,
      localDemo: false,
    };
    let api = instances.get(env);
    if (!api) {
      api = createBackend({
        database: new D1DatabaseAdapter(env.DB),
        objects: new R2ObjectStorageAdapter(env.BACKUPS),
        realtime: new DurableObjectRealtimeAdapter(env.WORLD_ROOMS),
        queue: new CloudflareQueueAdapter(env.JOBS),
        signatureVerifier: async (message, signature, wallet) => {
          try {
            return verifyMessage(message, signature).toLowerCase() === wallet;
          } catch {
            return false;
          }
        },
        config,
        logger: (r) => console.log(JSON.stringify(r)),
      });
      instances.set(env, api);
    }
    return api.fetch(request);
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      if (message.body.type === "DIAGNOSTIC_STAGING") {
        const rows = await env.DB.prepare(
          "SELECT phase,COUNT(*) AS count FROM staging_operations GROUP BY phase",
        ).all();
        console.log(
          JSON.stringify({ operation: "staging-health", result: rows.results }),
        );
        message.ack();
      } else message.retry();
    }
  },
};
