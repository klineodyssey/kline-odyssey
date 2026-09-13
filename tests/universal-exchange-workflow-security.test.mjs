import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("Digital Ant scheduled worker is repository-read-only and cannot deploy Pages", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");

  assert.match(workflow, /cron: "17 \* \* \* \*"/);
  assert.match(workflow, /digital-ant-public-read-only-worker:/);
  assert.match(workflow, /--status "K線西遊記\/temples\/11520\/runtime\/worker-status\.json"/);
  assert.match(workflow, /Preserve public Work Event evidence without repository mutation/);
  assert.match(workflow, /uses: actions\/upload-artifact@v7/);
  assert.doesNotMatch(workflow, /uses: actions\/upload-artifact@v4/);
  assert.equal((workflow.match(/uses: actions\/checkout@v7/g) || []).length, 2);
  assert.equal((workflow.match(/uses: actions\/setup-node@v7/g) || []).length, 2);
  assert.equal((workflow.match(/timeout-minutes:\s*10/g) || []).length, 2);

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+add\b/);
  assert.doesNotMatch(workflow, /git\s+commit\b/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /gh\s+workflow\s+run\s+deploy-pages-static\.yml/);
  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY|SIGN_TRANSACTION|PRIVATE_KEY/);
});

test("Cursor dispatch wake is an inert fail-closed audit gate", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/kgen-cursor-dispatch-wake.yml", import.meta.url), "utf8");

  assert.match(workflow, /pull_request:\s*\n\s*types: \[closed\]/);
  assert.match(workflow, /startsWith\(github\.event\.pull_request\.head\.ref, 'codex\/'\)/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /timeout-minutes:\s*5/);
  assert.match(workflow, /HOLD_EXPLICIT_HUMAN_DISPATCH_AUTHORITY_REQUIRED/);
  assert.match(workflow, /External API called: .*NO/);
  assert.match(workflow, /Agent launched: .*NO/);

  assert.doesNotMatch(workflow, /CURSOR_API_KEY|secrets\./);
  assert.doesNotMatch(workflow, /api\.cursor\.com|https?:\/\//);
  assert.doesNotMatch(workflow, /curl\b|wget\b|fetch\(/);
  assert.doesNotMatch(workflow, /actions\/checkout|actions\/setup-node/);
  assert.doesNotMatch(workflow, /contents:\s*write|actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /PRIVATE_KEY|SIGN_TRANSACTION/);
});
