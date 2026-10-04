import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, e.name);
    if (e.isDirectory()) await walk(path);
    else if (path.endsWith(".mjs")) {
      const r = spawnSync(process.execPath, ["--check", path], {
        encoding: "utf8",
      });
      if (r.status !== 0) throw new Error(r.stderr);
    }
  }
}
await walk(resolve(import.meta.dirname, "../src"));
await walk(resolve(import.meta.dirname, "../web"));
await walk(resolve(import.meta.dirname, "../deploy"));
await walk(resolve(import.meta.dirname));
console.log("Syntax checks passed.");
