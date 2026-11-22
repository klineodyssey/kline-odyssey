import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("Digital Ant scheduled worker is repository-read-only and cannot deploy Pages", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");

  assert.match(workflow, /cron: "17 \* \* \* \*"/);
  assert.match(workflow, /digital-ant-public-read-only-worker:/);
  assert.match(workflow, /--status "\$RUNNER_TEMP\/digital-ant-runtime\/worker-status\.json"/);
  assert.match(workflow, /Preserve status and actual incident Work Event evidence without repository mutation/);
  assert.match(workflow, /Preserve status and actual incident Work Event evidence without repository mutation\r?\n\s+if: always\(\)/);
  assert.match(workflow, /uses: actions\/upload-artifact@v7/);
  assert.match(workflow, /uses: actions\/download-artifact@v8/);
  assert.match(workflow, /uses: actions\/github-script@v9/);
  assert.equal((workflow.match(/continue-on-error:\s*true/g) || []).length, 2);
  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /Restore previous read-only status for consecutive-cycle detection/);
  assert.match(workflow, /previous_events="\$previous_runtime\/work-events"/);
  assert.match(workflow, /cp "\$previous_events"\/DIGITAL_ANT_0001_HOURLY_\*\.json "\$RUNNER_TEMP\/digital-ant-runtime\/work-events\/"/);
  assert.match(workflow, /item\.name === expectedName/);
  assert.doesNotMatch(workflow, /item\.name\.startsWith\("digital-ant-hourly-"\)/);
  assert.doesNotMatch(workflow, /uses: actions\/upload-artifact@v4/);
  assert.equal((workflow.match(/uses: actions\/checkout@v7/g) || []).length, 2);
  assert.equal((workflow.match(/uses: actions\/setup-node@v7/g) || []).length, 2);
  assert.equal((workflow.match(/timeout-minutes:\s*10/g) || []).length, 2);
  assert.match(workflow, /Confirm exact pull request head and clean patch/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$HEAD_SHA"/);
  assert.match(workflow, /git diff --check "\$BASE_SHA"\.\.\.HEAD/);
  assert.doesNotMatch(workflow, /authorized prototype scope/);
  assert.doesNotMatch(workflow, /unexpected=.*core\/life\/index/);

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /actions:\s*write/);
  assert.doesNotMatch(workflow, /git\s+add\b/);
  assert.doesNotMatch(workflow, /git\s+commit\b/);
  assert.doesNotMatch(workflow, /git\s+push\b/);
  assert.doesNotMatch(workflow, /gh\s+workflow\s+run\s+deploy-pages-static\.yml/);
  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY|SIGN_TRANSACTION|PRIVATE_KEY/);
});

test("Digital Ant artifact selection is deterministic and accepts only the exact newest valid run-attempt name", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  const match = workflow.match(/id: previous-runtime[\s\S]*?script: \|\r?\n([\s\S]*?)\r?\n      - name: Download previous Digital Ant runtime evidence/);
  assert.ok(match);
  const script = match[1].split(/\r?\n/).map((line) => line.replace(/^ {12}/, "")).join("\n");
  const runs = [
    { id: 41, run_number: 41, run_attempt: 1, status: "completed", head_branch: "main", event: "schedule" },
    { id: 43, run_number: 43, run_attempt: 2, status: "completed", head_branch: "main", event: "schedule" },
    { id: 42, run_number: 42, run_attempt: 3, status: "completed", head_branch: "main", event: "workflow_dispatch" },
    { id: 44, run_number: 44, run_attempt: 1, status: "completed", head_branch: "feature", event: "schedule" },
    { id: 99, run_number: 99, run_attempt: 1, status: "completed", head_branch: "main", event: "schedule" }
  ];
  const artifacts = new Map([
    [43, [{ name: "digital-ant-hourly-43-2-prefix-spoof", expired: false }]],
    [42, [{ name: "digital-ant-hourly-42-2", expired: false }, { name: "digital-ant-hourly-42-3", expired: false }]],
    [41, [{ name: "digital-ant-hourly-41-1", expired: false }]]
  ]);
  const listWorkflowRuns = Symbol("listWorkflowRuns");
  const listWorkflowRunArtifacts = Symbol("listWorkflowRunArtifacts");
  const github = {
    rest: { actions: { listWorkflowRuns, listWorkflowRunArtifacts } },
    async paginate(method, args) { return method === listWorkflowRuns ? runs : artifacts.get(args.run_id) ?? []; }
  };
  const outputs = {};
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction("github", "context", "core", script)(github, { repo: { owner: "klineodyssey", repo: "kline-odyssey" }, runId: 99 }, { setOutput(key, value) { outputs[key] = value; } });
  assert.deepEqual(outputs, { "run-id": "42", "artifact-name": "digital-ant-hourly-42-3" });
});

test("Cursor Cloud is manual-only and suspended by Human cost decision", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/kgen-cursor-dispatch-wake.yml", import.meta.url), "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:|push:|schedule:/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /timeout-minutes:\s*5/);
  assert.match(workflow, /SUSPENDED_BY_HUMAN_COST_DECISION/);
  assert.match(workflow, /HTTP 403 retry: .*DISABLED/);
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


test("Cursor operational state cannot self-authorize an external launch", async () => {
  const readJson = async (path) => JSON.parse(await fs.readFile(new URL(path, import.meta.url), "utf8"));
  const envelope = await readJson("../KAIOS/economy/life-energy-payroll/KAIOS_CURSOR_LIFE_ENERGY_PAYROLL_TASK_ENVELOPE.json");
  const queue = await readJson("../KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json");
  const projection = await readJson("../api/kaios/ai-company/v1/cursor-queue.json");
  const registry = await readJson("../KGEN-KAIOS/worker_registry.json");
  const workQueue = await fs.readFile(new URL("../KGEN-Organization/WorkOrders/WORK_QUEUE.md", import.meta.url), "utf8");
  assert.equal(envelope.status, "SUSPENDED_BY_HUMAN_COST_DECISION");
  assert.equal(envelope.dispatch_mode, "ON_DEMAND_EXTERNAL_CAPACITY_ONLY");
  for (const key of ["automatic", "external_autonomy", "cursor_api_key_required", "external_wake_workflow_allowed"]) assert.equal(envelope[key], false);
  assert.equal(envelope.bounded_pilot_policy.authorized_by, null);
  assert.equal(envelope.bounded_pilot_policy.authorization_evidence, "HUMAN_CURSOR_CLOUD_DEFERRED_UNTIL_HIGH_WORKLOAD_2026-09-13");
  assert.equal(queue.bounded_pilot.status, "SUSPENDED_BY_HUMAN_COST_DECISION");
  assert.equal(queue.bounded_pilot.authorized_by, null);
  assert.equal(queue.bounded_pilot.limits_state, "INACTIVE_DEFERRED_UNTIL_HIGH_WORKLOAD");
  assert.deepEqual(projection.bounded_pilot, queue.bounded_pilot);
  assert.equal(registry.active_claims.length, 0);
  assert.equal(registry.workers.find(({worker_id}) => worker_id === "cursor-01").status, "OFFLINE");
  assert.equal(registry.workers.find(({worker_id}) => worker_id === "cursor-01").autonomy_scope, "ON_DEMAND_EXTERNAL_CAPACITY_ONLY");
  assert.match(workQueue, /KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001 \| HOLD \|/);
});
