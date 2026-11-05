import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

const softwareHistoryStep = "Require complete Software Life Git history";
const softwareSuiteStep = "Run complete Software Life suites";
function workflowStep(workflow, name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.ok(start >= 0, name);
  const end = workflow.indexOf("\n      - ", start + marker.length);
  return workflow.slice(start, end < 0 ? workflow.length : end);
}
function workflowRun(step) {
  const marker = "        run: |\n";
  assert.ok(step.includes(marker));
  return step.slice(step.indexOf(marker) + marker.length).split("\n")
    .map((line) => line.startsWith("          ") ? line.slice(10) : line).join("\n");
}

test("Software Life CI retains exact-head read-only bounds and runs every existing suite without filters", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  const job = workflow.slice(workflow.indexOf("  test:"), workflow.indexOf("  digital-ant-public-read-only-worker:"));
  assert.match(job, /ref: \$\{\{ github.event_name == 'pull_request' && github.event.pull_request.head.sha \|\| github.sha \}\}/);
  assert.match(job, /fetch-depth: 0/);
  assert.match(job, /timeout-minutes: 10/);
  const suiteStep = workflowStep(workflow, softwareSuiteStep);
  const command = workflowRun(suiteStep).replace(/\\\n\s*/g, " ").replace(/\s+/g, " ").trim();
  assert.equal(command, "node --test KAIOS/software-life/tests/software-organ-standards.test.mjs KAIOS/software-life/tests/software-life-registry.test.mjs KAIOS/software-life/tests/software-life-naming-audit.test.mjs");
  assert.doesNotMatch(suiteStep, /if:|continue-on-error:|--test-name-pattern|--test-skip-pattern/);
  assert.ok(job.indexOf(softwareHistoryStep) < job.indexOf(softwareSuiteStep));
  assert.doesNotMatch(job, /playwright|chromium|workflow_dispatch|contents:\s*write|actions:\s*write/);
  const ownedPaths = ["KAIOS/software-life/**", "assets/kaios-audio.mjs", "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json",
    "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json", "KGEN-KAIOS/organism/taxonomy_registry.json",
    "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md"];
  const triggers = workflow.slice(0, workflow.indexOf("\npermissions:"));
  for (const path of ownedPaths) assert.equal(triggers.split(`- "${path}"`).length - 1, 2, path);
  for (const broad of ["docs/**", "KGEN-KAIOS/**", "KAIOS/**", "assets/**"]) assert.equal(triggers.includes(`- "${broad}"`), false, broad);
  const standard = await fs.readFile(new URL("../KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_STANDARD.md", import.meta.url), "utf8");
  for (const owner of ownedPaths.slice(2)) assert.ok(standard.includes(owner), `explicit named owner: ${owner}`);
});

test("Software Life history preflight rejects shallow, missing or unreachable evidence without repinning", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  const body = workflowRun(workflowStep(workflow, softwareHistoryStep));
  const validator = await fs.readFile(new URL("../KAIOS/software-life/tools/validate-software-organ-transplant.mjs", import.meta.url), "utf8");
  const organTests = await fs.readFile(new URL("../KAIOS/software-life/tests/software-organ-standards.test.mjs", import.meta.url), "utf8");
  const authority = "cc80135f2c6e6a74aad11f34e793c65ac0ee1938", source = "e26f3a76ef0be7f43058225f46def3fbe123371e";
  assert.ok(validator.includes(`CANONICAL_LINEAGE_ANCHOR = "${authority}"`));
  assert.ok(organTests.includes(`candidateSourceCommit = '${source}'`));
  assert.ok(body.includes(authority) && body.includes(source));
  for (const subject of ["test(kaios): bind semantic transplant evidence fixture", "fix(kaios): allow completed transplant projections",
    "test(kaios): add completion provenance fixture projection"]) {
    assert.ok(body.includes(subject)); assert.ok(organTests.includes(`gitCommitBySubject("${subject}")`));
  }
  assert.doesNotMatch(body, /git\s+(fetch|checkout|reset|update-ref|commit|push)\b/);
  assert.equal((body.match(/git config --null --get-all remote\.origin\.url/g) || []).length, 2);
  assert.equal((body.match(/git remote set-url origin https:\/\/github\.com\/klineodyssey\/kline-odyssey\.git/g) || []).length, 1);
  assert.doesNotMatch(body, /git config --(?:add|replace-all|unset|global|system|local)|http\.extraheader|credential|token/i);
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  // Every workflow command is intercepted by this synthetic Git function. The
  // unit suite never runs normalization against a real developer/worktree origin;
  // the actual normalization proof belongs in an isolated temporary checkout.
  const mock = `git() {
    case "$*" in
      "rev-parse --is-shallow-repository") if [ "$SCENARIO" = shallow ]; then echo true; else echo false; fi ;;
      "rev-parse HEAD") echo ffffffffffffffffffffffffffffffffffffffff ;;
      "config --null --get-all remote.origin.url") printf '%s\\0' https://github.com/klineodyssey/kline-odyssey.git ;;
      "remote get-url origin") echo https://github.com/klineodyssey/kline-odyssey.git ;;
      "cat-file -e "*) if [ "$SCENARIO" = missing_anchor ] && [[ "$2" != "" ]]; then return 1; fi ;;
      "merge-base --is-ancestor "*) if [ "$SCENARIO" = unreachable ]; then return 1; fi ;;
      "log "*) if [ "$SCENARIO" != missing_fixture ]; then echo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; fi ;;
      *) return 99 ;;
    esac
  }\n`;
  for (const scenario of ["complete", "shallow", "missing_anchor", "unreachable", "missing_fixture"]) {
    const result = spawnSync("bash", ["-c", mock + body], { cwd, env: { ...process.env, SCENARIO: scenario }, encoding: "utf8", timeout: 5000 });
    assert.equal(result.status === 0, scenario === "complete", `${scenario}: ${result.stderr}`);
    if (scenario === "shallow") assert.match(result.stderr, /SOFTWARE_LIFE_FULL_HISTORY_REQUIRED/);
    if (scenario === "missing_fixture") assert.match(result.stderr, /SOFTWARE_LIFE_FIXTURE_HISTORY_MISSING/);
  }
});

test("Software Life checkout normalization accepts only the two exact canonical HTTPS origins", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  const body = workflowRun(workflowStep(workflow, softwareHistoryStep));
  const canonical = "https://github.com/klineodyssey/kline-odyssey.git";
  const checkout = "https://github.com/klineodyssey/kline-odyssey";
  // These are synthetic URL fixtures; no network, credentials or real Git config
  // is changed by the model. The setter marker proves foreign origins stay put.
  const mock = `git() {
    case "$*" in
      "rev-parse --is-shallow-repository") echo false ;;
      "rev-parse HEAD") echo ffffffffffffffffffffffffffffffffffffffff ;;
      "config --null --get-all remote.origin.url") case "$ORIGIN_MODE" in second_empty) printf '%s\\0\\0' "$TEST_ORIGIN" ;; duplicate) printf '%s\\0%s\\0' "$TEST_ORIGIN" "$TEST_ORIGIN" ;; *) printf '%s\\0' "$TEST_ORIGIN" ;; esac ;;
      "remote get-url origin") if [ "$REWRITE_ORIGIN" = yes ]; then echo https://example.invalid/foreign.git; elif [ "$REWRITE_ORIGIN" = canonical ]; then echo https://github.com/klineodyssey/kline-odyssey.git; elif [ "$REWRITE_ORIGIN" = newline ]; then printf '%s\\n\\n' "$TEST_ORIGIN"; else printf '%s\\n' "$TEST_ORIGIN"; fi ;;
      "remote set-url origin https://github.com/klineodyssey/kline-odyssey.git") TEST_ORIGIN=https://github.com/klineodyssey/kline-odyssey.git; echo NORMALIZED_CANONICAL_ORIGIN >&2 ;;
      "cat-file -e "*|"merge-base --is-ancestor "*) return 0 ;;
      "log "*) echo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ;;
      *) return 99 ;;
    esac
  }\n`;
  const run = (origin, rewrite = "no", originMode = "single") => spawnSync("bash", ["-c", mock + body], {
    env: { ...process.env, TEST_ORIGIN: origin, REWRITE_ORIGIN: rewrite, ORIGIN_MODE: originMode }, encoding: "utf8", timeout: 5000
  });
  for (const origin of [checkout, canonical]) {
    const result = run(origin); assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr.includes("NORMALIZED_CANONICAL_ORIGIN"), origin === checkout);
  }
  for (const origin of ["", `${canonical}?query=denied`, `${canonical}#fragment`, `${canonical}/`,
    "https://fixture:denied@github.com/klineodyssey/kline-odyssey.git", "https://github.com:443/klineodyssey/kline-odyssey.git",
    "https://github.com/foreign/kline-odyssey.git", "https://example.invalid/klineodyssey/kline-odyssey.git",
    "http://github.com/klineodyssey/kline-odyssey.git", "git@github.com:klineodyssey/kline-odyssey.git",
    "ssh://git@github.com/klineodyssey/kline-odyssey.git", `${checkout}\n${canonical}`, `${checkout}\n`, `${canonical}\n`]) {
    const result = run(origin); assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SOFTWARE_LIFE_CANONICAL_ORIGIN_REQUIRED/);
    assert.doesNotMatch(result.stderr, /NORMALIZED_CANONICAL_ORIGIN/);
  }
  const rewritten = run(checkout, "yes"); assert.notEqual(rewritten.status, 0);
  assert.match(rewritten.stderr, /SOFTWARE_LIFE_ORIGIN_REWRITE_FORBIDDEN/);
  assert.doesNotMatch(rewritten.stderr, /NORMALIZED_CANONICAL_ORIGIN/);
  const hiddenForeign = run("git@github.com:klineodyssey/kline-odyssey.git", "canonical");
  assert.notEqual(hiddenForeign.status, 0); assert.match(hiddenForeign.stderr, /SOFTWARE_LIFE_CANONICAL_ORIGIN_REQUIRED/);
  assert.doesNotMatch(hiddenForeign.stderr, /NORMALIZED_CANONICAL_ORIGIN/);
  for (const mode of ["second_empty", "duplicate"]) {
    const multiple = run(canonical, "no", mode); assert.notEqual(multiple.status, 0);
    assert.match(multiple.stderr, /SOFTWARE_LIFE_CANONICAL_ORIGIN_REQUIRED/);
    assert.doesNotMatch(multiple.stderr, /NORMALIZED_CANONICAL_ORIGIN/);
  }
  const effectiveNewline = run(checkout, "newline"); assert.notEqual(effectiveNewline.status, 0);
  assert.match(effectiveNewline.stderr, /SOFTWARE_LIFE_ORIGIN_REWRITE_FORBIDDEN/);
  assert.doesNotMatch(effectiveNewline.stderr, /NORMALIZED_CANONICAL_ORIGIN/);
});
