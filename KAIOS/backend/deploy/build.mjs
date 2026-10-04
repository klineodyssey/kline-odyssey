import { build } from "esbuild";
import { mkdir, cp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../../.."),
  out = resolve(import.meta.dirname, "../.candidate");
await mkdir(out, { recursive: true });
await build({
  entryPoints: [resolve(import.meta.dirname, "worker.mjs")],
  outfile: out + "/worker.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
});
await cp(
  resolve(root, "KAIOS/backend/web"),
  out + "/public/KAIOS/backend/web",
  { recursive: true },
);
const runtime = out + "/public/K線西遊記/temples/11520/runtime";
await mkdir(runtime, { recursive: true });
for (const f of ["player-life-runtime.mjs", "player-cloud-sync.mjs"])
  await cp(
    resolve(root, "K線西遊記/temples/11520/runtime", f),
    runtime + "/" + f,
  );
await writeFile(
  out + "/public/_redirects",
  "/ /KAIOS/backend/web/index.html 302\n/recovery /KAIOS/backend/web/index.html 302\n",
);
await writeFile(
  out + "/public/_headers",
  "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n",
);
console.log("Deployment candidate built locally. No deployment performed.");
