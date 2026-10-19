import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.resolve(root, process.env.K18921_EVIDENCE || 'evidence/browser');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd:root, encoding:'utf8' }).trim();
assert.match(sourceSha, /^[a-f0-9]{40}$/i, 'Expected an actual checked-out commit');
if (process.env.KAIOS_SOURCE_SHA) assert.equal(sourceSha, process.env.KAIOS_SOURCE_SHA, 'Checkout must match the requested evidence head');
const pagePath = 'K線西遊記/temples/18921/index.html';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const pageBytes = await readFile(path.join(root, pagePath));
const pageSha256 = sha256(pageBytes);
assert.equal(pageSha256, sha256(execFileSync('git', ['show', `${sourceSha}:${pagePath}`], { cwd:root })), 'Served page must match the checked-out commit');
const startedAt = new Date().toISOString();
const servedFiles = new Map();
const captures = [];
await mkdir(out, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
    const full = path.resolve(root, relative);
    if (!full.startsWith(root)) { response.writeHead(403).end(); return; }
    const body = await readFile(full);
    servedFiles.set(relative, { path:relative, sha256:sha256(body), bytes:body.length });
    response.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript' })[path.extname(full)] || 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const launchOptions = { headless:true };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
let browser;
let failure = null;
const results = [];
try {
  browser = await chromium.launch(launchOptions);
  for (const viewport of [{ width:390, height:844 }, { width:844, height:390 }]) {
    const size = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
    const page = await context.newPage();
    const errors = [], outsideRequests = [];
    async function capture(state, options = {}) {
      const file = `${size}-${state}.png`;
      const bytes = await page.screenshot({ ...options, path:path.join(out, file) });
      captures.push({ file, viewport, captured_at:new Date().toISOString(), sha256:sha256(bytes), source_sha:sourceSha, served_page_sha256:pageSha256, screenshot_review:'PENDING' });
    }
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (route.request().url().startsWith(origin + '/')) return route.continue();
      outsideRequests.push(route.request().url()); return route.abort();
    });
    await page.addInitScript(() => {
      window.__walletCalls = [];
      window.ethereum = { request: args => { window.__walletCalls.push(args); throw new Error('Wallet calls are forbidden'); } };
    });
    const response = await page.goto(`${origin}/${encodeURI(pagePath)}`);
    assert.equal(response.status(), 200);
    assert.equal(sha256(await response.body()), pageSha256, 'Browser response must match the checked-out page bytes');
    await page.waitForFunction(() => document.getElementById('kgen-status-text').textContent.includes('SIMULATION_ONLY'));
    await capture('top');
    await capture('full', { fullPage:true });
    async function assertTruth() {
      for (const id of ['lp-routed','lp-tvl','lp-tvl-2','lp-res-kgen','lp-res-bnb','apr']) assert.equal(await page.locator('#'+id).innerText(), 'UNKNOWN');
      const overflow = await page.evaluate(() => ({ doc:document.documentElement.scrollWidth, body:document.body.scrollWidth, width:innerWidth }));
      assert.ok(overflow.doc <= overflow.width + 1 && overflow.body <= overflow.width + 1, JSON.stringify(overflow));
    }
    await assertTruth();
    await page.locator('#lp-kgen-in').fill('-1'); await page.locator('#lp-bnb-in').fill('0');
    await page.locator('#btn-forge-lp').click();
    assert.equal(await page.locator('#lp-energy').innerText(), '0');
    assert.equal(await page.locator('#demon-qi').innerText(), '35%');
    assert.equal(await page.locator('#forge-feedback').getAttribute('data-state'), 'error');
    await page.locator('#forge-form').scrollIntoViewIfNeeded();
    await capture('invalid');
    await page.locator('#lp-kgen-in').fill('10'); await page.locator('#lp-bnb-in').fill('0.01');
    await page.locator('#lp-bnb-in').press('Enter');
    assert.equal(await page.locator('#lp-energy').innerText(), '20');
    assert.equal(await page.locator('#demon-qi').innerText(), '30%');
    assert.equal(await page.locator('#lp-kgen-in').inputValue(), '');
    assert.match(await page.locator('#forge-feedback').innerText(), /未鑄造 LP/);
    await page.locator('#btn-forge-lp').click();
    assert.equal(await page.locator('#lp-energy').innerText(), '20');
    assert.equal(await page.locator('#lp-log .log-entry').count(), 1);
    await page.locator('#lp-kgen-in').fill('0'); await page.locator('#lp-bnb-in').fill('0');
    await page.locator('#btn-forge-lp').click();
    assert.equal(await page.locator('#lp-energy').innerText(), '20');
    await page.locator('#lp-kgen-in').fill('1e308'); await page.locator('#lp-bnb-in').fill('1e308');
    await page.locator('#btn-forge-lp').click();
    assert.equal(await page.locator('#lp-energy').innerText(), '20');
    assert.equal(await page.locator('#forge-feedback').getAttribute('data-state'), 'error');
    await page.locator('#lp-kgen-in').fill('1'); await page.locator('#lp-bnb-in').fill('0');
    await page.locator('#btn-forge-lp').click();
    await page.locator('#forge-panel').scrollIntoViewIfNeeded();
    await capture('practice');
    await page.locator('#btn-slay').click();
    await page.waitForFunction(() => document.getElementById('kgen-decomp-overlay')?.classList.contains('active'));
    await capture('animation');
    assert.equal(await page.locator('#demon-qi').innerText(), '0%');
    await page.waitForFunction(() => !document.getElementById('kgen-decomp-overlay').classList.contains('active'));
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#kgen-decomp-overlay').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    await page.locator('#btn-slay').click();
    await page.waitForFunction(() => !document.getElementById('kgen-decomp-overlay').classList.contains('active'));
    await page.waitForTimeout(350);
    await page.locator('#btn-reset').click();
    assert.equal(await page.locator('#lp-energy').innerText(), '0');
    assert.equal(await page.locator('#demon-qi').innerText(), '35%');
    assert.equal(await page.locator('#lp-log .log-entry').count(), 0);
    await capture('reset');
    await assertTruth();
    assert.deepEqual(errors, []); assert.deepEqual(outsideRequests, []);
    assert.deepEqual(await page.evaluate(() => window.__walletCalls), []);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.locator('#lp-kgen-in').fill('10'); await page.locator('#lp-bnb-in').fill('0'); await page.locator('#btn-forge-lp').click();
    const reloaded = await page.reload();
    assert.equal(sha256(await reloaded.body()), pageSha256, 'Reload must serve the same checked-out bytes');
    assert.equal(await page.locator('#lp-energy').innerText(), '0');
    assert.equal(await page.locator('#demon-qi').innerText(), '35%');
    await assertTruth();
    results.push({ viewport, functional:'PASS', screenshot_review:'PENDING', runtime_errors:errors, external_requests:outsideRequests, wallet_calls:0, overflow:false });
    await context.close();
  }
} catch (error) {
  failure = { name:error.name, message:error.message };
  throw error;
} finally {
  const report = {
    source_sha:sourceSha, requested_source_sha:process.env.KAIOS_SOURCE_SHA || null,
    page_path:pagePath, served_page_sha256:pageSha256,
    started_at:startedAt, completed_at:new Date().toISOString(),
    served_files:[...servedFiles.values()].sort((a, b) => a.path.localeCompare(b.path)),
    browser:browser ? browser.version() : null, functional_qa:failure ? 'FAIL' : 'PASS',
    failure, screenshot_review:'PENDING', captures, results
  };
  await writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
