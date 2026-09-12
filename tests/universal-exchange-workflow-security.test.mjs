import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("Digital Ant scheduled worker is repository-read-only and cannot deploy Pages", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");

  assert.match(workflow, /cron: "17 \* \* \* \*"/);
  assert.match(workflow, /digital-ant-public-read-only-worker:/);
  assert.match(workflow, /--status "K線西遊記\/temples\/11520\/runtime\/worker-status\.json"/);
  assert.match(workflow, /Preserve public Work Event evidence without repository mutation/);
  assert.match(workflow, /uses: actions\/upload-artifact@v4/);

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+add\b/);
  assert.doesNotMatch(workflow, /git\s+commit\b/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /gh\s+workflow\s+run\s+deploy-pages-static\.yml/);
  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY|SIGN_TRANSACTION|PRIVATE_KEY/);
});

test("Cursor dispatch wake fails closed without exposing API bodies or shell-evaluating PR metadata", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/kgen-cursor-dispatch-wake.yml", import.meta.url), "utf8");

  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /timeout-minutes:\s*5/);
  assert.match(workflow, /MERGED_PR_NUMBER:\s*\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(workflow, /MERGED_PR_HEAD_REF:\s*\$\{\{ github\.event\.pull_request\.head\.ref \}\}/);
  assert.match(workflow, /Merged PR: #\$\{MERGED_PR_NUMBER\} \(\$\{MERGED_PR_HEAD_REF\}\)/);
  assert.match(workflow, /re\.fullmatch\(r"\[A-Za-z0-9_\.\-\]\{1,64\}", code\)/);
  assert.match(workflow, /\[ "\$HTTP" = "403" \] && \[ "\$API_ERROR_CODE" = "plan_required" \]/);
  assert.match(workflow, /HOLD_EXTERNAL_PLAN_REQUIRED/);
  assert.match(workflow, /Agent launched: \\`NO\\`/);
  assert.match(workflow, /untrusted_error_code/);
  assert.match(workflow, /https:\/\/api\.cursor\.com\/v1\/agents/);
  assert.match(workflow, /--user "\$\{CURSOR_API_KEY\}:"/);
  assert.match(workflow, /--connect-timeout 10 --max-time 60/);
  assert.match(workflow, /API_RESPONSE_STATUS=/);
  assert.match(workflow, /run_agent_id == agent_id/);
  assert.match(workflow, /structured agent\/run acknowledgement missing/);

  assert.doesNotMatch(workflow, /cat\s+\/tmp\/cursor-agent\.json/);
  assert.doesNotMatch(workflow, /echo\s+[^\n]*\/tmp\/cursor-agent\.json/);
  assert.doesNotMatch(workflow, /Authorization:\s*Bearer/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /PRIVATE_KEY|SIGN_TRANSACTION/);
});
