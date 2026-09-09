import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const sourceUrl = new URL("./universal-exchange.test.mjs", import.meta.url);
const migratedUrl = new URL("./.universal-exchange-security-migrated.test.mjs", import.meta.url);
const source = await fs.readFile(sourceUrl, "utf8");

const startMarker = 'test("V3.4 workflow is hourly, exact-scoped and cannot access signer secrets", async () => {';
const nextMarker = 'test("V3.4 Node worker uses a signer-free fetch transport and verifies BSC chain 56", async () => {';
const start = source.indexOf(startMarker);
const end = source.indexOf(nextMarker, start + startMarker.length);
assert.ok(start >= 0 && end > start, "legacy V3.4 workflow assertion block must exist exactly where expected");
assert.equal(source.indexOf(startMarker, start + 1), -1, "legacy V3.4 workflow assertion block must be unique");

const legacyBlock = source.slice(start, end);
for (const required of [
  'git add -- "K線西遊記\\/temples\\/11520\\/runtime\\/worker-status\\.json"',
  'actions: write',
  'gh workflow run deploy-pages-static\\.yml --ref main',
]) {
  assert.ok(legacyBlock.includes(required), `legacy migration guard missing expected stale assertion: ${required}`);
}

const replacement = `test("V3.4 scheduled worker repository mutation is prohibited", async () => {\n  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");\n  assert.match(workflow, /cron: "17 \\* \\* \\* \\*"/);\n  assert.match(workflow, /--status "K線西遊記\\/temples\\/11520\\/runtime\\/worker-status\\.json"/);\n  assert.doesNotMatch(workflow, /contents:\\s*write/);\n  assert.doesNotMatch(workflow, /actions:\\s*write/);\n  assert.doesNotMatch(workflow, /git\\s+(?:add|commit|push)\\b/);\n  assert.doesNotMatch(workflow, /gh\\s+workflow\\s+run\\s+deploy-pages-static\\.yml/);\n  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY|SIGN_TRANSACTION|PRIVATE_KEY/);\n});\n\n`;

const migrated = source.slice(0, start) + replacement + source.slice(end);
await fs.writeFile(migratedUrl, migrated, "utf8");
try {
  const run = spawnSync(process.execPath, ["--test", migratedUrl.pathname], { stdio: "inherit" });
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
} finally {
  await fs.rm(migratedUrl, { force: true });
}
