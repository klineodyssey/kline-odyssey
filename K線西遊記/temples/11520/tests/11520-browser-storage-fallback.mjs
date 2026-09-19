import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const OUTPUT = "artifacts/11520-visual-qa";
const BASE_URL = process.env.K11520_BASE_URL || "http://127.0.0.1:4173";
const URL = `${BASE_URL}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/index.html`;
await fs.mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function open11520({ blockIndexedDb = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  if (blockIndexedDb) {
    await page.addInitScript(() => {
      Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: { open: () => ({}) }
      });
    });
  }
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => (
    document.documentElement.dataset.universeStore === "INDEXED_DB"
      || document.documentElement.dataset.universeStore === "MEMORY_FALLBACK"
  ), null, { timeout: 15000 });
  await page.locator("#content .hero").waitFor({ state: "visible", timeout: 15000 });
  assert.deepEqual(errors, [], `11520 portal page errors: ${errors.join("\n")}`);
  return page;
}

const fallbackPage = await open11520({ blockIndexedDb: true });
assert.equal(await fallbackPage.locator("html").getAttribute("data-universe-store"), "MEMORY_FALLBACK");
const status = fallbackPage.locator("#storage-status");
assert.equal(await status.isVisible(), true, "memory fallback must be visible to the player");
assert.equal(await status.getAttribute("data-reason"), "INDEXEDDB_OPEN_TIMEOUT");
assert.match(await status.textContent(), /本機暫存模式/);
assert.match(await status.textContent(), /重新整理後.*資料會重置/);
assert.equal(await fallbackPage.locator("#content .error").count(), 0, "memory fallback must not become a runtime stop");
const fallbackLayout = await fallbackPage.evaluate(() => {
  const element = document.querySelector("#storage-status");
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    viewport: { width: innerWidth, height: innerHeight },
    rect: { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
    overflowX: document.documentElement.scrollWidth - innerWidth,
    display: style.display,
    visibility: style.visibility
  };
});
assert.ok(fallbackLayout.rect.x >= 0 && fallbackLayout.rect.right <= 390, `fallback notice is clipped: ${JSON.stringify(fallbackLayout)}`);
assert.ok(fallbackLayout.rect.width > 0 && fallbackLayout.rect.height >= 40, `fallback notice is not a usable status surface: ${JSON.stringify(fallbackLayout)}`);
assert.ok(fallbackLayout.overflowX <= 1, `fallback state adds horizontal overflow: ${JSON.stringify(fallbackLayout)}`);
await fallbackPage.screenshot({ path: `${OUTPUT}/11520-portal-memory-fallback-390x844.png`, fullPage: true });
await fallbackPage.close();

const durablePage = await open11520();
assert.equal(await durablePage.locator("html").getAttribute("data-universe-store"), "INDEXED_DB");
assert.equal(await durablePage.locator("#storage-status").isVisible(), false, "normal durable startup must not show a fallback warning");
assert.equal(await durablePage.locator("#content .error").count(), 0);
await durablePage.screenshot({ path: `${OUTPUT}/11520-portal-indexeddb-390x844.png`, fullPage: true });
await durablePage.close();

await browser.close();
console.log("11520 IndexedDB timeout, visible memory fallback, durable startup and 390x844 visual QA PASS");
