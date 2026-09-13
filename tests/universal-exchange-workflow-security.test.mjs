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

test("Cursor dispatch wake is a Human-approved bounded single-task gate", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/kgen-cursor-dispatch-wake.yml", import.meta.url), "utf8");

  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /\.github\/workflows\/kgen-cursor-dispatch-wake\.yml/);
  assert.match(workflow, /KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001/);
  assert.match(workflow, /READY_FOR_ATOMIC_CLAIM/);
  assert.match(workflow, /MAX_LAUNCHES_PER_DAY: "4"/);
  assert.match(workflow, /WATCHDOG_SECONDS: "300"/);
  assert.match(workflow, /MAX_WATCHDOG_CHECKS: "12"/);
  assert.match(workflow, /timeout-minutes:\s*65/);
  assert.match(workflow, /agentId/);
  assert.match(workflow, /api\.cursor\.com\/v1\/agents/);
  assert.match(workflow, /runs\/\$\{run_id\}\/cancel/);
  assert.match(workflow, /usage\?runId=\$\{run_id\}/);
  assert.match(workflow, /CURSOR_API_KEY: \$\{\{ secrets\.CURSOR_API_KEY \}\}/);
  assert.match(workflow, /4xx was not retried and 5xx retry limit was enforced/);
  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.doesNotMatch(workflow, /contents:\s*write|actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /PRIVATE_KEY|SIGN_TRANSACTION|TOKEN_TRANSFER|TREASURY_TRANSFER/);
});
