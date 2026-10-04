import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyMessage } from "ethers";
import {
  SQLiteDatabaseAdapter,
  FileObjectStorageAdapter,
  AuthoritativeRooms,
  LocalQueueAdapter,
} from "./adapters/local.mjs";
import { createBackend } from "./service.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../.."),
  backend = resolve(root, "KAIOS/backend"),
  port = Number(process.env.KAIOS_LOCAL_PORT ?? 8787),
  origin = `http://127.0.0.1:${port}`;
const dataDir = resolve(
  process.env.KAIOS_LOCAL_DATA_DIR ?? resolve(backend, ".local"),
);
await mkdir(dataDir, { recursive: true });
const database = new SQLiteDatabaseAdapter(resolve(dataDir, "kaios.sqlite"));
database.migrate(await readFile(resolve(backend, "deploy/0001.sql"), "utf8"));
const api = createBackend({
  database,
  objects: new FileObjectStorageAdapter(resolve(dataDir, "objects")),
  realtime: new AuthoritativeRooms(),
  queue: new LocalQueueAdapter(),
  signatureVerifier: async (message, signature, wallet, challengeId) =>
    (signature === `LOCAL_DEMO:${challengeId}` &&
      wallet === "0x0000000000000000000000000000000000000097") ||
    verifyMessage(message, signature).toLowerCase() === wallet,
  config: {
    domain: origin,
    origins: [origin],
    chainIds: [97],
    maxRequestBytes: 512000,
    localDemo: true,
    secureCookies: false,
  },
  logger: (r) => console.log(JSON.stringify(r)),
});
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith("/api/v1/")) {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 512000) {
          res.writeHead(413);
          res.end();
          return;
        }
        chunks.push(chunk);
      }
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method)
          ? undefined
          : Buffer.concat(chunks),
      });
      const response = await api.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (path === "/" || path === "/recovery") {
      res.writeHead(302, { location: "/KAIOS/backend/web/index.html" });
      res.end();
      return;
    }
    const file = resolve(root, "." + path);
    const allowed =
      file.startsWith(resolve(backend, "web") + "/") ||
      file ===
        resolve(
          root,
          "K線西遊記/temples/11520/runtime/player-life-runtime.mjs",
        ) ||
      file ===
        resolve(root, "K線西遊記/temples/11520/runtime/player-cloud-sync.mjs");
    if (!allowed) {
      res.writeHead(404);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type":
        {
          ".html": "text/html;charset=utf-8",
          ".mjs": "text/javascript;charset=utf-8",
          ".css": "text/css;charset=utf-8",
        }[extname(file)] ?? "application/octet-stream",
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(503);
    res.end("服務暫時無法使用");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `KAIOS Recovery Center: ${origin}/recovery (loopback-only local demo; not production)`,
  ),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      database.close();
      process.exit(0);
    }),
  );
