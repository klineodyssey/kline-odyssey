import { chromium } from "playwright";
import { Wallet, getBytes } from "ethers";
import { spawn } from "node:child_process";
import { mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const dataDir = await mkdtemp("/tmp/kaios-browser-");
const port = Number(process.env.KAIOS_BROWSER_PORT ?? 8798),
  origin = `http://127.0.0.1:${port}`,
  dir = new URL("../evidence/", import.meta.url);
await mkdir(dir, { recursive: true });
const server = spawn(process.execPath, ["src/local-server.mjs"], {
  cwd: new URL("../", import.meta.url),
  env: {
    ...process.env,
    KAIOS_LOCAL_PORT: String(port),
    KAIOS_TEST_EMAIL: "1",
    KAIOS_LOCAL_DATA_DIR: dataDir,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (c) => (serverOutput += c));
server.stderr.on("data", (c) => (serverOutput += c));
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + "/api/v1/health")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
    if (i === 99) throw new Error("Server failed: " + serverOutput);
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.KAIOS_CHROMIUM
      ? { executablePath: process.env.KAIOS_CHROMIUM }
      : {}),
    args: ["--no-sandbox"],
  });
  const errors = [],
    results = [];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/recovery");
  await page.locator("#demo").waitFor({ state: "visible" });
  await page.screenshot({
    path: new URL("390x844-account-enrollment.png", dir).pathname,
    fullPage: true,
  });
  const testEmail = "browser-" + crypto.randomUUID() + "@example.test";
  await page.locator("#email").fill(testEmail);
  await page.locator("#requestEmail").click();
  await page.waitForFunction(() =>
    document.querySelector("#message").textContent.includes("若符合條件"),
  );
  const testMessages = await (
    await context.request.get(origin + "/__test/mail")
  ).json();
  await page
    .locator("#emailToken")
    .fill(testMessages.findLast((m) => m.to === testEmail).token);
  await page.locator("#verifyEmail").click();
  await page.locator("#dashboard").waitFor({ state: "visible" });
  await page.locator("#snapshots li").first().waitFor();
  assert.equal(await page.locator("#revision").innerText(), "1");
  assert.equal(await page.locator("#health").innerText(), "健康，備份可用");
  await page.screenshot({
    path: new URL("390x844-current.png", dir).pathname,
    fullPage: true,
  });
  await page.locator("#backup").click();
  await page.waitForFunction(
    () => document.querySelectorAll("#snapshots li").length >= 2,
  );
  await page
    .locator("#snapshots li")
    .filter({ hasText: "手動備份" })
    .getByRole("button", { name: "驗證備份" })
    .click();
  await page.waitForFunction(() =>
    document.querySelector("#message").textContent.includes("健康"),
  );
  await page.evaluate(async () => {
    const { createLocalPlayerStore } =
      await import("/K線西遊記/temples/11520/runtime/player-life-runtime.mjs");
    const store = createLocalPlayerStore({ storage: localStorage });
    store.saveProgress({ lastXYZ: { x: 77, y: 1, z: -8 } });
  });
  await page.locator("#sync").click();
  await page.waitForFunction(
    () => document.querySelector("#revision").textContent === "2",
  );
  const firstBackup = page
    .locator("#snapshots li")
    .filter({ hasText: "手動備份" });
  await firstBackup.getByRole("button", { name: "恢復預覽" }).click();
  await page.locator("#preview").waitFor({ state: "visible" });
  assert.equal(await page.locator("#restore").isDisabled(), true);
  await page.screenshot({
    path: new URL("390x844-preview.png", dir).pathname,
    fullPage: true,
  });
  await page.locator("#confirm").check();
  await page.locator("#restore").click();
  await page.waitForFunction(
    () => document.querySelector("#revision").textContent === "3",
  );
  await page.waitForFunction(() =>
    document.querySelector("#receipt").textContent.includes("不是區塊鏈收據"),
  );
  assert.match(await page.locator("#receipt").innerText(), /不是區塊鏈收據/);
  assert.ok(
    await page
      .locator("#snapshots li")
      .filter({ hasText: "恢復前保護備份" })
      .count(),
  );
  await page.screenshot({
    path: new URL("390x844-restored.png", dir).pathname,
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await page.locator("#apply").click();
  await page.waitForFunction(() =>
    document.querySelector("#message").textContent.includes("已載入本機"),
  );
  // Simulated device B writes after A's last sync. A must preserve its old base revision.
  await page.evaluate(async () => {
    const current = await (await fetch("/api/v1/player/state")).json();
    current.state.player.lastXYZ = { x: 88, y: 0, z: 0 };
    current.state.coordinates.local.lastXYZ = { x: 88, y: 0, z: 0 };
    const r = await fetch("/api/v1/player/state/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        baseRevision: current.revision,
        state: current.state,
      }),
    });
    if (!r.ok) throw new Error("device B write failed");
  });
  await page.locator("#sync").click();
  await page.locator("#conflict").waitFor({ state: "visible" });
  await page.screenshot({
    path: new URL("390x844-conflict.png", dir).pathname,
    fullPage: true,
  });
  await page.locator("#conflictPreview").click();
  await page.locator("#preview").waitFor({ state: "visible" });
  await page.locator("#confirm").check();
  await page.locator("#restore").click();
  await page.waitForFunction(
    () => document.querySelector("#revision").textContent === "5",
  );
  await page.waitForFunction(() =>
    document.querySelector("#receipt").textContent.includes("版本 5"),
  );
  assert.equal(await page.locator("#conflict").isVisible(), false);
  const downloadPromise = page.waitForEvent("download");
  await page
    .locator("#snapshots li")
    .first()
    .getByRole("button", { name: "匯出", exact: true })
    .click();
  const download = await downloadPromise,
    path = await download.path();
  const { readFile } = await import("node:fs/promises"),
    pkg = JSON.parse(await readFile(path, "utf8"));
  assert.equal(pkg.format, "KAIOS_PLAYER_BACKUP");
  assert.equal(pkg.payload.player.walletLinks.length, 0);
  await page.locator("#import").setInputFiles({
    name: "own-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(pkg)),
  });
  await page.locator("#preview").waitFor({ state: "visible" });
  assert.equal(await page.locator("#restore").isDisabled(), true);
  await page.locator("#cancel").click();
  for (const [width, height] of [
    [360, 740],
    [390, 844],
    [412, 772],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator("#refresh").click();
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false);
    const buttons = await page.locator("button:visible").evaluateAll((bs) =>
      bs.map((b) => ({
        label: b.textContent,
        height: b.getBoundingClientRect().height,
      })),
    );
    assert.ok(buttons.every((b) => b.height >= 44));
    await page.screenshot({
      path: new URL(`${width}x${height}.png`, dir).pathname,
      fullPage: true,
    });
    results.push({
      viewport: `${width}x${height}`,
      overflow: false,
      minimumTouchTarget: 44,
    });
  }
  const signer = Wallet.createRandom(),
    walletContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    }),
    rpc = [];
  await walletContext.exposeFunction(
    "__signKAIOSFixture",
    async (hex, address) => {
      assert.equal(address, signer.address);
      assert.match(hex, /^0x[0-9a-f]+$/);
      return signer.signMessage(getBytes(hex));
    },
  );
  await walletContext.exposeFunction("__recordKAIOSRPC", (method) =>
    rpc.push(method),
  );
  await walletContext.addInitScript(
    ({ address }) => {
      globalThis.ethereum = {
        request: async ({ method, params = [] }) => {
          await globalThis.__recordKAIOSRPC(method);
          if (method === "eth_requestAccounts" || method === "eth_accounts")
            return [address];
          if (method === "eth_chainId") return "0x61";
          if (method === "personal_sign")
            return globalThis.__signKAIOSFixture(params[0], params[1]);
          throw new Error("TRANSACTION_RPC_FORBIDDEN:" + method);
        },
      };
    },
    { address: signer.address },
  );
  const walletPage = await walletContext.newPage();
  walletPage.on("pageerror", (e) => errors.push(e.message));
  await walletPage.goto(origin + "/recovery");
  const signupResponse = walletPage.waitForResponse(
    (r) =>
      r.url().endsWith("/account/email/verify") &&
      r.request().method() === "POST",
  );
  await walletPage.locator("#demo").click();
  const accountData = await (await signupResponse).json();
  await walletPage.locator("#dashboard").waitFor({ state: "visible" });
  await walletPage.locator("#walletCode").fill(accountData.recoveryCodes[0]);
  await walletPage.locator("#wallet").click();
  await walletPage.waitForFunction(() =>
    document.querySelector("#message").textContent.includes("已驗證錢包身分"),
  );
  assert.equal(await walletPage.locator("#revision").innerText(), "1");
  assert.ok(rpc.includes("personal_sign"));
  assert.ok(
    rpc.every((method) =>
      [
        "eth_requestAccounts",
        "eth_accounts",
        "eth_chainId",
        "personal_sign",
      ].includes(method),
    ),
  );
  assert.notEqual(
    await walletPage.locator("#identity").innerText(),
    await page.locator("#identity").innerText(),
  );
  await walletPage.screenshot({
    path: new URL("390x844-signed-wallet.png", dir).pathname,
    fullPage: true,
  });
  await walletContext.close();
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("browser-result.json", dir),
    JSON.stringify(
      {
        result: "PASS",
        head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        trackedDirty: Boolean(
          execFileSync(
            "git",
            ["status", "--porcelain", "--untracked-files=no"],
            { encoding: "utf8" },
          ).trim(),
        ),
        checks: [
          "login",
          "backup",
          "hash-verify",
          "local-first-sync",
          "preview-consent",
          "restore",
          "pre-restore-snapshot",
          "game-receipt",
          "cross-device-conflict-preview-restore",
          "export-import-consent",
          "EIP-1193-hex-signature-server-verification",
          "no-transaction-RPC",
        ],
        walletRPC: rpc,
        viewports: results,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
  await context.close();
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
}
