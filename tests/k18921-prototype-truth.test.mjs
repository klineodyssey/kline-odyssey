import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(process.env.K18921_PAGE || new URL('../K線西遊記/temples/18921/index.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]).filter(Boolean).join('\n');
function boot({ animation = true } = {}) {
  const elements = new Map();
  function element(id = '') {
    return { id, value: '', textContent: '', dataset: {}, attributes: {}, children: [], classList: { contains: () => false },
      setAttribute(key, value) { this.attributes[key] = value; },
      removeAttribute(key) { delete this.attributes[key]; },
      replaceChildren(...children) { this.children = children; this.textContent = ''; },
      appendChild(child) { this.children.push(child); }
    };
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, element(id));
  for (const id of ['lp-energy', 'demon-qi', 'lp-routed', 'lp-tvl', 'lp-tvl-2', 'lp-res-kgen', 'lp-res-bnb', 'apr']) {
    const match = html.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<'));
    if (match) elements.get(id).textContent = match[1];
  }
  const notices = [], animations = [];
  const document = { getElementById: id => elements.get(id) || null, createElement: () => element() };
  const hub = { renderNpc() {}, renderEntryCards() {} };
  if (animation) hub.showDecompositionOverlay = message => animations.push(message);
  const context = vm.createContext({ document, window: { KGEN_TempleHub: hub },
    KGEN_StatusBus: function() { this.push = message => notices.push(message); },
    setInterval() { throw new Error('Observed metrics must not be fabricated by timer'); },
    fetch() { throw new Error('This local practice must not access a network'); }
  });
  vm.runInContext(inline, context);
  return { elements, notices, animations,
    submit(k, b) {
      elements.get('lp-kgen-in').value = k; elements.get('lp-bnb-in').value = b;
      elements.get('forge-form').onsubmit({ preventDefault() {} });
    },
    score: () => Number(elements.get('lp-energy').textContent.replaceAll(',', '')),
    qi: () => elements.get('demon-qi').textContent,
    feedback: () => elements.get('forge-feedback').textContent,
    logs: () => elements.get('lp-log').children
  };
}

test('all non-observed metrics are UNKNOWN with no invented performance or lock date', () => {
  for (const id of ['lp-routed', 'lp-tvl', 'lp-tvl-2', 'lp-res-kgen', 'lp-res-bnb', 'apr']) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*>UNKNOWN<'));
  }
  assert.match(html, /SIMULATION_ONLY/);
  assert.match(html, /source: UNKNOWN/);
  assert.doesNotMatch(html, /Production|2027-01-01|LP Lock 到 2027|720,000|12,500|12\.5%|8\.64 BNB|0xf366…74c6/i);
  assert.doesNotMatch(inline, /Math\.random|setInterval|Mock log|07-04/);
});

test('the existing header destinations are preserved, including bank and 11520', () => {
  const header = html.match(/<header class="kgen-hud">([\s\S]*?)<\/header>/)[1];
  for (const href of ['../../index.html', '../12345/index.html', '../18888/index.html', '../11520/index.html', '../../game/kline-5d/index.html']) {
    assert.ok(header.includes('href="' + href + '"'), 'Missing existing navigation: ' + href);
  }
  assert.doesNotMatch(inline, /hudNav\.innerHTML\s*=/, 'Static navigation must not be replaced with a reduced link set');
});

test('canonical address and missing lock evidence are shown separately', () => {
  assert.match(html, /0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2/);
  for (const field of ['鎖倉數量 / 比例', '起始 / 解鎖時間', 'Locker 地址', '鎖倉交易雜湊']) {
    assert.ok(html.includes(`<td>${field}</td><td>UNKNOWN · VERIFYING</td>`));
  }
  assert.match(html, /REPOSITORY_REFERENCE/);
  assert.match(html, /KGEN_LP_LOCK_PUBLIC_PROOF\.md/);
  assert.doesNotMatch(html, /不做任何 rug pull|只能加，不能移除|Owner 只能路由/);
});

test('token tax and splitter balance proportions have explicit different denominators', () => {
  assert.match(html, /30 bps = 0\.30%/);
  assert.equal((html.match(/<strong>10 bps · 0\.10%<\/strong>/g) || []).length, 2);
  assert.equal((html.match(/<strong>5 bps · 0\.05%<\/strong>/g) || []).length, 2);
  assert.match(html, /分母為應稅交易量/);
  assert.match(html, /分母為 Splitter 的 KGEN 餘額/);
  assert.match(html, /10% AutoLP<br>90% 九妖地址/);
  assert.match(html, /整數捨入餘額留在 Splitter/);
});

test('a valid practice updates only score and qi; it does not fabricate observed metrics', () => {
  const app = boot();
  assert.equal(app.score(), 0);
  app.submit('10', '0.01');
  assert.equal(app.score(), 20); assert.equal(app.qi(), '30%');
  assert.match(app.feedback(), /未鑄造 LP/); assert.equal(app.logs().length, 1);
  for (const id of ['lp-routed', 'lp-tvl', 'lp-tvl-2', 'lp-res-kgen', 'lp-res-bnb', 'apr']) assert.equal(app.elements.get(id).textContent, 'UNKNOWN');
  assert.equal(app.elements.get('lp-kgen-in').value, '');
  assert.equal(app.elements.get('lp-bnb-in').value, '');
});

test('negative, blank, malformed, non-finite and hexadecimal inputs cannot change state', () => {
  for (const [k, b] of [['-1','0'],['0','-1'],['','1'],['1',''],[' ','0'],['abc','0'],['NaN','0'],['Infinity','0'],['1e309','0'],['10junk','0'],['0x10','0']]) {
    const app = boot(); app.submit(k, b);
    assert.equal(app.score(), 0, `${k}/${b}`); assert.equal(app.qi(), '35%'); assert.equal(app.logs().length, 0);
    assert.equal(app.elements.get('forge-feedback').dataset.state, 'error');
  }
});

test('zero and overflow inputs are rejected before state mutation', () => {
  for (const [k, b] of [['0','0'],['1e308','1e308'],['9007199254740992','0'],['1e-400','0']]) {
    const app = boot(); app.submit(k, b);
    assert.equal(app.score(), 0); assert.equal(app.qi(), '35%'); assert.equal(app.logs().length, 0);
  }
});

test('safe-integer boundary displays exactly without a rounded-down success claim', () => {
  const app = boot(); app.submit('9007199254740991','0');
  assert.equal(app.elements.get('lp-energy').textContent, '9,007,199,254,740,991');
  assert.equal(app.score(), Number.MAX_SAFE_INTEGER);
  assert.match(app.feedback(), /9,007,199,254,740,991/);
  app.submit('1','0');
  assert.equal(app.score(), Number.MAX_SAFE_INTEGER);
  assert.equal(app.logs().length, 1);
});

test('invalid attempt after success preserves state and log', () => {
  const app = boot(); app.submit('1','1'); app.submit('-2','2');
  assert.equal(app.score(), 1001); assert.equal(app.qi(), '30%'); assert.equal(app.logs().length, 1);
});

test('empty resubmission does not double-credit and qi never falls below zero', () => {
  const app = boot(); app.submit('1','0');
  app.elements.get('forge-form').onsubmit({ preventDefault() {} });
  assert.equal(app.score(), 1); assert.equal(app.logs().length, 1);
  for (let i = 0; i < 25; i++) app.submit('1','0');
  assert.equal(app.score(), 26); assert.equal(app.qi(), '0%'); assert.equal(app.logs().length, 20);
});

test('accumulation overflow and unrepresentable tiny increments leave state unchanged', () => {
  const app = boot(); app.submit('9007199254740990','0');
  const score = app.score(); const count = app.logs().length;
  app.submit('100','0'); assert.equal(app.score(), score); assert.equal(app.logs().length, count);
  app.submit('0.00000000001','0'); assert.equal(app.score(), score); assert.equal(app.logs().length, count);
});

test('slay reuses the shared overlay without a mint, and reset clears all local progress', () => {
  const app = boot(); app.submit('12','0'); app.elements.get('btn-slay').onclick();
  assert.equal(app.animations.length, 1); assert.equal(app.qi(), '0%'); assert.equal(app.score(), 12);
  app.elements.get('btn-reset').onclick();
  assert.equal(app.score(), 0); assert.equal(app.qi(), '35%'); assert.equal(app.logs().length, 0);
  assert.match(app.elements.get('lp-log').textContent, /source: UNKNOWN/);
  app.submit('1','0'); assert.match(app.logs()[0].textContent, /練習 #1/);
});

test('animation failure is visible and does not pretend success', () => {
  const app = boot({ animation: false }); app.elements.get('btn-slay').onclick();
  assert.equal(app.qi(), '35%'); assert.equal(app.logs().length, 0); assert.match(app.feedback(), /尚未載入/);
});

test('local practice never calls wallets, writes storage, mints or introduces an AMM engine', () => {
  assert.doesNotMatch(inline, /ethereum|eth_send|eth_request|signer|localStorage|sessionStorage|fetch\(|mint\(|addLiquidity\(|swap\(/);
  assert.match(inline, /hub\.showDecompositionOverlay\(/);
  assert.doesNotMatch(html, /<script[^>]*src="[^\"]*(?:auto.?lp|amm|wallet)/i);
  assert.match(html, /for="lp-kgen-in"/); assert.match(html, /for="lp-bnb-in"/);
  assert.match(html, /role="status" aria-live="polite"/);
});
