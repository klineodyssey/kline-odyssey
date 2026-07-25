#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { migrateLegacyParcels } from "../adapters/organism-schema-v2-adapter.js";

const root = new URL("../", import.meta.url);
const sourceUrl = new URL("data/synthetic-world.json", root);
const defaultOutputUrl = new URL("data/schema-v2-land-candidates.json", root);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const outputArgument = argument("--output");
const outputUrl = outputArgument
  ? pathToFileURL(resolve(outputArgument))
  : defaultOutputUrl;
if (fileURLToPath(outputUrl) === fileURLToPath(sourceUrl)) {
  throw new Error("Dry-run output must not overwrite the source fixture.");
}
const world = JSON.parse(await readFile(sourceUrl, "utf8"));
const before = JSON.stringify(world);
const result = await migrateLegacyParcels(world.parcels);

if (JSON.stringify(world) !== before) {
  throw new Error("Dry-run migration mutated the source fixture.");
}

if (process.argv.includes("--stdout")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  await writeFile(outputUrl, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`DRY_RUN PASS: ${result.generated_record_count} candidate records -> ${outputUrl.pathname}`);
}
