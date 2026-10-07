import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.resolve(root, process.env.K18921_EVIDENCE || 'evidence/browser');
await mkdir(out, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
    const full = path.resolve(root, relative);
    if (!full.startsWith(root)) { response.writeHead(403).end(); return; }
    const body = await readFile(full);
    response.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript' })[path.extname(full)] || 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const viewport of [{ width:390, height:844 }, { width:844, height:390 }]) {
    const size = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
    const page = await context.newPage();
    const errors = [], outsideRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (route.request().url().startsWith(origin + '/')) return route.continue();
      outsideRequests.push(route.request().url()); return route.abort();
    });
    await page.addInitScript(() => {
      window.__walletCalls = [];
      window.ethereum = { request: args => { window.__walletCalls.push(args); throw new Error('Wallet calls are forbidden'); } };
    });
    await page.goto(`${origin}/${encodeURI('K線西遊記/temples/18921/index.html')}`);
    await page.waitForFunction(() => document.getElementById('kgen-status-text').textContent.includes('SIMULATION_ONLY'));
    await page.screenshot({ path:path.join(out, `${size}-top.png`) });
    await page.screenshot({ path:path.join(out, `${size}-full.png`), fullPage:true });
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
    await page.screenshot({ path:path.join(out, `${size}-invalid.png`) });
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
    await page.screenshot({ path:path.join(out, `${size}-practice.png`) });
    await page.locator('#btn-slay').click();
    await page.waitForFunction(() => document.getElementById('kgen-decomp-overlay')?.classList.contains('active'));
    await page.screenshot({ path:path.join(out, `${size}-animation.png`) });
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
    await page.screenshot({ path:path.join(out, `${size}-reset.png`) });
    await assertTruth();
    assert.deepEqual(errors, []); assert.deepEqual(outsideRequests, []);
    assert.deepEqual(await page.evaluate(() => window.__walletCalls), []);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.locator('#lp-kgen-in').fill('10'); await page.locator('#lp-bnb-in').fill('0'); await page.locator('#btn-forge-lp').click();
    await page.reload();
    assert.equal(await page.locator('#lp-energy').innerText(), '0');
    assert.equal(await page.locator('#demon-qi').innerText(), '35%');
    await assertTruth();
    results.push({ viewport, functional:'PASS', screenshot_review:'PENDING', runtime_errors:errors, external_requests:outsideRequests, wallet_calls:0, overflow:false });
    await context.close();
  }
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ browser:await browser.version(), results }, null, 2));
  console.log(JSON.stringify({ browser:await browser.version(), results }, null, 2));
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
